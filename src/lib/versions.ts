import { LANGUAGES, type LanguageId } from "./languages";
import type { Frontmatter } from "./post-schema";

export type VersionEntry = { id: LanguageId; label: string; version: string };

export type VersionInfo = {
  /** Lowest version of each language that runs the post's code, from the frontmatter. */
  minimum: VersionEntry[];
  /** Exact toolchains the code was checked on, for every language in the post. */
  verified: VersionEntry[];
};

export function getVersionInfo(
  languages: readonly LanguageId[],
  versions: Frontmatter["versions"],
): VersionInfo {
  const minimum = languages.flatMap((id) => {
    const version = versions[id];
    return version ? [{ id, label: LANGUAGES[id].label, version }] : [];
  });
  const verified = languages.map((id) => ({
    id,
    label: LANGUAGES[id].label,
    version: LANGUAGES[id].verifiedOn,
  }));
  return { minimum, verified };
}
