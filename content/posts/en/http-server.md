---
title: "HTTP Server"
description: "How Node.js's http.createServer compares to ServeMux (Go 1.22+), axum (Rust), Network.framework (Swift), and HttpServer (Java) for a routed HTTP server."
tags: [http, server, fetch, networking]
---

Node.js and Go ship an HTTP server right in their standard library — no framework needed to get started. Rust's std doesn't — it needs a crate like `axum` (routing + path params as concise as Go's `ServeMux`). Swift is the same: Foundation has no HTTP server, so the example below parses just the first request line by hand over `Network.framework` — good enough for a demo, not a spec-compliant HTTP server. Java has had `com.sun.net.httpserver.HttpServer` (the `jdk.httpserver` module) for a long time, matching paths by prefix rather than a pattern with wildcards.

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
```rust
// Cargo.toml: axum = "0.8"
// Cargo.toml: tokio = { version = "1", features = ["full"] }
use axum::extract::Path;
use axum::routing::get;
use axum::Router;

async fn hello(Path(name): Path<String>) -> String {
    format!("hello {name}")
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(|| async { "hello world" }))
        .route("/hello/{name}", get(hello));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```
```swift
import Network

let listener = try NWListener(using: .tcp, on: 8080)

listener.newConnectionHandler = { connection in
    connection.start(queue: .main)
    connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { data, _, _, _ in
        guard let data, let request = String(data: data, encoding: .utf8) else { return }
        let path = request.split(separator: " ")[1] // "GET /hello/neko HTTP/1.1" -> "/hello/neko"

        let body: String
        if path == "/" {
            body = "hello world"
        } else if path.hasPrefix("/hello/") {
            body = "hello \(path.dropFirst("/hello/".count))"
        } else {
            body = "not found"
        }

        let response = "HTTP/1.1 200 OK\r\nContent-Length: \(body.utf8.count)\r\n\r\n\(body)"
        connection.send(content: response.data(using: .utf8), completion: .contentProcessed { _ in connection.cancel() })
    }
}

listener.start(queue: .main)
dispatchMain()
```
```java
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;

void main() throws Exception {
    var server = HttpServer.create(new InetSocketAddress(8080), 0);

    server.createContext("/", exchange -> {
        byte[] body = "hello world".getBytes();
        exchange.sendResponseHeaders(200, body.length);
        exchange.getResponseBody().write(body);
        exchange.close();
    });

    server.createContext("/hello/", exchange -> { // prefix match, no {name} pattern like ServeMux
        String name = exchange.getRequestURI().getPath().substring("/hello/".length());
        byte[] body = ("hello " + name).getBytes();
        exchange.sendResponseHeaders(200, body.length);
        exchange.getResponseBody().write(body);
        exchange.close();
    });

    server.start();
}
```
:::

```bash
$ curl http://localhost:8080
hello world
```

Client (`http_client.js`, run while a server from above is up): the global `fetch()` replaces `http.get()`/`http.request()` for simple requests.

:::tabs
```js
const response = await fetch('http://localhost:8080')
console.log(await response.text())
```
```go
package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	res, err := http.Get("http://localhost:8080")
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		panic(err)
	}
	fmt.Println(string(body))
}
```
```rust
// Cargo.toml: reqwest = "0.12"
// Cargo.toml: tokio = { version = "1", features = ["full"] }
#[tokio::main]
async fn main() {
    let body = reqwest::get("http://localhost:8080").await.unwrap().text().await.unwrap();
    println!("{body}");
}
```
```swift
import Foundation

let (data, _) = try await URLSession.shared.data(from: URL(string: "http://localhost:8080")!)
print(String(data: data, encoding: .utf8)!)
```
```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

void main() throws Exception {
    var client = HttpClient.newHttpClient();
    var request = HttpRequest.newBuilder(URI.create("http://localhost:8080")).build();

    var response = client.send(request, HttpResponse.BodyHandlers.ofString());
    IO.println(response.body());
}
```
:::

```bash
$ node http_client.js
hello world
```

```bash
# only applies to the servers with a /hello/{name} route (Go, Rust, Swift, Java) — the JS server above has no such route
$ curl http://localhost:8080/hello/gopher
hello gopher
```

:::note
Go 1.22 added support for an HTTP method and wildcard path segments (`{name}`) directly in `ServeMux` — including the pattern passed to `http.HandleFunc`, e.g. `"GET /hello/{name}"`. The matched wildcard segment is read back with `r.PathValue("name")`. Before 1.22, a single catch-all pattern had to parse the method and path by hand. The new patterns require `go 1.22`+ in go.mod.
:::

:::note
The global `fetch()` is available without a flag since Node.js 18 — used here to call this server instead of `http.get()`/`http.request()` — but it stayed experimental until it became stable in Node.js 21. The server part alone runs on Node.js ≥ 12.20.
:::

:::note
`axum` 0.8 (early 2025) changed its path parameter syntax from `:name` to `{name}` to match `format!()` and other frameworks — which happens to line up neatly with Go 1.22's new wildcard syntax. `axum` requires Rust 1.80+ (MSRV).
:::

:::note
Swift/Foundation has no HTTP server type at all — the example above only reads enough of the first request line (`"METHOD /path HTTP/1.1"`) over `Network.framework` to route manually; it doesn't parse headers or support keep-alive. A real project should reach for a package like Hummingbird or Vapor instead. The `guard let data, let request = …` shorthand needs Swift 5.7+; `URLSession.shared.data(from:)` (async) needs Swift 5.5+ and macOS 12+.
:::
