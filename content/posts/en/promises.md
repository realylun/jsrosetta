---
title: "Promises"
description: "How Node.js's Promise .then()/.catch() and Promise.all() compare to channels and goroutines in Go."
tags: [promise, async, channel, goroutine]
---

Node.js has `Promise` built into the language. Go has no equivalent type — the closest thing is using a channel to receive a "settled" value from a goroutine running in the background. This post uses the classic `.then()`/`.catch()` syntax; if you want to rewrite it with `await`, see [async/await](/en/posts/async-await).

## Creating a promise and handling the result (then/catch)

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
	"sync"
	"time"
)

// Result stands in for a settled Promise value: a Value on success, an Err
// on rejection.
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
```
:::

## Running several promises in parallel (Promise.all)

Reusing `asyncMethod` and `Result` from above:

:::tabs
```js
Promise.all([
  asyncMethod("A"),
  asyncMethod("B"),
  asyncMethod("C"),
])
  .then((results) => console.log(results)) // → ['resolved: A', 'resolved: B', 'resolved: C']
  .catch((err) => console.error(err));
```
```go
// all waits for every channel to settle, like Promise.all: it returns the
// values in order, or the first error encountered.
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
	foo := asyncMethod("foo") // the channel starts running immediately, like a Promise starts as soon as it's created
	abc := []<-chan Result{asyncMethod("A"), asyncMethod("B"), asyncMethod("C")} // all 3 start running in parallel right away

	if r := <-foo; r.Err != nil { // <-foo: wait for the value, like .then()/.catch()
		fmt.Fprintln(os.Stderr, r.Err)
	} else {
		fmt.Println(r.Value) // → resolved: foo
	}

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
Go 1.25 added `sync.WaitGroup.Go(func())`, replacing the earlier manual `wg.Add(1)` + `go func(){ …; wg.Done() }()` pattern — so a goroutine can no longer be started without a matching `Done()`.
:::
