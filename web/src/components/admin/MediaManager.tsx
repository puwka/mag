"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileUploadButton, uploadToBucket } from "@/components/admin/FileUpload";
import { mediaUrl } from "@/lib/media";

type MediaRow = {
  id: string;
  bucket: string;
  path: string;
  mime_type: string | null;
  size_bytes: number | null;
  title: string | null;
  alt: string | null;
  created_at: string;
};

const BUCKETS = ["media", "products", "categories", "pages", "reviews", "site"];

export function MediaManager() {
  const [bucket, setBucket] = useState("media");
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load(b = bucket) {
    const sb = createClient();
    const { data } = await sb
      .from("media")
      .select("*")
      .eq("bucket", b)
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data as MediaRow[]) ?? []);
  }

  useEffect(() => {
    load(bucket);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket]);

  async function remove(row: MediaRow) {
    if (!confirm("Удалить файл из Storage и из базы?")) return;
    const sb = createClient();
    await sb.storage.from(row.bucket).remove([row.path]);
    await sb.from("media").delete().eq("id", row.id);
    setMsg("Удалено");
    load();
  }

  async function replace(row: MediaRow, file: File) {
    const sb = createClient();
    const { error } = await sb.storage.from(row.bucket).upload(row.path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    await sb
      .from("media")
      .update({
        mime_type: file.type || null,
        size_bytes: file.size,
        title: file.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    setMsg("Файл заменён");
    load();
  }

  return (
    <>
      <div className="admin-toolbar">
        <select value={bucket} onChange={(e) => setBucket(e.target.value)}>
          {BUCKETS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <FileUploadButton
          bucket={bucket}
          folder="library"
          label="Загрузить"
          accept="image/*,application/pdf,video/mp4"
          onUploaded={() => {
            setMsg("Загружено");
            load();
          }}
        />
        <label className="admin-btn" style={{ cursor: "pointer" }}>
          Быстрая загрузка
          <input
            type="file"
            hidden
            accept="image/*,application/pdf"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              const res = await uploadToBucket(f, bucket, "library");
              setMsg(res.error || "Загружено");
              load();
            }}
          />
        </label>
      </div>
      {msg ? <p className="admin-ok">{msg}</p> : null}
      <div className="media-grid">
        {rows.map((r) => {
          const url = mediaUrl(r.path, r.bucket);
          const isImg = (r.mime_type || "").startsWith("image") || /\.(jpe?g|png|webp|gif)$/i.test(r.path);
          return (
            <div key={r.id} className="media-tile">
              <div className="media-tile__img">
                {isImg && url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={r.alt || ""} />
                ) : (
                  <span>{r.mime_type || "file"}</span>
                )}
              </div>
              <div className="media-tile__meta">
                <div>{r.title || r.path}</div>
                <div style={{ color: "#6b7280" }}>{r.bucket}/{r.path}</div>
                <div className="admin-actions" style={{ marginTop: 6 }}>
                  {url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="admin-btn admin-btn--sm">
                      Открыть
                    </a>
                  ) : null}
                  <label className="admin-btn admin-btn--sm" style={{ cursor: "pointer" }}>
                    Заменить
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) replace(r, f);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm admin-btn--danger"
                    onClick={() => remove(r)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
