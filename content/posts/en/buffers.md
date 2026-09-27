---
title: "Buffer"
description: "Node.js's Buffer.alloc, writeUIntBE/LE, and Buffer.compare compared to Go's []byte with encoding/binary and bytes."
tags: [buffer, bytes, binary, endianness]
---

Node.js's `Buffer` is a high-level API for working with binary data, with built-in methods for reading and writing big-endian and little-endian values. Go has no dedicated `Buffer` type — you operate directly on `[]byte` using the standard `encoding/binary`, `encoding/hex`, and `bytes` packages.

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
:::

:::note
Go has no built-in `writeUIntBE`/`writeUIntLE`-style method for arbitrary byte lengths — here it's hand-written with `encoding/binary`: write the value into a temporary 8-byte array, then `copy` out exactly the number of bytes needed (`byteLength`).
:::
