---
title: "Tra cứu DNS"
description: "node:dns/promises của Node.js so với package net (LookupNS/LookupIP/LookupMX/LookupTXT) của Go để tra cứu DNS."
date: "2026-09-27"
order: 990
category: io
languages: [js, go]
versions:
  js: "15"
  go: "1.9"
tags: [dns, lookup, networking, io]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#dns"
---

Tra cứu DNS (NS, A/AAAA, MX, TXT) đều có sẵn trong standard library của cả hai ngôn ngữ, không cần thư viện ngoài. Muốn đổi DNS resolver server, Node.js gọi `dns.setServers()`, còn Go phải tự tạo một `net.Resolver` tuỳ chỉnh với hàm `Dial` riêng.

## Tra cứu NS, IP, MX, TXT

:::tabs
```js
import dns from 'node:dns/promises'

const ns = await dns.resolveNs('google.com')
console.log(ns)

const ips = await dns.resolve4('google.com')
console.log(ips)

const mx = await dns.resolveMx('google.com')
console.log(mx)

const txt = await dns.resolveTxt('google.com')
console.log(txt)
```
```go
package main

import (
	"fmt"
	"net"
)

func main() {
	ns, err := net.LookupNS("google.com")
	if err != nil {
		panic(err)
	}
	for _, n := range ns {
		fmt.Println(n.Host)
	}

	ips, err := net.LookupIP("google.com")
	if err != nil {
		panic(err)
	}
	fmt.Println(ips)

	mx, err := net.LookupMX("google.com")
	if err != nil {
		panic(err)
	}
	for _, m := range mx {
		fmt.Println(m.Host, m.Pref)
	}

	txt, err := net.LookupTXT("google.com")
	if err != nil {
		panic(err)
	}
	fmt.Println(txt)
}
```
:::

```bash
# kết quả DNS thay đổi theo thời điểm tra cứu, TXT được rút gọn bằng …
ns2.google.com
[142.251.12.138 142.251.12.102 …]
smtp.google.com 10
[v=spf1 include:_spf.google.com ~all …]
```

:::note
Node.js 15 làm cho promise API import được trực tiếp qua `node:dns/promises` (trước đó chỉ có `dns.promises`); nhờ top-level `await`, mỗi lần tra cứu chạy tuần tự theo đúng thứ tự `await`, thay vì phải lồng callback.
:::

## Đổi DNS resolver server

:::tabs
```js
dns.setServers(['1.1.1.1'])
console.log(dns.getServers())

const ns2 = await dns.resolveNs('google.com')
console.log(ns2)
```
```go
// thêm import "context", "time" vào cùng file với ví dụ ở trên
r := &net.Resolver{
	PreferGo: true,
	Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
		d := net.Dialer{
			Timeout: 10 * time.Second,
		}
		return d.DialContext(ctx, "udp", "1.1.1.1:53")
	},
}

ns, err := r.LookupNS(context.Background(), "google.com")
if err != nil {
	panic(err)
}
for _, n := range ns {
	fmt.Println(n.Host)
}
```
:::

:::note
Field `Dial` của `net.Resolver` — dùng ở trên để gửi truy vấn tới `1.1.1.1` thay vì resolver mặc định của hệ thống — được thêm từ Go 1.9.
:::
