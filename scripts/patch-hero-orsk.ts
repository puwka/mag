/**
 * Fix hero title: «Перчатки оптом в Орск» → «… в Орске»
 * Usage: npx tsx scripts/patch-hero-orsk.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
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
        if (!process.env[key]) process.env[key] = val;
      });
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: rows, error } = await sb
    .from("homepage_sections")
    .select("id, title, subtitle, section_key")
    .or("section_key.eq.hero,title.ilike.%перчатки оптом%");

  if (error) {
    console.error(error);
    process.exit(1);
  }

  for (const row of rows ?? []) {
    const title = String(row.title || "");
    const fixed = title
      .replace(/в\s+Орск(?!е)/gi, "в Орске")
      .replace(/в\s+орск(?!е)/gi, "в Орске");
    if (fixed === title) {
      console.log("skip", row.id, title);
      continue;
    }
    const { error: upErr } = await sb
      .from("homepage_sections")
      .update({ title: fixed })
      .eq("id", row.id);
    if (upErr) {
      console.error(upErr);
      process.exit(1);
    }
    console.log("updated", row.id, title, "→", fixed);
  }

  // Ensure subtitle is visible wording
  const { data: hero } = await sb
    .from("homepage_sections")
    .select("id, subtitle")
    .eq("section_key", "hero")
    .maybeSingle();

  if (hero && (!hero.subtitle || !String(hero.subtitle).trim())) {
    await sb
      .from("homepage_sections")
      .update({ subtitle: "фабрика ХБтекс" })
      .eq("id", hero.id);
    console.log("set subtitle for hero");
  }

  console.log("done");
}

main();
