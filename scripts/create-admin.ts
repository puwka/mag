/**
 * Create or reset CMS admin user and verify password login.
 * Usage: npm run create-admin
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  readFileSync(p, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eq = trimmed.indexOf("=");
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    });
}

loadEnv();

const email = process.env.ADMIN_EMAIL || "admin@vitex37.local";
const password = process.env.ADMIN_PASSWORD || "VitexAdmin2026!";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !service || !anon) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
  let user = listed?.users?.find((u) => u.email === email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Администратор" },
    });
    if (error || !data.user) {
      console.error("createUser:", error?.message);
      process.exit(1);
    }
    user = data.user;
    console.log("Created auth user", user.id);
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (error) {
      console.error("updateUser:", error.message);
      process.exit(1);
    }
    console.log("Password reset for", user.id);
  }

  await admin.from("profiles").delete().eq("id", user.id);
  const { error: pe } = await admin.from("profiles").insert({
    id: user.id,
    email,
    full_name: "Администратор",
    role: "admin",
    is_active: true,
  });
  if (pe) {
    console.error("profile insert:", pe.message);
    process.exit(1);
  }

  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: loginErr } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (loginErr) {
    console.error("Login verification FAILED:", loginErr.message);
    process.exit(1);
  }

  console.log("Login verification OK");
  console.log("  URL:      /admin/login/");
  console.log("  email:   ", email);
  console.log("  password:", password);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
