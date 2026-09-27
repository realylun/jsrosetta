import type { Root, PhrasingContent } from "mdast";
import type { ContainerDirective, TextDirective, LeafDirective } from "mdast-util-directive";
import { visit, SKIP } from "unist-util-visit";
import type { VFile } from "vfile";

export const CALLOUT_TYPES = ["note", "tip", "warning"] as const;
type CalloutType = (typeof CALLOUT_TYPES)[number];

const isCallout = (name: string): name is CalloutType =>
  (CALLOUT_TYPES as readonly string[]).includes(name);

function handleContainer(node: ContainerDirective) {
  if (node.name === "tabs") {
    node.data = { hName: "div", hProperties: { className: ["code-tabs"] } };
    return;
  }
  if (isCallout(node.name)) {
    node.data = {
      hName: "aside",
      hProperties: { className: ["callout", `callout-${node.name}`] },
    };
    return;
  }
  throw new Error(
    `Unknown container directive ":::${node.name}". Supported: tabs, ${CALLOUT_TYPES.join(", ")}`,
  );
}

/**
 * remark-directive turns stray `:word` / `::word` into directives (e.g. "Error:thing" or "Map:{…}").
 * We only use container directives, so put the original source text back verbatim.
 */
function restoreAsText(node: TextDirective | LeafDirective, source: string): PhrasingContent[] {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start === undefined || end === undefined) {
    throw new Error(`Cannot restore stray directive ":${node.name}" without source positions`);
  }
  return [{ type: "text", value: source.slice(start, end) }];
}

export default function remarkDirectives() {
  return (tree: Root, file: VFile) => {
    const source = String(file.value);
    visit(tree, (node, index, parent) => {
      if (node.type === "containerDirective") {
        handleContainer(node);
        return;
      }
      if (
        (node.type === "textDirective" || node.type === "leafDirective") &&
        parent &&
        index !== undefined
      ) {
        const replacement = restoreAsText(node, source);
        const wrapped =
          node.type === "leafDirective"
            ? [{ type: "paragraph" as const, children: replacement }]
            : replacement;
        parent.children.splice(index, 1, ...(wrapped as typeof parent.children));
        return [SKIP, index + wrapped.length];
      }
    });
  };
}
