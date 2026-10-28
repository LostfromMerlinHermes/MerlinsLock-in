// Abysses (Drained, night world) 3.43, chosen from proposals/abysses/abysses.html (artifact Xwj8doo3MJFX9YfbkF5qwZ).
// - The dial: the dive watch (default): a notched bezel 0–60 with a lume pip at 0, the elapsed part of the bezel tinted
//   teal, lume markers that dim as the hand passes them, a sword hand, a depth gauge at 6 (0 → 400 m over the session).
//   Sold in the shop for this world: the nautilus (its chambers fill with nacre, centre outward) and the moon
//   jellyfish (sixty tentacles, the minutes left glow at their tips; its bell beats every 5 s).
// - The sleeping reef on game.js's #fx canvas (ML.abyssDraw): a reef in profile (far haze, brain corals, violet sea
//   fans, tube sponges, staghorn corals in front), kelp on the right, a school of silver fish, light rays from the
//   surface, marine snow. Live: one glowing anemone opens per session of the day (max 9); during a session the rays
//   fade, the water darkens and only the reef glows; at the end of a session the school circles the dial; at rest the
//   school turns slowly and moves away from the mouse. The still parts are painted once per size.
(() => {
  'use strict';
  const { S, on, t, today, dayKey } = ML;
  const root = document.documentElement, NS = 'http://www.w3.org/2000/svg';
  const T = '#7fcfbd', V = '#a49af0', TX = '#d8f3f5', MI = '#7fa9b4', LU = '#c8f2e8';

  ML.addStrings({
    fr: { ab_depth: 'PROFONDEUR', dp_log: 'Carnet', dl_no: 'PLONGÉE N° {n}', dl_line: '{m} MIN · {d} M · {p}', dl_pauses: '{n} PAUSES', dl_pauses_one: '1 PAUSE', dl_nopause: 'SANS PAUSE', dl_surface: 'SURFACE', dl_stop: 'PALIER', dl_up: 'REMONTÉE',
      dial_diver: 'Montre de plongée', dial_diver_d: 'Abysses · une lunette crantée, des index lumineux et un manomètre de profondeur.',
      dial_nautilus: 'Nautile', dial_nautilus_d: 'Abysses · les loges de la coquille s’éclairent de nacre une à une pendant la séance.',
      dial_jelly: 'Méduse lune', dial_jelly_d: 'Abysses · soixante tentacules : ceux des minutes qui restent brillent au bout.' },
    en: { ab_depth: 'DEPTH', dp_log: 'Log', dl_no: 'DIVE N° {n}', dl_line: '{m} MIN · {d} M · {p}', dl_pauses: '{n} PAUSES', dl_pauses_one: '1 PAUSE', dl_nopause: 'NO PAUSE', dl_surface: 'SURFACE', dl_stop: 'STOP', dl_up: 'ASCENT',
      dial_diver: 'Dive watch', dial_diver_d: 'Abyss · a notched bezel, glowing markers and a depth gauge.',
      dial_nautilus: 'Nautilus', dial_nautilus_d: 'Abyss · the shell’s chambers light up with nacre one by one during the session.',
      dial_jelly: 'Moon jellyfish', dial_jelly_d: 'Abyss · sixty tentacles: those of the minutes left glow at their tips.' },
  });

  const isOn = () => root.dataset.theme === 'abyss' && !root.dataset.light;
  const kind = () => { const k = S.econ && S.econ.equip && S.econ.equip.dialAbyss; return k === 'nautilus' || k === 'jelly' ? k : 'diver'; };
  const pt = (a, r) => [Math.sin(a * Math.PI / 180) * r, -Math.cos(a * Math.PI / 180) * r];
  const f1 = n => n.toFixed(1);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ln = (a, r0, r1) => { const [x0, y0] = pt(a, r0), [x1, y1] = pt(a, r1); return `M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}`; };
  const lumeF = id => `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

  /* ---------- A: the dive watch ---------- */
  function diverHtml(id) {
    let s = `<defs>${lumeF(id + 'l')}
      <radialGradient id="${id}f" cx=".5" cy=".38" r=".62"><stop offset="0" stop-color="#11394a"/><stop offset=".72" stop-color="#061a24"/><stop offset="1" stop-color="#030e15"/></radialGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c4656"/><stop offset=".45" stop-color="#0a2430"/><stop offset="1" stop-color="#05141c"/></linearGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e0eef1"/><stop offset=".5" stop-color="#a8c0c7"/><stop offset=".51" stop-color="#6f8a93"/><stop offset="1" stop-color="#8aa3ab"/></linearGradient>
      <radialGradient id="${id}c" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
    // the crown at 3 o'clock, knurled, with its guard
    s += `<g class="ad-crown"><path d="M150 -15 Q158 -15 158 -9 L158 9 Q158 15 150 15 Z"/><rect x="157" y="-8" width="6" height="16" rx="1.6"/><path class="ad-kn" d="M159 -6H163M159 -3H163M159 0H163M159 3H163M159 6H163"/></g>`;
    // bezel: steel edge with 120 notches, a ceramic insert, the elapsed part tinted teal
    s += `<circle r="155" class="ad-edge"/><circle r="152" fill="url(#${id}b)" class="ad-bezel"/>`;
    s += `<path class="ad-kn" d="${Array.from({ length: 120 }, (_, i) => ln(i * 3, 151.5, 155)).join('')}"/>`;
    s += `<g transform="rotate(-90)"><circle r="139" class="ad-tint" pathLength="1"/></g>`;
    s += `<circle r="149" class="ad-ins"/><circle r="128.5" class="ad-ins"/>`;
    s += `<path class="ad-bt" d="${Array.from({ length: 59 }, (_, i) => i + 1).filter(i => i < 15 && i % 5).map(i => ln(i * 6, 146, 140)).join('')}"/>`;
    s += `<path class="ad-bt q" d="${Array.from({ length: 11 }, (_, i) => ln((i + 1) * 30, 147, 134)).filter((_, i) => (i + 1) % 2).join('')}"/>`;
    s += `<g class="ad-bn">${[1, 2, 3, 4, 5].map(i => { const [x, y] = pt(i * 60, 138); return `<text x="${f1(x)}" y="${f1(y + 5)}" transform="rotate(${i * 60} ${f1(x)} ${f1(y)})">${i * 10}</text>`; }).join('')}</g>`;
    s += `<path class="ad-pip-rim" d="M0 -128 L-11.5 -148 L11.5 -148 Z"/><path class="ad-pip" d="M0 -131.5 L-8.5 -146 L8.5 -146 Z" filter="url(#${id}l)"/>`;
    // the face: a faint sunburst, the chapter ring of minutes, twelve lume markers in steel surrounds
    s += `<circle r="126" fill="url(#${id}f)" class="ad-face"/>`;
    s += `<path class="ad-sun" d="${Array.from({ length: 90 }, (_, i) => ln(i * 4, 30, 112)).join('')}"/>`;
    s += `<g class="ad-min">${Array.from({ length: 60 }, (_, i) => `<path d="${ln(i * 6, 123, i % 5 ? 119 : 117)}"/>`).join('')}</g>`;
    s += `<g class="ad-ms" filter="url(#${id}l)">`;
    for (let i = 0; i < 12; i++) {
      if (i === 0) s += `<g class="ad-m keep"><rect x="-10" y="-113" width="7.5" height="24" rx="2"/><rect x="2.5" y="-113" width="7.5" height="24" rx="2"/></g>`;
      else if (i === 6) s += `<g class="ad-m"></g>`; // the depth gauge sits there
      else if (i % 3 === 0) s += `<g class="ad-m" transform="rotate(${i * 30})"><rect x="-5" y="-113" width="10" height="25" rx="2"/></g>`;
      else { const [x, y] = pt(i * 30, 101); s += `<g class="ad-m"><circle cx="${f1(x)}" cy="${f1(y)}" r="6.6"/></g>`; }
    }
    s += `</g>`;
    // the depth gauge at 6, in place of that marker (below the time and the task line): 0 → 400 m over the session
    s += `<g class="ad-gauge" transform="translate(0 92)"><title>${t('ab_depth')}</title><circle r="23" class="ad-g-rim"/><circle r="20" class="ad-g-face"/>`;
    s += `<path class="ad-g-t" d="${Array.from({ length: 9 }, (_, k) => ln(-120 + k * 30, 17, k % 2 ? 19.5 : 15)).join('')}"/>`;
    s += `<path class="ad-g-red" d="${ln(120, 15, 19.5)}"/><text class="ad-g-n" x="-10.5" y="13">0</text><text class="ad-g-n" x="10.5" y="13">400</text>`;
    s += `<g class="ad-needle"><path d="M-1.2 3 L0 -16 L1.2 3 Z"/></g><circle r="2.2" class="ad-g-cap"/><text class="ad-g-m" y="-5.5">0 m</text></g>`;
    // the sword hand, kept outside the time so the digits stay clear: a steel blade with a lume inlay, a small lume ring at its foot
    s += `<g class="ad-hand"><path d="M-2 -50 L-5.4 -66 L0 -118 L5.4 -66 L2 -50 Z" fill="url(#${id}s)" class="ad-sword"/><path d="M-2.4 -70 L0 -107 L2.4 -70 Z" class="ad-inlay" filter="url(#${id}l)"/><circle cy="-46.5" r="3" class="ad-cw"/></g>`;
    s += `<ellipse cx="-42" cy="-62" rx="96" ry="46" transform="rotate(-32 -42 -62)" fill="url(#${id}c)" class="ad-glass"/>`;
    return s;
  }
  function diverEls(svg) {
    return svg._ab || (svg._ab = { tint: svg.querySelector('.ad-tint'), min: [...svg.querySelectorAll('.ad-min path')], m: [...svg.querySelectorAll('.ad-m')],
      hand: svg.querySelector('.ad-hand'), needle: svg.querySelector('.ad-needle'), m_txt: svg.querySelector('.ad-g-m') });
  }
  function diverUpdate(svg, p) {
    const e = diverEls(svg);
    e.tint.style.strokeDasharray = `${p.toFixed(4)} 1`;
    e.min.forEach((l, i) => l.classList.toggle('past', i / 60 < p));
    e.m.forEach((g, i) => g.classList.toggle('off', i > 0 && i / 12 <= p && p < 1));
    e.hand.style.transform = `rotate(${(p * 360).toFixed(2)}deg)`;
    e.needle.style.transform = `rotate(${(-120 + 240 * p).toFixed(2)}deg)`;
    e.m_txt.textContent = Math.round(400 * p) + ' m';
  }

  /* ---------- B: the moon jellyfish, seen from below ---------- */
  function jellyHtml(id) {
    let s = `<defs>${lumeF(id + 'l')}
      <radialGradient id="${id}b" cx=".5" cy=".46"><stop offset="0" stop-color="${V}" stop-opacity=".30"/><stop offset=".7" stop-color="${T}" stop-opacity=".12"/><stop offset=".93" stop-color="${T}" stop-opacity=".28"/><stop offset="1" stop-color="#eafffa" stop-opacity=".4"/></radialGradient>
      <radialGradient id="${id}t"><stop offset="0" stop-color="#eafffa"/><stop offset=".35" stop-color="${T}" stop-opacity=".9"/><stop offset="1" stop-color="${T}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}h"><stop offset="0" stop-color="#020b12" stop-opacity=".8"/><stop offset=".7" stop-color="#020b12" stop-opacity=".5"/><stop offset="1" stop-color="#020b12" stop-opacity="0"/></radialGradient></defs>`;
    s += `<circle r="152" class="aj-rim"/><circle r="146" class="aj-rim2"/>`;
    s += `<g class="aj-num">${[0, 1, 2, 3, 4, 5].map(i => { const [x, y] = pt(i * 60, 152); return `<rect x="${f1(x - 11)}" y="${f1(y - 8)}" width="22" height="16" rx="8"/><text x="${f1(x)}" y="${f1(y + 4.5)}">${i * 10}</text>`; }).join('')}</g>`;
    // sixty tentacles, one per minute: each hangs from the bell's margin and waves a little more toward its tip
    s += `<g class="aj-drift"><g class="aj-tents">`;
    for (let i = 0; i < 60; i++) {
      const a = i * 6, big = i % 5 === 0, r1 = big ? 141 : 131 + (i % 2) * 3, amp = big ? 3.4 : 2.5;
      let d = ''; for (let r = 76; r <= r1; r += 3) { const w = Math.sin(r / 8.5 + i * 1.7) * amp * (r - 76) / 62, [x, y] = pt(a, r), [px, py] = pt(a + 90, w); d += (r === 76 ? 'M' : 'L') + f1(x + px) + ' ' + f1(y + py); }
      const [tx, ty] = pt(a, r1 + 1);
      s += `<g class="aj-t${big ? ' q' : ''}"><path d="${d}"/><circle cx="${f1(tx)}" cy="${f1(ty)}" r="${big ? 7.5 : 4.8}" fill="url(#${id}t)"/></g>`;
    }
    s += `</g></g><g class="aj-cur"><circle cy="-136" r="13" fill="url(#${id}t)"/></g>`;
    // the bell: a scalloped margin (16 lobes, eight sense organs in the notches), radial canals, the ring canal,
    // four horseshoe gonads that light one per quarter, four frilly oral arms under the time
    let bd = ''; for (let k = 0; k <= 192; k++) { const a = k / 192 * 360, r = 74 + 2.8 * Math.cos(k / 192 * 16 * 2 * Math.PI), [x, y] = pt(a, r); bd += (k ? 'L' : 'M') + f1(x) + ' ' + f1(y); }
    s += `<g class="aj-bell"><path d="${bd}Z" fill="url(#${id}b)" class="aj-margin"/>`;
    s += `<path class="aj-can" d="${Array.from({ length: 16 }, (_, k) => { const a = k * 22.5 + 11.25, [x0, y0] = pt(a, 28), [x1, y1] = pt(a, 70), [cx, cy] = pt(a + (k % 2 ? 4 : -4), 50); return `M${f1(x0)} ${f1(y0)}Q${f1(cx)} ${f1(cy)} ${f1(x1)} ${f1(y1)}`; }).join('')}"/>`;
    s += `<circle r="68" class="aj-ring"/>`;
    s += Array.from({ length: 8 }, (_, k) => { const [x, y] = pt(k * 45, 71.5); return `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.6" class="aj-rho"/>`; }).join('');
    s += `<path class="aj-arms" d="${[45, 135, 225, 315].map(a => { let d = ''; for (let r = 8; r <= 46; r += 2) { const w = Math.sin(r / 3) * 3.5 * (r / 46), [x, y] = pt(a, r), [px, py] = pt(a + 90, w); d += (r === 8 ? 'M' : 'L') + f1(x + px) + ' ' + f1(y + py); } return d; }).join('')}"/>`;
    s += [0, 1, 2, 3].map(q => { const a = 45 + q * 90, [cx, cy] = pt(a, 48); return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${a})"><path class="aj-gon" d="M-12 4 A12 12 0 1 1 12 4" filter="url(#${id}l)"/></g>`; }).join('');
    s += `<ellipse rx="56" ry="25" fill="url(#${id}h)"/></g>`;
    return s;
  }
  function jellyUpdate(svg, p) {
    const e = svg._ab || (svg._ab = { t: [...svg.querySelectorAll('.aj-t')], cur: svg.querySelector('.aj-cur'), gon: [...svg.querySelectorAll('.aj-gon')] });
    e.t.forEach((g, i) => g.classList.toggle('on', i / 60 >= p));
    e.cur.style.transform = `rotate(${(p * 360).toFixed(2)}deg)`; e.cur.style.opacity = p > 0 && p < 1 ? 1 : 0;
    e.gon.forEach((g, q) => { const lit = clamp(p * 4 - q); g.style.strokeOpacity = (.22 + .73 * lit).toFixed(2); g.classList.toggle('lit', lit > .99); });
  }

  /* ---------- C: the nautilus, seen in section ---------- */
  // a log spiral whose pole sits off-centre so the whole shell is centred in the dial, mouth to the lower left
  const NB = Math.log(3) / (2 * Math.PI), TH1 = 5 * Math.PI, A0 = 146 / Math.exp(NB * TH1), ROT = -Math.PI / 4, OX = -30 * Math.cos(TH1 + ROT), OY = -30 * Math.sin(TH1 + ROT);
  const NP = (th, k = 1) => { const r = A0 * Math.exp(NB * th) * k, an = th + ROT; return [OX + Math.cos(an) * r, OY + Math.sin(an) * r]; };
  const pp = ([x, y]) => f1(x) + ' ' + f1(y);
  const NCH = 25, THE = TH1 - 1.9, THS = THE - 1.5 * Math.PI;
  function nautilusHtml(id) {
    let s = `<defs>${lumeF(id + 'l')}
      <radialGradient id="${id}p" cx=".5" cy=".5"><stop offset="0" stop-color="#f2fffb"/><stop offset=".55" stop-color="${T}" stop-opacity=".78"/><stop offset="1" stop-color="${V}" stop-opacity=".5"/></radialGradient>
      <radialGradient id="${id}s" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#174355"/><stop offset=".6" stop-color="#0d2b39"/><stop offset="1" stop-color="#071b25"/></radialGradient>
      <radialGradient id="${id}h"><stop offset="0" stop-color="#020b12" stop-opacity=".88"/><stop offset=".7" stop-color="#020b12" stop-opacity=".6"/><stop offset="1" stop-color="#020b12" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}n" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eafffa" stop-opacity=".16"/><stop offset=".5" stop-color="${V}" stop-opacity=".08"/><stop offset="1" stop-color="${T}" stop-opacity="0"/></linearGradient></defs>`;
    s += `<circle r="152" class="an-rim"/><circle r="135" class="an-in"/>`;
    s += `<g class="an-ticks">${Array.from({ length: 60 }, (_, i) => `<path class="${i % 5 ? '' : 'q'}" d="${ln(i * 6, i % 5 ? 143 : 138, 149)}"/>`).join('')}</g>`;
    // the outer whorl, filled; fine growth lines across it; the inner whorls as a spiral line
    let d = `M${pp(NP(TH1 - 2 * Math.PI))}`; for (let k = 1; k <= 90; k++) d += `L${pp(NP(TH1 - 2 * Math.PI + k / 90 * 2 * Math.PI))}`;
    for (let k = 90; k >= 0; k--) d += `L${pp(NP(TH1 - 4 * Math.PI + k / 90 * 2 * Math.PI))}`;
    s += `<path d="${d}Z" fill="url(#${id}s)" class="an-shell"/>`;
    s += `<path class="an-grow" d="${Array.from({ length: 44 }, (_, k) => { const th = THE + .05 + k * (1.85 / 44), o = NP(th, .995), n = NP(th - .05, .7); return `M${pp(o)}L${pp(n)}`; }).join('')}"/>`;
    let sp = `M${pp(NP(0.6))}`; for (let k = 1; k <= 180; k++) sp += `L${pp(NP(0.6 + k / 180 * (TH1 - 2 * Math.PI - 0.6)))}`;
    s += `<path class="an-spiral" d="${sp}"/>`;
    // the older, inner chambers down to the centre: their septa only, faint (they never light)
    let ins = ''; for (let th = THS - 1.5 * Math.PI / NCH; th > 2 * Math.PI + .9; th -= 1.5 * Math.PI / NCH) { const o = NP(th), n = NP(th - 2 * Math.PI), q = NP(th + .25); ins += `M${pp(o)}Q${f1((o[0] + n[0]) / 2 + (q[0] - o[0]) * .25)} ${f1((o[1] + n[1]) / 2 + (q[1] - o[1]) * .25)} ${pp(n)}`; }
    s += `<path class="an-old" d="${ins}"/>`;
    // the chambers: 25 across the last turn before the body chamber, each with its septum bowed toward the mouth
    s += `<g class="an-chs">`;
    for (let i = 0; i < NCH; i++) {
      const t0 = THS + i / NCH * 1.5 * Math.PI, t1 = THS + (i + 1) / NCH * 1.5 * Math.PI;
      let c = `M${pp(NP(t0))}`; for (let k = 1; k <= 6; k++) c += `L${pp(NP(t0 + (t1 - t0) * k / 6))}`;
      for (let k = 6; k >= 0; k--) c += `L${pp(NP(t0 + (t1 - t0) * k / 6 - 2 * Math.PI))}`;
      const o = NP(t1), n = NP(t1 - 2 * Math.PI), q = NP(t1 + .25), mx = (o[0] + n[0]) / 2 + (q[0] - o[0]) * .25, my = (o[1] + n[1]) / 2 + (q[1] - o[1]) * .25;
      s += `<g class="an-ch"><path class="an-cell" d="${c}Z" fill="url(#${id}p)"/><path class="an-sep" d="M${pp(o)}Q${f1(mx)} ${f1(my)} ${pp(n)}"/></g>`;
    }
    s += `</g>`;
    // the siphuncle threading the chambers, the tiger stripes on the body chamber, a pearly sheen
    let si = ''; for (let k = 0; k <= 60; k++) { const th = THS + k / 60 * 1.5 * Math.PI, o = NP(th), n = NP(th - 2 * Math.PI); si += (k ? 'L' : 'M') + f1(n[0] + (o[0] - n[0]) * .3) + ' ' + f1(n[1] + (o[1] - n[1]) * .3); }
    s += `<path class="an-siph" d="${si}"/>`;
    s += `<path class="an-tiger" d="${Array.from({ length: 8 }, (_, k) => { const th = THE + .12 + k * .22, o = NP(th, .985), n = NP(th - .1 - (k % 2) * .05, .76 + (k % 3) * .03); return `M${pp(o)}Q${pp(NP(th - .02, .87))} ${pp(n)}`; }).join('')}"/>`;
    s += `<path d="${d}Z" fill="url(#${id}n)" class="an-sheen"/>`;
    s += `<ellipse rx="54" ry="23" fill="url(#${id}h)"/>`;
    return s;
  }
  function nautilusUpdate(svg, p) {
    const e = svg._ab || (svg._ab = { ticks: [...svg.querySelectorAll('.an-ticks path')], ch: [...svg.querySelectorAll('.an-ch')] });
    e.ticks.forEach((l, i) => l.classList.toggle('past', i / 60 < p));
    const lit = p * NCH;
    e.ch.forEach((g, i) => { const f = clamp(lit - i); g.style.setProperty('--f', (f > 0 ? .25 + .6 * f : 0).toFixed(2)); g.classList.toggle('full', f > .99); g.classList.toggle('cur', f > 0 && f < 1); });
  }

  // The end-of-session reward on the dial itself (the panels hide most of the background): a ribbon of small silver
  // fish swims once round the bezel, the leader first, then fades (CSS animation, started by circle())
  const FISH = 'M5.5 0C3 -2.3 -2.5 -2.2 -4.6 0C-2.5 2.2 3 2.3 5.5 0ZM-4 0L-8.4 -2.8L-7.4 0L-8.4 2.8Z';
  const schoolHtml = () => `<g class="ab-school">${Array.from({ length: 24 }, (_, i) => { const a = -i * 6.5 - (i % 3) * 1.8, r = 168 + ((i * 7) % 5 - 2) * 2.6, s = 1 + ((i * 5) % 4) * .12;
    return `<path d="${FISH}" transform="rotate(${f1(a)}) translate(0 ${-r}) scale(${s.toFixed(2)})" style="opacity:${(.55 + ((i * 3) % 5) * .1).toFixed(2)}"/>`; }).join('')}</g>`;
  const KINDS = { diver: [diverHtml, diverUpdate], nautilus: [nautilusHtml, nautilusUpdate], jelly: [jellyHtml, jellyUpdate] };
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-160 -160 320 320'); svg.setAttribute('aria-hidden', 'true');
  let built = '', lastKey = '';
  const progress = () => { const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot, started = rem < tot - .5 || (ML.running && ML.running());
    return started ? clamp(1 - Math.max(0, rem) / tot) : 0; };
  function render() {
    const wrap = document.querySelector('#sigil-card .ring-wrap');
    if (!isOn() || !wrap) { if (svg.isConnected) svg.remove(); lastKey = ''; return; }
    const k = kind();
    if (built !== k) { built = k; svg.setAttribute('class', 'ab-dial ab-' + k); svg._ab = null; svg.innerHTML = KINDS[k][0]('abd') + schoolHtml(); lastKey = ''; }
    if (svg.parentNode !== wrap) wrap.prepend(svg);
    const p = progress(), key = k + Math.round(p * 2000);
    if (key === lastKey) return; lastKey = key;
    KINDS[k][1](svg, p);
  }
  on('tick', render); on('timer', render); on('render', render); on('started', render); on('cosmetics', render); on('lang', () => { built = ''; render(); });
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light'] });
  // a small finished copy for the shop card (its own ids, three fifths through a session)
  let pid = 0;
  ML.abyssDialSvg = k => {
    if (!KINDS[k]) return '';
    const s = document.createElementNS(NS, 'svg'), id = 'abp' + (++pid);
    s.setAttribute('viewBox', '-164 -164 328 328'); s.setAttribute('class', 'ab-dial ab-prev ab-' + k);
    s.innerHTML = KINDS[k][0](id); KINDS[k][1](s, 0.6);
    return s.outerHTML;
  };

  /* ---------- The sleeping reef ---------- */
  let base = null, fore = null, raysC = null, spr = null, key0 = '', pend = '', pendAt = 0, geo = null;
  let fk = 0, lastCount = -Infinity, opened = -1, openAt = [], fish = [], snow = [], lastNow = 0, circleAt = -Infinity, dialC = null, dialAt = 0, ptr = null;
  const rnd = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const seeded = s => () => { s = s + 0x6D2B79F5 | 0; let q = Math.imul(s ^ s >>> 15, 1 | s); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
  const canvasOf = (w, h, d) => { const c = document.createElement('canvas'); c.width = Math.ceil(w * d); c.height = Math.ceil(h * d); const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return [c, x]; };
  const glowAt = (x, gx, gy, r, col, a) => { const g = x.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(gx - r, gy - r, r * 2, r * 2); };
  addEventListener('pointermove', e => { ptr = e.pointerType === 'mouse' ? [e.clientX, e.clientY] : null; }, { passive: true });
  document.addEventListener('mouseleave', () => { ptr = null; });
  let circT = 0;
  const circle = () => { circleAt = performance.now(); dialC = null;
    if (ML.reducedMotion()) return; render(); svg.classList.remove('circling'); setTimeout(() => svg.classList.add('circling'), 30);
    clearTimeout(circT); circT = setTimeout(() => svg.classList.remove('circling'), 12500); };
  on('session', s => { lastCount = -Infinity; if (isOn() && s && s.mins >= 1) circle(); });
  ML.abyssCircle = circle; // (also used to check the reward from the console)

  // a soft glowing dot, drawn once per colour and stamped with drawImage (gradients per frame cost too much)
  function sprite(col) {
    const [c, x] = canvasOf(32, 32, 1), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(240,255,252,1)'); g.addColorStop(.25, `rgba(${col},.85)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return c;
  }
  // recursive branches: sea fans (many fine) and staghorn coral (few thick); the tips are kept for polyps and rim light
  function branch(x, R, px, py, ang, len, w, depth, spread, shrink, tips) {
    const ex = px + Math.cos(ang) * len, ey = py + Math.sin(ang) * len, bend = (R() - .5) * .7;
    x.lineWidth = w; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(ang + bend) * len * .5, py + Math.sin(ang + bend) * len * .5, ex, ey); x.stroke();
    if (depth > 0) { const n = R() < .78 ? 2 : 3; for (let k = 0; k < n; k++) branch(x, R, ex, ey, ang + (k - (n - 1) / 2) * spread * (.7 + R() * .6) + (R() - .5) * .12, len * shrink * (.85 + R() * .3), w * .72, depth - 1, spread, shrink, tips); }
    else if (tips) tips.push([ex, ey]);
  }
  function ridge(x, yAt, W, H, fill) { x.fillStyle = fill; x.beginPath(); x.moveTo(0, H); for (let px = 0; px <= W + 8; px += 6) x.lineTo(px, yAt(px)); x.lineTo(W, H); x.closePath(); x.fill(); }
  // a brain coral: a dome shaded from the surface light, meandering grooves clipped to it, a lit rim
  function brain(x, R, cx0, cy0, r) {
    const ry = r * .64, dome = () => { x.beginPath(); x.ellipse(cx0, cy0, r, ry, 0, Math.PI, 0); x.closePath(); };
    const g = x.createRadialGradient(cx0 - r * .25, cy0 - ry * .8, r * .05, cx0, cy0 - ry * .2, r * 1.1); g.addColorStop(0, '#1d4e5a'); g.addColorStop(.55, '#0d3140'); g.addColorStop(1, '#061c26');
    x.fillStyle = 'rgba(1,8,12,.5)'; x.beginPath(); x.ellipse(cx0, cy0 + 2, r * 1.08, ry * .18, 0, 0, 7); x.fill();
    x.fillStyle = g; dome(); x.fill();
    x.save(); dome(); x.clip(); x.lineCap = 'round';
    const rows = Math.max(4, Math.round(r / 6)), ph = R() * 9;
    for (let k = 1; k <= rows; k++) {
      const rr = k / (rows + .6), fq = 7 + R() * 6;
      for (const [col, off] of [['rgba(2,14,20,.6)', 0], ['rgba(140,215,205,.09)', .5 / rows]]) {
        x.strokeStyle = col; x.lineWidth = Math.max(.8, r / 34); x.beginPath(); let pen = false;
        for (let a = Math.PI; a <= 2 * Math.PI + .01; a += .025) {
          const m = rr + off + .5 / rows * Math.sin(a * fq + k * 2.3 + ph) * Math.sin(a * 3.1 + k);
          const gap = Math.sin(a * (5 + k % 3) + k * 1.7 + ph) > .82;
          const px = cx0 + Math.cos(a) * r * m, py = cy0 + Math.sin(a) * ry * m;
          if (gap) { pen = false; continue; } pen ? x.lineTo(px, py) : x.moveTo(px, py); pen = true;
        }
        x.stroke();
      }
    }
    x.restore();
    x.strokeStyle = 'rgba(160,230,220,.16)'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(cx0, cy0, r, ry, 0, Math.PI * 1.12, Math.PI * 1.88); x.stroke();
  }
  // a cluster of tube sponges: open-topped columns, shaded on one side, a violet tint at the lip
  function sponges(x, R, bx, by, sc) {
    // they grow from one foot and fan outward, narrow at the base, widening to a soft rolled lip
    const n = 3 + Math.floor(R() * 3), tubes = Array.from({ length: n }, (_, i) => ({ u: i / (n - 1) - .5, h: (24 + R() * 30) * sc * (1 - Math.abs(i / (n - 1) - .5) * .7), w: (9 + R() * 5) * sc }));
    tubes.sort((a, b) => a.h - b.h).reverse(); // the tallest at the back
    for (const { u, h, w } of tubes) {
      const x0 = bx + u * w * 1.4, x1 = bx + u * w * 3.4 + (R() - .5) * 4 * sc, top = by - h;
      const g = x.createLinearGradient(x1 - w / 2, 0, x1 + w / 2, 0); g.addColorStop(0, '#2b2f5e'); g.addColorStop(.45, '#1b2148'); g.addColorStop(1, '#0b1230');
      x.fillStyle = g; x.beginPath(); x.moveTo(x0 - w * .28, by);
      x.bezierCurveTo(x0 - w * .4, by - h * .4, x1 - w * .62, top + h * .35, x1 - w / 2, top);
      x.lineTo(x1 + w / 2, top); x.bezierCurveTo(x1 + w * .62, top + h * .35, x0 + w * .4, by - h * .4, x0 + w * .28, by); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(2,10,20,.35)'; x.lineWidth = .8;
      for (let k = 1; k < 5; k++) { const yy = by - h * k / 5, xm = x0 + (x1 - x0) * k / 5, ww = w * (.3 + .2 * k / 5); x.beginPath(); x.ellipse(xm, yy, ww, ww * .18, 0, 0, Math.PI); x.stroke(); }
      x.fillStyle = '#050a1c'; x.beginPath(); x.ellipse(x1, top, w / 2, w * .2, 0, 0, 7); x.fill();
      x.strokeStyle = 'rgba(180,170,250,.38)'; x.lineWidth = 1.4; x.stroke();
    }
  }
  function build(W, H) {
    const d = Math.min(2, devicePixelRatio || 1), sc = clamp(Math.min(W / 1300, H / 760) * 1.15, .55, 1.25), R = seeded(7);
    const farY = px => H * .7 + Math.sin(px / (170 * sc) + .4) * 13 * sc + Math.sin(px / (53 * sc) + 1.2) * 5 * sc;
    const midY = px => H * .8 + Math.sin(px / (150 * sc) + 2.1) * 13 * sc + Math.sin(px / (41 * sc) + .7) * 4 * sc - Math.max(0, Math.sin(px / (90 * sc) + 1)) * 16 * sc;
    const nearY = px => H * .935 + Math.sin(px / (120 * sc) + 5) * 7 * sc - Math.max(0, Math.sin(px / (37 * sc) + 2)) * 6 * sc;
    geo = { W, H, d, sc };
    let x; [base, x] = canvasOf(W, H, d);
    // water: lighter toward the surface, a soft sheen where the light comes in
    const wg = x.createLinearGradient(0, 0, 0, H); wg.addColorStop(0, '#0d3442'); wg.addColorStop(.35, '#072634'); wg.addColorStop(.7, '#041821'); wg.addColorStop(1, '#020b11');
    x.fillStyle = wg; x.fillRect(0, 0, W, H);
    glowAt(x, W * .42, -H * .08, Math.max(W, H) * .6, '120,210,215', .09);
    // far reef in the haze: blurred, bluish, small domes and branches along it
    x.save(); x.filter = `blur(${(1.6 * sc).toFixed(1)}px)`;
    ridge(x, farY, W, H, '#0b2e3b');
    x.strokeStyle = '#0b2e3b'; x.fillStyle = '#0b2e3b'; x.lineCap = 'round';
    for (let px = R() * 60; px < W; px += (50 + R() * 90) * sc) {
      if (R() < .5) { x.beginPath(); x.ellipse(px, farY(px) + 2, (12 + R() * 16) * sc, (8 + R() * 10) * sc, 0, Math.PI, 0); x.fill(); }
      else branch(x, R, px, farY(px) + 2, -Math.PI / 2 + (R() - .5) * .3, (12 + R() * 10) * sc, 2.2 * sc, 4, .55, .74);
    }
    x.restore();
    const hz = x.createLinearGradient(0, H * .6, 0, H * .78); hz.addColorStop(0, 'rgba(9,40,52,0)'); hz.addColorStop(1, 'rgba(9,40,52,.45)'); x.fillStyle = hz; x.fillRect(0, H * .6, W, H * .18);
    // violet sea fans behind the mid reef: from one holdfast, a few stems open in a fan and fork again and again
    // (no trunk: a gorgonian branches right from the rock), polyps at the tips
    const fans = Math.max(2, Math.round(W / 420));
    for (let i = 0; i < fans; i++) {
      const fx = (i + .3 + R() * .4) / fans * W, tips = [], h = (90 + R() * 50) * sc, stems = 4 + Math.floor(R() * 3), lean = (R() - .5) * .3;
      x.strokeStyle = 'rgba(150,140,225,.36)'; x.lineCap = 'round';
      for (let k = 0; k < stems; k++) branch(x, R, fx, midY(fx) + 4, -Math.PI / 2 + lean + (k / (stems - 1) - .5) * 1.25 + (R() - .5) * .1, h * .2, 2.4 * sc, 6, .24, .84, tips);
      x.fillStyle = 'rgba(190,180,250,.35)'; tips.forEach(([tx, ty]) => { x.beginPath(); x.arc(tx, ty, 1.1 * sc, 0, 7); x.fill(); });
    }
    // mid reef: the rock, a rim of light on its top, brain corals and tube sponges on it
    ridge(x, midY, W, H, '#082430');
    x.strokeStyle = 'rgba(127,207,189,.1)'; x.lineWidth = 1.2; x.beginPath(); for (let px = 0; px <= W; px += 6) px ? x.lineTo(px, midY(px)) : x.moveTo(px, midY(px)); x.stroke();
    for (let px = 0; px < W; px += 4) if (R() < .25) { x.fillStyle = `rgba(${R() < .5 ? '127,207,189' : '164,154,240'},${(.04 + R() * .06).toFixed(2)})`; x.fillRect(px, midY(px) + 4 + R() * (H - midY(px)) * .5, 1.5, 1.5); }
    const nb = Math.max(3, Math.round(W / 300));
    for (let i = 0; i < nb; i++) { const bx = (i + .2 + R() * .6) / nb * W, r = (26 + R() * 30) * sc; brain(x, R, bx, midY(bx) + r * .18, r); }
    for (let i = 0; i < Math.max(1, Math.round(W / 650)); i++) { const bx = (i + .55 + (R() - .5) * .3) / Math.max(1, Math.round(W / 650)) * W; sponges(x, R, bx, midY(bx) + 6, sc); }
    // the nine anemones' sockets: their glowing crowns are drawn live
    geo.an = Array.from({ length: 9 }, (_, i) => { const ax = (i + .5) / 9 * W + (rnd(i, 3) - .5) * W / 14; return { x: ax, y: midY(ax) + (6 + rnd(i, 4) * 10) * sc, s: (20 + rnd(i, 5) * 10) * sc, c: i % 3 === 1 ? 1 : 0, i }; });
    geo.an.forEach(a => { const g = x.createLinearGradient(a.x - a.s * .3, 0, a.x + a.s * .3, 0); g.addColorStop(0, '#0b2c38'); g.addColorStop(1, '#041820'); x.fillStyle = g;
      // a small rock, then the anemone's soft column, flaring a little at the oral disc
      x.save(); x.fillStyle = '#072430'; x.beginPath(); x.ellipse(a.x + a.s * .1, a.y + a.s * .05, a.s * .7, a.s * .26, 0, Math.PI, 0); x.fill(); x.restore();
      x.beginPath(); x.moveTo(a.x - a.s * .2, a.y); x.bezierCurveTo(a.x - a.s * .12, a.y - a.s * .25, a.x - a.s * .3, a.y - a.s * .4, a.x - a.s * .27, a.y - a.s * .5);
      x.quadraticCurveTo(a.x, a.y - a.s * .6, a.x + a.s * .27, a.y - a.s * .5); x.bezierCurveTo(a.x + a.s * .3, a.y - a.s * .4, a.x + a.s * .12, a.y - a.s * .25, a.x + a.s * .2, a.y); x.closePath(); x.fill(); });
    // the near layer, drawn over the live anemones and kelp: dark staghorn corals with lit tips, the sand
    let f; [fore, f] = canvasOf(W, H, d);
    f.lineCap = 'round';
    const ns = Math.max(3, Math.round(W / 280));
    for (let i = 0; i < ns; i++) {
      const sx = (i + R()) / ns * W, tips = [];
      // staghorn: a clump of thick antlers rising from one base, each forking twice, with round ends
      const n = 5 + Math.floor(R() * 3);
      f.strokeStyle = '#04161e';
      for (let k = 0; k < n; k++) branch(f, R, sx + (R() - .5) * 16 * sc, nearY(sx) + 8, -Math.PI / 2 + (k / (n - 1) - .5) * 1.9 + (R() - .5) * .2, (16 + R() * 16) * sc, 7.5 * sc, 2, .55, .88, tips);
      f.fillStyle = 'rgba(127,207,189,.16)'; tips.forEach(([tx, ty]) => { f.beginPath(); f.arc(tx, ty, 2.4 * sc, 0, 7); f.fill(); });
    }
    ridge(f, nearY, W, H, '#03121a');
    const sg = f.createLinearGradient(0, H * .93, 0, H); sg.addColorStop(0, 'rgba(1,6,10,0)'); sg.addColorStop(1, 'rgba(1,6,10,.7)'); f.fillStyle = sg; f.fillRect(0, H * .9, W, H * .1);
    f.strokeStyle = 'rgba(127,207,189,.05)'; f.lineWidth = 1;
    for (let k = 0; k < 7; k++) { const y0 = H * .955 + k * H * .007; f.beginPath(); for (let px = 0; px <= W; px += 10) { const y = Math.max(nearY(px) + 4, y0 + Math.sin(px / 23 + k * 2) * 1.5); px ? f.lineTo(px, y) : f.moveTo(px, y); } f.stroke(); }
    // light rays from the surface, at half resolution (they are soft anyway), faded during focus
    let r; [raysC, r] = canvasOf(W, H, .5);
    r.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const rx = W * .42 + (R() - .5) * Math.min(900, W * .8), w = (20 + R() * 55) * sc, tilt = (rx - W * .42) * .45 + 50 * sc, len = H * (.65 + R() * .25);
      const g = r.createLinearGradient(0, 0, 0, len); g.addColorStop(0, `rgba(170,240,240,${(.05 + R() * .05).toFixed(3)})`); g.addColorStop(1, 'rgba(170,240,240,0)');
      r.fillStyle = g; r.beginPath(); r.moveTo(rx - w * .3, 0); r.lineTo(rx + w * .3, 0); r.lineTo(rx + tilt + w, len); r.lineTo(rx + tilt - w, len); r.fill();
    }
    // the kelp on the right: a few long strands, drawn live
    const nk = W < 700 ? 3 : 5;
    geo.kelp = Array.from({ length: nk }, (_, k) => ({ x: W - (nk - k) * 22 * sc - 6, top: H * (.2 + rnd(k, 8) * .18), ph: rnd(k, 9) * 6 }));
    // the fish school and the marine snow
    const nf = Math.round(clamp(W * H / 16000, 34, 72));
    fish = Array.from({ length: nf }, (_, i) => { const u = rnd(i, 21), v = rnd(i, 22), gx = (Math.sqrt(-2 * Math.log(u + 1e-6)) * Math.cos(6.283 * v)) * .45, gy = (Math.sqrt(-2 * Math.log(u + 1e-6)) * Math.sin(6.283 * v)) * .45;
      return { x: W * .7, y: H * .3, vx: 0, vy: 0, ox: gx * 70 * sc, oy: gy * 28 * sc, s: (3.4 + rnd(i, 23) * 3) * sc, ph: rnd(i, 24) * 6.28, init: false }; });
    snow = Array.from({ length: Math.round(clamp(W * H / 12000, 40, 140)) }, (_, i) => ({ x: rnd(i, 31) * W, y: rnd(i, 32) * H, v: .05 + rnd(i, 33) * .18, r: .5 + rnd(i, 34) * 1.2, a: .18 + rnd(i, 35) * .32, p: rnd(i, 36) * 6.28 }));
    if (!spr) spr = [sprite('127,207,189'), sprite('164,154,240')];
  }
  // the school's centre: a slow figure of eight across the upper water, so the school keeps turning
  function schoolAt(W, H, u) { return [W * (.5 + .36 * Math.sin(u)), H * (.25 + .08 * Math.sin(2 * u + 1))]; }
  function stepFish(W, H, dt, time, still, rest, now) {
    const sc = geo.sc, u = time / 30000 * 2 * Math.PI, [cx0, cy0] = schoolAt(W, H, u), [nx, ny] = schoolAt(W, H, u + .02), hd = Math.atan2(ny - cy0, nx - cx0), ch = Math.cos(hd), sh = Math.sin(hd);
    const svx = (nx - cx0) * .175, svy = (ny - cy0) * .175; // the school's speed per frame (u moves .02 in ~95 ms)
    const circ = now - circleAt < 12000;
    if (circ && (!dialC || now - dialAt > 1000)) { dialAt = now; const el = document.querySelector('#sigil-card'), b = el && el.getBoundingClientRect(); dialC = b && b.width ? [b.left + b.width / 2, b.top + b.height / 2, b.width / 2 + 34 * sc, b.height / 2 + 26 * sc] : [W / 2, H / 2, 200, 200]; }
    const n = fish.length;
    for (let i = 0; i < n; i++) {
      const q = fish[i]; let tx, ty;
      if (circ) { // a long ribbon of fish going round the dial's card, once and a bit
        const a = (now - circleAt) / 12000 * 2.4 * Math.PI - Math.PI / 2 - i / n * 2.2 - .3 * Math.sin(i * 1.7), j = 1 + (q.oy / (60 * sc));
        tx = dialC[0] + Math.cos(a) * dialC[2] * j; ty = dialC[1] + Math.sin(a) * dialC[3] * j;
      } else { tx = cx0 + q.ox * ch - q.oy * sh + Math.sin(time / 1700 + q.ph) * 4 * sc; ty = cy0 + q.ox * sh + q.oy * ch + Math.cos(time / 2100 + q.ph) * 3 * sc; }
      if (still || !q.init) { q.x = tx; q.y = ty; q.vx = ch; q.vy = sh; q.init = true; continue; }
      // each fish wants the school's own speed plus a pull back to its place in the school (or on the ribbon), and
      // eases its velocity toward that: a shoal, not springs (springs made the school whirl)
      let wx = circ ? (tx - q.x) * .07 : svx + (tx - q.x) * .03, wy = circ ? (ty - q.y) * .07 : svy + (ty - q.y) * .03;
      if (rest && ptr) { const dx = q.x - ptr[0], dy = q.y - ptr[1], dd = Math.hypot(dx, dy), R0 = 150 * sc; if (dd < R0 && dd > 1) { const k = (1 - dd / R0) * 3.2 * sc / dd; wx += dx * k; wy += dy * k; } }
      const ease = 1 - Math.pow(.93, dt); q.vx += (wx - q.vx) * ease; q.vy += (wy - q.vy) * ease;
      const sp = Math.hypot(q.vx, q.vy), mx = (circ ? 4.5 : 3) * sc; if (sp > mx) { q.vx *= mx / sp; q.vy *= mx / sp; }
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
  }
  function drawFish(cx, fade, time) {
    for (const q of fish) {
      const a = Math.atan2(q.vy, q.vx), s = q.s, c = Math.cos(a), si = Math.sin(a), wag = Math.sin(time / 180 + q.ph) * .35;
      // the silver flash: the flank catches the light when the fish turns
      const flash = .5 + .5 * Math.cos(a * 2 + q.ph), al = (.16 + .2 * (s / (6.4 * geo.sc)) + .22 * flash * flash) * fade;
      cx.fillStyle = `rgba(${flash > .8 ? '226,250,248' : '186,226,226'},${al.toFixed(3)})`;
      cx.beginPath(); cx.ellipse(q.x, q.y, s, s * .34, a, 0, 6.283);
      const bx = q.x - c * s * .85, by = q.y - si * s * .85, ta = a + Math.PI + wag;
      cx.moveTo(bx, by); cx.lineTo(bx + Math.cos(ta - .5) * s * .75, by + Math.sin(ta - .5) * s * .75); cx.lineTo(bx + Math.cos(ta + .5) * s * .75, by + Math.sin(ta + .5) * s * .75); cx.closePath(); cx.fill();
    }
  }
  // an anemone: a crown of tentacles that sways, the tips glowing; o = how open (a closed one is a small dim bud)
  function anemone(cx, a, o, glowK, time) {
    const n = 16, s = a.s, by = a.y - s * .52, col = a.c ? '164,154,240' : '127,207,189', sp = spr[a.c];
    if (o < .04) { // still closed: a soft retracted bud on its column
      cx.fillStyle = `rgba(${col},.1)`; cx.beginPath(); cx.ellipse(a.x, by, s * .27, s * .13, 0, Math.PI, 0); cx.fill(); return;
    }
    cx.strokeStyle = `rgba(${col},${(.18 + .42 * o).toFixed(3)})`; cx.lineWidth = Math.max(1.2, s / 11); cx.lineCap = 'round'; cx.beginPath();
    const tips = [];
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1) - .5, sw = Math.sin(time / 1900 + a.i * 1.3 + u * 2) * .16 * o + Math.sin(time / 730 + k) * .03 * o;
      const ang = -Math.PI / 2 + u * (.45 + 2 * o) + sw, L = s * (.24 + .76 * o) * (.82 + .3 * rnd(k, a.i + 40)), bx = a.x + u * s * .48;
      const ex = bx + Math.cos(ang) * L, ey = by + Math.sin(ang) * L, mx = bx + Math.cos(ang + u * .9 + sw) * L * .55, my = by + Math.sin(ang + u * .9 + sw) * L * .55;
      cx.moveTo(bx, by); cx.quadraticCurveTo(mx, my, ex, ey); tips.push(ex, ey);
    }
    cx.stroke();
    if (o < .05) return;
    const prev = cx.globalCompositeOperation; cx.globalCompositeOperation = 'lighter';
    cx.globalAlpha = clamp(.35 * o * glowK); const R1 = s * 1.9; cx.drawImage(sp, a.x - R1, by - R1 * .8, R1 * 2, R1 * 2);
    cx.globalAlpha = clamp(.75 * o * glowK); const r = Math.max(3, s * .2);
    for (let k = 0; k < tips.length; k += 2) cx.drawImage(sp, tips[k] - r, tips[k + 1] - r, r * 2, r * 2);
    cx.globalAlpha = 1; cx.globalCompositeOperation = prev;
  }
  function kelp(cx, time, still) {
    const { H, sc } = geo;
    for (const k of geo.kelp) {
      const len = H - k.top, n = 26, pts = [];
      for (let j = 0; j <= n; j++) { const f = j / n, sw = still ? 0 : Math.pow(f, 1.3) * (16 * Math.sin(time / 3400 + k.ph + f * 1.6) + 2.5 * Math.sin(time / 1200 + k.ph * 2 + f * 5)) * sc; pts.push([k.x + sw + Math.sin(f * 7 + k.ph) * 5 * sc, H + 4 - f * len]); }
      cx.strokeStyle = '#0b3341'; cx.lineWidth = 2.6 * sc; cx.beginPath(); pts.forEach(([px, py], j) => j ? cx.lineTo(px, py) : cx.moveTo(px, py)); cx.stroke();
      // long blades on alternate sides, each hanging from a small float, leaning with the strand
      for (let j = 3; j < n; j += 2) {
        const [px, py] = pts[j], [qx, qy] = pts[j + 1] || pts[j], side = j % 4 === 1 ? 1 : -1, ang = Math.atan2(qy - py, qx - px) + side * .55, bl = (16 + 10 * Math.sin(j + k.ph)) * sc;
        cx.fillStyle = j % 3 ? 'rgba(16,70,76,.9)' : 'rgba(20,82,86,.85)'; cx.beginPath(); cx.ellipse(px + Math.cos(ang) * bl * .55, py + Math.sin(ang) * bl * .55, bl * .55, 3.4 * sc, ang, 0, 6.283); cx.fill();
        cx.fillStyle = 'rgba(127,207,189,.16)'; cx.beginPath(); cx.arc(px, py, 1.6 * sc, 0, 6.283); cx.fill();
      }
    }
  }
  ML.abyssDraw = (cx, W, H, slow, still, now, tm, rest) => {
    const dt = clamp((now - (lastNow || now)) / 16.7, 0, 4); lastNow = now;
    const k = W + 'x' + H;
    if (k !== key0) { if (k !== pend) { pend = k; pendAt = now; } if (!base || now - pendAt > 350) { key0 = k; pend = ''; build(W, H); } }
    const time = still ? 0 : tm, circ = now - circleAt < 12000;
    // the fish swim on real time (scaled down during focus), so they keep moving on skipped frames too
    stepFish(geo.W, geo.H, dt * (circ ? 1 : Math.max(.3, slow)), time, still, rest, now);
    if (typeof cx === 'function') return; // a skipped frame (game.js paints at ~30 fps)
    const target = root.dataset.timer === 'running' ? 1 : 0; fk = still ? target : fk + (target - fk) * .025;
    cx.drawImage(base, 0, 0, W, H);
    // the rays from the surface, breathing slowly; gone during focus
    const ra = (1 - fk) * (still ? .9 : .78 + .22 * Math.sin(time / 6500));
    if (ra > .02) { cx.globalAlpha = ra; cx.drawImage(raysC, still ? 0 : Math.sin(time / 9000) * 14, 0, W, H); cx.globalAlpha = 1; }
    // during focus the water darkens, so only the reef glows
    if (fk > .01) { cx.fillStyle = `rgba(1,7,12,${(.42 * fk).toFixed(3)})`; cx.fillRect(0, 0, W, H); }
    drawFish(cx, 1 - .35 * fk, time);
    // the anemones: one opens per session today (max 9), the newest one unfurling over a few seconds
    if (now - lastCount > 30000) {
      lastCount = now; const td = today(), n = Math.min(9, (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length);
      if (opened < 0) openAt = geo.an.map((_, i) => i < n ? -Infinity : Infinity); else for (let i = opened; i < n; i++) openAt[i] = now + (i - opened) * 1500;
      for (let i = n; i < 9; i++) openAt[i] = Infinity; opened = n;
    }
    const glowK = 1 + .7 * fk, order = [4, 2, 6, 1, 7, 3, 5, 0, 8]; // the first ones open near the middle of the reef
    order.forEach((ai, rank) => { const t0 = openAt[rank], o = still ? (t0 <= now ? 1 : 0) : clamp((now - t0) / 6000); anemone(cx, geo.an[ai], o * o * (3 - 2 * o), glowK, time); });
    cx.globalAlpha = 1 - .45 * fk; kelp(cx, time, still); cx.globalAlpha = 1;
    cx.drawImage(fore, 0, 0, W, H);
    // marine snow drifting down, slower during focus
    cx.fillStyle = '#d8f3f5';
    for (const p of snow) {
      if (!still) { p.y += p.v * dt * Math.max(.3, slow); if (p.y > H + 2) { p.y = -2; p.x = Math.random() * W; } }
      cx.globalAlpha = p.a * (1 - .3 * fk); cx.fillRect(p.x + (still ? 0 : Math.sin(time / 2600 + p.p) * 3), p.y, p.r, p.r);
    }
    cx.globalAlpha = 1;
  };

  /* ---------- Full screen: the dive log (3.44, option A of the « Plein écran » section of the proposals page) ----------
     focusplus.js draws the shell (top bar, dock) and calls ML.deepStyles.log. On the left a depth rule (0 → 400 m over
     the session, the column above you tinted); under the time the log line and the dive profile. The profile is the
     real dive: depth follows the session, the x axis is the clock, so a pause draws a flat stop. At the end you
     surface: the profile climbs with a stop, the pip goes back to SURFACE, bubbles rise and a lume seal is stamped. */
  let prof = [];
  function sample() {
    if (S.mode !== 'focus') return;
    const tot = S.total || 1, rem = ML.remainingNow(), d = clamp(1 - Math.max(0, rem) / tot), now = Date.now(), last = prof[prof.length - 1];
    if (!last || d < last.d - .005) { prof = [{ w: now - d * tot * 1000, d: 0 }]; if (d > 0) prof.push({ w: now, d }); return; } // a new dive (or a reload: a straight line so far)
    if (now - last.w < 4000 && Math.abs(d - last.d) < .01) return;
    prof.push({ w: now, d }); if (prof.length > 500) prof = prof.filter((_, i) => i % 2 === 0 || i === prof.length - 1);
  }
  on('tick', sample); on('timer', sample);
  const $ = id => document.getElementById(id);
  function logHtml(top, dock) {
    const dots = (n, k) => Array.from({ length: n }, (_, i) => `<i style="left:${(rnd(i, k) * 100).toFixed(1)}%;--d:${(k === 51 ? 16 + rnd(i, k + 1) * 18 : 2.6 + rnd(i, k + 1) * 2.2).toFixed(1)}s;--l:-${(rnd(i, k + 2) * (k === 51 ? 30 : 3)).toFixed(1)}s;--s:${(k === 51 ? 1 + rnd(i, k + 3) * 1.6 : 4 + rnd(i, k + 3) * 10).toFixed(1)}px;--a:${(.2 + rnd(i, k + 4) * .45).toFixed(2)}"></i>`).join('');
    const ticks = Array.from({ length: 17 }, (_, i) => { const m = i * 25; return `<i class="${m % 100 ? '' : 'q'}" style="top:${m / 4}%">${m % 100 ? '' : `<b>${m} m</b>`}</i>`; }).join('');
    return `<div class="dl-snow" aria-hidden="true">${dots(34, 51)}</div>${top}
      <div class="dl">
        <header class="dl-head"><span id="dl-no"></span><span id="dl-date"></span></header>
        <div class="dl-rule" aria-hidden="true"><span class="dl-fill" id="dl-fill"></span>${ticks}<em class="dl-pip" id="dl-pip"><span id="dl-pipl"></span></em></div>
        <div class="dl-main">
          <div class="dl-time" id="dl-time" role="timer"></div>
          <p class="dl-line" id="dl-line"></p>
          <svg class="dl-prof" viewBox="0 0 600 80" preserveAspectRatio="none" aria-hidden="true"><path class="dl-plan" id="dl-plan" vector-effect="non-scaling-stroke"/><path class="dl-path" id="dl-path" vector-effect="non-scaling-stroke"/><path class="dl-up" d="M552 72L566 22L582 22L596 6" pathLength="1" vector-effect="non-scaling-stroke"/></svg>
          <p class="dl-task" id="dl-task"></p>
        </div>
        <div class="dl-seal" id="dl-seal" aria-hidden="true"><small>${t('dl_up')}</small><b id="dl-sm"></b><small>400 M</small></div>
        <div class="dl-bub" aria-hidden="true">${dots(26, 61)}</div>
      </div>${dock}`;
  }
  function logRender({ rem, run, done, title }) {
    const tot = S.total || 1, d = done ? 1 : clamp(1 - Math.max(0, rem) / tot), td = today(), n = (S.sessions || []).filter(s => dayKey(new Date(s.at)) === td).length;
    const last = (S.sessions || [])[S.sessions.length - 1], mins = done && last ? last.mins : Math.round((tot - Math.max(0, rem)) / 60), p = done && last ? last.pauses || 0 : S.pauses || 0;
    $('dl-no').textContent = t('dl_no', { n: done ? n : n + 1 });
    $('dl-date').textContent = new Date().toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' }).toUpperCase() + ' · ' + t('mood_' + S.mood).toUpperCase();
    $('dl-time').textContent = MiniView.fmtClock(done ? 0 : rem);
    $('dl-line').textContent = t('dl_line', { m: mins, d: Math.round(400 * d), p: p ? ML.tn('dl_pauses', p) : t('dl_nopause') });
    $('dl-task').textContent = title;
    $('dl-fill').style.height = (done ? 0 : d * 100).toFixed(2) + '%';
    $('dl-pip').style.top = (done ? 0 : d * 100).toFixed(2) + '%';
    $('dl-pipl').textContent = done ? t('dl_surface') : !run && d > 0 ? t('dl_stop') : '';
    $('dl-sm').textContent = (last ? last.mins : 0) + ' MIN';
    // the profile so far, then the rest of the planned dive dotted (a pause pushes the end further right)
    const now = Date.now(), pts = prof.length ? prof : [{ w: now, d: 0 }], w0 = pts[0].w, end = Math.max(done ? pts[pts.length - 1].w : now + Math.max(0, rem) * 1000, w0 + 1000);
    const X = w => f1(552 * clamp((w - w0) / (end - w0))), Y = v => f1(6 + v * 66);
    $('dl-path').setAttribute('d', done && pts.length < 2 ? 'M0 6L552 72' // (nothing recorded, e.g. after a reload: a straight dive)
      : pts.map((q, i) => (i ? 'L' : 'M') + X(q.w) + ' ' + Y(q.d)).join('') + (done ? '' : `L${X(now)} ${Y(d)}`));
    $('dl-plan').setAttribute('d', done ? '' : `M${X(now)} ${Y(d)}L552 72`);
  }
  ML.deepStyles = Object.assign(ML.deepStyles || {}, {
    log: { html: logHtml, render: logRender, doneMs: () => ML.reducedMotion() ? 4200 : 5600 },
  });
})();
