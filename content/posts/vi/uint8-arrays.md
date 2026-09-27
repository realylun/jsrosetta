---
title: "Uint8Array"
description: "Uint8Array của Node.js (set, subarray, fill) so với []uint8 của Go, &[u8] của Rust, [UInt8] của Swift và byte[] của Java."
date: "2026-09-27"
order: 430
category: collections
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "4.0"
  java: "25"
tags: [uint8array, bytes, slice, binary]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#uint8-arrays"
---

`Uint8Array` trong Node.js là một `TypedArray` chỉ chứa số nguyên 8-bit không dấu, có sẵn method `set`/`subarray`/`fill`. Go không có kiểu riêng cho việc này — bạn dùng thẳng `[]uint8` (giống hệt `[]byte`, vì `byte` chỉ là bí danh của `uint8`) và các thao tác slice/loop thông thường của ngôn ngữ. Rust cũng vậy, dùng `Vec<u8>`/`&[u8]` cùng method có sẵn trên slice (`copy_from_slice`, `fill`). Swift dùng `[UInt8]` (value type). Java thì khác hẳn: `byte` luôn **có dấu** (-128..127), không có kiểu 8-bit không dấu, và mảng nguyên gốc (`byte[]`) không có "view" nhẹ như subarray/slice — `Arrays.copyOfRange` luôn tạo bản sao.

## Khởi tạo, ghi và lấy subarray

:::tabs
```js
const array = new Uint8Array(10)
console.log(array) // Uint8Array(10) [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

const offset = 1
array.set([1, 2, 3], offset)
console.log(array) // Uint8Array(10) [0, 1, 2, 3, 0, 0, 0, 0, 0, 0]

const sub = array.subarray(2)
console.log(sub) // Uint8Array(8) [2, 3, 0, 0, 0, 0, 0, 0]

const sub2 = array.subarray(2, 4)
console.log(sub2) // Uint8Array(2) [2, 3]
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
```rust
fn main() {
    let mut array = vec![0u8; 10];
    println!("{array:?}"); // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    let offset = 1;
    array[offset..offset + 3].copy_from_slice(&[1, 2, 3]);
    println!("{array:?}"); // [0, 1, 2, 3, 0, 0, 0, 0, 0, 0]

    let sub = &array[2..];
    println!("{sub:?}"); // [2, 3, 0, 0, 0, 0, 0, 0]

    let sub2 = &array[2..4];
    println!("{sub2:?}"); // [2, 3]
}
```
```swift
var array = [UInt8](repeating: 0, count: 10)
print(array) // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

let offset = 1
array.replaceSubrange(offset..<offset + 3, with: [1, 2, 3])
print(array) // [0, 1, 2, 3, 0, 0, 0, 0, 0, 0]

let sub = array[2...]
print(Array(sub)) // [2, 3, 0, 0, 0, 0, 0, 0]

let sub2 = array[2..<4]
print(Array(sub2)) // [2, 3]
```
```java
void main() {
    byte[] array = new byte[10];
    IO.println(Arrays.toString(array)); // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    int offset = 1;
    System.arraycopy(new byte[]{1, 2, 3}, 0, array, offset, 3);
    IO.println(Arrays.toString(array)); // [0, 1, 2, 3, 0, 0, 0, 0, 0, 0]

    byte[] sub = Arrays.copyOfRange(array, 2, array.length); // luôn là bản sao, không phải view
    IO.println(Arrays.toString(sub)); // [2, 3, 0, 0, 0, 0, 0, 0]

    byte[] sub2 = Arrays.copyOfRange(array, 2, 4);
    IO.println(Arrays.toString(sub2)); // [2, 3]
}
```
:::

## Fill và độ dài (byteLength)

:::tabs
```js
const value = 9
const start = 5
const end = 10
array.fill(value, start, end)
console.log(array) // Uint8Array(10) [0, 1, 2, 3, 0, 9, 9, 9, 9, 9]

console.log(array.byteLength) // 10
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
```rust
let value = 9u8;
let start = 5;
let end = 10;
array[start..end].fill(value);
println!("{array:?}"); // [0, 1, 2, 3, 0, 9, 9, 9, 9, 9]

println!("{}", array.len()); // 10
```
```swift
let value: UInt8 = 9
let start = 5
let end = 10
for i in start..<end {
    array[i] = value
}
print(array) // [0, 1, 2, 3, 0, 9, 9, 9, 9, 9]

print(array.count) // 10
```
```java
byte value = 9;
int start = 5;
int end = 10;
Arrays.fill(array, start, end, value);
IO.println(Arrays.toString(array)); // [0, 1, 2, 3, 0, 9, 9, 9, 9, 9]

IO.println(array.length); // 10
```
:::

:::note
`array.subarray()` trong JS và slice `array[2:]` trong Go đều chỉ tạo view, không copy — sửa qua view sẽ ảnh hưởng luôn tới vùng nhớ gốc, giống hệt cách slice hoạt động trong bài "Mảng (Array)". Rust cũng alias cùng vùng nhớ qua `&array[2..]`, nhưng đó là borrow bất biến — muốn sửa phải mượn `&mut`, và borrow checker không cho bạn đụng tới mảng gốc trong lúc slice mutable đó còn sống, nên không có kiểu "sửa ngầm không kiểm soát" như Go. `array[2...]` của Swift trả về `ArraySlice`, ban đầu cũng chia sẻ vùng nhớ với mảng gốc nhưng là copy-on-write: sửa qua slice sẽ kích hoạt sao chép và **không bao giờ** làm thay đổi mảng gốc. `Arrays.copyOfRange` của Java luôn tạo mảng mới, nhưng Java vẫn có view array-backed thật sự nếu cần: `ByteBuffer.wrap(array).slice(2, 2)` (JDK 13+) chia sẻ vùng nhớ với `array`, không copy.
:::

:::note
Java không có kiểu byte không dấu — `byte` luôn có dấu (-128..127). Muốn đọc một byte như giá trị unsigned (0-255), dùng `Byte.toUnsignedInt(b)`.
:::

:::tip
Go và Swift không có method `.fill()` sẵn cho slice/mảng — bạn tự viết vòng `for` để gán một giá trị vào cả một khoảng chỉ số. Rust (`[T]::fill`) và Java (`Arrays.fill`) thì có sẵn.
:::
