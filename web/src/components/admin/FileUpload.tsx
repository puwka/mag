"use client";

import { createClient } from "@/lib/supabase/client";
import { mediaUrl } from "@/lib/media";

export async function uploadToBucket(
  file: File,
  bucket: string,
  folder = ""
): Promise<{ path: string; url: string | null; error?: string }> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const ext = file.name.split(".").pop() || "bin";
  const safe = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .slice(0, 40);
  const path = `${folder ? folder + "/" : ""}${Date.now()}-${safe}.${ext}`;

  const { error } = await sb.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) return { path: "", url: null, error: error.message };

  await sb.from("media").insert({
    bucket,
    path,
    mime_type: file.type || null,
    size_bytes: file.size,
    title: file.name,
    uploaded_by: user?.id ?? null,
  });

  return { path, url: mediaUrl(path, bucket) };
}

export function FileUploadButton({
  bucket,
  folder,
  accept = "image/*",
  label = "Загрузить",
  onUploaded,
}: {
  bucket: string;
  folder?: string;
  accept?: string;
  label?: string;
  onUploaded: (result: { path: string; url: string | null }) => void;
}) {
  return (
    <label className="admin-btn" style={{ cursor: "pointer" }}>
      {label}
      <input
        type="file"
        accept={accept}
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const res = await uploadToBucket(file, bucket, folder);
          if (res.error) {
            alert(res.error);
            return;
          }
          onUploaded({ path: res.path, url: res.url });
        }}
      />
    </label>
  );
}
