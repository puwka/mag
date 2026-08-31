"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileUploadButton } from "@/components/admin/FileUpload";
import { mediaUrl } from "@/lib/media";

type Review = {
  id?: string;
  source: "yandex" | "manual";
  author_name: string;
  body: string;
  rating: number | null;
  review_date: string;
  external_url: string;
  avatar_path: string;
  is_published: boolean;
  sort_order: number;
};

const empty: Review = {
  source: "manual",
  author_name: "",
  body: "",
  rating: 5,
  review_date: new Date().toISOString().slice(0, 10),
  external_url: "",
  avatar_path: "",
  is_published: false,
  sort_order: 0,
};

export function ReviewsManager() {
  const [rows, setRows] = useState<Review[]>([]);
  const [edit, setEdit] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const sb = createClient();
    const { data } = await sb.from("reviews").select("*").order("sort_order");
    setRows((data as Review[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setError(null);
    const sb = createClient();
    const payload = {
      source: edit.source,
      author_name: edit.author_name.trim(),
      body: edit.body.trim(),
      rating: edit.rating,
      review_date: edit.review_date || null,
      external_url: edit.external_url || null,
      avatar_path: edit.avatar_path || null,
      is_published: edit.is_published,
      sort_order: Number(edit.sort_order) || 0,
    };
    if (edit.id) {
      const { error: ue } = await sb.from("reviews").update(payload).eq("id", edit.id);
      if (ue) setError(ue.message);
    } else {
      const { error: ie } = await sb.from("reviews").insert(payload);
      if (ie) setError(ie.message);
    }
    setEdit(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Удалить отзыв?")) return;
    const sb = createClient();
    await sb.from("reviews").delete().eq("id", id);
    load();
  }

  return (
    <>
      <div className="admin-actions" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => setEdit({ ...empty })}
        >
          + Отзыв
        </button>
      </div>

      {edit ? (
        <form className="admin-card admin-form" onSubmit={save}>
          <h3 style={{ marginTop: 0 }}>{edit.id ? "Редактирование" : "Новый отзыв"}</h3>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label>Автор *</label>
              <input
                required
                value={edit.author_name}
                onChange={(e) => setEdit({ ...edit, author_name: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>Рейтинг</label>
              <select
                value={edit.rating ?? 5}
                onChange={(e) => setEdit({ ...edit, rating: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-field">
            <label>Текст *</label>
            <textarea
              required
              value={edit.body}
              onChange={(e) => setEdit({ ...edit, body: e.target.value })}
            />
          </div>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label>Дата</label>
              <input
                type="date"
                value={edit.review_date || ""}
                onChange={(e) => setEdit({ ...edit, review_date: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>Источник</label>
              <select
                value={edit.source}
                onChange={(e) =>
                  setEdit({ ...edit, source: e.target.value as Review["source"] })
                }
              >
                <option value="manual">manual</option>
                <option value="yandex">yandex</option>
              </select>
            </div>
          </div>
          <div className="admin-field">
            <label>Фото / аватар</label>
            <div className="admin-actions" style={{ marginBottom: 8 }}>
              <FileUploadButton
                bucket="reviews"
                folder="avatars"
                onUploaded={({ path }) => setEdit({ ...edit, avatar_path: path })}
              />
            </div>
            <input
              value={edit.avatar_path}
              onChange={(e) => setEdit({ ...edit, avatar_path: e.target.value })}
            />
            {edit.avatar_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(edit.avatar_path, "reviews") || edit.avatar_path}
                alt=""
                style={{ width: 64, height: 64, objectFit: "cover", marginTop: 8 }}
              />
            ) : null}
          </div>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label>Внешняя ссылка</label>
              <input
                value={edit.external_url}
                onChange={(e) => setEdit({ ...edit, external_url: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>Порядок</label>
              <input
                type="number"
                value={edit.sort_order}
                onChange={(e) =>
                  setEdit({ ...edit, sort_order: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={edit.is_published}
              onChange={(e) => setEdit({ ...edit, is_published: e.target.checked })}
            />
            Опубликован
          </label>
          {error ? <p className="admin-error">{error}</p> : null}
          <div className="admin-actions">
            <button className="admin-btn admin-btn--primary">Сохранить</button>
            <button type="button" className="admin-btn" onClick={() => setEdit(null)}>
              Отмена
            </button>
          </div>
        </form>
      ) : null}

      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Автор</th>
              <th>Рейтинг</th>
              <th>Публикация</th>
              <th>Порядок</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.author_name}</td>
                <td>{r.rating ?? "—"}</td>
                <td>{r.is_published ? "да" : "нет"}</td>
                <td>{r.sort_order}</td>
                <td>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    onClick={() =>
                      setEdit({
                        ...r,
                        review_date: r.review_date || "",
                        external_url: r.external_url || "",
                        avatar_path: r.avatar_path || "",
                      })
                    }
                  >
                    Изменить
                  </button>{" "}
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm admin-btn--danger"
                    onClick={() => r.id && remove(r.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
