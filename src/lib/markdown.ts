import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import rehypeCodeTabs, { type CodeTabsOptions } from "./rehype-code-tabs";
import rehypeTableScroll from "./rehype-table-scroll";
import remarkDirectives from "./remark-directives";
import remarkSafeLinks from "./remark-safe-links";

const prettyCodeOptions: PrettyCodeOptions = {
  theme: { light: "github-light", dark: "github-dark" },
  keepBackground: false,
  defaultLang: "plaintext",
};

const DEFAULT_OPTIONS: CodeTabsOptions = { tablistLabel: "Languages" };

const createProcessor = (options: CodeTabsOptions) =>
  unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkDirectives)
    .use(remarkSafeLinks)
    .use(remarkRehype)
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeCodeTabs, options)
    .use(rehypeTableScroll)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: ["heading-anchor"] },
    })
    .use(rehypeStringify)
    .freeze();

// One frozen processor per label (i.e. per locale) instead of rebuilding it for every post.
const processors = new Map<string, ReturnType<typeof createProcessor>>();

function processorFor(options: CodeTabsOptions) {
  const cached = processors.get(options.tablistLabel);
  if (cached) return cached;
  const processor = createProcessor(options);
  processors.set(options.tablistLabel, processor);
  return processor;
}

export async function markdownToHtml(
  markdown: string,
  options: CodeTabsOptions = DEFAULT_OPTIONS,
): Promise<string> {
  const file = await processorFor(options).process(markdown);
  return String(file);
}
