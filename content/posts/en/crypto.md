---
title: "Crypto (hashing)"
description: "Node.js's createHash compared to Go's crypto/sha256, Rust's sha2, Swift's CryptoKit, and Java's MessageDigest for computing a SHA-256 hash."
tags: [crypto, hash, sha256]
---

Node.js bundles every hash algorithm behind one common API, `createHash(algorithm)`. Go splits each algorithm into its own package (`crypto/sha256`, `crypto/md5`, …), and returns a fixed-size byte array instead of an object — you encode it to hex yourself with `encoding/hex`. Rust has no hashing in std either, so it uses the `sha2` crate, also returning a fixed-size byte array you hex-encode by hand. Swift uses Apple's `CryptoKit` framework. Java uses the long-standing `MessageDigest` (picking an algorithm by name string) together with `HexFormat` (since Java 17) to hex-encode the result.

## SHA-256 hashing

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
	hash := sha256.Sum256([]byte("hello")) // returns a [32]byte, not a slice

	fmt.Println(hex.EncodeToString(hash[:])) // 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
}
```
```rust
// Cargo.toml: sha2 = "0.11"
use sha2::{Digest, Sha256};

fn main() {
    let mut hasher = Sha256::new();
    hasher.update(b"hello");
    let hash = hasher.finalize(); // a fixed-size 32-byte array, not a Vec

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
`crypto.hash(algorithm, data[, options])` is a one-shot alternative (e.g. `hash('sha256', 'hello')`, added in Node.js 21.7 / 20.12). It's still experimental in the verified Node.js 24.12.0 (stable since 24.13.1), so the example above sticks with `createHash()`.
:::

:::note
`CryptoKit` only runs on Apple platforms (macOS 10.15 / iOS 13 or later). On Linux or server-side Swift, use the open-source equivalent [swift-crypto](https://github.com/apple/swift-crypto) — same API, just swap `import CryptoKit` for `import Crypto`.
:::
