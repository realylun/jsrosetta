---
title: "IIFE"
description: "IIFEs in Node.js compared to immediately invoked anonymous functions/closures in Go, Rust, Swift, and Java."
tags: [iife, closure, scope]
---

An IIFE (Immediately Invoked Function Expression) is a function defined and called right away, usually to create its own scope. Go, Rust, and Swift have no special syntax for this — you just define an anonymous function or closure and call it immediately. Java is harder: a lambda expression needs a concrete functional-interface type, so it can't be called directly — you have to cast it first. Nobody writes real Java like this; a plain `{ ... }` block or a private method is the usual way to create a scope instead of faking an IIFE.

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
```rust
fn main() {
    (|name: &str| {
        println!("hello {name}");
    })("bob"); // hello bob
}
```
```swift
({ (name: String) in
    print("hello \(name)")
})("bob") // hello bob
```
```java
void main() {
    // a lambda needs a concrete functional interface, so it has to be cast
    // before it can be called right away — rarely written this way in real Java
    ((Consumer<String>) name -> IO.println("hello " + name)).accept("bob"); // hello bob
}
```
:::

:::note
Since Node.js 14.8, ES modules support top-level `await`, so the `(async () => { ... })()` IIFE pattern — used only to get `await` at the top level — usually isn't needed anymore. Rust and Swift call an anonymous closure right at its definition fairly naturally, but in both languages the more common way to scope things off is a `{ ... }` block used as an expression, not an "IIFE". Java has no real IIFE — the example above is just for illustration; real Java code would use a private method or a plain block instead. Clippy flags the Rust example above with the `redundant_closure_call` lint (defining a closure and calling it right away) — a fair warning for real code, but here it's deliberately written as an IIFE to compare against the other languages.
:::
