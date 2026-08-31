-- =============================================================================
-- 202608310011_admin_bootstrap.sql
-- Allow service_role to set staff roles; document admin CMS access
-- =============================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role (scripts / bootstrap) may change privileges
  IF coalesce(auth.jwt() ->> 'role', '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Changing role is not allowed';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Changing is_active is not allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Managers may also update public site settings (CMS)
DROP POLICY IF EXISTS site_settings_admin_write ON public.site_settings;
CREATE POLICY site_settings_staff_write
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

COMMENT ON POLICY site_settings_staff_write ON public.site_settings IS
  'Staff (admin|manager) may manage CMS settings from /admin.';
