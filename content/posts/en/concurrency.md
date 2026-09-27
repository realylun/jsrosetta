---
title: "Concurrency: Threads and Child Processes"
description: "How Node.js's worker_threads/child_process.fork() compare to goroutines (Go), std::thread (Rust), TaskGroup (Swift), and thread/ProcessBuilder (Java)."
tags: [concurrency, goroutine, worker-threads, fork]
---

Two different problems: splitting CPU-bound work across threads to run in parallel, and isolating a task in its own process. Node.js solves them with `worker_threads` and `child_process.fork()`. Go, Rust, and Java use goroutines/threads for the first one; Swift uses `TaskGroup` — the same idea as `async let` from the [async/await](/en/posts/async-await) post, but taking a dynamic list of work instead of a fixed handful of variables. None of the other four languages have a safe `fork()` for process isolation either: their runtimes are inherently multithreaded (a goroutine scheduler, an async thread pool, and so on), so a raw `fork()` only duplicates the calling thread, leaving every other lock and thread in an inconsistent state inside the child. Re-executing the binary/process itself is the safe substitute in all four.

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
```rust
use std::thread;

const RANGE_END: u64 = 50_000_000;
const WORKER_COUNT: u64 = 4;

fn sum_range(start: u64, end: u64) -> u64 {
    (start..end).sum()
}

fn main() {
    let chunk = (RANGE_END + WORKER_COUNT - 1) / WORKER_COUNT;
    let mut partials = vec![0u64; WORKER_COUNT as usize];

    thread::scope(|s| {
        for (w, partial) in partials.iter_mut().enumerate() {
            let start = w as u64 * chunk;
            let end = (start + chunk).min(RANGE_END);
            s.spawn(move || {
                *partial = sum_range(start, end); // each thread borrows its own slot, no lock needed
            });
        }
    });

    let sum: u64 = partials.iter().sum();
    println!("sum: {sum}"); // → sum: 1249999975000000
}
```
```swift
let rangeEnd = 50_000_000
let workerCount = 4

func sumRange(_ range: Range<Int>) -> Int {
    range.reduce(0, +)
}

// TaskGroup takes a dynamic list of work — unlike `async let` (a fixed
// number of variables written into the code) from the async/await post.
func run() async -> Int {
    let chunk = (rangeEnd + workerCount - 1) / workerCount

    return await withTaskGroup(of: Int.self) { group in
        for w in 0..<workerCount {
            let start = w * chunk
            let end = min(start + chunk, rangeEnd)
            group.addTask { sumRange(start..<end) } // each task computes its own slice, no shared state
        }
        return await group.reduce(0, +)
    }
}

let sum = await run()
print("sum:", sum) // → sum: 1249999975000000
```
```java
int rangeEnd = 50_000_000;
int workerCount = 4;

static long sumRange(int start, int end) {
    long total = 0;
    for (int i = start; i < end; i++) {
        total += i;
    }
    return total;
}

void main() throws InterruptedException {
    int chunk = (rangeEnd + workerCount - 1) / workerCount;
    long[] partials = new long[workerCount];
    Thread[] threads = new Thread[workerCount];

    for (int w = 0; w < workerCount; w++) {
        int start = w * chunk;
        int end = Math.min(start + chunk, rangeEnd);
        int idx = w;
        // platform threads, not virtual ones: this CPU-bound work gets no
        // benefit from virtual threads (the default carrier pool is only as
        // big as the core count), and a virtual thread that runs CPU-bound
        // work continuously can "pin" its carrier, blocking other virtual
        // threads from using it
        threads[w] = Thread.ofPlatform().start(() -> {
            partials[idx] = sumRange(start, end);
        });
    }
    for (Thread t : threads) {
        t.join();
    }

    long sum = 0;
    for (long partial : partials) {
        sum += partial;
    }
    IO.println("sum: " + sum); // → sum: 1249999975000000
}
```
:::

:::note
Goroutines are multiplexed onto a small pool of OS threads, at most `GOMAXPROCS` of them running Go code at once (default: the number of CPUs available to the process; since Go 1.25, with `go 1.25`+ in go.mod, also capped by a Linux cgroup CPU limit). A Node.js `Worker` is a separate V8 isolate with its own event loop and memory, so 4 workers really are 4 extra OS threads. Rust's `std::thread::spawn` and Java's `Thread.ofPlatform()` map 1:1 to an OS thread, closer to a Worker than to a goroutine.
:::

:::note
Go 1.25 — `wg.Go(f)` replaces the older `wg.Add(1)` + `go func() { defer wg.Done(); f() }()` pair. `f` must not panic: if it does, the program crashes without `Done` being called.
:::

:::warning
Virtual threads (Java 21) are meant for thousands of tasks that *wait on I/O*, not for *CPU-heavy* work like this: they're still multiplexed onto a small pool of carrier threads, so using them here wouldn't add any real parallelism over `Thread.ofPlatform()`.
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
```rust
// Cargo.toml: serde_json = "1"
use std::env;
use std::io::Write;
use std::process::{Command, Stdio};

fn main() {
    if env::var("FORK_CHILD").as_deref() == Ok("1") {
        // running as the child: read numbers as JSON on stdin, write squares to stdout
        let numbers: Vec<i64> = serde_json::from_reader(std::io::stdin()).unwrap();
        let squares: Vec<i64> = numbers.iter().map(|n| n * n).collect();
        serde_json::to_writer(std::io::stdout(), &squares).unwrap();
        return;
    }

    // running as the parent: re-execute this binary as the child
    let exe = env::current_exe().unwrap();
    let mut child = Command::new(exe)
        .env("FORK_CHILD", "1")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();

    child
        .stdin
        .take()
        .unwrap()
        .write_all(b"[1, 2, 3, 4, 5]")
        .unwrap();

    let output = child.wait_with_output().unwrap();
    let results: Vec<i64> = serde_json::from_slice(&output.stdout).unwrap();

    let squares = results.iter().map(|r| r.to_string()).collect::<Vec<_>>().join(", ");
    let sum: i64 = results.iter().sum();
    println!("squares: {squares}"); // → squares: 1, 4, 9, 16, 25
    println!("sum: {sum}"); // → sum: 55
}
```
```swift
import Foundation

if ProcessInfo.processInfo.environment["FORK_CHILD"] == "1" {
    // running as the child: read numbers as JSON on stdin, write squares to stdout
    let input = FileHandle.standardInput.readDataToEndOfFile()
    let numbers = try JSONDecoder().decode([Int].self, from: input)
    let squares = numbers.map { $0 * $0 }
    // write(contentsOf:) throws instead of crashing on a failed write (macOS 10.15.4+)
    try FileHandle.standardOutput.write(contentsOf: JSONEncoder().encode(squares))
} else {
    // running as the parent: re-execute this binary as the child
    let process = Process()
    // Bundle.main.executableURL points at the currently running executable;
    // it's only meaningful when compiled with swiftc — running through the
    // interpreter (`swift main.swift`) has no real binary to re-exec this way.
    process.executableURL = Bundle.main.executableURL!
    process.environment = ProcessInfo.processInfo.environment.merging(["FORK_CHILD": "1"]) { _, new in new }

    let stdin = Pipe()
    let stdout = Pipe()
    process.standardInput = stdin
    process.standardOutput = stdout

    try process.run()
    try stdin.fileHandleForWriting.write(contentsOf: "[1, 2, 3, 4, 5]".data(using: .utf8)!)
    try stdin.fileHandleForWriting.close()

    let output = stdout.fileHandleForReading.readDataToEndOfFile()
    process.waitUntilExit()

    let results = try JSONDecoder().decode([Int].self, from: output)
    let squares = results.map(String.init).joined(separator: ", ")
    let sum = results.reduce(0, +)
    print("squares: \(squares)") // → squares: 1, 4, 9, 16, 25
    print("sum: \(sum)") // → sum: 55
}
```
```java
void main() throws Exception {
    if ("1".equals(System.getenv("FORK_CHILD"))) {
        // running as the child: read comma-separated numbers from stdin, write squares to stdout
        int[] numbers = parseInts(new String(System.in.readAllBytes()));
        int[] squares = Arrays.stream(numbers).map(n -> n * n).toArray();
        System.out.print(join(squares));
        return;
    }

    // running as the parent: re-execute this source file as the child
    var info = ProcessHandle.current().info();
    var command = new ArrayList<String>();
    command.add(info.command().orElseThrow());
    command.addAll(List.of(info.arguments().orElseThrow()));

    var builder = new ProcessBuilder(command);
    builder.environment().put("FORK_CHILD", "1");
    Process process = builder.start();

    process.getOutputStream().write("1,2,3,4,5".getBytes());
    process.getOutputStream().close();

    String output = new String(process.getInputStream().readAllBytes());
    process.waitFor();

    int[] results = parseInts(output);
    IO.println("squares: " + join(results)); // → squares: 1, 4, 9, 16, 25
    IO.println("sum: " + Arrays.stream(results).sum()); // → sum: 55
}

static int[] parseInts(String s) {
    return Arrays.stream(s.trim().split(",\\s*")).mapToInt(Integer::parseInt).toArray();
}

static String join(int[] values) {
    return Arrays.stream(values).mapToObj(String::valueOf).collect(Collectors.joining(", "));
}
```
:::

:::note
Java has no JSON library in `java.base`, so the Java version here uses a comma-separated string instead of real JSON — same role, just a different wire format. `ProcessHandle.current().info()` reports the `java` executable's path and its original arguments (including the source file name), which is enough to reconstruct the original `java Main.java` command as the child. Note: `Info.arguments()` can come back empty on some platforms/security setups — check for that and have a fallback instead of assuming it's always present.
:::

## Key differences

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Unit of parallelism | `Worker` (separate V8 isolate) | goroutine | `std::thread` | `Task` (inside a `TaskGroup`) | `Thread` (platform/virtual) |
| Actual OS threads running | 1 thread per worker | up to `GOMAXPROCS` shared threads | 1 OS thread per thread | multiplexed onto the global executor | 1 thread per platform thread |
| Process isolation | `child_process.fork()` | re-executes its own binary | re-execs itself (`Command::new(current_exe)`) | `Process` (Foundation) re-exec | `ProcessBuilder` re-exec |
