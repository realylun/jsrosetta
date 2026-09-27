---
title: "Stack Traces"
description: "How Node.js's console.trace() compares to debug.Stack() (Go), Backtrace (Rust), callStackSymbols (Swift), and printStackTrace() (Java)."
tags: [stack-trace, debugging, panic, error-handling]
---

Once an error is caught, you sometimes need to print the whole call path that led to it, not just the message. Node.js has `console.trace()` right on the global object; Go needs `runtime/debug.Stack()` called in a deferred function. Rust has `std::backtrace::Backtrace`, which captures a full trace if called from inside a panic hook — before unwinding begins. Swift doesn't store a stack trace for an `Error` at all (it's just an ordinary value); the closest thing is capturing `Thread.callStackSymbols` yourself right where you throw and attaching it to the error. Java is entirely different: every `Throwable` automatically captures its stack trace when it's constructed — no separate API needed, `e.printStackTrace()` is enough.

## Printing a stack trace when catching an error (console.trace vs debug.Stack)

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
// →     … (file paths and line numbers vary by machine and Node.js version)
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
// → … (addresses, offsets and paths vary by machine and Go version)
```
```rust
use std::panic;

fn foo() {
    panic!("failed");
}

fn main() {
    // the panic hook runs BEFORE unwinding starts, so foo() is still on the stack
    panic::set_hook(Box::new(|_| {
        println!("{}", std::backtrace::Backtrace::force_capture());
    }));

    let _ = panic::catch_unwind(foo);
}
// →    7: stack_trace::foo
// →             at ./src/main.rs:4:5
// →   13: stack_trace::main
// →             at ./src/main.rs:12:13
// →    … (other runtime frames; addresses and paths vary by machine and Rust version)
```
```swift
import Foundation

struct TracedError: Error, CustomStringConvertible {
    let message: String
    let stack: [String]
    var description: String { message }
}

func foo() throws {
    // Swift's `Error` is just a value with no built-in stack trace; capture
    // Thread.callStackSymbols yourself at the throw site, like debug.Stack().
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
// → … (addresses and mangled symbol names; demangle with `swift demangle`)
```
```java
static void foo() {
    throw new RuntimeException("failed");
}

void main() {
    try {
        foo();
    } catch (RuntimeException e) {
        e.printStackTrace(); // every Throwable captures its stack trace when constructed
    }
}
// → java.lang.RuntimeException: failed
// →     at Main.foo(Main.java:2)
// →     at Main.main(Main.java:7)
// →     … (line numbers vary depending on how it's compiled/run)
```
:::

:::note
In Rust, `Backtrace::capture()` (without `force_`) only captures when the `RUST_BACKTRACE=1` environment variable is set — use `force_capture()` as above to always capture regardless of the environment.
:::

:::note
`Thread.callStackSymbols` is a Darwin-based Foundation API; the result is only complete and meaningful on macOS/iOS, not a standardized part of the Swift language.
:::
