---
title: "Timer: setTimeout và setInterval"
description: "setTimeout và setInterval của Node.js so với time.AfterFunc và time.Ticker trong Go."
date: "2026-09-27"
order: 720
category: async
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [timer, settimeout, setinterval, goroutine]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#timeout"
---

Node.js chạy callback của `setTimeout`/`setInterval` trên event loop, nên chương trình vẫn sống cho tới khi hàng đợi callback trống. Go thì ngược lại: `time.AfterFunc` và `time.Ticker` chạy callback trên một goroutine riêng, nên nếu không có gì giữ `main` lại (một `sync.WaitGroup`, một `for range`, …), chương trình có thể thoát trước khi callback kịp chạy.

## Chạy một lần sau một khoảng thời gian (setTimeout / time.AfterFunc)

:::tabs
```js
setTimeout(callback, 1000);

function callback() {
  console.log("called"); // → called (sau ~1s)
}
```
```go
package main

import (
	"fmt"
	"sync"
	"time"
)

var wg sync.WaitGroup

func callback() {
	defer wg.Done()
	fmt.Println("called") // → called (sau ~1s)
}

func main() {
	wg.Add(1)
	time.AfterFunc(1*time.Second, callback) // callback chạy trên goroutine riêng
	wg.Wait()                               // không có WaitGroup, main sẽ thoát trước khi callback kịp chạy
}
```
:::

## Chạy lặp lại theo chu kỳ (setInterval / time.Ticker)

:::tabs
```js
let i = 0;

const id = setInterval(callback, 1000);

function callback() {
  console.log("called", i);

  if (i === 3) {
    clearInterval(id);
  }

  i++;
}
// → called 0
// → called 1
// → called 2
// → called 3
```
```go
package main

import (
	"fmt"
	"time"
)

func callback(i int) {
	fmt.Println("called", i)
}

func main() {
	ticker := time.NewTicker(1 * time.Second)

	i := 0
	for range ticker.C {
		callback(i)

		if i == 3 {
			ticker.Stop() // dừng ticker, tương đương clearInterval
			break
		}

		i++
	}
}
// → called 0
// → called 1
// → called 2
// → called 3
```
:::
