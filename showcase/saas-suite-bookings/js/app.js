/* =====================================================================
   Forge — Bookings
   Author: Chester Ewing Columna
   Vanilla CRUD reference for appointment management. localStorage.
   ===================================================================== */
(function () {
  'use strict';

  const STORAGE_KEY = 'forge.bookings.v1';
  const TOAST_DURATION = 3500;

  const STATUS_ORDER = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
  const STATUS_LABEL = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    'in-progress': 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  // ==========================================================
  // STATE
  // ==========================================================
  let state = {
    customers: [],
    services: [],
    bookings: [],
    settings: {
      theme: 'light',
      businessName: 'Forge Bookings',
      currency: '₱',
      openTime: '09:00',
      closeTime: '19:00'
    }
  };

  let ui = {
    view: 'calendar',
    calYear: 0,
    calMonth: 0,
    selectedDate: null,           // YYYY-MM-DD
    bookingFilters: { search: '', status: '', range: 'all' },
    customerSearch: '',
    editingBookingId: null,
    editingCustomerId: null,
    editingServiceId: null,
    pendingConfirm: null,
    cmdkOpen: false,
    cmdkQuery: '',
    cmdkSelectedIndex: 0,
    cmdkItems: []
  };

  // ==========================================================
  // PERSISTENCE
  // ==========================================================
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.customers = parsed.customers || [];
        state.services = parsed.services || [];
        state.bookings = parsed.bookings || [];
        if (parsed.settings) state.settings = Object.assign(state.settings, parsed.settings);
      }
    } catch (e) {
      console.warn('[Forge Bookings] Load error:', e);
    }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.error('[Forge Bookings] Save error:', e); }
  }

  // ==========================================================
  // SEED — generic service business (salon/spa flavor)
  // ==========================================================
  function maybeSeed() {
    if (state.customers.length || state.services.length || state.bookings.length) return;
    const now = new Date();

    const services = [
      { name: 'Haircut',           durationMinutes: 30, price: 250,  color: '#3b82f6', description: 'Classic cut & style.' },
      { name: 'Hair Color',        durationMinutes: 90, price: 1500, color: '#8b5cf6', description: 'Full hair coloring with conditioning.' },
      { name: 'Hair Treatment',    durationMinutes: 60, price: 800,  color: '#ec4899', description: 'Deep conditioning, scalp treatment.' },
      { name: 'Manicure',          durationMinutes: 30, price: 180,  color: '#10b981', description: 'Hand & nail care.' },
      { name: 'Pedicure',          durationMinutes: 45, price: 220,  color: '#10b981', description: 'Foot soak and nail care.' },
      { name: 'Facial',            durationMinutes: 45, price: 650,  color: '#06b6d4', description: 'Cleansing, exfoliation, mask.' },
      { name: 'Massage — 60 min',  durationMinutes: 60, price: 800,  color: '#f59e0b', description: 'Relaxation Swedish massage.' },
      { name: 'Massage — 90 min',  durationMinutes: 90, price: 1100, color: '#f59e0b', description: 'Extended therapeutic session.' }
    ];
    state.services = services.map((s, i) => ({
      id: uid(),
      ...s,
      createdAt: new Date(now.getTime() - (services.length - i) * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - (services.length - i) * 86400000).toISOString()
    }));

    const customers = [
      { name: 'Maria Santos',    phone: '+63 917 123 4567', email: 'maria.santos@example.com', address: 'Quezon City',  notes: 'Prefers afternoon slots' },
      { name: 'Juan Dela Cruz',  phone: '+63 918 234 5678', email: 'juan.delacruz@example.com', address: 'Makati',       notes: '' },
      { name: 'Sofia Reyes',     phone: '+63 919 345 6789', email: 'sofia.r@example.com',       address: 'Pasig',        notes: 'Allergic to certain dyes' },
      { name: 'Miguel Ramos',    phone: '+63 920 456 7890', email: 'miguel.ramos@example.com',  address: 'Mandaluyong',  notes: '' },
      { name: 'Andrea Cruz',     phone: '+63 921 567 8901', email: 'andrea.c@example.com',      address: 'Taguig',       notes: 'VIP — long-time client' },
      { name: 'Luis Mendoza',    phone: '+63 922 678 9012', email: 'luis.m@example.com',        address: 'Marikina',     notes: '' },
      { name: 'Patricia Aquino', phone: '+63 923 789 0123', email: 'patricia.a@example.com',    address: 'San Juan',     notes: '' },
      { name: 'Carlos Bautista', phone: '+63 924 890 1234', email: 'carlos.b@example.com',      address: 'Parañaque',    notes: 'Walk-in regular' },
      { name: 'Carmela Garcia',  phone: '+63 925 901 2345', email: 'carmela.g@example.com',     address: 'Pasay',        notes: '' },
      { name: 'Diego Tan',       phone: '+63 926 012 3456', email: 'diego.t@example.com',       address: 'Las Piñas',    notes: 'New client' }
    ];
    state.customers = customers.map((c, i) => ({
      id: uid(),
      ...c,
      createdAt: new Date(now.getTime() - (customers.length - i) * 86400000 * 3).toISOString(),
      updatedAt: new Date(now.getTime() - (customers.length - i) * 86400000 * 3).toISOString()
    }));

    // Generate bookings: spread from -7 to +14 days, mix of statuses
    const bookings = [];
    function addBk(offsetDays, hour, minute, customerIdx, serviceIdx, status, notes) {
      const d = new Date(now);
      d.setDate(d.getDate() + offsetDays);
      d.setHours(0, 0, 0, 0);
      bookings.push({
        id: uid(),
        customerId: state.customers[customerIdx].id,
        serviceId: state.services[serviceIdx].id,
        date: isoDate(d),
        time: pad(hour) + ':' + pad(minute),
        status,
        notes: notes || '',
        createdAt: new Date(now.getTime() - Math.random() * 86400000 * 14).toISOString(),
        updatedAt: new Date(now.getTime() - Math.random() * 86400000 * 7).toISOString()
      });
    }

    // Past (completed mostly)
    addBk(-7,  9, 0,  0, 0, 'completed', 'Regular haircut');
    addBk(-7, 14, 0,  2, 1, 'completed', 'Touch-up roots');
    addBk(-6, 10, 30, 4, 5, 'completed', '');
    addBk(-5, 13, 0,  1, 6, 'completed', 'Stress relief session');
    addBk(-4, 16, 0,  7, 3, 'completed', '');
    addBk(-3, 11, 0,  5, 0, 'cancelled', 'Customer cancelled — sick');
    addBk(-2, 15, 0,  3, 2, 'completed', '');
    addBk(-1,  9, 30, 8, 4, 'completed', '');
    addBk(-1, 14, 0,  6, 5, 'completed', '');

    // Today (mix)
    addBk(0,  9, 0,  0, 0, 'completed',   'Morning client');
    addBk(0, 11, 0,  2, 1, 'in-progress', 'Currently in session');
    addBk(0, 13, 30, 4, 6, 'confirmed',   'VIP — block 90min slot');
    addBk(0, 15, 0,  9, 0, 'pending',     'New client booking via phone');
    addBk(0, 17, 0,  3, 3, 'confirmed',   '');

    // Tomorrow + this week
    addBk(1,  9, 30, 1, 4, 'confirmed', '');
    addBk(1, 11, 0,  6, 5, 'confirmed', '');
    addBk(1, 14, 0,  8, 2, 'confirmed', 'Bringing daughter for treatment');
    addBk(1, 16, 30, 5, 0, 'pending',   'Walk-in inquiry');
    addBk(2, 10, 0,  7, 1, 'confirmed', '');
    addBk(2, 14, 0,  9, 7, 'confirmed', '90-min massage');
    addBk(3, 11, 0,  0, 5, 'confirmed', '');
    addBk(3, 15, 0,  4, 3, 'pending',   '');
    addBk(4,  9, 30, 2, 0, 'confirmed', '');
    addBk(5, 13, 0,  6, 2, 'pending',   'Color consultation first');
    addBk(7, 10, 0,  3, 1, 'confirmed', 'Wedding prep');
    addBk(9, 14, 0,  5, 6, 'confirmed', '');
    addBk(12, 11, 0, 8, 7, 'confirmed', '');
    addBk(14,  9, 30, 1, 3, 'pending',  '');

    state.bookings = bookings.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    saveState();
  }

  // ==========================================================
  // UTILITIES
  // ==========================================================
  function uid() { return 'b_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function isoDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function todayISO() { return isoDate(new Date()); }
  function parseISO(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function fmtCurrency(n) {
    return state.settings.currency + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtNumber(n) { return Number(n || 0).toLocaleString('en-PH'); }
  function fmtDateLong(iso) {
    if (!iso) return '';
    return parseISO(iso).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  function fmtDateShort(iso) {
    if (!iso) return '';
    return parseISO(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  }
  function fmtTime(hhmm) {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = ((h + 11) % 12) + 1;
    return hh + ':' + pad(m) + ' ' + ampm;
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function debounce(fn, ms) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
  }
  function downloadFile(name, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  function initials(name) {
    return String(name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }
  function $(sel, parent) { return (parent || document).querySelector(sel); }
  function $$(sel, parent) { return Array.from((parent || document).querySelectorAll(sel)); }

  // ==========================================================
  // ICONS
  // ==========================================================
  const ICONS = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    service: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/><path d="m9 12 2 2 4-4"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>'
  };

  // ==========================================================
  // TOAST
  // ==========================================================
  function toast(title, message, type) {
    type = type || 'info';
    const container = $('#toasts');
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    const iconMap = { success: 'check', warning: 'warning', danger: 'alert', info: 'info' };
    el.innerHTML = `
      <div class="toast-icon">${ICONS[iconMap[type] || 'info']}</div>
      <div class="toast-body">
        <div class="toast-title">${escapeHtml(title)}</div>
        ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
      </div>
      <button class="toast-dismiss" aria-label="Dismiss">${ICONS.x}</button>
    `;
    container.appendChild(el);
    const remove = () => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 250); };
    $('.toast-dismiss', el).addEventListener('click', remove);
    setTimeout(remove, TOAST_DURATION);
  }

  // ==========================================================
  // MODALS / DRAWER
  // ==========================================================
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    setTimeout(() => {
      const f = m.querySelector('input:not([type="hidden"]), select, textarea, button');
      if (f) f.focus();
    }, 50);
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.hidden = true;
  }
  function openDrawer(id) {
    const d = document.getElementById(id);
    if (d) d.hidden = false;
  }
  function closeDrawer(id) {
    const d = document.getElementById(id);
    if (d) d.hidden = true;
  }
  function confirmAction(title, message, onOk, okLabel, okStyle) {
    $('#confirm-title').textContent = title;
    $('#confirm-message').textContent = message;
    const okBtn = $('#confirm-ok');
    okBtn.textContent = okLabel || 'Confirm';
    okBtn.className = 'btn ' + (okStyle || 'btn-danger');
    ui.pendingConfirm = onOk;
    openModal('confirm-modal');
  }

  // ==========================================================
  // THEME
  // ==========================================================
  function applyTheme(theme) {
    let resolved = theme;
    if (theme === 'auto') {
      resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
    state.settings.theme = theme;
    saveState();
    $$('input[name="theme"]').forEach((r) => (r.checked = r.value === theme));
  }
  function toggleTheme() {
    applyTheme(state.settings.theme === 'dark' ? 'light' : 'dark');
  }

  // ==========================================================
  // VIEW ROUTING
  // ==========================================================
  function switchView(view) {
    ui.view = view;
    $$('.view').forEach((v) => {
      const match = v.dataset.view === view;
      v.hidden = !match;
      v.classList.toggle('is-active', match);
    });
    $$('.nav-item').forEach((n) => n.classList.toggle('is-active', n.dataset.view === view));
    $$('.bottom-nav-item[data-view]').forEach((n) => n.classList.toggle('is-active', n.dataset.view === view));
    $('#sidebar').classList.remove('is-open');
    $('#sidebar-backdrop').classList.remove('is-visible');

    if (view === 'calendar') renderCalendar();
    else if (view === 'bookings') renderBookingsList();
    else if (view === 'customers') renderCustomers();
    else if (view === 'services') renderServices();
    else if (view === 'dashboard') renderDashboard();
    else if (view === 'settings') renderSettings();
  }

  // ==========================================================
  // ENTITY LOOKUPS
  // ==========================================================
  function getCustomer(id) { return state.customers.find((c) => c.id === id); }
  function getService(id)  { return state.services.find((s) => s.id === id); }
  function getBooking(id)  { return state.bookings.find((b) => b.id === id); }

  // ==========================================================
  // BOOKING CRUD
  // ==========================================================
  function saveBooking(data) {
    const now = new Date().toISOString();
    if (ui.editingBookingId) {
      const b = getBooking(ui.editingBookingId);
      if (!b) return null;
      Object.assign(b, data, { updatedAt: now });
      saveState();
      return b;
    } else {
      const b = { id: uid(), ...data, createdAt: now, updatedAt: now };
      state.bookings.push(b);
      saveState();
      return b;
    }
  }
  function deleteBooking(id) {
    state.bookings = state.bookings.filter((b) => b.id !== id);
    saveState();
  }
  function updateBookingStatus(id, status) {
    const b = getBooking(id);
    if (!b) return;
    b.status = status;
    b.updatedAt = new Date().toISOString();
    saveState();
  }

  // ==========================================================
  // CALENDAR
  // ==========================================================
  function renderCalendar() {
    const year = ui.calYear;
    const month = ui.calMonth;
    const monthName = new Date(year, month, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    $('#cal-title').textContent = monthName;

    // Build matrix starting from Sunday
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build 42-cell grid (6 weeks)
    const cells = [];
    const start = new Date(year, month, 1 - startWeekday);
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push(d);
    }

    const today = todayISO();
    const bookingsByDate = {};
    state.bookings.forEach((b) => {
      if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
      bookingsByDate[b.date].push(b);
    });
    Object.values(bookingsByDate).forEach((arr) => arr.sort((a, b) => a.time.localeCompare(b.time)));

    let html = `
      <div class="cal-weekdays">
        <div class="cal-weekday">Sun</div>
        <div class="cal-weekday">Mon</div>
        <div class="cal-weekday">Tue</div>
        <div class="cal-weekday">Wed</div>
        <div class="cal-weekday">Thu</div>
        <div class="cal-weekday">Fri</div>
        <div class="cal-weekday">Sat</div>
      </div>
      <div class="cal-grid">
    `;

    cells.forEach((d) => {
      const iso = isoDate(d);
      const isOther = d.getMonth() !== month;
      const isToday = iso === today;
      const dayBookings = bookingsByDate[iso] || [];
      const visible = dayBookings.slice(0, 3);
      const more = dayBookings.length - visible.length;

      let bookingsHtml = visible.map((b) => {
        const cust = getCustomer(b.customerId);
        return `<div class="cal-booking is-${b.status}">${fmtTime(b.time)} · ${escapeHtml(cust ? cust.name.split(/\s+/)[0] : '—')}</div>`;
      }).join('');
      if (more > 0) bookingsHtml += `<div class="cal-more">+${more} more</div>`;

      html += `
        <div class="cal-cell ${isOther ? 'is-other-month' : ''} ${isToday ? 'is-today' : ''}" data-date="${iso}">
          <span class="cal-day-num">${d.getDate()}</span>
          <div class="cal-bookings">${bookingsHtml}</div>
        </div>
      `;
    });
    html += '</div>';
    $('#calendar').innerHTML = html;

    // Bind cell clicks
    $$('.cal-cell').forEach((cell) => {
      cell.addEventListener('click', () => openDayDrawer(cell.dataset.date));
    });
  }

  function openDayDrawer(iso) {
    ui.selectedDate = iso;
    const dayBookings = state.bookings
      .filter((b) => b.date === iso)
      .sort((a, b) => a.time.localeCompare(b.time));
    const isoFmt = fmtDateLong(iso);
    $('#day-drawer-title').textContent = isoFmt;
    $('#day-drawer-sub').textContent = `${dayBookings.length} booking${dayBookings.length === 1 ? '' : 's'}`;

    if (dayBookings.length === 0) {
      $('#day-drawer-body').innerHTML = `
        <div style="padding:48px 24px;text-align:center;color:var(--color-text-muted);font-size:13px;">
          ${ICONS.cal}
          <p style="margin-top:12px;">No bookings on this day.</p>
        </div>
      `;
    } else {
      $('#day-drawer-body').innerHTML = dayBookings.map(renderBookingItem).join('');
      bindBookingItemEvents($('#day-drawer-body'));
    }

    openDrawer('day-drawer');
  }

  // ==========================================================
  // BOOKING ITEM (used in calendar drawer, bookings list, dashboard)
  // ==========================================================
  function renderBookingItem(b) {
    const cust = getCustomer(b.customerId);
    const svc = getService(b.serviceId);
    const color = svc ? svc.color : '#10b981';
    const statusChip = `<span class="status-chip is-${b.status}">${STATUS_LABEL[b.status]}</span>`;
    const quickStatus = `
      <div class="status-quick">
        <button class="status-quick-btn ${b.status === 'pending' ? 'is-active' : ''}" data-action="status" data-status="pending" title="Pending">${ICONS.clock}</button>
        <button class="status-quick-btn ${b.status === 'confirmed' ? 'is-active' : ''}" data-action="status" data-status="confirmed" title="Confirmed">${ICONS.check}</button>
        <button class="status-quick-btn ${b.status === 'in-progress' ? 'is-active' : ''}" data-action="status" data-status="in-progress" title="In progress">${ICONS.play}</button>
        <button class="status-quick-btn ${b.status === 'completed' ? 'is-active' : ''}" data-action="status" data-status="completed" title="Completed">${ICONS.check}</button>
      </div>
    `;
    return `
      <div class="bk-item" data-booking-id="${b.id}">
        <div class="bk-time">${fmtTime(b.time)}</div>
        <div class="bk-bar" style="background:${color}"></div>
        <div class="bk-body">
          <div class="bk-customer">${escapeHtml(cust ? cust.name : '(deleted customer)')}</div>
          <div class="bk-service">${escapeHtml(svc ? svc.name : '(deleted service)')}${svc ? ` · ${svc.durationMinutes} min · ${fmtCurrency(svc.price)}` : ''}</div>
          ${b.notes ? `<div class="bk-notes">"${escapeHtml(b.notes)}"</div>` : ''}
          <div class="bk-meta">${statusChip}${quickStatus}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <button class="row-action-btn primary" data-action="edit" title="Edit">${ICONS.edit}</button>
          <button class="row-action-btn danger" data-action="delete" title="Delete">${ICONS.trash}</button>
        </div>
      </div>
    `;
  }
  function bindBookingItemEvents(scope) {
    $$('[data-booking-id]', scope).forEach((row) => {
      const id = row.dataset.bookingId;
      $$('button[data-action]', row).forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          if (action === 'edit') openBookingForm(id);
          else if (action === 'delete') {
            const b = getBooking(id);
            const c = getCustomer(b.customerId);
            confirmAction('Delete booking?', `Booking for ${c ? c.name : '(unknown)'} on ${fmtDateShort(b.date)} at ${fmtTime(b.time)} will be removed.`, () => {
              deleteBooking(id);
              renderAll();
              toast('Booking deleted', '', 'success');
              if (!$('#day-drawer').hidden) openDayDrawer(ui.selectedDate);
            }, 'Delete', 'btn-danger');
          }
          else if (action === 'status') {
            updateBookingStatus(id, btn.dataset.status);
            renderAll();
            toast('Status updated', STATUS_LABEL[btn.dataset.status], 'success');
            if (!$('#day-drawer').hidden) openDayDrawer(ui.selectedDate);
          }
        });
      });
      // Clicking the row body (not buttons) also edits
      row.addEventListener('click', () => openBookingForm(id));
    });
  }

  // ==========================================================
  // BOOKING FORM
  // ==========================================================
  function openBookingForm(id) {
    ui.editingBookingId = id || null;
    const isEdit = !!id;
    $('#booking-modal-title').textContent = isEdit ? 'Edit booking' : 'New booking';
    $('#booking-submit').textContent = isEdit ? 'Save changes' : 'Create booking';
    $('#booking-delete-btn').hidden = !isEdit;

    // Populate customers datalist
    const dl = $('#customer-list');
    dl.innerHTML = state.customers.map((c) => `<option value="${escapeHtml(c.name)}">`).join('');

    // Populate services
    const svcSel = $('#bk-service');
    svcSel.innerHTML = '<option value="">Select a service…</option>' +
      state.services.map((s) => `<option value="${s.id}">${escapeHtml(s.name)} · ${s.durationMinutes}min · ${fmtCurrency(s.price)}</option>`).join('');

    const form = $('#booking-form');
    form.reset();
    $('#bk-customer-hint').textContent = '';

    if (isEdit) {
      const b = getBooking(id);
      const c = getCustomer(b.customerId);
      $('#bk-customer').value = c ? c.name : '';
      $('#bk-service').value = b.serviceId;
      $('#bk-date').value = b.date;
      $('#bk-time').value = b.time;
      $('#bk-status').value = b.status;
      $('#bk-notes').value = b.notes || '';
    } else {
      $('#bk-date').value = ui.selectedDate || todayISO();
      $('#bk-time').value = '10:00';
      $('#bk-status').value = 'pending';
    }
    openModal('booking-modal');
  }
  function submitBookingForm(e) {
    e.preventDefault();
    const customerName = $('#bk-customer').value.trim();
    const serviceId = $('#bk-service').value;
    const date = $('#bk-date').value;
    const time = $('#bk-time').value;
    const status = $('#bk-status').value;
    const notes = $('#bk-notes').value;

    if (!customerName || !serviceId || !date || !time) {
      toast('Missing fields', 'Customer, service, date and time are required.', 'warning');
      return;
    }

    // Find or create customer
    let cust = state.customers.find((c) => c.name.toLowerCase() === customerName.toLowerCase());
    if (!cust) {
      cust = {
        id: uid(),
        name: customerName,
        phone: '', email: '', address: '', notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.customers.push(cust);
      toast('Customer added', `New: ${cust.name}`, 'info', 2500);
    }

    const data = { customerId: cust.id, serviceId, date, time, status, notes };
    const b = saveBooking(data);
    closeModal('booking-modal');
    renderAll();
    if (!$('#day-drawer').hidden) openDayDrawer(date);
    toast(ui.editingBookingId ? 'Booking updated' : 'Booking created', `${cust.name} · ${fmtDateShort(date)} ${fmtTime(time)}`, 'success');
  }

  // ==========================================================
  // BOOKINGS LIST VIEW
  // ==========================================================
  function getFilteredBookings() {
    const { search, status, range } = ui.bookingFilters;
    const q = (search || '').toLowerCase().trim();
    const today = todayISO();
    return state.bookings.filter((b) => {
      if (status && b.status !== status) return false;
      if (range === 'today' && b.date !== today) return false;
      if (range === 'upcoming' && b.date < today) return false;
      if (range === 'past' && b.date >= today) return false;
      if (range === 'this-week') {
        const d = parseISO(b.date);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const start = new Date(now); start.setDate(now.getDate() - now.getDay());
        const end = new Date(start); end.setDate(start.getDate() + 7);
        if (d < start || d >= end) return false;
      }
      if (q) {
        const c = getCustomer(b.customerId);
        const s = getService(b.serviceId);
        const hay = `${c ? c.name : ''} ${c ? c.phone : ''} ${s ? s.name : ''} ${b.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }
  function renderBookingsList() {
    const container = $('#bookings-list');
    const list = getFilteredBookings();
    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="border:none;background:transparent;">
          <div class="empty-icon">${ICONS.cal}</div>
          <div class="empty-title">No bookings match</div>
          <div class="empty-text">Try clearing filters or add a new booking.</div>
        </div>
      `;
      return;
    }
    // Group by date
    const groups = {};
    list.forEach((b) => { (groups[b.date] = groups[b.date] || []).push(b); });
    const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    let html = '<div class="bookings-list-table">';
    dates.forEach((iso) => {
      html += `<div style="padding:10px 20px;background:var(--color-bg-soft);font-size:11px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em;">${fmtDateLong(iso)}</div>`;
      groups[iso].forEach((b) => { html += renderBookingItem(b); });
    });
    html += '</div>';
    container.innerHTML = html;
    bindBookingItemEvents(container);
  }

  // ==========================================================
  // CUSTOMERS VIEW
  // ==========================================================
  function renderCustomers() {
    const container = $('#customers-container');
    const q = (ui.customerSearch || '').toLowerCase().trim();
    const list = state.customers.filter((c) => {
      if (!q) return true;
      const hay = `${c.name} ${c.phone} ${c.email} ${c.address} ${c.notes}`.toLowerCase();
      return hay.includes(q);
    }).sort((a, b) => a.name.localeCompare(b.name));

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.users}</div>
          <div class="empty-title">${q ? 'No customers match' : 'No customers yet'}</div>
          <div class="empty-text">${q ? 'Try a different search.' : 'Add customers manually or create a booking — new names are auto-added.'}</div>
          ${!q ? '<button class="btn btn-primary" id="empty-add-customer">Add customer</button>' : ''}
        </div>
      `;
      const ec = $('#empty-add-customer');
      if (ec) ec.addEventListener('click', () => openCustomerForm());
      return;
    }
    let html = '<div class="cards-grid">';
    list.forEach((c) => {
      const bookingCount = state.bookings.filter((b) => b.customerId === c.id).length;
      html += `
        <div class="entity-card" data-customer-id="${c.id}">
          <div class="entity-card-head">
            <div class="entity-avatar">${initials(c.name)}</div>
            <div style="flex:1;min-width:0;">
              <div class="entity-name">${escapeHtml(c.name)}</div>
              <div class="entity-sub">${bookingCount} booking${bookingCount === 1 ? '' : 's'}</div>
            </div>
          </div>
          <div class="entity-meta">
            ${c.phone ? `<div>📞 ${escapeHtml(c.phone)}</div>` : ''}
            ${c.email ? `<div>✉️ ${escapeHtml(c.email)}</div>` : ''}
            ${c.address ? `<div>📍 ${escapeHtml(c.address)}</div>` : ''}
            ${c.notes ? `<div class="muted" style="font-style:italic;">"${escapeHtml(c.notes)}"</div>` : ''}
          </div>
          <div class="entity-actions">
            <button class="row-action-btn primary" data-action="book" title="New booking">${ICONS.plus}</button>
            <button class="row-action-btn" data-action="edit" title="Edit">${ICONS.edit}</button>
            <button class="row-action-btn danger" data-action="delete" title="Delete">${ICONS.trash}</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;

    $$('[data-customer-id]').forEach((card) => {
      const id = card.dataset.customerId;
      $$('button[data-action]', card).forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          if (action === 'edit') openCustomerForm(id);
          else if (action === 'book') {
            ui.editingBookingId = null;
            openBookingForm();
            setTimeout(() => { $('#bk-customer').value = getCustomer(id).name; }, 60);
          }
          else if (action === 'delete') {
            const c = getCustomer(id);
            const hasBookings = state.bookings.some((b) => b.customerId === id);
            confirmAction('Delete customer?', `${c.name} will be removed.${hasBookings ? ' Existing bookings will still show "(deleted customer)".' : ''}`, () => {
              state.customers = state.customers.filter((x) => x.id !== id);
              saveState(); renderAll();
              toast('Customer deleted', c.name, 'success');
            }, 'Delete', 'btn-danger');
          }
        });
      });
    });
  }
  function openCustomerForm(id) {
    ui.editingCustomerId = id || null;
    const isEdit = !!id;
    $('#customer-modal-title').textContent = isEdit ? 'Edit customer' : 'Add customer';
    $('#customer-submit').textContent = isEdit ? 'Save changes' : 'Save customer';
    $('#customer-form').reset();
    if (isEdit) {
      const c = getCustomer(id);
      $('#cust-name').value = c.name;
      $('#cust-phone').value = c.phone || '';
      $('#cust-email').value = c.email || '';
      $('#cust-address').value = c.address || '';
      $('#cust-notes').value = c.notes || '';
    }
    openModal('customer-modal');
  }
  function submitCustomerForm(e) {
    e.preventDefault();
    const name = $('#cust-name').value.trim();
    if (!name) { toast('Missing fields', 'Name is required.', 'warning'); return; }
    const data = {
      name,
      phone: $('#cust-phone').value.trim(),
      email: $('#cust-email').value.trim(),
      address: $('#cust-address').value.trim(),
      notes: $('#cust-notes').value.trim()
    };
    if (ui.editingCustomerId) {
      const c = getCustomer(ui.editingCustomerId);
      Object.assign(c, data, { updatedAt: new Date().toISOString() });
      toast('Customer updated', c.name, 'success');
    } else {
      const c = { id: uid(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      state.customers.push(c);
      toast('Customer added', c.name, 'success');
    }
    saveState();
    closeModal('customer-modal');
    renderAll();
  }

  // ==========================================================
  // SERVICES VIEW
  // ==========================================================
  function renderServices() {
    const container = $('#services-container');
    if (state.services.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.service}</div>
          <div class="empty-title">No services yet</div>
          <div class="empty-text">Add the services you offer — each can have a name, duration, price, and color tag.</div>
          <button class="btn btn-primary" id="empty-add-service">Add your first service</button>
        </div>
      `;
      $('#empty-add-service').addEventListener('click', () => openServiceForm());
      return;
    }
    let html = '<div class="cards-grid">';
    state.services.forEach((s) => {
      const bookingCount = state.bookings.filter((b) => b.serviceId === s.id).length;
      html += `
        <div class="entity-card" data-service-id="${s.id}">
          <div class="entity-card-head">
            <div class="entity-avatar is-color" style="background:${s.color};color:white;">${initials(s.name)}</div>
            <div style="flex:1;min-width:0;">
              <div class="entity-name">${escapeHtml(s.name)}</div>
              <div class="entity-sub">${bookingCount} booking${bookingCount === 1 ? '' : 's'}</div>
            </div>
          </div>
          <div class="entity-meta">
            <div>⏱️ ${s.durationMinutes} minutes</div>
            <div>💰 ${fmtCurrency(s.price)}</div>
            ${s.description ? `<div class="muted" style="font-style:italic;">"${escapeHtml(s.description)}"</div>` : ''}
          </div>
          <div class="entity-actions">
            <button class="row-action-btn" data-action="edit" title="Edit">${ICONS.edit}</button>
            <button class="row-action-btn danger" data-action="delete" title="Delete">${ICONS.trash}</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
    $$('[data-service-id]').forEach((card) => {
      const id = card.dataset.serviceId;
      $$('button[data-action]', card).forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          if (action === 'edit') openServiceForm(id);
          else if (action === 'delete') {
            const s = getService(id);
            const hasBookings = state.bookings.some((b) => b.serviceId === id);
            confirmAction('Delete service?', `${s.name} will be removed.${hasBookings ? ' Existing bookings will show "(deleted service)".' : ''}`, () => {
              state.services = state.services.filter((x) => x.id !== id);
              saveState(); renderAll();
              toast('Service deleted', s.name, 'success');
            }, 'Delete', 'btn-danger');
          }
        });
      });
    });
  }
  let selectedColor = '#10b981';
  function openServiceForm(id) {
    ui.editingServiceId = id || null;
    const isEdit = !!id;
    $('#service-modal-title').textContent = isEdit ? 'Edit service' : 'Add service';
    $('#service-submit').textContent = isEdit ? 'Save changes' : 'Save service';
    $('#service-form').reset();
    selectedColor = '#10b981';
    if (isEdit) {
      const s = getService(id);
      $('#sv-name').value = s.name;
      $('#sv-duration').value = s.durationMinutes;
      $('#sv-price').value = s.price;
      $('#sv-desc').value = s.description || '';
      selectedColor = s.color;
    }
    $$('.color-swatch').forEach((b) => b.classList.toggle('is-active', b.dataset.color === selectedColor));
    openModal('service-modal');
  }
  function submitServiceForm(e) {
    e.preventDefault();
    const name = $('#sv-name').value.trim();
    const duration = parseInt($('#sv-duration').value, 10);
    const price = parseFloat($('#sv-price').value);
    if (!name || !duration || isNaN(price)) {
      toast('Missing fields', 'Name, duration, and price are required.', 'warning');
      return;
    }
    const data = {
      name,
      durationMinutes: duration,
      price,
      description: $('#sv-desc').value.trim(),
      color: selectedColor
    };
    if (ui.editingServiceId) {
      const s = getService(ui.editingServiceId);
      Object.assign(s, data, { updatedAt: new Date().toISOString() });
      toast('Service updated', s.name, 'success');
    } else {
      const s = { id: uid(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      state.services.push(s);
      toast('Service added', s.name, 'success');
    }
    saveState();
    closeModal('service-modal');
    renderAll();
  }

  // ==========================================================
  // DASHBOARD VIEW
  // ==========================================================
  function renderDashboard() {
    const today = todayISO();
    const todayBookings = state.bookings.filter((b) => b.date === today).sort((a, b) => a.time.localeCompare(b.time));
    const upcomingWeek = state.bookings.filter((b) => {
      if (b.date <= today) return false;
      const d = parseISO(b.date);
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setDate(now.getDate() + 7);
      return d < end;
    }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    const pendingCount = state.bookings.filter((b) => b.status === 'pending').length;
    const todayRevenue = todayBookings
      .filter((b) => b.status === 'completed')
      .reduce((s, b) => { const sv = getService(b.serviceId); return s + (sv ? sv.price : 0); }, 0);

    $('#dashboard-stats').innerHTML = `
      <article class="stat-card">
        <div class="stat-icon stat-icon--primary">${ICONS.cal}</div>
        <div class="stat-body">
          <div class="stat-label">Today</div>
          <div class="stat-value">${todayBookings.length}</div>
          <div class="stat-trend">${todayBookings.filter((b) => b.status !== 'cancelled').length} active</div>
        </div>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon--success">${ICONS.cash}</div>
        <div class="stat-body">
          <div class="stat-label">Today's revenue</div>
          <div class="stat-value">${fmtCurrency(todayRevenue)}</div>
          <div class="stat-trend">From completed bookings</div>
        </div>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon--warning">${ICONS.clock}</div>
        <div class="stat-body">
          <div class="stat-label">Pending confirmations</div>
          <div class="stat-value">${pendingCount}</div>
          <div class="stat-trend">${pendingCount > 0 ? 'Awaiting your follow-up' : 'All clear'}</div>
        </div>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon--blue">${ICONS.users}</div>
        <div class="stat-body">
          <div class="stat-label">Customers</div>
          <div class="stat-value">${state.customers.length}</div>
          <div class="stat-trend">${state.services.length} services offered</div>
        </div>
      </article>
    `;

    const todayEl = $('#today-list');
    if (todayBookings.length === 0) {
      todayEl.innerHTML = `<div style="padding:32px;text-align:center;color:var(--color-text-muted);font-size:13px;">No bookings today 🎉</div>`;
    } else {
      todayEl.innerHTML = todayBookings.map(renderBookingItem).join('');
      bindBookingItemEvents(todayEl);
    }

    const upEl = $('#upcoming-list');
    if (upcomingWeek.length === 0) {
      upEl.innerHTML = `<div style="padding:32px;text-align:center;color:var(--color-text-muted);font-size:13px;">No upcoming bookings this week.</div>`;
    } else {
      upEl.innerHTML = upcomingWeek.slice(0, 5).map((b) => {
        const cust = getCustomer(b.customerId);
        const svc = getService(b.serviceId);
        const color = svc ? svc.color : '#10b981';
        return `
          <div class="bk-item" data-booking-id="${b.id}">
            <div class="bk-time">${fmtDateShort(b.date)}<br><span style="font-weight:400;color:var(--color-text-muted);">${fmtTime(b.time)}</span></div>
            <div class="bk-bar" style="background:${color}"></div>
            <div class="bk-body">
              <div class="bk-customer">${escapeHtml(cust ? cust.name : '—')}</div>
              <div class="bk-service">${escapeHtml(svc ? svc.name : '—')}</div>
              <div class="bk-meta"><span class="status-chip is-${b.status}">${STATUS_LABEL[b.status]}</span></div>
            </div>
          </div>
        `;
      }).join('');
      $$('[data-booking-id]', upEl).forEach((row) => {
        row.addEventListener('click', () => openBookingForm(row.dataset.bookingId));
      });
    }
  }

  // ==========================================================
  // SETTINGS VIEW
  // ==========================================================
  function renderSettings() {
    $('#setting-biz-name').value = state.settings.businessName || 'Forge Bookings';
    $('#setting-currency').value = state.settings.currency || '₱';
    $('#setting-open').value = state.settings.openTime || '09:00';
    $('#setting-close').value = state.settings.closeTime || '19:00';
    $$('input[name="theme"]').forEach((r) => (r.checked = r.value === state.settings.theme));
  }
  function saveSettings() {
    state.settings.businessName = $('#setting-biz-name').value.trim() || 'Forge Bookings';
    state.settings.currency = $('#setting-currency').value.trim() || '₱';
    state.settings.openTime = $('#setting-open').value || '09:00';
    state.settings.closeTime = $('#setting-close').value || '19:00';
    saveState();
    document.title = state.settings.businessName;
    toast('Settings saved', 'Workspace updated.', 'success');
    renderAll();
  }

  // ==========================================================
  // CSV / JSON
  // ==========================================================
  function csvCell(v) {
    const s = String(v == null ? '' : v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function exportBookings() {
    const headers = ['Date', 'Time', 'Customer', 'Service', 'Duration', 'Price', 'Status', 'Notes'];
    const rows = state.bookings.map((b) => {
      const c = getCustomer(b.customerId);
      const s = getService(b.serviceId);
      return [b.date, b.time, c ? c.name : '', s ? s.name : '', s ? s.durationMinutes : '', s ? s.price : '', STATUS_LABEL[b.status], b.notes];
    });
    const csv = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    downloadFile(`forge-bookings-${todayISO()}.csv`, csv, 'text/csv;charset=utf-8');
    toast('Exported', `${state.bookings.length} bookings exported`, 'success');
  }
  function exportAllJSON() {
    downloadFile(`forge-bookings-backup-${todayISO()}.json`, JSON.stringify(state, null, 2), 'application/json');
    toast('Backup exported', 'Full workspace as JSON.', 'success');
  }
  function importAllJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(String(e.target.result || ''));
        if (!parsed || !Array.isArray(parsed.bookings)) {
          toast('Invalid backup', 'JSON must have bookings[] array.', 'danger');
          return;
        }
        confirmAction('Replace all data?', 'This overwrites current bookings, customers, and services.', () => {
          state.customers = parsed.customers || [];
          state.services = parsed.services || [];
          state.bookings = parsed.bookings || [];
          if (parsed.settings) state.settings = Object.assign(state.settings, parsed.settings);
          saveState();
          applyTheme(state.settings.theme);
          renderAll();
          toast('Restored', 'Backup applied.', 'success');
        }, 'Replace', 'btn-danger');
      } catch (err) {
        toast('Import failed', err.message, 'danger');
      }
    };
    reader.readAsText(file);
  }
  function wipeAll() {
    confirmAction('Wipe everything?', 'All bookings, customers, and services will be deleted.', () => {
      state.customers = []; state.services = []; state.bookings = [];
      saveState(); renderAll();
      toast('Wiped', 'All data cleared.', 'success');
    }, 'Wipe', 'btn-danger');
  }
  function resetDemo() {
    confirmAction('Reset to demo data?', 'Wipes current data and re-seeds the salon demo.', () => {
      state.customers = []; state.services = []; state.bookings = [];
      saveState(); maybeSeed(); renderAll();
      toast('Demo reset', 'Sample data restored.', 'success');
    }, 'Reset', 'btn-secondary');
  }

  // ==========================================================
  // CMD+K
  // ==========================================================
  function openCmdK() {
    ui.cmdkOpen = true;
    $('#cmdk-overlay').hidden = false;
    $('#cmdk-input').value = '';
    ui.cmdkQuery = ''; ui.cmdkSelectedIndex = 0;
    renderCmdK();
    setTimeout(() => $('#cmdk-input').focus(), 30);
  }
  function closeCmdK() {
    ui.cmdkOpen = false;
    $('#cmdk-overlay').hidden = true;
  }
  function getCmdKItems(query) {
    const q = (query || '').toLowerCase().trim();
    const actions = [
      { icon: ICONS.plus,    title: 'New booking',           meta: 'Add appointment',       run: () => openBookingForm(),  keywords: 'new add booking appointment' },
      { icon: ICONS.users,   title: 'Add customer',          meta: 'New client',            run: () => openCustomerForm(), keywords: 'customer client add' },
      { icon: ICONS.service, title: 'Add service',           meta: 'New offering',          run: () => openServiceForm(),  keywords: 'service offering add' },
      { icon: ICONS.cal,     title: 'Go to Calendar',        meta: 'Month view',            run: () => switchView('calendar'),    keywords: 'calendar month' },
      { icon: ICONS.list,    title: 'Go to Bookings list',   meta: 'All appointments',      run: () => switchView('bookings'),    keywords: 'list bookings appointments' },
      { icon: ICONS.users,   title: 'Go to Customers',       meta: 'Client roster',         run: () => switchView('customers'),   keywords: 'customers clients' },
      { icon: ICONS.service, title: 'Go to Services',        meta: 'Offerings catalog',     run: () => switchView('services'),    keywords: 'services catalog offerings' },
      { icon: ICONS.info,    title: 'Go to Dashboard',       meta: 'Overview',              run: () => switchView('dashboard'),   keywords: 'dashboard overview' },
      { icon: ICONS.settings,title: 'Go to Settings',        meta: 'Workspace config',      run: () => switchView('settings'),    keywords: 'settings preferences' },
      { icon: ICONS.sun,     title: 'Toggle dark/light',     meta: 'Theme',                 run: () => toggleTheme(),             keywords: 'theme dark light' },
      { icon: ICONS.reset,   title: 'Reset demo data',       meta: 'Re-seed',               run: () => resetDemo(),               keywords: 'reset demo seed' }
    ];
    const customers = state.customers.map((c) => ({
      icon: ICONS.users,
      title: c.name,
      meta: `${c.phone || c.email || ''} · ${state.bookings.filter((b) => b.customerId === c.id).length} bookings`,
      run: () => { switchView('customers'); openCustomerForm(c.id); },
      keywords: `${c.name} ${c.phone || ''} ${c.email || ''}`.toLowerCase()
    }));
    const bookings = state.bookings.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 30).map((b) => {
      const c = getCustomer(b.customerId); const s = getService(b.serviceId);
      return {
        icon: ICONS.cal,
        title: `${c ? c.name : '—'} · ${s ? s.name : '—'}`,
        meta: `${fmtDateShort(b.date)} ${fmtTime(b.time)} · ${STATUS_LABEL[b.status]}`,
        run: () => openBookingForm(b.id),
        keywords: `${c ? c.name : ''} ${s ? s.name : ''} ${b.notes}`.toLowerCase()
      };
    });

    if (!q) return [
      { groupTitle: 'Quick actions', items: actions.slice(0, 6) },
      { groupTitle: 'Recent bookings', items: bookings.slice(0, 5) }
    ];
    const filt = (i) => i.title.toLowerCase().includes(q) || (i.keywords || '').includes(q);
    const fa = actions.filter(filt);
    const fc = customers.filter(filt);
    const fb = bookings.filter(filt);
    const groups = [];
    if (fa.length) groups.push({ groupTitle: 'Actions', items: fa });
    if (fb.length) groups.push({ groupTitle: 'Bookings', items: fb.slice(0, 10) });
    if (fc.length) groups.push({ groupTitle: 'Customers', items: fc.slice(0, 10) });
    return groups;
  }
  function renderCmdK() {
    const groups = getCmdKItems(ui.cmdkQuery);
    const flat = [];
    groups.forEach((g) => g.items.forEach((i) => flat.push(i)));
    ui.cmdkItems = flat;
    if (ui.cmdkSelectedIndex >= flat.length) ui.cmdkSelectedIndex = 0;

    const container = $('#cmdk-results');
    if (flat.length === 0) {
      container.innerHTML = `<div class="cmdk-empty">No results for "${escapeHtml(ui.cmdkQuery)}"</div>`;
      return;
    }
    let html = ''; let idx = 0;
    groups.forEach((g) => {
      html += `<div class="cmdk-group-title">${escapeHtml(g.groupTitle)}</div>`;
      g.items.forEach((it) => {
        const active = idx === ui.cmdkSelectedIndex ? 'is-active' : '';
        html += `
          <div class="cmdk-item ${active}" data-idx="${idx}">
            <div class="cmdk-item-icon">${it.icon}</div>
            <div class="cmdk-item-body">
              <div class="cmdk-item-title">${escapeHtml(it.title)}</div>
              <div class="cmdk-item-meta">${escapeHtml(it.meta || '')}</div>
            </div>
          </div>
        `;
        idx++;
      });
    });
    container.innerHTML = html;
    $$('.cmdk-item', container).forEach((el) => {
      el.addEventListener('mouseenter', () => {
        ui.cmdkSelectedIndex = parseInt(el.dataset.idx, 10);
        $$('.cmdk-item', container).forEach((e) => e.classList.remove('is-active'));
        el.classList.add('is-active');
      });
      el.addEventListener('click', () => runCmdKItem(parseInt(el.dataset.idx, 10)));
    });
  }
  function runCmdKItem(idx) {
    const item = ui.cmdkItems[idx];
    if (!item) return;
    closeCmdK();
    setTimeout(() => item.run(), 80);
  }
  function handleCmdKKey(e) {
    if (!ui.cmdkOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeCmdK(); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      ui.cmdkSelectedIndex = Math.min(ui.cmdkItems.length - 1, ui.cmdkSelectedIndex + 1);
      renderCmdK();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      ui.cmdkSelectedIndex = Math.max(0, ui.cmdkSelectedIndex - 1);
      renderCmdK();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runCmdKItem(ui.cmdkSelectedIndex);
    }
  }

  // ==========================================================
  // NAV BADGES
  // ==========================================================
  function renderNavBadges() {
    $('#nav-bookings-count').textContent = fmtNumber(state.bookings.length);
    $('#nav-customers-count').textContent = fmtNumber(state.customers.length);
    $('#nav-services-count').textContent = fmtNumber(state.services.length);
  }

  // ==========================================================
  // RENDER ALL
  // ==========================================================
  function renderAll() {
    renderNavBadges();
    if (ui.view === 'calendar') renderCalendar();
    if (ui.view === 'bookings') renderBookingsList();
    if (ui.view === 'customers') renderCustomers();
    if (ui.view === 'services') renderServices();
    if (ui.view === 'dashboard') renderDashboard();
    if (ui.view === 'settings') renderSettings();
  }

  // ==========================================================
  // EVENT BINDING
  // ==========================================================
  function bindEvents() {
    // Sidebar / bottom nav
    $$('.nav-item').forEach((n) => n.addEventListener('click', () => switchView(n.dataset.view)));
    $$('.bottom-nav-item[data-view]').forEach((b) => b.addEventListener('click', () => switchView(b.dataset.view)));
    $('#bottom-nav-fab').addEventListener('click', () => openBookingForm());

    // Sidebar toggle (mobile)
    $('#sidebar-toggle').addEventListener('click', () => {
      $('#sidebar').classList.add('is-open');
      $('#sidebar-backdrop').classList.add('is-visible');
    });
    $('#sidebar-backdrop').addEventListener('click', () => {
      $('#sidebar').classList.remove('is-open');
      $('#sidebar-backdrop').classList.remove('is-visible');
    });

    // Theme
    $('#theme-toggle').addEventListener('click', toggleTheme);

    // Calendar nav
    $('#cal-prev').addEventListener('click', () => {
      ui.calMonth--;
      if (ui.calMonth < 0) { ui.calMonth = 11; ui.calYear--; }
      renderCalendar();
    });
    $('#cal-next').addEventListener('click', () => {
      ui.calMonth++;
      if (ui.calMonth > 11) { ui.calMonth = 0; ui.calYear++; }
      renderCalendar();
    });
    $('#today-btn').addEventListener('click', () => {
      const t = new Date();
      ui.calYear = t.getFullYear(); ui.calMonth = t.getMonth();
      renderCalendar();
    });
    $('#today-jump-btn').addEventListener('click', () => {
      switchView('calendar');
      const t = new Date(); ui.calYear = t.getFullYear(); ui.calMonth = t.getMonth();
      renderCalendar();
    });

    // Add booking buttons
    $('#add-booking-btn').addEventListener('click', () => openBookingForm());
    $('#add-booking-btn-2').addEventListener('click', () => openBookingForm());
    $('#drawer-add-btn').addEventListener('click', () => openBookingForm());

    // Forms
    $('#booking-form').addEventListener('submit', submitBookingForm);
    $('#booking-delete-btn').addEventListener('click', () => {
      if (!ui.editingBookingId) return;
      const b = getBooking(ui.editingBookingId);
      const c = getCustomer(b.customerId);
      confirmAction('Delete booking?', `Booking for ${c ? c.name : '?'} will be removed.`, () => {
        deleteBooking(ui.editingBookingId);
        closeModal('booking-modal');
        renderAll();
        toast('Booking deleted', '', 'success');
        if (!$('#day-drawer').hidden) openDayDrawer(ui.selectedDate);
      }, 'Delete', 'btn-danger');
    });

    $('#customer-form').addEventListener('submit', submitCustomerForm);
    $('#add-customer-btn').addEventListener('click', () => openCustomerForm());

    $('#service-form').addEventListener('submit', submitServiceForm);
    $('#add-service-btn').addEventListener('click', () => openServiceForm());

    // Color picker
    $$('.color-swatch').forEach((b) => {
      b.addEventListener('click', () => {
        selectedColor = b.dataset.color;
        $$('.color-swatch').forEach((x) => x.classList.toggle('is-active', x === b));
      });
    });

    // Bookings filters
    const onBkSearch = debounce(() => {
      ui.bookingFilters.search = $('#bookings-search').value;
      renderBookingsList();
    }, 120);
    $('#bookings-search').addEventListener('input', onBkSearch);
    $('#bookings-status-filter').addEventListener('change', (e) => {
      ui.bookingFilters.status = e.target.value;
      renderBookingsList();
    });
    $('#bookings-date-filter').addEventListener('change', (e) => {
      ui.bookingFilters.range = e.target.value;
      renderBookingsList();
    });

    // Customers search
    const onCustSearch = debounce(() => {
      ui.customerSearch = $('#customers-search').value;
      renderCustomers();
    }, 120);
    $('#customers-search').addEventListener('input', onCustSearch);

    // Confirm dialog
    $('#confirm-ok').addEventListener('click', () => {
      if (typeof ui.pendingConfirm === 'function') {
        const cb = ui.pendingConfirm;
        ui.pendingConfirm = null;
        cb();
      }
      closeModal('confirm-modal');
    });

    // Generic modal/drawer close
    $$('[data-modal-close]').forEach((b) => b.addEventListener('click', () => {
      const overlay = b.closest('.modal-overlay');
      if (overlay) overlay.hidden = true;
    }));
    $$('[data-drawer-close]').forEach((b) => b.addEventListener('click', () => {
      closeDrawer('day-drawer');
    }));
    $$('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; });
    });
    $('#day-drawer').addEventListener('click', (e) => {
      if (e.target.id === 'day-drawer') closeDrawer('day-drawer');
    });

    // Dashboard jump
    $$('[data-view-jump]').forEach((b) => {
      b.addEventListener('click', () => switchView(b.dataset.viewJump));
    });

    // Settings
    $('#settings-save-btn').addEventListener('click', saveSettings);
    $('#export-all-btn').addEventListener('click', exportAllJSON);
    $('#import-all-btn').addEventListener('click', () => $('#import-all-file').click());
    $('#import-all-file').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) importAllJSON(f);
      e.target.value = '';
    });
    $('#wipe-all-btn').addEventListener('click', wipeAll);
    $$('input[name="theme"]').forEach((r) => r.addEventListener('change', (e) => applyTheme(e.target.value)));

    // Export bookings CSV
    $('#export-bookings-btn').addEventListener('click', exportBookings);

    // Reset demo
    $('#reset-demo-btn').addEventListener('click', resetDemo);

    // Cmd+K
    $('#cmdk-trigger').addEventListener('click', openCmdK);
    $('#cmdk-close').addEventListener('click', closeCmdK);
    $('#cmdk-overlay').addEventListener('click', (e) => { if (e.target === $('#cmdk-overlay')) closeCmdK(); });
    $('#cmdk-input').addEventListener('input', (e) => {
      ui.cmdkQuery = e.target.value;
      ui.cmdkSelectedIndex = 0;
      renderCmdK();
    });

    // Global keyboard
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        ui.cmdkOpen ? closeCmdK() : openCmdK();
        return;
      }
      if (e.key === 'Escape') {
        if (ui.cmdkOpen) { closeCmdK(); return; }
        if (!$('#day-drawer').hidden) { closeDrawer('day-drawer'); return; }
        const open = $$('.modal-overlay').find((m) => !m.hidden);
        if (open) open.hidden = true;
      }
      handleCmdKKey(e);
    });

    // System theme change
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener && mq.addEventListener('change', () => {
        if (state.settings.theme === 'auto') applyTheme('auto');
      });
    }
  }

  // ==========================================================
  // INIT
  // ==========================================================
  function init() {
    loadState();
    maybeSeed();
    applyTheme(state.settings.theme || 'light');

    // Default calendar to current month
    const now = new Date();
    ui.calYear = now.getFullYear();
    ui.calMonth = now.getMonth();

    document.title = state.settings.businessName || 'Forge Bookings';

    bindEvents();

    setTimeout(() => {
      $('#boot-splash').classList.add('is-hiding');
      $('#app').hidden = false;
      renderAll();
      setTimeout(() => { const s = $('#boot-splash'); if (s) s.remove(); }, 400);
    }, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
