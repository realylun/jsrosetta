---
title: "Structured concurrency: Promise.all and errgroup"
description: "How Node.js's Promise.all/allSettled/any combined with AbortController compare to Go's errgroup, sync.WaitGroup, and channels: cancelling sibling tasks when one fails, limiting concurrency, collecting every result, and taking the fastest one."
tags: [concurrency, promise, errgroup, waitgroup, context]
---

"Structured concurrency" is a simple rule: every child task started inside a scope has to finish before that scope ends — no task "leaks" out, and a child's failure is reported back to the parent scope. Node.js ships the `Promise.all`/`allSettled`/`any`/`race` combinators, but they only *wait* — they don't cancel anything: when `Promise.all` rejects because one promise failed, the others keep running to completion. To make sibling tasks stop, you have to pass an `AbortSignal` in yourself (see the [cancellation](/en/posts/cancellation) post). Go has no Promise type; the equivalent patterns are assembled from goroutines, `sync.WaitGroup`, channels, and `context` — with `errgroup` (from `golang.org/x/sync`, outside the standard library) being the closest thing to "Promise.all with cancellation".

## The first error cancels the siblings (Promise.all + AbortController / errgroup)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

// work simulates a job that takes `ms` milliseconds, may fail, and stops
// early when the signal is aborted.
async function work({ name, ms, fail }, signal) {
  await sleep(ms, undefined, { signal });
  if (fail) throw new Error(`${name} failed`);
  return `${name} ok`;
}

// all: like Promise.all, but the first error aborts the sibling tasks, and it
// only returns once EVERY task has actually stopped (like errgroup.Wait). Task i
// records its outcome in statuses[i], like the statuses slice main allocates in Go.
async function all(tasks, statuses) {
  const controller = new AbortController();
  const settled = await Promise.allSettled(
    tasks.map(async (task, i) => {
      try {
        const value = await work(task, controller.signal);
        statuses[i] = "ok";
        return value;
      } catch (err) {
        statuses[i] = err.name === "AbortError" ? "cancelled" : "failed";
        controller.abort(err); // later aborts are no-ops: reason keeps the first error
        throw err;
      }
    }),
  );
  if (controller.signal.aborted) throw controller.signal.reason;
  return settled.map((s) => s.value);
}

const tasks = [
  { name: "A", ms: 100 },
  { name: "B", ms: 50, fail: true }, // B fails at ~50ms, before A and C finish
  { name: "C", ms: 300 },
];
const statuses = new Array(tasks.length);

try {
  await all(tasks, statuses); // waits for EVERY task to stop, then throws the first error
} catch (err) {
  console.log(statuses); // → [ 'cancelled', 'failed', 'cancelled' ]
  console.log("error:", err.message); // → error: B failed
}
```
```go
// needs a go.mod: go mod init example.com/app && go get golang.org/x/sync
package main

import (
	"context"
	"errors"
	"fmt"
	"time"

	"golang.org/x/sync/errgroup"
)

type task struct {
	name string
	d    time.Duration
	fail bool
}

// work simulates a job that takes t.d, may fail, and stops early when ctx is cancelled.
func work(ctx context.Context, t task) (string, error) {
	timer := time.NewTimer(t.d)
	defer timer.Stop()

	select {
	case <-timer.C:
	case <-ctx.Done():
		return "", ctx.Err()
	}
	if t.fail {
		return "", fmt.Errorf("%s failed", t.name)
	}
	return t.name + " ok", nil
}

func main() {
	tasks := []task{
		{name: "A", d: 100 * time.Millisecond},
		{name: "B", d: 50 * time.Millisecond, fail: true}, // B fails at ~50ms, before A and C finish
		{name: "C", d: 300 * time.Millisecond},
	}

	// ctx is cancelled as soon as a goroutine in g returns the first error
	g, ctx := errgroup.WithContext(context.Background())
	statuses := make([]string, len(tasks))

	for i, t := range tasks {
		g.Go(func() error {
			_, err := work(ctx, t)
			switch {
			case errors.Is(err, context.Canceled):
				statuses[i] = "cancelled"
			case err != nil:
				statuses[i] = "failed"
			default:
				statuses[i] = "ok"
			}
			return err
		})
	}

	err := g.Wait()            // wait for EVERY goroutine to stop, then return the first error
	fmt.Println(statuses)      // → [cancelled failed cancelled]
	fmt.Println("error:", err) // → error: B failed
}
```
:::

:::warning
Don't use a bare `Promise.all` here: it rejects as soon as B fails (~50ms) and hands control back to you while A and C are *still running* — even if you abort them, `Promise.all` doesn't wait for them to actually stop. The `all` function above uses `Promise.allSettled` to wait for every task to finish (including any cleanup after being aborted) before throwing the first error — exactly the semantics of `errgroup.Wait()`.
:::

:::note
`errgroup` lives in `golang.org/x/sync`, not the standard library, so the Go example needs a module: `go mod init example.com/app`, then `go get golang.org/x/sync`. The latest `x/sync` release may require a newer Go toolchain than the minimum listed at the top of this post (from v0.23.0 it declares `go 1.26`); on Go 1.25, pin the last release that still declares `go 1.25.0`: `go get golang.org/x/sync@v0.22.0`. Without the pin, `go get` bumps the `go` line in go.mod to 1.26, and with `GOTOOLCHAIN=auto` (the default) silently downloads a Go 1.26 toolchain to build with. `controller.abort(reason)`/`signal.reason` arrived in Node.js 17.2 (also backported to 16.14 on the 16.x line, but 17.0–17.1 lack them, so this post's floor is 17.2).
:::

## Limiting how many tasks run at once (mapLimit / g.SetLimit)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

// mapLimit: runs fn on every item but never more than `limit` at a time —
// Node.js has nothing built in, so build it from `limit` "workers" pulling from one queue.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  let failed = false;

  async function worker() {
    while (!failed && next < items.length) {
      const i = next++; // safe: JS is single-threaded, nothing runs between the read and the increment
      try {
        results[i] = await fn(items[i]);
      } catch (err) {
        failed = true; // other workers see this flag and stop taking new items
        throw err;
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

let inFlight = 0;
let maxInFlight = 0;

const squares = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
  inFlight++;
  maxInFlight = Math.max(maxInFlight, inFlight);
  await sleep(20); // simulate I/O
  inFlight--;
  return n * n;
});

console.log(squares);     // → [ 1, 4, 9, 16, 25, 36 ]
console.log(maxInFlight); // → 2 (at most)
```
```go
// needs a go.mod: go mod init example.com/app && go get golang.org/x/sync
package main

import (
	"fmt"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"
)

func main() {
	items := []int{1, 2, 3, 4, 5, 6}
	squares := make([]int, len(items))

	var mu sync.Mutex
	inFlight, maxInFlight := 0, 0

	var g errgroup.Group // the zero value works when you don't need a ctx
	g.SetLimit(2)        // g.Go blocks until fewer than 2 goroutines are running

	for i, n := range items {
		g.Go(func() error {
			mu.Lock()
			inFlight++
			maxInFlight = max(maxInFlight, inFlight)
			mu.Unlock()

			time.Sleep(20 * time.Millisecond) // simulate I/O

			mu.Lock()
			inFlight--
			mu.Unlock()

			squares[i] = n * n
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		fmt.Println("error:", err)
		return
	}
	fmt.Println(squares)     // → [1 4 9 16 25 36]
	fmt.Println(maxInFlight) // → 2 (at most; a slow machine may show less)
}
```
:::

:::note
In Node.js, `inFlight++` needs no lock because every callback runs on the same thread; in Go, goroutines really do run in parallel, so a shared counter has to be protected with a `sync.Mutex` (or `sync/atomic`). On the other hand, `squares[i] = …` needs no lock in either language: each task only writes to its own slot. Combine `errgroup.WithContext` with `SetLimit` to get both a limit and cancel-on-error. In `mapLimit`, when one job fails, the `failed` flag only stops the other workers from taking new items — jobs already in flight keep running in the background after `mapLimit` has rejected; to stop those too, pass in an `AbortSignal` as in the first section.
:::

## Collecting every result, errors included (Promise.allSettled / WaitGroup + errors.Join)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

async function check(name, ms, fail = false) {
  await sleep(ms);
  if (fail) throw new Error(`${name} unreachable`);
  return `${name} healthy`;
}

// allSettled never rejects: it waits for every promise, even if some fail
const settled = await Promise.allSettled([
  check("db", 50),
  check("cache", 20, true),
  check("queue", 30, true),
]);

for (const s of settled) {
  console.log(s.status, s.status === "fulfilled" ? s.value : s.reason.message);
}
// → fulfilled db healthy
// → rejected cache unreachable
// → rejected queue unreachable
```
```go
package main

import (
	"errors"
	"fmt"
	"sync"
	"time"
)

func check(name string, d time.Duration, fail bool) (string, error) {
	time.Sleep(d)
	if fail {
		return "", fmt.Errorf("%s unreachable", name)
	}
	return name + " healthy", nil
}

func main() {
	type spec struct {
		name string
		d    time.Duration
		fail bool
	}
	specs := []spec{
		{"db", 50 * time.Millisecond, false},
		{"cache", 20 * time.Millisecond, true},
		{"queue", 30 * time.Millisecond, true},
	}

	// each goroutine writes to its own slot: no lock needed, order preserved
	values := make([]string, len(specs))
	errs := make([]error, len(specs))

	var wg sync.WaitGroup
	for i, s := range specs {
		wg.Go(func() {
			values[i], errs[i] = check(s.name, s.d, s.fail)
		})
	}
	wg.Wait() // wait for all of them, cancel nobody — like allSettled

	for i := range specs {
		if errs[i] != nil {
			fmt.Println("rejected", errs[i])
		} else {
			fmt.Println("fulfilled", values[i])
		}
	}

	// errors.Join merges every non-nil error into one (nil if there are none)
	if err := errors.Join(errs...); err != nil {
		fmt.Printf("%q\n", err.Error())
	}
}

// → fulfilled db healthy
// → rejected cache unreachable
// → rejected queue unreachable
// → "cache unreachable\nqueue unreachable"
```
:::

:::note
Go 1.25 added `wg.Go(f)`, replacing the `wg.Add(1)` + `go func() { defer wg.Done(); f() }()` pair; `errors.Join` arrived in Go 1.20, and `errors.Is`/`errors.As` can still find each individual error inside the joined one. `Promise.allSettled` arrived in Node.js 12.9. In both languages the results keep the input order, not the completion order.
:::

## Taking the first success (Promise.any / channel + cancel)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

async function fetchFrom({ name, ms, fail }, signal) {
  await sleep(ms, undefined, { signal });
  if (fail) throw new Error(`${name} down`);
  return `data from ${name}`;
}

async function fastest(mirrors) {
  const controller = new AbortController();
  try {
    // any: take the first SUCCESSFUL result, ignoring failures
    return await Promise.any(mirrors.map((m) => fetchFrom(m, controller.signal)));
  } finally {
    controller.abort(); // cancel the requests still running — Promise.any doesn't do this itself
  }
}

console.log(await fastest([
  { name: "eu", ms: 300 },
  { name: "us", ms: 100 },
  { name: "asia", ms: 50, fail: true }, // fails first, but any ignores it
])); // → data from us

try {
  await fastest([{ name: "eu", ms: 30, fail: true }, { name: "us", ms: 10, fail: true }]);
} catch (err) {
  console.log(err.name, err.errors.map((e) => e.message)); // → AggregateError [ 'eu down', 'us down' ]
}
```
```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"
)

type mirror struct {
	name string
	d    time.Duration
	fail bool
}

func fetchFrom(ctx context.Context, m mirror) (string, error) {
	timer := time.NewTimer(m.d)
	defer timer.Stop()

	select {
	case <-timer.C:
	case <-ctx.Done():
		return "", ctx.Err()
	}
	if m.fail {
		return "", fmt.Errorf("%s down", m.name)
	}
	return "data from " + m.name, nil
}

// fastest returns the first SUCCESSFUL result, like Promise.any; if every
// attempt fails it returns all the errors joined together, like AggregateError.
func fastest(mirrors []mirror) (string, error) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel() // cancel the losing goroutines once there's a winner

	type result struct {
		data string
		err  error
	}
	// buffered with room for every goroutine: losers send and exit instead of
	// blocking forever with nobody receiving (a goroutine leak)
	results := make(chan result, len(mirrors))
	for _, m := range mirrors {
		go func() {
			data, err := fetchFrom(ctx, m)
			results <- result{data, err}
		}()
	}

	errs := make([]error, 0, len(mirrors))
	for range mirrors {
		r := <-results
		if r.err == nil {
			return r.data, nil
		}
		errs = append(errs, r.err)
	}
	return "", errors.Join(errs...)
}

func main() {
	data, err := fastest([]mirror{
		{"eu", 300 * time.Millisecond, false},
		{"us", 100 * time.Millisecond, false},
		{"asia", 50 * time.Millisecond, true}, // fails first, but is ignored
	})
	fmt.Println(data, err) // → data from us <nil>

	_, err = fastest([]mirror{
		{"eu", 30 * time.Millisecond, true},
		{"us", 10 * time.Millisecond, true},
	})
	fmt.Printf("%q\n", err.Error()) // → "us down\neu down" (in the order the errors arrived)
}
```
:::

:::note
`AggregateError.errors` keeps the input order (`eu` before `us`), while the Go version collects errors in the order they arrive on the channel (`us` fails first, so it comes first). `Promise.race` differs from `any` in that it settles with the *first promise to settle*, even if that's a failure — in the first example, `race` would reject with `asia down`. The Go version of `race` is simply taking the first value off the channel, whether `err` is nil or not. Note that both `fastest` functions return as soon as there's a winner without waiting for the losers to actually stop — they're only *told* to cancel.
:::

## Key differences

| | Node.js | Go |
|---|---|---|
| First error rejects immediately (no waiting, no cancelling) | `Promise.all` | no direct equivalent |
| Wait for all, then return the first error | `Promise.allSettled` + rethrow (the `all` function above) | `errgroup.Group.Wait()` |
| First error cancels siblings | `AbortController` passed in by hand | `errgroup.WithContext` |
| Limit concurrent tasks | hand-rolled (or a library like `p-limit`) | `g.SetLimit(n)` |
| Collect every result and error | `Promise.allSettled` | `sync.WaitGroup` + `errors.Join` |
| First success | `Promise.any` → `AggregateError` | buffered channel + `cancel()` → `errors.Join` |
| First to settle | `Promise.race` | first value received from the channel |
