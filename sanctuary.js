// Sanctuaire (Drained, day world) 3.42, chosen from proposals/sanctuaire/sanctuaire.html (artifact 7NSxMqGZS4BJzWwrK6WUkJ).
// - The dial: a lotus (default) whose twelve petals open around the time, each one slowly over its own 5 minutes;
//   or the moon chronograph (bezel 0–60, a moon that waxes in a window, a gold hand), sold in the shop for this world.
// - The moon garden on game.js's #fx canvas (ML.sanctuaryDraw): a weeping willow drawn leaf by leaf on the left,
//   a far shore of round trees, a stone bridge, the moon and its reflection, water lilies (one opens per session
//   of the day). Live: the willow sways, the water shimmers, the reflection wobbles, the lilies glow, and a mist
//   rises from the water during a session. The still parts are painted once per size.
(() => {
  'use strict';
  const { S, on, t, today, dayKey } = ML;
  const root = document.documentElement, NS = 'http://www.w3.org/2000/svg';
  const G = '#f5c372', T = '#7fd6c8';

  ML.addStrings({
    fr: { cat_dials: 'Cadrans de monde', dial_hint: 'Un autre cadran, plein écran ou fond pour un monde précis. Il remplace celui du monde quand tu l’équipes.',
      dial_lotus: 'Lotus du bassin', dial_lotus_d: 'Sanctuaire · douze pétales qui s’ouvrent pendant la séance.',
      dial_moon: 'Chronographe lunaire', dial_moon_d: 'Sanctuaire · une lunette de montre et une lune qui croît dans son guichet.' },
    en: { cat_dials: 'World dials', dial_hint: 'Another dial, full screen or background for one world. It replaces that world’s own when equipped.',
      dial_lotus: 'Pond lotus', dial_lotus_d: 'Sanctuary · twelve petals that open during the session.',
      dial_moon: 'Moon chronograph', dial_moon_d: 'Sanctuary · a watch bezel and a moon that waxes in its window.' },
  });

  const isOn = () => root.dataset.theme === 'sanctuary' && !root.dataset.light;
  const kind = () => (S.econ && S.econ.equip && S.econ.equip.dial === 'moon' ? 'moon' : 'lotus');
  const pt = (a, r) => [Math.sin(a * Math.PI / 180) * r, -Math.cos(a * Math.PI / 180) * r];
  const f1 = n => n.toFixed(1);
  const ease = x => x * x * (3 - 2 * x);

  /* ---------- The lotus ---------- */
  // A lotus petal pointing up from the r 78 ring: narrow base, round belly, pointed tip
  const petal = (L, W, b = -78) => `M0 ${f1(b)} C${f1(W)} ${f1(b - L * .15)} ${f1(W * 1.1)} ${f1(b - L * .62)} 0 ${f1(b - L)} C${f1(-W * 1.1)} ${f1(b - L * .62)} ${f1(-W)} ${f1(b - L * .15)} 0 ${f1(b)} Z`;
  const petalOf = e => ({ L: 20 + 36 * e, W: 6 + 13 * e });
  function lotusHtml(id) {
    let s = `<defs><linearGradient id="${id}p" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${G}" stop-opacity=".45"/><stop offset=".55" stop-color="#fbe3c0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe6ee"/></linearGradient>
      <radialGradient id="${id}g"><stop offset="0" stop-color="${G}" stop-opacity=".16"/><stop offset="1" stop-color="${G}" stop-opacity="0"/></radialGradient></defs>`;
    s += `<circle r="146" class="sl-rim"/><circle r="120" class="sl-rip"/><circle r="100" class="sl-rip"/><circle r="128" class="sl-bloom" fill="url(#${id}g)"/>`;
    s += `<g class="sl-ticks">${Array.from({ length: 60 }, (_, i) => { const [x0, y0] = pt(i * 6, i % 5 ? 136 : 131), [x1, y1] = pt(i * 6, 143); return `<line class="${i % 5 ? '' : 'q'}" x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}"/>`; }).join('')}</g>`;
    // the back layer: twelve calm teal petals between the gold ones, so the flower looks whole even before it opens
    s += `<g class="sl-back">${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30})" d="${petal(26, 8, -76)}"/>`).join('')}</g><circle r="78" class="sl-ring"/>`;
    s += `<g class="sl-front">${Array.from({ length: 12 }, (_, i) => `<g transform="rotate(${i * 30 + 15})"><path class="sl-p" fill="url(#${id}p)"/><path class="sl-hl"/><path class="sl-rib"/></g>`).join('')}</g>`;
    return s;
  }
  function lotusUpdate(svg, p) {
    svg.querySelectorAll('.sl-ticks line').forEach((l, i) => l.classList.toggle('on', i / 60 < p));
    svg.querySelectorAll('.sl-front > g').forEach((g, i) => {
      const open = Math.max(0, Math.min(1, p * 12 - i)), e = ease(open), { L, W } = petalOf(e), [pp, hl, rib] = g.children;
      pp.setAttribute('d', petal(L, W)); pp.classList.toggle('bud', open <= 0); pp.style.fillOpacity = open > 0 ? (.55 + .45 * e).toFixed(2) : '';
      hl.setAttribute('d', petal(L * .62, W * .45, -80)); hl.style.opacity = (.22 * e).toFixed(2);
      rib.setAttribute('d', `M0 -80 Q${f1(W * .08)} ${f1(-78 - L * .5)} 0 ${f1(-78 - L * .86)}`); rib.style.opacity = (.45 * e).toFixed(2);
    });
    svg.classList.toggle('bloom', p >= 0.999);
  }

  /* ---------- The moon chronograph ---------- */
  function moonHtml(id) {
    let s = `<defs><clipPath id="${id}a"><path d="M-26 -84 Q0 -108 26 -84 Q0 -72 -26 -84 Z"/></clipPath></defs>`;
    s += `<circle r="150" class="sm-rim"/><circle r="130" class="sm-in"/>`;
    s += `<g class="sm-ticks">${Array.from({ length: 60 }, (_, i) => { const [x0, y0] = pt(i * 6, i % 5 ? 139 : 134), [x1, y1] = pt(i * 6, 147); return `<line class="${i % 5 ? '' : 'q'}" x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}"/>`; }).join('')}</g>`;
    s += `<g class="sm-num">${Array.from({ length: 12 }, (_, i) => { const [x, y] = pt(i * 30, 120); return `<text x="${f1(x)}" y="${f1(y + 5)}">${String(i * 5).padStart(2, '0')}</text>`; }).join('')}</g>`;
    s += `<g transform="rotate(-90)"><circle r="130" class="sm-arc" pathLength="1"/></g>`;
    s += `<path class="sm-win" d="M-26 -84 Q0 -108 26 -84 Q0 -72 -26 -84 Z"/><g clip-path="url(#${id}a)"><circle class="sm-moon" cy="-87" r="10"/>${[0, 1, 2, 3, 4].map(i => `<circle class="sm-star" cx="${-20 + i * 10}" cy="${-92 + (i % 2) * 5}" r=".8"/>`).join('')}</g>`;
    s += `<g class="sm-hand"><line x1="0" y1="-90" x2="0" y2="-146"/><circle cy="-146" r="3.4"/></g>`;
    return s;
  }
  function moonUpdate(svg, p) {
    svg.querySelector('.sm-arc').style.strokeDasharray = `${p.toFixed(4)} 1`;
    svg.querySelector('.sm-hand').style.transform = `rotate(${(p * 360).toFixed(2)}deg)`;
    svg.querySelector('.sm-moon').setAttribute('cx', f1(-46 + p * 46));
  }

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-160 -160 320 320'); svg.setAttribute('aria-hidden', 'true');
  let built = '', lastKey = '';
  const progress = () => { const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot, started = rem < tot - .5 || (ML.running && ML.running());
    return started ? Math.max(0, Math.min(1, 1 - Math.max(0, rem) / tot)) : 0; };
  function render() {
    const wrap = document.querySelector('#sigil-card .ring-wrap');
    if (!isOn() || !wrap) { if (svg.isConnected) svg.remove(); lastKey = ''; return; }
    const k = kind();
    if (built !== k) { built = k; svg.setAttribute('class', 'sa-dial sa-' + k); svg.innerHTML = k === 'moon' ? moonHtml('sam') : lotusHtml('sal'); lastKey = ''; }
    if (svg.parentNode !== wrap) wrap.prepend(svg);
    const p = progress(), key = k + Math.round(p * 2000);
    if (key === lastKey) return; lastKey = key;
    (k === 'moon' ? moonUpdate : lotusUpdate)(svg, p);
  }
  on('tick', render); on('timer', render); on('render', render); on('started', render); on('cosmetics', render);
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light'] });
  // a small finished copy for the shop card (its own ids, three fifths through a session)
  let pid = 0;
  ML.sanctuaryDialSvg = k => {
    const s = document.createElementNS(NS, 'svg'), id = 'sap' + (++pid);
    s.setAttribute('viewBox', '-160 -160 320 320'); s.setAttribute('class', 'sa-dial sa-prev sa-' + k);
    s.innerHTML = k === 'moon' ? moonHtml(id) : lotusHtml(id);
    (k === 'moon' ? moonUpdate : lotusUpdate)(s, 0.6);
    return s.outerHTML;
  };

  /* ---------- The moon garden ---------- */
  let base = null, wil = null, key0 = '', pend = '', pendAt = 0, geo = null, mistA = 0.3, lastOpen = -Infinity, opened = 0;
  const rnd = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const canvasOf = (w, h, d) => { const c = document.createElement('canvas'); c.width = Math.ceil(w * d); c.height = Math.ceil(h * d); const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return [c, x]; };
  const glowAt = (x, gx, gy, r, col, a) => { const g = x.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(gx - r, gy - r, r * 2, r * 2); };
  function build(W, H) {
    const d = Math.min(2, devicePixelRatio || 1), wl = Math.round(H * .8), mx = W - Math.max(70, W * .05), my = H * .2;
    const lil = Array.from({ length: 9 }, (_, i) => ({ x: (i + .5) / 9 * W + (rnd(i) - .5) * W * .06, y: wl + 16 + rnd(i, 2) * (H - wl - 34), r: 16 + rnd(i, 3) * 9 }));
    geo = { W, H, wl, mx, my, lil, d };
    let x; [base, x] = canvasOf(W, H, d);
    // the moon, its halo, a faint ring of light
    glowAt(x, mx, my, 260, '190,215,255', .1); glowAt(x, mx, my, 60, '235,240,255', .18);
    x.fillStyle = '#f2ead2'; x.beginPath(); x.arc(mx, my, 19, 0, 7); x.fill();
    x.fillStyle = 'rgba(200,190,160,.35)'; [[-6, -4, 4], [5, 3, 3], [-2, 7, 2.4]].forEach(([a, b, r]) => { x.beginPath(); x.arc(mx + a, my + b, r, 0, 7); x.fill(); });
    // far shore: three soft rows of round trees, the farthest bluest, with a mist line on the water
    [['#0e2030', 44, 1.6], ['#0c1b29', 30, 1], ['#0a1622', 18, .6]].forEach(([c, lift, blur], row) => {
      x.save(); x.filter = `blur(${blur}px)`; x.fillStyle = c; x.beginPath(); x.moveTo(0, wl);
      for (let i = 0, px = -20; px < W + 40; i++) { const r = 18 + rnd(i, row + 5) * 26; x.arc(px + r, wl - lift + rnd(i, row + 9) * 10, r, Math.PI, 0); px += r * 1.5; }
      x.lineTo(W, wl); x.closePath(); x.fill(); x.restore();
    });
    const wg = x.createLinearGradient(0, wl, 0, H); wg.addColorStop(0, '#11293b'); wg.addColorStop(.4, '#0c1e2d'); wg.addColorStop(1, '#071320');
    x.fillStyle = wg; x.fillRect(0, wl, W, H - wl);
    x.fillStyle = 'rgba(160,200,215,.12)'; x.fillRect(0, wl, W, 1.2);
    // the stone bridge, bottom right: deck, arch, its reflection, a gold rim catching the moon
    const b0 = W - Math.min(400, W * .3), b1 = W + 30, mid = (b0 + b1) / 2, top = wl - 92;
    x.fillStyle = '#1a2f45'; x.beginPath(); x.moveTo(b0, wl); x.quadraticCurveTo(mid, top - 28, b1, wl); x.lineTo(b1 - 30, wl); x.quadraticCurveTo(mid, top + 34, b0 + 30, wl); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(245,195,114,.45)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(b0, wl); x.quadraticCurveTo(mid, top - 28, b1, wl); x.stroke();
    // stone joints on the arch, then a low parapet with posts along the deck
    const onArc = (u, lift) => [b0 + (b1 - b0) * u, (1 - u) * (1 - u) * wl + 2 * u * (1 - u) * (top - 28) + u * u * wl - lift];
    for (let i = 1; i < 12; i++) { const [px, py] = onArc(i / 12, 0); x.strokeStyle = 'rgba(10,22,34,.55)'; x.lineWidth = 1; x.beginPath(); x.moveTo(px, py + 2); x.lineTo(px + 1.5, py + 13); x.stroke(); }
    x.strokeStyle = 'rgba(32,58,82,.95)'; x.lineWidth = 2.4; x.beginPath(); for (let i = 0; i <= 30; i++) { const [px, py] = onArc(i / 30, 11); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
    x.lineWidth = 2; for (let i = 1; i < 10; i++) { const [px, py] = onArc(i / 10, 0); x.beginPath(); x.moveTo(px, py); x.lineTo(px, py - 11); x.stroke(); }
    x.strokeStyle = 'rgba(245,195,114,.3)'; x.lineWidth = .8; x.beginPath(); for (let i = 0; i <= 30; i++) { const [px, py] = onArc(i / 30, 12.2); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
    x.fillStyle = 'rgba(26,47,69,.45)'; x.beginPath(); x.moveTo(b0 + 30, wl); x.quadraticCurveTo(mid, wl + 64, b1 - 30, wl); x.lineTo(b1, wl); x.quadraticCurveTo(mid, wl + 100, b0, wl); x.fill();
    // lily pads (the flowers are drawn live: one opens per session of the day)
    lil.forEach((l, i) => { x.fillStyle = i % 2 ? '#123628' : '#163f2f'; x.beginPath(); x.ellipse(l.x, l.y, l.r, l.r * .3, 0, .35, Math.PI * 2 - .1); x.lineTo(l.x, l.y); x.fill();
      x.strokeStyle = 'rgba(127,214,200,.18)'; x.lineWidth = .8; x.beginPath(); x.ellipse(l.x, l.y, l.r, l.r * .3, 0, Math.PI, Math.PI * 2); x.stroke(); });
    buildWillow(W, H, wl, d);
  }
  // The willow sprite: a gnarled trunk, branches into a domed crown, strands of small leaves hanging down, lighter on
  // the side that faces the moon (right). Drawn once; the sway is done by drawing it in horizontal bands.
  function buildWillow(W, H, wl, d) {
    const cw = Math.max(140, Math.min(220, W * .12)), tx = Math.max(64, W * .055), cy = H * .1;
    const ww = tx + cw + 70, wh = wl + 12;
    let x; [wil, x] = canvasOf(ww, wh, d);
    geo.wil = { w: ww, h: wh, top: cy - 30 };
    x.lineCap = 'round';
    // trunk: two strokes for bark, leaning a little
    [['#0a1520', 18], ['#13222f', 7]].forEach(([c, w], k) => { x.strokeStyle = c; x.lineWidth = w; x.beginPath(); x.moveTo(tx - 8 + k * 3, wl + 6); x.bezierCurveTo(tx + 22, wl - (wl - cy) * .35, tx - 10, cy + 120, tx + 6 + k * 2, cy + 34); x.stroke(); });
    x.strokeStyle = '#0c1824'; x.lineWidth = 5;
    [[-cw * .7, 18], [cw * .75, 24], [-cw * .25, -6], [cw * .3, 2]].forEach(([dx, dy]) => { x.beginPath(); x.moveTo(tx + 6, cy + 56); x.quadraticCurveTo(tx + dx * .45, cy + dy - 6, tx + dx, cy + 26 + dy); x.stroke(); });
    // the crown's outline is soft and uneven (a few lobes), never a clean dome
    const dome = u => cy + 20 + 56 * u * u - 10 * Math.sin(u * 5.3 + 1) - 6 * Math.sin(u * 11);
    // a willow leaf: long, narrow, hanging almost straight down; three depths, the back ones darker, the front ones
    // silvered by the moon (sage green, never a bright green), all a little transparent so the strands blend
    const COL = [[22, 48, 50], [44, 86, 80], [112, 150, 134]];
    const leaf = (lx, ly, ang, depth, a) => { const c = COL[depth]; x.save(); x.translate(lx, ly); x.rotate(ang); x.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(2)})`;
      x.beginPath(); x.moveTo(0, -1); x.quadraticCurveTo(1.3, 3, 0, 7.5); x.quadraticCurveTo(-1.3, 3, 0, -1); x.fill(); x.restore(); };
    // a soft shadow mass behind everything, so the gaps between strands read as depth and not as holes
    const sh = x.createRadialGradient(tx, cy + (wl - cy) * .35, 10, tx, cy + (wl - cy) * .35, cw * 1.25); sh.addColorStop(0, 'rgba(12,30,34,.55)'); sh.addColorStop(1, 'rgba(12,30,34,0)');
    x.fillStyle = sh; x.fillRect(0, 0, ww, wh);
    // Strands like a fountain: each leaves a branch near the crown, arches up and out, then falls in a long cascade
    // (longest in the middle, a few touching the water). The leaves follow the strand and point down it.
    const bez = (p0, p1, p2, p3, s) => { const m = 1 - s; return m * m * m * p0 + 3 * m * m * s * p1 + 3 * m * s * s * p2 + s * s * s * p3; };
    for (let depth = 0; depth < 3; depth++) {
      const n = [90, 75, 55][depth];
      for (let i = 0; i < n; i++) {
        const r = i * 7 + depth * 500, dir = rnd(r, 1) < .55 ? 1 : -1, reach = cw * (.25 + .8 * rnd(r, 2)) * (1 - depth * .1);
        const ox = tx + (rnd(r, 3) - .5) * cw * .5, oy = cy + 14 + rnd(r, 4) * 34 + depth * 6, rise = 18 + 34 * rnd(r, 5);
        const kx = ox + dir * reach, ky = oy - rise * .15;                                  // where the arch turns down
        const len = Math.min(wl - ky - 2, (wl - cy) * (.4 + .55 * (1 - Math.pow(reach / cw, 2))) * (.65 + .35 * rnd(r, 6)));
        if (len < 30) continue;
        const ex = kx + dir * (3 + 6 * rnd(r, 7)), ey = ky + len;
        const A = [ox, oy, ox + dir * reach * .45, oy - rise, kx - dir * reach * .08, oy - rise * .7, kx, ky];
        const B = [kx, ky, kx + dir * 4, ky + len * .35, ex, ey - len * .4, ex, ey];
        const arcLen = reach * 1.2 + rise, tot = arcLen + len, ca = arcLen / tot;
        const at = s => s < ca ? [bez(A[0], A[2], A[4], A[6], s / ca), bez(A[1], A[3], A[5], A[7], s / ca)] : [bez(B[0], B[2], B[4], B[6], (s - ca) / (1 - ca)), bez(B[1], B[3], B[5], B[7], (s - ca) / (1 - ca))];
        x.strokeStyle = `rgba(${COL[depth].join(',')},.3)`; x.lineWidth = .6; x.beginPath(); x.moveTo(A[0], A[1]); x.bezierCurveTo(A[2], A[3], A[4], A[5], A[6], A[7]); x.bezierCurveTo(B[2], B[3], B[4], B[5], B[6], B[7]); x.stroke();
        let s = .04 + rnd(r, 8) * .05;
        while (s < 1) {
          s += (3.4 + rnd(r * 13 + s * 100, 5) * 3.6) / tot;
          const [lx, ly] = at(Math.min(1, s)), [nx, ny] = at(Math.min(1, s + .004)), ang = -Math.atan2(nx - lx, ny - ly);
          const fade = s > .84 ? Math.max(0, (1 - s) / .16) : 1, side = rnd(r * 17 + s * 300, 6) > .5 ? 1 : -1;
          leaf(lx + side * (.5 + rnd(r + s * 50, 8) * 1.5), ly, ang + side * (.1 + .2 * rnd(r + s * 70, 9)), depth, (.45 + .35 * rnd(r + s * 90, 10)) * fade);
        }
      }
    }
  }
  // the lily flower: a little white-pink lotus with a gold heart
  function lily(cx, l, a) {
    cx.globalAlpha = a;
    const g = cx.createRadialGradient(l.x, l.y - 4, 0, l.x, l.y - 4, 26); g.addColorStop(0, 'rgba(255,220,236,.35)'); g.addColorStop(1, 'rgba(255,220,236,0)'); cx.fillStyle = g; cx.fillRect(l.x - 26, l.y - 30, 52, 52);
    cx.fillStyle = '#f6e1ea';
    for (let k = 0; k < 6; k++) { const an = -Math.PI / 2 + (k - 2.5) * .42; cx.beginPath(); cx.ellipse(l.x + Math.cos(an) * 4, l.y - 4 + Math.sin(an) * 3, 2.4, 5.4, an + Math.PI / 2, 0, 7); cx.fill(); }
    cx.fillStyle = G; cx.beginPath(); cx.arc(l.x, l.y - 4, 1.8, 0, 7); cx.fill();
    cx.globalAlpha = 1;
  }
  ML.sanctuaryDraw = (cx, W, H, slow, still, now, tm) => {
    if (typeof cx === 'function') return; // a skipped frame (game.js paints at ~30 fps)
    // painting the garden takes ~150 ms: while a window is being resized, keep stretching the old one, rebuild once still
    const k = W + 'x' + H;
    if (k !== key0) { if (k !== pend) { pend = k; pendAt = now; } if (!base || now - pendAt > 350) { key0 = k; pend = ''; build(W, H); } }
    const { wl, mx, lil, wil: wg } = geo, time = still ? 0 : tm;
    cx.drawImage(base, 0, 0, W, H);
    // the willow, swaying: drawn in bands, the lower ones moving more (a long slow sway, a faint quicker shiver)
    const bands = 26, bh = wg.h / bands, d = geo.d;
    for (let b = 0; b < bands; b++) {
      const y = b * bh, f = Math.pow(Math.max(0, (y - wg.top) / (wg.h - wg.top)), 1.5);
      const dx = still ? 0 : f * (7 * Math.sin(time / 5200 + b * .05) + 1.4 * Math.sin(time / 1300 + b * .4));
      cx.drawImage(wil, 0, y * d, wil.width, bh * d + 1, dx, y, wg.w, bh + 1 / d);
    }
    // water: shimmering moon path and a few glints
    for (let i = 0; i < 12; i++) {
      const a = .38 - i * .025, w = 34 - i * 2.2, y = wl + 6 + i * 7, wob = still ? 0 : Math.sin(time / 900 + i * .9) * 4;
      cx.fillStyle = `rgba(243,236,214,${a.toFixed(3)})`; cx.fillRect(mx - w / 2 + wob, y, w, 1.6);
    }
    for (let i = 0; i < 30; i++) {
      const gx = rnd(i, 40) * W, gy = wl + 4 + rnd(i, 41) * (H - wl - 8), a = still ? .12 : .2 * Math.max(0, Math.sin(time / (900 + rnd(i, 42) * 900) + i));
      if (a < .02) continue; cx.fillStyle = `rgba(190,225,235,${a.toFixed(3)})`; cx.fillRect(gx, gy, 6 + rnd(i, 43) * 10, 1);
    }
    // lilies: one open per session today (at least one), each breathing softly
    if (now - lastOpen > 30000) { lastOpen = now; const td = today(); opened = Math.min(lil.length, 1 + (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length); }
    for (let i = 0; i < opened; i++) { const l = lil[(i * 4) % lil.length]; lily(cx, l, still ? .9 : .78 + .22 * Math.sin(time / 2400 + i)); }
    // the mist on the water: thin at rest, rising during a session
    const target = root.dataset.timer === 'running' ? .75 : .32; mistA += (target - mistA) * .02;
    const mg = cx.createLinearGradient(0, wl - 90 * mistA, 0, wl + 30); mg.addColorStop(0, 'rgba(150,185,205,0)'); mg.addColorStop(.7, `rgba(150,185,205,${(.2 * mistA).toFixed(3)})`); mg.addColorStop(1, 'rgba(150,185,205,0)');
    cx.fillStyle = mg; cx.fillRect(0, wl - 90 * mistA, W, 120);
  };
})();
