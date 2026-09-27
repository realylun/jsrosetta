---
title: "Logging"
description: "console.log kèm timestamp trong Node.js so với log/log-slog (Go), crate tracing (Rust), Foundation (Swift) và System.Logger (Java)."
date: "2026-09-27"
order: 120
category: basics
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.21"
  rust: "1.65"
  swift: "4.0"
  java: "25"
tags: [logging, slog, structured-logging]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#logging"
---

Node.js không có logger dựng sẵn: muốn có timestamp hay output dạng JSON thì tự ghép bằng `console.log`. Go có package `log` (tự thêm ngày giờ vào mỗi dòng), và từ Go 1.21 có thêm `log/slog` cho logging có cấu trúc, theo level. Rust không có logger nào trong std — phải dùng crate ngoài (`tracing`). Swift cũng không có logger có cấu trúc dựng sẵn (Apple có `os.Logger` nhưng ghi vào system log, Apple-only, không ra stdout). Java lại có sẵn `System.Logger` trong `java.base` từ Java 9.

## Log kèm timestamp và log dạng JSON

:::tabs
```js
console.log((new Date()).toISOString(), 'hello world')

// output có cấu trúc (JSON) — Node.js không có logger cấu trúc dựng sẵn, nên
// log một object thường ra dạng JSON là cách làm baseline phổ biến
console.log(JSON.stringify({ level: 'info', msg: 'hello world', time: new Date().toISOString() }))
```
```go
package main

import (
	"log"
	"log/slog"
)

func main() {
	// Package `log` ghi ra stderr và tự thêm ngày giờ vào mỗi dòng log
	log.Println("hello world")

	// log/slog bổ sung logging có cấu trúc, theo level vào standard library
	slog.Info("hello world", "count", 1)
}
```
```rust
// Cargo.toml: tracing = "0.1", tracing-subscriber = { version = "0.3", features = ["json"] }
use tracing::info;
use tracing_subscriber::fmt;

fn main() {
    // định dạng mặc định: tự thêm timestamp + level
    let plain = fmt().with_ansi(false).finish();
    tracing::subscriber::with_default(plain, || {
        info!("hello world");
    });

    // log có cấu trúc (JSON), theo level
    let json = fmt().json().finish();
    tracing::subscriber::with_default(json, || {
        info!(count = 1, "hello world");
    });
}
```
```swift
import Foundation

struct LogEntry: Encodable {
    let level: String
    let msg: String
    let time: String
}

let timestamp = ISO8601DateFormatter().string(from: Date())
print(timestamp, "hello world")

// log có cấu trúc (JSON) — Swift không có logger cấu trúc dựng sẵn giống Go's slog, nên
// encode một struct Codable ra JSON là cách làm phổ biến (giống việc Node.js tự JSON.stringify)
let encoder = JSONEncoder()
encoder.outputFormatting = .sortedKeys // thứ tự key mặc định không đảm bảo, ép về alphabet cho ổn định
let entry = LogEntry(level: "info", msg: "hello world", time: timestamp)
let data = try! encoder.encode(entry)
print(String(data: data, encoding: .utf8)!)
```
```java
void main() {
    // System.Logger là API logging của java.base, tự thêm timestamp qua backend console mặc định
    System.Logger logger = System.getLogger("example");
    logger.log(System.Logger.Level.INFO, "hello world");

    // log có cấu trúc (JSON) — java.base không có JSON builder dựng sẵn, nên tự build chuỗi
    // là cách làm phổ biến (giống Node.js), hoặc thêm thư viện như Jackson cho ứng dụng lớn hơn
    String time = Instant.now().toString();
    String json = "{\"level\":\"info\",\"msg\":\"hello world\",\"time\":\"%s\"}".formatted(time);
    IO.println(json);
}
```
:::

```bash
# Node.js
2026-09-27T12:55:39.470Z hello world
{"level":"info","msg":"hello world","time":"2026-09-27T12:55:39.471Z"}

# Go
2026/09/27 19:55:40 hello world
2026/09/27 19:55:40 INFO hello world count=1

# Rust
2026-09-27T18:03:27.401099Z  INFO logging: hello world
{"timestamp":"2026-09-27T18:03:27.401360Z","level":"INFO","fields":{"message":"hello world","count":1},"target":"logging"}

# Swift
2026-09-27T18:04:28Z hello world
{"level":"info","msg":"hello world","time":"2026-09-27T18:04:28Z"}

# Java
Sep 28, 2026 1:05:00 AM Main main
INFO: hello world
{"level":"info","msg":"hello world","time":"2026-09-27T18:05:00.428159Z"}
```

_(timestamp sẽ khác nhau mỗi lần chạy)_

:::note
Go 1.21 thêm `log/slog`: logging có cấu trúc, theo level (`Info`/`Warn`/`Error`, key-value attributes) ngay trong standard library. Nên ưu tiên `slog` thay vì tự format chuỗi `key=value` bằng `log`.
:::

:::warning
Rust không có logger nào trong std, kể cả facade như `log`. Crate `tracing` (kèm `tracing-subscriber`) là lựa chọn phổ biến nhất, hỗ trợ cả format text lẫn JSON. `os.Logger` của Apple (framework `os`) trông giống lựa chọn tự nhiên cho Swift, nhưng nó chỉ ghi vào system log (xem qua Console.app/`log stream`), không in ra stdout, nên không dùng được cho ví dụ này — package cộng đồng `swift-log` là lựa chọn cross-platform cho ứng dụng thật.
:::
