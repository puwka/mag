-- =============================================================================
-- 202608310006_orders_forms.sql
-- orders, order_items, order_status_history, form_submissions
-- =============================================================================

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'new',
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  company_name text,
  billing_address jsonb,
  shipping_address jsonb,
  shipping_method text,
  payment_method text,
  customer_note text,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'RUB',
  weight_total numeric(12, 2),
  city_slug text,
  source_utm jsonb,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_order_number_unique UNIQUE (order_number),
  CONSTRAINT orders_subtotal_nonneg CHECK (subtotal >= 0),
  CONSTRAINT orders_total_nonneg CHECK (total >= 0)
);

CREATE INDEX orders_status_created_idx ON public.orders (status, created_at DESC);
CREATE INDEX orders_user_id_idx ON public.orders (user_id);
CREATE INDEX orders_customer_phone_idx ON public.orders (customer_phone);
CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Order number generator (VT-YYYYMMDD-XXXX)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  seq_part text;
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    seq_part := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    NEW.order_number := 'VT-' || to_char(now() AT TIME ZONE 'Europe/Moscow', 'YYYYMMDD') || '-' || seq_part;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_generate_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- -----------------------------------------------------------------------------
-- order_items
-- -----------------------------------------------------------------------------
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text,
  quantity_packs integer NOT NULL,
  pairs_per_pack integer,
  unit_price numeric(12, 2) NOT NULL,
  line_total numeric(12, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_items_qty_positive CHECK (quantity_packs > 0),
  CONSTRAINT order_items_unit_nonneg CHECK (unit_price >= 0),
  CONSTRAINT order_items_line_nonneg CHECK (line_total >= 0)
);

CREATE INDEX order_items_order_idx ON public.order_items (order_id);
CREATE INDEX order_items_product_idx ON public.order_items (product_id);

CREATE TRIGGER order_items_set_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- order_status_history
-- -----------------------------------------------------------------------------
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  comment text,
  changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX order_status_history_order_idx
  ON public.order_status_history (order_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_log_status
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- -----------------------------------------------------------------------------
-- form_submissions
-- -----------------------------------------------------------------------------
CREATE TABLE public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type public.form_type NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  product_url text,
  attachment_paths text[] NOT NULL DEFAULT '{}',
  status public.submission_status NOT NULL DEFAULT 'new',
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX form_submissions_type_status_idx
  ON public.form_submissions (form_type, status, created_at DESC);

CREATE INDEX form_submissions_product_idx
  ON public.form_submissions (product_id);

CREATE TRIGGER form_submissions_set_updated_at
  BEFORE UPDATE ON public.form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
