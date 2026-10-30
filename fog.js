// Brouillard (Scattered, night world) 3.52, chosen from proposals/brouillard/brouillard-v3.html (artifact 2Qv11L8iuyX2Fi7qrJMLxD;
// rounds 1 and 2 kept as brouillard.html and brouillard-v2.html). Idea: being scattered is having your head in the fog, and
// focus clears it.
// - Background « Le seuil » (M): an endless sea of grey fog, a lone stone door opening onto another place (dawn, a hill, a
//   tree), stone fragments orbiting the door (four, plus one crimson-edged per session today, eight max), an upside-down
//   staircase, an inverted island whose waterfall flows upward, a huge mask half sunk in the fog, two giant robed shapes seen
//   only in thick fog, a halo with no moon. During a session the fog sinks with the progress, the door's light grows, steps
//   appear under it and a small figure stands there. End (7 s): the door's glyphs light up, the fragments form a ring, the
//   mask opens its eyes. Drawn in a virtual frame 640 wide (or 360 high on screens wider than 16:9), fog bands from tileable
//   textures painted once.
// - Dials (canvas over the shared ring, the time drawn inside, the HTML clock kept for screen readers): J « veil » (default:
//   patinated bronze bezel engraved with 48 arches, crimson rubies every five minutes, an aperture of turning fog that clears
//   with the session, sceptre hand, the time in a cartouche, a crimson spark for the seconds), K « rose » (shop 800: a stone
//   rose window, 12 stained-glass lancets light up in turn, roundels count sessions), L « skeleton » (shop 1200, Premium only:
//   an open movement with gears, escapement, balance and blued hairspring, striped bridges, crimson enamel minute ring).
// Slot: S.econ.equip.dialFog, sold in economy.js.
(() => {
  'use strict';
  const { S, on, today, dayKey } = ML;
  const root = document.documentElement, TAU = Math.PI * 2;
  ML.addStrings({
    fr: { dial_veil: 'Le cadran de bronze', dial_veil_d: 'Brouillard · lunette en bronze gravée, rubis pourpres, une ouverture sur le brouillard qui se dissipe.',
      dial_rose: 'La rosace', dial_rose_d: 'Brouillard · douze lancettes de vitrail qui s’allument au fil de la session.',
      dial_skeleton: 'Le squelette', dial_skeleton_d: 'Brouillard · un mouvement à nu : rouages, balancier, émail pourpre.' },
    en: { dial_veil: 'The bronze dial', dial_veil_d: 'Fog · engraved bronze bezel, crimson rubies, an opening onto fog that clears.',
      dial_rose: 'The rose window', dial_rose_d: 'Fog · twelve stained-glass lancets light up as the session goes.',
      dial_skeleton: 'The skeleton', dial_skeleton_d: 'Fog · an open movement: gears, balance wheel, crimson enamel.' },
  });
  const isOn = () => root.dataset.theme === 'fog' && !root.dataset.light;
  const dialOf = () => { const k = ((S.econ && S.econ.equip) || {}).dialFog; return k === 'rose' || k === 'skeleton' ? k : 'veil'; };
  let nCache = 0, nAt = -1e9;
  const count = () => { const now = performance.now(); if (now - nAt > 5000) { nAt = now; const td = today(); nCache = (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length; } return nCache; };
  on('newday', () => { nAt = -1e9; });
  const reduced = () => ML.reducedMotion();

  /* ---------- helpers ---------- */
  function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  const sm = t => t * t * (3 - 2 * t), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function vn(x, y, s, P) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = sm(x - ix), fy = sm(y - iy), w = i => P ? ((i % P) + P) % P : i;
    const a = hash(w(ix), iy, s), b = hash(w(ix + 1), iy, s), c = hash(w(ix), iy + 1, s), d = hash(w(ix + 1), iy + 1, s);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function fbm(x, y, s, P, o = 4) { let v = 0, a = .5, f = 1, n = 0; for (let i = 0; i < o; i++) { v += a * vn(x * f, y * f, s + i * 17, P ? P * f : 0); n += a; a *= .5; f *= 2; } return v / n; }
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  const TW = 640; // fog band textures are 640 wide and tile horizontally
  function fogTex(h, seed, sx, sy, lo = .38, col = [186, 189, 198]) {
    const c = mk(TW, h), g = c.getContext('2d'), im = g.createImageData(TW, h), d = im.data, P = Math.round(TW / sx);
    for (let y = 0; y < h; y++) {
      const env = Math.pow(Math.sin(Math.PI * (y + .5) / h), .9), sh = 1 - .18 * (y / h);
      for (let x = 0; x < TW; x++) {
        const a = clamp((fbm(x / sx, y / sy, seed, P, 5) - lo) * 2.3, 0, 1) * env, i = (y * TW + x) * 4;
        d[i] = col[0] * sh; d[i + 1] = col[1] * sh; d[i + 2] = col[2] * sh; d[i + 3] = a * 255;
      }
    }
    g.putImageData(im, 0, 0); return c;
  }
  function band(g, W, tex, y, h, a, off) {
    if (a <= .005) return;
    const x = ((off % W) + W) % W;
    g.globalAlpha = Math.min(1, a); g.drawImage(tex, x - W, y, W, h); g.drawImage(tex, x, y, W, h); g.globalAlpha = 1;
  }
  function glow(g, x, y, r, col, a) {
    if (a <= 0 || r <= 0) return;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = Math.min(1, a); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.globalAlpha = 1;
  }
  function line(g, x0, y0, x1, y1) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  function star4(g, x, y, R, r) { g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, rr = k % 2 ? r : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
  function matTex(sz, seed, kind) {
    const c = mk(sz, sz), g = c.getContext('2d'), im = g.createImageData(sz, sz), d = im.data;
    for (let y = 0; y < sz; y++) for (let x = 0; x < sz; x++) {
      const a = fbm(x / 30, y / 30, seed, 0, 4), b = fbm(x / 17 + 50, y / 17, seed + 5, 0, 3), v = hash(x, y, seed + 9) - .5;
      let R, G, B;
      if (kind === 'bronze') {
        const k = clamp(a * 1.7 - .35, 0, 1); R = 92 + k * 112; G = 64 + k * 82; B = 34 + k * 46;
        const vg = clamp((b - .6) * 4, 0, 1) * .7; R += (78 - R) * vg; G += (128 - G) * vg; B += (110 - B) * vg;
      } else { const k = clamp(a * 1.5 - .25, 0, 1); R = 60 + k * 52; G = 61 + k * 52; B = 68 + k * 52; }
      const i = (y * sz + x) * 4; d[i] = R + v * 20; d[i + 1] = G + v * 20; d[i + 2] = B + v * 20; d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0); return c;
  }
  function fogDisc(sz, seed) {
    const c = mk(sz, sz), g = c.getContext('2d'), im = g.createImageData(sz, sz), d = im.data, h = sz / 2;
    for (let y = 0; y < sz; y++) for (let x = 0; x < sz; x++) {
      const rr = Math.hypot(x - h, y - h) / h; if (rr > 1) continue;
      const a = clamp((fbm(x / 24, y / 24, seed, 0, 5) - .3) * 2.2, 0, 1) * (1 - Math.pow(rr, 6)), i = (y * sz + x) * 4;
      d[i] = 176; d[i + 1] = 179; d[i + 2] = 189; d[i + 3] = a * 255;
    }
    g.putImageData(im, 0, 0); return c;
  }

  /* ---------- M · « Le seuil », the background (game.js's fog branch calls ML.fogDraw) ---------- */
  let TX = null; // fog textures, painted once
  const tex = () => TX || (TX = {
    sea: [fogTex(70, 61, 80, 22, .22, [182, 185, 195]), fogTex(80, 67, 64, 24, .23, [156, 159, 169]), fogTex(90, 73, 80, 26, .24, [132, 135, 145]), fogTex(100, 79, 64, 28, .25, [108, 111, 121])],
    wisp: fogTex(120, 83, 80, 30, .42, [190, 193, 203]), top: fogTex(100, 131, 64, 26, .34, [150, 153, 164]) });
  function build(W, H) {
    const r = rng(404);
    const glyphs = Array.from({ length: 24 }, () => ({ side: r() < .5 ? -1 : 1, y: r(), segs: Array.from({ length: 2 + Math.floor(r() * 2) }, () => [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1, r() * 2 - 1]) }));
    const frags = Array.from({ length: 12 }, (_, i) => ({ type: [0, 1, 2, 3, 0, 1, 3, 2, 0, 3, 1, 2][i], w: 10 + r() * 10, h: 15 + r() * 18, spin: (r() - .5) * .35, p: r() * 6 }));
    const motes = Array.from({ length: 36 }, () => ({ x: r() * W, v: 4 + r() * 6, p: r() * 6, o: r() }));
    const inner = Array.from({ length: 26 }, () => [r(), r() * .5, .5 + r() * .7]);
    const cracks = Array.from({ length: 6 }, () => { let x = (r() - .5) * 56, y = -50 + r() * 50; const pts = [[x, y]]; for (let k = 0; k < 4; k++) { x += (r() - .5) * 12; y += 4 + r() * 9; pts.push([x, y]); } return pts; });
    const island = []; for (let k = 0; k <= 16; k++) { const q = k / 16; island.push([(q - .5) * 96, -Math.sin(q * Math.PI) * (40 + r() * 22) - r() * 6]); }
    const stars = Array.from({ length: Math.round(110 * W * H / (640 * 360)) }, () => ({ x: r() * W, y: r() * H * .5, s: .4 + r() * 1.1, p: r() * 6 }));
    return { W, H, glyphs, frags, motes, inner, cracks, island, stars, ...tex() };
  }
  function robe(g, x, base, h) {
    const w = h * .3, top = base - h;
    g.beginPath(); g.moveTo(x, top); g.quadraticCurveTo(x + w * .3, top + h * .02, x + w * .22, top + h * .12); g.quadraticCurveTo(x + w * .45, top + h * .4, x + w * .55, base);
    g.lineTo(x - w * .55, base); g.quadraticCurveTo(x - w * .45, top + h * .4, x - w * .22, top + h * .12); g.quadraticCurveTo(x - w * .3, top + h * .02, x, top); g.fill();
  }
  function fragment(g, F, x, y, sc, rot, warm, ring) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
    const w = F.w, h = F.h, stone = g.createLinearGradient(-w, -h, w, h), edge = ring ? 'rgba(236,84,104,.85)' : `rgba(255,222,176,${.25 + .45 * warm})`;
    stone.addColorStop(0, '#6c6e78'); stone.addColorStop(.5, '#474952'); stone.addColorStop(1, '#25262d');
    g.fillStyle = stone; g.strokeStyle = edge; g.lineWidth = .9;
    if (F.type === 0) { g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2 - 2, -h / 2); g.lineTo(w / 2, -h / 2 + 3); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2 + 3, h / 2); g.lineTo(-w / 2, h / 2 - 4); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(20,20,26,.5)'; line(g, -w / 4, -h / 3, -w / 4 + 1, h / 4); }
    else if (F.type === 1) { g.fillRect(-w / 2, -h / 2, w, h); g.strokeRect(-w / 2, -h / 2, w, h); g.strokeStyle = 'rgba(20,20,26,.4)'; for (const q of [-.25, 0, .25]) line(g, q * w, -h / 2, q * w, h / 2); g.fillStyle = '#7a7c86'; g.beginPath(); g.ellipse(0, -h / 2, w / 2, 2, 0, 0, TAU); g.fill(); }
    else if (F.type === 2) { g.strokeStyle = stone; g.lineWidth = 3.4; g.beginPath(); g.arc(0, 0, w * .6, 0, TAU); g.stroke(); g.strokeStyle = edge; g.lineWidth = .7; g.beginPath(); g.arc(0, 0, w * .6 + 1.7, 0, TAU); g.stroke(); }
    else { const s = w * .55; g.fillStyle = '#5c5e68'; g.beginPath(); g.moveTo(0, -s); g.lineTo(s, -s / 2); g.lineTo(0, 0); g.lineTo(-s, -s / 2); g.fill(); g.fillStyle = '#3e4048'; g.beginPath(); g.moveTo(-s, -s / 2); g.lineTo(0, 0); g.lineTo(0, s); g.lineTo(-s, s / 2); g.fill(); g.fillStyle = '#2a2b32'; g.beginPath(); g.moveTo(s, -s / 2); g.lineTo(0, 0); g.lineTo(0, s); g.lineTo(s, s / 2); g.fill(); g.beginPath(); g.moveTo(0, -s); g.lineTo(s, -s / 2); g.lineTo(s, s / 2); g.lineTo(0, s); g.lineTo(-s, s / 2); g.lineTo(-s, -s / 2); g.closePath(); g.stroke(); }
    g.restore();
  }
  // st: f fog amount, lift 0..1 (the fog sinks), L door light, n sessions today, rest, end 0..1, fig (someone on the steps)
  function drawScene(g, B, t, st) {
    const { W, H } = B, { f, lift, L, n, rest, end, fig } = st, ending = end > .5;
    const dx = W * .5, Y0 = H * .62, S0 = H * (.6 + lift * .12), drift = t * (rest ? 6 : 3);
    let gr = g.createLinearGradient(0, 0, 0, H * .62); gr.addColorStop(0, '#08090d'); gr.addColorStop(.7, '#252732'); gr.addColorStop(1, '#3c3f4a');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const sv = .2 + .55 * (1 - f);
    g.fillStyle = '#e4e6ee'; for (const s of B.stars) { g.globalAlpha = sv * (.45 + .4 * Math.sin(t * 1.2 + s.p)); g.fillRect(s.x, s.y, s.s, s.s); } g.globalAlpha = 1;
    // a halo with no moon
    const hy = H * .19;
    glow(g, dx, hy, 170, 'rgba(210,214,226,1)', .07 + .07 * L);
    g.strokeStyle = `rgba(222,226,238,${.05 + .06 * L})`; g.lineWidth = 7; g.beginPath(); g.arc(dx, hy, 98, 0, TAU); g.stroke();
    g.strokeStyle = `rgba(232,236,246,${.12 + .14 * L})`; g.lineWidth = 1.3; g.stroke();
    if (end > 0) { g.strokeStyle = `rgba(236,84,104,${.25 * end})`; g.lineWidth = .8; g.beginPath(); g.arc(dx, hy, 104, 0, TAU); g.stroke(); }
    // giants far away, seen only in thick fog
    const ghost = Math.max(0, f - .12) * .55;
    if (ghost > 0) { g.fillStyle = `rgba(26,28,36,${ghost})`; robe(g, W * .76, Y0 + 4, 158); robe(g, W * .9, Y0 + 4, 124); g.fillStyle = `rgba(10,10,14,${ghost * .8})`; g.beginPath(); g.ellipse(W * .76, Y0 - 144, 4.5, 6, 0, 0, TAU); g.ellipse(W * .9, Y0 - 113, 3.5, 5, 0, 0, TAU); g.fill(); }
    // the island upside down, and its waterfall falling upward
    const ix = W * .82, iy = H * .27;
    gr = g.createLinearGradient(ix - 6, 0, ix + 6, 0); gr.addColorStop(0, 'rgba(214,220,232,0)'); gr.addColorStop(.5, 'rgba(214,220,232,.1)'); gr.addColorStop(1, 'rgba(214,220,232,0)');
    g.fillStyle = gr; g.fillRect(ix - 6, iy, 12, S0 - iy);
    g.fillStyle = '#dde2ec';
    for (let k = 0; k < 30; k++) { const q = ((k / 30) + t * .22) % 1, y = S0 - q * (S0 - iy); g.globalAlpha = .32 * Math.sin(q * Math.PI); g.fillRect(ix - 3 + Math.sin(k * 2.1) * 2, y, 1.3, 9); g.fillRect(ix + 1.5 + Math.sin(k * 1.3) * 1.5, y + 5, 1, 6); }
    g.globalAlpha = 1;
    g.save(); g.translate(ix, iy);
    g.fillStyle = '#24262e'; g.beginPath(); g.moveTo(-48, 0);
    for (const [x, y] of B.island) g.lineTo(x, y);
    g.lineTo(48, 0); for (let x = 48; x >= -48; x -= 6) g.lineTo(x, 2 + Math.sin(x * .7) * 1.5); g.fill();
    g.strokeStyle = 'rgba(200,206,222,.16)'; g.lineWidth = .9; g.beginPath(); B.island.slice(0, 9).forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = .6; for (let k = 1; k < 5; k++) line(g, -40 + k * 4, -k * 9, 30 - k * 5, -k * 9 + 2);
    g.fillStyle = '#191b21';
    for (let k = 0; k < 8; k++) { const x = -40 + k * 11.5, h = 8 + (k * 7 % 5) * 2; g.beginPath(); g.moveTo(x - 3.5, 2); g.lineTo(x, 2 + h); g.lineTo(x + 3.5, 2); g.fill(); g.beginPath(); g.moveTo(x - 2.5, 2 + h * .4); g.lineTo(x, 2 + h * 1.15); g.lineTo(x + 2.5, 2 + h * .4); g.fill(); }
    g.restore();
    // a staircase upside down, going nowhere
    const sx0 = W * .34;
    for (let k = 0; k < 11; k++) {
      const x = sx0 - (k + 1) * 9.5, y = 4 + k * 9.5;
      g.fillStyle = '#2c2e36'; g.fillRect(x, y, 9.5, 10);
      g.fillStyle = 'rgba(205,210,226,.22)'; g.fillRect(x, y + 9, 9.5, 1.1);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y, 1, 10);
    }
    g.fillStyle = '#23252c'; g.beginPath(); g.moveTo(sx0, -2); g.lineTo(sx0 + 6, -2); g.lineTo(sx0 + 6 - 11 * 9.5, 4 + 11 * 9.5 - 14); g.lineTo(sx0 - 11 * 9.5, 4 + 11 * 9.5 - 3); g.lineTo(sx0 - 10 * 9.5, 4 + 10 * 9.5); g.closePath(); g.fill();
    // the orbit around the door: four fragments, one more per session today
    const cnt = 4 + Math.min(8, n), ocx = dx, ocy = Y0 - 58, spd = rest ? .05 : ending ? .012 : .025;
    const frs = [];
    for (let k = 0; k < cnt; k++) {
      const a = k / cnt * TAU + t * spd, F = B.frags[k], d = Math.sin(a);
      frs.push({ F, d, x: ocx + Math.cos(a) * 168, y: ocy + d * 36 - Math.cos(a) * 14 + Math.sin(t * .6 + F.p) * 3 * (1 - end), sc: .78 + .26 * d, rot: F.p + F.spin * t * (ending ? .2 : 1), ring: k >= 4 });
    }
    frs.sort((a, b) => a.d - b.d);
    const drawFr = q => fragment(g, q.F, q.x, q.y, q.sc, q.rot, L * (1 - Math.min(1, Math.abs(q.x - dx) / 200)), q.ring);
    if (end > 0) { g.strokeStyle = `rgba(255,214,160,${.22 * end})`; g.lineWidth = 1; g.beginPath(); g.ellipse(ocx, ocy, 168, 36, -.09, 0, TAU); g.stroke(); }
    frs.filter(q => q.d < 0).forEach(drawFr);
    // the door, and another place behind it
    const ow = 30, oh = 104, oy = Y0 - oh, pw = 10;
    glow(g, dx, oy + oh * .5, 110 + 70 * L, 'rgba(255,228,182,1)', .1 + .16 * L);
    g.save(); g.beginPath(); g.rect(dx - ow / 2, oy, ow, oh); g.clip();
    gr = g.createLinearGradient(0, oy, 0, oy + oh); gr.addColorStop(0, '#1d2b4b'); gr.addColorStop(.5, '#c99a72'); gr.addColorStop(.74, '#ffe6be'); gr.addColorStop(1, '#ffe6be');
    g.fillStyle = gr; g.globalAlpha = .4 + .6 * L; g.fillRect(dx - ow / 2, oy, ow, oh);
    for (const [a, b, s] of B.inner) { g.globalAlpha = (.75 - b) * (.4 + .6 * L); g.fillStyle = '#fff'; g.fillRect(dx - ow / 2 + a * ow, oy + b * oh * .7, s, s); }
    g.globalAlpha = 1;
    glow(g, dx - 4, oy + oh * .77, 22, 'rgba(255,244,214,1)', .5 + .5 * L);
    g.fillStyle = '#2a2318'; g.beginPath(); g.moveTo(dx - ow / 2, oy + oh * .8); g.quadraticCurveTo(dx, oy + oh * .74, dx + ow / 2, oy + oh * .79); g.lineTo(dx + ow / 2, oy + oh); g.lineTo(dx - ow / 2, oy + oh); g.fill();
    g.strokeStyle = '#2a2318'; g.lineWidth = 1; line(g, dx + 6, oy + oh * .77, dx + 6, oy + oh * .69); g.fillStyle = '#2a2318'; g.beginPath(); g.arc(dx + 6, oy + oh * .67, 3.6, 0, TAU); g.arc(dx + 3.8, oy + oh * .69, 2.4, 0, TAU); g.fill();
    g.restore();
    const frame = (x, y, w, h) => { const sg = g.createLinearGradient(x, 0, x + w, 0); sg.addColorStop(0, '#6a6c76'); sg.addColorStop(.6, '#45474f'); sg.addColorStop(1, '#2a2b32'); g.fillStyle = sg; g.fillRect(x, y, w, h); };
    frame(dx - ow / 2 - pw, oy - 2, pw, oh + 2); frame(dx + ow / 2, oy - 2, pw, oh + 2);
    frame(dx - ow / 2 - pw - 7, oy - 15, ow + 2 * pw + 14, 13);
    g.fillStyle = '#747680'; g.fillRect(dx - ow / 2 - pw - 8, oy - 17, ow + 2 * pw + 16, 2.5);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(dx - ow / 2 - pw - 7, oy - 3, ow + 2 * pw + 14, 2);
    g.fillStyle = `rgba(255,222,172,${.55 * L})`; g.fillRect(dx - ow / 2 - 1.3, oy, 1.3, oh); g.fillRect(dx + ow / 2, oy, 1.3, oh); g.fillRect(dx - ow / 2, oy - 1.5, ow, 1.5);
    for (const gl of B.glyphs) {
      const x = gl.side < 0 ? dx - ow / 2 - pw / 2 : dx + ow / 2 + pw / 2, y = oy + 8 + gl.y * (oh - 18);
      if (ending) glow(g, x, y, 7, 'rgba(255,90,100,1)', .35);
      g.strokeStyle = ending ? '#ffb0a0' : rest ? 'rgba(16,16,22,.75)' : 'rgba(255,190,150,.45)'; g.lineWidth = .8;
      for (const [a, b, c, d] of gl.segs) line(g, x + a * 2.6, y + b * 2.6, x + c * 2.6, y + d * 2.6);
    }
    // steps under the door, revealed as the fog sinks, and someone standing there
    for (let k = 0; k < 6; k++) { const w = 54 + k * 18, y = Y0 + k * 5; g.fillStyle = k % 2 ? '#34363e' : '#3f4149'; g.fillRect(dx - w / 2, y, w, 5); g.fillStyle = `rgba(255,222,176,${.12 * L})`; g.fillRect(dx - w / 2, y, w, .9); }
    if (fig) { const fx = dx + 30, fy = Y0 + 10; g.fillStyle = '#121318'; robe(g, fx, fy, 15); g.beginPath(); g.arc(fx, fy - 13.5, 2.2, 0, TAU); g.fill(); g.fillStyle = '#ffd38a'; g.fillRect(fx + 4, fy - 6, 1.6, 2); glow(g, fx + 4.8, fy - 5, 8, 'rgba(255,200,120,1)', .6); }
    frs.filter(q => q.d >= 0).forEach(drawFr);
    // the mask, half sunk in the fog
    g.save(); g.translate(W * .15, H * .58); g.rotate(-.22);
    gr = g.createLinearGradient(-50, -70, 40, 40); gr.addColorStop(0, '#6c6e78'); gr.addColorStop(.6, '#3e4048'); gr.addColorStop(1, '#24252c');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 44, 62, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(210,214,226,.18)'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, 44, 62, 0, Math.PI * .95, Math.PI * 1.6); g.stroke();
    g.strokeStyle = 'rgba(205,210,226,.2)'; g.lineWidth = 1.4; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 5, -27); g.quadraticCurveTo(s * 16, -33, s * 27, -25); g.stroke(); }
    for (const s of [-1, 1]) {
      const ex = s * 16, ey = -16;
      if (ending) {
        glow(g, ex, ey, 22, 'rgba(236,240,252,1)', .55 * end);
        g.globalAlpha = end; g.fillStyle = '#eef1f8'; g.beginPath(); g.moveTo(ex - 10, ey); g.quadraticCurveTo(ex, ey - 6, ex + 10, ey); g.quadraticCurveTo(ex, ey + 5, ex - 10, ey); g.fill(); g.globalAlpha = 1;
      } else {
        g.strokeStyle = 'rgba(14,14,18,.85)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ex - 10, ey); g.quadraticCurveTo(ex, ey + 6, ex + 10, ey); g.stroke();
        g.lineWidth = .7; for (let k = -2; k <= 2; k++) line(g, ex + k * 3.6, ey + 3.2 - Math.abs(k) * .5, ex + k * 4.2, ey + 6 - Math.abs(k) * .4);
      }
    }
    g.strokeStyle = 'rgba(14,14,18,.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-1, -10); g.quadraticCurveTo(-4, 6, -1, 14); g.stroke();
    g.fillStyle = 'rgba(14,14,18,.45)'; g.beginPath(); g.ellipse(-5, 15, 4, 2, 0, 0, TAU); g.ellipse(4, 15.5, 3.5, 1.8, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(14,14,18,.55)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-11, 30); g.quadraticCurveTo(0, 33, 11, 30); g.stroke();
    g.strokeStyle = 'rgba(10,10,14,.3)'; g.lineWidth = .6; for (const c of B.cracks) { g.beginPath(); c.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.stroke(); }
    g.restore();
    // the sea of fog, then the light path on it
    gr = g.createLinearGradient(0, S0 + 16, 0, H); gr.addColorStop(0, '#5a5d68'); gr.addColorStop(.5, '#2e3038'); gr.addColorStop(1, '#14151a');
    g.fillStyle = gr; g.fillRect(0, S0 + 16, W, H - S0);
    B.sea.forEach((tx, k) => band(g, W, tx, S0 - 20 + k * 30, 50 + k * 22, [1, .8, .6, .45][k], drift * (1 + k * .6) + k * 150));
    gr = g.createLinearGradient(0, S0 + 40, 0, H); gr.addColorStop(0, 'rgba(8,8,12,0)'); gr.addColorStop(1, 'rgba(8,8,12,.5)'); g.fillStyle = gr; g.fillRect(0, S0 + 40, W, H - S0);
    gr = g.createLinearGradient(0, S0, 0, H); gr.addColorStop(0, `rgba(255,226,182,${.26 * L})`); gr.addColorStop(1, 'rgba(255,226,182,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(dx - 26, S0 + 4); g.lineTo(dx + 26, S0 + 4); g.lineTo(dx + 110, H); g.lineTo(dx - 110, H); g.fill();
    // motes rising out of the fog
    g.fillStyle = '#e9ecf4';
    for (const m of B.motes) { const h = (t * m.v + m.o * 200) % 170, y = S0 - h; g.globalAlpha = (.4 + .3 * end) * Math.sin(h / 170 * Math.PI); g.fillRect(m.x + Math.sin(t * .5 + m.p) * 6, y, 1.3, 1.3); }
    g.globalAlpha = 1;
    // veils in front
    band(g, W, B.wisp, H * .34 + lift * 46, H * .3, f * .85 * (1 - end), drift * .5);
    band(g, W, B.top, -H * .06, H * .26, .45 + .4 * f, -drift * .3 + 90);
    g.fillStyle = `rgba(150,153,164,${.1 * f})`; g.fillRect(0, 0, W, H);
  }

  let B = null, bKey = '', pend = '', pendAt = 0, lk = 0, endAt = -1e9;
  on('session', s => { nAt = -1e9; if (s && s.mins >= 1 && !reduced()) endAt = performance.now(); });
  const progress = () => { const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot, started = rem < tot - .5 || (ML.running && ML.running());
    return { started, p: started ? clamp(1 - Math.max(0, rem) / tot, 0, 1) : 0 }; };
  ML.fogEnd = () => { endAt = performance.now(); dialEnd(); }; // test hook
  ML.fogDraw = (cx, W, H, slow, still, now, tm, rest) => {
    if (!(W > 0 && H > 0)) return true;
    const wide = W / H > 16 / 9, Wl = Math.round(wide ? 360 * W / H : 640), Hl = Math.round(wide ? 360 : 640 * H / W), k = Wl + 'x' + Hl;
    if (k !== bKey) { if (k !== pend) { pend = k; pendAt = now; } if (!B || now - pendAt > 350) { bKey = k; pend = ''; B = build(Wl, Hl); } }
    if (typeof cx === 'function') return true; // a skipped frame (game.js paints at ~30 fps)
    const pr = progress(), focus = S.mode !== 'break' && pr.started, target = focus ? pr.p : 0;
    lk = still ? target : lk + (target - lk) * .03;
    const eT = (now - endAt) / 1000, end = still || eT > 7 ? 0 : clamp((7 - eT) / 1.5, 0, 1);
    const f0 = .62 - .5 * lk, st = { f: f0 + (.04 - f0) * end, lift: lk + (1 - lk) * end, L: .45 + .4 * lk + (.55 - .4 * lk) * end, n: count(), rest: rest && !still, end, fig: lk > .2 || end > 0 };
    cx.save(); cx.scale(W / Wl, H / Hl); drawScene(cx, B, still ? 8 : tm / 1000, st); cx.restore();
    return true;
  };

  const SERIF = '"Cormorant Garamond", Georgia, serif', SC = '"Cinzel", "Cormorant Garamond", Georgia, serif', SANS = '"IBM Plex Sans", "Segoe UI", sans-serif';
  let still = false; // reduced motion: set before each dial paint
  // ---------- dials ----------
  const C = 150, ang = p => p * TAU - Math.PI / 2;
  function ringPath(g, r0, r1) { g.beginPath(); g.arc(0, 0, r1, 0, TAU); g.arc(0, 0, r0, 0, TAU, true); }
  function texRing(g, tex, r0, r1, convex = true, rot = 0) {
    g.save(); ringPath(g, r0, r1); g.clip();
    g.save(); g.rotate(rot); g.drawImage(tex, -r1, -r1, 2 * r1, 2 * r1); g.restore();
    const gr = g.createLinearGradient(-r1, -r1, r1, r1);
    gr.addColorStop(0, convex ? 'rgba(255,238,205,.32)' : 'rgba(0,0,0,.45)'); gr.addColorStop(.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, convex ? 'rgba(0,0,0,.5)' : 'rgba(255,238,205,.22)');
    g.fillStyle = gr; g.fillRect(-r1, -r1, 2 * r1, 2 * r1);
    g.restore();
    g.lineWidth = .8; g.strokeStyle = 'rgba(255,236,200,.35)'; g.beginPath(); g.arc(0, 0, r1 - .5, Math.PI * .9, Math.PI * 1.6); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.arc(0, 0, r1, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, r0, 0, TAU); g.stroke();
  }
  function texDisc(g, tex, r, dark = 0) { g.save(); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.clip(); g.drawImage(tex, -r, -r, 2 * r, 2 * r); if (dark) { g.fillStyle = `rgba(0,0,0,${dark})`; g.fillRect(-r, -r, 2 * r, 2 * r); } g.restore(); }
  function jewel(g, x, y, r, lit) {
    if (lit) glow(g, x, y, r * 4.5, 'rgba(255,50,72,1)', .45);
    const gr = g.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
    gr.addColorStop(0, lit ? '#ffc0c6' : '#8a4a50'); gr.addColorStop(.45, lit ? '#e6334a' : '#5a1c24'); gr.addColorStop(1, lit ? '#5e0a16' : '#1c0a0d');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(40,26,10,.9)'; g.lineWidth = .7; g.stroke();
  }
  function spaced(g, s, x, y, sp) { const ws = [...s].map(ch => g.measureText(ch).width); let tot = ws.reduce((a, b) => a + b, 0) + sp * (s.length - 1), cx = x - tot / 2; g.textAlign = 'left'; [...s].forEach((ch, i) => { g.fillText(ch, cx, y); cx += ws[i] + sp; }); g.textAlign = 'center'; }
  function engraved(g, txt, x, y, col) { g.fillStyle = 'rgba(0,0,0,.7)'; g.fillText(txt, x + .6, y + .7); g.fillStyle = col; g.fillText(txt, x, y); }
  function glass(g, r) {
    g.save(); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.clip();
    const gr = g.createLinearGradient(-r, -r, r * .2, r * .2); gr.addColorStop(0, 'rgba(255,255,255,.11)'); gr.addColorStop(.5, 'rgba(255,255,255,.02)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(-r * .25, -r * .38, r * .95, r * .52, -.6, 0, TAU); g.fill(); g.restore();
  }
  function plate(g, x, y, w, h, A) {
    const p = () => { g.beginPath(); g.moveTo(x + 6, y); g.lineTo(x + w - 6, y); g.lineTo(x + w, y + h / 2); g.lineTo(x + w - 6, y + h); g.lineTo(x + 6, y + h); g.lineTo(x, y + h / 2); g.closePath(); };
    g.save(); p(); g.clip(); g.drawImage(A.bronze, x, y - 20, w, w); const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(255,236,200,.25)'); gr.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = gr; g.fillRect(x, y, w, h); g.restore();
    g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = .8; p(); g.stroke();
    g.fillStyle = '#0b0c10'; g.beginPath(); g.moveTo(x + 8, y + 3.5); g.lineTo(x + w - 8, y + 3.5); g.lineTo(x + w - 3.5, y + h / 2); g.lineTo(x + w - 8, y + h - 3.5); g.lineTo(x + 8, y + h - 3.5); g.lineTo(x + 3.5, y + h / 2); g.closePath(); g.fill();
  }

  // J · the palace dial
  function dialPalace(g, st, t, A) {
    const p = st.prog, end = st.mode === 'end', rest = st.mode === 'rest', lit = rest ? 0 : end ? 1 : p;
    g.save(); g.translate(C, C);
    glow(g, 0, 8, 168, 'rgba(0,0,0,1)', .7);
    texRing(g, A.bronze, 145.5, 149.5);
    g.strokeStyle = 'rgba(30,18,6,.6)'; g.lineWidth = .7; for (let k = 0; k < 200; k++) { const q = k / 200 * TAU; line(g, Math.cos(q) * 146, Math.sin(q) * 146, Math.cos(q) * 149, Math.sin(q) * 149); }
    texRing(g, A.bronze, 134, 145.5, true, 1.3);
    for (let k = 0; k < 48; k++) {
      g.save(); g.rotate(k / 48 * TAU);
      const arch = (dx, dy) => { g.beginPath(); g.moveTo(-4.4 + dx, -135.5 + dy); g.lineTo(-4.4 + dx, -139.5 + dy); g.arc(dx, -139.5 + dy, 4.4, Math.PI, TAU); g.lineTo(4.4 + dx, -135.5 + dy); g.stroke(); };
      g.lineWidth = .9; g.strokeStyle = 'rgba(255,226,175,.22)'; arch(.5, .5); g.strokeStyle = 'rgba(26,16,5,.8)'; arch(0, 0);
      g.restore();
    }
    // chapter ring
    let gr = g.createRadialGradient(0, 0, 110, 0, 0, 134); gr.addColorStop(0, '#121318'); gr.addColorStop(1, '#1d1e25');
    ringPath(g, 110, 134); g.fillStyle = gr; g.fill();
    if (lit > 0) { g.strokeStyle = 'rgba(226,58,78,.28)'; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 129, ang(0), ang(lit)); g.stroke(); }
    for (let i = 0; i < 60; i++) {
      const q = ang(i / 60);
      if (i % 5) { g.strokeStyle = i / 60 < lit ? '#e8a07a' : '#9c8258'; g.lineWidth = .7; line(g, Math.cos(q) * 126, Math.sin(q) * 126, Math.cos(q) * 132, Math.sin(q) * 132); }
      else jewel(g, Math.cos(q) * 129, Math.sin(q) * 129, 2.7, i / 60 < lit || end || (i === 0 && !rest));
    }
    g.font = `600 12.5px ${SC}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const RN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    for (let i = 0; i < 12; i++) {
      const q = ang(i / 12); g.save(); g.translate(Math.cos(q) * 117.5, Math.sin(q) * 117.5); g.rotate(q + Math.PI / 2);
      engraved(g, RN[i], 0, 0, '#cfa772'); g.restore();
    }
    // the aperture onto the fog
    texRing(g, A.bronze, 101, 110, false, 2.1);
    g.save(); g.beginPath(); g.arc(0, 0, 101, 0, TAU); g.clip();
    gr = g.createRadialGradient(0, -20, 10, 0, 0, 101); gr.addColorStop(0, '#191b23'); gr.addColorStop(1, '#07080b'); g.fillStyle = gr; g.fillRect(-101, -101, 202, 202);
    for (const s of A.dstars) { g.globalAlpha = (.25 + .75 * lit) * (.5 + .5 * Math.sin(t * 1.4 + s[3])); g.fillStyle = '#e8e8f0'; g.fillRect(s[0], s[1], s[2], s[2]); }
    A.cstars.forEach((s, i) => { const on = clamp((lit - i / A.cstars.length) * 6, 0, 1); if (on > 0) { glow(g, s[0], s[1], 10, 'rgba(255,60,82,1)', .6 * on); g.globalAlpha = on; g.fillStyle = '#ff8c98'; star4(g, s[0], s[1], 3.4, .9); } });
    g.globalAlpha = 1;
    const fa = rest ? .95 : Math.max(.06, .95 * (1 - lit * .95));
    g.save(); g.rotate(t * .02); g.globalAlpha = fa; g.drawImage(A.fog, -112, -112, 224, 224); g.restore();
    g.save(); g.rotate(-t * .013 + 1); g.globalAlpha = fa * .7; g.drawImage(A.fog2, -112, -112, 224, 224); g.restore();
    g.globalAlpha = 1;
    gr = g.createRadialGradient(0, 0, 70, 0, 0, 101); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.65)'); g.fillStyle = gr; g.fillRect(-101, -101, 202, 202);
    g.restore();
    // two brass fillets on the chapter ring
    g.strokeStyle = 'rgba(214,176,112,.55)'; g.lineWidth = .6; for (const rr of [112.5, 124.5]) { g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke(); }
    // seconds: a crimson spark around the aperture, one turn a minute
    const sa = ang(((still ? 12 : t) % 60) / 60);
    g.strokeStyle = 'rgba(255,90,110,.35)'; g.lineWidth = 1.4; g.beginPath(); g.arc(0, 0, 98, sa - .45, sa); g.stroke();
    glow(g, Math.cos(sa) * 98, Math.sin(sa) * 98, 9, 'rgba(255,70,90,1)', .9);
    g.fillStyle = '#ffd6da'; g.beginPath(); g.arc(Math.cos(sa) * 98, Math.sin(sa) * 98, 1.3, 0, TAU); g.fill();
    if (end) glow(g, 0, 0, 150, 'rgba(226,58,78,1)', .22);
    // sceptre hand
    g.save(); g.rotate(lit * TAU);
    gr = g.createLinearGradient(-2, 0, 2, 0); gr.addColorStop(0, '#f2d79c'); gr.addColorStop(.5, '#b68a4c'); gr.addColorStop(1, '#5d4222');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-1.8, 22); g.lineTo(-1.1, -92); g.lineTo(1.1, -92); g.lineTo(1.8, 22); g.closePath(); g.fill();
    g.strokeStyle = '#c99d5e'; g.lineWidth = 2; g.beginPath(); g.arc(0, 28, 6, 0, TAU); g.stroke(); jewel(g, 0, 28, 2.2, true);
    g.fillStyle = '#c99d5e'; g.beginPath(); g.moveTo(-4, -60); g.lineTo(0, -66); g.lineTo(4, -60); g.lineTo(0, -54); g.closePath(); g.fill();
    glow(g, 0, -100, 26, 'rgba(255,60,82,1)', .55);
    const sg = g.createRadialGradient(-2, -102, 1, 0, -100, 10); sg.addColorStop(0, '#ffd0d4'); sg.addColorStop(.5, '#e2334a'); sg.addColorStop(1, '#7a0e1e');
    g.fillStyle = sg; g.beginPath(); for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8 - Math.PI / 2, rr = k % 2 ? 3.6 : (k % 4 ? 7 : 10); g.lineTo(Math.cos(a) * rr, -100 + Math.sin(a) * rr); } g.closePath(); g.fill();
    g.strokeStyle = '#c99d5e'; g.lineWidth = .6; g.stroke();
    g.fillStyle = '#e2c287'; g.beginPath(); g.moveTo(-.9, -110); g.lineTo(0, -127); g.lineTo(.9, -110); g.fill();
    g.restore();
    // cartouche and sessions
    for (const s of [-1, 1]) { g.fillStyle = '#c99d5e'; g.beginPath(); g.moveTo(s * 44, 50); g.lineTo(s * 52, 54); g.lineTo(s * 44, 58); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.arc(s * 49.5, 54, 1, 0, TAU); g.fill(); }
    plate(g, -44, 38, 88, 32, A);
    g.fillStyle = '#f0e4cb'; g.font = `600 26px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(st.time, 0, 55);
    for (let i = 0; i < 8; i++) jewel(g, -28 + i * 8, 82, 2.2, i < st.n);
    g.fillStyle = 'rgba(224,220,210,.75)'; g.font = `500 7.5px ${SANS}`; spaced(g, st.label, 0, 31, 2.4);
    texDisc(g, A.bronze, 7.5); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = .7; g.beginPath(); g.arc(0, 0, 7.5, 0, TAU); g.stroke(); jewel(g, 0, 0, 2.6, true);
    glass(g, 145);
    g.restore();
  }

  // K · the rose window
  function lancet(g) { const wi = 7, wo = 21.5, y0 = -44, y1 = -93, tip = -119; g.beginPath(); g.moveTo(-wi, y0); g.lineTo(-wo, y1); g.quadraticCurveTo(-wo, tip + 6, 0, tip); g.quadraticCurveTo(wo, tip + 6, wo, y1); g.lineTo(wi, y0); g.quadraticCurveTo(0, y0 + 3, -wi, y0); g.closePath(); }
  function dialRose(g, st, t, A) {
    const end = st.mode === 'end', rest = st.mode === 'rest', lit = rest ? 0 : end ? 1 : st.prog;
    g.save(); g.translate(C, C);
    glow(g, 0, 8, 168, 'rgba(0,0,0,1)', .7);
    texRing(g, A.stone, 131, 149.5);
    g.fillStyle = '#8b8c95'; for (let k = 0; k < 96; k++) { const q = k / 96 * TAU; g.beginPath(); g.arc(Math.cos(q) * 147, Math.sin(q) * 147, 1.15, 0, TAU); g.fill(); }
    g.font = `600 12px ${SC}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) { const q = ang(i / 12); g.save(); g.translate(Math.cos(q) * 139, Math.sin(q) * 139); g.rotate(q + Math.PI / 2); engraved(g, String(i ? i * 5 : 60), 0, 0, '#c4c2c0'); g.restore(); }
    texRing(g, A.bronze, 122.5, 131, true, .7);
    if (lit > 0) { g.strokeStyle = 'rgba(255,190,110,.55)'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 126.8, ang(0), ang(lit)); g.stroke(); }
    g.strokeStyle = 'rgba(25,16,6,.85)'; for (let i = 0; i < 60; i++) { const q = ang(i / 60); g.lineWidth = i % 5 ? .6 : 1.4; line(g, Math.cos(q) * (i % 5 ? 126 : 123.5), Math.sin(q) * (i % 5 ? 126 : 123.5), Math.cos(q) * 130.5, Math.sin(q) * 130.5); }
    // stone tracery ground
    texDisc(g, A.stone, 122.5, .35);
    const flick = still ? 1 : .92 + .08 * Math.sin(t * 3.1);
    for (let k = 0; k < 12; k++) {
      const fk = clamp(lit * 12 - k, 0, 1);
      g.save(); g.rotate((k + .5) / 12 * TAU);
      lancet(g); g.save(); g.clip();
      let gr = g.createLinearGradient(0, -44, 0, -119); gr.addColorStop(0, '#1e2230'); gr.addColorStop(1, '#2f3546'); g.fillStyle = gr; g.fillRect(-30, -125, 60, 85);
      g.globalAlpha = .55; g.drawImage(A.fog, -40 + Math.sin(t * .2 + k) * 8, -130, 80, 80); g.globalAlpha = 1;
      if (fk > 0) {
        g.save(); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 130, -Math.PI / 2 - Math.PI / 12, -Math.PI / 2 - Math.PI / 12 + fk * Math.PI / 6); g.closePath(); g.clip();
        gr = g.createLinearGradient(0, -44, 0, -119); gr.addColorStop(0, '#ffd28e'); gr.addColorStop(.45, '#e4483f'); gr.addColorStop(1, '#8c1428');
        g.globalAlpha = flick; g.fillStyle = gr; g.fillRect(-30, -125, 60, 85); g.globalAlpha = 1;
        g.fillStyle = 'rgba(255,230,190,.25)'; g.beginPath(); g.ellipse(-6, -70, 5, 14, .2, 0, TAU); g.fill();
        // a glint sliding over the glass
        const gy = -122 + ((still ? 30 : t * 16 + k * 11) % 96), gl = g.createLinearGradient(0, gy - 8, 0, gy + 8);
        gl.addColorStop(0, 'rgba(255,245,225,0)'); gl.addColorStop(.5, 'rgba(255,245,225,.32)'); gl.addColorStop(1, 'rgba(255,245,225,0)');
        g.fillStyle = gl; g.fillRect(-30, gy - 8, 60, 16);
        g.restore();
      }
      g.strokeStyle = 'rgba(8,8,10,.85)'; g.lineWidth = .8;
      for (const y of [-56, -68, -80, -104]) { g.beginPath(); g.moveTo(-24, y + 3); g.quadraticCurveTo(0, y - 3, 24, y + 3); g.stroke(); }
      line(g, -12, -60, -6, -76); line(g, 12, -60, 6, -76); line(g, -16, -84, -8, -100); line(g, 16, -84, 8, -100);
      g.restore();
      g.strokeStyle = '#6e6f78'; g.lineWidth = 2.6; line(g, 0, -45, 0, -92);
      g.lineWidth = 2.2; g.beginPath(); g.arc(0, -101, 6.5, 0, TAU); g.stroke();
      g.strokeStyle = '#74757e'; g.lineWidth = 3; lancet(g); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = .8; lancet(g); g.stroke();
      g.restore();
      if (fk > 0) { const q = ang((k + .5) / 12); glow(g, Math.cos(q) * 82, Math.sin(q) * 82, 30, 'rgba(255,110,80,1)', .28 * fk * flick); glow(g, Math.cos(q) * 126, Math.sin(q) * 126, 26, 'rgba(255,170,110,1)', .22 * fk); }
    }
    // trefoil cusps at the lancet tips
    g.strokeStyle = '#6e6f78'; g.lineWidth = 1.6;
    for (let k = 0; k < 12; k++) { const q = ang((k + .5) / 12); for (const d of [-.075, 0, .075]) { const rr = d ? 115.5 : 117.5; g.beginPath(); g.arc(Math.cos(q + d) * rr, Math.sin(q + d) * rr, 2.6, 0, TAU); g.stroke(); } }
    // seconds: a glint running round the brass band
    const sq = ang(((still ? 12 : t) % 60) / 60); glow(g, Math.cos(sq) * 126.8, Math.sin(sq) * 126.8, 10, 'rgba(255,236,190,1)', .85);
    // session roundels between the lancets
    for (let k = 0; k < 12; k++) {
      const q = ang(k / 12), x = Math.cos(q) * 112, y = Math.sin(q) * 112, on = k < st.n;
      if (on) glow(g, x, y, 14, 'rgba(255,200,110,1)', .55);
      g.fillStyle = on ? '#f4c86c' : '#22283a'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill();
      g.strokeStyle = '#74757e'; g.lineWidth = 2; g.stroke();
      g.strokeStyle = 'rgba(8,8,10,.8)'; g.lineWidth = .7; line(g, x - 4, y, x + 4, y); line(g, x, y - 4, x, y + 4);
    }
    // the oculus with the time
    texRing(g, A.stone, 34, 42, true, 1.1);
    let gr = g.createRadialGradient(0, -8, 4, 0, 0, 34); gr.addColorStop(0, end ? '#3a1c22' : '#1a1d27'); gr.addColorStop(1, '#090a0f');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 34, 0, TAU); g.fill();
    g.fillStyle = '#f2e6cf'; g.font = `600 25px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(st.time, 0, 2);
    g.fillStyle = 'rgba(214,210,200,.6)'; g.font = `500 6.5px ${SANS}`; spaced(g, st.label, 0, -17, 2);
    // marker on the minute band
    const qa = ang(lit); g.save(); g.rotate(qa); g.fillStyle = '#f6d48e'; g.beginPath(); g.moveTo(120.5, 0); g.lineTo(131, -3.6); g.lineTo(131, 3.6); g.closePath(); g.fill(); g.strokeStyle = 'rgba(60,40,10,.8)'; g.lineWidth = .6; g.stroke(); g.restore();
    if (end) glow(g, 0, 0, 160, 'rgba(255,120,80,1)', .2);
    glass(g, 131);
    g.restore();
  }

  // L · the skeleton movement
  function gearSprite(r, n, spokes, opt = {}) {
    const td = opt.pointy ? r * .2 : Math.max(1.4, r * .085), R = r + td + 1, s = Math.ceil(R * 4);
    const c = mk(s, s), g = c.getContext('2d'); g.scale(2, 2); g.translate(R, R);
    const st = TAU / n; g.beginPath();
    for (let i = 0; i < n; i++) {
      const a = i * st, P = (rr, aa) => g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
      if (opt.pointy) { P(r * .82, a); P(r + td, a + st * .55); P(r * .9, a + st * .7); }
      else { P(r, a); P(r + td, a + st * .16); P(r + td, a + st * .4); P(r, a + st * .56); P(r, a + st); }
    }
    g.closePath();
    const gr = g.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, R); gr.addColorStop(0, opt.c0 || '#f4dc9e'); gr.addColorStop(.6, opt.c1 || '#c3984f'); gr.addColorStop(1, opt.c2 || '#7a5826');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = .5; for (let q = r * .2; q < r; q += 1.3) { g.beginPath(); g.arc(0, 0, q, 0, TAU); g.stroke(); }
    if (spokes) {
      g.globalCompositeOperation = 'destination-out';
      const ri = r * .3, ro = r * .78, sw = Math.max(1.6, r * .11);
      for (let k = 0; k < spokes; k++) { const a0 = k / spokes * TAU, a1 = (k + 1) / spokes * TAU; g.beginPath(); g.arc(0, 0, ro, a0 + sw / 2 / ro, a1 - sw / 2 / ro); g.arc(0, 0, ri, a1 - sw / 2 / ri, a0 + sw / 2 / ri, true); g.closePath(); g.fill(); }
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = 'rgba(70,46,14,.6)'; g.lineWidth = .6; g.beginPath(); g.arc(0, 0, ro, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, ri, 0, TAU); g.stroke();
    }
    const hb = g.createRadialGradient(-1, -1, .5, 0, 0, r * .2); hb.addColorStop(0, '#e8eaf0'); hb.addColorStop(1, '#6a6e7a');
    g.fillStyle = hb; g.beginPath(); g.arc(0, 0, Math.max(2, r * .16), 0, TAU); g.fill();
    return { c, R };
  }
  function sprite(g, s, x, y, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.drawImage(s.c, -s.R, -s.R, 2 * s.R, 2 * s.R); g.restore(); }
  function screw(g, x, y, r = 2.6, a = .6) {
    const gr = g.createRadialGradient(x - r * .4, y - r * .4, .3, x, y, r); gr.addColorStop(0, '#9fb8f0'); gr.addColorStop(.6, '#3a5aa8'); gr.addColorStop(1, '#16255a');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(6,10,26,.9)'; g.lineWidth = .7; line(g, x - Math.cos(a) * r * .8, y - Math.sin(a) * r * .8, x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8);
  }
  function chaton(g, x, y) { g.fillStyle = '#d6b273'; g.beginPath(); g.arc(x, y, 3.4, 0, TAU); g.fill(); jewel(g, x, y, 1.9, true); }
  function bridge(g, pts, w) {
    const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); if (pts.length === 3) g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); else g.lineTo(pts[1][0], pts[1][1]); };
    g.lineCap = 'round';
    g.strokeStyle = '#121318'; g.lineWidth = w + 2.4; path(); g.stroke();
    const gr = g.createLinearGradient(pts[0][0], pts[0][1] - w, pts[0][0] + w, pts[0][1] + w); gr.addColorStop(0, '#7a7d88'); gr.addColorStop(.5, '#4a4c56'); gr.addColorStop(1, '#2c2d34');
    g.strokeStyle = gr; g.lineWidth = w; path(); g.stroke();
    g.save(); g.globalAlpha = .5; g.strokeStyle = g.createPattern(A.stripes, 'repeat'); g.lineWidth = w * .8; path(); g.stroke(); g.restore();
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = .7; g.save(); g.translate(-w * .3, -w * .3); path(); g.stroke(); g.restore();
    g.lineCap = 'butt';
  }
  function balance(g, x, y, r, rot, t) {
    g.save(); g.translate(x, y);
    g.strokeStyle = '#5b80d0'; g.lineWidth = .65; g.beginPath();
    const br = 1 + .05 * Math.sin(rot * 2);
    for (let a = 0; a < 9 * Math.PI; a += .15) { const rr = (3 + a * (r * .55 - 3) / (9 * Math.PI)) * br; g.lineTo(Math.cos(a + rot * .4) * rr, Math.sin(a + rot * .4) * rr); }
    g.stroke();
    g.rotate(rot);
    g.strokeStyle = '#d4b06c'; g.lineWidth = 2; for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; line(g, Math.cos(a) * 3, Math.sin(a) * 3, Math.cos(a) * (r - 2), Math.sin(a) * (r - 2)); }
    const gr = g.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, '#f6e0a8'); gr.addColorStop(1, '#8c6426');
    ringPath(g, r - 3, r); g.fillStyle = gr; g.fill();
    g.fillStyle = '#f2d590'; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.beginPath(); g.arc(Math.cos(a) * (r + 1), Math.sin(a) * (r + 1), 1.2, 0, TAU); g.fill(); }
    g.restore();
  }
  function dialSkeleton(g, st, t, A) {
    const end = st.mode === 'end', rest = st.mode === 'rest', lit = rest ? 0 : end ? 1 : st.prog, tt = still ? 3 : t;
    g.save(); g.translate(C, C);
    glow(g, 0, 8, 168, 'rgba(0,0,0,1)', .7);
    // bezel with session rubies
    texRing(g, A.bronze, 128, 149.5, true, .4);
    g.strokeStyle = 'rgba(28,16,4,.55)'; g.lineWidth = .6; for (let k = 0; k < 120; k++) { const q = k / 120 * TAU; line(g, Math.cos(q) * 146.5, Math.sin(q) * 146.5, Math.cos(q) * 149, Math.sin(q) * 149); }
    for (let i = 0; i < 8; i++) { const q = (90 + (i - 3.5) * 8) * Math.PI / 180; g.fillStyle = '#3a2a14'; g.beginPath(); g.arc(Math.cos(q) * 138, Math.sin(q) * 138, 3.6, 0, TAU); g.fill(); jewel(g, Math.cos(q) * 138, Math.sin(q) * 138, 2.6, i < st.n); }
    g.strokeStyle = 'rgba(30,18,5,.7)'; g.lineWidth = .8; for (const rr of [132.5, 143.5]) { g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke(); } g.strokeStyle = 'rgba(255,232,190,.25)'; for (const rr of [133.3, 144.3]) { g.beginPath(); g.arc(0, 0, rr, Math.PI * .9, Math.PI * 1.7); g.stroke(); }
    // open plate
    g.save(); g.beginPath(); g.arc(0, 0, 128, 0, TAU); g.clip();
    let gr = g.createRadialGradient(0, 0, 10, 0, 0, 128); gr.addColorStop(0, '#16171c'); gr.addColorStop(1, '#08090c'); g.fillStyle = gr; g.fillRect(-130, -130, 260, 260);
    g.drawImage(A.perlage, -128, -128, 256, 256);
    ringPath(g, 104, 112); g.fillStyle = '#2b2c33'; g.fill();
    // gears
    sprite(g, A.g.barrel, -44, -40, -tt * .006);
    sprite(g, A.g.center, 0, 0, tt * .02);
    sprite(g, A.g.third, 38, -36, -tt * .045); sprite(g, A.g.pin, 38, -36, -tt * .045);
    sprite(g, A.g.fourth, 52, 14, tt * TAU / 60); sprite(g, A.g.pin, 52, 14, tt * TAU / 60);
    sprite(g, A.g.escape, 34, 54, -Math.floor(tt * 5) * TAU / 30);
    // bridges, jewels, screws
    bridge(g, [[-104, -18], [-68, -78], [-6, -82]], 9);
    bridge(g, [[10, -86], [44, -34], [86, 34]], 8);
    bridge(g, [[18, 84], [36, 52], [76, 66]], 6.5);
    const osc = still ? .4 : Math.sin(tt * TAU * 2.5) * 1.5;
    g.save(); g.translate(34, 54); g.rotate(osc * .05 - .6); g.strokeStyle = '#8c90a0'; g.lineWidth = 1.6; line(g, 0, 0, -30, 0); g.fillStyle = '#c0284a'; g.fillRect(-3, -3, 2, 2.4); g.fillRect(-3, 1, 2, 2.4); g.restore();
    balance(g, -34, 50, 27, osc, tt);
    bridge(g, [[-106, 70], [-34, 50]], 7);
    g.fillStyle = '#5a5c66'; g.beginPath(); g.arc(-34, 50, 7, 0, TAU); g.fill();
    for (const [x, y] of [[-44, -40], [38, -36], [52, 14], [34, 54], [-34, 50]]) chaton(g, x, y);
    for (const [x, y, a] of [[-96, -30, .4], [-14, -82, 1.2], [14, -78, 2], [80, 26, .9], [24, 82, 1.6], [70, 64, .2], [-96, 68, 1.1]]) screw(g, x, y, 2.5, a);
    g.save(); g.translate(52, 14); g.rotate(tt * TAU / 60); g.strokeStyle = '#4a6fc4'; g.lineWidth = 1; line(g, 0, 4, 0, -16); g.fillStyle = '#4a6fc4'; g.beginPath(); g.arc(0, 0, 1.8, 0, TAU); g.fill(); g.restore();
    g.restore();
    // crimson enamel minute ring
    gr = g.createRadialGradient(0, 0, 112, 0, 0, 128); gr.addColorStop(0, '#5a0d18'); gr.addColorStop(.6, '#8e1a2c'); gr.addColorStop(1, '#4a0a14');
    ringPath(g, 112, 128); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(255,200,205,.18)'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 124, Math.PI * 1.05, Math.PI * 1.45); g.stroke();
    if (lit > 0) { g.strokeStyle = 'rgba(255,214,140,.5)'; g.lineWidth = 3.6; g.beginPath(); g.arc(0, 0, 126, ang(0), ang(lit)); g.stroke(); }
    g.strokeStyle = '#e8c27c';
    for (let i = 0; i < 60; i++) { const q = ang(i / 60); g.lineWidth = i % 5 ? .6 : 1.4; line(g, Math.cos(q) * (i % 5 ? 125 : 122.5), Math.sin(q) * (i % 5 ? 125 : 122.5), Math.cos(q) * 128, Math.sin(q) * 128); }
    g.fillStyle = '#efcf8c'; g.font = `600 10px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) { const q = ang(i / 12); g.save(); g.translate(Math.cos(q) * 117, Math.sin(q) * 117); g.rotate(q + Math.PI / 2); g.fillText(String(i ? i * 5 : 60), 0, 0); g.restore(); }
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = .8; g.beginPath(); g.arc(0, 0, 112, 0, TAU); g.stroke();
    // open-worked hand
    g.save(); g.rotate(lit * TAU);
    const hp = () => { g.beginPath(); g.moveTo(0, 24); g.lineTo(-4.2, 8); g.lineTo(-2.6, -78); g.lineTo(0, -108); g.lineTo(2.6, -78); g.lineTo(4.2, 8); g.closePath(); };
    g.fillStyle = 'rgba(16,14,18,.35)'; hp(); g.fill();
    g.strokeStyle = '#f0d391'; g.lineWidth = 1.5; hp(); g.stroke();
    g.fillStyle = '#e2334a'; g.beginPath(); g.moveTo(0, -112); g.lineTo(-2.4, -100); g.lineTo(0, -95); g.lineTo(2.4, -100); g.closePath(); g.fill();
    g.fillStyle = '#f0d391'; g.beginPath(); g.moveTo(-.8, -112); g.lineTo(0, -122); g.lineTo(.8, -112); g.fill();
    g.strokeStyle = '#f0d391'; g.lineWidth = 1.4; g.beginPath(); g.arc(0, 18, 4, 0, TAU); g.stroke();
    g.restore();
    // time window
    plate(g, -38, -104, 76, 26, A);
    g.fillStyle = '#f2e4c6'; g.font = `600 21px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(st.time, 0, -90.5);
    texDisc(g, A.bronze, 6); jewel(g, 0, 0, 2.3, true);
    if (end) glow(g, 0, 0, 150, 'rgba(255,90,90,1)', .18);
    glass(g, 128);
    g.restore();
  }


  /* ---------- the dial in the app: a canvas over the shared ring (hidden in app.css), the time and state drawn inside ---------- */
  let A = null; // textures and gear sprites, made on the first dial paint
  function assets() {
    if (A) return A;
    const ar = rng(77);
    A = {
      bronze: matTex(320, 7, 'bronze'), stone: matTex(320, 13, 'stone'), fog: fogDisc(224, 111), fog2: fogDisc(224, 127),
      dstars: Array.from({ length: 70 }, () => { const a = ar() * TAU, r = Math.sqrt(ar()) * 98; return [Math.cos(a) * r, Math.sin(a) * r, .6 + ar() * 1, ar() * 6]; }),
      cstars: Array.from({ length: 9 }, () => { const a = ar() * TAU, r = 30 + ar() * 60; return [Math.cos(a) * r, Math.sin(a) * r]; }),
      g: { barrel: gearSprite(36, 64, 5), center: gearSprite(30, 56, 4), third: gearSprite(22, 42, 5), fourth: gearSprite(17, 36, 4), pin: gearSprite(5, 8, 0, { c0: '#e8eaf0', c1: '#9a9ea8', c2: '#5a5e68' }), escape: gearSprite(12, 15, 3, { pointy: true, c0: '#e8eaf0', c1: '#9a9ea8', c2: '#4e525c' }) }
    };
    A.stripes = (() => { const c = mk(12, 12), g = c.getContext('2d'); g.fillStyle = '#5a5c66'; g.fillRect(0, 0, 12, 12); g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 3; for (let k = -12; k < 24; k += 6) line(g, k, 0, k + 12, 12); return c; })();
    A.perlage = (() => { const c = mk(512, 512), g = c.getContext('2d'); g.scale(2, 2); g.translate(128, 128); for (let y = -126; y < 126; y += 7) for (let x = -126 + (Math.round(y / 7) % 2) * 3.5; x < 126; x += 7) glow(g, x, y, 5, 'rgba(120,124,140,1)', .06); return c; })();
    return A;
  }
  const DIALS = { veil: dialPalace, rose: dialRose, skeleton: dialSkeleton };
  const dc = mk(300, 300), dg = dc.getContext('2d');
  dc.className = 'fog-dial'; dc.setAttribute('aria-hidden', 'true');
  let dEndAt = -1e9, dRaf = 0, dLast = 0;
  const txt = id => ((document.getElementById(id) || {}).textContent || '').trim();
  function renderDial() {
    const wrap = document.querySelector('#sigil-card .ring-wrap');
    if (!isOn() || !wrap) { if (dc.isConnected) dc.remove(); return; }
    if (dc.parentNode !== wrap) wrap.prepend(dc);
    if (!wrap.offsetParent) return; // another screen is shown (phone)
    const px = Math.round(wrap.clientWidth * 1.1 * Math.min(2, window.devicePixelRatio || 1)) || 300;
    if (dc.width !== px) { dc.width = px; dc.height = px; }
    still = reduced();
    const pr = progress(), endNow = (performance.now() - dEndAt) / 1000 < 2.6;
    const st = { mode: endNow ? 'end' : pr.started ? 'mid' : 'rest', prog: endNow ? 1 : pr.p, time: txt('clock'), label: txt('state').toUpperCase(), n: count() };
    dg.setTransform(px / 300, 0, 0, px / 300, 0, 0); dg.clearRect(0, 0, 300, 300);
    DIALS[dialOf()](dg, st, still ? 12 : performance.now() / 1000, assets());
  }
  // the spark, the fog and the balance wheel move between ticks: ~25 fps while the world is shown
  function loop(ts) { dRaf = 0; if (!isOn() || reduced()) return; if (!document.hidden && ts - dLast > 40) { dLast = ts; renderDial(); } dRaf = requestAnimationFrame(loop); }
  const kick = () => { renderDial(); if (!dRaf && isOn() && !reduced()) dRaf = requestAnimationFrame(loop); };
  function dialEnd() { if (reduced()) return; dEndAt = performance.now(); kick(); }
  on('session', s => { if (s && s.mins >= 1) dialEnd(); });
  ['tick', 'timer', 'render', 'started', 'newday', 'saved', 'motion'].forEach(ev => on(ev, kick));
  new MutationObserver(kick).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light'] });


  /* ---------- full screens: O « incant » (default) and N « door » (shop 500), slot S.econ.equip.deepFog ---------- */
  // O: an unreadable script writes itself in a spiral round the time, stroke by stroke, as the session goes; at the end a
  // crimson wave runs out from the centre and the signs rise like embers. N: one door in the dark; its two leaves swing
  // inward with the session onto a dawn on the other side, the glyphs of the frame light up one by one, one stone floats
  // by it per session today; at the end it opens wide and light floods the floor.
  ML.addStrings({
    fr: { dp_incant: 'Incantation', dp_door: 'La porte',
      dial_incant: 'Incantation', dial_incant_d: 'Brouillard · plein écran : une écriture inconnue s’inscrit en spirale autour du temps.',
      dial_door: 'La porte', dial_door_d: 'Brouillard · plein écran : une porte s’ouvre avec la session sur une aube.' },
    en: { dp_incant: 'Incantation', dp_door: 'The door',
      dial_incant: 'Incantation', dial_incant_d: 'Fog · full screen: an unknown script writes itself in a spiral round the time.',
      dial_door: 'The door', dial_door_d: 'Fog · full screen: a door opens with the session onto a dawn.' },
  });
  const fsOf = () => ((S.econ && S.econ.equip) || {}).deepFog === 'door' ? 'door' : 'incant';
  const prevStyle = ML.deepWorldStyle;
  ML.deepWorldStyle = k => k === 'fog' ? fsOf() : (prevStyle ? prevStyle(k) : null);

  const ALPHA = (() => { const r = rng(91); return Array.from({ length: 40 }, () => Array.from({ length: 2 + Math.floor(r() * 3) }, () => { const k = r(); if (k < .6) return ['l', r() - .5, -r(), r() - .5, -r()]; if (k < .85) return ['a', r() * .4 - .2, -.5 + r() * .3, .18 + r() * .2, r() * TAU, r() * 3 + 1]; return ['d', r() - .5, -r()]; })); })();
  function sign(g, k, x, y, s, rot, prog) {
    const G = ALPHA[k % ALPHA.length], n = G.length * prog; g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    G.forEach((st, i) => {
      const part = clamp(n - i, 0, 1); if (part <= 0) return;
      g.beginPath();
      if (st[0] === 'l') { g.moveTo(st[1], st[2]); g.lineTo(st[1] + (st[3] - st[1]) * part, st[2] + (st[4] - st[2]) * part); }
      else if (st[0] === 'a') g.arc(st[1], st[2], st[3], st[4], st[4] + st[5] * part);
      else g.arc(st[1], st[2], .06, 0, TAU);
      g.stroke();
    });
    g.restore();
  }
  function fsGround(g, w, h) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#08090d'); gr.addColorStop(.6, '#101118'); gr.addColorStop(1, '#16171e'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  function fsFog(g, w, h, t, a) { const T = tex(); band(g, w, T.sea[2], h * .66, h * .4, .5 * a, t * 3); band(g, w, T.sea[1], h * .8, h * .28, .55 * a, -t * 4 + 200); }
  function fsTime(g, txt, x, y, size, a, paused) {
    g.save(); g.globalAlpha = a; g.font = `500 ${Math.round(size)}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = size * .25; g.fillStyle = paused ? '#a9abb6' : '#ece6d8'; g.fillText(txt, x, y); g.restore();
  }
  function fsTask(g, txt, x, y, size, maxW) {
    if (!txt) return; g.save(); g.font = `500 ${Math.round(size)}px ${SC}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(200,202,212,.72)';
    let s = txt; while (s.length > 4 && g.measureText(s).width > maxW) s = s.slice(0, -2); if (s !== txt) s = s.trimEnd() + '…';
    g.fillText(s, x, y); g.restore();
  }

  // O · the incantation
  function fsIncant(g, w, h, k, t) {
    fsGround(g, w, h);
    const port = h > w, cx = w / 2, cy = port ? h * .4 : h * .46, ex = port ? 1 : Math.min(1.6, w / h * .82);
    const r0 = port ? w * .25 : h * .22, rMax = port ? w * .46 : h * .45, turns = 2.1, b = (rMax - r0) / (turns * TAU);
    const ds = port ? w * .06 : h * .042, sz = port ? w * .03 : h * .021;
    if (!k.pts || k.pts.key !== w + 'x' + h) { // lay the signs along the spiral once per size
      const pts = []; let th = -Math.PI / 2, i = 0;
      while (th < -Math.PI / 2 + turns * TAU) { const r = r0 + b * (th + Math.PI / 2); pts.push([th, r, i++]); th += ds / r; if (i % 5 === 0) th += ds * .9 / r; }
      pts.key = w + 'x' + h; k.pts = pts;
    }
    const pts = k.pts, N = pts.length, p = k.done ? 1 : k.p, shown = p * N, head = Math.floor(shown);
    const wave = k.done ? (k.endT * .3) % 1.6 : -1;
    glow(g, cx, cy, rMax * 1.2, 'rgba(160,166,186,1)', .06);
    if (k.done) glow(g, cx, cy, rMax * 1.1, 'rgba(226,58,78,1)', .14);
    g.lineCap = 'round';
    for (let i = 0; i < Math.min(N, head + 1); i++) {
      const [a, r, kk] = pts[i], x = cx + Math.cos(a) * r * ex, y = cy + Math.sin(a) * r, prog = i < head ? 1 : shown - head;
      const fresh = clamp(1 - (shown - i) / N * 8, 0, 1);
      let col = `rgba(${200 + 40 * fresh | 0},${204 + 30 * fresh | 0},${216 + 20 * fresh | 0},${.38 + .5 * fresh})`;
      if (k.done) { const k2 = clamp(1 - Math.abs(i / N - wave) * 6, 0, 1); col = `rgba(${200 + 55 * k2 | 0},${204 - 120 * k2 | 0},${216 - 110 * k2 | 0},${.5 + .5 * k2})`; if (k2 > .3) glow(g, x, y, sz * 1.4, 'rgba(255,70,90,1)', .25 * k2); }
      g.strokeStyle = col; g.lineWidth = .13;
      sign(g, kk * 7 + 3, x, y, sz, a + Math.PI / 2, prog);
      if (i === head && !k.done && !k.paused) glow(g, x, y, sz * 1.7, 'rgba(220,226,246,1)', .5);
    }
    g.lineCap = 'butt';
    if (k.done) { g.fillStyle = '#ffb0a0'; for (let q = 0; q < 40; q++) { const u = (q * .173 + k.endT * .12) % 1, a = q * 2.4, r = r0 + (rMax - r0) * ((q * .37) % 1); g.globalAlpha = .7 * (1 - u); g.fillRect(cx + Math.cos(a) * r * ex, cy + Math.sin(a) * r - u * h * .3, 1.6, 1.6); } g.globalAlpha = 1; }
    fsFog(g, w, h, t, .6);
    const fs = port ? w * .24 : h * .18;
    fsTime(g, k.clock, cx, cy, fs, k.done ? .7 : 1, k.paused);
    fsTask(g, k.title, cx, cy + fs * .64, Math.max(11, fs * .16), r0 * 1.9 * ex);
  }

  // N · the door (improved from the proposal: hinged leaves in perspective, iron bands, glyphs lighting up, steps, stones)
  const doorStars = (() => { const r = rng(5); return Array.from({ length: 30 }, () => [r(), r() * .55, .6 + r() * .8]); })();
  const doorGlyphs = (() => { const r = rng(17); return Array.from({ length: 24 }, (_, i) => ({ side: i % 2 ? 1 : -1, y: Math.floor(i / 2) / 12 + .03, k: Math.floor(r() * 40) })); })();
  function fsDoor(g, w, h, k, t) {
    fsGround(g, w, h);
    const port = h > w, dh = port ? h * .4 : h * .46, dw = dh * .52, cx = w / 2, top = port ? h * .14 : h * .09, bot = top + dh;
    const p = k.done ? 1 : k.p, open = k.done ? Math.min(1, .85 + k.endT / 2 * .15) : sm(p) * .85, ang = open * 1.36;
    // the halo behind the door, and a few stars
    const hr = dh * .62;
    glow(g, cx, top + dh * .35, hr * 1.6, 'rgba(210,214,226,1)', .06 + .06 * p);
    g.strokeStyle = `rgba(232,236,246,${.1 + .12 * p})`; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, top + dh * .35, hr, 0, TAU); g.stroke();
    glow(g, cx, top + dh * .6, dh * (.6 + 1.2 * p), 'rgba(255,226,180,1)', .05 + .25 * p);
    // the other place, through the doorway
    g.save(); g.beginPath(); g.rect(cx - dw / 2, top, dw, dh); g.clip();
    let gr = g.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, '#1d2b4b'); gr.addColorStop(.5, '#c99a72'); gr.addColorStop(.76, '#ffe6be'); gr.addColorStop(1, '#ffe6be');
    g.fillStyle = gr; g.fillRect(cx - dw / 2, top, dw, dh);
    g.fillStyle = '#fff'; for (const [a, b, s] of doorStars) { g.globalAlpha = .7 - b; g.fillRect(cx - dw / 2 + a * dw, top + b * dh * .7, s, s); } g.globalAlpha = 1;
    glow(g, cx - dw * .1, top + dh * .78, dw * .5, 'rgba(255,244,214,1)', .9);
    g.fillStyle = '#2a2318'; g.beginPath(); g.moveTo(cx - dw / 2, top + dh * .82); g.quadraticCurveTo(cx, top + dh * .75, cx + dw / 2, top + dh * .8); g.lineTo(cx + dw / 2, bot); g.lineTo(cx - dw / 2, bot); g.fill();
    g.strokeStyle = '#2a2318'; g.lineWidth = dw * .03; line(g, cx + dw * .2, top + dh * .79, cx + dw * .2, top + dh * .68);
    g.fillStyle = '#2a2318'; g.beginPath(); g.arc(cx + dw * .2, top + dh * .66, dw * .09, 0, TAU); g.arc(cx + dw * .14, top + dh * .69, dw * .06, 0, TAU); g.fill();
    g.restore();
    // the leaves swing inward: their free edge moves to the hinge and recedes (shorter)
    const leaf = side => {
      const hx = cx + side * dw / 2, lw = dw / 2 * Math.cos(ang), fx = hx - side * lw, d = dh * .07 * Math.sin(ang);
      const quad = (u0, v0, u1, v1) => { const P = (u, v) => [hx + (fx - hx) * u, top + d * u + (dh - 2 * d * u) * v]; const a = P(u0, v0), b2 = P(u1, v0), c = P(u1, v1), e = P(u0, v1); g.beginPath(); g.moveTo(...a); g.lineTo(...b2); g.lineTo(...c); g.lineTo(...e); g.closePath(); };
      const shade = .25 + .45 * Math.sin(ang);
      quad(0, 0, 1, 1); gr = g.createLinearGradient(hx, 0, fx, 0); gr.addColorStop(0, '#23242b'); gr.addColorStop(1, '#17181d'); g.fillStyle = gr; g.fill();
      g.fillStyle = `rgba(0,0,0,${shade * .6})`; g.fill();
      g.strokeStyle = 'rgba(150,154,170,.14)'; g.lineWidth = 1; quad(.16, .06, .84, .44); g.stroke(); quad(.16, .52, .84, .94); g.stroke();
      g.strokeStyle = 'rgba(70,72,82,.9)'; g.lineWidth = Math.max(1.5, dh * .012); for (const v of [.2, .78]) { quad(0, v, 1, v + .001); g.stroke(); }
      g.fillStyle = 'rgba(150,150,160,.5)'; for (const v of [.2, .78]) for (const u of [.12, .5, .88]) { const x = hx + (fx - hx) * u, y = top + d * u + (dh - 2 * d * u) * v; g.beginPath(); g.arc(x, y, Math.max(1, dh * .006), 0, TAU); g.fill(); }
      const rx = hx + (fx - hx) * .85, ry = top + dh * .5;
      g.strokeStyle = 'rgba(170,148,110,.6)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(rx, ry, dw * .04 * Math.max(.3, Math.cos(ang)), dw * .045, 0, 0, TAU); g.stroke();
      g.fillStyle = `rgba(255,222,176,${.12 + .6 * p})`; g.fillRect(side < 0 ? fx - 1.2 : fx, top + d, 1.2, dh - 2 * d);
    };
    leaf(-1); leaf(1);
    if (p < .03 && !k.done) { glow(g, cx, top + dh / 2, dh * .3, 'rgba(255,224,170,1)', .12); g.fillStyle = 'rgba(255,224,170,.8)'; g.fillRect(cx - .6, top + 2, 1.2, dh - 4); }
    g.fillStyle = `rgba(255,224,170,${.25 + .5 * p})`; g.fillRect(cx - dw / 2, bot - 1.5, dw, 1.5);
    // the frame, its glyphs lighting up with the session, and three steps
    const fw = dw * .14;
    gr = g.createLinearGradient(cx - dw / 2 - fw, 0, cx + dw / 2 + fw, 0); gr.addColorStop(0, '#4d4f58'); gr.addColorStop(.5, '#3a3c44'); gr.addColorStop(1, '#25262d');
    g.fillStyle = gr; g.fillRect(cx - dw / 2 - fw, top - fw * .2, fw, dh + fw * .2); g.fillRect(cx + dw / 2, top - fw * .2, fw, dh + fw * .2); g.fillRect(cx - dw / 2 - fw * 1.6, top - fw * 1.3, dw + fw * 3.2, fw * 1.15);
    g.fillStyle = '#5c5e68'; g.fillRect(cx - dw / 2 - fw * 1.7, top - fw * 1.45, dw + fw * 3.4, fw * .22);
    const lit = k.done ? 24 : Math.floor(p * 24);
    g.lineCap = 'round';
    doorGlyphs.forEach((gl, i) => {
      const x = cx + gl.side * (dw / 2 + fw / 2), y = top + dh * gl.y + dh * .02, on = i < lit;
      if (on) glow(g, x, y, fw * .7, k.done ? 'rgba(255,80,96,1)' : 'rgba(255,190,140,1)', .35);
      g.strokeStyle = on ? (k.done ? '#ffb0a8' : '#ffd6a8') : 'rgba(14,14,18,.8)'; g.lineWidth = .14;
      sign(g, gl.k, x, y + fw * .2, fw * .38, 0, 1);
    });
    g.lineCap = 'butt';
    for (let s = 0; s < 3; s++) { const sw = dw + fw * 2 + s * dw * .3, y = bot + s * dh * .025; g.fillStyle = s % 2 ? '#34363e' : '#3f4149'; g.fillRect(cx - sw / 2, y, sw, dh * .025); g.fillStyle = `rgba(255,222,176,${.15 * p + .03})`; g.fillRect(cx - sw / 2, y, sw, 1); }
    // one stone floats by the door per session today
    for (let i = 0; i < Math.min(8, k.n); i++) {
      const a = i / Math.max(1, k.n) * TAU + t * .04, x = cx + Math.cos(a) * dw * 1.5, y = top + dh * .45 + Math.sin(a) * dh * .12 + Math.sin(t * .6 + i) * 3, s = dh * .022 * (1 + .25 * Math.sin(a));
      g.save(); g.translate(x, y); g.rotate(i + t * .1); g.fillStyle = '#4b4d57'; g.fillRect(-s, -s * 1.3, s * 2, s * 2.6); g.strokeStyle = 'rgba(236,84,104,.8)'; g.lineWidth = .8; g.strokeRect(-s, -s * 1.3, s * 2, s * 2.6); g.restore();
    }
    // light on the floor, the fog, motes from the doorway
    const gap = dw * (1 - Math.cos(ang));
    gr = g.createLinearGradient(0, bot, 0, h); gr.addColorStop(0, `rgba(255,226,182,${.35 * p})`); gr.addColorStop(1, 'rgba(255,226,182,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(cx - gap / 2, bot); g.lineTo(cx + gap / 2, bot); g.lineTo(cx + gap * 1.8 + w * .06 * p, h); g.lineTo(cx - gap * 1.8 - w * .06 * p, h); g.fill();
    if (k.done) { g.fillStyle = `rgba(255,236,206,${.08 * Math.max(0, 1 - k.endT / 6)})`; g.fillRect(0, 0, w, h); }
    fsFog(g, w, h, t, 1 - .4 * p);
    g.fillStyle = '#ffeccc';
    for (let q = 0; q < (k.done ? 40 : 14); q++) { const u = (q * .137 + t * .05) % 1, x = cx + Math.sin(q * 7.1 + t * .3) * (gap * .4 + (k.done ? w * .25 : 4)), y = bot - u * dh * 1.1; g.globalAlpha = (p * .7 + .1) * Math.sin(u * Math.PI); g.fillRect(x, y, 1.4, 1.4); }
    g.globalAlpha = 1;
    const fs = port ? w * .26 : h * .16, ty = bot + (port ? h * .13 : fs * .78);
    fsTime(g, k.clock, cx, ty, fs, k.done ? .55 : 1, k.paused);
    fsTask(g, k.title, cx, ty + fs * .62, Math.max(11, fs * .16), w * .8);
  }

  const FS = { incant: fsIncant, door: fsDoor };
  let fCtx = null, fRaf = 0, fLast = 0, fEndAt = -1e9, fCur = '';
  function fsPaint() {
    const cv = document.getElementById('fg-cv'); if (!cv || !fCtx) return false;
    const W = cv.clientWidth, H = cv.clientHeight; if (!(W > 0 && H > 0)) return true;
    const dpr = Math.min(2, window.devicePixelRatio || 1), pw = Math.round(W * dpr), ph = Math.round(H * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const now = performance.now(); fCtx.endT = (now - fEndAt) / 1000;
    FS[fCur](g, W, H, fCtx, reduced() ? 8 : now / 1000);
    return true;
  }
  function fsLoop(ts) { fRaf = 0; if (ts - fLast > 40) { fLast = ts; if (!fsPaint()) return; } if (!reduced()) fRaf = requestAnimationFrame(fsLoop); }
  const fsStyle = key => ({
    html: (top, dock) => `<canvas id="fg-cv" aria-hidden="true"></canvas>${top}<p id="fg-task"></p>${dock}`,
    render: ({ rem, run, done, title }) => {
      const tot = S.total || 1, p = done ? 1 : clamp(1 - Math.max(0, rem) / tot, 0, 1);
      if (done && !(fCtx && fCtx.done)) fEndAt = performance.now();
      fCur = key;
      fCtx = Object.assign(fCtx && fCtx.key === key ? fCtx : { key }, { p, done, n: count(), paused: !run && !done && p > 0, clock: MiniView.fmtClock(done ? 0 : rem), title: title || '' });
      const el = document.getElementById('fg-task'); if (el) el.textContent = title || '';
      if (reduced()) fsPaint(); else if (!fRaf) fRaf = requestAnimationFrame(fsLoop);
    },
    doneMs: () => reduced() ? 4200 : 6000,
  });
  ML.deepStyles = Object.assign(ML.deepStyles || {}, { incant: fsStyle('incant'), door: fsStyle('door') });

  /* ---------- shop pictures (painted once, at rest) ---------- */
  const pics = {};
  ML.fogShopPic = k => {
    if (!pics[k]) { try {
      if (FS[k]) {
        const c = mk(280, 160), g = c.getContext('2d');
        FS[k](g, 280, 160, { p: .55, done: false, n: 2, paused: false, clock: '12:30', title: '', endT: 99 }, 8);
        pics[k] = c.toDataURL('image/jpeg', .85);
      } else {
        const c = mk(240, 240), g = c.getContext('2d'); g.scale(.8, .8); still = true;
        DIALS[k](g, { mode: 'rest', prog: 0, time: '25:00', label: '', n: 2 }, 12, assets());
        pics[k] = c.toDataURL('image/png');
      } } catch (e) { return ''; } }
    return `<img class="${FS[k] ? 'fog-fs-prev' : 'fog-prev'}" src="${pics[k]}" alt="">`;
  };
})();
