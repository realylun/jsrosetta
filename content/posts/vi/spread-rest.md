---
title: "Spread và Rest"
description: "Toán tử spread và rest của Node.js so với tham số variadic và mở rộng slice (`...T`) trong Go."
date: "2026-09-27"
order: 530
category: functions
languages: [js, go]
versions:
  js: "12.20"
  go: "1.18"
tags: [spread, rest, variadic, slice]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#spread-operator"
---

Node.js dùng cùng một ký hiệu `...` cho hai việc trái ngược nhau: "trải" một mảng thành nhiều giá trị (spread) và "gom" nhiều giá trị thành một mảng (rest). Go tách hai việc này ra: `...` khi gọi hàm để trải một slice, và `...T` trong khai báo tham số để gom thành slice.

## Spread operator

:::tabs
```js
const array = [1, 2, 3, 4, 5];

console.log(...array); // 1 2 3 4 5
```
```go
package main

import "fmt"

func main() {
	array := []byte{1, 2, 3, 4, 5}

	var i []any // any = interface{}, chứa được phần tử khác kiểu
	for _, value := range array {
		i = append(i, value)
	}

	fmt.Println(i...) // 1 2 3 4 5
}
```
:::

:::note
Go 1.18 thêm alias `any` thay cho `interface{}` — dùng để gom các phần tử khi cần một slice chứa nhiều kiểu khác nhau trước khi trải nó bằng `...`.
:::

## Rest operator

:::tabs
```js
function sum(...nums) {
  let t = 0;

  for (let n of nums) {
    t += n;
  }

  return t;
}

console.log(sum(1, 2, 3, 4, 5)); // 15
```
```go
func sum(nums ...int) int {
	var t int
	for _, n := range nums {
		t += n
	}

	return t
}

func main() {
	fmt.Println(sum(1, 2, 3, 4, 5)) // 15
}
```
:::

## Khác biệt chính

| | Node.js (`...`) | Go (`...`) |
|---|---|---|
| Trải mảng thành các đối số | `fn(...arr)` | `fn(slice...)` (chỉ với tham số variadic) |
| Gom tham số thành mảng/slice | `function f(...args)` | `func f(args ...T)` |
| Kiểu phần tử | có thể khác nhau (mixed) | phải cùng kiểu `T` (hoặc dùng `any`) |
