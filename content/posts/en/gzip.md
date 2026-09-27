---
title: "Gzip"
description: "Node.js's zlib.gzip/unzip (promisified) compared to Go's compress/gzip, Rust's flate2, Swift's zlib via C interop, and Java's java.util.zip."
tags: [gzip, compression, zlib]
---

Node.js exposes gzip through a callback in `node:zlib`, so the example below uses `promisify` to `await` it. Go works directly with `io.Writer`/`io.Reader`: `gzip.NewWriter` wraps a buffer to compress, and `gzip.NewReader` reads it back to decompress. Rust has no gzip in std, so it uses the `flate2` crate, following the same `Read`/`Write` model. Swift has no gzip API in either Foundation or the `Compression` framework (that framework only outputs zlib/LZFSE format, not an actual gzip container) — the example below calls the system's zlib directly through C interop (`import zlib`). Java uses the long-standing `java.util.zip.GZIPOutputStream`/`GZIPInputStream`.

## Compressing and decompressing

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
    let compressed = encoder.finish().unwrap(); // finish() must be called to flush the compressed data
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
    // windowBits 31 = 15 (default window size) + 16 (choose the gzip container instead of zlib)
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
    inflateInit2_(&stream, 31, ZLIB_VERSION, Int32(MemoryLayout<z_stream>.size)) // 31: accept the gzip container only
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
    } // try-with-resources calls close() for us, flushing the compressed data
    IO.println(Arrays.toString(compressed.toByteArray()));

    try (GZIPInputStream gunzip = new GZIPInputStream(new ByteArrayInputStream(compressed.toByteArray()))) {
        IO.println(new String(gunzip.readAllBytes())); // hello world
    }
}
```
:::

:::note
`compress/flate` (which `compress/gzip` is built on), `flate2`, zlib, and `java.util.zip` all don't guarantee byte-for-byte identical compressed output across each other or across versions — only the round trip is guaranteed (compressing then decompressing yields the original data back). The gzip header/trailer fields (OS byte, mtime, …) differ slightly between the implementations above; the compressed payload itself is identical since they all use the DEFLATE algorithm.
:::

:::note
Swift has no built-in gzip: Apple's `Compression` framework only supports the zlib/LZFSE/LZ4/LZMA formats, not an actual gzip container (RFC 1952). The example above calls the system's zlib directly through the `zlib` module bundled with Xcode's SDK (`import zlib` just works, no extra setup needed). On Linux, you'd wrap `zlib.h` yourself through a Swift Package Manager `systemLibrary` target, since no equivalent module ships there.
:::
