---
title: "Buffer"
description: "Buffer.alloc, writeUIntBE/LE và Buffer.compare của Node.js so với []byte cùng package encoding/binary, bytes của Go."
date: "2026-09-27"
order: 440
category: collections
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [buffer, bytes, binary, endianness]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#buffers"
---

`Buffer` trong Node.js là API cấp cao để làm việc với dữ liệu nhị phân, có sẵn method đọc/ghi big-endian và little-endian. Go không có kiểu `Buffer` riêng — bạn thao tác trực tiếp trên `[]byte` bằng các package chuẩn `encoding/binary`, `encoding/hex` và `bytes`.

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
:::

:::note
Go không có sẵn method kiểu `writeUIntBE`/`writeUIntLE` cho độ dài byte tuỳ ý — ở đây phải tự viết bằng `encoding/binary`: ghi giá trị vào một mảng 8 byte tạm rồi `copy` đúng số byte cần dùng (`byteLength`).
:::
