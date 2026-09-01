/**
 * Export original (unprocessed) product photos to product-photos-original/
 * Copies from original/ or downloads from vitex37.ru — no cleaning/editing.
 *
 * Usage: npx tsx scripts/export-original-product-photos.ts
 */
import { createClient } from "@supabase/supabase-js";
import {
  readFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
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

const OUT = resolve(process.cwd(), "product-photos-original");
const ORIGINAL = resolve(process.cwd(), "original");
const ORIGINAL_MANIFEST = resolve(ORIGINAL, "manifest.json");

/** Original vitex URLs per product slug (from seed) */
const SEED_IMAGES: Record<string, { primary: string; gallery?: string }> = {
  "perchatki-rabochie-4-nitka-h-b": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/09/10-klass-4-h-nitka-2026-2.jpg",
    gallery: "https://vitex37.ru/wp-content/uploads/2021/12/Nanesenie-PVH2.png",
  },
  "perchatki-rabochie-5-nitka-hb-seriya-lajt": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/09/10-klass-5-h-nitka-2026-1.jpg",
  },
  "perchatki-rabochie-5-nitka-hb-chjornaya-seriya-lajt": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/11/10-klass-5-h-nitka-2026-4.jpg",
  },
  "perchatki-rabochie-5-nitka-hb-grafit-seriya-lajt": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/11/10-klass-5-h-nitka-2026-5.jpg",
  },
  "perchatki-rabochie-5-nitka-h-b": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/09/10-klass-5-h-nitka-2026-6.jpg",
  },
  "perchatki-h-b-6-nitka-standart-10kl": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2024/06/10-klass-6-h-nitka-2026-1.jpg",
  },
  "perchatki-rabochie-5-nitka-h-b-grafit": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/11/10-klass-5-h-nitka-2026-7.jpg",
  },
  "perchatki-rabochie-5-nitka-h-b-berezka": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/11/10-klass-5-h-nitka-2026-8.jpg",
  },
  "perchatki-rabochie-h-b-6-nitka-10-kl-belyj": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2024/06/10-klass-6-h-nitka-2026-2.jpg",
  },
  "perchatki-rabochie-8-nitka-h-b": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/10/7-klass-8-h-nitka-2026-1.jpg",
  },
  "perchatki-belye-s-pvh-tochka": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2022/05/hb-pvh-4-nitka-1-2026.jpg",
    gallery: "https://vitex37.ru/wp-content/uploads/2021/12/Nanesenie-PVH2.png",
  },
  "perchatki-4n-grafit-tochka": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/11/10-klass-5-h-nitka-2026-5.jpg",
  },
  "perchatki-rabochie-5-nitka-s-pvh-tochka": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2022/05/hb-pvh-4-nitka-1-2026.jpg",
  },
  "perchatki-rabochie-5-nitka-s-pvh-volna-belyj": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/12/Nanesenie-PVH2.png",
  },
  "perchatki-rabochie-5-nitka-s-pvh-kirpich-chjornyj": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2024/06/hb-pvh-4-nitka-2-2026.jpg",
  },
  "perchatki-rabochie-3-nitka-h-b": {
    primary:
      "https://vitex37.ru/wp-content/uploads/2021/09/10-klass-4-h-nitka-2026-2.jpg",
  },
  "polusherstyanye-perchatki-standart": {
    primary: "https://vitex37.ru/wp-content/uploads/2022/12/p-sh-1024x1024.png",
  },
  "rukavicy-brezentovye-pl-400gr": {
    primary: "https://vitex37.ru/wp-content/uploads/2026/01/rucav-pvh-cat.png",
  },
  "vafelnoe-polotno-80-sm-otbelennoe-pl-140-g-m": {
    primary: "https://vitex37.ru/wp-content/uploads/2022/12/polotno-vaf.jpg",
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

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
    return buf.length >= 500 ? buf : null;
  } catch (e) {
    console.warn(`  Error ${src}:`, e);
    return null;
  }
}

type ManifestEntry = {
  file: string;
  source: string;
  alt: string | null;
  product_id: string;
};

function buildSourceToFile(): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(ORIGINAL_MANIFEST)) return map;

  const entries: ManifestEntry[] = JSON.parse(readFileSync(ORIGINAL_MANIFEST, "utf8"));
  for (const e of entries) {
    const local = resolve(ORIGINAL, e.file);
    if (!existsSync(local)) continue;
    map.set(e.source, local);
    map.set(e.source.split("?")[0], local);
  }
  return map;
}

function resolveOriginalUrl(
  slug: string,
  storagePath: string,
  isPrimary: boolean,
  sortOrder: number
): string | null {
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }

  const seed = SEED_IMAGES[slug];
  if (!seed) return null;

  if (isPrimary) return seed.primary;
  if (sortOrder === 1 && seed.gallery) return seed.gallery;
  return seed.primary;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(ORIGINAL, { recursive: true });

  const sourceToFile = buildSourceToFile();
  const exportManifest: Record<string, unknown>[] = [];

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

  let i = 0;
  for (const row of rows ?? []) {
    const product = row.products as { name: string; slug: string } | null;
    const slug = product?.slug ?? row.product_id;
    const productName = product?.name ?? row.alt ?? slug;
    const storagePath = row.storage_path as string;

    const originalUrl = resolveOriginalUrl(
      slug,
      storagePath,
      row.is_primary,
      row.sort_order
    );
    if (!originalUrl) {
      console.warn(`Skip (no original URL): ${slug} — ${storagePath}`);
      continue;
    }

    const localOriginal =
      sourceToFile.get(originalUrl) ?? sourceToFile.get(originalUrl.split("?")[0]);

    let ext = extname(localOriginal ?? originalUrl) || ".jpg";
    const altSlug = slugify(row.alt ?? productName);
    const role = row.is_primary ? "primary" : `gallery-${row.sort_order}`;
    const outName = `${slug}__${role}__${altSlug}${ext}`;
    const outPath = resolve(OUT, outName);

    if (localOriginal) {
      copyFileSync(localOriginal, outPath);
      console.log(`+ ${outName}  (copy original/${basename(localOriginal)})`);
    } else {
      const fileName = safeName(originalUrl, i++);
      const cachePath = resolve(ORIGINAL, fileName);
      let buf: Buffer | null = null;

      if (existsSync(cachePath)) {
        buf = readFileSync(cachePath);
      } else {
        console.log(`Download ${basename(originalUrl)} …`);
        buf = await fetchImage(originalUrl);
        if (buf) writeFileSync(cachePath, buf);
      }

      if (!buf) {
        console.warn(`Skip (download failed): ${slug} — ${originalUrl}`);
        continue;
      }

      writeFileSync(outPath, buf);
      console.log(`+ ${outName}  (downloaded)`);
    }

    exportManifest.push({
      file: outName,
      product_slug: slug,
      product_name: productName,
      alt: row.alt,
      is_primary: row.is_primary,
      sort_order: row.sort_order,
      original_url: originalUrl,
      db_storage_path: storagePath,
    });
  }

  writeFileSync(resolve(OUT, "manifest.json"), JSON.stringify(exportManifest, null, 2));
  console.log(`\nDone: ${exportManifest.length} originals → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
