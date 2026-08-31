-- =============================================================================
-- 202608310004_catalog_tables.sql
-- categories, products, images, attributes, prices, documents, relations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories (id) ON DELETE SET NULL,
  slug text NOT NULL,
  path text NOT NULL,
  name text NOT NULL,
  description text,
  image_path text,
  seo_title text,
  seo_description text,
  status public.content_status NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_path_unique UNIQUE (path),
  CONSTRAINT categories_parent_slug_unique UNIQUE (parent_id, slug)
);

CREATE INDEX categories_parent_idx ON public.categories (parent_id);
CREATE INDEX categories_status_sort_idx ON public.categories (status, sort_order);

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  sku text,
  name text NOT NULL,
  short_description text,
  description text,
  status public.content_status NOT NULL DEFAULT 'draft',
  stock_status public.stock_status NOT NULL DEFAULT 'in_stock',
  stock_label text,
  pack_price numeric(12, 2),
  pairs_per_pack integer,
  price_per_pair numeric(12, 2),
  currency text NOT NULL DEFAULT 'RUB',
  price_on_request boolean NOT NULL DEFAULT false,
  weight_grams numeric(10, 2),
  is_featured boolean NOT NULL DEFAULT false,
  menu_order integer NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_slug_unique UNIQUE (slug),
  CONSTRAINT products_sku_unique UNIQUE (sku),
  CONSTRAINT products_pairs_positive CHECK (pairs_per_pack IS NULL OR pairs_per_pack > 0),
  CONSTRAINT products_pack_price_nonneg CHECK (pack_price IS NULL OR pack_price >= 0),
  CONSTRAINT products_pair_price_nonneg CHECK (price_per_pair IS NULL OR price_per_pair >= 0)
);

CREATE INDEX products_status_menu_idx ON public.products (status, menu_order);
CREATE INDEX products_stock_status_idx ON public.products (stock_status);
CREATE INDEX products_featured_idx ON public.products (is_featured) WHERE is_featured = true;
CREATE INDEX products_name_trgm_ready_idx ON public.products (name);

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- product_images
-- -----------------------------------------------------------------------------
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  alt text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_images_product_sort_idx
  ON public.product_images (product_id, sort_order);

CREATE UNIQUE INDEX product_images_one_primary_idx
  ON public.product_images (product_id)
  WHERE is_primary = true;

CREATE TRIGGER product_images_set_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- product_categories (M:N)
-- -----------------------------------------------------------------------------
CREATE TABLE public.product_categories (
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX product_categories_category_idx
  ON public.product_categories (category_id, product_id);

-- -----------------------------------------------------------------------------
-- attributes + values + assignments
-- -----------------------------------------------------------------------------
CREATE TABLE public.attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  type public.attribute_type NOT NULL DEFAULT 'select',
  is_filterable boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attributes_slug_unique UNIQUE (slug)
);

CREATE TRIGGER attributes_set_updated_at
  BEFORE UPDATE ON public.attributes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL REFERENCES public.attributes (id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  color_hex text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attribute_values_attr_slug_unique UNIQUE (attribute_id, slug)
);

CREATE INDEX attribute_values_attribute_idx ON public.attribute_values (attribute_id, sort_order);

CREATE TRIGGER attribute_values_set_updated_at
  BEFORE UPDATE ON public.attribute_values
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_attribute_values (
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  attribute_value_id uuid NOT NULL REFERENCES public.attribute_values (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, attribute_value_id)
);

CREATE INDEX product_attribute_values_value_idx
  ON public.product_attribute_values (attribute_value_id, product_id);

-- -----------------------------------------------------------------------------
-- product_price_tiers
-- -----------------------------------------------------------------------------
CREATE TABLE public.product_price_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  min_pairs integer NOT NULL,
  max_pairs integer,
  price_per_pair numeric(12, 2) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_price_tiers_min_positive CHECK (min_pairs > 0),
  CONSTRAINT product_price_tiers_max_gte_min CHECK (max_pairs IS NULL OR max_pairs >= min_pairs),
  CONSTRAINT product_price_tiers_price_nonneg CHECK (price_per_pair >= 0)
);

CREATE INDEX product_price_tiers_product_idx
  ON public.product_price_tiers (product_id, sort_order);

CREATE TRIGGER product_price_tiers_set_updated_at
  BEFORE UPDATE ON public.product_price_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- product_documents
-- -----------------------------------------------------------------------------
CREATE TABLE public.product_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  doc_type text NOT NULL DEFAULT 'declaration',
  title text NOT NULL,
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_documents_product_idx
  ON public.product_documents (product_id, sort_order);

CREATE TRIGGER product_documents_set_updated_at
  BEFORE UPDATE ON public.product_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- product_relations
-- -----------------------------------------------------------------------------
CREATE TABLE public.product_relations (
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'similar',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, related_product_id, relation_type),
  CONSTRAINT product_relations_no_self CHECK (product_id <> related_product_id)
);

CREATE INDEX product_relations_related_idx
  ON public.product_relations (related_product_id);
