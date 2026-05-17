'use client';

/**
 * TemplateRenderer - SSR-safe dynamic template renderer
 * Renders the correct template based on shop's templateId setting
 */

import { Suspense, memo, lazy, useCallback } from 'react';
import { getTemplateById } from './index';

// ── Default fallback skeleton ──────────────────────────────────
function TemplateSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="h-16 bg-slate-200" />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Error boundary wrapper (function component pattern) ─────────
function TemplateErrorFallback({ error, templateId }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-black text-slate-800 mb-2">টেমপ্লেট লোড হয়নি</h2>
        <p className="text-sm text-slate-500 mb-4">Template: {templateId}</p>
        <p className="text-xs text-red-400">{error?.message || 'Unknown error'}</p>
      </div>
    </div>
  );
}

/**
 * Main TemplateRenderer component
 * Props:
 * - shop: shop data from Firestore
 * - products: product list
 * - categories: category list
 * - templateId: which template to render
 * - customization: color/font overrides from retailer
 * - children: any additional content
 */
function TemplateRenderer({
  shop,
  products = [],
  categories = [],
  templateId,
  customization = {},
  ShopClientComponent, // Pass the actual ShopClient component (avoids circular imports)
}) {
  const resolvedTemplateId = templateId || shop?.templateId || 'modern-commerce';
  const template = getTemplateById(resolvedTemplateId);

  // Merge template defaults with retailer customizations
  const mergedTheme = {
    ...template.defaultTheme,
    ...(shop?.themeOverrides || {}),
    ...customization,
  };

  // Build CSS variables for the template
  const cssVars = {
    '--template-primary': mergedTheme.primaryColor,
    '--template-secondary': mergedTheme.secondaryColor,
    '--template-accent': mergedTheme.accentColor,
    '--template-bg': mergedTheme.bgColor,
    '--template-text': mergedTheme.textColor,
    '--template-header-bg': mergedTheme.headerBg,
    '--template-header-text': mergedTheme.headerText,
    '--template-card-bg': mergedTheme.cardBg,
    '--template-card-border': mergedTheme.cardBorder,
    '--template-radius-btn': mergedTheme.buttonRadius,
    '--template-radius-card': mergedTheme.cardRadius,
    '--template-font': mergedTheme.fontFamily,
  };

  if (!ShopClientComponent) {
    return <TemplateSkeleton />;
  }

  return (
    <div
      data-template={resolvedTemplateId}
      style={cssVars}
    >
      <Suspense fallback={<TemplateSkeleton />}>
        <ShopClientComponent
          shop={shop}
          products={products}
          categories={categories}
          template={template}
          theme={mergedTheme}
        />
      </Suspense>
    </div>
  );
}

export default memo(TemplateRenderer);
export { TemplateSkeleton, TemplateErrorFallback };
