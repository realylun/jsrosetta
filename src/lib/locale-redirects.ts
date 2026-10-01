import { routing } from "../i18n/routing";

/** /vi/x → /x as 308s, ahead of the proxy whose own redirects are 307. */
export function defaultLocaleRedirects() {
  const prefix = `/${routing.defaultLocale}`;
  return [
    { source: prefix, destination: "/", permanent: true },
    { source: `${prefix}/:path(.*)`, destination: "/:path", permanent: true },
  ];
}
