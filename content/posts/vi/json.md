---
title: "JSON"
description: "JSON.parse/stringify của Node.js so với encoding/json (Go), serde_json (Rust), Codable (Swift) và Jackson (Java) để map field."
date: "2026-09-27"
order: 1020
category: stdlib
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.71"
  swift: "5.0"
  java: "25"
tags: [json, marshal, unmarshal, serialization]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#json"
---

`JSON.parse`/`JSON.stringify` của Node.js làm việc trực tiếp với object thường, không cần khai báo shape trước. Go cần một `struct` với tag `json:"..."` để `encoding/json` biết map field nào vào key nào — nhưng việc map này được giải quyết lúc runtime qua reflection: key JSON nào không khớp field sẽ bị bỏ qua âm thầm, và chỉ kiểu dữ liệu của field trong struct được kiểm tra lúc biên dịch, chứ không phải việc map tag ↔ key. Rust không có JSON built-in trong std, nên dùng cặp crate `serde`/`serde_json` với derive macro `#[derive(Serialize, Deserialize)]` — việc map field/key được kiểm tra ngay lúc biên dịch qua macro, chặt hơn Go. Swift dùng protocol `Codable` có sẵn trong ngôn ngữ, cũng được trình biên dịch tự sinh code map field. Java không có JSON trong thư viện chuẩn — JEP 540 (Simple JSON API) mới đang đề xuất thêm nó dưới dạng incubator (`jdk.incubator.json`) từ JDK 28, còn ở JDK 25 hiện tại thì chưa có gì cả — nên ví dụ dưới dùng thư viện phổ biến nhất, Jackson.

## Parse (unmarshal) và stringify (marshal)

:::tabs
```js
let jsonstr = '{"foo":"bar"}'

let parsed = JSON.parse(jsonstr)
console.log(parsed) // { foo: 'bar' }

jsonstr = JSON.stringify(parsed)
console.log(jsonstr) // {"foo":"bar"}
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
```rust
// Cargo.toml: serde = { version = "1", features = ["derive"] }
// Cargo.toml: serde_json = "1"
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct T {
    foo: String,
    #[serde(default, skip_serializing_if = "String::is_empty")] // bỏ qua khi rỗng lúc serialize
    bar: String,
}

fn main() {
    let jsonstr = r#"{"foo":"bar"}"#;

    let t: T = serde_json::from_str(jsonstr).unwrap();
    println!("{t:?}"); // T { foo: "bar", bar: "" }

    let jsonstr = serde_json::to_string(&t).unwrap();
    println!("{jsonstr}"); // {"foo":"bar"}
}
```
```swift
import Foundation

struct T: Codable {
    var foo: String
    var bar: String? // Codable tự sinh dùng encodeIfPresent cho Optional, tự bỏ key khi nil — không cần tự viết encode(to:)
}

let jsonstr = #"{"foo":"bar"}"#
let t = try JSONDecoder().decode(T.self, from: Data(jsonstr.utf8))
print(t) // T(foo: "bar", bar: nil)

let encoded = try JSONEncoder().encode(t)
print(String(decoding: encoded, as: UTF8.self)) // {"foo":"bar"}
```
```java
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;

// Maven: com.fasterxml.jackson.core:jackson-databind:2.22.3
record T(String foo, @JsonInclude(JsonInclude.Include.NON_EMPTY) String bar) {}

void main() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    String jsonstr = "{\"foo\":\"bar\"}";

    T t = mapper.readValue(jsonstr, T.class);
    IO.println(t); // T[foo=bar, bar=null]

    jsonstr = mapper.writeValueAsString(t);
    IO.println(jsonstr); // {"foo":"bar"}
}
```
:::

:::note
Go 1.24 thêm `omitzero`, lựa chọn chặt hơn `omitempty`: bỏ qua field khi nó bằng **zero value** của kiểu đó (dùng method `IsZero() bool` nếu kiểu có). Khác với `omitempty`, `omitzero` bỏ được cả field `time.Time` bằng zero — điều `omitempty` không làm được.
:::

:::note
Java 25 chưa có JSON API chuẩn — JEP 540 (Simple JSON API) mới đang ở giai đoạn đề xuất, dự kiến thêm module incubator `jdk.incubator.json` từ JDK 28; JDK 25 hiện tại chưa có gì dưới bất kỳ hình thức nào (kể cả incubator). Ví dụ trên dùng Jackson (`ObjectMapper`), thư viện JSON phổ biến nhất trong hệ sinh thái Java; nó đọc/ghi trực tiếp `record` mà không cần thư viện phụ nhờ tên tham số record có sẵn qua reflection. Jackson 3.0 (GA từ 10/2025) đã đổi Maven group id/package sang `tools.jackson.*` để chạy song song được với 2.x; ví dụ ở đây vẫn dùng 2.x (`com.fasterxml.jackson.*`) cho đơn giản, vì đây vẫn là bản được dùng rộng rãi nhất tại thời điểm viết.
:::

:::note
`struct` Codable ở trên không cần khai báo `CodingKeys` hay tự viết `encode(to:)`: code sinh tự động (synthesized) của Codable đã gọi `encodeIfPresent` cho mọi property kiểu Optional, nên field `bar` bị nil sẽ tự bị bỏ hẳn khỏi JSON output — đúng hành vi `omitempty` mà không cần code thủ công.
:::
