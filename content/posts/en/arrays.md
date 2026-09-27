---
title: "Arrays"
description: "Node.js's slice and concat compared to Go's slice, Rust's Vec, Swift's value-type Array, and Java's ArrayList."
tags: [array, slice, immutability, collections]
---

In Node.js, `Array` is a flexible reference type with plenty of built-in methods. Go uses a `slice` — a view (pointer, length, capacity) into an underlying array — so slicing, cloning, and concatenating all require you to think about whether the operation shares memory with the original. Rust has `Vec<T>`, which owns its data, and a borrowed slice type (`&[T]`) — the compiler enforces the ownership boundary. Swift's `Array` is a **value type**: assigning or passing it makes a logical copy (copy-on-write), unlike JS's implicit sharing. Java has no resizable array type — `int[]` is fixed-size — so the example below uses `ArrayList`.

## Cloning and slicing

:::tabs
```js
const array = [1, 2, 3, 4, 5]
console.log(array)

const clone = array.slice(0) // slice() always returns a new array
console.log(clone)

const sub = array.slice(2, 4)
console.log(sub) // [3, 4]
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
```rust
fn main() {
    let array = vec![1, 2, 3, 4, 5];
    println!("{array:?}");

    let clone = array.clone(); // Vec::clone always makes a real copy
    println!("{clone:?}");

    let sub = &array[2..4]; // slice: a borrow, sharing memory with array
    println!("{sub:?}"); // [3, 4]
}
```
```swift
var array = [1, 2, 3, 4, 5]
print(array)

let clone = array // Array is a value type: assignment makes a logical copy (copy-on-write)
print(clone)

let sub = array[2..<4] // ArraySlice: shares memory with array until either side is mutated
print(Array(sub)) // [3, 4]
```
```java
void main() {
    List<Integer> array = new ArrayList<>(List.of(1, 2, 3, 4, 5));
    IO.println(array);

    List<Integer> clone = new ArrayList<>(array); // copy constructor: a real copy
    IO.println(clone);

    List<Integer> sub = array.subList(2, 4); // a view backed by the original list
    IO.println(sub); // [3, 4]
}
```
:::

## Concatenating and prepending

:::tabs
```js
const concatenated = clone.concat([6, 7])
console.log(concatenated) // [1, 2, 3, 4, 5, 6, 7]

const prepended = [-2, -1, 0].concat(concatenated)
console.log(prepended) // [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]
```
```go
concatenated := append(clone, []int{6, 7}...)
fmt.Println(concatenated) // [1 2 3 4 5 6 7]

prepended := slices.Insert(concatenated, 0, []int{-2, -1, 0}...)
fmt.Println(prepended) // [-2 -1 0 1 2 3 4 5 6 7]
```
```rust
let mut concatenated = clone.clone();
concatenated.extend_from_slice(&[6, 7]);
println!("{concatenated:?}"); // [1, 2, 3, 4, 5, 6, 7]

let mut prepended = vec![-2, -1, 0];
prepended.extend_from_slice(&concatenated);
println!("{prepended:?}"); // [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]
```
```swift
let concatenated = clone + [6, 7]
print(concatenated) // [1, 2, 3, 4, 5, 6, 7]

let prepended = [-2, -1, 0] + concatenated
print(prepended) // [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]
```
```java
List<Integer> concatenated = new ArrayList<>(clone);
concatenated.addAll(List.of(6, 7));
IO.println(concatenated); // [1, 2, 3, 4, 5, 6, 7]

List<Integer> prepended = new ArrayList<>(List.of(-2, -1, 0));
prepended.addAll(concatenated);
IO.println(prepended); // [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]
```
:::

:::warning
JavaScript's `array.slice()` always returns a new array. Go's slice (`array[2:4]`) and Rust's (`&array[2..4]`) are just views into the same memory as the original — mutating an element through `sub` also changes `array`, unless you copy first (`slices.Clone` in Go, `.to_vec()` in Rust). Java's `array.subList()` is also a view backed by the original list. Swift's `ArraySlice` shares memory *until* either side is mutated (copy-on-write), at which point it actually splits.
:::

:::note
Go 1.21 added the standard `slices` package: `slices.Clone` (copying) and `slices.Insert` (inserting at any position, used for prepending when the index is 0) replaced the hand-written `make`+`copy` and `append([]int{-2,-1,0}, x...)` approach.
:::
