---
title: "Generator"
description: "Generator function và iterator helpers của Node.js so với Iterator (Rust), AsyncStream (Swift), virtual thread (Java) và `iter.Seq`/channel trong Go."
date: "2026-09-27"
order: 560
category: functions
languages: [js, go, rust, swift, java]
versions:
  js: "22"
  go: "1.23"
  rust: "1.58"
  swift: "5.7"
  java: "25"
tags: [generator, yield, iterator, channel, virtual-thread]
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#generators"
---

Node.js có generator function (`function*` / `yield`) built-in: gọi hàm không chạy gì cả, mỗi lần gọi `.next()` mới chạy tới `yield` tiếp theo. Không ngôn ngữ nào khác trong danh sách có `yield` thật. Rust không cần giả lập gì nhiều: `Iterator` vốn đã "pull" từng giá trị một qua `.next()`, nên `std::iter::from_fn` — một closure giữ state và trả `Option<T>` — gần như là generator viết tay. Swift dùng `AsyncStream`, thứ duy nhất trong 5 ngôn ngữ có một API tên đúng là `yield()` — nhưng khác với `from_fn` của Rust vốn lazy (chỉ chạy khi bị gọi `.next()`), closure của `AsyncStream` chạy eager ngay khi được tạo và đệm (buffer) sẵn các giá trị yield ra. Java không có gì dựng sẵn, nhưng từ bản 21 có virtual thread: chạy phần thân generator trên một virtual thread và đồng bộ qua `SynchronousQueue` để mô phỏng `yield` chặn (blocking). Go không có cú pháp generator, nhưng từ 1.23 có `iter.Seq` — kiểu "range-over-func" giúp bạn range trực tiếp qua một hàm giống hệt range qua slice hay map. Trước đó (và vẫn còn hợp lệ), cách kinh điển là dùng channel.

## Định nghĩa generator

:::tabs
```js
function* generator() {
  yield 'hello';
  yield 'world';
}
```
```go
package main

import (
	"fmt"
	"iter"
)

// Generator trả về một iter.Seq — kiểu "range-over-func" chuẩn của Go.
// Caller range trực tiếp qua nó.
func Generator() iter.Seq[string] {
	return func(yield func(string) bool) {
		for _, v := range []string{"hello", "world"} {
			if !yield(v) {
				return
			}
		}
	}
}
```
```rust
// Iterator của Rust vốn đã "pull": from_fn nhận một closure giữ state
// riêng và trả Option<T> mỗi lần gọi — gần nhất với generator viết tay.
fn generator() -> impl Iterator<Item = &'static str> {
    let mut state = 0;
    std::iter::from_fn(move || {
        state += 1;
        match state {
            1 => Some("hello"),
            2 => Some("world"),
            _ => None,
        }
    })
}
```
```swift
// AsyncStream: closure gọi yield() cho từng giá trị, finish() khi xong —
// gần nhất với `yield` thật trong 5 ngôn ngữ này.
func generator() -> AsyncStream<String> {
    AsyncStream { continuation in
        continuation.yield("hello")
        continuation.yield("world")
        continuation.finish()
    }
}
```
```java
// Chạy phần thân generator trên một virtual thread (JEP 444, Java 21);
// mỗi lần next() được gọi sẽ chặn cho tới khi thread kia gửi giá trị
// tiếp theo qua SynchronousQueue — mô phỏng `yield` chặn (blocking).
static class Generator implements Iterable<String>, Iterator<String> {
    private static final Object DONE = new Object();
    private final SynchronousQueue<Object> queue = new SynchronousQueue<>();
    private Object peeked;

    Generator() {
        Thread.ofVirtual().start(() -> {
            send("hello");
            send("world");
            send(DONE);
        });
    }

    private void send(Object value) {
        try {
            queue.put(value);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @Override
    public boolean hasNext() {
        if (peeked == null) {
            try {
                peeked = queue.take();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return peeked != DONE;
    }

    @Override
    public String next() {
        if (!hasNext()) throw new NoSuchElementException();
        String value = (String) peeked;
        peeked = null;
        return value;
    }

    @Override
    public Iterator<String> iterator() {
        return this;
    }
}
```
:::

:::note
Go 1.23 thêm `iter.Seq` và range-over-func, thay thế cách viết generator thủ công kiểu closure "next" (`func() (string, bool)`) trước đây; giờ bạn range trực tiếp qua `iter.Seq` như mọi sequence khác. `std::iter::from_fn` của Rust ổn định từ bản 1.34 — có trước cả `iter.Seq` của Go khá lâu. Virtual thread của Java (JEP 444) chỉ ổn định từ bản 21; nhờ virtual thread rẻ (không tốn một OS thread thật) mà cách "chặn trên một luồng riêng" này mới thực tế — trước Java 21, mỗi generator sẽ tốn một platform thread. Lưu ý: nếu bên tiêu thụ dừng lấy giá trị giữa chừng (không gọi hết `next()`), virtual thread bên trong sẽ bị kẹt mãi ở `queue.put()` và không bao giờ được giải phóng.
:::

## Lấy giá trị thủ công (`next()` / `done`)

:::tabs
```js
const gen = generator();

while (true) {
  const { value, done } = gen.next();
  console.log(value, done);

  if (done) {
    break;
  }
}
// hello false
// world false
// undefined true
```
```go
func main() {
	// iter.Pull chuyển một iter.Seq kiểu "push" thành cặp next/stop kiểu
	// "pull" — cách gần nhất với việc tự gọi gen.next().
	next, stop := iter.Pull(Generator())
	defer stop() // luôn gọi stop, kể cả khi sequence đã chạy hết

	for {
		v, ok := next()
		if !ok {
			break
		}
		fmt.Println(v)
	}
	// hello
	// world
}
```
```rust
fn main() {
    // Iterator vốn đã "pull": gọi .next() trực tiếp, không cần chuyển đổi
    // gì thêm (khác với Go, phải dùng iter.Pull để có next/stop).
    // (đặt tên `it` vì `gen` là từ khoá dành riêng từ edition 2024)
    let mut it = generator();

    while let Some(value) = it.next() {
        println!("{value}");
    }
    // None đóng vai trò done: true khi vòng lặp dừng
    // hello
    // world
}
```
```swift
// makeAsyncIterator() lấy iterator thủ công; next() trả nil khi hết —
// đóng vai trò done: true.
do {
    var iterator = generator().makeAsyncIterator()

    while let value = await iterator.next() {
        print(value)
    }
}
// hello
// world
```
```java
void main() {
    // hasNext()/next() chuẩn của Java: hasNext() chặn cho tới khi có giá
    // trị tiếp theo hoặc generator báo xong.
    Generator gen = new Generator();

    while (gen.hasNext()) {
        IO.println(gen.next());
    }
    // hello
    // world
}
```
:::

:::note
Iterator của Rust là "pull" ngay từ đầu, nên gọi `.next()` trực tiếp — không cần một bước chuyển đổi như `iter.Pull` của Go. `AsyncIterator.next()` của Swift và `Iterator.hasNext()`/`next()` của Java cũng pull trực tiếp, chỉ khác chỗ Swift trả `nil` còn Java tách riêng `hasNext()` để kiểm tra trước khi lấy giá trị.
:::

## Duyệt bằng for...of / iterator helpers

:::tabs
```js
for (const value of generator()) {
  console.log(value);
}
// hello
// world

// generator object cũng là iterator, nên iterator helpers biến đổi được
// trực tiếp, không cần spread ra mảng trước
for (const value of generator().map((word) => word.toUpperCase())) {
  console.log(value);
}
// HELLO
// WORLD
```
```go
// channelGenerator mô phỏng generator bằng một goroutine gửi giá trị qua
// channel, đóng lại khi xong — cách kinh điển để lấy từng giá trị một.
func channelGenerator() chan string {
	c := make(chan string)

	go func() {
		defer close(c)
		c <- "hello"
		c <- "world"
	}()

	return c
}

func main() {
	for value := range Generator() {
		fmt.Println(value)
	}
	// hello
	// world

	// cách khác: dùng channel kiểu kinh điển
	for value := range channelGenerator() {
		fmt.Println(value)
	}
	// hello
	// world
}
```
```rust
fn main() {
    for value in generator() {
        println!("{value}");
    }
    // hello
    // world

    // Iterator có sẵn .map()/.filter()/... từ bản 1.0 — lâu trước cả
    // iterator helpers của JS (Node 22) hay Go (1.23).
    for value in generator().map(|w| w.to_uppercase()) {
        println!("{value}");
    }
    // HELLO
    // WORLD
}
```
```swift
for await value in generator() {
    print(value)
}
// hello
// world

// AsyncStream tuân theo AsyncSequence nên có .map() giống Sequence thường
for await value in generator().map({ $0.uppercased() }) {
    print(value)
}
// HELLO
// WORLD
```
```java
void main() {
    for (String value : new Generator()) {
        IO.println(value);
    }
    // hello
    // world

    // Iterator/Iterable của Java không có .map() dựng sẵn: chuyển qua
    // Stream trước rồi mới biến đổi được.
    StreamSupport.stream(new Generator().spliterator(), false)
            .map(String::toUpperCase)
            .forEach(IO::println);
    // HELLO
    // WORLD
}
```
:::

Channel vẫn là một cách hợp lệ để mô hình hoá generator giữa các goroutine — nó có từ trước Go 1.23 và không bị `iter.Seq` thay thế hoàn toàn. Go cũng không có chuỗi iterator helper dựng sẵn (`.map()`, `.filter()`, …); bạn phải biến đổi giá trị ngay trong vòng lặp. Rust và Swift có: `Iterator`/`AsyncSequence` đều có `.map()` dựng sẵn từ lâu. Java thì giống Go — `Iterator` trần không có `.map()`, phải đổi sang `Stream` trước.

:::note
Node.js 22 thêm iterator helpers (`Iterator.prototype.map`, `.filter`, `.take`, …), cho phép biến đổi kết quả của generator trực tiếp, không cần spread ra mảng trước. Rust có các adaptor này trên `Iterator` từ bản 1.0 — trước JS và Go rất nhiều năm. `AsyncSequence` của Swift cũng có `.map()`/`.filter()` từ bản 5.5, cùng lúc với `AsyncStream`.
:::
