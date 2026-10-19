/* ==========================================================================
   Chester Ewing Columna — portfolio behavior
   Author: Chester Ewing Columna

   Replaces: jquery.min.js, bootstrap.min.js, owl.carousel.min.js,
             jquery.magnific-popup.min.js, magnific-popup-options.js,
             jquery.waypoints.min.js, jquery.easing.1.3.js, modernizr,
             respond.min.js, sweetalert2.min.js, main.js, custom.js,
             projects.js, showcase.js, tools.js, testimonials.js, writing.js
             (~370 KB of JS -> this one file, no dependencies)

   Every module is guarded by the presence of its own DOM hook, so each page
   only runs what it actually needs and a missing section is never an error.
   Dates are computed from a start date rather than written down, so nothing
   here goes stale on its own.
   ========================================================================== */

(function () {
  'use strict';

  /* ===== helpers ========================================================= */

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const el = (tag, props = {}, ...kids) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      node.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return node;
  };

  /* Text only — anything from a JSON manifest goes through this, never innerHTML */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const reduced = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(k, fallback = null) { try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  /* Resolve paths so pages nested in /projects/ or /writing/posts/ still work.
     Mirrors the depth of whichever stylesheet link the page already carries. */
  const base = (() => {
    const ref = $('link[href*="app.css"]');
    const href = ref ? ref.getAttribute('href') : '';
    const m = href.match(/^((?:\.\.\/)+)/);
    return m ? m[1] : '';
  })();

  const json = (path) =>
    fetch(base + path, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(r.status + ' ' + path);
      return r.json();
    });

  /* ===== theme =========================================================== */
  /* The flash-preventing read happens in an inline <script> in each <head>;
     this only wires the button. */

  function initTheme() {
    const btn = $('#theme-toggle');
    if (!btn) return;

    /* Dark is the default for everyone; only an explicit toggle changes it. */
    const current = () => document.documentElement.getAttribute('data-theme') || 'dark';

    const label = () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      btn.setAttribute('aria-label', `Switch to ${next} theme`);
      btn.setAttribute('title', `Switch to ${next} theme`);
    };

    label();
    btn.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      store.set('cec-theme', next);
      label();
    });
  }

  /* ===== nav ============================================================= */

  function initNav() {
    const nav = $('#nav');
    const toggle = $('#nav-toggle');
    if (!nav || !toggle) return;

    const setOpen = (open) => {
      nav.dataset.open = String(open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', () => setOpen(nav.dataset.open !== 'true'));

    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

    document.addEventListener('click', (e) => {
      if (nav.dataset.open === 'true' && !e.target.closest('#nav, #nav-toggle')) setOpen(false);
    });

    /* Mark the current page without hand-editing every file */
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('a', nav).forEach((a) => {
      const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
      if (href && href === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* ===== reveal on scroll ================================================ */

  function initReveal() {
    const nodes = $$('.reveal');
    if (!nodes.length) return;

    if (reduced() || !('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    /* Anything already at or above the fold shows at once, so a reload
       part-way down the page never lands on blank space. */
    nodes.forEach((n) => {
      if (n.getBoundingClientRect().top < window.innerHeight * 0.92) n.classList.add('is-in');
      else io.observe(n);
    });
  }

  /* ===== back to top ===================================================== */

  function initToTop() {
    const btn = $('#to-top');
    if (!btn) return;
    const onScroll = () => { btn.dataset.show = String(window.scrollY > 600); };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    btn.addEventListener('click', () =>
      scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }));
  }

  /* ===== tenure ========================================================== */
  /* Single source of truth for "how long at this job". Everything that shows a
     duration derives from the start date, so no copy anywhere can drift. */

  const TENURE_START = '2025-11-07';

  function diffYMWD(start, end) {
    let months = (end.getFullYear() - start.getFullYear()) * 12 +
                 (end.getMonth() - start.getMonth());
    if (end.getDate() < start.getDate()) months--;

    const years = Math.floor(months / 12);
    const rem = months - years * 12;

    const anchor = new Date(start);
    anchor.setFullYear(start.getFullYear() + years);
    anchor.setMonth(anchor.getMonth() + rem);

    const days = Math.max(0, Math.floor((end - anchor) / 86400000));
    return {
      years,
      months: rem,
      weeks: Math.floor(days / 7),
      days: days - Math.floor(days / 7) * 7,
      totalDays: Math.max(0, Math.floor((end - start) / 86400000)),
      totalMonths: years * 12 + rem,
    };
  }

  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  function tenurePhrase(d, format) {
    const parts = [];
    if (d.years) parts.push(plural(d.years, 'year'));
    if (d.months) parts.push(plural(d.months, 'month'));
    const bare = parts.length ? parts.join(', ') : plural(d.totalDays, 'day');

    switch (format) {
      case 'in':    return `${bare} in`;
      case 'paren': return ` (${bare})`;
      case 'short':
        return [d.years && `${d.years} yr`, d.months && `${d.months} mos`]
          .filter(Boolean).join(' ') || `${d.totalDays} days`;
      default:      return bare;
    }
  }

  function initTenure() {
    const cells = $$('[data-tenure]');
    const phrases = $$('[data-tenure-phrase]');
    const totals = $$('[data-tenure-total]');
    if (!cells.length && !phrases.length && !totals.length) return;

    const tick = () => {
      const now = new Date();
      const byStart = new Map();
      const diffFor = (startStr) => {
        const key = startStr || TENURE_START;
        if (!byStart.has(key)) byStart.set(key, diffYMWD(new Date(key), now));
        return byStart.get(key);
      };

      cells.forEach((node) => {
        const d = diffFor(node.closest('[data-tenure-start]')?.dataset.tenureStart);
        const v = d[node.dataset.tenure];
        if (v != null) node.textContent = String(v).padStart(2, '0');
      });

      totals.forEach((node) => {
        node.textContent = String(diffFor(node.dataset.tenureStart).totalDays);
      });

      phrases.forEach((node) => {
        const d = diffFor(node.dataset.tenureStart);
        node.textContent = tenurePhrase(d, node.dataset.tenurePhrase);
      });
    };

    tick();
    setInterval(tick, 60000);
  }

  /* ===== count-up stats ================================================== */

  function initCounters() {
    const nodes = $$('[data-count-to]');
    if (!nodes.length) return;

    /* Targets that track a real elapsed duration resolve first. Whole-number
       counters floor rather than round — you don't round your years of
       experience up. */
    nodes.forEach((n) => {
      const from = n.dataset.countFromTenureStart;
      if (!from) return;
      const days = Math.floor((Date.now() - new Date(from)) / 86400000);
      const div = parseFloat(n.dataset.countDivisor || '1') || 1;
      const dp = parseInt(n.dataset.countDecimals || '0', 10);
      const raw = Math.max(0, days / div);
      n.dataset.countTo = String(dp > 0 ? raw : Math.floor(raw));
    });

    const run = (node) => {
      const target = parseFloat(node.dataset.countTo);
      if (!isFinite(target)) return;
      const dp = parseInt(node.dataset.countDecimals || '0', 10);

      if (reduced()) { node.textContent = target.toFixed(dp); return; }

      const t0 = performance.now();
      const dur = 900;
      const step = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        node.textContent = (target * eased).toFixed(dp);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    nodes.forEach((n) => io.observe(n));
  }

  /* ===== availability meter ============================================== */

  function initCapacity() {
    const root = $('#capacity');
    if (!root) return;

    json('availability.json').then((d) => {
      const total = Math.max(1, Number(d.slots_total) || 1);
      const booked = Math.min(total, Math.max(0, Number(d.slots_booked) || 0));
      const open = total - booked;
      const pct = Math.round((booked / total) * 100);

      const next = new Date();
      next.setDate(next.getDate() + (Number(d.lead_days) || 0));
      const nextStr = next.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      root.replaceChildren(
        el('div', { class: 'row row--between' },
          el('span', { class: open ? 'status' : 'status status--warn' },
             open ? `${open} of ${total} slots open` : 'Fully booked this cycle'),
          el('span', { class: 'subtle', text: `Next start · ${nextStr}` })
        ),
        el('div', { class: 'meter mt-3' },
          el('div', { class: open ? 'meter__fill' : 'meter__fill meter__fill--warn',
                      style: `width:${pct}%` })
        ),
        d.status_message ? el('p', { class: 'muted mt-3', text: d.status_message }) : null
      );
    }).catch(() => { root.hidden = true; });
  }

  /* ===== currently reading =============================================== */

  function initReading() {
    const root = $('#reading');
    if (!root) return;

    json('reading.json').then((d) => {
      if (!d.title) { root.hidden = true; return; }
      const initials = d.title.split(/\s+/).slice(0, 3).map((w) => w[0]).join('').toUpperCase();
      const pct = Math.max(0, Math.min(100, Number(d.progress) || 0));

      root.replaceChildren(
        el('div', { class: 'row', style: 'align-items:flex-start;gap:1rem' },
          d.cover
            ? el('img', { src: d.cover, alt: '', width: '56', height: '84',
                          style: 'border-radius:6px;flex-shrink:0' })
            : el('div', { class: 'quote__avatar', style: 'width:56px;height:84px;border-radius:6px',
                          text: initials }),
          el('div', { style: 'flex:1;min-width:10rem' },
            el('div', { style: 'font-weight:600', text: d.title }),
            el('div', { class: 'subtle', text: d.author || '' }),
            el('div', { class: 'meter mt-3' }, el('div', { class: 'meter__fill', style: `width:${pct}%` })),
            el('div', { class: 'subtle mt-3', text: `${pct}% through` })
          )
        )
      );
    }).catch(() => { root.hidden = true; });
  }

  /* ===== projects ======================================================== */

  const STATUS_LABEL = { live: 'Live', wip: 'In progress', archived: 'Archived', private: 'Private' };

  function projectCard(p) {
    const badgeClass = p.status === 'live' ? 'badge badge--live'
                     : p.status === 'wip'  ? 'badge badge--wip' : 'badge';

    /* The metrics already in projects/index.json, surfaced as highlight chips */
    const metrics = (p.metrics || []).slice(0, 3).map((m) =>
      el('span', { class: 'chip chip--accent' }, `${m.value} ${m.label}`));

    const links = [
      p.slug && el('a', { class: 'link-arrow', href: `${base}projects/${esc(p.slug)}.html` },
        'Case study',
        el('span', { html: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>' })),
      p.demo && el('a', { class: 'link-arrow', href: p.demo, rel: 'noopener', target: '_blank' }, 'Live demo'),
      p.github && el('a', { class: 'link-arrow', href: p.github, rel: 'noopener', target: '_blank' }, 'Source'),
    ].filter(Boolean);

    return el('article', { class: 'card card--link reveal', 'data-cat': p.category || '' },
      p.image ? el('div', { class: 'card__media' },
        el('img', { src: base + p.image, alt: '', loading: 'lazy', decoding: 'async' })) : null,
      el('div', { class: 'card__head' },
        el('h3', { class: 'card__title' },
          el('a', { href: `${base}projects/${esc(p.slug)}.html`, text: p.title })),
        p.status ? el('span', { class: badgeClass, text: STATUS_LABEL[p.status] || p.status }) : null
      ),
      p.subtitle ? el('p', { class: 'card__sub', text: p.subtitle }) : null,
      el('p', { class: 'card__body', text: p.description || '' }),
      metrics.length ? el('div', { class: 'chips' }, metrics) : null,
      el('div', { class: 'chips' }, (p.stack || []).slice(0, 5).map((s) =>
        el('span', { class: 'chip', text: s.name || s }))),
      links.length ? el('div', { class: 'card__foot' }, links) : null
    );
  }

  function initProjects() {
    const grid = $('#projects-grid');
    const archive = $('#projects-archive');
    const filters = $('#project-filters');
    if (!grid && !archive) return;

    json('projects/index.json').then((d) => {
      const items = (d.items || []).filter((p) => p && p.title);

      /* Featured grid — the first N, newest-first as authored */
      if (grid) {
        const limit = parseInt(grid.dataset.limit || '0', 10);
        const show = limit > 0 ? items.slice(0, limit) : items;
        grid.replaceChildren(...show.map(projectCard));
        if (!show.length) grid.replaceChildren(el('p', { class: 'empty', text: 'No projects yet.' }));
        initReveal();
      }

      /* Archive — every project, compact table */
      if (archive) {
        archive.replaceChildren(...items.map((p) =>
          el('div', { class: 'post-row', 'data-cat': p.category || '' },
            el('div', { class: 'post-row__date', text: p.year || '' }),
            el('div', {},
              el('h3', { class: 'post-row__title' },
                el('a', { href: `${base}projects/${esc(p.slug)}.html`, text: p.title })),
              p.subtitle ? el('p', { class: 'post-row__excerpt', text: p.subtitle }) : null,
              el('div', { class: 'chips mt-3' },
                (p.stack || []).slice(0, 6).map((s) => el('span', { class: 'chip', text: s.name || s })))
            )
          )));
      }

      /* Filters drive both views */
      if (filters) {
        const targets = [grid, archive].filter(Boolean);
        filters.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-filter]');
          if (!btn) return;
          const want = btn.dataset.filter;
          $$('[data-filter]', filters).forEach((b) =>
            b.setAttribute('aria-pressed', String(b === btn)));
          targets.forEach((t) => $$('[data-cat]', t).forEach((card) => {
            card.hidden = want !== 'all' && card.dataset.cat !== want;
          }));
        });
      }
    }).catch((err) => {
      const msg = el('p', { class: 'empty', text: 'Could not load projects. If you opened this file directly, serve it over http instead.' });
      (grid || archive).replaceChildren(msg);
      console.warn(err);
    });
  }

  /* ===== showcase ======================================================== */

  function initShowcase() {
    const grid = $('#showcase-grid');
    if (!grid) return;

    json('showcase/index.json').then((d) => {
      const items = (d.items || []).filter((s) => s && s.title);
      if (!items.length) { grid.replaceChildren(el('p', { class: 'empty', text: 'No demos yet.' })); return; }

      grid.replaceChildren(...items.map((s) => {
        const initials = s.title.replace(/[^A-Za-z ]/g, '')
          .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

        /* Monogram panel, shown when there is no preview — and swapped in if
           the preview 404s, so a missing file degrades to this instead of a
           broken image box. (The manifest used to name previews that were
           never added, which is exactly how that happened.) */
        const monogram = () =>
          el('span', { class: 'mono', style: 'font-size:2rem;color:var(--text-subtle)', text: initials });

        const media = el('div', { class: 'card__media', style: 'display:grid;place-items:center' });
        if (s.preview) {
          const img = el('img', {
            src: `${base}showcase/${esc(s.slug)}/${esc(s.preview)}`, alt: '',
            loading: 'lazy', decoding: 'async',
          });
          img.addEventListener('error', () => media.replaceChildren(monogram()), { once: true });
          media.append(img);
        } else {
          media.append(monogram());
        }

        return el('article', { class: 'card card--link reveal' },
          media,
          el('div', { class: 'card__head' },
            el('h3', { class: 'card__title' }, el('a', { href: `${base}showcase/${esc(s.slug)}/index.html`, text: s.title })),
            s.price ? el('span', { class: 'chip chip--accent', text: s.price }) : null
          ),
          s.category ? el('p', { class: 'card__sub', text: s.category }) : null,
          el('p', { class: 'card__body', text: s.description || '' }),
          el('div', { class: 'chips' }, (s.tags || []).slice(0, 6).map((t) => el('span', { class: 'chip', text: t }))),
          el('div', { class: 'card__foot' },
            el('a', { class: 'link-arrow', href: `${base}showcase/${esc(s.slug)}/index.html` }, 'Open demo'),
            s.buyUrl ? el('a', { class: 'btn btn--ghost', href: s.buyUrl }, 'Buy this') : null
          )
        );
      }));
      initReveal();
    }).catch(() => { grid.replaceChildren(el('p', { class: 'empty', text: 'Could not load the showcase.' })); });
  }

  /* ===== tools =========================================================== */

  function initTools() {
    const grid = $('#tools-grid');
    if (!grid) return;

    json('tools/index.json').then((d) => {
      const items = (d.items || []).filter((t) => t && t.title);
      const groups = new Map();
      items.forEach((t) => {
        const k = t.category || 'other';
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(t);
      });

      grid.replaceChildren(...Array.from(groups, ([cat, list]) =>
        el('div', { class: 'full' },
          el('h3', { class: 'kicker', style: 'margin-bottom:1rem', text: cat }),
          el('div', { class: 'grid grid--3' }, list.map((t) =>
            el('article', { class: 'card card--link card--inset' },
              el('div', { class: 'card__head' },
                el('h4', {}, el('a', { href: t.url, rel: 'noopener', target: '_blank', text: t.title })),
                t.free ? el('span', { class: 'badge badge--live', text: 'Free' }) : null),
              el('p', { class: 'card__body', text: t.description || '' }),
              el('div', { class: 'chips' }, (t.tags || []).slice(0, 3).map((x) =>
                el('span', { class: 'chip', text: x })))
            )))
        )));
    }).catch(() => { grid.replaceChildren(el('p', { class: 'empty', text: 'Could not load tools.' })); });
  }

  /* ===== testimonials ==================================================== */

  function initTestimonials() {
    const section = $('#testimonials');
    const grid = $('#testimonials-grid');
    if (!grid) return;

    json('testimonials/index.json').then((d) => {
      /* Entries flagged _sample are layout placeholders, not real clients.
         They must never render — a visitor cannot tell a sample quote from a
         real one, so showing them would read as a fabricated review. Delete
         the _sample flag once a genuine testimonial replaces the text. */
      const real = (d.items || []).filter((t) => t && t.quote && t._sample !== true);

      if (!real.length) { if (section) section.hidden = true; else grid.hidden = true; return; }

      grid.replaceChildren(...real.map((t) => {
        const initials = (t.name || '?').replace(/[^A-Za-z ]/g, '')
          .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
        return el('figure', { class: 'card reveal' },
          el('blockquote', { class: 'quote__text', text: t.quote }),
          el('figcaption', { class: 'quote__who' },
            el('span', { class: 'quote__avatar', text: initials }),
            el('span', {},
              el('span', { class: 'quote__name', text: t.name || 'Client' }),
              el('span', { class: 'quote__role', style: 'display:block',
                           text: [t.role, t.company].filter(Boolean).join(' · ') })
            ))
        );
      }));
      initReveal();
    }).catch(() => { if (section) section.hidden = true; });
  }

  /* ===== writing ========================================================= */

  function initWriting() {
    const list = $('#writing-list');
    if (!list) return;

    json('writing/index.json').then((d) => {
      const items = (d.items || [])
        .filter((p) => p && p.title && p.slug)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

      const limit = parseInt(list.dataset.limit || '0', 10);
      const show = limit > 0 ? items.slice(0, limit) : items;

      if (!show.length) { list.replaceChildren(el('p', { class: 'empty', text: 'Nothing published yet.' })); return; }

      list.replaceChildren(...show.map((p) => {
        const d8 = new Date(p.date);
        const when = isNaN(d8) ? String(p.date || '')
          : d8.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return el('article', { class: 'post-row' },
          el('div', { class: 'post-row__date' }, el('time', { datetime: p.date || '', text: when })),
          el('div', {},
            el('h3', { class: 'post-row__title' },
              el('a', { href: `${base}writing/posts/${esc(p.slug)}.html`, text: p.title })),
            p.excerpt ? el('p', { class: 'post-row__excerpt', text: p.excerpt }) : null,
            el('div', { class: 'chips mt-3' }, (p.tags || []).map((t) => el('span', { class: 'chip', text: t })))
          ));
      }));
    }).catch(() => { list.replaceChildren(el('p', { class: 'empty', text: 'Could not load posts.' })); });
  }

  /* ===== scope estimator ================================================= */

  function initEstimator() {
    const root = $('#estimator');
    if (!root) return;

    const complexity = $('#est-complexity', root);
    const rush = $('#est-rush', root);
    const outPrice = $('#est-price', root);
    const outDays = $('#est-days', root);
    const outLevel = $('#est-level', root);
    if (!complexity || !outPrice) return;

    /* Rounded to the nearest 500 and grouped, so it reads like the published
       tiers right above it (₱12,000) rather than ₱10500. */
    const peso = (n) => '₱' + (Math.round(n / 500) * 500).toLocaleString('en-US');

    const calc = () => {
      const c = Number(complexity.value);           /* 1..5 */
      const isRush = rush && rush.checked;

      /* Anchored on the published tiers so the estimator can never contradict
         the price list directly above it: complexity 1 lands near Starter
         (₱4,500), 3 near Standard (₱12,000), 5 near Pro (₱30,000).
         Scope cost grows faster than linearly, hence the geometric step. */
      const step = Math.pow(1.62, c - 1);
      const low  = 4000 * step;
      const high = 7000 * step;
      const days = Math.round((3 + (c - 1) * 7) * (isRush ? 0.7 : 1));

      const mult = isRush ? 1.3 : 1;
      outPrice.textContent = `${peso(low * mult)} – ${peso(high * mult)}`;
      if (outDays) outDays.textContent = `~${days} day${days === 1 ? '' : 's'}`;
      if (outLevel) outLevel.textContent = `${c} / 5`;
    };

    complexity.addEventListener('input', calc);
    if (rush) rush.addEventListener('change', calc);
    calc();
  }

  /* ===== contact form =================================================== */

  function initForm() {
    const form = $('#contact-form');
    if (!form) return;

    const status = $('#form-status');
    const submit = $('button[type="submit"]', form);
    const endpoint = form.dataset.endpoint;
    if (!endpoint) return; /* no endpoint configured — leave the native POST alone */

    const say = (msg, state) => {
      if (!status) return;
      status.hidden = false;
      status.dataset.state = state;
      status.textContent = msg;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;

      const original = submit ? submit.textContent : '';
      if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }
      say('Sending your message…', '');

      fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
        .then((r) => r.json().catch(() => ({})).then((b) => ({ ok: r.ok, body: b })))
        .then(({ ok }) => {
          if (!ok) throw new Error('rejected');
          form.reset();
          say('Thanks — your message is on its way. I usually reply within a day.', 'ok');
        })
        .catch(() => {
          say('That did not go through. Email me directly at ce.columna404@gmail.com and I will pick it up.', 'err');
        })
        .finally(() => {
          if (submit) { submit.disabled = false; submit.textContent = original; }
        });
    });
  }

  /* ===== GitHub contributions =========================================== */

  function initGithub() {
    const root = $('#gh-graph');
    if (!root) return;

    const user = (root.dataset.user || '').trim();
    /* No username configured -> the section disappears. It must never show
       setup instructions, which is what the previous build did. */
    if (!user) { root.closest('[data-gh-section]')?.remove() ?? root.remove(); return; }

    /* Token-free public aggregator, so nothing secret lives in client code */
    fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=last`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d) => {
        const days = d.contributions || [];
        if (!days.length) throw new Error('empty');

        const total = days.reduce((n, c) => n + (c.count || 0), 0);
        const cell = (c) => {
          const tone = ['var(--bg-inset)', 'color-mix(in srgb, var(--accent) 25%, var(--bg-inset))',
                        'color-mix(in srgb, var(--accent) 45%, var(--bg-inset))',
                        'color-mix(in srgb, var(--accent) 70%, var(--bg-inset))', 'var(--accent)'];
          return el('span', {
            style: `width:10px;height:10px;border-radius:2px;background:${tone[c.level || 0]}`,
            title: `${c.count} on ${c.date}`,
          });
        };

        root.replaceChildren(
          el('div', { class: 'row row--between', style: 'margin-bottom:.75rem' },
            el('span', { class: 'subtle', text: `${total} contributions in the last year` }),
            el('a', { class: 'link-arrow', href: `https://github.com/${encodeURIComponent(user)}`,
                      rel: 'noopener', target: '_blank', text: '@' + user })),
          el('div', { style: 'display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,10px);gap:3px;overflow-x:auto;padding-bottom:4px' },
            days.map(cell))
        );
      })
      .catch(() => { root.closest('[data-gh-section]')?.remove() ?? root.remove(); });
  }

  /* ===== keyboard shortcuts ============================================= */
  /* "g then h" style jumps. Deliberately not a command palette — just the
     hints shown in the footer. */

  function initShortcuts() {
    const map = { h: 'index.html', w: 'work.html', a: 'about.html', r: 'writing.html', c: 'contact.html' };
    let armed = false;
    let timer = null;

    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;

      const k = e.key.toLowerCase();

      if (armed && map[k]) {
        armed = false;
        clearTimeout(timer);
        location.href = base + map[k];
        return;
      }

      if (k === 'g') {
        armed = true;
        clearTimeout(timer);
        timer = setTimeout(() => { armed = false; }, 1200);
      } else {
        armed = false;
      }
    });
  }

  /* ===== code copy buttons ============================================== */

  function initCodeCopy() {
    $$('pre').forEach((pre) => {
      /* Not on the hero editor or the API console: those are showpieces, and
         a floating button lands on top of the content. */
      if (pre.closest('.code-hero, .api, #api-console')) return;
      if (!$('code', pre) || $('.code-copy', pre)) return;
      pre.style.position = 'relative';
      const btn = el('button', {
        class: 'code-copy btn btn--ghost',
        type: 'button',
        style: 'position:absolute;top:.5rem;right:.5rem;padding:.3rem .6rem;font-size:.75rem',
        text: 'Copy',
        onclick: () => {
          navigator.clipboard?.writeText($('code', pre).textContent || '').then(() => {
            btn.textContent = 'Copied';
            setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
          }).catch(() => { btn.textContent = 'Press Ctrl+C'; });
        },
      });
      pre.append(btn);
    });
  }

  /* ===== service worker ================================================= */

  function initPwa() {
    /* sw.js is network-first for HTML/JSON/JS/CSS and cache-first only for
       images and fonts, so an edit is live as soon as you are online. Bump
       CACHE_VERSION in sw.js to evict everything. */
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    addEventListener('load', () => { navigator.serviceWorker.register(base + 'sw.js').catch(() => {}); });
  }

  /* ===== code hero ======================================================
     Types out a syntax-highlighted object literal. It says "developer"
     before a visitor has read a single sentence, and unlike a decorative
     animation it carries real information. */

  const HERO_CODE = [
    ['tok-com',  '// aparri, ph · utc+8'], ['nl'],
    ['tok-key',  'const'], ['sp'], ['tok-prop', 'chester'], ['sp'],
    ['tok-punc', '='], ['sp'], ['tok-punc', '{'], ['nl'],
    ['ind'], ['tok-prop', 'role'], ['tok-punc', ':'], ['sp'],
    ['tok-str',  "'Backend Developer'"], ['tok-punc', ','], ['nl'],
    ['ind'], ['tok-prop', 'at'], ['tok-punc', ':'], ['sp'],
    ['tok-str',  "'Cebuanas Encoding Services'"], ['tok-punc', ','], ['nl'],
    ['ind'], ['tok-prop', 'building'], ['tok-punc', ':'], ['sp'],
    ['tok-str',  "'RocketServe'"], ['tok-punc', ','], ['nl'],
    ['ind'], ['tok-prop', 'stack'], ['tok-punc', ':'], ['sp'], ['tok-punc', '['],
    ['tok-str',  "'node'"], ['tok-punc', ', '], ['tok-str', "'php'"],
    ['tok-punc', ', '], ['tok-str', "'mysql'"], ['tok-punc', '],'], ['nl'],
    ['ind'], ['tok-prop', 'freelance'], ['tok-punc', ':'], ['sp'],
    ['tok-key',  'true'], ['tok-punc', ','], ['nl'],
    ['tok-punc', '}'], ['nl'], ['nl'],
    ['tok-com',  '// press'], ['sp'], ['tok-key', 'ctrl+k'], ['sp'],
    ['tok-com',  'to jump anywhere'],
  ];

  function initCodeHero() {
    const host = $('#code-hero');
    if (!host) return;

    const code = el('code');
    host.replaceChildren(code);
    const caret = el('span', { class: 'code-caret', 'aria-hidden': 'true' });

    /* Build the finished block first, so the markup is correct even if the
       animation is skipped or interrupted. */
    const pieces = HERO_CODE.map(([kind, text]) => {
      if (kind === 'nl') return document.createTextNode('\n');
      if (kind === 'sp') return document.createTextNode(' ');
      if (kind === 'ind') return document.createTextNode('  ');
      return el('span', { class: kind, text });
    });

    if (reduced()) {
      code.append(...pieces, caret);
      return;
    }

    /* Type piece by piece, character by character for the visible strings */
    let i = 0;
    const next = () => {
      if (i >= pieces.length) { code.append(caret); return; }
      const node = pieces[i++];
      caret.remove();

      if (node.nodeType === 3) {
        code.append(node);
        code.append(caret);
        setTimeout(next, 18);
        return;
      }

      const full = node.textContent;
      node.textContent = '';
      code.append(node);
      code.append(caret);

      let c = 0;
      const typeChar = () => {
        node.textContent = full.slice(0, ++c);
        if (c < full.length) setTimeout(typeChar, 16);
        else setTimeout(next, 32);
      };
      typeChar();
    };

    /* Only start once it's actually on screen */
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        next();
      }, { threshold: 0.2 });
      io.observe(host);
    } else {
      next();
    }
  }

  /* ===== terminal =======================================================
     A real one: command history, tab completion, and commands that read the
     same JSON manifests the rest of the site does. */

  function initTerminal() {
    const root = $('#terminal');
    if (!root) return;

    const out = $('#term-out', root);
    const input = $('#term-input', root);
    const form = $('#term-form', root);
    if (!out || !input || !form) return;

    const history = [];
    let histIdx = -1;
    let projectCache = null;

    const print = (text, kind = 'out') => {
      out.append(el('div', { class: `term__line term__line--${kind}`, text }));
      out.scrollTop = out.scrollHeight;
    };

    const printLines = (lines, kind) => lines.forEach((l) => print(l, kind));

    /* Figlet "standard", which uses only plain ASCII.
       The block-drawing version (█ ╔ ═ ╝) looked right in an editor but broke
       in the browser: JetBrains Mono has no glyphs for those, so each one fell
       back to a different font with different metrics and the letters came out
       doubled and misaligned. Basic ASCII renders identically everywhere. */
    const BANNER = [
      '  ____ _   _ _____ ____ _____ _____ ____  ',
      ' / ___| | | | ____/ ___|_   _| ____|  _ \\ ',
      '| |   | |_| |  _| \\___ \\ | | |  _| | |_) |',
      '| |___|  _  | |___ ___) || | | |___|  _ < ',
      ' \\____|_| |_|_____|____/ |_| |_____|_| \\_\\',
    ];

    const COMMANDS = {
      help: {
        desc: 'list every command',
        run() {
          print('Available commands:', 'ok');
          Object.entries(COMMANDS)
            .filter(([, c]) => !c.hidden)
            .forEach(([name, c]) => print('  ' + name.padEnd(12) + c.desc));
          print('');
          print('Tab completes. ↑ / ↓ walks history.', 'out');
        },
      },
      whoami: {
        desc: 'who is this',
        run() {
          printLines([
            'Chester Ewing Columna',
            'Backend Developer · Computer Engineer',
            'Aparri, Cagayan Valley, Philippines (UTC+8)',
          ]);
        },
      },
      about: {
        desc: 'the short version',
        run() {
          printLines([
            'Started as a data encoder at a TV relay station in 2019.',
            'Now I design REST APIs, auth and database schema for RocketServe',
            'at Cebuanas Encoding Services.',
            '',
            'Computer Engineering background, which means I ask what things',
            'cost — in memory, in queries, and at 3am when something fails.',
          ]);
        },
      },
      skills: {
        desc: 'what I work with',
        run() {
          printLines([
            'backend    node.js · php · rest apis · authentication',
            'databases  mysql · sql',
            'frontend   html5 · css3 · javascript · bootstrap',
            'languages  c++ · python · java · bash',
            'hardware   arduino · raspberry pi · kicad · firmware',
            'data/ops   git · excel · power bi · linux · windows',
          ]);
        },
      },
      projects: {
        desc: 'what I have built',
        run() {
          if (projectCache) { projectCache.forEach((l) => print(l)); return; }
          print('reading projects/index.json …', 'out');
          json('projects/index.json').then((d) => {
            projectCache = (d.items || []).flatMap((p) => ([
              `${p.title}  [${p.status || 'n/a'}, ${p.year || '—'}]`,
              `  ${p.subtitle || ''}`,
              `  → /projects/${p.slug}.html`,
              '',
            ]));
            projectCache.forEach((l) => print(l));
          }).catch(() => print('could not read the manifest', 'err'));
        },
      },
      ls: {
        desc: 'list pages',
        run() {
          print('index.html   work.html    about.html');
          print('writing.html contact.html projects/   writing/posts/');
        },
      },
      open: {
        desc: 'open a page, e.g. open work',
        run(args) {
          const map = { home: 'index', index: 'index', work: 'work', about: 'about',
                        writing: 'writing', contact: 'contact', hire: 'contact' };
          const target = map[(args[0] || '').toLowerCase()];
          if (!target) { print(`open: unknown page '${args[0] || ''}'. try: ls`, 'err'); return; }
          print(`opening ${target}.html …`, 'ok');
          setTimeout(() => { location.href = base + target + '.html'; }, 350);
        },
      },
      contact: {
        desc: 'how to reach me',
        run() {
          printLines([
            'email     ce.columna404@gmail.com',
            'linkedin  linkedin.com/in/chesterewing',
            'x         @_chstrr',
            '',
            'Freelance: open. Evenings and weekends (full-time role on weekdays).',
          ]);
        },
      },
      resume: {
        desc: 'download the pdf',
        run() {
          print('downloading résumé …', 'ok');
          const a = el('a', { href: base + 'assets/chester_ewing_columna_resume.pdf', download: '' });
          document.body.append(a); a.click(); a.remove();
        },
      },
      theme: {
        desc: 'theme dark | light',
        run(args) {
          const want = (args[0] || '').toLowerCase();
          if (want !== 'dark' && want !== 'light') { print('usage: theme dark | light', 'err'); return; }
          document.documentElement.setAttribute('data-theme', want);
          store.set('cec-theme', want);
          print(`theme → ${want}`, 'ok');
        },
      },
      date: {
        desc: 'current date and time here',
        run() {
          print(new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'full', timeStyle: 'medium' }) + ' (Asia/Manila)');
        },
      },
      neofetch: {
        desc: 'system info',
        run() {
          printLines(BANNER, 'ok');
          printLines([
            '',
            'visitor@chestercolumna',
            '----------------------',
            'Host     : personal portfolio',
            'Stack    : HTML · CSS · vanilla JS',
            'Deps     : 0',
            'Theme    : ' + (document.documentElement.getAttribute('data-theme') || 'dark'),
            'Uptime   : since Nov 2025 at Cebuanas',
            'Shell    : app.js',
          ]);
        },
      },
      clear: { desc: 'clear the screen', run() { out.replaceChildren(); } },

      /* --- easter eggs: hidden from help, found by the curious --- */
      sudo: {
        desc: '', hidden: true,
        run() { print('visitor is not in the sudoers file. This incident has been reported. 🫡', 'err'); },
      },
      'rm': {
        desc: '', hidden: true,
        run(args) {
          if (args.join(' ').includes('-rf')) {
            print('Nice try. This one is static — there is nothing to delete. 🙂', 'ok');
          } else print('rm: missing operand', 'err');
        },
      },
      exit: { desc: '', hidden: true, run() { print('There is no exit. Only more backlog. 🪄'); } },
      vim:  { desc: '', hidden: true, run() { print("You're trapped. Type :q! — just kidding, press Enter. 😄"); } },
      coffee: { desc: '', hidden: true, run() { print('☕ brewing… this is what keeps the API responding.'); } },
    };

    const runLine = (raw) => {
      const line = raw.trim();
      print(`visitor@chestercolumna:~$ ${line}`, 'cmd');
      if (!line) return;

      history.unshift(line);
      histIdx = -1;

      const [name, ...args] = line.split(/\s+/);
      const cmd = COMMANDS[name.toLowerCase()] || (name === '?' ? COMMANDS.help : null);

      if (!cmd) { print(`command not found: ${name}. Type 'help'.`, 'err'); return; }
      try { cmd.run(args); } catch (e) { print('error: ' + e.message, 'err'); }
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      runLine(input.value);
      input.value = '';
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (histIdx < history.length - 1) input.value = history[++histIdx] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx > 0) input.value = history[--histIdx] || '';
        else { histIdx = -1; input.value = ''; }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const partial = input.value.trim().toLowerCase();
        if (!partial) return;
        const hits = Object.keys(COMMANDS).filter((c) => !COMMANDS[c].hidden && c.startsWith(partial));
        if (hits.length === 1) input.value = hits[0] + ' ';
        else if (hits.length > 1) print(hits.join('   '));
      }
    });

    /* Clicking anywhere in the window focuses the prompt, like a real terminal */
    root.addEventListener('click', (e) => {
      if (!e.target.closest('a, button')) input.focus();
    });

    /* Quick-start chips under the window */
    $$('[data-term-cmd]', root).forEach((btn) => {
      btn.addEventListener('click', () => { runLine(btn.dataset.termCmd); input.focus(); });
    });

    /* Boot screen: banner, then the one instruction that matters */
    const ascii = $('#term-ascii', root);
    if (ascii) ascii.textContent = BANNER.join('\n');

    print('Chester Ewing Columna — Backend Developer', 'out');
    print('Aparri, Cagayan Valley, PH · Asia/Manila', 'out');
    print('');
    print("Type 'help' to list commands. Tab completes, ↑ recalls.", 'ok');
    print('');
  }

  /* ===== command palette ================================================ */

  function initPalette() {
    if ($('#cmdk')) return;

    const ITEMS = [
      { label: 'Home',      kind: 'page', href: base + 'index.html' },
      { label: 'Work',      kind: 'page', href: base + 'work.html' },
      { label: 'About',     kind: 'page', href: base + 'about.html' },
      { label: 'Writing',   kind: 'page', href: base + 'writing.html' },
      { label: 'Hire me',   kind: 'page', href: base + 'contact.html' },
      { label: 'RxFY — Antibiotic Monitoring System', kind: 'project', href: base + 'projects/rxfy.html' },
      { label: 'Personal Portfolio',                  kind: 'project', href: base + 'projects/portfolio.html' },
      { label: 'Download résumé (PDF)', kind: 'action', href: base + 'assets/chester_ewing_columna_resume.pdf' },
      { label: 'Email Chester',         kind: 'action', href: 'mailto:ce.columna404@gmail.com' },
      { label: 'LinkedIn',  kind: 'link', href: 'https://www.linkedin.com/in/chesterewing/' },
      { label: 'RocketServe (live)', kind: 'link', href: 'https://rocketserve.app' },
      { label: 'Toggle theme', kind: 'action', run() {
          const next = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          store.set('cec-theme', next);
        } },
    ];

    const input = el('input', {
      class: 'cmdk__input', type: 'text', id: 'cmdk-input',
      placeholder: 'Jump to a page, project or action…',
      autocomplete: 'off', 'aria-label': 'Search',
    });
    const list = el('div', { class: 'cmdk__list', role: 'listbox' });
    const box = el('div', { class: 'cmdk__box', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Command palette' },
      input, list,
      el('div', { class: 'cmdk__foot' },
        el('span', { html: '<kbd>↑</kbd><kbd>↓</kbd> navigate' }),
        el('span', { html: '<kbd>↵</kbd> open' }),
        el('span', { html: '<kbd>esc</kbd> close' })));
    const overlay = el('div', { class: 'cmdk', id: 'cmdk', hidden: 'hidden' }, box);
    document.body.append(overlay);

    let shown = [];
    let active = 0;

    /* Subsequence match, so "wk" finds "Work" and "dlr" finds the résumé */
    const score = (item, q) => {
      if (!q) return 0;
      const hay = item.label.toLowerCase();
      let i = 0;
      for (const ch of q) {
        i = hay.indexOf(ch, i);
        if (i === -1) return -1;
        i++;
      }
      return hay.startsWith(q) ? 2 : 1;
    };

    const render = () => {
      const q = input.value.trim().toLowerCase();
      shown = ITEMS.map((it) => [it, score(it, q)])
        .filter(([, s]) => s >= 0)
        .sort((a, b) => b[1] - a[1])
        .map(([it]) => it);

      active = 0;
      if (!shown.length) {
        list.replaceChildren(el('p', { class: 'cmdk__empty', text: 'Nothing matches that.' }));
        return;
      }
      list.replaceChildren(...shown.map((it, idx) =>
        el('button', {
          class: 'cmdk__item', type: 'button', role: 'option',
          'aria-selected': String(idx === 0),
          onclick: () => go(it),
        }, it.label, el('span', { class: 'kind', text: it.kind }))));
    };

    const mark = () => {
      $$('.cmdk__item', list).forEach((n, i) => {
        n.setAttribute('aria-selected', String(i === active));
        if (i === active) n.scrollIntoView({ block: 'nearest' });
      });
    };

    const go = (item) => {
      close();
      if (item.run) item.run();
      else if (item.href) location.href = item.href;
    };

    const open = () => {
      overlay.hidden = false;
      input.value = '';
      render();
      input.focus();
    };
    const close = () => { overlay.hidden = true; };

    input.addEventListener('input', render);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === 'k') { e.preventDefault(); overlay.hidden ? open() : close(); return; }
      if (overlay.hidden) return;

      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, shown.length - 1); mark(); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); active = Math.max(active - 1, 0); mark(); }
      else if (e.key === 'Enter' && shown[active]) { e.preventDefault(); go(shown[active]); }
    });

    /* Anything with data-cmdk opens it too (the header button) */
    $$('[data-cmdk]').forEach((b) => b.addEventListener('click', open));
  }

  /* ===== API console ====================================================
     The one thing on this site that demonstrates backend work rather than
     describing it. sw.js answers /api/* from the same JSON manifests the
     pages read, so these are genuine network requests — status codes,
     headers and timings are real, and they appear in the Network tab.

     Before the service worker has taken control (very first visit, or an
     unsupported browser) the request would 404, so we say so plainly rather
     than faking a response. */

  const API_ROUTES = [
    { path: '/api',              label: 'Route index' },
    { path: '/api/whoami',       label: 'Identity + live day counts' },
    { path: '/api/projects',     label: 'Project manifest' },
    { path: '/api/skills',       label: 'Skills by area' },
    { path: '/api/availability', label: 'Freelance capacity' },
    { path: '/api/writing',      label: 'Published posts' },
    { path: '/api/health',       label: 'Health check' },
    { path: '/api/nope',         label: 'A 404, on purpose' },
  ];

  /* Minimal JSON pretty-printer. Tokens reuse the code-hero classes. */
  function highlightJson(text) {
    const frag = document.createDocumentFragment();
    const re = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(\b-?\d+(?:\.\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)/g;
    let last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) frag.append(document.createTextNode(text.slice(last, m.index)));
      const cls = m[1] ? 'tok-prop' : m[2] ? 'tok-str' : m[3] ? 'tok-num' : 'tok-key';
      frag.append(el('span', { class: cls, text: m[0] }));
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.append(document.createTextNode(text.slice(last)));
    return frag;
  }

  function initApiConsole() {
    const root = $('#api-console');
    if (!root) return;

    const select = $('#api-route', root);
    const sendBtn = $('#api-send', root);
    const reqOut = $('#api-request', root);
    const resOut = $('#api-response', root);
    const statusOut = $('#api-status', root);
    if (!select || !sendBtn || !resOut) return;

    select.replaceChildren(...API_ROUTES.map((r) =>
      el('option', { value: r.path, text: `GET ${r.path}  —  ${r.label}` })));

    const swReady = () =>
      'serviceWorker' in navigator && navigator.serviceWorker.controller != null;

    /* On a first visit the worker has not claimed this page yet. Rather than
       telling the visitor to reload — which they won't — register it now,
       wait for it to take control, and fire the first request ourselves.

       The awkward case is a hard reload (Ctrl+Shift+R): the browser
       deliberately bypasses the service worker for that navigation, so the
       page loads uncontrolled even though the worker is alive and well.
       'controllerchange' never fires there, because nothing changes. We have
       to detect that and say so, instead of waiting and then blaming the
       browser for "blocking" something it did not block. */
    const SW_STATE = { UNSUPPORTED: 'unsupported', UNCONTROLLED: 'uncontrolled', FAILED: 'failed' };

    function waitForWorker() {
      if (!('serviceWorker' in navigator)) return Promise.reject(new Error(SW_STATE.UNSUPPORTED));
      if (navigator.serviceWorker.controller) return Promise.resolve();

      return navigator.serviceWorker.register(base + 'sw.js')
        .catch(() => { throw new Error(SW_STATE.FAILED); })
        .then(() => navigator.serviceWorker.ready)
        .then((reg) => new Promise((resolve, reject) => {
          if (navigator.serviceWorker.controller) return resolve();

          /* An active worker that still isn't controlling this page means the
             navigation skipped it. Only a normal reload fixes that. */
          if (reg && reg.active) return reject(new Error(SW_STATE.UNCONTROLLED));

          const done = () => { clearTimeout(timer); resolve(); };
          navigator.serviceWorker.addEventListener('controllerchange', done, { once: true });
          const timer = setTimeout(() => {
            navigator.serviceWorker.removeEventListener('controllerchange', done);
            reject(new Error(SW_STATE.UNCONTROLLED));
          }, 6000);
        }));
    }

    const showRequest = (path) => {
      if (!reqOut) return;
      reqOut.replaceChildren(highlightJson(
        `GET ${path} HTTP/1.1\nHost: ${location.host}\nAccept: application/json\n`
      ));
    };

    const send = () => {
      const path = select.value;
      showRequest(path);

      if (!swReady()) {
        statusOut.textContent = 'starting worker\u2026';
        statusOut.dataset.state = 'warn';
        resOut.replaceChildren(document.createTextNode(
          'Registering the service worker that answers these routes\u2026'));
        waitForWorker().then(send).catch((err) => {
          statusOut.dataset.state = 'err';

          if (err.message === SW_STATE.UNCONTROLLED) {
            /* The common one, and not an error on the visitor's part: a hard
               reload bypasses the worker by design. One normal reload fixes it. */
            statusOut.textContent = 'page not controlled by the worker';
            resOut.replaceChildren(
              document.createTextNode(
                'The worker is installed and running, but this page load bypassed it.\n' +
                'That is what a hard refresh (Ctrl+Shift+R) does, by design.\n\n' +
                'A normal reload hands the page back to the worker.\n\n'),
              el('button', {
                class: 'api__send', type: 'button', text: 'Reload and try again',
                onclick: () => location.reload(),
              })
            );
            return;
          }

          statusOut.textContent = err.message === SW_STATE.UNSUPPORTED
            ? 'service workers unsupported'
            : 'worker could not start';
          resOut.replaceChildren(document.createTextNode(
            'These routes are answered by a service worker, and this browser\n' +
            'could not start one. They need https (or localhost) and service\n' +
            'workers enabled.\n\n' +
            'Nothing here is faked \u2014 with no worker there is no response to show.'
          ));
        });
        return;
      }

      statusOut.textContent = 'sending…';
      statusOut.dataset.state = '';
      resOut.replaceChildren(document.createTextNode('…'));

      const t0 = performance.now();
      fetch(path, { headers: { Accept: 'application/json' } })
        .then((r) => r.text().then((body) => ({ r, body })))
        .then(({ r, body }) => {
          const ms = Math.max(1, Math.round(performance.now() - t0));
          statusOut.textContent = `${r.status} ${r.statusText || ''} · ${ms} ms · ${(body.length / 1024).toFixed(1)} KB`;
          statusOut.dataset.state = r.ok ? 'ok' : 'err';

          let pretty = body;
          try { pretty = JSON.stringify(JSON.parse(body), null, 2); } catch { /* leave as-is */ }
          resOut.replaceChildren(highlightJson(pretty));
        })
        .catch((err) => {
          statusOut.textContent = 'network error';
          statusOut.dataset.state = 'err';
          resOut.replaceChildren(document.createTextNode(String(err)));
        });
    };

    sendBtn.addEventListener('click', send);

    /* Fire on change as well as on click. Updating only the request pane left
       the previous endpoint's JSON sitting in the response pane, which read as
       "nothing happened" — the worst possible first impression for the one
       feature on this site that is meant to prove something works. */
    select.addEventListener('change', send);
    showRequest(select.value);

    /* Run one automatically so the panel is never empty on arrival */
    if (swReady()) send();
    else waitForWorker().then(send).catch(() => send());
  }

  /* ===== live status bar ================================================ */

  function initStatusBar() {
    const slot = $('#status-clock');
    if (!slot) return;
    const tick = () => {
      slot.textContent = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Manila', hour12: false,
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ===== konami ========================================================= */

  function initKonami() {
    const SEQ = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown',
                 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    let i = 0;

    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, [contenteditable="true"]')) return;
      const k = e.key.toLowerCase();
      i = (k === SEQ[i]) ? i + 1 : (k === SEQ[0] ? 1 : 0);
      if (i < SEQ.length) return;
      i = 0;

      const note = el('div', {
        class: 'card',
        style: 'position:fixed;left:50%;bottom:2rem;transform:translateX(-50%);z-index:95;' +
               'max-width:min(92vw,30rem);text-align:center;box-shadow:var(--shadow-lift)',
      },
        el('p', { class: 'kicker', style: 'justify-content:center', text: 'Achievement unlocked' }),
        el('p', { class: 'mt-3', text: 'You found the Konami code. Thirty years old and still works everywhere.' }),
        el('p', { class: 'subtle mt-3', text: 'Try typing “neofetch” in the terminal on this page too.' }));

      document.body.append(note);
      document.documentElement.style.transition = 'filter .4s';
      document.documentElement.style.filter = 'hue-rotate(180deg)';
      setTimeout(() => { document.documentElement.style.filter = ''; }, 1400);
      setTimeout(() => note.remove(), 6000);
    });
  }

  /* ===== section numbering ============================================== */


  /* ===== boot =========================================================== */

  function init() {
    [initTheme, initNav, initReveal, initToTop, initTenure, initCounters,
     initCapacity, initReading, initProjects, initShowcase, initTools,
     initTestimonials, initWriting, initEstimator, initForm, initGithub,
     initShortcuts, initCodeCopy, initPwa,
     /* signature pieces */
     initCodeHero, initTerminal, initApiConsole, initPalette,
     initStatusBar, initKonami].forEach((fn) => {
      try { fn(); } catch (err) { console.warn(fn.name, err); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
