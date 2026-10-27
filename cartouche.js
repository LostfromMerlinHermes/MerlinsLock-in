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
// 3.38: the timer is a pixel pocket stopwatch (crown, pushers, a dark bezel 10–60, one tick a minute, a red marker), and
// the background a living pixel landscape (castle, windmill, village, river and bridge, sheep; day / evening / night by
// the hour), or the calmer old overworld: S.cartouche.level 'plein' | 'calme', picked in a corner pill like Washi's.
(() => {
  'use strict';
  const { S, $, on, t, esc, save } = ML;

  ML.addStrings({
    fr: {
      dp_quest: 'Quête', qs_day: 'JOUR {n}', qs_sub: 'SESSION {n} · {a} / {b}', qs_paused: 'EN PAUSE', qs_mins: 'MINUTES',
      qs_saved: 'PARTIE SAUVEGARDÉE', qs_saved_l: '+{m} min · {o} session · jour {d}', qs_clear: 'NIVEAU TERMINÉ', qs_stage: '{o} SESSION',
      qs_focus: 'Focus', qs_steps: 'Cases', qs_pauses: 'Pauses', qs_distr: 'Distractions', qs_streak: 'Série', qs_days: '{n} jours',
      qs_xp: '+{n} XP', qs_gold: '+{n} OR', qs_floor: '+{n} ÉTAGE', qs_floors: '+{n} ÉTAGES', qs_go: 'CONTINUER', qs_free: 'Focus libre',
      cx_set: 'Cartouche', cx_level: 'Décor', cx_plein: 'Complet', cx_calme: 'Calme',
    },
    en: {
      dp_quest: 'Quest', qs_day: 'DAY {n}', qs_sub: 'SESSION {n} · {a} / {b}', qs_paused: 'PAUSED', qs_mins: 'MINUTES',
      qs_saved: 'GAME SAVED', qs_saved_l: '+{m} min · session {o} · day {d}', qs_clear: 'LEVEL CLEAR', qs_stage: 'SESSION {o}',
      qs_focus: 'Focus', qs_steps: 'Stones', qs_pauses: 'Pauses', qs_distr: 'Distractions', qs_streak: 'Streak', qs_days: '{n} days',
      qs_xp: '+{n} XP', qs_gold: '+{n} GOLD', qs_floor: '+{n} FLOOR', qs_floors: '+{n} FLOORS', qs_go: 'CONTINUE', qs_free: 'Free focus',
      cx_set: 'Cartouche', cx_level: 'Scenery', cx_plein: 'Full', cx_calme: 'Calm',
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

  /* ---------- Settings: the scenery, full or calm (a corner pill, like Washi's) ---------- */
  ML.defaults(() => ({ cartouche: { level: 'plein' } }));
  const level = () => (S.cartouche && S.cartouche.level) || 'plein';
  const set = document.createElement('div');
  set.className = 'washi-set'; set.id = 'cart-set'; set.hidden = true; set.setAttribute('role', 'group'); // (same look as Washi's pill)
  function renderSet() {
    const wb = $('world-btn'), show = isOn() && !!wb && !wb.hidden, brand = document.querySelector('.top > .brand');
    if (root.classList.contains('mnav-on') && brand) { if (brand.nextElementSibling !== set) brand.after(set); }
    else if (wb && wb.nextElementSibling !== set) wb.after(set);
    set.hidden = !show; if (!show) return;
    const key = level() + '|' + S.lang; if (set.dataset.key === key) return; set.dataset.key = key;
    set.setAttribute('aria-label', t('cx_set'));
    set.innerHTML = `<label class="ws-sel"><select id="cx-level" aria-label="${esc(t('cx_level'))}">${['plein', 'calme'].map(v => `<option value="${v}"${v === level() ? ' selected' : ''}>${esc(t('cx_' + v))}</option>`).join('')}</select><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg></label>`;
  }
  set.addEventListener('change', e => { if (e.target.id !== 'cx-level') return; S.cartouche = Object.assign({}, S.cartouche, { level: e.target.value }); save(); sync(); });

  /* ---------- The pocket stopwatch (both levels) ---------- */
  // painted pixel by pixel at 160×160 into an <img> in .ring-wrap (an image, so the energy picker's clone of the dial keeps it)
  const DS = 160, dcv = document.createElement('canvas'); dcv.width = dcv.height = DS;
  const dial = document.createElement('img'); dial.className = 'cx-dial'; dial.alt = ''; dial.setAttribute('aria-hidden', 'true');
  let dialKey = '';
  function paintDial(prog) {
    const g = dcv.getContext('2d'), C = PAL, cx = 80, cy = 84;
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
    const ring = (r0, r1, col) => { for (let y = -r1; y <= r1; y++) for (let x = -r1; x <= r1; x++) { const d = Math.hypot(x, y); if (d >= r0 && d < r1) R(cx + x, cy + y, 1, 1, col(d)); } };
    const at = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r], ang = f => -Math.PI / 2 + f * Math.PI * 2;
    const DIG = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'] };
    const num = (s, x0, y0, c) => { let x = x0 - (s.length * 4 - 1) / 2; for (const ch of s) { DIG[ch].forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') R(x + i, y0 + j, 1, 1, c); })); x += 4; } };
    g.clearRect(0, 0, DS, DS);
    R(74, 4, 12, 7, C[1]); R(72, 4, 16, 2, C[0]); R(77, 11, 6, 5, C[0]); // crown and stem
    [-1, 1].forEach(s => { const [x, y] = at(-Math.PI / 2 + s * .78, 72); R(x - 4, y - 4, 8, 8, C[0]); R(x - 3, y - 3, 6, 6, C[1]); }); // pushers
    ring(58, 70, d => d > 68 || d < 60 ? C[0] : C[1]);
    ring(0, 58, () => C[4]);
    for (let m = 0; m < 60; m++) { const a = ang(m / 60), big = m % 5 === 0, lit = m / 60 < prog; for (let r = big ? 49 : 52; r < 57; r++) { const [x, y] = at(a, r); R(x, y, big ? 2 : 1, big ? 2 : 1, lit ? C[2] : big ? C[0] : C[1]); } }
    [0, 10, 20, 30, 40, 50].forEach(n => { const [x, y] = at(ang(n / 60), 64); num(String(n || 60), x, y - 2, C[4]); });
    if (prog > 0) { const [px, py] = at(ang(prog), 46); R(px - 2, py - 2, 5, 5, C.r); const [qx, qy] = at(ang(prog), 50); R(qx - 1, qy - 1, 3, 3, C.r); }
    return dcv.toDataURL();
  }
  function renderDial() {
    const wrap = document.querySelector('#sigil-card .ring-wrap'); if (!wrap) return;
    if (!isOn()) { if (dial.isConnected) dial.remove(); dialKey = ''; return; }
    if (dial.parentNode !== wrap) wrap.prepend(dial);
    const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot, started = rem < tot - .5 || ML.running();
    const prog = started ? Math.max(0, Math.min(1, 1 - Math.max(0, rem) / tot)) : 0, key = Math.round(prog * 240);
    if (key === dialKey) return; dialKey = key; dial.src = paintDial(prog);
  }
  on('tick', renderDial); on('timer', renderDial); on('render', renderDial);

  /* ---------- The living landscape (level 'plein') ---------- */
  // Painted at a quarter of the screen size (a third on phones) and scaled up with crisp pixels. The still parts are
  // painted once per size / time of day into `base`; each frame (8 a second, 3 while a focus runs) adds what moves:
  // clouds, the windmill, chimney smoke, the castle flag, glints on the river, birds now and then, sheep, fireflies at night.
  const scv = document.createElement('canvas'); scv.id = 'cx-scene'; scv.setAttribute('aria-hidden', 'true');
  let base = null, baseKey = '', SW = 0, SH = 0, K = 4, vt = 0, lastF = 0, raf = null, L = null;
  const dayPart = () => { const h = new Date().getHours(); return h >= 21 || h < 6 ? 'night' : h >= 18 || h < 7 ? 'evening' : 'day'; };
  const COL = {
    day: { sky: ['#BCD38B', '#C6DA98', '#D0E1A6', '#D9E8B4', '#E1EDC1'], far: '#A9C27E', far2: '#98B66A', snow: '#EEF3DC', hill: '#93B160', mid: '#8FB05A', ground: '#9DBB62', water: '#A9CBA8', glint: '#E3EDC8', wall: '#E3EDC8', cloud: '#EDF3D6', cloudO: '#BCD38B', smoke: '#E9EFD6', road: '#E9EFCF', tree: '#8BAC0F', shade: '#306230' },
    evening: { sky: ['#D9B77E', '#E2C48A', '#E9D198', '#EEDCA8', '#F1E5BA'], far: '#B9A57A', far2: '#A99B6E', snow: '#F4EBCF', hill: '#A3A26C', mid: '#9DA864', ground: '#A9AE6A', water: '#C9C38F', glint: '#F6EBCB', wall: '#EFE6C8', cloud: '#F6EBCB', cloudO: '#DCC28E', smoke: '#F2E6C8', road: '#EFE4C2', tree: '#7E9A3A', shade: '#3E5A28' },
    night: { sky: ['#16301F', '#1B3726', '#213F2D', '#284735', '#30503D'], far: '#2C4A38', far2: '#244231', snow: '#4F6E5A', hill: '#244231', mid: '#21402E', ground: '#1F3B2B', water: '#2D5446', glint: '#4F7D6A', wall: '#4D6A55', cloud: '#3B5A47', cloudO: '#2F4E3C', smoke: '#4F6E5A', road: '#4D6A55', tree: '#1C3A28', shade: '#0F380F' },
  };
  function layout() { // where things stand, in scene pixels: the castle, the windmill and the village keep to the side margins
    const W = SW, H = SH, narrow = W < 200;
    return { W, H, sun: [W * .8, H * .13], ridge: H * .5, castle: [Math.max(14, W * .07), H * .38], mill: [W * (narrow ? .86 : .93), H * .5],
      village: [W * (narrow ? .62 : .82), H * .66], river: H * .7, bridge: [W * (narrow ? .7 : .86), H * .76], ground: H * .87, sheep: [W * .05, H * .92] };
  }
  function paintBase(mode) {
    const W = SW, H = SH, P = COL[mode], c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    let sd = 11; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    L = layout();
    // the sky in bands, dithered where they meet
    const bh = Math.ceil(H * .1); P.sky.forEach((col, i) => R(0, i * bh, W, i === P.sky.length - 1 ? H : bh, col));
    for (let i = 1; i < P.sky.length; i++) { g.fillStyle = P.sky[i - 1]; for (let y = i * bh; y < i * bh + 4; y++) for (let x = y % 2; x < W; x += (y - i * bh) < 2 ? 2 : 4) g.fillRect(x, y, 1, 1); }
    const disc = (cx, cy, r, col) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); R(cx - w, cy + y, w * 2 + 1, 1, col); } };
    const [sx, sy] = L.sun;
    if (mode === 'day') { disc(sx, sy, 11, '#F2E3A0'); disc(sx, sy, 9, '#F7EDB8'); }
    if (mode === 'evening') { disc(sx, sy + H * .2, 14, '#F0B060'); disc(sx, sy + H * .2, 11, '#F6C57A'); R(sx - 18, sy + H * .2 + 4, 36, 1, P.sky[3]); R(sx - 20, sy + H * .2 + 8, 40, 1, P.sky[3]); }
    if (mode === 'night') { disc(sx, sy, 9, '#E9EFD2'); disc(sx + 4, sy - 3, 8, P.sky[0]); for (let k = 0; k < W * H / 1400; k++) R(rnd() * W, rnd() * H * .42, 1, 1, rnd() < .2 ? '#F2F6E4' : '#9DB79A'); }
    // far mountains with snow, then a lower range
    const ridge = (b, amp, fq, ph, col, snow) => { for (let x = 0; x < W; x++) { const h = b - Math.abs(Math.sin(x * fq + ph)) * amp - Math.sin(x * fq * 2.7 + ph) * amp * .25; R(x, h, 1, H, col); if (snow && h < b - amp * .72) R(x, h, 1, 2, snow); } };
    ridge(L.ridge, H * .13, .021, .4, P.far, P.snow); ridge(L.ridge + H * .05, H * .07, .034, 2.1, P.far2, null);
    // the castle on its hill, its road
    const [cx, cy] = L.castle, k0 = mode === 'night' ? PAL[0] : PAL[1];
    for (let i = -46; i <= 46; i++) R(cx + 18 + i, cy + 48 - Math.round(Math.sqrt(2116 - i * i) * .3), 1, H, P.hill);
    R(cx, cy + 10, 36, 24, k0); R(cx - 6, cy, 10, 34, k0); R(cx + 32, cy, 10, 34, k0); R(cx + 13, cy - 10, 10, 20, k0);
    [[-6, -2], [-2, -2], [2, -2], [32, -2], [36, -2], [40, -2], [13, -12], [17, -12], [21, -12]].forEach(([a, b]) => R(cx + a, cy + b, 2, 2, k0));
    R(cx + 14, cy + 22, 8, 12, PAL[0]); const win = mode === 'day' ? PAL[0] : PAL.y; R(cx - 3, cy + 8, 2, 3, win); R(cx + 36, cy + 8, 2, 3, win); R(cx + 17, cy - 4, 2, 3, win);
    R(cx + 17, cy - 22, 1, 12, PAL[0]);
    for (let i = 0; i < 160; i++) { const p = i / 160, x = cx + 10 + Math.sin(p * 9) * 22 + p * 6, y = H - p * (H - cy - 36); R(x, y, 6 - p * 3, 2, P.road); }
    // middle hills, the windmill's tower, the village
    for (let x = 0; x < W; x++) R(x, L.village[1] + 6 - Math.sin(x * .018 + 1.2) * 10, 1, H, P.mid);
    const [mx, my] = L.mill; for (let j = 0; j < 30; j++) R(mx - 4 - j / 6, my + j, 8 + j / 3, 1, k0); R(mx - 5, my - 4, 10, 4, PAL[0]); R(mx - 1, my + 20, 3, 10, PAL[0]); if (mode !== 'day') R(mx - 1, my + 8, 2, 3, PAL.y);
    const [vx, vy] = L.village;
    [[-18, 6, 12, 8], [0, 0, 14, 10], [22, -4, 16, 12], [46, 2, 12, 9]].forEach(([dx, dy, w, h]) => { const x = vx + dx, y = vy + dy; R(x, y, w, h, P.wall);
      for (let j = 0; j < w / 2 + 2; j++) R(x - 2 + j, y - j, w + 4 - j * 2, 1, PAL[1]); R(x + w / 2 - 1, y + h - 5, 3, 5, PAL[0]);
      R(x + 2, y + 3, 2, 2, mode === 'day' ? PAL[1] : PAL.y); R(x + w - 4, y + 3, 2, 2, mode === 'day' ? PAL[1] : PAL.y); R(x + w - 5, y - w / 2 + 1, 2, 5, PAL[0]); });
    // the river and its stone bridge
    for (let y = Math.round(L.river); y < H; y++) { const p = (y - L.river) / (H - L.river), x = W - p * W * .42 + Math.sin(p * 4) * 20, w = 18 + p * 34; R(x - w / 2, y, w, 1, P.water); }
    const [bx, by] = L.bridge; R(bx, by, 44, 4, PAL[1]); R(bx, by + 4, 4, 10, PAL[1]); R(bx + 40, by + 4, 4, 10, PAL[1]);
    for (let i = 0; i < 36; i++) R(bx + 4 + i, by + 4, 1, Math.round(9 - Math.sin(i / 36 * Math.PI) * 9), PAL[1]); for (let i = 0; i < 44; i += 4) R(bx + i, by - 2, 2, 2, PAL[1]);
    // the foreground: ground, trees, a fence, flowers, grass
    R(0, L.ground, W, H, P.ground);
    const tree = (x, y, s) => { R(x + 5 * s, y + 9 * s, 2 * s, 5 * s, PAL[0]); [[3, 0, 6], [1, 1, 10], [0, 2, 12], [0, 3, 12], [0, 4, 12], [1, 5, 10], [0, 6, 12], [1, 7, 10], [3, 8, 6]].forEach(([dx, dy, w]) => R(x + dx * s, y + dy * s, w * s, s, P.tree)); [[2, 2], [7, 4], [4, 6], [9, 6]].forEach(([dx, dy]) => R(x + dx * s, y + dy * s, s, s, P.shade)); };
    [[2, L.ground - 40, 3], [W * .06, L.ground - 26, 2], [W - 40, L.ground - 36, 3], [W * .9, L.ground - 22, 2]].forEach(([x, y, s]) => tree(x, y, s));
    for (let i = 0; i < 8; i++) R(W * .12 + i * 10, L.ground + 8, 2, 10, PAL[1]); R(W * .12 - 2, L.ground + 11, 76, 2, PAL[1]); R(W * .12 - 2, L.ground + 15, 76, 1, PAL[1]);
    for (let k = 0; k < W / 10; k++) { const x = rnd() * W, y = L.ground + 3 + rnd() * (H - L.ground - 4); R(x, y, 1, 2, mode === 'night' ? PAL[0] : PAL[1]); R(x + 2, y + 1, 1, 1, mode === 'night' ? PAL[0] : PAL[1]); }
    if (mode !== 'night') for (let k = 0; k < W / 30; k++) R(rnd() * W, L.ground + 6 + rnd() * (H - L.ground - 8), 2, 2, rnd() < .5 ? PAL.r : PAL.y);
    return c;
  }
  function frame(now) {
    raf = null;
    if (!scv.isConnected || document.hidden) return;
    const still = ML.reducedMotion(), focus = root.dataset.timer === 'running';
    if (!still && now - lastF < (focus ? 330 : 125)) { raf = requestAnimationFrame(frame); return; }
    vt += still ? 0 : Math.min(400, now - (lastF || now)) * (focus ? .3 : 1); lastF = now;
    const mode = dayPart(), k = window.innerWidth < 700 ? 3 : 4, w = Math.ceil(innerWidth / k), h = Math.ceil(innerHeight / k);
    if (w !== SW || h !== SH || k !== K) { SW = w; SH = h; K = k; scv.width = w; scv.height = h; baseKey = ''; }
    if (baseKey !== mode + w + 'x' + h) { base = paintBase(mode); baseKey = mode + w + 'x' + h; }
    const g = scv.getContext('2d'), P = COL[mode], R = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), ww, hh); };
    g.drawImage(base, 0, 0);
    const t = vt;
    // clouds
    const cloud = (x, y, s) => { [[4, 0, 10], [2, 1, 15], [0, 2, 22], [0, 3, 24]].forEach(([dx, dy, ww]) => R(x + dx * s, y + dy * s, ww * s, s, P.cloud)); R(x, y + 4 * s, 24 * s, s, P.cloudO); };
    const span = SW + 80, d = t / 900;
    cloud((SW * .1 + d) % span - 60, SH * .08, 2); cloud((SW * .45 + d * .7) % span - 60, SH * .17, 1); cloud((SW * .7 + d * .8) % span - 60, SH * .05, 1);
    // windmill blades
    const [mx, my] = L.mill, a0 = t / 1600, k0 = mode === 'night' ? PAL[0] : PAL[1];
    for (let b = 0; b < 4; b++) { const a = a0 + b * Math.PI / 2; for (let r = 2; r < 20; r++) { R(mx + Math.cos(a) * r, my + Math.sin(a) * r, 1, 1, k0); if (r > 7 && r % 2) R(mx + Math.cos(a) * r + Math.cos(a + 1.57) * 2, my + Math.sin(a) * r + Math.sin(a + 1.57) * 2, 1, 1, mode === 'night' ? P.cloud : PAL[4]); } }
    R(mx - 1, my - 1, 3, 3, PAL[0]);
    // chimney smoke
    const [vx, vy] = L.village;
    [[-18, 6, 12], [0, 0, 14], [22, -4, 16], [46, 2, 12]].forEach(([dx, dy, ww], i) => { const x = vx + dx + ww - 5, y = vy + dy - ww / 2 + 1; for (let s = 0; s < 4; s++) { const p = ((t / 900 + s * .25 + i * .3) % 1); R(x + Math.sin(p * 6 + i) * 2, y - 2 - p * 14, p < .7 ? 2 : 1, p < .7 ? 2 : 1, P.smoke); } });
    // the castle flag
    const [cx, cy] = L.castle, f = Math.floor(t / 400) % 2; R(cx + 18, cy - 22, 7 - f, 2, PAL.y); R(cx + 18, cy - 20, 5 + f, 2, PAL.y);
    // glints on the river
    for (let y = Math.round(L.river); y < SH; y += 1) { if ((y + Math.floor(t / 250)) % 7) continue; const p = (y - L.river) / (SH - L.river), x = SW - p * SW * .42 + Math.sin(p * 4) * 20, ww = 18 + p * 34; R(x - ww / 4 + Math.sin(y + t / 400) * 6, y, ww / 3, 1, P.glint); }
    // two sheep that graze and take a step now and then
    if (mode !== 'night') { const [sx, sy] = L.sheep; [0, 1].forEach(i => { const step = Math.floor(t / 3000 + i * 1.7) % 6, x = sx + i * 22 + (step < 3 ? step : 6 - step) * 2, y = sy + i * 3, head = Math.floor(t / 1200 + i) % 3 === 0;
      R(x, y, 9, 5, '#F2F5E6'); R(x + 1, y - 1, 7, 1, '#F2F5E6'); R(x + 1, y + 5, 1, 2, PAL[0]); R(x + 6, y + 5, 1, 2, PAL[0]); R(x + 8, y + (head ? 2 : 0), 3, 3, PAL[0]); }); }
    // birds now and then (day, evening) / fireflies (night)
    if (mode !== 'night') { const cyc = t % 70000; if (cyc < 22000) { const bx = cyc / 22000 * (SW + 60) - 30; [[0, 0], [6, -3], [12, 1], [-6, 3]].forEach(([dx, dy], i) => { const ff = Math.floor(t / 250 + i) % 2, x = bx + dx, y = SH * .22 + dy; R(x, y + ff, 1, 1, PAL[1]); R(x + 1, y + 1, 1, 1, PAL[1]); R(x + 2, y + ff, 1, 1, PAL[1]); }); } }
    else { let s2 = 5; const r2 = () => (s2 = (s2 * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 14; i++) { const x = r2() * SW, y = SH * .6 + r2() * SH * .35; if (Math.floor(t / 600 + i) % 3) R(x + Math.sin(t / 2000 + i) * 3, y, 1, 1, '#E8F070'); } }
    if (!still) raf = requestAnimationFrame(frame);
  }
  function renderScene() {
    const show = isOn() && level() === 'plein';
    if (show && !scv.isConnected) { const fx = $('fx'); if (fx) fx.after(scv); else document.body.prepend(scv); }
    if (!show) { if (scv.isConnected) scv.remove(); cancelAnimationFrame(raf); raf = null; return; }
    if (!raf) { lastF = 0; raf = requestAnimationFrame(frame); }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderScene(); });
  on('motion', () => { cancelAnimationFrame(raf); raf = null; renderScene(); });
  on('minute', () => { if (scv.isConnected && ML.reducedMotion()) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } }); // a still scene still follows the hour
  addEventListener('resize', () => { if (scv.isConnected && !raf) raf = requestAnimationFrame(frame); setTimeout(renderSet, 80); });

  function sync() {
    if (root.dataset.cartLevel !== level()) root.dataset.cartLevel = level();
    renderSet(); renderDial(); renderScene();
  }
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light'] });
  on('started', sync); on('render', sync); on('world', sync);
})();
