import type { MetadataRoute } from "next";
import { SITE, absoluteUrl } from "@/lib/site";

const CANONICAL_HOST = new URL(SITE.url).host;

/**
 * Only the canonical host is crawlable. Every other host serving the same deployment
 * (jsrosetta.vercel.app, preview URLs) disallows all crawlers so search engines index
 * reallylun.com alone.
 */
export function buildRobots(host: string | null): MetadataRoute.Robots {
  if (host?.toLowerCase() !== CANONICAL_HOST) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
