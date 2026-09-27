---
title: "Managing Modules"
description: "Node.js's npm compared to Go modules, Cargo (Rust), Swift Package Manager, and Maven/Gradle (Java): installing, updating, removing, and exporting/importing packages."
tags: [modules, npm, go-modules, packages]
---

Each ecosystem has a dependency manifest file (`package.json`, `go.mod`, `Cargo.toml`, `Package.swift`, `pom.xml`/`build.gradle`) and tooling to manage it. npm and crates.io (Rust) have a central registry; a Go module or Swift package is usually just a git repository — nothing to publish to a registry (Go fetches through the `GOPROXY` module proxy, SwiftPM fetches straight from a git URL). Java splits this into three separate layers: `package` is just a namespace in the language, dependencies are managed by Maven/Gradle through `pom.xml`/`build.gradle`, and JPMS (`module-info.java`, since Java 9) is yet another, independent encapsulation layer.

## Installing, updating, and removing dependencies

| Task | npm (Node.js) | Go modules | Cargo (Rust) | Swift Package Manager | Maven (Java) |
|---|---|---|---|---|---|
| Initialize the dependency file | `npm init` | `go mod init github.com/you/yourmodule` | `cargo new`/`cargo init` | `swift package init` | `mvn archetype:generate` |
| Install a package | `npm install uuid` | `go get github.com/google/uuid@v1.6.0` | `cargo add uuid` | `swift package add-dependency <url> --from <ver>` | add a `<dependency>` to `pom.xml` |
| Install a CLI globally | `npm install -g <pkg>` | `go install pkg@latest` | `cargo install <crate>` | — (no standard way; typically Homebrew/Mint) | — (typically SDKMAN/jbang) |
| Update to the latest version | `npm install uuid@latest` | `go get -u github.com/google/uuid` | `cargo update -p uuid` | `swift package update` | edit the version in `pom.xml` |
| Remove a package | `npm uninstall uuid` | `go get github.com/google/uuid@none` | `cargo remove uuid` | remove the dependency from `Package.swift` | remove the `<dependency>` from `pom.xml` |
| Prune unused dependencies | `npm prune` | `go mod tidy` | — (no standard command) | — (no standard command) | `mvn dependency:analyze` (reports only) |
| Publish | `npm publish` | push code and tag a release on the git repository | `cargo publish` | tag a release on git (Swift Package Index indexes it automatically) | `mvn deploy` (to Maven Central via Sonatype) |

## Importing an external package

:::tabs
```js
// importing a module
import { v4 as uuidv4 } from 'uuid'

const id = uuidv4()
console.log(id) // a random uuid, different every run
```
```go
package main

import (
	"fmt"

	// importing a module
	"github.com/google/uuid"
)

func main() {
	id := uuid.New()
	fmt.Println(id) // a random uuid, different every run
}
```
```rust
// importing a module
use uuid::Uuid;

fn main() {
    let id = Uuid::new_v4();
    println!("{id}"); // a random uuid, different every run
}
```
```swift
// importing a module
import Algorithms

let unique = [1, 2, 2, 3, 3, 3].uniqued() // swift-algorithms: std has nothing like this
print(Array(unique)) // [1, 2, 3]
```
```java
// importing a module
import org.apache.commons.lang3.StringUtils;

// Maven: org.apache.commons:commons-lang3:3.20.0
void main() {
    IO.println(StringUtils.capitalize("bob")); // Bob
}
```
:::

## Exporting your own module

:::tabs
```js
// greeter.js — exporting a module
export function greet(name) {
  console.log(`hello ${name}`)
}

// main.js — importing the module you just exported
import { greet } from './greeter.js'

greet('bob') // hello bob
```
```go
// greeter/greeter.go — exporting a module
package greeter

import "fmt"

// Greet prints a greeting to name
func Greet(name string) {
	fmt.Printf("hello %s", name)
}

// main.go — importing the module you just exported
package main

import "github.com/you/yourmodule/greeter"

func main() {
	greeter.Greet("bob") // hello bob
}
```
```rust
// src/greeter.rs — exporting a module

/// Greet prints a greeting to name
pub fn greet(name: &str) {
    print!("hello {name}");
}

// src/main.rs — importing the module you just exported
mod greeter;

use greeter::greet;

fn main() {
    greet("bob"); // hello bob
}
```
```swift
// Sources/greeter/Greeter.swift — exporting a module
public enum Greeter {
    /// Greet prints a greeting to name
    public static func greet(_ name: String) {
        print("hello \(name)", terminator: "")
    }
}

// Sources/app/main.swift — importing the module you just exported (same package, declared as a target dependency in Package.swift)
import greeter

Greeter.greet("bob") // hello bob
```
```java
// greeter/Greeter.java — exporting a module
package greeter;

public class Greeter {
    /** Prints a greeting to name */
    public static void greet(String name) {
        System.out.print("hello " + name);
    }
}

// Main.java — importing the module you just exported
import greeter.Greeter;

void main() {
    Greeter.greet("bob"); // hello bob
}
```
:::

:::note
**Changed (Go 1.16):** module mode is the default; `GO111MODULE=on` no longer needs to be set before running `go mod init`.
:::

:::note
**Changed (Go 1.17, enforced since 1.18):** `go get` no longer builds or installs binaries — use `go install pkg@version` for that, and `go get pkg@none` to drop a dependency (instead of deleting the cached directory under `$GOPATH/pkg/mod` by hand). `go clean -modcache` clears the whole module cache when needed.
:::

:::note
`uuid` v14 is ESM-only and calls the global Web Crypto `crypto`, which is available without a flag since Node.js 19 — hence the Node.js ≥ 19 floor. `require('uuid')` still works on Node.js ≥ 22.12 (and 20.19), where `require()` can load an ES module.
:::

:::note
`cargo add`/`cargo remove` were merged directly into Cargo in Rust 1.62 (before that you needed the third-party `cargo-edit` plugin). Unlike a Go module (one package = one module), a Rust crate exports items with the `pub` keyword on each item, groups them into a module tree with `mod`, and callers bring an item into scope with `use`.
:::

:::note
The Java example above runs directly thanks to **JEP 458** (Launch Multi-File Source-Code Programs, since JDK 22): `java Main.java` finds and compiles `greeter/Greeter.java` on its own, no separate `javac`/build-tool step needed — close to how Go/Rust let you just add a file and run. Java's `package` is just a namespace; a JPMS module (`module-info.java`, declared with `module`/`exports`/`requires`) is a stronger encapsulation layer, usually only needed when shipping a larger library — this small example doesn't need one.
:::

:::note
`swift package add-dependency` and `add-target-dependency` require Swift 6.0 or later (confirmed working on Swift 6.2). The `public` keyword marks an API as exported from the module — the default (`internal`) is only visible within the same module, unlike Go/Rust where export is per-item (capitalized name, or `pub`) rather than per-module.
:::
