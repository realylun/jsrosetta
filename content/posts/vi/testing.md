---
title: "Viết test"
description: "node:test + node:assert của Node.js so với package testing của Go cho table-driven test (test theo bảng dữ liệu)."
date: "2026-09-27"
order: 1080
category: stdlib
languages: [js, go]
versions:
  js: "18.1"
  go: "1.7"
tags: [testing, unit-test, table-driven]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#testing"
---

Cả hai đều có test runner built-in, không cần cài package ngoài. `t.test()` lồng nhau của Node.js gần tương đương `t.Run()` của Go cho **table-driven test** — chạy cùng một test case với nhiều bộ input khác nhau.

## Table-driven test

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
`node:test` được thêm từ Node.js 18.0 (cờ `--test` từ 18.1) và vẫn là experimental cho tới Node.js 20.0.
:::

:::note
**Thay đổi:** `tape` (framework TAP bên thứ ba, đã lâu không cập nhật) → test runner built-in `node:test` cùng `node:assert/strict`. Không cần cài dependency nào; `t.test()` phản chiếu `t.Run()` của Go cho test theo bảng dữ liệu, và `node --test` thay cho `node examples/example_test.js`.
:::
