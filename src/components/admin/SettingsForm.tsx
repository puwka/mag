"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileUploadButton } from "@/components/admin/FileUpload";

type SettingRow = {
  key: string;
  value: unknown;
  label: string | null;
  group_name: string | null;
};

const FIELDS: {
  key: string;
  label: string;
  group: string;
  type: "text" | "textarea" | "json-array" | "image";
}[] = [
  { key: "brand.name", label: "Название бренда", group: "Бренд", type: "text" },
  { key: "brand.logo", label: "Логотип", group: "Бренд", type: "image" },
  { key: "brand.logo_mobile", label: "Логотип mobile", group: "Бренд", type: "image" },
  { key: "brand.favicon", label: "Favicon URL", group: "Бренд", type: "image" },
  { key: "contacts.phones", label: "Телефоны (JSON массив)", group: "Контакты", type: "json-array" },
  { key: "contacts.phones_display", label: "Телефоны display", group: "Контакты", type: "json-array" },
  { key: "contacts.phones_tel", label: "Телефоны tel:", group: "Контакты", type: "json-array" },
  { key: "contacts.sales_phones", label: "Телефоны продаж", group: "Контакты", type: "json-array" },
  { key: "contacts.email", label: "Email", group: "Контакты", type: "text" },
  { key: "contacts.hours", label: "График работы", group: "Контакты", type: "text" },
  { key: "contacts.whatsapp", label: "WhatsApp", group: "Контакты", type: "text" },
  { key: "contacts.telegram", label: "Telegram (ссылка)", group: "Контакты", type: "text" },
  { key: "contacts.max", label: "MAX (ссылка)", group: "Контакты", type: "text" },
  { key: "contacts.telegram_label", label: "Подпись Telegram", group: "Контакты", type: "text" },
  { key: "contacts.max_label", label: "Подпись MAX", group: "Контакты", type: "text" },
  { key: "contacts.no_call_text", label: "Текст «не дозвонились»", group: "Контакты", type: "textarea" },
  { key: "company.name", label: "Юр. название", group: "Реквизиты", type: "text" },
  { key: "company.inn", label: "ИНН", group: "Реквизиты", type: "text" },
  { key: "company.address", label: "Адрес", group: "Реквизиты", type: "text" },
  { key: "company.footer_blurb", label: "Текст в футере", group: "Реквизиты", type: "textarea" },
  { key: "social.vk", label: "VK", group: "Соцсети", type: "text" },
  { key: "social.youtube", label: "YouTube", group: "Соцсети", type: "text" },
  { key: "seo.home_title", label: "SEO title главной", group: "SEO", type: "text" },
  { key: "seo.home_description", label: "SEO description главной", group: "SEO", type: "textarea" },
  { key: "maps.yandex_org_id", label: "Яндекс org id", group: "Аналитика", type: "text" },
  { key: "analytics.ym_id", label: "Яндекс.Метрика ID", group: "Аналитика", type: "text" },
  { key: "analytics.ga_id", label: "Google Analytics ID", group: "Аналитика", type: "text" },
  { key: "legal.copyright", label: "Copyright", group: "Юридическое", type: "text" },
  { key: "legal.disclaimer", label: "Дисклеймер", group: "Юридическое", type: "textarea" },
  { key: "ui.no_call_label", label: "Кнопка «не дозвонились»", group: "Интерфейс", type: "text" },
  { key: "ui.search_label", label: "Кнопка поиска", group: "Интерфейс", type: "text" },
  { key: "ui.whatsapp_message", label: "WhatsApp текст", group: "Интерфейс", type: "textarea" },
  { key: "ui.whatsapp_send_label", label: "WhatsApp кнопка", group: "Интерфейс", type: "text" },
  { key: "ui.buy_label", label: "Кнопка «Купить»", group: "Интерфейс", type: "text" },
  { key: "ui.review_original_label", label: "Ссылка на оригинал отзыва", group: "Интерфейс", type: "text" },
  { key: "ui.city_select_label", label: "Заголовок выбора города", group: "Интерфейс", type: "text" },
  { key: "footer.col_location", label: "Заголовок колонки 1", group: "Футер", type: "text" },
  { key: "footer.col_info", label: "Заголовок колонки 2", group: "Футер", type: "text" },
  { key: "footer.col_catalog", label: "Заголовок колонки 3", group: "Футер", type: "text" },
  { key: "footer.col_gloves", label: "Заголовок колонки 4", group: "Футер", type: "text" },
  { key: "footer.privacy_label", label: "Политика (текст)", group: "Футер", type: "text" },
  { key: "footer.privacy_url", label: "Политика (URL)", group: "Футер", type: "text" },
  { key: "footer.inn_label", label: "Подпись ИНН", group: "Футер", type: "text" },
  { key: "social.vk_label", label: "Подпись VK", group: "Соцсети", type: "text" },
  { key: "social.youtube_label", label: "Подпись YouTube", group: "Соцсети", type: "text" },
  { key: "cookie.text", label: "Текст cookie", group: "Cookie", type: "textarea" },
  { key: "cookie.more_label", label: "Ссылка «подробнее»", group: "Cookie", type: "text" },
  { key: "cookie.more_url", label: "URL политики", group: "Cookie", type: "text" },
  { key: "cookie.accept_label", label: "Кнопка согласия", group: "Cookie", type: "text" },
];

function valueToInput(v: unknown, type: string): string {
  if (type === "json-array") {
    if (Array.isArray(v)) return JSON.stringify(v, null, 0);
    if (typeof v === "string") return v;
    return "[]";
  }
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

function parseInput(raw: string, type: string): unknown {
  if (type === "json-array") {
    try {
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [raw];
    } catch {
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return raw;
}

export function SettingsForm() {
  const [map, setMap] = useState<Record<string, SettingRow>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.from("site_settings")
      .select("key, value, label, group_name")
      .then(({ data }) => {
        const m: Record<string, SettingRow> = {};
        const d: Record<string, string> = {};
        for (const row of (data as SettingRow[]) ?? []) {
          m[row.key] = row;
        }
        for (const f of FIELDS) {
          d[f.key] = valueToInput(m[f.key]?.value, f.type);
        }
        setMap(m);
        setDraft(d);
      });
  }, []);

  async function saveAll(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const sb = createClient();
    for (const f of FIELDS) {
      const value = parseInput(draft[f.key] ?? "", f.type);
      const existing = map[f.key];
      if (existing) {
        const { error: ue } = await sb
          .from("site_settings")
          .update({ value, label: f.label, group_name: f.group })
          .eq("key", f.key);
        if (ue) {
          setError(`${f.key}: ${ue.message}`);
          return;
        }
      } else {
        const { error: ie } = await sb.from("site_settings").insert({
          key: f.key,
          value,
          label: f.label,
          group_name: f.group,
          is_public: true,
        });
        if (ie) {
          setError(`${f.key}: ${ie.message}`);
          return;
        }
      }
    }
    setMsg("Настройки сохранены");
  }

  const groups = [...new Set(FIELDS.map((f) => f.group))];

  return (
    <form className="admin-form admin-form--wide" onSubmit={saveAll}>
      {groups.map((g) => (
        <div key={g} className="admin-card">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-condensed)" }}>{g}</h2>
          {FIELDS.filter((f) => f.group === g).map((f) => (
            <div key={f.key} className="admin-field" style={{ marginBottom: 12 }}>
              <label>
                {f.label} <code style={{ fontWeight: 400 }}>{f.key}</code>
              </label>
              {f.type === "image" ? (
                <div className="admin-actions" style={{ marginBottom: 6 }}>
                  <FileUploadButton
                    bucket="site"
                    folder="brand"
                    onUploaded={({ path, url }) =>
                      setDraft((d) => ({
                        ...d,
                        [f.key]: url || path,
                      }))
                    }
                  />
                </div>
              ) : null}
              {f.type === "textarea" || f.type === "json-array" ? (
                <textarea
                  value={draft[f.key] ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                  rows={f.type === "json-array" ? 2 : 3}
                />
              ) : (
                <input
                  value={draft[f.key] ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                />
              )}
            </div>
          ))}
        </div>
      ))}
      {error ? <p className="admin-error">{error}</p> : null}
      {msg ? <p className="admin-ok">{msg}</p> : null}
      <button type="submit" className="admin-btn admin-btn--primary">
        Сохранить настройки
      </button>
    </form>
  );
}
