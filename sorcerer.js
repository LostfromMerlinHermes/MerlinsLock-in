// Cyber sorcier (Steady, night world) dial 3.47, chosen from proposals/sorcier/sorcier.html (artifact 3GE78HU8qKdmZYGNTBJ9Qt), option A.
// The rune circle: an engraved silver bezel with sixty minute ticks (they turn violet as the session passes), a violet
// light along the bezel, twelve runes (made up from straight strokes, no real alphabet) that light up as the wand
// passes them, the wand hand with a crystal tip, and the mana sub-dial at 6: one pearl per session of the day (max 6).
// At the end of a session the runes go out and light up again one after the other round the circle.
// The ring SVG is hidden under it, like the other dark-world dials.
(() => {
  'use strict';
  const { S, on, today, dayKey } = ML;
  const root = document.documentElement, NS = 'http://www.w3.org/2000/svg';

  const isOn = () => root.dataset.theme === 'sorcerer' && !root.dataset.light;
  const pt = (a, r) => [Math.sin(a * Math.PI / 180) * r, -Math.cos(a * Math.PI / 180) * r];
  const f1 = n => n.toFixed(1);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ln = (a, r0, r1) => { const [x0, y0] = pt(a, r0), [x1, y1] = pt(a, r1); return `M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}`; };
  const RUNES = ['M0 -6V6M0 -6L4 -2', 'M-3 -6V6M3 -6V6M-3 0H3', 'M0 -6V6M-4 -2L0 2L4 -2', 'M-3 -6L3 6M3 -6L-3 6', 'M0 -6V6M0 0L4 4M0 0L-4 4', 'M-3 6V-6L3 -2L-3 2',
    'M0 -6L4 0L0 6L-4 0Z', 'M-4 -6H4M0 -6V6', 'M-3 -6V6H3', 'M0 -6V6M-4 -6L4 6', 'M-4 0H4M0 -6V6M-3 -4L3 4', 'M-3 -6L0 0L3 -6M0 0V6'];
  const MANA = 6, R_ARC = 147;

  function html(id) {
    let s = `<defs><linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ece8ff"/><stop offset=".5" stop-color="#7a73a8"/><stop offset="1" stop-color="#d6d1f2"/></linearGradient>
      <filter id="${id}g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter></defs>`;
    s += `<circle r="154" class="sc-bezel" stroke="url(#${id}s)"/><circle r="146" class="sc-in"/>`;
    s += `<g class="sc-ticks">${Array.from({ length: 60 }, (_, i) => `<path class="${i % 5 ? '' : 'b'}" d="${ln(i * 6, 140, i % 5 ? 134 : 128)}"/>`).join('')}</g>`;
    s += `<g transform="rotate(-90)"><circle class="sc-glow" r="${R_ARC}" pathLength="1" filter="url(#${id}g)"/><circle class="sc-arc" r="${R_ARC}" pathLength="1"/></g>`;
    s += `<circle r="100" class="sc-in"/><circle r="96" class="sc-dash"/>`;
    s += `<g class="sc-runes">${RUNES.map((d, i) => { const [x, y] = pt(i * 30, 113); return `<path d="${d}" transform="translate(${f1(x)} ${f1(y)})" style="--i:${i}"/>`; }).join('')}</g>`;
    s += `<g class="sc-mana" transform="translate(0 78)"><circle r="17" class="sc-sub"/>${Array.from({ length: MANA }, (_, i) => { const [x, y] = pt(-112.5 + i * 45, 11); return `<circle cx="${f1(x)}" cy="${f1(y)}" r="2"/>`; }).join('')}<text y="3">MANA</text></g>`;
    s += `<g class="sc-wand"><path class="sc-shaft" d="M0 -70V-104"/><circle class="sc-knot" cy="-70" r="2.6"/><path class="sc-tipg" d="M0 -118L5 -106L0 -100L-5 -106Z" filter="url(#${id}g)"/><path class="sc-tip" d="M0 -116L4 -106L0 -101L-4 -106Z"/></g>`;
    return s;
  }
  function els(svg) {
    return svg._sc || (svg._sc = { ticks: [...svg.querySelectorAll('.sc-ticks path')], runes: [...svg.querySelectorAll('.sc-runes path')], arc: svg.querySelector('.sc-arc'),
      glow: svg.querySelector('.sc-glow'), wand: svg.querySelector('.sc-wand'), mana: [...svg.querySelectorAll('.sc-mana circle:not(.sc-sub)')] });
  }
  function update(svg, p, n) {
    const e = els(svg), d = `${p.toFixed(4)} 1`;
    e.ticks.forEach((l, i) => l.classList.toggle('on', p > 0 && i / 60 < p));
    e.runes.forEach((l, i) => l.classList.toggle('on', p > 0 && i / 12 < p));
    e.arc.style.strokeDasharray = d; e.glow.style.strokeDasharray = d;
    e.wand.style.transform = `rotate(${(p * 360).toFixed(2)}deg)`;
    e.mana.forEach((c, i) => c.classList.toggle('on', i < n));
  }

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-160 -160 320 320'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('class', 'sc-dial');
  let built = false, lastKey = '';
  const progress = () => { const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot, started = rem < tot - .5 || (ML.running && ML.running());
    return started ? clamp(1 - Math.max(0, rem) / tot) : 0; };
  const count = () => { const td = today(); return Math.min(MANA, (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length); };
  function render() {
    const wrap = document.querySelector('#sigil-card .ring-wrap');
    if (!isOn() || !wrap) { if (svg.isConnected) svg.remove(); lastKey = ''; return; }
    if (!built) { built = true; svg.innerHTML = html('scd'); svg._sc = null; lastKey = ''; }
    if (svg.parentNode !== wrap) wrap.prepend(svg);
    const p = progress(), n = count(), key = Math.round(p * 2000) + '|' + n;
    if (key === lastKey) return; lastKey = key;
    update(svg, p, n);
  }
  on('tick', render); on('timer', render); on('render', render); on('started', render); on('newday', render);
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light'] });

  // the end of a session: the runes go out and light up again one after the other round the circle (CSS, one delay per rune)
  let castT = 0;
  on('session', s => {
    render();
    if (!isOn() || !s || s.mins < 1 || ML.reducedMotion()) return;
    svg.classList.remove('cast'); void svg.getBoundingClientRect(); svg.classList.add('cast');
    clearTimeout(castT); castT = setTimeout(() => svg.classList.remove('cast'), 3600);
  });
})();

// The tower above the clouds (3.47, background D2 of the proposals page), drawn on game.js's #fx canvas (ML.sorcererDraw).
// A wizard's tower alone on a floating rock island above a sea of violet clouds: crooked pointed roof with a crescent,
// a turret, a lit lancet window with leaded panes, a balcony, two far islets, the moon, a still constellation.
// Everything moves slowly: the clouds drift, the island bobs, open books orbit the tower, and every ~16 s at rest a soft
// violet ring spreads from the summoning circle (the same gesture as the world's opening ripple). Rest only: an owl
// on the balcony, a rare shooting star. One rune stone lights round the circle per session today (max 6). During a
// session the clouds rise, the books slow down and half close, the sky dims; only the window and the circle stay lit.
// End of a session: a column of light rises from the circle, every book opens, a wide ring goes out.
// The still parts are painted once per size (sky, island, cloud bands); a frame is a few drawImage calls and glows.
(() => {
  'use strict';
  const { S, on, today, dayKey } = ML;
  const root = document.documentElement, TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seeded = s => () => { s = s + 0x6D2B79F5 | 0; let q = Math.imul(s ^ s >>> 15, 1 | s); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
  const canvasOf = (w, h, d) => { const c = document.createElement('canvas'); c.width = Math.ceil(w * d); c.height = Math.ceil(h * d); const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return [c, x]; };
  const glow = (x, gx, gy, r, col, a) => { if (a <= .005 || r <= 0) return; const g = x.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(gx - r, gy - r, r * 2, r * 2); };
  const isOn = () => root.dataset.theme === 'sorcerer' && !root.dataset.light;

  let key0 = '', pend = '', pendAt = 0, geo = null, skyC = null, islC = null, clouds = [], twinkle = [];
  let fk = 0, lastNow = 0, drift = 0, orbit = 0, nextRing = 0, rings = [], endAt = -Infinity, star = null, nextStar = 0, restSince = 0;
  let lastCount = -Infinity, lit = -1, litAt = [];
  on('session', s => { lastCount = -Infinity; if (isOn() && s && s.mins >= 1 && !ML.reducedMotion()) { endAt = performance.now(); rings.push({ t0: endAt, big: true }); } });

  function cloudBand(W, H, d, R, col, puff, amp) { // a band that tiles horizontally (width W), its top edge made of soft puffs
    const bh = Math.ceil(H * .45), [c, x] = canvasOf(W, bh, d), y0 = puff * 1.6 + amp, ps = [];
    for (let px = 0; px < W; px += puff * (.55 + R() * .4)) ps.push([px, y0 - R() * amp * (1 + Math.sin(px / W * TAU * 3) * .5), puff * (.75 + R() * .7)]);
    const pass = (fill, dy, k) => { x.fillStyle = fill; x.beginPath(); for (const [px, ry, rr] of ps) for (const o of [0, -W, W]) { x.moveTo(px + o + rr * k, ry + dy); x.arc(px + o, ry + dy, rr * k, 0, TAU); } x.fill(); };
    pass('rgba(150,120,230,.35)', 0, 1); // the moonlit tops of the puffs, then the body of the cloud a little lower
    pass(col, puff * .22, .97); x.fillStyle = col; x.fillRect(0, y0 + puff * .2, W, bh); return c;
  }
  function build(W, H) {
    const d = Math.min(2, devicePixelRatio || 1), narrow = W < 700, u = narrow ? clamp(W / 540, .55, 1.1) : clamp(Math.min(W / 1000, H / 620), .5, 1.5), R = seeded(11);
    const ix = narrow ? W * .5 : W * .3, iy = H * .62, tx = ix - 60 * u, tb = iy - 4 * u, tw = 32 * u, top = tb - 112 * u;
    const wx = tx, wy = top + 22 * u, ww = 16 * u, wh = 30 * u, qx = tx + tw / 2 + 6 * u, qy = top + 44 * u, cx = ix + 70 * u, cy = iy - 4 * u;
    geo = { W, H, d, u, ix, iy, tx, tb, tw, top, wx, wy, ww, wh, qx, qy, cx, cy, crx: 46 * u, cry: 8 * u, mx: W * .8, my: H * .16 };
    // --- the sky: gradient, stars, moon, a still constellation, two far islets
    let x; [skyC, x] = canvasOf(W, H, d);
    const sg = x.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, '#0a0820'); sg.addColorStop(.75, '#241645'); sg.addColorStop(1, '#2a1a4a'); x.fillStyle = sg; x.fillRect(0, 0, W, H);
    x.fillStyle = '#ece9ff'; for (let i = 0, n = Math.round(W * H / 4500); i < n; i++) { x.globalAlpha = .25 + R() * .6; const s = R() < .08 ? 1.6 : .9; x.fillRect(R() * W, R() * H * .7, s, s); } x.globalAlpha = 1;
    twinkle = Array.from({ length: 22 }, () => ({ x: R() * W, y: R() * H * .6, r: .8 + R() * .9, T: 3000 + R() * 5000, p: R() * TAU }));
    const { mx, my } = geo; glow(x, mx, my, 150 * u, '170,140,255', .28);
    x.fillStyle = '#ebe5ff'; x.beginPath(); x.arc(mx, my, 26 * u, 0, TAU); x.fill();
    x.fillStyle = 'rgba(160,140,220,.25)'; [[-8, -6, 6], [7, 5, 4], [-3, 9, 3]].forEach(([dx, dy, rr]) => { x.beginPath(); x.arc(mx + dx * u, my + dy * u, rr * u, 0, TAU); x.fill(); });
    const cons = [[.08, .12], [.13, .08], [.19, .11], [.24, .07], [.27, .14]].map(([a, b]) => [W * (narrow ? a * 2.2 : a), H * b]);
    x.strokeStyle = 'rgba(200,190,255,.25)'; x.lineWidth = 1; x.beginPath(); cons.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); cons.forEach(([a, b]) => glow(x, a, b, 5 * u, '239,232,255', .9));
    const islet = (px, py, s, a) => { x.globalAlpha = a; x.fillStyle = '#1e1640'; x.beginPath(); x.moveTo(px - 40 * s, py); x.quadraticCurveTo(px, py - 8 * s, px + 40 * s, py); x.lineTo(px + 18 * s, py + 22 * s); x.lineTo(px + 4 * s, py + 46 * s); x.lineTo(px - 12 * s, py + 24 * s); x.closePath(); x.fill();
      x.fillRect(px - 6 * s, py - 26 * s, 4 * s, 26 * s); x.fillRect(px + 4 * s, py - 18 * s, 4 * s, 18 * s); x.fillRect(px - 8 * s, py - 28 * s, 18 * s, 3 * s); x.globalAlpha = 1; };
    if (!narrow) islet(W * .07, H * .5, .9 * u, .75); islet(W * .9, H * .56, .65 * u, .6);
    // --- the island, the tower and the circle's stones, painted once (drawn with a bob offset)
    [islC, x] = canvasOf(W, H, d);
    const rim = [[-150, 0], [-120, -6], [-60, -10], [0, -8], [60, -9], [120, -6], [160, 2]], under = [[150, 18], [128, 40], [112, 36], [96, 70], [78, 64], [60, 110], [40, 100], [22, 150], [6, 132], [-12, 176], [-26, 140], [-44, 150], [-58, 104], [-80, 96], [-96, 62], [-118, 50], [-136, 22]];
    const rock = x.createLinearGradient(ix - 150 * u, 0, ix + 160 * u, 0); rock.addColorStop(0, '#0e0a20'); rock.addColorStop(.6, '#1a1336'); rock.addColorStop(1, '#2a2050');
    x.fillStyle = rock; x.beginPath(); [...rim, ...under].forEach(([a, b], i) => i ? x.lineTo(ix + a * u, iy + b * u) : x.moveTo(ix + a * u, iy + b * u)); x.closePath(); x.fill();
    for (let k = 0; k < 14; k++) { const a = ix + (-120 + R() * 250) * u, b = iy + (14 + R() * 70) * u, s = (10 + R() * 18) * u;
      x.fillStyle = a > ix + 30 * u ? 'rgba(150,130,230,.14)' : 'rgba(0,0,0,.25)'; x.beginPath(); x.moveTo(a, b); x.lineTo(a + s * .6, b + s * .3); x.lineTo(a + s * .2, b + s * 1.4); x.lineTo(a - s * .3, b + s * .5); x.fill(); }
    x.strokeStyle = 'rgba(8,6,18,.7)'; x.lineWidth = 1; for (let k = 0; k < 8; k++) { let a = ix + (-110 + R() * 220) * u, b = iy + (8 + R() * 10) * u; x.beginPath(); x.moveTo(a, b); for (let j = 0; j < 4; j++) { a += (R() - .5) * 12 * u; b += (8 + R() * 14) * u; x.lineTo(a, b); } x.stroke(); }
    x.strokeStyle = 'rgba(90,160,150,.4)'; for (let k = 0; k < 7; k++) { const a = ix - 100 * u + k * 32 * u; x.beginPath(); x.moveTo(a, iy + 30 * u); x.quadraticCurveTo(a + 6 * u, iy + 60 * u, a - 4 * u, iy + (60 + R() * 50) * u); x.stroke(); }
    const wf = x.createLinearGradient(0, iy, 0, H); wf.addColorStop(0, 'rgba(62,232,224,.5)'); wf.addColorStop(1, 'rgba(62,232,224,0)'); x.fillStyle = wf; x.fillRect(ix + 128 * u, iy + 2 * u, 2.5 * u, H - iy);
    x.fillStyle = '#1f2a3a'; x.beginPath(); x.ellipse(ix + 5 * u, iy - 4 * u, 156 * u, 8 * u, 0, 0, TAU); x.fill();
    for (let k = 0; k < 40; k++) glow(x, ix + (R() - .5) * 280 * u, iy - 4 * u + (R() - .5) * 6 * u, 3 * u, '62,232,224', .5);
    // the tower in cut stone
    const stone = x.createLinearGradient(tx - tw / 2, 0, tx + tw / 2, 0); stone.addColorStop(0, '#2c2452'); stone.addColorStop(.55, '#1a1534'); stone.addColorStop(1, '#100c22');
    x.fillStyle = stone; x.beginPath(); x.moveTo(tx - tw / 2 - 4 * u, tb); x.lineTo(tx - tw / 2, top); x.lineTo(tx + tw / 2, top); x.lineTo(tx + tw / 2 + 4 * u, tb); x.fill();
    x.strokeStyle = 'rgba(160,140,230,.18)'; x.lineWidth = .8;
    for (let b = top + 8 * u, row = 0; b < tb; b += 8 * u, row++) { x.beginPath(); x.moveTo(tx - tw / 2, b); x.lineTo(tx + tw / 2, b); x.stroke(); for (let a = tx - tw / 2 + (row % 2 ? 6 : 0) * u; a < tx + tw / 2; a += 12 * u) { x.beginPath(); x.moveTo(a, b); x.lineTo(a, b + 8 * u); x.stroke(); } }
    // the crooked roof (tip bent to the right), shingles, crescent
    const rw = tw + 18 * u, tipX = tx + 22 * u, tipY = top - 96 * u;
    x.save(); x.translate(tx, top); x.scale(.78, .78); x.translate(-tx, -top);
    x.fillStyle = '#231a46'; x.beginPath(); x.moveTo(tx - rw / 2, top); x.quadraticCurveTo(tx - 6 * u, top - 50 * u, tx + 4 * u, top - 74 * u); x.quadraticCurveTo(tx + 10 * u, top - 88 * u, tipX, tipY); x.quadraticCurveTo(tx + 12 * u, top - 70 * u, tx + 14 * u, top - 46 * u); x.quadraticCurveTo(tx + 20 * u, top - 14 * u, tx + rw / 2, top); x.fill();
    x.strokeStyle = 'rgba(166,120,255,.25)'; for (let k = 1; k < 7; k++) { const b = top - k * 11 * u, half = rw / 2 * (1 - k / 8); x.beginPath(); x.moveTo(tx - half, b); x.quadraticCurveTo(tx, b + 3 * u, tx + half + 2 * u, b); x.stroke(); }
    x.fillStyle = '#e8dcff'; x.beginPath(); x.arc(tipX + 3 * u, tipY - 6 * u, 5 * u, 0, TAU); x.fill(); x.fillStyle = '#231a46'; x.beginPath(); x.arc(tipX + 5 * u, tipY - 7.5 * u, 4.2 * u, 0, TAU); x.fill();
    x.restore(); x.fillStyle = '#2a2050'; x.fillRect(tx - rw / 2 - 2 * u, top - 2 * u, rw + 4 * u, 4 * u);
    // the turret with its cone and corbel
    x.fillStyle = '#1a1534'; x.fillRect(qx - 7 * u, qy, 14 * u, 34 * u); x.beginPath(); x.moveTo(qx - 7 * u, qy + 34 * u); x.lineTo(qx, qy + 44 * u); x.lineTo(qx + 7 * u, qy + 34 * u); x.fill();
    x.fillStyle = '#231a46'; x.beginPath(); x.moveTo(qx - 10 * u, qy); x.lineTo(qx + 2 * u, qy - 30 * u); x.lineTo(qx + 10 * u, qy); x.fill();
    x.fillStyle = '#ffcf8a'; x.fillRect(qx - 1.5 * u, qy + 12 * u, 3 * u, 7 * u);
    // the lancet window, leaded panes, someone reading at the sill
    const arch = () => { x.beginPath(); x.moveTo(wx - ww / 2, wy + wh); x.lineTo(wx - ww / 2, wy + ww / 2); x.quadraticCurveTo(wx - ww / 2, wy, wx, wy - 4 * u); x.quadraticCurveTo(wx + ww / 2, wy, wx + ww / 2, wy + ww / 2); x.lineTo(wx + ww / 2, wy + wh); x.closePath(); };
    const lg = x.createLinearGradient(0, wy, 0, wy + wh); lg.addColorStop(0, '#f6e6ff'); lg.addColorStop(1, '#b48cff'); x.fillStyle = lg; arch(); x.fill();
    x.save(); arch(); x.clip(); x.strokeStyle = 'rgba(40,24,80,.85)'; x.lineWidth = 1.1 * u;
    for (let a = wx - ww / 2; a <= wx + ww / 2 + .1; a += ww / 3) { x.beginPath(); x.moveTo(a, wy - 6 * u); x.lineTo(a, wy + wh); x.stroke(); }
    for (let b = wy + 2 * u; b <= wy + wh; b += 6 * u) { x.beginPath(); x.moveTo(wx - ww, b); x.lineTo(wx + ww, b); x.stroke(); }
    x.fillStyle = 'rgba(40,24,80,.7)'; x.beginPath(); x.arc(wx - 2 * u, wy + wh - 4 * u, 3 * u, Math.PI, 0); x.fill(); x.fillRect(wx - 5 * u, wy + wh - 4 * u, 6 * u, 4 * u);
    x.restore(); x.strokeStyle = '#3a2f6a'; x.lineWidth = 2 * u; arch(); x.stroke();
    // balcony and door
    const by = wy + wh + 6 * u; geo.by = by; x.fillStyle = '#2a2050'; x.fillRect(wx - 16 * u, by, 32 * u, 3 * u); x.strokeStyle = '#2a2050'; x.lineWidth = 1.2 * u;
    for (let a = wx - 14 * u; a <= wx + 14 * u; a += 5 * u) { x.beginPath(); x.moveTo(a, by); x.lineTo(a, by - 8 * u); x.stroke(); } x.beginPath(); x.moveTo(wx - 16 * u, by - 8 * u); x.lineTo(wx + 16 * u, by - 8 * u); x.stroke();
    x.fillStyle = '#0a0816'; x.beginPath(); x.moveTo(tx - 6 * u, tb); x.lineTo(tx - 6 * u, tb - 14 * u); x.quadraticCurveTo(tx, tb - 22 * u, tx + 6 * u, tb - 14 * u); x.lineTo(tx + 6 * u, tb); x.fill();
    // the rune stones round the circle (unlit; their light is drawn live)
    geo.stones = Array.from({ length: 6 }, (_, k) => { const a = Math.PI + k / 5 * Math.PI; return [cx + Math.cos(a) * geo.crx * 1.25, cy + Math.sin(a) * geo.cry * 1.25 + (k < 3 ? 0 : 3 * u)]; });
    x.fillStyle = '#2a2252'; for (const [a, b] of geo.stones) { x.beginPath(); x.moveTo(a - 3.5 * u, b); x.lineTo(a - 3 * u, b - 10 * u); x.lineTo(a, b - 12 * u); x.lineTo(a + 3 * u, b - 10 * u); x.lineTo(a + 3.5 * u, b); x.fill(); }
    // --- cloud bands: far (behind the island), then two in front; they tile so they can drift
    clouds = [{ c: cloudBand(W, H, d, R, 'rgba(70,50,130,.5)', 40 * u, 22 * u), y: H * .66, v: .004 }, { c: cloudBand(W, H, d, R, 'rgba(48,34,96,.95)', 46 * u, 26 * u), y: H * .78, v: .009 }, { c: cloudBand(W, H, d, R, 'rgba(30,21,62,.97)', 52 * u, 22 * u), y: H * .88, v: .015 }];
    lastCount = -Infinity;
  }
  const band = (cx, cl, dy) => { const off = -((drift * cl.v) % geo.W), h = cl.c.height / geo.d; cx.drawImage(cl.c, off, cl.y + dy, geo.W, h); cx.drawImage(cl.c, off + geo.W, cl.y + dy, geo.W, h); };
  function book(cx, x, y, s, open, tilt, a, lum) { // an open book seen from the front, pages lit
    cx.save(); cx.translate(x, y); cx.rotate(tilt); cx.globalAlpha = a;
    glow(cx, 0, 0, s * 2.4, '255,220,160', .5 * lum);
    const lift = s * .35 * open, droop = s * .12 * open + s * (1 - open) * .4;
    cx.fillStyle = '#efe2c6'; cx.beginPath(); cx.moveTo(0, 0); cx.quadraticCurveTo(-s * .6, -lift, -s, -droop); cx.lineTo(-s, s * .5); cx.quadraticCurveTo(-s * .5, s * .32, 0, s * .6);
    cx.quadraticCurveTo(s * .5, s * .32, s, s * .5); cx.lineTo(s, -droop); cx.quadraticCurveTo(s * .6, -lift, 0, 0); cx.fill();
    cx.fillStyle = '#4a2f7a'; cx.fillRect(-s * 1.05, s * .45, s * 2.1, s * .18); cx.strokeStyle = 'rgba(80,60,120,.6)'; cx.lineWidth = .6; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(0, s * .6); cx.stroke(); cx.restore();
  }
  ML.sorcererDraw = (cx, W, H, slow, still, now, tm, rest) => {
    const dt = clamp((now - (lastNow || now)) / 16.7, 0, 4); lastNow = now;
    const k = W + 'x' + H;
    if (k !== key0) { if (k !== pend) { pend = k; pendAt = now; } if (!skyC || now - pendAt > 350) { key0 = k; pend = ''; build(W, H); } }
    const sp = still ? 0 : dt * Math.max(.3, slow), endK = still ? 0 : clamp(1 - (now - endAt) / 7000);
    drift += sp; orbit += sp / 5400 * (1 - .6 * fk) + (endK > 0 ? dt / 2600 * endK : 0);
    if (typeof cx === 'function') return true; // a skipped frame (game.js paints at ~30 fps)
    const g = geo, { u } = g, target = root.dataset.timer === 'running' ? 1 : 0; fk = still ? target : fk + (target - fk) * .02;
    const time = still ? 0 : now, bob = still ? 0 : Math.sin(now / 5200) * 2.2 * u;
    if (now - lastCount > 30000) { lastCount = now; const td = today(), n = Math.min(6, (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length);
      for (let i = 0; i < 6; i++) litAt[i] = i >= n ? Infinity : lit < 0 || i < lit ? (lit < 0 ? -Infinity : litAt[i]) : now + (i - lit) * 1500; lit = n; }
    cx.drawImage(skyC, 0, 0, W, H);
    if (!still) { cx.fillStyle = '#f2eeff'; for (const s of twinkle) { cx.globalAlpha = (1 - .6 * fk) * (.15 + .6 * Math.pow((Math.sin(time * TAU / s.T + s.p) + 1) / 2, 3)); cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, TAU); cx.fill(); } cx.globalAlpha = 1; }
    // rest only: a rare shooting star
    if (rest && !star && now > nextStar) { if (nextStar) star = { x: W * (.3 + Math.random() * .5), y: H * (.05 + Math.random() * .15), n: 0 }; nextStar = now + 60000 + Math.random() * 60000; }
    if (star) { const len = 70 * u, gx = star.x - len, gy = star.y - len * .4, sg = cx.createLinearGradient(gx, gy, star.x, star.y); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(255,255,255,.85)');
      cx.strokeStyle = sg; cx.lineWidth = 1.3; cx.globalAlpha = Math.max(0, 1 - star.n / 50); cx.beginPath(); cx.moveTo(gx, gy); cx.lineTo(star.x, star.y); cx.stroke(); cx.globalAlpha = 1; star.x += 6 * dt; star.y += 2.4 * dt; star.n += dt; if (star.n > 50) star = null; }
    band(cx, clouds[0], 0);
    if (fk > .01) { cx.fillStyle = `rgba(7,6,13,${(.32 * fk).toFixed(3)})`; cx.fillRect(0, 0, W, H); }
    // books behind the tower, then the island, then the books in front
    const ory = 16 * u, orx = 70 * u, oy = g.top + 58 * u + bob, open = Math.max(.85 - .5 * fk, endK), lum = (1 - .5 * fk) + endK * .6;
    const books = Array.from({ length: 6 }, (_, i) => { const ang = (i / 6 + orbit) * TAU; return { ang, x: g.tx + Math.cos(ang) * orx, y: oy + Math.sin(ang) * ory - Math.cos(ang) * orx * .12 + Math.sin(time / 2400 + i) * 1.5 * u, front: Math.sin(ang) > 0 }; });
    for (const b of books) if (!b.front) book(cx, b.x, b.y, 7 * u, open, Math.cos(b.ang) * .25, .55, lum);
    cx.drawImage(islC, 0, bob, W, H);
    if (fk > .01) { cx.fillStyle = `rgba(7,6,13,${(.28 * fk).toFixed(3)})`; cx.fillRect(0, 0, W, H); }
    // the window and the turret candle breathe; they stay lit during a session
    const br = still ? 1 : .85 + .15 * Math.sin(time / 4200);
    glow(cx, g.wx, g.wy + g.wh / 2 + bob, 46 * u, '190,140,255', Math.min(1, .5 * br + .3 * endK));
    glow(cx, g.qx, g.qy + 16 * u + bob, 11 * u, '255,190,120', (.55 + (still ? 0 : .1 * Math.sin(time / 230))) * (1 - .4 * fk));
    // rest only: the owl on the balcony (fades in after 20 s of rest), blinking now and then
    if (rest) { if (!restSince) restSince = now; } else restSince = 0;
    const owl = restSince ? clamp((now - restSince - 20000) / 3000) : 0;
    if (owl > 0) { const ox = g.wx + 11 * u, oyy = g.by - 14 * u + bob; cx.globalAlpha = owl; cx.fillStyle = '#0c0a1a'; cx.beginPath(); cx.ellipse(ox, oyy, 4.2 * u, 6 * u, 0, 0, TAU); cx.fill();
      cx.beginPath(); cx.moveTo(ox - 3.5 * u, oyy - 5 * u); cx.lineTo(ox - 2.5 * u, oyy - 9 * u); cx.lineTo(ox - 1 * u, oyy - 5.5 * u); cx.moveTo(ox + 1 * u, oyy - 5.5 * u); cx.lineTo(ox + 2.5 * u, oyy - 9 * u); cx.lineTo(ox + 3.5 * u, oyy - 5 * u); cx.fill();
      cx.globalAlpha = 1; if ((now / 4700) % 1 > .03) { glow(cx, ox - 1.5 * u, oyy - 2 * u, 2 * u, '255,210,122', owl); glow(cx, ox + 1.5 * u, oyy - 2 * u, 2 * u, '255,210,122', owl); } }
    // the summoning circle: soft glow, two rings, an inner ring and twelve ticks turning very slowly
    const ccy = g.cy + bob; glow(cx, g.cx, ccy, 70 * u, '166,120,255', .45 * (1 - .4 * fk) + .4 * endK);
    cx.strokeStyle = `rgba(210,185,255,${(.85 - .3 * fk).toFixed(2)})`; cx.lineWidth = 1.3;
    for (const kk of [1, .82, .4]) { cx.beginPath(); cx.ellipse(g.cx, ccy, g.crx * kk, g.cry * kk, 0, 0, TAU); cx.stroke(); }
    cx.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + time / 60000; cx.moveTo(g.cx + Math.cos(a) * g.crx * .86, ccy + Math.sin(a) * g.cry * .86); cx.lineTo(g.cx + Math.cos(a) * g.crx * .96, ccy + Math.sin(a) * g.cry * .96); } cx.stroke();
    // the soft violet rings: one every ~16 s at rest, a wide one at the end of a session
    if (rest && now > nextRing) { if (nextRing) rings.push({ t0: now }); nextRing = now + 14000 + Math.random() * 5000; }
    rings = rings.filter(r => now - r.t0 < (r.big ? 6000 : 5000));
    for (const r of rings) { const e = (now - r.t0) / (r.big ? 6000 : 5000), s = 1 + (1 - Math.pow(1 - e, 3)) * (r.big ? 5 : 1.6);
      cx.strokeStyle = `rgba(176,136,255,${((1 - e) * (r.big ? .55 : .4)).toFixed(3)})`; cx.lineWidth = (r.big ? 2.2 : 1.6) * (1 - e * .5);
      cx.beginPath(); cx.ellipse(g.cx, ccy, g.crx * s, g.cry * s, 0, 0, TAU); cx.stroke(); }
    // the rune stones lit by today's sessions (the newest one lights over 3 s)
    g.stones.forEach(([a, b], i) => { const o = still ? (litAt[i] <= now ? 1 : 0) : clamp((now - litAt[i]) / 3000); if (!(o > 0)) return;
      glow(cx, a, b - 6 * u + bob, 12 * u, '62,232,224', .85 * o); cx.globalAlpha = o; cx.fillStyle = '#c8fbf7'; cx.fillRect(a - .8 * u, b - 9 * u + bob, 1.6 * u, 5 * u); cx.globalAlpha = 1; });
    // the end of a session: a column of light from the circle up into the sky
    if (endK > 0) { const ck = Math.sin(Math.min(1, (1 - endK) * 3) * Math.PI / 2) * endK, cg = cx.createLinearGradient(0, 0, 0, ccy);
      cg.addColorStop(0, 'rgba(166,120,255,0)'); cg.addColorStop(.6, `rgba(190,160,255,${(.35 * ck).toFixed(3)})`); cg.addColorStop(1, `rgba(230,215,255,${(.75 * ck).toFixed(3)})`);
      cx.fillStyle = cg; cx.fillRect(g.cx - g.crx * .55, 0, g.crx * 1.1, ccy); glow(cx, g.cx, ccy, 30 * u, '255,255,255', .8 * ck); }
    for (const b of books) if (b.front) book(cx, b.x, b.y, 9 * u, open, Math.cos(b.ang) * .25, 1, lum);
    // the sea of clouds in front; it rises during a session
    const rise = -H * .07 * fk; band(cx, clouds[1], rise); band(cx, clouds[2], rise);
    return true;
  };
})();

// Full screens (3.48), chosen from proposals/sorcier/plein-ecran.html (artifact AtttWsLPNGp4FN2xmQkdgE).
// - « spell » (A, the default): a spell page on dark vellum. The time written in light over a pale spell diagram that
//   turns once per session; under it the formula, one rune per minute written by the wand (a cyan spark), motes of
//   light rising from what is written; six mana pearls (sessions today). Paused: EN SUSPENS, all in dull silver.
//   End: the formula lifts, the diagram lights up, two soft rings open, a seal « SORT LANCÉ · n MIN ».
// - « circle » (B, sold in the shop as a world dial item, slot equip.deepSorcerer): the summoning circle seen from
//   above, filling the screen. One rune per minute round the circle, a light arc with the spark, the time in the
//   centre, six standing stones (sessions today), open books orbiting slowly, a soft violet ring every ~16 s.
//   Paused: the rings stop, a violet mist crosses the floor. End: every rune flares, the heart lights, a wide ring.
// Both draw one SVG in a fixed viewBox (landscape 1600×900 or portrait 720×1560, picked when built) and only update
// attributes on each tick; the loops (motes, rings, books) are CSS animations, paused with the timer.
(() => {
  'use strict';
  const { S, t, today, dayKey } = ML;
  ML.addStrings({
    fr: { dp_spell: 'Page de sort', dp_circle: 'Cercle', sp_no: 'SORT N° {n}', ci_no: 'INVOCATION N° {n}', sp_today: 'AUJOURD’HUI', sp_hold: 'EN SUSPENS', sp_pause: 'EN PAUSE',
      sp_info: '{m} / {t} MIN · {p}', sp_nopause: 'SANS PAUSE', sp_pauses: '{n} PAUSES', sp_pauses_one: '1 PAUSE', sp_seal: 'SORT LANCÉ · {n} MIN', ci_seal: 'INVOQUÉ · {n} MIN',
      dial_spell: 'Page de sort', dial_spell_d: 'Cyber sorcier · plein écran : l’heure écrite en lumière et une rune par minute.',
      dial_circle: 'Cercle d’invocation', dial_circle_d: 'Cyber sorcier · plein écran : le cercle vu d’en haut, une rune par minute, des livres en orbite.' },
    en: { dp_spell: 'Spell page', dp_circle: 'Circle', sp_no: 'SPELL N° {n}', ci_no: 'SUMMONING N° {n}', sp_today: 'TODAY', sp_hold: 'ON HOLD', sp_pause: 'PAUSED',
      sp_info: '{m} / {t} MIN · {p}', sp_nopause: 'NO PAUSE', sp_pauses: '{n} PAUSES', sp_pauses_one: '1 PAUSE', sp_seal: 'SPELL CAST · {n} MIN', ci_seal: 'SUMMONED · {n} MIN',
      dial_spell: 'Spell page', dial_spell_d: 'Cyber sorcerer · full screen: the time written in light and one rune per minute.',
      dial_circle: 'Summoning circle', dial_circle_d: 'Cyber sorcerer · full screen: the circle seen from above, one rune per minute, books in orbit.' },
  });
  ML.deepWorldStyle = k => k === 'sorcerer' && S.econ && S.econ.equip && S.econ.equip.deepSorcerer === 'circle' ? 'circle' : null;

  const $ = id => document.getElementById(id);
  const f = v => v.toFixed(1), clamp = v => Math.max(0, Math.min(1, v)), TAU = Math.PI * 2;
  const pt = (a, r) => [Math.sin(a * TAU) * r, -Math.cos(a * TAU) * r];
  const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const RUNES = ['M0 -6V6M0 -6L4 -2', 'M-3 -6V6M3 -6V6M-3 0H3', 'M0 -6V6M-4 -2L0 2L4 -2', 'M-3 -6L3 6M3 -6L-3 6', 'M0 -6V6M0 0L4 4M0 0L-4 4', 'M-3 6V-6L3 -2L-3 2',
    'M0 -6L4 0L0 6L-4 0Z', 'M-4 -6H4M0 -6V6', 'M-3 -6V6H3', 'M0 -6V6M-4 -6L4 6', 'M-4 0H4M0 -6V6M-3 -4L3 4', 'M-3 -6L0 0L3 -6M0 0V6'];
  const rune = (i, x, y, s, cls, rot = 0) => `<path class="${cls}" d="${RUNES[(i * 5) % 12]}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})" vector-effect="non-scaling-stroke"/>`;
  const DEFS = `<defs><linearGradient id="spsil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9e5ff"/><stop offset=".5" stop-color="#7d76aa"/><stop offset="1" stop-color="#d4cff0"/></linearGradient>
    <filter id="spgl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter><filter id="spgs" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <radialGradient id="spbl"><stop offset="0" stop-color="#e8dcff" stop-opacity=".55"/><stop offset=".4" stop-color="#a678ff" stop-opacity=".3"/><stop offset="1" stop-color="#a678ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="spbk"><stop offset="0" stop-color="rgba(255,220,160,.55)"/><stop offset="1" stop-color="rgba(255,220,160,0)"/></radialGradient></defs>`;
  const port = () => innerWidth / Math.max(1, innerHeight) < .8;
  const count = () => { const td = today(); return (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length; };
  // shared numbers for both screens
  function facts({ rem, run, done }) {
    const tot = S.total || 1, p = done ? 1 : clamp(1 - Math.max(0, rem) / tot), n = count(), last = (S.sessions || [])[S.sessions.length - 1];
    const mins = done && last ? last.mins : Math.round((tot - Math.max(0, rem)) / 60), ps = done && last ? last.pauses || 0 : S.pauses || 0, paused = !run && !done && p > 0;
    return { p, n, paused, no: done ? n : n + 1, mins, total: Math.round(tot / 60), last: last ? last.mins : 0,
      info: t('sp_info', { m: mins, t: done && last ? last.mins : Math.round(tot / 60), p: paused ? t('sp_pause') : ps ? ML.tn('sp_pauses', ps) : t('sp_nopause') }),
      date: new Date().toLocaleDateString(ML.locale(), { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase().replace(/\./g, '.') + ' · ' + t('mood_' + S.mood).toUpperCase(),
      clock: MiniView.fmtClock(done ? 0 : rem) };
  }
  const seal = (x, y, w, id) => `<g class="sp-seal" transform="translate(${x} ${y})"><rect x="${-w / 2}" y="-26" width="${w}" height="44" rx="4" class="sp-sealb"/><rect x="${-w / 2 + 5}" y="-21" width="${w - 10}" height="34" rx="2" class="sp-sealr"/><text class="sp-sealt" y="3" id="${id}"></text></g>`;
  const mana = (x, y, id) => Array.from({ length: 6 }, (_, i) => `<g class="sp-mana" id="${id}${i}"><circle cx="${x - (5 - i) * 26}" cy="${y}" r="13" class="h"/><circle cx="${x - (5 - i) * 26}" cy="${y}" r="7"/></g>`).join('');

  /* ---------- A · the spell page ---------- */
  let G = null;
  function spellHtml(top, dock) {
    const P = port(), W = P ? 720 : 1600, H = P ? 1560 : 900, m = P ? 24 : 36, cx = W / 2, dy = P ? 640 : 350, Rd = P ? 260 : 280, fs = P ? 200 : 250;
    const ty = dy + fs * .36, fy = P ? 1080 : 668, x0 = P ? 80 : 300, x1 = W - x0, sp = (x1 - x0) / 24, rs = P ? 1.25 : 1.8;
    G = { P, W, H, cx, fy, x0, sp };
    const corners = [[m + 12, m + 12], [W - m - 12, m + 12], [m + 12, H - m - 12], [W - m - 12, H - m - 12]].map(([x, y]) => `<g transform="translate(${x} ${y})" class="sp-corner"><circle r="9"/><path d="M-14 0H14M0 -14V14"/><circle r="2.4" class="d"/></g>`).join('');
    const diag = `<g transform="translate(${cx} ${dy})"><g class="sp-diag" id="sp-diag"><circle r="${Rd}"/><circle r="${Rd * .9}" stroke-dasharray="2 6"/><circle r="${Rd * .55}"/>
      <path d="M0 ${-Rd * .9}L${f(Rd * .78)} ${f(Rd * .45)}L${f(-Rd * .78)} ${f(Rd * .45)}Z"/>${Array.from({ length: 12 }, (_, i) => { const [x, y] = pt(i / 12, Rd * .95); return rune(i, x, y, P ? 1.5 : 1.8, 'sp-dr', i * 30); }).join('')}</g>
      <circle class="sp-ring r1" r="${Rd * 1.25}"/><circle class="sp-ring r2" r="${Rd * 1.6}"/></g>`;
    const ix = P ? 60 : m + 56, line = fy + (P ? 20 : 30);
    const runes = Array.from({ length: 25 }, (_, i) => `<g class="sp-r" id="sp-r${i}">${rune(i, x0 + i * sp, fy, rs, 'g', 0)}${rune(i, x0 + i * sp, fy, rs, 'c', 0)}</g>`).join('');
    const motes = Array.from({ length: 30 }, (_, i) => `<circle class="sp-mote${rnd(i, 3) < .3 ? ' cy' : ''}" cx="${f(x0 + rnd(i, 1) * (x1 - x0))}" cy="${fy - 16}" r="${f(1 + rnd(i, 2) * 1.8)}" style="--d:${f(5 + rnd(i, 4) * 5)}s;--l:-${f(rnd(i, 5) * 9)}s;--h:-${f(P ? 160 + rnd(i, 6) * 340 : 90 + rnd(i, 6) * 220)}px"/>`).join('');
    return `${top}<div class="sp" role="timer"><svg class="sp-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${DEFS}
      <rect x="${m}" y="${m}" width="${W - 2 * m}" height="${H - 2 * m}" rx="6" class="sp-vel"/><rect x="${m + 12}" y="${m + 12}" width="${W - 2 * m - 24}" height="${H - 2 * m - 24}" rx="3" class="sp-in"/>${corners}${diag}
      <text class="sp-no" x="${ix}" y="${m + (P ? 136 : 70)}" id="sp-no"></text><text class="sp-date" x="${ix}" y="${m + (P ? 166 : 102)}" id="sp-date"></text>
      <text class="sp-tl" x="${W - ix}" y="${m + (P ? 226 : 66)}">${t('sp_today')}</text>${mana(W - ix - 8, m + (P ? 252 : 92), 'sp-m')}
      <text class="sp-time g" x="${cx}" y="${f(ty)}" font-size="${fs}" id="sp-tg"></text><text class="sp-time" x="${cx}" y="${f(ty)}" font-size="${fs}" id="sp-time"></text>
      <text class="sp-hold" x="${cx}" y="${f(dy - fs * .55)}">${t('sp_hold')}</text>
      <text class="sp-info" x="${cx}" y="${f(ty + (P ? 62 : 66))}" id="sp-info"></text><text class="sp-task" x="${cx}" y="${f(ty + (P ? 102 : 104))}" id="sp-task"></text>
      <path class="sp-line" d="M${x0 - 20} ${line}H${x1 + 20}"/><path class="sp-lit" id="sp-lit" d="M${x0 - 20} ${line}H${x0 - 20}"/>
      <clipPath id="sp-clip"><rect id="sp-clipr" x="0" y="0" width="0" height="${H}"/></clipPath><g clip-path="url(#sp-clip)" class="sp-motes">${motes}</g>
      <g class="sp-form">${runes}</g><g class="sp-spark" id="sp-spark"><circle r="16" class="h"/><circle r="5"/></g>
      ${seal(cx, P ? 1330 : m + 64, P ? 340 : 360, 'sp-seal')}</svg></div>${dock}`;
  }
  function spellRender(ctx) {
    if (!G) return; const k = facts(ctx), wr = Math.round(k.p * 25), line = G.fy + (G.P ? 20 : 30), hx = G.x0 + G.sp * (wr - .5);
    $('sp-no').textContent = t('sp_no', { n: k.no }); $('sp-date').textContent = k.date;
    $('sp-time').textContent = k.clock; $('sp-tg').textContent = k.clock; $('sp-info').textContent = k.info; $('sp-task').textContent = ctx.title;
    $('sp-diag').style.transform = `rotate(${ctx.done ? 360 : f(k.p * 360)}deg)`;
    for (let i = 0; i < 25; i++) $('sp-r' + i).classList.toggle('on', i < wr);
    $('sp-lit').setAttribute('d', `M${G.x0 - 20} ${line}H${f(Math.max(G.x0 - 20, hx))}`);
    $('sp-clipr').setAttribute('width', f(Math.max(0, hx)));
    $('sp-spark').setAttribute('transform', `translate(${f(Math.max(G.x0 - 20, hx))} ${line})`);
    for (let i = 0; i < 6; i++) { const e = $('sp-m' + i); e.classList.toggle('on', i < Math.min(6, k.n)); e.classList.toggle('new', ctx.done && i === Math.min(6, k.n) - 1); }
    $('sp-seal').textContent = t('sp_seal', { n: k.last });
  }

  /* ---------- B · the summoning circle seen from above (shop) ---------- */
  let C = null;
  function circleHtml(top, dock) {
    const P = port(), W = P ? 720 : 1600, H = P ? 1560 : 900, cx = W / 2, cy = P ? 700 : 440, R = P ? 280 : 350, fs = P ? 140 : 190;
    C = { P, R, cx, cy };
    let slabs = ''; const sl = P ? 120 : 150;
    for (let y = 0, row = 0; y < H; y += sl, row++) { slabs += `M0 ${y}H${W}`; for (let x = (row % 2) * sl / 2 + rnd(row, 9) * 30, j = 0; x < W; x += sl * (.8 + rnd(row, j++) * .5)) slabs += `M${f(x)} ${y}V${y + sl}`; }
    const ticks = Array.from({ length: 60 }, (_, i) => { const big = i % 5 === 0, [a, b] = pt(i / 60, R * .95), [c, d] = pt(i / 60, R * (big ? .9 : .925)); return `<path class="ci-t${big ? ' b' : ''}" id="ci-t${i}" d="M${f(a)} ${f(b)}L${f(c)} ${f(d)}"/>`; }).join('');
    const runes = Array.from({ length: 25 }, (_, i) => { const [x, y] = pt((i + .5) / 25, R * .84), r = (i + .5) / 25 * 360; return `<g class="ci-r" id="ci-r${i}" style="--i:${i}">${rune(i, x, y, P ? 1.6 : 2, 'g', r)}${rune(i, x, y, P ? 1.6 : 2, 'c', r)}</g>`; }).join('');
    const arcR = R * .765;
    const stones = Array.from({ length: 6 }, (_, i) => { const a = [.82, .75, .68, .32, .25, .18][i], [x, y] = pt(a, R * 1.2), w = P ? 24 : 28;
      return `<g class="ci-st" id="ci-s${i}" transform="translate(${f(cx + x)} ${f(cy + y)})"><circle r="44" class="h"/><path class="b" d="M${-w} -6L${-w * .6} ${-w * .9}L${w * .5} ${-w}L${w} -4L${w * .7} ${w * .8}L${-w * .5} ${w * .9}Z"/>${rune(i * 2 + 1, 0, 0, P ? 1.5 : 1.8, 'r')}</g>`; }).join('');
    // open books in a slow orbit round the circle (improvement over the proposal: they tie it to the tower's background)
    const book = s => `<circle r="${f(s * 2.4)}" fill="url(#spbk)"/><path d="M0 0Q${f(-s * .6)} ${f(-s * .3)} ${-s} ${f(-s * .1)}L${-s} ${f(s * .5)}Q${f(-s * .5)} ${f(s * .32)} 0 ${f(s * .6)}Q${f(s * .5)} ${f(s * .32)} ${s} ${f(s * .5)}L${s} ${f(-s * .1)}Q${f(s * .6)} ${f(-s * .3)} 0 0Z" class="pg"/><rect x="${f(-s * 1.05)}" y="${f(s * .45)}" width="${f(s * 2.1)}" height="${f(s * .18)}" class="cv"/>`;
    const books = Array.from({ length: 5 }, (_, i) => { const [x, y] = pt(i / 5, R * 1.45); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${i * 72})"><g class="ci-bk">${book(P ? 13 : 16)}</g></g>`; }).join('');
    const mist = Array.from({ length: 7 }, (_, i) => `<ellipse cx="${f(rnd(i, 21) * W)}" cy="${f(H * (.2 + rnd(i, 22) * .7))}" rx="${f(160 + rnd(i, 23) * 200)}" ry="${f(50 + rnd(i, 24) * 40)}"/>`).join('');
    return `${top}<div class="sp ci" role="timer"><svg class="sp-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${DEFS}
      <radialGradient id="ci-fl" cx=".5" cy="${f(cy / H)}" r=".8"><stop offset="0" stop-color="#191334"/><stop offset=".6" stop-color="#0d0a1d"/><stop offset="1" stop-color="#050409"/></radialGradient>
      <radialGradient id="ci-in"><stop offset="0" stop-color="#1c1540"/><stop offset="1" stop-color="#0e0b1f"/></radialGradient>
      <rect width="${W}" height="${H}" fill="url(#ci-fl)"/><path class="ci-slab" d="${slabs}"/>
      <g transform="translate(${cx} ${cy})"><circle class="ci-wave" r="${R}"/><circle class="ci-wave w2" r="${R}"/><circle class="ci-wave big" r="${R}"/>
        <circle r="${R + 40}" fill="url(#spbl)" class="ci-bloom"/><circle r="${R}" class="ci-bezel"/><circle r="${R * .96}" class="ci-in1"/>${ticks}${runes}
        <circle r="${arcR}" class="ci-track"/><circle r="${arcR}" class="ci-arcg" id="ci-arcg" pathLength="1" transform="rotate(-90)"/><circle r="${arcR}" class="ci-arc" id="ci-arc" pathLength="1" transform="rotate(-90)"/>
        <g id="ci-sp" class="ci-spark"><circle cy="${-arcR}" r="18" class="h"/><circle cy="${-arcR}" r="6"/></g>
        <circle r="${R * .72}" class="ci-in1"/><circle r="${R * .70}" class="ci-in2"/><circle r="${R * .62}" fill="url(#spbl)" class="ci-heart"/>
        <g class="ci-orbit">${books}</g></g>
      <g class="ci-mist" filter="url(#spgl)">${mist}</g>${stones}
      <text class="sp-time g" x="${cx}" y="${f(cy + fs * .3)}" font-size="${fs}" id="ci-tg"></text><text class="sp-time" x="${cx}" y="${f(cy + fs * .3)}" font-size="${fs}" id="ci-time"></text>
      <text class="sp-hold" x="${cx}" y="${f(cy - fs * .6)}">${t('sp_pause')}</text>
      <text class="sp-info" x="${cx}" y="${f(cy + fs * .3 + (P ? 50 : 60))}" id="ci-info"></text><text class="sp-task" x="${cx}" y="${f(cy + fs * .3 + (P ? 86 : 98))}" id="ci-task"></text>
      <text class="sp-no" x="${P ? 60 : 130}" y="${P ? 90 : 84}" id="ci-no"></text><text class="sp-date" x="${P ? 60 : 130}" y="${P ? 120 : 116}" id="ci-date"></text>
      ${seal(P ? cx : W - 290, P ? 1400 : 92, 320, 'ci-seal')}</svg></div>${dock}`;
  }
  function circleRender(ctx) {
    if (!C) return; const k = facts(ctx);
    $('ci-no').textContent = t('ci_no', { n: k.no }); $('ci-date').textContent = k.date;
    $('ci-time').textContent = k.clock; $('ci-tg').textContent = k.clock; $('ci-info').textContent = k.info; $('ci-task').textContent = ctx.title;
    for (let i = 0; i < 60; i++) $('ci-t' + i).classList.toggle('on', i / 60 < k.p);
    for (let i = 0; i < 25; i++) $('ci-r' + i).classList.toggle('on', (i + .5) / 25 < k.p);
    const d = `${k.p.toFixed(4)} 1`; $('ci-arc').style.strokeDasharray = d; $('ci-arcg').style.strokeDasharray = d;
    $('ci-sp').style.transform = `rotate(${f(k.p * 360)}deg)`;
    for (let i = 0; i < 6; i++) { const e = $('ci-s' + i); e.classList.toggle('on', i < Math.min(6, k.n)); e.classList.toggle('new', ctx.done && i === Math.min(6, k.n) - 1); }
    $('ci-seal').textContent = t('ci_seal', { n: k.last });
  }
  ML.deepStyles = Object.assign(ML.deepStyles || {}, {
    spell: { html: spellHtml, render: spellRender, doneMs: () => ML.reducedMotion() ? 4200 : 5600 },
    circle: { html: circleHtml, render: circleRender, doneMs: () => ML.reducedMotion() ? 4200 : 5600 },
  });

  // small pictures for the shop cards
  ML.sorcererDeepSvg = k => k === 'circle'
    ? `<svg viewBox="-60 -60 120 120" class="sp-prev" aria-hidden="true"><rect x="-60" y="-60" width="120" height="120" fill="#0d0a1d"/><circle r="44" fill="#16112f" stroke="#c9c3e8" stroke-width="2"/>${Array.from({ length: 12 }, (_, i) => { const [x, y] = pt(i / 12, 37); return rune(i, x, y, .7, i < 8 ? 'pv on' : 'pv', i * 30); }).join('')}<path d="M0 -30A30 30 0 1 1 -26 15" fill="none" stroke="#cbb6ff" stroke-width="2"/><circle cx="-26" cy="15" r="3" fill="#3ee8e0"/><text y="5" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-size="15" font-weight="600" fill="#f4eeff">07:00</text></svg>`
    : `<svg viewBox="-60 -60 120 120" class="sp-prev" aria-hidden="true"><rect x="-60" y="-60" width="120" height="120" fill="#0b0918"/><rect x="-52" y="-52" width="104" height="104" rx="3" fill="#13102a" stroke="#352d5e"/><circle r="34" fill="none" stroke="#a678ff" opacity=".3"/><text y="2" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-size="22" font-weight="600" fill="#f4eeff">07:00</text>${Array.from({ length: 9 }, (_, i) => rune(i, -40 + i * 10, 34, .55, i < 6 ? 'pv on' : 'pv')).join('')}</svg>`;
})();
