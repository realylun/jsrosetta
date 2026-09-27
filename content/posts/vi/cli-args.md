---
title: "Đối số và cờ dòng lệnh"
description: "process.argv và util.parseArgs của Node.js so với os.Args và package flag của Go để đọc đối số, cờ dòng lệnh."
date: "2026-09-27"
order: 930
category: io
languages: [js, go]
versions:
  js: "18.11"
  go: "1.0"
tags: [cli, args, flags, io]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#cli-args"
---

Có hai cách nhận input từ dòng lệnh: đọc thẳng mảng đối số thô, hoặc parse thành cờ có tên (`--foo=bar`). Cả hai ngôn ngữ đều có sẵn cả hai cách trong standard library — không cần cài thêm thư viện như `yargs`.

## Đối số dòng lệnh thô

:::tabs
```js
const args = process.argv.slice(2)

console.log(args)
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	args := os.Args[1:]
	fmt.Println(args)
}
```
:::

```bash
$ node cli_args.js foo bar qux
[ 'foo', 'bar', 'qux' ]

$ go run cli_args.go foo bar qux
[foo bar qux]
```

## Cờ dòng lệnh có tên

:::tabs
```js
import { parseArgs } from 'node:util'

const { values: { foo, qux } } = parseArgs({
  options: {
    foo: { type: 'string', default: 'default value' },
    qux: { type: 'boolean', default: false }
  }
})

console.log('foo:', foo)
console.log('qux:', qux)
```
```go
package main

import (
	"flag"
	"fmt"
)

func main() {
	var foo string
	flag.StringVar(&foo, "foo", "default value", "a string var")

	var qux bool
	flag.BoolVar(&qux, "qux", false, "a bool var")

	flag.Parse()

	fmt.Println("foo:", foo)
	fmt.Println("qux:", qux)
}
```
:::

```bash
$ node cli_flags.js --foo='bar' --qux
foo: bar
qux: true

$ go run cli_flags.go -foo='bar' -qux=true
foo: bar
qux: true
```

## Khác biệt chính

| | Node.js | Go |
|---|---|---|
| Đối số thô | `process.argv.slice(2)` | `os.Args[1:]` |
| Parse cờ có tên | `util.parseArgs()` | package `flag` |
| Tiền tố cờ | `--foo` | `-foo` (một hay hai gạch đều được) |
| Cờ boolean | `--qux` (không nhận giá trị) | `-qux=true` (nhận giá trị tường minh) |

:::note
Node.js 18.3 thêm `util.parseArgs()` vào standard library, thay cho các thư viện parse cờ của bên thứ ba như `yargs`; option `default` dùng ở trên xuất hiện từ Node.js 18.11, và `parseArgs()` ở trạng thái experimental cho tới Node.js 20. Cờ boolean là flag trần (`--qux`) — truyền kèm giá trị (`--qux=true`) sẽ ném lỗi `ERR_PARSE_ARGS_INVALID_OPTION_VALUE`.
:::
