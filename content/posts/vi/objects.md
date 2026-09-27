---
title: "Object"
description: "Object literal và method trong Node.js so với struct/class có method riêng trong Go, Rust, Swift và Java."
date: "2026-09-27"
order: 460
category: collections
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "5.1"
  java: "25"
tags: [object, struct, method, receiver]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#objects"
---

Object literal trong Node.js gói cả dữ liệu lẫn method trong cùng một giá trị. Go tách hai việc: `struct` chỉ chứa dữ liệu, còn hành vi được gắn vào bằng hàm có receiver (thường là con trỏ tới struct đó) khai báo ở nơi khác. Trong 5 ngôn ngữ này, chỉ Rust tách y như Go: field nằm trong `struct`, còn method sống trong khối `impl` riêng. Swift thì khác — method viết ngay trong thân `struct`, cùng chỗ với property, giống cách Java gộp field và method trong thân `class`; điểm khác biệt của Swift so với Java chỉ là tự sinh constructor mặc định (memberwise initializer) nên không cần viết tay. Java gộp lại giống object literal của JS: một `class` chứa cả field lẫn method, chỉ khác là phải khai báo kiểu tường minh.

## Object literal với property và method

:::tabs
```js
const obj = {
  someProperties: {
    foo: 'bar'
  },
  someMethod: (prop) => {
    return obj.someProperties[prop]
  }
}

let item = obj.someProperties['foo']
console.log(item) // bar

item = obj.someMethod('foo')
console.log(item) // bar
```
```go
package main

import "fmt"

type Obj struct {
	SomeProperties map[string]string
}

func NewObj() *Obj {
	return &Obj{
		SomeProperties: map[string]string{
			"foo": "bar",
		},
	}
}

func (o *Obj) SomeMethod(prop string) string {
	return o.SomeProperties[prop]
}

func main() {
	obj := NewObj()

	item := obj.SomeProperties["foo"]
	fmt.Println(item) // bar

	item = obj.SomeMethod("foo")
	fmt.Println(item) // bar
}
```
```rust
use std::collections::HashMap;

struct Obj {
    some_properties: HashMap<String, String>,
}

impl Obj {
    fn new() -> Self {
        let mut some_properties = HashMap::new();
        some_properties.insert("foo".to_string(), "bar".to_string());
        Obj { some_properties }
    }

    fn some_method(&self, prop: &str) -> Option<&str> {
        self.some_properties.get(prop).map(String::as_str)
    }
}

fn main() {
    let obj = Obj::new();

    let item = obj.some_properties.get("foo");
    println!("{item:?}"); // Some("bar")

    let item = obj.some_method("foo");
    println!("{item:?}"); // Some("bar")
}
```
```swift
struct Obj {
    var someProperties: [String: String]

    func someMethod(_ prop: String) -> String? {
        someProperties[prop]
    }
}

let obj = Obj(someProperties: ["foo": "bar"])

var item = obj.someProperties["foo"]
print(item as Any) // Optional("bar")

item = obj.someMethod("foo")
print(item as Any) // Optional("bar")
```
```java
class Obj {
    Map<String, String> someProperties;

    Obj(Map<String, String> someProperties) {
        this.someProperties = someProperties;
    }

    String someMethod(String prop) {
        return someProperties.get(prop);
    }
}

void main() {
    Obj obj = new Obj(Map.of("foo", "bar"));

    String item = obj.someProperties.get("foo");
    IO.println(item); // bar

    item = obj.someMethod("foo");
    IO.println(item); // bar
}
```
:::

:::tip
`NewObj()` đóng vai trò constructor — một quy ước phổ biến ở Go, không phải cú pháp bắt buộc. `(o *Obj) SomeMethod(...)` là method với pointer receiver: `o` là con trỏ tới chính struct đó, tương tự cách `someMethod` trong object literal JS truy cập ngược lại `obj` qua closure. Rust dùng `impl` + `&self` (tương đương pointer receiver, nhưng mượn thay vì con trỏ thô), và `Obj::new()` ở đây chỉ là quy ước đặt tên như `NewObj()` của Go — không phải cú pháp constructor đặc biệt. Swift tự sinh constructor cho struct (memberwise init) nên không cần viết tay một `init` riêng (dù viết thêm cũng được, ví dụ để validate input). Java gần JS nhất: field và method sống chung trong `class`, truy cập lẫn nhau qua `this` (ngầm định).
:::
