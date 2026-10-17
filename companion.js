// Familiar (owl / black cat / raven / fox) that grows with your Sequence and reacts to what you do,
// and the mage tower: every focus session adds floors, abandoning one makes a floor crumble.
(() => {
  'use strict';
  const { $, S, t, esc, save, on, emit, toast, dayKey, today } = ML;

  ML.addStrings({
    fr: {
      fam_owl: 'Hibou', fam_owl_d: 'Sage et patient. Il veille la nuit.', fam_cat: 'Chat noir', fam_cat_d: 'Mystérieux, un peu moqueur.',
      fam_raven: 'Corbeau', fam_raven_d: 'Messager du brouillard gris.', fam_fox: 'Renard', fam_fox_d: 'Vif et malin, toujours prêt.',
      companion: 'Familier', rename: 'Nom du familier', stage_0: 'Bébé', stage_1: 'Jeune', stage_2: 'Adulte', stage_3: 'Ancien',
      tower: 'Ta tour de mage', floors_n_one: '{n} étage', floors_n: '{n} étages', floors_today: '+{n} aujourd’hui', tower_fell: 'Session abandonnée : un étage de ta tour s’est écroulé.', tower_fell_left: 'Mode strict : tu as quitté l’app, un étage s’est écroulé.',
      tower_rules: 'Chaque session d’au moins 15 min ajoute un étage (un par demi-heure). Abandonner avant la moitié fait tomber un étage.',
      tower_best: 'Record : {n} étages en un jour', tower_fallen: 'Écroulés cette semaine : {n}',
      l_idle: ['Prêt quand tu l’es.', 'On attaque quelle quête ?', 'Je garde un œil sur ta tour.', 'Un étage de plus aujourd’hui ?'],
      l_focus: ['Chut… je monte la garde.', 'Je surveille les distractions.', 'Un étage est en construction.', 'Concentre-toi, je m’occupe du reste.'],
      l_break: ['Pause méritée. Étire-toi.', 'Bois un peu d’eau, je garde la tour.', 'Respire. On repart bientôt.'],
      l_happy: ['Bien joué ! Un étage de plus.', 'Ta tour grandit !', 'Magnifique session.', 'Ça, c’est du focus.'],
      l_sad: ['Aïe… un étage s’est écroulé.', 'Pas grave, on reconstruit.'],
      l_sleep: ['Zzz… réveille-moi pour une session.', 'Zzz…'],
      l_pet: ['Hé, ça chatouille !', '♥', 'Merci, ça fait du bien.', 'On s’y remet ?'],
      l_morning: 'Bonjour ! Une session pour bien commencer ?',
    },
    en: {
      fam_owl: 'Owl', fam_owl_d: 'Wise and patient. Watches over the night.', fam_cat: 'Black cat', fam_cat_d: 'Mysterious, a little cheeky.',
      fam_raven: 'Raven', fam_raven_d: 'Messenger of the gray fog.', fam_fox: 'Fox', fam_fox_d: 'Quick and clever, always ready.',
      companion: 'Familiar', rename: 'Familiar name', stage_0: 'Baby', stage_1: 'Young', stage_2: 'Adult', stage_3: 'Elder',
      tower: 'Your mage tower', floors_n_one: '{n} floor', floors_n: '{n} floors', floors_today: '+{n} today', tower_fell: 'Session abandoned: a floor of your tower crumbled.', tower_fell_left: 'Strict mode: you left the app, a floor crumbled.',
      tower_rules: 'Every session of at least 15 min adds a floor (one per half hour). Quitting before halfway knocks one down.',
      tower_best: 'Record: {n} floors in a day', tower_fallen: 'Crumbled this week: {n}',
      l_idle: ['Ready when you are.', 'Which quest are we taking on?', 'I’m watching your tower.', 'One more floor today?'],
      l_focus: ['Shh… I’m on guard.', 'I’ll watch for distractions.', 'A floor is going up.', 'Focus, I’ve got the rest.'],
      l_break: ['Well-earned break. Stretch.', 'Drink some water, I’ll guard the tower.', 'Breathe. Back soon.'],
      l_happy: ['Nice! One more floor.', 'Your tower is growing!', 'Beautiful session.', 'Now that’s focus.'],
      l_sad: ['Ouch… a floor crumbled.', 'No worries, we rebuild.'],
      l_sleep: ['Zzz… wake me for a session.', 'Zzz…'],
      l_pet: ['Hey, that tickles!', '♥', 'Thanks, I needed that.', 'Back to it?'],
      l_morning: 'Good morning! A session to start strong?',
    },
  });
  ML.defaults(() => ({ companion: { name: null }, tower: { floors: 0, init: false, day: null, built: 0, fallen: 0, best: 0, log: {}, fallLog: [] } }));

  const NAMES = { owl: 'Nox', cat: 'Salem', raven: 'Corvus', fox: 'Kitsu' };
  const species = () => (S.econ && S.econ.equip.familiar) || 'owl';
  const famName = () => S.companion.name || NAMES[species()];
  const stage = () => { const i = ML.seqInfo().i; return i >= 7 ? 3 : i >= 4 ? 2 : i >= 2 ? 1 : 0; };

  /* ---------- Familiar drawings (64×64) ---------- */
  const EYES = {
    owl: '<circle class="f-eye white" cx="24" cy="26" r="7"/><circle class="f-eye white" cx="40" cy="26" r="7"/><circle class="f-pupil" cx="24" cy="26" r="3.2"/><circle class="f-pupil" cx="40" cy="26" r="3.2"/>',
    cat: '<ellipse class="f-eye" cx="27" cy="27" rx="3.6" ry="4.2"/><ellipse class="f-eye" cx="37" cy="27" rx="3.6" ry="4.2"/><ellipse class="f-pupil" cx="27" cy="27" rx="1.3" ry="3.4"/><ellipse class="f-pupil" cx="37" cy="27" rx="1.3" ry="3.4"/>',
    raven: '<circle class="f-eye" cx="40" cy="22" r="3.2"/><circle class="f-pupil" cx="40.6" cy="22" r="1.6"/>',
    fox: '<ellipse class="f-eye" cx="26" cy="25" rx="3" ry="3.4"/><ellipse class="f-eye" cx="38" cy="25" rx="3" ry="3.4"/><circle class="f-pupil" cx="26" cy="25.4" r="1.6"/><circle class="f-pupil" cx="38" cy="25.4" r="1.6"/>',
  };
  const BODY = {
    owl: `<path class="f-wing" d="M14 34 C9 40 11 48 16 51 Z M50 34 C55 40 53 48 48 51 Z"/>
      <path class="f-body" d="M14 52 C10 36 14 18 32 16 C50 18 54 36 50 52 Z"/><path class="f-body" d="M18 20 L14 8 L26 16 Z M46 20 L50 8 L38 16 Z"/>
      <path class="f-belly" d="M22 51 C20 41 24 33 32 33 C40 33 44 41 42 51 Z"/><path class="f-beak" d="M30 31 L34 31 L32 35 Z"/>
      <path class="f-feet" d="M27 52 v3 M30 52 v3 M34 52 v3 M37 52 v3"/>`,
    cat: `<path class="f-tail" d="M45 50 C58 48 58 34 52 29"/>
      <ellipse class="f-body" cx="32" cy="45" rx="14" ry="10"/><circle class="f-body" cx="32" cy="27" r="13"/>
      <path class="f-body" d="M21 22 L20 9 L29 17 Z M43 22 L44 9 L35 17 Z"/><path class="f-inner" d="M22 19 L21.5 13 L26 17 Z M42 19 L42.5 13 L38 17 Z"/>
      <path class="f-beak" d="M30.5 31.5 L33.5 31.5 L32 33.5 Z"/><path class="f-line" d="M19 31 L26 32 M19 34 L26 33.5 M45 31 L38 32 M45 34 L38 33.5"/>`,
    raven: `<path class="f-body" d="M16 46 C14 32 22 20 34 20 C44 20 48 28 46 38 C45 46 40 52 30 52 L11 58 L20 50 Z"/>
      <circle class="f-body" cx="38" cy="24" r="10"/><path class="f-beak" d="M46 21 L58 25.5 L46 29 Z"/>
      <path class="f-wing" d="M19 36 C26 29 36 31 41 40 C34 47 25 46 19 36 Z"/><path class="f-feet" d="M28 52 v5 M34 51 v5"/>`,
    fox: `<path class="f-body" d="M44 48 C58 50 61 34 52 27 C54 38 48 44 43 44 Z"/><path class="f-belly" d="M57 33 C59 30 56 26 52 27 C54 29 55.5 31 57 33 Z"/>
      <ellipse class="f-body" cx="32" cy="46" rx="13" ry="9"/>
      <path class="f-body" d="M16 22 L21 8 L28 18 L36 18 L43 8 L48 22 C48 32 40 38 32 38 C24 38 16 32 16 22 Z"/>
      <path class="f-inner" d="M20 18 L21.5 12 L25 17 Z M44 18 L42.5 12 L39 17 Z"/>
      <path class="f-belly" d="M18 26 C22 34 28 37 32 37 C36 37 42 34 46 26 C40 30 36 30 32 33 C28 30 24 30 18 26 Z"/><circle class="f-beak" cx="32" cy="32.5" r="1.8"/>`,
  };
  const HAT_POS = { owl: 'translate(20 -2)', cat: 'translate(20 -4)', raven: 'translate(26 -4)', fox: 'translate(20 -6)' };
  function familiarSvg(kind = species(), state = 'idle', st = 2) {
    return `<svg class="fam fam-${kind} ${state} st-${st}" viewBox="-4 -14 72 78" aria-hidden="true">
      <ellipse class="f-shadow" cx="32" cy="58" rx="16" ry="3"/>
      <g class="f-all">${BODY[kind]}<g class="f-eyes">${EYES[kind]}</g>
      ${st >= 3 ? `<g transform="${HAT_POS[kind]}"><path class="f-hat" d="M0 12 C3 8 5 4 10 0 C9 4 11 8 16 12 Z"/><path class="f-hatband" d="M1 11 H15"/></g>` : ''}</g>
      <g class="f-zzz"><text x="46" y="8">z</text><text x="52" y="0">z</text><text x="58" y="-8">Z</text></g>
      <g class="f-spark"><path d="M8 6 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 Z"/><path d="M52 14 l1.5 -4 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 Z"/></g>
    </svg>`;
  }
  ML.familiarSvg = (k, s) => familiarSvg(k, s, 2);

  /* ---------- Behaviour ---------- */
  let flash = null, flashT = null, line = null, lastActive = Date.now();
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const lines = key => { const v = t(key); return Array.isArray(v) ? v : [v]; };
  function currentState() {
    if (flash) return flash;
    if (ML.running()) return S.mode === 'focus' ? 'focus' : 'break';
    const h = new Date().getHours();
    if (h >= 23 || h < 6 || Date.now() - lastActive > 90 * 60000) return 'sleep';
    return 'idle';
  }
  function react(state, ms = 6000) {
    flash = state; line = pick(lines('l_' + state));
    clearTimeout(flashT); flashT = setTimeout(() => { flash = null; line = null; renderPerch(); }, ms);
    renderPerch();
  }
  let lastState = null;
  function renderPerch() {
    const el = $('perch'); if (!el) return;
    const st = currentState();
    if (st !== lastState && !flash) {
      line = st === 'idle' && new Date().getHours() < 10 && !S.sessions.some(s => dayKey(new Date(s.at)) === today()) ? t('l_morning') : pick(lines('l_' + st));
      lastState = st;
    }
    const T = S.tower;
    el.innerHTML = `
      <button type="button" class="fam-btn" id="fam-btn" title="${esc(famName())} · ${esc(t('fam_' + species()))} · ${esc(t('stage_' + stage()))}">${familiarSvg(species(), st, stage())}</button>
      <div class="bubble"><b>${esc(famName())}</b><span>${esc(line || '')}</span></div>
      <button type="button" class="mini-tower" id="mini-tower" title="${esc(t('tower'))}">${towerSvg(Math.min(8, Math.max(1, T.day === today() ? T.built : 0)), T.day === today() ? T.built : 0, true)}
        <span><b>${esc(ML.tn('floors_n', T.floors))}</b><small>${esc(t('floors_today', { n: T.day === today() ? T.built : 0 }))}</small></span></button>`;
    $('fam-btn').onclick = () => { react('happy', 3500); line = pick(lines('l_pet')); renderPerch(); ML.sfx && ML.sfx('task'); lastActive = Date.now(); };
    $('mini-tower').onclick = () => { ML.setTab('grim'); setTimeout(() => { const c = $('tower-card'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60); };
  }

  /* ---------- Tower ---------- */
  const gainFor = mins => (mins >= 15 ? Math.max(1, Math.round(mins / 30)) : 0);
  function towerDay() { const T = S.tower; if (T.day !== today()) { T.day = today(); T.built = 0; T.fallen = 0; } return T; }
  function initTower() {
    const T = S.tower; if (T.init) return;
    T.floors = S.sessions.reduce((a, s) => a + gainFor(s.mins), 0);
    S.sessions.forEach(s => { const k = dayKey(new Date(s.at)); T.log[k] = (T.log[k] || 0) + gainFor(s.mins); });
    T.best = Math.max(0, ...Object.values(T.log));
    T.init = true; save();
  }
  // Tower drawing: n stacked floors (lit windows for today's), a roof with a flag
  function towerSvg(n, litToday, mini) {
    const fh = mini ? 7 : 14, w = mini ? 22 : 64, x0 = mini ? 4 : 18, top = mini ? 18 : 40;
    const H = top + n * fh + (mini ? 4 : 18);
    let floors = '';
    for (let i = 0; i < n; i++) {
      const y = H - (mini ? 4 : 18) - (i + 1) * fh, lit = i >= n - litToday;
      floors += `<rect class="tw-floor ${lit ? 'lit' : ''}" x="${x0}" y="${y}" width="${w}" height="${fh - 1}"/>`;
      if (!mini) for (let k = 0; k < 3; k++) floors += `<rect class="tw-win ${lit ? 'lit' : ''}" x="${x0 + 10 + k * 18}" y="${y + 4}" width="7" height="${fh - 8}" rx="3"/>`;
      else floors += `<rect class="tw-win ${lit ? 'lit' : ''}" x="${x0 + 8}" y="${y + 2}" width="6" height="${fh - 4}"/>`;
    }
    const roofY = H - (mini ? 4 : 18) - n * fh;
    const roof = `<path class="tw-roof" d="M${x0 - (mini ? 2 : 6)} ${roofY} L${x0 + w / 2} ${roofY - (mini ? 14 : 34)} L${x0 + w + (mini ? 2 : 6)} ${roofY} Z"/>`
      + (mini ? '' : `<path class="tw-pole" d="M${x0 + w / 2} ${roofY - 34} v-12"/><path class="tw-flag" d="M${x0 + w / 2} ${roofY - 46} l14 4 l-14 4 Z"/>`);
    const base = mini ? `<rect class="tw-base" x="${x0 - 3}" y="${H - 4}" width="${w + 6}" height="4"/>` : `<rect class="tw-base" x="${x0 - 8}" y="${H - 18}" width="${w + 16}" height="18"/><path class="tw-door" d="M${x0 + w / 2 - 7} ${H} v-12 a7 7 0 0 1 14 0 v12 Z"/>`;
    return `<svg class="tower ${mini ? 'mini' : ''}" viewBox="0 0 ${mini ? 30 : 100} ${H}" ${mini ? 'width="30"' : ''} aria-hidden="true">${floors}${roof}${base}</svg>`;
  }
  on('session', s => {
    initTower();
    const g = gainFor(s.mins); if (!g) return;
    const T = towerDay(); T.floors += g; T.built += g; T.log[T.day] = (T.log[T.day] || 0) + g; T.best = Math.max(T.best, T.log[T.day]);
    save(); lastActive = Date.now(); react('happy');
  });
  on('abandon', () => {
    initTower();
    const T = towerDay();
    if (T.floors > 0) { T.floors--; T.fallen++; T.built = Math.max(0, T.built - 1); T.fallLog.push(Date.now()); if (T.fallLog.length > 200) T.fallLog = T.fallLog.slice(-200); }
    save(); toast(t('tower_fell')); react('sad', 8000);
    const mt = document.querySelector('.mini-tower'); if (mt) { mt.classList.remove('crumble'); void mt.offsetWidth; mt.classList.add('crumble'); }
  });
  on('left', ({ strict }) => {
    if (!strict) { react('sad', 6000); return; }
    initTower();
    const T = towerDay();
    if (T.floors > 0) { T.floors--; T.fallen++; T.built = Math.max(0, T.built - 1); T.fallLog.push(Date.now()); }
    save(); toast(t('tower_fell_left')); react('sad', 8000);
    const mt = document.querySelector('.mini-tower'); if (mt) { mt.classList.remove('crumble'); void mt.offsetWidth; mt.classList.add('crumble'); }
  });
  on('timer', () => { lastActive = Date.now(); renderPerch(); });
  on('xp', () => { const f = document.querySelector('.fam'); if (f) { f.classList.remove('hop'); void f.getBoundingClientRect(); f.classList.add('hop'); } });
  on('render', renderPerch);
  on('minute', renderPerch);
  on('cosmetics', () => { lastState = null; renderPerch(); });
  on('started', () => { initTower(); towerDay(); renderPerch(); });

  /* ---------- Grimoire: tower + familiar ---------- */
  on('grimoire', () => {
    initTower();
    const T = towerDay(), shown = Math.min(24, T.floors), weekAgo = Date.now() - 7 * 864e5;
    const card = document.createElement('div');
    card.className = 'g-card tower-card'; card.id = 'tower-card';
    card.innerHTML = `<h2>${esc(t('tower'))}</h2>
      <div class="tower-row">
        <div class="tower-big">${shown ? towerSvg(shown, Math.min(shown, T.built), false) : towerSvg(1, 0, false)}${T.floors > 24 ? `<span class="tw-more">+${T.floors - 24}</span>` : ''}</div>
        <div class="tower-info">
          <strong>${esc(ML.tn('floors_n', T.floors))}</strong>
          <span>${esc(t('floors_today', { n: T.built }))}</span>
          <span>${esc(t('tower_best', { n: T.best }))}</span>
          <span>${esc(t('tower_fallen', { n: T.fallLog.filter(x => x > weekAgo).length }))}</span>
          <p class="hint">${esc(t('tower_rules'))}</p>
          <div class="fam-card">${familiarSvg(species(), 'idle', stage())}
            <label class="field"><span>${esc(t('rename'))}</span><input type="text" id="fam-name" maxlength="20" value="${esc(famName())}"></label>
            <small>${esc(t('fam_' + species()))} · ${esc(t('stage_' + stage()))}</small>
            <button type="button" class="small ghost" id="fam-shop">${esc(t('shop'))} ◈</button>
          </div>
        </div>
      </div>`;
    $('g-game').prepend(card);
    $('fam-name').onchange = e => { S.companion.name = e.target.value.trim() || null; save(); renderPerch(); };
    $('fam-shop').onclick = () => ML.openShop();
  });
})();
