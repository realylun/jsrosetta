---
title: "Types"
description: "How JavaScript's primitive and composite types (number, object, Map, Set…) compare to Go's statically sized numeric types and composites (struct, map, channel…)."
tags: [types, primitives, any, interface]
---

JavaScript has exactly one number type (`number`, always a 64-bit double) and a handful of built-in composite types (`object`, `Map`, `Set`, `Promise`…). Go splits numbers into more than a dozen types by size and signedness, plus explicit composite types like `struct`, `map`, and `channel`.

## Primitive and composite types

:::tabs
```js
// primitives
const myBool = true
const myNumber = 10
const myString = 'foo'
const mySymbol = Symbol('bar')
const myNull = null
const myUndefined = undefined

// object types
const myObject = {}
const myArray = []
const myFunction = function() {}
const myError = new Error('error')
const myDate = new Date()
const myRegex = /a/
const myMap = new Map()
const mySet = new Set()
const myPromise = Promise.resolve()
const myGenerator = function *() {}
const myClass = class {}
```
```go
package main

func main() {
	// primitives
	var myBool bool = true
	var myInt int = 10
	var myInt8 int8 = 10
	var myInt16 int16 = 10
	var myInt32 int32 = 10
	var myInt64 int64 = 10
	var myUint uint = 10
	var myUint8 uint8 = 10
	var myUint16 uint16 = 10
	var myUint32 uint32 = 10
	var myUint64 uint64 = 10
	var myUintptr uintptr = 10
	var myFloat32 float32 = 10.5
	var myFloat64 float64 = 10.5
	var myComplex64 complex64 = -1 + 10i
	var myComplex128 complex128 = -1 + 10i
	var myString string = "foo"
	var myByte byte = 10  // alias to uint8
	var myRune rune = 'a' // alias to int32

	// composite types
	var myStruct struct{} = struct{}{}
	var myArray []string = []string{}
	var myMap map[string]int = map[string]int{}
	var myFunction func() = func() {}
	var myChannel chan bool = make(chan bool)
	var myInterface any = nil
	var myPointer *int = new(int)

	_ = myBool
	_ = myInt
	_ = myInt8
	_ = myInt16
	_ = myInt32
	_ = myInt64
	_ = myUint
	_ = myUint8
	_ = myUint16
	_ = myUint32
	_ = myUint64
	_ = myUintptr
	_ = myFloat32
	_ = myFloat64
	_ = myComplex64
	_ = myComplex128
	_ = myString
	_ = myByte
	_ = myRune
	_ = myStruct
	_ = myArray
	_ = myMap
	_ = myFunction
	_ = myChannel
	_ = myInterface
	_ = myPointer
}
```
:::

:::note
Go 1.18 added `any` as an alias for `interface{}`; prefer `any` for readability — `interface{}` still works but is legacy style.
:::

## Key differences

| | Node.js | Go |
|---|---|---|
| Number types | 1 type, `number` (64-bit double) | over a dozen: `int8`..`uint64`, `float32/64`, `complex64/128` |
| Any type | no declaration needed | `any` (alias for `interface{}`, since Go 1.18) |
| "Not set" value | `undefined` | a per-type zero value (`""`, `0`, `false`, `nil`…) |
| Functions as first-class values | yes, `const f = function(){}` | yes, type `func()` |
