import { useLocale, useTranslations } from "next-intl";
import { SITE, localizePath } from "@/lib/site";
import { Container } from "./container";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const locale = useLocale();
  return (
    <footer className="mt-24 border-t border-gray-200 py-10 text-sm text-gray-500 dark:text-gray-400 dark:border-gray-800">
      <Container className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <p>
          {t("license")}{" "}
          <a
            className="underline hover:text-gray-900 dark:hover:text-gray-100"
            href="https://github.com/miguelmota/golang-for-nodejs-developers"
          >
            golang-for-nodejs-developers
          </a>
        </p>
        <p className="flex gap-4">
          <a className="hover:text-gray-900 dark:hover:text-gray-100" href={localizePath(locale, "/feed.xml")}>
            RSS
          </a>
          {SITE.repo && (
            <a className="hover:text-gray-900 dark:hover:text-gray-100" href={SITE.repo}>
              GitHub
            </a>
          )}
        </p>
      </Container>
    </footer>
  );
}
