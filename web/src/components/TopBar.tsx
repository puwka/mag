"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import type { City } from "@/lib/types";

export function CitySelector({
  cities,
  selectLabel,
}: {
  cities: City[];
  selectLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = cities.find((c) => c.is_default) || cities[0];

  return (
    <div className="city-selector">
      <button type="button" className="city-selector__trigger" onClick={() => setOpen(true)}>
        {current?.name || "—"} <span>▼</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={selectLabel || ""}>
        <div className="city-list">
          {cities.map((c) => (
            <a
              key={c.id}
              href={c.is_default ? undefined : c.subdomain_url || undefined}
              className={`city-list__item${c.is_default ? " is-current" : ""}`}
              onClick={(e) => {
                if (c.is_default) {
                  e.preventDefault();
                  setOpen(false);
                }
              }}
            >
              {c.name}
              {c.is_default ? <span>✓</span> : null}
            </a>
          ))}
        </div>
      </Modal>
    </div>
  );
}
