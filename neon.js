// Ville néon (Fired up, night world) dial 3.49, chosen from proposals/neon/neon.html (artifact 4bYXAyWE1CRfcF7xiuE34v), B2.
// The ring road: a circular motorway seen from above (asphalt, guard rails, LED edges, lane dashes), a minute scale
// 0–90 round it, four loop ramps inside like a real interchange, lamp posts for every five minutes. Traffic is time:
// pairs of headlights circle slowly; the part of the session already gone is dimmed under a dark band, and its lamp
// posts go out. A pink car with its headlight cone marks the minute. Six lane bars under the time, one per session of
// the day (LANES n/6). End of a session: a wave of light runs twice round the ring and every lamp flashes.
(() => {
  'use strict';
  const { S, on, today, dayKey } = ML;
  const root = document.documentElement, NS = 'http://www.w3.org/2000/svg';

  const isOn = () => root.dataset.theme === 'neoncity' && !root.dataset.light;
  const pt = (a, r) => [Math.sin(a * Math.PI / 180) * r, -Math.cos(a * Math.PI / 180) * r];
  const f1 = n => n.toFixed(1);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ln = (a, r0, r1) => { const [x0, y0] = pt(a, r0), [x1, y1] = pt(a, r1); return `M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}`; };
  const arcP = (r, a0, a1) => { const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r); return `M${f1(x0)} ${f1(y0)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`; };
  const R = 132, LANES = 6;

  function html(id) {
    const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(5);
    let s = `<defs><filter id="${id}t" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="${id}g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>`;
    s += `<circle r="170" class="nc-face"/>`;
    s += `<g class="nc-ticks">${Array.from({ length: 90 }, (_, i) => `<path class="${i % 5 ? '' : 'b'}" d="${ln(i * 4, 166, i % 5 ? 161 : 156)}"/>`).join('')}</g>`;
    s += `<g class="nc-num">${[1, 2, 3, 4, 5].map(k => { const [x, y] = pt(k * 60, 147); return `<text x="${f1(x)}" y="${f1(y + 3.5)}">${k * 15}</text>`; }).join('')}</g>`;
    // the loop ramps, inside at the diagonals
    for (const a of [45, 135, 225, 315]) { const [lx, ly] = pt(a, 98), [ax, ay] = pt(a - 11, 119), [bx, by] = pt(a + 11, 119);
      s += `<path class="nc-ramp" d="M${f1(ax)} ${f1(ay)}Q${f1(lx * 1.08)} ${f1(ly * 1.08)} ${f1(bx)} ${f1(by)}"/><circle class="nc-ramp" cx="${f1(lx)}" cy="${f1(ly)}" r="12"/>
        <circle class="nc-ro" cx="${f1(lx)}" cy="${f1(ly)}" r="15.3"/><circle class="nc-ri" cx="${f1(lx)}" cy="${f1(ly)}" r="8.7"/>`; }
    // the road
    s += `<circle class="nc-road" r="${R}"/><circle class="nc-rail" r="146"/><circle class="nc-rail" r="118"/>
      <circle class="nc-ledo" r="144.4" filter="url(#${id}t)"/><circle class="nc-ledi" r="119.6" filter="url(#${id}t)"/><circle class="nc-lane" r="${R}"/>`;
    // traffic: pairs of lights with a short trail, white heads on the inner lane, red tails on the outer one; the layer turns slowly
    let tr = '';
    for (let i = 0; i < 40; i++) { const a = rnd() * 360, inner = rnd() < .5, r0 = inner ? 126 : 138, trail = 4 + rnd() * 7, cls = inner ? 'w' : 'r';
      tr += `<path class="nc-tr ${cls}" d="${arcP(r0, a - trail, a)}"/>`;
      for (const d of [-2, 2]) { const [x, y] = pt(a, r0 + d); tr += `<circle class="nc-hl ${cls}" cx="${f1(x)}" cy="${f1(y)}" r="1.3"/>`; } }
    s += `<g class="nc-traffic" filter="url(#${id}t)">${tr}</g>`;
    // the part of the session already gone: a dark band over the traffic
    s += `<g transform="rotate(-90)"><circle class="nc-past" r="${R}" pathLength="1"/></g>`;
    s += `<g class="nc-lamps">${Array.from({ length: 18 }, (_, i) => { const [x, y] = pt((i + .5) * 20, 113); return `<g><circle class="h" cx="${f1(x)}" cy="${f1(y)}" r="5"/><circle cx="${f1(x)}" cy="${f1(y)}" r="1.6"/></g>`; }).join('')}</g>`;
    s += `<path class="nc-zero" d="M0 -146V-118" filter="url(#${id}t)"/>`;
    s += `<g class="nc-wave"><path class="g" d="${arcP(R, 0, 110)}" filter="url(#${id}g)"/><path class="c" d="${arcP(R, 20, 110)}"/></g>`;
    s += `<g class="nc-car"><g transform="translate(0 ${-R})"><path class="cone" d="M7 0L30 -9L30 9Z"/><rect x="-8" y="-3.5" width="16" height="7" rx="3" filter="url(#${id}t)"/><circle cx="7" cy="-2" r="1.2"/><circle cx="7" cy="2" r="1.2"/></g></g>`;
    s += `<g class="nc-bars">${Array.from({ length: LANES }, (_, i) => `<rect x="${-34 + i * 11.6}" y="50" width="8" height="3" rx="1.5"/>`).join('')}</g><text class="nc-lab" y="68"></text>`;
    return s;
  }
  function els(svg) {
    return svg._nc || (svg._nc = { ticks: [...svg.querySelectorAll('.nc-ticks path')], lamps: [...svg.querySelectorAll('.nc-lamps g')], past: svg.querySelector('.nc-past'),
      car: svg.querySelector('.nc-car'), bars: [...svg.querySelectorAll('.nc-bars rect')], lab: svg.querySelector('.nc-lab') });
  }
  function update(svg, p, n) {
    const e = els(svg);
    e.ticks.forEach((l, i) => l.classList.toggle('on', p > 0 && i / 90 < p));
    e.lamps.forEach((l, i) => l.classList.toggle('off', p > 0 && (i + .5) / 18 < p));
    e.past.style.strokeDasharray = `${p.toFixed(4)} 1`;
    e.car.style.transform = `rotate(${(p * 360).toFixed(2)}deg)`;
    e.bars.forEach((r, i) => r.classList.toggle('on', i < n));
    e.lab.textContent = `LANES ${n}/${LANES}`;
  }

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-176 -176 352 352'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('class', 'nc-dial');
  let built = false, lastKey = '';
  const progress = () => { const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot, started = rem < tot - .5 || (ML.running && ML.running());
    return started ? clamp(1 - Math.max(0, rem) / tot) : 0; };
  const count = () => { const td = today(); return Math.min(LANES, (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length); };
  function render() {
    const wrap = document.querySelector('#sigil-card .ring-wrap');
    if (!isOn() || !wrap) { if (svg.isConnected) svg.remove(); lastKey = ''; return; }
    if (!built) { built = true; svg.innerHTML = html('ncd'); svg._nc = null; lastKey = ''; }
    if (svg.parentNode !== wrap) wrap.prepend(svg);
    const p = progress(), n = count(), key = Math.round(p * 2000) + '|' + n;
    if (key === lastKey) return; lastKey = key;
    update(svg, p, n);
  }
  on('tick', render); on('timer', render); on('render', render); on('started', render); on('newday', render);
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light'] });

  // the end of a session: a wave of light twice round the ring, the lamps flash (CSS)
  let waveT = 0;
  on('session', s => {
    render();
    if (!isOn() || !s || s.mins < 1 || ML.reducedMotion()) return;
    svg.classList.remove('wave'); void svg.getBoundingClientRect(); svg.classList.add('wave');
    clearTimeout(waveT); waveT = setTimeout(() => svg.classList.remove('wave'), 2600);
  });
})();

// The city in tiers (3.49, background D2 of the proposals page), drawn on game.js's #fx canvas (ML.neonDraw).
// A city built on a hill above a river, seen from the far bank: towers on three depths, the slope covered with rows of
// houses, a switchback road, a cable car, a monorail running into a tower, the old tiered quarter on the river cliff
// (kept small and half lit, behind trees), a cable-stayed bridge, the whole city mirrored in the water.
// Live: one façade screen lights per session today (max 6, the newest over 3 s), with a slow wave; traffic on the
// bridge and up the road, beacons, the cable cars, a monorail every ~40 s and a boat every ~70 s at rest, two HUD tags
// at rest. During a session a dark veil falls, traffic thins and only the newest screen stays bright. End of a
// session: every screen plays the same wave and drones rise from the river into a ring.
// Shop variant « supercar » (600, equip.bgNeon): the same city seen from a rooftop car park, an 80s wedge supercar
// parked from behind facing it, tail-light bar lit at rest, dimmed during a session, flashing twice at the end.
// The still parts are painted once per size in two layers (behind and in front of the screens); a frame is two
// drawImage calls, the screens (scrolled pattern canvases) and a few small strokes.
(() => {
  'use strict';
  const { S, on, today, dayKey } = ML;
  const root = document.documentElement, TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seeded = s => () => { s = s + 0x6D2B79F5 | 0; let q = Math.imul(s ^ s >>> 15, 1 | s); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
  const canvasOf = (w, h, d) => { const c = document.createElement('canvas'); c.width = Math.ceil(w * d); c.height = Math.ceil(h * d); const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return [c, x]; };
  const rgba = (h, a) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
  const glow = (x, gx, gy, r, col, a) => { if (a <= .005 || r <= 0) return; const g = x.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.fillRect(gx - r, gy - r, r * 2, r * 2); };
  const line = (x, pts, col, w, a = 1, blur = 10) => { x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = col; x.shadowColor = col; x.shadowBlur = blur; x.globalAlpha = a; x.lineWidth = w;
    x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.stroke(); x.restore(); };
  const isOn = () => root.dataset.theme === 'neoncity' && !root.dataset.light;
  const modeOf = () => (S.econ && S.econ.equip && S.econ.equip.bgNeon === 'supercar' ? 'car' : 'city');
  const PALS = [['#ff3fa4', '#ffa34a'], ['#2de2ff', '#ff3fa4'], ['#ffa34a', '#ff5470'], ['#c77dff', '#2de2ff'], ['#48f5c4', '#2de2ff'], ['#ff5470', '#ffa34a']];

  function windows(x, R, px, py, w, h, dens, cw, ch) {
    const pal = ['#ffb36b', '#ffd9a0', '#7fe9ff', '#ff6fb8'];
    for (let yy = py + 4; yy < py + h - 3; yy += ch) for (let xx = px + 2; xx < px + w - 2; xx += cw) { if (R() > dens) continue; x.fillStyle = pal[(R() * 4) | 0]; x.globalAlpha = .35 + R() * .6; x.fillRect(xx, yy, cw * .55, ch * .5); }
    x.globalAlpha = 1;
  }

  // Paints the still city into `back` (sky, ridge, hill, towers) and `front` (slope, road, cable car, monorail tower,
  // old quarter, bridge, the water with the reflection, mist). Returns the geometry the live layer needs.
  function paintCity(W, H, d) {
    const R = seeded(31), hz = H * .64, sc = Math.min(1, W / 1080) * .5 + .5, hk = H / 720, g = { W, H, d, hz, sc, hk };
    let back, x; [back, x] = canvasOf(W, H, d);
    let gr = x.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, '#06020e'); gr.addColorStop(.55, '#1c0734'); gr.addColorStop(1, '#5c1552'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) { const cxp = R() * W, cy = H * (.06 + R() * .26), w = 120 + R() * 260; x.fillStyle = `rgba(255,70,170,${.03 + R() * .05})`; x.beginPath(); x.ellipse(cxp, cy, w * sc, 12 + R() * 18, 0, 0, TAU); x.fill(); }
    const hill = px => hz - H * (.30 * Math.exp(-((((px / W) - .38) / .2) ** 2)) + .12 * Math.exp(-((((px / W) - .85) / .14) ** 2)) + .05);
    const ridge = px => hz - H * (.2 + .05 * Math.sin(px / 90) + .03 * Math.sin(px / 31));
    x.fillStyle = '#1d0833'; x.beginPath(); x.moveTo(0, hz); for (let px = 0; px <= W; px += 10) x.lineTo(px, ridge(px)); x.lineTo(W, hz); x.fill();
    for (let px = 0; px < W; px += 5 + R() * 9) { const b = ridge(px), h = 8 + R() * 46; x.fillStyle = '#24093e'; x.fillRect(px, b - h, 4 + R() * 7, h + 4);
      if (R() < .5) { x.fillStyle = 'rgba(255,150,200,.35)'; x.fillRect(px + 1, b - h + R() * h, 1.5, 1.5); } }
    x.fillStyle = 'rgba(70,14,80,.35)'; x.fillRect(0, 0, W, hz);
    x.fillStyle = '#100419'; x.beginPath(); x.moveTo(0, hz); for (let px = 0; px <= W; px += 8) x.lineTo(px, hill(px)); x.lineTo(W, hz); x.fill();
    // towers in two rows (the back one hazier); some get a beacon, some a façade screen slot
    const cand = []; g.beacons = [];
    for (const row of [0, 1]) {
      for (let px = -10; px < W + 10;) { const w = ((row ? 18 : 12) + R() * (row ? 26 : 16)) * sc, base = hill(px + w / 2) + (row ? 26 : 6) + R() * 10, top = hz - hill(px + w / 2);
        const h = ((row ? 40 : 30) + R() * (row ? 150 : 110) * (.4 + top / (H * .4))) * hk, y = base - h;
        gr = x.createLinearGradient(px, 0, px + w, 0); gr.addColorStop(0, row ? '#1a0a2e' : '#170828'); gr.addColorStop(1, row ? '#0c0416' : '#0e0519'); x.fillStyle = gr; x.fillRect(px, y, w, hz - y);
        windows(x, R, px, y, w, h, row ? .2 : .14, row ? 3.4 : 2.6, row ? 5 : 4);
        const crown = R();
        if (crown < .3) { x.fillStyle = '#0c0416'; const ah = 18 + R() * 20; x.fillRect(px + w * .4, y - ah, 1.5, ah + 4); g.beacons.push({ x: px + w * .4, y: y - ah, p: R() * TAU }); }
        else if (crown < .5) { x.fillStyle = gr; x.beginPath(); x.moveTo(px, y); x.lineTo(px + w, y - w * .6); x.lineTo(px + w, y); x.fill(); }
        else if (crown < .65) { x.fillRect(px + w * .2, y - 10, w * .6, 10); }
        if (row && R() < .35) line(x, [[px + .5, y + 4], [px + .5, base]], R() < .5 ? '#ff3fa4' : '#2de2ff', 1, .55, 6);
        if (row && w > 22 && h > 100 * hk && px > W * .3 && px < W * .97) cand.push({ x: px, y, w, h });
        px += w + (row ? 3 : 1) + R() * 6; }
      if (!row) { x.fillStyle = 'rgba(60,12,74,.32)'; x.fillRect(0, 0, W, hz); }
    }
    // up to six screens, spread along the skyline
    const hill2 = px => hz - (hz - hill(px)) * .68 + Math.sin(px / 23) * 3;
    g.screens = []; const step = Math.max(1, cand.length / 6);
    for (let i = 0; i < 6 && Math.floor(i * step) < cand.length; i++) { const c = cand[Math.floor(i * step + step / 2) % cand.length] || cand[Math.floor(i * step)];
      if (g.screens.includes(c)) continue; const bot = Math.min(c.y + c.h * .8, hill2(c.x + c.w / 2) - 2); if (bot - c.y < 30 * hk) continue; c.bot = bot; g.screens.push(c); }
    g.screens.forEach((s, i) => { s.pal = PALS[i % PALS.length]; s.pat = pattern(s, s.pal, false, d); s.end = pattern(s, ['#ff3fa4', '#ffa34a'], true, d); });
    // --- the front layer
    let front; [front, x] = canvasOf(W, H, d);
    const rowH = 6 * hk;
    x.fillStyle = '#0d0416'; x.beginPath(); x.moveTo(0, hz); for (let px = 0; px <= W; px += 6) x.lineTo(px, hill2(px)); x.lineTo(W, hz); x.fill();
    for (let y = H * .3; y < hz; y += rowH) for (let px = 0; px < W;) { const w = (6 + R() * 9) * sc;
      if (y > hill2(px + w / 2) + 4) { x.fillStyle = ['#1b0b28', '#170824', '#22102f'][(R() * 3) | 0]; x.fillRect(px, y - rowH + 1, w - 1, rowH);
        if (R() < .3) { x.fillStyle = R() < .7 ? 'rgba(255,190,120,.55)' : 'rgba(255,120,190,.5)'; x.fillRect(px + 1 + R() * (w - 4), y - rowH * .6, 1.6, 1.6); } }
      px += w; }
    // the switchback road (its traffic is live)
    g.road = []; for (let k = 0, y = hz - 6; k < 7; k++, y -= H * .024) { const px = k % 2 ? W * .47 : W * .28; g.road.push([px, Math.max(y, hill2(px) + 8)]); }
    x.strokeStyle = '#07020c'; x.lineWidth = 4; x.lineJoin = 'round'; x.beginPath(); g.road.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.stroke();
    for (let i = 0; i < g.road.length - 1; i++) for (let k = 1; k < 3; k++) { const px = g.road[i][0] + (g.road[i + 1][0] - g.road[i][0]) * k / 3, py = g.road[i][1] + (g.road[i + 1][1] - g.road[i][1]) * k / 3 - 3; glow(x, px, py, 4, '#ffb050', .5); }
    g.roadLen = g.road.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - g.road[i][0], p[1] - g.road[i][1]), 0);
    // the cable car line and its pylons (the cabins are live)
    g.ca = [W * .16, hz - H * .03]; g.cb = [W * .6, hill2(W * .6) + 2];
    x.strokeStyle = 'rgba(220,200,240,.45)'; x.lineWidth = .9; x.beginPath(); x.moveTo(...g.ca); x.lineTo(...g.cb); x.moveTo(g.ca[0], g.ca[1] + 3); x.lineTo(g.cb[0], g.cb[1] + 3); x.stroke();
    for (const [px, py] of [g.ca, g.cb]) { x.fillStyle = '#1a1026'; x.fillRect(px - 3, py, 6, hz - py); }
    // the monorail tower and track
    const mx = W * .47, my = H * .5, tw = 54 * sc, th = 190 * hk; g.mono = { mx, my, tw, th };
    g.T = [[W * 1.02, H * .47], [W * .82, H * .5], [W * .64, H * .5], [mx + tw - 8, my + 8]];
    const B = u => [0, 1].map(k => (1 - u) ** 3 * g.T[0][k] + 3 * (1 - u) ** 2 * u * g.T[1][k] + 3 * (1 - u) * u * u * g.T[2][k] + u ** 3 * g.T[3][k]); g.B = B;
    x.fillStyle = '#0e0518'; x.fillRect(mx - 8, my - th + 40, tw, hz - (my - th + 40)); windows(x, R, mx - 8, my - th + 40, tw, th, .2, 3.4, 5);
    x.strokeStyle = '#1f1030'; x.lineWidth = 6; x.beginPath(); for (let i = 0; i <= 30; i++) { const [px, py] = B(i / 30); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
    for (let i = 1; i < 6; i++) { const [px, py] = B(i / 6); x.fillStyle = '#150a22'; x.fillRect(px - 3, py, 6, hz - py); }
    line(x, Array.from({ length: 31 }, (_, i) => { const [px, py] = B(i / 30); return [px, py + 4]; }), '#2de2ff', 1, .5, 6);
    glow(x, mx + tw - 8, my + 2, 34, '#ffc070', .5); x.fillStyle = '#ffe3b5'; x.fillRect(mx + tw - 24, my - 8, 16, 16);
    // the old tiered quarter: small, low, half lit, behind trees
    x.fillStyle = '#0a0310'; x.beginPath(); x.moveTo(0, hz); x.lineTo(0, H * .5); x.lineTo(W * .08, H * .51); x.lineTo(W * .22, H * .545); x.lineTo(W * .3, H * .59); x.lineTo(W * .33, hz); x.fill();
    for (let tier = 0; tier < 4; tier++) { const y = H * (.52 + tier * .03), x0 = W * (.005 + tier * .012), x1 = W * (.2 + tier * .022), hh = H * .022;
      x.fillStyle = '#150811'; x.fillRect(x0, y, x1 - x0, hh);
      for (let px = x0 + 4; px < x1 - 6; px += 8) { if (R() < .5) continue; x.fillStyle = rgba('#ffb35a', .16 + R() * .26); x.fillRect(px, y + hh * .4, 4, hh * .45); }
      x.fillStyle = '#07020c'; x.beginPath(); x.moveTo(x0 - 7, y - 3); x.quadraticCurveTo(x0, y + 1.5, x0 + 10, y + 1); x.lineTo(x1 - 10, y + 1); x.quadraticCurveTo(x1, y + 1.5, x1 + 7, y - 3); x.lineTo(x1 + 4, y + 3); x.lineTo(x0 - 4, y + 3); x.fill();
      line(x, [[x0 - 7, y - 3], [x0 + 10, y + 1], [x1 - 10, y + 1], [x1 + 7, y - 3]], '#ffbe6a', .7, .3, 3); }
    for (let k = 0; k < 14; k++) { const px = W * (k * .026), py = hz - H * (.012 + R() * .03), rad = H * (.02 + R() * .018);
      x.fillStyle = '#06010a'; for (const [dx, dy, m] of [[0, 0, 1], [-rad * .7, rad * .3, .75], [rad * .7, rad * .25, .8]]) { x.beginPath(); x.arc(px + dx, py + dy, rad * m, 0, TAU); x.fill(); }
      x.strokeStyle = 'rgba(255,140,200,.13)'; x.lineWidth = 1; x.beginPath(); x.arc(px, py, rad, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
    // the cable-stayed bridge (its traffic is live)
    const dy = H * .6, top = H * .27; g.deck = dy; g.pylons = [W * .5, W * .8]; g.ptop = top;
    x.strokeStyle = 'rgba(255,220,240,.22)'; x.lineWidth = .8;
    for (const px of g.pylons) for (let k = 1; k <= 9; k++) for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(px, top + k * 5); x.lineTo(px + sd * k * W * .016, dy); x.stroke(); }
    for (const px of g.pylons) { x.fillStyle = '#140a20'; x.beginPath(); x.moveTo(px - 12, dy + 30); x.lineTo(px - 2, top); x.lineTo(px + 2, top); x.lineTo(px + 12, dy + 30); x.lineTo(px + 7, dy + 30); x.lineTo(px, top + 30); x.lineTo(px - 7, dy + 30); x.fill();
      line(x, [[px - 12, dy + 30], [px - 2, top], [px + 2, top], [px + 12, dy + 30]], '#ff3fa4', 1, .6, 8); }
    x.fillStyle = '#120820'; x.fillRect(W * .3, dy, W * .72, 9); line(x, [[W * .3, dy + 9], [W, dy + 9]], '#2de2ff', 1.2, .7, 8);
    for (let px = W * .3; px < W; px += 60 * sc) { x.fillStyle = '#150a22'; x.fillRect(px, dy + 9, 7, hz - dy); }
    // the water: both layers mirrored, squashed and blurred, then ripples and a mist band
    x.save(); x.beginPath(); x.rect(0, hz, W, H - hz); x.clip(); x.globalAlpha = .55; x.filter = 'blur(2.5px)'; x.translate(0, hz * 1.72); x.scale(1, -.72);
    x.drawImage(back, 0, 0, back.width, hz * d, 0, 0, W, hz); x.drawImage(front, 0, 0, front.width, hz * d, 0, 0, W, hz); x.restore();
    gr = x.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, 'rgba(10,3,22,.15)'); gr.addColorStop(1, 'rgba(4,1,10,.85)'); x.fillStyle = gr; x.fillRect(0, hz, W, H - hz);
    x.fillStyle = 'rgba(6,2,14,.55)'; for (let y = hz + 2; y < H; y += 2 + (y - hz) / 40) x.fillRect(R() * W * .2 - 40, y, W * (.4 + R() * .8), 1 + (y - hz) / 120);
    gr = x.createLinearGradient(0, hz - 18, 0, hz + 30); gr.addColorStop(0, 'rgba(150,50,140,0)'); gr.addColorStop(.45, 'rgba(150,50,140,.2)'); gr.addColorStop(1, 'rgba(150,50,140,0)'); x.fillStyle = gr; x.fillRect(0, hz - 18, W, 48);
    g.back = back; g.front = front;
    return g;
  }
  // a façade screen's pattern: one canvas taller than the screen by a period, scrolled to make the wave move
  function pattern(s, pal, diag, d) {
    const per = 88, w = Math.ceil(s.w), h = Math.ceil(s.bot - s.y) + per, [c, x] = canvasOf(w, h, d);
    for (let yy = 6; yy < h; yy += 3) for (let xx = 2; xx < w - 2; xx += 3) { const v = .5 + .5 * Math.sin(diag ? (xx / 22 - yy * TAU / per) : (yy * TAU / per + xx / 9)); x.fillStyle = v > .5 ? pal[0] : pal[1]; x.globalAlpha = .25 + .7 * v; x.fillRect(xx, yy, 2, 2); }
    c._per = per; return c;
  }

  // the rooftop car park and the car, for the supercar variant (painted once)
  function paintCar(g) {
    const { W, H, d } = g, [c, x] = canvasOf(W, H, d), deck = H * .6, R = seeded(12);
    x.fillStyle = '#0a0410'; x.fillRect(0, deck, W, H - deck);
    x.fillStyle = 'rgba(160,220,255,.05)'; x.fillRect(0, deck - 34, W, 34);
    for (let px = 0; px < W; px += 60) { x.fillStyle = '#1a1024'; x.fillRect(px, deck - 36, 3, 36); }
    line(x, [[0, deck - 36], [W, deck - 36]], '#ff3fa4', 1.4, .75, 10); line(x, [[0, deck], [W, deck]], '#2de2ff', 1, .55, 8);
    x.save(); x.beginPath(); x.rect(0, deck, W, H - deck); x.clip(); x.globalAlpha = .3; x.filter = 'blur(3px)'; x.translate(0, deck * 2); x.scale(1, -1);
    for (const l of [g.back, g.front]) x.drawImage(l, 0, (deck - H * .3 + H * .12) * d, W * d, H * .3 * d, 0, deck - H * .3, W, H * .3); x.restore();
    const VX = W * .5; x.strokeStyle = 'rgba(230,220,240,.22)'; x.lineWidth = 2;
    for (const k of [-3, -1, 1, 3]) { x.beginPath(); x.moveTo(VX + k * W * .06, deck + 4); x.lineTo(VX + k * W * .22, H); x.stroke(); }
    x.fillStyle = 'rgba(20,8,30,.6)'; for (let k = 0; k < 10; k++) { x.beginPath(); x.ellipse(R() * W, deck + 30 + R() * (H - deck - 40), 30 + R() * 60, 4 + R() * 6, 0, 0, TAU); x.fill(); }
    x.fillStyle = '#120a1c'; x.fillRect(W * .9, H * .3, 5, deck - H * .3 + 60); x.fillRect(W * .87, H * .3, 30, 4);
    const narrow = W < 700, w = narrow ? W * .86 : Math.min(W * .44, H * .9), cxp = W * (narrow ? .5 : .48), gy = H * (narrow ? .9 : .95); g.car = { x: cxp, gy, w, deck };
    car(x, cxp, gy, w);
    return c;
  }
  function car(x, cxp, gy, u) { // an 80s wedge supercar seen from behind, tail lights off (they are lit live)
    const L = (dx, dy) => [cxp + dx * u, gy - dy * u], poly = (pts, fill) => { x.fillStyle = fill; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(...L(...p)) : x.moveTo(...L(...p))); x.closePath(); x.fill(); };
    x.fillStyle = 'rgba(0,0,0,.7)'; x.beginPath(); x.ellipse(cxp, gy, .6 * u, .045 * u, 0, 0, TAU); x.fill();
    for (const sd of [-1, 1]) { poly([[sd * .5, 0], [sd * .34, 0], [sd * .34, .15], [sd * .5, .15]], '#040206'); x.strokeStyle = 'rgba(120,100,140,.25)'; x.lineWidth = 1;
      for (let k = 1; k < 5; k++) { const [ax, ay] = L(sd * .5, k * .03), [bx] = L(sd * .34, 0); x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, ay); x.stroke(); } }
    poly([[-.47, .045], [.47, .045], [.5, .13], [-.5, .13]], '#100510');
    x.strokeStyle = 'rgba(80,60,100,.6)'; for (let k = -4; k <= 4; k++) { const [ax, ay] = L(k * .045, .05), [, by] = L(0, .12); x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax, by); x.stroke(); }
    for (const dx of [-.15, -.09, .09, .15]) { const [px, py] = L(dx, .075); x.fillStyle = '#2a2228'; x.beginPath(); x.arc(px, py, .017 * u, 0, TAU); x.fill(); x.strokeStyle = '#a090a4'; x.lineWidth = 1.2; x.stroke(); x.fillStyle = '#050206'; x.beginPath(); x.arc(px, py, .01 * u, 0, TAU); x.fill(); }
    let gr = x.createLinearGradient(0, gy - .22 * u, 0, gy - .13 * u); gr.addColorStop(0, '#4a0e2a'); gr.addColorStop(1, '#1c0610');
    poly([[-.5, .13], [.5, .13], [.52, .17], [.49, .22], [-.49, .22], [-.52, .17]], gr);
    const [bx0, by0] = L(-.47, .205), bw = .94 * u, bh = .04 * u; x.fillStyle = '#5a0c18'; x.fillRect(bx0, by0, bw, bh);
    x.fillStyle = '#12040a'; for (let k = 1; k < 5; k++) x.fillRect(bx0, by0 + k * bh / 5, bw, 1);
    const [c0] = L(-.1, 0); x.fillRect(c0, by0 - 1, .2 * u, bh + 2);
    const [px0, py0] = L(-.07, .158); x.fillStyle = 'rgba(214,204,214,.6)'; x.fillRect(px0, py0, .14 * u, .03 * u);
    poly([[-.49, .22], [.49, .22], [.34, .275], [-.34, .275]], '#16050f');
    x.strokeStyle = 'rgba(255,90,170,.28)'; x.lineWidth = 1; for (let k = 1; k < 7; k++) { const v = .22 + k * .0078, s = .49 - k * .021, [ax, ay] = L(-s, v), [bx2] = L(s, v); x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx2, ay); x.stroke(); }
    gr = x.createLinearGradient(0, gy - .335 * u, 0, gy - .275 * u); gr.addColorStop(0, '#180828'); gr.addColorStop(1, '#7a1a5a');
    poly([[-.26, .275], [.26, .275], [.17, .335], [-.17, .335]], gr);
    for (const [dx, col] of [[-.2, '#ff8fd0'], [.05, '#2de2ff']]) line(x, [L(dx, .33), L(dx + .06, .28)], col, 1.6, .7, 6);
    poly([[-.17, .335], [.17, .335], [.15, .345], [-.15, .345]], '#22081a');
    for (const sd of [-1, 1]) poly([[sd * .29, .23], [sd * .31, .23], [sd * .31, .3], [sd * .29, .3]], '#160610');
    poly([[-.53, .298], [.53, .298], [.52, .316], [-.52, .316]], '#260a1c');
    line(x, [L(-.52, .316), L(.52, .316)], '#ff3fa4', 1.2, .7, 8); line(x, [L(-.49, .222), L(.49, .222)], '#ff3fa4', .8, .45, 6);
    line(x, [L(-.52, .17), L(-.49, .215)], '#2de2ff', 1, .5, 6); line(x, [L(.52, .17), L(.49, .215)], '#2de2ff', 1, .5, 6);
  }

  let key0 = '', pend = '', pendAt = 0, geo = null, carC = null, fk = 0, lastNow = 0, flow = 0, endAt = -Infinity;
  let lastCount = -Infinity, lit = -1, litAt = [], train = null, nextTrain = 0, boat = null, nextBoat = 0, drops = [];
  on('session', s => { lastCount = -Infinity; if (isOn() && s && s.mins >= 1 && !ML.reducedMotion()) endAt = performance.now(); });
  let testN = -1; // for testing: ML.neonEnd(n) shows n screens lit and plays the end of a session
  ML.neonEnd = n => { testN = n == null ? -1 : n; lastCount = -Infinity; endAt = performance.now(); };

  function build(W, H, mode) {
    const d = Math.min(2, devicePixelRatio || 1);
    geo = paintCity(W, H, d); geo.mode = mode; geo.oy = mode === 'car' ? -H * .12 : 0;
    carC = mode === 'car' ? paintCar(geo) : null;
    const R = seeded(7); drops = Array.from({ length: 70 }, () => ({ x: R() * W, y: R() * H, v: 5 + R() * 4, l: 6 + R() * 6 }));
    lastCount = -Infinity; lit = -1;
  }

  // live parts of the city (screens, traffic, beacons, cabins, train, boat, drones, tags), drawn in city coordinates
  function liveCity(cx, g, now, still, rest, n, endK) {
    const { W, H, hz, sc } = g, calm = 1 - .7 * fk, time = still ? 0 : now;
    // screens behind the front layer
    cx.drawImage(g.back, 0, 0, W, H);
    g.screens.forEach((s, i) => { const o = endK > 0 ? Math.max(still ? (litAt[i] <= now ? 1 : 0) : clamp((now - litAt[i]) / 3000), endK) : still ? (litAt[i] <= now ? 1 : 0) : clamp((now - litAt[i]) / 3000);
      if (!(o > 0)) return; const a = o * (i === n - 1 || endK > 0 ? 1 : calm), pat = endK > .05 ? s.end : s.pat, off = still ? 0 : (time / 90) % pat._per, h = s.bot - s.y;
      glow(cx, s.x + s.w / 2, s.y + h * .5, s.w * 2.2, s.pal[0], .22 * a);
      cx.globalAlpha = a; cx.drawImage(pat, 0, (pat._per - off) * g.d, s.w * g.d, h * g.d, s.x, s.y, s.w, h); cx.globalAlpha = 1;
      const rg = cx.createLinearGradient(0, hz, 0, hz + H * .22); rg.addColorStop(0, rgba(s.pal[0], .16 * a)); rg.addColorStop(1, rgba(s.pal[0], 0)); cx.fillStyle = rg; cx.fillRect(s.x, hz + 2, s.w, H * .22); });
    cx.drawImage(g.front, 0, 0, W, H);
    // beacons blink slowly
    for (const b of g.beacons) { const on = still ? 1 : (Math.sin(time * .0025 + b.p) > .2 ? 1 : .2); glow(cx, b.x, b.y, 6, '#ff3355', .8 * on * (1 - .4 * fk)); }
    for (const px of g.pylons) glow(cx, px, g.ptop - 4, 8, '#ff3355', .9 * (still ? 1 : .6 + .4 * Math.sin(time / 900 + px)));
    // bridge traffic: white heads going left on the upper lane, red tails going right on the lower one
    const nCars = Math.round((still ? 20 : 26) * (1 - .75 * fk)), span = W * .72, x0 = W * .3;
    for (let k = 0; k < nCars; k++) { const up = k % 2 === 0, base = (k * 0.6180339887) % 1, l = (14 + (k * 37 % 40)) * sc, v = up ? -1 : 1;
      const px = x0 + (((base + v * flow * (1 + (k % 3) * .2) / span) % 1) + 1) % 1 * span, py = g.deck + (up ? 2.5 : 6);
      cx.fillStyle = up ? 'rgba(255,241,220,.85)' : 'rgba(255,51,85,.85)'; cx.fillRect(px, py - .8, l, 1.6); glow(cx, up ? px : px + l, py, 4, up ? '#fff1dc' : '#ff3355', .6); }
    // the switchback road: a few cars climbing and going down
    const nr = Math.round(10 * (1 - .7 * fk));
    for (let k = 0; k < nr; k++) { const upward = k % 2 === 0, base = (k * .381966) % 1; let s = ((base + (upward ? 1 : -1) * flow / (g.roadLen * 1.6)) % 1 + 1) % 1; s *= g.roadLen;
      let i = 0; while (i < g.road.length - 2 && s > Math.hypot(g.road[i + 1][0] - g.road[i][0], g.road[i + 1][1] - g.road[i][1])) { s -= Math.hypot(g.road[i + 1][0] - g.road[i][0], g.road[i + 1][1] - g.road[i][1]); i++; }
      const [ax, ay] = g.road[i], [bx, by] = g.road[i + 1], seg = Math.hypot(bx - ax, by - ay), q = clamp(s / seg), px = ax + (bx - ax) * q, py = ay + (by - ay) * q + (upward ? -1 : 1);
      glow(cx, px, py, 3.5, upward ? '#fff1dc' : '#ff3355', .9); }
    // cable cabins going back and forth
    for (const ph of [0, .5]) { const u = still ? (ph ? .72 : .3) : .5 + .45 * Math.sin(time / 26000 * TAU + ph * TAU), px = g.ca[0] + (g.cb[0] - g.ca[0]) * u, py = g.ca[1] + (g.cb[1] - g.ca[1]) * u;
      cx.strokeStyle = '#2a1c36'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(px, py); cx.lineTo(px, py + 7); cx.stroke(); cx.fillStyle = '#2a1c36'; cx.fillRect(px - 7, py + 7, 14, 9);
      cx.fillStyle = '#ffd59a'; cx.fillRect(px - 5, py + 9, 10, 3.5); glow(cx, px, py + 11, 14, '#ffb36b', .35 * calm); }
    // the monorail: a train every ~40 s at rest, running into the tower
    if (rest && !train && now > nextTrain) { if (nextTrain) train = { t0: now }; nextTrain = now + 34000 + Math.random() * 14000; }
    const trainAt = still ? .82 : train ? (now - train.t0) / 14000 : -1;
    if (trainAt >= 0) { for (let k = 0; k < 4; k++) { const u = trainAt * 1.1 - k * .04; if (u < 0 || u > .97) continue; const [px, py] = g.B(u), [qx, qy] = g.B(Math.min(1, u + .01)), ang = Math.atan2(qy - py, qx - px);
        cx.save(); cx.translate(px, py); cx.rotate(ang); cx.fillStyle = '#4a4060'; cx.fillRect(-15, -10, 28, 9); cx.fillStyle = '#ffeec8'; for (let j = 0; j < 4; j++) cx.fillRect(-12 + j * 6.4, -8, 4, 3);
        if (!k) { cx.fillStyle = '#2de2ff'; cx.fillRect(-15, -10, 3, 9); } cx.restore(); }
      if (train && trainAt > 1.3) train = null; }
    // a boat crossing the river now and then at rest
    if (rest && !boat && now > nextBoat) { if (nextBoat) boat = { t0: now }; nextBoat = now + 60000 + Math.random() * 30000; }
    const bu = still ? .6 : boat ? (now - boat.t0) / 50000 : -1;
    if (bu >= 0 && g.mode !== 'car') { const k = sc, bx = -80 + bu * (W + 160), by = H * .82;
      cx.globalAlpha = still ? 1 : clamp(Math.min(bu, 1 - bu) * 12); cx.fillStyle = '#1a0c22'; cx.beginPath(); cx.moveTo(bx - 70 * k, by); cx.lineTo(bx + 76 * k, by); cx.lineTo(bx + 64 * k, by + 12); cx.lineTo(bx - 64 * k, by + 12); cx.fill();
      cx.fillStyle = '#26142e'; cx.fillRect(bx - 50 * k, by - 16, 100 * k, 16); cx.fillRect(bx - 34 * k, by - 26, 64 * k, 10);
      for (let j = 0; j < 14; j++) { cx.fillStyle = j % 3 ? '#ffd090' : '#ff7fc4'; cx.fillRect(bx - 46 * k + j * 7 * k, by - 12, 4 * k, 4); }
      glow(cx, bx, by + 6, 120 * k, '#ffb36b', .18); cx.globalAlpha = 1; if (boat && bu > 1) boat = null; }
    // the end of a session: drones rise from the river and form a ring
    if (endK > 0) { const ox = W * .64, oy = H * .27, rx = W * .13, ry = H * .09, e = 1 - endK, rise = clamp(e * 2.2), fade = clamp(endK * 4);
      for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, tx = ox + Math.cos(a) * rx, ty = oy + Math.sin(a) * ry, sx = ox + (i / 64 - .5) * rx * 2.6, sy = hz - 4;
        const ease = 1 - Math.pow(1 - rise, 3), px = sx + (tx - sx) * ease, py = sy + (ty - sy) * ease; glow(cx, px, py, 5, i % 2 ? '#2de2ff' : '#ff8fd0', .7 * fade);
        cx.globalAlpha = fade; cx.fillStyle = '#fff'; cx.fillRect(px - .8, py - .8, 1.6, 1.6); cx.globalAlpha = 1; } }
    // HUD tags at rest (they fade out during a session)
    const ta = (1 - fk) * (rest || still ? 1 : 0); if (ta > .02 && g.mode !== 'car') { const m = g.mono; hud(cx, m.mx - 10, m.my - m.th + 36, m.tw + 4, m.th - 20, 'T-07 · 412 M', ta); hud(cx, W * .27, hz - H * .19, W * .21, H * .17, 'ROUTE 9', ta * .8); }
  }
  function hud(cx, x, y, w, h, label, a) { // corner brackets and a small tag, like Netrunner's overlay
    cx.save(); cx.globalAlpha = a; cx.strokeStyle = '#2de2ff'; cx.lineWidth = 1; const k = 7; cx.beginPath();
    for (const [px, py, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { cx.moveTo(px + sx * k, py); cx.lineTo(px, py); cx.lineTo(px, py + sy * k); } cx.stroke();
    cx.font = '600 10px "JetBrains Mono", monospace'; const tw = cx.measureText(label).width + 8, lx = x + w + 6 + tw > geo.W ? x - tw - 6 : x + w + 6;
    cx.fillStyle = 'rgba(4,10,18,.75)'; cx.fillRect(lx, y - 2, tw, 14); cx.fillStyle = '#2de2ff'; cx.fillText(label, lx + 4, y + 9); cx.restore();
  }

  ML.neonDraw = (cx, W, H, slow, still, now, tm, rest) => {
    const dt = clamp((now - (lastNow || now)) / 16.7, 0, 4); lastNow = now;
    if (!(W > 0 && H > 0)) return true; // a canvas without a size yet
    const mode = modeOf(), k = W + 'x' + H + mode;
    if (k !== key0) { if (k !== pend) { pend = k; pendAt = now; } if (!geo || geo.mode !== mode || now - pendAt > 350) { key0 = k; pend = ''; build(W, H, mode); } }
    flow += still ? 0 : dt * Math.max(.3, slow) * .9;
    if (typeof cx === 'function') return true; // a skipped frame (game.js paints at ~30 fps)
    const g = geo, target = root.dataset.timer === 'running' ? 1 : 0; fk = still ? target : fk + (target - fk) * .02;
    const endK = still ? 0 : clamp(1 - (now - endAt) / 7000);
    if (now - lastCount > 30000) { lastCount = now; const td = today(), n = testN >= 0 ? testN : Math.min(6, (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length);
      for (let i = 0; i < 6; i++) litAt[i] = i >= n ? Infinity : lit < 0 || i < lit ? (lit < 0 ? -Infinity : litAt[i]) : now + (i - lit) * 1500; lit = n; }
    if (g.oy) { cx.save(); cx.translate(0, g.oy); }
    liveCity(cx, g, now, still, rest, lit, endK);
    if (g.oy) cx.restore();
    if (fk > .01) { cx.fillStyle = `rgba(5,2,12,${(.3 * fk).toFixed(3)})`; cx.fillRect(0, 0, W, H); }
    if (g.mode === 'car') {
      cx.drawImage(carC, 0, 0, W, H);
      // tail lights: lit at rest, dimmed during a session, two flashes at the end
      const c = g.car, u = c.w, flash = endK > 0 ? (Math.sin((1 - endK) * 7000 / 260) > 0 ? 1 : .4) * (endK > .6 ? 1 : 0) : 0, tail = Math.max(1 - .65 * fk, flash);
      const bx0 = c.x - .47 * u, by0 = c.gy - .205 * u, bw = .94 * u, bh = .04 * u;
      cx.save(); cx.shadowColor = '#ff2a3a'; cx.shadowBlur = 24 * tail; cx.globalAlpha = .3 + .7 * tail; cx.fillStyle = '#ff2a3a'; cx.fillRect(bx0, by0, bw, bh); cx.restore();
      cx.fillStyle = `rgba(255,200,200,${(.5 * tail).toFixed(3)})`; cx.fillRect(bx0, by0 + bh * .35, bw, bh * .2);
      cx.fillStyle = '#12040a'; for (let i = 1; i < 5; i++) cx.fillRect(bx0, by0 + i * bh / 5, bw, 1); cx.fillRect(c.x - .1 * u, by0 - 1, .2 * u, bh + 2);
      glow(cx, c.x, by0 + bh / 2, .62 * u, '#ff2a3a', .22 * tail);
      const rg = cx.createLinearGradient(0, c.gy, 0, c.gy + .3 * u); rg.addColorStop(0, `rgba(255,40,60,${(.14 * tail).toFixed(3)})`); rg.addColorStop(1, 'rgba(255,40,60,0)'); cx.fillStyle = rg; cx.fillRect(c.x - .4 * u, c.gy + 2, .8 * u, .18 * u);
      // idle exhaust vapour at rest, a fine drizzle
      if (rest && !still) for (const dx of [-.12, .12]) for (let i = 0; i < 4; i++) { const ph = ((now / 2400 + i / 4 + dx) % 1), px = c.x + dx * u + ph * 14, py = c.gy - .075 * u + ph * -30;
        cx.fillStyle = `rgba(230,220,240,${(.06 * (1 - ph)).toFixed(3)})`; cx.beginPath(); cx.arc(px, py, 5 + ph * 16, 0, TAU); cx.fill(); }
      if (!still && fk < .9) { cx.strokeStyle = `rgba(205,185,255,${(.16 * (1 - fk)).toFixed(3)})`; cx.lineWidth = 1; cx.beginPath();
        for (const r of drops) { r.y += r.v * dt * Math.max(.3, slow); r.x -= r.v * dt * .2; if (r.y > H) { r.y = -10; r.x = Math.random() * W * 1.1; } cx.moveTo(r.x, r.y); cx.lineTo(r.x - r.l * .2, r.y + r.l); } cx.stroke(); }
    }
    return true;
  };

  ML.addStrings({
    fr: { dial_city: 'Ville en étages', dial_city_d: 'Ville néon · fond : la ville sur la colline, au bord du fleuve.',
      dial_supercar: 'Belvédère', dial_supercar_d: 'Ville néon · fond : une supercar des années 80 garée sur un toit, face à la ville.' },
    en: { dial_city: 'Hill city', dial_city_d: 'Neon city · background: the city on the hill, by the river.',
      dial_supercar: 'Overlook', dial_supercar_d: 'Neon city · background: an 80s supercar parked on a rooftop, facing the city.' },
  });

  // small pictures for the shop cards (painted once, at rest)
  const pics = {};
  ML.neonShopPic = k => {
    if (!pics[k]) { try { const W = 240, H = 160, d = 1, g = paintCity(W, H, d); g.mode = k === 'supercar' ? 'car' : 'city'; g.oy = g.mode === 'car' ? -H * .12 : 0;
      const [c, x] = canvasOf(W, H, d); const saved = geo; geo = g; litAt = [-Infinity, -Infinity, -Infinity, Infinity, Infinity, Infinity];
      if (g.oy) { x.save(); x.translate(0, g.oy); } liveCity(x, g, 0, true, false, 3, 0); if (g.oy) x.restore();
      if (g.mode === 'car') { x.drawImage(paintCar(g), 0, 0, W, H); const cr = g.car; x.fillStyle = '#ff2a3a'; x.shadowColor = '#ff2a3a'; x.shadowBlur = 10; x.fillRect(cr.x - .47 * cr.w, cr.gy - .205 * cr.w, .94 * cr.w, .04 * cr.w); }
      geo = saved; litAt = []; lastCount = -Infinity; pics[k] = c.toDataURL('image/jpeg', .85); } catch (e) { return ''; } }
    return `<img class="nc-prev" src="${pics[k]}" alt="">`;
  };
})();
