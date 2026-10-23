// Washi (Drained, light, Premium), v2 of the skin: everything painted in ink.
// - Brush marks for the UI, drawn bristle by bristle on small canvases and handed to the CSS as --b-* images
//   (dry strokes, wet washes, brush circles), so they follow the ink colour picked in Settings.
// - The background scene, drawn into game.js's #fx canvas (ML.washiDraw): karst pillars in the mist, a far range,
//   the artist's red seal, mist that rises during focus, plum branches that grow and blossom on a pause or a break,
//   a big ensō painted around the timer as the session goes, one-stroke birds at rest, falling petals.
// - The session end: an ink drop that soaks into the paper under the digits (instead of the particle burst).
// - Deep focus (Peint): an ink ensō painted with the session around brush-written digits.
// Settings (S.washi): level 'sobre' | 'encre' | 'peint', ink 'indigo' | 'sumi' | 'mousse' | 'prune'.
(() => {
  'use strict';
  const { S, $, on, t, esc, save } = ML;

  ML.addStrings({
    fr: {
      set_washi: 'Washi', washi_hint: 'Le monde clair d’Épuisé : la brume monte pendant le focus, le prunier fleurit pendant les pauses.',
      washi_level: 'Intensité', wl_sobre: 'Sobre (papier et encre)', wl_encre: 'Encré (pinceau et brume)', wl_peint: 'Peint (paysage, prunier, ensō)',
      washi_ink: 'Encre', wi_sumi: 'Sumi (noir)', wi_indigo: 'Indigo', wi_mousse: 'Mousse (vert)', wi_prune: 'Prune',
    },
    en: {
      set_washi: 'Washi', washi_hint: 'Drained’s light world: the mist rises during focus, the plum tree blossoms on a pause.',
      washi_level: 'Intensity', wl_sobre: 'Plain (paper and ink)', wl_encre: 'Inked (brush and mist)', wl_peint: 'Painted (landscape, plum tree, ensō)',
      washi_ink: 'Ink', wi_sumi: 'Sumi (black)', wi_indigo: 'Indigo', wi_mousse: 'Moss (green)', wi_prune: 'Plum',
    },
  });
  ML.defaults(() => ({ washi: { level: 'peint', ink: 'indigo' } }));

  const root = document.documentElement;
  const INK = { sumi: '#24252B', indigo: '#2E3A8C', mousse: '#2F4F3E', prune: '#4F2D49' };
  const PAPER_RGB = '236,238,243';
  const isOn = () => root.dataset.theme === 'sanctuary' && !!root.dataset.light;
  ML.washiOn = isOn;
  const W_ = () => S.washi || { level: 'peint', ink: 'indigo' };
  const level = () => W_().level || 'peint', ink = () => INK[W_().ink] || INK.indigo;

  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let q = Math.imul(s ^ s >>> 15, 1 | s); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; };
  const mix = (a, b, k) => '#' + [16, 8, 0].map(s => Math.round(((parseInt(a.slice(1), 16) >> s) & 255) * k + ((parseInt(b.slice(1), 16) >> s) & 255) * (1 - k)).toString(16).padStart(2, '0')).join('');
  const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3);
  const mk = (w, h, d = 2) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * d)); c.height = Math.max(1, Math.round(h * d)); const g = c.getContext('2d'); g.scale(d, d); g.lineCap = 'round'; g.lineJoin = 'round'; return [c, g]; };

  /* ---------- Brush marks ---------- */
  // A dry stroke: each bristle is a thin line across the stroke; the outer ones start later and stop earlier (ragged
  // ends), and every bristle skips more often towards the tail (the white streaks of a brush running dry).
  function dryStroke(w, h, col, seed, o = {}) {
    const { dry = .6, taper = .38, dens = 1.5, alpha = [.62, .38], start = .5, flicks = 5 } = o;
    const [c, g] = mk(w, h), R = rng(seed), n = Math.max(14, Math.round(h * dens));
    g.strokeStyle = col;
    for (let i = 0; i < n; i++) {
      const p0 = (i + R() * .7) / n, e = Math.abs(p0 - .5) * 2;
      const xs = h * .06 + Math.pow(e, 1.7) * h * start + R() * h * .14, xe = w - h * .04 - Math.pow(e, 1.25) * w * taper * (.35 + R() * .65) - R() * w * .05;
      g.globalAlpha = alpha[0] + R() * alpha[1]; g.lineWidth = (h / n) * (1.35 + R() * .9);
      const ph = R() * 6.28; let drawing = true, first = true; g.beginPath();
      for (let x = xs; x <= xe; x += 3) {
        const p = x / w, y = h / 2 + (p0 - .5) * h * .84 * (1 - .22 * p) + Math.sin(p * 4 + ph) * h * .012;
        if (first) { g.moveTo(x, y); first = false; continue; }
        if (drawing && R() < dry * Math.pow(p, 2.6) * .32) { g.stroke(); g.beginPath(); drawing = false; } else if (!drawing && R() < .28) { g.moveTo(x, y); drawing = true; }
        if (drawing) g.lineTo(x, y);
      }
      g.stroke();
    }
    for (let k = 0; k < flicks; k++) { const y = h * (.25 + R() * .5); g.globalAlpha = .3 + R() * .35; g.lineWidth = .5 + R() * .7; g.beginPath(); g.moveTo(w * (.8 + R() * .08), y); g.quadraticCurveTo(w * .93, y + (R() - .5) * h * .1, w * (.95 + R() * .05), y + (R() - .5) * h * .18); g.stroke(); }
    return c;
  }
  // An open brush circle (the same bristles bent around an ellipse), thinning towards its end
  function dryRing(w, h, col, seed, o = {}) {
    const { th = .08, span = Math.PI * 1.86, a0 = -2.1, dry = .7, alpha = [.6, .4] } = o;
    const [c, g] = mk(w, h), R = rng(seed), T = th * Math.min(w, h), rx = w / 2 - T * .8, ry = h / 2 - T * .8, n = Math.max(7, Math.round(T * 1.4));
    g.strokeStyle = col;
    for (let i = 0; i < n; i++) {
      const p0 = (i + R() * .6) / n, e = Math.abs(p0 - .5) * 2, s0 = Math.pow(e, 1.4) * .06 + R() * .02, s1 = 1 - Math.pow(e, 1.1) * .22 * R() - R() * .04;
      g.globalAlpha = alpha[0] + R() * alpha[1]; g.lineWidth = (T / n) * (1.5 + R() * .8);
      const steps = Math.ceil(span * Math.max(rx, ry) / 2.5); let drawing = true, first = true; g.beginPath();
      for (let k = 0; k <= steps; k++) {
        const p = k / steps; if (p < s0 || p > s1) continue;
        const a = a0 + p * span, off = (p0 - .5) * T * (1.05 - .6 * p), x = w / 2 + Math.cos(a) * (rx + off), y = h / 2 + Math.sin(a) * (ry + off);
        if (first) { g.moveTo(x, y); first = false; continue; }
        if (drawing && R() < dry * Math.pow(p, 2.4) * .3) { g.stroke(); g.beginPath(); drawing = false; } else if (!drawing && R() < .3) { g.moveTo(x, y); drawing = true; }
        if (drawing) g.lineTo(x, y);
      }
      g.stroke();
    }
    return c;
  }
  // A wet stroke (lavis): one soft body with wobbling edges, pigment pooled on the rim, lighter mottling inside
  function wetStroke(w, h, col, seed, o = {}) {
    const { alpha = .85, taper = .35 } = o;
    const [c, g] = mk(w, h), R = rng(seed), N = 48, top = [], bot = [], ph = R() * 6;
    for (let i = 0; i <= N; i++) {
      const p = i / N, x = w * (.025 + .95 * p), th = h * .42 * (p < .07 ? Math.sqrt(p / .07) : 1) * (1 - taper * Math.pow(p, 2.2));
      top.push([x, h / 2 - th * (.9 + .1 * Math.sin(p * 17 + ph)) + (R() - .5) * h * .035]); bot.push([x, h / 2 + th * (.9 + .1 * Math.cos(p * 13 + ph)) + (R() - .5) * h * .035]);
    }
    g.beginPath(); g.moveTo(top[0][0], top[0][1]); top.forEach(q => g.lineTo(q[0], q[1])); for (let i = N; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]); g.closePath();
    g.filter = 'blur(.6px)'; g.fillStyle = rgba(col, alpha); g.fill(); g.strokeStyle = rgba(col, Math.min(1, alpha * 1.15)); g.lineWidth = 1.3; g.stroke();
    g.globalCompositeOperation = 'destination-out'; g.filter = 'blur(4px)';
    for (let k = 0; k < 9; k++) { g.fillStyle = `rgba(0,0,0,${.05 + R() * .09})`; g.beginPath(); g.ellipse(w * (.1 + R() * .8), h * (.35 + R() * .3), w * (.04 + R() * .08), h * (.1 + R() * .12), 0, 0, 6.29); g.fill(); }
    g.globalCompositeOperation = 'source-over'; g.filter = 'none';
    return c;
  }
  // The stroke under the active tab (the one the user liked), recoloured with the ink
  const tabSvg = c => `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 8' preserveAspectRatio='none'><path d='M1 4.6C18 2.4 40 2 62 2.6S92 3.4 99 2.8L98.6 4.4C88 5.4 70 6.4 48 6.6S12 6.6 2 6.8Z' fill='${encodeURIComponent(c)}' fill-opacity='.9'/></svg>")`;
  let uiKey = '';
  function paintUi() {
    const c = ink(); if (uiKey === c) return; uiKey = c;
    const soft = mix(c, '#9AA0AE', .66), set = (k, cv) => root.style.setProperty(k, `url(${cv.toDataURL()})`);
    root.style.setProperty('--b-tab', tabSvg(c));
    set('--b-slab', wetStroke(240, 40, soft, 21, { alpha: .9, taper: .3 }));
    set('--b-wash', wetStroke(240, 40, c, 101, { alpha: .09, taper: .15 }));
    set('--b-head', dryStroke(260, 10, c, 51, { dens: 2.4, alpha: [.55, .4], dry: .9, taper: .5, flicks: 2 }));
    set('--b-bar', dryStroke(300, 10, c, 61, { dens: 2.2, alpha: [.7, .3], dry: .45, taper: .08, flicks: 0 }));
    set('--b-track', dryStroke(300, 10, rgba(c, .16), 71, { dens: 2, alpha: [.6, .4], dry: .6, taper: .1, flicks: 0 }));
    set('--b-chk', dryRing(40, 40, c, 91, { th: .085, span: Math.PI * 2.02, a0: -1.2, dry: .3, alpha: [.5, .4] }));
  }
  function clearUi() { uiKey = ''; ['--b-tab', '--b-slab', '--b-wash', '--b-head', '--b-bar', '--b-track', '--b-chk'].forEach(k => root.style.removeProperty(k)); }

  /* ---------- The scene ---------- */
  let W = 0, H = 0, DPR = 1, sceneKey = '', land = null, branches = [], ensoImg = null, ensoR = 0, mists = [], petals = [], flock = null, nextFlock = 0;
  // Karst pillars as an ink wash: a body darkest at the crown and gone in the mist below, a shaded side, "axe-cut"
  // texture and long cracks, ledges, moss dots on the crown, a few pines leaning over the void.
  function pillar(g, R, col, cx, by, w, h, a) {
    const top = by - h, segs = 34, L = [], Rt = [], ph1 = R() * 6, ph2 = R() * 6, lean = (R() - .5) * w * .35, bulge = R() * 6;
    const step = q => Math.round(Math.sin(q * 6 + ph1) * 2) / 2 * .07;
    for (let i = 0; i <= segs; i++) {
      const q = i / segs, y = by - q * h, wid = w * (1 - .42 * q + step(q) + .12 * Math.sin(q * 4.5 + bulge)), xc = cx + lean * q;
      L.push([xc - wid / 2 + Math.sin(q * 17 + ph1) * w * .035 + (R() - .5) * w * .05, y]);
      Rt.push([xc + wid / 2 + Math.sin(q * 15 + ph2) * w * .035 + (R() - .5) * w * .05 + Math.round(Math.sin(q * 7 + ph2) * 1.5) / 1.5 * w * .05, y]);
    }
    const tl = L[segs], tr = Rt[segs];
    g.beginPath(); g.moveTo(L[0][0], L[0][1]); L.forEach(p => g.lineTo(p[0], p[1]));
    g.bezierCurveTo(tl[0] + w * .05, top - w * .16, tr[0] - w * .3, top - w * .2, tr[0], tr[1]);
    for (let i = segs; i >= 0; i--) g.lineTo(Rt[i][0], Rt[i][1]); g.closePath();
    const gr = g.createLinearGradient(0, top - w * .2, 0, by); gr.addColorStop(0, rgba(col, a * 1.05)); gr.addColorStop(.3, rgba(col, a * .62)); gr.addColorStop(.75, rgba(col, a * .2)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    const sg = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); sg.addColorStop(0, rgba(col, a * 1.1)); sg.addColorStop(.42, rgba(col, 0)); sg.addColorStop(1, rgba(col, 0));
    g.fillStyle = sg; g.fillRect(cx - w, top - w * .3, w * 2, h * .62);
    for (let k = 0; k < Math.round(w / 1.6); k++) {
      const q = Math.pow(R(), 1.6), y0 = top + q * h * .7, x = cx - w / 2 + (R() < .65 ? R() * w * .45 : R() * w), len = 6 + R() * 16;
      g.strokeStyle = rgba(col, a * (1 - q) * (1 + R() * 1.4)); g.lineWidth = .6 + R() * 1.6; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + len * .35, y0 + len); g.stroke();
    }
    for (let k = 0; k < Math.round(w / 9); k++) {
      const x = cx - w / 2 + R() * w, y0 = top + R() * h * .3, len = h * (.15 + R() * .35);
      g.strokeStyle = rgba(col, a * (.6 + R() * .7)); g.lineWidth = .5 + R() * .9; g.beginPath(); g.moveTo(x, y0);
      for (let y = y0; y < y0 + len; y += 5) g.lineTo(x + (R() - .5) * 2, y);
      g.stroke();
    }
    for (let i = Math.round(segs * .45); i < segs; i += 2) if (Math.abs(step(i / segs) - step((i - 1) / segs)) > .01) {
      g.strokeStyle = rgba(col, a * 1.4 * (i / segs)); g.lineWidth = 1.2; g.beginPath(); g.moveTo(L[i][0], L[i][1]); g.lineTo(L[i][0] + w * (.15 + R() * .2), L[i][1] + 3 + R() * 3); g.stroke();
    }
    g.restore();
    for (let i = segs; i > segs * .3; i--) {
      if (R() < .2) continue;
      g.strokeStyle = rgba(col, Math.min(.6, a * 2 * (i / segs))); g.lineWidth = .8 + R() * 1.2; g.beginPath(); g.moveTo(L[i][0], L[i][1]); g.lineTo(L[i - 1][0], L[i - 1][1]); g.stroke();
    }
    const pine = (x, y, s, ln) => {
      g.strokeStyle = rgba(col, Math.min(.75, a * 3)); g.fillStyle = g.strokeStyle; g.lineWidth = .9;
      g.beginPath(); g.moveTo(x, y + s * 1.3); g.quadraticCurveTo(x + ln * s * .4, y, x + ln * s * .8, y - s); g.stroke();
      for (let k = 0; k < 4; k++) { const yy = y - s + k * s * .5, xx = x + ln * s * (.8 - k * .2), ww = s * (.4 + k * .28); g.beginPath(); g.ellipse(xx, yy, ww, s * .2, ln * .15, 0, 6.29); g.fill(); }
    };
    const cw = tr[0] - tl[0];
    for (let k = 0; k < Math.round(cw * 1.4 + 10); k++) {
      const q = Math.pow(R(), 1.8), i = Math.max(0, segs - Math.round(q * segs * .35)), side = R() < .7 ? L : Rt, edge = side[i];
      const x = R() < .55 ? tl[0] + R() * cw : edge[0] + (side === L ? R() * w * .25 : -R() * w * .25), y = R() < .55 ? top - w * .04 + R() * w * .12 : edge[1];
      g.fillStyle = rgba(col, Math.min(.8, a * (2.4 + R() * 1.6) * (1 - q * .6))); g.beginPath(); g.ellipse(x, y, (.8 + R() * 1.8) * (W < 700 ? .8 : 1), .6 + R() * 1.1, R() * .6 - .3, 0, 6.29); g.fill();
    }
    const n = 2 + Math.floor(R() * 4); for (let k = 0; k < n; k++) pine(tl[0] + R() * cw, top - w * .05 + R() * w * .08, 2.6 + R() * 3.4, (R() - .5) * .6);
    for (let k = 0; k < 3; k++) { const i = Math.floor(segs * (.5 + R() * .4)), lft = R() < .5, p = (lft ? L : Rt)[i]; pine(p[0], p[1], 2 + R() * 2, lft ? -1 : 1); }
  }
  // The artist's seal: a worn red square with the Merlin hat cut out (the red of the page; replaces a sun)
  function seal(g, x, y, s) {
    g.save(); g.translate(x, y); g.rotate(-.04);
    g.fillStyle = 'rgba(200,50,60,.82)'; g.beginPath(); g.rect(-s / 2, -s / 2, s, s); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.lineWidth = s * .07; g.strokeStyle = '#000'; g.strokeRect(-s / 2 + s * .1, -s / 2 + s * .1, s * .8, s * .8);
    g.fillStyle = '#000'; g.beginPath(); g.moveTo(0, -s * .3); g.lineTo(s * .17, s * .14); g.lineTo(-s * .17, s * .14); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(0, s * .17, s * .3, s * .055, 0, 0, 6.29); g.fill();
    const R = rng(5); for (let k = 0; k < 26; k++) { g.beginPath(); g.arc((R() - .5) * s, (R() - .5) * s, R() * s * .03, 0, 6.29); g.fill(); }
    g.restore();
  }
  function buildLand() {
    land = null; if (level() === 'sobre') return;
    const col = ink(), [c, g] = mk(W, H, DPR), R = rng(7), peint = level() === 'peint';
    g.filter = 'blur(3px)'; g.beginPath(); g.moveTo(0, H); // a far, soft range on the horizon
    for (let x = 0; x <= W + 20; x += 20) { const p = x / W; g.lineTo(x, H * (.5 - .07 * Math.abs(Math.sin(p * 4.2 + 1)) - .045 * Math.sin(p * 11 + 2) - .02 * Math.sin(p * 27))); }
    g.lineTo(W, H); g.closePath();
    const rg = g.createLinearGradient(0, H * .4, 0, H * .62); rg.addColorStop(0, rgba(col, .07)); rg.addColorStop(1, rgba(col, 0)); g.fillStyle = rg; g.fill(); g.filter = 'none';
    // far → near: clusters of pillars (one tall needle, smaller ones at its foot), the far ones blurred by distance
    const layers = peint
      ? [{ base: .6, hmin: .1, hmax: .24, a: .08, cl: [.12, .38, .62, .9], w: [.022, .04], blur: 2.2 }, { base: .78, hmin: .16, hmax: .4, a: .15, cl: [.06, .3, .72, .95], w: [.03, .06], blur: .9 }, { base: 1, hmin: .3, hmax: .74, a: .3, cl: [.04, .97], w: [.045, .085], blur: 0 }]
      : [{ base: .72, hmin: .12, hmax: .26, a: .08, cl: [.1, .35, .66, .92], w: [.025, .045], blur: 1.6 }, { base: .96, hmin: .2, hmax: .42, a: .16, cl: [.05, .95], w: [.04, .07], blur: 0 }];
    for (const Ly of layers) {
      g.filter = Ly.blur ? `blur(${Ly.blur}px)` : 'none';
      for (const cxF of Ly.cl) {
        const n = 2 + Math.floor(R() * 3), spread = W * (.05 + R() * .05);
        const items = Array.from({ length: n }, (_, k) => ({ x: cxF * W + (R() - .5) * spread * 2, tall: k === 0 }));
        for (const it of items) {
          const w = W * (Ly.w[0] + R() * (Ly.w[1] - Ly.w[0])) * (W < 700 ? 1.6 : 1) * (it.tall ? 1 : .8);
          const h = H * (it.tall ? Ly.hmax * (.85 + R() * .2) : Ly.hmin * (.6 + R() * .5) + R() * (Ly.hmax - Ly.hmin) * .45);
          pillar(g, R, col, it.x, Ly.base * H, w, h, Ly.a);
        }
      }
      g.filter = 'none';
      const mg = g.createLinearGradient(0, Ly.base * H - H * .16, 0, Ly.base * H); // mist at the foot of each layer
      mg.addColorStop(0, `rgba(${PAPER_RGB},0)`); mg.addColorStop(1, `rgba(${PAPER_RGB},.92)`);
      g.fillStyle = mg; g.fillRect(0, Ly.base * H - H * .16, W, H * .16 + 2); g.fillStyle = `rgba(${PAPER_RGB},.92)`; g.fillRect(0, Ly.base * H, W, H);
    }
    if (peint) seal(g, W - Math.max(34, W * .035), H - Math.max(40, H * .07) - (root.classList.contains('mnav-on') ? 70 : 0), W < 700 ? 22 : 30);
    land = c;
  }

  // Plum limbs: dry-brush segments over a solid core, turning at sharp angles but keeping a heading, side twigs
  // at the elbows, flowers and buds sitting on the wood
  function limb(g, R, col, x0, y0, x1, y1, w0, w1) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, n = Math.max(3, Math.round(w0 * 1.3));
    g.fillStyle = col; g.globalAlpha = w0 > 4 ? .62 : .8; g.beginPath();
    g.moveTo(x0 + nx * w0 * .42, y0 + ny * w0 * .42); g.lineTo(x1 + nx * w1 * .42, y1 + ny * w1 * .42); g.lineTo(x1 - nx * w1 * .42, y1 - ny * w1 * .42); g.lineTo(x0 - nx * w0 * .42, y0 - ny * w0 * .42); g.closePath(); g.fill();
    g.strokeStyle = col;
    for (let i = 0; i < n; i++) {
      const q = (i + R() * .5) / n - .5, steps = Math.max(2, Math.round(L / 3)); let drawing = true; g.beginPath();
      g.globalAlpha = .5 + R() * .5; g.lineWidth = (w0 / n) * (1.5 + R() * .8);
      for (let k = 0; k <= steps; k++) {
        const p = k / steps, w = w0 + (w1 - w0) * p, off = q * w + Math.sin(p * 6 + i) * .35, x = x0 + dx * p + nx * off, y = y0 + dy * p + ny * off;
        if (k === 0) { g.moveTo(x, y); continue; }
        if (drawing && R() < .05 + .1 * Math.abs(q)) { g.stroke(); g.beginPath(); drawing = false; } else if (!drawing && R() < .5) { g.moveTo(x, y); drawing = true; }
        if (drawing) g.lineTo(x, y);
      }
      g.stroke();
    }
    g.globalAlpha = .75; g.beginPath(); g.ellipse(x1, y1, w1 * .62, w1 * .5, Math.atan2(dy, dx), 0, 6.29); g.fill();
    if (w0 > 6 && R() < .6) { g.globalAlpha = .55; g.beginPath(); g.arc(x0 + dx * .5 + nx * w0 * .3, y0 + dy * .5 + ny * w0 * .3, w0 * .18, 0, 6.29); g.fill(); }
    g.globalAlpha = 1;
  }
  function grow(g, R, col, x, y, ang, len, wid, depth, out, sc) {
    let px = x, py = y, a = ang, done = 0, s = 0;
    const segLen = () => (depth === 2 ? 34 + R() * 40 : depth === 1 ? 16 + R() * 22 : 9 + R() * 12) * sc;
    while (done < len) {
      const l = Math.min(segLen(), len - done + 4);
      a += (R() - .5) * (depth === 2 ? .9 : 1.2) + (ang - a) * .35;
      const nx = px + Math.cos(a) * l, ny = py + Math.sin(a) * l, f0 = done / len, f1 = Math.min(1, (done + l) / len);
      const w0 = Math.max(.7, wid * Math.pow(1 - f0, 1.15)), w1 = Math.max(.6, wid * Math.pow(1 - f1, 1.15));
      limb(g, R, col, px, py, nx, ny, w0, w1);
      if (depth > 0 && s > 0 && R() < (depth === 2 ? .62 : .5) && w1 > 1.6) grow(g, R, col, nx, ny, a + (R() < .5 ? -1 : 1) * (.6 + R() * .7), len * (depth === 2 ? .3 + R() * .22 : .35 + R() * .3) * (1 - f1 * .5), w1 * .55, depth - 1, out, sc);
      if (w1 < 7 * sc) {
        const k = R() < .55 ? 1 + (R() < .35 ? 1 : 0) : 0;
        for (let j = 0; j < k; j++) { const q = R(), side = (R() < .5 ? -1 : 1) * (w1 + 2.5 * sc); out.push({ x: px + (nx - px) * q - Math.sin(a) * side, y: py + (ny - py) * q + Math.cos(a) * side, r: (4.6 + R() * 3.4) * sc, rot: R() * 6.28, bud: R() < .22 }); }
      }
      px = nx; py = ny; done += l; s++;
    }
    out.push({ x: px, y: py, r: (2.6 + R() * 1.6) * sc, rot: R() * 6.28, bud: true });
  }
  function buildBranches() {
    branches = []; if (level() === 'sobre') return;
    // A reaches in from the top-right corner across the top of the page, B (Peint) climbs from the bottom-left:
    // both stay in the margins, around the panels
    const col = ink(), Smin = Math.min(W, H), sc = W < 700 ? .8 : 1;
    const specs = [{ x: W + 10, y: H * .03, ang: 2.85, len: Math.min(W * .42, Smin * .75), wid: 22 * sc, seed: 3 }];
    if (level() === 'peint') specs.push({ x: -10, y: H + 10, ang: -1.3, len: Smin * .44, wid: 18 * sc, seed: 8 });
    for (const sp of specs) {
      const [c, g] = mk(W, H, DPR), R = rng(sp.seed), blooms = [];
      grow(g, R, col, sp.x, sp.y, sp.ang, sp.len, sp.wid, 2, blooms, sc);
      blooms.forEach(b => { b.d = Math.hypot(b.x - sp.x, b.y - sp.y); b.p = 0; });
      branches.push({ c, x: sp.x, y: sp.y, blooms, maxD: Math.max(sp.len, ...blooms.map(b => b.d)) + 60, rev: 0, a: 0 });
    }
  }
  function blossom(g, b, open, alpha) {
    g.save(); g.translate(b.x, b.y); g.rotate(b.rot); g.globalAlpha = alpha;
    const r = b.r * (.35 + .65 * open);
    if (b.bud || open < .4) { g.fillStyle = '#D35B7A'; g.beginPath(); g.ellipse(0, 0, r * .42, r * .52, 0, 0, 6.29); g.fill(); g.fillStyle = '#7A2A3E'; g.beginPath(); g.arc(0, r * .48, r * .16, 0, 6.29); g.fill(); g.restore(); return; }
    for (let k = 0; k < 5; k++) { const a = k * 1.2566; g.fillStyle = 'rgba(246,214,222,.95)'; g.beginPath(); g.ellipse(Math.cos(a) * r * .56, Math.sin(a) * r * .56, r * .5, r * .44, a, 0, 6.29); g.fill(); g.strokeStyle = 'rgba(214,138,160,.6)'; g.lineWidth = .6; g.stroke(); }
    g.strokeStyle = 'rgba(122,34,54,.75)'; g.lineWidth = .5; g.fillStyle = 'rgba(122,34,54,.85)';
    for (let k = 0; k < 7; k++) { const a = k * .9 + .3, l = r * (.38 + (k % 2) * .12); g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); g.stroke(); g.beginPath(); g.arc(Math.cos(a) * l, Math.sin(a) * l, .7, 0, 6.29); g.fill(); }
    g.fillStyle = '#C2405E'; g.beginPath(); g.arc(0, 0, r * .16, 0, 6.29); g.fill();
    g.restore();
  }
  function buildEnso() {
    ensoImg = null; if (level() !== 'peint') return;
    const card = $('sigil-card').getBoundingClientRect(); if (!card.width) return;
    ensoR = Math.min(Math.max(card.width, card.height) * .66, Math.min(W, H) * .62);
    ensoImg = dryRing(ensoR * 2, ensoR * 2, ink(), 13, { th: .055, span: Math.PI * 1.9, a0: -1.75, dry: .85, alpha: [.5, .5] });
  }
  function seedMist() { const R = rng(4); mists = Array.from({ length: 8 }, () => ({ x: R() * W, y: H * (.38 + R() * .58), rx: W * (.25 + R() * .3), k: .22 + R() * .2, v: (R() < .5 ? -1 : 1) * (.08 + R() * .12), a: .45 + R() * .35 })); }
  const petal = (x, y) => ({ x, y, s: 3.5 + Math.random() * 3, v: .25 + Math.random() * .25, p: Math.random() * 6.28, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .02, a: 0 });
  function spawnFlock() { const n = 3 + Math.floor(Math.random() * 3), y = H * (.08 + Math.random() * .18); flock = { x: -80, y, v: .55 + Math.random() * .2, birds: Array.from({ length: n }, (_, i) => ({ dx: -i * (22 + Math.random() * 14), dy: (Math.random() - .5) * 26 + i * 4, s: 8 + Math.random() * 4, ph: Math.random() * 6.28 })) }; }
  // a bird in one brush stroke: two tapered wings meeting at the body
  function bird(g, x, y, s, f, col) {
    const wy = -s * (.18 + .4 * f); g.fillStyle = col;
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sd * s * .42, y + wy - s * .1, x + sd * s, y + wy * .45 + s * .12); g.quadraticCurveTo(x + sd * s * .44, y + wy + s * .14, x, y + s * .14); g.fill(); }
    g.beginPath(); g.ellipse(x, y + s * .08, s * .09, s * .13, 0, 0, 6.29); g.fill();
  }
  function ensureScene(w, h) {
    const key = [w, h, level(), ink(), root.classList.contains('mnav-on')].join('|');
    if (key === sceneKey) return; sceneKey = key;
    W = w; H = h; DPR = Math.min(2, devicePixelRatio || 1);
    buildLand(); buildBranches(); buildEnso(); seedMist(); petals = []; flock = null;
  }

  /* ---------- Frame (called by game.js's FX loop when Washi is on) ---------- */
  let fog = 0, ensoA = 0, last = 0, endT0 = 0;
  const timerState = () => root.dataset.timer || 'idle'; // idle | running | break | paused
  const progress = () => { const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot; return Math.max(0, Math.min(1, 1 - Math.max(0, rem) / tot)); };
  ML.washiDraw = (cx, w, h, slow, still, now) => {
    ensureScene(w, h);
    const dt = Math.min(100, last ? now - last : 16) * (still ? 0 : 1); last = now;
    const lv = level(), st = timerState(), focusing = st === 'running' || (st === 'paused' && S.mode === 'focus'), col = ink();
    const deep = root.classList.contains('deep-on');
    if (land) cx.drawImage(land, 0, 0, W, H);
    if (lv !== 'sobre') {
      // mist: drifting bands, then the veil that swallows the landscape during focus (it lifts on a pause)
      const fogT = st === 'running' ? 1 : st === 'paused' ? .35 : st === 'break' ? .05 : lv === 'peint' ? .08 : .12;
      fog = still ? fogT : fog + (fogT - fog) * Math.min(1, dt / 2600);
      for (const m of mists) {
        if (!still) { m.x += m.v * dt / 33 * (1 + fog * .6) * (slow || .3); if (m.x - m.rx > W) m.x = -m.rx; if (m.x + m.rx < 0) m.x = W + m.rx; }
        cx.save(); cx.translate(m.x, m.y); cx.scale(1, m.k);
        const gr = cx.createRadialGradient(0, 0, 0, 0, 0, m.rx); gr.addColorStop(0, `rgba(${PAPER_RGB},${m.a * (.45 + .55 * fog)})`); gr.addColorStop(1, `rgba(${PAPER_RGB},0)`);
        cx.fillStyle = gr; cx.beginPath(); cx.arc(0, 0, m.rx, 0, 6.29); cx.fill(); cx.restore();
      }
      cx.fillStyle = `rgba(${PAPER_RGB},${fog * .72})`; cx.fillRect(0, 0, W, H);
    }
    // plum branches grow from their corner on a pause or a break, blossom, then fade when focus comes back
    const showBr = (st === 'paused' || st === 'break') && !deep;
    for (const b of branches) {
      b.a = still ? (showBr ? 1 : 0) : b.a + ((showBr ? 1 : 0) - b.a) * Math.min(1, dt / (showBr ? 500 : 1400));
      if (showBr) b.rev = still ? b.maxD : Math.min(b.maxD, b.rev + dt * b.maxD / 4200);
      if (b.a < .01) { if (!showBr) { b.rev = 0; b.blooms.forEach(x => { x.p = 0; }); } continue; }
      cx.save(); cx.globalAlpha = b.a; cx.beginPath(); cx.arc(b.x, b.y, Math.max(1, b.rev), 0, 6.29); cx.clip(); cx.drawImage(b.c, 0, 0, W, H); cx.restore();
      for (const f of b.blooms) {
        if (b.rev > f.d + 18) f.p = still ? 1 : Math.min(1, f.p + dt / 900);
        if (f.p > 0) blossom(cx, f, ease(f.p), b.a * Math.min(1, f.p * 2));
        if (showBr && !still && f.p >= 1 && !f.bud && Math.random() < .00035 * dt && petals.length < 26) petals.push(petal(f.x, f.y));
      }
    }
    // the ensō, painted around the timer as the focus goes by (Peint), closed at the session's end
    if (ensoImg) {
      const ended = endT0 && now - endT0 < 4000;
      const want = deep ? 0 : ended ? .2 : st === 'running' && S.mode === 'focus' ? .17 : st === 'paused' && S.mode === 'focus' ? .1 : 0;
      ensoA = still || deep ? want : ensoA + (want - ensoA) * Math.min(1, dt / (want ? 900 : 2200)); // gone at once behind Deep focus
      const p = ended ? Math.min(1, .85 + (now - endT0) / 1500) : progress();
      const ring = $('sigil-card').classList.contains('compact') ? null : document.querySelector('#sigil-card .ring-wrap');
      const r = ring && ring.getBoundingClientRect();
      if (ensoA > .005 && p > 0 && r && r.width) {
        const ccx = r.left + r.width / 2, ccy = r.top + r.height / 2, a0 = -1.81;
        cx.save(); cx.beginPath(); cx.moveTo(ccx, ccy); cx.arc(ccx, ccy, ensoR * 1.1, a0, a0 + Math.PI * 1.96 * p); cx.closePath(); cx.clip();
        cx.globalAlpha = Math.min(1, ensoA / .2) * .55; cx.drawImage(ensoImg, ccx - ensoR, ccy - ensoR, ensoR * 2, ensoR * 2); cx.restore();
      }
    }
    // birds now and then, at rest or on a break (Peint)
    if (lv === 'peint' && !still && !deep) {
      if (!flock && (st === 'idle' || st === 'break') && now > nextFlock) { if (nextFlock) spawnFlock(); nextFlock = now + 35000 + Math.random() * 30000; }
      if (flock) {
        flock.x += flock.v * dt / 33; cx.globalAlpha = .55;
        for (const b of flock.birds) { const flap = (Math.sin(now / 260 + b.ph) + 1) / 2 * (Math.sin(now / 2400 + b.ph) > -.3 ? 1 : .15); bird(cx, flock.x + b.dx, flock.y + b.dy + Math.sin(now / 1800 + b.ph) * 6, b.s, flap, col); }
        cx.globalAlpha = 1; if (flock.x + Math.min(...flock.birds.map(b => b.dx)) > W + 40) flock = null;
      }
    }
    // petals: a few at rest, many under the blossoming branches, none during focus
    if (!still) {
      if ((st === 'idle' || (lv === 'sobre' && st === 'break')) && petals.length < (W < 600 ? 5 : 7) && Math.random() < .004 * dt / 33) petals.push(petal(Math.random() * W, -10));
      for (const q of petals) {
        q.y += q.v * dt / 33; q.x += (Math.sin(now / 3200 + q.p) * .3 + .1) * dt / 33; q.rot += q.vr * dt / 33; q.a = st === 'running' ? Math.max(0, q.a - dt / 400) : Math.min(1, q.a + dt / 800);
        const s = q.s, flip = .55 + .45 * Math.abs(Math.sin(now / 2600 + q.p));
        cx.save(); cx.translate(q.x, q.y); cx.rotate(q.rot); cx.scale(1, flip); cx.globalAlpha = .75 * q.a; cx.fillStyle = '#EDBFCB';
        cx.beginPath(); cx.moveTo(0, -s); cx.quadraticCurveTo(s * .95, -s * .2, 0, s); cx.quadraticCurveTo(-s * .95, -s * .2, 0, -s); cx.fill();
        cx.globalAlpha = .4 * q.a; cx.fillStyle = '#D48A9E'; cx.beginPath(); cx.moveTo(0, -s); cx.lineTo(s * .18, -s * .72); cx.lineTo(-s * .18, -s * .72); cx.fill(); cx.restore();
      }
      petals = petals.filter(q => q.y < H + 20 && q.x < W + 20 && !(st === 'running' && q.a <= 0));
    }
    cx.globalAlpha = 1;
    if (deep && lv === 'peint') deepInk(now, still);
  };
  // game.js keeps calling washiDraw while Deep focus is open (the misty landscape stays behind the ink ensō)
  ML.washiKeepsDrawing = () => isOn() && level() === 'peint';

  /* ---------- Deep focus: the ink ensō (Peint) ---------- */
  let deepImg = null, deepImgR = 0;
  function deepInk(now, still) {
    const dial = document.querySelector('#deep .deep-dial'); if (!dial) return;
    let c = dial.querySelector('canvas.dd-ink');
    if (!c) { c = document.createElement('canvas'); c.className = 'dd-ink'; c.setAttribute('aria-hidden', 'true'); dial.prepend(c); }
    const box = dial.getBoundingClientRect(), S2 = Math.round(box.width * 1.3), d = Math.min(2, devicePixelRatio || 1);
    if (!S2) return;
    if (c.width !== Math.round(S2 * d)) { c.width = c.height = Math.round(S2 * d); }
    const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, S2, S2);
    const Rr = box.width * .46, ccx = S2 / 2, a0 = -Math.PI / 2 - .1;
    if (!deepImg || deepImgR !== Math.round(Rr) || deepImg.dataset.ink !== ink()) { deepImg = dryRing(Rr * 2.2, Rr * 2.2, ink(), 29, { th: .07, span: Math.PI * 1.95, a0, dry: .75, alpha: [.55, .45] }); deepImg.dataset.ink = ink(); deepImgR = Math.round(Rr); }
    const p = progress();
    g.globalAlpha = .07; g.drawImage(deepImg, ccx - Rr * 1.1, ccx - Rr * 1.1, Rr * 2.2, Rr * 2.2); // the guide: where the brush will go
    g.save(); g.beginPath(); g.moveTo(ccx, ccx); g.arc(ccx, ccx, Rr * 1.3, a0 - .05, a0 + Math.PI * 1.97 * p); g.closePath(); g.clip();
    g.globalAlpha = .9; g.drawImage(deepImg, ccx - Rr * 1.1, ccx - Rr * 1.1, Rr * 2.2, Rr * 2.2); g.restore(); g.globalAlpha = 1;
  }

  /* ---------- Session end: the ink drop, under the digits ---------- */
  let blotImg = null, blotInk = '';
  function buildBlot() {
    const SZ = 420, [c, g] = mk(SZ, SZ, 1), R = rng(17), col = ink();
    for (let k = 0; k < 110; k++) { const a = R() * 6.28, r = Math.pow(R(), 1.2) * SZ * .3, rad = SZ * (.04 + R() * .08) * (1.15 - r / (SZ * .34)); g.fillStyle = rgba(col, .018 + R() * .03); g.beginPath(); g.arc(SZ / 2 + Math.cos(a) * r, SZ / 2 + Math.sin(a) * r * .94, Math.max(3, rad), 0, 6.29); g.fill(); }
    for (let k = 0; k < 70; k++) { const a = R() * 6.28, r = SZ * (.2 + R() * .1); g.fillStyle = rgba(col, .02 + R() * .03); g.beginPath(); g.arc(SZ / 2 + Math.cos(a) * r, SZ / 2 + Math.sin(a) * r * .94, SZ * (.01 + R() * .025), 0, 6.29); g.fill(); }
    const [c2, g2] = mk(SZ, SZ, 1); g2.filter = 'blur(12px)'; g2.drawImage(c, 0, 0, SZ, SZ);
    g2.filter = 'blur(6px)'; for (let k = 0; k < 14; k++) { const a = R() * 6.28, r = Math.pow(R(), 2) * SZ * .08; g2.fillStyle = rgba(col, .04 + R() * .05); g2.beginPath(); g2.arc(SZ / 2 + Math.cos(a) * r, SZ / 2 + Math.sin(a) * r, SZ * (.03 + R() * .05), 0, 6.29); g2.fill(); }
    g2.filter = 'blur(.8px)'; for (let k = 0; k < 7; k++) { const a = R() * 6.28, r = SZ * (.33 + R() * .1); g2.fillStyle = rgba(col, .25 + R() * .25); g2.beginPath(); g2.arc(SZ / 2 + Math.cos(a) * r, SZ / 2 + Math.sin(a) * r, 1 + R() * 2.4, 0, 6.29); g2.fill(); }
    blotImg = c2; blotInk = col;
  }
  let blotRaf = null;
  function dropInk() {
    if (!isOn() || ML.reducedMotion()) return;
    const wrap = document.querySelector('#sigil-card .ring-wrap'); if (!wrap || !wrap.getBoundingClientRect().width) return;
    let c = wrap.querySelector('canvas.washi-blot');
    if (!c) { c = document.createElement('canvas'); c.className = 'washi-blot'; c.setAttribute('aria-hidden', 'true'); wrap.prepend(c); }
    if (!blotImg || blotInk !== ink()) buildBlot();
    const OW = c.getBoundingClientRect().width, d = Math.min(2, devicePixelRatio || 1); c.width = c.height = Math.round(OW * d);
    const g = c.getContext('2d'), t0 = performance.now();
    cancelAnimationFrame(blotRaf);
    const step = () => {
      const tt = performance.now() - t0, sc = .1 + .9 * ease(tt / 3600), al = tt < 400 ? tt / 400 : tt < 4200 ? 1 : Math.max(0, 1 - (tt - 4200) / 2600), SZ = OW * .92 * sc;
      g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, OW, OW); g.globalAlpha = al; g.drawImage(blotImg, OW / 2 - SZ / 2, OW / 2 - SZ / 2, SZ, SZ); g.globalAlpha = 1;
      blotRaf = tt < 6800 ? requestAnimationFrame(step) : (c.remove(), null); // gone afterwards, so it never widens the page
    };
    blotRaf = requestAnimationFrame(step);
  }
  on('session', () => { if (!isOn()) return; endT0 = performance.now(); dropInk(); });

  /* ---------- Keeping the page in step ---------- */
  // (the scene rebuilds itself when the size, level or ink changes: ensureScene compares a key)
  function sync() {
    if (root.dataset.washiLevel !== level()) root.dataset.washiLevel = level();
    if (root.dataset.washiInk !== (W_().ink || 'indigo')) root.dataset.washiInk = W_().ink || 'indigo';
    if (isOn()) paintUi(); else if (uiKey) clearUi();
  }
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light'] });
  on('started', sync);
  on('render', sync); // a sync from another device may have changed the settings
  addEventListener('resize', () => { sceneKey = ''; });

  ML.settingsSection({
    order: 16,
    render: () => !(ML.isPremium && ML.isPremium()) ? '' : `<h3>${esc(t('set_washi'))}</h3><p class="hint">${esc(t('washi_hint'))}</p>
      <label class="field"><span>${esc(t('washi_level'))}</span>${ML.ui.sel('set-washi-level', ['sobre', 'encre', 'peint'].map(v => [v, t('wl_' + v)]), level())}</label>
      <label class="field"><span>${esc(t('washi_ink'))}</span>${ML.ui.sel('set-washi-ink', ['indigo', 'sumi', 'mousse', 'prune'].map(v => [v, t('wi_' + v)]), W_().ink || 'indigo')}</label>`,
    bind: r => {
      const lv = r.querySelector('#set-washi-level'), ik = r.querySelector('#set-washi-ink'); if (!lv) return;
      lv.onchange = e => { S.washi = Object.assign({}, W_(), { level: e.target.value }); save(); sync(); };
      ik.onchange = e => { S.washi = Object.assign({}, W_(), { ink: e.target.value }); save(); sync(); };
    },
  });
})();
