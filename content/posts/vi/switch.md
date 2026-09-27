---
title: "Switch"
description: "switch/case có break/fallthrough ngầm định trong JavaScript so với switch của Go (mặc định không fall through, cần fallthrough tường minh)."
date: "2026-09-27"
order: 330
category: control-flow
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [switch, fallthrough, control-flow]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#switch"
---

`switch` của Go trông giống JavaScript nhưng hành vi mặc định ngược lại hoàn toàn: JavaScript fall through sang case tiếp theo trừ khi có `break`, còn Go tự dừng sau case khớp trừ khi bạn viết `fallthrough` tường minh.

## switch không fall through vs fall through

:::tabs
```js
const value = 'b'

switch(value) {
  case 'a':
    console.log('A')
    break
  case 'b':
    console.log('B')
    break
  case 'c':
    console.log('C')
    break
  default:
    console.log('first default')
}

switch(value) {
  case 'a':
    console.log('A - falling through')
  case 'b':
    console.log('B - falling through')
  case 'c':
    console.log('C - falling through')
  default:
    console.log('second default')
}
```
```go
package main

import "fmt"

func main() {
	value := "b"

	switch value {
	case "a":
		fmt.Println("A")
	case "b":
		fmt.Println("B")
	case "c":
		fmt.Println("C")
	default:
		fmt.Println("first default")
	}

	switch value {
	case "a":
		fmt.Println("A - falling through")
		fallthrough
	case "b":
		fmt.Println("B - falling through")
		fallthrough
	case "c":
		fmt.Println("C - falling through")
		fallthrough
	default:
		fmt.Println("second default")
	}
}
```
:::

```bash
B
B - falling through
C - falling through
second default
```

## Khác biệt chính

| | Node.js | Go |
|---|---|---|
| Mặc định sau một case khớp | fall through sang case kế tiếp | dừng lại (implicit break) |
| Muốn dừng lại | phải viết `break` | không cần làm gì, đã là mặc định |
| Muốn fall through | mặc định đã vậy | phải viết `fallthrough` tường minh |
