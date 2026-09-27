---
title: "Cơ sở dữ liệu (SQLite)"
description: "node:sqlite của Node.js so với go-sqlite3 (Go), rusqlite (Rust), SQLite3 (Swift) và sqlite-jdbc (Java): tạo bảng, insert và query."
date: "2026-09-27"
order: 1060
category: stdlib
languages: [js, go, rust, swift, java]
versions:
  js: "22.13"
  go: "1.21"
  rust: "1.88"
  swift: "2.0"
  java: "25"
tags: [database, sqlite, sql]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#databases"
---

Ví dụ dưới tạo bảng, insert vài dòng rồi đọc lại từ SQLite. `DROP TABLE IF EXISTS` giúp ví dụ chạy lại nhiều lần mà không lỗi. Node.js giờ có driver SQLite built-in (`node:sqlite`); Go không có driver chuẩn trong thư viện gốc nên phải dùng package ngoài (`database/sql` cùng driver `go-sqlite3`). Rust cũng vậy, dùng crate `rusqlite` với feature `bundled` (tự build SQLite từ source, khỏi cần cài sẵn thư viện hệ thống). Swift gọi thẳng thư viện C `libsqlite3` có sẵn trên máy Apple qua module `SQLite3`. Java dùng driver JDBC ngoài `sqlite-jdbc` qua API chuẩn `java.sql`.

## Tạo bảng, insert và query

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

	_ "github.com/mattn/go-sqlite3" // side-effect import: đăng ký driver "sqlite3"
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

let sqliteTransient = unsafeBitCast(-1, to: sqlite3_destructor_type.self) // SQLITE_TRANSIENT: sqlite3 tự copy chuỗi

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
`node:sqlite` được thêm từ Node.js 22.5 (sau flag `--experimental-sqlite`), chạy không cần flag từ 22.13 (và 23.4). Ở Node.js 24.12.0 nó vẫn experimental nên sẽ in ra `ExperimentalWarning`; nó lên release candidate từ 24.15.0.
:::

:::note
`github.com/mattn/go-sqlite3` dùng cgo nên cần có C toolchain để build — vẫn là lựa chọn phổ biến vì `database/sql` không có driver SQLite trong thư viện chuẩn. `go.mod` của bản v1.14.52 khai `go 1.21`, đó là lý do version sàn là Go ≥ 1.21.
:::

:::note
`rusqlite` với feature `bundled` tự biên dịch mã nguồn SQLite (qua crate `libsqlite3-sys`) nên không cần cài `libsqlite3` trên máy — đổi lại phải có sẵn C toolchain (`cc`). Đây cũng là driver SQLite phổ biến nhất cho Rust vì std không có gì tương đương.
:::

:::note
`SQLite3` của Swift là binding trực tiếp tới thư viện C `libsqlite3` có sẵn trên macOS/iOS (Apple-only). Trên Linux hoặc khi cần API kiểu Swift hơn (không thao tác con trỏ thủ công), dùng package [GRDB.swift](https://github.com/groue/GRDB.swift) hoặc [SQLite.swift](https://github.com/stephencelis/SQLite.swift).
:::

:::note
Chạy ví dụ Java ở trên trên JDK 25 sẽ in cảnh báo `A restricted method in java.lang.System has been called` vì `sqlite-jdbc` gọi `System.load` để nạp thư viện native — thêm cờ `--enable-native-access=ALL-UNNAMED` để tắt cảnh báo (JEP 472, Java 24+ siết chặt truy cập native theo mặc định).
:::
