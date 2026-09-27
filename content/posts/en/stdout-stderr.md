---
title: "Writing to Stdout and Stderr"
description: "How Node.js's process.stdout.write/process.stderr.write compares to fmt.Fprint (Go), io::Write (Rust), FileHandle (Swift), and System.out/err.write (Java)."
tags: [stdout, stderr, io, printing]
---

`console.log`/`console.error` covers most needs, but sometimes you need to write straight to a stream without an extra newline or formatting. All five languages let you write directly to stdout/stderr as a stream/writer: Go uses `fmt.Fprint`, Rust uses the `io::Write` trait, Swift uses `FileHandle`, and Java writes raw bytes through `System.out`/`System.err` (both a `PrintStream`).

## Writing to stdout

:::tabs
```js
process.stdout.write('hello world\n')
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Fprint(os.Stdout, "hello world\n")
}
```
```rust
use std::io::{self, Write};

fn main() {
    write!(io::stdout(), "hello world\n").unwrap();
}
```
```swift
import Foundation

FileHandle.standardOutput.write("hello world\n".data(using: .utf8)!)
```
```java
void main() throws Exception {
    System.out.write("hello world\n".getBytes());
    System.out.flush();
}
```
:::

```bash
hello world
```

## Writing to stderr

:::tabs
```js
process.stderr.write('hello error\n')
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Fprint(os.Stderr, "hello error\n")
}
```
```rust
use std::io::{self, Write};

fn main() {
    write!(io::stderr(), "hello error\n").unwrap();
}
```
```swift
import Foundation

FileHandle.standardError.write("hello error\n".data(using: .utf8)!)
```
```java
void main() throws Exception {
    System.err.write("hello error\n".getBytes());
    System.err.flush();
}
```
:::

```bash
hello error
```
