---
title: "Structured concurrency: Promise.all và errgroup"
description: "Promise.all/allSettled/any kết hợp AbortController của Node.js so với errgroup, sync.WaitGroup và channel của Go: huỷ các tác vụ anh em khi một tác vụ lỗi, giới hạn số tác vụ chạy cùng lúc, gom mọi kết quả và lấy kết quả nhanh nhất."
date: "2026-10-01"
order: 770
category: async
languages: [js, go]
versions:
  js: "17.2"
  go: "1.25"
tags: [concurrency, promise, errgroup, waitgroup, context]
---

"Structured concurrency" là một nguyên tắc đơn giản: mọi tác vụ con được khởi động trong một phạm vi phải kết thúc trước khi phạm vi đó kết thúc — không có tác vụ nào "trôi" ra ngoài, và lỗi của một tác vụ con được báo về cho phạm vi cha. Node.js có sẵn các bộ kết hợp `Promise.all`/`allSettled`/`any`/`race`, nhưng chúng chỉ *chờ* — không huỷ gì cả: khi `Promise.all` reject vì một promise lỗi, các promise còn lại vẫn chạy tiếp cho tới xong. Muốn các tác vụ anh em dừng lại, phải tự truyền vào một `AbortSignal` (xem bài [huỷ tác vụ](/posts/cancellation)). Go không có kiểu Promise; các mẫu tương đương được ghép từ goroutine, `sync.WaitGroup`, channel và `context` — với `errgroup` (gói `golang.org/x/sync`, nằm ngoài thư viện chuẩn) là mảnh ghép gần với "Promise.all có huỷ" nhất.

## Lỗi đầu tiên huỷ các tác vụ anh em (Promise.all + AbortController / errgroup)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

// work giả lập một việc mất `ms` mili giây, có thể thất bại, và dừng sớm
// khi signal bị abort.
async function work({ name, ms, fail }, signal) {
  await sleep(ms, undefined, { signal });
  if (fail) throw new Error(`${name} failed`);
  return `${name} ok`;
}

// all: như Promise.all, nhưng lỗi đầu tiên abort các task anh em, và chỉ
// trả về khi MỌI task đã dừng hẳn (giống errgroup.Wait).
async function all(tasks) {
  const controller = new AbortController();
  const settled = await Promise.allSettled(
    tasks.map(async (task) => {
      try {
        return await work(task, controller.signal);
      } catch (err) {
        controller.abort(err); // abort lần hai trở đi không làm gì: reason giữ lỗi đầu tiên
        throw err;
      }
    }),
  );
  if (controller.signal.aborted) {
    const statuses = settled.map((s) =>
      s.status === "fulfilled" ? "ok" : s.reason.name === "AbortError" ? "cancelled" : "failed",
    );
    console.log(statuses); // → [ 'cancelled', 'failed', 'cancelled' ]
    throw controller.signal.reason;
  }
  return settled.map((s) => s.value);
}

try {
  await all([
    { name: "A", ms: 100 },
    { name: "B", ms: 50, fail: true }, // B lỗi ở ~50ms, trước khi A và C xong
    { name: "C", ms: 300 },
  ]);
} catch (err) {
  console.log("error:", err.message); // → error: B failed
}
```
```go
// cần go.mod: go mod init example.com/app && go get golang.org/x/sync
package main

import (
	"context"
	"errors"
	"fmt"
	"time"

	"golang.org/x/sync/errgroup"
)

type task struct {
	name string
	d    time.Duration
	fail bool
}

// work giả lập một việc mất t.d, có thể thất bại, và dừng sớm khi ctx bị huỷ.
func work(ctx context.Context, t task) (string, error) {
	timer := time.NewTimer(t.d)
	defer timer.Stop()

	select {
	case <-timer.C:
	case <-ctx.Done():
		return "", ctx.Err()
	}
	if t.fail {
		return "", fmt.Errorf("%s failed", t.name)
	}
	return t.name + " ok", nil
}

func main() {
	tasks := []task{
		{name: "A", d: 100 * time.Millisecond},
		{name: "B", d: 50 * time.Millisecond, fail: true}, // B lỗi ở ~50ms, trước khi A và C xong
		{name: "C", d: 300 * time.Millisecond},
	}

	// ctx bị huỷ ngay khi một goroutine trong g trả về lỗi đầu tiên
	g, ctx := errgroup.WithContext(context.Background())
	statuses := make([]string, len(tasks))

	for i, t := range tasks {
		g.Go(func() error {
			_, err := work(ctx, t)
			switch {
			case errors.Is(err, context.Canceled):
				statuses[i] = "cancelled"
			case err != nil:
				statuses[i] = "failed"
			default:
				statuses[i] = "ok"
			}
			return err
		})
	}

	err := g.Wait()            // chờ MỌI goroutine dừng hẳn, rồi trả về lỗi đầu tiên
	fmt.Println(statuses)      // → [cancelled failed cancelled]
	fmt.Println("error:", err) // → error: B failed
}
```
:::

:::warning
Đừng dùng thẳng `Promise.all` ở đây: nó reject ngay khi B lỗi (~50ms) và trả quyền điều khiển về cho bạn trong khi A và C *vẫn đang chạy* — kể cả khi bạn có abort chúng, `Promise.all` không chờ chúng dừng hẳn. Hàm `all` ở trên dùng `Promise.allSettled` để chờ mọi task kết thúc (kể cả phần dọn dẹp sau khi bị abort) rồi mới ném lỗi đầu tiên — đúng ngữ nghĩa của `errgroup.Wait()`.
:::

:::note
`errgroup` nằm trong `golang.org/x/sync`, không phải thư viện chuẩn, nên ví dụ Go cần một module: `go mod init example.com/app` rồi `go get golang.org/x/sync`. Bản `x/sync` mới nhất có thể đòi một toolchain Go mới hơn bản tối thiểu ghi ở đầu bài (từ v0.23.0 nó khai báo `go 1.26`); với Go 1.25, ghim bản cuối cùng còn khai báo `go 1.25.0`: `go get golang.org/x/sync@v0.22.0`. Nếu không ghim, `go get` sẽ nâng dòng `go` trong go.mod lên 1.26 và với `GOTOOLCHAIN=auto` (mặc định) lặng lẽ tải toolchain Go 1.26 về để build. `controller.abort(reason)`/`signal.reason` có từ Node.js 17.2 (cũng được backport về 16.14 trên nhánh 16.x, nhưng 17.0–17.1 không có, nên mốc của bài là 17.2).
:::

## Giới hạn số tác vụ chạy cùng lúc (mapLimit / g.SetLimit)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

// mapLimit: chạy fn trên mọi item nhưng không quá `limit` việc cùng lúc —
// Node.js không có sẵn, nên tự dựng bằng `limit` "worker" cùng lấy từ một hàng đợi.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  let failed = false;

  async function worker() {
    while (!failed && next < items.length) {
      const i = next++; // an toàn: JS đơn luồng, không có gì chen vào giữa đọc và tăng
      try {
        results[i] = await fn(items[i]);
      } catch (err) {
        failed = true; // worker khác thấy cờ này và ngừng lấy item mới
        throw err;
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

let inFlight = 0;
let maxInFlight = 0;

const squares = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
  inFlight++;
  maxInFlight = Math.max(maxInFlight, inFlight);
  await sleep(20); // giả lập I/O
  inFlight--;
  return n * n;
});

console.log(squares);     // → [ 1, 4, 9, 16, 25, 36 ]
console.log(maxInFlight); // → 2 (tối đa)
```
```go
// cần go.mod: go mod init example.com/app && go get golang.org/x/sync
package main

import (
	"fmt"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"
)

func main() {
	items := []int{1, 2, 3, 4, 5, 6}
	squares := make([]int, len(items))

	var mu sync.Mutex
	inFlight, maxInFlight := 0, 0

	var g errgroup.Group // không cần ctx thì dùng zero value
	g.SetLimit(2)        // g.Go chặn lại cho tới khi số goroutine đang chạy < 2

	for i, n := range items {
		g.Go(func() error {
			mu.Lock()
			inFlight++
			maxInFlight = max(maxInFlight, inFlight)
			mu.Unlock()

			time.Sleep(20 * time.Millisecond) // giả lập I/O

			mu.Lock()
			inFlight--
			mu.Unlock()

			squares[i] = n * n
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		fmt.Println("error:", err)
		return
	}
	fmt.Println(squares)     // → [1 4 9 16 25 36]
	fmt.Println(maxInFlight) // → 2 (tối đa; máy chậm có thể thấp hơn)
}
```
:::

:::note
Trong Node.js, `inFlight++` không cần lock vì mọi callback chạy trên cùng một luồng; ở Go, các goroutine chạy song song thật nên bộ đếm dùng chung phải được bảo vệ bằng `sync.Mutex` (hoặc `sync/atomic`). Ngược lại, `squares[i] = …` không cần lock ở cả hai: mỗi tác vụ chỉ ghi vào ô của riêng nó. Kết hợp `errgroup.WithContext` với `SetLimit` để vừa giới hạn vừa huỷ khi có lỗi. Trong `mapLimit`, khi một việc lỗi, cờ `failed` chỉ khiến các worker khác ngừng lấy item mới — việc đang chạy dở vẫn chạy tới xong ở chế độ nền sau khi `mapLimit` đã reject; muốn dừng cả chúng thì truyền thêm một `AbortSignal` như phần đầu.
:::

## Gom mọi kết quả, kể cả lỗi (Promise.allSettled / WaitGroup + errors.Join)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

async function check(name, ms, fail = false) {
  await sleep(ms);
  if (fail) throw new Error(`${name} unreachable`);
  return `${name} healthy`;
}

// allSettled không bao giờ reject: chờ mọi promise, kể cả khi vài cái lỗi
const settled = await Promise.allSettled([
  check("db", 50),
  check("cache", 20, true),
  check("queue", 30, true),
]);

for (const s of settled) {
  console.log(s.status, s.status === "fulfilled" ? s.value : s.reason.message);
}
// → fulfilled db healthy
// → rejected cache unreachable
// → rejected queue unreachable
```
```go
package main

import (
	"errors"
	"fmt"
	"sync"
	"time"
)

func check(name string, d time.Duration, fail bool) (string, error) {
	time.Sleep(d)
	if fail {
		return "", fmt.Errorf("%s unreachable", name)
	}
	return name + " healthy", nil
}

func main() {
	type spec struct {
		name string
		d    time.Duration
		fail bool
	}
	specs := []spec{
		{"db", 50 * time.Millisecond, false},
		{"cache", 20 * time.Millisecond, true},
		{"queue", 30 * time.Millisecond, true},
	}

	// mỗi goroutine ghi vào ô riêng của nó: không cần lock, thứ tự giữ nguyên
	values := make([]string, len(specs))
	errs := make([]error, len(specs))

	var wg sync.WaitGroup
	for i, s := range specs {
		wg.Go(func() {
			values[i], errs[i] = check(s.name, s.d, s.fail)
		})
	}
	wg.Wait() // chờ tất cả, không huỷ ai — giống allSettled

	for i := range specs {
		if errs[i] != nil {
			fmt.Println("rejected", errs[i])
		} else {
			fmt.Println("fulfilled", values[i])
		}
	}

	// errors.Join gộp mọi lỗi khác nil thành một (nil nếu không có lỗi nào)
	if err := errors.Join(errs...); err != nil {
		fmt.Printf("%q\n", err.Error())
	}
}

// → fulfilled db healthy
// → rejected cache unreachable
// → rejected queue unreachable
// → "cache unreachable\nqueue unreachable"
```
:::

:::note
Go 1.25 thêm `wg.Go(f)`, thay cho cặp `wg.Add(1)` + `go func() { defer wg.Done(); f() }()`; `errors.Join` có từ Go 1.20 và `errors.Is`/`errors.As` vẫn tìm được từng lỗi bên trong lỗi gộp. `Promise.allSettled` có từ Node.js 12.9. Kết quả ở cả hai giữ đúng thứ tự đầu vào, không phải thứ tự hoàn thành.
:::

## Lấy kết quả thành công đầu tiên (Promise.any / channel + cancel)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

async function fetchFrom({ name, ms, fail }, signal) {
  await sleep(ms, undefined, { signal });
  if (fail) throw new Error(`${name} down`);
  return `data from ${name}`;
}

async function fastest(mirrors) {
  const controller = new AbortController();
  try {
    // any: lấy kết quả THÀNH CÔNG đầu tiên, bỏ qua các lần thất bại
    return await Promise.any(mirrors.map((m) => fetchFrom(m, controller.signal)));
  } finally {
    controller.abort(); // huỷ các request còn đang chạy — Promise.any không tự làm việc này
  }
}

console.log(await fastest([
  { name: "eu", ms: 300 },
  { name: "us", ms: 100 },
  { name: "asia", ms: 50, fail: true }, // lỗi sớm nhất, nhưng any bỏ qua
])); // → data from us

try {
  await fastest([{ name: "eu", ms: 30, fail: true }, { name: "us", ms: 10, fail: true }]);
} catch (err) {
  console.log(err.name, err.errors.map((e) => e.message)); // → AggregateError [ 'eu down', 'us down' ]
}
```
```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"
)

type mirror struct {
	name string
	d    time.Duration
	fail bool
}

func fetchFrom(ctx context.Context, m mirror) (string, error) {
	timer := time.NewTimer(m.d)
	defer timer.Stop()

	select {
	case <-timer.C:
	case <-ctx.Done():
		return "", ctx.Err()
	}
	if m.fail {
		return "", fmt.Errorf("%s down", m.name)
	}
	return "data from " + m.name, nil
}

// fastest trả về kết quả THÀNH CÔNG đầu tiên, giống Promise.any; nếu tất cả
// đều lỗi thì trả về mọi lỗi gộp lại, giống AggregateError.
func fastest(mirrors []mirror) (string, error) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel() // huỷ các goroutine thua cuộc khi đã có người thắng

	type result struct {
		data string
		err  error
	}
	// buffered đủ chỗ cho mọi goroutine: kẻ thua gửi xong là thoát, không bị
	// kẹt mãi vì không còn ai nhận (goroutine leak)
	results := make(chan result, len(mirrors))
	for _, m := range mirrors {
		go func() {
			data, err := fetchFrom(ctx, m)
			results <- result{data, err}
		}()
	}

	errs := make([]error, 0, len(mirrors))
	for range mirrors {
		r := <-results
		if r.err == nil {
			return r.data, nil
		}
		errs = append(errs, r.err)
	}
	return "", errors.Join(errs...)
}

func main() {
	data, err := fastest([]mirror{
		{"eu", 300 * time.Millisecond, false},
		{"us", 100 * time.Millisecond, false},
		{"asia", 50 * time.Millisecond, true}, // lỗi sớm nhất, nhưng bị bỏ qua
	})
	fmt.Println(data, err) // → data from us <nil>

	_, err = fastest([]mirror{
		{"eu", 30 * time.Millisecond, true},
		{"us", 10 * time.Millisecond, true},
	})
	fmt.Printf("%q\n", err.Error()) // → "us down\neu down" (theo thứ tự lỗi về)
}
```
:::

:::note
`AggregateError.errors` giữ thứ tự đầu vào (`eu` trước `us`), còn bản Go gom lỗi theo thứ tự chúng về qua channel (`us` lỗi trước nên đứng trước). `Promise.race` khác `any` ở chỗ nó settle theo promise *đầu tiên settle*, kể cả khi đó là một lỗi — ở ví dụ đầu, `race` sẽ reject với `asia down`. Bản Go của `race` là nhận giá trị đầu tiên từ channel, không quan tâm `err` có nil hay không. Lưu ý cả hai hàm `fastest` đều trả về ngay khi có người thắng mà không chờ các tác vụ thua dừng hẳn — chúng chỉ được *báo* huỷ.
:::

## Khác biệt chính

| | Node.js | Go |
|---|---|---|
| Lỗi đầu tiên reject ngay (không chờ, không huỷ) | `Promise.all` | không có tương đương trực tiếp |
| Chờ tất cả rồi trả lỗi đầu tiên | `Promise.allSettled` + ném lại lỗi (hàm `all` ở trên) | `errgroup.Group.Wait()` |
| Lỗi đầu tiên huỷ anh em | `AbortController` truyền thủ công | `errgroup.WithContext` |
| Giới hạn số tác vụ cùng lúc | tự viết (hoặc thư viện như `p-limit`) | `g.SetLimit(n)` |
| Gom mọi kết quả và lỗi | `Promise.allSettled` | `sync.WaitGroup` + `errors.Join` |
| Thành công đầu tiên | `Promise.any` → `AggregateError` | buffered channel + `cancel()` → `errors.Join` |
| Settle đầu tiên | `Promise.race` | giá trị đầu tiên nhận từ channel |
