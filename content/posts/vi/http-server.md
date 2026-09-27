---
title: "HTTP Server"
description: "http.createServer của Node.js so với ServeMux (Go 1.22+), axum (Rust), Network.framework (Swift) và HttpServer (Java) để viết HTTP server có route."
date: "2026-09-27"
order: 980
category: io
languages: [js, go, rust, swift, java]
versions:
  js: "18"
  go: "1.22"
  rust: "1.80"
  swift: "5.7"
  java: "25"
tags: [http, server, fetch, networking]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#http-server"
---

Node.js và Go có HTTP server ngay trong standard library, không cần framework để bắt đầu. Rust std thì không — cần một crate như `axum` (routing + path param gọn như `ServeMux` của Go). Swift cũng vậy: Foundation không có HTTP server, ví dụ dưới đây tự parse dòng request đầu tiên qua `Network.framework` — đủ cho demo, không phải một HTTP server đúng chuẩn. Java có `com.sun.net.httpserver.HttpServer` (module `jdk.httpserver`) từ lâu, khớp path theo tiền tố thay vì pattern có wildcard.

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

    server.createContext("/hello/", exchange -> { // khớp theo tiền tố, không có {name} như ServeMux
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

Client (`http_client.js`, chạy trong khi một server ở trên đang bật): `fetch()` toàn cục thay cho `http.get()`/`http.request()` cho các request đơn giản.

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
# chỉ áp dụng cho các server có route /hello/{name} (Go, Rust, Swift, Java) — JS server ở trên không có route này
$ curl http://localhost:8080/hello/gopher
hello gopher
```

:::note
Go 1.22 thêm hỗ trợ HTTP method và path pattern có wildcard (`{name}`) ngay trong `ServeMux` — kể cả pattern truyền cho `http.HandleFunc`, ví dụ `"GET /hello/{name}"`. Đoạn khớp với wildcard đọc lại bằng `r.PathValue("name")`. Trước 1.22, một pattern catch-all duy nhất phải tự parse method và path. Pattern mới yêu cầu `go.mod` khai `go 1.22` trở lên.
:::

:::note
`fetch()` toàn cục có sẵn không cần flag từ Node.js 18 — dùng để gọi server này thay cho `http.get()`/`http.request()` — nhưng ở trạng thái experimental cho tới khi ổn định ở Node.js 21. Riêng phần server thì chạy được từ Node.js ≥ 12.20.
:::

:::note
`axum` 0.8 (đầu 2025) đổi cú pháp path param từ `:name` sang `{name}` để khớp với `format!()` và các framework khác — tình cờ trùng luôn với cú pháp wildcard mới của Go 1.22. `axum` yêu cầu Rust 1.80+ (MSRV).
:::

:::note
Swift/Foundation không có kiểu HTTP server nào cả — ví dụ trên chỉ đọc đủ dòng request đầu tiên (`"METHOD /path HTTP/1.1"`) qua `Network.framework` để định tuyến thủ công, không parse header hay hỗ trợ keep-alive; một dự án thật nên dùng package như Hummingbird hoặc Vapor. Cú pháp `guard let data, let request = …` cần Swift 5.7+; `URLSession.shared.data(from:)` (async) cần Swift 5.5+ và macOS 12+.
:::
