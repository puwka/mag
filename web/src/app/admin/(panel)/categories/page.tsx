import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCategoriesPage() {
  const sb = await createClient();
  const { data } = await sb
    .from("categories")
    .select("id, name, path, status, sort_order, parent_id")
    .order("path");

  return (
    <>
      <div className="admin-header">
        <h1>Категории</h1>
        <Link href="/admin/categories/new/" className="admin-btn admin-btn--primary">
          + Добавить
        </Link>
      </div>
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Порядок</th>
              <th>Путь</th>
              <th>Название</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id}>
                <td>{c.sort_order}</td>
                <td>
                  <code>{c.path}</code>
                </td>
                <td>{c.name}</td>
                <td>{c.status}</td>
                <td>
                  <Link href={`/admin/categories/${c.id}/`} className="admin-btn admin-btn--sm">
                    Изменить
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
