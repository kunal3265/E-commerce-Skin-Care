# Handover — Clay & Kin storefront

A static, dependency-free storefront. No framework, no database, no build server at runtime:
`npm run build` writes `dist/`, and `dist/` is the whole site.

## Pages (16)

`/` · `/shop/` · 8 product pages under `/product/…` · `/help/` · `/account/` ·
`/checkout/` · `/cart/` · `/privacy/` · `/terms/`

## Commands

```bash
npm run images          # regenerate the WebP packshots into dist/assets/img
npm run build           # build HTML, copy assets, emit catalog.js, sitemap, robots
npm run verify          # palette contrast + build + audit (fails the build on violations)
npm run serve           # static server; PORT=4180 selects the port
npm run verify:browser  # axe-core, 18 screenshots, fold geometry (needs the server running)
```

`PORT=0` is set globally on some machines, so pass the port explicitly:
`PORT=4180 node scripts/tasks.mjs serve`.

## Five things only you can supply

**1. Domain and inbox** — two lines in `src/catalog.mjs`:

```js
domain: 'https://clayandkin.example',   // line 9
email:  'care@clayandkin.example',      // line 10
```

Every canonical URL, sitemap entry, JSON-LD `@id`, footer mailto and both legal pages derive from
these, so changing them changes the whole site. Rebuild after editing. To find any remaining
placeholder: `grep -rn 'clayandkin.example' src/`.

**2. Grievance officer's name** — the privacy notice currently publishes the role, postal address,
phone and email, but not a person's name, because inventing one would repeat exactly the problem
the site was cleaned of. Add the name in `src/pages.mjs`, in the `privacy()` grievance section.
The notice already commits to acknowledging a complaint in 48 hours and resolving it within 30 days.

**3. GSTIN, MRP and country of origin** — none of these appear anywhere in the site. An Indian
cosmetics label and a sale to a consumer both need them; they were deliberately left out rather
than faked. Do not ship them without your registration details.

**4. Product photography** — every packshot is generated from SVG inside `scripts/tasks.mjs`
(`npm run images` → `dist/assets/img/*.webp`, 50 files with a width ladder). Real photos are **not**
a drop-in: they need the same filenames and widths wired into the build, otherwise `srcset` and
`<img sizes>` will point at missing files.

**5. Git history** — this folder is not a repository and no author is configured. Run `git init`
and set `user.name` / `user.email` before the first commit so the history carries your name.

## What is verified, and what is not

Verified on this build: `npm run verify` (22 checks, 0 failures), **0 axe-core violations across
9 routes × 2 viewports**, 18 screenshots in `screenshots/`, all internal links and jump links
resolve, home **43.6 kB / 9 requests**, PDP **49.5 kB / 8 requests** (gzip, local server).

Not implemented — say so plainly if asked:

- **No payment gateway and no order processing.** Checkout and cart are front-end only; the cart
  persists in `localStorage` and nothing is charged, stored or emailed.
- **No analytics, no third-party requests, no webfonts.** This is a cost and privacy choice.
- **No CMS.** Products and copy live in `src/catalog.mjs`; editing them means editing that file
  and rebuilding.

## Before publishing

1. Replace the domain and email, rebuild, re-run `npm run verify` and `npm run verify:browser`.
2. Have a CA or lawyer read `/privacy/` and `/terms/` — they are written from the DPDP Act 2023,
   the Consumer Protection (E-Commerce) Rules 2020 and the 2019 Act, but they are not legal advice.
3. Replace the generated packshots with real photography, or keep the illustrations and say so.
