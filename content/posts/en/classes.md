---
title: "Classes"
description: "Classes, private fields, and inheritance in Node.js compared to real classes in Swift/Java, structs + traits in Rust, and structs + embedding in Go."
tags: [class, struct, embedding, encapsulation]
---

Node.js has `class` with a constructor, private fields (`#item`), static methods, and `extends` for inheritance. Swift and Java also have real `class` types with all of this — the closest match to JS, inheritance included, via `extends`/subclassing. Go and Rust have no classes — the closest thing is a struct plus methods attached to it, and both favor composition over inheritance: Go uses struct embedding, Rust uses traits plus holding another struct as a field.

## Classes (Node.js) vs structs + embedding (Go)

:::tabs
```js
class Foo {
  #item

  constructor(value) {
    this.#item = value
  }

  static create(value) {
    return new Foo(value)
  }

  getItem() {
    return this.#item
  }

  setItem(value) {
    this.#item = value
  }
}

const foo = Foo.create('bar')
console.log(foo.getItem()) // bar

foo.setItem('qux')
console.log(foo.getItem()) // qux
```
```go
package main

import "fmt"

// Base holds a value and the methods to get/set it. The lowercase
// (unexported) field is private to the package, not to the type.
type Base struct {
	item string
}

func (b *Base) GetItem() string {
	return b.item
}

func (b *Base) SetItem(value string) {
	b.item = value
}

// Foo embeds Base, so it gets GetItem and SetItem for free —
// Go's alternative to class inheritance.
type Foo struct {
	Base
}

func NewFoo(value string) *Foo {
	return &Foo{Base: Base{item: value}}
}

func main() {
	foo := NewFoo("bar")
	fmt.Println(foo.GetItem()) // bar

	foo.SetItem("qux")
	fmt.Println(foo.GetItem()) // qux
}
```
```rust
struct Foo {
    item: String, // no `pub`: private to the module, like Go
}

impl Foo {
    fn create(value: &str) -> Self {
        Foo { item: value.to_string() }
    }

    fn get_item(&self) -> &str {
        &self.item
    }

    fn set_item(&mut self, value: &str) {
        self.item = value.to_string();
    }
}

fn main() {
    let mut foo = Foo::create("bar");
    println!("{}", foo.get_item()); // bar

    foo.set_item("qux");
    println!("{}", foo.get_item()); // qux
}
```
```swift
class Foo {
    private var item: String

    init(_ value: String) {
        item = value
    }

    static func create(_ value: String) -> Foo {
        Foo(value)
    }

    func getItem() -> String {
        item
    }

    func setItem(_ value: String) {
        item = value
    }
}

let foo = Foo.create("bar") // `let` only fixes the reference; classes are reference types
print(foo.getItem()) // bar

foo.setItem("qux") // the object's contents can still change even though `foo` is `let`
print(foo.getItem()) // qux
```
```java
static class Foo {
    private String item;

    private Foo(String value) {
        item = value;
    }

    static Foo create(String value) {
        return new Foo(value);
    }

    String getItem() {
        return item;
    }

    void setItem(String value) {
        item = value;
    }
}

void main() {
    Foo foo = Foo.create("bar");
    IO.println(foo.getItem()); // bar

    foo.setItem("qux");
    IO.println(foo.getItem()); // qux
}
```
:::

:::note
In a compact source file (Java 25), a class declared next to `void main()` is by default an inner class of the file's implicit enclosing class — to use it from a static method (like `create`) you must declare it `static class Foo`, otherwise the compiler reports "non-static variable this cannot be referenced from a static context".
:::

## Key differences

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Private field | `#item` | lowercase field (private to the package) | field without `pub` (private to the module) | `private` | `private` |
| Static method | `static create()` | package-level function, e.g. `NewFoo()` | associated function, e.g. `Foo::create()` | `static func create()` | `static Foo create()` |
| Inheritance | `extends` | would map to struct embedding | none; use traits + composition | `class Bar: Foo` — real inheritance | `extends` — real inheritance, same as JS |
