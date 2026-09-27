---
title: "Type Checking"
description: "How JavaScript's typeof/Object.prototype.toString compare to Go's reflect.TypeOf, Swift's type(of:), Java's getClass(), and Rust's std::any::type_name."
tags: [types, reflect, typeof, runtime]
---

JavaScript's `typeof` only distinguishes a few broad groups (`object`, `function`…), so to know whether a value is exactly a `Map`, a `Date`, or a `RegExp`, you have to borrow `Object.prototype.toString`. Go has no `typeof`; the `reflect` package gives you the exact type name of any `any` value at runtime. Swift (`type(of:)`) and Java (`getClass()`) have real reflection, looping over a heterogeneous list just like Go. Rust is different: `std::any::type_name` is only resolved at compile time from a generic parameter, not real runtime reflection on a type-erased value — so it can't be written as a Go-style loop.

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
		int8(10),
		int16(10),
		int32(10),
		int64(10),
		uint(10),
		uint8(10),
		uint16(10),
		uint32(10),
		uint64(10),
		uintptr(10),
		float32(10.5),
		float64(10.5),
		complex64(-1 + 10i),
		complex128(-1 + 10i),
		"foo",
		byte(10),
		'a',
		rune('a'),
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
```rust
// Cargo.toml: regex = "1"
use std::collections::HashMap;
use std::time::Instant;

// `type_name` is resolved at compile time from the generic parameter T — not real runtime
// reflection like `reflect.TypeOf`, so it can't loop over a Go-style "any" list.
fn type_of<T>(_: &T) -> &'static str {
    std::any::type_name::<T>()
}

fn main() {
    println!("{}", type_of(&true));
    println!("{}", type_of(&10i32));
    println!("{}", type_of(&10.5f64));
    println!("{}", type_of(&"foo"));
    println!("{}", type_of(&String::from("foo")));
    println!("{}", type_of(&Option::<i32>::None));
    println!("{}", type_of(&Vec::<i32>::new()));
    println!("{}", type_of(&HashMap::<String, i32>::new()));
    println!("{}", type_of(&(|| {})));
    println!("{}", type_of(&Instant::now()));
    println!("{}", type_of(&regex::Regex::new("^a$").unwrap()));
}
```
```swift
import Foundation

let values: [Any] = [
    true,
    10,
    10.5,
    "foo",
    Optional<Int>.none as Any,
    [1, 2, 3],
    ["a": 1],
    { () -> Void in } as () -> Void,
    Date(),
    try! Regex("^a$"),
]

for value in values {
    print(type(of: value))
}
```
```java
void main() {
    List<Object> values = List.of(
            true,
            10,
            10.5,
            "foo",
            List.of(1, 2, 3),
            Map.of("a", 1),
            (Runnable) () -> {},
            Instant.now(),
            Pattern.compile("^a$"));

    for (Object value : values) {
        IO.println(value.getClass().getSimpleName());
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
int8
int16
int32
int64
uint
uint8
uint16
uint32
uint64
uintptr
float32
float64
complex64
complex128
string
uint8
int32
int32
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

Output (Rust — full module paths, and the `type_check` crate name would differ if you name your project something else):

```bash
bool
i32
f64
&str
alloc::string::String
core::option::Option<i32>
alloc::vec::Vec<i32>
std::collections::hash::map::HashMap<alloc::string::String, i32>
type_check::main::{{closure}}
std::time::Instant
regex::regex::string::Regex
```

Output (Swift):

```bash
Bool
Int
Double
String
Optional<Int>
Array<Int>
Dictionary<String, Int>
() -> ()
Date
Regex<AnyRegexOutput>
```

Output (Java — the lambda class name includes an address and will differ on every run):

```bash
Boolean
Integer
Double
String
ListN
Map1
Main$$Lambda/0x0000000301160210
Instant
Pattern
```

:::note
Go 1.18 added `any` as an alias for `interface{}`; use `any` for a slice or parameter that can hold values of any type — like `values` above.
:::

:::warning
ES modules always run in strict mode, so an undeclared loop variable (`for (value of values)`) throws a `ReferenceError: value is not defined` instead of silently creating a global the way it did in sloppy-mode CommonJS. Always declare it: `for (const value of values)`.
:::

:::warning
Rust has no way to get a `dyn Any` value's type name at runtime on stable — `type_name_of_val` is still unstable. `std::any::type_name::<T>()` only works because `T` is known at compile time at each call site (through monomorphization), so the code above calls it repeatedly by hand instead of looping over a heterogeneous collection like Go/Swift/Java do. The returned name is also an internal module path (not stable across crate versions), so treat it as debug-only output.
:::

:::note
Java's `List.of()`/`Map.of()` return their own private implementation classes (`ListN`, `Map1`…), not `ArrayList`/`HashMap` — a common surprise when printing `getClass()` on an immutable collection.
:::
