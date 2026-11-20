(function () {
  'use strict';

  var RESORT = {
    name: 'Lagoon Cove Private Resort',
    place: 'Private resort · Aparri, Cagayan',
    tagline: 'Private pool and garden, all to yourselves.',
    about: 'A private resort for families and barkadas. Book the whole place for the day or the night: the pool, the cottages and the grill are yours alone.',
    gcashName: 'Juan D.', gcashNumber: '0917 123 4567',
    downpaymentPct: 50, holdHours: 6,
    phone: '0917 123 4567', messenger: '#', facebook: '#',
    address: 'Aparri, Cagayan, Philippines'
  };
  var IMG = 'assets/img/';
  var PACKAGES = [
    { id: 1, name: 'Day Tour', slot: 'day', time: '8:00 AM – 5:00 PM', weekday: 6500, weekend: 8000, max: 20, fee: 150, limit: 40, featured: 0, desc: 'The whole resort for the day. Pool, cottages and grill area included.' },
    { id: 2, name: 'Overnight', slot: 'night', time: '7:00 PM – 6:00 AM', weekday: 7500, weekend: 9000, max: 20, fee: 150, limit: 40, featured: 0, desc: 'Swim under the lights, then sleep in the air-conditioned rooms.' },
    { id: 3, name: '22 Hours', slot: 'full', time: '8:00 AM – 6:00 AM', weekday: 12000, weekend: 14500, max: 25, fee: 150, limit: 40, featured: 1, desc: 'Day and night in one booking. Best value for birthdays and reunions.' }
  ];
  var PHOTOS = [
    { src: IMG + 'cottages-pool.jpg', cap: 'Private pool and nipa cottages' },
    { src: IMG + 'tropical-pool.jpg', cap: 'The main pool' },
    { src: IMG + 'pool-night.jpg', cap: 'Pool lights at night' },
    { src: IMG + 'poolside.jpg', cap: 'Poolside lounge' },
    { src: IMG + 'aerial.jpg', cap: 'The whole place from above' }
  ];
  var AMENITIES = ['Private swimming pool', 'Kiddie pool', 'Air-conditioned rooms', 'Cottages and tables', 'Grill area', 'Karaoke', 'Free Wi-Fi', 'Free parking'];
  var RULES = ['Bring your own food and drinks, no corkage fee.', 'No glass bottles in the pool area.', 'Loud music until 10 PM only.', 'The downpayment is non-refundable but can be moved to another date once, with 7 days’ notice.'];
  var REVIEWS = [
    { name: 'Kristine M.', rating: 5, occ: 'Family reunion', body: 'Super linis ng pool and the staff were so accommodating. Booking online was easy, nag-confirm agad after we sent the GCash receipt.' },
    { name: 'Paolo R.', rating: 5, occ: 'Barkada overnight', body: 'Perfect for our barkada overnight. The pool lights at night are beautiful, and we had the whole place to ourselves.' },
    { name: 'Liza D.C.', rating: 5, occ: 'Birthday', body: 'We celebrated my mom’s 60th here. Maluwag, malinis, and the kids loved the kiddie pool. Babalik kami!' },
    { name: 'Mark A.', rating: 4, occ: '22 hours stay', body: 'Great place and fair price for 22 hours. Medyo malayo from the highway, but the directions on the website helped.' }
  ];
  var FAQS = [
    { q: 'Is the whole resort ours during the booking?', a: 'Yes. We take one group at a time, so the pool, cottages and grill area are only for your group.' },
    { q: 'Can we bring our own food and drinks?', a: 'Yes, with no corkage fee. The grill area and tables are free to use.' },
    { q: 'How do we pay?', a: 'Send the downpayment by GCash when you book and upload the screenshot. The balance is paid on arrival.' },
    { q: 'Can we move our date?', a: 'Yes, once, as long as you tell us at least 7 days before. The downpayment moves with you to the new date.' },
    { q: 'Is there parking?', a: 'Yes, free parking inside the property.' }
  ];
  var RECEIPT = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="440" viewBox="0 0 300 440"><rect width="300" height="440" fill="#0a74da"/><rect x="24" y="90" width="252" height="300" rx="14" fill="#fff"/><circle cx="150" cy="150" r="30" fill="#0a74da"/><path d="M138 150l9 9 17-17" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="150" y="205" font-family="Arial" font-size="15" fill="#444" text-anchor="middle">Payment Successful</text><text x="150" y="245" font-family="Arial" font-size="30" font-weight="bold" fill="#111" text-anchor="middle">PHP 4,000.00</text><text x="150" y="285" font-family="Arial" font-size="12" fill="#888" text-anchor="middle">Ref No. 7042 8891 3365</text><text x="150" y="330" font-family="Arial" font-size="12" fill="#888" text-anchor="middle">Sample demo receipt</text><text x="150" y="60" font-family="Arial" font-size="20" font-weight="bold" fill="#fff" text-anchor="middle">GCash</text></svg>');

  var SLOT_PARTS = { day: ['day'], night: ['night'], full: ['day', 'night'] };
  var STATUS_LABEL = { pending: 'Waiting for approval', confirmed: 'Confirmed', checked_in: 'Checked in', completed: 'Completed', declined: 'Declined', cancelled: 'Cancelled', expired: 'Expired' };
  var HOLDING = ['pending', 'confirmed', 'checked_in', 'completed'];

  var KEY = 'rb-demo-v2';
  function todayStr() { return ymd(new Date()); }
  function plusDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }

  function seedBookings() {
    var b = [];
    var mk = function (o) { return Object.assign({ email: '', notes: '', amountPaid: 0, receipt: '', source: 'online', note: '', history: [] }, o); };
    b.push(mk({ ref: 'RB-K2F9QX', pkg: 1, date: plusDays(2), guests: 18, name: 'Maria Santos', phone: '0917 100 2001', status: 'pending', receipt: RECEIPT, notes: 'Birthday ni Lola, may cake kami.',
      history: [h('created', 'Booked online', 'Maria Santos'), h('receipt', 'Payment screenshot uploaded', 'Maria Santos')] }));
    b.push(mk({ ref: 'RB-7HD3MP', pkg: 2, date: plusDays(5), guests: 25, name: 'Jun Dela Cruz', phone: '0928 100 2002', status: 'pending',
      history: [h('created', 'Booked online', 'Jun Dela Cruz')] }));
    b.push(mk({ ref: 'RB-R8T4WK', pkg: 3, date: plusDays(1), guests: 30, name: 'Ana Reyes', phone: '0939 100 2003', status: 'confirmed', amountPaid: 6000,
      history: [h('created', 'Booked online', 'Ana Reyes'), h('confirmed', 'Confirmed · paid ' + peso(6000), 'You')] }));
    b.push(mk({ ref: 'RB-M5N1CZ', pkg: 1, date: todayStr(), guests: 12, name: 'Carlo Mendoza', phone: '0945 100 2004', status: 'confirmed', amountPaid: 3250,
      history: [h('created', 'Booked online', 'Carlo Mendoza'), h('confirmed', 'Confirmed · paid ' + peso(3250), 'You')] }));
    b.forEach(function (x, i) { x.id = i + 1; x.created = Date.now() - (b.length - i) * 36e5; x.total = quote(pkg(x.pkg), x.date, x.guests).total; });
    return b;
  }
  function h(action, detail, by) { return { action: action, detail: detail, by: by, at: Date.now() }; }

  function fresh() { return { bookings: seedBookings(), seq: 5 }; }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.bookings) return s; } catch (e) {}
    var s2 = fresh(); save(s2); return s2;
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var state = load();

  /* Attach-once guards: this is a single-page app, so render functions must
     not keep adding global listeners on every navigation. */
  var _wiredZoom = false, _wiredScroll = false, _galleryKey = false, _lbActive = null;

  function peso(n) { return '₱' + Math.round(n).toLocaleString('en-PH'); }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function isWeekend(s) { var g = parse(s).getDay(); return g === 0 || g === 6; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function fmtDate(s, fmt) {
    var d = parse(s), en = 'en-US';
    var map = { l: d.toLocaleDateString(en, { weekday: 'long' }), D: d.toLocaleDateString(en, { weekday: 'short' }),
      F: d.toLocaleDateString(en, { month: 'long' }), M: d.toLocaleDateString(en, { month: 'short' }), j: d.getDate(), Y: d.getFullYear() };
    return fmt.replace(/l|D|F|M|j|Y/g, function (t) { return map[t]; });
  }
  function pkg(id) { for (var i = 0; i < PACKAGES.length; i++) if (PACKAGES[i].id === id) return PACKAGES[i]; return null; }
  function byRef(ref) { return state.bookings.filter(function (b) { return b.ref === ref; })[0]; }
  function byId(id) { return state.bookings.filter(function (b) { return b.id === id; })[0]; }
  function quote(p, date, guests) {
    var base = isWeekend(date) ? p.weekend : p.weekday;
    var extraG = Math.max(0, guests - p.max);
    var total = base + extraG * p.fee;
    var down = RESORT.downpaymentPct ? Math.ceil(total * RESORT.downpaymentPct / 100) : 0;
    return { base: base, extraG: extraG, extra: extraG * p.fee, total: total, down: down };
  }
  function partState(date, part) {
    var taken = null;
    state.bookings.forEach(function (b) {
      if (HOLDING.indexOf(b.status) < 0) return;
      if (b.date === date && SLOT_PARTS[pkg(b.pkg).slot].indexOf(part) >= 0) taken = b.status === 'pending' ? 'pending' : 'booked';
    });
    return taken || 'free';
  }
  function slotFree(date, slot) { return SLOT_PARTS[slot].every(function (p) { return partState(date, p) === 'free'; }); }
  function newRef() {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r;
    do { r = 'RB-'; for (var i = 0; i < 6; i++) r += a[Math.floor(Math.random() * a.length)]; } while (byRef(r));
    return r;
  }
  function stars(n, dim) {
    var s = '';
    for (var i = 1; i <= 5; i++) s += svg('star', i <= Math.round(n) ? '' : (dim ? 'dim' : ''));
    return '<span class="stars" aria-hidden="true">' + s + '</span>';
  }
  function statusClass(s) {
    if (s === 'pending') return 'warn';
    if (s === 'confirmed' || s === 'checked_in') return 'ok';
    if (s === 'completed') return 'muted';
    return 'bad';
  }

  var ICON = {
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    message: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z"/>',
    sms: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    back: '<path d="m15 18-6-6 6-6"/>', next: '<path d="m9 18 6-6-6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><circle cx="16.5" cy="14" r="1.2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="m21 15-5-5L5 21"/>',
    smartphone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
    wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><circle cx="12" cy="19.5" r="1"/>',
    car: '<path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><path d="M3 12h18"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-6.8 0-4.4-3.6-6.7-4.6-11.2-2.4 2-3.4 4.4-3.4 6.4-1.3-.7-2-2.2-2-3.4C6.6 9 5 11.5 5 15.2 5 19.3 8 22 12 22z"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8"/>',
    snow: '<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9"/>',
    baby: '<circle cx="12" cy="7" r="4"/><path d="M5 22v-2a7 7 0 0 1 14 0v2M10 7h.01M14 7h.01"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
  };
  function svg(name, cls) {
    return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[name] || ICON.info) + '</svg>';
  }
  function amenityIcon(txt) {
    var t = txt.toLowerCase(), m = [['kiddie', 'baby'], ['pool', 'image'], ['swim', 'image'], ['wi-fi', 'wifi'], ['wifi', 'wifi'], ['park', 'car'], ['grill', 'flame'], ['karaoke', 'mic'], ['air', 'snow'], ['room', 'home'], ['cottage', 'home'], ['table', 'home']];
    for (var i = 0; i < m.length; i++) if (t.indexOf(m[i][0]) >= 0) return svg(m[i][1]);
    return svg('sparkle');
  }

  var app = document.getElementById('app');

  function custHeader() {
    return '<header class="site-header"><div class="wrap">' +
      '<a class="brand" href="#/"><span class="brand__mark">' + esc(RESORT.name[0]) + '</span><span>' + esc(RESORT.name) + '</span></a>' +
      '<nav class="site-nav" aria-label="Main"><a href="#/">Stay</a><a href="#/">Photos</a><a href="#/">Reviews</a><a href="#/">FAQ</a><a href="#/lookup">My booking</a></nav>' +
      '<a class="btn btn--primary btn--sm" href="#/book">Book now</a></div></header>';
  }
  function custFooter() {
    return '<footer class="lux-footer"><div class="wrap"><div class="lux-footer__grid">' +
      '<div class="stack"><a class="brand" href="#/"><span class="brand__mark">' + esc(RESORT.name[0]) + '</span><span>' + esc(RESORT.name) + '</span></a>' +
      '<p style="max-width:28rem">' + esc(RESORT.tagline) + '</p><p>' + esc(RESORT.address) + '</p></div>' +
      '<div><h4>Plan your stay</h4><ul><li><a href="#/book">Check available dates</a></li><li><a href="#/">Rates</a></li><li><a href="#/lookup">Check my booking</a></li></ul></div>' +
      '<div><h4>Get in touch</h4><ul><li><a href="#/">Messenger</a></li><li><a href="#/">' + esc(RESORT.phone) + '</a></li><li><a href="#/">Facebook</a></li></ul></div>' +
      '</div><div class="lux-footer__bottom"><span>© ' + new Date().getFullYear() + ' ' + esc(RESORT.name) + '</span>' +
      '<span class="credit">Website by <a href="https://chesterewing.github.io/shop.html" target="_blank" rel="noopener">chstr.dev</a></span></div></div></footer>';
  }

  function renderHome() {
    var minP = Math.min.apply(null, PACKAGES.map(function (p) { return p.weekday; }));
    var maxG = Math.max.apply(null, PACKAGES.map(function (p) { return p.limit; }));
    var rating = (REVIEWS.reduce(function (a, r) { return a + r.rating; }, 0) / REVIEWS.length);
    var cover = PHOTOS[0];
    var html = custHeader();

    html += '<section class="lux-hero"><img class="lux-hero__img" src="' + cover.src + '" alt="' + esc(cover.cap) + '">' +
      '<div class="wrap"><span class="eyebrow">' + esc(RESORT.place) + '</span><h1>' + esc(RESORT.name) + '</h1>' +
      '<p class="lede">' + esc(RESORT.tagline) + '</p>' +
      '<a class="rating-chip" href="#reviews">' + stars(rating) + ' <b>' + rating.toFixed(1) + '</b> · ' + REVIEWS.length + ' guest reviews</a></div></section>';

    html += '<div class="wrap booking-bar"><form id="bar"><label><span>Date</span>' +
      '<input type="date" id="bar-date" min="' + todayStr() + '" aria-label="Date"></label>' +
      '<label><span>Stay</span><select id="bar-pkg" aria-label="Stay">' +
      PACKAGES.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + ' · from ' + peso(p.weekday) + '</option>'; }).join('') +
      '</select></label><button class="btn btn--primary" type="submit">' + svg('calendar') + ' Check availability</button></form></div>';

    html += '<section class="section"><div class="wrap intro"><div class="reveal">' +
      '<span class="eyebrow">Welcome</span><h2 class="mt-4">A private escape for your <em>whole group</em></h2>' +
      '<p class="lede mt-5">' + esc(RESORT.about) + '</p>' +
      '<div class="intro__facts"><div><b>' + maxG + '</b><span>guests max</span></div><div><b>' + PACKAGES.length + '</b><span>ways to stay</span></div><div><b>' + peso(minP) + '</b><span>rates from</span></div></div>' +
      '<a class="link-arrow mt-6" href="#stay">See rates and what’s included ' + svg('next') + '</a></div>' +
      '<div class="intro__pics reveal" data-delay="1"><img src="' + PHOTOS[1].src + '" alt="' + esc(PHOTOS[1].cap) + '"><img src="' + PHOTOS[2].src + '" alt="' + esc(PHOTOS[2].cap) + '"></div></div></section>';

    html += '<section class="section section--tint" id="stay"><div class="wrap"><div class="section-head reveal">' +
      '<span class="eyebrow">Stay options</span><h2>Choose how long you stay</h2>' +
      '<p class="lede">The whole resort is yours for the time you book. Weekend rates apply on Saturdays and Sundays.</p></div><div class="rates">' +
      PACKAGES.map(function (p, i) {
        var inc = ['Whole resort, just your group', 'Up to ' + p.max + ' guests included', (p.fee ? peso(p.fee) + ' per extra guest, max ' + p.limit : ''), (p.slot !== 'day' ? 'Air-conditioned rooms' : 'Pool, cottages and grill area')].filter(Boolean);
        return '<article class="stay reveal' + (p.featured ? ' stay--featured' : '') + '" data-delay="' + Math.min(3, i) + '">' +
          (p.featured ? '<span class="stay__badge">Most popular</span>' : '') +
          '<h3>' + esc(p.name) + '</h3><span class="stay__time">' + svg('clock') + ' ' + esc(p.time) + '</span>' +
          '<div><div class="stay__price"><b>' + peso(p.weekday) + '</b><span>weekdays</span></div><div class="stay__weekend">' + peso(p.weekend) + ' on weekends</div></div>' +
          '<p class="muted">' + esc(p.desc) + '</p><ul>' + inc.map(function (x) { return '<li>' + svg('check') + ' ' + esc(x) + '</li>'; }).join('') + '</ul>' +
          '<a class="btn btn--primary btn--block" href="#/book?p=' + p.id + '">Book ' + esc(p.name) + '</a></article>';
      }).join('') + '</div></div></section>';

    html += '<section class="section" id="photos"><div class="wrap"><div class="section-head reveal"><span class="eyebrow">Gallery</span><h2>Take a look around</h2></div>' +
      '<div class="mosaic reveal" data-gallery>' + PHOTOS.map(function (ph, i) {
        return '<a href="' + ph.src + '" data-cap="' + esc(ph.cap) + '" aria-label="Open photo: ' + esc(ph.cap) + '"><img src="' + ph.src + '" alt="' + esc(ph.cap) + '" loading="lazy">' +
          (i === PHOTOS.length - 1 ? '<span class="mosaic__more">' + svg('image') + ' All ' + PHOTOS.length + ' photos</span>' : '') + '</a>';
      }).join('') + '</div></div></section>';

    html += '<section class="section section--tint"><div class="wrap"><div class="section-head reveal"><span class="eyebrow">Included in every stay</span><h2>Everything you need, nothing to rent</h2></div>' +
      '<div class="perks reveal">' + AMENITIES.map(function (a) { return '<div class="perk">' + amenityIcon(a) + '<b>' + esc(a) + '</b></div>'; }).join('') + '</div></div></section>';

    html += '<section class="section section--dark" id="reviews"><div class="wrap"><div class="reviews-head reveal">' +
      '<div><span class="eyebrow">Guest reviews</span><h2 class="mt-4">What our guests say</h2></div>' +
      '<div class="score"><b>' + rating.toFixed(1) + '</b><div>' + stars(rating) + '<div class="muted small mt-1">' + REVIEWS.length + ' guest reviews</div></div></div></div>' +
      '<div class="quotes">' + REVIEWS.map(function (r, i) {
        var s = ''; for (var k = 0; k < r.rating; k++) s += svg('star');
        return '<blockquote class="quote reveal" data-delay="' + Math.min(3, i) + '" style="margin:0"><span class="stars">' + s + '</span>' +
          '<p>“' + esc(r.body) + '”</p><footer><span class="avatar">' + esc(r.name[0]) + '</span><span><b>' + esc(r.name) + '</b>' + esc(r.occ) + '</span></footer></blockquote>';
      }).join('') + '</div></div></section>';

    html += '<section class="section" id="faq"><div class="wrap faq-grid"><div class="reveal"><span class="eyebrow">Good to know</span><h2 class="mt-4">Questions, answered</h2>' +
      '<p class="lede mt-4">Still unsure about something? Message us and we’ll get back to you quickly.</p>' +
      '<div class="rules-card mt-6"><h3>House rules</h3><ul class="rules mt-4">' + RULES.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div></div>' +
      '<div class="reveal" data-delay="1">' + FAQS.map(function (f) { return '<details class="faq"><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>'; }).join('') + '</div></div></section>';

    html += '<section class="section"><div class="wrap"><div class="closer reveal"><img src="' + PHOTOS[2].src + '" alt="">' +
      '<span class="eyebrow">Your dates are waiting</span><h2>Book the whole place before someone else does</h2>' +
      '<div class="row"><a class="btn btn--light btn--lg" href="#/book">' + svg('calendar') + ' Check available dates</a></div></div></div></section>';

    html += custFooter();
    html += '<div class="sticky-book"><div><span class="subtle">From</span> <b>' + peso(minP) + '</b></div><a class="btn btn--primary" href="#/book">Check dates</a></div>';

    app.className = 'demo-stage site';
    app.innerHTML = html;
    document.getElementById('bar').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = document.getElementById('bar-date').value, p = document.getElementById('bar-pkg').value;
      location.hash = '#/book?p=' + p + (d ? '&d=' + d : '');
    });
    wireGallery();
    reveal();
    scrollTop();
  }

  function renderBook(params) {
    var pct = RESORT.downpaymentPct, cover = PHOTOS[0];
    var rating = (REVIEWS.reduce(function (a, r) { return a + r.rating; }, 0) / REVIEWS.length);
    var sel = { date: params.d || '', pkg: +params.p || 0, guests: 10, name: '', phone: '', email: '', notes: '', receipt: '' };

    var html = custHeader() + '<div class="wrap book-page"><header class="book-head">' +
      '<a class="link-arrow" href="#/">' + svg('back') + ' ' + esc(RESORT.name) + '</a>' +
      '<h1 class="mt-3">Book your stay</h1><p class="lede mt-2">Three quick steps. Your date is held for you the moment you send the booking.</p></header>' +
      '<div class="book-layout"><form class="book-main" id="bk" novalidate>' +
      '<ol class="stepper-nav" aria-hidden="true"><li class="on"><span>1</span>Date &amp; stay</li><li><span>2</span>Your details</li><li><span>3</span>Payment</li></ol>' +
      '<div id="bk-err"></div>' +
      '<section class="step stack-lg" data-step="1">' +
      '<div class="book-card"><h2 class="book-card__title">When are you coming?</h2><div class="cal mt-4" id="cal"></div>' +
      '<div class="cal__legend"><span><i></i> Open</span><span><i class="off"></i> Taken</span><span class="subtle">Left dot = day · right dot = night</span></div></div>' +
      '<div class="book-card"><h2 class="book-card__title" id="pkg-h">How long will you stay?</h2><p class="subtle mt-1" id="pkg-hint">Pick a date first to see what’s open.</p>' +
      '<div class="options mt-4" id="pkg-opts" role="radiogroup">' +
      PACKAGES.map(function (p) {
        return '<label class="option" data-pkg="' + p.id + '"><input type="radio" name="pk" value="' + p.id + '"' + (sel.pkg === p.id ? ' checked' : '') + '>' +
          '<span class="option__main"><b>' + esc(p.name) + (p.featured ? ' <span class="badge badge--ok">Most popular</span>' : '') + '</b>' +
          '<span class="subtle">' + esc(p.time) + ' · up to ' + p.max + ' guests</span><span class="subtle option__note" hidden></span></span>' +
          '<span class="option__price"><span data-price>' + peso(p.weekday) + '</span><small data-daytype>weekday rate</small></span></label>';
      }).join('') + '</div></div></section>' +

      '<section class="step stack-lg" data-step="2"><div class="book-card stack-lg"><h2 class="book-card__title">Who is booking?</h2>' +
      '<div class="field"><span class="label" id="gl">How many guests?</span><div class="row">' +
      '<div class="stepper"><button type="button" data-step-by="-1" aria-label="Fewer">−</button>' +
      '<input type="number" id="f-guests" inputmode="numeric" min="1" value="10"><button type="button" data-step-by="1" aria-label="More">+</button></div>' +
      '<span class="subtle" id="g-note"></span></div></div>' +
      '<div class="grid-2"><div class="field"><label for="f-name">Full name</label><input type="text" id="f-name" placeholder="Juan Dela Cruz"></div>' +
      '<div class="field"><label for="f-phone">Mobile number</label><input type="tel" id="f-phone" inputmode="tel" placeholder="0917 123 4567"></div></div>' +
      '<div class="field"><label for="f-email">Email <span class="subtle">(optional)</span></label><input type="email" id="f-email" placeholder="you@email.com"></div>' +
      '<div class="field"><label for="f-notes">Anything we should know? <span class="subtle">(optional)</span></label><textarea id="f-notes" placeholder="Birthday, early arrival, extra tables…"></textarea></div></div></section>' +

      '<section class="step stack-lg" data-step="3"><div class="book-card only-phone">' + summaryHtml('') + '</div>' +
      '<div class="book-card pay"><div class="pay__qr"><img src="' + gcashQr() + '" alt="GCash QR code"></div><div class="stack">' +
      '<h2 class="book-card__title">Send the downpayment by GCash</h2><p class="pay__amount"><span data-sum="down">–</span></p>' +
      '<div><span class="subtle">GCash number</span><br><button type="button" class="copy" data-copy="' + esc(RESORT.gcashNumber) + '">' + esc(RESORT.gcashNumber) + ' ' + svg('copy') + '</button>' +
      '<div class="subtle mt-1">Account name: <b>' + esc(RESORT.gcashName) + '</b></div></div>' +
      '<ol class="howto small"><li>Open GCash and send the exact amount.</li><li>Take a screenshot of the receipt.</li><li>Upload it below and press Send booking.</li></ol></div></div>' +
      '<div class="book-card stack"><span class="label">Payment screenshot <span class="subtle">(demo: optional)</span></span>' +
      '<label class="upload" id="up"><input type="file" accept="image/*">' + svg('upload') + '<b>Tap to upload your screenshot</b><span class="subtle">JPG or PNG, straight from your gallery</span><img alt="" hidden></label>' +
      '<span class="hint">No screenshot yet? You can still send the booking. We’ll hold the date for ' + RESORT.holdHours + ' hours.</span></div></section>' +

      '<div class="book-nav" id="bk-nav"><button type="button" class="btn btn--lg" data-go="-1" hidden>' + svg('back') + ' Back</button>' +
      '<button type="button" class="btn btn--primary btn--lg grow" data-go="1">Continue ' + svg('next') + '</button>' +
      '<button type="submit" class="btn btn--primary btn--lg grow" hidden>' + svg('check') + ' Send booking</button></div></form>' +

      '<aside class="book-aside"><div class="book-aside__card"><img class="book-aside__img" src="' + cover.src + '" alt="">' +
      '<div class="book-aside__body"><div><b class="serif" style="font-size:1.25rem">' + esc(RESORT.name) + '</b>' +
      '<div class="subtle mt-1"><span style="color:var(--gold)">★</span> ' + rating.toFixed(1) + ' · ' + REVIEWS.length + ' reviews</div></div>' +
      summaryHtml('summary--aside') +
      '<ul class="assure"><li>' + svg('shield') + ' No double bookings. Your date is locked once approved.</li>' +
      '<li>' + svg('wallet') + ' Pay ' + pct + '% now, the rest when you arrive.</li>' +
      '<li>' + svg('message') + ' Questions? Message the resort any time.</li></ul></div></div></aside></div></div>';

    app.className = 'demo-stage site';
    app.innerHTML = html;
    initBooking(sel);
    scrollTop();
  }

  function summaryHtml(variant) {
    var pct = RESORT.downpaymentPct;
    return '<div class="summary ' + variant + '">' +
      '<div><span class="muted">Date</span><b data-sum="date">Choose a date</b></div>' +
      '<div><span class="muted">Stay</span><b data-sum="pkg">Choose a stay</b></div>' +
      '<div><span class="muted">Guests</span><b data-sum="guests">–</b></div>' +
      '<div data-sum-row="extra" hidden><span class="muted">Extra guests</span><b data-sum="extra">–</b></div>' +
      '<div class="total"><span>Total</span><span data-sum="total">–</span></div>' +
      (pct ? '<div><span>Pay now (' + pct + '%)</span><span class="due" data-sum="down">–</span></div>' +
        '<div><span class="muted">Balance on arrival</span><span data-sum="balance">–</span></div>' : '') + '</div>';
  }
  function gcashQr() {
    if (typeof window.qrcode !== 'function') return RECEIPT;
    var q = window.qrcode(0, 'M'); q.addData('GCASH:' + RESORT.gcashNumber); q.make();
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(q.createSvgTag({ cellSize: 4, margin: 2 }));
  }

  function initBooking(sel) {
    var form = document.getElementById('bk'), calEl = document.getElementById('cal');
    var guestsI = document.getElementById('f-guests');
    var steps = [].slice.call(form.querySelectorAll('.step'));
    var navs = [].slice.call(form.querySelectorAll('.stepper-nav li'));
    var back = form.querySelector('[data-go="-1"]'), next = form.querySelector('[data-go="1"]'), submit = form.querySelector('button[type=submit]');
    var today = todayStr(), maxDate = new Date(); maxDate.setFullYear(maxDate.getFullYear() + 1);
    var view = sel.date ? parse(sel.date) : new Date(); view = new Date(view.getFullYear(), view.getMonth(), 1);
    var step = 1;

    function selPkg() { var r = form.querySelector('input[name=pk]:checked'); return r ? pkg(+r.value) : null; }
    function q() { var p = selPkg(); if (!p || !sel.date) return null; var g = Math.max(1, +guestsI.value || 1); var qq = quote(p, sel.date, g); qq.p = p; qq.g = g; return qq; }

    function drawCal() {
      var y = view.getFullYear(), m = view.getMonth();
      var first = new Date(y, m, 1).getDay(), count = new Date(y, m + 1, 0).getDate();
      var atStart = y === new Date().getFullYear() && m === new Date().getMonth();
      var atEnd = new Date(y, m + 1, 1) > maxDate;
      var html = '<div class="cal__head"><button type="button" class="cal__nav" data-cal="-1" aria-label="Previous month"' + (atStart ? ' disabled' : '') + '>‹</button>' +
        '<b>' + view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + '</b>' +
        '<button type="button" class="cal__nav" data-cal="1" aria-label="Next month"' + (atEnd ? ' disabled' : '') + '>›</button></div><div class="cal__grid">';
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(function (w) { html += '<div class="cal__dow">' + w + '</div>'; });
      for (var i = 0; i < first; i++) html += '<span></span>';
      for (var d = 1; d <= count; d++) {
        var key = ymd(new Date(y, m, d));
        var dayS = partState(key, 'day'), nightS = partState(key, 'night');
        var past = key < today || parse(key) > maxDate;
        var full = !past && dayS !== 'free' && nightS !== 'free';
        var cls = ['cal__day', full ? 'is-full' : '', key === sel.date ? 'is-selected' : '', key === today ? 'is-today' : ''].filter(Boolean).join(' ');
        html += '<button type="button" class="' + cls + '" data-date="' + key + '"' + (past || full ? ' disabled' : '') + '>' + d +
          (past ? '' : '<span class="cal__dots"><i class="' + (dayS === 'free' ? '' : 'off') + '"></i><i class="' + (nightS === 'free' ? '' : 'off') + '"></i></span>') + '</button>';
      }
      calEl.innerHTML = html + '</div>';
    }
    calEl.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-cal]');
      if (nav) { view = new Date(view.getFullYear(), view.getMonth() + (+nav.dataset.cal), 1); drawCal(); return; }
      var day = e.target.closest('[data-date]');
      if (day && !day.disabled) { sel.date = day.dataset.date; drawCal(); refreshPkgs(); }
    });

    function refreshPkgs() {
      var open = 0;
      [].forEach.call(form.querySelectorAll('[data-pkg]'), function (row) {
        var p = pkg(+row.dataset.pkg), input = row.querySelector('input'), note = row.querySelector('.option__note');
        var ok = !sel.date || slotFree(sel.date, p.slot);
        if (ok && sel.date) open++;
        row.classList.toggle('is-off', !ok); input.disabled = !ok;
        if (!ok && input.checked) input.checked = false;
        note.hidden = ok; note.textContent = ok ? '' : 'Already booked on this date';
        if (sel.date) { row.querySelector('[data-price]').textContent = peso(isWeekend(sel.date) ? p.weekend : p.weekday); row.querySelector('[data-daytype]').textContent = isWeekend(sel.date) ? 'weekend rate' : 'weekday rate'; }
      });
      document.getElementById('pkg-hint').textContent = !sel.date ? 'Pick a date first to see what’s open.' :
        open ? fmtDate(sel.date, 'l, F j') + (isWeekend(sel.date) ? ' · weekend rates' : ' · weekday rates') : 'Nothing is open on this date. Please pick another one.';
      if (sel.date && open === 1 && !selPkg()) { var only = form.querySelector('input[name=pk]:not(:disabled)'); if (only) only.checked = true; }
      updateSummary();
    }
    form.addEventListener('change', function (e) { if (e.target.name === 'pk' || e.target === guestsI) updateSummary(); });
    guestsI.addEventListener('input', updateSummary);
    [].forEach.call(form.querySelectorAll('[data-step-by]'), function (b) {
      b.addEventListener('click', function () { var p = selPkg(), lim = p ? p.limit : 200; guestsI.value = Math.min(lim, Math.max(1, (+guestsI.value || 0) + (+b.dataset.stepBy))); updateSummary(); });
    });

    function setSum(k, v) { [].forEach.call(document.querySelectorAll('[data-sum="' + k + '"]'), function (el) { el.textContent = v; }); }
    function updateSummary() {
      var p = selPkg(), note = document.getElementById('g-note');
      if (p) { var g = +guestsI.value || 0; note.textContent = g > p.limit ? 'Maximum is ' + p.limit + ' guests for this package.' : g > p.max ? (g - p.max) + ' extra × ' + peso(p.fee) : 'Up to ' + p.max + ' included'; note.style.color = g > p.limit ? 'var(--bad)' : ''; }
      var qq = q(); if (!qq) return;
      setSum('date', fmtDate(sel.date, 'D, M j, Y')); setSum('pkg', qq.p.name + (qq.p.time ? ' · ' + qq.p.time : '')); setSum('guests', String(qq.g));
      setSum('extra', qq.extraG + ' × ' + peso(qq.p.fee) + ' = ' + peso(qq.extra));
      [].forEach.call(document.querySelectorAll('[data-sum-row="extra"]'), function (r) { r.hidden = qq.extraG === 0; });
      setSum('total', peso(qq.total)); setSum('down', peso(qq.down)); setSum('balance', peso(qq.total - qq.down));
    }

    var up = document.getElementById('up');
    up.querySelector('input').addEventListener('change', function () {
      var f = this.files && this.files[0]; if (!f) return;
      var img = up.querySelector('img'); img.src = URL.createObjectURL(f); img.hidden = false; up.querySelector('b').textContent = 'Screenshot ready. Tap to change.'; sel.receipt = 'uploaded';
    });

    function problem(n) {
      if (n === 1) { if (!sel.date) return 'Please pick a date on the calendar.'; if (!selPkg()) return 'Please choose a package.'; }
      if (n === 2) {
        var p = selPkg(), g = +guestsI.value || 0;
        if (g < 1) return 'Please enter how many guests are coming.';
        if (p && g > p.limit) return 'This package allows up to ' + p.limit + ' guests.';
        if (document.getElementById('f-name').value.trim().length < 2) return 'Please enter your name.';
        if (document.getElementById('f-phone').value.replace(/\D/g, '').length < 10) return 'Please enter a mobile number like 0917 123 4567.';
        var em = document.getElementById('f-email').value.trim();
        if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return 'That email address does not look right.';
      }
      return '';
    }
    function showErr(msg) { var box = document.getElementById('bk-err'); box.innerHTML = msg ? '<div class="alert alert--bad" role="alert">' + svg('alert') + ' ' + esc(msg) + '</div>' : ''; }
    function go(n) {
      step = Math.min(3, Math.max(1, n));
      steps.forEach(function (s) { s.hidden = +s.dataset.step !== step; });
      navs.forEach(function (li, i) { li.classList.toggle('on', i === step - 1); li.classList.toggle('done', i < step - 1); });
      back.hidden = step === 1; next.hidden = step === 3; submit.hidden = step !== 3;
      showErr(''); updateSummary();
      if (window.scrollY > form.offsetTop) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    next.addEventListener('click', function () { var m = problem(step); if (m) return showErr(m); go(step + 1); });
    back.addEventListener('click', function () { go(step - 1); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = problem(1) || problem(2); if (m) return showErr(m);
      var p = selPkg(), g = +guestsI.value || 1, qq = quote(p, sel.date, g);
      if (!slotFree(sel.date, p.slot)) return showErr('Sorry, someone just booked that date and time. Please pick another one.');
      var bk = { id: ++state.seq, ref: newRef(), pkg: p.id, date: sel.date, guests: g,
        name: document.getElementById('f-name').value.trim(), phone: document.getElementById('f-phone').value.trim(),
        email: document.getElementById('f-email').value.trim(), notes: document.getElementById('f-notes').value.trim(),
        total: qq.total, amountPaid: 0, receipt: sel.receipt ? RECEIPT : '', status: 'pending', source: 'online', note: '', created: Date.now(),
        history: [h('created', 'Booked online', document.getElementById('f-name').value.trim())] };
      if (sel.receipt) bk.history.push(h('receipt', 'Payment screenshot uploaded', bk.name));
      state.bookings.push(bk); save(state);
      location.hash = '#/b/' + bk.ref + '?new=1';
    });

    drawCal(); refreshPkgs(); go(step);
  }

  function renderStatus(ref, params) {
    var b = byRef(ref);
    if (!b) { notFound(); return; }
    var p = pkg(b.pkg), balance = Math.max(0, b.total - b.amountPaid), down = quote(p, b.date, b.guests).down;
    var hero = {
      pending: b.receipt ? ['warn', 'clock', 'Payment received, waiting for approval', 'The resort will check your payment and confirm. You will get a call or text.']
        : ['warn', 'wallet', 'Date on hold, waiting for payment', 'Upload your GCash screenshot to confirm your booking.'],
      confirmed: ['ok', 'check', 'You’re booked!', 'See you on ' + fmtDate(b.date, 'l, F j') + '.'],
      checked_in: ['ok', 'sun', 'Enjoy your stay!', 'You are checked in.'],
      completed: ['muted', 'star', 'Thank you for staying with us', 'We hope to see you again.'],
      declined: ['bad', 'x', 'Booking declined', 'The resort could not accept this booking. Please contact them.'],
      cancelled: ['bad', 'x', 'Booking cancelled', 'This booking was cancelled.'],
      expired: ['bad', 'clock', 'Hold expired', 'No payment arrived in time, so the date was released.']
    }[b.status];

    var html = custHeader() + '<div class="wrap narrow section stack-lg">';
    if (params['new']) html += '<div class="alert alert--ok">' + svg('check') + ' Booking sent! Save this page or take a screenshot so you can check it later.</div>';
    if (params.uploaded) html += '<div class="alert alert--ok">' + svg('check') + ' Screenshot received. The resort will review it soon.</div>';
    html += '<div class="card status-hero center"><div class="status-hero__icon" style="background:var(--' + hero[0] + '-soft,#eef0f3);color:var(--' + hero[0] + ',var(--muted))">' + svg(hero[1]) + '</div>' +
      '<h1>' + esc(hero[2]) + '</h1><p class="muted mt-2">' + esc(hero[3]) + '</p><p class="mt-4">Reference <span class="ref">' + esc(b.ref) + '</span></p></div>';

    if (b.status === 'pending' && !b.receipt) {
      html += '<div class="card stack"><h2 style="font-size:1.4rem">Send ' + peso(down) + ' by GCash</h2>' +
        '<p>GCash number: <button type="button" class="copy" data-copy="' + esc(RESORT.gcashNumber) + '">' + esc(RESORT.gcashNumber) + ' ' + svg('copy') + '</button> <span class="subtle">· ' + esc(RESORT.gcashName) + '</span></p>' +
        '<label class="upload" id="up2"><input type="file" accept="image/*">' + svg('upload') + '<b>Tap to upload your screenshot</b><img alt="" hidden></label>' +
        '<button class="btn btn--primary btn--lg btn--block" id="up2btn" type="button">' + svg('upload') + ' Send screenshot</button></div>';
    }

    if (b.status === 'confirmed' || b.status === 'checked_in' || (b.status === 'pending' && b.receipt)) {
      html += '<div class="card checkin"><div class="checkin__qr" id="ci-qr"></div><div class="stack"><h2 style="font-size:1.35rem">Your check-in code</h2>' +
        '<p class="muted">Show this when you arrive. The staff scans it to find your booking right away.</p>' +
        '<p class="subtle">No signal at the resort? Take a screenshot now.</p></div></div>';
    }

    html += '<div class="card"><h2 style="font-size:1.4rem">Booking details</h2><dl class="dl mt-4">' +
      row('Date', fmtDate(b.date, 'l, F j, Y')) + row('Stay', esc(p.name) + '<br><span class="subtle">' + esc(p.time) + '</span>') +
      row('Guests', b.guests) + row('Name', esc(b.name)) + row('Total', peso(b.total)) + row('Paid', peso(b.amountPaid)) +
      ((b.status === 'pending' || b.status === 'confirmed') ? row('Balance on arrival', peso(balance)) : '') + '</dl></div>';

    html += '<div class="contact-grid"><a class="btn btn--lg" href="#/">' + svg('phone') + ' Call the resort</a>' +
      '<a class="btn btn--lg" href="#/">' + svg('message') + ' Messenger</a></div>';
    html += '</div>' + custFooter();

    app.className = 'demo-stage site';
    app.innerHTML = html;

    var qel = document.getElementById('ci-qr');
    if (qel && typeof window.qrcode === 'function') { var q = window.qrcode(0, 'M'); q.addData('DEMO-CHECKIN:' + b.ref); q.make(); qel.innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); }
    var up2 = document.getElementById('up2btn');
    if (up2) up2.addEventListener('click', function () { b.receipt = RECEIPT; b.history.push(h('receipt', 'Payment screenshot uploaded', b.name)); save(state); location.hash = '#/b/' + b.ref + '?uploaded=1'; });
    scrollTop();
  }
  function row(dt, dd) { return '<div><dt>' + dt + '</dt><dd>' + dd + '</dd></div>'; }

  function renderLookup() {
    var mine = state.bookings.filter(function (b) { return b.date >= plusDays(-7); }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var html = custHeader() + '<div class="wrap section" style="max-width:480px">';
    if (mine.length) {
      html += '<div class="my-bookings"><div class="my-bookings__head"><b>Bookings in this demo</b><span class="subtle">Saved in your browser</span></div>' +
        mine.map(function (b) { return '<div class="my-bookings__row"><a href="#/b/' + b.ref + '"><span class="ref">' + esc(b.ref) + '</span><span>' + fmtDate(b.date, 'D, M j') + ' · ' + esc(pkg(b.pkg).name) + '</span><span class="link-arrow">View ›</span></a></div>'; }).join('') + '</div>';
    }
    html += '<form class="card stack-lg" id="lk" style="margin-top:1.25rem"><div><h1 style="font-size:2rem">Check my booking</h1>' +
      '<p class="muted mt-2">Enter the reference and the mobile number you used.</p></div><div id="lk-err"></div>' +
      '<div class="field"><label for="lref">Booking reference</label><input type="text" id="lref" placeholder="RB-AB12CD" style="text-transform:uppercase"></div>' +
      '<div class="field"><label for="lph">Mobile number</label><input type="tel" id="lph" placeholder="0917 123 4567"></div>' +
      '<button class="btn btn--primary btn--lg btn--block" type="submit">Find my booking</button></form></div>' + custFooter();
    app.className = 'demo-stage site'; app.innerHTML = html;
    document.getElementById('lk').addEventListener('submit', function (e) {
      e.preventDefault();
      var b = byRef(document.getElementById('lref').value.trim().toUpperCase());
      var ph = document.getElementById('lph').value.replace(/\D/g, '');
      if (b && ph.length >= 10 && b.phone.replace(/\D/g, '').slice(-10) === ph.slice(-10)) { location.hash = '#/b/' + b.ref; return; }
      document.getElementById('lk-err').innerHTML = '<div class="alert alert--bad">' + svg('alert') + ' We could not find a booking with that reference and mobile number. (Tip: open one from the list above.)</div>';
    });
    scrollTop();
  }

  function ownerShell(title, body, back) {
    var pend = state.bookings.filter(function (b) { return b.status === 'pending'; }).length;
    var side = [['#/admin', 'Today', 'home'], ['#/admin/bookings', 'Bookings', 'list'], ['#/admin/calendar', 'Calendar', 'calendar'], ['#/admin/rates', 'Rates', 'tag']];
    var cur = location.hash.split('?')[0];
    var nav = side.map(function (s) {
      var on = s[0] === '#/admin' ? cur === '#/admin' : cur.indexOf(s[0]) === 0;
      return '<a class="nav" href="' + s[0] + '"' + (on ? ' aria-current="page"' : '') + '>' + svg(s[2]) + ' ' + s[1] + (s[0] === '#/admin/bookings' && pend ? '<span class="count">' + pend + '</span>' : '') + '</a>';
    }).join('');
    var tabs = side.concat([['#/admin/more', 'More', 'more']]).map(function (s) {
      var on = s[0] === '#/admin' ? cur === '#/admin' : cur.indexOf(s[0]) === 0;
      return '<a href="' + s[0] + '"' + (on ? ' aria-current="page"' : '') + '>' + svg(s[2]) + s[1] + (s[0] === '#/admin/bookings' && pend ? '<span class="count">' + pend + '</span>' : '') + '</a>';
    }).join('');

    var html = '<aside class="side"><a class="brand" href="#/admin"><span class="brand__mark">' + esc(RESORT.name[0]) + '</span><span>' + esc(RESORT.name) + '</span></a>' +
      '<div class="side__section">Daily</div>' + nav +
      '<div class="side__foot stack"><a class="btn btn--primary btn--block" href="#/admin/new">' + svg('plus') + ' Add booking</a>' +
      '<a class="btn btn--block" href="#/" >' + svg('external') + ' View website</a>' +
      '<div class="center"><span class="credit">Website by <a href="https://chesterewing.github.io/shop.html" target="_blank" rel="noopener">chstr.dev</a></span></div></div></aside>';
    html += '<header class="topbar"><div class="wrap">' + (back ? '<a class="topbar__back" href="' + back + '" aria-label="Back">' + svg('back') + '</a>' : '') +
      '<h1 class="grow">' + esc(title) + '</h1><span class="demo-flag">' + svg('info') + ' Preview</span></div></header>';
    html += '<main class="admin-main"><div class="wrap stack-lg">' + body + '</div></main>';
    html += '<nav class="tabbar">' + tabs + '</nav>';
    html += '<div class="toast" id="toast"></div>';

    app.className = 'demo-stage admin-body';
    app.innerHTML = html;
    wireTopbarScroll();
    wireZoom();
    scrollTop();
  }

  function adminItem(b, showDate) {
    var p = pkg(b.pkg), balance = b.total - b.amountPaid;
    var money = b.status === 'pending' ? (b.receipt ? 'Paid?' : 'No payment yet') : (balance > 0 ? 'Balance ' + peso(balance) : 'Fully paid');
    var lbl = STATUS_LABEL[b.status] === 'Waiting for approval' ? 'Pending' : STATUS_LABEL[b.status];
    return '<a class="item" href="#/admin/b/' + b.id + '">' +
      (showDate !== false ? '<span class="item__date"><small>' + fmtDate(b.date, 'M') + '</small><b>' + fmtDate(b.date, 'j') + '</b></span>' : '') +
      '<span class="item__main"><b>' + esc(b.name) + '</b><span>' + esc(p.name) + ' · ' + b.guests + ' guests · ' + esc(money) + '</span></span>' +
      (b.receipt ? '<img class="item__thumb" src="' + b.receipt + '" alt="">' : '') +
      '<span class="item__side"><span class="badge badge--' + statusClass(b.status) + '">' + esc(lbl) + '</span></span></a>';
  }

  function renderToday() {
    var today = todayStr();
    var pending = state.bookings.filter(function (b) { return b.status === 'pending'; });
    var withR = pending.filter(function (b) { return b.receipt; }), noR = pending.filter(function (b) { return !b.receipt; });
    var arriving = state.bookings.filter(function (b) { return b.date === today && (b.status === 'confirmed' || b.status === 'checked_in'); });
    var upcoming = state.bookings.filter(function (b) { return b.date > today && b.date <= plusDays(7) && b.status === 'confirmed'; });
    var monthIncome = state.bookings.filter(function (b) { return HOLDING.indexOf(b.status) >= 0 && b.date.slice(0, 7) === today.slice(0, 7); }).reduce(function (a, b) { return a + b.amountPaid; }, 0);
    var monthCount = state.bookings.filter(function (b) { return ['confirmed', 'checked_in', 'completed'].indexOf(b.status) >= 0 && b.date.slice(0, 7) === today.slice(0, 7); }).length;
    var hour = new Date().getHours(), greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    var bits = [];
    if (withR.length) bits.push(withR.length + ' to approve');
    if (arriving.length) bits.push(arriving.length + ' arriving today');
    if (!bits.length) bits.push(upcoming.length ? upcoming.length + ' booked this week' : 'All quiet. Nothing needs you right now');

    var b = '<section class="hello"><img src="' + PHOTOS[0].src + '" alt="">' +
      '<small>' + fmtDate(today, 'l, F j') + '</small><h2>' + greet + ', Owner</h2><p>' + esc(bits.join(' · ')) + '.</p>' +
      '<div class="row"><a class="btn btn--gold" href="#/admin/new">' + svg('plus') + ' Add booking</a><a class="btn btn--glass" href="#/admin/calendar">' + svg('calendar') + ' Calendar</a></div></section>';

    b += '<div class="stats">' +
      '<a class="stat' + (pending.length ? ' stat--alert' : '') + '" href="#/admin/bookings"><small>To approve</small><b>' + pending.length + '</b></a>' +
      '<a class="stat" href="#arriving"><small>Arriving today</small><b>' + arriving.length + '</b></a>' +
      '<div class="stat"><small>Bookings this month</small><b>' + monthCount + '</b></div>' +
      '<div class="stat"><small>Collected this month</small><b>' + peso(monthIncome) + '</b><span class="spark">' + [40, 55, 35, 70, 60, 100].map(function (v) { return '<i style="height:' + v + '%"></i>'; }).join('') + '</span></div></div>';

    if (withR.length) {
      b += '<section class="stack"><div class="sec-title"><h3>Paid, waiting for you</h3></div>' + withR.map(function (bk) {
        var dn = quote(pkg(bk.pkg), bk.date, bk.guests).down;
        return '<div class="approve-card"><a class="receipt" href="' + bk.receipt + '" data-zoom><img src="' + bk.receipt + '" alt="Receipt from ' + esc(bk.name) + '"></a>' +
          '<div class="stack"><div class="row row--between"><div><b style="font-size:1.1rem">' + esc(bk.name) + '</b>' +
          '<div class="subtle">' + fmtDate(bk.date, 'D, M j') + ' · ' + esc(pkg(bk.pkg).name) + ' · ' + bk.guests + ' guests</div></div><span class="badge badge--warn">Check payment</span></div>' +
          '<div><span class="subtle">Should be</span><div class="amount">' + peso(dn) + ' <span class="subtle" style="font-family:var(--font);font-size:.9rem">of ' + peso(bk.total) + '</span></div></div>' +
          '<p class="small muted">Look for this amount in your GCash, then approve.</p>' +
          '<div class="approve__actions"><button class="btn btn--ok btn--block btn--lg" data-approve="' + bk.id + '">' + svg('check') + ' Approve</button>' +
          '<a class="btn btn--block btn--lg" href="#/admin/b/' + bk.id + '">Details</a></div></div></div>';
      }).join('') + '</section>';
    }

    b += '<section class="card stack"><div class="sec-title"><h3>Next 14 days</h3><a href="#/admin/calendar">Full calendar</a></div><div class="strip">';
    for (var i = 0; i < 14; i++) {
      var d = plusDays(i), we = isWeekend(d);
      b += '<a href="#/admin/calendar" class="' + (we ? 'is-weekend' : '') + '"><span>' + fmtDate(d, 'D') + '</span><b>' + (+d.slice(8)) + '</b>' +
        '<span class="half ' + halfCls(d, 'day') + '"></span><span class="half ' + halfCls(d, 'night') + '"></span></a>';
    }
    b += '</div><div class="cal__legend"><span><i style="background:var(--brand)"></i> Booked</span><span><i style="background:var(--gold)"></i> Pending</span><span><i class="off"></i> Open</span></div></section>';

    if (noR.length) b += '<section class="stack"><div class="sec-title"><h3>On hold, no payment yet</h3></div><div class="list">' + noR.map(function (x) { return adminItem(x); }).join('') + '</div></section>';

    b += '<section class="stack" id="arriving"><div class="sec-title"><h3>Arriving today</h3></div>' +
      (arriving.length ? '<div class="list">' + arriving.map(function (x) { return adminItem(x, false); }).join('') + '</div>' : '<div class="card empty">' + svg('sun') + '<p>No guests today.</p></div>') + '</section>';

    b += '<section class="stack"><div class="sec-title"><h3>Coming up this week</h3><a href="#/admin/bookings">All bookings</a></div>' +
      (upcoming.length ? '<div class="list">' + upcoming.map(function (x) { return adminItem(x); }).join('') + '</div>' : '<div class="card empty">' + svg('calendar') + '<p>Nothing booked for the next 7 days yet.</p></div>') + '</section>';

    ownerShell('Today', b, null);
    [].forEach.call(document.querySelectorAll('[data-approve]'), function (btn) {
      btn.addEventListener('click', function () { approve(+btn.dataset.approve); });
    });
  }
  function halfCls(date, part) { var s = partState(date, part); return s === 'booked' ? 'booked' : s === 'pending' ? 'pending' : ''; }

  function renderBookings(params) {
    var tab = params.tab || 'pending';
    var today = todayStr(), qq = (params.q || '').toLowerCase();
    var list = state.bookings.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).filter(function (b) {
      if (tab === 'pending') return b.status === 'pending';
      if (tab === 'upcoming') return b.date >= today && ['pending', 'confirmed', 'checked_in'].indexOf(b.status) >= 0;
      if (tab === 'past') return b.date < today || ['completed', 'declined', 'cancelled', 'expired'].indexOf(b.status) >= 0;
      return true;
    }).filter(function (b) { return !qq || b.name.toLowerCase().indexOf(qq) >= 0 || b.ref.toLowerCase().indexOf(qq) >= 0 || b.phone.indexOf(qq) >= 0; });
    var pend = state.bookings.filter(function (b) { return b.status === 'pending'; }).length;

    var tabList = [['pending', 'To approve'], ['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All']];
    var b = '<div class="tabs">' + tabList.map(function (t) { return '<a href="#/admin/bookings?tab=' + t[0] + '"' + (tab === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + (t[0] === 'pending' && pend ? ' <span class="count">' + pend + '</span>' : '') + '</a>'; }).join('') + '</div>';
    b += '<form class="search" id="bksearch"><input type="text" id="bkq" value="' + esc(params.q || '') + '" placeholder="Search name, mobile or reference"></form>';
    b += list.length ? '<div class="list">' + list.map(function (x) { return adminItem(x); }).join('') + '</div>' :
      '<div class="card empty">' + svg('list') + '<p>' + (tab === 'pending' ? 'All caught up. Nothing to approve.' : 'No bookings here yet.') + '</p></div>';
    ownerShell('Bookings', b, null);
    document.getElementById('bksearch').addEventListener('submit', function (e) { e.preventDefault(); location.hash = '#/admin/bookings?tab=' + tab + '&q=' + encodeURIComponent(document.getElementById('bkq').value); });
  }

  function renderOwnerBooking(id) {
    var bk = byId(id); if (!bk) { ownerShell('Not found', '<div class="card empty">' + svg('list') + '<p>Booking not found.</p></div>', '#/admin/bookings'); return; }
    var p = pkg(bk.pkg), balance = Math.max(0, bk.total - bk.amountPaid), down = quote(p, bk.date, bk.guests).down;
    var b = '<div class="bk-head"><div class="row row--between"><span class="badge badge--' + statusClass(bk.status) + '">' + esc(STATUS_LABEL[bk.status]) + '</span><span class="ref">' + esc(bk.ref) + '</span></div>' +
      '<h2 class="mt-2">' + fmtDate(bk.date, 'l, F j') + '</h2><p class="muted">' + esc(p.name) + ' · ' + esc(p.time) + ' · ' + bk.guests + ' guests</p>' +
      '<div class="bk-money"><div><small>Total</small><b>' + peso(bk.total) + '</b></div><div><small>Received</small><b>' + peso(bk.amountPaid) + '</b></div>' +
      '<div class="' + (balance > 0 ? 'due' : '') + '"><small>Balance</small><b>' + (balance > 0 ? peso(balance) : 'Paid') + '</b></div></div></div>';

    if (bk.status === 'pending') {
      b += '<div class="card stack"><h3>Check the payment</h3>';
      b += bk.receipt ? '<a class="receipt" href="' + bk.receipt + '" data-zoom style="cursor:zoom-in"><img src="' + bk.receipt + '" alt="Payment screenshot"></a><p class="small">Open GCash and look for <b>' + peso(down) + '</b> from ' + esc(bk.name) + '.</p>'
        : '<div class="alert alert--warn small">' + svg('clock') + ' No screenshot yet.</div>';
      b += '<button class="btn btn--ok btn--lg btn--block" data-approve="' + bk.id + '">' + svg('check') + ' Approve booking</button>' +
        '<button class="btn btn--bad btn--block" data-decline="' + bk.id + '">' + svg('x') + ' Decline and free the date</button></div>';
    } else if (bk.status === 'confirmed' || bk.status === 'checked_in') {
      b += '<div class="actions-bar">';
      b += bk.status === 'confirmed' ? '<button class="btn btn--primary btn--lg btn--block" data-checkin="' + bk.id + '">' + svg('login') + ' Check in</button>'
        : '<button class="btn btn--primary btn--lg btn--block" data-complete="' + bk.id + '">' + svg('check') + ' Mark as completed</button>';
      if (balance > 0) b += '<button class="btn btn--ok btn--lg btn--block" data-paid="' + bk.id + '">' + svg('wallet') + ' Balance paid (' + peso(balance) + ')</button>';
      b += '</div>';
    }

    b += '<div class="card stack"><h3>' + esc(bk.name) + '</h3><p class="muted">' + esc(bk.phone) + (bk.email ? ' · ' + esc(bk.email) : '') + '</p>' +
      '<div class="actions-bar"><a class="btn" href="tel:' + esc(bk.phone.replace(/\s/g, '')) + '">' + svg('phone') + ' Call</a>' +
      '<a class="btn" href="sms:' + esc(bk.phone.replace(/\s/g, '')) + '">' + svg('sms') + ' Text</a>' +
      '<a class="btn" href="#/b/' + bk.ref + '" target="_blank">' + svg('external') + ' Guest view</a></div>' +
      (bk.notes ? '<div class="alert alert--info small">' + svg('info') + ' <span><b>Guest note:</b> ' + esc(bk.notes) + '</span></div>' : '') + '</div>';

    b += '<div class="card"><h3>History</h3><ul class="timeline mt-4">' + bk.history.slice().reverse().map(function (l) {
      return '<li><b>' + esc(l.detail || l.action) + '</b><br><span class="subtle">' + new Date(l.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + (l.by ? ' · ' + esc(l.by) : '') + '</span></li>';
    }).join('') + '</ul></div>';

    ownerShell(bk.name, b, '#/admin/bookings');
    var bind = function (attr, fn) { [].forEach.call(document.querySelectorAll('[' + attr + ']'), function (el) { el.addEventListener('click', function () { fn(+el.getAttribute(attr)); }); }); };
    bind('data-approve', approve); bind('data-decline', decline); bind('data-checkin', checkin); bind('data-complete', complete); bind('data-paid', balancePaid);
  }

  function changeStatus(id, to, detail) { var b = byId(id); if (!b) return; b.status = to; b.history.push(h(to, detail, 'You')); save(state); }
  function approve(id) { var b = byId(id); if (!b) return; var dn = quote(pkg(b.pkg), b.date, b.guests).down; b.amountPaid = Math.max(b.amountPaid, dn); changeStatus(id, 'confirmed', 'Confirmed · paid ' + peso(b.amountPaid)); toast('Approved. The date is locked for ' + b.name + '.'); route(); }
  function decline(id) { if (!confirm('Decline this booking? The date will open for others.')) return; changeStatus(id, 'declined', 'Declined'); toast('Declined. The date is open again.'); route(); }
  function checkin(id) { changeStatus(id, 'checked_in', 'Checked in'); toast('Checked in.'); route(); }
  function complete(id) { changeStatus(id, 'completed', 'Completed'); toast('Marked as completed.'); route(); }
  function balancePaid(id) { var b = byId(id); if (!b) return; b.amountPaid = b.total; b.history.push(h('payment', 'Balance paid · total ' + peso(b.total), 'You')); save(state); toast('Payment saved.'); route(); }

  function renderNew() {
    var b = '<p class="muted">For bookings that came by phone, Messenger or walk-in. It’s confirmed right away.</p><form class="card stack-lg" id="nw">' +
      '<div class="grid-2"><div class="field"><label for="n-date">Date</label><input type="date" id="n-date" min="' + todayStr() + '" required></div>' +
      '<div class="field"><label for="n-pkg">Package</label><select id="n-pkg">' + PACKAGES.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + ' (' + peso(p.weekday) + ' / ' + peso(p.weekend) + ')</option>'; }).join('') + '</select></div></div>' +
      '<div class="grid-2"><div class="field"><label for="n-name">Guest name</label><input type="text" id="n-name" required></div>' +
      '<div class="field"><label for="n-phone">Mobile number</label><input type="tel" id="n-phone" required></div></div>' +
      '<div class="grid-2"><div class="field"><label for="n-guests">Guests</label><input type="number" id="n-guests" min="1" value="10"></div>' +
      '<div class="field"><label for="n-paid">Amount already received</label><input type="number" id="n-paid" min="0" value="0"></div></div>' +
      '<div id="nw-err"></div><button class="btn btn--primary btn--lg btn--block" type="submit">' + svg('check') + ' Save booking</button></form>';
    ownerShell('Add a booking', b, '#/admin');
    document.getElementById('nw').addEventListener('submit', function (e) {
      e.preventDefault();
      var date = document.getElementById('n-date').value, p = pkg(+document.getElementById('n-pkg').value);
      var g = Math.max(1, +document.getElementById('n-guests').value || 1);
      var name = document.getElementById('n-name').value.trim(), phone = document.getElementById('n-phone').value.trim();
      var err = document.getElementById('nw-err');
      if (!date) { err.innerHTML = alertBad('Please choose a date.'); return; }
      if (!slotFree(date, p.slot)) { err.innerHTML = alertBad('That date and time is already booked.'); return; }
      if (name.length < 2) { err.innerHTML = alertBad('Please enter the guest name.'); return; }
      var qq = quote(p, date, g);
      var b2 = { id: ++state.seq, ref: newRef(), pkg: p.id, date: date, guests: g, name: name, phone: phone, email: '', notes: '',
        total: qq.total, amountPaid: +document.getElementById('n-paid').value || 0, receipt: '', status: 'confirmed', source: 'walk_in', note: '', created: Date.now(),
        history: [h('created', 'Added by staff', 'You'), h('confirmed', 'Confirmed', 'You')] };
      state.bookings.push(b2); save(state); toast('Booking added for ' + name + '.'); location.hash = '#/admin/b/' + b2.id;
    });
  }
  function alertBad(m) { return '<div class="alert alert--bad">' + svg('alert') + ' ' + esc(m) + '</div>'; }

  function renderCalendar(params) {
    var m = /^\d{4}-\d{2}$/.test(params.m || '') ? params.m : todayStr().slice(0, 7);
    var day = params.d || null;
    var first = new Date(m + '-01').getDay(), days = new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
    var prev = shiftMonth(m, -1), next = shiftMonth(m, 1), today = todayStr();
    var byDate = {};
    state.bookings.forEach(function (b) { if (HOLDING.indexOf(b.status) >= 0 && b.date.slice(0, 7) === m) (byDate[b.date] = byDate[b.date] || []).push(b); });

    var b = '<div class="card admin-cal cal"><div class="cal__head">' +
      '<a class="cal__nav" href="#/admin/calendar?m=' + prev + '" style="display:grid;place-items:center;text-decoration:none">‹</a>' +
      '<b>' + new Date(m + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + '</b>' +
      '<a class="cal__nav" href="#/admin/calendar?m=' + next + '" style="display:grid;place-items:center;text-decoration:none">›</a></div><div class="cal__grid">';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(function (w) { b += '<div class="cal__dow">' + w + '</div>'; });
    for (var i = 0; i < first; i++) b += '<span></span>';
    for (var d = 1; d <= days; d++) {
      var key = m + '-' + String(d).padStart(2, '0');
      var sel = key === day ? ' is-selected' : '', tod = key === today ? ' is-today' : '';
      var who = (byDate[key] || []).slice(0, 2).map(function (x) { return '<span class="cal__who">' + esc(x.name.split(' ')[0]) + '</span>'; }).join('');
      b += '<a class="cal__day' + sel + tod + '" href="#/admin/calendar?m=' + m + '&d=' + key + '"' + (key < today ? ' style="opacity:.55"' : '') + '><b>' + d + '</b>' +
        '<span class="half ' + halfCls(key, 'day') + '"></span><span class="half ' + halfCls(key, 'night') + '"></span>' + who + '</a>';
    }
    b += '</div><div class="cal__legend"><span><i style="background:var(--brand)"></i> Booked</span><span><i style="background:var(--gold)"></i> Pending</span><span class="subtle">Top = day · bottom = night</span></div></div>';

    if (day) {
      var list = (byDate[day] || []);
      b += '<section class="stack"><div class="sec-title"><h3>' + fmtDate(day, 'l, F j') + '</h3>' + (day >= today ? '<a href="#/admin/new">+ Add booking</a>' : '') + '</div>' +
        (list.length ? '<div class="list">' + list.map(function (x) { return adminItem(x, false); }).join('') + '</div>' : '<p class="muted">No bookings on this day.</p>') + '</section>';
    } else {
      b += '<p class="subtle center">Tap a date to see its bookings.</p>';
    }
    ownerShell('Calendar', b, null);
  }
  function shiftMonth(m, delta) { var d = new Date(m + '-01'); d.setMonth(d.getMonth() + delta); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }

  function renderRates() {
    var b = '<p class="muted">These are the prices guests see and are charged. In the demo they’re read-only.</p>' +
      PACKAGES.map(function (p) {
        return '<details class="panel"><summary><span class="grow">' + esc(p.name) + (p.featured ? ' <span class="badge badge--ok">Most popular</span>' : '') +
          '<br><span class="subtle" style="font-weight:500">' + esc(p.time) + ' · ' + peso(p.weekday) + ' weekdays · ' + peso(p.weekend) + ' weekends</span></span></summary>' +
          '<div class="panel__body"><dl class="dl"><div><dt>Weekday</dt><dd>' + peso(p.weekday) + '</dd></div><div><dt>Weekend</dt><dd>' + peso(p.weekend) + '</dd></div>' +
          '<div><dt>Guests included</dt><dd>' + p.max + '</dd></div><div><dt>Extra guest fee</dt><dd>' + peso(p.fee) + '</dd></div></dl>' +
          '<p class="subtle mt-3">In the real app you can edit all of this, add packages, and mark one as "Most popular".</p></div></details>';
      }).join('');
    b += '<div class="card card--brand"><b>This is a preview.</b><p class="subtle mt-1">Rates, photos, reviews, GCash details and more are all editable in the full version. Nothing here saves to a real server.</p></div>';
    ownerShell('Rates', b, null);
  }

  function renderMore() {
    var b = '<div class="list">' +
      '<a class="item" href="#/admin/rates"><span class="platform__icon">' + svg('tag') + '</span><span class="item__main"><b>Rates</b><span>Prices guests see</span></span>' + svg('next') + '</a>' +
      '<a class="item" href="#/"><span class="platform__icon">' + svg('external') + '</span><span class="item__main"><b>View website</b><span>See what guests see</span></span></a>' +
      '<a class="item" href="guide.html" target="_blank" rel="noopener"><span class="platform__icon">' + svg('info') + '</span><span class="item__main"><b>Owner’s guide</b><span>Simple steps, English &amp; Tagalog</span></span>' + svg('external') + '</a>' +
      '</div><div class="card card--brand"><b>Full version adds:</b><p class="subtle mt-1">Photos, Reviews &amp; FAQ, monthly Reports with CSV export, Settings (GCash, logo, colors, app links), terms &amp; cancellation policy, website analytics, staff accounts, email alerts, English/Tagalog, and install as an app.</p></div>';
    ownerShell('More', b, null);
  }

  function toast(msg) {
    var t = document.getElementById('toast'); if (!t) return;
    t.innerHTML = '<span>' + esc(msg) + '</span>'; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 4000);
  }
  function wireTopbarScroll() {
    if (_wiredScroll) return; _wiredScroll = true;
    window.addEventListener('scroll', function () { var bar = document.querySelector('.topbar'); if (bar) bar.classList.toggle('scrolled', window.scrollY > 4); }, { passive: true });
  }
  function wireZoom() {
    if (_wiredZoom) return; _wiredZoom = true;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-zoom]'); if (!a) return; e.preventDefault();
      var box = document.createElement('div'); box.className = 'zoom';
      box.innerHTML = '<img src="' + a.getAttribute('href') + '" alt=""><button type="button" aria-label="Close">×</button>';
      box.addEventListener('click', function () { box.remove(); });
      document.body.appendChild(box);
    });
  }
  function wireGallery() {
    var g = document.querySelector('[data-gallery]'); if (!g) return;
    var items = [].slice.call(g.querySelectorAll('a')).map(function (a) { return { src: a.href, cap: a.dataset.cap }; });
    var idx = 0, box;
    function show(i) { idx = (i + items.length) % items.length; box.querySelector('img').src = items[idx].src; box.querySelector('[data-cap]').textContent = items[idx].cap; }
    function open(i) {
      box = document.createElement('div'); box.className = 'lightbox';
      box.innerHTML = '<div class="lightbox__top"><span></span><button type="button" data-x aria-label="Close">✕</button></div>' +
        '<div class="lightbox__stage"><img alt=""><button type="button" class="lightbox__nav lightbox__nav--prev" data-p>‹</button><button type="button" class="lightbox__nav lightbox__nav--next" data-n>›</button></div>' +
        '<div class="lightbox__caption" data-cap></div>';
      document.body.appendChild(box); document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(function () { box.classList.add('open'); });
      show(i);
      box.querySelector('[data-x]').addEventListener('click', close);
      box.querySelector('[data-p]').addEventListener('click', function () { show(idx - 1); });
      box.querySelector('[data-n]').addEventListener('click', function () { show(idx + 1); });
      box.querySelector('.lightbox__stage').addEventListener('click', function (e) { if (e.target.classList.contains('lightbox__stage')) close(); });
      var sx = 0; var stage = box.querySelector('.lightbox__stage');
      stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); });
    }
    function close() { if (box) { box.remove(); box = null; _lbActive = null; document.documentElement.style.overflow = ''; } }
    g.addEventListener('click', function (e) { var a = e.target.closest('a'); if (!a) return; e.preventDefault(); open([].indexOf.call(g.querySelectorAll('a'), a)); _lbActive = { next: function () { show(idx + 1); }, prev: function () { show(idx - 1); }, close: close }; });
    if (!_galleryKey) {
      _galleryKey = true;
      document.addEventListener('keydown', function (e) { if (!_lbActive) return; if (e.key === 'Escape') _lbActive.close(); else if (e.key === 'ArrowRight') _lbActive.next(); else if (e.key === 'ArrowLeft') _lbActive.prev(); });
    }
  }
  function reveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { [].forEach.call(els, function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    [].forEach.call(els, function (el) { io.observe(el); });
  }
  function scrollTop() { window.scrollTo(0, 0); }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (!b) return;
    var done = function () { var old = b.innerHTML; b.textContent = 'Copied!'; setTimeout(function () { b.innerHTML = old; }, 1400); };
    if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, done); else done();
  });

  function parseParams(qs) { var o = {}; (qs || '').split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); o[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); }); return o; }
  function route() {
    var hash = location.hash.replace(/^#/, '') || '/';
    var parts = hash.split('?'); var path = parts[0]; var params = parseParams(parts[1]);
    [].forEach.call(document.querySelectorAll('.demo-seg button'), function (b) { b.classList.toggle('is-on', (path.indexOf('/admin') === 0) === (b.dataset.view === 'owner')); });

    if (path === '/' || path === '') return renderHome();
    if (path === '/book') return renderBook(params);
    if (path === '/lookup') return renderLookup();
    if (path.indexOf('/b/') === 0) return renderStatus(path.slice(3), params);
    if (path === '/admin') return renderToday();
    if (path === '/admin/bookings') return renderBookings(params);
    if (path === '/admin/calendar') return renderCalendar(params);
    if (path === '/admin/rates') return renderRates();
    if (path === '/admin/new') return renderNew();
    if (path === '/admin/more') return renderMore();
    if (path.indexOf('/admin/b/') === 0) return renderOwnerBooking(+path.slice(9));
    renderHome();
  }
  function notFound() { location.hash = '#/'; }

  window.addEventListener('hashchange', route);

  [].forEach.call(document.querySelectorAll('.demo-seg button'), function (b) {
    b.addEventListener('click', function () { location.hash = b.dataset.view === 'owner' ? '#/admin' : '#/'; });
  });
  document.getElementById('demo-reset').addEventListener('click', function () {
    if (!confirm('Reset the demo? This clears the sample bookings saved in your browser and starts fresh.')) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    state = fresh(); save(state); location.hash = '#/'; route();
  });

  (function () {
    var hint = document.getElementById('demo-hint');
    try { if (localStorage.getItem('rb-demo-hint')) return; } catch (e) {}
    hint.hidden = false;
    hint.innerHTML = '<span>' + svg('sparkle') + ' Try it: pick a date, book, then switch to <b>Owner app</b> to approve it.</span><button type="button" aria-label="Dismiss">×</button>';
    hint.querySelector('button').addEventListener('click', function () { hint.hidden = true; try { localStorage.setItem('rb-demo-hint', '1'); } catch (e) {} });
    setTimeout(function () { hint.hidden = true; }, 12000);
  })();

  route();
})();
