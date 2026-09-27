"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const POST_PATH = /^\/posts\/([^/]+)$/;

type Props = {
  /** Published post slugs per locale, so untranslated posts are not linked. */
  postSlugs: Readonly<Record<Locale, readonly string[]>>;
};

const ITEM_CLASS = "rounded px-1.5 py-0.5 font-mono text-xs uppercase";

export function LocaleSwitcher({ postSlugs }: Props) {
  const t = useTranslations("LocaleSwitcher");
  const current = useLocale();
  const pathname = usePathname();
  const postSlug = POST_PATH.exec(pathname)?.[1];

  return (
    <ul aria-label={t("label")} className="flex items-center gap-1">
      {routing.locales.map((locale) => {
        const name = t(`names.${locale}`);
        if (locale === current) {
          return (
            <li key={locale}>
              <span
                aria-current="true"
                title={name}
                className={`${ITEM_CLASS} bg-gray-100 dark:bg-gray-800`}
              >
                {locale}
              </span>
            </li>
          );
        }
        if (postSlug && !postSlugs[locale].includes(postSlug)) {
          return (
            <li key={locale}>
              <span
                aria-disabled="true"
                title={`${name}: ${t("unavailable")}`}
                className={`${ITEM_CLASS} cursor-not-allowed text-gray-400 dark:text-gray-600`}
              >
                {locale}
              </span>
            </li>
          );
        }
        return (
          <li key={locale}>
            <Link
              href={pathname}
              locale={locale}
              hrefLang={locale}
              title={name}
              className={`${ITEM_CLASS} text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100`}
            >
              {locale}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
