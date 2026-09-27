# jsrosetta — Kế hoạch triển khai

> Blog so sánh cú pháp từ **Node.js/JavaScript** sang **Go, Rust, Swift, Kotlin, Java** (mở rộng sau: C#, Python, Zig…).
> Nội dung lưu bằng Markdown trong repo · Next.js mới nhất · Deploy Vercel · Domain quản lý ở Cloudflare.

- **Tên repo / site:** `jsrosetta` → `jsrosetta.dev` (cần kiểm tra lại trên Cloudflare Registrar trước khi mua)
- **Template gốc:** [vercel/next.js › examples/blog-starter](https://github.com/vercel/next.js/tree/canary/examples/blog-starter)
- **Nguồn cảm hứng nội dung:** [miguelmota/golang-for-nodejs-developers](https://github.com/miguelmota/golang-for-nodejs-developers) (MIT, © 2016 Miguel Mota), có bản local ở `../golang-for-nodejs-developers`
- **Ngày lập:** 2026-09-27

---

## 0. Trạng thái (2026-09-27)

- ✅ Phase 0–3, 5 xong: scaffold, tầng nội dung, giao diện, SEO, test (39 test, coverage ~97%), CI
- ✅ 3 bài mẫu (variables, async-await, errors). Code Go/Rust/Swift/Java đã compile + chạy thử; Kotlin chưa (máy chưa có `kotlinc`)
- ⏳ Phase 6 (deploy) chưa làm: cần tạo repo GitHub, project Vercel, mua domain

## 1. Quyết định đã chốt

| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Framework | Next.js **16.3.x** (App Router, TypeScript) | Bản mới nhất; `create-next-app --example blog-starter` hiện cài `next@16.3.6` |
| Bundler | Turbopack (mặc định từ Next 16) | Bỏ flag `--turbopack` thừa trong script `dev` |
| Styling | **Tailwind v4** (`@tailwindcss/postcss`) + `@tailwindcss/typography` | Template vẫn dùng v3 → nâng cấp |
| Ngôn ngữ bài viết | Tiếng Việt (`lang="vi"`) | Mặc định; có thể thêm i18n sau |
| Định dạng bài | **`.md` thuần + directive `:::tabs`** (remark-directive) | Giữ markdown portable, không cần MDX |
| Pipeline | `remark-parse → remark-gfm → remark-directive → remark-rehype → rehype-pretty-code (Shiki) → rehype-slug → rehype-stringify` | Highlight lúc build, client không tải JS highlight; tránh giới hạn plugin của `@next/mdx` + Turbopack |
| Frontmatter | `gray-matter` + validate bằng **zod** | Build fail sớm khi frontmatter sai |
| Kiến trúc nội dung | **1 bài = 1 concept**, Node.js là cột gốc, mỗi ngôn ngữ đích là 1 tab | Theo mô hình programming-idioms / hyperpolyglot |
| Render | Static (SSG) toàn bộ qua `generateStaticParams` | Blog thuần nội dung |
| Deploy | Vercel (Git integration) | |
| DNS | Cloudflare, record **DNS-only (mây xám)** | Vercel khuyến nghị không đặt proxy trước Vercel |

## 2. Cấu trúc thư mục dự kiến

```
jsrosetta/
├── content/
│   └── posts/
│       ├── variables.md
│       ├── async-await.md
│       └── errors.md
├── public/
│   └── favicon/…
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # trang chủ: concept nhóm theo category
│   │   ├── posts/[slug]/
│   │   │   ├── page.tsx                # trang concept + code tabs
│   │   │   └── opengraph-image.tsx     # OG image động (ImageResponse)
│   │   ├── lang/[lang]/page.tsx        # mọi concept của 1 ngôn ngữ
│   │   ├── feed.xml/route.ts           # RSS
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── globals.css
│   │   └── _components/
│   │       ├── header.tsx / footer.tsx / container.tsx
│   │       ├── post-card.tsx / post-header.tsx / post-body.tsx
│   │       ├── language-badge.tsx
│   │       ├── code-tabs-enhancer.tsx  # client: đồng bộ tab + localStorage
│   │       └── theme-switcher.tsx      # giữ từ template
│   └── lib/
│       ├── languages.ts                # registry: id, label, shiki lang, màu
│       ├── content.ts                  # đọc + validate bài (thay api.ts)
│       ├── post-schema.ts              # zod schema frontmatter
│       ├── markdown.ts                 # unified pipeline (thay markdownToHtml.ts)
│       ├── rehype-code-tabs.ts         # plugin gom code block thành tabs
│       └── site.ts                     # tên site, URL, mô tả
├── tests/                              # vitest
├── .github/workflows/ci.yml
├── LICENSE                             # MIT (code)
├── LICENSE-CONTENT                     # CC BY 4.0 (bài viết)
├── NOTICE                              # credit miguelmota
├── PLAN.md
└── README.md
```

Xoá khỏi template: `_posts/` demo, ảnh cover/author, `alert`, `avatar`, `cover-image`, `hero-post`, `more-stories`, `post-preview`, `intro`, `section-separator`, `interfaces/author.ts`, `tailwind.config.ts`.

## 3. Schema frontmatter

```yaml
---
title: "Async/Await"
description: "Promise và async/await trong Node.js so với goroutine, Future, coroutine…"
date: "2026-09-27"
updated: "2026-09-27"        # tuỳ chọn
order: 30                    # thứ tự concept trên trang chủ
category: async              # basics | types | control-flow | collections | functions | oop | async | errors | io | stdlib
languages: [js, go, rust, swift, kotlin, java]
versions:                    # tuỳ chọn, phiên bản đã thử code
  go: "1.25"
  rust: "1.90"
tags: [promise, concurrency]
draft: false
credits: "https://github.com/miguelmota/golang-for-nodejs-developers#asyncawait"  # tuỳ chọn
---
```

`slug` lấy theo tên file. Chỉ đọc file đuôi `.md` (template gốc dùng `readdirSync` không lọc → dễ vỡ build). Bài `draft: true` bị ẩn khi build production.

## 4. Cú pháp tabs trong bài

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

- Plugin `rehype-code-tabs` chạy **sau** rehype-pretty-code: gom các `figure` trong `div.code-tabs`, đọc `data-language`, sinh thanh `button[data-lang]` + panel.
- HTML không có JS: panel đầu (Node.js) hiện, các panel khác `hidden`.
- `code-tabs-enhancer` (client): click 1 tab → **mọi nhóm trên trang** chuyển theo, lưu vào `localStorage`. Nhóm nào không có ngôn ngữ đang chọn thì giữ panel đầu.
- Hỗ trợ `?lang=rust` trên URL để chia sẻ link mở sẵn một ngôn ngữ.
- Shiki dual theme (`github-light` / `github-dark`), đổi theo class `.dark` của theme switcher.

## 5. Các phase triển khai

### Phase 0 — Khởi tạo (≈0.5 ngày)
- [x] `pnpm create next-app@latest jsrosetta --example blog-starter` → dọn file demo
- [x] `git init`, commit đầu tiên
- [x] Nâng Tailwind v3 → v4, bỏ `autoprefixer`, cập nhật `postcss.config.mjs`
- [x] Bỏ `--turbopack` trong script dev; thêm script `lint`, `typecheck`, `test`
- [x] Chạy `pnpm build` để xác nhận template chạy được với Next 16

### Phase 1 — Tầng nội dung (≈1 ngày)
- [x] `languages.ts` registry
- [x] `post-schema.ts` (zod) + `content.ts` (lọc `.md`, validate, sort theo `order`, bỏ draft)
- [x] `markdown.ts` pipeline unified + `rehype-code-tabs.ts`
- [x] Unit test (vitest): parse frontmatter hợp lệ/sai, bỏ draft, plugin tabs sinh đúng số tab + ngôn ngữ

### Phase 2 — Giao diện (≈1–1.5 ngày)
- [x] Layout, header, footer mang thương hiệu jsrosetta
- [x] Trang chủ: concept nhóm theo category, badge ngôn ngữ
- [x] Trang `/posts/[slug]`: header, prose (typography), code tabs, link bài trước/sau
- [x] Trang `/lang/[lang]`: danh sách concept có ngôn ngữ đó
- [x] `code-tabs-enhancer` + style tab (giao diện sáng/tối, mobile cuộn ngang)
- [x] Kiểm tra a11y: `role="tablist"`, `aria-selected`, điều hướng bằng phím mũi tên

### Phase 3 — SEO & phân phối (≈0.5 ngày)
- [x] `generateMetadata` cho từng bài (title, description, canonical)
- [x] `opengraph-image.tsx` động cho bài
- [x] `sitemap.ts`, `robots.ts`, `feed.xml/route.ts` (RSS)

### Phase 4 — Nội dung khởi đầu (liên tục)
- [x] 3 bài mẫu: **variables**, **async/await**, **errors & try/catch** (đủ 6 ngôn ngữ)
- [ ] Backlog ~60 concept theo mục lục của golang-for-nodejs-developers (comments, printing, logging, types, if/else, for, while, switch, arrays, maps, objects, functions, destructuring, spread/rest, classes, generators, datetime, timeout/interval, files, json, big numbers, promises, streams, event emitter, …)
- [ ] (Tuỳ chọn) `content/snippets/<slug>/{js,go,rs,swift,kt,java}` chạy được + CI matrix compile để code trong bài luôn đúng

### Phase 5 — Chất lượng & CI (≈0.5 ngày)
- [x] GitHub Actions: `pnpm install --frozen-lockfile` → `typecheck` → `test` → `build`
- [x] Coverage ≥ 80% cho `src/lib`
- [x] Review code (code-reviewer agent) trước khi deploy

### Phase 6 — Deploy (≈0.5 ngày)
Xem checklist ở mục 6.

## 6. Checklist deploy (Vercel + Cloudflare)

1. [ ] Tạo repo GitHub `jsrosetta` (public), push `main`
2. [ ] Vercel → **Add New Project** → import repo (framework tự nhận Next.js, build `next build`)
3. [ ] Mua / kiểm tra `jsrosetta.dev` trên Cloudflare Registrar
4. [ ] Vercel → Project → **Domains**: thêm `jsrosetta.dev` và `www.jsrosetta.dev`; chọn apex làm canonical, `www` redirect 308
5. [ ] Cloudflare DNS: tạo **A `@`** và **CNAME `www`** theo **đúng giá trị dashboard Vercel hiển thị** (có thể là record riêng theo project, không mặc định `76.76.21.21` / `cname.vercel-dns.com`)
6. [ ] Để cả hai record ở **DNS-only (mây xám)**
7. [ ] Chờ Vercel báo *Valid Configuration* + cấp chứng chỉ SSL
8. [ ] Nếu buộc phải bật proxy (mây cam):
   - SSL/TLS = **Full (strict)** (Flexible → `ERR_TOO_MANY_REDIRECTS`)
   - Không redirect HTTP→HTTPS cho `/.well-known/acme-challenge/*`
   - Không cache `/.well-known/vercel/*`
9. [ ] Kiểm tra `curl -I` với `http://` / `https://` × apex / `www` → không loop, đúng 308
10. [ ] Cập nhật `site.ts` (URL production) → sitemap/RSS/OG dùng domain thật

## 7. Giấy phép & ghi công

- Code: **MIT** (`LICENSE`)
- Bài viết: **CC BY 4.0** (`LICENSE-CONTENT`)
- `NOTICE`: ghi công miguelmota/golang-for-nodejs-developers (MIT), giữ nguyên copyright notice nếu dùng lại snippet
- **Không** copy snippet từ programming-idioms.org (CC-BY-SA, buộc nội dung dẫn xuất share-alike). Chỉ tham khảo cấu trúc, tự viết code.

## 8. Rủi ro & câu hỏi mở

| Rủi ro | Cách xử lý |
|---|---|
| `next: latest` kéo về major mới khi cài lại | Pin `next` theo version cụ thể trong `package.json` + lockfile |
| Code mẫu sai / lỗi thời | Ghi `versions` trong frontmatter; (tuỳ chọn) CI compile snippet |
| Tab không đồng bộ khi bài thiếu ngôn ngữ | Fallback về panel đầu; hiển thị "chưa có" cho ngôn ngữ thiếu |
| Cloudflare Registrar có thể không cho đổi nameserver sang Vercel | Dùng DNS-only trên Cloudflare (không cần đổi NS) |
| Domain `jsrosetta.dev` chưa chắc còn trống (chỉ mới kiểm tra NS) | Kiểm tra trên Registrar trước Phase 6 |

Câu hỏi mở:
- Có làm snippet chạy được + CI compile cho từng ngôn ngữ ngay từ đầu không?
- Ngôn ngữ viết bài: tiếng Việt, tiếng Anh, hay song ngữ (i18n route `/vi`, `/en`)?
- Có cần trang cheatsheet JS↔X tự sinh từ cùng dữ liệu không?
