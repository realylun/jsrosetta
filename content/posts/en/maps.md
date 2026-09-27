---
title: "Map"
description: "Node.js's Map (set/get/has/delete, for...of) compared to Go's built-in map[K]V."
tags: [map, collections, iteration]
---

Node.js's `Map` is a dedicated class with `set`/`get`/`has`/`delete` methods. Go has `map[K]V` right in the language syntax, no class or methods needed — you access it with `[]`, and check for existence with the second return value ("comma ok").

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
:::

## Key differences

| | Node.js `Map` | Go `map[K]V` |
|---|---|---|
| Checking existence | `.has(key)` | `value, ok := m[key]` |
| Value when key is missing | `undefined` | the type's zero value (`""`, `0`, …) |
| Iteration order | preserves insertion order | randomized |
| Deleting a key | `.delete(key)` | `delete(m, key)` |

:::warning
JavaScript's `Map` preserves insertion order when iterated. Go's map is the opposite — iteration order (`for range`) is deliberately randomized every time you range over it, even within the same run. For a stable result, sort the keys yourself, as in the `slices.Sorted(maps.Keys(...))` example.
:::

:::note
Go 1.23 added `maps.Keys`, which returns an iterator (`iter.Seq[K]`) instead of a slice like the older `golang.org/x/exp/maps` package; `slices.Sorted` collects that iterator into a sorted slice.
:::
