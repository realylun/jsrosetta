import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // The first pattern skips dotted paths, so the RSS feeds are listed explicitly
  // (/vi/feed.xml too, so the proxy redirects it to the canonical /feed.xml).
  // OG image routes are generated with the internal /vi prefix; serving them untouched avoids
  // a redirect for every social crawler. Only a whole `opengraph-image` segment is skipped.
  matcher: [
    "/((?!api|_next|_vercel|(?:.*/)?opengraph-image(?:/|$)|.*\\..*).*)",
    "/feed.xml",
    "/vi/feed.xml",
    "/en/feed.xml",
  ],
};
