import { requireStaff } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "CMS — ХБтекс" };

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStaff();
  const label =
    profile.full_name ||
    profile.email ||
    `${profile.role}`;

  return (
    <AdminShell userLabel={`${label} (${profile.role})`}>
      {children}
    </AdminShell>
  );
}
