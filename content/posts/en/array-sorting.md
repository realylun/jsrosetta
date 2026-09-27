---
title: "Sorting arrays"
description: "Node.js's Array.prototype.toSorted compared to Go's slices.Sort, slices.SortFunc, and slices.Reverse."
tags: [array, sort, slices, comparator]
---

Sorting numbers and strings in Node.js uses the same `toSorted` function with a comparator; Go splits this into two cases: `slices.Sort` for types with a natural order (`cmp.Ordered`), and `slices.SortFunc` for custom comparisons, such as sorting by a struct field.

## Sorting numbers and strings

:::tabs
```js
const stringArray = ['a', 'd', 'z', 'b', 'c', 'y'];
const stringSortedAsc = stringArray.toSorted((a, b) => (a > b ? 1 : -1));
console.log(stringSortedAsc); // ['a', 'b', 'c', 'd', 'y', 'z']

const numberArray = [1, 3, 5, 9, 4, 2, 0];
const numberSortedAsc = numberArray.toSorted((a, b) => a - b);
console.log(numberSortedAsc); // [0, 1, 2, 3, 4, 5, 9]

const numberSortedDesc = numberArray.toSorted((a, b) => b - a);
console.log(numberSortedDesc); // [9, 5, 4, 3, 2, 1, 0]
```
```go
package main

import (
	"fmt"
	"slices"
)

func main() {
	intList := []int{1, 3, 5, 9, 4, 2, 0}

	slices.Sort(intList) // asc
	fmt.Println(intList) // [0 1 2 3 4 5 9]

	slices.Reverse(intList) // desc: reverse the slice that's now sorted ascending
	fmt.Println(intList)    // [9 5 4 3 2 1 0]

	stringList := []string{"a", "d", "z", "b", "c", "y"}
	slices.Sort(stringList)
	fmt.Println(stringList) // [a b c d y z]
}
```
:::

## Sorting by an object/struct field

:::tabs
```js
const collection = [
  { name: 'Li L', age: 8 },
  { name: 'Json C', age: 3 },
  { name: 'Zack W', age: 15 },
  { name: 'Yi M', age: 2 },
];

const sortedByAge = collection.toSorted((a, b) => a.age - b.age);
console.log(sortedByAge);
// [{ name: 'Yi M', age: 2 }, { name: 'Json C', age: 3 }, { name: 'Li L', age: 8 }, { name: 'Zack W', age: 15 }]
```
```go
import "cmp"

type Person struct {
	Name string
	Age  int
}

collection := []Person{
	{"Li L", 8},
	{"Json C", 3},
	{"Zack W", 15},
	{"Yi M", 2},
}

slices.SortFunc(collection, func(a, b Person) int {
	return cmp.Compare(a.Age, b.Age)
})
fmt.Println(collection)
// [{Yi M 2} {Json C 3} {Li L 8} {Zack W 15}]
```
:::

## Key differences

| | Node.js | Go |
|---|---|---|
| Leaves the original untouched | `toSorted()` | `slices.Clone` before `slices.Sort` |
| Default comparison (no function) | coerces to string | compile error if the type isn't `cmp.Ordered` |
| Sorting by a field | comparator function | `slices.SortFunc` + `cmp.Compare` |
| Reversing order | comparator with flipped sign | `slices.Reverse` |

:::note
Node.js 20 added `Array.prototype.toSorted()`, which returns a sorted **copy** and leaves the original array untouched (`sort()` sorts in place, mutating the original).
:::

:::note
Go 1.21 added the `slices` package: `slices.Sort` (for `cmp.Ordered` types), `slices.SortFunc` + `cmp.Compare` (custom comparisons), and `slices.Reverse` — replacing `sort.Ints`/`sort.Strings`/`sort.Sort(sort.Reverse(...))` and hand-implementing `sort.Interface` (`Len`/`Swap`/`Less`) on a custom collection type.
:::
