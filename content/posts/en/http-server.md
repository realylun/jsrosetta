---
title: "HTTP Server"
description: "How Node.js's http.createServer compares to Go's net/http.HandleFunc and the Go 1.22+ ServeMux pattern for a routed HTTP server."
tags: [http, server, fetch, networking]
---

Both languages ship an HTTP server right in their standard library — no framework needed to get started. Since Go 1.22, `ServeMux` also supports an HTTP method (`GET`) and wildcard path segments (`{name}`), much like what routing frameworks have always done.

## Routed server

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

Client (`http_client.js`, run while a server from above is up): the global `fetch()` replaces `http.get()`/`http.request()` for simple requests.

```js
const response = await fetch('http://localhost:8080')
console.log(await response.text())
```

```bash
$ node http_client.js
hello world
```

```bash
# Go-server only — the JS server above has no /hello/{name} route
$ curl http://localhost:8080/hello/gopher
hello gopher
```

:::note
Go 1.22 added support for an HTTP method and wildcard path segments (`{name}`) directly in `ServeMux` — including the pattern passed to `http.HandleFunc`, e.g. `"GET /hello/{name}"`. The matched wildcard segment is read back with `r.PathValue("name")`. Before 1.22, a single catch-all pattern had to parse the method and path by hand. The new patterns require `go 1.22`+ in go.mod.
:::

:::note
The global `fetch()` is available without a flag since Node.js 18 — used here to call this server instead of `http.get()`/`http.request()` — but it stayed experimental until it became stable in Node.js 21. The server part alone runs on Node.js ≥ 12.20.
:::
