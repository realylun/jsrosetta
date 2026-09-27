---
title: "Vòng lặp For"
description: "Vòng lặp for kiểu C của JavaScript so với Go (for kiểu C + range-over-int từ 1.22), Java (giữ for kiểu C) và Rust/Swift (không có for kiểu C, chỉ có range)."
date: "2026-09-27"
order: 310
category: control-flow
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.22"
  rust: "1.58"
  swift: "2.0"
  java: "25"
tags: [for-loop, range, control-flow]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#for"
---

Go giữ nguyên vòng `for` kiểu C ba phần (`init; condition; post`) giống JavaScript. Go không có `while` hay `do-while` riêng — `for` là từ khoá lặp duy nhất, và từ Go 1.22 nó còn có thêm cách viết `range` để lặp một số lần cố định. Rust chưa từng có `for` kiểu C — range (`0..6`) là cách duy nhất từ Rust 1.0. Swift **từng có** `for` kiểu C nhưng đã bỏ hẳn từ Swift 3.0 (SE-0007), cũng chuyển sang dùng range. Java thì vẫn giữ `for` kiểu C y hệt JavaScript.

## Vòng lặp kiểu C và range-over-int

:::tabs
```js
for (let i = 0; i <= 5; i++) {
  console.log(i)
}
```
```go
package main

import "fmt"

func main() {
	for i := 0; i <= 5; i++ {
		fmt.Println(i)
	}

	// range trên một số nguyên để lặp một số lần cố định
	for i := range 6 {
		fmt.Println(i)
	}
}
```
```rust
fn main() {
    for i in 0..=5 {
        println!("{i}");
    }

    // Rust không có for kiểu C ba phần — range là cách duy nhất để lặp một số lần cố định,
    // và đã có từ Rust 1.0 (Go chỉ mới thêm range-over-int từ 1.22)
    for i in 0..6 {
        println!("{i}");
    }
}
```
```swift
for i in 0...5 {
    print(i)
}

// Swift bỏ hẳn for kiểu C từ Swift 3.0 (SE-0007) — range là cách lặp chuẩn,
// tương tự range-over-int mà Go chỉ mới thêm từ 1.22
for i in 0..<6 {
    print(i)
}
```
```java
void main() {
    for (int i = 0; i <= 5; i++) {
        IO.println(i);
    }

    // Java không có cú pháp range-over-int như Go 1.22+; gần nhất là IntStream.range(...)
    IntStream.range(0, 6).forEach(IO::println);
}
```
:::

```bash
# Node.js
0
1
2
3
4
5

# Go / Rust / Swift / Java
0
1
2
3
4
5
0
1
2
3
4
5
```

:::note
Go 1.22 thêm `for i := range N` (range trên một số nguyên) làm cách viết gọn để lặp N lần; trước 1.22 phải dùng `for i := 0; i < N; i++`. Go 1.22 cũng cho mỗi vòng `for` một bản copy riêng của biến lặp ở mỗi lần lặp, nên cách né `x := x` từng cần khi capture biến lặp trong goroutine hay closure không còn cần nữa. Cả hai đều yêu cầu `go 1.22`+ trong go.mod.
:::

:::note
Trong Rust, `0..6` loại trừ 6 còn `0..=6` bao gồm 6; Swift dùng `..<` và `...` cho cùng ý nghĩa đó. Nói cách khác, Go 1.22 chỉ vừa bắt kịp thứ mà Rust và Swift (thời kỳ đầu) đã có từ lâu.
:::
