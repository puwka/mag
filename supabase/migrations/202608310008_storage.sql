-- =============================================================================
-- 202608310008_storage.sql
-- Storage buckets + RLS policies
-- Buckets: products, categories, pages, reviews, site, media, form-uploads
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Buckets
-- public = true  → CDN-readable objects (after SELECT policy allows)
-- public = false → form-uploads (private leads attachments)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'products',
    'products',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  ),
  (
    'categories',
    'categories',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  ),
  (
    'pages',
    'pages',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
  ),
  (
    'reviews',
    'reviews',
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'site',
    'site',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4']
  ),
  (
    'media',
    'media',
    true,
    20971520,
    ARRAY[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'application/pdf', 'video/mp4'
    ]
  ),
  (
    'form-uploads',
    'form-uploads',
    false,
    20971520,
    ARRAY[
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf',
      'image/vnd.adobe.photoshop',
      'application/octet-stream'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Helper: staff check reusable in storage policies
-- (uses public.is_staff from 002)
-- -----------------------------------------------------------------------------

-- Public buckets: anyone can read
CREATE POLICY storage_public_buckets_select
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('products', 'categories', 'pages', 'reviews', 'site', 'media'));

-- Public buckets: only staff write
CREATE POLICY storage_public_buckets_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('products', 'categories', 'pages', 'reviews', 'site', 'media')
    AND public.is_staff()
  );

CREATE POLICY storage_public_buckets_update
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('products', 'categories', 'pages', 'reviews', 'site', 'media')
    AND public.is_staff()
  )
  WITH CHECK (
    bucket_id IN ('products', 'categories', 'pages', 'reviews', 'site', 'media')
    AND public.is_staff()
  );

CREATE POLICY storage_public_buckets_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('products', 'categories', 'pages', 'reviews', 'site', 'media')
    AND public.is_staff()
  );

-- form-uploads: private — staff read/delete; anon may INSERT only under leads/
CREATE POLICY storage_form_uploads_staff_select
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'form-uploads' AND public.is_staff());

CREATE POLICY storage_form_uploads_anon_insert
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'form-uploads'
    AND (storage.foldername(name))[1] = 'leads'
  );

CREATE POLICY storage_form_uploads_staff_update
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'form-uploads' AND public.is_staff())
  WITH CHECK (bucket_id = 'form-uploads' AND public.is_staff());

CREATE POLICY storage_form_uploads_staff_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'form-uploads' AND public.is_staff());
