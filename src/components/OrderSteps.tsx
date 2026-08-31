import Link from "next/link";
import type { HomepageStep } from "@/lib/types";

export function OrderSteps({
  title,
  subtitle,
  steps,
}: {
  title?: string | null;
  subtitle?: string | null;
  steps: HomepageStep[];
}) {
  if (!steps.length) return null;
  return (
    <section className="order-steps">
      <div className="container">
        {title ? <h2 className="section-title">{title}</h2> : null}
        {subtitle ? <p className="section-lead">{subtitle}</p> : null}
        <div className="order-steps__grid">
          {steps.map((s) => (
            <div key={s.id} className="order-step">
              <div className="order-step__num">{s.step_number}</div>
              <h3>{s.title}</h3>
              <p>
                {s.description}{" "}
                {s.link_url && s.link_label ? (
                  <Link href={s.link_url}>({s.link_label})</Link>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
