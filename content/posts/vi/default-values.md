---
title: "Giá trị mặc định"
description: "Tham số mặc định trong Node.js và Swift so với Option (Rust), overloading (Java) và con trỏ + nil (Go)."
date: "2026-09-27"
order: 510
category: functions
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.0"
  swift: "1.0"
  java: "25"
tags: [default-parameters, pointers, nil, overloading]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#default-values"
---

Node.js cho phép gán giá trị mặc định ngay trong danh sách tham số. Swift là ngôn ngữ duy nhất khác trong danh sách có đúng cú pháp này. Go không có cú pháp này — muốn biết caller có "để trống" tham số hay không, bạn phải dùng con trỏ và kiểm tra `nil`. Rust cũng không có tham số mặc định — dùng `Option` để bắt buộc caller truyền rõ ràng "có" hay "không". Java giải quyết bằng overloading: định nghĩa nhiều phiên bản của cùng một hàm.

## Giá trị mặc định cho tham số

:::tabs
```js
function greet(name = 'stranger') {
  return `hello ${name}`;
}

console.log(greet());      // hello stranger
console.log(greet('bob')); // hello bob
```
```go
package main

import "fmt"

// dùng con trỏ và kiểm tra nil để biết tham số có bị bỏ trống hay không
func greet(name *string) string {
	n := "stranger"
	if name != nil {
		n = *name
	}
	return fmt.Sprintf("hello %s", n)
}

func main() {
	fmt.Println(greet(nil)) // hello stranger

	name := "bob"
	fmt.Println(greet(&name)) // hello bob
}
```
```rust
// Không có tham số mặc định: dùng Option để caller phải truyền rõ ràng.
fn greet(name: Option<&str>) -> String {
    format!("hello {}", name.unwrap_or("stranger"))
}

fn main() {
    println!("{}", greet(None));       // hello stranger
    println!("{}", greet(Some("bob"))); // hello bob
}
```
```swift
func greet(name: String = "stranger") -> String {
    "hello \(name)"
}

print(greet())           // hello stranger
print(greet(name: "bob")) // hello bob
```
```java
// Không có tham số mặc định: overload nhiều phiên bản của cùng một hàm.
static String greet() {
    return greet("stranger");
}

static String greet(String name) {
    return "hello " + name;
}

void main() {
    IO.println(greet());      // hello stranger
    IO.println(greet("bob")); // hello bob
}
```
:::

:::note
Rust và Java không có tham số mặc định. Rust dùng `Option<T>` để bắt caller truyền `None`/`Some` một cách tường minh; Java overload nhiều chữ ký hàm khác nhau — cả hai đều là "workaround" phổ biến, không phải cú pháp riêng cho việc này.
:::
