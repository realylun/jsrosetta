---
title: "UDP Server"
description: "How Node.js's dgram.createSocket compares to net.ListenUDP (Go), UdpSocket (Rust), Network.framework (Swift), and DatagramSocket (Java) for receiving datagrams."
tags: [udp, socket, server, networking]
---

UDP is a connectionless protocol: there's no `Accept()` to wait for a client, and each datagram carries the sender's address with it. Node.js uses the `dgram` module with a `'message'` event, Go and Rust read directly with `ReadFromUDP`/`recv_from` in a loop, Swift again uses `Network.framework` (Foundation has no raw UDP socket API), and Java uses `DatagramSocket`/`DatagramPacket`, available since its earliest versions.

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
        connection.cancel() // each new sender address spawns its own pseudo "connection"
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
Even though the Go code passes `IP: net.ParseIP("0.0.0.0")`, `conn.LocalAddr()` prints `[::]:3000` — with the generic `"udp"` network, Go's dual-stack listener reports the unspecified address in its IPv6 form rather than echoing back the IPv4 address that was requested. Rust actually calls `socket.local_addr()`, so it correctly prints `0.0.0.0` as bound. Swift and Java above just print a fixed string that matches the parameters they were given, rather than querying the socket's real state — query it for real with `getLocalSocketAddress()`, and Java's `DatagramSocket(int)` also binds dual-stack by default and reports the same IPv6-form unspecified address, exactly like Go's quirk.
:::

:::note
`Network.framework` models UDP as "connections" (each sender address spawns its own `NWConnection` via `newConnectionHandler`) even though the protocol itself is connectionless — quite different from the plain callback model of `dgram`/`net.ListenUDP` in Node.js/Go. The `if let data` shorthand requires Swift 5.7 or later.
:::
