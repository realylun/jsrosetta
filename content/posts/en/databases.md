---
title: "Databases (SQLite)"
description: "Node.js's node:sqlite compared to Go's go-sqlite3, Rust's rusqlite, Swift's SQLite3, and Java's sqlite-jdbc: creating a table, inserting, and querying."
tags: [database, sqlite, sql]
---

The example below creates a table, inserts a few rows, and reads them back from SQLite. `DROP TABLE IF EXISTS` makes the example idempotent so it can be rerun. Node.js now has a built-in SQLite driver (`node:sqlite`); Go has no standard driver in its base library, so it needs an external package (`database/sql` plus the `go-sqlite3` driver). Rust is the same story, using the `rusqlite` crate with the `bundled` feature (it compiles SQLite from source, so no system library is required). Swift calls the `libsqlite3` C library that ships on Apple machines directly through the `SQLite3` module. Java uses the external `sqlite-jdbc` driver through the standard `java.sql` API.

## Creating a table, inserting, and querying

:::tabs
```js
import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync('./sqlite3.db')

db.exec('DROP TABLE IF EXISTS persons')
db.exec('CREATE TABLE persons (name TEXT)')

const insert = db.prepare('INSERT INTO persons VALUES (?)')
const names = ['alice', 'bob', 'charlie']
for (const name of names) {
  insert.run(name)
}

const select = db.prepare('SELECT rowid AS id, name FROM persons')
for (const row of select.all()) {
  console.log(row.id, row.name) // 1 alice / 2 bob / 3 charlie
}

db.close()
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
```rust
// Cargo.toml: rusqlite = { version = "0.40", features = ["bundled"] }
use rusqlite::Connection;

fn main() -> rusqlite::Result<()> {
    let mut conn = Connection::open("./sqlite3.db")?;

    conn.execute("DROP TABLE IF EXISTS persons", [])?;
    conn.execute("CREATE TABLE persons (name TEXT)", [])?;

    let tx = conn.transaction()?;
    {
        let mut stmt = tx.prepare("INSERT INTO persons VALUES (?1)")?;
        for name in ["alice", "bob", "charlie"] {
            stmt.execute([name])?;
        }
    }
    tx.commit()?;

    let mut stmt = conn.prepare("SELECT rowid AS id, name FROM persons")?;
    let rows = stmt.query_map([], |row| Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?)))?;
    for row in rows {
        let (id, name) = row?;
        println!("{id} {name}"); // 1 alice / 2 bob / 3 charlie
    }

    Ok(())
}
```
```swift
import SQLite3

var db: OpaquePointer?
sqlite3_open("./sqlite3.db", &db)
defer { sqlite3_close(db) }

sqlite3_exec(db, "DROP TABLE IF EXISTS persons", nil, nil, nil)
sqlite3_exec(db, "CREATE TABLE persons (name TEXT)", nil, nil, nil)

let sqliteTransient = unsafeBitCast(-1, to: sqlite3_destructor_type.self) // SQLITE_TRANSIENT: let sqlite3 copy the string

sqlite3_exec(db, "BEGIN", nil, nil, nil)
var insertStmt: OpaquePointer?
sqlite3_prepare_v2(db, "INSERT INTO persons VALUES (?)", -1, &insertStmt, nil)
for name in ["alice", "bob", "charlie"] {
    sqlite3_bind_text(insertStmt, 1, name, -1, sqliteTransient)
    sqlite3_step(insertStmt)
    sqlite3_reset(insertStmt)
}
sqlite3_finalize(insertStmt)
sqlite3_exec(db, "COMMIT", nil, nil, nil)

var selectStmt: OpaquePointer?
sqlite3_prepare_v2(db, "SELECT rowid AS id, name FROM persons", -1, &selectStmt, nil)
while sqlite3_step(selectStmt) == SQLITE_ROW {
    let id = sqlite3_column_int64(selectStmt, 0)
    let name = String(cString: sqlite3_column_text(selectStmt, 1))
    print(id, name) // 1 alice / 2 bob / 3 charlie
}
sqlite3_finalize(selectStmt)
```
```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

// Maven: org.xerial:sqlite-jdbc:3.53.4.0
void main() throws Exception {
    try (Connection conn = DriverManager.getConnection("jdbc:sqlite:./sqlite3.db")) {
        try (Statement stmt = conn.createStatement()) {
            stmt.execute("DROP TABLE IF EXISTS persons");
            stmt.execute("CREATE TABLE persons (name TEXT)");
        }

        conn.setAutoCommit(false);
        try (PreparedStatement insert = conn.prepareStatement("INSERT INTO persons VALUES (?)")) {
            for (String name : new String[] {"alice", "bob", "charlie"}) {
                insert.setString(1, name);
                insert.executeUpdate();
            }
        }
        conn.commit();
        conn.setAutoCommit(true);

        try (Statement stmt = conn.createStatement();
             ResultSet rows = stmt.executeQuery("SELECT rowid AS id, name FROM persons")) {
            while (rows.next()) {
                IO.println(rows.getInt("id") + " " + rows.getString("name")); // 1 alice / 2 bob / 3 charlie
            }
        }
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

:::note
`rusqlite`'s `bundled` feature compiles SQLite's source itself (via the `libsqlite3-sys` crate), so no system `libsqlite3` needs to be installed — in exchange, a working C toolchain (`cc`) must be available. It's the standard SQLite driver for Rust, since std has nothing comparable. `rusqlite` declares no `rust-version` in its `Cargo.toml` — its README says outright that its MSRV is "the latest stable Rust release at the time of publishing, might work with older ones but that's not guaranteed." The 0.40.2 release itself had no MSRV check in CI, but the current development branch (past 0.40.2) has started enforcing an MSRV of 1.88.0 — that's the floor used here.
:::

:::note
Swift's `SQLite3` is a direct binding to the `libsqlite3` C library that ships on macOS/iOS (Apple-only). On Linux, or when you want a more Swift-like API instead of manual pointer handling, use the [GRDB.swift](https://github.com/groue/GRDB.swift) or [SQLite.swift](https://github.com/stephencelis/SQLite.swift) package.
:::

:::note
Running the Java example above on JDK 25 prints `A restricted method in java.lang.System has been called`, because `sqlite-jdbc` calls `System.load` to load its native library — add the `--enable-native-access=ALL-UNNAMED` flag to silence it (JEP 472, Java 24+ restricts native access by default).
:::
