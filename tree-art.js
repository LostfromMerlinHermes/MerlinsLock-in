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

  /* ---------- Public ---------- */
  const SCENE = { oak, plate, willow, pine, holo, pixel };
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
    if (k === 'oak') oakTree(g, weeks, 0, 0, o);
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
