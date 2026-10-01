import { beforeAll, describe, expect, it, vi } from "vitest";

let sd: typeof import("@/lib/structured-data");

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://reallylun.com");
  vi.resetModules();
  sd = await import("@/lib/structured-data");
});

const post = {
  slug: "comments",
  title: "Comment",
  description: "Line and block comments.",
  date: "2026-09-27",
  tags: ["comments", "syntax"],
};

describe("targetLanguageList", () => {
  it("lists the target languages in registry order, without the source language", () => {
    expect(sd.targetLanguageList(["java", "js", "go", "rust"])).toBe("Go, Rust, Java");
  });

  it("is empty when the post only has the source language", () => {
    expect(sd.targetLanguageList(["js"])).toBe("");
  });
});

describe("websiteJsonLd", () => {
  it("describes the site for the given locale", () => {
    const data = sd.websiteJsonLd({ locale: "en", name: "jsrosetta", description: "Desc" });
    expect(data).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "jsrosetta",
      description: "Desc",
      url: "https://reallylun.com/en",
      inLanguage: "en",
    });
  });
});

describe("postJsonLd", () => {
  it("emits a TechArticle and a BreadcrumbList with absolute locale URLs", () => {
    const data = sd.postJsonLd({ post, locale: "vi", homeName: "jsrosetta" });
    const [article, breadcrumb] = data["@graph"];

    expect(data["@context"]).toBe("https://schema.org");
    expect(article).toMatchObject({
      "@type": "TechArticle",
      headline: "Comment",
      description: "Line and block comments.",
      url: "https://reallylun.com/posts/comments",
      mainEntityOfPage: "https://reallylun.com/posts/comments",
      image: "https://reallylun.com/vi/posts/comments/opengraph-image/cover",
      inLanguage: "vi",
      datePublished: "2026-09-27",
      dateModified: "2026-09-27",
      keywords: "comments, syntax",
    });
    expect(article.author).toEqual({
      "@type": "Person",
      name: "RealyLun",
      url: "https://github.com/realylun",
    });
    expect(article.publisher).toEqual({
      "@type": "Organization",
      name: "jsrosetta",
      url: "https://reallylun.com",
    });
    expect(breadcrumb).toEqual({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "jsrosetta", item: "https://reallylun.com/" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Comment",
          item: "https://reallylun.com/posts/comments",
        },
      ],
    });
  });

  it("uses `updated` as dateModified and prefixes non-default locales", () => {
    const data = sd.postJsonLd({
      post: { ...post, updated: "2026-09-30" },
      locale: "en",
      homeName: "jsrosetta",
    });
    const [article, breadcrumb] = data["@graph"];
    expect(article.dateModified).toBe("2026-09-30");
    expect(article.url).toBe("https://reallylun.com/en/posts/comments");
    expect(breadcrumb).toMatchObject({
      itemListElement: [{ item: "https://reallylun.com/en" }, {}],
    });
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so content cannot close the script tag", () => {
    const json = sd.serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
