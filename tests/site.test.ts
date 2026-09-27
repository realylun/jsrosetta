import { afterEach, describe, expect, it, vi } from "vitest";

const load = async () => (await import("@/lib/site")) as typeof import("@/lib/site");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("site url", () => {
  it("prefers NEXT_PUBLIC_SITE_URL and trims trailing slashes", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://jsrosetta.dev/");
    const { SITE, absoluteUrl } = await load();
    expect(SITE.url).toBe("https://jsrosetta.dev");
    expect(absoluteUrl("/posts/a")).toBe("https://jsrosetta.dev/posts/a");
  });

  it("falls back to the Vercel production URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "jsrosetta.vercel.app");
    expect((await load()).SITE.url).toBe("https://jsrosetta.vercel.app");
  });

  it("uses localhost during local development", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect((await load()).SITE.url).toBe("http://localhost:3000");
  });
});

describe("site url validation", () => {
  it("rejects relative or path-based URLs", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "jsrosetta.dev");
    await expect(load()).rejects.toThrow(/absolute URL/);
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://x.dev/blog");
    await expect(load()).rejects.toThrow(/must not contain a path/);
  });
});
