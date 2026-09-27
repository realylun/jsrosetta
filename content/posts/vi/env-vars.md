---
title: "Biến môi trường"
description: "process.env của Node.js so với os.Getenv (Go), env::var (Rust), ProcessInfo.environment (Swift) và System.getenv (Java)."
date: "2026-09-27"
order: 940
category: io
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "1.0"
  java: "25"
tags: [env, environment-variables, config, io]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#env-vars"
---

Đọc biến môi trường là một trong những thao tác I/O đơn giản nhất, nhưng cách truy cập khác nhau đôi chút: Node.js coi `process.env` như một object; Go, Rust, Swift và Java đều dùng một hàm nhận vào tên biến. Go trả về chuỗi rỗng nếu biến không tồn tại, Rust trả về `Result` (dùng `unwrap_or_default()` để lấy chuỗi rỗng tương tự), còn Swift và Java trả về `nil`/`null`.

## Đọc biến môi trường

:::tabs
```js
const key = process.env['API_KEY']

console.log(key)
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	key := os.Getenv("API_KEY")

	fmt.Println(key)
}
```
```rust
use std::env;

fn main() {
    let key = env::var("API_KEY").unwrap_or_default(); // Err nếu biến không tồn tại hoặc không phải UTF-8 hợp lệ
    println!("{key}");
}
```
```swift
import Foundation

let key = ProcessInfo.processInfo.environment["API_KEY"] ?? ""
print(key)
```
```java
void main() {
    String key = System.getenv("API_KEY"); // null nếu biến không tồn tại
    IO.println(key);
}
```
:::

```bash
$ API_KEY=foobar node env_vars.js
foobar

$ API_KEY=foobar go run env_vars.go
foobar

$ API_KEY=foobar cargo run
foobar

$ API_KEY=foobar swift env_vars.swift
foobar

$ API_KEY=foobar java Main.java
foobar
```
