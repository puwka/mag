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

const STATUSES: SubmissionStatus[] = ["new", "in_progress", "done", "spam"];

export function SubmissionDetail({ submissionId }: { submissionId: string }) {
  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<string>("new");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data } = await sb
        .from("form_submissions")
        .select("*")
        .eq("id", submissionId)
        .single();
      setRow(data);
      setStatus((data?.status as string) || "new");
    })();
  }, [submissionId]);

  async function saveStatus() {
    const sb = createClient();
    const { error } = await sb
      .from("form_submissions")
      .update({ status })
      .eq("id", submissionId);
    setMsg(error ? "Ошибка сохранения" : "Сохранено");
  }

  if (!row) return <p>Загрузка…</p>;

  const payload = (row.payload as Record<string, unknown>) || {};
  const contact = submissionContact(payload);

  return (
    <>
      <div className="admin-header">
        <div>
          <Link href="/admin/orders/?tab=forms" className="admin-btn admin-btn--sm">
            ← К заявкам
          </Link>
          <h1 style={{ marginTop: 12 }}>{formTypeLabel(String(row.form_type))}</h1>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            {new Date(String(row.created_at)).toLocaleString("ru-RU")}
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: 640 }}>
        <p>
          <strong>Имя:</strong> {contact.name}
        </p>
        <p>
          <strong>Телефон:</strong>{" "}
          {contact.phone !== "—" ? (
            <a href={`tel:${contact.phone}`}>{contact.phone}</a>
          ) : (
            "—"
          )}
        </p>
        <p>
          <strong>Email:</strong>{" "}
          {contact.email !== "—" ? (
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          ) : (
            "—"
          )}
        </p>
        {row.product_url ? (
          <p>
            <strong>Страница товара:</strong>{" "}
            <a href={String(row.product_url)} target="_blank" rel="noreferrer">
              {String(row.product_url)}
            </a>
          </p>
        ) : null}

        <h3 style={{ fontFamily: "var(--font-condensed)", marginTop: 24 }}>Данные формы</h3>
        <dl className="admin-dl">
          {Object.entries(payload).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>

        <div style={{ marginTop: 24 }}>
          <label>Статус</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {submissionStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-actions" style={{ marginTop: 12 }}>
          <button type="button" className="admin-btn admin-btn--primary" onClick={saveStatus}>
            Сохранить
          </button>
          {msg ? <span style={{ marginLeft: 8 }}>{msg}</span> : null}
        </div>
      </div>
    </>
  );
}
