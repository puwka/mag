"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { orderStatusLabel, type AppOrderStatus } from "@/lib/orders";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  status: string;
  total: number;
  created_at: string;
};

const STATUSES: AppOrderStatus[] = ["new", "processing", "completed", "cancelled"];

export function OrdersManager() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const sb = createClient();
    let query = sb
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_phone, customer_email, status, total, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (status) query = query.eq("status", status);
    if (q.trim()) {
      query = query.or(
        `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,customer_email.ilike.%${q}%`
      );
    }
    const { data } = await query;
    setRows((data as OrderRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="admin-toolbar">
        <input
          placeholder="Поиск по номеру, имени, телефону…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Все статусы</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel(s)}
            </option>
          ))}
        </select>
        <button type="button" className="admin-btn" onClick={load}>
          Применить
        </button>
      </div>
      <div className="admin-card admin-table-wrap">
        {loading ? <p>Загрузка…</p> : null}
        <table className="admin-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Клиент</th>
              <th>Статус</th>
              <th>Сумма</th>
              <th>Дата</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>{o.order_number}</td>
                <td>
                  {o.customer_name}
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {o.customer_phone}
                    {o.customer_email ? ` · ${o.customer_email}` : ""}
                  </div>
                </td>
                <td>{orderStatusLabel(o.status)}</td>
                <td>{Number(o.total).toFixed(2)} ₽</td>
                <td>{new Date(o.created_at).toLocaleString("ru-RU")}</td>
                <td>
                  <Link href={`/admin/orders/${o.id}/`} className="admin-btn admin-btn--sm">
                    Открыть
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
