import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { frontmatterSchema, type Frontmatter } from "./post-schema";
import type { LanguageId } from "./languages";

export const POSTS_DIR = path.join(process.cwd(), "content", "posts");

const POST_EXTENSION = ".md";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type Post = Frontmatter & {
  slug: string;
  content: string;
};

export type ContentOptions = {
  dir?: string;
  includeDrafts?: boolean;
};

const defaultIncludeDrafts = () => process.env.NODE_ENV !== "production";

export function parsePost(slug: string, source: string): Post {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(`Invalid post slug "${slug}": use kebab-case file names`);
  }
  const { data, content } = matter(source);
  const result = frontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid frontmatter in "${slug}${POST_EXTENSION}":\n${issues}`);
  }
  return { ...result.data, slug, content };
}

export function getPostSlugs(dir: string = POSTS_DIR): string[] {
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

function readPost(slug: string, dir: string): Post | undefined {
  const fullPath = path.join(dir, `${slug}${POST_EXTENSION}`);
  if (!SLUG_PATTERN.test(slug) || !fs.existsSync(fullPath)) return undefined;
  return parsePost(slug, fs.readFileSync(fullPath, "utf8"));
}

export function getPostBySlug(
  slug: string,
  { dir = POSTS_DIR, includeDrafts = defaultIncludeDrafts() }: ContentOptions = {},
): Post | undefined {
  const post = readPost(slug, dir);
  if (!post || (post.draft && !includeDrafts)) return undefined;
  return post;
}

export function comparePosts(a: Post, b: Post): number {
  return a.order - b.order || a.title.localeCompare(b.title);
}

export function getAllPosts({
  dir = POSTS_DIR,
  includeDrafts = defaultIncludeDrafts(),
}: ContentOptions = {}): Post[] {
  return getPostSlugs(dir)
    .map((slug) => readPost(slug, dir))
    .filter((post): post is Post => post !== undefined)
    .filter((post) => includeDrafts || !post.draft)
    .toSorted(comparePosts);
}

export function getPostsByLanguage(
  language: LanguageId,
  options: ContentOptions = {},
): Post[] {
  return getAllPosts(options).filter((post) => post.languages.includes(language));
}

export function getAdjacentPosts(
  slug: string,
  options: ContentOptions = {},
): { previous?: Post; next?: Post } {
  const posts = getAllPosts(options);
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return {};
  return { previous: posts[index - 1], next: posts[index + 1] };
}
