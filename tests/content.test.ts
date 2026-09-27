import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearContentCache,
  getAdjacentPosts,
  getAllPosts,
  getPostBySlug,
  getPostSlugs,
  getPostsByLanguage,
  getTranslationLocales,
  parsePost,
  parseTranslation,
} from "@/lib/content";

const fixtures = path.join(import.meta.dirname, "fixtures");
const dir = path.join(fixtures, "posts");
const published = { dir, includeDrafts: false };

describe("content (source locale)", () => {
  it("only lists .md files", () => {
    expect(getPostSlugs(path.join(dir, "vi")).toSorted()).toEqual(["alpha", "beta", "gamma"]);
  });

  it("returns an empty list when the directory is missing", () => {
    expect(getPostSlugs(path.join(dir, "missing"))).toEqual([]);
    expect(getAllPosts("vi", { dir: path.join(dir, "missing") })).toEqual([]);
  });

  it("sorts by order and hides drafts unless requested", () => {
    expect(getAllPosts("vi", published).map((p) => p.slug)).toEqual(["beta", "alpha"]);
    expect(getAllPosts("vi", { dir, includeDrafts: true }).map((p) => p.slug)).toEqual([
      "beta",
      "alpha",
      "gamma",
    ]);
  });

  it("normalises YAML dates to ISO strings", () => {
    expect(getPostBySlug("alpha", "vi", { dir })?.date).toBe("2026-01-01");
  });

  it("returns undefined for missing, invalid or hidden draft slugs", () => {
    expect(getPostBySlug("nope", "vi", { dir })).toBeUndefined();
    expect(getPostBySlug("../secret", "vi", { dir })).toBeUndefined();
    expect(getPostBySlug("gamma", "vi", published)).toBeUndefined();
    expect(getPostBySlug("gamma", "vi", { dir, includeDrafts: true })?.title).toBe("Gamma");
  });

  it("filters by language", () => {
    expect(getPostsByLanguage("rust", "vi", published).map((p) => p.slug)).toEqual(["beta"]);
  });

  it("finds previous and next posts", () => {
    const { previous, next } = getAdjacentPosts("alpha", "vi", published);
    expect(previous?.slug).toBe("beta");
    expect(next).toBeUndefined();
    expect(getAdjacentPosts("nope", "vi", { dir })).toEqual({});
  });

  it("reports invalid frontmatter with field paths", () => {
    const source = "---\ntitle: X\ncategory: nope\n---\nbody";
    expect(() => parsePost("broken", source)).toThrow(/vi\/broken\.md/);
    expect(() => parsePost("broken", source)).toThrow(/category/);
    expect(() => parsePost("broken", source)).toThrow(/description/);
  });

  it("rejects impossible dates and non-http credits", () => {
    const base = "title: X\ndescription: d\norder: 1\ncategory: basics\nlanguages: [js]";
    expect(() => parsePost("a", `---\n${base}\ndate: "2024-02-30"\n---\n`)).toThrow(/date/);
    expect(() => parsePost("a", `---\n${base}\ndate: "2024-01-01junk"\n---\n`)).toThrow(/date/);
    expect(() =>
      parsePost("a", `---\n${base}\ndate: "2024-01-01"\ncredits: "javascript:alert(1)"\n---\n`),
    ).toThrow(/credits/);
  });

  it("fails loudly on badly named post files", () => {
    expect(() => getPostSlugs(path.join(fixtures, "bad-names"))).toThrow(/Hello_World\.md/);
  });

  it("rejects non kebab-case slugs", () => {
    expect(() => parsePost("Bad_Slug", "")).toThrow(/Invalid post slug/);
  });
});

describe("content (translations)", () => {
  it("layers the translation over the source post", () => {
    const post = getPostBySlug("alpha", "en", { dir });
    expect(post).toMatchObject({
      slug: "alpha",
      locale: "en",
      title: "Alpha in English",
      description: "First post, translated",
      tags: ["english"],
      updated: "2026-02-01",
      // Structural fields always come from the source post.
      order: 2,
      category: "basics",
      languages: ["js", "go"],
      date: "2026-01-01",
    });
    expect(post?.content.trim()).toBe("Hello in English");
  });

  it("falls back to the source tags and updated date when omitted", () => {
    const source = parsePost("a", '---\ntitle: A\ndescription: d\ndate: "2026-01-01"\nupdated: "2026-01-05"\norder: 1\ncategory: basics\nlanguages: [js]\ntags: [x]\n---\n');
    const post = parseTranslation(source, "en", "---\ntitle: B\ndescription: e\n---\nbody");
    expect(post).toMatchObject({ title: "B", tags: ["x"], updated: "2026-01-05", locale: "en" });
  });

  it("leaves untranslated posts out of the translated locale", () => {
    expect(getAllPosts("en", published).map((p) => p.slug)).toEqual(["alpha"]);
    expect(getPostBySlug("beta", "en", { dir })).toBeUndefined();
    expect(getPostsByLanguage("rust", "en", published)).toEqual([]);
    expect(getAdjacentPosts("alpha", "en", published)).toEqual({
      previous: undefined,
      next: undefined,
    });
  });

  it("keeps a translated draft hidden like its source", () => {
    expect(getPostBySlug("gamma", "en", published)).toBeUndefined();
    expect(getPostBySlug("gamma", "en", { dir, includeDrafts: true })?.title).toBe(
      "Gamma in English",
    );
  });

  it("lists the locales a post is published in", () => {
    expect(getTranslationLocales("alpha", published)).toEqual(["vi", "en"]);
    expect(getTranslationLocales("beta", published)).toEqual(["vi"]);
    expect(getTranslationLocales("nope", published)).toEqual([]);
  });

  it("fails the build on a translation without a source post", () => {
    const orphan = { dir: path.join(fixtures, "orphan") };
    expect(() => getAllPosts("en", orphan)).toThrow(/en\/zeta\.md/);
    expect(() => getPostBySlug("alpha", "en", orphan)).toThrow(/without a source post/);
  });

  it("rejects structural fields in a translation", () => {
    expect(() => getAllPosts("en", { dir: path.join(fixtures, "strict") })).toThrow(
      /en\/alpha\.md[\s\S]*order/,
    );
  });
});

describe("content cache", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    clearContentCache();
  });

  it("parses each file once per content root and locale", () => {
    clearContentCache();
    const read = vi.spyOn(fs, "readFileSync");
    getAllPosts("en", published);
    const firstPass = read.mock.calls.length;
    expect(firstPass).toBeGreaterThan(0);
    getAllPosts("en", published);
    getAllPosts("vi", { dir, includeDrafts: true });
    getPostBySlug("alpha", "en", { dir });
    getTranslationLocales("beta", published);
    expect(read.mock.calls.length).toBe(firstPass);
  });

  it("keeps content roots apart", () => {
    expect(getAllPosts("en", published).map((p) => p.slug)).toEqual(["alpha"]);
    expect(() => getAllPosts("en", { dir: path.join(fixtures, "orphan") })).toThrow(/zeta/);
    expect(getAllPosts("en", published).map((p) => p.slug)).toEqual(["alpha"]);
  });

  it("re-reads content after clearContentCache and in development", () => {
    getAllPosts("vi", published);
    const read = vi.spyOn(fs, "readFileSync");
    clearContentCache();
    getAllPosts("vi", published);
    expect(read).toHaveBeenCalled();

    read.mockClear();
    vi.stubEnv("NODE_ENV", "development");
    getAllPosts("vi", published);
    getAllPosts("vi", published);
    expect(read.mock.calls.length).toBe(6);
  });
});
