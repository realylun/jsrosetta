---
title: "TCP Server"
description: "How Node.js's net.createServer compares to Go's net.Listen and net.Conn for writing a TCP echo server."
tags: [tcp, socket, server, networking]
---

A TCP server just needs to: listen on a port, accept connections, then read/write data on each one. Node.js handles each socket with events (`'data'`, or here, `pipe`), while Go handles each connection in its own goroutine, reading with a `bufio.Reader`.

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
:::

```bash
$ echo 'hello' | nc localhost 3000
Received: hello
```

:::tip
Go has no built-in `.pipe()` for sockets — the `for { reader.ReadString(...) }` loop is the common idiom for processing a continuous stream of data.
:::
