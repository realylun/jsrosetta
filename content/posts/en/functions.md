---
title: "Functions"
description: "How Node.js declares functions and parameter types compared to Go's explicit function signatures."
tags: [function, syntax, types]
---

Node.js doesn't require you to declare types for parameters or return values — everything is inferred at runtime. Go is the opposite: every parameter and return value needs an explicit type, and in exchange type errors are caught at compile time instead of at runtime.

## Declaring a function

:::tabs
```js
function add(a, b) {
  return a + b;
}

const result = add(2, 3);
console.log(result); // 5
```
```go
package main

import "fmt"

func add(a int, b int) int {
	return a + b
}

func main() {
	result := add(2, 3)
	fmt.Println(result) // 5
}
```
:::
