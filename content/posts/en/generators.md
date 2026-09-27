---
title: "Generators"
description: "Generator functions and iterator helpers in Node.js compared to `iter.Seq` (range-over-func) and channels in Go."
tags: [generator, yield, iterator, channel]
---

Node.js has generator functions (`function*` / `yield`) built in: calling the function runs nothing at all, and each call to `.next()` runs up to the next `yield`. Go has no generator syntax, but since 1.23 it has `iter.Seq` — a "range-over-func" type that lets you range directly over a function, just like ranging over a slice or map. Before that (and still valid today), the classic approach was a channel.

## Defining a generator

:::tabs
```js
function* generator() {
  yield 'hello';
  yield 'world';
}
```
```go
package main

import (
	"fmt"
	"iter"
)

// Generator returns an iter.Seq, Go's standard "range-over-func" sequence
// type. Callers range over it directly.
func Generator() iter.Seq[string] {
	return func(yield func(string) bool) {
		for _, v := range []string{"hello", "world"} {
			if !yield(v) {
				return
			}
		}
	}
}
```
:::

:::note
**Changed:** Go 1.23 — `iter.Seq` and range-over-func replace the older hand-rolled "next" closure (`func() (string, bool)`) as the idiomatic way to write a generator; you now range directly over the `iter.Seq` like any other sequence.
:::

## Pulling values manually (`next()` / `done`)

:::tabs
```js
const gen = generator();

while (true) {
  const { value, done } = gen.next();
  console.log(value, done);

  if (done) {
    break;
  }
}
// hello false
// world false
// undefined true
```
```go
// channelGenerator models a generator as a goroutine sending values on a
// channel, closed when it's done — the classic way to pull one value at a time.
func channelGenerator() chan string {
	c := make(chan string)

	go func() {
		defer close(c)
		c <- "hello"
		c <- "world"
	}()

	return c
}

func main() {
	for value := range channelGenerator() {
		fmt.Println(value)
	}
	// hello
	// world
}
```
:::

Channels are still a valid way to model a generator across goroutines — they predate Go 1.23 and aren't fully replaced by `iter.Seq`.

## Iterating with for...of / iterator helpers

:::tabs
```js
for (const value of generator()) {
  console.log(value);
}
// hello
// world

// generator objects are iterators, so iterator helpers can transform them
// directly, without spreading into an array first
for (const value of generator().map((word) => word.toUpperCase())) {
  console.log(value);
}
// HELLO
// WORLD
```
```go
func main() {
	for value := range Generator() {
		fmt.Println(value)
	}
	// hello
	// world

	// Go has no built-in iterator-helper chain — transform inline in the loop body
	for value := range Generator() {
		fmt.Println(strings.ToUpper(value))
	}
	// HELLO
	// WORLD
}
```
:::

:::note
**Changed:** Node.js 22 — Iterator helpers (`Iterator.prototype.map`, `.filter`, `.take`, …) let you transform a generator's results directly, without first spreading it into an array.
:::
