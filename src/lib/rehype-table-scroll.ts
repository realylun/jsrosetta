import type { Element, Root } from "hast";
import { SKIP, visit } from "unist-util-visit";

/** Wraps each table in a scroll container so wide comparison tables don't overflow the page on mobile. */
export default function rehypeTableScroll() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-scroll"] },
        children: [node],
      };
      parent.children.splice(index, 1, wrapper);
      return [SKIP, index + 1];
    });
  };
}
