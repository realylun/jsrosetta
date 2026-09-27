---
title: "Running Subprocesses (exec)"
description: "How Node.js's child_process.execSync/exec compares to os/exec (Go), std::process::Command (Rust), Process (Swift), and ProcessBuilder (Java)."
tags: [exec, subprocess, child-process, io]
---

Running a system command comes in two flavors: wait for it to finish before continuing (sync), or run it without blocking and handle the result later (async). Go doesn't have that distinction: `cmd.Run()` always blocks the calling goroutine. Rust's std is the same — `Command::output()` blocks the current thread; real "async" needs `tokio::process::Command` (not in std). Swift's `Process` also only has a synchronous API (`waitUntilExit()`); an "async with timeout" has to be assembled by hand with `Task`. Java ships both: `Process.waitFor()` (blocking) and `Process.onExit()`, which returns a `CompletableFuture<Process>`.

## Running synchronously

:::tabs
```js
import { execSync } from 'node:child_process'

const output = execSync(`echo 'hello world'`)

console.log(output.toString())
```
```go
package main

import (
	"fmt"
	"os/exec"
)

func main() {
	output, err := exec.Command("echo", "hello world").Output()
	if err != nil {
		panic(err)
	}

	fmt.Println(string(output))
}
```
```rust
use std::process::Command;

fn main() {
    let output = Command::new("echo")
        .arg("hello world")
        .output() // blocks until the child process exits
        .unwrap();

    print!("{}", String::from_utf8_lossy(&output.stdout));
}
```
```swift
import Foundation

let process = Process()
process.executableURL = URL(fileURLWithPath: "/bin/echo")
process.arguments = ["hello world"]

let pipe = Pipe()
process.standardOutput = pipe

try process.run()
process.waitUntilExit() // blocks until the child process exits

let data = pipe.fileHandleForReading.readDataToEndOfFile()
print(String(data: data, encoding: .utf8) ?? "", terminator: "")
```
```java
void main() throws Exception {
    Process process = new ProcessBuilder("echo", "hello world").start();
    String output = new String(process.getInputStream().readAllBytes());
    process.waitFor(); // blocks until the child process exits

    IO.print(output);
}
```
:::

```bash
hello world
```

## Running asynchronously with a timeout

:::tabs
```js
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const { stdout, stderr } = await execAsync(`echo 'hello world'`, { timeout: 5000 })

if (stderr) {
  console.error(stderr)
}

console.log(stdout)
```
```go
package main

import (
	"context"
	"os"
	"os/exec"
	"time"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "echo", "hello world")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		panic(err)
	}
}
```
```rust
// Cargo.toml: tokio = { version = "1", features = ["full"] }
use std::time::Duration;
use tokio::process::Command;
use tokio::time::timeout;

#[tokio::main]
async fn main() {
    let child = Command::new("echo")
        .arg("hello world")
        .stdout(std::process::Stdio::piped()) // without this, stdout is inherited and wait_with_output() returns empty
        .kill_on_drop(true) // if the timeout fires, dropping the future kills the child process
        .spawn()
        .unwrap();

    let output = timeout(Duration::from_secs(5), child.wait_with_output())
        .await
        .expect("timed out")
        .unwrap();

    print!("{}", String::from_utf8_lossy(&output.stdout));
}
```
```swift
import Foundation

let process = Process()
process.executableURL = URL(fileURLWithPath: "/bin/echo")
process.arguments = ["hello world"]

let pipe = Pipe()
process.standardOutput = pipe
try process.run()

let timeoutTask = Task {
    try await Task.sleep(for: .seconds(5))
    if process.isRunning { process.terminate() } // kill the child process once the timeout fires
}

process.waitUntilExit() // still blocking: Process has no async "wait" API
timeoutTask.cancel()

let data = pipe.fileHandleForReading.readDataToEndOfFile()
print(String(data: data, encoding: .utf8) ?? "", terminator: "")
```
```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

void main() throws Exception {
    Process process = new ProcessBuilder("echo", "hello world")
            .redirectErrorStream(true)
            .start();

    // read stdout concurrently right away — waiting for exit before reading
    // can hang the child process once its output buffer fills up
    CompletableFuture<String> output = CompletableFuture.supplyAsync(() -> {
        try {
            return new String(process.getInputStream().readAllBytes());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    });

    try {
        process.onExit() // CompletableFuture<Process>, doesn't block the calling thread until .join()
                .orTimeout(5, TimeUnit.SECONDS)
                .join();
    } catch (Exception timedOut) {
        process.destroyForcibly(); // kill the child process once the timeout fires
    }

    IO.print(output.join());
}
```
:::

```bash
hello world
```

:::note
`exec.CommandContext` (Go 1.7) kills the process if `ctx` is canceled or times out (here, after 5 seconds), unlike `exec.Command`, which can run unbounded.
:::

:::note
Rust's std has no async runtime, so "async with a timeout" needs the `tokio` crate. `tokio::process::Command::kill_on_drop(true)` (available since tokio's early 1.x releases) makes the child process get killed when its `Child` value is dropped — `tokio::time::timeout` drops the inner future (which owns the `Child`) as soon as it expires, so the kill happens automatically with no manual cleanup code.
:::

:::note
`Process.executableURL`/`try process.run()` (replacing the older, non-throwing `launchPath`/`.launch()`) needs macOS 10.13+. `Task.sleep(for:)` (SE-0329) needs Swift 5.7 and macOS 13+ — that's the highest version requirement in the Swift example above. Foundation's `Process` has no async API for waiting on exit; the common pattern is a timer `Task` that calls `terminate()` once it expires, running alongside a `waitUntilExit()` that's still blocking.
:::
