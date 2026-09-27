import { beforeAll, describe, expect, it, vi } from "vitest";

let seo: typeof import("@/lib/seo");

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://reallylun.com");
  vi.resetModules();
  seo = await import("@/lib/seo");
});

describe("buildAlternates", () => {
  it("emits vi, en and x-default (-> vi) when both locales exist", () => {
    const alternates = seo.buildAlternates({
      pathname: "/posts/variables",
      locale: "en",
      locales: ["vi", "en"],
    });
    expect(alternates.canonical).toBe("/en/posts/variables");
    expect(alternates.languages).toEqual({
      vi: "/posts/variables",
      en: "/en/posts/variables",
      "x-default": "/posts/variables",
    });
    expect(alternates.types["application/rss+xml"][0].url).toBe("/en/feed.xml");
  });

  it("keeps a self canonical and no hreflang for a single locale", () => {
    const alternates = seo.buildAlternates({
      pathname: "/posts/draft",
      locale: "vi",
      locales: ["vi"],
    });
    expect(alternates.canonical).toBe("/posts/draft");
    expect(alternates).not.toHaveProperty("languages");
  });

  it("maps the home page to / and /en", () => {
    const { canonical, languages } = seo.buildAlternates({
      pathname: "/",
      locale: "vi",
      locales: ["vi", "en"],
    });
    expect(canonical).toBe("/");
    expect(languages).toEqual({ vi: "/", en: "/en", "x-default": "/" });
  });

  it("falls back to the first locale for x-default without a source locale", () => {
    const { languages } = seo.buildAlternates({
      pathname: "/x",
      locale: "en",
      locales: ["en", "en"],
    });
    expect(languages?.["x-default"]).toBe("/en/x");
  });
});

describe("buildSitemapEntries", () => {
  it("creates one absolute entry per locale with xhtml alternates", () => {
    const entries = seo.buildSitemapEntries("/lang/go", ["vi", "en"], { priority: 0.7 });
    const languages = {
      vi: "https://reallylun.com/lang/go",
      en: "https://reallylun.com/en/lang/go",
      "x-default": "https://reallylun.com/lang/go",
    };
    expect(entries).toEqual([
      { url: "https://reallylun.com/lang/go", priority: 0.7, alternates: { languages } },
      { url: "https://reallylun.com/en/lang/go", priority: 0.7, alternates: { languages } },
    ]);
  });

  it("omits alternates for untranslated pages", () => {
    expect(seo.buildSitemapEntries("/posts/a", ["vi"], {})).toEqual([
      { url: "https://reallylun.com/posts/a" },
    ]);
  });
});
