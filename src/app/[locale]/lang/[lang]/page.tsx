import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/app/_components/container";
import { PostGrid } from "@/app/_components/post-grid";
import { routing } from "@/i18n/routing";
import { getPostsByLanguage } from "@/lib/content";
import { LANGUAGE_IDS, LANGUAGES, SOURCE_LANGUAGE, isTargetLanguageId } from "@/lib/languages";
import { buildAlternates } from "@/lib/seo";
import { SITE, baseOpenGraph, localizePath } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string; lang: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return LANGUAGE_IDS.filter((id) => id !== SOURCE_LANGUAGE).map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lang } = await params;
  if (!hasLocale(routing.locales, locale) || !isTargetLanguageId(lang)) return {};
  const t = await getTranslations({ locale, namespace: "Lang" });
  const label = LANGUAGES[lang].label;
  const title = t("title", { label });
  const description = t("description", { label });
  const pathname = `/lang/${lang}`;
  return {
    title,
    description,
    alternates: buildAlternates({ pathname, locale, locales: routing.locales }),
    openGraph: {
      ...baseOpenGraph(locale),
      type: "website",
      url: localizePath(locale, pathname),
      title: `${title} · ${SITE.name}`,
      description,
    },
  };
}

export default async function LanguagePage({ params }: Props) {
  const { locale, lang } = await params;
  if (!hasLocale(routing.locales, locale) || !isTargetLanguageId(lang)) notFound();
  const t = await getTranslations("Lang");
  const language = LANGUAGES[lang];
  const posts = getPostsByLanguage(lang, locale);

  return (
    <main>
      <Container className="py-16">
        <h1 data-lang={lang} className="text-4xl font-bold tracking-tight">
          Node.js <span className="text-(--lang-color)">→</span> {language.label}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-gray-600 dark:text-gray-400">{t(`intro.${lang}`)}</p>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {t("count", { count: posts.length, label: language.label })}
        </p>
        <div className="mt-10">
          {posts.length > 0 ? (
            <PostGrid posts={posts} lang={lang} />
          ) : (
            <p className="text-gray-500 dark:text-gray-400">{t("empty", { label: language.label })}</p>
          )}
        </div>
      </Container>
    </main>
  );
}
