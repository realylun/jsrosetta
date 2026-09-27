import type { Post } from "@/lib/content";
import type { LanguageId } from "@/lib/languages";
import { PostCard } from "./post-card";

export function PostGrid({ posts, lang }: { posts: readonly Post[]; lang?: LanguageId }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} lang={lang} />
      ))}
    </div>
  );
}
