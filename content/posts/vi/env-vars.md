---
title: "Biến môi trường"
description: "process.env của Node.js so với os.Getenv của Go để đọc biến môi trường."
date: "2026-09-27"
order: 940
category: io
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [env, environment-variables, config, io]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#env-vars"
---

Đọc biến môi trường là một trong những thao tác I/O đơn giản nhất, nhưng cách truy cập khác nhau đôi chút: Node.js coi `process.env` như một object, còn Go dùng hàm `os.Getenv` trả về chuỗi rỗng nếu biến không tồn tại.

## Đọc biến môi trường

:::tabs
```js
const key = process.env['API_KEY']

console.log(key)
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	key := os.Getenv("API_KEY")

	fmt.Println(key)
}
```
:::

```bash
$ API_KEY=foobar node env_vars.js
foobar

$ API_KEY=foobar go run env_vars.go
foobar
```
