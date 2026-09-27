---
title: "Nội suy chuỗi"
description: "Template literal (`${}`) của JavaScript so với fmt.Sprintf (Go), format!/println! (Rust), string interpolation (Swift) và String.formatted (Java)."
date: "2026-09-27"
order: 140
category: basics
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "2.0"
  java: "25"
tags: [string, template-literal, sprintf]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#interpolation"
---

JavaScript có cú pháp nội suy chuỗi ngay trong ngôn ngữ bằng template literal (chuỗi bọc dấu backtick). Go không có cú pháp riêng cho việc này — bạn dùng `fmt.Sprintf` với các format verb (`%s`, `%d`, …), giống `printf` của C. Swift có nội suy chuỗi thật trong ngôn ngữ: `\(...)` chấp nhận bất kỳ biểu thức nào. Rust thì khác: `format!`/`println!` chỉ là macro của thư viện chuẩn (std), không phải cú pháp lõi của ngôn ngữ; từ Rust 1.58 nó cho phép "capture" trực tiếp một identifier đơn giản đang có sẵn trong scope (`{name}`), nhưng không chấp nhận biểu thức hay truy cập field bên trong dấu ngoặc — `{user.name}` hay `{a + b}` đều không biên dịch, phải gán ra biến cục bộ trước hoặc dùng đối số vị trí/đặt tên (`format!("{}", user.name)`). Java thì không có nội suy chuỗi — kể cả String Templates từng được preview ở Java 21/22 rồi bị rút lại — nên vẫn phải dùng `String.format`/`.formatted()` kiểu `printf`, giống Go.

## Nội suy chuỗi

:::tabs
```js
const name = 'bob'
const age = 21
const message = `${name} is ${age} years old`

console.log(message)
```
```go
package main

import "fmt"

func main() {
	name := "bob"
	age := 21
	message := fmt.Sprintf("%s is %d years old", name, age)

	fmt.Println(message)
}
```
```rust
fn main() {
    let name = "bob";
    let age = 21;
    let message = format!("{name} is {age} years old"); // nội suy identifier trực tiếp trong chuỗi

    println!("{message}");
}
```
```swift
let name = "bob"
let age = 21
let message = "\(name) is \(age) years old"

print(message)
```
```java
void main() {
    String name = "bob";
    int age = 21;
    String message = "%s is %d years old".formatted(name, age); // không có nội suy chuỗi

    IO.println(message);
}
```
:::

```bash
bob is 21 years old
```

:::note
Java từng thử thêm String Templates (`STR."\{name} is \{age} years old"`) ở JEP 430 (Java 21, preview) và JEP 459 (Java 22, preview thứ hai), nhưng bị rút lại ở Java 23 để thiết kế lại và vẫn chưa quay lại tính đến Java 25. `String.format`/`.formatted()` vẫn là cách chuẩn.
:::
