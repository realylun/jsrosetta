---
title: "Reading from Stdin"
description: "How Node.js's readline/promises compares to Go's bufio.NewReader(os.Stdin) for reading a line of user input."
tags: [stdin, readline, io, cli]
---

Reading interactive input means waiting for a line of text that ends with Enter. Node.js has the `readline/promises` module so you can `await` the answer, while Go uses a `bufio.Reader` that reads up to the newline character.

## Reading a line from stdin

:::tabs
```js
import { createInterface } from 'node:readline/promises'

const rl = createInterface({ input: process.stdin, output: process.stdout })

const name = await rl.question('Enter name: ')
console.log('Your name is: ' + name)

rl.close()
```
```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	fmt.Print("Enter name: ")

	text, err := reader.ReadString('\n')
	if err != nil {
		panic(err)
	}

	name := strings.TrimSpace(text)
	fmt.Printf("Your name is: %s\n", name)
}
```
:::

```bash
Enter name: bob
Your name is: bob
```

:::note
Node.js 17 replaced `process.openStdin()` (a legacy API that was never documented under `process`) with `node:readline/promises`'s `createInterface().question()`, which returns a `Promise` you can `await` instead of registering a `'data'` listener and manually calling `.pause()`. `node:readline/promises` was experimental until Node.js 24.0.
:::
