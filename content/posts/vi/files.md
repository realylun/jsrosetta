---
title: "Đọc, ghi và xoá file"
description: "readFile/writeFile không đồng bộ của Node.js (node:fs/promises) so với os.ReadFile/os.WriteFile của Go."
date: "2026-09-27"
order: 900
category: io
languages: [js, go]
versions:
  js: "14.13.1"
  go: "1.16"
tags: [files, fs, filesystem, io]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#files"
---

Cả Node.js và Go đều có API bậc cao để tạo, đọc và xoá file mà không cần quản lý file descriptor thủ công. Node.js dùng các hàm `Promise`-based trong `node:fs/promises`, còn Go trả về `(giá trị, error)` trực tiếp — không có exception, chỉ có `err` bạn phải kiểm tra ngay sau mỗi lời gọi.

## Tạo, ghi, đọc và xoá file

:::tabs
```js
import { readFile, unlink, writeFile } from 'node:fs/promises'

// tạo file (và ghi vào đó)
await writeFile('test.txt', 'hello world.')

// đọc file
const contents = await readFile('test.txt', 'utf8')
console.log(contents)

// xoá file
await unlink('test.txt')
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// tạo file (và ghi vào đó)
	if err := os.WriteFile("test.txt", []byte("hello world."), 0644); err != nil {
		panic(err)
	}

	// đọc file
	contents, err := os.ReadFile("test.txt")
	if err != nil {
		panic(err)
	}

	fmt.Println(string(contents))

	// xoá file
	if err := os.Remove("test.txt"); err != nil {
		panic(err)
	}
}
```
:::

```bash
hello world.
```

:::note
Go 1.16 gộp `os.ReadFile`/`os.WriteFile` thay cho `ioutil.ReadFile`/`ioutil.WriteFile` cũ; gói `io/ioutil` đã deprecated, đừng dùng trong code mới.
:::
