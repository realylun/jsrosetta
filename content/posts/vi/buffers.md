---
title: "Buffer"
description: "Buffer.alloc, writeUIntBE/LE và Buffer.compare của Node.js so với []byte (Go), &mut [u8] (Rust), [UInt8] (Swift) và byte[] (Java)."
date: "2026-09-27"
order: 440
category: collections
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "2.0"
  java: "25"
tags: [buffer, bytes, binary, endianness]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#buffers"
---

`Buffer` trong Node.js là API cấp cao để làm việc với dữ liệu nhị phân, có sẵn method đọc/ghi big-endian và little-endian. Go không có kiểu `Buffer` riêng — bạn thao tác trực tiếp trên `[]byte` bằng các package chuẩn `encoding/binary`, `encoding/hex` và `bytes`. Rust, Swift và Java cũng không có sẵn method kiểu `writeUIntBE`/`writeUIntLE` cho độ dài byte tuỳ ý — cả ba đều phải tự viết bằng dịch bit (`>>`, `&`), y hệt cách làm ở Go.

## Ghi số nguyên theo big-endian / little-endian

:::tabs
```js
const buf = Buffer.alloc(6)

const value = 0x1234567890ab
buf.writeUIntBE(value, 0, 6)
console.log(buf.toString('hex')) // 1234567890ab

const buf2 = Buffer.alloc(6)
buf2.writeUIntLE(value, 0, 6)
console.log(buf2.toString('hex')) // ab9078563412
```
```go
package main

import (
	"encoding/binary"
	"encoding/hex"
	"fmt"
)

func writeUIntBE(buffer []byte, value uint64, offset, byteLength int) {
	var tmp [8]byte
	binary.BigEndian.PutUint64(tmp[:], value)
	copy(buffer[offset:], tmp[8-byteLength:])
}

func writeUIntLE(buffer []byte, value uint64, offset, byteLength int) {
	var tmp [8]byte
	binary.LittleEndian.PutUint64(tmp[:], value)
	copy(buffer[offset:], tmp[:byteLength])
}

func main() {
	buf := make([]byte, 6)
	writeUIntBE(buf, 0x1234567890ab, 0, 6)
	fmt.Println(hex.EncodeToString(buf)) // 1234567890ab

	buf2 := make([]byte, 6)
	writeUIntLE(buf2, 0x1234567890ab, 0, 6)
	fmt.Println(hex.EncodeToString(buf2)) // ab9078563412
}
```
```rust
fn write_uint_be(buffer: &mut [u8], value: u64, offset: usize, byte_length: usize) {
    let tmp = value.to_be_bytes(); // [u8; 8]
    buffer[offset..offset + byte_length].copy_from_slice(&tmp[8 - byte_length..]);
}

fn write_uint_le(buffer: &mut [u8], value: u64, offset: usize, byte_length: usize) {
    let tmp = value.to_le_bytes();
    buffer[offset..offset + byte_length].copy_from_slice(&tmp[..byte_length]);
}

fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn main() {
    let mut buf = vec![0u8; 6];
    write_uint_be(&mut buf, 0x1234567890ab, 0, 6);
    println!("{}", to_hex(&buf)); // 1234567890ab

    let mut buf2 = vec![0u8; 6];
    write_uint_le(&mut buf2, 0x1234567890ab, 0, 6);
    println!("{}", to_hex(&buf2)); // ab9078563412
}
```
```swift
func writeUIntBE(_ buffer: inout [UInt8], value: UInt64, offset: Int, byteLength: Int) {
    for i in 0..<byteLength {
        buffer[offset + i] = UInt8((value >> (8 * (byteLength - 1 - i))) & 0xff)
    }
}

func writeUIntLE(_ buffer: inout [UInt8], value: UInt64, offset: Int, byteLength: Int) {
    for i in 0..<byteLength {
        buffer[offset + i] = UInt8((value >> (8 * i)) & 0xff)
    }
}

func toHex(_ bytes: [UInt8]) -> String {
    bytes.map { byte -> String in
        let hex = String(byte, radix: 16)
        return byte < 16 ? "0" + hex : hex
    }.joined()
}

var buf = [UInt8](repeating: 0, count: 6)
writeUIntBE(&buf, value: 0x1234567890ab, offset: 0, byteLength: 6)
print(toHex(buf)) // 1234567890ab

var buf2 = [UInt8](repeating: 0, count: 6)
writeUIntLE(&buf2, value: 0x1234567890ab, offset: 0, byteLength: 6)
print(toHex(buf2)) // ab9078563412
```
```java
void writeUIntBE(byte[] buffer, long value, int offset, int byteLength) {
    for (int i = 0; i < byteLength; i++) {
        buffer[offset + i] = (byte) (value >> (8 * (byteLength - 1 - i)));
    }
}

void writeUIntLE(byte[] buffer, long value, int offset, int byteLength) {
    for (int i = 0; i < byteLength; i++) {
        buffer[offset + i] = (byte) (value >> (8 * i));
    }
}

void main() {
    byte[] buf = new byte[6];

    long value = 0x1234567890abL;
    writeUIntBE(buf, value, 0, 6);
    IO.println(HexFormat.of().formatHex(buf)); // 1234567890ab

    byte[] buf2 = new byte[6];
    writeUIntLE(buf2, value, 0, 6);
    IO.println(HexFormat.of().formatHex(buf2)); // ab9078563412
}
```
:::

## So sánh hai buffer

:::tabs
```js
let isEqual = Buffer.compare(buf, buf2) === 0
console.log(isEqual) // false

isEqual = Buffer.compare(buf, buf) === 0
console.log(isEqual) // true
```
```go
import "bytes"

isEqual := bytes.Equal(buf, buf2)
fmt.Println(isEqual) // false

isEqual = bytes.Equal(buf, buf)
fmt.Println(isEqual) // true
```
```rust
let is_equal = buf == buf2;
println!("{is_equal}"); // false

let is_equal = buf == buf;
println!("{is_equal}"); // true
```
```swift
var isEqual = buf == buf2
print(isEqual) // false

isEqual = buf == buf
print(isEqual) // true
```
```java
boolean isEqual = Arrays.equals(buf, buf2);
IO.println(isEqual); // false

isEqual = Arrays.equals(buf, buf);
IO.println(isEqual); // true
```
:::

:::note
Go không có sẵn method kiểu `writeUIntBE`/`writeUIntLE` cho độ dài byte tuỳ ý — ở đây phải tự viết bằng `encoding/binary`: ghi giá trị vào một mảng 8 byte tạm rồi `copy` đúng số byte cần dùng (`byteLength`). Rust dùng `to_be_bytes`/`to_le_bytes` (cho ra `[u8; 8]`) rồi cắt đúng số byte; Swift và Java dịch bit trực tiếp bằng `>>`/`&`. So sánh mảng byte thì cả ba đều dùng `==`/`Arrays.equals` — Java không có operator `==` cho nội dung mảng (nó so sánh tham chiếu), phải gọi `Arrays.equals`.
:::
