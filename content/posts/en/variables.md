---
title: "Variables and Constants"
description: "What const and let in Node.js correspond to in Go, Rust, Swift, and Java."
tags: [const, let, immutability, type-inference]
---

In JavaScript you're used to two keywords: `const` (can't be reassigned) and `let` (can be reassigned). Most other languages split the same two concepts, just with different names and defaults.

## Basic declarations

:::tabs
```js
const name = "neko"; // cannot be reassigned
let count = 0;       // can be reassigned
count += 1;

console.log(name, count);
```
```go
package main

import "fmt"

const name = "neko" // compile-time constant

func main() {
	var count int = 0 // explicit declaration
	count += 1
	total := 10 // short declaration + type inference (only inside functions)

	fmt.Println(name, count, total)
}
```
```rust
fn main() {
    let name = "neko";  // immutable by default
    let mut count = 0;  // needs `mut` to be reassignable
    count += 1;

    println!("{name} {count}");
}
```
```swift
let name = "neko" // constant
var count = 0     // variable
count += 1

print(name, count)
```
```java
public class Main {
    public static void main(String[] args) {
        final String name = "neko"; // cannot be reassigned
        var count = 0;              // Java 10+: local type inference
        count += 1;

        System.out.println(name + " " + count);
    }
}
```
:::

| Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|
| `const` | `const` (compile-time values only) | `let` | `let` | `final` |
| `let` | `var` / `:=` | `let mut` | `var` | regular variable / `var` |

:::note
Rust is the only language on this list where **immutability is the default**. To change a value, you have to ask permission with `mut`.
:::

## Compile-time constants

`const` in JavaScript only blocks reassignment — the value itself can still be computed at runtime. Other languages usually have an extra kind of constant that's **evaluated at compile time**.

:::tabs
```js
const MAX_USERS = 100;
const startedAt = Date.now(); // still valid: computed at runtime
```
```go
const MaxUsers = 100

// const startedAt = time.Now() // error: not a compile-time constant
var startedAt = time.Now()
```
```rust
const MAX_USERS: u32 = 100; // type annotation required

fn main() {
    let started_at = std::time::Instant::now(); // runtime value uses `let`
    println!("{MAX_USERS} {started_at:?}");
}
```
```swift
let maxUsers = 100
let startedAt = Date() // `let` also accepts runtime values
```
```java
static final int MAX_USERS = 100;
static final long STARTED_AT = System.currentTimeMillis();
```
:::

## Default values when unassigned

JavaScript gives you `undefined`. Go assigns a **zero value** based on the type. The other languages force you to assign a value before using it.

:::tabs
```js
let title;
console.log(title); // undefined
```
```go
var title string // ""
var n int        // 0
var ok bool      // false
var p *int       // nil
```
```rust
let title: String;
// println!("{title}"); // error: using a variable before it's initialized
title = String::from("hi");
println!("{title}");
```
```swift
func example() {
    var title: String?  // Optional, defaults to nil
    let label: String
    // print(label)     // error: used before being initialized
    label = "hi"
    print(title ?? "-", label)
}
```
```java
String title;      // local variable: must be assigned before reading
static int count;  // field: defaults to 0, object: null
```
:::

## const doesn't mean immutable

In JavaScript, `const` only locks the **reference**. The object inside can still be mutated. Other languages handle this very differently:

:::tabs
```js
const user = { name: "neko" };
user.name = "tama"; // valid
Object.freeze(user); // to really lock it down, you need to freeze it
```
```go
// Go has no const for struct/slice/map.
// Pass by value (copy) to avoid mutation.
user := User{Name: "neko"}
user.Name = "tama"
```
```rust
let user = User { name: "neko".to_string() };
// user.name = "tama".to_string(); // error: `user` isn't `mut`
let mut user = user;
user.name = "tama".to_string();
```
```swift
struct User { var name: String } // struct is a value type

let user = User(name: "neko")
// user.name = "tama" // error: `let` locks the whole struct
```
```java
record User(String name) {} // record: fields are final

final User user = new User("neko");
User renamed = new User("tama"); // creates a new object
```
:::
