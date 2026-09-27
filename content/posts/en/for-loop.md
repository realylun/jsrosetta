---
title: "For Loops"
description: "How JavaScript's C-style for loop compares to Go's C-style for and range-over-int (Go 1.22+)."
tags: [for-loop, range, control-flow]
---

Go keeps the three-part C-style `for` loop (`init; condition; post`) just like JavaScript. Go has no separate `while` or `do-while` — `for` is the only looping keyword, and since Go 1.22 it also has a `range` form for looping a fixed number of times.

## The C-style loop and range-over-int

:::tabs
```js
for (let i = 0; i <= 5; i++) {
  console.log(i)
}
```
```go
package main

import "fmt"

func main() {
	for i := 0; i <= 5; i++ {
		fmt.Println(i)
	}

	// range over an integer to loop a fixed number of times
	for i := range 6 {
		fmt.Println(i)
	}
}
```
:::

```bash
# Node.js
0
1
2
3
4
5

# Go
0
1
2
3
4
5
0
1
2
3
4
5
```

:::note
Go 1.22 added `for i := range N` (ranging over an integer) as a concise way to loop N times; before 1.22 you needed the classic `for i := 0; i < N; i++` form. Go 1.22 also gave every `for` loop its own per-iteration copy of the loop variable, so the old `x := x` workaround needed before capturing a loop variable in a goroutine or closure is no longer necessary. Both require `go 1.22`+ in go.mod.
:::
