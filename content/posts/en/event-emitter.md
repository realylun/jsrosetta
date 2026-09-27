---
title: "Event Emitter"
description: "Node.js's EventEmitter compared to channels and select in Go."
tags: [event-emitter, channel, goroutine, select]
---

Node.js has a built-in `EventEmitter`: register listeners with `.on()`, fire events with `.emit()`. Go has no EventEmitter — the closest thing is a channel combined with a goroutine and `select` to listen on several "event channels" at once.

## EventEmitter (Node.js) vs channel + select (Go)

:::tabs
```js
import { EventEmitter } from 'node:events'

class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter()

myEmitter.on('my-event', msg => {
  console.log(msg)
})

myEmitter.on('my-other-event', msg => {
  console.log(msg)
})

myEmitter.emit('my-event', 'hello world')
myEmitter.emit('my-other-event', 'hello other world')
// hello world
// hello other world
```
```go
package main

import "fmt"

type MyEmitter map[string]chan string

func main() {
	myEmitter := MyEmitter{}
	myEmitter["my-event"] = make(chan string)
	myEmitter["my-other-event"] = make(chan string)
	done := make(chan struct{})

	go func() {
		defer close(done)
		for i := 0; i < 2; i++ {
			select {
			case msg := <-myEmitter["my-event"]:
				fmt.Println(msg)
			case msg := <-myEmitter["my-other-event"]:
				fmt.Println(msg)
			}
		}
	}()

	myEmitter["my-event"] <- "hello world"
	myEmitter["my-other-event"] <- "hello other world"
	<-done // wait for the listener goroutine to finish printing before main returns
	// hello world
	// hello other world
}
```
:::

:::note
Go has no built-in EventEmitter. The closest equivalent is mapping each event name to a channel, then using one goroutine with `select` to listen on several channels at once — `select` plays the role of listeners registered across multiple events.
:::
