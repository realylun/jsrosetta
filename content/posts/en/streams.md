---
title: "Streams"
description: "How Node.js's Readable/Writable/Transform streams compare to io.Reader/Writer (Go), std::io::Read/Write (Rust), Pipe (Swift), and InputStream (Java)."
tags: [stream, io, transform, pipeline]
---

Node.js models flowing data with the `Readable`/`Writable`/`Transform` classes. Go and Rust have no dedicated stream class — anything that implements `io.Reader`/`io.Writer` (Go) or the `Read`/`Write` traits (Rust) "is" a stream. Swift uses Foundation's `Pipe`/`FileHandle` classes together with `AsyncSequence` for asynchronous reads. Java has had `InputStream`/`OutputStream` since its earliest days, and `FilterInputStream` plays the role of a Transform stream — it wraps another stream and transforms the data as it's read through it.

## Reading and writing streaming data (Readable/Writable vs io.Reader/io.Writer)

:::tabs
```js
import { Readable, Writable } from "node:stream";

const inStream = new Readable();

inStream.push(Buffer.from("foo"));
inStream.push(Buffer.from("bar"));
inStream.push(null); // end the stream
inStream.pipe(process.stdout); // async: starts flowing, but "foobar" only prints after the writes below

const outStream = new Writable({
  write(chunk, encoding, callback) {
    console.log("received: " + chunk.toString("utf8"));
    callback();
  },
});

outStream.write(Buffer.from("abc")); // synchronous callback: prints immediately
outStream.write(Buffer.from("xyz")); // synchronous callback: prints immediately
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
		fmt.Println("received: " + sc.Text()) // → received: abc, then received: xyz
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

    let (reader, mut writer) = io::pipe()?; // io::pipe: an in-memory duplex pipe, stable since 1.87

    let handle = thread::spawn(move || {
        writer.write_all(b"abc\n").unwrap();
        writer.write_all(b"xyz\n").unwrap();
        // writer is dropped here, closing its end of the pipe
    });

    for line in BufReader::new(reader).lines() {
        println!("received: {}", line?); // → received: abc, then received: xyz
    }
    handle.join().unwrap();
    Ok(())
}
```
```swift
import Foundation

let inData = Data("foobar".utf8)
FileHandle.standardOutput.write(inData) // → foobar
print()

let pipe = Pipe() // Foundation's Pipe/FileHandle: the closest match to Go's io.Pipe

Task {
    pipe.fileHandleForWriting.write(Data("abc\n".utf8))
    pipe.fileHandleForWriting.write(Data("xyz\n".utf8))
    try? pipe.fileHandleForWriting.close()
}

for try await line in pipe.fileHandleForReading.bytes.lines {
    print("received: \(line)") // → received: abc, then received: xyz
}
```
```java
void main() throws Exception {
    var inStream = new ByteArrayInputStream("foobar".getBytes());
    inStream.transferTo(System.out); // → foobar
    System.out.println();

    var pipeIn = new PipedInputStream();
    var pipeOut = new PipedOutputStream(pipeIn); // PipedInputStream/PipedOutputStream: the closest match to io.Pipe

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
        IO.println("received: " + line); // → received: abc, then received: xyz
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
Only Node.js prints in a different order. Node's `pipe()` starts flowing asynchronously, so `foobar` is printed last, after the synchronous `write()` callbacks on `outStream`. Go, Rust, Swift, and Java all write to the in-memory source synchronously/blocking, so `foobar` is always printed before the goroutine/thread/task feeding the pipe gets a chance to run.
:::

## Transforming data as it flows through (Transform stream)

A `Transform` stream reads, modifies, and re-emits data as it flows through — Node's built-in "map" for streams. `pipeline()` from `node:stream/promises` awaits the whole chain and forwards any error automatically, instead of juggling `'error'`/`'finish'` listeners by hand.

:::tabs
```js
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const upper = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString("utf8").toUpperCase() + "\n");
  },
});

// In-memory source (no stdin) so this example is self-contained.
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

// UppercaseReader wraps an io.Reader and uppercases everything read from
// it — Go's rough equivalent of a Node Transform stream.
type UppercaseReader struct {
	r io.Reader
}

func (u *UppercaseReader) Read(p []byte) (int, error) {
	n, err := u.r.Read(p)
	// per-chunk uppercasing is only safe for ASCII: a multi-byte UTF-8
	// character can be split across two reads
	copy(p[:n], bytes.ToUpper(p[:n]))
	return n, err
}

func main() {
	// In-memory source (no stdin) so this example is self-contained.
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

// UppercaseReader wraps a Read and uppercases everything read from it —
// the closest equivalent to a Node Transform stream.
struct UppercaseReader<R> {
    inner: R,
}

impl<R: Read> Read for UppercaseReader<R> {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let n = self.inner.read(buf)?;
        // per-chunk uppercasing is only safe for ASCII: a multi-byte UTF-8
        // character can be split across two reads
        buf[..n].make_ascii_uppercase();
        Ok(n)
    }
}

fn main() -> io::Result<()> {
    // In-memory source (no stdin) so this example is self-contained.
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
// In-memory source (no stdin) so this example is self-contained.
let source = AsyncStream { continuation in
    for word in ["foo", "bar", "baz"] {
        continuation.yield(word)
    }
    continuation.finish()
}

let upper = source.map { $0.uppercased() } // .map on an AsyncSequence: the closest match to a Transform stream

for await line in upper {
    print(line)
}
// → FOO
// → BAR
// → BAZ
```
```java
// UppercaseInputStream wraps an InputStream and uppercases everything read
// from it — the closest equivalent to a Node Transform stream.
static class UppercaseInputStream extends FilterInputStream {
    UppercaseInputStream(InputStream in) {
        super(in);
    }

    @Override
    public int read(byte[] b, int off, int len) throws IOException {
        int n = super.read(b, off, len);
        // per-chunk uppercasing is only safe for ASCII: a multi-byte UTF-8
        // character can be split across two reads
        for (int i = off; i < off + n; i++) {
            b[i] = (byte) Character.toUpperCase(b[i]);
        }
        return n;
    }
}

void main() throws Exception {
    // In-memory source (no stdin) so this example is self-contained.
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
Swift's `FileHandle.bytes`/`.lines` require macOS 12 or later (shipped alongside Swift 5.5).
:::
