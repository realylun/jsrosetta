import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

import "./globals.css";

/** Rendered for URLs that match no route (outside the [locale] root layout). */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "NotFound" });
  return { title: t("title") };
}

export default async function GlobalNotFound() {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "NotFound" });
  return (
    <html lang={routing.defaultLocale}>
      <body className="bg-white font-sans text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <main className="mx-auto w-full max-w-5xl px-4 py-24 text-center sm:px-6">
          <p className="font-mono text-sm text-gray-500">throw new NotFoundError()</p>
          <h1 className="mt-3 text-3xl font-bold">{t("title")}</h1>
          <a href="/" className="mt-6 inline-block underline">
            {t("backHome")}
          </a>
        </main>
      </body>
    </html>
  );
}
