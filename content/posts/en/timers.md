---
title: "Timers: setTimeout and setInterval"
description: "How Node.js's setTimeout and setInterval compare to time.AfterFunc and time.Ticker in Go."
tags: [timer, settimeout, setinterval, goroutine]
---

Node.js runs `setTimeout`/`setInterval` callbacks on the event loop, so the program stays alive until the callback queue is empty. Go works the other way: `time.AfterFunc` and `time.Ticker` run their callback on a separate goroutine, so unless something keeps `main` around (a `sync.WaitGroup`, a `for range`, …), the program can exit before the callback gets a chance to run.

## Running something once after a delay (setTimeout / time.AfterFunc)

:::tabs
```js
setTimeout(callback, 1000);

function callback() {
  console.log("called"); // → called (after ~1s)
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
	fmt.Println("called") // → called (after ~1s)
}

func main() {
	wg.Add(1)
	time.AfterFunc(1*time.Second, callback) // callback runs on its own goroutine
	wg.Wait()                               // without the WaitGroup, main would exit before the callback runs
}
```
:::

## Running on a repeating schedule (setInterval / time.Ticker)

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
			ticker.Stop() // stop the ticker, equivalent to clearInterval
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
