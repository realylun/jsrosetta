---
title: "Weak References: WeakRef and FinalizationRegistry"
description: "How Node.js's WeakRef and FinalizationRegistry compare to Go 1.24's weak.Pointer and runtime.AddCleanup: holding a reference without blocking GC, cleaning up after an object is reclaimed, and a cache that releases memory on its own."
tags: [weakref, gc, memory, cache]
---

A normal reference keeps an object alive: as long as something points to it, the garbage collector (GC) can't reclaim it. A **weak** reference doesn't — it lets you get the object back while it's still alive, but it doesn't count toward "someone is still using this". JavaScript has had `WeakRef` (read back with `deref()`) and `FinalizationRegistry` (a callback run after an object is reclaimed) since ES2021. Go 1.24 added the two matching pieces: the `weak` package with `weak.Pointer[T]` (read back with `Value()`), and `runtime.AddCleanup` — the modern replacement for `runtime.SetFinalizer`. Neither side promises *when* the GC runs, so the examples below force a collection (`globalThis.gc()` / `runtime.GC()`) to keep their output repeatable.

:::warning
The JavaScript examples in this post call `globalThis.gc()`, which only exists when Node runs with the `--expose-gc` flag: `node --expose-gc weakref.mjs`. Without the flag the program fails with `TypeError: globalThis.gc is not a function`. Real code shouldn't call `gc()` — it's here only so the demo has deterministic output.
:::

## Weak references: WeakRef / weak.Pointer

:::tabs
```js
// run: node --expose-gc weakref.mjs
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

let user = { name: 'neko' }
const ref = new WeakRef(user) // doesn't keep user alive

console.log(ref.deref()?.name) // → neko

user = null // drop the last strong reference
await tick() // let the sync code and the microtask queue finish: only now may the WeakRef let go of its target
globalThis.gc() // force a GC, only available with --expose-gc

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
	wp := weak.Make(user) // weak.Pointer[User]: doesn't keep user alive

	fmt.Println(wp.Value().Name) // → gopher

	user = nil   // only for readability: in Go, user is already dead after its last use
	runtime.GC() // force a GC

	fmt.Println(wp.Value()) // → <nil>
}
```
:::

:::note
Why does JS need `await tick()` before `gc()`? The spec says that creating a `WeakRef` or successfully calling `deref()` keeps the target alive **until the currently running synchronous code and the whole microtask queue have finished**, so two back-to-back `deref()` calls can never return different results. Drop the `await tick()` and the final `deref()` still returns `{ name: 'neko' }` even after `gc()`. That's why `await null` (yielding just one microtask) isn't enough — you have to yield a macrotask, e.g. with `setTimeout(…, 0)`. Go has no such rule: `Value()` may return `nil` as soon as the object is no longer referenced, even between two adjacent lines of code — so always check for `nil` before using it. For the same reason, the `user = nil`/`a = nil`/`report = nil` lines on the Go side are only there to mirror the JS for readability: the Go compiler ends a variable's liveness at its last use, so assigning `nil` afterwards is a dead store — the object may already have been collectable before it. To keep an object alive past a certain point, use `runtime.KeepAlive(x)`, as after `cb.Stop()` in the next example.
:::

## Cleaning up after reclamation: FinalizationRegistry / runtime.AddCleanup

:::tabs
```js
// run: node --expose-gc registry.mjs
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

const registry = new FinalizationRegistry((heldValue) => {
  console.log('cleaning up', heldValue) // receives heldValue, NOT the reclaimed object
})

let a = { id: 1 }
let b = { id: 2 }
const token = {} // used to unregister later
registry.register(a, 'conn#1')
registry.register(b, 'conn#2', token)

console.log(registry.unregister(token)) // → true: conn#2 will no longer be cleaned up via the registry

a = null
b = null
await tick()
globalThis.gc()
await tick() // the callback runs in a later task after GC, not inside gc() itself
// → cleaning up conn#1
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

	// the cleanup receives arg (a.fd), not a itself: if the closure referenced a, a would never be reclaimed
	runtime.AddCleanup(a, func(fd int) {
		fmt.Println("closing fd", fd)
		close(done)
	}, a.fd)

	cb := runtime.AddCleanup(b, func(fd int) {
		fmt.Println("closing fd", fd)
	}, b.fd)
	cb.Stop()            // cancel b's cleanup, the equivalent of registry.unregister(token)
	runtime.KeepAlive(b) // b must stay reachable across Stop for Stop to be guaranteed to work

	a = nil // only for readability: a and b are already dead after their last use
	b = nil
	runtime.GC()
	<-done // the cleanup runs on its own goroutine, after GC: we have to wait for it
	// → closing fd 3
}
```
:::

Both APIs have the same shape: you register `(object, accompanying value)`, and when the object is reclaimed the callback receives the **accompanying value** — never the object itself, since by then it's gone. The accompanying value (`heldValue` / `arg`) is held strongly, so it must never point back to the object: `registry.register(obj, obj)` throws a `TypeError`, `runtime.AddCleanup(p, f, p)` panics, while an indirect reference (a Go closure capturing `a`, or a `heldValue` that's an object containing `obj`) raises no error at all — the object simply lives forever and the callback never runs.

:::warning
MDN puts it bluntly: a `FinalizationRegistry` callback may **never** be called — the GC might not run, the program might exit first. The `runtime.AddCleanup` docs say the same: a cleanup isn't guaranteed to run, in particular not before the program exits. Don't put essential logic here (writing a file, committing a transaction, releasing an important resource); use `try/finally` in JS and `defer`/`Close()` in Go, and treat cleanups only as a safety net for when the caller forgets.
:::

:::note
`runtime.AddCleanup` (Go 1.24) replaces `runtime.SetFinalizer`: a finalizer receives the object itself, so it has to "resurrect" it, keeping everything the object points to alive for at least one more GC cycle, and a reference cycle containing an object with a finalizer isn't guaranteed to be collected. A cleanup only receives `arg`, so it has none of those problems; several cleanups can be attached to the same object and they may run concurrently with each other. One more caveat: the `addr string` field in `Conn` above isn't decoration — a small (around 16 bytes or less), pointer-free object may be batched into the same allocation slot as other objects by the runtime, in which case its cleanup (and its `weak.Pointer`) may never fire. Remove `addr` and the program above will usually get stuck at `<-done`, with Go reporting `fatal error: all goroutines are asleep - deadlock!`.
:::

## In practice: a cache that releases memory on its own

The typical use case: a cache whose values can be reclaimed by the GC once nobody else is using them. The map holds keys normally but holds values through a weak reference; when a value is reclaimed, the cleanup callback also removes its stale key from the map.

:::tabs
```js
// run: node --expose-gc cache.mjs
class WeakCache {
  #refs = new Map() // key → WeakRef(value): the Map holds the key, not the value
  #registry = new FinalizationRegistry((key) => {
    // only delete if the key still points to an emptied WeakRef: it may have been set to a new value since
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

report = null // only the cache holds report now, and it holds it weakly
await tick()
globalThis.gc()

console.log(cache.get('report')) // → undefined
console.log(cache.get('logo')) // → { title: 'logo' }

await tick() // wait for the FinalizationRegistry callback to delete the 'report' key
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
	mu   sync.Mutex // cleanups run on another goroutine, so the map needs a lock
	refs map[K]weak.Pointer[V]
}

func NewCache[K comparable, V any]() *Cache[K, V] {
	return &Cache[K, V]{refs: make(map[K]weak.Pointer[V])}
}

func (c *Cache[K, V]) Get(key K) *V {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.refs[key].Value() // missing key: zero-value weak.Pointer, Value() returns nil
}

func (c *Cache[K, V]) Set(key K, value *V) {
	wp := weak.Make(value)

	c.mu.Lock()
	c.refs[key] = wp
	c.mu.Unlock()

	runtime.AddCleanup(value, func(key K) {
		c.mu.Lock()
		defer c.mu.Unlock()
		if c.refs[key] == wp { // only delete if the key hasn't been Set to a new value since
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

	report = nil // only for readability: report is already dead after cache.Set; only the cache holds it, weakly
	runtime.GC()

	fmt.Println(cache.Get("report")) // → <nil>
	fmt.Println(cache.Get("logo"))   // → &{logo []}

	for cache.Len() > 1 { // wait for the cleanup to delete the "report" key (it runs on its own goroutine)
		runtime.Gosched()
	}
	fmt.Println(cache.Len()) // → 1

	runtime.KeepAlive(logo) // keep logo alive until here
}
```
:::

:::note
Two details are identical on both sides. First: the callback only deletes the key if the current entry is still the old weak reference (`deref() === undefined` in JS, `c.refs[key] == wp` in Go) — because between the old value being reclaimed and the callback running, the key may have been `set` to a new value. `weak.Pointer` is comparable with `==`, and two weak pointers made from the same pointer always compare equal, even after the object has been reclaimed. Second: the Go cleanup closure captures `wp` (the weak pointer) and `c`, not `value`, so it doesn't keep the value alive. Go also needs a mutex because cleanups run on their own goroutine; a `FinalizationRegistry` callback runs on the event loop itself, so no lock is needed. The `for cache.Len() > 1` loop is only there to give the demo deterministic output — real code doesn't need to wait for cleanups.
:::

:::tip
`WeakMap` (ES2015) is the other way around: weak **keys**, strong values — used to attach side data to an object without keeping that object alive (`meta.set(obj, …)`), and it can't be iterated and has no `size`. Go has no built-in equivalent; you can combine a `map[weak.Pointer[K]]V` with a `runtime.AddCleanup` on the key to remove entries, but be careful that the value never points back to the key — otherwise the key will never be reclaimed. If the goal is interning values (keeping a single copy of each equal value), Go 1.23 already ships the `unique` package.
:::

:::note
`WeakRef` and `FinalizationRegistry` work without a flag since Node.js 14.6 (V8 8.4); this post's floor is 14.8 because the examples use top-level `await` in an ES module. The `weak` package and `runtime.AddCleanup` both arrived in Go 1.24, so you need a Go 1.24 or later toolchain. If the `go` line in `go.mod` declares an older version, `go build` still works, but `go vet` (its `stdversion` check) warns, e.g. `weak.Make requires go1.24 or later` — so declare `go 1.24` or later to be correct.
:::
