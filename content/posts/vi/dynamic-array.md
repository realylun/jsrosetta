---
title: "Tự cài đặt dynamic array"
description: "Tự viết dynamic array từ vùng nhớ cố định bằng Node.js, Go và Rust: len, capacity, nhân đôi khi đầy, push/pop/insert/remove và độ phức tạp."
date: "2026-10-02"
order: 1200
category: data-structures
languages: [js, go, rust]
versions:
  js: "14.6"
  go: "1.23"
  rust: "1.58"
tags: [data-structure, array, capacity, amortized]
---

`Array` của Node.js, slice của Go và `Vec` của Rust đều là dynamic array: một vùng nhớ liền mạch (với `Array` là ở dạng fast elements thông thường của V8) có sẵn chỗ trống phía sau, khi hết chỗ thì cấp vùng lớn hơn rồi chép dữ liệu sang. Bài này tự dựng lại cấu trúc đó trên một vùng nhớ coi như có kích thước cố định để thấy rõ `length` (số phần tử đang dùng) và `capacity` (số ô đã cấp) khác nhau thế nào. Node.js không có mảng kích thước cố định cho giá trị bất kỳ, nên ta dùng `new Array(capacity)` và tự cam kết không gọi `push` hay đổi `length` của nó. Go dùng slice tạo bằng `make([]T, capacity)` nhưng không bao giờ `append`. Rust dùng `Box<[Option<T>]>`, với `None` đánh dấu ô chưa dùng, để không phải viết `unsafe`.

## Cấu trúc và tăng capacity

Mỗi bản giữ hai thứ: vùng nhớ `data` và số phần tử `length`. `capacity` chính là độ dài của `data`. Khi `push` vào mảng đã đầy, `grow` cấp vùng mới gấp đôi, chép các phần tử cũ sang rồi mới ghi phần tử mới.

:::tabs
```js
class DynamicArray {
  #data; // vùng nhớ cố định: chỉ đọc/ghi theo chỉ số, không push hay đổi length
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
    // capacity 0 nhân đôi vẫn là 0, nên tối thiểu là 1
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
	data   []T // vùng nhớ cố định: chỉ đọc/ghi theo chỉ số, không append
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
	// capacity 0 nhân đôi vẫn là 0, nên tối thiểu là 1
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
    data: Box<[Option<T>]>, // vùng nhớ cố định; None là ô chưa dùng
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
        // capacity 0 nhân đôi vẫn là 0, nên tối thiểu là 1
        let mut next = Self::allocate((self.capacity() * 2).max(1));
        for (slot, old) in next.iter_mut().zip(self.data.iter_mut()) {
            *slot = old.take(); // chuyển ownership sang vùng mới, không clone
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

Một lần `grow` tốn O(n) vì phải chép toàn bộ phần tử, nhưng nhờ nhân đôi, tổng số lần chép sau n lần `push` không vượt quá khoảng 2n. Chia đều ra, mỗi `push` tốn O(1) — gọi là **amortized O(1)**. Nếu mỗi lần chỉ tăng thêm một số ô cố định (ví dụ +10), tổng số lần chép sẽ là O(n²).

:::note
`Vec` thật của Rust không dùng `Option<T>` mà cấp vùng nhớ chưa khởi tạo và ghi vào bằng `unsafe` (`std::ptr::write`), nên không tốn thêm chỗ cho cờ đánh dấu. Với `Option<T>`, tuỳ `T` mà chi phí này có thể là 0 byte (nhờ niche optimization, ví dụ `Option<Box<T>>`) hoặc cả một word do alignment (`Option<i64>` chiếm 16 byte thay vì 8). Bản `Box<[Option<T>]>` ở đây đổi chút bộ nhớ lấy code an toàn, dễ đọc.
:::

## Đầy đủ: get, set, pop, insert, remove và duyệt

Bản đầy đủ thêm đọc/ghi theo chỉ số, chèn/xoá ở giữa và duyệt phần tử. `push` giờ chỉ là `insert` vào cuối, `pop` là `remove` phần tử cuối.

- `get` ngoài phạm vi trả "không có giá trị" theo cách quen thuộc của mỗi ngôn ngữ: JS trả `undefined`, Go trả thêm `bool` ("comma ok"), Rust trả `Option<&T>`.
- `set`, `insert`, `remove` với chỉ số sai là lỗi lập trình: JS ném `RangeError`, Go và Rust `panic` — giống `Vec::insert`/`Vec::remove` của Rust hay truy cập slice ngoài phạm vi của Go.
- Sau khi `remove`, ô cuối được dọn (JS gán `undefined`, Go gán zero value) để vùng nhớ không giữ tham chiếu tới phần tử đã bỏ, giúp GC thu hồi được. Rust không có GC: `take()` là bắt buộc để move giá trị ra khỏi ô, và ô tự thành `None`.

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
    this.#checkIndex(index, this.#length + 1); // cho phép index === length: chèn vào cuối
    const isFull = this.#length === this.capacity;
    if (isFull) {
      this.#grow();
    }
    // dời các phần tử từ index sang phải một ô, đi từ cuối về để không ghi đè
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
    this.#data[this.#length] = undefined; // bỏ tham chiếu để GC thu hồi được
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
	a.checkIndex(index, a.length+1) // cho phép index == length: chèn vào cuối
	isFull := a.length == len(a.data)
	if isFull {
		a.grow()
	}
	// dời các phần tử từ index sang phải một ô, đi từ cuối về để không ghi đè
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
	a.data[a.length] = zero // bỏ tham chiếu để GC thu hồi được
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
        self.check_index(index, self.len + 1); // cho phép index == len: chèn vào cuối
        let is_full = self.len == self.capacity();
        if is_full {
            self.grow();
        }
        // dời các phần tử từ index sang phải một ô, đi từ cuối về để không ghi đè
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
        self.len -= 1; // ô cuối đã là None sau take(), không cần dọn
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

`insert` và `remove` phải dời mọi phần tử phía sau sang một ô nên tốn O(n); chèn hay xoá ở cuối (`push`/`pop`) thì không phải dời gì. Duyệt phần tử dùng cơ chế iterator riêng của mỗi ngôn ngữ: generator `[Symbol.iterator]` để `[...arr]` và `for...of` dùng được, `iter.Seq[T]` để `for v := range arr.All()` và `slices.Collect` dùng được, còn Rust trả `impl Iterator<Item = &T>` từ `data[..len]`.

## Độ phức tạp

| Thao tác | Thời gian | Ghi chú |
|---|---|---|
| `get` / `set` | O(1) | truy cập trực tiếp theo chỉ số |
| `push` | O(1) amortized | O(n) ở lần phải `grow` |
| `pop` | O(1) | không thu nhỏ vùng nhớ |
| `insert` / `remove` ở giữa | O(n) | dời các phần tử phía sau |
| Duyệt toàn bộ | O(n) | |

## So với kiểu có sẵn

Kiểu có sẵn của cả ba ngôn ngữ đều theo cùng ý tưởng, chỉ khác hệ số tăng capacity. Số liệu dưới đây đo trên Node.js 24.12, Go 1.27 và Rust 1.98 (capacity của V8 xem bằng `%DebugPrint` khi chạy `node --allow-natives-syntax`); đây là chi tiết cài đặt, không phải cam kết của ngôn ngữ, nên có thể đổi ở bản sau.

| | Node.js (V8) | Go | Rust |
|---|---|---|---|
| Kiểu | `Array` | slice + `append` | `Vec<T>` |
| Xem capacity | không có API | `cap(s)` | `v.capacity()` |
| Cấp trước capacity | `new Array(n)` cấp sẵn nhưng đặt luôn `length = n` (mảng holey), không tương đương | `make([]T, 0, n)` | `Vec::with_capacity(n)` |
| Cách tăng | `n + n/2 + 16` (khoảng 1.5×) | 2× tới 256 phần tử, sau đó giảm dần về khoảng 1.25× | 2×, lần cấp đầu tối thiểu 4 ô (8 nếu phần tử 1 byte, 1 nếu phần tử lớn hơn 1 KiB) |
| Capacity khi `push` liên tục | 17 → 43 → … | 256 → 512 → 848 → 1280 (`int64`) | 256 → 512 → 1024 → 2048 (`i64`) |
| Thu nhỏ tự động | có, khi `pop`/giảm `length` làm hơn nửa vùng nhớ bị bỏ trống | không | không, gọi `shrink_to_fit()` |

:::tip
Biết trước số phần tử thì cấp sẵn capacity (`make([]T, 0, n)` trong Go, `Vec::with_capacity(n)` trong Rust) để tránh `grow` nhiều lần. Node.js không có cách cấp sẵn tương đương cho `Array` thường (`new Array(n)` đặt luôn `length = n`); nếu dữ liệu là số, `TypedArray` (như `Float64Array`) có kích thước cố định ngay từ đầu.
:::
