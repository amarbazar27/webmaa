'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { subscribeGlobalConfig } from '@/lib/firestore';

function PlatformAnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const unsub = subscribeGlobalConfig((cfg) => {
      if (cfg) setConfig(cfg);
    });
    return () => unsub?.();
  }, []);

  const tracking = config?.trackingConfig || {};
  const metaPixelId = tracking.metaPixelEnabled !== false && tracking.metaPixelId;
  const ga4Id = tracking.ga4Enabled !== false && tracking.ga4Id;
  const gtmId = tracking.gtmEnabled !== false && tracking.gtmId;
  const tiktokPixelId = tracking.tiktokPixelEnabled !== false && tracking.tiktokPixelId;
  const clarityId = tracking.clarityEnabled !== false && tracking.clarityId;

  // Real-time PageView dispatch
  useEffect(() => {
    const query = searchParams ? searchParams.toString() : '';
    const fullUrl = pathname + (query ? `?${query}` : '');

    if (ga4Id && typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', ga4Id, { page_path: fullUrl });
    }
    if (metaPixelId && typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
    if (tiktokPixelId && typeof window !== 'undefined' && window.ttq) {
      window.ttq.page();
    }
  }, [pathname, searchParams, ga4Id, metaPixelId, tiktokPixelId]);

  return (
    <>
      {/* ── Microsoft Clarity ── */}
      {clarityId && (
        <Script id="platform-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      )}

      {/* ── Google Tag Manager ── */}
      {gtmId && (
        <Script id="platform-gtm" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});const f=d.getElementsByTagName(s)[0];
            const j=d.createElement(s);const dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}
        </Script>
      )}

      {/* ── Google Analytics 4 (gtag.js) ── */}
      {ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="platform-ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* ── Meta (Facebook) Pixel ── */}
      {metaPixelId && (
        <Script id="platform-meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* ── TikTok Pixel ── */}
      {tiktokPixelId && (
        <Script id="platform-tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;const ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(let i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(let e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){const i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};const o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;const a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${tiktokPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}
    </>
  );
}

export default function PlatformAnalytics() {
  return (
    <Suspense fallback={null}>
      <PlatformAnalyticsInner />
    </Suspense>
  );
}
