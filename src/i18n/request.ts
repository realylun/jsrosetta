import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  // Route handlers and OG images pass the locale explicitly: root params are unavailable there.
  const candidate = explicitLocale ?? (await rootParams.locale());
  if (!hasLocale(routing.locales, candidate)) notFound();
  return {
    locale: candidate,
    // Post dates are plain YYYY-MM-DD values; UTC keeps them from shifting a day.
    timeZone: "UTC",
    messages: (await import(`../../messages/${candidate}.json`)).default,
  };
});
