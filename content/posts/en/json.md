---
title: "JSON"
description: "Node.js's JSON.parse/stringify compared to Go's encoding/json (Marshal/Unmarshal), using struct tags to map fields."
tags: [json, marshal, unmarshal, serialization]
---

Node.js's `JSON.parse`/`JSON.stringify` work directly with plain objects, with no shape declared up front. Go needs a `struct` with `json:"..."` tags so `encoding/json` knows which field maps to which key — in exchange you get an explicit type that's checked at compile time.

## Parsing (unmarshal) and stringifying (marshal)

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
:::

:::note
Go 1.24 adds `omitzero`, a stricter alternative to `omitempty`: it omits a field when it equals its type's **zero value** (using an `IsZero() bool` method if the type has one). Unlike `omitempty`, `omitzero` correctly omits a zero-valued `time.Time` field, which `omitempty` can't do.
:::
