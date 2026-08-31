import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const sb = await createClient();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const [{ data: pages }, { data: categories }, { data: products }] =
    await Promise.all([
      sb.from("pages").select("slug, updated_at").eq("status", "published"),
      sb
        .from("categories")
        .select("path, updated_at")
        .eq("status", "published"),
      sb.from("products").select("slug, updated_at").eq("status", "published"),
    ]);

  for (const p of pages ?? []) {
    entries.push({
      url: `${base}/${p.slug}/`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const c of categories ?? []) {
    entries.push({
      url: `${base}/${c.path}/`,
      lastModified: c.updated_at ? new Date(c.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const p of products ?? []) {
    entries.push({
      url: `${base}/product/${p.slug}/`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
