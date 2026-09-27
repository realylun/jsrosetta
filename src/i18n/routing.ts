import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  // Vietnamese keeps the original un-prefixed URLs; English lives under /en.
  localePrefix: "as-needed",
  // `/` is always Vietnamese: no Accept-Language/cookie redirects for users or crawlers.
  localeDetection: false,
  // Some posts exist in one locale only, so hreflang is written per page in generateMetadata.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
