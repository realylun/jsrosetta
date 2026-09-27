---
title: "Environment Variables"
description: "How Node.js's process.env compares to Go's os.Getenv for reading environment variables."
tags: [env, environment-variables, config, io]
---

Reading an environment variable is one of the simplest I/O operations there is, but access differs slightly: Node.js treats `process.env` like an object, while Go's `os.Getenv` function returns an empty string when the variable doesn't exist.

## Reading an environment variable

:::tabs
```js
const key = process.env['API_KEY']

console.log(key)
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	key := os.Getenv("API_KEY")

	fmt.Println(key)
}
```
:::

```bash
$ API_KEY=foobar node env_vars.js
foobar

$ API_KEY=foobar go run env_vars.go
foobar
```
