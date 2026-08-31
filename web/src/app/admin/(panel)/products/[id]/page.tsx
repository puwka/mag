import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <div className="admin-header">
        <h1>Редактирование товара</h1>
        <div className="admin-actions">
          <Link href="/admin/products/" className="admin-btn">
            ← К списку
          </Link>
          <Link href={`/product/`} className="admin-btn">
            На сайт
          </Link>
        </div>
      </div>
      <div className="admin-card">
        <ProductForm productId={id} />
      </div>
    </>
  );
}
