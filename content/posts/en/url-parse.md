---
title: "URL Parsing"
description: "Node.js's WHATWG URL compared to Go's net/url.Parse: getting the scheme, user info, port, path, and query."
tags: [url, parsing, query-string]
---

Both languages parse a URL into its separate parts: scheme, user info, host, port, path, query. Node.js uses the global `URL` class (the WHATWG standard); Go returns a `*url.URL` struct with corresponding fields and methods.

## Splitting a URL into parts

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
**Changed (Node.js 24):** the legacy `url.parse()` function now prints a runtime deprecation warning (DEP0169; documentation-only deprecated since Node.js 19). Use the WHATWG `URL` class (global since Node.js 10) with `URLSearchParams` as shown above instead of `url.parse()`.
:::
