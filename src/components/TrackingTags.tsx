const gtmValue = process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "";
const metaValue = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
const gtmId = /^GTM-[A-Z0-9]+$/.test(gtmValue) ? gtmValue : "";
const metaId = /^\d+$/.test(metaValue) ? metaValue : "";

/** Shared head bootstrap. Start once, after the visitor accepts tracking. */
export function TrackingHead() {
  if (!gtmId && !metaId) return null;
  const code = String.raw`
    (function () {
      var started = false;
      function startTracking() {
        if (started || /^\/(admin|staff-dashboard|portal)(\/|$)/.test(location.pathname)) return;
        if (!document.cookie.split('; ').some(function (cookie) { return cookie === 'sweet1ne_cookie_consent=accepted'; })) return;
        started = true;
        ${gtmId ? `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer',${JSON.stringify(gtmId)});` : ""}
        ${metaId ? `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
        s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
        (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', ${JSON.stringify(metaId)});
        fbq('track', 'PageView');` : ""}
      }
      window.addEventListener('sweet1ne:tracking-consent', startTracking);
      startTracking();
    })();
  `;
  return <script id="advertising-tags" dangerouslySetInnerHTML={{ __html: code }} />;
}

/** No-JavaScript fallbacks respect the visitor's saved consent. */
export function TrackingNoScript({ accepted }: { accepted: boolean }) {
  if (!accepted) return null;
  return (
    <>
      {gtmId && <noscript><iframe title="Google Tag Manager" src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} /></noscript>}
      {metaId && <noscript>{/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" height="1" width="1" style={{ display: "none" }} src={`https://www.facebook.com/tr?id=${metaId}&ev=PageView&noscript=1`} />
      </noscript>}
    </>
  );
}
