---
title: "Parse URL"
description: "WHATWG URL của Node.js so với net/url.Parse của Go: lấy scheme, user info, port, path và query."
date: "2026-09-27"
order: 1030
category: stdlib
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [url, parsing, query-string]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#url-parse"
---

Cả hai ngôn ngữ đều parse URL thành các phần riêng: scheme, user info, host, port, path, query. Node.js dùng class `URL` toàn cục (chuẩn WHATWG); Go trả về một struct `*url.URL` với field và method tương ứng.

## Tách URL thành các phần

:::tabs
```js
const urlstr = "http://bob:secret@sub.example.com:8080/somepath?foo=bar";

const parsed = new URL(urlstr);
console.log(parsed.protocol); // http:
console.log(`${parsed.username}:${parsed.password}`); // bob:secret
console.log(parsed.port); // 8080
console.log(parsed.hostname); // sub.example.com
console.log(parsed.pathname); // /somepath
console.log(Object.fromEntries(parsed.searchParams)); // { foo: 'bar' }
```
```go
package main

import (
	"fmt"
	"net/url"
)

func main() {
	urlstr := "http://bob:secret@sub.example.com:8080/somepath?foo=bar"

	u, err := url.Parse(urlstr)
	if err != nil {
		panic(err)
	}

	fmt.Println(u.Scheme)     // http
	fmt.Println(u.User)       // bob:secret
	fmt.Println(u.Port())     // 8080
	fmt.Println(u.Hostname()) // sub.example.com
	fmt.Println(u.Path)       // /somepath
	fmt.Println(u.Query())    // map[foo:[bar]]
}
```
:::

:::warning
**Thay đổi (Node.js 24):** hàm `url.parse()` kiểu cũ giờ in cảnh báo deprecation lúc chạy (DEP0169; đã deprecated trong docs từ Node.js 19). Dùng class `URL` chuẩn WHATWG (có sẵn từ Node.js 10) cùng `URLSearchParams` như ví dụ trên, thay vì `url.parse()`.
:::
