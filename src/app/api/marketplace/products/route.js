import { NextResponse } from 'next/server';
import { getAllMarketplaceProductsServer, getAllShopsServer, getGlobalConfigServer } from '@/lib/server-fetch';

// ⚡ 24-hour Edge Cache (Zero redundant database reads on repeat visits)
export const dynamic = 'force-dynamic';
export const revalidate = 2592000;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeShops = searchParams.get('includeShops') === 'true';

    const [allProducts, allShops, globalConfig] = await Promise.all([
      getAllMarketplaceProductsServer(),
      includeShops ? getAllShopsServer() : Promise.resolve(null),
      getGlobalConfigServer()
    ]);

    const isCurationActive = globalConfig?.showcaseCuration?.enabled === true;
    const allowedShopsList = Array.isArray(globalConfig?.showcaseCuration?.allowedShops) ? globalConfig.showcaseCuration.allowedShops : [];
    const allowedCategoriesList = Array.isArray(globalConfig?.showcaseCuration?.allowedCategories) ? globalConfig.showcaseCuration.allowedCategories : [];
    const allowedSubcategoriesList = Array.isArray(globalConfig?.showcaseCuration?.allowedSubcategories) ? globalConfig.showcaseCuration.allowedSubcategories : [];

    let filteredShops = [];
    let filteredProducts = [];

    if (isCurationActive && allowedShopsList.length > 0) {
      if (allShops) {
        filteredShops = allShops.filter(s => {
          if (s.isActive === false || s.showOnMainSite === false) return false;
          return allowedShopsList.includes(s.id) || allowedShopsList.includes(s.shopSlug) || allowedShopsList.includes(s.shopName);
        });
      }

      filteredProducts = (allProducts || []).filter(p => {
        if (p.showOnMainSite === false) return false;
        const matchesShop = allowedShopsList.includes(p.shopId) || allowedShopsList.includes(p.shopSlug) || allowedShopsList.includes(p.shopName);
        if (!matchesShop) return false;

        if (allowedCategoriesList.length > 0 && !allowedCategoriesList.includes(p.category)) {
          return false;
        }
        if (allowedSubcategoriesList.length > 0 && p.subcategory && !allowedSubcategoriesList.includes(p.subcategory)) {
          return false;
        }
        return true;
      });
    }

    const res = NextResponse.json({
      success: true,
      count: filteredProducts.length,
      products: filteredProducts,
      ...(includeShops ? { shops: filteredShops } : {})
    });

    // ⚡ Edge & Browser Cache Headers (24 hour edge cache, 24 hour SWR)
    res.headers.set('Cache-Control', 'public, s-maxage=2592000, stale-while-revalidate = 2592000');
    return res;
  } catch (error) {
    console.error('[API Marketplace Products] Error:', error);
    return NextResponse.json({ 
      success: false, 
      products: [], 
      error: error.message 
    }, { status: 500 });
  }
}
