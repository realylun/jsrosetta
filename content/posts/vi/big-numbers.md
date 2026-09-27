---
title: "Số lớn (BigInt)"
description: "BigInt của JavaScript tương ứng với package math/big (big.Int) trong Go."
date: "2026-09-27"
order: 220
category: types
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [bigint, math-big, numbers]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#big-numbers"
---

`number` của JavaScript chỉ an toàn tới `2^53 - 1`; vượt quá thì phải dùng `BigInt`, một kiểu nguyên thuỷ riêng với hậu tố `n`. Go không có kiểu số lớn dựng sẵn trong ngôn ngữ — thay vào đó dùng `big.Int` từ package `math/big`, một struct với các phương thức (`SetUint64`, `SetString`, `Cmp`…) thay cho toán tử.

## Tạo và so sánh số lớn

:::tabs
```js
let bn = 75n
console.log(bn.toString(10))

bn = BigInt('75')
console.log(bn.toString(10))

bn = BigInt(0x4b)
console.log(bn.toString(10))

bn = BigInt('0x4b')
console.log(bn.toString(10))

bn = BigInt('0x' + Buffer.from('4b', 'hex').toString('hex'))
console.log(bn.toString(10))
console.log(Number(bn))
console.log(bn.toString(16))
console.log(Buffer.from(bn.toString(16), 'hex'))

let bn2 = BigInt(100)
let isEqual = bn === bn2
console.log(isEqual)

let isGreater = bn > bn2
console.log(isGreater)

let isLesser = bn < bn2
console.log(isLesser)
```
```go
package main

import (
	"encoding/hex"
	"fmt"
	"math/big"
)

func main() {
	bn := new(big.Int)
	bn.SetUint64(75)
	fmt.Println(bn.String())

	bn = new(big.Int)
	bn.SetString("75", 10)
	fmt.Println(bn.String())

	bn = new(big.Int)
	bn.SetUint64(0x4b)
	fmt.Println(bn.String())

	bn = new(big.Int)
	bn.SetString("4b", 16)
	fmt.Println(bn.String())

	bn = new(big.Int)
	bn.SetBytes([]byte{0x4b})
	fmt.Println(bn.String())
	fmt.Println(bn.Uint64())
	fmt.Println(hex.EncodeToString(bn.Bytes()))
	fmt.Println(bn.Bytes())

	bn2 := big.NewInt(100)
	isEqual := bn.Cmp(bn2) == 0
	fmt.Println(isEqual)

	isGreater := bn.Cmp(bn2) == 1
	fmt.Println(isGreater)

	isLesser := bn.Cmp(bn2) == -1
	fmt.Println(isLesser)
}
```
:::

```bash
# Node.js
75
75
75
75
75
75
4b
<Buffer 4b>
false
false
true

# Go
75
75
75
75
75
75
4b
[75]
false
false
true
```

:::tip
`BigInt` có toán tử so sánh trực tiếp (`===`, `>`, `<`). `big.Int` là struct nên phải dùng phương thức `Cmp`, trả về `-1`, `0` hoặc `1`.
:::
