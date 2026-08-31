import { createClient } from "@/lib/supabase/server";
import type {
  Attribute,
  AttributeValue,
  CatalogQuery,
  Category,
  City,
  FilterAttribute,
  HomepageBenefit,
  HomepagePromoBanner,
  HomepageSection,
  HomepageStep,
  MenuItem,
  Page,
  Product,
  ProductAttributeRow,
  ProductDocument,
  ProductImage,
  ProductPriceTier,
  ProductWithImage,
  Review,
  SiteSetting,
} from "@/lib/types";

export async function getSettings(): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .eq("is_public", true);
  const map: Record<string, unknown> = {};
  (data as SiteSetting[] | null)?.forEach((row) => {
    map[row.key] = row.value;
  });
  return map;
}

export async function getCities(): Promise<City[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data as City[]) ?? [];
}

export async function getMenuTree(menuKey?: string): Promise<MenuItem[]> {
  const supabase = await createClient();
  let q = supabase
    .from("menu_items")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  if (menuKey) q = q.eq("menu_key", menuKey);
  const { data } = await q;
  const items = (data as MenuItem[]) ?? [];
  return buildTree(items);
}

export async function getMenusByKeys(keys: string[]): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_visible", true)
    .in("menu_key", keys)
    .order("sort_order");
  return (data as MenuItem[]) ?? [];
}

function buildTree(items: MenuItem[]): MenuItem[] {
  const map = new Map<string, MenuItem>();
  items.forEach((i) => map.set(i.id, { ...i, children: [] }));
  const roots: MenuItem[] = [];
  map.forEach((item) => {
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children!.push(item);
    } else if (!item.parent_id) {
      roots.push(item);
    }
  });
  return roots;
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("homepage_sections")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  return (data as HomepageSection[]) ?? [];
}

export async function getBenefits(group?: string): Promise<HomepageBenefit[]> {
  const supabase = await createClient();
  let q = supabase
    .from("homepage_benefits")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  if (group) q = q.eq("block_group", group);
  const { data } = await q;
  return (data as HomepageBenefit[]) ?? [];
}

export async function getSteps(): Promise<HomepageStep[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("homepage_steps")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  return (data as HomepageStep[]) ?? [];
}

export async function getPromoBanners(
  rowIndex?: number
): Promise<HomepagePromoBanner[]> {
  const supabase = await createClient();
  let q = supabase
    .from("homepage_promo_banners")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  if (rowIndex != null) q = q.eq("row_index", rowIndex);
  const { data } = await q;
  return (data as HomepagePromoBanner[]) ?? [];
}

export async function getReviews(limit = 8): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("is_published", true)
    .order("sort_order")
    .limit(limit);
  return (data as Review[]) ?? [];
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as Page) ?? null;
}

export async function getCategoryByPath(path: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("path", path)
    .eq("status", "published")
    .maybeSingle();
  return (data as Category) ?? null;
}

export async function getCategoryChildren(
  parentId: string
): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("parent_id", parentId)
    .eq("status", "published")
    .order("sort_order");
  return (data as Category[]) ?? [];
}

export async function getFeaturedProducts(
  limit = 8
): Promise<ProductWithImage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("menu_order")
    .limit(limit);
  return attachPrimaryImages((data as Product[]) ?? []);
}

export async function getRootCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .is("parent_id", null)
    .eq("status", "published")
    .order("sort_order");
  return (data as Category[]) ?? [];
}

async function attachPrimaryImages(
  products: Product[]
): Promise<ProductWithImage[]> {
  if (!products.length) return [];
  const supabase = await createClient();
  const ids = products.map((p) => p.id);
  const { data: images } = await supabase
    .from("product_images")
    .select("*")
    .in("product_id", ids)
    .order("sort_order");
  const byProduct = new Map<string, ProductImage[]>();
  ((images as ProductImage[]) ?? []).forEach((img) => {
    const list = byProduct.get(img.product_id) ?? [];
    list.push(img);
    byProduct.set(img.product_id, list);
  });
  return products.map((p) => {
    const imgs = byProduct.get(p.id) ?? [];
    const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
    return {
      ...p,
      images: imgs,
      primary_image: primary?.storage_path ?? null,
    };
  });
}

async function productIdsInCategoryTree(path: string): Promise<string[]> {
  const supabase = await createClient();
  const category = await getCategoryByPath(path);
  if (!category) return [];

  const { data: descendants } = await supabase
    .from("categories")
    .select("id")
    .like("path", `${path}/%`)
    .eq("status", "published");

  const catIds = [
    category.id,
    ...((descendants as { id: string }[] | null)?.map((d) => d.id) ?? []),
  ];

  const { data: allLinks } = await supabase
    .from("product_categories")
    .select("product_id")
    .in("category_id", catIds);

  return [
    ...new Set(
      (allLinks as { product_id: string }[] | null)?.map((l) => l.product_id) ?? []
    ),
  ];
}

async function filterProductIdsByAttributes(
  productIds: string[],
  filters: Record<string, string[]>
): Promise<string[]> {
  if (!Object.keys(filters).length) return productIds;
  const supabase = await createClient();
  let current = new Set(productIds);

  for (const [attrSlug, valueSlugs] of Object.entries(filters)) {
    if (!valueSlugs.length) continue;
    const { data: attr } = await supabase
      .from("attributes")
      .select("id")
      .eq("slug", attrSlug)
      .maybeSingle();
    if (!attr) {
      current = new Set();
      break;
    }
    const { data: values } = await supabase
      .from("attribute_values")
      .select("id")
      .eq("attribute_id", (attr as { id: string }).id)
      .in("slug", valueSlugs);
    const valueIds =
      (values as { id: string }[] | null)?.map((v) => v.id) ?? [];
    if (!valueIds.length) {
      current = new Set();
      break;
    }
    const { data: links } = await supabase
      .from("product_attribute_values")
      .select("product_id")
      .in("attribute_value_id", valueIds)
      .in("product_id", [...current]);
    current = new Set(
      (links as { product_id: string }[] | null)?.map((l) => l.product_id) ?? []
    );
    if (!current.size) break;
  }

  return [...current];
}

export async function getProductsByCategoryPath(
  path: string,
  opts: Partial<CatalogQuery> & { limit?: number; offset?: number } = {}
): Promise<{ products: ProductWithImage[]; total: number }> {
  const supabase = await createClient();
  let productIds = await productIdsInCategoryTree(path);
  if (!productIds.length) return { products: [], total: 0 };

  if (opts.filters && Object.keys(opts.filters).length) {
    productIds = await filterProductIdsByAttributes(productIds, opts.filters);
    if (!productIds.length) return { products: [], total: 0 };
  }

  let q = supabase
    .from("products")
    .select("*", { count: "exact" })
    .in("id", productIds)
    .eq("status", "published");

  if (opts.stock?.length) q = q.in("stock_status", opts.stock);
  if (opts.minPrice != null) q = q.gte("pack_price", opts.minPrice);
  if (opts.maxPrice != null) q = q.lte("pack_price", opts.maxPrice);

  const orderBy = opts.orderBy ?? "menu_order";
  if (orderBy === "price") q = q.order("pack_price", { ascending: true });
  else if (orderBy === "price-desc") q = q.order("pack_price", { ascending: false });
  else if (orderBy === "date") q = q.order("published_at", { ascending: false });
  else if (orderBy === "popularity")
    q = q.order("is_featured", { ascending: false }).order("menu_order", { ascending: true });
  else q = q.order("menu_order", { ascending: true });

  const perPage = opts.perPage ?? opts.limit ?? 30;
  const page = opts.page ?? 1;
  const offset = opts.offset ?? (page - 1) * perPage;
  q = q.range(offset, offset + perPage - 1);

  const { data, count } = await q;
  const products = await attachPrimaryImages((data as Product[]) ?? []);
  return { products, total: count ?? products.length };
}

export async function getFilterableAttributes(
  categoryPath: string
): Promise<FilterAttribute[]> {
  const supabase = await createClient();
  const productIds = await productIdsInCategoryTree(categoryPath);
  if (!productIds.length) return [];

  const { data: pav } = await supabase
    .from("product_attribute_values")
    .select("product_id, attribute_value_id")
    .in("product_id", productIds);

  const links =
    (pav as { product_id: string; attribute_value_id: string }[] | null) ?? [];
  if (!links.length) return [];

  const valueIds = [...new Set(links.map((l) => l.attribute_value_id))];
  const countByValue = new Map<string, number>();
  for (const l of links) {
    countByValue.set(
      l.attribute_value_id,
      (countByValue.get(l.attribute_value_id) ?? 0) + 1
    );
  }

  const { data: values } = await supabase
    .from("attribute_values")
    .select("*")
    .in("id", valueIds)
    .order("sort_order");

  const vals = (values as AttributeValue[] | null) ?? [];
  const attrIds = [...new Set(vals.map((v) => v.attribute_id))];

  const { data: attrs } = await supabase
    .from("attributes")
    .select("*")
    .in("id", attrIds)
    .eq("is_filterable", true)
    .order("sort_order");

  const attributes = (attrs as Attribute[] | null) ?? [];

  return attributes.map((a) => ({
    ...a,
    values: vals
      .filter((v) => v.attribute_id === a.id)
      .map((v) => ({
        ...v,
        count: countByValue.get(v.id) ?? 0,
      })),
  }));
}

export async function getProductAttributes(
  productId: string
): Promise<ProductAttributeRow[]> {
  const supabase = await createClient();
  const { data: pav } = await supabase
    .from("product_attribute_values")
    .select("attribute_value_id")
    .eq("product_id", productId);

  const valueIds =
    (pav as { attribute_value_id: string }[] | null)?.map(
      (p) => p.attribute_value_id
    ) ?? [];
  if (!valueIds.length) return [];

  const { data: values } = await supabase
    .from("attribute_values")
    .select("*")
    .in("id", valueIds);

  const vals = (values as AttributeValue[] | null) ?? [];
  const attrIds = [...new Set(vals.map((v) => v.attribute_id))];
  const { data: attrs } = await supabase
    .from("attributes")
    .select("*")
    .in("id", attrIds)
    .order("sort_order");

  const attrMap = new Map(
    ((attrs as Attribute[] | null) ?? []).map((a) => [a.id, a])
  );

  return vals
    .map((v) => {
      const a = attrMap.get(v.attribute_id);
      if (!a) return null;
      return {
        attribute_name: a.name,
        attribute_slug: a.slug,
        value_name: v.name,
        value_slug: v.slug,
        color_hex: v.color_hex,
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      a!.attribute_name.localeCompare(b!.attribute_name, "ru")
    ) as ProductAttributeRow[];
}

export async function getProductsByCategorySlugInConfig(
  categoryPath: string,
  limit = 12
): Promise<ProductWithImage[]> {
  const { products } = await getProductsByCategoryPath(categoryPath, { limit });
  return products;
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithImage | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  const [withImg] = await attachPrimaryImages([data as Product]);

  const { data: catLink } = await supabase
    .from("product_categories")
    .select("category_id")
    .eq("product_id", withImg.id)
    .limit(1)
    .maybeSingle();

  if (catLink) {
    const { data: cat } = await supabase
      .from("categories")
      .select("path")
      .eq("id", (catLink as { category_id: string }).category_id)
      .maybeSingle();
    withImg.category_path = (cat as { path: string } | null)?.path ?? null;
  }

  return withImg;
}

export async function getProductExtras(productId: string) {
  const supabase = await createClient();
  const [tiers, docs, related, attributes] = await Promise.all([
    supabase
      .from("product_price_tiers")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order"),
    supabase
      .from("product_documents")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order"),
    supabase
      .from("product_relations")
      .select("related_product_id, sort_order")
      .eq("product_id", productId)
      .order("sort_order"),
    getProductAttributes(productId),
  ]);

  const relatedIds =
    (related.data as { related_product_id: string }[] | null)?.map(
      (r) => r.related_product_id
    ) ?? [];

  let relatedProducts: ProductWithImage[] = [];
  if (relatedIds.length) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .in("id", relatedIds)
      .eq("status", "published");
    relatedProducts = await attachPrimaryImages((data as Product[]) ?? []);
  }

  return {
    tiers: (tiers.data as ProductPriceTier[]) ?? [],
    documents: (docs.data as ProductDocument[]) ?? [],
    related: relatedProducts,
    attributes,
  };
}

export async function searchProducts(
  query: string,
  limit = 20
): Promise<ProductWithImage[]> {
  if (!query || query.trim().length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
    .order("menu_order")
    .limit(limit);
  return attachPrimaryImages((data as Product[]) ?? []);
}

export async function getCategoryBreadcrumbs(
  path: string
): Promise<{ name: string; href: string }[]> {
  const parts = path.split("/").filter(Boolean);
  const crumbs: { name: string; href: string }[] = [];
  let acc = "";
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    const cat = await getCategoryByPath(acc);
    if (cat) crumbs.push({ name: cat.name, href: `/${cat.path}` });
  }
  return crumbs;
}

export function settingString(
  settings: Record<string, unknown>,
  key: string,
  fallback = ""
): string {
  const v = settings[key];
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  return String(v);
}

export function settingArray(
  settings: Record<string, unknown>,
  key: string
): string[] {
  const v = settings[key];
  if (Array.isArray(v)) return v.map(String);
  return [];
}
