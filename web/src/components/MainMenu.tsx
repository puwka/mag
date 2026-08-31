"use client";

import Link from "next/link";
import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { menuHref } from "@/lib/links";

export function MainMenu({ items }: { items: MenuItem[] }) {
  const root = items[0];
  if (!root) return null;
  const icon = mediaUrl(root.icon_path, "site");

  return (
    <div className="main-menu">
      <div className="main-menu__trigger">
        {icon ? <Image src={icon} alt="" width={22} height={22} /> : null}
        <span>{root.title}</span>
      </div>
      <div className="main-menu__dropdown">
        <div className="container">
          <ul className="mega-cols">
            {(root.children || []).map((col) => {
              const href = menuHref(col.url);
              return (
                <li key={col.id} className="mega-col">
                  {href ? (
                    <Link href={href} className="mega-col__title">
                      {col.title}
                    </Link>
                  ) : (
                    <span className="mega-col__title">{col.title}</span>
                  )}
                  {col.children?.length ? (
                    <ul>
                      {col.children.map((ch) => {
                        const chHref = menuHref(ch.url);
                        return (
                          <li key={ch.id}>
                            {chHref ? (
                              <Link href={chHref}>{ch.title}</Link>
                            ) : (
                              <span>{ch.title}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
