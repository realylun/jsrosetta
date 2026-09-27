---
title: "Timer: setTimeout và setInterval"
description: "setTimeout và setInterval của Node.js so với time.AfterFunc/Ticker (Go), std::thread (Rust), Task.sleep (Swift) và ScheduledExecutorService (Java)."
date: "2026-09-27"
order: 720
category: async
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "5.9"
  java: "25"
tags: [timer, settimeout, setinterval, goroutine]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#timeout"
---

Node.js chạy callback của `setTimeout`/`setInterval` trên event loop, nên chương trình vẫn sống cho tới khi hàng đợi callback trống. Go, Rust và Java đều chạy callback trên một thread/goroutine riêng — nếu không có gì giữ luồng chính lại (`sync.WaitGroup`, `JoinHandle::join`, `CountDownLatch`), chương trình có thể thoát trước khi callback kịp chạy. Swift là ngoại lệ: `Task.sleep` chạy ngay trong task hiện tại nên không cần cơ chế chờ riêng. `time.Ticker` của Go và bản Rust/Java tương ứng không "chạy callback" — chúng gửi tick qua một channel/hàng đợi mà code gọi phải tự đọc.

## Chạy một lần sau một khoảng thời gian (setTimeout / time.AfterFunc)

:::tabs
```js
setTimeout(callback, 1000);

function callback() {
  console.log("called"); // → called (sau ~1s)
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
	fmt.Println("called") // → called (sau ~1s)
}

func main() {
	wg.Add(1)
	time.AfterFunc(1*time.Second, callback) // callback chạy trên goroutine riêng
	wg.Wait()                               // không có WaitGroup, main sẽ thoát trước khi callback kịp chạy
}
```
```rust
use std::thread;
use std::time::Duration;

fn callback() {
    println!("called"); // → called (sau ~1s)
}

fn main() {
    let handle = thread::spawn(|| {
        thread::sleep(Duration::from_secs(1));
        callback();
    });
    handle.join().unwrap(); // không join(), main có thể thoát trước khi thread kịp chạy
}
```
```swift
func callback() {
    print("called") // → called (sau ~1s)
}

// chạy ngay trong task hiện tại: không cần thread hay cơ chế chờ riêng như
// Go/Rust/Java, vì `await` đã tạm dừng đúng chỗ cần dừng.
try await Task.sleep(for: .seconds(1))
callback()
```
```java
void main() throws InterruptedException {
    var scheduler = Executors.newSingleThreadScheduledExecutor(Thread.ofVirtual().factory());
    var done = new CountDownLatch(1);

    scheduler.schedule(() -> {
        IO.println("called"); // → called (sau ~1s)
        done.countDown();
    }, 1, TimeUnit.SECONDS);

    done.await(); // không có CountDownLatch, main sẽ return trước khi task chạy
    scheduler.shutdown();
}
```
:::

:::note
Java 21 thêm virtual thread (`Thread.ofVirtual()`): rẻ hơn nhiều so với platform thread nên rất hợp để làm "thread nền" cho một scheduler, dù bản thân `ScheduledExecutorService` đã có từ lâu.
:::

## Chạy lặp lại theo chu kỳ (setInterval / time.Ticker)

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
			ticker.Stop() // dừng ticker, tương đương clearInterval
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

// std không có kiểu Ticker sẵn: một thread nền gửi tick qua channel đóng
// đúng vai trò đó.
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
                break; // receiver đã bị drop: dừng gửi tick
            }
            i += 1;
        }
    });

    for i in rx {
        callback(i);
        if i == 3 {
            break; // drop rx ở đây khiến sender dừng lại, ~ clearInterval
        }
    }
}
// → called 0
// → called 1
// → called 2
// → called 3
```
```swift
// AsyncStream đóng vai trò Ticker: một Task nền yield tick, việc hủy Task khi
// stream kết thúc đóng vai trò clearInterval.
func ticker(interval: Duration) -> AsyncStream<Int> {
    AsyncStream { continuation in
        let task = Task {
            var i = 0
            while true {
                try? await Task.sleep(for: interval)
                continuation.yield(i)
                i += 1
            }
        }
        continuation.onTermination = { _ in task.cancel() } // dừng tick, ~ clearInterval
    }
}

func callback(_ i: Int) {
    print("called \(i)")
}

for await i in ticker(interval: .seconds(1)) {
    callback(i)
    if i == 3 {
        break // break kích hoạt onTermination, hủy Task của ticker
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
            self.get().cancel(false); // dừng lịch, tương đương clearInterval
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
Lambda của Java không được gán lại biến local đã bắt (capture) — nên bộ đếm `i` cần `AtomicInteger`, và tự huỷ lịch (`self.get().cancel()`) cần một `AtomicReference` giữ tham chiếu tới chính `ScheduledFuture` mà lambda đang chạy bên trong.
:::
