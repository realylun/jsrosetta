---
title: "Message Passing"
description: "How Node.js's MessageChannel compares to channels (Go), mpsc (Rust), AsyncStream (Swift), and BlockingQueue (Java) for sending data between tasks."
tags: [channel, message-passing, goroutine, concurrency]
---

Instead of letting two concurrent tasks read and write the same shared variable, all five languages let you send data back and forth between them. Node.js does this through the `MessageChannel`/`postMessage` API. Go and Rust have a built-in channel type (`chan` and `std::sync::mpsc`) with their own syntax for sending, receiving, closing, and waiting with a timeout. Swift has no channel type; `AsyncStream` is the closest thing — an async queue that one side `yield()`s into and the other reads with `for await`, but it doesn't block when full the way a real channel does. Java has `BlockingQueue` (`SynchronousQueue`, `ArrayBlockingQueue`, …) — the closest match to Go's channel among the remaining three languages.

## Sending data between two tasks (MessageChannel vs channel)

:::tabs
```js
import { MessageChannel } from "node:worker_threads";

const { port1, port2 } = new MessageChannel();

port2.on("message", (msg) => {
  console.log("port2 received:", msg); // → port2 received: hello from port1
  port1.close();
  port2.close();
});

port1.postMessage("hello from port1");
```
```go
package main

import (
	"fmt"
	"time"
)

func producer(out chan<- int, n int) {
	for i := 1; i <= n; i++ {
		out <- i
	}
	close(out)
}

func main() {
	// unbuffered: the send blocks until another goroutine receives it
	unbuffered := make(chan string)
	go func() {
		unbuffered <- "hello from an unbuffered channel"
	}()
	fmt.Println(<-unbuffered) // → hello from an unbuffered channel

	// buffered: the send only blocks once the buffer is full
	buffered := make(chan int, 2)
	buffered <- 1
	buffered <- 2
	fmt.Println(<-buffered, <-buffered) // → 1 2

	// producer/consumer: range reads values until the channel is closed
	nums := make(chan int)
	go producer(nums, 3)
	for n := range nums {
		fmt.Println("received", n) // → received 1, received 2, received 3
	}

	// select with a timeout so a stuck receive doesn't hang forever
	result := make(chan string)
	select {
	case msg := <-result:
		fmt.Println(msg)
	case <-time.After(50 * time.Millisecond):
		fmt.Println("timeout: no message after 50ms") // → timeout: no message after 50ms
	}
}
```
```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn producer(out: mpsc::Sender<i32>, n: i32) {
    for i in 1..=n {
        out.send(i).unwrap();
    }
    // `out` is dropped here, closing the channel
}

fn main() {
    // sync_channel(0): rendezvous — the send blocks until another thread receives it
    let (tx, rx) = mpsc::sync_channel::<&str>(0);
    thread::spawn(move || {
        tx.send("hello from an unbuffered channel").unwrap();
    });
    println!("{}", rx.recv().unwrap()); // → hello from an unbuffered channel

    // sync_channel(2): the send only blocks once the buffer is full
    let (tx, rx) = mpsc::sync_channel(2);
    tx.send(1).unwrap();
    tx.send(2).unwrap();
    println!("{} {}", rx.recv().unwrap(), rx.recv().unwrap()); // → 1 2

    // producer/consumer: iterating the receiver yields values until the channel closes
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || producer(tx, 3));
    for n in rx {
        println!("received {n}"); // → received 1, received 2, received 3
    }

    // recv_timeout, so a stuck receive doesn't hang forever — Rust's stand-in for Go's select
    let (_tx, rx) = mpsc::channel::<String>();
    match rx.recv_timeout(Duration::from_millis(50)) {
        Ok(msg) => println!("{msg}"),
        Err(_) => println!("timeout: no message after 50ms"), // → timeout: no message after 50ms
    }
}
```
```swift
// Swift has no channel type; AsyncStream is the closest thing — an async
// queue that one side yields into and the other reads with `for await`.
let messages = AsyncStream<String> { continuation in
    continuation.yield("hello from an AsyncStream")
    continuation.finish() // ends the stream, like closing a channel
}

for await message in messages {
    print(message) // → hello from an AsyncStream
}

// producer/consumer: the consumer's loop ends when the producer calls finish()
func producer(_ continuation: AsyncStream<Int>.Continuation, count: Int) {
    for i in 1...count {
        continuation.yield(i)
    }
    continuation.finish()
}

let numbers = AsyncStream<Int> { continuation in
    Task { producer(continuation, count: 3) }
}

for await n in numbers {
    print("received \(n)") // → received 1, received 2, received 3
}

// receiving with a timeout: race two Tasks with a TaskGroup, since Swift has no `select`
func firstMessage(from stream: AsyncStream<String>, timeout: Duration) async -> String {
    await withTaskGroup(of: String?.self) { group in
        group.addTask {
            var iterator = stream.makeAsyncIterator()
            return await iterator.next()
        }
        group.addTask {
            try? await Task.sleep(for: timeout)
            return nil
        }
        let first = await group.next()! // whichever task finishes first wins
        group.cancelAll()
        return first ?? "timeout: no message after 50ms"
    }
}

let empty = AsyncStream<String> { _ in }
print(await firstMessage(from: empty, timeout: .milliseconds(50))) // → timeout: no message after 50ms
```
```java
void main() throws InterruptedException {
    // SynchronousQueue: put() blocks until another thread take()s the value — Go's unbuffered channel
    var handoff = new SynchronousQueue<String>();
    Thread.ofVirtual().start(() -> {
        try {
            handoff.put("hello from a SynchronousQueue");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    IO.println(handoff.take()); // → hello from a SynchronousQueue

    // ArrayBlockingQueue(n): put() only blocks once the buffer is full — Go's buffered channel
    BlockingQueue<Integer> buffered = new ArrayBlockingQueue<>(2);
    buffered.put(1);
    buffered.put(2);
    IO.println(buffered.take() + " " + buffered.take()); // → 1 2

    // producer/consumer: a sentinel value signals "done", since queues have no close()
    BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(3);
    int done = -1;
    Thread.ofVirtual().start(() -> {
        try {
            for (int i = 1; i <= 3; i++) {
                queue.put(i);
            }
            queue.put(done);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    int n;
    while ((n = queue.take()) != done) {
        IO.println("received " + n); // → received 1, received 2, received 3
    }

    // poll(timeout, unit): returns null instead of blocking forever, like select + time.After
    BlockingQueue<String> empty = new ArrayBlockingQueue<>(1);
    String msg = empty.poll(50, TimeUnit.MILLISECONDS);
    IO.println(msg == null ? "timeout: no message after 50ms" : msg); // → timeout: no message after 50ms
}
```
:::

:::note
A `Worker` talks to its parent the same way — `worker.postMessage()` on one side, `worker.on('message', ...)` on the other. `BroadcastChannel` extends the idea to many listeners at once: anyone who opens a channel with the same name receives every message posted to it, no port pairing needed.
:::

:::note
"Don't communicate by sharing memory; share memory by communicating." — a core Go proverb. A channel hands ownership of a value to the next goroutine instead of letting two goroutines fight over one shared variable. Rust's `mpsc` follows the same philosophy: the type checker even requires sent values to be `Send`.
:::

:::warning
Swift's `AsyncStream.yield()` never blocks: by default it buffers without limit (or drops old elements if you set a policy). This isn't a real backpressure channel like Go's, Rust's, or Java's — it's just the closest async queue Swift has.
:::

## Key differences

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Mechanism | `MessageChannel`/`postMessage` | channel (`chan`) — a built-in type | `std::sync::mpsc` — a built-in type | `AsyncStream` — never blocks on send | `BlockingQueue` (`SynchronousQueue`, …) |
| Capacity limit | unbounded, an internal hidden queue | a fixed buffer set at creation (`make(chan T, n)`) | `sync_channel(n)` for a fixed buffer | no real backpressure | `ArrayBlockingQueue(n)` for a fixed buffer |
| Waiting with a timeout | hand-rolled with `Promise.race` + `setTimeout` | `select` + `time.After` built into the syntax | `recv_timeout(Duration)` | racing with `TaskGroup` + `Task.sleep` | `poll(timeout, unit)` |
