/**
 * Download all unique product image URLs from Supabase into original/
 * Usage: npx tsx scripts/download-product-images.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, basename } from "path";
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
  console.error("Missing env");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const ORIGINAL = resolve(process.cwd(), "original");
const MANIFEST = resolve(process.cwd(), "original", "manifest.json");

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

async function fetchImage(src: string): Promise<Buffer | null> {
  try {
    const res = await fetch(src, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://vitex37.ru/",
      },
    });
    if (!res.ok) {
      console.warn(`  HTTP ${res.status} ${src}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) return null;
    return buf;
  } catch (e) {
    console.warn(`  Error ${src}:`, e);
    return null;
  }
}

async function main() {
  mkdirSync(ORIGINAL, { recursive: true });

  const { data: rows, error } = await sb
    .from("product_images")
    .select("storage_path, alt, product_id, is_primary");
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const supabaseBase = `${url}/storage/v1/object/public/products/`;
  const seen = new Set<string>();
  const manifest: {
    file: string;
    source: string;
    alt: string | null;
    product_id: string;
  }[] = [];

  let i = 0;
  for (const row of rows ?? []) {
    const path = row.storage_path as string;
    if (!path || seen.has(path)) continue;
    seen.add(path);

    const fileName = safeName(path, i++);
    const outPath = resolve(ORIGINAL, fileName);

    let src = path;
    if (!path.startsWith("http")) {
      src = supabaseBase + path.replace(/^\//, "");
    }

    if (existsSync(outPath)) {
      console.log(`Skip (exists) ${fileName}`);
      manifest.push({
        file: fileName,
        source: path,
        alt: row.alt,
        product_id: row.product_id,
      });
      continue;
    }

    console.log(`Download ${fileName} …`);
    const buf = await fetchImage(src);
    if (!buf) continue;
    writeFileSync(outPath, buf);
    manifest.push({
      file: fileName,
      source: path,
      alt: row.alt,
      product_id: row.product_id,
    });
  }

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`Done: ${manifest.length} images in ${ORIGINAL}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
