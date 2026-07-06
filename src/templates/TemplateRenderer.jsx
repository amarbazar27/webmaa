'use client';

/**
 * TemplateRenderer v3 — SSR-safe dynamic template renderer
 * Uses StyleEngine + ContrastEngine for full visual identity injection.
 * Renders the correct storefront style based on shop's templateId setting.
 */

import { Suspense, memo, useRef } from 'react';
import { getTemplateById } from './index';
import { buildStyleEngineOutput } from '@/lib/styleEngine';

// ── Loading skeleton ───────────────────────────────────────────────────────
function TemplateSkeleton({ isDark = false }) {
  return (
    <div
      className="min-h-screen animate-pulse"
      style={{ background: isDark ? '#0A0A0A' : '#F8FAFC' }}
    >
      <div
        className="h-16"
        style={{ background: isDark ? '#111111' : '#E2E8F0' }}
      />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <div
          className="h-64 rounded-2xl"
          style={{ background: isDark ? '#1A1A1A' : '#E2E8F0' }}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div
              key={i}
              className="h-48 rounded-xl"
              style={{ background: isDark ? '#1A1A1A' : '#E2E8F0' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Error fallback ─────────────────────────────────────────────────────────
export function TemplateErrorFallback({ error, templateId }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8 max-w-sm">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-black text-slate-800 mb-2">টেমপ্লেট লোড হয়নি</h2>
        <p className="text-sm text-slate-500 mb-4 font-mono">{templateId}</p>
        {error?.message && (
          <p className="text-xs text-red-400 bg-red-50 p-3 rounded-xl font-mono break-all">
            {error.message}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Main TemplateRenderer
 * Props:
 *  - shop: Firestore shop document
 *  - products: product array
 *  - categories: category array
 *  - templateId: which template to render
 *  - customization: retailer overrides
 *  - ShopClientComponent: the actual ShopClient (avoids circular imports)
 */
function TemplateRenderer({
  shop,
  products = [],
  categories = [],
  templateId,
  customization = {},
  ShopClientComponent,
  globalConfig = {},
  ...rest
}) {
  const wrapperRef = useRef(null);
  const resolvedId = templateId || shop?.templateId || 'bold-commerce';
  const template = getTemplateById(resolvedId);

  // Merge: template defaults → Firestore themeOverrides → retailer customization
  const mergedTheme = {
    ...template.defaultTheme,
    ...(shop?.themeOverrides || {}),
    ...customization,
  };

  // Build style engine output (CSS vars + data attrs)
  const { style, dataAttrs, isDark } = buildStyleEngineOutput(template, mergedTheme);

  if (!ShopClientComponent) {
    return <TemplateSkeleton isDark={isDark} />;
  }

  return (
    <div
      ref={wrapperRef}
      id="sf-root"
      style={style}
      {...dataAttrs}
      suppressHydrationWarning
    >
      <Suspense fallback={<TemplateSkeleton isDark={isDark} />}>
        <ShopClientComponent
          initialShop={shop}
          initialProducts={products}
          initialCategories={categories}
          shop={shop}
          products={products}
          categories={categories}
          template={template}
          theme={mergedTheme}
          isDark={isDark}
          globalConfig={globalConfig}
          {...rest}
        />
      </Suspense>
    </div>
  );
}

export default memo(TemplateRenderer);
export { TemplateSkeleton };
