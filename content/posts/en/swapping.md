---
title: "Swapping Variables"
description: "Swapping two variables with array destructuring in Node.js compared to destructuring assignment in Rust, the `swap` function in Swift, multiple assignment in Go, and a temporary variable in Java."
tags: [swap, multiple-assignment]
---

Node.js swaps two variables with array destructuring, no temporary variable needed. Go does the exact same thing with multiple assignment — also with no temporary variable. Rust has had destructuring assignment for tuples since 1.59 (`(b, a) = (a, b)`), the same idea. Swift ships a `swap(&a, &b)` function in its standard library. Java has no syntax for this at all — you still need a temporary variable.

## Swapping two variables

:::tabs
```js
let a = 'foo';
let b = 'bar';

console.log(a, b); // foo bar

[b, a] = [a, b];

console.log(a, b); // bar foo
```
```go
package main

import "fmt"

func main() {
	a := "foo"
	b := "bar"

	fmt.Println(a, b) // foo bar

	b, a = a, b

	fmt.Println(a, b) // bar foo
}
```
```rust
fn main() {
    let mut a = "foo";
    let mut b = "bar";

    println!("{a} {b}"); // foo bar

    (b, a) = (a, b); // destructuring assignment, no `let` needed

    println!("{a} {b}"); // bar foo
}
```
```swift
var a = "foo"
var b = "bar"

print(a, b) // foo bar

swap(&a, &b) // swap ships in the standard library

print(a, b) // bar foo
```
```java
void main() {
    String a = "foo";
    String b = "bar";

    IO.println(a + " " + b); // foo bar

    // no destructuring assignment: still needs a temporary variable
    String temp = a;
    a = b;
    b = temp;

    IO.println(a + " " + b); // bar foo
}
```
:::

:::note
Rust 1.59 added destructuring assignment for tuples/slices/structs (`(b, a) = (a, b)`) — before that it only worked with `let`. Java has no way to do this more concisely than a temporary variable, for any type.
:::
