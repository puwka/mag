import { createClient } from "@supabase/supabase-js";
import { cache } from "react";

/**
 * Read-only Supabase client for storefront/CMS public data.
 * No cookie session / token refresh — avoids Auth API rate limits on SSR.
 */
export const getPublicSupabase = cache(() =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
);
