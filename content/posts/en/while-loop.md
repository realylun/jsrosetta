---
title: "While Loops"
description: "How JavaScript's while loop maps to Go's for used as a while loop (Go has no while keyword) — Rust, Swift, and Java all have while like JavaScript."
tags: [while-loop, for, control-flow]
---

Go has no `while` keyword. The same thing is achieved with `for` and just a condition, dropping the `init` and `post` parts entirely. Rust, Swift, and Java all have `while` just like JavaScript — of these five languages, Go is the only exception.

## while in JavaScript, for in Go

:::tabs
```js
let i = 0

while (i <= 5) {
  console.log(i)

  i++
}
```
```go
package main

import "fmt"

func main() {
	i := 0

	for i <= 5 {
		fmt.Println(i)

		i++
	}
}
```
```rust
fn main() {
    let mut i = 0;

    while i <= 5 {
        println!("{i}");

        i += 1;
    }
}
```
```swift
var i = 0

while i <= 5 {
    print(i)

    i += 1
}
```
```java
void main() {
    int i = 0;

    while (i <= 5) {
        IO.println(i);

        i++;
    }
}
```
:::

```bash
0
1
2
3
4
5
```
