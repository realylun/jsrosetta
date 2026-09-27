---
title: "IIFE"
description: "IIFEs in Node.js compared to immediately invoked anonymous functions in Go."
tags: [iife, closure, scope]
---

An IIFE (Immediately Invoked Function Expression) is a function defined and called right away, usually to create its own scope. Go has no special syntax for this — you just define an anonymous function and call it immediately, exactly the same way.

## Defining and calling a function immediately

:::tabs
```js
(function (name) {
  console.log('hello', name);
})('bob'); // hello bob
```
```go
package main

import "fmt"

func main() {
	func(name string) {
		fmt.Println("hello", name)
	}("bob") // hello bob
}
```
:::

:::note
Since Node.js 14.8, ES modules support top-level `await`, so the `(async () => { ... })()` IIFE pattern — used only to get `await` at the top level — usually isn't needed anymore.
:::
