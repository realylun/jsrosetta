---
title: "Uint8Array"
description: "Node.js's Uint8Array (set, subarray, fill) compared to Go's []uint8, Rust's &[u8], Swift's [UInt8], and Java's byte[]."
tags: [uint8array, bytes, slice, binary]
---

Node.js's `Uint8Array` is a `TypedArray` holding only unsigned 8-bit integers, with built-in `set`/`subarray`/`fill` methods. Go has no dedicated type for this — you use `[]uint8` directly (identical to `[]byte`, since `byte` is just an alias for `uint8`), along with the language's ordinary slice and loop operations. Rust is similar: `Vec<u8>`/`&[u8]` plus the slice's built-in methods (`copy_from_slice`, `fill`). Swift uses `[UInt8]` (a value type). Java is the odd one out: `byte` is always **signed** (-128..127), there's no unsigned 8-bit type, and a raw array (`byte[]`) has no lightweight "view" like subarray/slice — `Arrays.copyOfRange` always makes a copy.

## Initializing, writing, and taking a subarray

:::tabs
```js
const array = new Uint8Array(10)
console.log(array) // Uint8Array(10) [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

const offset = 1
array.set([1, 2, 3], offset)
console.log(array) // Uint8Array(10) [0, 1, 2, 3, 0, 0, 0, 0, 0, 0]

const sub = array.subarray(2)
console.log(sub) // Uint8Array(8) [2, 3, 0, 0, 0, 0, 0, 0]

const sub2 = array.subarray(2, 4)
console.log(sub2) // Uint8Array(2) [2, 3]
```
```go
package main

import "fmt"

func main() {
	array := make([]uint8, 10)
	fmt.Println(array) // [0 0 0 0 0 0 0 0 0 0]

	offset := 1
	copy(array[offset:], []uint8{1, 2, 3})
	fmt.Println(array) // [0 1 2 3 0 0 0 0 0 0]

	sub := array[2:]
	fmt.Println(sub) // [2 3 0 0 0 0 0 0]

	sub2 := array[2:4]
	fmt.Println(sub2) // [2 3]
}
```
```rust
fn main() {
    let mut array = vec![0u8; 10];
    println!("{array:?}"); // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    let offset = 1;
    array[offset..offset + 3].copy_from_slice(&[1, 2, 3]);
    println!("{array:?}"); // [0, 1, 2, 3, 0, 0, 0, 0, 0, 0]

    let sub = &array[2..];
    println!("{sub:?}"); // [2, 3, 0, 0, 0, 0, 0, 0]

    let sub2 = &array[2..4];
    println!("{sub2:?}"); // [2, 3]
}
```
```swift
var array = [UInt8](repeating: 0, count: 10)
print(array) // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

let offset = 1
array.replaceSubrange(offset..<offset + 3, with: [1, 2, 3])
print(array) // [0, 1, 2, 3, 0, 0, 0, 0, 0, 0]

let sub = array[2...]
print(Array(sub)) // [2, 3, 0, 0, 0, 0, 0, 0]

let sub2 = array[2..<4]
print(Array(sub2)) // [2, 3]
```
```java
void main() {
    byte[] array = new byte[10];
    IO.println(Arrays.toString(array)); // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    int offset = 1;
    System.arraycopy(new byte[]{1, 2, 3}, 0, array, offset, 3);
    IO.println(Arrays.toString(array)); // [0, 1, 2, 3, 0, 0, 0, 0, 0, 0]

    byte[] sub = Arrays.copyOfRange(array, 2, array.length); // always a copy, not a view
    IO.println(Arrays.toString(sub)); // [2, 3, 0, 0, 0, 0, 0, 0]

    byte[] sub2 = Arrays.copyOfRange(array, 2, 4);
    IO.println(Arrays.toString(sub2)); // [2, 3]
}
```
:::

## Fill and length (byteLength)

:::tabs
```js
const value = 9
const start = 5
const end = 10
array.fill(value, start, end)
console.log(array) // Uint8Array(10) [0, 1, 2, 3, 0, 9, 9, 9, 9, 9]

console.log(array.byteLength) // 10
```
```go
value := uint8(9)
start := 5
end := 10
for i := start; i < end; i++ {
	array[i] = value
}
fmt.Println(array) // [0 1 2 3 0 9 9 9 9 9]

fmt.Println(len(array)) // 10
```
```rust
let value = 9u8;
let start = 5;
let end = 10;
array[start..end].fill(value);
println!("{array:?}"); // [0, 1, 2, 3, 0, 9, 9, 9, 9, 9]

println!("{}", array.len()); // 10
```
```swift
let value: UInt8 = 9
let start = 5
let end = 10
for i in start..<end {
    array[i] = value
}
print(array) // [0, 1, 2, 3, 0, 9, 9, 9, 9, 9]

print(array.count) // 10
```
```java
byte value = 9;
int start = 5;
int end = 10;
Arrays.fill(array, start, end, value);
IO.println(Arrays.toString(array)); // [0, 1, 2, 3, 0, 9, 9, 9, 9, 9]

IO.println(array.length); // 10
```
:::

:::note
JS's `array.subarray()` and Go's slice `array[2:]` both only create a view, not a copy — mutating through the view also changes the underlying memory, exactly like slices behave in the "Arrays" post. Rust's `&array[2..]` aliases the same memory too, but it's an immutable borrow — mutating requires a `&mut` borrow, and the borrow checker won't let you touch the original array while that mutable slice is alive, so there's no uncontrolled aliasing the way there is in Go. Swift's `array[2...]` returns an `ArraySlice`, which initially shares memory with the original array but is copy-on-write: mutating through the slice triggers a copy and **never** changes the original array. Java's `Arrays.copyOfRange` always makes a new array, but Java does have a real array-backed view when you need one: `ByteBuffer.wrap(array).slice(2, 2)` (JDK 13+) shares memory with `array` instead of copying it.
:::

:::note
Java has no unsigned byte type — `byte` is always signed (-128..127). To read a byte as an unsigned value (0-255), use `Byte.toUnsignedInt(b)`.
:::

:::tip
Go and Swift have no built-in `.fill()` method for slices/arrays — you write a `for` loop yourself to assign a value across a range of indices. Rust (`[T]::fill`) and Java (`Arrays.fill`) have one built in.
:::
