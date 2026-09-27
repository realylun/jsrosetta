import { describe, expect, it } from "vitest";
import { parsePost } from "@/lib/content";
import { buildRss, escapeXml } from "@/lib/rss";

const post = (slug: string, date: string, title = slug) =>
  parsePost(
    slug,
    `---\ntitle: "${title}"\ndescription: d\ndate: "${date}"\norder: 1\ncategory: basics\nlanguages: [js]\ntags: [a&b]\n---\n`,
  );

const viLink = (p: { slug: string }) => `https://reallylun.com/posts/${p.slug}`;

const channel = {
  title: "T",
  description: "D",
  siteUrl: "https://reallylun.com",
  feedUrl: "https://reallylun.com/feed.xml",
  language: "vi",
};

describe("rss", () => {
  it("escapes XML special characters", () => {
    expect(escapeXml(`<a href="x">&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;");
  });

  it("lists newest posts first with absolute links", () => {
    const xml = buildRss(
      channel,
      [post("old", "2026-01-01"), post("new", "2026-02-01", "A < B")],
      viLink,
    );
    expect(xml.indexOf("/posts/new")).toBeLessThan(xml.indexOf("/posts/old"));
    expect(xml).toContain("<link>https://reallylun.com/posts/new</link>");
    expect(xml).toContain("<title>A &lt; B</title>");
    expect(xml).toContain("<category>a&amp;b</category>");
    expect(xml).toContain("<lastBuildDate>Sun, 01 Feb 2026 00:00:00 GMT</lastBuildDate>");
  });

  it("uses the locale-aware link and channel language", () => {
    const xml = buildRss(
      {
        ...channel,
        siteUrl: "https://reallylun.com/en",
        feedUrl: "https://reallylun.com/en/feed.xml",
        language: "en",
      },
      [post("variables", "2026-01-01")],
      (p) => `https://reallylun.com/en/posts/${p.slug}`,
    );
    expect(xml).toContain("<language>en</language>");
    expect(xml).toContain("<link>https://reallylun.com/en/posts/variables</link>");
    expect(xml).toContain('<guid isPermaLink="true">https://reallylun.com/en/posts/variables</guid>');
    expect(xml).toContain('<atom:link href="https://reallylun.com/en/feed.xml"');
  });

  it("builds a valid empty channel", () => {
    const xml = buildRss(channel, [], viLink);
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
    expect(xml).not.toContain("lastBuildDate");
  });
});
