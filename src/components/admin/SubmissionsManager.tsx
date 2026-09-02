"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  formTypeLabel,
  submissionContact,
  submissionStatusLabel,
  type SubmissionStatus,
} from "@/lib/forms";

type SubmissionRow = {
  id: string;
  form_type: string;
  payload: Record<string, unknown>;
  product_url: string | null;
  status: string;
  created_at: string;
};

const STATUSES: SubmissionStatus[] = ["new", "in_progress", "done", "spam"];

export function SubmissionsManager() {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [q, setQ] = useState("");
  const [formType, setFormType] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const sb = createClient();
    let query = sb
      .from("form_submissions")
      .select("id, form_type, payload, product_url, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (formType) query = query.eq("form_type", formType);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) {
      console.error(error);
      setRows([]);
      setLoading(false);
      return;
    }
    let list = (data as SubmissionRow[]) ?? [];
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((row) => {
        const c = submissionContact(row.payload || {});
        const hay = [
          c.name,
          c.phone,
          c.email,
          row.form_type,
          row.product_url || "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
    }
    setRows(list);
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
          placeholder="Поиск по имени, телефону, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={formType} onChange={(e) => setFormType(e.target.value)}>
          <option value="">Все типы</option>
          <option value="price_list">Прайс-лист</option>
          <option value="product_request">Заявка на товар</option>
          <option value="contact">Контакт</option>
          <option value="product_selection">Подбор товара</option>
          <option value="partnership">Партнёрство</option>
          <option value="logo_application">Логотип</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Все статусы</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {submissionStatusLabel(s)}
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
              <th>Тип</th>
              <th>Клиент</th>
              <th>Товар / страница</th>
              <th>Статус</th>
              <th>Дата</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const c = submissionContact(row.payload || {});
              return (
                <tr key={row.id}>
                  <td>{formTypeLabel(row.form_type)}</td>
                  <td>
                    {c.name}
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {c.phone}
                      {c.email !== "—" ? ` · ${c.email}` : ""}
                    </div>
                  </td>
                  <td>{row.product_url || "—"}</td>
                  <td>{submissionStatusLabel(row.status)}</td>
                  <td>{new Date(row.created_at).toLocaleString("ru-RU")}</td>
                  <td>
                    <Link
                      href={`/admin/submissions/${row.id}/`}
                      className="admin-btn admin-btn--sm"
                    >
                      Открыть
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!loading && !rows.length ? (
              <tr>
                <td colSpan={6}>Заявок с форм пока нет</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
