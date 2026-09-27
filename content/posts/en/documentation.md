---
title: "Writing Documentation"
description: "Node.js's JSDoc compared to Go's doc comments, Rust's rustdoc, Swift's DocC, and Java's Javadoc, plus examples that run as tests."
tags: [documentation, jsdoc, godoc, comments]
---

Node.js uses special comments following the [JSDoc](https://jsdoc.app/) convention above a declaration, read by editors and doc generators through `@...` tags. Go doc comments are a toolchain convention, not part of the language spec: a `//` comment right above an exported declaration is automatically picked up by the [`go/doc`](https://pkg.go.dev/go/doc) package and rendered by [`go doc`](https://pkg.go.dev/cmd/doc) and pkg.go.dev, with no tag syntax needed at all. Rust uses `///` comments (rustdoc) — close to Go, except the markdown inside (including code blocks) is rendered directly by `cargo doc`, and those code blocks are also **actually run** by `cargo test` as doc tests. Swift also uses `///` with markdown, rendered into a documentation site by the DocC tool (since Swift 5.5). Java uses the traditional Javadoc `/** */`; since Java 23, `///` (JEP 467) lets you write a doc comment in markdown instead of mixing HTML with tags.

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
```rust
/// `Person` is a record of a person's information.
pub struct Person {
    name: String,
}

impl Person {
    /// Creates a new `Person`.
    ///
    /// # Examples
    ///
    /// ```
    /// use example::Person;
    ///
    /// let person = Person::new("bob");
    /// assert_eq!(person.name(), "bob");
    /// ```
    pub fn new(name: &str) -> Self {
        Person { name: name.to_string() }
    }

    /// Returns the person's name.
    pub fn name(&self) -> &str {
        &self.name
    }

    /// Sets the person's name.
    ///
    /// # Examples
    ///
    /// ```
    /// use example::Person;
    ///
    /// let mut person = Person::new("alice");
    /// person.set_name("bob");
    /// assert_eq!(person.name(), "bob");
    /// ```
    pub fn set_name(&mut self, name: &str) {
        self.name = name.to_string();
    }
}
```
```swift
/// `Person` represents a user.
///
/// ```swift
/// let person = Person(name: "bob")
/// print(person.name) // bob
/// ```
public struct Person {
    /// The person's name.
    public private(set) var name: String

    /// Creates a new `Person`.
    /// - Parameter name: The person's name.
    public init(name: String) {
        self.name = name
    }

    /// Sets the person's name.
    /// - Parameter name: The new name.
    public mutating func setName(_ name: String) {
        self.name = name
    }
}
```
```java
/// `Person` is a record of a person's information.
///
/// ## Example
/// ```
/// var person = new Person("bob");
/// System.out.println(person.name());
/// ```
public class Person {
    private String name;

    /// Creates a new `Person`.
    ///
    /// @param name the person's name
    public Person(String name) {
        this.name = name;
    }

    /// Returns the person's name.
    ///
    /// @return the person's name
    public String name() {
        return name;
    }

    /// Sets the person's name.
    ///
    /// @param name the new name
    public void setName(String name) {
        this.name = name;
    }
}
```
:::

Run `go doc Person` right inside the package's directory to print its documentation on the command line; the same comments power the generated page on `pkg.go.dev` once the module is published, or locally via [`pkgsite`](https://pkg.go.dev/golang.org/x/pkgsite) (`go run golang.org/x/pkgsite/cmd/pkgsite@latest`) — the older standalone `godoc` server is deprecated in favor of `pkgsite`. Equivalents: `cargo doc --open` (Rust), `swift package generate-documentation` using the [swift-docc-plugin](https://github.com/swiftlang/swift-docc-plugin) (Swift), and the `javadoc` command or the corresponding Maven/Gradle plugin (Java).

## Runnable documentation examples

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

Rust goes further than Go: the markdown code block right inside a `///` comment (as seen in the "Comments for a class/struct" section above) **is** the doc test — there's no separate `Example`-style function to write.

```bash
$ cargo test --doc
# the order of the two test lines can swap between runs
running 2 tests
test src/lib.rs - Person::set_name (line 30) ... ok
test src/lib.rs - Person::new (line 11) ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.74s
```

:::note
Swift Testing/DocC has no equivalent feature: a code block inside a `///` comment is display text only, and there's no `cargo test`-style doc test. The closest way to keep an example honest is DocC's **Snippets** — real `.swift` files under a `Snippets/` directory, compiled along with the package (so they're guaranteed to stay valid), embedded into docs via `@Snippet(path:)`.
:::

:::note
Javadoc doesn't auto-run examples either. Since Java 18 (JEP 413), the `{@snippet}` tag can point at a region of a real source file (via `region`) instead of a hand-copied example — guaranteeing the snippet matches the real code, but still not running any assertions the way Go/Rust do; to verify an example still works, you'd write a separate JUnit test.
:::
