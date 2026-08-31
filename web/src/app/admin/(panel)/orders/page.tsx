import { OrdersManager } from "@/components/admin/OrdersManager";

export default function AdminOrdersPage() {
  return (
    <>
      <div className="admin-header">
        <h1>Заявки</h1>
      </div>
      <OrdersManager />
    </>
  );
}
