---
title: "Streams"
description: "How Node.js's Readable/Writable/Transform streams compare to io.Reader/io.Writer in Go."
tags: [stream, io, transform, pipeline]
---

Node.js models flowing data with the `Readable`/`Writable`/`Transform` classes. Go has no dedicated stream class — anything that implements the `io.Reader`/`io.Writer` interface "is" a stream, and functions like `io.Copy`, `io.Pipe`, and `bufio.Scanner` are the building blocks you compose to read, write, and transform it.

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
The order differs by language. Node's `pipe()` starts flowing asynchronously, so `foobar` is printed last, after the synchronous `write()` callbacks on `outStream`. Go's `bytes.Buffer.WriteTo` blocks until it's done, so `foobar` is printed first, before the goroutine feeding the pipe gets a chance to run.
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
:::
