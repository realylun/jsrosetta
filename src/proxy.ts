import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // The first pattern skips dotted paths, so the per-locale RSS feeds are listed explicitly.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)", "/feed.xml", "/en/feed.xml"],
};
