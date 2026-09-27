---
title: "Hàm"
description: "Cách khai báo hàm và kiểu tham số của Node.js so với cú pháp hàm tường minh kiểu của Go, Rust, Swift và Java."
date: "2026-09-27"
order: 500
category: functions
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "2.0"
  java: "25"
tags: [function, syntax, types]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#functions"
---

Node.js không bắt bạn khai báo kiểu cho tham số hay giá trị trả về — JavaScript là ngôn ngữ định kiểu động (dynamically typed), kiểu chỉ được biết và kiểm tra lúc chạy, không phải được suy luận từ trước. Go thì ngược lại: mỗi tham số và giá trị trả về đều phải có kiểu tường minh, đổi lại lỗi kiểu bị bắt ngay lúc biên dịch thay vì lúc chạy. Rust và Swift cũng bắt buộc kiểu tường minh, khai báo kiểu trả về bằng `->` giống Go; Java thì đặt kiểu trả về trước tên hàm, theo phong cách C/C++.

## Khai báo hàm

:::tabs
```js
function add(a, b) {
  return a + b
}

const result = add(2, 3)
console.log(result) // 5
```
```go
package main

import "fmt"

func add(a int, b int) int {
	return a + b
}

func main() {
	result := add(2, 3)
	fmt.Println(result) // 5
}
```
```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    let result = add(2, 3);
    println!("{result}"); // 5
}
```
```swift
func add(_ a: Int, _ b: Int) -> Int {
    return a + b
}

let result = add(2, 3)
print(result) // 5
```
```java
int add(int a, int b) {
    return a + b;
}

void main() {
    int result = add(2, 3);
    IO.println(result); // 5
}
```
:::
