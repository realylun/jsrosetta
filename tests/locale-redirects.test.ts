import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { describe, expect, it } from "vitest";
import { defaultLocaleRedirects } from "@/lib/locale-redirects";

const redirects = defaultLocaleRedirects();

/** Destination Next.js would redirect `pathname` to, or undefined when no rule matches. */
function redirectFor(pathname: string): string | undefined {
  for (const { source, destination } of redirects) {
    const params = getPathMatch(source, { strict: true })(pathname);
    if (params) return destination.replace(":path", params.path ?? "");
  }
  return undefined;
}

describe("defaultLocaleRedirects", () => {
  it("are permanent so crawlers drop the /vi URLs", () => {
    expect(redirects.every((redirect) => redirect.permanent)).toBe(true);
  });

  it("strip the default locale prefix", () => {
    expect(redirectFor("/vi")).toBe("/");
    expect(redirectFor("/vi/posts/arrays")).toBe("/posts/arrays");
    expect(redirectFor("/vi/lang/go")).toBe("/lang/go");
    expect(redirectFor("/vi/feed.xml")).toBe("/feed.xml");
  });

  it("leave OG images and other locales alone", () => {
    expect(redirectFor("/vi/posts/arrays/opengraph-image/cover")).toBeUndefined();
    expect(redirectFor("/vi/opengraph-image")).toBeUndefined();
    expect(redirectFor("/posts/arrays")).toBeUndefined();
    expect(redirectFor("/en/posts/arrays")).toBeUndefined();
    expect(redirectFor("/videos")).toBeUndefined();
  });
});
