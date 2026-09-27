---
title: "Viết tài liệu (doc comment)"
description: "JSDoc của Node.js so với go doc (Go), rustdoc (Rust), DocC (Swift) và Javadoc (Java), cùng ví dụ chạy được như một bài test."
date: "2026-09-27"
order: 1100
category: stdlib
languages: [js, go, rust, swift, java]
versions:
  js: "12.20"
  go: "1.0"
  rust: "1.0"
  swift: "2.0"
  java: "23"
tags: [documentation, jsdoc, godoc, comments]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#documentation"
---

Node.js dùng comment đặc biệt theo chuẩn [JSDoc](https://jsdoc.app/) phía trên khai báo, được công cụ editor/generator đọc riêng qua các tag `@...`. Doc comment của Go là một quy ước của toolchain, không phải một phần của đặc tả ngôn ngữ: comment `//` ngay phía trên một khai báo exported sẽ tự động được package [`go/doc`](https://pkg.go.dev/go/doc) đọc và hiển thị qua [`go doc`](https://pkg.go.dev/cmd/doc) cùng pkg.go.dev, không cần cú pháp tag nào cả. Rust dùng comment `///` (rustdoc) — gần giống Go, nhưng markdown bên trong (kể cả code block) được `cargo doc` render trực tiếp, và code block còn được `cargo test` **chạy thật** làm doc test. Swift cũng dùng `///` với markdown, được công cụ DocC (từ Swift 5.5) render thành trang tài liệu. Java dùng Javadoc `/** */` truyền thống; từ Java 23, `///` (JEP 467) cho phép viết doc comment bằng markdown thay vì trộn HTML với tag.

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
```rust
/// `Person` là bản ghi thông tin của một người.
pub struct Person {
    name: String,
}

impl Person {
    /// Tạo một `Person` mới.
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

    /// Trả về tên của person.
    pub fn name(&self) -> &str {
        &self.name
    }

    /// Đặt tên mới cho person.
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
/// `Person` đại diện cho một người dùng.
///
/// ```swift
/// let person = Person(name: "bob")
/// print(person.name) // bob
/// ```
public struct Person {
    /// Tên của person.
    public private(set) var name: String

    /// Tạo một `Person` mới.
    /// - Parameter name: Tên của person.
    public init(name: String) {
        self.name = name
    }

    /// Đặt tên mới cho person.
    /// - Parameter name: Tên mới.
    public mutating func setName(_ name: String) {
        self.name = name
    }
}
```
```java
/// `Person` là bản ghi thông tin của một người.
///
/// ## Ví dụ
/// ```
/// var person = new Person("bob");
/// System.out.println(person.name());
/// ```
public class Person {
    private String name;

    /// Tạo một `Person` mới.
    ///
    /// @param name tên của person
    public Person(String name) {
        this.name = name;
    }

    /// Trả về tên của person.
    ///
    /// @return tên của person
    public String name() {
        return name;
    }

    /// Đặt tên mới cho person.
    ///
    /// @param name tên mới
    public void setName(String name) {
        this.name = name;
    }
}
```
:::

Chạy `go doc Person` ngay trong thư mục package để xem tài liệu ngay trên dòng lệnh; cùng nội dung đó lên `pkg.go.dev` khi module được publish, hoặc xem local bằng [`pkgsite`](https://pkg.go.dev/golang.org/x/pkgsite) (`go run golang.org/x/pkgsite/cmd/pkgsite@latest`) — server `godoc` cũ đã bị deprecate để nhường chỗ cho `pkgsite`. Tương đương: `cargo doc --open` (Rust), `swift package generate-documentation` dùng plugin [swift-docc-plugin](https://github.com/swiftlang/swift-docc-plugin) (Swift), và lệnh `javadoc` hoặc plugin Maven/Gradle tương ứng (Java).

## Ví dụ trong tài liệu chạy được như test

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

Rust đi xa hơn Go: code block markdown ngay trong comment `///` (như ở phần "Comment cho class/struct" phía trên) **chính là** doc test — không cần viết riêng một dạng hàm `Example` nào khác.

```bash
$ cargo test --doc
# thứ tự hai dòng test có thể đổi chỗ giữa các lần chạy
running 2 tests
test src/lib.rs - Person::set_name (line 30) ... ok
test src/lib.rs - Person::new (line 11) ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.74s
```

:::note
Swift Testing/DocC không có tính năng tương đương: code block trong comment `///` chỉ là text hiển thị, `cargo test`-như-doc-test không tồn tại. Cách gần nhất để đảm bảo ví dụ luôn đúng là dùng **Snippets** của DocC — file `.swift` thật đặt trong thư mục `Snippets/`, được biên dịch cùng package nên chắc chắn còn hợp lệ, rồi nhúng vào tài liệu qua `@Snippet(path:)`.
:::

:::note
Javadoc cũng không tự chạy ví dụ. Từ Java 18 (JEP 413), tag `{@snippet}` có thể trỏ tới một vùng trong file nguồn thật (qua `region`) thay vì chép tay code mẫu — đảm bảo snippet luôn khớp code thật, nhưng vẫn không tự chạy assertion như Go/Rust; muốn kiểm tra ví dụ còn đúng, phải viết thêm một test JUnit riêng.
:::
