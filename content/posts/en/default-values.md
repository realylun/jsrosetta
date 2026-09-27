---
title: "Default Values"
description: "Default parameters in Node.js compared to pointers and nil checks in Go."
tags: [default-parameters, pointers, nil]
---

Node.js lets you assign a default value right in the parameter list. Go has no such syntax — to know whether the caller left a parameter blank, you use a pointer and check for `nil`.

## Default parameter values

:::tabs
```js
function greet(name = 'stranger') {
  return `hello ${name}`;
}

console.log(greet());      // hello stranger
console.log(greet('bob')); // hello bob
```
```go
package main

import "fmt"

// use a pointer and check for nil to know whether the caller left it blank
func greet(name *string) string {
	n := "stranger"
	if name != nil {
		n = *name
	}
	return fmt.Sprintf("hello %s", n)
}

func main() {
	fmt.Println(greet(nil)) // hello stranger

	name := "bob"
	fmt.Println(greet(&name)) // hello bob
}
```
:::
