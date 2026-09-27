---
title: "Ghi ra Stdout và Stderr"
description: "process.stdout.write/process.stderr.write của Node.js so với fmt.Fprint (Go), io::Write (Rust), FileHandle (Swift) và System.out/err.write (Java)."
date: "2026-09-27"
order: 910
category: io
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.0"
  swift: "3.0"
  java: "25"
tags: [stdout, stderr, io, printing]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#stdout"
---

`console.log`/`console.error` đã đủ dùng hầu hết thời gian, nhưng đôi khi bạn cần ghi thẳng vào stream mà không thêm dấu xuống dòng hay định dạng thừa. Cả năm ngôn ngữ đều cho phép ghi trực tiếp vào stdout/stderr như một stream/writer: Go dùng `fmt.Fprint`, Rust dùng trait `io::Write`, Swift dùng `FileHandle`, còn Java ghi thẳng byte qua `System.out`/`System.err` (đều là `PrintStream`).

## Ghi ra stdout

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
    // .write_all() với byte string thay vì write!(...,"…\n") — tránh cùng lúc
    // hai clippy lint write_with_newline và explicit_write
    io::stdout().write_all(b"hello world\n").unwrap();
}
```
```swift
import Foundation

try FileHandle.standardOutput.write(contentsOf: "hello world\n".data(using: .utf8)!)
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

## Ghi ra stderr

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
    io::stderr().write_all(b"hello error\n").unwrap();
}
```
```swift
import Foundation

try FileHandle.standardError.write(contentsOf: "hello error\n".data(using: .utf8)!)
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
