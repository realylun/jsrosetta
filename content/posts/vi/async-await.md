---
title: "Async/Await"
description: "Promise và async/await của Node.js so với goroutine (Go), Future + tokio (Rust), Swift concurrency và CompletableFuture (Java)."
date: "2026-09-27"
order: 60
category: async
languages: [js, go, rust, swift, java]
tags: [promise, async, await, concurrency]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#asyncawait"
---

Node.js chạy một event loop đơn luồng: `await` nhường quyền cho event loop cho tới khi Promise hoàn tất. Mỗi ngôn ngữ dưới đây giải quyết cùng bài toán theo mô hình riêng. Đọc kỹ phần ghi chú vì **khác biệt nằm ở runtime, không chỉ ở cú pháp**.

## Chờ một tác vụ

:::tabs
```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchUser(id) {
  await sleep(100);
  return { id, name: `user-${id}` };
}

const user = await fetchUser(1); // top-level await trong ES module
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

// Không có async/await: hàm cứ block, runtime tự lên lịch goroutine khác.
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
    sleep(Duration::from_millis(100)).await; // `.await` đứng sau biểu thức
    User { id, name: format!("user-{id}") }
}

#[tokio::main] // Rust không kèm runtime async, phải chọn một (tokio)
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
        User user = fetchUser(1).join(); // join() block thread hiện tại, gần giống await
        System.out.println(user.name());
    }
}
```
:::

## Chạy song song (Promise.all)

:::tabs
```js
const users = await Promise.all([1, 2, 3].map(fetchUser));
console.log(users.length); // 3, tổng thời gian ~100ms
```
```go
import "sync"

ids := []int{1, 2, 3}
users := make([]User, len(ids))

var wg sync.WaitGroup
for i, id := range ids {
	wg.Add(1)
	go func() { // mỗi goroutine ghi vào một ô riêng, không cần lock
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

// Danh sách động: futures::future::join_all(ids.into_iter().map(fetch_user)).await
```
```swift
async let a = fetchUser(id: 1)
async let b = fetchUser(id: 2)
async let c = fetchUser(id: 3)
let users = try await [a, b, c]
print(users.count)
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

## Khác biệt cần nhớ

| | Node.js | Go | Rust | Swift | Java |
|---|---|---|---|---|---|
| Đơn vị bất đồng bộ | `Promise` | goroutine | `Future` | `Task` | `CompletableFuture` |
| Bắt đầu chạy khi | tạo Promise | gọi `go` | bị `.await`/poll | gọi `async let`/`Task` | gọi `supplyAsync` |
| Runtime | event loop có sẵn | có sẵn | tự chọn (tokio…) | có sẵn | thread pool có sẵn |
| Đa luồng thật | không (trừ worker) | có | có | có | có |

:::warning
Future của Rust là **lazy**: gọi `fetch_user(1)` mà không `.await` thì không có gì chạy cả. Ngược lại, Promise trong JavaScript bắt đầu chạy ngay khi được tạo.
:::

:::tip
Go không phân biệt hàm sync và async (không có "function coloring"). Bạn viết code tuần tự, muốn chạy song song thì thêm `go` trước lời gọi hàm.
:::
