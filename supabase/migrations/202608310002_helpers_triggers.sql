-- =============================================================================
-- 202608310002_helpers_triggers.sql
-- Generic updated_at trigger only (no dependency on profiles)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
