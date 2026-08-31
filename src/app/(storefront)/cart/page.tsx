"use client";

import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useCart } from "@/store/cart";

export default function CartPage() {
  const { items, remove, setQty, total, clear } = useCart();

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ name: "Корзина" }]} />
      <div className="container">
        <h1 className="page-title">Корзина</h1>
        {!items.length ? (
          <div className="empty-state">
            <p className="cart-empty">Ваша корзина пока пуста.</p>
            <p>Прежде чем приступить к оформлению заказа, вы должны добавить товары в свою корзину покупок.</p>
            <Link href="/shop/" className="btn btn-primary">
              Вернуться в магазин
            </Link>
          </div>
        ) : (
          <>
            <table className="attrs-table">
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Цена</th>
                  <th>Кол-во</th>
                  <th>Сумма</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.productId}>
                    <td>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {i.image ? <Image src={i.image} alt="" width={56} height={56} /> : null}
                        <div>
                          <Link href={`/product/${i.slug}`}>{i.name}</Link>
                          {i.sku ? (
                            <div style={{ fontSize: 12, color: "#777" }}>Арт. {i.sku}</div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>{i.packPrice.toFixed(2)} ₽</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={i.quantity}
                        onChange={(e) => setQty(i.productId, Number(e.target.value) || 1)}
                        style={{ width: 64 }}
                      />
                    </td>
                    <td>{(i.packPrice * i.quantity).toFixed(2)} ₽</td>
                    <td>
                      <button type="button" onClick={() => remove(i.productId)}>
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontWeight: 700, marginTop: 16 }}>Итого: {total().toFixed(2)} ₽</p>
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-outline" onClick={clear}>
                Очистить корзину
              </button>
              <Link href="/checkout/" className="btn btn-primary">
                Оформить заявку
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
