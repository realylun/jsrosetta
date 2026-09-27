import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getAllPosts } from "@/lib/content";
import { LANGUAGE_IDS, LANGUAGES, SOURCE_LANGUAGE } from "@/lib/languages";
import { SITE } from "@/lib/site";
import { Container } from "./container";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitcher } from "./theme-switcher";

const TARGET_LANGUAGES = LANGUAGE_IDS.filter((id) => id !== SOURCE_LANGUAGE);

const publishedSlugs = () =>
  Object.fromEntries(
    routing.locales.map((locale) => [locale, getAllPosts(locale).map((post) => post.slug)]),
  ) as Record<Locale, string[]>;

export function SiteHeader() {
  const t = useTranslations("Header");
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <Container className="flex h-14 items-center gap-4">
        <Link href="/" className="font-mono text-lg font-bold tracking-tight">
          {SITE.name}
        </Link>
        <nav aria-label={t("navLabel")} className="flex flex-1 gap-1 overflow-x-auto text-sm">
          {TARGET_LANGUAGES.map((id) => (
            <Link
              key={id}
              href={`/lang/${id}`}
              data-lang={id}
              className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              {LANGUAGES[id].label}
            </Link>
          ))}
        </nav>
        <LocaleSwitcher postSlugs={publishedSlugs()} />
        <ThemeSwitcher />
      </Container>
    </header>
  );
}
