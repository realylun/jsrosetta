---
title: "JSON"
description: "Node.js's JSON.parse/stringify compared to Go's encoding/json, Rust's serde_json, Swift's Codable, and Java's Jackson for mapping fields."
tags: [json, marshal, unmarshal, serialization]
---

Node.js's `JSON.parse`/`JSON.stringify` work directly with plain objects, with no shape declared up front. Go needs a `struct` with `json:"..."` tags so `encoding/json` knows which field maps to which key — but that mapping is resolved at runtime via reflection: unknown JSON keys are silently ignored, and only the struct's field types are checked at compile time, not the tag-to-key mapping itself. Rust has no JSON support in std, so it uses the `serde`/`serde_json` crate pair with the `#[derive(Serialize, Deserialize)]` macro — the field-to-key mapping is checked at compile time through the macro, stricter than Go. Swift uses the built-in `Codable` protocol, with the compiler synthesizing the same kind of field-mapping code. Java has no JSON in its standard library at all (JEP 540 is still an incubator feature, expected around JDK 28), so the example below uses the most common library, Jackson.

## Parsing (unmarshal) and stringifying (marshal)

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
	Bar string `json:"bar,omitempty"` // skipped when empty during marshal
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
    #[serde(default, skip_serializing_if = "String::is_empty")] // skipped when empty during serialize
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
    var bar: String?

    enum CodingKeys: String, CodingKey { case foo, bar }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(foo, forKey: .foo)
        try container.encodeIfPresent(bar, forKey: .bar) // drops the key entirely when nil, mirrors omitempty
    }
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
Go 1.24 adds `omitzero`, a stricter alternative to `omitempty`: it omits a field when it equals its type's **zero value** (using an `IsZero() bool` method if the type has one). Unlike `omitempty`, `omitzero` correctly omits a zero-valued `time.Time` field, which `omitempty` can't do.
:::

:::note
Java 25 has no standard JSON API yet — JEP 540 (Simple JSON API) is still an incubator feature (`jdk.incubator.json`), expected to stabilize around JDK 28. The example above uses Jackson's `ObjectMapper`, the most widely used JSON library in the Java ecosystem; it can read/write a `record` directly with no extra module, since record component names are available through reflection.
:::
