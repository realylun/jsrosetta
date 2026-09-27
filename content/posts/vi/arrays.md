---
title: "Mảng (Array)"
description: "slice, concat của Node.js so với slice của Go, Vec của Rust, Array (value type) của Swift và ArrayList của Java."
date: "2026-09-27"
order: 400
category: collections
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.21"
  rust: "1.6"
  swift: "2.0"
  java: "25"
tags: [array, slice, immutability, collections]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#arrays"
---

Trong Node.js, `Array` là kiểu tham chiếu linh hoạt với đủ method tiện dụng. Go dùng `slice` — một view (con trỏ, độ dài, sức chứa) trỏ vào một mảng gốc — nên khi cắt, sao chép hay nối, bạn cần để ý xem thao tác đó có chia sẻ vùng nhớ với mảng gốc hay không. Rust có `Vec<T>` sở hữu dữ liệu và slice tham chiếu (`&[T]`) mượn dữ liệu, biên giới sở hữu do compiler kiểm tra. `Array` của Swift là **value type**: gán hay truyền là tạo bản sao logic (copy-on-write), không chia sẻ ngầm như JS. Java không có kiểu mảng co giãn sẵn — `int[]` cố định kích thước — nên ví dụ dưới dùng `ArrayList`.

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
```rust
fn main() {
    let array = vec![1, 2, 3, 4, 5];
    println!("{array:?}");

    let clone = array.clone(); // Vec::clone luôn tạo bản sao thật sự
    println!("{clone:?}");

    let sub = &array[2..4]; // slice: mượn (borrow), cùng vùng nhớ với array
    println!("{sub:?}"); // [3, 4]
}
```
```swift
var array = [1, 2, 3, 4, 5]
print(array)

let clone = array // Array là value type: gán tạo bản sao logic (copy-on-write)
print(clone)

let sub = array[2..<4] // ArraySlice: chia sẻ vùng nhớ với array cho tới khi bị sửa
print(Array(sub)) // [3, 4]
```
```java
void main() {
    List<Integer> array = new ArrayList<>(List.of(1, 2, 3, 4, 5));
    IO.println(array);

    List<Integer> clone = new ArrayList<>(array); // copy constructor: bản sao thật sự
    IO.println(clone);

    List<Integer> sub = array.subList(2, 4); // view sống trên list gốc
    IO.println(sub); // [3, 4]
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
```rust
let mut concatenated = clone.clone();
concatenated.extend_from_slice(&[6, 7]);
println!("{concatenated:?}"); // [1, 2, 3, 4, 5, 6, 7]

let mut prepended = vec![-2, -1, 0];
prepended.extend_from_slice(&concatenated);
println!("{prepended:?}"); // [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]
```
```swift
let concatenated = clone + [6, 7]
print(concatenated) // [1, 2, 3, 4, 5, 6, 7]

let prepended = [-2, -1, 0] + concatenated
print(prepended) // [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]
```
```java
List<Integer> concatenated = new ArrayList<>(clone);
concatenated.addAll(List.of(6, 7));
IO.println(concatenated); // [1, 2, 3, 4, 5, 6, 7]

List<Integer> prepended = new ArrayList<>(List.of(-2, -1, 0));
prepended.addAll(concatenated);
IO.println(prepended); // [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]
```
:::

:::warning
`array.slice()` trong JavaScript luôn trả về mảng mới. Slice trong Go (`array[2:4]`) và Rust (`&array[2..4]`) chỉ là view trỏ vào cùng vùng nhớ với mảng gốc — sửa phần tử qua `sub` sẽ làm thay đổi luôn `array`, trừ khi bạn sao chép trước (`slices.Clone` ở Go, `.to_vec()` ở Rust). `array.subList()` của Java cũng là view trên list gốc. Riêng `ArraySlice` của Swift chia sẻ vùng nhớ *cho tới khi* một bên bị sửa (copy-on-write), lúc đó mới thực sự tách ra.
:::

:::note
Go 1.21 thêm package `slices` chuẩn: `slices.Clone` (sao chép) và `slices.Insert` (chèn tại vị trí bất kỳ, dùng để prepend khi index = 0) thay cho cách viết tay bằng `make`+`copy` và `append([]int{-2,-1,0}, x...)` trước đây.
:::
