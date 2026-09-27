---
title: "Viết test"
description: "node:test + node:assert của Node.js so với testing (Go), #[test] (Rust), Swift Testing và JUnit (Java) cho table-driven test."
date: "2026-09-27"
order: 1080
category: stdlib
languages: [js, go, rust, swift, java]
versions:
  js: "18.1"
  go: "1.7"
  rust: "1.58"
  swift: "6.0"
  java: "17"
tags: [testing, unit-test, table-driven]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#testing"
---

Node.js và Go đều có test runner built-in, không cần cài package ngoài; Rust cũng vậy với `#[test]`/`cargo test`. `t.test()` lồng nhau của Node.js gần tương đương `t.Run()` của Go cho **table-driven test** — chạy cùng một test case với nhiều bộ input khác nhau. Rust không có subtest có tên như Go/Node trong `#[test]` thuần std — ví dụ dưới lặp qua từng case trong một test function. Swift Testing (framework mới thay `XCTest`, cần package riêng) hỗ trợ việc này trực tiếp qua `@Test(arguments:)`. Java không có test runner chuẩn trong JDK, nên dùng thư viện phổ biến nhất, JUnit, với `@ParameterizedTest` + `@CsvSource`.

## Table-driven test

:::tabs
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('sum', async t => {
  const tt = [
    { a: 1, b: 1, ret: 2 },
    { a: 2, b: 3, ret: 5 },
    { a: 5, b: 5, ret: 10 },
  ]

  for (const { a, b, ret } of tt) {
    await t.test(`${a} + ${b}`, () => {
      assert.equal(sum(a, b), ret)
    })
  }
})

function sum(a, b) {
  return a + b
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
```rust
pub fn sum(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::sum;

    #[test]
    fn test_sum() {
        let cases = [(1, 1, 2), (2, 3, 5), (5, 5, 10)];

        for (a, b, want) in cases {
            let got = sum(a, b);
            assert_eq!(got, want, "sum({a}, {b})"); // thông điệp thêm ngữ cảnh khi assert thất bại
        }
    }
}
```
```swift
// Sources/example/Sum.swift
public func sum(_ a: Int, _ b: Int) -> Int {
    a + b
}

// Tests/exampleTests/SumTests.swift
import Testing
@testable import example

@Test("sum", arguments: [(1, 1, 2), (2, 3, 5), (5, 5, 10)])
func testSum(_ testCase: (a: Int, b: Int, want: Int)) {
    #expect(sum(testCase.a, testCase.b) == testCase.want)
}
```
```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

// Maven: org.junit.jupiter:junit-jupiter:6.1.3
class SumTest {
    @ParameterizedTest(name = "{0} + {1}")
    @CsvSource({"1,1,2", "2,3,5", "5,5,10"})
    void sum(int a, int b, int want) {
        assertEquals(want, Sum.sum(a, b));
    }
}

class Sum {
    static int sum(int a, int b) {
        return a + b;
    }
}
```
:::

```bash
$ node --test examples/example_test.js
▶ sum
  ✔ 1 + 1 (0.29ms)
  ✔ 2 + 3 (0.05ms)
  ✔ 5 + 5 (0.05ms)
✔ sum (0.87ms)
# đã bỏ dòng tổng hợp tests/suites/pass/fail/duration; thời gian thay đổi giữa các lần chạy
```
```bash
$ go test -v examples/example_test.go
=== RUN   TestSum
=== RUN   TestSum/(1_+_1)
=== RUN   TestSum/(2_+_3)
=== RUN   TestSum/(5_+_5)
--- PASS: TestSum (0.00s)
    --- PASS: TestSum/(1_+_1) (0.00s)
    --- PASS: TestSum/(2_+_3) (0.00s)
    --- PASS: TestSum/(5_+_5) (0.00s)
PASS
ok  	command-line-arguments	0.459s
```
```bash
$ cargo test -q
running 1 test
.
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```
```bash
$ swift test
◇ Test "sum" started.
◇ Test case passing 1 argument testCase → (1, 1, 2) to "sum" started.
◇ Test case passing 1 argument testCase → (5, 5, 10) to "sum" started.
◇ Test case passing 1 argument testCase → (2, 3, 5) to "sum" started.
✔ Test "sum" with 3 test cases passed after 0.001 seconds.
✔ Test run with 1 test in 0 suites passed after 0.001 seconds.
```
```bash
$ java -jar junit-platform-console-standalone-6.1.3.jar execute -cp out --scan-class-path --details=tree
├─ JUnit Jupiter ✔
│  └─ SumTest ✔
│     └─ sum(int, int, int) ✔
│        ├─ "1" + "1" ✔
│        ├─ "2" + "3" ✔
│        └─ "5" + "5" ✔
# đã bỏ dòng tổng hợp containers/tests found/started/failed
```

:::note
`node:test` được thêm từ Node.js 18.0 (cờ `--test` từ 18.1) và vẫn là experimental cho tới Node.js 20.0.
:::

:::note
**Thay đổi:** `tape` (framework TAP bên thứ ba, lần publish gần nhất đã nhiều năm trước) → test runner built-in `node:test` cùng `node:assert/strict`. Không cần cài dependency nào; `t.test()` phản chiếu `t.Run()` của Go cho test theo bảng dữ liệu, và `node --test` thay cho `node examples/example_test.js`.
:::

:::note
`#[test]` thuần của Rust không có khái niệm subtest có tên như `t.Run()`/`t.test()` — muốn có test theo bảng dữ liệu với tên/kết quả riêng cho từng case (và chạy song song từng case), dùng crate `rstest` (`#[case(1, 1, 2)]`) thay vì tự lặp trong một `#[test]`.
:::

:::note
Swift Testing (`import Testing`) thay thế `XCTest` từ Swift 6.0/Xcode 16, chạy qua `swift test`; cần khai báo target test riêng trong `Package.swift` (`.testTarget`), không chạy được như một script đơn lẻ.
:::

:::note
JDK không có test runner chuẩn — ví dụ trên dùng JUnit Jupiter (bản mới nhất thuộc dòng **JUnit 6**, yêu cầu Java ≥ 17; trước đó gọi là "JUnit 5" và chỉ cần Java 8). Chạy không cần Maven/Gradle bằng cách biên dịch cùng `junit-platform-console-standalone` rồi gọi `java -jar ... execute`.
:::
