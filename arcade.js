// Arcade (Scattered, day world, dark) 3.51, chosen from proposals/arcade/arcade.html (artifact LhQ1voQA8TFnzeWSSqaowK;
// round 1 kept as arcade-v1.html). Everything is pixel art: drawn on a small canvas (about 240×150, more rows on tall
// screens) and scaled up without smoothing, with ordered dithering instead of gradients.
// - Default set « valley » (B+F+H): palette Crépuscule (plum, peach, lavender), a mountain lake at dusk (striped sun,
//   three ranges, the sky in the water, pines one by one, a cabin with smoke; clouds, fireflies and birds at rest; mist
//   on the lake in focus; one lantern on the path per session today; sky lanterns at the end) and the 8-bit chronograph
//   (steel case, crown and pushers, bezel 0–55, sub-dials for today's sessions and the seconds, red hand).
// - Shop set « pier » (Premium only, 1200): palette Jetée, the pier at night (navy Victorian pavilion with arcade
//   cabinets behind the windows, a slow Ferris wheel with one gondola lit per session, bulb garlands, lighthouse,
//   fireworks at the end) and the bulb dial (60 bulbs, one per minute, navy plate and brass).
// - Shop set « orbit » (900): palette Borne ambre, a ringed planet with ring shadows, a dithered nebula with dust lanes,
//   drifting asteroids, a ring station, one satellite per session, an aurora at the end; the orbit dial (a moon goes
//   round in one session).
// - Shop palette « redcream » (300) replaces the set's palette; « worldtone » (free) gives it back.
// - Full screen « sunset » (L), valley set only: the sun goes down with the session and sets behind the ridge at the
//   end, stars come out, one lantern per session on the shore, lanterns rise at the end; the time in big pixel blocks.
// Slots: S.econ.equip.arcadeSet ('valley'|'pier'|'orbit') and .arcadePal ('worldtone'|'redcream'), sold in economy.js.
// The palette is CSS (app.css « Arcade 3.50 », html[data-arc-pal]); this file sets the attribute.
(() => {
  'use strict';
  const { S, on, t, today, dayKey } = ML;
  const root = document.documentElement, TAU = Math.PI * 2;
  ML.addStrings({
    fr: { dial_valley: 'La vallée', dial_valley_d: 'Arcade · le lac au crépuscule, le chrono 8 bits et la palette Crépuscule.',
      dial_pier: 'La jetée', dial_pier_d: 'Arcade · la jetée la nuit, le cadran à ampoules et la palette Jetée.',
      dial_orbit: 'L’orbite', dial_orbit_d: 'Arcade · une planète à anneaux, le cadran orbite et la palette ambre.',
      dial_redcream: 'Rouge et crème', dial_redcream_d: 'Arcade · palette seule : anthracite, crème et un rouge, sur n’importe quel fond.',
      dial_worldtone: 'Couleurs du monde', dial_worldtone_d: 'Arcade · reprend la palette du fond choisi.', dp_sunset: 'Coucher de soleil' },
    en: { dial_valley: 'The valley', dial_valley_d: 'Arcade · the lake at dusk, the 8-bit chronograph and the Dusk palette.',
      dial_pier: 'The pier', dial_pier_d: 'Arcade · the pier at night, the bulb dial and the Pier palette.',
      dial_orbit: 'The orbit', dial_orbit_d: 'Arcade · a ringed planet, the orbit dial and the amber palette.',
      dial_redcream: 'Red and cream', dial_redcream_d: 'Arcade · palette only: charcoal, cream and one red, on any background.',
      dial_worldtone: 'World colours', dial_worldtone_d: 'Arcade · uses the palette of the chosen background.', dp_sunset: 'Sunset' },
  });

  const isOn = () => root.dataset.theme === 'arcade' && !root.dataset.light;
  const equip = () => (S.econ && S.econ.equip) || {};
  const setOf = () => { const k = equip().arcadeSet; return k === 'pier' || k === 'orbit' ? k : 'valley'; };
  const palOf = () => equip().arcadePal === 'redcream' ? 'red' : { valley: 'dusk', pier: 'pier', orbit: 'amber' }[setOf()];
  let nCache = 0, nAt = -1e9;
  const count = () => { const now = performance.now(); if (now - nAt > 5000) { nAt = now; const td = today(); nCache = (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length; } return nCache; };
  on('session', () => { nAt = -1e9; }); on('newday', () => { nAt = -1e9; });
  function syncPal() { const v = isOn() ? palOf() : ''; if ((root.dataset.arcPal || '') !== v) { if (v) root.dataset.arcPal = v; else delete root.dataset.arcPal; } }
  on('render', syncPal); on('saved', syncPal);

  /* ---------- pixel helpers ---------- */
  const hx = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)], C = hx;
  const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const dth = (x, y, f) => f * 16 > B4[y & 3][x & 3] + .5;
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k | 0, a[1] + (b[1] - a[1]) * k | 0, a[2] + (b[2] - a[2]) * k | 0];
  const rng = seed => { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
  function vnoise(seed) {
    const r = rng(seed), P = new Float32Array(65536); for (let i = 0; i < P.length; i++) P[i] = r();
    const g = (a, b) => P[((b & 255) << 8) | (a & 255)], sm = v => v * v * (3 - 2 * v);
    const f = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), u = sm(x - xi), v = sm(y - yi);
      return (g(xi, yi) * (1 - u) + g(xi + 1, yi) * u) * (1 - v) + (g(xi, yi + 1) * (1 - u) + g(xi + 1, yi + 1) * u) * v; };
    return (x, y) => { let a = 0, amp = .5, fr = 1; for (let o = 0; o < 4; o++) { a += amp * f(x * fr, y * fr); amp *= .5; fr *= 2; } return a / .9375; };
  }
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  // an ImageData layer for the parts painted once
  function img(w, h) {
    const c = canvas(w, h), g = c.getContext('2d'), id = g.createImageData(w, h), d = id.data;
    const o = { w, h,
      set(x, y, col) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const i = (y * w + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; },
      get(x, y) { x = Math.max(0, Math.min(w - 1, Math.round(x))); y = Math.max(0, Math.min(h - 1, Math.round(y))); const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2]]; },
      grad(y0, y1, cols) { const n = cols.length - 1; for (let y = Math.max(0, y0); y < y1; y++) { const tt = (y - y0) / Math.max(1, y1 - y0 - 1) * n, b = Math.max(0, Math.min(n - 1, Math.floor(tt))), f = tt - b; for (let x = 0; x < w; x++) o.set(x, y, dth(x, y, f) ? cols[b + 1] : cols[b]); } },
      line(x0, y0, x1, y1, col) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
        for (;;) { o.set(x0, y0, col); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } },
      done() { g.putImageData(id, 0, 0); return c; } };
    return o;
  }
  function ln(g, x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); g.fillStyle = c;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (;;) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  const px = (g, x, y, c, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  // 3×5 pixel font: dial numerals and the full-screen time
  const FONT = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001010010', 8: '111101111101111', 9: '111101111001111', ':': '000010000010000' };
  function text(o, s, cx, cy, col) {
    const w = s.length * 4 - 1, x0 = Math.round(cx - w / 2), y0 = Math.round(cy - 2.5);
    [...s].forEach((ch, k) => { const f = FONT[ch]; if (f) for (let i = 0; i < 15; i++) if (f[i] === '1') o.set(x0 + k * 4 + (i % 3), y0 + (i / 3 | 0), col); });
  }
  function big(g, s, cx, y0, k, col, sh) {
    const w = s.length * 4 * k - k, x0 = Math.round(cx - w / 2), sd = Math.max(1, Math.round(k / 3));
    for (const pass of sh ? [0, 1] : [1]) [...s].forEach((ch, i) => { const f = FONT[ch]; if (f) for (let j = 0; j < 15; j++) if (f[j] === '1') {
      const x = x0 + i * 4 * k + (j % 3) * k, y = y0 + ((j / 3) | 0) * k; px(g, x + (pass ? 0 : sd), y + (pass ? 0 : sd), pass ? col : sh, k, k); } });
  }

  /* ---------- F · the valley (default). Designed on 240×150; taller canvases add night sky on top (dy), wider ones spread ---------- */
  const PINES = [[-2, 150, 50], [7, 152, 60], [19, 151, 44], [29, 150, 34], [205, 151, 32], [215, 150, 50], [227, 152, 64], [238, 150, 42],
    [80, 128, 18], [88, 130, 23], [97, 128, 14], [123, 129, 12], [141, 128, 16], [149, 130, 25], [160, 129, 18], [176, 128, 13]];
  const LANTERNS = [70, 92, 114, 134, 156, 176, 196, 214];
  function valleyGeo(w, h) {
    const dy = h - 150, X = x => Math.round(x * w / 240);
    return { w, h, dy, X, HZ: 96 + dy, sx: X(158), sy: 50 + dy, cab: X(46) - 46, path: x => Math.round(136 + dy + 5 * Math.sin(x * .03 + .4)),
      pineX: x => x < 40 ? x : x > 200 ? w - (240 - x) : X(x) };
  }
  function buildValley(w, h) {
    const G = valleyGeo(w, h), { dy, HZ, sx, sy, cab } = G, o = img(w, h), r = rng(11), sr = 17, top = Math.max(0, dy);
    if (top > 0) o.grad(0, top + 1, ['#090618', '#120b28', '#170e30'].map(C));
    o.grad(top, HZ, ['#170e30', '#2a1446', '#481c56', '#72285c', '#a63e5c', '#d9665a', '#f39a62', '#fcc679'].map(C));
    for (let i = 0; i < 40 + top * w / 80; i++) o.set(r() * w, r() * (26 + top), C(r() < .3 ? '#f6d8e8' : '#7c5a8e'));
    for (let y = sy - 32; y <= sy + 32; y++) for (let x = sx - 32; x <= sx + 32; x++) { const d = Math.hypot(x - sx, y - sy); if (d > sr && d < 32 && y < HZ && dth(x & 255, y & 255, (32 - d) / 15 * .6)) o.set(x, y, mix(o.get(x, y), C('#ffc888'), .35)); }
    const CUT = new Set([3, 6, 7, 10, 11, 13, 14, 15]);
    for (let y = sy - sr; y <= sy + sr; y++) for (let x = sx - sr; x <= sx + sr; x++) { const d = Math.hypot(x - sx, y - sy), yy = y - sy; if (d > sr || (yy > 0 && CUT.has(yy))) continue;
      const k = (y - (sy - sr)) / (2 * sr); o.set(x, y, C(k < .4 ? '#fff3c4' : k < .62 ? (dth(x & 255, y & 255, (k - .4) / .22) ? '#ffd590' : '#fff3c4') : '#ffbd74')); }
    const lit = (x, sl) => x < sx ? sl > .25 : sl < -.25;
    const f1 = x => 58 + dy + 10 * Math.sin(x * .028 + 1) + 6 * Math.sin(x * .07 + .5) + 3 * Math.sin(x * .19) + 1.5 * Math.sin(x * .5);
    for (let x = 0; x < w; x++) { const tp = Math.round(f1(x)), sl = f1(x + 1) - f1(x - 1), L = lit(x, sl);
      for (let y = tp; y < HZ; y++) { let c = C(L ? '#93486e' : '#5e2c60'); if (y - tp < 2 + (tp - dy < 52 ? 2 : 0) && tp - dy < 60) c = C(L ? '#f2c0cc' : '#b98aa8');
        if (y > HZ - 14 && dth(x & 255, y & 255, (y - (HZ - 14)) / 14 * .7)) c = C('#b04a5e'); o.set(x, y, c); } }
    const f2 = x => 74 + dy + 7 * Math.sin(x * .043 + 3) + 5 * Math.sin(x * .11 + 2) + 2 * Math.sin(x * .3 + 1);
    for (let x = 0; x < w; x++) { const tp = Math.round(f2(x)), sl = f2(x + 1) - f2(x - 1), L = lit(x, sl);
      for (let y = tp; y < HZ; y++) { let c = C(L ? '#5e2a5a' : '#3e1c4c'); if (y > HZ - 8 && dth(x & 255, y & 255, (y - (HZ - 8)) / 8 * .6)) c = C('#6a2c58'); o.set(x, y, c); } }
    const f3 = x => 89 + dy + 3 * Math.sin(x * .06) + 2 * Math.sin(x * .21);
    for (let x = 0; x < w; x++) for (let y = Math.round(f3(x)); y < HZ; y++) o.set(x, y, C('#26113a'));
    for (let x0 = 0; x0 < w; x0 += 2 + (r() * 3 | 0)) { const hh = 3 + (r() * 5 | 0), b = Math.round(f3(x0)); for (let k = 0; k < hh; k++) { const hw = Math.floor(k / 2.6); for (let x = x0 - hw; x <= x0 + hw; x++) o.set(x, b - hh + k, C('#26113a')); } }
    for (let x = 0; x < w; x++) o.set(x, HZ, C('#1a0c2a'));
    // the lake mirrors what is above it
    for (let y = HZ + 1; y < 126 + dy; y++) { const src = Math.max(0, HZ - 1 - Math.floor((y - HZ) * 1.6)), k = .3 + (y - HZ) / 70;
      for (let x = 0; x < w; x++) o.set(x, y, mix(o.get(x + Math.round(Math.sin(y * .8)), src), C('#1a0f36'), Math.min(.8, k)));
      if ((y - HZ) % 5 === 2) for (let x = 0; x < w; x++) if (r() < .35) o.set(x, y, mix(o.get(x, y), C('#ffd0a0'), .12)); }
    const f4 = x => 123 + dy + 3 * Math.sin(x * .04 + 1) + 1.5 * Math.sin(x * .13);
    for (let x = 0; x < w; x++) { const tp = Math.round(f4(x)); for (let y = tp; y < h; y++) o.set(x, y, C(y === tp ? '#3a1c44' : y === tp + 1 ? '#2a1436' : '#160a24'));
      const py = G.path(x); o.set(x, py, C('#2e1a3c')); o.set(x, py + 1, C('#26142f')); if (r() < .12) o.set(x, tp + 2 + (r() * 10 | 0), C('#24123a')); }
    // the cabin
    const Y = y => y + dy;
    for (let y = 117; y < 125; y++) for (let x = 40; x < 53; x++) o.set(x + cab, Y(y), C((y - 117) % 3 === 0 ? '#2e1828' : x > 49 ? '#2e1828' : '#3a2030'));
    for (let k = 0; k < 7; k++) for (let x = 38 + k; x < 55 - k; x++) o.set(x + cab, Y(116 - k), C(k === 0 ? '#6e3448' : x < 40 + k ? '#6e3448' : '#4e2438'));
    for (let y = 119; y < 122; y++) for (let x = 43; x < 46; x++) o.set(x + cab, Y(y), C(x === 44 || y === 120 ? '#d08a40' : '#ffcf7a'));
    for (let y = 120; y < 125; y++) { o.set(49 + cab, Y(y), C('#1c0e1a')); o.set(50 + cab, Y(y), C('#1c0e1a')); }
    for (let y = 106; y < 112; y++) { o.set(50 + cab, Y(y), C('#3a2030')); o.set(51 + cab, Y(y), C('#2e1828')); }
    // pines one by one: a tiered silhouette, a warm rim on the side that faces the sun
    for (const [x1, base, hh] of PINES) { const x0 = G.pineX(x1), b0 = base + dy;
      for (let k = 0; k < hh; k++) { const y = b0 - hh + k, hw = Math.floor(.5 + k * .27 * (.55 + .45 * ((k % 7) / 7)));
        for (let x = x0 - hw; x <= x0 + hw; x++) { const rim = x0 < sx ? x === x0 + hw : x === x0 - hw; o.set(x, y, C(rim && k > 1 ? '#3e1c48' : '#0e061c')); } }
      for (let y = b0 - 2; y < b0 + 3; y++) o.set(x0, y, C('#1a0c18')); }
    return { G, c: o.done() };
  }
  const CLOUDS = [{ x: 20, y: 18, l: 46, s: 1.2 }, { x: 120, y: 12, l: 62, s: .8 }, { x: 190, y: 30, l: 34, s: 1.6 }, { x: 70, y: 36, l: 28, s: 2 }];
  function cloud(g, x, y, l) { px(g, x + 6, y, '#ffbe8e', l - 14, 1); px(g, x + 10, y - 1, '#ffd2a6', Math.round(l * .3), 1); px(g, x + 2, y + 1, '#ee8a80', l - 6, 1); px(g, x, y + 2, '#c25e70', l, 1); px(g, x + 4, y + 3, '#8e3e64', l - 10, 1); }
  function drawValley(g, B, tt, st) {
    const { G, c } = B, { w, h, dy, HZ, sx, X, cab } = G;
    g.drawImage(c, 0, 0);
    for (const cl of CLOUDS) cloud(g, Math.round(((X(cl.x) + tt * cl.s) % (w + cl.l)) - cl.l), cl.y + dy, cl.l);
    if (st.fk > .01) { g.fillStyle = `rgba(22,8,32,${(.32 * st.fk).toFixed(3)})`; g.fillRect(0, 0, w, h); }
    for (let y = HZ + 2; y < 124 + dy; y += 2) { const k = (y - HZ) / 28, ww = Math.round(14 - k * 6), off = Math.round(Math.sin(y * .9 + tt * 2) * 1.5);
      if (Math.sin(y * 1.9 + tt * 2.6) < -.3) continue; g.globalAlpha = Math.max(0, (.55 - k * .3) * (1 - .4 * st.fk)); px(g, sx - (ww >> 1) + off, y, '#ffc880', ww, 1); }
    g.globalAlpha = 1;
    for (let i = 0; i < 14 * w / 240; i++) { if ((i + Math.floor(tt * 2)) % 4) continue; px(g, (i * 41 + 7) % w, HZ + 3 + (i * 13) % 24, '#c87a90', 3, 1); }
    for (let i = 0; i < 6; i++) { const a = (tt * .25 + i / 6) % 1; g.globalAlpha = (1 - a) * .45; px(g, 50 + cab + Math.sin(a * 6 + i) * 1.5 + a * 7, 105 + dy - a * 24, '#b89aaa', a > .5 ? 2 : 1, a > .5 ? 2 : 1); }
    g.globalAlpha = 1;
    if (st.rest) {
      for (let i = 0; i < 10; i++) { if (Math.sin(tt * 2 + i * 1.7) < .3) continue; const x = X(60 + (i * 23) % 140) + Math.sin(tt * .7 + i) * 6, y = 116 + dy + (i * 7) % 14 + Math.sin(tt * 1.1 + i * 2) * 3;
        px(g, x, y, '#efff9a'); g.globalAlpha = .25; px(g, x - 1, y - 1, '#efff9a', 3, 3); g.globalAlpha = 1; }
      const bx = Math.round((tt * 8) % (w + 50)) - 25, f = Math.floor(tt * 3) % 2;
      for (const [ox, oy] of [[0, 0], [7, 3], [-6, 4]]) { const x = bx + ox, y = 44 + dy + oy; px(g, x - 1, y - f, '#3a1830'); px(g, x, y, '#3a1830'); px(g, x + 1, y - f, '#3a1830'); }
    }
    LANTERNS.forEach((x0, i) => { const x = X(x0), y = G.path(x) - 1, lit = i < st.n;
      px(g, x, y - 6, '#3a2236', 1, 6); px(g, x - 1, y - 8, lit ? '#ffcf6a' : '#3a2a3a', 2, 2);
      if (lit) { g.globalAlpha = .2 + .05 * Math.sin(tt * 3 + i); px(g, x - 3, y - 10, '#ffcf6a', 6, 6); g.globalAlpha = 1; } });
    if (st.fk > .01) for (let y = HZ - 6; y < HZ + 22; y++) { const a = .2 * st.fk * (1 - Math.abs(y - HZ - 6) / 16); for (let x = 0; x < w; x += 5) { const ww = Math.sin(x * .045 + tt * .5 + y * .25); if (ww < 0) continue; g.globalAlpha = a * ww; px(g, x, y, '#e0b0c8', 5, 1); } }
    g.globalAlpha = 1;
    if (st.end > 0) for (let i = 0; i < 9; i++) { const ph = (st.endT * .22 + i / 9) % 1, x = X(34 + i * 22) + Math.sin(ph * 8 + i) * 3, y = 124 + dy - ph * (116 + dy * .6);
      g.globalAlpha = (1 - ph * .7) * st.end; px(g, x, y, '#ffe0a0', 2, 1); px(g, x, y + 1, '#ffb84a', 2, 2); g.globalAlpha = (1 - ph) * .25 * st.end; px(g, x - 2, y - 2, '#ffb84a', 6, 6); }
    g.globalAlpha = 1;
  }

  /* ---------- E2 · the pier at night (shop, Premium). The pier, wheel and pavilion keep to the right edge ---------- */
  function buildPier(w, h) {
    const dy = h - 150, ox = w - 240, HZ = 88 + dy, o = img(w, h), r = rng(7), top = Math.max(0, dy), X = x => Math.round(x * w / 240);
    if (top > 0) o.grad(0, top + 1, ['#05081a', '#070b1e'].map(C));
    o.grad(top, HZ, ['#070b1e', '#0a1130', '#121a42', '#1c2052', '#2c2660', '#423068'].map(C));
    for (let i = 0; i < 140 + top * w / 60; i++) { const x = r() * w | 0, y = r() * (HZ - 18) | 0, k = r(), c = C(k < .25 ? '#ffe9b8' : k < .55 ? '#8f98d0' : '#4f558c'); o.set(x, y, c);
      if (r() < .05) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => o.set(x + a, y + b, C('#4f558c'))); }
    const mx = 46, my = 26 + dy;
    for (let y = my - 18; y <= my + 18; y++) for (let x = mx - 18; x <= mx + 18; x++) { const d = Math.hypot(x - mx, y - my); if (d > 9.5 && d < 18 && dth(x & 255, y & 255, (18 - d) / 8 * .5)) o.set(x, y, C('#262a64')); }
    for (let y = my - 9; y <= my + 9; y++) for (let x = mx - 9; x <= mx + 9; x++) { const ddx = x - mx, ddy = y - my, d = ddx * ddx + ddy * ddy; if (d > 84) continue;
      let c = '#f6ecca'; if (ddx + ddy > 5 && d > 40) c = '#d8c9a2'; if (d > 66 && ddx + ddy > -2) c = '#bfae88'; o.set(x, y, C(c)); }
    [[-3, -2], [-2, -2], [-3, -1], [2, 3], [3, 3], [1, -4], [4, -1], [-5, 2]].forEach(([a, b]) => o.set(mx + a, my + b, C('#cdbd96')));
    for (const [cx0, cy0, l] of [[22, 40, 48], [64, 33, 30], [140, 18, 58], [196, 40, 38], [102, 52, 26]]) for (let k = 0; k < l; k++) {
      const x = X(cx0) + k, hh = Math.round(2.2 * Math.sin(k / l * Math.PI)), near = Math.abs(x - mx) < 44, cy = cy0 + dy;
      for (let y = cy - hh; y <= cy + 1; y++) if (y === cy - hh || dth(x & 255, y & 255, .6)) o.set(x, y, C(y === cy - hh ? (near ? '#6a6ca8' : '#3a3e78') : '#1c2256')); }
    for (let x = 0; x < 130; x++) { const f = (130 - x) / 130, hh = Math.round((5 + 4 * Math.sin(x * .05) + 2.5 * Math.sin(x * .17 + 1)) * f + (x < 34 ? 6 : 0) * f);
      for (let y = HZ - hh; y < HZ; y++) o.set(x, y, C(y === HZ - hh ? '#1e2454' : '#0f1434'));
      if (hh > 3 && r() < .2) { const y = HZ - 1 - (r() * (hh - 2) | 0); o.set(x, y, C(r() < .5 ? '#ffcb6b' : '#b9773e')); } }
    const lx = 16, lb = HZ - 10;
    for (let y = lb - 16; y < lb; y++) { const red = ((y - (lb - 16)) >> 2) % 2 === 0; for (let x = lx - 1; x <= lx + 1; x++) o.set(x, y, C(red ? (x === lx + 1 ? '#8a2c3c' : '#c04050') : (x === lx + 1 ? '#a8a090' : '#e8e0d0'))); }
    for (let x = lx - 2; x <= lx + 2; x++) { o.set(x, lb - 17, C('#2a2440')); o.set(x, lb - 21, C('#2a2440')); }
    for (let y = lb - 20; y <= lb - 18; y++) { o.set(lx - 1, y, C('#ffe08a')); o.set(lx, y, C('#fff6c8')); o.set(lx + 1, y, C('#ffe08a')); }
    o.set(lx, lb - 22, C('#2a2440'));
    o.grad(HZ, h, ['#262862', '#1a1c4e', '#12143c', '#0c0e2e', '#07091f'].map(C));
    for (let i = 0; i < 90 * w / 240; i++) { const y = HZ + 1 + (r() * (h - HZ - 1) | 0), x = r() * w | 0, ww = 2 + (r() * 8 | 0); for (let k = 0; k < ww; k++) o.set(x + k, y, C(y < HZ + 20 ? '#30326c' : '#1c1e50')); }
    for (let x = 0; x < w; x++) o.set(x, HZ, C('#34366e'));
    const wx = 122 + ox, wy = 56 + dy, Y = y => y + dy;
    o.line(wx, wy, wx - 16, Y(99), C('#2e2a58')); o.line(wx, wy, wx + 16, Y(99), C('#24204a')); o.line(wx - 8, Y(78), wx + 8, Y(78), C('#24204a'));
    for (let x = 92 + ox; x < w; x++) { o.set(x, Y(99), C('#4a4672')); o.set(x, Y(100), C('#2c2a50')); o.set(x, Y(101), C('#211f42')); o.set(x, Y(102), C('#171632')); }
    for (let x = 94 + ox; x < w; x += 8) {
      for (let y = 103; y < 123; y++) { o.set(x, Y(y), C('#1e1c3c')); o.set(x + 1, Y(y), C('#13122a')); }
      o.line(x + 1, Y(106), x + 8, Y(113), C('#1a1838')); o.line(x + 8, Y(106), x + 1, Y(113), C('#1a1838'));
      for (let y = 124; y < 140; y++) if (dth(x & 255, y & 255, .55 - (y - 124) / 30)) o.set(x, Y(y), C('#0c0c22'));
    }
    for (let x = 92 + ox; x < 160 + ox; x++) { o.set(x, Y(95), C('#3e3e6a')); if (x % 4 === 0) for (let y = 96; y < 99; y++) o.set(x, Y(y), C('#2e2e58')); }
    // the pavilion: navy walls, pilasters, a mansard roof, two turrets and a central dome lit by the moon on the left
    const p0 = 160 + ox, p1 = 227 + ox, S2 = (x, y, c) => o.set(x + ox, Y(y), C(c));
    for (let y = 74; y < 99; y++) for (let x = p0; x < p1; x++) o.set(x, Y(y), C(x > p1 - 4 ? '#121a3a' : '#1a2248'));
    for (const x of [161, 172, 183, 201, 212, 223]) for (let y = 74; y < 99; y++) { S2(x, y, '#2a3466'); S2(x + 1, y, '#20285a'); }
    for (let x = 159; x <= 227; x++) { S2(x, 74, '#4a5490'); S2(x, 75, '#2a3466'); S2(x, 98, '#2a3466'); }
    for (let k = 0; k < 6; k++) for (let x = 160 + k; x < 227 - k; x++) S2(x, 73 - k, k === 5 ? '#5a5ea0' : x < 160 + k + 2 ? '#4a4c88' : '#262a5a');
    const dome = (cx, by, rr) => {
      for (let y = Math.floor(by - rr * 1.3); y <= by; y++) for (let x = cx - rr; x <= cx + rr; x++) { const ddx = x - cx, d = Math.hypot(ddx, (y - by) / 1.3); if (d > rr) continue;
        S2(x, y, ddx < -rr * .3 && d > rr * .45 ? '#8a8cc8' : ddx > rr * .4 ? '#20265a' : '#343a78'); }
      for (let y = Math.floor(by - rr * 1.3) - 4; y < by - rr * 1.3; y++) S2(cx, y, '#c8a060'); };
    for (const tx of [160, 222]) for (let y = 64; y < 74; y++) for (let x = tx; x < tx + 6; x++) S2(x, y, x === tx ? '#3a4480' : x > tx + 3 ? '#141c40' : '#1e2650');
    dome(163, 64, 4); dome(225, 64, 4); dome(193, 68, 8);
    for (const x0 of [165, 176, 205, 216]) for (let y = 78; y < 92; y++) for (let x = x0; x < x0 + 6; x++) { if (y === 78 && (x === x0 || x === x0 + 5)) continue;
      const k = (y - 78) / 14; S2(x, y, y === 84 ? '#8a5a2a' : k < .3 ? '#ffd890' : k < .7 ? '#f0a85a' : '#c8783a'); }
    for (const x0 of [165, 176, 205, 216]) for (let y = 86; y < 92; y++) for (let x = x0 + 2; x < x0 + 5; x++) S2(x, y, '#2a1830');
    for (let y = 84; y < 99; y++) for (let x = 187; x < 200; x++) { if (y === 84 && (x === 187 || x === 199)) continue; S2(x, y, x === 193 ? '#a86a2a' : y < 88 ? '#ffe2a0' : '#f09a48'); }
    for (let x = 184; x < 203; x++) S2(x, 99, '#a8784a');
    return { G: { w, h, dy, ox, HZ }, c: o.done() };
  }
  function drawPier(g, B, tt, st) {
    const { G, c } = B, { w, h, dy, ox, HZ } = G, step = Math.floor(tt * 4), Y = y => y + dy, fk = st.fk;
    g.drawImage(c, 0, 0);
    if (fk > .01) { g.fillStyle = `rgba(6,8,26,${(.38 * fk).toFixed(3)})`; g.fillRect(0, 0, w, h); }
    if (st.rest) { const a = Math.sin(tt * .8), ex = 16 + a * 78, k = .3 + .7 * Math.abs(a);
      g.globalAlpha = .14 * k; ln(g, 16, HZ - 29, ex, HZ - 36, '#ffe7a0'); ln(g, 16, HZ - 29, ex, HZ - 22, '#ffe7a0'); g.globalAlpha = .28 * k; ln(g, 16, HZ - 29, ex, HZ - 29, '#fff2c0'); g.globalAlpha = 1; }
    for (let y = HZ + 2; y < h - 4; y += 2) { const k = (y - HZ) / (h - HZ), ww = Math.round(3 + k * 10), off = Math.round(Math.sin(y * .9 + tt * 2.2) * (1 + k * 2));
      if (Math.sin(y * 1.7 + tt * 3) < -.4) continue; g.globalAlpha = (.75 - k * .5) * (1 - .4 * fk); px(g, 46 - (ww >> 1) + off, y, k < .3 ? '#e9dcb4' : '#a99c86', ww, 1); }
    g.globalAlpha = .35;
    for (let i = 0; i < 12; i++) px(g, ((i * 53 + tt * (3 + i % 3)) % (w + 30)) - 30, HZ + 4 + i * 5, '#3a3c80', 14 + (i % 4) * 4, 1);
    g.globalAlpha = 1;
    for (let i = 0; i < 30 * w / 240; i++) { if ((i + Math.floor(tt * 3)) % 5) continue; px(g, (i * 37 + 11) % w, HZ + 3 + (i * 17) % (h - HZ - 6), '#5a5aa4', 2, 1); }
    if (st.rest && !st.end) { const bx = Math.round((tt * 4) % 150) - 30;
      if (bx < 88 + ox) { px(g, bx, HZ + 1, '#05061a', 10, 2); px(g, bx + 1, HZ + 3, '#05061a', 8, 1); px(g, bx + 5, HZ - 2, '#05061a', 3, 3); ln(g, bx + 3, HZ + 1, bx + 3, HZ - 7, '#05061a');
        if (Math.floor(tt * 2) % 2) { px(g, bx + 3, HZ - 8, '#ffcf5a'); g.globalAlpha = .4; px(g, bx + 3, HZ + 5, '#ffcf5a', 1, 2); g.globalAlpha = 1; } } }
    if (st.rest) { const gx = Math.round((tt * 11) % (w + 30)) - 15, gy = Math.round(40 + dy + Math.sin(tt * .9) * 3), f = Math.floor(tt * 4) % 2;
      px(g, gx - 2, gy - f, '#c8c4e0'); px(g, gx - 1, gy, '#c8c4e0'); px(g, gx, gy + (f ? 0 : 1), '#c8c4e0'); px(g, gx + 1, gy, '#c8c4e0'); px(g, gx + 2, gy - f, '#c8c4e0'); }
    // a fine, slow wheel with gold bulbs; one gondola lit per session today
    const wx = 122 + ox, wy = 56 + dy, R = 30, ang = tt * .1;
    for (let i = 0; i < 12; i++) { const a = ang + i * TAU / 12; ln(g, wx, wy, wx + Math.cos(a) * (R - 1), wy + Math.sin(a) * (R - 1), '#2a2858'); }
    g.fillStyle = '#4a4680'; for (let i = 0; i < 190; i++) { const a = i / 190 * TAU; g.fillRect(Math.round(wx + Math.cos(a) * R), Math.round(wy + Math.sin(a) * R), 1, 1); }
    g.fillStyle = '#2a2858'; for (let i = 0; i < 160; i++) { const a = i / 160 * TAU; g.fillRect(Math.round(wx + Math.cos(a) * (R - 3)), Math.round(wy + Math.sin(a) * (R - 3)), 1, 1); }
    px(g, wx - 1, wy - 1, '#7a74a8', 3, 3);
    for (let i = 0; i < 16; i++) { const a = ang + i / 16 * TAU, x = Math.round(wx + Math.cos(a) * R), y = Math.round(wy + Math.sin(a) * R);
      let lit = st.rest ? ((i + step) % 4 === 0 ? 1 : .6) : .5; if (st.end > 0) lit = Math.floor(st.endT * 6) % 2 ? 1 : .35;
      g.globalAlpha = lit; px(g, x, y, '#ffd98a'); g.globalAlpha = lit * .25; px(g, x - 1, y, '#ffd98a', 3, 1); px(g, x, y - 1, '#ffd98a', 1, 3); }
    g.globalAlpha = 1;
    for (let i = 0; i < 8; i++) { const a = ang + i / 8 * TAU + Math.PI / 8, x = Math.round(wx + Math.cos(a) * R), y = Math.round(wy + Math.sin(a) * R), lit = i < st.n;
      px(g, x, y, '#3e3a6a', 1, 2); px(g, x - 2, y + 2, '#1e1c3c', 5, 4); px(g, x - 1, y + 3, lit ? '#ffcf5a' : '#2a2850', 3, 1);
      if (lit) { g.globalAlpha = .22; px(g, x - 3, y + 1, '#ffcf5a', 7, 6); g.globalAlpha = 1; } }
    const posts = [100, 114, 128, 142, 156].map(x => x + ox);
    posts.forEach(x => px(g, x, Y(89), '#34345e', 1, 6));
    let b = 0;
    for (let j = 0; j < posts.length - 1; j++) for (let x = posts[j] + 2; x < posts[j + 1] - 1; x += 3) { const s = (x - posts[j]) / 14, y = Math.round(Y(89) + Math.sin(s * Math.PI) * 3);
      let lit = st.rest ? ((b + step) % 5 === 0 ? 1 : .85) : .55; if (st.end > 0) lit = (b + Math.floor(st.endT * 8)) % 2 ? 1 : .3;
      g.globalAlpha = lit; px(g, x, y, b % 4 === 3 ? '#ff9ab0' : '#ffd98a'); b++; }
    for (let k = 0; k <= 8; k++) { const a = Math.PI + k / 8 * Math.PI;
      g.globalAlpha = st.end > 0 ? ((k + Math.floor(st.endT * 10)) % 2 ? 1 : .3) : st.rest ? ((k + step) % 3 === 0 ? 1 : .65) : .6; px(g, 193 + ox + Math.cos(a) * 8, Y(84) + Math.sin(a) * 6, '#ffe08a'); }
    [168, 179, 208, 219].forEach((x, i) => { const cc = ['#7ad0ff', '#ff9ab0', '#b4ffa0', '#ffe08a'][(Math.floor(tt * .8) + i) % 4];
      g.globalAlpha = st.rest ? .9 : .5; px(g, x + ox, Y(87), cc); g.globalAlpha = .22; px(g, x + ox - 1, Y(86), cc, 3, 3); });
    g.globalAlpha = 1;
    for (let x = 94 + ox; x < w; x += 8) { if (Math.floor(tt * 3 + x * .37) % 3 === 0) continue; g.globalAlpha = .45; px(g, x - 1, Y(123), '#6a6cb0', 4, 1); }
    for (const [x0, cc] of [[168, '#f0a85a'], [179, '#f0a85a'], [193, '#f09a48'], [208, '#f0a85a'], [219, '#f0a85a'], [122, '#ffd98a'], [114, '#ffd98a'], [142, '#ffd98a']]) { const x = x0 + ox;
      for (let y = Y(126); y < h; y += 2) { const k = (y - Y(126)) / Math.max(1, h - Y(126)); if (Math.sin(y * 1.3 + tt * 2.5 + x) < -.2) continue;
        g.globalAlpha = (.45 - k * .35) * (1 - .45 * fk); px(g, x - 1 + Math.round(Math.sin(y * .6 + tt * 2 + x * .1) * (1 + k * 2)), y, cc, 3, 1); } }
    g.globalAlpha = 1;
    if (fk > .01) for (let y = HZ - 10; y < HZ + 16; y++) { const a = .17 * fk * (1 - Math.abs(y - HZ - 3) / 13); for (let x = 0; x < w; x += 6) { const ww = Math.sin(x * .05 + tt * .6 + y * .3); if (ww < 0) continue; g.globalAlpha = a * ww; px(g, x, y, '#9a96cc', 6, 1); } }
    g.globalAlpha = 1;
    if (st.end > 0) for (const [x0, y0, d] of [[60, 30, 0], [150, 22, .7], [100, 40, 1.4], [205, 30, 2.1]]) {
      const x = Math.round(x0 * w / 240), y = y0 + dy, ph = ((st.endT + d) % 2.8) / 1.6; if (ph > 1) continue; const rr = ph * 16, cc = ['#ffd98a', '#fff2c8', '#ff9ab0', '#ffd98a'][(x0 + y0) % 4];
      for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, fx = Math.round(x + Math.cos(a) * rr), fy = Math.round(y + Math.sin(a) * rr + ph * ph * 6);
        g.globalAlpha = (1 - ph * .8) * st.end; px(g, fx, fy, cc); if (ph > .2) { g.globalAlpha = (1 - ph) * .5 * st.end; px(g, Math.round(x + Math.cos(a) * rr * .7), Math.round(y + Math.sin(a) * rr * .7 + ph * ph * 4), cc); }
        const ry = 2 * HZ - fy + 8; if (ry < h && ry > HZ + 1) { g.globalAlpha = (1 - ph) * .3 * st.end; px(g, fx, ry, cc); } }
      if (ph < .15) { g.globalAlpha = st.end; px(g, x - 1, y - 1, '#ffffff', 3, 3); } }
    g.globalAlpha = 1;
  }

  /* ---------- G2 · the orbit (shop). The planet keeps to the bottom-right corner ---------- */
  function buildOrbit(w, h) {
    const o = img(w, h), r = rng(23), n = vnoise(5), n2 = vnoise(9), n3 = vnoise(17), dy = h - 150, OCX = w - 48, OCY = h - 22, OR = 58, CT = Math.cos(-.2), ST = Math.sin(-.2);
    const pal = ['#04050d', '#0a0a22', '#171038', '#2e1450', '#521c5e', '#86306a', '#c45272', '#f08a7e'].map(C);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const band = Math.exp(-Math.pow((y - dy * .5 - (x * .5 - 6)) / 36, 2));
      let v = n(x / 42, y / 42) * 1.3 * band - .14 + (n2(x / 9, y / 9) - .5) * .18 * band - Math.max(0, n3(x / 15, y / 15) - .55) * 1.8 * band;
      v = Math.max(0, Math.min(.999, v)); const tt = v * (pal.length - 1), b = Math.floor(tt); o.set(x, y, dth(x & 255, y & 255, tt - b) ? pal[Math.min(pal.length - 1, b + 1)] : pal[b]); }
    for (let i = 0; i < 170 * w * h / 36000; i++) { const x = r() * w | 0, y = r() * h | 0, k = r(); o.set(x, y, C(k < .15 ? '#fff4dc' : k < .5 ? '#8a90c8' : '#4a4e80'));
      if (k < .03) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => o.set(x + a, y + b, C('#6a70a8'))); }
    for (let i = 0; i < 90; i++) { const gx = (r() + r() + r() - 1.5) * 1.4, gy = (r() + r() + r() - 1.5) * 1.4; o.set(74 + gx * 16, 56 + dy * .5 + gy * 12, C(r() < .3 ? '#fff4dc' : '#b8bce8')); }
    const shade = (nx, ny, L) => { const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)); return nx * L[0] + ny * L[1] + nz * L[2]; };
    const Lm = [-.75, -.35, .56], mx = 52, my = Math.round(38 + dy * .3);
    for (let y = my - 8; y <= my + 8; y++) for (let x = mx - 8; x <= mx + 8; x++) { const nx = (x - mx) / 8, ny = (y - my) / 8; if (nx * nx + ny * ny > 1) continue; const d = shade(nx, ny, Lm);
      o.set(x, y, C(d > .6 ? '#e6e2ee' : d > .3 ? (dth(x & 255, y & 255, (d - .3) / .3) ? '#e6e2ee' : '#aaa6c0') : d > .05 ? '#6a6888' : '#1a1a30')); }
    [[-3, -3], [-2, -3], [1, 3], [-5, 1]].forEach(([a, b]) => o.set(mx + a, my + b, C('#8e8aa6')));
    const fx0 = w - 26, fy0 = Math.round(24 + dy * .3);
    for (let y = fy0 - 6; y <= fy0 + 6; y++) for (let x = fx0 - 6; x <= fx0 + 6; x++) { const nx = (x - fx0) / 5.5, ny = (y - fy0) / 5.5; if (nx * nx + ny * ny > 1) continue; const d = shade(nx, ny, Lm);
      o.set(x, y, C(d > .55 ? '#f0a080' : d > .25 ? '#c0604a' : d > 0 ? '#7a3028' : '#2a0e14')); }
    const L = [-.62, -.5, .6], inPlanet = (x, y) => Math.hypot(x - OCX, y - OCY) < OR;
    const ring = (x, y) => { const ddx = x - OCX, ddy = y - OCY, u = ddx * CT + ddy * ST, v = -ddx * ST + ddy * CT; return { rr: Math.hypot(u, v * 5.2), front: v > 0 }; };
    const ringCol = rr => (rr < 70 || rr > 96 || (rr > 80 && rr < 83) || (rr > 91 && rr < 92)) ? null : C(rr < 76 ? '#8a6a4c' : rr < 80 ? '#c49a68' : rr < 88 ? '#e0bc84' : '#a8845c');
    const inShadow = (x, y) => { for (let k = 4; k < 90; k += 3) if (inPlanet(x - .7 * k, y - .56 * k)) return true; return false; };
    const rings = front => { for (let y = OCY - 34; y < h; y++) for (let x = OCX - 100; x < w; x++) { const gg = ring(x, y); if (gg.front !== front) continue; let c = ringCol(gg.rr); if (!c) continue;
      if (!(front && inPlanet(x, y)) && inShadow(x, y)) c = mix(c, C('#05060f'), .72); o.set(x, y, c); } };
    rings(false);
    for (let y = OCY - OR - 4; y < h; y++) for (let x = OCX - OR - 4; x < w; x++) { const ddx = x - OCX, ddy = y - OCY, d = Math.hypot(ddx, ddy);
      if (d >= OR && d < OR + 4 && (-ddx * .62 - ddy * .5) / d > .1 && dth(x & 255, y & 255, (OR + 4 - d) / 4 * .6)) o.set(x, y, C('#2c5a8a')); }
    const A = ['#0e2348', '#1d4a84', '#3a7cb8', '#8cc8e8'].map(C), Bf = ['#0b1d3c', '#163c6c', '#2c6498', '#64a8d4'].map(C), P = ['#16304e', '#3a6a94', '#7aaccc', '#d0eaf4'].map(C);
    for (let y = OCY - OR; y < h; y++) for (let x = OCX - OR; x < w; x++) { const nx = (x - OCX) / OR, ny = (y - OCY) / OR, rr = nx * nx + ny * ny; if (rr > 1) continue;
      const d = shade(nx, ny, L), lat = ny + .16 * (n(x / 16, y / 7) - .5) + .05 * Math.sin(nx * 9 + ny * 22), bv = (Math.sin(lat * 15) + 1) / 2, fam = bv > .78 ? P : bv > .42 ? A : Bf;
      let s = Math.min(.999, d * 1.15 + .1) * 3; const rs = ring(x + 7, y + 6); if (ringCol(rs.rr) && rs.front) s -= 1.4;
      let c; if (d < -.05) c = dth(x & 255, y & 255, Math.max(0, (d + .2) / .15)) ? fam[0] : C('#050816');
      else { s = Math.max(0, s); const b = Math.floor(s); c = dth(x & 255, y & 255, s - b) ? fam[Math.min(3, b + 1)] : fam[b]; }
      if (rr > .93 && d > -.1) c = C('#7fd8f0'); o.set(x, y, c); }
    for (let y = -3; y <= 3; y++) for (let x = -7; x <= 7; x++) { const e = x * x / 49 + y * y / 9; if (e <= 1) o.set(OCX - 22 + x, OCY - 30 + y, C(e > .6 ? '#e8f4fa' : e > .25 ? '#a8d4ea' : '#5a8ab0')); }
    rings(true);
    return { G: { w, h, dy, OCX, OCY, OR, CT, ST, tw: Array.from({ length: 26 * w / 240 | 0 }, (_, i) => [r() * w * .65 | 0, r() * h * .75 | 0, r() * 6]) }, c: o.done() };
  }
  const ROCKS = []; // asteroids, painted on first use
  function rocks() {
    if (ROCKS.length) return ROCKS; const r = rng(57);
    for (let i = 0; i < 7; i++) { const rr = 1.5 + r() * 3.2, c = img(12, 12), L = [-.7, -.5, .5];
      for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const ddx = (x - 6) / rr, ddy = (y - 6) / rr, wob = 1 + .25 * Math.sin(Math.atan2(ddy, ddx) * 3 + i), d2 = ddx * ddx + ddy * ddy; if (d2 > wob * wob) continue;
        const nz = Math.sqrt(Math.max(0, 1 - d2 / (wob * wob))), d = (ddx * L[0] + ddy * L[1]) / wob + nz * L[2]; c.set(x, y, C(d > .6 ? '#a89c94' : d > .3 ? '#6e6460' : d > 0 ? '#423a3a' : '#1e1a20')); }
      ROCKS.push({ c: c.done(), x: r() * 260, y: .1 + r() * .8, v: .5 + r() * .8 }); }
    return ROCKS;
  }
  function drawOrbit(g, B, tt, st) {
    const { G, c } = B, { w, h, OCX, OCY, OR, CT, ST } = G, fk = st.fk;
    g.drawImage(c, 0, 0);
    if (fk > .01) { g.fillStyle = `rgba(4,5,13,${(.45 * fk).toFixed(3)})`; g.fillRect(0, 0, w, h); }
    for (const [x, y, p] of G.tw) { const a = (Math.sin(tt * 1.6 + p * 3) + 1) / 2; g.globalAlpha = a * (1 - .6 * fk); px(g, x, y, '#fff4dc'); if (a > .85) { g.globalAlpha = .4; px(g, x - 1, y, '#fff4dc', 3, 1); px(g, x, y - 1, '#fff4dc', 1, 3); } }
    g.globalAlpha = 1;
    const sx = Math.round(w * .41 + Math.sin(tt * .05) * 6), sy = h - 68, ra = tt * .8;
    const ringHalf = front => { for (let a = 0; a < TAU; a += .08) { const v = Math.sin(a); if ((v > 0) !== front) continue; px(g, sx + Math.cos(a) * 10, sy + v * 3, front ? '#a8acc4' : '#4a4e68'); } };
    ringHalf(false); px(g, sx, sy - 9, '#6a6e88', 1, 9); px(g, sx - 5, sy - 11, '#22407a', 4, 3); px(g, sx + 2, sy - 11, '#22407a', 4, 3); px(g, sx - 4, sy - 10, '#4a7ac0'); px(g, sx + 4, sy - 10, '#4a7ac0');
    px(g, sx - 2, sy - 1, '#8a8ea8', 5, 3); px(g, sx - 1, sy - 1, '#c8ccd8', 2, 1); ringHalf(true);
    px(g, sx + Math.cos(ra) * 10, sy + Math.sin(ra) * 3, '#ffc46b'); if (Math.floor(tt * 2) % 2) px(g, sx, sy - 10, '#ff5a5a');
    for (const k of rocks()) g.drawImage(k.c, Math.round(((k.x - tt * k.v * 3) % (w + 40) + w + 40) % (w + 40) - 26), Math.round(k.y * h - 6));
    for (let i = 0; i < st.n; i++) { const a = tt * .3 + i * TAU / Math.max(1, st.n), u = Math.cos(a) * 102, v = Math.sin(a) * 102 / 5.2, x = OCX + u * CT - v * ST, y = OCY + u * ST + v * CT;
      if (v < 0 && Math.hypot(x - OCX, y - OCY) < OR) continue; const fl = st.end > 0 && Math.floor(st.endT * 6 + i) % 2;
      px(g, x - 2, y, '#4a7ac0'); px(g, x + 2, y, '#4a7ac0'); px(g, x - 1, y, '#d8dce8', 3, 1); if (Math.floor(tt * 1.5 + i) % 2 || fl) px(g, x, y - 1, fl ? '#ffffff' : '#ffc46b'); }
    if (st.rest && !(st.end > 0)) { const ph = (tt % 9) / 2.6; if (ph < 1) { const hx0 = 10 + ph * w * .62, hy = 8 + ph * 36;
      for (let k = 0; k < 14; k++) { g.globalAlpha = (1 - k / 14) * .8; px(g, hx0 - k * 2.4, hy - k * .58, k ? '#9fdcff' : '#ffffff'); } g.globalAlpha = 1; } }
    if (st.end > 0) for (let a = -2.5; a < -.9; a += .025) { const bx = OCX + Math.cos(a) * (OR - 1), by = OCY + Math.sin(a) * (OR - 1), hh = 4 + Math.round(4 * (Math.sin(a * 14 + st.endT * 3) + 1) / 2);
      for (let k = 0; k < hh; k++) { g.globalAlpha = (1 - k / hh) * (.5 + .3 * Math.sin(st.endT * 2 + a * 9)) * st.end; px(g, bx + Math.cos(a) * k * .6, by + Math.sin(a) * k, k < hh / 2 ? '#7affc0' : '#4ae0d0'); } }
    g.globalAlpha = 1;
  }

  const SCENES = { valley: [buildValley, drawValley], pier: [buildPier, drawPier], orbit: [buildOrbit, drawOrbit] };
  // pixel size: about 150 rows on a landscape screen, never under 160 columns, 2 to 8 screen pixels per pixel
  const pixOf = (W, H) => Math.max(2, Math.min(8, Math.round(Math.min(H / 150, W / 160))));

  /* ---------- the background, called first in game.js's arcade branch ---------- */
  let lo = null, lg = null, built = null, bKey = '', pend = '', pendAt = 0, fk = 0, endAt = -1e9;
  on('session', s => { if (s && s.mins >= 1 && !ML.reducedMotion()) endAt = performance.now(); });
  ML.arcadeEnd = () => { endAt = performance.now(); dialEnd(); }; // test hook
  ML.arcadeDraw = (cx, W, H, slow, still, now, tm, rest) => {
    if (!(W > 0 && H > 0)) return true;
    const set = setOf(), s = pixOf(W, H), w = Math.ceil(W / s), h = Math.ceil(H / s), k = set + w + 'x' + h;
    if (k !== bKey) { if (k !== pend) { pend = k; pendAt = now; } if (!built || built.set !== set || now - pendAt > 350) { bKey = k; pend = ''; lo = canvas(w, h); lg = lo.getContext('2d'); built = SCENES[set][0](w, h); built.set = set; } }
    if (typeof cx === 'function') return true; // a skipped frame (game.js paints at ~30 fps)
    const target = root.dataset.timer === 'running' ? 1 : 0; fk = still ? target : fk + (target - fk) * .03;
    const eT = (now - endAt) / 1000, end = still || eT > 7 ? 0 : Math.min(1, (7 - eT) / 1.5);
    SCENES[built.set][1](lg, built, still ? 4.2 : tm / 1000, { fk, rest: rest && !still, n: Math.min(8, count()), end, endT: eT });
    const sc = W / lo.width;
    cx.save(); cx.imageSmoothingEnabled = false; cx.drawImage(lo, 0, 0, lo.width * sc, lo.height * sc); cx.restore();
    return true;
  };

  /* ---------- dials: a 128-pixel canvas over the shared ring (hidden in app.css), the time stays in .ring-center ---------- */
  const DS = 128, M = 64;
  const polar = (r, a) => [M + Math.cos(a) * r, M + Math.sin(a) * r];
  const minA = i => i / 60 * TAU - Math.PI / 2;
  function annulus(o, r0, r1, colFn) { for (let y = 0; y < DS; y++) for (let x = 0; x < DS; x++) { const d = Math.hypot(x + .5 - M, y + .5 - M); if (d >= r0 && d < r1) { const c = colFn(x, y, d, Math.atan2(y + .5 - M, x + .5 - M)); if (c) o.set(x, y, c); } } }
  const metal = ramp => (x, y, d, a) => { const s = (Math.cos(a + 3 * Math.PI / 4) + 1) / 2 * (ramp.length - 1), b = Math.floor(s); return dth(x, y, s - b) ? ramp[Math.min(ramp.length - 1, b + 1)] : ramp[b]; };
  function numerals(o, r, col, zero) { for (let k = 0; k < 12; k++) { const [x, y] = polar(r, minA(k * 5)); if (k === 0) zero(x, y); else text(o, String(k * 5), x, y, col); } }
  function tri(o, x, y, col) { for (let k = 0; k < 3; k++) for (let i = -2 + k; i <= 2 - k; i++) o.set(x + i, y - 1 + k, col); }

  // H · the 8-bit chronograph (default)
  function buildChrono() {
    const o = img(DS, DS), steel = ['#33374a', '#61667e', '#a2a7ba', '#e4e7f0'].map(C);
    const box = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) o.set(x, y, steel[x < x0 + 2 ? 3 : x > x0 + w - 3 ? 0 : y < y0 + 2 ? 2 : 1]); };
    box(44, 1, 8, 10); box(76, 1, 8, 10); box(44, 117, 8, 10); box(76, 117, 8, 10);
    const stub = (a, r0, r1, hw, knurl) => { for (let rr = r0; rr <= r1; rr += .5) for (let k = -hw; k <= hw; k += .5) { const x = M + Math.cos(a) * rr - Math.sin(a) * k, y = M + Math.sin(a) * rr + Math.cos(a) * k;
      o.set(x, y, knurl && Math.round(k) % 2 ? steel[0] : steel[k < -hw + 1 ? 3 : k > hw - 1 ? 0 : 2]); } };
    stub(-Math.PI / 6, 58, 64, 2.5); stub(Math.PI / 6, 58, 64, 2.5); stub(0, 58, 66, 3.5, true);
    annulus(o, 56.5, 62.5, metal(steel));
    annulus(o, 55.5, 56.5, () => C('#202336'));
    annulus(o, 47, 55.5, (x, y, d, a) => C(Math.cos(a + 3 * Math.PI / 4) < -.5 ? '#100c1c' : '#171226'));
    numerals(o, 51.4, C('#efe4c8'), (x, y) => tri(o, Math.round(x), Math.round(y), C('#ff4a3d')));
    annulus(o, 0, 47, (x, y, d, a) => C(Math.floor((a + Math.PI) * 24 / Math.PI) % 2 === 0 && dth(x, y, .25) && d < 40 ? '#160f26' : '#0e0a18'));
    annulus(o, 46, 47, () => C('#2a2242'));
    for (const cx of [44, 84]) for (let y = 78; y <= 102; y++) for (let x = cx - 12; x <= cx + 12; x++) { const d = Math.hypot(x - cx, y - 90); if (d <= 11.5) o.set(x, y, C(d > 10.5 ? '#3a3254' : d > 9.5 && dth(x, y, .5) ? '#1a1430' : '#08060f')); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2; o.set(84 + Math.cos(a) * 9, 90 + Math.sin(a) * 9, C(i % 3 ? '#4a4466' : '#8a84a8')); }
    return o.done();
  }
  function drawChrono(g, cache, d) {
    g.clearRect(0, 0, DS, DS); g.drawImage(cache, 0, 0); const p = d.p;
    for (let i = 0; i < 60; i++) { const a = minA(i), long = i % 5 === 0; let col = i / 60 < p ? '#3a3456' : '#efe4c8';
      if (d.end) { const wv = (Math.floor(d.endT * 40) - i + 6000) % 60; col = wv < 6 ? '#ffd36a' : wv < 9 ? '#c89a4a' : '#5a5478'; }
      const [x0, y0] = polar(long ? 40 : 43, a), [x1, y1] = polar(45, a); ln(g, x0, y0, x1, y1, col); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU - Math.PI / 2; px(g, 44 + Math.cos(a) * 8, 90 + Math.sin(a) * 8, i < d.n ? '#ff9466' : '#3a3254'); }
    const as = Math.min(8, d.n) / 8 * TAU - Math.PI / 2; ln(g, 44, 90, 44 + Math.cos(as) * 6, 90 + Math.sin(as) * 6, '#efe4c8');
    const ar = (d.started ? (Date.now() / 1000 % 60) / 60 : 0) * TAU - Math.PI / 2; ln(g, 84, 90, 84 + Math.cos(ar) * 8, 90 + Math.sin(ar) * 8, '#ff5a4a');
    px(g, 43, 89, '#c8ccd8', 3, 3); px(g, 83, 89, '#c8ccd8', 3, 3);
    const am = p * TAU - Math.PI / 2, [hx0, hy0] = polar(27, am), [hx1, hy1] = polar(45, am), [lx, ly] = polar(34, am);
    ln(g, hx0, hy0, hx1, hy1, '#ff4a3d'); px(g, Math.round(lx) - 1, Math.round(ly) - 1, '#ff4a3d', 3, 3); px(g, Math.round(lx), Math.round(ly), '#ffd0c8');
  }
  // I2 · the bulb dial (pier set): navy plate, brass, the current minute in rose
  function buildMarquee() {
    const o = img(DS, DS), ramp = ['#3a2c1a', '#6a5430', '#a8884e', '#e0c88a'].map(C);
    annulus(o, 57, 62.5, metal(ramp)); annulus(o, 56, 57, () => C('#0a0e1e'));
    annulus(o, 47, 56, (x, y, d, a) => C(Math.cos(a + 3 * Math.PI / 4) < -.4 ? '#101a3a' : '#16224a'));
    annulus(o, 46.2, 47, () => C('#a8884e'));
    annulus(o, 0, 46.2, (x, y) => C(((x >> 2) + (y >> 2)) % 2 === 0 && dth(x, y, .3) ? '#101a36' : '#0a1024'));
    numerals(o, 40.5, C('#f4e2c0'), (x, y) => { x = Math.round(x); y = Math.round(y); for (let k = -2; k <= 2; k++) { o.set(x + k, y, C('#ffd36a')); o.set(x, y + k, C('#ffd36a')); } o.set(x, y, C('#fff4c8')); });
    for (let i = 0; i < 60; i++) if (i % 5) { const [x, y] = polar(45, minA(i)); o.set(x, y, C('#3a4a7a')); }
    return o.done();
  }
  function drawMarquee(g, cache, d) {
    g.clearRect(0, 0, DS, DS); g.drawImage(cache, 0, 0); const p = d.p, step = Math.floor(Date.now() / 1000), cur = Math.min(59, Math.floor(p * 60));
    for (let i = 0; i < 60; i++) { const [fx, fy] = polar(51.5, minA(i)), x = Math.round(fx), y = Math.round(fy);
      let lit = i / 60 >= p, bright = 1;
      if (!d.started) bright = (i + step) % 5 === 0 ? 1 : .7;
      else if (i === cur && step % 2) lit = false;
      if (d.end) lit = (i + Math.floor(d.endT * 18)) % 6 < 3;
      const bc = d.started && !d.end && i === cur ? '#ff7d98' : '#ffc84a';
      if (lit) { g.globalAlpha = .22 * bright; px(g, x - 2, y - 2, bc, 5, 5); g.globalAlpha = bright; px(g, x - 1, y, bc, 3, 1); px(g, x, y - 1, bc, 1, 3); px(g, x, y, '#fff4c8'); g.globalAlpha = 1; }
      else { px(g, x - 1, y, '#1e2a52', 3, 1); px(g, x, y - 1, '#1e2a52', 1, 3); px(g, x, y, '#2a3866'); } }
    if (d.started || d.end) { const a = d.end ? minA(0) : p * TAU - Math.PI / 2, [tx, ty] = polar(44, a), [bx, by] = polar(31, a);
      ln(g, bx, by, tx, ty, '#ffd36a'); const [l1x, l1y] = polar(39, a - .08), [l2x, l2y] = polar(39, a + .08); ln(g, l1x, l1y, tx, ty, '#ffd36a'); ln(g, l2x, l2y, tx, ty, '#ffd36a'); }
  }
  // J · the orbit dial (orbit set): a moon goes round in one session
  function buildOrbitDial() {
    const o = img(DS, DS), steel = ['#26324e', '#3e4e74', '#6a7ca6', '#b8c6e4'].map(C), r = rng(41);
    annulus(o, 60, 62.5, metal(steel));
    annulus(o, 52, 60, (x, y, d, a) => C(Math.cos(a + 3 * Math.PI / 4) < -.4 ? '#111a32' : '#16203c'));
    numerals(o, 56, C('#e6eeff'), (x, y) => tri(o, Math.round(x), Math.round(y), C('#ffc46b')));
    annulus(o, 0, 52, () => C('#060918'));
    for (let i = 0; i < 60; i++) { const a = minA(i), [x0, y0] = polar(i % 5 ? 49.5 : 48, a), [x1, y1] = polar(51, a); o.line(x0, y0, x1, y1, C(i % 5 ? '#33416c' : '#6a7ab0')); }
    for (let i = 0; i < 60; i++) { const ang = r() * TAU, d = 8 + r() * 34; o.set(M + Math.cos(ang) * d, M + Math.sin(ang) * d, C(r() < .3 ? '#8a94c8' : '#2e3864')); }
    const cx = 64, cy = 95, R = 9, L = [-.6, -.55, .58], A = ['#0e2348', '#1d4a84', '#3a7cb8', '#8cc8e8'].map(C);
    const ringPx = front => { for (let a = 0; a < TAU; a += .01) { const v = Math.sin(a); if ((v > 0) !== front) continue; for (const rr of [14, 15]) o.set(cx + Math.cos(a) * rr, cy + v * rr * .22, C(rr === 14 ? '#c49a68' : '#8a6a4c')); } };
    ringPx(false);
    for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) { const nx = (x - cx) / R, ny = (y - cy) / R; if (nx * nx + ny * ny > 1) continue;
      const nz = Math.sqrt(1 - nx * nx - ny * ny), d = nx * L[0] + ny * L[1] + nz * L[2], band = Math.sin(ny * 9) > .3 ? 1 : 0;
      const s = Math.max(0, Math.min(.999, d * 1.1 + .1 - band * .12)) * 3, b = Math.floor(s); o.set(x, y, d < -.05 ? C('#050816') : dth(x, y, s - b) ? A[Math.min(3, b + 1)] : A[b]); }
    ringPx(true);
    for (let a = 0; a < TAU; a += TAU / 120) o.set(M + Math.cos(a) * 45, M + Math.sin(a) * 45, C('#22305a'));
    return o.done();
  }
  function drawOrbitDial(g, cache, d) {
    g.clearRect(0, 0, DS, DS); g.drawImage(cache, 0, 0); const p = d.end ? 1 : d.p, am = p * TAU - Math.PI / 2, tt = Date.now() / 1000;
    for (let a = -Math.PI / 2; a < am; a += .025) { const k = 1 - (am - a) / Math.max(.001, p * TAU); g.globalAlpha = .25 + .75 * k; const [x, y] = polar(45, a); px(g, x, y, '#ffc46b'); }
    g.globalAlpha = 1;
    const [mx, my] = polar(45, am), Lm = [-.6, -.6, .5];
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const nx = x / 3.6, ny = y / 3.6; if (nx * nx + ny * ny > 1) continue; const dd = nx * Lm[0] + ny * Lm[1] + Math.sqrt(1 - nx * nx - ny * ny) * Lm[2];
      px(g, mx + x, my + y, dd > .55 ? '#f2eef8' : dd > .2 ? '#b0acc8' : dd > -.1 ? '#6a6888' : '#2a2a44'); }
    if (d.end) { const k = 6 + Math.round(3 * Math.sin(d.endT * 6)); for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let i = 5; i < k; i++) { g.globalAlpha = 1 - (i - 5) / (k - 4); px(g, mx + ddx * i, my + ddy * i, '#fff4c8'); } g.globalAlpha = 1; }
    for (let i = 0; i < 9; i++) { const a = tt * .15 + i / 9 * TAU, v = Math.sin(a), x = 64 + Math.cos(a) * 18, y = 95 + v * 6;
      if (v < 0 && Math.hypot(x - 64, y - 95) < 9) continue; const fl = d.end && Math.floor(d.endT * 6 + i) % 2;
      px(g, x, y, fl ? '#ffffff' : i < d.n ? '#ffc46b' : '#2a3a66'); }
  }
  const DIALS = { valley: [buildChrono, drawChrono], pier: [buildMarquee, drawMarquee], orbit: [buildOrbitDial, drawOrbitDial] };

  const dc = canvas(DS, DS), dg = dc.getContext('2d');
  dc.className = 'arc-dial'; dc.setAttribute('aria-hidden', 'true');
  const dCaches = {};
  let dEndAt = -1e9, dRaf = 0;
  const progress = () => { const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot, started = rem < tot - .5 || (ML.running && ML.running());
    return { started, p: started ? Math.max(0, Math.min(1, 1 - Math.max(0, rem) / tot)) : 0 }; };
  function renderDial() {
    const wrap = document.querySelector('#sigil-card .ring-wrap');
    if (!isOn() || !wrap) { if (dc.isConnected) dc.remove(); return; }
    if (dc.parentNode !== wrap) wrap.prepend(dc);
    const set = setOf(), def = DIALS[set]; if (!dCaches[set]) dCaches[set] = def[0]();
    const eT = (performance.now() - dEndAt) / 1000, end = eT < 2.6, pr = progress();
    def[1](dg, dCaches[set], { p: pr.p, started: pr.started, n: count(), end, endT: eT });
  }
  function dialEnd() {
    if (ML.reducedMotion()) return; dEndAt = performance.now(); cancelAnimationFrame(dRaf);
    const loop = () => { renderDial(); if ((performance.now() - dEndAt) / 1000 < 2.7) dRaf = requestAnimationFrame(loop); else renderDial(); };
    dRaf = requestAnimationFrame(loop);
  }
  on('session', s => { nAt = -1e9; if (s && s.mins >= 1) dialEnd(); });
  on('tick', renderDial); on('timer', renderDial); on('render', renderDial); on('started', renderDial); on('newday', renderDial); on('saved', renderDial);
  new MutationObserver(() => { syncPal(); renderDial(); }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light'] });

  /* ---------- L · full screen « sunset » (valley set): registered for focusplus.js ---------- */
  const prevStyle = ML.deepWorldStyle;
  ML.deepWorldStyle = k => k === 'arcade' ? (setOf() === 'valley' ? 'sunset' : null) : (prevStyle ? prevStyle(k) : null);
  let F = null, fRaf = 0, fLast = 0, fCtx = null, fEndAt = -1e9;
  function fsBuild(w, h) {
    const HZ = h - 46, sky = cols => { const o = img(w, h); o.grad(0, HZ, cols.map(C)); return o.done(); }, o = img(w, h), r = rng(77);
    const f1 = x => HZ - 22 + 8 * Math.sin(x * .03 + 2) + 5 * Math.sin(x * .08) + 2 * Math.sin(x * .21);
    for (let x = 0; x < w; x++) { const tp = Math.round(f1(x)); for (let y = tp; y < HZ; y++) o.set(x, y, C(y - tp < 2 && tp < HZ - 26 ? '#b98aa8' : '#3e1c4c')); }
    const f2 = x => HZ - 8 + 3 * Math.sin(x * .05 + 1) + 1.5 * Math.sin(x * .19);
    for (let x = 0; x < w; x++) for (let y = Math.round(f2(x)); y < HZ; y++) o.set(x, y, C('#24103a'));
    for (let x0 = 0; x0 < w; x0 += 2 + (r() * 3 | 0)) { const hh = 3 + (r() * 5 | 0), b = Math.round(f2(x0)); for (let k = 0; k < hh; k++) { const hw = Math.floor(k / 2.6); for (let x = x0 - hw; x <= x0 + hw; x++) o.set(x, b - hh + k, C('#24103a')); } }
    for (let y = HZ; y < h - 18; y++) for (let x = 0; x < w; x++) o.set(x, y, C((y - HZ) % 4 === 1 && r() < .3 ? '#2e1a46' : '#1a0f30'));
    for (let x = 0; x < w; x++) { const tp = Math.round(h - 19 + 2 * Math.sin(x * .05)); for (let y = tp; y < h; y++) o.set(x, y, C(y === tp ? '#2e1638' : '#120820')); }
    return { w, h, HZ, dusk: sky(['#2a1446', '#481c56', '#72285c', '#a63e5c', '#d9665a', '#f39a62', '#fcc679']), night: sky(['#06061a', '#0c0a26', '#160e34', '#22123e', '#2e1646', '#3a1a4c', '#4a2052']), land: o.done(),
      stars: Array.from({ length: Math.round(w * HZ / 300) }, () => [r() * w | 0, r() * HZ * .8 | 0, r() * 6]) };
  }
  function fsPaint() {
    const cv = document.getElementById('as-cv'); if (!cv || !fCtx) { F = null; return false; }
    const W = cv.clientWidth, H = cv.clientHeight; if (!(W > 0 && H > 0)) return true;
    const s = pixOf(W, H), w = Math.ceil(W / s), h = Math.ceil(H / s);
    if (!F || F.w !== w || F.h !== h) { F = fsBuild(w, h); cv.width = w; cv.height = h; }
    const g = cv.getContext('2d'), still = ML.reducedMotion(), tt = still ? 4.2 : performance.now() / 1000, { HZ } = F, k = fCtx;
    const eT = (performance.now() - fEndAt) / 1000, ending = k.done && !still && eT < 7;
    const p = k.done ? 1 : k.p, sx = Math.round(w * .78), sr = Math.max(10, Math.round(h * .09)), sy = Math.round(HZ * .38 + p * (HZ * .62 + sr * .4));
    g.drawImage(F.dusk, 0, 0); g.globalAlpha = Math.min(1, p * 1.1); g.drawImage(F.night, 0, 0); g.globalAlpha = 1;
    for (const [x, y, ph] of F.stars) { const a = Math.max(0, p - .3) * 1.6 * (.6 + .4 * Math.sin(tt * 1.5 + ph * 3)); if (a > 0) { g.globalAlpha = Math.min(1, a); px(g, x, y, '#fff1dc'); } }
    g.globalAlpha = 1;
    const cuts = [3, 6, 7, 10, 11].map(v => Math.round(v * sr / 14));
    for (let y = -sr; y <= sr; y++) { if (y > 0 && cuts.includes(y)) continue; const ww = Math.floor(Math.sqrt(sr * sr - y * y)); px(g, sx - ww, sy + y, y < -sr * .3 ? '#fff1c0' : y < sr * .3 ? '#ffd590' : '#ffb06a', 2 * ww + 1, 1); }
    g.drawImage(F.land, 0, 0);
    const kk = Math.max(0, 1 - p * 1.2);
    for (let y = HZ + 2; y < h - 20; y += 2) { if (Math.sin(y * 1.9 + tt * 2) < -.3) continue; const ww = Math.max(2, Math.round(sr * .85 - (y - HZ) * .25)); g.globalAlpha = .55 * kk; px(g, sx - (ww >> 1) + Math.round(Math.sin(y + tt * 2)), y, '#ffc880', ww, 1); }
    g.globalAlpha = 1;
    const nL = Math.max(4, Math.min(8, Math.floor(w / 36)));
    for (let i = 0; i < nL; i++) { const x = Math.round((i + .5) * w / nL), y = h - 19 + Math.round(2 * Math.sin(x * .05)), lit = i < k.n;
      px(g, x, y - 6, '#3a2236', 1, 6); px(g, x - 1, y - 8, lit ? '#ffcf6a' : '#3a2a3a', 2, 2); if (lit) { g.globalAlpha = .25; px(g, x - 3, y - 10, '#ffcf6a', 6, 6); g.globalAlpha = 1; } }
    const port = h > w, kz = Math.max(2, Math.floor(Math.min(w * .7 / (k.clock.length * 4), h * (port ? .08 : .14) / 5))), ty = Math.round(h * (port ? .2 : .14));
    big(g, k.clock, w / 2, ty, kz, k.paused ? '#c4abc8' : '#fff3e0', '#5a2050');
    const task = document.getElementById('as-task'); if (task) task.style.top = Math.round((ty + 5 * kz + 4) * H / h) + 'px';
    if (ending) for (let i = 0; i < 9; i++) { const ph = (eT * .22 + i / 9) % 1, x = (i + .5) * w / 9 + Math.sin(ph * 8 + i) * 3, y = h - 22 - ph * (h - 30);
      g.globalAlpha = 1 - ph * .7; px(g, x, y, '#ffe0a0', 2, 1); px(g, x, y + 1, '#ffb84a', 2, 2); g.globalAlpha = (1 - ph) * .25; px(g, x - 2, y - 2, '#ffb84a', 6, 6); }
    g.globalAlpha = 1;
    return true;
  }
  function fsLoop(ts) { if (ts - fLast > 80) { fLast = ts; if (!fsPaint()) { fRaf = 0; return; } } fRaf = requestAnimationFrame(fsLoop); }
  ML.deepStyles = Object.assign(ML.deepStyles || {}, {
    sunset: {
      html: (top, dock) => `<canvas id="as-cv" aria-hidden="true"></canvas>${top}<p id="as-task"></p>${dock}`,
      render: ({ rem, run, done, title }) => {
        const tot = S.total || 1, p = done ? 1 : Math.max(0, Math.min(1, 1 - Math.max(0, rem) / tot)), n = count();
        if (done && !(fCtx && fCtx.done)) fEndAt = performance.now();
        fCtx = { p, done, n: Math.min(8, n), paused: !run && !done && p > 0, clock: MiniView.fmtClock(done ? 0 : rem) };
        const el = document.getElementById('as-task'); if (el) el.textContent = title || '';
        if (!fRaf) fRaf = requestAnimationFrame(fsLoop);
        if (ML.reducedMotion()) fsPaint();
      },
      doneMs: () => ML.reducedMotion() ? 4200 : 6000,
    },
  });

  /* ---------- shop pictures (painted once, at rest) ---------- */
  const pics = {};
  ML.arcadeShopPic = k => {
    if (!pics[k]) { try {
      const c = canvas(240, 150), g = c.getContext('2d');
      if (SCENES[k]) { const b = SCENES[k][0](240, 150); SCENES[k][1](g, b, 4.2, { fk: 0, rest: false, n: 3, end: 0, endT: 99 }); }
      else { // palettes: a small panel in the palette's colours
        const P = k === 'redcream' ? ['#131114', '#1c191e', '#3e383f', '#f4e8cf', '#ff4a3d'] : ['#150d20', '#20152d', '#47305c', '#fbe9dc', '#ff9466'];
        px(g, 0, 0, P[0], 240, 150); px(g, 40, 22, P[2], 160, 106); px(g, 43, 25, P[1], 154, 100);
        big(g, '25:00', 120, 44, 6, P[3], '#000000'); px(g, 70, 96, P[4], 100, 12); px(g, 70, 106, 'rgba(0,0,0,.3)', 100, 2);
        if (k !== 'redcream') { ['#ff9466', '#ffcf5a', '#ffb340'].forEach((col, i) => px(g, 176 - i * 10, 31, col, 8, 8)); }
      }
      pics[k] = c.toDataURL('image/png'); } catch (e) { return ''; } }
    return `<img class="arc-prev" src="${pics[k]}" alt="">`;
  };
})();
