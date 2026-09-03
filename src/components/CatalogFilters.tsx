"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { CatalogQuery, FilterAttribute, StockStatus } from "@/lib/types";
import { buildCatalogQueryString } from "@/lib/catalog-query";
import Link from "next/link";

const STOCK_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "in_stock", label: "В наличии" },
  { value: "on_order", label: "На заказ" },
  { value: "out_of_stock", label: "Нет в наличии" },
];

function FiltersBody({
  path,
  query,
  attributes,
  onNavigate,
}: {
  path: string;
  query: CatalogQuery;
  attributes: FilterAttribute[];
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function navigate(next: CatalogQuery) {
    const qs = buildCatalogQueryString(next);
    router.push(`${pathname}${qs}`);
    onNavigate?.();
  }

  function toggleFilter(attrSlug: string, valueSlug: string) {
    const current = query.filters[attrSlug] ?? [];
    const nextValues = current.includes(valueSlug)
      ? current.filter((v) => v !== valueSlug)
      : [...current, valueSlug];
    const filters = { ...query.filters };
    if (nextValues.length) filters[attrSlug] = nextValues;
    else delete filters[attrSlug];
    navigate({ ...query, page: 1, filters });
  }

  function toggleStock(status: StockStatus) {
    const current = query.stock ?? [];
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    navigate({
      ...query,
      page: 1,
      stock: next.length ? next : undefined,
    });
  }

  function applyPrice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const min = fd.get("min_price");
    const max = fd.get("max_price");
    navigate({
      ...query,
      page: 1,
      minPrice: min ? Number(min) : undefined,
      maxPrice: max ? Number(max) : undefined,
    });
  }

  const hasActive =
    Object.keys(query.filters).length > 0 ||
    !!query.stock?.length ||
    query.minPrice != null ||
    query.maxPrice != null;

  return (
    <>
      <div className="filter-widget">
        <h3 className="filter-widget__title">Прайс-лист</h3>
        <Link href="/prajs-list/" className="btn btn-primary btn-full">
          Отправить запрос
        </Link>
      </div>

      <div className="filter-widget">
        <h3 className="filter-widget__title">Статус наличия</h3>
        <ul className="filter-list">
          {STOCK_OPTIONS.map((o) => (
            <li key={o.value}>
              <label>
                <input
                  type="checkbox"
                  checked={query.stock?.includes(o.value) ?? false}
                  onChange={() => toggleStock(o.value)}
                />
                {o.label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="filter-widget">
        <h3 className="filter-widget__title">Цена, ₽</h3>
        <form className="filter-price" onSubmit={applyPrice}>
          <input
            name="min_price"
            type="number"
            min={0}
            step={1}
            placeholder="от"
            defaultValue={query.minPrice ?? ""}
          />
          <span>—</span>
          <input
            name="max_price"
            type="number"
            min={0}
            step={1}
            placeholder="до"
            defaultValue={query.maxPrice ?? ""}
          />
          <button type="submit" className="btn btn-outline">
            ОК
          </button>
        </form>
      </div>

      {attributes.map((attr) => (
        <div key={attr.id} className="filter-widget">
          <h3 className="filter-widget__title">{attr.name}</h3>
          <ul className="filter-list">
            {attr.values.map((v) => (
              <li key={v.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={query.filters[attr.slug]?.includes(v.slug) ?? false}
                    onChange={() => toggleFilter(attr.slug, v.slug)}
                  />
                  {attr.type === "color" && v.color_hex ? (
                    <span
                      className="filter-swatch"
                      style={{ background: v.color_hex }}
                      aria-hidden
                    />
                  ) : null}
                  {v.name}
                  <span className="filter-count">({v.count})</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {hasActive ? (
        <Link
          href={`/${path}/`}
          className="btn btn-outline btn-full"
          style={{ marginTop: 8 }}
          onClick={onNavigate}
        >
          Сбросить фильтры
        </Link>
      ) : null}
    </>
  );
}

export function CatalogFilters({
  path,
  query,
  attributes,
}: {
  path: string;
  query: CatalogQuery;
  attributes: FilterAttribute[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="catalog-filters-open"
        aria-label="Открыть фильтры"
        onClick={() => setOpen(true)}
      >
        Фильтры
      </button>

      <div
        className={`catalog-filters-backdrop${open ? " is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside className={`catalog-sidebar${open ? " is-open" : ""}`}>
        <div className="catalog-sidebar__head">
          <strong>Фильтры</strong>
          <button
            type="button"
            className="catalog-filters-close"
            aria-label="Закрыть фильтры"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>
        <FiltersBody
          path={path}
          query={query}
          attributes={attributes}
          onNavigate={() => setOpen(false)}
        />
      </aside>
    </>
  );
}
