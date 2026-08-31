/** Helpers to read CMS homepage block fields (columns or config fallback). */
import type { HomepageSection } from "@/lib/types";

export type BlockType =
  | "hero"
  | "info_boxes"
  | "promo"
  | "categories"
  | "products"
  | "novelties"
  | "branding"
  | "advantages"
  | "about"
  | "steps"
  | "reviews"
  | "contacts"
  | "custom";

const KEY_TO_TYPE: Record<string, BlockType> = {
  hero: "hero",
  info_boxes: "info_boxes",
  promo_row_1: "promo",
  promo_row_2: "promo",
  categories: "categories",
  products_hb: "products",
  products_pvc: "products",
  novelties: "novelties",
  branding: "branding",
  advantages: "advantages",
  seo: "about",
  about: "about",
  steps: "steps",
  reviews: "reviews",
  contacts: "contacts",
};

export function blockTypeOf(section: HomepageSection): BlockType {
  const fromConfig = section.config?.block_type;
  if (typeof fromConfig === "string" && fromConfig in KEY_TO_TYPE) {
    return fromConfig as BlockType;
  }
  if (typeof fromConfig === "string") return fromConfig as BlockType;
  return KEY_TO_TYPE[section.section_key] || "custom";
}

export function sectionDescription(section: HomepageSection): string {
  if (section.description) return section.description;
  const d = section.config?.description;
  return typeof d === "string" ? d : "";
}

export function sectionImage(section: HomepageSection): string {
  if (section.image_path) return section.image_path;
  const img = section.config?.image || section.config?.image_path;
  return typeof img === "string" ? img : "";
}

export function sectionButtonLabel(section: HomepageSection): string {
  if (section.button_label) return section.button_label;
  const v =
    section.config?.button_label ||
    section.config?.cta_label ||
    section.config?.ctaLabel;
  return typeof v === "string" ? v : "";
}

export function sectionButtonUrl(section: HomepageSection): string {
  if (section.button_url) return section.button_url;
  const v =
    section.config?.button_url ||
    section.config?.cta_url ||
    section.config?.ctaUrl;
  return typeof v === "string" ? v : "";
}

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  hero: "Верхняя часть (Hero)",
  info_boxes: "Информационные блоки",
  promo: "Промо / категории (баннеры)",
  categories: "Категории",
  products: "Товары",
  novelties: "Новинки",
  branding: "Брендирование",
  advantages: "Преимущества",
  about: "О компании",
  steps: "Этапы заказа",
  reviews: "Отзывы",
  contacts: "Контакты",
  custom: "Произвольный",
};
