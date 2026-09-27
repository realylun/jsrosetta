---
title: "In ra output"
description: "console.log/console.error trong Node.js so với fmt.Println/Printf (Go), println!/eprint! (Rust), print (Swift) và IO.println (Java 25)."
date: "2026-09-27"
order: 110
category: basics
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.19"
  swift: "3.0"
  java: "25"
tags: [printing, stdout, stderr]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#printing"
---

`console.log` in ra stdout, `console.error` in ra stderr. Go tách các hàm rõ ràng hơn: `fmt.Println` in kèm xuống dòng, `fmt.Printf` nhận format string kiểu C, còn `fmt.Fprintf` ghi vào bất kỳ `io.Writer` nào — kể cả `os.Stderr`. Rust có macro tương đương (`println!`/`eprint!`) ngay trong ngôn ngữ; Swift chỉ có `print` đơn giản nên cần Foundation cho định dạng kiểu C và ghi ra stderr; Java 25 thêm `IO.println` cho compact source file, còn `System.err` vẫn dùng như trước.

## In ra stdout và stderr

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
print(String(format: "format \("example") %d", 1))
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
Swift không có hàm in kiểu `printf` hay ghi ra `stderr` trong core stdlib — cả `String(format:)` lẫn `FileHandle.standardError` đều đến từ Foundation (dùng tên kiểu Swift-native như `FileHandle`/`Data`, có từ Swift 3.0; trước đó là `NSFileHandle`/`NSData`). Tránh dùng `%@` với một `String` thuần hay `%s` trong `String(format:)` — cả hai đều dựa vào cầu nối Objective-C/con trỏ C và không đáng tin cậy trên mọi nền tảng Swift; ghép phần chuỗi bằng string interpolation trước rồi chỉ dùng `%d`/`%f`… cho phần số là cách portable hơn.
:::
