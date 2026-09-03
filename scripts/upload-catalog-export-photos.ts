/**
 * Upload edited photos from catalog-export/ into Supabase Storage
 * and replace product_images for matching slugs.
 *
 * Usage: npx tsx scripts/upload-catalog-export-photos.ts
 */
import { createClient } from "@supabase/supabase-js";
import {
  readFileSync,
  existsSync,
  readdirSync,
  writeFileSync,
  statSync,
} from "fs";
import { resolve, extname, join } from "path";

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

const ROOT = resolve(process.cwd(), "catalog-export", "products");
const BUCKET = "products";
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function mimeForExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

function listProductFolders(): string[] {
  if (!existsSync(ROOT)) {
    console.error("Missing folder:", ROOT);
    process.exit(1);
  }
  return readdirSync(ROOT)
    .filter((name) => {
      try {
        return statSync(join(ROOT, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

function listImages(slug: string): string[] {
  const dir = join(ROOT, slug, "images");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
    .sort()
    .map((f) => join(dir, f));
}

async function main() {
  const folders = listProductFolders();
  console.log(`Found ${folders.length} product folders in catalog-export`);

  const { data: products, error } = await sb
    .from("products")
    .select("id, slug, name");
  if (error) {
    console.error(error);
    process.exit(1);
  }

  const bySlug = new Map((products ?? []).map((p) => [p.slug, p]));
  const report: {
    slug: string;
    status: string;
    storage_paths?: string[];
    error?: string;
  }[] = [];

  let ok = 0;
  let missing = 0;
  let failed = 0;

  for (let i = 0; i < folders.length; i++) {
    const slug = folders[i];
    const product = bySlug.get(slug);
    const images = listImages(slug);

    if (!product) {
      console.log(`[${i + 1}/${folders.length}] SKIP no DB product: ${slug}`);
      report.push({ slug, status: "no_product" });
      missing++;
      continue;
    }
    if (!images.length) {
      console.log(`[${i + 1}/${folders.length}] SKIP no images: ${slug}`);
      report.push({ slug, status: "no_images" });
      missing++;
      continue;
    }

    process.stdout.write(
      `[${i + 1}/${folders.length}] ${slug} (${images.length} imgs)… `
    );

    try {
      const storagePaths: string[] = [];
      for (let j = 0; j < images.length; j++) {
        const localPath = images[j];
        const ext = extname(localPath).toLowerCase() || ".jpg";
        const storagePath = `catalog/${slug}/0${j + 1}${ext}`;
        const body = readFileSync(localPath);
        const { error: upErr } = await sb.storage
          .from(BUCKET)
          .upload(storagePath, body, {
            contentType: mimeForExt(ext),
            upsert: true,
          });
        if (upErr) throw new Error(`upload ${storagePath}: ${upErr.message}`);
        storagePaths.push(storagePath);
      }

      await sb.from("product_images").delete().eq("product_id", product.id);
      const { error: insErr } = await sb.from("product_images").insert(
        storagePaths.map((storage_path, sort_order) => ({
          product_id: product.id,
          storage_path,
          alt: product.name,
          sort_order,
          is_primary: sort_order === 0,
        }))
      );
      if (insErr) throw new Error(`db insert: ${insErr.message}`);

      console.log("ok");
      report.push({ slug, status: "ok", storage_paths: storagePaths });
      ok++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log("FAIL", msg);
      report.push({ slug, status: "fail", error: msg });
      failed++;
    }
  }

  const out = resolve(process.cwd(), "catalog-export", "upload-report.json");
  writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nDone. ok=${ok} missing=${missing} failed=${failed}`);
  console.log(`Report: ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
