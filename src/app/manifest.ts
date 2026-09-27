import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SITE } from "@/lib/site";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // The manifest is locale-agnostic, so it uses the default locale.
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "Site" });
  return {
    name: t("title"),
    short_name: SITE.name,
    description: t("description"),
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
