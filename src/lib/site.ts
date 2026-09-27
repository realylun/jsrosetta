import { routing, type Locale } from "@/i18n/routing";

const FALLBACK_URL = "http://localhost:3000";

function resolveSiteUrl(): string {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : FALLBACK_URL);
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL must be an absolute URL like https://reallylun.com (got "${candidate}")`);
  }
  if (url.pathname !== "/") {
    throw new Error(`NEXT_PUBLIC_SITE_URL must not contain a path (got "${candidate}")`);
  }
  return url.origin;
}

/** Locale-independent site facts; translated title/description live in messages/<locale>.json. */
export const SITE = {
  name: "jsrosetta",
  url: resolveSiteUrl(),
  repo: process.env.NEXT_PUBLIC_REPO_URL,
} as const;

export const OG_LOCALES: Readonly<Record<Locale, string>> = {
  vi: "vi_VN",
  en: "en_US",
};

/**
 * Next.js replaces (not merges) nested metadata objects, so every page spreads this in.
 * `available` lists the locales the page exists in; the others become og:locale:alternate.
 */
export function baseOpenGraph(locale: Locale, available: readonly Locale[] = routing.locales) {
  return {
    siteName: SITE.name,
    locale: OG_LOCALES[locale],
    alternateLocale: available.filter((other) => other !== locale).map((other) => OG_LOCALES[other]),
  };
}

export const absoluteUrl = (pathname: string) =>
  new URL(pathname, `${SITE.url}/`).toString();

/** Pathname as served for `locale`: the default locale is un-prefixed (localePrefix "as-needed"). */
export function localizePath(locale: Locale, pathname: string): string {
  if (!pathname.startsWith("/")) {
    throw new Error(`Pathname must start with "/" (got "${pathname}")`);
  }
  if (locale === routing.defaultLocale) return pathname;
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

export const localeUrl = (locale: Locale, pathname: string) =>
  absoluteUrl(localizePath(locale, pathname));

/** Each locale has its own feed: /feed.xml (vi) and /en/feed.xml. */
export const rssAlternate = (locale: Locale) => ({
  "application/rss+xml": [{ url: localizePath(locale, "/feed.xml"), title: SITE.name }],
});
