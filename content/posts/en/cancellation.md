---
title: "Cancellation: AbortController and context"
description: "How Node.js's AbortController/AbortSignal compares to Go's context.Context: cancelling manually, timeouts, combining cancellation signals, and checking for cancellation inside a loop."
tags: [cancellation, abortcontroller, context, timeout]
---

Once a promise is running there's no way to "stop" it from the outside — Node.js solves this with a signal that travels alongside it: `AbortController` creates an `AbortSignal`, whoever wants to cancel calls `controller.abort()`, and the function that received the `signal` listens for it and stops early. Go's `context.Context` plays exactly that role: `ctx.Done()` is a channel that gets closed when the context is cancelled, and `ctx.Err()` tells you why. Both are *cooperative*: nothing gets forcibly killed — the running code has to check the signal and stop itself. The biggest difference is how it propagates: a Go context is passed explicitly as the first parameter down the whole call tree, and every child context is cancelled automatically when its parent is; an `AbortSignal` is a standalone object, and combining several of them takes `AbortSignal.any()`.

## Cancelling manually (abort / cancel)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

const controller = new AbortController();
const { signal } = controller;

signal.addEventListener("abort", () => {
  console.log("abort event:", signal.reason.message); // → abort event: user cancelled
}, { once: true });

// cancel after 100ms, while the work needs a full second
setTimeout(() => controller.abort(new Error("user cancelled")), 100);

try {
  await sleep(1000, "done", { signal });
} catch (err) {
  console.log(err.name);          // → AbortError
  console.log(err.cause.message); // → user cancelled
}

console.log(signal.aborted);        // → true
console.log(signal.reason.message); // → user cancelled
```
```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"
)

// sleep waits for d, or returns early when ctx is cancelled — like
// setTimeout from node:timers/promises with { signal }.
func sleep(ctx context.Context, d time.Duration) error {
	timer := time.NewTimer(d)
	defer timer.Stop()

	select {
	case <-timer.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func main() {
	ctx, cancel := context.WithCancelCause(context.Background())
	defer cancel(nil) // always call cancel to release the context's resources

	// cancel after 100ms, while the work needs a full second
	time.AfterFunc(100*time.Millisecond, func() {
		cancel(errors.New("user cancelled"))
	})

	if err := sleep(ctx, 1*time.Second); err != nil {
		fmt.Println(err)                              // → context canceled
		fmt.Println(errors.Is(err, context.Canceled)) // → true
		fmt.Println(context.Cause(ctx))               // → user cancelled
	}
}
```
:::

:::note
`controller.abort(reason)` and `signal.reason` arrived in Node.js 17.2; calling `abort()` with no argument makes `reason` a `DOMException` named `AbortError`. In Go, `ctx.Err()` only ever has two fixed values (`context.Canceled` or `context.DeadlineExceeded`); the specific reason lives separately in `context.Cause(ctx)`, which comes with `WithCancelCause` in Go 1.20. Listening for the `"abort"` event maps to `context.AfterFunc(ctx, f)` in Go (Go 1.21), or to a goroutine waiting on `<-ctx.Done()`.
:::

:::warning
Node.js APIs aren't consistent about the error they throw on abort: `setTimeout` from `node:timers/promises` and `events.once()` reject with an `AbortError` that *wraps* the real reason in `err.cause` (as above), while `fetch()` rejects with `signal.reason` *itself* — with `abort(new Error("user cancelled"))`, `fetch` throws that exact `Error`. Reading `signal.reason` is the reliable way to find out why something was cancelled.
:::

## Timeouts (AbortSignal.timeout / context.WithTimeout)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

const signal = AbortSignal.timeout(100); // aborts itself after 100ms

try {
  await sleep(1000, "done", { signal });
} catch (err) {
  console.log(err.name);           // → AbortError
  console.log(err.cause.name);     // → TimeoutError
  console.log(signal.reason.name); // → TimeoutError
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

func sleep(ctx context.Context, d time.Duration) error {
	timer := time.NewTimer(d)
	defer timer.Stop()

	select {
	case <-timer.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond) // cancels itself after 100ms
	defer cancel()

	err := sleep(ctx, 1*time.Second)
	fmt.Println(err)                                      // → context deadline exceeded
	fmt.Println(errors.Is(err, context.DeadlineExceeded)) // → true
	fmt.Println(errors.Is(err, context.Canceled))         // → false
}
```
:::

:::warning
The reason of an `AbortSignal.timeout()` is a `DOMException` named **`TimeoutError`**, not `AbortError` — code that only checks `err.name === "AbortError"` will miss timeouts from `fetch(url, { signal: AbortSignal.timeout(5000) })`, because `fetch` throws the `TimeoutError` directly. Go draws the same line: `context.DeadlineExceeded` is distinct from `context.Canceled`. Also, the timer behind `AbortSignal.timeout()` doesn't keep the event loop alive: if nothing else is pending, the process simply exits and the signal never aborts.
:::

:::note
`AbortSignal.timeout()` arrived in Node.js 17.3 (backported to 16.14). Go also has `context.WithTimeoutCause` (Go 1.21) if you want `context.Cause` to return your own error instead of `context.DeadlineExceeded`.
:::

## Combining cancellation signals (AbortSignal.any / child contexts)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

async function download(userDelay) {
  const user = new AbortController();
  // abort when the user cancels OR after 200ms, whichever comes first
  const signal = AbortSignal.any([user.signal, AbortSignal.timeout(200)]);

  const timer = setTimeout(() => user.abort(new Error("user cancelled")), userDelay);
  try {
    return await sleep(1000, "done", { signal });
  } catch {
    return `aborted: ${signal.reason.name}: ${signal.reason.message}`;
  } finally {
    clearTimeout(timer);
  }
}

console.log(await download(50));  // → aborted: Error: user cancelled
console.log(await download(500)); // → aborted: TimeoutError: The operation was aborted due to timeout
```
```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"
)

func sleep(ctx context.Context, d time.Duration) error {
	timer := time.NewTimer(d)
	defer timer.Stop()

	select {
	case <-timer.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func download(userDelay time.Duration) string {
	user, cancelUser := context.WithCancelCause(context.Background())
	defer cancelUser(nil)

	// child context: cancelled when its parent (user) is cancelled OR after 200ms
	ctx, cancel := context.WithTimeout(user, 200*time.Millisecond)
	defer cancel()

	timer := time.AfterFunc(userDelay, func() { cancelUser(errors.New("user cancelled")) })
	defer timer.Stop()

	if err := sleep(ctx, 1*time.Second); err != nil {
		return fmt.Sprint("aborted: ", context.Cause(ctx))
	}
	return "done"
}

func main() {
	fmt.Println(download(50 * time.Millisecond))  // → aborted: user cancelled
	fmt.Println(download(500 * time.Millisecond)) // → aborted: context deadline exceeded

	// two contexts with NO parent-child relationship (e.g. server shutdown
	// and a single request): link them with context.AfterFunc
	shutdown, stopServer := context.WithCancelCause(context.Background())
	request, cancelRequest := context.WithCancelCause(context.Background())
	defer cancelRequest(nil)

	stop := context.AfterFunc(shutdown, func() {
		cancelRequest(context.Cause(shutdown))
	})
	defer stop()

	stopServer(errors.New("server shutting down"))
	<-request.Done()
	fmt.Println(context.Cause(request)) // → server shutting down
}
```
:::

:::note
`AbortSignal.any()` arrived in Node.js 20.3 and was also backported to 18.17 on the 18.x line; but 19.x never got it, so this post's minimum is 20.3. In Go, "combining" usually doesn't need a dedicated function: every `context.WithCancel`/`WithTimeout` takes a parent context, and the child is cancelled automatically when the parent is — a single `cancel()` at the root cancels the whole call tree. Only when two contexts have no parent-child relationship do you link them by hand with `context.AfterFunc` (Go 1.21), as at the end of the example.
:::

## Checking for cancellation inside a loop (throwIfAborted / ctx.Err)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

async function processItems(items, signal) {
  for (const item of items) {
    signal.throwIfAborted(); // throws signal.reason if already aborted
    await sleep(50);         // simulate processing one item
    console.log("processed", item);
  }
}

try {
  await processItems([1, 2, 3, 4, 5], AbortSignal.timeout(125));
} catch (err) {
  console.log("stopped:", err.name);
}
// → processed 1
// → processed 2
// → processed 3
// → stopped: TimeoutError
```
```go
package main

import (
	"context"
	"fmt"
	"time"
)

func processItems(ctx context.Context, items []int) error {
	for _, item := range items {
		if err := ctx.Err(); err != nil { // non-nil once ctx is cancelled, ~ throwIfAborted()
			return err
		}
		time.Sleep(50 * time.Millisecond) // simulate processing one item
		fmt.Println("processed", item)
	}
	return nil
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 125*time.Millisecond)
	defer cancel()

	if err := processItems(ctx, []int{1, 2, 3, 4, 5}); err != nil {
		fmt.Println("stopped:", err)
	}
}

// → processed 1
// → processed 2
// → processed 3
// → stopped: context deadline exceeded
```
:::

:::note
How many items get processed depends on wall-clock time: the 125ms timeout lands between the 3rd check (~100ms) and the 4th (~150ms), so you'll normally see 3 `processed` lines. `signal.throwIfAborted()` arrived in Node.js 17.3 and throws `signal.reason` as is (a `TimeoutError` here). Checking at the top of each iteration is enough when every step is short; if a single step can wait for a long time, pass the `signal`/`ctx` down into that step too (like `sleep` in the earlier sections) so it can stop midway.
:::

:::tip
Go's convention: `ctx context.Context` is always the first parameter, and contexts aren't stored in structs. Node.js has no hard rule, but the standard APIs (`fetch`, `node:timers/promises`, `events.once`, `stream.pipeline`, `child_process.exec`…) all take `{ signal }` in their options object — following the same shape lets your functions compose with them.
:::

## Key differences

| | Node.js | Go |
|---|---|---|
| Create a cancellation signal | `new AbortController()` | `context.WithCancel` / `WithCancelCause` |
| Cancel | `controller.abort(reason)` | `cancel()` / `cancel(cause)` |
| Timeout | `AbortSignal.timeout(ms)` | `context.WithTimeout(parent, d)` |
| Why it was cancelled | `signal.reason` | `ctx.Err()` + `context.Cause(ctx)` |
| Check inside a loop | `signal.throwIfAborted()` | `ctx.Err() != nil` |
| Combine signals | `AbortSignal.any([...])` | child contexts (parent cancelled → child cancelled), `context.AfterFunc` |
| Propagation | pass `{ signal }` where needed | pass `ctx` as the first parameter through the whole call tree |
