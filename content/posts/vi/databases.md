---
title: "Cơ sở dữ liệu (SQLite)"
description: "node:sqlite (DatabaseSync) của Node.js so với database/sql + driver go-sqlite3 của Go: tạo bảng, insert và query."
date: "2026-09-27"
order: 1060
category: stdlib
languages: [js, go]
versions:
  js: "22.13"
  go: "1.21"
tags: [database, sqlite, sql]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#databases"
---

Ví dụ dưới tạo bảng, insert vài dòng rồi đọc lại từ SQLite. `DROP TABLE IF EXISTS` giúp ví dụ chạy lại nhiều lần mà không lỗi. Node.js giờ có driver SQLite built-in (`node:sqlite`); Go không có driver chuẩn trong thư viện gốc nên phải dùng package ngoài (`database/sql` cùng driver `go-sqlite3`).

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
:::

:::note
`node:sqlite` được thêm từ Node.js 22.5 (sau flag `--experimental-sqlite`), chạy không cần flag từ 22.13 (và 23.4). Ở Node.js 24.12.0 nó vẫn experimental nên sẽ in ra `ExperimentalWarning`; nó lên release candidate từ 24.15.0.
:::

:::note
`github.com/mattn/go-sqlite3` dùng cgo nên cần có C toolchain để build — vẫn là lựa chọn phổ biến vì `database/sql` không có driver SQLite trong thư viện chuẩn. `go.mod` của bản v1.14.52 khai `go 1.21`, đó là lý do version sàn là Go ≥ 1.21.
:::
