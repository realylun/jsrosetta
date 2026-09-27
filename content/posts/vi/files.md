---
title: "Đọc, ghi và xoá file"
description: "readFile/writeFile của Node.js so với os.ReadFile/os.WriteFile (Go), std::fs (Rust), FileManager (Swift) và java.nio.file.Files (Java)."
date: "2026-09-27"
order: 900
category: io
languages: [js, go, rust, swift, java]
versions:
  js: "14.13.1"
  go: "1.16"
  rust: "1.58"
  swift: "2.0"
  java: "25"
tags: [files, fs, filesystem, io]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#files"
---

Cả năm ngôn ngữ đều có API bậc cao để tạo, đọc và xoá file mà không cần quản lý file descriptor thủ công. Node.js dùng các hàm `Promise`-based trong `node:fs/promises`; Go trả về `(giá trị, error)` trực tiếp — không có exception, chỉ có `err` bạn phải kiểm tra ngay sau mỗi lời gọi; Rust cũng trả `Result` nhưng dùng `?` để đẩy lỗi lên thay vì kiểm tra thủ công; Swift và Java dùng exception (`throws`/`try`) giống JavaScript, chỉ chặt hơn về kiểu lỗi.

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
```rust
use std::fs;

fn main() -> std::io::Result<()> {
    // tạo file (và ghi vào đó)
    fs::write("test.txt", "hello world.")?;

    // đọc file
    let contents = fs::read_to_string("test.txt")?;
    println!("{contents}");

    // xoá file
    fs::remove_file("test.txt")?;

    Ok(())
}
```
```swift
import Foundation

// tạo file (và ghi vào đó)
try "hello world.".write(toFile: "test.txt", atomically: true, encoding: .utf8)

// đọc file
let contents = try String(contentsOfFile: "test.txt", encoding: .utf8)
print(contents)

// xoá file
try FileManager.default.removeItem(atPath: "test.txt")
```
```java
void main() throws Exception {
    Path path = Path.of("test.txt");

    // tạo file (và ghi vào đó)
    Files.writeString(path, "hello world.");

    // đọc file
    String contents = Files.readString(path);
    IO.println(contents);

    // xoá file
    Files.delete(path);
}
```
:::

```bash
hello world.
```

:::note
Go 1.16 thêm `os.ReadFile`/`os.WriteFile` thay cho `ioutil.ReadFile`/`ioutil.WriteFile` cũ; gói `io/ioutil` đã deprecated, đừng dùng trong code mới.
:::

:::note
Từ Java 25, JEP 512 chính thức hoá **compact source file + instance main**: không cần `class Main { public static void main(String[] args) { … } }`, chỉ cần `void main() { … }` ở top-level cùng các phương thức/record khác. Các kiểu trong `java.base` như `Path`, `Files`, `List`, `Map`… được tự động import — chỉ cần `import` tường minh khi dùng module khác (`java.net.http`, `java.naming`…). `IO.println` (cũng thuộc JEP 512) thay cho `System.out.println` trong các ví dụ compact source file.
:::
