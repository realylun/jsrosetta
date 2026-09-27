---
title: "Quản lý module"
description: "npm của Node.js so với Go modules, Cargo (Rust), Swift Package Manager và Maven/Gradle (Java): cài, cập nhật, gỡ và export/import package."
date: "2026-09-27"
order: 1070
category: stdlib
languages: [js, go, rust, swift, java]
versions:
  js: "19"
  go: "1.16"
  rust: "1.85"
  swift: "6.0"
  java: "25"
tags: [modules, npm, go-modules, packages]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#modules"
---

Mỗi hệ sinh thái đều có một file khai báo dependency (`package.json`, `go.mod`, `Cargo.toml`, `Package.swift`, `pom.xml`/`build.gradle`) và công cụ để quản lý nó. npm và crates.io (Rust) có registry trung tâm; Go module và Swift package thường chỉ là git repository — không cần publish qua registry nào (Go tải qua module proxy `GOPROXY`, SwiftPM tải thẳng qua URL git). Java tách biệt: `package` chỉ là namespace trong ngôn ngữ, dependency được Maven/Gradle quản lý qua `pom.xml`/`build.gradle`, còn JPMS (`module-info.java`, từ Java 9) là một lớp đóng gói/kiểm soát truy cập khác nữa, độc lập với cả hai.

## Cài đặt, cập nhật và gỡ dependency

| Việc cần làm | npm (Node.js) | Go modules | Cargo (Rust) | Swift Package Manager | Maven (Java) |
|---|---|---|---|---|---|
| Khởi tạo file quản lý dependency | `npm init` | `go mod init github.com/you/yourmodule` | `cargo new`/`cargo init` | `swift package init` | `mvn archetype:generate` |
| Cài một package | `npm install uuid` | `go get github.com/google/uuid@v1.6.0` | `cargo add uuid -F v4` | `swift package add-dependency <url> --from <ver>` | thêm `<dependency>` vào `pom.xml` |
| Cài một CLI dùng toàn cục | `npm install -g <pkg>` | `go install pkg@latest` | `cargo install <crate>` | — (không chuẩn hoá; thường dùng Homebrew/Mint) | — (thường dùng SDKMAN/jbang) |
| Cập nhật lên bản mới nhất | `npm install uuid@latest` | `go get -u github.com/google/uuid` | `cargo update -p uuid` | `swift package update` | sửa version trong `pom.xml` |
| Gỡ một package | `npm uninstall uuid` | `go get github.com/google/uuid@none` | `cargo remove uuid` | xoá dependency khỏi `Package.swift` | xoá `<dependency>` khỏi `pom.xml` |
| Dọn dependency không dùng | `npm prune` | `go mod tidy` | — (không có lệnh chuẩn) | — (không có lệnh chuẩn) | `mvn dependency:analyze` (chỉ báo cáo) |
| Publish | `npm publish` | push code + tag release lên git repository | `cargo publish` | tag release trên git (Swift Package Index tự index) | `mvn deploy` (lên Maven Central qua Sonatype) |

## Import một package bên ngoài

:::tabs
```js
// import module
import { v4 as uuidv4 } from 'uuid'

const id = uuidv4()
console.log(id) // uuid ngẫu nhiên, khác nhau mỗi lần chạy
```
```go
package main

import (
	"fmt"

	// import module
	"github.com/google/uuid"
)

func main() {
	id := uuid.New()
	fmt.Println(id) // uuid ngẫu nhiên, khác nhau mỗi lần chạy
}
```
```rust
// Cargo.toml: uuid = { version = "1", features = ["v4"] }
// import module
use uuid::Uuid;

fn main() {
    let id = Uuid::new_v4();
    println!("{id}"); // uuid ngẫu nhiên, khác nhau mỗi lần chạy
}
```
```swift
// import module
import Algorithms

let unique = [1, 2, 2, 3, 3, 3].uniqued() // swift-algorithms: std không có sẵn hàm này
print(Array(unique)) // [1, 2, 3]
```
```java
// import module
import org.apache.commons.lang3.StringUtils;

// Maven: org.apache.commons:commons-lang3:3.20.0
void main() {
    IO.println(StringUtils.capitalize("bob")); // Bob
}
```
:::

## Export module của chính bạn

:::tabs
```js
// greeter.js — export module
export function greet(name) {
  console.log(`hello ${name}`)
}

// main.js — import module vừa export
import { greet } from './greeter.js'

greet('bob') // hello bob
```
```go
// greeter/greeter.go — export module
package greeter

import "fmt"

// Greet in ra lời chào tới name
func Greet(name string) {
	fmt.Printf("hello %s", name)
}

// main.go — import module vừa export
package main

import "github.com/you/yourmodule/greeter"

func main() {
	greeter.Greet("bob") // hello bob
}
```
```rust
// src/greeter.rs — export module

/// Greet in ra lời chào tới name
pub fn greet(name: &str) {
    print!("hello {name}");
}

// src/main.rs — import module vừa export
mod greeter;

use greeter::greet;

fn main() {
    greet("bob"); // hello bob
}
```
```swift
// Sources/greeter/Greeter.swift — export module
public enum Greeter {
    /// Greet in ra lời chào tới name
    public static func greet(_ name: String) {
        print("hello \(name)", terminator: "")
    }
}

// Sources/app/main.swift — import module vừa export (cùng package, khai báo dependency giữa target trong Package.swift)
import greeter

Greeter.greet("bob") // hello bob
```
```java
// greeter/Greeter.java — export module
package greeter;

public class Greeter {
    /** In ra lời chào tới name */
    public static void greet(String name) {
        System.out.print("hello " + name);
    }
}

// Main.java — import module vừa export
import greeter.Greeter;

void main() {
    Greeter.greet("bob"); // hello bob
}
```
:::

:::note
**Thay đổi (Go 1.16):** module mode là mặc định; không cần set `GO111MODULE=on` trước khi chạy `go mod init` nữa.
:::

:::note
**Thay đổi (Go 1.17, bắt buộc từ 1.18):** `go get` không còn build/install binary nữa — dùng `go install pkg@version` cho việc đó, và `go get pkg@none` để gỡ dependency (thay vì tự xoá thư mục cache dưới `$GOPATH/pkg/mod`). `go clean -modcache` xoá sạch cache module khi cần.
:::

:::note
`uuid` bản 14 chỉ là ESM và gọi `crypto` toàn cục của Web Crypto API — có sẵn không cần flag từ Node.js 19, đó là lý do version sàn là 19. `require('uuid')` vẫn chạy được từ Node.js ≥ 22.12 (và 20.19), nơi `require()` có thể load ES module.
:::

:::note
`cargo add`/`cargo remove` được đưa thẳng vào Cargo từ Rust 1.62 (trước đó phải cài plugin bên thứ ba `cargo-edit`). Không giống Go module (một package = một module), một Rust crate xuất API qua từ khoá `pub` đặt trước item, gom vào cây module khai báo bằng `mod`, và phía dùng gọi `use` để đưa item vào scope.
:::

:::note
Ví dụ Java trên chạy trực tiếp qua **JEP 458** (Launch Multi-File Source-Code Programs, từ JDK 22): `java Main.java` tự tìm và biên dịch `greeter/Greeter.java` mà không cần bước `javac`/build tool riêng — gần giống việc Go/Rust chỉ cần thêm file là chạy được. `package` của Java chỉ là namespace; JPMS module (`module-info.java`, khai báo bằng `module`/`exports`/`requires`) là lớp đóng gói mạnh hơn, thường chỉ cần khi phân phối thư viện lớn — ví dụ nhỏ ở đây không cần đến.
:::

:::note
`swift package add-dependency` và `add-target-dependency` cần Swift 6.0 trở lên (đã xác nhận hoạt động ở Swift 6.2). Từ khoá `public` của Swift export theo từng item — giống `pub` của Rust, đặt trước từng khai báo muốn export chứ không phải cấu hình theo cả module. Mặc định (không ghi gì) là `internal`: thấy được trong toàn bộ module hiện tại, gần giống `pub(crate)` của Rust.
:::
