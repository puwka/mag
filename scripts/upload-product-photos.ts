/**
 * Upload product photos to Supabase Storage and update ALL product_images rows.
 * Resolves vitex URLs via product-photos/manifest.json and slug-matched files.
 *
 * Usage: npx tsx scripts/upload-product-photos.ts
 *        npx tsx scripts/upload-product-photos.ts --original
 *        PRODUCT_PHOTOS_DIR=product-photos-original npx tsx scripts/upload-product-photos.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, writeFileSync, readdirSync } from "fs";
import { resolve, extname, basename } from "path";

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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const ROOT = process.cwd();
const useOriginal =
  process.argv.includes("--original") ||
  process.env.PRODUCT_PHOTOS_DIR === "product-photos-original";
const PHOTOS = resolve(
  ROOT,
  process.env.PRODUCT_PHOTOS_DIR ?? (useOriginal ? "product-photos-original" : "product-photos")
);
const PHOTOS_MANIFEST = resolve(PHOTOS, "manifest.json");
const ORIGINAL_MANIFEST = resolve(ROOT, "original", "manifest.json");
const CLEAN = resolve(ROOT, "clean");
const ORIGINAL = resolve(ROOT, "original");
const BUCKET = "products";

type PhotosManifestEntry = {
  file: string;
  product_slug: string;
  storage_path: string;
};

type OriginalManifestEntry = {
  file: string;
  source: string;
};

function mimeForExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function isRemotePath(path: string): boolean {
  return path.startsWith("http://") || path.startsWith("https://");
}

/** Vitex URL sources per product (from seed) — used when DB already has catalog/ paths */
const SEED_IMAGES: Record<string, { primary: string; gallery?: string }> = {
  "perchatki-rabochie-4-nitka-h-b": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/09/10-klass-4-h-nitka-2026-2.jpg",
    gallery: "https://vitex37.ru/wp-content/uploads/2021/12/Nanesenie-PVH2.png",
  },
  "perchatki-rabochie-3-nitka-h-b": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/09/10-klass-4-h-nitka-2026-2.jpg",
  },
  "perchatki-belye-s-pvh-tochka": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2022/05/hb-pvh-4-nitka-1-2026.jpg",
    gallery: "https://vitex37.ru/wp-content/uploads/2021/12/Nanesenie-PVH2.png",
  },
  "perchatki-rabochie-5-nitka-s-pvh-tochka": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2022/05/hb-pvh-4-nitka-1-2026.jpg",
  },
  "perchatki-4n-grafit-tochka": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/11/10-klass-5-h-nitka-2026-5.jpg",
  },
};

const GALLERY_NANESENIE =
  "https://vitex37.ru/wp-content/uploads/2021/12/Nanesenie-PVH2.png";

function buildUrlToLocalFile(): Map<string, string> {
  const map = new Map<string, string>();

  const add = (remote: string, local: string | null, force = false) => {
    if (!remote || !local || !existsSync(local)) return;
    const base = remote.split("?")[0];
    if (!force && map.has(remote)) return;
    map.set(remote, local);
    if (!map.has(base)) map.set(base, local);
  };

  if (existsSync(PHOTOS_MANIFEST)) {
    const entries: PhotosManifestEntry[] = JSON.parse(readFileSync(PHOTOS_MANIFEST, "utf8"));
    for (const e of entries) {
      add(e.storage_path, resolve(PHOTOS, e.file), true);
    }
  }

  // Cleaned «Nanesenie-PVH2» lives in the volna-belyj product photo
  const volnaPhoto = findPhotoBySlug("perchatki-rabochie-5-nitka-s-pvh-volna-belyj");
  if (volnaPhoto) {
    add(GALLERY_NANESENIE, volnaPhoto, true);
  }

  if (existsSync(ORIGINAL_MANIFEST)) {
    const entries: OriginalManifestEntry[] = JSON.parse(readFileSync(ORIGINAL_MANIFEST, "utf8"));
    for (const e of entries) {
      const candidates = [
        resolve(PHOTOS, e.file),
        resolve(CLEAN, e.file),
        resolve(ORIGINAL, e.file),
      ];
      const local = candidates.find((p) => existsSync(p)) ?? null;
      add(e.source, local);
    }
  }

  return map;
}

function resolveLocalFile(
  storagePath: string,
  slug: string,
  isPrimary: boolean,
  sortOrder: number,
  urlToLocal: Map<string, string>
): string | null {
  const fromDir = findPhotoBySlug(slug, isPrimary, sortOrder);
  if (fromDir) return fromDir;

  const seed = SEED_IMAGES[slug];
  const seedUrl = isPrimary
    ? seed?.primary
    : sortOrder === 1
      ? seed?.gallery
      : undefined;

  if (seedUrl) {
    const fromSeed = urlToLocal.get(seedUrl) ?? urlToLocal.get(seedUrl.split("?")[0]);
    if (fromSeed) return fromSeed;
  }

  if (isRemotePath(storagePath)) {
    const hit = urlToLocal.get(storagePath) ?? urlToLocal.get(storagePath.split("?")[0]);
    if (hit) return hit;
  }

  if (storagePath.startsWith("catalog/")) {
    const bySlug = findPhotoBySlug(slug, isPrimary, sortOrder);
    if (bySlug) return bySlug;
    if (seedUrl) {
      return urlToLocal.get(seedUrl) ?? urlToLocal.get(seedUrl.split("?")[0]) ?? null;
    }
  }

  return findPhotoBySlug(slug, isPrimary, sortOrder);
}

function findPhotoBySlug(
  slug: string,
  isPrimary?: boolean,
  sortOrder?: number
): string | null {
  if (!existsSync(PHOTOS)) return null;
  const files = readdirSync(PHOTOS).filter((f) => !f.endsWith(".json"));

  if (isPrimary !== undefined && sortOrder !== undefined) {
    const role = isPrimary ? "primary" : `gallery-${sortOrder}`;
    const exact = files.find((f) => f.startsWith(`${slug}__${role}__`));
    if (exact) return resolve(PHOTOS, exact);
  }

  const match = files.find((f) => f.startsWith(`${slug}__`));
  return match ? resolve(PHOTOS, match) : null;
}

function storagePathFor(slug: string, isPrimary: boolean, sortOrder: number, ext: string): string {
  if (isPrimary) return `catalog/${slug}${ext}`;
  return `catalog/${slug}-gallery-${sortOrder}${ext}`;
}

async function main() {
  console.log(`Source: ${PHOTOS}\n`);
  const urlToLocal = buildUrlToLocalFile();

  const { data: products, error: prodErr } = await sb.from("products").select("id, slug, name");
  if (prodErr || !products) {
    console.error(prodErr?.message ?? "No products");
    process.exit(1);
  }
  const byId = new Map(products.map((p) => [p.id, p]));

  const { data: images, error: imgErr } = await sb
    .from("product_images")
    .select("id, product_id, storage_path, alt, is_primary, sort_order")
    .order("product_id")
    .order("sort_order");

  if (imgErr || !images) {
    console.error(imgErr?.message ?? "No images");
    process.exit(1);
  }

  const results: {
    slug: string;
    role: string;
    from: string;
    path: string;
    ok: boolean;
    error?: string;
  }[] = [];

  for (const img of images) {
    const product = byId.get(img.product_id);
    if (!product) continue;

    const local = resolveLocalFile(
      img.storage_path,
      product.slug,
      img.is_primary,
      img.sort_order,
      urlToLocal
    );
    if (!local) {
      console.warn(`Skip (no local file): ${product.slug} ← ${img.storage_path}`);
      results.push({
        slug: product.slug,
        role: img.is_primary ? "primary" : `gallery-${img.sort_order}`,
        from: img.storage_path,
        path: "",
        ok: false,
        error: "no local file",
      });
      continue;
    }

    const ext = extname(local) || extname(img.storage_path) || ".jpg";
    const dest = storagePathFor(product.slug, img.is_primary, img.sort_order, ext);
    const body = readFileSync(local);
    const contentType = mimeForExt(ext);

    const { error: upErr } = await sb.storage.from(BUCKET).upload(dest, body, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    });

    if (upErr) {
      console.error(`Upload failed ${product.slug}:`, upErr.message);
      results.push({
        slug: product.slug,
        role: img.is_primary ? "primary" : `gallery-${img.sort_order}`,
        from: basename(local),
        path: dest,
        ok: false,
        error: upErr.message,
      });
      continue;
    }

    const { error: updErr } = await sb
      .from("product_images")
      .update({
        storage_path: dest,
        alt: img.alt || product.name,
      })
      .eq("id", img.id);

    if (updErr) {
      console.error(`DB update failed ${product.slug}:`, updErr.message);
      results.push({
        slug: product.slug,
        role: img.is_primary ? "primary" : `gallery-${img.sort_order}`,
        from: basename(local),
        path: dest,
        ok: false,
        error: updErr.message,
      });
      continue;
    }

    const role = img.is_primary ? "primary" : `gallery-${img.sort_order}`;
    console.log(`+ ${product.slug} [${role}] ← ${basename(local)} → ${dest}`);
    results.push({
      slug: product.slug,
      role,
      from: basename(local),
      path: dest,
      ok: true,
    });
  }

  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  console.log(`\nDone: ${ok}/${results.length} images updated, ${fail} failed`);

  writeFileSync(
    resolve(PHOTOS, "upload-report.json"),
    JSON.stringify({ uploaded_at: new Date().toISOString(), bucket: BUCKET, results }, null, 2)
  );

  // Re-audit
  const { data: after } = await sb.from("product_images").select("storage_path, products(slug)");
  const oldLeft = (after ?? []).filter(
    (r) =>
      r.storage_path.includes("vitex") || r.storage_path.includes("wp-content")
  );
  if (oldLeft.length) {
    console.warn(`\nStill on vitex (${oldLeft.length}):`);
    oldLeft.forEach((r) =>
      console.warn(`  ${(r.products as { slug: string })?.slug}: ${r.storage_path}`)
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
