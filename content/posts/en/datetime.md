---
title: "Date and Time"
description: "Node.js's Date and Intl.DateTimeFormat compared to Go's immutable time.Time: parsing, adding days, and formatting."
tags: [date, time, timestamp, formatting]
---

Node.js represents a point in time with `Date` — an object you can mutate through `set*` methods. Go uses `time.Time`, an immutable struct: every add/subtract operation returns a new `time.Time` value instead of changing it in place. Formatting works differently too: Node.js uses `Intl.DateTimeFormat` with named fields, while Go uses a "reference date" (`2006-01-02`) as its layout.

## Parsing, adding days, and formatting

:::tabs
```js
const nowUnix = Date.now(); // milliseconds since the epoch

const datestr = "2019-01-17T09:24:23+00:00";
const date = new Date(datestr);
console.log(date.getTime()); // milliseconds
console.log(date.toString()); // in the machine's local timezone

const futureDate = new Date(date);
futureDate.setDate(date.getDate() + 14); // mutates in place

const formatted = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(date);
console.log(formatted); // 01/17/2019
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
:::

:::note
**Changed (Go 1.20):** the `time.DateOnly` layout constant (along with `time.DateTime` and `time.TimeOnly`) replaces hand-written reference-time strings such as `"2006-01-02"`.
:::

:::note
The Temporal API isn't available in Node.js 24, so this guide still uses `Date` and `Intl.DateTimeFormat`.
:::
