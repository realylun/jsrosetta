---
title: "Error Handling and try/catch"
description: "How Node.js's throw and try/catch/finally compare to error values in Go, Result in Rust, throws in Swift, and exceptions in Java."
tags: [error, exception, try-catch, result]
---

JavaScript lets you `throw` anything, anywhere, and the caller has no way of knowing a function might throw. The languages below split into two camps:

- **Errors are return values**: Go, Rust. The caller is forced to handle them.
- **Exceptions**: Swift, Java. Similar to JavaScript, but stricter about types.

## Defining, throwing, and catching errors

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

// The error is the final return value.
func findUser(id int) (User, error) {
	if id != 1 {
		return User{}, fmt.Errorf("user %d: %w", id, ErrNotFound) // %w: wraps the underlying error
	}
	return User{ID: id, Name: "neko"}, nil
}

func main() {
	defer fmt.Println("done") // roughly equivalent to finally

	user, err := findUser(2)
	if errors.Is(err, ErrNotFound) { // ~ instanceof, sees through wrapping layers
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
        Err(err) => eprintln!("{err}"), // the compiler forces you to handle both branches
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

// `throws` must be declared; the caller has to use `try`.
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
    print("unexpected: \(error)") // `error` is available in the final catch
}
print("done") // Swift has no finally, use `defer` inside the function
```
```java
public class Main {
    // Checked exception: the compiler requires declaring `throws` or catching it.
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

## Propagating errors upward (rethrow)

In JavaScript, an uncaught error automatically propagates up to the caller. Go and Rust make you write that out explicitly:

:::tabs
```js
function greet(id) {
  const user = findUser(id); // the error propagates automatically
  return `hi ${user.name}`;
}
```
```go
func greet(id int) (string, error) {
	user, err := findUser(id)
	if err != nil {
		return "", fmt.Errorf("greet: %w", err) // pass the error up, with added context
	}
	return "hi " + user.Name, nil
}
```
```rust
fn greet(id: u32) -> Result<String, UserError> {
    let user = find_user(id)?; // `?`: returns Err immediately on error
    Ok(format!("hi {}", user.name))
}
```
```swift
func greet(id: Int) throws -> String {
    let user = try findUser(id: id) // `try` marks where something might throw
    return "hi \(user.name)"
}
```
```java
static String greet(int id) throws NotFoundException { // must keep declaring it
    User user = findUser(id);
    return "hi " + user.name();
}
```
:::

## Falling back to a default value on error

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
```java
String name;
try {
    name = findUser(2).name();
} catch (NotFoundException e) {
    name = "guest";
}
```
:::

