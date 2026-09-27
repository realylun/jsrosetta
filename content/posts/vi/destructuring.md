---
title: "Destructuring"
description: "Destructuring object trong Node.js so với pattern destructuring struct trong Rust, tuple trong Swift, record pattern trong Java và gán nhiều biến trong Go."
date: "2026-09-27"
order: 520
category: functions
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.0"
  swift: "1.0"
  java: "25"
tags: [destructuring, multiple-return, struct, record-pattern]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#destructuring"
---

Node.js destructure trực tiếp một object thành nhiều biến bằng cú pháp `{ key, value } = obj`. Rust có cú pháp destructuring struct thật sự qua pattern matching (`let Obj { key, value } = obj`) — gần với JS nhất. Swift không destructure struct trực tiếp theo tên trường, nhưng destructure tuple thì có (`let (key, value) = (...)`). Java từ bản 21 có record pattern, destructure được record ngay trong `instanceof`. Go không có cú pháp destructuring cho struct, nhưng đạt cùng hiệu quả bằng gán nhiều biến cùng lúc hoặc bằng hàm trả về nhiều giá trị.

## Lấy nhiều giá trị từ một object

:::tabs
```js
const obj = { key: 'foo', value: 'bar' };

const { key, value } = obj;
console.log(key, value); // foo bar
```
```go
package main

import "fmt"

type Obj struct {
	Key   string
	Value string
}

func (o *Obj) Read() (string, string) {
	return o.Key, o.Value
}

func main() {
	obj := Obj{
		Key:   "foo",
		Value: "bar",
	}

	// cách 1: gán nhiều biến cùng lúc
	key, value := obj.Key, obj.Value
	fmt.Println(key, value) // foo bar

	// cách 2: hàm trả về nhiều giá trị
	key, value = obj.Read()
	fmt.Println(key, value) // foo bar
}
```
```rust
struct Obj {
    key: String,
    value: String,
}

fn main() {
    let obj = Obj { key: "foo".to_string(), value: "bar".to_string() };

    // pattern destructuring thật sự, tên trường phải khớp
    let Obj { key, value } = obj;
    println!("{key} {value}"); // foo bar
}
```
```swift
struct Obj {
    let key: String
    let value: String
}

let obj = Obj(key: "foo", value: "bar")

// Swift không destructure struct theo tên trường trực tiếp,
// nhưng destructure tuple thì có
let (key, value) = (obj.key, obj.value)
print(key, value) // foo bar
```
```java
record Obj(String key, String value) {}

void main() {
    Obj obj = new Obj("foo", "bar");

    // record pattern (Java 21+): destructure ngay trong instanceof
    if (obj instanceof Obj(String key, String value)) {
        IO.println(key + " " + value); // foo bar
    }
}
```
:::

:::note
Go không có cú pháp destructuring cho struct/object. Hai cách phổ biến nhất để "tách" nhiều giá trị là gán nhiều biến cùng lúc (`key, value := obj.Key, obj.Value`) và để hàm trả về nhiều giá trị (`func (o *Obj) Read() (string, string)`). Rust có destructuring struct thật sự từ bản 1.0. Java chỉ có từ bản 21 (JEP 440, record pattern) và chỉ áp dụng cho `record`, không áp dụng cho `class` thường.
:::
