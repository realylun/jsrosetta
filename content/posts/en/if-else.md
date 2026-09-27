---
title: "If/Else"
description: "How JavaScript's if/else if/else and ternary operator compare to Go's if/else if/else (Go has no ternary operator)."
tags: [if-else, ternary, control-flow]
---

`if`/`else if`/`else` in Go reads almost identically to JavaScript — you just drop the parentheses around the condition. The biggest difference: Go **has no ternary operator** (`? :`), so you write it out with a variable and a plain `if` block instead.

## Conditional branching

:::tabs
```js
const array = [1, 2]

if (array) {
  console.log('array exists')
}

if (array.length === 2) {
  console.log('length is 2')
} else if (array.length === 1) {
  console.log('length is 1')
} else {
  console.log('length is other')
}

const isOddLength = array.length % 2 == 1 ? 'yes' : 'no'

console.log(isOddLength)
```
```go
package main

import "fmt"

func main() {
	array := []byte{1, 2}

	if array != nil {
		fmt.Println("array exists")
	}

	if len(array) == 2 {
		fmt.Println("length is 2")
	} else if len(array) == 1 {
		fmt.Println("length is 1")
	} else {
		fmt.Println("length is other")
	}

	// closest thing to a ternary operator
	isOddLength := "no"
	if len(array)%2 == 1 {
		isOddLength = "yes"
	}

	fmt.Println(isOddLength)
}
```
:::

```bash
array exists
length is 2
no
```

:::note
Go has no general "truthy/falsy" concept like JavaScript. `if array != nil` only checks whether the slice is `nil` (an empty-but-non-nil slice still passes this check) — to check emptiness, use `len(array) == 0`.
:::
