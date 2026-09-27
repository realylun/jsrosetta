---
title: "Exception chưa bắt (uncaughtException)"
description: "process.on('uncaughtException') của Node.js so với panic/recover (Go), catch_unwind (Rust), do/catch (Swift) và uncaught exception handler (Java)."
date: "2026-09-27"
order: 810
category: errors
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "2.0"
  java: "25"
tags: [exception, panic, recover, error-handling]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#exceptions"
---

Bài [xử lý lỗi và try/catch](/posts/errors) đã nói về `throw`/`try`/`catch` cho luồng xử lý lỗi thông thường. Ở đây là trường hợp khác: một lỗi *thoát khỏi mọi xử lý thông thường* và bay thẳng tới top-level — cơ chế bắt cuối cùng trước khi tiến trình sập. Rust có `catch_unwind` (bọc quanh một lời gọi, giống `defer`/`recover` của Go). Swift không có hook toàn cục nào — bọc điểm vào chương trình trong `do`/`catch` là cách gần nhất, và một lỗi thật sự không được bắt sẽ khiến runtime crash ngay, không gì cứu được. Java có `Thread.setDefaultUncaughtExceptionHandler()` — một hook toàn cục đúng như tên gọi, giống hệt `process.on('uncaughtException')`.

## Bắt exception ở top-level (uncaughtException vs recover)

:::tabs
```js
process.on("uncaughtException", (err) => {
  console.log(`caught exception: ${err.message}`); // → caught exception: my exception
  process.exit(1); // log, dọn dẹp rồi exit: cố chạy tiếp sau lỗi này là không an toàn
});

function foo() {
  throw new Error("my exception");
}

function main() {
  foo();
}

main();
// exit code: 1
```
```go
package main

import (
	"fmt"
)

func foo() {
	panic("my exception")
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("caught exception: %s", r) // → caught exception: my exception
		}
	}()

	foo()
}
// exit code: 0
```
```rust
use std::panic;

fn foo() {
    panic!("my exception");
}

fn main() {
    panic::set_hook(Box::new(|_| {})); // im lặng dòng "thread panicked at..." mặc định
    let result = panic::catch_unwind(foo);

    if let Err(payload) = result {
        let message = payload.downcast_ref::<&str>().copied().unwrap_or("unknown panic");
        println!("caught exception: {message}"); // → caught exception: my exception
    }
}
// exit code: 0
```
```swift
struct AppError: Error, CustomStringConvertible {
    var description: String { "my exception" }
}

func foo() throws {
    throw AppError()
}

// Swift không có hook toàn cục: bọc điểm vào chương trình trong do/catch là
// cách gần nhất — một Error không được bắt tới tận top level sẽ crash ngay
// lập tức, không thể can thiệp.
do {
    try foo()
} catch {
    print("caught exception: \(error)") // → caught exception: my exception
}
// exit code: 0
```
```java
void main() {
    Thread.setDefaultUncaughtExceptionHandler((thread, e) -> {
        IO.println("caught exception: " + e.getMessage()); // → caught exception: my exception
    });

    foo();
}

static void foo() {
    throw new RuntimeException("my exception");
}
// exit code: 1
```
:::

:::warning
`'uncaughtException'` là phương án cuối cùng, không phải `recover()`: tài liệu Node.js nói rằng tiến trình ở trạng thái không xác định sau đó — hãy log, dọn dẹp rồi thoát với mã khác 0, thay vì cố chạy tiếp.
:::

:::warning
`catch_unwind` của Rust khác `recover()` của Go ở một điểm quan trọng: nó **không** im lặng thông báo panic mặc định — panic hook (in ra "thread panicked at...") vẫn chạy trước khi unwind bắt đầu, bất kể có bị `catch_unwind` bắt lại hay không. Muốn có output sạch như ví dụ trên, phải tự thay `panic::set_hook`.
:::

:::warning
Swift không có cách nào bắt các lỗi runtime "chết người" thật sự — force-unwrap `nil`, `fatalError()`, truy cập mảng ngoài phạm vi. Đó là các lời gọi trap có chủ đích, khác hẳn `throws`/`Error`, và không signal handler nào cứu được tiến trình sau đó, kể cả registering handler. Chỉ những lỗi kiểu `Error` (như ở trên) mới bắt được bằng `do`/`catch`.
:::

Mã thoát chia thành hai nhóm: JS và Java đều gọi `process.exit(1)`/để main thread crash nên thoát với mã khác 0 — cả hai coi "bắt được ở top-level" là dấu hiệu phải dừng lại, không cố chạy tiếp. Go, Rust và Swift đều "nuốt" lỗi bằng `recover()`/`catch_unwind`/`do`-`catch` rồi để chương trình return bình thường, nên thoát với mã 0.
