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
  swift: "2.0"
  java: "25"
tags: [object, struct, method, receiver]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#objects"
---

Object literal trong Node.js gói cả dữ liệu lẫn method trong cùng một giá trị. Go tách hai việc: `struct` chỉ chứa dữ liệu, còn hành vi được gắn vào bằng hàm có receiver (thường là con trỏ tới struct đó). Rust và Swift cũng tách dữ liệu (`struct`) khỏi hành vi (`impl`/method), gần giống Go — riêng Swift tự sinh constructor mặc định (memberwise initializer) nên không cần viết tay như `NewObj()`. Java thì gộp lại giống object literal của JS: một `class` chứa cả field lẫn method, chỉ khác là phải khai báo kiểu tường minh.

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

    fn some_method(&self, prop: &str) -> Option<&String> {
        self.some_properties.get(prop)
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
`NewObj()` đóng vai trò constructor — một quy ước phổ biến ở Go, không phải cú pháp bắt buộc. `(o *Obj) SomeMethod(...)` là method với pointer receiver: `o` là con trỏ tới chính struct đó, tương tự cách `someMethod` trong object literal JS truy cập ngược lại `obj` qua closure. Rust dùng `impl` + `&self` (tương đương pointer receiver, nhưng mượn thay vì con trỏ thô); Swift tự sinh constructor cho struct nên không cần một hàm `Obj::new()` viết tay (dù viết thêm cũng được). Java gần JS nhất: field và method sống chung trong `class`, truy cập lẫn nhau qua `this` (ngầm định).
:::
