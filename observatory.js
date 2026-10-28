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
    fr: { dp_chart: 'Carte', oc_no: 'OBSERVATION N° {n}', oc_line: '{m} MIN · ALT {a}° · {p}', oc_pauses: '{n} PAUSES', oc_pauses_one: '1 PAUSE', oc_nopause: 'CIEL CLAIR', oc_cloud: 'NUAGES', oc_seen: 'OBSERVÉ', oc_sky: 'CIEL DU JOUR · {n}/8' },
    en: { dp_chart: 'Chart', oc_no: 'OBSERVATION N° {n}', oc_line: '{m} MIN · ALT {a}° · {p}', oc_pauses: '{n} PAUSES', oc_pauses_one: '1 PAUSE', oc_nopause: 'CLEAR SKY', oc_cloud: 'CLOUDS', oc_seen: 'OBSERVED', oc_sky: "TODAY'S SKY · {n}/8" },
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
        <header class="oc-head"><span id="oc-no"></span><span id="oc-date"></span></header>
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
    $('oc-date').textContent = new Date().toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' }).toUpperCase() + ' · ' + t('mood_' + S.mood).toUpperCase();
    $('oc-time').textContent = MiniView.fmtClock(done ? 0 : rem);
    $('oc-line').textContent = t('oc_line', { m: mins, a: Math.round(90 * Math.sin(Math.PI * p)), p: ps ? ML.tn('oc_pauses', ps) : t('oc_nopause') });
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
