---
title: "Gzip"
description: "zlib.gzip/unzip (promisify) của Node.js so với compress/gzip của Go để nén và giải nén dữ liệu."
date: "2026-09-27"
order: 1040
category: stdlib
languages: [js, go]
versions:
  js: "14.13.1"
  go: "1.0"
tags: [gzip, compression, zlib]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#gzip"
---

Node.js expose gzip qua callback trong `node:zlib`, nên ví dụ dưới dùng `promisify` để `await` được. Go làm việc trực tiếp với `io.Writer`/`io.Reader`: `gzip.NewWriter` bọc quanh một buffer để nén, `gzip.NewReader` đọc ngược lại để giải nén.

## Nén và giải nén

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
	if err := w.Close(); err != nil { // bắt buộc Close để flush hết dữ liệu nén
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
`compress/flate` (nền tảng của `compress/gzip`) không đảm bảo output nén giống hệt byte-by-byte giữa các phiên bản Go, hay giống zlib — chỉ đảm bảo round-trip (nén rồi giải nén đúng ra dữ liệu gốc).
:::
