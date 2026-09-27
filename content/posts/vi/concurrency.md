---
title: "Concurrency: luồng và tiến trình con"
description: "worker_threads/child_process.fork() của Node.js so với goroutine (Go), std::thread (Rust), TaskGroup (Swift) và thread/ProcessBuilder (Java)."
date: "2026-09-27"
order: 740
category: async
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.25"
  rust: "1.71"
  swift: "5.7"
  java: "25"
tags: [concurrency, goroutine, worker-threads, fork]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#concurrency"
---

Hai bài toán khác nhau: chia việc nặng CPU cho nhiều luồng để chạy song song, và cô lập một tác vụ trong tiến trình riêng. Node.js giải quyết bằng `worker_threads` và `child_process.fork()`. Go, Rust và Java dùng goroutine/thread cho vế đầu; Swift dùng `TaskGroup` — cùng ý tưởng với `async let` ở bài [async/await](/posts/async-await), nhưng nhận một danh sách công việc động thay vì vài biến cố định. Không ngôn ngữ nào trong bốn ngôn ngữ còn lại có `fork()` an toàn để cô lập tiến trình: runtime của chúng vốn đa luồng (goroutine scheduler, thread pool async, v.v.), nên `fork()` chỉ nhân bản luồng gọi nó, để lại mọi lock và luồng khác ở trạng thái không nhất quán trong tiến trình con. Tự thực thi lại chính binary/tiến trình là cách thay thế an toàn ở cả bốn.

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
                *partial = sum_range(start, end); // mỗi thread mượn riêng một ô, không cần lock
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

// TaskGroup nhận một danh sách công việc động — khác với `async let` (số
// lượng cố định lúc viết code) đã thấy ở bài async/await.
func run() async -> Int {
    let chunk = (rangeEnd + workerCount - 1) / workerCount

    return await withTaskGroup(of: Int.self) { group in
        for w in 0..<workerCount {
            let start = w * chunk
            let end = min(start + chunk, rangeEnd)
            group.addTask { sumRange(start..<end) } // mỗi task tự tính một đoạn, không có state dùng chung
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
        // platform thread, không phải virtual: việc CPU-bound này không hưởng
        // lợi gì từ virtual thread (carrier pool mặc định chỉ to bằng số core),
        // và một virtual thread chạy CPU-bound liên tục còn có thể "ghim"
        // (pin) carrier của nó, chặn các virtual thread khác dùng carrier đó
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
goroutine được ghép kênh (multiplex) trên một nhóm nhỏ luồng OS — tối đa `GOMAXPROCS` luồng chạy code Go cùng lúc (mặc định: số CPU khả dụng cho tiến trình; từ Go 1.25, với `go 1.25`+ trong go.mod, còn bị giới hạn thêm bởi CPU limit của cgroup trên Linux). Một `Worker` trong Node.js là một V8 isolate riêng biệt với event loop và bộ nhớ của chính nó, nên 4 worker thực sự là 4 luồng OS phụ thêm. `std::thread::spawn` của Rust và `Thread.ofPlatform()` của Java thì ánh xạ 1:1 với luồng OS, giống Worker hơn là giống goroutine.
:::

:::note
Go 1.25 — `wg.Go(f)` thay cho cặp `wg.Add(1)` + `go func() { defer wg.Done(); f() }()` cũ hơn. `f` không được phép panic: nếu panic, chương trình sẽ crash mà không có `Done` được gọi.
:::

:::warning
Virtual thread (Java 21) hợp cho hàng ngàn tác vụ *đợi I/O*, không hợp cho việc *nặng CPU* như trên: chúng vẫn được ghép kênh trên một nhóm nhỏ carrier thread, nên dùng virtual thread ở đây không tăng thêm song song thật nào so với `Thread.ofPlatform()`.
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
```rust
// Cargo.toml: serde_json = "1"
use std::env;
use std::io::Write;
use std::process::{Command, Stdio};

fn main() {
    if env::var("FORK_CHILD").as_deref() == Ok("1") {
        // chạy với tư cách tiến trình con: đọc numbers dạng JSON từ stdin, ghi bình phương ra stdout
        let numbers: Vec<i64> = serde_json::from_reader(std::io::stdin()).unwrap();
        let squares: Vec<i64> = numbers.iter().map(|n| n * n).collect();
        serde_json::to_writer(std::io::stdout(), &squares).unwrap();
        return;
    }

    // chạy với tư cách tiến trình cha: tự thực thi lại chính binary này làm tiến trình con
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
    // chạy với tư cách tiến trình con: đọc numbers dạng JSON từ stdin, ghi bình phương ra stdout
    let input = FileHandle.standardInput.readDataToEndOfFile()
    let numbers = try JSONDecoder().decode([Int].self, from: input)
    let squares = numbers.map { $0 * $0 }
    // write(contentsOf:) ném lỗi thay vì crash khi ghi thất bại (macOS 10.15.4+)
    try FileHandle.standardOutput.write(contentsOf: JSONEncoder().encode(squares))
} else {
    // chạy với tư cách tiến trình cha: tự thực thi lại chính binary này làm tiến trình con
    let process = Process()
    // Bundle.main.executableURL trỏ đúng tới file thực thi đang chạy; chỉ có
    // giá trị khi chương trình được compile bằng swiftc — chạy qua interpreter
    // (`swift main.swift`) không có một binary thật để tự re-exec kiểu này.
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
        // chạy với tư cách tiến trình con: đọc numbers dạng "1,2,3" từ stdin, ghi bình phương ra stdout
        int[] numbers = parseInts(new String(System.in.readAllBytes()));
        int[] squares = Arrays.stream(numbers).map(n -> n * n).toArray();
        System.out.print(join(squares));
        return;
    }

    // chạy với tư cách tiến trình cha: tự thực thi lại chính source file này làm tiến trình con
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
Java không có thư viện JSON trong `java.base`, nên bản Java ở đây dùng một chuỗi số cách nhau bởi dấu phẩy thay vì JSON thật — cùng vai trò, chỉ khác định dạng trao đổi. `ProcessHandle.current().info()` cho biết đường dẫn `java` và các đối số gốc (gồm cả tên source file), đủ để tái tạo đúng lệnh `java Main.java` ban đầu làm tiến trình con. Lưu ý: `Info.arguments()` có thể trả về rỗng trên một số nền tảng/thiết lập bảo mật — nên kiểm tra và có phương án dự phòng thay vì giả định nó luôn có giá trị.
:::

## Khác biệt chính

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Đơn vị song song | `Worker` (V8 isolate riêng) | goroutine | `std::thread` | `Task` (trong `TaskGroup`) | `Thread` (platform/virtual) |
| Số luồng OS thực tế chạy | 1 luồng/worker | tối đa `GOMAXPROCS` luồng dùng chung | 1 luồng OS/thread | ghép kênh trên global executor | 1 luồng/platform thread |
| Cô lập tiến trình | `child_process.fork()` | tự re-exec chính binary | tự re-exec (`Command::new(current_exe)`) | `Process` (Foundation) re-exec | `ProcessBuilder` re-exec |
