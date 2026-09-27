import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/content";
import { LANGUAGE_IDS, SOURCE_LANGUAGE } from "@/lib/languages";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const latest = posts.map((post) => post.updated ?? post.date).toSorted().at(-1);

  return [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "weekly", priority: 1 },
    ...LANGUAGE_IDS.filter((id) => id !== SOURCE_LANGUAGE).map((lang) => ({
      url: absoluteUrl(`/lang/${lang}`),
      lastModified: latest,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/posts/${post.slug}`),
      lastModified: post.updated ?? post.date,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
