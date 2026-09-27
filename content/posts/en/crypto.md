---
title: "Crypto (hashing)"
description: "Node.js's createHash compared to Go's crypto/sha256 package for computing a SHA-256 hash."
tags: [crypto, hash, sha256]
---

Node.js bundles every hash algorithm behind one common API, `createHash(algorithm)`. Go splits each algorithm into its own package (`crypto/sha256`, `crypto/md5`, …), and returns a fixed-size byte array instead of an object — you encode it to hex yourself with `encoding/hex`.

## SHA-256 hashing

:::tabs
```js
import { createHash } from "node:crypto";

const hash = createHash("sha256").update("hello").digest("hex");

console.log(hash); // 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
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
:::

:::note
`crypto.hash(algorithm, data[, options])` is a one-shot alternative (e.g. `hash('sha256', 'hello')`, added in Node.js 21.7 / 20.12). It's still experimental in the verified Node.js 24.12.0 (stable since 24.13.1), so the example above sticks with `createHash()`.
:::
