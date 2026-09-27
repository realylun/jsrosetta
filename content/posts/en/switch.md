---
title: "Switch"
description: "How JavaScript's switch/case compares to Go (no fallthrough by default, explicit fallthrough), Rust's match (no fallthrough concept), Swift (like Go), and Java (like JS)."
tags: [switch, fallthrough, control-flow]
---

Go's `switch` looks like JavaScript's but the default behavior is exactly reversed: JavaScript falls through to the next case unless you `break`, while Go stops after the matching case unless you explicitly write `fallthrough`. Swift behaves exactly like Go (no fallthrough by default, with an explicit `fallthrough` keyword). Rust doesn't have a `switch` at all — it has `match`, and `match` **has no fallthrough concept** in any form. Java's classic `:`-style `switch` behaves like JavaScript instead: it falls through by default and needs `break` to stop — though Java 14 added an arrow-based switch expression (`->`) that never falls through.

## Non-fallthrough vs. fallthrough switch

:::tabs
```js
const value = 'b'

switch(value) {
  case 'a':
    console.log('A')
    break
  case 'b':
    console.log('B')
    break
  case 'c':
    console.log('C')
    break
  default:
    console.log('first default')
}

switch(value) {
  case 'a':
    console.log('A - falling through')
  case 'b':
    console.log('B - falling through')
  case 'c':
    console.log('C - falling through')
  default:
    console.log('second default')
}
```
```go
package main

import "fmt"

func main() {
	value := "b"

	switch value {
	case "a":
		fmt.Println("A")
	case "b":
		fmt.Println("B")
	case "c":
		fmt.Println("C")
	default:
		fmt.Println("first default")
	}

	switch value {
	case "a":
		fmt.Println("A - falling through")
		fallthrough
	case "b":
		fmt.Println("B - falling through")
		fallthrough
	case "c":
		fmt.Println("C - falling through")
		fallthrough
	default:
		fmt.Println("second default")
	}
}
```
```rust
fn main() {
    let value = "b";

    match value {
        "a" => println!("A"),
        "b" => println!("B"),
        "c" => println!("C"),
        _ => println!("first default"),
    }

    // Rust has no "fallthrough": every `match` arm is self-contained, and there's no way to
    // "flow" into the next one. Multiple patterns sharing one body are merged with `|` instead —
    // a completely different thing from Go/JS's "flow through several bodies, accumulating output".
    match value {
        "a" | "b" | "c" => println!("A, B or C"),
        _ => println!("default"),
    }
}
```
```swift
let value = "b"

switch value {
case "a":
    print("A")
case "b":
    print("B")
case "c":
    print("C")
default:
    print("first default")
}

switch value {
case "a":
    print("A - falling through")
    fallthrough
case "b":
    print("B - falling through")
    fallthrough
case "c":
    print("C - falling through")
    fallthrough
default:
    print("second default")
}
```
```java
void main() {
    String value = "b";

    switch (value) {
        case "a":
            IO.println("A");
            break;
        case "b":
            IO.println("B");
            break;
        case "c":
            IO.println("C");
            break;
        default:
            IO.println("first default");
    }

    switch (value) {
        case "a":
            IO.println("A - falling through");
        case "b":
            IO.println("B - falling through");
        case "c":
            IO.println("C - falling through");
        default:
            IO.println("second default");
    }
}
```
:::

```bash
# Go / Swift / Java
B
B - falling through
C - falling through
second default

# Rust (match has no fallthrough, see note)
B
A, B or C
```

:::warning
The second `match` example above isn't an equivalent port of the Go/JS example: it just shows how to merge several patterns into one shared body with `|` (an or-pattern), so it produces a SINGLE line of output — not the accumulated output you'd get from real fallthrough.
:::

:::note
Since Java 14 (JEP 361), Java has arrow-based case labels (`case "a" -> ...`): they never fall through and need no `break`. Arrow labels work in both switch **statements** and switch **expressions** — only the expression form returns a value directly; a statement using arrow labels still just runs the case body (the only difference from a colon-style statement is that it doesn't fall through). The example above uses the classic `:`-style `switch` since that's the only form that still has fallthrough behavior to demonstrate.
:::

## Key differences

| | Node.js | Go | Rust | Swift | Java (classic `switch`) |
|---|---|---|---|---|---|
| Default after a matching case | falls through to the next case | stops (implicit break) | stops — there's no other concept | stops (implicit break) | falls through to the next case |
| To stop | you must write `break` | nothing needed, it's the default | nothing needed, it's the default | nothing needed, it's the default | you must write `break` |
| To fall through | it already does | you must write `fallthrough` explicitly | not possible — use an or-pattern `\|` to merge cases instead | you must write `fallthrough` explicitly | it already does |
