import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductView } from "@/components/ProductView";
import { JsonLd } from "@/components/JsonLd";
import {
  getCategoryBreadcrumbs,
  getProductBySlug,
  getProductExtras,
  getSettings,
  settingString,
} from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { absoluteUrl, getSiteUrl } from "@/lib/site";
import { getProductSiteContext } from "@/lib/product-site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const settings = await getSettings();
  const siteUrl = getSiteUrl(settings);
  const title = product.seo_title || product.name;
  const description =
    product.seo_description || product.short_description || undefined;
  const image = mediaUrl(product.primary_image, "products");
  const canonical = `/product/${product.slug}/`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: absoluteUrl(canonical, settings),
      title,
      description,
      siteName: settingString(settings, "brand.name"),
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    metadataBase: new URL(siteUrl),
  };
}

export default async function ProductSlugPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const crumbs = product.category_path
    ? await getCategoryBreadcrumbs(product.category_path)
    : [];
  const extras = await getProductExtras(product.id);
  const site = await getProductSiteContext();
  const settings = await getSettings();
  const image = mediaUrl(product.primary_image, "products");
  const path = product.category_path
    ? `/${product.category_path}/${product.slug}/`
    : `/product/${product.slug}/`;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku || undefined,
    description: product.short_description || product.seo_description || undefined,
    image: image || undefined,
    brand: {
      "@type": "Brand",
      name: site.brand,
    },
    offers: product.price_on_request
      ? undefined
      : {
          "@type": "Offer",
          priceCurrency: product.currency || "RUB",
          price: product.pack_price != null ? String(product.pack_price) : undefined,
          availability:
            product.stock_status === "out_of_stock"
              ? "https://schema.org/OutOfStock"
              : product.stock_status === "on_order"
                ? "https://schema.org/PreOrder"
                : "https://schema.org/InStock",
          url: absoluteUrl(path, settings),
        },
  };

  return (
    <>
      <JsonLd data={productLd} />
      <Breadcrumbs items={[...crumbs, { name: product.name }]} />
      <ProductView
        product={product}
        tiers={extras.tiers}
        documents={extras.documents}
        related={extras.related}
        attributes={extras.attributes}
        site={site}
      />
    </>
  );
}
