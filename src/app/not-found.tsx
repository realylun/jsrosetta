import Link from "next/link";
import { Container } from "@/app/_components/container";

export default function NotFound() {
  return (
    <main>
      <Container className="py-24 text-center">
        <p className="font-mono text-sm text-gray-500">throw new NotFoundError()</p>
        <h1 className="mt-3 text-3xl font-bold">Không tìm thấy trang</h1>
        <Link href="/" className="mt-6 inline-block underline">
          Về trang chủ
        </Link>
      </Container>
    </main>
  );
}
