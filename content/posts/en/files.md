---
title: "Reading, Writing, and Deleting Files"
description: "How Node.js's readFile/writeFile compares to os.ReadFile/os.WriteFile (Go), std::fs (Rust), FileManager (Swift), and java.nio.file.Files (Java)."
tags: [files, fs, filesystem, io]
---

All five languages have high-level APIs for creating, reading, and deleting files without managing file descriptors by hand. Node.js uses `Promise`-based functions in `node:fs/promises`; Go returns `(value, error)` directly — no exceptions, just an `err` you check right after each call; Rust also returns a `Result`, but uses `?` to propagate the error instead of checking it manually; Swift and Java use exceptions (`throws`/`try`) like JavaScript, just stricter about error types.

## Creating, writing, reading, and deleting a file

:::tabs
```js
import { readFile, unlink, writeFile } from 'node:fs/promises'

// create file (and write to it)
await writeFile('test.txt', 'hello world.')

// read file
const contents = await readFile('test.txt', 'utf8')
console.log(contents)

// delete file
await unlink('test.txt')
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// create file (and write to it)
	if err := os.WriteFile("test.txt", []byte("hello world."), 0644); err != nil {
		panic(err)
	}

	// read file
	contents, err := os.ReadFile("test.txt")
	if err != nil {
		panic(err)
	}

	fmt.Println(string(contents))

	// delete file
	if err := os.Remove("test.txt"); err != nil {
		panic(err)
	}
}
```
```rust
use std::fs;

fn main() -> std::io::Result<()> {
    // create file (and write to it)
    fs::write("test.txt", "hello world.")?;

    // read file
    let contents = fs::read_to_string("test.txt")?;
    println!("{contents}");

    // delete file
    fs::remove_file("test.txt")?;

    Ok(())
}
```
```swift
import Foundation

// create file (and write to it)
try "hello world.".write(toFile: "test.txt", atomically: true, encoding: .utf8)

// read file
let contents = try String(contentsOfFile: "test.txt", encoding: .utf8)
print(contents)

// delete file
try FileManager.default.removeItem(atPath: "test.txt")
```
```java
void main() throws Exception {
    Path path = Path.of("test.txt");

    // create file (and write to it)
    Files.writeString(path, "hello world.");

    // read file
    String contents = Files.readString(path);
    IO.println(contents);

    // delete file
    Files.delete(path);
}
```
:::

```bash
hello world.
```

:::note
Go 1.16 added `os.ReadFile`/`os.WriteFile` to replace the older `ioutil.ReadFile`/`ioutil.WriteFile`; the `io/ioutil` package is deprecated, don't use it in new code.
:::

:::note
Since Java 25, JEP 512 finalizes **compact source files + instance main methods**: no more `class Main { public static void main(String[] args) { … } }`, just a top-level `void main() { … }` alongside other methods/records. Types in `java.base` like `Path`, `Files`, `List`, `Map`… are auto-imported — explicit `import`s are only needed for other modules (`java.net.http`, `java.naming`…). `IO.println` (also from JEP 512) replaces `System.out.println` in these compact source file examples.
:::
