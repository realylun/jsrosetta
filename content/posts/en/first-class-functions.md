---
title: "First-Class Functions"
description: "First-class functions, closures, and currying in Node.js compared to function values and closures in Go."
tags: [closure, higher-order-function, currying, bind]
---

In Node.js, functions are first-class values: you can assign them to variables, pass them as arguments, return them from other functions, and compose new ones out of old ones. Go treats functions as values too — the difference is that every function type must be declared explicitly, and there's no `bind`; closures handle that instead.

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

func main() {
	fmt.Println(apply(add, 2, 3)) // 5
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

func main() {
	counter := makeCounter()
	fmt.Println(counter(), counter(), counter()) // 1 2 3
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
	addTen := addPartial(10)
	fmt.Println(addTen(5)) // 15
}
```
:::

:::tip
Go has no `Function.prototype.bind`. For currying or partial application, you write a function that returns a closure — like `addPartial` above.
:::
