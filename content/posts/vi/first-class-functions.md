---
title: "Hàm hạng nhất"
description: "Hàm hạng nhất, closure và currying trong Node.js so với hàm-giá-trị và closure trong Go, Rust, Swift và Java."
date: "2026-09-27"
order: 505
category: functions
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.26"
  swift: "2.0"
  java: "25"
tags: [closure, higher-order-function, currying, bind]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#first-class-functions"
---

Trong Node.js, hàm là giá trị hạng nhất: gán được cho biến, truyền làm tham số, trả về từ hàm khác, và ghép lại thành hàm mới. Go cũng coi hàm là giá trị, chỉ khác là mọi kiểu hàm phải khai báo tường minh và không có `bind` — closure lo phần đó. Rust và Swift cũng coi hàm là giá trị hạng nhất, có closure y hệt Go. Java thì gói hàm trong các *functional interface* (`Function`, `BinaryOperator`, `Supplier`...) từ package `java.util.function`, và biến bị closure "bắt" (capture) phải là "effectively final" — không được gán lại sau khi khai báo.

## Gán và truyền hàm

:::tabs
```js
// gán hàm cho một biến
const add = (a, b) => a + b;

// truyền hàm làm tham số (higher-order function)
const apply = (fn, a, b) => fn(a, b);
console.log(apply(add, 2, 3)); // 5
```
```go
package main

import "fmt"

// gán hàm cho một biến
var add = func(a, b int) int { return a + b }

// truyền hàm làm tham số (higher-order function)
func apply(fn func(int, int) int, a, b int) int {
	return fn(a, b)
}
```
```rust
// hàm thường: Rust không cho `let` ở top-level, nên khai báo bằng `fn`
fn add(a: i32, b: i32) -> i32 {
    a + b
}

// truyền hàm làm tham số (higher-order function)
fn apply(f: impl Fn(i32, i32) -> i32, a: i32, b: i32) -> i32 {
    f(a, b)
}
```
```swift
// gán hàm cho một biến
let add: (Int, Int) -> Int = { a, b in a + b }

// truyền hàm làm tham số (higher-order function)
func apply(_ fn: (Int, Int) -> Int, _ a: Int, _ b: Int) -> Int {
    return fn(a, b)
}
```
```java
// gán hàm cho một biến (functional interface, kiểu hàm phải khai báo tường minh)
BinaryOperator<Integer> add = (a, b) -> a + b;

// truyền hàm làm tham số (higher-order function)
int apply(BinaryOperator<Integer> fn, int a, int b) {
    return fn.apply(a, b);
}
```
:::

## Closure: hàm nhớ trạng thái của chính nó

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
// trả về một hàm đóng gói (closure) trạng thái của riêng nó
func makeCounter() func() int {
	count := 0
	return func() int {
		count++
		return count
	}
}
```
```rust
// trả về một closure đóng gói (capture) trạng thái của riêng nó
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
// trả về một hàm đóng gói (closure) trạng thái riêng — Java bắt biến capture phải
// "effectively final", nên dùng mảng 1 phần tử để lách qua giới hạn đó
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
// Go không có bind, dùng closure để thay thế
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
// Rust không có bind, dùng closure trả về closure để thay thế
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
// Swift không có bind, dùng closure trả về closure để thay thế
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
// Java không có bind, dùng closure trả về closure để thay thế
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
Go không có `Function.prototype.bind`. Muốn currying hay partial application, bạn viết một hàm trả về closure — như `addPartial` ở trên. Rust và Swift cũng vậy. Java thì thay closure-trả-closure bằng một method trả về `Function<T, R>`.
:::
