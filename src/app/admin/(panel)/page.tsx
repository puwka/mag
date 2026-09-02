import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formTypeLabel, submissionContact, submissionStatusLabel } from "@/lib/forms";
import { orderStatusLabel } from "@/lib/orders";
export default async function AdminDashboardPage() {
  const sb = await createClient();
  const [
    products,
    categories,
    orders,
    formSubmissions,
    reviews,
    pages,
    recentOrders,
    recentSubmissions,
  ] = await Promise.all([
    sb.from("products").select("id", { count: "exact", head: true }),
    sb.from("categories").select("id", { count: "exact", head: true }),
    sb.from("orders").select("id", { count: "exact", head: true }),
    sb.from("form_submissions").select("id", { count: "exact", head: true }),
    sb.from("reviews").select("id", { count: "exact", head: true }),
    sb.from("pages").select("id", { count: "exact", head: true }),
    sb
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    sb
      .from("form_submissions")
      .select("id, form_type, payload, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "Товары", value: products.count ?? 0, href: "/admin/products/" },
    { label: "Категории", value: categories.count ?? 0, href: "/admin/categories/" },
    {
      label: "Заказы",
      value: orders.count ?? 0,
      href: "/admin/orders/",
    },
    {
      label: "Формы",
      value: formSubmissions.count ?? 0,
      href: "/admin/orders/?tab=forms",
    },
    { label: "Отзывы", value: reviews.count ?? 0, href: "/admin/reviews/" },
    { label: "Страницы", value: pages.count ?? 0, href: "/admin/pages/" },
  ];

  return (
    <>
      <div className="admin-header">
        <h1>Dashboard</h1>
        <div className="admin-actions">
          <Link href="/admin/products/new/" className="admin-btn admin-btn--primary">
            + Товар
          </Link>
          <Link href="/admin/orders/" className="admin-btn">
            Заявки
          </Link>
          <Link href="/admin/pages/new/" className="admin-btn">
            + Страница
          </Link>
        </div>
      </div>

      <div className="admin-stats">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="admin-stat">
            <div className="admin-stat__value">{s.value}</div>
            <div className="admin-stat__label">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="admin-card">
        <h2 style={{ marginTop: 0, fontFamily: "var(--font-condensed)" }}>
          Быстрые действия
        </h2>
        <div className="admin-actions">
          <Link href="/admin/products/" className="admin-btn">Товары</Link>
          <Link href="/admin/categories/" className="admin-btn">Категории</Link>
          <Link href="/admin/media/" className="admin-btn">Медиа</Link>
          <Link href="/admin/homepage/" className="admin-btn">Главная</Link>
          <Link href="/admin/menu/" className="admin-btn">Меню</Link>
          <Link href="/admin/settings/" className="admin-btn">Настройки</Link>
          <Link href="/admin/reviews/" className="admin-btn">Отзывы</Link>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-header" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-condensed)", fontSize: 20 }}>
            Последние заказы
          </h2>
          <Link href="/admin/orders/" className="admin-btn admin-btn--sm">
            Все
          </Link>
        </div>        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Клиент</th>
                <th>Статус</th>
                <th>Сумма</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders.data ?? []).map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}/`}>
                      {o.order_number}
                    </Link>
                  </td>
                  <td>
                    {o.customer_name}
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {o.customer_phone}
                    </div>
                  </td>
                  <td>{orderStatusLabel(o.status)}</td>
                  <td>{Number(o.total).toFixed(2)} ₽</td>
                  <td>{new Date(o.created_at).toLocaleString("ru-RU")}</td>
                </tr>
              ))}
              {!recentOrders.data?.length ? (
                <tr>
                  <td colSpan={5}>Заявок пока нет</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-header" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-condensed)", fontSize: 20 }}>
            Заявки с форм
          </h2>
          <Link href="/admin/orders/?tab=forms" className="admin-btn admin-btn--sm">
            Все
          </Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Тип</th>
                <th>Клиент</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {(recentSubmissions.data ?? []).map((s) => {
                const c = submissionContact((s.payload as Record<string, unknown>) || {});
                return (
                  <tr key={s.id}>
                    <td>
                      <Link href={`/admin/submissions/${s.id}/`}>
                        {formTypeLabel(s.form_type)}
                      </Link>
                    </td>
                    <td>
                      {c.name}
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{c.phone}</div>
                    </td>
                    <td>{submissionStatusLabel(s.status)}</td>
                    <td>{new Date(s.created_at).toLocaleString("ru-RU")}</td>
                  </tr>
                );
              })}
              {!recentSubmissions.data?.length ? (
                <tr>
                  <td colSpan={4}>Заявок с форм пока нет</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}