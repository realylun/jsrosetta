export const LANGUAGE_IDS = [
  "js",
  "go",
  "rust",
  "swift",
  "kotlin",
  "java",
] as const;

export type LanguageId = (typeof LANGUAGE_IDS)[number];

export type Language = {
  id: LanguageId;
  label: string;
  /** Fence names that map to this language, e.g. ```ts or ```rs */
  aliases: readonly string[];
  color: string;
};

export const SOURCE_LANGUAGE: LanguageId = "js";

export const LANGUAGES: Readonly<Record<LanguageId, Language>> = {
  js: {
    id: "js",
    label: "Node.js",
    aliases: ["js", "javascript", "ts", "typescript", "node"],
    color: "#f7df1e",
  },
  go: { id: "go", label: "Go", aliases: ["go", "golang"], color: "#00add8" },
  rust: { id: "rust", label: "Rust", aliases: ["rust", "rs"], color: "#dea584" },
  swift: { id: "swift", label: "Swift", aliases: ["swift"], color: "#f05138" },
  kotlin: {
    id: "kotlin",
    label: "Kotlin",
    aliases: ["kotlin", "kt"],
    color: "#7f52ff",
  },
  java: { id: "java", label: "Java", aliases: ["java"], color: "#b07219" },
};

export function isLanguageId(value: string): value is LanguageId {
  return (LANGUAGE_IDS as readonly string[]).includes(value);
}

/** Resolve a code fence name (```rs, ```ts…) to a registered language. */
export function resolveLanguage(fence: string | undefined): Language | undefined {
  if (!fence) return undefined;
  const name = fence.toLowerCase();
  return Object.values(LANGUAGES).find((lang) => lang.aliases.includes(name));
}
