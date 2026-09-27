// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import {
  LANG_STORAGE_KEY,
  nextTabForKey,
  readStoredLang,
  selectEverywhere,
  selectInGroup,
  storeLang,
} from "@/lib/code-tabs-dom";
import { markdownToHtml } from "@/lib/markdown";

const group = (langs: string[]) =>
  [":::tabs", ...langs.flatMap((lang) => [`\`\`\`${lang}`, "x", "```"]), ":::"].join("\n");

const tabs = (root: ParentNode, index = 0) =>
  Array.from(root.querySelectorAll("[data-code-tabs]")[index].querySelectorAll<HTMLElement>('[role="tab"]'));
const panels = (root: ParentNode, index = 0) =>
  Array.from(root.querySelectorAll("[data-code-tabs]")[index].querySelectorAll<HTMLElement>('[role="tabpanel"]'));

beforeEach(async () => {
  document.body.innerHTML = await markdownToHtml(
    `${group(["js", "go", "rust"])}\n\n${group(["js", "go"])}`,
  );
  localStorage.clear();
});

describe("code tabs DOM", () => {
  it("selects a language in one group and toggles panels", () => {
    const first = document.querySelector("[data-code-tabs]")!;
    expect(selectInGroup(first, "rust")).toBe(true);
    expect(tabs(document).map((t) => t.getAttribute("aria-selected"))).toEqual([
      "false",
      "false",
      "true",
    ]);
    expect(panels(document).map((p) => p.hidden)).toEqual([true, true, false]);
    expect(tabs(document)[2].tabIndex).toBe(0);
  });

  it("leaves groups without the language untouched", () => {
    selectEverywhere(document, "rust");
    expect(panels(document, 1).map((p) => p.hidden)).toEqual([false, true]);
    selectEverywhere(document, "go");
    expect(panels(document, 0).map((p) => p.hidden)).toEqual([true, false, true]);
    expect(panels(document, 1).map((p) => p.hidden)).toEqual([true, false]);
  });

  it("moves between tabs with arrow, Home and End keys", () => {
    const [js, go, rust] = tabs(document);
    expect(nextTabForKey(js, "ArrowRight")).toBe(go);
    expect(nextTabForKey(js, "ArrowLeft")).toBe(rust);
    expect(nextTabForKey(go, "Home")).toBe(js);
    expect(nextTabForKey(go, "End")).toBe(rust);
    expect(nextTabForKey(go, "Enter")).toBeUndefined();
    expect(nextTabForKey(document.createElement("button"), "ArrowRight")).toBeUndefined();
  });

  it("persists the chosen language", () => {
    expect(readStoredLang()).toBeNull();
    storeLang("java");
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe("java");
    expect(readStoredLang()).toBe("java");
  });
});
