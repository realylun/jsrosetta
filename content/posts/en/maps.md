---
title: "Map"
description: "Node.js's Map (set/get/has/delete, for...of) compared to Go's map[K]V, Rust's HashMap, Swift's Dictionary, and Java's HashMap."
tags: [map, collections, iteration]
---

Node.js's `Map` is a dedicated class with `set`/`get`/`has`/`delete` methods. Go has `map[K]V` right in the language syntax, no class or methods needed — you access it with `[]`, and check for existence with the second return value ("comma ok"). Rust has `HashMap<K, V>` in its standard library, Swift has `Dictionary` with `[K: V]` syntax, and Java has `HashMap` — none of the three preserve insertion order when iterated, just like Go.

## set, get, has, delete

:::tabs
```js
const map = new Map()
map.set('foo', 'bar')

let found = map.has('foo')
console.log(found) // true

let item = map.get('foo')
console.log(item) // bar

map.delete('foo')

found = map.has('foo')
console.log(found) // false

item = map.get('foo')
console.log(item) // undefined
```
```go
package main

import "fmt"

func main() {
	map1 := make(map[string]string)
	map1["foo"] = "bar"

	item, found := map1["foo"] // "comma ok": found reports whether the key exists
	fmt.Println(found)         // true
	fmt.Println(item)          // bar

	delete(map1, "foo")

	item, found = map1["foo"]
	fmt.Println(found) // false
	fmt.Println(item)  // "" (the zero value for string, not nil)
}
```
```rust
use std::collections::HashMap;

fn main() {
    let mut map1: HashMap<String, String> = HashMap::new();
    map1.insert("foo".to_string(), "bar".to_string());

    let found = map1.contains_key("foo");
    println!("{found}"); // true

    let item = map1.get("foo");
    println!("{item:?}"); // Some("bar")

    map1.remove("foo");

    let found = map1.contains_key("foo");
    println!("{found}"); // false

    let item = map1.get("foo");
    println!("{item:?}"); // None
}
```
```swift
var map1 = [String: String]()
map1["foo"] = "bar"

var found = map1["foo"] != nil
print(found) // true

var item = map1["foo"]
print(item as Any) // Optional("bar")

map1.removeValue(forKey: "foo")

found = map1["foo"] != nil
print(found) // false

item = map1["foo"]
print(item as Any) // nil
```
```java
void main() {
    Map<String, String> map1 = new HashMap<>();
    map1.put("foo", "bar");

    boolean found = map1.containsKey("foo");
    IO.println(found); // true

    String item = map1.get("foo");
    IO.println(item); // bar

    map1.remove("foo");

    found = map1.containsKey("foo");
    IO.println(found); // false

    item = map1.get("foo");
    IO.println(item); // null
}
```
:::

## Iterating over a map

:::tabs
```js
const map3 = new Map()
map3.set('foo', 100)
map3.set('bar', 200)
map3.set('baz', 300)

for (const [key, value] of map3) {
  console.log(key, value)
}
// foo 100
// bar 200
// baz 300 (Map preserves insertion order)
```
```go
import (
	"maps"
	"slices"
)

map2 := make(map[string]int)
map2["foo"] = 100
map2["bar"] = 200
map2["baz"] = 300

// map iteration order is randomized, so sort the keys for a stable result
for _, key := range slices.Sorted(maps.Keys(map2)) {
	fmt.Println(key, map2[key])
}
// bar 200
// baz 300
// foo 100
```
```rust
let mut map2 = HashMap::new();
map2.insert("foo", 100);
map2.insert("bar", 200);
map2.insert("baz", 300);

// Rust's HashMap iteration order isn't guaranteed, so sort the keys
let mut keys: Vec<_> = map2.keys().collect();
keys.sort();
for key in keys {
    println!("{key} {}", map2[key]);
}
// bar 200
// baz 300
// foo 100
```
```swift
var map3 = [String: Int]()
map3["foo"] = 100
map3["bar"] = 200
map3["baz"] = 300

// Dictionary iteration order isn't guaranteed, so sort the keys
for key in map3.keys.sorted() {
    print(key, map3[key]!)
}
// bar 200
// baz 300
// foo 100
```
```java
Map<String, Integer> map2 = new HashMap<>();
map2.put("foo", 100);
map2.put("bar", 200);
map2.put("baz", 300);

// HashMap iteration order isn't guaranteed, so sort the keys
for (String key : new TreeSet<>(map2.keySet())) {
    IO.println(key + " " + map2.get(key));
}
// bar 200
// baz 300
// foo 100
```
:::

## Key differences

| | Node.js `Map` | Go `map[K]V` | Rust `HashMap` | Swift `Dictionary` | Java `HashMap` |
|---|---|---|---|---|---|
| Checking existence | `.has(key)` | `value, ok := m[key]` | `.contains_key(key)` | `dict[key] != nil` | `.containsKey(key)` |
| Value when key is missing | `undefined` | the type's zero value (`""`, `0`, …) | `None` (an `Option<&V>`) | `nil` (a `V?`) | `null` |
| Iteration order | preserves insertion order | randomized | not guaranteed | not guaranteed | not guaranteed |
| Deleting a key | `.delete(key)` | `delete(m, key)` | `.remove(key)` | `.removeValue(forKey:)` | `.remove(key)` |

:::warning
JavaScript's `Map` preserves insertion order when iterated. Go's map, Rust's/Java's `HashMap`, and Swift's `Dictionary` are the opposite — iteration order isn't guaranteed (Go even deliberately randomizes it on every range). For a stable result, sort the keys yourself, as in the `slices.Sorted(maps.Keys(...))` (Go), sorting a key list (Rust/Swift), or `TreeSet` (Java) examples. If you want Java to actually preserve insertion order like JS, use `LinkedHashMap` instead of `HashMap`.
:::

:::note
Go 1.23 added `maps.Keys`, which returns an iterator (`iter.Seq[K]`) instead of a slice like the older `golang.org/x/exp/maps` package; `slices.Sorted` collects that iterator into a sorted slice.
:::
