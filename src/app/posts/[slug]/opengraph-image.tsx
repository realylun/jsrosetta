import { notFound } from "next/navigation";
import { OG_SIZE, renderOgCard } from "@/app/_components/og-card";
import { getAllPosts, getPostBySlug } from "@/lib/content";
import { CATEGORY_LABELS } from "@/lib/post-schema";

export const alt = "Ảnh bìa bài viết trên jsrosetta";
export const dynamicParams = false;
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  return renderOgCard({
    eyebrow: CATEGORY_LABELS[post.category],
    title: post.title,
    languages: post.languages,
  });
}
