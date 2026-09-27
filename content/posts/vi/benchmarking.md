---
title: "Benchmark"
description: "tinybench của Node.js so với testing.B + b.Loop() của Go để đo hiệu năng hàm."
date: "2026-09-27"
order: 1090
category: stdlib
languages: [js, go]
versions:
  js: "20"
  go: "1.24"
tags: [benchmark, performance, testing]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#benchmarking"
---

Go có benchmark built-in trong package `testing` từ rất sớm. Node.js không có benchmark runner tích hợp, nên ví dụ dưới dùng thư viện `tinybench` — nhỏ gọn, không dependency, cùng ý tưởng "thêm task vào suite rồi chạy".

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

:::note
**Thay đổi:** package `benchmark` của npm (không còn bảo trì từ 2016) → `tinybench`, thư viện benchmark nhỏ gọn, không dependency, cùng mô hình "thêm task vào suite rồi chạy". tinybench 6 yêu cầu Node.js ≥ 20.
:::

:::note
**Thay đổi (Go 1.24):** `for b.Loop() { ... }` thay cho `for i := 0; i < b.N; i++ { ... }`. `b.Loop()` reset timer sau phần setup, giữ biến vòng lặp "sống" để compiler không tối ưu mất phần thân, và chỉ chạy thân hàm benchmark một lần cho mỗi lần đo thay vì tự lặp lại thủ công.
:::
