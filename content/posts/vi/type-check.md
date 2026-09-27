---
title: "Kiểm tra kiểu dữ liệu"
description: "typeof/Object.prototype.toString trong JavaScript so với reflect.TypeOf (Go), type(of:) (Swift), getClass() (Java) và std::any::type_name (Rust)."
date: "2026-09-27"
order: 210
category: types
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.18"
  rust: "1.65"
  swift: "5.7"
  java: "25"
tags: [types, reflect, typeof, runtime]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#type-check"
---

`typeof` trong JavaScript chỉ phân biệt được vài nhóm lớn (`object`, `function`…), nên muốn biết chính xác một giá trị là `Map`, `Date` hay `RegExp` thì phải mượn `Object.prototype.toString`. Go không có `typeof`; package `reflect` cho bạn tên kiểu chính xác của bất kỳ giá trị `any` nào lúc chạy. Swift (`type(of:)`) và Java (`getClass()`) có reflection thật, lặp qua một danh sách giá trị không đồng nhất y như Go. Rust thì khác hẳn: `std::any::type_name` chỉ suy ra tại compile-time từ generic, không phải reflection lúc chạy trên giá trị đã bị xoá kiểu — nên không thể viết một vòng lặp kiểu Go.

## Kiểm tra kiểu lúc chạy

:::tabs
```js
function typeOf(obj) {
  return {}.toString.call(obj).split(' ')[1].slice(0,-1).toLowerCase()
}

const values = [
  true,
  10,
  'foo',
  Symbol('bar'),
  null,
  undefined,
  NaN,
  {},
  [],
  function(){},
  new Error(),
  new Date(),
  /a/,
  new Map(),
  new Set(),
  Promise.resolve(),
  function *() {},
  class {},
]

for (const value of values) {
  console.log(typeOf(value))
}
```
```go
package main

import (
	"fmt"
	"reflect"
	"regexp"
	"time"
)

func main() {
	values := []any{
		true,
		int8(10),
		int16(10),
		int32(10),
		int64(10),
		uint(10),
		uint8(10),
		uint16(10),
		uint32(10),
		uint64(10),
		uintptr(10),
		float32(10.5),
		float64(10.5),
		complex64(-1 + 10i),
		complex128(-1 + 10i),
		"foo",
		byte(10),
		'a',
		rune('a'),
		struct{}{},
		[]string{},
		map[string]int{},
		func() {},
		make(chan bool),
		nil,
		new(int),
		time.Now(),
		regexp.MustCompile(`^a$`),
	}

	for _, value := range values {
		fmt.Println(reflect.TypeOf(value))
	}
}
```
```rust
// Cargo.toml: regex = "1"
use std::collections::HashMap;
use std::time::Instant;

// `type_name` được suy ra tại compile-time từ tham số generic T — không phải reflection
// thật lúc chạy như `reflect.TypeOf`, nên không thể lặp qua một danh sách giá trị "any" kiểu Go.
fn type_of<T>(_: &T) -> &'static str {
    std::any::type_name::<T>()
}

fn main() {
    println!("{}", type_of(&true));
    println!("{}", type_of(&10i32));
    println!("{}", type_of(&10.5f64));
    println!("{}", type_of(&"foo"));
    println!("{}", type_of(&String::from("foo")));
    println!("{}", type_of(&Option::<i32>::None));
    println!("{}", type_of(&Vec::<i32>::new()));
    println!("{}", type_of(&HashMap::<String, i32>::new()));
    println!("{}", type_of(&(|| {})));
    println!("{}", type_of(&Instant::now()));
    println!("{}", type_of(&regex::Regex::new("^a$").unwrap()));
}
```
```swift
import Foundation

let values: [Any] = [
    true,
    10,
    10.5,
    "foo",
    Optional<Int>.none as Any,
    [1, 2, 3],
    ["a": 1],
    { () -> Void in } as () -> Void,
    Date(),
    try! Regex("^a$"),
]

for value in values {
    print(type(of: value))
}
```
```java
void main() {
    List<Object> values = List.of(
            true,
            10,
            10.5,
            "foo",
            List.of(1, 2, 3),
            Map.of("a", 1),
            (Runnable) () -> {},
            Instant.now(),
            Pattern.compile("^a$"));

    for (Object value : values) {
        IO.println(value.getClass().getSimpleName());
    }
}
```
:::

Output (Node.js):

```bash
boolean
number
string
symbol
null
undefined
number
object
array
function
error
date
regexp
map
set
promise
generatorfunction
function
```

Output (Go):

```bash
bool
int8
int16
int32
int64
uint
uint8
uint16
uint32
uint64
uintptr
float32
float64
complex64
complex128
string
uint8
int32
int32
struct {}
[]string
map[string]int
func()
chan bool
<nil>
*int
time.Time
*regexp.Regexp
```

Output (Rust — tên đầy đủ gồm cả module path, và tên crate `type_check` sẽ khác nếu bạn đặt tên project khác):

```bash
bool
i32
f64
&str
alloc::string::String
core::option::Option<i32>
alloc::vec::Vec<i32>
std::collections::hash::map::HashMap<alloc::string::String, i32>
type_check::main::{{closure}}
std::time::Instant
regex::regex::string::Regex
```

Output (Swift):

```bash
Bool
Int
Double
String
Optional<Int>
Array<Int>
Dictionary<String, Int>
() -> ()
Date
Regex<AnyRegexOutput>
```

Output (Java — tên lớp lambda kèm địa chỉ, sẽ khác nhau mỗi lần chạy):

```bash
Boolean
Integer
Double
String
ListN
Map1
Main$$Lambda/0x0000000301160210
Instant
Pattern
```

:::note
Go 1.18 thêm `any` làm alias cho `interface{}`; dùng `any` cho một slice/tham số có thể chứa giá trị của bất kỳ kiểu nào — như `values` ở trên.
:::

:::warning
ES module luôn chạy ở strict mode, nên một loop variable chưa khai báo (`for (value of values)`) sẽ ném `ReferenceError: value is not defined` thay vì âm thầm tạo biến global như trong CommonJS sloppy mode. Luôn khai báo nó: `for (const value of values)`.
:::

:::warning
Từ Rust 1.76, `std::any::type_name_of_val` đã stable, nhưng nó vẫn được phân giải tại compile-time theo kiểu *tĩnh* của tham số chứ không phải kiểu runtime thật sự: gọi trên `&dyn Any` luôn trả về `"dyn core::any::Any"`, bất kể bên trong là `i32` hay `String`. Vì vậy một vòng lặp kiểu Go (lặp qua collection không đồng nhất rồi lấy tên kiểu từng phần tử) vẫn bất khả thi — đoạn code trên phải gọi `std::any::type_name::<T>()` lặp lại thủ công cho từng kiểu cụ thể (nhờ `T` được biết tại compile-time ở từng lời gọi qua generic đơn hình hoá). Tên kiểu trả về cũng là đường dẫn module nội bộ (không ổn định giữa các phiên bản crate), chỉ nên dùng để debug.
:::

:::note
`List.of()`/`Map.of()` của Java trả về các lớp implementation riêng (`ListN`, `Map1`…), không phải `ArrayList`/`HashMap` — một bất ngờ thường gặp khi in `getClass()` trên bộ sưu tập bất biến.
:::

:::note
Kiểu `Regex` của Swift biên dịch được từ Swift 5.7, nhưng lúc chạy nó cần macOS 13+ (hoặc iOS 16+…) — chạy binary trên OS cũ hơn sẽ crash dù đã build bằng toolchain mới.
:::
