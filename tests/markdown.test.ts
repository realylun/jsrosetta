import { describe, expect, it } from "vitest";
import { markdownToHtml } from "@/lib/markdown";

const tabs = [
  ":::tabs",
  "```js",
  "const a = 1;",
  "```",
  "```go",
  "a := 1",
  "```",
  "```rs",
  "let a = 1;",
  "```",
  ":::",
].join("\n");

describe("markdownToHtml", () => {
  it("renders a tab group with one accessible tab per code block", async () => {
    const html = await markdownToHtml(tabs);
    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(3);
    expect(html.match(/role="tabpanel"/g)).toHaveLength(3);
    expect(html).toContain('data-lang="rust"');
    expect(html).toContain(">Node.js</button>");
    expect(html).toContain('aria-selected="true"');
  });

  it("shows only the first panel without JavaScript", async () => {
    const html = await markdownToHtml(tabs);
    expect(html.match(/role="tabpanel"[^>]*hidden/g)).toHaveLength(2);
  });

  it("gives every tab group unique ids", async () => {
    const html = await markdownToHtml(`${tabs}\n\n${tabs}`);
    expect(html).toContain('id="Tabs-1-0-js"');
    expect(html).toContain('id="Tabs-2-0-js"');
  });

  it("highlights code at build time", async () => {
    const html = await markdownToHtml("```go\nfunc main() {}\n```");
    expect(html).toContain("data-rehype-pretty-code-figure");
    expect(html).toContain("--shiki-dark");
  });

  it("labels unknown languages with the fence name", async () => {
    const html = await markdownToHtml(":::tabs\n```bash\necho hi\n```\n:::");
    expect(html).toContain(">bash</button>");
  });

  it("rejects non-code content inside tabs", async () => {
    await expect(markdownToHtml(":::tabs\nplain text\n:::")).rejects.toThrow(
      /only contain fenced code blocks/,
    );
  });

  it("rejects empty tab groups and unknown containers", async () => {
    await expect(markdownToHtml(":::tabs\n:::")).rejects.toThrow(/at least one/);
    await expect(markdownToHtml(":::foo\nx\n:::")).rejects.toThrow(/Unknown container/);
  });

  it("renders callouts", async () => {
    const html = await markdownToHtml(":::note\nHello\n:::");
    expect(html).toContain('class="callout callout-note"');
  });

  it("keeps stray colon words as text", async () => {
    const html = await markdownToHtml("Error:thing and ::leaf[label]");
    expect(html).toContain("Error:thing");
    expect(html).toContain("::leaf[label]");
  });

  it("adds slugs and anchors to headings", async () => {
    const html = await markdownToHtml("## Hello World");
    expect(html).toContain('id="hello-world"');
    expect(html).toContain('class="heading-anchor"');
  });
});

describe("markdownToHtml hardening", () => {
  it("rejects two code blocks for the same language in one tab group", async () => {
    await expect(
      markdownToHtml(":::tabs\n```js\na\n```\n```ts\nb\n```\n:::"),
    ).rejects.toThrow(/two code blocks for "Node.js"/);
  });

  it("restores stray directives verbatim, including braces", async () => {
    const html = await markdownToHtml("Dùng a:b{c} và Map:{size}");
    expect(html).toContain("a:b{c}");
    expect(html).toContain("Map:{size}");
  });

  it("keeps non-first panels findable with hidden=until-found", async () => {
    const html = await markdownToHtml(tabs);
    expect(html.match(/hidden="until-found"/g)).toHaveLength(2);
  });

  it("rejects script URLs but allows normal links", async () => {
    await expect(markdownToHtml("[x](javascript:alert(1))")).rejects.toThrow(/Unsafe URL/);
    await expect(markdownToHtml("[x]: JavaScript:alert(1)\n\n[y][x]")).rejects.toThrow(/Unsafe URL/);
    const html = await markdownToHtml("[a](https://go.dev) [b](/posts/x) [c](#top) [d](mailto:a@b.c)");
    expect(html).toContain('href="https://go.dev"');
    expect(html).toContain('href="/posts/x"');
  });
});
