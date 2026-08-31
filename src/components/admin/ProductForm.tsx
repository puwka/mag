"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { FileUploadButton } from "@/components/admin/FileUpload";
import { mediaUrl } from "@/lib/media";

type Category = { id: string; name: string; path: string };
type AttrValue = {
  id: string;
  slug: string;
  name: string;
  attribute_id: string;
  attributes?: { slug: string; name: string } | null;
};
type ImageRow = {
  id?: string;
  storage_path: string;
  alt: string;
  sort_order: number;
  is_primary: boolean;
};

type FormState = {
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  description: string;
  status: "draft" | "published" | "archived";
  stock_status: "in_stock" | "on_order" | "out_of_stock";
  stock_label: string;
  pack_price: string;
  pairs_per_pack: string;
  price_per_pair: string;
  price_on_request: boolean;
  weight_grams: string;
  is_featured: boolean;
  menu_order: string;
  seo_title: string;
  seo_description: string;
  categoryIds: string[];
  attributeValueIds: string[];
  images: ImageRow[];
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

const empty: FormState = {
  name: "",
  slug: "",
  sku: "",
  short_description: "",
  description: "",
  status: "draft",
  stock_status: "in_stock",
  stock_label: "",
  pack_price: "",
  pairs_per_pack: "500",
  price_per_pair: "",
  price_on_request: false,
  weight_grams: "",
  is_featured: false,
  menu_order: "0",
  seo_title: "",
  seo_description: "",
  categoryIds: [],
  attributeValueIds: [],
  images: [],
};

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(empty);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attrValues, setAttrValues] = useState<AttrValue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(!!productId);

  const attrsGrouped = useMemo(() => {
    const map = new Map<string, { name: string; values: AttrValue[] }>();
    for (const v of attrValues) {
      const key = v.attributes?.slug || v.attribute_id;
      const name = v.attributes?.name || key;
      if (!map.has(key)) map.set(key, { name, values: [] });
      map.get(key)!.values.push(v);
    }
    return [...map.entries()];
  }, [attrValues]);

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const [{ data: cats }, { data: vals }] = await Promise.all([
        sb.from("categories").select("id, name, path").order("path"),
        sb
          .from("attribute_values")
          .select("id, slug, name, attribute_id, attributes(slug, name)")
          .order("sort_order"),
      ]);
      setCategories((cats as Category[]) ?? []);
      setAttrValues((vals as unknown as AttrValue[]) ?? []);

      if (!productId) {
        setLoading(false);
        return;
      }

      const { data: p, error: pe } = await sb
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      if (pe || !p) {
        setError(pe?.message || "Товар не найден");
        setLoading(false);
        return;
      }

      const [{ data: links }, { data: pav }, { data: imgs }] = await Promise.all([
        sb.from("product_categories").select("category_id").eq("product_id", productId),
        sb
          .from("product_attribute_values")
          .select("attribute_value_id")
          .eq("product_id", productId),
        sb
          .from("product_images")
          .select("id, storage_path, alt, sort_order, is_primary")
          .eq("product_id", productId)
          .order("sort_order"),
      ]);

      setForm({
        name: p.name,
        slug: p.slug,
        sku: p.sku || "",
        short_description: p.short_description || "",
        description: p.description || "",
        status: p.status,
        stock_status: p.stock_status,
        stock_label: p.stock_label || "",
        pack_price: p.pack_price != null ? String(p.pack_price) : "",
        pairs_per_pack: p.pairs_per_pack != null ? String(p.pairs_per_pack) : "",
        price_per_pair: p.price_per_pair != null ? String(p.price_per_pair) : "",
        price_on_request: !!p.price_on_request,
        weight_grams: p.weight_grams != null ? String(p.weight_grams) : "",
        is_featured: !!p.is_featured,
        menu_order: String(p.menu_order ?? 0),
        seo_title: p.seo_title || "",
        seo_description: p.seo_description || "",
        categoryIds: (links ?? []).map((l) => l.category_id),
        attributeValueIds: (pav ?? []).map((l) => l.attribute_value_id),
        images: (imgs as ImageRow[]) ?? [],
      });
      setLoading(false);
    })();
  }, [productId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setOk(null);
    const sb = createClient();

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      sku: form.sku.trim() || null,
      short_description: form.short_description || null,
      description: form.description || null,
      status: form.status,
      stock_status: form.stock_status,
      stock_label: form.stock_label || null,
      pack_price: form.price_on_request || !form.pack_price ? null : Number(form.pack_price),
      pairs_per_pack: form.pairs_per_pack ? Number(form.pairs_per_pack) : null,
      price_per_pair:
        form.price_on_request || !form.price_per_pair ? null : Number(form.price_per_pair),
      price_on_request: form.price_on_request,
      weight_grams: form.weight_grams ? Number(form.weight_grams) : null,
      is_featured: form.is_featured,
      menu_order: Number(form.menu_order) || 0,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      published_at:
        form.status === "published" ? new Date().toISOString() : null,
    };

    let id = productId;
    if (id) {
      const { error: ue } = await sb.from("products").update(payload).eq("id", id);
      if (ue) {
        setError(ue.message);
        setPending(false);
        return;
      }
    } else {
      const { data, error: ie } = await sb
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (ie || !data) {
        setError(ie?.message || "Ошибка создания");
        setPending(false);
        return;
      }
      id = data.id;
    }

    await sb.from("product_categories").delete().eq("product_id", id);
    if (form.categoryIds.length) {
      await sb.from("product_categories").insert(
        form.categoryIds.map((category_id, i) => ({
          product_id: id,
          category_id,
          sort_order: i,
        }))
      );
    }

    await sb.from("product_attribute_values").delete().eq("product_id", id);
    if (form.attributeValueIds.length) {
      await sb.from("product_attribute_values").insert(
        form.attributeValueIds.map((attribute_value_id) => ({
          product_id: id,
          attribute_value_id,
        }))
      );
    }

    await sb.from("product_images").delete().eq("product_id", id);
    if (form.images.length) {
      const imgs = form.images.map((img, i) => ({
        product_id: id,
        storage_path: img.storage_path,
        alt: img.alt || form.name,
        sort_order: i,
        is_primary: i === 0 ? true : !!img.is_primary && i === form.images.findIndex((x) => x.is_primary),
      }));
      // ensure exactly one primary
      const primaryIdx = Math.max(
        0,
        form.images.findIndex((x) => x.is_primary)
      );
      const normalized = form.images.map((img, i) => ({
        product_id: id!,
        storage_path: img.storage_path,
        alt: img.alt || form.name,
        sort_order: i,
        is_primary: i === (primaryIdx >= 0 ? primaryIdx : 0),
      }));
      void imgs;
      await sb.from("product_images").insert(normalized);
    }

    setOk("Сохранено");
    setPending(false);
    router.push(`/admin/products/${id}/`);
    router.refresh();
  }

  async function remove() {
    if (!productId || !confirm("Удалить товар безвозвратно?")) return;
    const sb = createClient();
    const { error: de } = await sb.from("products").delete().eq("id", productId);
    if (de) {
      setError(de.message);
      return;
    }
    router.push("/admin/products/");
    router.refresh();
  }

  if (loading) return <p>Загрузка…</p>;

  return (
    <form className="admin-form admin-form--wide" onSubmit={save}>
      <div className="admin-grid-2">
        <div className="admin-field">
          <label>Название *</label>
          <input
            required
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({
                ...f,
                name,
                slug: f.slug && productId ? f.slug : slugify(name),
              }));
            }}
          />
        </div>
        <div className="admin-field">
          <label>Slug *</label>
          <input required value={form.slug} onChange={(e) => set("slug", e.target.value)} />
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-field">
          <label>Артикул</label>
          <input value={form.sku} onChange={(e) => set("sku", e.target.value)} />
        </div>
        <div className="admin-field">
          <label>Порядок (menu_order)</label>
          <input
            type="number"
            value={form.menu_order}
            onChange={(e) => set("menu_order", e.target.value)}
          />
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-field">
          <label>Статус публикации</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as FormState["status"])}
          >
            <option value="draft">Черновик (скрыт)</option>
            <option value="published">Опубликован</option>
            <option value="archived">Архив</option>
          </select>
        </div>
        <div className="admin-field">
          <label>Наличие</label>
          <select
            value={form.stock_status}
            onChange={(e) =>
              set("stock_status", e.target.value as FormState["stock_status"])
            }
          >
            <option value="in_stock">В наличии</option>
            <option value="on_order">На заказ</option>
            <option value="out_of_stock">Нет в наличии</option>
          </select>
        </div>
      </div>

      <div className="admin-field">
        <label>Подпись наличия</label>
        <input
          value={form.stock_label}
          onChange={(e) => set("stock_label", e.target.value)}
          placeholder="В наличии / На заказ / Sold out"
        />
      </div>

      <div className="admin-grid-2">
        <div className="admin-field">
          <label>Цена упаковки, ₽</label>
          <input
            type="number"
            step="0.01"
            value={form.pack_price}
            onChange={(e) => set("pack_price", e.target.value)}
            disabled={form.price_on_request}
          />
        </div>
        <div className="admin-field">
          <label>Цена за пару, ₽</label>
          <input
            type="number"
            step="0.01"
            value={form.price_per_pair}
            onChange={(e) => set("price_per_pair", e.target.value)}
            disabled={form.price_on_request}
          />
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-field">
          <label>Пар в упаковке</label>
          <input
            type="number"
            value={form.pairs_per_pack}
            onChange={(e) => set("pairs_per_pack", e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label>Вес, г</label>
          <input
            type="number"
            value={form.weight_grams}
            onChange={(e) => set("weight_grams", e.target.value)}
          />
        </div>
      </div>

      <label className="admin-check">
        <input
          type="checkbox"
          checked={form.price_on_request}
          onChange={(e) => set("price_on_request", e.target.checked)}
        />
        Цена по запросу
      </label>
      <label className="admin-check">
        <input
          type="checkbox"
          checked={form.is_featured}
          onChange={(e) => set("is_featured", e.target.checked)}
        />
        Избранный / популярный
      </label>

      <div className="admin-field">
        <label>Краткое описание</label>
        <textarea
          value={form.short_description}
          onChange={(e) => set("short_description", e.target.value)}
        />
      </div>

      <div className="admin-field">
        <label>Описание</label>
        <RichTextEditor
          value={form.description}
          onChange={(html) => set("description", html)}
        />
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Категории</h3>
        <div style={{ display: "grid", gap: 6, maxHeight: 220, overflow: "auto" }}>
          {categories.map((c) => (
            <label key={c.id} className="admin-check">
              <input
                type="checkbox"
                checked={form.categoryIds.includes(c.id)}
                onChange={(e) => {
                  set(
                    "categoryIds",
                    e.target.checked
                      ? [...form.categoryIds, c.id]
                      : form.categoryIds.filter((id) => id !== c.id)
                  );
                }}
              />
              {c.path}
            </label>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Характеристики</h3>
        {attrsGrouped.map(([slug, group]) => (
          <div key={slug} style={{ marginBottom: 12 }}>
            <strong>{group.name}</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
              {group.values.map((v) => (
                <label key={v.id} className="admin-check">
                  <input
                    type="checkbox"
                    checked={form.attributeValueIds.includes(v.id)}
                    onChange={(e) => {
                      set(
                        "attributeValueIds",
                        e.target.checked
                          ? [...form.attributeValueIds, v.id]
                          : form.attributeValueIds.filter((id) => id !== v.id)
                      );
                    }}
                  />
                  {v.name}
                </label>
              ))}
            </div>
          </div>
        ))}
        {!attrsGrouped.length ? <p>Атрибуты ещё не созданы (запустите seed).</p> : null}
      </div>

      <div className="admin-card">
        <div className="admin-header" style={{ marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Изображения</h3>
          <FileUploadButton
            bucket="products"
            folder="catalog"
            onUploaded={({ path }) =>
              set("images", [
                ...form.images,
                {
                  storage_path: path.startsWith("http") ? path : path,
                  alt: form.name,
                  sort_order: form.images.length,
                  is_primary: form.images.length === 0,
                },
              ])
            }
          />
        </div>
        <div className="admin-field">
          <label>Или URL изображения</label>
          <input
            placeholder="https://..."
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const v = (e.target as HTMLInputElement).value.trim();
              if (!v) return;
              set("images", [
                ...form.images,
                {
                  storage_path: v,
                  alt: form.name,
                  sort_order: form.images.length,
                  is_primary: form.images.length === 0,
                },
              ]);
              (e.target as HTMLInputElement).value = "";
            }}
          />
        </div>
        <div className="thumb-row">
          {form.images.map((img, i) => {
            const url = mediaUrl(img.storage_path, "products");
            return (
              <div key={`${img.storage_path}-${i}`} className="thumb-row__item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {url ? <img src={url} alt="" /> : null}
                <button
                  type="button"
                  className="admin-btn admin-btn--sm"
                  onClick={() =>
                    set(
                      "images",
                      form.images.map((x, j) => ({
                        ...x,
                        is_primary: j === i,
                      }))
                    )
                  }
                >
                  {img.is_primary ? "★ Главное" : "Главное"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--sm"
                  onClick={() => {
                    if (i === 0) return;
                    const next = [...form.images];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    set("images", next);
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--sm admin-btn--danger"
                  onClick={() =>
                    set(
                      "images",
                      form.images.filter((_, j) => j !== i)
                    )
                  }
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-field">
          <label>SEO title</label>
          <input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
        </div>
        <div className="admin-field">
          <label>SEO description</label>
          <input
            value={form.seo_description}
            onChange={(e) => set("seo_description", e.target.value)}
          />
        </div>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}
      {ok ? <p className="admin-ok">{ok}</p> : null}

      <div className="admin-actions">
        <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
          {pending ? "Сохранение…" : "Сохранить"}
        </button>
        {productId ? (
          <>
            <button
              type="button"
              className="admin-btn"
              onClick={() => {
                set("status", form.status === "published" ? "draft" : "published");
              }}
            >
              {form.status === "published" ? "Скрыть" : "Восстановить / опубликовать"}
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
