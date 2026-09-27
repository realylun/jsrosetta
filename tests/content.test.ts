import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getAdjacentPosts,
  getAllPosts,
  getPostBySlug,
  getPostSlugs,
  getPostsByLanguage,
  parsePost,
} from "@/lib/content";

const dir = path.join(import.meta.dirname, "fixtures", "posts");

describe("content", () => {
  it("only lists .md files", () => {
    expect(getPostSlugs(dir).toSorted()).toEqual(["alpha", "beta", "gamma"]);
  });

  it("returns an empty list when the directory is missing", () => {
    expect(getPostSlugs(path.join(dir, "missing"))).toEqual([]);
  });

  it("sorts by order and hides drafts unless requested", () => {
    expect(getAllPosts({ dir, includeDrafts: false }).map((p) => p.slug)).toEqual([
      "beta",
      "alpha",
    ]);
    expect(getAllPosts({ dir, includeDrafts: true }).map((p) => p.slug)).toEqual([
      "beta",
      "alpha",
      "gamma",
    ]);
  });

  it("normalises YAML dates to ISO strings", () => {
    expect(getPostBySlug("alpha", { dir })?.date).toBe("2026-01-01");
  });

  it("returns undefined for missing, invalid or hidden draft slugs", () => {
    expect(getPostBySlug("nope", { dir })).toBeUndefined();
    expect(getPostBySlug("../secret", { dir })).toBeUndefined();
    expect(getPostBySlug("gamma", { dir, includeDrafts: false })).toBeUndefined();
    expect(getPostBySlug("gamma", { dir, includeDrafts: true })?.title).toBe("Gamma");
  });

  it("filters by language", () => {
    expect(
      getPostsByLanguage("rust", { dir, includeDrafts: false }).map((p) => p.slug),
    ).toEqual(["beta"]);
  });

  it("finds previous and next posts", () => {
    const { previous, next } = getAdjacentPosts("alpha", { dir, includeDrafts: false });
    expect(previous?.slug).toBe("beta");
    expect(next).toBeUndefined();
    expect(getAdjacentPosts("nope", { dir })).toEqual({});
  });

  it("reports invalid frontmatter with field paths", () => {
    const source = "---\ntitle: X\ncategory: nope\n---\nbody";
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
    expect(() => getPostSlugs(path.join(import.meta.dirname, "fixtures", "bad-names"))).toThrow(
      /Hello_World\.md/,
    );
  });

  it("rejects non kebab-case slugs", () => {
    expect(() => parsePost("Bad_Slug", "")).toThrow(/Invalid post slug/);
  });
});
