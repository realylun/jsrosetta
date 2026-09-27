---
title: "Stack Trace"
description: "console.trace() của Node.js so với debug.Stack() (Go), Backtrace (Rust), callStackSymbols (Swift) và printStackTrace() (Java)."
date: "2026-09-27"
order: 820
category: errors
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.65"
  swift: "2.0"
  java: "25"
tags: [stack-trace, debugging, panic, error-handling]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#stack-trace"
---

Khi một lỗi bị bắt, đôi lúc bạn cần in ra cả đường đi của lời gọi hàm dẫn tới nó, không chỉ mỗi message. Node.js có `console.trace()` sẵn trong global; Go cần gọi `runtime/debug.Stack()` trong hàm deferred. Rust có `std::backtrace::Backtrace`, chụp được đầy đủ nếu gọi từ trong panic hook — trước khi unwind bắt đầu. Swift không lưu stack trace cho `Error` (nó chỉ là một giá trị bình thường); cách gần nhất là tự chụp `Thread.callStackSymbols` ngay tại nơi ném lỗi rồi đính kèm vào lỗi đó. Java thì khác hẳn: mọi `Throwable` tự động chụp sẵn stack trace lúc khởi tạo — không cần API riêng nào khác, `e.printStackTrace()` là đủ.

## In stack trace khi bắt lỗi (console.trace vs debug.Stack)

:::tabs
```js
function foo() {
  throw new Error("failed");
}

try {
  foo();
} catch (err) {
  console.trace(err);
}
// → Trace: Error: failed
// →     at foo (file:///…/stack-trace.js:2:9)
// →     at file:///…/stack-trace.js:6:3
// →     … (đường dẫn file và số dòng khác nhau tuỳ máy và phiên bản Node.js)
```
```go
package main

import (
	"errors"
	"fmt"
	"runtime/debug"
)

func foo() {
	panic(errors.New("failed"))
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println(string(debug.Stack()))
		}
	}()

	foo()
}
// → goroutine 1 [running]:
// → runtime/debug.Stack()
// →     /…/runtime/debug/stack.go:26 +0x64
// → main.main.func1()
// →     /…/stack-trace.go:16 +0x24
// → panic({0x…, 0x…})
// →     /…/runtime/panic.go:859 +0x120
// → main.foo(...)
// →     /…/stack-trace.go:10
// → main.main()
// →     /…/stack-trace.go:20 +0x6c
// → … (địa chỉ, offset và đường dẫn khác nhau tuỳ máy và phiên bản Go)
```
```rust
use std::panic;

fn foo() {
    panic!("failed");
}

fn main() {
    // panic hook chạy TRƯỚC khi unwind bắt đầu, nên stack vẫn còn nguyên foo()
    panic::set_hook(Box::new(|_| {
        println!("{}", std::backtrace::Backtrace::force_capture());
    }));

    let _ = panic::catch_unwind(foo);
}
// →    7: stack_trace::foo
// →             at ./src/main.rs:4:5
// →   13: stack_trace::main
// →             at ./src/main.rs:12:13
// →    … (các frame runtime khác, địa chỉ và đường dẫn khác nhau tuỳ máy và phiên bản Rust)
```
```swift
import Foundation

struct TracedError: Error, CustomStringConvertible {
    let message: String
    let stack: [String]
    var description: String { message }
}

func foo() throws {
    // `Error` của Swift chỉ là một giá trị, không tự mang stack trace; phải tự
    // chụp Thread.callStackSymbols ngay tại nơi throw, giống debug.Stack().
    throw TracedError(message: "failed", stack: Thread.callStackSymbols)
}

do {
    try foo()
} catch let error as TracedError {
    print("caught: \(error)")
    for line in error.stack.prefix(2) {
        print(line)
    }
}
// → caught: failed
// → 0   main                                0x… $s4main3fooyyKF + 76
// → 1   main                                0x… main + 68
// → … (địa chỉ và tên symbol đã mangle; demangle bằng `swift demangle`)
```
```java
static void foo() {
    throw new RuntimeException("failed");
}

void main() {
    try {
        foo();
    } catch (RuntimeException e) {
        e.printStackTrace(); // mọi Throwable tự chụp sẵn stack trace lúc khởi tạo
    }
}
// → java.lang.RuntimeException: failed
// →     at Main.foo(Main.java:2)
// →     at Main.main(Main.java:7)
// →     … (số dòng khác nhau tuỳ cách biên dịch/chạy)
```
:::

:::note
Với Rust, `Backtrace::capture()` (không có `force_`) chỉ chụp khi biến môi trường `RUST_BACKTRACE=1` được đặt — dùng `force_capture()` như trên để luôn chụp bất kể biến môi trường.
:::

:::note
`Thread.callStackSymbols` là API của Foundation trên nền Darwin; kết quả chỉ đầy đủ và có ý nghĩa trên macOS/iOS, không phải phần chuẩn hoá của ngôn ngữ Swift.
:::
