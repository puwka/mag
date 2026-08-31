import Link from "next/link";
import Image from "next/image";
import type {
  HomepageBenefit,
  HomepagePromoBanner,
  HomepageSection,
  HomepageStep,
  Review,
} from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import {
  blockTypeOf,
  sectionButtonLabel,
  sectionButtonUrl,
  sectionDescription,
  sectionImage,
} from "@/lib/homepage";
import { Benefits } from "@/components/Benefits";
import { ProductGrid } from "@/components/ProductGrid";
import { OrderSteps } from "@/components/OrderSteps";
import { Reviews } from "@/components/Reviews";
import { CategoryCard } from "@/components/CategoryCard";
import { ContactForm } from "@/components/ContactForm";
import {
  getBenefits,
  getFeaturedProducts,
  getHomepageSections,
  getProductsByCategorySlugInConfig,
  getPromoBanners,
  getReviews,
  getRootCategories,
  getSettings,
  getSteps,
  settingArray,
  settingString,
} from "@/lib/data";

export async function HomePageView() {
  const [sections, infoBoxes, advantages, steps, reviews, promoAll, settings] =
    await Promise.all([
      getHomepageSections(),
      getBenefits("info_boxes"),
      getBenefits("advantages"),
      getSteps(),
      getReviews(12),
      getPromoBanners(),
      getSettings(),
    ]);

  const blocks = [];
  for (const section of sections) {
    blocks.push(
      await renderSection(section, {
        infoBoxes,
        advantages,
        steps,
        reviews,
        promoAll,
        settings,
      })
    );
  }

  return <>{blocks}</>;
}

async function renderSection(
  section: HomepageSection,
  ctx: {
    infoBoxes: HomepageBenefit[];
    advantages: HomepageBenefit[];
    steps: HomepageStep[];
    reviews: Review[];
    promoAll: HomepagePromoBanner[];
    settings: Record<string, unknown>;
  }
) {
  const type = blockTypeOf(section);
  const key = section.id;

  const buyLabel = settingString(ctx.settings, "ui.buy_label", "Купить");
  const reviewOriginal = settingString(
    ctx.settings,
    "ui.review_original_label",
    "Читать оригинал отзыва"
  );

  switch (type) {
    case "hero":
      return <Hero key={key} section={section} />;
    case "info_boxes": {
      const group = String(section.config?.benefit_group || "info_boxes");
      const items =
        group === "info_boxes"
          ? ctx.infoBoxes
          : await getBenefits(group);
      return (
        <SectionChrome key={key} section={section}>
          <Benefits items={items} variant="icons" />
        </SectionChrome>
      );
    }
    case "advantages": {
      const group = String(section.config?.benefit_group || "advantages");
      const items =
        group === "advantages"
          ? ctx.advantages
          : await getBenefits(group);
      return (
        <SectionChrome key={key} section={section}>
          <Benefits items={items} variant="cards" />
        </SectionChrome>
      );
    }
    case "promo": {
      const row = Number(
        section.config?.promo_row ??
          (section.section_key.includes("2") ? 2 : 1)
      );
      const banners = ctx.promoAll.filter((b) => b.row_index === row);
      return (
        <SectionChrome key={key} section={section}>
          <PromoRow banners={banners} />
        </SectionChrome>
      );
    }
    case "categories": {
      const cats = await getRootCategories();
      const limit = Number(section.config?.limit || 12);
      return (
        <section key={key} className="home-categories">
          <div className="container">
            {section.title ? <h2 className="section-title">{section.title}</h2> : null}
            {sectionDescription(section) ? (
              <p className="section-lead">{sectionDescription(section)}</p>
            ) : null}
            <div className="category-grid">
              {cats.slice(0, limit).map((c) => (
                <CategoryCard key={c.id} category={c} />
              ))}
            </div>
            {sectionButtonLabel(section) && sectionButtonUrl(section) ? (
              <p style={{ textAlign: "center", marginTop: 20 }}>
                <Link href={sectionButtonUrl(section)} className="btn btn-primary">
                  {sectionButtonLabel(section)}
                </Link>
              </p>
            ) : null}
          </div>
        </section>
      );
    }
    case "products": {
      const path = String(section.config?.category_path || "");
      const limit = Number(section.config?.limit || 12);
      const products = path
        ? await getProductsByCategorySlugInConfig(path, limit)
        : [];
      return (
        <section key={key}>
          <ProductGrid
            title={section.title || undefined}
            products={products}
            buyLabel={buyLabel}
          />
          {sectionButtonLabel(section) && sectionButtonUrl(section) ? (
            <div className="container" style={{ textAlign: "center", marginTop: -10, marginBottom: 30 }}>
              <Link href={sectionButtonUrl(section)} className="btn btn-outline">
                {sectionButtonLabel(section)}
              </Link>
            </div>
          ) : null}
        </section>
      );
    }
    case "novelties": {
      const limit = Number(section.config?.limit || 8);
      const products = await getFeaturedProducts(limit);
      return (
        <section key={key}>
          <ProductGrid
            title={section.title || undefined}
            products={products}
            buyLabel={buyLabel}
          />
          {sectionDescription(section) ? (
            <div className="container">
              <p className="section-lead">{sectionDescription(section)}</p>
            </div>
          ) : null}
          {sectionButtonLabel(section) && sectionButtonUrl(section) ? (
            <div className="container" style={{ textAlign: "center", marginBottom: 30 }}>
              <Link href={sectionButtonUrl(section)} className="btn btn-primary">
                {sectionButtonLabel(section)}
              </Link>
            </div>
          ) : null}
        </section>
      );
    }
    case "branding":
      return <BrandingBlock key={key} section={section} />;
    case "about":
      return <AboutBlock key={key} section={section} />;
    case "steps":
      return (
        <OrderSteps
          key={key}
          title={section.title}
          subtitle={section.subtitle || sectionDescription(section)}
          steps={ctx.steps}
        />
      );
    case "reviews":
      return (
        <Reviews
          key={key}
          title={section.title}
          reviews={ctx.reviews}
          logoPath={String(section.config?.logo || sectionImage(section) || "")}
          originalLabel={reviewOriginal}
        />
      );
    case "contacts":
      return <ContactsBlock key={key} section={section} settings={ctx.settings} />;
    default:
      return (
        <SectionChrome key={key} section={section}>
          {sectionDescription(section) ? (
            <div className="container prose">
              <p>{sectionDescription(section)}</p>
            </div>
          ) : null}
        </SectionChrome>
      );
  }
}

function SectionChrome({
  section,
  children,
}: {
  section: HomepageSection;
  children: React.ReactNode;
}) {
  const desc = sectionDescription(section);
  const showHead = !!(section.title || section.subtitle || desc);
  return (
    <>
      {showHead && blockTypeOf(section) !== "info_boxes" && blockTypeOf(section) !== "promo" ? (
        <div className="container" style={{ paddingTop: 24 }}>
          {section.title ? <h2 className="section-title">{section.title}</h2> : null}
          {section.subtitle ? <p className="section-lead">{section.subtitle}</p> : null}
          {desc ? <p className="section-lead">{desc}</p> : null}
        </div>
      ) : null}
      {children}
    </>
  );
}

function Hero({ section }: { section: HomepageSection }) {
  const cfg = section.config || {};
  const bg =
    mediaUrl(String(cfg.background || ""), "site") ||
    mediaUrl(sectionImage(section), "site");
  const img = mediaUrl(String(cfg.image || sectionImage(section) || ""), "site");
  const cta = sectionButtonUrl(section) || String(cfg.cta_url || "");
  const ctaLabel = sectionButtonLabel(section) || String(cfg.cta_label || "");
  const desc = sectionDescription(section);

  return (
    <section
      className="hero"
      style={bg ? { backgroundImage: `url(${bg})` } : undefined}
    >
      <div className="container hero__inner">
        <div className="hero__text">
          {section.title ? <h1>{section.title}</h1> : null}
          {section.subtitle ? <p className="hero__sub">{section.subtitle}</p> : null}
          {desc ? <p className="hero__sub">{desc}</p> : null}
          {cta && ctaLabel ? (
            <Link href={cta} className="btn btn-hero">
              {ctaLabel}
            </Link>
          ) : null}
        </div>
        <div className="hero__media">
          {img ? (
            <Image
              src={img}
              alt={String(cfg.image_alt || section.title || "")}
              width={460}
              height={276}
              priority
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PromoRow({ banners }: { banners: HomepagePromoBanner[] }) {
  if (!banners.length) return null;
  return (
    <section className="promo-row">
      <div className="container">
        <div className="promo-row__grid">
          {banners.map((b) => {
            const img = mediaUrl(b.image_path, "site");
            return (
              <Link key={b.id} href={b.link_url} className="promo-banner">
                {img ? (
                  <Image
                    src={img}
                    alt={b.title}
                    width={400}
                    height={280}
                    className="promo-banner__img"
                  />
                ) : null}
                <span className="btn btn-primary">{b.button_label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BrandingBlock({ section }: { section: HomepageSection }) {
  const img = mediaUrl(sectionImage(section), "site");
  const cta = sectionButtonUrl(section);
  const label = sectionButtonLabel(section);
  return (
    <section className="branding-block">
      <div className="container branding-block__inner">
        <div>
          {section.title ? <h2 className="section-title">{section.title}</h2> : null}
          {section.subtitle ? <p>{section.subtitle}</p> : null}
          {sectionDescription(section) ? (
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: sectionDescription(section) }}
            />
          ) : null}
          {cta && label ? (
            <Link href={cta} className="btn btn-primary" style={{ marginTop: 12 }}>
              {label}
            </Link>
          ) : null}
        </div>
        {img ? (
          <div>
            <Image src={img} alt={section.title || ""} width={520} height={360} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AboutBlock({ section }: { section: HomepageSection }) {
  const html =
    sectionDescription(section) ||
    String(section.config?.html || "");
  const img = mediaUrl(sectionImage(section), "site");
  return (
    <section className="seo-block">
      <div className="container">
        {section.title ? <h2>{section.title}</h2> : null}
        {section.subtitle ? <p className="section-lead">{section.subtitle}</p> : null}
        <div className="about-grid">
          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
          {img ? (
            <Image src={img} alt={section.title || ""} width={480} height={320} />
          ) : null}
        </div>
        {sectionButtonLabel(section) && sectionButtonUrl(section) ? (
          <p style={{ marginTop: 16 }}>
            <Link href={sectionButtonUrl(section)} className="btn btn-primary">
              {sectionButtonLabel(section)}
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ContactsBlock({
  section,
  settings,
}: {
  section: HomepageSection;
  settings: Record<string, unknown>;
}) {
  const phones = settingArray(settings, "contacts.phones");
  const email = settingString(settings, "contacts.email");
  const address = settingString(settings, "company.address");
  const hours = settingString(settings, "contacts.hours");
  const img = mediaUrl(sectionImage(section), "site");

  return (
    <section className="home-contacts">
      <div className="container">
        {section.title ? <h2 className="section-title">{section.title}</h2> : null}
        {section.subtitle || sectionDescription(section) ? (
          <p className="section-lead">
            {section.subtitle || sectionDescription(section)}
          </p>
        ) : null}
        <div className="home-contacts__grid">
          <div>
            {phones.map((p) => (
              <p key={p}>
                <a href={`tel:${p.replace(/[^\d+]/g, "")}`}>{p}</a>
              </p>
            ))}
            {email ? (
              <p>
                <a href={`mailto:${email}`}>{email}</a>
              </p>
            ) : null}
            {address ? <p>{address}</p> : null}
            {hours ? <p>{hours}</p> : null}
            {sectionButtonLabel(section) && sectionButtonUrl(section) ? (
              <Link href={sectionButtonUrl(section)} className="btn btn-primary">
                {sectionButtonLabel(section)}
              </Link>
            ) : null}
            {img ? (
              <Image
                src={img}
                alt=""
                width={400}
                height={240}
                style={{ marginTop: 16 }}
              />
            ) : null}
          </div>
          <div>
            <ContactForm formType="contact" />
          </div>
        </div>
      </div>
    </section>
  );
}
