import { routing, type Locale } from "../i18n/routing";
import { getAllPosts, type ContentOptions, type Post } from "./content";
import { LANGUAGE_IDS, SOURCE_LANGUAGE } from "./languages";
import { buildSitemapEntries } from "./seo";

const effectiveDate = (post: Post) => post.updated ?? post.date;

const latestDate = (posts: readonly Post[]) => posts.map(effectiveDate).toSorted().at(-1);

/**
 * Sitemap entries for every page in every locale it exists in. lastModified is per locale:
 * a translation carries its own `updated`, and list pages follow the posts of their locale.
 */
export function buildSitemap(options: ContentOptions = {}) {
  const postsByLocale = new Map(
    routing.locales.map((locale) => [
      locale,
      new Map(getAllPosts(locale, options).map((post) => [post.slug, post])),
    ]),
  );
  const postsIn = (locale: Locale): ReadonlyMap<string, Post> =>
    postsByLocale.get(locale) ?? new Map();

  const listPage = (pathname: string, priority: number) =>
    buildSitemapEntries(pathname, routing.locales, (locale) => ({
      lastModified: latestDate([...postsIn(locale).values()]),
      changeFrequency: "weekly" as const,
      priority,
    }));

  const postPages = (slug: string) => {
    // Untranslated posts only get their source-locale entry.
    const versions = routing.locales.flatMap((locale) => {
      const post = postsIn(locale).get(slug);
      return post ? [{ locale, lastModified: effectiveDate(post) }] : [];
    });
    const dates = new Map(versions.map(({ locale, lastModified }) => [locale, lastModified]));
    return buildSitemapEntries(
      `/posts/${slug}`,
      versions.map(({ locale }) => locale),
      (locale) => ({
        lastModified: dates.get(locale),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }),
    );
  };

  return [
    ...listPage("/", 1),
    ...LANGUAGE_IDS.filter((id) => id !== SOURCE_LANGUAGE).flatMap((lang) =>
      listPage(`/lang/${lang}`, 0.7),
    ),
    ...[...postsIn(routing.defaultLocale).keys()].flatMap(postPages),
  ];
}
