/* =====================================================================
   Forge — Expenses
   Author: Chester Ewing Columna
   Vanilla CRUD reference for petty cash / expense tracking. localStorage.
   ===================================================================== */
(function () {
  'use strict';

  const STORAGE_KEY = 'forge.expenses.v1';
  const TOAST_DURATION = 3500;

  const PAYMENT_LABEL = { cash: 'Cash', card: 'Card', gcash: 'GCash', transfer: 'Bank transfer' };

  // ==========================================================
  // STATE
  // ==========================================================
  let state = {
    categories: [],
    expenses: [],
    settings: {
      theme: 'light',
      businessName: 'Forge Expenses',
      currency: '₱'
    }
  };

  let ui = {
    view: 'dashboard',
    selectedYear: 0,
    selectedMonth: 0,           // 0-indexed
    expFilters: { search: '', category: '', payment: '', range: 'month' },
    editingExpenseId: null,
    editingCategoryId: null,
    pendingConfirm: null,
    cmdkOpen: false,
    cmdkQuery: '',
    cmdkSelectedIndex: 0,
    cmdkItems: [],
    selectedColor: '#10b981'
  };

  // ==========================================================
  // PERSISTENCE
  // ==========================================================
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.categories = parsed.categories || [];
        state.expenses = parsed.expenses || [];
        if (parsed.settings) state.settings = Object.assign(state.settings, parsed.settings);
      }
    } catch (e) {
      console.warn('[Forge Expenses] Load error:', e);
    }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.error('[Forge Expenses] Save error:', e); }
  }

  // ==========================================================
  // SEED — generic small office / team expenses
  // ==========================================================
  function maybeSeed() {
    if (state.categories.length || state.expenses.length) return;
    const now = new Date();

    const cats = [
      { name: 'Food & Meals',    color: '#f59e0b', budget: 8000 },
      { name: 'Transport & Gas', color: '#3b82f6', budget: 6000 },
      { name: 'Office Supplies', color: '#10b981', budget: 4000 },
      { name: 'Utilities',       color: '#8b5cf6', budget: 5000 },
      { name: 'Internet & Phone',color: '#06b6d4', budget: 3000 },
      { name: 'Software & Subs', color: '#ec4899', budget: 4500 },
      { name: 'Marketing',       color: '#ef4444', budget: 3000 },
      { name: 'Miscellaneous',   color: '#84cc16', budget: 2000 }
    ];
    state.categories = cats.map((c) => ({
      id: uid(),
      ...c,
      createdAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 90 * 86400000).toISOString()
    }));
    const catBy = Object.fromEntries(state.categories.map((c) => [c.name, c.id]));

    function addEx(daysAgo, hour, amount, catName, payee, description, paymentMethod, ref, note) {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
      state.expenses.push({
        id: uid(),
        date: isoDate(d),
        amount,
        categoryId: catBy[catName],
        payee, description, paymentMethod, ref: ref || '', receiptNote: note || '',
        createdAt: d.toISOString(),
        updatedAt: d.toISOString()
      });
    }

    // Current month — denser
    addEx(0,   9, 180,  'Food & Meals',     'Tim Hortons',       'Morning coffee run',          'gcash', '',        '');
    addEx(0,  13, 520,  'Food & Meals',     'Mang Inasal',       'Team lunch — 5 pax',          'cash',  'OR-4421', 'Lunch meeting');
    addEx(1,  10, 240,  'Transport & Gas',  'Grab',              'Office to client meeting',    'card',  '',        '');
    addEx(2,  16, 1850, 'Office Supplies',  'National Bookstore','Bond paper, ink, organizers', 'card',  'INV-228', '');
    addEx(3,   8, 850,  'Transport & Gas',  'Petron',            'Fuel — service vehicle',      'cash',  '',        '');
    addEx(4,  14, 320,  'Food & Meals',     'Jollibee',          'Client snack delivery',       'gcash', '',        '');
    addEx(5,  11, 4500, 'Utilities',        'Meralco',           'Monthly electric bill',       'transfer','UTL-993','');
    addEx(6,  12, 1599, 'Software & Subs',  'Adobe',             'Creative Cloud monthly',      'card',  '',        '');
    addEx(7,   9, 220,  'Transport & Gas',  'Grab',              'Bank errand',                 'gcash', '',        '');
    addEx(8,  15, 1200, 'Marketing',        'Facebook Ads',      'Boosted post — promo',        'card',  'FB-77231','');
    addEx(9,  10, 380,  'Office Supplies',  'Daiso',             'Cleaning supplies',           'cash',  '',        '');
    addEx(10, 14, 2400, 'Internet & Phone', 'Globe Business',    'Fiber monthly',               'transfer','',     '');
    addEx(11, 13, 480,  'Food & Meals',     'McDonalds',         'Team merienda',               'gcash', '',        '');
    addEx(12, 16, 320,  'Miscellaneous',    'Mercury Drug',      'First aid restock',           'cash',  '',        '');
    addEx(13, 11, 1100, 'Transport & Gas',  'Shell',             'Fuel + car wash',             'card',  '',        '');
    addEx(15,  9, 700,  'Food & Meals',     'Starbucks',         'Client meeting refreshments', 'card',  '',        '');
    addEx(18, 14, 2500, 'Marketing',        'Canva Pro',         'Annual subscription',         'card',  'CV-2025', '');
    addEx(20, 10, 950,  'Office Supplies',  'NBS',               'Whiteboard markers, sticky notes','cash','',     '');
    addEx(22, 11, 1450, 'Utilities',        'Maynilad',          'Water bill',                  'transfer','',     '');

    // Last month
    addEx(35, 10, 4200, 'Utilities',        'Meralco',           'Last month\'s electric',      'transfer','',     '');
    addEx(36, 14, 2400, 'Internet & Phone', 'Globe Business',    'Fiber',                       'transfer','',     '');
    addEx(38,  9, 1599, 'Software & Subs',  'Adobe',             'Creative Cloud',              'card',  '',        '');
    addEx(40, 13, 5800, 'Office Supplies',  'OfficeWarehouse',   'Quarterly bulk order',        'transfer','OW-883','');
    addEx(42, 16, 2200, 'Transport & Gas',  'Petron',            'Multiple fuel-ups',           'cash',  '',        '');
    addEx(45, 12, 3500, 'Food & Meals',     'Various',           'Team dinners (3)',            'cash',  '',        '');
    addEx(48, 15, 1800, 'Marketing',        'Facebook Ads',      'Ad campaign',                 'card',  '',        '');
    addEx(50, 10, 1100, 'Miscellaneous',    'Lazada',            'Office plant + decor',        'gcash', '',        '');

    // 3 months ago
    addEx(70, 10, 4100, 'Utilities',        'Meralco',           '',                            'transfer','',     '');
    addEx(72,  9, 2400, 'Internet & Phone', 'Globe Business',    '',                            'transfer','',     '');
    addEx(75, 14, 3200, 'Food & Meals',     'Various',           'Multiple team meals',         'cash',  '',        '');
    addEx(78, 11, 1899, 'Software & Subs',  'Notion + Slack',    'Team subscriptions',          'card',  '',        '');
    addEx(82, 13, 2800, 'Transport & Gas',  'Shell',             'Monthly fuel',                'card',  '',        '');
    addEx(85, 15, 800,  'Office Supplies',  'NBS',               '',                            'cash',  '',        '');

    // 4 months ago
    addEx(100,10, 3800, 'Utilities',        'Meralco',           '',                            'transfer','',     '');
    addEx(105,14, 2400, 'Internet & Phone', 'Globe Business',    '',                            'transfer','',     '');
    addEx(108,13, 2200, 'Marketing',        'Tiktok Ads',        'New campaign',                'card',  '',        '');
    addEx(112, 9, 1599, 'Software & Subs',  'Adobe',             '',                            'card',  '',        '');

    // 5 months ago
    addEx(130,11, 4300, 'Utilities',        'Meralco',           '',                            'transfer','',     '');
    addEx(135,15, 2400, 'Internet & Phone', 'Globe Business',    '',                            'transfer','',     '');
    addEx(138,10, 2800, 'Food & Meals',     'Various',           '',                            'cash',  '',        '');
    addEx(142,14, 1599, 'Software & Subs',  'Adobe',             '',                            'card',  '',        '');

    state.expenses.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    saveState();
  }

  // ==========================================================
  // UTILITIES
  // ==========================================================
  function uid() { return 'e_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
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
    const num = Number(n) || 0;
    return state.settings.currency + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtCurrencyShort(n) {
    const num = Number(n) || 0;
    if (Math.abs(num) >= 1000) return state.settings.currency + (num / 1000).toFixed(1) + 'k';
    return state.settings.currency + Math.round(num);
  }
  function fmtNumber(n) { return Number(n || 0).toLocaleString('en-PH'); }
  function fmtPct(n) {
    if (!isFinite(n)) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
  }
  function fmtDayMonth(iso) {
    const d = parseISO(iso);
    return d.toLocaleDateString('en-PH', { day: '2-digit', month: 'short' });
  }
  function fmtDateLong(iso) {
    return parseISO(iso).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  function fmtMonthLabel(year, month) {
    return new Date(year, month, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  }
  function fmtMonthShort(year, month) {
    return new Date(year, month, 1).toLocaleDateString('en-PH', { month: 'short' });
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
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/></svg>',
    tag:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h20"/><path d="M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7"/></svg>',
    chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    trendUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    trendDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>'
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
  // MODALS
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

    if (view === 'dashboard') renderDashboard();
    else if (view === 'expenses') renderExpenses();
    else if (view === 'categories') renderCategories();
    else if (view === 'reports') renderReports();
    else if (view === 'settings') renderSettings();
  }

  // ==========================================================
  // ENTITY HELPERS
  // ==========================================================
  function getCategory(id) { return state.categories.find((c) => c.id === id); }
  function getExpense(id) { return state.expenses.find((e) => e.id === id); }
  function categoryColor(id) { const c = getCategory(id); return c ? c.color : '#64748b'; }
  function categoryName(id) { const c = getCategory(id); return c ? c.name : '(deleted category)'; }

  // ==========================================================
  // EXPENSE CRUD
  // ==========================================================
  function saveExpense(data) {
    const now = new Date().toISOString();
    if (ui.editingExpenseId) {
      const e = getExpense(ui.editingExpenseId);
      if (!e) return null;
      Object.assign(e, data, { updatedAt: now });
      saveState();
      return e;
    }
    const e = { id: uid(), ...data, createdAt: now, updatedAt: now };
    state.expenses.push(e);
    saveState();
    return e;
  }
  function deleteExpense(id) {
    state.expenses = state.expenses.filter((e) => e.id !== id);
    saveState();
  }

  // ==========================================================
  // CATEGORY CRUD
  // ==========================================================
  function saveCategory(data) {
    const now = new Date().toISOString();
    if (ui.editingCategoryId) {
      const c = getCategory(ui.editingCategoryId);
      if (!c) return null;
      Object.assign(c, data, { updatedAt: now });
      saveState();
      return c;
    }
    const c = { id: uid(), ...data, createdAt: now, updatedAt: now };
    state.categories.push(c);
    saveState();
    return c;
  }
  function deleteCategory(id) {
    state.categories = state.categories.filter((c) => c.id !== id);
    // Don't delete expenses — they'll show "(deleted category)"
    saveState();
  }

  // ==========================================================
  // DATE HELPERS / MONTH RANGES
  // ==========================================================
  function monthRange(year, month) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    return { start, end, startISO: isoDate(start), endISO: isoDate(end) };
  }
  function expensesInRange(startISO, endISO) {
    return state.expenses.filter((e) => e.date >= startISO && e.date < endISO);
  }
  function expensesInMonth(year, month) {
    const r = monthRange(year, month);
    return expensesInRange(r.startISO, r.endISO);
  }
  function totalAmount(list) {
    return list.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }

  // ==========================================================
  // DASHBOARD
  // ==========================================================
  function renderDashboard() {
    const y = ui.selectedYear, m = ui.selectedMonth;
    $('#month-picker-label').textContent = fmtMonthLabel(y, m);
    $('#dashboard-period-sub').textContent = `Tracking expenses for ${fmtMonthLabel(y, m)}.`;

    const current = expensesInMonth(y, m);
    const currentTotal = totalAmount(current);

    // Previous month
    let prevYear = y, prevMonth = m - 1;
    if (prevMonth < 0) { prevMonth = 11; prevYear = y - 1; }
    const prev = expensesInMonth(prevYear, prevMonth);
    const prevTotal = totalAmount(prev);

    // Delta
    let deltaPct = 0;
    if (prevTotal > 0) deltaPct = ((currentTotal - prevTotal) / prevTotal) * 100;
    else if (currentTotal > 0) deltaPct = Infinity;

    $('#hero-total').textContent = fmtCurrency(currentTotal);
    const deltaEl = $('#hero-delta');
    if (currentTotal === 0 && prevTotal === 0) {
      deltaEl.className = 'hero-card-delta is-flat';
      deltaEl.textContent = 'No spending recorded';
    } else if (deltaPct === Infinity) {
      deltaEl.className = 'hero-card-delta is-up';
      deltaEl.innerHTML = ICONS.trendUp + ' new spending vs last month';
    } else if (deltaPct > 0) {
      deltaEl.className = 'hero-card-delta is-up';
      deltaEl.innerHTML = ICONS.trendUp + ' ' + fmtPct(deltaPct) + ' vs last month';
    } else if (deltaPct < 0) {
      deltaEl.className = 'hero-card-delta is-down';
      deltaEl.innerHTML = ICONS.trendDown + ' ' + fmtPct(deltaPct) + ' vs last month';
    } else {
      deltaEl.className = 'hero-card-delta is-flat';
      deltaEl.textContent = 'Same as last month';
    }

    // Mini stats
    $('#hero-entries').textContent = fmtNumber(current.length);
    const today = new Date();
    const daysInPeriod = (today.getFullYear() === y && today.getMonth() === m)
      ? today.getDate()
      : new Date(y, m + 1, 0).getDate();
    $('#hero-avg').textContent = fmtCurrency(daysInPeriod > 0 ? currentTotal / daysInPeriod : 0);

    // Top category
    const byCat = {};
    current.forEach((e) => { byCat[e.categoryId] = (byCat[e.categoryId] || 0) + Number(e.amount || 0); });
    const topEntry = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    $('#hero-top').textContent = topEntry ? categoryName(topEntry[0]) : '—';

    // Category breakdown
    renderCategoryBreakdown(current);

    // Recent expenses
    const recent = state.expenses.slice().sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)).slice(0, 6);
    renderExpenseList($('#recent-expenses'), recent, false);

    // Trend chart (last 6 months including current)
    renderTrendChart();
  }

  function renderCategoryBreakdown(expenseList) {
    const container = $('#category-breakdown');
    const byCat = {};
    expenseList.forEach((e) => {
      byCat[e.categoryId] = (byCat[e.categoryId] || 0) + Number(e.amount || 0);
    });
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    if (entries.length === 0) {
      container.innerHTML = `<p class="muted" style="margin:0;padding:8px 0;">No spending this month yet.</p>`;
      return;
    }
    container.innerHTML = entries.map(([catId, amt]) => {
      const cat = getCategory(catId);
      const pct = total > 0 ? (amt / total) * 100 : 0;
      const color = cat ? cat.color : '#64748b';
      const name = cat ? cat.name : '(deleted)';
      return `
        <div class="cat-bar-row">
          <span class="cat-bar-color" style="background:${color}"></span>
          <div class="cat-bar-meta">
            <div class="cat-bar-header">
              <span class="cat-bar-name">${escapeHtml(name)}</span>
              <span class="cat-bar-amount">${fmtCurrency(amt)}</span>
            </div>
            <div class="cat-bar-track">
              <div class="cat-bar-fill" style="background:${color};width:${pct.toFixed(1)}%"></div>
            </div>
            <div class="cat-bar-pct">${pct.toFixed(1)}% of total</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderTrendChart() {
    const container = $('#trend-chart');
    const months = [];
    for (let i = 5; i >= 0; i--) {
      let y = ui.selectedYear, m = ui.selectedMonth - i;
      while (m < 0) { m += 12; y--; }
      months.push({ y, m });
    }
    const data = months.map(({ y, m }) => ({
      y, m,
      total: totalAmount(expensesInMonth(y, m)),
      isCurrent: y === ui.selectedYear && m === ui.selectedMonth
    }));
    const max = Math.max(...data.map((d) => d.total), 1);
    container.innerHTML = `
      <div class="trend-chart">
        ${data.map((d) => {
          const heightPct = (d.total / max) * 100;
          return `
            <div class="trend-bar ${d.isCurrent ? 'is-current' : ''}" title="${fmtMonthLabel(d.y, d.m)}: ${fmtCurrency(d.total)}">
              <div class="trend-bar-shape" style="height:${Math.max(4, heightPct)}%">
                <span class="trend-bar-amount">${fmtCurrencyShort(d.total)}</span>
              </div>
              <div class="trend-bar-label">${fmtMonthShort(d.y, d.m)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ==========================================================
  // EXPENSES VIEW (list)
  // ==========================================================
  function getFilteredExpenses() {
    const { search, category, payment, range } = ui.expFilters;
    const q = (search || '').toLowerCase().trim();
    const today = new Date();
    let startISO = null, endISO = null;
    if (range === 'month') {
      const r = monthRange(ui.selectedYear, ui.selectedMonth);
      startISO = r.startISO; endISO = r.endISO;
    } else if (range === 'last-month') {
      let py = ui.selectedYear, pm = ui.selectedMonth - 1;
      if (pm < 0) { pm = 11; py--; }
      const r = monthRange(py, pm);
      startISO = r.startISO; endISO = r.endISO;
    } else if (range === 'ytd') {
      startISO = today.getFullYear() + '-01-01';
      endISO = (today.getFullYear() + 1) + '-01-01';
    }
    return state.expenses.filter((e) => {
      if (startISO && (e.date < startISO || e.date >= endISO)) return false;
      if (category && e.categoryId !== category) return false;
      if (payment && e.paymentMethod !== payment) return false;
      if (q) {
        const c = getCategory(e.categoryId);
        const hay = `${e.payee} ${e.description} ${e.receiptNote} ${e.ref} ${c ? c.name : ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  }
  function renderExpenses() {
    populateCategoryFilter();
    const list = getFilteredExpenses();
    const total = totalAmount(list);
    renderExpenseList($('#expenses-list'), list, true);
    $('#expenses-footer').textContent = `${fmtNumber(list.length)} expense${list.length === 1 ? '' : 's'} · Total: ${fmtCurrency(total)}`;
  }
  function populateCategoryFilter() {
    const sel = $('#filter-category');
    const current = ui.expFilters.category;
    sel.innerHTML = '<option value="">All categories</option>' +
      state.categories.map((c) => `<option value="${c.id}" ${c.id === current ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
  }
  function renderExpenseList(container, list, showActions) {
    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="border:none;background:transparent;">
          <div class="empty-icon">${ICONS.cash}</div>
          <div class="empty-title">No expenses yet</div>
          <div class="empty-text">Click "Add expense" to log your first transaction.</div>
        </div>
      `;
      return;
    }
    // Group by date
    const groups = {};
    list.forEach((e) => { (groups[e.date] = groups[e.date] || []).push(e); });
    const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    let html = '';
    dates.forEach((iso) => {
      const dayTotal = groups[iso].reduce((s, e) => s + Number(e.amount || 0), 0);
      html += `
        <div class="expense-day-header">
          <span>${fmtDateLong(iso)}</span>
          <span>${fmtCurrency(dayTotal)}</span>
        </div>
      `;
      groups[iso].forEach((e) => {
        const cat = getCategory(e.categoryId);
        const color = cat ? cat.color : '#64748b';
        const initial = cat ? initials(cat.name) : '?';
        const d = parseISO(e.date);
        html += `
          <div class="expense-row" data-expense-id="${e.id}">
            <div class="expense-row-date">
              <strong>${d.getDate()}</strong>
              ${d.toLocaleDateString('en-PH', { month: 'short' })}
            </div>
            <div class="expense-row-icon" style="background:${color}">${initial}</div>
            <div class="expense-row-body">
              <div class="expense-row-title">${escapeHtml(e.payee || e.description || '(no payee)')}</div>
              <div class="expense-row-meta">
                ${cat ? escapeHtml(cat.name) : '<span class="muted">(deleted category)</span>'}
                ${e.description && e.payee ? ' · ' + escapeHtml(e.description) : ''}
                · <span class="payment-chip">${PAYMENT_LABEL[e.paymentMethod] || e.paymentMethod}</span>
                ${e.ref ? ' · ' + escapeHtml(e.ref) : ''}
              </div>
            </div>
            <div class="expense-row-amount">${fmtCurrency(e.amount)}</div>
            ${showActions ? `
              <div class="expense-row-actions">
                <button class="row-action-btn" data-action="edit" title="Edit">${ICONS.edit}</button>
                <button class="row-action-btn danger" data-action="delete" title="Delete">${ICONS.trash}</button>
              </div>
            ` : ''}
          </div>
        `;
      });
    });
    container.innerHTML = html;
    bindExpenseRowEvents(container);
  }
  function bindExpenseRowEvents(scope) {
    $$('[data-expense-id]', scope).forEach((row) => {
      const id = row.dataset.expenseId;
      row.addEventListener('click', () => openExpenseForm(id));
      $$('button[data-action]', row).forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const a = btn.dataset.action;
          if (a === 'edit') openExpenseForm(id);
          else if (a === 'delete') {
            const ex = getExpense(id);
            confirmAction('Delete expense?', `${ex.payee || '(no payee)'} · ${fmtCurrency(ex.amount)} will be removed.`, () => {
              deleteExpense(id);
              renderAll();
              toast('Expense deleted', '', 'success');
            }, 'Delete', 'btn-danger');
          }
        });
      });
    });
  }

  // ==========================================================
  // EXPENSE FORM
  // ==========================================================
  function openExpenseForm(id) {
    ui.editingExpenseId = id || null;
    const isEdit = !!id;
    $('#expense-modal-title').textContent = isEdit ? 'Edit expense' : 'Add expense';
    $('#expense-submit').textContent = isEdit ? 'Save changes' : 'Save expense';
    $('#expense-delete-btn').hidden = !isEdit;

    // Populate category select
    const catSel = $('#ex-category');
    catSel.innerHTML = '<option value="">Select a category…</option>' +
      state.categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

    $('#expense-form').reset();
    if (isEdit) {
      const e = getExpense(id);
      $('#ex-date').value = e.date;
      $('#ex-amount').value = e.amount;
      $('#ex-category').value = e.categoryId;
      $('#ex-payee').value = e.payee || '';
      $('#ex-payment').value = e.paymentMethod || 'cash';
      $('#ex-ref').value = e.ref || '';
      $('#ex-description').value = e.description || '';
      $('#ex-receipt').value = e.receiptNote || '';
    } else {
      $('#ex-date').value = todayISO();
      $('#ex-payment').value = 'cash';
    }
    openModal('expense-modal');
  }
  function submitExpenseForm(e) {
    e.preventDefault();
    const date = $('#ex-date').value;
    const amount = parseFloat($('#ex-amount').value);
    const categoryId = $('#ex-category').value;
    if (!date || isNaN(amount) || amount <= 0 || !categoryId) {
      toast('Missing fields', 'Date, amount, and category are required.', 'warning');
      return;
    }
    const data = {
      date,
      amount,
      categoryId,
      payee: $('#ex-payee').value.trim(),
      description: $('#ex-description').value.trim(),
      paymentMethod: $('#ex-payment').value,
      ref: $('#ex-ref').value.trim(),
      receiptNote: $('#ex-receipt').value.trim()
    };
    const ex = saveExpense(data);
    const cat = getCategory(ex.categoryId);
    toast(ui.editingExpenseId ? 'Expense updated' : 'Expense added', `${fmtCurrency(ex.amount)} · ${cat ? cat.name : ''}`, 'success');
    closeModal('expense-modal');
    renderAll();
  }

  // ==========================================================
  // CATEGORIES VIEW
  // ==========================================================
  function renderCategories() {
    const container = $('#categories-container');
    if (state.categories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.tag}</div>
          <div class="empty-title">No categories yet</div>
          <div class="empty-text">Categories help you group expenses and track budgets. Add one to get started.</div>
          <button class="btn btn-primary" id="empty-add-cat">Add your first category</button>
        </div>
      `;
      $('#empty-add-cat').addEventListener('click', () => openCategoryForm());
      return;
    }
    // Current month expenses by category
    const r = monthRange(ui.selectedYear, ui.selectedMonth);
    const monthEx = expensesInRange(r.startISO, r.endISO);
    const byCat = {};
    monthEx.forEach((e) => { byCat[e.categoryId] = (byCat[e.categoryId] || 0) + Number(e.amount || 0); });

    let html = '<div class="cat-grid">';
    state.categories.forEach((c) => {
      const spent = byCat[c.id] || 0;
      const allCount = state.expenses.filter((e) => e.categoryId === c.id).length;
      const budget = Number(c.budget) || 0;
      const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
      const isOver = budget > 0 && spent > budget;
      html += `
        <div class="cat-card" data-category-id="${c.id}">
          <div class="cat-card-head">
            <div class="cat-card-color" style="background:${c.color};color:white;">${initials(c.name)}</div>
            <div class="cat-card-info">
              <div class="cat-card-name">${escapeHtml(c.name)}</div>
              <div class="cat-card-count">${allCount} total entries</div>
            </div>
          </div>
          <div>
            <div class="cat-card-amount">${fmtCurrency(spent)}</div>
            <div class="cat-card-budget ${isOver ? 'is-over' : ''}">
              ${budget > 0 ? `${isOver ? 'Over' : 'of'} ${fmtCurrency(budget)} budget` : 'No budget set'}
              ${budget > 0 ? ` · ${pct.toFixed(0)}%` : ''}
            </div>
            ${budget > 0 ? `
              <div class="cat-card-meter">
                <div class="cat-card-meter-fill" style="width:${pct}%;background:${isOver ? '#ef4444' : c.color}"></div>
              </div>
            ` : ''}
          </div>
          <div class="cat-card-actions">
            <button class="row-action-btn" data-action="edit" title="Edit">${ICONS.edit}</button>
            <button class="row-action-btn danger" data-action="delete" title="Delete">${ICONS.trash}</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;

    $$('[data-category-id]').forEach((card) => {
      const id = card.dataset.categoryId;
      $$('button[data-action]', card).forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          if (action === 'edit') openCategoryForm(id);
          else if (action === 'delete') {
            const c = getCategory(id);
            const usedBy = state.expenses.filter((e) => e.categoryId === id).length;
            confirmAction('Delete category?', `${c.name} will be deleted.${usedBy ? ` ${usedBy} expense(s) will show "(deleted category)".` : ''}`, () => {
              deleteCategory(id);
              renderAll();
              toast('Category deleted', c.name, 'success');
            }, 'Delete', 'btn-danger');
          }
        });
      });
    });
  }
  function openCategoryForm(id) {
    ui.editingCategoryId = id || null;
    const isEdit = !!id;
    $('#category-modal-title').textContent = isEdit ? 'Edit category' : 'Add category';
    $('#category-submit').textContent = isEdit ? 'Save changes' : 'Save category';
    $('#category-form').reset();
    ui.selectedColor = '#10b981';
    if (isEdit) {
      const c = getCategory(id);
      $('#cat-name').value = c.name;
      $('#cat-budget').value = c.budget || '';
      ui.selectedColor = c.color;
    }
    $$('.color-swatch').forEach((b) => b.classList.toggle('is-active', b.dataset.color === ui.selectedColor));
    openModal('category-modal');
  }
  function submitCategoryForm(e) {
    e.preventDefault();
    const name = $('#cat-name').value.trim();
    if (!name) { toast('Missing field', 'Name is required.', 'warning'); return; }
    const dup = state.categories.find((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== ui.editingCategoryId);
    if (dup) { toast('Duplicate name', `"${name}" already exists.`, 'warning'); return; }
    const data = {
      name,
      budget: parseFloat($('#cat-budget').value) || 0,
      color: ui.selectedColor
    };
    const c = saveCategory(data);
    toast(ui.editingCategoryId ? 'Category updated' : 'Category added', c.name, 'success');
    closeModal('category-modal');
    renderAll();
  }

  // ==========================================================
  // REPORTS VIEW
  // ==========================================================
  function renderReports() {
    // Stats
    const today = new Date();
    const ytdRange = expensesInRange(today.getFullYear() + '-01-01', (today.getFullYear() + 1) + '-01-01');
    const allTotal = totalAmount(state.expenses);
    const ytdTotal = totalAmount(ytdRange);
    const monthCount = new Set(state.expenses.map((e) => e.date.slice(0, 7))).size;
    const avgPerMonth = monthCount > 0 ? allTotal / monthCount : 0;

    $('#report-stats').innerHTML = `
      <article class="stat-card">
        <div class="stat-icon stat-icon--primary">${ICONS.cash}</div>
        <div class="stat-body">
          <div class="stat-label">Year to date</div>
          <div class="stat-value">${fmtCurrency(ytdTotal)}</div>
          <div class="stat-trend">${ytdRange.length} entries</div>
        </div>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon--blue">${ICONS.chart}</div>
        <div class="stat-body">
          <div class="stat-label">All time</div>
          <div class="stat-value">${fmtCurrency(allTotal)}</div>
          <div class="stat-trend">${state.expenses.length} entries</div>
        </div>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon--warning">${ICONS.chart}</div>
        <div class="stat-body">
          <div class="stat-label">Avg / month</div>
          <div class="stat-value">${fmtCurrency(avgPerMonth)}</div>
          <div class="stat-trend">Across ${monthCount} months</div>
        </div>
      </article>
    `;

    // Table: last 6 months × categories
    const months = [];
    for (let i = 5; i >= 0; i--) {
      let y = ui.selectedYear, m = ui.selectedMonth - i;
      while (m < 0) { m += 12; y--; }
      months.push({ y, m, label: fmtMonthShort(y, m) + ' ' + y });
    }
    const monthTotals = months.map(({ y, m }) => totalAmount(expensesInMonth(y, m)));
    const byCatByMonth = {};
    state.categories.forEach((c) => {
      byCatByMonth[c.id] = months.map(({ y, m }) =>
        totalAmount(expensesInMonth(y, m).filter((e) => e.categoryId === c.id))
      );
    });

    let table = `<table class="report-table">
      <thead>
        <tr>
          <th>Category</th>
          ${months.map((mo) => `<th class="num">${mo.label}</th>`).join('')}
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>`;
    state.categories.forEach((c) => {
      const row = byCatByMonth[c.id];
      const rowSum = row.reduce((s, v) => s + v, 0);
      table += `<tr>
        <td><span style="display:inline-block;width:10px;height:10px;background:${c.color};border-radius:50%;margin-right:8px;"></span>${escapeHtml(c.name)}</td>
        ${row.map((v) => `<td class="num">${v > 0 ? fmtCurrency(v) : '—'}</td>`).join('')}
        <td class="num"><strong>${fmtCurrency(rowSum)}</strong></td>
      </tr>`;
    });
    table += `</tbody><tfoot>
      <tr>
        <td>Total</td>
        ${monthTotals.map((v) => `<td class="num">${fmtCurrency(v)}</td>`).join('')}
        <td class="num">${fmtCurrency(monthTotals.reduce((s, v) => s + v, 0))}</td>
      </tr>
    </tfoot></table>`;
    $('#report-table').innerHTML = table;
  }

  // ==========================================================
  // SETTINGS
  // ==========================================================
  function renderSettings() {
    $('#setting-biz-name').value = state.settings.businessName || 'Forge Expenses';
    $('#setting-currency').value = state.settings.currency || '₱';
    $$('input[name="theme"]').forEach((r) => (r.checked = r.value === state.settings.theme));
  }
  function saveSettings() {
    state.settings.businessName = $('#setting-biz-name').value.trim() || 'Forge Expenses';
    state.settings.currency = $('#setting-currency').value.trim() || '₱';
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
  function exportCSV() {
    const list = getFilteredExpenses();
    const headers = ['Date', 'Amount', 'Category', 'Payee', 'Description', 'Payment', 'Reference', 'Receipt note'];
    const rows = list.map((e) => {
      const c = getCategory(e.categoryId);
      return [e.date, e.amount, c ? c.name : '', e.payee, e.description, PAYMENT_LABEL[e.paymentMethod] || e.paymentMethod, e.ref, e.receiptNote];
    });
    const csv = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    downloadFile(`forge-expenses-${todayISO()}.csv`, csv, 'text/csv;charset=utf-8');
    toast('Exported', `${list.length} expenses exported`, 'success');
  }
  function exportReport() {
    // Same structure as the on-screen table
    const months = [];
    for (let i = 5; i >= 0; i--) {
      let y = ui.selectedYear, m = ui.selectedMonth - i;
      while (m < 0) { m += 12; y--; }
      months.push({ y, m, label: fmtMonthShort(y, m) + ' ' + y });
    }
    const headers = ['Category', ...months.map((mo) => mo.label), 'Total'];
    const rows = state.categories.map((c) => {
      const row = months.map(({ y, m }) =>
        totalAmount(expensesInMonth(y, m).filter((e) => e.categoryId === c.id))
      );
      return [c.name, ...row, row.reduce((s, v) => s + v, 0)];
    });
    const csv = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    downloadFile(`forge-report-${todayISO()}.csv`, csv, 'text/csv;charset=utf-8');
    toast('Report exported', 'Monthly breakdown as CSV', 'success');
  }
  function exportAllJSON() {
    downloadFile(`forge-expenses-backup-${todayISO()}.json`, JSON.stringify(state, null, 2), 'application/json');
    toast('Backup exported', 'Full workspace as JSON', 'success');
  }
  function importAllJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(String(e.target.result || ''));
        if (!parsed || !Array.isArray(parsed.expenses)) {
          toast('Invalid backup', 'JSON must have expenses[] array.', 'danger');
          return;
        }
        confirmAction('Replace all data?', 'This overwrites current expenses and categories.', () => {
          state.categories = parsed.categories || [];
          state.expenses = parsed.expenses || [];
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
    confirmAction('Wipe everything?', 'All expenses and categories will be deleted.', () => {
      state.categories = []; state.expenses = [];
      saveState(); renderAll();
      toast('Wiped', 'All data cleared.', 'success');
    }, 'Wipe', 'btn-danger');
  }
  function resetDemo() {
    confirmAction('Reset to demo data?', 'Wipes current data and re-seeds the office expenses demo.', () => {
      state.categories = []; state.expenses = [];
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
      { icon: ICONS.plus,     title: 'Add expense',           meta: 'Log a new transaction',    run: () => openExpenseForm(),       keywords: 'add new expense transaction' },
      { icon: ICONS.tag,      title: 'Add category',          meta: 'New expense group',        run: () => openCategoryForm(),      keywords: 'add new category group' },
      { icon: ICONS.chart,    title: 'Go to Overview',        meta: 'Dashboard',                run: () => switchView('dashboard'), keywords: 'overview dashboard summary' },
      { icon: ICONS.cash,     title: 'Go to Expenses',        meta: 'All transactions',         run: () => switchView('expenses'),  keywords: 'expenses list transactions' },
      { icon: ICONS.tag,      title: 'Go to Categories',      meta: 'Manage groups & budgets',  run: () => switchView('categories'),keywords: 'categories groups budgets' },
      { icon: ICONS.chart,    title: 'Go to Reports',         meta: 'Monthly comparison',       run: () => switchView('reports'),   keywords: 'reports comparison monthly' },
      { icon: ICONS.settings, title: 'Go to Settings',        meta: 'Workspace config',         run: () => switchView('settings'),  keywords: 'settings preferences' },
      { icon: ICONS.sun,      title: 'Toggle dark/light',     meta: 'Theme',                    run: () => toggleTheme(),           keywords: 'theme dark light' },
      { icon: ICONS.reset,    title: 'Reset demo data',       meta: 'Re-seed sample',           run: () => resetDemo(),             keywords: 'reset demo seed' }
    ];
    const recent = state.expenses
      .slice().sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))
      .slice(0, 30).map((e) => {
        const c = getCategory(e.categoryId);
        return {
          icon: ICONS.cash,
          title: `${e.payee || e.description || '(no payee)'}`,
          meta: `${fmtCurrency(e.amount)} · ${fmtDayMonth(e.date)} · ${c ? c.name : 'no category'}`,
          run: () => openExpenseForm(e.id),
          keywords: `${e.payee || ''} ${e.description || ''} ${c ? c.name : ''} ${e.ref || ''}`.toLowerCase()
        };
      });

    if (!q) return [
      { groupTitle: 'Quick actions', items: actions.slice(0, 6) },
      { groupTitle: 'Recent expenses', items: recent.slice(0, 5) }
    ];
    const filt = (i) => i.title.toLowerCase().includes(q) || (i.keywords || '').includes(q);
    const fa = actions.filter(filt);
    const fr = recent.filter(filt);
    const groups = [];
    if (fa.length) groups.push({ groupTitle: 'Actions', items: fa });
    if (fr.length) groups.push({ groupTitle: 'Expenses', items: fr.slice(0, 10) });
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
    $('#nav-expense-count').textContent = fmtNumber(state.expenses.length);
    $('#nav-category-count').textContent = fmtNumber(state.categories.length);
  }

  function renderAll() {
    renderNavBadges();
    if (ui.view === 'dashboard') renderDashboard();
    if (ui.view === 'expenses') renderExpenses();
    if (ui.view === 'categories') renderCategories();
    if (ui.view === 'reports') renderReports();
    if (ui.view === 'settings') renderSettings();
  }

  // ==========================================================
  // EVENT BINDING
  // ==========================================================
  function bindEvents() {
    $$('.nav-item').forEach((n) => n.addEventListener('click', () => switchView(n.dataset.view)));
    $$('.bottom-nav-item[data-view]').forEach((b) => b.addEventListener('click', () => switchView(b.dataset.view)));
    $('#bottom-nav-fab').addEventListener('click', () => openExpenseForm());

    $('#sidebar-toggle').addEventListener('click', () => {
      $('#sidebar').classList.add('is-open');
      $('#sidebar-backdrop').classList.add('is-visible');
    });
    $('#sidebar-backdrop').addEventListener('click', () => {
      $('#sidebar').classList.remove('is-open');
      $('#sidebar-backdrop').classList.remove('is-visible');
    });

    $('#theme-toggle').addEventListener('click', toggleTheme);

    // Month picker
    $('#month-prev').addEventListener('click', () => {
      ui.selectedMonth--;
      if (ui.selectedMonth < 0) { ui.selectedMonth = 11; ui.selectedYear--; }
      renderAll();
    });
    $('#month-next').addEventListener('click', () => {
      ui.selectedMonth++;
      if (ui.selectedMonth > 11) { ui.selectedMonth = 0; ui.selectedYear++; }
      renderAll();
    });

    // Add buttons
    $('#add-expense-btn').addEventListener('click', () => openExpenseForm());
    $('#add-expense-btn-2').addEventListener('click', () => openExpenseForm());
    $('#add-category-btn').addEventListener('click', () => openCategoryForm());

    // Forms
    $('#expense-form').addEventListener('submit', submitExpenseForm);
    $('#expense-delete-btn').addEventListener('click', () => {
      if (!ui.editingExpenseId) return;
      const ex = getExpense(ui.editingExpenseId);
      confirmAction('Delete expense?', `${ex.payee || '(no payee)'} will be removed.`, () => {
        deleteExpense(ui.editingExpenseId);
        closeModal('expense-modal');
        renderAll();
        toast('Expense deleted', '', 'success');
      }, 'Delete', 'btn-danger');
    });

    $('#category-form').addEventListener('submit', submitCategoryForm);
    $$('.color-swatch').forEach((b) => {
      b.addEventListener('click', () => {
        ui.selectedColor = b.dataset.color;
        $$('.color-swatch').forEach((x) => x.classList.toggle('is-active', x === b));
      });
    });

    // Filters
    const onExpSearch = debounce(() => {
      ui.expFilters.search = $('#expense-search').value;
      renderExpenses();
    }, 120);
    $('#expense-search').addEventListener('input', onExpSearch);
    $('#filter-category').addEventListener('change', (e) => {
      ui.expFilters.category = e.target.value;
      renderExpenses();
    });
    $('#filter-payment').addEventListener('change', (e) => {
      ui.expFilters.payment = e.target.value;
      renderExpenses();
    });
    $('#filter-range').addEventListener('change', (e) => {
      ui.expFilters.range = e.target.value;
      renderExpenses();
    });

    // Confirm
    $('#confirm-ok').addEventListener('click', () => {
      if (typeof ui.pendingConfirm === 'function') {
        const cb = ui.pendingConfirm;
        ui.pendingConfirm = null;
        cb();
      }
      closeModal('confirm-modal');
    });

    // Modal close
    $$('[data-modal-close]').forEach((b) => b.addEventListener('click', () => {
      const overlay = b.closest('.modal-overlay');
      if (overlay) overlay.hidden = true;
    }));
    $$('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; });
    });

    // Dashboard "view all" jumps
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

    // Export CSV
    $('#export-csv-btn').addEventListener('click', exportCSV);
    $('#export-report-btn').addEventListener('click', exportReport);

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
        const open = $$('.modal-overlay').find((m) => !m.hidden);
        if (open) open.hidden = true;
      }
      handleCmdKKey(e);
    });

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

    const now = new Date();
    ui.selectedYear = now.getFullYear();
    ui.selectedMonth = now.getMonth();

    document.title = state.settings.businessName || 'Forge Expenses';

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
