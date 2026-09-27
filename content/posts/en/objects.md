---
title: "Object"
description: "Node.js object literals and methods compared to structs/classes with separate methods in Go, Rust, Swift, and Java."
tags: [object, struct, method, receiver]
---

A Node.js object literal bundles data and methods into the same value. Go splits the two: a `struct` holds only data, and behavior is attached with functions that take a receiver (usually a pointer to that struct). Rust and Swift also split data (`struct`) from behavior (`impl`/methods), much like Go — Swift even auto-generates a default constructor (a memberwise initializer), so you don't hand-write one like `NewObj()`. Java is closer to the JS object literal: a `class` bundles both fields and methods, just with explicit types.

## An object literal with a property and a method

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
`NewObj()` acts as a constructor — a common Go convention, not required syntax. `(o *Obj) SomeMethod(...)` is a method with a pointer receiver: `o` is a pointer to that same struct, similar to how `someMethod` in the JS object literal reaches back into `obj` through a closure. Rust uses `impl` + `&self` (like a pointer receiver, but a borrow instead of a raw pointer); Swift auto-generates a constructor for structs, so there's no need to hand-write an `Obj::new()`-style function (though you still can). Java is closest to JS: fields and methods live together in a `class`, reaching each other through an implicit `this`.
:::
