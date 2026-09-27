---
title: "Stream"
description: "Readable/Writable/Transform stream của Node.js so với io.Reader/Writer (Go), std::io::Read/Write (Rust), Pipe (Swift) và InputStream (Java)."
date: "2026-09-27"
order: 730
category: async
languages: [js, go, rust, swift, java]
versions:
  js: "15"
  go: "1.0"
  rust: "1.87"
  swift: "5.5"
  java: "25"
tags: [stream, io, transform, pipeline]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#streams"
---

Node.js mô hình hoá dữ liệu chảy qua bằng các lớp `Readable`/`Writable`/`Transform`. Go và Rust không có lớp riêng cho stream — bất cứ thứ gì thực thi `io.Reader`/`io.Writer` (Go) hay trait `Read`/`Write` (Rust) đều "là" một stream. Swift dùng lớp `Pipe`/`FileHandle` của Foundation cộng với `AsyncSequence` để đọc bất đồng bộ. Java có sẵn `InputStream`/`OutputStream` từ những ngày đầu, và `FilterInputStream` đóng vai trò một Transform stream — bọc quanh một stream khác để biến đổi dữ liệu khi đọc qua nó.

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
```rust
use std::io::{self, BufRead, BufReader, Write};
use std::thread;

fn main() -> io::Result<()> {
    let mut in_stream: &[u8] = b"foobar";
    io::copy(&mut in_stream, &mut io::stdout())?; // → foobar
    println!();

    let (reader, mut writer) = io::pipe()?; // io::pipe: pipe ẩn danh của OS (một chiều), ổn định từ 1.87

    let handle = thread::spawn(move || {
        writer.write_all(b"abc\n").unwrap();
        writer.write_all(b"xyz\n").unwrap();
        // writer bị drop ở đây, đóng đầu ghi của pipe
    });

    for line in BufReader::new(reader).lines() {
        println!("received: {}", line?); // → received: abc, rồi received: xyz
    }
    handle.join().unwrap();
    Ok(())
}
```
```swift
import Foundation

let inData = Data("foobar".utf8)
try FileHandle.standardOutput.write(contentsOf: inData) // → foobar
print()

let pipe = Pipe() // Pipe/FileHandle của Foundation: gần nhất với io.Pipe của Go

Task {
    try pipe.fileHandleForWriting.write(contentsOf: Data("abc\n".utf8))
    try pipe.fileHandleForWriting.write(contentsOf: Data("xyz\n".utf8))
    try? pipe.fileHandleForWriting.close()
}

for try await line in pipe.fileHandleForReading.bytes.lines {
    print("received: \(line)") // → received: abc, rồi received: xyz
}
```
```java
void main() throws Exception {
    var inStream = new ByteArrayInputStream("foobar".getBytes());
    inStream.transferTo(System.out); // → foobar
    System.out.println();

    var pipeIn = new PipedInputStream();
    var pipeOut = new PipedOutputStream(pipeIn); // PipedInputStream/PipedOutputStream: gần nhất với io.Pipe

    Thread.startVirtualThread(() -> {
        try (pipeOut) {
            pipeOut.write("abc\n".getBytes());
            pipeOut.write("xyz\n".getBytes());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    });

    var reader = new BufferedReader(new InputStreamReader(pipeIn));
    String line;
    while ((line = reader.readLine()) != null) {
        IO.println("received: " + line); // → received: abc, rồi received: xyz
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

$ cargo run -q
foobar
received: abc
received: xyz

$ swift main.swift
foobar
received: abc
received: xyz

$ java Main.java
foobar
received: abc
received: xyz
```

:::note
Chỉ Node.js có thứ tự khác. `pipe()` của Node bắt đầu chảy bất đồng bộ, nên "foobar" được in ra cuối cùng, sau các callback đồng bộ của `write()` trên `outStream`. Go, Rust, Swift và Java đều chạy phần ghi vào nguồn đầu tiên một cách đồng bộ/chặn (block), nên "foobar" luôn in ra trước khi goroutine/thread/task cấp dữ liệu cho pipe kịp chạy.
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
```rust
use std::io::{self, Read};

// UppercaseReader bọc một Read và viết hoa mọi thứ đọc được từ nó — tương
// đương gần nhất với Transform stream của Node.
struct UppercaseReader<R> {
    inner: R,
}

impl<R: Read> Read for UppercaseReader<R> {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let n = self.inner.read(buf)?;
        // viết hoa theo từng chunk chỉ an toàn với ASCII: một ký tự UTF-8
        // nhiều byte có thể bị cắt đôi giữa hai lần đọc
        buf[..n].make_ascii_uppercase();
        Ok(n)
    }
}

fn main() -> io::Result<()> {
    // Nguồn dữ liệu trong bộ nhớ (không cần stdin) để ví dụ tự chạy độc lập.
    let src = "foo\nbar\nbaz\n".as_bytes();
    let mut upper = UppercaseReader { inner: src };

    io::copy(&mut upper, &mut io::stdout())?;
    // → FOO
    // → BAR
    // → BAZ
    Ok(())
}
```
```swift
// In-memory source (không cần stdin) để ví dụ tự chạy độc lập.
let source = AsyncStream { continuation in
    for word in ["foo", "bar", "baz"] {
        continuation.yield(word)
    }
    continuation.finish()
}

let upper = source.map { $0.uppercased() } // .map trên AsyncSequence: gần nhất với Transform stream

for await line in upper {
    print(line)
}
// → FOO
// → BAR
// → BAZ
```
```java
// UppercaseInputStream bọc một InputStream và viết hoa mọi thứ đọc được từ
// nó — tương đương gần nhất với Transform stream của Node.
static class UppercaseInputStream extends FilterInputStream {
    UppercaseInputStream(InputStream in) {
        super(in);
    }

    @Override
    public int read(byte[] b, int off, int len) throws IOException {
        int n = super.read(b, off, len);
        // viết hoa theo từng chunk chỉ an toàn với ASCII: một ký tự UTF-8
        // nhiều byte có thể bị cắt đôi giữa hai lần đọc
        for (int i = off; i < off + n; i++) {
            b[i] = (byte) Character.toUpperCase(b[i]);
        }
        return n;
    }

    @Override
    public int read() throws IOException {
        // đọc từng byte một cũng phải override riêng: FilterInputStream.read()
        // không gọi qua read(byte[], int, int) ở trên nên bỏ qua nó sẽ làm rò
        // rỉ byte gốc (chưa viết hoa) nếu caller đọc bằng read() thay vì đọc theo mảng
        int b = super.read();
        return b == -1 ? -1 : Character.toUpperCase(b);
    }
}

void main() throws Exception {
    // Nguồn dữ liệu trong bộ nhớ (không cần stdin) để ví dụ tự chạy độc lập.
    var source = new ByteArrayInputStream("foo\nbar\nbaz\n".getBytes());
    var upper = new UppercaseInputStream(source);

    upper.transferTo(System.out);
    // → FOO
    // → BAR
    // → BAZ
}
```
:::

:::note
`FileHandle.bytes`/`.lines` của Swift cần macOS 12 trở lên (đi cùng Swift 5.5). `write(contentsOf:)` (bản throwing, thay cho `write(_:)` không throw kiểu cũ) ném lỗi thay vì crash khi ghi thất bại, có từ macOS 10.15.4.
:::
