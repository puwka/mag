import type { ProductWithImage } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  title,
  buyLabel,
  embedded = false,
}: {
  products: ProductWithImage[];
  title?: string;
  buyLabel?: string;
  /** Без внешней секции/container — для встраивания в каталог */
  embedded?: boolean;
}) {
  const grid = (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} buyLabel={buyLabel} />
      ))}
    </div>
  );

  if (embedded) {
    return products.length ? grid : null;
  }

  return (
    <section style={{ padding: "30px 0" }}>
      <div className="container">
        {title ? <h2 className="section-title">{title}</h2> : null}
        {grid}
      </div>
    </section>
  );
}
