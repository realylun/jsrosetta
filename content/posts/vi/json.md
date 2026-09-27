---
title: "JSON"
description: "JSON.parse/stringify của Node.js so với encoding/json (Marshal/Unmarshal) của Go, dùng struct tag để map field."
date: "2026-09-27"
order: 1020
category: stdlib
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [json, marshal, unmarshal, serialization]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#json"
---

`JSON.parse`/`JSON.stringify` của Node.js làm việc trực tiếp với object thường, không cần khai báo shape trước. Go cần một `struct` với tag `json:"..."` để `encoding/json` biết map field nào vào key nào — đổi lại bạn có kiểu tường minh và được kiểm tra lúc biên dịch.

## Parse (unmarshal) và stringify (marshal)

:::tabs
```js
let jsonstr = '{"foo":"bar"}';

let parsed = JSON.parse(jsonstr);
console.log(parsed); // { foo: 'bar' }

jsonstr = JSON.stringify(parsed);
console.log(jsonstr); // {"foo":"bar"}
```
```go
package main

import (
	"encoding/json"
	"fmt"
)

type T struct {
	Foo string `json:"foo"`
	Bar string `json:"bar,omitempty"` // bỏ qua khi rỗng lúc marshal
}

func main() {
	jsonstr := `{"foo":"bar"}`

	t := new(T)
	if err := json.Unmarshal([]byte(jsonstr), t); err != nil {
		panic(err)
	}
	fmt.Println(t) // &{bar }

	marshalled, err := json.Marshal(t)
	if err != nil {
		panic(err)
	}
	jsonstr = string(marshalled)
	fmt.Println(jsonstr) // {"foo":"bar"}
}
```
:::

:::note
Go 1.24 thêm `omitzero`, lựa chọn chặt hơn `omitempty`: bỏ qua field khi nó bằng **zero value** của kiểu đó (dùng method `IsZero() bool` nếu kiểu có). Khác với `omitempty`, `omitzero` bỏ được cả field `time.Time` bằng zero — điều `omitempty` không làm được.
:::
