---
title: "Concurrency: Threads and Child Processes"
description: "How Node.js's worker_threads and child_process.fork() compare to goroutines and re-executing the binary in Go."
tags: [concurrency, goroutine, worker-threads, fork]
---

Two different problems: splitting CPU-bound work across threads to run in parallel, and isolating a task in its own process. Node.js solves them with `worker_threads` and `child_process.fork()`; Go uses goroutines for the first one, but has no safe `fork()` for the second — Go's runtime is inherently multithreaded, so a raw `fork()` syscall only duplicates the calling thread, leaving every other thread's locks, goroutines, and the scheduler in an inconsistent state inside the child. Re-executing the binary is the safe substitute.

## Splitting CPU-bound work across threads (worker_threads vs goroutine)

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
		wg.Go(func() { // each goroutine writes to its own slot of partials, no lock needed
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
Goroutines are multiplexed onto a small pool of OS threads, at most `GOMAXPROCS` of them running Go code at once (default: the number of CPUs available to the process; since Go 1.25, with `go 1.25`+ in go.mod, also capped by a Linux cgroup CPU limit). A Node.js `Worker` is a separate V8 isolate with its own event loop and memory, so 4 workers really are 4 extra OS threads.
:::

:::note
Go 1.25 — `wg.Go(f)` replaces the older `wg.Add(1)` + `go func() { defer wg.Done(); f() }()` pair. `f` must not panic: if it does, the program crashes without `Done` being called.
:::

## Isolating a task in its own process (fork vs re-exec)

:::tabs
```js
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";

if (process.send) {
  // running as the forked child
  process.once("message", ({ numbers }) => {
    const results = numbers.map((n) => n * n);
    process.send({ results });
    process.disconnect();
  });
} else {
  // running as the parent
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
		// running as the child: read numbers as JSON on stdin, write squares to stdout
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

	// running as the parent: re-execute this binary as the child
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

## Key differences

| | Node.js | Go |
|---|---|---|
| Unit of parallelism | `Worker` (separate V8 isolate) | goroutine (lightweight, shares process memory) |
| Actual OS threads running | 1 thread per worker | up to `GOMAXPROCS` shared threads |
| Process isolation | `child_process.fork()` | re-executes its own binary (no safe `fork()`) |
