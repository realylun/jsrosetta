---
title: "IIFE"
description: "IIFE trong Node.js so với hàm ẩn danh gọi ngay trong Go."
date: "2026-09-27"
order: 550
category: functions
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [iife, closure, scope]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#iife"
---

IIFE (Immediately Invoked Function Expression) là hàm được định nghĩa và gọi ngay lập tức, thường để tạo một scope riêng. Go không có cú pháp đặc biệt cho việc này — bạn chỉ cần định nghĩa một hàm ẩn danh rồi gọi nó ngay, hoàn toàn tương tự.

## Định nghĩa và gọi ngay một hàm

:::tabs
```js
(function (name) {
  console.log('hello', name);
})('bob'); // hello bob
```
```go
package main

import "fmt"

func main() {
	func(name string) {
		fmt.Println("hello", name)
	}("bob") // hello bob
}
```
:::

:::note
Từ Node.js ≥ 14.8, ES module hỗ trợ `await` ở top level, nên kiểu IIFE `(async () => { ... })()` — vốn chỉ được dùng để có `await` ở ngoài cùng — trong đa số trường hợp không còn cần thiết nữa.
:::
