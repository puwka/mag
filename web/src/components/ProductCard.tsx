import Link from "next/link";
import Image from "next/image";
import type { ProductWithImage } from "@/lib/types";
import { formatPackPrice, formatPairPrice, mediaUrl, stockLabel } from "@/lib/media";

export function ProductCard({
  product,
  buyLabel = "Купить",
}: {
  product: ProductWithImage;
  buyLabel?: string;
}) {
  const href = `/product/${product.slug}/`;
  const img = mediaUrl(product.primary_image, "products");
  const stock = stockLabel(product.stock_status, product.stock_label);
  const pair = formatPairPrice(product.price_per_pair, product.price_on_request);

  return (
    <article className="product-card">
      <Link href={href} className="product-card__media">
        {img ? (
          <Image src={img} alt={product.name} width={400} height={400} sizes="(max-width:767px) 50vw, 25vw" />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#eee" }} />
        )}
      </Link>
      <div className="product-card__body">
        <h3 className="product-card__title">
          <Link href={href}>{product.name}</Link>
        </h3>
        <div className={stock.className}>{stock.text}</div>
        <div className="product-card__price">
          {formatPackPrice(product.pack_price, product.pairs_per_pack, product.price_on_request)}
        </div>
        {pair ? <div className="product-card__pair">{pair}</div> : null}
        <Link href={href} className="btn btn-primary">
          {buyLabel}
        </Link>
      </div>
    </article>
  );
}
