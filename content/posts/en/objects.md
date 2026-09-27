---
title: "Object"
description: "Node.js object literals and methods compared to Go structs with pointer receivers."
tags: [object, struct, method, receiver]
---

A Node.js object literal bundles data and methods into the same value. Go splits the two: a `struct` holds only data, and behavior is attached with functions that take a receiver (usually a pointer to that struct).

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
:::

:::tip
`NewObj()` acts as a constructor — a common Go convention, not required syntax. `(o *Obj) SomeMethod(...)` is a method with a pointer receiver: `o` is a pointer to that same struct, similar to how `someMethod` in the JS object literal reaches back into `obj` through a closure.
:::
