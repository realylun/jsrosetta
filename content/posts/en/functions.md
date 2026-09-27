---
title: "Functions"
description: "How Node.js declares functions and parameter types compared to the explicit function signatures of Go, Rust, Swift, and Java."
tags: [function, syntax, types]
---

Node.js doesn't require you to declare types for parameters or return values — JavaScript is dynamically typed, so types are only known and checked at runtime, not inferred ahead of time. Go is the opposite: every parameter and return value needs an explicit type, and in exchange type errors are caught at compile time instead of at runtime. Rust and Swift also require explicit types, declaring the return type with `->` like Go; Java puts the return type before the function name, C/C++ style.

## Declaring a function

:::tabs
```js
function add(a, b) {
  return a + b
}

const result = add(2, 3)
console.log(result) // 5
```
```go
package main

import "fmt"

func add(a int, b int) int {
	return a + b
}

func main() {
	result := add(2, 3)
	fmt.Println(result) // 5
}
```
```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    let result = add(2, 3);
    println!("{result}"); // 5
}
```
```swift
func add(_ a: Int, _ b: Int) -> Int {
    return a + b
}

let result = add(2, 3)
print(result) // 5
```
```java
int add(int a, int b) {
    return a + b;
}

void main() {
    int result = add(2, 3);
    IO.println(result); // 5
}
```
:::
