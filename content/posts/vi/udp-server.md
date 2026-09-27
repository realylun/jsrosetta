---
title: "UDP Server"
description: "dgram.createSocket của Node.js so với net.ListenUDP (Go), UdpSocket (Rust), Network.framework (Swift) và DatagramSocket (Java) để nhận datagram."
date: "2026-09-27"
order: 970
category: io
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.58"
  swift: "5.7"
  java: "25"
tags: [udp, socket, server, networking]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#udp-server"
---

UDP là giao thức không kết nối: không có `Accept()` để chờ client, mỗi gói tin (datagram) tự mang theo địa chỉ người gửi. Node.js dùng module `dgram` với event `'message'`, Go và Rust đọc trực tiếp bằng `ReadFromUDP`/`recv_from` trong một vòng lặp, Swift lại dùng `Network.framework` (không có socket UDP thô nào trong Foundation), còn Java dùng `DatagramSocket`/`DatagramPacket` có sẵn từ những phiên bản đầu tiên.

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
```rust
use std::net::UdpSocket;

fn main() {
    let socket = UdpSocket::bind("0.0.0.0:3000").unwrap();
    println!("server listening {}", socket.local_addr().unwrap());

    let mut buf = [0u8; 20];
    loop {
        let (len, remote) = socket.recv_from(&mut buf).unwrap();
        let data = String::from_utf8_lossy(&buf[..len]);
        let data = data.trim();
        println!("received: {data} from {remote}");
    }
}
```
```swift
import Network

let listener = try NWListener(using: .udp, on: 3000)
print("server listening 0.0.0.0:3000")

listener.newConnectionHandler = { connection in
    connection.start(queue: .main)
    connection.receiveMessage { data, _, _, _ in
        if let data, let text = String(data: data, encoding: .utf8) {
            let endpoint = connection.currentPath?.remoteEndpoint
            print("received: \(text.trimmingCharacters(in: .whitespacesAndNewlines)) from \(endpoint?.debugDescription ?? "?")")
        }
        connection.cancel() // mỗi datagram từ một địa chỉ mới sinh ra một "connection" giả riêng
    }
}

listener.start(queue: .main)
dispatchMain()
```
```java
void main() throws Exception {
    try (var socket = new DatagramSocket(3000)) {
        IO.println("server listening 0.0.0.0:3000");

        byte[] buf = new byte[20];
        while (true) {
            var packet = new DatagramPacket(buf, buf.length);
            socket.receive(packet);

            String data = new String(packet.getData(), 0, packet.getLength()).trim();
            IO.println("received: " + data + " from " + packet.getAddress().getHostAddress() + ":" + packet.getPort());
        }
    }
}
```
:::

```bash
$ node udp_server.js
server listening 0.0.0.0:3000
received: hello world from 127.0.0.1:59740

$ go run udp_server.go
server listening [::]:3000
received: hello world from 127.0.0.1:52082

$ cargo run
server listening 0.0.0.0:3000
received: hello world from 127.0.0.1:53544

$ swift udp_server.swift
server listening 0.0.0.0:3000
received: hello world from 127.0.0.1:52756

$ java Main.java
server listening 0.0.0.0:3000
received: hello world from 127.0.0.1:55056
```

:::note
Dù code Go truyền `IP: net.ParseIP("0.0.0.0")`, `conn.LocalAddr()` lại in ra `[::]:3000` — với network chung `"udp"`, listener dual-stack của Go báo địa chỉ "unspecified" theo dạng IPv6 thay vì lặp lại đúng địa chỉ IPv4 đã yêu cầu. Rust và Java in lại đúng `0.0.0.0` như đã bind.
:::

:::note
`Network.framework` biểu diễn UDP theo kiểu "connection" (mỗi địa chỉ gửi tới sinh một `NWConnection` riêng qua `newConnectionHandler`) dù bản chất giao thức là connectionless — khác hẳn model callback đơn giản kiểu `dgram`/`net.ListenUDP` của Node.js/Go. Cú pháp `if let data` cần Swift 5.7 trở lên.
:::
