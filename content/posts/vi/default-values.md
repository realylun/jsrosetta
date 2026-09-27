---
title: "Giá trị mặc định"
description: "Tham số mặc định trong Node.js so với con trỏ và kiểm tra nil trong Go."
date: "2026-09-27"
order: 510
category: functions
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [default-parameters, pointers, nil]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#default-values"
---

Node.js cho phép gán giá trị mặc định ngay trong danh sách tham số. Go không có cú pháp này — muốn biết caller có "để trống" tham số hay không, bạn phải dùng con trỏ và kiểm tra `nil`.

## Giá trị mặc định cho tham số

:::tabs
```js
function greet(name = 'stranger') {
  return `hello ${name}`;
}

console.log(greet());      // hello stranger
console.log(greet('bob')); // hello bob
```
```go
package main

import "fmt"

// dùng con trỏ và kiểm tra nil để biết tham số có bị bỏ trống hay không
func greet(name *string) string {
	n := "stranger"
	if name != nil {
		n = *name
	}
	return fmt.Sprintf("hello %s", n)
}

func main() {
	fmt.Println(greet(nil)) // hello stranger

	name := "bob"
	fmt.Println(greet(&name)) // hello bob
}
```
:::
