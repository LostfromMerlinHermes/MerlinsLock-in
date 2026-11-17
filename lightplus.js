// 3.99 · the light worlds, round 1 of the redo (proposals/clairs/clairs.html, the user's picks of 2026-11-17):
// - A dark version of Codex and of Estampe, shown at night (21 h – 6 h) or always, per S.lightDark[atelier|tokyo]
//   ('off' | 'night' | 'always'; Settings › Look). game.js worldOf keeps the light world and sets html[data-dark].
//   Codex dark = « la ville basse », the city under the quays (copper pipes, walkways, a lift cage on chains, green and
//   amber lanterns, a black canal; one walkway lantern per session today, nine at most; the cage climbs to the light at a
//   session's end), drawn by ML.underDraw, which codex.js calls instead of its views. Estampe dark = the print in negative:
//   its own ink canvas inverted (white ink on black, the red kept), dark paper tokens in app.css.
// - Two shop dials, drawn on a canvas over the shared ring (the time inside, the HTML clock kept for screen readers):
//   Codex « enamel » (800, slot equip.dialCodex; default « brass » = the engraved ring as before) = a pocket watch:
//   guilloché brass bezel, white enamel, railway track, minutes in Roman numerals, blued hand, small seconds;
//   Estampe « register » (700, slot equip.dialEstampe; default « inkring ») = crop marks, register targets, a ruler of
//   the session, a red plate that slides onto the black one as the session ends.
// - Cartouche « Mon île » (third choice of its scenery pill, S.cartouche.level = 'ile'): the background is a small tile
//   island the user shapes (S.cartIsle), edited from a button in the timer card's head, never during a focus.
(() => {
  'use strict';
  const { S, $, on, t, esc, save, today, dayKey, toast } = ML;
  const root = document.documentElement, TAU = Math.PI * 2;
  ML.addStrings({
    fr: {
      ld_title: 'Version sombre des mondes clairs', ld_hint: 'Codex et Estampe ont une version sombre, la nuit ou tout le temps. Premium.',
      ld_atelier: 'Codex · la ville basse', ld_tokyo: 'Estampe · l’épreuve en négatif', ld_off: 'Non', ld_night: 'La nuit (21 h – 6 h)', ld_always: 'Toujours',
      th_atelier: 'Codex', th_tokyo: 'Estampe',
      dial_brass: 'Le cadran gravé', dial_brass_d: 'Codex · le cadran d’origine : anneaux d’or, chiffres romains.',
      dial_enamel: 'La montre émaillée', dial_enamel_d: 'Codex · lunette en laiton, émail blanc, minutes en chiffres romains, aiguille bleuie, petite seconde.',
      dial_inkring: 'Le cadran d’encre', dial_inkring_d: 'Estampe · le cadran d’origine : un anneau noir, les minutes en rouge.',
      dial_register: 'Le calage', dial_register_d: 'Estampe · deux plaques, noire et rouge, qui se calent pile à la fin de la session.',
      cx_ile: 'Mon île', ci_edit: 'Façonner l’île', ci_done: 'Fini', ci_hint: 'Choisis un outil, puis touche une case.', ci_locked: 'L’île se façonne hors du focus.',
      ci_cut: 'Couper', ci_tree: 'Arbre', ci_bush: 'Buisson', ci_house: 'Maison', ci_water: 'Eau', ci_path: 'Chemin', ci_flower: 'Fleurs', ci_grass: 'Herbe', ci_up: 'Monter', ci_down: 'Creuser', ci_reset: 'Repartir de zéro', ci_reset_ok: 'Île remise à neuf.',
    },
    en: {
      ld_title: 'Dark version of the light worlds', ld_hint: 'Codex and Estampe have a dark version, at night or all the time. Premium.',
      ld_atelier: 'Codex · the city below', ld_tokyo: 'Estampe · the print in negative', ld_off: 'No', ld_night: 'At night (9 pm – 6 am)', ld_always: 'Always',
      th_atelier: 'Codex', th_tokyo: 'Estampe',
      dial_brass: 'The engraved dial', dial_brass_d: 'Codex · the original dial: gold rings, Roman numerals.',
      dial_enamel: 'The enamel watch', dial_enamel_d: 'Codex · brass bezel, white enamel, minutes in Roman numerals, blued hand, small seconds.',
      dial_inkring: 'The ink dial', dial_inkring_d: 'Estampe · the original dial: a black ring, minutes in red.',
      dial_register: 'Registration', dial_register_d: 'Estampe · two plates, black and red, that line up exactly as the session ends.',
      cx_ile: 'My island', ci_edit: 'Shape the island', ci_done: 'Done', ci_hint: 'Pick a tool, then tap a tile.', ci_locked: 'The island can be shaped outside a focus.',
      ci_cut: 'Cut', ci_tree: 'Tree', ci_bush: 'Bush', ci_house: 'House', ci_water: 'Water', ci_path: 'Path', ci_flower: 'Flowers', ci_grass: 'Grass', ci_up: 'Raise', ci_down: 'Dig', ci_reset: 'Start over', ci_reset_ok: 'Island reset.',
    },
  });
  ML.defaults(() => ({ lightDark: { atelier: 'off', tokyo: 'off' } }));

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const rng = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const glow = (x, px, py, r, rgb, a) => { if (r <= 0 || a <= 0) return; const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let sesN = 0, sesAt = -1e9;
  const sessionsToday = () => { const now = performance.now(); if (now - sesAt > 4000) { sesAt = now; const td = today(); sesN = (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length; } return sesN; };
  on('newday', () => { sesAt = -1e9; });
  const progress = () => { const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot, started = rem < tot - .5 || (ML.running && ML.running());
    return { started, p: started ? clamp(1 - Math.max(0, rem) / tot, 0, 1) : 0, tot }; };

  /* ---------- Settings: the dark version ---------- */
  ML.settingsSection({
    order: 18, cat: 'look',
    render: () => `<h3>${esc(t('ld_title'))}</h3><p class="hint">${esc(t('ld_hint'))}</p>` + ['atelier', 'tokyo'].map(k =>
      `<label class="field"><span>${esc(t('ld_' + k))}</span>${ML.ui.sel('set-ld-' + k, ['off', 'night', 'always'].map(v => [v, t('ld_' + v)]), (S.lightDark || {})[k] || 'off')}</label>`).join(''),
    bind: r => ['atelier', 'tokyo'].forEach(k => {
      r.querySelector('#set-ld-' + k).onchange = e => { S.lightDark = Object.assign({}, S.lightDark, { [k]: e.target.value }); save(); if (ML.applyTheme) ML.applyTheme(); ML.emit('world'); };
    }),
  });

  /* ---------- Codex dark: the city below ---------- */
  // Painted once per size / sessions today, at rest and calmed for focus, in a frame 480 units high; the cage, the steam,
  // the lantern flicker and the ripples are drawn each frame on top.
  function paintUnder(W, H, focus, n) {
    const dpr = Math.min(2, devicePixelRatio || 1, Math.sqrt(3.2e6 / (W * H))), c = mk(Math.max(1, Math.round(W * dpr)), Math.max(1, Math.round(H * dpr)));
    const x = c.getContext('2d'), k = c.height / 480, VW = c.width / k, mid = VW / 2, r = rng(11);
    x.setTransform(k, 0, 0, k, 0, 0);
    let g = x.createLinearGradient(0, 0, 0, 480);
    g.addColorStop(0, '#22302a'); g.addColorStop(.25, '#141e1a'); g.addColorStop(.7, '#0e1513'); g.addColorStop(1, '#080c0b');
    x.fillStyle = g; x.fillRect(0, 0, VW, 480);
    // daylight from the city above, through a grate
    g = x.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, `rgba(214,220,196,${focus ? .16 : .3})`); g.addColorStop(1, 'rgba(214,220,196,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(mid - 40, 0); x.lineTo(mid + 40, 0); x.lineTo(mid + 80, 230); x.lineTo(mid - 76, 230); x.fill();
    // the vaults that carry the street above
    x.fillStyle = '#06090a'; x.fillRect(0, 0, VW, 16);
    for (let a = -52 + (mid % 72); a < VW + 72; a += 72) { x.beginPath(); x.moveTo(a, 14); x.quadraticCurveTo(a + 36, 46, a + 72, 14); x.lineTo(a + 72, 0); x.lineTo(a, 0); x.fill(); }
    x.fillStyle = '#0b100f'; for (let i = 0; i < 9; i++) x.fillRect(mid - 35 + i * 8, 0, 3, 18);
    // three rows of stacked houses, the far one leaves the shaft of light open
    const layers = [{ c: '#1c2924', top: [70, 150], w: [16, 30], lit: .22, y0: 430, s: .7 }, { c: '#141e1a', top: [120, 210], w: [22, 40], lit: .16, y0: 440, s: .85 }, { c: '#0c1311', top: [190, 270], w: [30, 52], lit: .12, y0: 460, s: 1 }];
    const wins = [];
    layers.forEach((L, li) => {
      let px = -10;
      while (px < VW + 10) {
        const bw = L.w[0] + r() * (L.w[1] - L.w[0]), top = L.top[0] + r() * (L.top[1] - L.top[0]);
        if (li === 0 && px > mid - 55 && px < mid + 55) { px += bw * .6; continue; }
        x.fillStyle = L.c; x.fillRect(px, top, bw, L.y0 - top);
        if (r() < .5) x.fillRect(px + bw * .2, top - 8, 6, 8); else { x.beginPath(); x.moveTo(px - 1, top); x.lineTo(px + bw / 2, top - 7); x.lineTo(px + bw + 1, top); x.fill(); }
        for (let wy = top + 8; wy < L.y0 - 10; wy += 11 * L.s) for (let wx = px + 4; wx < px + bw - 5; wx += 7 * L.s) {
          const q = r();
          if (q < L.lit * (focus ? .45 : 1)) { const warm = r() < .65; x.fillStyle = warm ? 'rgba(232,180,92,.85)' : 'rgba(168,206,120,.75)'; x.fillRect(wx, wy, 3 * L.s, 4 * L.s); if (li === 2 && r() < .3) wins.push([wx + 1.5, wy + 2, warm]); }
          else if (q < L.lit + .25) { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(wx, wy, 3 * L.s, 4 * L.s); }
        }
        px += bw + (r() < .3 ? 6 : 0);
      }
      const by = 300 - li * 70 + r() * 20; x.strokeStyle = li === 2 ? '#2a3530' : L.c; x.lineWidth = 3; x.beginPath(); x.moveTo(0, by); x.lineTo(VW, by + 6); x.stroke();
      x.lineWidth = .8; for (let i = 0; i < VW; i += 6) { x.beginPath(); x.moveTo(i, by + i / VW * 6); x.lineTo(i, by + i / VW * 6 - 7); x.stroke(); }
      x.beginPath(); x.moveTo(0, by - 7); x.lineTo(VW, by - 1); x.stroke();
    });
    // copper pipes; their joints are where the steam comes out
    const joints = [];
    const pipe = (pts, w) => {
      x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]));
      x.strokeStyle = '#3e2416'; x.lineWidth = w + 2; x.stroke(); x.strokeStyle = '#8a4f2c'; x.lineWidth = w; x.stroke();
      x.save(); x.translate(-w * .2, -w * .2); x.strokeStyle = 'rgba(232,150,92,.5)'; x.lineWidth = w * .28; x.stroke(); x.restore();
      pts.forEach((p, i) => { if (!i || i === pts.length - 1) return; x.fillStyle = '#b8743f'; x.fillRect(p[0] - w * .7, p[1] - w * .7, w * 1.4, w * 1.4); joints.push(p); });
    };
    pipe([[-5, 352], [mid - 65, 352], [mid - 65, 300], [mid + 15, 300], [mid + 15, 372], [VW + 10, 372]], 6);
    pipe([[mid + 65, -5], [mid + 65, 120], [mid + 101, 120], [mid + 101, 490]], 5);
    pipe([[-5, 410], [mid - 15, 410], [mid - 15, 490]], 8);
    if (VW > 420) { pipe([[VW - 30, -5], [VW - 30, 200], [VW * .82, 200], [VW * .82, 490]], 7); pipe([[-5, 160], [VW * .12, 160], [VW * .12, 490]], 5); }
    // the walkway's lanterns: one lit per session today
    const sp = Math.min(34, VW / 10), lamps = [];
    for (let i = 0; i < 9; i++) {
      const lx = mid + (i - 4) * sp, ly = 228 + i * .9, lit = i < n; lamps.push([lx, ly, lit]);
      x.strokeStyle = '#30322c'; x.lineWidth = 1; x.beginPath(); x.moveTo(lx, ly - 12); x.lineTo(lx, ly - 4); x.stroke();
      x.fillStyle = lit ? '#f4cf7a' : '#3a3d36'; x.fillRect(lx - 2.5, ly - 4, 5, 7);
      if (lit) glow(x, lx, ly, focus ? 20 : 26, '240,190,96', focus ? .35 : .45);
    }
    if (!focus) wins.forEach(([a, b, warm]) => glow(x, a, b, 9, warm ? '232,180,92' : '168,206,120', .3));
    // the black canal, the lanterns' reflections
    x.fillStyle = '#05080a'; x.fillRect(0, 440, VW, 40); x.fillStyle = '#2b3530'; x.fillRect(0, 438, VW, 3);
    lamps.forEach(([lx, , lit]) => { if (!lit && focus) return; x.fillStyle = lit ? 'rgba(244,207,122,.5)' : 'rgba(168,206,120,.12)'; for (let q = 0; q < 6; q++) x.fillRect(lx - 3 + (q % 2) * 2, 446 + q * 5, 5 - q * .5, 1.4); });
    if (focus) { x.fillStyle = 'rgba(14,22,19,.4)'; x.fillRect(0, 0, VW, 480); }
    return { c, k: H / 480, VW, mid, joints, lamps, cageX: mid - Math.min(130, VW * .36) };
  }
  let U = null, UF = null, uKey = '', uFog = 0, uLast = 0, uEnd = -1e9, steam = [];
  ML.underDraw = (cx, w, h, slow, still, now) => {
    const n = Math.min(9, sessionsToday()), key = w + 'x' + h + '|' + n;
    if (key !== uKey) { uKey = key; U = paintUnder(w, h, false, n); UF = null; setTimeout(() => { if (uKey === key) UF = paintUnder(w, h, true, n); }, 60); steam = []; }
    const st = root.dataset.timer || 'idle', dt = Math.min(100, uLast ? now - uLast : 16) * (still ? 0 : 1); uLast = now;
    const fogT = st === 'running' ? 1 : st === 'paused' ? .4 : 0;
    uFog = still ? fogT : uFog + (fogT - uFog) * Math.min(1, dt / 2400);
    cx.drawImage(U.c, 0, 0, w, h);
    if (UF && uFog > .01) { cx.globalAlpha = Math.min(1, uFog); cx.drawImage(UF.c, 0, 0, w, h); cx.globalAlpha = 1; }
    const k = U.k; cx.save(); cx.scale(k, k);
    // the lift cage: drifts up and down at rest, waits low in focus, climbs to the light after a session
    const endAge = (now - uEnd) / 1000, base = still ? 200 : 205 + Math.sin(now / 6400) * 48;
    let cy = uFog > .5 ? 250 : base; if (endAge >= 0 && endAge < 7) cy = 250 - Math.sin(Math.min(1, endAge / 4) * Math.PI / 2) * 200 + Math.max(0, endAge - 5) * 100;
    const cxg = U.cageX;
    cx.strokeStyle = '#4a4f48'; cx.lineWidth = 1; cx.setLineDash([2, 2]); [cxg + 6, cxg + 24].forEach(a => { cx.beginPath(); cx.moveTo(a, 10); cx.lineTo(a, cy); cx.stroke(); }); cx.setLineDash([]);
    cx.fillStyle = 'rgba(10,14,12,.6)'; cx.fillRect(cxg, cy, 30, 34);
    cx.strokeStyle = '#8c7a4f'; cx.lineWidth = 1.2; cx.strokeRect(cxg, cy, 30, 34);
    for (let i = 1; i < 5; i++) { cx.beginPath(); cx.moveTo(cxg + i * 6, cy); cx.lineTo(cxg + i * 6, cy + 34); cx.stroke(); }
    glow(cx, cxg + 15, cy + 18, 22, '232,180,92', .3 + (endAge >= 0 && endAge < 7 ? .25 : 0));
    // the lit lanterns breathe a little
    if (!still) U.lamps.forEach(([lx, ly, lit], i) => { if (lit) glow(cx, lx, ly, 14, '255,210,120', .12 + .08 * Math.sin(now / 700 + i * 1.7)); });
    // steam from the joints, at rest only
    if (!still) {
      if (uFog < .3) U.joints.forEach(([a, b]) => { if (Math.random() < .035 * dt / 33 && steam.length < 60) steam.push({ x: a, y: b, r: 3, life: 1, vx: (Math.random() - .5) * .15, vy: .25 + Math.random() * .2 }); });
      steam.forEach(p => { p.x += p.vx * dt / 33; p.y -= p.vy * dt / 33; p.r += .06 * dt / 33; p.life -= .006 * dt / 33; });
      steam = steam.filter(p => p.life > 0);
    }
    steam.forEach(p => glow(cx, p.x, p.y, p.r * 2, '220,226,214', .12 * p.life));
    // ripples on the canal
    cx.strokeStyle = 'rgba(200,210,190,.18)'; cx.lineWidth = .8;
    for (let i = 0; i < 12; i++) { const drift = still ? 0 : now / 90 * (1 - uFog * .8), xx = ((i * 61 + drift) % (U.VW + 30)) - 15, yy = 448 + (i * 13) % 28; cx.beginPath(); cx.moveTo(xx, yy); cx.lineTo(xx + 6 + (i % 3) * 4, yy); cx.stroke(); }
    cx.restore();
  };
  on('session', s => { if (!s || s.mins < 1) return; sesAt = -1e9; if (root.dataset.dark && root.dataset.theme === 'observatory') uEnd = performance.now(); });

  /* ---------- The two shop dials ---------- */
  const codexOn = () => root.dataset.theme === 'observatory' && !!root.dataset.light;
  const estampeOn = () => root.dataset.theme === 'netrunner' && !!root.dataset.light;
  const equip = () => (S.econ && S.econ.equip) || {};
  const dialNow = () => codexOn() && equip().dialCodex === 'enamel' ? 'enamel' : estampeOn() && equip().dialEstampe === 'register' ? 'register' : '';
  const ROMAN = ['LX', 'V', 'X', 'XV', 'XX', 'XXV', 'XXX', 'XXXV', 'XL', 'XLV', 'L', 'LV'];
  const SERIF = '"Cormorant Garamond", Georgia, serif', SANS = '"IBM Plex Sans", "Segoe UI", sans-serif', WORLD = '"Chakra Petch", Bahnschrift, sans-serif', MONO = '"IBM Plex Mono", ui-monospace, monospace';
  const fit = (x, txt, font, size, maxW) => { x.font = font.replace('{s}', size); const w = x.measureText(txt).width; if (w > maxW) x.font = font.replace('{s}', Math.floor(size * maxW / w)); };

  // st: { time, label, el (elapsed s), tot (s), started, sec (0..59) }
  function dialEnamel(x, st) {
    const cx = 150, cy = 150, R = 138;
    x.fillStyle = 'rgba(40,28,10,.28)'; x.beginPath(); x.arc(cx + 2, cy + 4, R + 1, 0, TAU); x.fill();
    let g = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, '#f2dc9c'); g.addColorStop(.45, '#b28a3e'); g.addColorStop(.7, '#e7cd88'); g.addColorStop(1, '#7c5c24');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(90,64,22,.55)'; x.lineWidth = .8;
    for (let i = 0; i < 200; i++) { const a = i / 200 * TAU; x.beginPath(); x.moveTo(cx + Math.cos(a) * (R - 1), cy + Math.sin(a) * (R - 1)); x.lineTo(cx + Math.cos(a) * (R - 7), cy + Math.sin(a) * (R - 7)); x.stroke(); }
    g = x.createRadialGradient(cx - 40, cy - 46, 12, cx, cy, R - 12); g.addColorStop(0, '#fffdf7'); g.addColorStop(1, '#ebe3cf');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R - 13, 0, TAU); x.fill(); x.strokeStyle = '#8a6a2e'; x.lineWidth = 1.2; x.stroke();
    // railway track, elapsed in red, the planned end as a small red mark
    x.strokeStyle = '#2a2622'; x.lineWidth = 1;
    [R - 20, R - 28].forEach(rad => { x.beginPath(); x.arc(cx, cy, rad, 0, TAU); x.stroke(); });
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU - Math.PI / 2, big = i % 5 === 0; x.lineWidth = big ? 2 : .9; x.beginPath(); x.moveTo(cx + Math.cos(a) * (R - 20), cy + Math.sin(a) * (R - 20)); x.lineTo(cx + Math.cos(a) * (R - (big ? 33 : 28)), cy + Math.sin(a) * (R - (big ? 33 : 28))); x.stroke(); }
    const elM = st.el / 60, totM = st.tot / 60;
    if (st.started && elM > 0) { x.strokeStyle = '#a3241c'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, R - 24, -Math.PI / 2, -Math.PI / 2 + Math.min(1, elM / 60) * TAU); x.stroke(); }
    if (totM > 0 && totM <= 60) { const a = totM / 60 * TAU - Math.PI / 2; x.fillStyle = '#a3241c'; x.beginPath(); x.arc(cx + Math.cos(a) * (R - 16), cy + Math.sin(a) * (R - 16), 2.6, 0, TAU); x.fill(); }
    // Roman minutes, upright along the dial
    x.fillStyle = '#1f1b17'; x.textAlign = 'center'; x.textBaseline = 'middle';
    ROMAN.forEach((nm, i) => { const a = i / 12 * TAU - Math.PI / 2, rad = R - 47; x.save(); x.translate(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); x.rotate(a + Math.PI / 2); x.font = `600 ${nm.length > 3 ? 12 : 15}px ${SERIF}`; x.fillText(nm, 0, 0); x.restore(); });
    // small seconds at VI
    const sx = cx, sy = cy + 50, sr = 19;
    x.strokeStyle = '#2a2622'; x.lineWidth = .8; x.beginPath(); x.arc(sx, sy, sr, 0, TAU); x.stroke();
    for (let i = 0; i < 60; i += 5) { const a = i / 60 * TAU - Math.PI / 2; x.beginPath(); x.moveTo(sx + Math.cos(a) * sr, sy + Math.sin(a) * sr); x.lineTo(sx + Math.cos(a) * (sr - 4), sy + Math.sin(a) * (sr - 4)); x.stroke(); }
    const sa = st.sec / 60 * TAU - Math.PI / 2; x.strokeStyle = '#1c3a7a'; x.lineWidth = 1.3; x.beginPath(); x.moveTo(sx - Math.cos(sa) * 4, sy - Math.sin(sa) * 4); x.lineTo(sx + Math.cos(sa) * (sr - 3), sy + Math.sin(sa) * (sr - 3)); x.stroke();
    x.fillStyle = '#1c3a7a'; x.beginPath(); x.arc(sx, sy, 2.2, 0, TAU); x.fill();
    // the blued Breguet hand, on the elapsed minutes
    const ha = (st.started ? elM / 60 : 0) * TAU - Math.PI / 2, hl = R - 34;
    x.save(); x.translate(cx, cy); x.rotate(ha); x.fillStyle = '#1c3a7a'; x.strokeStyle = '#1c3a7a';
    x.beginPath(); x.moveTo(-18, -1.6); x.lineTo(hl * .62, -1.8); x.lineTo(hl * .62, 1.8); x.lineTo(-18, 1.6); x.fill();
    x.lineWidth = 2.4; x.beginPath(); x.arc(hl * .62 + 7, 0, 6, 0, TAU); x.stroke();
    x.beginPath(); x.moveTo(hl * .62 + 13, -1.3); x.lineTo(hl, 0); x.lineTo(hl * .62 + 13, 1.3); x.fill(); x.restore();
    x.fillStyle = '#c9a65a'; x.beginPath(); x.arc(cx, cy, 4.4, 0, TAU); x.fill(); x.fillStyle = '#1c3a7a'; x.beginPath(); x.arc(cx, cy, 2, 0, TAU); x.fill();
    // the time in front, on an enamel plate
    x.font = `700 52px ${SERIF}`; const tw = Math.min(150, x.measureText(st.time).width + 22);
    x.fillStyle = 'rgba(251,248,240,.92)'; x.beginPath(); x.roundRect(cx - tw / 2, cy - 54, tw, 50, 10); x.fill();
    x.fillStyle = '#5d4a2c'; x.font = `500 11px ${SANS}`; x.fillText(st.label, cx, cy - 62);
    x.fillStyle = '#1f1b17'; fit(x, st.time, `700 {s}px ${SERIF}`, 52, 140); x.fillText(st.time, cx, cy - 28);
  }
  function dialRegister(x, st, paperOnly) {
    const dark = !paperOnly && !!root.dataset.dark, ink = dark ? '#EDE9E0' : '#141414', red = '#E3001B', paper = dark ? '#1A1A18' : '#FFFFFF';
    const cx = 150, cy = 150, R = 128, p = st.started ? clamp(st.el / Math.max(1, st.tot), 0, 1) : 0, off = 1 - p;
    x.fillStyle = paper; x.beginPath(); x.arc(cx, cy, R + 8, 0, TAU); x.fill();
    // crop marks and two register targets
    x.strokeStyle = ink; x.lineWidth = 1.1; const s = 146;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { x.beginPath(); x.moveTo(cx + a * s, cy + b * (s - 14)); x.lineTo(cx + a * s, cy + b * s); x.lineTo(cx + a * (s - 14), cy + b * s); x.stroke(); });
    const target = (tx, ty) => { x.beginPath(); x.arc(tx, ty, 6, 0, TAU); x.moveTo(tx - 11, ty); x.lineTo(tx + 11, ty); x.moveTo(tx, ty - 11); x.lineTo(tx, ty + 11); x.stroke(); };
    x.lineWidth = .8; target(cx - s + 4, cy); target(cx + s - 4, cy);
    // the ruler of the session: 60 divisions, the passed ones in red, minutes at the quarters
    const totM = Math.round(st.tot / 60);
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * TAU - Math.PI / 2, big = i % 15 === 0, mid = i % 5 === 0, passed = st.started && i / 60 < p;
      x.strokeStyle = passed ? red : ink; x.lineWidth = big ? 2.2 : mid ? 1.4 : .8; const l = big ? 14 : mid ? 9 : 5;
      x.beginPath(); x.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.lineTo(cx + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l)); x.stroke();
    }
    x.fillStyle = ink; x.font = `500 10px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    [1, 2, 3].forEach(q => { const a = q / 4 * TAU - Math.PI / 2; x.fillText(String(Math.round(totM * q / 4)), cx + Math.cos(a) * (R - 25), cy + Math.sin(a) * (R - 25)); });
    // two plates: red under, slid away, the black one in register on top
    const dx = 9 * off, dy = -6 * off;
    x.lineWidth = 4; x.strokeStyle = red; x.beginPath(); x.arc(cx + dx, cy + dy, R - 40, 0, TAU); x.stroke();
    x.textBaseline = 'middle'; fit(x, st.time, `700 {s}px ${WORLD}`, 58, 160);
    x.fillStyle = red; x.fillText(st.time, cx + dx * .8, cy - 4 + dy * .8);
    x.strokeStyle = ink; x.beginPath(); x.arc(cx, cy, R - 40, 0, TAU); x.stroke();
    x.fillStyle = ink; x.fillText(st.time, cx, cy - 4);
    x.font = `500 10px ${MONO}`; x.fillStyle = dark ? '#A8A49B' : '#5E5E5E';
    const d = new Date(); x.fillText((S.lang === 'en' ? 'PROOF NO. ' : 'ÉPREUVE N° ') + (sessionsToday() + (st.started ? 1 : 0)) + ' · ' + String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0'), cx, cy + 34);
    x.fillStyle = red; x.font = `600 10px ${SANS}`; x.fillText(st.label, cx, cy - 44);
  }
  const DIAL = { enamel: dialEnamel, register: dialRegister };
  const dc = mk(300, 300), dg = dc.getContext('2d'); dc.className = 'lx-dial'; dc.setAttribute('aria-hidden', 'true');
  const txt = id => ((document.getElementById(id) || {}).textContent || '').trim();
  function renderDial() {
    const k = dialNow(), wrap = document.querySelector('#sigil-card .ring-wrap');
    if ((root.dataset.lxDial || '') !== k) { if (k) root.dataset.lxDial = k; else delete root.dataset.lxDial; }
    if (!k || !wrap) { if (dc.isConnected) dc.remove(); return; }
    if (dc.parentNode !== wrap) wrap.prepend(dc);
    if (!wrap.offsetParent && !ML.dialText) return;
    const px = Math.round((wrap.clientWidth || 280) * 1.1 * Math.min(2, devicePixelRatio || 1)) || 300;
    if (dc.width !== px) { dc.width = px; dc.height = px; }
    const pr = progress(), shown = ML.dialText;
    const st = { time: shown ? shown.time : txt('clock'), label: (shown ? shown.label : txt('state')) || '', started: pr.started && !shown, el: pr.p * pr.tot, tot: shown && shown.mins ? shown.mins * 60 : pr.tot, sec: new Date().getSeconds() };
    dg.setTransform(px / 300, 0, 0, px / 300, 0, 0); dg.clearRect(0, 0, 300, 300);
    DIAL[k](dg, st);
  }
  ['tick', 'timer', 'render', 'started', 'newday', 'saved', 'world'].forEach(ev => on(ev, renderDial));
  new MutationObserver(renderDial).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light', 'data-dark'] });

  // shop pictures (economy.js asks for any Codex or Estampe dial)
  const pics = {};
  function dialBrass(x) {
    x.fillStyle = '#F2E8D2'; x.beginPath(); x.arc(150, 150, 140, 0, TAU); x.fill();
    x.strokeStyle = '#A8842F'; [[134, 1.6], [128, .7], [112, .8]].forEach(([r, w]) => { x.lineWidth = w; x.beginPath(); x.arc(150, 150, r, 0, TAU); x.stroke(); });
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU - Math.PI / 2, l = i % 5 ? 5 : 11; x.lineWidth = i % 5 ? 1 : 2; x.beginPath(); x.moveTo(150 + Math.cos(a) * 128, 150 + Math.sin(a) * 128); x.lineTo(150 + Math.cos(a) * (128 - l), 150 + Math.sin(a) * (128 - l)); x.stroke(); }
    x.strokeStyle = '#6B4A12'; x.lineWidth = 4; x.beginPath(); x.arc(150, 150, 131, -Math.PI / 2, Math.PI * .1); x.stroke();
    x.fillStyle = '#5C4632'; x.font = `600 17px ${SERIF}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    ['XII', 'III', 'VI', 'IX'].forEach((nm, i) => { const a = i / 4 * TAU - Math.PI / 2; x.fillText(nm, 150 + Math.cos(a) * 96, 150 + Math.sin(a) * 96); });
    x.fillStyle = '#2B1D12'; x.font = `600 54px ${SERIF}`; x.fillText('25:00', 150, 150);
  }
  function dialInk(x) {
    x.fillStyle = '#111'; x.beginPath(); x.arc(150, 150, 140, 0, TAU); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(150, 150, 104, 0, TAU); x.fill();
    x.strokeStyle = '#E3001B'; x.lineWidth = 3;
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU - Math.PI / 2; x.beginPath(); x.moveTo(150 + Math.cos(a) * 98, 150 + Math.sin(a) * 98); x.lineTo(150 + Math.cos(a) * 86, 150 + Math.sin(a) * 86); x.stroke(); }
    x.fillStyle = '#111'; x.font = `700 50px ${WORLD}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('25:00', 150, 152);
  }
  ML.lightShopPic = k => {
    if (!pics[k]) { try {
      const c = mk(240, 240), g = c.getContext('2d'); g.scale(.8, .8);
      const st = { time: '25:00', label: '', started: true, el: 9 * 60, tot: 25 * 60, sec: 20 };
      if (k === 'enamel') dialEnamel(g, st); else if (k === 'register') dialRegister(g, st, true);
      else if (k === 'brass') dialBrass(g); else dialInk(g);
      pics[k] = c.toDataURL('image/png');
    } catch (e) { return ''; } }
    return `<img class="fog-prev" src="${pics[k]}" alt="">`;
  };

  /* ---------- Cartouche: « Mon île », the island you shape ---------- */
  const N = 10, TWp = 8, LIFT = 3; // tiles across, tile width in scene pixels, pixels per level
  // tiles: g grass, w water, p path, f flowers, s sand; objects: . none, t tree, b bush, h house, r rock; heights 0..3
  function freshIsle() {
    const T = [], O = [], Hh = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      let tt = 'g', o = '.', h = 0;
      if (i === 4 && j < 7) tt = 'w';
      if (j === 6 && i > 4) tt = 'p';
      if (i >= 6 && j <= 2) tt = 's';
      if (i <= 2 && j <= 2) h = 1;
      if ((i === 1 && j === 1) || (i === 0 && j === 4) || (i === 2 && j === 8) || (i === 7 && j === 4) || (i === 8 && j === 9) || (i === 1 && j === 6)) o = 't';
      if ((i === 3 && j === 2) || (i === 9 && j === 5)) o = 'b';
      if (i === 7 && j === 7) o = 'h';
      if (i === 6 && j === 9) tt = 'f';
      T.push(tt); O.push(o); Hh.push(h);
    }
    return { v: 1, t: T.join(''), o: O.join(''), h: Hh.join('') };
  }
  const isle = () => { const I = S.cartIsle; return I && I.v === 1 && I.t && I.t.length === N * N ? I : (S.cartIsle = freshIsle()); };
  const at = (s, i, j) => s[j * N + i];
  const CI = {
    day: { sky: ['#D9E7C4', '#D2E2BA', '#CADCB0', '#C1D6A5', '#B8CF9A'], hill: '#A9C48A', hill2: '#97B779', cloud: '#FBFCEF', cloudO: '#DFE8CC' },
    evening: { sky: ['#E8CFA0', '#E2C48A', '#D9B77E', '#CFAE7A', '#C2A574'], hill: '#AFA472', hill2: '#9C9764', cloud: '#F6EBCB', cloudO: '#DCC28E' },
    night: { sky: ['#16301F', '#1B3726', '#213F2D', '#284735', '#30503D'], hill: '#244231', hill2: '#1F3B2B', cloud: '#3B5A47', cloudO: '#2F4E3C' },
  };
  const TOP = { g: ['#7FB04C', '#8BBB57'], w: ['#5A9FD0', '#6AAEDB'], p: ['#D8C38A', '#D1BB80'], f: ['#86B552', '#8FBE5C'], s: ['#D2B54C', '#C8AA42'] };
  const partOfDay = () => { const h = new Date().getHours(); return h >= 21 || h < 6 ? 'night' : h >= 18 || h < 7 ? 'evening' : 'day'; };
  // paint the island with its centre-top at (ox, oy) on a pixel context; returns nothing, draws back to front
  function paintIsle(p, ox, oy, tm, still) {
    const I = isle(), R = (a, b, w, h, c) => { p.fillStyle = c; p.fillRect(Math.round(a), Math.round(b), w, h); };
    // the rock under the island, narrowing down
    const bw = N * TWp, top = oy + N * 2 + 2;
    for (let k2 = 0; k2 < 26; k2++) { const w = Math.max(2, bw - k2 * 3 - (k2 > 7 ? (k2 - 7) * 1.4 : 0)), y = top + N * 2 - 4 + k2; R(ox - w / 2, y, Math.round(w / 2), 1, k2 < 4 ? '#7A5B38' : '#6F6A5C'); R(ox, y, Math.round(w / 2), 1, k2 < 4 ? '#9B7A4E' : '#8A8575'); }
    for (let d = 0; d < N * 2 - 1; d++) for (let i = 0; i < N; i++) {
      const j = d - i; if (j < 0 || j >= N) continue;
      const tt = at(I.t, i, j), o = at(I.o, i, j), h = +at(I.h, i, j), sx = ox + (i - j) * 4, sy = oy + (i + j) * 2 - h * LIFT;
      // the column: earth sides down to the island's base (the front ones show as the cliff)
      const depth = 4 + h * LIFT;
      for (let q = 0; q < 4; q++) { R(sx - 4 + q, sy + 2 + Math.floor(q / 2), 1, depth, '#7A5B38'); R(sx + q, sy + 3 - Math.floor(q / 2), 1, depth, '#9B7A4E'); }
      if (h) { R(sx - 4, sy + 2, 4, 1, '#5E9A3A'); }
      const c = TOP[tt] ? TOP[tt][(i + j) % 2] : TOP.g[0];
      R(sx - 2, sy, 4, 1, c); R(sx - 4, sy + 1, 8, 2, c); R(sx - 2, sy + 3, 4, 1, c);
      if (tt === 'w' && !still && (Math.floor(tm / 500) + i * 3 + j) % 7 === 0) R(sx - 1, sy + 1, 2, 1, '#D8F0FB');
      if (tt === 'f') { R(sx - 2, sy + 1, 1, 1, '#F2E15A'); R(sx + 1, sy + 2, 1, 1, '#F0A6C0'); R(sx + 2, sy + 1, 1, 1, '#FFFFFF'); }
      if (tt === 'p') R(sx, sy + 1, 1, 1, '#B9A56E');
      if (o === 't') { R(sx - 1, sy - 2, 2, 4, '#6B4A2E'); R(sx - 3, sy - 8, 6, 6, '#3F7A3A'); R(sx - 2, sy - 10, 4, 2, '#4F8F45'); R(sx - 2, sy - 7, 2, 2, '#5EA352'); }
      if (o === 'b') { R(sx - 2, sy - 2, 5, 3, '#3F7A3A'); R(sx - 1, sy - 3, 3, 1, '#5EA352'); }
      if (o === 'r') { R(sx - 2, sy - 1, 4, 2, '#8A8575'); R(sx - 1, sy - 2, 2, 1, '#A9A496'); }
      if (o === 'h') {
        R(sx - 4, sy - 5, 8, 6, '#EFE6CF'); R(sx, sy - 5, 4, 6, '#D8CCB0'); R(sx - 1, sy - 2, 2, 3, '#6B4A2E');
        R(sx - 5, sy - 7, 10, 2, '#B8463A'); R(sx - 3, sy - 9, 6, 2, '#C95A4A'); R(sx - 1, sy - 10, 2, 1, '#C95A4A'); R(sx + 2, sy - 12, 2, 3, '#7A6A5A');
        if (!still) for (let s2 = 0; s2 < 3; s2++) { const ph = ((tm / 1100 + s2 / 3) % 1); R(sx + 3 + Math.round(Math.sin(ph * 6) * 1), sy - 13 - Math.round(ph * 9), 1, 1, '#E8ECE4'); }
      }
    }
    // water that reaches the front edges falls off the island
    for (let i = 0; i < N; i++) [[i, N - 1], [N - 1, i]].forEach(([a, b]) => {
      if (at(I.t, a, b) !== 'w') return;
      const h = +at(I.h, a, b), fx = ox + (a - b) * 4 + (a === N - 1 ? 2 : -3), fy = oy + (a + b) * 2 - h * LIFT + 5;
      for (let k2 = 0; k2 < 26 + h * LIFT; k2++) R(fx + (k2 % 3 === 0 ? 1 : 0), fy + k2, 2, 1, (k2 + Math.floor(tm / 120)) % 4 ? '#7FC0EA' : '#D8F0FB');
    });
  }
  function sceneSky(p, w, h, mode, tm) {
    const P = CI[mode], bh = Math.ceil(h / 5);
    P.sky.forEach((c, i) => { p.fillStyle = c; p.fillRect(0, i * bh, w, bh + 1); });
    const cloud = (a, b) => { p.fillStyle = P.cloud; p.fillRect(a + 2, b, 8, 2); p.fillRect(a, b + 2, 14, 2); p.fillStyle = P.cloudO; p.fillRect(a + 1, b + 4, 12, 1); };
    const d = tm / 1400; cloud((w * .1 + d) % (w + 30) - 15, h * .1); cloud((w * .6 + d * .7) % (w + 30) - 15, h * .2); cloud((w * .35 + d * .5) % (w + 30) - 15, h * .05);
    for (let i = 0; i < w; i++) { const y = Math.round(h * .62 + Math.sin(i * .11) * 4 + Math.sin(i * .27) * 2); p.fillStyle = P.hill; p.fillRect(i, y, 1, h - y); }
    for (let i = 0; i < w; i++) { const y = Math.round(h * .7 + Math.sin(i * .07 + 2) * 5); p.fillStyle = P.hill2; p.fillRect(i, y, 1, h - y); }
    if (mode === 'night') { let s2 = 3; const r2 = () => (s2 = (s2 * 9301 + 49297) % 233280) / 233280; p.fillStyle = '#E9EFD2'; for (let i = 0; i < w * h / 900; i++) p.fillRect(Math.floor(r2() * w), Math.floor(r2() * h * .5), 1, 1); }
  }
  const level = () => (S.cartouche && S.cartouche.level) || 'plein';
  const cartOn = () => root.dataset.theme === 'arcade' && !!root.dataset.light;
  const icv = document.createElement('canvas'); icv.id = 'cx-isle'; icv.setAttribute('aria-hidden', 'true');
  let iRaf = 0, iLast = 0, iT = 0;
  function isleFrame(now) {
    iRaf = 0; if (!icv.isConnected || document.hidden) return;
    const still = ML.reducedMotion(), focus = root.dataset.timer === 'running';
    if (!still && now - iLast < (focus ? 400 : 160)) { iRaf = requestAnimationFrame(isleFrame); return; }
    iT += still ? 0 : Math.min(400, now - (iLast || now)) * (focus ? .3 : 1); iLast = now;
    const k = innerWidth < 700 ? 3 : 4, w = Math.ceil(innerWidth / k), h = Math.ceil(innerHeight / k);
    if (!w || !h) return;
    if (icv.width !== w || icv.height !== h) { icv.width = w; icv.height = h; }
    const p = icv.getContext('2d'), mode = partOfDay();
    if (root.dataset.cartSky !== mode) root.dataset.cartSky = mode;
    sceneSky(p, w, h, mode, iT);
    paintIsle(p, Math.round(w / 2), Math.round(h * (innerWidth < 700 ? .66 : .6)), iT, still);
    if (!still) iRaf = requestAnimationFrame(isleFrame);
  }
  function renderIsle() {
    const show = cartOn() && level() === 'ile';
    if (show && !icv.isConnected) { const fx = $('fx'); if (fx) fx.after(icv); else document.body.prepend(icv); }
    if (!show) { if (icv.isConnected) icv.remove(); cancelAnimationFrame(iRaf); iRaf = 0; }
    else if (!iRaf) { iLast = 0; iRaf = requestAnimationFrame(isleFrame); }
    eb.hidden = !show;
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderIsle(); });
  addEventListener('resize', () => { if (icv.isConnected && !iRaf) iRaf = requestAnimationFrame(isleFrame); });
  on('minute', () => { if (icv.isConnected && !iRaf) iRaf = requestAnimationFrame(isleFrame); });
  on('motion', () => { cancelAnimationFrame(iRaf); iRaf = 0; renderIsle(); });

  // the editor: a button in the timer card's head opens a full layer with the island big and a row of tools
  const eb = document.createElement('button');
  eb.type = 'button'; eb.className = 'ghost icon-only'; eb.id = 'ci-edit-btn'; eb.hidden = true;
  eb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l8 4-8 4-8-4z M4 12l8 4 8-4 M4 16l8 4 8-4"/></svg>';
  { const head = document.querySelector('#sigil-card .card-head'), deep = $('deep-btn'); if (head) head.insertBefore(eb, deep && deep.parentNode === head ? deep : null); }
  const TOOLS = ['tree', 'bush', 'house', 'cut', 'water', 'path', 'flower', 'grass', 'up', 'down'];
  let tool = 'tree';
  const ov = document.createElement('div'); ov.className = 'ci-ov'; ov.id = 'ci-ov'; ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  document.body.appendChild(ov);
  const ecv = document.createElement('canvas'); ecv.className = 'ci-cv';
  const EW = 120, EH = 96, EOX = 60, EOY = 22; // the editor's scene, in pixels
  ecv.width = EW; ecv.height = EH;
  function drawEditor() {
    const p = ecv.getContext('2d'); p.clearRect(0, 0, EW, EH);
    sceneSky(p, EW, EH, partOfDay() === 'night' ? 'evening' : 'day', 0);
    paintIsle(p, EOX, EOY, 0, true);
  }
  function openEditor() {
    if (root.dataset.timer === 'running') { toast(t('ci_locked'), { key: 'ci' }); return; }
    eb.setAttribute('aria-label', t('ci_edit')); eb.title = t('ci_edit');
    ov.innerHTML = `<div class="ci-box"><div class="ci-head"><b>${esc(t('ci_edit'))}</b><button type="button" class="primary small" data-ci-done>${esc(t('ci_done'))}</button></div>
      <p class="hint">${esc(t('ci_hint'))}</p><div class="ci-stage"></div>
      <div class="ci-tools" role="group">${TOOLS.map(k => `<button type="button" data-tool="${k}" aria-pressed="${k === tool}">${esc(t('ci_' + k))}</button>`).join('')}</div>
      <button type="button" class="link ci-reset" data-ci-reset>${esc(t('ci_reset'))}</button></div>`;
    ov.querySelector('.ci-stage').appendChild(ecv); drawEditor(); ov.hidden = false;
    const first = ov.querySelector('[data-tool][aria-pressed=true]'); if (first) first.focus();
  }
  const closeEditor = () => { ov.hidden = true; save(); if (icv.isConnected && !iRaf) iRaf = requestAnimationFrame(isleFrame); };
  eb.addEventListener('click', openEditor);
  ov.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) { if (e.target === ov) closeEditor(); return; }
    if (b.dataset.tool) { tool = b.dataset.tool; ov.querySelectorAll('[data-tool]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }
    else if ('ciDone' in b.dataset) closeEditor();
    else if ('ciReset' in b.dataset) { // two taps, like ML.armedButton
      if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = t('tap_again'); setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = t('ci_reset'); } }, 6000); return; }
      delete b.dataset.armed; b.textContent = t('ci_reset'); S.cartIsle = freshIsle(); save(); drawEditor(); toast(t('ci_reset_ok'), { key: 'ci' });
    }
  });
  ov.addEventListener('keydown', e => { if (e.key === 'Escape') closeEditor(); });
  // which tile is under a point of the editor's scene: front tiles first, their raised top and sides included
  function pick(px, py) {
    const I = isle();
    for (let d = N * 2 - 2; d >= 0; d--) for (let i = N - 1; i >= 0; i--) {
      const j = d - i; if (j < 0 || j >= N) continue;
      const h = +at(I.h, i, j), sx = EOX + (i - j) * 4, sy = EOY + (i + j) * 2 - h * LIFT;
      if (Math.abs(px - sx) / 4 + Math.abs(py - (sy + 2)) / 2 <= 1.05) return [i, j];
      if (h && Math.abs(px - sx) < 4 && py > sy + 2 && py < sy + 4 + h * LIFT) return [i, j];
    }
    return null;
  }
  const setAt = (s, i, j, v) => s.slice(0, j * N + i) + v + s.slice(j * N + i + 1);
  ecv.addEventListener('pointerdown', e => {
    const r = ecv.getBoundingClientRect(), hit = pick((e.clientX - r.left) / r.width * EW, (e.clientY - r.top) / r.height * EH); if (!hit) return;
    const [i, j] = hit, I = Object.assign({}, isle()), tt = at(I.t, i, j), o = at(I.o, i, j), h = +at(I.h, i, j);
    const land = tt !== 'w';
    if (tool === 'tree' || tool === 'bush' || tool === 'house') { if (!land) return; I.o = setAt(I.o, i, j, { tree: 't', bush: 'b', house: 'h' }[tool]); if (tt === 'p') I.t = setAt(I.t, i, j, 'g'); }
    else if (tool === 'cut') { if (o === '.') return; I.o = setAt(I.o, i, j, '.'); }
    else if (tool === 'water') { I.t = setAt(I.t, i, j, 'w'); I.o = setAt(I.o, i, j, '.'); }
    else if (tool === 'path') { I.t = setAt(I.t, i, j, 'p'); I.o = setAt(I.o, i, j, '.'); }
    else if (tool === 'flower') I.t = setAt(I.t, i, j, 'f');
    else if (tool === 'grass') I.t = setAt(I.t, i, j, 'g');
    else if (tool === 'up') { if (h >= 3) return; I.h = setAt(I.h, i, j, String(h + 1)); }
    else if (tool === 'down') { if (h <= 0) return; I.h = setAt(I.h, i, j, String(h - 1)); }
    S.cartIsle = I; drawEditor(); if (ML.sfx && ML.sfx.click) ML.sfx.click();
  });
  const syncIsle = () => { renderIsle(); eb.title = t('ci_edit'); eb.setAttribute('aria-label', t('ci_edit')); };
  new MutationObserver(syncIsle).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light', 'data-cart-level'] });
  on('started', syncIsle); on('render', syncIsle); on('world', syncIsle); on('timer', () => { if (root.dataset.timer === 'running' && !ov.hidden) closeEditor(); });
})();
