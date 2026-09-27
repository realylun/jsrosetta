---
title: "Logging"
description: "How ad-hoc timestamped console.log in Node.js compares to Go's log package and structured logging via log/slog."
tags: [logging, slog, structured-logging]
---

Node.js has no bundled logger: if you want a timestamp or JSON output, you assemble it yourself with `console.log`. Go has the `log` package (which prepends a date and time to every line), and since Go 1.21 there's also `log/slog` for structured, leveled logging.

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
:::

```bash
2026-09-27T12:55:39.470Z hello world
{"level":"info","msg":"hello world","time":"2026-09-27T12:55:39.471Z"}

2026/09/27 19:55:40 hello world
2026/09/27 19:55:40 INFO hello world count=1
```

_(timestamps will differ on every run)_

:::note
Go 1.21 added `log/slog`: structured, leveled logging (`Info`/`Warn`/`Error`, key-value attributes) right in the standard library. Prefer it over hand-formatting `key=value` strings with `log`.
:::
