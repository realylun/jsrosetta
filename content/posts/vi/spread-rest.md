---
title: "Spread và Rest"
description: "Toán tử spread và rest của Node.js so với tham số variadic thật trong Swift và Java, slice destructuring trong Rust, và `...T` trong Go."
date: "2026-09-27"
order: 530
category: functions
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.18"
  rust: "1.58"
  swift: "5.1"
  java: "25"
tags: [spread, rest, variadic, slice]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#spread-operator"
---

Node.js dùng cùng một ký hiệu `...` cho hai việc trái ngược nhau: "trải" một mảng thành nhiều giá trị (spread) và "gom" nhiều giá trị thành một mảng (rest). Go tách hai việc này ra: `...` khi gọi hàm để trải một slice, và `...T` trong khai báo tham số để gom thành slice. Swift và Java có tham số variadic thật (`Int...`, `int...`) — gần với rest của JS nhất; Java thậm chí cho phép truyền thẳng một mảng có sẵn vào tham số variadic, gần giống spread. Rust không có spread lẫn rest theo nghĩa JS: mảng cỡ cố định thì destructure qua pattern, còn "nhiều tham số" thì nhận một slice.

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
```rust
fn main() {
    let array = [1, 2, 3, 4, 5];

    // Rust không có spread; một mảng cỡ cố định thì destructure được qua
    // pattern rồi in từng biến — không tổng quát hoá cho mảng cỡ động.
    let [a, b, c, d, e] = array;
    println!("{a} {b} {c} {d} {e}"); // 1 2 3 4 5
}
```
```swift
let array = [1, 2, 3, 4, 5]

// Swift không spread một mảng vào tham số variadic; phải join thủ công.
print(array.map(String.init).joined(separator: " ")) // 1 2 3 4 5
```
```java
static String joinAll(Object... items) {
    return Arrays.stream(items).map(String::valueOf).collect(Collectors.joining(" "));
}

void main() {
    Integer[] array = {1, 2, 3, 4, 5};

    // truyền thẳng một mảng có sẵn vào tham số variadic — gần nhất với spread
    IO.println(joinAll((Object[]) array)); // 1 2 3 4 5
}
```
:::

:::note
Go 1.18 thêm alias `any` thay cho `interface{}` — dùng để gom các phần tử khi cần một slice chứa nhiều kiểu khác nhau trước khi trải nó bằng `...`. Rust không có toán tử spread; Swift cũng vậy — muốn nối các phần tử của một mảng thành chuỗi phải `.joined(separator:)` thủ công.
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
```rust
// Rust không có hàm variadic thật; tương đương gần nhất là nhận một slice.
fn sum(nums: &[i32]) -> i32 {
    nums.iter().sum()
}

fn main() {
    println!("{}", sum(&[1, 2, 3, 4, 5])); // 15
}
```
```swift
// Swift có tham số variadic thật, gần với rest của JS nhất.
func sum(_ nums: Int...) -> Int {
    nums.reduce(0, +)
}

print(sum(1, 2, 3, 4, 5)) // 15
```
```java
// Java cũng có tham số variadic thật.
static int sum(int... nums) {
    int total = 0;
    for (int n : nums) total += n;
    return total;
}

void main() {
    IO.println(sum(1, 2, 3, 4, 5)); // 15
}
```
:::

## Khác biệt chính

| | Node.js (`...`) | Go (`...`) | Rust | Swift | Java |
|---|---|---|---|---|---|
| Trải mảng thành các đối số | `fn(...arr)` | `fn(slice...)` (chỉ với tham số variadic) | không có; destructure mảng cỡ cố định qua pattern | không có; phải join thủ công | mảng có sẵn truyền thẳng vào tham số variadic |
| Gom tham số thành mảng/slice | `function f(...args)` | `func f(args ...T)` | nhận `&[T]` (không phải variadic thật) | `func f(_ args: T...)` (variadic thật) | `void f(T... args)` (variadic thật) |
| Kiểu phần tử | có thể khác nhau (mixed) | phải cùng kiểu `T` (hoặc dùng `any`) | phải cùng kiểu `T` | phải cùng kiểu `T` | phải cùng kiểu `T` (hoặc `Object...`) |
