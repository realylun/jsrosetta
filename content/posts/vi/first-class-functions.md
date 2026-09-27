---
title: "Hàm hạng nhất"
description: "Hàm hạng nhất, closure và currying trong Node.js so với hàm-giá-trị và closure trong Go."
date: "2026-09-27"
order: 505
category: functions
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [closure, higher-order-function, currying, bind]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#first-class-functions"
---

Trong Node.js, hàm là giá trị hạng nhất: gán được cho biến, truyền làm tham số, trả về từ hàm khác, và ghép lại thành hàm mới. Go cũng coi hàm là giá trị, chỉ khác là mọi kiểu hàm phải khai báo tường minh và không có `bind` — closure lo phần đó.

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

func main() {
	fmt.Println(apply(add, 2, 3)) // 5
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
// Go không có bind, dùng closure để thay thế
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
Go không có `Function.prototype.bind`. Muốn currying hay partial application, bạn viết một hàm trả về closure — như `addPartial` ở trên.
:::
