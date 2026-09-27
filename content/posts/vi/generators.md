---
title: "Generator"
description: "Generator function và iterator helpers của Node.js so với `iter.Seq` (range-over-func) và channel trong Go."
date: "2026-09-27"
order: 560
category: functions
languages: [js, go]
versions:
  js: "22"
  go: "1.23"
tags: [generator, yield, iterator, channel]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#generators"
---

Node.js có generator function (`function*` / `yield`) built-in: gọi hàm không chạy gì cả, mỗi lần gọi `.next()` mới chạy tới `yield` tiếp theo. Go không có cú pháp generator, nhưng từ 1.23 có `iter.Seq` — kiểu "range-over-func" giúp bạn range trực tiếp qua một hàm giống hệt range qua slice hay map. Trước đó (và vẫn còn hợp lệ), cách kinh điển là dùng channel.

## Định nghĩa generator

:::tabs
```js
function* generator() {
  yield 'hello';
  yield 'world';
}
```
```go
package main

import (
	"fmt"
	"iter"
)

// Generator trả về một iter.Seq — kiểu "range-over-func" chuẩn của Go.
// Caller range trực tiếp qua nó.
func Generator() iter.Seq[string] {
	return func(yield func(string) bool) {
		for _, v := range []string{"hello", "world"} {
			if !yield(v) {
				return
			}
		}
	}
}
```
:::

:::note
**Thay đổi:** Go 1.23 — `iter.Seq` và range-over-func thay thế cách viết generator thủ công kiểu closure "next" (`func() (string, bool)`) trước đây; giờ bạn range trực tiếp qua `iter.Seq` như mọi sequence khác.
:::

## Lấy giá trị thủ công (`next()` / `done`)

:::tabs
```js
const gen = generator();

while (true) {
  const { value, done } = gen.next();
  console.log(value, done);

  if (done) {
    break;
  }
}
// hello false
// world false
// undefined true
```
```go
// channelGenerator mô phỏng generator bằng một goroutine gửi giá trị qua
// channel, đóng lại khi xong — cách kinh điển để lấy từng giá trị một.
func channelGenerator() chan string {
	c := make(chan string)

	go func() {
		defer close(c)
		c <- "hello"
		c <- "world"
	}()

	return c
}

func main() {
	for value := range channelGenerator() {
		fmt.Println(value)
	}
	// hello
	// world
}
```
:::

Channel vẫn là một cách hợp lệ để mô hình hoá generator giữa các goroutine — nó có từ trước Go 1.23 và không bị `iter.Seq` thay thế hoàn toàn.

## Duyệt bằng for...of / iterator helpers

:::tabs
```js
for (const value of generator()) {
  console.log(value);
}
// hello
// world

// generator object cũng là iterator, nên iterator helpers biến đổi được
// trực tiếp, không cần spread ra mảng trước
for (const value of generator().map((word) => word.toUpperCase())) {
  console.log(value);
}
// HELLO
// WORLD
```
```go
func main() {
	for value := range Generator() {
		fmt.Println(value)
	}
	// hello
	// world

	// Go không có chuỗi iterator helper dựng sẵn — biến đổi ngay trong vòng lặp
	for value := range Generator() {
		fmt.Println(strings.ToUpper(value))
	}
	// HELLO
	// WORLD
}
```
:::

:::note
**Thay đổi:** Node.js 22 — Iterator helpers (`Iterator.prototype.map`, `.filter`, `.take`, …) cho phép biến đổi kết quả của generator trực tiếp, không cần spread ra mảng trước.
:::
