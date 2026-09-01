/**
 * Rebrand Vitex → ХБтекс (Orsk, xbtex.ru).
 * Usage: npx tsx scripts/rebrand-xbtex.ts
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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

function rebrandText(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/Витекс/gi, "ХБтекс")
    .replace(/VITEX/gi, "ХБтекс")
    .replace(/vitex37\.ru/gi, "xbtex.ru")
    .replace(/vitex37@mail\.ru/gi, "tarabanov.aleksandr@yandex.ru")
    .replace(/Ивановская обл\.,?\s*/gi, "")
    .replace(/Иваново/gi, "Орск")
    .replace(/Ярмарочная улица,?\s*18\/22/gi, "пр. Металлистов, 3")
    .replace(/ООО «ФАБРИКА ВИТЕКС»/gi, "ИП Тарабанов Александр Иванович")
    .replace(/3700000996/g, "563501659899");
}

const SETTINGS: { key: string; value: unknown }[] = [
  { key: "brand.name", value: "ХБтекс" },
  { key: "company.name", value: "ИП Тарабанов Александр Иванович" },
  { key: "company.inn", value: "563501659899" },
  { key: "company.address", value: "Орск, пр. Металлистов, 3" },
  {
    key: "company.footer_blurb",
    value: "Фабрика-производитель рабочих перчаток в Орске",
  },
  { key: "contacts.phones", value: ["+7 (922) 872-00-08"] },
  { key: "contacts.phones_display", value: ["+7 (922) 872-00-08"] },
  { key: "contacts.phones_tel", value: ["+79228720008"] },
  { key: "contacts.sales_phones", value: ["+7 (922) 872-00-08"] },
  { key: "contacts.email", value: "tarabanov.aleksandr@yandex.ru" },
  { key: "contacts.whatsapp", value: "79228720008" },
  { key: "social.vk", value: "" },
  { key: "social.youtube", value: "" },
  { key: "legal.copyright", value: "©2018-2026 ХБтекс. Все права защищены" },
  {
    key: "ui.whatsapp_message",
    value: "Добрый день, ХБтекс! Не смог дозвониться, прошу связаться со мной.",
  },
  {
    key: "seo.home_description",
    value:
      "Фабрика ХБтекс в Орске — производитель рабочих перчаток. Купить перчатки оптом напрямую с производства. Доставка по России.",
  },
  { key: "seo.site_url", value: "https://xbtex.ru" },
];

async function patchTextColumn(
  table: string,
  idCol: string,
  cols: string[],
  filter?: (row: Record<string, unknown>) => boolean
) {
  const { data, error } = await sb.from(table).select("*");
  if (error) throw error;
  for (const row of data ?? []) {
    if (filter && !filter(row)) continue;
    const patch: Record<string, string | null> = {};
    for (const col of cols) {
      const v = row[col];
      if (typeof v === "string" && v.length) {
        const next = rebrandText(v);
        if (next !== v) patch[col] = next;
      }
    }
    if (Object.keys(patch).length) {
      await sb.from(table).update(patch).eq(idCol, row[idCol]);
    }
  }
}

async function patchHomepageSections() {
  const { data } = await sb.from("homepage_sections").select("*");
  for (const row of data ?? []) {
    const patch: Record<string, unknown> = {};
    if (typeof row.title === "string") patch.title = rebrandText(row.title);
    if (typeof row.subtitle === "string") patch.subtitle = rebrandText(row.subtitle);
    if (typeof row.description === "string")
      patch.description = rebrandText(row.description);
    const cfg = row.config as Record<string, unknown> | null;
    if (cfg && typeof cfg === "object") {
      const next = { ...cfg };
      for (const k of ["html", "description", "image_alt", "button_label"]) {
        if (typeof next[k] === "string") next[k] = rebrandText(next[k] as string);
      }
      patch.config = next;
    }
    if (Object.keys(patch).length) {
      await sb.from("homepage_sections").update(patch).eq("id", row.id);
    }
  }
}

async function fixPriceTiers() {
  const { data: products } = await sb
    .from("products")
    .select("id, pairs_per_pack, price_per_pair")
    .eq("price_on_request", false)
    .not("price_per_pair", "is", null);

  for (const p of products ?? []) {
    const pairs = p.pairs_per_pack as number;
    const pairPrice = p.price_per_pair as number;
    if (!pairs || pairs < 100) continue;

    const { data: tiers } = await sb
      .from("product_price_tiers")
      .select("*")
      .eq("product_id", p.id)
      .order("sort_order");

    const hasBase = tiers?.some((t) => (t.min_pairs as number) <= pairs);
    if (hasBase) continue;

    await sb.from("product_price_tiers").insert({
      product_id: p.id,
      min_pairs: pairs,
      max_pairs: 9999,
      price_per_pair: pairPrice,
      sort_order: 0,
    });
    if (tiers?.length) {
      for (const t of tiers) {
        await sb
          .from("product_price_tiers")
          .update({ sort_order: (t.sort_order as number) + 1 })
          .eq("id", t.id);
      }
    }
  }
}

async function main() {
  console.log("Updating site_settings...");
  for (const row of SETTINGS) {
    await sb.from("site_settings").upsert(
      { key: row.key, value: row.value, is_public: true },
      { onConflict: "key" }
    );
  }

  console.log("Updating cities...");
  await sb.from("cities").update({ is_default: false }).eq("is_default", true);
  await sb.from("cities").upsert(
    {
      name: "Орск",
      slug: "orsk",
      subdomain_url: "https://xbtex.ru",
      is_default: true,
      phone: "+7 (922) 872-00-08",
      address: "Орск, пр. Металлистов, 3",
      sort_order: 0,
      is_active: true,
    },
    { onConflict: "slug" }
  );
  await sb.from("cities").update({ is_active: false }).neq("slug", "orsk");

  console.log("Patching text fields...");
  await patchTextColumn("categories", "id", [
    "name",
    "description",
    "seo_title",
    "seo_description",
  ]);
  await patchTextColumn("products", "id", [
    "name",
    "short_description",
    "description",
    "seo_title",
    "seo_description",
  ]);
  await patchTextColumn("pages", "id", ["title", "content_html", "seo_title", "seo_description"]);
  await patchTextColumn("homepage_benefits", "id", ["title", "description"]);
  await patchTextColumn("homepage_steps", "id", ["title", "description"]);
  await patchTextColumn("menu_items", "id", ["title"]);
  await patchHomepageSections();

  console.log("Adding base wholesale price tiers...");
  await fixPriceTiers();

  console.log("Rebrand complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
