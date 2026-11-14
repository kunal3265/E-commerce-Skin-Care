# Clay & Kin — storefront

A dependency-free static storefront. The design, CRO and accessibility rules it follows are
written down in [`docs/blueprint.md`](docs/blueprint.md); every rule a machine can check is
checked by a script, and the rest are listed there as limitations.

- 8 products, 16 pages, 50 generated WebP images, **0 third-party requests, 0 webfonts**
- Prices in INR (₹) with Indian digit grouping; GST estimated at checkout
- Home page: **43.6 kB / 9 requests** initial transfer; PDP: **49.5 kB / 8 requests**
- Opens from disk: double-click `dist/index.html`, no server required
- **0 axe-core violations** across 9 routes × 2 viewports
- **0** non-inline controls below 48×48 px
- Handover checklist: [`docs/HANDOVER.md`](docs/HANDOVER.md)

## Quick start

```bash
npm install        # sharp (images), axe-core + puppeteer-core (verification)
npm run images     # generate the WebP set into dist/assets/img
npm run build      # build HTML, copy assets, emit catalog.js, sitemap, robots
npm run serve      # optional: http://127.0.0.1:4180
```

`npm run images` only needs to run when product art or dimensions change; `npm run build` preserves
the generated images.

### Open without a server

Run `npm run build`, then double-click **`dist/index.html`** (Ctrl+F5 reloads it like any page).
Every internal link and asset path is relative, so shop, product, cart, checkout, account and help
all work over `file://` — no localhost, no server process. Cart contents persist through
`localStorage` for that browser profile.

The trade-off is that addresses read `dist/product/barrier-repair-balm/index.html` instead of
`/product/barrier-repair-balm/`. Deploying the same `dist/` to any static host restores the clean
URLs, because every page is still a directory index.

## Verify

```bash
npm run contrast   # 17 palette pairs, computed ratios, fails under threshold
npm run audit      # labels, headings, schema parity, copy budget, checkout contracts
npm run verify     # contrast + build + audit
npm run verify:browser   # axe-core, screenshots, fold geometry (needs the server)
npm run palette          # measured 60-30-10 surface split (needs the server)
```

Reports are written to `docs/`: `contrast-matrix.md`, `build-report.md`, `a11y-report.md`,
`palette-share.md`. Screenshots go to `screenshots/`.

`npm run verify:browser` and `npm run palette` drive a local Chrome or Edge through
`puppeteer-core`; set `CHROME_PATH` if it is not found automatically. Start `npm run serve` first
(port 4180, or pass `PORT=`).

## Structure

```
assets/
  css/site.css        design tokens + every component (60-30-10 lives here)
  js/app.js           cart, intent search, facets, gallery, checkout validation, returns
  img/                favicon (product art is generated straight into dist)
src/
  catalog.mjs         products, policies, concerns and synonyms (single source of truth)
  render.mjs          document shell, header, footer, cards, JSON-LD builders
  pages.mjs           home, shop, product, cart, checkout, account, help
scripts/
  tasks.mjs           build · images · serve · contrast · audit · verify-browser · palette
docs/                 blueprint + generated reports
dist/                 portable build output — open dist/index.html directly
screenshots/          18 captures at 1440×900 and 390×844
```

## Key implementation notes

- **Colour.** Tokens only; no hex in components. Mocha Cream `#E4D1B4` is a surface colour, not a
  text colour (1.41:1 on Latte). Body copy uses Mocha Ink `#6B5340` at 6.75:1 — same hue, legible.
  `npm run contrast` is the gate.
- **Currency.** Prices are stored in whole rupees and formatted with `Intl.NumberFormat('en-IN')`,
  so grouping follows Indian convention (₹12,999, ₹1,20,000). GST is estimated at 18% from the
  PIN code; prices exclude GST and the total is shown before payment.
- **Motion.** Warm, low-amplitude transitions and reveals: header shadow, 4 px card lift with a
  1.04 image scale, button lift, panel rise, badge pop, gallery crossfade. Transform/opacity only,
  below-fold reveals, and every duration collapses under `prefers-reduced-motion`.
- **Type.** Two system stacks, no font files. 17 px body, 68ch measure, 11 px reserved for
  uppercase labels.
- **Buy path.** PDP desktop puts price at 457 px and CTA at 728 px in a 900 px viewport. Mobile
  reorders the page and adds a 69 px sticky buy bar so price + CTA sit at 775 px in an 844 px
  viewport.
- **Search.** Symptom synonyms resolve to concerns before products; ranked by name, concern
  membership and token matches; counts come from the catalog; full combobox keyboard support.
- **Checkout.** Guest-only path, three steps, inline validation with Luhn check, numeric keypads
  for PIN/card/expiry/CVC, Indian states, error summary focus management, policies single-sourced
  with the PDP.
- **Schema.** `Product` + per-size `Offer` + `BreadcrumbList` +
  `Organization` + `WebSite` + `ItemList` + `FAQPage`. The audit asserts JSON-LD price equals
  rendered price.
- **Portable links.** The build rewrites internal URLs relative to each page and stamps
  `data-base` on `<html>`; client-rendered links read it. The site runs from a host or from disk,
  and canonical/JSON-LD/sitemap URLs stay absolute.
- **State.** Cart lives in `localStorage` under `ck-cart-v1`; no cookies, no network calls after
  load.

## What is not production-ready

Payments, tax, inventory, order persistence, authentication and email are simulated. Product art
is generated vector illustration; the in-scale image is dimensionally accurate but should be
replaced with photography. No RUM or field Core Web Vitals data exists for this build. See
blueprint §16 and §17.

The brand domain and email are the reserved `clayandkin.example` placeholder. Set `brand.domain`
and `brand.email` in `src/catalog.mjs` before publishing, so canonical URLs, JSON-LD,
`sitemap.xml` and `robots.txt` point at the real host.

## Deploying

`vercel.json` sets the two things Vercel cannot infer: the build must generate the WebP packshots
first (`npm run images`), and the output lives in `dist/` rather than Vercel's default `public/`.
The same two values work for Netlify (`publish = "dist"`, `command = "npm run images && npm run build"`).
