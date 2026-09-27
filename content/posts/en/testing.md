---
title: "Writing Tests"
description: "Node.js's node:test + node:assert compared to Go's testing, Rust's #[test], Swift Testing, and Java's JUnit for table-driven tests."
tags: [testing, unit-test, table-driven]
---

Node.js and Go both have a built-in test runner, no external package required; Rust does too, with `#[test]`/`cargo test`. Node.js's nested `t.test()` is roughly equivalent to Go's `t.Run()` for **table-driven tests** — running the same test case against multiple sets of input. Rust's plain std `#[test]` has no named subtests like Go/Node — the example below just loops over cases inside one test function. Swift Testing (the newer framework replacing `XCTest`, bundled with the toolchain since Swift 6.0 rather than a separate package) supports this directly through `@Test(arguments:)`. Java has no standard test runner in the JDK, so the example uses the most common library, JUnit, with `@ParameterizedTest` + `@CsvSource`.

## Table-driven tests

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
            assert_eq!(got, want, "sum({a}, {b})"); // the message adds context when the assertion fails
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
# trimmed: tests/suites/pass/fail/duration summary lines; durations vary between runs
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
# trimmed the "Thanks for using JUnit!" banner, the JUnit Platform Suite/JUnit Vintage branches
# (empty, no test runs through them), and the containers/tests found/started/failed summary lines
├─ JUnit Jupiter ✔
│  └─ SumTest ✔
│     └─ sum(int, int, int) ✔
│        ├─ "1" + "1" ✔
│        ├─ "2" + "3" ✔
│        └─ "5" + "5" ✔
```

:::note
`node:test` was added in Node.js 18.0 (the `--test` flag in 18.1) and was experimental until Node.js 20.0.
:::

:::note
**Changed:** `tape` (a third-party TAP test framework, last published years ago) → the built-in `node:test` runner with `node:assert/strict`. No dependency to install; `t.test()` mirrors Go's `t.Run()` for table-driven subtests, and `node --test` replaces `node examples/example_test.js`.
:::

:::note
Rust's plain `#[test]` has no concept of a named subtest like `t.Run()`/`t.test()` — for table-driven tests with a separate name/result per case (and per-case parallelism), use the `rstest` crate (`#[case(1, 1, 2)]`) instead of looping inside one `#[test]`.
:::

:::note
Swift Testing (`import Testing`) replaces `XCTest` starting in Swift 6.0/Xcode 16, and runs through `swift test`; it needs its own test target declared in `Package.swift` (`.testTarget`) and can't run as a standalone script.
:::

:::note
The JDK has no standard test runner — the example above uses JUnit Jupiter (the latest release line is **JUnit 6**, which requires Java 17+; the prior "JUnit 5" branding only needed Java 8). It runs without Maven/Gradle by compiling against `junit-platform-console-standalone` and calling `java -jar ... execute`.
:::
