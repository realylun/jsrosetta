---
title: "Vòng lặp For"
description: "Vòng lặp for kiểu C của JavaScript so với for kiểu C và range-over-int (Go 1.22+) trong Go."
date: "2026-09-27"
order: 310
category: control-flow
languages: [js, go]
versions:
  js: "12.20"
  go: "1.22"
tags: [for-loop, range, control-flow]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#for"
---

Go giữ nguyên vòng `for` kiểu C ba phần (`init; condition; post`) giống JavaScript. Go không có `while` hay `do-while` riêng — `for` là từ khoá lặp duy nhất, và từ Go 1.22 nó còn có thêm cách viết `range` để lặp một số lần cố định.

## Vòng lặp kiểu C và range-over-int

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

	// range trên một số nguyên để lặp một số lần cố định
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
Go 1.22 thêm `for i := range N` (range trên một số nguyên) làm cách viết gọn để lặp N lần; trước 1.22 phải dùng `for i := 0; i < N; i++`. Go 1.22 cũng cho mỗi vòng `for` một bản copy riêng của biến lặp ở mỗi lần lặp, nên cách né `x := x` từng cần khi capture biến lặp trong goroutine hay closure không còn cần nữa. Cả hai đều yêu cầu `go 1.22`+ trong go.mod.
:::
