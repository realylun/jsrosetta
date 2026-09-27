import { Container } from "@/app/_components/container";
import { LanguageList } from "@/app/_components/language-badge";
import { PostGrid } from "@/app/_components/post-grid";
import { getAllPosts } from "@/lib/content";
import { LANGUAGE_IDS, SOURCE_LANGUAGE } from "@/lib/languages";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/post-schema";

const TARGET_LANGUAGES = LANGUAGE_IDS.filter((id) => id !== SOURCE_LANGUAGE);

export default function HomePage() {
  const posts = getAllPosts();
  const sections = CATEGORIES.map((category) => ({
    category,
    posts: posts.filter((post) => post.category === category),
  })).filter((section) => section.posts.length > 0);

  return (
    <main>
      <Container className="py-16">
        <section className="max-w-2xl">
          <p className="font-mono text-sm text-gray-500">const you = new NodeDeveloper();</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Viết Node.js? Đọc hiểu mọi ngôn ngữ còn lại.
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Mỗi bài là một khái niệm quen thuộc trong JavaScript, đặt cạnh cách viết tương đương
            ở các ngôn ngữ khác. Chọn một ngôn ngữ ở bất kỳ khối code nào, cả trang sẽ đổi theo.
          </p>
          <div className="mt-6">
            <LanguageList ids={TARGET_LANGUAGES} linked />
          </div>
        </section>

        {sections.length === 0 && (
          <p className="mt-16 text-gray-500">Chưa có bài viết nào.</p>
        )}

        {sections.map((section) => (
          <section key={section.category} className="mt-16">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              {CATEGORY_LABELS[section.category]}
            </h2>
            <PostGrid posts={section.posts} />
          </section>
        ))}
      </Container>
    </main>
  );
}
