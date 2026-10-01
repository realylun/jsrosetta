import { describe, expect, it } from "vitest";
import { markdownToHtml } from "@/lib/markdown";

const comparison = ["| | Node.js | Go |", "| - | - | - |", "| Async | Promise | goroutine |"].join("\n");

describe("rehypeTableRowHeaders", () => {
  it("turns the first cell of each body row into a row header when the corner cell is empty", async () => {
    const html = await markdownToHtml(comparison);
    expect(html).toContain('<th scope="row">Async</th>');
    expect(html).toContain("<td>Promise</td>");
    expect(html).not.toContain("<td>Async</td>");
  });

  it("marks column headers so every data cell has a header", async () => {
    const html = await markdownToHtml(comparison);
    expect(html).toContain('<th scope="col">Node.js</th>');
  });

  it("leaves tables with a labelled first column untouched", async () => {
    const html = await markdownToHtml("| Task | npm |\n| - | - |\n| Install | npm i |");
    expect(html).toContain("<td>Install</td>");
    expect(html).not.toContain("scope=");
  });

  it("keeps the cell's alignment and inline content", async () => {
    const html = await markdownToHtml("| | a |\n| :-: | - |\n| **x** | 1 |");
    expect(html).toMatch(/<th align="center" scope="row"><strong>x<\/strong><\/th>/);
  });
});
