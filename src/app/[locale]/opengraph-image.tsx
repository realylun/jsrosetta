import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { OG_SIZE, renderOgCard } from "@/app/_components/og-card";
import { routing } from "@/i18n/routing";
import { LANGUAGE_IDS } from "@/lib/languages";

type Params = { locale?: string };

// generateImageMetadata adds an id segment that generateStaticParams cannot enumerate,
// so images render on first request (then cached) instead of inheriting dynamicParams = false.
export const dynamicParams = true;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Used instead of `export const alt` so the alt text follows the page locale.
 * Next.js also calls this with empty params while collecting image ids, hence the fallback.
 */
export async function generateImageMetadata({ params }: { params: Params | Promise<Params> }) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "Site",
  });
  return [{ id: "cover", alt: t("title"), size: OG_SIZE, contentType: "image/png" }];
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Og" });
  return renderOgCard({
    eyebrow: "const you = new NodeDeveloper();",
    title: t("homeTitle"),
    languages: LANGUAGE_IDS,
  });
}
