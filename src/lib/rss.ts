import type { Post } from "./content";

const XML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export const escapeXml = (value: string) => value.replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]);

type Channel = {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
  language: string;
};

const toRfc822 = (isoDate: string) => new Date(isoDate).toUTCString();

/** `linkFor` returns the absolute, locale-aware URL of a post. */
export function buildRss(
  channel: Channel,
  posts: readonly Post[],
  linkFor: (post: Post) => string,
): string {
  const newestFirst = posts.toSorted((a, b) => b.date.localeCompare(a.date));
  const items = newestFirst
    .map((post) => {
      const link = linkFor(post);
      const categories = post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("");
      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${link}</link>`,
        `<guid isPermaLink="true">${link}</guid>`,
        `<description>${escapeXml(post.description)}</description>`,
        `<pubDate>${toRfc822(post.date)}</pubDate>`,
        categories,
        "</item>",
      ].join("");
    })
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(channel.title)}</title>`,
    `<link>${channel.siteUrl}</link>`,
    `<description>${escapeXml(channel.description)}</description>`,
    `<language>${channel.language}</language>`,
    `<atom:link href="${channel.feedUrl}" rel="self" type="application/rss+xml"/>`,
    newestFirst[0] ? `<lastBuildDate>${toRfc822(newestFirst[0].date)}</lastBuildDate>` : "",
    items,
    "</channel>",
    "</rss>",
  ].join("");
}
