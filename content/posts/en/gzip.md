---
title: "Gzip"
description: "Node.js's zlib.gzip/unzip (promisified) compared to Go's compress/gzip for compressing and decompressing data."
tags: [gzip, compression, zlib]
---

Node.js exposes gzip through a callback in `node:zlib`, so the example below uses `promisify` to `await` it. Go works directly with `io.Writer`/`io.Reader`: `gzip.NewWriter` wraps a buffer to compress, and `gzip.NewReader` reads it back to decompress.

## Compressing and decompressing

:::tabs
```js
import { gzip, unzip } from "node:zlib";
import { promisify } from "node:util";

const gzipAsync = promisify(gzip);
const unzipAsync = promisify(unzip);

const data = Buffer.from("hello world", "utf-8");

const compressed = await gzipAsync(data);
console.log(compressed); // <Buffer 1f 8b 08 00 ...>

const decompressed = await unzipAsync(compressed);
console.log(decompressed.toString()); // hello world
```
```go
package main

import (
	"bytes"
	"compress/gzip"
	"fmt"
)

func main() {
	data := []byte("hello world")

	compressed := new(bytes.Buffer)
	w := gzip.NewWriter(compressed)
	if _, err := w.Write(data); err != nil {
		panic(err)
	}
	if err := w.Close(); err != nil { // Close must be called to flush the compressed data
		panic(err)
	}
	fmt.Println(compressed.Bytes()) // [31 139 8 0 ...]

	decompressed := new(bytes.Buffer)
	r, err := gzip.NewReader(compressed)
	if err != nil {
		panic(err)
	}

	if _, err := decompressed.ReadFrom(r); err != nil {
		panic(err)
	}
	fmt.Println(string(decompressed.Bytes())) // hello world
}
```
:::

:::note
`compress/flate` (which `compress/gzip` is built on) doesn't guarantee byte-for-byte identical compressed output across Go versions, or output equal to zlib's — only the round trip is guaranteed (compressing then decompressing yields the original data back).
:::
