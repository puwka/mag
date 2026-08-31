"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/store/cart";

export function Cart() {
  const { items, open, setOpen, remove, setQty, total, count } = useCart();

  if (!open) return null;

  return (
    <>
      <div className="side-backdrop" onClick={() => setOpen(false)} />
      <aside className="side-panel side-panel--right" aria-label="Корзина покупок">
        <div className="side-panel__head">
          <span>Корзина покупок</span>
          <button type="button" onClick={() => setOpen(false)}>
            Закрыть
          </button>
        </div>
        <div className="side-panel__body">
          {!items.length ? (
            <div style={{ textAlign: "center", padding: 24 }}>
              <p>Корзина пуста.</p>
              <Link href="/rabochie-perchatki/" className="btn btn-primary" onClick={() => setOpen(false)}>
                В каталог
              </Link>
            </div>
          ) : (
            <>
              <ul className="cart-list">
                {items.map((i) => (
                  <li key={i.productId} className="cart-list__item">
                    {i.image ? (
                      <Image src={i.image} alt="" width={64} height={64} />
                    ) : (
                      <span style={{ width: 64, height: 64, background: "#eee" }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <Link href={`/product/${i.slug}`} onClick={() => setOpen(false)}>
                        {i.name}
                      </Link>
                      <div style={{ fontSize: 13, marginTop: 6 }}>
                        <button type="button" onClick={() => setQty(i.productId, i.quantity - 1)}>
                          −
                        </button>{" "}
                        {i.quantity} уп.{" "}
                        <button type="button" onClick={() => setQty(i.productId, i.quantity + 1)}>
                          +
                        </button>
                      </div>
                      <div style={{ fontSize: 13 }}>
                        {(i.packPrice * i.quantity).toFixed(2)} ₽
                      </div>
                    </div>
                    <button type="button" onClick={() => remove(i.productId)} aria-label="Удалить">
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 16, fontWeight: 700 }}>
                Итого: {total().toFixed(2)} ₽ ({count()} уп.)
              </div>
              <Link
                href="/cart/"
                className="btn btn-outline btn-full"
                style={{ marginTop: 12 }}
                onClick={() => setOpen(false)}
              >
                Корзина
              </Link>
              <Link
                href="/checkout/"
                className="btn btn-primary btn-full"
                style={{ marginTop: 8 }}
                onClick={() => setOpen(false)}
              >
                Оформить заявку
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

export function CartButton() {
  const { setOpen, count, total } = useCart();
  const n = count();
  return (
    <button type="button" className="cart-btn" onClick={() => setOpen(true)} title="Корзина покупок">
      <span className="cart-btn__icon" aria-hidden>
        🛒
      </span>
      <span className="cart-btn__meta">
        <span>{n} items</span>
        <span>{total().toFixed(1)} ₽</span>
      </span>
    </button>
  );
}
