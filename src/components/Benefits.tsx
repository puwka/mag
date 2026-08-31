import Image from "next/image";
import Link from "next/link";
import type { HomepageBenefit } from "@/lib/types";
import { mediaUrl } from "@/lib/media";

export function Benefits({
  items,
  variant = "icons",
}: {
  items: HomepageBenefit[];
  variant?: "icons" | "cards";
}) {
  if (!items.length) return null;

  if (variant === "cards") {
    return (
      <section className="benefits-cards">
        <div className="container">
          <div className="benefits-cards__grid">
            {items.map((b) => {
              const inner = (
                <>
                  <h3>{b.title}</h3>
                  {b.description ? <p>{b.description}</p> : null}
                  {b.button_label && b.link_url ? (
                    <span className="btn btn-outline" style={{ marginTop: 8 }}>
                      {b.button_label}
                    </span>
                  ) : null}
                </>
              );
              return b.link_url ? (
                <Link key={b.id} href={b.link_url} className="benefits-card">
                  {inner}
                </Link>
              ) : (
                <div key={b.id} className="benefits-card">
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="benefits-icons">
      <div className="container">
        <div className="benefits-icons__grid">
          {items.map((b) => {
            const icon = mediaUrl(b.icon_path, "site");
            const body = (
              <>
                {icon ? (
                  <div className="benefits-icon__img">
                    <Image src={icon} alt="" width={50} height={50} />
                  </div>
                ) : null}
                <div className="benefits-icon__title">{b.title}</div>
              </>
            );
            return b.link_url ? (
              <Link key={b.id} href={b.link_url} className="benefits-icon">
                {body}
              </Link>
            ) : (
              <div key={b.id} className="benefits-icon">
                {body}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
