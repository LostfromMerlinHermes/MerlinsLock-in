// The hooded student (3.42): the brand figure "B" from brand/final/session-b-*.svg, whose face is the timer.
// The ring in its face fills with the focus session, a bead marks where it is, the spark in the face glows; at the
// end three sparks appear. Fixed palette (night, gold foil, cream) in every world. Drawing only: where it goes is
// decided separately (see the end of the file). The wizard familiar stays.
(() => {
  'use strict';
  const { S, on, t, toast } = ML;

  ML.addStrings({
    fr: { hood_label: 'Session à {p} %' },
    en: { hood_label: 'Session {p}% done' },
  });

  const RING = 'M50 48.8 A8.4 11.6 0 0 1 50 72 A8.4 11.6 0 0 1 50 48.8';
  const star = (x, y, r) => { const a = r * .12, b = r * .28; return `<path class="hm-c" d="M${x} ${y - r} C${x + a} ${y - b} ${x + b} ${y - a} ${x + r} ${y} C${x + b} ${y + a} ${x + a} ${y + b} ${x} ${y + r} C${x - a} ${y + b} ${x - b} ${y + a} ${x - r} ${y} C${x - b} ${y - a} ${x - a} ${y - b} ${x} ${y - r} Z"/>`; };
  // the bead's point on the ring: starts at the top, goes clockwise
  const bead = p => { const a = 2 * Math.PI * p; return [50 + 8.4 * Math.sin(a), 60.4 - 11.6 * Math.cos(a)]; };
  let uid = 0;

  // One drawing at progress p (0–1); done adds the three closing sparks
  function svg(p = 0, done = false) {
    const id = 'hm' + (++uid), [bx, by] = bead(p);
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="14" y1="6" x2="86" y2="96"><stop class="hm-s1" offset="0" stop-color="#F7DA97"/><stop class="hm-s2" offset=".55" stop-color="#E6B45A"/><stop class="hm-s3" offset="1" stop-color="#B9822E"/></linearGradient></defs>
      <g class="hm-body">
        <path fill="url(#${id})" d="M10 100 Q13 80 31 74 L69 74 Q87 80 90 100 Z"/>
        <path class="hm-sh" d="M50 74 L69 74 Q87 80 90 100 L50 100 Z"/>
        <path fill="url(#${id})" d="M26 78 Q19 58 27 41 Q35 24 50 14 Q58 8 63 3 Q75 1 80 6 Q70 5 65 11 Q62 15 63 21 Q76 36 75 57 Q75 70 71 78 Z"/>
        <path class="hm-sh" d="M63 21 Q76 36 75 57 Q75 70 71 78 L60 78 Q68 60 63 21 Z"/>
        <path class="hm-rim" d="M27.6 74 Q21.4 58 28.6 42 Q36 26 49 16.6" stroke-width="1.1"/>
        <path class="hm-m" fill="#9A6A26" d="M35 74 Q29.6 57 37.4 44 Q50 34.6 62.6 44 Q70.4 57 65 74 Q50 80 35 74 Z"/>
        <g class="hm-face"><path fill="#0A0910" d="M37.6 73 Q33 58 39.6 46.6 Q50 39 60.4 46.6 Q67 58 62.4 73 Q50 78.4 37.6 73 Z"/>
        <path class="hm-line" d="M33.2 54 Q32.6 31.6 50 30 Q67.4 31.6 66.8 54" stroke-width="2.2"/>
        <rect class="hm-c" x="30.2" y="51.6" width="6.2" height="11.4" rx="3"/>
        <rect class="hm-c" x="63.6" y="51.6" width="6.2" height="11.4" rx="3"/>
        <path class="hm-track" d="${RING}" stroke-width="2.6"/>
        <path class="hm-line hm-arc" d="${RING}" pathLength="1" stroke-dasharray="${p} 1" stroke-width="2.6"${p > 0 ? '' : ' visibility="hidden"'}/>
        <circle class="hm-c hm-bead" cx="${bx.toFixed(2)}" cy="${by.toFixed(2)}" r="2.08"${p > 0 && p < 1 ? '' : ' visibility="hidden"'}/>
        <g class="hm-spark"><circle class="hm-glow" cx="50" cy="60.4" r="${done ? 9 : 6}"/>${star(50, 60.4, done ? 5.8 : 5)}</g></g>
        <g class="hm-back"><path fill="url(#${id})" d="M35 74 Q29.6 57 37.4 44 Q50 34.6 62.6 44 Q70.4 57 65 74 Q50 80 35 74 Z"/><path d="M50 38 Q52 56 50 76" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.4"/></g>
      </g>
      ${done ? `<g class="hm-end">${star(87, 30, 5)}${star(14, 38, 2.6)}${star(90, 48, 2)}</g>` : ''}
    </svg>`;
  }

  const progress = rem => {
    const tot = S.total || 1, left = rem != null ? rem : (ML.remainingNow ? ML.remainingNow() : tot);
    return Math.max(0, Math.min(1, 1 - Math.max(0, left) / tot));
  };
  // Move the ring and bead of a drawn figure to p
  function setP(root, p) {
    const arc = root.querySelector('.hm-arc'), dot = root.querySelector('.hm-bead');
    if (!arc) return;
    arc.setAttribute('stroke-dasharray', p + ' 1');
    arc.setAttribute('visibility', p > 0 ? 'visible' : 'hidden');
    const [x, y] = bead(p);
    dot.setAttribute('cx', x.toFixed(2)); dot.setAttribute('cy', y.toFixed(2));
    dot.setAttribute('visibility', p > 0 && p < 1 ? 'visible' : 'hidden');
  }

  // Live figures: an element handed to live() gets the drawing and follows the focus session.
  // .hood.on = a focus session is running or paused (CSS animates it), data-p = rounded percent.
  const lives = new Set();
  let lastP = -1;
  function update(rem) {
    const st = document.documentElement.dataset.timer;
    const show = S.mode === 'focus' && (st === 'running' || st === 'paused');
    const p = show ? progress(rem) : 0;
    const moved = Math.abs(p - lastP) >= .002; // ~500 steps a session is plenty at this size
    if (moved) lastP = p;
    lives.forEach(el => {
      if (!el.isConnected) { lives.delete(el); return; }
      if (el.classList.contains('happy') || el.classList.contains('casting')) return; // the celebration / the charge own the ring
      el.classList.toggle('on', show);
      if (!moved && el.dataset.p != null) return;
      setP(el, p);
      el.dataset.p = Math.round(p * 100);
      el.setAttribute('aria-label', t('hood_label', { p: Math.round(p * 100) }));
    });
  }
  function live(el) {
    el.classList.add('hood'); el.setAttribute('role', 'img');
    el.innerHTML = svg(0); delete el.dataset.p;
    lives.add(el); lastP = -1; update();
    return el;
  }
  on('tick', update);
  on('timer', () => { lastP = -1; update(); });

  // ML.hood.svg(p, done) = a fixed drawing, ML.hood.live(el) = a live one that follows the session.
  ML.hood = { svg, live, setP, progress };

  /* ---------- The living icon (3.42, idea 6 of brand/mascotte-b.html) ----------
     B takes the old hat + monocle's place beside the title (the old .logo stays in the page, hidden there, so the
     hat costumes and the title screen keep working). A click opens a small radial menu whose actions depend on the
     moment; a move past 6 px is a drag: drop it anywhere and it snaps to the nearest screen edge (never on a control),
     drop it back on the header to put it away. The spot is kept per device (localStorage 'mli-hood-pos'). */
  ML.addStrings({
    fr: { hood_btn: 'Merlin : actions rapides (on peut le déplacer)', hm_lock: 'Lock in 25 min', hm_park: 'Garer une idée', hm_music: 'Musique', hm_pause: 'Pause', hm_resume: 'Reprendre', hm_full: 'Plein écran',
      hm_park_ph: 'Une idée à garder pour la pause', hm_park_ok: 'Garer', hm_edge: 'Posé au bord. Ramène-le sur l’en-tête pour le ranger.', hm_home: 'Rangé dans l’en-tête' },
    en: { hood_btn: 'Merlin: quick actions (you can move him)', hm_lock: 'Lock in 25 min', hm_park: 'Park an idea', hm_music: 'Music', hm_pause: 'Pause', hm_resume: 'Resume', hm_full: 'Full screen',
      hm_park_ph: 'An idea to keep for the break', hm_park_ok: 'Park', hm_edge: 'Moved to the edge. Drag him back onto the header to put him away.', hm_home: 'Back in the header' },
  });

  const brand = document.querySelector('.brand');
  if (!brand) return;
  const B = document.createElement('button');
  B.type = 'button'; B.className = 'hood-b'; B.id = 'hood-b';
  brand.insertBefore(B, brand.querySelector('.brand-text'));
  live(B); B.removeAttribute('role');
  const label = () => B.setAttribute('aria-label', t('hood_btn') + (B.dataset.p && B.classList.contains('on') ? ' · ' + t('hood_label', { p: B.dataset.p }) : ''));
  document.documentElement.classList.add('hood-icon');

  // End of a focus session: a small hop and the closing sparks
  let happyT = 0;
  on('session', () => {
    clearTimeout(happyT);
    B.querySelector('.hm-end')?.remove();
    B.querySelector('svg').insertAdjacentHTML('beforeend', svg(1, true).match(/<g class="hm-end">[\s\S]*?<\/g>/)[0]);
    setP(B, 1); B.classList.add('happy');
    happyT = setTimeout(() => { B.classList.remove('happy'); B.querySelector('.hm-end')?.remove(); lastP = -1; update(); }, 3200);
  });

  /* Radial menu. Actions are a list so powers can join: { key, when: 'rest'|'run'|'any', show?(), label(), run(), keep? };
     at most 5 are shown, in this order. */
  const focusOn = () => S.mode === 'focus' && /^(running|paused)$/.test(document.documentElement.dataset.timer || '');
  let castUntil = 0; // a finished hold-to-cast swallows the click that follows
  const actions = [
    { key: 'eve', when: 'rest', show: () => eveReady(), label: () => t('hm_eve'), run: () => eveWord() },
    { key: 'lock', when: 'rest', label: () => t('hm_lock'), run: () => ML.lockIn({ taskId: S.activeId && S.tasks.some(x => x.id === S.activeId && !x.done) ? S.activeId : null, title: S.freeTitle, mins: 25 }) },
    { key: 'pause', when: 'run', label: () => t(ML.running() ? 'hm_pause' : 'hm_resume'), run: () => document.getElementById('start').click() },
    { key: 'park', when: 'any', label: () => t('hm_park'), run: () => parkForm(), keep: true },
    { key: 'music', when: 'rest', label: () => t('hm_music'), run: () => ML.openSound && ML.openSound() },
    { key: 'full', when: 'run', label: () => t('hm_full'), run: () => ML.openDeep && ML.openDeep() },
    { key: 'world', when: 'any', label: () => t(worldOn() ? 'hm_gold' : 'hm_world'), run: () => setWorld(!worldOn()) },
  ];
  ML.hood.actions = actions;

  const menu = document.createElement('div');
  menu.className = 'hood-menu'; menu.id = 'hood-menu'; menu.hidden = true;
  document.body.appendChild(menu);
  let menuOn = false;
  function closeMenu() {
    if (!menuOn) return; menuOn = false;
    menu.classList.remove('on'); B.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!menuOn) { menu.hidden = true; menu.innerHTML = ''; } }, 220);
  }
  function openMenu() {
    const run = focusOn(), list = actions.filter(a => (a.when === 'any' || a.when === (run ? 'run' : 'rest')) && (!a.show || a.show())).slice(0, 5);
    const r = B.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    menu.innerHTML = list.map(a => `<button type="button" data-hm="${a.key}">${ML.esc(a.label())}</button>`).join('');
    menu.hidden = false; menuOn = true; B.setAttribute('aria-expanded', 'true');
    // a quarter circle around him, towards the middle of the screen: one row per action (they never overlap),
    // the first beside him, the last under (or over) him
    const W = innerWidth, H = innerHeight, side = cx < W / 2 ? 1 : -1, dir = cy < H / 2 ? 1 : -1;
    const btns = [...menu.children], step = Math.max(...btns.map(b => b.offsetHeight)) + 8, Rc = (btns.length - 1) * step + 6;
    btns.forEach((btn, i) => {
      const w = btn.offsetWidth, h = btn.offsetHeight, dy = i * step;
      const dx = Math.sqrt(Math.max(0, Rc * Rc - dy * dy)) * .8;
      const inner = Math.max(dx, dy < r.height / 2 + h / 2 + 4 ? r.width / 2 + 8 : -w * .2); // edge facing him
      let x = side > 0 ? cx + inner : cx - inner - w, y = cy + dir * dy - h / 2;
      // in the header, a fan under him instead, so the title stays readable
      if (!B.classList.contains('free')) { x = r.left + (btns.length - 1 - i) * 16; y = r.bottom + 6 + dy; }
      x = Math.max(8, Math.min(W - 8 - w, x)); y = Math.max(8, Math.min(H - 8 - h, y));
      btn.style.setProperty('--fx', cx - (x + w / 2) + 'px'); btn.style.setProperty('--fy', cy - (y + h / 2) + 'px');
      btn.style.left = x + 'px'; btn.style.top = y + 'px';
      btn.style.transitionDelay = i * 30 + 'ms';
    });
    requestAnimationFrame(() => menu.classList.add('on'));
    menu.querySelector('button')?.focus({ preventScroll: true });
  }
  function parkForm() {
    const r = B.getBoundingClientRect();
    menu.innerHTML = `<form class="hm-park" autocomplete="off"><input type="text" maxlength="140" placeholder="${ML.esc(t('hm_park_ph'))}" aria-label="${ML.esc(t('hm_park'))}"><button type="submit">${ML.esc(t('hm_park_ok'))}</button></form>`;
    const f = menu.firstElementChild, w = Math.min(320, innerWidth - 16);
    f.style.width = w + 'px';
    f.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left)) + 'px';
    f.style.top = (r.bottom + 70 < innerHeight ? r.bottom + 8 : r.top - 52) + 'px';
    f.querySelector('input').focus();
    f.addEventListener('submit', e => {
      e.preventDefault();
      const v = f.querySelector('input').value.trim(); if (!v) return closeMenu();
      const inp = document.getElementById('park-input'), form = document.getElementById('park-form');
      inp.value = v; form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
      closeMenu();
    });
  }
  menu.addEventListener('click', e => {
    const b = e.target.closest('[data-hm]'); if (!b) return;
    const a = actions.find(x => x.key === b.dataset.hm); if (!a) return;
    if (!a.keep) closeMenu();
    a.run();
  });
  document.addEventListener('pointerdown', e => { if (menuOn && !menu.contains(e.target) && !B.contains(e.target)) closeMenu(); }, true);
  document.addEventListener('keydown', e => { if (menuOn && e.key === 'Escape') { closeMenu(); B.focus(); } });
  on('timer', () => { if (menuOn && !menu.querySelector('form')) closeMenu(); });

  /* Drag out of the header / back in */
  const KEY = 'mli-hood-pos';
  const store = v => { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch {} };
  const stored = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const FREE = 56, GAP = 10;
  const bottomLimit = () => {
    const bar = document.documentElement.classList.contains('mnav-on') && document.querySelector('.mnav');
    return (bar && bar.offsetHeight ? bar.getBoundingClientRect().top : innerHeight) - GAP;
  };
  const topLimit = () => GAP;
  const isControl = el => el && el !== B && !B.contains(el) && el.closest('button, a, input, select, textarea, [contenteditable="true"], [role="button"], label, .task, .ring-wrap');
  // a spot on an edge with nothing clickable under it: slide along the edge until free (null if the edge is full)
  const topEl = (x, y) => document.elementsFromPoint(x, y).find(e => !e.closest('.toast, .hood-menu, .floaters, .burst'));
  function freeSpot(side, along) {
    const W = innerWidth, top = topLimit(), bot = bottomLimit() - FREE;
    const at = v => side === 'left' ? [GAP, v] : side === 'right' ? [W - FREE - GAP, v] : side === 'top' ? [v, top] : [v, bot];
    const lo = side === 'left' || side === 'right' ? top : GAP, hi = side === 'left' || side === 'right' ? bot : W - FREE - GAP;
    const clear = ([x, y]) => [[.5, .5], [.15, .15], [.85, .15], [.15, .85], [.85, .85]].every(([fx, fy]) => !isControl(topEl(x + FREE * fx, y + FREE * fy)));
    const v0 = Math.max(lo, Math.min(hi, along));
    B.style.visibility = 'hidden';
    try {
      for (let d = 0; d <= hi - lo; d += 12) for (const v of [v0 + d, v0 - d]) if (v >= lo && v <= hi && clear(at(v))) return at(v);
      return null;
    } finally { B.style.visibility = ''; }
  }
  // the chosen edge first, then the others; no free spot anywhere = back in the header (the spot stays remembered)
  function place(pos) {
    if (!pos) return home();
    const W = innerWidth, H = innerHeight, cx = pos.side === 'left' ? 0 : pos.side === 'right' ? W : pos.f * W, cy = pos.side === 'top' ? 0 : pos.side === 'bottom' ? H : pos.f * H;
    let spot = null;
    for (const side of [pos.side, ...['right', 'left', 'bottom', 'top'].filter(s => s !== pos.side)]) {
      spot = freeSpot(side, side === 'left' || side === 'right' ? cy : cx);
      if (spot) break;
    }
    if (!spot) { home(); return false; }
    if (B.parentElement !== document.body) document.body.appendChild(B);
    B.classList.add('free'); B.style.left = spot[0] + 'px'; B.style.top = spot[1] + 'px';
    return true;
  }
  function home() {
    B.classList.remove('free', 'grab'); B.style.left = B.style.top = '';
    if (B.parentElement !== brand) brand.insertBefore(B, brand.querySelector('.brand-text'));
  }
  function overHeader(x, y) {
    const r = brand.getBoundingClientRect();
    return x < r.right + 30 && x > r.left - 30 && y < r.bottom + 30 && y > r.top - 30;
  }

  let sx = null, sy = 0, ox = 0, oy = 0, moved = false, justDragged = false;
  B.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault(); // no text selection while dragging (the click still fires)
    sx = e.clientX; sy = e.clientY; moved = false;
    const r = B.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top;
    addEventListener('pointermove', onMove); addEventListener('pointerup', end); addEventListener('pointercancel', cancel); // on window: moving him into body would drop a pointer capture
  });
  function onMove(e) {
    if (sx == null) return;
    if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return;
    if (!moved) {
      moved = true; closeMenu();
      if (B.parentElement !== document.body) document.body.appendChild(B);
      B.classList.add('free', 'grab'); ox = oy = FREE / 2;
      document.documentElement.classList.add('hood-drag');
    }
    B.style.left = e.clientX - ox + 'px'; B.style.top = e.clientY - oy + 'px';
  }
  function end(e) {
    unhook(); if (sx == null) return;
    sx = null;
    if (!moved) return;
    justDragged = true; setTimeout(() => justDragged = false, 60);
    B.classList.remove('grab'); document.documentElement.classList.remove('hood-drag');
    if (overHeader(e.clientX, e.clientY)) { home(); store(null); toast(t('hm_home'), { key: 'hood' }); return; }
    const W = innerWidth, x = e.clientX - FREE / 2, y = e.clientY - FREE / 2, H = bottomLimit();
    const d = { left: x, right: W - FREE - x, top: y, bottom: H - FREE - y };
    const side = Object.entries(d).sort((a, c) => a[1] - c[1])[0][0];
    const pos = { side, f: side === 'left' || side === 'right' ? y / innerHeight : x / W };
    if (!place(pos)) { store(null); toast(t('hm_home'), { key: 'hood' }); return; }
    store(pos);
    toast(t('hm_edge'), { key: 'hood' });
  }
  function cancel(e) { if (moved) end(e); sx = null; unhook(); }
  function unhook() { removeEventListener('pointermove', onMove); removeEventListener('pointerup', end); removeEventListener('pointercancel', cancel); }
  B.addEventListener('click', e => {
    if (justDragged || Date.now() < castUntil) { e.preventDefault(); return; }
    menuOn ? closeMenu() : openMenu();
  });
  B.addEventListener('keydown', e => e.stopPropagation()); // its own Space/Enter, not the timer shortcut

  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { closeMenu(); if (B.classList.contains('free')) place(stored()); }, 150); });
  on('started', () => { const p = stored(); if (p) place(p); });
  on('render', label); on('tick', label); label();

  /* ---------- Powers (3.42.2, chosen from scene 7 of brand/mascotte-b.html) ----------
     None of them moves him during focus. */
  ML.addStrings({
    en: { hm_world: 'World colour', hm_gold: 'Gold colour', hm_cast: 'Lock in · {m}', hm_eve: 'Evening word', hm_gazette: 'Read the Gazette',
      hm_back1: 'Welcome back.', hm_back2: 'I kept your place. {n} min left.', hm_back3: 'Good to see you again. Shall we go on?', hm_backdone: 'The session ended while you were away. Well done.',
      eve_none: 'No session today. Tomorrow we start again.', eve_calm: 'A calm day: {s}, {m}. That counts.', eve_full: 'A good day: {s}, {m} of focus{d}.',
      eve_s1: '1 session', eve_sn: '{n} sessions', eve_d1: ', 1 task done', eve_dn: ', {n} tasks done',
      eve_streak: '{n} days in a row.', eve_long: 'Longest session: {m}.', eve_tmr: 'Tomorrow: {e} at {h}.', eve_tmr_day: 'Tomorrow: {e}.' },
    fr: { hm_world: 'Couleur du monde', hm_gold: 'Couleur or', hm_cast: 'Lock in · {m}', hm_eve: 'Le mot du soir', hm_gazette: 'Lire la Gazette',
      hm_back1: 'Te revoilà.', hm_back2: 'J’ai gardé ta place. Il reste {n} min.', hm_back3: 'Content de te revoir. On reprend ?', hm_backdone: 'Séance finie pendant ton absence. Bien joué.',
      eve_none: 'Pas de séance aujourd’hui. Demain, on s’y remet.', eve_calm: 'Journée calme : {s}, {m}. C’est déjà ça.', eve_full: 'Belle journée : {s}, {m} de focus{d}.',
      eve_s1: '1 séance', eve_sn: '{n} séances', eve_d1: ', 1 tâche finie', eve_dn: ', {n} tâches finies',
      eve_streak: '{n} jours de suite.', eve_long: 'Plus longue séance : {m}.', eve_tmr: 'Demain : {e} à {h}.', eve_tmr_day: 'Demain : {e}.' },
  });
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { return null; } };
  const flash = cls => { B.classList.remove(cls); void B.offsetWidth; B.classList.add(cls); };
  B.addEventListener('animationend', e => { if (e.animationName === 'hm-hop' && !B.classList.contains('happy')) B.classList.remove('hop'); if (e.animationName === 'hm-nod') B.classList.remove('nod'); });

  // Speech bubble beside him (under him in the top half of the screen, over him below)
  const say = document.createElement('div');
  say.className = 'hood-say'; say.hidden = true; say.setAttribute('role', 'status');
  document.body.appendChild(say);
  let sayT = 0;
  function speak(text, ms = 3000, extra = '') {
    if (document.documentElement.classList.contains('deep-on')) return;
    say.innerHTML = `<p>${ML.esc(text)}</p>${extra}`;
    say.hidden = false; say.classList.remove('on');
    const r = B.getBoundingClientRect(), w = Math.min(280, innerWidth - 16);
    say.style.width = 'max-content'; say.style.maxWidth = w + 'px';
    const sw = say.offsetWidth, sh = say.offsetHeight;
    say.style.left = Math.max(8, Math.min(innerWidth - sw - 8, r.left + r.width / 2 - sw / 2)) + 'px';
    say.style.top = (r.top < innerHeight / 2 ? r.bottom + 8 : r.top - sh - 8) + 'px';
    requestAnimationFrame(() => say.classList.add('on'));
    clearTimeout(sayT); sayT = setTimeout(hush, ms);
  }
  function hush() { say.classList.remove('on'); setTimeout(() => { if (!say.classList.contains('on')) say.hidden = true; }, 350); }
  say.addEventListener('click', e => { if (e.target.closest('[data-gz]')) { hush(); ML.openGazette && ML.openGazette(); } });

  // 1. Hold to cast: at rest, 1.2 s on him charges the ring and starts the session (current task, the mood's minutes)
  const HOLD = 1200;
  let hold = 0;
  function stopCharge() {
    if (!hold) return;
    cancelAnimationFrame(hold); hold = 0;
    B.classList.remove('casting'); setP(B, 0); lastP = -1;
  }
  B.addEventListener('pointerdown', e => {
    if (e.button !== 0 || focusOn() || ML.running()) return;
    const t0 = performance.now();
    B.classList.add('casting');
    hold = requestAnimationFrame(function step(now) {
      if (B.classList.contains('grab')) return stopCharge(); // it became a drag
      const k = Math.min(1, (now - t0) / HOLD);
      setP(B, k * .999);
      if (k < 1) { hold = requestAnimationFrame(step); return; }
      hold = 0; B.classList.remove('casting'); castUntil = Date.now() + 600;
      closeMenu(); flash('hop');
      const open = ML.orderedOpen ? ML.orderedOpen() : [];
      const cur = S.activeId && S.tasks.find(x => x.id === S.activeId && !x.done) || open.find(x => !x.done);
      ML.lockIn({ taskId: cur ? cur.id : null, title: cur ? null : S.freeTitle, mins: S.focusMins });
    });
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(k => B.addEventListener(k, stopCharge));
  B.addEventListener('contextmenu', e => e.preventDefault());

  // 2. World colour, chosen by hand only: his gold takes the world's accent (CSS, so it follows world changes)
  const WKEY = 'mli-hood-world';
  const worldOn = () => ls(WKEY) === '1';
  const setWorld = v => { ls(WKEY, v ? '1' : null); B.classList.toggle('world', v); };
  B.classList.toggle('world', worldOn());

  // 5. He keeps your place: leave during focus for 10 s or more, he turns his back to watch the door;
  // on return he turns round with a word (never a reproach, never the distraction count)
  let awayAt = 0, awayT = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (!(ML.running() && S.mode === 'focus')) return;
      awayAt = Date.now();
      clearTimeout(awayT); awayT = setTimeout(() => { if (awayAt && !S.outsideWork) B.classList.add('away'); }, 10000);
      return;
    }
    clearTimeout(awayT);
    if (!awayAt) return;
    const at = awayAt, secs = (Date.now() - at) / 1000; awayAt = 0;
    if (secs < 10) { B.classList.remove('away'); return; }
    B.classList.add('away'); // the app may log the session first: answer a beat later
    setTimeout(() => {
      if (S.outsideWork) { B.classList.remove('away'); flash('nod'); return; }
      const last = S.sessions[S.sessions.length - 1], ended = last && last.at >= at;
      setTimeout(() => {
        B.classList.remove('away'); flash('look');
        setTimeout(() => B.classList.remove('look'), 1400);
        if (ended) { sparks(); speak(t('hm_backdone'), 3600); return; }
        const left = Math.max(1, Math.round((ML.remainingNow ? ML.remainingNow() : S.remaining) / 60));
        speak(secs < 60 ? t('hm_back1') : secs < 300 ? t('hm_back2', { n: left }) : t('hm_back3'), 3000);
      }, 700);
    }, 400);
  });
  function sparks() {
    B.querySelector('.hm-end')?.remove();
    B.querySelector('svg').insertAdjacentHTML('beforeend', svg(1, true).match(/<g class="hm-end">[\s\S]*?<\/g>/)[0]);
    setTimeout(() => B.querySelector('.hm-end')?.remove(), 3200);
  }

  // 6. The evening word: from the evening, once a day a small star says it's ready; it sums up the day in one sentence
  const EKEY = 'mli-hood-eve';
  function eveReady() {
    const d = new Date(), h = d.getHours();
    if (h < 15) return false; // past midnight is tomorrow's day
    const p = ML.eveningPhase && ML.eveningPhase(d);
    return p ? p.k >= .6 || p.night : h >= 18;
  }
  const star2 = document.createElement('span');
  star2.className = 'hm-ready'; star2.setAttribute('aria-hidden', 'true');
  star2.innerHTML = `<svg viewBox="0 0 20 20">${star(10, 10, 9)}</svg>`;
  B.appendChild(star2);
  const eveStar = () => B.classList.toggle('eve', eveReady() && ls(EKEY) !== ML.today());
  function eveText() {
    const td = ML.today(), day = x => ML.dayKey(new Date(x));
    const ss = S.sessions.filter(s => day(s.at) === td), mins = ss.reduce((a, s) => a + (s.mins || 0), 0);
    const done = S.tasks.filter(x => x.doneAt && day(x.doneAt) === td).length;
    const sTxt = ss.length === 1 ? t('eve_s1') : t('eve_sn', { n: ss.length }), m = ML.fmtMins(mins);
    let out;
    if (!ss.length) out = t('eve_none');
    else if (ss.length === 1 || mins < 45) out = t('eve_calm', { s: sTxt, m });
    else {
      out = t('eve_full', { s: sTxt, m, d: done ? (done === 1 ? t('eve_d1') : t('eve_dn', { n: done })) : '' });
      const st = ML.streaks ? ML.streaks().cur : 0, long = Math.max(...ss.map(s => s.mins || 0));
      if (st >= 2) out += ' ' + t('eve_streak', { n: st });
      else if (long >= 40) out += ' ' + t('eve_long', { m: ML.fmtMins(long) });
    }
    const first = ML.eventsOn ? ML.eventsOn(ML.addDays(td, 1))[0] : null;
    if (first) out += ' ' + (first.start == null ? t('eve_tmr_day', { e: first.ev.title }) : t('eve_tmr', { e: first.ev.title, h: first.ev.start }));
    return out;
  }
  function eveWord() {
    ls(EKEY, ML.today()); eveStar();
    const gz = ML.codexOn && ML.codexOn() && ML.openGazette ? `<button type="button" class="link" data-gz>${ML.esc(t('hm_gazette'))}</button>` : '';
    speak(eveText(), gz ? 8000 : 6000, gz);
  }
  on('minute', eveStar); on('started', eveStar); on('newday', eveStar); eveStar();
})();
