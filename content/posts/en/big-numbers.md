---
title: "Big Numbers"
description: "How JavaScript's BigInt compares to Go's math/big, Java's java.math.BigInteger, and Rust's num-bigint crate — Swift has no built-in big-number type."
tags: [bigint, math-big, numbers]
---

JavaScript's `number` is only safe up to `2^53 - 1`; beyond that you need `BigInt`, a separate primitive with an `n` suffix. Go has no big-number type built into the language — instead you use `big.Int` from the `math/big` package, a struct with methods (`SetUint64`, `SetString`, `Cmp`…) in place of operators. Java has `java.math.BigInteger` built into `java.base`, with a design nearly identical to Go's. Rust has nothing in std, so you reach for the `num-bigint` crate. Swift has neither in its stdlib nor in Foundation — you need a third-party package if you need truly large numbers.

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
```rust
// Cargo.toml: num-bigint = "0.5", num-traits = "0.2"
use num_bigint::{BigInt, Sign};
use num_traits::ToPrimitive;

fn main() {
    let mut bn: BigInt = 75u32.into();
    println!("{bn}");

    bn = "75".parse().unwrap();
    println!("{bn}");

    bn = 0x4bu32.into();
    println!("{bn}");

    bn = BigInt::parse_bytes(b"4b", 16).unwrap();
    println!("{bn}");

    bn = BigInt::from_bytes_be(Sign::Plus, &[0x4b]);
    println!("{bn}");
    println!("{}", bn.to_u64().unwrap());
    println!("{bn:x}");
    println!("{:?}", bn.to_bytes_be().1);

    let bn2 = BigInt::from(100);
    let is_equal = bn == bn2;
    println!("{is_equal}");

    let is_greater = bn > bn2;
    println!("{is_greater}");

    let is_lesser = bn < bn2;
    println!("{is_lesser}");
}
```
```swift
// Swift has no arbitrary-precision integer type in its stdlib/Foundation; the values below are
// all small enough that UInt64 is plenty. For truly large numbers, use a third-party package
// (e.g. attaswift/BigInt) via SPM.
var bn: UInt64 = 75
print(String(bn))

bn = UInt64("75")!
print(String(bn))

bn = UInt64(0x4b)
print(String(bn))

bn = UInt64("4b", radix: 16)!
print(String(bn))

let bytes: [UInt8] = [0x4b]
bn = bytes.reduce(0) { $0 << 8 | UInt64($1) }
print(String(bn))
print(bn) // "Number(bn)": UInt64 is already a numeric type, no conversion needed
print(String(bn, radix: 16))
print(bytes)

let bn2: UInt64 = 100
let isEqual = bn == bn2
print(isEqual)

let isGreater = bn > bn2
print(isGreater)

let isLesser = bn < bn2
print(isLesser)
```
```java
void main() {
    BigInteger bn = BigInteger.valueOf(75);
    IO.println(bn.toString(10));

    bn = new BigInteger("75");
    IO.println(bn.toString(10));

    bn = BigInteger.valueOf(0x4b);
    IO.println(bn.toString(10));

    bn = new BigInteger("4b", 16);
    IO.println(bn.toString(10));

    bn = new BigInteger(1, new byte[] { 0x4b }); // signum = 1 (positive), like SetBytes
    IO.println(bn.toString(10));
    IO.println(bn.longValue()); // Number(bn)
    IO.println(bn.toString(16));
    IO.println(Arrays.toString(bn.toByteArray()));

    BigInteger bn2 = BigInteger.valueOf(100);
    boolean isEqual = bn.equals(bn2);
    IO.println(isEqual);

    boolean isGreater = bn.compareTo(bn2) > 0;
    IO.println(isGreater);

    boolean isLesser = bn.compareTo(bn2) < 0;
    IO.println(isLesser);
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

# Rust
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

# Swift
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

# Java
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
`BigInt` has direct comparison operators (`===`, `>`, `<`). `big.Int` and `BigInteger` are a struct/class, so you use a method instead (`Cmp`/`compareTo`), which returns `-1`, `0`, or `1`. Rust's `num_bigint::BigInt` implements the comparison traits directly, so `==`/`>`/`<` work out of the box.
:::

:::warning
Swift has no arbitrary-precision integer type in either its stdlib or Foundation. The example above only uses `UInt64` because the values are small; anything that truly needs more than 64 bits requires a third-party package like [attaswift/BigInt](https://github.com/attaswift/BigInt) via Swift Package Manager.
:::
