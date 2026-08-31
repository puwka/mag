"use client";

import { useState } from "react";
import Link from "next/link";
import type { MenuItem } from "@/lib/types";
import { menuHref } from "@/lib/links";

function MenuBranch({
  items,
  onNavigate,
}: {
  items: MenuItem[];
  onNavigate?: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <ul className="mobile-menu-list">
      {items.map((item) => {
        const hasKids = !!item.children?.length;
        const href = menuHref(item.url);
        return (
          <li key={item.id}>
            <div className="mobile-menu-row">
              {href ? (
                <Link href={href} onClick={onNavigate}>
                  {item.title}
                </Link>
              ) : (
                <span>{item.title}</span>
              )}
              {hasKids ? (
                <button
                  type="button"
                  aria-label="Подменю"
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                >
                  {openId === item.id ? "−" : "+"}
                </button>
              ) : null}
            </div>
            {hasKids && openId === item.id ? (
              <MenuBranch items={item.children!} onNavigate={onNavigate} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function MobileMenu({
  open,
  onClose,
  items,
  searchSlot,
  citySlot,
}: {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
  searchSlot?: React.ReactNode;
  citySlot?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="side-backdrop" onClick={onClose} />
      <aside className="side-panel side-panel--left mobile-nav">
        <div className="side-panel__head">
          <span>Menu</span>
          <button type="button" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <div className="side-panel__body">
          {searchSlot}
          <MenuBranch items={items} onNavigate={onClose} />
          {citySlot}
        </div>
      </aside>
    </>
  );
}
