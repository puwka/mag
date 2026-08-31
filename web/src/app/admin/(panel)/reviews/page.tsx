import { ReviewsManager } from "@/components/admin/ReviewsManager";

export default function AdminReviewsPage() {
  return (
    <>
      <div className="admin-header">
        <h1>Отзывы</h1>
      </div>
      <ReviewsManager />
    </>
  );
}
