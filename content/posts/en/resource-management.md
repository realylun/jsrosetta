---
title: "Resource Cleanup: using and defer"
description: "How Node.js's using/await using, Symbol.dispose, and DisposableStack compare to Go's defer: block vs function scope, LIFO order, and errors during cleanup."
tags: [using, dispose, defer, cleanup, disposable-stack]
---

Open a file, take a lock, connect to a database — whatever you open, you have to close, even when the code in between throws. For a long time JavaScript only had `try/finally` for this. The **Explicit Resource Management** proposal (TC39 Stage 4, part of ES2027) adds `using` / `await using` declarations: a variable declared with `using` automatically has its `[Symbol.dispose]()` (or `await [Symbol.asyncDispose]()`) called when control leaves the enclosing **block**. Go has had `defer` since its first release: the call is postponed until the enclosing **function** returns. Both clean up in reverse order of acquisition (LIFO), but they differ in scope — block vs function — and that is the easiest place to trip up.

## Synchronous cleanup (using vs defer)

:::tabs
```js
class Lock {
  constructor(name) {
    this.name = name;
    console.log(`lock ${name}`);
  }

  // Any object with a [Symbol.dispose]() method works with `using`.
  [Symbol.dispose]() {
    console.log(`unlock ${this.name}`);
  }
}

function transfer(fail) {
  using lock = new Lock("account");
  if (fail) throw new Error("insufficient funds");
  console.log("transferred");
} // lock[Symbol.dispose]() runs here, even on throw

transfer(false);
try {
  transfer(true);
} catch (err) {
  console.log("error:", err.message);
}
// → lock account
// → transferred
// → unlock account
// → lock account
// → unlock account
// → error: insufficient funds
```
```go
package main

import (
	"errors"
	"fmt"
)

type Lock struct{ name string }

func NewLock(name string) *Lock {
	fmt.Println("lock", name)
	return &Lock{name: name}
}

func (l *Lock) Unlock() {
	fmt.Println("unlock", l.name)
}

func transfer(fail bool) error {
	lock := NewLock("account")
	defer lock.Unlock() // runs when transfer returns, whichever path it takes (even on panic)

	if fail {
		return errors.New("insufficient funds")
	}
	fmt.Println("transferred")
	return nil
}

func main() {
	if err := transfer(false); err != nil {
		fmt.Println("error:", err)
	}
	if err := transfer(true); err != nil {
		fmt.Println("error:", err)
	}
}

// → lock account
// → transferred
// → unlock account
// → lock account
// → unlock account
// → error: insufficient funds
```
:::

:::note
`using` isn't a cleanup call but a variable declaration: the value must have a `[Symbol.dispose]()` method (or be `null`/`undefined`, in which case nothing happens), and the binding is constant like `const`. Go has no special interface — `defer` postpones **any** function call; the `Close() error` convention (the `io.Closer` interface) is just a standard-library habit.
:::

## Asynchronous cleanup (await using vs defer)

Closing a network connection or flushing a file is usually async in Node.js. `await using` calls `await value[Symbol.asyncDispose]()` when leaving the block. Go doesn't distinguish sync from async: `Close()` just blocks until it's done, so it's still plain `defer`.

:::tabs
```js
import { open, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const path = join(tmpdir(), "jsrosetta-using.txt");

class Connection {
  static async connect(name) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    console.log(`connected ${name}`);
    return new Connection(name);
  }

  constructor(name) {
    this.name = name;
  }

  // Async cleanup: `await using` awaits this method.
  async [Symbol.asyncDispose]() {
    await new Promise((resolve) => setTimeout(resolve, 10));
    console.log(`disconnected ${this.name}`);
  }
}

async function exportReport() {
  await using db = await Connection.connect("db");
  await using file = await open(path, "w"); // fs/promises FileHandle implements Symbol.asyncDispose
  await file.write(`report from ${db.name}\n`);
  console.log("written");
} // await file.close(), then await db[Symbol.asyncDispose]()

try {
  await exportReport();
  console.log((await readFile(path, "utf8")).trim());
} finally {
  await rm(path, { force: true });
}
// → connected db
// → written
// → disconnected db
// → report from db
```
```go
package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Connection struct{ name string }

func Connect(name string) (*Connection, error) {
	time.Sleep(10 * time.Millisecond)
	fmt.Println("connected", name)
	return &Connection{name: name}, nil
}

// Go has no sync/async split: Close simply blocks until it is done.
func (c *Connection) Close() error {
	time.Sleep(10 * time.Millisecond)
	fmt.Println("disconnected", c.name)
	return nil
}

func exportReport(path string) (err error) {
	db, err := Connect("db")
	if err != nil {
		return err
	}
	defer db.Close()

	file, err := os.Create(path)
	if err != nil {
		return err // only defer once the open has succeeded
	}
	defer func() {
		err = errors.Join(err, file.Close()) // write file: don't swallow the Close error (see the last section)
	}()

	if _, err := fmt.Fprintf(file, "report from %s\n", db.name); err != nil {
		return err
	}
	fmt.Println("written")
	return nil
} // file.Close(), then db.Close()

func main() {
	path := filepath.Join(os.TempDir(), "jsrosetta-defer.txt")
	defer os.Remove(path)

	if err := exportReport(path); err != nil {
		fmt.Println("error:", err)
		return
	}
	data, err := os.ReadFile(path)
	if err != nil {
		fmt.Println("error:", err)
		return
	}
	fmt.Println(strings.TrimSpace(string(data)))
}

// → connected db
// → written
// → disconnected db
// → report from db
```
:::

:::tip
Several Node.js APIs already implement these symbols, so they work directly with `using`/`await using`: the `fs/promises` `FileHandle` has `[Symbol.asyncDispose]()` (calls `close()`), `Dir` has both `[Symbol.dispose]()` and `[Symbol.asyncDispose]()`, and the `Timeout`/`Immediate` objects returned by `setTimeout`/`setImmediate` have `[Symbol.dispose]()` (cancels the timer). `mkdtempDisposable()` from `fs/promises` (and `fs.mkdtempDisposableSync()`, Node.js 24.4) creates a temporary directory that is removed along with its contents on dispose. These APIs arrived at different times — `FileHandle` in 20.4/18.18, `Timeout`/`Immediate` in 20.5/18.18, `Dir` in 24.1 (and 22.1) — and were all marked experimental until Node.js 24.2.
:::

## Several resources: LIFO order (DisposableStack vs defer)

Both languages close in reverse order: what was opened last is closed first, because it may depend on what was opened before it. When the number of resources is only known at runtime, JavaScript uses `DisposableStack` (`AsyncDisposableStack` for the async version); Go needs nothing extra, since every function already has a defer stack.

:::tabs
```js
function acquire(name) {
  console.log(`open ${name}`);
  return { [Symbol.dispose]: () => console.log(`close ${name}`) };
}

function fixed() {
  using a = acquire("a");
  using b = acquire("b");
  console.log("work");
} // closed in reverse order of opening: b, then a

// The number of resources is only known at runtime: collect them in a DisposableStack.
function dynamic(names) {
  using stack = new DisposableStack();
  for (const name of names) {
    stack.use(acquire(name));
  }
  stack.defer(() => console.log("flush log")); // the closest thing to Go's `defer`
  console.log("work");
} // the stack disposes everything in LIFO order

fixed();
dynamic(["x", "y"]);
// → open a
// → open b
// → work
// → close b
// → close a
// → open x
// → open y
// → work
// → flush log
// → close y
// → close x
```
```go
package main

import "fmt"

type resource struct{ name string }

func acquire(name string) *resource {
	fmt.Println("open", name)
	return &resource{name: name}
}

func (r *resource) Close() {
	fmt.Println("close", r.name)
}

func fixed() {
	a := acquire("a")
	defer a.Close()
	b := acquire("b")
	defer b.Close()
	fmt.Println("work")
} // defers run LIFO: b, then a

// Every function already has a defer "stack", so a dynamic count needs nothing extra.
func dynamic(names []string) {
	for _, name := range names {
		defer acquire(name).Close() // acquire runs now; only Close is deferred
	}
	defer fmt.Println("flush log")
	fmt.Println("work")
}

func main() {
	fixed()
	dynamic([]string{"x", "y"})
}

// → open a
// → open b
// → work
// → close b
// → close a
// → open x
// → open y
// → work
// → flush log
// → close y
// → close x
```
:::

:::note
`stack.use(value)` registers a disposable, `stack.adopt(value, fn)` wraps a value that has no `Symbol.dispose`, and `stack.defer(fn)` registers an arbitrary callback. `stack.move()` transfers every resource to a new stack — handy in a constructor: open several things, and if something fails halfway, `using stack` cleans up what was already opened; if everything succeeds, `move()` keeps them for the object.
:::

## Scope: block (using) or function (defer)

This is the most important difference. `using` cleans up at the end of the **block**, so in a loop each iteration closes its own resource. `defer` only runs when the **function** returns — a `defer` inside a loop keeps every resource open until the end of the function.

:::tabs
```js
function acquire(name) {
  console.log(`open ${name}`);
  return { [Symbol.dispose]: () => console.log(`close ${name}`) };
}

for (const name of ["a", "b"]) {
  using file = acquire(name);
  console.log(`use ${name}`);
} // `using` is block-scoped: disposed at the end of each iteration
console.log("loop done");
// → open a
// → use a
// → close a
// → open b
// → use b
// → close b
// → loop done
```
```go
package main

import "fmt"

type resource struct{ name string }

func acquire(name string) *resource {
	fmt.Println("open", name)
	return &resource{name: name}
}

func (r *resource) Close() {
	fmt.Println("close", r.name)
}

// Wrong: defer is tied to the function, not the block — every file stays open until the function returns.
func leaky(names []string) {
	for _, name := range names {
		file := acquire(name)
		defer file.Close()
		fmt.Println("use", name)
	}
	fmt.Println("loop done")
}

// Right: move the loop body into its own function so each iteration gets its own defer scope.
func fixed(names []string) {
	for _, name := range names {
		func() {
			file := acquire(name)
			defer file.Close()
			fmt.Println("use", name)
		}()
	}
	fmt.Println("loop done")
}

func main() {
	leaky([]string{"a", "b"})
	fmt.Println("---")
	fixed([]string{"a", "b"})
}

// → open a
// → use a
// → open b
// → use b
// → loop done
// → close b
// → close a
// → ---
// → open a
// → use a
// → close a
// → open b
// → use b
// → close b
// → loop done
```
:::

:::warning
`defer` in a loop is a classic Go bug: iterate over 10,000 files and you have 10,000 file descriptors open at once, which can hit the OS limit before the function ever returns. Move the loop body into its own function (or an immediately-invoked closure as above) so each iteration gets its own `defer` scope.
:::

## Errors during cleanup (SuppressedError vs errors.Join)

If the block body throws and then the cleanup throws too, which error wins? JavaScript wraps both in a `SuppressedError`: `error` is the new error (from dispose) and `suppressed` is the one it replaced (from the body). Go has no automatic mechanism — `defer f.Close()` silently discards the returned error; to keep it, use a named return and `errors.Join`.

:::tabs
```js
function openFile(name) {
  return {
    [Symbol.dispose]() {
      throw new Error(`close ${name} failed`);
    },
  };
}

function save() {
  using file = openFile("a.txt");
  throw new Error("write failed");
}

try {
  save();
} catch (err) {
  // Both the body and dispose throw: the errors are wrapped in a SuppressedError.
  console.log(err instanceof SuppressedError); // → true
  console.log(err.error.message); // → close a.txt failed  (the newest error, from dispose)
  console.log(err.suppressed.message); // → write failed  (the error it suppressed, from the body)
}

// Only dispose throws: you get that error as-is, no SuppressedError.
try {
  using file = openFile("b.txt");
} catch (err) {
  console.log(err.message); // → close b.txt failed
}
```
```go
package main

import (
	"errors"
	"fmt"
)

var (
	ErrWrite = errors.New("write failed")
	ErrClose = errors.New("close a.txt failed")
)

type file struct{}

func (f *file) Close() error { return ErrClose }

// The named return `err` lets the deferred function read and change the result.
func save() (err error) {
	f := &file{}
	defer func() {
		err = errors.Join(err, f.Close()) // keep both errors; Join skips nils
	}()
	return ErrWrite
}

func main() {
	err := save()
	fmt.Println(err)
	fmt.Println(errors.Is(err, ErrWrite), errors.Is(err, ErrClose))
}

// → write failed
// → close a.txt failed
// → true true
```
:::

:::tip
For files you **write**, the error from `Close()` matters: some file systems (NFS, for example) only report write errors on close, so a bare `defer f.Close()` can swallow them. For read-only files, ignoring the `Close()` error is usually fine. `errors.Join` arrived in Go 1.20 and skips `nil` arguments, so when nothing failed `err` stays `nil`.
:::

:::note
`using`, `DisposableStack`, and `SuppressedError` ship in V8 13.6 — the engine in Node.js 24.0.0 (Node.js 23 uses V8 12.9 and throws a `SyntaxError` right at the `using` line). No command-line flag is needed.
:::
