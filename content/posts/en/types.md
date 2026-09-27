---
title: "Types"
description: "How JavaScript's primitive and composite types compare to Go's, Rust's, Swift's, and Java's static type systems (int8..uint64, struct, map, channel…)."
tags: [types, primitives, any, interface]
---

JavaScript has two numeric primitive types: `number` (always a 64-bit double) and `bigint` (arbitrary-precision integers), plus a handful of built-in composite types (`object`, `Map`, `Set`, `Promise`…). Go, Rust, Swift, and Java all split numbers into several types by size and signedness, plus explicit composite types like `struct`/`map`/`channel` (Go and Rust), `struct`/`class`/`Dictionary` (Swift), or `record`/`Map`/`List` (Java).

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
```rust
// Cargo.toml: num-complex = "0.4"
#![allow(dead_code, unused_variables)]
use num_complex::Complex; // std has no built-in complex type
use std::any::Any;
use std::collections::HashMap;
use std::sync::mpsc;

struct MyStruct {
    field: i32,
}

fn my_function() {}

fn main() {
    // primitives
    let my_bool: bool = true;
    let my_i8: i8 = 10;
    let my_i16: i16 = 10;
    let my_i32: i32 = 10;
    let my_i64: i64 = 10;
    let my_i128: i128 = 10;
    let my_isize: isize = 10;
    let my_u8: u8 = 10; // no separate "byte" name; u8 already is a byte
    let my_u16: u16 = 10;
    let my_u32: u32 = 10;
    let my_u64: u64 = 10;
    let my_u128: u128 = 10;
    let my_usize: usize = 10;
    let my_f32: f32 = 10.5;
    let my_f64: f64 = 10.5;
    let my_complex: Complex<f64> = Complex::new(-1.0, 10.0); // external crate, not in std
    let my_char: char = 'a'; // always a valid Unicode scalar value, unlike Go's `rune` (a plain int32 alias)
    let my_str: &str = "foo";
    let my_string: String = String::from("foo");

    // composite types
    let my_unit: () = ();
    let my_tuple: (i32, &str) = (1, "a");
    let my_array: [i32; 3] = [1, 2, 3];
    let my_slice: &[i32] = &my_array;
    let my_vec: Vec<i32> = Vec::new();
    let my_map: HashMap<String, i32> = HashMap::new();
    let my_struct = MyStruct { field: 1 };
    let my_fn: fn() = my_function;
    let my_closure = || {};
    let my_any: Box<dyn Any> = Box::new(1); // closest match to `any`/`interface{}`
    let my_ref: &i32 = &my_i32;
    let my_raw_ptr: *const i32 = &my_i32;
    let (my_sender, my_receiver) = mpsc::channel::<bool>(); // closest match to a channel
}
```
```swift
import Foundation

// primitives
let myBool: Bool = true
let myInt: Int = 10
let myInt8: Int8 = 10
let myInt16: Int16 = 10
let myInt32: Int32 = 10
let myInt64: Int64 = 10
let myUInt: UInt = 10
let myUInt8: UInt8 = 10
let myUInt16: UInt16 = 10
let myUInt32: UInt32 = 10
let myUInt64: UInt64 = 10
let myFloat: Float = 10.5   // 32-bit
let myDouble: Double = 10.5 // 64-bit, the default type for a decimal literal
let myCharacter: Character = "a" // a grapheme cluster, not just a scalar
let myString: String = "foo"
let myOptional: Int? = nil
let myAny: Any = 10 // closest match to "any"/interface{}

// composite types
let myTuple: (Int, String) = (1, "a")
let myArray: [Int] = []
let myDictionary: [String: Int] = [:]
let mySet: Set<Int> = []
struct MyStruct {}
let myStruct = MyStruct()
enum MyEnum { case a }
let myEnum = MyEnum.a
class MyClass {}
let myClass = MyClass()
let myClosure: () -> Void = {}
let myFunction: (Int) -> Int = { $0 + 1 }
// Swift has no built-in complex type; use the swift-numerics package (Complex<Double>) if needed

_ = (myBool, myInt, myInt8, myInt16, myInt32, myInt64, myUInt, myUInt8, myUInt16, myUInt32,
     myUInt64, myFloat, myDouble, myCharacter, myString, myOptional, myAny, myTuple, myArray,
     myDictionary, mySet, myStruct, myEnum, myClass, myClosure, myFunction)
```
```java
record MyRecord(int field) {}

enum MyEnum { A, B }

interface MyFunctionalInterface {
    int apply(int x);
}

void main() {
    // primitives
    boolean myBoolean = true;
    byte myByte = 10;
    short myShort = 10;
    int myInt = 10;
    long myLong = 10;
    float myFloat = 10.5f;
    double myDouble = 10.5;
    char myChar = 'a';

    // reference types
    String myString = "foo";
    Object myAny = 10;             // closest match to "any"; every reference type is an Object
    int[] myArray = { 1, 2, 3 };   // arrays: fixed size
    List<Integer> myList = new ArrayList<>();
    Map<String, Integer> myMap = new HashMap<>();
    Set<Integer> mySet = new HashSet<>();
    Optional<Integer> myOptional = Optional.empty();
    MyRecord myRecord = new MyRecord(1);
    MyEnum myEnumValue = MyEnum.A;
    MyFunctionalInterface myLambda = x -> x + 1;
    ArrayBlockingQueue<Integer> myQueue = new ArrayBlockingQueue<>(10); // closest match to a channel
}
```
:::

:::note
Go 1.18 added `any` as an alias for `interface{}`; prefer `any` for readability — `interface{}` still works but is legacy style. Neither Rust nor Swift has a complex number type in their stdlib — the example above needs the `num-complex` crate (Rust) or the `swift-numerics` package (Swift). Java has no unsigned integer types at all (only unsigned-handling methods like `Integer.toUnsignedLong`), unlike Go/Rust.
:::

## Key differences

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Number types | 2 types: `number`, `bigint` | over a dozen: `int8`..`uint64`, `complex64/128` | similar to Go, except complex (external crate) | `Int8`..`UInt64`, `Float`/`Double` | 8 types, no unsigned type |
| Any type | no declaration needed | `any` (alias for `interface{}`, since 1.18) | `Box<dyn Any>` (rare; generics are more idiomatic) | `Any` | `Object` |
| "Not set" value | `undefined` | a per-type zero value | none; a variable must be assigned before use | `nil` (only for `Optional`) | `null` (reference types), zero value (primitives) |
| Functions as first-class values | yes | yes, type `func()` | yes, `fn()` or a closure | yes, type `() -> Void` | yes, via a functional interface/lambda |
