---
title: "Exception chưa bắt (uncaughtException)"
description: "process.on('uncaughtException') của Node.js so với panic/recover trong Go khi một lỗi thoát khỏi mọi xử lý thông thường."
date: "2026-09-27"
order: 810
category: errors
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [exception, panic, recover, error-handling]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#exceptions"
---

Bài [xử lý lỗi và try/catch](/posts/errors) đã nói về `throw`/`try`/`catch` cho luồng xử lý lỗi thông thường. Ở đây là trường hợp khác: một lỗi *thoát khỏi mọi try/catch* và bay thẳng tới top-level — cơ chế bắt cuối cùng trước khi tiến trình sập.

## Bắt exception ở top-level (uncaughtException vs recover)

:::tabs
```js
process.on("uncaughtException", (err) => {
  console.log(`caught exception: ${err.message}`); // → caught exception: my exception
  process.exit(1); // log, dọn dẹp rồi exit: cố chạy tiếp sau lỗi này là không an toàn
});

function foo() {
  throw new Error("my exception");
}

function main() {
  foo();
}

main();
// exit code: 1
```
```go
package main

import (
	"fmt"
)

func foo() {
	panic("my exception")
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("caught exception: %s", r) // → caught exception: my exception
		}
	}()

	foo()
}
```
:::

:::warning
`'uncaughtException'` là phương án cuối cùng, không phải `recover()`: tài liệu Node.js nói rằng tiến trình ở trạng thái không xác định sau đó — hãy log, dọn dẹp rồi thoát với mã khác 0, thay vì cố chạy tiếp.
:::
