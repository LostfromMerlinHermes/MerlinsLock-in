// Netrunner (Fired up, day world) dark dial 3.45, chosen from proposals/netrunner/cadran.html (artifact UxjHgezhgtg7xoC5YXuffZ), option A.
// The tactical chronograph: a bezel 00–55 with four cyan lugs and a cyan triangle at 0, sixty LED segments that turn
// magenta minute by minute (cyan during a break; the current one blinks), HUD brackets on the inner ring, a cyan
// pointer, and a row of nine pips under the time, one per session of the day (RUN 03/09). At the end of a session a
// cyan sweep runs twice round the segments. The ring SVG is hidden under it, like the Sanctuaire and Abysses dials.
(() => {
  'use strict';
  const { S, on, today, dayKey } = ML;
  const root = document.documentElement, NS = 'http://www.w3.org/2000/svg';

  const isOn = () => root.dataset.theme === 'netrunner' && !root.dataset.light;
  const pt = (a, r) => [Math.sin(a * Math.PI / 180) * r, -Math.cos(a * Math.PI / 180) * r];
  const f1 = n => n.toFixed(1);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ln = (a, r0, r1) => { const [x0, y0] = pt(a, r0), [x1, y1] = pt(a, r1); return `M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}`; };
  const arcP = (r, a0, a1) => { const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r); return `M${f1(x0)} ${f1(y0)}A${r} ${r} 0 0 1 ${f1(x1)} ${f1(y1)}`; };
  const glowF = (id, sd) => `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${sd}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const SEG = i => arcP(121, i * 6 + 1, i * 6 + 5);

  function html(id) {
    let s = `<defs>${glowF(id + 'g', 2.2)}${glowF(id + 'h', 1)}</defs>`;
    // bezel: minute ticks, numerals 05–55, the cyan triangle at 0, four lugs
    s += `<circle r="157" class="nt-bezel"/><circle r="136" class="nt-face"/>`;
    s += `<path class="nt-bt" d="${Array.from({ length: 60 }, (_, i) => i).filter(i => i % 5).map(i => ln(i * 6, 151, 155)).join('')}"/>`;
    s += `<g class="nt-bn">${Array.from({ length: 11 }, (_, k) => { const [x, y] = pt((k + 1) * 30, 145); return `<text x="${f1(x)}" y="${f1(y + 3.6)}">${String((k + 1) * 5).padStart(2, '0')}</text>`; }).join('')}</g>`;
    s += `<path class="nt-zero" d="M0 -139L-6 -151L6 -151Z" filter="url(#${id}h)"/>`;
    s += `<path class="nt-lug" d="${[45, 135, 225, 315].map(a => ln(a, 152, 161)).join('')}"/>`;
    // the sixty LED segments (lit ones glow); the current one is a separate path so its blink doesn't re-blur the ring
    s += `<g class="nt-segs" filter="url(#${id}g)">${Array.from({ length: 60 }, (_, i) => `<path d="${SEG(i)}"/>`).join('')}</g><path class="nt-cur"/>`;
    s += `<g class="nt-it">${Array.from({ length: 12 }, (_, k) => `<path d="${ln(k * 30, 105, 111)}"/>`).join('')}</g>`;
    s += `<circle r="100" class="nt-in"/><path class="nt-br" d="${[45, 135, 225, 315].map(b => arcP(100, b - 9, b + 9)).join('')}"/>`;
    s += `<g class="nt-ptr"><path d="M0 -134L-5 -142.5L5 -142.5Z" filter="url(#${id}h)"/><path class="nt-ptr-l" d="M0 -100V-113"/></g>`;
    // today's sessions: nine pips and a counter, under the time
    s += `<g class="nt-pips">${Array.from({ length: 9 }, (_, i) => `<rect x="${-42 + i * 10}" y="50" width="7" height="3"/>`).join('')}</g><text class="nt-run" y="68"></text>`;
    return s;
  }
  function els(svg) {
    return svg._nt || (svg._nt = { segs: [...svg.querySelectorAll('.nt-segs path')], cur: svg.querySelector('.nt-cur'), bn: [...svg.querySelectorAll('.nt-bn text')],
      it: [...svg.querySelectorAll('.nt-it path')], ptr: svg.querySelector('.nt-ptr'), pips: [...svg.querySelectorAll('.nt-pips rect')], run: svg.querySelector('.nt-run') });
  }
  function update(svg, p, n, live) {
    const e = els(svg), lit = Math.floor(p * 60 + 1e-6);
    e.segs.forEach((l, i) => l.classList.toggle('on', i < lit));
    if (live && lit < 60) { e.cur.setAttribute('d', SEG(lit)); e.cur.style.display = ''; } else e.cur.style.display = 'none';
    e.bn.forEach((x, k) => x.classList.toggle('past', (k + 1) / 12 <= p));
    e.it.forEach((x, k) => x.classList.toggle('past', k > 0 && k / 12 <= p));
    e.ptr.style.transform = `rotate(${(p * 360).toFixed(2)}deg)`;
    e.pips.forEach((r, i) => r.classList.toggle('on', i < n));
    e.run.textContent = 'RUN ' + String(n).padStart(2, '0') + '/09';
  }

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-160 -160 320 320'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('class', 'nt-dial');
  let built = false, lastKey = '';
  const progress = () => { const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot, started = rem < tot - .5 || (ML.running && ML.running());
    return started ? clamp(1 - Math.max(0, rem) / tot) : 0; };
  const count = () => { const td = today(); return Math.min(9, (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length); };
  function render() {
    const wrap = document.querySelector('#sigil-card .ring-wrap');
    if (!isOn() || !wrap) { if (svg.isConnected) svg.remove(); lastKey = ''; return; }
    if (!built) { built = true; svg.innerHTML = html('ntd'); svg._nt = null; lastKey = ''; }
    if (svg.parentNode !== wrap) wrap.prepend(svg);
    const p = progress(), live = !!(ML.running && ML.running()), n = count(), key = Math.round(p * 2000) + '|' + live + '|' + n;
    if (key === lastKey) return; lastKey = key;
    update(svg, p, n, live);
  }
  on('tick', render); on('timer', render); on('render', render); on('started', render); on('newday', render);
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light'] });

  // the end of a session: a cyan sweep twice round the segments (CSS, one delay per segment)
  let sweepT = 0;
  on('session', s => {
    render();
    if (!isOn() || !s || s.mins < 1 || ML.reducedMotion()) return;
    els(svg).segs.forEach((l, i) => l.style.setProperty('--i', i));
    svg.classList.remove('sweep'); void svg.getBoundingClientRect(); svg.classList.add('sweep');
    clearTimeout(sweepT); sweepT = setTimeout(() => svg.classList.remove('sweep'), 2600);
  });
})();
