---
title: "Generators"
description: "Generator functions and iterator helpers in Node.js compared to Iterator (Rust), AsyncStream (Swift), virtual threads (Java), and `iter.Seq`/channels in Go."
tags: [generator, yield, iterator, channel, virtual-thread]
---

Node.js has generator functions (`function*` / `yield`) built in: calling the function runs nothing at all, and each call to `.next()` runs up to the next `yield`. None of the other languages here have a real `yield`. Rust doesn't need much faking: `Iterator` is already "pull"-based via `.next()`, so `std::iter::from_fn` — a closure that holds state and returns `Option<T>` — is almost a hand-written generator. Swift uses `AsyncStream`, the only one of the five languages with an API literally named `yield()`. Java has nothing built in, but since version 21 it has virtual threads: run the generator body on a virtual thread and synchronize through a `SynchronousQueue` to simulate a blocking `yield`. Go has no generator syntax, but since 1.23 it has `iter.Seq` — a "range-over-func" type that lets you range directly over a function, just like ranging over a slice or map. Before that (and still valid today), the classic approach was a channel.

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
```rust
// Rust's Iterator is already "pull"-based: from_fn takes a closure that
// holds its own state and returns Option<T> each call — the closest
// thing to a hand-written generator.
fn generator() -> impl Iterator<Item = &'static str> {
    let mut state = 0;
    std::iter::from_fn(move || {
        state += 1;
        match state {
            1 => Some("hello"),
            2 => Some("world"),
            _ => None,
        }
    })
}
```
```swift
// AsyncStream: the closure calls yield() for each value, finish() when
// done — the closest thing to a real `yield` among these five languages.
func generator() -> AsyncStream<String> {
    AsyncStream { continuation in
        continuation.yield("hello")
        continuation.yield("world")
        continuation.finish()
    }
}
```
```java
// Runs the generator body on a virtual thread (JEP 444, Java 21); each
// call to next() blocks until the other thread hands off the next value
// through a SynchronousQueue — simulating a blocking `yield`.
static class Generator implements Iterable<String>, Iterator<String> {
    private static final Object DONE = new Object();
    private final SynchronousQueue<Object> queue = new SynchronousQueue<>();
    private Object peeked;

    Generator() {
        Thread.ofVirtual().start(() -> {
            send("hello");
            send("world");
            send(DONE);
        });
    }

    private void send(Object value) {
        try {
            queue.put(value);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @Override
    public boolean hasNext() {
        if (peeked == null) {
            try {
                peeked = queue.take();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return peeked != DONE;
    }

    @Override
    public String next() {
        if (!hasNext()) throw new NoSuchElementException();
        String value = (String) peeked;
        peeked = null;
        return value;
    }

    @Override
    public Iterator<String> iterator() {
        return this;
    }
}
```
:::

:::note
Go 1.23 added `iter.Seq` and range-over-func, which replace the older hand-rolled "next" closure (`func() (string, bool)`) as the idiomatic way to write a generator; you now range directly over the `iter.Seq` like any other sequence. Rust's `std::iter::from_fn` has been stable since 1.34 — well before Go's `iter.Seq`. Java's virtual threads (JEP 444) only stabilized in version 21; cheap virtual threads (no real OS thread per generator) are what make this "block on a dedicated thread" approach practical — before Java 21 each generator would have cost a whole platform thread.
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
func main() {
	// iter.Pull converts a push-style iter.Seq into a pull-style next/stop
	// pair — the closest equivalent to calling gen.next() by hand.
	next, stop := iter.Pull(Generator())
	defer stop() // always call stop, even if the sequence already ran to completion

	for {
		v, ok := next()
		if !ok {
			break
		}
		fmt.Println(v)
	}
	// hello
	// world
}
```
```rust
fn main() {
    // Iterator is already pull-based: call .next() directly, no
    // conversion needed (unlike Go, which needs iter.Pull for a next/stop pair).
    let mut gen = generator();

    loop {
        match gen.next() {
            Some(value) => println!("{value}"),
            None => break, // None plays the role of done: true
        }
    }
    // hello
    // world
}
```
```swift
// makeAsyncIterator() gets a manual iterator; next() returns nil when
// done — playing the role of done: true.
var iterator = generator().makeAsyncIterator()

while let value = await iterator.next() {
    print(value)
}
// hello
// world
```
```java
void main() {
    // Java's standard hasNext()/next() pair: hasNext() blocks until the
    // next value is ready or the generator signals it's done.
    Generator gen = new Generator();

    while (gen.hasNext()) {
        IO.println(gen.next());
    }
    // hello
    // world
}
```
:::

:::note
Rust's `Iterator` is pull-based from the start, so calling `.next()` directly just works — no conversion step like Go's `iter.Pull`. Swift's `AsyncIterator.next()` and Java's `Iterator.hasNext()`/`next()` also pull directly; the difference is Swift returns `nil` while Java splits it into a separate `hasNext()` check before reading the value.
:::

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
	for value := range Generator() {
		fmt.Println(value)
	}
	// hello
	// world

	// alternatively, the classic channel-based generator
	for value := range channelGenerator() {
		fmt.Println(value)
	}
	// hello
	// world
}
```
```rust
fn main() {
    for value in generator() {
        println!("{value}");
    }
    // hello
    // world

    // Iterator has had .map()/.filter()/... since 1.0 — long before the
    // iterator helpers in JS (Node 22) or Go (1.23).
    for value in generator().map(|w| w.to_uppercase()) {
        println!("{value}");
    }
    // HELLO
    // WORLD
}
```
```swift
for await value in generator() {
    print(value)
}
// hello
// world

// AsyncStream conforms to AsyncSequence, so it has .map() just like a
// regular Sequence
for await value in generator().map({ $0.uppercased() }) {
    print(value)
}
// HELLO
// WORLD
```
```java
void main() {
    for (String value : new Generator()) {
        IO.println(value);
    }
    // hello
    // world

    // Java's Iterator/Iterable has no built-in .map(): convert to a
    // Stream first to transform it.
    StreamSupport.stream(new Generator().spliterator(), false)
            .map(String::toUpperCase)
            .forEach(IO::println);
    // HELLO
    // WORLD
}
```
:::

Channels are still a valid way to model a generator across goroutines — they predate Go 1.23 and aren't fully replaced by `iter.Seq`. Go also has no built-in iterator-helper chain (`.map()`, `.filter()`, …); you'd transform values inline in the loop body instead. Rust and Swift do: `Iterator`/`AsyncSequence` both have `.map()` built in and have for a long time. Java is like Go here — a plain `Iterator` has no `.map()`, so you convert to a `Stream` first.

:::note
Node.js 22 added iterator helpers (`Iterator.prototype.map`, `.filter`, `.take`, …), letting you transform a generator's results directly, without first spreading it into an array. Rust has had these adaptors on `Iterator` since 1.0 — many years before JS or Go. Swift's `AsyncSequence` has had `.map()`/`.filter()` since 5.5, the same release that introduced `AsyncStream`.
:::
