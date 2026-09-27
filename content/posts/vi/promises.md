---
title: "Promise"
description: "Promise .then()/.catch() và Promise.all() của Node.js so với channel cùng goroutine trong Go."
date: "2026-09-27"
order: 700
category: async
languages: [js, go]
versions:
  js: "12.20"
  go: "1.25"
tags: [promise, async, channel, goroutine]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#promises"
---

Node.js có `Promise` sẵn trong ngôn ngữ. Go không có kiểu tương đương — cách gần nhất là dùng channel để nhận giá trị "đã settle" từ một goroutine chạy nền. Bài này dùng cú pháp `.then()`/`.catch()` cổ điển; nếu muốn viết lại bằng `await`, xem [async/await](/posts/async-await).

## Tạo một promise và xử lý kết quả (then/catch)

:::tabs
```js
function asyncMethod(value) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`resolved: ${value}`);
    }, 1000);
  });
}

asyncMethod("foo")
  .then((result) => console.log(result)) // → resolved: foo
  .catch((err) => console.error(err));
```
```go
package main

import (
	"fmt"
	"os"
	"time"
)

// Result đứng thay cho giá trị "đã settle" của Promise: có Value khi thành
// công, có Err khi thất bại.
type Result struct {
	Value string
	Err   error
}

func asyncMethod(value string) <-chan Result {
	ch := make(chan Result, 1)
	go func() {
		time.Sleep(1 * time.Second)
		ch <- Result{Value: "resolved: " + value}
	}()
	return ch
}

func main() {
	foo := asyncMethod("foo") // channel bắt đầu chạy ngay, giống Promise được tạo là chạy ngay

	if r := <-foo; r.Err != nil { // <-foo: chờ giá trị, giống .then()/.catch()
		fmt.Fprintln(os.Stderr, r.Err)
	} else {
		fmt.Println(r.Value) // → resolved: foo
	}
}
```
:::

## Chạy nhiều promise song song (Promise.all)

Dùng lại `asyncMethod` và `Result` ở trên:

:::tabs
```js
const results = await Promise.all([
  asyncMethod("A"),
  asyncMethod("B"),
  asyncMethod("C"),
]);
console.log(results); // → ['resolved: A', 'resolved: B', 'resolved: C']
```
```go
import "sync"

// all chờ mọi channel settle, giống Promise.all: trả về giá trị theo đúng
// thứ tự, hoặc lỗi đầu tiên gặp phải.
func all(chs ...<-chan Result) ([]string, error) {
	values := make([]string, len(chs))
	errs := make([]error, len(chs))

	var wg sync.WaitGroup
	for i, ch := range chs {
		wg.Go(func() {
			r := <-ch
			values[i] = r.Value
			errs[i] = r.Err
		})
	}
	wg.Wait()

	for _, err := range errs {
		if err != nil {
			return nil, err
		}
	}
	return values, nil
}

func main() {
	abc := []<-chan Result{asyncMethod("A"), asyncMethod("B"), asyncMethod("C")} // cả 3 chạy song song ngay lập tức

	values, err := all(abc...)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return
	}
	fmt.Println(values) // → [resolved: A resolved: B resolved: C]
}
```
:::

:::note
Go 1.25 thêm `sync.WaitGroup.Go(func())`, thay cho cách viết thủ công `wg.Add(1)` + `go func(){ …; wg.Done() }()` trước đó — nhờ vậy một goroutine không thể được khởi động mà thiếu `Done()` đi kèm.
:::
