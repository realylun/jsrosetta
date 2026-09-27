import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getAllPosts } from "@/lib/content";
import { buildRss } from "@/lib/rss";
import { SITE, localeUrl } from "@/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: RouteContext<"/[locale]/feed.xml">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return new Response(null, { status: 404 });
  // Route handlers cannot read next/root-params, so the locale is passed explicitly.
  const t = await getTranslations({ locale, namespace: "Site" });
  const xml = buildRss(
    {
      title: t("title"),
      description: t("description"),
      siteUrl: localeUrl(locale, "/"),
      feedUrl: localeUrl(locale, "/feed.xml"),
      language: locale,
    },
    getAllPosts(locale),
    (post) => localeUrl(locale, `/posts/${post.slug}`),
  );
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
