---
title: "Spread and Rest"
description: "Node.js's spread and rest operators compared to real variadic parameters in Swift and Java, slice destructuring in Rust, and `...T` in Go."
tags: [spread, rest, variadic, slice]
---

Node.js uses the same `...` notation for two opposite things: "spreading" an array into multiple values, and "collecting" multiple values into an array (rest). Go splits these into two forms: `...` at a call site to spread a slice, and `...T` in a parameter declaration to collect one. Swift and Java have real variadic parameters (`Int...`, `int...`) — the closest match to JS rest; Java even lets you pass an existing array straight into a variadic parameter, which is close to spread. Rust has neither spread nor rest in the JS sense: a fixed-size array is destructured through a pattern, and "many parameters" just means taking a slice.

## Spread operator

:::tabs
```js
const array = [1, 2, 3, 4, 5];

console.log(...array); // 1 2 3 4 5
```
```go
package main

import "fmt"

func main() {
	array := []byte{1, 2, 3, 4, 5}

	var i []any // any = interface{}, can hold elements of different types
	for _, value := range array {
		i = append(i, value)
	}

	fmt.Println(i...) // 1 2 3 4 5
}
```
```rust
fn main() {
    let array = [1, 2, 3, 4, 5];

    // Rust has no spread; a fixed-size array can be destructured through a
    // pattern and printed variable by variable — it doesn't generalize to
    // a dynamically-sized array.
    let [a, b, c, d, e] = array;
    println!("{a} {b} {c} {d} {e}"); // 1 2 3 4 5
}
```
```swift
let array = [1, 2, 3, 4, 5]

// Swift doesn't spread an array into a variadic parameter; join it by hand.
print(array.map(String.init).joined(separator: " ")) // 1 2 3 4 5
```
```java
static String joinAll(Object... items) {
    return Arrays.stream(items).map(String::valueOf).collect(Collectors.joining(" "));
}

void main() {
    Integer[] array = {1, 2, 3, 4, 5};

    // passing an existing array straight into a varargs parameter — the
    // closest thing to spread
    IO.println(joinAll((Object[]) array)); // 1 2 3 4 5
}
```
:::

:::note
Go 1.18 added the `any` alias for `interface{}` — used here to collect elements when you need a slice that holds several different types before spreading it with `...`. Rust has no spread operator; neither does Swift — joining an array's elements into a string needs a manual `.joined(separator:)` call.
:::

## Rest operator

:::tabs
```js
function sum(...nums) {
  let t = 0;

  for (let n of nums) {
    t += n;
  }

  return t;
}

console.log(sum(1, 2, 3, 4, 5)); // 15
```
```go
func sum(nums ...int) int {
	var t int
	for _, n := range nums {
		t += n
	}

	return t
}

func main() {
	fmt.Println(sum(1, 2, 3, 4, 5)) // 15
}
```
```rust
// Rust has no real variadic functions; the closest equivalent is a slice parameter.
fn sum(nums: &[i32]) -> i32 {
    nums.iter().sum()
}

fn main() {
    println!("{}", sum(&[1, 2, 3, 4, 5])); // 15
}
```
```swift
// Swift has real variadic parameters — the closest match to JS rest.
func sum(_ nums: Int...) -> Int {
    nums.reduce(0, +)
}

print(sum(1, 2, 3, 4, 5)) // 15
```
```java
// Java also has real variadic parameters.
static int sum(int... nums) {
    int total = 0;
    for (int n : nums) total += n;
    return total;
}

void main() {
    IO.println(sum(1, 2, 3, 4, 5)); // 15
}
```
:::

## Key differences

| | Node.js (`...`) | Go (`...`) | Rust | Swift | Java |
|---|---|---|---|---|---|
| Spread an array into arguments | `fn(...arr)` | `fn(slice...)` (variadic parameters only) | none; destructure a fixed-size array through a pattern | none; join manually | an existing array passed straight into a variadic parameter |
| Collect parameters into an array/slice | `function f(...args)` | `func f(args ...T)` | takes `&[T]` (not real variadics) | `func f(_ args: T...)` (real variadics) | `void f(T... args)` (real variadics) |
| Element type | can be mixed | must all be the same type `T` (or `any`) | must all be the same type `T` | must all be the same type `T` | must all be the same type `T` (or `Object...`) |
