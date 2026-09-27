---
title: "Event Emitter"
description: "EventEmitter của Node.js so với channel kết hợp select trong Go."
date: "2026-09-27"
order: 610
category: oop
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [event-emitter, channel, goroutine, select]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#event-emitter"
---

Node.js có `EventEmitter` built-in: đăng ký listener bằng `.on()`, phát sự kiện bằng `.emit()`. Go không có EventEmitter — thứ gần nhất là dùng channel kết hợp goroutine và `select` để lắng nghe nhiều "kênh sự kiện" cùng lúc.

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
:::

:::note
Go không có EventEmitter dựng sẵn. Cách gần nhất là map mỗi tên sự kiện với một channel, rồi dùng một goroutine với `select` để lắng nghe nhiều channel cùng lúc — `select` đóng vai trò của các listener đăng ký trên nhiều event.
:::
