/**
 * Export all products from Supabase into catalog-export/
 * - catalog.json / catalog.csv — полный список
 * - products/{slug}/info.json + images/
 *
 * Usage: npx tsx scripts/export-catalog-folder.ts
 */
import { createClient } from "@supabase/supabase-js";
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import { resolve, extname, basename } from "path";

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    readFileSync(p, "utf8")
      .split(/\r?\n/)
      .forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const eq = trimmed.indexOf("=");
        if (eq === -1) return;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      });
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const OUT = resolve(process.cwd(), "catalog-export");
const PRODUCTS_DIR = resolve(OUT, "products");

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function download(src: string): Promise<Buffer | null> {
  try {
    if (src.startsWith("http")) {
      const res = await fetch(src, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; XBTexExport/1.0)" },
      });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    // storage path in products bucket
    const { data, error } = await sb.storage.from("products").download(src);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  } catch {
    return null;
  }
}

async function main() {
  ensureDir(OUT);
  ensureDir(PRODUCTS_DIR);

  console.log("Loading products…");
  const { data: products, error } = await sb
    .from("products")
    .select(
      "id, slug, name, sku, short_description, description, status, stock_status, stock_label, pack_price, pairs_per_pack, price_per_pair, price_on_request, menu_order, seo_title, seo_description, created_at"
    )
    .order("menu_order", { ascending: true });

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const list = products ?? [];
  console.log(`Found ${list.length} products`);

  const { data: images } = await sb
    .from("product_images")
    .select("product_id, storage_path, alt, sort_order, is_primary")
    .order("sort_order", { ascending: true });

  const { data: links } = await sb
    .from("product_categories")
    .select("product_id, category_id, categories(path, name)");

  const imagesByProduct = new Map<string, typeof images>();
  for (const img of images ?? []) {
    const arr = imagesByProduct.get(img.product_id) ?? [];
    arr.push(img);
    imagesByProduct.set(img.product_id, arr);
  }

  const catsByProduct = new Map<string, { path: string; name: string }[]>();
  for (const row of links ?? []) {
    const cat = row.categories as unknown as { path: string; name: string } | null;
    if (!cat) continue;
    const arr = catsByProduct.get(row.product_id) ?? [];
    arr.push(cat);
    catsByProduct.set(row.product_id, arr);
  }

  const catalog: Record<string, unknown>[] = [];

  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const imgs = imagesByProduct.get(p.id) ?? [];
    const cats = catsByProduct.get(p.id) ?? [];
    const leaf =
      [...cats].sort((a, b) => b.path.length - a.path.length)[0] || null;

    const folder = resolve(PRODUCTS_DIR, p.slug);
    const imgDir = resolve(folder, "images");
    ensureDir(folder);
    ensureDir(imgDir);

    const savedImages: string[] = [];
    for (let j = 0; j < imgs.length; j++) {
      const src = imgs[j].storage_path;
      const buf = await download(src);
      if (!buf) {
        console.warn(`  no image: ${p.slug} ← ${src}`);
        continue;
      }
      let ext = extname(src.startsWith("http") ? new URL(src).pathname : src) || ".jpg";
      if (!/^\.(jpe?g|png|webp|gif)$/i.test(ext)) ext = ".jpg";
      const fileName = `${String(j + 1).padStart(2, "0")}${ext.toLowerCase()}`;
      writeFileSync(resolve(imgDir, fileName), buf);
      savedImages.push(`images/${fileName}`);
    }

    const info = {
      ...p,
      category_path: leaf?.path ?? null,
      category_name: leaf?.name ?? null,
      categories: cats,
      image_urls: imgs.map((x) => x.storage_path),
      local_images: savedImages,
    };

    writeFileSync(
      resolve(folder, "info.json"),
      JSON.stringify(info, null, 2),
      "utf8"
    );

    catalog.push({
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      status: p.status,
      stock_status: p.stock_status,
      pack_price: p.pack_price,
      price_per_pair: p.price_per_pair,
      pairs_per_pack: p.pairs_per_pack,
      price_on_request: p.price_on_request,
      category_path: leaf?.path ?? "",
      category_name: leaf?.name ?? "",
      images_count: savedImages.length,
      folder: `products/${p.slug}`,
    });

    console.log(
      `[${i + 1}/${list.length}] ${p.slug} — ${savedImages.length} photo(s)`
    );
  }

  writeFileSync(
    resolve(OUT, "catalog.json"),
    JSON.stringify(catalog, null, 2),
    "utf8"
  );

  const headers = [
    "slug",
    "name",
    "sku",
    "status",
    "stock_status",
    "pack_price",
    "price_per_pair",
    "pairs_per_pack",
    "price_on_request",
    "category_path",
    "category_name",
    "images_count",
    "folder",
  ];
  const csv = [
    headers.join(","),
    ...catalog.map((row) =>
      headers.map((h) => csvEscape((row as Record<string, unknown>)[h])).join(",")
    ),
  ].join("\n");
  writeFileSync(resolve(OUT, "catalog.csv"), "\uFEFF" + csv, "utf8");

  writeFileSync(
    resolve(OUT, "README.txt"),
    [
      "Экспорт каталога ХБтекс",
      `Дата: ${new Date().toISOString()}`,
      `Товаров: ${catalog.length}`,
      "",
      "catalog.json  — краткий список",
      "catalog.csv   — таблица (Excel)",
      "products/     — папка на каждый товар:",
      "  {slug}/info.json  — полные данные",
      "  {slug}/images/    — фото",
      "",
    ].join("\n"),
    "utf8"
  );

  console.log(`\nDone → ${OUT}`);
  console.log(`Products: ${catalog.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
