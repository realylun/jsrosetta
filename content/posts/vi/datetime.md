---
title: "Ngày giờ (Date/Time)"
description: "Date và Intl.DateTimeFormat của Node.js so với time.Time bất biến của Go, chrono (Rust), Date của Swift và java.time (Java): parse, cộng ngày và format."
date: "2026-09-27"
order: 1000
category: stdlib
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.20"
  rust: "1.62"
  swift: "5.5"
  java: "25"
tags: [date, time, timestamp, formatting]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#datetime"
---

Node.js biểu diễn thời điểm bằng `Date` — một object có thể mutate qua các hàm `set*`. Go dùng `time.Time`, một struct bất biến: mọi phép cộng/trừ đều trả về giá trị `time.Time` mới thay vì sửa tại chỗ. Rust không có kiểu ngày giờ nào biết lịch trong std, nên phải dùng crate ngoài (`chrono`). Swift dùng `Date` của Foundation (một mốc thời gian đơn thuần) cộng với `Calendar` để cộng/trừ theo lịch. Java dùng `java.time` — cũng bất biến như Go. Cách format cũng khác hẳn giữa các ngôn ngữ: Node.js và Java dùng tên field/pattern, Go dùng "ngày tham chiếu" `2006-01-02` làm layout, Rust dùng specifier kiểu strftime, còn Swift dùng `FormatStyle` — một builder có thể chain (`.dateTime.year().month()...`) — chứ không phải strftime.

## Parse, cộng ngày và format

:::tabs
```js
const nowUnix = Date.now() // mili-giây kể từ epoch
console.log(nowUnix)

const datestr = '2019-01-17T09:24:23+00:00'
const date = new Date(datestr)
console.log(date.getTime()) // mili-giây
console.log(date.toString()) // theo timezone của máy

const futureDate = new Date(date)
futureDate.setDate(date.getDate() + 14) // mutate tại chỗ
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
	nowUnix := time.Now().Unix() // giây kể từ epoch
	fmt.Println(nowUnix)

	datestr := "2019-01-17T09:24:23+00:00"
	date, err := time.Parse(time.RFC3339, datestr)
	if err != nil {
		panic(err)
	}

	fmt.Println(date.Unix())
	fmt.Println(date.String())

	futureDate := date.AddDate(0, 0, 14) // trả về time.Time mới, không mutate `date`
	fmt.Println(futureDate.String())

	// time.DateOnly là hằng layout "2006-01-02" có sẵn
	fmt.Println(futureDate.Format(time.DateOnly))

	formatted := date.Format("01/02/2006") // layout dựa trên ngày tham chiếu, không phải token
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
        .as_secs(); // giây kể từ epoch
    println!("{now_unix}");

    let datestr = "2019-01-17T09:24:23+00:00";
    let date = DateTime::parse_from_rfc3339(datestr).unwrap();
    println!("{}", date.timestamp());
    println!("{date}");

    let future_date = date + Duration::days(14); // trả về DateTime mới, không mutate `date`
    println!("{future_date}");

    let formatted = date.format("%m/%d/%Y"); // specifier kiểu strftime, không phải ngày tham chiếu
    println!("{formatted}");
}
```
```swift
import Foundation

let nowUnix = Int(Date.now.timeIntervalSince1970) // giây kể từ epoch
print(nowUnix)

let datestr = "2019-01-17T09:24:23+00:00"
let date = try Date(datestr, strategy: .iso8601)
print(Int(date.timeIntervalSince1970))
print(date)

// trả về Date mới, không mutate `date`
let futureDate = Calendar.current.date(byAdding: .day, value: 14, to: date)!
print(futureDate)

let formatted = date.formatted(.dateTime.year().month(.twoDigits).day(.twoDigits).locale(Locale(identifier: "en_US")))
print(formatted)
```
```java
void main() {
    long nowUnix = Instant.now().getEpochSecond(); // giây kể từ epoch; OffsetDateTime/Instant/DateTimeFormatter đều ở java.base, tự động có sẵn
    IO.println(nowUnix);

    String datestr = "2019-01-17T09:24:23+00:00";
    OffsetDateTime date = OffsetDateTime.parse(datestr);
    IO.println(date.toEpochSecond());
    IO.println(date);

    OffsetDateTime futureDate = date.plusDays(14); // trả về OffsetDateTime mới, không mutate `date`
    IO.println(futureDate);

    String formatted = date.format(DateTimeFormatter.ofPattern("MM/dd/yyyy"));
    IO.println(formatted);
}
```
:::

```bash
# dòng đầu là timestamp hiện tại (phi tất định); các chuỗi ngày phụ thuộc
# timezone của máy chạy (ở đây TZ=Asia/Saigon)
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
**Thay đổi (Go 1.20):** các hằng layout `time.DateOnly` (cùng `time.DateTime`, `time.TimeOnly`) thay cho việc tự viết chuỗi ngày tham chiếu như `"2006-01-02"`.
:::

:::note
Node.js 24 chưa có Temporal API nên hướng dẫn này vẫn dùng `Date` và `Intl.DateTimeFormat`.
:::

:::tip
Go, Rust và Java đều giữ nguyên UTC offset đã parse (`+00:00`/`Z`) khi in ra, vì kiểu ngày giờ của chúng lưu offset kèm theo (`time.Time` có `Location`, `DateTime<FixedOffset>`, `OffsetDateTime`). Swift's `Date` thì khác: nó chỉ là một mốc thời gian thuần túy, không lưu offset, nên luôn in ra UTC (`+0000`) bất kể chuỗi gốc có offset gì — ở ví dụ trên trùng khớp chỉ vì input vốn đã là UTC (`+00:00`). `Date.toString()` của JavaScript thì luôn quy đổi sang timezone của máy chạy — đây là lý do dòng output JS ở trên lệch giờ so với các ngôn ngữ còn lại dù cùng một mốc thời gian.
:::

:::note
API format mới của Swift (`ParseStrategy`, `FormatStyle`, `Date.now`) cần macOS 12 / iOS 15 trở lên.
:::
