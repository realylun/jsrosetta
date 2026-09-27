---
title: "Crypto (hash)"
description: "createHash của Node.js so với package crypto/sha256 của Go để tính hash SHA-256."
date: "2026-09-27"
order: 1050
category: stdlib
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [crypto, hash, sha256]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#crypto"
---

Node.js gom mọi thuật toán hash vào một API chung `createHash(algorithm)`. Go tách mỗi thuật toán thành một package riêng (`crypto/sha256`, `crypto/md5`, …), trả về mảng byte cố định thay vì object — bạn tự encode sang hex bằng `encoding/hex`.

## Hash SHA-256

:::tabs
```js
import { createHash } from 'node:crypto'

const hash = createHash('sha256').update('hello').digest('hex')

console.log(hash) // 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
```
```go
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

func main() {
	hash := sha256.Sum256([]byte("hello")) // trả về [32]byte, không phải slice

	fmt.Println(hex.EncodeToString(hash[:])) // 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
}
```
:::

:::note
`crypto.hash(algorithm, data[, options])` là API one-shot thay thế (ví dụ `hash('sha256', 'hello')`, thêm từ Node.js 21.7 / 20.12). Ở Node.js 24.12.0 nó vẫn là experimental (ổn định từ 24.13.1), nên ví dụ trên vẫn dùng `createHash()`.
:::
