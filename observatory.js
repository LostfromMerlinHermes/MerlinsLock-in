// Observatoire (Steady, day world): the dial in smooth lines (3.39), chosen from proposals/stable/lignes.png (A, with C's
// glow and comet). The ticks and the little shapes are hidden; in their place three thin brass orbits turn very slowly,
// the time runs as a smooth copper arc with a soft glow, and a planet with a short comet tail glides at its tip.
(() => {
  'use strict';
  const { S, on } = ML;
  const root = document.documentElement, NS = 'http://www.w3.org/2000/svg';
  const isOn = () => root.dataset.theme === 'observatory' && !root.dataset.light;
  const R = 132;
  // three tilted orbits, each with its planet, turning around the centre (SMIL, paused with reduced motion)
  const orbit = (rx, ry, tilt, deg, dur, dir) => { const a = deg * Math.PI / 180;
    return `<g class="ob-o"><ellipse rx="${rx}" ry="${ry}" transform="rotate(${tilt})"/><circle r="2.6" cx="${(Math.cos(a) * rx).toFixed(1)}" cy="${(Math.sin(a) * ry).toFixed(1)}" transform="rotate(${tilt})"/>
      <animateTransform attributeName="transform" type="rotate" from="0" to="${dir * 360}" dur="${dur}s" repeatCount="indefinite"/></g>`; };
  const tail = Array.from({ length: 12 }, (_, k) => { const a = -(k + 1) * .009 * Math.PI * 2; return `<circle cx="${(Math.sin(a) * R).toFixed(1)}" cy="${(-Math.cos(a) * R).toFixed(1)}" r="${(4.2 - k * .28).toFixed(2)}" opacity="${(.85 - k * .065).toFixed(2)}"/>`; }).join('');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ob-dial'); svg.setAttribute('viewBox', '-160 -160 320 320'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<defs><linearGradient id="ob-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6c79c"/><stop offset="1" stop-color="#c8693a"/></linearGradient>
      <filter id="ob-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>
    <g class="ob-orbits">${orbit(118, 40, -20, 18, 260, 1)}${orbit(116, 26, 35, 200, 340, -1)}${orbit(104, 56, 75, 290, 420, 1)}</g>
    <circle class="ob-track" r="${R}"/>
    <g transform="rotate(-90)"><circle class="ob-glow" r="${R}" pathLength="1"/><circle class="ob-arc" r="${R}" pathLength="1"/></g>
    <g class="ob-q">${[0, 1, 2, 3].map(i => `<circle r="1.8" cx="${[0, 146, 0, -146][i]}" cy="${[-146, 0, 146, 0][i]}"/>`).join('')}</g>
    <g class="ob-tip"><g class="ob-tail">${tail}</g><circle class="ob-halo" cy="${-R}" r="10"/><circle class="ob-bead" cy="${-R}" r="5"/></g>`;
  const arc = svg.querySelector('.ob-arc'), glow = svg.querySelector('.ob-glow'), tip = svg.querySelector('.ob-tip');
  let lastKey = '';
  function render() {
    const wrap = document.querySelector('#sigil-card .ring-wrap');
    if (!isOn() || !wrap) { if (svg.isConnected) svg.remove(); lastKey = ''; return; }
    if (svg.parentNode !== wrap) wrap.prepend(svg);
    const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot, started = rem < tot - .5 || ML.running();
    const p = started ? Math.max(0, Math.min(1, 1 - Math.max(0, rem) / tot)) : 0, key = Math.round(p * 1000);
    if (key === lastKey) return; lastKey = key;
    const d = `${p.toFixed(4)} 1`; arc.style.strokeDasharray = d; glow.style.strokeDasharray = d;
    tip.setAttribute('transform', `rotate(${(p * 360).toFixed(2)})`);
    svg.classList.toggle('idle', !started);
  }
  const motion = () => { try { ML.reducedMotion() ? svg.pauseAnimations() : svg.unpauseAnimations(); } catch (e) {} };
  on('tick', render); on('timer', render); on('render', render); on('started', () => { render(); motion(); }); on('motion', motion);
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light'] });
})();

// Full screen « Star chart » (3.46, WORLD_STYLE.observatory = 'chart' in focusplus.js): an observer's sheet on a night
// sky. The time huge in Cinzel; under it the planet's path from horizon to horizon (it rises at the start and sets at
// the end, the four quarters marked by moon phases that light up as you pass them); the log line « m MIN · ALT a° ».
// Top right, today's constellation: one star per finished session (max 8), joined by brass lines, the next one dotted.
// Paused, a veil of cloud passes. Ending: the planet sets, a shooting star crosses, the new star of the constellation
// flashes and a brass seal « OBSERVÉ · n MIN » is stamped.
(() => {
  'use strict';
  const { S, t, today, dayKey } = ML;
  ML.addStrings({
    fr: { dp_chart: 'Carte', oc_no: 'Observation n° {n}', oc_line: '{m} min sur {t} · altitude {a}°{p}', oc_pz: ' · {p}', oc_pauses: '{n} pauses', oc_pauses_one: '1 pause', oc_cloud: 'Nuages', oc_seen: 'OBSERVÉ', oc_sky: 'Ciel du jour, {n} sur 8' },
    en: { dp_chart: 'Chart', oc_no: 'Observation no. {n}', oc_line: '{m} of {t} min · altitude {a}°{p}', oc_pz: ' · {p}', oc_pauses: '{n} pauses', oc_pauses_one: '1 pause', oc_cloud: 'Clouds', oc_seen: 'OBSERVED', oc_sky: "Today's sky, {n} of 8" },
  });
  const $ = id => document.getElementById(id);
  const clamp = v => Math.max(0, Math.min(1, v));
  const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  // the path: a half ellipse from the left horizon (0) to the right one (1), in a 600×170 box
  const PX = p => 40 + 520 * p, PY = p => 150 - 128 * Math.sin(Math.PI * p);
  const STARS = [[18, 70], [44, 52], [70, 60], [92, 34], [122, 40], [140, 16], [168, 30], [184, 58]]; // today's constellation, 200×80
  // moon phases at each quarter: a disc and its lit part (new, first quarter, full, last quarter)
  const moon = (i, x, y) => { const r = 9, lit = ['', `M${x} ${y - r}A${r} ${r} 0 0 1 ${x} ${y + r}z`, `M${x} ${y - r}A${r} ${r} 0 1 1 ${x} ${y + r}A${r} ${r} 0 1 1 ${x} ${y - r}z`, `M${x} ${y - r}A${r} ${r} 0 0 0 ${x} ${y + r}z`][i];
    return `<g class="oc-moon" id="oc-m${i}"><circle cx="${x}" cy="${y}" r="${r}"/>${lit ? `<path d="${lit}"/>` : ''}</g>`; };
  function chartHtml(top, dock) {
    const stars = Array.from({ length: 90 }, (_, i) => `<i style="left:${(rnd(i, 1) * 100).toFixed(2)}%;top:${(rnd(i, 2) * 100).toFixed(2)}%;--s:${(1 + rnd(i, 3) * rnd(i, 3) * 2.6).toFixed(1)}px;--a:${(.25 + rnd(i, 4) * .6).toFixed(2)};--d:${(3 + rnd(i, 5) * 6).toFixed(1)}s;--l:-${(rnd(i, 6) * 9).toFixed(1)}s"></i>`).join('');
    const path = Array.from({ length: 41 }, (_, i) => (i ? 'L' : 'M') + PX(i / 40).toFixed(1) + ' ' + PY(i / 40).toFixed(1)).join('');
    const ticks = Array.from({ length: 21 }, (_, i) => { const p = i / 20, a = Math.atan2(-128 * Math.PI * Math.cos(Math.PI * p), 520), l = i % 5 ? 4 : 8, nx = -Math.sin(a), ny = Math.cos(a);
      return `<path d="M${(PX(p) - nx * l).toFixed(1)} ${(PY(p) - ny * l).toFixed(1)}L${(PX(p) + nx * l).toFixed(1)} ${(PY(p) + ny * l).toFixed(1)}"/>`; }).join('');
    return `<div class="oc-sky" aria-hidden="true">${stars}</div><div class="oc-cloud" aria-hidden="true"></div><i class="oc-shoot" aria-hidden="true"></i>${top}
      <div class="oc">
        <header class="oc-head"><span id="oc-no"></span></header>
        <figure class="oc-const" aria-hidden="true"><svg viewBox="0 0 200 80"><path class="oc-cl" id="oc-cl"/><path class="oc-cn" id="oc-cn"/>${STARS.map(([x, y], i) => `<circle class="oc-st" id="oc-s${i}" cx="${x}" cy="${y}" r="3"/>`).join('')}</svg><figcaption id="oc-sky"></figcaption></figure>
        <div class="oc-main">
          <div class="oc-time" id="oc-time" role="timer"></div>
          <p class="oc-line" id="oc-line"></p>
          <svg class="oc-path" viewBox="0 0 600 170" aria-hidden="true"><path class="oc-hz" d="M0 150H600"/><g class="oc-tk">${ticks}</g><path class="oc-way" d="${path}"/><path class="oc-done" id="oc-done" d="${path}" pathLength="1"/>
            ${[0, 1, 2, 3].map(i => moon(i, PX(i / 4 + .125), PY(i / 4 + .125) + 26)).join('')}
            <g id="oc-pl"><circle class="oc-halo" r="16"/><circle class="oc-planet" r="7"/><text class="oc-pll" id="oc-pll" y="-22"></text></g></svg>
          <p class="oc-task" id="oc-task"></p>
        </div>
        <div class="oc-seal" aria-hidden="true"><small>${t('oc_seen')}</small><b id="oc-sm"></b></div>
      </div>${dock}`;
  }
  function chartRender({ rem, run, done, title }) {
    const tot = S.total || 1, p = done ? 1 : clamp(1 - Math.max(0, rem) / tot), td = today(), n = (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length;
    const last = (S.sessions || [])[S.sessions.length - 1], mins = done && last ? last.mins : Math.round((tot - Math.max(0, rem)) / 60), ps = done && last ? last.pauses || 0 : S.pauses || 0;
    $('oc-no').textContent = t('oc_no', { n: done ? n : n + 1 });
    $('oc-time').textContent = MiniView.fmtClock(done ? 0 : rem);
    $('oc-line').textContent = t('oc_line', { m: mins, t: done && last ? last.mins : Math.round(tot / 60), a: Math.round(90 * Math.sin(Math.PI * p)), p: ps ? t('oc_pz', { p: ML.tn('oc_pauses', ps) }) : '' });
    $('oc-task').textContent = title;
    $('oc-done').style.strokeDasharray = `${p.toFixed(4)} 1`;
    $('oc-pl').setAttribute('transform', `translate(${PX(p).toFixed(1)} ${PY(p).toFixed(1)})`);
    $('oc-pll').textContent = !run && !done && p > 0 ? t('oc_cloud') : '';
    [0, 1, 2, 3].forEach(i => $('oc-m' + i).classList.toggle('on', p >= i / 4 + .125));
    const lit = Math.min(8, n), pts = STARS.slice(0, lit);
    STARS.forEach((_, i) => { const s = $('oc-s' + i); s.setAttribute('class', 'oc-st' + (i < lit ? ' on' : '') + (done && i === lit - 1 ? ' new' : '') + (!done && i === lit ? ' next' : '')); });
    $('oc-cl').setAttribute('d', pts.map(([x, y], i) => (i ? 'L' : 'M') + x + ' ' + y).join(''));
    $('oc-cn').setAttribute('d', !done && lit && lit < 8 ? `M${STARS[lit - 1].join(' ')}L${STARS[lit].join(' ')}` : '');
    $('oc-sky').textContent = t('oc_sky', { n: lit });
    $('oc-sm').textContent = (last ? last.mins : 0) + ' MIN';
  }
  ML.deepStyles = Object.assign(ML.deepStyles || {}, {
    chart: { html: chartHtml, render: chartRender, doneMs: () => ML.reducedMotion() ? 4200 : 5400 },
  });
})();

// Background (3.90, proposals/observatoire-fond round 2, all five parts kept): the same mood as before (dark brown,
// warm light from the top right, shafts, golden dust, an astrolabe low on the left), developed. Drawn on game.js's
// #fx canvas through ML.observatoryDraw. 1 a true engraved astrolabe (24 h Roman limb, tympan for 48° N, a pierced
// rete turning in 4 min, the rule the other way, rim lit on the sun side); 2 an unseen mullioned window (panes and
// transoms in the shafts, its light pool low on the right, a cloud dims the light now and then); 3 dust in three
// depths, bright only inside the beams; 4 a faint engraved sky chart top left with cold blue stars; 5 one rete star
// per session of the day (cap 8), a glint round the limb, brighter shafts and a shooting star when a session ends.
// The fixed parts are painted once per size; tm is game.js's virtual clock, so everything slows during a session.
(() => {
  'use strict';
  const { S, on } = ML;
  const C1 = '#e58c52', D2R = Math.PI / 180, PHI = 48 * D2R, EPS = 23.44 * D2R, ROT = 0.62;
  const rnd = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const tcap = r => r * Math.tan(Math.PI / 4 + EPS / 2), tcan = r => r * Math.tan(Math.PI / 4 - EPS / 2);
  let W = 0, H = 0, d = 1, key = '', base = null, chart = null, mater = null, shL = null, shX = null, dust = [], shoot = null, endAt = 0;
  let lit = 0, litAt = 0;
  const layer = () => { const L = document.createElement('canvas'); L.width = Math.round(W * d); L.height = Math.round(H * d); const g = L.getContext('2d'); g.scale(d, d); return [L, g]; };
  const geo = () => { const R = Math.min(W, H) * (W < 600 ? 0.46 : 0.36); return { ox: 0.11 * W, oy: 0.87 * H, R, Req: R * 0.5 }; };
  const sessionsToday = () => { const td = ML.today(); return (S.sessions || []).filter(s => ML.dayKey(new Date(s.at)) === td).length; };
  on('session', () => { endAt = performance.now(); litAt = 0; });

  function paintBase() {
    const [L, g] = layer();
    // warm bounce low on the right where the window light lands, a soft vignette, faint plaster strokes
    g.save(); g.translate(W * 0.7, H * 1.05); g.scale(1, 0.5); let gr = g.createRadialGradient(0, 0, 0, 0, 0, W * 0.5); gr.addColorStop(0, 'rgba(255,170,110,.05)'); gr.addColorStop(1, 'rgba(255,170,110,0)'); g.fillStyle = gr; g.fillRect(-W * 0.5, -W * 0.5, W, W); g.restore();
    gr = g.createRadialGradient(W * 0.55, H * 0.45, Math.min(W, H) * 0.3, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(6,4,2,.5)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,220,170,.012)';
    for (let i = 0; i < 140; i++) { const y = rnd(i, 1) * H, x = rnd(i, 2) * W, l = 40 + rnd(i, 3) * 160; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (rnd(i, 4) - 0.5) * 3); g.stroke(); }
    return L;
  }
  const CONST = [[[0.10, 0.30], [0.18, 0.22], [0.27, 0.26], [0.33, 0.17], [0.42, 0.21]], [[0.20, 0.52], [0.28, 0.44], [0.36, 0.50], [0.31, 0.60], [0.20, 0.52], [0.12, 0.62]], [[0.50, 0.08], [0.56, 0.16], [0.62, 0.12], [0.68, 0.22], [0.60, 0.30]]];
  function paintChart() {
    const [L, g] = layer(), Sz = Math.min(W, H) * 1.1, px = -Sz * 0.15, py = -Sz * 0.25;
    g.strokeStyle = 'rgba(229,140,82,.07)'; g.lineWidth = 1;
    for (let k = 1; k <= 7; k++) { g.beginPath(); g.arc(px, py, Sz * 0.16 * k, 0, Math.PI / 2); g.stroke(); }
    for (let a = 0; a <= 90; a += 15) { g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a * D2R) * Sz * 1.2, py + Math.sin(a * D2R) * Sz * 1.2); g.stroke(); }
    g.setLineDash([2, 5]); g.strokeStyle = 'rgba(229,140,82,.09)'; g.beginPath(); g.arc(px + Sz * 0.25, py - Sz * 0.05, Sz * 0.78, 0.35, 1.45); g.stroke(); g.setLineDash([]);
    for (let a = 0; a <= 90; a += 3) { const r = Sz * 0.96, l = a % 15 ? 3 : 7; g.beginPath(); g.moveTo(px + Math.cos(a * D2R) * r, py + Math.sin(a * D2R) * r); g.lineTo(px + Math.cos(a * D2R) * (r + l), py + Math.sin(a * D2R) * (r + l)); g.stroke(); }
    const bw = Math.min(W * 0.55, 560), bh = bw * 0.7;
    g.strokeStyle = 'rgba(143,176,232,.13)'; g.lineWidth = 0.8;
    CONST.forEach(f => { g.beginPath(); f.forEach(([x, y], i) => i ? g.lineTo(x * bw, y * bh) : g.moveTo(x * bw, y * bh)); g.stroke(); });
    g.fillStyle = 'rgba(220,230,255,.18)';
    for (let i = 0; i < 90; i++) { const x = rnd(i, 7) * bw * 1.1, y = rnd(i, 8) * bh * 1.1, r = 0.4 + rnd(i, 9) * rnd(i, 9) * 1.1; g.beginPath(); g.arc(x, y, r, 0, 6.29); g.fill(); }
    return { L, bw, bh };
  }
  function paintMater() {
    const { ox, oy, R, Req } = geo(), [L, g] = layer(), sunA = Math.atan2(-oy, W - ox);
    const rim = (r, w, a) => { g.lineWidth = w; g.strokeStyle = hexA(C1, a); g.beginPath(); g.arc(ox, oy, r, 0, 6.29); g.stroke(); };
    rim(R, 2, 0.22); rim(R * 0.94, 1, 0.18); rim(R * 0.86, 1, 0.16);
    g.lineWidth = 3; const lg = g.createLinearGradient(ox + Math.cos(sunA - 0.9) * R, oy + Math.sin(sunA - 0.9) * R, ox + Math.cos(sunA + 0.9) * R, oy + Math.sin(sunA + 0.9) * R);
    lg.addColorStop(0, 'rgba(255,200,140,0)'); lg.addColorStop(0.5, 'rgba(255,210,150,.4)'); lg.addColorStop(1, 'rgba(255,200,140,0)');
    g.strokeStyle = lg; g.beginPath(); g.arc(ox, oy, R, sunA - 0.9, sunA + 0.9); g.stroke(); g.lineWidth = 1;
    for (let dg = 0; dg < 360; dg++) { const a = dg * D2R, l = dg % 15 === 0 ? R * 0.06 : dg % 5 === 0 ? R * 0.035 : R * 0.018;
      g.strokeStyle = hexA(C1, dg % 15 === 0 ? 0.26 : 0.14); g.beginPath(); g.moveTo(ox + Math.cos(a) * R, oy + Math.sin(a) * R); g.lineTo(ox + Math.cos(a) * (R - l), oy + Math.sin(a) * (R - l)); g.stroke(); }
    const ROM = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    g.fillStyle = hexA(C1, 0.3); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `500 ${Math.max(8, R * 0.05)}px Cinzel, Georgia, serif`;
    for (let h = 0; h < 24; h++) { const a = -Math.PI / 2 + h * Math.PI / 12, rr = R * 0.9; g.save(); g.translate(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr); g.rotate(a + Math.PI / 2); g.fillText(ROM[h % 12], 0, 0); g.restore(); }
    const rT = Math.min(tcap(Req), R * 0.84);
    g.save(); g.beginPath(); g.arc(ox, oy, rT, 0, 6.29); g.clip();
    g.strokeStyle = hexA(C1, 0.1);
    [tcan(Req), Req].forEach(r => { g.beginPath(); g.arc(ox, oy, r, 0, 6.29); g.stroke(); });
    for (let h = 0; h <= 80; h += 10) { const s = Math.sin(PHI) + Math.sin(h * D2R), r = Req * Math.cos(h * D2R) / s, c = Req * Math.cos(PHI) / s;
      g.strokeStyle = hexA(C1, h === 0 ? 0.24 : 0.11); g.lineWidth = h === 0 ? 1.4 : 1; g.beginPath(); g.arc(ox, oy - c, r, 0, 6.29); g.stroke(); }
    g.lineWidth = 1;
    const zs = Req * Math.tan((Math.PI / 2 - PHI) / 2), zn = -Req / Math.tan((Math.PI / 2 - PHI) / 2), yc = (zs + zn) / 2, half = (zn - zs) / 2;
    for (let az = 15; az < 90; az += 15) { const co = Math.abs(half) * Math.tan(az * D2R), r = Math.hypot(co, half); [-1, 1].forEach(sd => { g.strokeStyle = hexA(C1, 0.06); g.beginPath(); g.arc(ox + sd * co, oy - yc, r, 0, 6.29); g.stroke(); }); }
    g.strokeStyle = hexA(C1, 0.12); g.beginPath(); g.moveTo(ox, oy - rT); g.lineTo(ox, oy + rT); g.moveTo(ox - rT, oy); g.lineTo(ox + rT, oy); g.stroke();
    g.setLineDash([1.5, 3]); g.strokeStyle = hexA(C1, 0.08);
    for (let k = 1; k < 12; k++) { g.beginPath(); g.arc(ox + (k - 6) * rT * 0.12, oy + rT * 0.55, rT * 0.62, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    g.setLineDash([]); g.restore();
    g.save(); g.translate(ox, oy); g.rotate(-Math.PI / 2 + 0.55); g.strokeStyle = hexA(C1, 0.2); g.lineWidth = 1.2; g.beginPath();
    g.moveTo(-R * 0.16, -R * 0.99); g.bezierCurveTo(-R * 0.12, -R * 1.12, -R * 0.04, -R * 1.08, 0, -R * 1.16); g.bezierCurveTo(R * 0.04, -R * 1.08, R * 0.12, -R * 1.12, R * 0.16, -R * 0.99); g.stroke();
    g.beginPath(); g.arc(0, -R * 1.2, R * 0.04, 0, 6.29); g.stroke(); g.beginPath(); g.arc(0, -R * 1.29, R * 0.055, 0, 6.29); g.stroke(); g.restore();
    return L;
  }
  const POINTERS = [[20, 1.55, 1], [62, 0.82, -1], [105, 1.25, 1], [150, 0.7, -1], [196, 1.4, 1], [238, 1.0, -1], [282, 1.62, 1], [325, 0.9, -1]];
  function drawRete(cx, rot, n, flash) {
    const { ox, oy, R, Req } = geo(), rT = Math.min(tcap(Req), R * 0.84), eC = (tcap(Req) - tcan(Req)) / 2, eR = (tcap(Req) + tcan(Req)) / 2;
    cx.save(); cx.translate(ox, oy); cx.rotate(rot);
    cx.strokeStyle = hexA(C1, 0.26); cx.lineWidth = 1.4;
    cx.beginPath(); cx.arc(0, 0, rT, 0, 6.29); cx.stroke(); cx.beginPath(); cx.arc(0, -eC, eR, 0, 6.29); cx.stroke();
    cx.lineWidth = 1; cx.beginPath(); cx.arc(0, -eC, eR * 0.93, 0, 6.29); cx.stroke();
    cx.beginPath();
    for (let k = 0; k < 72; k++) { const a = k * 5 * D2R, l = k % 6 ? 0.035 : 0.07; cx.moveTo(Math.cos(a) * eR, -eC + Math.sin(a) * eR); cx.lineTo(Math.cos(a) * eR * (1 - l), -eC + Math.sin(a) * eR * (1 - l)); }
    cx.stroke();
    cx.strokeStyle = hexA(C1, 0.18); cx.beginPath();
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + 0.3; cx.moveTo(Math.cos(a) * rT, Math.sin(a) * rT);
      cx.bezierCurveTo(Math.cos(a + 0.35) * rT * 0.8, Math.sin(a + 0.35) * rT * 0.8, Math.cos(a - 0.3) * Req * 0.9, Math.sin(a - 0.3) * Req * 0.9, Math.cos(a) * Req * 0.55, Math.sin(a) * Req * 0.55); }
    cx.moveTo(-rT, 0); cx.lineTo(rT, 0); cx.stroke();
    POINTERS.forEach(([deg, rf, bend], i) => { const a = deg * D2R, r = Math.min(Req * rf, rT * 0.96), tx = Math.cos(a) * r, ty = Math.sin(a) * r;
      const bx = Math.cos(a) * (r - R * 0.09), by = Math.sin(a) * (r - R * 0.09), nx = -Math.sin(a) * bend * R * 0.03, ny = Math.cos(a) * bend * R * 0.03, isOn = i < n;
      cx.fillStyle = hexA(C1, isOn ? 0.38 : 0.14); cx.beginPath(); cx.moveTo(tx, ty); cx.quadraticCurveTo(bx + nx * 2, by + ny * 2, bx - nx, by - ny); cx.quadraticCurveTo(bx + nx, by + ny, tx, ty); cx.fill();
      if (isOn) { const f = i === n - 1 ? flash : 0, rr = R * (0.05 + f * 0.1), gr = cx.createRadialGradient(tx, ty, 0, tx, ty, rr);
        gr.addColorStop(0, `rgba(255,214,150,${0.7 + f * 0.3})`); gr.addColorStop(1, 'rgba(255,214,150,0)'); cx.fillStyle = gr; cx.beginPath(); cx.arc(tx, ty, rr, 0, 6.29); cx.fill();
        cx.fillStyle = '#ffe2b0'; cx.beginPath(); cx.arc(tx, ty, 1.6 + f * 1.5, 0, 6.29); cx.fill(); }
      else { cx.fillStyle = hexA(C1, 0.3); cx.beginPath(); cx.arc(tx, ty, 1.3, 0, 6.29); cx.fill(); } });
    cx.restore();
  }
  function drawRule(cx, rot) {
    const { ox, oy, R } = geo();
    cx.save(); cx.translate(ox, oy); cx.rotate(rot); cx.fillStyle = hexA(C1, 0.16); cx.strokeStyle = hexA(C1, 0.28); cx.lineWidth = 1;
    cx.beginPath(); cx.moveTo(-R * 0.97, -1.5); cx.lineTo(-R * 0.2, -R * 0.025); cx.lineTo(R * 0.2, -R * 0.025); cx.lineTo(R * 0.97, -1.5); cx.lineTo(R * 0.97, 1.5); cx.lineTo(R * 0.2, R * 0.025); cx.lineTo(-R * 0.2, R * 0.025); cx.lineTo(-R * 0.97, 1.5); cx.closePath(); cx.fill(); cx.stroke();
    cx.beginPath(); cx.moveTo(-R * 0.97, 0); cx.lineTo(R * 0.97, 0); cx.strokeStyle = hexA(C1, 0.35); cx.stroke(); cx.restore();
    cx.fillStyle = hexA(C1, 0.5); cx.beginPath(); cx.arc(ox, oy, R * 0.03, 0, 6.29); cx.fill();
    cx.fillStyle = 'rgba(255,220,170,.5)'; cx.beginPath(); cx.arc(ox - R * 0.008, oy - R * 0.008, R * 0.01, 0, 6.29); cx.fill();
  }
  const SHAFTS = [[-70, 84, 0.05], [44, 56, 0.042], [140, 104, 0.032]];
  const origin = () => ({ x: W * 0.95, y: -H * 0.05 });
  function drawShafts(cx, tm, k, still) {
    shX.setTransform(1, 0, 0, 1, 0, 0); shX.clearRect(0, 0, shL.width, shL.height); shX.setTransform(d, 0, 0, d, 0, 0);
    const g0 = shX, o = origin(), len = Math.hypot(W, H) * 1.3;
    g0.save(); g0.translate(o.x, o.y); g0.rotate(ROT + (still ? 0 : Math.sin(tm / 9000) * 0.03));
    SHAFTS.forEach(([off, w, a], si) => {
      const g = g0.createLinearGradient(0, 0, 0, len); g.addColorStop(0, `rgba(255,214,150,${a * k})`); g.addColorStop(0.55, `rgba(255,205,140,${a * k * 0.55})`); g.addColorStop(1, 'rgba(255,214,150,0)');
      g0.fillStyle = g; const mull = w * 0.07, pw = (w - mull * 2) / 3;
      for (let p = 0; p < 3; p++) { const x0 = off + p * (pw + mull); g0.beginPath(); g0.moveTo(x0, 0); g0.lineTo(x0 + pw, 0); g0.lineTo(x0 + pw * 1.25 + p * 6, len); g0.lineTo(x0 - pw * 0.05 + p * 6, len); g0.closePath(); g0.fill(); }
      g0.globalCompositeOperation = 'destination-out';
      [0.18, 0.42].forEach(t => { const y = len * t, bh = 10 + si * 3, gg = g0.createLinearGradient(0, y - bh, 0, y + bh); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(0.5, 'rgba(0,0,0,.55)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); g0.fillStyle = gg; g0.fillRect(off - 4, y - bh, w * 1.3 + 30, bh * 2); });
      g0.globalCompositeOperation = 'source-over';
    });
    g0.restore(); cx.drawImage(shL, 0, 0, W, H);
  }
  function drawPool(cx, k) {
    const w = Math.min(W * 0.26, 300), h = w * 0.9, pw = w * 0.3, gap = w * 0.06;
    cx.save(); cx.translate(W * 0.58, H * 0.74); cx.transform(1, 0, -0.62, 0.42, 0, 0); cx.globalAlpha = 0.04 * k;
    const g = cx.createLinearGradient(0, -h, 0, h); g.addColorStop(0, '#ffd59a'); g.addColorStop(1, 'rgba(255,213,154,0)'); cx.fillStyle = g;
    for (let i = 0; i < 3; i++) { const px = -w / 2 + i * (pw + gap);
      cx.beginPath(); cx.moveTo(px, -h + h * 0.55); cx.lineTo(px, -h + pw / 2); cx.arc(px + pw / 2, -h + pw / 2, pw / 2, Math.PI, 0); cx.lineTo(px + pw, -h + h * 0.55); cx.closePath(); cx.fill();
      cx.fillRect(px, -h + h * 0.6, pw, h * 0.4); }
    cx.restore(); cx.globalAlpha = 1;
  }
  function inBeam(x, y) {
    const o = origin(), dx = x - o.x, dy = y - o.y, c = Math.cos(-ROT), s = Math.sin(-ROT), u = dx * c - dy * s, v = dx * s + dy * c;
    if (v < 0) return 0; let b = 0;
    for (const [off, w] of SHAFTS) { const half = w / 2 + v * 0.05, dd = Math.abs(u - off - w / 2); if (dd < half) b = Math.max(b, 1 - dd / half); }
    return b;
  }
  function setup() {
    d = Math.min(2, devicePixelRatio || 1); base = paintBase(); chart = paintChart(); mater = paintMater();
    [shL, shX] = layer();
    dust = Array.from({ length: Math.round(W * H / 9000) }, (_, i) => { const l = i % 10 === 0 ? 2 : i % 3 === 0 ? 1 : 0;
      return { x: Math.random() * W, y: Math.random() * H, l, r: [0.5, 1.1, 2.6][l] + Math.random() * [0.4, 0.6, 2][l], v: [0.05, 0.12, 0.22][l] * (0.5 + Math.random()), p: Math.random() * 6.28 }; });
  }
  if (document.fonts) document.fonts.ready.then(() => { if (key) mater = paintMater(); });

  ML.observatoryDraw = (cx, w, h, slow, still, now, tm, rest) => {
    const k0 = `${w}x${h}x${devicePixelRatio}`; if (k0 !== key) { key = k0; W = w; H = h; setup(); }
    if (!litAt || now - litAt > 30000) { lit = Math.min(8, sessionsToday()); litAt = now; }
    const endAge = (now - endAt) / 1000, endK = endAt && endAge < 3.5 && !still ? 1 - endAge / 3.5 : 0, focus = slow < 1;
    const cloud = still ? 0 : Math.max(0, Math.sin(tm / 47000) * Math.sin(tm / 13000)) * 0.45;
    const k = (focus ? 0.7 : 1) * (1 - cloud) * (1 + endK * 0.9), t = tm / 1000;
    cx.drawImage(base, 0, 0, W, H);
    const gl = cx.createRadialGradient(W * 0.92, H * 0.02, 0, W * 0.92, H * 0.02, Math.max(W, H) * 0.55);
    gl.addColorStop(0, `rgba(255,200,120,${0.14 * k})`); gl.addColorStop(0.4, `rgba(255,190,110,${0.05 * k})`); gl.addColorStop(1, 'rgba(255,200,120,0)'); cx.fillStyle = gl; cx.fillRect(0, 0, W, H);
    // sky chart and its twinkling figure stars
    cx.globalAlpha = focus ? 0.6 : 1; cx.drawImage(chart.L, 0, 0, W, H); cx.globalAlpha = 1;
    CONST.forEach((fig, fi) => fig.forEach(([x, y], i) => { const tw = still ? 0.6 : 0.4 + 0.6 * Math.pow((Math.sin(t / 2.6 + fi * 3 + i * 1.7) + 1) / 2, 2);
      cx.fillStyle = `rgba(190,210,250,${(0.22 + 0.3 * tw) * (focus ? 0.6 : 1)})`; cx.beginPath(); cx.arc(x * chart.bw, y * chart.bh, 1.6, 0, 6.29); cx.fill(); }));
    if (!still && !shoot && (endK > 0.9 || (rest && Math.random() < 0.0006))) shoot = { x: chart.bw * (0.2 + Math.random() * 0.4), y: chart.bh * (0.1 + Math.random() * 0.3), n: 0 };
    if (shoot) { const q = shoot.n / 50, x = shoot.x + q * 160, y = shoot.y + q * 60, g = cx.createLinearGradient(x, y, x - 70, y - 26);
      g.addColorStop(0, `rgba(235,240,255,${0.7 * (1 - q)})`); g.addColorStop(1, 'rgba(235,240,255,0)'); cx.strokeStyle = g; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - 70, y - 26); cx.stroke(); cx.lineWidth = 1; if (++shoot.n > 50) shoot = null; }
    if (typeof cx !== 'function') drawShafts(cx, tm, k, still); drawPool(cx, k); // skipped frames get the NOP proxy (a function): no off-screen work
    // the astrolabe
    cx.drawImage(mater, 0, 0, W, H);
    drawRete(cx, t / 240 * 6.283 + 0.4, lit, endK); drawRule(cx, -t / 300 * 6.283 - 0.9);
    if (endK) { const { ox, oy, R } = geo(), a = (1 - endK) * 6.283 * 1.1 - Math.PI / 2, x = ox + Math.cos(a) * R, y = oy + Math.sin(a) * R, g = cx.createRadialGradient(x, y, 0, x, y, R * 0.12);
      g.addColorStop(0, `rgba(255,225,170,${0.8 * endK})`); g.addColorStop(1, 'rgba(255,225,170,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, R * 0.12, 0, 6.29); cx.fill(); }
    // dust in three depths, lit inside the beams
    for (const q of dust) {
      if (!still && slow) { q.y -= q.v * slow; q.x += Math.sin(tm / 4000 + q.p) * 0.15 * slow; if (q.y < -6) { q.y = H + 6; q.x = Math.random() * W; } }
      const tw = still ? 0.5 : (Math.sin(tm / 1700 + q.p) + 1) / 2, a = 0.05 + 0.1 * tw + inBeam(q.x, q.y) * (0.35 + 0.35 * tw) * k;
      if (q.l === 2) { const g = cx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 2.2); g.addColorStop(0, `rgba(255,226,180,${a * 0.5})`); g.addColorStop(1, 'rgba(255,226,180,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(q.x, q.y, q.r * 2.2, 0, 6.29); cx.fill(); }
      else { cx.globalAlpha = Math.min(1, a); cx.fillStyle = q.l ? '#ffe6be' : (q.p > 3 ? C1 : '#fff1d6'); cx.beginPath(); cx.arc(q.x, q.y, q.r, 0, 6.29); cx.fill(); cx.globalAlpha = 1; }
    }
    return endK > 0 || !!shoot;
  };
})();
