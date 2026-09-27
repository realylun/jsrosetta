---
title: "Duyệt mảng (map, filter, reduce)"
description: "forEach, map, filter, reduce của Node.js so với iterator của Rust, Swift, Java và hàm generic Map/Filter/Reduce tự viết trong Go."
date: "2026-09-27"
order: 410
category: collections
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.18"
  rust: "1.58"
  swift: "4.0"
  java: "25"
tags: [array, iteration, generics, functional]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#array-iteration"
---

Node.js có sẵn `forEach`, `map`, `filter`, `reduce` ngay trên `Array.prototype`. Go không có các hàm này cho slice trong thư viện chuẩn, nhưng từ Go 1.18 bạn có thể tự viết chúng một lần bằng generic rồi dùng lại cho mọi kiểu dữ liệu. Rust, Swift và Java thì có sẵn `map`/`filter`/`fold` (hoặc `reduce`) ngay trên iterator/stream — không cần tự viết như Go; riêng Java thường gộp kết quả bằng `collect`/`toList` thay vì `Stream.reduce()`, vì `reduce()` chỉ hợp để rút gọn ra một giá trị bất biến (như tính tổng), không nên dùng để build một collection có thể thay đổi.

## Duyệt qua từng phần tử (forEach)

:::tabs
```js
const array = ['a', 'b', 'c']

array.forEach((value, i) => {
  console.log(i, value)
})
// 0 a
// 1 b
// 2 c
```
```go
package main

import "fmt"

func main() {
	array := []string{"a", "b", "c"}

	for i, value := range array {
		fmt.Println(i, value)
	}
	// 0 a
	// 1 b
	// 2 c
}
```
```rust
fn main() {
    let array = ["a", "b", "c"];

    for (i, value) in array.iter().enumerate() {
        println!("{i} {value}");
    }
    // 0 a
    // 1 b
    // 2 c
}
```
```swift
let array = ["a", "b", "c"]

for (i, value) in array.enumerated() {
    print(i, value)
}
// 0 a
// 1 b
// 2 c
```
```java
void main() {
    List<String> array = List.of("a", "b", "c");

    for (int i = 0; i < array.size(); i++) {
        IO.println(i + " " + array.get(i));
    }
    // 0 a
    // 1 b
    // 2 c
}
```
:::

## map, filter, reduce bằng generic

:::tabs
```js
const mapped = array.map((value) => value.toUpperCase())
console.log(mapped) // ['A', 'B', 'C']

const filtered = array.filter((value, i) => i % 2 == 0)
console.log(filtered) // ['a', 'c']

const reduced = array.reduce((acc, value, i) => {
  if (i % 2 == 0) acc.push(value.toUpperCase())
  return acc
}, [])
console.log(reduced) // ['A', 'C']
```
```go
import "strings"

func Map[T, U any](s []T, f func(value T, i int) U) []U {
	result := make([]U, len(s))
	for i, value := range s {
		result[i] = f(value, i)
	}
	return result
}

func Filter[T any](s []T, f func(value T, i int) bool) []T {
	var result []T
	for i, value := range s {
		if f(value, i) {
			result = append(result, value)
		}
	}
	return result
}

func Reduce[T, U any](s []T, initial U, f func(acc U, value T, i int) U) U {
	acc := initial
	for i, value := range s {
		acc = f(acc, value, i)
	}
	return acc
}

mapped := Map(array, func(value string, _ int) string {
	return strings.ToUpper(value)
})
fmt.Println(mapped) // [A B C]

filtered := Filter(array, func(_ string, i int) bool {
	return i%2 == 0
})
fmt.Println(filtered) // [a c]

reduced := Reduce(array, []string{}, func(acc []string, value string, i int) []string {
	if i%2 == 0 {
		acc = append(acc, strings.ToUpper(value))
	}
	return acc
})
fmt.Println(reduced) // [A C]
```
```rust
let mapped: Vec<String> = array.iter().map(|v| v.to_uppercase()).collect();
println!("{mapped:?}"); // ["A", "B", "C"]

let filtered: Vec<&str> = array
    .iter()
    .copied()
    .enumerate()
    .filter(|&(i, _)| i % 2 == 0)
    .map(|(_, v)| v)
    .collect();
println!("{filtered:?}"); // ["a", "c"]

let reduced = array
    .iter()
    .copied()
    .enumerate()
    .fold(Vec::new(), |mut acc, (i, v)| {
        if i % 2 == 0 {
            acc.push(v.to_uppercase());
        }
        acc
    });
println!("{reduced:?}"); // ["A", "C"]
```
```swift
let mapped = array.map { $0.uppercased() }
print(mapped) // ["A", "B", "C"]

let filtered = array.enumerated().filter { (i, _) in i % 2 == 0 }.map { $0.1 }
print(filtered) // ["a", "c"]

let reduced = array.enumerated().reduce(into: [String]()) { acc, pair in
    let (i, value) = pair
    if i % 2 == 0 { acc.append(value.uppercased()) }
}
print(reduced) // ["A", "C"]
```
```java
List<String> mapped = array.stream().map(String::toUpperCase).toList();
IO.println(mapped); // [A, B, C]

List<String> filtered = IntStream.range(0, array.size())
        .filter(i -> i % 2 == 0)
        .mapToObj(array::get)
        .toList();
IO.println(filtered); // [a, c]

// gộp bằng collect()/toList() — Stream.reduce() không hợp để build một List (mutable),
// nó dùng để rút gọn về một giá trị bất biến duy nhất (như tính tổng)
List<String> reduced = IntStream.range(0, array.size())
        .filter(i -> i % 2 == 0)
        .mapToObj(i -> array.get(i).toUpperCase())
        .toList();
IO.println(reduced); // [A, C]
```
:::

:::note
Go 1.18 thêm generic (type parameters). Trước đó phải viết `for` loop tay cho từng kiểu dữ liệu; giờ `Map`/`Filter`/`Reduce` viết một lần với `[T, U any]` rồi dùng lại được cho `[]string`, `[]int`, v.v. — không có sẵn trong thư viện chuẩn, bạn (hoặc một package) phải tự định nghĩa. Java không có `filter`/index trên stream, nên lọc theo chỉ số phải đi qua `IntStream.range` rồi `mapToObj` lấy lại phần tử.
:::
