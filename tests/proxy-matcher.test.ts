import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Next.js needs `config.matcher` as a literal in src/proxy.ts, so the test reads it from source.
const source = fs.readFileSync(path.join(import.meta.dirname, "..", "src", "proxy.ts"), "utf8");
const matchers = [...source.matchAll(/^\s+"(\/[^"]*)",?$/gm)].map(([, raw]) =>
  JSON.parse(`"${raw}"`),
);
const regexes = matchers.map((matcher: string) => new RegExp(`^${matcher}$`));
const runsProxy = (pathname: string) => regexes.some((regex) => regex.test(pathname));

describe("proxy matcher", () => {
  it("was found in src/proxy.ts", () => {
    expect(matchers).toHaveLength(4);
  });

  it("runs on pages and every feed URL", () => {
    for (const pathname of [
      "/",
      "/en",
      "/vi",
      "/posts/variables",
      "/en/posts/variables",
      "/vi/posts/variables",
      "/feed.xml",
      "/vi/feed.xml",
      "/en/feed.xml",
    ]) {
      expect(runsProxy(pathname), pathname).toBe(true);
    }
  });

  it("skips internals and static files such as the OG image", () => {
    for (const pathname of [
      "/og-cat.png",
      "/_next/static/chunk.js",
      "/api/x",
      "/sitemap.xml",
      "/favicon.ico",
    ]) {
      expect(runsProxy(pathname), pathname).toBe(false);
    }
  });
});
