---
title: "Đối số và cờ dòng lệnh"
description: "process.argv/util.parseArgs của Node.js so với os.Args/flag (Go), env::args (Rust), CommandLine (Swift) và tham số main (Java)."
date: "2026-09-27"
order: 930
category: io
languages: [js, go, rust, swift, java]
versions:
  js: "18.11"
  go: "1.0"
  rust: "1.85"
  swift: "3.0"
  java: "25"
tags: [cli, args, flags, io]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#cli-args"
---

Có hai cách nhận input từ dòng lệnh: đọc thẳng mảng đối số thô, hoặc parse thành cờ có tên (`--foo=bar`). Node.js và Go có sẵn cả hai cách trong standard library. Rust std chỉ có `env::args()` (đối số thô) — cờ có tên phải dùng crate `clap`. Swift và Java không có package parse cờ nào trong standard library/Foundation cả; ví dụ bên dưới tự parse `--foo=`/`--qux` bằng tay, còn dự án thật thường dùng gói `swift-argument-parser` (Swift, qua Swift Package Manager) tương ứng.

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
```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().skip(1).collect(); // args().next() là đường dẫn tới binary
    println!("{args:?}");
}
```
```swift
let args = CommandLine.arguments.dropFirst() // arguments[0] là đường dẫn tới binary
print(Array(args))
```
```java
void main(String[] args) { // args ở đây đã bỏ sẵn đường dẫn tới chương trình
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
```rust
// Cargo.toml: clap = { version = "4", features = ["derive"] }
use clap::Parser;

#[derive(Parser)]
struct Args {
    #[arg(long, default_value = "default value")]
    foo: String,

    #[arg(long, default_value_t = false)] // trường bool tự trở thành cờ trần (--qux, không nhận giá trị)
    qux: bool,
}

fn main() {
    let args = Args::parse();
    println!("foo: {}", args.foo);
    println!("qux: {}", args.qux);
}
```
```swift
// Swift không có package parse cờ trong standard library; parse thủ công cho ví dụ ngắn này.
// Dự án thật nên dùng gói swift-argument-parser (@main + ParsableCommand) qua Swift Package Manager.
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
void main(String[] args) { // java.base không có package parse cờ; parse thủ công cho ví dụ ngắn này
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

## Khác biệt chính

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Đối số thô | `process.argv.slice(2)` | `os.Args[1:]` | `env::args()` | `CommandLine.arguments` | tham số `args` của `main` |
| Parse cờ có tên | `util.parseArgs()` | package `flag` | crate `clap` | không có sẵn | không có sẵn |
| Tiền tố cờ | `--foo` | `-foo` (một hay hai gạch đều được) | `--foo` | tuỳ code tự parse | tuỳ code tự parse |
| Cờ boolean | `--qux` (không nhận giá trị) | `-qux` hoặc `-qux=true` (không phải `-qux true`) | `--qux` (không nhận giá trị) | tuỳ code tự parse | tuỳ code tự parse |

:::note
Node.js 18.3 thêm `util.parseArgs()` vào standard library, thay cho các thư viện parse cờ của bên thứ ba như `yargs`; option `default` dùng ở trên xuất hiện từ Node.js 18.11, và `parseArgs()` ở trạng thái experimental cho tới Node.js 20. Cờ boolean là flag trần (`--qux`) — truyền kèm giá trị (`--qux=true`) sẽ ném lỗi `ERR_PARSE_ARGS_INVALID_OPTION_VALUE`.
:::

:::note
`CommandLine` (thay cho `Process.arguments`/`C_ARGC`/`C_ARGV` cũ) xuất hiện từ Swift 3 và nằm trong Swift standard library — không cần `import Foundation` để dùng, khác với hầu hết ví dụ I/O khác trong loạt bài này.
:::
