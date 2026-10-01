import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { localizePath } from "@/lib/site";

import "./globals.css";

const notFoundMessages = () =>
  Promise.all(
    routing.locales.map(async (locale) => ({
      locale,
      t: await getTranslations({ locale, namespace: "NotFound" }),
    })),
  );

export async function generateMetadata(): Promise<Metadata> {
  const messages = await notFoundMessages();
  return { title: messages.map(({ t }) => t("title")).join(" · ") };
}

/**
 * Static 404 for every unknown URL. It renders outside the [locale] layout and cannot
 * know the requested locale, so it speaks every locale.
 */
export default async function GlobalNotFound() {
  const messages = await notFoundMessages();
  return (
    <html lang={routing.defaultLocale}>
      <body className="bg-white font-sans text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <main className="mx-auto w-full max-w-5xl px-4 py-24 text-center sm:px-6">
          <p className="font-mono text-sm text-gray-500 dark:text-gray-400">throw new NotFoundError()</p>
          {messages.map(({ locale, t }) => (
            <section key={locale} lang={locale} className="mt-8">
              <h1 className="text-3xl font-bold">{t("title")}</h1>
              <a href={localizePath(locale, "/")} className="mt-3 inline-block underline">
                {t("backHome")}
              </a>
            </section>
          ))}
        </main>
      </body>
    </html>
  );
}
