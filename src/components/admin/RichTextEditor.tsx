"use client";

import dynamic from "next/dynamic";

export const RichTextEditor = dynamic(
  () =>
    import("./RichTextEditorInner").then((m) => m.RichTextEditorInner),
  {
    ssr: false,
    loading: () => <div className="rte">Загрузка редактора…</div>,
  }
);
