// Organizing (3.101): one context menu and one drag for every list of folders, decks and documents.
// - ML.ctx.add(selector, el => items): right-click, a long press on touch, or the Menu key / Shift+F10 on a focused
//   element opens a menu. An item is { label, fn, danger, armed (two taps), colors: { value, pick(v) }, sep }.
// - ML.dragSort({ root, item, id, drop(dragId, targetId, where), into?(dragId, targetId), zone? }): a row is dragged
//   with the mouse (after a few pixels) or the finger (long press, then move). where = 'before' | 'after' | 'into';
//   elements with data-drop-into="<id>" (a back button, a header) take a drop 'into' that id ('' = the top).
// A long press that does not move opens the menu; one that moves drags. Colours are the world's --ev-1..8 slots.
(() => {
  'use strict';
  const { t, esc } = ML;
  ML.addStrings({
    fr: { og_color: 'Couleur', og_nocolor: 'Sans couleur', og_menu: 'Actions', og_moved: 'Déplacé', og_drag_hint: 'Glisse pour ranger. Clic droit ou appui long : plus d’actions.' },
    en: { og_color: 'Colour', og_nocolor: 'No colour', og_menu: 'Actions', og_moved: 'Moved', og_drag_hint: 'Drag to arrange. Right-click or long press: more actions.' },
  });
  ML.COLORS = ['ev-1', 'ev-2', 'ev-3', 'ev-4', 'ev-5', 'ev-6', 'ev-7', 'ev-8'];
  ML.colorVar = c => (c && /^ev-[1-8]$/.test(c) ? `var(--${c})` : '');

  /* ---------- Context menu ---------- */
  const providers = [];
  let menu = null, back = null;
  function closeMenu() {
    if (!menu) return;
    menu.remove(); menu = null;
    document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', keys, true);
    removeEventListener('resize', closeMenu); removeEventListener('scroll', closeMenu, true);
    if (back && back.isConnected) try { back.focus({ preventScroll: true }); } catch (e) {}
  }
  const outside = e => { if (menu && !menu.contains(e.target)) closeMenu(); };
  function keys(e) {
    if (!menu) return;
    const its = [...menu.querySelectorAll('[role^="menuitem"]')], at = its.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); its[(at + (e.key === 'ArrowDown' ? 1 : -1) + its.length) % its.length].focus(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { if (document.activeElement && document.activeElement.classList.contains('og-sw')) { e.preventDefault(); e.stopPropagation(); const sw = [...menu.querySelectorAll('.og-sw')], j = sw.indexOf(document.activeElement); sw[(j + (e.key === 'ArrowRight' ? 1 : -1) + sw.length) % sw.length].focus(); } }
    else if (e.key === 'Tab') { e.preventDefault(); closeMenu(); }
    else e.stopPropagation(); // the app's single-key shortcuts stay off
  }
  function openMenu(items, x, y, title) {
    closeMenu();
    items = items.filter(Boolean); if (!items.length) return;
    back = document.activeElement;
    menu = document.createElement('div');
    menu.className = 'og-menu'; menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', title || t('og_menu'));
    menu.innerHTML = (title ? `<p class="og-title" aria-hidden="true">${esc(title)}</p>` : '') + items.map((it, i) => it.sep ? '<hr>'
      : it.colors ? `<div class="og-colors" role="group" aria-label="${esc(it.label || t('og_color'))}"><span aria-hidden="true">${esc(it.label || t('og_color'))}</span><div>${['', ...ML.COLORS].map(c => `<button type="button" role="menuitemradio" class="og-sw${c ? '' : ' og-none'}" data-i="${i}" data-c="${c}" aria-checked="${(it.colors.value || '') === c}" aria-label="${esc(c ? t('og_color') + ' ' + c.slice(3) : t('og_nocolor'))}" title="${esc(c ? '' : t('og_nocolor'))}"${c ? ` style="--sw:var(--${c})"` : ''}></button>`).join('')}</div></div>`
      : `<button type="button" role="menuitem" class="og-it${it.danger ? ' danger' : ''}" data-i="${i}">${esc(it.label)}</button>`).join('');
    document.body.appendChild(menu);
    menu.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const it = items[+b.dataset.i]; if (!it) return;
      if (it.colors) { closeMenu(); it.colors.pick(b.dataset.c || ''); return; }
      if (it.armed && !b.dataset.armed) { b.dataset.armed = '1'; b.textContent = t('tap_again'); setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = it.label; } }, 3000); return; }
      closeMenu(); it.fn && it.fn();
    });
    const W = innerWidth, H = innerHeight, r = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(x, W - r.width - 8)) + 'px';
    menu.style.top = Math.max(8, y + r.height > H - 8 ? y - r.height : y) + 'px';
    const first = menu.querySelector('[role="menuitem"]') || menu.querySelector('[role^="menuitem"]'); if (first) first.focus({ preventScroll: true });
    setTimeout(() => { document.addEventListener('pointerdown', outside, true); }, 0);
    document.addEventListener('keydown', keys, true); addEventListener('resize', closeMenu); addEventListener('scroll', closeMenu, true);
  }
  const findProvider = el => { for (const p of providers) { const m = el && el.closest && el.closest(p.sel); if (m) return [p, m]; } return null; };
  function openFor(el, x, y) {
    const f = findProvider(el); if (!f) return false;
    const [p, m] = f, items = p.items(m); if (!items || !items.length) return false;
    if (x == null) { const r = m.getBoundingClientRect(); x = r.left + Math.min(24, r.width / 2); y = r.bottom; }
    openMenu(items, x, y, p.title ? p.title(m) : '');
    return true;
  }
  ML.ctx = { add: (sel, items, title) => providers.push({ sel, items, title }), open: openMenu, close: closeMenu, openFor };
  document.addEventListener('contextmenu', e => {
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable="true"]')) return; // the browser's own menu to copy and paste
    if (openFor(e.target, e.clientX, e.clientY)) e.preventDefault();
  });
  document.addEventListener('keydown', e => {
    if (!(e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) || ML.isTyping(e)) return;
    if (openFor(document.activeElement)) e.preventDefault();
  });

  /* ---------- Drag to arrange ---------- */
  const sorts = [];
  ML.dragSort = o => sorts.push(o);
  const LONG = 420, SLOP = 8;
  let g = null; // the gesture: { s, el, id, x, y, touch, timer, armed, dragging, ghost, line, over, where }
  const sortOf = el => { for (const s of sorts) { const root = typeof s.root === 'function' ? s.root() : s.root, it = root && el.closest && el.closest(s.item); if (it && root.contains(it)) return [s, it, root]; } return null; };
  document.addEventListener('pointerdown', e => {
    if (e.button !== 0 || g || menu) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"], .og-nodrag')) return;
    const f = sortOf(e.target); if (!f) return;
    const [s, el, root] = f, id = s.id(el); if (!id) return;
    g = { s, el, id, root, x: e.clientX, y: e.clientY, touch: e.pointerType !== 'mouse', pid: e.pointerId };
    // Arrange mode (3.115, B3): a finger on a row's grip drags at once, no long press
    if (g.touch && e.target.closest('.og-grip')) { g.armed = g.grip = true; e.preventDefault(); return; }
    if (g.touch) g.timer = setTimeout(() => { if (!g) return; g.armed = true; el.classList.add('og-armed'); if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) {} }, LONG);
  }, true);
  document.addEventListener('pointermove', e => {
    if (!g || e.pointerId !== g.pid) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y, far = Math.hypot(dx, dy) > SLOP;
    if (!g.dragging) {
      if (g.touch && !g.armed) { if (far) cancel(); return; } // a scroll
      if (!far) return;
      begin();
    }
    move(e.clientX, e.clientY);
  }, true);
  // a finger that has armed a row must not scroll the page
  document.addEventListener('touchmove', e => { if (g && (g.armed || g.dragging)) e.preventDefault(); }, { passive: false });
  document.addEventListener('pointerup', e => {
    if (!g || e.pointerId !== g.pid) return;
    if (g.dragging) { finish(); return; }
    if (g.touch && g.armed && !g.grip) { const el = g.el, x = g.x, y = g.y; cancel(); swallowClick(); openFor(el, x, y); return; } // long press, no move: the menu
    cancel();
  }, true);
  document.addEventListener('pointercancel', () => { if (g && !g.dragging) cancel(); else if (g) { stop(); } }, true);
  function swallowClick() { const k = e => { e.stopPropagation(); e.preventDefault(); }; document.addEventListener('click', k, true); setTimeout(() => document.removeEventListener('click', k, true), 350); }
  function begin() {
    clearTimeout(g.timer); g.dragging = true;
    const r = g.el.getBoundingClientRect();
    g.dx = g.x - r.left; g.dy = g.y - r.top;
    g.ghost = g.el.cloneNode(true); g.ghost.className += ' og-ghost'; g.ghost.removeAttribute('id');
    Object.assign(g.ghost.style, { width: r.width + 'px', left: r.left + 'px', top: r.top + 'px' });
    g.line = document.createElement('i'); g.line.className = 'og-line';
    document.body.append(g.ghost, g.line);
    g.el.classList.add('og-src'); document.documentElement.classList.add('og-dragging');
    try { window.getSelection().removeAllRanges(); } catch (e) {}
  }
  function move(x, y) {
    g.ghost.style.left = x - g.dx + 'px'; g.ghost.style.top = y - g.dy + 'px';
    g.ghost.hidden = true; const under = document.elementFromPoint(x, y); g.ghost.hidden = false;
    document.querySelectorAll('.og-into').forEach(n => n.classList.remove('og-into'));
    g.over = null; g.where = null; g.line.hidden = true;
    const zone = under && under.closest && under.closest('[data-drop-into]');
    if (zone && g.root.contains(zone) || zone && g.s.anyZone) {
      const tid = zone.dataset.dropInto;
      if (tid !== g.id && (!g.s.into || g.s.into(g.id, tid))) { g.over = tid; g.where = 'into'; zone.classList.add('og-into'); }
    } else {
      const it = under && under.closest && under.closest(g.s.item);
      if (it && it !== g.el && g.root.contains(it)) {
        const tid = g.s.id(it), r = it.getBoundingClientRect(), f = (y - r.top) / r.height;
        const canInto = g.s.into && g.s.into(g.id, tid), canOrder = !g.s.order || g.s.order(g.id, tid);
        const where = canInto && (f > .28 && f < .72 || !canOrder) ? 'into' : canOrder ? (f < .5 ? 'before' : 'after') : null;
        if (where) {
          g.over = tid; g.where = where;
          if (where === 'into') it.classList.add('og-into');
          else { g.line.hidden = false; Object.assign(g.line.style, { left: r.left + 'px', width: r.width + 'px', top: (where === 'before' ? r.top : r.bottom) - 1 + 'px' }); }
        }
      }
    }
    // near the top or bottom edge: scroll what holds the list
    const edge = 56, sp = scrollParent(g.root);
    cancelAnimationFrame(g.raf);
    const v = y < edge ? -(edge - y) / 4 : y > innerHeight - edge ? (y - (innerHeight - edge)) / 4 : 0;
    if (v) { const step = () => { if (!g || !g.dragging) return; sp.scrollBy(0, v); g.raf = requestAnimationFrame(step); }; g.raf = requestAnimationFrame(step); }
  }
  const scrollParent = el => { for (let x = el; x && x !== document.body; x = x.parentElement) { const s = getComputedStyle(x).overflowY; if ((s === 'auto' || s === 'scroll') && x.scrollHeight > x.clientHeight) return x; } return document.scrollingElement || document.documentElement; };
  function stop() {
    if (!g) return;
    cancelAnimationFrame(g.raf); clearTimeout(g.timer);
    if (g.ghost) g.ghost.remove(); if (g.line) g.line.remove();
    g.el.classList.remove('og-src', 'og-armed');
    document.querySelectorAll('.og-into').forEach(n => n.classList.remove('og-into'));
    document.documentElement.classList.remove('og-dragging');
    g = null;
  }
  function finish() {
    const { s, id, over, where } = g;
    stop(); swallowClick();
    if (over != null && where) s.drop(id, over, where);
  }
  function cancel() { stop(); }

  // Reorder helper: the list's ids in their new order after moving one before or after another
  ML.reorder = (ids, dragId, targetId, where) => {
    const out = ids.filter(x => x !== dragId), i = out.indexOf(targetId);
    if (i < 0) return out.concat(dragId);
    out.splice(where === 'after' ? i + 1 : i, 0, dragId);
    return out;
  };
})();
