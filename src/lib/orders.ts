/** Business statuses for request-orders (no online payment). */
export const ORDER_STATUS_LABELS = {
  new: "Новая",
  processing: "В работе",
  completed: "Обработана",
  cancelled: "Отменена",
} as const;

export type AppOrderStatus = keyof typeof ORDER_STATUS_LABELS;

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as AppOrderStatus] ?? status;
}
