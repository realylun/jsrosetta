---
title: "Regex"
description: "RegExp literal của Node.js so với package regexp (compile trước) của Go: replace, test và tìm tất cả match."
date: "2026-09-27"
order: 1010
category: stdlib
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [regex, regexp, pattern-matching]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#regex"
---

Node.js viết regex bằng literal `/pattern/flags` ngay trong code. Go không có cú pháp literal cho regex — bạn compile pattern thành `*regexp.Regexp` bằng `regexp.MustCompile`, và flag như case-insensitive nằm ngay trong chuỗi pattern (`(?i)`) thay vì đứng ngoài như `/i`.

## Replace, test và tìm tất cả match

:::tabs
```js
let input = 'foobar'
let replaced = input.replace(/foo(.*)/i, 'qux$1')
console.log(replaced) // quxbar

let match = /o{2}/i.test(input)
console.log(match) // true

input = '111-222-333'
let matches = input.match(/([0-9]+)/gi)
console.log(matches) // [ '111', '222', '333' ]
```
```go
package main

import (
	"fmt"
	"regexp"
)

func main() {
	input := "foobar"
	re := regexp.MustCompile(`(?i)foo(.*)`) // (?i): case-insensitive, viết trong pattern
	replaced := re.ReplaceAllString(input, "qux$1")
	fmt.Println(replaced) // quxbar

	re = regexp.MustCompile(`(?i)o{2}`)
	match := re.Match([]byte(input))
	fmt.Println(match) // true

	input = "111-222-333"
	re = regexp.MustCompile(`(?i)([0-9]+)`)
	matches := re.FindAllString(input, -1)
	fmt.Println(matches) // [111 222 333]
}
```
:::

:::tip
Go dùng raw string literal (đặt trong dấu backtick) cho pattern, nên khỏi cần escape dấu `\` như trong chuỗi thường (`"\\d+"` → `` `\d+` ``).
:::
