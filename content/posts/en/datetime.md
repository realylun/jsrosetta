---
title: "Date and Time"
description: "Node.js's Date and Intl.DateTimeFormat compared to Go's immutable time.Time, Rust's chrono, Swift's Date, and Java's java.time: parsing, adding days, and formatting."
tags: [date, time, timestamp, formatting]
---

Node.js represents a point in time with `Date` — an object you can mutate through `set*` methods. Go uses `time.Time`, an immutable struct: every add/subtract operation returns a new `time.Time` value instead of changing it in place. Rust's std has no calendar-aware date type at all, so it needs an external crate (`chrono`). Swift uses Foundation's `Date` (a plain instant) together with `Calendar` for calendar-based arithmetic. Java uses `java.time`, immutable just like Go's. Formatting differs across the board too: Node.js and Java use named fields/patterns, Go uses a "reference date" (`2006-01-02`) as its layout, Rust uses strftime-style specifiers, and Swift uses `FormatStyle` — a chainable builder (`.dateTime.year().month()...`) — not strftime.

## Parsing, adding days, and formatting

:::tabs
```js
const nowUnix = Date.now() // milliseconds since the epoch
console.log(nowUnix)

const datestr = '2019-01-17T09:24:23+00:00'
const date = new Date(datestr)
console.log(date.getTime()) // milliseconds
console.log(date.toString()) // in the machine's local timezone

const futureDate = new Date(date)
futureDate.setDate(date.getDate() + 14) // mutates in place
console.log(futureDate.toString())

const formatted = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date)
console.log(formatted) // 01/17/2019
```
```go
package main

import (
	"fmt"
	"time"
)

func main() {
	nowUnix := time.Now().Unix() // seconds since the epoch
	fmt.Println(nowUnix)

	datestr := "2019-01-17T09:24:23+00:00"
	date, err := time.Parse(time.RFC3339, datestr)
	if err != nil {
		panic(err)
	}

	fmt.Println(date.Unix())
	fmt.Println(date.String())

	futureDate := date.AddDate(0, 0, 14) // returns a new time.Time, doesn't mutate `date`
	fmt.Println(futureDate.String())

	// time.DateOnly is the predefined "2006-01-02" layout
	fmt.Println(futureDate.Format(time.DateOnly))

	formatted := date.Format("01/02/2006") // layout based on the reference date, not tokens
	fmt.Println(formatted)
}
```
```rust
// Cargo.toml: chrono = "0.4"
use std::time::{SystemTime, UNIX_EPOCH};

use chrono::{DateTime, Duration};

fn main() {
    let now_unix = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs(); // seconds since the epoch
    println!("{now_unix}");

    let datestr = "2019-01-17T09:24:23+00:00";
    let date = DateTime::parse_from_rfc3339(datestr).unwrap();
    println!("{}", date.timestamp());
    println!("{date}");

    let future_date = date + Duration::days(14); // returns a new DateTime, doesn't mutate `date`
    println!("{future_date}");

    let formatted = date.format("%m/%d/%Y"); // strftime-style specifiers, not a reference date
    println!("{formatted}");
}
```
```swift
import Foundation

let nowUnix = Int(Date.now.timeIntervalSince1970) // seconds since the epoch
print(nowUnix)

let datestr = "2019-01-17T09:24:23+00:00"
let date = try Date(datestr, strategy: .iso8601)
print(Int(date.timeIntervalSince1970))
print(date)

// returns a new Date, doesn't mutate `date`
let futureDate = Calendar.current.date(byAdding: .day, value: 14, to: date)!
print(futureDate)

let formatted = date.formatted(.dateTime.year().month(.twoDigits).day(.twoDigits).locale(Locale(identifier: "en_US")))
print(formatted)
```
```java
void main() {
    long nowUnix = Instant.now().getEpochSecond(); // seconds since the epoch; OffsetDateTime/Instant/DateTimeFormatter are all in java.base, auto-imported
    IO.println(nowUnix);

    String datestr = "2019-01-17T09:24:23+00:00";
    OffsetDateTime date = OffsetDateTime.parse(datestr);
    IO.println(date.toEpochSecond());
    IO.println(date);

    OffsetDateTime futureDate = date.plusDays(14); // returns a new OffsetDateTime, doesn't mutate `date`
    IO.println(futureDate);

    String formatted = date.format(DateTimeFormatter.ofPattern("MM/dd/yyyy"));
    IO.println(formatted);
}
```
:::

```bash
# first line is the current timestamp (non-deterministic); the date strings
# depend on the machine's local timezone (this was run with TZ=Asia/Saigon)
$ node datetime.js
1790530769893
1547717063000
Thu Jan 17 2019 16:24:23 GMT+0700 (Indochina Time)
Thu Jan 31 2019 16:24:23 GMT+0700 (Indochina Time)
01/17/2019

$ go run datetime.go
1790530770
1547717063
2019-01-17 09:24:23 +0000 +0000
2019-01-31 09:24:23 +0000 +0000
2019-01-31
01/17/2019

$ cargo run -q
1790532152
1547717063
2019-01-17 09:24:23 +00:00
2019-01-31 09:24:23 +00:00
01/17/2019

$ swift main.swift
1790532172
1547717063
2019-01-17 09:24:23 +0000
2019-01-31 09:24:23 +0000
01/17/2019

$ java Main.java
1790532161
1547717063
2019-01-17T09:24:23Z
2019-01-31T09:24:23Z
01/17/2019
```

:::note
**Changed (Go 1.20):** the `time.DateOnly` layout constant (along with `time.DateTime` and `time.TimeOnly`) replaces hand-written reference-time strings such as `"2006-01-02"`.
:::

:::note
The Temporal API isn't available in Node.js 24, so this guide still uses `Date` and `Intl.DateTimeFormat`.
:::

:::tip
Go, Rust, and Java all keep the UTC offset they parsed (`+00:00`/`Z`) when printing, because their date types store the offset alongside the instant (`time.Time`'s `Location`, `DateTime<FixedOffset>`, `OffsetDateTime`). Swift's `Date` is different: it's a plain instant with no stored offset, so it always prints in UTC (`+0000`) no matter what offset the original string had — the example above only matches because the input was already UTC (`+00:00`). JavaScript's `Date.toString()` always converts to the local machine's timezone instead — that's why the JS output above shows a different clock time even though it's the same instant.
:::

:::note
Swift's newer formatting API (`ParseStrategy`, `FormatStyle`, `Date.now`) requires macOS 12 / iOS 15 or later.
:::
