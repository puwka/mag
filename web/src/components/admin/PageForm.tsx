"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type PageForm = {
  title: string;
  slug: string;
  content_html: string;
  template: string;
  status: "draft" | "published" | "archived";
  seo_title: string;
  seo_description: string;
  sort_order: number;
};

const TEMPLATES = [
  "default",
  "contact",
  "price_list",
  "partnership",
  "logo",
  "about",
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ё/g, "e")
    .replace(/[^a-z0-9а-я/\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PageForm({ pageId }: { pageId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<PageForm>({
    title: "",
    slug: "",
    content_html: "",
    template: "default",
    status: "draft",
    seo_title: "",
    seo_description: "",
    sort_order: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!pageId) return;
    const sb = createClient();
    sb.from("pages")
      .select("*")
      .eq("id", pageId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setForm({
          title: data.title,
          slug: data.slug,
          content_html: data.content_html || "",
          template: data.template || "default",
          status: data.status,
          seo_title: data.seo_title || "",
          seo_description: data.seo_description || "",
          sort_order: data.sort_order || 0,
        });
      });
  }, [pageId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const sb = createClient();
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      content_html: form.content_html,
      template: form.template,
      status: form.status,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      sort_order: form.sort_order,
      published_at:
        form.status === "published" ? new Date().toISOString() : null,
    };
    if (pageId) {
      const { error: ue } = await sb.from("pages").update(payload).eq("id", pageId);
      if (ue) setError(ue.message);
      else router.refresh();
    } else {
      const { data, error: ie } = await sb.from("pages").insert(payload).select("id").single();
      if (ie || !data) setError(ie?.message || "Ошибка");
      else router.push(`/admin/pages/${data.id}/`);
    }
    setPending(false);
  }

  async function remove() {
    if (!pageId || !confirm("Удалить страницу?")) return;
    const sb = createClient();
    await sb.from("pages").delete().eq("id", pageId);
    router.push("/admin/pages/");
  }

  return (
    <form className="admin-form admin-form--wide" onSubmit={save}>
      <div className="admin-grid-2">
        <div className="admin-field">
          <label>Заголовок *</label>
          <input
            required
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({
                ...f,
                title,
                slug: pageId ? f.slug : slugify(title),
              }));
            }}
          />
        </div>
        <div className="admin-field">
          <label>Slug *</label>
          <input
            required
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
        </div>
      </div>
      <div className="admin-grid-2">
        <div className="admin-field">
          <label>Шаблон</label>
          <select
            value={form.template}
            onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <label>Статус</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as PageForm["status"],
              }))
            }
          >
            <option value="draft">Скрыта (draft)</option>
            <option value="published">Опубликована</option>
            <option value="archived">Архив</option>
          </select>
        </div>
      </div>
      <div className="admin-field">
        <label>Контент</label>
        <RichTextEditor
          value={form.content_html}
          onChange={(html) => setForm((f) => ({ ...f, content_html: html }))}
        />
      </div>
      <div className="admin-grid-2">
        <div className="admin-field">
          <label>SEO title</label>
          <input
            value={form.seo_title}
            onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
          />
        </div>
        <div className="admin-field">
          <label>SEO description</label>
          <input
            value={form.seo_description}
            onChange={(e) =>
              setForm((f) => ({ ...f, seo_description: e.target.value }))
            }
          />
        </div>
      </div>
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-actions">
        <button className="admin-btn admin-btn--primary" disabled={pending}>
          Сохранить
        </button>
        {pageId ? (
          <>
            <button
              type="button"
              className="admin-btn"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  status: f.status === "published" ? "draft" : "published",
                }))
              }
            >
              {form.status === "published" ? "Скрыть" : "Опубликовать"}
            </button>
            <button type="button" className="admin-btn admin-btn--danger" onClick={remove}>
              Удалить
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}
