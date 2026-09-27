"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useSyncExternalStore } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const POST_PATH = /^\/posts\/([^/]+)$/;

type Props = {
  /** Published post slugs per locale, so untranslated posts are not linked. */
  postSlugs: Readonly<Record<Locale, readonly string[]>>;
};

type LinksProps = Props & {
  query?: Record<string, string>;
  hash?: string;
};

const ITEM_CLASS = "rounded px-1.5 py-0.5 font-mono text-xs uppercase";

const subscribeToHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

/** The URL fragment, read on the client only (the server never sees it). */
function useLocationHash(): string {
  return useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
    () => "",
  );
}

function LocaleLinks({ postSlugs, query, hash }: LinksProps) {
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
              href={{ pathname, query, hash: hash || undefined }}
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

/** Keeps ?lang=… and #section when switching locale. */
function LocaleLinksWithLocation(props: Props) {
  const searchParams = useSearchParams();
  const hash = useLocationHash();
  const query = searchParams.size > 0 ? Object.fromEntries(searchParams) : undefined;
  return <LocaleLinks {...props} query={query} hash={hash} />;
}

export function LocaleSwitcher(props: Props) {
  // useSearchParams would opt static pages out of prerendering without a Suspense boundary;
  // the prerendered fallback links to the bare pathname.
  return (
    <Suspense fallback={<LocaleLinks {...props} />}>
      <LocaleLinksWithLocation {...props} />
    </Suspense>
  );
}
