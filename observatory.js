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
