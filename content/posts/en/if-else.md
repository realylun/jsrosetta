---
title: "If/Else"
description: "How JavaScript's if/else if/else and ternary operator compare to Go (no ternary), Rust (if is an expression), and Swift/Java (both have a ternary)."
tags: [if-else, ternary, control-flow]
---

`if`/`else if`/`else` in Go reads almost identically to JavaScript — you just drop the parentheses around the condition. The biggest difference: Go **has no ternary operator** (`? :`), so you write it out with a variable and a plain `if` block instead. Rust also has no ternary operator, but `if` in Rust is an **expression**, so it reads more compactly than Go's version. Swift and Java both have a real `? :` just like JavaScript.

## Conditional branching

:::tabs
```js
const array = [1, 2]

if (array) {
  console.log('array exists')
}

if (array.length === 2) {
  console.log('length is 2')
} else if (array.length === 1) {
  console.log('length is 1')
} else {
  console.log('length is other')
}

const isOddLength = array.length % 2 == 1 ? 'yes' : 'no'

console.log(isOddLength)
```
```go
package main

import "fmt"

func main() {
	array := []byte{1, 2}

	if array != nil {
		fmt.Println("array exists")
	}

	if len(array) == 2 {
		fmt.Println("length is 2")
	} else if len(array) == 1 {
		fmt.Println("length is 1")
	} else {
		fmt.Println("length is other")
	}

	// closest thing to a ternary operator
	isOddLength := "no"
	if len(array)%2 == 1 {
		isOddLength = "yes"
	}

	fmt.Println(isOddLength)
}
```
```rust
fn main() {
    let array: Vec<u8> = vec![1, 2];

    // an owned Vec has no "nil" state like a Go slice, so it always "exists" here
    println!("array exists");

    if array.len() == 2 {
        println!("length is 2");
    } else if array.len() == 1 {
        println!("length is 1");
    } else {
        println!("length is other");
    }

    // `if` is an expression in Rust — closer to a ternary than Go's approach
    let is_odd_length = if array.len() % 2 == 1 { "yes" } else { "no" };

    println!("{is_odd_length}");
}
```
```swift
let array = [1, 2]

// Array is a value type and non-optional here, so it always "exists" — no nil state like a Go slice
print("array exists")

if array.count == 2 {
    print("length is 2")
} else if array.count == 1 {
    print("length is 1")
} else {
    print("length is other")
}

let isOddLength = array.count % 2 == 1 ? "yes" : "no" // Swift has a ternary operator, unlike Go

print(isOddLength)
```
```java
void main() {
    int[] array = { 1, 2 };

    if (array != null) {
        IO.println("array exists");
    }

    if (array.length == 2) {
        IO.println("length is 2");
    } else if (array.length == 1) {
        IO.println("length is 1");
    } else {
        IO.println("length is other");
    }

    String isOddLength = array.length % 2 == 1 ? "yes" : "no"; // Java has a ternary operator, unlike Go

    IO.println(isOddLength);
}
```
:::

```bash
array exists
length is 2
no
```

:::note
Go has no general "truthy/falsy" concept like JavaScript. `if array != nil` only checks whether the slice is `nil` (an empty-but-non-nil slice still passes this check) — to check emptiness, use `len(array) == 0`. Java's array can also be `null` just like a Go slice, so `array != null` is a genuinely equivalent check there. Rust's `Vec` and Swift's `Array` have no null state unless wrapped in `Option`/an optional, so the "exists" check in those two examples is only for illustration.
:::
