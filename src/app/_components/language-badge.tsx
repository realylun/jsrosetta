import Link from "next/link";
import { LANGUAGES, SOURCE_LANGUAGE, type LanguageId } from "@/lib/languages";

type Props = {
  id: LanguageId;
  linked?: boolean;
};

const BADGE_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-300";

export function LanguageBadge({ id, linked = false }: Props) {
  const content = (
    <>
      <span aria-hidden className="size-2 rounded-full bg-(--lang-color)" />
      {LANGUAGES[id].label}
    </>
  );
  // The source language has no index page: every post is written from Node.js.
  if (!linked || id === SOURCE_LANGUAGE) {
    return (
      <span data-lang={id} className={BADGE_CLASS}>
        {content}
      </span>
    );
  }
  return (
    <Link
      data-lang={id}
      href={`/lang/${id}`}
      className={`${BADGE_CLASS} hover:border-gray-400 dark:hover:border-gray-500`}
    >
      {content}
    </Link>
  );
}

export function LanguageList({ ids, linked }: { ids: readonly LanguageId[]; linked?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Ngôn ngữ trong bài">
      {ids.map((id) => (
        <li key={id}>
          <LanguageBadge id={id} linked={linked} />
        </li>
      ))}
    </ul>
  );
}
