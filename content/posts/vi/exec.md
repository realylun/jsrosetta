---
title: "Chạy tiến trình con (exec)"
description: "child_process.execSync/exec của Node.js so với os/exec (Go), std::process::Command (Rust), Process (Swift) và ProcessBuilder (Java)."
date: "2026-09-27"
order: 950
category: io
languages: [js, go, rust, swift, java]
versions:
  js: "14.13.1"
  go: "1.7"
  rust: "1.71"
  swift: "5.7"
  java: "25"
tags: [exec, subprocess, child-process, io]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#exec-sync"
---

Chạy một lệnh hệ thống có hai kiểu: đợi nó chạy xong rồi mới tiếp tục (sync), hoặc chạy mà không chặn rồi xử lý kết quả sau (async). Go không có sự phân biệt đó: `cmd.Run()` luôn chặn (block) goroutine gọi nó. Rust std cũng vậy — `Command::output()` chặn thread hiện tại; muốn "async" thật sự phải dùng `tokio::process::Command` (không có trong std). Swift's `Process` cũng chỉ có API đồng bộ (`waitUntilExit()`); "async có timeout" phải tự ghép bằng `Task`. Java có sẵn cả hai: `Process.waitFor()` (block) và `Process.onExit()` trả về `CompletableFuture<Process>`.

## Chạy đồng bộ (sync)

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
        .output() // block cho tới khi tiến trình con thoát
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
process.waitUntilExit() // block cho tới khi tiến trình con thoát

let data = pipe.fileHandleForReading.readDataToEndOfFile()
print(String(data: data, encoding: .utf8) ?? "", terminator: "")
```
```java
void main() throws Exception {
    Process process = new ProcessBuilder("echo", "hello world").start();
    String output = new String(process.getInputStream().readAllBytes());
    process.waitFor(); // block cho tới khi tiến trình con thoát

    IO.print(output);
}
```
:::

```bash
hello world
```

## Chạy bất đồng bộ (async) có timeout

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
        .stdout(std::process::Stdio::piped()) // không piped thì stdout kế thừa từ cha, wait_with_output() sẽ trả về rỗng
        .kill_on_drop(true) // hết timeout thì drop future sẽ kill tiến trình con
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
    if process.isRunning { process.terminate() } // hết timeout thì kill tiến trình con
}

process.waitUntilExit() // vẫn block: Process không có API async để chờ thoát
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

    // đọc stdout song song ngay từ đầu — nếu đợi tiến trình thoát rồi mới đọc,
    // tiến trình con có thể bị treo khi buffer output đầy
    CompletableFuture<String> output = CompletableFuture.supplyAsync(() -> {
        try {
            return new String(process.getInputStream().readAllBytes());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    });

    try {
        process.onExit() // CompletableFuture<Process>, không block thread gọi cho tới .join()
                .orTimeout(5, TimeUnit.SECONDS)
                .join();
    } catch (Exception timedOut) {
        process.destroyForcibly(); // hết timeout thì kill tiến trình con
    }

    IO.print(output.join());
}
```
:::

```bash
hello world
```

:::note
`exec.CommandContext` (Go 1.7) sẽ kill tiến trình nếu `ctx` bị cancel hoặc hết hạn (ở đây là sau 5 giây) — khác với `exec.Command`, vốn có thể chạy vô thời hạn nếu không kiểm soát.
:::

:::note
Rust std không có runtime async, nên "async có timeout" cần crate `tokio`. `tokio::process::Command::kill_on_drop(true)` (thêm từ các bản tokio 1.x đầu tiên) khiến tiến trình con bị kill khi giá trị `Child` bị drop — `tokio::time::timeout` drop future bên trong (đang giữ `Child`) ngay khi hết hạn, nên kill tự động xảy ra mà không cần code dọn dẹp thủ công.
:::

:::note
`Process.executableURL`/`try process.run()` (thay cho `launchPath`/`.launch()` cũ, không ném lỗi) cần macOS 10.13+. `Task.sleep(for:)` (SE-0329) cần Swift 5.7 và macOS 13+ — đây là ràng buộc phiên bản cao nhất trong ví dụ Swift ở trên. Foundation's `Process` không có API async chờ tiến trình thoát; cách phổ biến là chạy một `Task` đếm giờ gọi `terminate()` khi hết hạn, song song với `waitUntilExit()` vẫn đang block.
:::
