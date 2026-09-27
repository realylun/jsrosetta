import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";

const dir = path.join(import.meta.dirname, "fixtures", "posts");
const SITE = "https://reallylun.com";

let entries: ReturnType<typeof import("@/lib/sitemap").buildSitemap>;
const lastmod = (url: string) => entries.find((entry) => entry.url === `${SITE}${url}`)?.lastModified;

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
  vi.resetModules();
  const { buildSitemap } = await import("@/lib/sitemap");
  entries = buildSitemap({ dir, includeDrafts: false });
});

describe("buildSitemap", () => {
  it("lists each page once per locale it exists in", () => {
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(`${SITE}/`);
    expect(urls).toContain(`${SITE}/en`);
    expect(urls).toContain(`${SITE}/en/lang/go`);
    expect(urls).toContain(`${SITE}/posts/alpha`);
    expect(urls).toContain(`${SITE}/en/posts/alpha`);
    expect(urls).toContain(`${SITE}/posts/beta`);
    expect(urls).not.toContain(`${SITE}/en/posts/beta`);
    expect(urls).not.toContain(`${SITE}/posts/gamma`);
  });

  it("dates translated posts by the translation", () => {
    expect(lastmod("/posts/alpha")).toBe("2026-01-01");
    expect(lastmod("/en/posts/alpha")).toBe("2026-02-01");
    expect(lastmod("/posts/beta")).toBe("2026-01-02");
  });

  it("dates list pages by the newest post of their locale", () => {
    expect(lastmod("/")).toBe("2026-01-02");
    expect(lastmod("/lang/go")).toBe("2026-01-02");
    expect(lastmod("/en")).toBe("2026-02-01");
    expect(lastmod("/en/lang/rust")).toBe("2026-02-01");
  });

  it("links alternates only for translated posts", () => {
    const beta = entries.find((entry) => entry.url === `${SITE}/posts/beta`);
    expect(beta).not.toHaveProperty("alternates");
    const alpha = entries.find((entry) => entry.url === `${SITE}/en/posts/alpha`);
    expect(alpha?.alternates?.languages).toMatchObject({ en: `${SITE}/en/posts/alpha` });
  });
});
