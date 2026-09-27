---
title: "Ngày giờ (Date/Time)"
description: "Date và Intl.DateTimeFormat của Node.js so với time.Time bất biến của Go: parse, cộng ngày và format."
date: "2026-09-27"
order: 1000
category: stdlib
languages: [js, go]
versions:
  js: "12.20"
  go: "1.20"
tags: [date, time, timestamp, formatting]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#datetime"
---

Node.js biểu diễn thời điểm bằng `Date` — một object có thể mutate qua các hàm `set*`. Go dùng `time.Time`, một struct bất biến: mọi phép cộng/trừ đều trả về giá trị `time.Time` mới thay vì sửa tại chỗ. Cách format cũng khác hẳn: Node.js dùng `Intl.DateTimeFormat` với tên field, còn Go dùng "ngày tham chiếu" `2006-01-02` làm layout.

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
```

:::note
**Thay đổi (Go 1.20):** các hằng layout `time.DateOnly` (cùng `time.DateTime`, `time.TimeOnly`) thay cho việc tự viết chuỗi ngày tham chiếu như `"2006-01-02"`.
:::

:::note
Node.js 24 chưa có Temporal API nên hướng dẫn này vẫn dùng `Date` và `Intl.DateTimeFormat`.
:::
