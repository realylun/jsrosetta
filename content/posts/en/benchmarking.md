---
title: "Benchmarking"
description: "Node.js's tinybench compared to Go's testing.B + b.Loop() for measuring function performance."
tags: [benchmark, performance, testing]
---

Go has had built-in benchmarking in its `testing` package for a long time. Node.js has no integrated benchmark runner, so the example below uses `tinybench` — a small, dependency-free library with the same "add tasks to a suite, then run" idea.

## Comparing recursion and a loop (Fibonacci)

:::tabs
```js
import { Bench } from "tinybench";

const bench = new Bench({ name: "fib" });

bench
  .add("fib#recursion", () => {
    fibRec(10);
  })
  .add("fib#loop", () => {
    fibLoop(10);
  });

await bench.run();

console.log(bench.name);
console.table(bench.table());

function fibRec(n) {
  if (n <= 1) return n;
  return fibRec(n - 1) + fibRec(n - 2);
}

function fibLoop(n) {
  let f = [0, 1];
  for (let i = 2; i <= n; i++) {
    f[i] = f[i - 1] + f[i - 2];
  }
  return f[n];
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
:::

```bash
$ node examples/benchmark_test.js
fib#recursion   430.90 ns/op (avg)
fib#loop         48.94 ns/op (avg)
```
```bash
$ go test -bench=. examples/benchmark_test.go
BenchmarkFibRec-12     181.4 ns/op
BenchmarkFibLoop-12     25.75 ns/op
```

:::note
**Changed:** the `benchmark` npm package (unmaintained since 2016) → `tinybench`, a small, dependency-free benchmarking library with the same "add tasks to a suite, then run" shape. tinybench 6 requires Node.js ≥ 20.
:::

:::note
**Changed (Go 1.24):** `for b.Loop() { ... }` replaces `for i := 0; i < b.N; i++ { ... }`. `b.Loop()` resets the timer after setup, keeps loop variables live so the compiler can't optimize the body away, and runs the benchmark function body only once per measurement instead of relooping it manually.
:::
