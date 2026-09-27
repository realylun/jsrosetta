import Link from "next/link";
import type { Post } from "@/lib/content";
import type { LanguageId } from "@/lib/languages";
import { LanguageList } from "./language-badge";

export function PostCard({ post, lang }: { post: Post; lang?: LanguageId }) {
  const href = lang ? `/posts/${post.slug}?lang=${lang}` : `/posts/${post.slug}`;
  return (
    <article className="group relative flex flex-col gap-3 rounded-lg border border-gray-200 p-5 transition-colors hover:border-gray-400 dark:border-gray-800 dark:hover:border-gray-600">
      <h3 className="text-lg font-semibold tracking-tight">
        <Link href={href} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{post.description}</p>
      <div className="mt-auto">
        <LanguageList ids={post.languages} />
      </div>
    </article>
  );
}
