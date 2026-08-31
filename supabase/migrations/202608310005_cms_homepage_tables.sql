-- =============================================================================
-- 202608310005_cms_homepage_tables.sql
-- menu_items, homepage_*, reviews
-- =============================================================================

-- -----------------------------------------------------------------------------
-- menu_items
-- -----------------------------------------------------------------------------
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key text NOT NULL,
  parent_id uuid REFERENCES public.menu_items (id) ON DELETE CASCADE,
  title text NOT NULL,
  url text,
  link_type public.menu_link_type NOT NULL DEFAULT 'custom',
  page_id uuid REFERENCES public.pages (id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories (id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  icon_path text,
  open_in_new_tab boolean NOT NULL DEFAULT false,
  mega_config jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX menu_items_key_sort_idx ON public.menu_items (menu_key, sort_order);
CREATE INDEX menu_items_parent_idx ON public.menu_items (parent_id);

CREATE TRIGGER menu_items_set_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- homepage_sections
-- -----------------------------------------------------------------------------
CREATE TABLE public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL,
  title text,
  subtitle text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT homepage_sections_key_unique UNIQUE (section_key)
);

CREATE INDEX homepage_sections_visible_sort_idx
  ON public.homepage_sections (is_visible, sort_order);

CREATE TRIGGER homepage_sections_set_updated_at
  BEFORE UPDATE ON public.homepage_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- homepage_benefits
-- -----------------------------------------------------------------------------
CREATE TABLE public.homepage_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_group text NOT NULL DEFAULT 'info_boxes',
  title text NOT NULL,
  description text,
  icon_path text,
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX homepage_benefits_group_sort_idx
  ON public.homepage_benefits (block_group, sort_order);

CREATE TRIGGER homepage_benefits_set_updated_at
  BEFORE UPDATE ON public.homepage_benefits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- homepage_steps
-- -----------------------------------------------------------------------------
CREATE TABLE public.homepage_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  link_url text,
  link_label text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT homepage_steps_number_unique UNIQUE (step_number),
  CONSTRAINT homepage_steps_number_positive CHECK (step_number > 0)
);

CREATE INDEX homepage_steps_visible_sort_idx
  ON public.homepage_steps (is_visible, sort_order);

CREATE TRIGGER homepage_steps_set_updated_at
  BEFORE UPDATE ON public.homepage_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- homepage_promo_banners
-- -----------------------------------------------------------------------------
CREATE TABLE public.homepage_promo_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_index integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  button_label text NOT NULL,
  link_url text NOT NULL,
  image_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT homepage_promo_row_check CHECK (row_index IN (1, 2))
);

CREATE INDEX homepage_promo_row_sort_idx
  ON public.homepage_promo_banners (row_index, sort_order);

CREATE TRIGGER homepage_promo_banners_set_updated_at
  BEFORE UPDATE ON public.homepage_promo_banners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source public.review_source NOT NULL DEFAULT 'manual',
  author_name text NOT NULL,
  body text NOT NULL,
  rating smallint,
  review_date date,
  external_url text,
  avatar_path text,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_rating_range CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5))
);

CREATE INDEX reviews_published_sort_idx
  ON public.reviews (is_published, sort_order);

CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
