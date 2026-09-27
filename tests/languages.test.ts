import { describe, expect, it } from "vitest";
import { LANGUAGES, isLanguageId, resolveLanguage } from "@/lib/languages";

describe("languages", () => {
  it("resolves fence aliases to registered languages", () => {
    expect(resolveLanguage("rs")?.id).toBe("rust");
    expect(resolveLanguage("TypeScript")?.id).toBe("js");
    expect(resolveLanguage("golang")?.label).toBe("Go");
  });

  it("returns undefined for unknown or missing fences", () => {
    expect(resolveLanguage("cobol")).toBeUndefined();
    expect(resolveLanguage("kt")).toBeUndefined();
    expect(resolveLanguage(undefined)).toBeUndefined();
  });

  it("guards language ids", () => {
    expect(isLanguageId("swift")).toBe(true);
    expect(isLanguageId("python")).toBe(false);
  });

  it("records the exact toolchain every language's code was verified on", () => {
    for (const language of Object.values(LANGUAGES)) {
      expect(language.verifiedOn, language.id).toMatch(/^\d+\.\d+\.\d+(\.\d+)?$/);
    }
  });
});
