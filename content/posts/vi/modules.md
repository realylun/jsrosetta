---
title: "Quản lý module"
description: "npm (package.json) của Node.js so với Go modules (go.mod) của Go: cài, cập nhật, gỡ và export/import package."
date: "2026-09-27"
order: 1070
category: stdlib
languages: [js, go]
versions:
  js: "19"
  go: "1.16"
tags: [modules, npm, go-modules, packages]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#modules"
---

Cả hai hệ sinh thái đều có một file khai báo dependency (`package.json` / `go.mod`) và một CLI để quản lý chúng. Khác biệt lớn nhất: npm có registry trung tâm, còn một Go module thường chỉ là một git repository — được tải về qua module proxy `GOPROXY` theo mặc định, có `GOPRIVATE` cho module riêng tư, nên không cần publish qua registry nào cả.

## Cài đặt, cập nhật và gỡ dependency

| Việc cần làm | npm (Node.js) | Go modules |
|---|---|---|
| Khởi tạo file quản lý dependency | `npm init` | `go mod init github.com/you/yourmodule` |
| Cài một package | `npm install uuid` | `go get github.com/google/uuid@v1.6.0` |
| Cài một CLI dùng toàn cục | `npm install -g <pkg>` | `go install pkg@latest` |
| Cập nhật lên bản mới nhất | `npm install uuid@latest` | `go get -u github.com/google/uuid` |
| Gỡ một package | `npm uninstall uuid` | `go get github.com/google/uuid@none` |
| Dọn dependency không dùng | `npm prune` | `go mod tidy` |
| Publish | `npm publish` | push code + tag release lên git repository |

## Import một package bên ngoài

:::tabs
```js
// import module
import { v4 as uuidv4 } from 'uuid'

const id = uuidv4()
console.log(id) // uuid ngẫu nhiên, khác nhau mỗi lần chạy
```
```go
package main

import (
	"fmt"

	// import module
	"github.com/google/uuid"
)

func main() {
	id := uuid.New()
	fmt.Println(id) // uuid ngẫu nhiên, khác nhau mỗi lần chạy
}
```
:::

## Export module của chính bạn

:::tabs
```js
// greeter.js — export module
export function greet(name) {
  console.log(`hello ${name}`)
}

// main.js — import module vừa export
import { greet } from './greeter.js'

greet('bob') // hello bob
```
```go
// greeter/greeter.go — export module
package greeter

import "fmt"

// Greet in ra lời chào tới name
func Greet(name string) {
	fmt.Printf("hello %s", name)
}

// main.go — import module vừa export
package main

import "github.com/you/yourmodule/greeter"

func main() {
	greeter.Greet("bob") // hello bob
}
```
:::

:::note
**Thay đổi (Go 1.16):** module mode là mặc định; không cần set `GO111MODULE=on` trước khi chạy `go mod init` nữa.
:::

:::note
**Thay đổi (Go 1.17, bắt buộc từ 1.18):** `go get` không còn build/install binary nữa — dùng `go install pkg@version` cho việc đó, và `go get pkg@none` để gỡ dependency (thay vì tự xoá thư mục cache dưới `$GOPATH/pkg/mod`). `go clean -modcache` xoá sạch cache module khi cần.
:::

:::note
`uuid` bản 14 chỉ là ESM và gọi `crypto` toàn cục của Web Crypto API — có sẵn không cần flag từ Node.js 19, đó là lý do version sàn là 19. `require('uuid')` vẫn chạy được từ Node.js ≥ 22.12 (và 20.19), nơi `require()` có thể load ES module.
:::
