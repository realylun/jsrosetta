---
title: "Environment Variables"
description: "How Node.js's process.env compares to os.Getenv (Go), env::var (Rust), ProcessInfo.environment (Swift), and System.getenv (Java)."
tags: [env, environment-variables, config, io]
---

Reading an environment variable is one of the simplest I/O operations there is, but access differs slightly: Node.js treats `process.env` like an object; Go, Rust, and Java all use a function that takes the variable's name, while Swift indexes the `environment` dictionary with a subscript. Go returns an empty string when the variable doesn't exist, Rust returns a `Result` (use `unwrap_or_default()` to get a similarly empty string), and Swift and Java return `nil`/`null`.

## Reading an environment variable

:::tabs
```js
const key = process.env['API_KEY']

console.log(key)
```
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	key := os.Getenv("API_KEY")

	fmt.Println(key)
}
```
```rust
use std::env;

fn main() {
    let key = env::var("API_KEY").unwrap_or_default(); // Err if the variable is missing or not valid UTF-8
    println!("{key}");
}
```
```swift
import Foundation

let key = ProcessInfo.processInfo.environment["API_KEY"] ?? ""
print(key)
```
```java
void main() {
    String key = System.getenv("API_KEY"); // null if the variable doesn't exist
    IO.println(key);
}
```
:::

```bash
$ API_KEY=foobar node env_vars.js
foobar

$ API_KEY=foobar go run env_vars.go
foobar

$ API_KEY=foobar cargo run
foobar

$ API_KEY=foobar swift env_vars.swift
foobar

$ API_KEY=foobar java Main.java
foobar
```
