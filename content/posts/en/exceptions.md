---
title: "Uncaught Exceptions"
description: "How Node.js's process.on('uncaughtException') compares to panic/recover in Go when an error escapes normal handling."
tags: [exception, panic, recover, error-handling]
---

The [error handling and try/catch](/posts/errors) post covered `throw`/`try`/`catch` for regular error-handling flow. This one is different: a case where an error *escapes every try/catch* and flies straight to the top level — the last-resort catch before the process crashes.

## Catching an exception at the top level (uncaughtException vs recover)

:::tabs
```js
process.on("uncaughtException", (err) => {
  console.log(`caught exception: ${err.message}`); // → caught exception: my exception
  process.exit(1); // log, clean up and exit: resuming after this is unsafe
});

function foo() {
  throw new Error("my exception");
}

function main() {
  foo();
}

main();
// exit code: 1
```
```go
package main

import (
	"fmt"
)

func foo() {
	panic("my exception")
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("caught exception: %s", r) // → caught exception: my exception
		}
	}()

	foo()
}
```
:::

:::warning
`'uncaughtException'` is a last resort, not `recover()`: the Node.js docs say the process is in an undefined state afterwards, so log, clean up and exit with a non-zero code instead of resuming.
:::
