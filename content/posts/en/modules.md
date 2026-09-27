---
title: "Managing Modules"
description: "Node.js's npm (package.json) compared to Go modules (go.mod): installing, updating, removing, and exporting/importing packages."
tags: [modules, npm, go-modules, packages]
---

Both ecosystems have a dependency manifest file (`package.json` / `go.mod`) and a CLI to manage it. The biggest difference: npm has a central registry, while a Go module is usually just a git repository — fetched through the `GOPROXY` module proxy by default, with `GOPRIVATE` for private modules, so there's no registry to publish to.

## Installing, updating, and removing dependencies

| Task | npm (Node.js) | Go modules |
|---|---|---|
| Initialize the dependency file | `npm init` | `go mod init github.com/you/yourmodule` |
| Install a package | `npm install uuid` | `go get github.com/google/uuid@v1.6.0` |
| Install a CLI globally | `npm install -g <pkg>` | `go install pkg@latest` |
| Update to the latest version | `npm install uuid@latest` | `go get -u github.com/google/uuid` |
| Remove a package | `npm uninstall uuid` | `go get github.com/google/uuid@none` |
| Prune unused dependencies | `npm prune` | `go mod tidy` |
| Publish | `npm publish` | push code and tag a release on the git repository |

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
