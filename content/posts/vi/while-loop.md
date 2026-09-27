---
title: "Vòng lặp While"
description: "Vòng lặp while của JavaScript tương ứng với for dùng làm while trong Go (Go không có từ khoá while) — Rust, Swift và Java đều có while như JavaScript."
date: "2026-09-27"
order: 320
category: control-flow
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "2.0"
  java: "25"
tags: [while-loop, for, control-flow]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#while"
---

Go không có từ khoá `while`. Cùng chức năng đó đạt được bằng `for` chỉ với điều kiện, bỏ luôn phần `init` và `post`. Rust, Swift và Java thì đều có `while` y hệt JavaScript — trong nhóm 5 ngôn ngữ này, Go là ngoại lệ duy nhất.

## while trong JavaScript, for trong Go

:::tabs
```js
let i = 0

while (i <= 5) {
  console.log(i)

  i++
}
```
```go
package main

import "fmt"

func main() {
	i := 0

	for i <= 5 {
		fmt.Println(i)

		i++
	}
}
```
```rust
fn main() {
    let mut i = 0;

    while i <= 5 {
        println!("{i}");

        i += 1;
    }
}
```
```swift
var i = 0

while i <= 5 {
    print(i)

    i += 1
}
```
```java
void main() {
    int i = 0;

    while (i <= 5) {
        IO.println(i);

        i++;
    }
}
```
:::

```bash
0
1
2
3
4
5
```
