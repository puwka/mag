import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const p = resolve(process.cwd(), ".env.local");
  readFileSync(p, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eq = trimmed.indexOf("=");
      if (eq === -1) return;
      process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    });
}

loadEnv();

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const { data: products } = await sb
    .from("products")
    .select("id, slug, name")
    .order("name");
  const { data: images } = await sb
    .from("product_images")
    .select("id, product_id, storage_path, is_primary, sort_order")
    .order("product_id")
    .order("sort_order");

  const byProd = new Map<string, typeof images>();
  for (const img of images ?? []) {
    const list = byProd.get(img.product_id) ?? [];
    list.push(img);
    byProd.set(img.product_id, list);
  }

  const oldUrls: string[] = [];
  for (const p of products ?? []) {
    const imgs = byProd.get(p.id) ?? [];
    console.log(`--- ${p.slug} (${p.name})`);
    if (!imgs.length) console.log("  NO IMAGES");
    for (const i of imgs) {
      const old =
        i.storage_path.includes("vitex") || i.storage_path.includes("wp-content");
      const tag = i.is_primary ? "[P]" : "[G]";
      console.log(`  ${tag} ${old ? "OLD" : "new"} ${i.storage_path}`);
      if (old) oldUrls.push(`${p.slug}: ${i.storage_path}`);
    }
  }
  console.log(`\nProducts: ${products?.length}, Images: ${images?.length}, Old URLs: ${oldUrls.length}`);
  if (oldUrls.length) {
    console.log("\nStill on vitex:");
    oldUrls.forEach((u) => console.log(" ", u));
  }
}

main();
