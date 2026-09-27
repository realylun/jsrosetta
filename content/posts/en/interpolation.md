---
title: "String Interpolation"
description: "How JavaScript's template literals (`${}`) compare to Go's fmt.Sprintf, Rust's format!/println!, Swift's string interpolation, and Java's String.formatted."
tags: [string, template-literal, sprintf]
---

JavaScript has string interpolation built right into the language via template literals (backtick strings). Go has no dedicated syntax for this — you use `fmt.Sprintf` with format verbs (`%s`, `%d`, …), similar to C's `printf`. Rust and Swift both have real string interpolation built into the language (`format!`/`println!` with `{name}`, and `\(name)`). Java doesn't — even the String Templates feature that was previewed in Java 21/22 was withdrawn — so it's still `String.format`/`.formatted()` in the `printf` style, just like Go.

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
```rust
fn main() {
    let name = "bob";
    let age = 21;
    let message = format!("{name} is {age} years old"); // interpolates the identifier directly

    println!("{message}");
}
```
```swift
let name = "bob"
let age = 21
let message = "\(name) is \(age) years old"

print(message)
```
```java
void main() {
    String name = "bob";
    int age = 21;
    String message = "%s is %d years old".formatted(name, age); // no string interpolation

    IO.println(message);
}
```
:::

```bash
bob is 21 years old
```

:::note
Java tried adding String Templates (`STR."\{name} is \{age} years old"`) in JEP 430 (Java 21, preview) and JEP 459 (Java 22, second preview), but withdrew it in Java 23 for a redesign, and it's still not back as of Java 25. `String.format`/`.formatted()` remains the standard way.
:::
