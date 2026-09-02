import type { FormType } from "@/lib/types";

export type SubmissionStatus = "new" | "in_progress" | "done" | "spam";

const FORM_TYPE_LABELS: Record<FormType, string> = {
  contact: "Контакт",
  price_list: "Прайс-лист",
  product_request: "Заявка на товар",
  product_selection: "Подбор товара",
  partnership: "Партнёрство",
  logo_application: "Логотип",
};

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Обработана",
  spam: "Спам",
};

export function formTypeLabel(type: string): string {
  return FORM_TYPE_LABELS[type as FormType] || type;
}

export function submissionStatusLabel(status: string): string {
  return STATUS_LABELS[status as SubmissionStatus] || status;
}

export function submissionContact(payload: Record<string, unknown>) {
  return {
    name: String(payload["your-name"] || payload.name || "—"),
    phone: String(payload.tel || payload.phone || "—"),
    email: String(payload.email || payload["your-email"] || "—"),
  };
}
