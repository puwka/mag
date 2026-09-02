"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormType } from "@/lib/types";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "select" | "file" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
};

const FORM_FIELDS: Record<FormType, Field[]> = {
  contact: [
    { name: "your-name", label: "Ваше имя", required: true, placeholder: "Как к вам обращаться?" },
    { name: "your-email", label: "Email", type: "email", placeholder: "Не обязательно" },
    { name: "tel", label: "Телефон", type: "tel", required: true, placeholder: "Свяжемся по этому номеру" },
    { name: "company", label: "Юр. лицо", placeholder: "ООО или ИП" },
    { name: "message", label: "Вопрос", type: "textarea" },
    { name: "acceptance", label: "Даю согласие на обработку персональных данных", type: "checkbox" },
  ],
  price_list: [
    { name: "your-name", label: "Ваше имя", required: true, placeholder: "Ваше имя" },
    { name: "tel", label: "Телефон", type: "tel", required: true, placeholder: "Телефон для связи" },
    { name: "email", label: "Электронная почта", type: "email", required: true, placeholder: "Электронная почта" },
    { name: "acceptance", label: "Даю согласие на обработку персональных данных", type: "checkbox" },
  ],
  product_request: [
    { name: "your-name", label: "Имя", required: true, placeholder: "Константин" },
    { name: "your-email", label: "Email", type: "email", required: true, placeholder: "zakaz@yandex.ru" },
    { name: "tel", label: "Телефон", type: "tel", required: true },
    { name: "acceptance", label: "Даю согласие на обработку персональных данных", type: "checkbox" },
  ],
  product_selection: [
    { name: "tel", label: "Телефон", type: "tel", required: true, placeholder: "Телефон для связи" },
  ],
  partnership: [
    { name: "your-name", label: "Ваше имя", required: true, placeholder: "Ваше имя" },
    { name: "tel", label: "Телефон", type: "tel", required: true, placeholder: "Телефон для связи" },
    { name: "email", label: "Эл. почта", type: "email", required: true, placeholder: "Эл. почта" },
    {
      name: "person_type",
      label: "Тип",
      type: "select",
      required: true,
      options: [
        { value: "Юр.лицо", label: "Юр.лицо" },
        { value: "Физ.лицо", label: "Физ.лицо" },
      ],
    },
    { name: "acceptance", label: "Даю согласие на обработку персональных данных", type: "checkbox" },
  ],
  logo_application: [
    { name: "company", label: "Компания / название", required: true },
    { name: "tel", label: "Телефон", type: "tel", required: true },
    { name: "file", label: "Макет (.jpg, .png, .psd)", type: "file" },
  ],
};

export function ContactForm({
  formType,
  productId,
  productUrl,
  submitLabel = "Отправить",
}: {
  formType: FormType;
  productId?: string;
  productUrl?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const fields = FORM_FIELDS[formType];
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.type === "file") return;
      const v = fd.get(f.name);
      if (v != null) payload[f.name] = String(v);
    });

    try {
      const res = await fetch("/api/forms/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType,
          payload,
          productId,
          productUrl,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Ошибка отправки");
      }
      router.push("/spasibo-za-obrashhenie/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      setPending(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      {fields.map((f) => {
        if (f.type === "checkbox") {
          return (
            <label key={f.name} className="form-check">
              <input type="checkbox" name={f.name} value="1" />
              <span>
                {f.label}{" "}
                <a href="/privacy-policy/" target="_blank" rel="noreferrer">
                  персональных данных
                </a>
              </span>
            </label>
          );
        }
        if (f.type === "textarea") {
          return (
            <div key={f.name} className="form-field">
              <label htmlFor={f.name}>{f.label}</label>
              <textarea id={f.name} name={f.name} rows={5} required={f.required} />
            </div>
          );
        }
        if (f.type === "select") {
          return (
            <div key={f.name} className="form-field">
              <label htmlFor={f.name}>{f.label}</label>
              <select id={f.name} name={f.name} required={f.required} defaultValue={f.options?.[0]?.value}>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (f.type === "file") {
          return (
            <div key={f.name} className="form-field">
              <label htmlFor={f.name}>{f.label}</label>
              <input id={f.name} name={f.name} type="file" accept=".jpg,.jpeg,.png,.psd" />
            </div>
          );
        }
        return (
          <div key={f.name} className="form-field">
            <label htmlFor={f.name}>{f.label}</label>
            <input
              id={f.name}
              name={f.name}
              type={f.type || "text"}
              required={f.required}
              placeholder={f.placeholder}
            />
          </div>
        );
      })}
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Отправка..." : submitLabel}
      </button>
    </form>
  );
}
