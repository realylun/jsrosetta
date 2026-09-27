---
title: "Hàm"
description: "Cách khai báo hàm và kiểu tham số của Node.js so với cú pháp hàm tường minh kiểu của Go."
date: "2026-09-27"
order: 500
category: functions
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [function, syntax, types]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#functions"
---

Node.js không bắt bạn khai báo kiểu cho tham số hay giá trị trả về — JavaScript là ngôn ngữ định kiểu động (dynamically typed), kiểu chỉ được biết và kiểm tra lúc chạy, không phải được suy luận từ trước. Go thì ngược lại: mỗi tham số và giá trị trả về đều phải có kiểu tường minh, đổi lại lỗi kiểu bị bắt ngay lúc biên dịch thay vì lúc chạy.

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
:::
