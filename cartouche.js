// Cartouche (Scattered, light, Premium): the full screen "quest" (3.37) and the pixel touches around it.
// Chosen by the user from proposals/cartouche-plein/ (cartouche.png C+, cartouche2.png H1 + D, hippo.png B + N2):
// - the time huge in pixel digits, the hearts of the day, the task in a one-line dialogue box, the streak day;
// - a low road of stepping stones at the bottom (one per minute, at most 30): the little wizard steps from stone to stone,
//   followed by the familiar equipped in the Shop (birds fly over his shoulder); the royal hippo walks in profile, turns
//   to face you for a few seconds when you come back to the app, and dives into a pool for a moment at half time;
// - the ending: arrival at the end of the road → the chest opens (+minutes) and the campfire lights → « Partie
//   sauvegardée » by the fire, the familiar asleep → « Niveau terminé » on dark green (the wizard raises his hat on a
//   stage, stars, the details counted up, what the session earned, Continue → the usual end sheet).
// - In the task list: ticking a step by hand pops a pixel coin and sparkles.
// focusplus.js draws the shell (top bar, dock) and calls ML.deepStyles.quest.
(() => {
  'use strict';
  const { S, $, on, t, esc } = ML;

  ML.addStrings({
    fr: {
      dp_quest: 'Quête', qs_day: 'JOUR {n}', qs_sub: 'SESSION {n} · {a} / {b}', qs_paused: 'EN PAUSE', qs_mins: 'MINUTES',
      qs_saved: 'PARTIE SAUVEGARDÉE', qs_saved_l: '+{m} min · {o} session · jour {d}', qs_clear: 'NIVEAU TERMINÉ', qs_stage: '{o} SESSION',
      qs_focus: 'Focus', qs_steps: 'Cases', qs_pauses: 'Pauses', qs_distr: 'Distractions', qs_streak: 'Série', qs_days: '{n} jours',
      qs_xp: '+{n} XP', qs_gold: '+{n} OR', qs_floor: '+{n} ÉTAGE', qs_floors: '+{n} ÉTAGES', qs_go: 'CONTINUER', qs_free: 'Focus libre',
    },
    en: {
      dp_quest: 'Quest', qs_day: 'DAY {n}', qs_sub: 'SESSION {n} · {a} / {b}', qs_paused: 'PAUSED', qs_mins: 'MINUTES',
      qs_saved: 'GAME SAVED', qs_saved_l: '+{m} min · session {o} · day {d}', qs_clear: 'LEVEL CLEAR', qs_stage: 'SESSION {o}',
      qs_focus: 'Focus', qs_steps: 'Stones', qs_pauses: 'Pauses', qs_distr: 'Distractions', qs_streak: 'Streak', qs_days: '{n} days',
      qs_xp: '+{n} XP', qs_gold: '+{n} GOLD', qs_floor: '+{n} FLOOR', qs_floors: '+{n} FLOORS', qs_go: 'CONTINUE', qs_free: 'Free focus',
    },
  });

  const root = document.documentElement;
  const isOn = () => root.dataset.theme === 'arcade' && !!root.dataset.light;
  ML.cartoucheOn = isOn;
  const PAL = { 0: '#0F380F', 1: '#306230', 2: '#8BAC0F', 3: '#C4D88A', 4: '#E3EDC8', r: '#C8323C', y: '#E0A82E', w: '#F4F6E8', p: '#E07A8A' };

  /* ---------- Sprites: one character per pixel, '.' = empty ---------- */
  const HERO = ['........00....', '.......0110...', '......01110...', '......01110...', '.....011110...', '.....0111110..', '....01111110..', '....0yyyyyy0..',
    '..000000000000', '....04yy44440.', '....0y0wy4040.', '....04yy44440.', '.....444y440..', '....01111110..', '...0111111110.', '...0111y11110.', '..011111111110', '..000000000000', '....00...00...'];
  const HERO_B = HERO.map((r, j) => j === HERO.length - 1 ? '.....00.00....' : r); // second step: feet together
  const PETS = {
    owl: { fly: true, px: ['0........0', '0000000000', '0441001440', '0404004040', '0441yy1440', '.01122110.', '.01222210.', '.01222210.', '..0y00y0..'] },
    cat: { px: ['0.......0..', '00.....00..', '010000010..', '011111110..', '01y111y10..', '011101110.0', '.0111110..0', '.0111110.0.', '.00000000..'] },
    raven: { fly: true, px: ['..0000....', '.004000...', '.0000000yy', '..00000...', '.0000000..', '000000000.', '..0000000.', '...0..0...'] },
    fox: { px: ['0.......0...', '01.....10...', '011000110...', '011111110...', '010111010...', '044101440...', '.0444440....', '.0111110.00.', '.011111101440', '.000000000..'] },
    hippo: { px: ['...y.y.y........', '...yyyyy........', '..00..00........', '.0220022000000..', '.02222222222220.', '0220222222222220', '0333222222222220', '0303322222222220',
      '0333322222222220', '.033222222222220', '.000222222222220', '..022.022.0220..', '..000.000.000...'] },
  };
  const HIPPO_FRONT = ['.....y.y.y....', '.....yyyyy....', '..00.......00.', '..0200000020..', '..0222222220..', '..0202222020..', '.002222222200.', '03333333333330', '03330333303330', '0p3333333333p0', '.033333333330.', '.002222222200.', '..0220000220..', '..000....000..'];
  const HIPPO_SWIM = HIPPO_FRONT.slice(0, 9);
  const SP = {
    tree: ['....0000....', '..00222200..', '.0222222220.', '022221222220', '022122222120', '.0222222220.', '022222212220', '.0221222220.', '..00222200..', '....0110....', '....0110....', '...001100...'],
    tuft: ['.1..1.', '1.11.1', '.1111.'],
    chest: ['.0000000000.', '0yyyyyyyyyy0', '0y11111111y0', '000000000000', '0y11100111y0', '0y1110y111y0', '0y11111111y0', '000000000000'],
    chestO: ['.0000000000.', '0y11111111y0', '0yyyyyyyyyy0', '.0000000000.', '044444444440', '0y11111111y0', '0y11111111y0', '000000000000'],
    flame: ['....r.....', '...ryr....', '..ryyyr.r.', '..ryyyyrr.', '.rryy4yyr.', '..ryy4yr..'],
    logs: ['.00011000.', '0110000110', '.00....00.'],
    heart: ['.00.00.', '0rr0rr0', '0rrrrr0', '.0rrr0.', '..0r0..', '...0...'],
    heartE: ['.00.00.', '0440440', '0444440', '.04440.', '..040..', '...0...'],
    heartD: ['.00.00.', '0110110', '0111110', '.01110.', '..010..', '...0...'],
    star: ['.....y.....', '.....y.....', '....yyy....', 'yyyyyyyyyyy', '.yyyyyyyyy.', '..yyyyyyy..', '...yyyyy...', '..yyy.yyy..', '..yy...yy..', '.y.......y.'],
    coin: ['..0000..', '.0yyyy0.', '0yy44yy0', '0yy4yyy0', '0yyyyyy0', '0yyyyyy0', '.0yyyy0.', '..0000..'],
    tri: ['0...', '00..', '000.', '0000', '000.', '00..', '0...'],
    triD: ['0000000', '.00000.', '..000..', '...0...'],
  };
  SP.starE = SP.star.map(r => r.replace(/y/g, '1'));
  // one sprite as SVG rects (runs of the same colour on a row are merged)
  function px(rows, s, o = {}) {
    const { x = 0, y = 0, flip = false, pal = PAL } = o, w = Math.max(...rows.map(r => r.length));
    let out = '';
    rows.forEach((row, j) => {
      const r = flip ? [...row.padEnd(w, '.')].reverse().join('') : row;
      for (let i = 0; i < r.length;) {
        const c = r[i]; let k = i + 1; while (k < r.length && r[k] === c) k++;
        if (pal[c]) out += `<rect x="${x + i * s}" y="${y + j * s}" width="${(k - i) * s}" height="${s}" fill="${pal[c]}"/>`;
        i = k;
      }
    });
    return out;
  }
  const svg = (rows, s, cls = '') => { const w = Math.max(...rows.map(r => r.length)); return `<svg class="${cls}" viewBox="0 0 ${w * s} ${rows.length * s}" width="${w * s}" height="${rows.length * s}" shape-rendering="crispEdges" aria-hidden="true">${px(rows, s)}</svg>`; };

  // The sky's clouds: one tile (300 × 60 pixels, four clouds) that the CSS repeats and slides slowly
  const CLOUD = ['....00000.......', '..005555500.....', '.05555555550000.', '0555555555555550', '0555555555555550', '.00000000000000.'];
  const CLOUD2 = ['.....0000...', '..000555500.', '.05555555550', '055555555550', '.0000000000.'];
  const cpal = { 0: '#B9D08A', 5: '#E6EFCB' };
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 60" shape-rendering="crispEdges">${px(CLOUD, 1, { x: 18, y: 8, pal: cpal })}${px(CLOUD2, 1, { x: 96, y: 30, pal: cpal })}${px(CLOUD, 1, { x: 170, y: 14, pal: cpal })}${px(CLOUD2, 1, { x: 246, y: 4, pal: cpal })}</svg>`;
  root.style.setProperty('--qs-clouds', `url("data:image/svg+xml,${encodeURIComponent(tile)}")`);

  /* ---------- State ---------- */
  const todays = () => { const td = ML.today(); return S.sessions.filter(s => ML.dayKey(new Date(s.at)) === td); };
  const petKey = () => { const f = S.econ && S.econ.equip && S.econ.equip.familiar; return PETS[f] ? f : 'owl'; };
  const stonesOf = () => Math.max(5, Math.min(30, ending ? ending.s.mins : Math.round(S.total / 60))); // the ending keeps the session's road
  const ord = n => S.lang === 'en' ? String(n) : n === 1 ? '1re' : n + 'e';
  let ending = null; // { at, s, floors0, streak } while the ending plays
  let lastProg = 0, lastStep = -1, roadW = 0, said = '', sayT = null, frontT = null, diveT = null, phaseTimers = [], countRaf = null;
  const geo = { vw: 1440, xs: [], ys: [] };

  /* ---------- The screen ---------- */
  function html(top, dock) {
    return `${top}
      <div class="qs">
        <div class="qs-top"><span class="qs-hearts" id="qs-hearts"></span>
          <p class="qs-say"><span class="qs-tri">${svg(SP.tri, 3)}</span><span id="qs-say"></span><span class="qs-more">${svg(SP.triD, 3)}</span></p>
          <span class="qs-day" id="qs-day"></span></div>
        <div class="qs-mid">
          <div class="qs-time" id="qs-time" role="timer"></div>
          <div class="qs-gain" id="qs-gain" aria-hidden="true"><b></b><small>${esc(t('qs_mins'))}</small></div>
          <div class="qs-saved" id="qs-saved"><b>${esc(t('qs_saved'))}</b><small id="qs-saved-l"></small></div>
          <p class="qs-sub" id="qs-sub"></p>
        </div>
        <div class="qs-road" id="qs-road" aria-hidden="true"></div>
        <div class="qs-board" id="qs-board" hidden></div>
      </div>${dock}`;
  }
  // the road: field, a few trees, the stones, the camp (logs + chest) at the end, the wizard and the familiar
  function buildRoad() {
    const box = $('qs-road'); if (!box) return;
    const r = box.getBoundingClientRect(), H = 150, VW = Math.max(400, Math.round(H * (r.width || 1440) / (r.height || 150)));
    roadW = r.width; geo.vw = VW;
    geo.campX = Math.round(Math.min(VW * .86, VW - 96));
    const x0 = VW * (VW < 700 ? .05 : .08), x1 = Math.min(VW * .78, geo.campX - 50);
    const n = Math.min(stonesOf(), Math.floor((x1 - x0) / 28) + 1); // narrow screens: fewer stones, each a few minutes
    geo.xs = Array.from({ length: n }, (_, i) => Math.round(x0 + i * (x1 - x0) / (n - 1)));
    geo.ys = geo.xs.map((_, i) => 118 + Math.round(Math.sin(i / 3.2) * 5));
    let sd = 7; const R = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    let deco = '';
    [[.015, 40], [(VW - 36) / VW, 22], [.33, 30], [.6, 34]].forEach(([fx, y], k) => { if (k < 2 || VW > 900) deco += px(SP.tree, 3, { x: Math.round(VW * fx), y }); });
    for (let k = 0; k < Math.round(VW / 160); k++) { const x = Math.round(R() * VW), y = 92 + Math.round(R() * 48); if (geo.xs.some(sx => Math.abs(sx - x) < 26) && y > 100) continue; deco += px(SP.tuft, 3, { x, y }); }
    const stones = geo.xs.map((x, i) => `<g class="qs-stone" data-i="${i}"><rect x="${x - 2}" y="${geo.ys[i] - 2}" width="26" height="14" fill="${PAL[1]}"/><rect class="top" x="${x}" y="${geo.ys[i]}" width="22" height="10"/></g>`).join('');
    const pk = petKey(), pet = PETS[pk];
    const petSvg = pk === 'hippo'
      ? `<g class="hp-side">${px(pet.px, 3, { flip: true })}</g><g class="hp-front">${px(HIPPO_FRONT, 3, { x: 3 })}</g>
         <g class="hp-dive"><clipPath id="qs-hclip"><rect x="-20" y="-60" width="100" height="98"/></clipPath>
           <g clip-path="url(#qs-hclip)"><g class="hp-swim">${px(HIPPO_SWIM, 3, { x: 3, y: 12 })}</g></g>
           <g class="hp-pool"><rect x="-10" y="36" width="68" height="9" fill="${PAL[1]}"/><rect x="-4" y="45" width="56" height="5" fill="${PAL[1]}"/><rect x="2" y="38" width="10" height="3" fill="${PAL[3]}"/><rect x="30" y="41" width="12" height="3" fill="${PAL[3]}"/></g></g>`
      : px(pet.px, 3);
    const ph = pet.px.length * 3;
    box.innerHTML = `<svg viewBox="0 0 ${VW} ${H}" preserveAspectRatio="xMidYMax meet" shape-rendering="crispEdges">
      <rect x="0" y="22" width="${VW}" height="${H - 22}" class="field"/><rect x="0" y="22" width="${VW}" height="4" fill="${PAL[1]}"/>
      ${deco}${stones}
      <g class="qs-camp" transform="translate(${geo.campX} 0)">
        <g class="qs-logs">${px(SP.logs, 3, { x: 0, y: 116 })}</g><g class="qs-flame">${px(SP.flame, 3, { x: 0, y: 98 })}</g>
        <g class="qs-chest">${px(SP.chest, 3, { x: 44, y: 101 })}</g><g class="qs-chest-o">${px(SP.chestO, 3, { x: 44, y: 101 })}</g>
        <g class="qs-spark">${[[-22, -16], [-12, -30], [6, -36], [24, -30], [34, -16]].map(([dx, dy]) => `<rect x="${62 + dx}" y="${100 + dy}" width="5" height="5" fill="${PAL.y}"/>`).join('')}</g></g>
      <g class="qs-pet ${pk} ${pet.fly ? 'fly' : 'walk'}" id="qs-pet"><g class="bob" data-h="${ph}">${petSvg}</g>
        <g class="qs-zz"><text x="${pk === 'hippo' ? 40 : 30}" y="-4">z</text><text x="${pk === 'hippo' ? 50 : 40}" y="-14">z</text></g></g>
      <g class="qs-hero" id="qs-hero"><g class="f1">${px(HERO, 3)}</g><g class="f2">${px(HERO_B, 3)}</g></g>
    </svg>`;
    lastStep = -1; place(true);
  }
  // where the wizard and the familiar stand: on stone k (or at the camp, k = 'camp')
  function place(instant, k) {
    const hero = $('qs-hero'), pet = $('qs-pet'); if (!hero || !geo.xs.length) return;
    const n = geo.xs.length;
    let hx, hy;
    if (k === 'camp') { hx = geo.campX - 46; hy = 128; } else { const i = Math.max(0, Math.min(n - 1, k == null ? stepNow() : k)); hx = geo.xs[i] - 10; hy = geo.ys[i] + 4; }
    const pk = petKey(), fly = PETS[pk].fly, ph = PETS[pk].px.length * 3;
    const px0 = hx - (pk === 'hippo' ? 52 : fly ? 26 : 40), py0 = fly ? hy - 57 - 30 : hy - ph + (pk === 'hippo' ? 0 : 2);
    [hero, pet].forEach(g => g.classList.toggle('no-tr', !!instant));
    hero.style.transform = `translate(${hx}px, ${hy - 57}px)`;
    pet.style.transform = `translate(${px0}px, ${py0}px)`;
    if (instant) requestAnimationFrame(() => { hero.classList.remove('no-tr'); pet.classList.remove('no-tr'); });
  }
  const progNow = () => S.mode === 'focus' ? Math.max(0, Math.min(1, 1 - Math.max(0, ML.remainingNow()) / S.total)) : 0;
  const stepNow = () => Math.min(geo.xs.length - 1, Math.floor(progNow() * geo.xs.length + 1e-6));
  function walk(ms = 900) {
    const hero = $('qs-hero'), pet = $('qs-pet'); if (!hero) return;
    hero.classList.add('walking'); pet.classList.add('walking');
    setTimeout(() => { hero.classList.remove('walking'); pet.classList.remove('walking'); }, ms);
  }
  function hearts(n) {
    const slots = Math.max(5, n);
    return Array.from({ length: slots }, (_, i) => svg(i < n ? SP.heart : SP.heartE, 4)).join('');
  }
  // the task typed into the dialogue box, letter by letter
  function say(text) {
    const el = $('qs-say'); if (!el) return;
    if (said === text) { if (el.textContent !== text && !sayT) el.textContent = text; return; } // a rebuilt screen shows it whole
    said = text; clearInterval(sayT);
    if (ML.reducedMotion()) { el.textContent = text; return; }
    let k = 0; el.textContent = '';
    const stop = () => { clearInterval(sayT); sayT = null; };
    sayT = setInterval(() => { const e = $('qs-say'); if (!e) return stop(); e.textContent = text.slice(0, ++k); if (k >= text.length) stop(); }, 40);
  }

  function render(c) {
    const deep = c.deep, n = todays().length + (ending ? 0 : 1), mins = Math.round(S.total / 60);
    if (!$('qs-road').firstChild || Math.abs($('qs-road').getBoundingClientRect().width - roadW) > 2) buildRoad();
    $('qs-hearts').innerHTML = hearts(todays().length);
    $('qs-day').textContent = t('qs_day', { n: ML.streaks().cur });
    say(ending ? ending.s.title : c.title || t('qs_free'));
    if (ending) return; // the ending drives the screen until Continue
    $('qs-time').textContent = MiniView.fmtClock(c.done ? 0 : c.rem);
    const steps = geo.xs.length, k = stepNow();
    $('qs-sub').textContent = S.mode === 'break' ? $('state').textContent.toUpperCase()
      : !c.run && c.rem < S.total ? t('qs_paused') : t('qs_sub', { n, a: S.mode === 'focus' ? k : 0, b: steps });
    if (k !== lastStep) { const moved = lastStep >= 0 && k > lastStep; lastStep = k; place(!moved); if (moved && !ML.reducedMotion()) walk(); }
    deep.querySelectorAll('.qs-stone').forEach(s => s.classList.toggle('past', +s.dataset.i < k));
    // the royal hippo cools off in a pool at half time
    const p = progNow();
    if (petKey() === 'hippo' && c.run && lastProg < .5 && p >= .5 && p < .6) dive();
    lastProg = p;
    deep.dataset.qmins = mins;
  }
  function dive() {
    const pet = $('qs-pet'); if (!pet || ML.reducedMotion()) return;
    pet.classList.remove('front'); pet.classList.add('dive'); clearTimeout(diveT);
    diveT = setTimeout(() => { const p = $('qs-pet'); if (p) p.classList.remove('dive'); }, 3400);
  }
  // back in the app: the hippo turns to face you, then goes back to the road
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const pet = $('qs-pet'); if (!pet || !pet.classList.contains('hippo') || pet.classList.contains('dive')) return;
    pet.classList.add('front'); clearTimeout(frontT);
    frontT = setTimeout(() => { const p = $('qs-pet'); if (p) p.classList.remove('front'); }, 3500);
  });
  addEventListener('resize', () => { if ($('qs-road')) { roadW = 0; } });

  /* ---------- The ending ---------- */
  const PHASES = [['arrive', 0], ['chest', 1500], ['save', 3500], ['board', 5800]];
  const DONE_MS = 16000; // the board waits for Continue, at most this long
  on('session', s => {
    if (!s || s.mins < 1 || !isOn() || !(ML.deepStyleNow && ML.deepStyleNow() === 'quest')) return;
    phaseTimers.forEach(clearTimeout); cancelAnimationFrame(countRaf);
    ending = { at: Date.now(), s, floors0: (S.tower && S.tower.floors) || 0, n: todays().length, streak: ML.streaks().cur, phase: '' };
    if (ML.reducedMotion()) { phase('save'); return; }
    phaseTimers = PHASES.map(([p, ms]) => setTimeout(() => phase(p), ms));
  });
  function phase(p) {
    if (!ending) return;
    ending.phase = p; apply();
  }
  // (re)draws the ending at its current phase: focusplus rebuilds the screen on 'session', so this must be repeatable
  function apply() {
    const deep = $('deep'); if (!ending || !deep || !$('qs-road')) return;
    const e = ending, s = e.s;
    deep.dataset.qphase = e.phase;
    $('qs-time').textContent = '00:00';
    $('qs-sub').textContent = '';
    if (e.phase === 'arrive') { place(false, geo.xs.length - 1); walk(1400); setTimeout(() => { if (ending) { place(false, 'camp'); walk(700); } }, 700); }
    else place(true, 'camp');
    $('qs-gain').querySelector('b').textContent = '+' + s.mins;
    $('qs-saved-l').textContent = t('qs_saved_l', { m: s.mins, o: ord(e.n), d: e.streak });
    const board = $('qs-board');
    if (e.phase === 'board') { if (board.hidden) showBoard(); }
    else board.hidden = true;
  }
  // a screen rebuilt after the board was counted shows it as it ended (no second entrance)
  function showBoard() {
    const b = $('qs-board'); if (!b || !ending) return;
    b.innerHTML = boardHtml(); b.hidden = false; b.classList.toggle('static', !!ending.shown);
    $('qb-go').onclick = finish;
    if (ending.shown) { b.querySelectorAll('dd').forEach(d => d.classList.add('in')); $('qb-go').classList.add('in'); } else countUp();
  }
  function boardHtml() {
    const e = ending, s = e.s, stars = [true, !s.pauses, (s.distractions || 0) <= 1];
    const floors = Math.max(0, ((S.tower && S.tower.floors) || 0) - e.floors0), gold = Math.floor((s.xp || 0) / 4);
    const rows = [['qs_focus', MiniView.fmtClock(s.mins * 60)], ['qs_steps', geo.xs.length + ' / ' + geo.xs.length], ['qs_pauses', s.pauses || 0], ['qs_distr', s.distractions || 0], ['qs_streak', t('qs_days', { n: e.streak })]];
    const pk = petKey(), pet = pk === 'hippo' ? HIPPO_FRONT : PETS[pk].px;
    return `<div class="qb-frame">
      <div class="qb-stage"><div class="qb-hero"><span class="qb-hat">${svg(HERO.slice(0, 8), 7)}</span>${svg(HERO.map((r, j) => j < 8 ? '' : r).slice(8), 7)}</div>
        <span class="qb-pet">${svg(pet, 6)}</span><span class="qb-spark"><i></i><i></i><i></i><i></i><i></i></span>
        <div class="qb-podium">${esc(t('qs_stage', { o: ord(e.n) }).toUpperCase())}</div></div>
      <div class="qb-board">
        <h2>${esc(t('qs_clear'))}</h2>
        <div class="qb-stars">${stars.map((on, i) => `<span style="--d:${i}">${svg(on ? SP.star : SP.starE, 6)}</span>`).join('')}</div>
        <dl>${rows.map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd data-v="${esc(String(v))}">${esc(String(v))}</dd></div>`).join('')}</dl>
        <p class="qb-gain">${esc(t('qs_xp', { n: s.xp || 0 }))}<span>${esc(t('qs_gold', { n: gold }))}</span>${floors ? `<span>${esc(t(floors > 1 ? 'qs_floors' : 'qs_floor', { n: floors }))}</span>` : ''}</p>
        <div class="qb-hearts">${hearts(todays().length)}</div>
        <button type="button" class="qb-go" id="qb-go">${esc(t('qs_go'))}</button>
      </div></div>`;
  }
  // the details are counted up one by one (numbers only), then Continue appears
  function countUp() {
    const dds = [...document.querySelectorAll('#qs-board dd')], t0 = performance.now();
    const go = $('qb-go');
    dds.forEach(d => { d.dataset.v = d.textContent; });
    const step = now => {
      const k = (now - t0) / 260;
      dds.forEach((d, i) => {
        const v = d.dataset.v, f = Math.max(0, Math.min(1, k - i));
        d.classList.toggle('in', f > 0);
        d.textContent = f >= 1 ? v : v.replace(/\d+/g, m => String(Math.round(+m * f)).padStart(m.length > 1 && v.includes(':') ? m.length : 0, '0'));
      });
      if (k < dds.length + 1) countRaf = requestAnimationFrame(step); else { if (ending) ending.shown = true; go.classList.add('in'); go.focus({ preventScroll: true }); }
    };
    countRaf = requestAnimationFrame(step);
  }
  function finish() {
    if (!ending) return;
    phaseTimers.forEach(clearTimeout); cancelAnimationFrame(countRaf);
    ending = null; lastStep = -1;
    const deep = $('deep'); if (deep) delete deep.dataset.qphase;
    if (ML.deepEndNow) ML.deepEndNow();
  }

  ML.deepStyles = Object.assign(ML.deepStyles || {}, {
    quest: {
      doneMs: () => ML.reducedMotion() ? 4200 : DONE_MS,
      html,
      built: () => { roadW = 0; buildRoad(); if (ending) apply(); },
      render,
      over: () => { if (ending) finish(); }, // the full screen was closed or the ending timed out
    },
  });

  /* ---------- Ticking a step by hand: a pixel coin and sparkles (Cartouche only) ---------- */
  document.addEventListener('change', e => {
    const cb = e.target.closest && e.target.closest('input[data-sub], input[data-dsub]');
    if (!cb || !cb.checked || !isOn() || ML.reducedMotion()) return;
    const li = cb.closest('.task'), id = li ? li.dataset.id : S.activeId, task = S.tasks.find(x => x.id === id);
    const sub = task && (task.subs || []).find(s => s.id === (cb.dataset.sub || cb.dataset.dsub));
    const xp = sub && !sub.xpGiven && !task.sample && !task.done ? Math.max(2, Math.round(ML.taskXp(task) / 10)) : 0;
    const r = cb.getBoundingClientRect(); if (!r.width) return;
    const fx = document.createElement('div'); fx.className = 'qs-pop'; fx.setAttribute('aria-hidden', 'true');
    fx.style.left = (r.left + r.width / 2) + 'px'; fx.style.top = (r.top + r.height / 2) + 'px';
    fx.innerHTML = `<span class="c">${svg(SP.coin, 3)}</span>${[0, 1, 2, 3, 4, 5].map(i => `<i style="--a:${i * 60}deg"></i>`).join('')}${xp ? `<b>+${xp} XP</b>` : ''}`;
    document.body.appendChild(fx);
    setTimeout(() => fx.remove(), 1100);
  }, true);
})();
