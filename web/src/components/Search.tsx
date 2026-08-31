"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { mediaUrl, formatPackPrice } from "@/lib/media";
import type { Product } from "@/lib/types";

type Hit = Product & { primary_image?: string | null };

export function Search({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (q.trim().length < 3) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const sb = createClient();
      const { data } = await sb
        .from("products")
        .select("*")
        .eq("status", "published")
        .ilike("name", `%${q}%`)
        .limit(20);
      const products = (data as Product[]) ?? [];
      const ids = products.map((p) => p.id);
      let images: { product_id: string; storage_path: string; is_primary: boolean }[] = [];
      if (ids.length) {
        const { data: imgs } = await sb
          .from("product_images")
          .select("product_id, storage_path, is_primary")
          .in("product_id", ids);
        images = imgs ?? [];
      }
      setHits(
        products.map((p) => {
          const img =
            images.find((i) => i.product_id === p.id && i.is_primary) ||
            images.find((i) => i.product_id === p.id);
          return { ...p, primary_image: img?.storage_path ?? null };
        })
      );
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  if (!open) return null;

  return (
    <div className="search-fullscreen">
      <button type="button" className="search-fullscreen__close" onClick={onClose} aria-label="Close search form">
        ×
      </button>
      <div className="search-fullscreen__inner">
        <p className="search-hint">Начните вводить текст, чтобы увидеть товары, которые вы ищете.</p>
        <form
          className="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) window.location.href = `/search?s=${encodeURIComponent(q.trim())}`;
          }}
        >
          <input
            autoFocus
            type="search"
            name="s"
            placeholder="Поиск перчаток"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Поиск"
            required
          />
          <button type="submit" className="btn btn-primary">
            Поиск
          </button>
        </form>
        <div className="search-results">
          {loading ? <p>Загрузка...</p> : null}
          {hits.map((h) => {
            const img = mediaUrl(h.primary_image, "products");
            return (
              <Link
                key={h.id}
                href={`/product/${h.slug}`}
                className="search-hit"
                onClick={onClose}
              >
                {img ? <Image src={img} alt="" width={60} height={60} /> : <span />}
                <span>
                  <strong>{h.name}</strong>
                  <small>
                    {formatPackPrice(h.pack_price, h.pairs_per_pack, h.price_on_request)}
                  </small>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
