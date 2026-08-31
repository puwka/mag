"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin/", label: "Dashboard" },
  { href: "/admin/products/", label: "Товары" },
  { href: "/admin/categories/", label: "Категории" },
  { href: "/admin/orders/", label: "Заявки" },
  { href: "/admin/pages/", label: "Страницы" },
  { href: "/admin/reviews/", label: "Отзывы" },
  { href: "/admin/menu/", label: "Меню" },
  { href: "/admin/homepage/", label: "Главная" },
  { href: "/admin/media/", label: "Медиа" },
  { href: "/admin/settings/", label: "Настройки" },
];

export function AdminShell({
  children,
  userLabel,
}: {
  children: React.ReactNode;
  userLabel: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/admin/login/");
    router.refresh();
  }

  return (
    <div className="admin-body">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__brand">
            Витекс <span>CMS</span>
          </div>
          <nav className="admin-nav">
            {NAV.map((item) => {
              const active =
                item.href === "/admin/"
                  ? pathname === "/admin" || pathname === "/admin/"
                  : pathname.startsWith(item.href.replace(/\/$/, ""));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "is-active" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="admin-sidebar__foot">
            <div>{userLabel}</div>
            <button type="button" onClick={logout}>
              Выйти
            </button>
            <div style={{ marginTop: 10 }}>
              <Link href="/" style={{ color: "#9ca3af" }}>
                ← На сайт
              </Link>
            </div>
          </div>
        </aside>
        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
