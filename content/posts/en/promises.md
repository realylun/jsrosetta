---
title: "Promises"
description: "How Node.js's Promise .then()/.catch() and Promise.all() compare to channels (Go), Future (Rust), async/await (Swift), and CompletableFuture (Java)."
tags: [promise, async, channel, goroutine]
---

Node.js has `Promise` built into the language. Go has no equivalent type — the closest thing is using a channel to receive a "settled" value from a goroutine running in the background. Rust and Swift don't have a Promise type either, but they have `async`/`await` to get the same effect (see [async/await](/en/posts/async-await) for a refresher on that syntax). Java has `CompletableFuture` — the closest thing to a Promise among these five languages, chainable with `.thenAccept()`/`.exceptionally()` just like `.then()`/`.catch()`. This post uses Node's classic `.then()`/`.catch()` syntax.

## Creating a promise and handling the result (then/catch)

:::tabs
```js
function asyncMethod(value) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`resolved: ${value}`);
    }, 1000);
  });
}

asyncMethod("foo")
  .then((result) => console.log(result)) // → resolved: foo
  .catch((err) => console.error(err));
```
```go
package main

import (
	"fmt"
	"os"
	"sync"
	"time"
)

// Result stands in for a settled Promise value: a Value on success, an Err
// on rejection.
type Result struct {
	Value string
	Err   error
}

func asyncMethod(value string) <-chan Result {
	ch := make(chan Result, 1)
	go func() {
		time.Sleep(1 * time.Second)
		ch <- Result{Value: "resolved: " + value}
	}()
	return ch
}
```
```rust
// Cargo.toml: tokio = { version = "1", features = ["full"] }
use std::time::Duration;
use tokio::time::sleep;

// Rust's Future is the closest type, but it's lazy: nothing runs until it's
// awaited; Result<T, E> plays the role of resolve/reject.
async fn async_method(value: &str) -> Result<String, String> {
    sleep(Duration::from_secs(1)).await;
    Ok(format!("resolved: {value}"))
}
```
```swift
// Swift has no Promise type; the closest analog is an async function, and
// `throws` plays the role of reject.
func asyncMethod(_ value: String) async throws -> String {
    try await Task.sleep(for: .seconds(1))
    return "resolved: \(value)"
}
```
```java
// CompletableFuture is Java's closest analog to Promise: chain with
// .thenAccept()/.exceptionally() instead of .then()/.catch().
static CompletableFuture<String> asyncMethod(String value) {
    return CompletableFuture.supplyAsync(() -> {
        sleep(1000);
        return "resolved: " + value;
    });
}

static void sleep(long ms) {
    try {
        Thread.sleep(ms);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new RuntimeException(e);
    }
}
```
:::

## Running several promises in parallel (Promise.all)

Reusing `asyncMethod` and `Result` from above (cancelling the remaining tasks when one fails is covered in the [structured concurrency](/en/posts/structured-concurrency) post):

:::tabs
```js
Promise.all([
  asyncMethod("A"),
  asyncMethod("B"),
  asyncMethod("C"),
])
  .then((results) => console.log(results)) // → ['resolved: A', 'resolved: B', 'resolved: C']
  .catch((err) => console.error(err));
```
```go
// all waits for every channel to settle, like Promise.all: it returns the
// values in order, or the first error encountered.
func all(chs ...<-chan Result) ([]string, error) {
	values := make([]string, len(chs))
	errs := make([]error, len(chs))

	var wg sync.WaitGroup
	for i, ch := range chs {
		wg.Go(func() {
			r := <-ch
			values[i] = r.Value
			errs[i] = r.Err
		})
	}
	wg.Wait()

	for _, err := range errs {
		if err != nil {
			return nil, err
		}
	}
	return values, nil
}

func main() {
	foo := asyncMethod("foo") // the channel starts running immediately, like a Promise starts as soon as it's created
	abc := []<-chan Result{asyncMethod("A"), asyncMethod("B"), asyncMethod("C")} // all 3 start running in parallel right away

	if r := <-foo; r.Err != nil { // <-foo: wait for the value, like .then()/.catch()
		fmt.Fprintln(os.Stderr, r.Err)
	} else {
		fmt.Println(r.Value) // → resolved: foo
	}

	values, err := all(abc...)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return
	}
	fmt.Println(values) // → [resolved: A resolved: B resolved: C]
}
```
```rust
#[tokio::main]
async fn main() {
    match async_method("foo").await {
        Ok(result) => println!("{result}"), // → resolved: foo
        Err(err) => eprintln!("{err}"),
    }

    // try_join! (unlike join!) returns as soon as the first future fails,
    // without waiting for the rest to finish — this is what actually
    // matches Promise.all's short-circuiting behavior
    match tokio::try_join!(async_method("A"), async_method("B"), async_method("C")) {
        Ok((a, b, c)) => println!("{:?}", [a, b, c]), // → ["resolved: A", "resolved: B", "resolved: C"]
        Err(err) => eprintln!("{err}"),
    }
}
```
```swift
// all awaits every task and returns values in the original order, like
// Promise.all — TaskGroup finishes tasks out of order, so we re-sort by index.
func all(_ values: [String]) async throws -> [String] {
    try await withThrowingTaskGroup(of: (Int, String).self) { group in
        for (index, value) in values.enumerated() {
            group.addTask { (index, try await asyncMethod(value)) }
        }
        var results = [String](repeating: "", count: values.count)
        for try await (index, result) in group {
            results[index] = result
        }
        return results
    }
}

let foo = try await asyncMethod("foo") // await here plays the role of .then()
print(foo) // → resolved: foo

let results = try await all(["A", "B", "C"])
print(results) // → ["resolved: A", "resolved: B", "resolved: C"]
```
```java
void main() {
    asyncMethod("foo")
            .thenAccept(result -> IO.println(result)) // → resolved: foo
            .join();

    List<CompletableFuture<String>> tasks = Stream.of("A", "B", "C")
            .map(value -> asyncMethod(value))
            .toList();

    CompletableFuture.allOf(tasks.toArray(CompletableFuture[]::new))
            .thenRun(() -> {
                List<String> results = tasks.stream().map(CompletableFuture::join).toList();
                IO.println(results); // → [resolved: A, resolved: B, resolved: C]
            })
            .join();
}
```
:::

:::note
Go 1.25 added `sync.WaitGroup.Go(func())`, replacing the earlier manual `wg.Add(1)` + `go func(){ …; wg.Done() }()` pattern — so a goroutine can no longer be started without a matching `Done()`. Swift's `Task.sleep(for:)` is a Swift 5.7 language feature, but on Apple platforms it only runs on macOS 13/iOS 16 or later.
:::

:::note
`CompletableFuture` has no hidden "microtask queue" like Promise: `.thenAccept()`/`.thenRun()` (no `Async` suffix) run right on whichever thread completes the future, or synchronously on the calling thread if the future is already complete — only the `...Async` variants (`.thenAcceptAsync()`, `.thenRunAsync()`) default to running on `ForkJoinPool.commonPool()`. In the example above, `asyncMethod` itself runs via `supplyAsync` on the `commonPool` (a pool of daemon threads), so if `main()` doesn't call `.join()` to wait, the program can exit before the callback runs — the same reason Go needs a `sync.WaitGroup`.
:::
