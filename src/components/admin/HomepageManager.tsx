"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileUploadButton } from "@/components/admin/FileUpload";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { BLOCK_TYPE_LABELS, blockTypeOf, type BlockType } from "@/lib/homepage";
import type {
  HomepageBenefit,
  HomepagePromoBanner,
  HomepageSection,
  HomepageStep,
} from "@/lib/types";

type SectionEdit = HomepageSection & {
  description: string;
  image_path: string;
  button_label: string;
  button_url: string;
};

function emptyStep(n: number): Omit<HomepageStep, "id"> {
  return {
    step_number: n,
    title: "",
    description: "",
    link_url: null,
    link_label: null,
    image_path: null,
    sort_order: n,
    is_visible: true,
  };
}

export function HomepageManager() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [benefits, setBenefits] = useState<HomepageBenefit[]>([]);
  const [steps, setSteps] = useState<HomepageStep[]>([]);
  const [banners, setBanners] = useState<HomepagePromoBanner[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SectionEdit | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const sb = createClient();
    const [s, b, st, bn] = await Promise.all([
      sb.from("homepage_sections").select("*").order("sort_order"),
      sb.from("homepage_benefits").select("*").order("sort_order"),
      sb.from("homepage_steps").select("*").order("sort_order"),
      sb.from("homepage_promo_banners").select("*").order("sort_order"),
    ]);
    setSections(s.data ?? []);
    setBenefits(b.data ?? []);
    setSteps(st.data ?? []);
    setBanners(bn.data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(s: HomepageSection) {
    setEditId(s.id);
    const cfg = s.config || {};
    setDraft({
      ...s,
      description: s.description || String(cfg.description || cfg.html || ""),
      image_path: s.image_path || String(cfg.image || cfg.image_path || cfg.logo || ""),
      button_label:
        s.button_label || String(cfg.button_label || cfg.cta_label || ""),
      button_url: s.button_url || String(cfg.button_url || cfg.cta_url || ""),
      config: { ...cfg },
    });
    setMsg(null);
    setErr(null);
  }

  async function saveSection(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setErr(null);
    const sb = createClient();
    const cfg = { ...(draft.config || {}) };
    const type = blockTypeOf(draft);
    cfg.block_type = type;
    if (draft.description) {
      if (type === "about") cfg.html = draft.description;
      else cfg.description = draft.description;
    }
    if (draft.image_path) {
      if (type === "hero") cfg.image = draft.image_path;
      else if (type === "reviews") cfg.logo = draft.image_path;
      else cfg.image = draft.image_path;
    }
    if (draft.button_label) {
      cfg.button_label = draft.button_label;
      cfg.cta_label = draft.button_label;
    }
    if (draft.button_url) {
      cfg.button_url = draft.button_url;
      cfg.cta_url = draft.button_url;
    }

    const payload: Record<string, unknown> = {
      title: draft.title,
      subtitle: draft.subtitle,
      config: cfg,
      is_visible: draft.is_visible,
      sort_order: Number(draft.sort_order) || 0,
    };
    // optional columns from migration 012
    payload.description = draft.description || null;
    payload.image_path = draft.image_path || null;
    payload.button_label = draft.button_label || null;
    payload.button_url = draft.button_url || null;

    let { error } = await sb
      .from("homepage_sections")
      .update(payload)
      .eq("id", draft.id);
    if (error && /column|schema/i.test(error.message)) {
      const { description: _d, image_path: _i, button_label: _b, button_url: _u, ...rest } =
        payload as SectionEdit & Record<string, unknown>;
      void _d;
      void _i;
      void _b;
      void _u;
      const retry = await sb
        .from("homepage_sections")
        .update({
          title: rest.title,
          subtitle: rest.subtitle,
          config: rest.config,
          is_visible: rest.is_visible,
          sort_order: rest.sort_order,
        })
        .eq("id", draft.id);
      error = retry.error;
    }
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("Блок сохранён");
    setEditId(null);
    setDraft(null);
    load();
  }

  async function moveSection(id: string, dir: -1 | 1) {
    const idx = sections.findIndex((s) => s.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= sections.length) return;
    const a = sections[idx];
    const b = sections[swap];
    const sb = createClient();
    await Promise.all([
      sb.from("homepage_sections").update({ sort_order: b.sort_order }).eq("id", a.id),
      sb.from("homepage_sections").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    load();
  }

  async function toggleSection(id: string, is_visible: boolean) {
    const sb = createClient();
    await sb.from("homepage_sections").update({ is_visible }).eq("id", id);
    load();
  }

  /* ---- benefits ---- */
  async function saveBenefit(b: Partial<HomepageBenefit> & { id?: string }) {
    const sb = createClient();
    if (b.id) {
      await sb.from("homepage_benefits").update(b).eq("id", b.id);
    } else {
      await sb.from("homepage_benefits").insert({
        block_group: b.block_group || "info_boxes",
        title: b.title || "Новый пункт",
        description: b.description || null,
        icon_path: b.icon_path || null,
        link_url: b.link_url || null,
        button_label: b.button_label || null,
        sort_order: b.sort_order ?? benefits.length + 1,
        is_visible: true,
      });
    }
    load();
  }

  async function deleteBenefit(id: string) {
    if (!confirm("Удалить пункт?")) return;
    const sb = createClient();
    await sb.from("homepage_benefits").delete().eq("id", id);
    load();
  }

  /* ---- steps CRUD ---- */
  async function addStep() {
    const n = (steps.reduce((m, s) => Math.max(m, s.step_number), 0) || 0) + 1;
    const sb = createClient();
    await sb.from("homepage_steps").insert(emptyStep(n));
    load();
  }

  async function saveStep(s: HomepageStep) {
    const sb = createClient();
    await sb
      .from("homepage_steps")
      .update({
        step_number: s.step_number,
        title: s.title,
        description: s.description,
        link_url: s.link_url,
        link_label: s.link_label,
        sort_order: s.sort_order,
        is_visible: s.is_visible,
      })
      .eq("id", s.id);
    load();
  }

  async function deleteStep(id: string) {
    if (!confirm("Удалить этап?")) return;
    const sb = createClient();
    await sb.from("homepage_steps").delete().eq("id", id);
    load();
  }

  async function moveStep(id: string, dir: -1 | 1) {
    const idx = steps.findIndex((s) => s.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= steps.length) return;
    const a = steps[idx];
    const b = steps[swap];
    const sb = createClient();
    await Promise.all([
      sb
        .from("homepage_steps")
        .update({ sort_order: b.sort_order, step_number: b.step_number })
        .eq("id", a.id),
      sb
        .from("homepage_steps")
        .update({ sort_order: a.sort_order, step_number: a.step_number })
        .eq("id", b.id),
    ]);
    load();
  }

  /* ---- banners ---- */
  async function saveBanner(b: HomepagePromoBanner) {
    const sb = createClient();
    await sb
      .from("homepage_promo_banners")
      .update({
        title: b.title,
        button_label: b.button_label,
        link_url: b.link_url,
        image_path: b.image_path,
        row_index: b.row_index,
        sort_order: b.sort_order,
        is_visible: b.is_visible,
      })
      .eq("id", b.id);
    load();
  }

  async function addBanner(row_index: number) {
    const sb = createClient();
    await sb.from("homepage_promo_banners").insert({
      row_index,
      title: "Новый баннер",
      button_label: "Подробнее",
      link_url: "/",
      image_path: "",
      sort_order: banners.filter((x) => x.row_index === row_index).length + 1,
      is_visible: true,
    });
    load();
  }

  async function deleteBanner(id: string) {
    if (!confirm("Удалить баннер?")) return;
    const sb = createClient();
    await sb.from("homepage_promo_banners").delete().eq("id", id);
    load();
  }

  const editing = draft;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {msg ? <p className="admin-ok">{msg}</p> : null}
      {err ? <p className="admin-error">{err}</p> : null}

      <div className="admin-card">
        <h2 style={{ marginTop: 0, fontFamily: "var(--font-condensed)" }}>
          Блоки главной (порядок и видимость)
        </h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Порядок</th>
              <th>Тип</th>
              <th>Ключ</th>
              <th>Заголовок</th>
              <th>Вкл</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.id}>
                <td>{s.sort_order}</td>
                <td>{BLOCK_TYPE_LABELS[blockTypeOf(s)] || blockTypeOf(s)}</td>
                <td>
                  <code>{s.section_key}</code>
                </td>
                <td>{s.title || "—"}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={s.is_visible}
                    onChange={(e) => toggleSection(s.id, e.target.checked)}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    onClick={() => moveSection(s.id, -1)}
                  >
                    ↑
                  </button>{" "}
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    onClick={() => moveSection(s.id, 1)}
                  >
                    ↓
                  </button>{" "}
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm admin-btn--primary"
                    onClick={() => openEdit(s)}
                  >
                    Редактировать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <form className="admin-card admin-form admin-form--wide" onSubmit={saveSection}>
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-condensed)" }}>
            Редактирование: {BLOCK_TYPE_LABELS[blockTypeOf(editing)]} (
            {editing.section_key})
          </h2>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label>Заголовок</label>
              <input
                value={editing.title || ""}
                onChange={(e) => setDraft({ ...editing, title: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>Подзаголовок</label>
              <input
                value={editing.subtitle || ""}
                onChange={(e) =>
                  setDraft({ ...editing, subtitle: e.target.value })
                }
              />
            </div>
          </div>
          <div className="admin-field">
            <label>Описание / HTML</label>
            {blockTypeOf(editing) === "about" ||
            blockTypeOf(editing) === "branding" ? (
              <RichTextEditor
                value={editing.description}
                onChange={(html) => setDraft({ ...editing, description: html })}
              />
            ) : (
              <textarea
                value={editing.description}
                onChange={(e) =>
                  setDraft({ ...editing, description: e.target.value })
                }
                rows={4}
              />
            )}
          </div>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label>Изображение</label>
              <div className="admin-actions" style={{ marginBottom: 6 }}>
                <FileUploadButton
                  bucket="site"
                  folder="homepage"
                  onUploaded={({ path, url }) =>
                    setDraft({
                      ...editing,
                      image_path: url || path,
                    })
                  }
                />
              </div>
              <input
                value={editing.image_path}
                onChange={(e) =>
                  setDraft({ ...editing, image_path: e.target.value })
                }
              />
            </div>
            <div className="admin-field">
              <label>Фон Hero (URL)</label>
              <input
                value={String(editing.config?.background || "")}
                onChange={(e) =>
                  setDraft({
                    ...editing,
                    config: { ...editing.config, background: e.target.value },
                  })
                }
                disabled={blockTypeOf(editing) !== "hero"}
              />
            </div>
          </div>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label>Кнопка (текст)</label>
              <input
                value={editing.button_label}
                onChange={(e) =>
                  setDraft({ ...editing, button_label: e.target.value })
                }
              />
            </div>
            <div className="admin-field">
              <label>Кнопка (ссылка)</label>
              <input
                value={editing.button_url}
                onChange={(e) =>
                  setDraft({ ...editing, button_url: e.target.value })
                }
              />
            </div>
          </div>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label>Порядок</label>
              <input
                type="number"
                value={editing.sort_order}
                onChange={(e) =>
                  setDraft({
                    ...editing,
                    sort_order: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="admin-field">
              <label>Тип блока</label>
              <select
                value={blockTypeOf(editing)}
                onChange={(e) =>
                  setDraft({
                    ...editing,
                    config: {
                      ...editing.config,
                      block_type: e.target.value as BlockType,
                    },
                  })
                }
              >
                {Object.entries(BLOCK_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(blockTypeOf(editing) === "products" ||
            blockTypeOf(editing) === "novelties") && (
            <div className="admin-grid-2">
              <div className="admin-field">
                <label>Путь категории (для товаров)</label>
                <input
                  value={String(editing.config?.category_path || "")}
                  onChange={(e) =>
                    setDraft({
                      ...editing,
                      config: {
                        ...editing.config,
                        category_path: e.target.value,
                      },
                    })
                  }
                  placeholder="rabochie-perchatki/perchatki-hb"
                />
              </div>
              <div className="admin-field">
                <label>Лимит товаров</label>
                <input
                  type="number"
                  value={Number(editing.config?.limit || 12)}
                  onChange={(e) =>
                    setDraft({
                      ...editing,
                      config: {
                        ...editing.config,
                        limit: Number(e.target.value) || 12,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {blockTypeOf(editing) === "promo" ? (
            <div className="admin-field">
              <label>Ряд баннеров (1 или 2)</label>
              <input
                type="number"
                min={1}
                max={2}
                value={Number(editing.config?.promo_row || 1)}
                onChange={(e) =>
                  setDraft({
                    ...editing,
                    config: {
                      ...editing.config,
                      promo_row: Number(e.target.value) || 1,
                    },
                  })
                }
              />
            </div>
          ) : null}

          <label className="admin-check">
            <input
              type="checkbox"
              checked={editing.is_visible}
              onChange={(e) =>
                setDraft({ ...editing, is_visible: e.target.checked })
              }
            />
            Блок включён
          </label>

          <div className="admin-actions">
            <button type="submit" className="admin-btn admin-btn--primary">
              Сохранить блок
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={() => {
                setEditId(null);
                setDraft(null);
              }}
            >
              Закрыть
            </button>
          </div>
        </form>
      ) : null}

      {/* Steps */}
      <div className="admin-card">
        <div className="admin-header" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-condensed)" }}>
            Этапы заказа
          </h2>
          <button type="button" className="admin-btn admin-btn--primary" onClick={addStep}>
            + Добавить этап
          </button>
        </div>
        {steps.map((s) => (
          <div
            key={s.id}
            style={{
              borderTop: "1px solid #eee",
              paddingTop: 12,
              marginTop: 12,
              display: "grid",
              gap: 8,
            }}
          >
            <div className="admin-grid-2">
              <input
                defaultValue={s.title}
                placeholder="Заголовок"
                onBlur={(e) => saveStep({ ...s, title: e.target.value })}
              />
              <input
                type="number"
                defaultValue={s.step_number}
                onBlur={(e) =>
                  saveStep({ ...s, step_number: Number(e.target.value) || 1 })
                }
              />
            </div>
            <textarea
              defaultValue={s.description}
              placeholder="Описание"
              onBlur={(e) => saveStep({ ...s, description: e.target.value })}
            />
            <div className="admin-grid-2">
              <input
                defaultValue={s.link_url || ""}
                placeholder="Ссылка"
                onBlur={(e) => saveStep({ ...s, link_url: e.target.value || null })}
              />
              <input
                defaultValue={s.link_label || ""}
                placeholder="Текст ссылки"
                onBlur={(e) =>
                  saveStep({ ...s, link_label: e.target.value || null })
                }
              />
            </div>
            <div className="admin-actions">
              <button
                type="button"
                className="admin-btn admin-btn--sm"
                onClick={() => moveStep(s.id, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--sm"
                onClick={() => moveStep(s.id, 1)}
              >
                ↓
              </button>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={s.is_visible}
                  onChange={(e) =>
                    saveStep({ ...s, is_visible: e.target.checked })
                  }
                />
                Включён
              </label>
              <button
                type="button"
                className="admin-btn admin-btn--sm admin-btn--danger"
                onClick={() => deleteStep(s.id)}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div className="admin-card">
        <div className="admin-header" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-condensed)" }}>
            Информационные блоки и преимущества
          </h2>
          <div className="admin-actions">
            <button
              type="button"
              className="admin-btn"
              onClick={() => saveBenefit({ block_group: "info_boxes", title: "Новый" })}
            >
              + Info
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={() => saveBenefit({ block_group: "advantages", title: "Новое преимущество" })}
            >
              + Advantage
            </button>
          </div>
        </div>
        {benefits.map((b) => (
          <div
            key={b.id}
            style={{ borderTop: "1px solid #eee", paddingTop: 10, marginTop: 10 }}
          >
            <div style={{ fontSize: 12, color: "#6b7280" }}>{b.block_group}</div>
            <input
              defaultValue={b.title}
              style={{ width: "100%", marginBottom: 6 }}
              onBlur={(e) => saveBenefit({ ...b, title: e.target.value })}
            />
            <textarea
              defaultValue={b.description || ""}
              style={{ width: "100%" }}
              onBlur={(e) => saveBenefit({ ...b, description: e.target.value })}
            />
            <div className="admin-grid-2" style={{ marginTop: 6 }}>
              <input
                defaultValue={b.icon_path || ""}
                placeholder="Иконка URL/path"
                onBlur={(e) => saveBenefit({ ...b, icon_path: e.target.value })}
              />
              <FileUploadButton
                bucket="site"
                folder="icons"
                label="Иконка"
                onUploaded={({ path, url }) =>
                  saveBenefit({ ...b, icon_path: url || path })
                }
              />
            </div>
            <div className="admin-grid-2" style={{ marginTop: 6 }}>
              <input
                defaultValue={b.link_url || ""}
                placeholder="Ссылка"
                onBlur={(e) => saveBenefit({ ...b, link_url: e.target.value })}
              />
              <input
                defaultValue={b.button_label || ""}
                placeholder="Текст кнопки"
                onBlur={(e) =>
                  saveBenefit({ ...b, button_label: e.target.value })
                }
              />
            </div>
            <div className="admin-actions" style={{ marginTop: 8 }}>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={b.is_visible}
                  onChange={(e) =>
                    saveBenefit({ ...b, is_visible: e.target.checked })
                  }
                />
                Включён
              </label>
              <button
                type="button"
                className="admin-btn admin-btn--sm admin-btn--danger"
                onClick={() => deleteBenefit(b.id)}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Banners */}
      <div className="admin-card">
        <div className="admin-header" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-condensed)" }}>
            Промо-баннеры / категории
          </h2>
          <div className="admin-actions">
            <button type="button" className="admin-btn" onClick={() => addBanner(1)}>
              + Ряд 1
            </button>
            <button type="button" className="admin-btn" onClick={() => addBanner(2)}>
              + Ряд 2
            </button>
          </div>
        </div>
        {banners.map((bn) => (
          <div
            key={bn.id}
            style={{ borderTop: "1px solid #eee", paddingTop: 10, marginTop: 10 }}
          >
            <div style={{ fontSize: 12 }}>Ряд {bn.row_index}</div>
            <input
              defaultValue={bn.title}
              style={{ width: "100%", marginBottom: 6 }}
              onBlur={(e) => saveBanner({ ...bn, title: e.target.value })}
            />
            <div className="admin-grid-2">
              <input
                defaultValue={bn.button_label}
                placeholder="Кнопка"
                onBlur={(e) =>
                  saveBanner({ ...bn, button_label: e.target.value })
                }
              />
              <input
                defaultValue={bn.link_url}
                placeholder="Ссылка"
                onBlur={(e) => saveBanner({ ...bn, link_url: e.target.value })}
              />
            </div>
            <div className="admin-actions" style={{ marginTop: 6 }}>
              <FileUploadButton
                bucket="site"
                folder="promo"
                onUploaded={({ path, url }) =>
                  saveBanner({ ...bn, image_path: url || path })
                }
              />
              <span style={{ fontSize: 12 }}>{bn.image_path}</span>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={bn.is_visible}
                  onChange={(e) =>
                    saveBanner({ ...bn, is_visible: e.target.checked })
                  }
                />
                Включён
              </label>
              <button
                type="button"
                className="admin-btn admin-btn--sm admin-btn--danger"
                onClick={() => deleteBanner(bn.id)}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: "#6b7280" }}>
        Отзывы редактируются в разделе «Отзывы». Контакты в блоке берутся из
        «Настройки» + заголовок/кнопка блока. Header/Footer/меню — «Меню» и
        «Настройки».
      </p>
      {editId ? null : null}
    </div>
  );
}
