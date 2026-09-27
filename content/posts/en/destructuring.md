---
title: "Destructuring"
description: "Object destructuring in Node.js compared to struct pattern destructuring in Rust, tuple destructuring in Swift, record patterns in Java, and multiple assignment in Go."
tags: [destructuring, multiple-return, struct, record-pattern]
---

Node.js destructures an object directly into multiple variables with `{ key, value } = obj`. Rust has real struct destructuring through pattern matching (`let Obj { key, value } = obj`) — the closest match to JS. Swift doesn't destructure a struct by field name directly, but it does destructure tuples (`let (key, value) = (...)`). Java has had record patterns since version 21, letting you destructure a record right inside `instanceof`. Go has no destructuring syntax for structs, but you get the same result with multiple assignment or a function that returns multiple values.

## Pulling multiple values out of an object

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

	// option 1: multiple variable assignment
	key, value := obj.Key, obj.Value
	fmt.Println(key, value) // foo bar

	// option 2: return multiple values from a function
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

    // real pattern destructuring, field names must match
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

// Swift doesn't destructure a struct by field name directly,
// but tuple destructuring works
let (key, value) = (obj.key, obj.value)
print(key, value) // foo bar
```
```java
record Obj(String key, String value) {}

void main() {
    Obj obj = new Obj("foo", "bar");

    // record pattern (Java 21+): destructure right inside instanceof
    if (obj instanceof Obj(String key, String value)) {
        IO.println(key + " " + value); // foo bar
    }
}
```
:::

:::note
Go has no destructuring syntax for structs or objects. The two most common ways to "pull apart" multiple values are multiple assignment (`key, value := obj.Key, obj.Value`) and a function that returns multiple values (`func (o *Obj) Read() (string, string)`). Rust has had real struct destructuring since 1.0. Java only got it in version 21 (JEP 440, record patterns), and only for `record`, not for a regular `class`.
:::
