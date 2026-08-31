const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Resolve DB path or absolute URL to a usable image URL. */
export function mediaUrl(
  path: string | null | undefined,
  bucket = "site"
): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function formatPackPrice(
  packPrice: number | null,
  pairsPerPack: number | null,
  priceOnRequest: boolean
): string {
  if (priceOnRequest || packPrice == null) return "По запросу";
  const pairs = pairsPerPack ? `/${pairsPerPack}пар` : "";
  return `Упак. ${Number(packPrice).toFixed(2)}₽${pairs}`;
}

export function formatPairPrice(
  pricePerPair: number | null,
  priceOnRequest: boolean
): string | null {
  if (priceOnRequest || pricePerPair == null) return null;
  return `Пара ${Number(pricePerPair)}₽`;
}

export function stockLabel(
  status: string,
  custom: string | null
): { text: string; className: string } {
  if (custom) {
    const cls =
      status === "out_of_stock"
        ? "stock-out"
        : status === "on_order"
          ? "stock-order"
          : "stock-in";
    return { text: custom, className: cls };
  }
  if (status === "out_of_stock") return { text: "Sold out", className: "stock-out" };
  if (status === "on_order") return { text: "На заказ", className: "stock-order" };
  return { text: "В наличии", className: "stock-in" };
}
