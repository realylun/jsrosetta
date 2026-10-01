import { afterEach, describe, expect, it, vi } from "vitest";

const load = async () => (await import("@/lib/site")) as typeof import("@/lib/site");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("site url", () => {
  it("prefers NEXT_PUBLIC_SITE_URL and trims trailing slashes", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://reallylun.com/");
    const { SITE, absoluteUrl } = await load();
    expect(SITE.url).toBe("https://reallylun.com");
    expect(absoluteUrl("/posts/a")).toBe("https://reallylun.com/posts/a");
  });

  it("falls back to the Vercel production URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "jsrosetta.vercel.app");
    expect((await load()).SITE.url).toBe("https://jsrosetta.vercel.app");
  });

  it("uses localhost during local development", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect((await load()).SITE.url).toBe("http://localhost:3000");
  });
});

describe("site url validation", () => {
  it("rejects relative or path-based URLs", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "reallylun.com");
    await expect(load()).rejects.toThrow(/absolute URL/);
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://x.dev/blog");
    await expect(load()).rejects.toThrow(/must not contain a path/);
  });
});

describe("locale urls", () => {
  it("leaves the default locale un-prefixed and prefixes the others", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://reallylun.com");
    const { localizePath, localeUrl } = await load();
    expect(localizePath("vi", "/")).toBe("/");
    expect(localizePath("vi", "/posts/a")).toBe("/posts/a");
    expect(localizePath("en", "/")).toBe("/en");
    expect(localizePath("en", "/posts/a")).toBe("/en/posts/a");
    expect(localeUrl("vi", "/posts/a")).toBe("https://reallylun.com/posts/a");
    expect(localeUrl("en", "/posts/a")).toBe("https://reallylun.com/en/posts/a");
  });

  it("rejects relative pathnames", async () => {
    const { localizePath } = await load();
    expect(() => localizePath("en", "posts/a")).toThrow(/must start with/);
  });

  it("points RSS discovery at the per-locale feed", async () => {
    const { rssAlternate } = await load();
    expect(rssAlternate("vi")["application/rss+xml"][0].url).toBe("/feed.xml");
    expect(rssAlternate("en")["application/rss+xml"][0].url).toBe("/en/feed.xml");
  });

  it("maps locales to Open Graph locales with the others as alternates", async () => {
    const { baseOpenGraph } = await load();
    expect(baseOpenGraph("vi")).toMatchObject({
      siteName: "jsrosetta",
      locale: "vi_VN",
      alternateLocale: ["en_US"],
    });
    expect(baseOpenGraph("en", ["vi", "en"]).alternateLocale).toEqual(["vi_VN"]);
    expect(baseOpenGraph("vi", ["vi"]).alternateLocale).toEqual([]);
  });

  it("gives every page the shared static OG image", async () => {
    const { baseOpenGraph, OG_IMAGE } = await load();
    expect(OG_IMAGE).toMatchObject({ url: "/og-cat.png", width: 2400, height: 1260, type: "image/png" });
    expect(baseOpenGraph("vi").images).toEqual([OG_IMAGE]);
    expect(baseOpenGraph("en", ["en"]).images).toEqual([OG_IMAGE]);
  });
});
