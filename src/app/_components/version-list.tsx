import { useTranslations } from "next-intl";
import { SOURCE_LANGUAGE, type LanguageId } from "@/lib/languages";
import type { Frontmatter } from "@/lib/post-schema";
import { getVersionInfo, type VersionEntry } from "@/lib/versions";

type Props = {
  languages: readonly LanguageId[];
  versions: Frontmatter["versions"];
};

function Entries({ entries, prefix }: { entries: VersionEntry[]; prefix: string }) {
  return entries.map((entry, index) => (
    <span key={entry.id} data-lang={entry.id}>
      {index > 0 && <span aria-hidden> · </span>}
      {entry.label} {prefix}
      {entry.version}
    </span>
  ));
}

/** Minimum language versions for the post's code and the toolchains it was verified on. */
export function VersionList({ languages, versions }: Props) {
  const t = useTranslations("Post");
  const { minimum, verified } = getVersionInfo(languages, versions);
  return (
    <>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-gray-500">
        {minimum.length > 0 && (
          <>
            <dt>{t("minVersions")}</dt>
            <dd>
              <Entries entries={minimum} prefix="≥ " />
            </dd>
          </>
        )}
        <dt>{t("verifiedOn")}</dt>
        <dd>
          <Entries entries={verified} prefix="" />
        </dd>
      </dl>
      {languages.includes(SOURCE_LANGUAGE) && (
        <p className="mt-1 text-xs text-gray-500">{t("esmNote")}</p>
      )}
    </>
  );
}
