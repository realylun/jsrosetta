---
title: "Sorting arrays"
description: "Node.js's Array.prototype.toSorted compared to in-place sorting in Go, Rust, and Java, and Swift's sort()/sorted()."
tags: [array, sort, slices, comparator]
---

Sorting numbers and strings in Node.js uses the same `toSorted` function with a comparator; Go splits this into two cases: `slices.Sort` for types with a natural order (`cmp.Ordered`), and `slices.SortFunc` for custom comparisons, such as sorting by a struct field. Rust and Java only sort **in place** (`sort`/`sort_by_key`, `Collections.sort`) — to keep the original untouched, copy it first, just like Go. Swift has both: `sort()`/`sort(by:)` sorts in place, *and* `sorted()`/`sorted(by:)` returns a **new** array without touching the original — a direct equivalent of JavaScript's `toSorted()`.

## Sorting numbers and strings

:::tabs
```js
const stringArray = ['a', 'd', 'z', 'b', 'c', 'y']
const stringSortedAsc = stringArray.toSorted((a, b) => (a > b ? 1 : -1))
console.log(stringSortedAsc) // ['a', 'b', 'c', 'd', 'y', 'z']

const numberArray = [1, 3, 5, 9, 4, 2, 0]
const numberSortedAsc = numberArray.toSorted((a, b) => a - b)
console.log(numberSortedAsc) // [0, 1, 2, 3, 4, 5, 9]

const numberSortedDesc = numberArray.toSorted((a, b) => b - a)
console.log(numberSortedDesc) // [9, 5, 4, 3, 2, 1, 0]
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
```rust
fn main() {
    let mut int_list = vec![1, 3, 5, 9, 4, 2, 0];

    int_list.sort(); // asc
    println!("{int_list:?}"); // [0, 1, 2, 3, 4, 5, 9]

    int_list.reverse(); // desc: reverse the vec that's now sorted ascending
    println!("{int_list:?}"); // [9, 5, 4, 3, 2, 1, 0]

    let mut string_list = vec!["a", "d", "z", "b", "c", "y"];
    string_list.sort();
    println!("{string_list:?}"); // ["a", "b", "c", "d", "y", "z"]
}
```
```swift
var intList = [1, 3, 5, 9, 4, 2, 0]

intList.sort() // asc, in place
print(intList) // [0, 1, 2, 3, 4, 5, 9]

intList.reverse() // desc: reverse the array that's now sorted ascending
print(intList) // [9, 5, 4, 3, 2, 1, 0]

var stringList = ["a", "d", "z", "b", "c", "y"]
stringList.sort()
print(stringList) // ["a", "b", "c", "d", "y", "z"]
```
```java
void main() {
    List<Integer> intList = new ArrayList<>(List.of(1, 3, 5, 9, 4, 2, 0));

    Collections.sort(intList); // asc
    IO.println(intList); // [0, 1, 2, 3, 4, 5, 9]

    Collections.reverse(intList); // desc: reverse the list that's now sorted ascending
    IO.println(intList); // [9, 5, 4, 3, 2, 1, 0]

    List<String> stringList = new ArrayList<>(List.of("a", "d", "z", "b", "c", "y"));
    Collections.sort(stringList);
    IO.println(stringList); // [a, b, c, d, y, z]
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
  { name: 'Yi M', age: 2 }
]

const sortedByAge = collection.toSorted((a, b) => a.age - b.age)
console.log(sortedByAge)
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
```rust
#[derive(Debug)]
struct Person {
    #[allow(dead_code)] // only read through Debug — derives are ignored by dead-code analysis
    name: String,
    age: u32,
}

let mut collection = vec![
    Person { name: "Li L".into(), age: 8 },
    Person { name: "Json C".into(), age: 3 },
    Person { name: "Zack W".into(), age: 15 },
    Person { name: "Yi M".into(), age: 2 },
];

collection.sort_by_key(|p| p.age);
println!("{collection:?}");
// [Person { name: "Yi M", age: 2 }, Person { name: "Json C", age: 3 }, Person { name: "Li L", age: 8 }, Person { name: "Zack W", age: 15 }]
```
```swift
struct Person {
    let name: String
    let age: Int
}

var collection = [
    Person(name: "Li L", age: 8),
    Person(name: "Json C", age: 3),
    Person(name: "Zack W", age: 15),
    Person(name: "Yi M", age: 2),
]

collection.sort { $0.age < $1.age }
print(collection.map { ($0.name, $0.age) })
// [("Yi M", 2), ("Json C", 3), ("Li L", 8), ("Zack W", 15)]
```
```java
record Person(String name, int age) {}

List<Person> collection = new ArrayList<>(List.of(
        new Person("Li L", 8),
        new Person("Json C", 3),
        new Person("Zack W", 15),
        new Person("Yi M", 2)
));

collection.sort(Comparator.comparingInt(Person::age));
IO.println(collection);
// [Person[name=Yi M, age=2], Person[name=Json C, age=3], Person[name=Li L, age=8], Person[name=Zack W, age=15]]
```
:::

## Key differences

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Leaves the original untouched | `toSorted()` | `slices.Clone` before `slices.Sort` | `.clone()` before `.sort()` | `.sorted()`/`.sorted(by:)` | copy constructor before `Collections.sort`, or `.stream().sorted().toList()` |
| Default comparison (no function) | coerces to string | compile error if the type isn't `cmp.Ordered` | compile error if the type doesn't impl `Ord` | compile error if the type isn't `Comparable` | compile error if the type doesn't implement `Comparable` |
| Sorting by a field | comparator function | `slices.SortFunc` + `cmp.Compare` | `.sort_by_key` / `.sort_by` | `.sort(by:)` with a closure | `Comparator.comparingInt`/`.comparing` |
| Reversing order | comparator with flipped sign | `slices.Reverse` | `.reverse()` | `.reverse()` | `Collections.reverse` |

:::note
Node.js 20 added `Array.prototype.toSorted()`, which returns a sorted **copy** and leaves the original array untouched (`sort()` sorts in place, mutating the original).
:::

:::note
Go 1.21 added the `slices` package: `slices.Sort` (for `cmp.Ordered` types), `slices.SortFunc` + `cmp.Compare` (custom comparisons), and `slices.Reverse` — replacing `sort.Ints`/`sort.Strings`/`sort.Sort(sort.Reverse(...))` and hand-implementing `sort.Interface` (`Len`/`Swap`/`Less`) on a custom collection type.
:::
