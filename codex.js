// Codex (Steady, light, Premium): the old Victorian city in the mist, drawn on game.js's #fx canvas (ML.codexDraw),
// and the evening Gazette. Two views of the same city, swapped with the small button in the timer card's head
// (S.codexView): « canal » (the default) looks down a canal between two rows of houses to a stone bridge, with plane
// trees, gas lamps and a moored barge; « quai » looks at the far quay from the other bank, a row of houses, a church
// tower, a small side bridge. Each view is painted once at rest and once in the fog; focus cross-fades to the fog one.
// It follows the timer: at rest a boat passes now and then, chimneys smoke, pigeons sit on a roof or on the bridge;
// in focus the fog closes in and the water goes still; at a session's end the pigeons fly off and the bell rings
// (quai) or the sun breaks through and lays light on the canal (canal). One light per session of the day: a window
// (quai, 12 at most) or a gas lamp (canal, 9 at most). Rain, snow or leaves follow the date.
(() => {
  'use strict';
  const { S, $, on, t, esc, today, dayKey, toast } = ML;
  const root = document.documentElement;
  const isOn = () => root.dataset.theme === 'observatory' && !!root.dataset.light;
  ML.codexOn = isOn;

  ML.addStrings({
    fr: {
      gz_title: 'La Gazette du Soir', gz_tag: 'Nouvelles de ta journée, imprimées à la tombée de la brume', gz_no: 'N° {n}', gz_price: 'Prix : 1 ◈',
      gz_ses1: 'Une session', gz_ses: '{n} sessions', gz_focus: '{t} de focus', gz_floor1: 'la tour gagne un étage', gz_floors: 'la tour gagne {n} étages',
      gz_task1: 'une tâche bouclée', gz_tasks: '{n} tâches bouclées', gz_quiet: 'Journée calme : la ville se repose',
      gz_done_h: 'Tâches accomplies.', gz_done_none: 'Aucune tâche bouclée aujourd’hui.', gz_weather_h: 'Météo.', gz_weather: 'Énergie {e}. {w}.',
      gz_w_rain: 'Pluie fine sur les quais', gz_w_snow: 'Neige sur les toits', gz_w_mist: 'Brume légère, éclaircies',
      gz_brief_h: 'En bref.', gz_brief: 'Série : {s} j. Quêtes : {q} sur 3.', gz_tomorrow: 'Demain : {n} à l’agenda', gz_tomorrow0: 'Demain : agenda libre',
      gz_share: 'Partager', gz_copied: 'Gazette copiée.', gz_open: 'Lire la Gazette du soir', cdx_view: 'Changer de vue',
    },
    en: {
      gz_title: 'The Evening Gazette', gz_tag: 'News of your day, printed as the mist comes down', gz_no: 'No. {n}', gz_price: 'Price: 1 ◈',
      gz_ses1: 'One session', gz_ses: '{n} sessions', gz_focus: '{t} of focus', gz_floor1: 'the tower gains a floor', gz_floors: 'the tower gains {n} floors',
      gz_task1: 'one task done', gz_tasks: '{n} tasks done', gz_quiet: 'A quiet day: the city rests',
      gz_done_h: 'Tasks done.', gz_done_none: 'No task finished today.', gz_weather_h: 'Weather.', gz_weather: 'Energy {e}. {w}.',
      gz_w_rain: 'Light rain on the quays', gz_w_snow: 'Snow on the roofs', gz_w_mist: 'Light mist, bright spells',
      gz_brief_h: 'In brief.', gz_brief: 'Streak: {s} d. Quests: {q} of 3.', gz_tomorrow: 'Tomorrow: {n} in the calendar', gz_tomorrow0: 'Tomorrow: calendar clear',
      gz_share: 'Share', gz_copied: 'Gazette copied.', gz_open: 'Read the Evening Gazette', cdx_view: 'Change view',
    },
  });

  const hash = str => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const TAU = Math.PI * 2;
const rng = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  /* ---------- The day: season, weather (the same all day, from the date), hour ---------- */
  function dayInfo() {
    const d = new Date(), m = d.getMonth(), h = d.getHours(), r = hash(today()) % 100;
    const season = m === 11 || m < 2 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn';
    const rain = r < { autumn: 35, spring: 25, winter: 15, summer: 10 }[season];
    return { season, rain, snow: season === 'winter' && !rain && r < 70, leaves: season === 'autumn' && !rain,
      band: h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'dusk' : 'night' };
  }
  const TINT = { dawn: '240,200,186', day: '214,200,170', dusk: '232,180,118', night: '160,162,170' };
  let day = dayInfo(), dayAt = 0;

  /* ---------- Sessions today (cached a few seconds: the draw loop asks every frame) ---------- */
  let sesN = 0, sesAt = 0;
  const sessionsToday = () => { if (performance.now() - sesAt > 4000) { const td = today(); sesN = S.sessions.filter(s => dayKey(new Date(s.at)) === td).length; sesAt = performance.now(); } return sesN; };


  /* ---------- The painters (from proposals/codex-fond): paintA = the quay, paintB = the canal ---------- */
const mx = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (a, al) => al == null ? `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})` : `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;
const dk = (a, t) => mx(a, [44, 38, 34], t), lt = (a, t) => mx(a, [255, 250, 236], t);
const PAPER = [239, 230, 211], FOG = [234, 228, 214], INK = [74, 58, 42], SLATE = [104, 106, 114], BRICK = [178, 134, 110], STOCK = [203, 180, 136],
  STUCCO = [228, 216, 192], STONE = [192, 182, 162], WATER = [188, 197, 187], GLASS = [98, 106, 112], GOLD = [168, 132, 47], AMBER = [248, 200, 104],
  IRON = [54, 52, 52], LEAFD = [98, 110, 86], LEAF = [134, 144, 106], LEAFL = [178, 178, 130], POT = [178, 122, 92], ACC = [107, 74, 18];
const MATS = [BRICK, STOCK, STUCCO, [168, 150, 132], [190, 150, 120], [214, 200, 170], BRICK, STOCK];
const DOORS = [[62, 84, 72], [110, 60, 56], [58, 70, 96], [60, 56, 52], [120, 98, 60]];

function poly(c, pts, fill) { c.beginPath(); for (let i = 0; i < pts.length; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]); c.closePath(); c.fillStyle = fill; c.fill(); }
function line(c, a, b, col, w) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = col; c.lineWidth = w; c.stroke(); }
function blob(c, x, y, rx, ry, col, a) { if (rx <= 0 || ry <= 0) return; c.save(); c.translate(x, y); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, css(col, a)); g.addColorStop(.55, css(col, a * .55)); g.addColorStop(1, css(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore(); }
function mistBand(c, R, y, W, h, a, n) { for (let i = 0; i < (n || 5); i++) blob(c, R() * W, y + (R() - .5) * h, W * (.22 + R() * .3), h * (.5 + R() * .6), FOG, a * (.6 + R() * .4)); }
function bird(c, x, y, s, col) { c.beginPath(); c.moveTo(x - s, y - s * .2); c.quadraticCurveTo(x - s * .4, y - s * .75, x, y); c.quadraticCurveTo(x + s * .45, y - s * .7, x + s, y - s * .32); c.strokeStyle = col; c.lineWidth = Math.max(.8, s * .2); c.lineCap = 'round'; c.stroke(); }
function crown(c, R, x, y, r, ft, sgn) {
  const n = Math.min(300, Math.max(26, r * r * .11)), cs = [[0, 0, 1], [-.55, .25, .7], [.5, .2, .75], [-.15, -.5, .7], [.32, -.35, .62]], tones = [LEAFD, LEAF, LEAFL];
  for (let p = 0; p < 3; p++) for (let i = 0; i < n / 3; i++) {
    const k = cs[(R() * cs.length) | 0], a = R() * TAU, d = Math.sqrt(R()) * k[2] * r * .78, px = x + k[0] * r + Math.cos(a) * d, py = y + (k[1] * r + Math.sin(a) * d * .82) * (sgn || 1);
    if (p === 2 && (px - x) - (py - y) * (sgn || 1) < -r * .15) continue;
    let col = tones[p]; if (R() < .06) col = [196, 162, 98];
    c.fillStyle = css(mx(col, FOG, ft)); c.beginPath(); c.ellipse(px, py, r * .14 * (.6 + R() * .8), r * .09 * (.6 + R() * .8), R() * 3, 0, TAU); c.fill();
  }
}
function lamp(c, x, yb, h, lit, glow, ft) {
  const col = css(mx(IRON, FOG, ft)), w = Math.max(.8, h * .035);
  if (lit) blob(c, x, yb - h * .93, glow, glow, AMBER, .5 * (1 - ft * .5));
  c.fillStyle = col; c.fillRect(x - w * 1.3, yb - h * .1, w * 2.6, h * .1); c.fillRect(x - w / 2, yb - h * .86, w, h * .86); c.fillRect(x - h * .07, yb - h * .8, h * .14, w * .8);
  poly(c, [[x - h * .035, yb - h * .86], [x + h * .035, yb - h * .86], [x + h * .06, yb - h * .98], [x - h * .06, yb - h * .98]], css(mx(lit ? [255, 232, 170] : [206, 204, 192], FOG, ft * .6)));
  poly(c, [[x - h * .075, yb - h * .98], [x + h * .075, yb - h * .98], [x, yb - h * 1.05]], col); c.fillRect(x - w * .4, yb - h * 1.08, w * .8, h * .04);
}
function dome(c, x, yb, s, col) {
  c.fillStyle = col; c.fillRect(x - 17 * s, yb - 30 * s, 34 * s, 70 * s); c.fillRect(x - 19 * s, yb - 32 * s, 38 * s, 2.5 * s);
  c.beginPath(); c.ellipse(x, yb - 32 * s, 15 * s, 21 * s, 0, Math.PI, TAU); c.fill(); c.fillRect(x - 3 * s, yb - 60 * s, 6 * s, 8 * s);
  c.beginPath(); c.ellipse(x, yb - 60 * s, 3.4 * s, 4 * s, 0, Math.PI, TAU); c.fill(); c.fillRect(x - .5 * s, yb - 70 * s, 1 * s, 7 * s);
  c.fillStyle = css(FOG, .3); for (let i = -5; i <= 5; i++) c.fillRect(x + i * 3 * s - .4 * s, yb - 28 * s, .8 * s, 14 * s);
}
function sky(c, W, H, yh, sx, sy, sr, st, R) {
  const g = c.createLinearGradient(0, 0, 0, yh); g.addColorStop(0, css([234, 226, 208])); g.addColorStop(1, css([247, 240, 223])); c.fillStyle = g; c.fillRect(0, 0, W, H);
  blob(c, sx, sy, sr * 20, sr * 20, [255, 248, 228], st === 'focus' ? .3 : st === 'end' ? .95 : .6);
  c.fillStyle = css([255, 252, 238], st === 'focus' ? .2 : st === 'end' ? 1 : .75); c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.fill();
  for (let i = 0; i < 5; i++) blob(c, R() * W, yh * (.1 + R() * .6), W * (.12 + R() * .16), yh * (.03 + R() * .04), [252, 247, 234], .5);
}
function fadeOut(c, W, H, from) { const g = c.createLinearGradient(0, H * from, 0, H); g.addColorStop(0, css(PAPER, 0)); g.addColorStop(1, css(PAPER, 1)); c.fillStyle = g; c.fillRect(0, H * from, W, H); }

/* ---------- A : the quay across the water (front view) ---------- */
function paintA(c, W, H, o) {
  const R = rng(11), st = o.st, foc = st === 'focus', end = st === 'end', u = o.u, y0 = o.y0, veil = foc ? .5 : 0, S = c.canvas.width / W;
  const T = (col, d, v) => mx(col, FOG, 1 - (1 - d) * (1 - (v == null ? veil : v)));
  const fr = (x, y, w, h, col) => { c.fillStyle = css(col); c.fillRect(x, y, w, h); };
  sky(c, W, H, y0, W * .2, y0 - 150 * u, 8 * u, st, R);
  const far = (yb, d, hmin, hmax, wmin, wmax, pots) => {
    let x = -10 * u; const col = css(T(SLATE, d)), dots = css(T(dk(SLATE, .3), d + .1));
    while (x < W + 10 * u) {
      const w = (wmin + R() * (wmax - wmin)) * u, h = (hmin + R() * (hmax - hmin)) * u, t = R(); c.fillStyle = col;
      c.fillRect(x, yb - h, w + 1, h + 44 * u);
      if (t < .45) { c.beginPath(); c.moveTo(x - u, yb - h); c.lineTo(x + w / 2, yb - h - w * .34); c.lineTo(x + w + u, yb - h); c.fill(); }
      else if (t < .72) { c.beginPath(); c.moveTo(x, yb - h); c.lineTo(x + w * .14, yb - h - 5 * u); c.lineTo(x + w * .86, yb - h - 5 * u); c.lineTo(x + w, yb - h); c.fill(); }
      if (R() < .75) { const q = x + R() * Math.max(1, w - 5 * u); c.fillRect(q, yb - h - 9 * u, 4 * u, 10 * u); if (pots) { c.fillRect(q + .3 * u, yb - h - 11 * u, 1.1 * u, 2 * u); c.fillRect(q + 2.4 * u, yb - h - 11.6 * u, 1.1 * u, 2.6 * u); } }
      if (pots) { c.fillStyle = dots; for (let i = 0; i < 3; i++) if (R() < .55) c.fillRect(x + (2 + R() * Math.max(1, w / u - 6)) * u, yb - h + (3 + R() * 8) * u, 1.6 * u, 2.6 * u); }
      x += w * (.8 + R() * .3);
    }
  };
  const dissolve = (yb, h, a) => { const g = c.createLinearGradient(0, yb - h, 0, yb); g.addColorStop(0, css(FOG, 0)); g.addColorStop(1, css(FOG, a)); c.fillStyle = g; c.fillRect(0, yb - h, W, h + 50 * u); };
  /* far city */
  const y1 = y0 - 46 * u, c1 = css(T(SLATE, .76));
  far(y1, .76, 12, 36, 12, 34, false);
  dome(c, W * .13, y1 - 16 * u, u * 1.05, c1);
  { const x = W * .43; poly(c, [[x - 4 * u, y1], [x - 4 * u, y1 - 46 * u], [x, y1 - 84 * u], [x + 4 * u, y1 - 46 * u], [x + 4 * u, y1]], c1); }
  { const x = W * .6, w = 44 * u, h = 38 * u, yb = y1 - 8 * u; c.strokeStyle = c1; c.lineWidth = .9 * u;
    for (let i = 0; i <= 6; i++) line(c, [x + w * i / 6, yb + 10 * u], [x + w * i / 6, yb - h], c1, .9 * u);
    for (let j = 1; j <= 3; j++) line(c, [x, yb - h * j / 3], [x + w, yb - h * j / 3], c1, .8 * u);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) line(c, [x + w * i / 6, yb - h * j / 3], [x + w * (i + 1) / 6, yb - h * (j + 1) / 3], c1, .45 * u);
    c.fillStyle = c1; c.fillRect(x + 2 * u, yb - h * .5, w - 4 * u, h); c.beginPath(); c.ellipse(x + w / 2, yb - h * .5, w / 2 - 2 * u, 3 * u, 0, Math.PI, TAU); c.fill(); }
  [[.9, 82], [.955, 66]].forEach((q, i) => { const x = W * q[0], h = q[1] * u; poly(c, [[x - 3.4 * u, y1], [x - 2.2 * u, y1 - h], [x + 2.2 * u, y1 - h], [x + 3.4 * u, y1]], c1); c.fillStyle = c1; c.fillRect(x - 2.8 * u, y1 - h, 5.6 * u, 2 * u);
    if (o.info) (o.info.fact = o.info.fact || []).push([x, y1 - h]); if (!foc && !o.live) for (let k = 0; k < 9; k++) blob(c, x + k * (5 + i) * u, y1 - h - (3 + k * 3.2) * u, (4 + k * 2.4) * u, (3 + k * 1.3) * u, [170, 166, 160], .3 * (1 - k / 10)); });
  dissolve(y1, 34 * u, .9);
  if (!foc) mistBand(c, R, y1 - 6 * u, W, 16 * u, .5, 4);
  const y2 = y0 - 28 * u; far(y2, .5, 12, 30, 12, 26, true);
  /* church and its tower: stays readable in focus */
  { const x = o.tx * W, w = 20 * u, yb = y2, top = yb - o.th * u, tv = veil * .4, col = T(mx(SLATE, [128, 110, 94], .55), .36, tv), cd = css(dk(col, .25)), cl = css(lt(col, .25));
    poly(c, [[x - 66 * u, yb], [x - 66 * u, yb - 26 * u], [x - 58 * u, yb - 44 * u], [x, yb - 44 * u], [x, yb]], css(T(SLATE, .44)));
    c.fillStyle = css(T(mx(SLATE, STONE, .5), .42)); c.fillRect(x - 62 * u, yb - 26 * u, 62 * u, 30 * u);
    for (let i = 0; i < 4; i++) { const wx = x - 54 * u + i * 13 * u; c.fillStyle = css(T(dk(SLATE, .3), .4)); c.beginPath(); c.moveTo(wx, yb - 6 * u); c.lineTo(wx, yb - 18 * u); c.quadraticCurveTo(wx + 2 * u, yb - 23 * u, wx + 4 * u, yb - 18 * u); c.lineTo(wx + 4 * u, yb - 6 * u); c.fill(); }
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, css(lt(col, .12))); g.addColorStop(1, css(dk(col, .1))); c.fillStyle = g; c.fillRect(x, top, w, yb - top + 30 * u);
    c.fillStyle = cl; c.fillRect(x - 1.2 * u, top + 30 * u, 2.4 * u, yb - top); c.fillRect(x + w - 1.2 * u, top + 30 * u, 2.4 * u, yb - top);
    c.fillRect(x - u, top, w + 2 * u, 1.6 * u); c.fillRect(x - u, top + 28 * u, w + 2 * u, 1.3 * u); c.fillRect(x - u, top + 48 * u, w + 2 * u, 1.3 * u);
    for (let i = 0; i < 3; i++) { const lx = x + 3.2 * u + i * 5.2 * u; c.fillStyle = cd; c.beginPath(); c.moveTo(lx, top + 25 * u); c.lineTo(lx, top + 10 * u); c.quadraticCurveTo(lx + 1.6 * u, top + 5 * u, lx + 3.2 * u, top + 10 * u); c.lineTo(lx + 3.2 * u, top + 25 * u); c.fill();
      c.fillStyle = css(col, .6); for (let k = 0; k < 4; k++) c.fillRect(lx, top + (12 + k * 3.4) * u, 3.2 * u, .7 * u); }
    const cy = top + 38.5 * u; if (o.info) o.info.tower = { x: x + w / 2, cy, r: 6 * u, top }; c.fillStyle = css(T([246, 240, 224], .1, tv)); c.beginPath(); c.arc(x + w / 2, cy, 6 * u, 0, TAU); c.fill(); c.strokeStyle = css(T(GOLD, .1, tv)); c.lineWidth = 1 * u; c.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line(c, [x + w / 2 + Math.cos(a) * 4.4 * u, cy + Math.sin(a) * 4.4 * u], [x + w / 2 + Math.cos(a) * 5.2 * u, cy + Math.sin(a) * 5.2 * u], css(T(INK, .2, tv)), .5 * u); }
    const ah = foc ? .55 * TAU : end ? 0 : .13 * TAU, am = foc ? .55 * TAU : end ? 0 : .7 * TAU;
    if (!o.live) { line(c, [x + w / 2, cy], [x + w / 2 + Math.sin(ah) * 2.8 * u, cy - Math.cos(ah) * 2.8 * u], css(INK), .9 * u); line(c, [x + w / 2, cy], [x + w / 2 + Math.sin(am) * 4.3 * u, cy - Math.cos(am) * 4.3 * u], css(INK), .6 * u); }
    const sp = top - 48 * u, sc = T(SLATE, .3, tv); poly(c, [[x - u, top], [x + w / 2, sp], [x + w / 2, top]], css(lt(sc, .16))); poly(c, [[x + w / 2, top], [x + w / 2, sp], [x + w + u, top]], css(sc));
    c.fillStyle = cd; c.fillRect(x + w / 2 - .4 * u, sp - 7 * u, .8 * u, 8 * u); c.fillRect(x + w / 2 - 2 * u, sp - 5 * u, 4 * u, .7 * u);
    [x - .5 * u, x + w - 2.5 * u].forEach(px => poly(c, [[px, top], [px + 1.5 * u, top - 11 * u], [px + 3 * u, top]], css(lt(col, .1))));
    if (end) { c.lineWidth = 1 * u; for (let k = 1; k <= 3; k++) { c.strokeStyle = css(GOLD, .7 - k * .17); c.beginPath(); c.arc(x + w / 2, top + 16 * u, (14 + k * 9) * u, -Math.PI * .8, -Math.PI * .2); c.stroke(); c.beginPath(); c.arc(x + w / 2, top + 16 * u, (14 + k * 9) * u, Math.PI * .08, Math.PI * .3); c.stroke(); c.beginPath(); c.arc(x + w / 2, top + 16 * u, (14 + k * 9) * u, Math.PI * .7, Math.PI * .92); c.stroke(); } }
  }
  dissolve(y2 + 4 * u, 22 * u, .7);
  mistBand(c, R, y2 - 2 * u, W, 14 * u, foc ? .75 : .45, 5);

  /* the row of houses */
  const yb = y0 - 9 * u, GH = 12.5 * u, FH = 10.5 * u, gx = o.gap * W, gw = 46 * u, wins = [], houses = [], D = .13;
  const sash = (x, y, w, h, hs, tall) => {
    fr(x - .8 * u, y - .8 * u, w + 1.6 * u, h + 1.6 * u, T(lt(STUCCO, .25), D));
    if (hs.arch) { c.fillStyle = css(T(dk(hs.mat, .18), D)); c.beginPath(); c.ellipse(x + w / 2, y - .8 * u, w / 2 + 1.2 * u, 1.9 * u, 0, Math.PI, TAU); c.fill(); } else fr(x - 1.3 * u, y - 2.2 * u, w + 2.6 * u, 1.4 * u, T(lt(STONE, .2), D));
    const g = c.createLinearGradient(0, y, 0, y + h), gl = R() < .3 ? mx(GLASS, [150, 160, 162], .6) : GLASS; g.addColorStop(0, css(T(lt(gl, .3), D))); g.addColorStop(1, css(T(gl, D))); c.fillStyle = g; c.fillRect(x, y, w, h);
    if (R() < .3) fr(x, y, w, h * (.25 + R() * .25), T([226, 216, 194], D));
    fr(x, y + h * .48, w, .7 * u, T(lt(STUCCO, .25), D)); if (hs.bars) fr(x + w / 2 - .25 * u, y, .5 * u, h, T(lt(STUCCO, .25), D));
    fr(x - 1.4 * u, y + h + .7 * u, w + 2.8 * u, 1 * u, T(lt(STONE, .3), D)); c.fillStyle = css(INK, .12); c.fillRect(x - 1.2 * u, y + h + 1.7 * u, w + 2.4 * u, .5 * u);
    if (!tall) wins.push({ x, y, w, h, hs });
  };
  const stack = (x, y, hs) => { const col = T(dk(hs.mat === STUCCO ? BRICK : hs.mat, .2), D); fr(x, y - 7 * u, 6.5 * u, 14 * u, col); fr(x - .5 * u, y - 7.6 * u, 7.5 * u, 1.3 * u, lt(col, .25)); const np = 2 + (R() * 3 | 0); for (let i = 0; i < np; i++) fr(x + .5 * u + i * 2 * u, y - 10.2 * u - (i % 2) * .7 * u, 1.3 * u, 2.8 * u + (i % 2) * .7 * u, T(POT, D)); hs.ch = [x + 3 * u, y - 10.5 * u]; };
  const house = hs => {
    const { x, w, fl, mat } = hs, top = yb - GH - fl * FH, wc = T(mat, D);
    const rt = top - 1.2 * u, slate = T(mx(SLATE, [120, 112, 108], R() * .6), D + .06);
    if (hs.roof !== 'gable') stack(R() < .5 ? x + .6 * u : x + w - 7.2 * u, rt - 8 * u, hs);
    if (hs.roof === 'pitch') { const g = c.createLinearGradient(0, rt - 8 * u, 0, rt); g.addColorStop(0, css(lt(slate, .22))); g.addColorStop(1, css(slate)); c.fillStyle = g; c.fillRect(x, rt - 8 * u, w, 8.5 * u);
      c.fillStyle = css(dk(slate, .2), .35); for (let k = 1; k < 4; k++) c.fillRect(x, rt - k * 2 * u, w, .35 * u); fr(x, rt - 8.4 * u, w, .9 * u, lt(slate, .35)); fr(x - .3 * u, rt - 9 * u, 1.3 * u, 9.4 * u, T(lt(STONE, .1), D)); hs.ridge = rt - 8.4 * u; }
    else if (hs.roof === 'mansard') { poly(c, [[x + .4 * u, rt], [x + 2.6 * u, rt - 9 * u], [x + w - 2.6 * u, rt - 9 * u], [x + w - .4 * u, rt]], css(slate)); fr(x + 2.6 * u, rt - 9.6 * u, w - 5.2 * u, .9 * u, lt(slate, .3));
      const nd = Math.max(1, Math.round(w / (17 * u))); for (let i = 0; i < nd; i++) { const dx = x + w * (i + .5) / nd - 2.8 * u; poly(c, [[dx - .8 * u, rt - 6.6 * u], [dx + 2.8 * u, rt - 9.2 * u], [dx + 6.4 * u, rt - 6.6 * u]], css(T(lt(STUCCO, .2), D))); fr(dx, rt - 6.6 * u, 5.6 * u, 6 * u, T(lt(STUCCO, .2), D)); fr(dx + .9 * u, rt - 5.7 * u, 3.8 * u, 4.4 * u, T(GLASS, D)); fr(dx + .9 * u, rt - 3.7 * u, 3.8 * u, .5 * u, T(lt(STUCCO, .2), D)); } }
    else if (hs.roof === 'parapet') { fr(x, rt - 3.6 * u, w, 4 * u, T(lt(mat, .12), D)); c.fillStyle = css(T(dk(mat, .25), D), .5); for (let bx = x + 1.5 * u; bx < x + w - 1.5 * u; bx += 1.6 * u) c.fillRect(bx, rt - 2.8 * u, .6 * u, 2.2 * u); fr(x - .5 * u, rt - 4.3 * u, w + u, 1 * u, T(lt(STONE, .35), D)); }
    const g = c.createLinearGradient(0, top, 0, yb); g.addColorStop(0, css(dk(wc, .05))); g.addColorStop(1, css(lt(wc, .12))); c.fillStyle = g; c.fillRect(x, top, w, yb - top);
    if (hs.roof === 'gable') { const gh = w * .4; stack(x + w - 6.8 * u, top - 4 * u, hs); poly(c, [[x, top + .5], [x + w / 2, top - gh], [x + w, top + .5]], css(dk(wc, .03)));
      c.strokeStyle = css(slate); c.lineWidth = 1.7 * u; c.lineJoin = 'miter'; c.beginPath(); c.moveTo(x - u, top + .6 * u); c.lineTo(x + w / 2, top - gh - .6 * u); c.lineTo(x + w + u, top + .6 * u); c.stroke();
      c.fillStyle = css(T(lt(STUCCO, .25), D)); c.beginPath(); c.arc(x + w / 2, top - gh * .42, 2.9 * u, 0, TAU); c.fill(); c.fillStyle = css(T(GLASS, D)); c.beginPath(); c.arc(x + w / 2, top - gh * .42, 2 * u, 0, TAU); c.fill(); fr(x + w / 2 - .3 * u, top - gh - 4.5 * u, .6 * u, 4 * u, T(IRON, D + .1)); }
    if (mat !== STUCCO) { c.fillStyle = css(dk(wc, .16), .45); for (let i = 0; i < fl * 16; i++) c.fillRect(x + R() * (w - 4 * u), top + 1.5 * u + R() * (yb - top - 3 * u), (1.6 + R() * 2.6) * u, .5 * u); }
    if (hs.stuccoG) { fr(x, yb - GH, w, GH, T(lt(STUCCO, .08), D)); c.fillStyle = css(INK, .08); for (let k = 1; k < 5; k++) c.fillRect(x, yb - GH + k * 2.5 * u, w, .35 * u); }
    if (hs.roof !== 'gable') { fr(x - .6 * u, top - 1.2 * u, w + 1.2 * u, 1.7 * u, T(lt(STONE, .35), D)); c.fillStyle = css(INK, .14); c.fillRect(x, top + .5 * u, w, .6 * u); }
    for (let k = 0; k < fl; k++) fr(x, yb - GH - k * FH - .4 * u, w, .55 * u, T(lt(wc, .3), D));
    const nb = Math.max(2, Math.round(w / (12.5 * u))), bw = w / nb;
    for (let k = 0; k < fl; k++) { const wh = (k === fl - 1 ? 6.2 : 7.4) * u, wy = yb - GH - (k + 1) * FH + 2.6 * u; for (let b = 0; b < nb; b++) sash(x + bw * (b + .5) - 2.3 * u, wy, 4.6 * u, wh, hs); }
    const db = hs.door % nb, dc = T(DOORS[hs.dc], D);
    if (hs.g === 'shop') {
      fr(x + 1 * u, yb - GH + 1.2 * u, w - 2 * u, 2.5 * u, dc); fr(x + 1 * u, yb - GH + 3.4 * u, w - 2 * u, .3 * u, T(GOLD, D)); fr(x + 1.4 * u, yb - GH + 3.9 * u, w - 2.8 * u, GH - 3.9 * u, dk(dc, .1));
      const g2 = c.createLinearGradient(0, yb - GH + 4 * u, 0, yb); g2.addColorStop(0, css(T(lt(GLASS, .4), D))); g2.addColorStop(1, css(T(dk(GLASS, .1), D))); c.fillStyle = g2; c.fillRect(x + 2.2 * u, yb - GH + 4.6 * u, w - 10 * u, GH - 6.8 * u);
      for (let mxx = x + 2.2 * u + 5 * u; mxx < x + w - 9 * u; mxx += 5 * u) fr(mxx, yb - GH + 4.6 * u, .45 * u, GH - 6.8 * u, dc);
      fr(x + w - 6.8 * u, yb - GH + 4.6 * u, 4.4 * u, GH - 4.6 * u, T(dk(GLASS, .2), D)); fr(x + w - 6.8 * u, yb - 3.6 * u, 4.4 * u, 3.6 * u, dk(dc, .05));
      if (hs.awn) { const ay = yb - GH + 3.8 * u, ac = T([214, 196, 156], D); poly(c, [[x + 1.4 * u, ay], [x + w - 7.6 * u, ay], [x + w - 7 * u, ay + 3.4 * u], [x + .8 * u, ay + 3.4 * u]], css(ac)); c.fillStyle = css(ac); for (let sx2 = x + .8 * u; sx2 < x + w - 7.6 * u; sx2 += 2 * u) { c.beginPath(); c.arc(sx2 + u, ay + 3.4 * u, u, 0, Math.PI); c.fill(); } c.fillStyle = css(INK, .12); c.fillRect(x + 1.4 * u, ay + 4.5 * u, w - 9 * u, .7 * u); }
    } else for (let b = 0; b < nb; b++) {
      const bx = x + bw * (b + .5);
      if (b === db) { fr(bx - 3.9 * u, yb - 11 * u, 7.8 * u, 11 * u, T(lt(STUCCO, .25), D)); fr(bx - 2.7 * u, yb - 8.4 * u, 5.4 * u, 8.4 * u, dc); c.fillStyle = css(dk(dc, .25), .6); c.fillRect(bx - 1.9 * u, yb - 7.4 * u, 1.6 * u, 3 * u); c.fillRect(bx + .3 * u, yb - 7.4 * u, 1.6 * u, 3 * u); c.fillRect(bx - 1.9 * u, yb - 3.6 * u, 3.8 * u, 2.4 * u);
        c.fillStyle = css(T(lt(GLASS, .3), D)); c.beginPath(); c.ellipse(bx, yb - 8.7 * u, 2.7 * u, 1.9 * u, 0, Math.PI, TAU); c.fill(); fr(bx + 1.6 * u, yb - 4.4 * u, .6 * u, .6 * u, T(GOLD, D)); fr(bx - 4.6 * u, yb - 1 * u, 9.2 * u, 1 * u, T(lt(STONE, .35), D)); }
      else if (hs.g === 'bay') { const by = yb - GH + 2.2 * u, bh = GH - 4.8 * u, wd = Math.min(bw * .8, 11 * u); poly(c, [[bx - wd / 2 - .6 * u, by], [bx - wd / 2 + 1.2 * u, by - 2.2 * u], [bx + wd / 2 - 1.2 * u, by - 2.2 * u], [bx + wd / 2 + .6 * u, by]], css(T(SLATE, D + .1)));
        fr(bx - wd / 2, by, wd, bh + 2.6 * u, T(lt(STUCCO, .22), D)); fr(bx - wd / 2 + .7 * u, by + .8 * u, wd * .2, bh - 1 * u, T(dk(GLASS, .12), D)); fr(bx - wd * .22, by + .8 * u, wd * .44, bh - 1 * u, T(lt(GLASS, .12), D)); fr(bx + wd / 2 - .7 * u - wd * .2, by + .8 * u, wd * .2, bh - 1 * u, T(dk(GLASS, .12), D)); fr(bx - wd / 2, by + bh * .45, wd, .6 * u, T(lt(STUCCO, .22), D)); }
      else sash(bx - 2.5 * u, yb - GH + 2.6 * u, 5 * u, 7.4 * u, hs, true);
    }
    if (R() < .6) fr(x + w - .7 * u, top, .6 * u, yb - top, dk(wc, .3));
    fr(x + w - .2 * u, top, .35 * u, yb - top, dk(wc, .18));
  };
  { let x = -6 * u, i = 0; const roofs = ['pitch', 'gable', 'mansard', 'pitch', 'parapet', 'pitch', 'mansard', 'gable'], gs = ['door', 'shop', 'bay', 'door', 'bay', 'shop', 'door'];
    while (x < W + 4 * u) { let w = (30 + R() * 22) * u; if (x < gx && x + w > gx - 8 * u) w = gx - x; if (x >= gx - .5 && x < gx + gw) { x = gx + gw; continue; }
      if (w > 14 * u) houses.push({ x, w, fl: 2 + (R() * 2.6 | 0), mat: MATS[(R() * MATS.length) | 0], roof: roofs[(i + (R() * 2 | 0)) % roofs.length], g: gs[(i * 3 + (R() * 2 | 0)) % gs.length], arch: R() < .35, bars: R() < .5, stuccoG: R() < .3, door: R() * 4 | 0, dc: R() * DOORS.length | 0, awn: R() < .5 });
      x += w; i++; } }
  /* the side street beyond the little bridge */
  { const g = c.createLinearGradient(0, yb - 60 * u, 0, yb); g.addColorStop(0, css(FOG, 0)); g.addColorStop(1, css(FOG, .8)); c.fillStyle = g; c.fillRect(gx, yb - 60 * u, gw, 60 * u);
    poly(c, [[gx, yb], [gx, yb - 38 * u], [gx + 9 * u, yb - 30 * u], [gx + 9 * u, yb]], css(T(mx(BRICK, SLATE, .4), .5))); poly(c, [[gx + gw, yb], [gx + gw, yb - 42 * u], [gx + gw - 8 * u, yb - 32 * u], [gx + gw - 8 * u, yb]], css(T(mx(STOCK, SLATE, .4), .42)));
    blob(c, gx + gw / 2, yb - 8 * u, 20 * u, 12 * u, FOG, .8); }
  houses.forEach(house);
  /* one lit window per session, never two side by side */
  { const pool = wins.filter(w => w.x > 4 * u && w.x < W - 8 * u), seen = new Set(), pick = []; const R2 = rng(5);
    for (let k = 0; k < 400 && pick.length < Math.min(12, o.n); k++) { const w = pool[(R2() * pool.length) | 0]; if (seen.has(w.hs) || pick.includes(w)) continue; seen.add(w.hs); if (seen.size >= houses.length - 1) seen.clear(); pick.push(w); }
    if (o.info) o.info.lastWin = pick[pick.length - 1]; pick.forEach(w => { const g = c.createLinearGradient(0, w.y, 0, w.y + w.h); g.addColorStop(0, css([255, 226, 150])); g.addColorStop(1, css([240, 180, 92])); c.fillStyle = g; c.fillRect(w.x, w.y, w.w, w.h); c.fillStyle = css([150, 104, 50], .55); c.fillRect(w.x, w.y + w.h * .48, w.w, .6 * u); blob(c, w.x + w.w / 2, w.y + w.h / 2, 9 * u, 9 * u, AMBER, foc ? .5 : .32); }); }
  /* life on the roofs */
  const smokers = houses.filter(h => h.ch && h.ch[0] > W * .08 && h.ch[0] < W * .95);
  if (o.info) o.info.stacks = smokers.map(h => h.ch); if (!foc && !o.live) [smokers[1], smokers[smokers.length - 2]].forEach((h, i) => { if (!h) return; for (let k = 0; k < 10; k++) blob(c, h.ch[0] + (k * 2.4 + Math.sin(k * .9 + i) * 2) * u, h.ch[1] - k * 5 * u, (2.6 + k * 1.3) * u, (2.2 + k * .9) * u, [150, 146, 142], .34 * (1 - k / 11)); });
  const perch = houses.find(h => h.ridge && h.x > W * .42 && h.x + h.w < W * .98) || houses.find(h => h.ridge);
  if (perch && o.info) o.info.perch = [perch.x + 6 * u, perch.ridge]; if (perch && !o.live) { if (end) for (let k = 0; k < 7; k++) bird(c, perch.x + (6 + k * 9 + R() * 8) * u, perch.ridge - (10 + k * 7 + R() * 10) * u, (2.2 + R() * 1.4) * u, css(T(dk(SLATE, .4), .2)));
    else for (let k = 0; k < 5; k++) { const px = perch.x + (6 + k * 3.4 + R() * 2) * u; c.fillStyle = css(T(dk(SLATE, .35), D)); c.beginPath(); c.ellipse(px, perch.ridge - 1 * u, 1.5 * u, 1 * u, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(px + (k % 2 ? 1.2 : -1.2) * u, perch.ridge - 1.9 * u, .65 * u, 0, TAU); c.fill(); } }
  if (!foc && !o.live) { bird(c, W * .33, y0 - 190 * u, 2.4 * u, css(T(SLATE, .5))); bird(c, W * .36, y0 - 183 * u, 1.9 * u, css(T(SLATE, .55))); }
  /* quay: pavement, wall, little bridge, stairs */
  const qs = T(STONE, .16); fr(0, yb, W, 1.2 * u, lt(qs, .3));
  { const g = c.createLinearGradient(0, yb + u, 0, y0); g.addColorStop(0, css(qs)); g.addColorStop(1, css(dk(qs, .14))); c.fillStyle = g; c.fillRect(0, yb + 1.2 * u, W, 7.8 * u);
    c.fillStyle = css(dk(qs, .3), .3); for (let k = 1; k < 3; k++) c.fillRect(0, yb + 1.2 * u + k * 2.6 * u, W, .35 * u);
    for (let k = 0; k < 3; k++) for (let x = (k % 2) * 3.5 * u + R() * 2 * u; x < W; x += (6 + R() * 3) * u) c.fillRect(x, yb + 1.2 * u + k * 2.6 * u, .35 * u, 2.6 * u);
    fr(0, y0 - 1.6 * u, W, 1.6 * u, T(mx(dk(STONE, .35), [90, 104, 84], .4), .2));
    for (let x = 14 * u; x < W; x += (38 + R() * 20) * u) { c.strokeStyle = css(T(IRON, .3)); c.lineWidth = .6 * u; c.beginPath(); c.arc(x, yb + 4 * u, 1.1 * u, 0, TAU); c.stroke(); for (let k = 0; k < 4; k++) blob(c, x + (R() * 14 - 7) * u, y0 - 2 * u - R() * 2 * u, 2 * u, 1.2 * u, [110, 124, 92], .35); } }
  { const ax = gx + 8 * u, aw = 30 * u; const g = c.createLinearGradient(0, y0 - 7 * u, 0, y0); g.addColorStop(0, css(mx(FOG, WATER, .2))); g.addColorStop(1, css(mx(WATER, FOG, .35))); c.fillStyle = g; c.beginPath(); c.ellipse(ax + aw / 2, y0, aw / 2, 6.6 * u, 0, Math.PI, TAU); c.fill();
    c.strokeStyle = css(lt(qs, .25)); c.lineWidth = 1.5 * u; c.beginPath(); c.ellipse(ax + aw / 2, y0, aw / 2 + .6 * u, 7.2 * u, 0, Math.PI, TAU); c.stroke();
    for (let k = 1; k < 10; k++) { const a = Math.PI + k / 10 * Math.PI; line(c, [ax + aw / 2 + Math.cos(a) * (aw / 2), y0 + Math.sin(a) * 6.6 * u], [ax + aw / 2 + Math.cos(a) * (aw / 2 + 1.3 * u), y0 + Math.sin(a) * 7.9 * u], css(dk(qs, .3), .5), .35 * u); }
    c.fillStyle = css(lt(qs, .08)); c.beginPath(); c.moveTo(gx - 2 * u, yb + .4 * u); c.lineTo(gx - 2 * u, yb - 4.4 * u); c.quadraticCurveTo(gx + gw / 2, yb - 7.4 * u, gx + gw + 2 * u, yb - 4.4 * u); c.lineTo(gx + gw + 2 * u, yb + .4 * u); c.fill();
    c.strokeStyle = css(lt(qs, .4)); c.lineWidth = 1 * u; c.beginPath(); c.moveTo(gx - 2.6 * u, yb - 4.6 * u); c.quadraticCurveTo(gx + gw / 2, yb - 7.7 * u, gx + gw + 2.6 * u, yb - 4.6 * u); c.stroke(); }
  /* railing */
  { c.fillStyle = css(T(IRON, .3)); const stx = o.stair == null ? -999 : o.stair * W; for (let x = 0; x < W; x += 4.2 * u) { if ((x > gx - 4 * u && x < gx + gw + 4 * u) || (x > stx - 2 * u && x < stx + 19 * u)) continue; c.fillRect(x, yb - 4.6 * u, .5 * u, 4.6 * u); c.fillRect(x, yb - 4.6 * u, 4.4 * u, .5 * u); c.fillRect(x, yb - 2.4 * u, 4.4 * u, .35 * u); }
    if (o.stair != null) { for (let k = 0; k < 6; k++) fr(stx + k * 2.8 * u, yb + 1.2 * u + k * 1.3 * u, 17 * u - k * 2.8 * u, 7.8 * u - k * 1.3 * u, k % 2 ? dk(qs, .2) : dk(qs, .28));
      const bx = stx + 20 * u; c.fillStyle = css(T([112, 90, 68], .14)); c.beginPath(); c.moveTo(bx, y0 - 2.6 * u); c.quadraticCurveTo(bx + 9 * u, y0 - 1.4 * u, bx + 19 * u, y0 - 3 * u); c.lineTo(bx + 17 * u, y0); c.lineTo(bx + 2 * u, y0); c.fill(); line(c, [bx + 3 * u, y0 - 2.6 * u], [bx + 15 * u, y0 - 3.2 * u], css(T(lt(STOCK, .2), .15)), .5 * u); line(c, [bx, y0 - 2.6 * u], [stx + 15 * u, yb + 6 * u], css(T(INK, .3)), .35 * u); } }
  o.lamps.forEach(q => lamp(c, q * W, yb, 24 * u, true, (foc ? 17 : 8) * u, .18 + veil * .3));
  lamp(c, gx + gw / 2, yb - 6 * u, 17 * u, true, (foc ? 13 : 6) * u, .22 + veil * .3);
  o.trees.forEach((q, i) => { const x = q * W, R3 = rng(40 + i), tc = T([124, 112, 96], .12); poly(c, [[x - 1.7 * u, yb], [x - .9 * u, yb - 22 * u], [x + .9 * u, yb - 22 * u], [x + 1.6 * u, yb]], css(tc));
    for (let k = 0; k < 6; k++) { c.fillStyle = css(lt(tc, .35), .7); c.beginPath(); c.ellipse(x + (R3() - .5) * 1.6 * u, yb - (2 + R3() * 18) * u, .7 * u, 1.5 * u, 0, 0, TAU); c.fill(); }
    [[-9, -30], [8, -31], [-2, -36]].forEach(b => line(c, [x, yb - 20 * u], [x + b[0] * u, yb + b[1] * u], css(tc), 1 * u));
    crown(c, R3, x, yb - 33 * u, 15.5 * u, .1 + veil * .45); });
  /* moored barge */
  { const x = o.barge * W, L = 92 * u, hc = T([54, 52, 52], .1), cab = T([78, 100, 88], .1);
    c.fillStyle = css(hc); c.beginPath(); c.moveTo(x, y0 - 4.2 * u); c.lineTo(x + L, y0 - 4.2 * u); c.quadraticCurveTo(x + L + 6 * u, y0 - 4.4 * u, x + L + 9 * u, y0 - 6.2 * u); c.quadraticCurveTo(x + L + 7 * u, y0 - 1.5 * u, x + L + 3 * u, y0); c.lineTo(x + 3 * u, y0); c.quadraticCurveTo(x - 1.5 * u, y0 - 1 * u, x, y0 - 4.2 * u); c.fill();
    fr(x + 1 * u, y0 - 3.3 * u, L + 4 * u, .5 * u, T([226, 214, 186], .12));
    fr(x + 16 * u, y0 - 10.4 * u, L - 30 * u, 6.2 * u, cab); fr(x + 15 * u, y0 - 11.2 * u, L - 28 * u, 1.1 * u, T([172, 168, 146], .12)); fr(x + 16 * u, y0 - 9.6 * u, L - 30 * u, .4 * u, T([226, 214, 186], .12));
    [23, 37, 46, 61].forEach(q => { fr(x + q * u - .4 * u, y0 - 8.7 * u, 4 * u, 3.2 * u, T([200, 176, 110], .12)); fr(x + q * u, y0 - 8.3 * u, 3.2 * u, 2.4 * u, T(dk(GLASS, .1), .12)); });
    fr(x + 17.4 * u, y0 - 9 * u, 3 * u, 4.8 * u, dk(cab, .25)); fr(x + L - 24 * u, y0 - 16 * u, 1.3 * u, 5 * u, hc); fr(x + L - 24.3 * u, y0 - 16.4 * u, 1.9 * u, .7 * u, T(GOLD, .15));
    c.strokeStyle = css(hc); c.lineWidth = .7 * u; c.beginPath(); c.moveTo(x + 2 * u, y0 - 4.2 * u); c.quadraticCurveTo(x + 4 * u, y0 - 9 * u, x + 10 * u, y0 - 8.4 * u); c.stroke();
    [70, 74.5, 79].forEach((q, i) => { fr(x + q * u, y0 - 12.6 * u, 2 * u, 1.5 * u, T(POT, .12)); blob(c, x + q * u + u, y0 - 13.8 * u, 2 * u, 1.6 * u, i === 1 ? [150, 150, 104] : LEAF, .9); });
    c.strokeStyle = css(T(INK, .35)); c.lineWidth = .35 * u; c.beginPath(); c.moveTo(x + 1 * u, y0 - 4 * u); c.quadraticCurveTo(x - 4 * u, y0 - 3 * u, x - 7 * u, yb + 4 * u); c.stroke(); c.beginPath(); c.moveTo(x + L + 8 * u, y0 - 5.6 * u); c.quadraticCurveTo(x + L + 12 * u, y0 - 4 * u, x + L + 15 * u, yb + 4 * u); c.stroke();
    if (o.info) o.info.stove = [x + L - 23.4 * u, y0 - 17.5 * u]; if (!foc && !o.live) for (let k = 0; k < 7; k++) blob(c, x + L - 23.4 * u + k * 1.8 * u, y0 - 17.5 * u - k * 3.4 * u, (1.6 + k * .9) * u, (1.4 + k * .7) * u, [150, 146, 142], .3 * (1 - k / 8)); }
  if (foc) { mistBand(c, R, yb - 44 * u, W, 34 * u, .7, 7); mistBand(c, R, yb - 14 * u, W, 16 * u, .45, 4); }
  /* water: real reflection of what is above, broken by ripples */
  { const hgt = Math.min(y0, 200 * u); const g = c.createLinearGradient(0, y0, 0, H); g.addColorStop(0, css(mx(WATER, dk(WATER, .2), .3))); g.addColorStop(.5, css(mx(WATER, FOG, .35))); g.addColorStop(1, css(PAPER)); c.fillStyle = g; c.fillRect(0, y0, W, H - y0);
    c.save(); c.beginPath(); c.rect(0, y0, W, H - y0); c.clip(); c.globalAlpha = foc ? .3 : .5; c.translate(0, y0); c.scale(1, -.66); c.drawImage(c.canvas, 0, (y0 - hgt) * S, W * S, hgt * S, 0, -hgt, W, hgt); c.restore();
    const g2 = c.createLinearGradient(0, y0, 0, y0 + 150 * u); g2.addColorStop(0, css(WATER, .05)); g2.addColorStop(1, css(mx(WATER, FOG, .5), .85)); c.fillStyle = g2; c.fillRect(0, y0, W, H - y0);
    c.fillStyle = css(dk(WATER, .4), .35); c.fillRect(0, y0, W, .8 * u);
    c.lineCap = 'round'; for (let i = 0, nn = foc ? 45 : 170; i < nn; i++) { const t = Math.pow(R(), 1.5), y = y0 + 1.5 * u + t * (H - y0) * .8, len = (5 + R() * 22) * u * (.5 + t), x = R() * W, li = R() < .6; c.strokeStyle = li ? css(lt(WATER, .55), (foc ? .3 : .55) * (1 - t * .5)) : css(dk(WATER, .35), .2 * (1 - t * .6)); c.lineWidth = (.5 + t * .6) * u; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + len / 2, y + (R() - .5) * 1.2 * u, x + len, y); c.stroke(); }
    if (st === 'rest' && !o.live) { const x = o.skiff * W, y = y0 + 40 * u, bc = css(T([96, 78, 60], .1)); blob(c, x + 11 * u, y + 2.4 * u, 14 * u, 2.4 * u, dk(WATER, .5), .35);
      c.fillStyle = bc; c.beginPath(); c.moveTo(x, y - 2.4 * u); c.quadraticCurveTo(x + 11 * u, y - .9 * u, x + 23 * u, y - 2.9 * u); c.quadraticCurveTo(x + 19 * u, y + 1 * u, x + 11 * u, y + 1 * u); c.quadraticCurveTo(x + 3 * u, y + 1 * u, x, y - 2.4 * u); c.fill();
      c.fillStyle = css(T(INK, .15)); c.beginPath(); c.ellipse(x + 10 * u, y - 4.4 * u, 1.5 * u, 2.8 * u, .15, 0, TAU); c.fill(); c.beginPath(); c.arc(x + 10.6 * u, y - 8 * u, 1.15 * u, 0, TAU); c.fill(); c.fillRect(x + 9 * u, y - 9.3 * u, 3.3 * u, .6 * u);
      line(c, [x + 11 * u, y - 4.6 * u], [x + 17 * u, y + 2.2 * u], bc, .5 * u); for (let k = 0; k < 4; k++) line(c, [x - (4 + k * 8) * u, y + (k % 2 ? 2.4 : .6) * u], [x - (9 + k * 8) * u, y + (k % 2 ? 2.4 : .6) * u], css(lt(WATER, .6), .6 - k * .12), .6 * u); }
    mistBand(c, R, y0 + 2 * u, W, 9 * u, foc ? .7 : .3, 5);
  }
  if (foc) { c.fillStyle = css(FOG, .1); c.fillRect(0, 0, W, H); }
  if (o.dial) fadeOut(c, W, H, o.fade);
  if (o.dial) dial(c, o.dial, st);
}

/* ---------- B : down the canal (perspective) ---------- */
function paintB(c0, W, H, o) {
  let c = c0; const R = rng(29), st = o.st, foc = st === 'focus', end = st === 'end', cx = o.cx == null ? W / 2 : o.cx, hy = o.hy, f = o.f, eY = 2.6, k = foc ? .05 : end ? .011 : .017, S = c0.canvas.width / W;
  const fog = z => Math.max(0, Math.min(1, 1 - Math.exp(-(z - 4) * k)));
  const P = (X, Y, z, m) => [cx + f * X / z, hy - f * ((m ? -Y : Y) - eY) / z];
  const F = (col, z) => css(mx(col, FOG, fog(z)));
  const q = (pts, fill) => poly(c, pts, fill);
  const sunX = cx + f * .11, sunY = hy - f * .2;
  sky(c, W, H, hy, sunX, sunY, f * .03, st, R);
  /* far city beyond the bridge */
  { const s = f / 300, col = css(mx(FOG, SLATE, foc ? .02 : end ? .22 : .14)), col2 = css(mx(FOG, SLATE, foc ? .03 : end ? .3 : .2));
    dome(c, cx - f * .16, hy + 2, s * .8, col); poly(c, [[cx + f * .26, hy + 2], [cx + f * .26, hy - 26 * s], [cx + f * .275, hy - 62 * s], [cx + f * .29, hy - 26 * s], [cx + f * .29, hy + 2]], col);
    c.fillStyle = col2; let x = cx - f * .5; while (x < cx + f * .5) { const w = (8 + R() * 14) * s, h = (6 + R() * 12) * s; c.fillRect(x, hy - h, w + 1, h + 3); if (R() < .5) { c.beginPath(); c.moveTo(x, hy - h); c.lineTo(x + w / 2, hy - h - w * .3); c.lineTo(x + w, hy - h); c.fill(); } if (R() < .6) c.fillRect(x + w * .3, hy - h - 4 * s, 2 * s, 5 * s); x += w; }
    blob(c, cx, hy - 4 * s, f * .6, 18 * s, FOG, foc ? .9 : .5); }
  /* items */
  const items = [], lamps = [];
  [-1, 1].forEach(s => { let z = 6.5 + R() * 2, i = 0; while (z < 135) { if (z >= 37 && z < 43) { z = 43; continue; } let d = 5.5 + R() * 6.5; if (z < 37 && z + d > 34) d = 37 - z;
    const ware = R() < .16; items.push({ t: 'b', s, z0: z, z1: z + d, h: ware ? 14 + R() * 2 : 9.6 + (R() * 3 | 0) * 2.2 + R() * .8, col: ware ? mx(BRICK, [150, 120, 104], R()) : MATS[(R() * MATS.length) | 0], roof: ware ? 'gab' : ['mans', 'para', 'mans', 'gab'][(R() * 4) | 0], g: ware ? 'ware' : R() < .4 ? 'shop' : 'door', ware, dc: R() * DOORS.length | 0, sd: 100 + i * 7 + (s > 0 ? 3 : 0), key: z + d }); z += d; i++; } });
  [[-1, 17], [-1, 29.5], [-1, 50], [-1, 66], [-1, 90], [1, 22.5], [1, 34.5], [1, 47], [1, 61], [1, 82]].forEach((t, i) => items.push({ t: 't', s: t[0], z: t[1], key: t[1], sd: 60 + i }));
  [[-1, 13], [1, 18], [-1, 25], [1, 30], [-1, 35], [0, 40], [-1, 52], [1, 58], [-1, 74]].forEach((l, i) => { const it = { t: 'l', s: l[0], z: l[1], key: l[1] - .2, lit: i < Math.min(9, o.n) }; lamps.push(it); if (l[0]) items.push(it); });
  items.push({ t: 'bridge', key: 40 }, { t: 'boat', key: 30.6 }, { t: 'boat2', key: 31.1 }); if (st === 'rest' && !o.live) items.push({ t: 'skiff', key: 33 });
  items.sort((a, b) => b.key - a.key);
  const zs = [2.4, 3, 3.8, 4.8, 6, 7.5, 9.5, 12, 15, 19, 24, 30, 38, 48, 62, 80, 105, 140, 200, 400];

  function bld(b, m) {
    const s = b.s, X = 10 * s, z0 = b.z0, z1 = b.z1, h = b.h, d = z1 - z0, Rb = rng(b.sd), base = s > 0 ? dk(b.col, .13) : lt(b.col, .05), nearpx = f / z0;
    const wq = (za, zb, ya, yb2) => [P(X, ya, za, m), P(X, yb2, za, m), P(X, yb2, zb, m), P(X, ya, zb, m)];
    const slate = mx(SLATE, [120, 112, 108], Rb() * .6);
    q([P(X, 1.2, z0, m), P(X, h, z0, m), P(X + s * 1.7, h + 2.3, z0, m), P(X + s * 6, h + 2.3, z0, m), P(X + s * 6, 1.2, z0, m)], F(dk(base, .16), z0));
    if (b.roof !== 'para') { const a = P(X, h, z0, m), e = P(X, h, z1, m), g = c.createLinearGradient(a[0], 0, e[0], 0); g.addColorStop(0, F(s > 0 ? slate : lt(slate, .2), z0)); g.addColorStop(1, F(lt(slate, .1), z1)); q([a, P(X + s * 1.7, h + 2.3, z0, m), P(X + s * 1.7, h + 2.3, z1, m), e], g); }
    { const za = z0 + .3, zb = Math.min(z1, z0 + 1.5), ct = dk(b.col === STUCCO ? BRICK : b.col, .22); q([P(s * 11.2, h + 1.4, za, m), P(s * 11.2, h + 4.6, za, m), P(s * 12.5, h + 4.6, za, m), P(s * 12.5, h + 1.4, za, m)], F(dk(ct, .12), za)); q([P(s * 11.2, h + 1.4, za, m), P(s * 11.2, h + 4.6, za, m), P(s * 11.2, h + 4.6, zb, m), P(s * 11.2, h + 1.4, zb, m)], F(s > 0 ? dk(ct, .1) : lt(ct, .1), za));
      if (!m) for (let i = 0; i < 3; i++) q([P(s * (11.3 + i * .4), h + 4.6, za, m), P(s * (11.3 + i * .4), h + 5.2 + (i % 2) * .15, za, m), P(s * (11.55 + i * .4), h + 5.2 + (i % 2) * .15, za, m), P(s * (11.55 + i * .4), h + 4.6, za, m)], F(POT, za)); }
    const a = P(X, 1.2, z0, m), e = P(X, 1.2, z1, m), g = c.createLinearGradient(a[0], 0, e[0], 0); g.addColorStop(0, F(base, z0)); g.addColorStop(1, F(base, z1));
    const ph = b.roof === 'para' ? h + .9 : h; q(wq(z0, z1, 1.2, ph), g);
    if (b.roof === 'gab') { const zm = (z0 + z1) / 2, gw2 = Math.min(d / 2 - .3, 3.2); q([P(X, h - .05, zm - gw2, m), P(X, h + 2.9, zm, m), P(X, h - .05, zm + gw2, m)], F(base, zm)); q(wq(zm - .4, zm + .4, h + .6, h + 1.5), F(dk(GLASS, .1), zm)); }
    const stG = !b.ware && Rb() < .35; if (stG) q(wq(z0, z1, 1.2, 4.75), F(s > 0 ? dk(STUCCO, .12) : lt(STUCCO, .1), (z0 + z1) / 2));
    if (!m && z0 < 34 && b.col !== STUCCO) { c.lineCap = 'butt'; for (let i = 0; i < 70; i++) { const zz = z0 + Rb() * (d - .6), yy = (stG ? 4.9 : 1.5) + Rb() * (h - (stG ? 5.2 : 1.8)), p1 = P(X, yy, zz), p2 = P(X, yy, zz + .3 + Rb() * .4); line(c, p1, p2, css(mx(dk(base, .2), FOG, fog(zz)), .45), Math.max(.5, f * .05 / zz)); } }
    /* cornice and floors */
    q(wq(z0, z1, ph - .42, ph), F(s > 0 ? dk(lt(STONE, .3), .1) : lt(STONE, .4), (z0 + z1) / 2)); if (!m) line(c, P(X, ph - .45, z0), P(X, ph - .45, z1), css(INK, .14 * (1 - fog(z0))), Math.max(.5, f * .1 / z0));
    const nF = Math.max(1, Math.floor((h - 4.9) / 2.95)), nb = Math.max(1, Math.round(d / 2.7)), bw = d / nb, sur = s > 0 ? dk(lt(STUCCO, .25), .1) : lt(STUCCO, .3), glass = s > 0 ? GLASS : mx(GLASS, [168, 176, 176], .55);
    for (let fl = 0; fl < nF; fl++) { const fy = 4.75 + fl * 2.95; if (!m && nearpx > 6) q(wq(z0, z1, fy - .08, fy + .08), F(lt(base, .25), (z0 + z1) / 2));
      for (let i = 0; i < nb; i++) { const zc = z0 + bw * (i + .5), ww = b.ware ? .8 : .58, ya = fy + .85, yb2 = fy + (fl === nF - 1 ? 2.2 : 2.45), big = f / zc > 9 && !m;
        if (b.ware && i === (nb >> 1)) { q(wq(zc - .75, zc + .75, fy + .1, fy + 2.3), F(dk([120, 96, 70], .15), zc)); if (big) line(c, P(X, fy + .1, zc), P(X, fy + 2.3, zc), F(dk([120, 96, 70], .45), zc), Math.max(.5, f * .04 / zc)); continue; }
        if (big) { q(wq(zc - ww - .14, zc + ww + .14, ya - .14, yb2 + .14), F(sur, zc)); q(wq(zc - ww - .22, zc + ww + .22, yb2 + .14, yb2 + .4), F(b.col === STUCCO ? sur : dk(base, .14), zc)); }
        const gl = Rb() < .28 ? mx(glass, [226, 216, 194], .75) : Rb() < .3 ? dk(glass, .2) : glass; q(wq(zc - ww, zc + ww, ya, yb2), F(gl, zc));
        if (big) { line(c, P(X, (ya + yb2) / 2, zc - ww), P(X, (ya + yb2) / 2, zc + ww), F(sur, zc), Math.max(.6, f * .07 / zc)); line(c, P(X, ya, zc), P(X, yb2, zc), F(sur, zc), Math.max(.5, f * .04 / zc)); q(wq(zc - ww - .24, zc + ww + .24, ya - .32, ya - .14), F(lt(STONE, .4), zc)); } } }
    if (b.ware && !m) { const zc = z0 + bw * ((nb >> 1) + .5); line(c, P(X, h - .9, zc), P(X - s * 1.5, h - .9, zc), F(dk([120, 96, 70], .4), zc), Math.max(.8, f * .16 / zc)); line(c, P(X - s * 1.3, h - .9, zc), P(X - s * 1.3, h - 2.2, zc), F(INK, zc), Math.max(.4, f * .03 / zc)); }
    /* ground floor */
    const dc = s > 0 ? dk(DOORS[b.dc], .1) : DOORS[b.dc];
    if (b.g === 'shop') { q(wq(z0 + .25, z1 - .25, 4.0, 4.55), F(dc, (z0 + z1) / 2)); q(wq(z0 + .25, z1 - .25, 1.2, 4.0), F(dk(dc, .12), (z0 + z1) / 2));
      for (let i = 0; i < nb; i++) { const zc = z0 + bw * (i + .5), hw = bw / 2 - .28; if (i === b.dc % nb) q(wq(zc - .5, zc + .5, 1.2, 3.75), F(dk(glass, .3), zc)); else q(wq(zc - hw, zc + hw, 1.95, 3.8), F(lt(glass, .12), zc)); }
      if (!m && nearpx > 8) line(c, P(X, 3.98, z0 + .25), P(X, 3.98, z1 - .25), F(GOLD, (z0 + z1) / 2), Math.max(.5, f * .03 / z0)); }
    else for (let i = 0; i < nb; i++) { const zc = z0 + bw * (i + .5);
      if (b.g === 'ware') { q(wq(zc - .95, zc + .95, 1.2, 3.9), F(dk([120, 96, 70], i % 2 ? .1 : .3), zc)); continue; }
      if (i === b.dc % nb) { q(wq(zc - .72, zc + .72, 1.2, 4.2), F(sur, zc)); q(wq(zc - .5, zc + .5, 1.2, 3.45), F(dc, zc)); q(wq(zc - .5, zc + .5, 3.55, 4.0), F(lt(glass, .2), zc)); if (!m) q([P(X, 1.2, zc - .8), P(X, 1.38, zc - .8), P(X, 1.38, zc + .8), P(X - s * .5, 1.2, zc + .8), P(X - s * .5, 1.2, zc - .8)], F(lt(STONE, .35), zc)); }
      else { if (f / zc > 9 && !m) q(wq(zc - .76, zc + .76, 2.05, 4.2), F(sur, zc)); q(wq(zc - .62, zc + .62, 2.2, 4.05), F(Rb() < .3 ? mx(glass, [226, 216, 194], .7) : glass, zc)); if (f / zc > 9 && !m) line(c, P(X, 3.1, zc - .62), P(X, 3.1, zc + .62), F(sur, zc), Math.max(.6, f * .07 / zc)); } }
    if (!m) line(c, P(X, 1.2, z1), P(X, ph, z1), css(mx(dk(base, .35), FOG, fog(z1)), .7), Math.max(.5, f * .09 / z1));
  }
  function quay(m) {
    [-1, 1].forEach(s => { for (let i = 0; i < zs.length - 1; i++) { const za = zs[i], zb = zs[i + 1] * 1.01, zm = (za + zb) / 2, wall = s > 0 ? dk(STONE, .2) : dk(STONE, .04);
      if (!m) q([P(s * 5, 1.2, za), P(s * 10, 1.2, za), P(s * 10, 1.2, zb), P(s * 5, 1.2, zb)], F(lt(STONE, .22), zm));
      q([P(s * 5, 0, za, m), P(s * 5, 1.2, za, m), P(s * 5, 1.2, zb, m), P(s * 5, 0, zb, m)], F(wall, zm));
      q([P(s * 5, 0, za, m), P(s * 5, .2, za, m), P(s * 5, .2, zb, m), P(s * 5, 0, zb, m)], F(mx(dk(STONE, .4), [92, 106, 86], .45), zm));
      if (!m) { line(c, P(s * 5, 1.2, za), P(s * 5, 1.2, zb), F(lt(STONE, .5), zm), Math.max(.7, f * .14 / zm)); line(c, P(s * 5, .72, za), P(s * 5, .72, zb), css(mx(dk(wall, .3), FOG, fog(zm)), .4), Math.max(.4, f * .03 / zm)); line(c, P(s * 9.1, 1.2, za), P(s * 9.1, 1.2, zb), css(mx(dk(STONE, .3), FOG, fog(zm)), .35), Math.max(.4, f * .04 / zm)); } }
      if (!m) { for (let z = 3; z < 46; z += 1.3) { const o2 = (Math.round(z / 1.3) % 2) * .5; line(c, P(s * 5, .2 + o2, z), P(s * 5, .72 + o2 * .96, z), css(mx(dk(STONE, .4), FOG, fog(z)), .3), Math.max(.4, f * .03 / z)); }
        for (let z = 3; z < 60; z += 2.2) line(c, P(s * 5.2, 1.2, z), P(s * 9.1, 1.2, z), css(mx(dk(STONE, .3), FOG, fog(z)), .22), Math.max(.4, f * .03 / z));
        for (let z = 9; z < 37; z += 5.5) { const p = P(s * 5.35, 1.2, z), hh = f * .42 / z; c.fillStyle = F(IRON, z); c.fillRect(p[0] - hh * .2, p[1] - hh, hh * .4, hh); c.fillRect(p[0] - hh * .32, p[1] - hh, hh * .64, hh * .25); } } });
  }
  function bridge(m) {
    const z = 40, zb = 45, top = X => 5.0 - 1.15 * (X / 10.5) * (X / 10.5), arch = X => .35 + 2.95 * Math.sqrt(Math.max(0, 1 - (X / 4.5) * (X / 4.5))), col = dk(STONE, .08);
    const soff = []; for (let i = 0; i <= 24; i++) { const X = 4.5 - 9 * i / 24; soff.push(P(X, arch(X), z, m)); } soff.unshift(P(4.5, 0, z, m)); soff.push(P(-4.5, 0, z, m)); soff.push(P(-4.5, 0, zb, m)); for (let i = 0; i <= 24; i++) { const X = -4.5 + 9 * i / 24; soff.push(P(X, arch(X), zb, m)); } soff.push(P(4.5, 0, zb, m));
    q(soff, F(dk(STONE, .42), z + 2));
    const pts = [P(-10.6, 1.2, z, m)]; for (let i = 0; i <= 20; i++) { const X = -10.6 + 21.2 * i / 20; pts.push(P(X, top(X), z, m)); } pts.push(P(10.6, 1.2, z, m), P(5, 1.2, z, m), P(5, 0, z, m), P(4.5, 0, z, m)); for (let i = 0; i <= 24; i++) { const X = 4.5 - 9 * i / 24; pts.push(P(X, arch(X), z, m)); } pts.push(P(-4.5, 0, z, m), P(-5, 0, z, m), P(-5, 1.2, z, m));
    const a = P(-10.6, 0, z), e = P(10.6, 0, z), g = c.createLinearGradient(a[0], 0, e[0], 0); g.addColorStop(0, F(lt(col, .1), z)); g.addColorStop(1, F(dk(col, .08), z)); q(pts, g);
    if (m) return;
    const lw = f / z; c.lineJoin = 'round'; c.strokeStyle = F(lt(STONE, .45), z); c.lineWidth = Math.max(1, lw * .2); c.beginPath(); for (let i = 0; i <= 20; i++) { const X = -10.6 + 21.2 * i / 20, p = P(X, top(X), z); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
    c.strokeStyle = css(mx(dk(STONE, .4), FOG, fog(z)), .5); c.lineWidth = Math.max(.5, lw * .06); c.beginPath(); for (let i = 0; i <= 20; i++) { const X = -10.6 + 21.2 * i / 20, p = P(X, top(X) - 1.05, z); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
    c.strokeStyle = F(lt(STONE, .3), z); c.lineWidth = Math.max(1, lw * .34); c.beginPath(); for (let i = 0; i <= 24; i++) { const X = 4.62 - 9.24 * i / 24, p = P(X, arch(X * .974) + .17, z); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
    for (let i = 1; i < 14; i++) { const t = Math.PI * i / 14, X = Math.cos(t) * 4.5, Y = .35 + Math.sin(t) * 2.95; line(c, P(X, Y, z), P(X * 1.07, Y + Math.sin(t) * .34, z), css(mx(dk(STONE, .5), FOG, fog(z)), .45), Math.max(.4, lw * .035)); }
    for (let i = 0; i < 16; i++) { const X = -10 + R() * 20, Y = Math.abs(X) < 5.2 ? arch(X) + .6 + R() * (top(X) - arch(X) - 1.9) : 1.4 + R() * (top(X) - 2.6); line(c, P(X, Y, z), P(X + .5 + R() * .5, Y, z), css(mx(dk(STONE, .4), FOG, fog(z)), .3), Math.max(.4, lw * .04)); }
    const lp = P(0, top(0), z); lamp(c, lp[0], lp[1], lw * 2.5, lamps[5].lit, lw * (foc ? 2.6 : 1.5), fog(z) * .7);
    if (!end && !o.live) [-3.1, -2.5, 2.2, 3.4, 3.9].forEach((X, i) => { const p = P(X, top(X), z); c.fillStyle = F(dk(SLATE, .35), z); c.beginPath(); c.ellipse(p[0], p[1] - lw * .13, lw * .2, lw * .13, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(p[0] + (i % 2 ? 1 : -1) * lw * .16, p[1] - lw * .27, lw * .09, 0, TAU); c.fill(); });
  }
  function tree(t, m) {
    const X = t.s * 7.3, z = t.z, hpx = f / z, Rt = rng(t.sd), b = P(X, 1.2, z, m), tp = P(X, 5.2, z, m), cc = P(X, 7.7, z, m), tc = mx([122, 110, 94], FOG, fog(z));
    if (!m) { c.fillStyle = css(mx(dk(STONE, .35), FOG, fog(z)), .5); c.beginPath(); c.ellipse(b[0], b[1], hpx * .7, hpx * .14, 0, 0, TAU); c.fill(); }
    poly(c, [[b[0] - hpx * .2, b[1]], [tp[0] - hpx * .1, tp[1]], [tp[0] + hpx * .1, tp[1]], [b[0] + hpx * .2, b[1]]], css(tc));
    if (!m && hpx > 7) for (let i = 0; i < 6; i++) { c.fillStyle = css(lt(tc, .35), .7); c.beginPath(); c.ellipse(b[0] + (Rt() - .5) * hpx * .2, b[1] + (tp[1] - b[1]) * (.1 + Rt() * .8), hpx * .07, hpx * .18, 0, 0, TAU); c.fill(); }
    [[-1.5, 1.2], [1.4, 1.5], [-.2, 2.2]].forEach(br => line(c, tp, [tp[0] + br[0] * hpx, tp[1] + (m ? 1 : -1) * br[1] * hpx], css(tc), Math.max(.6, hpx * .1)));
    crown(c, Rt, cc[0], cc[1], hpx * 2.9, fog(z), m ? -1 : 1);
  }
  function boat(m) {
    const z0 = 19, z1 = 30.5, a = 21.6, b2 = 28.4, hull = [60, 57, 54], cab = [84, 106, 92];
    q([P(-4.9, 0, z0, m), P(-4.9, .55, z0, m), P(-2.9, .55, z0, m), P(-2.9, 0, z0, m)], F(dk(hull, .2), z0));
    q([P(-2.9, 0, z0, m), P(-2.9, .55, z0, m), P(-3.5, .72, z1, m), P(-3.5, 0, z1, m)], F(hull, 24));
    q([P(-4.9, .55, z0, m), P(-2.9, .55, z0, m), P(-3.5, .72, z1, m), P(-4.3, .72, z1, m)], F([112, 104, 92], 24));
    q([P(-4.6, .55, a, m), P(-4.6, 1.5, a, m), P(-3.2, 1.5, a, m), P(-3.2, .55, a, m)], F(dk(cab, .22), a));
    q([P(-3.2, .55, a, m), P(-3.2, 1.5, a, m), P(-3.2, 1.5, b2, m), P(-3.2, .55, b2, m)], F(cab, 25));
    q([P(-4.6, 1.5, a, m), P(-3.2, 1.5, a, m), P(-3.2, 1.5, b2, m), P(-4.6, 1.5, b2, m)], F([176, 172, 150], 25));
    if (m) return;
    line(c, P(-2.9, .43, z0), P(-3.5, .6, z1), F([226, 214, 186], 24), Math.max(.5, f * .05 / 24)); line(c, P(-3.2, 1.4, a), P(-3.2, 1.4, b2), F([226, 214, 186], 25), Math.max(.5, f * .04 / 25));
    [22.6, 24.4, 26.9].forEach(zc => { q([P(-3.2, .88, zc), P(-3.2, 1.26, zc), P(-3.2, 1.26, zc + .75), P(-3.2, .88, zc + .75)], F([200, 176, 110], zc)); q([P(-3.2, .93, zc + .06), P(-3.2, 1.21, zc + .06), P(-3.2, 1.21, zc + .69), P(-3.2, .93, zc + .69)], F(dk(GLASS, .15), zc)); });
    q([P(-4.1, .55, a), P(-4.1, 1.32, a), P(-3.6, 1.32, a), P(-3.6, .55, a)], F(dk(cab, .45), a));
    const p1 = P(-3.9, 1.5, 26.8), p2 = P(-3.9, 2.25, 26.8); line(c, p1, p2, F(dk(hull, .2), 26.8), Math.max(1, f * .13 / 26.8));
    [[-4.3, 23.4], [-4.25, 24.3]].forEach((pp, i) => { const p = P(pp[0], 1.5, pp[1]), s2 = f / pp[1]; c.fillStyle = F(POT, pp[1]); c.fillRect(p[0] - s2 * .13, p[1] - s2 * .2, s2 * .26, s2 * .2); blob(c, p[0], p[1] - s2 * .32, s2 * .3, s2 * .24, i ? [150, 150, 104] : LEAF, .9 * (1 - fog(pp[1]))); });
    line(c, P(-4.8, .55, z0 + .3), P(-5.35, 1.3, z0 - .9), css(mx(INK, FOG, fog(z0)), .7), Math.max(.4, f * .025 / z0)); line(c, P(-3.9, .55, z0 + .1), P(-3.7, 1.15, z0 + .9), F(dk(hull, .2), z0), Math.max(.6, f * .05 / z0));
    if (o.info) o.info.stove = p2; if (!foc && !o.live) for (let i = 0; i < 8; i++) blob(c, p2[0] + i * f * .012, p2[1] - i * f * .017, f * (.006 + i * .0042), f * (.005 + i * .003), [150, 146, 142], .32 * (1 - i / 9));
  }
  function boat2(m) {
    const z0 = 24.5, z1 = 31, hull = [104, 84, 64];
    q([P(3.1, 0, z0, m), P(3.1, .45, z0, m), P(4.9, .45, z0, m), P(4.9, 0, z0, m)], F(dk(hull, .3), z0));
    q([P(3.1, 0, z0, m), P(3.1, .45, z0, m), P(3.6, .55, z1, m), P(3.6, 0, z1, m)], F(dk(hull, .12), 27));
    q([P(3.1, .45, z0, m), P(4.9, .45, z0, m), P(4.4, .55, z1, m), P(3.6, .55, z1, m)], F([150, 132, 106], 27));
    if (m) return;
    q([P(3.35, .45, 25.6), P(3.5, .95, 26.4), P(3.5, .95, 29), P(3.45, .5, 29.9)], F([166, 150, 122], 27)); q([P(3.5, .95, 26.4), P(4.6, .5, 26), P(4.5, .5, 29.6), P(3.5, .95, 29)], F([188, 174, 146], 27));
    line(c, P(4.8, .45, z0 + .3), P(5.35, 1.3, z0 - .8), css(mx(INK, FOG, fog(z0)), .7), Math.max(.4, f * .025 / z0));
  }
  function skiff(m) {
    const z = 33, p = P(1.3, 0, z, m), s2 = f / z, col = F([92, 76, 60], z); if (m) { blob(c, p[0], p[1] + s2 * .2, s2 * .8, s2 * .22, dk(WATER, .5), .7); return; }
    line(c, P(.75, 0, z - .4), P(-.3, 0, 26), css(lt(WATER, .6), .5), Math.max(.5, s2 * .06)); line(c, P(1.85, 0, z - .4), P(2.9, 0, 26), css(lt(WATER, .6), .5), Math.max(.5, s2 * .06));
    c.fillStyle = col; c.beginPath(); c.ellipse(p[0], p[1] - s2 * .16, s2 * .68, s2 * .22, 0, 0, TAU); c.fill(); c.fillStyle = F(INK, z); c.beginPath(); c.ellipse(p[0], p[1] - s2 * .62, s2 * .2, s2 * .36, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(p[0], p[1] - s2 * 1.08, s2 * .14, 0, TAU); c.fill();
    line(c, [p[0] - s2 * .2, p[1] - s2 * .5], [p[0] - s2 * 1.25, p[1] + s2 * .05], col, Math.max(.5, s2 * .05)); line(c, [p[0] + s2 * .2, p[1] - s2 * .5], [p[0] + s2 * 1.25, p[1] + s2 * .05], col, Math.max(.5, s2 * .05));
  }
  function scene(m) { quay(m); items.forEach(it => { if (it.t === 'b') bld(it, m); else if (it.t === 't') tree(it, m); else if (it.t === 'bridge') bridge(m); else if (it.t === 'boat') boat(m); else if (it.t === 'boat2') boat2(m); else if (it.t === 'skiff') skiff(m);
    else if (it.t === 'l' && !m) { const p = P(it.s * 5.75, 1.2, it.z), hh = f * 3.5 / it.z; lamp(c, p[0], p[1], hh, it.lit, hh * (foc ? 1.1 : .8), fog(it.z) * .5); } }); }

  /* water, sky colour first, then the mirrored city */
  c.fillStyle = css(FOG); c.fillRect(0, hy, W, H - hy);
  for (let i = 0; i < zs.length - 1; i++) { const za = zs[i], zb = zs[i + 1] * 1.02, zm = (za + zb) / 2; q([P(-5.05, 0, za), P(5.05, 0, za), P(5.05, 0, zb), P(-5.05, 0, zb)], F(mx(dk(WATER, .1), [226, 224, 208], Math.min(1, zm / 60)), zm)); }
  { const off = document.createElement('canvas'); off.width = c0.canvas.width; off.height = c0.canvas.height; const oc = off.getContext('2d'); oc.setTransform(S, 0, 0, S, 0, 0); c = oc; scene(true); c = c0;
    c.save(); c.beginPath(); [P(-5, 0, 2.4), P(5, 0, 2.4), P(5, 0, 400), P(-5, 0, 400)].forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.clip(); c.globalAlpha = foc ? .28 : .45; c.drawImage(off, 0, 0, W, H); c.globalAlpha = 1;
    const g = c.createLinearGradient(0, hy, 0, H); g.addColorStop(0, css(FOG, foc ? .6 : .3)); g.addColorStop(.35, css(WATER, .1)); g.addColorStop(1, css(mx(WATER, FOG, .3), .3)); c.fillStyle = g; c.fillRect(0, hy, W, H - hy);
    lamps.forEach(l => { if (!l.lit) return; const Y = l.s ? 4.4 : 7.3, p = P(l.s * 5.75, Y, l.z, true), hh = f * 3.5 / l.z; blob(c, p[0], p[1] + hh * .15, hh * .1, hh * .55, AMBER, .6 * (1 - fog(l.z) * .6)); });
    const sa = foc ? 0 : end ? .8 : .28; if (sa) for (let i = 0; i < (end ? 90 : 50); i++) { const z = 5 * Math.pow(60, R()), y = hy + f * eY / z, sp = f * (.05 + 1.1 / z), x = sunX - f * .11 * (1 - 4 / z) * .0 + (R() - .5) * sp * 2 - (sunX - cx) * (1 - Math.min(1, 40 / z)) * .0, len = f * (.5 + R()) / z + 2; if (y > H) continue; c.strokeStyle = css([255, 247, 218], sa * (.4 + R() * .6)); c.lineWidth = Math.max(.7, f * .05 / z); c.lineCap = 'round'; c.beginPath(); c.moveTo(x - len / 2, y); c.lineTo(x + len / 2, y); c.stroke(); }
    c.lineCap = 'round'; for (let i = 0, nn = foc ? 40 : 170; i < nn; i++) { const z = 2.6 + Math.pow(R(), 1.8) * 55, X = (R() * 2 - 1) * 4.7, p = P(X, 0, z), len = f * (.35 + R() * 1) / z, li = R() < .6; c.strokeStyle = li ? css(lt(WATER, .6), (foc ? .3 : .55) * (1 - fog(z) * .7)) : css(dk(WATER, .4), .2 * (1 - fog(z))); c.lineWidth = Math.max(.5, f * .035 / z); c.beginPath(); c.moveTo(p[0] - len / 2, p[1]); c.quadraticCurveTo(p[0], p[1] + (R() - .5) * 1.5, p[0] + len / 2, p[1]); c.stroke(); }
    c.restore(); }
  scene(false);
  /* mist */
  mistBand(c, R, hy + f * .04, W, f * .1, foc ? .5 : .3, 5);
  if (foc) { mistBand(c, R, hy - f * .1, W, f * .22, .5, 6); blob(c, cx, hy - f * .02, f * .42, f * .2, FOG, .85); c.fillStyle = css(FOG, .12); c.fillRect(0, 0, W, H); }
  else mistBand(c, R, hy - f * .1, W, f * .1, .22, 3);
  if (end) { blob(c, sunX, sunY, f * .5, f * .5, [255, 248, 226], .35); const bp = P(0, 5.4, 40); for (let i = 0; i < 7; i++) bird(c, bp[0] + (i * .05 - .1 + R() * .04) * f, bp[1] - (.03 + i * .035 + R() * .04) * f, f * (.011 + R() * .006), css(mx(dk(SLATE, .4), FOG, .3))); }
  else if (!foc && !o.live) { bird(c, cx - f * .5, hy - f * .52, f * .012, css(mx(SLATE, FOG, .45))); bird(c, cx - f * .45, hy - f * .49, f * .009, css(mx(SLATE, FOG, .5))); }
  if (o.info) Object.assign(o.info, { P, sunX, sunY, top: P(0, 5.0, 40) }); if (o.dial) fadeOut(c0, W, H, o.fade);
  if (o.dial) dial(c0, o.dial, st);
}


  /* ---------- The two pictures: one view painted at rest and once more in the fog ----------
     Each is painted in its own coordinates (L.ay = the water line of the quay view, the horizon of the canal view)
     and placed under the timer dial at each frame (anchor()). They fade to nothing at the top and at the bottom,
     so the parchment stays clean around them. Focus cross-fades from the rest picture to the fog one. */
  const view = () => S.codexView === 'quai' ? 'quai' : 'canal';
  let W = 0, H = 0, U = 1, PH = 0, key = '', pic = null, picFog = null, info = {}, L = null, job = 0;
  const ringRect = () => { const ring = document.querySelector('#sigil-card .ring-wrap'), r = ring && ring.getBoundingClientRect(); return r && r.height && !$('sigil-card').classList.contains('compact') ? r : null; };
  function plan() {
    const r = ringRect(), wide = W > 700;
    if (view() === 'quai') { const u = Math.max(1.2, Math.min(2.2, 1.1 + W / 1100)); return { v: 'quai', u, wide, ay: Math.round(290 * u), ph: Math.round(480 * u), key: 'q' + wide }; }
    const f = Math.round(Math.max(300, Math.min(680, W * .52))), cx = Math.round((r ? r.left + r.width / 2 : W / 2) / 8) * 8;
    return { v: 'canal', f, cx, ay: Math.round(f * 1.5), ph: Math.round(f * 2.45), key: 'c' + cx };
  }
  function paint(st) {
    const dpr = Math.min(2, devicePixelRatio || 1, Math.sqrt(3.5e6 / (W * PH))), cv = document.createElement('canvas');
    cv.width = Math.round(W * dpr); cv.height = Math.ceil(PH * dpr);
    const g = cv.getContext('2d'); g.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    const quai = L.v === 'quai', nfo = st === 'rest' ? (info = {}) : {};
    const o = { st, n: sessionsToday(), live: true, info: nfo };
    if (quai) Object.assign(o, { u: L.u, y0: L.ay, tx: L.wide ? .8 : .78, th: 100, gap: .27, stair: L.wide ? .7 : null, lamps: L.wide ? [.07, .44, .93] : [.06, .62], trees: L.wide ? [.14, .53, .88] : [.14, .9], barge: L.wide ? .34 : .48, skiff: .16 });
    else Object.assign(o, { hy: L.ay, f: L.f, cx: L.cx });
    (quai ? paintA : paintB)(g, W, PH, o);
    if (day.band !== 'day') { g.globalCompositeOperation = 'multiply'; g.globalAlpha = day.band === 'night' ? .5 : .35; g.fillStyle = `rgb(${TINT[day.band]})`; g.fillRect(0, 0, W, PH); g.globalAlpha = 1; }
    const a0 = quai ? 70 * L.u : L.f * .25, b0 = L.ay + (quai ? 110 * L.u : L.f * .6), m = g.createLinearGradient(0, 0, 0, PH);
    m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(a0 / PH, '#000'); m.addColorStop(b0 / PH, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, W, PH); g.globalCompositeOperation = 'source-over';
    return cv;
  }
  function ensure(w, h) {
    if (performance.now() - dayAt > 60000) { day = dayInfo(); dayAt = performance.now(); }
    W = w; H = h; const p = plan(), k = [w, h, p.key, Math.min(12, sessionsToday()), day.band].join('|');
    if (k === key && pic) return; key = k; L = p; PH = p.ph; U = p.v === 'quai' ? p.u : p.f / 240;
    pic = paint('rest'); picFog = null; clearTimeout(job); job = setTimeout(() => { picFog = paint('focus'); }, 80);
    boat = null; seedMist(); seedSky();
  }
  // Where the picture's line goes on screen: a little under the dial when it is shown, else near the bottom
  function anchor() {
    const navH = root.classList.contains('mnav-on') ? ((document.querySelector('.mnav') || {}).offsetHeight || 0) : 0;
    const quai = L.v === 'quai', low = H - navH - (quai ? 60 * L.u : L.f * .4), r = ringRect();
    if (!r) return Math.round(low);
    return Math.round(Math.max(H * .35, Math.min(low, r.bottom + (quai ? 95 * L.u : L.f * .3))));
  }

  /* ---------- Living parts ---------- */
  let mists = [], drops = [], smoke = [], fog = 0, last = 0, endT0 = 0, birdsAway = 0;
  let boat = null, nextBoat = 0, walker = null, nextWalker = 0;
  function seedMist() { const R = rng(4), span = L.v === 'quai' ? 120 * L.u : L.f * .3; mists = Array.from({ length: 6 }, () => ({ x: R() * W, y: L.ay - R() * span, rx: W * (.25 + R() * .3), k: .16 + R() * .12, v: (R() < .5 ? -1 : 1) * (.05 + R() * .08), a: .4 + R() * .3 })); }
  function seedSky() {
    const n = day.rain ? 70 : day.snow ? 60 : day.leaves ? 9 : 0, R = rng(9);
    drops = Array.from({ length: n }, () => ({ x: R() * W, y: R() * H, v: .6 + R() * .6, p: R() * 6.3, s: .7 + R() * .6 }));
  }
  const puff = (x, y, k = 1) => { if (smoke.length < 110) smoke.push({ x, y, r: 2 * U * k, a: .16 + .05 * k, life: 1, vy: (.35 + Math.random() * .2) * U, vx: (Math.random() - .5) * .1 }); };
  const glow = (cx, x, y, r, rgb, a) => { const gr = cx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); cx.fillStyle = gr; cx.fillRect(x - r, y - r, r * 2, r * 2); };
  const progress = () => { const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot; return Math.max(0, Math.min(1, 1 - Math.max(0, rem) / tot)); };
  function steamLaunch(cx, x, y, u) {
    cx.fillStyle = '#4C4034'; cx.beginPath(); cx.moveTo(x - 34 * u, y); cx.lineTo(x + 30 * u, y); cx.quadraticCurveTo(x + 26 * u, y + 7 * u, x + 18 * u, y + 7 * u); cx.lineTo(x - 28 * u, y + 7 * u); cx.closePath(); cx.fill();
    cx.fillStyle = '#D8CDB6'; cx.fillRect(x - 18 * u, y - 8 * u, 22 * u, 8 * u);
    cx.fillStyle = '#8C7D63'; for (let i = 0; i < 3; i++) cx.fillRect(x - 15 * u + i * 6.5 * u, y - 6 * u, 3.5 * u, 3.5 * u);
    cx.fillStyle = '#2F2A25'; cx.fillRect(x + 8 * u, y - 17 * u, 4.5 * u, 17 * u); cx.fillStyle = '#B08D4A'; cx.fillRect(x + 8 * u, y - 13 * u, 4.5 * u, 2 * u);
    cx.fillStyle = 'rgba(76,64,52,.18)'; cx.fillRect(x - 30 * u, y + 8 * u, 56 * u, 4 * u);
  }
  // the rowing boat of the canal view, going away towards the bridge
  function skiffAway(cx, z, a) {
    const P = info.P, p = P(1.3, 0, z), s = L.f / z; cx.globalAlpha = a; cx.lineCap = 'round';
    cx.strokeStyle = 'rgba(244,246,238,.5)'; cx.lineWidth = Math.max(.5, s * .06);
    [[.75, -.3], [1.85, 2.9]].forEach(q => { const e = P(q[1], 0, Math.max(4, z - 6)), b = P(q[0], 0, z - .4); cx.beginPath(); cx.moveTo(b[0], b[1]); cx.lineTo(e[0], e[1]); cx.stroke(); });
    cx.fillStyle = '#5C4C3C'; cx.beginPath(); cx.ellipse(p[0], p[1] - s * .16, s * .68, s * .22, 0, 0, 6.29); cx.fill();
    cx.fillStyle = '#4A3A2A'; cx.beginPath(); cx.ellipse(p[0], p[1] - s * .62, s * .2, s * .36, 0, 0, 6.29); cx.fill(); cx.beginPath(); cx.arc(p[0], p[1] - s * 1.08, s * .14, 0, 6.29); cx.fill();
    cx.strokeStyle = '#5C4C3C'; cx.lineWidth = Math.max(.5, s * .05);
    [-1, 1].forEach(d => { cx.beginPath(); cx.moveTo(p[0] + d * s * .2, p[1] - s * .5); cx.lineTo(p[0] + d * s * 1.25, p[1] + s * .05); cx.stroke(); });
    cx.globalAlpha = 1;
  }
  function passerBy(cx, x, y, u, now) {
    const step = Math.sin(now / 180) * 2.2 * u;
    cx.strokeStyle = '#4E4130'; cx.lineWidth = 1.6 * u; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(x, y - 6 * u); cx.lineTo(x - step, y); cx.moveTo(x, y - 6 * u); cx.lineTo(x + step, y); cx.stroke();
    cx.fillStyle = '#4E4130'; cx.beginPath(); cx.moveTo(x - 3.5 * u, y - 6 * u); cx.lineTo(x + 3.5 * u, y - 6 * u); cx.lineTo(x + 2.5 * u, y - 15 * u); cx.lineTo(x - 2.5 * u, y - 15 * u); cx.closePath(); cx.fill();
    cx.beginPath(); cx.arc(x, y - 17 * u, 2 * u, 0, 6.29); cx.fill();
    cx.lineWidth = u; cx.beginPath(); cx.moveTo(x + u, y - 13 * u); cx.lineTo(x + u, y - 23 * u); cx.stroke();
    cx.fillStyle = '#3A3128'; cx.beginPath(); cx.arc(x + u, y - 22 * u, 9 * u, Math.PI, 0); cx.closePath(); cx.fill();
  }
  function birds(cx, x, y, s, now, ph) { cx.beginPath(); const f = Math.sin(now / 140 + ph) * s * .5; cx.moveTo(x - s, y - f); cx.quadraticCurveTo(x - s / 2, y - s * .6, x, y); cx.quadraticCurveTo(x + s / 2, y - s * .6, x + s, y - f); cx.stroke(); }

  ML.codexDraw = (cx, w, h, slow, still, now) => {
    ensure(w, h);
    const dt = Math.min(100, last ? now - last : 16) * (still ? 0 : 1); last = now;
    const st = root.dataset.timer || 'idle', u = U, k = dt / 33 * (slow || .3), quai = L.v === 'quai', A = L.ay, f = L.f;
    const rest = st === 'idle' || st === 'break';
    // the fog: full in focus, a little on a pause or a rainy day
    const fogT = st === 'running' ? 1 : st === 'paused' ? .35 : st === 'break' ? 0 : day.rain ? .2 : 0;
    fog = still ? fogT : fog + (fogT - fog) * Math.min(1, dt / 2600);
    const calm = 1 - fog, endAge = endT0 ? now - endT0 : 1e9, ended = endAge < 6500, endK = ended ? Math.sin(Math.PI * endAge / 6500) : 0, flown = birdsAway && now < birdsAway;
    cx.save(); cx.translate(0, anchor() - A);
    cx.drawImage(pic, 0, 0, W, pic.height * W / pic.width);
    if (fog > .01 && picFog) { cx.globalAlpha = Math.min(1, fog); cx.drawImage(picFog, 0, 0, W, picFog.height * W / picFog.width); cx.globalAlpha = 1; }

    if (quai) {
      // the newest lit window glows for a moment after the bell
      if (endAge < 5000 && info.lastWin) { const p = info.lastWin; glow(cx, p.x + p.w / 2, p.y + p.h / 2, 14 * u, '255,212,138', .55 * (1 - endAge / 5000)); }
      // the tower: real time at rest, the session's progress during focus (minute hand)
      const tw = info.tower;
      if (tw) {
        const d = new Date(), hrA = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * 6.283;
        const focusing = (st === 'running' || st === 'paused') && S.mode === 'focus', minA = (focusing ? progress() : d.getMinutes() / 60) * 6.283;
        cx.strokeStyle = '#4A3A2A'; cx.lineCap = 'round';
        cx.lineWidth = .9 * u; cx.beginPath(); cx.moveTo(tw.x, tw.cy); cx.lineTo(tw.x + tw.r * .5 * Math.sin(hrA), tw.cy - tw.r * .5 * Math.cos(hrA)); cx.stroke();
        cx.lineWidth = .6 * u; cx.beginPath(); cx.moveTo(tw.x, tw.cy); cx.lineTo(tw.x + tw.r * .74 * Math.sin(minA), tw.cy - tw.r * .74 * Math.cos(minA)); cx.stroke();
        // the bell: rings around the belfry for a few seconds after a session
        if (ended) {
          const tt = (endAge / 2000) % 1; cx.strokeStyle = '#A8842F'; cx.lineWidth = 1 * u;
          [0, .33, .66].forEach(o => { const q = still ? o : (tt + o) % 1, r = (14 + q * 30) * u; cx.globalAlpha = (1 - q) * .75 * Math.min(1, (6500 - endAge) / 1200); cx.beginPath(); cx.arc(tw.x, tw.top + 16 * u, r, Math.PI * 1.15, Math.PI * 1.85); cx.stroke(); });
          cx.globalAlpha = 1;
        }
      }
    } else if (endK > 0) {
      // the canal's reward: the sun breaks through and lays a path of light on the water
      glow(cx, info.sunX, info.sunY, f * .6, '255,248,226', .5 * endK);
      const R = rng(77); cx.lineCap = 'round';
      for (let i = 0; i < 70; i++) {
        const z = 5 * Math.pow(60, R()), y = A + f * 2.6 / z, x = L.cx + (info.sunX - L.cx) * Math.min(1, 8 / z) + (R() - .5) * f * 3.2 / z, len = f * (.5 + R()) / z + 2;
        cx.strokeStyle = `rgba(255,247,218,${(.4 + R() * .5) * endK})`; cx.lineWidth = Math.max(.7, f * .05 / z); cx.beginPath(); cx.moveTo(x - len / 2, y); cx.lineTo(x + len / 2, y); cx.stroke();
      }
    }

    // smoke: none in focus; at rest the barge's stove and one chimney (three in winter); on a pause or a break the whole city
    if (!still) {
      const wind = day.rain ? .55 : .16, busy = st === 'paused' || st === 'break';
      if (st !== 'running') {
        if (info.stove && Math.random() < .04 * k) puff(info.stove[0], info.stove[1], .55);
        if (quai) {
          const all = info.stacks || [];
          (busy ? all.slice(0, 8) : all.slice(1, day.season === 'winter' ? 4 : 2)).forEach(s => { if (Math.random() < .03 * k) puff(s[0], s[1], .8); });
          if (busy) (info.fact || []).forEach(s => { if (Math.random() < .08 * k) puff(s[0], s[1], 1.4); });
        }
      }
      for (const p of smoke) { p.x += (p.vx + wind * (1 - p.life * .5)) * u * k; p.y -= p.vy * k; p.r += .05 * u * k * (1 + p.r / (12 * u)); p.life -= .0045 * k; }
      smoke = smoke.filter(p => p.life > 0);
    }
    for (const p of smoke) { const a = Math.max(0, p.a * p.life); if (a < .005) continue; glow(cx, p.x, p.y, p.r * 1.6, '160,154,146', a); }

    // pigeons: on a roof (quay) or on the bridge (canal); at a session's end they fly off, and come back a minute later
    const perch = quai ? info.perch : info.top, bs = quai ? u : f / 150;
    if (perch) {
      if (ended) {
        const tt = endAge / 6500; cx.strokeStyle = 'rgba(86,84,88,.8)'; cx.lineWidth = 1.2 * bs; cx.lineCap = 'round';
        [[0, 0], [12, -6], [-10, -10], [22, 4], [-20, 2], [30, -12]].forEach(([dx, dy], i) => birds(cx, perch[0] + (dx + tt * (130 + i * 20)) * bs, perch[1] + (dy - tt * (90 + i * 15)) * bs, 4 * bs, still ? 0 : now, i));
      } else if (!flown && st !== 'running') {
        cx.fillStyle = '#5E5C60';
        (quai ? [0, 3.4, 6.6, 10.4, 13.6] : [-12.4, -10, 8.8, 13.6, 15.6]).forEach((dx, i) => {
          const px = perch[0] + dx * bs, py = perch[1] - 1 * bs + (quai ? 0 : .0026 * dx * dx * bs);
          cx.beginPath(); cx.ellipse(px, py, 1.5 * bs, 1 * bs, 0, 0, 6.29); cx.fill(); cx.beginPath(); cx.arc(px + (i % 2 ? 1.2 : -1.2) * bs, py - .9 * bs, .65 * bs, 0, 6.29); cx.fill();
        });
      }
    }

    // traffic on the water and passers-by, at rest only
    if (!still) {
      if (rest && !boat && now > nextBoat) { if (nextBoat) boat = quai ? { x: -60 * u } : { z: 11 }; nextBoat = now + 70000 + Math.random() * 80000; }
      if (quai && rest && !walker && now > nextWalker && day.rain) { if (nextWalker) walker = { x: W + 20 * u }; nextWalker = now + 180000 + Math.random() * 200000; }
    }
    if (boat && quai) { const by = A + 42 * u, s = u * .7; steamLaunch(cx, boat.x, by, s); if (!still) { boat.x += .42 * u * k; if (Math.random() < .06 * k) puff(boat.x + 10 * s, by - 18 * s, .6); } if (boat.x > W + 60 * u) boat = null; }
    if (boat && !quai && info.P) { skiffAway(cx, boat.z, Math.max(0, Math.min(1, (boat.z - 11) / 2, (37.5 - boat.z) / 5)) * (1 - fog * .7)); if (!still) boat.z += .022 * k; if (boat.z > 37.5) boat = null; }
    if (walker && quai) { passerBy(cx, walker.x, A - 9 * u, u * .55, now); if (!still) walker.x -= .22 * u * k; if (walker.x < -20 * u) walker = null; } else walker = null;

    // ripples, almost still during focus
    cx.strokeStyle = '#F2F4EC'; cx.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const drift = still ? 0 : now * calm;
      const ra = .12 + .4 * calm; cx.globalAlpha = ra;
      if (quai) { const x = ((i * 97 + drift / 110) % (W + 40)) - 20, y = A + 6 * u + ((i * 37) % 90) * u; cx.lineWidth = .7 * u; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + (8 + (i % 4) * 5) * u, y); cx.stroke(); }
      else if (info.P) { const z = 4.5 + ((i * 7.3) % 30), X = ((i * 2.7) % 8.6) - 4.3 + Math.sin(drift / 9000 + i) * .3, p = info.P(X, 0, z), len = f * (.5 + (i % 3) * .25) / z; cx.globalAlpha = ra * (1 - z / 50); cx.lineWidth = Math.max(.6, f * .035 / z); cx.beginPath(); cx.moveTo(p[0] - len / 2, p[1]); cx.lineTo(p[0] + len / 2, p[1]); cx.stroke(); }
    }
    cx.globalAlpha = 1;

    // drifting mist bands, thicker in focus
    for (const m of mists) {
      if (!still) { m.x += m.v * dt / 33 * (slow || .3); if (m.x - m.rx > W) m.x = -m.rx; if (m.x + m.rx < 0) m.x = W + m.rx; }
      cx.save(); cx.translate(m.x, m.y); cx.scale(1, m.k);
      const gr = cx.createRadialGradient(0, 0, 0, 0, 0, m.rx); gr.addColorStop(0, `rgba(238,232,218,${m.a * (.25 + .5 * fog)})`); gr.addColorStop(1, 'rgba(238,232,218,0)');
      cx.fillStyle = gr; cx.beginPath(); cx.arc(0, 0, m.rx, 0, 6.29); cx.fill(); cx.restore();
    }
    cx.restore();
    // the weather of the day: rain (leaning smoke above), snow, or autumn leaves
    if (drops.length && !(st === 'running' && still)) {
      const kk = still ? 0 : dt / 33 * (st === 'running' ? .4 : 1);
      if (day.rain) { cx.strokeStyle = 'rgba(120,128,136,.35)'; cx.lineWidth = 1; cx.beginPath(); }
      for (const p of drops) {
        if (day.rain) { p.y += 7 * p.v * kk; p.x -= 1.4 * p.v * kk; if (p.y > H) { p.y = -10; p.x = Math.random() * (W + 60); } cx.moveTo(p.x, p.y); cx.lineTo(p.x + 2.6, p.y - 12 * p.s); }
        else if (day.snow) { p.y += .6 * p.v * kk; p.x += Math.sin(now / 1800 + p.p) * .25 * kk; if (p.y > H) { p.y = -6; p.x = Math.random() * W; } cx.fillStyle = 'rgba(255,255,255,.85)'; cx.beginPath(); cx.arc(p.x, p.y, 1.3 * p.s, 0, 6.29); cx.fill(); }
        else { p.y += .5 * p.v * kk; p.x += (.4 + Math.sin(now / 1500 + p.p) * .5) * kk; if (p.y > H || p.x > W + 10) { p.y = -8; p.x = Math.random() * W * .8; }
          cx.save(); cx.translate(p.x, p.y); cx.rotate(now / 900 + p.p); cx.fillStyle = p.p > 3 ? 'rgba(176,112,52,.65)' : 'rgba(196,148,62,.65)'; cx.beginPath(); cx.ellipse(0, 0, 3.4 * p.s, 1.8 * p.s, 0, 0, 6.29); cx.fill(); cx.restore(); }
      }
      if (day.rain) cx.stroke();
    }
  };
  on('session', s => { if (!isOn() || !s || s.mins < 1) return; endT0 = performance.now(); birdsAway = endT0 + 65000; sesAt = 0; });

  /* ---------- Swap between the two views: a small button in the timer card's head, Codex only ---------- */
  const vb = document.createElement('button');
  vb.type = 'button'; vb.className = 'ghost icon-only'; vb.id = 'codex-view'; vb.hidden = true;
  vb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg>';
  { const head = document.querySelector('#sigil-card .card-head'), deep = $('deep-btn'); if (head) head.insertBefore(vb, deep && deep.parentNode === head ? deep : null); }
  const syncBtn = () => { vb.hidden = !isOn(); vb.title = t('cdx_view'); vb.setAttribute('aria-label', t('cdx_view')); };
  new MutationObserver(syncBtn).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light', 'lang'] }); syncBtn();
  vb.addEventListener('click', () => { S.codexView = view() === 'canal' ? 'quai' : 'canal'; fog = root.dataset.timer === 'running' ? 1 : 0; if (ML.save) ML.save(); });

  /* ---------- The evening Gazette ---------- */
  const ov = document.createElement('div');
  ov.className = 'overlay gz-ov'; ov.id = 'gazette'; ov.hidden = true;
  document.body.appendChild(ov);
  const SKYLINE = '<svg viewBox="0 0 120 70" aria-hidden="true"><rect width="120" height="70" fill="#E9DFC8"/><path d="M0 52V40h8l4-6 4 6h8v-9h4v9h9l5-8 5 8h8V22h14v-8l6-10 6 10v8h2v30h12l5-7 5 7h10V70H0Z" fill="#8E7D60"/><circle cx="83" cy="22" r="4" fill="#E9DFC8"/><path d="M0 60h120" stroke="#A6AFAE" stroke-width="12" opacity=".75"/></svg>';
  function gazette() {
    const td = today(), ses = S.sessions.filter(s => dayKey(new Date(s.at)) === td);
    const mins = ses.reduce((a, s) => a + (s.mins || 0), 0), floors = ses.reduce((a, s) => a + (s.mins >= 15 ? Math.max(1, Math.round(s.mins / 30)) : 0), 0);
    const done = S.tasks.filter(x => x.done && x.doneAt && dayKey(new Date(x.doneAt)) === td);
    const days = new Set(S.sessions.map(s => dayKey(new Date(s.at)))).size;
    let head = t('gz_quiet');
    if (ses.length) head = `${ses.length === 1 ? t('gz_ses1') : t('gz_ses', { n: ses.length })}, ${t('gz_focus', { t: ML.fmtMins(mins) })}`
      + (floors ? ' : ' + (floors === 1 ? t('gz_floor1') : t('gz_floors', { n: floors })) : done.length ? ' : ' + (done.length === 1 ? t('gz_task1') : t('gz_tasks', { n: done.length })) : '');
    const Q = S.game && S.game.quests, quests = Q && Q.day === td ? Q.claimed.length : 0;
    const tmr = ML.eventsOn ? ML.eventsOn(ML.addDays(td, 1)).length : 0;
    const wx = t(day.rain ? 'gz_w_rain' : day.snow ? 'gz_w_snow' : 'gz_w_mist');
    const date = new Date().toLocaleDateString(ML.locale(), { weekday: 'long', day: 'numeric', month: 'long' });
    const doneTxt = done.length ? done.slice(0, 4).map(x => ML.titleOf ? ML.titleOf(x) : x.title).join(', ') + (done.length > 4 ? '…' : '.') : t('gz_done_none');
    const text = `${t('gz_title')} · ${date}\n${head}\n${t('gz_done_h')} ${doneTxt}\n${t('gz_brief', { s: ML.streaks().cur, q: quests })}`;
    ov.innerHTML = `<div class="sheet gz-sheet" role="dialog" aria-modal="true" aria-labelledby="gz-h">
      <div class="gz-meta"><span>${esc(t('gz_no', { n: days || 1 }))}</span><span>${esc(date)}</span><span>${esc(t('gz_price'))}</span></div>
      <h2 id="gz-h" class="gz-title">${esc(t('gz_title'))}</h2><p class="gz-tag">${esc(t('gz_tag'))}</p>
      <p class="gz-head">${esc(head)}</p>
      <div class="gz-cols"><div><p><b>${esc(t('gz_done_h'))}</b> ${esc(doneTxt)}</p><p><b>${esc(t('gz_weather_h'))}</b> ${esc(t('gz_weather', { e: t('mood_' + S.mood).toLowerCase(), w: wx }))}</p></div>
        <div>${SKYLINE}<p><b>${esc(t('gz_brief_h'))}</b> ${esc(t('gz_brief', { s: ML.streaks().cur, q: quests }))}</p></div></div>
      <div class="gz-foot"><span>${esc(tmr ? t('gz_tomorrow', { n: tmr }) : t('gz_tomorrow0'))}</span><button type="button" class="link" data-gz="share">${esc(t('gz_share'))} ↗</button></div>
      <button type="button" class="ghost icon-only gz-x" data-close="gazette" aria-label="${esc(t('close'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`;
    ov.dataset.text = text;
  }
  ML.openGazette = () => { gazette(); ML.openOverlay('gazette'); };
  ov.addEventListener('click', async e => {
    if (!e.target.closest('[data-gz="share"]')) return;
    const text = ov.dataset.text || '';
    try { if (navigator.share) { await navigator.share({ title: t('gz_title'), text }); return; } } catch (err) { if (err && err.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast(t('gz_copied')); } catch (err) {}
  });
  // in Codex, from 5 pm the end-of-session screen offers the day's Gazette
  ML.endExtras = () => isOn() && new Date().getHours() >= 17 ? `<button type="button" class="link end-gazette" data-gazette>${esc(t('gz_open'))}</button>` : '';
  document.addEventListener('click', e => { if (e.target.closest('[data-gazette]')) setTimeout(ML.openGazette, 0); });
})();
