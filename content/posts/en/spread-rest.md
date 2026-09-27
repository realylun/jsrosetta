---
title: "Spread and Rest"
description: "Node.js's spread and rest operators compared to variadic parameters and slice expansion (`...T`) in Go."
tags: [spread, rest, variadic, slice]
---

Node.js uses the same `...` notation for two opposite things: "spreading" an array into multiple values, and "collecting" multiple values into an array (rest). Go splits these into two forms: `...` at a call site to spread a slice, and `...T` in a parameter declaration to collect one.

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
:::

:::note
Go 1.18 added the `any` alias for `interface{}` — used here to collect elements when you need a slice that holds several different types before spreading it with `...`.
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
:::

## Key differences

| | Node.js (`...`) | Go (`...`) |
|---|---|---|
| Spread an array into arguments | `fn(...arr)` | `fn(slice...)` (variadic parameters only) |
| Collect parameters into an array/slice | `function f(...args)` | `func f(args ...T)` |
| Element type | can be mixed | must all be the same type `T` (or `any`) |
