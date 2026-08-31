import {
  getSettings,
  settingArray,
  settingString,
  getPageBySlug,
} from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

export async function getProductSiteContext() {
  const settings = await getSettings();
  const phones = settingArray(settings, "contacts.phones");
  const tels = settingArray(settings, "contacts.phones_tel");
  const deliveryPage = await getPageBySlug("dostavka");
  return {
    siteUrl: getSiteUrl(settings),
    brand: settingString(settings, "brand.name", "Витекс"),
    phoneDisplay: phones[0] || "",
    phoneTel: tels[0] || phones[0]?.replace(/[^\d+]/g, "") || "",
    deliveryHtml:
      deliveryPage?.content_html ||
      settingString(
        settings,
        "product.delivery_html",
        "<p>Доставка транспортными компаниями по РФ. Подробнее — на странице <a href=\"/dostavka/\">Доставка</a>.</p>"
      ),
  };
}
