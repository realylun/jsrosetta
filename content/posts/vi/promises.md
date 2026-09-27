---
title: "Promise"
description: "Promise .then()/.catch() và Promise.all() của Node.js so với channel (Go), Future (Rust), async/await (Swift) và CompletableFuture (Java)."
date: "2026-09-27"
order: 700
category: async
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.25"
  rust: "1.71"
  swift: "5.9"
  java: "25"
tags: [promise, async, channel, goroutine]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#promises"
---

Node.js có `Promise` sẵn trong ngôn ngữ. Go không có kiểu tương đương — cách gần nhất là dùng channel để nhận giá trị "đã settle" từ một goroutine chạy nền. Rust và Swift cũng không có kiểu Promise, nhưng có `async`/`await` để đạt cùng hiệu ứng (xem [async/await](/posts/async-await) nếu muốn ôn lại cú pháp đó). Java có `CompletableFuture` — kiểu gần với Promise nhất trong số năm ngôn ngữ, chuỗi được bằng `.thenAccept()`/`.exceptionally()` y hệt `.then()`/`.catch()`. Bài này dùng cú pháp `.then()`/`.catch()` cổ điển của Node.js.

## Tạo một promise và xử lý kết quả (then/catch)

:::tabs
```js
function asyncMethod(value) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`resolved: ${value}`);
    }, 1000);
  });
}

asyncMethod("foo")
  .then((result) => console.log(result)) // → resolved: foo
  .catch((err) => console.error(err));
```
```go
package main

import (
	"fmt"
	"os"
	"sync"
	"time"
)

// Result đứng thay cho giá trị "đã settle" của Promise: có Value khi thành
// công, có Err khi thất bại.
type Result struct {
	Value string
	Err   error
}

func asyncMethod(value string) <-chan Result {
	ch := make(chan Result, 1)
	go func() {
		time.Sleep(1 * time.Second)
		ch <- Result{Value: "resolved: " + value}
	}()
	return ch
}
```
```rust
// Cargo.toml: tokio = { version = "1", features = ["full"] }
use std::time::Duration;
use tokio::time::sleep;

// Future của Rust là kiểu gần nhất, nhưng nó lazy: không có gì chạy cho tới
// khi bị await; Result<T, E> đóng vai trò resolve/reject.
async fn async_method(value: &str) -> Result<String, String> {
    sleep(Duration::from_secs(1)).await;
    Ok(format!("resolved: {value}"))
}
```
```swift
// Swift không có kiểu Promise; gần nhất là một hàm async, và `throws` đóng
// vai trò reject.
func asyncMethod(_ value: String) async throws -> String {
    try await Task.sleep(for: .seconds(1))
    return "resolved: \(value)"
}
```
```java
// CompletableFuture là kiểu gần với Promise nhất của Java: nối chuỗi bằng
// .thenAccept()/.exceptionally() thay vì .then()/.catch().
static CompletableFuture<String> asyncMethod(String value) {
    return CompletableFuture.supplyAsync(() -> {
        sleep(1000);
        return "resolved: " + value;
    });
}

static void sleep(long ms) {
    try {
        Thread.sleep(ms);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new RuntimeException(e);
    }
}
```
:::

## Chạy nhiều promise song song (Promise.all)

Dùng lại `asyncMethod` và `Result` ở trên:

:::tabs
```js
Promise.all([
  asyncMethod("A"),
  asyncMethod("B"),
  asyncMethod("C"),
])
  .then((results) => console.log(results)) // → ['resolved: A', 'resolved: B', 'resolved: C']
  .catch((err) => console.error(err));
```
```go
// all chờ mọi channel settle, giống Promise.all: trả về giá trị theo đúng
// thứ tự, hoặc lỗi đầu tiên gặp phải.
func all(chs ...<-chan Result) ([]string, error) {
	values := make([]string, len(chs))
	errs := make([]error, len(chs))

	var wg sync.WaitGroup
	for i, ch := range chs {
		wg.Go(func() {
			r := <-ch
			values[i] = r.Value
			errs[i] = r.Err
		})
	}
	wg.Wait()

	for _, err := range errs {
		if err != nil {
			return nil, err
		}
	}
	return values, nil
}

func main() {
	foo := asyncMethod("foo") // channel bắt đầu chạy ngay, giống Promise được tạo là chạy ngay
	abc := []<-chan Result{asyncMethod("A"), asyncMethod("B"), asyncMethod("C")} // cả 3 chạy song song ngay lập tức

	if r := <-foo; r.Err != nil { // <-foo: chờ giá trị, giống .then()/.catch()
		fmt.Fprintln(os.Stderr, r.Err)
	} else {
		fmt.Println(r.Value) // → resolved: foo
	}

	values, err := all(abc...)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return
	}
	fmt.Println(values) // → [resolved: A resolved: B resolved: C]
}
```
```rust
#[tokio::main]
async fn main() {
    match async_method("foo").await {
        Ok(result) => println!("{result}"), // → resolved: foo
        Err(err) => eprintln!("{err}"),
    }

    let (a, b, c) = tokio::join!(async_method("A"), async_method("B"), async_method("C"));
    let results: Result<Vec<_>, _> = [a, b, c].into_iter().collect(); // gặp Err đầu tiên là dừng, giống Promise.all
    match results {
        Ok(values) => println!("{values:?}"), // → ["resolved: A", "resolved: B", "resolved: C"]
        Err(err) => eprintln!("{err}"),
    }
}
```
```swift
// all chờ hết mọi task rồi trả về theo đúng thứ tự ban đầu, giống Promise.all
// — TaskGroup hoàn tất các task không theo thứ tự nên phải sắp lại theo index.
func all(_ values: [String]) async throws -> [String] {
    try await withThrowingTaskGroup(of: (Int, String).self) { group in
        for (index, value) in values.enumerated() {
            group.addTask { (index, try await asyncMethod(value)) }
        }
        var results = [String](repeating: "", count: values.count)
        for try await (index, result) in group {
            results[index] = result
        }
        return results
    }
}

let foo = try await asyncMethod("foo") // await ở đây đóng vai trò .then()
print(foo) // → resolved: foo

let results = try await all(["A", "B", "C"])
print(results) // → ["resolved: A", "resolved: B", "resolved: C"]
```
```java
void main() {
    asyncMethod("foo")
            .thenAccept(result -> IO.println(result)) // → resolved: foo
            .join();

    List<CompletableFuture<String>> tasks = Stream.of("A", "B", "C")
            .map(value -> asyncMethod(value))
            .toList();

    CompletableFuture.allOf(tasks.toArray(CompletableFuture[]::new))
            .thenRun(() -> {
                List<String> results = tasks.stream().map(CompletableFuture::join).toList();
                IO.println(results); // → [resolved: A, resolved: B, resolved: C]
            })
            .join();
}
```
:::

:::note
Go 1.25 thêm `sync.WaitGroup.Go(func())`, thay cho cách viết thủ công `wg.Add(1)` + `go func(){ …; wg.Done() }()` trước đó — nhờ vậy một goroutine không thể được khởi động mà thiếu `Done()` đi kèm.
:::

:::note
`CompletableFuture` không có "microtask queue" ẩn như Promise: `.thenAccept()`/`.thenRun()` chạy trên `ForkJoinPool.commonPool()`, một pool dùng daemon thread. Nếu `main()` không gọi `.join()` để chờ, chương trình có thể thoát trước khi callback kịp chạy — cùng lý do Go cần `sync.WaitGroup`.
:::
