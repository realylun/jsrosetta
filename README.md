# jsrosetta

Blog so sánh cú pháp **Node.js/JavaScript** với **Go, Rust, Swift, Java**. Mỗi bài là một khái niệm (biến, async/await, xử lý lỗi…), mỗi ngôn ngữ là một tab. Chọn một ngôn ngữ ở bất kỳ khối code nào thì cả trang đổi theo, và lựa chọn được nhớ cho lần sau.

Stack: Next.js 16 (App Router, static) · Tailwind CSS v4 · unified/remark/rehype · Shiki (qua rehype-pretty-code) · zod · Vitest.

## Chạy local

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm test           # unit test
pnpm test:coverage  # coverage ≥ 80% cho src/lib
pnpm typecheck
pnpm build
```

Yêu cầu Node.js ≥ 22 và pnpm 10.

## Viết bài

Tạo file `content/posts/<slug>.md`. Tên file (kebab-case) là slug.

```yaml
---
title: "Async/Await"
description: "Một câu mô tả ngắn, dùng cho SEO và thẻ bài viết."
date: "2026-09-27"
updated: "2026-10-01"          # tuỳ chọn
order: 60                      # thứ tự trên trang chủ
category: async                # basics | types | control-flow | collections | functions | oop | async | errors | io | stdlib
languages: [js, go, rust, swift, java]
tags: [promise, concurrency]   # tuỳ chọn
draft: false                   # true: chỉ hiện khi chạy dev
credits: "https://…"           # tuỳ chọn: link nguồn tham khảo
---
```

Frontmatter được validate bằng zod. Sai trường nào thì build fail và báo đúng tên trường.

### Tab ngôn ngữ

Bọc các code block liền nhau trong `:::tabs`. Tên fence quyết định nhãn tab (`js`/`ts` → Node.js, `rs` → Rust…, xem `src/lib/languages.ts`).

````md
:::tabs
```js
const name = "neko";
```
```go
name := "neko"
```
```rust
let name = "neko";
```
:::
````

Hộp ghi chú: `:::note`, `:::tip`, `:::warning`.

Link tới bài với ngôn ngữ chọn sẵn: `/posts/async-await?lang=rust`.

## Cấu trúc

```
content/posts/          bài viết (.md)
src/lib/                đọc nội dung, schema, pipeline markdown, plugin tabs, RSS
src/app/                route: /, /posts/[slug], /lang/[lang], /feed.xml, sitemap, robots, OG image
tests/                  vitest
```

## Deploy (Vercel + domain Cloudflare)

1. Push repo lên GitHub, import vào Vercel (tự nhận Next.js).
2. Đặt biến môi trường `NEXT_PUBLIC_SITE_URL=https://reallylun.com` (và tuỳ chọn `NEXT_PUBLIC_REPO_URL`).
3. Vercel → Project → Domains: thêm `reallylun.com` và `www.reallylun.com`. Chọn apex làm domain chính, `www` redirect 308.
4. Cloudflare DNS: tạo bản ghi A (`@`) và CNAME (`www`) theo **đúng giá trị Vercel hiển thị** trong trang Domains.
5. Để bản ghi ở chế độ **DNS only (mây xám)**. Nếu bắt buộc bật proxy: SSL/TLS phải là **Full (strict)**, không redirect `/.well-known/acme-challenge/*`, không cache `/.well-known/vercel/*`.
6. Kiểm tra: `curl -I http://reallylun.com`, `https://www.reallylun.com` → phải redirect về `https://reallylun.com`, không bị vòng lặp.

## License

- Code: [MIT](LICENSE)
- Nội dung bài viết: [CC BY 4.0](LICENSE-CONTENT)
- Ghi công: [NOTICE](NOTICE). Danh sách chủ đề lấy cảm hứng từ [golang-for-nodejs-developers](https://github.com/miguelmota/golang-for-nodejs-developers) của Miguel Mota (MIT).
