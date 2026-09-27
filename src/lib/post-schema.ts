import { z } from "zod";
import { LANGUAGE_IDS } from "./languages";

export const CATEGORIES = [
  "basics",
  "types",
  "control-flow",
  "collections",
  "functions",
  "oop",
  "async",
  "errors",
  "io",
  "stdlib",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** YAML turns unquoted dates into Date objects; normalise both forms to a real YYYY-MM-DD. */
const isoDate = z
  .union([z.string(), z.date()])
  .transform((value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value))
  .pipe(z.iso.date({ error: "must be a real calendar date (YYYY-MM-DD)" }));

export const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: isoDate,
  updated: isoDate.optional(),
  order: z.number().int().nonnegative(),
  category: z.enum(CATEGORIES),
  languages: z.array(z.enum(LANGUAGE_IDS)).min(1),
  versions: z.record(z.string(), z.string()).default({}),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  credits: z.url({ protocol: /^https?$/ }).optional(),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

/**
 * Frontmatter of a translated post (content/posts/<locale>/<slug>.md).
 * Only reader-facing text is translated; order, category, languages, dates and credits
 * come from the source post, so anything else is rejected to keep a single source of truth.
 */
export const translationSchema = z.strictObject({
  title: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string()).optional(),
  updated: isoDate.optional(),
});

export type TranslationFrontmatter = z.infer<typeof translationSchema>;
