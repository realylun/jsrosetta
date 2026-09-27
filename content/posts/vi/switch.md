---
title: "Switch"
description: "switch/case của JavaScript so với Go (không fall through, có fallthrough), Rust match (không có khái niệm fallthrough), Swift (giống Go) và Java (giống JS)."
date: "2026-09-27"
order: 330
category: control-flow
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.0"
  swift: "2.0"
  java: "25"
tags: [switch, fallthrough, control-flow]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#switch"
---

`switch` của Go trông giống JavaScript nhưng hành vi mặc định ngược lại hoàn toàn: JavaScript fall through sang case tiếp theo trừ khi có `break`, còn Go tự dừng sau case khớp trừ khi bạn viết `fallthrough` tường minh. Swift giống hệt Go (không fall through, có từ khoá `fallthrough` tường minh). Rust không có `switch` mà có `match` — và `match` **không có khái niệm fallthrough** dưới bất kỳ hình thức nào. Java (`switch` cổ điển dùng `:`) lại giống JavaScript: fall through mặc định, cần `break` để dừng — dù từ Java 14 đã có thêm switch expression dùng `->` không bao giờ fall through.

## switch không fall through vs fall through

:::tabs
```js
const value = 'b'

switch(value) {
  case 'a':
    console.log('A')
    break
  case 'b':
    console.log('B')
    break
  case 'c':
    console.log('C')
    break
  default:
    console.log('first default')
}

switch(value) {
  case 'a':
    console.log('A - falling through')
  case 'b':
    console.log('B - falling through')
  case 'c':
    console.log('C - falling through')
  default:
    console.log('second default')
}
```
```go
package main

import "fmt"

func main() {
	value := "b"

	switch value {
	case "a":
		fmt.Println("A")
	case "b":
		fmt.Println("B")
	case "c":
		fmt.Println("C")
	default:
		fmt.Println("first default")
	}

	switch value {
	case "a":
		fmt.Println("A - falling through")
		fallthrough
	case "b":
		fmt.Println("B - falling through")
		fallthrough
	case "c":
		fmt.Println("C - falling through")
		fallthrough
	default:
		fmt.Println("second default")
	}
}
```
```rust
fn main() {
    let value = "b";

    match value {
        "a" => println!("A"),
        "b" => println!("B"),
        "c" => println!("C"),
        _ => println!("first default"),
    }

    // Rust không có "fallthrough": mỗi nhánh `match` luôn độc lập, không "chảy" xuống nhánh kế
    // tiếp. Nhiều pattern dùng chung một thân nhánh thì gộp bằng `|` — khác hẳn ngữ nghĩa
    // "chảy qua nhiều thân nhánh, tích luỹ output" của Go/JS.
    match value {
        "a" | "b" | "c" => println!("A, B or C"),
        _ => println!("default"),
    }
}
```
```swift
let value = "b"

switch value {
case "a":
    print("A")
case "b":
    print("B")
case "c":
    print("C")
default:
    print("first default")
}

switch value {
case "a":
    print("A - falling through")
    fallthrough
case "b":
    print("B - falling through")
    fallthrough
case "c":
    print("C - falling through")
    fallthrough
default:
    print("second default")
}
```
```java
void main() {
    String value = "b";

    switch (value) {
        case "a":
            IO.println("A");
            break;
        case "b":
            IO.println("B");
            break;
        case "c":
            IO.println("C");
            break;
        default:
            IO.println("first default");
    }

    switch (value) {
        case "a":
            IO.println("A - falling through");
        case "b":
            IO.println("B - falling through");
        case "c":
            IO.println("C - falling through");
        default:
            IO.println("second default");
    }
}
```
:::

```bash
# Go / Swift / Java
B
B - falling through
C - falling through
second default

# Rust (match không có fallthrough, xem ghi chú)
B
A, B or C
```

:::warning
Ví dụ `match` thứ hai ở trên không phải bản dịch tương đương của ví dụ Go/JS: nó chỉ minh hoạ cách gộp nhiều pattern dùng chung một thân nhánh bằng `|` (or-pattern), nên chỉ cho ra MỘT dòng output — không phải chuỗi output tích luỹ như khi fall through thật sự.
:::

:::note
Từ Java 14 (JEP 361), Java có thêm nhãn mũi tên (`case "a" -> ...`): không bao giờ fall through và không cần `break`. Nhãn mũi tên dùng được cả trong switch **statement** lẫn switch **expression** — chỉ dạng expression mới trả về giá trị trực tiếp, còn statement dùng mũi tên vẫn chỉ thực thi thân case như bình thường (chỉ khác là không fall through). Ví dụ trên dùng `switch` cổ điển (dùng `:`) vì đó là dạng duy nhất còn giữ hành vi fall through để minh hoạ.
:::

## Khác biệt chính

| | Node.js | Go | Rust | Swift | Java (`switch` cổ điển) |
|---|---|---|---|---|---|
| Mặc định sau một case khớp | fall through sang case kế tiếp | dừng lại (implicit break) | dừng lại — không có khái niệm khác | dừng lại (implicit break) | fall through sang case kế tiếp |
| Muốn dừng lại | phải viết `break` | không cần làm gì, đã là mặc định | không cần làm gì, đã là mặc định | không cần làm gì, đã là mặc định | phải viết `break` |
| Muốn fall through | mặc định đã vậy | phải viết `fallthrough` tường minh | không thể — dùng or-pattern `\|` nếu muốn gộp | phải viết `fallthrough` tường minh | mặc định đã vậy |
