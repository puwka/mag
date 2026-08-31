"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MenuItem = {
  id?: string;
  menu_key: string;
  parent_id: string | null;
  title: string;
  url: string;
  link_type: "custom" | "page" | "category" | "product";
  sort_order: number;
  is_visible: boolean;
  open_in_new_tab: boolean;
};

const MENUS = [
  "header_mega",
  "header_quick",
  "mobile",
  "footer_info",
  "footer_catalog",
  "footer_gloves",
];

const empty = (menu_key: string): MenuItem => ({
  menu_key,
  parent_id: null,
  title: "",
  url: "",
  link_type: "custom",
  sort_order: 0,
  is_visible: true,
  open_in_new_tab: false,
});

export function MenuManager() {
  const [menuKey, setMenuKey] = useState(MENUS[0]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [edit, setEdit] = useState<MenuItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(key = menuKey) {
    const sb = createClient();
    const { data } = await sb
      .from("menu_items")
      .select(
        "id, menu_key, parent_id, title, url, link_type, sort_order, is_visible, open_in_new_tab"
      )
      .eq("menu_key", key)
      .order("sort_order");
    setItems((data as MenuItem[]) ?? []);
  }

  useEffect(() => {
    load(menuKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuKey]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setError(null);
    const sb = createClient();
    const payload = {
      menu_key: edit.menu_key,
      parent_id: edit.parent_id,
      title: edit.title.trim(),
      url: edit.url || null,
      link_type: edit.link_type,
      sort_order: Number(edit.sort_order) || 0,
      is_visible: edit.is_visible,
      open_in_new_tab: edit.open_in_new_tab,
    };
    if (edit.id) {
      const { error: ue } = await sb.from("menu_items").update(payload).eq("id", edit.id);
      if (ue) setError(ue.message);
    } else {
      const { error: ie } = await sb.from("menu_items").insert(payload);
      if (ie) setError(ie.message);
    }
    setEdit(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Удалить пункт меню?")) return;
    const sb = createClient();
    await sb.from("menu_items").delete().eq("id", id);
    load();
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= items.length) return;
    const a = items[idx];
    const b = items[swap];
    const sb = createClient();
    await Promise.all([
      sb.from("menu_items").update({ sort_order: b.sort_order }).eq("id", a.id!),
      sb.from("menu_items").update({ sort_order: a.sort_order }).eq("id", b.id!),
    ]);
    // also swap explicitly with idx numbers
    await Promise.all([
      sb.from("menu_items").update({ sort_order: swap }).eq("id", a.id!),
      sb.from("menu_items").update({ sort_order: idx }).eq("id", b.id!),
    ]);
    load();
  }

  return (
    <>
      <div className="admin-toolbar">
        <select value={menuKey} onChange={(e) => setMenuKey(e.target.value)}>
          {MENUS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => setEdit(empty(menuKey))}
        >
          + Пункт
        </button>
      </div>

      {edit ? (
        <form className="admin-card admin-form" onSubmit={save}>
          <h3 style={{ marginTop: 0 }}>{edit.id ? "Редактирование" : "Новый пункт"}</h3>
          <div className="admin-field">
            <label>Название *</label>
            <input
              required
              value={edit.title}
              onChange={(e) => setEdit({ ...edit, title: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>URL</label>
            <input
              value={edit.url}
              onChange={(e) => setEdit({ ...edit, url: e.target.value })}
              placeholder="/rabochie-perchatki/"
            />
          </div>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label>Родитель (вложенность)</label>
              <select
                value={edit.parent_id || ""}
                onChange={(e) =>
                  setEdit({ ...edit, parent_id: e.target.value || null })
                }
              >
                <option value="">— корень —</option>
                {items
                  .filter((i) => i.id && i.id !== edit.id)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title}
                    </option>
                  ))}
              </select>
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
              checked={edit.is_visible}
              onChange={(e) => setEdit({ ...edit, is_visible: e.target.checked })}
            />
            Видимый
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
              <th>Порядок</th>
              <th>Название</th>
              <th>URL</th>
              <th>Родитель</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.sort_order}</td>
                <td>
                  {i.parent_id ? "↳ " : ""}
                  {i.title}
                  {!i.is_visible ? " (скрыт)" : ""}
                </td>
                <td>
                  <code>{i.url}</code>
                </td>
                <td>
                  {items.find((p) => p.id === i.parent_id)?.title || "—"}
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    onClick={() => i.id && move(i.id, -1)}
                  >
                    ↑
                  </button>{" "}
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    onClick={() => i.id && move(i.id, 1)}
                  >
                    ↓
                  </button>{" "}
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    onClick={() => setEdit({ ...i, url: i.url || "" })}
                  >
                    Изменить
                  </button>{" "}
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm admin-btn--danger"
                    onClick={() => i.id && remove(i.id)}
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
