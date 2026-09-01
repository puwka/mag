/**
 * Seed public content into Supabase (run once after migrations).
 * Usage: npx tsx scripts/seed.ts
 * Uses SUPABASE_SERVICE_ROLE_KEY from .env.local — never expose to browser.
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

const sb = createClient(url, key, {
  auth: { persistSession: false },
});

const IMG = {
  logo: "https://vitex37.ru/wp-content/uploads/2021/09/logo-vitex-posledn2.png",
  heroBg: "https://vitex37.ru/wp-content/uploads/2022/11/portrait-131.jpg",
  heroProduct: "https://vitex37.ru/wp-content/uploads/2023/05/hh-perchatk2i.png",
  dostavka: "https://vitex37.ru/wp-content/uploads/2021/12/Dostavka.png",
  telezhka: "https://vitex37.ru/wp-content/uploads/2021/12/Dostavka-telezhka.png",
  sert: "https://vitex37.ru/wp-content/uploads/2021/12/Sertifitsirovannaya-produktsiya.png",
  years: "https://vitex37.ru/wp-content/uploads/2021/12/5_-let-na-rynke.png",
  pvh: "https://vitex37.ru/wp-content/uploads/2021/12/Nanesenie-PVH2.png",
  hb: "https://vitex37.ru/wp-content/uploads/2021/09/perhatka.png",
  rukav: "https://vitex37.ru/wp-content/uploads/2026/01/rucav-pvh-cat.png",
  vafel: "https://vitex37.ru/wp-content/uploads/2022/12/polotno-vaf.jpg",
  hpp: "https://vitex37.ru/wp-content/uploads/2026/01/hpp-cat.png",
  psh: "https://vitex37.ru/wp-content/uploads/2022/12/p-sh-1024x1024.png",
  ya: "https://vitex37.ru/wp-content/uploads/2025/06/rewiefs-ya.png",
  menu: "https://vitex37.ru/wp-content/uploads/2024/08/menu-fff.png",
  g1: "https://vitex37.ru/wp-content/uploads/2022/12/perch-45.png",
};

async function upsertSettings() {
  const rows = [
    { key: "brand.name", value: "ХБтекс", label: "Бренд", group_name: "brand", is_public: true },
    { key: "brand.logo", value: IMG.logo, label: "Логотип", group_name: "brand", is_public: true },
    { key: "brand.logo_mobile", value: "https://vitex37.ru/wp-content/uploads/2021/09/logo-vitex-posledn-1.png", label: "Логотип mobile", group_name: "brand", is_public: true },
    { key: "brand.favicon", value: "/favicon.ico", label: "Favicon", group_name: "brand", is_public: true },
    { key: "company.name", value: "ИП Тарабанов Александр Иванович", label: "Компания", group_name: "legal", is_public: true },
    { key: "company.inn", value: "563501659899", label: "ИНН", group_name: "legal", is_public: true },
    { key: "company.address", value: "Орск, пр. Металлистов, 3", label: "Адрес", group_name: "contacts", is_public: true },
    { key: "company.footer_blurb", value: "Фабрика-производитель рабочих перчаток в Орске", label: "Футер текст", group_name: "contacts", is_public: true },
    { key: "contacts.phones", value: ["+7 (922) 872-00-08"], label: "Телефоны header", group_name: "contacts", is_public: true },
    { key: "contacts.phones_display", value: ["+7 (922) 872-00-08"], label: "Телефоны mobile", group_name: "contacts", is_public: true },
    { key: "contacts.phones_tel", value: ["+79228720008"], label: "tel:", group_name: "contacts", is_public: true },
    { key: "contacts.sales_phones", value: ["+7 (922) 872-00-08"], label: "Телефоны футер", group_name: "contacts", is_public: true },
    { key: "contacts.email", value: "tarabanov.aleksandr@yandex.ru", label: "Email", group_name: "contacts", is_public: true },
    { key: "contacts.hours", value: "ПН-ПТ, 09:00–17:00 (МСК)", label: "Часы", group_name: "contacts", is_public: true },
    { key: "contacts.whatsapp", value: "79228720008", label: "WhatsApp", group_name: "contacts", is_public: true },
    { key: "contacts.no_call_text", value: "Если вам не удалось дозвониться по контактным номерам компании, просим Вас написать сообщение в WhatsApp.", label: "Не дозвонились", group_name: "contacts", is_public: true },
    { key: "maps.yandex_org_id", value: "", label: "Яндекс org", group_name: "analytics", is_public: true },
    { key: "social.vk", value: "", label: "VK", group_name: "social", is_public: true },
    { key: "social.youtube", value: "", label: "YouTube", group_name: "social", is_public: true },
    { key: "seo.home_title", value: "Производитель рабочих перчаток, купить перчатки оптом", label: "Title главной", group_name: "seo", is_public: true },
    { key: "seo.home_description", value: "Фабрика ХБтекс в Орске — производитель рабочих перчаток. Купить перчатки оптом напрямую с производства. Доставка по России.", label: "Desc главной", group_name: "seo", is_public: true },
    { key: "seo.site_url", value: "https://xbtex.ru", label: "URL сайта", group_name: "seo", is_public: true },
    { key: "legal.copyright", value: "©2018-2026 ХБтекс. Все права защищены", label: "Copyright", group_name: "legal", is_public: true },
    { key: "legal.disclaimer", value: "Информация на сайте не является публичной офертой (ст. 437 ГК РФ).", label: "Дисклеймер", group_name: "legal", is_public: true },
    { key: "ui.no_call_label", value: "Не дозвонились?", label: "Кнопка не дозвонились", group_name: "ui", is_public: true },
    { key: "ui.search_label", value: "Поиск", label: "Кнопка поиска", group_name: "ui", is_public: true },
    { key: "ui.whatsapp_message", value: "Добрый день, ХБтекс! Не смог дозвониться, прошу связаться со мной.", label: "WhatsApp текст", group_name: "ui", is_public: true },
    { key: "ui.whatsapp_send_label", value: "Отправить сообщение", label: "WhatsApp кнопка", group_name: "ui", is_public: true },
    { key: "ui.buy_label", value: "Купить", label: "Кнопка купить", group_name: "ui", is_public: true },
    { key: "ui.review_original_label", value: "Читать оригинал отзыва", label: "Ссылка отзыва", group_name: "ui", is_public: true },
    { key: "ui.city_select_label", value: "Выберите город", label: "Выбор города", group_name: "ui", is_public: true },
    { key: "footer.col_location", value: "Мы находимся", label: "Футер колонка 1", group_name: "footer", is_public: true },
    { key: "footer.col_info", value: "Информация", label: "Футер колонка 2", group_name: "footer", is_public: true },
    { key: "footer.col_catalog", value: "Каталог", label: "Футер колонка 3", group_name: "footer", is_public: true },
    { key: "footer.col_gloves", value: "Перчатки", label: "Футер колонка 4", group_name: "footer", is_public: true },
    { key: "footer.privacy_label", value: "Политика обработки персональных данных", label: "Политика текст", group_name: "footer", is_public: true },
    { key: "footer.privacy_url", value: "/privacy-policy/", label: "Политика URL", group_name: "footer", is_public: true },
    { key: "footer.inn_label", value: "ИНН", label: "ИНН подпись", group_name: "footer", is_public: true },
    { key: "social.vk_label", value: "VK", label: "VK подпись", group_name: "social", is_public: true },
    { key: "social.youtube_label", value: "YouTube", label: "YouTube подпись", group_name: "social", is_public: true },
    { key: "cookie.text", value: "Мы используем cookie, Яндекс.Метрику и reCAPTCHA для работы сайта.", label: "Cookie текст", group_name: "cookie", is_public: true },
    { key: "cookie.more_label", value: "Подробнее", label: "Cookie ссылка", group_name: "cookie", is_public: true },
    { key: "cookie.more_url", value: "/privacy-policy/", label: "Cookie URL", group_name: "cookie", is_public: true },
    { key: "cookie.accept_label", value: "Согласен", label: "Cookie кнопка", group_name: "cookie", is_public: true },
  ];
  for (const row of rows) {
    await sb.from("site_settings").upsert(row, { onConflict: "key" });
  }
}

async function seedCategories() {
  const cats: { path: string; slug: string; name: string; parent_path: string | null; image?: string; desc?: string; sort: number }[] = [
    { path: "rabochie-perchatki", slug: "rabochie-perchatki", name: "Рабочие перчатки", parent_path: null, image: IMG.g1, desc: "Рабочие перчатки купить в Орске недорого. Перчатки лучшего качества. Доставка транспортными компаниями.", sort: 1 },
    { path: "rabochie-perchatki/perchatki-hb", slug: "perchatki-hb", name: "Перчатки ХБ", parent_path: "rabochie-perchatki", image: IMG.hb, sort: 1 },
    { path: "rabochie-perchatki/perchatki-hb/perchatki-s-pvh", slug: "perchatki-s-pvh", name: "Перчатки с ПВХ", parent_path: "rabochie-perchatki/perchatki-hb", image: IMG.pvh, sort: 1 },
    { path: "rabochie-perchatki/perchatki-polusherstyanye-i-sherstyanye", slug: "perchatki-polusherstyanye-i-sherstyanye", name: "Перчатки полушерстяные и шерстяные", parent_path: "rabochie-perchatki", image: IMG.psh, sort: 2 },
    { path: "rukavicy", slug: "rukavicy", name: "Рукавицы, фартуки, нарукавники", parent_path: null, image: IMG.rukav, sort: 2 },
    { path: "rukavicy/brezentovye", slug: "brezentovye", name: "Брезентовые", parent_path: "rukavicy", sort: 1 },
    { path: "rukavicy/hb", slug: "hb", name: "ХБ", parent_path: "rukavicy", sort: 2 },
    { path: "rukavicy/kombinirovannye", slug: "kombinirovannye", name: "Комбинированные", parent_path: "rukavicy", sort: 3 },
    { path: "rukavicy/uteplennye", slug: "uteplennye", name: "Утеплённые", parent_path: "rukavicy", sort: 4 },
    { path: "rukavicy/fartuki", slug: "fartuki", name: "Фартуки, нарукавники", parent_path: "rukavicy", sort: 5 },
    { path: "tehnicheskie-tkani", slug: "tehnicheskie-tkani", name: "Технические ткани", parent_path: null, image: IMG.vafel, sort: 3 },
    { path: "tehnicheskie-tkani/vafelnoe-polotno", slug: "vafelnoe-polotno", name: "Вафельное полотно", parent_path: "tehnicheskie-tkani", image: IMG.vafel, sort: 1 },
    { path: "tehnicheskie-tkani/holstoproshivnoe-polotno", slug: "holstoproshivnoe-polotno", name: "Холстопрошивное полотно", parent_path: "tehnicheskie-tkani", image: IMG.hpp, sort: 2 },
    { path: "tehnicheskie-tkani/tryapki-dlya-pola", slug: "tryapki-dlya-pola", name: "Тряпки из ХПП", parent_path: "tehnicheskie-tkani", sort: 3 },
  ];

  const idByPath = new Map<string, string>();
  for (const c of cats) {
    const parent_id = c.parent_path ? idByPath.get(c.parent_path) ?? null : null;
    const { data, error } = await sb
      .from("categories")
      .upsert(
        {
          slug: c.slug,
          path: c.path,
          name: c.name,
          parent_id,
          description: c.desc ?? null,
          image_path: c.image ?? null,
          seo_title: `${c.name} оптом от производителя`,
          seo_description: c.desc ?? c.name,
          status: "published",
          sort_order: c.sort,
        },
        { onConflict: "path" }
      )
      .select("id, path")
      .single();
    if (error) {
      // fallback insert then select
      const ins = await sb
        .from("categories")
        .insert({
          slug: c.slug,
          path: c.path,
          name: c.name,
          parent_id,
          description: c.desc ?? null,
          image_path: c.image ?? null,
          status: "published",
          sort_order: c.sort,
        })
        .select("id, path")
        .single();
      if (ins.error) console.error(c.path, ins.error.message);
      else idByPath.set(ins.data.path, ins.data.id);
    } else {
      idByPath.set(data.path, data.id);
    }
  }
  return idByPath;
}

type ProdDef = {
  slug: string;
  name: string;
  cat: string;
  pack: number;
  pairs: number;
  pair: number;
  img: string;
  img2?: string;
  sku?: string;
  stock?: "in_stock" | "on_order" | "out_of_stock";
  label?: string;
  attrs?: Record<string, string>;
};

async function seedProducts(idByPath: Map<string, string>) {
  const products: ProdDef[] = [
    { slug: "perchatki-rabochie-4-nitka-h-b", name: "Перчатки х/б 4/10", cat: "rabochie-perchatki/perchatki-hb", pack: 5250, pairs: 500, pair: 10.5, img: "https://vitex37.ru/wp-content/uploads/2021/09/10-klass-4-h-nitka-2026-2.jpg", img2: "https://vitex37.ru/wp-content/uploads/2021/12/Nanesenie-PVH2.png", sku: "VT-4N-10", attrs: { niti: "4", klass: "10", cvet: "belyj", pvh: "bez-pvh" } },
    { slug: "perchatki-rabochie-5-nitka-hb-seriya-lajt", name: "Перчатки ХБ 10/5, белая", cat: "rabochie-perchatki/perchatki-hb", pack: 4800, pairs: 500, pair: 9.6, img: "https://vitex37.ru/wp-content/uploads/2021/09/10-klass-5-h-nitka-2026-1.jpg", sku: "VT-5N-10-W", attrs: { niti: "5", klass: "10", cvet: "belyj", pvh: "bez-pvh" } },
    { slug: "perchatki-rabochie-5-nitka-hb-chjornaya-seriya-lajt", name: "Перчатки ХБ 5/10, черная", cat: "rabochie-perchatki/perchatki-hb", pack: 4900, pairs: 500, pair: 9.8, img: "https://vitex37.ru/wp-content/uploads/2021/11/10-klass-5-h-nitka-2026-4.jpg", sku: "VT-5N-10-BK", attrs: { niti: "5", klass: "10", cvet: "chernyj", pvh: "bez-pvh" } },
    { slug: "perchatki-rabochie-5-nitka-hb-grafit-seriya-lajt", name: "Перчатки ХБ 5/10, графит", cat: "rabochie-perchatki/perchatki-hb", pack: 4900, pairs: 500, pair: 9.8, img: "https://vitex37.ru/wp-content/uploads/2021/11/10-klass-5-h-nitka-2026-5.jpg", sku: "VT-5N-10-GR", attrs: { niti: "5", klass: "10", cvet: "grafit", pvh: "bez-pvh" } },
    { slug: "perchatki-rabochie-5-nitka-h-b", name: "Перчатки х/б 5/10, «Стандарт»", cat: "rabochie-perchatki/perchatki-hb", pack: 5100, pairs: 500, pair: 10.2, img: "https://vitex37.ru/wp-content/uploads/2021/09/10-klass-5-h-nitka-2026-6.jpg", sku: "VT-5N-10-ST", attrs: { niti: "5", klass: "10", cvet: "belyj", pvh: "bez-pvh" } },
    { slug: "perchatki-h-b-6-nitka-standart-10kl", name: "Перчатки ХБ 6/10, черная", cat: "rabochie-perchatki/perchatki-hb", pack: 5600, pairs: 500, pair: 11.2, img: "https://vitex37.ru/wp-content/uploads/2024/06/10-klass-6-h-nitka-2026-1.jpg", sku: "VT-6N-10-BK", attrs: { niti: "6", klass: "10", cvet: "chernyj", pvh: "bez-pvh" } },
    { slug: "perchatki-rabochie-5-nitka-h-b-grafit", name: "Перчатки ХБ 5н, цвет серый", cat: "rabochie-perchatki/perchatki-hb", pack: 5150, pairs: 500, pair: 10.3, img: "https://vitex37.ru/wp-content/uploads/2021/11/10-klass-5-h-nitka-2026-7.jpg", sku: "VT-5N-10-GY", attrs: { niti: "5", klass: "10", cvet: "seryj", pvh: "bez-pvh" } },
    { slug: "perchatki-rabochie-5-nitka-h-b-berezka", name: "Перчатки ХБ 5/10 березка", cat: "rabochie-perchatki/perchatki-hb", pack: 5200, pairs: 500, pair: 10.4, img: "https://vitex37.ru/wp-content/uploads/2021/11/10-klass-5-h-nitka-2026-8.jpg", sku: "VT-5N-10-BR", attrs: { niti: "5", klass: "10", cvet: "berezka", pvh: "bez-pvh" } },
    { slug: "perchatki-rabochie-h-b-6-nitka-10-kl-belyj", name: "Перчатки ХБ 6/10 белый", cat: "rabochie-perchatki/perchatki-hb", pack: 5500, pairs: 500, pair: 11, img: "https://vitex37.ru/wp-content/uploads/2024/06/10-klass-6-h-nitka-2026-2.jpg", sku: "VT-6N-10-W", attrs: { niti: "6", klass: "10", cvet: "belyj", pvh: "bez-pvh" } },
    { slug: "perchatki-rabochie-8-nitka-h-b", name: "Перчатки ХБ 8н 7,5 класс", cat: "rabochie-perchatki/perchatki-hb", pack: 6200, pairs: 200, pair: 31, img: "https://vitex37.ru/wp-content/uploads/2021/10/7-klass-8-h-nitka-2026-1.jpg", stock: "out_of_stock", label: "Sold out", sku: "VT-8N-75", attrs: { niti: "8", klass: "7-5", cvet: "belyj", pvh: "bez-pvh" } },
    { slug: "perchatki-belye-s-pvh-tochka", name: "Перчатки 4Н белые ХБ с ПВХ точка", cat: "rabochie-perchatki/perchatki-hb/perchatki-s-pvh", pack: 5450, pairs: 500, pair: 10.9, img: "https://vitex37.ru/wp-content/uploads/2022/05/hb-pvh-4-nitka-1-2026.jpg", img2: "https://vitex37.ru/wp-content/uploads/2021/12/Nanesenie-PVH2.png", sku: "VT-4N-PVH-T", attrs: { niti: "4", klass: "10", cvet: "belyj", pvh: "tochka" } },
    { slug: "perchatki-4n-grafit-tochka", name: "Перчатки ХБ с ПВХ 4Н графит «Точка»", cat: "rabochie-perchatki/perchatki-hb/perchatki-s-pvh", pack: 5500, pairs: 500, pair: 11, img: "https://vitex37.ru/wp-content/uploads/2021/11/10-klass-5-h-nitka-2026-5.jpg", sku: "VT-4N-PVH-GR", attrs: { niti: "4", klass: "10", cvet: "grafit", pvh: "tochka" } },
    { slug: "perchatki-rabochie-5-nitka-s-pvh-tochka", name: "Перчатки 5Н с ПВХ точка", cat: "rabochie-perchatki/perchatki-hb/perchatki-s-pvh", pack: 5800, pairs: 500, pair: 11.6, img: "https://vitex37.ru/wp-content/uploads/2022/05/hb-pvh-4-nitka-1-2026.jpg", sku: "VT-5N-PVH-T", attrs: { niti: "5", klass: "10", cvet: "belyj", pvh: "tochka" } },
    { slug: "perchatki-rabochie-5-nitka-s-pvh-volna-belyj", name: "Перчатки 5Н с ПВХ волна белый", cat: "rabochie-perchatki/perchatki-hb/perchatki-s-pvh", pack: 5900, pairs: 500, pair: 11.8, img: "https://vitex37.ru/wp-content/uploads/2021/12/Nanesenie-PVH2.png", sku: "VT-5N-PVH-V", attrs: { niti: "5", klass: "10", cvet: "belyj", pvh: "volna" } },
    { slug: "perchatki-rabochie-5-nitka-s-pvh-kirpich-chjornyj", name: "Перчатки 5Н с ПВХ кирпич чёрный", cat: "rabochie-perchatki/perchatki-hb/perchatki-s-pvh", pack: 5950, pairs: 500, pair: 11.9, img: "https://vitex37.ru/wp-content/uploads/2024/06/hb-pvh-4-nitka-2-2026.jpg", sku: "VT-5N-PVH-K", attrs: { niti: "5", klass: "10", cvet: "chernyj", pvh: "kirpich" } },
    { slug: "perchatki-rabochie-3-nitka-h-b", name: "Перчатки ХБ 3/10", cat: "rabochie-perchatki/perchatki-hb", pack: 4450, pairs: 500, pair: 8.9, img: "https://vitex37.ru/wp-content/uploads/2021/09/10-klass-4-h-nitka-2026-2.jpg", stock: "on_order", label: "На заказ", sku: "VT-3N-10", attrs: { niti: "3", klass: "10", cvet: "belyj", pvh: "bez-pvh" } },
    { slug: "polusherstyanye-perchatki-standart", name: "Перчатки полушерстяные «Стандарт»", cat: "rabochie-perchatki/perchatki-polusherstyanye-i-sherstyanye", pack: 7800, pairs: 100, pair: 78, img: IMG.psh, sku: "VT-PSH-ST", attrs: { cvet: "seryj" } },
    { slug: "rukavicy-brezentovye-pl-400gr", name: "Рукавицы брезентовые пл. 400гр", cat: "rukavicy/brezentovye", pack: 3200, pairs: 50, pair: 64, img: IMG.rukav, sku: "VT-RUK-400" },
    { slug: "vafelnoe-polotno-80-sm-otbelennoe-pl-140-g-m", name: "Вафельное полотно 80 см отбеленное пл. 140 г/м", cat: "tehnicheskie-tkani/vafelnoe-polotno", pack: 0, pairs: 1, pair: 0, img: IMG.vafel, stock: "in_stock", label: "В наличии", sku: "VT-VAF-80" },
  ];

  const valueIdByKey = await seedAttributes();
  const productIds: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const onRequest = p.pack === 0;
    const { data: existing } = await sb.from("products").select("id").eq("slug", p.slug).maybeSingle();
    let id = existing?.id as string | undefined;
    const payload = {
      slug: p.slug,
      name: p.name,
      sku: p.sku ?? null,
      short_description: `Покупка доступна от упаковки: ${p.pairs} пар`,
      description: `<p>${p.name} — продукция фабрики «ХБтекс» в Орске. Оптовые поставки по России.</p>`,
      status: "published" as const,
      stock_status: p.stock ?? ("in_stock" as const),
      stock_label: p.label ?? (p.stock === "on_order" ? "На заказ" : "В наличии"),
      pack_price: onRequest ? null : p.pack,
      pairs_per_pack: p.pairs,
      price_per_pair: onRequest ? null : p.pair,
      price_on_request: onRequest,
      is_featured: i < 12,
      menu_order: i + 1,
      published_at: new Date().toISOString(),
      seo_title: `${p.name} купить оптом`,
      seo_description: p.name,
    };
    if (id) {
      await sb.from("products").update(payload).eq("id", id);
    } else {
      const { data, error } = await sb.from("products").insert(payload).select("id").single();
      if (error) {
        console.error(p.slug, error.message);
        continue;
      }
      id = data.id;
    }
    productIds.push(id!);

    await sb.from("product_images").delete().eq("product_id", id!);
    const imgs = [
      {
        product_id: id!,
        storage_path: p.img,
        alt: p.name,
        sort_order: 0,
        is_primary: true,
      },
    ];
    if (p.img2) {
      imgs.push({
        product_id: id!,
        storage_path: p.img2,
        alt: `${p.name} — вид 2`,
        sort_order: 1,
        is_primary: false,
      });
    }
    await sb.from("product_images").insert(imgs);

    const catId = idByPath.get(p.cat);
    if (catId) {
      await sb.from("product_categories").upsert({
        product_id: id!,
        category_id: catId,
        sort_order: i,
      });
      const parts = p.cat.split("/");
      let acc = "";
      for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part;
        const cid = idByPath.get(acc);
        if (cid) {
          await sb.from("product_categories").upsert({
            product_id: id!,
            category_id: cid,
            sort_order: i,
          });
        }
      }
    }

    if (p.attrs) {
      await sb.from("product_attribute_values").delete().eq("product_id", id!);
      const rows = Object.entries(p.attrs)
        .map(([attrSlug, valueSlug]) => {
          const vid = valueIdByKey.get(`${attrSlug}:${valueSlug}`);
          return vid ? { product_id: id!, attribute_value_id: vid } : null;
        })
        .filter(Boolean);
      if (rows.length) await sb.from("product_attribute_values").insert(rows);
    }

    if (!onRequest && p.pairs >= 500) {
      await sb.from("product_price_tiers").delete().eq("product_id", id!);
      await sb.from("product_price_tiers").insert([
        { product_id: id!, min_pairs: p.pairs, max_pairs: 9999, price_per_pair: p.pair, sort_order: 0 },
        { product_id: id!, min_pairs: 10000, max_pairs: 30000, price_per_pair: +(p.pair - 0.2).toFixed(2), sort_order: 1 },
        { product_id: id!, min_pairs: 30000, max_pairs: null, price_per_pair: +(p.pair - 0.4).toFixed(2), sort_order: 2 },
      ]);
    }
  }

  if (productIds.length > 3) {
    await sb.from("product_relations").upsert([
      { product_id: productIds[0], related_product_id: productIds[1], relation_type: "similar", sort_order: 1 },
      { product_id: productIds[0], related_product_id: productIds[2], relation_type: "similar", sort_order: 2 },
      { product_id: productIds[0], related_product_id: productIds[3], relation_type: "similar", sort_order: 3 },
    ]);
  }

  return productIds;
}

async function seedAttributes(): Promise<Map<string, string>> {
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
        { slug: "8", name: "8 нитей", sort: 5 },
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
    if (attrId) {
      await sb
        .from("attributes")
        .update({
          name: a.name,
          type: a.type,
          is_filterable: true,
          sort_order: a.sort,
        })
        .eq("id", attrId);
    } else {
      const { data, error } = await sb
        .from("attributes")
        .insert({
          slug: a.slug,
          name: a.name,
          type: a.type,
          is_filterable: true,
          sort_order: a.sort,
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
      const payload = {
        attribute_id: attrId!,
        slug: v.slug,
        name: v.name,
        color_hex: v.color ?? null,
        sort_order: v.sort,
      };
      if (vid) {
        await sb.from("attribute_values").update(payload).eq("id", vid);
      } else {
        const { data, error } = await sb
          .from("attribute_values")
          .insert(payload)
          .select("id")
          .single();
        if (error) {
          console.error("attr val", v.slug, error.message);
          continue;
        }
        vid = data.id;
      }
      map.set(`${a.slug}:${v.slug}`, vid!);
    }
  }

  return map;
}

async function seedHomepage() {
  await sb.from("homepage_sections").upsert(
    [
      {
        section_key: "hero",
        title: "Перчатки оптом в Орске",
        subtitle: "фабрика ХБтекс",
        config: {
          block_type: "hero",
          background: IMG.heroBg,
          image: IMG.heroProduct,
          image_alt: "Все виды перчаток и рукавиц",
          cta_label: "Запросить прайс-лист",
          cta_url: "/prajs-list/",
          button_label: "Запросить прайс-лист",
          button_url: "/prajs-list/",
        },
        is_visible: true,
        sort_order: 10,
      },
      {
        section_key: "info_boxes",
        title: null,
        subtitle: null,
        config: { block_type: "info_boxes", benefit_group: "info_boxes" },
        is_visible: true,
        sort_order: 20,
      },
      {
        section_key: "categories",
        title: "Каталог",
        subtitle: "Основные направления",
        config: { block_type: "categories", limit: 6, description: "Выберите категорию" },
        is_visible: true,
        sort_order: 25,
      },
      {
        section_key: "promo_row_1",
        title: null,
        config: { block_type: "promo", promo_row: 1 },
        is_visible: true,
        sort_order: 30,
      },
      {
        section_key: "promo_row_2",
        title: null,
        config: { block_type: "promo", promo_row: 2 },
        is_visible: true,
        sort_order: 40,
      },
      {
        section_key: "products_hb",
        title: "Перчатки ХБ",
        config: {
          block_type: "products",
          category_path: "rabochie-perchatki/perchatki-hb",
          limit: 12,
          button_label: "Все ХБ перчатки",
          button_url: "/rabochie-perchatki/perchatki-hb/",
        },
        is_visible: true,
        sort_order: 50,
      },
      {
        section_key: "products_pvc",
        title: "Перчатки с ПВХ",
        config: {
          block_type: "products",
          category_path: "rabochie-perchatki/perchatki-hb/perchatki-s-pvh",
          limit: 12,
          button_label: "Все с ПВХ",
          button_url: "/rabochie-perchatki/perchatki-hb/perchatki-s-pvh/",
        },
        is_visible: true,
        sort_order: 60,
      },
      {
        section_key: "novelties",
        title: "Новинки",
        subtitle: "Актуальные позиции производства",
        config: { block_type: "novelties", limit: 8, button_label: "В каталог", button_url: "/rabochie-perchatki/" },
        is_visible: true,
        sort_order: 65,
      },
      {
        section_key: "branding",
        title: "Брендирование",
        subtitle: "Нанесём логотип вашей компании",
        config: {
          block_type: "branding",
          description: "<p>Нанесём логотип компании на перчатки в короткий срок.</p>",
          image: IMG.pvh,
          button_label: "Заявка на нанесение",
          button_url: "/nanesenie-logotipa/",
        },
        is_visible: true,
        sort_order: 68,
      },
      {
        section_key: "advantages",
        title: null,
        config: { block_type: "advantages", benefit_group: "advantages" },
        is_visible: true,
        sort_order: 70,
      },
      {
        section_key: "seo",
        title: "Рабочие перчатки от производителя оптом",
        config: {
          block_type: "about",
          html: `<p>Фабрика «ХБтекс» — производитель рабочих перчаток в Орске. Собственное производство, сертифицированная продукция, оптовые цены и доставка по всей России.</p><h3>Преимущества сотрудничества с фабрикой «ХБтекс»</h3><ul><li>✔ Собственное производство</li><li>✔ Контроль качества материалов</li><li>✔ Широкий ассортимент</li><li>✔ Выгодные оптовые цены</li><li>✔ Стабильные поставки</li></ul><h3>Закажите рабочие перчатки оптом напрямую от производителя!</h3>`,
          description: `<p>Фабрика «ХБтекс» — производитель рабочих перчаток в Орске. Собственное производство, сертифицированная продукция, оптовые цены и доставка по всей России.</p><h3>Преимущества сотрудничества с фабрикой «ХБтекс»</h3><ul><li>✔ Собственное производство</li><li>✔ Контроль качества материалов</li><li>✔ Широкий ассортимент</li><li>✔ Выгодные оптовые цены</li><li>✔ Стабильные поставки</li></ul>`,
          button_label: "О компании",
          button_url: "/o-kompanii-viteks/",
        },
        is_visible: true,
        sort_order: 80,
      },
      {
        section_key: "steps",
        title: "Как сделать заказ?",
        config: { block_type: "steps" },
        is_visible: true,
        sort_order: 90,
      },
      {
        section_key: "reviews",
        title: "Отзывы партнеров",
        config: { block_type: "reviews", logo: IMG.ya },
        is_visible: true,
        sort_order: 100,
      },
      {
        section_key: "contacts",
        title: "Контакты",
        subtitle: "Свяжитесь с нами удобным способом",
        config: {
          block_type: "contacts",
          button_label: "Все контакты",
          button_url: "/contact/",
        },
        is_visible: true,
        sort_order: 110,
      },
    ],
    { onConflict: "section_key" }
  );

  await sb.from("homepage_benefits").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("homepage_benefits").insert([
    { block_group: "info_boxes", title: "Оперативная доставка по России", description: null, icon_path: IMG.dostavka, sort_order: 1, is_visible: true },
    { block_group: "info_boxes", title: "Купить перчатки в Орске на складе производства", description: null, icon_path: IMG.telezhka, sort_order: 2, is_visible: true },
    { block_group: "info_boxes", title: "ХБ перчатки сертифицированы", description: null, icon_path: IMG.sert, sort_order: 3, is_visible: true },
    { block_group: "info_boxes", title: "Компания 5 лет на рынке", description: null, icon_path: IMG.years, sort_order: 4, is_visible: true },
    { block_group: "advantages", title: "Новинки перчаток", description: "Каталог перчаток регулярно расширяется и пополняется", sort_order: 1, is_visible: true },
    { block_group: "advantages", title: "Брендирование", description: "Нанесем логотип компании на перчатки, в короткий срок.", sort_order: 2, is_visible: true },
    { block_group: "advantages", title: "Гарантия возврата", description: "Не подошел товар? Поменяем или вернем деньги.", sort_order: 3, is_visible: true },
    { block_group: "advantages", title: "Быстрая доставка", description: "Быстрая доставка ТК по всей территории России", sort_order: 4, is_visible: true },
  ]);

  await sb.from("homepage_promo_banners").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("homepage_promo_banners").insert([
    { row_index: 1, title: "Перчатки c ПВХ", button_label: "Перчатки c ПВХ", link_url: "/rabochie-perchatki/perchatki-hb/perchatki-s-pvh/", image_path: IMG.pvh, sort_order: 1, is_visible: true },
    { row_index: 1, title: "Перчатки ХБ", button_label: "Перчатки ХБ", link_url: "/rabochie-perchatki/perchatki-hb/", image_path: IMG.hb, sort_order: 2, is_visible: true },
    { row_index: 1, title: "Рукавицы рабочие", button_label: "Рукавицы рабочие", link_url: "/rukavicy/", image_path: IMG.rukav, sort_order: 3, is_visible: true },
    { row_index: 2, title: "Вафельное полотно", button_label: "Вафельное полотно", link_url: "/tehnicheskie-tkani/vafelnoe-polotno/", image_path: IMG.vafel, sort_order: 1, is_visible: true },
    { row_index: 2, title: "ХПП", button_label: "ХПП", link_url: "/tehnicheskie-tkani/holstoproshivnoe-polotno/", image_path: IMG.hpp, sort_order: 2, is_visible: true },
    { row_index: 2, title: "Перчатки п/ш и шерстяные", button_label: "Перчатки п/ш и шерстяные", link_url: "/rabochie-perchatki/perchatki-polusherstyanye-i-sherstyanye/", image_path: IMG.psh, sort_order: 3, is_visible: true },
  ]);

  await sb.from("homepage_steps").upsert(
    [
      { step_number: 1, title: "Оставьте заявку", description: "Заполните форму, заявку через корзину на сайте или позвоните нам", sort_order: 1, is_visible: true },
      { step_number: 2, title: "Менеджер поможет", description: "Помогаем с выбором перчаток и обсуждаем детали заказа", sort_order: 2, is_visible: true },
      { step_number: 3, title: "Производите оплату", description: "Вы производите оплату по безналичному расчёту", sort_order: 3, is_visible: true },
      { step_number: 4, title: "Доставляем товар", description: "Осуществляем доставку по указанному вами адресу", link_url: "/dostavka/", link_label: "подробности доставки", sort_order: 4, is_visible: true },
    ],
    { onConflict: "step_number" }
  );
}

async function seedReviews() {
  await sb.from("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("reviews").insert([
    { source: "yandex", author_name: "ВАСИЛИЙ ВАСИЛЬЕВИЧ ГРИДНЕВ", body: "Не первый год закупаю перчатки для автосервиса. Качество стабильное, цены адекватные, доставка без сюрпризов.", rating: 5, review_date: "2025-04-05", external_url: "https://yandex.ru/maps/org/205409981904/reviews/", is_published: true, sort_order: 1 },
    { source: "yandex", author_name: "Алексей Сионихин", body: "Сотрудничаем уже около полугода. Менеджеры отвечают быстро, ассортимент хороший.", rating: 5, review_date: "2025-04-02", external_url: "https://yandex.ru/maps/org/205409981904/reviews/", is_published: true, sort_order: 2 },
    { source: "yandex", author_name: "Инкогнито 0933", body: "Качество на высоте, хороший ценник. Рекомендую производителя.", rating: 5, review_date: "2025-04-03", external_url: "https://yandex.ru/maps/org/205409981904/reviews/", is_published: true, sort_order: 3 },
    { source: "yandex", author_name: "Андрей Панайтиди", body: "Благодарность за помощь и оперативную отгрузку. Всё на уровне.", rating: 5, review_date: "2025-04-03", external_url: "https://yandex.ru/maps/org/205409981904/reviews/", is_published: true, sort_order: 4 },
    { source: "yandex", author_name: "Ксения", body: "Беру перчатки не первый раз. Упаковка аккуратная, товар соответствует описанию.", rating: 5, review_date: "2025-04-02", external_url: "https://yandex.ru/maps/org/205409981904/reviews/", is_published: true, sort_order: 5 },
    { source: "yandex", author_name: "Patrol 37", body: "Хорошая компания, хорошая продукция. Будем продолжать сотрудничать.", rating: 5, review_date: "2025-04-03", external_url: "https://yandex.ru/maps/org/205409981904/reviews/", is_published: true, sort_order: 6 },
    { source: "yandex", author_name: "илья тимин", body: "Товар качественный рекомендую продавца", rating: 5, review_date: "2025-04-02", external_url: "https://yandex.ru/maps/org/205409981904/reviews/", is_published: true, sort_order: 7 },
    { source: "yandex", author_name: "Инкогнито 3147", body: "Закупался не раз, цена и качество норм", rating: 5, review_date: "2025-04-02", external_url: "https://yandex.ru/maps/org/205409981904/reviews/", is_published: true, sort_order: 8 },
  ]);
}

async function seedPages() {
  const pages = [
    { slug: "contact", title: "Контакты", template: "contact", html: `<p>Производство: Россия, Орск, пр. Металлистов, 3</p><p>Телефон: +7 (922) 872-00-08</p><p>Email: tarabanov.aleksandr@yandex.ru</p><p>Режим: ПН–ПТ, 09:00–17:00 (МСК)</p>` },
    { slug: "dostavka", title: "Доставка", template: "default", html: `<p>Доставка транспортными компаниями по всей территории России. Возможен самовывоз со склада производства в Орске.</p>` },
    { slug: "oplata", title: "Оплата", template: "default", html: `<p>Оплата по безналичному расчёту для юридических лиц и ИП. Реквизиты ООО «ФАБРИКА ВИТЕКС» ИНН 3700000996 предоставляются при оформлении заказа.</p>` },
    { slug: "prajs-list", title: "Отправить запрос на прайс-лист", template: "price_list", html: `<p>Ознакомьтесь с ценами на нашу продукцию. Специальные предложения на рабочие перчатки.</p>` },
    { slug: "o-kompanii-viteks", title: "О компании ХБтекс", template: "about", html: `<p>Надёжный поставщик рабочих перчаток. Широкий ассортимент ХБ перчаток, нанесение логотипов, контроль качества от закупки пряжи. Производство в Орске.</p>` },
    { slug: "nanesenie-logotipa", title: "Нанесение логотипа на ХБ перчатки в Орске", template: "logo", html: `<p>Нанесение логотипа шелкографией и термотрансфером на рабочие перчатки.</p>` },
    { slug: "optovym-pokupatelyam", title: "Предлагаем выгодное сотрудничество оптовым покупателям", template: "partnership", html: `<p>Работаем с оптовыми покупателями напрямую с производства.</p>` },
    { slug: "optovym-pokupatelyam/otdel-zakupki", title: "Отдел закупки", template: "default", html: `<p>Закупка сырья для производства. Свяжитесь с нами по контактам на сайте.</p>` },
    { slug: "privacy-policy", title: "Политика обработки персональных данных", template: "default", html: `<p>Мы обрабатываем персональные данные в соответствии с законодательством РФ. Сайт использует cookie, Яндекс.Метрику и Google reCAPTCHA.</p>` },
    { slug: "spasibo-za-obrashhenie", title: "Спасибо за обращение", template: "thanks", html: `<p>Ваша заявка отправлена. Менеджер свяжется с вами в ближайшее время.</p>` },
  ];
  for (const p of pages) {
    await sb.from("pages").upsert(
      {
        slug: p.slug,
        title: p.title,
        content_html: p.html,
        template: p.template,
        status: "published",
        seo_title: p.title,
        published_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
  }
}

async function seedMenus(idByPath: Map<string, string>) {
  await sb.from("menu_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const { data: megaRoot } = await sb
    .from("menu_items")
    .insert({
      menu_key: "header_mega",
      title: "Меню",
      url: "#",
      link_type: "custom",
      icon_path: IMG.menu,
      sort_order: 0,
      is_visible: true,
    })
    .select("id")
    .single();

  const rootId = megaRoot!.id;

  async function add(parent: string | null, title: string, url: string, key: string, sort: number, catPath?: string) {
    const { data } = await sb
      .from("menu_items")
      .insert({
        menu_key: key,
        parent_id: parent,
        title,
        url,
        link_type: catPath ? "category" : "custom",
        category_id: catPath ? idByPath.get(catPath) ?? null : null,
        sort_order: sort,
        is_visible: true,
      })
      .select("id")
      .single();
    return data!.id;
  }

  const gloves = await add(rootId, "Рабочие перчатки", "/rabochie-perchatki/", "header_mega", 1, "rabochie-perchatki");
  await add(gloves, "Все ХБ перчатки", "/rabochie-perchatki/perchatki-hb/", "header_mega", 1, "rabochie-perchatki/perchatki-hb");
  await add(gloves, "Перчатки с ПВХ", "/rabochie-perchatki/perchatki-hb/perchatki-s-pvh/", "header_mega", 2, "rabochie-perchatki/perchatki-hb/perchatki-s-pvh");
  await add(gloves, "Шерстяные", "/rabochie-perchatki/perchatki-polusherstyanye-i-sherstyanye/", "header_mega", 3, "rabochie-perchatki/perchatki-polusherstyanye-i-sherstyanye");

  const ruk = await add(rootId, "Рукавицы, фартуки, нарукавники", "/rukavicy/", "header_mega", 2, "rukavicy");
  await add(ruk, "Брезентовые", "/rukavicy/brezentovye/", "header_mega", 1, "rukavicy/brezentovye");
  await add(ruk, "ХБ", "/rukavicy/hb/", "header_mega", 2, "rukavicy/hb");
  await add(ruk, "Фартуки, нарукавники", "/rukavicy/fartuki/", "header_mega", 3, "rukavicy/fartuki");

  const tkan = await add(rootId, "Технические ткани", "/tehnicheskie-tkani/", "header_mega", 3, "tehnicheskie-tkani");
  await add(tkan, "Вафельное полотно", "/tehnicheskie-tkani/vafelnoe-polotno/", "header_mega", 1);
  await add(tkan, "Холстопрошивное полотно", "/tehnicheskie-tkani/holstoproshivnoe-polotno/", "header_mega", 2);

  await add(rootId, "Нанесение логотипа", "/nanesenie-logotipa/", "header_mega", 4);
  await add(rootId, "Прайс-лист", "/prajs-list/", "header_mega", 5);
  await add(rootId, "Контакты", "/contact/", "header_mega", 6);
  await add(rootId, "Доставка", "/dostavka/", "header_mega", 7);
  await add(rootId, "Оплата", "/oplata/", "header_mega", 8);
  await add(rootId, "О компании ХБтекс", "/o-kompanii-viteks/", "header_mega", 9);

  // quick links
  await add(null, "ХБ перчатки", "/rabochie-perchatki/perchatki-hb/", "header_quick", 1);
  await add(null, "Перчатки с ПВХ", "/rabochie-perchatki/perchatki-hb/perchatki-s-pvh/", "header_quick", 2);

  // mobile
  const mGloves = await add(null, "Рабочие перчатки", "/rabochie-perchatki/", "mobile", 1);
  await add(mGloves, "Перчатки ХБ", "/rabochie-perchatki/perchatki-hb/", "mobile", 1);
  await add(mGloves, "Перчатки с ПВХ", "/rabochie-perchatki/perchatki-hb/perchatki-s-pvh/", "mobile", 2);
  const mRuk = await add(null, "Рукавицы, фартуки, нарукавники", "/rukavicy/", "mobile", 2);
  await add(mRuk, "Брезентовые", "/rukavicy/brezentovye/", "mobile", 1);
  await add(null, "Ткани для дома", "/tehnicheskie-tkani/", "mobile", 3);
  await add(null, "Нанесение логотипа на перчатки", "/nanesenie-logotipa/", "mobile", 4);
  await add(null, "Прайс-лист", "/prajs-list/", "mobile", 5);
  const mInfo = await add(null, "Информация", "#", "mobile", 6);
  await add(mInfo, "Контакты", "/contact/", "mobile", 1);
  await add(mInfo, "Оплата", "/oplata/", "mobile", 2);
  await add(mInfo, "О нас", "/o-kompanii-viteks/", "mobile", 3);
  await add(mInfo, "Доставка", "/dostavka/", "mobile", 4);
  await add(mInfo, "Сотрудничество", "/optovym-pokupatelyam/", "mobile", 5);

  // footer
  const footerInfo = [
    ["Прайс-лист", "/prajs-list/"],
    ["Заявка на сотрудничество", "/optovym-pokupatelyam/"],
    ["Закупка сырья", "/optovym-pokupatelyam/otdel-zakupki/"],
    ["Контакты", "/contact/"],
    ["Реквизиты оплаты", "/oplata/"],
    ["Доставка по РФ", "/dostavka/"],
    ["Нанесение логотипа компании", "/nanesenie-logotipa/"],
  ];
  for (let i = 0; i < footerInfo.length; i++) {
    await add(null, footerInfo[i][0], footerInfo[i][1], "footer_info", i + 1);
  }
  await add(null, "Перчатки рабочие", "/rabochie-perchatki/", "footer_catalog", 1);
  await add(null, "Рукавицы", "/rukavicy/", "footer_catalog", 2);
  await add(null, "Технические ткани", "/tehnicheskie-tkani/", "footer_catalog", 3);
  await add(null, "ХБ перчатки", "/rabochie-perchatki/perchatki-hb/", "footer_gloves", 1);
  await add(null, "ХБ перчатки с ПВХ", "/rabochie-perchatki/perchatki-hb/perchatki-s-pvh/", "footer_gloves", 2);
  await add(null, "Шерстяные, П/Ш", "/rabochie-perchatki/perchatki-polusherstyanye-i-sherstyanye/", "footer_gloves", 3);
}

async function main() {
  console.log("Seeding settings...");
  await upsertSettings();
  console.log("Seeding categories...");
  const idByPath = await seedCategories();
  console.log("Seeding products...");
  await seedProducts(idByPath);
  console.log("Seeding homepage...");
  await seedHomepage();
  console.log("Seeding reviews...");
  await seedReviews();
  console.log("Seeding pages...");
  await seedPages();
  console.log("Seeding menus...");
  await seedMenus(idByPath);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
