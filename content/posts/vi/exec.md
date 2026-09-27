---
title: "Chạy tiến trình con (exec)"
description: "child_process.execSync/exec của Node.js so với os/exec.Command/CommandContext của Go để chạy lệnh hệ thống."
date: "2026-09-27"
order: 950
category: io
languages: [js, go]
versions:
  js: "14.13.1"
  go: "1.7"
tags: [exec, subprocess, child-process, io]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#exec-sync"
---

Chạy một lệnh hệ thống có hai kiểu: đợi nó chạy xong rồi mới tiếp tục (sync), hoặc chạy song song và xử lý kết quả khi xong (async). Go không phân biệt sync/async như Node.js — thay vào đó bạn dùng `context.Context` để giới hạn thời gian chạy.

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

const { stdout, stderr } = await execAsync(`echo 'hello world'`)

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
:::

```bash
hello world
```

:::note
`exec.CommandContext` (Go 1.7) sẽ kill tiến trình nếu `ctx` bị cancel hoặc hết hạn (ở đây là sau 5 giây) — khác với `exec.Command`, vốn có thể chạy vô thời hạn nếu không kiểm soát.
:::
