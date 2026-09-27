---
title: "Stack Traces"
description: "How Node.js's console.trace() compares to debug.Stack() after recover() in Go for printing a stack trace."
tags: [stack-trace, debugging, panic, error-handling]
---

Once an error is caught, you sometimes need to print the whole call path that led to it, not just the message. Node.js has `console.trace()` right on the global object; Go needs `runtime/debug.Stack()` called inside `recover()` to get that same trace as text.

## Printing a stack trace when catching an error (console.trace vs debug.Stack)

:::tabs
```js
function foo() {
  throw new Error("failed");
}

try {
  foo();
} catch (err) {
  console.trace(err);
}
// → Trace: Error: failed
// →     at foo (file:///…/stack-trace.js:2:9)
// →     at file:///…/stack-trace.js:6:3
// →     … (file paths and line numbers vary by machine and Node.js version)
```
```go
package main

import (
	"errors"
	"fmt"
	"runtime/debug"
)

func foo() {
	panic(errors.New("failed"))
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println(string(debug.Stack()))
		}
	}()

	foo()
}
// → goroutine 1 [running]:
// → main.foo(...)
// →     /…/stack-trace.go:10
// → main.main()
// →     /…/stack-trace.go:15 +0x6c
// → … (addresses and offsets vary by machine and Go version)
```
:::
