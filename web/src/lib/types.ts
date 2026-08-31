export type UserRole = "customer" | "manager" | "admin";
export type ContentStatus = "draft" | "published" | "archived";
export type StockStatus = "in_stock" | "on_order" | "out_of_stock";
export type FormType =
  | "contact"
  | "price_list"
  | "product_request"
  | "product_selection"
  | "partnership"
  | "logo_application";

export type SiteSetting = {
  id: string;
  key: string;
  value: unknown;
  label: string | null;
  group_name: string | null;
  is_public: boolean;
};

export type City = {
  id: string;
  name: string;
  slug: string;
  subdomain_url: string | null;
  is_default: boolean;
  phone: string | null;
  address: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Page = {
  id: string;
  slug: string;
  title: string;
  content_html: string | null;
  content_json: Record<string, unknown> | null;
  template: string;
  status: ContentStatus;
  seo_title: string | null;
  seo_description: string | null;
  og_image_path: string | null;
  published_at: string | null;
  sort_order: number;
};

export type Category = {
  id: string;
  parent_id: string | null;
  slug: string;
  path: string;
  name: string;
  description: string | null;
  image_path: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: ContentStatus;
  sort_order: number;
};

export type Product = {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  short_description: string | null;
  description: string | null;
  status: ContentStatus;
  stock_status: StockStatus;
  stock_label: string | null;
  pack_price: number | null;
  pairs_per_pack: number | null;
  price_per_pair: number | null;
  currency: string;
  price_on_request: boolean;
  weight_grams: number | null;
  is_featured: boolean;
  menu_order: number;
  seo_title: string | null;
  seo_description: string | null;
};

export type ProductImage = {
  id: string;
  product_id: string;
  storage_path: string;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type ProductWithImage = Product & {
  primary_image?: string | null;
  images?: ProductImage[];
  category_path?: string | null;
};

export type MenuItem = {
  id: string;
  menu_key: string;
  parent_id: string | null;
  title: string;
  url: string | null;
  link_type: "custom" | "page" | "category" | "product";
  page_id: string | null;
  category_id: string | null;
  product_id: string | null;
  icon_path: string | null;
  open_in_new_tab: boolean;
  mega_config: Record<string, unknown> | null;
  sort_order: number;
  is_visible: boolean;
  children?: MenuItem[];
};

export type HomepageSection = {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  description?: string | null;
  image_path?: string | null;
  button_label?: string | null;
  button_url?: string | null;
  config: Record<string, unknown>;
  is_visible: boolean;
  sort_order: number;
};

export type HomepageBenefit = {
  id: string;
  block_group: string;
  title: string;
  description: string | null;
  icon_path: string | null;
  link_url: string | null;
  button_label?: string | null;
  sort_order: number;
  is_visible: boolean;
};

export type HomepageStep = {
  id: string;
  step_number: number;
  title: string;
  description: string;
  link_url: string | null;
  link_label: string | null;
  image_path?: string | null;
  sort_order: number;
  is_visible: boolean;
};

export type HomepagePromoBanner = {
  id: string;
  row_index: number;
  title: string;
  button_label: string;
  link_url: string;
  image_path: string;
  sort_order: number;
  is_visible: boolean;
};

export type Review = {
  id: string;
  source: "yandex" | "manual";
  author_name: string;
  body: string;
  rating: number | null;
  review_date: string | null;
  external_url: string | null;
  avatar_path: string | null;
  is_published: boolean;
  sort_order: number;
};

export type ProductPriceTier = {
  id: string;
  product_id: string;
  min_pairs: number;
  max_pairs: number | null;
  price_per_pair: number;
  sort_order: number;
};

export type ProductDocument = {
  id: string;
  product_id: string;
  doc_type: string;
  title: string;
  storage_path: string;
  sort_order: number;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  sku: string | null;
  image: string | null;
  packPrice: number;
  pairsPerPack: number;
  quantity: number;
};

export type Attribute = {
  id: string;
  slug: string;
  name: string;
  type: "select" | "color" | "text" | "number";
  is_filterable: boolean;
  sort_order: number;
};

export type AttributeValue = {
  id: string;
  attribute_id: string;
  slug: string;
  name: string;
  color_hex: string | null;
  sort_order: number;
};

export type FilterAttribute = Attribute & {
  values: (AttributeValue & { count: number })[];
};

export type ProductAttributeRow = {
  attribute_name: string;
  attribute_slug: string;
  value_name: string;
  value_slug: string;
  color_hex: string | null;
};

export type CatalogOrderBy =
  | "menu_order"
  | "popularity"
  | "price"
  | "price-desc"
  | "date";

export type CatalogQuery = {
  page: number;
  perPage: number;
  orderBy: CatalogOrderBy;
  minPrice?: number;
  maxPrice?: number;
  stock?: StockStatus[];
  /** attribute slug → selected value slugs */
  filters: Record<string, string[]>;
};
