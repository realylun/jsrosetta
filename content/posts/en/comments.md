---
title: "Comments"
description: "Line (`//`) and block (`/* */`) comments use the exact same syntax across all five languages — the only difference is doc-comment convention."
tags: [comments, syntax]
---

JavaScript, Go, Rust, Swift, and Java all share the exact same comment syntax: `//` for a single line, `/* ... */` for a multi-line block (Rust even allows nesting block comments). There's nothing new to learn here — the real difference only shows up once a comment sits right above a declaration and becomes a doc comment: JSDoc in Node.js, godoc in Go, rustdoc in Rust, doc comments in Swift, Javadoc in Java.

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
```rust
fn main() {
    // this is a line comment

    /*
     this is a block comment
    */
}
```
```swift
// this is a line comment

/*
 this is a block comment
*/
```
```java
void main() {
    // this is a line comment

    /*
     this is a block comment
    */
}
```
:::

## Doc comments: JSDoc, godoc, rustdoc, Swift, Javadoc

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
```rust
/// Returns a greeting for the given name.
fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}

fn main() {
    println!("{}", greet("Go")); // Hello, Go!
}
```
```swift
/// Returns a greeting for the given name.
/// - Parameter name: the name to greet.
/// - Returns: the greeting string.
func greet(_ name: String) -> String {
    "Hello, \(name)!"
}

print(greet("Go")) // Hello, Go!
```
```java
/**
 * Returns a greeting for the given name.
 *
 * @param name the name to greet
 * @return the greeting string
 */
static String greet(String name) {
    return "Hello, " + name + "!";
}

void main() {
    IO.println(greet("Go")); // Hello, Go!
}
```
:::

A Go doc comment must start with the exact name of the identifier it describes (`Greet returns...`) for `go doc`/godoc and editors to recognize it; JSDoc uses a `/** ... */` block with `@param`/`@returns` tags so tools like VS Code and TypeScript can infer types and show hints. rustdoc (`///`) doesn't need to start with the function's name the way Go does, and it renders real Markdown (including runnable doctests). Swift uses `///` with `- Parameter`/`- Returns` markers so Xcode/DocC can show Quick Help. Javadoc uses `/** ... */` with `@param`/`@return` tags, even for top-level methods in a Java 25 compact source file.
