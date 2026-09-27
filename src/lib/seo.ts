import { routing, type Locale } from "../i18n/routing";
import { localeUrl, localizePath, rssAlternate } from "./site";

type AlternatesInput = {
  /** Locale-less pathname, e.g. "/posts/variables". */
  pathname: string;
  /** Locale of the page being rendered. */
  locale: Locale;
  /** Locales in which this page exists. */
  locales: readonly Locale[];
};

/** x-default points at the default (source) locale whenever the page exists there. */
const xDefaultLocale = (locales: readonly Locale[]): Locale =>
  locales.includes(routing.defaultLocale) ? routing.defaultLocale : locales[0];

function languageMap(
  pathname: string,
  locales: readonly Locale[],
  toUrl: (locale: Locale, pathname: string) => string,
): Record<string, string> | undefined {
  // hreflang only makes sense with at least one real alternate.
  if (locales.length < 2) return undefined;
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, toUrl(locale, pathname)])),
    "x-default": toUrl(xDefaultLocale(locales), pathname),
  };
}

/** `alternates` for generateMetadata: self canonical, hreflang for existing translations, RSS. */
export function buildAlternates({ pathname, locale, locales }: AlternatesInput) {
  const languages = languageMap(pathname, locales, localizePath);
  return {
    canonical: localizePath(locale, pathname),
    ...(languages && { languages }),
    types: rssAlternate(locale),
  };
}

/**
 * One sitemap entry per existing locale, each listing the others as xhtml:link alternates.
 * `extraFor` supplies per-locale fields such as lastModified.
 */
export function buildSitemapEntries<Extra extends object>(
  pathname: string,
  locales: readonly Locale[],
  extraFor: (locale: Locale) => Extra,
) {
  const languages = languageMap(pathname, locales, localeUrl);
  return locales.map((locale) => ({
    url: localeUrl(locale, pathname),
    ...extraFor(locale),
    ...(languages && { alternates: { languages } }),
  }));
}
