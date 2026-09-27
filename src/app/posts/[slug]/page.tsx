import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/app/_components/container";
import { DateFormatter } from "@/app/_components/date-formatter";
import { LanguageList } from "@/app/_components/language-badge";
import { PostBody } from "@/app/_components/post-body";
import { getAdjacentPosts, getAllPosts, getPostBySlug, type Post } from "@/lib/content";
import { markdownToHtml } from "@/lib/markdown";
import { CATEGORY_LABELS } from "@/lib/post-schema";
import { BASE_OPEN_GRAPH, RSS_ALTERNATE } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `/posts/${post.slug}`, types: RSS_ALTERNATE },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      type: "article",
      url: `/posts/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
    },
  };
}

function AdjacentLink({ post, direction }: { post?: Post; direction: "prev" | "next" }) {
  if (!post) return <span />;
  const isNext = direction === "next";
  return (
    <Link
      href={`/posts/${post.slug}`}
      className={`flex flex-col rounded-lg border border-gray-200 p-4 hover:border-gray-400 dark:border-gray-800 dark:hover:border-gray-600 ${isNext ? "text-right" : ""}`}
    >
      <span className="text-xs text-gray-500">{isNext ? "Bài tiếp →" : "← Bài trước"}</span>
      <span className="font-medium">{post.title}</span>
    </Link>
  );
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const html = await markdownToHtml(post.content);
  const { previous, next } = getAdjacentPosts(post.slug);

  return (
    <main>
      <Container className="py-12">
        <article className="mx-auto max-w-3xl">
          <header className="mb-10 border-b border-gray-200 pb-8 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-500">{CATEGORY_LABELS[post.category]}</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">{post.title}</h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">{post.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <DateFormatter dateString={post.updated ?? post.date} />
              <LanguageList ids={post.languages} linked />
            </div>
          </header>

          <PostBody html={html} />

          {post.credits && (
            <p className="mt-12 text-sm text-gray-500">
              Tham khảo:{" "}
              <a className="underline" href={post.credits}>
                {post.credits.replace(/^https?:\/\//, "")}
              </a>
            </p>
          )}

          <nav aria-label="Điều hướng bài viết" className="mt-12 grid gap-4 sm:grid-cols-2">
            <AdjacentLink post={previous} direction="prev" />
            <AdjacentLink post={next} direction="next" />
          </nav>
        </article>
      </Container>
    </main>
  );
}
