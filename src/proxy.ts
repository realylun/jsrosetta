import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // The first pattern skips dotted paths, so the per-locale RSS feeds are listed explicitly.
  // OG image URLs are generated with the internal /vi prefix; serving them untouched avoids
  // a redirect for every social crawler.
  matcher: [
    "/((?!api|_next|_vercel|.*opengraph-image|.*\\..*).*)",
    "/feed.xml",
    "/en/feed.xml",
  ],
};
