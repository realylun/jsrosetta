import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { OG_SIZE, renderOgCard } from "@/app/_components/og-card";
import { routing } from "@/i18n/routing";
import { getAllPosts, getPostBySlug } from "@/lib/content";

type Params = { locale?: string; slug?: string };

// generateImageMetadata adds an id segment that generateStaticParams cannot enumerate,
// so images render on first request (then cached); unknown posts still 404 in Image().
export const dynamicParams = true;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllPosts(locale).map((post) => ({ locale, slug: post.slug })),
  );
}

/**
 * Used instead of `export const alt` so the alt text follows the page locale.
 * Next.js also calls this with empty params while collecting image ids, hence the fallback.
 */
export async function generateImageMetadata({ params }: { params: Params | Promise<Params> }) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "Og",
  });
  return [{ id: "cover", alt: t("postAlt"), size: OG_SIZE, contentType: "image/png" }];
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { locale, slug = "" } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const post = getPostBySlug(slug, locale);
  if (!post) notFound();
  const t = await getTranslations({ locale, namespace: "Categories" });
  return renderOgCard({
    eyebrow: t(post.category),
    title: post.title,
    languages: post.languages,
  });
}
