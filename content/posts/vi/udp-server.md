---
title: "UDP Server"
description: "dgram.createSocket của Node.js so với net.ListenUDP của Go để nhận datagram UDP."
date: "2026-09-27"
order: 970
category: io
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [udp, socket, server, networking]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#udp-server"
---

UDP là giao thức không kết nối: không có `Accept()` để chờ client, mỗi gói tin (datagram) tự mang theo địa chỉ người gửi. Node.js dùng module `dgram` với event `'message'`, còn Go đọc trực tiếp bằng `ReadFromUDP` trong một vòng lặp.

## Server nhận datagram

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
