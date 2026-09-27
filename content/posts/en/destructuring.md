---
title: "Destructuring"
description: "Object destructuring in Node.js compared to multiple assignment and multiple return values in Go."
tags: [destructuring, multiple-return, struct]
---

Node.js destructures an object directly into multiple variables with `{ key, value } = obj`. Go has no destructuring syntax for structs, but you get the same result with multiple assignment or a function that returns multiple values.

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
:::

:::note
Go has no destructuring syntax for structs or objects. The two most common ways to "pull apart" multiple values are multiple assignment (`key, value := obj.Key, obj.Value`) and a function that returns multiple values (`func (o *Obj) Read() (string, string)`).
:::
