import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPagesPage() {
  const sb = await createClient();
  const { data } = await sb
    .from("pages")
    .select("id, title, slug, status, template, updated_at")
    .order("sort_order");

  return (
    <>
      <div className="admin-header">
        <h1>Страницы</h1>
        <Link href="/admin/pages/new/" className="admin-btn admin-btn--primary">
          + Создать
        </Link>
      </div>
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Заголовок</th>
              <th>Slug</th>
              <th>Шаблон</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>
                  <code>{p.slug}</code>
                </td>
                <td>{p.template}</td>
                <td>{p.status}</td>
                <td>
                  <Link href={`/admin/pages/${p.id}/`} className="admin-btn admin-btn--sm">
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
