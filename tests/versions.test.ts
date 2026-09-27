import { describe, expect, it } from "vitest";
import { getVersionInfo } from "@/lib/versions";

describe("getVersionInfo", () => {
  it("lists minimum versions in the post's language order", () => {
    const info = getVersionInfo(["js", "go", "rust"], { go: "1.22", js: "14.13.1" });
    expect(info.minimum).toEqual([
      { id: "js", label: "Node.js", version: "14.13.1" },
      { id: "go", label: "Go", version: "1.22" },
    ]);
  });

  it("lists the verified toolchain for every language in the post", () => {
    const info = getVersionInfo(["js", "go"], {});
    expect(info.minimum).toEqual([]);
    expect(info.verified).toEqual([
      { id: "js", label: "Node.js", version: "24.12.0" },
      { id: "go", label: "Go", version: "1.27.1" },
    ]);
  });
});
