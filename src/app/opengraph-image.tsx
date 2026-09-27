import { OG_SIZE, renderOgCard } from "@/app/_components/og-card";
import { LANGUAGE_IDS } from "@/lib/languages";
import { SITE } from "@/lib/site";

export const alt = SITE.title;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgCard({
    eyebrow: "const you = new NodeDeveloper();",
    title: "Node.js sang Go, Rust, Swift, Kotlin, Java",
    languages: LANGUAGE_IDS,
  });
}
