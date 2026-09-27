---
title: "Reading from Stdin"
description: "How Node.js's readline/promises compares to bufio.Reader (Go), io::stdin (Rust), readLine() (Swift), and IO.readln (Java) for reading a line of input."
tags: [stdin, readline, io, cli]
---

Reading interactive input means waiting for a line of text that ends with Enter. Node.js has the `readline/promises` module so you can `await` the answer, Go uses a `bufio.Reader` that reads up to the newline character, Rust reads through `io::stdin().read_line()`, Swift has a built-in global `readLine()` function, and Java 25 has `IO.readln(prompt)` — printing the prompt and reading a line in a single call.

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
```rust
use std::io::{self, Write};

fn main() {
    print!("Enter name: ");
    io::stdout().flush().unwrap(); // print! doesn't auto-flush, so flush before reading

    let mut name = String::new();
    io::stdin().read_line(&mut name).unwrap();
    let name = name.trim(); // read_line keeps the trailing '\n'

    println!("Your name is: {name}");
}
```
```swift
print("Enter name: ", terminator: "")
let name = readLine() ?? ""
print("Your name is: \(name)")
```
```java
void main() {
    String name = IO.readln("Enter name: ");
    IO.println("Your name is: " + name);
}
```
:::

```bash
Enter name: bob
Your name is: bob
```

:::note
Since Node.js 17, `node:readline/promises` replaces the legacy `process.openStdin()` (not listed in the process docs) — `createInterface().question()` returns a `Promise` you can `await` instead of registering a `'data'` listener and manually calling `.pause()`. `node:readline/promises` was experimental until Node.js 24.0.
:::

:::note
`IO.readln(String)` is part of `java.lang.IO`, finalized in Java 25 (JEP 512) — it prints the prompt and reads a line from stdin, folding the old two-step `System.out.print` + `BufferedReader.readLine()` into one call. Preview history: JEP 445 (Java 21) only previewed unnamed classes and instance main methods, with no `IO` class yet (you still had to call `System.out.println`); `IO` first showed up as a preview API, `java.io.IO`, in Java 23 (JEP 477), then moved to `java.lang.IO` once it was finalized in Java 25.
:::
