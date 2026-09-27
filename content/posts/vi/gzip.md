---
title: "Gzip"
description: "zlib.gzip/unzip (promisify) của Node.js so với compress/gzip (Go), flate2 (Rust), zlib qua C interop (Swift) và java.util.zip (Java)."
date: "2026-09-27"
order: 1040
category: stdlib
languages: [js, go, rust, swift, java]
versions:
  js: "14.13.1"
  go: "1.0"
  rust: "1.67"
  swift: "2.0"
  java: "25"
tags: [gzip, compression, zlib]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#gzip"
---

Node.js expose gzip qua callback trong `node:zlib`, nên ví dụ dưới dùng `promisify` để `await` được. Go làm việc trực tiếp với `io.Writer`/`io.Reader`: `gzip.NewWriter` bọc quanh một buffer để nén, `gzip.NewReader` đọc ngược lại để giải nén. Rust không có gzip trong std nên dùng crate `flate2`, cũng theo mô hình `Read`/`Write`. Swift không có API gzip nào ở tầng Foundation lẫn framework `Compression` (framework đó chỉ nén ra định dạng zlib/LZFSE, không phải container gzip thật) — ví dụ dưới gọi thẳng zlib của hệ thống qua C interop (`import zlib`). Java dùng `java.util.zip.GZIPOutputStream`/`GZIPInputStream` có sẵn từ rất lâu.

## Nén và giải nén

:::tabs
```js
import { gzip, unzip } from 'node:zlib'
import { promisify } from 'node:util'

const gzipAsync = promisify(gzip)
const unzipAsync = promisify(unzip)

const data = Buffer.from('hello world', 'utf-8')

const compressed = await gzipAsync(data)
console.log(compressed) // <Buffer 1f 8b 08 00 ...>

const decompressed = await unzipAsync(compressed)
console.log(decompressed.toString()) // hello world
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
```rust
// Cargo.toml: flate2 = "1"
use std::io::{Read, Write};

use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;

fn main() {
    let data = b"hello world";

    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(data).unwrap();
    let compressed = encoder.finish().unwrap(); // bắt buộc finish() để flush hết dữ liệu nén
    println!("{compressed:?}");

    let mut decoder = GzDecoder::new(&compressed[..]);
    let mut decompressed = String::new();
    decoder.read_to_string(&mut decompressed).unwrap();
    println!("{decompressed}");
}
```
```swift
import zlib

func gzipCompress(_ input: [UInt8]) -> [UInt8] {
    var stream = z_stream()
    // windowBits 31 = 15 (kích thước window mặc định) + 16 (chọn container gzip thay vì zlib)
    deflateInit2_(&stream, Z_DEFAULT_COMPRESSION, Z_DEFLATED, 31, 8, Z_DEFAULT_STRATEGY,
                  ZLIB_VERSION, Int32(MemoryLayout<z_stream>.size))
    defer { deflateEnd(&stream) }

    var output = [UInt8](repeating: 0, count: input.count + 64)
    var mutableInput = input
    let written: Int = mutableInput.withUnsafeMutableBufferPointer { inBuf in
        output.withUnsafeMutableBufferPointer { outBuf in
            stream.next_in = inBuf.baseAddress
            stream.avail_in = UInt32(inBuf.count)
            stream.next_out = outBuf.baseAddress
            stream.avail_out = UInt32(outBuf.count)
            deflate(&stream, Z_FINISH)
            return outBuf.count - Int(stream.avail_out)
        }
    }
    return Array(output.prefix(written))
}

func gunzipDecompress(_ input: [UInt8], expectedSize: Int) -> [UInt8] {
    var stream = z_stream()
    inflateInit2_(&stream, 31, ZLIB_VERSION, Int32(MemoryLayout<z_stream>.size)) // 31: chỉ chấp nhận container gzip
    defer { inflateEnd(&stream) }

    var output = [UInt8](repeating: 0, count: expectedSize)
    var mutableInput = input
    let written: Int = mutableInput.withUnsafeMutableBufferPointer { inBuf in
        output.withUnsafeMutableBufferPointer { outBuf in
            stream.next_in = inBuf.baseAddress
            stream.avail_in = UInt32(inBuf.count)
            stream.next_out = outBuf.baseAddress
            stream.avail_out = UInt32(outBuf.count)
            inflate(&stream, Z_FINISH)
            return outBuf.count - Int(stream.avail_out)
        }
    }
    return Array(output.prefix(written))
}

let data = Array("hello world".utf8)

let compressed = gzipCompress(data)
print(compressed)

let decompressed = gunzipDecompress(compressed, expectedSize: data.count)
print(String(decoding: decompressed, as: UTF8.self)) // hello world
```
```java
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

void main() throws Exception {
    byte[] data = "hello world".getBytes();

    ByteArrayOutputStream compressed = new ByteArrayOutputStream();
    try (GZIPOutputStream gzip = new GZIPOutputStream(compressed)) {
        gzip.write(data);
    } // try-with-resources tự close() để flush hết dữ liệu nén
    IO.println(Arrays.toString(compressed.toByteArray()));

    try (GZIPInputStream gunzip = new GZIPInputStream(new ByteArrayInputStream(compressed.toByteArray()))) {
        IO.println(new String(gunzip.readAllBytes())); // hello world
    }
}
```
:::

:::note
`compress/flate` (nền tảng của `compress/gzip`), `flate2`, zlib và `java.util.zip` đều không đảm bảo output nén giống hệt byte-by-byte lẫn nhau hay giữa các phiên bản — chỉ đảm bảo round-trip (nén rồi giải nén đúng ra dữ liệu gốc). Phần header/trailer của gzip (byte OS, mtime…) khác nhau chút ít giữa các implementation ở ví dụ trên, phần dữ liệu nén thì giống hệt vì cùng thuật toán DEFLATE.
:::

:::note
Swift không có gzip built-in: framework `Compression` của Apple chỉ hỗ trợ định dạng zlib/LZFSE/LZ4/LZMA, không phải container gzip (RFC 1952) thật. Ví dụ trên gọi thẳng zlib của hệ thống qua module `zlib` có sẵn trong SDK của Xcode (`import zlib` chạy được ngay, không cần cấu hình gì thêm). Trên Linux, cần bọc `zlib.h` qua target `systemLibrary` của Swift Package Manager vì không có sẵn module tương tự.
:::
