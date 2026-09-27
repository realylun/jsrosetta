import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { z } from "zod";
import { routing, type Locale } from "../i18n/routing";
import {
  frontmatterSchema,
  translationSchema,
  type Frontmatter,
  type TranslationFrontmatter,
} from "./post-schema";
import type { LanguageId } from "./languages";

/** content/posts/<locale>/<slug>.md — the default locale holds the full source posts. */
export const POSTS_DIR = path.join(process.cwd(), "content", "posts");

const SOURCE_LOCALE: Locale = routing.defaultLocale;
const POST_EXTENSION = ".md";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type Post = Frontmatter & {
  slug: string;
  locale: Locale;
  content: string;
};

export type ContentOptions = {
  /** Root folder containing one sub-folder per locale. */
  dir?: string;
  includeDrafts?: boolean;
};

const defaultIncludeDrafts = () => process.env.NODE_ENV !== "production";

function assertSlug(slug: string) {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(`Invalid post slug "${slug}": use kebab-case file names`);
  }
}

function parseFrontmatter<Schema extends z.ZodType>(
  schema: Schema,
  data: unknown,
  file: string,
): z.infer<Schema> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid frontmatter in "${file}":\n${issues}`);
  }
  return result.data;
}

/** Parses a source post (full frontmatter). */
export function parsePost(slug: string, source: string): Post {
  assertSlug(slug);
  const { data, content } = matter(source);
  const frontmatter = parseFrontmatter(
    frontmatterSchema,
    data,
    `${SOURCE_LOCALE}/${slug}${POST_EXTENSION}`,
  );
  return { ...frontmatter, slug, locale: SOURCE_LOCALE, content };
}

/** Parses a translation and layers it over its source post. */
export function parseTranslation(source: Post, locale: Locale, translated: string): Post {
  const { data, content } = matter(translated);
  const frontmatter: TranslationFrontmatter = parseFrontmatter(
    translationSchema,
    data,
    `${locale}/${source.slug}${POST_EXTENSION}`,
  );
  return {
    ...source,
    title: frontmatter.title,
    description: frontmatter.description,
    tags: frontmatter.tags ?? source.tags,
    updated: frontmatter.updated ?? source.updated,
    locale,
    content,
  };
}

export function getPostSlugs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const slugs = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(POST_EXTENSION))
    .map((file) => file.slice(0, -POST_EXTENSION.length));
  const invalid = slugs.filter((slug) => !SLUG_PATTERN.test(slug));
  if (invalid.length > 0) {
    throw new Error(
      `Invalid post file name(s): ${invalid.map((s) => s + POST_EXTENSION).join(", ")}. Use kebab-case.`,
    );
  }
  return slugs;
}

// `root` is only known at runtime, so bundler tracing is skipped here and the content
// folder is traced explicitly instead (outputFileTracingIncludes in next.config.ts).
const localeDir = (root: string, locale: Locale) =>
  path.join(/*turbopackIgnore: true*/ root, locale);

const postPath = (root: string, locale: Locale, slug: string) =>
  path.join(localeDir(root, locale), `${slug}${POST_EXTENSION}`);

/** Translation slugs for `locale`; fails the build when a translation has no source post. */
function getTranslationSlugs(root: string, locale: Locale): string[] {
  const slugs = getPostSlugs(localeDir(root, locale));
  const sources = new Set(getPostSlugs(localeDir(root, SOURCE_LOCALE)));
  const orphans = slugs.filter((slug) => !sources.has(slug));
  if (orphans.length > 0) {
    throw new Error(
      `Translation(s) without a source post in "${SOURCE_LOCALE}/": ${orphans
        .map((slug) => `${locale}/${slug}${POST_EXTENSION}`)
        .join(", ")}`,
    );
  }
  return slugs;
}

type LocaleIndex = {
  bySlug: ReadonlyMap<string, Post>;
  /** Every post of the locale, drafts included, in display order. */
  sorted: readonly Post[];
};

/**
 * Parsed posts per content root and locale. A build renders every page from the same files,
 * so they are read and validated once per worker instead of once per render. `next dev`
 * skips the cache so edits to content/ show up on reload.
 */
const localeIndexCache = new Map<string, LocaleIndex>();

const cacheEnabled = () => process.env.NODE_ENV !== "development";

/** Drops every cached post; content is re-read on the next call. */
export function clearContentCache() {
  localeIndexCache.clear();
}

function buildLocaleIndex(root: string, locale: Locale): LocaleIndex {
  const posts =
    locale === SOURCE_LOCALE
      ? getPostSlugs(localeDir(root, SOURCE_LOCALE)).map((slug) =>
          parsePost(slug, fs.readFileSync(postPath(root, SOURCE_LOCALE, slug), "utf8")),
        )
      : buildTranslations(root, locale);
  const sorted = posts.toSorted(comparePosts);
  return { bySlug: new Map(sorted.map((post) => [post.slug, post])), sorted };
}

function buildTranslations(root: string, locale: Locale): Post[] {
  // Validates every translation of this locale, including orphans, before any is used.
  const slugs = getTranslationSlugs(root, locale);
  const sources = loadLocaleIndex(root, SOURCE_LOCALE).bySlug;
  return slugs.flatMap((slug) => {
    const source = sources.get(slug);
    if (!source) return []; // unreachable: getTranslationSlugs rejects orphans
    return [parseTranslation(source, locale, fs.readFileSync(postPath(root, locale, slug), "utf8"))];
  });
}

function loadLocaleIndex(root: string, locale: Locale): LocaleIndex {
  if (!cacheEnabled()) return buildLocaleIndex(root, locale);
  const key = `${root}\0${locale}`;
  const cached = localeIndexCache.get(key);
  if (cached) return cached;
  const index = buildLocaleIndex(root, locale);
  localeIndexCache.set(key, index);
  return index;
}

export function getPostBySlug(
  slug: string,
  locale: Locale,
  { dir = POSTS_DIR, includeDrafts = defaultIncludeDrafts() }: ContentOptions = {},
): Post | undefined {
  if (!SLUG_PATTERN.test(slug)) return undefined;
  const post = loadLocaleIndex(dir, locale).bySlug.get(slug);
  if (!post || (post.draft && !includeDrafts)) return undefined;
  return post;
}

export function comparePosts(a: Post, b: Post): number {
  return a.order - b.order || a.title.localeCompare(b.title);
}

/** Posts available in `locale`: untranslated posts are left out of non-source locales. */
export function getAllPosts(
  locale: Locale,
  { dir = POSTS_DIR, includeDrafts = defaultIncludeDrafts() }: ContentOptions = {},
): Post[] {
  return loadLocaleIndex(dir, locale).sorted.filter((post) => includeDrafts || !post.draft);
}

export function getPostsByLanguage(
  language: LanguageId,
  locale: Locale,
  options: ContentOptions = {},
): Post[] {
  return getAllPosts(locale, options).filter((post) => post.languages.includes(language));
}

export function getAdjacentPosts(
  slug: string,
  locale: Locale,
  options: ContentOptions = {},
): { previous?: Post; next?: Post } {
  const posts = getAllPosts(locale, options);
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return {};
  return { previous: posts[index - 1], next: posts[index + 1] };
}

/** Locales in which `slug` is published, source locale first. */
export function getTranslationLocales(slug: string, options: ContentOptions = {}): Locale[] {
  return routing.locales.filter((locale) => getPostBySlug(slug, locale, options) !== undefined);
}
