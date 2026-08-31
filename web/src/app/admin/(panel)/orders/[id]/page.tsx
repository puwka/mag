import { OrderDetail } from "@/components/admin/OrderDetail";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <div className="admin-header">
        <h1>Заявка</h1>
      </div>
      <OrderDetail orderId={id} />
    </>
  );
}
