"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OrdersManager } from "@/components/admin/OrdersManager";
import { SubmissionsManager } from "@/components/admin/SubmissionsManager";

export function OrdersPageTabs() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "forms" ? "forms" : "orders";

  return (
    <>
      <div className="admin-tabs" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <Link
          href="/admin/orders/"
          className={tab === "orders" ? "admin-btn admin-btn--primary" : "admin-btn"}
        >
          Заказы из корзины
        </Link>
        <Link
          href="/admin/orders/?tab=forms"
          className={tab === "forms" ? "admin-btn admin-btn--primary" : "admin-btn"}
        >
          Заявки с форм
        </Link>
      </div>
      {tab === "forms" ? <SubmissionsManager /> : <OrdersManager />}
    </>
  );
}
