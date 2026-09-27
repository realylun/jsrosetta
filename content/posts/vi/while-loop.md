---
title: "Vòng lặp While"
description: "Vòng lặp while của JavaScript tương ứng với for dùng làm while trong Go (Go không có từ khoá while)."
date: "2026-09-27"
order: 320
category: control-flow
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [while-loop, for, control-flow]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#while"
---

Go không có từ khoá `while`. Cùng chức năng đó đạt được bằng `for` chỉ với điều kiện, bỏ luôn phần `init` và `post`.

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
:::

```bash
0
1
2
3
4
5
```
