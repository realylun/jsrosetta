---
title: "Mảng (Array)"
description: "slice, concat của Node.js so với slices.Clone, append, slices.Insert trong Go."
date: "2026-09-27"
order: 400
category: collections
languages: [js, go]
versions:
  js: "12.20"
  go: "1.21"
tags: [array, slice, immutability, collections]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#arrays"
---

Trong Node.js, `Array` là kiểu tham chiếu linh hoạt với đủ method tiện dụng. Go dùng `slice` — một view (con trỏ, độ dài, sức chứa) trỏ vào một mảng gốc — nên khi cắt, sao chép hay nối, bạn cần để ý xem thao tác đó có chia sẻ vùng nhớ với mảng gốc hay không.

## Sao chép và lấy một đoạn (slice)

:::tabs
```js
const array = [1, 2, 3, 4, 5]
console.log(array)

const clone = array.slice(0) // slice() luôn trả về mảng mới
console.log(clone)

const sub = array.slice(2, 4)
console.log(sub) // [3, 4]
```
```go
package main

import (
	"fmt"
	"slices"
)

func main() {
	array := []int{1, 2, 3, 4, 5}
	fmt.Println(array)

	clone := slices.Clone(array) // sao chép thật sự, không chia sẻ vùng nhớ
	fmt.Println(clone)

	sub := array[2:4] // chỉ là view, cùng vùng nhớ với array
	fmt.Println(sub)  // [3 4]
}
```
:::

## Nối và chèn vào đầu mảng

:::tabs
```js
const concatenated = clone.concat([6, 7])
console.log(concatenated) // [1, 2, 3, 4, 5, 6, 7]

const prepended = [-2, -1, 0].concat(concatenated)
console.log(prepended) // [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]
```
```go
concatenated := append(clone, []int{6, 7}...)
fmt.Println(concatenated) // [1 2 3 4 5 6 7]

prepended := slices.Insert(concatenated, 0, []int{-2, -1, 0}...)
fmt.Println(prepended) // [-2 -1 0 1 2 3 4 5 6 7]
```
:::

:::warning
`array.slice()` trong JavaScript luôn trả về mảng mới. Slice trong Go (`array[2:4]`) chỉ là view trỏ vào cùng vùng nhớ với mảng gốc — sửa phần tử qua `sub` sẽ làm thay đổi luôn `array`, trừ khi bạn `slices.Clone` trước.
:::

:::note
Go 1.21 thêm package `slices` chuẩn: `slices.Clone` (sao chép) và `slices.Insert` (chèn tại vị trí bất kỳ, dùng để prepend khi index = 0) thay cho cách viết tay bằng `make`+`copy` và `append([]int{-2,-1,0}, x...)` trước đây.
:::
