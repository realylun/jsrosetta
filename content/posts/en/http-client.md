---
title: "HTTP Client"
description: "How Node.js's global fetch() compares to Go's net/http: GET and reading JSON, POST with headers, 4xx/5xx status codes, timeouts, and streaming the body."
tags: [http, fetch, client, json, networking]
---

Node.js has a global `fetch()` (built on undici) — the same API as in the browser, returning a `Promise<Response>`. Go uses `net/http` from the standard library: `http.Get` for the simple case, `http.NewRequestWithContext` + `Client.Do` when you need a method, headers, or a context of your own. Both share one commonly misunderstood trait: a 4xx/5xx response is **not** an error — only network failures (DNS, connection refused, timeouts…) make `fetch()` reject or give you `err != nil` in Go. The examples below call [JSONPlaceholder](https://jsonplaceholder.typicode.com), a public fake API that returns fixed data, so the `// →` output is repeatable; the timeout section spins up a slow server inside the program itself so it doesn't depend on the network.

## GET and reading JSON

:::tabs
```js
const res = await fetch("https://jsonplaceholder.typicode.com/todos/1");
console.log(res.status); // → 200
console.log(res.headers.get("content-type")); // → application/json; charset=utf-8

const todo = await res.json(); // read the body and parse it as JSON
console.log(todo);
// → { userId: 1, id: 1, title: 'delectus aut autem', completed: false }
```
```go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Todo struct {
	UserID    int    `json:"userId"`
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
}

func main() {
	res, err := http.Get("https://jsonplaceholder.typicode.com/todos/1")
	if err != nil {
		panic(err)
	}
	defer res.Body.Close() // always close Body, otherwise the connection can't be reused

	fmt.Println(res.StatusCode)                 // → 200
	fmt.Println(res.Header.Get("Content-Type")) // → application/json; charset=utf-8

	var todo Todo
	if err := json.NewDecoder(res.Body).Decode(&todo); err != nil { // read the body and parse it as JSON
		panic(err)
	}
	fmt.Printf("%+v\n", todo)
	// → {UserID:1 ID:1 Title:delectus aut autem Completed:false}
}
```
:::

:::note
`res.json()` returns a "free-form" object — misspell a field name and you just get `undefined` at runtime. Go decodes straight into a struct by its `json:"..."` tags: fields missing from the JSON keep their zero value, extra fields in the JSON are ignored. `json.NewDecoder(res.Body)` reads directly from the stream, with no need to `io.ReadAll` the whole body into a `[]byte` first.
:::

## POSTing JSON with headers

:::tabs
```js
const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  body: JSON.stringify({ title: "hello", userId: 1 }), // body accepts a string, Buffer/TypedArray/ArrayBuffer, Blob, FormData, URLSearchParams, or a stream; a plain object is coerced to "[object Object]", not JSON
});

console.log(res.status); // → 201
console.log(await res.json()); // → { title: 'hello', userId: 1, id: 101 }
```
```go
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

type Post struct {
	ID     int    `json:"id,omitempty"`
	Title  string `json:"title"`
	UserID int    `json:"userId"`
}

func main() {
	body, err := json.Marshal(Post{Title: "hello", UserID: 1})
	if err != nil {
		panic(err)
	}

	req, err := http.NewRequestWithContext(context.Background(), http.MethodPost,
		"https://jsonplaceholder.typicode.com/posts", bytes.NewReader(body))
	if err != nil {
		panic(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	var created Post
	if err := json.NewDecoder(res.Body).Decode(&created); err != nil {
		panic(err)
	}
	fmt.Println(res.StatusCode)  // → 201
	fmt.Printf("%+v\n", created) // → {ID:101 Title:hello UserID:1}
}
```
:::

:::tip
If all you need is a POST with a single `Content-Type` header, Go has the shortcut `http.Post(url, "application/json", bytes.NewReader(body))`. To add any other header (`Accept`, `Authorization`…) or attach a context to cancel the request, you build an `*http.Request` as above. JSONPlaceholder doesn't actually store anything: every POST comes back with `id: 101`.
:::

## 4xx/5xx status codes aren't errors

:::tabs
```js
const res = await fetch("https://jsonplaceholder.typicode.com/todos/9999");
console.log(res.ok, res.status); // → false 404 (no throw!)

if (!res.ok) {
  console.log(`HTTP ${res.status} ${res.statusText}`); // → HTTP 404 Not Found
}

try {
  await fetch("http://does-not-exist.invalid"); // a domain that doesn't exist: a real network error
} catch (err) {
  console.log(err.name, err.message); // → TypeError fetch failed
  console.log(err.cause.code); // → ENOTFOUND
}
```
```go
package main

import (
	"errors"
	"fmt"
	"net"
	"net/http"
)

func main() {
	res, err := http.Get("https://jsonplaceholder.typicode.com/todos/9999")
	if err != nil {
		panic(err) // not reached: a 404 is still a valid response
	}
	defer res.Body.Close()

	fmt.Println(res.StatusCode) // → 404

	// Go has no res.ok: check the 2xx range yourself
	if res.StatusCode < 200 || res.StatusCode > 299 {
		fmt.Println("HTTP", res.Status) // → HTTP 404 Not Found
	}

	_, err = http.Get("http://does-not-exist.invalid") // a domain that doesn't exist: a real network error
	var dnsErr *net.DNSError
	if errors.As(err, &dnsErr) { // err is wrapped in layers: *url.Error → *net.OpError → *net.DNSError
		fmt.Println(dnsErr.Err) // → no such host
	}
}
```
:::

:::note
`fetch()` rejects with a generic `TypeError` (`"fetch failed"`); the real reason (an OS error code such as `ENOTFOUND` or `ECONNREFUSED`) lives in `err.cause`. Go returns a `*url.Error` wrapping the original error, so use `errors.As` to pull out exactly the type you want to check. The `.invalid` TLD is reserved (RFC 2606) so it never resolves, which makes this example give the same result on most machines (unless you're offline or behind a DNS resolver that rewrites nonexistent names). Go's `res.Status` already contains both the code and the text (`"404 Not Found"`), while JS splits them into `status` and `statusText`.
:::

## Timeouts

:::tabs
```js
import http from "node:http";
import { once } from "node:events";

// a deliberately slow server: answers after 2 seconds
const server = http.createServer((req, res) => {
  const timer = setTimeout(() => res.end("late"), 2000);
  res.on("close", () => clearTimeout(timer)); // client went away: cancel the timer so the process exits right away
});
server.listen(0); // port 0: let the OS pick a free port
await once(server, "listening");
const url = `http://127.0.0.1:${server.address().port}`;

try {
  await fetch(url, { signal: AbortSignal.timeout(500) }); // abort after 500ms
} catch (err) {
  console.log(err.name); // → TimeoutError
} finally {
  server.close();
}
```
```go
package main

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"time"
)

func main() {
	// a deliberately slow server: answers after 2 seconds
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-time.After(2 * time.Second):
			w.Write([]byte("late"))
		case <-r.Context().Done(): // client went away: return early so server.Close() doesn't wait 2 seconds
		}
	}))
	defer server.Close()

	client := &http.Client{Timeout: 500 * time.Millisecond} // applies to every request made by this client
	res, err := client.Get(server.URL)
	if err == nil {
		res.Body.Close()
	}

	var urlErr *url.Error
	if errors.As(err, &urlErr) {
		fmt.Println(urlErr.Timeout()) // → true
	}
}
```
:::

:::note
`fetch()` has no default timeout — without a `signal`, a request can hang for a very long time. `AbortSignal.timeout(ms)` sets a timeout **per request**; to cancel by hand, use an `AbortController`. Go's `http.Client` (including `http.DefaultClient`) has no default timeout either; `Client.Timeout` applies to every request going through that client (including the time spent reading the body). For a timeout on a single request, use a context — exactly the role `AbortSignal` plays: `ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)`, then pass `ctx` to `http.NewRequestWithContext`.
:::

## Streaming the body

:::tabs
```js
import { createWriteStream } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const res = await fetch("https://jsonplaceholder.typicode.com/photos");

// res.body is a web ReadableStream: write it to a file piece by piece, without holding the whole body in RAM
const path = join(tmpdir(), "jsrosetta-photos.json");
try {
  await pipeline(Readable.fromWeb(res.body), createWriteStream(path));
  const { size } = await stat(path);
  console.log(size); // → 1039898 (bytes, after gzip decompression)
} finally {
  await rm(path, { force: true }); // clean up the temp file
}
```
```go
package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

func main() {
	res, err := http.Get("https://jsonplaceholder.typicode.com/photos")
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	path := filepath.Join(os.TempDir(), "jsrosetta-photos.json")
	file, err := os.Create(path)
	if err != nil {
		panic(err)
	}
	defer os.Remove(path) // defers run LIFO: close the file first, then remove it
	defer file.Close()

	// res.Body is an io.Reader: io.Copy writes it to the file piece by piece, without holding the whole body in RAM
	n, err := io.Copy(file, res.Body)
	if err != nil {
		panic(err)
	}
	fmt.Println(n) // → 1039898 (bytes, after gzip decompression)
}
```
:::

:::note
`fetch()`'s `res.body` is a web `ReadableStream`, not a Node stream — `Readable.fromWeb()` converts it to a Node stream so it works with `pipeline()` and `fs`. Both sides automatically send an `Accept-Encoding` header that includes `gzip` and decompress while reading, so the byte count written is the size of the original JSON, not the number of bytes sent over the wire.
:::

:::note
`fetch()` arrived in Node.js 17.5 behind the `--experimental-fetch` flag, works without a flag since Node.js 18.0, and left experimental status in Node.js 21 (Node.js 18.0–18.12 and 19.0 print an `ExperimentalWarning` to stderr the first time it's called; the warning was removed in 19.1.0 and backported to 18.13.0). This post's floor is 18.13 because of the timeout example: from 18.0 through 18.12, a `fetch()` aborted by `AbortSignal.timeout()` rejects with an `AbortError` instead of a `TimeoutError`. On the Go side, `http.Get`/`Client.Do` date back to Go 1.0, while `http.NewRequestWithContext` and `errors.As` need Go 1.13.
:::
