---
title: "Classes"
description: "Classes, private fields, and inheritance in Node.js compared to structs and embedding in Go."
tags: [class, struct, embedding, encapsulation]
---

Node.js has `class` with a constructor, private fields (`#item`), static methods, and `extends` for inheritance. Go has no classes — the closest thing is a struct plus methods attached to it, and inheritance is replaced by embedding (nesting one struct inside another).

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
:::

## Key differences

| | Node.js | Go |
|---|---|---|
| Private field | `#item` | lowercase field (private to the package) |
| Static method | `static create()` | package-level function, e.g. `NewFoo()` |
| Inheritance | `extends` | struct embedding |
