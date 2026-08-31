import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <>
      <div className="admin-header">
        <h1>Новый товар</h1>
        <Link href="/admin/products/" className="admin-btn">
          ← К списку
        </Link>
      </div>
      <div className="admin-card">
        <ProductForm />
      </div>
    </>
  );
}
