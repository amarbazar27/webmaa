import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

function isShopOwner(shopData, uid) {
  return (
    shopData.ownerId === uid ||
    shopData.ownerUid === uid ||
    shopData.createdBy === uid ||
    shopData.userId === uid
  );
}

// Clean HTML to essential content
function extractPageText(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10000);
}

// Extract OpenGraph tags
function extractOgMeta(html) {
  const getTag = (prop) => {
    const match = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
                  html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i')) ||
                  html.match(new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
    return match ? match[1] : null;
  };

  return {
    title: getTag('og:title') || getTag('title'),
    image: getTag('og:image'),
    description: getTag('og:description') || getTag('description'),
    price: getTag('product:price:amount') || getTag('price'),
  };
}

// Strategy 0: Suglow REA Direct JSON Engine
async function fetchSuglowProducts(origin) {
  if (!origin.includes('suglow.com')) return [];
  try {
    const sitemapImageMap = new Map();
    try {
      const smRes = await fetch('https://suglow.com/sitemap.xml', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(6000)
      });
      if (smRes.ok) {
        const smText = await smRes.text();
        const smBlocks = smText.match(/<url>[\s\S]*?<\/url>/g) || [];
        for (const b of smBlocks) {
          const loc = b.match(/<loc>([^<]+)<\/loc>/)?.[1];
          const img = b.match(/<image:loc>([^<]+)<\/image:loc>/)?.[1];
          if (loc && img) {
            sitemapImageMap.set(loc.replace('https://suglow.com/product/', '').trim(), img);
          }
        }
      }
    } catch (_) {}

    const res = await fetch('https://suglow.com/api/frontend/product', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'x-api-key': 'i7a05ls4-r0i2-22h9-7161-f046d16528q495522',
      },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) return [];

    return json.data.map(p => {
      const price = parseFloat(p.flat_price || p.convert_price || 0);
      let img = p.cover;
      if (!img || img.includes('default/product/cover')) {
        img = sitemapImageMap.get(p.slug) || 'https://suglow.com/images/required/og-suglow.jpg';
      }

      let cat = 'Skin Care';
      const lower = (p.name || '').toLowerCase();
      if (lower.includes('shampoo') || lower.includes('hair') || lower.includes('conditioner')) cat = 'Hair Care';
      else if (lower.includes('lotion') || lower.includes('body milk') || lower.includes('body wash')) cat = 'Body Care';
      else if (lower.includes('baby') || lower.includes('diaper')) cat = 'Baby Care';
      else if (lower.includes('lipstick') || lower.includes('powder') || lower.includes('makeup') || lower.includes('primer')) cat = 'Cosmetics';

      const BEAUTY_FALLBACKS = {
        'Skin Care': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80',
        'Hair Care': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
        'Body Care': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
        'Baby Care': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80',
        'Cosmetics': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
      };

      if (!img || img.includes('default/product/cover') || img.includes('og-suglow')) {
        img = sitemapImageMap.get(p.slug) || BEAUTY_FALLBACKS[cat] || BEAUTY_FALLBACKS['Skin Care'];
      }

      return {
        name: (p.name || '').trim(),
        price,
        costPrice: Math.round(price * 0.7),
        stock: parseInt(p.stock, 10) || 40,
        category: cat,
        description: `${p.name}. Authentic imported cosmetic item from Suglow. Original packaging with guaranteed quality.`,
        imageUrl: img,
      };
    }).filter(p => p.name && p.price > 0);
  } catch (_) {
    return [];
  }
}

// Strategy 1: Shopify Direct Catalog Engine
async function fetchShopifyProducts(origin) {
  try {
    const allProducts = [];
    const maxPages = 20; // 20 * 250 = up to 5,000 products

    for (let page = 1; page <= maxPages; page++) {
      const res = await fetch(`${origin}/products.json?limit=250&page=${page}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) break;
      const data = await res.json();
      if (!data.products || !Array.isArray(data.products) || data.products.length === 0) break;

      for (const p of data.products) {
        const price = parseFloat(p.variants?.[0]?.price) || 0;
        const cleanDesc = (p.body_html || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 600) || p.title;

        if (p.title && price > 0) {
          allProducts.push({
            name: p.title.trim(),
            price,
            costPrice: Math.round(price * 0.7),
            stock: p.variants?.[0]?.inventory_quantity > 0 ? p.variants[0].inventory_quantity : 40,
            category: p.product_type || (p.tags?.[0] ? p.tags[0].split(',')[0].trim() : 'সাধারণ'),
            description: cleanDesc,
            imageUrl: p.images?.[0]?.src || '',
          });
        }
      }

      // If page returned fewer than 250, we reached the end
      if (data.products.length < 250) break;
    }

    return allProducts;
  } catch (_) {
    return [];
  }
}

// Strategy 2: WooCommerce Store API
async function fetchWooCommerceProducts(origin) {
  try {
    const res = await fetch(`${origin}/wp-json/wc/store/v1/products?per_page=25`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map(p => {
      const rawPrice = p.prices?.price || p.price || 0;
      const divisor = p.prices?.currency_minor_unit ? Math.pow(10, p.prices.currency_minor_unit) : 1;
      const price = parseFloat(rawPrice) / divisor;
      const cleanDesc = (p.description || p.short_description || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 600) || p.name;

      return {
        name: (p.name || '').trim(),
        price,
        costPrice: Math.round(price * 0.7),
        stock: 40,
        category: p.categories?.[0]?.name || 'সাধারণ',
        description: cleanDesc,
        imageUrl: p.images?.[0]?.src || '',
      };
    }).filter(p => p.name && p.price > 0);
  } catch (_) {
    return [];
  }
}

// Strategy 3: Product Sitemap Crawler (For sites like Suglow, Camerakini, Next.js, custom stores)
async function fetchSitemapProducts(origin) {
  try {
    for (const smPath of ['/sitemap.xml', '/product-sitemap.xml', '/sitemap_products_1.xml', '/sitemap_index.xml']) {
      const smRes = await fetch(`${origin}${smPath}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(6000)
      });
      if (!smRes.ok) continue;

      const smText = await smRes.text();

      // Check if this is a sitemap index with child sitemaps
      const subSitemaps = [...smText.matchAll(/<loc>([^<]*(?:product|item)[^<]*\.xml)<\/loc>/gi)].map(m => m[1]);
      let activeText = smText;
      if (subSitemaps.length > 0) {
        try {
          const subRes = await fetch(subSitemaps[0], {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(6000)
          });
          if (subRes.ok) activeText = await subRes.text();
        } catch (_) {}
      }

      // Extract all <url> blocks to pair loc with image:loc
      const urlBlocks = activeText.match(/<url>[\s\S]*?<\/url>/gi) || [];
      const productEntries = [];

      for (const block of urlBlocks) {
        const loc = block.match(/<loc>([^<]+)<\/loc>/i)?.[1]?.trim();
        if (!loc) continue;

        // Filter out listing/utility pages
        const isProductUrl = /(?:\/product\/|\/products\/|\/item\/|\/p\/)/i.test(loc) &&
          !loc.endsWith('/product') && !loc.endsWith('/products') && !loc.includes('?') && !loc.includes('/category/');

        if (isProductUrl) {
          const imageLoc = block.match(/<image:loc>([^<]+)<\/image:loc>/i)?.[1]?.trim() || '';
          productEntries.push({ url: loc, sitemapImage: imageLoc });
        }
      }

      if (productEntries.length === 0) {
        // Fallback to simple loc matching if <url> blocks were not well formed
        const locMatches = [...activeText.matchAll(/<loc>([^<]*(?:product|item|p)\/[^<]+)<\/loc>/gi)].map(m => m[1]);
        if (locMatches.length > 0) {
          locMatches.forEach(l => productEntries.push({ url: l.trim(), sitemapImage: '' }));
        }
      }

      if (productEntries.length === 0) continue;

      // Extract up to 300 product pages using a controlled concurrency pool
      const targetEntries = productEntries.slice(0, 300);
      const results = [];
      const CONCURRENCY = 8;
      let currentIndex = 0;

      const worker = async () => {
        while (currentIndex < targetEntries.length) {
          const entryIdx = currentIndex++;
          const entry = targetEntries[entryIdx];
          try {
            const pRes = await fetch(entry.url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36' },
              signal: AbortSignal.timeout(7500)
            });
            if (!pRes.ok) continue;
            const pHtml = await pRes.text();

            // 1. JSON-LD check
            let extracted = false;
            const jsonLdMatch = pHtml.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
            if (jsonLdMatch) {
              for (const block of jsonLdMatch) {
                try {
                  const cleaned = block.replace(/<\/?script[^>]*>/gi, '');
                  const parsed = JSON.parse(cleaned);
                  const prodObj = parsed['@type'] === 'Product'
                    ? parsed
                    : (Array.isArray(parsed['@graph']) ? parsed['@graph'].find(g => g['@type'] === 'Product') : null);

                  if (prodObj && prodObj.name) {
                    const rawPrice = prodObj.offers?.price || prodObj.offers?.[0]?.price || prodObj.offers?.priceSpecification?.price;
                    const price = parseFloat(rawPrice) || 0;
                    if (price > 0) {
                      const img = (Array.isArray(prodObj.image) ? prodObj.image[0] : (typeof prodObj.image === 'string' ? prodObj.image : prodObj.image?.url)) || entry.sitemapImage || '';
                      results.push({
                        name: prodObj.name.trim(),
                        price,
                        costPrice: Math.round(price * 0.7),
                        stock: 35,
                        category: prodObj.category || 'সাধারণ',
                        description: (prodObj.description || prodObj.name).slice(0, 500),
                        imageUrl: img
                      });
                      extracted = true;
                      break;
                    }
                  }
                } catch (_) {}
              }
            }

            if (extracted) continue;

            // 2. OpenGraph + Embedded Price
            let title = pHtml.match(/property=["']og:title["']\s+content=["']([^"']*)["']/i)?.[1] ||
                        pHtml.match(/content=["']([^"']*)["']\s+property=["']og:title["']/i)?.[1] ||
                        pHtml.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
            title = title.replace(/\s*(?:—|-|\|)\s*(?:Suglow|Camerakini|OHSOGO|BD Retailers|Official|Store).*$/i, '').trim();

            const image = pHtml.match(/property=["']og:image["']\s+content=["']([^"']*)["']/i)?.[1] ||
                          pHtml.match(/content=["']([^"']*)["']\s+property=["']og:image["']/i)?.[1] ||
                          entry.sitemapImage || '';

            let price = 0;
            const mPrice = pHtml.match(/\\?"price\\?"\s*:\s*(\d+(?:\.\d+)?)/i) ||
                           pHtml.match(/(?:price|regularPrice|amount)[^0-9]{1,10}(\d{2,7})/i) ||
                           pHtml.match(/(?:৳|Tk\.?|BDT)\s*(?:<!-- -->)?\s*([\d,]{2,8})/i);
            if (mPrice) {
              price = parseFloat(mPrice[1].replace(/,/g, ''));
            }

            const desc = pHtml.match(/property=["']og:description["']\s+content=["']([^"']*)["']/i)?.[1] || title;

            if (title && price > 0) {
              results.push({
                name: title,
                price,
                costPrice: Math.round(price * 0.7),
                stock: 35,
                category: 'সাধারণ',
                description: desc.slice(0, 500),
                imageUrl: image
              });
            } else if (title && entry.sitemapImage) {
              // Graceful product rescue from sitemap
              results.push({
                name: title,
                price: 450,
                costPrice: 315,
                stock: 35,
                category: 'সাধারণ',
                description: desc.slice(0, 500),
                imageUrl: entry.sitemapImage
              });
            }
          } catch (_) {}
        }
      };

      const workers = Array.from({ length: CONCURRENCY }, () => worker());
      await Promise.all(workers);

      if (results.length > 0) {
        return results;
      }
    }
    return [];
  } catch (_) {
    return [];
  }
}


// Strategy 0B: Category & Subcategory REA Hunter Bot
async function fetchCategoryHunterProducts(url, origin, initialHtml = '') {
  try {
    let html = initialHtml;
    if (!html) {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) return [];
      html = await res.text();
    }

    const parsedUrl = new URL(url);

    // 1. Detect Category Name from title, breadcrumb, or path
    let catName = '';
    const pageTitle = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
    if (pageTitle) {
      const cleanTitle = pageTitle.split(/\||-|—/)[0].trim();
      if (cleanTitle && cleanTitle.length < 50) catName = cleanTitle;
    }
    if (!catName) {
      const slug = parsedUrl.pathname.split('/').filter(Boolean).pop() || '';
      catName = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // 2. Discover Product URLs
    const productUrls = new Set();

    // 2A. Check JSON-LD ItemList
    const jsonLdBlocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const block of jsonLdBlocks) {
      try {
        const clean = block.replace(/<\/?script[^>]*>/gi, '');
        const parsed = JSON.parse(clean);
        const graph = parsed['@graph'] || (Array.isArray(parsed) ? parsed : [parsed]);
        for (const node of graph) {
          if ((node['@type'] === 'ItemList' || node['@type'] === 'CollectionPage') && Array.isArray(node.itemListElement)) {
            for (const item of node.itemListElement) {
              const itemUrl = item.url || item.item?.url;
              if (itemUrl && (itemUrl.includes('/product/') || itemUrl.includes('/item/') || itemUrl.includes('/p/'))) {
                try {
                  productUrls.add(new URL(itemUrl, origin).href);
                } catch (_) {}
              }
            }
          }
        }
      } catch (_) {}
    }

    // 2B. Anchor tags matching product URLs
    const hrefMatches = [...html.matchAll(/href=["']([^"'#?]+(?:\/product\/|\/item\/|\/p\/|\/goods\/)[^"'#?]+)["']/gi)].map(m => m[1]);
    for (const h of hrefMatches) {
      try {
        const fullUrl = new URL(h, origin).href;
        if (!fullUrl.endsWith('/product') && !fullUrl.endsWith('/products') && !fullUrl.includes('/category/')) {
          productUrls.add(fullUrl);
        }
      } catch (_) {}
    }

    // If fewer than 2 product URLs found, return empty so it can fall back to single product
    if (productUrls.size < 2) return [];

    const targetList = [...productUrls].slice(0, 150); // Hunt up to 150 products in this category
    const results = [];
    const CONCURRENCY = 6;
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < targetList.length) {
        const pUrl = targetList[currentIndex++];
        try {
          const pRes = await fetch(pUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(8000)
          });
          if (!pRes.ok) continue;
          const pHtml = await pRes.text();

          // Title
          let title = pHtml.match(/property=["']og:title["']\s+content=["']([^"']*)["']/i)?.[1] ||
                      pHtml.match(/content=["']([^"']*)["']\s+property=["']og:title["']/i)?.[1] ||
                      pHtml.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
          title = title.replace(/\s*(?:—|-|\|)\s*(?:The Mall|Suglow|Camerakini|OHSOGO|BD Retailers|Official|Store).*$/i, '').trim();

          // Image
          let image = pHtml.match(/property=["']og:image["']\s+content=["']([^"']*)["']/i)?.[1] ||
                      pHtml.match(/content=["']([^"']*)["']\s+property=["']og:image["']/i)?.[1] || '';

          // Price
          let price = 0;
          const ogPrice = pHtml.match(/property=["'](?:product:)?price:amount["']\s+content=["']([^"']*)["']/i)?.[1] ||
                          pHtml.match(/content=["']([^"']*)["']\s+property=["'](?:product:)?price:amount["']/i)?.[1];
          if (ogPrice && parseFloat(ogPrice) > 0) {
            price = parseFloat(ogPrice);
          }

          // JSON-LD inspection for product
          const pJsonLd = pHtml.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
          for (const b of pJsonLd) {
            try {
              const pObj = JSON.parse(b.replace(/<\/?script[^>]*>/gi, ''));
              const pNode = pObj['@type'] === 'Product' ? pObj : (pObj['@graph']?.find(g => g['@type'] === 'Product'));
              if (pNode) {
                if (!title && pNode.name) title = pNode.name.trim();
                if (!image && pNode.image) {
                  image = Array.isArray(pNode.image) ? pNode.image[0] : (typeof pNode.image === 'string' ? pNode.image : pNode.image?.url);
                }
                if (!price) {
                  const rawP = pNode.offers?.price || pNode.offers?.[0]?.price;
                  if (rawP && parseFloat(rawP) > 0) price = parseFloat(rawP);
                }
              }
            } catch (_) {}
          }

          // Regex fallback for price
          if (!price) {
            const mPrice = pHtml.match(/(?:৳|Tk\.?|BDT)\s*(?:<!-- -->)?\s*([\d,]{2,8})/i) ||
                           pHtml.match(/\\?"price\\?"\s*:\s*(\d+(?:\.\d+)?)/i) ||
                           pHtml.match(/(?:regularPrice|salePrice|price)[^0-9]{1,10}(\d{2,7})/i);
            if (mPrice) price = parseFloat(mPrice[1].replace(/,/g, ''));
          }

          const desc = pHtml.match(/property=["']og:description["']\s+content=["']([^"']*)["']/i)?.[1] || title;

          if (title && price > 0) {
            results.push({
              name: title,
              price,
              costPrice: Math.round(price * 0.7),
              stock: 40,
              category: catName || 'সাধারণ',
              description: desc.slice(0, 500),
              imageUrl: image || '',
              sourceUrl: pUrl
            });
          }
        } catch (_) {}
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
    return results;
  } catch (_) {
    return [];
  }
}

// Strategy 4: Extract from Single Product HTML (JSON-LD, Microdata, OpenGraph)
function extractSingleProduct(html, url, ogData) {
  // Check JSON-LD
  const jsonLdBlocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdBlocks) {
    for (const block of jsonLdBlocks) {
      try {
        const clean = block.replace(/<\/?script[^>]*>/gi, '');
        const data = JSON.parse(clean);
        const prod = data['@type'] === 'Product'
          ? data
          : (Array.isArray(data['@graph']) ? data['@graph'].find(g => g['@type'] === 'Product') : null);

        if (prod && prod.name) {
          const rawPrice = prod.offers?.price || prod.offers?.[0]?.price || ogData.price || 0;
          const price = parseFloat(rawPrice) || 0;
          if (price > 0) {
            return [{
              name: prod.name.trim(),
              price,
              costPrice: Math.round(price * 0.7),
              stock: 40,
              category: prod.category || 'সাধারণ',
              description: (prod.description || prod.name).slice(0, 600),
              imageUrl: Array.isArray(prod.image) ? prod.image[0] : (typeof prod.image === 'string' ? prod.image : prod.image?.url || ogData.image || '')
            }];
          }
        }
      } catch (_) {}
    }
  }

  // Check OpenGraph + Price Patterns
  let title = ogData.title || html.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
  title = title.replace(/\s*(?:—|-|\|)\s*(?:Camerakini|OHSOGO|Daraz|Official|Store|BD Retailers).*$/i, '').trim();

  let price = parseFloat(ogData.price) || 0;
  if (!price) {
    const mPrice = html.match(/\\?"price\\?"\s*:\s*(\d+(?:\.\d+)?)/i) ||
                   html.match(/(?:price|regularPrice)[^0-9]{1,10}(\d{2,7})/i) ||
                   html.match(/(?:৳|Tk\.?|BDT)\s*(?:<!-- -->)?\s*([\d,]{2,8})/i);
    if (mPrice) price = parseFloat(mPrice[1].replace(/,/g, ''));
  }

  if (title && price > 0) {
    return [{
      name: title,
      price,
      costPrice: Math.round(price * 0.7),
      stock: 40,
      category: 'সাধারণ',
      description: (ogData.description || title).slice(0, 600),
      imageUrl: ogData.image || ''
    }];
  }

  return [];
}

// Strategy 5: Groq LPU & Vyce AI Dual-Engine Parsing
async function extractWithAI(textSnippet, ogData, url) {
  const groqKeys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2].filter(Boolean);
  const vyceKey = process.env.VYCE_AI_API_KEY;

  const aiPrompt = `You are an expert e-commerce product extraction agent (REA Reverse Engineer Agent).
Extract all products from the following webpage content and metadata.

Source URL: ${url}
OpenGraph Title: ${ogData.title || ''}
OpenGraph Image: ${ogData.image || ''}
OpenGraph Price: ${ogData.price || ''}

Webpage Content:
${textSnippet.slice(0, 6000)}

Requirements:
- Find product name, price (in BDT or local numbers), cost price (70% of price), stock, category, description, and imageUrl.
- Do NOT output website headers or brand slogans as product names.
- Output MUST be a valid JSON object strictly matching this schema:
{
  "products": [
    {
      "name": "Product Name",
      "price": 1200,
      "costPrice": 840,
      "stock": 40,
      "category": "Category",
      "description": "Short description",
      "imageUrl": "https://..."
    }
  ]
}`;

  // 1. Try Groq Keys
  for (const key of groqKeys) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: aiPrompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(12000)
      });
      if (res.ok) {
        const json = await res.json();
        const contentStr = json.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(contentStr);
        const list = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || []);
        if (list.length > 0) return list;
      }
    } catch (_) {}
  }

  // 2. Try Vyce AI Fallback
  if (vyceKey) {
    try {
      const res = await fetch('https://vyceai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vyceKey}`
        },
        body: JSON.stringify({
          model: 'agnes-3.0-flash',
          messages: [{ role: 'user', content: aiPrompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(12000)
      });
      if (res.ok) {
        const json = await res.json();
        const contentStr = json.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(contentStr);
        const list = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || []);
        if (list.length > 0) return list;
      }
    } catch (_) {}
  }

  return [];
}

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    const body = await request.json();
    let { shopId, url, autoSave = true } = body;

    if (!shopId || !url) {
      return NextResponse.json({ error: 'Shop ID এবং প্রোডাক্ট/ওয়েবসাইট URL প্রয়োজন' }, { status: 400 });
    }

    // Ensure valid URL scheme
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (_) {
      return NextResponse.json({ error: 'সঠিক ওয়েবসাইট URL দিন (যেমন: https://example.com)' }, { status: 400 });
    }

    // Verify ownership
    if (shopId !== 'main') {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      const shopData = shopDoc.data() || {};
      if (!isShopOwner(shopData, authResult.uid) && authResult.role !== 'superadmin') {
        return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
      }
    }

    const origin = parsedUrl.origin;
    const isCategoryUrl = /(?:\/product-category\/|\/category\/|\/collections\/|\/shop\/?$)/i.test(parsedUrl.pathname) || parsedUrl.pathname.includes('/all-product');
    const isStrictSingleProduct = !isCategoryUrl && /(?:\/product\/[^\/]+|\/item\/[^\/]+|\/p\/[^\/]+)/i.test(parsedUrl.pathname);

    let extractedProducts = [];
    let extractionSource = 'general';

    // ── STEP 1: Multi-Product Store Crawling & REA Category Hunter Bot ──
    if (!isStrictSingleProduct || isCategoryUrl) {
      // 1A. Category / Subcategory REA Hunter Bot
      if (isCategoryUrl || url.includes('/category/') || url.includes('/collections/')) {
        extractedProducts = await fetchCategoryHunterProducts(url, origin);
        if (extractedProducts.length > 0) extractionSource = 'category_hunter_bot';
      }

      // 1B. Suglow REA Engine
      if (extractedProducts.length === 0 && (origin.includes('suglow.com') || url.includes('suglow.com'))) {
        extractedProducts = await fetchSuglowProducts(origin);
        if (extractedProducts.length > 0) extractionSource = 'suglow_rea_engine';
      }

      // 1C. Shopify Engine
      if (extractedProducts.length === 0) {
        extractedProducts = await fetchShopifyProducts(origin);
        if (extractedProducts.length > 0) extractionSource = 'shopify_catalog';
      }

      // 1D. WooCommerce Engine
      if (extractedProducts.length === 0) {
        extractedProducts = await fetchWooCommerceProducts(origin);
        if (extractedProducts.length > 0) extractionSource = 'woocommerce_catalog';
      }

      // 1E. Product Sitemap Crawler
      if (extractedProducts.length === 0) {
        extractedProducts = await fetchSitemapProducts(origin);
        if (extractedProducts.length > 0) extractionSource = 'sitemap_crawler';
      }
    }

    // ── STEP 2: HTML Fetch & Deep Category Hunter or Single Product / AI Extraction ──
    let pageHtml = '';
    let ogData = { title: null, image: null, description: null, price: null };

    if (extractedProducts.length === 0) {
      try {
        const fetchRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(12000),
        });
        if (fetchRes.ok) {
          pageHtml = await fetchRes.text();
          ogData = extractOgMeta(pageHtml);
        }
      } catch (fetchErr) {
        console.warn('[Clone API] HTML fetch error:', fetchErr.message);
      }

      if (pageHtml) {
        // First check if pageHtml actually contains multiple products / ItemList (Category Hunter)
        extractedProducts = await fetchCategoryHunterProducts(url, origin, pageHtml);
        if (extractedProducts.length > 0) {
          extractionSource = 'category_hunter_bot';
        }

        // Otherwise try structured single product from HTML
        if (extractedProducts.length === 0) {
          extractedProducts = extractSingleProduct(pageHtml, url, ogData);
          if (extractedProducts.length > 0) extractionSource = 'structured_html';
        }

        // Try AI extraction
        if (extractedProducts.length === 0) {
          const textSnippet = extractPageText(pageHtml);
          extractedProducts = await extractWithAI(textSnippet, ogData, url);
          if (extractedProducts.length > 0) extractionSource = 'ai_extraction';
        }
      }
    }

    // Filter out dummy/bogus products (e.g. items with no price or items that just copy site name)
    extractedProducts = extractedProducts.filter(p => {
      if (!p.name || typeof p.name !== 'string') return false;
      const lower = p.name.toLowerCase();
      // Block website slogans / headers masquerading as products
      if (lower.includes('best price in bangladesh') || lower.includes('buy cosmetics') || lower.includes('online shopping')) {
        return false;
      }
      return parseFloat(p.price) > 0;
    });

    if (extractedProducts.length === 0) {
      return NextResponse.json({
        error: 'এই ওয়েবসাইট থেকে কোনো বাস্তব পণ্যের তথ্য ও মূল্য পাওয়া যায়নি। অনুগ্রহ করে সরাসরি পণ্যের লিঙ্ক দিন (যেমন: https://site.com/product/xyz) অথবা পুরো স্টোরের মূল লিঙ্ক দিন।'
      }, { status: 422 });
    }

    // ── STEP 3: Auto-save to shop in Firestore (Chunked up to 5,000 products) ──
    if (autoSave) {
      const existingCats = new Set();
      const catSnap = await adminDb.collection('shops').doc(shopId).collection('categories').get();
      catSnap.forEach(d => existingCats.add((d.data().name || '').trim().toLowerCase()));

      const targetList = extractedProducts.slice(0, 5000);
      const BATCH_SIZE = 300;
      let savedCount = 0;

      for (let i = 0; i < targetList.length; i += BATCH_SIZE) {
        const chunk = targetList.slice(i, i + BATCH_SIZE);
        const batch = adminDb.batch();

        for (const p of chunk) {
          if (!p.name) continue;
          const pRef = adminDb.collection('shops').doc(shopId).collection('products').doc();
          const catName = (p.category || 'সাধারণ').trim();

          if (catName && !existingCats.has(catName.toLowerCase())) {
            existingCats.add(catName.toLowerCase());
            const catRef = adminDb.collection('shops').doc(shopId).collection('categories').doc();
            batch.set(catRef, {
              name: catName,
              slug: catName.toLowerCase().replace(/\s+/g, '-'),
              createdAt: new Date().toISOString()
            });
          }

          const price = parseFloat(p.price) || 0;
          const costPrice = parseFloat(p.costPrice) || Math.round(price * 0.7);
          const img = p.imageUrl || ogData.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

          batch.set(pRef, {
            name: p.name.trim(),
            price,
            costPrice,
            stock: parseInt(p.stock, 10) || 40,
            category: catName,
            description: p.description || p.name,
            imageUrl: img,
            images: [img],
            sourceUrl: url,
            extractionSource,
            showOnMainSite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          savedCount++;
        }

        await batch.commit();
      }

      const sourceLabel = {
        category_hunter_bot: 'REA ক্যাটাগরি হান্টার বট',
        shopify_catalog: 'Shopify সরাসরি ক্যাটালগ',
        woocommerce_catalog: 'WooCommerce সরাসরি ক্যাটালগ',
        sitemap_crawler: 'সাইটম্যাপ ক্রলার',
        structured_html: 'স্ট্রাকচার্ড প্রোডাক্ট ডাটা',
        ai_extraction: 'Groq LPU / Vyce AI'
      }[extractionSource] || 'REA Engine';

      return NextResponse.json({
        success: true,
        savedCount,
        extractionSource,
        products: extractedProducts,
        message: `${savedCount} টি আসল প্রোডাক্ট (${sourceLabel} দিয়ে) স্বয়ংক্রিয়ভাবে আমদানি ও যুক্ত হয়েছে! 🚀`
      });
    }

    return NextResponse.json({
      success: true,
      extractionSource,
      products: extractedProducts
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Clone product error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
