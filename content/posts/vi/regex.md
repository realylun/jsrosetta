---
title: "Regex"
description: "RegExp literal của Node.js so với regexp (Go), regex (Rust), Regex literal (Swift) và java.util.regex (Java): replace, test và tìm tất cả match."
date: "2026-09-27"
order: 1010
category: stdlib
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.65"
  swift: "5.7"
  java: "25"
tags: [regex, regexp, pattern-matching]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#regex"
---

Node.js viết regex bằng literal `/pattern/flags` ngay trong code. Go không có cú pháp literal cho regex — bạn compile pattern thành `*regexp.Regexp` bằng `regexp.MustCompile`, và flag như case-insensitive nằm ngay trong chuỗi pattern (`(?i)`) thay vì đứng ngoài như `/i`. Rust dùng crate `regex` ngoài std, với cú pháp pattern gần như giống hệt Go (cùng họ RE2). Swift có kiểu `Regex` built-in từ 5.7 với literal `/pattern/` ngay trong ngôn ngữ — gần với JS nhất. Java dùng `java.util.regex.Pattern`/`Matcher` có từ rất lâu, flag truyền qua tham số thứ hai của `Pattern.compile`.

## Replace, test và tìm tất cả match

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
	re := regexp.MustCompile(`(?i)foo(.*)`) // (?i): case-insensitive, viết trong pattern
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
    let re = Regex::new(r"(?i)foo(.*)").unwrap(); // (?i): case-insensitive, viết trong pattern, giống Go
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
// closure nhận Regex<Output>.Match, đọc capture group qua match.output thay vì "$1"
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
Go dùng raw string literal (đặt trong dấu backtick) cho pattern, nên khỏi cần escape dấu `\` như trong chuỗi thường (`"\\d+"` → `` `\d+` ``). Rust dùng crate `regex` với cú pháp gần như giống hệt (cùng dựa trên RE2), nên pattern có thể copy gần như nguyên văn giữa hai ngôn ngữ.
:::

:::note
Regex literal `/pattern/` của Swift được bật sẵn mặc định ở ngôn ngữ mode Swift 6 (`-swift-version 6`, hoặc `swift-tools-version: 6.0` trở lên trong Package.swift). Ở ngôn ngữ mode Swift 5 — mặc định khi gọi thẳng `swiftc`/`swift` không kèm cờ — phải bật thủ công bằng `-enable-bare-slash-regex`, hoặc `.enableUpcomingFeature("BareSlashRegexLiterals")` trong target của Package.swift. `.replacing(_:with:)`, `.matches(of:)` và `.contains(_:)` với `RegexComponent` cần macOS 13 / iOS 16 trở lên.
:::
