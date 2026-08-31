import Link from "next/link";
import { PageForm } from "@/components/admin/PageForm";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <div className="admin-header">
        <h1>Страница</h1>
        <Link href="/admin/pages/" className="admin-btn">
          ← К списку
        </Link>
      </div>
      <div className="admin-card">
        <PageForm pageId={id} />
      </div>
    </>
  );
}
