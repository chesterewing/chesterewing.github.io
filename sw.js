/* =======================================================
 * Service Worker — minimal offline cache
 * Author: Chester Ewing Columna
 *
 * Network-first for HTML and JSON manifests (always fresh when online).
 * Network-first for JS/CSS (always fresh when online).
 * Cache-first for images/fonts (they rarely change).
 * ======================================================= */
/* Bumped for the 2026 rebuild: the old cache held style.css/custom.css/
   custom.js, none of which exist any more. The activate handler below drops
   every cache whose key doesn't start with this version. */
const CACHE_VERSION = 'cepc-v51';
const ASSET_CACHE   = `${CACHE_VERSION}-assets`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/css/fonts.css',
  '/css/app.css',
  '/js/app.js',
  '/manifest.json',
  '/images/about.jpg',
  '/images/logo-mark.svg'
];

/* CacheStorage is not always available — private browsing, storage pressure,
   and some embedded webviews all reject caches.open(). Pre-caching is an
   optimisation, so a failure here must never block installation: if it did,
   the worker would never activate and the /api routes below would stop
   working too. Every cache call is therefore allowed to fail quietly. */
const cacheOpen = () =>
  (self.caches ? caches.open(ASSET_CACHE).catch(() => null) : Promise.resolve(null));

const putInCache = (req, res) => {
  cacheOpen().then((c) => { if (c) c.put(req, res).catch(() => {}); });
};

const matchInCache = (req) =>
  (self.caches ? caches.match(req).catch(() => undefined) : Promise.resolve(undefined));

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    cacheOpen()
      .then((cache) => (cache ? cache.addAll(CORE_ASSETS) : null))
      .catch(() => null)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (self.caches ? caches.keys() : Promise.resolve([]))
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))))
      .catch(() => null)
      .then(() => self.clients.claim())
  );
});

function networkFirst(req) {
  return fetch(req)
    .then((res) => {
      if (res.ok && req.url.startsWith(self.location.origin)) putInCache(req, res.clone());
      return res;
    })
    .catch(() => matchInCache(req).then((r) => r || matchInCache('/index.html')));
}

function cacheFirst(req) {
  return matchInCache(req).then((cached) => cached || fetch(req).then((res) => {
    if (res.ok && req.url.startsWith(self.location.origin)) putInCache(req, res.clone());
    return res;
  }));
}

/* =======================================================
 * Mock API
 *
 * The portfolio is a static site, but a backend developer's portfolio
 * should be able to answer a request. These routes are served by the
 * worker itself, from the same JSON manifests the pages read, so
 * /api/projects is a genuine network request with a real status code and
 * real timing — it shows up in the DevTools Network tab like any other.
 *
 * No server, no secrets, no build step.
 * ======================================================= */

const API_PREFIX = '/api/';

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Powered-By': 'service-worker',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}

const readManifest = (path) =>
  fetch(path, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

/* Days between a date and now, used so nothing here is ever hard-coded */
const daysSince = (iso) => Math.floor((Date.now() - new Date(iso)) / 86400000);

async function handleApi(url) {
  const route = url.pathname.slice(API_PREFIX.length).replace(/\/+$/, '');
  const started = Date.now();

  switch (route) {
    case '':
    case 'index':
      return jsonResponse({
        service: 'chester-portfolio-api',
        version: '1.0.0',
        served_by: 'service worker (no origin server)',
        endpoints: [
          { method: 'GET', path: '/api/whoami',       description: 'Identity and current role' },
          { method: 'GET', path: '/api/projects',     description: 'Project manifest' },
          { method: 'GET', path: '/api/skills',       description: 'Skills grouped by area' },
          { method: 'GET', path: '/api/availability', description: 'Freelance capacity, computed live' },
          { method: 'GET', path: '/api/writing',      description: 'Published posts' },
          { method: 'GET', path: '/api/health',       description: 'Health check' },
        ],
      });

    case 'whoami':
      return jsonResponse({
        name: 'Chester Ewing Columna',
        role: 'Backend Developer',
        employer: 'Cebuanas Encoding Services',
        building: 'RocketServe',
        days_in_role: daysSince('2025-11-07'),
        days_in_tech: daysSince('2019-12-01'),
        location: { city: 'Aparri', region: 'Cagayan Valley', country: 'PH', tz: 'Asia/Manila', utc_offset: '+08:00' },
        open_to_freelance: true,
        contact: { email: 'ce.columna404@gmail.com', linkedin: 'linkedin.com/in/chesterewing' },
      });

    case 'projects': {
      const d = await readManifest('/projects/index.json');
      if (!d) return jsonResponse({ error: 'manifest_unavailable' }, 503);
      return jsonResponse({
        count: (d.items || []).length,
        items: (d.items || []).map((p) => ({
          slug: p.slug, title: p.title, status: p.status, year: p.year,
          category: p.category, stack: (p.stack || []).map((s) => s.name),
          url: `/projects/${p.slug}.html`,
        })),
      });
    }

    case 'skills':
      return jsonResponse({
        backend:   ['Node.js', 'PHP', 'REST APIs', 'Authentication'],
        databases: ['MySQL', 'SQL'],
        frontend:  ['HTML5', 'CSS3', 'JavaScript', 'Bootstrap'],
        languages: ['C++', 'Python', 'Java', 'Bash'],
        hardware:  ['Arduino', 'Raspberry Pi', 'KiCad', 'Embedded firmware'],
        data_ops:  ['Git', 'Excel', 'Power BI', 'Linux', 'Windows'],
      });

    case 'availability': {
      const d = await readManifest('/availability.json');
      if (!d) return jsonResponse({ error: 'manifest_unavailable' }, 503);
      const total = Math.max(1, Number(d.slots_total) || 1);
      const booked = Math.min(total, Math.max(0, Number(d.slots_booked) || 0));
      const next = new Date();
      next.setDate(next.getDate() + (Number(d.lead_days) || 0));
      return jsonResponse({
        slots_total: total,
        slots_booked: booked,
        slots_open: total - booked,
        accepting_work: total - booked > 0,
        next_available: next.toISOString().slice(0, 10),
        note: d.status_message || null,
      });
    }

    case 'writing': {
      const d = await readManifest('/writing/index.json');
      if (!d) return jsonResponse({ error: 'manifest_unavailable' }, 503);
      return jsonResponse({
        count: (d.items || []).length,
        items: (d.items || []).map((p) => ({
          slug: p.slug, title: p.title, date: p.date, tags: p.tags || [],
          url: `/writing/posts/${p.slug}.html`,
        })),
      });
    }

    case 'health':
      return jsonResponse({ status: 'ok', uptime_note: 'static site — always up', latency_ms: Date.now() - started });

    default:
      return jsonResponse(
        { error: 'not_found', message: `No route for /api/${route}`, hint: 'GET /api for the route list' },
        404
      );
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* Mock API comes first — it never touches the cache.
     Note the bare "/api" case: it has no trailing slash, so a startsWith
     check against "/api/" alone would miss the route index. */
  const isApi = url.pathname === '/api' || url.pathname.startsWith(API_PREFIX);
  if (url.origin === self.location.origin && isApi) {
    event.respondWith(handleApi(url));
    return;
  }
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  const isJSON = url.pathname.endsWith('.json');
  const isJSorCSS = /\.(?:js|css)$/.test(url.pathname);

  if (isHTML || isJSON || isJSorCSS) {
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith(cacheFirst(req));
});
