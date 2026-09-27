---
title: "Command-Line Arguments and Flags"
description: "How Node.js's process.argv and util.parseArgs compare to Go's os.Args and the flag package for command-line arguments and flags."
tags: [cli, args, flags, io]
---

There are two ways to get input from the command line: read the raw argument array directly, or parse it into named flags (`--foo=bar`). Both languages ship both options in their standard library — no need to install a library like `yargs`.

## Raw command-line arguments

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

## Named command-line flags

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

## Key differences

| | Node.js | Go |
|---|---|---|
| Raw arguments | `process.argv.slice(2)` | `os.Args[1:]` |
| Parsing named flags | `util.parseArgs()` | the `flag` package |
| Flag prefix | `--foo` | `-foo` (one or two dashes both work) |
| Boolean flags | `--qux` (takes no value) | `-qux` or `-qux=true` (never `-qux true`) |

:::note
Node.js 18.3 added `util.parseArgs()` to the standard library, replacing third-party flag parsers like `yargs`; the `default` option used above arrived in Node.js 18.11, and `parseArgs()` was experimental until Node.js 20. Boolean flags are plain switches (`--qux`) — passing a value (`--qux=true`) throws `ERR_PARSE_ARGS_INVALID_OPTION_VALUE`.
:::
