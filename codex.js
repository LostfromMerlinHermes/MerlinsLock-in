// Codex (Steady, light, Premium): the old Victorian city in the mist, drawn on game.js's #fx canvas (ML.codexDraw),
// and the evening Gazette. The city: far domes, spires and two factory chimneys, a gothic clock tower, terraced
// houses with one lit window per session of the day, a quay with gas lamps, a river with a stone bridge.
// It follows the timer: at rest a steam launch passes now and then (and at dusk, rarely, a train on the bridge);
// in focus the fog rises and swallows the city, the water goes still; on a pause or a break the chimneys and the
// factories smoke; at a session's end the tower bell rings and the pigeons fly off. The light follows the hour
// (dawn, day, dusk) and the season (snow in winter, leaves in autumn, rainy days with a rare passer-by under an umbrella).
(() => {
  'use strict';
  const { S, $, on, t, esc, today, dayKey, toast } = ML;
  const root = document.documentElement;
  const isOn = () => root.dataset.theme === 'observatory' && !!root.dataset.light;
  ML.codexOn = isOn;

  ML.addStrings({
    fr: {
      gz_title: 'La Gazette du Soir', gz_tag: 'Nouvelles de ta journée, imprimées à la tombée de la brume', gz_no: 'N° {n}', gz_price: 'Prix : 1 ◈',
      gz_ses1: 'Une session', gz_ses: '{n} sessions', gz_focus: '{t} de focus', gz_floor1: 'la tour gagne un étage', gz_floors: 'la tour gagne {n} étages',
      gz_task1: 'une tâche bouclée', gz_tasks: '{n} tâches bouclées', gz_quiet: 'Journée calme : la ville se repose',
      gz_done_h: 'Tâches accomplies.', gz_done_none: 'Aucune tâche bouclée aujourd’hui.', gz_weather_h: 'Météo.', gz_weather: 'Énergie {e}. {w}.',
      gz_w_rain: 'Pluie fine sur les quais', gz_w_snow: 'Neige sur les toits', gz_w_mist: 'Brume légère, éclaircies',
      gz_brief_h: 'En bref.', gz_brief: 'Série : {s} j. Quêtes : {q} sur 3.', gz_tomorrow: 'Demain : {n} à l’agenda', gz_tomorrow0: 'Demain : agenda libre',
      gz_share: 'Partager', gz_copied: 'Gazette copiée.', gz_open: 'Lire la Gazette du soir',
    },
    en: {
      gz_title: 'The Evening Gazette', gz_tag: 'News of your day, printed as the mist comes down', gz_no: 'No. {n}', gz_price: 'Price: 1 ◈',
      gz_ses1: 'One session', gz_ses: '{n} sessions', gz_focus: '{t} of focus', gz_floor1: 'the tower gains a floor', gz_floors: 'the tower gains {n} floors',
      gz_task1: 'one task done', gz_tasks: '{n} tasks done', gz_quiet: 'A quiet day: the city rests',
      gz_done_h: 'Tasks done.', gz_done_none: 'No task finished today.', gz_weather_h: 'Weather.', gz_weather: 'Energy {e}. {w}.',
      gz_w_rain: 'Light rain on the quays', gz_w_snow: 'Snow on the roofs', gz_w_mist: 'Light mist, bright spells',
      gz_brief_h: 'In brief.', gz_brief: 'Streak: {s} d. Quests: {q} of 3.', gz_tomorrow: 'Tomorrow: {n} in the calendar', gz_tomorrow0: 'Tomorrow: calendar clear',
      gz_share: 'Share', gz_copied: 'Gazette copied.', gz_open: 'Read the Evening Gazette',
    },
  });

  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let q = Math.imul(s ^ s >>> 15, 1 | s); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
  const hash = str => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

  /* ---------- The day: season, weather (the same all day, from the date), hour ---------- */
  function dayInfo() {
    const d = new Date(), m = d.getMonth(), h = d.getHours(), r = hash(today()) % 100;
    const season = m === 11 || m < 2 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn';
    const rain = r < { autumn: 35, spring: 25, winter: 15, summer: 10 }[season];
    return { season, rain, snow: season === 'winter' && !rain && r < 70, leaves: season === 'autumn' && !rain,
      band: h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'dusk' : 'night' };
  }
  const TINT = { dawn: '240,200,186', day: '214,200,170', dusk: '232,180,118', night: '160,162,170' };
  let day = dayInfo(), dayAt = 0;

  /* ---------- Sessions today (cached a few seconds: the draw loop asks every frame) ---------- */
  let sesN = 0, sesAt = 0;
  const sessionsToday = () => { if (performance.now() - sesAt > 4000) { const td = today(); sesN = S.sessions.filter(s => dayKey(new Date(s.at)) === td).length; sesAt = performance.now(); } return sesN; };

  /* ---------- The static city, painted once per size / light into an offscreen canvas ----------
     It is drawn in its own coordinates (BASE = the quay line, 300 units below the top) and placed on screen
     under the timer dial at each frame (anchor()), so the roofs rise behind the dial like in the mock-ups. */
  let W = 0, H = 0, U = 1, BASE = 0, WATER = 0, key = '', city = null;
  let wins = [], lamps = [], stacks = [], factories = [], tower = null, roofs = [], bridge = null;
  const C = { far: '#CFC5B1', house: '#B9AC92', roof: '#A99B80', pot: '#9A8C72', winOff: '#A2957B', lit: '#F2C46D', tower: '#B3A488', quay: '#8E8268', rail: '#6F6450', post: '#5E5240', glass: '#F7E2B0' };
  function build() {
    U = Math.max(.85, Math.min(1.3, W / 400)); WATER = Math.round(30 * U); BASE = Math.round(300 * U);
    const CH = BASE + 6 * U + WATER;
    const DPR = Math.min(2, devicePixelRatio || 1), cv = document.createElement('canvas');
    cv.width = Math.round(W * DPR); cv.height = Math.round(CH * DPR);
    const g = cv.getContext('2d'); g.scale(DPR, DPR);
    const R = rng(7), u = U;
    // the light of the hour, rising from the river (the parchment stays clean at the top)
    const tint = day.season === 'winter' && day.band === 'day' ? '206,212,216' : TINT[day.band];
    const sky = g.createLinearGradient(0, 0, 0, BASE);
    sky.addColorStop(0, `rgba(${tint},0)`); sky.addColorStop(1, `rgba(${tint},${day.band === 'day' ? .32 : .5})`);
    g.fillStyle = sky; g.fillRect(0, 0, W, BASE);
    // far layer: domed halls, spires, two factory chimneys at the edges
    g.fillStyle = C.far;
    const dome = x => { g.fillRect(x - 22 * u, BASE - 110 * u, 44 * u, 110 * u); g.beginPath(); g.arc(x, BASE - 110 * u, 18 * u, Math.PI, 0); g.fill(); g.fillRect(x - 2 * u, BASE - 140 * u, 4 * u, 14 * u); g.fillRect(x - 4 * u, BASE - 136 * u, 8 * u, 1.6 * u); };
    const spire = x => { g.beginPath(); g.moveTo(x - 6 * u, BASE - 60 * u); g.lineTo(x, BASE - 150 * u); g.lineTo(x + 6 * u, BASE - 60 * u); g.fill(); g.fillRect(x - 6 * u, BASE - 60 * u, 12 * u, 60 * u); };
    (W > 900 ? [.1, .58] : [.12]).forEach(f => dome(W * f));
    (W > 900 ? [.24, .44, .7] : [.34, .64]).forEach(f => spire(W * f));
    factories = [W * .035, W * .955].map(x => { g.fillRect(x - 3.5 * u, BASE - 165 * u, 7 * u, 165 * u); g.fillRect(x - 4.5 * u, BASE - 169 * u, 9 * u, 4 * u); return { x, y: BASE - 170 * u }; });
    // terraced houses across the whole width
    wins = []; stacks = []; roofs = [];
    for (let x = -8 * u, i = 0; x < W + 8 * u; i++) {
      const w = (26 + R() * 20) * u, h = (44 + R() * 30) * u, top = BASE - h, roof = ['gable', 'mansard', 'flat'][Math.floor(R() * 3)], ch = R() < .7 ? 1 : 2;
      g.fillStyle = C.house; g.fillRect(x, top, w, h);
      g.fillStyle = C.roof; g.beginPath();
      if (roof === 'gable') { g.moveTo(x - 2 * u, top); g.lineTo(x + w / 2, top - 14 * u); g.lineTo(x + w + 2 * u, top); }
      else if (roof === 'mansard') { g.moveTo(x - u, top); g.lineTo(x + 4 * u, top - 10 * u); g.lineTo(x + w - 4 * u, top - 10 * u); g.lineTo(x + w + u, top); }
      else g.rect(x - u, top - 3 * u, w + 2 * u, 3 * u);
      g.fill();
      roofs.push({ x: x + w / 2, y: top - (roof === 'gable' ? 14 : roof === 'mansard' ? 10 : 3) * u });
      if (day.snow) { g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2 * u; g.beginPath(); if (roof === 'gable') { g.moveTo(x, top - u); g.lineTo(x + w / 2, top - 14 * u); g.lineTo(x + w, top - u); } else { g.moveTo(x, top - 3 * u); g.lineTo(x + w, top - 3 * u); } g.stroke(); }
      for (let c = 0; c < ch; c++) {
        const cx0 = x + 6 * u + c * (w - 16 * u);
        g.fillStyle = C.roof; g.fillRect(cx0, top - 18 * u, 7 * u, 14 * u);
        g.fillStyle = C.pot; g.fillRect(cx0 + u, top - 22 * u, 2 * u, 4 * u); g.fillRect(cx0 + 4 * u, top - 21 * u, 2 * u, 3 * u);
        stacks.push({ x: cx0 + 3.5 * u, y: top - 22 * u });
      }
      for (let fy = top + 8 * u; fy < BASE - 16 * u; fy += 18 * u) for (let fx = x + 5 * u; fx < x + w - 8 * u; fx += 11 * u) {
        g.fillStyle = C.winOff; g.fillRect(fx, fy, 5 * u, 8 * u); if (fx > 0 && fx < W) wins.push({ x: fx, y: fy });
      }
      g.fillStyle = C.pot; g.fillRect(x + w / 2 - 3 * u, BASE - 11 * u, 6 * u, 11 * u);
      x += w;
    }
    // the order windows light in (one per session), spread over the city
    const R2 = rng(11); for (let i = wins.length - 1; i > 0; i--) { const j = Math.floor(R2() * (i + 1)); [wins[i], wins[j]] = [wins[j], wins[i]]; }
    // the gothic clock tower, at the right
    const tw = 36 * u, tx = W < 700 ? W - tw - 10 * u : W * .84, shaft = BASE - 180 * u;
    g.fillStyle = C.tower; g.fillRect(tx, shaft, tw, BASE - shaft); g.fillRect(tx - 4 * u, shaft - 32 * u, tw + 8 * u, 32 * u);
    g.beginPath(); g.moveTo(tx - 4 * u, shaft - 32 * u); g.lineTo(tx + tw / 2, shaft - 96 * u); g.lineTo(tx + tw + 4 * u, shaft - 32 * u); g.fill();
    [tx - 4 * u, tx + tw + 4 * u].forEach(px => { g.beginPath(); g.moveTo(px - 3 * u, shaft - 32 * u); g.lineTo(px, shaft - 46 * u); g.lineTo(px + 3 * u, shaft - 32 * u); g.fill(); });
    g.fillRect(tx + tw / 2 - u, shaft - 110 * u, 2 * u, 16 * u);
    g.fillStyle = C.winOff; for (let k = 0; k < 3; k++) { const wx = tx + 8 * u + k * 8 * u; g.beginPath(); g.roundRect ? g.roundRect(wx, shaft + 16 * u, 4 * u, 14 * u, 2 * u) : g.rect(wx, shaft + 16 * u, 4 * u, 14 * u); g.fill(); }
    tower = { x: tx + tw / 2, cy: shaft - 16 * u, r: 11 * u, top: shaft - 96 * u };
    g.fillStyle = '#EDE5D2'; g.strokeStyle = '#8E7D60'; g.lineWidth = 1.1 * u; g.beginPath(); g.arc(tower.x, tower.cy, tower.r, 0, 6.29); g.fill(); g.stroke();
    g.lineWidth = .7 * u; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.beginPath(); g.moveTo(tower.x + tower.r * .78 * Math.sin(a), tower.cy - tower.r * .78 * Math.cos(a)); g.lineTo(tower.x + tower.r * .94 * Math.sin(a), tower.cy - tower.r * .94 * Math.cos(a)); g.stroke(); }
    // the quay: stone edge, an iron railing, gas lamps
    g.fillStyle = C.quay; g.fillRect(0, BASE, W, 5 * u);
    g.strokeStyle = C.rail; g.lineWidth = .8; g.beginPath(); g.moveTo(0, BASE - 8 * u); g.lineTo(W, BASE - 8 * u);
    for (let x = 0; x < W; x += 6 * u) { g.moveTo(x, BASE - 8 * u); g.lineTo(x, BASE); }
    g.stroke();
    lamps = [];
    for (let x = 40 * u; x < W - 20 * u; x += 112 * u) {
      if (Math.abs(x - tower.x) < 34 * u) continue;
      g.strokeStyle = C.post; g.lineWidth = 1.6 * u; g.beginPath(); g.moveTo(x, BASE - 34 * u); g.lineTo(x, BASE); g.stroke();
      g.fillStyle = C.glass; g.beginPath(); g.moveTo(x - 4 * u, BASE - 44 * u); g.lineTo(x + 4 * u, BASE - 44 * u); g.lineTo(x + 2.5 * u, BASE - 35 * u); g.lineTo(x - 2.5 * u, BASE - 35 * u); g.closePath(); g.fill();
      g.lineWidth = u; g.stroke(); g.beginPath(); g.moveTo(x - 3 * u, BASE - 44 * u); g.lineTo(x, BASE - 47 * u); g.lineTo(x + 3 * u, BASE - 44 * u); g.stroke();
      lamps.push({ x, y: BASE - 40 * u });
    }
    // the river and a stone bridge on the left
    const wy = BASE + 5 * u, wg = g.createLinearGradient(0, wy, 0, CH);
    wg.addColorStop(0, day.snow ? '#C3CBCD' : '#B7BEBC'); wg.addColorStop(1, '#A9B2B0');
    g.fillStyle = wg; g.fillRect(0, wy, W, CH - wy);
    const bw = Math.min(W * .42, 260 * u), bd = wy + 4 * u;
    g.fillStyle = 'rgba(181,170,148,.92)'; g.fillRect(0, bd, bw, 6 * u);
    for (let x = 0; x <= bw; x += 50 * u) g.fillRect(x, bd + 6 * u, 10 * u, WATER);
    g.strokeStyle = 'rgba(158,147,128,.9)'; g.lineWidth = u;
    for (let x = 0; x + 50 * u <= bw + 1; x += 50 * u) { g.beginPath(); g.moveTo(x + 10 * u, bd + 6 * u + WATER * .7); g.quadraticCurveTo(x + 30 * u, bd + 6 * u, x + 50 * u, bd + 6 * u + WATER * .7); g.stroke(); }
    bridge = { x0: 0, x1: bw, y: bd };
    city = cv;
  }
  function ensure(w, h) {
    if (performance.now() - dayAt > 60000) { day = dayInfo(); dayAt = performance.now(); }
    const k = [w, h, day.band, day.season, day.snow].join('|');
    if (k === key && city) return; key = k; W = w; H = h; build(); seedMist(); seedSky();
  }
  // Where the quay line goes on screen: just under the dial's centre line when the dial is shown, else the bottom
  function anchor() {
    const navH = root.classList.contains('mnav-on') ? ((document.querySelector('.mnav') || {}).offsetHeight || 0) : 0;
    const low = H - navH - WATER;
    const ring = document.querySelector('#sigil-card .ring-wrap'), r = ring && ring.getBoundingClientRect();
    if (!r || !r.height || $('sigil-card').classList.contains('compact')) return low;
    return Math.round(Math.max(H * .35, Math.min(low, r.bottom - r.height * .08)));
  }

  /* ---------- Living parts ---------- */
  let mists = [], drops = [], smoke = [], fog = .15, last = 0, endT0 = 0, birdsAway = 0;
  let boat = null, nextBoat = 0, train = null, nextTrain = 0, walker = null, nextWalker = 0;
  function seedMist() { const R = rng(4); mists = Array.from({ length: 7 }, () => ({ x: R() * W, y: BASE - (20 + R() * 130) * U, rx: W * (.25 + R() * .3), k: .2 + R() * .15, v: (R() < .5 ? -1 : 1) * (.05 + R() * .08), a: .45 + R() * .3 })); }
  function seedSky() {
    const n = day.rain ? 70 : day.snow ? 60 : day.leaves ? 9 : 0, R = rng(9);
    drops = Array.from({ length: n }, () => ({ x: R() * W, y: R() * H, v: .6 + R() * .6, p: R() * 6.3, s: .7 + R() * .6 }));
  }
  const puff = (x, y, k = 1) => { if (smoke.length < 110) smoke.push({ x, y, r: 2 * U * k, a: .16 + .05 * k, life: 1, vy: (.35 + Math.random() * .2) * U, vx: (Math.random() - .5) * .1 }); };
  const glow = (cx, x, y, r, rgb, a) => { const gr = cx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); cx.fillStyle = gr; cx.fillRect(x - r, y - r, r * 2, r * 2); };
  const progress = () => { const tot = S.total || 1, rem = ML.remainingNow ? ML.remainingNow() : tot; return Math.max(0, Math.min(1, 1 - Math.max(0, rem) / tot)); };
  function steamLaunch(cx, x, y, u) {
    cx.fillStyle = '#4C4034'; cx.beginPath(); cx.moveTo(x - 34 * u, y); cx.lineTo(x + 30 * u, y); cx.quadraticCurveTo(x + 26 * u, y + 7 * u, x + 18 * u, y + 7 * u); cx.lineTo(x - 28 * u, y + 7 * u); cx.closePath(); cx.fill();
    cx.fillStyle = '#D8CDB6'; cx.fillRect(x - 18 * u, y - 8 * u, 22 * u, 8 * u);
    cx.fillStyle = '#8C7D63'; for (let i = 0; i < 3; i++) cx.fillRect(x - 15 * u + i * 6.5 * u, y - 6 * u, 3.5 * u, 3.5 * u);
    cx.fillStyle = '#2F2A25'; cx.fillRect(x + 8 * u, y - 17 * u, 4.5 * u, 17 * u); cx.fillStyle = '#B08D4A'; cx.fillRect(x + 8 * u, y - 13 * u, 4.5 * u, 2 * u);
    cx.fillStyle = 'rgba(76,64,52,.18)'; cx.fillRect(x - 30 * u, y + 8 * u, 56 * u, 4 * u);
  }
  function locomotive(cx, x, y, u) {
    cx.fillStyle = '#6E6350';
    cx.fillRect(x, y - 9 * u, 22 * u, 9 * u); cx.fillRect(x + 14 * u, y - 15 * u, 8 * u, 7 * u); cx.fillRect(x + 4 * u, y - 14 * u, 3 * u, 5 * u);
    cx.fillRect(x - 24 * u, y - 8 * u, 20 * u, 8 * u); cx.fillRect(x - 48 * u, y - 8 * u, 20 * u, 8 * u);
    cx.fillStyle = '#E9D8A8'; for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) cx.fillRect(x - 46 * u + k * 24 * u + j * 6 * u, y - 6 * u, 3 * u, 3 * u);
  }
  function passerBy(cx, x, y, u, now) {
    const step = Math.sin(now / 180) * 2.2 * u;
    cx.strokeStyle = '#4E4130'; cx.lineWidth = 1.6 * u; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(x, y - 6 * u); cx.lineTo(x - step, y); cx.moveTo(x, y - 6 * u); cx.lineTo(x + step, y); cx.stroke();
    cx.fillStyle = '#4E4130'; cx.beginPath(); cx.moveTo(x - 3.5 * u, y - 6 * u); cx.lineTo(x + 3.5 * u, y - 6 * u); cx.lineTo(x + 2.5 * u, y - 15 * u); cx.lineTo(x - 2.5 * u, y - 15 * u); cx.closePath(); cx.fill();
    cx.beginPath(); cx.arc(x, y - 17 * u, 2 * u, 0, 6.29); cx.fill();
    cx.lineWidth = u; cx.beginPath(); cx.moveTo(x + u, y - 13 * u); cx.lineTo(x + u, y - 23 * u); cx.stroke();
    cx.fillStyle = '#3A3128'; cx.beginPath(); cx.arc(x + u, y - 22 * u, 9 * u, Math.PI, 0); cx.closePath(); cx.fill();
  }
  function birds(cx, x, y, s, now, ph) { cx.beginPath(); const f = Math.sin(now / 140 + ph) * s * .5; cx.moveTo(x - s, y - f); cx.quadraticCurveTo(x - s / 2, y - s * .6, x, y); cx.quadraticCurveTo(x + s / 2, y - s * .6, x + s, y - f); cx.stroke(); }

  ML.codexDraw = (cx, w, h, slow, still, now) => {
    ensure(w, h);
    const dt = Math.min(100, last ? now - last : 16) * (still ? 0 : 1); last = now;
    const st = root.dataset.timer || 'idle', u = U, k = dt / 33 * (slow || .3);
    const rest = st === 'idle' || st === 'break';
    // the city in its own coordinates, moved under the dial; the river goes on down to the bottom of the screen
    const oy = anchor() - BASE, CH = city.height / Math.min(2, devicePixelRatio || 1);
    cx.save(); cx.translate(0, oy);
    cx.drawImage(city, 0, 0, W, CH);
    if (H - oy > CH) { const fade = cx.createLinearGradient(0, CH - 1, 0, CH + 70 * U); fade.addColorStop(0, 'rgba(169,178,176,1)'); fade.addColorStop(1, 'rgba(169,178,176,0)'); cx.fillStyle = fade; cx.fillRect(0, CH - 1, W, 70 * U + 1); }

    // lit windows: one per session done today (the newest glows a little brighter for a moment after the bell)
    const n = Math.min(wins.length, sessionsToday()), fresh = endT0 && now - endT0 < 5000;
    for (let i = 0; i < n; i++) {
      const p = wins[i]; glow(cx, p.x + 2.5 * u, p.y + 4 * u, 9 * u, '255,212,138', i === n - 1 && fresh ? .5 : .22);
      cx.fillStyle = C.lit; cx.fillRect(p.x, p.y, 5 * u, 8 * u);
    }
    // the tower: real time at rest, the session's progress during focus (minute hand)
    const d = new Date(), hrA = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * 6.283;
    const focusing = (st === 'running' || st === 'paused') && S.mode === 'focus', minA = (focusing ? progress() : d.getMinutes() / 60) * 6.283;
    cx.strokeStyle = '#4E4130'; cx.lineCap = 'round';
    cx.lineWidth = 1.5 * u; cx.beginPath(); cx.moveTo(tower.x, tower.cy); cx.lineTo(tower.x + tower.r * .5 * Math.sin(hrA), tower.cy - tower.r * .5 * Math.cos(hrA)); cx.stroke();
    cx.lineWidth = 1.1 * u; cx.beginPath(); cx.moveTo(tower.x, tower.cy); cx.lineTo(tower.x + tower.r * .78 * Math.sin(minA), tower.cy - tower.r * .78 * Math.cos(minA)); cx.stroke();

    // smoke: none in focus; at rest one chimney (three in winter); on a pause or a break the whole city and the factories
    if (!still) {
      const wind = day.rain ? .55 : .16;
      const busy = st === 'paused' || st === 'break';
      if (st !== 'running') {
        const srcs = busy ? stacks.filter((_, i) => i % 2 === 0).slice(0, 8) : stacks.slice(0, day.season === 'winter' ? 3 : 1);
        srcs.forEach(s => { if (Math.random() < .03 * k) puff(s.x, s.y, .8); });
        if (busy) factories.forEach(f => { if (Math.random() < .09 * k) puff(f.x, f.y, 1.5); });
      }
      for (const p of smoke) { p.x += (p.vx + wind * (1 - p.life * .5)) * u * k; p.y -= p.vy * k; p.r += .05 * u * k * (1 + p.r / (12 * u)); p.life -= .0045 * k; }
      smoke = smoke.filter(p => p.life > 0);
    }
    for (const p of smoke) { const a = Math.max(0, p.a * p.life); if (a < .005) continue; glow(cx, p.x, p.y, p.r * 1.6, '176,168,154', a); }
    cx.globalAlpha = 1;

    // pigeons on a roof at rest; at a session's end they fly off, and come back a minute later
    const ended = endT0 && now - endT0 < 4500, flown = birdsAway && now < birdsAway;
    const perch = roofs[Math.min(roofs.length - 1, 2)];
    if (perch && !ended && !flown && st !== 'running') { cx.fillStyle = '#6E6150'; [[-4, 0], [5, 0]].forEach(([dx]) => { cx.beginPath(); cx.ellipse(perch.x + dx * u, perch.y - 2 * u, 3 * u, 2.1 * u, 0, 0, 6.29); cx.fill(); cx.beginPath(); cx.arc(perch.x + dx * u + (dx < 0 ? 2.5 : -2.5) * u, perch.y - 3.3 * u, 1.4 * u, 0, 6.29); cx.fill(); }); }
    if (perch && ended) {
      const tt = (now - endT0) / 4500; cx.strokeStyle = '#6E6150'; cx.lineWidth = 1.3 * u;
      [[0, 0], [12, -6], [-10, -10], [22, 4]].forEach(([dx, dy], i) => birds(cx, perch.x + (dx + tt * (140 + i * 20)) * u, perch.y + (dy - tt * (90 + i * 15)) * u, 5 * u, now, i));
    }
    // the bell: rings drawn around the belfry for a few seconds after a session
    if (ended && !still || (still && fresh)) {
      const tt = Math.min(1, (now - endT0) / 3000); cx.strokeStyle = '#8E7D60'; cx.lineWidth = 1.1 * u;
      [0, .33, .66].forEach(o => { const q = (tt + o) % 1, r = (16 + q * 30) * u; cx.globalAlpha = (1 - q) * .75; cx.beginPath(); cx.arc(tower.x, tower.top + 30 * u, r, Math.PI * 1.15, Math.PI * 1.85); cx.stroke(); });
      cx.globalAlpha = 1;
    }

    // river traffic and passers-by, at rest only
    if (!still) {
      if (rest && !boat && now > nextBoat) { if (nextBoat) boat = { x: -60 * u }; nextBoat = now + 70000 + Math.random() * 80000; }
      if (rest && !train && now > nextTrain && (day.band === 'dusk' || day.band === 'night')) { if (nextTrain) train = { x: -60 * u }; nextTrain = now + 200000 + Math.random() * 160000; }
      if (rest && !walker && now > nextWalker && day.rain) { if (nextWalker) walker = { x: W + 20 * u }; nextWalker = now + 180000 + Math.random() * 200000; }
    }
    if (boat) { const by = BASE + 5 * u + WATER * .52; steamLaunch(cx, boat.x, by, u); if (!still) { boat.x += .42 * u * k; if (Math.random() < .06 * k) puff(boat.x + 10 * u, by - 18 * u, .7); } if (boat.x > W + 60 * u) boat = null; }
    if (train) { locomotive(cx, train.x, bridge.y, u); if (!still) { train.x += .7 * u * k; if (Math.random() < .12 * k) puff(train.x + 5 * u, bridge.y - 15 * u, .8); } if (train.x > bridge.x1 + 60 * u) train = null; }
    if (walker) { passerBy(cx, walker.x, BASE - 9 * u, u, now); if (!still) walker.x -= .22 * u * k; if (walker.x < -20 * u) walker = null; }

    // gas lamps: a halo that grows in the fog, warmer at dusk
    const lampA = (day.band === 'dusk' || day.band === 'night' ? .38 : .24) * (1 + fog * .6);
    lamps.forEach(l => glow(cx, l.x, l.y, (24 + fog * 30) * u, '255,212,138', lampA));
    lamps.forEach(l => { cx.globalAlpha = .35; cx.fillStyle = C.lit; cx.fillRect(l.x - 1.5 * u, BASE + 7 * u, 3 * u, WATER * .8); });
    cx.globalAlpha = 1;
    // ripples, still during focus
    cx.strokeStyle = '#E9EDEB'; cx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const x = ((i * 97 + (still || st === 'running' ? 0 : now / 90)) % (W + 40)) - 20, y = BASE + 9 * u + ((i * 37) % Math.max(1, WATER - 8 * u));
      cx.globalAlpha = st === 'running' ? .15 : .45; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + (st === 'running' ? 8 : 18) * u, y); cx.stroke();
    }
    cx.globalAlpha = 1;

    // the mist: drifting bands, then in focus a veil that swallows the city (it lifts on a pause)
    const fogT = st === 'running' ? 1 : st === 'paused' ? .35 : st === 'break' ? .05 : day.rain ? .3 : .15;
    fog = still ? fogT : fog + (fogT - fog) * Math.min(1, dt / 2600);
    for (const m of mists) {
      if (!still) { m.x += m.v * dt / 33 * (slow || .3); if (m.x - m.rx > W) m.x = -m.rx; if (m.x + m.rx < 0) m.x = W + m.rx; }
      cx.save(); cx.translate(m.x, m.y); cx.scale(1, m.k);
      const gr = cx.createRadialGradient(0, 0, 0, 0, 0, m.rx); gr.addColorStop(0, `rgba(246,240,228,${m.a * (.4 + .6 * fog)})`); gr.addColorStop(1, 'rgba(246,240,228,0)');
      cx.fillStyle = gr; cx.beginPath(); cx.arc(0, 0, m.rx, 0, 6.29); cx.fill(); cx.restore();
    }
    if (fog > .02) {
      const top = BASE - 260 * u, vg = cx.createLinearGradient(0, top, 0, BASE - 40 * u);
      vg.addColorStop(0, 'rgba(244,237,222,0)'); vg.addColorStop(1, `rgba(244,237,222,${fog * .88})`);
      cx.fillStyle = vg; cx.fillRect(0, top, W, BASE - 40 * u - top); cx.fillStyle = `rgba(244,237,222,${fog * .88})`; cx.fillRect(0, BASE - 40 * u, W, H - oy - BASE + 40 * u);
    }
    cx.restore();
    // the weather of the day: rain (leaning smoke above), snow, or autumn leaves
    if (drops.length && !(st === 'running' && still)) {
      const kk = still ? 0 : dt / 33 * (st === 'running' ? .4 : 1);
      if (day.rain) { cx.strokeStyle = 'rgba(120,128,136,.35)'; cx.lineWidth = 1; cx.beginPath(); }
      for (const p of drops) {
        if (day.rain) { p.y += 7 * p.v * kk; p.x -= 1.4 * p.v * kk; if (p.y > H) { p.y = -10; p.x = Math.random() * (W + 60); } cx.moveTo(p.x, p.y); cx.lineTo(p.x + 2.6, p.y - 12 * p.s); }
        else if (day.snow) { p.y += .6 * p.v * kk; p.x += Math.sin(now / 1800 + p.p) * .25 * kk; if (p.y > H) { p.y = -6; p.x = Math.random() * W; } cx.fillStyle = 'rgba(255,255,255,.85)'; cx.beginPath(); cx.arc(p.x, p.y, 1.3 * p.s, 0, 6.29); cx.fill(); }
        else { p.y += .5 * p.v * kk; p.x += (.4 + Math.sin(now / 1500 + p.p) * .5) * kk; if (p.y > H || p.x > W + 10) { p.y = -8; p.x = Math.random() * W * .8; }
          cx.save(); cx.translate(p.x, p.y); cx.rotate(now / 900 + p.p); cx.fillStyle = p.p > 3 ? 'rgba(176,112,52,.65)' : 'rgba(196,148,62,.65)'; cx.beginPath(); cx.ellipse(0, 0, 3.4 * p.s, 1.8 * p.s, 0, 0, 6.29); cx.fill(); cx.restore(); }
      }
      if (day.rain) cx.stroke();
    }
  };
  on('session', s => { if (!isOn() || !s || s.mins < 1) return; endT0 = performance.now(); birdsAway = endT0 + 65000; sesAt = 0; });

  /* ---------- The evening Gazette ---------- */
  const ov = document.createElement('div');
  ov.className = 'overlay gz-ov'; ov.id = 'gazette'; ov.hidden = true;
  document.body.appendChild(ov);
  const SKYLINE = '<svg viewBox="0 0 120 70" aria-hidden="true"><rect width="120" height="70" fill="#E9DFC8"/><path d="M0 52V40h8l4-6 4 6h8v-9h4v9h9l5-8 5 8h8V22h14v-8l6-10 6 10v8h2v30h12l5-7 5 7h10V70H0Z" fill="#8E7D60"/><circle cx="83" cy="22" r="4" fill="#E9DFC8"/><path d="M0 60h120" stroke="#A6AFAE" stroke-width="12" opacity=".75"/></svg>';
  function gazette() {
    const td = today(), ses = S.sessions.filter(s => dayKey(new Date(s.at)) === td);
    const mins = ses.reduce((a, s) => a + (s.mins || 0), 0), floors = ses.reduce((a, s) => a + (s.mins >= 15 ? Math.max(1, Math.round(s.mins / 30)) : 0), 0);
    const done = S.tasks.filter(x => x.done && x.doneAt && dayKey(new Date(x.doneAt)) === td);
    const days = new Set(S.sessions.map(s => dayKey(new Date(s.at)))).size;
    let head = t('gz_quiet');
    if (ses.length) head = `${ses.length === 1 ? t('gz_ses1') : t('gz_ses', { n: ses.length })}, ${t('gz_focus', { t: ML.fmtMins(mins) })}`
      + (floors ? ' : ' + (floors === 1 ? t('gz_floor1') : t('gz_floors', { n: floors })) : done.length ? ' : ' + (done.length === 1 ? t('gz_task1') : t('gz_tasks', { n: done.length })) : '');
    const Q = S.game && S.game.quests, quests = Q && Q.day === td ? Q.claimed.length : 0;
    const tmr = ML.eventsOn ? ML.eventsOn(ML.addDays(td, 1)).length : 0;
    const wx = t(day.rain ? 'gz_w_rain' : day.snow ? 'gz_w_snow' : 'gz_w_mist');
    const date = new Date().toLocaleDateString(ML.locale(), { weekday: 'long', day: 'numeric', month: 'long' });
    const doneTxt = done.length ? done.slice(0, 4).map(x => ML.titleOf ? ML.titleOf(x) : x.title).join(', ') + (done.length > 4 ? '…' : '.') : t('gz_done_none');
    const text = `${t('gz_title')} · ${date}\n${head}\n${t('gz_done_h')} ${doneTxt}\n${t('gz_brief', { s: ML.streaks().cur, q: quests })}`;
    ov.innerHTML = `<div class="sheet gz-sheet" role="dialog" aria-modal="true" aria-labelledby="gz-h">
      <div class="gz-meta"><span>${esc(t('gz_no', { n: days || 1 }))}</span><span>${esc(date)}</span><span>${esc(t('gz_price'))}</span></div>
      <h2 id="gz-h" class="gz-title">${esc(t('gz_title'))}</h2><p class="gz-tag">${esc(t('gz_tag'))}</p>
      <p class="gz-head">${esc(head)}</p>
      <div class="gz-cols"><div><p><b>${esc(t('gz_done_h'))}</b> ${esc(doneTxt)}</p><p><b>${esc(t('gz_weather_h'))}</b> ${esc(t('gz_weather', { e: t('mood_' + S.mood).toLowerCase(), w: wx }))}</p></div>
        <div>${SKYLINE}<p><b>${esc(t('gz_brief_h'))}</b> ${esc(t('gz_brief', { s: ML.streaks().cur, q: quests }))}</p></div></div>
      <div class="gz-foot"><span>${esc(tmr ? t('gz_tomorrow', { n: tmr }) : t('gz_tomorrow0'))}</span><button type="button" class="link" data-gz="share">${esc(t('gz_share'))} ↗</button></div>
      <button type="button" class="ghost icon-only gz-x" data-close="gazette" aria-label="${esc(t('close'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`;
    ov.dataset.text = text;
  }
  ML.openGazette = () => { gazette(); ML.openOverlay('gazette'); };
  ov.addEventListener('click', async e => {
    if (!e.target.closest('[data-gz="share"]')) return;
    const text = ov.dataset.text || '';
    try { if (navigator.share) { await navigator.share({ title: t('gz_title'), text }); return; } } catch (err) { if (err && err.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast(t('gz_copied')); } catch (err) {}
  });
  // in Codex, from 5 pm the end-of-session screen offers the day's Gazette
  ML.endExtras = () => isOn() && new Date().getHours() >= 17 ? `<button type="button" class="link end-gazette" data-gazette>${esc(t('gz_open'))}</button>` : '';
  document.addEventListener('click', e => { if (e.target.closest('[data-gazette]')) setTimeout(ML.openGazette, 0); });
})();
