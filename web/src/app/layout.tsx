import type { Metadata } from "next";
import { Nunito_Sans, Roboto_Condensed, Russo_One, Roboto } from "next/font/google";
import "./globals.css";
import "./site.css";
import "./admin.css";
import { getSettings, settingString } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";
import { mediaUrl } from "@/lib/media";

const nunito = Nunito_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const robotoCond = Roboto_Condensed({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600"],
  variable: "--font-roboto-cond",
  display: "swap",
});

const russo = Russo_One({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  variable: "--font-russo",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteUrl = getSiteUrl(settings);
  const title = settingString(
    settings,
    "seo.home_title",
    "Производитель рабочих перчаток, купить перчатки оптом"
  );
  const description = settingString(settings, "seo.home_description");
  const brand = settingString(settings, "brand.name", "Витекс");
  const ogImage =
    mediaUrl(settingString(settings, "brand.logo"), "site") ||
    settingString(settings, "brand.logo");
  const favicon =
    mediaUrl(settingString(settings, "brand.favicon"), "site") ||
    settingString(settings, "brand.favicon") ||
    "/favicon.ico";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${brand}`,
    },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: siteUrl,
      siteName: brand,
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    icons: { icon: favicon },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body
        className={`${nunito.variable} ${robotoCond.variable} ${russo.variable} ${roboto.variable}`}
        style={
          {
            ["--font-body" as string]: "var(--font-nunito), sans-serif",
            ["--font-condensed" as string]: "var(--font-roboto-cond), sans-serif",
            ["--font-display" as string]: "var(--font-russo), sans-serif",
            ["--font-ui" as string]: "var(--font-roboto), sans-serif",
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
