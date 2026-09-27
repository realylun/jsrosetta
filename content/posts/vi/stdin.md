---
title: "Đọc từ Stdin"
description: "readline/promises của Node.js so với bufio.Reader (Go), io::stdin (Rust), readLine() (Swift) và IO.readln (Java) để đọc một dòng nhập."
date: "2026-09-27"
order: 920
category: io
languages: [js, go, rust, swift, java]
versions:
  js: "17"
  go: "1.0"
  rust: "1.58"
  swift: "2.0"
  java: "25"
tags: [stdin, readline, io, cli]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#stdin"
---

Đọc input tương tác từ người dùng nghĩa là đợi một dòng text kết thúc bằng Enter. Node.js có module `readline/promises` để `await` câu trả lời, Go dùng `bufio.Reader` đọc tới ký tự xuống dòng, Rust đọc qua `io::stdin().read_line()`, Swift có sẵn hàm toàn cục `readLine()`, còn Java 25 có `IO.readln(prompt)` — in prompt và đọc một dòng chỉ trong một lời gọi.

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
```rust
use std::io::{self, Write};

fn main() {
    print!("Enter name: ");
    io::stdout().flush().unwrap(); // print! không tự flush, phải flush thủ công trước khi đọc

    let mut name = String::new();
    io::stdin().read_line(&mut name).unwrap();
    let name = name.trim(); // read_line giữ lại ký tự '\n'

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
Từ Node.js 17, `node:readline/promises` thay thế `process.openStdin()` cũ (không có trong docs của `process`) — `createInterface().question()` trả về `Promise` có thể `await` thay vì phải đăng ký listener `'data'` rồi tự gọi `.pause()`. `node:readline/promises` ở trạng thái experimental cho tới Node.js 24.0.
:::

:::note
`IO.readln(String)` là một phần của `java.lang.IO`, chính thức hoá ở Java 25 (JEP 512) — in ra prompt rồi đọc một dòng từ stdin, gộp hai bước `System.out.print` + `BufferedReader.readLine()` cũ thành một lời gọi. Lịch sử preview của tính năng này: JEP 445 (Java 21) mới chỉ preview unnamed class + instance main method, chưa có lớp `IO` (lúc đó vẫn phải gọi `System.out.println`); `IO` lần đầu xuất hiện dưới dạng preview là `java.io.IO` ở Java 23 (JEP 477), rồi mới chuyển sang `java.lang.IO` khi ổn định ở Java 25.
:::
