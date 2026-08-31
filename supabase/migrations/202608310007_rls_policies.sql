-- =============================================================================
-- 202608310007_rls_policies.sql
-- Row Level Security: public read + staff CRUD + safe inserts
-- =============================================================================

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- profiles
-- =============================================================================
CREATE POLICY profiles_select_own_or_staff
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_staff());

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY profiles_admin_all
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- site_settings
-- =============================================================================
CREATE POLICY site_settings_public_read
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (is_public = true OR public.is_staff());

CREATE POLICY site_settings_admin_write
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- media
-- =============================================================================
CREATE POLICY media_public_read
  ON public.media FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY media_staff_write
  ON public.media FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- cities
-- =============================================================================
CREATE POLICY cities_public_read
  ON public.cities FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_staff());

CREATE POLICY cities_staff_write
  ON public.cities FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- pages
-- =============================================================================
CREATE POLICY pages_public_read
  ON public.pages FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR public.is_staff());

CREATE POLICY pages_staff_write
  ON public.pages FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- redirects
-- =============================================================================
CREATE POLICY redirects_public_read
  ON public.redirects FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_staff());

CREATE POLICY redirects_staff_write
  ON public.redirects FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- categories
-- =============================================================================
CREATE POLICY categories_public_read
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR public.is_staff());

CREATE POLICY categories_staff_write
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- products + related catalog tables
-- =============================================================================
CREATE POLICY products_public_read
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR public.is_staff());

CREATE POLICY products_staff_write
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- product_images: readable if parent product published (or staff)
CREATE POLICY product_images_public_read
  ON public.product_images FOR SELECT
  TO anon, authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.status = 'published'
    )
  );

CREATE POLICY product_images_staff_write
  ON public.product_images FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY product_categories_public_read
  ON public.product_categories FOR SELECT
  TO anon, authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.status = 'published'
    )
  );

CREATE POLICY product_categories_staff_write
  ON public.product_categories FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY attributes_public_read
  ON public.attributes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY attributes_staff_write
  ON public.attributes FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY attribute_values_public_read
  ON public.attribute_values FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY attribute_values_staff_write
  ON public.attribute_values FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY product_attribute_values_public_read
  ON public.product_attribute_values FOR SELECT
  TO anon, authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.status = 'published'
    )
  );

CREATE POLICY product_attribute_values_staff_write
  ON public.product_attribute_values FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY product_price_tiers_public_read
  ON public.product_price_tiers FOR SELECT
  TO anon, authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.status = 'published'
    )
  );

CREATE POLICY product_price_tiers_staff_write
  ON public.product_price_tiers FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY product_documents_public_read
  ON public.product_documents FOR SELECT
  TO anon, authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.status = 'published'
    )
  );

CREATE POLICY product_documents_staff_write
  ON public.product_documents FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY product_relations_public_read
  ON public.product_relations FOR SELECT
  TO anon, authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.status = 'published'
    )
  );

CREATE POLICY product_relations_staff_write
  ON public.product_relations FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- menu + homepage + reviews
-- =============================================================================
CREATE POLICY menu_items_public_read
  ON public.menu_items FOR SELECT
  TO anon, authenticated
  USING (is_visible = true OR public.is_staff());

CREATE POLICY menu_items_staff_write
  ON public.menu_items FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY homepage_sections_public_read
  ON public.homepage_sections FOR SELECT
  TO anon, authenticated
  USING (is_visible = true OR public.is_staff());

CREATE POLICY homepage_sections_staff_write
  ON public.homepage_sections FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY homepage_benefits_public_read
  ON public.homepage_benefits FOR SELECT
  TO anon, authenticated
  USING (is_visible = true OR public.is_staff());

CREATE POLICY homepage_benefits_staff_write
  ON public.homepage_benefits FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY homepage_steps_public_read
  ON public.homepage_steps FOR SELECT
  TO anon, authenticated
  USING (is_visible = true OR public.is_staff());

CREATE POLICY homepage_steps_staff_write
  ON public.homepage_steps FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY homepage_promo_banners_public_read
  ON public.homepage_promo_banners FOR SELECT
  TO anon, authenticated
  USING (is_visible = true OR public.is_staff());

CREATE POLICY homepage_promo_banners_staff_write
  ON public.homepage_promo_banners FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY reviews_public_read
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR public.is_staff());

CREATE POLICY reviews_staff_write
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- orders — safe public create, private read
-- =============================================================================
CREATE POLICY orders_insert_anyone
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Guests: user_id must be null; logged-in: may set own id
    (user_id IS NULL AND auth.uid() IS NULL)
    OR (user_id IS NULL AND auth.uid() IS NOT NULL)
    OR (user_id = auth.uid())
  );

CREATE POLICY orders_select_own_or_staff
  ON public.orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

-- Staff may also select guest orders (user_id null) via is_staff above.
-- Anon cannot SELECT orders at all (no policy for anon SELECT).

CREATE POLICY orders_staff_update
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY orders_staff_delete
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- order_items
CREATE POLICY order_items_insert_anyone
  ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (
          o.user_id IS NULL
          OR o.user_id = auth.uid()
          OR public.is_staff()
        )
    )
  );

CREATE POLICY order_items_select_own_or_staff
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY order_items_staff_update
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY order_items_staff_delete
  ON public.order_items FOR DELETE
  TO authenticated
  USING (public.is_staff());

-- order_status_history: staff read; inserts via trigger (SECURITY DEFINER)
CREATE POLICY order_status_history_staff_select
  ON public.order_status_history FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY order_status_history_staff_insert
  ON public.order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

-- =============================================================================
-- form_submissions — safe public INSERT only
-- =============================================================================
CREATE POLICY form_submissions_insert_anyone
  ON public.form_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND jsonb_typeof(payload) = 'object'
  );

CREATE POLICY form_submissions_staff_select
  ON public.form_submissions FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY form_submissions_staff_update
  ON public.form_submissions FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY form_submissions_admin_delete
  ON public.form_submissions FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- Grants (table-level): anon/authenticated can use tables; RLS still applies
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Anon needs INSERT on orders, order_items, form_submissions
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;
GRANT INSERT ON public.form_submissions TO anon;

-- Sequences / defaults
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
