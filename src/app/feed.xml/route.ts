import { getAllPosts } from "@/lib/content";
import { buildRss } from "@/lib/rss";
import { SITE, absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const xml = buildRss(
    {
      title: SITE.title,
      description: SITE.description,
      siteUrl: SITE.url,
      feedUrl: absoluteUrl("/feed.xml"),
      language: "vi",
    },
    getAllPosts(),
  );
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
