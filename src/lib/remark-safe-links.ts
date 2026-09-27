import type { Root } from "mdast";
import { visit } from "unist-util-visit";

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/** Fail the build on links such as `javascript:` so a bad PR can't ship script URLs. */
export function isSafeUrl(url: string): boolean {
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url.trim());
  return !scheme || SAFE_PROTOCOLS.has(scheme[0].toLowerCase());
}

export default function remarkSafeLinks() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if ((node.type === "link" || node.type === "image" || node.type === "definition") && !isSafeUrl(node.url)) {
        throw new Error(`Unsafe URL "${node.url}" in markdown: only http(s), mailto and relative links are allowed`);
      }
    });
  };
}
