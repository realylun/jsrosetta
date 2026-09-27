import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Posts are read from disk at render time (e.g. the header on on-demand 404 pages).
  outputFileTracingIncludes: { "/*": ["./content/posts/**/*.md"] },
  experimental: {
    // Unmatched or malformed URLs render outside the [locale] root layout.
    globalNotFound: true,
  },
};

export default withNextIntl(nextConfig);
