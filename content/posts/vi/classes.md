---
title: "Class"
description: "Class, trường riêng tư và kế thừa trong Node.js so với struct và embedding trong Go."
date: "2026-09-27"
order: 600
category: oop
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [class, struct, embedding, encapsulation]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#classes"
---

Node.js có `class` với constructor, trường riêng tư (`#item`), static method và `extends` để kế thừa. Go không có class — thứ gần nhất là struct cộng với method gắn vào struct đó, và kế thừa được thay bằng embedding (nhúng một struct vào struct khác).

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
:::

## Khác biệt chính

| | Node.js | Go |
|---|---|---|
| Trường riêng tư | `#item` | trường viết thường (chỉ riêng tư với package) |
| Static method | `static create()` | hàm cấp package, ví dụ `NewFoo()` |
| Kế thừa | `extends` | struct embedding |
