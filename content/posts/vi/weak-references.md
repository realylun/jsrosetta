---
title: "Tham chiếu yếu: WeakRef và FinalizationRegistry"
description: "WeakRef và FinalizationRegistry của Node.js so với weak.Pointer và runtime.AddCleanup (Go 1.24): giữ tham chiếu mà không chặn GC, dọn dẹp khi object bị thu hồi và cache tự nhả bộ nhớ."
date: "2026-10-01"
order: 230
category: types
languages: [js, go]
versions:
  js: "14.8"
  go: "1.24"
tags: [weakref, gc, memory, cache]
credits: "https://go.dev/blog/cleanups-and-weak"
---

Một tham chiếu bình thường giữ object sống: còn ai trỏ tới thì garbage collector (GC) không được thu hồi. Tham chiếu **yếu** thì không — nó cho phép đọc lại object khi object còn sống, nhưng không tính vào việc "còn ai dùng". JavaScript có `WeakRef` (đọc lại bằng `deref()`) và `FinalizationRegistry` (gọi callback sau khi object bị thu hồi) từ ES2021. Go 1.24 thêm đúng hai mảnh tương ứng: package `weak` với `weak.Pointer[T]` (đọc lại bằng `Value()`), và `runtime.AddCleanup` — bản thay thế hiện đại cho `runtime.SetFinalizer`. Cả hai bên đều không hứa *khi nào* GC chạy, nên các ví dụ dưới phải ép GC (`globalThis.gc()` / `runtime.GC()`) để output lặp lại được.

:::warning
Các ví dụ JavaScript trong bài gọi `globalThis.gc()`, hàm này chỉ có khi chạy Node với flag `--expose-gc`: `node --expose-gc weakref.mjs`. Thiếu flag thì chương trình lỗi `TypeError: globalThis.gc is not a function`. Code thật không nên gọi `gc()` — ở đây chỉ để demo cho có output xác định.
:::

## Tham chiếu yếu: WeakRef / weak.Pointer

:::tabs
```js
// chạy: node --expose-gc weakref.mjs
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

let user = { name: 'neko' }
const ref = new WeakRef(user) // không giữ user sống

console.log(ref.deref()?.name) // → neko

user = null // bỏ tham chiếu mạnh cuối cùng
await tick() // hết code đồng bộ và hàng đợi microtask: WeakRef mới được phép nhả target
globalThis.gc() // ép GC, chỉ có khi chạy với --expose-gc

console.log(ref.deref()) // → undefined
```
```go
package main

import (
	"fmt"
	"runtime"
	"weak"
)

type User struct {
	Name string
}

func main() {
	user := &User{Name: "gopher"}
	wp := weak.Make(user) // weak.Pointer[User]: không giữ user sống

	fmt.Println(wp.Value().Name) // → gopher

	user = nil   // chỉ để dễ đọc: với Go, user đã hết sống sau lần dùng cuối
	runtime.GC() // ép GC

	fmt.Println(wp.Value()) // → <nil>
}
```
:::

:::note
Vì sao JS cần `await tick()` trước `gc()`? Spec quy định: tạo `WeakRef` hoặc gọi `deref()` thành công sẽ giữ target sống **cho tới khi đoạn code đồng bộ đang chạy và cả hàng đợi microtask chạy xong**, để `deref()` gọi hai lần liền nhau không thể trả về hai kết quả khác nhau. Bỏ `await tick()` đi thì `deref()` cuối vẫn trả về `{ name: 'neko' }` dù đã `gc()`. Vì vậy `await null` (chỉ nhường một microtask) là chưa đủ — phải nhường hẳn một macrotask như `setTimeout(…, 0)`. Go không có quy tắc này: `Value()` có thể trả về `nil` ngay khi object hết được tham chiếu, kể cả giữa hai dòng code liền nhau — nên luôn kiểm tra `nil` trước khi dùng. Cũng vì vậy, các dòng `user = nil`/`a = nil`/`report = nil` bên Go chỉ để đối xứng với JS cho dễ đọc: compiler Go tính độ sống của biến tới lần dùng cuối, nên gán `nil` sau đó là một lệnh ghi thừa — object đã có thể bị thu hồi từ trước. Muốn giữ object sống qua một điểm nào đó thì dùng `runtime.KeepAlive(x)`, như sau `cb.Stop()` ở ví dụ dưới.
:::

## Dọn dẹp sau khi bị thu hồi: FinalizationRegistry / runtime.AddCleanup

:::tabs
```js
// chạy: node --expose-gc registry.mjs
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

const registry = new FinalizationRegistry((heldValue) => {
  console.log('dọn dẹp', heldValue) // nhận heldValue, KHÔNG nhận lại object đã bị thu hồi
})

let a = { id: 1 }
let b = { id: 2 }
const token = {} // dùng để huỷ đăng ký sau này
registry.register(a, 'conn#1')
registry.register(b, 'conn#2', token)

console.log(registry.unregister(token)) // → true: conn#2 sẽ không được dọn qua registry nữa

a = null
b = null
await tick()
globalThis.gc()
await tick() // callback chạy ở một task sau GC, không chạy ngay trong gc()
// → dọn dẹp conn#1
```
```go
package main

import (
	"fmt"
	"runtime"
)

type Conn struct {
	addr string
	fd   int
}

func main() {
	done := make(chan struct{})

	a := &Conn{addr: "db:5432", fd: 3}
	b := &Conn{addr: "cache:6379", fd: 4}

	// cleanup nhận arg (a.fd), không nhận lại a: nếu closure tham chiếu a thì a không bao giờ bị thu hồi
	runtime.AddCleanup(a, func(fd int) {
		fmt.Println("đóng fd", fd)
		close(done)
	}, a.fd)

	cb := runtime.AddCleanup(b, func(fd int) {
		fmt.Println("đóng fd", fd)
	}, b.fd)
	cb.Stop()            // huỷ cleanup của b, tương đương registry.unregister(token)
	runtime.KeepAlive(b) // b phải còn sống qua Stop thì Stop mới chắc chắn có tác dụng

	a = nil // chỉ để dễ đọc: a, b đã hết sống sau lần dùng cuối
	b = nil
	runtime.GC()
	<-done // cleanup chạy trên goroutine riêng, sau GC: phải chờ nó
	// → đóng fd 3
}
```
:::

Hai API có cùng một hình dạng: đăng ký `(object, giá trị đi kèm)`, và khi object bị thu hồi thì callback nhận **giá trị đi kèm** — không bao giờ nhận lại chính object, vì lúc đó nó đã không còn. Giá trị đi kèm (`heldValue` / `arg`) được giữ mạnh, nên nó tuyệt đối không được trỏ ngược lại object: `registry.register(obj, obj)` ném `TypeError`, `runtime.AddCleanup(p, f, p)` panic, còn trường hợp trỏ gián tiếp (closure của Go bắt biến `a`, hay `heldValue` là một object chứa `obj`) thì không báo lỗi gì — object cứ thế sống mãi và callback không bao giờ chạy.

:::warning
MDN nói thẳng: callback của `FinalizationRegistry` có thể **không bao giờ** được gọi — GC có thể không chạy, chương trình có thể thoát trước. Tài liệu `runtime.AddCleanup` cũng vậy: cleanup không chắc chạy, nhất là không chắc chạy trước khi chương trình thoát. Đừng đặt logic bắt buộc (ghi file, commit transaction, đóng tài nguyên quan trọng) vào đây; dùng `try/finally` ở JS và `defer`/`Close()` ở Go, coi cleanup chỉ là lưới an toàn khi người dùng quên gọi.
:::

:::note
`runtime.AddCleanup` (Go 1.24) thay cho `runtime.SetFinalizer`: finalizer nhận lại chính object nên phải "hồi sinh" nó, kéo theo mọi thứ object trỏ tới sống thêm ít nhất một chu kỳ GC, và một vòng tham chiếu có chứa object gắn finalizer không chắc được thu hồi. Cleanup chỉ nhận `arg` nên không có các vấn đề đó; nhiều cleanup gắn được vào cùng một object và có thể chạy song song với nhau. Lưu ý thêm: `Conn` ở trên có field `addr string` không chỉ để làm đẹp — một object nhỏ (khoảng 16 byte trở xuống) và không chứa con trỏ có thể bị runtime gom chung một ô nhớ với object khác, khi đó cleanup (và `weak.Pointer`) có thể không bao giờ được kích hoạt. Thử bỏ `addr` đi, chương trình trên thường sẽ kẹt mãi ở `<-done` và Go báo `fatal error: all goroutines are asleep - deadlock!`.
:::

## Ứng dụng: cache tự nhả bộ nhớ

Trường hợp dùng điển hình: cache mà value có thể bị GC thu hồi khi không còn ai khác dùng. Map giữ key bình thường nhưng giữ value qua tham chiếu yếu; khi value bị thu hồi, callback dọn dẹp xoá luôn key cũ khỏi map.

:::tabs
```js
// chạy: node --expose-gc cache.mjs
class WeakCache {
  #refs = new Map() // key → WeakRef(value): Map giữ key, không giữ value
  #registry = new FinalizationRegistry((key) => {
    // chỉ xoá nếu key vẫn trỏ tới WeakRef đã rỗng: có thể key đã được set lại value mới
    if (this.#refs.get(key)?.deref() === undefined) {
      this.#refs.delete(key)
    }
  })

  get(key) {
    return this.#refs.get(key)?.deref()
  }

  set(key, value) {
    this.#refs.set(key, new WeakRef(value))
    this.#registry.register(value, key)
  }

  get size() {
    return this.#refs.size
  }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
const cache = new WeakCache()

let report = { title: 'Q3', rows: new Array(1_000_000).fill(0) }
const logo = { title: 'logo' }
cache.set('report', report)
cache.set('logo', logo)

report = null // chỉ còn cache giữ report, mà cache giữ yếu
await tick()
globalThis.gc()

console.log(cache.get('report')) // → undefined
console.log(cache.get('logo')) // → { title: 'logo' }

await tick() // chờ callback của FinalizationRegistry xoá key 'report'
console.log(cache.size) // → 1
```
```go
package main

import (
	"fmt"
	"runtime"
	"sync"
	"weak"
)

type Cache[K comparable, V any] struct {
	mu   sync.Mutex // cleanup chạy trên goroutine khác nên phải khoá map
	refs map[K]weak.Pointer[V]
}

func NewCache[K comparable, V any]() *Cache[K, V] {
	return &Cache[K, V]{refs: make(map[K]weak.Pointer[V])}
}

func (c *Cache[K, V]) Get(key K) *V {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.refs[key].Value() // key không có: weak.Pointer zero value, Value() trả về nil
}

func (c *Cache[K, V]) Set(key K, value *V) {
	wp := weak.Make(value)

	c.mu.Lock()
	c.refs[key] = wp
	c.mu.Unlock()

	runtime.AddCleanup(value, func(key K) {
		c.mu.Lock()
		defer c.mu.Unlock()
		if c.refs[key] == wp { // chỉ xoá nếu key chưa được Set lại value mới
			delete(c.refs, key)
		}
	}, key)
}

func (c *Cache[K, V]) Len() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return len(c.refs)
}

type Doc struct {
	Title string
	Rows  []int
}

func main() {
	cache := NewCache[string, Doc]()

	report := &Doc{Title: "Q3", Rows: make([]int, 1_000_000)}
	logo := &Doc{Title: "logo"}
	cache.Set("report", report)
	cache.Set("logo", logo)

	report = nil // chỉ để dễ đọc: report đã hết sống sau cache.Set; chỉ còn cache giữ yếu
	runtime.GC()

	fmt.Println(cache.Get("report")) // → <nil>
	fmt.Println(cache.Get("logo"))   // → &{logo []}

	for cache.Len() > 1 { // chờ cleanup xoá key "report" (chạy trên goroutine riêng)
		runtime.Gosched()
	}
	fmt.Println(cache.Len()) // → 1

	runtime.KeepAlive(logo) // giữ logo sống tới đây
}
```
:::

:::note
Có hai chi tiết giống hệt nhau ở hai bên. Một: callback chỉ xoá key nếu entry hiện tại vẫn là tham chiếu yếu cũ (`deref() === undefined` ở JS, `c.refs[key] == wp` ở Go) — vì giữa lúc value cũ bị thu hồi và lúc callback chạy, key có thể đã được `set` một value mới. `weak.Pointer` so sánh được bằng `==`, và hai weak pointer tạo từ cùng một con trỏ luôn bằng nhau kể cả sau khi object đã bị thu hồi. Hai: closure của cleanup trong Go bắt `wp` (con trỏ yếu) và `c`, không bắt `value`, nên không giữ value sống. Phía Go còn cần mutex vì cleanup chạy trên goroutine riêng; callback của `FinalizationRegistry` chạy trên chính event loop nên không cần khoá. Vòng `for cache.Len() > 1` chỉ để demo có output xác định — code thật không cần chờ cleanup.
:::

:::tip
`WeakMap` (ES2015) là chiều ngược lại: **key** yếu, value mạnh — dùng để gắn dữ liệu phụ vào một object mà không giữ object đó sống (`meta.set(obj, …)`), và không duyệt được, không có `size`. Go không có kiểu tương đương dựng sẵn; có thể ghép `map[weak.Pointer[K]]V` với `runtime.AddCleanup` trên key để xoá entry, nhưng phải cẩn thận để value không trỏ ngược về key — nếu không key sẽ không bao giờ bị thu hồi. Nếu mục đích là "intern" giá trị (mỗi giá trị bằng nhau chỉ giữ một bản), Go 1.23 đã có sẵn package `unique`.
:::

:::note
`WeakRef` và `FinalizationRegistry` chạy không cần flag từ Node.js 14.6 (V8 8.4); bài này đặt sàn 14.8 vì các ví dụ dùng `await` ở top-level của ES module. Package `weak` và `runtime.AddCleanup` đều có từ Go 1.24, nên cần toolchain Go 1.24 trở lên. Nếu dòng `go` trong `go.mod` khai bản thấp hơn, `go build` vẫn chạy được, nhưng `go vet` (bộ kiểm tra `stdversion`) sẽ cảnh báo, ví dụ `weak.Make requires go1.24 or later` — nên khai `go 1.24` trở lên cho đúng.
:::
