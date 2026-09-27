import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Container } from "@/app/_components/container";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <main>
      <Container className="py-24 text-center">
        <p className="font-mono text-sm text-gray-500">throw new NotFoundError()</p>
        <h1 className="mt-3 text-3xl font-bold">{t("title")}</h1>
        <Link href="/" className="mt-6 inline-block underline">
          {t("backHome")}
        </Link>
      </Container>
    </main>
  );
}
