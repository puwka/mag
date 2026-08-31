import { MediaManager } from "@/components/admin/MediaManager";

export default function AdminMediaPage() {
  return (
    <>
      <div className="admin-header">
        <h1>Медиатека</h1>
      </div>
      <MediaManager />
    </>
  );
}
