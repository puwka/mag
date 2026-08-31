import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const sb = await createClient();
  let q = sb
    .from("products")
    .select("id, name, slug, sku, status, stock_status, pack_price, menu_order, updated_at")
    .order("menu_order");
  if (sp.q) q = q.or(`name.ilike.%${sp.q}%,sku.ilike.%${sp.q}%,slug.ilike.%${sp.q}%`);
  if (sp.status) q = q.eq("status", sp.status);
  const { data } = await q;

  return (
    <>
      <div className="admin-header">
        <h1>Товары</h1>
        <Link href="/admin/products/new/" className="admin-btn admin-btn--primary">
          + Добавить
        </Link>
      </div>
      <form className="admin-toolbar" method="get">
        <input name="q" placeholder="Поиск…" defaultValue={sp.q || ""} />
        <select name="status" defaultValue={sp.status || ""}>
          <option value="">Все статусы</option>
          <option value="published">Опубликован</option>
          <option value="draft">Черновик</option>
          <option value="archived">Архив</option>
        </select>
        <button type="submit" className="admin-btn">
          Найти
        </button>
      </form>
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Порядок</th>
              <th>Название</th>
              <th>Артикул</th>
              <th>Цена</th>
              <th>Статус</th>
              <th>Наличие</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id}>
                <td>{p.menu_order}</td>
                <td>
                  <Link href={`/admin/products/${p.id}/`}>{p.name}</Link>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{p.slug}</div>
                </td>
                <td>{p.sku || "—"}</td>
                <td>{p.pack_price != null ? `${p.pack_price} ₽` : "по запросу"}</td>
                <td>
                  <span
                    className={`admin-badge ${
                      p.status === "published"
                        ? "admin-badge--ok"
                        : p.status === "draft"
                          ? "admin-badge--warn"
                          : "admin-badge--muted"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td>{p.stock_status}</td>
                <td>
                  <Link href={`/admin/products/${p.id}/`} className="admin-btn admin-btn--sm">
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
