---
title: "Type Checking"
description: "How JavaScript's typeof/Object.prototype.toString compare to Go's reflect.TypeOf for runtime type checks."
tags: [types, reflect, typeof, runtime]
---

JavaScript's `typeof` only distinguishes a few broad groups (`object`, `function`…), so to know whether a value is exactly a `Map`, a `Date`, or a `RegExp`, you have to borrow `Object.prototype.toString`. Go has no `typeof`; the `reflect` package gives you the exact type name of any `any` value at runtime.

## Runtime type checking

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
Go 1.18 added `any` as an alias for `interface{}`; use `any` for a slice or parameter that can hold values of any type — like `values` above.
:::

:::tip
ES modules always run in strict mode, so an undeclared loop variable (`for (value of values)`) throws a `ReferenceError` instead of silently creating a global the way it did in sloppy-mode CommonJS. Always declare it: `for (const value of values)`.
:::
