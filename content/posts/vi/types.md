---
title: "Kiểu dữ liệu"
description: "Các kiểu nguyên thuỷ và composite của JavaScript (number, object, Map, Set…) so với hệ kiểu tĩnh nhiều kích cỡ số của Go (int8..uint64, struct, map, channel…)."
date: "2026-09-27"
order: 200
category: types
languages: [js, go]
versions:
  js: "12.20"
  go: "1.18"
tags: [types, primitives, any, interface]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#types"
---

JavaScript chỉ có một kiểu số duy nhất (`number`, luôn là double 64-bit) và một số ít kiểu composite dựng sẵn (`object`, `Map`, `Set`, `Promise`…). Go tách số ra thành hơn chục kiểu theo kích thước và dấu, cộng với các composite type tường minh như `struct`, `map`, `channel`.

## Kiểu nguyên thuỷ và composite

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
Go 1.18 thêm `any` làm alias cho `interface{}`; dùng `any` cho code dễ đọc hơn, `interface{}` vẫn hoạt động nhưng là cách viết cũ.
:::

## Khác biệt chính

| | Node.js | Go |
|---|---|---|
| Kiểu số | 1 kiểu `number` (double 64-bit) | hơn chục kiểu: `int8`..`uint64`, `float32/64`, `complex64/128` |
| Kiểu bất kỳ | không cần khai báo | `any` (alias `interface{}`, từ Go 1.18) |
| Giá trị "chưa có" | `undefined` | zero value theo từng kiểu (`""`, `0`, `false`, `nil`…) |
| Hàm là first-class value | có, `const f = function(){}` | có, kiểu `func()` |
