/* =====================================================================
   Forge — Inventory Suite
   Author: Chester Ewing Columna
   Vanilla CRUD reference. All state persists to localStorage.
   ===================================================================== */
(function () {
  'use strict';

  // ==========================================================
  // CONSTANTS
  // ==========================================================
  const STORAGE_KEY = 'forge.inventory.v1';
  const THEME_KEY = 'forge.theme';
  const DEFAULT_LOW_STOCK = 5;
  const TOAST_DURATION = 3500;

  // ==========================================================
  // SEED DATA — generic mix across categories
  // ==========================================================
  const SEED = {
    products: [
      { sku: 'INV-001', name: 'A4 Bond Paper (500 sheets)',    category: 'Office Supplies', stock: 24, threshold: 10, price:  280, cost:  180, supplier: 'Metro Supplies Co.',   notes: '80 GSM, multi-purpose' },
      { sku: 'INV-002', name: 'Ballpoint Pen (Box of 12)',     category: 'Stationery',      stock: 18, threshold:  8, price:  240, cost:  140, supplier: 'BrightLine Trading',   notes: 'Blue ink, fine tip' },
      { sku: 'INV-003', name: 'USB Flash Drive 32GB',          category: 'Electronics',     stock:  3, threshold:  5, price:  450, cost:  300, supplier: 'TechMart Distributors',notes: 'Low stock — reorder' },
      { sku: 'INV-004', name: 'Wireless Mouse',                category: 'Electronics',     stock: 14, threshold:  6, price:  650, cost:  420, supplier: 'TechMart Distributors',notes: '' },
      { sku: 'INV-005', name: 'Cotton T-shirt — White (M)',    category: 'Apparel',         stock: 32, threshold: 10, price:  320, cost:  180, supplier: 'Greenleaf Goods',      notes: 'Unisex fit' },
      { sku: 'INV-006', name: 'Cotton T-shirt — Black (L)',    category: 'Apparel',         stock:  7, threshold: 10, price:  320, cost:  180, supplier: 'Greenleaf Goods',      notes: 'Low stock — fast mover' },
      { sku: 'INV-007', name: 'Bottled Water 500ml (Pack 24)', category: 'Beverages',       stock: 42, threshold: 15, price:  180, cost:  110, supplier: 'DailyMart Wholesale',  notes: '' },
      { sku: 'INV-008', name: 'Instant Coffee Sachet (Box 30)',category: 'Beverages',       stock: 28, threshold: 12, price:  220, cost:  140, supplier: 'DailyMart Wholesale',  notes: '' },
      { sku: 'INV-009', name: 'Dishwashing Liquid 500ml',      category: 'Cleaning',        stock:  0, threshold:  6, price:   95, cost:   55, supplier: 'DailyMart Wholesale',  notes: 'OUT OF STOCK — urgent' },
      { sku: 'INV-010', name: 'Microfiber Cloth (Pack of 5)',  category: 'Cleaning',        stock: 16, threshold:  8, price:  220, cost:  120, supplier: 'BrightLine Trading',   notes: '' },
      { sku: 'INV-011', name: 'Notebook A5 (Pack of 3)',       category: 'Stationery',      stock:  4, threshold:  5, price:  180, cost:   95, supplier: 'BrightLine Trading',   notes: 'Low stock' },
      { sku: 'INV-012', name: 'Desk Organizer — Wood',         category: 'Office Supplies', stock:  9, threshold:  4, price:  580, cost:  360, supplier: 'Metro Supplies Co.',   notes: '' },
      { sku: 'INV-013', name: 'HDMI Cable 2m',                 category: 'Electronics',     stock: 22, threshold:  8, price:  290, cost:  170, supplier: 'TechMart Distributors',notes: '' },
      { sku: 'INV-014', name: 'Eco Tote Bag — Canvas',         category: 'Apparel',         stock: 19, threshold:  8, price:  180, cost:   95, supplier: 'Greenleaf Goods',      notes: 'Reusable, 12oz canvas' }
    ],
    seededTransactions: [
      // Backfilled history for realism. Days ago, descending recency.
      { type: 'in',  sku: 'INV-007', qty: 24, note: 'Weekly restock from DailyMart',           daysAgo: 14 },
      { type: 'out', sku: 'INV-001', qty: 4,  note: 'Office consumption — Q2 report run',      daysAgo: 12 },
      { type: 'in',  sku: 'INV-005', qty: 20, note: 'New stock from Greenleaf',                daysAgo: 10 },
      { type: 'out', sku: 'INV-009', qty: 6,  note: 'Used last stock — cleaning team',         daysAgo: 7  },
      { type: 'out', sku: 'INV-003', qty: 3,  note: 'Bulk order — corporate client',           daysAgo: 5  },
      { type: 'in',  sku: 'INV-013', qty: 10, note: 'TechMart delivery',                       daysAgo: 4  },
      { type: 'out', sku: 'INV-006', qty: 5,  note: 'Walk-in sales',                           daysAgo: 2  },
      { type: 'out', sku: 'INV-011', qty: 2,  note: 'Replenished display stock',               daysAgo: 1  },
      { type: 'in',  sku: 'INV-014', qty: 6,  note: 'Greenleaf Goods drop-off',                daysAgo: 0  }
    ],
    settings: {
      theme: 'light',
      currency: '₱',
      brandName: 'Forge',
      defaultThreshold: 5
    }
  };

  // ==========================================================
  // STATE
  // ==========================================================
  let state = {
    products: [],
    transactions: [],
    settings: { theme: 'light', currency: '₱', brandName: 'Forge', defaultThreshold: 5 }
  };

  let ui = {
    view: 'products',
    productFilters: { search: '', category: '', status: '' },
    txFilters: { search: '', type: '' },
    viewMode: 'table',
    editingProductId: null,
    stockProductId: null,
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
        state.products = Array.isArray(parsed.products) ? parsed.products : [];
        state.transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
        state.settings = Object.assign({ theme: 'light', currency: '₱', brandName: 'Forge', defaultThreshold: 5 }, parsed.settings || {});
      }
    } catch (e) {
      console.warn('[Forge] Failed to load state:', e);
    }
  }
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('[Forge] Failed to save state:', e);
      toast('Storage error', 'Could not save changes. Browser storage may be full.', 'danger');
    }
  }
  function maybeSeed() {
    if (state.products.length === 0 && state.transactions.length === 0) {
      const now = Date.now();
      // Seed products
      state.products = SEED.products.map((p, i) => ({
        id: uid(),
        sku: p.sku,
        name: p.name,
        category: p.category,
        stock: p.stock,
        threshold: p.threshold,
        price: p.price,
        cost: p.cost,
        supplier: p.supplier,
        notes: p.notes,
        createdAt: new Date(now - (SEED.products.length - i) * 86400000 * 4).toISOString(),
        updatedAt: new Date(now - (SEED.products.length - i) * 86400000 * 4).toISOString()
      }));
      // Seed creation transactions
      state.products.forEach((p) => {
        state.transactions.push({
          id: uid(),
          productId: p.id,
          sku: p.sku,
          productName: p.name,
          type: 'create',
          qty: p.stock,
          note: 'Initial stock seeded',
          timestamp: p.createdAt
        });
      });
      // Seed movement history
      const bySku = Object.fromEntries(state.products.map((p) => [p.sku, p]));
      SEED.seededTransactions.forEach((tx) => {
        const p = bySku[tx.sku];
        if (!p) return;
        state.transactions.push({
          id: uid(),
          productId: p.id,
          sku: p.sku,
          productName: p.name,
          type: tx.type,
          qty: tx.qty,
          note: tx.note,
          timestamp: new Date(now - tx.daysAgo * 86400000 - Math.random() * 6 * 3600000).toISOString()
        });
      });
      // Sort transactions newest first
      state.transactions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      saveState();
    }
  }

  // ==========================================================
  // UTILITIES
  // ==========================================================
  function uid() {
    return 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }
  function fmtCurrency(amount) {
    const num = Number(amount) || 0;
    return state.settings.currency + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtNumber(n) {
    return Number(n || 0).toLocaleString('en-PH');
  }
  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function fmtRelative(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + 'd ago';
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }
  function downloadFile(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  function statusOf(product) {
    if (product.stock <= 0) return 'out';
    if (product.stock <= product.threshold) return 'low';
    return 'in';
  }
  function statusLabel(s) {
    return { in: 'In stock', low: 'Low stock', out: 'Out of stock' }[s] || s;
  }
  function statusBadgeClass(s) {
    return { in: 'badge--success', low: 'badge--warning', out: 'badge--danger' }[s] || 'badge--success';
  }
  function $(sel, parent) { return (parent || document).querySelector(sel); }
  function $$(sel, parent) { return Array.from((parent || document).querySelectorAll(sel)); }

  // ==========================================================
  // ICONS (Lucide-style)
  // ==========================================================
  const ICONS = {
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
    arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/></svg>',
    moonSun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/></svg>',
    package: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>',
    listOrdered: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12h11"/><path d="M10 18h11"/><path d="M10 6h11"/><path d="M4 10h2"/><path d="M4 6h1v4"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>'
  };

  // ==========================================================
  // TOAST
  // ==========================================================
  function toast(title, message, type = 'info', duration = TOAST_DURATION) {
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

    const remove = () => {
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 250);
    };
    $('.toast-dismiss', el).addEventListener('click', remove);
    setTimeout(remove, duration);
  }

  // ==========================================================
  // MODALS
  // ==========================================================
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    setTimeout(() => {
      const focusEl = m.querySelector('input:not([type="hidden"]), textarea, button');
      if (focusEl) focusEl.focus();
    }, 50);
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.hidden = true;
  }
  function closeAllModals() {
    $$('.modal-overlay').forEach((m) => (m.hidden = true));
  }

  // ==========================================================
  // CONFIRM DIALOG
  // ==========================================================
  function confirmAction(title, message, onOk, okLabel = 'Confirm', okStyle = 'btn-danger') {
    $('#confirm-title').textContent = title;
    $('#confirm-message').textContent = message;
    const okBtn = $('#confirm-ok');
    okBtn.textContent = okLabel;
    okBtn.className = 'btn ' + okStyle;
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
    // Sync settings radios
    $$('input[name="theme"]').forEach((r) => (r.checked = r.value === theme));
  }
  function toggleTheme() {
    const current = state.settings.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
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
    // Close mobile sidebar
    $('#sidebar').classList.remove('is-open');
    $('#sidebar-backdrop').classList.remove('is-visible');
    document.body.style.overflow = '';
    // Render specific views on demand
    if (view === 'dashboard') renderDashboard();
    if (view === 'transactions') renderTransactions();
    if (view === 'settings') renderSettings();
  }

  // ==========================================================
  // PRODUCT CRUD
  // ==========================================================
  function getProduct(id) {
    return state.products.find((p) => p.id === id);
  }
  function createProduct(data) {
    const now = new Date().toISOString();
    const p = {
      id: uid(),
      sku: data.sku.trim(),
      name: data.name.trim(),
      category: (data.category || '').trim(),
      stock: Number(data.stock) || 0,
      threshold: Number(data.threshold) || 0,
      price: Number(data.price) || 0,
      cost: Number(data.cost) || 0,
      supplier: (data.supplier || '').trim(),
      notes: (data.notes || '').trim(),
      createdAt: now,
      updatedAt: now
    };
    state.products.unshift(p);
    state.transactions.unshift({
      id: uid(), productId: p.id, sku: p.sku, productName: p.name,
      type: 'create', qty: p.stock, note: 'Product created', timestamp: now
    });
    saveState();
    return p;
  }
  function updateProduct(id, data) {
    const p = getProduct(id);
    if (!p) return null;
    const before = { stock: p.stock, name: p.name };
    Object.assign(p, {
      sku: data.sku.trim(),
      name: data.name.trim(),
      category: (data.category || '').trim(),
      stock: Number(data.stock) || 0,
      threshold: Number(data.threshold) || 0,
      price: Number(data.price) || 0,
      cost: Number(data.cost) || 0,
      supplier: (data.supplier || '').trim(),
      notes: (data.notes || '').trim(),
      updatedAt: new Date().toISOString()
    });
    state.transactions.unshift({
      id: uid(), productId: p.id, sku: p.sku, productName: p.name,
      type: 'update', qty: p.stock - before.stock, note: 'Product details edited', timestamp: p.updatedAt
    });
    saveState();
    return p;
  }
  function deleteProduct(id) {
    const p = getProduct(id);
    if (!p) return;
    state.products = state.products.filter((x) => x.id !== id);
    state.transactions.unshift({
      id: uid(), productId: id, sku: p.sku, productName: p.name,
      type: 'delete', qty: -p.stock, note: 'Product removed from inventory', timestamp: new Date().toISOString()
    });
    saveState();
  }
  function adjustStock(productId, type, qty, note) {
    const p = getProduct(productId);
    if (!p) return;
    const delta = type === 'in' ? Number(qty) : -Number(qty);
    if (type === 'out' && p.stock + delta < 0) {
      toast('Not enough stock', `Only ${p.stock} ${p.name} available.`, 'danger');
      return false;
    }
    p.stock += delta;
    p.updatedAt = new Date().toISOString();
    state.transactions.unshift({
      id: uid(), productId: p.id, sku: p.sku, productName: p.name,
      type: type, qty: Math.abs(qty), note: note || '', timestamp: p.updatedAt
    });
    saveState();
    return true;
  }

  // ==========================================================
  // DERIVED STATE
  // ==========================================================
  function getCategories() {
    return Array.from(new Set(state.products.map((p) => p.category).filter(Boolean))).sort();
  }
  function getFilteredProducts() {
    const { search, category, status } = ui.productFilters;
    const q = (search || '').toLowerCase().trim();
    return state.products.filter((p) => {
      if (category && p.category !== category) return false;
      if (status && statusOf(p) !== status) return false;
      if (q) {
        const hay = `${p.sku} ${p.name} ${p.category} ${p.supplier} ${p.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }
  function getStats() {
    const total = state.products.length;
    const totalStock = state.products.reduce((s, p) => s + p.stock, 0);
    const totalValue = state.products.reduce((s, p) => s + p.stock * p.price, 0);
    const lowStock = state.products.filter((p) => statusOf(p) === 'low').length;
    const outStock = state.products.filter((p) => statusOf(p) === 'out').length;
    return { total, totalStock, totalValue, lowStock, outStock };
  }

  // ==========================================================
  // RENDER: STATS / NAV BADGES
  // ==========================================================
  function renderNavBadges() {
    $('#nav-products-count').textContent = fmtNumber(state.products.length);
    $('#nav-transactions-count').textContent = fmtNumber(state.transactions.length);
  }
  function renderProductsStats() {
    const s = getStats();
    $('#products-stats').innerHTML = `
      <article class="stat-card">
        <div class="stat-icon stat-icon--primary">${ICONS.box}</div>
        <div class="stat-body">
          <div class="stat-label">Total products</div>
          <div class="stat-value">${fmtNumber(s.total)}</div>
          <div class="stat-trend">${fmtNumber(s.totalStock)} units in stock</div>
        </div>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon--success">${ICONS.cash}</div>
        <div class="stat-body">
          <div class="stat-label">Inventory value</div>
          <div class="stat-value">${fmtCurrency(s.totalValue)}</div>
          <div class="stat-trend">At current sell price</div>
        </div>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon--warning">${ICONS.warning}</div>
        <div class="stat-body">
          <div class="stat-label">Low stock</div>
          <div class="stat-value">${fmtNumber(s.lowStock)}</div>
          <div class="stat-trend">${s.lowStock > 0 ? 'Reorder soon' : 'All healthy'}</div>
        </div>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon--danger">${ICONS.alert}</div>
        <div class="stat-body">
          <div class="stat-label">Out of stock</div>
          <div class="stat-value">${fmtNumber(s.outStock)}</div>
          <div class="stat-trend">${s.outStock > 0 ? 'Lost-sale risk' : 'No gaps'}</div>
        </div>
      </article>
    `;
  }

  // ==========================================================
  // RENDER: CATEGORY FILTER
  // ==========================================================
  function renderCategoryFilter() {
    const sel = $('#filter-category');
    const cats = getCategories();
    const current = ui.productFilters.category;
    sel.innerHTML = '<option value="">All categories</option>' +
      cats.map((c) => `<option value="${escapeHtml(c)}" ${c === current ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
    // Datalist for category suggestions in product form
    const dl = $('#category-suggestions');
    if (dl) dl.innerHTML = cats.map((c) => `<option value="${escapeHtml(c)}">`).join('');
  }

  // ==========================================================
  // RENDER: PRODUCTS
  // ==========================================================
  function thumbInitial(p) {
    const letters = (p.name || p.sku || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    return letters || '?';
  }
  function renderProductsList() {
    const container = $('#products-container');
    const products = getFilteredProducts();

    if (products.length === 0) {
      container.innerHTML = renderEmpty();
      return;
    }

    if (ui.viewMode === 'grid') {
      container.innerHTML = renderProductsGrid(products);
    } else {
      container.innerHTML = renderProductsTable(products);
    }
    bindProductRowEvents();
  }

  function renderEmpty() {
    const hasFilters = ui.productFilters.search || ui.productFilters.category || ui.productFilters.status;
    if (hasFilters) {
      return `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.box}</div>
          <div class="empty-title">No products match your filters</div>
          <div class="empty-text">Try adjusting the search query or clearing filters.</div>
          <button class="btn btn-secondary" id="clear-filters-btn">Clear filters</button>
        </div>
      `;
    }
    return `
      <div class="empty-state">
        <div class="empty-icon">${ICONS.box}</div>
        <div class="empty-title">No products yet</div>
        <div class="empty-text">Start by adding your first product, or import a CSV from your existing spreadsheet.</div>
        <button class="btn btn-primary" id="empty-add-btn">${ICONS.plus} Add your first product</button>
      </div>
    `;
  }

  function renderProductsTable(products) {
    const rows = products.map((p) => {
      const status = statusOf(p);
      return `
        <tr data-product-id="${p.id}">
          <td>
            <div class="prod-name-cell">
              <div class="prod-thumb">${thumbInitial(p)}</div>
              <div>
                <div class="prod-info-name">${escapeHtml(p.name)}</div>
                ${p.supplier ? `<div class="prod-info-supplier">${escapeHtml(p.supplier)}</div>` : ''}
              </div>
            </div>
          </td>
          <td><span class="prod-sku">${escapeHtml(p.sku)}</span></td>
          <td>${p.category ? `<span class="prod-category">${escapeHtml(p.category)}</span>` : '<span class="muted">—</span>'}</td>
          <td><span class="prod-price">${fmtCurrency(p.price)}</span></td>
          <td>
            <div class="prod-stock-cell">
              <span class="prod-stock-num">${fmtNumber(p.stock)}</span>
              <span class="muted">/ ${fmtNumber(p.threshold)}</span>
            </div>
          </td>
          <td><span class="badge ${statusBadgeClass(status)}">${statusLabel(status)}</span></td>
          <td>
            <div class="row-actions">
              <button class="row-action-btn primary" data-action="stock-in" title="Stock IN">${ICONS.arrowUp}</button>
              <button class="row-action-btn" data-action="stock-out" title="Stock OUT">${ICONS.arrowDown}</button>
              <button class="row-action-btn" data-action="history" title="History">${ICONS.history}</button>
              <button class="row-action-btn" data-action="edit" title="Edit">${ICONS.edit}</button>
              <button class="row-action-btn danger" data-action="delete" title="Delete">${ICONS.trash}</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="products-table-wrap">
        <table class="products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function renderProductsGrid(products) {
    const cards = products.map((p) => {
      const status = statusOf(p);
      return `
        <article class="product-card" data-product-id="${p.id}">
          <div class="product-card-header">
            <div class="prod-thumb">${thumbInitial(p)}</div>
            <div class="product-card-body">
              <div class="product-card-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
              <div class="product-card-sku">${escapeHtml(p.sku)}</div>
            </div>
            <span class="badge ${statusBadgeClass(status)}">${statusLabel(status)}</span>
          </div>
          ${p.category ? `<div><span class="prod-category">${escapeHtml(p.category)}</span></div>` : ''}
          <div class="product-card-meta">
            <div class="product-card-price">${fmtCurrency(p.price)}</div>
            <div class="product-card-stock">${ICONS.box} ${fmtNumber(p.stock)} on hand</div>
          </div>
          <div class="product-card-actions">
            <button class="row-action-btn primary" data-action="stock-in" title="Stock IN">${ICONS.arrowUp}</button>
            <button class="row-action-btn" data-action="stock-out" title="Stock OUT">${ICONS.arrowDown}</button>
            <button class="row-action-btn" data-action="history" title="History">${ICONS.history}</button>
            <button class="row-action-btn" data-action="edit" title="Edit">${ICONS.edit}</button>
            <button class="row-action-btn danger" data-action="delete" title="Delete">${ICONS.trash}</button>
          </div>
        </article>
      `;
    }).join('');
    return `<div class="products-grid">${cards}</div>`;
  }

  function bindProductRowEvents() {
    $$('[data-product-id]').forEach((row) => {
      const id = row.dataset.productId;
      $$('.row-action-btn', row).forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          if (action === 'edit') openProductForm(id);
          else if (action === 'delete') {
            const p = getProduct(id);
            confirmAction('Delete product?', `"${p.name}" will be permanently removed. Transaction history stays as audit trail.`, () => {
              deleteProduct(id);
              renderAll();
              toast('Product deleted', `${p.name} was removed.`, 'success');
            }, 'Delete', 'btn-danger');
          }
          else if (action === 'stock-in' || action === 'stock-out') openStockForm(id, action === 'in' ? 'in' : action.replace('stock-', ''));
          else if (action === 'history') openHistory(id);
        });
      });
    });

    const clearBtn = $('#clear-filters-btn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      ui.productFilters = { search: '', category: '', status: '' };
      $('#search-input').value = '';
      $('#filter-category').value = '';
      $('#filter-status').value = '';
      $('#search-clear').hidden = true;
      renderProductsList();
    });
    const emptyAddBtn = $('#empty-add-btn');
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => openProductForm());
  }

  // ==========================================================
  // PRODUCT FORM
  // ==========================================================
  function openProductForm(id) {
    ui.editingProductId = id || null;
    const isEdit = !!id;
    $('#product-modal-title').textContent = isEdit ? 'Edit product' : 'Add product';
    $('#product-submit').textContent = isEdit ? 'Save changes' : 'Save product';
    const form = $('#product-form');
    form.reset();
    renderCategoryFilter(); // refresh datalist

    if (isEdit) {
      const p = getProduct(id);
      if (!p) return;
      $('#prod-sku').value = p.sku;
      $('#prod-name').value = p.name;
      $('#prod-category').value = p.category;
      $('#prod-price').value = p.price;
      $('#prod-cost').value = p.cost;
      $('#prod-stock').value = p.stock;
      $('#prod-threshold').value = p.threshold;
      $('#prod-supplier').value = p.supplier;
      $('#prod-notes').value = p.notes;
    } else {
      $('#prod-threshold').value = state.settings.defaultThreshold || DEFAULT_LOW_STOCK;
    }
    openModal('product-modal');
  }
  function submitProductForm(e) {
    e.preventDefault();
    const data = {
      sku: $('#prod-sku').value,
      name: $('#prod-name').value,
      category: $('#prod-category').value,
      price: $('#prod-price').value,
      cost: $('#prod-cost').value,
      stock: $('#prod-stock').value,
      threshold: $('#prod-threshold').value,
      supplier: $('#prod-supplier').value,
      notes: $('#prod-notes').value
    };
    if (!data.sku.trim() || !data.name.trim()) {
      toast('Missing fields', 'SKU and product name are required.', 'warning');
      return;
    }
    // Duplicate SKU check
    const dup = state.products.find((p) => p.sku.toLowerCase() === data.sku.trim().toLowerCase() && p.id !== ui.editingProductId);
    if (dup) {
      toast('Duplicate SKU', `SKU "${data.sku}" is already used by "${dup.name}".`, 'warning');
      return;
    }
    if (ui.editingProductId) {
      const p = updateProduct(ui.editingProductId, data);
      toast('Product updated', p.name, 'success');
    } else {
      const p = createProduct(data);
      toast('Product added', p.name, 'success');
    }
    closeModal('product-modal');
    renderAll();
  }

  // ==========================================================
  // STOCK FORM
  // ==========================================================
  function openStockForm(productId, defaultType) {
    const p = getProduct(productId);
    if (!p) return;
    ui.stockProductId = productId;
    $('#stock-summary').innerHTML = `
      <div class="stock-summary-name">${escapeHtml(p.name)}</div>
      <div class="stock-summary-sku">${escapeHtml(p.sku)}</div>
      <div class="stock-summary-current">Current stock: <strong>${fmtNumber(p.stock)}</strong> · Threshold: <strong>${fmtNumber(p.threshold)}</strong></div>
    `;
    const type = defaultType || 'in';
    document.getElementById('stock-' + type).checked = true;
    $('#stock-qty').value = '1';
    $('#stock-note').value = '';
    openModal('stock-modal');
  }
  function submitStockForm(e) {
    e.preventDefault();
    const type = $$('input[name="stock-type"]').find((r) => r.checked).value;
    const qty = parseInt($('#stock-qty').value, 10);
    const note = $('#stock-note').value;
    if (!qty || qty < 1) {
      toast('Invalid quantity', 'Enter a quantity of 1 or more.', 'warning');
      return;
    }
    if (adjustStock(ui.stockProductId, type, qty, note)) {
      const p = getProduct(ui.stockProductId);
      toast(
        type === 'in' ? 'Stock added' : 'Stock removed',
        `${qty} × ${p.name} · now ${p.stock} on hand`,
        type === 'in' ? 'success' : 'info'
      );
      closeModal('stock-modal');
      renderAll();
    }
  }

  // ==========================================================
  // PRODUCT HISTORY MODAL
  // ==========================================================
  function openHistory(productId) {
    const p = getProduct(productId);
    if (!p) return;
    $('#history-modal-title').textContent = `History — ${p.name}`;
    const txs = state.transactions.filter((tx) => tx.productId === productId);
    if (txs.length === 0) {
      $('#history-modal-body').innerHTML = `<p class="muted">No movements logged yet.</p>`;
    } else {
      $('#history-modal-body').innerHTML = txs.map(renderTxEntry).join('');
    }
    openModal('history-modal');
  }

  // ==========================================================
  // TRANSACTIONS VIEW
  // ==========================================================
  function txTypeLabel(t) {
    return { in: 'Stock IN', out: 'Stock OUT', create: 'Created', update: 'Edited', delete: 'Deleted' }[t] || t;
  }
  function txIcon(t) {
    return {
      in: ICONS.arrowUp, out: ICONS.arrowDown, create: ICONS.plus, update: ICONS.edit, delete: ICONS.trash
    }[t] || ICONS.info;
  }
  function renderTxEntry(tx) {
    const sign = tx.type === 'in' ? '+' : (tx.type === 'out' || tx.type === 'delete' ? '-' : '');
    const amountClass = (tx.type === 'in' || tx.type === 'create') ? 'tx-amount--positive' : (tx.type === 'out' || tx.type === 'delete' ? 'tx-amount--negative' : '');
    const qtyText = tx.qty != null ? `${sign}${Math.abs(tx.qty)}` : '';
    return `
      <div class="tx-entry">
        <div class="tx-icon tx-icon--${tx.type}">${txIcon(tx.type)}</div>
        <div class="tx-body">
          <div class="tx-title">${escapeHtml(tx.productName || '(deleted product)')} <span class="muted">· ${txTypeLabel(tx.type)}</span></div>
          <div class="tx-meta">${escapeHtml(tx.sku)} · ${escapeHtml(tx.note || '—')} · ${fmtRelative(tx.timestamp)}</div>
        </div>
        ${qtyText ? `<div class="tx-amount ${amountClass}">${qtyText}</div>` : ''}
      </div>
    `;
  }
  function getFilteredTransactions() {
    const { search, type } = ui.txFilters;
    const q = (search || '').toLowerCase().trim();
    return state.transactions.filter((tx) => {
      if (type && tx.type !== type) return false;
      if (q) {
        const hay = `${tx.sku} ${tx.productName} ${tx.note} ${txTypeLabel(tx.type)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }
  function renderTransactions() {
    const container = $('#transactions-container');
    const txs = getFilteredTransactions();
    if (txs.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="border:none;background:transparent;">
          <div class="empty-icon">${ICONS.history}</div>
          <div class="empty-title">No transactions match</div>
          <div class="empty-text">Movements you record will appear here, time-stamped and immutable.</div>
        </div>
      `;
      return;
    }
    container.innerHTML = txs.map(renderTxEntry).join('');
  }

  // ==========================================================
  // DASHBOARD VIEW
  // ==========================================================
  function renderDashboard() {
    const s = getStats();
    $('#dashboard-stats').innerHTML = `
      <article class="stat-card">
        <div class="stat-icon stat-icon--primary">${ICONS.box}</div>
        <div class="stat-body">
          <div class="stat-label">SKUs tracked</div>
          <div class="stat-value">${fmtNumber(s.total)}</div>
          <div class="stat-trend">${fmtNumber(s.totalStock)} units total</div>
        </div>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon--success">${ICONS.cash}</div>
        <div class="stat-body">
          <div class="stat-label">On-hand value</div>
          <div class="stat-value">${fmtCurrency(s.totalValue)}</div>
          <div class="stat-trend">At current sell price</div>
        </div>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon--warning">${ICONS.warning}</div>
        <div class="stat-body">
          <div class="stat-label">Needs attention</div>
          <div class="stat-value">${fmtNumber(s.lowStock + s.outStock)}</div>
          <div class="stat-trend">${s.lowStock} low · ${s.outStock} out</div>
        </div>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon--blue">${ICONS.history}</div>
        <div class="stat-body">
          <div class="stat-label">Movements logged</div>
          <div class="stat-value">${fmtNumber(state.transactions.length)}</div>
          <div class="stat-trend">All time</div>
        </div>
      </article>
    `;

    // Low stock list
    const lowProducts = state.products
      .filter((p) => statusOf(p) === 'low' || statusOf(p) === 'out')
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6);
    const lowEl = $('#dashboard-low-stock');
    if (lowProducts.length === 0) {
      lowEl.innerHTML = `<p class="muted" style="margin:0;">All stock levels are healthy.</p>`;
    } else {
      lowEl.innerHTML = lowProducts.map((p) => {
        const pct = Math.min(100, Math.max(0, (p.stock / (p.threshold || 1)) * 100));
        return `
          <div class="low-stock-row">
            <div class="ls-name">
              <strong>${escapeHtml(p.name)}</strong>
              <span>${escapeHtml(p.sku)}</span>
            </div>
            <div class="ls-meter"><div class="ls-meter-fill" style="width:${pct}%"></div></div>
            <span class="badge ${statusBadgeClass(statusOf(p))}">${fmtNumber(p.stock)}/${fmtNumber(p.threshold)}</span>
          </div>
        `;
      }).join('');
    }

    // Recent transactions
    const recentTxs = state.transactions.slice(0, 6);
    const txEl = $('#dashboard-recent-tx');
    if (recentTxs.length === 0) {
      txEl.innerHTML = `<p class="muted" style="margin:0;padding:0 20px;">No movements yet.</p>`;
    } else {
      txEl.innerHTML = recentTxs.map(renderTxEntry).join('');
    }
  }

  // ==========================================================
  // SETTINGS VIEW
  // ==========================================================
  function renderSettings() {
    $('#setting-brand').value = state.settings.brandName || 'Forge';
    $('#setting-currency').value = state.settings.currency || '₱';
    $('#setting-threshold').value = state.settings.defaultThreshold || DEFAULT_LOW_STOCK;
    $$('input[name="theme"]').forEach((r) => (r.checked = r.value === state.settings.theme));
  }
  function saveSettings() {
    state.settings.brandName = $('#setting-brand').value.trim() || 'Forge';
    state.settings.currency = $('#setting-currency').value.trim() || '₱';
    state.settings.defaultThreshold = parseInt($('#setting-threshold').value, 10) || DEFAULT_LOW_STOCK;
    saveState();
    document.querySelector('.brand-name').textContent = state.settings.brandName;
    document.title = state.settings.brandName + ' — Inventory Suite';
    toast('Settings saved', 'Workspace updated.', 'success');
    renderAll();
  }

  // ==========================================================
  // CSV
  // ==========================================================
  function exportCSV() {
    const headers = ['SKU', 'Name', 'Category', 'Stock', 'Threshold', 'Price', 'Cost', 'Supplier', 'Notes'];
    const rows = state.products.map((p) => [
      p.sku, p.name, p.category, p.stock, p.threshold, p.price, p.cost, p.supplier, p.notes
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`forge-inventory-${stamp}.csv`, csv, 'text/csv;charset=utf-8');
    toast('Exported', `${state.products.length} products exported as CSV.`, 'success');
  }
  function exportTxCSV() {
    const headers = ['Timestamp', 'Type', 'SKU', 'Product', 'Quantity', 'Note'];
    const rows = state.transactions.map((tx) => [
      tx.timestamp, txTypeLabel(tx.type), tx.sku, tx.productName, tx.qty, tx.note || ''
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`forge-transactions-${stamp}.csv`, csv, 'text/csv;charset=utf-8');
    toast('Exported', `${state.transactions.length} transactions exported.`, 'success');
  }
  function csvCell(v) {
    const s = String(v == null ? '' : v);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function parseCSV(text) {
    const rows = [];
    let row = [], cur = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; }
        } else { cur += ch; }
      } else {
        if (ch === '"') { inQ = true; }
        else if (ch === ',') { row.push(cur); cur = ''; }
        else if (ch === '\r') { /* skip */ }
        else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
        else { cur += ch; }
      }
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }
  function importCSV(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(String(e.target.result || ''));
        if (rows.length < 2) {
          toast('Empty CSV', 'No data rows found.', 'warning');
          return;
        }
        const headers = rows[0].map((h) => h.trim().toLowerCase());
        const col = (k) => headers.findIndex((h) => h === k || h === k.replace('_', ' '));
        const cSku = col('sku'), cName = col('name'), cCat = col('category'),
              cStock = col('stock'), cThr = col('threshold'), cPrice = col('price'),
              cCost = col('cost'), cSup = col('supplier'), cNotes = col('notes');
        if (cSku < 0 || cName < 0) {
          toast('CSV format error', 'Required columns: sku, name. Optional: category, stock, threshold, price, cost, supplier, notes.', 'danger', 6000);
          return;
        }
        let added = 0, updated = 0, skipped = 0;
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.length === 0 || (r.length === 1 && !r[0])) continue;
          const sku = (r[cSku] || '').trim();
          const name = (r[cName] || '').trim();
          if (!sku || !name) { skipped++; continue; }
          const data = {
            sku,
            name,
            category: cCat >= 0 ? r[cCat] : '',
            stock: cStock >= 0 ? r[cStock] : 0,
            threshold: cThr >= 0 ? r[cThr] : state.settings.defaultThreshold,
            price: cPrice >= 0 ? r[cPrice] : 0,
            cost: cCost >= 0 ? r[cCost] : 0,
            supplier: cSup >= 0 ? r[cSup] : '',
            notes: cNotes >= 0 ? r[cNotes] : ''
          };
          const existing = state.products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
          if (existing) {
            updateProduct(existing.id, data);
            updated++;
          } else {
            createProduct(data);
            added++;
          }
        }
        renderAll();
        toast('Import complete', `${added} added · ${updated} updated${skipped ? ' · ' + skipped + ' skipped' : ''}`, 'success');
      } catch (err) {
        console.error(err);
        toast('Import failed', err.message || 'Could not parse CSV.', 'danger');
      }
    };
    reader.readAsText(file);
  }

  // ==========================================================
  // JSON IMPORT/EXPORT (full backup)
  // ==========================================================
  function exportJSON() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`forge-backup-${stamp}.json`, JSON.stringify(state, null, 2), 'application/json');
    toast('Backup exported', `Full workspace exported as JSON.`, 'success');
  }
  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(String(e.target.result || ''));
        if (!parsed || !Array.isArray(parsed.products) || !Array.isArray(parsed.transactions)) {
          toast('Invalid backup', 'JSON must include products[] and transactions[].', 'danger');
          return;
        }
        confirmAction('Replace all data?',
          `This will replace ${state.products.length} products and ${state.transactions.length} transactions with the backup file.`,
          () => {
            state.products = parsed.products;
            state.transactions = parsed.transactions;
            if (parsed.settings) state.settings = Object.assign(state.settings, parsed.settings);
            saveState();
            applyTheme(state.settings.theme);
            renderAll();
            toast('Backup restored', 'Workspace updated.', 'success');
          }, 'Replace data', 'btn-danger');
      } catch (err) {
        toast('Import failed', err.message || 'Could not parse JSON.', 'danger');
      }
    };
    reader.readAsText(file);
  }

  // ==========================================================
  // WIPE & RESET
  // ==========================================================
  function wipeAll() {
    confirmAction('Wipe everything?',
      'This permanently deletes all products and transactions. The workspace will be empty after.',
      () => {
        state.products = [];
        state.transactions = [];
        saveState();
        renderAll();
        toast('Workspace wiped', 'All data cleared.', 'success');
      }, 'Wipe data', 'btn-danger');
  }
  function resetDemo() {
    confirmAction('Reset to demo data?',
      'This will wipe your current data and re-seed the demo auto-parts inventory.',
      () => {
        state.products = [];
        state.transactions = [];
        saveState();
        maybeSeed();
        renderAll();
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
    ui.cmdkQuery = '';
    ui.cmdkSelectedIndex = 0;
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
      { kind: 'action', icon: ICONS.plus,     title: 'Add new product',     meta: 'Open the add-product form',  run: () => openProductForm(), keywords: 'add new product create' },
      { kind: 'action', icon: ICONS.box,      title: 'Go to Products',      meta: 'Inventory list',             run: () => switchView('products'), keywords: 'inventory products list' },
      { kind: 'action', icon: ICONS.history,  title: 'Go to Transactions',  meta: 'Audit trail',                run: () => switchView('transactions'), keywords: 'logs history transactions' },
      { kind: 'action', icon: ICONS.info,     title: 'Go to Dashboard',     meta: 'Overview',                   run: () => switchView('dashboard'), keywords: 'dashboard home overview' },
      { kind: 'action', icon: ICONS.settings, title: 'Go to Settings',      meta: 'Workspace',                  run: () => switchView('settings'), keywords: 'settings config preferences' },
      { kind: 'action', icon: ICONS.moonSun,  title: 'Toggle dark/light',   meta: 'Theme',                      run: () => toggleTheme(), keywords: 'theme dark light mode' },
      { kind: 'action', icon: ICONS.arrowDown,title: 'Export inventory CSV',meta: 'Download products',          run: () => exportCSV(), keywords: 'export csv download' },
      { kind: 'action', icon: ICONS.history,  title: 'Reset demo data',     meta: 'Re-seed sample inventory',   run: () => resetDemo(), keywords: 'reset demo seed sample' }
    ];
    const products = state.products.map((p) => ({
      kind: 'product',
      icon: ICONS.package,
      title: p.name,
      meta: `${p.sku} · ${fmtNumber(p.stock)} on hand · ${fmtCurrency(p.price)}`,
      run: () => { switchView('products'); openStockForm(p.id, 'in'); },
      keywords: `${p.sku} ${p.name} ${p.category} ${p.supplier}`.toLowerCase()
    }));

    if (!q) {
      return [
        { groupTitle: 'Quick actions', items: actions.slice(0, 5) },
        { groupTitle: 'Products', items: products.slice(0, 6) }
      ];
    }
    const filterFn = (i) => i.title.toLowerCase().includes(q) || (i.keywords || '').includes(q);
    const fa = actions.filter(filterFn);
    const fp = products.filter(filterFn);
    const groups = [];
    if (fa.length) groups.push({ groupTitle: 'Actions', items: fa });
    if (fp.length) groups.push({ groupTitle: 'Products', items: fp.slice(0, 12) });
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
    let html = '';
    let idx = 0;
    groups.forEach((g) => {
      html += `<div class="cmdk-group-title">${escapeHtml(g.groupTitle)}</div>`;
      g.items.forEach((it) => {
        const active = idx === ui.cmdkSelectedIndex ? 'is-active' : '';
        html += `
          <div class="cmdk-item ${active}" data-idx="${idx}" role="option">
            <div class="cmdk-item-icon">${it.icon}</div>
            <div class="cmdk-item-body">
              <div class="cmdk-item-title">${escapeHtml(it.title)}</div>
              <div class="cmdk-item-meta">${escapeHtml(it.meta || '')}</div>
            </div>
            <div class="cmdk-item-kbd">${it.kind === 'product' ? 'open' : 'run'}</div>
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
  // RENDER ALL
  // ==========================================================
  function renderAll() {
    renderNavBadges();
    renderCategoryFilter();
    renderProductsStats();
    renderProductsList();
    if (ui.view === 'dashboard') renderDashboard();
    if (ui.view === 'transactions') renderTransactions();
    if (ui.view === 'settings') renderSettings();
  }

  // ==========================================================
  // EVENT BINDING
  // ==========================================================
  function bindEvents() {
    // Sidebar nav
    $$('.nav-item').forEach((n) => n.addEventListener('click', () => switchView(n.dataset.view)));
    // Bottom nav
    $$('.bottom-nav-item[data-view]').forEach((b) => b.addEventListener('click', () => switchView(b.dataset.view)));
    $('#bottom-nav-fab').addEventListener('click', () => openProductForm());

    // Sidebar toggle (mobile)
    $('#sidebar-toggle').addEventListener('click', () => {
      const sb = $('#sidebar');
      sb.classList.add('is-open');
      $('#sidebar-backdrop').classList.add('is-visible');
      document.body.style.overflow = 'hidden';
    });
    $('#sidebar-backdrop').addEventListener('click', () => {
      $('#sidebar').classList.remove('is-open');
      $('#sidebar-backdrop').classList.remove('is-visible');
      document.body.style.overflow = '';
    });

    // Theme toggle (topbar quick)
    $('#theme-toggle').addEventListener('click', toggleTheme);

    // Dashboard "view all" links
    $$('[data-view-jump]').forEach((b) => {
      b.addEventListener('click', () => {
        switchView(b.dataset.viewJump);
        if (b.dataset.filterStatus) {
          ui.productFilters.status = b.dataset.filterStatus;
          $('#filter-status').value = b.dataset.filterStatus;
          renderProductsList();
        }
      });
    });

    // Add product
    $('#add-product-btn').addEventListener('click', () => openProductForm());
    $('#product-form').addEventListener('submit', submitProductForm);

    // Stock form
    $('#stock-form').addEventListener('submit', submitStockForm);

    // Confirm dialog
    $('#confirm-ok').addEventListener('click', () => {
      if (typeof ui.pendingConfirm === 'function') {
        const cb = ui.pendingConfirm;
        ui.pendingConfirm = null;
        cb();
      }
      closeModal('confirm-modal');
    });

    // Generic modal close
    $$('[data-modal-close]').forEach((b) => b.addEventListener('click', () => {
      const overlay = b.closest('.modal-overlay');
      if (overlay) overlay.hidden = true;
    }));
    $$('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.hidden = true;
      });
    });

    // Filters
    const onSearch = debounce(() => {
      ui.productFilters.search = $('#search-input').value;
      $('#search-clear').hidden = !ui.productFilters.search;
      renderProductsList();
    }, 120);
    $('#search-input').addEventListener('input', onSearch);
    $('#search-clear').addEventListener('click', () => {
      $('#search-input').value = '';
      ui.productFilters.search = '';
      $('#search-clear').hidden = true;
      renderProductsList();
    });
    $('#filter-category').addEventListener('change', (e) => {
      ui.productFilters.category = e.target.value;
      renderProductsList();
    });
    $('#filter-status').addEventListener('change', (e) => {
      ui.productFilters.status = e.target.value;
      renderProductsList();
    });

    // Transaction filters
    const onTxSearch = debounce(() => {
      ui.txFilters.search = $('#tx-search-input').value;
      renderTransactions();
    }, 120);
    $('#tx-search-input').addEventListener('input', onTxSearch);
    $('#tx-filter-type').addEventListener('change', (e) => {
      ui.txFilters.type = e.target.value;
      renderTransactions();
    });

    // View mode toggle
    $$('.view-toggle-btn').forEach((b) => {
      b.addEventListener('click', () => {
        $$('.view-toggle-btn').forEach((x) => x.classList.remove('is-active'));
        b.classList.add('is-active');
        ui.viewMode = b.dataset.mode;
        renderProductsList();
      });
    });

    // Import/Export
    $('#export-btn').addEventListener('click', exportCSV);
    $('#export-tx-btn').addEventListener('click', exportTxCSV);
    $('#import-file').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) importCSV(f);
      e.target.value = '';
    });

    // Settings actions
    $('#settings-save-btn').addEventListener('click', saveSettings);
    $('#export-all-btn').addEventListener('click', exportJSON);
    $('#import-all-file').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) importJSON(f);
      e.target.value = '';
    });
    $('#import-all-btn').addEventListener('click', () => $('#import-all-file').click());
    $('#wipe-all-btn').addEventListener('click', wipeAll);
    $$('input[name="theme"]').forEach((r) => r.addEventListener('change', (e) => applyTheme(e.target.value)));

    // Reset demo
    $('#reset-demo-btn').addEventListener('click', resetDemo);

    // Cmd+K trigger
    $('#cmdk-trigger').addEventListener('click', openCmdK);
    $('#cmdk-close').addEventListener('click', closeCmdK);
    $('#cmdk-overlay').addEventListener('click', (e) => {
      if (e.target === $('#cmdk-overlay')) closeCmdK();
    });
    $('#cmdk-input').addEventListener('input', (e) => {
      ui.cmdkQuery = e.target.value;
      ui.cmdkSelectedIndex = 0;
      renderCmdK();
    });

    // Global keyboard
    document.addEventListener('keydown', (e) => {
      // Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        ui.cmdkOpen ? closeCmdK() : openCmdK();
        return;
      }
      // Escape closes modals
      if (e.key === 'Escape') {
        if (ui.cmdkOpen) { closeCmdK(); return; }
        const openOverlay = $$('.modal-overlay').find((m) => !m.hidden);
        if (openOverlay) openOverlay.hidden = true;
      }
      // Cmd+K nav
      handleCmdKKey(e);
      // "/" focuses search when on products view and no input is focused
      if (e.key === '/' && ui.view === 'products' && !ui.cmdkOpen) {
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          $('#search-input').focus();
        }
      }
    });

    // System theme change (when in 'auto' mode)
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

    // Apply branding from settings
    document.querySelector('.brand-name').textContent = state.settings.brandName || 'Forge';
    document.title = (state.settings.brandName || 'Forge') + ' — Inventory Suite';

    bindEvents();

    // Skeleton flash for "loading" feel, then render
    setTimeout(() => {
      $('#boot-splash').classList.add('is-hiding');
      $('#app').hidden = false;
      renderAll();
      setTimeout(() => $('#boot-splash').remove(), 400);
    }, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
