import { notFound } from "next/navigation";

/** Unknown paths inside a locale render [locale]/not-found.tsx with that locale's layout. */
export default function CatchAllPage() {
  notFound();
}
