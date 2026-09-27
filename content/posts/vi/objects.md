---
title: "Object"
description: "Object literal và method trong Node.js so với struct kèm pointer receiver trong Go."
date: "2026-09-27"
order: 460
category: collections
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [object, struct, method, receiver]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#objects"
---

Object literal trong Node.js gói cả dữ liệu lẫn method trong cùng một giá trị. Go tách hai việc: `struct` chỉ chứa dữ liệu, còn hành vi được gắn vào bằng hàm có receiver (thường là con trỏ tới struct đó).

## Object literal với property và method

:::tabs
```js
const obj = {
  someProperties: {
    foo: 'bar',
  },
  someMethod: (prop) => {
    return obj.someProperties[prop];
  },
};

let item = obj.someProperties['foo'];
console.log(item); // bar

item = obj.someMethod('foo');
console.log(item); // bar
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
`NewObj()` đóng vai trò constructor — một quy ước phổ biến ở Go, không phải cú pháp bắt buộc. `(o *Obj) SomeMethod(...)` là method với pointer receiver: `o` là con trỏ tới chính struct đó, tương tự cách `someMethod` trong object literal JS truy cập ngược lại `obj` qua closure.
:::
