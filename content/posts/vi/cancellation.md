---
title: "Huỷ tác vụ: AbortController và context"
description: "AbortController/AbortSignal của Node.js so với context.Context của Go: huỷ thủ công, timeout, gộp nhiều tín hiệu huỷ và tự kiểm tra việc huỷ trong vòng lặp."
date: "2026-10-01"
order: 760
category: async
languages: [js, go]
versions:
  js: "20.3"
  go: "1.21"
tags: [cancellation, abortcontroller, context, timeout]
---

Một promise đã chạy thì không có cách nào "dừng" nó từ bên ngoài — Node.js giải quyết bằng một tín hiệu đi kèm: `AbortController` tạo ra một `AbortSignal`, ai muốn huỷ thì gọi `controller.abort()`, còn hàm nhận `signal` tự lắng nghe và dừng sớm. Go có `context.Context` đóng đúng vai trò đó: `ctx.Done()` là một channel bị đóng khi context bị huỷ, `ctx.Err()` cho biết lý do. Cả hai đều là cơ chế *hợp tác* (cooperative): không có gì bị "giết" cưỡng bức, code đang chạy phải tự kiểm tra tín hiệu và tự dừng. Khác biệt lớn nhất nằm ở cách lan truyền: context của Go được truyền tường minh làm tham số đầu tiên xuống toàn bộ cây lời gọi, và mỗi context con tự bị huỷ khi context cha bị huỷ; `AbortSignal` thì là một đối tượng độc lập, muốn gộp nhiều tín hiệu phải dùng `AbortSignal.any()`.

## Huỷ thủ công (abort / cancel)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

const controller = new AbortController();
const { signal } = controller;

signal.addEventListener("abort", () => {
  console.log("abort event:", signal.reason.message); // → abort event: user cancelled
}, { once: true });

// huỷ sau 100ms, trong khi công việc cần tới 1s
setTimeout(() => controller.abort(new Error("user cancelled")), 100);

try {
  await sleep(1000, "done", { signal });
} catch (err) {
  console.log(err.name);          // → AbortError
  console.log(err.cause.message); // → user cancelled
}

console.log(signal.aborted);        // → true
console.log(signal.reason.message); // → user cancelled
```
```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"
)

// sleep chờ d, hoặc trả về sớm khi ctx bị huỷ — giống setTimeout của
// node:timers/promises với { signal }.
func sleep(ctx context.Context, d time.Duration) error {
	timer := time.NewTimer(d)
	defer timer.Stop()

	select {
	case <-timer.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func main() {
	ctx, cancel := context.WithCancelCause(context.Background())
	defer cancel(nil) // luôn gọi cancel để giải phóng tài nguyên của ctx

	// huỷ sau 100ms, trong khi công việc cần tới 1s
	time.AfterFunc(100*time.Millisecond, func() {
		cancel(errors.New("user cancelled"))
	})

	if err := sleep(ctx, 1*time.Second); err != nil {
		fmt.Println(err)                              // → context canceled
		fmt.Println(errors.Is(err, context.Canceled)) // → true
		fmt.Println(context.Cause(ctx))               // → user cancelled
	}
}
```
:::

:::note
`controller.abort(reason)` và `signal.reason` có từ Node.js 17.2; gọi `abort()` không đối số thì `reason` là một `DOMException` tên `AbortError`. Ở Go, `ctx.Err()` chỉ có hai giá trị cố định (`context.Canceled` hoặc `context.DeadlineExceeded`); lý do cụ thể nằm riêng ở `context.Cause(ctx)`, đi kèm `WithCancelCause` từ Go 1.20. Phần lắng nghe sự kiện `"abort"` ở Go tương ứng với `context.AfterFunc(ctx, f)` (Go 1.21), hoặc một goroutine chờ `<-ctx.Done()`.
:::

:::warning
API của Node.js không thống nhất về lỗi khi bị abort: `setTimeout` của `node:timers/promises` và `events.once()` reject bằng một `AbortError` *bọc* lý do thật trong `err.cause` (như ví dụ trên), còn `fetch()` reject bằng *chính* `signal.reason` — với `abort(new Error("user cancelled"))` thì `fetch` ném đúng `Error` đó. Đọc `signal.reason` là cách chắc chắn nhất để biết vì sao bị huỷ.
:::

## Timeout (AbortSignal.timeout / context.WithTimeout)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

const signal = AbortSignal.timeout(100); // tự abort sau 100ms

try {
  await sleep(1000, "done", { signal });
} catch (err) {
  console.log(err.name);           // → AbortError
  console.log(err.cause.name);     // → TimeoutError
  console.log(signal.reason.name); // → TimeoutError
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

func sleep(ctx context.Context, d time.Duration) error {
	timer := time.NewTimer(d)
	defer timer.Stop()

	select {
	case <-timer.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond) // tự huỷ sau 100ms
	defer cancel()

	err := sleep(ctx, 1*time.Second)
	fmt.Println(err)                                      // → context deadline exceeded
	fmt.Println(errors.Is(err, context.DeadlineExceeded)) // → true
	fmt.Println(errors.Is(err, context.Canceled))         // → false
}
```
:::

:::warning
Lý do của một `AbortSignal.timeout()` là `DOMException` tên **`TimeoutError`**, không phải `AbortError` — code chỉ kiểm tra `err.name === "AbortError"` sẽ bỏ sót timeout khi gọi `fetch(url, { signal: AbortSignal.timeout(5000) })`, vì `fetch` ném thẳng `TimeoutError`. Go phân biệt tương tự: `context.DeadlineExceeded` khác `context.Canceled`. Ngoài ra, timer bên trong `AbortSignal.timeout()` không giữ event loop sống: nếu không còn việc gì khác đang chờ, tiến trình thoát luôn mà không bao giờ abort.
:::

:::note
`AbortSignal.timeout()` có từ Node.js 17.3 (backport về 16.14). Go cũng có `context.WithTimeoutCause` (Go 1.21) nếu muốn `context.Cause` trả về một lỗi riêng thay vì `context.DeadlineExceeded`.
:::

## Gộp nhiều tín hiệu huỷ (AbortSignal.any / context con)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

async function download(userDelay) {
  const user = new AbortController();
  // abort khi người dùng huỷ HOẶC khi quá 200ms, cái nào tới trước
  const signal = AbortSignal.any([user.signal, AbortSignal.timeout(200)]);

  const timer = setTimeout(() => user.abort(new Error("user cancelled")), userDelay);
  try {
    return await sleep(1000, "done", { signal });
  } catch {
    return `aborted: ${signal.reason.name}: ${signal.reason.message}`;
  } finally {
    clearTimeout(timer);
  }
}

console.log(await download(50));  // → aborted: Error: user cancelled
console.log(await download(500)); // → aborted: TimeoutError: The operation was aborted due to timeout
```
```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"
)

func sleep(ctx context.Context, d time.Duration) error {
	timer := time.NewTimer(d)
	defer timer.Stop()

	select {
	case <-timer.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func download(userDelay time.Duration) string {
	user, cancelUser := context.WithCancelCause(context.Background())
	defer cancelUser(nil)

	// context con: bị huỷ khi cha (user) bị huỷ HOẶC khi quá 200ms
	ctx, cancel := context.WithTimeout(user, 200*time.Millisecond)
	defer cancel()

	timer := time.AfterFunc(userDelay, func() { cancelUser(errors.New("user cancelled")) })
	defer timer.Stop()

	if err := sleep(ctx, 1*time.Second); err != nil {
		return fmt.Sprint("aborted: ", context.Cause(ctx))
	}
	return "done"
}

func main() {
	fmt.Println(download(50 * time.Millisecond))  // → aborted: user cancelled
	fmt.Println(download(500 * time.Millisecond)) // → aborted: context deadline exceeded

	// hai context KHÔNG có quan hệ cha-con (vd. shutdown của server và một
	// request): nối chúng bằng context.AfterFunc
	shutdown, stopServer := context.WithCancelCause(context.Background())
	request, cancelRequest := context.WithCancelCause(context.Background())
	defer cancelRequest(nil)

	stop := context.AfterFunc(shutdown, func() {
		cancelRequest(context.Cause(shutdown))
	})
	defer stop()

	stopServer(errors.New("server shutting down"))
	<-request.Done()
	fmt.Println(context.Cause(request)) // → server shutting down
}
```
:::

:::note
`AbortSignal.any()` có từ Node.js 20.3 và cũng được backport về 18.17 trên nhánh 18.x; nhưng các bản 19.x không có, nên mốc tối thiểu của bài là 20.3. Ở Go, "gộp" thường không cần một hàm riêng: mọi `context.WithCancel`/`WithTimeout` đều nhận một context cha, và context con tự bị huỷ khi cha bị huỷ — cả cây lời gọi bị huỷ theo chỉ từ một lệnh `cancel()` ở gốc. Chỉ khi hai context không có quan hệ cha-con mới cần nối tay bằng `context.AfterFunc` (Go 1.21) như phần cuối ví dụ.
:::

## Tự kiểm tra việc huỷ trong vòng lặp (throwIfAborted / ctx.Err)

:::tabs
```js
import { setTimeout as sleep } from "node:timers/promises";

async function processItems(items, signal) {
  for (const item of items) {
    signal.throwIfAborted(); // ném signal.reason nếu đã bị abort
    await sleep(50);         // giả lập xử lý một item
    console.log("processed", item);
  }
}

try {
  await processItems([1, 2, 3, 4, 5], AbortSignal.timeout(125));
} catch (err) {
  console.log("stopped:", err.name);
}
// → processed 1
// → processed 2
// → processed 3
// → stopped: TimeoutError
```
```go
package main

import (
	"context"
	"fmt"
	"time"
)

func processItems(ctx context.Context, items []int) error {
	for _, item := range items {
		if err := ctx.Err(); err != nil { // khác nil nếu ctx đã bị huỷ, ~ throwIfAborted()
			return err
		}
		time.Sleep(50 * time.Millisecond) // giả lập xử lý một item
		fmt.Println("processed", item)
	}
	return nil
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 125*time.Millisecond)
	defer cancel()

	if err := processItems(ctx, []int{1, 2, 3, 4, 5}); err != nil {
		fmt.Println("stopped:", err)
	}
}

// → processed 1
// → processed 2
// → processed 3
// → stopped: context deadline exceeded
```
:::

:::note
Số item được xử lý phụ thuộc thời gian thực: timeout 125ms rơi giữa lần kiểm tra thứ 3 (~100ms) và thứ 4 (~150ms), nên thông thường in ra 3 dòng `processed`. `signal.throwIfAborted()` có từ Node.js 17.3 và ném thẳng `signal.reason` (ở đây là `TimeoutError`). Kiểm tra ở đầu mỗi vòng là đủ khi mỗi bước ngắn; nếu một bước có thể chờ lâu, hãy truyền luôn `signal`/`ctx` xuống bước đó (như `sleep` ở các phần trên) để nó dừng ngay giữa chừng.
:::

:::tip
Quy ước của Go: `ctx context.Context` luôn là tham số đầu tiên, và không lưu context vào struct. Trong Node.js không có quy ước cứng, nhưng các API chuẩn (`fetch`, `node:timers/promises`, `events.once`, `stream.pipeline`, `child_process.exec`…) đều nhận `{ signal }` trong object options — làm theo cùng kiểu đó giúp hàm của bạn ghép được với chúng.
:::

## Khác biệt chính

| | Node.js | Go |
|---|---|---|
| Tạo tín hiệu huỷ | `new AbortController()` | `context.WithCancel` / `WithCancelCause` |
| Huỷ | `controller.abort(reason)` | `cancel()` / `cancel(cause)` |
| Timeout | `AbortSignal.timeout(ms)` | `context.WithTimeout(parent, d)` |
| Lý do huỷ | `signal.reason` | `ctx.Err()` + `context.Cause(ctx)` |
| Kiểm tra trong vòng lặp | `signal.throwIfAborted()` | `ctx.Err() != nil` |
| Gộp nhiều tín hiệu | `AbortSignal.any([...])` | context con (cha huỷ → con huỷ), `context.AfterFunc` |
| Lan truyền | truyền `{ signal }` khi cần | truyền `ctx` làm tham số đầu tiên xuyên suốt cây lời gọi |
