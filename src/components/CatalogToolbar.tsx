"use client";

import { useRouter, usePathname } from "next/navigation";
import type { CatalogQuery } from "@/lib/types";
import { buildCatalogQueryString } from "@/lib/catalog-query";

const ORDER_OPTIONS: { value: CatalogQuery["orderBy"]; label: string }[] = [
  { value: "menu_order", label: "По умолчанию" },
  { value: "popularity", label: "По популярности" },
  { value: "date", label: "По новизне" },
  { value: "price", label: "По цене: возрастание" },
  { value: "price-desc", label: "По цене: убывание" },
];

const PER_PAGE = [12, 24, 30, 48];

export function CatalogToolbar({
  query,
  total,
}: {
  query: CatalogQuery;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const from = total === 0 ? 0 : (query.page - 1) * query.perPage + 1;
  const to = Math.min(query.page * query.perPage, total);

  function go(patch: Partial<CatalogQuery>) {
    const next = { ...query, ...patch };
    if (patch.page == null && (patch.orderBy || patch.perPage)) next.page = 1;
    const qs = buildCatalogQueryString(next);
    router.push(`${pathname}${qs}`);
  }

  return (
    <div className="toolbar">
      <span>
        Отображение {from}–{to} из {total}
      </span>
      <div className="toolbar__controls">
        <label>
          Сортировка{" "}
          <select
            value={query.orderBy}
            onChange={(e) =>
              go({ orderBy: e.target.value as CatalogQuery["orderBy"] })
            }
          >
            {ORDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          На странице{" "}
          <select
            value={query.perPage}
            onChange={(e) => go({ perPage: Number(e.target.value) })}
          >
            {PER_PAGE.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
