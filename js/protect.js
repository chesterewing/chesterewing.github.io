/* =======================================================
 * Light source-code deterrent
 * Author: Chester Ewing Columna
 *
 * NOTE: Browsers must download a page's source to render it,
 * so anything client-side is bypassable by a determined user.
 * This script only blocks casual right-click / DevTools shortcuts
 * to discourage drive-by copying. For real IP protection,
 * use server-side rendering or watermarked screenshots.
 * ======================================================= */
(function () {
  'use strict';

  // Block right-click context menu
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  // Block common DevTools / view-source / save shortcuts
  document.addEventListener('keydown', function (e) {
    var k = e.key;
    var ctrl = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;

    // F12
    if (k === 'F12') { e.preventDefault(); return false; }

    // Ctrl+U  (view source)
    if (ctrl && (k === 'u' || k === 'U')) { e.preventDefault(); return false; }

    // Ctrl+S  (save page)
    if (ctrl && (k === 's' || k === 'S')) { e.preventDefault(); return false; }

    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C  (DevTools panels)
    if (ctrl && shift && (k === 'I' || k === 'J' || k === 'C' || k === 'i' || k === 'j' || k === 'c')) {
      e.preventDefault();
      return false;
    }
  });

  // Block text selection & drag (use sparingly — also blocks legitimate copy)
  document.addEventListener('selectstart', function (e) {
    if (e.target && e.target.closest('input, textarea, [contenteditable="true"]')) return;
    e.preventDefault();
    return false;
  });
  document.addEventListener('dragstart', function (e) { e.preventDefault(); return false; });

  // Block drag-to-save on images
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('img').forEach(function (img) {
      img.setAttribute('draggable', 'false');
    });
  });
})();
