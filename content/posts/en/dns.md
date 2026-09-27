---
title: "DNS Lookups"
description: "How Node.js's node:dns/promises compares to Go's net package (LookupNS/LookupIP/LookupMX/LookupTXT) for DNS lookups."
tags: [dns, lookup, networking, io]
---

NS, A/AAAA, MX, and TXT lookups are all available in the standard library of both languages, with no third-party dependency needed. To change the DNS resolver server, Node.js calls `dns.setServers()`, while Go has to build a custom `net.Resolver` with its own `Dial` function.

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
:::

```bash
# DNS answers vary between lookups; TXT records trimmed with …
ns2.google.com
[142.251.12.138 142.251.12.102 …]
smtp.google.com 10
[v=spf1 include:_spf.google.com ~all …]
```

:::note
Node.js 15 made the promise API importable directly via `node:dns/promises` (before, only as `dns.promises`); with top-level `await`, each lookup runs in the exact order it's awaited, instead of nesting callbacks.
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

ns, err := r.LookupNS(context.Background(), "google.com")
if err != nil {
	panic(err)
}
for _, n := range ns {
	fmt.Println(n.Host)
}
```
:::

:::note
The `Dial` field of `net.Resolver` — used above to send queries to `1.1.1.1` instead of the system's default resolver — was added in Go 1.9.
:::
