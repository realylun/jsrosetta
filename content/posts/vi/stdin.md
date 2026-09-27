---
title: "Đọc từ Stdin"
description: "readline/promises của Node.js so với bufio.NewReader(os.Stdin) của Go để đọc một dòng nhập từ người dùng."
date: "2026-09-27"
order: 920
category: io
languages: [js, go]
versions:
  js: "17"
  go: "1.0"
tags: [stdin, readline, io, cli]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#stdin"
---

Đọc input tương tác từ người dùng nghĩa là đợi một dòng text kết thúc bằng Enter. Node.js có module `readline/promises` để `await` câu trả lời, còn Go dùng `bufio.Reader` đọc tới ký tự xuống dòng.

## Đọc một dòng từ stdin

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
Từ Node.js 17, `node:readline/promises` thay thế `process.openStdin()` cũ (không có trong docs của `process`) — `createInterface().question()` trả về `Promise` có thể `await` thay vì phải đăng ký listener `'data'` rồi tự gọi `.pause()`. `node:readline/promises` ở trạng thái experimental cho tới Node.js 24.0.
:::
