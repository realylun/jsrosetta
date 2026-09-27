---
title: "For Loops"
description: "How JavaScript's C-style for loop compares to Go (C-style + range-over-int since 1.22), Java (keeps C-style), and Rust/Swift (no C-style for, only range)."
tags: [for-loop, range, control-flow]
---

Go keeps the three-part C-style `for` loop (`init; condition; post`) just like JavaScript. Go has no separate `while` or `do-while` — `for` is the only looping keyword, and since Go 1.22 it also has a `range` form for looping a fixed number of times. Rust never had a C-style `for` — a range (`0..6`) has been the only way to loop a number of times since Rust 1.0. Swift **used to have** a C-style `for` but removed it entirely in Swift 3.0 (SE-0007), also moving to ranges. Java still keeps the C-style `for`, just like JavaScript.

## The C-style loop and range-over-int

:::tabs
```js
for (let i = 0; i <= 5; i++) {
  console.log(i)
}
```
```go
package main

import "fmt"

func main() {
	for i := 0; i <= 5; i++ {
		fmt.Println(i)
	}

	// range over an integer to loop a fixed number of times
	for i := range 6 {
		fmt.Println(i)
	}
}
```
```rust
fn main() {
    for i in 0..=5 {
        println!("{i}");
    }

    // Rust has no three-part C-style for — a range is the only way to loop a fixed number of
    // times, and has existed since Rust 1.0 (Go only added range-over-int in 1.22)
    for i in 0..6 {
        println!("{i}");
    }
}
```
```swift
for i in 0...5 {
    print(i)
}

// Swift removed the C-style for entirely in Swift 3.0 (SE-0007) — a range is the standard way
// to loop, the same idea as the range-over-int Go only added in 1.22
for i in 0..<6 {
    print(i)
}
```
```java
void main() {
    for (int i = 0; i <= 5; i++) {
        IO.println(i);
    }

    // Java has no range-over-int syntax like Go 1.22+; the closest thing is IntStream.range(...)
    IntStream.range(0, 6).forEach(IO::println);
}
```
:::

```bash
# Node.js
0
1
2
3
4
5

# Go / Rust / Swift / Java
0
1
2
3
4
5
0
1
2
3
4
5
```

:::note
Go 1.22 added `for i := range N` (ranging over an integer) as a concise way to loop N times; before 1.22 you needed the classic `for i := 0; i < N; i++` form. Go 1.22 also gave every `for` loop its own per-iteration copy of the loop variable, so the old `x := x` workaround needed before capturing a loop variable in a goroutine or closure is no longer necessary. Both require `go 1.22`+ in go.mod.
:::

:::note
In Rust, `0..6` excludes 6 while `0..=6` includes it; Swift uses `..<` and `...` for the same idea. In other words, Go 1.22 only just caught up with what Rust and (early) Swift already had for years.
:::
