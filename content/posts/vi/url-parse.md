---
title: "Parse URL"
description: "WHATWG URL của Node.js so với net/url (Go), crate url (Rust), URLComponents (Swift) và java.net.URI (Java): lấy scheme, user info, port, path và query."
date: "2026-09-27"
order: 1030
category: stdlib
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.63"
  swift: "4.0"
  java: "25"
tags: [url, parsing, query-string]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#url-parse"
---

Cả năm ngôn ngữ đều parse URL thành các phần riêng: scheme, user info, host, port, path, query. Node.js dùng class `URL` toàn cục (chuẩn WHATWG); Go trả về một struct `*url.URL` với field và method tương ứng. Rust không có URL parser trong std nên dùng crate `url` (cùng nhóm servo, cũng theo chuẩn WHATWG như Node.js). Swift dùng `URLComponents` của Foundation. Java dùng `java.net.URI` có sẵn — nhưng không có sẵn hàm parse query string thành map như bốn ngôn ngữ kia.

## Tách URL thành các phần

:::tabs
```js
const urlstr = 'http://bob:secret@sub.example.com:8080/somepath?foo=bar'

const parsed = new URL(urlstr)
console.log(parsed.protocol) // http:
console.log(`${parsed.username}:${parsed.password}`) // bob:secret
console.log(parsed.port) // 8080
console.log(parsed.hostname) // sub.example.com
console.log(parsed.pathname) // /somepath
console.log(Object.fromEntries(parsed.searchParams)) // { foo: 'bar' }
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
```rust
// Cargo.toml: url = "2"
use std::collections::HashMap;

use url::Url;

fn main() {
    let urlstr = "http://bob:secret@sub.example.com:8080/somepath?foo=bar";

    let u = Url::parse(urlstr).unwrap();
    println!("{}:", u.scheme()); // http:
    println!("{}:{}", u.username(), u.password().unwrap_or("")); // bob:secret
    println!("{}", u.port().unwrap()); // 8080
    println!("{}", u.host_str().unwrap()); // sub.example.com
    println!("{}", u.path()); // /somepath

    let query: HashMap<_, _> = u.query_pairs().into_owned().collect();
    println!("{query:?}"); // {"foo": "bar"}
}
```
```swift
import Foundation

let urlstr = "http://bob:secret@sub.example.com:8080/somepath?foo=bar"

let components = URLComponents(string: urlstr)!
print("\(components.scheme ?? ""):") // http:
print("\(components.user ?? ""):\(components.password ?? "")") // bob:secret
print(components.port ?? 0) // 8080
print(components.host ?? "") // sub.example.com
print(components.path) // /somepath

let query = Dictionary((components.queryItems ?? []).map { ($0.name, $0.value ?? "") }, uniquingKeysWith: { _, last in last }) // key trùng thì lấy giá trị cuối, tránh crash như uniqueKeysWithValues
print(query) // ["foo": "bar"]
```
```java
void main() {
    String urlstr = "http://bob:secret@sub.example.com:8080/somepath?foo=bar";

    URI u = URI.create(urlstr);
    IO.println(u.getScheme() + ":"); // http:
    IO.println(u.getUserInfo()); // bob:secret
    IO.println(u.getPort()); // 8080
    IO.println(u.getHost()); // sub.example.com
    IO.println(u.getPath()); // /somepath

    // java.net.URI không có sẵn hàm parse query string
    Map<String, String> query = new LinkedHashMap<>();
    for (String pair : u.getQuery().split("&")) {
        String[] kv = pair.split("=", 2);
        query.put(kv[0], kv.length > 1 ? kv[1] : ""); // cờ trần không có "=" thì giá trị là chuỗi rỗng
    }
    IO.println(query); // {foo=bar}
}
```
:::

:::warning
**Thay đổi (Node.js 24):** hàm `url.parse()` kiểu cũ giờ in cảnh báo deprecation lúc chạy (DEP0169; đã deprecated trong docs từ Node.js 19). Dùng class `URL` chuẩn WHATWG (toàn cục từ Node.js 10) cùng `URLSearchParams` như ví dụ trên, thay vì `url.parse()`.
:::

:::tip
Crate `url` của Rust theo cùng chuẩn WHATWG với `URL` của Node.js, nên hành vi parse (normalize host, encode ký tự đặc biệt…) rất giống nhau giữa hai bên.
:::
