/* Clay & Kin — client behaviour. No third-party scripts, no trackers. */
(() => {
  'use strict';

  const C = window.CLAY_CATALOG;
  if (!C) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = (n) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  const moneyCompact = (n) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);
  const round2 = (n) => Math.round(n * 100) / 100;

  // The build is portable: pages declare their depth in data-base so the same
  // markup works from a server or straight off disk (file://).
  const BASE = document.documentElement.dataset.base || '/';
  const link = (url) => {
    if (!url.startsWith('/') || url.startsWith('//')) return url;
    const [, pathname = '/', search = '', hash = ''] = url.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/) || [];
    const file = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    return BASE + file.replace(/^\//, '') + search + hash;
  };

  const bySku = new Map();
  const bySlug = new Map();
  C.products.forEach((p) => {
    bySlug.set(p.slug, p);
    p.sizes.forEach((s) => bySku.set(s.sku, { product: p, size: s }));
  });

  /* ------------------------------------------------------------------
     Cart
     ------------------------------------------------------------------ */
  const CART_KEY = 'ck-cart-v1';
  const FREE_SHIP = C.policies.shipping.freeThreshold;
  const TAX_RATE = 0.18; // GST estimate for the demo; replace with a real tax service

  const readCart = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(raw)
        ? raw.filter((i) => bySku.has(i.sku) && Number(i.qty) > 0)
        : [];
    } catch {
      return [];
    }
  };

  let cart = readCart();

  const cartCount = () => cart.reduce((n, i) => n + i.qty, 0);
  const cartSubtotal = () =>
    cart.reduce((sum, i) => sum + (bySku.get(i.sku)?.size.price || 0) * i.qty, 0);

  function emitCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    document.dispatchEvent(new CustomEvent('cart:change'));
  }

  function announce(message) {
    const live = $('[data-cart-live]');
    if (live) live.textContent = message;
  }

  function toast(message, linkLabel = 'View cart', linkHref = '/cart/') {
    let host = $('[data-toast-host]');
    if (!host) {
      host = document.createElement('div');
      host.className = 'toast-host';
      host.setAttribute('data-toast-host', '');
      document.body.appendChild(host);
    }
    host.innerHTML = `<div class="toast" role="status">
      <span>${message}</span>
      <a href="${link(linkHref)}">${linkLabel}</a>
    </div>`;
    clearTimeout(host._timer);
    host._timer = setTimeout(() => {
      host.innerHTML = '';
    }, 4000);
  }

  function addToCart(sku, qty = 1, { silent = false } = {}) {
    const entry = bySku.get(sku);
    if (!entry) return;
    const line = cart.find((i) => i.sku === sku);
    if (line) line.qty = Math.min(6, line.qty + qty);
    else cart.push({ sku, qty: Math.min(6, qty) });
    emitCart();
    if (!silent) {
      announce(`${entry.product.name} added to cart. ${cartCount()} items now in cart.`);
      toast(`${entry.product.name} added`);
    }
  }

  function setQty(sku, qty) {
    const line = cart.find((i) => i.sku === sku);
    if (!line) return;
    if (qty <= 0) cart = cart.filter((i) => i.sku !== sku);
    else line.qty = Math.min(6, qty);
    emitCart();
  }

  function removeLine(sku) {
    const entry = bySku.get(sku);
    cart = cart.filter((i) => i.sku !== sku);
    emitCart();
    announce(`${entry ? entry.product.name : 'Item'} removed. ${cartCount()} items in cart.`);
  }

  function shippingCost(method, subtotal) {
    const s = C.policies.shipping;
    if (method === 'express') return s.express.price;
    return subtotal >= FREE_SHIP && subtotal > 0 ? 0 : s.standard.price;
  }

  let previousCount = cartCount();

  function syncCartBadge() {
    const count = cartCount();
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = String(count);
      el.dataset.empty = count === 0 ? 'true' : 'false';
      if (count > previousCount) {
        el.classList.remove('is-bumped');
        void el.offsetWidth; // restart the animation on repeat adds
        el.classList.add('is-bumped');
      }
    });
    $$('[data-cart-status]').forEach((el) => {
      el.textContent = `Cart, ${count} item${count === 1 ? '' : 's'}`;
    });
    previousCount = count;
  }

  document.addEventListener('cart:change', syncCartBadge);
  syncCartBadge();

  $$('[data-quick-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.sku, 1);
      btn.textContent = 'Added';
      setTimeout(() => {
        btn.textContent = 'Add';
      }, 1600);
    });
  });

  /* ------------------------------------------------------------------
     Header: mega menu, mobile dialog
     ------------------------------------------------------------------ */
  const closeMegas = () => {
    $$('.nav-trigger').forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
    $$('.mega').forEach((panel) => {
      panel.hidden = true;
    });
  };

  $$('.nav-item').forEach((item) => {
    const trigger = $('.nav-trigger', item);
    const panel = $('.mega', item);
    if (!trigger || !panel) return;
    const open = () => {
      closeMegas();
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    };
    trigger.addEventListener('click', () => {
      panel.hidden ? open() : close();
    });
    item.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) open();
    });
    item.addEventListener('mouseleave', () => {
      if (window.matchMedia('(hover: hover)').matches) close();
    });
    item.addEventListener('focusout', (event) => {
      if (!item.contains(event.relatedTarget)) close();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMegas();
      const panel = $('[data-search-panel]');
      if (panel && !panel.hidden) {
        panel.hidden = true;
        const input = $('[data-search-input]');
        if (input) input.setAttribute('aria-expanded', 'false');
      }
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-item')) closeMegas();
  });

  const mobileNav = $('#mobile-nav');
  const mobileToggle = $('[data-open-mobile-nav]');
  if (mobileNav && mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.setAttribute('aria-expanded', 'true');
      mobileNav.showModal();
      const first = $('a, button', mobileNav);
      if (first) first.focus();
    });
    $$('[data-close-mobile-nav]').forEach((btn) =>
      btn.addEventListener('click', () => {
        mobileNav.close();
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.focus();
      }),
    );
    mobileNav.addEventListener('close', () => mobileToggle.setAttribute('aria-expanded', 'false'));
  }

  /* ------------------------------------------------------------------
     Intent search with predictive counts
     ------------------------------------------------------------------ */
  const searchForm = $('[data-search-form]');
  const searchInput = $('[data-search-input]');
  const searchPanel = $('[data-search-panel]');
  const searchStatus = $('[data-search-status]');

  if (searchForm && searchInput && searchPanel) {
    const index = C.products.map((p) => {
      const concernLabels = p.concerns
        .map((id) => C.concerns.find((c) => c.id === id)?.label || '')
        .join(' ');
      const synonyms = p.concerns
        .flatMap((id) => C.concerns.find((c) => c.id === id)?.synonyms || [])
        .join(' ');
      return {
        product: p,
        text: [
          p.name,
          p.subtitle,
          p.format,
          concernLabels,
          synonyms,
          p.ingredients.join(' '),
          p.benefits.join(' '),
        ]
          .join(' ')
          .toLowerCase(),
      };
    });

    const findIntent = (query) => {
      const q = query.toLowerCase().trim();
      if (q.length < 3) return null;
      return (
        C.concerns.find(
          (c) =>
            c.label.toLowerCase().includes(q) ||
            c.synonyms.some((s) => s === q || (q.length > 3 && s.startsWith(q))),
        ) || null
      );
    };

    const runSearch = (query) => {
      const q = query.toLowerCase().trim();
      if (!q) return { intent: null, items: [] };
      const intent = findIntent(q);
      const tokens = q.split(/\s+/).filter((t) => t.length > 1);
      const scored = index
        .map(({ product, text }) => {
          let score = 0;
          const name = product.name.toLowerCase();
          if (name.includes(q)) score += 100;
          if (name.startsWith(q)) score += 30;
          if (intent && product.concerns.includes(intent.id)) score += 70;
          tokens.forEach((t) => {
            if (name.includes(t)) score += 18;
            else if (text.includes(t)) score += 6;
          });
          return { product, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      return { intent, items: scored.map((x) => x.product) };
    };

    let results = { intent: null, items: [] };
    let activeIndex = -1;
    let debounce;

    const render = (query) => {
      results = runSearch(query);
      const total = results.items.length;
      const show = results.items.slice(0, 5);
      activeIndex = -1;

      if (!query.trim()) {
        searchPanel.hidden = true;
        searchInput.setAttribute('aria-expanded', 'false');
        if (searchStatus) searchStatus.textContent = '';
        return;
      }

      let html = '';
      if (results.intent) {
        const concernCount = C.products.filter((p) =>
          p.concerns.includes(results.intent.id),
        ).length;
        html += `<p class="search-panel-label">Concern match</p>
          <a class="search-option" role="option" aria-selected="false" href="${link(`/shop/?concern=${results.intent.id}`)}">
            <span class="search-option-icon" aria-hidden="true">${results.intent.label.slice(0, 1)}</span>
            <span>
              <span class="opt-name">${results.intent.label}</span>
              <span class="opt-meta">${concernCount} product${concernCount === 1 ? '' : 's'} matched</span>
            </span>
            <span class="opt-price">View</span>
          </a>`;
      }

      if (show.length) {
        html += `<p class="search-panel-label">Products</p>`;
        show.forEach((p, i) => {
          html += `<a class="search-option" role="option" aria-selected="false"
              data-search-option data-index="${i}" href="${link(`/product/${p.slug}/`)}">
            <img src="${link(`/assets/img/${p.slug}-front-480.webp`)}" width="44" height="55" alt="" loading="lazy">
            <span>
              <span class="opt-name">${p.name}</span>
              <span class="opt-meta">${p.format} · ${p.sizes[0].label}</span>
            </span>
            <span class="opt-price">${money(p.price)}</span>
          </a>`;
        });
      }

      if (!total) {
        html += `<div class="search-empty">
          <p style="margin:0 0 6px">No product matches “<strong>${query.replace(/</g, '&lt;')}</strong>”.</p>
          <p style="margin:0">Try a symptom: “dry skin”, “stinging”, “flaking”, “redness”. Or <a href="${link('/help/')}">read the help centre</a>.</p>
        </div>`;
      } else {
        html += `<a class="search-all" href="${link(`/shop/?q=${encodeURIComponent(query)}`)}">
          <span>See all ${total} result${total === 1 ? '' : 's'} for “${query.replace(/</g, '&lt;')}”</span>
          <span aria-hidden="true">→</span>
        </a>`;
      }

      searchPanel.innerHTML = html;
      searchPanel.hidden = false;
      searchInput.setAttribute('aria-expanded', 'true');
      if (searchStatus) {
        searchStatus.textContent = `${total} result${total === 1 ? '' : 's'} for ${query}`;
      }
    };

    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      const value = searchInput.value;
      debounce = setTimeout(() => render(value), 120);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim()) render(searchInput.value);
    });

    const options = () => $$('[data-search-option]', searchPanel);

    const setActive = (dir) => {
      const items = options();
      if (!items.length) return;
      activeIndex = (activeIndex + dir + items.length) % items.length;
      items.forEach((el, i) => el.setAttribute('aria-selected', String(i === activeIndex)));
      const active = items[activeIndex];
      active.scrollIntoView({ block: 'nearest' });
      searchInput.setAttribute('aria-activedescendant', active.id || '');
    };

    searchInput.addEventListener('keydown', (event) => {
      if (searchPanel.hidden) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive(-1);
      } else if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault();
        options()[activeIndex].click();
      }
    });

    searchForm.addEventListener('submit', (event) => {
      const shopData = $('#shop-data');
      if (shopData && searchInput.value.trim()) {
        event.preventDefault();
        searchPanel.hidden = true;
        searchInput.setAttribute('aria-expanded', 'false');
        window.dispatchEvent(
          new CustomEvent('shop:query', { detail: { q: searchInput.value.trim() } }),
        );
      }
    });

    document.addEventListener('click', (event) => {
      if (!searchForm.contains(event.target)) {
        searchPanel.hidden = true;
        searchInput.setAttribute('aria-expanded', 'false');
      }
    });

    const initialQ = new URLSearchParams(window.location.search).get('q');
    if (initialQ && $('#shop-data')) searchInput.value = initialQ;
  }

  /* ------------------------------------------------------------------
     Product detail
     ------------------------------------------------------------------ */
  const pdpForm = $('[data-pdp-form]');
  if (pdpForm) {
    const mainImage = $('#gallery-image');
    const caption = $('[data-gallery-caption]');

    $$('[data-gallery-thumb]').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        $$('[data-gallery-thumb]').forEach((t) => t.setAttribute('aria-current', 'false'));
        thumb.setAttribute('aria-current', 'true');
        const file = thumb.dataset.file;
        mainImage.src = link(`/assets/img/${file}-960.webp`);
        mainImage.srcset = `${link(`/assets/img/${file}-480.webp`)} 480w, ${link(`/assets/img/${file}-960.webp`)} 960w`;
        mainImage.alt = thumb.dataset.alt;
        mainImage.style.objectPosition = thumb.dataset.position || 'center';
        mainImage.classList.remove('is-fading');
        void mainImage.offsetWidth;
        mainImage.classList.add('is-fading');
        caption.textContent = thumb.dataset.caption;
      });
    });

    const qtyOutput = $('output', pdpForm);
    let qty = 1;
    $$('[data-qty-step]', pdpForm).forEach((btn) => {
      btn.addEventListener('click', () => {
        qty = Math.min(6, Math.max(1, qty + Number(btn.dataset.qtyStep)));
        qtyOutput.textContent = String(qty);
      });
    });

    const sizeRadios = $$('[name="size"]', pdpForm);
    const selectedSku = () =>
      (sizeRadios.find((r) => r.checked)?.value) || $('[data-add-to-cart]').dataset.slug;

    const updatePrice = () => {
      const radio = sizeRadios.find((r) => r.checked);
      if (!radio) return;
      const price = Number(radio.dataset.sizePrice);
      const label = radio.dataset.sizeLabel;
      const ml = Number((label.match(/(\d+)\s*ml/) || [])[1] || 0);
      const per = ml ? ` · ${moneyCompact(price / ml)}/ml` : '';
      const priceEl = $('[data-price]');
      if (priceEl) priceEl.textContent = money(price);
      const perEl = $('[data-per]');
      if (perEl) perEl.textContent = `${label}${per}`;
      const btnPrice = $('[data-button-price]');
      if (btnPrice) btnPrice.textContent = money(price);
      const sticky = $('[data-sticky-price]');
      if (sticky) sticky.textContent = money(price);
      const stickySize = $('[data-sticky-size]');
      if (stickySize) stickySize.textContent = label;
    };
    sizeRadios.forEach((r) => r.addEventListener('change', updatePrice));

    const submitAdd = () => {
      const sku = selectedSku();
      if (!bySku.has(sku)) return;
      addToCart(sku, qty);
    };
    pdpForm.addEventListener('submit', (event) => {
      event.preventDefault();
      submitAdd();
    });
    const stickyAdd = $('[data-sticky-add]');
    if (stickyAdd) stickyAdd.addEventListener('click', submitAdd);

    // On phones the thumb-zone buy bar is present from first paint, so the
    // title, price and add-to-cart action are all in the initial viewport.
    const stickyBar = $('[data-sticky-buy]');
    const mainCta = $('[data-pdp-form] [data-add-to-cart]');
    if (stickyBar) {
      const mobile = window.matchMedia('(max-width: 960px)');
      let observer = null;
      const startObserver = () => {
        if (!mainCta || !('IntersectionObserver' in window)) return;
        observer = new IntersectionObserver(
          (entries) => {
            if (mobile.matches) return;
            entries.forEach((entry) => {
              const passed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
              stickyBar.hidden = !passed;
            });
          },
          { rootMargin: '0px 0px -40% 0px' },
        );
        observer.observe(mainCta);
      };
      if (mobile.matches) stickyBar.hidden = false;
      else startObserver();
      mobile.addEventListener('change', (event) => {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        if (event.matches) stickyBar.hidden = false;
        else {
          stickyBar.hidden = true;
          startObserver();
        }
      });
    }
  }

  /* ------------------------------------------------------------------
     Shop: facets, sorting, intent copy
     ------------------------------------------------------------------ */
  const shopDataEl = $('#shop-data');
  if (shopDataEl) {
    const data = JSON.parse(shopDataEl.textContent);
    const cards = $$('[data-product-grid] .product-card');
    const grid = $('[data-product-grid]');
    const params = new URLSearchParams(window.location.search);

    const facetNames = ['concern', 'type', 'format', 'price', 'ingredient'];
    const state = {
      q: params.get('q') || '',
      sort: params.get('sort') || 'featured',
      concern: new Set(params.getAll('concern')),
      type: new Set(params.getAll('type')),
      format: new Set(params.getAll('format')),
      price: new Set(params.getAll('price')),
      ingredient: new Set(params.getAll('ingredient')),
    };

    const priceTests = {
      'under-500': (p) => p.price < 500,
      '500-700': (p) => p.price >= 500 && p.price < 700,
      '700-900': (p) => p.price >= 700 && p.price < 900,
      'over-900': (p) => p.price >= 900,
    };

    const intentFor = () => {
      if (!state.q) return null;
      const q = state.q.toLowerCase().trim();
      return (
        data.concerns.find(
          (c) =>
            c.label.toLowerCase().includes(q) ||
            c.synonyms.some((s) => s === q || (q.length > 3 && s.startsWith(q))),
        ) || null
      );
    };

    const matches = (p, skip) => {
      if (state.q) {
        const intent = intentFor();
        if (intent) {
          // A symptom query is a hard filter: only products tagged for it.
          if (!p.concerns.includes(intent.id)) return false;
        } else {
          const tokens = state.q.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
          const haystack = [
            p.name,
            p.format,
            ...p.concerns,
            ...p.skinTypes,
            ...p.ingredients,
            ...p.benefits,
          ]
            .join(' ')
            .toLowerCase();
          if (!tokens.every((t) => haystack.includes(t))) return false;
        }
      }
      if (skip !== 'concern' && state.concern.size && !p.concerns.some((c) => state.concern.has(c)))
        return false;
      if (skip !== 'type' && state.type.size && !p.skinTypes.some((t) => state.type.has(t)))
        return false;
      if (skip !== 'format' && state.format.size && !state.format.has(p.format)) return false;
      if (
        skip !== 'ingredient' &&
        state.ingredient.size &&
        !p.ingredients.some((i) => state.ingredient.has(i))
      )
        return false;
      if (skip !== 'price' && state.price.size) {
        const ok = [...state.price].some((band) => priceTests[band]?.(p));
        if (!ok) return false;
      }
      return true;
    };

    const activeCount = () =>
      facetNames.reduce((n, name) => n + state[name].size, 0) + (state.q ? 1 : 0);

    const syncFacetInputs = () => {
      $$('[data-facet]').forEach((input) => {
        input.checked = state[input.dataset.facet]?.has(input.value) || false;
      });
    };

    const updateFacetCounts = () => {
      facetNames.forEach((name) => {
        $$(`[data-count-for^="${name}:"], [data-count-for^="ingredient:"]`).length;
      });
      $$('[data-count-for]').forEach((el) => {
        const [name, value] = el.dataset.countFor.split(':');
        const count = data.products.filter((p) => {
          if (!matches(p, name)) return false;
          if (name === 'price') return priceTests[value]?.(p);
          if (name === 'concern') return p.concerns.includes(value);
          if (name === 'type') return p.skinTypes.includes(value);
          if (name === 'format') return p.format === value;
          if (name === 'ingredient') return p.ingredients.includes(value);
          return false;
        }).length;
        el.textContent = String(count);
      });
    };

    const renderChips = () => {
      const chipsHost = $('[data-chips]');
      if (!chipsHost) return;
      const chips = [];
      facetNames.forEach((name) => {
        state[name].forEach((value) => {
          const input = $(`[data-facet="${name}"][value="${value}"]`);
          const label =
            input?.closest('label')?.querySelector('span')?.textContent?.trim() || value;
          chips.push(
            `<button class="chip" type="button" data-remove-facet="${name}" data-value="${value}">
              ${label} <span aria-hidden="true">×</span><span class="visually-hidden">Remove filter</span>
            </button>`,
          );
        });
      });
      if (state.q) {
        chips.push(
          `<button class="chip" type="button" data-remove-q>“${state.q.replace(/</g, '&lt;')}” <span aria-hidden="true">×</span><span class="visually-hidden">Remove search</span></button>`,
        );
      }
      chipsHost.innerHTML = chips.join('');
      chipsHost.hidden = chips.length === 0;

      $$('[data-remove-facet]', chipsHost).forEach((btn) => {
        btn.addEventListener('click', () => {
          state[btn.dataset.removeFacet].delete(btn.dataset.value);
          syncFacetInputs();
          apply();
        });
      });
      const removeQ = $('[data-remove-q]', chipsHost);
      if (removeQ) {
        removeQ.addEventListener('click', () => {
          state.q = '';
          const input = $('[data-search-input]');
          if (input) input.value = '';
          apply();
        });
      }
    };

    const updateUrl = () => {
      const next = new URLSearchParams();
      if (state.q) next.set('q', state.q);
      facetNames.forEach((name) => {
        state[name].forEach((v) => next.append(name, v));
      });
      if (state.sort !== 'featured') next.set('sort', state.sort);
      const qs = next.toString();
      try {
        history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
      } catch {
        // file:// documents have an opaque origin; filtering still works without URL sync.
      }
    };

    const sortCards = () => {
      const list = [...cards];
      if (state.sort === 'price-asc')
        list.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
      else if (state.sort === 'price-desc')
        list.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
      else list.sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
      list.forEach((card) => grid.appendChild(card));
    };

    function apply() {
      let visible = 0;
      cards.forEach((card) => {
        const p = data.products.find((x) => x.slug === card.dataset.slug);
        const show = matches(p);
        card.hidden = !show;
        if (show) visible += 1;
      });
      sortCards();

      const countEl = $('[data-results-count]');
      if (countEl) {
        countEl.innerHTML = `<strong>${visible}</strong> product${visible === 1 ? '' : 's'}`;
      }
      const dialogCount = $('[data-dialog-count]');
      if (dialogCount) dialogCount.textContent = String(visible);
      const empty = $('[data-empty]');
      if (empty) empty.hidden = visible !== 0;
      const gridHost = $('[data-product-grid]');
      if (gridHost) gridHost.hidden = visible === 0;

      const badge = $('[data-filter-count]');
      if (badge) {
        badge.textContent = String(activeCount());
        badge.hidden = activeCount() === 0;
      }

      const intentNote = $('[data-intent-note]');
      const intentCopy = $('[data-intent-copy]');
      if (intentNote && intentCopy) {
        const intent = intentFor();
        if (intent) {
          intentCopy.textContent = `“${state.q}” matched the concern “${intent.label}”. ${visible} product${visible === 1 ? '' : 's'} shown.`;
          intentNote.hidden = false;
        } else {
          intentNote.hidden = true;
        }
      }

      const title = $('#shop-title');
      if (title) {
        const intent = intentFor();
        const concernLabel = state.concern.size === 1
          ? data.concerns.find((c) => c.id === [...state.concern][0])?.label
          : null;
        title.textContent = concernLabel
          ? `Products for ${concernLabel.toLowerCase()}`
          : intent
            ? `Products for ${intent.label.toLowerCase()}`
            : state.q
              ? `Results for “${state.q}”`
              : 'All products';
      }

      renderChips();
      updateFacetCounts();
      updateUrl();
    }

    syncFacetInputs();
    const sortSelect = $('[data-sort]');
    if (sortSelect) {
      sortSelect.value = state.sort;
      sortSelect.addEventListener('change', () => {
        state.sort = sortSelect.value;
        apply();
      });
    }

    const handleFacetChange = (input) => {
      const name = input.dataset.facet;
      if (input.checked) state[name].add(input.value);
      else state[name].delete(input.value);
      syncFacetInputs();
      apply();
    };

    $$('[data-facet]').forEach((input) => {
      input.addEventListener('change', () => handleFacetChange(input));
    });

    $$('[data-clear-facets]').forEach((btn) => {
      btn.addEventListener('click', () => {
        facetNames.forEach((name) => state[name].clear());
        state.q = '';
        const input = $('[data-search-input]');
        if (input) input.value = '';
        syncFacetInputs();
        apply();
        announce('Filters cleared.');
      });
    });

    window.addEventListener('shop:query', (event) => {
      state.q = event.detail.q;
      apply();
      const results = $('[data-results-count]');
      if (results) results.scrollIntoView({ block: 'center' });
    });

    // Mobile filter drawer: clone the facet form, keep state in sync.
    const filterDialog = $('#filter-dialog');
    const filterBody = $('[data-filter-dialog-body]');
    const facetsForm = $('[data-facet-form]');
    if (filterDialog && filterBody && facetsForm) {
      const clone = facetsForm.cloneNode(true);
      clone.removeAttribute('aria-label');
      filterBody.appendChild(clone);
      $$('[data-facet]', clone).forEach((input) => {
        input.addEventListener('change', () => {
          const original = $(`[data-facet="${input.dataset.facet}"][value="${input.value}"]`);
          if (original) {
            original.checked = input.checked;
            handleFacetChange(original);
          }
        });
      });
      $$('[data-clear-facets]', clone).forEach((btn) =>
        btn.addEventListener('click', () => {
          $$('[data-clear-facets]')[0]?.click();
        }),
      );

      $('[data-open-filters]')?.addEventListener('click', (event) => {
        filterDialog.showModal();
        event.currentTarget.setAttribute('aria-expanded', 'true');
        $$('[data-facet]', clone).forEach((i) => {
          i.checked = state[i.dataset.facet].has(i.value);
        });
        $$('[data-count-for]', clone).forEach((el) => {
          const source = $(`[data-count-for="${el.dataset.countFor}"]`);
          if (source) el.textContent = source.textContent;
        });
      });
      $$('[data-close-filters]').forEach((btn) =>
        btn.addEventListener('click', () => {
          filterDialog.close();
          $('[data-open-filters]')?.setAttribute('aria-expanded', 'false');
        }),
      );
      filterDialog.addEventListener('close', () =>
        $('[data-open-filters]')?.setAttribute('aria-expanded', 'false'),
      );
    }

    apply();
  }

  /* ------------------------------------------------------------------
     Cart page
     ------------------------------------------------------------------ */
  const cartLines = $('[data-cart-lines]');
  if (cartLines) {
    const shippingSelect = $('[data-shipping-select]');
    const checkoutLink = $('[data-checkout-link]');

    const lineHtml = ({ sku, qty }) => {
      const entry = bySku.get(sku);
      if (!entry) return '';
      const { product, size } = entry;
      return `<div class="cart-line" data-line="${sku}">
        <img src="${link(`/assets/img/${product.slug}-front-480.webp`)}" width="104" height="130" alt="" loading="lazy">
        <div>
          <p class="cart-line-name"><a href="${link(`/product/${product.slug}/`)}">${product.name}</a></p>
          <p class="cart-line-meta">${size.label} · ${money(size.price)} each · ${product.format}</p>
          <div class="cart-line-actions">
            <div class="stepper">
              <button type="button" data-cart-qty="-1" data-sku="${sku}" aria-label="Decrease quantity of ${product.name}">−</button>
              <output aria-live="polite">${qty}</output>
              <button type="button" data-cart-qty="1" data-sku="${sku}" aria-label="Increase quantity of ${product.name}">+</button>
            </div>
            <button class="link-button" type="button" data-cart-remove="${sku}">Remove</button>
          </div>
        </div>
        <p class="cart-line-price num" style="margin:0">${money(size.price * qty)}</p>
      </div>`;
    };

    function renderCart() {
      const empty = cart.length === 0;
      const emptyEl = $('[data-cart-empty]');
      if (emptyEl) emptyEl.hidden = !empty;
      cartLines.innerHTML = cart.map(lineHtml).join('');
      cartLines.hidden = empty;

      const meter = $('[data-shipping-meter]');
      if (meter) {
        if (empty) meter.hidden = true;
        else {
          const sub = cartSubtotal();
          const pct = Math.min(100, Math.round((sub / FREE_SHIP) * 100));
          meter.hidden = false;
          const copy = $('[data-meter-copy]');
          if (copy) {
            copy.innerHTML =
              sub >= FREE_SHIP
                ? `<strong>Free standard shipping unlocked.</strong> ${money(sub)} subtotal.`
                : `Add <strong>${money(FREE_SHIP - sub)}</strong> for free standard shipping.`;
          }
          const bar = $('[data-meter-bar]');
          if (bar) {
            bar.setAttribute('aria-valuenow', String(pct));
            const fill = bar.firstElementChild;
            if (fill) fill.style.width = `${pct}%`;
          }
        }
      }

      const sub = cartSubtotal();
      const method = shippingSelect?.value || 'standard';
      const shipping = empty ? 0 : shippingCost(method, sub);
      const standardOption = shippingSelect?.querySelector('option[value="standard"]');
      if (standardOption) {
        standardOption.textContent = `India standard — 3–5 business days (${
          sub >= FREE_SHIP && sub > 0 ? 'free' : money(C.policies.shipping.standard.price)
        })`;
      }
      const tax = round2(sub * TAX_RATE);
      const total = round2(sub + shipping + tax);

      const set = (sel, value) => {
        const el = $(sel);
        if (el) el.textContent = money(value);
      };
      set('[data-subtotal]', sub);
      if (shipping === 0 && !empty) {
        const el = $('[data-shipping]');
        if (el) el.textContent = 'Free';
      } else set('[data-shipping]', shipping);
      set('[data-tax]', tax);
      set('[data-total]', total);

      if (checkoutLink) {
        checkoutLink.setAttribute('aria-disabled', String(empty));
        checkoutLink.style.opacity = empty ? '0.55' : '1';
        checkoutLink.style.pointerEvents = empty ? 'none' : 'auto';
      }
    }

    cartLines.addEventListener('click', (event) => {
      const qtyBtn = event.target.closest('[data-cart-qty]');
      const removeBtn = event.target.closest('[data-cart-remove]');
      if (qtyBtn) {
        const entry = cart.find((i) => i.sku === qtyBtn.dataset.sku);
        if (entry) setQty(entry.sku, entry.qty + Number(qtyBtn.dataset.cartQty));
      }
      if (removeBtn) removeLine(removeBtn.dataset.cartRemove);
    });

    document.addEventListener('cart:change', renderCart);
    shippingSelect?.addEventListener('change', renderCart);
    renderCart();
  }

  /* ------------------------------------------------------------------
     Checkout: steps, inline validation, confirmation
     ------------------------------------------------------------------ */
  const checkoutForm = $('[data-checkout-form]');
  if (checkoutForm) {
    const panels = $$('[data-step-panel]');
    const steps = $$('[data-steps] .step');
    const nextBtn = $('[data-step-next]');
    const backBtn = $('[data-step-back]');
    const summaryEls = {
      subtotal: $('[data-co-subtotal]'),
      shipping: $('[data-co-shipping]'),
      tax: $('[data-co-tax]'),
      total: $('[data-co-total]'),
      pay: $('[data-pay-total]'),
    };
    let current = 1;

    const orderItems = $('[data-order-items]');
    const shippingMethod = () => $('[name="shippingMethod"]:checked')?.value || 'standard';

    function renderSummary() {
      if (!orderItems) return;
      if (!cart.length) {
        $('[data-checkout-layout]');
        const layout = $('.checkout-layout');
        const head = $('.checkout-head');
        if (layout) layout.hidden = true;
        if (head) head.hidden = true;
        const empty = $('[data-checkout-empty]');
        if (empty) empty.hidden = false;
        return;
      }
      orderItems.innerHTML = cart
        .map(({ sku, qty }) => {
          const { product, size } = bySku.get(sku);
          return `<div class="order-item">
            <img src="${link(`/assets/img/${product.slug}-front-480.webp`)}" width="52" height="65" alt="" loading="lazy">
            <div>${product.name}<br><span class="qty">${size.label} · Qty ${qty}</span></div>
            <span class="val">${money(size.price * qty)}</span>
          </div>`;
        })
        .join('');

      const sub = cartSubtotal();
      const shipping = shippingCost(shippingMethod(), sub);
      const tax = round2(sub * TAX_RATE);
      const total = round2(sub + shipping + tax);
      if (summaryEls.subtotal) summaryEls.subtotal.textContent = money(sub);
      if (summaryEls.shipping) summaryEls.shipping.textContent = money(shipping);
      if (summaryEls.tax) summaryEls.tax.textContent = money(tax);
      if (summaryEls.total) summaryEls.total.textContent = money(total);
      if (summaryEls.pay) summaryEls.pay.textContent = money(total);
      const breakdown = $('[data-pay-breakdown]');
      if (breakdown) {
        breakdown.textContent = `${money(sub)} subtotal · ${money(
          shipping,
        )} shipping · ${money(tax)} estimated tax. 30-day returns, prepaid label.`;
      }
    }

    $$('[name="shippingMethod"]').forEach((r) => r.addEventListener('change', renderSummary));

    function setStep(n, { focus = true } = {}) {
      current = n;
      panels.forEach((p) => {
        p.hidden = Number(p.dataset.stepPanel) !== n;
      });
      steps.forEach((s) => {
        const stepNo = Number(s.dataset.step);
        s.dataset.state = stepNo < n ? 'done' : stepNo === n ? 'current' : 'upcoming';
        const dot = $('.step-dot', s);
        if (dot) dot.textContent = stepNo < n ? '✓' : String(stepNo);
      });
      backBtn.hidden = n === 1;
      nextBtn.hidden = n === 3;
      nextBtn.textContent = n === 1 ? 'Continue to delivery' : 'Continue to payment';
      const status = $('[data-step-status]');
      if (status) {
        status.textContent = `Step ${n} of 3: ${['contact', 'delivery', 'payment'][n - 1]}`;
      }
      if (focus) {
        const heading = $(`[data-step-panel="${n}"] h2`);
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      renderSummary();
    }

    /* Validation */
    const fields = () => $$('.input, .select-full', checkoutForm);

    const luhn = (num) => {
      let sum = 0;
      let double = false;
      for (let i = num.length - 1; i >= 0; i -= 1) {
        let d = Number(num[i]);
        if (double) {
          d *= 2;
          if (d > 9) d -= 9;
        }
        sum += d;
        double = !double;
      }
      return sum % 10 === 0;
    };

    const validators = {
      email: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
          ? ''
          : 'Enter an email address in the format name@example.com.',
      firstName: (v) => (v ? '' : 'Enter your first name.'),
      lastName: (v) => (v ? '' : 'Enter your last name.'),
      address: (v) => (v ? '' : 'Enter a street address.'),
      city: (v) => (v ? '' : 'Enter a city.'),
      state: (v) => (v ? '' : 'Choose a state.'),
      zip: (v) =>
        /^[1-9]\d{5}$/.test(v) ? '' : 'Enter a 6-digit PIN code, for example 400001.',
      card: (v) => {
        const digits = v.replace(/\D/g, '');
        if (digits.length < 13 || digits.length > 19) return 'Enter the 15 or 16 digits on your card.';
        return luhn(digits) ? '' : 'That card number is not valid. Check the digits.';
      },
      expiry: (v) => {
        const m = v.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
        if (!m) return 'Use MM/YY, for example 09/29.';
        const now = new Date();
        const expiryEnd = new Date(2000 + Number(m[2]), Number(m[1]), 0);
        return expiryEnd >= now ? '' : 'That expiry date has passed.';
      },
      cvc: (v) => (/^\d{3,4}$/.test(v) ? '' : 'Enter the 3- or 4-digit security code.'),
      cardName: (v) => (v ? '' : 'Enter the name printed on the card.'),
    };

    const fieldByName = (name) => $(`[name="${name}"]`, checkoutForm);

    function showError(name, message) {
      const input = fieldByName(name);
      const error = $(`[data-error-for="${name}"]`);
      if (!input) return;
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        if (error) {
          const span = $('span', error);
          if (span) span.textContent = message;
          error.dataset.visible = 'true';
        }
      } else {
        input.removeAttribute('aria-invalid');
        if (error) {
          error.dataset.visible = 'false';
          const span = $('span', error);
          if (span) span.textContent = '';
        }
      }
    }

    function validateField(input) {
      const name = input.name;
      const validator = validators[name];
      if (!validator) return true;
      const message = validator(input.value.trim());
      showError(name, message);
      return !message;
    }

    fields().forEach((input) => {
      input.addEventListener('blur', () => {
        if (input.value.trim() || input.getAttribute('aria-invalid') === 'true') validateField(input);
      });
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') validateField(input);
      });
    });

    // Input masking + mobile keyboards are declared in HTML via inputmode.
    const cardInput = $('#card');
    cardInput?.addEventListener('input', () => {
      const digits = cardInput.value.replace(/\D/g, '').slice(0, 19);
      cardInput.value = digits.replace(/(.{4})/g, '$1 ').trim();
    });
    const expiryInput = $('#expiry');
    expiryInput?.addEventListener('input', () => {
      const digits = expiryInput.value.replace(/\D/g, '').slice(0, 4);
      expiryInput.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    });
    $('#zip')?.addEventListener('input', (event) => {
      event.target.value = event.target.value.replace(/[^\d-]/g, '').slice(0, 10);
    });
    $('#cvc')?.addEventListener('input', (event) => {
      event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4);
    });

    function validateStep(n) {
      const panel = $(`[data-step-panel="${n}"]`);
      if (!panel) return true;
      const inputs = $$('.input, .select-full', panel).filter((i) => i.name !== 'notes');
      const invalid = inputs.filter((i) => !validateField(i));
      const summary = $('[data-error-summary]');
      const list = $('[data-error-list]');
      if (invalid.length) {
        if (summary && list) {
          list.innerHTML = invalid
            .map((i) => {
              const msg = $(`[data-error-for="${i.name}"] span`)?.textContent || 'Check this field.';
              return `<li><a href="#${i.id}">${msg}</a></li>`;
            })
            .join('');
          summary.hidden = false;
          summary.focus();
        }
        return false;
      }
      if (summary) summary.hidden = true;
      return true;
    }

    nextBtn?.addEventListener('click', () => {
      if (!validateStep(current)) return;
      if (current < 3) setStep(current + 1);
    });
    backBtn?.addEventListener('click', () => {
      if (current > 1) setStep(current - 1);
    });

    checkoutForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
        const firstInvalid = $('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      const orderNumber = `CK-${Math.floor(10000 + Math.random() * 89999)}`;
      const email = fieldByName('email')?.value || '';
      const confirmation = $('[data-confirmation]');
      const layout = $('.checkout-layout');
      const head = $('.checkout-head');
      $('[data-order-number]').textContent = orderNumber;
      const emailEl = $('[data-confirm-email]');
      if (emailEl) emailEl.textContent = email;
      cart = [];
      emitCart();
      if (layout) layout.hidden = true;
      if (head) head.hidden = true;
      if (confirmation) {
        confirmation.hidden = false;
        confirmation.focus();
        confirmation.scrollIntoView({ block: 'start' });
      }
      announce(`Order ${orderNumber} confirmed. A receipt is on the way to ${email}.`);
    });

    renderSummary();
    setStep(1, { focus: false });
  }

  /* ------------------------------------------------------------------
     Account: reorder, return flow
     ------------------------------------------------------------------ */
  $$('[data-reorder]').forEach((btn) => {
    btn.addEventListener('click', () => {
      try {
        const items = JSON.parse(btn.dataset.reorder);
        items.forEach(({ sku, qty }) => addToCart(sku, qty, { silent: true }));
        announce(`${items.length} line${items.length === 1 ? '' : 's'} added to cart.`);
        toast('Items added to your cart');
      } catch {
        /* ignore malformed demo data */
      }
    });
  });

  const returnDialog = $('#return-dialog');
  if (returnDialog) {
    let lastTrigger = null;
    $$('[data-open-return]').forEach((btn) => {
      btn.addEventListener('click', () => {
        lastTrigger = btn;
        const fields = $('[data-return-fields]');
        const success = $('[data-return-success]');
        if (fields) fields.hidden = false;
        if (success) success.hidden = true;
        returnDialog.showModal();
        $('#return-reason')?.focus();
      });
    });
    $$('[data-close-return]').forEach((btn) =>
      btn.addEventListener('click', () => {
        returnDialog.close();
        lastTrigger?.focus();
      }),
    );

    const returnForm = $('[data-return-form]');
    returnForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const reason = $('#return-reason');
      const checked = $$('input[name="items"]:checked', returnForm);
      if (!reason.value) {
        reason.setCustomValidity('Choose a reason for the return.');
        reason.reportValidity();
        reason.setCustomValidity('');
        reason.focus();
        return;
      }
      if (!checked.length) {
        announce('Select at least one item to return.');
        const first = $('input[name="items"]', returnForm);
        if (first) first.focus();
        return;
      }
      $('[data-rma]').textContent = `RMA-${Math.floor(10000 + Math.random() * 89999)}`;
      $('[data-return-fields]').hidden = true;
      $('[data-return-success]').hidden = false;
      $('[data-return-success]').querySelector('a, button')?.focus();
      announce('Return authorised. A prepaid label has been emailed.');
    });
  }

  /* ------------------------------------------------------------------
     Help search
     ------------------------------------------------------------------ */
  const helpQuery = $('[data-help-query]');
  if (helpQuery) {
    const topics = $$('[data-help-topics] [data-help-item]');
    const faqs = $$('[data-help-faq]');
    const empty = $('[data-help-empty]');
    const status = $('[data-help-status]');
    const term = $('[data-help-term]');

    const filter = () => {
      const q = helpQuery.value.toLowerCase().trim();
      let topicMatches = 0;
      let faqMatches = 0;
      topics.forEach((el) => {
        const hit = !q || el.dataset.keywords.includes(q);
        el.hidden = !hit;
        if (hit) topicMatches += 1;
      });
      faqs.forEach((el) => {
        const hit = !q || el.dataset.keywords.includes(q);
        el.hidden = !hit;
        if (hit) faqMatches += 1;
      });
      if (status) {
        status.textContent = !q
          ? ''
          : `${topicMatches} topic${topicMatches === 1 ? '' : 's'} and ${faqMatches} answer${faqMatches === 1 ? '' : 's'} match “${q}”.`;
      }
      const nothing = q && topicMatches === 0 && faqMatches === 0;
      if (empty) empty.hidden = !nothing;
      if (term) term.textContent = q;
    };

    helpQuery.addEventListener('input', filter);
    $('[data-help-search-form]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      filter();
    });
  }

  /* ------------------------------------------------------------------
     Motion: sticky header shadow, scroll reveal, reduced-motion guard
     ------------------------------------------------------------------ */
  const headerEl = $('.site-header');
  if (headerEl) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        headerEl.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const reveals = $$('[data-reveal]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reveals.length) {
    if (!reduceMotion.matches && 'IntersectionObserver' in window) {
      document.documentElement.classList.add('js-motion');
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.06 },
      );
      reveals.forEach((el) => observer.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add('is-revealed'));
    }

    reduceMotion.addEventListener?.('change', (event) => {
      if (event.matches) reveals.forEach((el) => el.classList.add('is-revealed'));
    });
  }

  /* ------------------------------------------------------------------
     Small shared behaviour
     ------------------------------------------------------------------ */
  $$('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
