import type { Element, ElementContent, Root } from "hast";
import { SKIP, visit } from "unist-util-visit";

const isElement = (node: ElementContent, tagName: string): node is Element =>
  node.type === "element" && node.tagName === tagName;

const isBlank = (cell: Element) =>
  cell.children.every((child) => child.type === "text" && child.value.trim() === "");

const childElements = (node: Element, tagName: string) =>
  node.children.filter((child): child is Element => isElement(child, tagName));

const withScope = (cell: Element, scope: "col" | "row"): Element => ({
  ...cell,
  tagName: "th",
  properties: { ...cell.properties, scope },
});

const mapRows = (section: Element, mapCells: (cells: ElementContent[]) => ElementContent[]): Element => ({
  ...section,
  children: section.children.map((row) => {
    if (isElement(row, "tr")) return { ...row, children: mapCells(row.children) };
    return row;
  }),
});

const isLabelledHeader = (cell: ElementContent): cell is Element => isElement(cell, "th") && !isBlank(cell);

const markColumnHeaders = (cells: ElementContent[]) =>
  cells.map((cell) => {
    if (isLabelledHeader(cell)) return withScope(cell, "col");
    return cell;
  });

const markRowHeader = (cells: ElementContent[]) => {
  const firstCell = cells.find((cell): cell is Element => isElement(cell, "td"));
  return cells.map((cell) => {
    const isFirstCell = firstCell !== undefined && cell === firstCell;
    if (isFirstCell) return withScope(firstCell, "row");
    return cell;
  });
};

const firstChild = (node: Element | undefined, tagName: string): Element | undefined => {
  if (node === undefined) return undefined;
  return childElements(node, tagName)[0];
};

function hasEmptyCornerCell(table: Element) {
  const headerRow = firstChild(firstChild(table, "thead"), "tr");
  const corner = firstChild(headerRow, "th");
  return corner !== undefined && isBlank(corner);
}

function withRowHeaders(table: Element): Element {
  return {
    ...table,
    children: table.children.map((section) => {
      if (isElement(section, "thead")) return mapRows(section, markColumnHeaders);
      if (isElement(section, "tbody")) return mapRows(section, markRowHeader);
      return section;
    }),
  };
}

/**
 * Comparison tables leave the top-left cell empty and label rows in the first column;
 * marking those cells as row headers gives every data cell a header for screen readers.
 */
export default function rehypeTableRowHeaders() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      const isComparisonTable = node.tagName === "table" && hasEmptyCornerCell(node);
      const canReplace = parent !== undefined && index !== undefined;
      if (!isComparisonTable || !canReplace) return;
      parent.children.splice(index, 1, withRowHeaders(node));
      return SKIP;
    });
  };
}
