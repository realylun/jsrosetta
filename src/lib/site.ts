const FALLBACK_URL = "http://localhost:3000";

function resolveSiteUrl(): string {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : FALLBACK_URL);
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL must be an absolute URL like https://reallylun.com (got "${candidate}")`);
  }
  if (url.pathname !== "/") {
    throw new Error(`NEXT_PUBLIC_SITE_URL must not contain a path (got "${candidate}")`);
  }
  return url.origin;
}

export const SITE = {
  name: "jsrosetta",
  title: "jsrosetta — Node.js sang Go, Rust, Swift, Kotlin, Java",
  description:
    "Chuyển cú pháp Node.js/JavaScript sang Go, Rust, Swift, Kotlin và Java. Mỗi bài một khái niệm, so sánh song song từng ngôn ngữ.",
  url: resolveSiteUrl(),
  locale: "vi_VN",
  repo: process.env.NEXT_PUBLIC_REPO_URL,
} as const;

/** Next.js replaces (not merges) nested metadata objects, so every page spreads these in. */
export const BASE_OPEN_GRAPH = {
  siteName: SITE.name,
  locale: SITE.locale,
} as const;

export const RSS_ALTERNATE = {
  "application/rss+xml": [{ url: "/feed.xml", title: SITE.name }],
};

export const absoluteUrl = (pathname: string) =>
  new URL(pathname, `${SITE.url}/`).toString();
