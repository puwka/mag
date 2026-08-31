import { settingString } from "@/lib/data";

export function getSiteUrl(settings?: Record<string, unknown>): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (settings) {
    const fromSettings = settingString(settings, "seo.site_url");
    if (fromSettings) return fromSettings.replace(/\/$/, "");
  }
  return "https://vitex37.ru";
}

export function absoluteUrl(
  path: string,
  settings?: Record<string, unknown>
): string {
  const base = getSiteUrl(settings);
  if (!path || path === "/") return `${base}/`;
  return path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
