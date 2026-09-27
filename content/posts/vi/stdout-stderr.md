---
title: "Ghi ra Stdout và Stderr"
description: "process.stdout.write/process.stderr.write của Node.js so với fmt.Fprint(os.Stdout, …)/fmt.Fprint(os.Stderr, …) của Go."
date: "2026-09-27"
order: 910
category: io
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [stdout, stderr, io, printing]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#stdout"
---

`console.log`/`console.error` đã đủ dùng hầu hết thời gian, nhưng đôi khi bạn cần ghi thẳng vào stream mà không thêm dấu xuống dòng hay định dạng thừa. Cả Node.js và Go đều cho phép ghi trực tiếp vào stdout/stderr như một stream/writer.

## Ghi ra stdout

:::tabs
```js
process.stdout.write('hello world\n')
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Fprint(os.Stdout, "hello world\n")
}
```
:::

```bash
hello world
```

## Ghi ra stderr

:::tabs
```js
process.stderr.write('hello error\n')
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Fprint(os.Stderr, "hello error\n")
}
```
:::

```bash
hello error
```
