---
title: "Reading, Writing, and Deleting Files"
description: "How Node.js's async readFile/writeFile (node:fs/promises) compare to Go's os.ReadFile/os.WriteFile."
tags: [files, fs, filesystem, io]
---

Both Node.js and Go have high-level APIs for creating, reading, and deleting files without managing file descriptors by hand. Node.js uses `Promise`-based functions in `node:fs/promises`, while Go returns `(value, error)` directly — no exceptions, just an `err` you check right after each call.

## Creating, writing, reading, and deleting a file

:::tabs
```js
import { readFile, unlink, writeFile } from 'node:fs/promises'

// create file (and write to it)
await writeFile('test.txt', 'hello world.')

// read file
const contents = await readFile('test.txt', 'utf8')
console.log(contents)

// delete file
await unlink('test.txt')
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// create file (and write to it)
	if err := os.WriteFile("test.txt", []byte("hello world."), 0644); err != nil {
		panic(err)
	}

	// read file
	contents, err := os.ReadFile("test.txt")
	if err != nil {
		panic(err)
	}

	fmt.Println(string(contents))

	// delete file
	if err := os.Remove("test.txt"); err != nil {
		panic(err)
	}
}
```
:::

```bash
hello world.
```

:::note
Go 1.16 added `os.ReadFile`/`os.WriteFile` to replace the older `ioutil.ReadFile`/`ioutil.WriteFile`; the `io/ioutil` package is deprecated, don't use it in new code.
:::
