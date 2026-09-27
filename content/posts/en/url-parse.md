---
title: "URL Parsing"
description: "Node.js's WHATWG URL compared to Go's net/url, Rust's url crate, Swift's URLComponents, and Java's java.net.URI: getting the scheme, user info, port, path, and query."
tags: [url, parsing, query-string]
---

All five languages parse a URL into its separate parts: scheme, user info, host, port, path, query. Node.js uses the global `URL` class (the WHATWG standard); Go returns a `*url.URL` struct with corresponding fields and methods. Rust has no URL parser in std, so it uses the `url` crate (from the Servo project, also WHATWG-compliant like Node.js). Swift uses Foundation's `URLComponents`. Java uses the built-in `java.net.URI` — but unlike the other four, it has no built-in function to turn the query string into a map.

## Splitting a URL into parts

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

let query = Dictionary((components.queryItems ?? []).map { ($0.name, $0.value ?? "") }, uniquingKeysWith: { _, last in last }) // duplicate keys keep the last value, avoiding a crash like uniqueKeysWithValues would
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

    // java.net.URI has no built-in query-string parser
    Map<String, String> query = new LinkedHashMap<>();
    for (String pair : u.getQuery().split("&")) {
        String[] kv = pair.split("=", 2);
        query.put(kv[0], kv.length > 1 ? kv[1] : ""); // a bare flag with no "=" gets an empty value
    }
    IO.println(query); // {foo=bar}
}
```
:::

:::warning
**Changed (Node.js 24):** the legacy `url.parse()` function now prints a runtime deprecation warning (DEP0169; documentation-only deprecated since Node.js 19). Use the WHATWG `URL` class (global since Node.js 10) with `URLSearchParams` as shown above instead of `url.parse()`.
:::

:::tip
Rust's `url` crate follows the same WHATWG standard as Node.js's `URL`, so parsing behavior (host normalization, percent-encoding, …) matches closely between the two.
:::
