---
title: "HTTP Server"
description: "http.createServer của Node.js so với net/http.HandleFunc và ServeMux pattern (Go 1.22+) để viết HTTP server có route."
date: "2026-09-27"
order: 980
category: io
languages: [js, go]
versions:
  js: "18"
  go: "1.22"
tags: [http, server, fetch, networking]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#http-server"
---

Cả hai ngôn ngữ đều có HTTP server ngay trong standard library, không cần framework để bắt đầu. Từ Go 1.22, `ServeMux` hỗ trợ luôn HTTP method (`GET`) và path pattern có wildcard (`{name}`), gần giống cách các routing framework vẫn làm.

## Server có route

:::tabs
```js
import http from 'node:http'

function handler(request, response) {
  response.writeHead(200, { 'Content-type':'text/plain' })
  response.write('hello world')
  response.end()
}

const server = http.createServer(handler)
server.listen(8080)
```
```go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("hello world"))
	})

	http.HandleFunc("GET /hello/{name}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "hello %s", r.PathValue("name"))
	})

	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}
}
```
:::

```bash
$ curl http://localhost:8080
hello world
```

Client (`http_client.js`, chạy trong khi một server ở trên đang bật): `fetch()` toàn cục thay cho `http.get()`/`http.request()` cho các request đơn giản.

```js
const response = await fetch('http://localhost:8080')
console.log(await response.text())
```

```bash
$ node http_client.js
hello world
```

```bash
# chỉ áp dụng cho Go server — JS server ở trên không có route /hello/{name}
$ curl http://localhost:8080/hello/gopher
hello gopher
```

:::note
Go 1.22 thêm hỗ trợ HTTP method và path pattern có wildcard (`{name}`) ngay trong `ServeMux` — kể cả pattern truyền cho `http.HandleFunc`, ví dụ `"GET /hello/{name}"`. Đoạn khớp với wildcard đọc lại bằng `r.PathValue("name")`. Trước 1.22, một pattern catch-all duy nhất phải tự parse method và path. Pattern mới yêu cầu `go.mod` khai `go 1.22` trở lên.
:::

:::note
`fetch()` toàn cục có sẵn không cần flag từ Node.js 18 — dùng để gọi server này thay cho `http.get()`/`http.request()` — nhưng ở trạng thái experimental cho tới khi ổn định ở Node.js 21. Riêng phần server thì chạy được từ Node.js ≥ 12.20.
:::
