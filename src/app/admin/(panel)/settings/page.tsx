import { SettingsForm } from "@/components/admin/SettingsForm";

export default function AdminSettingsPage() {
  return (
    <>
      <div className="admin-header">
        <h1>Настройки сайта</h1>
      </div>
      <SettingsForm />
    </>
  );
}
