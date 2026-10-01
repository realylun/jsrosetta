import { routing } from "../i18n/routing";

/**
 * /vi/x → /x as 308s, ahead of the proxy whose own redirects are 307. OG images are generated
 * under the internal /vi prefix and must stay reachable there.
 */
export function defaultLocaleRedirects() {
  const prefix = `/${routing.defaultLocale}`;
  return [
    { source: prefix, destination: "/", permanent: true },
    { source: `${prefix}/:path((?!.*opengraph-image).*)`, destination: "/:path", permanent: true },
  ];
}
