// Single source of truth for catalog, navigation, and merchant policies.
// Consumed by the static builder (server-rendered HTML + JSON-LD) and emitted
// as /assets/js/catalog.js for the client (cart, search, facets).

export const brand = {
  name: 'Clay & Kin',
  legalName: 'Clay & Kin Skin Co.',
  tagline: 'Barrier-first skincare, built on ceramides and squalane',
  domain: 'https://clayandkin.example',
  email: 'care@clayandkin.example',
  phone: '+91 8919527406',
  address: {
    street: 'D.No. 40-1-52, MG Road, Labbipet',
    city: 'Vijayawada',
    region: 'Andhra Pradesh',
    postalCode: '520010',
    country: 'IN',
  },
};

export const policies = {
  returns: {
    days: 30,
    freeReturns: true,
    url: '/help/#returns',
    summary: '30-day returns, prepaid label, refund to original payment in 3–5 business days.',
  },
  shipping: {
    freeThreshold: 999,
    standard: { label: 'Standard', days: '3–5 business days', price: 49 },
    express: { label: 'Express', days: '1–2 business days', price: 99 },
    taxNote: 'GST is calculated on the destination address and shown before payment.',
  },
};

// Hick's Law: seven primary items, secondary depth lives in mega-menus and facets.
export const nav = [
  {
    label: 'Shop all',
    href: '/shop/',
    mega: null,
  },
  {
    label: 'By concern',
    href: '/shop/',
    mega: {
      title: 'Shop by concern',
      columns: [
        {
          heading: 'Barrier & dryness',
          links: [
            { label: 'Dryness and tightness', href: '/shop/?concern=dry' },
            { label: 'Flaking and roughness', href: '/shop/?concern=texture' },
            { label: 'Sensitivity and stinging', href: '/shop/?concern=sensitive' },
          ],
        },
        {
          heading: 'Tone & clarity',
          links: [
            { label: 'Redness and flushing', href: '/shop/?concern=redness' },
            { label: 'Post-blemish marks', href: '/shop/?concern=marks' },
            { label: 'Dullness and uneven tone', href: '/shop/?concern=dullness' },
          ],
        },
        {
          heading: 'Age & structure',
          links: [
            { label: 'Fine lines', href: '/shop/?concern=lines' },
            { label: 'Loss of firmness', href: '/shop/?concern=firmness' },
            { label: 'Sun damage prevention', href: '/shop/?concern=uv' },
          ],
        },
      ],
      featured: {
        label: 'The Barrier Ritual Set',
        copy: 'Three steps, 90 days, 18% less than buying separately.',
        href: '/product/barrier-ritual-set/',
      },
    },
  },
  {
    label: 'By ingredient',
    href: '/shop/',
    mega: {
      title: 'Shop by ingredient',
      columns: [
        {
          heading: 'Barrier lipids',
          links: [
            { label: 'Ceramides', href: '/shop/?ingredient=ceramide' },
            { label: 'Squalane', href: '/shop/?ingredient=squalane' },
            { label: 'Cholesterol', href: '/shop/?ingredient=cholesterol' },
          ],
        },
        {
          heading: 'Actives',
          links: [
            { label: 'Azelaic acid', href: '/shop/?ingredient=azelaic' },
            { label: 'Encapsulated retinal', href: '/shop/?ingredient=retinal' },
            { label: 'Niacinamide', href: '/shop/?ingredient=niacinamide' },
          ],
        },
        {
          heading: 'Soothing',
          links: [
            { label: 'Colloidal oat', href: '/shop/?ingredient=oat' },
            { label: 'Panthenol', href: '/shop/?ingredient=panthenol' },
            { label: 'Allantoin', href: '/shop/?ingredient=allantoin' },
          ],
        },
      ],
    },
  },
  { label: 'Sets', href: '/shop/?format=Set', mega: null },
  { label: 'Our standards', href: '/help/#standards', mega: null },
  { label: 'Help', href: '/help/', mega: null },
];

export const concerns = [
  {
    id: 'dry',
    label: 'Dryness and tightness',
    synonyms: ['dry skin', 'dryness', 'tight', 'dehydrated', 'flaky', 'dry', 'winter skin'],
  },
  {
    id: 'sensitive',
    label: 'Sensitivity and stinging',
    synonyms: ['sensitive skin', 'stinging', 'burning', 'reactive', 'sensitive', 'irritation'],
  },
  {
    id: 'redness',
    label: 'Redness and flushing',
    synonyms: ['redness', 'red skin', 'flushing', 'rosacea', 'red'],
  },
  {
    id: 'texture',
    label: 'Flaking and roughness',
    synonyms: ['texture', 'rough', 'flaking', 'bumpy', 'keratosis', 'flaky patches'],
  },
  {
    id: 'lines',
    label: 'Fine lines',
    synonyms: ['fine lines', 'wrinkles', 'aging', 'ageing', 'lines'],
  },
  {
    id: 'firmness',
    label: 'Loss of firmness',
    synonyms: ['firmness', 'sagging', 'elasticity', 'firm'],
  },
  {
    id: 'marks',
    label: 'Post-blemish marks',
    synonyms: ['dark spots', 'marks', 'hyperpigmentation', 'acne scars', 'pigmentation'],
  },
  {
    id: 'dullness',
    label: 'Dullness and uneven tone',
    synonyms: ['dull', 'dullness', 'brightening', 'uneven tone', 'glow'],
  },
  {
    id: 'uv',
    label: 'Sun damage prevention',
    synonyms: ['sun', 'spf', 'sunscreen', 'uv', 'sun damage'],
  },
];

export const skinTypes = [
  { id: 'dry', label: 'Dry' },
  { id: 'sensitive', label: 'Sensitive' },
  { id: 'normal', label: 'Normal' },
  { id: 'oily', label: 'Oily' },
];

export const formats = ['Balm', 'Cream', 'Serum', 'Toner', 'Cleanser', 'Sunscreen', 'Set'];

// Price is in Indian rupees (INR), whole rupees for readability; JSON-LD emits
// two decimals. Descriptions are benefit-led and kept under 160 words
// (enforced by scripts/tasks.mjs (audit task)).
export const products = [
  {
    slug: 'barrier-repair-balm',
    sku: 'CK-BB-050',
    name: 'Barrier Repair Balm',
    subtitle: 'Ceramide + squalane occlusive balm',
    art: 'jar',
    format: 'Balm',
    price: 599,
    compareAt: null,
    concerns: ['dry', 'sensitive', 'texture'],
    ingredients: ['ceramide', 'squalane', 'cholesterol'],
    skinTypes: ['dry', 'sensitive', 'normal'],
    benefits: [
      'Seals water in after cleansing, so skin does not feel tight ten minutes later',
      '3:1:1 ceramide, cholesterol and fatty acid ratio to rebuild the lipid matrix',
      'Fragrance-free, essential-oil-free, dye-free',
      '50 ml lasts 8–10 weeks at twice-daily use',
    ],
    description:
      'A seal-in balm for skin that stings after washing. The lipid blend mirrors the barrier’s own 3:1:1 ceramide-to-cholesterol-to-fatty-acid ratio, so it fills gaps rather than sitting on top of them. Use it last, over serum, at night. It is 12% squalane by weight, fragrance-free, and thick enough to stay put through a night of side-sleeping. Under makeup, use a pea-sized amount and give it two minutes to settle.',
    sizes: [
      { label: '50 ml', sku: 'CK-BB-050', price: 599 },
      { label: '100 ml', sku: 'CK-BB-100', price: 1049 },
    ],
    dimensions: '62 mm wide × 48 mm tall; 50 ml jar',
    parcel: '150 × 110 × 80 mm',
    weight: 220,
    inStock: true,
    stock: 14,
    bestseller: true,
  },
  {
    slug: 'ceramide-night-cream',
    sku: 'CK-NC-060',
    name: 'Ceramide Night Cream',
    subtitle: 'Ceramide NP + niacinamide 4%',
    art: 'jar',
    format: 'Cream',
    price: 749,
    compareAt: null,
    concerns: ['dry', 'texture', 'marks'],
    ingredients: ['ceramide', 'niacinamide', 'panthenol'],
    skinTypes: ['dry', 'normal', 'oily'],
    benefits: [
      'Ceramide NP rebuilds the lipid barrier while 4% niacinamide works on tone',
      '4% niacinamide supports tone without the sting of higher concentrations',
      'Fragrance-free, cushion texture that stays where you put it',
      '60 ml jar, approximately 10 weeks of nightly use',
    ],
    description:
      'A night cream for flaking cheeks and an uneven tone that has not responded to lighter lotions. Ceramide NP rebuilds the lipid barrier while 4% niacinamide works on tone and post-blemish marks. The texture is a cushion cream, not a gel, so it stays where you put it. It is fragrance-free and formulated without drying alcohols. Apply to damp skin after serum; no wait time needed before bed.',
    sizes: [
      { label: '60 ml', sku: 'CK-NC-060', price: 749 },
      { label: '120 ml', sku: 'CK-NC-120', price: 1299 },
    ],
    dimensions: '70 mm wide × 55 mm tall; 60 ml jar',
    parcel: '155 × 115 × 85 mm',
    weight: 250,
    inStock: true,
    stock: 22,
    bestseller: true,
  },
  {
    slug: 'azelaic-10-serum',
    sku: 'CK-AZ-030',
    name: 'Azelaic 10% Serum',
    subtitle: 'Azelaic acid + allantoin, water-light',
    art: 'dropper',
    format: 'Serum',
    price: 649,
    compareAt: null,
    concerns: ['redness', 'marks', 'sensitive'],
    ingredients: ['azelaic', 'allantoin', 'niacinamide'],
    skinTypes: ['sensitive', 'normal', 'oily'],
    benefits: [
      '10% azelaic acid, a strength available without a prescription',
      'Allantoin buffers the tingle azelaic acid can cause in week one',
      'Water-light base layers under sunscreen without pilling',
      '30 ml, approximately 6 weeks at twice daily',
    ],
    description:
      'For persistent redness and post-blemish marks that linger for months. Azelaic acid at 10% is a strength available without a prescription, and it is gentler than most acids at this concentration. Allantoin buffers the tingle that azelaic acid can cause in the first week. The base is water-light, so it layers under sunscreen without pilling. Start once daily for five days, then twice daily.',
    sizes: [
      { label: '30 ml', sku: 'CK-AZ-030', price: 649 },
      { label: '60 ml', sku: 'CK-AZ-060', price: 1149 },
    ],
    dimensions: '32 mm wide × 96 mm tall; 30 ml bottle',
    parcel: '120 × 70 × 60 mm',
    weight: 120,
    inStock: true,
    stock: 31,
    bestseller: false,
  },
  {
    slug: 'glycerin-essence-toner',
    sku: 'CK-GT-150',
    name: 'Glycerin Essence Toner',
    subtitle: 'Glycerin 12% + panthenol',
    art: 'bottle',
    format: 'Toner',
    price: 399,
    compareAt: null,
    concerns: ['dry', 'dullness', 'sensitive'],
    ingredients: ['panthenol', 'niacinamide'],
    skinTypes: ['dry', 'sensitive', 'normal', 'oily'],
    benefits: [
      '12% glycerin holds water in the upper layers instead of evaporating',
      'Panthenol reduces the tight feeling after cleansing',
      'No alcohol, no fragrance, no essential oils',
      '150 ml, roughly 10 weeks at twice daily',
    ],
    description:
      'A first step for skin that feels tight two minutes after washing. Twelve percent glycerin pulls water into the upper layers, and panthenol calms the immediate sting. There is no alcohol, fragrance, or essential oil, so it does not create the tightness it is meant to fix. Press three to four drops into damp skin, then seal with a cream. 150 ml lasts about ten weeks at twice daily. It is thin enough to layer under anything and does not leave a film.',
    sizes: [{ label: '150 ml', sku: 'CK-GT-150', price: 399 }],
    dimensions: '45 mm wide × 132 mm tall; 150 ml bottle',
    parcel: '160 × 80 × 70 mm',
    weight: 260,
    inStock: true,
    stock: 40,
    bestseller: false,
  },
  {
    slug: 'oat-milk-cleanser',
    sku: 'CK-OC-120',
    name: 'Oat Milk Cleanser',
    subtitle: 'Colloidal oat, pH 5.5, no sulfates',
    art: 'tube',
    format: 'Cleanser',
    price: 349,
    compareAt: null,
    concerns: ['sensitive', 'dry', 'redness'],
    ingredients: ['oat', 'panthenol', 'allantoin'],
    skinTypes: ['dry', 'sensitive', 'normal'],
    benefits: [
      'pH 5.5, matched to skin, with no sulfate surfactants',
      'Colloidal oat reduces the tightness that follows water-only rinsing',
      'Removes sunscreen and light makeup in one pass',
      '120 ml, approximately 8 weeks at twice daily',
    ],
    description:
      'A cream cleanser for skin that feels squeaky and raw after washing. It sits at pH 5.5 and uses no sulfate surfactants, so it lifts sunscreen and light makeup without stripping the lipid film. Colloidal oat and panthenol calm the tightness that usually follows a rinse. Massage onto dry skin for thirty seconds, add water, then rinse. 120 ml lasts about eight weeks at twice daily. If you wear heavy makeup, use a pre-clean step first.',
    sizes: [
      { label: '120 ml', sku: 'CK-OC-120', price: 349 },
      { label: '240 ml', sku: 'CK-OC-240', price: 599 },
    ],
    dimensions: '50 mm wide × 158 mm tall; 120 ml tube',
    parcel: '175 × 70 × 55 mm',
    weight: 200,
    inStock: true,
    stock: 6,
    bestseller: true,
  },
  {
    slug: 'mineral-veil-spf-40',
    sku: 'CK-SP-050',
    name: 'Mineral Veil SPF 40',
    subtitle: 'Zinc oxide 18%, untinted and tinted',
    art: 'tube',
    format: 'Sunscreen',
    price: 549,
    compareAt: null,
    concerns: ['uv', 'sensitive', 'redness'],
    ingredients: ['oat', 'niacinamide'],
    skinTypes: ['dry', 'sensitive', 'normal', 'oily'],
    benefits: [
      'Broad-spectrum SPF 40, zinc oxide 18%, water-resistant for 40 minutes',
      'Untinted and a deep tint, so medium and deep skin have a match',
      'No chemical UV filters, no fragrance',
      '50 ml, approximately 6 weeks at daily face use',
    ],
    description:
      'Daily mineral sun protection that does not leave a grey cast on medium or deep skin. Zinc oxide at 18% gives broad-spectrum SPF 40 with 40-minute water resistance. Two tints are available, untinted and a deep tint, so medium and deep skin tones have a match. The finish is lightly dewy rather than matte, so it layers over moisturiser without pilling. Use two finger-lengths for the face and neck, and reapply every two hours outdoors. 50 ml lasts about six weeks at daily face use.',
    sizes: [
      { label: '50 ml untinted', sku: 'CK-SP-050', price: 549 },
      { label: '50 ml deep tint', sku: 'CK-SP-050D', price: 549 },
    ],
    dimensions: '48 mm wide × 150 mm tall; 50 ml tube',
    parcel: '155 × 65 × 50 mm',
    weight: 140,
    inStock: true,
    stock: 18,
    bestseller: false,
  },
  {
    slug: 'encapsulated-retinal-01',
    sku: 'CK-RT-030',
    name: 'Encapsulated Retinal 0.1%',
    subtitle: 'Retinaldehyde, buffered with ceramides',
    art: 'dropper',
    format: 'Serum',
    price: 899,
    compareAt: null,
    concerns: ['lines', 'firmness', 'texture'],
    ingredients: ['retinal', 'ceramide', 'squalane'],
    skinTypes: ['normal', 'oily', 'dry'],
    benefits: [
      '0.1% retinaldehyde, one conversion step from retinoic acid',
      'Encapsulated to slow release and reduce the first-week sting',
      'Buffered with ceramides and squalane to protect the barrier',
      '30 ml, approximately 12 weeks at three nights per week',
    ],
    description:
      'For fine lines and rough texture, with less of the peeling that puts people off retinoids. Retinaldehyde is one conversion step from retinoic acid, so it works faster than retinol at a lower concentration. Encapsulation slows release, and ceramides plus squalane buffer the barrier while it adjusts. Start every third night for two weeks, then increase only if skin stays calm. Do not layer with acids on the same night. 30 ml lasts about twelve weeks at three nights per week.',
    sizes: [{ label: '30 ml', sku: 'CK-RT-030', price: 899 }],
    dimensions: '32 mm wide × 96 mm tall; 30 ml bottle',
    parcel: '120 × 70 × 60 mm',
    weight: 120,
    inStock: true,
    stock: 9,
    bestseller: false,
  },
  {
    slug: 'barrier-ritual-set',
    sku: 'CK-SET-01',
    name: 'The Barrier Ritual Set',
    subtitle: 'Cleanser, toner and balm, 90-day supply',
    art: 'set',
    format: 'Set',
    price: 1099,
    compareAt: 1347,
    concerns: ['dry', 'sensitive', 'texture'],
    ingredients: ['ceramide', 'oat', 'squalane'],
    skinTypes: ['dry', 'sensitive', 'normal'],
    benefits: [
      'Three full sizes: Oat Milk Cleanser, Glycerin Essence Toner, Barrier Repair Balm',
      '₹248 less than buying the three separately',
      'Printed routine card with morning and night order',
      'Ships in one box, one returns label',
    ],
    description:
      'The three-step routine for dry, reactive skin, in full sizes. Oat Milk Cleanser at pH 5.5, Glycerin Essence Toner for immediate hydration, and Barrier Repair Balm to seal it in. Buying the set costs ₹248 less than the three products separately. A printed card lists the order for morning and night, because most barrier damage comes from stacking actives in the wrong sequence. Expect eight to ten weeks of twice-daily use from the balm and cleanser, and about twelve weeks from the toner.',
    sizes: [{ label: '3-piece set', sku: 'CK-SET-01', price: 1099 }],
    dimensions: 'Box 180 × 140 × 70 mm; three full-size products',
    parcel: '200 × 160 × 90 mm',
    weight: 620,
    inStock: true,
    stock: 11,
    bestseller: true,
  },
];

// Formula copy shown in PDP accordions. INCI strings are illustrative for this
// build; replace with the label copy from the formulation record.
export const productDetails = {
  'barrier-repair-balm': {
    texture: 'Occlusive balm that melts to a thin oil.',
    howto:
      'Warm a pea-sized amount between fingertips and press over moisturiser as the last step at night. Use a smaller amount under makeup, and wait two minutes before sunscreen.',
    inci:
      'Squalane, Caprylic/Capric Triglyceride, Ceramide NP, Ceramide AP, Ceramide EOP, Cholesterol, Phytosphingosine, Sodium Hyaluronate, Panthenol, Allantoin, Tocopherol, Bisabolol. Free of fragrance, essential oils and dyes.',
    testing:
      'Anhydrous, with 12% squalane, ceramide NP and cholesterol at a 3:1:1 ratio. Fragrance-free, dye-free, and packed in a 50 ml jar with a 100 ml refill size.',
  },
  'ceramide-night-cream': {
    texture: 'Cushion cream with a dry-touch finish.',
    howto:
      'Apply to damp skin after serum, morning or night. One pump covers the face and neck. If you use retinal, alternate nights for the first two weeks.',
    inci:
      'Aqua, Glycerin, Caprylic/Capric Triglyceride, Ceramide NP, Niacinamide, Panthenol, Squalane, Sodium Hyaluronate, Allantoin, Tocopherol, Xanthan Gum, Phenoxyethanol. Free of fragrance and essential oils.',
    testing:
      'A cushion cream with 4% niacinamide and ceramide NP, fragrance-free and formulated without drying alcohols. One pump covers face and neck.',
  },
  'azelaic-10-serum': {
    texture: 'Water-light serum, no silicone slip.',
    howto:
      'Three drops on dry skin, once daily for the first five days, then twice daily. Follow with moisturiser. Do not layer with retinal on the same night during the first month.',
    inci:
      'Aqua, Azelaic Acid, Propanediol, Glycerin, Niacinamide, Allantoin, Panthenol, Sodium Hyaluronate, Hydroxyethylcellulose, Phenoxyethanol. Free of fragrance, essential oils and alcohol denat.',
    testing:
      'A water-light gel-serum with 10% azelaic acid, allantoin and niacinamide. Fragrance-free, with no alcohol denat and no silicone slip.',
  },
  'glycerin-essence-toner': {
    texture: 'Thin essence that absorbs without film.',
    howto:
      'Press three to four drops into damp skin after cleansing, before serum. Layer twice in winter or when skin feels tight within a minute of washing.',
    inci:
      'Aqua, Glycerin, Butylene Glycol, Panthenol, Niacinamide, Sodium Hyaluronate, Allantoin, Betaine, Phenoxyethanol. Free of fragrance, essential oils and alcohol denat.',
    testing:
      '12% glycerin with panthenol and niacinamide. No alcohol, no fragrance and no essential oils, so it does not create the tightness it is meant to fix.',
  },
  'oat-milk-cleanser': {
    texture: 'Cream-to-milk, low foam.',
    howto:
      'Massage onto dry skin for thirty seconds, add water to emulsify, rinse. Use morning and night. For heavy makeup, use a pre-clean step first.',
    inci:
      'Aqua, Glycerin, Avena Sativa Kernel Flour, Caprylic/Capric Triglyceride, Cetearyl Alcohol, Panthenol, Allantoin, Sodium Cocoyl Isethionate, Xanthan Gum, Phenoxyethanol. pH 5.5. Free of sulfates and fragrance.',
    testing:
      'A cream cleanser at pH 5.5 with colloidal oat and panthenol, free of sulfate surfactants and fragrance. Rinses without a squeak.',
  },
  'mineral-veil-spf-40': {
    texture: 'Light cream with a dewy mineral finish.',
    howto:
      'Apply two finger-lengths to face and neck as the last morning step. Reapply every two hours outdoors. Wait for moisturiser to set before applying to avoid pilling.',
    inci:
      'Zinc Oxide 18%, Aqua, Caprylic/Capric Triglyceride, Glycerin, Squalane, Niacinamide, Avena Sativa Kernel Flour, Tocopherol, Xanthan Gum, Phenoxyethanol. Tinted versions add iron oxides. Free of chemical UV filters and fragrance.',
    testing:
      'Zinc oxide at 18%, labelled SPF 40 and broad spectrum, with 40-minute water resistance. Sold untinted and in a deep tint for medium to deep skin.',
  },
  'encapsulated-retinal-01': {
    texture: 'Silky serum with a faint amber tint.',
    howto:
      'One pump at night, every third night for two weeks, then every other night if skin stays calm. Buffer with moisturiser. Sunscreen daily is not optional.',
    inci:
      'Caprylic/Capric Triglyceride, Squalane, Retinal (0.1%), Ceramide NP, Cholesterol, Tocopherol, Bisabolol, Helianthus Annuus Seed Oil. Encapsulated. Free of fragrance and essential oils.',
    testing:
      '0.1% retinaldehyde in an encapsulated base, buffered with ceramide NP and squalane. Fragrance-free, and light enough to layer over a toner.',
  },
  'barrier-ritual-set': {
    texture: 'Three-step routine: milk cleanser, essence, balm.',
    howto:
      'Morning: cleanse, essence, sunscreen. Night: cleanse, essence, balm. The printed card in the box lists the order; keep actives in a separate step.',
    inci:
      'Contains Oat Milk Cleanser, Glycerin Essence Toner and Barrier Repair Balm at full size. Full INCI lists for each are printed on the individual cartons and linked from each product page.',
    testing:
      'Three full sizes — Oat Milk Cleanser, Glycerin Essence Toner and Barrier Repair Balm — with a printed routine card in the box.',
  },
};

export const helpTopics = [
  {
    id: 'orders',
    title: 'Orders and tracking',
    blurb: 'Where is my order, change an address, cancel before dispatch.',
    links: ['Track an order', 'Change shipping address', 'Cancel an order', 'Order status meanings'],
  },
  {
    id: 'returns',
    title: 'Returns and refunds',
    blurb: '30 days, prepaid label, refund in 3–5 business days.',
    links: ['Start a return', 'Return eligibility', 'Refund timing', 'Damaged or wrong item'],
  },
  {
    id: 'shipping',
    title: 'Shipping and delivery',
    blurb: 'Free over ₹999, 3–5 business days standard across India.',
    links: ['Shipping rates', 'Delivery estimates', 'Customs and duties', 'Lost parcel claims'],
  },
  {
    id: 'products',
    title: 'Products and routines',
    blurb: 'What to use for your concern, layering order, and what to avoid mixing.',
    links: ['Which moisturiser for dry skin', 'Retinal and acids together', 'Pregnancy-safe options', 'Patch testing'],
  },
  {
    id: 'account',
    title: 'Account and payment',
    blurb: 'Guest checkout, saved cards, invoices, and password help.',
    links: ['Check out as a guest', 'Why we do not store card numbers', 'Download invoices', 'Reset password'],
  },
  {
    id: 'standards',
    title: 'Our standards',
    blurb: 'Formulation rules, testing, sourcing, and what we refuse to use.',
    links: ['Fragrance policy', 'Animal testing position', 'Ingredient sourcing', 'Clinical testing methods'],
  },
];

export const faqs = [
  {
    q: 'How long does shipping take and what does it cost?',
    a: 'Standard shipping is ₹49 and arrives in 3–5 business days. Express is ₹99 and arrives in 1–2 business days. Orders over ₹999 ship free across India. GST is calculated before payment and shown in the order summary.',
  },
  {
    q: 'Can I return a product I have opened?',
    a: 'Yes. You have 30 days from delivery to return any product, opened or unopened. The prepaid label is free across India. Refunds go to the original payment method within 3–5 business days of the parcel arriving at our warehouse.',
  },
  {
    q: 'Do I need an account to check out?',
    a: 'No. Guest checkout is the default. You can track the order with your order number and email without creating an account, and creating one afterwards is optional.',
  },
  {
    q: 'Which moisturiser is right for dry, stinging skin?',
    a: 'Start with Barrier Repair Balm at night and Glycerin Essence Toner underneath. If your skin is also acne-prone, use Ceramide Night Cream instead of the balm. Both are fragrance-free. If stinging continues after two weeks, stop actives and speak to a clinician.',
  },
  {
    q: 'Can I use the retinal with the azelaic serum?',
    a: 'Not on the same night for the first month. Alternate them, and keep the retinal to every third night until your skin stays calm for two weeks. Use sunscreen daily throughout.',
  },
  {
    q: 'How do you handle card data and privacy?',
    a: 'Card numbers are entered directly into our payment processor and never touch our servers. We store only the last four digits and the card brand so you can identify a payment method. Analytics load only after consent, and we do not sell customer data.',
  },
];
