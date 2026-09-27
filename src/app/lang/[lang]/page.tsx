import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/app/_components/container";
import { PostGrid } from "@/app/_components/post-grid";
import { getPostsByLanguage } from "@/lib/content";
import { LANGUAGE_IDS, LANGUAGES, SOURCE_LANGUAGE, isLanguageId } from "@/lib/languages";
import { BASE_OPEN_GRAPH, RSS_ALTERNATE, SITE } from "@/lib/site";

type Props = {
  params: Promise<{ lang: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return LANGUAGE_IDS.filter((id) => id !== SOURCE_LANGUAGE).map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLanguageId(lang)) return {};
  const label = LANGUAGES[lang].label;
  const title = `Node.js → ${label}`;
  const description = `Tất cả khái niệm Node.js/JavaScript kèm cách viết tương đương trong ${label}.`;
  return {
    title,
    description,
    alternates: { canonical: `/lang/${lang}`, types: RSS_ALTERNATE },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      type: "website",
      url: `/lang/${lang}`,
      title: `${title} · ${SITE.name}`,
      description,
    },
  };
}

export default async function LanguagePage({ params }: Props) {
  const { lang } = await params;
  if (!isLanguageId(lang)) notFound();
  const language = LANGUAGES[lang];
  const posts = getPostsByLanguage(lang);

  return (
    <main>
      <Container className="py-16">
        <h1 data-lang={lang} className="text-4xl font-bold tracking-tight">
          Node.js <span className="text-(--lang-color)">→</span> {language.label}
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          {posts.length} khái niệm có ví dụ {language.label}.
        </p>
        <div className="mt-10">
          {posts.length > 0 ? (
            <PostGrid posts={posts} lang={lang} />
          ) : (
            <p className="text-gray-500">Chưa có bài nào cho {language.label}.</p>
          )}
        </div>
      </Container>
    </main>
  );
}
