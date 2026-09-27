---
title: "Benchmark"
description: "tinybench của Node.js so với testing.B (Go), criterion (Rust), ContinuousClock (Swift) và JMH (Java) để đo hiệu năng hàm."
date: "2026-09-27"
order: 1090
category: stdlib
languages: [js, go, rust, swift, java]
versions:
  js: "20"
  go: "1.24"
  rust: "1.86"
  swift: "5.7"
  java: "11"
tags: [benchmark, performance, testing]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#benchmarking"
---

Go có benchmark built-in trong package `testing` từ rất sớm. Node.js không có benchmark runner tích hợp, nên ví dụ dưới dùng thư viện `tinybench` — nhỏ gọn, không dependency, cùng ý tưởng "thêm task vào suite rồi chạy". Rust cũng không có benchmark ổn định trong std (chỉ có trên nightly), nên dùng crate `criterion` — đòi hỏi một thư mục `benches/` riêng khai trong `Cargo.toml`, không chạy như một file đơn lẻ được. Swift không có thư viện benchmark chuẩn nào; ví dụ dưới tự đo bằng `ContinuousClock` của std — đơn giản nhưng **không** có warm-up/thống kê như ba ngôn ngữ kia (xem ghi chú). Java dùng JMH (Java Microbenchmark Harness), công cụ tiêu chuẩn trong hệ sinh thái Java để tránh các bẫy đo lường của JIT.

## So sánh đệ quy và vòng lặp (Fibonacci)

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
	for b.Loop() { // Go 1.24+: thay cho for i := 0; i < b.N; i++
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
// Cargo.toml: cần thêm khối [[bench]] name = "fib", harness = false

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

// Maven: org.openjdk.jmh:jmh-core:1.37 (+ jmh-generator-annprocess:1.37 làm annotation processor)
@State(Scope.Thread)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
public class FibBenchmark {
    int n = 10; // field thay vì literal, tránh JIT tính sẵn (constant-fold) mất cả phép đo

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
# rút gọn từ console.table(); số ns/op thay đổi giữa các lần chạy
fib
fib#recursion   413.13 ns/op (avg)
fib#loop         44.75 ns/op (avg)
```
```bash
$ go test -bench=. -benchmem examples/benchmark_test.go
# đã bỏ phần header goos/goarch/cpu; ns/op và allocs thay đổi giữa các lần chạy
BenchmarkFibRec-12       6266443   171.4 ns/op    0 B/op   0 allocs/op
BenchmarkFibLoop-12     56055340    20.10 ns/op   96 B/op  1 allocs/op
PASS
ok  	command-line-arguments	2.701s
```
```bash
$ cargo bench
# đã bỏ phần warm-up/outliers/goodput; số liệu thay đổi giữa các lần chạy
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
# đã bỏ phần warm-up/cảnh báo Blackhole; Score/Error thay đổi giữa các lần chạy
Benchmark             Mode  Cnt    Score   Error  Units
FibBenchmark.fibLoop  avgt    3    9.271 ± 0.343  ns/op
FibBenchmark.fibRec   avgt    3  133.513 ± 1.932  ns/op
```

:::note
**Thay đổi:** package `benchmark` của npm (không còn bảo trì từ 2016) → `tinybench`, thư viện benchmark nhỏ gọn, không dependency, cùng mô hình "thêm task vào suite rồi chạy". tinybench 6 yêu cầu Node.js ≥ 20.
:::

:::note
**Thay đổi (Go 1.24):** `for b.Loop() { ... }` thay cho `for i := 0; i < b.N; i++ { ... }`. `b.Loop()` reset timer sau phần setup, giữ biến vòng lặp "sống" để compiler không tối ưu mất phần thân, và chỉ chạy thân hàm benchmark một lần cho mỗi lần đo thay vì tự lặp lại thủ công.
:::

:::note
Rust ổn định (stable) không có benchmark built-in — `#[bench]` chỉ tồn tại trên kênh nightly. `criterion` là crate benchmark phổ biến nhất: nó đo warm-up, tự tính khoảng tin cậy thống kê, và `std::hint::black_box` ngăn compiler tối ưu mất lời gọi hàm (giống mục đích với việc "giữ biến vòng lặp sống" của `b.Loop()` bên Go).
:::

:::note
Ví dụ Swift trên **không phải benchmark thống kê** — không warm-up, không đo phương sai/outlier như criterion, testing.B hay tinybench, chỉ lấy trung bình cộng đơn giản. Muốn benchmark nghiêm túc hơn, dùng package [package-benchmark](https://github.com/ordo-one/package-benchmark) (hoặc [swift-benchmark](https://github.com/google/swift-benchmark) cũ hơn, ít được bảo trì) — cả hai đều cần một SwiftPM package riêng, không chạy như script đơn lẻ.
:::

:::note
JMH là công cụ benchmark tiêu chuẩn của hệ sinh thái Java vì JIT compiler khiến việc tự đo bằng tay (kiểu `System.nanoTime()`) dễ cho ra kết quả sai (dead-code elimination, chưa warm-up JIT…) — ví dụ trên phải đặt `n` vào field có `@State` thay vì literal `10`, nếu không JIT sẽ tính sẵn (constant-fold) toàn bộ `fibLoop` và cho ra kết quả gần 0. JMH sinh code qua annotation processor (`jmh-generator-annprocess`) lúc biên dịch, nên không chạy như file Java đơn lẻ được — cách chuẩn là tạo project qua Maven archetype `jmh-java-benchmark-archetype`, `mvn clean install` rồi chạy `target/benchmarks.jar` sinh ra.
:::
