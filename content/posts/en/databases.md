---
title: "Databases (SQLite)"
description: "Node.js's node:sqlite (DatabaseSync) compared to Go's database/sql plus the go-sqlite3 driver: creating a table, inserting, and querying."
tags: [database, sqlite, sql]
---

The example below creates a table, inserts a few rows, and reads them back from SQLite. `DROP TABLE IF EXISTS` makes the example idempotent so it can be rerun. Node.js now has a built-in SQLite driver (`node:sqlite`); Go has no standard driver in its base library, so it needs an external package (`database/sql` plus the `go-sqlite3` driver).

## Creating a table, inserting, and querying

:::tabs
```js
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("./sqlite3.db");

db.exec("DROP TABLE IF EXISTS persons");
db.exec("CREATE TABLE persons (name TEXT)");

const insert = db.prepare("INSERT INTO persons VALUES (?)");
const names = ["alice", "bob", "charlie"];
for (const name of names) {
  insert.run(name);
}

const select = db.prepare("SELECT rowid AS id, name FROM persons");
for (const row of select.all()) {
  console.log(row.id, row.name); // 1 alice / 2 bob / 3 charlie
}

db.close();
```
```go
package main

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3" // side-effect import: registers the "sqlite3" driver
)

func main() {
	db, err := sql.Open("sqlite3", "./sqlite3.db")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	if _, err := db.Exec("DROP TABLE IF EXISTS persons"); err != nil {
		panic(err)
	}
	if _, err := db.Exec("CREATE TABLE persons (name TEXT)"); err != nil {
		panic(err)
	}

	tx, err := db.Begin()
	if err != nil {
		panic(err)
	}

	stmt, err := tx.Prepare("INSERT INTO persons VALUES (?)")
	if err != nil {
		panic(err)
	}
	defer stmt.Close()

	names := []string{"alice", "bob", "charlie"}
	for _, name := range names {
		if _, err := stmt.Exec(name); err != nil {
			panic(err)
		}
	}
	if err := tx.Commit(); err != nil {
		panic(err)
	}

	rows, err := db.Query("SELECT rowid AS id, name FROM persons")
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			panic(err)
		}
		fmt.Println(id, name) // 1 alice / 2 bob / 3 charlie
	}
	if err := rows.Err(); err != nil {
		panic(err)
	}
}
```
:::

:::note
`node:sqlite` was added in Node.js 22.5 (behind the `--experimental-sqlite` flag) and works without the flag since 22.13 (and 23.4). It's still experimental in the verified Node.js 24.12.0, so it prints an `ExperimentalWarning`; it became a release candidate in 24.15.0.
:::

:::note
`github.com/mattn/go-sqlite3` uses cgo, so a working C toolchain is required to build it — it remains the standard choice since `database/sql` has no SQLite driver in the standard library. Its v1.14.52 `go.mod` declares `go 1.21`, hence the Go ≥ 1.21 floor.
:::
