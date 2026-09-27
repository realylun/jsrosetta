---
title: "Biến và hằng"
description: "const, let trong Node.js tương ứng với gì ở Go, Rust, Swift, Kotlin và Java."
date: "2026-09-27"
order: 10
category: basics
languages: [js, go, rust, swift, kotlin, java]
tags: [const, let, immutability, type-inference]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#variables"
---

Trong JavaScript bạn quen với hai từ khoá: `const` (không gán lại được) và `let` (gán lại được). Hầu hết các ngôn ngữ khác cũng tách hai khái niệm này, chỉ khác tên gọi và mặc định.

## Khai báo cơ bản

:::tabs
```js
const name = "neko"; // không gán lại được
let count = 0;       // gán lại được
count += 1;

console.log(name, count);
```
```go
package main

import "fmt"

const name = "neko" // hằng compile-time

func main() {
	var count int = 0 // khai báo tường minh
	count += 1
	total := 10 // khai báo ngắn + suy luận kiểu (chỉ dùng trong hàm)

	fmt.Println(name, count, total)
}
```
```rust
fn main() {
    let name = "neko";  // bất biến mặc định
    let mut count = 0;  // cần `mut` mới gán lại được
    count += 1;

    println!("{name} {count}");
}
```
```swift
let name = "neko" // hằng
var count = 0     // biến
count += 1

print(name, count)
```
```kotlin
fun main() {
    val name = "neko" // read-only, giống const
    var count = 0     // mutable, giống let
    count += 1

    println("$name $count")
}
```
```java
public class Main {
    public static void main(String[] args) {
        final String name = "neko"; // không gán lại được
        var count = 0;              // Java 10+: suy luận kiểu cục bộ
        count += 1;

        System.out.println(name + " " + count);
    }
}
```
:::

| Node.js | Go | Rust | Swift | Kotlin | Java |
|---|---|---|---|---|---|
| `const` | `const` (chỉ giá trị compile-time) | `let` | `let` | `val` | `final` |
| `let` | `var` / `:=` | `let mut` | `var` | `var` | biến thường / `var` |

:::note
Rust là ngôn ngữ duy nhất trong danh sách mà **bất biến là mặc định**. Muốn thay đổi giá trị, bạn phải xin phép bằng `mut`.
:::

## Hằng số compile-time

`const` trong JavaScript chỉ chặn việc gán lại, còn giá trị có thể được tính lúc chạy. Các ngôn ngữ khác thường có thêm một loại hằng **được tính lúc biên dịch**.

:::tabs
```js
const MAX_USERS = 100;
const startedAt = Date.now(); // vẫn hợp lệ: tính lúc chạy
```
```go
const MaxUsers = 100

// const startedAt = time.Now() // lỗi: không phải hằng compile-time
var startedAt = time.Now()
```
```rust
const MAX_USERS: u32 = 100; // bắt buộc ghi kiểu

fn main() {
    let started_at = std::time::Instant::now(); // giá trị lúc chạy dùng `let`
    println!("{MAX_USERS} {started_at:?}");
}
```
```swift
let maxUsers = 100
let startedAt = Date() // `let` nhận cả giá trị lúc chạy
```
```kotlin
const val MAX_USERS = 100 // chỉ ở top-level hoặc object, kiểu nguyên thuỷ/String

val startedAt = System.currentTimeMillis() // `val` nhận giá trị lúc chạy
```
```java
static final int MAX_USERS = 100;
static final long STARTED_AT = System.currentTimeMillis();
```
:::

## Giá trị mặc định khi chưa gán

JavaScript cho `undefined`. Go gán **zero value** theo kiểu. Các ngôn ngữ còn lại bắt bạn gán trước khi dùng.

:::tabs
```js
let title;
console.log(title); // undefined
```
```go
var title string // ""
var n int        // 0
var ok bool      // false
var p *int       // nil
```
```rust
let title: String;
// println!("{title}"); // lỗi: dùng biến chưa khởi tạo
title = String::from("hi");
println!("{title}");
```
```swift
func example() {
    var title: String?  // Optional, mặc định nil
    let label: String
    // print(label)     // lỗi: dùng trước khi khởi tạo
    label = "hi"
    print(title ?? "-", label)
}
```
```kotlin
var title: String? = null  // phải gán tường minh
lateinit var label: String // hứa sẽ gán sau (chỉ với var, kiểu non-null)
```
```java
String title;      // biến cục bộ: phải gán trước khi đọc
static int count;  // field: mặc định 0, object: null
```
:::

## const không có nghĩa là bất biến

Trong JavaScript, `const` chỉ khoá **tham chiếu**. Object bên trong vẫn sửa được. Ngôn ngữ khác xử lý chuyện này rất khác nhau:

:::tabs
```js
const user = { name: "neko" };
user.name = "tama"; // hợp lệ
Object.freeze(user); // muốn khoá thật phải freeze
```
```go
// Go không có const cho struct/slice/map.
// Truyền theo giá trị (copy) để tránh bị sửa.
user := User{Name: "neko"}
user.Name = "tama"
```
```rust
let user = User { name: "neko".to_string() };
// user.name = "tama".to_string(); // lỗi: `user` không phải `mut`
let mut user = user;
user.name = "tama".to_string();
```
```swift
struct User { var name: String } // struct là value type

let user = User(name: "neko")
// user.name = "tama" // lỗi: `let` khoá cả struct
```
```kotlin
data class User(val name: String) // `val` property: không đổi được

val user = User("neko")
val renamed = user.copy(name = "tama") // tạo bản sao mới
```
```java
record User(String name) {} // record: field final

final User user = new User("neko");
User renamed = new User("tama"); // tạo object mới
```
:::
