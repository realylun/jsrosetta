---
title: "Benchmarking"
description: "Node.js's tinybench compared to Go's testing.B, Rust's criterion, Swift's ContinuousClock, and Java's JMH for measuring function performance."
tags: [benchmark, performance, testing]
---

Go has had built-in benchmarking in its `testing` package for a long time. Node.js has no integrated benchmark runner, so the example below uses `tinybench` — a small, dependency-free library with the same "add tasks to a suite, then run" idea. Rust has no stable benchmarking in std either (it only exists on the nightly channel), so it uses the `criterion` crate — which needs its own `benches/` directory declared in `Cargo.toml`, not something that runs as a single file. Swift has no standard benchmarking library at all; the example below measures things itself with std's `ContinuousClock` — simple, but **without** the warm-up/statistics the other three languages get (see the note below). Java uses JMH (Java Microbenchmark Harness), the standard tool in the Java ecosystem for avoiding the measurement pitfalls JIT compilation causes.

## Comparing recursion and a loop (Fibonacci)

:::tabs
```js
import { Bench } from 'tinybench'

const bench = new Bench({ name: 'fib' })

bench
  .add('fib#recursion', () => {
    fibRec(10)
  })
  .add('fib#loop', () => {
    fibLoop(10)
  })

await bench.run()

console.log(bench.name)
console.table(bench.table())

function fibRec(n) {
  if (n <= 1) {
    return n
  }

  return fibRec(n-1) + fibRec(n-2)
}

function fibLoop(n) {
  let f = [0, 1]
  for (let i = 2; i <= n; i++) {
    f[i] = f[i-1] + f[i-2]
  }
  return f[n]
}
```
```go
package example

import "testing"

func BenchmarkFibRec(b *testing.B) {
	for b.Loop() { // Go 1.24+: replaces for i := 0; i < b.N; i++
		fibRec(10)
	}
}

func BenchmarkFibLoop(b *testing.B) {
	for b.Loop() {
		fibLoop(10)
	}
}

func fibRec(n int) int {
	if n <= 1 {
		return n
	}
	return fibRec(n-1) + fibRec(n-2)
}

func fibLoop(n int) int {
	f := make([]int, n+1, n+2)
	if n < 2 {
		f = f[0:2]
	}
	f[0] = 0
	f[1] = 1
	for i := 2; i <= n; i++ {
		f[i] = f[i-1] + f[i-2]
	}
	return f[n]
}
```
```rust
// Cargo.toml: [dev-dependencies] criterion = "0.8"
// Cargo.toml: also needs a [[bench]] block: name = "fib", harness = false

// src/lib.rs
pub fn fib_rec(n: u64) -> u64 {
    if n <= 1 {
        n
    } else {
        fib_rec(n - 1) + fib_rec(n - 2)
    }
}

pub fn fib_loop(n: u64) -> u64 {
    let mut f = vec![0u64; n as usize + 1];
    if n >= 1 {
        f[1] = 1;
    }
    for i in 2..=n as usize {
        f[i] = f[i - 1] + f[i - 2];
    }
    f[n as usize]
}

// benches/fib.rs
use std::hint::black_box;

use criterion::{criterion_group, criterion_main, Criterion};
use example::{fib_loop, fib_rec};

fn benchmark(c: &mut Criterion) {
    c.bench_function("fib#recursion", |b| b.iter(|| fib_rec(black_box(10))));
    c.bench_function("fib#loop", |b| b.iter(|| fib_loop(black_box(10))));
}

criterion_group!(benches, benchmark);
criterion_main!(benches);
```
```swift
import Foundation

func fibRec(_ n: Int) -> Int {
    n <= 1 ? n : fibRec(n - 1) + fibRec(n - 2)
}

func fibLoop(_ n: Int) -> Int {
    var f = [0, 1]
    for i in 2...n {
        f.append(f[i - 1] + f[i - 2])
    }
    return f[n]
}

func measure(_ label: String, iterations: Int = 1_000_000, _ body: () -> Void) {
    let elapsed = ContinuousClock().measure {
        for _ in 0..<iterations { body() }
    }
    let perOp = elapsed / iterations
    print("\(label)\t\(perOp.formatted(.units(allowed: [.nanoseconds], width: .narrow)))/op")
}

measure("fib#recursion") { _ = fibRec(10) }
measure("fib#loop") { _ = fibLoop(10) }
```
```java
package bench;

import java.util.concurrent.TimeUnit;

import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.BenchmarkMode;
import org.openjdk.jmh.annotations.Mode;
import org.openjdk.jmh.annotations.OutputTimeUnit;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.State;

// Maven: org.openjdk.jmh:jmh-core:1.37 (+ jmh-generator-annprocess:1.37 as the annotation processor)
@State(Scope.Thread)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
public class FibBenchmark {
    int n = 10; // a field instead of a literal, so the JIT can't constant-fold the whole measurement away

    @Benchmark
    public int fibRec() {
        return fibRec(n);
    }

    @Benchmark
    public int fibLoop() {
        return fibLoop(n);
    }

    static int fibRec(int n) {
        return n <= 1 ? n : fibRec(n - 1) + fibRec(n - 2);
    }

    static int fibLoop(int n) {
        int[] f = new int[n + 1];
        f[1] = 1;
        for (int i = 2; i <= n; i++) {
            f[i] = f[i - 1] + f[i - 2];
        }
        return f[n];
    }
}
```
:::

```bash
$ node examples/benchmark_test.js
# condensed from console.table(); ns/op numbers vary between runs
fib
fib#recursion   413.13 ns/op (avg)
fib#loop         44.75 ns/op (avg)
```
```bash
$ go test -bench=. -benchmem examples/benchmark_test.go
# trimmed goos/goarch/cpu header; ns/op and allocs vary between runs
BenchmarkFibRec-12       6266443   171.4 ns/op    0 B/op   0 allocs/op
BenchmarkFibLoop-12     56055340    20.10 ns/op   96 B/op  1 allocs/op
PASS
ok  	command-line-arguments	2.701s
```
```bash
$ cargo bench
# trimmed warm-up/outliers/throughput; numbers vary between runs
fib#recursion           time:   [142.51 ns 142.75 ns 142.99 ns]
fib#loop                time:   [24.489 ns 24.530 ns 24.565 ns]
```
```bash
$ swiftc -O main.swift -o main && ./main
fib#recursion   221ns/op
fib#loop        133ns/op
```
```bash
$ mvn clean install && java -jar target/benchmarks.jar FibBenchmark
# trimmed warm-up/Blackhole warning; Score/Error vary between runs
Benchmark             Mode  Cnt    Score   Error  Units
FibBenchmark.fibLoop  avgt    3    9.271 ± 0.343  ns/op
FibBenchmark.fibRec   avgt    3  133.513 ± 1.932  ns/op
```

:::note
**Changed:** the `benchmark` npm package (unmaintained since 2016) → `tinybench`, a small, dependency-free benchmarking library with the same "add tasks to a suite, then run" shape. tinybench 6 requires Node.js ≥ 20.
:::

:::note
**Changed (Go 1.24):** `for b.Loop() { ... }` replaces `for i := 0; i < b.N; i++ { ... }`. `b.Loop()` resets the timer after setup, keeps loop variables live so the compiler can't optimize the body away, and runs the benchmark function body only once per measurement instead of relooping it manually.
:::

:::note
Stable Rust has no built-in benchmarking — `#[bench]` only exists on the nightly channel. `criterion` is the most popular benchmarking crate: it measures a warm-up period, computes statistical confidence intervals itself, and `std::hint::black_box` stops the compiler from optimizing the call away (the same purpose as Go's `b.Loop()` "keeping loop variables live").
:::

:::note
The Swift example above is **not a statistical benchmark** — no warm-up, no variance/outlier measurement like criterion, testing.B, or tinybench, just a plain average. For a more rigorous benchmark, use the [package-benchmark](https://github.com/ordo-one/package-benchmark) package (or the older, less actively maintained [swift-benchmark](https://github.com/google/swift-benchmark)) — both need their own SwiftPM package and don't run as a standalone script.
:::

:::note
JMH is the standard benchmarking tool in the Java ecosystem because JIT compilation makes hand-rolled timing (e.g. `System.nanoTime()`) easy to get wrong (dead-code elimination, an unwarmed JIT, …) — the example above has to put `n` in an `@State` field instead of a literal `10`, otherwise the JIT constant-folds the entire `fibLoop` call and reports a result near zero. JMH generates code through an annotation processor (`jmh-generator-annprocess`) at compile time, so it can't run as a single Java file — the standard way is to scaffold a project with the Maven archetype `jmh-java-benchmark-archetype`, run `mvn clean install`, then execute the generated `target/benchmarks.jar`.
:::
