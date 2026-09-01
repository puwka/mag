import {
  getCities,
  getSettings,
  getStorefrontMenus,
  settingArray,
  settingString,
} from "@/lib/data";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { getSiteUrl } from "@/lib/site";
import { mediaUrl } from "@/lib/media";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [settings, cities, menus] = await Promise.all([
    getSettings(),
    getCities(),
    getStorefrontMenus(),
  ]);
  const {
    megaMenu,
    quickLinks,
    mobileMenu,
    footerInfo,
    footerCatalog,
    footerGloves,
  } = menus;

  const siteUrl = getSiteUrl(settings);
  const brand = settingString(settings, "brand.name", "ХБтекс");
  const logo =
    mediaUrl(settingString(settings, "brand.logo"), "site") ||
    settingString(settings, "brand.logo");
  const phone = settingArray(settings, "contacts.phones")[0] || "";
  const email = settingString(settings, "contacts.email");
  const address = settingString(settings, "company.address");
  const cityMatch = address.match(/^(?:г\.\s*)?([^,]+)/);
  const city = cityMatch?.[1]?.trim() || "Орск";

  const orgLd = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    name: brand,
    legalName: settingString(settings, "company.name"),
    url: siteUrl,
    logo: logo || undefined,
    email: email || undefined,
    telephone: phone || undefined,
    address: address
      ? {
          "@type": "PostalAddress",
          streetAddress: address,
          addressLocality: city,
          addressCountry: "RU",
        }
      : undefined,
    openingHours: settingString(settings, "contacts.hours") || undefined,
  };

  return (
    <div className="website-wrapper">
      <Analytics settings={settings} />
      <JsonLd data={orgLd} />
      <Header
        logo={settingString(settings, "brand.logo")}
        logoMobile={settingString(settings, "brand.logo_mobile")}
        brandAlt={brand}
        phones={settingArray(settings, "contacts.phones")}
        phonesDisplay={settingArray(settings, "contacts.phones_display")}
        phonesTel={settingArray(settings, "contacts.phones_tel")}
        email={email}
        hours={settingString(settings, "contacts.hours")}
        noCallText={settingString(settings, "contacts.no_call_text")}
        noCallLabel={settingString(settings, "ui.no_call_label", "Не дозвонились?")}
        whatsapp={settingString(settings, "contacts.whatsapp")}
        whatsappMessage={settingString(
          settings,
          "ui.whatsapp_message",
          "Добрый день, ХБтекс! Не смог дозвониться, прошу связаться со мной."
        )}
        whatsappSendLabel={settingString(
          settings,
          "ui.whatsapp_send_label",
          "Отправить сообщение"
        )}
        searchLabel={settingString(settings, "ui.search_label", "Поиск")}
        citySelectLabel={settingString(settings, "ui.city_select_label", "Выберите город")}
        cities={cities}
        megaMenu={megaMenu}
        quickLinks={quickLinks}
        mobileMenu={mobileMenu}
      />
      <main className="site-main">{children}</main>
      <Footer
        settings={settings}
        footerInfo={footerInfo}
        footerCatalog={footerCatalog}
        footerGloves={footerGloves}
      />
      <CookieBanner
        text={settingString(
          settings,
          "cookie.text",
          "Мы используем cookie, Яндекс.Метрику и reCAPTCHA для работы сайта."
        )}
        moreLabel={settingString(settings, "cookie.more_label", "Подробнее")}
        moreUrl={settingString(settings, "cookie.more_url", "/privacy-policy/")}
        acceptLabel={settingString(settings, "cookie.accept_label", "Согласен")}
      />
    </div>
  );
}
