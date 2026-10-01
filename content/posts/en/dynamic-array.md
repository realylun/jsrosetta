---
title: "Implementing a dynamic array"
description: "Build a dynamic array on top of fixed storage in Node.js, Go and Rust: length, capacity, doubling when full, push/pop/insert/remove and their complexity."
tags: [data-structure, array, capacity, amortized]
---

Node.js's `Array`, Go's slice and Rust's `Vec` are all dynamic arrays: one contiguous block of memory (for `Array`, in V8's usual fast-elements mode) with spare room at the end, and when that room runs out, a bigger block is allocated and the data copied over. This post rebuilds that structure on top of storage treated as fixed-size, so you can see how `length` (the number of elements in use) differs from `capacity` (the number of slots allocated). Node.js has no fixed-size array for arbitrary values, so we use `new Array(capacity)` and promise never to call `push` or change its `length`. Go uses a slice made with `make([]T, capacity)` but never calls `append`. Rust uses `Box<[Option<T>]>`, with `None` marking unused slots, so no `unsafe` is needed.

## Structure and growing the capacity

Each version keeps two things: the `data` storage and the element count `length`. `capacity` is just the length of `data`. When you `push` into a full array, `grow` allocates storage twice as large, copies the old elements over, and only then writes the new one.

:::tabs
```js
class DynamicArray {
  #data; // fixed storage: read/write by index only, never push or change length
  #length = 0;

  constructor(capacity = 4) {
    this.#data = new Array(capacity);
  }

  get length() {
    return this.#length;
  }

  get capacity() {
    return this.#data.length;
  }

  push(value) {
    const isFull = this.#length === this.capacity;
    if (isFull) {
      this.#grow();
    }
    this.#data[this.#length] = value;
    this.#length += 1;
  }

  #grow() {
    // doubling a capacity of 0 is still 0, so grow to at least 1
    const next = new Array(Math.max(1, this.capacity * 2));
    for (let i = 0; i < this.#length; i++) {
      next[i] = this.#data[i];
    }
    this.#data = next;
  }
}

const arr = new DynamicArray(2);
for (let i = 1; i <= 5; i++) {
  arr.push(i * 10);
  console.log(`len=${arr.length} cap=${arr.capacity}`);
}
// → len=1 cap=2
// → len=2 cap=2
// → len=3 cap=4
// → len=4 cap=4
// → len=5 cap=8
```
```go
package main

import "fmt"

type DynamicArray[T any] struct {
	data   []T // fixed storage: read/write by index only, never append
	length int
}

func New[T any](capacity int) *DynamicArray[T] {
	return &DynamicArray[T]{data: make([]T, capacity)}
}

func (a *DynamicArray[T]) Len() int { return a.length }

func (a *DynamicArray[T]) Cap() int { return len(a.data) }

func (a *DynamicArray[T]) Push(value T) {
	isFull := a.length == len(a.data)
	if isFull {
		a.grow()
	}
	a.data[a.length] = value
	a.length++
}

func (a *DynamicArray[T]) grow() {
	// doubling a capacity of 0 is still 0, so grow to at least 1
	next := make([]T, max(1, len(a.data)*2))
	copy(next, a.data[:a.length])
	a.data = next
}

func main() {
	arr := New[int](2)
	for i := 1; i <= 5; i++ {
		arr.Push(i * 10)
		fmt.Printf("len=%d cap=%d\n", arr.Len(), arr.Cap())
	}
	// → len=1 cap=2
	// → len=2 cap=2
	// → len=3 cap=4
	// → len=4 cap=4
	// → len=5 cap=8
}
```
```rust
struct DynamicArray<T> {
    data: Box<[Option<T>]>, // fixed storage; None marks an unused slot
    len: usize,
}

impl<T> DynamicArray<T> {
    fn with_capacity(capacity: usize) -> Self {
        Self {
            data: Self::allocate(capacity),
            len: 0,
        }
    }

    fn allocate(capacity: usize) -> Box<[Option<T>]> {
        (0..capacity).map(|_| None).collect()
    }

    fn len(&self) -> usize {
        self.len
    }

    fn capacity(&self) -> usize {
        self.data.len()
    }

    fn push(&mut self, value: T) {
        let is_full = self.len == self.capacity();
        if is_full {
            self.grow();
        }
        self.data[self.len] = Some(value);
        self.len += 1;
    }

    fn grow(&mut self) {
        // doubling a capacity of 0 is still 0, so grow to at least 1
        let mut next = Self::allocate((self.capacity() * 2).max(1));
        for (slot, old) in next.iter_mut().zip(self.data.iter_mut()) {
            *slot = old.take(); // move ownership into the new storage, no clone
        }
        self.data = next;
    }
}

fn main() {
    let mut arr = DynamicArray::with_capacity(2);
    for i in 1..=5 {
        arr.push(i * 10);
        println!("len={} cap={}", arr.len(), arr.capacity());
    }
    // → len=1 cap=2
    // → len=2 cap=2
    // → len=3 cap=4
    // → len=4 cap=4
    // → len=5 cap=8
}
```
:::

A single `grow` costs O(n) because every element is copied, but thanks to doubling, the total number of copies after n `push` calls stays under roughly 2n. Spread evenly, each `push` costs O(1) — this is called **amortized O(1)**. If each growth only added a fixed number of slots (say +10), the total number of copies would be O(n²).

:::note
Rust's real `Vec` does not use `Option<T>`: it allocates uninitialized memory and writes into it with `unsafe` (`std::ptr::write`), so it spends no extra room on a marker. With `Option<T>`, depending on `T`, that cost can be 0 bytes (thanks to niche optimization, e.g. `Option<Box<T>>`) or a whole word due to alignment (`Option<i64>` takes 16 bytes instead of 8). The `Box<[Option<T>]>` version here trades a little memory for safe, readable code.
:::

## Complete version: get, set, pop, insert, remove and iteration

The complete version adds index reads/writes, inserting/removing in the middle, and iteration. `push` is now just an `insert` at the end, and `pop` is a `remove` of the last element.

- An out-of-range `get` returns "no value" the way each language usually does: JS returns `undefined`, Go returns an extra `bool` ("comma ok"), Rust returns `Option<&T>`.
- `set`, `insert` and `remove` with a bad index are programming errors: JS throws a `RangeError`, Go and Rust `panic` — just like Rust's `Vec::insert`/`Vec::remove` or an out-of-range slice access in Go.
- After a `remove`, the last slot is cleared (JS assigns `undefined`, Go assigns the zero value) so the storage holds no reference to the removed element and the GC can reclaim it. Rust has no GC: `take()` is required to move the value out of the slot, which leaves `None` behind.

:::tabs
```js
class DynamicArray {
  #data;
  #length = 0;

  constructor(capacity = 4) {
    this.#data = new Array(capacity);
  }

  get length() {
    return this.#length;
  }

  get capacity() {
    return this.#data.length;
  }

  get(index) {
    const inRange = Number.isInteger(index) && index >= 0 && index < this.#length;
    if (!inRange) {
      return undefined;
    }
    return this.#data[index];
  }

  set(index, value) {
    this.#checkIndex(index, this.#length);
    this.#data[index] = value;
  }

  push(value) {
    this.insert(this.#length, value);
  }

  pop() {
    const isEmpty = this.#length === 0;
    if (isEmpty) {
      return undefined;
    }
    return this.remove(this.#length - 1);
  }

  insert(index, value) {
    this.#checkIndex(index, this.#length + 1); // index === length is allowed: append at the end
    const isFull = this.#length === this.capacity;
    if (isFull) {
      this.#grow();
    }
    // shift elements from index one slot right, back to front so nothing is overwritten
    for (let i = this.#length; i > index; i--) {
      this.#data[i] = this.#data[i - 1];
    }
    this.#data[index] = value;
    this.#length += 1;
  }

  remove(index) {
    this.#checkIndex(index, this.#length);
    const value = this.#data[index];
    for (let i = index; i < this.#length - 1; i++) {
      this.#data[i] = this.#data[i + 1];
    }
    this.#length -= 1;
    this.#data[this.#length] = undefined; // drop the reference so the GC can reclaim it
    return value;
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.#length; i++) {
      yield this.#data[i];
    }
  }

  #checkIndex(index, limit) {
    const inRange = Number.isInteger(index) && index >= 0 && index < limit;
    if (!inRange) {
      throw new RangeError(`index ${index} out of range (length ${this.#length})`);
    }
  }

  #grow() {
    const next = new Array(Math.max(1, this.capacity * 2));
    for (let i = 0; i < this.#length; i++) {
      next[i] = this.#data[i];
    }
    this.#data = next;
  }
}

const arr = new DynamicArray();
for (const value of ["a", "b", "c"]) {
  arr.push(value);
}
arr.insert(1, "x");
console.log([...arr]); // → [ 'a', 'x', 'b', 'c' ]

arr.set(0, "A");
console.log(arr.get(0)); // → A
console.log(arr.get(10)); // → undefined

console.log(arr.remove(2)); // → b
console.log(arr.pop()); // → c
console.log([...arr], arr.length, arr.capacity); // → [ 'A', 'x' ] 2 4
```
```go
package main

import (
	"fmt"
	"iter"
	"slices"
)

type DynamicArray[T any] struct {
	data   []T
	length int
}

func New[T any](capacity int) *DynamicArray[T] {
	return &DynamicArray[T]{data: make([]T, capacity)}
}

func (a *DynamicArray[T]) Len() int { return a.length }

func (a *DynamicArray[T]) Cap() int { return len(a.data) }

func (a *DynamicArray[T]) Get(index int) (T, bool) {
	inRange := index >= 0 && index < a.length
	if !inRange {
		var zero T
		return zero, false
	}
	return a.data[index], true
}

func (a *DynamicArray[T]) Set(index int, value T) {
	a.checkIndex(index, a.length)
	a.data[index] = value
}

func (a *DynamicArray[T]) Push(value T) {
	a.Insert(a.length, value)
}

func (a *DynamicArray[T]) Pop() (T, bool) {
	isEmpty := a.length == 0
	if isEmpty {
		var zero T
		return zero, false
	}
	return a.Remove(a.length - 1), true
}

func (a *DynamicArray[T]) Insert(index int, value T) {
	a.checkIndex(index, a.length+1) // index == length is allowed: append at the end
	isFull := a.length == len(a.data)
	if isFull {
		a.grow()
	}
	// shift elements from index one slot right, back to front so nothing is overwritten
	for i := a.length; i > index; i-- {
		a.data[i] = a.data[i-1]
	}
	a.data[index] = value
	a.length++
}

func (a *DynamicArray[T]) Remove(index int) T {
	a.checkIndex(index, a.length)
	value := a.data[index]
	for i := index; i < a.length-1; i++ {
		a.data[i] = a.data[i+1]
	}
	a.length--
	var zero T
	a.data[a.length] = zero // drop the reference so the GC can reclaim it
	return value
}

func (a *DynamicArray[T]) All() iter.Seq[T] {
	return func(yield func(T) bool) {
		for i := range a.length {
			if !yield(a.data[i]) {
				return
			}
		}
	}
}

func (a *DynamicArray[T]) checkIndex(index, limit int) {
	inRange := index >= 0 && index < limit
	if !inRange {
		panic(fmt.Sprintf("index %d out of range (length %d)", index, a.length))
	}
}

func (a *DynamicArray[T]) grow() {
	next := make([]T, max(1, len(a.data)*2))
	copy(next, a.data[:a.length])
	a.data = next
}

func main() {
	arr := New[string](4)
	for _, value := range []string{"a", "b", "c"} {
		arr.Push(value)
	}
	arr.Insert(1, "x")
	fmt.Println(slices.Collect(arr.All())) // → [a x b c]

	arr.Set(0, "A")
	fmt.Println(arr.Get(0)) // → A true
	value, ok := arr.Get(10)
	fmt.Printf("%q %t\n", value, ok) // → "" false

	fmt.Println(arr.Remove(2))                                   // → b
	fmt.Println(arr.Pop())                                       // → c true
	fmt.Println(slices.Collect(arr.All()), arr.Len(), arr.Cap()) // → [A x] 2 4
}
```
```rust
struct DynamicArray<T> {
    data: Box<[Option<T>]>,
    len: usize,
}

impl<T> DynamicArray<T> {
    fn with_capacity(capacity: usize) -> Self {
        Self {
            data: Self::allocate(capacity),
            len: 0,
        }
    }

    fn allocate(capacity: usize) -> Box<[Option<T>]> {
        (0..capacity).map(|_| None).collect()
    }

    fn len(&self) -> usize {
        self.len
    }

    fn capacity(&self) -> usize {
        self.data.len()
    }

    fn get(&self, index: usize) -> Option<&T> {
        let in_range = index < self.len;
        if !in_range {
            return None;
        }
        self.data[index].as_ref()
    }

    fn set(&mut self, index: usize, value: T) {
        self.check_index(index, self.len);
        self.data[index] = Some(value);
    }

    fn push(&mut self, value: T) {
        self.insert(self.len, value);
    }

    fn pop(&mut self) -> Option<T> {
        let is_empty = self.len == 0;
        if is_empty {
            return None;
        }
        Some(self.remove(self.len - 1))
    }

    fn insert(&mut self, index: usize, value: T) {
        self.check_index(index, self.len + 1); // index == len is allowed: append at the end
        let is_full = self.len == self.capacity();
        if is_full {
            self.grow();
        }
        // shift elements from index one slot right, back to front so nothing is overwritten
        for i in (index..self.len).rev() {
            self.data[i + 1] = self.data[i].take();
        }
        self.data[index] = Some(value);
        self.len += 1;
    }

    fn remove(&mut self, index: usize) -> T {
        self.check_index(index, self.len);
        let value = self.data[index].take();
        for i in index..self.len - 1 {
            self.data[i] = self.data[i + 1].take();
        }
        self.len -= 1; // the last slot is already None after take(), nothing to clear
        value.expect("slots below len are always Some")
    }

    fn iter(&self) -> impl Iterator<Item = &T> {
        self.data[..self.len].iter().flatten()
    }

    fn check_index(&self, index: usize, limit: usize) {
        let in_range = index < limit;
        assert!(in_range, "index {index} out of range (length {})", self.len);
    }

    fn grow(&mut self) {
        let mut next = Self::allocate((self.capacity() * 2).max(1));
        for (slot, old) in next.iter_mut().zip(self.data.iter_mut()) {
            *slot = old.take();
        }
        self.data = next;
    }
}

fn main() {
    let mut arr = DynamicArray::with_capacity(4);
    for value in ["a", "b", "c"] {
        arr.push(value);
    }
    arr.insert(1, "x");
    println!("{:?}", arr.iter().collect::<Vec<_>>()); // → ["a", "x", "b", "c"]

    arr.set(0, "A");
    println!("{:?}", arr.get(0)); // → Some("A")
    println!("{:?}", arr.get(10)); // → None

    println!("{}", arr.remove(2)); // → b
    println!("{:?}", arr.pop()); // → Some("c")
    let items: Vec<_> = arr.iter().collect();
    println!("{items:?} {} {}", arr.len(), arr.capacity()); // → ["A", "x"] 2 4
}
```
:::

`insert` and `remove` have to shift every element after the index by one slot, so they cost O(n); inserting or removing at the end (`push`/`pop`) shifts nothing. Iteration uses each language's own iterator mechanism: a `[Symbol.iterator]` generator so `[...arr]` and `for...of` work, an `iter.Seq[T]` so `for v := range arr.All()` and `slices.Collect` work, and in Rust an `impl Iterator<Item = &T>` over `data[..len]`.

## Complexity

| Operation | Time | Notes |
|---|---|---|
| `get` / `set` | O(1) | direct access by index |
| `push` | O(1) amortized | O(n) when it has to `grow` |
| `pop` | O(1) | storage is never shrunk |
| `insert` / `remove` in the middle | O(n) | shifts the following elements |
| Full iteration | O(n) | |

## Compared with the built-in types

The built-in types of all three languages follow the same idea and differ only in their growth factor. The numbers below were measured on Node.js 24.12, Go 1.27 and Rust 1.98 (V8's capacity was inspected with `%DebugPrint` under `node --allow-natives-syntax`); they are implementation details rather than language guarantees, and may change in later releases.

| | Node.js (V8) | Go | Rust |
|---|---|---|---|
| Type | `Array` | slice + `append` | `Vec<T>` |
| Reading capacity | no API | `cap(s)` | `v.capacity()` |
| Preallocating capacity | `new Array(n)` preallocates but also sets `length = n` (a holey array), so it is not equivalent | `make([]T, 0, n)` | `Vec::with_capacity(n)` |
| Growth | `n + n/2 + 16` (about 1.5×) | 2× up to 256 elements, then gradually down to about 1.25× | 2×, first allocation is at least 4 slots (8 for 1-byte elements, 1 for elements over 1 KiB) |
| Capacity under repeated `push` | 17 → 43 → … | 256 → 512 → 848 → 1280 (`int64`) | 256 → 512 → 1024 → 2048 (`i64`) |
| Automatic shrinking | yes, when `pop`/shrinking `length` leaves more than half of the storage empty | no | no, call `shrink_to_fit()` |

:::tip
If you know the element count ahead of time, preallocate the capacity (`make([]T, 0, n)` in Go, `Vec::with_capacity(n)` in Rust) to avoid repeated `grow` calls. Node.js has no equivalent preallocation for a plain `Array` (`new Array(n)` also sets `length = n`); if the data is numeric, a `TypedArray` (such as `Float64Array`) has a fixed size from the start.
:::
