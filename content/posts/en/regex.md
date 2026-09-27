---
title: "Regex"
description: "Node.js's RegExp literals compared to Go's regexp, Rust's regex, Swift's Regex literals, and Java's java.util.regex: replace, test, and find all matches."
tags: [regex, regexp, pattern-matching]
---

Node.js writes regexes as `/pattern/flags` literals right in the code. Go has no literal syntax for regexes — you compile a pattern into a `*regexp.Regexp` with `regexp.MustCompile`, and a flag like case-insensitivity lives inside the pattern string itself (`(?i)`) instead of outside like `/i`. Rust reaches for the external `regex` crate, with pattern syntax almost identical to Go (same RE2 family). Swift has a built-in `Regex` type since 5.7 with `/pattern/` literals right in the language — closest to JS. Java uses the long-standing `java.util.regex.Pattern`/`Matcher`, with flags passed as `Pattern.compile`'s second argument.

## Replace, test, and find all matches

:::tabs
```js
let input = 'foobar'
let replaced = input.replace(/foo(.*)/i, 'qux$1')
console.log(replaced) // quxbar

let match = /o{2}/i.test(input)
console.log(match) // true

input = '111-222-333'
let matches = input.match(/([0-9]+)/gi)
console.log(matches) // [ '111', '222', '333' ]
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
```rust
// Cargo.toml: regex = "1"
use regex::Regex;

fn main() {
    let input = "foobar";
    let re = Regex::new(r"(?i)foo(.*)").unwrap(); // (?i): case-insensitive, written inside the pattern, same as Go
    let replaced = re.replace(input, "qux$1");
    println!("{replaced}"); // quxbar

    let re = Regex::new(r"(?i)o{2}").unwrap();
    println!("{}", re.is_match(input)); // true

    let input = "111-222-333";
    let re = Regex::new(r"(?i)([0-9]+)").unwrap();
    let matches: Vec<&str> = re.find_iter(input).map(|m| m.as_str()).collect();
    println!("{matches:?}"); // ["111", "222", "333"]
}
```
```swift
import Foundation

var input = "foobar"
// the closure receives a Regex<Output>.Match; capture groups come through match.output instead of "$1"
let replaced = input.replacing(/foo(.*)/.ignoresCase()) { match in
    "qux\(match.output.1)"
}
print(replaced) // quxbar

let hasMatch = input.contains(/o{2}/.ignoresCase())
print(hasMatch) // true

input = "111-222-333"
let matches = input.matches(of: /([0-9]+)/).map { String($0.output.0) }
print(matches) // ["111", "222", "333"]
```
```java
import java.util.regex.Matcher;
import java.util.regex.Pattern;

void main() {
    String input = "foobar";
    Pattern p = Pattern.compile("foo(.*)", Pattern.CASE_INSENSITIVE);
    String replaced = p.matcher(input).replaceAll("qux$1");
    IO.println(replaced); // quxbar

    boolean matched = Pattern.compile("o{2}", Pattern.CASE_INSENSITIVE).matcher(input).find();
    IO.println(matched); // true

    input = "111-222-333";
    Matcher m = Pattern.compile("([0-9]+)").matcher(input);
    List<String> matches = new ArrayList<>();
    while (m.find()) {
        matches.add(m.group());
    }
    IO.println(matches); // [111, 222, 333]
}
```
:::

:::tip
Go uses raw string literals (wrapped in backticks) for patterns, so you don't need to escape `\` the way you would in a regular string (`"\\d+"` → `` `\d+` ``). Rust's `regex` crate uses nearly identical syntax (same RE2 lineage), so patterns copy over almost verbatim between the two.
:::

:::note
Swift's `/pattern/` regex literal needs the `-enable-bare-slash-regex` flag when compiling directly with `swiftc`/`swift` (already on when building through Swift Package Manager with `swift-tools-version` >= 5.7). `.replacing(_:with:)`, `.matches(of:)`, and `.contains(_:)` with a `RegexComponent` require macOS 13 / iOS 16 or later.
:::
