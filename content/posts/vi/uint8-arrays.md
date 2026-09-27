---
title: "Uint8Array"
description: "Uint8Array của Node.js (set, subarray, fill) so với []uint8 và các thao tác slice thuần của Go."
date: "2026-09-27"
order: 430
category: collections
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [uint8array, bytes, slice, binary]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#uint8-arrays"
---

`Uint8Array` trong Node.js là một `TypedArray` chỉ chứa số nguyên 8-bit không dấu, có sẵn method `set`/`subarray`/`fill`. Go không có kiểu riêng cho việc này — bạn dùng thẳng `[]uint8` (bí danh của `[]byte`) và các thao tác slice/loop thông thường của ngôn ngữ.

## Khởi tạo, ghi và lấy subarray

:::tabs
```js
const array = new Uint8Array(10);
console.log(array); // Uint8Array(10) [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

const offset = 1;
array.set([1, 2, 3], offset);
console.log(array); // Uint8Array(10) [0, 1, 2, 3, 0, 0, 0, 0, 0, 0]

const sub = array.subarray(2);
console.log(sub); // Uint8Array(8) [2, 3, 0, 0, 0, 0, 0, 0]

const sub2 = array.subarray(2, 4);
console.log(sub2); // Uint8Array(2) [2, 3]
```
```go
package main

import "fmt"

func main() {
	array := make([]uint8, 10)
	fmt.Println(array) // [0 0 0 0 0 0 0 0 0 0]

	offset := 1
	copy(array[offset:], []uint8{1, 2, 3})
	fmt.Println(array) // [0 1 2 3 0 0 0 0 0 0]

	sub := array[2:]
	fmt.Println(sub) // [2 3 0 0 0 0 0 0]

	sub2 := array[2:4]
	fmt.Println(sub2) // [2 3]
}
```
:::

## Fill và độ dài (byteLength)

:::tabs
```js
const value = 9;
const start = 5;
const end = 10;
array.fill(value, start, end);
console.log(array); // Uint8Array(10) [0, 1, 2, 3, 0, 9, 9, 9, 9, 9]

console.log(array.byteLength); // 10
```
```go
value := uint8(9)
start := 5
end := 10
for i := start; i < end; i++ {
	array[i] = value
}
fmt.Println(array) // [0 1 2 3 0 9 9 9 9 9]

fmt.Println(len(array)) // 10
```
:::

:::note
`array.subarray()` trong JS và slice `array[2:]` trong Go đều chỉ tạo view, không copy dữ liệu — sửa qua view sẽ ảnh hưởng luôn tới vùng nhớ gốc, giống hệt cách slice hoạt động trong bài "Mảng (Array)".
:::

:::tip
Go không có method `.fill()` sẵn cho slice — bạn tự viết vòng `for` để gán một giá trị vào cả một khoảng chỉ số.
:::
