import { EARLY_SELECT_SCRIPT } from "@/lib/code-tabs-dom";
import { CodeTabsEnhancer } from "./code-tabs-enhancer";

/** Renders build-time HTML produced from trusted Markdown in the repo (content/posts). */
export function PostBody({ html }: { html: string }) {
  return (
    <>
      <div
        className="prose prose-gray max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-code:before:content-none prose-code:after:content-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {/* Runs during HTML parsing on first load; client navigations are handled by the enhancer. */}
      <script dangerouslySetInnerHTML={{ __html: EARLY_SELECT_SCRIPT }} />
      <CodeTabsEnhancer />
    </>
  );
}
