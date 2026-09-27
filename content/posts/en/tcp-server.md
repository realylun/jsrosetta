---
title: "TCP Server"
description: "How Node.js's net.createServer compares to net.Listen (Go), TcpListener (Rust), Network.framework (Swift), and ServerSocket (Java) for a TCP echo server."
tags: [tcp, socket, server, networking]
---

A TCP server just needs to: listen on a port, accept connections, then read/write data on each one. Node.js handles each socket with events; Go and Rust handle each connection in its own thread/goroutine (Rust has no goroutines — `thread::spawn` creates a real OS thread, which is heavier; matching a goroutine's lightness needs an async runtime like tokio). Swift uses `Network.framework` (Apple-only; Foundation has no socket API of its own). Java 25 handles each connection with a **virtual thread** (`Thread.ofVirtual()`, finalized in Java 21) — nearly as cheap as a goroutine, no thread pool needed.

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
        thread::spawn(move || handler(stream)); // a real OS thread per connection
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
            receive(on: connection) // wait for the next chunk
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
            Thread.ofVirtual().start(() -> { // a virtual thread, not a real OS thread
                try {
                    handle(socket);
                } catch (Exception e) {
                    // connection closed or errored
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
`io.Copy(conn, conn)` is the direct equivalent of `socket.pipe(socket)`. The example above uses a `bufio.Reader` instead, because it needs to prefix each line with `"Received: "` rather than copying the raw byte stream unmodified.
:::

:::note
Rust's std has nothing equivalent to a goroutine: `thread::spawn` creates a real OS thread per connection, far heavier on memory and context-switching than a goroutine. For many concurrent connections, the common approach is `tokio::net::TcpListener` + `tokio::spawn` (an async task, as lightweight as a goroutine) instead of `std::net` + `thread::spawn`.
:::

:::note
Swift has no socket API in Foundation; the example above uses `Network.framework` (Apple platforms only, requires macOS 10.14+). The `if let data` shorthand (no `= data` needed) requires Swift 5.7 or later. The example echoes back whatever chunk `receive()` hands it (`minimumIncompleteLength: 1`), rather than buffering by line like `bufio`/`BufferedReader` in the other languages — for a short one-line input like this one the result looks identical, but data spanning more than one TCP chunk could get echoed back split across multiple sends, or as a partial line.
:::

:::note
`Thread.ofVirtual()` (virtual threads) was finalized in Java 21 (JEP 444) after a few preview rounds — millions of virtual threads can run concurrently on top of a small number of OS threads (carrier threads), making Java's "one thread per connection" model as cheap as Go's goroutines instead of as expensive as traditional platform threads.
:::
