---
title: "First-Class Functions"
description: "First-class functions, closures, and currying in Node.js compared to function values and closures in Go, Rust, Swift, and Java."
tags: [closure, higher-order-function, currying, bind]
---

In Node.js, functions are first-class values: you can assign them to variables, pass them as arguments, return them from other functions, and compose new ones out of old ones. Go treats functions as values too — the difference is that every function type must be declared explicitly, and there's no `bind`; closures handle that instead. Rust and Swift also treat functions as first-class values with closures, just like Go. Java wraps functions in *functional interfaces* (`Function`, `BinaryOperator`, `Supplier`, and so on) from the `java.util.function` package, and any variable captured by a closure must be "effectively final" — never reassigned after it's declared.

## Assigning and passing functions

:::tabs
```js
// assign a function to a variable
const add = (a, b) => a + b;

// pass a function as an argument (higher-order function)
const apply = (fn, a, b) => fn(a, b);
console.log(apply(add, 2, 3)); // 5
```
```go
package main

import "fmt"

// assign a function to a variable
var add = func(a, b int) int { return a + b }

// pass a function as an argument (higher-order function)
func apply(fn func(int, int) int, a, b int) int {
	return fn(a, b)
}
```
```rust
// a plain function: Rust doesn't allow top-level `let`, so this is a `fn`
fn add(a: i32, b: i32) -> i32 {
    a + b
}

// pass a function as an argument (higher-order function)
fn apply(f: impl Fn(i32, i32) -> i32, a: i32, b: i32) -> i32 {
    f(a, b)
}
```
```swift
// assign a function to a variable
let add: (Int, Int) -> Int = { a, b in a + b }

// pass a function as an argument (higher-order function)
func apply(_ fn: (Int, Int) -> Int, _ a: Int, _ b: Int) -> Int {
    return fn(a, b)
}
```
```java
// assign a function to a variable (functional interface; the type must be explicit)
BinaryOperator<Integer> add = (a, b) -> a + b;

// pass a function as an argument (higher-order function)
int apply(BinaryOperator<Integer> fn, int a, int b) {
    return fn.apply(a, b);
}
```
:::

## Closures: a function that remembers its own state

:::tabs
```js
function makeCounter() {
  let count = 0;
  return () => ++count;
}

const counter = makeCounter();
console.log(counter(), counter(), counter()); // 1 2 3
```
```go
// return a function that closes over its own state
func makeCounter() func() int {
	count := 0
	return func() int {
		count++
		return count
	}
}
```
```rust
// return a closure that captures its own state
fn make_counter() -> impl FnMut() -> i32 {
    let mut count = 0;
    move || {
        count += 1;
        count
    }
}
```
```swift
func makeCounter() -> () -> Int {
    var count = 0
    return {
        count += 1
        return count
    }
}
```
```java
// return a closure with its own state — Java requires captured variables to be
// "effectively final", so a one-element array works around that limit
Supplier<Integer> makeCounter() {
    int[] count = {0};
    return () -> ++count[0];
}
```
:::

## Currying / partial application

:::tabs
```js
const addTen = add.bind(null, 10);
console.log(addTen(5)); // 15
```
```go
// Go has no bind, so a closure does the job
func addPartial(a int) func(int) int {
	return func(b int) int {
		return add(a, b)
	}
}

func main() {
	fmt.Println(apply(add, 2, 3)) // 5

	counter := makeCounter()
	fmt.Println(counter(), counter(), counter()) // 1 2 3

	addTen := addPartial(10)
	fmt.Println(addTen(5)) // 15
}
```
```rust
// Rust has no bind, so a closure returning a closure does the job
fn add_partial(a: i32) -> impl Fn(i32) -> i32 {
    move |b| add(a, b)
}

fn main() {
    println!("{}", apply(add, 2, 3)); // 5

    let mut counter = make_counter();
    println!("{} {} {}", counter(), counter(), counter()); // 1 2 3

    let add_ten = add_partial(10);
    println!("{}", add_ten(5)); // 15
}
```
```swift
// Swift has no bind, so a closure returning a closure does the job
func addPartial(_ a: Int) -> (Int) -> Int {
    return { b in add(a, b) }
}

print(apply(add, 2, 3)) // 5

let counter = makeCounter()
print(counter(), counter(), counter()) // 1 2 3

let addTen = addPartial(10)
print(addTen(5)) // 15
```
```java
// Java has no bind, so a method returning a Function does the job
Function<Integer, Integer> addPartial(int a) {
    return b -> add.apply(a, b);
}

void main() {
    IO.println(apply(add, 2, 3)); // 5

    Supplier<Integer> counter = makeCounter();
    IO.println(counter.get() + " " + counter.get() + " " + counter.get()); // 1 2 3

    Function<Integer, Integer> addTen = addPartial(10);
    IO.println(addTen.apply(5)); // 15
}
```
:::

:::tip
Go has no `Function.prototype.bind`. For currying or partial application, you write a function that returns a closure — like `addPartial` above. Rust and Swift work the same way. Java replaces the closure-returning-a-closure with a method that returns a `Function<T, R>`.
:::
