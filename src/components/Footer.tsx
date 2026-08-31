import Link from "next/link";
import type { MenuItem } from "@/lib/types";
import { settingString, settingArray } from "@/lib/data";
import { menuHref } from "@/lib/links";

type Props = {
  settings: Record<string, unknown>;
  footerInfo: MenuItem[];
  footerCatalog: MenuItem[];
  footerGloves: MenuItem[];
};

export function Footer({ settings, footerInfo, footerCatalog, footerGloves }: Props) {
  const address = settingString(settings, "company.address");
  const blurb = settingString(settings, "company.footer_blurb");
  const sales = settingArray(settings, "contacts.sales_phones");
  const company = settingString(settings, "company.name");
  const inn = settingString(settings, "company.inn");
  const copyright = settingString(settings, "legal.copyright");
  const disclaimer = settingString(settings, "legal.disclaimer");
  const vk = settingString(settings, "social.vk");
  const yt = settingString(settings, "social.youtube");
  const orgId = settingString(settings, "maps.yandex_org_id");
  const colLocation = settingString(settings, "footer.col_location", "Мы находимся");
  const colInfo = settingString(settings, "footer.col_info", "Информация");
  const colCatalog = settingString(settings, "footer.col_catalog", "Каталог");
  const colGloves = settingString(settings, "footer.col_gloves", "Перчатки");
  const privacyLabel = settingString(
    settings,
    "footer.privacy_label",
    "Политика обработки персональных данных"
  );
  const privacyUrl = settingString(settings, "footer.privacy_url", "/privacy-policy/");
  const innLabel = settingString(settings, "footer.inn_label", "ИНН");
  const ytLabel = settingString(settings, "social.youtube_label", "YouTube");
  const vkLabel = settingString(settings, "social.vk_label", "VK");

  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <h4>{colLocation}</h4>
          {blurb ? <p>{blurb}</p> : null}
          {address ? <p>{address}</p> : null}
          {sales.map((p) => (
            <p key={p}>
              <a href={`tel:${p.replace(/[^\d+]/g, "")}`}>{p}</a>
            </p>
          ))}
          {orgId ? (
            <iframe
              title="rating"
              src={`https://yandex.ru/sprav/widget/rating-badge/${orgId}?type=rating`}
              style={{ border: 0, width: 150, height: 50, marginTop: 12 }}
            />
          ) : null}
        </div>
        <div>
          <h4>{colInfo}</h4>
          <ul>
            {footerInfo.map((i) => {
              const href = menuHref(i.url);
              return (
                <li key={i.id}>
                  {href ? <Link href={href}>{i.title}</Link> : <span>{i.title}</span>}
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h4>{colCatalog}</h4>
          <ul>
            {footerCatalog.map((i) => {
              const href = menuHref(i.url);
              return (
                <li key={i.id}>
                  {href ? <Link href={href}>{i.title}</Link> : <span>{i.title}</span>}
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h4>{colGloves}</h4>
          <ul>
            {footerGloves.map((i) => {
              const href = menuHref(i.url);
              return (
                <li key={i.id}>
                  {href ? <Link href={href}>{i.title}</Link> : <span>{i.title}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="site-footer__bar">
        <div className="container site-footer__bar-inner">
          <div>
            {copyright ? <p>{copyright}</p> : null}
            {privacyLabel ? (
              <p>
                <Link href={privacyUrl}>{privacyLabel}</Link>
              </p>
            ) : null}
            {company || inn ? (
              <p>
                {company} {innLabel} {inn}
              </p>
            ) : null}
          </div>
          <div className="site-footer__social">
            {yt ? (
              <a href={yt} target="_blank" rel="noopener noreferrer">
                {ytLabel}
              </a>
            ) : null}
            {vk ? (
              <a href={vk} target="_blank" rel="noopener noreferrer">
                {vkLabel}
              </a>
            ) : null}
          </div>
        </div>
        <div className="container">
          {disclaimer ? <p className="site-footer__disclaimer">{disclaimer}</p> : null}
        </div>
      </div>
    </footer>
  );
}
