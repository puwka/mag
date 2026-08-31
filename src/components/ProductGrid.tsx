import type { ProductWithImage } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  title,
  buyLabel,
}: {
  products: ProductWithImage[];
  title?: string;
  buyLabel?: string;
}) {
  return (
    <section style={{ padding: "30px 0" }}>
      <div className="container">
        {title ? <h2 className="section-title">{title}</h2> : null}
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} buyLabel={buyLabel} />
          ))}
        </div>
      </div>
    </section>
  );
}
