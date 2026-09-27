---
title: "If/Else"
description: "Cú pháp if/else if/else và toán tử ba ngôi của JavaScript so với Go (không có ba ngôi), Rust (if là biểu thức), Swift và Java (đều có ba ngôi)."
date: "2026-09-27"
order: 300
category: control-flow
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "2.0"
  java: "25"
tags: [if-else, ternary, control-flow]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#ifelse"
---

`if`/`else if`/`else` trong Go đọc gần như y hệt JavaScript — chỉ bỏ dấu ngoặc đơn quanh điều kiện. Khác biệt lớn nhất: Go **không có toán tử ba ngôi** (`? :`), nên phải viết ra bằng một biến và một khối `if` bình thường. Rust cũng không có toán tử ba ngôi, nhưng `if` trong Rust là một **biểu thức** nên viết gọn hơn Go. Swift và Java thì có hẳn `? :` giống JavaScript.

## Rẽ nhánh có điều kiện

:::tabs
```js
const array = [1, 2]

if (array) {
  console.log('array exists')
}

if (array.length === 2) {
  console.log('length is 2')
} else if (array.length === 1) {
  console.log('length is 1')
} else {
  console.log('length is other')
}

const isOddLength = array.length % 2 == 1 ? 'yes' : 'no'

console.log(isOddLength)
```
```go
package main

import "fmt"

func main() {
	array := []byte{1, 2}

	if array != nil {
		fmt.Println("array exists")
	}

	if len(array) == 2 {
		fmt.Println("length is 2")
	} else if len(array) == 1 {
		fmt.Println("length is 1")
	} else {
		fmt.Println("length is other")
	}

	// cách gần nhất thay cho toán tử ba ngôi
	isOddLength := "no"
	if len(array)%2 == 1 {
		isOddLength = "yes"
	}

	fmt.Println(isOddLength)
}
```
```rust
fn main() {
    let array: Vec<u8> = vec![1, 2];

    // Vec sở hữu không có trạng thái "nil" như slice của Go, nên "tồn tại" luôn đúng ở đây
    println!("array exists");

    if array.len() == 2 {
        println!("length is 2");
    } else if array.len() == 1 {
        println!("length is 1");
    } else {
        println!("length is other");
    }

    // `if` là một biểu thức trong Rust — gần với toán tử ba ngôi hơn cách làm của Go
    let is_odd_length = if array.len() % 2 == 1 { "yes" } else { "no" };

    println!("{is_odd_length}");
}
```
```swift
let array = [1, 2]

// Array là value type và không optional ở đây nên luôn "tồn tại" — không có kiểu nil như slice của Go
print("array exists")

if array.count == 2 {
    print("length is 2")
} else if array.count == 1 {
    print("length is 1")
} else {
    print("length is other")
}

let isOddLength = array.count % 2 == 1 ? "yes" : "no" // Swift có toán tử ba ngôi, khác Go

print(isOddLength)
```
```java
void main() {
    int[] array = { 1, 2 };

    if (array != null) {
        IO.println("array exists");
    }

    if (array.length == 2) {
        IO.println("length is 2");
    } else if (array.length == 1) {
        IO.println("length is 1");
    } else {
        IO.println("length is other");
    }

    String isOddLength = array.length % 2 == 1 ? "yes" : "no"; // Java có toán tử ba ngôi, khác Go

    IO.println(isOddLength);
}
```
:::

```bash
array exists
length is 2
no
```

:::note
Go không có kiểu "truthy/falsy" chung như JavaScript. `if array != nil` chỉ kiểm tra slice có phải `nil` không (một slice rỗng nhưng không `nil` vẫn qua điều kiện này) — muốn kiểm tra rỗng thì dùng `len(array) == 0`. Java's array cũng có thể `null` như slice của Go, nên `array != null` là phép kiểm tra tương đương thật sự. Vec của Rust và Array của Swift không có trạng thái null khi không bọc trong `Option`/optional, nên bước kiểm tra "tồn tại" ở hai ví dụ đó chỉ mang tính minh hoạ.
:::
