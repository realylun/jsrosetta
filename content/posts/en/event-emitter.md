---
title: "Event Emitter"
description: "Node.js's EventEmitter compared to NotificationCenter (Swift), a hand-rolled callback map (Rust, Java), and channels with select in Go."
tags: [event-emitter, channel, goroutine, select]
---

Node.js has a built-in `EventEmitter`: register listeners with `.on()`, fire events with `.emit()`. Swift has `NotificationCenter` in Foundation — the same idea of event names plus observers, and the closest built-in match to EventEmitter among all five languages. Rust and Java have nothing built in, but hand-rolling a map from event name to a list of callbacks is a few lines of code. Go has no EventEmitter — the closest thing is a channel combined with a goroutine and `select` to listen on several "event channels" at once.

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
```rust
use std::collections::HashMap;

// No built-in EventEmitter: map event names to a list of callbacks.
struct MyEmitter {
    listeners: HashMap<String, Vec<Box<dyn Fn(&str)>>>,
}

impl MyEmitter {
    fn new() -> Self {
        MyEmitter { listeners: HashMap::new() }
    }

    fn on(&mut self, event: &str, listener: impl Fn(&str) + 'static) {
        self.listeners.entry(event.to_string()).or_default().push(Box::new(listener));
    }

    fn emit(&self, event: &str, msg: &str) {
        if let Some(fns) = self.listeners.get(event) {
            for f in fns {
                f(msg);
            }
        }
    }
}

fn main() {
    let mut emitter = MyEmitter::new();

    emitter.on("my-event", |msg| println!("{msg}"));
    emitter.on("my-other-event", |msg| println!("{msg}"));

    emitter.emit("my-event", "hello world");
    emitter.emit("my-other-event", "hello other world");
    // hello world
    // hello other world
}
```
```swift
import Foundation

// NotificationCenter: Foundation's built-in pub/sub, the closest match to EventEmitter.
let myEmitter = NotificationCenter()
let myEvent = Notification.Name("my-event")
let myOtherEvent = Notification.Name("my-other-event")

myEmitter.addObserver(forName: myEvent, object: nil, queue: nil) { note in
    print(note.object as! String)
}
myEmitter.addObserver(forName: myOtherEvent, object: nil, queue: nil) { note in
    print(note.object as! String)
}

myEmitter.post(name: myEvent, object: "hello world")
myEmitter.post(name: myOtherEvent, object: "hello other world")
// hello world
// hello other world
```
```java
static class MyEmitter {
    private final Map<String, List<Consumer<String>>> listeners = new HashMap<>();

    void on(String event, Consumer<String> listener) {
        listeners.computeIfAbsent(event, e -> new ArrayList<>()).add(listener);
    }

    void emit(String event, String msg) {
        listeners.getOrDefault(event, List.of()).forEach(listener -> listener.accept(msg));
    }
}

void main() {
    MyEmitter myEmitter = new MyEmitter();

    myEmitter.on("my-event", msg -> IO.println(msg));
    myEmitter.on("my-other-event", msg -> IO.println(msg));

    myEmitter.emit("my-event", "hello world");
    myEmitter.emit("my-other-event", "hello other world");
    // hello world
    // hello other world
}
```
:::

:::note
Go has no built-in EventEmitter. The closest equivalent is mapping each event name to a channel, then using one goroutine with `select` to listen on several channels at once — `select` plays the role of listeners registered across multiple events. Rust and Java don't have a built-in EventEmitter either — the most common approach is a map from event name to a list of callbacks, basically how Node.js implements `EventEmitter` under the hood. Swift is the exception: Foundation's `NotificationCenter` already does this, naming included (`post`/`addObserver` instead of `emit`/`on`).
:::
