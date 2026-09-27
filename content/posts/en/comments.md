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
