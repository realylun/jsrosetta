---
title: "UDP Server"
description: "How Node.js's dgram.createSocket compares to Go's net.ListenUDP for receiving UDP datagrams."
tags: [udp, socket, server, networking]
---

UDP is a connectionless protocol: there's no `Accept()` to wait for a client, and each datagram carries the sender's address with it. Node.js uses the `dgram` module with a `'message'` event, while Go reads directly with `ReadFromUDP` in a loop.

## Datagram server

:::tabs
```js
import dgram from 'node:dgram'

const server = dgram.createSocket('udp4')

server.on('error', err => {
  console.error(err)
  server.close()
})

server.on('message', (msg, rinfo) => {
  const data = msg.toString('utf8').trim()
  console.log(`received: ${data} from ${rinfo.address}:${rinfo.port}`)
})

server.on('listening', () => {
  const address = server.address()
  console.log(`server listening ${address.address}:${address.port}`)
})

server.bind(3000)
```
```go
package main

import (
	"fmt"
	"net"
	"strings"
)

func main() {
	conn, err := net.ListenUDP("udp", &net.UDPAddr{
		Port: 3000,
		IP:   net.ParseIP("0.0.0.0"),
	})
	if err != nil {
		panic(err)
	}

	defer conn.Close()
	fmt.Printf("server listening %s\n", conn.LocalAddr().String())

	for {
		message := make([]byte, 20)
		rlen, remote, err := conn.ReadFromUDP(message[:])
		if err != nil {
			panic(err)
		}

		data := strings.TrimSpace(string(message[:rlen]))
		fmt.Printf("received: %s from %s\n", data, remote)
	}
}
```
:::

```bash
$ echo 'hello world' > /dev/udp/0.0.0.0/3000

server listening 0.0.0.0:3000
received: hello world from 127.0.0.1:61624
```
