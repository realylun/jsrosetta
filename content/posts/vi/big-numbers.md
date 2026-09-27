---
title: "Số lớn (BigInt)"
description: "BigInt của JavaScript so với math/big (Go), java.math.BigInteger (Java), crate num-bigint (Rust) — Swift không có kiểu số lớn dựng sẵn."
date: "2026-09-27"
order: 220
category: types
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.60"
  swift: "1.0"
  java: "25"
tags: [bigint, math-big, numbers]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#big-numbers"
---

`number` của JavaScript chỉ an toàn tới `2^53 - 1`; vượt quá thì phải dùng `BigInt`, một kiểu nguyên thuỷ riêng với hậu tố `n`. Go không có kiểu số lớn dựng sẵn trong ngôn ngữ — thay vào đó dùng `big.Int` từ package `math/big`, một struct với các phương thức (`SetUint64`, `SetString`, `Cmp`…) thay cho toán tử. Java có `java.math.BigInteger` sẵn trong `java.base`, thiết kế gần giống hệt Go. Rust không có gì trong std, phải dùng crate `num-bigint`. Swift thì không có cả trong stdlib lẫn Foundation — phải dùng package ngoài nếu cần số thật sự lớn.

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
// Swift không có kiểu số nguyên lớn tuỳ ý trong stdlib/Foundation; các giá trị dưới đây đều nhỏ nên
// UInt64 là đủ. Cần số thực sự lớn thì phải dùng package ngoài (ví dụ attaswift/BigInt) qua SPM.
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
print(bn) // "Number(bn)": UInt64 đã là kiểu số, không cần chuyển đổi
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

    bn = new BigInteger(1, new byte[] { 0x4b }); // signum = 1 (dương), giống SetBytes
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
`BigInt` có toán tử so sánh trực tiếp (`===`, `>`, `<`). `big.Int` và `BigInteger` là struct/class nên phải dùng phương thức (`Cmp`/`compareTo`), trả về `-1`, `0` hoặc `1`. `num_bigint::BigInt` (Rust) implement luôn các trait so sánh nên `==`/`>`/`<` dùng trực tiếp được.
:::

:::warning
Swift không có kiểu số nguyên lớn tuỳ ý trong cả stdlib lẫn Foundation. Ví dụ trên chỉ dùng `UInt64` vì các giá trị đều nhỏ; số thật sự vượt 64-bit thì phải thêm package ngoài như [attaswift/BigInt](https://github.com/attaswift/BigInt) qua Swift Package Manager.
:::
