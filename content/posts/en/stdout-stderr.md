---
title: "Writing to Stdout and Stderr"
description: "How Node.js's process.stdout.write/process.stderr.write compare to Go's fmt.Fprint(os.Stdout, …)/fmt.Fprint(os.Stderr, …)."
tags: [stdout, stderr, io, printing]
---

`console.log`/`console.error` covers most needs, but sometimes you need to write straight to a stream without an extra newline or formatting. Both Node.js and Go let you write directly to stdout/stderr as a stream/writer.

## Writing to stdout

:::tabs
```js
process.stdout.write('hello world\n')
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Fprint(os.Stdout, "hello world\n")
}
```
:::

```bash
hello world
```

## Writing to stderr

:::tabs
```js
process.stderr.write('hello error\n')
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Fprint(os.Stderr, "hello error\n")
}
```
:::

```bash
hello error
```
