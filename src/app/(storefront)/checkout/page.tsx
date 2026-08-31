"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useCart } from "@/store/cart";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!items.length) {
    return (
      <div className="page-content">
        <Breadcrumbs items={[{ name: "Оформление заявки" }]} />
        <div className="container empty-state">
          <p>Корзина пуста.</p>
          <Link href="/rabochie-perchatki/" className="btn btn-primary">
            В каталог
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: fd.get("customer_name"),
        customer_email: fd.get("customer_email"),
        customer_phone: fd.get("customer_phone"),
        customer_note: fd.get("customer_note"),
        source: "checkout",
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          pairsPerPack: i.pairsPerPack,
          unitPrice: i.packPrice,
        })),
        subtotal: total(),
        total: total(),
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "Ошибка оформления");
      setPending(false);
      return;
    }
    clear();
    router.push(`/spasibo-za-obrashhenie/?order=${encodeURIComponent(j.order_number || "")}`);
  }

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ name: "Оформление заявки" }]} />
      <div
        className="container checkout-layout"
        style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 30 }}
      >
        <form className="form-grid" onSubmit={onSubmit}>
          <h1 className="page-title">Оформление заявки</h1>
          <p style={{ marginTop: -8, color: "#555" }}>
            Онлайн-оплата не требуется — менеджер свяжется с вами для подтверждения заказа.
          </p>
          <div className="form-field">
            <label htmlFor="customer_name">Имя *</label>
            <input id="customer_name" name="customer_name" required autoComplete="name" />
          </div>
          <div className="form-field">
            <label htmlFor="customer_phone">Телефон *</label>
            <input
              id="customer_phone"
              name="customer_phone"
              type="tel"
              required
              autoComplete="tel"
            />
          </div>
          <div className="form-field">
            <label htmlFor="customer_email">Email</label>
            <input
              id="customer_email"
              name="customer_email"
              type="email"
              autoComplete="email"
            />
          </div>
          <div className="form-field">
            <label htmlFor="customer_note">Комментарий</label>
            <textarea id="customer_note" name="customer_note" rows={4} />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Отправка..." : "Отправить заявку"}
          </button>
        </form>
        <aside>
          <h2 style={{ fontFamily: "var(--font-condensed)" }}>Ваш заказ</h2>
          <ul>
            {items.map((i) => (
              <li key={i.productId} style={{ marginBottom: 8 }}>
                {i.name}
                {i.sku ? ` (${i.sku})` : ""} × {i.quantity} —{" "}
                {(i.packPrice * i.quantity).toFixed(2)} ₽
              </li>
            ))}
          </ul>
          <p style={{ fontWeight: 700 }}>Итого: {total().toFixed(2)} ₽</p>
        </aside>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .checkout-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
