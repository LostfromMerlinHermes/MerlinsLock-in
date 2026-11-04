// The year tree's drawings (3.63): pure painting, no state. Each skin draws from a list of weeks
// ({ s sessions, f Flow, empty, back comeback, rare challenge, season 0-3 }). Every week has its own seed, so adding one never changes an old branch.
// Skins: oak, plate, willow, pine, holo, pixel. paint() draws the whole scene, bare() the tree alone (the Room's grove). Both return hits: [{ i, x, y }].
(() => {
  'use strict';
  const TAU = Math.PI * 2, { sin, cos, sqrt, abs, min, max, floor, round, hypot, atan2, exp, pow } = Math;
  const rng = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const lerp = (a, b, k) => a + (b - a) * k, clamp = (v, a, b) => min(b, max(a, v));
  const pickOf = (R, a) => a[floor(R() * a.length)];
  const MONO = '500 17px ui-monospace, "Cascadia Mono", Consolas, monospace';

  const SEASONS = [['#4a2616', '#84421f', '#bf6c2c', '#eaa44c'], ['#333f4a', '#54656f', '#8197a1', '#c3d3d8'], ['#37552f', '#648f4b', '#a0c26a', '#f2bccb'], ['#1b4029', '#2b6039', '#4a8c4e', '#8dc26c']];
  const LEAVES = { lf_sakura: ['#6b2a48', '#b84f7a', '#ea8fae', '#ffd3dd'], lf_ember: ['#4c1512', '#90281c', '#d4482a', '#f7a04a'], lf_silver: ['#3a4048', '#68727c', '#a4afb6', '#e4ebee'], lf_jade: ['#0f3b34', '#19685a', '#2fa58a', '#8fe3c4'], lf_violet: ['#2c1c50', '#54378f', '#8a63cf', '#cdb2f5'], lf_gold: ['#54390f', '#9a6d1c', '#d9a636', '#f8e08a'] };
  // [shadow, base, light, bark line]
  const BARKS = { br_bark: ['#2e2115', '#5e4630', '#94734f', '#1e150e'], br_ash: ['#6f6a66', '#a8a29c', '#e0dbd2', '#57524e'], br_ebony: ['#0d0b0f', '#26212b', '#4b4356', '#060508'], br_gold: ['#5e3f12', '#a87c28', '#ecc768', '#3c280a'], br_verdigris: ['#17443e', '#2f7a6c', '#6cc4ad', '#0e2d29'], br_ember: ['#3b120e', '#7c2a1a', '#c25a33', '#250a07'] };
  const FLOWERS = { fl_gold: ['#efc765', '#f7dd8e', '#7a4f1d'], fl_plum: ['#f5e6ea', '#ffffff', '#b5476a'], fl_camellia: ['#c9374a', '#e6606f', '#f0cb6a'], fl_star: ['#9fd0ff', '#e4f3ff', '#ffffff'] };
  const RARE = ['#9fd0ff', '#e4f3ff', '#ffffff'];
  const palOf = (o, W) => LEAVES[o.leaf] || SEASONS[W.season] || SEASONS[0];
  const barkOf = o => BARKS[o.bark] || null;
  const flowerOf = (o, def) => FLOWERS[o.flower] && o.flower !== 'fl_gold' ? FLOWERS[o.flower] : def || FLOWERS.fl_gold;

  /* ---------- Shared drawing ---------- */
  function taper(g, pts, fill) {
    const L = [], Rr = [];
    pts.forEach((p, i) => {
      const a = pts[min(i + 1, pts.length - 1)], b = pts[max(i - 1, 0)], an = atan2(a.y - b.y, a.x - b.x) + Math.PI / 2, w = p.w / 2;
      L.push([p.x + cos(an) * w, p.y + sin(an) * w]); Rr.push([p.x - cos(an) * w, p.y - sin(an) * w]);
    });
    g.fillStyle = fill; g.beginPath(); g.moveTo(L[0][0], L[0][1]);
    L.forEach(q => g.lineTo(q[0], q[1])); Rr.reverse().forEach(q => g.lineTo(q[0], q[1])); g.closePath(); g.fill();
    return { L, R: Rr };
  }
  const path = (g, side) => { g.beginPath(); side.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); };
  const angDiff = (t, a) => { let d = (t - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  function grow(R, x, y, ang, len, w, order, o, out, wk) {
    const pts = [{ x, y, w }], step = max(5, len / (7 + order * 1.5)), wob = (R() - .5) * (o.wob || .08); let a = ang, l = 0;
    while (l < len) {
      a += (R() - .5) * o.wig + wob; a += angDiff(o.up, a) * o.trop;
      x += cos(a) * step; y += sin(a) * step; l += step;
      const wk2 = lerp(w, w * .3, l / len); pts.push({ x, y, w: wk2 });
      if (order < o.max && l > len * .16 && R() < o.fork) { const sd = R() < .5 ? -1 : 1; grow(R, x, y, a + sd * (.42 + R() * .55), (len - l) * .55 + len * .3, wk2 * .74, order + 1, o, out, wk); }
    }
    if (order < o.max) for (const sd of [-1, 1]) grow(R, x, y, a + sd * (.28 + R() * .4), len * .42, pts[pts.length - 1].w * .8, order + 1, o, out, wk);
    else out.tips.push({ x, y, a, wk });
    out.limbs.push({ pts, order, wk });
  }
  // Six main boughs leave the head of the trunk; each week grows on one of them, the newest towards its end
  function yearTree(weeks, cx, gy, o = {}) {
    const n = weeks.length, sc = n > 40 ? sqrt(40 / n) : 1, g01 = min(1.1, sqrt(n / 40)), top = (64 + 100 * g01) * sc, w0 = (9 + 31 * g01) * sc, trunk = [];
    const xAt = h => cx + (sin(h * .012 / sc + 1) - sin(1)) * 15 * sc;
    const wAt = h => lerp(w0, w0 * .6, clamp(h / top, 0, 1)) * (1 + .7 * exp(-h / (w0 * .9)));
    for (let h = 0; h <= top; h += 6 * sc) trunk.push({ x: xAt(h), y: gy - h, w: wAt(h) });
    const BOUGH = [-1.2, 1.14, -.68, .74, -.2, .28], STEP = 34 * sc, boughs = [];
    BOUGH.forEach((a0, b) => {
      const cnt = floor((n + 5 - b) / 6); if (!cnt) { boughs.push(null); return; }
      const R = rng(500 + b * 19), L = (22 + STEP / sc * cnt) * sc * (b > 3 ? .86 : 1), pts = [], h = top * (.7 + (b % 2) * .08 + floor(b / 2) * .11);
      let x = xAt(h), y = gy - h, a = -Math.PI / 2 + a0, l = 0; const stp = 9 * sc, w = w0 * (.34 + .13 * g01);
      pts.push({ x, y, w });
      while (l < L) { a += (R() - .5) * .19; a += angDiff(-Math.PI / 2, a) * .018; x += cos(a) * stp; y += sin(a) * stp; l += stp; pts.push({ x, y, w: lerp(w, 2 * sc, l / L), a }); }
      boughs.push({ pts, order: 0, wk: -1 });
    });
    const out = [];
    for (let i = 0; i < n; i++) {
      const W = weeks[i], R = rng(1000 + i * 77), b = i % 6, k = floor(i / 6), B = boughs[b], ph = i * 2.399, behind = sin(ph) < 0, age = (n - 1 - i) / 40;
      const at = B.pts[min(B.pts.length - 1, max(1, round((k + .55) * STEP / (9 * sc))))], side = k % 2 ? 1 : -1, a0 = (at.a == null ? -Math.PI / 2 : at.a) + side * (.62 + R() * .35);
      const len = (W.empty ? 30 : 36 + min(W.s, 16) * 6.2) * (1 + .75 * sqrt(age)) * sc;
      const parts = { limbs: [], tips: [] }, sw = (W.empty ? 2.6 : 2.8 + min(W.s, 16) * .36) * (1 + .6 * sqrt(age)) * sc;
      grow(R, at.x, at.y, a0, len, sw, 0, { up: -Math.PI / 2, trop: .03, wig: .3, fork: W.empty ? 0 : .24, max: W.empty ? 1 : (o.max || 3) }, parts, i);
      out.push({ W, out: parts, behind, R, sc });
    }
    return { trunk, weeks: out, top, w0, boughs: boughs.filter(Boolean), sc };
  }
  function foliage(g, wk, layer, o) {
    const { W, out, R, sc } = wk; if (W.empty) return;
    const P = palOf(o, W), dens = !LEAVES[o.leaf] && W.season === 1 ? .62 : 1, N = (layer === 'back' ? 15 : 10) * dens * (o.dens || 1);
    out.tips.forEach(t => {
      const rad = (13 + min(W.s, 16) * .9) * sc;
      if (layer === 'back') { g.globalAlpha = .34; g.fillStyle = P[0]; g.beginPath(); g.arc(t.x, t.y, rad * 1.15, 0, TAU); g.fill(); g.globalAlpha = 1; }
      for (let i = 0; i < N; i++) {
        const a = R() * TAU, r = sqrt(R()) * rad, x = t.x + cos(a) * r, y = t.y + sin(a) * r * .85, lit = (x - t.x) / rad * .55 - (y - t.y) / rad * .85 + (R() - .5) * .5;
        const c = layer === 'back' ? (lit > .25 ? P[1] : P[0]) : (lit > .55 ? P[3] : lit > .05 ? P[2] : P[1]);
        const s = (2.4 + R() * 3.2) * sc;
        g.fillStyle = c; g.beginPath(); g.ellipse(x, y, s, s * .52, R() * TAU, 0, TAU); g.fill();
      }
    });
  }
  function bloom(g, x, y, r, c) {
    g.save(); g.translate(x, y); g.rotate(x);
    const h = g.createRadialGradient(0, 0, 0, 0, 0, r * 2.2); h.addColorStop(0, c[0] + '66'); h.addColorStop(1, c[0] + '00'); g.fillStyle = h; g.beginPath(); g.arc(0, 0, r * 2.2, 0, TAU); g.fill();
    for (let i = 0; i < 5; i++) { g.rotate(TAU / 5); g.fillStyle = c[0]; g.beginPath(); g.ellipse(0, -r * .68, r * .44, r * .68, 0, 0, TAU); g.fill(); g.fillStyle = c[1]; g.beginPath(); g.ellipse(0, -r * .78, r * .2, r * .4, 0, 0, TAU); g.fill(); }
    g.fillStyle = c[2]; g.beginPath(); g.arc(0, 0, r * .3, 0, TAU); g.fill(); g.restore();
  }
  function bud(g, x, y, sc) {
    const h = g.createRadialGradient(x, y, 0, x, y, 15 * sc); h.addColorStop(0, '#9ff2d8aa'); h.addColorStop(1, '#9ff2d800'); g.fillStyle = h; g.beginPath(); g.arc(x, y, 15 * sc, 0, TAU); g.fill();
    g.fillStyle = '#c9ffe9'; g.beginPath(); g.ellipse(x, y, 3.6 * sc, 6 * sc, .3, 0, TAU); g.fill();
  }
  function marks(g, wk, flower) {
    const { W, out, R, sc } = wk, t = out.tips, at = () => t[floor(R() * t.length)];
    if (!t.length || W.empty) return;
    for (let i = 0; i < min(W.f, 3); i++) { const p = at(); bloom(g, p.x + (R() - .5) * 18 * sc, p.y + (R() - .5) * 18 * sc, 5 * sc, flower); }
    if (W.back) { const p = at(); bud(g, p.x, p.y, sc); }
    if (W.rare) { const p = at(); bloom(g, p.x, p.y, 10.5 * sc, RARE); }
  }
  function woodLimb(g, l, B) {
    const e = taper(g, l.pts, B[1]);
    if (l.pts[0].w > 2.6) { g.lineWidth = .9; g.strokeStyle = B[2]; path(g, e.L); g.strokeStyle = B[3]; path(g, e.R); }
  }
  function drawTrunk(g, tr, B) {
    const x0 = tr.trunk[0].x, grad = g.createLinearGradient(x0 - tr.w0, 0, x0 + tr.w0, 0); grad.addColorStop(0, B[0]); grad.addColorStop(.55, B[1]); grad.addColorStop(1, B[2]);
    taper(g, tr.trunk, grad);
    const R = rng(77), lines = floor(4 + tr.w0 / 3.2);
    for (let k = 0; k < lines; k++) {
      const u = -1 + (k + .5) * 2 / lines, ph = R() * 9, from = floor(R() * 8), to = floor(tr.trunk.length * (.35 + R() * .5));
      g.strokeStyle = k % 3 === 2 ? B[2] + '66' : B[3]; g.lineWidth = .8 + R() * 1.2; g.beginPath();
      for (let i = from; i < to; i++) { const p = tr.trunk[i], x = p.x + u * p.w * .44 + sin(i * .5 + ph) * 1.4; i === from ? g.moveTo(x, p.y) : g.lineTo(x, p.y); }
      g.stroke();
    }
  }
  const hitsOf = tr => { const h = []; tr.weeks.forEach(w => w.out.tips.forEach(t => h.push({ i: w.W.i, x: t.x, y: t.y }))); return h; };

  /* ---------- Roots (health, kept on this device; absent from the grove) ---------- */
  const ROOT_COL = ['#8fb7d9', '#7fd0c8', '#d0a070'];
  function roots(g, cx, gy, n, list, style) {
    const f = .35 + .65 * min(1, n / 30);
    list.forEach((v, i) => {
      const R = rng(40 + i * 11), base = Math.PI / 2 + (i - 1) * .72, out = { limbs: [], tips: [] };
      grow(R, cx + (i - 1) * 9, gy + 2, base, (70 + 170 * v) * f, (3.5 + 15 * v) * f, 0, { up: Math.PI / 2, trop: .012, wig: .34, wob: .16, fork: .18 + v * .14, max: 2 + round(v * 1.4) }, out, 0);
      out.limbs.sort((a, b) => a.order - b.order).reverse().forEach(l => style(l, ROOT_COL[i]));
    });
  }
  function rootLabels(g, W, H, names, tone) {
    g.font = MONO; g.textAlign = 'center';
    names.forEach((name, i) => { g.fillStyle = tone || ROOT_COL[i]; g.fillText(name, W / 2 + (i - 1) * W * .3, H - 14); });
    g.textAlign = 'left';
  }

  /* ---------- oak: the base tree, and the shop's dressing ---------- */
  const SKY = { sk_dusk: [['#191426', 0], ['#3a2640', .55], ['#8a4e4a', .86], ['#d58a5a', 1]], sk_night: [['#070a18', 0], ['#101630', .6], ['#1c2542', 1]], sk_dawn: [['#2a3556', 0], ['#7a7ea0', .55], ['#e0b5a5', .86], ['#f4d9a8', 1]] };
  const skyOf = o => (SKY[o.sky] ? o.sky : 'sk_dusk');
  function oakScene(g, W, H, gy, o) {
    const s = g.createLinearGradient(0, 0, 0, gy), sk = skyOf(o); SKY[sk].forEach(([c, k]) => s.addColorStop(k, c)); g.fillStyle = s; g.fillRect(0, 0, W, gy);
    const R = rng(5);
    if (sk !== 'sk_dawn') for (let i = 0; i < (sk === 'sk_night' ? 240 : 70); i++) { g.globalAlpha = .2 + R() * .7; g.fillStyle = '#f2ead8'; const y = R() * gy * (sk === 'sk_night' ? .95 : .55), r = R() < .08 ? 1.5 : .8; g.beginPath(); g.arc(R() * W, y, r, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    const mx = W * .84, my = gy * (sk === 'sk_dawn' ? .78 : .2), mc = sk === 'sk_dawn' ? '#ffe8b8' : '#f4ecd2', hl = g.createRadialGradient(mx, my, 10, mx, my, 150); hl.addColorStop(0, mc + '55'); hl.addColorStop(1, mc + '00'); g.fillStyle = hl; g.fillRect(mx - 150, my - 150, 300, 300);
    g.fillStyle = mc; g.beginPath(); g.arc(mx, my, 27, 0, TAU); g.fill();
    if (sk !== 'sk_dawn') { g.fillStyle = '#d8cfb4'; [[-8, -6, 6], [9, 7, 4], [-3, 12, 3]].forEach(([a, b, r]) => { g.beginPath(); g.arc(mx + a, my + b, r, 0, TAU); g.fill(); }); }
    [[gy - 92, sk === 'sk_dawn' ? '#7f7890' : '#2a2138', .006, 34], [gy - 50, sk === 'sk_dawn' ? '#5e6276' : '#201a2b', .011, 22]].forEach(([y, c, f, a], k) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, gy); for (let x = 0; x <= W; x += 10) g.lineTo(x, y + sin(x * f + k * 3) * a + sin(x * f * 2.7 + k) * a * .35); g.lineTo(W, gy); g.fill(); });
    const m = g.createLinearGradient(0, gy - 70, 0, gy); m.addColorStop(0, 'rgba(220,190,180,0)'); m.addColorStop(1, sk === 'sk_night' ? 'rgba(120,140,190,.2)' : 'rgba(235,190,160,.26)'); g.fillStyle = m; g.fillRect(0, gy - 70, W, 70);
    const d = g.createLinearGradient(0, gy, 0, H); d.addColorStop(0, '#2b1e13'); d.addColorStop(.45, '#1c130c'); d.addColorStop(1, '#0d0906'); g.fillStyle = d; g.fillRect(0, gy, W, H - gy);
    for (let i = 0; i < 26; i++) { const x = R() * W, y = gy + 28 + R() * (H - gy - 40), r = 4 + R() * 13; g.fillStyle = '#2f241b'; g.beginPath(); g.ellipse(x, y, r, r * .6, R(), 0, TAU); g.fill(); g.fillStyle = '#42342733'; g.beginPath(); g.ellipse(x - r * .2, y - r * .2, r * .5, r * .22, 0, 0, TAU); g.fill(); }
    g.strokeStyle = '#3b2a1c'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, gy + 3); for (let x = 0; x <= W; x += 12) g.lineTo(x, gy + 3 + sin(x * .03) * 2); g.stroke();
  }
  function grass(g, W, gy) {
    const R = rng(9), C = ['#39502d', '#4d6a38', '#2d4326', '#648045'], N = floor(W * 1.55);
    for (let i = 0; i < N; i++) { const x = R() * W, h = 5 + R() * 13; g.strokeStyle = pickOf(R, C); g.lineWidth = 1 + R() * .8; g.beginPath(); g.moveTo(x, gy + 2 + R() * 3); g.quadraticCurveTo(x + (R() - .5) * 5, gy - h * .6, x + (R() - .5) * 8, gy - h); g.stroke(); }
    for (let i = 0; i < W / 23; i++) { const x = R() * W; g.fillStyle = pickOf(R, ['#e6cf86', '#d9b5c6', '#d4d8e6']); g.beginPath(); g.arc(x, gy - 6 - R() * 9, 1.6, 0, TAU); g.fill(); }
  }
  function dressGround(g, W, gy, kind) {
    const cx = W / 2, R = rng(31);
    if (kind === 'gd_pond') {
      const px = cx + 250, py = gy + 6, s = g.createLinearGradient(0, py - 18, 0, py + 18); s.addColorStop(0, '#30405a'); s.addColorStop(1, '#141c30'); g.fillStyle = '#231a12'; g.beginPath(); g.ellipse(px, py, 148, 24, 0, 0, TAU); g.fill(); g.fillStyle = s; g.beginPath(); g.ellipse(px, py, 136, 18, 0, 0, TAU); g.fill();
      g.fillStyle = '#e9dcae66'; g.beginPath(); g.ellipse(px + 50, py - 2, 26, 3, 0, 0, TAU); g.fill();
      [[-70, 2], [-30, -5], [36, 7], [84, -2]].forEach(([a, b]) => { g.fillStyle = '#3f6b47'; g.beginPath(); g.ellipse(px + a, py + b, 12, 4, 0, .4, TAU); g.fill(); g.fillStyle = '#efc6d2'; g.beginPath(); g.ellipse(px + a, py + b - 3, 4, 3, 0, 0, TAU); g.fill(); });
    }
    if (kind === 'gd_stones') for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI, x = cx + cos(a + Math.PI) * -(190 - (i % 2) * 8), r = 13 + R() * 10, y = gy + 2; g.fillStyle = '#4b4a50'; g.beginPath(); g.moveTo(x - r, y + 3); g.quadraticCurveTo(x - r * .9, y - r * 1.3, x, y - r * 1.5); g.quadraticCurveTo(x + r * .9, y - r * 1.2, x + r, y + 3); g.fill(); g.fillStyle = '#6d6b70'; g.beginPath(); g.ellipse(x + r * .25, y - r * .9, r * .36, r * .2, -.5, 0, TAU); g.fill(); g.fillStyle = '#4f6a3e'; g.beginPath(); g.ellipse(x - r * .4, y + 1, r * .55, 3.5, 0, 0, TAU); g.fill(); }
    if (kind === 'gd_mush') {
      for (let i = 0; i < 14; i++) { const x = cx + (i % 2 ? 1 : -1) * (40 + R() * 300), s = .7 + R() * .9, y = gy + 1; g.fillStyle = '#e6dcc8'; g.fillRect(x - 1.8 * s, y - 11 * s, 3.6 * s, 11 * s); g.fillStyle = i % 3 ? '#b84a3a' : '#d7a24a'; g.beginPath(); g.ellipse(x, y - 11 * s, 8 * s, 6 * s, 0, Math.PI, TAU); g.fill(); g.fillStyle = '#f4ead6'; g.beginPath(); g.arc(x - 3 * s, y - 13.5 * s, 1.1 * s, 0, TAU); g.arc(x + 3 * s, y - 14 * s, 1 * s, 0, TAU); g.fill(); }
      for (let i = 0; i < 26; i++) { const x = R() * W, y = gy - 16 - R() * 120, h = g.createRadialGradient(x, y, 0, x, y, 9); h.addColorStop(0, '#f6f0a0cc'); h.addColorStop(1, '#f6f0a000'); g.fillStyle = h; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); }
    }
  }
  function dressTree(g, tr, kind, gy) {
    const low = tr.weeks.filter(w => !w.W.empty && !w.behind), R = rng(8), main = w => w.out.limbs.find(l => l.order === 0) || w.out.limbs[0];
    if (kind === 'hg_lanterns') low.forEach((w, i) => {
      if (i % 2) return; const limb = main(w), p = limb.pts[floor(limb.pts.length * .8)], len = 20 + R() * 28, y = p.y + len;
      g.strokeStyle = '#2c2118'; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x, y); g.stroke();
      const h = g.createRadialGradient(p.x, y + 7, 1, p.x, y + 7, 26); h.addColorStop(0, '#ffcf7a99'); h.addColorStop(1, '#ffcf7a00'); g.fillStyle = h; g.beginPath(); g.arc(p.x, y + 7, 26, 0, TAU); g.fill();
      g.fillStyle = '#e8863f'; g.beginPath(); g.ellipse(p.x, y + 7, 6.5, 8, 0, 0, TAU); g.fill(); g.fillStyle = '#ffd98c'; g.beginPath(); g.ellipse(p.x, y + 7, 3, 6, 0, 0, TAU); g.fill(); g.fillStyle = '#2c2118'; g.fillRect(p.x - 3.5, y - 2, 7, 2); g.fillRect(p.x - 3.5, y + 14, 7, 2);
    });
    if (kind === 'hg_swing' && tr.boughs.length) {
      const l = tr.boughs[1] || tr.boughs[0], a = l.pts[floor(l.pts.length * .34)], b = l.pts[floor(l.pts.length * .46)], y = gy - 34;
      g.strokeStyle = '#d8c7a2'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x, y); g.moveTo(b.x, b.y); g.lineTo(b.x, y); g.stroke();
      g.fillStyle = '#7a5234'; g.fillRect(min(a.x, b.x) - 8, y, abs(a.x - b.x) + 16, 6); g.fillStyle = '#a4764a'; g.fillRect(min(a.x, b.x) - 8, y, abs(a.x - b.x) + 16, 2);
    }
    if (kind === 'hg_birds') low.forEach((w, i) => {
      if (i % 3) return; const limb = main(w), p = limb.pts[floor(limb.pts.length * .72)], dir = i % 2 ? 1 : -1;
      g.fillStyle = '#20252f'; g.beginPath(); g.ellipse(p.x, p.y - 8, 8, 5.4, -.2 * dir, 0, TAU); g.fill(); g.beginPath(); g.arc(p.x + 6 * dir, p.y - 13, 3.6, 0, TAU); g.fill();
      g.fillStyle = '#c5563c'; g.beginPath(); g.ellipse(p.x + 2 * dir, p.y - 6, 4, 3, 0, 0, TAU); g.fill(); g.fillStyle = '#e8c56a'; g.beginPath(); g.moveTo(p.x + 9 * dir, p.y - 14); g.lineTo(p.x + 13 * dir, p.y - 13); g.lineTo(p.x + 9 * dir, p.y - 12); g.fill();
      g.strokeStyle = '#20252f'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x - 7 * dir, p.y - 8); g.lineTo(p.x - 15 * dir, p.y - 4); g.stroke();
    });
  }
  function oakTree(g, weeks, cx, gy, o) {
    const tr = yearTree(weeks, cx, gy), B = barkOf(o) || BARKS.br_bark, flower = flowerOf(o), BARE = ['#3a332e', '#6d6058', '#a39483', '#2a1e14'];
    const limbB = [B[0], B[1] === BARKS.br_bark[1] ? '#54402c' : B[1], B === BARKS.br_bark ? '#8f7050' : B[2], B === BARKS.br_bark ? '#2a1e14' : B[3]];
    const layer = wk => {
      foliage(g, wk, 'back', o);
      wk.out.limbs.slice().sort((a, b) => b.order - a.order).forEach(l => woodLimb(g, l, wk.W.empty ? BARE : limbB));
      foliage(g, wk, 'front', o);
    };
    tr.weeks.filter(w => w.behind).forEach(layer);
    tr.boughs.forEach(l => woodLimb(g, l, limbB));
    drawTrunk(g, tr, B);
    tr.weeks.filter(w => !w.behind).forEach(layer);
    tr.weeks.forEach(w => marks(g, w, flower));
    dressTree(g, tr, o.hang, gy);
    return hitsOf(tr);
  }
  function oak(g, W, H, weeks, o) {
    const gy = 570, cx = W / 2 - 10;
    oakScene(g, W, H, gy, o);
    grass(g, o.ground === 'gd_pond' ? W * .62 : W, gy);
    if (o.roots) {
      roots(g, cx, gy, weeks.length, o.roots, (l, col) => { const e = taper(g, l.pts, l.order === 0 ? '#5c4632' : '#4a3827'); if (l.pts[0].w > 2) { g.globalAlpha = .75; g.strokeStyle = col; g.lineWidth = 1.2; path(g, e.L); g.globalAlpha = 1; } });
      rootLabels(g, W, H, o.rootNames);
    }
    dressGround(g, W, gy, o.ground);
    return oakTree(g, weeks, cx, gy, o);
  }

  /* ---------- plate: the same tree, engraved ---------- */
  function plateTree(g, weeks, cx, gy, o) {
    const tr = yearTree(weeks, cx, gy), B = barkOf(o), INK = B ? B[2] : '#d9c9a4', PAPER = '#1a140e', WASH = ['#b0622c', '#7f97a6', '#8fb06a', '#4d8a55'];
    tr.weeks.forEach(w => { if (w.W.empty) return; const R = rng(w.W.i + 900), c = LEAVES[o.leaf] ? LEAVES[o.leaf][2] : WASH[w.W.season]; w.out.tips.forEach((t, i) => { if (i % 2) return; const rr = (14 + min(w.W.s, 16) * 1.2) * tr.sc, hw = g.createRadialGradient(t.x, t.y, 0, t.x, t.y, rr * 1.5); hw.addColorStop(0, c + '4d'); hw.addColorStop(1, c + '00'); g.fillStyle = hw; g.beginPath(); g.arc(t.x + R() * 6, t.y + R() * 6, rr * 1.5, 0, TAU); g.fill(); }); });
    const inkLimb = l => { const e = taper(g, l.pts, PAPER); g.strokeStyle = INK; g.lineWidth = l.order ? .8 : 1.1; path(g, e.L); path(g, e.R); };
    const sprigs = w => { if (w.W.empty) return; const R = rng(w.W.i + 400), N = w.W.season === 1 && !LEAVES[o.leaf] ? 5 : 9; w.out.tips.forEach(t => { for (let i = 0; i < N; i++) { const a = R() * TAU, r = sqrt(R()) * (13 + min(w.W.s, 16)) * tr.sc, x = t.x + cos(a) * r, y = t.y + sin(a) * r, s = (2.6 + R() * 2.6) * tr.sc; g.fillStyle = PAPER; g.strokeStyle = LEAVES[o.leaf] ? LEAVES[o.leaf][3] : INK; g.lineWidth = .7; g.beginPath(); g.ellipse(x, y, s, s * .5, R() * TAU, 0, TAU); g.fill(); g.stroke(); } }); };
    tr.weeks.filter(w => w.behind).forEach(w => { w.out.limbs.slice().sort((a, b) => b.order - a.order).forEach(inkLimb); sprigs(w); });
    tr.boughs.forEach(inkLimb);
    const eT = taper(g, tr.trunk, PAPER); g.strokeStyle = INK; g.lineWidth = 1.3; path(g, eT.L); path(g, eT.R);
    const Rb = rng(6); g.lineWidth = .7; tr.trunk.forEach(p => { if (p.w < 5) return; const c = floor(p.w / 3.6); for (let k = 0; k < c; k++) { const u = -.46 + k / c * .92; if (Rb() < .4) continue; const l = 6 + Rb() * 10; g.strokeStyle = INK + (u > 0 ? '44' : 'aa'); g.beginPath(); g.moveTo(p.x + u * p.w, p.y); g.lineTo(p.x + u * p.w + (Rb() - .5) * 1.6, p.y - l); g.stroke(); } });
    tr.weeks.filter(w => !w.behind).forEach(w => { w.out.limbs.slice().sort((a, b) => b.order - a.order).forEach(inkLimb); sprigs(w); });
    tr.weeks.forEach(w => marks(g, w, flowerOf(o)));
    return hitsOf(tr);
  }
  function plate(g, W, H, weeks, o) {
    g.fillStyle = '#17120d'; g.fillRect(0, 0, W, H);
    const v = g.createRadialGradient(W / 2, H * .45, 120, W / 2, H * .45, 640); v.addColorStop(0, '#2a2118'); v.addColorStop(1, '#17120d'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#8c7650'; g.lineWidth = 2; g.strokeRect(18, 18, W - 36, H - 36); g.lineWidth = 1; g.strokeStyle = '#5a4a32'; g.strokeRect(27, 27, W - 54, H - 54);
    const gy = 570, cx = W / 2, INK = '#d9c9a4';
    g.save(); g.beginPath(); g.rect(29, 29, W - 58, H - 58); g.clip();
    g.strokeStyle = INK; g.lineWidth = 1.2; g.beginPath(); g.moveTo(38, gy); for (let x = 38; x <= W - 38; x += 9) g.lineTo(x, gy + sin(x * .05) * 2); g.stroke();
    const Rh = rng(3); g.lineWidth = .8; g.strokeStyle = INK + '55'; for (let i = 0; i < 180; i++) { const x = 40 + Rh() * (W - 80), y = gy + 4 + Rh() * Rh() * 150, l = 8 + Rh() * 22; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + Rh() * 2); g.stroke(); }
    if (o.roots) { roots(g, cx, gy, weeks.length, o.roots, (l, col) => { const e = taper(g, l.pts, '#1a140e'); g.strokeStyle = col; g.lineWidth = .9; path(g, e.L); path(g, e.R); }); rootLabels(g, W, H - 26, o.rootNames); }
    const hits = plateTree(g, weeks, cx, gy, o);
    g.restore();
    if (o.title) { g.fillStyle = INK; g.font = '600 24px Georgia, serif'; g.fillText(o.title, 44, 60); }
    return hits;
  }

  /* ---------- willow: each week is one tress, and the crown parts around the trunk ---------- */
  const WILLOW = [['#5f6f3a', '#8a8f4c', '#b3a95f'], ['#3f6b6a', '#6a9690', '#a3c6bc'], ['#3f8058', '#66a872', '#a2cf8e'], ['#27694c', '#3f8f60', '#6ab87a']];
  const WILLOW_BARK = ['#141c1b', '#2c3a36', '#6d8880', '#0c1211'];
  function willowTree(g, weeks, cx, wl, o) {
    const n = weeks.length, f = .42 + .58 * min(1, n / 30), G = min(1.05, sqrt(n / 40)), th = 150 * f + 34, w0 = 18 + 44 * f, B = barkOf(o) || WILLOW_BARK, hits = [];
    const RX = 64 + 320 * G, RY = 26 + 170 * G, domeTop = wl - th - 26 - 205 * G, dome = u => [cx + u * RX, domeTop + u * u * RY];
    const headX = cx + sin(th * .019) * 16 * f, limbs = [], tresses = [];
    for (let i = 0; i < n; i++) {
      const W_ = weeks[i], R = rng(3000 + i * 31), s = min(W_.s, 16), age = (n - 1 - i) / 40, fan = (((i * .618) % 1) * 2 - 1) * .94, [tx, ty] = dome(fan), x0 = headX + fan * w0 * .3, y0 = wl - th + R() * 20;
      const pts = [], w = (W_.empty ? 3 : 4.5 + s * .5) * (1 + .6 * sqrt(age)), N = 16, mx = lerp(x0, tx, .35), my = ty - 16 - abs(fan) * 26;
      for (let k = 0; k <= N; k++) { const q = k / N, a = (1 - q) * (1 - q), b = 2 * q * (1 - q), c = q * q; pts.push({ x: a * x0 + b * mx + c * tx + (R() - .5) * 2.4, y: a * y0 + b * my + c * ty + (R() - .5) * 2.4, w: lerp(w, 1.1, q) }); }
      limbs.push({ pts, W: W_, front: i % 3 !== 0 });
      if (W_.empty) { hits.push({ i, x: tx, y: ty }); continue; }
      const cnt = 3 + round(s * .75), spread = (.04 + s * .006) * (1.2 - G * .4), strands = [];
      for (let k = 0; k < cnt; k++) {
        const u = fan + (R() - .5) * spread * 2, [px, py0] = dome(u), py = py0 + R() * 16, near = abs(px - cx) < th * .6;
        strands.push({ x: px, y: py, drop: (wl - py - 3) * (near ? .42 + R() * .14 : .66 + R() * .34), sw: u * 20 + (R() - .5) * 7, tone: R() < .3 ? 2 : R() < .6 ? 1 : 0, seed: R() * 1e6 | 0 });
      }
      tresses.push({ strands, W: W_, front: i % 3 !== 0, R, fan });
      hits.push({ i, x: tx, y: ty + 30 }); hits.push({ i, x: tx, y: lerp(ty, wl, .6) });
    }
    const strand = (st, W_, lit) => {
      const R = rng(st.seed), custom = LEAVES[o.leaf], T = custom ? [custom[1], custom[2], custom[3]] : WILLOW[W_.season], col = lit ? T[st.tone] : (custom ? custom[0] : '#153a38');
      g.strokeStyle = col; g.globalAlpha = lit ? .75 : .9; g.lineWidth = 1; g.beginPath(); g.moveTo(st.x, st.y); g.bezierCurveTo(st.x + st.sw * .1, st.y + st.drop * .4, st.x + st.sw * .8, st.y + st.drop * .7, st.x + st.sw, st.y + st.drop); g.stroke(); g.globalAlpha = 1;
      const c = floor(st.drop / 8); g.fillStyle = col;
      for (let m = 1; m <= c; m++) { const u = m / c, x = st.x + st.sw * (u * u * (3 - 2 * u)), y = st.y + st.drop * u, sd = m % 2 ? .55 : -.55, sz = 3.8 * (1 - u * .35) + R() * .8; g.beginPath(); g.ellipse(x + sd * 4, y, 1.05, sz, sd, 0, TAU); g.fill(); }
    };
    tresses.filter(t => !t.front).forEach(t => t.strands.forEach(st => strand(st, t.W, false)));
    const limbB = [B[0], B[1], B === WILLOW_BARK ? '#5f7d72' : B[2], B[0]];
    limbs.filter(l => !l.front).forEach(l => woodLimb(g, l, limbB));
    const tp = []; for (let h = 0; h <= th; h += 5) tp.push({ x: cx + sin(h * .019) * 16 * f, y: wl - h, w: lerp(w0, w0 * .62, h / th) * (1 + .6 * exp(-h / 20)) + sin(h * .13) * 3 });
    const grad = g.createLinearGradient(cx - w0, 0, cx + w0, 0); grad.addColorStop(0, B[0]); grad.addColorStop(.6, B[1]); grad.addColorStop(1, B[2]); taper(g, tp, grad);
    const Rb = rng(19); for (let k = 0; k < 9; k++) { const u = -.42 + k * .1, ph = Rb() * 9; g.strokeStyle = k > 6 ? B[2] + '55' : B[3]; g.lineWidth = 1 + Rb() * 1.6; g.beginPath(); tp.forEach((p, i) => { const x = p.x + u * p.w + sin(i * .35 + ph) * 3.2; i ? g.lineTo(x, p.y) : g.moveTo(x, p.y); }); g.stroke(); }
    [[.34, -.14], [.6, .16]].forEach(([q, u]) => { const p = tp[floor(tp.length * q)]; g.strokeStyle = B[3]; g.lineWidth = 2; g.beginPath(); g.ellipse(p.x + u * p.w, p.y, p.w * .13, p.w * .2, .2, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(p.x + u * p.w, p.y, p.w * .06, p.w * .1, .2, 0, TAU); g.stroke(); });
    limbs.filter(l => l.front).forEach(l => woodLimb(g, l, l.W.empty ? ['#3a433f', '#7c8680', '#a8b0ab', '#3a433f'] : limbB));
    tresses.filter(t => t.front).forEach(t => t.strands.forEach(st => strand(st, t.W, true)));
    const fl = flowerOf(o, ['#f6e6a4', '#fff9de', '#a98a34']);
    tresses.forEach(t => { const R = t.R, at = () => { const st = pickOf(R, t.strands), u = .55 + R() * .42; return [st.x + st.sw * (u * u * (3 - 2 * u)), st.y + st.drop * u]; };
      for (let i = 0; i < min(t.W.f, 2); i++) { const [x, y] = at(); bloom(g, x, y, 4.6, fl); } if (t.W.back) { const [x, y] = at(); bud(g, x, y, 1); } if (t.W.rare) { const [x, y] = at(); bloom(g, x, y, 9.5, RARE); } });
    return { hits, strands: tresses.flatMap(t => t.strands) };
  }
  function willow(g, W, H, weeks, o) {
    const wl = 548, cx = W / 2 - 30, s = g.createLinearGradient(0, 0, 0, wl), n = weeks.length, f = .42 + .58 * min(1, n / 30);
    s.addColorStop(0, '#07131d'); s.addColorStop(.7, '#0e2a33'); s.addColorStop(1, '#1b4a4c'); g.fillStyle = s; g.fillRect(0, 0, W, wl);
    const R0 = rng(12); for (let i = 0; i < 130; i++) { g.globalAlpha = .2 + R0() * .6; g.fillStyle = '#dfeee6'; g.beginPath(); g.arc(R0() * W, R0() * wl * .7, R0() < .1 ? 1.4 : .8, 0, TAU); g.fill(); } g.globalAlpha = 1;
    const mx = W * .86, my = 92, hl = g.createRadialGradient(mx, my, 20, mx, my, 230); hl.addColorStop(0, '#f2eecb66'); hl.addColorStop(1, '#f2eecb00'); g.fillStyle = hl; g.fillRect(mx - 230, my - 230, 460, 460); g.fillStyle = '#f4efd2'; g.beginPath(); g.arc(mx, my, 40, 0, TAU); g.fill(); g.fillStyle = '#dcd8b4'; [[-13, -9, 9], [15, 10, 7], [-6, 20, 5], [18, -16, 4]].forEach(([a, b, r]) => { g.beginPath(); g.arc(mx + a, my + b, r, 0, TAU); g.fill(); });
    g.fillStyle = '#0c2029'; g.beginPath(); g.moveTo(0, wl); for (let x = 0; x <= W; x += 8) g.lineTo(x, wl - 62 - sin(x * .008 + 1) * 28 - sin(x * .023) * 9); g.lineTo(W, wl); g.fill();
    const d = g.createLinearGradient(0, wl, 0, H); d.addColorStop(0, '#0d2a30'); d.addColorStop(1, '#030a0e'); g.fillStyle = d; g.fillRect(0, wl, W, H - wl);
    const Rm = rng(21); for (let i = 0; i < 26; i++) { const y = wl + 6 + i * 7, w2 = 14 + Rm() * 60 * (1 - i / 30); g.fillStyle = `rgba(244,239,210,${.32 - i * .011})`; g.fillRect(mx - w2 + (Rm() - .5) * 18, y, w2 * 2, 1.6); }
    if (o.roots) {
      roots(g, cx, wl + 2, n, o.roots, (l, col) => { g.globalAlpha = .16; taper(g, l.pts.map(p => ({ x: p.x, y: p.y, w: p.w + 8 })), col); g.globalAlpha = 1; taper(g, l.pts, '#2c4a48'); g.strokeStyle = col; g.lineWidth = 1; g.globalAlpha = .9; g.beginPath(); l.pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); g.globalAlpha = 1; });
      rootLabels(g, W, H, o.rootNames);
    }
    g.fillStyle = '#132a27'; g.beginPath(); g.ellipse(cx, wl + 2, 150 * f + 40, 20 * f + 8, 0, Math.PI, TAU); g.fill(); g.fillStyle = '#1f4034'; g.beginPath(); g.ellipse(cx - 10, wl - 3, 118 * f + 30, 14 * f + 5, 0, Math.PI, TAU); g.fill();
    const res = willowTree(g, weeks, cx, wl, o);
    g.strokeStyle = '#7fb5ae66'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, wl); g.lineTo(W, wl); g.stroke();
    const Rw = rng(44); res.strands.forEach((st, i) => { if (i % 4 || st.y + st.drop < wl - 10) return; g.strokeStyle = '#8fc4bc55'; g.beginPath(); g.ellipse(st.x + st.sw, wl + 1, 8 + Rw() * 12, 1.6, 0, 0, TAU); g.stroke(); });
    [[60, 8, 14], [120, 3, 26], [214, 7, 18], [650, 4, 16], [770, 5, 30], [862, 9, 20]].forEach(([x, dy, r], i) => { g.fillStyle = '#1b5245'; g.beginPath(); g.ellipse(x, wl + dy, r, r * .24, 0, .35, TAU); g.lineTo(x, wl + dy); g.fill(); g.fillStyle = '#2f7560'; g.beginPath(); g.ellipse(x - r * .15, wl + dy - 1, r * .55, r * .11, 0, 0, TAU); g.fill();
      if (i % 2) { for (let k = -2; k <= 2; k++) { g.fillStyle = abs(k) === 2 ? '#d98fb0' : '#f4cadb'; g.beginPath(); g.ellipse(x + k * 3.6, wl + dy - 8 + abs(k) * 1.2, 2.9, 7.4, k * .34, 0, TAU); g.fill(); } g.fillStyle = '#f3dc8d'; g.beginPath(); g.ellipse(x, wl + dy - 6, 3, 1.8, 0, 0, TAU); g.fill(); } });
    return res.hits;
  }

  /* ---------- pine: tiers of cloud-pruned needles (a shop item) ---------- */
  const NEEDLE = [['#16352a', '#245038', '#3b7350', '#7fb782'], ['#1a3b3a', '#2b5a58', '#4e8783', '#a2d0c4'], ['#1e4630', '#2f6c43', '#54985e', '#a8d68a'], ['#143b29', '#20593a', '#3e8552', '#83c37f']];
  function pineTree(g, weeks, cx, gy, o) {
    const n = weeks.length, nn = min(1.1, n / 40), f = .4 + .6 * min(1, n / 30), top = 140 + 330 * pow(nn, .7), w0 = 12 + 30 * sqrt(nn), B = barkOf(o) || ['#201813', '#4a3a2d', '#7f6a54', '#1a120d'], hits = [];
    const xAt = h => cx + sin(h * .0125 - .6) * 64 * min(1, h / 180), pts = []; for (let h = 0; h <= top; h += 6) pts.push({ x: xAt(h), y: gy + 14 - h, w: lerp(w0, 3, h / top) * (1 + .5 * exp(-h / 24)) });
    const pads = [], tiers = max(2, Math.ceil(n / 5));
    for (let i = 0; i < n; i++) {
      const W_ = weeks[i], R = rng(5100 + i * 53), tier = floor(i / 5), j = i % 5, side = tier % 2 ? 1 : -1, age = (n - 1 - i) / 40, s = min(W_.s, 16);
      const h = 124 + (top - 150) * tier / max(1, tiers - 1), x0 = xAt(h), y0 = gy + 14 - h, full = (150 + max(0, 7 - tier) * 18) * (.6 + .4 * f) * (1 - tier / tiers * .35);
      const q = (j + 1) / 5, x1 = x0 + side * full * q, y1 = y0 - 16 - full * q * .1, ty = y1 - 6 - (j % 2) * 13 + (j === 4 ? 4 : 0), limb = [];
      if (j === 0) for (let k = 0; k <= 14; k++) { const u = k / 14; limb.push({ x: x0 + side * full * u, y: y0 - 16 * u - full * u * .1 + sin(u * 3.14) * 14, w: lerp(6 + w0 * .17, 2, u) }); }
      pads.push({ W: W_, limb, x: x1, y: ty, rx: W_.empty ? 0 : 27 + s * 2.2 + age * 10, ry: W_.empty ? 0 : 10 + s * .55 + age * 3, R, sub: W_.empty ? [] : [[-.42, 4, .5], [.46, -1, .56], [.12, -9, .6]] });
      hits.push({ i, x: x1, y: ty });
    }
    pads.forEach(p => { if (p.limb.length) woodLimb(g, { pts: p.limb }, B); if (p.W.empty) { const r = p.R, x = p.x, y = p.y + 6; g.strokeStyle = '#8b8378'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y + 12); g.lineTo(x + 7 * (r() - .5), y - 10); g.moveTo(x, y + 2); g.lineTo(x + 12, y - 8); g.moveTo(x, y + 4); g.lineTo(x - 12, y - 6); g.stroke(); } });
    const grad = g.createLinearGradient(cx - 70, 0, cx + 70, 0); grad.addColorStop(0, B[0]); grad.addColorStop(.6, B[1]); grad.addColorStop(1, B[2]); taper(g, pts, grad);
    const Rb = rng(14); pts.forEach((p, i) => { if (i % 2 || p.w < 5) return; for (let k = 0; k < p.w / 4; k++) { if (Rb() < .4) continue; const u = -.44 + Rb() * .88, l = 3 + Rb() * p.w * .28; g.strokeStyle = u > .1 ? B[2] + '55' : B[3]; g.lineWidth = 1 + Rb(); g.beginPath(); g.moveTo(p.x + u * p.w - l, p.y + Rb() * 3 - 1.5); g.lineTo(p.x + u * p.w + l, p.y - Rb() * 3 + 1.5); g.stroke(); } });
    const pad = (x, y, rx, ry, P, R) => {
      g.fillStyle = P[0]; g.beginPath(); g.ellipse(x, y + ry * .25, rx * 1.03, ry, 0, 0, TAU); g.fill();
      const N = floor(rx * ry * .55);
      for (let i = 0; i < N; i++) { const a = R() * TAU, r = sqrt(R()), px = x + cos(a) * r * rx, py = y + sin(a) * r * ry, lit = -(py - y) / ry * .8 - (px - x) / rx * .25 + (R() - .5) * .4; g.strokeStyle = lit > .55 ? P[3] : lit > .05 ? P[2] : P[1]; g.lineWidth = 1.05; const an = -Math.PI / 2 + (px - x) / rx * .9 + (R() - .5) * .8, l = 4 + R() * 5; g.beginPath(); g.moveTo(px, py); g.lineTo(px + cos(an) * l, py + sin(an) * l); g.stroke(); }
    };
    const R2 = rng(202), fl = flowerOf(o, ['#f3dd9a', '#fff5cf', '#a07f2c']);
    pads.slice().sort((a, b) => a.y - b.y).forEach(p => { if (p.W.empty) return; const P = LEAVES[o.leaf] || NEEDLE[p.W.season]; p.sub.forEach(([dx, dy, k]) => pad(p.x + dx * p.rx * 1.3, p.y + dy, p.rx * k, p.ry * k + 2, P, p.R)); pad(p.x, p.y, p.rx, p.ry, P, p.R); for (let i = 0; i < min(p.W.f, 3); i++) bloom(g, p.x + (R2() - .5) * p.rx * 1.6, p.y - R2() * p.ry, 5, fl); if (p.W.back) bud(g, p.x, p.y - p.ry, 1); if (p.W.rare) bloom(g, p.x + p.rx * .3, p.y - p.ry * .6, 10, RARE); });
    return hits;
  }
  function pine(g, W, H, weeks, o) {
    const gy = 540, cx = W / 2, n = weeks.length, f = .4 + .6 * min(1, n / 30), s = g.createLinearGradient(0, 0, 0, gy); s.addColorStop(0, '#0a1420'); s.addColorStop(1, '#1d3a44'); g.fillStyle = s; g.fillRect(0, 0, W, gy);
    const mx = W * .18, my = 118, hl = g.createRadialGradient(mx, my, 30, mx, my, 300); hl.addColorStop(0, '#f0ecd066'); hl.addColorStop(1, '#f0ecd000'); g.fillStyle = hl; g.fillRect(0, 0, 500, 430); g.fillStyle = '#f2eed4'; g.beginPath(); g.arc(mx, my, 70, 0, TAU); g.fill(); g.fillStyle = '#ddd9ba'; [[-20, -12, 13], [24, 16, 9], [-10, 32, 6], [28, -28, 6]].forEach(([a, b, r]) => { g.beginPath(); g.arc(mx + a, my + b, r, 0, TAU); g.fill(); });
    g.fillStyle = '#10222c'; g.beginPath(); g.moveTo(0, gy); for (let x = 0; x <= W; x += 8) g.lineTo(x, gy - 40 - sin(x * .01 + 2) * 18); g.lineTo(W, gy); g.fill();
    const gr = g.createLinearGradient(0, gy, 0, gy + 60); gr.addColorStop(0, '#39454a'); gr.addColorStop(1, '#232c30'); g.fillStyle = gr; g.fillRect(0, gy, W, 60);
    g.strokeStyle = '#596a70'; g.lineWidth = 1; for (let r = 1; r < 16; r++) { g.beginPath(); g.ellipse(cx, gy + 18, r * 58, r * 7, 0, 0, TAU); g.stroke(); }
    const d = g.createLinearGradient(0, gy + 60, 0, H); d.addColorStop(0, '#141510'); d.addColorStop(1, '#070806'); g.fillStyle = d; g.fillRect(0, gy + 60, W, H - gy - 60);
    if (o.roots) { roots(g, cx, gy + 16, n, o.roots, (l, col) => { const e = taper(g, l.pts, '#3a3026'); if (l.pts[0].w > 2) { g.strokeStyle = col; g.lineWidth = 1.1; g.globalAlpha = .8; path(g, e.L); g.globalAlpha = 1; } }); rootLabels(g, W, H, o.rootNames); }
    g.fillStyle = '#232c30'; g.beginPath(); g.ellipse(cx, gy + 20, 96 * f + 20, 13, 0, Math.PI, TAU); g.fill(); g.fillStyle = '#39603f'; g.beginPath(); g.ellipse(cx, gy + 16, 80 * f + 18, 11, 0, Math.PI, TAU); g.fill();
    const hits = pineTree(g, weeks, cx, gy, o);
    const lx = W * .82, ly = gy + 24, st = '#5e6568', st2 = '#7f878a', st3 = '#3b4144'; g.fillStyle = '#20282b'; g.beginPath(); g.ellipse(lx, ly + 2, 52, 9, 0, 0, TAU); g.fill();
    g.fillStyle = st3; g.fillRect(lx - 22, ly - 12, 44, 12); g.fillStyle = st; g.fillRect(lx - 9, ly - 74, 18, 62); g.fillStyle = st2; g.fillRect(lx + 2, ly - 74, 7, 62);
    g.fillStyle = st; g.fillRect(lx - 26, ly - 84, 52, 10); const hg = g.createRadialGradient(lx, ly - 104, 2, lx, ly - 104, 66); hg.addColorStop(0, '#ffcf7a88'); hg.addColorStop(1, '#ffcf7a00'); g.fillStyle = hg; g.fillRect(lx - 66, ly - 170, 132, 132); g.fillStyle = st3; g.fillRect(lx - 20, ly - 122, 40, 38); g.fillStyle = '#ffd98a'; g.fillRect(lx - 11, ly - 116, 22, 26);
    g.fillStyle = st; g.beginPath(); g.moveTo(lx - 44, ly - 120); g.quadraticCurveTo(lx, ly - 136, lx + 44, ly - 120); g.quadraticCurveTo(lx + 16, ly - 134, lx, ly - 160); g.quadraticCurveTo(lx - 16, ly - 134, lx - 44, ly - 120); g.fill(); g.fillStyle = st2; g.beginPath(); g.arc(lx, ly - 163, 6, 0, TAU); g.fill();
    return hits;
  }

  /* ---------- holo: the tree projected in wire and points ---------- */
  const HOLO = { br_bark: ['#2fd6ea', '#46e6f8', '#127f92'], br_ash: ['#dfe6ea', '#ffffff', '#7f8a92'], br_ebony: ['#8a7dff', '#b9afff', '#4b4296'], br_gold: ['#f0c75c', '#ffe08f', '#8a6a1e'], br_verdigris: ['#3fe0b0', '#7ff5d2', '#1a8468'], br_ember: ['#ff7a4d', '#ffab8a', '#a23c1c'] };
  function holoTree(g, weeks, cx, gy, o) {
    const tr = yearTree(weeks, cx, gy), C = HOLO[o.bark] || HOLO.br_bark, L = LEAVES[o.leaf], fl = FLOWERS[o.flower] && o.flower !== 'fl_gold' ? FLOWERS[o.flower][0] : '#ff5ae0';
    const ln = (pts, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); };
    const Rd = rng(81);
    const lay = wk => {
      const dim = wk.W.empty ? '#4c6a7c' : wk.behind ? C[2] : C[0];
      wk.out.limbs.forEach(l => { if (wk.W.empty) g.setLineDash([4, 5]); if (!l.order) ln(l.pts, dim + '33', 5); ln(l.pts, dim, l.order ? .8 : 1.4); g.setLineDash([]); });
      if (wk.W.empty) return;
      wk.out.tips.forEach(t => { for (let i = 0; i < 12; i++) { const a = Rd() * TAU, r = sqrt(Rd()) * (14 + min(wk.W.s, 16) * .9) * tr.sc; g.fillStyle = L ? (wk.behind ? L[1] : Rd() < .2 ? L[3] : L[2]) : wk.behind ? C[2] : Rd() < .2 ? '#c8fbff' : '#38e0f2'; const s = Rd() < .15 ? 2.2 : 1.3; g.fillRect(t.x + cos(a) * r, t.y + sin(a) * r * .85, s, s); } });
    };
    tr.weeks.filter(w => w.behind).forEach(lay);
    tr.boughs.forEach(l => { ln(l.pts, C[0] + '33', 6); ln(l.pts, C[1], 1.5); });
    [-.5, -.25, 0, .25, .5].forEach(u => ln(tr.trunk.map(p => ({ x: p.x + u * p.w, y: p.y })), C[1], u === 0 ? .6 : 1));
    tr.trunk.forEach((p, i) => { if (i % 4 || p.w < 5) return; g.strokeStyle = C[0]; g.lineWidth = .8; g.beginPath(); g.ellipse(p.x, p.y, p.w / 2, p.w * .11, 0, 0, TAU); g.stroke(); });
    tr.weeks.filter(w => !w.behind).forEach(lay);
    tr.weeks.forEach(wk => {
      if (wk.W.empty) return; const R = rng(wk.W.i + 66), T = wk.out.tips; if (!T.length) return;
      for (let i = 0; i < min(wk.W.f, 3); i++) { const p = pickOf(R, T); g.fillStyle = fl + '55'; g.beginPath(); g.arc(p.x, p.y, 8, 0, TAU); g.fill(); g.save(); g.translate(p.x, p.y); g.rotate(Math.PI / 4); g.fillStyle = fl; g.fillRect(-3.4, -3.4, 6.8, 6.8); g.restore(); }
      if (wk.W.back) { const p = pickOf(R, T); g.strokeStyle = '#d6fff0'; g.lineWidth = 1.5; g.beginPath(); g.arc(p.x, p.y, 7, 0, TAU); g.stroke(); g.fillStyle = '#d6fff0'; g.fillRect(p.x - 2, p.y - 2, 4, 4); }
      if (wk.W.rare) { const p = pickOf(R, T); g.save(); g.translate(p.x, p.y); g.fillStyle = '#bfe3ff'; g.rotate(Math.PI / 4); g.fillRect(-6, -6, 12, 12); g.fillStyle = '#04060c'; g.fillRect(-3, -3, 6, 6); g.restore(); }
    });
    return tr;
  }
  function holo(g, W, H, weeks, o) {
    g.fillStyle = '#04060c'; g.fillRect(0, 0, W, H);
    const gy = 590, cx = W / 2 - 6, C = HOLO[o.bark] || HOLO.br_bark;
    g.strokeStyle = '#0c1426'; g.lineWidth = 1; for (let x = -W; x < W * 2; x += 56) { g.beginPath(); g.moveTo(cx + (x - cx) * .24, gy); g.lineTo(cx + (x - cx) * 1.3, H); g.stroke(); } for (let k = 0; k < 6; k++) { const y = gy + 6 + k * k * 4.6; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const cone = g.createLinearGradient(0, gy, 0, 90); cone.addColorStop(0, C[0] + '30'); cone.addColorStop(1, C[0] + '03'); g.fillStyle = cone; g.beginPath(); g.moveTo(cx - 92, gy); g.lineTo(cx - 430, 40); g.lineTo(cx + 430, 40); g.lineTo(cx + 92, gy); g.fill();
    const tr = holoTree(g, weeks, cx, gy, o);
    g.fillStyle = 'rgba(4,6,12,.32)'; for (let y = 0; y < gy; y += 4) g.fillRect(0, y, W, 1.4);
    // HUD tags on the heaviest weeks
    const used = []; tr.weeks.filter(w => !w.W.empty && w.out.tips.length).sort((a, b) => b.W.s - a.W.s).forEach(wk => {
      if (used.length >= 4) return; const p = wk.out.tips.reduce((a, b) => (abs(b.x - cx) > abs(a.x - cx) ? b : a)), side = p.x < cx ? -1 : 1, by = clamp(p.y - 22, 60, gy - 60); if (used.some(u => u.s === side && abs(u.y - by) < 80)) return; used.push({ s: side, y: by });
      const bx = side < 0 ? 40 : W - 40 - 158, ex = side < 0 ? bx + 158 : bx; g.strokeStyle = C[1]; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(ex, by + 18); g.stroke();
      g.fillStyle = '#04101cdd'; g.fillRect(bx, by, 158, 37); g.strokeStyle = C[0]; g.lineWidth = 1.4; g.beginPath(); [[0, 9, 0, 0, 12, 0], [146, 0, 158, 0, 158, 9], [158, 28, 158, 37, 146, 37], [12, 37, 0, 37, 0, 28]].forEach(a => { g.moveTo(bx + a[0], by + a[1]); g.lineTo(bx + a[2], by + a[3]); g.lineTo(bx + a[4], by + a[5]); }); g.stroke();
      g.font = '500 13px ui-monospace, Consolas, monospace'; g.fillStyle = '#e4fcff'; g.fillText('WEEK ' + String(wk.W.i + 1).padStart(2, '0'), bx + 10, by + 16); g.fillStyle = '#7fb9c6'; g.font = '500 12px ui-monospace, Consolas, monospace'; g.fillText(wk.W.s + ' SESS', bx + 10, by + 30); g.fillStyle = '#ff7ae6'; g.fillText(wk.W.f + ' FLOW', bx + 80, by + 30);
    });
    g.fillStyle = '#121a28'; g.beginPath(); g.ellipse(cx, gy + 4, 120, 22, 0, 0, TAU); g.fill(); g.strokeStyle = C[1]; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, gy, 96, 15, 0, 0, TAU); g.stroke(); g.strokeStyle = C[2]; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, gy, 72, 10, 0, 0, TAU); g.stroke();
    if (o.roots) {
      const ln = (pts, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); };
      roots(g, cx, gy + 18, weeks.length, o.roots, (l, col) => { ln(l.pts, col + '44', l.pts[0].w + 3); ln(l.pts, col, max(1, l.pts[0].w * .38)); });
      rootLabels(g, W, H, o.rootNames);
    }
    return hitsOf(tr);
  }

  /* ---------- pixel: true pixels. Large masses, hard bands, no noise, shown at a whole-number scale ---------- */
  const FONT = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111' };
  const norm = s => String(s).toUpperCase().normalize('NFD').replace(/[^A-Z ]/g, '');
  const ptxt = (g, s, x, y, c) => { g.fillStyle = c; [...norm(s)].forEach((ch, i) => { const b = FONT[ch]; if (!b) return; [...b].forEach((v, k) => { if (v === '1') g.fillRect(x + i * 4 + k % 3, y + floor(k / 3), 1, 1); }); }); };
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(round(x), round(y), w, h); };
  const PXS = [['#3a1d24', '#8a3e2c', '#c4682f', '#f0a648'], ['#1f3442', '#3f6e78', '#74a5a3', '#c4e0d4'], ['#27402f', '#3f8a5a', '#83bd66', '#f2bdb9'], ['#163a33', '#256b4e', '#47a160', '#9bd072']];
  const PX_BARK = { br_bark: ['#3a2230', '#6e4634', '#a56c47'], br_ash: ['#5e5a5c', '#a8a29c', '#e6e0d6'], br_ebony: ['#0f0c14', '#2a2430', '#544a5e'], br_gold: ['#6a4610', '#b98a2c', '#f2d06c'], br_verdigris: ['#144238', '#2f7a6c', '#6cc4ad'], br_ember: ['#40120c', '#8a2e1c', '#d0602e'] };
  function pClump(g, cx, cy, r, P, seed) {
    cx = round(cx); cy = round(cy); r = round(r);
    const R0 = r + 3, edge = (dx, dy) => r + .4 + sin(atan2(dy, dx) * 8 + seed) * .75;
    for (let y = -R0; y <= R0; y++) for (let x = -R0; x <= R0; x++) {
      const d = hypot(x, y * 1.12), e = edge(x, y);
      if (d <= e) { const l = (x * .45 - y * .9) / r; px(g, cx + x, cy + y, 1, 1, l > .42 ? P[3] : l > -.22 ? P[2] : P[1]); }
      else if (d <= e + 1) px(g, cx + x, cy + y, 1, 1, y > 0 ? P[0] : P[1]); // dark only underneath: the clumps melt into one crown
    }
    for (let y = -r + 1; y < r; y += 4) for (let x = -r + ((y + 40) % 8 ? 0 : 2); x < r; x += 4) { const d = hypot(x, y * 1.12), l = (x * .45 - y * .9) / r; if (d < r - 2 && l > -.22 && l <= .42) { px(g, cx + x, cy + y, 2, 1, P[3]); px(g, cx + x, cy + y + 1, 1, 1, P[3]); } else if (d < r - 2 && l <= -.22) px(g, cx + x, cy + y, 2, 1, P[2]); }
  }
  const FRUIT = (g, x, y, c) => { x = round(x); y = round(y); px(g, x, y - 2, 1, 1, '#3a1d24'); px(g, x - 1, y - 1, 3, 3, c[0]); px(g, x - 1, y - 1, 1, 1, c[1]); px(g, x + 1, y + 1, 1, 1, c[2]); };
  const SPROUT = (g, x, y) => { x = round(x); y = round(y); px(g, x, y - 1, 1, 3, '#d6ffe9'); px(g, x - 1, y - 2, 1, 1, '#8ff2c8'); px(g, x + 1, y - 2, 1, 1, '#8ff2c8'); };
  const RAREP = (g, x, y) => { x = round(x); y = round(y); [[0, -2], [-2, 0], [2, 0], [0, 2]].forEach(([a, b]) => px(g, x + a, y + b, 1, 1, '#b7e0ff')); px(g, x - 1, y - 1, 3, 3, '#e8f6ff'); px(g, x, y, 1, 1, '#f5b53c'); };
  const PX_FRUIT = { fl_gold: ['#f5b53c', '#fff0a8', '#c07a1f'], fl_plum: ['#f5e6ea', '#ffffff', '#b5476a'], fl_camellia: ['#d03a4a', '#f08a90', '#8a1f2c'], fl_star: ['#9fd0ff', '#e4f3ff', '#5f8fd0'] };
  function pTree(g, weeks, cx, gy, o) {
    const n = weeks.length, room = max(n, 40), k01 = min(1, sqrt(n / 40)), hT = round(13 + 17 * k01), wT = 3 + round(k01 * 8), RX = 74, RY = 41, top = gy - hT - round(22 * k01), rMax = sqrt((n - .5) / room);
    const cy = gy - hT - RY * rMax * .72, items = [], B = PX_BARK[o.bark] || PX_BARK.br_bark, custom = LEAVES[o.leaf], palFor = W => (custom ? [custom[0], custom[1], custom[2], custom[3]] : PXS[W.season]), fruit = PX_FRUIT[o.flower] || PX_FRUIT.fl_gold;
    for (let i = 0; i < n; i++) {
      // Sunflower spiral: the crown is one full dome and it widens from the inside out, so old clumps never move
      const W_ = weeks[i], R = rng(9100 + i * 37), ph = i * 2.399, rho = sqrt((i + .5) / room), s = min(W_.s, 16);
      items.push({ W: W_, x: cx + cos(ph) * rho * RX, y: cy + sin(ph) * rho * RY * (sin(ph) > 0 ? .72 : 1), r: W_.empty ? 0 : 6 + s * .3, side: cos(ph) >= 0 ? 1 : -1, behind: i % 3 === 0, R, seed: i * 1.7 });
    }
    const limb = it => { const x0 = cx + it.side * round(wT * .25), y0 = gy - hT + 2, c = it.W.empty ? '#a08f84' : B[0], st = max(abs(it.x - x0), abs(it.y - y0)), th = it.W.empty ? 1 : 2; for (let k = 0; k <= st; k++) { const q = st ? k / st : 1; px(g, lerp(x0, it.x, q * q), lerp(y0, it.y, q), th, th, c); } };
    // One dark mass behind the clumps, so the crown reads as one tree and not as loose balloons
    const dark = custom ? custom[0] : '#23323a'; items.forEach(it => { if (it.W.empty) return; const r = round(it.r + 2), x0 = round(it.x), y0 = round(it.y); for (let y = -r; y <= r; y++) { const hw = round(sqrt(max(0, r * r - y * y))); px(g, x0 - hw, y0 + y, hw * 2 + 1, 1, dark); } });
    const clump = it => { if (it.W.empty) return; pClump(g, it.x, it.y, it.r, palFor(it.W), it.seed); };
    items.filter(i => !i.W.empty).forEach(limb);
    items.filter(i => i.behind).sort((a, b) => a.y - b.y).forEach(clump);
    for (let y = gy + 2; y >= top; y--) { const q = (gy - y) / (gy - top), w = max(2, round(lerp(wT, 2, q * q)) + (y > gy - 5 ? 6 - (gy - y) : 0)), x0 = round(cx - w / 2); px(g, x0, y, w, 1, B[1]); px(g, x0, y, max(1, round(w * .34)), 1, B[0]); px(g, x0 + w - max(1, round(w * .2)), y, max(1, round(w * .2)), 1, B[2]); if (w > 4 && (y + floor(cx)) % 7 === 0) px(g, x0 + round(w * .45), y, 2, 1, B[0]); }
    items.filter(i => !i.behind).sort((a, b) => a.y - b.y).forEach(clump);
    items.filter(i => i.W.empty).forEach(limb);
    items.forEach(it => { if (it.W.empty) return; const R = it.R, rr = it.r * .8; for (let i = 0; i < min(it.W.f, 2); i++) FRUIT(g, it.x + (R() - .5) * 2 * rr, it.y + (R() - .5) * 2 * rr * .8, fruit); if (it.W.back) SPROUT(g, it.x, it.y - it.r); if (it.W.rare) RAREP(g, it.x + rr * .4, it.y - rr * .3); });
    return items.map(it => ({ i: it.W.i, x: it.x, y: it.y }));
  }
  function pRoots(g, n, cx, gy, H, list) {
    const f = .4 + .6 * min(1, n / 30);
    list.forEach((v, i) => {
      const R = rng(i * 7 + 2), dir = i - 1, tips = 1 + round(v * 3), w0 = max(1, round(1 + v * 3.4 * f));
      for (let b = 0; b < tips; b++) {
        let x = cx + dir * 2, y = gy + 2, w = b ? 1 : w0; const dx = dir + (b ? (b % 2 ? .7 : -.7) : 0), l = (b ? 16 : 26) * (v + .35) * f * 1.5;
        for (let k = 0; k < l && y < H - 9; k++) { px(g, round(x), round(y), w, 1, ROOT_COL[i]); if (w > 1) px(g, round(x), round(y), 1, 1, '#2a1a22'); x += dx * .75 + (k % 5 === 0 ? (R() - .5) * .6 : 0); y += .62; if (k > l * .5 && w > 1) w--; }
      }
    });
  }
  function pixel(g, W, H, weeks, o) {
    const gy = 116, B = ['#2e1f45', '#4a2a55', '#7a3c63', '#b05a68', '#e08868', '#f4b77a'], hb = [18, 16, 15, 13, 12, 10]; let y = 0;
    B.forEach((c, i) => { px(g, 0, y, W, hb[i], c); y += hb[i]; });
    [[16, 6], [40, 10], [70, 4], [120, 8], [160, 12], [186, 5], [28, 20], [100, 18], [176, 22]].forEach(([a, b]) => px(g, a, b, 1, 1, '#f3e3cf'));
    const sx = 158, sy = 72, sr = 17; for (let yy = -sr; yy <= sr; yy++) { const hw = round(sqrt(sr * sr - yy * yy)); if (yy > 2 && (yy % 4 === 0 || (yy > 9 && yy % 4 === 1))) continue; px(g, sx - hw, sy + yy, hw * 2, 1, yy < -5 ? '#ffe38c' : yy < 4 ? '#ffc56a' : '#ff9d62'); }
    const ridge = (base, a, f, c) => { for (let x = 0; x < W; x++) { const h = round(base + sin(x * f) * a + sin(x * f * 2.3 + 1) * a * .4); px(g, x, h, 1, 102 - h, c); } };
    ridge(84, 7, .05, '#6b3a68'); ridge(92, 4, .09, '#4c2e5e');
    const pineS = (x, h, c) => { for (let k = 0; k < h; k++) { const w = 1 + floor(k / 2.2) % 5 + floor(k / 8); px(g, x - floor(w / 2), 100 - h + k, w, 1, c); } px(g, x, 100, 1, 2, '#241525'); };
    [[8, 15], [18, 11], [27, 17], [37, 12], [176, 13], [188, 18], [196, 11], [133, 9]].forEach(([x, h]) => pineS(x, h, '#2e2149'));
    px(g, 0, 100, W, 38, '#3f4e7c'); px(g, 0, 106, W, 6, '#37426e'); px(g, 0, 112, W, 26, '#2e3760');
    [[140, 102, 32], [146, 105, 22], [150, 108, 14], [153, 111, 9]].forEach(([a, b, l]) => px(g, a, b, l, 1, '#f7b57c')); [[20, 104, 12], [62, 109, 9], [100, 103, 8], [36, 113, 10]].forEach(([a, b, l]) => px(g, a, b, l, 1, '#5e6fa2'));
    // A little boat on the lake, with its lantern
    px(g, 22, 108, 12, 2, '#241525'); px(g, 24, 110, 8, 1, '#241525'); px(g, 28, 102, 1, 6, '#241525'); px(g, 29, 103, 2, 2, '#ffd98a');
    const cx = 86; for (let x = 0; x < W; x++) { const d = abs(x - cx), top = gy + round(pow(d / 74, 2) * 9) - 2; if (top > 124) continue; px(g, x, top, 1, 3, '#7ab35a'); px(g, x, top + 3, 1, 3, '#4b8a4e'); px(g, x, top + 6, 1, H - top - 6, '#4a2c30'); }
    px(g, cx - 34, gy + 1, 68, 1, '#4b8a4e'); // the tree's shade on the grass
    px(g, 0, 138, W, 8, '#3c2329'); px(g, 0, 146, W, H - 146, '#2e1b23');
    [[20, 132, 8], [160, 130, 9], [32, 150, 7], [138, 150, 10], [176, 142, 6], [12, 144, 5], [60, 154, 6], [112, 154, 7]].forEach(([x, yy, w]) => { px(g, x, yy, w, 3, '#5d4042'); px(g, x + 1, yy, w - 2, 1, '#7c5a58'); });
    [[60, 112], [68, 110], [108, 111], [116, 113], [46, 116], [130, 115]].forEach(([x, yy]) => { px(g, x, yy, 1, 2, '#9bd072'); px(g, x + 2, yy + 1, 1, 1, '#9bd072'); });
    if (o.roots) { pRoots(g, weeks.length, cx, 118, H, o.roots); o.rootNames.forEach((nm, i) => ptxt(g, nm, [8, 78, 150][i], H - 7, ROOT_COL[i])); }
    return pTree(g, weeks, cx, gy, o);
  }

  /* ---------- The dark worlds' trees (3.65, from proposals/you/arbres-v3): one world tree each, earned after 25 h in its world, and one sold in the shop ---------- */
  const FAR = (w, cx, y0) => w.out.tips.reduce((a, b) => (hypot(b.x - cx, b.y - y0) > hypot(a.x - cx, a.y - y0) ? b : a), w.out.tips[0]);
  const glow = (g, x, y, r, c, a = 1) => { const h = g.createRadialGradient(x, y, 0, x, y, r); h.addColorStop(0, c); h.addColorStop(1, c.slice(0, 7) + '00'); g.globalAlpha = a; g.fillStyle = h; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.globalAlpha = 1; };
  const ln = (g, pts, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); };
  const vgrad = (g, y0, y1, stops) => { const s = g.createLinearGradient(0, y0, 0, y1); stops.forEach(([k, c]) => s.addColorStop(k, c)); return s; };
  const dust = (g, R, W, h, n, c, big = .08) => { g.fillStyle = c; for (let i = 0; i < n; i++) { g.globalAlpha = .18 + R() * .7; g.beginPath(); g.arc(R() * W, R() * h, R() < big ? 1.5 : .8, 0, TAU); g.fill(); } g.globalAlpha = 1; };
  const byOrder = w => w.out.limbs.slice().sort((a, b) => b.order - a.order);
  const layers = (tr, back, mid, front) => { tr.weeks.filter(w => w.behind).forEach(back); mid(); tr.weeks.filter(w => !w.behind).forEach(front); };
  // A tree's foot: buttresses leave the flanks of the trunk and run into the ground, so a trunk never stops on a flat line
  function buttresses(cx, gy, w0, seed) { const R = rng(seed), out = []; [-1, -.6, -.24, .3, .66, 1].forEach(u => { const x0 = cx + u * w0 * .36, y0 = gy - w0 * (.86 - .3 * abs(u)), x1 = cx + u * w0 * (1.25 + R() * .85), y1 = gy + 2 + R() * 10 * (1.1 - abs(u)), w = w0 * (.3 + R() * .1), pts = []; for (let i = 0; i <= 12; i++) { const q = i / 12; pts.push({ x: lerp(x0, x1, q * q * .62 + q * .38), y: lerp(y0, y1, 1 - (1 - q) * (1 - q)), w: lerp(w, max(1.4, w * .1), q) }); } out.push({ pts, order: 1 }); }); return out; }
  // A root's first limb starts on the flank of the trunk, as wide as a buttress, and narrows into its own line
  const rootHead = (l, cx, gy, w0) => { if (l.order) return l; const p = l.pts, e = p[p.length - 1], sd = e.x < cx ? -1 : 1, k = min(1, p.length - 1), T = p[k], head = []; for (let i = 0; i < 7; i++) { const q = i / 7; head.push({ x: lerp(cx + sd * w0 * .28, T.x, q), y: lerp(gy - w0 * .7, T.y, q * q), w: lerp(max(T.w * 1.7, w0 * .36), T.w, q) }); } return { ...l, pts: head.concat(p.slice(k)) }; };
  
  /* ---------- Observatoire O1: the planetary. A brass orrery that grew like a tree. ---------- */
  const O_SEA = [['#ffd59a', '#c8622c', '#3f170c'], ['#eef6f8', '#7ea3b8', '#1b3042'], ['#ffd9e0', '#b7647f', '#3a1729'], ['#aeeacd', '#2d8a6a', '#0c3024']];
  function planet(g, x, y, r, P, f) {
    glow(g, x, y, r * 2.4, P[1] + '55');
    if (f > 0) { g.strokeStyle = '#b9a58c'; g.lineWidth = max(1, r * .14); g.beginPath(); g.ellipse(x, y, r * 1.75, r * .46, -.35, Math.PI + .1, TAU - .1); g.stroke(); }
    const s = g.createRadialGradient(x - r * .38, y - r * .42, r * .08, x, y, r); s.addColorStop(0, P[0]); s.addColorStop(.55, P[1]); s.addColorStop(1, P[2]); g.fillStyle = s; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.globalAlpha = .28; g.strokeStyle = P[2]; g.lineWidth = max(.7, r * .08); for (const k of [-.3, .22]) { g.beginPath(); g.ellipse(x, y + k * r, r * sqrt(1 - k * k) * .96, r * .13, -.1, 0, Math.PI); g.stroke(); } g.globalAlpha = 1;
    if (f > 0) { g.strokeStyle = '#e4d6c0'; g.lineWidth = max(1, r * .14); g.beginPath(); g.ellipse(x, y, r * 1.75, r * .46, -.35, -.1, Math.PI + .1); g.stroke(); }
    for (let k = 1; k < min(f, 3); k++) { const a = k * 2.2 + x; g.fillStyle = '#f1e3b8'; g.beginPath(); g.arc(x + cos(a) * r * 2.1, y + sin(a) * r * 1.2, max(1.2, r * .17), 0, TAU); g.fill(); }
  }
  
  function orrery(g, W, H, weeks, o) {
    const gy = 588, cx = W / 2 - 6, R = rng(3), n = weeks.length;
    g.fillStyle = vgrad(g, 0, gy, [[0, '#060a18'], [.7, '#101a30'], [1, '#1c2238']]); g.fillRect(0, 0, W, gy); dust(g, R, W, gy * .9, 190, '#e8e4d0');
    const hy = 280; g.strokeStyle = '#a8947c30'; g.lineWidth = 1; for (let r = 90; r < 560; r += 74) { g.beginPath(); g.ellipse(cx, hy, r, r * .84, -.1, 0, TAU); g.stroke(); }
    for (let a = 0; a < 72; a++) { const q = a / 72 * TAU, r = 386; g.strokeStyle = a % 6 ? '#a8947c44' : '#d2bfa688'; g.beginPath(); g.moveTo(cx + cos(q - .1) * r, hy + sin(q - .1) * r * .84); g.lineTo(cx + cos(q - .1) * (r + (a % 6 ? 6 : 13)), hy + sin(q - .1) * (r + (a % 6 ? 6 : 13)) * .84); g.stroke(); }
    // The floor: dark polished slate with a bronze meridian circle inlaid around the foot, which catches the light of the planets
    g.fillStyle = vgrad(g, gy, H, [[0, '#171d2c'], [.45, '#0e121d'], [1, '#05070c']]); g.fillRect(0, gy, W, H - gy);
    const fy = gy + 26; g.save(); g.beginPath(); g.rect(0, gy, W, H - gy); g.clip();
    const pool = g.createRadialGradient(cx, fy, 10, cx, fy, 340); pool.addColorStop(0, '#6f86a838'); pool.addColorStop(1, '#6f86a800'); g.save(); g.translate(cx, fy); g.scale(1, .24); g.translate(-cx, -fy); g.fillStyle = pool; g.beginPath(); g.arc(cx, fy, 340, 0, TAU); g.fill(); g.restore();
    g.strokeStyle = '#0a0d15'; g.lineWidth = 1.2; for (let k = 0; k < 8; k++) { const y = gy + k * k * 2.6 + k * 7; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } for (let x = -W; x < W * 2; x += 96) { g.beginPath(); g.moveTo(cx + (x - cx) * .5, gy); g.lineTo(cx + (x - cx) * 1.7, H); g.stroke(); }
    [[318, '#8d7a64', 1.6], [298, '#6d5e4e', 1], [214, '#6d5e4e', 1], [150, '#8d7a64', 1.3]].forEach(([r, c, w]) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.ellipse(cx, fy, r, r * .24, 0, 0, TAU); g.stroke(); });
    for (let a = 0; a < 48; a++) { const q = a / 48 * TAU, c = cos(q), s = sin(q), big = a % 4 === 0; g.strokeStyle = big ? '#a8947c' : '#6d5e4e'; g.lineWidth = big ? 1.3 : .8; g.beginPath(); g.moveTo(cx + c * 298, fy + s * 298 * .24); g.lineTo(cx + c * 318, fy + s * 318 * .24); g.stroke(); }
    for (let a = 0; a < 12; a++) { const q = a / 12 * TAU, c = cos(q), s = sin(q); g.strokeStyle = '#6d5e4e66'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx + c * 150, fy + s * 150 * .24); g.lineTo(cx + c * 298, fy + s * 298 * .24); g.stroke(); }
    g.restore();
    g.fillStyle = '#6a5b4a'; g.fillRect(0, gy, W, 1.6);
    const tr0 = yearTree(weeks, cx, gy, { max: 2 });
    if (o.roots) { roots(g, cx, gy + 4, n, o.roots, (l0, col) => { const l = rootHead(l0, cx, gy, tr0.w0), e = taper(g, l.pts, '#6f5c49'); if (l.pts[0].w > 2) { g.strokeStyle = col; g.lineWidth = 1.2; path(g, e.L); g.strokeStyle = '#20170f'; path(g, e.R); } }); rootLabels(g, W, H, o.rootNames); }
    // Aged bronze rather than yellow brass: brown body, pale worn edges, a little verdigris
    const tr = yearTree(weeks, cx, gy, { max: 2 }), B = ['#33251b', '#7d6450', '#dcc9ad', '#1c130d'];
    const rod = w => { byOrder(w).forEach(l => { const shift = l.pts.map(p => ({ x: p.x, y: p.y - .5 })); ln(g, l.pts, w.W.empty ? '#4c4a4a' : '#57453a', l.order ? 1.3 : 2.4); if (!w.W.empty) ln(g, shift, l.order ? '#927a64' : '#cdb79c', l.order ? .55 : .9); }); };
    const fruit = (w, far) => {
      const { W: wk, out, sc } = w; if (!out.tips.length) return; const p = FAR(w, cx, gy - tr.top);
      out.tips.forEach(t => { if (t === p) return; g.fillStyle = wk.empty ? '#4c4a4a' : '#a89079'; g.beginPath(); g.arc(t.x, t.y, 1.9 * sc, 0, TAU); g.fill(); });
      if (wk.empty) { g.strokeStyle = '#7b756c'; g.lineWidth = 1.2; g.beginPath(); g.arc(p.x, p.y, 5 * sc, 0, TAU); g.stroke(); return; }
      const r = (5 + min(wk.s, 16) * .85) * sc; g.strokeStyle = (far ? '#a18c7644' : '#cdb99f66'); g.lineWidth = 1; g.beginPath(); g.ellipse(p.x, p.y, r * 3.2, r * 1.1, -.28, 0, TAU); g.stroke();
      if (wk.rare) planet(g, p.x, p.y, r * 1.3, ['#f2fbff', '#9fd0ff', '#223c66'], wk.f); else planet(g, p.x, p.y, r, O_SEA[wk.season], wk.f);
      if (wk.back) { const t = out.tips.find(q => q !== p) || p; glow(g, t.x, t.y, 14 * sc, '#9ff2d8aa'); g.fillStyle = '#c9ffe9'; g.beginPath(); g.arc(t.x, t.y, 3.4 * sc, 0, TAU); g.fill(); }
    };
    const lay = far => w => { rod(w); fruit(w, far); };
    layers(tr, lay(true), () => {
      const hd = tr.trunk[tr.trunk.length - 1], sr = 8 + 13 * min(1, sqrt(n / 40)), sy = hd.y - sr * 1.5; glow(g, hd.x, sy, sr * 6, '#ffb878', .34); const su = g.createRadialGradient(hd.x - sr * .3, sy - sr * .35, sr * .08, hd.x, sy, sr); su.addColorStop(0, '#fff3dc'); su.addColorStop(.5, '#f0b070'); su.addColorStop(1, '#8a4a22'); g.fillStyle = su; g.beginPath(); g.arc(hd.x, sy, sr, 0, TAU); g.fill();
      tr.boughs.forEach(l => { const e = taper(g, l.pts, B[1]); g.lineWidth = 1; g.strokeStyle = B[2]; path(g, e.L); g.strokeStyle = B[3]; path(g, e.R); });
      const legs = [[-1, .55], [1, .55], [0, 1]]; legs.forEach(([d, k]) => { const x1 = cx + d * (70 + tr.w0 * 1.6), y1 = gy + 8 * k; g.strokeStyle = '#2a1e16'; g.lineWidth = 9; g.beginPath(); g.moveTo(cx, gy - 34); g.quadraticCurveTo(cx + d * 22, gy - 6, x1, y1); g.stroke(); g.strokeStyle = '#a58c74'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx, gy - 36); g.quadraticCurveTo(cx + d * 22, gy - 8, x1, y1 - 2); g.stroke(); g.fillStyle = '#a58c74'; g.beginPath(); g.arc(x1, y1, 6, 0, TAU); g.fill(); });
      const s = g.createLinearGradient(cx - tr.w0, 0, cx + tr.w0, 0); s.addColorStop(0, B[0]); s.addColorStop(.35, B[1]); s.addColorStop(.62, B[2]); s.addColorStop(.8, B[1]); s.addColorStop(1, B[0]); taper(g, tr.trunk, s);
      const Rv = rng(17); tr.trunk.forEach((p, i) => { if (i % 2 || p.w < 8) return; if (Rv() < .5) { g.fillStyle = '#5f9a8a' + (Rv() < .5 ? '40' : '26'); g.beginPath(); g.ellipse(p.x + (Rv() - .5) * p.w * .8, p.y, 2 + Rv() * p.w * .14, 1.5 + Rv() * 4, 0, 0, TAU); g.fill(); } });
      // Cast bronze: flutes run up the column and die out before the boughs. No collars around the trunk.
      const up = tr.trunk.slice(0, Math.max(2, floor(tr.trunk.length * .82)));
      [-.34, -.17, 0, .17, .34].forEach(u => { const line = d => up.map(p => ({ x: p.x + u * p.w + d, y: p.y })); ln(g, line(0), '#21170f', 1.5); ln(g, line(1.5), '#c9b49a55', .8); });
    }, lay(false));
    return hitsOf(tr);
  }
  
  /* ---------- Observatoire O2: the star atlas. The tree is a constellation on an old chart. ---------- */
  const ATLAS = ['#ffe2bd', '#d5e3fb', '#fbdcdc', '#d9efd9']; // pale, close to the chart's ink, so stars and engraved tree read as one drawing
  function star(g, x, y, r, c) { glow(g, x, y, r * 3.6, c + '66'); g.fillStyle = c; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, q = i % 2 ? r * .32 : r * (i % 4 ? 1.1 : 1.9); g.lineTo(x + cos(a) * q, y + sin(a) * q); } g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * .3, 0, TAU); g.fill(); }
  function atlas(g, W, H, weeks, o) {
    const gy = 604, cx = W / 2, R = rng(11), n = weeks.length, INK = '#d6b873', hy = 318;
    const bg = g.createRadialGradient(cx, hy, 40, cx, hy, 700); bg.addColorStop(0, '#14224a'); bg.addColorStop(.7, '#0a1330'); bg.addColorStop(1, '#060b1f'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    dust(g, R, W, gy, 260, '#dfe6ff', .05);
    g.strokeStyle = INK + '2e'; g.lineWidth = 1; for (let r = 80; r <= 400; r += 80) { g.beginPath(); g.arc(cx, hy, r, 0, TAU); g.stroke(); }
    for (let a = 0; a < 12; a++) { const q = a / 12 * TAU; g.beginPath(); g.moveTo(cx, hy); g.lineTo(cx + cos(q) * 400, hy + sin(q) * 400); g.stroke(); }
    [-210, 0, 210].forEach(d => { g.beginPath(); g.ellipse(cx, hy, abs(d) || 1, 400, 0, 0, TAU); g.stroke(); });
    g.strokeStyle = INK + '99'; g.lineWidth = 1.6; g.beginPath(); g.arc(cx, hy, 400, 0, TAU); g.stroke(); g.lineWidth = 1; g.beginPath(); g.arc(cx, hy, 426, 0, TAU); g.stroke();
    for (let a = 0; a < 120; a++) { const q = a / 120 * TAU, l = a % 10 ? 7 : 26; g.strokeStyle = INK + (a % 10 ? '66' : 'bb'); g.beginPath(); g.moveTo(cx + cos(q) * 400, hy + sin(q) * 400); g.lineTo(cx + cos(q) * (400 + l), hy + sin(q) * (400 + l)); g.stroke(); }
    g.font = '500 13px ui-monospace, Consolas, monospace'; g.fillStyle = INK + 'cc'; g.textAlign = 'center'; g.textBaseline = 'middle'; ['SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG'].forEach((m, i) => { const q = -Math.PI / 2 + (i + .5) / 12 * TAU; g.save(); g.translate(cx + cos(q) * 413, hy + sin(q) * 413); g.rotate(q + Math.PI / 2); g.fillText(m, 0, 0); g.restore(); }); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = vgrad(g, gy, H, [[0, '#0a1020'], [1, '#04070f']]); g.beginPath(); g.moveTo(0, gy + 8); for (let x = 0; x <= W; x += 8) g.lineTo(x, gy + sin(x * .012) * 7 + sin(x * .04) * 2); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    g.strokeStyle = INK + 'aa'; g.lineWidth = 1.2; g.beginPath(); for (let x = 0; x <= W; x += 8) g.lineTo(x, gy + sin(x * .012) * 7 + sin(x * .04) * 2); g.stroke();
    g.lineWidth = .8; g.strokeStyle = INK + '40'; for (let i = 0; i < 150; i++) { const x = R() * W, y = gy + 12 + R() * R() * 140, l = 8 + R() * 26; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + R() * 1.5); g.stroke(); }
    const dx = W * .84, dy = gy - 2; g.fillStyle = '#0a1020'; g.strokeStyle = INK + 'cc'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(dx - 34, dy); g.lineTo(dx - 34, dy - 22); g.arc(dx, dy - 22, 34, Math.PI, 0); g.lineTo(dx + 34, dy); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(dx - 8, dy - 54); g.lineTo(dx + 24, dy - 84); g.moveTo(dx + 2, dy - 56); g.lineTo(dx + 30, dy - 78); g.stroke();
    if (o.roots) { roots(g, cx, gy + 6, n, o.roots, (l, col) => { g.setLineDash([2, 6]); ln(g, l.pts, col, max(1, l.pts[0].w * .22)); g.setLineDash([]); l.pts.forEach((p, i) => { if (i % 5 === 4) { g.fillStyle = col; g.beginPath(); g.arc(p.x, p.y, 1.6, 0, TAU); g.fill(); } }); }); rootLabels(g, W, H, o.rootNames); }
    const tr = yearTree(weeks, cx, gy, { max: 2 });
    const eT = taper(g, tr.trunk, '#0a1226'); g.strokeStyle = INK; g.lineWidth = 1.2; path(g, eT.L); path(g, eT.R);
    const Rb = rng(6); g.lineWidth = .7; tr.trunk.forEach(p => { if (p.w < 5) return; const c = floor(p.w / 4); for (let k = 0; k < c; k++) { if (Rb() < .45) continue; const u = -.44 + k / c * .88, l = 6 + Rb() * 10; g.strokeStyle = INK + (u > 0 ? '44' : '99'); g.beginPath(); g.moveTo(p.x + u * p.w, p.y); g.lineTo(p.x + u * p.w, p.y - l); g.stroke(); } });
    tr.boughs.forEach(l => { const e = taper(g, l.pts, '#0a1226'); g.strokeStyle = INK + 'cc'; g.lineWidth = .9; path(g, e.L); path(g, e.R); });
    // The tree turns into the sky: the engraved line thins, then goes on dotted to its stars, in the same ink as the constellation it reaches
    tr.weeks.forEach(w => { byOrder(w).forEach(l => { const col = w.W.empty ? INK + '30' : INK + '8c', cut = floor(l.pts.length * (l.order ? .25 : .6)); ln(g, l.pts.slice(0, cut + 1), col, l.order ? .8 : 1.3); g.setLineDash([1.5, 4]); ln(g, l.pts.slice(cut), col, l.order ? .8 : 1); g.setLineDash([]); }); });
    // Small engraved stars sit on the boughs, so the wood already carries what the crown is made of
    tr.boughs.forEach(l => l.pts.forEach((p, i) => { if (i % 7 !== 3) return; g.fillStyle = INK; g.beginPath(); for (let k = 0; k < 8; k++) { const q = k / 8 * TAU, r = k % 2 ? .9 : 3; g.lineTo(p.x + cos(q) * r, p.y + sin(q) * r); } g.closePath(); g.fill(); }));
    tr.weeks.forEach(w => {
      const { W: wk, out, sc } = w, T = out.tips; if (!T.length) return;
      if (wk.empty) { g.setLineDash([3, 5]); ln(g, T, INK + '66', 1); g.setLineDash([]); T.forEach(t => { g.strokeStyle = INK + 'aa'; g.lineWidth = 1; g.beginPath(); g.arc(t.x, t.y, 2.6 * sc, 0, TAU); g.stroke(); }); return; }
      const order = T.slice().sort((a, b) => atan2(a.y - T[0].y, a.x - T[0].x) - atan2(b.y - T[0].y, b.x - T[0].x)); ln(g, order, INK + 'b8', 1);
      T.forEach((t, i) => { const lit = i < wk.f, r = (1.8 + min(wk.s, 16) * .22 + (lit ? 2 : 0)) * sc; star(g, t.x, t.y, r, lit ? '#ffe9a8' : ATLAS[wk.season]); });
      if (wk.back) star(g, T[T.length - 1].x, T[T.length - 1].y, 6 * sc, '#9ff2d8'); if (wk.rare) star(g, T[0].x, T[0].y, 11 * sc, '#9fd0ff');
    });
    return hitsOf(tr);
  }
  
  /* ---------- Abysses A1: the sea fan. One flat coral lace, each week one ray of the fan. ---------- */
  const FAN = ['#6d1c3a', '#a93150', '#d95c66', '#f58d7c'];
  function sea(g, W, H, gy, R) {
    g.fillStyle = vgrad(g, 0, gy, [[0, '#0d4a66'], [.28, '#07293f'], [.72, '#031426'], [1, '#020b18']]); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) { const x = W * (.12 + i * .2) + R() * 40, w = 30 + R() * 70, s = g.createLinearGradient(0, 0, 0, gy * .9); s.addColorStop(0, '#9fdcea26'); s.addColorStop(1, '#9fdcea00'); g.fillStyle = s; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w * 2.4 - 120, gy * .9); g.lineTo(x + w * .4 - 150, gy * .9); g.fill(); }
  }
  function seabed(g, W, H, gy, R, c1, c2) { const pts = []; for (let x = 0; x <= W; x += 14) pts.push([x, gy + sin(x * .011) * 16 + sin(x * .037 + 2) * 8 + (R() - .5) * 5]); g.fillStyle = vgrad(g, gy - 20, H, [[0, c1], [1, c2]]); g.beginPath(); g.moveTo(0, H); pts.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(W, H); g.fill(); g.strokeStyle = '#2e5868'; g.lineWidth = 1.2; g.beginPath(); pts.forEach(p => g.lineTo(p[0], p[1])); g.stroke(); }
  function fish(g, x, y, s, d, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, 9 * s, 3.4 * s, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x - d * 8 * s, y); g.lineTo(x - d * 15 * s, y - 4 * s); g.lineTo(x - d * 15 * s, y + 4 * s); g.fill(); }
  function gorgon(g, W, H, weeks, o) {
    const gy = 606, cx = W / 2, R = rng(23), n = weeks.length, G = min(1.05, sqrt(n / 40)); sea(g, W, H, gy, R);
    for (let k = 0; k < 7; k++) { const d = { limbs: [], tips: [] }, x = k < 3 ? 60 + k * 90 : W - 60 - (k - 3) * 78; grow(rng(k + 40), x, gy + 4, -Math.PI / 2 + (R() - .5) * .5, 80 + R() * 90, 7, 0, { up: -Math.PI / 2, trop: .02, wig: .3, fork: .28, max: 2 }, d, 0); d.limbs.forEach(l => taper(g, l.pts, '#07283a')); }
    for (let k = 0; k < 16; k++) fish(g, 720 + (k % 4) * 30 + R() * 90, 150 + (k % 5) * 18 + R() * 40, .55 + R() * .3, -1, '#0e4058');
    seabed(g, W, H, gy, R, '#0d2230', '#03090f');
    for (let i = 0; i < 24; i++) { const x = R() * W, y = gy + 34 + R() * (H - gy - 40), r = 5 + R() * 16; g.fillStyle = '#10293a'; g.beginPath(); g.ellipse(x, y, r, r * .55, R(), 0, TAU); g.fill(); }
    if (o.roots) { roots(g, cx, gy + 2, n, o.roots, (l, col) => { ln(g, l.pts, col + '33', l.pts[0].w + 5); ln(g, l.pts, col, max(1, l.pts[0].w * .4)); }); rootLabels(g, W, H, o.rootNames); }
    const stem = 40 + 34 * G, hx = cx, hy = gy - stem, wS = 9 + 22 * G, tp = []; for (let h = 0; h <= stem; h += 4) tp.push({ x: cx + sin(h * .05) * 3, y: gy - h, w: lerp(wS, wS * .55, h / stem) * (1 + .9 * exp(-h / 12)) });
    const rays = [];
    for (let i = 0; i < n; i++) {
      const W_ = weeks[i], Rr = rng(1300 + i * 61), fan = ((i * .618034) % 1) * 2 - 1, ang = -Math.PI / 2 + fan * 1.3, s = min(W_.s, 16), age = (n - 1 - i) / 40;
      const len = (86 + 196 * G) * (W_.empty ? .55 : .8 + s * .012) * (1 + .1 * sqrt(age)), parts = { limbs: [], tips: [] };
      grow(Rr, hx + fan * wS * .4, hy, ang, len, (W_.empty ? 2 : 2.8 + s * .17) * (.7 + .5 * G), 0, { up: ang, trop: .05, wig: .17, wob: .05, fork: W_.empty ? 0 : .2, max: W_.empty ? 1 : 2 }, parts, i);
      rays.push({ W: W_, fan, parts, R: Rr, main: parts.limbs.find(l => l.order === 0) || parts.limbs[0] });
    }
    const sorted = rays.slice().sort((a, b) => a.fan - b.fan);
    glow(g, hx, hy - 170 * G, 340 * G + 60, '#a93150', .22);
    // The lace: thin bridges between neighbouring rays, which make a net of one fan and not a bouquet of sticks
    for (let i = 1; i < sorted.length; i++) { const a = sorted[i - 1].main.pts, b = sorted[i].main.pts; if (abs(sorted[i].fan - sorted[i - 1].fan) > .45) continue; [.36, .48, .6, .72, .84, .94].forEach(q => { const p = a[floor(q * (a.length - 1))], r = b[floor(q * (b.length - 1))]; g.strokeStyle = FAN[2] + 'aa'; g.lineWidth = .9; g.beginPath(); g.moveTo(p.x, p.y); g.quadraticCurveTo((p.x + r.x) / 2, (p.y + r.y) / 2 - 3, r.x, r.y); g.stroke(); }); }
    rays.forEach(r => r.parts.limbs.slice().sort((a, b) => b.order - a.order).forEach(l => { const c = r.W.empty ? '#6f7880' : FAN[min(3, l.order)]; taper(g, l.pts, c); }));
    rays.forEach(r => { const { W: wk, parts: p, R: Rr } = r; if (wk.empty) return; p.limbs.forEach(l => { if (l.order < 1) return; l.pts.forEach((q, i) => { if (i % 3) return; g.fillStyle = Rr() < .25 ? '#ffe3cf' : '#ffb79c'; g.beginPath(); g.arc(q.x + (Rr() - .5) * 2.4, q.y + (Rr() - .5) * 2.4, .9 + Rr() * .9, 0, TAU); g.fill(); }); });
      for (let i = 0; i < min(wk.f, 3) && i < p.tips.length; i++) { const t = p.tips[floor(Rr() * p.tips.length)]; glow(g, t.x, t.y, 20, '#7ff0ff99'); g.fillStyle = '#e6fdff'; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.beginPath(); g.ellipse(t.x + cos(a) * 4, t.y + sin(a) * 4, 3.4, 1.1, a, 0, TAU); g.fill(); } g.fillStyle = '#7ff0ff'; g.beginPath(); g.arc(t.x, t.y, 2, 0, TAU); g.fill(); }
      if (wk.back) { const t = p.tips[0]; glow(g, t.x, t.y, 15, '#9ff2d8aa'); g.fillStyle = '#c9ffe9'; g.beginPath(); g.ellipse(t.x, t.y, 3.4, 5.6, .3, 0, TAU); g.fill(); }
      if (wk.rare) { const t = p.tips[p.tips.length - 1]; glow(g, t.x, t.y, 34, '#9fd0ffaa'); g.fillStyle = '#e4f3ff'; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.beginPath(); g.ellipse(t.x + cos(a) * 7.5, t.y + sin(a) * 7.5, 6, 1.6, a, 0, TAU); g.fill(); } } });
    taper(g, tp, FAN[0]); const hl = tp.map(p => ({ x: p.x - p.w * .2, y: p.y })); ln(g, hl, FAN[2] + '99', 1.4);
    const r3 = rng(4); g.fillStyle = '#ffffff'; for (let i = 0; i < 170; i++) { g.globalAlpha = .08 + r3() * .3; g.beginPath(); g.arc(r3() * W, r3() * gy, .6 + r3() * .9, 0, TAU); g.fill(); } g.globalAlpha = 1;
    return rays.flatMap(r => r.parts.tips.map(t => ({ i: r.W.i, x: t.x, y: t.y })));
  }
  
  /* ---------- Abysses A2: black coral and its jellyfish. Each week frees one jellyfish above a branch. ---------- */
  const JEL = [['#ffd0a0', '#e86f5a'], ['#d6f1ff', '#4f97d8'], ['#ffd0ef', '#b75dcc'], ['#b4f8e2', '#2aa08f']];
  function jelly(g, x, y, r, P, f, R, soft) {
    glow(g, x, y + r * .2, r * 3, P[1] + '66', soft ? .7 : 1);
    const tent = 7 + floor(r / 3); for (let i = 0; i < tent; i++) { const u = (i + .5) / tent * 2 - 1, x0 = x + u * r * .92, l = r * (1.5 + R() * 1.4), ph = R() * 9; g.strokeStyle = P[1] + 'aa'; g.lineWidth = max(.6, r * .045); g.beginPath(); g.moveTo(x0, y + r * .18); for (let k = 1; k <= 9; k++) { const q = k / 9; g.lineTo(x0 + sin(q * 6 + ph) * r * .17 * q + u * r * .2 * q, y + r * .18 + l * q); } g.stroke(); }
    g.strokeStyle = P[0] + 'cc'; g.lineWidth = max(.8, r * .09); for (const u of [-.3, 0, .3]) { const ph = R() * 9; g.beginPath(); g.moveTo(x + u * r * .5, y + r * .2); for (let k = 1; k <= 8; k++) { const q = k / 8; g.lineTo(x + u * r * .5 + sin(q * 4.5 + ph) * r * .24 * q, y + r * .2 + r * 1.35 * q); } g.stroke(); }
    const b = g.createRadialGradient(x, y - r * .3, r * .05, x, y, r * 1.05); b.addColorStop(0, P[0] + 'f0'); b.addColorStop(.6, P[1] + 'cc'); b.addColorStop(1, P[1] + '66'); g.fillStyle = b;
    g.beginPath(); g.moveTo(x - r, y + r * .2); g.bezierCurveTo(x - r * 1.05, y - r * .95, x + r * 1.05, y - r * .95, x + r, y + r * .2); for (let i = 7; i >= 0; i--) { const q = i / 8; g.quadraticCurveTo(x - r + 2 * r * (q + 1 / 16), y + r * .38, x - r + 2 * r * q, y + r * .2); } g.fill();
    g.fillStyle = '#ffffffb0'; g.beginPath(); g.ellipse(x - r * .32, y - r * .4, r * .17, r * .1, -.5, 0, TAU); g.fill();
    g.fillStyle = P[0] + 'aa'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(x + (i - 1.5) * r * .33, y - r * .02, r * .13, r * .19, 0, 0, TAU); g.fill(); }
    for (let i = 0; i < min(f, 3); i++) { const a = i * 2.2; glow(g, x + cos(a) * r * .5, y - r * .25 + sin(a) * r * .22, r * .55, '#fff4c8ee'); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + cos(a) * r * .5, y - r * .25 + sin(a) * r * .22, max(1, r * .08), 0, TAU); g.fill(); }
  }
  function coralJelly(g, W, H, weeks, o) {
    const gy = 606, cx = W / 2 - 6, R = rng(61), n = weeks.length; sea(g, W, H, gy, R);
    glow(g, cx, 300, 460, '#1c7f9a', .3);
    // Far reef walls in blue haze, each layer paler, so the water has depth
    [[gy - 150, '#0a3347', .006, 58, 1], [gy - 84, '#072738', .011, 38, 2], [gy - 38, '#051c2a', .017, 24, 3]].forEach(([y, c, f, a, k]) => { const Rr = rng(k * 31); g.fillStyle = c; g.beginPath(); g.moveTo(0, gy + 30); for (let x = 0; x <= W; x += 10) { const gap = 1 - .75 * exp(-pow((x - cx) / (250 - k * 30), 2)); g.lineTo(x, y + (1 - gap) * (gy - y) * .7 + sin(x * f + k) * a * gap + sin(x * f * 3.3 + k * 2) * a * .3 * gap + (Rr() - .5) * 3); } g.lineTo(W, gy + 30); g.fill(); });
    for (let k = 0; k < 9; k++) { const d = { limbs: [], tips: [] }, x = k < 5 ? 34 + k * 62 : W - 34 - (k - 5) * 70; grow(rng(k + 140), x, gy - 16, -Math.PI / 2 + (R() - .5) * .4, 44 + R() * 74, 5, 0, { up: -Math.PI / 2, trop: .03, wig: .36, fork: .3, max: 2 }, d, 0); d.limbs.forEach(l => taper(g, l.pts, '#04202e')); }
    for (let i = 0; i < 9; i++) { const Rj = rng((i + 77) * 9973); Rj(); jelly(g, Rj() * W, 60 + Rj() * 300, 5 + Rj() * 6, ['#3b8aa5', '#1d5a78'], 0, Rj, true); }
    // The ground: pale sand under the light, ripples that break and bend, stones that catch the light from above
    const sandY = x => gy + sin(x * .011) * 16 + sin(x * .037 + 2) * 8;
    g.fillStyle = vgrad(g, gy - 20, H, [[0, '#3c6a72'], [.3, '#1d3f4a'], [1, '#050e14']]); g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 8) g.lineTo(x, sandY(x)); g.lineTo(W, H); g.fill();
    const lit = g.createRadialGradient(cx, gy + 34, 8, cx, gy + 34, 380); lit.addColorStop(0, '#9fd6d44d'); lit.addColorStop(1, '#9fd6d400'); g.save(); g.translate(cx, gy + 34); g.scale(1, .3); g.translate(-cx, -gy - 34); g.fillStyle = lit; g.beginPath(); g.arc(cx, gy + 34, 380, 0, TAU); g.fill(); g.restore();
    const Rs = rng(29); for (let k = 0; k < 34; k++) { const y0 = gy + 26 + k * k * .13 + Rs() * 6; let x = Rs() * 60 - 60; while (x < W) { const l = 40 + Rs() * 120, ph = Rs() * 9, bend = (x + l / 2 - cx) * .012 * (1 - k / 40); g.strokeStyle = k % 2 ? '#0c2630aa' : '#5c9098' + (k < 16 ? '66' : '33'); g.lineWidth = .9 + k * .03; g.beginPath(); for (let u = 0; u <= 1.001; u += .1) { const px = x + u * l, py = y0 + sin(u * 3.14) * bend + sin(px * .03 + ph) * 1.6; u ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); x += l + 12 + Rs() * 60; } }
    for (let i = 0; i < 26; i++) { const x = Rs() * W, y = gy + 26 + Rs() * Rs() * (H - gy - 34), r = (3 + Rs() * 12) * (.6 + (y - gy) / 200), rot = (Rs() - .5) * .5; if (abs(x - cx) < 70 && y < gy + 50) continue; g.fillStyle = '#04101666'; g.beginPath(); g.ellipse(x + r * .25, y + r * .42, r * 1.1, r * .32, 0, 0, TAU); g.fill(); g.fillStyle = '#17323c'; g.beginPath(); g.ellipse(x, y, r, r * .58, rot, 0, TAU); g.fill(); g.fillStyle = '#4c7880'; g.beginPath(); g.ellipse(x - r * .16, y - r * .24, r * .56, r * .2, rot, 0, TAU); g.fill(); }
    for (let i = 0; i < 12; i++) { const x = (i % 2 ? W * .68 + Rs() * W * .3 : Rs() * W * .3), y = gy + 18 + Rs() * 60, N = 4 + floor(Rs() * 4); for (let k = 0; k < N; k++) { const a = -Math.PI / 2 + (k - N / 2) * .2, l = 12 + Rs() * 24, sw = (Rs() - .5) * 14; g.strokeStyle = k % 2 ? '#1c5a58' : '#2b7a70'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + k * 2, y); g.quadraticCurveTo(x + k * 2 + cos(a) * l * .6 + sw, y + sin(a) * l * .6, x + k * 2 + cos(a) * l + sw * .5, y + sin(a) * l); g.stroke(); } }
    g.fillStyle = '#02060a55'; g.beginPath(); g.ellipse(cx, gy + 8, 150, 15, 0, 0, TAU); g.fill();
    const tr = yearTree(weeks, cx, gy, { max: 2 }), C = ['#05070c', '#0a0e16', '#2f5d78', '#020305'];
    if (o.roots) { roots(g, cx, gy + 2, n, o.roots, (l0, col) => { const l = rootHead(l0, cx, gy, tr.w0), e = taper(g, l.pts, C[1]); if (l.pts[0].w > 2) { g.lineWidth = .9; g.strokeStyle = C[2]; path(g, e.L); const m = l.pts.slice(l0.order ? 0 : 7).map(p => ({ x: p.x - p.w * .1, y: p.y })); if (m.length > 1) ln(g, m, col, 1); } }); rootLabels(g, W, H, o.rootNames); }
    const limb = w => byOrder(w).forEach(l => { const e = taper(g, l.pts, w.W.empty ? '#222a30' : C[1]); if (l.pts[0].w > 1.6) { g.lineWidth = .9; g.strokeStyle = C[2]; path(g, e.L); } });
    const jel = (w, back) => { const { W: wk, out, sc, R: Rw } = w; if (wk.empty || !out.tips.length) return; const p = FAR(w, cx, gy - tr.top), r = (8 + min(wk.s, 16) * 1.05) * sc * (back ? .86 : 1), tx = p.x + (Rw() - .5) * 14, ty = p.y - r * 1.2 - Rw() * 8; g.strokeStyle = '#8fd0dc44'; g.lineWidth = .8; g.setLineDash([2, 4]); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(tx, ty + r); g.stroke(); g.setLineDash([]); if (wk.rare) jelly(g, tx, ty, r * 1.3, ['#eaf6ff', '#7fb8ff'], wk.f, Rw); else jelly(g, tx, ty, r, JEL[wk.season], wk.f, Rw); out.tips.forEach(t => { if (t === p) return; g.fillStyle = JEL[wk.season][0]; g.globalAlpha = .75; g.beginPath(); g.arc(t.x, t.y, 2 * sc, 0, TAU); g.fill(); g.globalAlpha = 1; }); if (wk.back) { const t = out.tips.find(q => q !== p) || p; jelly(g, t.x, t.y - 8 * sc, 5 * sc, ['#e0fff4', '#6fe5bd'], 0, Rw); } };
    layers(tr, w => { limb(w); }, () => { tr.boughs.forEach(l => { const e = taper(g, l.pts, C[1]); g.lineWidth = 1; g.strokeStyle = C[2]; path(g, e.L); }); const s = g.createLinearGradient(cx - tr.w0, 0, cx + tr.w0, 0); s.addColorStop(0, '#2f5d78'); s.addColorStop(.22, '#0d141d'); s.addColorStop(1, '#040609'); taper(g, tr.trunk, s); const Rp = rng(5); tr.trunk.forEach(p => { if (p.w < 7) return; for (let k = 0; k < p.w / 7; k++) { g.fillStyle = '#233a48'; g.beginPath(); g.arc(p.x + (Rp() - .5) * p.w * .86, p.y + Rp() * 3, .9 + Rp() * .8, 0, TAU); g.fill(); } }); buttresses(tr.trunk[0].x, gy, tr.w0, 37).forEach(l => { const e = taper(g, l.pts, C[1]); g.lineWidth = .9; g.strokeStyle = C[2]; path(g, e.L); }); }, limb);
    tr.weeks.filter(w => w.behind).forEach(w => jel(w, true)); tr.weeks.filter(w => !w.behind).forEach(w => jel(w, false));
    const r3 = rng(4); g.fillStyle = '#fff'; for (let i = 0; i < 140; i++) { g.globalAlpha = .08 + r3() * .28; g.beginPath(); g.arc(r3() * W, r3() * gy, .6 + r3() * .9, 0, TAU); g.fill(); } g.globalAlpha = 1;
    return hitsOf(tr);
  }
  
  /* ---------- Cyber sorcier C1: the crystal tree. Its high clusters float free of the wood. ---------- */
  const CRY = [['#2a1250', '#6a35c4', '#ad7cff', '#f0dfff'], ['#1c1a58', '#4c55c8', '#90a4ff', '#e6edff'], ['#451252', '#a83ab8', '#e67be0', '#ffe2fb'], ['#172a5e', '#3a6fd0', '#73c2f5', '#def6ff']];
  function shard(g, x, y, a, l, w, P) {
    const cs = cos(a), sn = sin(a), nx = -sn, ny = cs, P0 = [x + nx * w * .5, y + ny * w * .5], P1 = [x - nx * w * .5, y - ny * w * .5], m = .68, S0 = [x + cs * l * m + nx * w, y + sn * l * m + ny * w], S1 = [x + cs * l * m - nx * w, y + sn * l * m - ny * w], C = [x + cs * l * m, y + sn * l * m], T = [x + cs * l, y + sn * l], poly = (q, c) => { g.fillStyle = c; g.beginPath(); q.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath(); g.fill(); };
    poly([P0, S0, C, [x, y]], P[1]); poly([P1, S1, C, [x, y]], P[0]); poly([S0, T, C], P[3]); poly([S1, T, C], P[2]);
    g.strokeStyle = P[3] + '88'; g.lineWidth = .7; g.beginPath(); g.moveTo(P0[0], P0[1]); g.lineTo(S0[0], S0[1]); g.lineTo(T[0], T[1]); g.lineTo(S1[0], S1[1]); g.lineTo(P1[0], P1[1]); g.stroke();
  }
  function runes(g, cx, cy, r, c, R) { g.strokeStyle = c; g.lineWidth = 1.2; [1, .94, .68, .62].forEach(k => { g.beginPath(); g.arc(cx, cy, r * k, 0, TAU); g.stroke(); }); const N = 34; for (let i = 0; i < N; i++) { const q = i / N * TAU; g.save(); g.translate(cx + cos(q) * r * .81, cy + sin(q) * r * .81); g.rotate(q + Math.PI / 2); g.beginPath(); const h = r * .05; for (let k = 0; k < 3; k++) { g.moveTo((R() - .5) * h * 1.3, (R() - .5) * h * 2.2); g.lineTo((R() - .5) * h * 1.3, (R() - .5) * h * 2.2); } g.stroke(); g.restore(); } g.beginPath(); for (let i = 0; i <= 7; i++) { const q = -Math.PI / 2 + i * 3 / 7 * TAU; g.lineTo(cx + cos(q) * r * .62, cy + sin(q) * r * .62); } g.stroke(); }
  function book(g, x, y, s, c, a) { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#3a2360'; g.beginPath(); g.moveTo(-15 * s, 2 * s); g.quadraticCurveTo(-7 * s, -3 * s, 0, 2 * s); g.quadraticCurveTo(7 * s, -3 * s, 15 * s, 2 * s); g.lineTo(15 * s, 6 * s); g.quadraticCurveTo(7 * s, 1 * s, 0, 7 * s); g.quadraticCurveTo(-7 * s, 1 * s, -15 * s, 6 * s); g.fill(); g.fillStyle = c; g.beginPath(); g.moveTo(-13.5 * s, 0); g.quadraticCurveTo(-7 * s, -5 * s, 0, 0); g.quadraticCurveTo(7 * s, -5 * s, 13.5 * s, 0); g.lineTo(13.5 * s, 3.5 * s); g.quadraticCurveTo(7 * s, -1.5 * s, 0, 4 * s); g.quadraticCurveTo(-7 * s, -1.5 * s, -13.5 * s, 3.5 * s); g.fill(); g.strokeStyle = '#6a4fa099'; g.lineWidth = .7; for (const k of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(k * 2.5 * s, (.6 + i * 1) * s - 1 * s); g.quadraticCurveTo(k * 7 * s, (-2.5 + i) * s, k * 12 * s, (.6 + i) * s - 1 * s); g.stroke(); } g.restore(); }
  function stoneFloor(g, W, H, gy) { g.fillStyle = vgrad(g, gy, H, [[0, '#2a2438'], [.5, '#141020'], [1, '#07050d']]); g.fillRect(0, gy, W, H - gy); g.strokeStyle = '#0a0812'; g.lineWidth = 2; for (let r = 0; r < 8; r++) { const y = gy + r * r * 3 + r * 8; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x = (r % 2) * 40; x < W; x += 80 + r * 12) { g.beginPath(); g.moveTo(x, y); g.lineTo(x - (x - W / 2) * .06, y + r * 6 + 8); g.stroke(); } } g.strokeStyle = '#594c70'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke(); }
  // A limb cut like a gem: straight facets, a lit side and a dark side, a bright ridge, a joint where it bends
  function prism(g, pts, P, lit = true) {
    const q = pts.filter((_, i) => i % 3 === 0 || i === pts.length - 1); if (q.length < 2) return;
    const side = (u, v) => { const L = [], Rr = []; q.forEach((p, i) => { const a = q[min(i + 1, q.length - 1)], b = q[max(i - 1, 0)], an = atan2(a.y - b.y, a.x - b.x) + Math.PI / 2; L.push([p.x + cos(an) * p.w * u, p.y + sin(an) * p.w * u]); Rr.push([p.x + cos(an) * p.w * v, p.y + sin(an) * p.w * v]); }); return [L, Rr]; };
    const band = (u, v, c) => { const [A, B] = side(u, v); g.fillStyle = c; g.beginPath(); A.forEach((m, i) => (i ? g.lineTo(m[0], m[1]) : g.moveTo(m[0], m[1]))); B.reverse().forEach(m => g.lineTo(m[0], m[1])); g.closePath(); g.fill(); };
    band(-.55, -.12, P[0]); band(-.12, .22, P[1]); band(.22, .55, lit ? P[2] : P[1]);
    const [Rd] = side(.22, .22); g.strokeStyle = P[3]; g.lineWidth = max(.6, q[0].w * .07); g.beginPath(); Rd.forEach((m, i) => (i ? g.lineTo(m[0], m[1]) : g.moveTo(m[0], m[1]))); g.stroke();
    if (q[0].w > 5) { g.strokeStyle = P[3] + '55'; g.lineWidth = .7; q.forEach((p, i) => { if (!i || i === q.length - 1 || i % 2) return; const a = q[i + 1], b = q[i - 1], an = atan2(a.y - b.y, a.x - b.x) + Math.PI / 2; g.beginPath(); g.moveTo(p.x + cos(an) * p.w * .55, p.y + sin(an) * p.w * .55); g.lineTo(p.x + cos(an) * p.w * .22 + cos(an - Math.PI / 2) * 3, p.y + sin(an) * p.w * .22 + sin(an - Math.PI / 2) * 3); g.lineTo(p.x - cos(an) * p.w * .55, p.y - sin(an) * p.w * .55); g.stroke(); }); }
  }
  // The trunk is one big crystal: a mesh of triangles, each face its own shade, with an uneven cut outline
  function gemTrunk(g, T, seed) {
    const Rg = rng(seed), US = [-.5, -.24, .04, .3, .5], rows = [], step = 4; const COL = ['#1d0c3e', '#34187a', '#6a3cd0', '#b891ff', '#2a1260'];
    for (let i = 0; i < T.length; i += step) { const p = T[i], kick = (Rg() - .5) * p.w * .08; rows.push(US.map((u, k) => ({ x: p.x + u * p.w * (1 + (k === 0 || k === 4 ? (Rg() - .5) * .16 : 0)) + (k && k < 4 ? kick + (Rg() - .5) * p.w * .05 : 0), y: p.y + (k && k < 4 ? (Rg() - .5) * 8 : 0) }))); }
    const tri = (a, b, c, col) => { g.fillStyle = col; g.strokeStyle = col; g.lineWidth = .5; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.closePath(); g.fill(); g.stroke(); };
    for (let r = 0; r < rows.length - 1; r++) for (let k = 0; k < 4; k++) { const a = rows[r][k], b = rows[r][k + 1], c = rows[r + 1][k + 1], d = rows[r + 1][k], base = COL[k + (Rg() < .22 ? 1 : 0)], alt = COL[max(0, k - (Rg() < .4 ? 1 : 0))]; if ((r + k) % 2) { tri(a, b, c, base); tri(a, c, d, alt); } else { tri(a, b, d, base); tri(b, c, d, alt); } }
    g.strokeStyle = '#ece0ff66'; g.lineWidth = .9; for (let r = 0; r < rows.length - 1; r++) { const a = rows[r][2], b = rows[r + 1][3]; if (r % 2) { g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); } const m = rows[r][3], m2 = rows[r + 1][3]; g.strokeStyle = '#f4ecff99'; g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(m2.x, m2.y); g.stroke(); g.strokeStyle = '#ece0ff66'; }
    const mid = T[floor(T.length * .45)]; if (mid) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, mid.x + mid.w * .08, mid.y, mid.w * 1.1, '#a06cff', .3); g.restore(); }
  }
  // The foot: a true druse. Crystals of the trunk's own colour push out of the stone at their own angles, tall near the trunk, small and scattered further out
  function druse(g, x, gy, w0, G) {
    const Rd = rng(53), list = [], P = ['#1d0c3e', '#34187a', '#8a5ce0', '#d9c6ff'], P2 = ['#17123e', '#2b2e80', '#6f7ce0', '#d6e0ff'];
    for (let i = 0; i < 26; i++) { const near = i < 12, u = near ? (i / 11 - .5) * 2 : (Rd() < .5 ? -1 : 1) * (.9 + Rd() * 1.7), dist = abs(u); list.push({ x: x + u * (w0 * .62 + 34 * G), y: gy + 2 + Rd() * (near ? 8 : 22), a: -Math.PI / 2 + u * .34 + (Rd() - .5) * .42, l: (near ? 42 + Rd() * 58 : 12 + Rd() * 26) * (.45 + .55 * G) * (1 - min(dist, 1.6) * .22), w: (near ? 9 + Rd() * 8 : 4 + Rd() * 4) * (.55 + .45 * G), P: Rd() < .3 ? P2 : P }); }
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, gy + 8); g.scale(1, .22); glow(g, 0, 0, 170 + 120 * G, '#7f4be0', .4); g.restore();
    list.sort((a, b) => a.y - b.y).forEach(c => { g.fillStyle = '#05030c88'; g.beginPath(); g.ellipse(c.x, c.y + 2, c.w * 1.25, c.w * .36, 0, 0, TAU); g.fill(); shard(g, c.x, c.y, c.a, c.l, c.w, c.P); });
  }
  function farIsle(g, x, y, s, tower) {
    const Rf = rng(x | 0), top = [], low = [], N = 9; for (let i = 0; i <= N; i++) { const u = i / N * 2 - 1; top.push([x + u * 50 * s, y - (1 - u * u) * 3 * s]); low.push([x + u * 50 * s, y + (1 - abs(u)) * (30 + Rf() * 22) * s + 3 * s]); }
    g.fillStyle = '#2b1c66'; g.beginPath(); top.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); low.reverse().forEach(p => g.lineTo(p[0], p[1])); g.closePath(); g.fill();
    g.strokeStyle = '#a58cf0aa'; g.lineWidth = 1.2; g.beginPath(); top.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    if (!tower) return;
    glow(g, x, y - 46 * s, 90 * s, '#a07cff', .3); g.fillStyle = '#35247a'; g.beginPath(); g.moveTo(x - 10 * s, y); g.lineTo(x - 7 * s, y - 66 * s); g.lineTo(x + 7 * s, y - 66 * s); g.lineTo(x + 10 * s, y); g.fill();
    g.fillRect(x - 22 * s, y - 24 * s, 13 * s, 24 * s); g.beginPath(); g.moveTo(x - 24 * s, y - 24 * s); g.lineTo(x - 15.5 * s, y - 40 * s); g.lineTo(x - 7 * s, y - 24 * s); g.fill();
    g.beginPath(); g.moveTo(x - 11 * s, y - 66 * s); g.lineTo(x, y - 94 * s); g.lineTo(x + 11 * s, y - 66 * s); g.fill();
    g.fillStyle = '#ffd9a0'; [[0, -56], [-3, -42], [3, -30], [-16, -14]].forEach(([a, b]) => g.fillRect(x + a * s - 1, y + b * s, 2.2, 4)); 
  }
  function crystal(g, W, H, weeks, o) {
    const gy = 590, cx = W / 2 - 4, R = rng(71), n = weeks.length;
    g.fillStyle = vgrad(g, 0, gy, [[0, '#0a0420'], [.7, '#1a0b3c'], [1, '#2a1258']]); g.fillRect(0, 0, W, gy); dust(g, R, W, gy * .85, 170, '#e0d2ff');
    glow(g, cx, 290, 460, '#7f3be0', .34); runes(g, cx, 290, 372, '#9e78ff55', rng(2));
    [[92, 190, -.2], [842, 130, .16], [120, 400, .1], [858, 390, -.14]].forEach(([x, y, a], i) => { glow(g, x, y, 42, '#a07cff55'); book(g, x, y, .95 - i * .06, '#d9cdf0', a); });
    // Far off, the world's floating tower and two rocks, small and dim, so the back has a place and not only a ridge
    farIsle(g, 806, 462, 1, true); farIsle(g, 898, 494, .42, false); farIsle(g, 92, 486, .62, false);
    g.fillStyle = '#0d0820'; g.beginPath(); g.moveTo(0, gy); for (let x = 0; x <= W; x += 12) g.lineTo(x, gy - 52 - sin(x * .009 + 1) * 22 - sin(x * .027) * 8); g.lineTo(W, gy); g.fill();
    stoneFloor(g, W, H, gy);
    if (o.roots) { roots(g, cx, gy + 2, n, o.roots, (l, col) => { prism(g, l.pts.map(p => ({ x: p.x, y: p.y, w: max(1.6, p.w * 1.05) })), ['#1d0c3e', '#34187a', '#8a5ce0', col]); }); rootLabels(g, W, H, o.rootNames); }
    const tr = yearTree(weeks, cx, gy, { max: 1 }), P0 = CRY[0], top = gy - tr.top;
    const limb = w => byOrder(w).forEach(l => { const floats = w.float, pts = floats ? l.pts.slice(0, Math.max(2, floor(l.pts.length * .62))) : l.pts; if (w.W.empty) { ln(g, pts, '#4a4258', 1.4); return; } const PL = w.W.rare ? ['#1c3f68', '#5da6e8', '#b9e4ff', '#ffffff'] : CRY[w.W.season]; prism(g, pts.map(p => ({ x: p.x, y: p.y, w: max(1.8, p.w * 1.25) })), PL, !w.behind); });
    const cluster = (w, far) => { const { W: wk, out, sc, R: Rw } = w; const P = wk.rare ? ['#1c3f68', '#5da6e8', '#b9e4ff', '#ffffff'] : CRY[wk.season]; if (wk.empty) { const p = out.tips[0]; if (p) shard(g, p.x, p.y, -1.4, 13 * sc, 3 * sc, ['#23202c', '#3a3644', '#5b5668', '#7b7688']); return; }
      out.tips.forEach((t, ti) => { const dy = w.float ? -(16 + (w.W.i % 3) * 9) * sc : 0, x = t.x, y = t.y + dy, s = min(wk.s, 16), N = 2 + round(s * .22), base = t.a; if (w.float) { g.strokeStyle = P[2] + '88'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y + 9 * sc, 15 * sc, 4 * sc, 0, 0, TAU); g.stroke(); } glow(g, x, y - 6, (22 + s) * sc, P[1] + '66', far ? .55 : 1);
        for (let i = 0; i < N; i++) { const a = base + (i / max(1, N - 1) - .5) * 1.75 + (Rw() - .5) * .2, l = (19 + s * 1.5 + Rw() * 11) * sc * (far ? .8 : 1), wd = (3.8 + s * .2) * sc; shard(g, x, y, a, l, wd, P); }
        if (ti < wk.f) { const a = base, tx = x + cos(a) * (24 + s) * sc, ty = y + sin(a) * (24 + s) * sc; glow(g, tx, ty, 13 * sc, '#ff8aef'); g.fillStyle = '#fff'; g.beginPath(); for (let k = 0; k < 8; k++) { const q = k / 8 * TAU, r = (k % 2 ? 1.2 : 7) * sc; g.lineTo(tx + cos(q) * r, ty + sin(q) * r); } g.fill(); }
        if (wk.back && ti === 0) { const b2 = -Math.PI / 2; shard(g, x, y, b2, 18 * sc, 4 * sc, ['#0f5a48', '#2ca88a', '#8ff2d0', '#e6fff5']); glow(g, x, y - 12, 14, '#9ff2d8aa'); } }); };
    tr.weeks.forEach(w => { w.float = !w.W.empty && (w.out.tips[0] && w.out.tips[0].y < top + 40) && w.W.i % 2 === 0; });
    layers(tr, w => { limb(w); cluster(w, true); }, () => {
      tr.boughs.forEach(l => prism(g, l.pts.map(p => ({ x: p.x, y: p.y, w: p.w * 1.1 })), ['#1d0c3e', '#4a23a0', '#8a5ce0', '#efe2ff']));
      gemTrunk(g, tr.trunk, 41);
      druse(g, tr.trunk[0].x, gy, tr.w0, min(1.05, sqrt(n / 40)));
    }, w => { limb(w); cluster(w, false); });
    return hitsOf(tr);
  }
  
  /* ---------- Cyber sorcier C2: the page tree. A twisted wood in a round library, whose leaves are pages. ---------- */
  const PAGE = [['#d9bf8e', '#8d6a3e'], ['#cfd3ea', '#6b74a6'], ['#e4bccb', '#94597a'], ['#b9dcc6', '#558a70']];
  function grimoire(g, W, H, weeks, o) {
    const gy = 590, cx = W / 2, R = rng(13), n = weeks.length;
    g.fillStyle = '#0a0618'; g.fillRect(0, 0, W, gy);
    const cols = 15; for (let c = 0; c < cols; c++) { const u = (c + .5) / cols * 2 - 1, x0 = cx + sin(u * 1.45) / sin(1.45) * (W / 2 + 40), x1 = cx + sin((u + 2 / cols) * 1.45) / sin(1.45) * (W / 2 + 40), wd = x1 - x0, shade = .35 + .5 * abs(u); for (let r = 0; r < 9; r++) { const y = 18 + r * 64, h = 56; g.fillStyle = '#160e2a'; g.fillRect(x0, y, wd, h); let x = x0 + 2; while (x < x1 - 3) { const sw = max(2, (4 + R() * 8) * (1 - abs(u) * .55)), bh = h * (.62 + R() * .32); g.fillStyle = pickOf(R, ['#3f2a6a', '#5a2f58', '#2c3a6e', '#6a4a2c', '#2f5a5a', '#4a2f7a', '#74304a']); g.fillRect(x, y + h - bh, sw, bh); if (R() < .3) { g.fillStyle = '#d4b66a55'; g.fillRect(x, y + h - bh + 6, sw, 1.4); } x += sw + .7; } g.fillStyle = '#34224a'; g.fillRect(x0, y + h, wd, 6); } g.fillStyle = '#2a1a40'; g.fillRect(x0 - 1.5, 0, 3, gy); g.fillStyle = `rgba(6,3,14,${shade * .55 + .2})`; g.fillRect(x0, 0, wd + 1, gy); }
    const v = g.createRadialGradient(cx, 300, 60, cx, 300, 520); v.addColorStop(0, '#8450e03d'); v.addColorStop(.55, '#3a1e7a18'); v.addColorStop(1, '#05030c00'); g.fillStyle = v; g.fillRect(0, 0, W, gy); glow(g, cx, 240, 300, '#b48cff', .12);
    stoneFloor(g, W, H, gy);
    // The tree stands at the very centre of the floor circle
    const base = gy + 44, B = ['#39344c', '#6e6a88', '#c4c2da', '#1a1726'];
    g.strokeStyle = '#a77cff88'; g.lineWidth = 1.3; [1, .84].forEach(k => { g.beginPath(); g.ellipse(cx, base, 300 * k, 42 * k, 0, 0, TAU); g.stroke(); }); const Rr = rng(5); for (let i = 0; i < 26; i++) { const q = i / 26 * TAU, x = cx + cos(q) * 276, y = base + sin(q) * 38.5; g.beginPath(); g.moveTo(x - 3, y - 2 * Rr()); g.lineTo(x + 3 * Rr(), y + 2); g.stroke(); }
    g.fillStyle = '#05030c70'; g.beginPath(); g.ellipse(cx, base + 3, 96, 13, 0, 0, TAU); g.fill();
    // Roots of the same twisted wood as the trunk; only a thin vein keeps each one's colour
    const tr = yearTree(weeks, cx, base, { max: 2 });
    if (o.roots) { roots(g, cx, base - 2, n, o.roots, (l0, col) => { const l = rootHead({ ...l0, pts: l0.pts.map(p => ({ x: p.x, y: p.y, w: p.w * 1.1 })) }, cx, base, tr.w0); woodLimb(g, l, B); if (l0.pts[0].w > 2.6) { const m = l.pts.slice(l0.order ? 0 : 7).map(p => ({ x: p.x + sin(p.y * .09) * p.w * .22, y: p.y })); g.globalAlpha = .55; if (m.length > 1) ln(g, m, col, .9); g.globalAlpha = 1; } }); rootLabels(g, W, H, o.rootNames); }
    const leaf = (x, y, a, s, P, dim) => { g.save(); g.translate(x, y); g.rotate(a); g.transform(1, 0, -.28, 1, 0, 0); g.fillStyle = dim ? P[1] : P[0]; g.fillRect(-s * .72, -s, s * 1.44, s * 2); g.fillStyle = dim ? '#00000040' : P[1] + 'cc'; for (let k = 0; k < 4; k++) g.fillRect(-s * .5, -s * .66 + k * s * .4, s * (k === 3 ? .55 : 1), max(.6, s * .07)); g.restore(); };
    const lay = dim => w => { const { W: wk, out, R: Rw, sc } = w; byOrder(w).forEach(l => woodLimb(g, l, wk.empty ? ['#3a3844', '#67646f', '#92909a', '#2a2830'] : B)); if (wk.empty) return; const P = PAGE[wk.season], N = dim ? 3 : 3; out.tips.forEach(t => { const rad = (14 + min(wk.s, 16) * .95) * sc; for (let i = 0; i < N + min(wk.s, 16) * .16; i++) { const a = Rw() * TAU, r = sqrt(Rw()) * rad; leaf(t.x + cos(a) * r, t.y + sin(a) * r * .85, (Rw() - .5) * 1.5, (4.6 + Rw() * 2.4) * sc, P, dim); } }); };
    layers(tr, lay(true), () => { tr.boughs.forEach(l => woodLimb(g, l, B)); const s = g.createLinearGradient(cx - tr.w0, 0, cx + tr.w0, 0); s.addColorStop(0, B[3]); s.addColorStop(.6, B[1]); s.addColorStop(1, B[2]); taper(g, tr.trunk, s); for (let k = 0; k < 5; k++) { const ph = k * 1.26; g.strokeStyle = k % 2 ? '#a77cff66' : B[3]; g.lineWidth = 1.6 + (k % 2) * 1.4; g.beginPath(); tr.trunk.forEach((p, i) => { const x = p.x + sin(i * .17 + ph) * p.w * .44; i ? g.lineTo(x, p.y) : g.moveTo(x, p.y); }); g.stroke(); } buttresses(tr.trunk[0].x, base, tr.w0, 43).forEach(l => woodLimb(g, l, B)); }, lay(false));
    tr.weeks.forEach(w => { const { W: wk, out, R: Rw, sc } = w; if (wk.empty || !out.tips.length) return; for (let i = 0; i < min(wk.f, 2); i++) { const t = out.tips[floor(Rw() * out.tips.length)], y = t.y - 15 * sc; glow(g, t.x, y, 18 * sc, '#c79bff66'); book(g, t.x, y, .72 * sc + .25, '#fff8e6', (Rw() - .5) * .4); } if (wk.back) { const t = out.tips[0]; glow(g, t.x, t.y, 15, '#9ff2d8aa'); leaf(t.x, t.y, .2, 5 * sc, ['#e6fff5', '#8ff2c8'], false); } if (wk.rare) { const t = out.tips[out.tips.length - 1]; glow(g, t.x, t.y - 20 * sc, 36 * sc, '#9fd0ffbb'); book(g, t.x, t.y - 20 * sc, 1.1 * sc + .3, '#e4f3ff', 0); } });
    const Rd = rng(84), crown = base - tr.top - 120 * sqrt(n / 40); for (let i = 0; i < min(20, n); i++) { const q = i / 20; leaf(cx + (Rd() - .5) * 420 * sqrt(n / 40), crown - Rd() * 130 * sqrt(n / 40) - 10, Rd() * 1.8 - .9, 3.8, PAGE[i % 4], false); }
    return hitsOf(tr);
  }
  
  /* ---------- Ville néon: shared pieces. Glass tubes, the hillside city, the wet roof the user liked. ---------- */
  const NEON = ['#ffb14a', '#7fd6ff', '#ff78c4', '#49ffc2'];
  function tube(g, pts, c, w) { ln(g, pts, c + '1f', w * 7); ln(g, pts, c + '4d', w * 3.2); ln(g, pts, c, w * 1.25); g.globalAlpha = .9; ln(g, pts, '#ffffff', max(.6, w * .42)); g.globalAlpha = 1; }
  function hillCity(g, W, y, R) {
    g.fillStyle = '#231337'; g.beginPath(); g.moveTo(0, y + 40); for (let x = 0; x <= W; x += 10) g.lineTo(x, y - 86 * exp(-pow((x - W * .58) / 280, 2)) + sin(x * .02) * 5); g.lineTo(W, y + 40); g.fill();
    for (let i = 0; i < 90; i++) { const x = R() * W, hb = y - 86 * exp(-pow((x - W * .58) / 280, 2)), h = 16 + R() * R() * 150 * (1 - abs(x - W * .58) / W), w = 12 + R() * 22, top = hb - h + 12; g.fillStyle = pickOf(R, ['#1a1030', '#201438', '#17122c', '#2a1a40']); g.fillRect(x, top, w, h + 40); for (let yy = top + 5; yy < hb + 26; yy += 7) for (let xx = x + 3; xx < x + w - 3; xx += 5) if (R() < .28) { g.fillStyle = pickOf(R, ['#ffcf7a', '#7fd6ff', '#ff9ad0', '#f4e8c8']); g.globalAlpha = .55 + R() * .4; g.fillRect(xx, yy, 2.2, 2.8); g.globalAlpha = 1; } if (R() < .22) { const c = pickOf(R, ['#ff5ab4', '#3fe0ff']); g.fillStyle = c; g.fillRect(x + 2, top - 1, w - 4, 1.8); glow(g, x + w / 2, top, 26, c, .25); } }
  }
  function rainLines(g, R, W, H) { g.strokeStyle = '#bcd8ff10'; g.lineWidth = 1; for (let i = 0; i < 180; i++) { const x = R() * (W + 80), y = R() * H, l = 14 + R() * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * .22, y + l); g.stroke(); } }
  
  /* ---------- Ville néon N3: the wired tree. A flat-topped tree of bundled city cables on the wet roof; each week is one strung line of LEDs. ---------- */
  function wired(g, W, H, weeks, o) {
    const gy = 566, cx = W / 2 - 10, R = rng(47), n = weeks.length, G = min(1.05, sqrt(n / 40));
    g.fillStyle = vgrad(g, 0, 470, [[0, '#090818'], [.55, '#1e1036'], [.85, '#55235a'], [1, '#a13f6a']]); g.fillRect(0, 0, W, 470); dust(g, R, W, 200, 60, '#d9cff0');
    hillCity(g, W, 470, R);
    g.fillStyle = vgrad(g, 440, 520, [[0, '#ff5ab400'], [1, '#c85ad040']]); g.fillRect(0, 440, W, 80);
    g.fillStyle = '#17131f'; g.fillRect(0, 500, W, 30); g.fillStyle = '#39324a'; g.fillRect(0, 498, W, 4); for (let x = 0; x < W; x += 92) { g.fillStyle = '#0f0c16'; g.fillRect(x, 502, 2, 28); }
    g.fillStyle = vgrad(g, 530, H, [[0, '#2a2534'], [.35, '#17131f'], [1, '#07060b']]); g.fillRect(0, 530, W, H - 530);
    const hx = 96; g.fillStyle = '#2a2736'; g.fillRect(hx - 62, 448, 124, 90); g.fillStyle = '#3d394c'; g.fillRect(hx - 62, 448, 124, 8); g.strokeStyle = '#17141f'; g.lineWidth = 2; for (let y = 464; y < 532; y += 7) { g.beginPath(); g.moveTo(hx - 54, y); g.lineTo(hx + 54, y); g.stroke(); } g.fillStyle = '#ff5a6a'; g.fillRect(hx + 40, 456, 7, 3); glow(g, hx + 43, 458, 12, '#ff5a6a', .8);
    // The crown is flat like an acacia's: heights above the fork are squashed and pushed out, the whole crown lifted on a long bare bundle
    const tr = yearTree(weeks, cx, gy, { max: 1 }), lift = 56 + 176 * G, fork = gy - tr.top * .72, sq = .4;
    const P = p => (p.y < fork ? { x: cx + (p.x - cx) * 1.2, y: fork - (fork - p.y) * sq - lift, w: p.w } : { x: p.x, y: p.y - lift, w: p.w });
    const cable = (pts, w, rim) => { ln(g, pts, '#05040a', w + 1.6); ln(g, pts, '#1d1a28', w); const hi = pts.map(p => ({ x: p.x - w * .22, y: p.y - w * .22 })); ln(g, hi, rim || '#6d6484', max(.5, w * .2)); };
    const boughs = tr.boughs.map(b => b.pts.filter((_, i) => i % 2 === 0).map(P));
    // The bundle: one group of cables per bough, wound together from the roof, opening where each bough leaves
    const lines = [], NC = 4 + round(14 * G);
    for (let k = 0; k < NC; k++) { const u = (k + .5) / NC * 2 - 1, b = boughs[k % max(1, boughs.length)], end = b ? b[0] : { x: cx, y: gy - lift }, pts = [], Rk = rng(610 + k * 7), ph = Rk() * TAU, hTop = gy - end.y, foot = u * (34 + 92 * G); for (let i = 0; i <= 22; i++) { const q = i / 22, sp = (5 + 21 * G) * (1 - pow(q, 6)), xx = lerp(cx + foot * exp(-q * 10) + u * sp, end.x, pow(q, 5)) + sin(q * 7 + ph) * (1 - pow(q, 3)) * (2.5 + 5 * G); pts.push({ x: xx, y: gy + 10 * exp(-q * 7) * abs(u) - hTop * q }); } lines.push(pts); }
    // A health root is one more cable run across the roof, leaving from the foot of the bundle, with a lit core
    if (o.roots) { roots(g, cx, gy + 4, n, o.roots, (l, col) => { if (l.order > 1) return; const q = l.pts.map(p => ({ x: cx + (p.x - cx) * 1.25, y: gy + 4 + (p.y - gy - 4) * .62 })), Wd = max(1.8, l.pts[0].w * .42), head = l.order ? [] : [{ x: q[0].x, y: gy - 14 }]; const pts = head.concat(q); cable(pts, Wd); ln(g, pts, col, .9); }); }
    const week = (w, lit) => {
      const { W: wk, out, R: Rw, sc } = w, c = wk.rare ? '#9fd0ff' : NEON[wk.season], lim = out.limbs.map(l => ({ ...l, q: l.pts.filter((_, i) => i % 2 === 0 || i === l.pts.length - 1).map(P) }));
      const tips0 = out.tips[0]; lim.filter(l => l.order === 0 || (tips0 && l.pts[l.pts.length - 1].x === tips0.x)).forEach(l => cable(l.q, max(1, l.pts[0].w * (l.order ? .3 : .42)), lit ? (wk.empty ? '#55505f' : '#8a7fa4') : '#3a3548'));
      const main = lim.find(l => l.order === 0) || lim[0], from = main.q[0], tips = out.tips.map(P);
      tips.slice(0, wk.empty ? 1 : wk.s >= 8 ? 2 : 1).forEach((t, ti) => {
        const sag = (wk.empty ? 10 : 16 + min(wk.s, 16) * 2.3) * sc + ti * 7, wire = []; for (let i = 0; i <= 18; i++) { const q = i / 18; wire.push({ x: lerp(t.x, from.x, q * .62), y: lerp(t.y, from.y, q * .62) + sin(q * Math.PI) * sag }); }
        if (wk.empty) { ln(g, wire, '#4a4556', 1); g.fillStyle = '#6a6474'; g.beginPath(); g.arc(t.x, t.y, 2.2 * sc, 0, TAU); g.fill(); return; }
        if (!lit) { ln(g, wire, c + '30', 1); wire.forEach((p, i) => { if (i % 3 === 0) { g.fillStyle = c + '66'; g.beginPath(); g.arc(p.x, p.y, 1, 0, TAU); g.fill(); } }); return; }
        ln(g, wire, c + '1c', 6); ln(g, wire, '#0b0910', 1); const Rl = rng(wk.i * 31 + ti); wire.forEach((p, i) => { if (i === 0 || i % 2) return; g.fillStyle = c + '2a'; g.beginPath(); g.arc(p.x, p.y + 1.4, 4.6 + min(wk.s, 16) * .12, 0, TAU); g.fill(); g.fillStyle = c; g.globalAlpha = .7 + Rl() * .3; g.beginPath(); g.arc(p.x, p.y + 1.4, 1.5 + min(wk.s, 16) * .05 + Rl() * .4, 0, TAU); g.fill(); g.globalAlpha = 1; g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x, p.y + 1.1, .7, 0, TAU); g.fill(); });
        for (let fi = 0; fi < (ti ? 0 : min(wk.f, 3)); fi++) { const m = wire[6 + fi * 4]; glow(g, m.x, m.y + 2, 9 * sc, '#ff4fc8', .9); g.save(); g.translate(m.x, m.y + 2); g.rotate(Math.PI / 4); g.fillStyle = '#ffd6f0'; g.fillRect(-2.4 * sc, -2.4 * sc, 4.8 * sc, 4.8 * sc); g.restore(); }
      });
      if (!lit || wk.empty || !tips.length) return;
      if (wk.back) { const t = tips[0]; glow(g, t.x, t.y, 15, '#d6fff0'); g.fillStyle = '#fff'; g.beginPath(); g.arc(t.x, t.y, 3, 0, TAU); g.fill(); }
      if (wk.rare) { const t = tips[tips.length - 1]; glow(g, t.x, t.y, 34, '#9fd0ff'); g.strokeStyle = '#e4f3ff'; g.lineWidth = 2; g.beginPath(); g.arc(t.x, t.y, 8 * sc, 0, TAU); g.stroke(); }
    };
    // A wide, low haze lit by the crown, so the tree reads against the city behind it
    const crownY = fork - lift - 30 * G; g.save(); g.translate(cx, crownY); g.scale(1, .42); glow(g, -60 * G, 0, 120 + 300 * G, '#ff78c4', .16); glow(g, 70 * G, -20, 100 + 260 * G, '#7fd6ff', .13); g.restore();
    tr.weeks.filter(w => w.behind).forEach(w => week(w, false));
    lines.forEach((p, k) => cable(p, 2.6 + 3.2 * G, k % 3 === 0 ? '#ff78c488' : k % 3 === 1 ? '#7fd6ff66' : '#6d6484'));
    boughs.forEach(b => cable(b.map(p => ({ x: p.x, y: p.y })), 2.4 + 3 * G, '#8a7fa4'));
    // Two tubes run up the bundle, so the tree is lit from inside and reads against the roof
    [lines[0], lines[floor(NC / 2)]].forEach((p, k) => { if (p) tube(g, p.slice(1, 18), k ? '#7fd6ff' : '#ff78c4', .75); });
    tr.weeks.filter(w => !w.behind).forEach(w => week(w, true));
    // The wet roof mirrors the tree: thin strips copied upside down, each nudged sideways by the ripples, fading with distance
    const T0 = g.getTransform(), cvs = g.canvas, ax = gy + 4, sx = T0.a || 1;
    if (cvs && T0.b === 0 && T0.c === 0) {
      const Rq = rng(91); g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      for (let y = ax + 2; y < H - 4; y += 3) { const src = 2 * ax - y; if (src < 0) break; const d = (y - ax) / (H - ax), dx = sin(y * .21) * (1.5 + 5 * d) + (Rq() - .5) * 1.4; g.globalAlpha = .46 * (1 - d) + .05; g.drawImage(cvs, T0.e, (src * sx + T0.f), W * sx, 3 * sx, T0.e + dx * sx, y * sx + T0.f, W * sx, 3 * sx); }
      g.restore(); g.globalAlpha = 1;
    }
    // The tree's colours run in the wet roof
    const Rr = rng(77); tr.weeks.forEach(w => { if (w.W.empty || !w.out.tips.length) return; const c = w.W.rare ? '#9fd0ff' : NEON[w.W.season], x = P(w.out.tips[0]).x, rw = 14 + Rr() * 34; for (let k = 0; k < 2; k++) { const y = gy + 40 + Rr() * 120; g.globalAlpha = .05 + Rr() * .07; g.fillStyle = c; g.beginPath(); g.ellipse(x + (Rr() - .5) * 26, y, rw * (1 + (y - gy) / 160), 1.6 + Rr() * 3, 0, 0, TAU); g.fill(); } g.globalAlpha = 1; });
    // A dark lip where the roof meets the foot of the bundle, so the tree stands on it rather than floating over its reflection
    g.save(); g.translate(cx, gy + 6); g.scale(1, .16); glow(g, 0, 0, 90 + 110 * G, '#05040a', .8); g.restore();
    rainLines(g, R, W, H);
    if (o.roots) rootLabels(g, W, H, o.rootNames);
    const out = []; tr.weeks.forEach(w => w.out.tips.forEach(t => { const p = P(t); out.push({ i: w.W.i, x: p.x, y: p.y }); }));
    return out;
  }
  /* ---------- Brouillard F1: the silver tree. Bare wood in grey fog; crimson berries are the only colour. ---------- */
  function fogBank(g, R, W, y0, y1, c, a, n, gr = 1) { for (let i = 0; i < n; i++) { const x = R() * W, y = lerp(y0, y1, R()), rx = (100 + R() * 240) * gr, ry = (20 + R() * 46) * gr; g.save(); g.translate(x, y); g.scale(1, ry / rx); const h = g.createRadialGradient(0, 0, 0, 0, 0, rx); h.addColorStop(0, c + 'ff'); h.addColorStop(.55, c + '88'); h.addColorStop(1, c + '00'); g.globalAlpha = a * (.5 + R() * .5); g.fillStyle = h; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore(); } g.globalAlpha = 1; }
  function shardRock(g, x, y, s, R) { g.fillStyle = '#4c4d52'; g.beginPath(); const N = 7; for (let i = 0; i < N; i++) { const a = i / N * TAU, q = s * (.65 + R() * .5) * (sin(a) > 0 ? 1.3 : .7); g.lineTo(x + cos(a) * q * 1.2, y + sin(a) * q); } g.closePath(); g.fill(); g.strokeStyle = '#a03a3a88'; g.lineWidth = 1; g.stroke(); g.fillStyle = '#6b6c70'; g.beginPath(); g.ellipse(x - s * .2, y - s * .28, s * .5, s * .2, -.2, 0, TAU); g.fill(); }
  function silver(g, W, H, weeks, o) {
    const gy = 590, cx = W / 2 - 10, R = rng(37), n = weeks.length, lift = min(1, n / 40);
    g.fillStyle = vgrad(g, 0, H, [[0, '#2c2e33'], [.45, '#585a5f'], [.8, '#6e7075'], [1, '#34363a']]); g.fillRect(0, 0, W, H);
    const hx = W * .72, hy = 170; g.strokeStyle = '#dcdcd088'; g.lineWidth = 2; g.beginPath(); g.arc(hx, hy, 76, 0, TAU); g.stroke(); glow(g, hx, hy, 190, '#e8e8dc', .24); g.strokeStyle = '#dcdcd033'; g.lineWidth = 1; g.beginPath(); g.arc(hx, hy, 96, 0, TAU); g.stroke();
    fogBank(g, R, W, 60, 330, '#7d7f84', .28, 18);
    [[120, 170, 22], [214, 100, 11], [812, 330, 16], [876, 240, 9], [70, 300, 11], [760, 90, 8]].forEach(([x, y, s]) => shardRock(g, x, y, s, R));
    [[gy - 96, '#4a4c52', .007, 28], [gy - 56, '#3b3d43', .013, 18]].forEach(([y, c, f, a], k) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, gy + 20); for (let x = 0; x <= W; x += 8) g.lineTo(x, y + sin(x * f + k * 2) * a + sin(x * f * 3 + k) * a * .3); g.lineTo(W, gy + 20); g.fill(); });
    fogBank(g, R, W, gy - 130, gy - 10, '#8c8e93', .42, 26);
    g.fillStyle = vgrad(g, gy, H, [[0, '#232327'], [.5, '#17171a'], [1, '#0a0a0c']]); g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 10) g.lineTo(x, gy + 14 * sin(x * .009 + 2) + 5 * sin(x * .05)); g.lineTo(W, H); g.fill();
    if (o.roots) { roots(g, cx, gy + 4, n, o.roots, (l, col) => { const e = taper(g, l.pts, '#55565c'); if (l.pts[0].w > 2) { g.strokeStyle = col; g.lineWidth = 1; path(g, e.L); } }); rootLabels(g, W, H, o.rootNames); }
    const tr = yearTree(weeks, cx, gy, { max: 3 }), B = ['#50525a', '#9ca0a8', '#eef0f2', '#26272c'], FAR_B = ['#4a4c52', '#7b7e85', '#a8abb0', '#35363b'];
    const lay = far => w => { const { W: wk } = w; byOrder(w).forEach(l => woodLimb(g, l, wk.empty ? ['#34353a', '#55565c', '#74757a', '#26272c'] : far ? FAR_B : B)); };
    const bare = tr.weeks;
    layers(tr, lay(true), () => { tr.boughs.forEach(l => woodLimb(g, l, B)); drawTrunk(g, tr, B); const Rk = rng(9); tr.trunk.forEach((p, i) => { if (i % 3 || p.w < 8) return; if (Rk() < .4) { g.strokeStyle = '#2a2b30'; g.lineWidth = 1 + Rk() * 1.6; const u = (Rk() - .5) * p.w * .7; g.beginPath(); g.moveTo(p.x + u, p.y); g.lineTo(p.x + u + (Rk() - .5) * 6, p.y - 12 - Rk() * 16); g.stroke(); } }); }, lay(false));
    bare.forEach(w => { const { W: wk, out, R: Rw, sc } = w; if (wk.empty || !out.tips.length) return; const berries = 1 + floor(min(wk.s, 16) * .22); out.tips.forEach((t, ti) => { if (ti % 2) return; const N = berries; for (let i = 0; i < N; i++) { const x = t.x + (Rw() - .5) * 15 * sc, y = t.y + (Rw() - .2) * 13 * sc, r = (1.7 + Rw() * 1.1) * sc; g.strokeStyle = '#3a3a40'; g.lineWidth = .7; g.beginPath(); g.moveTo(t.x, t.y); g.lineTo(x, y); g.stroke(); g.fillStyle = '#6e1420'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = '#b02c3a'; g.beginPath(); g.arc(x - r * .25, y - r * .3, r * .55, 0, TAU); g.fill(); } });
      for (let i = 0; i < min(wk.f, 3); i++) { const t = out.tips[floor(Rw() * out.tips.length)], x = t.x, y = t.y; glow(g, x, y, 11 * sc, '#ff3a3a77'); g.fillStyle = '#c21a2c'; g.beginPath(); g.arc(x, y, 3.4 * sc, 0, TAU); g.fill(); g.fillStyle = '#ff9a8a'; g.beginPath(); g.arc(x - 1.4 * sc, y - 1.6 * sc, 1.5 * sc, 0, TAU); g.fill(); }
      if (wk.back) { const t = out.tips[0]; glow(g, t.x, t.y, 13 * sc, '#e8ffe0aa'); g.fillStyle = '#e8ffe0'; g.beginPath(); g.ellipse(t.x, t.y, 2.8 * sc, 5 * sc, .3, 0, TAU); g.fill(); }
      if (wk.rare) { const t = out.tips[out.tips.length - 1]; glow(g, t.x, t.y, 34 * sc, '#ff3a3a'); g.fillStyle = '#ffd8c8'; g.beginPath(); for (let k = 0; k < 8; k++) { const q = k / 8 * TAU, r = (k % 2 ? 2 : 10) * sc; g.lineTo(t.x + cos(q) * r, t.y + sin(q) * r); } g.fill(); } });
    // The fog lies low in front of the tree, and sinks as the year fills up
    fogBank(g, rng(55), W, gy - 90 + lift * 62, gy + 26, '#a4a6aa', lerp(.72, .42, lift), 30);
    fogBank(g, rng(56), W, 200, 480, '#9a9ca1', lerp(.15, .06, lift), 12);
    if (o.roots) rootLabels(g, W, H, o.rootNames);
    return hitsOf(tr);
  }
  
  /* ---------- Brouillard F2: the hanging tree. It grows downward from a floating rock, above a sea of fog. ---------- */
  function hanging(g, W, H, weeks, o) {
    const cx = W / 2 + 6, hang = 214, R = rng(83), n = weeks.length, sea0 = 628, f = .4 + .6 * min(1, n / 30);
    g.fillStyle = vgrad(g, 0, H, [[0, '#1c1a1e'], [.3, '#34312f'], [.64, '#6a6764'], [.84, '#8f8d8a'], [1, '#55534f']]); g.fillRect(0, 0, W, H); dust(g, R, W, 220, 90, '#e8d8c8', .04);
    [[82, 88, 1.2], [870, 64, 1.7], [738, 34, 1.2], [196, 40, 1.2], [640, 92, 1], [310, 76, .9]].forEach(([x, y, s]) => { glow(g, x, y, 6 * s, '#c5303a'); g.fillStyle = '#ff6a6a'; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); });
    fogBank(g, R, W, 110, 430, '#74716e', .24, 14);
    [[90, 412, 15], [850, 278, 19], [790, 470, 9], [60, 250, 8]].forEach(([x, y, s]) => shardRock(g, x, y, s, R));
    // The rock, seen hanging; its underside faces the viewer
    const rx = 150 + 82 * f, top = 158, pts = []; const Rk = rng(9); for (let i = 0; i <= 26; i++) { const u = i / 26 * 2 - 1; pts.push([cx + u * rx, top + 52 * (1 - u * u) + (Rk() - .5) * 18 + 8]); }
    // Roots rise above the rock into the air
    if (o.roots) { roots(g, cx, top + 12, n, o.roots, (l, col) => { const flip = l.pts.map(p => ({ x: p.x, y: top + 12 - (p.y - top - 12) * .62, w: p.w })); const e = taper(g, flip, '#4a3a26'); if (flip[0].w > 2) { g.strokeStyle = col; g.lineWidth = 1.2; path(g, e.L); } }); g.font = MONO; g.textAlign = 'center'; o.rootNames.forEach((nm, i) => { g.fillStyle = ROOT_COL[i]; g.fillText(nm, W / 2 + (i - 1) * 180, 26); }); g.textAlign = 'left'; }
    g.fillStyle = vgrad(g, top, top + 88, [[0, '#4f5137'], [.12, '#3d3c34'], [1, '#17151a']]); g.beginPath(); g.moveTo(cx - rx, top); g.bezierCurveTo(cx - rx * .4, top - 12, cx + rx * .4, top - 14, cx + rx, top); pts.slice().reverse().forEach(p => g.lineTo(p[0], p[1])); g.fill();
    g.strokeStyle = '#17151a'; g.lineWidth = 1.3; for (let k = 0; k < 16; k++) { const x = cx + (Rk() - .5) * rx * 1.6, y = top + 8 + Rk() * 36; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Rk() - .5) * 18, y + 12 + Rk() * 24); g.stroke(); }
    for (let i = 0; i < 10; i++) { const u = i / 9 * 2 - 1, x = cx + u * rx * .9 + (Rk() - .5) * 12, y = top + 50 * (1 - u * u) + 6, l = 12 + Rk() * 32; g.fillStyle = '#17151a'; g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x + (Rk() - .5) * 5, y + l); g.lineTo(x + 8, y); g.fill(); }
    const dropsR = rng(19); g.strokeStyle = '#d6e4e6aa'; g.lineWidth = 1.5; for (let i = 0; i < 7; i++) { const x = cx - rx * .8 + dropsR() * rx * 1.6, y0 = 80 + dropsR() * 60, l = 8 + dropsR() * 26; g.beginPath(); g.moveTo(x, y0 + l); g.lineTo(x, y0); g.stroke(); }
    fogBank(g, rng(58), W, sea0 - 60, sea0 + 40, '#a6a4a0', .5, 26);
    const tr = yearTree(weeks, 0, 0, { max: 3 }), B = ['#2c1d10', '#6a4a22', '#b8934a', '#190f07'], LEAF = ['#402e16', '#7c5a24', '#b78a3a', '#e1c478'], DEEP = ['#2e2212', '#4c3819', '#6f5228', '#957038'];
    const k = min(1.02, (sea0 - hang + 26) / ((tr.top || 1) + 300 * sqrt(n / 40) + 40)), T = g.getTransform();
    const place = () => { g.setTransform(T); g.translate(cx, hang); g.scale(k, -k); };
    // A faint twin stands in the fog below, the way a reflection would
    g.save(); g.setTransform(T); g.translate(cx, sea0 + 26); g.scale(k * .9, k * .55); g.globalAlpha = .13; ln(g, tr.trunk, '#2c2a28', tr.w0 * .8); tr.boughs.forEach(l => ln(g, l.pts, '#2c2a28', 4)); tr.weeks.forEach(w => w.out.limbs.forEach(l => ln(g, l.pts, '#2c2a28', 2.4))); g.restore(); g.globalAlpha = 1;
    const pal = far => far ? DEEP : LEAF;
    const lay = far => w => { const { W: wk, out, R: Rw, sc } = w; const P = pal(far); byOrder(w).forEach(l => woodLimb(g, l, wk.empty ? ['#3c3a38', '#6b6864', '#8f8c86', '#292725'] : B)); if (wk.empty) return; out.tips.forEach(t => { const rad = (12 + min(wk.s, 16) * .85) * sc; for (let i = 0; i < 13; i++) { const a = Rw() * TAU, r = sqrt(Rw()) * rad, x = t.x + cos(a) * r, y = t.y + sin(a) * r * .85, lit = (y - t.y) / rad * .85 + (Rw() - .5) * .5; g.fillStyle = lit > .4 ? P[3] : lit > -.1 ? P[2] : lit > -.5 ? P[1] : P[0]; g.beginPath(); g.ellipse(x, y, (2.4 + Rw() * 2.6) * sc, (1.2 + Rw()) * sc, Rw() * TAU, 0, TAU); g.fill(); } }); };
    g.save(); place();
    layers(tr, lay(true), () => { tr.boughs.forEach(l => woodLimb(g, l, B)); drawTrunk(g, tr, B); }, lay(false));
    tr.weeks.forEach(w => { const { W: wk, out, R: Rw, sc } = w; if (wk.empty || !out.tips.length) return; for (let i = 0; i < min(wk.f, 3); i++) { const t = out.tips[floor(Rw() * out.tips.length)]; glow(g, t.x, t.y, 10 * sc, '#ff3a3a77'); g.fillStyle = '#c21a2c'; g.beginPath(); for (let q = 0; q < 8; q++) { const a = q / 8 * TAU, r = (q % 2 ? 1.3 : 5) * sc; g.lineTo(t.x + cos(a) * r, t.y + sin(a) * r); } g.fill(); } if (wk.back) { const t = out.tips[0]; glow(g, t.x, t.y, 13 * sc, '#e8ffe0aa'); g.fillStyle = '#e8ffe0'; g.beginPath(); g.ellipse(t.x, t.y, 2.8 * sc, 5 * sc, .3, 0, TAU); g.fill(); } if (wk.rare) { const t = out.tips[out.tips.length - 1]; glow(g, t.x, t.y, 34 * sc, '#ff3a3a'); g.fillStyle = '#ffd8c8'; g.beginPath(); for (let q = 0; q < 8; q++) { const a = q / 8 * TAU, r = (q % 2 ? 2.4 : 12) * sc; g.lineTo(t.x + cos(a) * r, t.y + sin(a) * r); } g.fill(); } });
    g.restore(); g.setTransform(T);
    fogBank(g, rng(59), W, sea0 - 14, H, '#b4b2ae', .6, 34);
    const out = []; tr.weeks.forEach(w => w.out.tips.forEach(t => out.push({ i: w.W.i, x: cx + t.x * k, y: hang - t.y * k })));
    return out;
  }

  /* ---------- Public ---------- */
  // The world trees were drawn with round line ends
  const roundEnds = f => (g, ...a) => { g.lineCap = 'round'; g.lineJoin = 'round'; return f(g, ...a); };
  const WORLD = { orrery, atlas, fan: gorgon, coral: coralJelly, crystal, pages: grimoire, wired, silver, hanging };
  const SCENE = { oak, plate, willow, pine, holo, pixel };
  for (const k in WORLD) SCENE[k] = roundEnds(WORLD[k]);
  // In the Room's grove, a world tree stands as the oak dressed in that world's colours
  const GROVE_LOOK = { orrery: ['lf_gold', 'br_verdigris'], atlas: ['lf_silver', 'br_ebony'], fan: ['lf_ember', 'br_ember'], coral: ['lf_jade', 'br_ebony'], crystal: ['lf_violet', 'br_ebony'], pages: ['lf_gold', 'br_ash'], wired: ['lf_violet', 'br_ebony'], silver: ['lf_silver', 'br_ash'], hanging: ['lf_gold', 'br_bark'] };
  const SIZE = k => (k === 'pixel' ? [200, 160] : [960, 760]);
  const safe = k => (SCENE[k] ? k : 'oak');
  // Whole scene, at the skin's own size. opts: roots ([sleep, water, moved] 0-1, or null), rootNames, title, leaf, bark, flower, hang, ground, sky
  function paint(g, skin, weeks, opts = {}) {
    const k = safe(skin), [W, H] = SIZE(k);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.imageSmoothingEnabled = k !== 'pixel';
    const hits = SCENE[k](g, W, H, weeks, opts); g.restore();
    return hits;
  }
  // The tree alone, standing at (cx, gy), scale sc: no roots, no scene, on any background
  function bare(g, skin, weeks, cx, gy, sc, opts = {}) {
    const k = safe(skin); if (!weeks.length) return;
    const o = Object.assign({}, opts, { roots: null, hang: null });
    if (k === 'pixel') {
      const off = document.createElement('canvas'); off.width = 200; off.height = 120; const c = off.getContext('2d');
      pTree(c, weeks, 100, 116, o);
      const z = max(1, round(sc * 4.4)); g.save(); g.imageSmoothingEnabled = false; g.drawImage(off, round(cx - 100 * z), round(gy - 116 * z), 200 * z, 120 * z); g.restore();
      return;
    }
    g.save(); g.translate(cx, gy); g.scale(sc, sc);
    if (GROVE_LOOK[k]) oakTree(g, weeks, 0, 0, Object.assign(o, { leaf: o.leaf || GROVE_LOOK[k][0], bark: o.bark || GROVE_LOOK[k][1] }));
    else if (k === 'oak') oakTree(g, weeks, 0, 0, o);
    else if (k === 'plate') plateTree(g, weeks, 0, 0, o);
    else if (k === 'willow') willowTree(g, weeks, 0, 0, o);
    else if (k === 'pine') pineTree(g, weeks, 0, -14, o);
    else if (k === 'holo') holoTree(g, weeks, 0, 0, o);
    g.restore();
  }
  // A shared sample year, for the shop's pictures
  const sample = n => Array.from({ length: n }, (_, i) => { const R = rng(i * 97 + 13), empty = i === 9, s = empty ? 0 : round(4 + R() * 7); return { i, s, f: empty ? 0 : floor(s * (.15 + R() * .35)), empty, back: i === 10, rare: i === 7, season: i < 13 ? 0 : i < 26 ? 1 : i < 38 ? 2 : 3 }; });
  // The Room's landscape
  function groveScene(g, W, H, gy) {
    const s = g.createLinearGradient(0, 0, 0, gy); SKY.sk_dusk.forEach(([c, k]) => s.addColorStop(k, c)); g.fillStyle = s; g.fillRect(0, 0, W, gy);
    const R = rng(5); for (let i = 0; i < W / 10; i++) { g.globalAlpha = .2 + R() * .6; g.fillStyle = '#f2ead8'; g.beginPath(); g.arc(R() * W, R() * gy * .55, .9, 0, TAU); g.fill(); } g.globalAlpha = 1;
    const my = 56, mx = W * .86, hl = g.createRadialGradient(mx, my, 8, mx, my, 110); hl.addColorStop(0, '#f4ecd255'); hl.addColorStop(1, '#f4ecd200'); g.fillStyle = hl; g.fillRect(mx - 110, 0, 220, 170); g.fillStyle = '#f4ecd2'; g.beginPath(); g.arc(mx, my, 20, 0, TAU); g.fill();
    [[gy - 70, '#2a2138', .008, 26], [gy - 34, '#201a2b', .015, 14]].forEach(([y, c, f, a], k) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, gy); for (let x = 0; x <= W; x += 10) g.lineTo(x, y + sin(x * f + k * 3) * a + sin(x * f * 2.7 + k) * a * .35); g.lineTo(W, gy); g.fill(); });
    const d = g.createLinearGradient(0, gy, 0, H); d.addColorStop(0, '#2b1e13'); d.addColorStop(1, '#120c07'); g.fillStyle = d; g.fillRect(0, gy, W, H - gy);
    grass(g, W, gy);
  }
  ML.TreeArt = { paint, bare, sample, groveScene, SIZE, SKINS: Object.keys(SCENE), LEAVES, BARKS, FLOWERS, ROOT_COL };
})();
