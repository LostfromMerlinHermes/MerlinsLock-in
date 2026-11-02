// Touch gestures on phones (3.60). Every gesture also has its button.
// A task: swipe right to complete, left to Lock in, press and hold to move it (plan.js does the moving).
// The edge of the screen: swipe to go to the next or previous space. The dial: pull it down to close the Timer screen.
(() => {
  'use strict';
  const { $, S, on } = ML;
  const root = document.documentElement;
  const phone = () => root.classList.contains('mnav-on');
  const busy = () => root.classList.contains('qa-sheet') || root.classList.contains('deep-on') || root.classList.contains('ep-on') || root.classList.contains('qt-on') || root.classList.contains('fc-full') || !!document.querySelector('.overlay:not([hidden])');
  const SWIPE = 84, EDGE = 26, PULL = 90, HOLD = 450, DRAG_ID = 9;

  let g = null; // the gesture in progress
  document.addEventListener('touchstart', e => {
    g = null;
    if (!phone() || e.touches.length !== 1 || busy()) return;
    const p = e.touches[0], tg = e.target;
    const x = p.clientX, y = p.clientY;
    // A task row (not its fields, not while selecting)
    const li = tg.closest('#tasks .pg-list > .task:not(.editing):not(.done)');
    if (li && !tg.closest('input, select, textarea, form, .selecting') && !li.closest('.selecting')) {
      g = { kind: 'task', li, x, y, axis: null };
      g.hold = setTimeout(() => startMove(), HOLD);
      return;
    }
    // The edge of the screen
    if ((x < EDGE || x > innerWidth - EDGE) && !tg.closest('input, textarea, .rd, .pl-scroll, .qt, .pl-pop')) { g = { kind: 'edge', x, y }; return; }
    // The dial, at the top of the Timer screen
    if (root.dataset.mview === 'timer' && scrollY <= 0 && tg.closest('.ring-wrap, .card-head') && !tg.closest('button')) g = { kind: 'pull', y, x, card: $('sigil-card') };
  }, { passive: true });

  function startMove() {
    if (!g || g.kind !== 'task') return;
    const grip = g.li.querySelector('.t-grip'); if (!grip || (S.plan && S.plan.view === 'table')) return;
    g.kind = 'move';
    if (navigator.vibrate) navigator.vibrate(12);
    grip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: g.x, clientY: g.y, pointerId: DRAG_ID }));
  }

  document.addEventListener('touchmove', e => {
    if (!g) return;
    const p = e.touches[0], dx = p.clientX - g.x, dy = p.clientY - g.y;
    if (g.kind === 'move') {
      e.preventDefault();
      dispatchEvent(new PointerEvent('pointermove', { clientX: p.clientX, clientY: p.clientY, pointerId: DRAG_ID }));
      return;
    }
    if (g.kind === 'task') {
      if (!g.axis && Math.hypot(dx, dy) > 9) { g.axis = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'x' : 'y'; clearTimeout(g.hold); }
      if (g.axis === 'y') { g = null; return; }
      if (g.axis === 'x') {
        g.dx = dx;
        const reduced = ML.reducedMotion();
        if (!reduced) g.li.style.transform = `translateX(${dx * .85}px)`;
        g.li.classList.add('swiping');
        g.li.classList.toggle('sw-done', dx > SWIPE); g.li.classList.toggle('sw-lock', dx < -SWIPE);
      }
      return;
    }
    if (g.kind === 'edge') { g.dx = dx; g.dy = dy; return; }
    if (g.kind === 'pull') {
      if (dy <= 0 || Math.abs(dx) > dy) { g.card.style.transform = ''; g.dy = 0; return; }
      g.dy = dy;
      if (!ML.reducedMotion()) g.card.style.transform = `translateY(${dy * .45}px)`;
    }
  }, { passive: false });

  function end(e) {
    const c = g; g = null; if (!c) return;
    clearTimeout(c.hold);
    if (c.kind === 'move') {
      const p = e.changedTouches[0];
      dispatchEvent(new PointerEvent(e.type === 'touchcancel' ? 'pointercancel' : 'pointerup', { clientX: p.clientX, clientY: p.clientY, pointerId: DRAG_ID }));
      return;
    }
    if (c.kind === 'task' && c.axis === 'x') {
      const li = c.li, dx = c.dx || 0, hit = Math.abs(dx) > SWIPE && e.type !== 'touchcancel';
      li.classList.remove('swiping', 'sw-done', 'sw-lock');
      li.style.transform = '';
      if (hit) {
        const b = li.querySelector(dx > 0 ? '[data-act="toggle"]' : '[data-act="focus"]');
        if (b) b.click();
      }
      return;
    }
    if (c.kind === 'edge' && Math.abs(c.dx || 0) > 70 && Math.abs(c.dy || 0) < 50 && e.type !== 'touchcancel') { ML.swipeSpace(c.dx > 0 ? -1 : 1); return; }
    if (c.kind === 'pull') {
      c.card.style.transform = '';
      if ((c.dy || 0) > PULL && e.type !== 'touchcancel') ML.closeTimer();
    }
  }
  document.addEventListener('touchend', end);
  document.addEventListener('touchcancel', end);
  // No long-press menu or text selection on a row being held
  document.addEventListener('contextmenu', e => { if (phone() && e.target.closest && e.target.closest('#tasks .task:not(.editing)')) e.preventDefault(); });
  on('tasks:render', () => { if (g && g.li && !g.li.isConnected) { clearTimeout(g.hold); g = null; } });
})();
