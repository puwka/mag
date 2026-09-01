/**
 * Replace «Рабочие перчатки» category image (remove Vitex perch-45).
 * Usage: npx tsx scripts/patch-category-rabochie-perchatki.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

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

const SLUG = "rabochie-perchatki";
const DEST = "rabochie-perchatki-v2.jpg";
const LOCAL = resolve(
  process.cwd(),
  "product-photos",
  "perchatki-rabochie-5-nitka-hb-chjornaya-seriya-lajt__primary__перчатки-хб-5-10-черная.jpg"
);

async function main() {
  if (!existsSync(LOCAL)) {
    console.error("Missing cleaned image:", LOCAL);
    process.exit(1);
  }

  const body = readFileSync(LOCAL);
  const { error: upErr } = await sb.storage.from("categories").upload(DEST, body, {
    contentType: "image/jpeg",
    cacheControl: "60",
    upsert: true,
  });
  if (upErr) {
    console.error("Upload:", upErr.message);
    process.exit(1);
  }

  const { error: dbErr } = await sb
    .from("categories")
    .update({ image_path: DEST })
    .eq("slug", SLUG);
  if (dbErr) {
    console.error("DB:", dbErr.message);
    process.exit(1);
  }

  console.log(`OK: ${SLUG} → categories/${DEST}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
