import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { LANGUAGES, type LanguageId } from "@/lib/languages";
import { SITE } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

// Only the 4 subsets we render, committed to the repo so the OG function bundle stays small.
const FONT_DIR = path.join(process.cwd(), "assets", "fonts");
const FONT_FILES = [
  { file: "inter-latin-400-normal.woff", weight: 400 },
  { file: "inter-vietnamese-400-normal.woff", weight: 400 },
  { file: "inter-latin-700-normal.woff", weight: 700 },
  { file: "inter-vietnamese-700-normal.woff", weight: 700 },
] as const;

async function loadFonts() {
  return Promise.all(
    FONT_FILES.map(async ({ file, weight }) => ({
      name: "Inter",
      data: await fs.readFile(path.join(FONT_DIR, file)),
      weight,
      style: "normal" as const,
    })),
  );
}

type Props = {
  eyebrow: string;
  title: string;
  languages: readonly LanguageId[];
};

export async function renderOgCard({ eyebrow, title, languages }: Props) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0b0f17",
          color: "#f9fafb",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", fontSize: 32, color: "#9ca3af" }}>{eyebrow}</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {languages.map((id) => (
              <div
                key={id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: "2px solid #374151",
                  fontSize: 26,
                }}
              >
                <div
                  style={{ width: 14, height: 14, borderRadius: 999, background: LANGUAGES[id].color }}
                />
                {LANGUAGES[id].label}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>{SITE.name}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
