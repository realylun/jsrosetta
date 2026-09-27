---
title: "Stream"
description: "Readable/Writable/Transform stream của Node.js so với io.Reader/io.Writer trong Go."
date: "2026-09-27"
order: 730
category: async
languages: [js, go]
versions:
  js: "15"
  go: "1.0"
tags: [stream, io, transform, pipeline]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#streams"
---

Node.js mô hình hoá dữ liệu chảy qua bằng các lớp `Readable`/`Writable`/`Transform`. Go không có lớp riêng cho stream — bất cứ thứ gì thực thi interface `io.Reader`/`io.Writer` đều "là" một stream, và các hàm như `io.Copy`, `io.Pipe`, `bufio.Scanner` là những khối lắp ghép để đọc/ghi/biến đổi dữ liệu đó.

## Đọc và ghi dữ liệu dạng stream (Readable/Writable vs io.Reader/io.Writer)

:::tabs
```js
import { Readable, Writable } from "node:stream";

const inStream = new Readable();

inStream.push(Buffer.from("foo"));
inStream.push(Buffer.from("bar"));
inStream.push(null); // kết thúc stream
inStream.pipe(process.stdout); // bất đồng bộ: bắt đầu chảy, nhưng "foobar" chỉ in ra sau các lệnh write bên dưới

const outStream = new Writable({
  write(chunk, encoding, callback) {
    console.log("received: " + chunk.toString("utf8"));
    callback();
  },
});

outStream.write(Buffer.from("abc")); // callback đồng bộ: in ra ngay
outStream.write(Buffer.from("xyz")); // callback đồng bộ: in ra ngay
outStream.end();
```
```go
package main

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"os"
)

func main() {
	inStream := new(bytes.Buffer)
	inStream.WriteString("foo")
	inStream.WriteString("bar")

	if _, err := inStream.WriteTo(os.Stdout); err != nil { // → foobar
		panic(err)
	}
	fmt.Print("\n")

	piper, pipew := io.Pipe()

	go func() {
		defer pipew.Close()
		io.WriteString(pipew, "abc\n")
		io.WriteString(pipew, "xyz\n")
	}()

	sc := bufio.NewScanner(piper)
	for sc.Scan() {
		fmt.Println("received: " + sc.Text()) // → received: abc, rồi received: xyz
	}
	if err := sc.Err(); err != nil {
		panic(err)
	}
}
```
:::

```bash
$ node streams.js
received: abc
received: xyz
foobar

$ go run streams.go
foobar
received: abc
received: xyz
```

:::note
Thứ tự khác nhau giữa hai ngôn ngữ. `pipe()` của Node bắt đầu chảy bất đồng bộ, nên "foobar" được in ra cuối cùng, sau các callback đồng bộ của `write()` trên `outStream`. `bytes.Buffer.WriteTo` của Go thì chặn (block) cho tới khi xong, nên "foobar" được in ra đầu tiên, trước khi goroutine cấp dữ liệu cho pipe kịp chạy.
:::

## Biến đổi dữ liệu khi đang chảy qua (Transform stream)

Một `Transform` stream vừa đọc, vừa biến đổi, vừa phát lại dữ liệu khi nó chảy qua — giống một "map" cho stream trong Node.js. `pipeline()` từ `node:stream/promises` chờ toàn bộ chuỗi xử lý hoàn tất và tự forward lỗi, thay vì phải tự lắng nghe sự kiện `'error'`/`'finish'`.

:::tabs
```js
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const upper = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString("utf8").toUpperCase() + "\n");
  },
});

// Nguồn dữ liệu trong bộ nhớ (không cần stdin) để ví dụ tự chạy độc lập.
const source = Readable.from(["foo", "bar", "baz"]);

await pipeline(source, upper, process.stdout);
// → FOO
// → BAR
// → BAZ
```
```go
package main

import (
	"bytes"
	"io"
	"os"
	"strings"
)

// UppercaseReader bọc một io.Reader và viết hoa mọi thứ đọc được từ nó —
// tương đương gần nhất với Transform stream của Node.
type UppercaseReader struct {
	r io.Reader
}

func (u *UppercaseReader) Read(p []byte) (int, error) {
	n, err := u.r.Read(p)
	// viết hoa theo từng chunk chỉ an toàn với ASCII: một ký tự UTF-8 nhiều
	// byte có thể bị cắt đôi giữa hai lần đọc
	copy(p[:n], bytes.ToUpper(p[:n]))
	return n, err
}

func main() {
	// Nguồn dữ liệu trong bộ nhớ (không cần stdin) để ví dụ tự chạy độc lập.
	src := strings.NewReader("foo\nbar\nbaz\n")
	upper := &UppercaseReader{r: src}

	if _, err := io.Copy(os.Stdout, upper); err != nil {
		panic(err)
	}
	// → FOO
	// → BAR
	// → BAZ
}
```
:::
