---
name: claude-seo
description: "Comprehensive SEO, GEO (Generative Engine Optimization), and technical ranking suite inspired by AgriciDaniel/claude-seo. Audits, optimizes on-page content, generates Schema.org JSON-LD structured data, enhances Core Web Vitals, sets up multi-tenant e-commerce sitemaps & OpenGraph metadata, and ensures top search visibility across Google, Gemini, and AI Answer Engines."
---

# Claude-SEO: Autonomous Search & AI Engine Optimization Suite

This skill provides an automated, expert-level SEO & GEO (Generative Engine Optimization) framework designed to optimize web applications, multi-tenant e-commerce marketplaces, and storefronts for top search engine rankings (Google, Bing) and AI search engines (ChatGPT Search, Google AI Overviews, Perplexity).

---

## 1. Core Competency & Sub-Skill Matrix

The SEO engine is divided into 6 specialized operational pillars:

### A. Technical SEO & Core Web Vitals
1. **LCP (Largest Contentful Paint) Optimization (< 2.5s):**
   - Preload hero images and banner assets (`rel="preload" as="image"`).
   - Priority hints (`fetchpriority="high"`) on critical above-the-fold elements.
   - Use next-gen formats (AVIF / WebP) with explicit `width` and `height` to eliminate layout shifts.
2. **CLS (Cumulative Layout Shift) (< 0.1):**
   - Reserve skeleton or aspect-ratio boxes for dynamic image grids, banners, and third-party widgets.
   - Avoid injecting dynamic DOM elements above existing rendered content without reserved space.
3. **INP (Interaction to Next Paint) (< 200ms):**
   - Offload non-critical JavaScript into dynamic imports (`next/dynamic` with `ssr: false`).
   - Debounce intensive search filters, calculations, and animations.
4. **Crawlability & Indexing:**
   - Maintain dynamic `sitemap.xml` listing all shops, products, categories, and public landing pages.
   - Strict `robots.txt` disallowing sensitive dashboard, checkout sessions, and admin panels while allowing public storefronts.
   - Self-referencing dynamic `canonical` URLs preventing duplicate content across custom domains and subdomains.

### B. On-Page & Semantic Architecture
1. **Title Tag Blueprint:** `[Primary Keyword] - [Secondary Keyword] | [Brand Name]` (Strictly 50–60 characters).
2. **Meta Description:** Action-oriented, keyword-rich summary with CTA (140–155 characters).
3. **Headings Structure:** Exactly one `<h1>` per page containing primary entity/product keyword; logical semantic nesting (`<h2>` for categories/features, `<h3>` for product titles).
4. **Image SEO:** Descriptive Bengali/English `alt` text containing context; hyphen-separated semantic filenames (`camera-lens-ttartisan-56mm.webp`).

### C. Structured Data (Schema.org JSON-LD)
Inject SSR/Hydration-safe JSON-LD scripts for:
1. **Product & Offers Schema:** `name`, `image`, `description`, `sku`, `offers` (`price`, `priceCurrency: "BDT"`, `availability: "InStock"`), `brand`, `aggregateRating`.
2. **Organization / LocalBusiness:** `name`, `url`, `logo`, `contactPoint`, `address`, `sameAs` (social links).
3. **BreadcrumbList Schema:** Clear hierarchical path for search engine rich snippets.
4. **FAQPage Schema:** Accordion Q&A pairs for expandable SERP answer boxes.

### D. GEO & AEO (Generative & Answer Engine Optimization)
To get cited in Google AI Overviews, Gemini, and Perplexity:
1. **Direct Answer Paragraphs:** Place concise 40–60 word factual definitions directly under `<h2>` queries.
2. **Comparison & Pricing Tables:** Structured markdown/HTML tables comparing specifications, models, prices, and features.
3. **Bulleted Takeaways:** High-density key takeaways at top of lengthy guides.

### E. E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
1. **Verified Merchant & Transparency Badges:** Visible physical store address, registered phone number, WhatsApp contact.
2. **Trust & Policies:** Clear links to Return Policy, Refund Policy, Privacy Policy, and Terms of Service in the footer.
3. **Genuine User Reviews:** Customer reviews with ratings and date stamps linked via schema.

### F. Multi-Tenant E-Commerce Dynamic SEO
For multi-tenant SaaS platforms (like Webmaa / BDRetailers):
1. **Dynamic OpenGraph & Twitter Cards:**
   - Per-shop dynamic `og:title`, `og:description`, `og:image`, `og:url`.
2. **Per-Tenant Sitemaps:**
   - Each retailer's custom domain/subdomain serves its own tailored sitemap and canonical roots.

---

## 2. Standard Optimization Checklist

When auditing or optimizing any page/feature in the codebase, apply this systematic pass:

- [ ] **Meta Tags:** Verify `<title>`, `<meta name="description">`, `<meta property="og:*">`, `<meta name="twitter:*">`.
- [ ] **Canonical:** Verify `<link rel="canonical" href="...">` matches the preferred canonical domain.
- [ ] **Heading Order:** Check for single H1 and sequential H2 -> H3 hierarchy.
- [ ] **Image Alt & Lazy Loading:** Ensure `alt` tags are populated and non-hero images have `loading="lazy"`.
- [ ] **JSON-LD Schema:** Verify valid JSON-LD structure in `<script type="application/ld+json">`.
- [ ] **Mobile Touch Targets:** Minimum 44x44px clickable target size for buttons and links.
- [ ] **Contrast & Readability:** Text color vs background color ratio must exceed 4.5:1 (WCAG AA).
- [ ] **Internal Linking:** Ensure related products and stores link to each other with descriptive anchor text.

---

## 3. Implementation Workflow

When asked to run an SEO audit or optimize a storefront:
1. Inspect the target route (`page.js`, `ShopClient.jsx`, `layout.js`).
2. Generate/update metadata using Next.js Metadata API or dynamic `<Head>` tags.
3. Inject the appropriate Schema.org JSON-LD script for the entity type (Product, Store, Marketplace).
4. Verify responsive markup, contrast, and Core Web Vitals best practices.
