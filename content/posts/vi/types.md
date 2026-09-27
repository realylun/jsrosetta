---
title: "Kiểu dữ liệu"
description: "Các kiểu nguyên thuỷ và composite của JavaScript so với hệ kiểu tĩnh của Go, Rust, Swift và Java (int8..uint64, struct, map, channel…)."
date: "2026-09-27"
order: 200
category: types
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.18"
  rust: "1.60"
  swift: "1.2"
  java: "25"
tags: [types, primitives, any, interface]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#types"
---

JavaScript có hai kiểu số nguyên thuỷ: `number` (luôn là double 64-bit) và `bigint` (số nguyên độ chính xác tuỳ ý), cộng với một số ít kiểu composite dựng sẵn (`object`, `Map`, `Set`, `Promise`…). Go, Rust, Swift và Java đều tách số ra thành nhiều kiểu theo kích thước và dấu, cộng với các composite type tường minh như `struct`/`map`/`channel` (Go và Rust), `struct`/`class`/`Dictionary` (Swift), hay `record`/`Map`/`List` (Java).

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
```rust
// Cargo.toml: num-complex = "0.4"
#![allow(dead_code, unused_variables)]
use num_complex::Complex; // std không có kiểu complex dựng sẵn
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
    let my_u8: u8 = 10; // không có tên riêng cho "byte", u8 chính là byte
    let my_u16: u16 = 10;
    let my_u32: u32 = 10;
    let my_u64: u64 = 10;
    let my_u128: u128 = 10;
    let my_usize: usize = 10;
    let my_f32: f32 = 10.5;
    let my_f64: f64 = 10.5;
    let my_complex: Complex<f64> = Complex::new(-1.0, 10.0); // crate ngoài, không có trong std
    let my_char: char = 'a'; // luôn là một Unicode scalar value hợp lệ, khác `rune` (chỉ là alias int32) của Go
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
    let my_any: Box<dyn Any> = Box::new(1); // gần nhất với `any`/`interface{}`
    let my_ref: &i32 = &my_i32;
    let my_raw_ptr: *const i32 = &my_i32;
    let (my_sender, my_receiver) = mpsc::channel::<bool>(); // gần nhất với channel
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
let myDouble: Double = 10.5 // 64-bit, kiểu mặc định cho literal thập phân
let myCharacter: Character = "a" // một grapheme cluster, không chỉ một scalar
let myString: String = "foo"
let myOptional: Int? = nil
let myAny: Any = 10 // gần nhất với "any"/interface{}

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
// Swift không có kiểu complex dựng sẵn; dùng package swift-numerics (Complex<Double>) nếu cần

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
    Object myAny = 10;             // gần nhất với "any"; mọi reference type đều là Object
    int[] myArray = { 1, 2, 3 };   // mảng: kích thước cố định
    List<Integer> myList = new ArrayList<>();
    Map<String, Integer> myMap = new HashMap<>();
    Set<Integer> mySet = new HashSet<>();
    Optional<Integer> myOptional = Optional.empty();
    MyRecord myRecord = new MyRecord(1);
    MyEnum myEnumValue = MyEnum.A;
    MyFunctionalInterface myLambda = x -> x + 1;
    ArrayBlockingQueue<Integer> myQueue = new ArrayBlockingQueue<>(10); // gần nhất với channel
}
```
:::

:::note
Go 1.18 thêm `any` làm alias cho `interface{}`; dùng `any` cho code dễ đọc hơn, `interface{}` vẫn hoạt động nhưng là cách viết cũ. Rust và Swift đều không có kiểu complex trong stdlib — ví dụ trên phải dùng crate `num-complex` (Rust) hoặc package `swift-numerics` (Swift). Java có 7 kiểu số nguyên thuỷ (`byte`, `short`, `int`, `long`, `float`, `double`, `char`); trong đó `char` là kiểu **duy nhất không dấu** (0..65535, biểu diễn một UTF-16 code unit) — `byte`/`short`/`int`/`long` đều có dấu, khác hẳn Go/Rust.
:::

## Khác biệt chính

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Kiểu số | 2 kiểu: `number`, `bigint` | hơn chục kiểu: `int8`..`uint64`, `complex64/128` | tương tự Go, cộng thêm `i128`/`u128` (Go không có), trừ complex (crate ngoài) | `Int8`..`UInt64`, `Float`/`Double` | 7 kiểu số nguyên thuỷ, `char` là kiểu không dấu duy nhất |
| Kiểu bất kỳ | không cần khai báo | `any` (alias `interface{}`, từ 1.18) | `Box<dyn Any>` (hiếm dùng, thường generic hơn) | `Any` | `Object` |
| Giá trị "chưa có" | `undefined` | zero value theo từng kiểu | không có — biến phải được gán trước khi dùng (definite assignment); dùng `Option<T>::None` để biểu diễn "không có giá trị" | `nil` (chỉ với `Optional`) | zero value/`null` chỉ áp dụng cho field; biến local cũng phải được gán trước khi dùng (definite assignment), giống Rust |
| Hàm là first-class value | có | có, kiểu `func()` | có, `fn()` hoặc closure | có, kiểu `() -> Void` | có, qua functional interface/lambda |
