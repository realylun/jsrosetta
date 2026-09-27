---
title: "Comments"
description: "JavaScript's line (`//`) and block (`/* */`) comments use the exact same syntax as Go — the only difference is doc-comment convention."
tags: [comments, syntax]
---

JavaScript and Go share the exact same comment syntax: `//` for a single line, `/* ... */` for a multi-line block. There's nothing new to learn here — the real difference only shows up once a comment sits right above a declaration and becomes a doc comment (JSDoc in Node.js, godoc in Go).

## Line and block comments

:::tabs
```js
// this is a line comment

/*
 this is a block comment
*/
```
```go
package main

func main() {
	// this is a line comment

	/*
	   this is a block comment
	*/
}
```
:::

## Doc comments: JSDoc vs. godoc

:::tabs
```js
/**
 * Returns a greeting for the given name.
 * @param {string} name
 * @returns {string}
 */
function greet(name) {
  return `Hello, ${name}!`
}

console.log(greet('Go')) // Hello, Go!
```
```go
package main

import "fmt"

// Greet returns a greeting for the given name.
func Greet(name string) string {
	return "Hello, " + name + "!"
}

func main() {
	fmt.Println(Greet("Go")) // Hello, Go!
}
```
:::

A Go doc comment must start with the exact name of the identifier it describes (`Greet returns...`) for `go doc`/godoc and editors to recognize it; JSDoc uses a `/** ... */` block with `@param`/`@returns` tags so tools like VS Code and TypeScript can infer types and show hints.
