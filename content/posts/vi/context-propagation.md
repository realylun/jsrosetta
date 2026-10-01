---
title: "Truyền ngữ cảnh theo request: AsyncLocalStorage và context.Context"
description: "AsyncLocalStorage của Node.js tự mang request ID theo chuỗi async, so với context.Context của Go phải truyền tường minh qua từng hàm."
date: "2026-10-01"
order: 780
category: async
languages: [js, go]
versions:
  js: "14.13.1"
  go: "1.25"
tags: [async-local-storage, context, request-id, logging, goroutine]
---

Một request đi qua handler, service, repository rồi tới logger. Logger muốn in request ID, nhưng chẳng ai muốn thêm tham số `requestId` vào mọi hàm ở giữa. Node.js giải quyết **ngầm định**: `AsyncLocalStorage` (trong `node:async_hooks`) gắn một "store" vào chuỗi bất đồng bộ đang chạy, và store đó tự đi theo qua `await`, promise, timer — hàm ở tầng sâu nhất chỉ cần gọi `getStore()`. Go cố tình **không** có goroutine-local storage: goroutine không có ID công khai, không có biến "của riêng goroutine này". Thay vào đó, `context.Context` mang các giá trị theo request một cách **tường minh** — mọi hàm cần nó đều nhận `ctx` làm tham số đầu tiên. Ngầm định thì gọn hơn; tường minh thì nhìn chữ ký hàm là biết hàm nào phụ thuộc vào ngữ cảnh.

## Gắn giá trị cho một request và đọc ở tầng sâu (run/getStore vs WithValue/Value)

:::tabs
```js
import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage();

// Logger ở tầng sâu nhất: không nhận requestId qua tham số.
function log(message) {
  const store = requestContext.getStore(); // undefined nếu không nằm trong run()
  console.log(`[${store?.requestId ?? "-"}] ${message}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadUser(id) {
  await sleep(10);
  log(`loaded user ${id}`);
  return { id };
}

function handleRequest(requestId, userId) {
  // Mọi thứ chạy bên trong callback, kể cả sau await, đều thấy cùng store.
  return requestContext.run({ requestId }, async () => {
    log("start");
    await loadUser(userId);
    log("done");
  });
}

// Hai request chạy xen kẽ nhau nhưng không lẫn requestId.
await Promise.all([handleRequest("req-1", 1), handleRequest("req-2", 2)]);
log("outside");
// → [req-1] start
// → [req-2] start
// → [req-1] loaded user 1
// → [req-1] done
// → [req-2] loaded user 2
// → [req-2] done
// → [-] outside
```
```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// Kiểu key không export: package khác không thể tạo ra key trùng.
type requestIDKey struct{}

func withRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, requestIDKey{}, id) // trả về ctx mới, ctx cũ không đổi
}

// Logger ở tầng sâu nhất vẫn phải nhận ctx làm tham số.
func log(ctx context.Context, message string) {
	id, ok := ctx.Value(requestIDKey{}).(string) // Value trả về any: cần type assertion
	if !ok {
		id = "-"
	}
	fmt.Printf("[%s] %s\n", id, message)
}

func loadUser(ctx context.Context, id int) {
	time.Sleep(10 * time.Millisecond)
	log(ctx, fmt.Sprintf("loaded user %d", id))
}

func handleRequest(ctx context.Context, requestID string, userID int) {
	ctx = withRequestID(ctx, requestID)
	log(ctx, "start")
	loadUser(ctx, userID) // ctx luôn là tham số đầu tiên, theo quy ước
	log(ctx, "done")
}

func main() {
	ctx := context.Background()

	var wg sync.WaitGroup
	wg.Go(func() { handleRequest(ctx, "req-1", 1) })
	wg.Go(func() { handleRequest(ctx, "req-2", 2) })
	wg.Wait()

	log(ctx, "outside")
}

// → [req-1] start
// → [req-2] start
// → [req-1] loaded user 1
// → [req-1] done
// → [req-2] loaded user 2
// → [req-2] done
// → [-] outside
// (thứ tự giữa req-1 và req-2 có thể đổi mỗi lần chạy)
```
:::

:::note
`run(store, fn)` chạy `fn` ngay lập tức với `store` làm ngữ cảnh và trả về đúng giá trị `fn` trả về (ở đây là một promise, nên `await` được). Ra khỏi `run()`, `getStore()` lại trả về `undefined`. Bên Go, `context.WithValue` không sửa `ctx` cũ mà tạo một context con trỏ về context cha; `ctx.Value(key)` tìm ngược lên chuỗi cha cho tới khi gặp key, nên kết quả luôn là `any` và cần type assertion `.(string)`.
:::

:::tip
Tài liệu của Go khuyên key **không** nên là `string` hay kiểu có sẵn khác, để hai package không vô tình dùng chung một key; cách quen thuộc là một kiểu `struct{}` không export như `requestIDKey` ở trên. Cũng theo tài liệu đó: chỉ dùng context value cho dữ liệu thuộc về request (request ID, thông tin xác thực, trace span…), **không** dùng nó để truyền tham số tuỳ chọn cho hàm. Và không lưu `Context` trong struct — truyền nó làm tham số đầu tiên, thường đặt tên `ctx`.
:::

## Ngữ cảnh đi theo timer, promise và goroutine

Sự khác biệt rõ nhất: callback được *lên lịch* bên trong `run()` sẽ mang store theo, dù tới lúc nó chạy thì `run()` đã return từ lâu. Goroutine mới ở Go thì không thừa hưởng gì — nó chỉ có những gì được truyền vào.

:::tabs
```js
import { AsyncLocalStorage } from "node:async_hooks";
import { EventEmitter } from "node:events";

const requestContext = new AsyncLocalStorage();
const currentId = () => requestContext.getStore()?.requestId ?? "-";

requestContext.run({ requestId: "req-1" }, () => {
  // Callback được lên lịch bên trong run() mang theo store, dù chạy sau khi run() đã return.
  setTimeout(() => console.log("timeout:", currentId()), 10);
  Promise.resolve().then(() => console.log("then:", currentId()));
});

// Lên lịch bên ngoài run(): không có store.
setTimeout(() => console.log("outside:", currentId()), 20);

// Listener của EventEmitter chạy trong ngữ cảnh của emit(), không phải của on().
const emitter = new EventEmitter();
requestContext.run({ requestId: "req-1" }, () => {
  emitter.on("job", () => console.log("listener:", currentId()));
});
requestContext.run({ requestId: "req-2" }, () => emitter.emit("job"));
// → listener: req-2
// → then: req-1
// → timeout: req-1
// → outside: -
```
```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type requestIDKey struct{}

func requestID(ctx context.Context) string {
	if id, ok := ctx.Value(requestIDKey{}).(string); ok {
		return id
	}
	return "-"
}

// Goroutine không thừa hưởng gì từ goroutine đã tạo ra nó:
// muốn có request ID thì phải nhận ctx qua tham số.
func worker(ctx context.Context, name string) {
	fmt.Printf("%s: %s\n", name, requestID(ctx))
}

func main() {
	ctx := context.WithValue(context.Background(), requestIDKey{}, "req-1")

	var wg sync.WaitGroup
	wg.Go(func() { worker(ctx, "goroutine") })                   // truyền ctx tường minh
	wg.Go(func() { worker(context.Background(), "forgot ctx") }) // quên truyền: mất request ID
	wg.Wait()

	// time.AfterFunc cũng vậy: callback chỉ thấy ctx nếu closure bắt (capture) nó.
	done := make(chan struct{})
	time.AfterFunc(10*time.Millisecond, func() {
		worker(ctx, "timer")
		close(done)
	})
	<-done
}

// → goroutine: req-1
// → forgot ctx: -
// → timer: req-1
// (hai dòng đầu có thể đổi chỗ cho nhau)
```
:::

:::warning
Store được "chụp" lại tại thời điểm một thao tác bất đồng bộ được **tạo ra** — `setTimeout`, `.then`, `await`… — và callback của thao tác đó sau này chạy với store đã chụp. `EventEmitter` là trường hợp hay gây nhầm: `on()` chỉ thêm một hàm vào danh sách, không tạo thao tác bất đồng bộ nào, nên không chụp gì cả; listener chạy đồng bộ bên trong `emit()` và thấy store của người gọi `emit()` (ở đây là `req-2`), không phải store lúc gọi `on()`. Muốn "đóng băng" ngữ cảnh lúc đăng ký thì bọc callback bằng `AsyncLocalStorage.bind(fn)` (có từ Node.js 18.16).
:::

## Store là object có thể sửa (gom dữ liệu theo request)

Store chỉ là một giá trị JavaScript bình thường. Nếu đó là object, mọi hàm trong cùng chuỗi async đều sửa được nó, và người gọi `run()` thấy được thay đổi sau khi xong. Context của Go thì bất biến: muốn gom dữ liệu thì cất một con trỏ vào context, và tự lo đồng bộ khi nhiều goroutine cùng ghi.

:::tabs
```js
import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function query(sql) {
  requestContext.getStore().queries.push(sql); // store là object thường: sửa trực tiếp được
  await sleep(1);
}

async function handleRequest() {
  await query("SELECT * FROM users");
  await Promise.all([query("SELECT * FROM orders"), query("SELECT * FROM items")]);
}

const store = { requestId: "req-1", queries: [] };
await requestContext.run(store, handleRequest);

// Thay đổi bên trong vẫn nhìn thấy được từ bên ngoài, vì cùng một object.
console.log(`${store.requestId} ran ${store.queries.length} queries`);
// → req-1 ran 3 queries
```
```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// Giá trị trong context không sửa được (WithValue luôn tạo ctx mới),
// nên muốn gom dữ liệu theo request thì lưu một con trỏ.
type queryLog struct {
	mu      sync.Mutex // các goroutine của cùng request có thể ghi đồng thời
	queries []string
}

type queryLogKey struct{}

func query(ctx context.Context, sql string) {
	ql := ctx.Value(queryLogKey{}).(*queryLog) // panic nếu thiếu: dùng dạng `v, ok :=` nếu không chắc
	ql.mu.Lock()
	ql.queries = append(ql.queries, sql)
	ql.mu.Unlock()
	time.Sleep(time.Millisecond)
}

func handleRequest(ctx context.Context) {
	query(ctx, "SELECT * FROM users")

	var wg sync.WaitGroup
	wg.Go(func() { query(ctx, "SELECT * FROM orders") })
	wg.Go(func() { query(ctx, "SELECT * FROM items") })
	wg.Wait()
}

func main() {
	ql := &queryLog{}
	ctx := context.WithValue(context.Background(), queryLogKey{}, ql)
	handleRequest(ctx)

	fmt.Printf("req-1 ran %d queries\n", len(ql.queries)) // → req-1 ran 3 queries
}
```
:::

:::note
Node.js còn có `asyncLocalStorage.enterWith(store)`: gán store cho phần còn lại của đoạn code đồng bộ hiện tại mà không cần callback. Tài liệu Node.js khuyên dùng `run()` thay vì `enterWith()` trừ khi có lý do thật sự, vì ngữ cảnh "rò" ra ngoài ý muốn — ví dụ listener đầu tiên của một event gọi `enterWith()` thì các listener sau cũng chạy trong store đó. Từ Node.js 24, `AsyncLocalStorage` mặc định được cài đặt trên `AsyncContextFrame` thay vì async hooks, nhưng API và kết quả của các ví dụ trên không đổi.
:::

:::note
`AsyncLocalStorage` xuất hiện từ Node.js 13.10.0 / 12.17.0 và được đánh dấu stable từ 16.4.0. Mức tối thiểu 14.13.1 ở đây là do các ví dụ là ES module dùng top-level `await` (14.8) và import dạng `node:` (14.13.1). Bên Go, gói `context` có từ 1.7; các ví dụ cần Go 1.25 chỉ vì dùng `sync.WaitGroup.Go`.
:::

## Khác biệt chính

| | Node.js | Go |
|---|---|---|
| Cách truyền | ngầm định, theo chuỗi async | tường minh, `ctx` là tham số đầu tiên |
| Gắn và đọc giá trị | `als.run(store, fn)` / `als.getStore()` | `context.WithValue(ctx, key, v)` / `ctx.Value(key)` |
| Qua timer, promise / goroutine | tự đi theo `setTimeout`, `.then`, `await` | không tự đi theo: phải truyền `ctx` vào goroutine hay closure |
| Sửa giá trị | store là object thường, sửa trực tiếp được | bất biến: `WithValue` tạo ctx mới; muốn gom dữ liệu thì cất con trỏ + lock |
| Kiểu dữ liệu | store là giá trị JS bất kỳ | `Value` trả về `any`, cần type assertion (`v, ok := …(string)`) |
