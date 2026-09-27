---
title: "TCP Server"
description: "net.createServer của Node.js so với net.Listen (Go), TcpListener (Rust), Network.framework (Swift) và ServerSocket (Java) để viết một TCP echo server."
date: "2026-09-27"
order: 960
category: io
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.65"
  swift: "5.7"
  java: "25"
tags: [tcp, socket, server, networking]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#tcp-server"
---

Một TCP server chỉ cần: lắng nghe một port, chấp nhận kết nối, rồi đọc/ghi dữ liệu trên từng kết nối. Node.js xử lý mỗi socket bằng event, Go và Rust xử lý mỗi kết nối trong một thread/goroutine riêng (Rust không có goroutine — `thread::spawn` tạo hẳn một OS thread thật, tốn kém hơn; muốn nhẹ như goroutine phải dùng runtime async như tokio). Swift dùng `Network.framework` (Apple, không có socket API nào trong Foundation). Java 25 xử lý mỗi kết nối bằng một **virtual thread** (`Thread.ofVirtual()`, chính thức từ Java 21) — rẻ gần bằng goroutine, không cần thread pool.

## Echo server

:::tabs
```js
import net from 'node:net'

function handler(socket) {
  socket.write('Received: ')
  socket.pipe(socket)
}

const server = net.createServer(handler)
server.listen(3000)
```
```go
package main

import (
	"bufio"
	"net"
)

func handler(conn net.Conn) {
	defer conn.Close()
	reader := bufio.NewReader(conn)

	for {
		message, err := reader.ReadString('\n')
		if err != nil {
			return
		}

		conn.Write([]byte("Received: "))
		conn.Write([]byte(message))
	}
}

func main() {
	listener, err := net.Listen("tcp", ":3000")
	if err != nil {
		panic(err)
	}

	defer listener.Close()

	for {
		conn, err := listener.Accept()
		if err != nil {
			panic(err)
		}

		go handler(conn)
	}
}
```
```rust
use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use std::thread;

fn handler(stream: std::net::TcpStream) {
    let mut writer = stream.try_clone().unwrap();
    let reader = BufReader::new(stream);

    for line in reader.lines() {
        let Ok(line) = line else { break };
        writer.write_all(b"Received: ").unwrap();
        writer.write_all(line.as_bytes()).unwrap();
        writer.write_all(b"\n").unwrap();
    }
}

fn main() {
    let listener = TcpListener::bind("0.0.0.0:3000").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();
        thread::spawn(move || handler(stream)); // một OS thread thật cho mỗi kết nối
    }
}
```
```swift
import Network

let listener = try NWListener(using: .tcp, on: 3000)

listener.newConnectionHandler = { connection in
    connection.start(queue: .main)
    receive(on: connection)
}

func receive(on connection: NWConnection) {
    connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { data, _, isComplete, error in
        if let data, !data.isEmpty {
            connection.send(content: "Received: ".data(using: .utf8)! + data, completion: .contentProcessed { _ in })
        }
        if isComplete || error != nil {
            connection.cancel()
        } else {
            receive(on: connection) // đọc tiếp gói tiếp theo
        }
    }
}

listener.start(queue: .main)
dispatchMain()
```
```java
void handle(Socket socket) throws Exception {
    try (socket;
         var reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
         var writer = new PrintWriter(socket.getOutputStream(), true)) {

        String line;
        while ((line = reader.readLine()) != null) {
            writer.println("Received: " + line);
        }
    }
}

void main() throws Exception {
    try (var server = new ServerSocket(3000)) {
        while (true) {
            Socket socket = server.accept();
            Thread.ofVirtual().start(() -> { // virtual thread, không phải OS thread thật
                try {
                    handle(socket);
                } catch (Exception e) {
                    // kết nối đóng hoặc lỗi
                }
            });
        }
    }
}
```
:::

```bash
$ echo 'hello' | nc localhost 3000
Received: hello
```

:::tip
`io.Copy(conn, conn)` là tương đương trực tiếp của `socket.pipe(socket)`. Ví dụ trên dùng `bufio.Reader` thay vì vậy, vì nó cần thêm tiền tố `"Received: "` vào mỗi dòng, thay vì chỉ copy nguyên luồng byte.
:::

:::note
Rust std không có gì tương đương goroutine: `thread::spawn` tạo một OS thread thật cho mỗi kết nối, tốn bộ nhớ/context-switch hơn hẳn goroutine. Với nhiều kết nối đồng thời, cách phổ biến là dùng `tokio::net::TcpListener` + `tokio::spawn` (task bất đồng bộ, nhẹ như goroutine) thay vì `std::net` + `thread::spawn`.
:::

:::note
Swift không có socket API trong Foundation; ví dụ trên dùng `Network.framework` (chỉ có trên nền tảng Apple, cần macOS 10.14+). Cú pháp `if let data` (không cần `= data`) cần Swift 5.7 trở lên. Ví dụ trên echo lại theo từng chunk nhận được từ `receive()` (`minimumIncompleteLength: 1`), không gom theo dòng như `bufio`/`BufferedReader` ở các ngôn ngữ khác — với input ngắn một dòng như ở đây thì kết quả giống hệt, nhưng dữ liệu lớn hơn một chunk TCP có thể bị echo thành nhiều lần hoặc một dòng chưa trọn vẹn.
:::

:::note
`Thread.ofVirtual()` (virtual thread) chính thức hoá ở Java 21 (JEP 444) sau vài bản preview — hàng triệu virtual thread có thể chạy đồng thời trên một số lượng nhỏ OS thread (carrier thread), khiến mô hình "một thread cho mỗi kết nối" ở Java rẻ ngang goroutine của Go, thay vì tốn kém như platform thread truyền thống.
:::
