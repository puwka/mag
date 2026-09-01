import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductView } from "@/components/ProductView";
import { ContactForm } from "@/components/ContactForm";
import { ProductGrid } from "@/components/ProductGrid";
import { CatalogFilters } from "@/components/CatalogFilters";
import { CatalogToolbar } from "@/components/CatalogToolbar";
import { CatalogPagination } from "@/components/CatalogPagination";
import { parseCatalogSearchParams } from "@/lib/catalog-query";
import {
  getCategoryBreadcrumbs,
  getCategoryByPath,
  getCategoryChildren,
  getFilterableAttributes,
  getPageBySlug,
  getProductBySlug,
  getProductExtras,
  getProductsByCategoryPath,
  getSettings,
  settingString,
} from "@/lib/data";
import type { Page } from "@/lib/types";
import Link from "next/link";
import { getProductSiteContext } from "@/lib/product-site";

type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path } = await params;
  if (!path?.length) return {};
  const joined = path.join("/");
  const settings = await getSettings();
  const page = await getPageBySlug(joined);
  if (page) {
    const canonical = `/${page.slug}/`;
    return {
      title: page.seo_title || page.title,
      description: page.seo_description || undefined,
      alternates: { canonical },
      openGraph: {
        title: page.seo_title || page.title,
        description: page.seo_description || undefined,
        url: canonical,
        siteName: settingString(settings, "brand.name"),
      },
    };
  }
  const cat = await getCategoryByPath(joined);
  if (cat) {
    const canonical = `/${cat.path}/`;
    return {
      title: cat.seo_title || cat.name,
      description: cat.seo_description || undefined,
      alternates: { canonical },
      openGraph: {
        title: cat.seo_title || cat.name,
        description: cat.seo_description || undefined,
        url: canonical,
      },
    };
  }
  const slug = path[path.length - 1];
  const product = await getProductBySlug(slug);
  if (product) {
    const canonical = product.category_path
      ? `/${product.category_path}/${product.slug}/`
      : `/product/${product.slug}/`;
    return {
      title: product.seo_title || product.name,
      description: product.seo_description || undefined,
      alternates: { canonical },
      openGraph: {
        title: product.seo_title || product.name,
        description: product.seo_description || undefined,
        url: canonical,
      },
    };
  }
  return {};
}

export default async function CatchAllPage({ params, searchParams }: Props) {
  const { path } = await params;
  if (!path?.length) redirect("/");

  const joined = path.join("/");
  const sp = await searchParams;

  const page = await getPageBySlug(joined);
  if (page) {
    return <InfoPage page={page} />;
  }

  const category = await getCategoryByPath(joined);
  if (category) {
    return <CategoryPage path={joined} searchParams={sp} />;
  }

  const slug = path[path.length - 1];
  const product = await getProductBySlug(slug);
  if (product) {
    const crumbsPath = product.category_path || path.slice(0, -1).join("/");
    const crumbs = crumbsPath ? await getCategoryBreadcrumbs(crumbsPath) : [];
    const extras = await getProductExtras(product.id);
    const site = await getProductSiteContext();
    return (
      <>
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

  notFound();
}

async function CategoryPage({
  path,
  searchParams,
}: {
  path: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const category = await getCategoryByPath(path);
  if (!category) notFound();
  const query = parseCatalogSearchParams(searchParams);
  const [children, crumbs, list, attributes] = await Promise.all([
    getCategoryChildren(category.id),
    getCategoryBreadcrumbs(path),
    getProductsByCategoryPath(path, query),
    getFilterableAttributes(path),
  ]);
  const { products, total } = list;

  return (
    <div className="page-content">
      <Breadcrumbs
        items={crumbs.map((c, i) => ({
          ...c,
          href: i < crumbs.length - 1 ? c.href : undefined,
        }))}
      />
      <div className="container">
        <h1 className="page-title">{category.name}</h1>
        {category.description ? (
          <div className="catalog-intro prose">
            <p>{category.description}</p>
          </div>
        ) : null}
        {children.length ? (
          <div className="subcats">
            {children.map((c) => (
              <Link key={c.id} href={`/${c.path}`}>
                {c.name}
              </Link>
            ))}
          </div>
        ) : null}
        <CatalogToolbar query={query} total={total} />
        <div className="catalog-layout">
          <div className="catalog-main">
            <ProductGrid products={products} embedded />
            <CatalogPagination path={path} query={query} total={total} />
          </div>
          <CatalogFilters path={path} query={query} attributes={attributes} />
        </div>
      </div>
    </div>
  );
}

async function InfoPage({ page }: { page: Page }) {
  const settings = await getSettings();
  const orgId = settingString(settings, "maps.yandex_org_id");

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ name: page.title }]} />
      <div className="container">
        <h1 className="page-title">{page.title}</h1>
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: page.content_html || "" }}
        />

        {page.template === "contact" ? (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginTop: 30 }}
            className="contact-grid"
          >
            <div>
              <h2 style={{ fontFamily: "var(--font-condensed)" }}>
                {settingString(settings, "ui.contact_form_title", "Связаться с нами")}
              </h2>
              <ContactForm formType="contact" />
            </div>
            <div>
              <p>
                Email:{" "}
                <a href={`mailto:${settingString(settings, "contacts.email")}`}>
                  {settingString(settings, "contacts.email")}
                </a>
              </p>
              <p>Адрес: {settingString(settings, "company.address")}</p>
              <p>Режим: {settingString(settings, "contacts.hours")}</p>
            </div>
          </div>
        ) : null}

        {page.template === "price_list" ? (
          <div style={{ maxWidth: 480, marginTop: 24 }}>
            <ContactForm formType="price_list" />
          </div>
        ) : null}

        {page.template === "partnership" ? (
          <div style={{ maxWidth: 520, marginTop: 24 }}>
            <ContactForm formType="partnership" />
          </div>
        ) : null}

        {page.template === "logo" ? (
          <div style={{ maxWidth: 520, marginTop: 24 }}>
            <h2 style={{ fontFamily: "var(--font-condensed)" }}>
              {settingString(settings, "ui.logo_form_title", "Разместить заявку")}
            </h2>
            <ContactForm formType="logo_application" submitLabel="Отправить заявку" />
          </div>
        ) : null}

        {page.template === "about" ? (
          <div style={{ maxWidth: 420, marginTop: 24 }}>
            <h2 style={{ fontFamily: "var(--font-condensed)" }}>
              {settingString(
                settings,
                "ui.about_form_title",
                "ПОМОЖЕМ ПОДОБРАТЬ ТОВАР ДЛЯ ВАШЕЙ КОМПАНИИ"
              )}
            </h2>
            <ContactForm formType="product_selection" />
          </div>
        ) : null}

        {page.template === "contact" && orgId ? (
          <div className="map-wrap">
            <iframe
              title="Карта"
              src={`https://yandex.ru/map-widget/v1/?z=12&ol=biz&oid=${orgId}`}
              loading="lazy"
            />
          </div>
        ) : null}
      </div>
      <style>{`
        @media (max-width: 767px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
