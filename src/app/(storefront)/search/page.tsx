import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGrid } from "@/components/ProductGrid";
import { searchProducts } from "@/lib/data";

type Props = { searchParams: Promise<{ s?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { s } = await searchParams;
  const q = (s || "").trim();
  const products = q ? await searchProducts(q, 40) : [];

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ name: "Поиск" }]} />
      <div className="container">
        <h1 className="page-title">Поиск{q ? `: ${q}` : ""}</h1>
        {!q ? <p>Введите запрос.</p> : null}
        {q && !products.length ? <p>Ничего не найдено.</p> : null}
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
