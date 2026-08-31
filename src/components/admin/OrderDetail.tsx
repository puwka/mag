"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { orderStatusLabel, type AppOrderStatus } from "@/lib/orders";

const STATUSES: AppOrderStatus[] = ["new", "processing", "completed", "cancelled"];

export function OrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [items, setItems] = useState<
    {
      id: string;
      product_name: string;
      product_sku: string | null;
      quantity_packs: number;
      unit_price: number;
      line_total: number;
    }[]
  >([]);
  const [status, setStatus] = useState<string>("new");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data } = await sb.from("orders").select("*").eq("id", orderId).single();
      setOrder(data);
      setStatus((data?.status as string) || "new");
      const { data: its } = await sb
        .from("order_items")
        .select("id, product_name, product_sku, quantity_packs, unit_price, line_total")
        .eq("order_id", orderId);
      setItems(its ?? []);
    })();
  }, [orderId]);

  async function saveStatus() {
    const sb = createClient();
    const { error } = await sb.from("orders").update({ status }).eq("id", orderId);
    setMsg(error ? error.message : "Статус обновлён");
  }

  if (!order) return <p>Загрузка…</p>;

  return (
    <div className="admin-card">
      <p>
        <strong>{String(order.order_number)}</strong> ·{" "}
        {new Date(String(order.created_at)).toLocaleString("ru-RU")}
      </p>
      <div className="admin-grid-2">
        <div>
          <p>
            <strong>Клиент:</strong> {String(order.customer_name)}
          </p>
          <p>
            <strong>Телефон:</strong> {String(order.customer_phone)}
          </p>
          <p>
            <strong>Email:</strong> {String(order.customer_email || "—")}
          </p>
          <p>
            <strong>Комментарий:</strong> {String(order.customer_note || "—")}
          </p>
          <p>
            <strong>Источник:</strong>{" "}
            {JSON.stringify(order.source_utm || {})}
          </p>
        </div>
        <div className="admin-field">
          <label>Статус заявки</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel(s)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            style={{ marginTop: 10 }}
            onClick={saveStatus}
          >
            Сохранить статус
          </button>
          {msg ? <p className="admin-ok">{msg}</p> : null}
        </div>
      </div>

      <h3>Позиции</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Товар</th>
            <th>Арт.</th>
            <th>Кол-во</th>
            <th>Цена</th>
            <th>Сумма</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.product_name}</td>
              <td>{i.product_sku || "—"}</td>
              <td>{i.quantity_packs}</td>
              <td>{Number(i.unit_price).toFixed(2)}</td>
              <td>{Number(i.line_total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontWeight: 700 }}>
        Итого: {Number(order.total).toFixed(2)} ₽
      </p>
      <Link href="/admin/orders/" className="admin-btn">
        ← К списку
      </Link>
    </div>
  );
}
