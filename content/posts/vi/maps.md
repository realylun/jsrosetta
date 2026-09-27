---
title: "Map"
description: "Map của Node.js (set/get/has/delete, for...of) so với map[K]V của Go, HashMap của Rust, Dictionary của Swift và HashMap của Java."
date: "2026-09-27"
order: 450
category: collections
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.23"
  rust: "1.58"
  swift: "3.0"
  java: "25"
tags: [map, collections, iteration]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#maps"
---

`Map` trong Node.js là một class riêng với method `set`/`get`/`has`/`delete`. Go có `map[K]V` ngay trong cú pháp ngôn ngữ, không cần class hay method — truy cập bằng `[]`, kiểm tra tồn tại bằng giá trị trả về thứ hai ("comma ok"). Rust có `HashMap<K, V>` trong thư viện chuẩn, Swift có `Dictionary` với cú pháp `[K: V]`, Java có `HashMap` — cả ba đều **không** giữ thứ tự chèn khi duyệt, giống Go.

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
```rust
use std::collections::HashMap;

fn main() {
    let mut map1: HashMap<String, String> = HashMap::new();
    map1.insert("foo".to_string(), "bar".to_string());

    let found = map1.contains_key("foo");
    println!("{found}"); // true

    let item = map1.get("foo");
    println!("{item:?}"); // Some("bar")

    map1.remove("foo");

    let found = map1.contains_key("foo");
    println!("{found}"); // false

    let item = map1.get("foo");
    println!("{item:?}"); // None
}
```
```swift
var map1 = [String: String]()
map1["foo"] = "bar"

var found = map1["foo"] != nil
print(found) // true

var item = map1["foo"]
print(item as Any) // Optional("bar")

map1.removeValue(forKey: "foo") // cách ngắn hơn, cũng idiomatic: map1["foo"] = nil

found = map1["foo"] != nil
print(found) // false

item = map1["foo"]
print(item as Any) // nil
```
```java
void main() {
    Map<String, String> map1 = new HashMap<>();
    map1.put("foo", "bar");

    boolean found = map1.containsKey("foo");
    IO.println(found); // true

    String item = map1.get("foo");
    IO.println(item); // bar

    map1.remove("foo");

    found = map1.containsKey("foo");
    IO.println(found); // false

    item = map1.get("foo");
    IO.println(item); // null
}
```
:::

:::note
`map1.get(key)` của Java trả về `null` cả khi key không tồn tại lẫn khi key tồn tại nhưng giá trị thật sự là `null` — hai trường hợp này không phân biệt được chỉ từ `get()`. Muốn phân biệt, dùng `containsKey(key)` để kiểm tra sự tồn tại, hoặc `getOrDefault(key, fallback)` để lấy giá trị mặc định khi thiếu key.
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
```rust
let mut map2 = HashMap::new();
map2.insert("foo", 100);
map2.insert("bar", 200);
map2.insert("baz", 300);

// thứ tự duyệt HashMap của Rust không được đảm bảo, nên sort lại key
let mut keys: Vec<_> = map2.keys().collect();
keys.sort();
for key in keys {
    println!("{key} {}", map2[key]);
}
// bar 200
// baz 300
// foo 100
```
```swift
var map3 = [String: Int]()
map3["foo"] = 100
map3["bar"] = 200
map3["baz"] = 300

// thứ tự duyệt Dictionary không được đảm bảo, nên sort lại key
for key in map3.keys.sorted() {
    print(key, map3[key]!)
}
// bar 200
// baz 300
// foo 100
```
```java
Map<String, Integer> map2 = new HashMap<>();
map2.put("foo", 100);
map2.put("bar", 200);
map2.put("baz", 300);

// thứ tự duyệt HashMap không được đảm bảo, nên sort lại key
for (String key : new TreeSet<>(map2.keySet())) {
    IO.println(key + " " + map2.get(key));
}
// bar 200
// baz 300
// foo 100
```
:::

## Khác biệt chính

| | Node.js `Map` | Go `map[K]V` | Rust `HashMap` | Swift `Dictionary` | Java `HashMap` |
|---|---|---|---|---|---|
| Kiểm tra tồn tại | `.has(key)` | `value, ok := m[key]` | `.contains_key(key)` | `dict[key] != nil` | `.containsKey(key)` |
| Giá trị khi thiếu key | `undefined` | zero value của kiểu (`""`, `0`, …) | `None` (kiểu `Option<&V>`) | `nil` (kiểu `V?`) | `null` |
| Thứ tự duyệt | giữ thứ tự chèn | ngẫu nhiên | không đảm bảo | không đảm bảo | không đảm bảo |
| Xoá key | `.delete(key)` | `delete(m, key)` | `.remove(key)` | `.removeValue(forKey:)` | `.remove(key)` |

:::warning
`Map` trong JavaScript giữ đúng thứ tự chèn khi duyệt. Map của Go, `HashMap` của Rust/Java và `Dictionary` của Swift thì ngược lại — thứ tự duyệt không được đảm bảo (Go còn cố tình random hoá mỗi lần range). Muốn kết quả ổn định phải tự sort key, như các ví dụ dùng `slices.Sorted(maps.Keys(...))` (Go), `.sort()` trên danh sách key (Rust/Swift) hay `TreeSet` (Java). Muốn Java giữ thứ tự chèn như JS thật sự, dùng `LinkedHashMap` thay vì `HashMap`.
:::

:::note
Go 1.23 thêm `maps.Keys` trả về iterator (`iter.Seq[K]`) thay vì slice như package `golang.org/x/exp/maps` trước đây; `slices.Sorted` thu thập iterator đó thành slice đã sắp xếp.
:::
