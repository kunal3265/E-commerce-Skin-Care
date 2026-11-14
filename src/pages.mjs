// Every page renderer: home, shop, product detail, cart, checkout, account, help.
// Each function returns { title, description, path, body, schemas } for layout.page().
import {
  brand,
  concerns,
  faqs,
  formats,
  helpTopics,
  policies,
  productDetails,
  products,
  skinTypes,
} from './catalog.mjs';
import {
  breadcrumbSchema,
  faqSchema,
  icons,
  itemListSchema,
  jsonld,
  money,
  moneyCompact,
  policyList,
  productCard,
  cardMeta,
  productSchema,
  trustRow,
} from './render.mjs';

/* home ────────────────────────────────────────────────────────────────── */
const concernCopy = {
  dry: 'Tightness after cleansing, flaking on cheeks, a barrier that will not hold moisture.',
  sensitive: 'Stinging, burning, or reacting to products that used to be fine.',
  redness: 'Persistent flushing across the nose and cheeks, worse after heat or actives.',
  texture: 'Rough patches, closed bumps, and foundation that catches on the surface.',
  lines: 'Fine lines around the eyes and mouth, and crepey texture on the neck.',
  firmness: 'Less spring in the jawline and cheeks than two years ago.',
  marks: 'Brown or red marks left behind after a breakout has healed.',
  dullness: 'Flat, tired-looking skin that does not reflect light evenly.',
  uv: 'Daily prevention for skin that burns easily or is using a retinoid.',
};

const counts = (id) => products.filter((p) => p.concerns.includes(id)).length;

export function home() {
  // Eight cards: the whole range, bestsellers first, then by price.
  const featured = [...products]
    .sort((a, b) => Number(b.bestseller) - Number(a.bestseller) || a.price - b.price)
    .slice(0, 8);

  const body = `
    <div class="shell">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">Barrier-first skincare · Vijayawada, India</p>
          <h1 id="hero-title">Skin that stings after washing needs fewer steps, not more.</h1>
          <p class="lede">Fragrance-free formulas built for dry, reactive skin — the percentage on the front of the pack is the percentage in the formula.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="/product/barrier-ritual-set/">Shop the barrier set ${icons.arrowRight()}</a>
            <a class="btn btn-secondary" href="#concerns">Find by concern</a>
          </div>
          <ul class="hero-proof">
            <li>${icons.truck()} Free shipping over ${money(policies.shipping.freeThreshold)}</li>
            <li>${icons.returns()} 30-day returns, opened or not</li>
            <li>${icons.shield()} Fragrance-free, essential-oil-free</li>
          </ul>
        </div>
        <figure class="hero-media">
          <img src="/assets/img/hero-960.webp"
               srcset="/assets/img/hero-960.webp 960w, /assets/img/hero-1600.webp 1600w"
               sizes="(max-width: 960px) 100vw, 640px"
               width="960" height="600" fetchpriority="high" decoding="async"
               alt="Three Clay &amp; Kin products on a latte-coloured surface: a balm jar, a toner bottle and a cleanser tube.">
          <figcaption class="hero-caption">The Barrier Ritual Set — cleanser, toner, balm. ${money(
            products.find((p) => p.slug === 'barrier-ritual-set').price,
          )}</figcaption>
        </figure>
      </section>

      <section class="section" id="concerns" aria-labelledby="concerns-title">
        <div class="section-head">
          <div>
            <h2 id="concerns-title">Start with the symptom, not the category</h2>
            <p>Each link opens a filtered list. Counts are current stock, not marketing.</p>
          </div>
          <a class="link-arrow" href="/shop/">Browse all ${products.length} products ${icons.arrowRight()}</a>
        </div>
        <div class="concern-grid">
          ${concerns
            .slice(0, 6)
            .map(
              (c) => `<a class="concern-card" href="/shop/?concern=${c.id}">
                <span class="concern-title">${c.label}<span class="concern-count">${counts(c.id)} product${counts(c.id) === 1 ? '' : 's'}</span></span>
                <p>${concernCopy[c.id]}</p>
                <span class="concern-arrow">Shop ${c.label.toLowerCase()} ${icons.arrowRight()}</span>
              </a>`,
            )
            .join('')}
        </div>
      </section>

      <section class="section" aria-labelledby="best-title" data-reveal>
        <div class="section-head">
          <div>
            <h2 id="best-title">All ${products.length} formulas</h2>
            <p>Ranked by repeat purchase rate over the last 90 days. The full range on one page, no carousel.</p>
          </div>
          <a class="link-arrow" href="/shop/">All products ${icons.arrowRight()}</a>
        </div>
        <div class="product-grid">
          ${featured.map(productCard).join('')}
        </div>
      </section>

      <section class="section" aria-labelledby="scale-title" data-reveal>
        <div class="scale-feature">
          <figure style="margin:0">
            <img src="/assets/img/barrier-repair-balm-scale-480.webp"
                 srcset="/assets/img/barrier-repair-balm-scale-480.webp 480w, /assets/img/barrier-repair-balm-scale-960.webp 960w"
                 sizes="(max-width: 960px) 90vw, 420px"
                 width="480" height="600" loading="lazy" decoding="async"
                 alt="A 50 ml Barrier Repair Balm jar held in an adult hand, with a millimetre tick beside the jar.">
            <figcaption>Barrier Repair Balm, 50 ml. Hand shown at a 190 mm palm-to-fingertip reference.</figcaption>
          </figure>
          <div>
            <p class="eyebrow">Size, before you buy</p>
            <h2 id="scale-title">What 50 ml actually looks like</h2>
            <p>Every product gallery carries a photograph of the item held in an adult hand, downloaded at the same time as the product shot. It is the cheapest way to stop a return caused by “smaller than expected”.</p>
            <ul class="scale-list">
              <li><span class="k">Balm</span><span>50 ml jar — 62 mm wide, 48 mm tall. About 8–10 weeks at twice daily.</span></li>
              <li><span class="k">Cleanser</span><span>120 ml tube — 158 mm tall. About 8 weeks at twice daily.</span></li>
              <li><span class="k">Set</span><span>Three full sizes in a 180 × 140 × 70 mm box. One delivery, one returns label.</span></li>
            </ul>
            <a class="btn btn-secondary" href="/product/barrier-repair-balm/">See the full gallery</a>
          </div>
        </div>
      </section>

      <section class="section" aria-label="Purchase protections" data-reveal>
        <div class="standards-strip">
          <div class="standards-item">
            ${icons.shield()}
            <div><h3>Fragrance-free, without exceptions</h3><p>No fragrance, no essential oils, no masking agents. Published on every formula page.</p></div>
          </div>
          <div class="standards-item">
            ${icons.check()}
            <div><h3>Concentrations, not adjectives</h3><p>Actives are listed at their real strength, so you can compare the formula rather than the label.</p></div>
          </div>
          <div class="standards-item">
            ${icons.returns()}
            <div><h3>Returns that do not require a story</h3><p>30 days, opened or unopened, prepaid label, refund in 3–5 business days.</p></div>
          </div>
        </div>
      </section>

      <section class="section" aria-label="Help" data-reveal>
        <div class="help-band">
          <div>
            <h2>Not sure which formula fits?</h2>
            <p>Answer three questions in the help centre, or search a symptom. Real replies within one business day.</p>
          </div>
          <a class="btn btn-primary" href="/help/">Open the help centre</a>
        </div>
      </section>
    </div>`;

  return {
    title: `${brand.name} — Barrier-first skincare for dry, reactive skin`,
    description:
      'Fragrance-free barrier skincare for dry, reactive skin. Shop by symptom, see true product size in hand, 30-day returns and guest checkout.',
    path: '/',
    body,
    preload: [
      {
        href: '/assets/img/hero-960.webp',
        srcset: '/assets/img/hero-960.webp 960w, /assets/img/hero-1600.webp 1600w',
        sizes: '(max-width: 960px) 100vw, 640px',
      },
    ],
    schemas: [],
  };
}

/* shop ────────────────────────────────────────────────────────────────── */
const priceBands = [
  { id: 'under-500', label: 'Under ₹500', test: (p) => p.price < 500 },
  { id: '500-700', label: '₹500 – ₹700', test: (p) => p.price >= 500 && p.price < 700 },
  { id: '700-900', label: '₹700 – ₹900', test: (p) => p.price >= 700 && p.price < 900 },
  { id: 'over-900', label: 'Over ₹900', test: (p) => p.price >= 900 },
];

const ingredients = [
  { id: 'ceramide', label: 'Ceramides' },
  { id: 'squalane', label: 'Squalane' },
  { id: 'azelaic', label: 'Azelaic acid' },
  { id: 'retinal', label: 'Retinal' },
  { id: 'niacinamide', label: 'Niacinamide' },
  { id: 'oat', label: 'Colloidal oat' },
  { id: 'panthenol', label: 'Panthenol' },
  { id: 'allantoin', label: 'Allantoin' },
];

const facetGroup = (title, name, options) => `
  <section class="facet-group">
    <h2>${title}</h2>
    ${options
      .map(
        (o) => `<label class="facet-option">
          <input type="checkbox" name="${name}" value="${o.id}" data-facet="${name}">
          <span>${o.label}</span>
          <span class="count num" data-count-for="${name}:${o.id}">${o.count}</span>
        </label>`,
      )
      .join('')}
  </section>`;

export function shop() {
  const count = (fn) => products.filter(fn).length;

  const facetMarkup = `
    <form class="facets" data-facet-form aria-label="Filter products">
      ${facetGroup(
        'Concern',
        'concern',
        concerns.map((c) => ({
          ...c,
          count: count((p) => p.concerns.includes(c.id)),
        })),
      )}
      ${facetGroup(
        'Skin type',
        'type',
        skinTypes.map((t) => ({ ...t, count: count((p) => p.skinTypes.includes(t.id)) })),
      )}
      ${facetGroup(
        'Format',
        'format',
        formats.map((f) => ({ id: f, label: f, count: count((p) => p.format === f) })),
      )}
      ${facetGroup(
        'Price',
        'price',
        priceBands.map((b) => ({ id: b.id, label: b.label, count: count(b.test) })),
      )}
      <section class="facet-group">
        <h2>Ingredient</h2>
        ${ingredients
          .map(
            (i) => `<label class="facet-option">
              <input type="checkbox" name="ingredient" value="${i.id}" data-facet="ingredient">
              <span>${i.label}</span>
              <span class="count num" data-count-for="ingredient:${i.id}">${count((p) =>
                p.ingredients.includes(i.id),
              )}</span>
            </label>`,
          )
          .join('')}
      </section>
      <section class="facet-group">
        <button class="btn btn-quiet btn-block" type="button" data-clear-facets>Clear all filters</button>
      </section>
    </form>`;

  const body = `
    <div class="shell">
      <div class="page-head">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol><li><a href="/">Home</a></li><li>Shop</li></ol>
        </nav>
        <h1 id="shop-title">All products</h1>
        <p class="lede" style="margin-top:var(--space-3)">${products.length} formulas, each with one job. Filter by concern, skin type, format or ingredient. Every product page shows its size in hand, full ingredient list and return terms before you add it to the cart.</p>
      </div>

      <div class="shop-layout">
        <aside aria-label="Filters">
          ${facetMarkup}
        </aside>

        <div>
          <div class="results-bar">
            <p class="results-count" role="status" aria-live="polite" data-results-count>
              <strong>${products.length}</strong> products
            </p>
            <div style="display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap">
              <button class="btn btn-quiet filters-toggle" type="button" data-open-filters aria-expanded="false" aria-controls="filter-dialog">
                ${icons.sliders()} Filters <span class="cart-count num" data-filter-count hidden>0</span>
              </button>
              <div class="sort-field">
                <label for="sort">Sort</label>
                <select class="select" id="sort" data-sort>
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </div>
            </div>
          </div>

          <div class="chips" data-chips hidden></div>

          <div class="notice" data-intent-note hidden>
            ${icons.info()}
            <p data-intent-copy></p>
          </div>

          <div class="product-grid" data-product-grid>
            ${products.map((p, i) => productCard(p, i)).join('')}
          </div>

          <div class="empty-state" data-empty hidden>
            <h2>No products match those filters</h2>
            <p style="margin-inline:auto">Try removing one filter, or search a symptom such as “dry skin” or “redness”.</p>
            <button class="btn btn-primary" type="button" data-clear-facets>Clear all filters</button>
          </div>

          <section class="section" aria-labelledby="facet-help">
            <div class="help-band">
              <div>
                <h2 id="facet-help" style="font-size:var(--text-xl)">Filtering not getting you there?</h2>
                <p>Describe the symptom in the search bar — “stinging”, “flaking”, “marks” — and we map it to formulas.</p>
              </div>
              <a class="btn btn-secondary" href="/help/#products">Read the routine guide</a>
            </div>
          </section>
        </div>
      </div>
    </div>

    <dialog class="filter-dialog" id="filter-dialog" aria-label="Filter products">
      <div class="filter-dialog-inner">
        <div class="filter-dialog-head">
          <h2 style="font-size:var(--text-xl)">Filters</h2>
          <button class="icon-link" type="button" data-close-filters>
            ${icons.close()}<span class="visually-hidden">Close filters</span>
          </button>
        </div>
        <div class="filter-dialog-body" data-filter-dialog-body></div>
        <div class="filter-dialog-foot">
          <button class="btn btn-quiet" type="button" data-clear-facets>Clear</button>
          <button class="btn btn-primary" type="button" data-close-filters>Show <span data-dialog-count>${products.length}</span> results</button>
        </div>
      </div>
    </dialog>

    <script type="application/json" id="shop-data">${JSON.stringify({
      products: products.map((p) => ({
        slug: p.slug,
        name: p.name,
        price: p.price,
        rating: p.rating,
        format: p.format,
        concerns: p.concerns,
        skinTypes: p.skinTypes,
        ingredients: p.ingredients,
        bestseller: p.bestseller,
      })),
      concerns: concerns.map((c) => ({ id: c.id, label: c.label, synonyms: c.synonyms })),
      priceBands: priceBands.map(({ id, label }) => ({ id, label })),
    })}</script>`;

  return {
    title: `Shop all ${products.length} barrier-first formulas — ${brand.name}`,
    description:
      'Filter skincare by symptom, skin type, format and ingredient. Full ingredient lists, true-size images and return terms on every product page.',
    path: '/shop/',
    body,
    schemas: [
      ...[],
      breadcrumbSchema([
        { name: 'Home', href: '/' },
        { name: 'Shop', href: '/shop/' },
      ]),
      itemListSchema(products),
    ].map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`),
    noindex: false,
  };
}

export { priceBands, ingredients };

/* product ─────────────────────────────────────────────────────────────── */
const sizeNumber = (label) => Number(label.match(/(\d+)\s*ml/)?.[1] || 0);

export function productPage(p) {
  const detail = productDetails[p.slug];
  const perMl = sizeNumber(p.sizes[0].label)
    ? ` · ${moneyCompact(p.price / sizeNumber(p.sizes[0].label))}/ml`
    : '';
  const ratingAnchor = `<span class="pdp-rating">
      ${cardMeta(p)}
    </span>`;

  const gallery = [
    {
      file: 'front',
      caption: `${p.name}, ${p.sizes[0].label}. ${p.dimensions}.`,
      alt: `${p.name} ${p.sizes[0].label} ${p.format.toLowerCase()} on a latte background.`,
      position: 'center',
    },
    {
      file: 'detail',
      caption: `${detail.texture} Texture shown at 3× magnification.`,
      alt: `Close-up of the ${p.name} texture.`,
      position: 'center',
    },
    {
      file: 'scale',
      caption: `In hand: ${p.dimensions}, against a 190 mm palm-to-fingertip reference.`,
      alt: `${p.name} held in an adult hand beside a millimetre scale mark.`,
      position: 'center 62%',
    },
  ];

  const related = products.filter((x) => x.slug !== p.slug && x.concerns.some((c) => p.concerns.includes(c))).slice(0, 3);

  const body = `
    <div class="shell">
      <div class="page-head" style="border-bottom:0;padding-bottom:0">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li><a href="/shop/">Shop</a></li>
            <li><a href="/shop/?concern=${p.concerns[0]}">${concerns.find((c) => c.id === p.concerns[0]).label}</a></li>
            <li aria-current="page">${p.name}</li>
          </ol>
        </nav>
      </div>

      <article class="pdp" aria-labelledby="pdp-title">
        <div class="gallery">
          <div class="gallery-thumbs" role="group" aria-label="Product images">
            ${gallery
              .map(
                (g, i) => `<button class="gallery-thumb" type="button" data-gallery-thumb
                  data-file="${p.slug}-${g.file}"
                  data-caption="${g.caption}"
                  data-alt="${g.alt}"
                  data-position="${g.position}"
                  aria-current="${i === 0 ? 'true' : 'false'}"
                  aria-label="Show image ${i + 1}: ${g.caption}">
                  <img src="/assets/img/${p.slug}-${g.file}-480.webp" width="84" height="105"
                       alt="" loading="lazy" decoding="async">
                </button>`,
              )
              .join('')}
          </div>
          <div class="gallery-main">
            <img id="gallery-image"
                 src="/assets/img/${p.slug}-front-960.webp"
                 srcset="/assets/img/${p.slug}-front-480.webp 480w, /assets/img/${p.slug}-front-960.webp 960w"
                 sizes="(max-width: 960px) 92vw, 600px"
                 width="960" height="1200" fetchpriority="high" decoding="async"
                 alt="${gallery[0].alt}">
            <p class="gallery-caption" data-gallery-caption>${gallery[0].caption}</p>
          </div>
        </div>

        <div class="buybox">
          <p class="eyebrow" style="margin-bottom:var(--space-2)">${p.format} · ${p.bestseller ? 'Bestseller' : 'New batch'}</p>
          <h1 id="pdp-title">${p.name}</h1>
          <p class="pdp-sub">${p.subtitle}</p>
          ${ratingAnchor}

          <div class="pdp-price">
            <span class="amount num" data-price data-pdp-price>${money(p.price)}</span>
            ${p.compareAt ? `<span class="price-was">${money(p.compareAt)}</span><span class="save-badge">Save ${money(p.compareAt - p.price)}</span>` : ''}
            <span class="per" data-per>${p.sizes[0].label}${perMl}</span>
          </div>

          <form data-pdp-form>
            ${
              p.sizes.length > 1
                ? `<fieldset style="border:0;padding:0;margin:0">
                    <legend class="field-label">Size</legend>
                    <div class="size-options">
                      ${p.sizes
                        .map(
                          (s, i) => `<label class="size-option">
                            <input type="radio" name="size" value="${s.sku}" data-size-price="${s.price}" data-size-label="${s.label}" ${i === 0 ? 'checked' : ''}>
                            <span>${s.label} — ${money(s.price)}</span>
                          </label>`,
                        )
                        .join('')}
                    </div>
                  </fieldset>`
                : `<p class="field-label" style="margin-bottom:var(--space-2)">Size: ${p.sizes[0].label}</p>`
            }

            <div class="qty-row">
              <div>
                <label class="field-label" for="qty-${p.slug}" style="margin-bottom:6px">Quantity</label>
                <div class="stepper">
                  <button type="button" data-qty-step="-1" aria-label="Decrease quantity">−</button>
                  <output id="qty-${p.slug}" aria-live="polite">1</output>
                  <button type="button" data-qty-step="1" aria-label="Increase quantity">+</button>
                </div>
              </div>
              <p class="stock-line" style="margin:0">
                <span class="stock-dot ${p.stock < 10 ? 'low' : ''}"></span>
                ${p.stock < 10 ? `Low stock — ${p.stock} left` : `In stock — ${p.stock} on hand`}
                · ships today if ordered by 2&nbsp;pm&nbsp;IST
              </p>
            </div>

            <button class="btn btn-primary btn-block" type="submit" data-add-to-cart data-slug="${p.slug}">
              Add to cart — <span data-button-price>${money(p.price)}</span>
            </button>
            ${trustRow()}
          </form>

          <div class="notice">
            ${icons.truck()}
            <p>Free shipping over ${money(policies.shipping.freeThreshold)}. Standard ${money(
              policies.shipping.standard.price,
            )} (3–5 days), express ${money(policies.shipping.express.price)} (1–2 days). Tax is calculated at checkout before payment.</p>
          </div>

          ${policyList(p)}

          <h2 class="field-label" style="font-family:var(--font-text);font-size:var(--text-2xs);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted)">Why people buy it</h2>
          <ul class="benefits">
            ${p.benefits.map((b) => `<li>${b}</li>`).join('')}
          </ul>

          <div class="accordion">
            <details open>
              <summary>What it does</summary>
              <div class="accordion-body">
                <p>${p.description}</p>
                <p class="meta" style="margin:0">${p.description.trim().split(/\s+/).length} words</p>
              </div>
            </details>
            <details>
              <summary>How to use it</summary>
              <div class="accordion-body"><p>${detail.howto}</p></div>
            </details>
            <details>
              <summary>Full ingredient list (INCI)</summary>
              <div class="accordion-body">
                <p>${detail.inci}</p>
                <p class="meta" style="margin:0">Fragrance-free. No essential oils, no drying alcohols, no dyes.</p>
              </div>
            </details>
            <details>
              <summary>Formula and use</summary>
              <div class="accordion-body">
                <p>${detail.testing}</p>
                <p class="meta" style="margin:0">Full ingredient list, batch number and use card are printed on the carton. <a href="/help/#standards">Our standards</a>.</p>
              </div>
            </details>
            <details>
              <summary>Shipping, returns and tax</summary>
              <div class="accordion-body">
                <p>Orders placed before 2&nbsp;pm&nbsp;IST ship the same business day from Vijayawada. Standard shipping is ${money(
                  policies.shipping.standard.price,
                )} and arrives in 3–5 business days; free over ${money(
                  policies.shipping.freeThreshold,
                )}. Returns are open for ${policies.returns.days} days, opened or unopened, with a prepaid label. Refunds are issued to the original payment method within 3–5 business days of arrival. GST is shown before payment, never added silently.</p>
                <p style="margin:0"><a href="/help/#shipping">Full shipping table</a> · <a href="/help/#returns">Return policy</a></p>
              </div>
            </details>
          </div>
        </div>
      </article>

      <section class="section" id="reviews" aria-labelledby="reviews-heading" data-reveal style="border-top:1px solid var(--rule)">
        <div class="section-head">
          <div>
            <h2 id="reviews-heading">Reviews</h2>
            <p>No reviews yet for this formula.</p>
          </div>
        </div>
        <div class="review-grid">
          <div class="review-card">
            <h3 style="margin:0 0 var(--space-2)">Reviews open after delivery</h3>
            <p style="margin:0">Every review here comes from a verified order. Nothing is filtered, and low scores stay up.</p>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="related-title" data-reveal>
        <div class="section-head">
          <div><h2 id="related-title">Pairs with</h2><p>Same concern, different step. No duplicate actives.</p></div>
          <a class="link-arrow" href="/shop/">All products ${icons.arrowRight()}</a>
        </div>
        <div class="product-grid product-grid-3">
          ${related.map(productCard).join('')}
        </div>
      </section>
    </div>

    <div class="sticky-buy" data-sticky-buy hidden>
      <span class="sticky-price"><strong data-sticky-price>${money(p.price)}</strong><span class="sticky-size" data-sticky-size>${p.sizes[0].label}</span></span>
      <button class="btn btn-primary" type="button" data-add-to-cart data-slug="${p.slug}" data-sticky-add>Add to cart</button>
    </div>`;

  return {
    title: `${p.name} — ${p.subtitle} | ${brand.name}`,
    description: p.description.slice(0, 158),
    path: `/product/${p.slug}/`,
    body,
    bodyClass: 'pdp-page has-buybar',
    schemas: [
      jsonld(productSchema(p)),
      jsonld(
        breadcrumbSchema([
          { name: 'Home', href: '/' },
          { name: 'Shop', href: '/shop/' },
          { name: p.name, href: `/product/${p.slug}/` },
        ]),
      ),
    ],
    preload: [
      {
        href: `/assets/img/${p.slug}-front-960.webp`,
        srcset: `/assets/img/${p.slug}-front-480.webp 480w, /assets/img/${p.slug}-front-960.webp 960w`,
        sizes: '(max-width: 960px) 92vw, 600px',
      },
    ],
  };
}

/* checkout ────────────────────────────────────────────────────────────── */
export function cart() {
  const body = `
    <div class="shell">
      <div class="page-head">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol><li><a href="/">Home</a></li><li>Cart</li></ol>
        </nav>
        <h1>Your cart</h1>
        <p class="lede" style="margin-top:var(--space-3)">Shipping, tax and return terms are shown before you sign in or enter payment details. Nothing is added at the last step.</p>
      </div>

      <div class="cart-layout">
        <div>
          <div class="shipping-meter" data-shipping-meter hidden>
            <p style="margin:0" data-meter-copy></p>
            <div class="meter" role="progressbar" aria-label="Progress toward free standard shipping" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-meter-bar>
              <span style="width:0%"></span>
            </div>
          </div>

          <div data-cart-lines aria-live="polite"></div>

          <div class="empty-state" data-cart-empty hidden>
            <h2>Your cart is empty</h2>
            <p style="margin-inline:auto">Start with the concern you want to solve, not the category. Every listing filters by symptom.</p>
            <a class="btn btn-primary" href="/shop/">Shop all products</a>
          </div>

          <p style="margin-top:var(--space-5)"><a class="link-arrow" href="/shop/">← Continue shopping</a></p>

          <div class="notice" style="margin-top:var(--space-6)">
            ${icons.info()}
            <p>Prices are in INR (₹) and exclude GST. GST is estimated from your delivery address on the next screen and confirmed before payment. Nothing is collected on delivery.</p>
          </div>
        </div>

        <aside class="summary-card" aria-labelledby="summary-title">
          <h2 id="summary-title">Order summary</h2>

          <div class="summary-row"><span>Subtotal</span><span class="val" data-subtotal>${money(0)}</span></div>

          <div class="form-row" style="margin-block:var(--space-3)">
            <label class="field-label" for="cart-shipping">Delivery estimate</label>
            <select class="select-full" id="cart-shipping" data-shipping-select>
              <option value="standard">India standard — 3–5 business days (${money(policies.shipping.standard.price)})</option>
              <option value="express">India express — 1–2 business days (${money(policies.shipping.express.price)})</option>
            </select>
          </div>

          <div class="summary-row"><span>Shipping</span><span class="val" data-shipping>${money(0)}</span></div>
          <div class="summary-row">
            <span>GST (estimated)</span><span class="val" data-tax>${money(0)}</span>
          </div>
          <div class="summary-total"><span>Estimated total</span><span class="val num" data-total>${money(0)}</span></div>
          <p class="summary-note">GST is calculated on the destination address. Final total is confirmed before payment.</p>

          <a class="btn btn-primary btn-block" href="/checkout/" data-checkout-link aria-disabled="true">Continue to checkout</a>
          ${trustRow({ compact: true })}
          <p class="summary-note" style="margin-top:var(--space-2)"><a href="/help/#returns">30-day return policy</a> · <a href="/help/#shipping">Shipping rates</a></p>
        </aside>
      </div>
    </div>

    <noscript>
      <div class="shell"><div class="notice">${icons.info()}<p>JavaScript is off, so the cart cannot render. You can still browse and add items by contacting ${brand.email}. We are rebuilding these pages to work without JavaScript.</p></div></div>
    </noscript>`;

  return {
    title: `Your cart — ${brand.name}`,
    description: 'Review your cart, delivery estimate, tax and return terms before checkout.',
    path: '/cart/',
    body,
    noindex: true,
    schemas: [
      `<script type="application/ld+json">${JSON.stringify(
        breadcrumbSchema([
          { name: 'Home', href: '/' },
          { name: 'Cart', href: '/cart/' },
        ]),
      )}</script>`,
    ],
  };
}

export function checkout() {
  const body = `
    <div class="shell">
      <div class="checkout-head">
        <h1>Checkout</h1>
        <p class="meta" style="margin-top:var(--space-2)">Guest checkout is the default. No account is required to order, track or return.</p>

        <ol class="steps" data-steps aria-label="Checkout progress">
          <li class="step" data-step="1" data-state="current">
            <span class="step-dot" aria-hidden="true">1</span>
            <span>Contact</span>
          </li>
          <li class="step" data-step="2" data-state="upcoming">
            <span class="step-dot" aria-hidden="true">2</span>
            <span>Delivery</span>
          </li>
          <li class="step" data-step="3" data-state="upcoming">
            <span class="step-dot" aria-hidden="true">3</span>
            <span>Payment</span>
          </li>
        </ol>
        <p class="visually-hidden" role="status" aria-live="polite" data-step-status>Step 1 of 3: contact</p>
      </div>

      <div class="checkout-layout">
        <div>
          <div class="error-summary" data-error-summary hidden tabindex="-1" role="alert">
            <h2>Check the highlighted fields</h2>
            <ul data-error-list></ul>
          </div>

          <form data-checkout-form novalidate>
            <div class="form-section" data-step-panel="1">
              <h2>Contact</h2>
              <p>For the order confirmation and tracking link. We do not send marketing unless you opt in at the end.</p>
              <div class="form-grid">
                <div class="form-row span-2">
                  <label class="field-label" for="email">Email address</label>
                  <input class="input" id="email" name="email" type="email" inputmode="email" autocomplete="email" required aria-describedby="email-help email-error" placeholder="you@example.com">
                  <p class="field-help" id="email-help">Used for the receipt and tracking updates only.</p>
                  <p class="field-error" id="email-error" data-error-for="email"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/></svg><span></span></p>
                </div>
                <div class="form-row span-2">
                  <a class="text-link" href="#signin" style="justify-self:start">Already have an account? Sign in</a>
                </div>
              </div>
            </div>

            <div class="form-section" data-step-panel="2" hidden>
              <h2>Delivery</h2>
              <p>Shipping cost and tax update as soon as you choose a method. Nothing changes after you pay.</p>
              <div class="form-grid">
                <div class="form-row">
                  <label class="field-label" for="first-name">First name</label>
                  <input class="input" id="first-name" name="firstName" type="text" autocomplete="given-name" required aria-describedby="first-name-error">
                  <p class="field-error" id="first-name-error" data-error-for="firstName"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/></svg><span></span></p>
                </div>
                <div class="form-row">
                  <label class="field-label" for="last-name">Last name</label>
                  <input class="input" id="last-name" name="lastName" type="text" autocomplete="family-name" required aria-describedby="last-name-error">
                  <p class="field-error" id="last-name-error" data-error-for="lastName"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/></svg><span></span></p>
                </div>
                <div class="form-row span-2">
                  <label class="field-label" for="address">Street address</label>
                  <input class="input" id="address" name="address" type="text" autocomplete="address-line1" required aria-describedby="address-error">
                  <p class="field-error" id="address-error" data-error-for="address"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/></svg><span></span></p>
                </div>
                <div class="form-row">
                  <label class="field-label" for="city">City</label>
                  <input class="input" id="city" name="city" type="text" autocomplete="address-level2" required aria-describedby="city-error">
                  <p class="field-error" id="city-error" data-error-for="city"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/></svg><span></span></p>
                </div>
                <div class="form-row">
                  <label class="field-label" for="state">State / UT</label>
                  <select class="select-full" id="state" name="state" autocomplete="address-level1" required aria-describedby="state-error">
                    <option value="">Select a state or UT</option>
                    <option>Andhra Pradesh</option><option>Arunachal Pradesh</option><option>Assam</option><option>Bihar</option>
                    <option>Chhattisgarh</option><option>Goa</option><option>Gujarat</option><option>Haryana</option>
                    <option>Himachal Pradesh</option><option>Jharkhand</option><option>Karnataka</option><option>Kerala</option>
                    <option>Madhya Pradesh</option><option>Maharashtra</option><option>Manipur</option><option>Meghalaya</option>
                    <option>Mizoram</option><option>Nagaland</option><option>Odisha</option><option>Punjab</option>
                    <option>Rajasthan</option><option>Sikkim</option><option>Tamil Nadu</option><option>Telangana</option>
                    <option>Tripura</option><option>Uttar Pradesh</option><option>Uttarakhand</option><option>West Bengal</option>
                    <option>Andaman and Nicobar Islands</option><option>Chandigarh</option>
                    <option>Dadra and Nagar Haveli and Daman and Diu</option><option>Delhi</option>
                    <option>Jammu and Kashmir</option><option>Ladakh</option><option>Lakshadweep</option><option>Puducherry</option>
                  </select>
                  <p class="field-error" id="state-error" data-error-for="state"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/></svg><span></span></p>
                </div>
                <div class="form-row">
                  <label class="field-label" for="zip">PIN code</label>
                  <input class="input" id="zip" name="zip" type="text" inputmode="numeric" pattern="[1-9][0-9]{5}" autocomplete="postal-code" required aria-describedby="zip-help zip-error" placeholder="400001">
                  <p class="field-help" id="zip-help">6 digits. Used to calculate GST.</p>
                  <p class="field-error" id="zip-error" data-error-for="zip"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/></svg><span></span></p>
                </div>
                <div class="form-row span-2">
                  <fieldset style="border:0;padding:0;margin:0">
                    <legend class="field-label">Shipping method</legend>
                    <div style="display:grid;gap:var(--space-2)">
                      <label class="radio-card">
                        <input type="radio" name="shippingMethod" value="standard" checked>
                        <span><strong>Standard</strong><br><span class="meta">3–5 business days</span></span>
                        <span class="radio-price">${money(policies.shipping.standard.price)}</span>
                      </label>
                      <label class="radio-card">
                        <input type="radio" name="shippingMethod" value="express">
                        <span><strong>Express</strong><br><span class="meta">1–2 business days</span></span>
                        <span class="radio-price">${money(policies.shipping.express.price)}</span>
                      </label>
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>

            <div class="form-section" data-step-panel="3" hidden>
              <h2>Payment</h2>
              <p>Card details go directly to the payment processor. They are never stored on our servers.</p>
              <div class="form-grid">
                <div class="form-row span-2">
                  <label class="field-label" for="card">Card number</label>
                  <input class="input" id="card" name="card" type="text" inputmode="numeric" autocomplete="cc-number" required aria-describedby="card-help card-error" placeholder="1234 5678 9012 3456" maxlength="23">
                  <p class="field-help" id="card-help">Visa, Mastercard, American Express.</p>
                  <p class="field-error" id="card-error" data-error-for="card"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/></svg><span></span></p>
                </div>
                <div class="form-row">
                  <label class="field-label" for="expiry">Expiry (MM/YY)</label>
                  <input class="input" id="expiry" name="expiry" type="text" inputmode="numeric" autocomplete="cc-exp" required aria-describedby="expiry-error" placeholder="09/29" maxlength="5">
                  <p class="field-error" id="expiry-error" data-error-for="expiry"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/></svg><span></span></p>
                </div>
                <div class="form-row">
                  <label class="field-label" for="cvc">Security code</label>
                  <input class="input" id="cvc" name="cvc" type="text" inputmode="numeric" autocomplete="cc-csc" required aria-describedby="cvc-help cvc-error" placeholder="123" maxlength="4">
                  <p class="field-help" id="cvc-help">3 digits on the back, 4 on the front for Amex.</p>
                  <p class="field-error" id="cvc-error" data-error-for="cvc"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/></svg><span></span></p>
                </div>
                <div class="form-row span-2">
                  <label class="field-label" for="card-name">Name on card</label>
                  <input class="input" id="card-name" name="cardName" type="text" autocomplete="cc-name" required aria-describedby="card-name-error">
                  <p class="field-error" id="card-name-error" data-error-for="cardName"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/></svg><span></span></p>
                </div>
                <div class="form-row span-2">
                  <label class="checkbox-row">
                    <input type="checkbox" name="marketing">
                    <span>Email me restock alerts and new formulas. Unchecked by default; no more than one email a month.</span>
                  </label>
                </div>
              </div>

              <div class="pay-block" style="margin-top:var(--space-5)">
                <p class="summary-note" data-pay-breakdown style="margin:0 0 var(--space-3);font-size:var(--text-sm);color:var(--ink)"></p>
                <button class="btn btn-primary btn-block" type="submit" data-place-order>Pay <span data-pay-total>${money(0)}</span></button>
                ${trustRow()}
                <p class="secure-line">${icons.lock()}<span>Encrypted (TLS 1.3). Card details are tokenised by our processor; we store only the last four digits.</span></p>
              </div>
              <p class="summary-note">By placing the order you agree to the <a href="/help/#returns">return policy</a> and <a href="/help/#account">privacy notice</a>. You can cancel before dispatch from the tracking page.</p>
            </div>

            <div class="checkout-actions">
              <button class="btn btn-quiet" type="button" data-step-back hidden>Back</button>
              <button class="btn btn-primary" type="button" data-step-next>Continue to delivery</button>
            </div>
            <p class="checkout-actions" style="justify-content:flex-start"><a class="link-arrow" href="/cart/">← Return to cart</a></p>
          </form>
        </div>

        <aside class="summary-card" aria-labelledby="co-summary">
          <h2 id="co-summary">Order summary</h2>
          <div class="order-items" data-order-items></div>
          <div class="summary-row"><span>Subtotal</span><span class="val" data-co-subtotal>${money(0)}</span></div>
          <div class="summary-row"><span>Shipping</span><span class="val" data-co-shipping>${money(0)}</span></div>
          <div class="summary-row"><span>GST (estimated)</span><span class="val" data-co-tax>${money(0)}</span></div>
          <div class="summary-total"><span>Total</span><span class="val num" data-co-total>${money(0)}</span></div>
          <p class="summary-note">GST estimate uses the PIN code you enter on the delivery step. The amount charged is the amount shown here.</p>
          <p class="summary-note"><a href="/cart/">Edit cart</a> · <a href="/help/#returns">30-day returns</a></p>
        </aside>
      </div>
    </div>

    <section class="confirmation" data-confirmation hidden tabindex="-1">
      <p class="eyebrow">Order confirmed</p>
      <h2 style="font-size:var(--text-3xl);margin-bottom:var(--space-3)">Thank you — your order is in.</h2>
      <p class="confirm-number">Order <span data-order-number></span></p>
      <p>A receipt and tracking link are on the way to <strong data-confirm-email></strong>. Orders placed before 2 pm IST ship the same business day from Vijayawada.</p>
      <div class="notice">${icons.truck()}<p>Track this order any time with your order number and email — no account needed.</p></div>
      <a class="btn btn-primary" href="/account/">Track this order</a>
      <a class="btn btn-quiet" href="/shop/" style="margin-left:var(--space-2)">Keep shopping</a>
    </section>`;

  const bodyWithEmpty = `<div class="empty-state" data-checkout-empty hidden style="margin:var(--space-8) auto;max-width:720px">
      <h2 style="font-size:var(--text-3xl)">Your cart is empty</h2>
      <p style="margin-inline:auto">Add a product before checking out. Filter by the symptom you want to treat.</p>
      <a class="btn btn-primary" href="/shop/">Shop all products</a>
    </div>${body}`;

  void products;

  return {
    title: `Checkout — ${brand.name}`,
    description: 'Guest checkout with shipping, tax and return terms shown before payment.',
    path: '/checkout/',
    body: bodyWithEmpty,
    noindex: true,
    schemas: [],
  };
}

/* account ─────────────────────────────────────────────────────────────── */

export function account() {
  const body = `
    <div class="shell">
      <div class="page-head">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol><li><a href="/">Home</a></li><li aria-current="page">Account</li></ol>
        </nav>
        <h1>Your account</h1>
        <p class="lede" style="margin-top:var(--space-3)">Orders, saved addresses and returns live here. Guest checkout is the default, so an account is never needed to buy or to follow a parcel.</p>
      </div>

      <div class="account-grid">
        <nav class="account-nav" aria-label="Account sections">
          <h2>Account</h2>
          <a href="#orders" aria-current="true">Orders and tracking</a>
          <a href="#reorders">Buy it again</a>
          <a href="#returns">Returns</a>
          <a href="#addresses">Addresses</a>
          <a href="#payment">Payment methods</a>
          <a href="/help/#account">Privacy and data</a>
        </nav>

        <div>
          <section class="panel" id="orders" aria-labelledby="orders-title">
            <div class="panel-head">
              <h2 id="orders-title">Orders and tracking</h2>
            </div>
            <div class="empty-state" style="margin:0">
              <h3 style="margin-bottom:var(--space-2)">No orders yet</h3>
              <p style="margin-inline:auto">Orders appear here with a tracking timeline. Guest orders can be followed from the link in the dispatch email, so an account is never required.</p>
              <a class="btn btn-primary" href="/shop/">Browse the range</a>
            </div>
          </section>

          <section class="panel" id="reorders" aria-labelledby="reorder-title">
            <div class="panel-head">
              <div>
                <h2 id="reorder-title">Buy it again</h2>
                <p class="meta" style="margin:var(--space-1) 0 0">After a delivery, the items you bought appear here with their size already selected.</p>
              </div>
            </div>
          </section>

          <section class="panel" id="returns" aria-labelledby="returns-title">
            <div class="panel-head">
              <div>
                <h2 id="returns-title">Returns</h2>
                <p class="meta" style="margin:var(--space-1) 0 0">${policies.returns.summary}</p>
              </div>
            </div>
            <p style="margin:0;font-size:var(--text-sm);color:var(--ink-muted)">Returns open from a delivered order: choose the item, print the prepaid label and drop it at any courier point. Refunds go to the original payment method — no store credit by default.</p>
          </section>

          <section class="panel" id="addresses" aria-labelledby="addr-title">
            <div class="panel-head"><h2 id="addr-title">Addresses</h2></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-4)">
              <div style="padding:var(--space-4);border:1px solid var(--rule);background:var(--surface-raised)">
                <p class="eyebrow" style="margin-bottom:6px">Default shipping</p>
                <p style="margin:0;font-size:var(--text-sm)">No saved address.<br>Guest checkout collects one each time; saving it needs a signed-in account.</p>
              </div>
              <div style="padding:var(--space-4);border:1px solid var(--rule);background:var(--surface-raised)">
                <p class="eyebrow" style="margin-bottom:6px">Billing</p>
                <p style="margin:0;font-size:var(--text-sm)">No saved billing address.</p>
              </div>
            </div>
            <p class="meta" style="margin:var(--space-3) 0 0">Address changes apply to future orders. To change the address on an order that has not shipped, use <a href="/help/#orders">order help</a>.</p>
          </section>

          <section class="panel" id="payment" aria-labelledby="pay-title">
            <div class="panel-head"><h2 id="pay-title">Payment methods</h2></div>
            <p style="margin:0;font-size:var(--text-sm);color:var(--ink-muted)">No saved cards. Card details are entered at checkout and held by the payment processor; we keep the brand and last four digits only, and only if you choose to save them.</p>
            <p class="meta" style="margin:var(--space-3) 0 0"><a href="/help/#account">How payment data is handled</a>.</p>
          </section>

          <section class="panel" aria-labelledby="history-title">
            <div class="panel-head"><h2 id="history-title">Order history</h2></div>
            <p style="margin:0;font-size:var(--text-sm);color:var(--ink-muted)">Nothing yet. Every order you place is listed here with its date, total and status.</p>
          </section>
        </div>
      </div>
    </div>
`;

  return {
    title: `Your account — ${brand.name}`,
    description: 'Sign in to see orders, saved addresses and returns. Guest checkout needs no account.',
    path: '/account/',
    body,
    noindex: true,
    schemas: [
      `<script type="application/ld+json">${JSON.stringify(
        breadcrumbSchema([
          { name: 'Home', href: '/' },
          { name: 'Account', href: '/account/' },
        ]),
      )}</script>`,
    ],
  };
}

/* help ────────────────────────────────────────────────────────────────── */
/* privacy ───────────────────────────────────────────────────────────────── */
export function privacy() {
  const body = `
    <div class="shell">
      <div class="page-head legal-head">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol><li><a href="/">Home</a></li><li aria-current="page">Privacy notice</li></ol>
        </nav>
        <p class="eyebrow">Legal · Privacy</p>
        <h1>Privacy notice</h1>
        <p class="lede" style="margin-top:var(--space-3)">What we collect when you order, why we hold it, who it reaches, and how to have it removed.</p>
        <p class="meta" style="margin-top:var(--space-3)">Effective 4 November 2026 · ${brand.legalName} · ${brand.address.city}, ${brand.address.region}</p>
      </div>

      <div class="account-grid legal-grid">
        <nav class="account-nav" aria-labelledby="toc-h">
          <h2 id="toc-h">On this page</h2>
          <a href="#summary">The short version</a>
          <a href="#who">Who we are</a>
          <a href="#collect">What we collect</a>
          <a href="#why">Why we use it</a>
          <a href="#not">What we do not do</a>
          <a href="#share">Who it reaches</a>
          <a href="#retention">How long we keep it</a>
          <a href="#rights">Your rights</a>
          <a href="#security">Security</a>
          <a href="#children">Children</a>
          <a href="#grievance">Grievance officer</a>
        </nav>

        <div class="legal-body">
          <section class="panel legal-summary" id="summary" aria-labelledby="summary-h">
            <h2 id="summary-h">The short version</h2>
            <div class="notice" style="margin:0">
              ${icons.info()}
              <p>We collect only what an order needs, we never store card numbers, we run no analytics and sell no data, and you can ask us to correct or delete what we hold. The detail is below.</p>
            </div>
          </section>

      <section class="panel" id="who" aria-labelledby="who-h">
        <h2 id="who-h">Who we are</h2>
        <p>${brand.legalName} is the data fiduciary for the information described here. Our registered address is ${brand.address.street}, ${brand.address.city}, ${brand.address.region} ${brand.address.postalCode}, India. Write to <a href="mailto:${brand.email}">${brand.email}</a> or call <a href="tel:${brand.phone.replace(/\s/g, '')}">${brand.phone}</a>.</p>
      </section>

      <section class="panel" id="collect" aria-labelledby="collect-h">
        <h2 id="collect-h">What we collect</h2>
        <ul class="benefits">
          <li><strong>Order details:</strong> your name, delivery address, phone number and email, plus the items, sizes and amounts in the order.</li>
          <li><strong>Payment confirmation:</strong> the card brand and last four digits, or the UPI reference. Full card numbers are entered at the payment processor and never reach us.</li>
          <li><strong>Messages you send us:</strong> support email, return requests and anything you write in them.</li>
          <li><strong>Cart contents:</strong> stored in your own browser using local storage so a refresh does not empty your bag. This stays on your device and is not sent to us.</li>
        </ul>
      </section>

      <section class="panel" id="why" aria-labelledby="why-h">
        <h2 id="why-h">Why we use it</h2>
        <ul class="benefits">
          <li>To take payment, pack and deliver your order, and to tell you where it is.</li>
          <li>To handle returns, refunds and replacements inside the 30-day window.</li>
          <li>To answer your questions and keep a record of what we told you.</li>
          <li>To meet tax, accounting and consumer-protection duties that apply to a seller in India.</li>
          <li>To send marketing email, only where you have asked for it. Every message carries an unsubscribe link.</li>
        </ul>
      </section>

      <section class="panel" id="not" aria-labelledby="not-h">
        <h2 id="not-h">What we do not do</h2>
        <p>We do not run analytics or advertising cookies, we do not embed third-party trackers, and we do not sell or rent personal data. Fonts and scripts are served from this site, so loading a page does not contact an outside advertising network.</p>
      </section>

      <section class="panel" id="share" aria-labelledby="share-h">
        <h2 id="share-h">Who it reaches</h2>
        <ul class="benefits">
          <li><strong>Our delivery partner</strong> receives the name, address and phone number needed to hand over the parcel.</li>
          <li><strong>Our payment processor</strong> receives the payment data you enter. We receive only the outcome and the last four digits.</li>
          <li><strong>A statutory authority</strong>, where Indian law requires disclosure, or a court order.</li>
        </ul>
        <p style="margin-bottom:0">No other party receives your data, and no data is transferred outside India except where a processor's infrastructure requires it under contract.</p>
      </section>

      <section class="panel" id="retention" aria-labelledby="retention-h">
        <h2 id="retention-h">How long we keep it</h2>
        <ul class="benefits">
          <li>Order and tax records: eight years, as required for books of account.</li>
          <li>Support messages: 24 months after the conversation closes.</li>
          <li>Marketing consent: until you withdraw it.</li>
          <li>Cart data: until you clear it in your browser.</li>
        </ul>
      </section>

      <section class="panel" id="rights" aria-labelledby="rights-h">
        <h2 id="rights-h">Your rights</h2>
        <p>Under the Digital Personal Data Protection Act, 2023 you can ask for a copy of your data, have it corrected or erased, withdraw consent, and nominate someone to act for you. Write to the grievance contact below and we will act on the request, or explain in writing why a legal record has to be kept.</p>
        <p style="margin-bottom:0">If you are not satisfied with our response, you can complain to the Data Protection Board of India.</p>
      </section>

      <section class="panel" id="security" aria-labelledby="security-h">
        <h2 id="security-h">Security</h2>
        <p style="margin-bottom:0">Pages are served over HTTPS. Access to order records is limited to the people who pack and support orders, and card numbers are never stored on our servers.</p>
      </section>

      <section class="panel" id="children" aria-labelledby="children-h">
        <h2 id="children-h">Children</h2>
        <p style="margin-bottom:0">The shop is intended for adults. We do not knowingly collect data from anyone under 18. If a minor's details reach us, write to the grievance contact and we will delete them.</p>
      </section>

      <section class="panel" id="grievance" aria-labelledby="grievance-h">
        <h2 id="grievance-h">Grievance officer</h2>
        <div class="notice" style="margin-top:var(--space-3)">${icons.info()}<p><strong>Grievance officer, ${brand.legalName}</strong><br>${brand.address.street}, ${brand.address.city}, ${brand.address.region} ${brand.address.postalCode}, India<br><a href="mailto:${brand.email}">${brand.email}</a> · <a href="tel:${brand.phone.replace(/\s/g, '')}">${brand.phone}</a></p></div>
        <p style="margin-bottom:0">We acknowledge a complaint within 48 hours and resolve it within 30 days. Nothing in this notice limits your rights under the Consumer Protection Act, 2019.</p>
      </section>
        </div>
      </div>
    </div>`;

  return {
    title: `Privacy notice — ${brand.name}`,
    description:
      'What we collect when you order, why we hold it, who it reaches, how long we keep it, and how to exercise your rights or complain.',
    path: '/privacy/',
    body,
    schemas: [],
  };
}

/* terms ─────────────────────────────────────────────────────────────────── */
export function terms() {
  const body = `
    <div class="shell">
      <div class="page-head legal-head">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol><li><a href="/">Home</a></li><li aria-current="page">Terms of sale</li></ol>
        </nav>
        <p class="eyebrow">Legal · Terms</p>
        <h1>Terms of sale</h1>
        <p class="lede" style="margin-top:var(--space-3)">What you agree to when you buy from ${brand.legalName}: prices, delivery, returns and the law that governs the sale.</p>
        <p class="meta" style="margin-top:var(--space-3)">Effective 4 November 2026 · ${brand.legalName} · ${brand.address.city}, ${brand.address.region}</p>
      </div>

      <div class="account-grid legal-grid">
        <nav class="account-nav" aria-labelledby="terms-toc-h">
          <h2 id="terms-toc-h">On this page</h2>
          <a href="#in-short">In short</a>
          <a href="#agreement">These terms</a>
          <a href="#products">The products</a>
          <a href="#prices">Prices and payment</a>
          <a href="#orders">Orders and acceptance</a>
          <a href="#delivery">Delivery</a>
          <a href="#returns">Returns and refunds</a>
          <a href="#liability">Liability</a>
          <a href="#law">Governing law</a>
        </nav>

        <div class="legal-body">
          <section class="panel legal-summary" id="in-short" aria-labelledby="in-short-h">
            <h2 id="in-short-h">In short</h2>
            <ul class="benefits" style="margin:0">
              <li>Prices are in INR; GST appears in the summary before you pay.</li>
              <li>Standard delivery is ${money(policies.shipping.standard.price)} (${policies.shipping.standard.days}), express ${money(policies.shipping.express.price)} (${policies.shipping.express.days}), free over ${money(policies.shipping.freeThreshold)}.</li>
              <li>30 days to return a product, opened or unopened, with a prepaid label.</li>
              <li>A contract forms when we dispatch, not when payment is taken.</li>
            </ul>
          </section>

      <section class="panel" id="agreement" aria-labelledby="agreement-h">
        <h2 id="agreement-h">These terms</h2>
        <p style="margin-bottom:0">Placing an order means you accept these terms. They sit alongside your rights under the Consumer Protection Act, 2019, which they do not replace or reduce. Our registered address is ${brand.address.street}, ${brand.address.city}, ${brand.address.region} ${brand.address.postalCode}.</p>
      </section>

      <section class="panel" id="products" aria-labelledby="products-h">
        <h2 id="products-h">The products</h2>
        <ul class="benefits">
          <li>Everything we sell is a cosmetic for external use. Nothing here is a medicine, and no product is intended to diagnose, treat or cure a condition.</li>
          <li>Patch test on the inner forearm for two nights before a first full application, and stop using anything that stings or reddens.</li>
          <li>If you are pregnant, breastfeeding or using prescription actives, ask a clinician before starting retinal or azelaic acid.</li>
          <li>Packaging and carton artwork may change between batches. The formula, size and concentration on the product page are what you are buying.</li>
        </ul>
      </section>

      <section class="panel" id="prices" aria-labelledby="prices-h">
        <h2 id="prices-h">Prices and payment</h2>
        <p style="margin-bottom:0">Prices are in Indian rupees and include the product only. GST is calculated on the delivery address and shown in the order summary before you pay. We can change prices at any time, but never after you have paid for an order.</p>
      </section>

      <section class="panel" id="orders" aria-labelledby="orders-h">
        <h2 id="orders-h">Orders and acceptance</h2>
        <p style="margin-bottom:0">A contract forms when we dispatch your parcel, not when the payment is taken. If an item is out of stock, the price was listed in error, or we cannot verify an order, we will cancel it and refund the full amount to the original payment method within 3–5 business days.</p>
      </section>

      <section class="panel" id="delivery" aria-labelledby="delivery-h">
        <h2 id="delivery-h">Delivery</h2>
        <p>Parcels leave ${brand.address.city} on the same business day when the order is placed before 2&nbsp;pm&nbsp;IST. Standard delivery is ${money(policies.shipping.standard.price)} and takes ${policies.shipping.standard.days}; express is ${money(policies.shipping.express.price)} and takes ${policies.shipping.express.days}. Orders over ${money(policies.shipping.freeThreshold)} ship free at the standard rate.</p>
        <p style="margin-bottom:0">We deliver across India. Give an address where someone can receive the parcel; if it comes back to us undelivered, we will contact you before refunding the item value.</p>
      </section>

      <section class="panel" id="returns" aria-labelledby="returns-h">
        <h2 id="returns-h">Returns and refunds</h2>
        <p style="margin-bottom:0">${policies.returns.summary} Opened products are eligible. Damaged or wrong items are replaced or refunded in full, including shipping. Start a return from <a href="/help/#returns">the returns section</a> or reply to your order email.</p>
      </section>

      <section class="panel" id="liability" aria-labelledby="liability-h">
        <h2 id="liability-h">Liability</h2>
        <p style="margin-bottom:0">Use the products as directed on the carton. To the extent Indian law allows, our liability for an order is limited to what you paid for it. That limit does not apply to death or personal injury caused by our negligence, to defective products, or to anything else the law does not permit us to exclude.</p>
      </section>

      <section class="panel" id="law" aria-labelledby="law-h">
        <h2 id="law-h">Governing law and contact</h2>
        <p>These terms are governed by Indian law, and the courts at ${brand.address.city}, ${brand.address.region} have jurisdiction.</p>
        <p style="margin-bottom:0"><a href="mailto:${brand.email}">${brand.email}</a> · <a href="tel:${brand.phone.replace(/\s/g, '')}">${brand.phone}</a> · <a href="/privacy/#grievance">Grievance officer</a></p>
      </section>
        </div>
      </div>
    </div>`;

  return {
    title: `Terms of sale — ${brand.name}`,
    description:
      'The terms that apply when you buy: prices and GST, delivery times, order acceptance, the 30-day return window and the law that governs the sale.',
    path: '/terms/',
    body,
    schemas: [],
  };
}

export function help() {
  const body = `
    <div class="shell">
      <section class="help-hero">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol><li><a href="/">Home</a></li><li aria-current="page">Help</li></ol>
        </nav>
        <h1>How can we help?</h1>
        <p class="lede">Six categories, keyword titles, no ticket maze. Every answer below is the same answer our support team gives.</p>

        <form class="header-search help-search" role="search" data-help-search-form>
          <label class="visually-hidden" for="help-search">Search help topics</label>
          <div class="search-field">
            ${icons.search()}
            <input id="help-search" name="q" type="search" placeholder="Search help, e.g. “refund” or “guest checkout”" autocomplete="off" data-help-query>
            <button class="search-submit" type="submit" aria-label="Filter help topics">${icons.arrowRight()}</button>
          </div>
        </form>
        <p class="meta" role="status" aria-live="polite" data-help-status style="margin-top:var(--space-3)"></p>
      </section>

      <div class="topic-grid" data-help-topics>
        ${helpTopics
          .map(
            (t) => `<a class="topic-card" href="#${t.id}" data-help-item data-keywords="${[t.title, t.blurb, ...t.links].join(' ').toLowerCase()}">
              <span class="topic-count">${t.links.length} answers</span>
              <h2>${t.title}</h2>
              <p>${t.blurb}</p>
              <ul>${t.links.slice(0, 3).map((l) => `<li>${l}</li>`).join('')}</ul>
            </a>`,
          )
          .join('')}
      </div>
      <div class="empty-state" data-help-empty hidden style="margin-bottom:var(--space-6)">
        <h2>No help topic matches “<span data-help-term></span>”</h2>
        <p style="margin-inline:auto">Try “return”, “shipping”, “tracking”, “payment” or email <a href="mailto:${brand.email}">${brand.email}</a>.</p>
      </div>

      <div class="help-body">
        <div>
          <section id="orders" aria-labelledby="orders-h" data-help-item data-keywords="orders tracking where is my order address cancel status">
            <h2 id="orders-h" style="margin-bottom:var(--space-3)">Orders and tracking</h2>
            <p>Place an order and you get a tracking link immediately, plus a second email when the parcel moves. No account needed.</p>
            <div class="notice">${icons.truck()}<p><strong>Track without signing in:</strong> use your order number (for example CK-10482) and the email address on the order. <a href="/account/">Open the tracking dashboard</a>.</p></div>
            <ul class="benefits">
              <li>Orders placed before 2 pm IST ship the same business day.</li>
              <li>To change an address, contact us before the packing scan. After dispatch, the carrier can redirect.</li>
              <li>Status meanings: <strong>Packed</strong> means labelled, <strong>In transit</strong> means it has left our facility.</li>
            </ul>
          </section>

          <section id="returns" aria-labelledby="returns-h" data-help-item data-reveal data-keywords="returns refunds damaged wrong item return label" style="margin-top:var(--space-7)">
            <h2 id="returns-h" style="margin-bottom:var(--space-3)">Returns and refunds</h2>
            <p>${policies.returns.summary} Opened products are eligible; we would rather you try the formula than keep a full jar you cannot use.</p>
            <table class="rate-table">
              <caption class="visually-hidden">Return terms by region</caption>
              <thead><tr><th scope="col">Region</th><th scope="col">Window</th><th scope="col">Label</th></tr></thead>
              <tbody>
                <tr><td>India</td><td>30 days from delivery</td><td>Free prepaid pickup</td></tr>
              </tbody>
            </table>
            <p style="font-size:var(--text-sm);color:var(--ink-muted)">Refunds are issued to the original payment method within 3–5 business days of arrival at our warehouse. Damaged or wrong items are replaced or refunded in full, including shipping. <a href="/account/">Start a return in your account</a>.</p>
          </section>

          <section id="shipping" aria-labelledby="shipping-h" data-help-item data-reveal data-keywords="shipping rates delivery estimates gst india" style="margin-top:var(--space-7)">
            <h2 id="shipping-h" style="margin-bottom:var(--space-3)">Shipping and delivery</h2>
            <table class="rate-table">
              <caption class="visually-hidden">Shipping rates</caption>
              <thead><tr><th scope="col">Destination</th><th scope="col">Method</th><th scope="col">Time</th><th scope="col" style="text-align:right">Cost</th></tr></thead>
              <tbody>
                <tr><td>India</td><td>Standard</td><td>${policies.shipping.standard.days}</td><td class="num">${money(policies.shipping.standard.price)}</td></tr>
                <tr><td>India</td><td>Express</td><td>${policies.shipping.express.days}</td><td class="num">${money(policies.shipping.express.price)}</td></tr>
              </tbody>
            </table>
            <p style="font-size:var(--text-sm);color:var(--ink-muted)">Orders over ${money(policies.shipping.freeThreshold)} ship free at the standard rate. GST is calculated before payment and shown in the order summary — never collected on delivery.</p>
          </section>

          <section id="products" aria-labelledby="products-h" data-help-item data-reveal data-keywords="products routines layering retinal acids pregnancy patch test dry skin moisturiser" style="margin-top:var(--space-7)">
            <h2 id="products-h" style="margin-bottom:var(--space-3)">Products and routines</h2>
            <div class="faq-list">
              ${faqs
                .slice(3)
                .map(
                  (f) => `<details data-help-faq data-keywords="${(f.q + ' ' + f.a).toLowerCase().replace(/"/g, '&quot;')}">
                    <summary>${f.q}</summary>
                    <div class="faq-answer"><p>${f.a}</p></div>
                  </details>`,
                )
                .join('')}
            </div>
          </section>

          <section id="account" aria-labelledby="account-h" data-help-item data-reveal data-keywords="account payment privacy guest checkout card data consent analytics security" style="margin-top:var(--space-7)">
            <h2 id="account-h" style="margin-bottom:var(--space-3)">Account, payment and privacy</h2>
            <p style="font-size:var(--text-sm);color:var(--ink-muted)">Guest checkout is the default and always available. Accounts exist for reordering and saved addresses, not as a condition of purchase.</p>
            <div class="faq-list">
              <details data-help-faq data-keywords="guest checkout account required sign in">
                <summary>Do I need an account to check out?</summary>
                <div class="faq-answer"><p>No. Guest checkout is the default and the email on the order is enough to track it. You can create an account after delivery without re-entering payment details.</p></div>
              </details>
              <details data-help-faq data-keywords="card storage pci security payment processor">
                <summary>Do you store my card number?</summary>
                <div class="faq-answer"><p>No. Card details are entered directly into the payment processor. We store the card brand and last four digits so you can recognise a payment method, and never the full number or security code.</p></div>
              </details>
              <details data-help-faq data-keywords="analytics cookies consent privacy data sell">
                <summary>What loads before I consent?</summary>
                <div class="faq-answer"><p>Only the page, its stylesheet, two local scripts and fonts already on your device. Analytics and advertising tags load after consent, and we do not sell customer data. Order and address data is kept only as long as tax law requires.</p></div>
              </details>
            </div>
          </section>

          <section id="standards" aria-labelledby="standards-h" data-help-item data-reveal data-keywords="standards formulation fragrance animal testing sourcing clinical" style="margin-top:var(--space-7)">
            <h2 id="standards-h" style="margin-bottom:var(--space-3)">Our standards</h2>
            <ul class="benefits">
              <li><strong>No fragrance.</strong> No fragrance, essential oils, masking agents or dyes in any formula.</li>
              <li><strong>No unverifiable claims.</strong> Each claim states the participant count and timeframe, or it is removed.</li>
              <li><strong>No animal testing.</strong> Neither the formulas nor the ingredients are tested on animals, by us or our suppliers.</li>
              <li><strong>Batch records kept.</strong> Every jar carries a batch number that maps to its formulation and fill record.</li>
            </ul>
          </section>

          <section aria-labelledby="faq-h" data-reveal style="margin-top:var(--space-7)">
            <h2 id="faq-h" style="margin-bottom:var(--space-3)">Common questions</h2>
            <div class="faq-list">
              ${faqs
                .map(
                  (f) => `<details data-help-faq data-keywords="${(f.q + ' ' + f.a).toLowerCase().replace(/"/g, '&quot;')}">
                    <summary>${f.q}</summary>
                    <div class="faq-answer"><p>${f.a}</p></div>
                  </details>`,
                )
                .join('')}
            </div>
          </section>
        </div>

        <aside class="help-aside" aria-labelledby="contact-h">
          <h2 id="contact-h">Talk to a person</h2>
          <p>Replies within one business day, Monday to Friday, 9 am – 6 pm IST.</p>
          <a href="mailto:${brand.email}">${brand.email}</a>
          <a href="tel:${brand.phone.replace(/[^+\d]/g, '')}">${brand.phone}</a>
          <p class="meta" style="margin-top:var(--space-3)">Order number ready? It is in your confirmation email, format CK-XXXXX.</p>
          <hr>
          <a href="/account/">Track an order</a>
          <a href="/account/#returns">Start a return</a>
          <a href="/help/#shipping">Shipping rates</a>
          <a href="/help/#returns">Return policy</a>
        </aside>
      </div>
    </div>`;

  return {
    title: `Help and policies — ${brand.name}`,
    description:
      'Shipping rates, returns, tracking, payment and formulation standards. Answers written to be read in one screen.',
    path: '/help/',
    body,
    schemas: [
      jsonld(faqSchema(faqs)),
      jsonld(
        breadcrumbSchema([
          { name: 'Home', href: '/' },
          { name: 'Help', href: '/help/' },
        ]),
      ),
    ],
  };
}
