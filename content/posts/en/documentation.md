---
title: "Writing Documentation"
description: "Node.js's JSDoc compared to Go's doc comments + go doc/pkg.go.dev, and Example functions that run as tests."
tags: [documentation, jsdoc, godoc, comments]
---

Node.js uses special comments following the [JSDoc](https://jsdoc.app/) convention above a declaration, read by editors and doc generators through `@...` tags. Go doc comments are a toolchain convention, not part of the language spec: a `//` comment right above an exported declaration is automatically picked up by the [`go/doc`](https://pkg.go.dev/go/doc) package and rendered by [`go doc`](https://pkg.go.dev/cmd/doc) and pkg.go.dev, with no tag syntax needed at all.

## Comments for a class/struct and its methods

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

Run `go doc Person` right inside the package's directory to print its documentation on the command line; the same comments power the generated page on `pkg.go.dev` once the module is published, or locally via [`pkgsite`](https://pkg.go.dev/golang.org/x/pkgsite) (`go run golang.org/x/pkgsite/cmd/pkgsite@latest`) — the older standalone `godoc` server is deprecated in favor of `pkgsite`.

## Example functions: runnable documentation examples

:::tip
JSDoc's `@example` is just text displayed in the documentation — nothing guarantees it stays correct over time. Go has an `Example` function type: if it contains an `// Output:` comment, `go test` actually **runs** that function and checks the printed output against it, turning a documentation example into a kind of test.
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
`ExampleNewPerson` has no `// Output:` comment, so `go test` compiles it (to keep it valid) but doesn't execute it — only examples with an `// Output:` comment show up as `=== RUN` lines above.
:::
