---
title: "Timers: setTimeout and setInterval"
description: "How Node.js's setTimeout and setInterval compare to time.AfterFunc/Ticker (Go), std::thread (Rust), Task.sleep (Swift), and ScheduledExecutorService (Java)."
tags: [timer, settimeout, setinterval, goroutine]
---

Node.js runs `setTimeout`/`setInterval` callbacks on the event loop, so the program stays alive until the callback queue is empty. For the one-shot version, Go, Rust, and Java all run the callback on a separate thread/goroutine — without something to keep the main thread around (`sync.WaitGroup`, `JoinHandle::join`, `CountDownLatch`), the program can exit before the callback runs — while Swift is the exception: `Task.sleep` runs directly inside the current task, so no separate waiting mechanism is needed. The repeating version is different: Go's `time.Ticker` and Rust's channel don't "run a callback" at all — they send a tick on a channel/queue that the caller has to read itself, and Swift's `AsyncStream` works the same way (it yields ticks for a `for await` loop to read); Java, though, still runs a real callback via `scheduleAtFixedRate`, just like `setInterval`.

## Running something once after a delay (setTimeout / time.AfterFunc)

:::tabs
```js
setTimeout(callback, 1000);

function callback() {
  console.log("called"); // → called (after ~1s)
}
```
```go
package main

import (
	"fmt"
	"sync"
	"time"
)

var wg sync.WaitGroup

func callback() {
	defer wg.Done()
	fmt.Println("called") // → called (after ~1s)
}

func main() {
	wg.Add(1)
	time.AfterFunc(1*time.Second, callback) // callback runs on its own goroutine
	wg.Wait()                               // without the WaitGroup, main would exit before the callback runs
}
```
```rust
use std::thread;
use std::time::Duration;

fn callback() {
    println!("called"); // → called (after ~1s)
}

fn main() {
    let handle = thread::spawn(|| {
        thread::sleep(Duration::from_secs(1));
        callback();
    });
    handle.join().unwrap(); // without join(), main could exit before the thread runs
}
```
```swift
func callback() {
    print("called") // → called (after ~1s)
}

// runs directly in the current task: no separate thread or waiting
// mechanism needed like Go/Rust/Java, since `await` already suspends right
// where it needs to.
try await Task.sleep(for: .seconds(1))
callback()
```
```java
void main() throws InterruptedException {
    var scheduler = Executors.newSingleThreadScheduledExecutor(Thread.ofVirtual().factory());
    var done = new CountDownLatch(1);

    scheduler.schedule(() -> {
        IO.println("called"); // → called (after ~1s)
        done.countDown();
    }, 1, TimeUnit.SECONDS);

    done.await(); // without the CountDownLatch, main would return before the task runs
    scheduler.shutdown();
}
```
:::

:::note
Java 21 added virtual threads (`Thread.ofVirtual()`): much cheaper than platform threads, so they're a good fit for a scheduler's background thread, even though `ScheduledExecutorService` itself has been around for a long time. Swift's `Task.sleep(for:)` (taking a plain `Duration`) is a Swift 5.7 language feature, but on Apple platforms it only runs on macOS 13/iOS 16 or later — the `Clock`/`Duration` runtime behind it wasn't back-deployed to older OS releases.
:::

## Running on a repeating schedule (setInterval / time.Ticker)

:::tabs
```js
let i = 0;

const id = setInterval(callback, 1000);

function callback() {
  console.log("called", i);

  if (i === 3) {
    clearInterval(id);
  }

  i++;
}
// → called 0
// → called 1
// → called 2
// → called 3
```
```go
package main

import (
	"fmt"
	"time"
)

func callback(i int) {
	fmt.Println("called", i)
}

func main() {
	ticker := time.NewTicker(1 * time.Second)

	i := 0
	for range ticker.C {
		callback(i)

		if i == 3 {
			ticker.Stop() // stop the ticker, equivalent to clearInterval
			break
		}

		i++
	}
}
// → called 0
// → called 1
// → called 2
// → called 3
```
```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

// std has no built-in Ticker type: a background thread sending ticks on a
// channel plays that role.
fn callback(i: u32) {
    println!("called {i}");
}

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let mut i = 0;
        loop {
            thread::sleep(Duration::from_secs(1));
            if tx.send(i).is_err() {
                break; // receiver dropped: stop sending ticks
            }
            i += 1;
        }
    });

    for i in rx {
        callback(i);
        if i == 3 {
            break; // dropping rx here stops the sender, ~ clearInterval
        }
    }
}
// → called 0
// → called 1
// → called 2
// → called 3
```
```swift
// AsyncStream plays the role of a Ticker: a background Task yields ticks,
// and cancelling that Task when the stream ends plays the role of clearInterval.
func ticker(interval: Duration) -> AsyncStream<Int> {
    AsyncStream { continuation in
        let task = Task {
            var i = 0
            // Task.isCancelled must be checked at the top of every loop: `try?`
            // swallows CancellationError, so relying on that alone would leave
            // the loop spinning at full speed (a CPU spin) forever after
            // cancellation instead of actually stopping.
            while !Task.isCancelled {
                do {
                    try await Task.sleep(for: interval)
                } catch {
                    break // cancelled while sleeping: stop for good
                }
                continuation.yield(i)
                i += 1
            }
            continuation.finish()
        }
        continuation.onTermination = { _ in task.cancel() } // consumer stops pulling values → cancel the background Task, ~ clearInterval
    }
}

func callback(_ i: Int) {
    print("called \(i)")
}

for await i in ticker(interval: .seconds(1)) {
    callback(i)
    if i == 3 {
        break // breaking triggers onTermination, which cancels the ticker's task and actually stops the background loop
    }
}
// → called 0
// → called 1
// → called 2
// → called 3
```
```java
void main() throws InterruptedException {
    var scheduler = Executors.newSingleThreadScheduledExecutor(Thread.ofVirtual().factory());
    var done = new CountDownLatch(1);
    var i = new AtomicInteger(0);
    var self = new AtomicReference<ScheduledFuture<?>>();

    self.set(scheduler.scheduleAtFixedRate(() -> {
        int n = i.getAndIncrement();
        IO.println("called " + n);
        if (n == 3) {
            self.get().cancel(false); // stop the schedule, equivalent to clearInterval
            done.countDown();
        }
    }, 1, 1, TimeUnit.SECONDS));

    done.await();
    scheduler.shutdown();
}
// → called 0
// → called 1
// → called 2
// → called 3
```
:::

:::note
Java lambdas can't reassign a captured local variable, so the counter `i` needs an `AtomicInteger`, and cancelling the schedule from inside itself (`self.get().cancel()`) needs an `AtomicReference` holding a reference to the very `ScheduledFuture` the lambda is running inside of.
:::
