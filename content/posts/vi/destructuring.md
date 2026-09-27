---
title: "Destructuring"
description: "Destructuring object trong Node.js so với gán nhiều biến và trả về nhiều giá trị trong Go."
date: "2026-09-27"
order: 520
category: functions
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [destructuring, multiple-return, struct]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#destructuring"
---

Node.js destructure trực tiếp một object thành nhiều biến bằng cú pháp `{ key, value } = obj`. Go không có cú pháp destructuring cho struct, nhưng đạt cùng hiệu quả bằng gán nhiều biến cùng lúc hoặc bằng hàm trả về nhiều giá trị.

## Lấy nhiều giá trị từ một object

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

	// cách 1: gán nhiều biến cùng lúc
	key, value := obj.Key, obj.Value
	fmt.Println(key, value) // foo bar

	// cách 2: hàm trả về nhiều giá trị
	key, value = obj.Read()
	fmt.Println(key, value) // foo bar
}
```
:::

:::note
Go không có cú pháp destructuring cho struct/object. Hai cách phổ biến nhất để "tách" nhiều giá trị là gán nhiều biến cùng lúc (`key, value := obj.Key, obj.Value`) và để hàm trả về nhiều giá trị (`func (o *Obj) Read() (string, string)`).
:::
