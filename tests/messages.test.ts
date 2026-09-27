import { describe, expect, it } from "vitest";
import en from "../messages/en.json";
import vi from "../messages/vi.json";

type Messages = { [key: string]: string | Messages };

function keyPaths(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : keyPaths(value, path);
  });
}

describe("messages", () => {
  it("has the same keys in every locale", () => {
    expect(keyPaths(en).toSorted()).toEqual(keyPaths(vi).toSorted());
  });

  it("has no empty strings", () => {
    const empty = (messages: Messages) =>
      keyPaths(messages).filter((path) => {
        const value = path.split(".").reduce<string | Messages>(
          (node, key) => (node as Messages)[key],
          messages,
        );
        return typeof value === "string" && value.trim() === "";
      });
    expect(empty(vi)).toEqual([]);
    expect(empty(en)).toEqual([]);
  });

  it("covers every post category", async () => {
    const { CATEGORIES } = await import("@/lib/post-schema");
    expect(Object.keys(vi.Categories).toSorted()).toEqual([...CATEGORIES].toSorted());
  });
});
