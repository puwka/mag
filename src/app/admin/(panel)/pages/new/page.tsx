import Link from "next/link";
import { PageForm } from "@/components/admin/PageForm";

export default function NewPagePage() {
  return (
    <>
      <div className="admin-header">
        <h1>Новая страница</h1>
        <Link href="/admin/pages/" className="admin-btn">
          ← К списку
        </Link>
      </div>
      <div className="admin-card">
        <PageForm />
      </div>
    </>
  );
}
