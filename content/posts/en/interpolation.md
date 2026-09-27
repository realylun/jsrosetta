---
title: "String Interpolation"
description: "How JavaScript's template literals (`${}`) map to Go's fmt.Sprintf."
tags: [string, template-literal, sprintf]
---

JavaScript has string interpolation built right into the language via template literals (backtick strings). Go has no dedicated syntax for this — you use `fmt.Sprintf` with format verbs (`%s`, `%d`, …), similar to C's `printf`.

## String interpolation

:::tabs
```js
const name = 'bob'
const age = 21
const message = `${name} is ${age} years old`

console.log(message)
```
```go
package main

import "fmt"

func main() {
	name := "bob"
	age := 21
	message := fmt.Sprintf("%s is %d years old", name, age)

	fmt.Println(message)
}
```
:::

```bash
bob is 21 years old
```
