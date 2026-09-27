---
title: "Big Numbers"
description: "How JavaScript's BigInt maps to Go's math/big (big.Int) package."
tags: [bigint, math-big, numbers]
---

JavaScript's `number` is only safe up to `2^53 - 1`; beyond that you need `BigInt`, a separate primitive with an `n` suffix. Go has no big-number type built into the language — instead you use `big.Int` from the `math/big` package, a struct with methods (`SetUint64`, `SetString`, `Cmp`…) in place of operators.

## Creating and comparing big numbers

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
`BigInt` has direct comparison operators (`===`, `>`, `<`). `big.Int` is a struct, so you use the `Cmp` method instead, which returns `-1`, `0`, or `1`.
:::
