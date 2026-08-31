import { settingString } from "@/lib/data";

/** Inject Yandex Metrika / GA when IDs present in CMS settings. */
export function Analytics({ settings }: { settings: Record<string, unknown> }) {
  const ym = settingString(settings, "analytics.ym_id");
  const ga = settingString(settings, "analytics.ga_id");

  return (
    <>
      {ym ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(${JSON.stringify(ym)}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true });
`,
          }}
        />
      ) : null}
      {ga ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(ga)});
`,
            }}
          />
        </>
      ) : null}
    </>
  );
}
