---
title: "Kiểm tra kiểu dữ liệu"
description: "typeof/Object.prototype.toString trong JavaScript so với reflect.TypeOf trong Go để kiểm tra kiểu lúc chạy."
date: "2026-09-27"
order: 210
category: types
languages: [js, go]
versions:
  js: "12.20"
  go: "1.18"
tags: [types, reflect, typeof, runtime]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#type-check"
---

`typeof` trong JavaScript chỉ phân biệt được vài nhóm lớn (`object`, `function`…), nên muốn biết chính xác một giá trị là `Map`, `Date` hay `RegExp` thì phải mượn `Object.prototype.toString`. Go không có `typeof`; package `reflect` cho bạn tên kiểu chính xác của bất kỳ giá trị `any` nào lúc chạy.

## Kiểm tra kiểu lúc chạy

:::tabs
```js
function typeOf(obj) {
  return {}.toString.call(obj).split(' ')[1].slice(0,-1).toLowerCase()
}

const values = [
  true,
  10,
  'foo',
  Symbol('bar'),
  null,
  undefined,
  NaN,
  {},
  [],
  function(){},
  new Error(),
  new Date(),
  /a/,
  new Map(),
  new Set(),
  Promise.resolve(),
  function *() {},
  class {},
]

for (const value of values) {
  console.log(typeOf(value))
}
```
```go
package main

import (
	"fmt"
	"reflect"
	"regexp"
	"time"
)

func main() {
	values := []any{
		true,
		10,
		"foo",
		struct{}{},
		[]string{},
		map[string]int{},
		func() {},
		make(chan bool),
		nil,
		new(int),
		time.Now(),
		regexp.MustCompile(`^a$`),
	}

	for _, value := range values {
		fmt.Println(reflect.TypeOf(value))
	}
}
```
:::

Output (Node.js):

```bash
boolean
number
string
symbol
null
undefined
number
object
array
function
error
date
regexp
map
set
promise
generatorfunction
function
```

Output (Go):

```bash
bool
int
string
struct {}
[]string
map[string]int
func()
chan bool
<nil>
*int
time.Time
*regexp.Regexp
```

:::note
Go 1.18 thêm `any` làm alias cho `interface{}`; dùng `any` cho một slice/tham số có thể chứa giá trị của bất kỳ kiểu nào — như `values` ở trên.
:::

:::tip
ES module luôn chạy ở strict mode, nên một loop variable chưa khai báo (`for (value of values)`) sẽ ném `ReferenceError` thay vì âm thầm tạo biến global như trong CommonJS sloppy mode. Luôn khai báo nó: `for (const value of values)`.
:::
