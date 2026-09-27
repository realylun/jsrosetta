---
title: "Message Passing"
description: "MessageChannel của Node.js so với channel (Go), mpsc (Rust), AsyncStream (Swift) và BlockingQueue (Java) để gửi dữ liệu giữa các tác vụ."
date: "2026-09-27"
order: 750
category: async
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "5.9"
  java: "25"
tags: [channel, message-passing, goroutine, concurrency]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#message-passing"
---

Thay vì để hai tác vụ chạy song song cùng đọc/ghi một biến chung, cả năm ngôn ngữ đều cho phép gửi dữ liệu qua lại giữa chúng. Node.js làm việc này qua API `MessageChannel`/`postMessage`. Go và Rust có sẵn kiểu channel built-in (`chan` và `std::sync::mpsc`) với cú pháp riêng để gửi, nhận, đóng và chờ có timeout. Swift không có kiểu channel; `AsyncStream` là thứ gần nhất — một hàng đợi bất đồng bộ mà một phía `yield()` vào, phía kia đọc bằng `for await`, nhưng nó không có tính "block khi đầy" như channel thật. Java có `BlockingQueue` (`SynchronousQueue`, `ArrayBlockingQueue`…) — cách gần với channel của Go nhất trong ba ngôn ngữ còn lại.

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
```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn producer(out: mpsc::Sender<i32>, n: i32) {
    for i in 1..=n {
        out.send(i).unwrap();
    }
    // `out` bị drop ở đây, đóng channel
}

fn main() {
    // sync_channel(0): rendezvous — lệnh gửi bị block cho tới khi thread khác nhận
    let (tx, rx) = mpsc::sync_channel::<&str>(0);
    thread::spawn(move || {
        tx.send("hello from an unbuffered channel").unwrap();
    });
    println!("{}", rx.recv().unwrap()); // → hello from an unbuffered channel

    // sync_channel(2): lệnh gửi chỉ bị block khi buffer đã đầy
    let (tx, rx) = mpsc::sync_channel(2);
    tx.send(1).unwrap();
    tx.send(2).unwrap();
    println!("{} {}", rx.recv().unwrap(), rx.recv().unwrap()); // → 1 2

    // producer/consumer: duyệt Receiver trả giá trị cho tới khi channel đóng
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || producer(tx, 3));
    for n in rx {
        println!("received {n}"); // → received 1, received 2, received 3
    }

    // recv_timeout: để một lệnh nhận bị kẹt không treo mãi, thay cho select của Go
    let (_tx, rx) = mpsc::channel::<String>();
    match rx.recv_timeout(Duration::from_millis(50)) {
        Ok(msg) => println!("{msg}"),
        Err(_) => println!("timeout: no message after 50ms"), // → timeout: no message after 50ms
    }
}
```
```swift
// Swift không có kiểu channel; AsyncStream là thứ gần nhất — một hàng đợi
// bất đồng bộ mà một phía yield() vào, phía kia đọc bằng `for await`.
let messages = AsyncStream<String> { continuation in
    continuation.yield("hello from an AsyncStream")
    continuation.finish() // kết thúc stream, giống đóng channel
}

for await message in messages {
    print(message) // → hello from an AsyncStream
}

// producer/consumer: vòng lặp consumer kết thúc khi producer gọi finish()
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

// nhận có timeout: đua hai Task bằng TaskGroup, vì Swift không có `select`
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
        let first = await group.next()! // task nào xong trước thắng
        group.cancelAll()
        return first ?? "timeout: no message after 50ms"
    }
}

let empty = AsyncStream<String> { _ in }
print(await firstMessage(from: empty, timeout: .milliseconds(50))) // → timeout: no message after 50ms
```
```java
void main() throws InterruptedException {
    // SynchronousQueue: put() bị block cho tới khi có thread khác take() — giống channel không buffer của Go
    var handoff = new SynchronousQueue<String>();
    Thread.ofVirtual().start(() -> {
        try {
            handoff.put("hello from a SynchronousQueue");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
    IO.println(handoff.take()); // → hello from a SynchronousQueue

    // ArrayBlockingQueue(n): put() chỉ bị block khi buffer đã đầy — giống channel có buffer của Go
    BlockingQueue<Integer> buffered = new ArrayBlockingQueue<>(2);
    buffered.put(1);
    buffered.put(2);
    IO.println(buffered.take() + " " + buffered.take()); // → 1 2

    // producer/consumer: dùng một giá trị sentinel báo "hết", vì queue không có close()
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

    // poll(timeout, unit): trả về null thay vì block mãi, giống select + time.After
    BlockingQueue<String> empty = new ArrayBlockingQueue<>(1);
    String msg = empty.poll(50, TimeUnit.MILLISECONDS);
    IO.println(msg == null ? "timeout: no message after 50ms" : msg); // → timeout: no message after 50ms
}
```
:::

:::note
Một `Worker` giao tiếp với luồng cha (main thread) theo cách tương tự — `worker.postMessage()` ở một phía, `worker.on('message', ...)` ở phía kia. `BroadcastChannel` mở rộng ý tưởng này cho nhiều listener cùng lúc: bất kỳ ai mở channel cùng tên đều nhận được mọi message gửi tới, không cần ghép cặp port.
:::

:::note
"Don't communicate by sharing memory; share memory by communicating" — một câu châm ngôn cốt lõi của Go. Channel trao quyền sở hữu một giá trị cho goroutine tiếp theo, thay vì để hai goroutine tranh giành một biến dùng chung. `mpsc` của Rust theo đúng triết lý này: type-checker còn ép giá trị gửi đi phải `Send`.
:::

:::warning
`AsyncStream.yield()` của Swift không bao giờ block: mặc định nó đệm không giới hạn (hoặc tự loại bớt phần tử cũ nếu đặt policy). Đây không phải channel "backpressure" thật như của Go/Rust/Java — chỉ là hàng đợi bất đồng bộ gần giống nhất mà Swift có.
:::

## Khác biệt chính

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Cơ chế | `MessageChannel`/`postMessage` | channel (`chan`) — kiểu built-in | `std::sync::mpsc` — kiểu built-in | `AsyncStream` — không block khi gửi | `BlockingQueue` (`SynchronousQueue`…) |
| Giới hạn dung lượng | không giới hạn, hàng đợi ẩn bên trong | đặt buffer cố định lúc tạo (`make(chan T, n)`) | `sync_channel(n)` cho buffer cố định | không có backpressure thật | `ArrayBlockingQueue(n)` cho buffer cố định |
| Chờ có timeout | tự viết bằng `Promise.race` + `setTimeout` | `select` + `time.After` trong cú pháp | `recv_timeout(Duration)` | đua bằng `TaskGroup` + `Task.sleep` | `poll(timeout, unit)` |
