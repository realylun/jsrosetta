---
title: "Event Emitter"
description: "EventEmitter của Node.js so với NotificationCenter (Swift), map callback tự viết (Rust, Java) và channel kết hợp select trong Go."
date: "2026-09-27"
order: 610
category: oop
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "3.0"
  java: "25"
tags: [event-emitter, channel, goroutine, select]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#event-emitter"
---

Node.js có `EventEmitter` built-in: đăng ký listener bằng `.on()`, phát sự kiện bằng `.emit()`. Swift có `NotificationCenter` trong Foundation — cùng ý tưởng tên sự kiện + observer, và là API dựng sẵn gần nhất với EventEmitter trong cả năm ngôn ngữ. Rust và Java không có gì dựng sẵn, nhưng tự viết một map tên-sự-kiện → danh sách callback là chuyện vài dòng. Go không có EventEmitter — thứ gần nhất là dùng channel kết hợp goroutine và `select` để lắng nghe nhiều "kênh sự kiện" cùng lúc.

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
	<-done // đợi goroutine lắng nghe in xong rồi main mới thoát
	// hello world
	// hello other world
}
```
```rust
use std::collections::HashMap;

// Không có EventEmitter dựng sẵn: map tên sự kiện với danh sách callback.
struct MyEmitter {
    listeners: HashMap<String, Vec<Box<dyn Fn(&str)>>>,
}

impl MyEmitter {
    fn new() -> Self {
        MyEmitter { listeners: HashMap::new() }
    }

    fn on(&mut self, event: &str, listener: impl Fn(&str) + 'static) {
        self.listeners.entry(event.to_string()).or_insert_with(Vec::new).push(Box::new(listener));
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

// NotificationCenter: pub/sub dựng sẵn của Foundation, gần nhất với EventEmitter.
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
import java.util.function.Consumer;

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
Go không có EventEmitter dựng sẵn. Cách gần nhất là map mỗi tên sự kiện với một channel, rồi dùng một goroutine với `select` để lắng nghe nhiều channel cùng lúc — `select` đóng vai trò của các listener đăng ký trên nhiều event. Rust và Java cũng không có EventEmitter dựng sẵn — cách phổ biến nhất là map tên sự kiện với danh sách callback, giống hệt cách Node.js cài `EventEmitter` bên dưới. Swift là ngoại lệ: `NotificationCenter` của Foundation đã làm sẵn việc này, kể cả tên (`post`/`addObserver` thay vì `emit`/`on`).
:::
