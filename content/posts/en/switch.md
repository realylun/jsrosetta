---
title: "Switch"
description: "How JavaScript's switch/case (falls through by default) compares to Go's switch (doesn't fall through by default; needs an explicit fallthrough)."
tags: [switch, fallthrough, control-flow]
---

Go's `switch` looks like JavaScript's but the default behavior is exactly reversed: JavaScript falls through to the next case unless you `break`, while Go stops after the matching case unless you explicitly write `fallthrough`.

## Non-fallthrough vs. fallthrough switch

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

## Key differences

| | Node.js | Go |
|---|---|---|
| Default after a matching case | falls through to the next case | stops (implicit break) |
| To stop | you must write `break` | nothing needed, it's the default |
| To fall through | it already does | you must write `fallthrough` explicitly |
