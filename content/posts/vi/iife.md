---
title: "IIFE"
description: "IIFE trong Node.js so với hàm/closure ẩn danh gọi ngay trong Go, Rust, Swift và Java."
date: "2026-09-27"
order: 550
category: functions
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "1.0"
  java: "25"
tags: [iife, closure, scope]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#iife"
---

IIFE (Immediately Invoked Function Expression) là hàm được định nghĩa và gọi ngay lập tức, thường để tạo một scope riêng. Go, Rust và Swift không có cú pháp đặc biệt cho việc này — bạn chỉ cần định nghĩa một hàm/closure ẩn danh rồi gọi nó ngay. Java thì khó hơn: lambda expression cần một kiểu functional interface cụ thể nên không thể gọi thẳng, phải ép kiểu (cast) trước khi gọi — không ai viết Java thật kiểu này, thường dùng một block `{ ... }` hoặc method riêng để tạo scope thay vì cố mô phỏng IIFE.

## Định nghĩa và gọi ngay một hàm

:::tabs
```js
(function (name) {
  console.log('hello', name);
})('bob'); // hello bob
```
```go
package main

import "fmt"

func main() {
	func(name string) {
		fmt.Println("hello", name)
	}("bob") // hello bob
}
```
```rust
fn main() {
    (|name: &str| {
        println!("hello {name}");
    })("bob"); // hello bob
}
```
```swift
({ (name: String) in
    print("hello \(name)")
})("bob") // hello bob
```
```java
void main() {
    // lambda cần một functional interface cụ thể nên phải ép kiểu trước
    // khi gọi luôn — hiếm khi viết thế này trong Java thật
    ((Consumer<String>) name -> IO.println("hello " + name)).accept("bob"); // hello bob
}
```
:::

:::note
Từ Node.js 14.8, ES module hỗ trợ `await` ở top level, nên kiểu IIFE `(async () => { ... })()` — vốn chỉ được dùng để có `await` ở ngoài cùng — trong đa số trường hợp không còn cần thiết nữa. Rust và Swift gọi closure ẩn danh ngay tại chỗ khá tự nhiên, nhưng ở cả hai ngôn ngữ, cách phổ biến hơn để tạo scope riêng là dùng khối lệnh `{ ... }` như một biểu thức thay vì "IIFE". Java không có IIFE thật sự — ví dụ trên chỉ để minh hoạ, code Java thật sẽ dùng method riêng hoặc block thường.
:::
