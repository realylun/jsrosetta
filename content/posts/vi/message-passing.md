---
title: "Message Passing"
description: "MessageChannel giữa các port của Node.js so với channel có sẵn trong Go để gửi dữ liệu giữa các tác vụ."
date: "2026-09-27"
order: 750
category: async
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [channel, message-passing, goroutine, concurrency]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#message-passing"
---

Thay vì để hai tác vụ chạy song song cùng đọc/ghi một biến chung, cả hai ngôn ngữ đều cho phép gửi dữ liệu qua lại giữa chúng. Node.js làm việc này qua API `MessageChannel`/`postMessage`; Go có hẳn một kiểu dữ liệu built-in cho việc đó — channel (`chan`) — với cú pháp riêng để gửi, nhận, đóng và chờ có timeout.

## Gửi dữ liệu giữa hai tác vụ (MessageChannel vs channel)

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
	// unbuffered: lệnh gửi bị block cho tới khi có goroutine khác nhận
	unbuffered := make(chan string)
	go func() {
		unbuffered <- "hello from an unbuffered channel"
	}()
	fmt.Println(<-unbuffered) // → hello from an unbuffered channel

	// buffered: lệnh gửi chỉ bị block khi buffer đã đầy
	buffered := make(chan int, 2)
	buffered <- 1
	buffered <- 2
	fmt.Println(<-buffered, <-buffered) // → 1 2

	// producer/consumer: range đọc giá trị cho tới khi channel đóng
	nums := make(chan int)
	go producer(nums, 3)
	for n := range nums {
		fmt.Println("received", n) // → received 1, received 2, received 3
	}

	// select kèm timeout, để một lệnh nhận bị kẹt không treo mãi
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
Một `Worker` giao tiếp với luồng cha (main thread) theo cách tương tự — `worker.postMessage()` ở một phía, `worker.on('message', ...)` ở phía kia. `BroadcastChannel` mở rộng ý tưởng này cho nhiều listener cùng lúc: bất kỳ ai mở channel cùng tên đều nhận được mọi message gửi tới, không cần ghép cặp port.
:::

:::note
"Don't communicate by sharing memory; share memory by communicating" — một câu châm ngôn cốt lõi của Go. Channel trao quyền sở hữu một giá trị cho goroutine tiếp theo, thay vì để hai goroutine tranh giành một biến dùng chung.
:::

## Khác biệt chính

| | Node.js | Go |
|---|---|---|
| Cơ chế | `MessageChannel`/`postMessage` | channel (`chan`) — kiểu built-in của ngôn ngữ |
| Giới hạn dung lượng | không giới hạn, hàng đợi ẩn bên trong | có thể đặt buffer cố định lúc tạo (`make(chan T, n)`) |
| Chờ có timeout | tự viết bằng `Promise.race` + `setTimeout` | `select` + `time.After` ngay trong cú pháp ngôn ngữ |
