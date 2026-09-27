---
title: "Printing"
description: "How Node.js's console.log/console.error map to Go's fmt.Println/Printf, Rust's println!/eprint!, Swift's print, and Java 25's IO.println."
tags: [printing, stdout, stderr]
---

Node.js's `console.log` writes to stdout, and `console.error` writes to stderr. Go splits this into clearer functions: `fmt.Println` prints with a trailing newline, `fmt.Printf` takes a C-style format string, and `fmt.Fprintf` writes to any `io.Writer` — including `os.Stderr`. Rust has equivalent macros (`println!`/`eprint!`) built into the language; Swift only has a plain `print`, so it needs Foundation for C-style formatting and for writing to stderr; Java 25 adds `IO.println` for compact source files, while `System.err` still works as before.

## Printing to stdout and stderr

:::tabs
```js
console.log('print to stdout')
console.log('format %s %d', 'example', 1)
console.error('print to stderr')
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Println("print to stdout")
	fmt.Printf("format %s %v\n", "example", 1)
	fmt.Fprintf(os.Stderr, "print to stderr")
}
```
```rust
fn main() {
    println!("print to stdout");
    println!("format {} {}", "example", 1);
    eprint!("print to stderr");
}
```
```swift
import Foundation

print("print to stdout")
print(String(format: "format %@ %d", "example", 1))
FileHandle.standardError.write(Data("print to stderr".utf8))
```
```java
void main() {
    IO.println("print to stdout");
    IO.println("format %s %d".formatted("example", 1));
    System.err.print("print to stderr");
}
```
:::

```bash
print to stdout
format example 1
print to stderr
```

:::note
Swift has no `printf`-style formatting or stderr writer in the core stdlib — both `String(format:)` and `FileHandle.standardError` come from Foundation (using the Swift-native names `FileHandle`/`Data`, available since Swift 3.0; before that they were `NSFileHandle`/`NSData`).
:::
