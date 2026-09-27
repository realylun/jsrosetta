---
title: "Class"
description: "Class, trường riêng tư và kế thừa trong Node.js so với class thật trong Swift/Java, struct + trait trong Rust, và struct + embedding trong Go."
date: "2026-09-27"
order: 600
category: oop
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.0"
  swift: "1.0"
  java: "25"
tags: [class, struct, embedding, encapsulation]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#classes"
---

Node.js có `class` với constructor, trường riêng tư (`#item`), static method và `extends` để kế thừa. Swift và Java cũng có `class` thật với đầy đủ các khái niệm này — gần với JS nhất, kể cả kế thừa bằng `extends`/subclassing. Go và Rust không có class — thứ gần nhất là struct cộng với method gắn vào struct đó, và cả hai đều ưu tiên composition hơn kế thừa: Go dùng struct embedding, Rust dùng trait cộng với việc chứa một struct khác làm field.

## Class (Node.js) vs struct + embedding (Go)

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

// Base giữ một giá trị cùng các method get/set. Trường viết thường
// (không export) chỉ riêng tư với package, không riêng tư với type.
type Base struct {
	item string
}

func (b *Base) GetItem() string {
	return b.item
}

func (b *Base) SetItem(value string) {
	b.item = value
}

// Foo nhúng (embed) Base nên có sẵn GetItem và SetItem —
// đây là cách Go thay thế cho kế thừa của class.
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
    item: String, // không có `pub`: riêng tư với module, giống Go
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

let foo = Foo.create("bar") // `let`: chỉ tham chiếu không đổi, class là reference type
print(foo.getItem()) // bar

foo.setItem("qux") // vẫn sửa được nội dung object dù `foo` là `let`
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
Trong compact source file (Java 25), một class khai báo cạnh `void main()` mặc định là inner class của class ẩn danh bao quanh file — muốn dùng nó từ static method (như `create`) phải khai báo `static class Foo`, nếu không compiler báo lỗi "non-static variable this cannot be referenced from a static context".
:::

## Khác biệt chính

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Trường riêng tư | `#item` | trường viết thường (chỉ riêng tư với package) | trường không `pub` (riêng tư với module) | `private` | `private` |
| Static method | `static create()` | hàm cấp package, ví dụ `NewFoo()` | associated function, ví dụ `Foo::create()` | `static func create()` | `static Foo create()` |
| Kế thừa | `extends` | sẽ tương ứng với struct embedding | không có; dùng trait + composition | `class Bar: Foo` — kế thừa thật | `extends` — kế thừa thật, giống JS |
