/**
 * Export all product photos to product-photos/
 * Prefers cleaned versions from clean/ when available.
 *
 * Usage: npx tsx scripts/export-product-photos.ts
 */
import { createClient } from "@supabase/supabase-js";
import {
  readFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readdirSync,
} from "fs";
import { resolve, extname, basename } from "path";
import { createHash } from "crypto";

function loadEnv() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
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
      process.env[key] = val;
    });
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const OUT = resolve(process.cwd(), "product-photos");
const CLEAN = resolve(process.cwd(), "clean");
const ORIGINAL = resolve(process.cwd(), "original");
const MANIFEST_PATH = resolve(ORIGINAL, "manifest.json");

function safeName(storagePath: string, index: number): string {
  if (storagePath.startsWith("http")) {
    const base = basename(new URL(storagePath).pathname);
    const hash = createHash("md5").update(storagePath).digest("hex").slice(0, 8);
    const dot = base.lastIndexOf(".");
    if (dot > 0) return `${base.slice(0, dot)}-${hash}${base.slice(dot)}`;
    return `${base}-${hash}.jpg`;
  }
  return basename(storagePath) || `product-${index}.jpg`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function fetchImage(src: string): Promise<Buffer | null> {
  try {
    const res = await fetch(src, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; XBTexExport/1.0)",
        Accept: "image/*",
      },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length >= 500 ? buf : null;
  } catch {
    return null;
  }
}

type ManifestEntry = {
  file: string;
  source: string;
  alt: string | null;
  product_id: string;
};

async function main() {
  mkdirSync(OUT, { recursive: true });

  const manifest: ManifestEntry[] = existsSync(MANIFEST_PATH)
    ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
    : [];

  const fileBySource = new Map<string, string>();
  const fileByProductAlt = new Map<string, string>();
  for (const m of manifest) {
    fileBySource.set(m.source, m.file);
    fileByProductAlt.set(`${m.product_id}::${m.alt ?? ""}`, m.file);
  }

  const { data: rows, error } = await sb
    .from("product_images")
    .select(
      "id, storage_path, alt, is_primary, sort_order, product_id, products(name, slug)"
    )
    .order("product_id")
    .order("is_primary", { ascending: false })
    .order("sort_order");

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const supabaseBase = `${url}/storage/v1/object/public/products/`;
  const seen = new Set<string>();
  const exportManifest: Record<string, unknown>[] = [];
  let i = 0;

  for (const row of rows ?? []) {
    const path = row.storage_path as string;
    if (!path || seen.has(path)) continue;
    seen.add(path);

    const product = row.products as { name: string; slug: string } | null;
    const slug = product?.slug ?? row.product_id;
    const productName = product?.name ?? row.alt ?? slug;
    const localName =
      fileBySource.get(path) ??
      fileByProductAlt.get(`${row.product_id}::${row.alt ?? ""}`) ??
      safeName(path, i++);

    let srcBuf: Buffer | null = null;
    let source: "clean" | "original" | "remote" = "remote";

    const cleanPath = resolve(CLEAN, localName);
    const originalPath = resolve(ORIGINAL, localName);

    if (existsSync(cleanPath)) {
      srcBuf = readFileSync(cleanPath);
      source = "clean";
    } else if (existsSync(originalPath)) {
      srcBuf = readFileSync(originalPath);
      source = "original";
    } else {
      let src = path;
      if (!path.startsWith("http")) {
        src = supabaseBase + path.replace(/^\//, "");
      }
      srcBuf = await fetchImage(src);
    }

    if (!srcBuf) {
      console.warn(`Skip (no file): ${productName} — ${path}`);
      continue;
    }

    const ext = extname(localName) || extname(path) || ".jpg";
    const altSlug = slugify(row.alt ?? productName);
    const primary = row.is_primary ? "primary" : "gallery";
    const outName = `${slug}__${primary}__${altSlug}${ext}`;
    const outPath = resolve(OUT, outName);

    writeFileSync(outPath, srcBuf);
    console.log(`+ ${outName}  (${source})`);

    exportManifest.push({
      file: outName,
      product_slug: slug,
      product_name: productName,
      alt: row.alt,
      is_primary: row.is_primary,
      storage_path: path,
      source,
    });
  }

  writeFileSync(
    resolve(OUT, "manifest.json"),
    JSON.stringify(exportManifest, null, 2)
  );

  console.log(`\nDone: ${exportManifest.length} photos → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
