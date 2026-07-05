'use client';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

export default function StoreAnalytics({ shop }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const cfg = shop?.trackingConfig || {};
  const gaId = cfg.ga4Id;
  const clarityId = cfg.clarityId;
  const metaPixelId = cfg.metaPixelEnabled !== false && cfg.metaPixelId;
  const tiktokPixelId = cfg.tiktokPixelEnabled !== false && cfg.tiktokPixelId;
  const googleAdsId = cfg.googleAdsEnabled !== false && cfg.googleAdsId;
  const pinterestPixelId = cfg.pinterestPixelEnabled !== false && cfg.pinterestPixelId;
  const snapchatPixelId = cfg.snapchatPixelEnabled !== false && cfg.snapchatPixelId;
  const linkedinPartnerId = cfg.linkedinEnabled !== false && cfg.linkedinPartnerId;

  // Track page views dynamically across GA4 and other tools
  useEffect(() => {
    const url = pathname + searchParams.toString();

    if (gaId && typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', gaId, { page_path: url });
    }
    if (metaPixelId && typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
    if (tiktokPixelId && typeof window !== 'undefined' && window.ttq) {
      window.ttq.page();
    }
    if (pinterestPixelId && typeof window !== 'undefined' && window.pintrk) {
      window.pintrk('track', 'pagevisit');
    }
    if (snapchatPixelId && typeof window !== 'undefined' && window.snaptr) {
      window.snaptr('track', 'PAGE_VIEW');
    }
  }, [pathname, searchParams, gaId, metaPixelId, tiktokPixelId, pinterestPixelId, snapchatPixelId]);

  return (
    <>
      {/* Microsoft Clarity */}
      {clarityId && (
        <Script id="store-microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      )}

      {/* Google Analytics 4 */}
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="store-google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel */}
      {metaPixelId && (
        <Script id="store-meta-pixel" strategy="afterInteractive">
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

      {/* TikTok Pixel */}
      {tiktokPixelId && (
        <Script id="store-tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var e=0;e<ttq.methods.length;e++)ttq.setAndDefer(ttq,ttq.methods[e]);
              ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${tiktokPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* Google Ads conversion tag */}
      {googleAdsId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`} strategy="afterInteractive" />
          <Script id="store-google-ads" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAdsId}');
            `}
          </Script>
        </>
      )}

      {/* Pinterest Pixel */}
      {pinterestPixelId && (
        <Script id="store-pinterest-pixel" strategy="afterInteractive">
          {`
            !function(e,n,t,r,a,s,p){if(!e[a]){e[a]=function(){e[a].queue.push(arguments)},e[a].queue=[],s=n.createElement(t),s.async=!0,s.src=r;var i=n.getElementsByTagName(t)[0];i.parentNode.insertBefore(s,i)}}(window,document,"script","https://assets.pinterest.com/js/pintrk.js","pintrk");
            pintrk('load', '${pinterestPixelId}');
            pintrk('page');
          `}
        </Script>
      )}

      {/* Snapchat Pixel */}
      {snapchatPixelId && (
        <Script id="store-snapchat-pixel" strategy="afterInteractive">
          {`
            (function(e,t,n){if(e.snaptr)return;var r=e.snaptr=function(){r.handleRequest?r.handleRequest.apply(r,arguments):r.queue.push(arguments)};r.queue=[];var a=t.createElement(n);a.async=!0;a.src="https://sc-static.net/scevent.min.js";var s=t.getElementsByTagName(n)[0];s.parentNode.insertBefore(a,s)})(window,document,"script");
            snaptr('init', '${snapchatPixelId}');
            snaptr('track', 'PAGE_VIEW');
          `}
        </Script>
      )}

      {/* LinkedIn Partner Tag */}
      {linkedinPartnerId && (
        <Script id="store-linkedin-partner" strategy="afterInteractive">
          {`
            _linkedin_partner_id = "${linkedinPartnerId}";
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            (function(l) {
            if (!l) return;
            var s = document.getElementsByTagName("script")[0];
            var b = document.createElement("script");
            b.type = "text/javascript";b.async = true;
            b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
            s.parentNode.insertBefore(b, s);
            })(window.lintrk);
          `}
        </Script>
      )}
    </>
  );
}

// Helper to track custom events across all enabled trackers
export const trackStoreEvent = (eventName, eventParams = {}) => {
  if (typeof window === 'undefined') return;

  // 1. Google Analytics
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }

  // 2. Meta Pixel
  if (window.fbq) {
    const metaEventMap = {
      'page_view': 'PageView',
      'view_item': 'ViewContent',
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'Purchase',
      'search': 'Search'
    };
    const metaEventName = metaEventMap[eventName] || eventName;
    window.fbq('track', metaEventName, eventParams);
  }

  // 3. TikTok Pixel
  if (window.ttq) {
    const tiktokEventMap = {
      'page_view': 'PageView',
      'view_item': 'ViewContent',
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'CompletePayment',
      'search': 'Search'
    };
    const ttEventName = tiktokEventMap[eventName] || eventName;
    window.ttq.track(ttEventName, eventParams);
  }

  // 4. Pinterest Pixel
  if (window.pintrk) {
    const pinEventMap = {
      'page_view': 'pagevisit',
      'view_item': 'viewcategory',
      'add_to_cart': 'addtocart',
      'begin_checkout': 'checkout',
      'purchase': 'signup',
      'search': 'search'
    };
    const pinEventName = pinEventMap[eventName] || eventName;
    window.pintrk('track', pinEventName, eventParams);
  }

  // 5. Snapchat Pixel
  if (window.snaptr) {
    const snapEventMap = {
      'page_view': 'PAGE_VIEW',
      'view_item': 'VIEW_CONTENT',
      'add_to_cart': 'ADD_CART',
      'begin_checkout': 'START_CHECKOUT',
      'purchase': 'PURCHASE',
      'search': 'SEARCH'
    };
    const snapEventName = snapEventMap[eventName] || eventName;
    window.snaptr('track', snapEventName, eventParams);
  }
};

