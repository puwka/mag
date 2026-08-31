"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FileUploadButton } from "@/components/admin/FileUpload";
import { mediaUrl } from "@/lib/media";

type Cat = {
  id?: string;
  parent_id: string | null;
  slug: string;
  path: string;
  name: string;
  description: string;
  image_path: string;
  seo_title: string;
  seo_description: string;
  status: "draft" | "published" | "archived";
  sort_order: number;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ё/g, "e")
    .replace(/[^a-z0-9а-я\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoryForm({ categoryId }: { categoryId?: string }) {
  const router = useRouter();
  const [parents, setParents] = useState<Cat[]>([]);
  const [form, setForm] = useState<Cat>({
    parent_id: null,
    slug: "",
    path: "",
    name: "",
    description: "",
    image_path: "",
    seo_title: "",
    seo_description: "",
    status: "draft",
    sort_order: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data } = await sb
        .from("categories")
        .select("id, name, path, parent_id, slug, description, image_path, seo_title, seo_description, status, sort_order")
        .order("path");
      setParents((data as Cat[]) ?? []);
      if (!categoryId) return;
      const row = (data as Cat[] | null)?.find((c) => c.id === categoryId);
      if (row) setForm({ ...row, description: row.description || "", image_path: row.image_path || "", seo_title: row.seo_title || "", seo_description: row.seo_description || "" });
    })();
  }, [categoryId]);

  function computePath(parentId: string | null, slug: string) {
    if (!parentId) return slug;
    const parent = parents.find((p) => p.id === parentId);
    return parent ? `${parent.path}/${slug}` : slug;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const sb = createClient();
    const slug = form.slug || slugify(form.name);
    const path = computePath(form.parent_id, slug);
    const payload = {
      parent_id: form.parent_id,
      slug,
      path,
      name: form.name.trim(),
      description: form.description || null,
      image_path: form.image_path || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      status: form.status,
      sort_order: Number(form.sort_order) || 0,
    };

    if (categoryId) {
      const { error: ue } = await sb.from("categories").update(payload).eq("id", categoryId);
      if (ue) {
        setError(ue.message);
        setPending(false);
        return;
      }
    } else {
      const { data, error: ie } = await sb.from("categories").insert(payload).select("id").single();
      if (ie || !data) {
        setError(ie?.message || "Ошибка");
        setPending(false);
        return;
      }
      router.push(`/admin/categories/${data.id}/`);
      router.refresh();
      return;
    }
    setPending(false);
    router.refresh();
  }

  async function remove() {
    if (!categoryId || !confirm("Удалить категорию?")) return;
    const sb = createClient();
    const { error: de } = await sb.from("categories").delete().eq("id", categoryId);
    if (de) setError(de.message);
    else {
      router.push("/admin/categories/");
      router.refresh();
    }
  }

  const img = mediaUrl(form.image_path, "categories") || mediaUrl(form.image_path, "site");

  return (
    <form className="admin-form" onSubmit={save}>
      <div className="admin-field">
        <label>Название *</label>
        <input
          required
          value={form.name}
          onChange={(e) => {
            const name = e.target.value;
            const slug = categoryId ? form.slug : slugify(name);
            setForm((f) => ({
              ...f,
              name,
              slug,
              path: computePath(f.parent_id, slug),
            }));
          }}
        />
      </div>
      <div className="admin-grid-2">
        <div className="admin-field">
          <label>Slug *</label>
          <input
            required
            value={form.slug}
            onChange={(e) => {
              const slug = e.target.value;
              setForm((f) => ({
                ...f,
                slug,
                path: computePath(f.parent_id, slug),
              }));
            }}
          />
        </div>
        <div className="admin-field">
          <label>Родитель (вложенность)</label>
          <select
            value={form.parent_id || ""}
            onChange={(e) => {
              const parent_id = e.target.value || null;
              setForm((f) => ({
                ...f,
                parent_id,
                path: computePath(parent_id, f.slug),
              }));
            }}
          >
            <option value="">— корень —</option>
            {parents
              .filter((p) => p.id !== categoryId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.path}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div className="admin-field">
        <label>Path (авто)</label>
        <input value={computePath(form.parent_id, form.slug)} readOnly />
      </div>
      <div className="admin-grid-2">
        <div className="admin-field">
          <label>Статус</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as Cat["status"] }))
            }
          >
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
            <option value="archived">Архив</option>
          </select>
        </div>
        <div className="admin-field">
          <label>Сортировка</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
            }
          />
        </div>
      </div>
      <div className="admin-field">
        <label>Описание</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div className="admin-field">
        <label>Изображение</label>
        <div className="admin-actions" style={{ marginBottom: 8 }}>
          <FileUploadButton
            bucket="categories"
            folder="cats"
            onUploaded={({ path, url }) =>
              setForm((f) => ({
                ...f,
                image_path: url && url.startsWith("http") && path.startsWith("http") ? path : path,
              }))
            }
          />
        </div>
        <input
          value={form.image_path}
          onChange={(e) => setForm((f) => ({ ...f, image_path: e.target.value }))}
          placeholder="path или URL"
        />
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" style={{ marginTop: 8, maxWidth: 160, borderRadius: 6 }} />
        ) : null}
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
            onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
          />
        </div>
      </div>
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-actions">
        <button className="admin-btn admin-btn--primary" disabled={pending}>
          Сохранить
        </button>
        {categoryId ? (
          <button type="button" className="admin-btn admin-btn--danger" onClick={remove}>
            Удалить
          </button>
        ) : null}
      </div>
    </form>
  );
}
