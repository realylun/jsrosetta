import type { MetadataRoute } from "next";
import { buildSitemap } from "@/lib/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap();
}
