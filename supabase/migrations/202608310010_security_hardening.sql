-- =============================================================================
-- 202608310010_security_hardening.sql
-- Prevent role self-escalation; document order/form insert pattern
-- =============================================================================

-- Block non-admins from changing role / is_active on profiles
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

CREATE TRIGGER profiles_protect_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- Simplify own-profile update policy (role lock is in trigger)
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- -----------------------------------------------------------------------------
-- Guest checkout confirmation:
-- Anon has INSERT but no SELECT on orders (no data leak of other orders).
-- INSERT ... RETURNING from the browser will fail for anon.
-- Public checkout MUST use a Next.js Server Action / Route Handler that either:
--   1) inserts with anon and returns crafted DTO without RETURNING, or
--   2) uses SUPABASE_SERVICE_ROLE_KEY only on the server to insert + return.
-- Prefer (1) with separate inserts, or (2) with strict input validation.
-- -----------------------------------------------------------------------------

COMMENT ON TABLE public.orders IS
  'Checkout inserts allowed for anon; SELECT only own (auth) or staff. Use Server Action for guest confirmation.';

COMMENT ON TABLE public.form_submissions IS
  'Public INSERT only (status=new). No public SELECT. Process in admin with staff role.';

COMMENT ON FUNCTION public.is_admin() IS
  'SECURITY DEFINER helper for RLS. Never expose service_role to the browser.';

COMMENT ON FUNCTION public.is_staff() IS
  'SECURITY DEFINER helper for RLS (admin|manager).';
