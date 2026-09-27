---
title: "Running Subprocesses (exec)"
description: "How Node.js's child_process.execSync/exec compare to Go's os/exec.Command/CommandContext for running a system command."
tags: [exec, subprocess, child-process, io]
---

Running a system command comes in two flavors: wait for it to finish before continuing (sync), or run it in the background and handle the result later (async). Go doesn't distinguish sync/async the way Node.js does — instead you use a `context.Context` to bound how long it's allowed to run.

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
`exec.CommandContext` (Go 1.7) kills the process if `ctx` is canceled or times out (here, after 5 seconds), unlike `exec.Command`, which can run unbounded.
:::
