import type { Element, ElementContent, Root } from "hast";
import { h } from "hastscript";
import { visit } from "unist-util-visit";
import { HIDDEN_PANEL } from "./code-tabs-dom";
import { resolveLanguage } from "./languages";

type Panel = { lang: string; label: string; content: Element };

/** rehype-slug lowercases heading ids, so an uppercase prefix never collides with an anchor. */
const ID_PREFIX = "Tabs-";

function assertUniqueLanguages(panels: readonly Panel[]) {
  const seen = new Set<string>();
  for (const panel of panels) {
    if (seen.has(panel.lang)) {
      throw new Error(
        `:::tabs has two code blocks for "${panel.label}". Split them into separate tab groups.`,
      );
    }
    seen.add(panel.lang);
  }
}

const hasClass = (node: Element, name: string) => {
  const className = node.properties?.className;
  return Array.isArray(className) && className.includes(name);
};

const isWhitespace = (node: ElementContent) =>
  node.type === "text" && node.value.trim() === "";

function findPre(node: Element): Element | undefined {
  if (node.tagName === "pre") return node;
  return node.children.find(
    (child): child is Element => child.type === "element" && child.tagName === "pre",
  );
}

function toPanel(node: ElementContent): Panel {
  const pre = node.type === "element" ? findPre(node) : undefined;
  if (!pre || node.type !== "element") {
    throw new Error(":::tabs may only contain fenced code blocks");
  }
  // rehype-pretty-code writes the raw "data-language" key rather than hast's camelCase form
  const fence = String(
    pre.properties?.["data-language"] ?? pre.properties?.dataLanguage ?? "",
  );
  const language = resolveLanguage(fence);
  return {
    lang: language?.id ?? (fence || "text"),
    label: language?.label ?? (fence || "Text"),
    content: node,
  };
}

function buildTabs(panels: readonly Panel[], groupId: string): Element {
  const idFor = (panel: Panel, index: number) => `${groupId}-${index}-${panel.lang}`;

  const tabs = panels.map((panel, index) =>
    h(
      "button",
      {
        type: "button",
        role: "tab",
        id: idFor(panel, index),
        ariaControls: `${idFor(panel, index)}-panel`,
        ariaSelected: index === 0 ? "true" : "false",
        tabIndex: index === 0 ? 0 : -1,
        dataLang: panel.lang,
        className: ["code-tabs__tab"],
      },
      panel.label,
    ),
  );

  const bodies = panels.map((panel, index) =>
    h(
      "div",
      {
        role: "tabpanel",
        id: `${idFor(panel, index)}-panel`,
        ariaLabelledBy: idFor(panel, index),
        dataLang: panel.lang,
        className: ["code-tabs__panel"],
        ...(index === 0 ? {} : { hidden: HIDDEN_PANEL }),
      },
      [panel.content],
    ),
  );

  return h("div", { className: ["code-tabs"], dataCodeTabs: "" }, [
    h("div", { role: "tablist", ariaLabel: "Ngôn ngữ", className: ["code-tabs__list"] }, tabs),
    ...bodies,
  ]);
}

/** Turn `div.code-tabs` (from `:::tabs`) into an accessible tab group, one tab per code block. */
export default function rehypeCodeTabs() {
  return (tree: Root) => {
    let groupIndex = 0;
    visit(tree, "element", (node, index, parent) => {
      if (!parent || index === undefined) return;
      if (node.tagName !== "div" || !hasClass(node, "code-tabs")) return;
      if ("dataCodeTabs" in (node.properties ?? {})) return;

      const panels = node.children.filter((child) => !isWhitespace(child)).map(toPanel);
      if (panels.length === 0) throw new Error(":::tabs must contain at least one code block");
      assertUniqueLanguages(panels);

      groupIndex += 1;
      parent.children[index] = buildTabs(panels, `${ID_PREFIX}${groupIndex}`);
    });
  };
}
