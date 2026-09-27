---
title: "Hoán đổi biến"
description: "Hoán đổi hai biến bằng array destructuring trong Node.js so với destructuring assignment trong Rust, hàm `swap` trong Swift, gán nhiều biến trong Go và biến tạm trong Java."
date: "2026-09-27"
order: 540
category: functions
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.59"
  swift: "2.0"
  java: "25"
tags: [swap, multiple-assignment]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#swapping"
---

Node.js hoán đổi hai biến bằng array destructuring, không cần biến tạm. Go làm y hệt bằng gán nhiều biến cùng lúc — cũng không cần biến tạm. Rust từ bản 1.59 có destructuring assignment cho tuple (`(b, a) = (a, b)`), cùng ý tưởng. Swift có sẵn hàm `swap(&a, &b)` trong thư viện chuẩn. Java không có cú pháp nào cho việc này — vẫn phải dùng biến tạm.

## Hoán đổi hai biến

:::tabs
```js
let a = 'foo';
let b = 'bar';

console.log(a, b); // foo bar

[b, a] = [a, b];

console.log(a, b); // bar foo
```
```go
package main

import "fmt"

func main() {
	a := "foo"
	b := "bar"

	fmt.Println(a, b) // foo bar

	b, a = a, b

	fmt.Println(a, b) // bar foo
}
```
```rust
fn main() {
    let mut a = "foo";
    let mut b = "bar";

    println!("{a} {b}"); // foo bar

    (b, a) = (a, b); // destructuring assignment, không cần `let`

    println!("{a} {b}"); // bar foo
}
```
```swift
var a = "foo"
var b = "bar"

print(a, b) // foo bar

swap(&a, &b) // hàm swap có sẵn trong thư viện chuẩn

print(a, b) // bar foo
```
```java
void main() {
    String a = "foo";
    String b = "bar";

    IO.println(a + " " + b); // foo bar

    // không có destructuring assignment: vẫn cần biến tạm
    String temp = a;
    a = b;
    b = temp;

    IO.println(a + " " + b); // bar foo
}
```
:::

:::note
Rust 1.59 thêm destructuring assignment cho tuple/slice/struct (`(b, a) = (a, b)`) — trước đó chỉ dùng được với `let`. Java không có cách nào gọn hơn biến tạm để hoán đổi hai biến bất kỳ kiểu nào.
:::
