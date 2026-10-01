import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/app/_components/container";
import { JsonLd } from "@/app/_components/json-ld";
import { LanguageList } from "@/app/_components/language-badge";
import { PostGrid } from "@/app/_components/post-grid";
import { routing } from "@/i18n/routing";
import { getAllPosts } from "@/lib/content";
import { LANGUAGE_IDS, SOURCE_LANGUAGE } from "@/lib/languages";
import { CATEGORIES } from "@/lib/post-schema";
import { buildAlternates } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { websiteJsonLd } from "@/lib/structured-data";

const TARGET_LANGUAGES = LANGUAGE_IDS.filter((id) => id !== SOURCE_LANGUAGE);

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return { alternates: buildAlternates({ pathname: "/", locale, locales: routing.locales }) };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("Home");
  const tSite = await getTranslations("Site");
  const tCategory = await getTranslations("Categories");
  const posts = getAllPosts(locale);
  const sections = CATEGORIES.map((category) => ({
    category,
    posts: posts.filter((post) => post.category === category),
  })).filter((section) => section.posts.length > 0);

  return (
    <main>
      <JsonLd
        data={websiteJsonLd({ locale, name: SITE.name, description: tSite("description") })}
      />
      <Container className="py-16">
        <section className="max-w-2xl">
          <p className="font-mono text-sm text-gray-500 dark:text-gray-400">const you = new NodeDeveloper();</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{t("heading")}</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{t("intro")}</p>
          <div className="mt-6">
            <LanguageList ids={TARGET_LANGUAGES} linked />
          </div>
        </section>

        {sections.length === 0 && <p className="mt-16 text-gray-500 dark:text-gray-400">{t("empty")}</p>}

        {sections.map((section) => (
          <section key={section.category} className="mt-16">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {tCategory(section.category)}
            </h2>
            <PostGrid posts={section.posts} />
          </section>
        ))}
      </Container>
    </main>
  );
}
