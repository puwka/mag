/**
 * Set site favicon to /icons/glove-hand.svg
 * Usage: npx tsx scripts/patch-favicon.ts
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
  console.error("Missing env");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { error } = await sb
    .from("site_settings")
    .upsert(
      {
        key: "brand.favicon",
        value: "/icons/glove-hand.svg",
        label: "Favicon",
        group_name: "brand",
        is_public: true,
      },
      { onConflict: "key" }
    );
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log("OK: brand.favicon → /icons/glove-hand.svg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
