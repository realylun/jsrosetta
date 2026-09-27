---
title: "Comment"
description: "Comment dòng (`//`) và khối (`/* */`) dùng chung một cú pháp ở cả năm ngôn ngữ — khác biệt duy nhất nằm ở quy ước viết doc comment."
date: "2026-09-27"
order: 100
category: basics
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.0"
  swift: "1.0"
  java: "25"
tags: [comments, syntax]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#comments"
---

JavaScript, Go, Rust, Swift và Java dùng chung một cú pháp comment: `//` cho một dòng, `/* ... */` cho một khối nhiều dòng (Rust còn cho phép lồng comment khối). Không có gì lạ để học ở đây — khác biệt thật sự chỉ lộ ra khi comment đứng ngay trước một khai báo và trở thành doc comment: JSDoc ở Node.js, godoc ở Go, rustdoc ở Rust, doc comment ở Swift, Javadoc ở Java.

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
```rust
fn main() {
    // đây là một comment dòng

    /*
     đây là một comment khối
    */
}
```
```swift
// đây là một comment dòng

/*
 đây là một comment khối
*/
```
```java
void main() {
    // đây là một comment dòng

    /*
     đây là một comment khối
    */
}
```
:::

## Doc comment: JSDoc, godoc, rustdoc, Swift, Javadoc

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
```rust
/// Trả về lời chào cho một cái tên.
fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}

fn main() {
    println!("{}", greet("Go")); // Hello, Go!
}
```
```swift
/// Trả về lời chào cho một cái tên.
/// - Parameter name: tên cần chào.
/// - Returns: chuỗi lời chào.
func greet(_ name: String) -> String {
    "Hello, \(name)!"
}

print(greet("Go")) // Hello, Go!
```
```java
/**
 * Trả về lời chào cho một cái tên.
 *
 * @param name tên cần chào
 * @return chuỗi lời chào
 */
static String greet(String name) {
    return "Hello, " + name + "!";
}

void main() {
    IO.println(greet("Go")); // Hello, Go!
}
```
:::

Doc comment ở Go phải bắt đầu bằng đúng tên định danh nó mô tả (`Greet returns...`) để `go doc`/godoc và các IDE nhận diện đúng; JSDoc dùng khối `/** ... */` với tag `@param`/`@returns` để công cụ như VS Code hay TypeScript suy luận kiểu và hiện gợi ý. rustdoc (`///`) không bắt buộc phải bắt đầu bằng tên hàm như Go, và render Markdown thật sự (kể cả doctest có thể chạy được). Swift dùng `///` với các marker `- Parameter`/`- Returns` để Xcode/DocC hiển thị Quick Help. Javadoc dùng `/** ... */` với tag `@param`/`@return`, kể cả với các phương thức top-level trong compact source file của Java 25.
