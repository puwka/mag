import Link from "next/link";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <div className="admin-header">
        <h1>Категория</h1>
        <Link href="/admin/categories/" className="admin-btn">
          ← К списку
        </Link>
      </div>
      <div className="admin-card">
        <CategoryForm categoryId={id} />
      </div>
    </>
  );
}
