/**
 * Import ALL products from vitex37.ru product-sitemap into Supabase.
 * Usage: npx tsx scripts/import-vitex-catalog.ts
 *
 * Flags:
 *   --dry-run     scrape + write JSON only, no DB writes
 *   --limit=N     import first N products (debug)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";

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

const DRY = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : 0;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const CATEGORIES: {
  path: string;
  slug: string;
  name: string;
  parent_path: string | null;
  sort: number;
}[] = [
  { path: "rabochie-perchatki", slug: "rabochie-perchatki", name: "Рабочие перчатки", parent_path: null, sort: 1 },
  { path: "rabochie-perchatki/perchatki-hb", slug: "perchatki-hb", name: "Перчатки ХБ", parent_path: "rabochie-perchatki", sort: 1 },
  { path: "rabochie-perchatki/perchatki-hb/perchatki-s-pvh", slug: "perchatki-s-pvh", name: "Перчатки с ПВХ", parent_path: "rabochie-perchatki/perchatki-hb", sort: 1 },
  { path: "rabochie-perchatki/perchatki-polusherstyanye-i-sherstyanye", slug: "perchatki-polusherstyanye-i-sherstyanye", name: "Перчатки полушерстяные и шерстяные", parent_path: "rabochie-perchatki", sort: 2 },
  { path: "rukavicy", slug: "rukavicy", name: "Рукавицы, фартуки, нарукавники", parent_path: null, sort: 2 },
  { path: "rukavicy/brezentovye", slug: "brezentovye", name: "Брезентовые", parent_path: "rukavicy", sort: 1 },
  { path: "rukavicy/hb", slug: "hb", name: "ХБ", parent_path: "rukavicy", sort: 2 },
  { path: "rukavicy/kombinirovannye", slug: "kombinirovannye", name: "Комбинированные", parent_path: "rukavicy", sort: 3 },
  { path: "rukavicy/uteplennye", slug: "uteplennye", name: "Утеплённые", parent_path: "rukavicy", sort: 4 },
  { path: "rukavicy/sukonnye-rukavicy", slug: "sukonnye-rukavicy", name: "Суконные рукавицы", parent_path: "rukavicy", sort: 5 },
  { path: "rukavicy/rukavicy-s-naladonnikom", slug: "rukavicy-s-naladonnikom", name: "Рукавицы с наладонником", parent_path: "rukavicy", sort: 6 },
  { path: "rukavicy/rukavicy-s-naladonnikom/rukavicy-s-pvh-naladonnikom", slug: "rukavicy-s-pvh-naladonnikom", name: "С ПВХ наладонником", parent_path: "rukavicy/rukavicy-s-naladonnikom", sort: 1 },
  { path: "rukavicy/rukavicy-s-naladonnikom/rukavicy-s-brezentovym-naladonnikom", slug: "rukavicy-s-brezentovym-naladonnikom", name: "С брезентовым наладонником", parent_path: "rukavicy/rukavicy-s-naladonnikom", sort: 2 },
  { path: "rukavicy/fartuki", slug: "fartuki", name: "Фартуки, нарукавники", parent_path: "rukavicy", sort: 7 },
  { path: "tehnicheskie-tkani", slug: "tehnicheskie-tkani", name: "Технические ткани", parent_path: null, sort: 3 },
  { path: "tehnicheskie-tkani/vafelnoe-polotno", slug: "vafelnoe-polotno", name: "Вафельное полотно", parent_path: "tehnicheskie-tkani", sort: 1 },
  { path: "tehnicheskie-tkani/vafelnoe-polotno/vafelnoe-polotno-otbelennoe", slug: "vafelnoe-polotno-otbelennoe", name: "Вафельное полотно отбеленное", parent_path: "tehnicheskie-tkani/vafelnoe-polotno", sort: 1 },
  { path: "tehnicheskie-tkani/vafelnoe-polotno/vafelnoe-polotno-gladkokrashenoe", slug: "vafelnoe-polotno-gladkokrashenoe", name: "Вафельное полотно гладкокрашеное", parent_path: "tehnicheskie-tkani/vafelnoe-polotno", sort: 2 },
  { path: "tehnicheskie-tkani/holstoproshivnoe-polotno", slug: "holstoproshivnoe-polotno", name: "Холстопрошивное полотно", parent_path: "tehnicheskie-tkani", sort: 2 },
  { path: "tehnicheskie-tkani/tryapki-dlya-pola", slug: "tryapki-dlya-pola", name: "Тряпки из ХПП", parent_path: "tehnicheskie-tkani", sort: 3 },
];

type Scraped = {
  url: string;
  slug: string;
  categoryPath: string;
  name: string;
  descriptionHtml: string;
  shortDescription: string;
  sku: string | null;
  packPrice: number | null;
  pairPrice: number | null;
  pairsPerPack: number;
  priceOnRequest: boolean;
  stockStatus: "in_stock" | "on_order" | "out_of_stock";
  stockLabel: string;
  images: string[];
  attrs: Record<string, string>;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8381;/g, "₽")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripTags(html: string) {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function rebrand(text: string) {
  return text
    .replace(/Фабрика Витекс/gi, "Фабрика ХБтекс")
    .replace(/«Витекс»/gi, "«ХБтекс»")
    .replace(/Витекс/gi, "ХБтекс")
    .replace(/Vitex/gi, "ХБтекс")
    .replace(/Иваново/gi, "Орске")
    .replace(/в Орскее/gi, "в Орске");
}

function slugifyRu(input: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return input
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchText(href: string, retries = 3) {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(href, {
        headers: { "User-Agent": UA, Accept: "text/html,application/xml" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${href}`);
      return res.text();
    } catch (e) {
      lastErr = e;
      await sleep(800 * (i + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function getProductUrls(): Promise<string[]> {
  const xml = await fetchText("https://vitex37.ru/product-sitemap.xml");
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
  return locs.filter(
    (u) =>
      u.startsWith("https://vitex37.ru/") &&
      !u.endsWith("/shop/") &&
      u !== "https://vitex37.ru/" &&
      !u.includes("product-sitemap")
  );
}

function parseAttrValue(attrPa: string, raw: string): { key: string; slug: string } | null {
  const text = stripTags(raw).toLowerCase();
  if (attrPa.includes("klass-vyazki")) {
    if (text.includes("7,5") || text.includes("7.5")) return { key: "klass", slug: "7-5" };
    if (text.includes("10")) return { key: "klass", slug: "10" };
    return { key: "klass", slug: slugifyRu(text) };
  }
  if (attrPa.includes("kol-vo-nitej")) {
    const m = text.match(/(\d+)/);
    return m ? { key: "niti", slug: m[1] } : null;
  }
  if (attrPa.includes("cvet")) {
    if (text.includes("бел")) return { key: "cvet", slug: "belyj" };
    if (text.includes("чёрн") || text.includes("черн")) return { key: "cvet", slug: "chernyj" };
    if (text.includes("графит")) return { key: "cvet", slug: "grafit" };
    if (text.includes("берёз") || text.includes("берез")) return { key: "cvet", slug: "berezka" };
    if (text.includes("сер")) return { key: "cvet", slug: "seryj" };
    return { key: "cvet", slug: slugifyRu(text) };
  }
  if (attrPa.includes("vid-naneseniya-pvh")) {
    if (text.includes("без")) return { key: "pvh", slug: "bez-pvh" };
    if (text.includes("точк")) return { key: "pvh", slug: "tochka" };
    if (text.includes("волн")) return { key: "pvh", slug: "volna" };
    if (text.includes("кирпич")) return { key: "pvh", slug: "kirpich" };
    return { key: "pvh", slug: slugifyRu(text) };
  }
  return null;
}

function scrapeProduct(pageUrl: string, html: string): Scraped {
  const path = new URL(pageUrl).pathname.replace(/^\/|\/$/g, "");
  const parts = path.split("/");
  const slug = parts[parts.length - 1];
  const categoryPath = parts.slice(0, -1).join("/");

  let productLd: Record<string, unknown> | null = null;
  for (const m of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  )) {
    try {
      const j = JSON.parse(m[1]);
      if (j["@type"] === "Product") productLd = j;
    } catch {
      /* ignore */
    }
  }

  const h1 =
    html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
    "";
  const name = rebrand(
    stripTags(h1) || String(productLd?.name || slug)
  ).replace(/\s+купить.*/i, "");

  const packFromMeta = html.match(
    /itemprop="price"\s+content="([0-9]+(?:\.[0-9]+)?)"/i
  )?.[1];
  const packFromSchema = html.match(
    /class="price_shema">\s*([0-9]+(?:\.[0-9]+)?)/i
  )?.[1];
  let packPriceRaw = Number(packFromMeta || packFromSchema || 0);
  if (!packPriceRaw && productLd?.offers) {
    const offers = productLd.offers;
    const first = Array.isArray(offers) ? offers[0] : offers;
    packPriceRaw = Number((first as { price?: string })?.price || 0);
  }

  // «За пару: 11.5₽» — не путать с оптовыми тирами ниже по странице
  const pairBlock = html.match(/За пару:\s*([0-9]+(?:[.,][0-9]+)?)\s*₽/i);
  const pairPriceRaw = pairBlock
    ? Number(String(pairBlock[1]).replace(",", "."))
    : null;

  const pairsFromAttr = html.match(
    /woocommerce-product-attributes-item--attribute_pa_kolichestvo-par-v-upakovke[\s\S]*?<td[^>]*>[\s\S]*?(\d+)\s*пар/i
  )?.[1];
  const pairsFromPrice = html.match(/\/\s*<span>\s*(\d+)\s*пар/i)?.[1];
  const pairsFromText = html.match(/от упаковки:\s*(\d+)\s*пар/i)?.[1];
  const pairsPerPack = Number(pairsFromAttr || pairsFromPrice || pairsFromText || 1);

  const outOfStock =
    /out[- ]?of[- ]?stock|sold[- ]?out|нет в наличии/i.test(html) &&
    !/instock|in-stock|в наличии/i.test(
      html.match(/class="[^"]*product[^"]*status-publish[^"]*"/)?.[0] || ""
    );
  const onOrder = /на заказ/i.test(
    html.match(/stock[^<]{0,80}/i)?.[0] || ""
  ) || /stock_status[^>]*>[\s\S]*?На заказ/i.test(html);

  let stockStatus: Scraped["stockStatus"] = "in_stock";
  let stockLabel = "В наличии";
  if (outOfStock || /product-type-simple[\s\S]{0,200}outofstock/i.test(html) || /\boutofstock\b/.test(html)) {
    stockStatus = "out_of_stock";
    stockLabel = "Нет в наличии";
  } else if (onOrder) {
    stockStatus = "on_order";
    stockLabel = "На заказ";
  }
  if (/\boutofstock\b/.test(html)) {
    stockStatus = "out_of_stock";
    stockLabel = "Нет в наличии";
  }
  if (/\binstock\b/.test(html) && stockStatus === "out_of_stock") {
    // class list often has both — prefer explicit body class on product div
    const productClass = html.match(/id="product-\d+"[^>]*class="([^"]+)"/)?.[1] || "";
    if (/\boutofstock\b/.test(productClass)) {
      stockStatus = "out_of_stock";
      stockLabel = "Нет в наличии";
    } else if (/\binstock\b/.test(productClass)) {
      stockStatus = "in_stock";
      stockLabel = "В наличии";
    }
  }

  const images: string[] = [];
  for (const m of html.matchAll(
    /woocommerce-product-gallery__image[\s\S]*?data-large_image="(https:\/\/vitex37\.ru\/wp-content\/uploads\/[^"]+)"/gi
  )) {
    if (!images.includes(m[1])) images.push(m[1]);
  }
  if (!images.length) {
    for (const m of html.matchAll(
      /wp-post-image[^>]*src="(https:\/\/vitex37\.ru\/wp-content\/uploads\/[^"]+)"/gi
    )) {
      if (!images.includes(m[1])) images.push(m[1]);
    }
  }
  if (!images.length && typeof productLd?.image === "string") {
    images.push(productLd.image);
  }

  const descTab =
    html.match(
      /id="tab-description"[^>]*>[\s\S]*?<div class="(?:woocommerce-product-details__short-description|wd-entry-content|entry-content)[^"]*">([\s\S]*?)<\/div>/i
    )?.[1] ||
    html.match(/id="tab-description"[^>]*>([\s\S]*?)(?:id="tab-additional|<\/div>\s*<\/div>\s*<div class="wd-accordion)/i)?.[1] ||
    "";
  let descriptionHtml = rebrand(descTab || String(productLd?.description || ""));
  // keep basic HTML: strip scripts
  descriptionHtml = descriptionHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/style="[^"]*"/gi, "")
    .trim();
  if (!descriptionHtml.startsWith("<")) {
    descriptionHtml = `<p>${descriptionHtml}</p>`;
  }
  descriptionHtml = descriptionHtml.slice(0, 20000);

  const short =
    html.match(/Покупка доступна от упаковки:\s*(\d+)\s*пар/i)?.[0] ||
    (pairsPerPack > 1
      ? `Покупка доступна от упаковки: ${pairsPerPack} пар`
      : "");

  const attrs: Record<string, string> = {};
  for (const m of html.matchAll(
    /woocommerce-product-attributes-item--attribute_(pa_[a-z0-9-]+)[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi
  )) {
    const parsed = parseAttrValue(m[1], m[2]);
    if (parsed) attrs[parsed.key] = parsed.slug;
  }

  // Infer PVC category attribute if missing
  if (
    (categoryPath.includes("perchatki-s-pvh") ||
      /pvh|пвх/i.test(slug) ||
      /пвх/i.test(name)) &&
    !attrs.pvh
  ) {
    attrs.pvh = /волн/i.test(name)
      ? "volna"
      : /кирпич/i.test(name)
        ? "kirpich"
        : /без/i.test(name)
          ? "bez-pvh"
          : "tochka";
  }

  // Products with PVC that sit under /perchatki-hb/ still belong in PVC category
  let resolvedCategory = categoryPath;
  if (
    attrs.pvh &&
    attrs.pvh !== "bez-pvh" &&
    categoryPath === "rabochie-perchatki/perchatki-hb"
  ) {
    resolvedCategory = "rabochie-perchatki/perchatki-hb/perchatki-s-pvh";
  }

  const packPrice =
    Number.isFinite(packPriceRaw) && packPriceRaw > 0 ? packPriceRaw : null;
  const pairPrice =
    pairPriceRaw && Number.isFinite(pairPriceRaw) && pairPriceRaw > 0
      ? pairPriceRaw
      : packPrice && pairsPerPack
        ? Number((packPrice / pairsPerPack).toFixed(2))
        : null;
  const priceOnRequest = !packPrice;

  const skuRaw = productLd?.sku;
  const sku =
    skuRaw != null && String(skuRaw).trim()
      ? `VT-${String(skuRaw).trim()}`
      : null;

  return {
    url: pageUrl,
    slug,
    categoryPath: resolvedCategory,
    name,
    descriptionHtml,
    shortDescription: short,
    sku,
    packPrice,
    pairPrice,
    pairsPerPack: pairsPerPack || 1,
    priceOnRequest,
    stockStatus,
    stockLabel,
    images: images.slice(0, 8),
    attrs,
  };
}

async function ensureCategories(): Promise<Map<string, string>> {
  const idByPath = new Map<string, string>();
  // parents first
  const sorted = [...CATEGORIES].sort(
    (a, b) => a.path.split("/").length - b.path.split("/").length
  );
  for (const c of sorted) {
    const parentId = c.parent_path ? idByPath.get(c.parent_path) ?? null : null;
    const { data: existing } = await sb
      .from("categories")
      .select("id")
      .eq("path", c.path)
      .maybeSingle();
    if (existing?.id) {
      idByPath.set(c.path, existing.id);
      await sb
        .from("categories")
        .update({
          name: c.name,
          parent_id: parentId,
          status: "published",
          sort_order: c.sort,
        })
        .eq("id", existing.id);
      continue;
    }
    const { data, error } = await sb
      .from("categories")
      .insert({
        slug: c.slug,
        path: c.path,
        name: c.name,
        parent_id: parentId,
        status: "published",
        sort_order: c.sort,
      })
      .select("id")
      .single();
    if (error) {
      console.error("category", c.path, error.message);
      continue;
    }
    idByPath.set(c.path, data.id);
  }
  return idByPath;
}

async function ensureAttributes(): Promise<Map<string, string>> {
  const defs: {
    slug: string;
    name: string;
    type: "select" | "color";
    sort: number;
    values: { slug: string; name: string; color?: string; sort: number }[];
  }[] = [
    {
      slug: "pvh",
      name: "ПВХ покрытие",
      type: "select",
      sort: 1,
      values: [
        { slug: "bez-pvh", name: "Без ПВХ", sort: 1 },
        { slug: "tochka", name: "Точка", sort: 2 },
        { slug: "volna", name: "Волна", sort: 3 },
        { slug: "kirpich", name: "Кирпич", sort: 4 },
      ],
    },
    {
      slug: "niti",
      name: "Количество нитей",
      type: "select",
      sort: 2,
      values: [
        { slug: "3", name: "3 нити", sort: 1 },
        { slug: "4", name: "4 нити", sort: 2 },
        { slug: "5", name: "5 нитей", sort: 3 },
        { slug: "6", name: "6 нитей", sort: 4 },
        { slug: "7", name: "7 нитей", sort: 5 },
        { slug: "8", name: "8 нитей", sort: 6 },
        { slug: "10", name: "10 нитей", sort: 7 },
      ],
    },
    {
      slug: "klass",
      name: "Класс вязки",
      type: "select",
      sort: 3,
      values: [
        { slug: "7-5", name: "7,5 класс", sort: 1 },
        { slug: "10", name: "10 класс", sort: 2 },
      ],
    },
    {
      slug: "cvet",
      name: "Цвет",
      type: "color",
      sort: 4,
      values: [
        { slug: "belyj", name: "Белый", color: "#f5f5f5", sort: 1 },
        { slug: "chernyj", name: "Чёрный", color: "#222", sort: 2 },
        { slug: "grafit", name: "Графит", color: "#5a5a5a", sort: 3 },
        { slug: "seryj", name: "Серый", color: "#9a9a9a", sort: 4 },
        { slug: "berezka", name: "Берёзка", color: "#c8d4b8", sort: 5 },
      ],
    },
  ];

  const map = new Map<string, string>();
  for (const a of defs) {
    const { data: existing } = await sb
      .from("attributes")
      .select("id")
      .eq("slug", a.slug)
      .maybeSingle();
    let attrId = existing?.id as string | undefined;
    if (!attrId) {
      const { data, error } = await sb
        .from("attributes")
        .insert({
          slug: a.slug,
          name: a.name,
          attribute_type: a.type,
          sort_order: a.sort,
          is_filterable: true,
          is_visible: true,
        })
        .select("id")
        .single();
      if (error) {
        console.error("attr", a.slug, error.message);
        continue;
      }
      attrId = data.id;
    }
    for (const v of a.values) {
      const { data: ev } = await sb
        .from("attribute_values")
        .select("id")
        .eq("attribute_id", attrId)
        .eq("slug", v.slug)
        .maybeSingle();
      let vid = ev?.id as string | undefined;
      if (!vid) {
        const { data, error } = await sb
          .from("attribute_values")
          .insert({
            attribute_id: attrId,
            slug: v.slug,
            name: v.name,
            color_hex: v.color ?? null,
            sort_order: v.sort,
          })
          .select("id")
          .single();
        if (error) {
          console.error("attr value", a.slug, v.slug, error.message);
          continue;
        }
        vid = data.id;
      }
      map.set(`${a.slug}:${v.slug}`, vid!);
    }
  }
  return map;
}

async function upsertProduct(
  p: Scraped,
  index: number,
  idByPath: Map<string, string>,
  valueIdByKey: Map<string, string>
) {
  const { data: existing } = await sb
    .from("products")
    .select("id")
    .eq("slug", p.slug)
    .maybeSingle();

  // Avoid SKU collisions when VT-{wpId} already used by another slug
  let sku = p.sku;
  if (sku) {
    const { data: skuOwner } = await sb
      .from("products")
      .select("id, slug")
      .eq("sku", sku)
      .maybeSingle();
    if (skuOwner && skuOwner.slug !== p.slug) {
      sku = `${sku}-${p.slug.slice(0, 12)}`;
    }
  }

  const payload = {
    slug: p.slug,
    name: p.name,
    sku,
    short_description: p.shortDescription || null,
    description: p.descriptionHtml,
    status: "published" as const,
    stock_status: p.stockStatus,
    stock_label: p.stockLabel,
    pack_price: p.priceOnRequest ? null : p.packPrice,
    pairs_per_pack: p.pairsPerPack,
    price_per_pair: p.priceOnRequest ? null : p.pairPrice,
    price_on_request: p.priceOnRequest,
    is_featured: index < 12,
    menu_order: index + 1,
    published_at: new Date().toISOString(),
    seo_title: `${p.name} купить оптом`,
    seo_description: stripTags(p.descriptionHtml).slice(0, 160),
  };

  let id = existing?.id as string | undefined;
  if (id) {
    const { error } = await sb.from("products").update(payload).eq("id", id);
    if (error) throw new Error(`update ${p.slug}: ${error.message}`);
  } else {
    const { data, error } = await sb
      .from("products")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(`insert ${p.slug}: ${error.message}`);
    id = data.id;
  }

  // images
  await sb.from("product_images").delete().eq("product_id", id!);
  if (p.images.length) {
    await sb.from("product_images").insert(
      p.images.map((img, i) => ({
        product_id: id!,
        storage_path: img,
        alt: p.name,
        sort_order: i,
        is_primary: i === 0,
      }))
    );
  }

  // categories: leaf + all parents
  const catPath = p.categoryPath;
  if (catPath) {
    const parts = catPath.split("/");
    let acc = "";
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      const cid = idByPath.get(acc);
      if (cid) {
        await sb.from("product_categories").upsert({
          product_id: id!,
          category_id: cid,
          sort_order: index,
        });
      }
    }
  }

  // attributes
  await sb.from("product_attribute_values").delete().eq("product_id", id!);
  const attrRows = Object.entries(p.attrs)
    .map(([k, v]) => {
      const vid = valueIdByKey.get(`${k}:${v}`);
      return vid ? { product_id: id!, attribute_value_id: vid } : null;
    })
    .filter(Boolean);
  if (attrRows.length) {
    await sb.from("product_attribute_values").insert(attrRows);
  }

  // price tiers for glove packs
  if (!p.priceOnRequest && p.pairPrice && p.pairsPerPack >= 100) {
    await sb.from("product_price_tiers").delete().eq("product_id", id!);
    await sb.from("product_price_tiers").insert([
      {
        product_id: id!,
        min_pairs: p.pairsPerPack,
        max_pairs: 9999,
        price_per_pair: p.pairPrice,
        sort_order: 0,
      },
      {
        product_id: id!,
        min_pairs: 10000,
        max_pairs: 30000,
        price_per_pair: Number((p.pairPrice - 0.2).toFixed(2)),
        sort_order: 1,
      },
      {
        product_id: id!,
        min_pairs: 30000,
        max_pairs: null,
        price_per_pair: Number((p.pairPrice - 0.4).toFixed(2)),
        sort_order: 2,
      },
    ]);
  }

  return id!;
}

async function main() {
  console.log("Fetching product sitemap…");
  let urls = await getProductUrls();
  console.log(`Found ${urls.length} product URLs`);
  if (LIMIT > 0) urls = urls.slice(0, LIMIT);

  const outDir = resolve(process.cwd(), "tmp");
  if (!existsSync(outDir)) mkdirSync(outDir);

  const scraped: Scraped[] = [];
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    process.stdout.write(`[${i + 1}/${urls.length}] ${u}\n`);
    try {
      const html = await fetchText(u);
      const p = scrapeProduct(u, html);
      scraped.push(p);
      console.log(
        `  → ${p.name} | pack=${p.packPrice} pair=${p.pairPrice} pairs=${p.pairsPerPack} imgs=${p.images.length} cat=${p.categoryPath}`
      );
    } catch (e) {
      console.error("  FAIL", e instanceof Error ? e.message : e);
    }
    await sleep(250);
  }

  writeFileSync(
    resolve(outDir, "vitex-products.json"),
    JSON.stringify(scraped, null, 2),
    "utf8"
  );
  console.log(`Saved tmp/vitex-products.json (${scraped.length})`);

  const pvh = scraped.filter((p) =>
    p.categoryPath.includes("perchatki-s-pvh")
  );
  console.log(`PVC gloves in scrape: ${pvh.length}`);

  if (DRY) {
    console.log("Dry run — skip DB");
    return;
  }

  console.log("Ensuring categories…");
  const idByPath = await ensureCategories();
  console.log("Ensuring attributes…");
  const valueIdByKey = await ensureAttributes();

  let ok = 0;
  for (let i = 0; i < scraped.length; i++) {
    const p = scraped[i];
    try {
      await upsertProduct(p, i, idByPath, valueIdByKey);
      ok++;
      console.log(`DB ok ${ok}/${scraped.length}: ${p.slug}`);
    } catch (e) {
      console.error(`DB fail ${p.slug}:`, e instanceof Error ? e.message : e);
    }
  }

  const { count } = await sb
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  console.log(`Done. Published products in DB: ${count}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
