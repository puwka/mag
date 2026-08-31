import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import { redirect } from "next/navigation";

export type StaffProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
};

export async function getStaffProfile(): Promise<StaffProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!data || !data.is_active) return null;
  if (data.role !== "admin" && data.role !== "manager") return null;
  return data as StaffProfile;
}

export async function requireStaff(): Promise<StaffProfile> {
  const profile = await getStaffProfile();
  if (!profile) redirect("/admin/login/");
  return profile;
}

export function createMiddlewareClient(
  request: import("next/server").NextRequest,
  response: import("next/server").NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
}
