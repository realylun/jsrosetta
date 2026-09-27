---
title: "Arrays"
description: "Node.js's slice and concat compared to Go's slices.Clone, append, and slices.Insert."
tags: [array, slice, immutability, collections]
---

In Node.js, `Array` is a flexible reference type with plenty of built-in methods. Go uses a `slice` — a view (pointer, length, capacity) into an underlying array — so slicing, cloning, and concatenating all require you to think about whether the operation shares memory with the original.

## Cloning and slicing

:::tabs
```js
const array = [1, 2, 3, 4, 5];
console.log(array);

const clone = array.slice(0); // slice() always returns a new array
console.log(clone);

const sub = array.slice(2, 4);
console.log(sub); // [3, 4]
```
```go
package main

import (
	"fmt"
	"slices"
)

func main() {
	array := []int{1, 2, 3, 4, 5}
	fmt.Println(array)

	clone := slices.Clone(array) // a real copy, no shared memory
	fmt.Println(clone)

	sub := array[2:4] // just a view, sharing memory with array
	fmt.Println(sub)  // [3 4]
}
```
:::

## Concatenating and prepending

:::tabs
```js
const concatenated = clone.concat([6, 7]);
console.log(concatenated); // [1, 2, 3, 4, 5, 6, 7]

const prepended = [-2, -1, 0].concat(concatenated);
console.log(prepended); // [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]
```
```go
concatenated := append(clone, []int{6, 7}...)
fmt.Println(concatenated) // [1 2 3 4 5 6 7]

prepended := slices.Insert(concatenated, 0, []int{-2, -1, 0}...)
fmt.Println(prepended) // [-2 -1 0 1 2 3 4 5 6 7]
```
:::

:::warning
JavaScript's `array.slice()` always returns a new array. Go's slice (`array[2:4]`) is just a view into the same memory as the original — mutating an element through `sub` also changes `array`, unless you `slices.Clone` first.
:::

:::note
Go 1.21 added the standard `slices` package: `slices.Clone` (copying) and `slices.Insert` (inserting at any position, used for prepending when the index is 0) replaced the hand-written `make`+`copy` and `append([]int{-2,-1,0}, x...)` approach.
:::
