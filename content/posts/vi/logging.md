---
title: "Logging"
description: "console.log kèm timestamp trong Node.js so với package log và log/slog (structured logging) trong Go."
date: "2026-09-27"
order: 120
category: basics
languages: [js, go]
versions:
  js: "12.20"
  go: "1.21"
tags: [logging, slog, structured-logging]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#logging"
---

Node.js không có logger dựng sẵn: muốn có timestamp hay output dạng JSON thì tự ghép bằng `console.log`. Go có package `log` (tự thêm ngày giờ vào mỗi dòng), và từ Go 1.21 có thêm `log/slog` cho logging có cấu trúc, theo level.

## Log kèm timestamp và log dạng JSON

:::tabs
```js
console.log((new Date()).toISOString(), 'hello world')

// output có cấu trúc (JSON) — Node.js không có logger cấu trúc dựng sẵn, nên
// log một object thường ra dạng JSON là cách làm baseline phổ biến
console.log(JSON.stringify({ level: 'info', msg: 'hello world', time: new Date().toISOString() }))
```
```go
package main

import (
	"log"
	"log/slog"
)

func main() {
	// Package `log` ghi ra stderr và tự thêm ngày giờ vào mỗi dòng log
	log.Println("hello world")

	// log/slog bổ sung logging có cấu trúc, theo level vào standard library
	slog.Info("hello world", "count", 1)
}
```
:::

```bash
2026-09-27T12:55:39.470Z hello world
{"level":"info","msg":"hello world","time":"2026-09-27T12:55:39.471Z"}

2026/09/27 19:55:40 hello world
2026/09/27 19:55:40 INFO hello world count=1
```

_(timestamp sẽ khác nhau mỗi lần chạy)_

:::note
Go 1.21 thêm `log/slog`: logging có cấu trúc, theo level (`Info`/`Warn`/`Error`, key-value attributes) ngay trong standard library. Nên ưu tiên `slog` thay vì tự format chuỗi `key=value` bằng `log`.
:::
