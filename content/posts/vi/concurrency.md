---
title: "Concurrency: luồng và tiến trình con"
description: "worker_threads và child_process.fork() của Node.js so với goroutine cùng việc tự re-exec tiến trình trong Go."
date: "2026-09-27"
order: 740
category: async
languages: [js, go]
versions:
  js: "12.20"
  go: "1.25"
tags: [concurrency, goroutine, worker-threads, fork]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#concurrency"
---

Hai bài toán khác nhau: chia việc nặng CPU cho nhiều luồng để chạy song song, và cô lập một tác vụ trong tiến trình riêng. Node.js giải quyết bằng `worker_threads` và `child_process.fork()`; Go dùng goroutine cho vế đầu, còn vế sau thì không có `fork()` an toàn để dùng — runtime của Go vốn đa luồng, nên `fork()` chỉ nhân bản luồng gọi nó, để lại mọi lock, goroutine và scheduler ở trạng thái không nhất quán trong tiến trình con. Tự thực thi lại chính binary là cách thay thế an toàn.

## Chia việc CPU-bound cho nhiều luồng (worker_threads vs goroutine)

:::tabs
```js
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { fileURLToPath } from "node:url";

const RANGE_END = 50_000_000;
const WORKER_COUNT = 4;

function sumRange(start, end) {
  let total = 0;
  for (let i = start; i < end; i++) {
    total += i;
  }
  return total;
}

async function main() {
  const filename = fileURLToPath(import.meta.url);
  const chunk = Math.ceil(RANGE_END / WORKER_COUNT);

  const partials = await Promise.all(
    Array.from({ length: WORKER_COUNT }, (_, i) => {
      const start = i * chunk;
      const end = Math.min(start + chunk, RANGE_END);
      return new Promise((resolve, reject) => {
        const worker = new Worker(filename, { workerData: { start, end } });
        worker.on("message", resolve);
        worker.on("error", reject);
      });
    }),
  );

  const sum = partials.reduce((total, partial) => total + partial, 0);
  console.log("sum:", sum); // → sum: 1249999975000000
}

if (isMainThread) {
  main();
} else {
  const { start, end } = workerData;
  parentPort.postMessage(sumRange(start, end));
}
```
```go
package main

import (
	"fmt"
	"sync"
)

const (
	rangeEnd    = 50_000_000
	workerCount = 4
)

func sumRange(start, end int) int {
	total := 0
	for i := start; i < end; i++ {
		total += i
	}
	return total
}

func main() {
	chunk := (rangeEnd + workerCount - 1) / workerCount

	partials := make([]int, workerCount)
	var wg sync.WaitGroup

	for w := range workerCount {
		start := w * chunk
		end := min(start+chunk, rangeEnd)
		wg.Go(func() { // mỗi goroutine ghi vào một ô riêng của partials, không cần lock
			partials[w] = sumRange(start, end)
		})
	}
	wg.Wait()

	sum := 0
	for _, partial := range partials {
		sum += partial
	}
	fmt.Println("sum:", sum) // → sum: 1249999975000000
}
```
:::

:::note
goroutine được ghép kênh (multiplex) trên một nhóm nhỏ luồng OS — tối đa `GOMAXPROCS` luồng chạy code Go cùng lúc (mặc định: số CPU khả dụng cho tiến trình; từ Go 1.25, với `go 1.25`+ trong go.mod, còn bị giới hạn thêm bởi CPU limit của cgroup trên Linux). Một `Worker` trong Node.js là một V8 isolate riêng biệt với event loop và bộ nhớ của chính nó, nên 4 worker thực sự là 4 luồng OS phụ thêm.
:::

:::note
Go 1.25 — `wg.Go(f)` thay cho cặp `wg.Add(1)` + `go func() { defer wg.Done(); f() }()` cũ hơn. `f` không được phép panic: nếu panic, chương trình sẽ crash mà không có `Done` được gọi.
:::

## Cô lập một tác vụ trong tiến trình riêng (fork vs re-exec)

:::tabs
```js
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";

if (process.send) {
  // chạy với tư cách tiến trình con vừa fork
  process.once("message", ({ numbers }) => {
    const results = numbers.map((n) => n * n);
    process.send({ results });
    process.disconnect();
  });
} else {
  // chạy với tư cách tiến trình cha
  const child = fork(fileURLToPath(import.meta.url));
  const numbers = [1, 2, 3, 4, 5];

  child.once("message", ({ results }) => {
    console.log("squares:", results.join(", ")); // → squares: 1, 4, 9, 16, 25
    console.log("sum:", results.reduce((a, b) => a + b, 0)); // → sum: 55
  });

  child.send({ numbers });
}
```
```go
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func main() {
	if os.Getenv("FORK_CHILD") == "1" {
		// chạy với tư cách tiến trình con: đọc numbers dạng JSON từ stdin, ghi bình phương ra stdout
		var numbers []int
		if err := json.NewDecoder(os.Stdin).Decode(&numbers); err != nil {
			panic(err)
		}
		for i, n := range numbers {
			numbers[i] = n * n
		}
		if err := json.NewEncoder(os.Stdout).Encode(numbers); err != nil {
			panic(err)
		}
		return
	}

	// chạy với tư cách tiến trình cha: tự thực thi lại chính binary này làm tiến trình con
	exe, err := os.Executable()
	if err != nil {
		panic(err)
	}
	cmd := exec.Command(exe)
	cmd.Env = append(os.Environ(), "FORK_CHILD=1")
	cmd.Stdin = strings.NewReader("[1, 2, 3, 4, 5]")
	cmd.Stderr = os.Stderr

	out, err := cmd.Output()
	if err != nil {
		panic(err)
	}

	var results []int
	if err := json.Unmarshal(out, &results); err != nil {
		panic(err)
	}

	squares := make([]string, len(results))
	sum := 0
	for i, r := range results {
		squares[i] = fmt.Sprint(r)
		sum += r
	}
	fmt.Println("squares:", strings.Join(squares, ", ")) // → squares: 1, 4, 9, 16, 25
	fmt.Println("sum:", sum)                              // → sum: 55
}
```
:::

## Khác biệt chính

| | Node.js | Go |
|---|---|---|
| Đơn vị song song | `Worker` (V8 isolate riêng) | goroutine (nhẹ, chia sẻ bộ nhớ tiến trình) |
| Số luồng OS thực tế chạy | 1 luồng/worker | tối đa `GOMAXPROCS` luồng dùng chung |
| Cô lập tiến trình | `child_process.fork()` | tự re-exec chính binary (không có `fork()` an toàn) |
