---
title: "Iterating arrays (map, filter, reduce)"
description: "Node.js's forEach, map, filter, reduce compared to Rust, Swift, and Java iterators, and hand-written generic Map/Filter/Reduce functions in Go."
tags: [array, iteration, generics, functional]
---

Node.js ships `forEach`, `map`, `filter`, and `reduce` right on `Array.prototype`. Go's standard library has none of these for slices, but since Go 1.18 you can write them once using generics and reuse them for any data type. Rust, Swift, and Java all ship `map`/`filter`/`fold` (or `reduce`) right on their iterators/streams — no need to hand-write them like in Go.

## Iterating over each element (forEach)

:::tabs
```js
const array = ['a', 'b', 'c']

array.forEach((value, i) => {
  console.log(i, value)
})
// 0 a
// 1 b
// 2 c
```
```go
package main

import "fmt"

func main() {
	array := []string{"a", "b", "c"}

	for i, value := range array {
		fmt.Println(i, value)
	}
	// 0 a
	// 1 b
	// 2 c
}
```
```rust
fn main() {
    let array = ["a", "b", "c"];

    for (i, value) in array.iter().enumerate() {
        println!("{i} {value}");
    }
    // 0 a
    // 1 b
    // 2 c
}
```
```swift
let array = ["a", "b", "c"]

for (i, value) in array.enumerated() {
    print(i, value)
}
// 0 a
// 1 b
// 2 c
```
```java
void main() {
    List<String> array = List.of("a", "b", "c");

    for (int i = 0; i < array.size(); i++) {
        IO.println(i + " " + array.get(i));
    }
    // 0 a
    // 1 b
    // 2 c
}
```
:::

## map, filter, reduce with generics

:::tabs
```js
const mapped = array.map((value) => value.toUpperCase())
console.log(mapped) // ['A', 'B', 'C']

const filtered = array.filter((value, i) => i % 2 == 0)
console.log(filtered) // ['a', 'c']

const reduced = array.reduce((acc, value, i) => {
  if (i % 2 == 0) acc.push(value.toUpperCase())
  return acc
}, [])
console.log(reduced) // ['A', 'C']
```
```go
import "strings"

func Map[T, U any](s []T, f func(value T, i int) U) []U {
	result := make([]U, len(s))
	for i, value := range s {
		result[i] = f(value, i)
	}
	return result
}

func Filter[T any](s []T, f func(value T, i int) bool) []T {
	var result []T
	for i, value := range s {
		if f(value, i) {
			result = append(result, value)
		}
	}
	return result
}

func Reduce[T, U any](s []T, initial U, f func(acc U, value T, i int) U) U {
	acc := initial
	for i, value := range s {
		acc = f(acc, value, i)
	}
	return acc
}

mapped := Map(array, func(value string, _ int) string {
	return strings.ToUpper(value)
})
fmt.Println(mapped) // [A B C]

filtered := Filter(array, func(_ string, i int) bool {
	return i%2 == 0
})
fmt.Println(filtered) // [a c]

reduced := Reduce(array, []string{}, func(acc []string, value string, i int) []string {
	if i%2 == 0 {
		acc = append(acc, strings.ToUpper(value))
	}
	return acc
})
fmt.Println(reduced) // [A C]
```
```rust
let mapped: Vec<String> = array.iter().map(|v| v.to_uppercase()).collect();
println!("{mapped:?}"); // ["A", "B", "C"]

let filtered: Vec<&str> = array
    .iter()
    .copied()
    .enumerate()
    .filter(|&(i, _)| i % 2 == 0)
    .map(|(_, v)| v)
    .collect();
println!("{filtered:?}"); // ["a", "c"]

let reduced = array
    .iter()
    .copied()
    .enumerate()
    .fold(Vec::new(), |mut acc, (i, v)| {
        if i % 2 == 0 {
            acc.push(v.to_uppercase());
        }
        acc
    });
println!("{reduced:?}"); // ["A", "C"]
```
```swift
let mapped = array.map { $0.uppercased() }
print(mapped) // ["A", "B", "C"]

let filtered = array.enumerated().filter { (i, _) in i % 2 == 0 }.map { $0.1 }
print(filtered) // ["a", "c"]

let reduced = array.enumerated().reduce(into: [String]()) { acc, pair in
    let (i, value) = pair
    if i % 2 == 0 { acc.append(value.uppercased()) }
}
print(reduced) // ["A", "C"]
```
```java
List<String> mapped = array.stream().map(String::toUpperCase).toList();
IO.println(mapped); // [A, B, C]

List<String> filtered = IntStream.range(0, array.size())
        .filter(i -> i % 2 == 0)
        .mapToObj(array::get)
        .toList();
IO.println(filtered); // [a, c]

List<String> reduced = IntStream.range(0, array.size())
        .filter(i -> i % 2 == 0)
        .mapToObj(i -> array.get(i).toUpperCase())
        .toList();
IO.println(reduced); // [A, C]
```
:::

:::note
Go 1.18 added generics (type parameters). Before that you'd write a `for` loop by hand for every type; now `Map`/`Filter`/`Reduce` are written once with `[T, U any]` and reused for `[]string`, `[]int`, and so on — they're not in the standard library, so you (or a package) have to define them yourself. Java's streams have no index-aware `filter`, so filtering by position goes through `IntStream.range` and `mapToObj` to look the element back up.
:::
