---
title: "Tra cứu DNS"
description: "node:dns/promises của Node.js so với package net (Go), hickory-resolver (Rust), Host (Swift, chỉ A/AAAA) và JNDI (Java) để tra cứu DNS."
date: "2026-09-27"
order: 990
category: io
languages: [js, go, rust, swift, java]
versions:
  js: "15"
  go: "1.9"
  rust: "1.71.1"
  swift: "1.0"
  java: "25"
tags: [dns, lookup, networking, io]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#dns"
---

Tra cứu DNS (NS, A/AAAA, MX, TXT) có sẵn trong standard library của Node.js và Go, không cần thư viện ngoài. Rust std chỉ tra được A/AAAA qua `ToSocketAddrs` (dùng resolver của hệ điều hành) — muốn NS/MX/TXT phải dùng crate `hickory-resolver`, một resolver DNS thuần Rust chạy trong tiến trình, không qua libc. Swift/Foundation còn hạn chế hơn: chỉ có A/AAAA (qua `Host`), không có API nào cho NS/MX/TXT cả. Java có `InetAddress` cho A/AAAA và JNDI (`com.sun.jndi.dns.DnsContextFactory`) cho mọi loại record khác — kỹ thuật cũ nhưng vẫn hoạt động tốt trên JDK hiện đại.

## Tra cứu NS, IP, MX, TXT

:::tabs
```js
import dns from 'node:dns/promises'

const ns = await dns.resolveNs('google.com')
console.log(ns)

const ips = await dns.resolve4('google.com')
console.log(ips)

const mx = await dns.resolveMx('google.com')
console.log(mx)

const txt = await dns.resolveTxt('google.com')
console.log(txt)
```
```go
package main

import (
	"fmt"
	"net"
)

func main() {
	ns, err := net.LookupNS("google.com")
	if err != nil {
		panic(err)
	}
	for _, n := range ns {
		fmt.Println(n.Host)
	}

	ips, err := net.LookupIP("google.com")
	if err != nil {
		panic(err)
	}
	fmt.Println(ips)

	mx, err := net.LookupMX("google.com")
	if err != nil {
		panic(err)
	}
	for _, m := range mx {
		fmt.Println(m.Host, m.Pref)
	}

	txt, err := net.LookupTXT("google.com")
	if err != nil {
		panic(err)
	}
	fmt.Println(txt)
}
```
```rust
// Cargo.toml: hickory-resolver = "0.25"
// Cargo.toml: tokio = { version = "1", features = ["full"] }
use hickory_resolver::Resolver;

#[tokio::main]
async fn main() {
    // std::net::ToSocketAddrs (qua resolver hệ điều hành) chỉ cho A/AAAA;
    // NS/MX/TXT cần một resolver DNS thật như hickory-resolver.
    let resolver = Resolver::builder_tokio().unwrap().build();

    let ns = resolver.ns_lookup("google.com").await.unwrap();
    for n in ns.iter() {
        println!("{n}");
    }

    let ips = resolver.lookup_ip("google.com").await.unwrap();
    for ip in ips.iter() {
        println!("{ip}");
    }

    let mx = resolver.mx_lookup("google.com").await.unwrap();
    for m in mx.iter() {
        println!("{} {}", m.exchange(), m.preference());
    }

    let txt = resolver.txt_lookup("google.com").await.unwrap();
    for t in txt.iter() {
        println!("{t}");
    }
}
```
```swift
import Foundation

// Foundation/Network.framework không có API tra NS/MX/TXT — chỉ tra được A/AAAA.
// Muốn NS/MX/TXT phải gọi thư viện C `dnssd` (DNSServiceQueryRecord) hoặc dùng gói bên thứ ba.
let host = Host(name: "google.com")
print(host.addresses)
```
```java
import java.net.InetAddress;
import java.util.Hashtable;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.InitialDirContext;

void main() throws Exception {
    var env = new Hashtable<String, String>();
    env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
    var ctx = new InitialDirContext(env);

    Attribute ns = ctx.getAttributes("google.com", new String[] { "NS" }).get("NS");
    for (int i = 0; i < ns.size(); i++) {
        IO.println(ns.get(i));
    }

    for (var ip : InetAddress.getAllByName("google.com")) {
        IO.println(ip.getHostAddress());
    }

    Attribute mx = ctx.getAttributes("google.com", new String[] { "MX" }).get("MX");
    for (int i = 0; i < mx.size(); i++) {
        IO.println(mx.get(i));
    }

    Attribute txt = ctx.getAttributes("google.com", new String[] { "TXT" }).get("TXT");
    for (int i = 0; i < txt.size(); i++) {
        IO.println(txt.get(i));
    }
}
```
:::

```bash
# kết quả DNS thay đổi theo thời điểm tra cứu, TXT được rút gọn bằng …
# (Node.js, Go, Rust, Java tra được cả NS/A/MX/TXT; Swift ở trên chỉ tra được A/AAAA)
ns1.google.com.
[142.251.12.138 142.251.12.102 …]
smtp.google.com. 10
[v=spf1 include:_spf.google.com ~all …]
```

:::note
Node.js 15 làm cho promise API import được trực tiếp qua `node:dns/promises` (trước đó chỉ có `dns.promises`); nhờ top-level `await`, mỗi lần tra cứu chạy tuần tự theo đúng thứ tự `await`, thay vì phải lồng callback.
:::

:::note
`hickory-resolver` (kế thừa `trust-dns-resolver`) là resolver DNS thuần Rust, tự gửi/nhận gói UDP tới nameserver thay vì gọi `getaddrinfo` của libc như `std::net::ToSocketAddrs` — nhờ vậy tra được mọi loại record (NS, MX, TXT…), không chỉ A/AAAA. Bản 0.25 yêu cầu Rust 1.71.1+ (MSRV).
:::

## Đổi DNS resolver server

:::tabs
```js
dns.setServers(['1.1.1.1'])
console.log(dns.getServers())

const ns2 = await dns.resolveNs('google.com')
console.log(ns2)
```
```go
// thêm import "context", "time" vào cùng file với ví dụ ở trên
r := &net.Resolver{
	PreferGo: true,
	Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
		d := net.Dialer{
			Timeout: 10 * time.Second,
		}
		return d.DialContext(ctx, "udp", "1.1.1.1:53")
	},
}

ns, err = r.LookupNS(context.Background(), "google.com")
if err != nil {
	panic(err)
}
for _, n := range ns {
	fmt.Println(n.Host)
}
```
```rust
// thêm vào cùng file với ví dụ ở trên
use std::net::{IpAddr, Ipv4Addr};
use hickory_resolver::config::{NameServerConfigGroup, ResolverConfig};
use hickory_resolver::name_server::TokioConnectionProvider;

let config = ResolverConfig::from_parts(
    None,
    vec![],
    NameServerConfigGroup::from_ips_clear(&[IpAddr::V4(Ipv4Addr::new(1, 1, 1, 1))], 53, true),
);
let resolver = Resolver::builder_with_config(config, TokioConnectionProvider::default()).build();

let ns2 = resolver.ns_lookup("google.com").await.unwrap();
for n in ns2.iter() {
    println!("{n}");
}
```
```swift
// Foundation/Network.framework luôn dùng resolver hệ thống — không có API hỗ trợ trỏ
// thẳng tới một DNS server cụ thể như net.Resolver{Dial: …} của Go. Muốn làm được phải
// tự gửi gói DNS qua UDP tới 1.1.1.1:53 bằng tay, vượt ngoài phạm vi ví dụ ngắn này.
```
```java
// tạo InitialDirContext mới với "java.naming.provider.url" trỏ tới 1.1.1.1
var env2 = new Hashtable<String, String>();
env2.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
env2.put("java.naming.provider.url", "dns://1.1.1.1");
var ctx2 = new InitialDirContext(env2);

Attribute ns2 = ctx2.getAttributes("google.com", new String[] { "NS" }).get("NS");
for (int i = 0; i < ns2.size(); i++) {
    IO.println(ns2.get(i));
}
```
:::

:::note
Field `Dial` của `net.Resolver` — dùng ở trên để gửi truy vấn tới `1.1.1.1` thay vì resolver mặc định của hệ thống — được thêm từ Go 1.9.
:::

:::note
Swift/Foundation không có khái niệm "custom resolver": `Host` và `Network.framework` luôn tra cứu qua resolver hệ thống, không có tham số nào để chỉ định nameserver khác — đây là giới hạn thật của nền tảng, không phải thiếu sót trong ví dụ.
:::
