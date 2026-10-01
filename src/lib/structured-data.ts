import type { Locale } from "../i18n/routing";
import type { Post } from "./content";
import { LANGUAGE_IDS, LANGUAGES, SOURCE_LANGUAGE, type LanguageId } from "./languages";
import { AUTHOR, SITE, localeUrl } from "./site";

const CONTEXT = "https://schema.org";

/** "Go, Rust, Java": the post's target languages in registry order, for titles. */
export function targetLanguageList(languages: readonly LanguageId[]): string {
  return LANGUAGE_IDS.filter((id) => id !== SOURCE_LANGUAGE && languages.includes(id))
    .map((id) => LANGUAGES[id].label)
    .join(", ");
}

type WebSiteInput = { locale: Locale; name: string; description: string };

export function websiteJsonLd({ locale, name, description }: WebSiteInput) {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    name,
    description,
    url: localeUrl(locale, "/"),
    inLanguage: locale,
  };
}

type PostInput = {
  post: Pick<Post, "slug" | "title" | "description" | "date" | "updated" | "tags">;
  locale: Locale;
  /** Breadcrumb label for the home page. */
  homeName: string;
};

/** TechArticle + BreadcrumbList for a post page. */
export function postJsonLd({ post, locale, homeName }: PostInput) {
  const url = localeUrl(locale, `/posts/${post.slug}`);
  const publisher = { "@type": "Organization", name: SITE.name, url: SITE.url };
  return {
    "@context": CONTEXT,
    "@graph": [
      {
        "@type": "TechArticle",
        headline: post.title,
        description: post.description,
        url,
        mainEntityOfPage: url,
        // Same route as the og:image, without the build hash Next.js appends.
        image: `${SITE.url}/${locale}/posts/${post.slug}/opengraph-image/cover`,
        inLanguage: locale,
        datePublished: post.date,
        dateModified: post.updated ?? post.date,
        keywords: post.tags.join(", "),
        author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
        publisher,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: homeName, item: localeUrl(locale, "/") },
          { "@type": "ListItem", position: 2, name: post.title, item: url },
        ],
      },
    ],
  };
}

/** JSON for a <script type="application/ld+json">; `<` is escaped so content cannot end the tag. */
export const serializeJsonLd = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");
