---
title: "Stack Trace"
description: "console.trace() của Node.js so với debug.Stack() sau recover() trong Go để in stack trace khi bắt lỗi."
date: "2026-09-27"
order: 820
category: errors
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [stack-trace, debugging, panic, error-handling]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#stack-trace"
---

Khi một lỗi bị bắt, đôi lúc bạn cần in ra cả đường đi của lời gọi hàm dẫn tới nó, không chỉ mỗi message. Node.js có `console.trace()` sẵn trong global; Go cần gọi `runtime/debug.Stack()` bên trong hàm `recover()` để lấy chuỗi đó dưới dạng text.

## In stack trace khi bắt lỗi (console.trace vs debug.Stack)

:::tabs
```js
function foo() {
  throw new Error("failed");
}

try {
  foo();
} catch (err) {
  console.trace(err);
}
// → Trace: Error: failed
// →     at foo (file:///…/stack-trace.js:2:9)
// →     at file:///…/stack-trace.js:6:3
// →     … (đường dẫn file và số dòng khác nhau tuỳ máy và phiên bản Node.js)
```
```go
package main

import (
	"errors"
	"fmt"
	"runtime/debug"
)

func foo() {
	panic(errors.New("failed"))
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println(string(debug.Stack()))
		}
	}()

	foo()
}
// → goroutine 1 [running]:
// → main.foo(...)
// →     /…/stack-trace.go:10
// → main.main()
// →     /…/stack-trace.go:15 +0x6c
// → … (địa chỉ và offset khác nhau tuỳ máy và phiên bản Go)
```
:::
