---
title: "TCP Server"
description: "net.createServer của Node.js so với net.Listen và net.Conn của Go để viết một TCP echo server."
date: "2026-09-27"
order: 960
category: io
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [tcp, socket, server, networking]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#tcp-server"
---

Một TCP server chỉ cần: lắng nghe một port, chấp nhận kết nối, rồi đọc/ghi dữ liệu trên từng kết nối. Node.js xử lý mỗi socket bằng event (`'data'`, hoặc ở đây là `pipe`), còn Go xử lý mỗi kết nối trong một goroutine riêng, đọc bằng `bufio.Reader`.

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
`io.Copy(conn, conn)` là tương đương trực tiếp của `socket.pipe(socket)`. Ví dụ trên dùng `bufio.Reader` thay vì vậy, vì nó cần thêm tiền tố `"Received: "` vào mỗi dòng, thay vì chỉ copy nguyên luồng byte.
:::
