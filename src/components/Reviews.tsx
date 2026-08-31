"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import Image from "next/image";

export function Reviews({
  title,
  reviews,
  logoPath,
  originalLabel,
}: {
  title?: string | null;
  reviews: Review[];
  logoPath?: string;
  originalLabel?: string;
}) {
  const [page, setPage] = useState(0);
  if (!reviews.length) return null;

  const perPage = 2;
  const pages = Math.ceil(reviews.length / perPage);
  const slice = reviews.slice(page * perPage, page * perPage + perPage);
  const logo = mediaUrl(logoPath, "site");

  return (
    <section className="reviews-section">
      <div className="container">
        <div className="reviews-section__head">
          {title ? <h2 className="section-title">{title}</h2> : null}
          {logo ? (
            <Image src={logo} alt="Яндекс" width={120} height={40} style={{ margin: "0 auto 16px" }} />
          ) : null}
        </div>
        <div className="reviews-slider">
          <button
            type="button"
            className="reviews-nav"
            aria-label="Назад"
            onClick={() => setPage((p) => (p - 1 + pages) % pages)}
          >
            ‹
          </button>
          <div className="reviews-slides">
            {slice.map((r) => (
              <article key={r.id} className="review-card">
                <div className="review-card__author">{r.author_name}</div>
                {r.review_date ? (
                  <div className="review-card__date">
                    {new Date(r.review_date).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                ) : null}
                <p>{r.body}</p>
                {r.external_url ? (
                  <a href={r.external_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                    {originalLabel || "→"}
                  </a>
                ) : null}
              </article>
            ))}
          </div>
          <button
            type="button"
            className="reviews-nav"
            aria-label="Вперёд"
            onClick={() => setPage((p) => (p + 1) % pages)}
          >
            ›
          </button>
        </div>
        <div className="reviews-dots">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === page ? "active" : ""}
              aria-label={`Слайд ${i + 1}`}
              onClick={() => setPage(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
