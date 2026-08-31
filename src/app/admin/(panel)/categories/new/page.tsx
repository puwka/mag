import Link from "next/link";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  return (
    <>
      <div className="admin-header">
        <h1>Новая категория</h1>
        <Link href="/admin/categories/" className="admin-btn">
          ← К списку
        </Link>
      </div>
      <div className="admin-card">
        <CategoryForm />
      </div>
    </>
  );
}
