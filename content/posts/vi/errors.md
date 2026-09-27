---
title: "Xử lý lỗi và try/catch"
description: "throw, try/catch/finally của Node.js so với error value (Go), Result (Rust), throws (Swift), exception (Kotlin, Java)."
date: "2026-09-27"
order: 70
category: errors
languages: [js, go, rust, swift, kotlin, java]
tags: [error, exception, try-catch, result]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#errors"
---

JavaScript cho phép `throw` bất cứ thứ gì, ở bất cứ đâu, và người gọi không hề biết hàm có thể ném lỗi. Các ngôn ngữ dưới đây chia thành hai trường phái:

- **Lỗi là giá trị trả về**: Go, Rust. Người gọi buộc phải xử lý.
- **Exception**: Swift, Kotlin, Java. Giống JavaScript nhưng chặt hơn về kiểu.

## Định nghĩa, ném và bắt lỗi

:::tabs
```js
class NotFoundError extends Error {
  constructor(id) {
    super(`user ${id} not found`);
    this.name = "NotFoundError";
  }
}

function findUser(id) {
  if (id !== 1) throw new NotFoundError(id);
  return { id, name: "neko" };
}

try {
  const user = findUser(2);
  console.log(user.name);
} catch (err) {
  if (err instanceof NotFoundError) console.error(err.message);
  else throw err;
} finally {
  console.log("done");
}
```
```go
package main

import (
	"errors"
	"fmt"
)

var ErrNotFound = errors.New("not found") // sentinel error

type User struct {
	ID   int
	Name string
}

// Lỗi là giá trị trả về cuối cùng.
func findUser(id int) (User, error) {
	if id != 1 {
		return User{}, fmt.Errorf("user %d: %w", id, ErrNotFound) // %w: bọc lỗi gốc
	}
	return User{ID: id, Name: "neko"}, nil
}

func main() {
	defer fmt.Println("done") // gần giống finally

	user, err := findUser(2)
	if errors.Is(err, ErrNotFound) { // ~ instanceof, xuyên qua các lớp bọc
		fmt.Println(err) // user 2: not found
		return
	}
	if err != nil {
		panic(err)
	}
	fmt.Println(user.Name)
}
```
```rust
use std::fmt;

#[derive(Debug)]
enum UserError {
    NotFound(u32),
}

impl fmt::Display for UserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            UserError::NotFound(id) => write!(f, "user {id} not found"),
        }
    }
}

impl std::error::Error for UserError {}

struct User {
    name: String,
}

fn find_user(id: u32) -> Result<User, UserError> {
    if id != 1 {
        return Err(UserError::NotFound(id));
    }
    Ok(User { name: "neko".into() })
}

fn main() {
    match find_user(2) {
        Ok(user) => println!("{}", user.name),
        Err(err) => eprintln!("{err}"), // compiler bắt bạn xử lý cả hai nhánh
    }
    println!("done");
}
```
```swift
enum UserError: Error {
    case notFound(id: Int)
}

struct User {
    let id: Int
    let name: String
}

// `throws` bắt buộc khai báo; người gọi phải dùng `try`.
func findUser(id: Int) throws -> User {
    guard id == 1 else { throw UserError.notFound(id: id) }
    return User(id: id, name: "neko")
}

do {
    let user = try findUser(id: 2)
    print(user.name)
} catch UserError.notFound(let id) {
    print("user \(id) not found")
} catch {
    print("unexpected: \(error)") // `error` có sẵn trong catch cuối
}
print("done") // Swift không có finally, dùng `defer` trong hàm
```
```kotlin
class NotFoundException(id: Int) : Exception("user $id not found")

data class User(val id: Int, val name: String)

fun findUser(id: Int): User {
    if (id != 1) throw NotFoundException(id)
    return User(id, "neko")
}

fun main() {
    try {
        val user = findUser(2)
        println(user.name)
    } catch (e: NotFoundException) {
        println(e.message)
    } finally {
        println("done")
    }
}
```
```java
public class Main {
    // Checked exception: compiler bắt khai báo `throws` hoặc bắt lỗi.
    static class NotFoundException extends Exception {
        NotFoundException(int id) {
            super("user " + id + " not found");
        }
    }

    record User(int id, String name) {}

    static User findUser(int id) throws NotFoundException {
        if (id != 1) throw new NotFoundException(id);
        return new User(id, "neko");
    }

    public static void main(String[] args) {
        try {
            User user = findUser(2);
            System.out.println(user.name());
        } catch (NotFoundException e) {
            System.err.println(e.getMessage());
        } finally {
            System.out.println("done");
        }
    }
}
```
:::

## Ném lỗi tiếp lên trên (rethrow)

Trong JavaScript, lỗi không bắt sẽ tự nổi lên người gọi. Go và Rust bắt bạn viết rõ điều đó:

:::tabs
```js
function greet(id) {
  const user = findUser(id); // lỗi tự nổi lên
  return `hi ${user.name}`;
}
```
```go
func greet(id int) (string, error) {
	user, err := findUser(id)
	if err != nil {
		return "", fmt.Errorf("greet: %w", err) // trả lỗi lên, kèm ngữ cảnh
	}
	return "hi " + user.Name, nil
}
```
```rust
fn greet(id: u32) -> Result<String, UserError> {
    let user = find_user(id)?; // `?`: có lỗi thì return Err ngay
    Ok(format!("hi {}", user.name))
}
```
```swift
func greet(id: Int) throws -> String {
    let user = try findUser(id: id) // `try` đánh dấu chỗ có thể ném
    return "hi \(user.name)"
}
```
```kotlin
fun greet(id: Int): String {
    val user = findUser(id) // exception tự nổi lên, không cần khai báo
    return "hi ${user.name}"
}
```
```java
static String greet(int id) throws NotFoundException { // phải khai báo tiếp
    User user = findUser(id);
    return "hi " + user.name();
}
```
:::

## Lấy giá trị mặc định khi lỗi

:::tabs
```js
let name;
try {
  name = findUser(2).name;
} catch {
  name = "guest";
}
```
```go
name := "guest"
if user, err := findUser(2); err == nil {
	name = user.Name
}
```
```rust
let name = find_user(2)
    .map(|user| user.name)
    .unwrap_or_else(|_| "guest".to_string());
```
```swift
let name = (try? findUser(id: 2))?.name ?? "guest"
```
```kotlin
val name = runCatching { findUser(2).name }.getOrDefault("guest")
// hoặc: val name = try { findUser(2).name } catch (e: NotFoundException) { "guest" }
```
```java
String name;
try {
    name = findUser(2).name();
} catch (NotFoundException e) {
    name = "guest";
}
```
:::

:::note
Kotlin **không có checked exception** dù chạy trên JVM. Code Kotlin gọi một hàm Java có `throws` cũng không bị bắt phải `catch`.
:::
