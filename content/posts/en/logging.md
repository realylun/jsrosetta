---
title: "Logging"
description: "How ad-hoc timestamped console.log in Node.js compares to Go's log/log-slog, Rust's tracing crate, Swift's Foundation, and Java's System.Logger."
tags: [logging, slog, structured-logging]
---

Node.js has no bundled logger: if you want a timestamp or JSON output, you assemble it yourself with `console.log`. Go has the `log` package (which prepends a date and time to every line), and since Go 1.21 there's also `log/slog` for structured, leveled logging. Rust has no logger in std at all — you reach for an external crate (`tracing`). Swift also has no bundled structured logger (Apple's `os.Logger` writes to the system log, Apple-only, not to stdout). Java has `System.Logger` built into `java.base` since Java 9.

## Timestamped logging and JSON logging

:::tabs
```js
console.log((new Date()).toISOString(), 'hello world')

// structured (JSON) output — Node.js has no bundled structured logger, so
// logging a plain object as JSON is the common baseline
console.log(JSON.stringify({ level: 'info', msg: 'hello world', time: new Date().toISOString() }))
```
```go
package main

import (
	"log"
	"log/slog"
)

func main() {
	// Package `log` writes to standard error and prints the date and time of each logged message
	log.Println("hello world")

	// log/slog adds structured, leveled logging to the standard library
	slog.Info("hello world", "count", 1)
}
```
```rust
// Cargo.toml: tracing = "0.1", tracing-subscriber = { version = "0.3", features = ["json"] }
use tracing::info;
use tracing_subscriber::fmt;

fn main() {
    // default format: adds a timestamp + level automatically
    let plain = fmt().with_ansi(false).finish();
    tracing::subscriber::with_default(plain, || {
        info!("hello world");
    });

    // structured (JSON), leveled logging
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

// structured (JSON) output — Swift has no bundled structured logger like Go's slog, so
// encoding a Codable struct as JSON is the common baseline (like Node.js's JSON.stringify)
let encoder = JSONEncoder()
encoder.outputFormatting = .sortedKeys // default key order isn't guaranteed; force alphabetical for stability
let entry = LogEntry(level: "info", msg: "hello world", time: timestamp)
let data = try! encoder.encode(entry)
print(String(data: data, encoding: .utf8)!)
```
```java
void main() {
    // System.Logger is java.base's logging API; it adds a timestamp via the default console backend
    System.Logger logger = System.getLogger("example");
    logger.log(System.Logger.Level.INFO, "hello world");

    // structured (JSON) output — java.base has no built-in JSON builder, so hand-building the
    // string is the common baseline (just like Node.js), or reach for a library like Jackson
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

_(timestamps will differ on every run)_

:::note
Go 1.21 added `log/slog`: structured, leveled logging (`Info`/`Warn`/`Error`, key-value attributes) right in the standard library. Prefer it over hand-formatting `key=value` strings with `log`.
:::

:::warning
Rust has no logger in std at all, not even a facade like `log`. The `tracing` crate (with `tracing-subscriber`) is the most common choice, and supports both plain-text and JSON output. Apple's `os.Logger` (the `os` framework) looks like the natural fit for Swift, but it only writes to the system log (viewable via Console.app/`log stream`), not to stdout, so it doesn't work for an example like this — the community `swift-log` package is the cross-platform choice for real applications.
:::
