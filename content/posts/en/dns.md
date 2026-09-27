---
title: "DNS Lookups"
description: "How Node.js's node:dns/promises compares to the net package (Go), hickory-resolver (Rust), getaddrinfo (Swift, A/AAAA only), and JNDI (Java) for DNS lookups."
tags: [dns, lookup, networking, io]
---

DNS lookups (NS, A/AAAA, MX, TXT) are available in the standard library of both Node.js and Go, with no third-party dependency needed. Rust's std can only look up A/AAAA through `ToSocketAddrs` (using the OS resolver) — NS/MX/TXT need the `hickory-resolver` crate, a pure-Rust, in-process DNS resolver that doesn't go through libc. Swift/Foundation is even more limited: only A/AAAA (via `getaddrinfo`, since `Host` is to-be-deprecated and macOS-only), with no API at all for NS/MX/TXT. Java has `InetAddress` for A/AAAA and JNDI (`com.sun.jndi.dns.DnsContextFactory`) for every other record type — an old technique, but one that still works fine on modern JDKs.

## Looking up NS, IP, MX, and TXT records

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
// Cargo.toml: hickory-resolver = "0.26"
// Cargo.toml: tokio = { version = "1", features = ["full"] }
use hickory_resolver::Resolver;

#[tokio::main]
async fn main() {
    // std::net::ToSocketAddrs (via the OS resolver) only gives you A/AAAA;
    // NS/MX/TXT need a real DNS resolver like hickory-resolver.
    let resolver = Resolver::builder_tokio().unwrap().build().unwrap();

    let ns = resolver.ns_lookup("google.com").await.unwrap();
    for n in ns.answers() {
        println!("{}", n.data); // RData has its own Display; NS/MX print with a trailing dot
    }

    let ips = resolver.lookup_ip("google.com").await.unwrap();
    for ip in ips.iter() {
        println!("{ip}"); // one address per line, not gathered into an array like Go/Node
    }

    let mx = resolver.mx_lookup("google.com").await.unwrap();
    for m in mx.answers() {
        println!("{}", m.data); // "priority host.", e.g. "10 smtp.google.com."
    }

    let txt = resolver.txt_lookup("google.com").await.unwrap();
    for t in txt.answers() {
        println!("{}", t.data);
    }
}
```
```swift
import Foundation

// Host is to-be-deprecated (API_TO_BE_DEPRECATED in the header) and macOS-only; getaddrinfo
// (POSIX, also works on Linux) is the more portable way to look up A/AAAA. Foundation/Network.framework
// has no NS/MX/TXT lookup API at all -- that would require the C `dnssd` library or a third-party package.
var hints = addrinfo(ai_flags: 0, ai_family: AF_UNSPEC, ai_socktype: SOCK_STREAM,
                      ai_protocol: 0, ai_addrlen: 0, ai_canonname: nil, ai_addr: nil, ai_next: nil)
var info: UnsafeMutablePointer<addrinfo>?
guard getaddrinfo("google.com", nil, &hints, &info) == 0 else { fatalError("lookup failed") }
defer { freeaddrinfo(info) }

var addresses: [String] = []
var node = info
while let n = node {
    var buf = [Int8](repeating: 0, count: Int(NI_MAXHOST))
    getnameinfo(n.pointee.ai_addr, n.pointee.ai_addrlen, &buf, socklen_t(buf.count), nil, 0, NI_NUMERICHOST)
    addresses.append(String(cString: buf))
    node = n.pointee.ai_next
}
print(addresses)
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
    if (txt != null) { // get("TXT") returns null if the domain has no TXT record
        for (int i = 0; i < txt.size(); i++) {
            IO.println(txt.get(i));
        }
    }
}
```
:::

```bash
# DNS answers vary between lookups; TXT records trimmed with …
# (Node.js, Go, Rust, and Java can look up NS/A/MX/TXT; Swift above only gets A/AAAA)
ns1.google.com.
[142.251.12.138 142.251.12.102 …]
smtp.google.com. 10
[v=spf1 include:_spf.google.com ~all …]
```

:::note
The actual printed format differs across languages more than the block above suggests: Rust prints each IP/record on its own line (no array grouping); Rust and Java print MX in "priority host." order — e.g. `10 smtp.google.com.` — while Go formats it as "host priority" (`smtp.google.com. 10`); Java's `Attribute.toString()` wraps a TXT value in quotes when it contains spaces (e.g. the SPF record), the other languages don't.
:::

:::note
Node.js 15 made the promise API importable directly via `node:dns/promises` (before, only as `dns.promises`); with top-level `await`, each lookup runs in the exact order it's awaited, instead of nesting callbacks.
:::

:::note
`hickory-resolver` (the successor to `trust-dns-resolver`) is a pure-Rust DNS resolver that sends and receives UDP packets to a nameserver itself, instead of calling libc's `getaddrinfo` like `std::net::ToSocketAddrs` does — which is how it can look up any record type (NS, MX, TXT…), not just A/AAAA. Version 0.26 requires Rust 1.88+ (MSRV); as of this version `ResolverBuilder::build()` returns a `Result` so it needs an extra `.unwrap()`, and records are read through `.answers()` (returning `&[Record]`, with a `.data` field) instead of the older `.iter()`.
:::

## Changing the DNS resolver server

:::tabs
```js
dns.setServers(['1.1.1.1'])
console.log(dns.getServers())

const ns2 = await dns.resolveNs('google.com')
console.log(ns2)
```
```go
// add "context" and "time" to the imports of the file shown above
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
// add this to the same file as the example above
use std::net::{IpAddr, Ipv4Addr};
use hickory_resolver::config::{NameServerConfig, ResolverConfig};
use hickory_resolver::net::runtime::TokioRuntimeProvider;

let config = ResolverConfig::from_name_servers(vec![
    NameServerConfig::udp_and_tcp(IpAddr::V4(Ipv4Addr::new(1, 1, 1, 1))),
]);
let resolver = Resolver::builder_with_config(config, TokioRuntimeProvider::default())
    .build()
    .unwrap();

let ns2 = resolver.ns_lookup("google.com").await.unwrap();
for n in ns2.answers() {
    println!("{}", n.data);
}
```
```swift
// Foundation/Network.framework (and getaddrinfo) always use the system resolver -- there's no
// supported API to point lookups at a specific DNS server like Go's net.Resolver{Dial: …}. Doing
// that would mean hand-rolling a DNS-over-UDP query to 1.1.1.1:53, beyond this short example's scope.
```
```java
// build a fresh InitialDirContext with "java.naming.provider.url" pointed at 1.1.1.1
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
The `Dial` field of `net.Resolver` — used above to send queries to `1.1.1.1` instead of the system's default resolver — was added in Go 1.9.
:::

:::note
Swift/Foundation has no concept of a "custom resolver": `getaddrinfo` and `Network.framework` always look things up through the system resolver, with no parameter to point at a different nameserver — this is a genuine platform limitation, not something missing from the example.
:::
