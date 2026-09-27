---
title: "Command-Line Arguments and Flags"
description: "How Node.js's process.argv/util.parseArgs compares to os.Args/flag (Go), env::args (Rust), CommandLine (Swift), and main's parameter (Java)."
tags: [cli, args, flags, io]
---

There are two ways to get input from the command line: read the raw argument array directly, or parse it into named flags (`--foo=bar`). Node.js and Go ship both options in their standard library. Rust's std only has `env::args()` (raw arguments) — named flags need the `clap` crate. Swift and Java have no flag-parsing package in their standard library/Foundation at all; the examples below parse `--foo=`/`--qux` by hand, while real projects typically reach for the `swift-argument-parser` package (Swift, via Swift Package Manager) or `picocli` (Java) for that.

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
```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().skip(1).collect(); // args().next() is the binary's own path
    println!("{args:?}");
}
```
```swift
let args = CommandLine.arguments.dropFirst() // arguments[0] is the binary's own path
print(Array(args))
```
```java
void main(String[] args) { // args here already excludes the program's own path
    IO.println(Arrays.toString(args));
}
```
:::

```bash
$ node cli_args.js foo bar qux
[ 'foo', 'bar', 'qux' ]

$ go run cli_args.go foo bar qux
[foo bar qux]

$ cargo run -- foo bar qux
["foo", "bar", "qux"]

$ swift cli_args.swift foo bar qux
["foo", "bar", "qux"]

$ java Main.java foo bar qux
[foo, bar, qux]
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
```rust
// Cargo.toml: clap = { version = "4", features = ["derive"] }
use clap::Parser;

#[derive(Parser)]
struct Args {
    #[arg(long, default_value = "default value")]
    foo: String,

    #[arg(long, default_value_t = false)] // a bool field automatically becomes a bare flag (--qux, no value)
    qux: bool,
}

fn main() {
    let args = Args::parse();
    println!("foo: {}", args.foo);
    println!("qux: {}", args.qux);
}
```
```swift
// Swift's standard library has no flag-parsing package; parsed by hand for this short example.
// Real projects should reach for the swift-argument-parser package (@main + ParsableCommand) via SwiftPM.
var foo = "default value"
var qux = false

for arg in CommandLine.arguments.dropFirst() {
    if arg == "--qux" {
        qux = true
    } else if arg.hasPrefix("--foo=") {
        foo = String(arg.dropFirst("--foo=".count))
    }
}

print("foo: \(foo)")
print("qux: \(qux)")
```
```java
void main(String[] args) { // java.base has no flag-parsing package; parsed by hand for this short example
    String foo = "default value";
    boolean qux = false;

    for (String arg : args) {
        if (arg.equals("--qux")) {
            qux = true;
        } else if (arg.startsWith("--foo=")) {
            foo = arg.substring("--foo=".length());
        }
    }

    IO.println("foo: " + foo);
    IO.println("qux: " + qux);
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

$ cargo run -- --foo=bar --qux
foo: bar
qux: true

$ swift cli_flags.swift --foo=bar --qux
foo: bar
qux: true

$ java Main.java --foo=bar --qux
foo: bar
qux: true
```

## Key differences

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Raw arguments | `process.argv.slice(2)` | `os.Args[1:]` | `env::args()` | `CommandLine.arguments` | `main`'s `args` parameter |
| Parsing named flags | `util.parseArgs()` | the `flag` package | the `clap` crate | not built in | not built in |
| Flag prefix | `--foo` | `-foo` (one or two dashes both work) | `--foo` | up to your own parsing | up to your own parsing |
| Boolean flags | `--qux` (takes no value) | `-qux` or `-qux=true` (never `-qux true`) | `--qux` (takes no value) | up to your own parsing | up to your own parsing |

:::note
Node.js 18.3 added `util.parseArgs()` to the standard library, replacing third-party flag parsers like `yargs`; the `default` option used above arrived in Node.js 18.11, and `parseArgs()` was experimental until Node.js 20. Boolean flags are plain switches (`--qux`) — passing a value (`--qux=true`) throws `ERR_PARSE_ARGS_INVALID_OPTION_VALUE`.
:::

:::note
`CommandLine` (replacing the older `Process.arguments`/`C_ARGC`/`C_ARGV`) arrived in Swift 3 and lives in the Swift standard library — no `import Foundation` needed to use it, unlike most other I/O examples in this series. This example's actual floor is Swift 4.0, not 3.0: `String` only conforms to `Collection` directly (so calling `arg.dropFirst(...)` straight on a `String`, returning a `Substring`, is valid) starting in Swift 4.0.
:::
