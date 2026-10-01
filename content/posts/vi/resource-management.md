---
title: "Dọn dẹp tài nguyên: using và defer"
description: "using/await using, Symbol.dispose và DisposableStack của Node.js so với defer của Go: phạm vi block hay hàm, thứ tự LIFO và lỗi khi đóng tài nguyên."
date: "2026-10-01"
order: 830
category: errors
languages: [js, go]
versions:
  js: "24"
  go: "1.20"
tags: [using, dispose, defer, cleanup, disposable-stack]
---

Mở file, lấy lock, kết nối database — thứ gì đã mở thì phải đóng, kể cả khi code ở giữa ném lỗi. JavaScript từ lâu chỉ có `try/finally` cho việc này. Đề xuất **Explicit Resource Management** (TC39 Stage 4, nằm trong ES2027) thêm khai báo `using` / `await using`: biến khai báo bằng `using` sẽ tự gọi `[Symbol.dispose]()` (hoặc `await [Symbol.asyncDispose]()`) khi ra khỏi **block** chứa nó. Go có `defer` từ phiên bản đầu tiên: lời gọi được hoãn tới khi **hàm** chứa nó return. Cả hai đều dọn dẹp theo thứ tự ngược với lúc mở (LIFO), nhưng khác nhau ở phạm vi — block hay hàm — và đó là chỗ dễ vấp nhất.

## Dọn dẹp đồng bộ (using vs defer)

:::tabs
```js
class Lock {
  constructor(name) {
    this.name = name;
    console.log(`lock ${name}`);
  }

  // Bất kỳ object nào có [Symbol.dispose]() đều dùng được với `using`.
  [Symbol.dispose]() {
    console.log(`unlock ${this.name}`);
  }
}

function transfer(fail) {
  using lock = new Lock("account");
  if (fail) throw new Error("insufficient funds");
  console.log("transferred");
} // lock[Symbol.dispose]() chạy ở đây, kể cả khi throw

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
	defer lock.Unlock() // chạy khi transfer return, dù return ở nhánh nào (kể cả panic)

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
`using` không phải hàm gọi dọn dẹp mà là một khai báo biến: giá trị phải có `[Symbol.dispose]()` (hoặc là `null`/`undefined`, khi đó không làm gì), và biến là hằng như `const`. Go thì không có giao diện đặc biệt nào — `defer` hoãn **bất kỳ** lời gọi hàm nào; quy ước `Close() error` (giao diện `io.Closer`) chỉ là thói quen của thư viện chuẩn.
:::

## Dọn dẹp bất đồng bộ (await using vs defer)

Đóng kết nối mạng hay flush file thường là thao tác async trong Node.js. `await using` gọi `await value[Symbol.asyncDispose]()` khi ra khỏi block. Go không phân biệt đồng bộ/bất đồng bộ: `Close()` chỉ block tới khi xong, nên vẫn là `defer` như cũ.

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

  // Dọn dẹp bất đồng bộ: `await using` sẽ await hàm này.
  async [Symbol.asyncDispose]() {
    await new Promise((resolve) => setTimeout(resolve, 10));
    console.log(`disconnected ${this.name}`);
  }
}

async function exportReport() {
  await using db = await Connection.connect("db");
  await using file = await open(path, "w"); // FileHandle của fs/promises có sẵn Symbol.asyncDispose
  await file.write(`report from ${db.name}\n`);
  console.log("written");
} // await file.close(), rồi await db[Symbol.asyncDispose]()

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

// Go không tách "đồng bộ" và "bất đồng bộ": Close chỉ đơn giản là block tới khi xong.
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
		return err // chỉ defer sau khi chắc chắn mở thành công
	}
	defer func() {
		err = errors.Join(err, file.Close()) // file ghi: đừng nuốt lỗi Close (xem phần cuối bài)
	}()

	if _, err := fmt.Fprintf(file, "report from %s\n", db.name); err != nil {
		return err
	}
	fmt.Println("written")
	return nil
} // file.Close(), rồi db.Close()

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
Một số API của Node.js đã cài sẵn các symbol này, nên dùng thẳng với `using`/`await using` được: `FileHandle` của `fs/promises` có `[Symbol.asyncDispose]()` (gọi `close()`), `Dir` có cả `[Symbol.dispose]()` lẫn `[Symbol.asyncDispose]()`, và `Timeout`/`Immediate` trả về từ `setTimeout`/`setImmediate` có `[Symbol.dispose]()` (huỷ timer). `mkdtempDisposable()` của `fs/promises` (và `fs.mkdtempDisposableSync()`, Node.js 24.4) tạo thư mục tạm tự xoá cùng nội dung khi dispose. Các API này xuất hiện ở những thời điểm khác nhau — `FileHandle` từ 20.4/18.18, `Timeout`/`Immediate` từ 20.5/18.18, `Dir` từ 24.1 (và 22.1) — và đều bị đánh dấu experimental cho tới Node.js 24.2.
:::

## Nhiều tài nguyên: thứ tự LIFO (DisposableStack vs defer)

Cả hai ngôn ngữ đều đóng theo thứ tự ngược: thứ mở sau đóng trước, vì nó có thể phụ thuộc vào thứ mở trước. Khi số tài nguyên chỉ biết lúc chạy, JavaScript dùng `DisposableStack` (bản async là `AsyncDisposableStack`); Go không cần gì thêm vì mỗi hàm vốn đã có một ngăn xếp defer.

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
} // đóng ngược thứ tự mở: b rồi a

// Số tài nguyên chỉ biết lúc chạy: gom vào một DisposableStack.
function dynamic(names) {
  using stack = new DisposableStack();
  for (const name of names) {
    stack.use(acquire(name));
  }
  stack.defer(() => console.log("flush log")); // gần với `defer` của Go nhất
  console.log("work");
} // stack dispose mọi thứ theo LIFO

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
} // defer chạy theo LIFO: b rồi a

// Mỗi hàm đã có sẵn một "stack" defer, nên số lượng động không cần gì thêm.
func dynamic(names []string) {
	for _, name := range names {
		defer acquire(name).Close() // acquire chạy ngay, chỉ Close bị hoãn
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
`stack.use(value)` đăng ký một disposable, `stack.adopt(value, fn)` bọc giá trị không có `Symbol.dispose`, `stack.defer(fn)` đăng ký một callback bất kỳ. `stack.move()` chuyển toàn bộ tài nguyên sang một stack mới — hữu ích trong constructor: mở nhiều thứ, nếu giữa chừng lỗi thì `using stack` dọn những gì đã mở, còn nếu thành công thì `move()` để giữ lại cho object.
:::

## Phạm vi: block (using) hay hàm (defer)

Đây là khác biệt quan trọng nhất. `using` dọn dẹp ở cuối **block**, nên trong vòng lặp mỗi vòng đóng tài nguyên của nó. `defer` chỉ chạy khi **hàm** return — `defer` trong vòng lặp sẽ giữ mọi tài nguyên mở cho tới cuối hàm.

:::tabs
```js
function acquire(name) {
  console.log(`open ${name}`);
  return { [Symbol.dispose]: () => console.log(`close ${name}`) };
}

for (const name of ["a", "b"]) {
  using file = acquire(name);
  console.log(`use ${name}`);
} // `using` gắn với block: dispose ở cuối mỗi vòng lặp
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

// Sai: defer gắn với hàm, không phải block — mọi file chỉ được đóng khi hàm return.
func leaky(names []string) {
	for _, name := range names {
		file := acquire(name)
		defer file.Close()
		fmt.Println("use", name)
	}
	fmt.Println("loop done")
}

// Đúng: tách thân vòng lặp thành hàm riêng để mỗi vòng có phạm vi defer của nó.
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
`defer` trong vòng lặp là lỗi kinh điển của Go: duyệt 10.000 file thì 10.000 file descriptor mở cùng lúc, và có thể chạm giới hạn của hệ điều hành trước khi hàm kịp return. Tách thân vòng lặp ra một hàm riêng (hoặc một closure gọi ngay như trên) để mỗi vòng có phạm vi `defer` riêng.
:::

## Lỗi khi dọn dẹp (SuppressedError vs errors.Join)

Nếu thân block ném lỗi rồi việc dọn dẹp cũng ném lỗi, lỗi nào được giữ lại? JavaScript gói cả hai vào một `SuppressedError`: `error` là lỗi mới (từ dispose), `suppressed` là lỗi bị nó đè lên (từ thân block). Go không có cơ chế tự động nào — `defer f.Close()` âm thầm bỏ qua lỗi trả về; muốn giữ lỗi thì dùng named return và `errors.Join`.

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
  // Cả thân hàm lẫn dispose đều throw: lỗi bị gói trong SuppressedError.
  console.log(err instanceof SuppressedError); // → true
  console.log(err.error.message); // → close a.txt failed  (lỗi mới nhất, từ dispose)
  console.log(err.suppressed.message); // → write failed  (lỗi bị "đè", từ thân hàm)
}

// Chỉ dispose throw: nhận đúng lỗi đó, không có SuppressedError.
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

// Named return `err` cho phép hàm defer đọc và sửa giá trị trả về.
func save() (err error) {
	f := &file{}
	defer func() {
		err = errors.Join(err, f.Close()) // giữ cả hai lỗi; Join bỏ qua nil
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
Với file **ghi**, lỗi của `Close()` đáng để ý: một số hệ thống file (ví dụ NFS) chỉ báo lỗi ghi lúc đóng, nên `defer f.Close()` trơn có thể nuốt mất lỗi đó. Với file chỉ đọc thì bỏ qua lỗi `Close()` thường không sao. `errors.Join` có từ Go 1.20 và bỏ qua các đối số `nil`, nên khi không có lỗi nào thì `err` vẫn là `nil`.
:::

:::note
`using`, `DisposableStack` và `SuppressedError` có trong V8 13.6 — engine của Node.js 24.0.0 (Node.js 23 dùng V8 12.9 và báo `SyntaxError` ngay ở dòng `using`). Không cần cờ dòng lệnh nào.
:::
