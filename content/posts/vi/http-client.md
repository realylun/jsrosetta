---
title: "HTTP Client"
description: "fetch() toàn cục của Node.js so với net/http của Go: GET và đọc JSON, POST kèm header, mã lỗi 4xx/5xx, timeout và đọc body dạng stream."
date: "2026-10-01"
order: 985
category: io
languages: [js, go]
versions:
  js: "18.13"
  go: "1.13"
tags: [http, fetch, client, json, networking]
---

Node.js có `fetch()` toàn cục (dựng trên undici) — cùng API với trình duyệt, trả về `Promise<Response>`. Go dùng `net/http` trong thư viện chuẩn: `http.Get` cho trường hợp đơn giản, `http.NewRequestWithContext` + `Client.Do` khi cần method, header hay context riêng. Hai bên giống nhau ở một điểm hay bị hiểu nhầm: response 4xx/5xx **không** phải lỗi — chỉ lỗi mạng (DNS, connection refused, timeout…) mới khiến `fetch()` reject hay `err != nil` trong Go. Các ví dụ dưới gọi [JSONPlaceholder](https://jsonplaceholder.typicode.com), một API giả lập công khai trả về dữ liệu cố định, nên output `// →` lặp lại được; riêng phần timeout tự dựng một server chậm ngay trong chương trình để không phụ thuộc mạng.

## GET và đọc JSON

:::tabs
```js
const res = await fetch("https://jsonplaceholder.typicode.com/todos/1");
console.log(res.status); // → 200
console.log(res.headers.get("content-type")); // → application/json; charset=utf-8

const todo = await res.json(); // đọc body và parse JSON
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
	defer res.Body.Close() // luôn đóng Body, nếu không connection không được tái sử dụng

	fmt.Println(res.StatusCode)                 // → 200
	fmt.Println(res.Header.Get("Content-Type")) // → application/json; charset=utf-8

	var todo Todo
	if err := json.NewDecoder(res.Body).Decode(&todo); err != nil { // đọc body và parse JSON
		panic(err)
	}
	fmt.Printf("%+v\n", todo)
	// → {UserID:1 ID:1 Title:delectus aut autem Completed:false}
}
```
:::

:::note
`res.json()` trả về object "tự do" — sai tên field thì chỉ nhận `undefined` lúc chạy. Go decode thẳng vào struct theo tag `json:"..."`: field không có trong JSON giữ zero value, field thừa trong JSON bị bỏ qua. `json.NewDecoder(res.Body)` đọc thẳng từ stream, không cần `io.ReadAll` toàn bộ body vào một `[]byte` trước.
:::

## POST JSON kèm header

:::tabs
```js
const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  body: JSON.stringify({ title: "hello", userId: 1 }), // body nhận string, Buffer/TypedArray/ArrayBuffer, Blob, FormData, URLSearchParams hoặc stream; object thường bị ép thành "[object Object]", không phải JSON
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
Chỉ cần POST với một header `Content-Type` thì Go có lối tắt `http.Post(url, "application/json", bytes.NewReader(body))`. Muốn thêm header khác (`Accept`, `Authorization`…) hoặc gắn context để huỷ request thì phải dựng `*http.Request` như trên. JSONPlaceholder không lưu gì thật: lần nào POST cũng trả về `id: 101`.
:::

## Mã lỗi 4xx/5xx không phải lỗi

:::tabs
```js
const res = await fetch("https://jsonplaceholder.typicode.com/todos/9999");
console.log(res.ok, res.status); // → false 404 (không throw!)

if (!res.ok) {
  console.log(`HTTP ${res.status} ${res.statusText}`); // → HTTP 404 Not Found
}

try {
  await fetch("http://does-not-exist.invalid"); // tên miền không tồn tại: lỗi mạng thật
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
		panic(err) // không vào đây: 404 vẫn là một response hợp lệ
	}
	defer res.Body.Close()

	fmt.Println(res.StatusCode) // → 404

	// Go không có res.ok: tự kiểm tra khoảng 2xx
	if res.StatusCode < 200 || res.StatusCode > 299 {
		fmt.Println("HTTP", res.Status) // → HTTP 404 Not Found
	}

	_, err = http.Get("http://does-not-exist.invalid") // tên miền không tồn tại: lỗi mạng thật
	var dnsErr *net.DNSError
	if errors.As(err, &dnsErr) { // err bọc nhiều lớp: *url.Error → *net.OpError → *net.DNSError
		fmt.Println(dnsErr.Err) // → no such host
	}
}
```
:::

:::note
`fetch()` reject với một `TypeError` chung chung (`"fetch failed"`); nguyên nhân thật (mã lỗi của hệ điều hành như `ENOTFOUND`, `ECONNREFUSED`) nằm trong `err.cause`. Go trả về một `*url.Error` bọc lỗi gốc, nên dùng `errors.As` để lấy đúng kiểu cần kiểm tra. Đuôi `.invalid` được dành riêng (RFC 2606) để không bao giờ phân giải được, nên ví dụ này cho cùng kết quả trên hầu hết máy (trừ khi offline hoặc dùng DNS resolver tự viết lại tên miền không tồn tại). `res.Status` của Go đã gồm cả mã lẫn chữ (`"404 Not Found"`), còn JS tách thành `status` và `statusText`.
:::

## Timeout

:::tabs
```js
import http from "node:http";
import { once } from "node:events";

// server giả lập chậm: 2 giây mới trả lời
const server = http.createServer((req, res) => {
  const timer = setTimeout(() => res.end("late"), 2000);
  res.on("close", () => clearTimeout(timer)); // client bỏ đi: huỷ timer để tiến trình thoát ngay
});
server.listen(0); // port 0: để hệ điều hành chọn port trống
await once(server, "listening");
const url = `http://127.0.0.1:${server.address().port}`;

try {
  await fetch(url, { signal: AbortSignal.timeout(500) }); // huỷ sau 500ms
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
	// server giả lập chậm: 2 giây mới trả lời
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-time.After(2 * time.Second):
			w.Write([]byte("late"))
		case <-r.Context().Done(): // client bỏ đi: thoát sớm để server.Close() không phải chờ 2 giây
		}
	}))
	defer server.Close()

	client := &http.Client{Timeout: 500 * time.Millisecond} // áp cho mọi request của client này
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
`fetch()` không có timeout mặc định — không truyền `signal` thì request có thể treo rất lâu. `AbortSignal.timeout(ms)` gắn timeout cho **từng request**; muốn huỷ thủ công thì dùng `AbortController`. `http.Client` của Go (kể cả `http.DefaultClient`) cũng không có timeout mặc định; `Client.Timeout` áp cho mọi request đi qua client đó (gồm cả thời gian đọc body). Muốn timeout riêng cho một request thì dùng context, đúng vai trò của `AbortSignal`: `ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)` rồi truyền `ctx` vào `http.NewRequestWithContext`.
:::

## Đọc body dạng stream

:::tabs
```js
import { createWriteStream } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const res = await fetch("https://jsonplaceholder.typicode.com/photos");

// res.body là web ReadableStream: ghi dần ra file, không giữ cả body trong RAM
const path = join(tmpdir(), "jsrosetta-photos.json");
try {
  await pipeline(Readable.fromWeb(res.body), createWriteStream(path));
  const { size } = await stat(path);
  console.log(size); // → 1039898 (byte, đã giải nén gzip)
} finally {
  await rm(path, { force: true }); // dọn file tạm
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
	defer os.Remove(path) // defer chạy LIFO: đóng file trước, rồi xoá
	defer file.Close()

	// res.Body là io.Reader: io.Copy ghi dần ra file, không giữ cả body trong RAM
	n, err := io.Copy(file, res.Body)
	if err != nil {
		panic(err)
	}
	fmt.Println(n) // → 1039898 (byte, đã giải nén gzip)
}
```
:::

:::note
`res.body` của `fetch()` là một web `ReadableStream`, không phải stream của Node — `Readable.fromWeb()` chuyển nó sang Node stream để dùng với `pipeline()` và `fs`. Cả hai bên đều tự gửi header `Accept-Encoding` có `gzip` và tự giải nén trong lúc đọc, nên số byte ghi ra là kích thước JSON gốc, không phải số byte truyền qua mạng.
:::

:::note
`fetch()` có từ Node.js 17.5 sau flag `--experimental-fetch`, chạy không cần flag từ Node.js 18.0 và hết experimental ở Node.js 21 (Node.js 18.0–18.12 và 19.0 in một `ExperimentalWarning` ra stderr lần đầu gọi; cảnh báo này bị gỡ ở 19.1.0 và được backport về 18.13.0). Bài này đặt sàn là 18.13 vì ví dụ timeout: từ 18.0 tới 18.12, `fetch()` bị huỷ bởi `AbortSignal.timeout()` reject với `AbortError` thay vì `TimeoutError`. Ở phía Go, `http.Get`/`Client.Do` có từ Go 1.0, `http.NewRequestWithContext` và `errors.As` cần Go 1.13.
:::
