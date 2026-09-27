---
title: "Default Values"
description: "Default parameters in Node.js and Swift compared to Option (Rust), overloading (Java), and pointers + nil (Go)."
tags: [default-parameters, pointers, nil, overloading]
---

Node.js lets you assign a default value right in the parameter list. Swift is the only other language here with that exact syntax. Go has no such syntax — to know whether the caller left a parameter blank, you use a pointer and check for `nil`. Rust has no default parameters either — it uses `Option` to force the caller to be explicit about "some value" vs. "none". Java solves it with overloading: define several versions of the same function.

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
```rust
// No default parameters: use Option so the caller must be explicit.
fn greet(name: Option<&str>) -> String {
    format!("hello {}", name.unwrap_or("stranger"))
}

fn main() {
    println!("{}", greet(None));       // hello stranger
    println!("{}", greet(Some("bob"))); // hello bob
}
```
```swift
func greet(name: String = "stranger") -> String {
    "hello \(name)"
}

print(greet())           // hello stranger
print(greet(name: "bob")) // hello bob
```
```java
// No default parameters: overload several versions of the same function.
static String greet() {
    return greet("stranger");
}

static String greet(String name) {
    return "hello " + name;
}

void main() {
    IO.println(greet());      // hello stranger
    IO.println(greet("bob")); // hello bob
}
```
:::

:::note
Rust and Java have no default parameters. Rust uses `Option<T>` to force the caller to pass `None`/`Some` explicitly; Java overloads several function signatures instead — both are common workarounds, not dedicated syntax for this.
:::
