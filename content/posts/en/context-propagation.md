---
title: "Request Context: AsyncLocalStorage and context.Context"
description: "How Node.js's AsyncLocalStorage carries a request ID along the async chain on its own, compared to Go's context.Context, which you pass explicitly through every function."
tags: [async-local-storage, context, request-id, logging, goroutine]
---

A request flows through a handler, a service, a repository and finally a logger. The logger wants to print the request ID, but nobody wants to add a `requestId` parameter to every function in between. Node.js solves this **implicitly**: `AsyncLocalStorage` (from `node:async_hooks`) attaches a "store" to the running async chain, and that store follows along across `await`, promises and timers — the deepest function just calls `getStore()`. Go deliberately has **no** goroutine-local storage: goroutines have no public ID and no "belongs to this goroutine" variables. Instead, `context.Context` carries request-scoped values **explicitly** — every function that needs it takes `ctx` as its first parameter. Implicit is terser; explicit means the function signature tells you which code depends on the context.

## Attaching a value to a request and reading it deep down (run/getStore vs WithValue/Value)

:::tabs
```js
import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage();

// The deepest-level logger: it does not take requestId as a parameter.
function log(message) {
  const store = requestContext.getStore(); // undefined outside of run()
  console.log(`[${store?.requestId ?? "-"}] ${message}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadUser(id) {
  await sleep(10);
  log(`loaded user ${id}`);
  return { id };
}

function handleRequest(requestId, userId) {
  // Everything inside the callback, even after await, sees the same store.
  return requestContext.run({ requestId }, async () => {
    log("start");
    await loadUser(userId);
    log("done");
  });
}

// Two requests interleave but never mix up their requestId.
await Promise.all([handleRequest("req-1", 1), handleRequest("req-2", 2)]);
log("outside");
// → [req-1] start
// → [req-2] start
// → [req-1] loaded user 1
// → [req-1] done
// → [req-2] loaded user 2
// → [req-2] done
// → [-] outside
```
```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// Unexported key type: no other package can create a colliding key.
type requestIDKey struct{}

func withRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, requestIDKey{}, id) // returns a new ctx; the old one is unchanged
}

// Even the deepest-level logger has to take ctx as a parameter.
func log(ctx context.Context, message string) {
	id, ok := ctx.Value(requestIDKey{}).(string) // Value returns any: needs a type assertion
	if !ok {
		id = "-"
	}
	fmt.Printf("[%s] %s\n", id, message)
}

func loadUser(ctx context.Context, id int) {
	time.Sleep(10 * time.Millisecond)
	log(ctx, fmt.Sprintf("loaded user %d", id))
}

func handleRequest(ctx context.Context, requestID string, userID int) {
	ctx = withRequestID(ctx, requestID)
	log(ctx, "start")
	loadUser(ctx, userID) // by convention, ctx is always the first parameter
	log(ctx, "done")
}

func main() {
	ctx := context.Background()

	var wg sync.WaitGroup
	wg.Go(func() { handleRequest(ctx, "req-1", 1) })
	wg.Go(func() { handleRequest(ctx, "req-2", 2) })
	wg.Wait()

	log(ctx, "outside")
}

// → [req-1] start
// → [req-2] start
// → [req-1] loaded user 1
// → [req-1] done
// → [req-2] loaded user 2
// → [req-2] done
// → [-] outside
// (the order between req-1 and req-2 can change from run to run)
```
:::

:::note
`run(store, fn)` calls `fn` right away with `store` as the context and returns whatever `fn` returns (a promise here, so you can `await` it). Outside `run()`, `getStore()` goes back to `undefined`. In Go, `context.WithValue` doesn't modify the old `ctx`; it creates a child context that points to its parent. `ctx.Value(key)` walks up the parent chain until it finds the key, so the result is always `any` and needs a `.(string)` type assertion.
:::

:::tip
The Go docs say a key should **not** be a `string` or any other built-in type, so that two packages can't accidentally share a key; the usual pattern is an unexported `struct{}` type like `requestIDKey` above. The same docs say to use context values only for request-scoped data (request IDs, auth info, trace spans…), **not** for passing optional parameters to functions. And don't store a `Context` in a struct — pass it as the first parameter, usually named `ctx`.
:::

## Context across timers, promises, and goroutines

The clearest difference: a callback *scheduled* inside `run()` carries the store, even though `run()` returned long before the callback runs. A new goroutine in Go inherits nothing — it only has what you pass in.

:::tabs
```js
import { AsyncLocalStorage } from "node:async_hooks";
import { EventEmitter } from "node:events";

const requestContext = new AsyncLocalStorage();
const currentId = () => requestContext.getStore()?.requestId ?? "-";

requestContext.run({ requestId: "req-1" }, () => {
  // Callbacks scheduled inside run() carry the store, even though they run after run() has returned.
  setTimeout(() => console.log("timeout:", currentId()), 10);
  Promise.resolve().then(() => console.log("then:", currentId()));
});

// Scheduled outside run(): no store.
setTimeout(() => console.log("outside:", currentId()), 20);

// EventEmitter listeners run in the context of emit(), not of on().
const emitter = new EventEmitter();
requestContext.run({ requestId: "req-1" }, () => {
  emitter.on("job", () => console.log("listener:", currentId()));
});
requestContext.run({ requestId: "req-2" }, () => emitter.emit("job"));
// → listener: req-2
// → then: req-1
// → timeout: req-1
// → outside: -
```
```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type requestIDKey struct{}

func requestID(ctx context.Context) string {
	if id, ok := ctx.Value(requestIDKey{}).(string); ok {
		return id
	}
	return "-"
}

// A goroutine inherits nothing from the goroutine that started it:
// to see the request ID it must receive ctx as a parameter.
func worker(ctx context.Context, name string) {
	fmt.Printf("%s: %s\n", name, requestID(ctx))
}

func main() {
	ctx := context.WithValue(context.Background(), requestIDKey{}, "req-1")

	var wg sync.WaitGroup
	wg.Go(func() { worker(ctx, "goroutine") })                   // pass ctx explicitly
	wg.Go(func() { worker(context.Background(), "forgot ctx") }) // forgot to pass it: request ID lost
	wg.Wait()

	// Same for time.AfterFunc: the callback only sees ctx if the closure captures it.
	done := make(chan struct{})
	time.AfterFunc(10*time.Millisecond, func() {
		worker(ctx, "timer")
		close(done)
	})
	<-done
}

// → goroutine: req-1
// → forgot ctx: -
// → timer: req-1
// (the first two lines may swap places)
```
:::

:::warning
The store is "captured" when an async operation is **created** — `setTimeout`, `.then`, `await`… — and that operation's callback later runs with the captured store. `EventEmitter` is the usual surprise: `on()` just adds a function to a list and creates no async operation, so nothing is captured; listeners run synchronously inside `emit()` and see the store of whoever called `emit()` (`req-2` here), not the store at the time of `on()`. To "freeze" the context at registration time, wrap the callback with `AsyncLocalStorage.bind(fn)` (available since Node.js 18.16).
:::

## The store is a mutable object (collecting per-request data)

The store is just an ordinary JavaScript value. If it's an object, every function in the same async chain can mutate it, and the caller of `run()` sees the changes afterwards. Go contexts are immutable: to collect data, put a pointer in the context and handle synchronization yourself when several goroutines write to it.

:::tabs
```js
import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function query(sql) {
  requestContext.getStore().queries.push(sql); // the store is a plain object: mutate it directly
  await sleep(1);
}

async function handleRequest() {
  await query("SELECT * FROM users");
  await Promise.all([query("SELECT * FROM orders"), query("SELECT * FROM items")]);
}

const store = { requestId: "req-1", queries: [] };
await requestContext.run(store, handleRequest);

// Changes made inside are visible outside, since it is the same object.
console.log(`${store.requestId} ran ${store.queries.length} queries`);
// → req-1 ran 3 queries
```
```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// Context values cannot be modified (WithValue always creates a new ctx),
// so to collect per-request data, store a pointer.
type queryLog struct {
	mu      sync.Mutex // goroutines of the same request may write concurrently
	queries []string
}

type queryLogKey struct{}

func query(ctx context.Context, sql string) {
	ql := ctx.Value(queryLogKey{}).(*queryLog) // panics if missing: use the `v, ok :=` form if unsure
	ql.mu.Lock()
	ql.queries = append(ql.queries, sql)
	ql.mu.Unlock()
	time.Sleep(time.Millisecond)
}

func handleRequest(ctx context.Context) {
	query(ctx, "SELECT * FROM users")

	var wg sync.WaitGroup
	wg.Go(func() { query(ctx, "SELECT * FROM orders") })
	wg.Go(func() { query(ctx, "SELECT * FROM items") })
	wg.Wait()
}

func main() {
	ql := &queryLog{}
	ctx := context.WithValue(context.Background(), queryLogKey{}, ql)
	handleRequest(ctx)

	fmt.Printf("req-1 ran %d queries\n", len(ql.queries)) // → req-1 ran 3 queries
}
```
:::

:::note
Node.js also has `asyncLocalStorage.enterWith(store)`, which sets the store for the rest of the current synchronous execution without a callback. The Node.js docs recommend `run()` over `enterWith()` unless there is a strong reason, because the context leaks further than intended — for example, if the first listener of an event calls `enterWith()`, the following listeners run inside that store too. Since Node.js 24, `AsyncLocalStorage` is built on `AsyncContextFrame` by default instead of async hooks, but the API and the output of the examples above are unchanged.
:::

:::note
`AsyncLocalStorage` was added in Node.js 13.10.0 / 12.17.0 and marked stable in 16.4.0. The 14.13.1 minimum here comes from the examples being ES modules that use top-level `await` (14.8) and `node:` imports (14.13.1). On the Go side, the `context` package dates back to 1.7; the examples need Go 1.25 only because they use `sync.WaitGroup.Go`.
:::

## Key differences

| | Node.js | Go |
|---|---|---|
| How it's passed | implicitly, along the async chain | explicitly, `ctx` as the first parameter |
| Attaching and reading a value | `als.run(store, fn)` / `als.getStore()` | `context.WithValue(ctx, key, v)` / `ctx.Value(key)` |
| Across timers, promises / goroutines | follows `setTimeout`, `.then`, `await` automatically | doesn't follow on its own: pass `ctx` into the goroutine or closure |
| Changing the value | the store is a plain object, mutable in place | immutable: `WithValue` returns a new ctx; to collect data, store a pointer + a lock |
| Typing | the store is any JS value | `Value` returns `any`, so a type assertion is needed (`v, ok := …(string)`) |
