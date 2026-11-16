// Ville néon full screens (3.92), chosen from proposals/neon/plein-ecran.html (artifact 8bU9tztTjmqriuRXsg7NJ4): the user
// liked all three, so Q is the free default and R, S are sold in the shop.
// - Q « facade » (default): across the river a tower whose whole façade is a screen; the time is written with its windows lit
//   pink (5×7 dot font, each dot 2×2 windows), a cyan row of windows fills with the session, one roof beacon per session
//   today (six max), the task on the podium band; the tower mirrored in the water. End: an orange wave crosses the façade,
//   64 drones rise from the river into a ring round the crown.
// - R « pose » (shop 500): the interchange and the ring road seen from a drone in a long exposure; trails get brighter and
//   lanes appear with the minutes, a few cars still drive; one small print per session today. End: a shutter flash, the
//   finished photo stays, one print more.
// - S « dash » (shop 600): inside the 80s car parked on the rooftop in the rain; the time in 7-segment digits, the bar-graph
//   tach = the session (pink near the end), minutes and sessions today, the task on the cassette. End: the tach runs to
//   pink, the headlights light the rain.
// Each scene is drawn in a virtual frame (360 high in landscape, 200 wide in portrait) so the proposal's measures hold at any
// size; the still parts are painted once per size at full resolution. Slot S.econ.equip.deepNeon (economy.js).
(() => {
  'use strict';
  const { S, on, t, today, dayKey } = ML;
  const TAU = Math.PI * 2, PINK = '#ff3fa4', ORANGE = '#ffa34a', CYAN = '#2de2ff';
  const DISP = '"Chakra Petch", "Segoe UI", sans-serif', MONO = '"JetBrains Mono", Consolas, monospace', BODY = '"ML Digits", "Atkinson Hyperlegible Next", "Segoe UI", sans-serif';
  ML.addStrings({
    fr: { dp_facade: 'La façade', dp_pose: 'La pose longue', dp_dash: 'Le tableau de bord',
      dial_facade: 'La façade', dial_facade_d: 'Ville néon · plein écran : le temps écrit avec les fenêtres d’une tour, de l’autre côté du fleuve.',
      dial_pose: 'La pose longue', dial_pose_d: 'Ville néon · plein écran : l’échangeur en pose longue, les traînées de phares s’intensifient avec la session.',
      dial_dash: 'Le tableau de bord', dial_dash_d: 'Ville néon · plein écran : dans la voiture des années 80, sous la pluie, le temps en segments lumineux.',
      nf_of: '{a} min sur {b}', nf_paused: 'En pause', nf_done: 'Session terminée · {n} min', nf_pose_of: 'Pose · {a} min sur {b}', nf_pose_done: 'Pose terminée · {n} min',
      nf_left: 'RESTE {n} MIN', nf_end: 'TERMINÉ', nf_prints: '{n} poses aujourd’hui', nf_today: 'AUJ.', nf_sessions: 'SESSIONS' },
    en: { dp_facade: 'The facade', dp_pose: 'Long exposure', dp_dash: 'Dashboard',
      dial_facade: 'The facade', dial_facade_d: 'Neon city · full screen: the time written with a tower’s windows, across the river.',
      dial_pose: 'Long exposure', dial_pose_d: 'Neon city · full screen: the interchange in a long exposure, light trails grow with the session.',
      dial_dash: 'Dashboard', dial_dash_d: 'Neon city · full screen: inside the 80s car, in the rain, the time in glowing segments.',
      nf_of: '{a} of {b} min', nf_paused: 'Paused', nf_done: 'Session done · {n} min', nf_pose_of: 'Exposure · {a} of {b} min', nf_pose_done: 'Exposure done · {n} min',
      nf_left: '{n} MIN LEFT', nf_end: 'DONE', nf_prints: '{n} prints today', nf_today: 'TODAY', nf_sessions: 'SESSIONS' },
  });
  const KEYS = ['facade', 'pose', 'dash'];
  const fsOf = () => { const k = ((S.econ && S.econ.equip) || {}).deepNeon; return KEYS.includes(k) ? k : 'facade'; };
  const prevStyle = ML.deepWorldStyle;
  ML.deepWorldStyle = k => k === 'neoncity' ? fsOf() : (prevStyle ? prevStyle(k) : null);
  const reduced = () => ML.reducedMotion();
  let nCache = { n: 0, mins: 0 }, nAt = -1e9;
  const todayStats = () => { const now = performance.now(); if (now - nAt > 5000) { nAt = now; const td = today(), ss = (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td); nCache = { n: ss.length, mins: ss.reduce((a, s) => a + (s.mins || 0), 0) }; } return nCache; };
  let lastMins = 0; // the session just done (S.total already holds the break once it ends)
  on('newday', () => { nAt = -1e9; }); on('session', s => { nAt = -1e9; if (s && s.mins) lastMins = s.mins; });

  /* ---------- helpers ---------- */
  function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let q = Math.imul(s ^ s >>> 15, 1 | s); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; }; }
  function hash(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), sm = x => x * x * (3 - 2 * x);
  function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function glow(g, x, y, r, col, a) { if (a <= 0 || r <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = Math.min(1, a); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.globalAlpha = 1; }
  function fit(g, txt, maxW) { let s = txt; while (s.length > 4 && g.measureText(s).width > maxW) s = s.slice(0, -2); return s === txt ? s : s.trimEnd() + '…'; }
  function label(g, txt, x, y, size, col, align = 'left', maxW = 0) { g.save(); g.font = `500 ${size}px ${MONO}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(maxW ? fit(g, txt, maxW) : txt, x, y); g.restore(); }
  function lineText(g, txt, x, y, size, col, maxW = 0) { if (!txt) return; g.save(); g.font = `400 ${size}px ${BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 6; g.fillText(maxW ? fit(g, txt, maxW) : txt, x, y); g.restore(); }
  const baked = new Map();
  const bake = (key, fn) => { if (!baked.has(key)) { if (baked.size > 8) baked.clear(); baked.set(key, fn()); } return baked.get(key); };

  /* ---------- the hill city above the river, painted once per size at full resolution (sc = real px per virtual px) ---------- */
  function paintCity(w, h, hz, seed, k, sc, gapMid) {
    const c = mk(w * sc, h * sc), g = c.getContext('2d'), r = rng(seed); g.scale(sc, sc);
    let gr = g.createLinearGradient(0, 0, 0, hz);
    gr.addColorStop(0, '#07020c'); gr.addColorStop(.55, '#170631'); gr.addColorStop(.9, '#3a0d3e'); gr.addColorStop(1, '#4a1040');
    g.fillStyle = gr; g.fillRect(0, 0, w, hz);
    for (let i = 0; i < 70; i++) { g.globalAlpha = .15 + r() * .35; g.fillStyle = '#e8dcff'; g.fillRect(r() * w, r() * hz * .5, 1, 1); } g.globalAlpha = 1;
    glow(g, w * .62, hz, w * .55, 'rgba(255,63,164,1)', .16);
    g.fillStyle = '#1d0a2c';
    g.beginPath(); g.moveTo(0, hz); for (let x = 0; x <= w; x += 6) g.lineTo(x, hz - h * .05 * k - Math.sin(x * .013 + seed) * h * .012 - (hash(x, 1, seed) < .2 ? h * .02 * k : 0)); g.lineTo(w, hz); g.fill();
    for (let i = 0; i < w * .35; i++) { const x = r() * w; g.fillStyle = r() < .7 ? 'rgba(255,190,120,.45)' : 'rgba(255,120,200,.5)'; g.fillRect(x, hz - r() * h * .05 * k, 1, 1); }
    const hx = w * .66, hw = w * .42, ht = h * .3 * k, hy = x => hz - ht * Math.pow(Math.max(0, 1 - Math.pow((x - hx) / hw, 2)), 1.4);
    g.fillStyle = '#170824'; g.beginPath(); g.moveTo(hx - hw, hz); for (let x = hx - hw; x <= hx + hw; x += 3) g.lineTo(x, hy(x)); g.lineTo(hx + hw, hz); g.fill();
    for (let row = 0; row < 26; row++) {
      const f = row / 26;
      for (let x = hx - hw; x < hx + hw; x += 3 + r() * 4) {
        const top = hy(x), y = top + (hz - top) * f + 2;
        if (y > hz - 2 || r() < .25) continue;
        const bw = 2 + r() * 4, bh = 2 + r() * 3 * k;
        g.fillStyle = '#25103a'; g.fillRect(x, y - bh, bw, bh);
        if (r() < .42) { g.fillStyle = r() < .82 ? `rgba(255,${170 + r() * 50 | 0},110,${.5 + r() * .4})` : 'rgba(255,90,190,.8)'; g.fillRect(x + r() * (bw - 1), y - bh + r() * (bh - 1), 1, 1); }
      }
    }
    g.strokeStyle = 'rgba(255,170,90,.55)'; g.lineWidth = .8; g.beginPath();
    for (let i = 0; i <= 7; i++) { const y = hz - ht * (i / 7) * .82, x0 = hx - hw * .5 * (1 - i / 9), x1 = hx + hw * .45 * (1 - i / 9); i % 2 ? g.lineTo(x0, y) : g.lineTo(x1, y); } g.stroke();
    for (let i = 0; i < 16; i++) {
      const x = r() * w, base = x > hx - hw && x < hx + hw ? hy(x) + 6 : hz, tw = (4 + r() * 9) * k, th = (h * (.12 + r() * .26)) * k;
      if (gapMid && Math.abs(x - w / 2) < w * .2) continue;
      gr = g.createLinearGradient(x, 0, x + tw, 0); gr.addColorStop(0, '#21102f'); gr.addColorStop(1, '#120720');
      g.fillStyle = gr; g.fillRect(x, base - th, tw, th + (hz - base));
      for (let y = base - th + 3; y < hz - 2; y += 3) for (let xx = x + 1; xx < x + tw - 1; xx += 2) if (hash(xx | 0, y | 0, seed) < .16) { g.fillStyle = 'rgba(255,200,150,.6)'; g.fillRect(xx, y, 1, 1); }
      g.fillStyle = r() < .5 ? 'rgba(255,63,164,.8)' : 'rgba(45,226,255,.7)'; g.fillRect(x, base - th, 1, th * .5);
      g.fillStyle = '#ff2a3a'; g.fillRect(x + tw / 2 - .5, base - th - 2, 1.2, 1.2);
    }
    // the water: the city mirrored and blurred, darkened, then ripples
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = `blur(${1.6 * sc}px)`; g.globalAlpha = .42; g.translate(0, 2 * hz * sc); g.scale(1, -1); g.drawImage(c, 0, 0, c.width, hz * sc, 0, 0, c.width, hz * sc); g.restore();
    gr = g.createLinearGradient(0, hz, 0, h); gr.addColorStop(0, 'rgba(12,4,22,.25)'); gr.addColorStop(1, 'rgba(8,3,14,.9)');
    g.fillStyle = gr; g.fillRect(0, hz, w, h - hz);
    for (let i = 0; i < 220; i++) { const y = hz + Math.pow(r(), 1.6) * (h - hz), x = r() * w, l = 4 + r() * 18; g.fillStyle = r() < .6 ? 'rgba(255,110,190,.16)' : 'rgba(255,190,120,.12)'; g.fillRect(x, y, l, .7); }
    return c;
  }

  /* ---------- Q · the façade ---------- */
  const FONT5 = { '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'], '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'], '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'], '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'], '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'], '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'] };
  let maskKey = '', maskSet = null;
  function timeMask(txt, cols, rows, two) {
    const key = txt + cols + 'x' + rows + two; if (key === maskKey) return maskSet;
    const on = new Set(), D = 2;
    const put = (ch, c0, r0) => { if (ch === ':') { for (const rr of [2, 4]) for (let a = 0; a < D; a++) for (let b = 0; b < D; b++) on.add((c0 + a) + ',' + (r0 + rr * D + b)); return D; } const F = FONT5[ch]; if (!F) return 5 * D; F.forEach((row, y) => [...row].forEach((v, x) => { if (v === '1') for (let a = 0; a < D; a++) for (let b = 0; b < D; b++) on.add((c0 + x * D + a) + ',' + (r0 + y * D + b)); })); return 5 * D; };
    const lineW = s => [...s].reduce((n, ch, i) => n + (ch === ':' ? D : 5 * D) + (i ? 2 : 0), 0);
    const cut = txt.lastIndexOf(':'), lines = two && cut > 0 ? [txt.slice(0, cut), txt.slice(cut + 1)] : [txt], lh = 7 * D, gap = 3, tot = lines.length * lh + (lines.length - 1) * gap;
    let r0 = Math.floor((rows - 2 - tot) / 2);
    for (const s of lines) { let c0 = Math.floor((cols - lineW(s)) / 2); [...s].forEach((ch, i) => { if (i) c0 += 2; c0 += put(ch, c0, r0); }); r0 += lh + gap; }
    maskKey = key; maskSet = on; return on;
  }
  // the façade's clock: MM:SS, or H:MM from an hour up (keeps the dot font inside the façade)
  const facadeClock = rem => { rem = Math.max(0, Math.ceil(rem)); if (rem >= 3600) return Math.floor(rem / 3600) + ':' + ML.pad2(Math.floor(rem % 3600 / 60)); return ML.pad2(Math.floor(rem / 60)) + ':' + ML.pad2(rem % 60); };
  function towerGeo(w, h) {
    const port = h > w, cols = port ? 26 : 58, rows = port ? 35 : 20;
    const fw = port ? w * .8 : Math.min(w * .6, h * 1.05), cell = fw / cols, fx = (w - fw) / 2, fy = port ? h * .11 : h * .14, hz = h * .7;
    return { port, cols, rows, fw, cell, fx, fy, fh: rows * cell, hz };
  }
  function drawTower(g, G, k, tm, mask, refl) {
    const { cols, rows, cell, fx, fy, fw, fh, hz } = G, p = k.p, ex = cell * 1.6, ra = refl ? .16 : 1;
    let gr = g.createLinearGradient(fx - ex, 0, fx + fw + ex, 0); gr.addColorStop(0, '#1c0c2b'); gr.addColorStop(.5, '#140822'); gr.addColorStop(1, '#0d0518');
    g.globalAlpha = ra; g.fillStyle = gr; g.fillRect(fx - ex, fy - cell * 1.2, fw + ex * 2, hz - fy + cell * 1.2);
    g.fillStyle = '#170a26'; g.fillRect(fx + fw * .08, fy - cell * 3.6, fw * .84, cell * 2.4); g.fillRect(fx + fw * .22, fy - cell * 5.6, fw * .56, cell * 2);
    g.fillStyle = '#0f0619'; g.fillRect(fx + fw * .5 - cell * .4, fy - cell * 11, cell * .8, cell * 5.4);
    g.fillStyle = PINK; g.globalAlpha = .7 * ra; g.fillRect(fx - ex, fy - cell * 1.2, fw + ex * 2, 1); g.fillRect(fx + fw * .08, fy - cell * 3.6, fw * .84, 1); g.fillRect(fx + fw * .22, fy - cell * 5.6, fw * .56, 1); g.globalAlpha = ra;
    g.fillStyle = '#ff2a3a'; g.fillRect(fx + fw * .5 - 1, fy - cell * 11 - 2, 2, 2); if (!refl) glow(g, fx + fw * .5, fy - cell * 11, cell * 3, 'rgba(255,42,58,1)', .5);
    for (let i = 0; i < 6; i++) { const bx = fx + fw * .26 + i * fw * .48 / 5, by = fy - cell * 6.3, lit = i < k.n; g.globalAlpha = ra; g.fillStyle = lit ? CYAN : '#2a1c36'; g.fillRect(bx - cell * .3, by - cell * .3, cell * .6, cell * .6); if (lit && !refl) glow(g, bx, by, cell * 2.2, 'rgba(45,226,255,1)', .45); }
    if (!refl) glow(g, fx + fw / 2, fy + fh * .45, fw * .55, 'rgba(255,63,164,1)', k.done ? .3 : k.paused ? .1 : .2);
    const wave = k.done ? (k.endT * .45) - .2 : -9, flick = Math.floor(tm / 3.5), digitCol = k.paused ? '#b0638f' : '#ff5cb4';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = fx + c * cell + cell * .16, y = fy + r * cell + cell * .18, ww = cell * .68, hh = cell * .64;
      let col, a = 1, halo = 0;
      const prog = r === rows - 1, digit = mask.has(c + ',' + r);
      if (digit) { col = digitCol; halo = k.paused ? .18 : .38; }
      else if (prog) { col = c < p * cols ? CYAN : '#231636'; halo = c < p * cols ? .3 : 0; }
      else { const hv = hash(c, r, 41 + (hash(c, r, 7) < .04 ? flick : 0)); col = hv < .07 ? '#ffcf94' : '#1d1030'; a = hv < .07 ? .5 : .9; }
      if (k.done && !prog && !digit) { const d = c / cols * .8 + r / rows * .45, q = clamp(1 - Math.abs(d - wave) * 6, 0, 1); if (q > 0) { col = ORANGE; a = .25 + .65 * q; halo = .3 * q; } }
      if (halo) { g.globalAlpha = halo * ra; g.fillStyle = col; g.fillRect(x - cell * .14, y - cell * .14, ww + cell * .28, hh + cell * .28); }
      g.globalAlpha = a * ra; g.fillStyle = col; g.fillRect(x, y, ww, hh);
    }
    g.globalAlpha = ra;
    const py = fy + fh + cell * .6;
    for (let y = py + cell * 3.4; y < hz - cell; y += cell * 1.3) for (let x = fx - ex + cell; x < fx + fw + ex - cell; x += cell * 1.1) { g.fillStyle = hash(x / cell * 7 | 0, y / cell * 7 | 0, 3) < .18 ? 'rgba(255,200,150,.45)' : 'rgba(40,22,58,.9)'; g.fillRect(x, y, cell * .8, cell * .7); }
    g.fillStyle = '#05020a'; g.fillRect(fx - ex, py, fw + ex * 2, cell * 2.4);
    g.fillStyle = 'rgba(45,226,255,.5)'; g.fillRect(fx - ex, py, fw + ex * 2, .8); g.fillRect(fx - ex, py + cell * 2.4, fw + ex * 2, .8);
    g.globalAlpha = 1;
    if (!refl) { const band = [k.title, k.left].filter(Boolean).join('   ·   '); label(g, band, fx + fw / 2, py + cell * 1.25, Math.max(7, cell * 1.35), CYAN, 'center', fw); }
  }
  function fsFacade(g, w, h, k, tm, sc) {
    const G = towerGeo(w, h), city = bake('q' + w + 'x' + h + '@' + sc, () => paintCity(w, h, G.hz, 11, G.port ? .8 : 1, sc, true));
    g.drawImage(city, 0, 0, w, h);
    const mask = timeMask(facadeClock(k.rem), G.cols, G.rows, G.port);
    g.save(); g.beginPath(); g.rect(0, G.hz, w, h - G.hz); g.clip(); g.translate(0, 2 * G.hz); g.scale(1, -1); drawTower(g, G, k, tm, mask, true); g.restore();
    for (let i = 0; i < 40; i++) { const y = G.hz + 3 + (i / 40) * (h - G.hz), x = G.fx + Math.sin(i * 3.1 + tm * .6) * G.fw * .05; g.fillStyle = `rgba(255,92,180,${.1 * (1 - i / 40)})`; g.fillRect(x + (i * 37 % 80), y, G.fw * (.2 + (i % 5) * .1), .8); }
    drawTower(g, G, k, tm, mask, false);
    g.fillStyle = '#0a0412'; g.fillRect(0, G.hz - 1, w, 2);
    if (!G.port) {
      g.strokeStyle = 'rgba(45,226,255,.55)'; g.lineWidth = .8; g.beginPath(); g.moveTo(G.fx + G.fw + G.cell * 2, G.fy + G.cell * 2); g.lineTo(G.fx + G.fw + G.cell * 5, G.fy - G.cell); g.lineTo(G.fx + G.fw + G.cell * 5 + 64, G.fy - G.cell); g.stroke();
      label(g, 'T-07 · 412 M', G.fx + G.fw + G.cell * 5.5, G.fy - G.cell * 2.2, 8, 'rgba(45,226,255,.8)');
    }
    if (k.done) {
      const cx = G.fx + G.fw / 2, cy = G.fy - G.cell * 4, R = G.fw * .42, rise = sm(clamp(k.endT / 2.2, 0, 1));
      for (let i = 0; i < 64; i++) {
        const a = i / 64 * TAU + tm * .15, x = cx + Math.cos(a) * R * (.3 + .7 * rise), y0 = h * .92 - (i % 8) * 4, y1 = cy + Math.sin(a) * R * .22, y = y0 + (y1 - y0) * clamp(rise * 1.2 - (i % 8) * .03, 0, 1);
        g.fillStyle = i % 4 ? CYAN : PINK; g.fillRect(x - 1, y - 1, 2, 2); glow(g, x, y, 5, i % 4 ? 'rgba(45,226,255,1)' : 'rgba(255,63,164,1)', .35);
      }
    }
    lineText(g, k.line, w / 2, G.port ? h * .78 : h * .86, G.port ? 10 : 12, 'rgba(241,232,244,.85)', w * .8);
  }

  /* ---------- R · the long exposure ---------- */
  function poseGeo(w, h) { const port = h > w; return { port, S: port ? w * .5 : h * .42, k: .64, cx: w / 2, cy: port ? h * .45 : h * .5 }; }
  function poseRoads(G) {
    const { S: U, k, cx, cy } = G, P = (X, Y) => [cx + X * U, cy + Y * U * k];
    const line = (x0, y0, x1, y1, n = 60) => Array.from({ length: n + 1 }, (_, i) => P(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n));
    const arc = (ox, oy, r, a0, a1, n = 90) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return P(ox + Math.cos(a) * r, oy + Math.sin(a) * r); });
    const L = 4.2, roads = [];
    for (const s of [-1, 1]) for (let l = 0; l < 3; l++) {
      const o = s * (.05 + l * .028);
      roads.push({ pts: line(-L, o, L, o), col: s < 0 ? 'w' : 'r', lane: l, w: .026 });
      roads.push({ pts: line(o, -L, o, L), col: s < 0 ? 'r' : 'w', lane: l + 1, w: .026 });
    }
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) roads.push({ pts: arc(sx * .44, sy * .44, .27, 0, TAU), col: sx * sy > 0 ? 'w' : 'r', lane: 2, w: .03 });
    for (let l = 0; l < 2; l++) { roads.push({ pts: arc(0, 0, 1.08 + l * .03, 0, TAU, 220), col: 'w', lane: l * 2, w: .028 }); roads.push({ pts: arc(0, 0, 1.15 + l * .03, 0, TAU, 220), col: 'r', lane: l * 2 + 1, w: .028 }); }
    return { roads, P };
  }
  function paintPoseBase(w, h, G, R, sc) {
    const c = mk(w * sc, h * sc), g = c.getContext('2d'), r = rng(77), { S: U, k } = G, P = R.P; g.scale(sc, sc);
    g.fillStyle = '#0b0612'; g.fillRect(0, 0, w, h);
    const ry0 = -1.95, ry1 = -1.55, [, a] = P(0, ry0), [, b] = P(0, ry1);
    let gr = g.createLinearGradient(0, a, 0, b); gr.addColorStop(0, '#120720'); gr.addColorStop(.5, '#1a0a2c'); gr.addColorStop(1, '#120720'); g.fillStyle = gr; g.fillRect(0, a, w, b - a);
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < .5 ? 'rgba(255,63,164,.25)' : 'rgba(255,170,90,.2)'; g.fillRect(r() * w, a + r() * (b - a), 3 + r() * 12, .7); }
    for (let X = -4; X < 4; X += .24) for (let Y = -4; Y < 4; Y += .24) {
      const mx = X + .12, my = Y + .12, d = Math.hypot(mx, my);
      if (d < 1.34 || Math.abs(mx) < .2 || Math.abs(my) < .2 || (my > ry0 - .1 && my < ry1 + .1)) continue;
      const [x, y] = P(X + .02, Y + .02), bw = .2 * U, bd = .2 * U * k, tall = (hash(X * 50 | 0, Y * 50 | 0, 5) * (d < 2 ? .5 : .9) + .05) * U * .5;
      if (x > w + 10 || y > h + 10 || x + bw < -10 || y + bd + tall < -10) continue;
      g.fillStyle = '#0f0718'; g.fillRect(x, y + bd - 1, bw, tall);
      for (let yy = y + bd + 2; yy < y + bd + tall - 1; yy += 3) for (let xx = x + 1.5; xx < x + bw - 1; xx += 2.5) if (hash(xx * 3 | 0, yy * 3 | 0, 9) < .2) { g.fillStyle = hash(xx | 0, yy | 0, 4) < .85 ? 'rgba(255,196,140,.55)' : 'rgba(255,80,180,.7)'; g.fillRect(xx, yy, 1, 1); }
      g.fillStyle = '#170d22'; g.fillRect(x, y, bw, bd);
      g.fillStyle = '#2b1a3b'; g.fillRect(x, y, bw, .8);
      for (let q = 0; q < 3; q++) if (r() < .6) { g.fillStyle = '#120a1b'; g.fillRect(x + r() * bw * .7, y + r() * bd * .7, bw * .18, bd * .2); }
      if (r() < .12) { g.fillStyle = r() < .5 ? 'rgba(255,63,164,.8)' : 'rgba(45,226,255,.7)'; g.fillRect(x + 1, y + bd - 1.5, bw - 2, 1); }
    }
    for (let i = 0; i < 260; i++) { const an = r() * TAU, d = Math.sqrt(r()), X = Math.cos(an) * d, Y = Math.sin(an) * d; if (Math.abs(X) < .16 || Math.abs(Y) < .16 || Math.hypot(Math.abs(X) - .44, Math.abs(Y) - .44) < .33) continue; const [x, y] = P(X, Y); g.fillStyle = r() < .5 ? '#170d1f' : '#1c1126'; g.beginPath(); g.arc(x, y, (1.4 + r() * 2) * U / 150, 0, TAU); g.fill(); }
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pass of [0, 1]) for (const rd of R.roads) { g.beginPath(); rd.pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = pass ? '#1b1424' : '#2a2034'; g.lineWidth = rd.w * U * (pass ? 1 : 1.25); g.stroke(); }
    for (let X = -4; X < 4; X += .14) for (const [px, py] of [[X, .15], [X, -.15], [.15, X], [-.15, X]]) { const [x, y] = P(px, py); if (x < -5 || x > w + 5 || y < -5 || y > h + 5) continue; g.fillStyle = '#ffb35a'; g.fillRect(x - .6, y - .6, 1.2, 1.2); glow(g, x, y, U * .03, 'rgba(255,170,80,1)', .25); }
    return c;
  }
  function fsPose(g, w, h, k, tm, sc) {
    const G = poseGeo(w, h), R = bake('rr' + w + 'x' + h, () => poseRoads(G)), base = bake('r' + w + 'x' + h + '@' + sc, () => paintPoseBase(w, h, G, R, sc));
    g.drawImage(base, 0, 0, w, h);
    const p = k.p;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const rd of R.roads) {
      const show = clamp((p - rd.lane * .11) * 4, 0, 1); if (show <= 0) continue;
      const a = (.3 + .7 * p) * show, warm = rd.col === 'r';
      g.beginPath(); rd.pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
      g.strokeStyle = warm ? `rgba(255,40,70,${a * .35})` : `rgba(255,236,210,${a * .3})`; g.lineWidth = G.S * .022; g.stroke();
      g.strokeStyle = warm ? `rgba(255,70,120,${a})` : `rgba(255,248,236,${a})`; g.lineWidth = Math.max(1, G.S * .007); g.stroke();
    }
    if (k.done) { glow(g, G.cx, G.cy, G.S * 1.6, 'rgba(255,63,164,1)', .22); glow(g, G.cx, G.cy, G.S * .8, 'rgba(255,220,200,1)', .12); }
    if (!k.paused || k.done) R.roads.forEach((rd, j) => { if (j % 3) return; const n = rd.pts.length - 1; for (let q = 0; q < 2; q++) { const u = ((tm * .012 * (1 + (j % 4) * .25) + q * .5 + j * .137) % 1), [x, y] = rd.pts[Math.floor(u * n)], warm = rd.col === 'r'; g.fillStyle = warm ? '#ff4060' : '#fff6e8'; g.fillRect(x - .9, y - .9, 1.8, 1.8); glow(g, x, y, G.S * .035, warm ? 'rgba(255,60,90,1)' : 'rgba(255,240,220,1)', .5); } });
    g.restore();
    const fs = G.port ? w * .24 : h * .2;
    glow(g, G.cx, G.cy, fs * 2.4, 'rgba(6,2,10,1)', .78);
    g.save(); g.font = `italic 600 ${fs}px ${DISP}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(255,63,164,.55)'; g.shadowBlur = fs * .3; g.fillStyle = k.paused ? '#b9a9c2' : '#fff0f8'; g.globalAlpha = k.done ? .75 : 1; g.fillText(k.clock, G.cx, G.cy); g.restore();
    lineText(g, k.done ? t('nf_pose_done', { n: k.mins }) : k.paused ? t('nf_paused') : t('nf_pose_of', { a: k.elapsed, b: k.mins }), G.cx, G.cy + fs * .66, Math.max(10, fs * .16), 'rgba(241,232,244,.9)');
    lineText(g, k.title, G.cx, G.cy + fs * .9, Math.max(9, fs * .13), 'rgba(200,180,214,.75)', w * .7);
    // the film strip: one print per session today (the session just done shows bright)
    const prints = Math.min(10, k.n), fwp = G.port ? 18 : 26, fhp = fwp * .66, sx = G.port ? 12 : 18, sy = G.port ? h * .18 : h * .1;
    for (let i = 0; i < prints; i++) {
      const x = sx + i * (fwp + 5), fresh = k.done && i === prints - 1;
      g.fillStyle = '#05020a'; g.fillRect(x - 2, sy - 2, fwp + 4, fhp + 4);
      const gr = g.createRadialGradient(x + fwp / 2, sy + fhp / 2, 0, x + fwp / 2, sy + fhp / 2, fwp * .6); gr.addColorStop(0, fresh ? '#ffd2e8' : '#a63a7c'); gr.addColorStop(1, '#1a0a26');
      g.fillStyle = gr; g.fillRect(x, sy, fwp, fhp);
      g.strokeStyle = fresh ? 'rgba(255,240,250,.9)' : 'rgba(255,200,230,.45)'; g.lineWidth = .7; g.beginPath(); g.moveTo(x, sy + fhp / 2); g.lineTo(x + fwp, sy + fhp / 2); g.moveTo(x + fwp / 2, sy); g.lineTo(x + fwp / 2, sy + fhp); g.stroke();
    }
    if (prints) label(g, t('nf_prints', { n: k.n }), sx, sy + fhp + 10, G.port ? 7 : 8, 'rgba(241,232,244,.65)');
    if (k.done) { const f = Math.max(0, 1 - k.endT / 1.2); if (f > 0) { g.fillStyle = `rgba(255,246,250,${.55 * f * f})`; g.fillRect(0, 0, w, h); } }
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, h - 2, w, 2);
    const gb = g.createLinearGradient(0, 0, w, 0); gb.addColorStop(0, PINK); gb.addColorStop(1, ORANGE); g.fillStyle = gb; g.fillRect(0, h - 2, w * p, 2);
  }

  /* ---------- S · the dashboard ---------- */
  const SEG = { '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg' };
  function seg7(g, ch, x, y, W, H, th, on, off) {
    const lit = SEG[ch] || '', hh = H / 2, e = th / 2;
    const hseg = (x0, y0) => { g.beginPath(); g.moveTo(x0 + e, y0); g.lineTo(x0 + e * 2, y0 - e); g.lineTo(x0 + W - e * 2, y0 - e); g.lineTo(x0 + W - e, y0); g.lineTo(x0 + W - e * 2, y0 + e); g.lineTo(x0 + e * 2, y0 + e); g.closePath(); };
    const vseg = (x0, y0) => { g.beginPath(); g.moveTo(x0, y0 + e); g.lineTo(x0 + e, y0 + e * 2); g.lineTo(x0 + e, y0 + hh - e * 2); g.lineTo(x0, y0 + hh - e); g.lineTo(x0 - e, y0 + hh - e * 2); g.lineTo(x0 - e, y0 + e * 2); g.closePath(); };
    const parts = { a: () => hseg(x, y), g: () => hseg(x, y + hh), d: () => hseg(x, y + H), f: () => vseg(x, y), b: () => vseg(x + W, y), e: () => vseg(x, y + hh), c: () => vseg(x + W, y + hh) };
    for (const s of 'abcdefg') { const is = lit.includes(s); if (!is && !off) continue; parts[s](); g.fillStyle = is ? on : off; g.fill(); }
  }
  function segText(g, txt, x, y, H, col, ghost, glowCol, maxW) {
    let W = H * .5, th = H * .11, gap = H * .2;
    const width = () => { let tot = 0; for (const ch of txt) tot += ch === ':' ? th * 3 : W + gap; return tot - gap; };
    let tot = width(); if (maxW && tot > maxW) { const f = maxW / tot; H *= f; W *= f; th *= f; gap *= f; tot = width(); }
    g.save(); g.translate(x - tot / 2, y); g.transform(1, 0, -.12, 1, 0, 0);
    let cx = 0;
    // ghost segments first (no glow), then the lit ones with glow
    if (ghost) for (const ch of txt) { if (ch === ':') { cx += th * 3; continue; } seg7(g, '', cx, 0, W, H, th, col, ghost); cx += W + gap; }
    cx = 0; if (glowCol) { g.shadowColor = glowCol; g.shadowBlur = H * .25; }
    for (const ch of txt) { if (ch === ':') { g.fillStyle = col; g.fillRect(cx + th * .6, H * .28, th * 1.1, th * 1.1); g.fillRect(cx + th * .6, H * .66, th * 1.1, th * 1.1); cx += th * 3; continue; } seg7(g, ch, cx, 0, W, H, th, col, null); cx += W + gap; }
    g.restore();
  }
  const drops = (() => { const r = rng(17); return Array.from({ length: 140 }, () => [r(), r(), .6 + r() * 1.6, r()]); })();
  function fsDash(g, w, h, k, tm, sc) {
    const port = h > w, p = k.p, wy0 = h * .05, wy1 = port ? h * .4 : h * .56;
    const pan = port ? [w * .04, h * .45, w * .92, h * .27] : [w * .22, h * .6, w * .56, h * .3];
    const city = bake('s' + w + 'x' + h + '@' + sc, () => paintCity(w, h, wy1 - (wy1 - wy0) * .22, 23, port ? .55 : .9, sc, false));
    g.fillStyle = '#050208'; g.fillRect(0, 0, w, h);
    const pil = port ? w * .02 : w * .1;
    const shape = () => { g.beginPath(); g.moveTo(pil * .15, wy1); g.lineTo(pil, wy0); g.lineTo(w - pil, wy0); g.lineTo(w - pil * .15, wy1); g.closePath(); };
    g.save(); shape(); g.clip();
    g.drawImage(city, 0, 0, w, h);
    const lights = k.done ? sm(clamp(k.endT / .6, 0, 1)) : 0;
    if (lights > 0) {
      g.globalAlpha = lights;
      for (const s of [-1, 1]) { const x0 = w / 2 + s * w * (port ? .3 : .2), gr = g.createLinearGradient(0, wy1, 0, wy0 + (wy1 - wy0) * .4); gr.addColorStop(0, 'rgba(255,246,226,.35)'); gr.addColorStop(1, 'rgba(255,246,226,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x0 - w * .04, wy1); g.lineTo(x0 + w * .04, wy1); g.lineTo(x0 + s * w * .02 + w * .14, wy0 + (wy1 - wy0) * .45); g.lineTo(x0 + s * w * .02 - w * .14, wy0 + (wy1 - wy0) * .45); g.fill(); }
      g.strokeStyle = 'rgba(255,250,236,.5)'; g.lineWidth = .7; const r2 = rng(5); for (let i = 0; i < 90; i++) { const x = w / 2 + (r2() - .5) * w * .7, y = wy0 + (wy1 - wy0) * (.45 + ((r2() + tm * .4) % 1) * .55); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1, y + 5); g.stroke(); }
      g.globalAlpha = 1;
    }
    g.fillStyle = 'rgba(20,8,30,.18)'; g.fillRect(0, wy0, w, wy1 - wy0);
    for (const [dx, dy, s, sp] of drops) {
      const slide = sp > .82, y = wy0 + ((dy + (slide ? tm * .02 * (sp - .7) : 0)) % 1) * (wy1 - wy0), x = dx * w, rr = s * (port ? .8 : 1.1);
      g.fillStyle = 'rgba(255,160,220,.12)'; g.beginPath(); g.arc(x, y, rr * 1.4, 0, TAU); g.fill();
      g.fillStyle = 'rgba(10,4,16,.5)'; g.beginPath(); g.arc(x, y + rr * .3, rr, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,220,240,.55)'; g.fillRect(x - rr * .4, y - rr * .4, rr * .5, rr * .5);
      if (slide) { g.strokeStyle = 'rgba(255,190,230,.18)'; g.lineWidth = rr * .8; g.beginPath(); g.moveTo(x, y - rr); g.lineTo(x + .5, y - rr - 10 * s); g.stroke(); }
    }
    g.restore();
    g.fillStyle = '#0a0510'; g.fillRect(0, 0, w, wy0);
    g.strokeStyle = 'rgba(255,63,164,.18)'; g.lineWidth = 1; shape(); g.stroke();
    const mw = port ? w * .3 : w * .16, mh = mw * .26;
    g.fillStyle = '#0d0714'; g.beginPath(); g.roundRect(w / 2 - mw / 2, wy0 + 3, mw, mh, mh * .4); g.fill();
    g.fillStyle = 'rgba(255,120,200,.12)'; g.fillRect(w / 2 - mw * .4, wy0 + 3 + mh * .3, mw * .3, 1);
    let gr = g.createLinearGradient(0, wy1, 0, h); gr.addColorStop(0, '#160c1e'); gr.addColorStop(1, '#060309');
    g.fillStyle = gr; g.fillRect(0, wy1, w, h - wy1);
    g.fillStyle = 'rgba(255,63,164,.22)'; g.fillRect(0, wy1, w, 1);
    const [px, py, pw, ph] = pan;
    g.fillStyle = '#1b0f25'; g.beginPath(); g.moveTo(px - pw * .05, py + ph * .1); g.lineTo(px + pw * .04, py - ph * .1); g.lineTo(px + pw * .96, py - ph * .1); g.lineTo(px + pw * 1.05, py + ph * .1); g.closePath(); g.fill();
    g.fillStyle = '#030105'; g.beginPath(); g.roundRect(px, py, pw, ph, 5); g.fill();
    g.strokeStyle = '#2b1a38'; g.lineWidth = 1.2; g.stroke();
    // the bar-graph tach: the session (at the end it runs to the last bar)
    const N = 40, ty = py + ph * .14, tx0 = px + pw * .08, tx1 = px + pw * .92, segW = (tx1 - tx0) / N, tach = k.done ? clamp(.85 + k.endT * .25, 0, 1) : p;
    for (let i = 0; i < N; i++) {
      const lit = i < tach * N, col = k.done ? PINK : i >= 34 ? PINK : i >= 28 ? ORANGE : CYAN, bump = Math.sin(i / (N - 1) * Math.PI) * ph * .06, hgt = ph * (.05 + .1 * i / N);
      g.fillStyle = lit ? col : '#1a0f24';
      g.save(); g.translate(tx0 + i * segW, ty - bump + ph * .14 - hgt); g.transform(1, 0, -.25, 1, 0, 0); g.fillRect(0, 0, segW * .62, hgt); g.restore();
    }
    if (k.done) glow(g, tx1 - pw * .1, ty, pw * .3, 'rgba(255,63,164,1)', .35);
    const tot = k.mins || 40;
    [0, .25, .5, .75, 1].forEach((f, i) => label(g, String(Math.round(tot * f)), tx0 + (tx1 - tx0) * i / 4, ty + ph * .2, Math.max(6, ph * .055), 'rgba(180,166,191,.6)', 'center'));
    if (!port) label(g, 'MIN', tx1 + pw * .03, ty + ph * .2, Math.max(6, ph * .05), 'rgba(180,166,191,.6)');
    const H = port ? ph * .32 : ph * .36;
    segText(g, k.clock, px + pw / 2, py + ph * .4, H, k.paused ? '#a06a8c' : '#ff6ab8', 'rgba(60,14,42,.16)', k.paused ? null : 'rgba(255,63,164,.8)', pw * .6);
    const sH = ph * .13, lx = port ? px + pw * .13 : px + pw * .1, rx = port ? px + pw * .87 : px + pw * .9, ls = Math.max(6, ph * .05);
    label(g, t('nf_today'), lx, py + ph * .43, ls, 'rgba(180,166,191,.7)', 'center');
    segText(g, String(Math.min(9999, k.today)), lx, py + ph * .5, sH, CYAN, 'rgba(10,40,50,.6)', 'rgba(45,226,255,.6)', pw * .16);
    label(g, 'MIN', lx, py + ph * .73, ls, 'rgba(180,166,191,.7)', 'center');
    label(g, t('nf_sessions'), rx, py + ph * .43, ls, 'rgba(180,166,191,.7)', 'center');
    segText(g, String(Math.min(99, k.n)), rx, py + ph * .5, sH, ORANGE, 'rgba(50,30,10,.6)', 'rgba(255,163,74,.6)', pw * .12);
    lineText(g, k.line, px + pw / 2, py + ph * .89, Math.max(8, ph * .07), 'rgba(241,232,244,.8)', pw * .7);
    // the tape deck: the task on the cassette label
    const dw = port ? w * .7 : w * .2, dh = dw * .36, dx = port ? w / 2 - dw / 2 : w * .79, dy = port ? h * .78 : h * .66;
    g.fillStyle = '#120a19'; g.beginPath(); g.roundRect(dx, dy, dw, dh, 3); g.fill(); g.strokeStyle = '#2b1a38'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#05020a'; g.fillRect(dx + dw * .06, dy + dh * .14, dw * .88, dh * .52);
    g.fillStyle = '#d9cbb8'; g.fillRect(dx + dw * .1, dy + dh * .19, dw * .8, dh * .16);
    label(g, 'A · ' + (k.title || 'LockIN'), dx + dw * .13, dy + dh * .27, Math.max(5, dh * .11), '#2a1424', 'left', dw * .74);
    const spin = k.paused ? 0 : tm * .3;
    for (const s of [-1, 1]) { const rx2 = dx + dw / 2 + s * dw * .2, ry2 = dy + dh * .5, rr = dh * .11; g.strokeStyle = 'rgba(210,190,220,.55)'; g.lineWidth = 1; g.beginPath(); g.arc(rx2, ry2, rr, 0, TAU); g.stroke(); for (let q = 0; q < 6; q++) { const a = spin * s + q * TAU / 6; g.beginPath(); g.moveTo(rx2 + Math.cos(a) * rr * .35, ry2 + Math.sin(a) * rr * .35); g.lineTo(rx2 + Math.cos(a) * rr * .8, ry2 + Math.sin(a) * rr * .8); g.stroke(); } }
    for (let q = 0; q < 4; q++) { g.fillStyle = '#1f1229'; g.fillRect(dx + dw * (.1 + q * .21), dy + dh * .74, dw * .16, dh * .14); }
    g.fillStyle = CYAN; g.fillRect(dx + dw * .1, dy + dh * .78, 2, 2);
    if (!port) for (let q = 0; q < 5; q++) { g.fillStyle = '#0f0815'; g.fillRect(w * .04, h * .66 + q * h * .028, w * .12, h * .016); }
    const wr = port ? w * .62 : w * .3, wcx = port ? w / 2 : px + pw / 2, wcy = h + wr * (port ? .86 : .8);
    g.strokeStyle = '#0c0611'; g.lineWidth = port ? 14 : 18; g.beginPath(); g.arc(wcx, wcy, wr, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    g.strokeStyle = 'rgba(255,63,164,.12)'; g.lineWidth = 1; g.beginPath(); g.arc(wcx, wcy, wr + (port ? 7 : 9), Math.PI * 1.2, Math.PI * 1.8); g.stroke();
  }

  /* ---------- the full-screen loop ---------- */
  const FS = { facade: fsFacade, pose: fsPose, dash: fsDash };
  // draw in a virtual frame: 360 high in landscape, 200 wide in portrait
  function paintAt(g, W, H, key, ctx, tm, dpr) {
    const port = H > W, s = port ? W / 200 : H / 360, w = W / s, h = H / s;
    g.save(); g.scale(s, s); FS[key](g, w, h, ctx, tm, s * dpr); g.restore();
  }
  let fCtx = null, fRaf = 0, fLast = 0, fEndAt = -1e9, fCur = '';
  function fsPaint() {
    const cv = document.getElementById('nf-cv'); if (!cv || !fCtx) return false;
    const W = cv.clientWidth, H = cv.clientHeight; if (!(W > 0 && H > 0)) return true;
    const dpr = Math.min(2, window.devicePixelRatio || 1), pw = Math.round(W * dpr), ph = Math.round(H * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const now = performance.now(); fCtx.endT = reduced() ? 9 : (now - fEndAt) / 1000;
    paintAt(g, W, H, fCur, fCtx, reduced() ? 8 : now / 1000, dpr);
    return true;
  }
  function fsLoop(ts) { fRaf = 0; if (ts - fLast > 45) { fLast = ts; if (!fsPaint()) return; } if (!reduced()) fRaf = requestAnimationFrame(fsLoop); }
  const ctxOf = (key, { rem, run, done, title }) => {
    const tot = S.total || 1, p = done ? 1 : clamp(1 - Math.max(0, rem) / tot, 0, 1), st = todayStats(), mins = done && lastMins ? lastMins : Math.round(tot / 60), elapsed = Math.floor((tot - Math.max(0, rem)) / 60);
    const paused = !run && !done && p > 0;
    return { p, done, paused, n: st.n, today: st.mins + (done ? 0 : elapsed), mins, elapsed, rem: done ? 0 : rem, clock: MiniView.fmtClock(done ? 0 : rem), title: (done && fCtx && fCtx.title) || title || '',
      left: done ? t('nf_end') : t('nf_left', { n: Math.ceil(Math.max(0, rem) / 60) }),
      line: done ? t('nf_done', { n: mins }) : paused ? t('nf_paused') : t('nf_of', { a: elapsed, b: mins }) };
  };
  const fsStyle = key => ({
    html: (top, dock) => `<canvas id="nf-cv" aria-hidden="true"></canvas>${top}<p id="nf-task"></p>${dock}`,
    render: arg => {
      if (arg.done && !(fCtx && fCtx.done)) fEndAt = performance.now();
      fCur = key; fCtx = ctxOf(key, arg);
      const el = document.getElementById('nf-task'); if (el) el.textContent = arg.title || '';
      if (reduced()) fsPaint(); else if (!fRaf) fRaf = requestAnimationFrame(fsLoop);
    },
    doneMs: () => reduced() ? 4200 : 6500,
  });
  ML.deepStyles = Object.assign(ML.deepStyles || {}, { facade: fsStyle('facade'), pose: fsStyle('pose'), dash: fsStyle('dash') });

  /* ---------- shop pictures (painted once, mid-session) ---------- */
  const pics = {}, prevPic = ML.neonShopPic;
  ML.neonShopPic = k => {
    if (!FS[k]) return prevPic ? prevPic(k) : '';
    if (!pics[k]) { try {
      const c = mk(560, 320), g = c.getContext('2d');
      paintAt(g, 560, 320, k, { p: .55, done: false, paused: false, n: 2, today: 85, mins: 40, elapsed: 22, rem: 1080, clock: '18:00', title: '', left: '', line: '', endT: 99 }, 8, 1);
      pics[k] = c.toDataURL('image/jpeg', .85);
    } catch (e) { return ''; } }
    return `<img class="fog-fs-prev" src="${pics[k]}" alt="">`;
  };
})();
