-- =============================================================================
-- 202608310012_homepage_cms_fields.sql
-- Standard block fields + dynamic order steps
-- =============================================================================

ALTER TABLE public.homepage_sections
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image_path text,
  ADD COLUMN IF NOT EXISTS button_label text,
  ADD COLUMN IF NOT EXISTS button_url text;

COMMENT ON COLUMN public.homepage_sections.description IS 'CMS block description / body text';
COMMENT ON COLUMN public.homepage_sections.image_path IS 'CMS block image';
COMMENT ON COLUMN public.homepage_sections.button_label IS 'CMS block CTA label';
COMMENT ON COLUMN public.homepage_sections.button_url IS 'CMS block CTA URL';

-- Allow free add/remove of order steps (number is display only)
ALTER TABLE public.homepage_steps
  DROP CONSTRAINT IF EXISTS homepage_steps_number_unique;

-- Optional image on steps
ALTER TABLE public.homepage_steps
  ADD COLUMN IF NOT EXISTS image_path text;

-- Benefits: explicit CTA label
ALTER TABLE public.homepage_benefits
  ADD COLUMN IF NOT EXISTS button_label text;
