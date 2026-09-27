---
title: "Regex"
description: "Node.js's RegExp literals compared to Go's regexp package, where a pattern is compiled first: replace, test, and find all matches."
tags: [regex, regexp, pattern-matching]
---

Node.js writes regexes as `/pattern/flags` literals right in the code. Go has no literal syntax for regexes — you compile a pattern into a `*regexp.Regexp` with `regexp.MustCompile`, and a flag like case-insensitivity lives inside the pattern string itself (`(?i)`) instead of outside like `/i`.

## Replace, test, and find all matches

:::tabs
```js
let input = "foobar";
let replaced = input.replace(/foo(.*)/i, "qux$1");
console.log(replaced); // quxbar

let match = /o{2}/i.test(input);
console.log(match); // true

input = "111-222-333";
let matches = input.match(/([0-9]+)/gi);
console.log(matches); // [ '111', '222', '333' ]
```
```go
package main

import (
	"fmt"
	"regexp"
)

func main() {
	input := "foobar"
	re := regexp.MustCompile(`(?i)foo(.*)`) // (?i): case-insensitive, written inside the pattern
	replaced := re.ReplaceAllString(input, "qux$1")
	fmt.Println(replaced) // quxbar

	re = regexp.MustCompile(`(?i)o{2}`)
	match := re.Match([]byte(input))
	fmt.Println(match) // true

	input = "111-222-333"
	re = regexp.MustCompile(`(?i)([0-9]+)`)
	matches := re.FindAllString(input, -1)
	fmt.Println(matches) // [111 222 333]
}
```
:::

:::tip
Go uses raw string literals (wrapped in backticks) for patterns, so you don't need to escape `\` the way you would in a regular string (`"\\d+"` → `` `\d+` ``).
:::
