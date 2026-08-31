"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  text: string;
  moreLabel: string;
  moreUrl: string;
  acceptLabel: string;
};

export function CookieBanner({ text, moreLabel, moreUrl, acceptLabel }: Props) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("vitex-cookies-v2")) setShow(true);
  }, []);
  if (!show || !text) return null;
  return (
    <div className="cookie-banner">
      <p>
        {text}{" "}
        {moreLabel && moreUrl ? <Link href={moreUrl}>{moreLabel}</Link> : null}
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          localStorage.setItem("vitex-cookies-v2", "1");
          setShow(false);
        }}
      >
        {acceptLabel || "OK"}
      </button>
    </div>
  );
}
