---
title: "Map"
description: "Map của Node.js (set/get/has/delete, for...of) so với map[K]V dựng sẵn trong Go."
date: "2026-09-27"
order: 450
category: collections
languages: [js, go]
versions:
  js: "12.20"
  go: "1.23"
tags: [map, collections, iteration]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#maps"
---

`Map` trong Node.js là một class riêng với method `set`/`get`/`has`/`delete`. Go có `map[K]V` ngay trong cú pháp ngôn ngữ, không cần class hay method — truy cập bằng `[]`, kiểm tra tồn tại bằng giá trị trả về thứ hai ("comma ok").

## set, get, has, delete

:::tabs
```js
const map = new Map()
map.set('foo', 'bar')

let found = map.has('foo')
console.log(found) // true

let item = map.get('foo')
console.log(item) // bar

map.delete('foo')

found = map.has('foo')
console.log(found) // false

item = map.get('foo')
console.log(item) // undefined
```
```go
package main

import "fmt"

func main() {
	map1 := make(map[string]string)
	map1["foo"] = "bar"

	item, found := map1["foo"] // "comma ok": found báo có tồn tại key hay không
	fmt.Println(found)         // true
	fmt.Println(item)          // bar

	delete(map1, "foo")

	item, found = map1["foo"]
	fmt.Println(found) // false
	fmt.Println(item)  // "" (zero value của string, không phải nil)
}
```
:::

## Duyệt qua map

:::tabs
```js
const map3 = new Map()
map3.set('foo', 100)
map3.set('bar', 200)
map3.set('baz', 300)

for (const [key, value] of map3) {
  console.log(key, value)
}
// foo 100
// bar 200
// baz 300 (Map giữ đúng thứ tự chèn)
```
```go
import (
	"maps"
	"slices"
)

map2 := make(map[string]int)
map2["foo"] = 100
map2["bar"] = 200
map2["baz"] = 300

// thứ tự duyệt map ở Go bị random hoá, nên sort lại key để có kết quả ổn định
for _, key := range slices.Sorted(maps.Keys(map2)) {
	fmt.Println(key, map2[key])
}
// bar 200
// baz 300
// foo 100
```
:::

## Khác biệt chính

| | Node.js `Map` | Go `map[K]V` |
|---|---|---|
| Kiểm tra tồn tại | `.has(key)` | `value, ok := m[key]` |
| Giá trị khi thiếu key | `undefined` | zero value của kiểu (`""`, `0`, …) |
| Thứ tự duyệt | giữ thứ tự chèn | ngẫu nhiên |
| Xoá key | `.delete(key)` | `delete(m, key)` |

:::warning
`Map` trong JavaScript giữ đúng thứ tự chèn khi duyệt. Map của Go thì ngược lại — thứ tự duyệt (`for range`) bị cố tình random hoá mỗi lần bạn range qua nó, kể cả trong cùng một lần chạy chương trình. Muốn kết quả ổn định phải tự sort key, như ví dụ dùng `slices.Sorted(maps.Keys(...))`.
:::

:::note
Go 1.23 thêm `maps.Keys` trả về iterator (`iter.Seq[K]`) thay vì slice như package `golang.org/x/exp/maps` trước đây; `slices.Sorted` thu thập iterator đó thành slice đã sắp xếp.
:::
