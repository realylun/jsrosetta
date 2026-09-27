---
title: "Printing"
description: "How Node.js's console.log/console.error map to Go's fmt.Println/fmt.Printf/fmt.Fprintf."
tags: [printing, stdout, stderr]
---

Node.js's `console.log` writes to stdout, and `console.error` writes to stderr. Go splits this into clearer functions: `fmt.Println` prints with a trailing newline, `fmt.Printf` takes a C-style format string, and `fmt.Fprintf` writes to any `io.Writer` — including `os.Stderr`.

## Printing to stdout and stderr

:::tabs
```js
console.log('print to stdout')
console.log('format %s %d', 'example', 1)
console.error('print to stderr')
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Println("print to stdout")
	fmt.Printf("format %s %v\n", "example", 1)
	fmt.Fprintf(os.Stderr, "print to stderr")
}
```
:::

```bash
print to stdout
format example 1
print to stderr
```
