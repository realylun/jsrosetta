---
title: "Uncaught Exceptions"
description: "How Node.js's process.on('uncaughtException') compares to panic/recover (Go), catch_unwind (Rust), do/catch (Swift), and an uncaught exception handler (Java)."
tags: [exception, panic, recover, error-handling]
---

The [error handling and try/catch](/en/posts/errors) post covered `throw`/`try`/`catch` for regular error-handling flow. This one is different: a case where an error *escapes every normal handling path* and flies straight to the top level — the last-resort catch before the process crashes. Rust has `catch_unwind` (wrapping a call, similar to Go's `defer`/`recover`). Swift has no global hook at all — wrapping your program's entry point in `do`/`catch` is the closest thing, and an `Error` that truly goes uncaught all the way to the top crashes the runtime immediately, with nothing to save it. Java has `Thread.setDefaultUncaughtExceptionHandler()` — a global hook that does exactly what its name says, just like `process.on('uncaughtException')`.

## Catching an exception at the top level (uncaughtException vs recover)

:::tabs
```js
process.on("uncaughtException", (err) => {
  console.log(`caught exception: ${err.message}`); // → caught exception: my exception
  process.exit(1); // log, clean up and exit: resuming after this is unsafe
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
    panic::set_hook(Box::new(|_| {})); // silence the default "thread panicked at..." printout
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

// Swift has no global hook: wrapping the program's entry point in do/catch
// is the closest equivalent — an Error left uncaught all the way to the top
// level crashes immediately, with no way to intervene.
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
`'uncaughtException'` is a last resort, not `recover()`: the Node.js docs say the process is in an undefined state afterwards, so log, clean up and exit with a non-zero code instead of resuming.
:::

:::warning
Rust's `catch_unwind` differs from Go's `recover()` in one important way: it does **not** silence the default panic message — the panic hook (which prints "thread panicked at...") still runs before unwinding begins, whether or not `catch_unwind` ends up catching it. To get clean output like the example above, you have to replace `panic::set_hook` yourself.
:::

:::warning
Swift has no way to catch genuinely fatal runtime errors — force-unwrapping `nil`, `fatalError()`, out-of-bounds array access. Those are deliberate traps, entirely separate from `throws`/`Error`, and no signal handler can save the process afterwards, even if you register one. Only `Error`-based failures (like the one above) can be caught with `do`/`catch`.
:::

Exit codes split into two groups: both JS and Java call `process.exit(1)`/let the main thread crash and exit with a non-zero code — both treat "caught at the top level" as a sign to stop, not to keep going. Go, Rust, and Swift all "swallow" the error with `recover()`/`catch_unwind`/`do`-`catch` and let the program return normally, so they exit with code 0.
