import Link from "next/link";
import type { CatalogQuery } from "@/lib/types";
import { buildCatalogQueryString } from "@/lib/catalog-query";

export function CatalogPagination({
  path,
  query,
  total,
}: {
  path: string;
  query: CatalogQuery;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / query.perPage));
  if (pages <= 1) return null;

  const pageHref = (page: number) =>
    `/${path}/` + buildCatalogQueryString({ ...query, page });

  return (
    <nav className="catalog-pagination" aria-label="Страницы каталога">
      {query.page > 1 ? (
        <Link href={pageHref(query.page - 1)} className="btn btn-outline">
          Назад
        </Link>
      ) : null}
      <ul>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <li key={p}>
            <Link
              href={pageHref(p)}
              className={p === query.page ? "is-active" : undefined}
              aria-current={p === query.page ? "page" : undefined}
            >
              {p}
            </Link>
          </li>
        ))}
      </ul>
      {query.page < pages ? (
        <Link href={pageHref(query.page + 1)} className="btn btn-outline">
          Далее
        </Link>
      ) : null}
    </nav>
  );
}
