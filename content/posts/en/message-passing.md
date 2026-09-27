---
title: "Message Passing"
description: "How Node.js's MessageChannel between ports compares to Go's built-in channel for sending data between tasks."
tags: [channel, message-passing, goroutine, concurrency]
---

Instead of letting two concurrent tasks read and write the same shared variable, both languages let you send data back and forth between them. Node.js does this through the `MessageChannel`/`postMessage` API; Go has a whole built-in data type for it — the channel (`chan`) — with its own syntax for sending, receiving, closing, and waiting with a timeout.

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
:::

:::note
A `Worker` talks to its parent the same way — `worker.postMessage()` on one side, `worker.on('message', ...)` on the other. `BroadcastChannel` extends the idea to many listeners at once: anyone who opens a channel with the same name receives every message posted to it, no port pairing needed.
:::

:::note
"Don't communicate by sharing memory; share memory by communicating." — a core Go proverb. A channel hands ownership of a value to the next goroutine instead of letting two goroutines fight over one shared variable.
:::

## Key differences

| | Node.js | Go |
|---|---|---|
| Mechanism | `MessageChannel`/`postMessage` | channel (`chan`) — a built-in language type |
| Capacity limit | unbounded, an internal hidden queue | can set a fixed buffer at creation (`make(chan T, n)`) |
| Waiting with a timeout | hand-rolled with `Promise.race` + `setTimeout` | `select` + `time.After` built right into the syntax |
