---
title: "Async/Await"
description: "How Node.js's Promise and async/await compare to goroutines (Go), Future + tokio (Rust), Swift concurrency, coroutines (Kotlin), and CompletableFuture (Java)."
tags: [promise, async, await, concurrency]
---

Node.js runs a single-threaded event loop: `await` yields control back to the event loop until the Promise settles. Each language below solves the same problem with its own model. Read the notes carefully, because **the difference lies in the runtime, not just the syntax**.

## Waiting for a task

:::tabs
```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchUser(id) {
  await sleep(100);
  return { id, name: `user-${id}` };
}

const user = await fetchUser(1); // top-level await in an ES module
console.log(user.name);
```
```go
package main

import (
	"fmt"
	"time"
)

type User struct {
	ID   int
	Name string
}

// No async/await: the function just blocks, and the runtime schedules other goroutines itself.
func fetchUser(id int) User {
	time.Sleep(100 * time.Millisecond)
	return User{ID: id, Name: fmt.Sprintf("user-%d", id)}
}

func main() {
	user := fetchUser(1)
	fmt.Println(user.Name)
}
```
```rust
// Cargo.toml: tokio = { version = "1", features = ["full"] }
use std::time::Duration;
use tokio::time::sleep;

struct User {
    id: u32,
    name: String,
}

async fn fetch_user(id: u32) -> User {
    sleep(Duration::from_millis(100)).await; // `.await` comes after the expression
    User { id, name: format!("user-{id}") }
}

#[tokio::main] // Rust doesn't ship an async runtime, you have to pick one (tokio)
async fn main() {
    let user = fetch_user(1).await;
    println!("{} {}", user.id, user.name);
}
```
```swift
struct User {
    let id: Int
    let name: String
}

func fetchUser(id: Int) async throws -> User {
    try await Task.sleep(for: .milliseconds(100))
    return User(id: id, name: "user-\(id)")
}

@main
struct App {
    static func main() async throws {
        let user = try await fetchUser(id: 1)
        print(user.name)
    }
}
```
```kotlin
// build.gradle.kts: implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:<version>")
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking

data class User(val id: Int, val name: String)

suspend fun fetchUser(id: Int): User {
    delay(100)
    return User(id, "user-$id")
}

fun main() = runBlocking {
    val user = fetchUser(1) // call a suspend fun like a normal function, there's no `await` keyword
    println(user.name)
}
```
```java
import java.util.concurrent.CompletableFuture;

public class Main {
    record User(int id, String name) {}

    static CompletableFuture<User> fetchUser(int id) {
        return CompletableFuture.supplyAsync(() -> {
            sleep(100);
            return new User(id, "user-" + id);
        });
    }

    static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(e);
        }
    }

    public static void main(String[] args) {
        User user = fetchUser(1).join(); // join() blocks the current thread, similar to await
        System.out.println(user.name());
    }
}
```
:::

## Running in parallel (Promise.all)

:::tabs
```js
const users = await Promise.all([1, 2, 3].map(fetchUser));
console.log(users.length); // 3, total time ~100ms
```
```go
import "sync"

ids := []int{1, 2, 3}
users := make([]User, len(ids))

var wg sync.WaitGroup
for i, id := range ids {
	wg.Add(1)
	go func() { // each goroutine writes to its own slot, no lock needed
		defer wg.Done()
		users[i] = fetchUser(id)
	}()
}
wg.Wait()
fmt.Println(len(users))
```
```rust
let (a, b, c) = tokio::join!(fetch_user(1), fetch_user(2), fetch_user(3));
println!("{} {} {}", a.name, b.name, c.name);

// Dynamic list: futures::future::join_all(ids.into_iter().map(fetch_user)).await
```
```swift
async let a = fetchUser(id: 1)
async let b = fetchUser(id: 2)
async let c = fetchUser(id: 3)
let users = try await [a, b, c]
print(users.count)
```
```kotlin
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.runBlocking

fun main() = runBlocking { // `async` needs a CoroutineScope, runBlocking provides that scope
    val users = listOf(1, 2, 3)
        .map { id -> async { fetchUser(id) } }
        .awaitAll()
    println(users.size)
}
```
```java
import java.util.List;

List<CompletableFuture<User>> futures = List.of(1, 2, 3).stream()
        .map(Main::fetchUser)
        .toList();

CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
List<User> users = futures.stream().map(CompletableFuture::join).toList();
System.out.println(users.size());
```
:::

## Key differences to remember

| | Node.js | Go | Rust | Swift | Kotlin | Java |
|---|---|---|---|---|---|---|
| Async unit | `Promise` | goroutine | `Future` | `Task` | coroutine | `CompletableFuture` |
| Starts running when | Promise is created | `go` is called | `.await`ed/polled | `async let`/`Task` is called | `async`/`launch` is called | `supplyAsync` is called |
| Runtime | built-in event loop | built-in | choose your own (tokio…) | built-in | kotlinx library | built-in thread pool |
| True multithreading | no (except workers) | yes | yes | yes | yes | yes |

:::warning
Rust's Future is **lazy**: calling `fetch_user(1)` without `.await` runs nothing at all. A JavaScript Promise, by contrast, starts running as soon as it's created.
:::

:::tip
Go doesn't distinguish between sync and async functions (no "function coloring"). You write sequential code, and to run it in parallel you just add `go` before the function call.
:::
