import { beforeAll, describe, expect, it, vi } from "vitest";

let robots: typeof import("@/lib/robots");

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://reallylun.com");
  robots = await import("@/lib/robots");
});

describe("robots rules", () => {
  it("allows crawling on the canonical host and points to the sitemap", () => {
    expect(robots.buildRobots("reallylun.com")).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://reallylun.com/sitemap.xml",
    });
  });

  it("blocks every crawler on the Vercel default and preview domains", () => {
    for (const host of ["jsrosetta.vercel.app", "jsrosetta-git-main-team.vercel.app"]) {
      expect(robots.buildRobots(host)).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    }
  });

  it("blocks crawling when the host is unknown", () => {
    expect(robots.buildRobots(null)).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("ignores host case", () => {
    expect(robots.buildRobots("ReallyLun.com").rules).toEqual({ userAgent: "*", allow: "/" });
  });
});
