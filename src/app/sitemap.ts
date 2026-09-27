import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllPosts, getTranslationLocales } from "@/lib/content";
import { LANGUAGE_IDS, SOURCE_LANGUAGE } from "@/lib/languages";
import { buildSitemapEntries } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts(routing.defaultLocale);
  const latest = posts.map((post) => post.updated ?? post.date).toSorted().at(-1);

  return [
    ...buildSitemapEntries("/", routing.locales, {
      lastModified: latest,
      changeFrequency: "weekly" as const,
      priority: 1,
    }),
    ...LANGUAGE_IDS.filter((id) => id !== SOURCE_LANGUAGE).flatMap((lang) =>
      buildSitemapEntries(`/lang/${lang}`, routing.locales, {
        lastModified: latest,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }),
    ),
    // Untranslated posts only get their source-locale entry.
    ...posts.flatMap((post) =>
      buildSitemapEntries(`/posts/${post.slug}`, getTranslationLocales(post.slug), {
        lastModified: post.updated ?? post.date,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }),
    ),
  ];
}
