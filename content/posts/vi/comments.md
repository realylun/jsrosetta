---
title: "Comment"
description: "Comment dòng (`//`) và khối (`/* */`) của JavaScript dùng cú pháp giống hệt Go — khác biệt duy nhất nằm ở quy ước viết doc comment."
date: "2026-09-27"
order: 100
category: basics
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [comments, syntax]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#comments"
---

JavaScript và Go dùng chung một cú pháp comment: `//` cho một dòng, `/* ... */` cho một khối nhiều dòng. Không có gì lạ để học ở đây — khác biệt thật sự chỉ lộ ra khi comment đứng ngay trước một khai báo và trở thành doc comment (JSDoc ở Node.js, godoc ở Go).

## Comment dòng và khối

:::tabs
```js
// đây là một comment dòng

/*
 đây là một comment khối
*/
```
```go
package main

func main() {
	// đây là một comment dòng

	/*
	   đây là một comment khối
	*/
}
```
:::

## Doc comment: JSDoc và godoc

:::tabs
```js
/**
 * Trả về lời chào cho một cái tên.
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

// Greet trả về lời chào cho một cái tên.
func Greet(name string) string {
	return "Hello, " + name + "!"
}

func main() {
	fmt.Println(Greet("Go")) // Hello, Go!
}
```
:::

Doc comment ở Go phải bắt đầu bằng đúng tên định danh nó mô tả (`Greet returns...`) để `go doc`/godoc và các IDE nhận diện đúng; JSDoc dùng khối `/** ... */` với tag `@param`/`@returns` để công cụ như VS Code hay TypeScript suy luận kiểu và hiện gợi ý.
