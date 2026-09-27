---
title: "Writing Tests"
description: "Node.js's node:test + node:assert compared to Go's testing package for table-driven tests."
tags: [testing, unit-test, table-driven]
---

Both languages have a built-in test runner, no external package required. Node.js's nested `t.test()` is roughly equivalent to Go's `t.Run()` for **table-driven tests** — running the same test case against multiple sets of input.

## Table-driven tests

:::tabs
```js
import { test } from "node:test";
import assert from "node:assert/strict";

test("sum", async (t) => {
  const tt = [
    { a: 1, b: 1, ret: 2 },
    { a: 2, b: 3, ret: 5 },
    { a: 5, b: 5, ret: 10 },
  ];

  for (const { a, b, ret } of tt) {
    await t.test(`${a} + ${b}`, () => {
      assert.equal(sum(a, b), ret);
    });
  }
});

function sum(a, b) {
  return a + b;
}
```
```go
package example

import (
	"fmt"
	"testing"
)

func TestSum(t *testing.T) {
	for _, tt := range []struct {
		a   int
		b   int
		ret int
	}{
		{1, 1, 2},
		{2, 3, 5},
		{5, 5, 10},
	} {
		t.Run(fmt.Sprintf("(%v + %v)", tt.a, tt.b), func(t *testing.T) {
			ret := sum(tt.a, tt.b)
			if ret != tt.ret {
				t.Errorf("want %v, got %v", tt.ret, ret)
			}
		})
	}
}

func sum(a, b int) int {
	return a + b
}
```
:::

```bash
$ node --test examples/example_test.js
▶ sum
  ✔ 1 + 1
  ✔ 2 + 3
  ✔ 5 + 5
✔ sum
```
```bash
$ go test -v examples/example_test.go
=== RUN   TestSum/(1_+_1)
=== RUN   TestSum/(2_+_3)
=== RUN   TestSum/(5_+_5)
--- PASS: TestSum
PASS
```

:::note
`node:test` was added in Node.js 18.0 (the `--test` flag in 18.1) and was experimental until Node.js 20.0.
:::

:::note
**Changed:** `tape` (a third-party TAP test framework, unmaintained for years) → the built-in `node:test` runner with `node:assert/strict`. No dependency to install; `t.test()` mirrors Go's `t.Run()` for table-driven subtests, and `node --test` replaces `node examples/example_test.js`.
:::
