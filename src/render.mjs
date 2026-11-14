// Document shell, header, footer, shared components and structured-data builders.
// One module so every surface uses the same markup for the same job.
import { brand, concerns, helpTopics, nav, policies } from './catalog.mjs';


/* components, money formatting and JSON-LD ────────────────────────────── */

// Shared presentational components and structured-data builders.

// Indian rupee formatting: lakh/crore grouping, no trailing .00 on whole rupees.
export const money = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);

// Per-millilitre values read better without paise.
export const moneyCompact = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const icon = (path, cls = '') =>
  `<svg class="${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;

export const icons = {
  arrowRight: (cls) => icon('<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>', cls),
  search: (cls) => icon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', cls),
  cart: (cls) =>
    icon(
      '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/>',
      cls,
    ),
  user: (cls) =>
    icon('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>', cls),
  menu: (cls) => icon('<path d="M3 6h18M3 12h18M3 18h18"/>', cls),
  close: (cls) => icon('<path d="M5 5l14 14M19 5 5 19"/>', cls),
  lock: (cls) =>
    icon(
      '<rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
      cls,
    ),
  truck: (cls) =>
    icon(
      '<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
      cls,
    ),
  returns: (cls) =>
    icon('<path d="M4 9a8 8 0 1 1 1.5 6"/><path d="M4 4v5h5"/>', cls),
  shield: (cls) =>
    icon('<path d="M12 3 5 6v5.5c0 4.2 2.9 7.6 7 9.5 4.1-1.9 7-5.3 7-9.5V6z"/><path d="m9 12 2 2 4-4"/>', cls),
  check: (cls) => icon('<path d="m5 12.5 4.5 4.5L19 7"/>', cls),
  alert: (cls) =>
    icon('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><circle cx="12" cy="16.5" r="0.6" fill="currentColor"/>', cls),
  info: (cls) =>
    icon('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="8" r="0.6" fill="currentColor"/>', cls),
  plus: (cls) => icon('<path d="M12 5v14M5 12h14"/>', cls),
  truckSmall: (cls) => icon('<path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.4"/><circle cx="17" cy="18" r="1.4"/>', cls),
  sliders: (cls) =>
    icon('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>', cls),
};

// No star rating is rendered: there are no verified reviews yet, and inventing a
// score would be a claim with nothing behind it. The slot carries pack facts instead.
export function cardMeta(p) {
  return `<span class="rating">
    <span>${p.sizes[0].label}</span>
    <span aria-hidden="true">·</span>
    <span>Fragrance-free</span>
  </span>`;
}

export function productCard(p, index = 0) {
  return `<article class="product-card"
    data-slug="${p.slug}"
    data-order="${index}"
    data-price="${p.price}"
    data-format="${p.format}"
    data-concerns="${p.concerns.join(' ')}"
    data-types="${p.skinTypes.join(' ')}"
    data-ingredients="${p.ingredients.join(' ')}"
    data-name="${p.name}">
    <div class="product-media">
      <a href="/product/${p.slug}/" tabindex="-1" aria-hidden="true">
        <img src="/assets/img/${p.slug}-front-480.webp"
             srcset="/assets/img/${p.slug}-front-480.webp 480w, /assets/img/${p.slug}-front-960.webp 960w"
             sizes="(max-width: 640px) 46vw, (max-width: 960px) 45vw, 300px"
             width="480" height="600" loading="lazy" decoding="async"
             alt="${p.name}, ${p.format.toLowerCase()}">
      </a>
      ${p.bestseller ? '<span class="badge badge-accent">Bestseller</span>' : ''}
      ${p.compareAt ? '<span class="badge">Set saving</span>' : ''}
    </div>
    <div class="product-body">
      <p class="product-brand">${p.format}</p>
      <h3><a class="product-name" href="/product/${p.slug}/">${p.name}</a></h3>
      <p class="product-sub">${p.subtitle}</p>
      ${cardMeta(p)}
      <div class="product-foot">
        <p class="price num" style="margin:0">${money(p.price)}${
          p.compareAt ? `<span class="price-was">${money(p.compareAt)}</span>` : ''
        }</p>
        <button class="btn btn-secondary btn-sm" type="button" data-quick-add data-sku="${p.sizes[0].sku}" aria-label="Add ${p.name}, ${p.sizes[0].label}, to cart">
          Add${icons.plus()}
        </button>
      </div>
    </div>
  </article>`;
}

export function trustRow({ compact = false } = {}) {
  return `<div class="trust-row" role="list" aria-label="Purchase protections">
    <div class="trust-item" role="listitem">${icons.lock()}<span>Encrypted checkout. Card details go straight to our processor.</span></div>
    <div class="trust-item" role="listitem">${icons.returns()}<span>30-day returns, prepaid label, no restocking fee.</span></div>
    <div class="trust-item" role="listitem">${icons.shield()}<span>Card details go to the payment processor. We never store card numbers.</span></div>
  </div>`;
}

export function policyList(p) {
  return `<dl class="policy-list">
    <div><dt>Shipping</dt><dd>Free over ${money(policies.shipping.freeThreshold)}. Standard ${money(
      policies.shipping.standard.price,
    )}, 3–5 business days. Express ${money(policies.shipping.express.price)}, 1–2 days.</dd></div>
    <div><dt>Returns</dt><dd>${policies.returns.summary} <a href="/help/#returns">Return policy</a></dd></div>
    <div><dt>Tax</dt><dd>${policies.shipping.taxNote}</dd></div>
    <div><dt>Size</dt><dd>${p.dimensions}. Batch number and use card included.</dd></div>
    <div><dt>Parcel</dt><dd>${p.parcel} · ${p.weight} g</dd></div>
  </dl>`;
}

/* ---------- JSON-LD ---------- */

const seller = {
  '@type': 'Organization',
  name: brand.legalName,
  url: brand.domain,
};

function returnPolicy(country = 'IN') {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: country,
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: policies.returns.days,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
    returnPolicyUrl: `${brand.domain}/help/#returns`,
  };
}

function shippingDetails(price, country = 'IN', minDays = 3, maxDays = 5) {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: price.toFixed(2), currency: 'INR' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: country },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 0,
        maxValue: 1,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: minDays,
        maxValue: maxDays,
        unitCode: 'DAY',
      },
    },
  };
}

export function productSchema(p) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${brand.domain}/product/${p.slug}/#product`,
    name: p.name,
    sku: p.sku,
    mpn: p.sku,
    description: p.description,
    image: [1, 2, 3].map(
      (i) =>
        `${brand.domain}/assets/img/${p.slug}-${['front', 'detail', 'scale'][i - 1]}-960.webp`,
    ),
    url: `${brand.domain}/product/${p.slug}/`,
    brand: { '@type': 'Brand', name: brand.name },
    category: `Beauty & Personal Care > Skin Care > ${p.format}`,
    audience: { '@type': 'PeopleAudience', suggestedGender: 'unisex' },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Size', value: p.sizes[0].label },
      { '@type': 'PropertyValue', name: 'Format', value: p.format },
      { '@type': 'PropertyValue', name: 'Fragrance free', value: 'true' },
    ],
    weight: { '@type': 'QuantitativeValue', value: p.weight, unitCode: 'GRM' },
    offers: p.sizes.map((s) => ({
      '@type': 'Offer',
      '@id': `${brand.domain}/product/${p.slug}/#offer-${s.sku}`,
      url: `${brand.domain}/product/${p.slug}/`,
      sku: s.sku,
      price: s.price.toFixed(2),
      priceCurrency: 'INR',
      priceValidUntil: '2027-01-31',
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller,
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: 6,
        unitCode: 'C62',
      },
      shippingDetails: [shippingDetails(policies.shipping.standard.price)],
      hasMerchantReturnPolicy: returnPolicy(),
    })),
  };
}

export function breadcrumbSchema(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${brand.domain}${t.href}`,
    })),
  };
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${brand.domain}/#organization`,
    name: brand.legalName,
    url: brand.domain,
    email: brand.email,
    telephone: brand.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: brand.address.street,
      addressLocality: brand.address.city,
      addressRegion: brand.address.region,
      postalCode: brand.address.postalCode,
      addressCountry: brand.address.country,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: brand.email,
        telephone: brand.phone,
        availableLanguage: ['English'],
      },
    ],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${brand.domain}/#website`,
    url: brand.domain,
    name: brand.name,
    publisher: { '@id': `${brand.domain}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${brand.domain}/shop/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function itemListSchema(items, name = 'All products') {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${brand.domain}/product/${p.slug}/`,
      name: p.name,
    })),
  };
}

export function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export const jsonld = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

/* header, footer and document shell ───────────────────────────────────── */

// HTML shell, header, footer. One source of truth for every page.

const megaPanel = (item) => {
  if (!item.mega) return '';
  const id = `mega-${item.label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  const columns = item.mega.columns
    .map(
      (col) => `<div>
        <h3>${col.heading}</h3>
        <ul>${col.links
          .map((l) => `<li><a href="${l.href}">${l.label}</a></li>`)
          .join('')}</ul>
      </div>`,
    )
    .join('');
  const feature = item.mega.featured
    ? `<div class="mega-feature">
        <div>
          <p class="eyebrow" style="margin-bottom:8px">Bundle</p>
          <strong>${item.mega.featured.label}</strong>
          <p class="meta" style="margin:8px 0 0">${item.mega.featured.copy}</p>
        </div>
        <a class="link-arrow" href="${item.mega.featured.href}">View the set ${icons.arrowRight()}</a>
      </div>`
    : '';
  return `<div class="mega" id="${id}" hidden>
    <div class="mega-grid">${columns}</div>
    ${feature}
  </div>`;
};

export function header(currentPath = '/') {
  const items = nav
    .map((item) => {
      const hasMega = Boolean(item.mega);
      const megaId = `mega-${item.label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
      const current = item.href === currentPath ? ' aria-current="page"' : '';
      return `<li class="nav-item">
        ${
          hasMega
            ? `<button class="nav-trigger" type="button" aria-expanded="false" aria-controls="${megaId}">
                ${item.label}
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
              </button>`
            : `<a class="nav-link" href="${item.href}"${current}>${item.label}</a>`
        }
        ${megaPanel(item)}
      </li>`;
    })
    .join('');

  return `<header class="site-header">
    <div class="shell header-main">
      <button class="icon-link menu-toggle" type="button" data-open-mobile-nav aria-expanded="false" aria-controls="mobile-nav">
        ${icons.menu()}<span class="visually-hidden">Menu</span>
      </button>

      <a class="wordmark" href="/" aria-label="${brand.name} home">
        <svg class="wordmark-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <rect x="1" y="1" width="30" height="30" fill="none" stroke="#6B1F2B" stroke-width="1.5"/>
          <path d="M16 6c4 4.2 6 7.6 6 10.6A6 6 0 0 1 10 16.6C10 13.6 12 10.2 16 6Z" fill="#6B1F2B"/>
          <path d="M16 12v12" stroke="#FFF8E7" stroke-width="1.4"/>
        </svg>
        ${brand.name}
      </a>

      <form class="header-search" role="search" action="/shop/" method="get" data-search-form>
        <label class="visually-hidden" for="site-search">Search products or concerns</label>
        <div class="search-field">
          ${icons.search()}
          <input id="site-search" name="q" type="search" inputmode="search" autocomplete="off"
                 placeholder="Search “dry skin”"
                 role="combobox" aria-expanded="false" aria-controls="search-panel"
                 aria-autocomplete="list" aria-describedby="search-hint" data-search-input>
          <button class="search-submit" type="submit" aria-label="Submit search">${icons.arrowRight()}</button>
        </div>
        <div class="search-panel" id="search-panel" role="listbox" aria-label="Search suggestions" hidden data-search-panel></div>
        <p class="visually-hidden" id="search-hint">Results update as you type. Use the up and down arrow keys to browse suggestions, then Enter to open one.</p>
        <p class="visually-hidden" role="status" aria-live="polite" data-search-status></p>
      </form>

      <div class="header-actions">
        <a class="icon-link" href="/account/" aria-label="Account and orders: sign in">
          ${icons.user()}<span class="label">Account</span>
        </a>
        <a class="icon-link" href="/cart/" data-cart-link>
          ${icons.cart()}<span class="label">Cart</span>
          <span class="cart-count num" data-cart-count data-empty="true" aria-hidden="true">0</span>
          <span class="visually-hidden" data-cart-status>Cart, 0 items</span>
        </a>
      </div>
    </div>

    <nav class="primary-nav" aria-label="Primary">
      <div class="shell">
        <ul class="nav-list">
          ${items}
          <li class="nav-spacer" aria-hidden="true"></li>
          <li class="nav-utility">
            <span>Free shipping over <strong>${money(policies.shipping.freeThreshold)}</strong></span>
          </li>
        </ul>
      </div>
    </nav>

    <dialog class="mobile-nav" id="mobile-nav" aria-label="Menu">
      <div class="mobile-nav-inner">
        <div class="mobile-nav-head">
          <span class="wordmark" aria-hidden="true">${brand.name}</span>
          <button class="icon-link" type="button" data-close-mobile-nav>
            ${icons.close()}<span class="visually-hidden">Close menu</span>
          </button>
        </div>
        <nav aria-label="Mobile">
          ${nav
            .map((i) => `<a href="${i.href}">${i.label}</a>`)
            .join('')}
          <p class="eyebrow" style="margin-top:24px">Shop by concern</p>
          ${concerns
            .slice(0, 6)
            .map((c) => `<a class="mobile-nav-sub" href="/shop/?concern=${c.id}">${c.label}</a>`)
            .join('')}
        </nav>
        <a class="btn btn-primary btn-block mobile-nav-cta" href="/shop/">Shop all products</a>
        <a class="text-link" href="/account/" style="margin-top:8px">Track an order</a>
      </div>
    </dialog>
  </header>`;
}

export function footer() {
  return `<footer class="site-footer">
    <div class="shell">
      <div class="footer-top">
        <div class="footer-brand">
          <a class="wordmark" href="/">${brand.name}</a>
          <p>Barrier-first skincare made in Vijayawada, India. Fragrance-free formulas, ingredient concentrations printed on every carton, and a return policy you can read in one screen.</p>
          <p class="meta">${brand.address.street}<br>${brand.address.city}, ${brand.address.region} ${brand.address.postalCode}</p>
          <p class="meta"><a href="mailto:${brand.email}">${brand.email}</a> · <a href="/privacy/#grievance">Grievance officer</a></p>
        </div>
        <div class="footer-col">
          <h2>Shop</h2>
          <a href="/shop/">All products</a>
          <a href="/shop/?concern=dry">Dryness and tightness</a>
          <a href="/shop/?concern=redness">Redness</a>
          <a href="/shop/?format=Set">Sets</a>
          <a href="/shop/?sort=price-desc">Highest price first</a>
        </div>
        <div class="footer-col">
          <h2>Help</h2>
          ${helpTopics
            .slice(0, 4)
            .map((t) => `<a href="/help/#${t.id}">${t.title}</a>`)
            .join('')}
          <a href="/account/">Track an order</a>
        </div>
        <div class="footer-col">
          <h2>Policies</h2>
          <a href="/privacy/">Privacy notice</a>
          <a href="/terms/">Terms of sale</a>
          <a href="/terms/#returns">Returns policy</a>
          <a href="/terms/#delivery">Delivery and charges</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p style="margin:0">© <span data-year>2026</span> ${brand.legalName}. Prices in INR, excluding GST.</p>
        <div class="footer-proof">
          <span>${icons.lock()} Card details never stored</span>
          <span>${icons.returns()} 30-day returns</span>
          <span>${icons.truck()} Ships from Vijayawada, India</span>
        </div>
      </div>
    </div>
  </footer>`;
}

export function page({
  title,
  description,
  path = '/',
  body = '',
  bodyClass = '',
  schemas = [],
  noindex = false,
  preload = [],
}) {
  const canonical = `${brand.domain}${path}`;
  const preloadTags = preload
    .map(
      (p) =>
        `<link rel="preload" as="image" href="${p.href}"${
          p.srcset ? ` imagesrcset="${p.srcset}" imagesizes="${p.sizes || '100vw'}"` : ''
        } fetchpriority="high">`,
    )
    .join('\n    ');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonical}">
    <meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
    <meta name="theme-color" content="#FFF8E7">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${brand.name}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${brand.domain}/assets/img/hero-960.webp">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
    ${preloadTags}
    <link rel="stylesheet" href="/assets/css/site.css">
    ${schemas.join('\n    ')}
  </head>
  <body class="${bodyClass}">
    <a class="skip-link" href="#main">Skip to main content</a>
    <div class="visually-hidden" role="status" aria-live="polite" data-cart-live></div>
    ${header(path)}
    <main id="main" tabindex="-1">
      ${body}
    </main>
    ${footer()}
    <script src="/assets/js/catalog.js" defer></script>
    <script src="/assets/js/app.js" defer></script>
  </body>
</html>
`;
}
