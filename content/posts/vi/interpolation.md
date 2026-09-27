---
title: "Nội suy chuỗi"
description: "Template literal (`${}`) của JavaScript tương ứng với fmt.Sprintf trong Go."
date: "2026-09-27"
order: 140
category: basics
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [string, template-literal, sprintf]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#interpolation"
---

JavaScript có cú pháp nội suy chuỗi ngay trong ngôn ngữ bằng template literal (chuỗi bọc dấu backtick). Go không có cú pháp riêng cho việc này — bạn dùng `fmt.Sprintf` với các format verb (`%s`, `%d`, …), giống `printf` của C.

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
:::

```bash
bob is 21 years old
```
