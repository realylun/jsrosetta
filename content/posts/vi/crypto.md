---
title: "Crypto (hash)"
description: "createHash của Node.js so với crypto/sha256 (Go), sha2 (Rust), CryptoKit (Swift) và MessageDigest (Java) để tính hash SHA-256."
date: "2026-09-27"
order: 1050
category: stdlib
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.85"
  swift: "5.1"
  java: "25"
tags: [crypto, hash, sha256]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#crypto"
---

Node.js gom mọi thuật toán hash vào một API chung `createHash(algorithm)`. Go tách mỗi thuật toán thành một package riêng (`crypto/sha256`, `crypto/md5`, …), trả về mảng byte cố định thay vì object — bạn tự encode sang hex bằng `encoding/hex`. Rust không có hash trong std nên dùng crate `sha2`, cũng trả về mảng byte cố định phải tự encode hex. Swift dùng framework `CryptoKit` của Apple. Java dùng `MessageDigest` (rất lâu đời, chọn thuật toán qua chuỗi tên) cùng `HexFormat` (từ Java 17) để encode hex.

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
```rust
// Cargo.toml: sha2 = "0.11"
use sha2::{Digest, Sha256};

fn main() {
    let mut hasher = Sha256::new();
    hasher.update(b"hello");
    let hash = hasher.finalize(); // mảng cố định 32 byte, không phải Vec

    let hex: String = hash.iter().map(|b| format!("{b:02x}")).collect();
    println!("{hex}"); // 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
}
```
```swift
import CryptoKit
import Foundation

let digest = SHA256.hash(data: Data("hello".utf8))
let hex = digest.map { String(format: "%02x", $0) }.joined()
print(hex) // 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
```
```java
import java.security.MessageDigest;
import java.util.HexFormat;

void main() throws Exception {
    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    byte[] hash = digest.digest("hello".getBytes());

    IO.println(HexFormat.of().formatHex(hash)); // 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
}
```
:::

:::note
`crypto.hash(algorithm, data[, options])` là API one-shot thay thế (ví dụ `hash('sha256', 'hello')`, thêm từ Node.js 21.7 / 20.12). Ở Node.js 24.12.0 nó vẫn là experimental (ổn định từ 24.13.1), nên ví dụ trên vẫn dùng `createHash()`.
:::

:::note
`CryptoKit` chỉ chạy trên nền tảng Apple (cần macOS 10.15 / iOS 13 trở lên). Trên Linux hoặc server-side Swift, dùng package mã nguồn mở tương đương [swift-crypto](https://github.com/apple/swift-crypto) — cùng API, chỉ đổi `import CryptoKit` thành `import Crypto`.
:::
