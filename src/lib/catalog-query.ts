import type { CatalogOrderBy, CatalogQuery, StockStatus } from "@/lib/types";

const ORDER_MAP: Record<string, CatalogOrderBy> = {
  menu_order: "menu_order",
  popularity: "popularity",
  price: "price",
  "price-desc": "price-desc",
  date: "date",
};

export function parseCatalogSearchParams(
  sp: Record<string, string | string[] | undefined>
): CatalogQuery {
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const page = Math.max(1, Number(get("page")) || 1);
  const perPageRaw = Number(get("per_page")) || 30;
  const perPage = [12, 24, 30, 48].includes(perPageRaw) ? perPageRaw : 30;
  const orderBy = ORDER_MAP[get("orderby") || ""] ?? "menu_order";

  const minPrice = get("min_price") ? Number(get("min_price")) : undefined;
  const maxPrice = get("max_price") ? Number(get("max_price")) : undefined;

  const stockRaw = (get("stock") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as StockStatus[];
  const stock = stockRaw.length ? stockRaw : undefined;

  const filters: Record<string, string[]> = {};
  for (const [key, raw] of Object.entries(sp)) {
    if (!key.startsWith("filter_")) continue;
    const slug = key.slice("filter_".length);
    const val = Array.isArray(raw) ? raw.join(",") : raw || "";
    const values = val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (values.length) filters[slug] = values;
  }

  return {
    page,
    perPage,
    orderBy,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    stock,
    filters,
  };
}

export function buildCatalogQueryString(
  base: CatalogQuery,
  patch: Partial<CatalogQuery> & { filters?: Record<string, string[]> } = {}
): string {
  const q: CatalogQuery = {
    ...base,
    ...patch,
    filters: patch.filters ?? base.filters,
  };
  const params = new URLSearchParams();
  if (q.page > 1) params.set("page", String(q.page));
  if (q.perPage !== 30) params.set("per_page", String(q.perPage));
  if (q.orderBy !== "menu_order") params.set("orderby", q.orderBy);
  if (q.minPrice != null) params.set("min_price", String(q.minPrice));
  if (q.maxPrice != null) params.set("max_price", String(q.maxPrice));
  if (q.stock?.length) params.set("stock", q.stock.join(","));
  for (const [slug, values] of Object.entries(q.filters)) {
    if (values.length) params.set(`filter_${slug}`, values.join(","));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}
