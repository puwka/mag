import { Suspense } from "react";
import { OrdersPageTabs } from "@/components/admin/OrdersPageTabs";

export default function AdminOrdersPage() {
  return (
    <>
      <div className="admin-header">
        <h1>Заявки</h1>
      </div>
      <Suspense fallback={<p>Загрузка…</p>}>
        <OrdersPageTabs />
      </Suspense>
    </>
  );
}
