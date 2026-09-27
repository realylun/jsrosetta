---
title: "In ra output"
description: "console.log/console.error trong Node.js tương ứng với fmt.Println/fmt.Printf/fmt.Fprintf trong Go."
date: "2026-09-27"
order: 110
category: basics
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [printing, stdout, stderr]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#printing"
---

`console.log` in ra stdout, `console.error` in ra stderr. Go tách các hàm rõ ràng hơn: `fmt.Println` in kèm xuống dòng, `fmt.Printf` nhận format string kiểu C, còn `fmt.Fprintf` ghi vào bất kỳ `io.Writer` nào — kể cả `os.Stderr`.

## In ra stdout và stderr

:::tabs
```js
console.log('print to stdout')
console.log('format %s %d', 'example', 1)
console.error('print to stderr')
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Println("print to stdout")
	fmt.Printf("format %s %v\n", "example", 1)
	fmt.Fprintf(os.Stderr, "print to stderr")
}
```
:::

```bash
print to stdout
format example 1
print to stderr
```
