---
title: "Swapping Variables"
description: "Swapping two variables with array destructuring in Node.js compared to multiple assignment in Go."
tags: [swap, multiple-assignment]
---

Node.js swaps two variables with array destructuring, no temporary variable needed. Go does the exact same thing with multiple assignment — also with no temporary variable.

## Swapping two variables

:::tabs
```js
let a = 'foo';
let b = 'bar';

console.log(a, b); // foo bar

[b, a] = [a, b];

console.log(a, b); // bar foo
```
```go
package main

import "fmt"

func main() {
	a := "foo"
	b := "bar"

	fmt.Println(a, b) // foo bar

	b, a = a, b

	fmt.Println(a, b) // bar foo
}
```
:::
