---
title: "Viết tài liệu (doc comment)"
description: "JSDoc của Node.js so với doc comment + go doc/pkg.go.dev của Go, và Example function chạy được như một bài test."
date: "2026-09-27"
order: 1100
category: stdlib
languages: [js, go]
versions:
  js: "12.20"
  go: "1.0"
tags: [documentation, jsdoc, godoc, comments]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#documentation"
---

Node.js dùng comment đặc biệt theo chuẩn [JSDoc](https://jsdoc.app/) phía trên khai báo, được công cụ editor/generator đọc riêng qua các tag `@...`. Doc comment của Go là một quy ước của toolchain, không phải một phần của đặc tả ngôn ngữ: comment `//` ngay phía trên một khai báo exported sẽ tự động được package [`go/doc`](https://pkg.go.dev/go/doc) đọc và hiển thị qua [`go doc`](https://pkg.go.dev/cmd/doc) cùng pkg.go.dev, không cần cú pháp tag nào cả.

## Comment cho class/struct và method

:::tabs
```js
/**
 * Creates a new Person.
 * @class
 * @example
 * const person = new Person('bob')
 */
class Person {
  /**
   * Create a person.
   * @param {string} [name] - The person's name.
   */
  constructor(name) {
    this.name = name
  }

  /**
   * Get the person's name.
   * @return {string} The person's name
   * @example
   * person.getName()
   */
  getName() {
    return this.name
  }

  /**
   * Set the person's name.
   * @param {string} name - The person's name.
   * @example
   * person.setName('bob')
   */
  setName(name) {
    this.name = name
  }
}
```
```go
package person

// Person is the structure of a person
type Person struct {
	name string
}

// NewPerson creates a new person. Takes in a name argument.
func NewPerson(name string) *Person {
	return &Person{name: name}
}

// GetName returns the person's name
func (p *Person) GetName() string {
	return p.name
}

// SetName sets the person's name
func (p *Person) SetName(name string) {
	p.name = name
}
```
:::

Chạy `go doc Person` ngay trong thư mục package để xem tài liệu ngay trên dòng lệnh; cùng nội dung đó lên `pkg.go.dev` khi module được publish, hoặc xem local bằng [`pkgsite`](https://pkg.go.dev/golang.org/x/pkgsite) (`go run golang.org/x/pkgsite/cmd/pkgsite@latest`) — server `godoc` cũ đã bị deprecate để nhường chỗ cho `pkgsite`.

## Example function: ví dụ trong tài liệu chạy được như test

:::tip
`@example` trong JSDoc chỉ là text hiển thị trong tài liệu — không có gì đảm bảo nó còn đúng theo thời gian. Go có kiểu hàm `Example`: nếu bên trong có comment `// Output:`, `go test` sẽ **chạy thật** function đó và so khớp output in ra — biến ví dụ trong tài liệu thành một dạng test.
:::

```go
package person

import "fmt"

// Example of creating a new Person.
func ExampleNewPerson() {
	person := NewPerson("bob")
	_ = person
}

// Example of getting person's name.
func ExamplePerson_GetName() {
	person := NewPerson("bob")
	fmt.Println(person.GetName())
	// Output: bob
}

// Example of setting person's name.
func ExamplePerson_SetName() {
	person := NewPerson("alice")
	person.SetName("bob")
	fmt.Println(person.GetName())
	// Output: bob
}
```

```bash
$ go test -v examples/documentation.go examples/documentation_test.go
=== RUN   ExamplePerson_GetName
--- PASS: ExamplePerson_GetName (0.00s)
=== RUN   ExamplePerson_SetName
--- PASS: ExamplePerson_SetName (0.00s)
PASS
ok  	command-line-arguments	0.620s
```

:::note
`ExampleNewPerson` không có comment `// Output:`, nên `go test` chỉ compile nó (để đảm bảo code còn hợp lệ) chứ không chạy — chỉ ví dụ nào có `// Output:` mới hiện dòng `=== RUN` như ở trên.
:::
