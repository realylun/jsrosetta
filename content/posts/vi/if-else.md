---
title: "If/Else"
description: "Cú pháp if/else if/else và toán tử ba ngôi của JavaScript so với if/else if/else trong Go (Go không có toán tử ba ngôi)."
date: "2026-09-27"
order: 300
category: control-flow
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [if-else, ternary, control-flow]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#ifelse"
---

`if`/`else if`/`else` trong Go đọc gần như y hệt JavaScript — chỉ bỏ dấu ngoặc đơn quanh điều kiện. Khác biệt lớn nhất: Go **không có toán tử ba ngôi** (`? :`), nên phải viết ra bằng một biến và một khối `if` bình thường.

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
:::

```bash
array exists
length is 2
no
```

:::note
Go không có kiểu "truthy/falsy" chung như JavaScript. `if array != nil` chỉ kiểm tra slice có phải `nil` không (một slice rỗng nhưng không `nil` vẫn qua điều kiện này) — muốn kiểm tra rỗng thì dùng `len(array) == 0`.
:::
