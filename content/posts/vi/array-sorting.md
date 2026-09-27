---
title: "Sắp xếp mảng"
description: "Array.prototype.toSorted của Node.js so với sort tại chỗ ở Go, Rust, Swift và Java."
date: "2026-09-27"
order: 420
category: collections
languages: [js, go, rust, swift, java]
versions:
  js: "20"
  go: "1.21"
  rust: "1.7"
  swift: "3.0"
  java: "25"
tags: [array, sort, slices, comparator]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#array-sorting"
---

Sắp xếp số và chuỗi ở Node.js dùng chung một hàm `toSorted` với comparator; Go tách hai trường hợp: `slices.Sort` cho kiểu có thứ tự sẵn (`cmp.Ordered`), và `slices.SortFunc` khi cần so sánh tuỳ ý, ví dụ theo field của struct. Rust, Swift và Java đều sắp xếp **tại chỗ** (`sort`/`sort_by_key`, `Collections.sort`) — muốn giữ mảng gốc thì tự sao chép trước, giống Go.

## Sắp xếp số và chuỗi

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

	slices.Reverse(intList) // desc: đảo ngược slice vừa sort tăng dần
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

    int_list.reverse(); // desc: đảo ngược vec vừa sort tăng dần
    println!("{int_list:?}"); // [9, 5, 4, 3, 2, 1, 0]

    let mut string_list = vec!["a", "d", "z", "b", "c", "y"];
    string_list.sort();
    println!("{string_list:?}"); // ["a", "b", "c", "d", "y", "z"]
}
```
```swift
var intList = [1, 3, 5, 9, 4, 2, 0]

intList.sort() // asc, tại chỗ (in-place)
print(intList) // [0, 1, 2, 3, 4, 5, 9]

intList.reverse() // desc: đảo ngược mảng vừa sort tăng dần
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

    Collections.reverse(intList); // desc: đảo ngược list vừa sort tăng dần
    IO.println(intList); // [9, 5, 4, 3, 2, 1, 0]

    List<String> stringList = new ArrayList<>(List.of("a", "d", "z", "b", "c", "y"));
    Collections.sort(stringList);
    IO.println(stringList); // [a, b, c, d, y, z]
}
```
:::

## Sắp xếp theo field của object/struct

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

## Khác biệt chính

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Không đổi mảng gốc | `toSorted()` | `slices.Clone` rồi mới `slices.Sort` | `.clone()` rồi mới `.sort()` | copy (value type) rồi mới `.sort()` | copy constructor rồi mới `Collections.sort` |
| So sánh mặc định (không truyền hàm) | ép kiểu chuỗi | lỗi biên dịch nếu kiểu không phải `cmp.Ordered` | lỗi biên dịch nếu kiểu không impl `Ord` | lỗi biên dịch nếu kiểu không `Comparable` | lỗi biên dịch nếu kiểu không implement `Comparable` |
| Sắp theo field | comparator function | `slices.SortFunc` + `cmp.Compare` | `.sort_by_key` / `.sort_by` | `.sort(by:)` với closure | `Comparator.comparingInt`/`.comparing` |
| Đảo ngược thứ tự | comparator ngược dấu | `slices.Reverse` | `.reverse()` | `.reverse()` | `Collections.reverse` |

:::note
Node.js 20 thêm `Array.prototype.toSorted()` — trả về **bản sao** đã sắp xếp, mảng gốc giữ nguyên (`sort()` sắp xếp tại chỗ, mutate mảng gốc).
:::

:::note
Go 1.21 thêm package `slices`: `slices.Sort` (cho kiểu `cmp.Ordered`), `slices.SortFunc` + `cmp.Compare` (so sánh tuỳ ý), và `slices.Reverse` — thay cho `sort.Ints`/`sort.Strings`/`sort.Sort(sort.Reverse(...))` cùng việc tự cài `sort.Interface` (`Len`/`Swap`/`Less`) trên một type collection viết tay.
:::
