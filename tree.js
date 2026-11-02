// The Tree (3.63): You section. One tree per school year, worked out from S.sessions: a week is a branch, a Flow session a flower,
// a comeback a bud, an empty week a bare branch. The roots come from the Health check (ML.priv, this device only, never in S and never sent).
// Skins: oak free, plate after 10 h of work, willow / holo / pixel after 25 h in their world, pine in the shop. Colours and dressing are shop items (economy.js, category tree).
// Lively adds the growth shown at the end of a session and a Weekly challenge. ML.treeGrove draws the Room's shared grove (rooms.js).
(() => {
  'use strict';
  const { $, S, t, esc, on, save, toast, fmtMins, dayKey } = ML;
  const A = ML.TreeArt;

  ML.addStrings({
    fr: {
      tab_tree: 'Arbre', hb_tree: 'Ton année', tr_year: 'Year tree · {y}', tr_prev: 'Année précédente', tr_next: 'Année suivante',
      tr_none: 'Ta première session fera pousser la première branche.', tr_week: 'Semaine {n}', tr_week_range: '{a} au {b}', tr_week_v: '{m} · {s} sessions · {f} Flow', tr_week_v1: '{m} · 1 session · {f} Flow', tr_week_empty: 'Semaine vide : la branche reste nue.', tr_week_prev: 'Semaine précédente', tr_week_next: 'Semaine suivante', tr_alt: 'Ton arbre : {n} semaines, {f} sessions Flow.',
      tr_key: 'Lire son arbre', tr_key_1: 'Une semaine ajoute une branche, et ses sessions la font grandir.', tr_key_2: 'Une session Flow ouvre une fleur. Un retour après un trou fait un bourgeon vif.', tr_key_3: 'Une semaine vide laisse une branche nue. L’arbre ne meurt jamais.', tr_key_4: 'Les racines viennent du check Santé : sommeil, eau, bougé. Elles restent sur cet appareil.',
      tr_roots_off: 'Active le check Santé pour faire pousser les racines.', tr_roots_go: 'Ouvrir Santé', tr_skins: 'Arbres', tr_use: 'Utiliser', tr_used: 'Utilisé', tr_custom: 'Personnaliser dans la boutique', tr_prog: '{a} sur {b} h', tr_in: 'dans {w}', tr_all: 'de travail', tr_shop: 'À la boutique', tr_unlocked: 'Nouvel arbre débloqué : {name}',
      tr_oak: 'Chêne', tr_plate: 'Planche gravée', tr_willow: 'Saule de l’étang', tr_pine: 'Pin taillé', tr_holo: 'Hologramme', tr_pixel: 'Arbre du lac',
      ch_title: 'Weekly challenge', ch_won: 'Réussi : une fleur rare est sur ton arbre.', ch_toast: 'Weekly challenge réussi : une fleur rare s’ouvre.', ch_prog: '{a} sur {b}', ch_flow3: 'Fais 3 sessions Flow', ch_morning3: 'Fais 3 sessions avant midi', ch_long: 'Tiens une session de 50 min sans pause', ch_days3: 'Travaille 3 jours différents', ch_starts5: 'Lance 5 sessions, même courtes', ch_days4: 'Travaille 4 jours différents', ch_clean5: 'Fais 5 sessions sans décrocher',
      end_tree: 'Ton arbre pousse',
      cat_tree: 'Arbre', tree_hint: 'L’or change l’apparence, jamais la croissance. Feuilles, branches et fleurs vont sur tous les arbres ; le reste sur le chêne.',
      tree_pine: 'Pin taillé', tree_pine_d: 'Un pin du jardin de lune : nuages d’aiguilles et lanterne.',
      tree_lf_season: 'Saisons', tree_lf_season_d: 'Chaque branche garde la couleur de sa saison.', tree_lf_sakura: 'Sakura', tree_lf_sakura_d: 'Feuillage rose toute l’année.', tree_lf_ember: 'Braise', tree_lf_ember_d: 'Rouge et orange, un automne sans fin.', tree_lf_silver: 'Argent', tree_lf_silver_d: 'Un feuillage pâle et métallique.', tree_lf_jade: 'Jade', tree_lf_jade_d: 'Un vert profond et froid.', tree_lf_violet: 'Violet', tree_lf_violet_d: 'Un feuillage de nuit.', tree_lf_gold: 'Or', tree_lf_gold_d: 'Toutes les feuilles dorées.',
      tree_br_bark: 'Écorce', tree_br_bark_d: 'La couleur d’origine de chaque arbre.', tree_br_ash: 'Frêne blanc', tree_br_ash_d: 'Des branches claires.', tree_br_ebony: 'Ébène', tree_br_ebony_d: 'Des branches presque noires.', tree_br_gold: 'Branches d’or', tree_br_gold_d: 'Un tronc doré.', tree_br_verdigris: 'Vert-de-gris', tree_br_verdigris_d: 'Un vieux cuivre.', tree_br_ember: 'Bois rouge', tree_br_ember_d: 'Un bois de braise.',
      tree_fl_gold: 'Fleurs d’or', tree_fl_gold_d: 'Les fleurs du Flow, d’origine.', tree_fl_plum: 'Prunier', tree_fl_plum_d: 'Fleurs blanches, cœur rose.', tree_fl_camellia: 'Camélia', tree_fl_camellia_d: 'Fleurs rouges.', tree_fl_star: 'Étoile', tree_fl_star_d: 'Fleurs bleu pâle.',
      tree_hg_none: 'Branches nues', tree_hg_none_d: 'Rien dans les branches.', tree_hg_lanterns: 'Lanternes', tree_hg_lanterns_d: 'Des lanternes aux branches.', tree_hg_swing: 'Balançoire', tree_hg_swing_d: 'Sous une grosse branche.', tree_hg_birds: 'Oiseaux', tree_hg_birds_d: 'Quelques oiseaux posés.',
      tree_gd_grass: 'Prairie', tree_gd_grass_d: 'L’herbe au pied du chêne.', tree_gd_pond: 'Mare', tree_gd_pond_d: 'Une mare et ses nénuphars.', tree_gd_stones: 'Pierres', tree_gd_stones_d: 'Un cercle de pierres moussues.', tree_gd_mush: 'Champignons', tree_gd_mush_d: 'Champignons et lucioles.',
      tree_sk_dusk: 'Crépuscule', tree_sk_dusk_d: 'Le ciel d’origine du chêne.', tree_sk_night: 'Nuit', tree_sk_night_d: 'Un ciel plein d’étoiles.', tree_sk_dawn: 'Aube', tree_sk_dawn_d: 'Un ciel clair du matin.',
      gr_title: 'Shared grove', gr_show: 'Afficher le bosquet', gr_share: 'Montrer mon arbre', gr_share_h: 'Les membres voient ton arbre et ton animal, jamais tes racines ni tes chiffres exacts.', gr_empty: 'Personne ne montre son arbre pour l’instant.', gr_sql: 'Pour voir les arbres des autres, le serveur doit être mis à jour (supabase/room-trees.sql).', gr_alt: 'Le bosquet de la salle : {names}.', gr_you: 'Toi',
    },
    en: {
      tab_tree: 'Tree', hb_tree: 'Your year', tr_year: 'Year tree · {y}', tr_prev: 'Previous year', tr_next: 'Next year',
      tr_none: 'Your first session will grow the first branch.', tr_week: 'Week {n}', tr_week_range: '{a} to {b}', tr_week_v: '{m} · {s} sessions · {f} Flow', tr_week_v1: '{m} · 1 session · {f} Flow', tr_week_empty: 'Empty week: the branch stays bare.', tr_week_prev: 'Previous week', tr_week_next: 'Next week', tr_alt: 'Your tree: {n} weeks, {f} Flow sessions.',
      tr_key: 'How to read it', tr_key_1: 'A week adds a branch, and its sessions make it grow.', tr_key_2: 'A Flow session opens a flower. A comeback after a gap makes a bright bud.', tr_key_3: 'An empty week leaves a bare branch. The tree never dies.', tr_key_4: 'The roots come from the Health check: sleep, water, moving. They stay on this device.',
      tr_roots_off: 'Turn on the Health check to grow the roots.', tr_roots_go: 'Open Health', tr_skins: 'Trees', tr_use: 'Use', tr_used: 'In use', tr_custom: 'Customize in the shop', tr_prog: '{a} of {b} h', tr_in: 'in {w}', tr_all: 'of work', tr_shop: 'In the shop', tr_unlocked: 'New tree unlocked: {name}',
      tr_oak: 'Oak', tr_plate: 'Engraved plate', tr_willow: 'Pond willow', tr_pine: 'Cloud pine', tr_holo: 'Hologram', tr_pixel: 'Lake tree',
      ch_title: 'Weekly challenge', ch_won: 'Done: a rare flower is on your tree.', ch_toast: 'Weekly challenge done: a rare flower opens.', ch_prog: '{a} of {b}', ch_flow3: 'Do 3 Flow sessions', ch_morning3: 'Do 3 sessions before noon', ch_long: 'Hold a 50 min session with no pause', ch_days3: 'Work on 3 different days', ch_starts5: 'Start 5 sessions, even short ones', ch_days4: 'Work on 4 different days', ch_clean5: 'Do 5 sessions with no distraction',
      end_tree: 'Your tree grows',
      cat_tree: 'Tree', tree_hint: 'Gold changes how it looks, never how it grows. Leaves, branches and flowers go on every tree; the rest on the oak.',
      tree_pine: 'Cloud pine', tree_pine_d: 'A moon garden pine: clouds of needles and a lantern.',
      tree_lf_season: 'Seasons', tree_lf_season_d: 'Each branch keeps the colour of its season.', tree_lf_sakura: 'Sakura', tree_lf_sakura_d: 'Pink leaves all year.', tree_lf_ember: 'Ember', tree_lf_ember_d: 'Red and orange, an endless autumn.', tree_lf_silver: 'Silver', tree_lf_silver_d: 'Pale, metallic leaves.', tree_lf_jade: 'Jade', tree_lf_jade_d: 'A deep, cold green.', tree_lf_violet: 'Violet', tree_lf_violet_d: 'Night leaves.', tree_lf_gold: 'Gold', tree_lf_gold_d: 'Every leaf golden.',
      tree_br_bark: 'Bark', tree_br_bark_d: 'Each tree’s original colour.', tree_br_ash: 'White ash', tree_br_ash_d: 'Pale branches.', tree_br_ebony: 'Ebony', tree_br_ebony_d: 'Almost black branches.', tree_br_gold: 'Golden branches', tree_br_gold_d: 'A golden trunk.', tree_br_verdigris: 'Verdigris', tree_br_verdigris_d: 'Old copper.', tree_br_ember: 'Red wood', tree_br_ember_d: 'A glowing wood.',
      tree_fl_gold: 'Gold flowers', tree_fl_gold_d: 'The original Flow flowers.', tree_fl_plum: 'Plum', tree_fl_plum_d: 'White flowers, pink heart.', tree_fl_camellia: 'Camellia', tree_fl_camellia_d: 'Red flowers.', tree_fl_star: 'Star', tree_fl_star_d: 'Pale blue flowers.',
      tree_hg_none: 'Bare branches', tree_hg_none_d: 'Nothing in the branches.', tree_hg_lanterns: 'Lanterns', tree_hg_lanterns_d: 'Lanterns on the branches.', tree_hg_swing: 'Swing', tree_hg_swing_d: 'Under a big branch.', tree_hg_birds: 'Birds', tree_hg_birds_d: 'A few birds perched.',
      tree_gd_grass: 'Meadow', tree_gd_grass_d: 'Grass at the oak’s foot.', tree_gd_pond: 'Pond', tree_gd_pond_d: 'A pond and its water lilies.', tree_gd_stones: 'Stones', tree_gd_stones_d: 'A ring of mossy stones.', tree_gd_mush: 'Mushrooms', tree_gd_mush_d: 'Mushrooms and fireflies.',
      tree_sk_dusk: 'Dusk', tree_sk_dusk_d: 'The oak’s original sky.', tree_sk_night: 'Night', tree_sk_night_d: 'A sky full of stars.', tree_sk_dawn: 'Dawn', tree_sk_dawn_d: 'A clear morning sky.',
      gr_title: 'Shared grove', gr_show: 'Show the grove', gr_share: 'Show my tree', gr_share_h: 'Members see your tree and familiar, never your roots or exact numbers.', gr_empty: 'Nobody is showing a tree yet.', gr_sql: 'To see other members’ trees, the server needs an update (supabase/room-trees.sql).', gr_alt: 'The room’s grove: {names}.', gr_you: 'You',
    },
  });
  ML.defaults(() => ({ tree: { rare: {}, grove: true, share: true } }));
  const T = () => { if (!S.tree || typeof S.tree !== 'object') S.tree = {}; if (!S.tree.rare) S.tree.rare = {}; return S.tree; };

  /* ---------- Hours and what they unlock ---------- */
  // Older sessions only know their energy: they count for that energy's day world
  const DAY_WORLD = { drained: 'sanctuary', steady: 'observatory', fired: 'netrunner', scattered: 'arcade' };
  const worldOf = s => s.world || DAY_WORLD[s.mood] || null;
  ML.sessionWorld = mood => { const w = ML.worldNow ? ML.worldNow(mood) : null; return w && !w.light ? w.th : null; };
  function minsIn(world, list = S.sessions) { let m = 0; for (const s of list) if (!world || worldOf(s) === world) m += s.mins; return m; }
  const RULES = { oak: null, plate: { h: 10 }, willow: { h: 25, world: 'sanctuary' }, holo: { h: 25, world: 'netrunner' }, pixel: { h: 25, world: 'arcade' }, pine: { shop: true } };
  const ownedPine = () => !!(S.econ && S.econ.owned && (S.econ.owned.tree || []).includes('pine'));
  function hasSkin(k, list) {
    const r = RULES[k]; if (r === undefined) return false; if (r === null) return true;
    if (r.shop) return ownedPine();
    return minsIn(r.world, list) >= r.h * 60;
  }
  const skinNow = () => { const k = S.econ && S.econ.equip && S.econ.equip.treeSkin; return hasSkin(k) ? k : 'oak'; };
  const nameOf = k => t('tr_' + k);

  /* ---------- Weeks ---------- */
  const monday = at => { const d = new Date(at); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; };
  const yearOf = at => { const d = new Date(at); return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; }; // a school year starts in September
  const seasonOf = d => [1, 1, 2, 2, 2, 3, 3, 3, 0, 0, 0, 1][d.getMonth()];
  function weeksOf(y, list = S.sessions) {
    const from = new Date(y, 8, 1).getTime(), to = new Date(y + 1, 8, 1).getTime(), mine = list.filter(s => s.at >= from && s.at < to);
    if (!mine.length) return [];
    const first = monday(Math.min(...mine.map(s => s.at))), last = monday(Date.now() < to ? Date.now() : Math.max(...mine.map(s => s.at))), byKey = {}, out = [];
    mine.forEach(s => { const k = dayKey(monday(s.at)); (byKey[k] = byKey[k] || []).push(s); });
    for (let d = new Date(first), guard = 0; d <= last && guard < 60; d.setDate(d.getDate() + 7), guard++) {
      const key = dayKey(d), ss = byKey[key] || [];
      out.push({ key, at: d.getTime(), s: ss.length, mins: ss.reduce((a, s) => a + s.mins, 0), f: ss.filter(s => ML.isFlow && ML.isFlow(s)).length, back: ss.some(s => s.comeback), rare: !!T().rare[key], empty: !ss.length, season: seasonOf(d) });
    }
    return out.slice(-52).map((w, i) => Object.assign(w, { i }));
  }
  const years = () => { const set = new Set(S.sessions.map(s => yearOf(s.at))); set.add(yearOf(Date.now())); return [...set].sort((a, b) => a - b); };

  /* ---------- Roots: read from the Health check, never stored in S ---------- */
  const SCORE = { sleep: { short: .2, mid: .7, long: 1 }, water: { low: .25, ok: 1 }, move: { no: .2, yes: 1 } };
  function rootValues(y) {
    if (!ML.priv || !ML.priv.get('healthCfg', { on: false }).on) return null;
    const l = ML.priv.get('health', {}), nowY = yearOf(Date.now()), cut = y === nowY ? dayKey(new Date(Date.now() - 28 * 864e5)) : dayKey(new Date(y, 8, 1)), end = y === nowY ? '9' : dayKey(new Date(y + 1, 8, 1));
    const days = Object.keys(l).filter(k => k >= cut && k < end); if (!days.length) return null;
    return ['sleep', 'water', 'move'].map(q => { const v = days.map(k => SCORE[q][l[k][q]]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : .12; });
  }
  const rootNames = () => [t('q_sleep'), t('q_water'), t('q_move')];
  function dress() {
    const q = (S.econ && S.econ.equip) || {};
    return { leaf: q.treeLeaf, bark: q.treeBark, flower: q.treeFlower, hang: q.treeHang, ground: q.treeGround, sky: q.treeSky };
  }

  /* ---------- The page ---------- */
  let viewY = null, selWeek = null, cv = null, ctx = null, hits = [], paintedKey = '', paintT = 0;
  const nowWeeks = () => weeksOf(viewY);
  function fit(skin) {
    const [W, H] = A.SIZE(skin);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    cv.classList.toggle('tr-px', skin === 'pixel');
    if (skin === 'pixel') { const box = cv.parentElement ? cv.parentElement.clientWidth : 0, dpr = window.devicePixelRatio || 1, k = Math.max(1, Math.floor(box * dpr / W)); cv.style.width = box ? W * k / dpr + 'px' : ''; } else cv.style.width = '';
  }
  function paintNow() {
    if (!cv || !cv.isConnected) return;
    const skin = skinNow(), weeks = nowWeeks(), roots = rootValues(viewY), o = Object.assign(dress(), { roots, rootNames: rootNames(), title: t('tr_week', { n: weeks.length }) });
    const key = JSON.stringify([skin, weeks, o]);
    fit(skin);
    if (key !== paintedKey) { hits = A.paint(ctx, skin, weeks, o) || []; paintedKey = key; }
    marker();
  }
  // The selected week: a ring placed over the canvas, so choosing a week never repaints the tree
  function marker() {
    const m = $('tr-mark'); if (!m || !cv) return;
    const pts = hits.filter(h => h.i === selWeek); if (!pts.length) { m.hidden = true; return; }
    const x = pts.reduce((a, p) => a + p.x, 0) / pts.length, y = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    m.hidden = false; m.style.left = x / cv.width * cv.clientWidth + cv.offsetLeft + 'px'; m.style.top = y / cv.height * cv.clientHeight + cv.offsetTop + 'px';
  }
  function weekCard(weeks) {
    if (!weeks.length) return `<p class="insight">${esc(t('tr_none'))}</p>`;
    if (selWeek == null || !weeks[selWeek]) selWeek = weeks.length - 1;
    const w = weeks[selWeek], end = new Date(w.at + 6 * 864e5), fmt = d => d.toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' });
    return `<div class="tr-week"><button type="button" class="icon-btn" data-wk="-1" aria-label="${esc(t('tr_week_prev'))}" ${selWeek ? '' : 'disabled'}>‹</button>
      <div><b>${esc(t('tr_week', { n: selWeek + 1 }))}</b> <small>${esc(t('tr_week_range', { a: fmt(new Date(w.at)), b: fmt(end) }))}</small>
      <p class="insight">${esc(w.empty ? t('tr_week_empty') : t(w.s === 1 ? 'tr_week_v1' : 'tr_week_v', { m: fmtMins(w.mins), s: w.s, f: w.f }))}</p></div>
      <button type="button" class="icon-btn" data-wk="1" aria-label="${esc(t('tr_week_next'))}" ${selWeek < weeks.length - 1 ? '' : 'disabled'}>›</button></div>`;
  }
  function skinTile(k) {
    const r = RULES[k], own = hasSkin(k), cur = skinNow() === k; let state;
    if (cur) state = `<span class="eq-tag">✓ ${esc(t('tr_used'))}</span>`;
    else if (own) state = `<button type="button" class="small" data-skin="${k}">${esc(t('tr_use'))}</button>`;
    else if (r.shop) state = `<button type="button" class="small" data-open-shop>${esc(t('tr_shop'))}</button>`;
    else { const m = minsIn(r.world); state = `<small>${esc(t('tr_prog', { a: (m / 60).toFixed(m < 600 ? 1 : 0), b: r.h }))} ${esc(r.world ? t('tr_in', { w: t('th_' + r.world) }) : t('tr_all'))}</small><span class="y-track"><b style="width:${Math.min(100, m / (r.h * 60) * 100).toFixed(0)}%"></b></span>`; }
    return `<div class="tr-skin ${cur ? 'on' : ''} ${own ? '' : 'locked'}"><img class="tree-prev" data-tp="skin:${k}" alt=""><b>${esc(nameOf(k))}</b>${state}</div>`;
  }
  /* ---------- Weekly challenge (Lively) ---------- */
  const CH = { further: ['flow3', 'morning3', 'long'], start: ['days3', 'starts5'], phone: ['days4', 'clean5'] };
  const GOAL = { flow3: 3, morning3: 3, long: 1, days3: 3, starts5: 5, days4: 4, clean5: 5 };
  function challenge() {
    const key = dayKey(monday(Date.now())), list = CH[S.goalProfile] || CH.further; let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const kind = list[h % list.length], from = monday(Date.now()).getTime(), ss = S.sessions.filter(s => s.at >= from), goal = GOAL[kind]; let n = 0;
    if (kind === 'flow3') n = ss.filter(s => ML.isFlow(s)).length;
    else if (kind === 'morning3') n = ss.filter(s => new Date(s.start || s.at).getHours() < 12).length;
    else if (kind === 'long') n = ss.filter(s => s.mins >= 50 && !s.pauses).length;
    else if (kind === 'days3' || kind === 'days4') n = new Set(ss.map(s => dayKey(new Date(s.at)))).size;
    else if (kind === 'starts5') n = ss.length;
    else if (kind === 'clean5') n = ss.filter(s => s.mins >= 5 && !s.distractions).length;
    return { key, kind, n: Math.min(n, goal), goal, won: !!T().rare[key] };
  }
  function render() {
    const el = $('tree'); if (!el || S.tab !== 'tree') return;
    const ys = years(); if (viewY == null || !ys.includes(viewY)) viewY = ys[ys.length - 1];
    const weeks = nowWeeks(), roots = rootValues(viewY), yi = ys.indexOf(viewY), lively = S.youStyle === 'lively', c = lively ? challenge() : null, flows = weeks.reduce((a, w) => a + w.f, 0);
    const html = `<div class="y-page tr-page">
      <div class="g-card"><div class="y-row"><h2>${esc(t('tr_year', { y: viewY + '-' + String(viewY + 1).slice(2) }))}</h2>${ys.length > 1 ? `<div class="tr-years"><button type="button" class="icon-btn" data-yr="-1" aria-label="${esc(t('tr_prev'))}" ${yi ? '' : 'disabled'}>‹</button><button type="button" class="icon-btn" data-yr="1" aria-label="${esc(t('tr_next'))}" ${yi < ys.length - 1 ? '' : 'disabled'}>›</button></div>` : ''}</div>
        <div class="tr-stage" id="tr-stage"><i class="tr-mark" id="tr-mark" hidden></i></div>
        ${weekCard(weeks)}
        ${roots ? '' : `<p class="insight tr-rootsoff">${esc(t('tr_roots_off'))} <button type="button" class="link" data-go-health>${esc(t('tr_roots_go'))}</button></p>`}</div>
      ${c ? `<div class="g-card ${c.won ? 'tr-won' : ''}"><div class="y-row"><h2>${esc(t('ch_title'))}</h2><span class="insight">${esc(t('ch_prog', { a: c.n, b: c.goal }))}</span></div><p>${esc(c.won ? t('ch_won') : t('ch_' + c.kind))}</p><span class="y-track"><b style="width:${(c.n / c.goal * 100).toFixed(0)}%"></b></span></div>` : ''}
      <div class="g-card"><h2>${esc(t('tr_skins'))}</h2><div class="tr-skins">${['oak', 'plate', 'willow', 'holo', 'pixel', 'pine'].map(skinTile).join('')}</div><button type="button" class="small" data-open-shop="tree">${esc(t('tr_custom'))}</button></div>
      <details class="g-card y-det"><summary>${esc(t('tr_key'))}</summary>${[1, 2, 3, 4].map(i => `<p class="insight">${esc(t('tr_key_' + i))}</p>`).join('')}</details></div>`;
    if (el.dataset.h !== html) {
      const open = !!el.querySelector('details[open]');
      el.innerHTML = html; el.dataset.h = html;
      if (open) el.querySelector('details').open = true;
      if (!cv) {
        cv = document.createElement('canvas'); cv.id = 'tr-canvas'; ctx = cv.getContext('2d');
        cv.addEventListener('click', pickAt);
      }
      $('tr-stage').prepend(cv); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', t('tr_alt', { n: weeks.length, f: flows }));
      fit(skinNow());
      thumbs(el);
    }
    clearTimeout(paintT); paintT = setTimeout(paintNow, cv.width && paintedKey ? 0 : 30); // the tab opens first, then the painting
  }
  function pickAt(e) {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * cv.width, y = (e.clientY - r.top) / r.height * cv.height; let best = null, d = (cv.width / 8) ** 2;
    hits.forEach(h => { const q = (h.x - x) ** 2 + (h.y - y) ** 2; if (q < d) { d = q; best = h; } });
    if (best) { selWeek = best.i; render(); marker(); }
  }
  $('tree').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.yr) { const ys = years(), i = ys.indexOf(viewY) + +b.dataset.yr; if (ys[i] != null) { viewY = ys[i]; selWeek = null; render(); } return; }
    if (b.dataset.wk) { selWeek = (selWeek || 0) + +b.dataset.wk; render(); marker(); return; }
    if (b.dataset.skin) { if (hasSkin(b.dataset.skin)) { S.econ.equip.treeSkin = b.dataset.skin; save(); render(); } return; }
    if (b.hasAttribute('data-go-health')) { ML.setTab('health'); return; }
    if (b.hasAttribute('data-open-shop')) { ML.openShop(); const h = $('shop-tree'); if (h) setTimeout(() => h.scrollIntoView({ block: 'start' }), 60); }
  });
  addEventListener('resize', () => { if (S.tab === 'tree' && cv) { fit(skinNow()); marker(); } });

  /* ---------- Pictures for the shop and the tree tiles: painted on demand, one at a time, kept in memory ---------- */
  const SAMPLE = A.sample(18), thumbCache = {}, queue = [];
  let thumbT = 0;
  function thumbFor(tp) {
    const [kind, k] = tp.split(':'), o = kind === 'skin' ? { roots: null } : { roots: null, [{ lf: 'leaf', br: 'bark', fl: 'flower', hg: 'hang', gd: 'ground', sk: 'sky' }[k.slice(0, 2)] || 'x']: k };
    const skin = kind === 'skin' ? k : k === 'pine' ? 'pine' : 'oak', [W, H] = A.SIZE(skin), big = document.createElement('canvas'); big.width = W; big.height = H;
    A.paint(big.getContext('2d'), skin, SAMPLE, o);
    const small = document.createElement('canvas'); small.width = 240; small.height = 190; const g = small.getContext('2d'); g.imageSmoothingEnabled = skin !== 'pixel'; g.imageSmoothingQuality = 'high'; g.drawImage(big, 0, 0, 240, 190);
    return small.toDataURL('image/jpeg', .82);
  }
  function thumbs(root) {
    root.querySelectorAll('img[data-tp]').forEach(img => { const tp = img.dataset.tp; if (thumbCache[tp]) img.src = thumbCache[tp]; else if (!queue.includes(tp)) queue.push(tp); });
    if (!queue.length) return;
    clearTimeout(thumbT);
    const step = () => {
      const tp = queue.shift(); if (!tp) return;
      try { thumbCache[tp] = thumbFor(tp); } catch (e) { thumbCache[tp] = ''; }
      document.querySelectorAll(`img[data-tp="${tp}"]`).forEach(i => { if (thumbCache[tp]) i.src = thumbCache[tp]; });
      if (queue.length) thumbT = setTimeout(step, 16);
    };
    thumbT = setTimeout(step, 60);
  }
  ML.treePrevs = thumbs;
  ML.treePrev = k => `<img class="tree-prev" data-tp="item:${k}" alt="">`;

  /* ---------- What a session does ---------- */
  on('session', s => {
    const before = S.sessions.filter(x => x !== s), won = Object.keys(RULES).filter(k => RULES[k] && !RULES[k].shop && !hasSkin(k, before) && hasSkin(k));
    if (won.length) setTimeout(() => toast(t('tr_unlocked', { name: nameOf(won[0]) }), { ms: 8000, action: { label: t('tr_use'), fn: () => { S.econ.equip.treeSkin = won[0]; save(); render(); } } }), 1200);
    if (S.youStyle === 'lively') { const c = challenge(); if (!c.won && c.n >= c.goal) { T().rare[c.key] = 1; save(); setTimeout(() => toast(t('ch_toast'), { ms: 7000 }), 1800); } }
    pendingGrow = S.youStyle === 'lively' && s.mins >= 10 ? { at: s.at, played: false } : null;
    if (pendingGrow) pendingGrow.before = before;
    render();
  });

  /* ---------- L1: in Lively, the end-of-session screen shows the branch growing ---------- */
  let pendingGrow = null;
  const prevEnd = ML.endExtras;
  ML.endExtras = s => {
    const rest = prevEnd ? prevEnd(s) : '';
    if (!pendingGrow || pendingGrow.at !== s.at) return rest;
    setTimeout(playGrow, 0);
    return `<div class="end-tree"><small>${esc(t('end_tree'))}</small><canvas id="end-tree" role="img" aria-label="${esc(t('end_tree'))}"></canvas></div>` + rest;
  };
  function playGrow() {
    const g0 = pendingGrow, c = $('end-tree'); if (!g0 || !c) return;
    const skin = skinNow(), [W, H] = A.SIZE(skin), y = yearOf(g0.at), o = Object.assign(dress(), { roots: rootValues(y), rootNames: rootNames(), title: null }), after = weeksOf(y);
    c.width = W; c.height = H; c.classList.toggle('tr-px', skin === 'pixel');
    const g = c.getContext('2d');
    if (g0.after) { g.imageSmoothingEnabled = skin !== 'pixel'; g.drawImage(g0.after, 0, 0); return; } // the sheet re-rendered (a rating): just the finished tree
    const mk = () => { const x = document.createElement('canvas'); x.width = W; x.height = H; return x; }, cA = mk(), cB = mk();
    const before = weeksOf(y, g0.before), hitA = A.paint(cA.getContext('2d'), skin, after, o) || []; A.paint(cB.getContext('2d'), skin, before, o);
    g0.after = cA;
    g.imageSmoothingEnabled = skin !== 'pixel';
    if (ML.reducedMotion()) { g.drawImage(cA, 0, 0); return; }
    // A growing disc reveals the new drawing: from the changed week when the tree only gained a little, from the trunk when a new week began
    const last = after.length - 1, mine = hitA.filter(h => h.i === last), sameWeeks = before.length === after.length && mine.length;
    const ox = sameWeeks ? mine[0].x : W / 2, oy = sameWeeks ? mine[0].y : H * .74, Rm = sameWeeks ? Math.max(30 * W / 960, ...mine.map(h => Math.hypot(h.x - ox, h.y - oy))) * 1.5 + 30 * W / 960 : Math.hypot(W, H) * .75;
    const t0 = performance.now(), MS = 3200;
    const frame = now => {
      if (!c.isConnected) return;
      const k = Math.min(1, (now - t0) / MS), e = 1 - Math.pow(1 - k, 3);
      g.drawImage(cB, 0, 0); g.save(); g.beginPath(); g.arc(ox, oy, Rm * e + .01, 0, Math.PI * 2); g.clip(); g.drawImage(cA, 0, 0); g.restore();
      if (k < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ---------- L5: the Room's shared grove ---------- */
  // What leaves this device: coarse numbers only (sessions rounded up to even, Flow capped), no hours, no dates, no roots
  ML.treeShareData = () => {
    const y = yearOf(Date.now()), q = dress(), E = S.econ || { equip: {} };
    return { v: 1, skin: skinNow(), leaf: q.leaf || null, bark: q.bark || null, flower: q.flower || null, fam: E.equip.familiar || 'owl', cos: E.equip.costume || null,
      w: weeksOf(y).map(w => [Math.ceil(w.s / 2) * 2, Math.min(w.f, 3), (w.back ? 1 : 0) | (w.rare ? 2 : 0), w.season]) };
  };
  const FAMS = ['owl', 'cat', 'raven', 'fox', 'hippo'];
  const num = (v, a, b) => { const n = +v; return Number.isFinite(n) ? Math.max(a, Math.min(b, Math.round(n))) : a; };
  function cleanData(d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.w)) return null;
    const one = (v, obj) => (typeof v === 'string' && Object.prototype.hasOwnProperty.call(obj, v) ? v : null);
    return { skin: A.SKINS.includes(d.skin) ? d.skin : 'oak', leaf: one(d.leaf, A.LEAVES), bark: one(d.bark, A.BARKS), flower: one(d.flower, A.FLOWERS), fam: FAMS.includes(d.fam) ? d.fam : 'owl', cos: (ML.COSTUMES || []).includes(d.cos) ? d.cos : null,
      weeks: d.w.slice(-52).map((x, i) => { const r = Array.isArray(x) ? x : [], s = num(r[0], 0, 40), fl = num(r[2], 0, 3); return { i, s, f: Math.min(s, num(r[1], 0, 3)), back: !!(fl & 1), rare: !!(fl & 2), empty: !s, season: num(r[3], 0, 3) }; }) };
  }
  const box = document.createElement('div'); box.className = 'gv-wrap';
  let gvKey = '', gvJob = 0;
  const TILE = 340, GH = 340, GY = 296;
  function drawGrove(list) {
    const id = ++gvJob, n = Math.max(list.length, 3), W = n * TILE, c = document.createElement('canvas'); c.width = W; c.height = GH; c.className = 'gv-canvas';
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', t('gr_alt', { names: list.map(m => m.name).join(', ') }));
    const g = c.getContext('2d'); A.groveScene(g, W, GH, GY);
    const left = i => (n - list.length) * TILE / 2 + (i + .5) * TILE;
    const fams = list.map((m, i) => { const st = m.status === 'focus' ? 'focus' : m.status === 'away' ? 'sleep' : 'idle'; return `<div class="gv-m gv-${esc(m.status)}" style="left:${(left(i) / W * 100).toFixed(2)}%">${m.status === 'focus' ? '<i class="gv-lamp"></i>' : ''}<span class="gv-fam">${ML.familiarSvg ? ML.familiarSvg(m.d.fam, st, m.d.cos) : ''}</span><b>${esc(m.name)}</b></div>`; }).join('');
    box.innerHTML = `<div class="gv" style="--n:${n}"></div>`; box.firstChild.append(c); box.firstChild.insertAdjacentHTML('beforeend', fams);
    let i = 0;
    const step = () => { if (id !== gvJob || i >= list.length) return; const m = list[i]; try { A.bare(g, m.d.skin, m.d.weeks, left(i), GY, .44, { leaf: m.d.leaf, bark: m.d.bark, flower: m.d.flower, dens: .7 }); } catch (e) {} i++; setTimeout(step, 16); };
    setTimeout(step, 16);
  }
  ML.treeGrove = {
    // members: [{ id, name, status, data }]. The element stays the same across the Room's renders, so a poll never repaints the trees
    mount(slot, members) {
      const list = members.map(m => ({ id: m.id, name: m.name, status: m.status, d: cleanData(m.data) })).filter(m => m.d);
      if (!list.length) { slot.innerHTML = `<p class="hint">${esc(t('gr_empty'))}</p>`; gvKey = ''; return; }
      const key = JSON.stringify(list); slot.append(box);
      if (key !== gvKey) { gvKey = key; drawGrove(list); }
    },
  };

  on('tab', n => { if (n === 'tree') render(); });
  on('render', render); on('minute', render); on('lang', render); on('rated', render); on('cosmetics', render); on('period', render);
  on('started', () => { render(); });
})();
