---
title: "Sắp xếp mảng"
description: "Array.prototype.toSorted của Node.js so với slices.Sort, slices.SortFunc và slices.Reverse trong Go."
date: "2026-09-27"
order: 420
category: collections
languages: [js, go]
versions:
  js: "20"
  go: "1.21"
tags: [array, sort, slices, comparator]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#array-sorting"
---

Sắp xếp số và chuỗi ở Node.js dùng chung một hàm `toSorted` với comparator; Go tách hai trường hợp: `slices.Sort` cho kiểu có thứ tự sẵn (`cmp.Ordered`), và `slices.SortFunc` khi cần so sánh tuỳ ý, ví dụ theo field của struct.

## Sắp xếp số và chuỗi

:::tabs
```js
const stringArray = ['a', 'd', 'z', 'b', 'c', 'y']
const stringSortedAsc = stringArray.toSorted((a, b) => (a > b ? 1 : -1))
console.log(stringSortedAsc) // ['a', 'b', 'c', 'd', 'y', 'z']

const numberArray = [1, 3, 5, 9, 4, 2, 0]
const numberSortedAsc = numberArray.toSorted((a, b) => a - b)
console.log(numberSortedAsc) // [0, 1, 2, 3, 4, 5, 9]

const numberSortedDesc = numberArray.toSorted((a, b) => b - a)
console.log(numberSortedDesc) // [9, 5, 4, 3, 2, 1, 0]
```
```go
package main

import (
	"fmt"
	"slices"
)

func main() {
	intList := []int{1, 3, 5, 9, 4, 2, 0}

	slices.Sort(intList) // asc
	fmt.Println(intList) // [0 1 2 3 4 5 9]

	slices.Reverse(intList) // desc: đảo ngược slice vừa sort tăng dần
	fmt.Println(intList)    // [9 5 4 3 2 1 0]

	stringList := []string{"a", "d", "z", "b", "c", "y"}
	slices.Sort(stringList)
	fmt.Println(stringList) // [a b c d y z]
}
```
:::

## Sắp xếp theo field của object/struct

:::tabs
```js
const collection = [
  { name: 'Li L', age: 8 },
  { name: 'Json C', age: 3 },
  { name: 'Zack W', age: 15 },
  { name: 'Yi M', age: 2 }
]

const sortedByAge = collection.toSorted((a, b) => a.age - b.age)
console.log(sortedByAge)
// [{ name: 'Yi M', age: 2 }, { name: 'Json C', age: 3 }, { name: 'Li L', age: 8 }, { name: 'Zack W', age: 15 }]
```
```go
import "cmp"

type Person struct {
	Name string
	Age  int
}

collection := []Person{
	{"Li L", 8},
	{"Json C", 3},
	{"Zack W", 15},
	{"Yi M", 2},
}

slices.SortFunc(collection, func(a, b Person) int {
	return cmp.Compare(a.Age, b.Age)
})
fmt.Println(collection)
// [{Yi M 2} {Json C 3} {Li L 8} {Zack W 15}]
```
:::

## Khác biệt chính

| | Node.js | Go |
|---|---|---|
| Không đổi mảng gốc | `toSorted()` | `slices.Clone` rồi mới `slices.Sort` |
| So sánh mặc định (không truyền hàm) | ép kiểu chuỗi | lỗi biên dịch nếu kiểu không phải `cmp.Ordered` |
| Sắp theo field | comparator function | `slices.SortFunc` + `cmp.Compare` |
| Đảo ngược thứ tự | comparator ngược dấu | `slices.Reverse` |

:::note
Node.js 20 thêm `Array.prototype.toSorted()` — trả về **bản sao** đã sắp xếp, mảng gốc giữ nguyên (`sort()` sắp xếp tại chỗ, mutate mảng gốc).
:::

:::note
Go 1.21 thêm package `slices`: `slices.Sort` (cho kiểu `cmp.Ordered`), `slices.SortFunc` + `cmp.Compare` (so sánh tuỳ ý), và `slices.Reverse` — thay cho `sort.Ints`/`sort.Strings`/`sort.Sort(sort.Reverse(...))` cùng việc tự cài `sort.Interface` (`Len`/`Swap`/`Less`) trên một type collection viết tay.
:::
