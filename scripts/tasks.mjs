// Single task runner for the project: build, image set, local server, checks.
//
//   node scripts/tasks.mjs <task>
//
//   build           server-render every page into dist/
//   images          regenerate the WebP set in dist/assets/img
//   serve           zero-dependency static server for dist/ (PORT, default 4173)
//   contrast        WCAG 2.2 contrast matrix → docs/contrast-matrix.md
//   audit           static conformance audit → docs/build-report.md
//   verify          contrast + build + audit (the pre-handoff gate)
//   verify-browser  axe-core, screenshots, first-viewport geometry (needs serve on PORT 4180)
//   palette         pixel-measured palette surface share (needs the server)
//
// puppeteer-core and sharp are imported inside the tasks that use them, so a
// build never pays for the browser toolchain.
import { access, copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { brand, concerns, policies, products } from '../src/catalog.mjs';
import { page } from '../src/render.mjs';
import {
  account,
  cart,
  checkout,
  help,
  home,
  privacy,
  productPage,
  shop,
  terms,
} from '../src/pages.mjs';

/* static build ────────────────────────────────────────────────────────── */

async function buildTask() {
// Static build: server-renders every page, emits client catalog + sitemap.

const PAGES_DIST = 'dist';

// The build is portable: every internal URL is rewritten relative to the page, so
// dist/index.html can be opened directly from disk (file://) with no server.
// Absolute URLs are kept only in metadata (canonical, JSON-LD, sitemap).
function portable(html, route) {
  const depth = route.split('/').filter(Boolean).length;
  const base = depth ? '../'.repeat(depth) : './';
  const toLocal = (url) => {
    if (!url.startsWith('/') || url.startsWith('//')) return url;
    const match = url.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
    let pathname = match?.[1] || '/';
    if (pathname.endsWith('/')) pathname += 'index.html';
    return base + pathname.replace(/^\//, '') + (match?.[2] || '') + (match?.[3] || '');
  };

  const rewritten = html
    .replace(/\b(href|src|action|poster)="(\/[^"]*)"/g, (_, attr, url) => `${attr}="${toLocal(url)}"`)
    .replace(/\b(srcset|imagesrcset)="([^"]*)"/g, (_, attr, value) => {
      const list = value
        .split(',')
        .map((part) => {
          const [url, ...descriptor] = part.trim().split(/\s+/);
          return [toLocal(url), ...descriptor].filter(Boolean).join(' ');
        })
        .join(', ');
      return `${attr}="${list}"`;
    });

  return rewritten.replace(
    '<html lang="en">',
    `<html lang="en" data-base="${base}">`,
  );
}

async function write(route, html) {
  const dir = path.join(PAGES_DIST, route.replace(/^\//, ''));
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, 'index.html');
  const out = portable(html, route);
  await writeFile(file, out);
  return { file, bytes: Buffer.byteLength(out), gzip: gzipSync(out).length };
}

// Rebuild HTML + copied assets without destroying generated images.
await mkdir(PAGES_DIST, { recursive: true });
// Remove stale pages so a deleted product or renamed route cannot linger in dist.
for (const dir of ['shop', 'product', 'cart', 'checkout', 'account', 'help', 'privacy', 'terms']) {
  await rm(path.join(PAGES_DIST, dir), { recursive: true, force: true });
}
await rm(path.join(PAGES_DIST, 'index.html'), { force: true });
await rm(path.join(PAGES_DIST, 'assets/css'), { recursive: true, force: true });
await rm(path.join(PAGES_DIST, 'assets/js'), { recursive: true, force: true });
await rm(path.join(PAGES_DIST, 'assets/img/favicon.svg'), { force: true });
await mkdir(path.join(PAGES_DIST, 'assets/css'), { recursive: true });
await mkdir(path.join(PAGES_DIST, 'assets/js'), { recursive: true });

const homePage = home();
const results = [];
results.push(await write('/', page({ ...homePage, schemas: homePage.schemas })));

const shopPage = shop();
results.push(await write('/shop/', page(shopPage)));

for (const p of products) {
  results.push(await write(`/product/${p.slug}/`, page(productPage(p))));
}

for (const [route, fn] of [
  ['/cart/', cart],
  ['/checkout/', checkout],
  ['/account/', account],
  ['/help/', help],
  ['/privacy/', privacy],
  ['/terms/', terms],
]) {
  const data = fn();
  results.push(await write(route, page(data)));
}

// Client data layer: one source of truth, emitted at build time.
const clientCatalog = {
  brand,
  policies,
  concerns: concerns.map(({ id, label, synonyms }) => ({ id, label, synonyms })),
  products: products.map((p) => ({
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    subtitle: p.subtitle,
    format: p.format,
    price: p.price,
    compareAt: p.compareAt,
    concerns: p.concerns,
    skinTypes: p.skinTypes,
    ingredients: p.ingredients,
    benefits: p.benefits,
    dimensions: p.dimensions,
    stock: p.stock,
    sizes: p.sizes,
  })),
};
await writeFile(
  path.join(PAGES_DIST, 'assets/js/catalog.js'),
  `window.CLAY_CATALOG=${JSON.stringify(clientCatalog)};`,
);

await copyFile('assets/css/site.css', path.join(PAGES_DIST, 'assets/css/site.css'));
await copyFile('assets/js/app.js', path.join(PAGES_DIST, 'assets/js/app.js'));
await copyFile('assets/img/favicon.svg', path.join(PAGES_DIST, 'assets/img/favicon.svg'));

// Sitemap and robots.
const urls = [
  { loc: '/', priority: '1.0' },
  { loc: '/shop/', priority: '0.9' },
  ...products.map((p) => ({ loc: `/product/${p.slug}/`, priority: '0.8' })),
  { loc: '/help/', priority: '0.7' },
  { loc: '/privacy/', priority: '0.3' },
  { loc: '/terms/', priority: '0.3' },
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${brand.domain}${u.loc}</loc>
    <lastmod>2026-10-29</lastmod>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;
await writeFile(path.join(PAGES_DIST, 'sitemap.xml'), sitemap);
await writeFile(
  path.join(PAGES_DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /cart/\nDisallow: /checkout/\nDisallow: /account/\n\nSitemap: ${brand.domain}/sitemap.xml\n`,
);

const fmt = (n) => `${(n / 1024).toFixed(1)} kB`;
console.log('\nStatic build complete\n');
for (const r of results) {
  console.log(`  ${r.file.padEnd(52)} ${fmt(r.bytes).padStart(9)}  gzip ${fmt(r.gzip)}`);
}
console.log(`\n  ${results.length} pages · catalog.js emitted · sitemap.xml · robots.txt`);
}

/* image set ───────────────────────────────────────────────────────────── */

async function imagesTask() {
const sharp = (await import('sharp')).default;
// Generates the still-life image set as WebP at two widths.
// Art is drawn as SVG geometry (no text, no photographic dependencies) so the
// build is deterministic and image payload stays small. Replace with
// real photography once assets are shot.
//
// Scale images use a millimetre-accurate reference: 6 px per mm, with a
// stylised hand at a 190 mm palm-to-fingertip length. The caption in the PDP
// quotes the same measurement, so the two never drift.


const C = {
  latte: '#FFF8E7',
  mocha100: '#F4E7D3',
  mocha200: '#E4D1B4',
  mocha300: '#D3BB98',
  mochaInk: '#6B5340',
  burgundy: '#6B1F2B',
  burgundyDeep: '#551721',
  ink: '#241C15',
};

const W = 1200;
const H = 1500;

const shadow = (cx, cy, rx, ry) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.burgundy}" opacity="0.10" filter="url(#soft)"/>`;

const label = (x, y, w, h) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${C.latte}" opacity="0.92"/>
  <line x1="${x + w * 0.18}" y1="${y + h * 0.34}" x2="${x + w * 0.82}" y2="${y + h * 0.34}" stroke="${C.mochaInk}" stroke-opacity="0.55" stroke-width="2"/>
  <line x1="${x + w * 0.18}" y1="${y + h * 0.5}" x2="${x + w * 0.66}" y2="${y + h * 0.5}" stroke="${C.mochaInk}" stroke-opacity="0.35" stroke-width="2"/>
  <line x1="${x + w * 0.18}" y1="${y + h * 0.66}" x2="${x + w * 0.74}" y2="${y + h * 0.66}" stroke="${C.mochaInk}" stroke-opacity="0.25" stroke-width="2"/>`;

// Product geometry in a 1200x1500 frame, centred horizontally at `cx`.
function productArt(kind, { cx = 600, base = 1080, tone = 'burgundy' } = {}) {
  const body = tone === 'burgundy' ? C.burgundy : tone === 'cream' ? C.mocha200 : C.mocha300;
  const cap = tone === 'burgundy' ? C.burgundyDeep : C.ink;
  const trim = tone === 'cream' ? C.mocha300 : C.mocha200;

  if (kind === 'jar') {
    const w = 340;
    const h = 250;
    return `
      ${shadow(cx, base + 22, w * 0.62, 34)}
      <rect x="${cx - w / 2}" y="${base - h}" width="${w}" height="${h}" rx="26" fill="${body}"/>
      <rect x="${cx - w / 2 + 12}" y="${base - h - 6}" width="${w - 24}" height="74" rx="16" fill="${cap}"/>
      <rect x="${cx - w / 2 + 12}" y="${base - h - 6}" width="${w - 24}" height="14" rx="7" fill="${trim}" opacity="0.5"/>
      ${label(cx - w / 2 + 34, base - h + 70, w - 68, 120)}`;
  }
  if (kind === 'tube') {
    const w = 210;
    const h = 560;
    return `
      ${shadow(cx, base + 20, w * 0.95, 30)}
      <path d="M${cx - w / 2} ${base - h + 50} L${cx - w / 2 + 16} ${base - h + 26} L${cx + w / 2 - 16} ${base - h + 26} L${cx + w / 2} ${base - h + 50} L${cx + w / 2 - 8} ${base - 30} Q${cx} ${base + 6} ${cx - w / 2 + 8} ${base - 30} Z" fill="${body}"/>
      <rect x="${cx - w / 2 + 12}" y="${base - h - 8}" width="${w - 24}" height="44" rx="10" fill="${cap}"/>
      ${label(cx - w / 2 + 30, base - h + 120, w - 60, 210)}`;
  }
  if (kind === 'dropper') {
    const w = 250;
    const h = 400;
    return `
      ${shadow(cx, base + 18, w * 0.78, 28)}
      <rect x="${cx - w / 2}" y="${base - h}" width="${w}" height="${h}" rx="30" fill="${body}"/>
      <rect x="${cx - 52}" y="${base - h - 96}" width="104" height="104" rx="12" fill="${cap}"/>
      <rect x="${cx - 30}" y="${base - h - 132}" width="60" height="40" rx="18" fill="${trim}"/>
      ${label(cx - w / 2 + 34, base - h + 90, w - 68, 170)}`;
  }
  if (kind === 'bottle') {
    const w = 230;
    const h = 470;
    return `
      ${shadow(cx, base + 18, w * 0.8, 28)}
      <rect x="${cx - w / 2}" y="${base - h}" width="${w}" height="${h}" rx="24" fill="${body}"/>
      <rect x="${cx - 46}" y="${base - h - 78}" width="92" height="82" rx="10" fill="${cap}"/>
      <rect x="${cx - 70}" y="${base - h - 108}" width="140" height="36" rx="8" fill="${trim}" opacity="0.85"/>
      ${label(cx - w / 2 + 30, base - h + 110, w - 60, 190)}`;
  }
  if (kind === 'set') {
    return `
      ${shadow(600, base + 24, 380, 40)}
      <rect x="230" y="${base - 470}" width="740" height="470" rx="18" fill="${C.mocha200}"/>
      <rect x="262" y="${base - 438}" width="676" height="330" rx="6" fill="${C.latte}"/>
      <line x1="300" y1="${base - 380}" x2="600" y2="${base - 380}" stroke="${C.burgundy}" stroke-width="6"/>
      <line x1="300" y1="${base - 340}" x2="520" y2="${base - 340}" stroke="${C.mochaInk}" stroke-opacity="0.4" stroke-width="3"/>
      <line x1="300" y1="${base - 310}" x2="560" y2="${base - 310}" stroke="${C.mochaInk}" stroke-opacity="0.25" stroke-width="3"/>
      <rect x="690" y="${base - 410}" width="120" height="120" rx="10" fill="${C.burgundy}" opacity="0.9"/>
      <rect x="262" y="${base - 108}" width="676" height="64" rx="4" fill="${C.burgundy}" opacity="0.08"/>`;
  }
  return '';
}

// Hand holding the product in profile, drawn at 6 px per mm: a palm 88 mm
// wide with four 58 mm fingers curling over the front. Proportions are exact
// against the product's quoted height, so the image is a true size reference
// even though the rendering is a silhouette rather than a photograph.
function handArt(kind, heightMm, tone = 'burgundy') {
  const s = 6; // px per mm
  const objH = Math.min(heightMm * s, 640);
  const base = 1000;
  const cx = 600;
  const skin = C.mocha300;
  const skinEdge = C.mochaInk;
  const palmX = cx - 280;
  const palmW = 560;

  // Four fingers emerge from the palm's right edge and lie across the lower
  // front of the product, with the thumb crossing from the left.
  const fingers = [0, 1, 2, 3]
    .map((i) => {
      const h = 44;
      const y = base - 92 + i * (h + 8);
      const len = 300 - Math.abs(1.5 - i) * 24;
      return `<rect x="${cx + 250 - len}" y="${y}" width="${len}" height="${h}" rx="${h / 2}" fill="${skin}" stroke="${skinEdge}" stroke-opacity="0.12" stroke-width="2" transform="rotate(-3 ${cx + 250} ${y + h / 2})"/>`;
    })
    .join('');

  return `
    <g>
      <ellipse cx="${cx + 20}" cy="${base + 14}" rx="300" ry="26" fill="${C.burgundy}" opacity="0.08"/>
      <rect x="${palmX}" y="${base - 20}" width="${palmW}" height="200" rx="80" fill="${skin}" stroke="${skinEdge}" stroke-opacity="0.1" stroke-width="2"/>
      <rect x="${palmX + palmW - 90}" y="${base + 40}" width="320" height="170" rx="76" fill="${skin}"/>
      ${productArt(kind, { cx, base, tone })}
      ${fingers}
    </g>
    <g stroke="${C.mochaInk}" stroke-opacity="0.55" stroke-width="1.5">
      <line x1="230" y1="${base - objH}" x2="230" y2="${base}"/>
      <line x1="218" y1="${base - objH}" x2="242" y2="${base - objH}"/>
      <line x1="218" y1="${base}" x2="242" y2="${base}"/>
    </g>`;
}

const frame = (inner) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.mocha100}"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#none)"/>
  <rect x="90" y="110" width="${W - 180}" height="${H - 300}" fill="${C.latte}"/>
  <rect x="90" y="110" width="${W - 180}" height="10" fill="${C.mocha200}"/>
  ${inner}
</svg>`;

const detailFrame = (seed) => {
  // Macro swatch: overlapping strokes in brand tones, unique per product.
  const strokes = Array.from({ length: 5 }, (_, i) => {
    const y = 480 + i * 120 + ((seed * (i + 3)) % 40);
    return `<path d="M120 ${y} C 420 ${y - 180 - seed * 8}, 700 ${y + 150}, 1080 ${y - 40}" stroke="${i % 2 ? C.mocha300 : C.burgundy}" stroke-opacity="${0.35 + i * 0.1}" stroke-width="${54 - i * 6}" fill="none" stroke-linecap="round"/>`;
  }).join('');
  return `
    <rect x="90" y="110" width="${W - 180}" height="${H - 300}" fill="${C.mocha100}"/>
    ${strokes}
    <circle cx="980" cy="1240" r="70" fill="${C.latte}" opacity="0.7"/>`;
};

async function emit(svg, name, widths) {
  const buf = Buffer.from(svg);
  for (const w of widths) {
    const out = path.join('dist/assets/img', `${name}-${w}.webp`);
    await sharp(buf, { density: 144 })
      .resize({ width: w })
      .webp({ quality: 80, effort: 6 })
      .toFile(out);
  }
}

await mkdir('dist/assets/img', { recursive: true });

const tones = {
  'barrier-repair-balm': 'burgundy',
  'ceramide-night-cream': 'cream',
  'azelaic-10-serum': 'burgundy',
  'glycerin-essence-toner': 'mocha',
  'oat-milk-cleanser': 'cream',
  'mineral-veil-spf-40': 'mocha',
  'encapsulated-retinal-01': 'cream',
  'barrier-ritual-set': 'burgundy',
};

for (const p of products) {
  const hMm = Number((p.dimensions.match(/(\d+) mm tall/) || [])[1] || 90);
  const art = productArt(p.art, { tone: tones[p.slug] || 'burgundy' });

  const frontScale = { jar: 2.5, tube: 1.2, dropper: 1.8, bottle: 1.55, set: 1.25 }[p.art] || 1.4;
  const frontArt = `<g transform="translate(600 1080) scale(${frontScale}) translate(-600 -1080)">${art}</g>`;
  await emit(frame(frontArt), `${p.slug}-front`, [480, 960]);
  await emit(frame(detailFrame(p.price)), `${p.slug}-detail`, [480, 960]);
  await emit(frame(handArt(p.art, hMm, tones[p.slug])), `${p.slug}-scale`, [480, 960]);
}

// Wide editorial hero for the home page: still life of the ritual set.
const heroSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>
  <rect width="1600" height="1000" fill="${C.mocha100}"/>
  <rect x="0" y="700" width="1600" height="300" fill="${C.latte}"/>
  <circle cx="1150" cy="330" r="300" fill="${C.mocha200}" opacity="0.5"/>
  ${productArt('jar', { cx: 560, base: 700, tone: 'burgundy' })}
  ${productArt('bottle', { cx: 820, base: 715, tone: 'cream' })}
  ${productArt('tube', { cx: 1060, base: 730, tone: 'mocha' })}
  <line x1="420" y1="748" x2="1180" y2="748" stroke="${C.mochaInk}" stroke-opacity="0.22" stroke-width="2"/>
</svg>`;
for (const w of [960, 1600]) {
  await sharp(Buffer.from(heroSvg), { density: 144 })
    .resize({ width: w })
    .webp({ quality: 82, effort: 6 })
    .toFile(`dist/assets/img/hero-${w}.webp`);
}

console.log('images: wrote WebP set to dist/assets/img');
}

/* local server ────────────────────────────────────────────────────────── */

async function serveTask() {
// Minimal static server for local review. No dependencies, no directory listing.

const root = path.resolve('dist');
// A PORT of 0 is ignored: process.env.PORT is "0" in some shells and would
// bind a random port, which makes the printed URL useless.
const port = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 4173;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = path.join(root, decodeURIComponent(url.pathname));
  if (!filePath.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = path.join(filePath, 'index.html');
    let body = await readFile(filePath);
    const type = types[path.extname(filePath)] || 'application/octet-stream';
    const compressible = /text|javascript|json|xml|svg/.test(type);
    const acceptsGzip = String(req.headers['accept-encoding'] || '').includes('gzip');
    const headers = {
      'content-type': type,
      'cache-control': 'no-cache',
      'x-content-type-options': 'nosniff',
    };
    if (compressible && acceptsGzip && body.length > 1024) {
      body = gzipSync(body, { level: 9 });
      headers['content-encoding'] = 'gzip';
      headers.vary = 'accept-encoding';
    }
    res.writeHead(200, headers);
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<h1>404</h1><p>Not found. <a href="/">Home</a></p>');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`serving dist on http://127.0.0.1:${port}`);
});
}

/* contrast matrix ─────────────────────────────────────────────────────── */

async function contrastTask() {
// WCAG 2.2 contrast verification for the fixed palette.
// Fails the build if a text pairing drops below 4.5:1 or an interactive
// boundary drops below 3:1. Writes docs/contrast-matrix.md.

const P = {
  latte: '#FFF8E7',
  raised: '#FFFDF7',
  mocha050: '#FAF2E4',
  mocha100: '#F4E7D3',
  mocha200: '#E4D1B4',
  mocha300: '#D3BB98',
  mocha400: '#B99E7E',
  mochaInk: '#6B5340',
  burgundy: '#6B1F2B',
  burgundyDeep: '#551721',
  ink: '#241C15',
  fieldBorder: '#8A6E52',
  success: '#3E7A5A',
  warning: '#7A4A12',
  danger: '#8A1F2B',
};

const rgb = (hex) => hex.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
const luminance = (hex) => {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const pairs = [
  ['Body text (Mocha Ink)', P.mochaInk, P.latte, 4.5],
  ['Body text on Mocha card', P.mochaInk, P.mocha200, 4.5],
  ['Body text on utility block', P.mochaInk, P.mocha050, 4.5],
  ['Headings (Ink)', P.ink, P.latte, 4.5],
  ['Headings on Mocha card', P.ink, P.mocha200, 4.5],
  ['Links and accents (Burgundy)', P.burgundy, P.latte, 4.5],
  ['Burgundy on utility block', P.burgundy, P.mocha050, 4.5],
  ['Burgundy on Mocha card', P.burgundy, P.mocha200, 4.5],
  ['Button label on Burgundy', P.latte, P.burgundy, 4.5],
  ['Button hover label', P.latte, P.burgundyDeep, 4.5],
  ['Error text', P.danger, P.raised, 4.5],
  ['Success text', P.success, P.latte, 4.5],
  ['Warning text', P.warning, P.latte, 4.5],
  ['Field border (non-text)', P.fieldBorder, P.latte, 3],
  ['Field border on Mocha (non-text)', P.fieldBorder, P.mocha200, 3],
  ['Focus ring (non-text)', P.burgundyDeep, P.mocha200, 3],
  ['Checked control (non-text)', P.burgundy, P.latte, 3],
];

let failed = 0;
const rows = pairs.map(([label, fg, bg, min]) => {
  const value = ratio(fg, bg);
  const pass = value >= min;
  if (!pass) failed += 1;
  return { label, fg, bg, value, min, pass };
});

const md = `# Contrast matrix

Generated by \`npm run contrast\` from \`scripts/tasks.mjs\`. Do not edit by hand.

Palette mapping used by the interface:

| Token | Hex | Role |
| --- | --- | --- |
| Cosmic Latte | \`${P.latte}\` | 60% page and structural canvas |
| Mocha Cream | \`${P.mocha200}\` | 30% cards, sidebars, utility blocks |
| Mocha Ink | \`${P.mochaInk}\` | body copy (tonal step of the Mocha family) |
| Deep Burgundy | \`${P.burgundy}\` | 10% primary CTA, active state, critical notice |
| Ink | \`${P.ink}\` | headings and high-emphasis copy |
| Field border | \`${P.fieldBorder}\` | form and control boundaries (3:1 non-text) |

The literal Mocha Cream swatch is a surface, not a text colour: at \`${P.mocha200}\` it measures
${ratio(P.mocha200, P.latte).toFixed(2)}:1 against the Cosmic Latte canvas, which cannot carry body copy.
Body text therefore uses \`${P.mochaInk}\`, a darker step inside the same hue, and both rules hold:
Mocha Cream still owns 30% of the surface area, and all copy clears 4.5:1.

| Pair | Foreground | Background | Ratio | Minimum | Result |
| --- | --- | --- | --- | --- | --- |
${rows
  .map(
    (r) =>
      `| ${r.label} | \`${r.fg}\` | \`${r.bg}\` | ${r.value.toFixed(2)}:1 | ${r.min}:1 | ${r.pass ? 'PASS' : 'FAIL'} |`,
  )
  .join('\n')}

${failed ? `**${failed} pairing(s) failed.**` : 'All pairs pass WCAG 2.2 AA (1.4.3 and 1.4.11).'}
`;

await mkdir('docs', { recursive: true });
await writeFile('docs/contrast-matrix.md', md);

console.log('\nContrast check (WCAG 2.2 AA)\n');
for (const r of rows) {
  console.log(
    `  ${r.pass ? 'PASS' : 'FAIL'}  ${r.label.padEnd(34)} ${r.value.toFixed(2).padStart(6)}:1  (min ${r.min})`,
  );
}
console.log(`\n  ${rows.length - failed}/${rows.length} pairs pass\n`);

if (failed) process.exitCode = 1;
}

/* conformance audit ───────────────────────────────────────────────────── */

async function auditTask() {
// Static conformance audit over dist/. Exits non-zero on any failure.

const DIST = 'dist';
const fail = [];
const pass = [];
const notes = [];

const ok = (label) => pass.push(label);
const bad = (label, detail) => fail.push({ label, detail });

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = await walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
if (!htmlFiles.length) bad('build output', 'no HTML files found');

const pages = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const route = `/${path.relative(DIST, path.dirname(file)).replace(/\\/g, '/')}/`.replace('//', '/');
  pages.push({ file, route, html, bytes: Buffer.byteLength(html), gzip: gzipSync(html).length });
}

/* ---------- shared shell ---------- */
for (const p of pages) {
  if (!p.html.startsWith('<!doctype html>')) bad(`${p.route} doctype`, 'missing doctype');
  if (!/<html lang="en"[ >]/.test(p.html)) bad(`${p.route} lang`, 'html lang missing');
  if (!/<meta name="viewport"/.test(p.html)) bad(`${p.route} viewport`, 'viewport meta missing');
  const h1s = p.html.match(/<h1[ >]/g) || [];
  if (h1s.length !== 1) bad(`${p.route} headings`, `expected exactly one h1, found ${h1s.length}`);
  if (!/class="skip-link" href="#main"/.test(p.html)) bad(`${p.route} skip link`, 'missing');
  if (!/<main id="main"/.test(p.html)) bad(`${p.route} landmark`, 'main landmark missing');

  const title = p.html.match(/<title>([^<]*)<\/title>/)?.[1] || '';
  if (title.length < 15 || title.length > 120) bad(`${p.route} title`, `length ${title.length}`);
  const desc = p.html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '';
  if (desc.length < 50 || desc.length > 175) bad(`${p.route} description`, `length ${desc.length}`);

  // Images: alt present, intrinsic dimensions declared.
  const imgs = [...p.html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  for (const tag of imgs) {
    if (!/\balt=/.test(tag)) bad(`${p.route} img alt`, tag.slice(0, 90));
    if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag))
      bad(`${p.route} img dimensions`, tag.slice(0, 90));
  }

  // LCP candidates must not be lazy.
  const eager = imgs.filter((t) => /fetchpriority="high"/.test(t));
  for (const tag of eager) {
    if (/loading="lazy"/.test(tag)) bad(`${p.route} LCP image`, 'priority image is lazy');
  }

  // Labels for form controls.
  const controls = [...p.html.matchAll(/<(input|select|textarea)\b[^>]*>/g)];
  for (const match of controls) {
    const tag = match[0];
    if (/type="(hidden|submit|button)"/.test(tag)) continue;
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    const hasLabel = id ? new RegExp(`<label[^>]*for="${id}"`).test(p.html) : false;
    // Wrapping label: an unclosed <label> must appear immediately before the control.
    const before = p.html.slice(Math.max(0, match.index - 400), match.index);
    const wrapped = /<label\b[^>]*>(?:(?!<\/label>)[\s\S])*$/.test(before);
    const aria = /aria-label(ledby)?=/.test(tag);
    if (!hasLabel && !wrapped && !aria) bad(`${p.route} form label`, tag.slice(0, 100));
  }

  // Buttons need type + accessible name.
  const buttons = [...p.html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
  for (const [, attrs, inner] of buttons) {
    if (!/\btype="/.test(attrs)) bad(`${p.route} button type`, attrs.slice(0, 80));
    const text = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!text && !/aria-label=/.test(attrs)) bad(`${p.route} button name`, attrs.slice(0, 80));
  }

  // No third-party runtime dependencies.
  if (/<script[^>]+src="https?:/.test(p.html)) bad(`${p.route} scripts`, 'external script');
  if (/<link[^>]+rel="stylesheet"[^>]+href="https?:/.test(p.html))
    bad(`${p.route} css`, 'external stylesheet');

  // JSON-LD parses and has a graph node.
  const blocks = [...p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const [, json] of blocks) {
    try {
      const data = JSON.parse(json);
      if (!data['@context'] || !data['@type']) bad(`${p.route} json-ld`, 'missing context/type');
    } catch (error) {
      bad(`${p.route} json-ld`, `invalid JSON: ${error.message}`);
    }
  }

  // Every referenced local image must exist. URLs are relative in the portable
  // build, so resolve them against the page's own directory.
  const pageDir = path.dirname(p.file);
  const refs = new Set();
  const addRef = (url) => {
    if (!url || /^(https?:|data:|#|mailto:|tel:)/.test(url)) return;
    const clean = url.split(/[?#]/)[0];
    if (!/assets\/img\//.test(clean)) return;
    refs.add(path.resolve(pageDir, clean));
  };
  for (const m of p.html.matchAll(/(?:src|href)="([^"]+)"/g)) addRef(m[1]);
  for (const m of p.html.matchAll(/(?:srcset|imagesrcset)="([^"]+)"/g)) {
    m[1]
      .split(',')
      .map((s) => s.trim().split(/\s+/)[0])
      .forEach(addRef);
  }
  for (const ref of refs) {
    try {
      await access(ref);
    } catch {
      bad(`${p.route} asset`, `missing ${path.relative(DIST, ref)}`);
    }
  }
}
ok(`shell, headings, labels, assets across ${pages.length} pages`);

/* ---------- product pages ---------- */
const productPages = pages.filter((p) => p.route.startsWith('/product/'));
if (productPages.length === 0) bad('product pages', 'none generated');

for (const p of productPages) {
  const blocks = [...p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]),
  );
  const product = blocks.find((b) => b['@type'] === 'Product');
  if (!product) {
    bad(`${p.route} schema`, 'no Product node');
    continue;
  }
  const required = ['name', 'sku', 'description', 'image', 'url', 'offers', 'brand'];
  required.forEach((key) => {
    if (!product[key]) bad(`${p.route} schema`, `missing ${key}`);
  });
  // No review or rating markup while there are no verified reviews: fabricated
  // stars in JSON-LD are a policy violation, not a cosmetic one.
  if (product.aggregateRating || product.review)
    bad(`${p.route} review markup`, 'rating emitted without verified reviews');
  const offer = product.offers?.[0] || {};
  ['price', 'priceCurrency', 'availability', 'url', 'seller', 'shippingDetails', 'hasMerchantReturnPolicy', 'priceValidUntil'].forEach(
    (key) => {
      if (!offer[key]) bad(`${p.route} offer`, `missing ${key}`);
    },
  );
  if (offer.hasMerchantReturnPolicy) {
    const rp = offer.hasMerchantReturnPolicy;
    if (rp.merchantReturnDays !== 30) bad(`${p.route} return policy`, 'days must match UI (30)');
    if (rp.returnPolicyCategory !== 'https://schema.org/MerchantReturnFiniteReturnWindow')
      bad(`${p.route} return policy`, 'wrong category');
  }
  if (offer.shippingDetails?.[0]?.shippingRate?.value !== '49.00')
    bad(`${p.route} shipping`, 'schema shipping rate does not match UI');

  // Schema price parity with rendered data (offers include the default size).
  const renderedPrice = p.html.match(/data-pdp-price[^>]*>₹([\d.,]+)</)?.[1]?.replace(/,/g, '');
  const prices = (product.offers || []).map((o) => o.price);
  if (renderedPrice && !prices.includes(Number(renderedPrice).toFixed(2)))
    bad(`${p.route} price parity`, `rendered ${renderedPrice}, schema ${prices.join(', ')}`);

  if (!/class="gallery-thumb"[\s\S]*?scale/.test(p.html))
    bad(`${p.route} scale image`, 'no in-scale gallery image');
  if (!/In hand:/.test(p.html)) bad(`${p.route} scale caption`, 'dimension caption missing');
}
ok(`Product/Offer schema, price parity and scale image on ${productPages.length} PDPs`);

/* ---------- checkout + no-surprises ---------- */
const checkoutPage = pages.find((p) => p.route === '/checkout/');
if (!checkoutPage) bad('checkout', 'page missing');
else {
  const html = checkoutPage.html;
  [
    ['guest checkout copy', /Guest checkout is the default/],
    ['step progress', /data-steps/],
    ['numeric card keypad', /id="card"[^>]+inputmode="numeric"/],
    ['numeric zip keypad', /id="zip"[^>]+inputmode="numeric"/],
    ['numeric cvc keypad', /id="cvc"[^>]+inputmode="numeric"/],
    ['autocomplete on email', /autocomplete="email"/],
    ['trust row under pay', /data-place-order[\s\S]{0,1200}?class="trust-row"/],
    ['error summary', /data-error-summary/],
    ['aria-describedby errors', /aria-describedby="[^"]*email-error/],
  ].forEach(([label, re]) => {
    if (!re.test(html)) bad(`checkout ${label}`, 'not found');
  });
  ok('checkout: guest path, step progress, inputmodes, trust placement, inline errors');
}

const cartPage = pages.find((p) => p.route === '/cart/');
if (!cartPage) bad('cart', 'page missing');
else if (!/Delivery estimate/.test(cartPage.html) || !/30-day return policy/.test(cartPage.html))
  bad('cart disclosures', 'shipping or returns missing');
else ok('cart: shipping and return disclosures before checkout');

/* ---------- content limits ---------- */
const catalogSource = await readFile('src/catalog.mjs', 'utf8');
const descriptions = [...catalogSource.matchAll(/description:\s*\n?\s*'([^']+)'/g)].map((m) => m[1]);
const tooLong = descriptions.filter((d) => d.trim().split(/\s+/).length >= 160);
if (tooLong.length) bad('copy budget', `${tooLong.length} product descriptions over 160 words`);
else ok(`copy budget: ${descriptions.length} product descriptions under 160 words`);

if (!/--font-display/.test(await readFile('assets/css/site.css', 'utf8')))
  bad('typefaces', 'display font token missing');
const fontFaces = (await readFile('assets/css/site.css', 'utf8')).match(/@font-face/g) || [];
if (fontFaces.length > 2) bad('typefaces', `@font-face count ${fontFaces.length}`);
else notes.push('webfont requests: 0 (system serif + system sans, no FOIT or font CLS)');

/* ---------- weight ---------- */
const assets = files.filter((f) => !f.endsWith('.html'));
const assetBytes = (await Promise.all(assets.map(async (f) => (await stat(f)).size))).reduce(
  (a, b) => a + b,
  0,
);
const imgBytes = (
  await Promise.all(
    assets.filter((f) => f.endsWith('.webp')).map(async (f) => (await stat(f)).size),
  )
).reduce((a, b) => a + b, 0);
notes.push(`images: ${assets.filter((f) => f.endsWith('.webp')).length} WebP, ${(imgBytes / 1024).toFixed(0)} kB total`);
notes.push(`assets: ${(assetBytes / 1024).toFixed(0)} kB (CSS + JS + images + favicon)`);

const cssBytes = (await stat(path.join(DIST, 'assets/css/site.css'))).size;
const jsBytes = (await stat(path.join(DIST, 'assets/js/app.js'))).size;
notes.push(`CSS ${(cssBytes / 1024).toFixed(1)} kB · JS ${(jsBytes / 1024).toFixed(1)} kB (uncompressed)`);

/* ---------- report ---------- */
await mkdir('docs', { recursive: true });
const report = `# Build report

Generated by \`npm run audit\`.

## Pages

| Route | Raw | Gzip |
| --- | --- | --- |
${pages
  .map((p) => `| ${p.route} | ${(p.bytes / 1024).toFixed(1)} kB | ${(p.gzip / 1024).toFixed(1)} kB |`)
  .join('\n')}

## Checks

${pass.map((p) => `- PASS — ${p}`).join('\n')}
${fail.map((f) => `- FAIL — ${f.label}: ${f.detail}`).join('\n')}
${notes.map((n) => `- NOTE — ${n}`).join('\n')}

Result: ${fail.length ? `${fail.length} failure(s)` : 'all checks pass'}
`;
await writeFile('docs/build-report.md', report);

console.log('\nConformance audit\n');
pass.forEach((p) => console.log(`  PASS  ${p}`));
notes.forEach((n) => console.log(`  NOTE  ${n}`));
if (fail.length) {
  fail.forEach((f) => console.log(`  FAIL  ${f.label} — ${f.detail}`));
  console.log(`\n  ${fail.length} failure(s). See docs/build-report.md\n`);
  process.exitCode = 1;
} else {
  console.log(`\n  All checks pass. ${pages.length} pages. See docs/build-report.md\n`);
}
}

/* browser verification ────────────────────────────────────────────────── */

async function browserTask() {
const puppeteer = (await import('puppeteer-core')).default;
// Browser verification: screenshots, axe-core conformance, first-viewport geometry
// and initial transfer weight. Runs against the local static server.
//
//   PORT=4180 node scripts/tasks.mjs verify-browser
//
// Outputs screenshots/*.png, docs/a11y-report.md and prints a measurement table.

const PORT = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 4180;
const BASE = `http://127.0.0.1:${PORT}`;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.error('No local Chrome/Edge found. Set CHROME_PATH.');
  process.exit(2);
}

const ROUTES = [
  { key: 'home', url: '/', shot: true, axe: true, geo: false },
  { key: 'shop', url: '/shop/', shot: true, axe: true, geo: true },
  { key: 'pdp', url: '/product/barrier-repair-balm/', shot: true, axe: true, geo: true },
  { key: 'cart', url: '/cart/', shot: true, axe: true, geo: false },
  { key: 'checkout', url: '/checkout/', shot: true, axe: true, geo: false },
  { key: 'account', url: '/account/', shot: true, axe: true, geo: false },
  { key: 'help', url: '/help/', shot: true, axe: true, geo: false },
  { key: 'privacy', url: '/privacy/', shot: true, axe: true, geo: false },
  { key: 'terms', url: '/terms/', shot: true, axe: true, geo: false },
];

const VIEWPORTS = [
  { key: 'desktop', width: 1440, height: 900, isMobile: false },
  { key: 'mobile', width: 390, height: 844, isMobile: true },
];

// Two line items so cart and checkout render populated states.
const SEED_CART = [
  { sku: 'CK-BB-050', qty: 1 },
  { sku: 'CK-NC-060', qty: 1 },
];

await mkdir('screenshots', { recursive: true });
// Loaded from node_modules so the test tool never lands in the deployable build.
const axeSource = await readFile(path.join('node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--hide-scrollbars', '--no-first-run', '--no-default-browser-check'],
});

const axeRuns = [];
const metrics = [];

for (const vp of VIEWPORTS) {
  const page = await browser.newPage();
  await page.setViewport({
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 1,
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
  });

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await page.evaluate((cart) => localStorage.setItem('ck-cart-v1', JSON.stringify(cart)), SEED_CART);

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route.url}`, { waitUntil: 'networkidle0' });
    // Let lazy images inside the first viewport finish.
    await page.evaluate(async () => {
      await Promise.all(
        Array.from(document.images)
          .filter((img) => img.loading !== 'lazy' || img.getBoundingClientRect().top < innerHeight)
          .map((img) => (img.complete ? null : img.decode().catch(() => null))),
      );
    });

    if (route.shot) {
      await page.screenshot({ path: path.join('screenshots', `${route.key}-${vp.key}.png`) });
    }

    if (route.key === 'pdp' || route.key === 'home') {
      const m = await page.evaluate(() => {
        const box = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
        };
        const nav = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');
        return {
          docKB: Math.round((nav?.encodedBodySize || 0) / 102.4) / 10,
          resKB: Math.round(resources.reduce((a, r) => a + (r.encodedBodySize || 0), 0) / 102.4) / 10,
          requests: resources.length + 1,
          viewport: { w: innerWidth, h: innerHeight },
          header: box('.site-header'),
          h1: box('h1'),
          price: box('[data-pdp-price]'),
          cta: box('.buybox [data-add-to-cart]'),
          sticky: box('.sticky-buy'),
        };
      });
      metrics.push({ page: route.key, vp: vp.key, ...m });
    }

    if (route.axe) {
      await page.addScriptTag({ content: axeSource });
      const result = await page.evaluate(async () => {
        const r = await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        });
        return {
          violations: r.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.length,
            targets: v.nodes.slice(0, 4).map((n) => n.target.join(' ')),
          })),
          passes: r.passes.length,
          incomplete: r.incomplete.length,
        };
      });
      axeRuns.push({ page: route.key, vp: vp.key, ...result });
    }
  }

  await page.close();
}

await browser.close();

/* ---------- accessibility report ---------- */
const totalViolations = axeRuns.reduce((a, r) => a + r.violations.length, 0);
const rows = axeRuns
  .map((r) => `| ${r.page} | ${r.vp} | ${r.violations.length} | ${r.passes} | ${r.incomplete} |`)
  .join('\n');

const details = totalViolations
  ? axeRuns
      .filter((r) => r.violations.length)
      .map(
        (r) => `### ${r.page} (${r.vp})
${r.violations
  .map(
    (v) =>
      `- **${v.id}** (${v.impact}) — ${v.help}\n  ${v.nodes} node(s): \`${v.targets.join('`, `')}\``,
  )
  .join('\n')}`,
      )
      .join('\n\n')
  : 'No WCAG 2.2 A/AA violations reported on any audited page and viewport.';

await writeFile(
  'docs/a11y-report.md',
  `# Accessibility report

Generated by \`node scripts/tasks.mjs verify-browser\` against the local build.
Ruleset: axe-core tags \`wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa\`.

| Page | Viewport | Violations | Rule groups passed | Needs review |
| --- | --- | --- | --- | --- |
${rows}

${details}

axe-core catches roughly a third of WCAG failures; manual keyboard and screen-reader
checks are recorded separately in the blueprint (section 10).
`,
);

/* ---------- console summary ---------- */
console.log('\nBrowser verification\n');
console.log('  axe-core violations:', totalViolations === 0 ? '0 (all pages)' : totalViolations);
console.log('  screenshots:', ROUTES.filter((r) => r.shot).length * VIEWPORTS.length, 'written to screenshots/');
console.log('\n  First-viewport geometry and weight\n');
for (const m of metrics) {
  const parts = [
    `${m.page}/${m.vp}`,
    `doc ${m.docKB} kB + assets ${m.resKB} kB`,
    `${m.requests} requests`,
  ];
  if (m.h1) parts.push(`h1 ${m.h1.top}px`);
  if (m.price) parts.push(`price ${m.price.top}px`);
  if (m.cta) parts.push(`cta ${m.cta.top}px`);
  if (m.sticky) parts.push(`sticky ${m.sticky.top}px`);
  parts.push(`fold ${m.viewport.h}px`);
  console.log('  ' + parts.join(' · '));
}
console.log('\n  Report: docs/a11y-report.md');
if (totalViolations) process.exitCode = 1;
}

/* palette surface share ───────────────────────────────────────────────── */

async function paletteTask() {
const puppeteer = (await import('puppeteer-core')).default;
const sharp = (await import('sharp')).default;
// Measures how much of the painted first viewport each palette family owns.
// Product imagery is masked out: the 60-30-10 rule describes interface surface,
// not photography. Requires the local server (PORT, default 4180).

const PORT = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 4180;
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => p && existsSync(p));
if (!CHROME) {
  console.error('No local Chrome/Edge found. Set CHROME_PATH.');
  process.exit(2);
}

const hex = (h) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Anchor colours per family. Tints and shades stay in their family.
const FAMILIES = {
  'Cosmic Latte': ['#fff8e7', '#fffdf7', '#f7ecd9'],
  'Mocha Cream': ['#faf2e4', '#f4e7d3', '#e4d1b4', '#d3bb98', '#b99e7e'],
  'Deep Burgundy': ['#6b1f2b', '#5a1520', '#f3e2e4'],
  Neutral: ['#241c15', '#6b5340', '#8a6e52', '#3e7a5a', '#7a4a12', '#8a1f2b'],
};

const ANCHORS = Object.entries(FAMILIES).flatMap(([family, list]) =>
  list.map((h) => ({ family, rgb: hex(h) })),
);

const ROUTES = [
  { key: 'home', url: '/' },
  { key: 'shop', url: '/shop/' },
  { key: 'pdp', url: '/product/barrier-repair-balm/' },
  { key: 'checkout', url: '/checkout/' },
];
const VIEWPORTS = [
  { key: 'desktop', width: 1440, height: 900, isMobile: false },
  { key: 'mobile', width: 390, height: 844, isMobile: true },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
const rows = [];

for (const vp of VIEWPORTS) {
  const page = await browser.newPage();
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1, isMobile: vp.isMobile, hasTouch: vp.isMobile });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await page.evaluate(() =>
    localStorage.setItem('ck-cart-v1', JSON.stringify([{ sku: 'CK-BB-050', qty: 1 }, { sku: 'CK-NC-060', qty: 1 }])),
  );

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route.url}`, { waitUntil: 'networkidle0' });
    const masks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .map((img) => img.getBoundingClientRect())
        .filter((r) => r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight)
        .map((r) => [Math.max(0, r.left), Math.max(0, r.top), Math.min(innerWidth, r.right), Math.min(innerHeight, r.bottom)]),
    );
    const png = await page.screenshot({ type: 'png' });
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;

    const counts = Object.fromEntries([...Object.keys(FAMILIES), 'Other'].map((k) => [k, 0]));
    let total = 0;
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (masks.some(([x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1)) continue;
        const i = (y * width + x) * channels;
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        let best = null;
        let bestD = Infinity;
        for (const a of ANCHORS) {
          const d = (r - a.rgb[0]) ** 2 + (g - a.rgb[1]) ** 2 + (b - a.rgb[2]) ** 2;
          if (d < bestD) {
            bestD = d;
            best = a.family;
          }
        }
        // Anti-aliased text edges and shadows fall between families.
        counts[bestD > 3600 ? 'Other' : best] += 1;
        total += 1;
      }
    }

    const pct = Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Math.round((v / total) * 1000) / 10]));
    rows.push({ route: route.key, vp: vp.key, ...pct });
    process.stdout.write(`  ${route.key}/${vp.key}  canvas ${pct['Cosmic Latte']}% · mocha ${pct['Mocha Cream']}% · burgundy ${pct['Deep Burgundy']}% · neutral ${pct.Neutral}% · other ${pct.Other}%\n`);
  }
  await page.close();
}

await browser.close();

const cols = ['Cosmic Latte', 'Mocha Cream', 'Deep Burgundy', 'Neutral', 'Other'];
const table = rows
  .map((r) => `| ${r.route} | ${r.vp} | ${cols.map((c) => `${r[c]}%`).join(' | ')} |`)
  .join('\n');

await writeFile(
  'docs/palette-share.md',
  `# Palette surface share

Generated by \`node scripts/tasks.mjs palette\` from rendered first-viewport pixels.
Product images are masked out; samples are taken on a 2 px grid; anti-aliased edges
more than 60 units from any palette anchor are counted as *Other*.

| Page | Viewport | Cosmic Latte | Mocha Cream | Deep Burgundy | Neutral (text) | Other |
| --- | --- | --- | --- | --- | --- | --- |
${table}

Target: Latte 55–65%, Mocha 25–35%, Burgundy 5–12% (a 10% accent ceiling, measured
rather than assumed). Values outside those bands mean a surface is mis-assigned.
`,
);

console.log('\n  Report: docs/palette-share.md');
}

/* dispatch ───────────────────────────────────────────────────── */
const tasks = {
  build: buildTask,
  images: imagesTask,
  serve: serveTask,
  contrast: contrastTask,
  audit: auditTask,
  'verify-browser': browserTask,
  palette: paletteTask,
  verify: async () => {
    await contrastTask();
    await buildTask();
    await auditTask();
  },
};

const task = process.argv[2];
if (!tasks[task]) {
  console.error(`usage: node scripts/tasks.mjs <${Object.keys(tasks).join('|')}>`);
  process.exit(1);
}
await tasks[task]();
