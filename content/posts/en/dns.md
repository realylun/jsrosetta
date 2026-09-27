---
title: "DNS Lookups"
description: "How Node.js's node:dns/promises compares to the net package (Go), hickory-resolver (Rust), Host (Swift, A/AAAA only), and JNDI (Java) for DNS lookups."
tags: [dns, lookup, networking, io]
---

DNS lookups (NS, A/AAAA, MX, TXT) are available in the standard library of both Node.js and Go, with no third-party dependency needed. Rust's std can only look up A/AAAA through `ToSocketAddrs` (using the OS resolver) — NS/MX/TXT need the `hickory-resolver` crate, a pure-Rust, in-process DNS resolver that doesn't go through libc. Swift/Foundation is even more limited: only A/AAAA (via `Host`), with no API at all for NS/MX/TXT. Java has `InetAddress` for A/AAAA and JNDI (`com.sun.jndi.dns.DnsContextFactory`) for every other record type — an old technique, but one that still works fine on modern JDKs.

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
// Cargo.toml: hickory-resolver = "0.25"
// Cargo.toml: tokio = { version = "1", features = ["full"] }
use hickory_resolver::Resolver;

#[tokio::main]
async fn main() {
    // std::net::ToSocketAddrs (via the OS resolver) only gives you A/AAAA;
    // NS/MX/TXT need a real DNS resolver like hickory-resolver.
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

// Foundation/Network.framework has no NS/MX/TXT lookup API -- only A/AAAA.
// NS/MX/TXT would require the C `dnssd` library (DNSServiceQueryRecord) or a third-party package.
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
# DNS answers vary between lookups; TXT records trimmed with …
# (Node.js, Go, Rust, and Java can look up NS/A/MX/TXT; Swift above only gets A/AAAA)
ns1.google.com.
[142.251.12.138 142.251.12.102 …]
smtp.google.com. 10
[v=spf1 include:_spf.google.com ~all …]
```

:::note
Node.js 15 made the promise API importable directly via `node:dns/promises` (before, only as `dns.promises`); with top-level `await`, each lookup runs in the exact order it's awaited, instead of nesting callbacks.
:::

:::note
`hickory-resolver` (the successor to `trust-dns-resolver`) is a pure-Rust DNS resolver that sends and receives UDP packets to a nameserver itself, instead of calling libc's `getaddrinfo` like `std::net::ToSocketAddrs` does — which is how it can look up any record type (NS, MX, TXT…), not just A/AAAA. Version 0.25 requires Rust 1.71.1+ (MSRV).
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
// Foundation/Network.framework always uses the system resolver -- there's no supported API to
// point lookups at a specific DNS server like Go's net.Resolver{Dial: …}. Doing that would mean
// hand-rolling a DNS-over-UDP query to 1.1.1.1:53, which is beyond the scope of this short example.
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
Swift/Foundation has no concept of a "custom resolver": `Host` and `Network.framework` always look things up through the system resolver, with no parameter to point at a different nameserver — this is a genuine platform limitation, not something missing from the example.
:::
