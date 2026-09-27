---
title: "Buffer"
description: "Node.js's Buffer.alloc, writeUIntBE/LE, and Buffer.compare compared to Go's []byte, Rust's &mut [u8], Swift's [UInt8], and Java's byte[]."
tags: [buffer, bytes, binary, endianness]
---

Node.js's `Buffer` is a high-level API for working with binary data, with built-in methods for reading and writing big-endian and little-endian values. Go has no dedicated `Buffer` type — you operate directly on `[]byte` using the standard `encoding/binary`, `encoding/hex`, and `bytes` packages. Rust, Swift, and Java have no built-in `writeUIntBE`/`writeUIntLE`-style method for arbitrary byte lengths either — all three hand-write it with bit shifting (`>>`, `&`), the same way Go does.

## Writing integers as big-endian / little-endian

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

## Comparing two buffers

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
Go has no built-in `writeUIntBE`/`writeUIntLE`-style method for arbitrary byte lengths — here it's hand-written with `encoding/binary`: write the value into a temporary 8-byte array, then `copy` out exactly the number of bytes needed (`byteLength`). Rust uses `to_be_bytes`/`to_le_bytes` (producing `[u8; 8]`) and slices out the right length; Swift and Java shift bits directly with `>>`/`&`. All three compare byte arrays with `==`/`Arrays.equals` — Java has no `==` for array contents (it compares references), so you must call `Arrays.equals`.
:::
