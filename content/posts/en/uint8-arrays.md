---
title: "Uint8Array"
description: "Node.js's Uint8Array (set, subarray, fill) compared to Go's []uint8 and plain slice operations."
tags: [uint8array, bytes, slice, binary]
---

Node.js's `Uint8Array` is a `TypedArray` holding only unsigned 8-bit integers, with built-in `set`/`subarray`/`fill` methods. Go has no dedicated type for this — you use `[]uint8` directly (identical to `[]byte`, since `byte` is just an alias for `uint8`), along with the language's ordinary slice and loop operations.

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
:::

:::note
JS's `array.subarray()` and Go's slice `array[2:]` both only create a view, not a copy — mutating through the view also changes the underlying memory, exactly like slices behave in the "Arrays" post.
:::

:::tip
Go has no built-in `.fill()` method for slices — you write a `for` loop yourself to assign a value across a range of indices.
:::
