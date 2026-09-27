---
title: "Hoán đổi biến"
description: "Hoán đổi hai biến bằng destructuring mảng trong Node.js so với gán nhiều biến trong Go."
date: "2026-09-27"
order: 540
category: functions
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [swap, multiple-assignment]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#swapping"
---

Node.js hoán đổi hai biến bằng array destructuring, không cần biến tạm. Go làm y hệt bằng gán nhiều biến cùng lúc — cũng không cần biến tạm.

## Hoán đổi hai biến

:::tabs
```js
let a = 'foo';
let b = 'bar';

console.log(a, b); // foo bar

[b, a] = [a, b];

console.log(a, b); // bar foo
```
```go
package main

import "fmt"

func main() {
	a := "foo"
	b := "bar"

	fmt.Println(a, b) // foo bar

	b, a = a, b

	fmt.Println(a, b) // bar foo
}
```
:::
