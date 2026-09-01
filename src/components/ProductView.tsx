"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type {
  ProductAttributeRow,
  ProductDocument,
  ProductPriceTier,
  ProductWithImage,
} from "@/lib/types";
import { formatPackPrice, formatPairPrice, mediaUrl, stockLabel } from "@/lib/media";
import { useCart } from "@/store/cart";
import { ContactForm } from "@/components/ContactForm";
import { Modal } from "@/components/Modal";
import { ProductCard } from "@/components/ProductCard";

export function ProductView({
  product,
  tiers,
  documents,
  related,
  attributes = [],
  site,
}: {
  product: ProductWithImage;
  tiers: ProductPriceTier[];
  documents: ProductDocument[];
  related: ProductWithImage[];
  attributes?: ProductAttributeRow[];
  site?: {
    siteUrl: string;
    brand: string;
    phoneDisplay: string;
    phoneTel: string;
    deliveryHtml: string;
  };
}) {
  const images = (product.images?.length
    ? product.images
    : product.primary_image
      ? [
          {
            id: "primary",
            product_id: product.id,
            storage_path: product.primary_image,
            alt: product.name,
            sort_order: 0,
            is_primary: true,
          },
        ]
      : []
  ).map((img) => ({
    ...img,
    url: mediaUrl(img.storage_path, "products"),
  }));

  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab] = useState("description");
  const [qty, setQty] = useState(1);
  const [requestOpen, setRequestOpen] = useState(false);
  const add = useCart((s) => s.add);
  const active = images[activeIdx];
  const img = active?.url ?? null;
  const stock = stockLabel(product.stock_status, product.stock_label);
  const hrefBase = product.category_path
    ? `/${product.category_path}/${product.slug}`
    : `/product/${product.slug}`;

  const canAdd =
    !product.price_on_request &&
    product.pack_price != null &&
    product.stock_status !== "out_of_stock";

  return (
    <div className="product-page">
      <div className="container">
        <div className="product-layout">
          <div className="product-gallery">
            <div className="product-gallery__main">
              {img ? (
                <Image
                  src={img}
                  alt={active?.alt || product.name}
                  width={700}
                  height={700}
                  priority
                />
              ) : (
                <div className="product-gallery__placeholder" />
              )}
            </div>
            {images.length > 1 ? (
              <ul className="product-gallery__thumbs">
                {images.map((im, i) =>
                  im.url ? (
                    <li key={im.id}>
                      <button
                        type="button"
                        className={i === activeIdx ? "is-active" : undefined}
                        onClick={() => setActiveIdx(i)}
                        aria-label={`Фото ${i + 1}`}
                      >
                        <Image
                          src={im.url}
                          alt=""
                          width={80}
                          height={80}
                        />
                      </button>
                    </li>
                  ) : null
                )}
              </ul>
            ) : null}
          </div>
          <div className="product-summary">
            <h1>{product.name}</h1>
            {product.sku ? (
              <p className="product-sku">Артикул: {product.sku}</p>
            ) : null}
            <div className={stock.className}>{stock.text}</div>
            {product.short_description ? <p>{product.short_description}</p> : null}
            <div className="product-summary__price">
              {formatPackPrice(
                product.pack_price,
                product.pairs_per_pack,
                product.price_on_request
              )}
            </div>
            <div>
              {formatPairPrice(product.price_per_pair, product.price_on_request)
                ? `За пару: ${product.price_per_pair}₽`
                : null}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-primary" onClick={() => setRequestOpen(true)}>
                Оставить заявку
              </button>
              {site?.phoneTel ? (
                <a href={`tel:${site.phoneTel}`} className="btn btn-outline">
                  Задать вопрос: {site.phoneDisplay || site.phoneTel}
                </a>
              ) : null}
            </div>
            {canAdd ? (
              <div className="qty-row">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                />
                <button type="button" onClick={() => setQty((q) => q + 1)}>
                  +
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() =>
                    add(
                      {
                        productId: product.id,
                        slug: product.slug,
                        name: product.name,
                        sku: product.sku,
                        image: img,
                        packPrice: Number(product.pack_price),
                        pairsPerPack: product.pairs_per_pack || 1,
                      },
                      qty
                    )
                  }
                >
                  Добавить упаковку в корзину
                </button>
              </div>
            ) : product.stock_status === "out_of_stock" ? (
              <p style={{ marginTop: 16 }}>Товар временно отсутствует.</p>
            ) : null}
            <div style={{ marginTop: 16, fontSize: 13 }}>
              Поделиться:{" "}
              <a
                href={`https://vk.com/share.php?url=${encodeURIComponent(
                  (site?.siteUrl || "") + hrefBase
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                VK
              </a>
              {" · "}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="product-tabs">
          <div className="product-tabs__nav">
            {[
              ["description", "Описание"],
              ["details", "Характеристики"],
              ["docs", "Документы"],
              ["delivery", "Доставка"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={tab === id ? "active" : ""}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="product-tabs__panel">
            {tab === "description" ? (
              <div>
                <div
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: product.description || "" }}
                />
                {tiers.length ? (
                  <div style={{ marginTop: 20 }}>
                    <h3>Оптовые условия</h3>
                    <table className="attrs-table">
                      <tbody>
                        {tiers.map((t) => (
                          <tr key={t.id}>
                            <th>
                              {t.min_pairs}
                              {t.max_pairs != null ? `–${t.max_pairs}` : "+"} пар
                            </th>
                            <td>{t.price_per_pair} ₽ / пара</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : null}
            {tab === "details" ? (
              <table className="attrs-table">
                <tbody>
                  {product.sku ? (
                    <tr>
                      <th>Артикул</th>
                      <td>{product.sku}</td>
                    </tr>
                  ) : null}
                  <tr>
                    <th>Статус</th>
                    <td>{stock.text}</td>
                  </tr>
                  {product.pairs_per_pack ? (
                    <tr>
                      <th>Количество в упаковке</th>
                      <td>{product.pairs_per_pack} пар</td>
                    </tr>
                  ) : null}
                  {product.weight_grams ? (
                    <tr>
                      <th>Вес (гр.)</th>
                      <td>{product.weight_grams}</td>
                    </tr>
                  ) : null}
                  {attributes.map((a) => (
                    <tr key={`${a.attribute_slug}-${a.value_slug}`}>
                      <th>{a.attribute_name}</th>
                      <td>
                        {a.color_hex ? (
                          <span
                            className="filter-swatch"
                            style={{ background: a.color_hex, marginRight: 6 }}
                          />
                        ) : null}
                        {a.value_name}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <th>Производитель</th>
                    <td>{site?.brand || "—"}</td>
                  </tr>
                </tbody>
              </table>
            ) : null}
            {tab === "docs" ? (
              documents.length ? (
                <ul>
                  {documents.map((d) => {
                    const href = mediaUrl(d.storage_path, "products");
                    return (
                      <li key={d.id}>
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer">
                            {d.title}
                          </a>
                        ) : (
                          <span>{d.title}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>Документы появятся позже.</p>
              )
            ) : null}
            {tab === "delivery" ? (
              site?.deliveryHtml ? (
                <div
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: site.deliveryHtml }}
                />
              ) : (
                <p>
                  Подробнее — на странице <Link href="/dostavka/">Доставка</Link>.
                </p>
              )
            ) : null}
          </div>
        </div>

        {related.length ? (
          <section style={{ marginTop: 40 }}>
            <h2 className="section-title">Похожие</h2>
            <div className="product-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Оставить заявку" wide>
        <ContactForm
          formType="product_request"
          productId={product.id}
          productUrl={hrefBase}
        />
      </Modal>
    </div>
  );
}
