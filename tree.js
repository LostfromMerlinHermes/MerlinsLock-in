// The Tree (3.63): You section. One tree per school year, worked out from S.sessions: a week is a branch, a Flow session a flower,
// a comeback a bud, an empty week a bare branch. The roots come from the Health check (ML.priv, this device only, never in S and never sent).
// Skins: oak free, plate after 10 h of work, willow / holo / pixel after 25 h in their world, pine in the shop. Colours and dressing are shop items (economy.js, category tree).
// Lively adds the growth shown at the end of a session and a Weekly challenge. ML.treeGrove draws the Room's shared grove (rooms.js).
(() => {
  'use strict';
  const { $, S, t, esc, on, emit, save, toast, fmtMins, dayKey } = ML;
  const A = ML.TreeArt;

  ML.addStrings({
    fr: {
      tr_wk_goal: 'cette semaine, sur {g} visées', tr_wk_nogoal: 'cette semaine', tr_wk_sub: '{s} sessions, dont {f} Flow.', tr_wk_sub0: '{s} sessions.', tr_wk_sub1: '1 session.', tr_wk_sub1f: '1 session, en Flow.', tr_wk_none: 'Aucune session pour l’instant.', tr_touch: 'Touche l’arbre pour voir ton année.',
      tr_tint: 'Couleurs des matières', tr_tint_on: 'Chaque semaine prend la couleur de la matière qui l’a remplie. Les semaines sans matière gardent tes feuilles.', tr_tint_off: 'Afficher', tr_tint_hide: 'Masquer', tr_tint_skin: 'Les couleurs des matières vont sur le chêne, la planche, le saule, le pin et l’arbre du lac.',
      ng_idle: '{s} : rien depuis {n} jours', ng_never: '{s} : aucune session encore', ng_exam: 'Examen dans {n} jours.', ng_exam1: 'Examen demain.', ng_add: 'Ajouter une session au Plan', ng_task: 'Réviser {s}', ng_done: 'Ajouté au Plan pour demain.',
      rv2_h: 'Bilan de la semaine {n}', rv2_line: '{m}, {s} sessions, dont {f} Flow.', rv2_line0: '{m}, {s} sessions.', rv2_line1: '{m}, 1 session.', rv2_worked: 'Ce qui a marché', rv2_stuck: 'Ce qui a coincé', rv2_next: 'La semaine prochaine',
      rv2_b_morning: 'les sessions du matin', rv2_b_afternoon: 'les sessions de l’après-midi', rv2_b_evening: 'les sessions du soir', rv2_b_night: 'les sessions de nuit', rv2_full: '{when} : {a} sur {b} finies.', rv2_day: 'ta meilleure journée : {d}, {m}.',
      rv2_gap: 'rien en {s} cette semaine.', rv2_cut: '{n} sessions arrêtées avant la fin.', rv2_slip: '{n} tâches prévues pas faites.', rv2_fine: 'rien de notable.',
      rv2_exam: '{x} {d}.', rv2_plan_s: '3 sessions en {s} proposées {days} à {h}.', rv2_plan: '3 sessions proposées {days} à {h}.', rv2_task: 'Session de travail',
      rv2_go: 'Mettre dans le Plan', rv2_write: 'Écrire ma revue', rv2_later: 'Plus tard', rv2_done: '3 sessions placées dans ta journée.', rv2_and: 'et',
      tab_tree: 'Arbre', hb_tree: 'Ton année', tr_year: 'Ton année {y}', tr_prev: 'Année précédente', tr_next: 'Année suivante',
      tr_none: 'Ta première session fera pousser la première branche.', tr_week: 'Semaine {n}', tr_week_range: '{a} au {b}', tr_week_v: '{m}, {s} sessions, dont {f} Flow', tr_week_v1: '{m}, 1 session, {f} Flow', tr_week_empty: 'Semaine vide : la branche reste nue.', tr_week_prev: 'Semaine précédente', tr_week_next: 'Semaine suivante', tr_alt: 'Ton arbre : {n} semaines, {f} sessions Flow.',
      tr_key: 'Lire son arbre', tr_key_1: 'Une semaine ajoute une branche, et ses sessions la font grandir.', tr_key_2: 'Une session Flow ouvre une fleur. Un retour après un trou fait un bourgeon vif.', tr_key_3: 'Une semaine vide laisse une branche nue. L’arbre ne meurt jamais.', tr_key_4: 'Les racines viennent du point santé : sommeil, eau, bougé. Elles restent sur cet appareil.',
      tr_roots_off: 'Active le point santé pour faire pousser les racines.', tr_roots_go: 'Ouvrir Bien-être', tr_skins: 'Arbres', tr_use: 'Utiliser', tr_used: 'Utilisé', tr_custom: 'Personnaliser dans la boutique', tr_prog: '{a} h sur {b} h', tr_in: 'dans {w}', tr_all: 'de travail', tr_shop: 'À la boutique', tr_unlocked: 'Nouvel arbre débloqué : {name}',
      tr_oak: 'Chêne', tr_plate: 'Planche gravée', tr_willow: 'Saule de l’étang', tr_pine: 'Pin taillé', tr_holo: 'Hologramme', tr_pixel: 'Arbre du lac',
      tr_orrery: 'Planétaire', tr_atlas: 'Atlas des étoiles', tr_fan: 'Éventail de mer', tr_coral: 'Corail noir', tr_pages: 'Arbre aux pages', tr_crystal: 'Arbre de cristal', tr_wired: 'Arbre câblé', tr_silver: 'Arbre d’argent', tr_hanging: 'Arbre suspendu',
      tree_atlas: 'Atlas des étoiles', tree_atlas_d: 'Ton année tracée comme une constellation sur une vieille carte du ciel.', tree_coral: 'Corail noir', tree_coral_d: 'Un corail sombre dont chaque semaine libère une méduse.', tree_crystal: 'Arbre de cristal', tree_crystal_d: 'Un tronc taillé comme une gemme, des grappes de cristaux qui flottent.', tree_hanging: 'Arbre suspendu', tree_hanging_d: 'Il pousse vers le bas, sous un rocher, au-dessus d’une mer de brume.',
      tr_y_hours: 'cette année', tr_y_weeks: 'semaines travaillées', tr_y_best: 'meilleure semaine', tr_y_flow: 'sessions Flow',
      tr_wk_up: '{d} de plus que la semaine d’avant', tr_wk_down: '{d} de moins que la semaine d’avant', tr_wk_same: 'Autant que la semaine d’avant', tr_wk_done: 'Tâches finies', tr_wk_more: 'et {n} autres', tr_wk_what: 'Ce que tu as travaillé', tr_wk_other: 'Sans matière', tr_wk_rest: '{n} autres',
      ch_title: 'Défi de la semaine', ch_won: 'Réussi : une fleur rare est sur ton arbre.', ch_toast: 'Défi de la semaine réussi : une fleur rare s’ouvre.', ch_prog: '{a} sur {b}', ch_flow3: 'Fais 3 sessions Flow', ch_morning3: 'Fais 3 sessions avant midi', ch_long: 'Tiens une session de 50 min sans pause', ch_days3: 'Travaille 3 jours différents', ch_starts5: 'Lance 5 sessions, même courtes', ch_days4: 'Travaille 4 jours différents', ch_clean5: 'Fais 5 sessions sans décrocher',
      end_tree: 'Ton arbre pousse',
      cat_tree: 'Arbre', tree_hint: 'L’or change l’apparence, jamais la croissance. Feuilles, branches et fleurs vont sur le chêne, la planche, le saule, le pin, l’hologramme et l’arbre du lac ; le reste sur le chêne. Les arbres des mondes gardent leurs couleurs.',
      tree_pine: 'Pin taillé', tree_pine_d: 'Un pin du jardin de lune : nuages d’aiguilles et lanterne.',
      tree_lf_season: 'Saisons', tree_lf_season_d: 'Chaque branche garde la couleur de sa saison.', tree_lf_sakura: 'Sakura', tree_lf_sakura_d: 'Feuillage rose toute l’année.', tree_lf_ember: 'Braise', tree_lf_ember_d: 'Rouge et orange, un automne sans fin.', tree_lf_silver: 'Argent', tree_lf_silver_d: 'Un feuillage pâle et métallique.', tree_lf_jade: 'Jade', tree_lf_jade_d: 'Un vert profond et froid.', tree_lf_violet: 'Violet', tree_lf_violet_d: 'Un feuillage de nuit.', tree_lf_gold: 'Or', tree_lf_gold_d: 'Toutes les feuilles dorées.',
      tree_br_bark: 'Écorce', tree_br_bark_d: 'La couleur d’origine de chaque arbre.', tree_br_ash: 'Frêne blanc', tree_br_ash_d: 'Des branches claires.', tree_br_ebony: 'Ébène', tree_br_ebony_d: 'Des branches presque noires.', tree_br_gold: 'Branches d’or', tree_br_gold_d: 'Un tronc doré.', tree_br_verdigris: 'Vert-de-gris', tree_br_verdigris_d: 'Un vieux cuivre.', tree_br_ember: 'Bois rouge', tree_br_ember_d: 'Un bois de braise.',
      tree_fl_gold: 'Fleurs d’or', tree_fl_gold_d: 'Les fleurs du Flow, d’origine.', tree_fl_plum: 'Prunier', tree_fl_plum_d: 'Fleurs blanches, cœur rose.', tree_fl_camellia: 'Camélia', tree_fl_camellia_d: 'Fleurs rouges.', tree_fl_star: 'Étoile', tree_fl_star_d: 'Fleurs bleu pâle.',
      tree_hg_none: 'Branches nues', tree_hg_none_d: 'Rien dans les branches.', tree_hg_lanterns: 'Lanternes', tree_hg_lanterns_d: 'Des lanternes aux branches.', tree_hg_swing: 'Balançoire', tree_hg_swing_d: 'Sous une grosse branche.', tree_hg_birds: 'Oiseaux', tree_hg_birds_d: 'Quelques oiseaux posés.',
      tree_gd_grass: 'Prairie', tree_gd_grass_d: 'L’herbe au pied du chêne.', tree_gd_pond: 'Mare', tree_gd_pond_d: 'Une mare et ses nénuphars.', tree_gd_stones: 'Pierres', tree_gd_stones_d: 'Un cercle de pierres moussues.', tree_gd_mush: 'Champignons', tree_gd_mush_d: 'Champignons et lucioles.',
      tree_sk_dusk: 'Crépuscule', tree_sk_dusk_d: 'Le ciel d’origine du chêne.', tree_sk_night: 'Nuit', tree_sk_night_d: 'Un ciel plein d’étoiles.', tree_sk_dawn: 'Aube', tree_sk_dawn_d: 'Un ciel clair du matin.',
      gr_title: 'Bosquet partagé', gr_show: 'Afficher le bosquet', gr_share: 'Montrer mon arbre', gr_share_h: 'Les membres voient ton arbre et ton animal, jamais tes racines ni tes chiffres exacts.', gr_empty: 'Personne ne montre son arbre pour l’instant.', gr_sql: 'Pour voir les arbres des autres, le serveur doit être mis à jour (supabase/room-trees.sql).', gr_alt: 'Le bosquet de la salle : {names}.', gr_you: 'Toi',
    },
    en: {
      tr_wk_goal: 'this week, of {g} planned', tr_wk_nogoal: 'this week', tr_wk_sub: '{s} sessions, {f} in Flow.', tr_wk_sub0: '{s} sessions.', tr_wk_sub1: '1 session.', tr_wk_sub1f: '1 session, in Flow.', tr_wk_none: 'No session yet.', tr_touch: 'Tap the tree to see your year.',
      tr_tint: 'Subject colours', tr_tint_on: 'Each week takes the colour of the subject that filled it. Weeks without a subject keep your leaves.', tr_tint_off: 'Show', tr_tint_hide: 'Hide', tr_tint_skin: 'Subject colours go on the oak, plate, willow, pine and lake tree.',
      ng_idle: '{s}: nothing for {n} days', ng_never: '{s}: no session yet', ng_exam: 'Exam in {n} days.', ng_exam1: 'Exam tomorrow.', ng_add: 'Add a session to the Plan', ng_task: 'Study {s}', ng_done: 'Added to the Plan for tomorrow.',
      rv2_h: 'Week {n} review', rv2_line: '{m}, {s} sessions, {f} in Flow.', rv2_line0: '{m}, {s} sessions.', rv2_line1: '{m}, 1 session.', rv2_worked: 'What worked', rv2_stuck: 'What got stuck', rv2_next: 'Next week',
      rv2_b_morning: 'morning sessions', rv2_b_afternoon: 'afternoon sessions', rv2_b_evening: 'evening sessions', rv2_b_night: 'night sessions', rv2_full: '{when}: {a} of {b} finished.', rv2_day: 'your best day: {d}, {m}.',
      rv2_gap: 'nothing in {s} this week.', rv2_cut: '{n} sessions stopped early.', rv2_slip: '{n} planned tasks not done.', rv2_fine: 'nothing worth noting.',
      rv2_exam: '{x} on {d}.', rv2_plan_s: '3 {s} sessions suggested {days} at {h}.', rv2_plan: '3 sessions suggested {days} at {h}.', rv2_task: 'Work session',
      rv2_go: 'Put it in the Plan', rv2_write: 'Write my review', rv2_later: 'Later', rv2_done: '3 sessions placed in your day.', rv2_and: 'and',
      tab_tree: 'Tree', hb_tree: 'Your year', tr_year: 'Your year {y}', tr_prev: 'Previous year', tr_next: 'Next year',
      tr_none: 'Your first session will grow the first branch.', tr_week: 'Week {n}', tr_week_range: '{a} to {b}', tr_week_v: '{m}, {s} sessions, {f} in Flow', tr_week_v1: '{m}, 1 session, {f} Flow', tr_week_empty: 'Empty week: the branch stays bare.', tr_week_prev: 'Previous week', tr_week_next: 'Next week', tr_alt: 'Your tree: {n} weeks, {f} Flow sessions.',
      tr_key: 'How to read it', tr_key_1: 'A week adds a branch, and its sessions make it grow.', tr_key_2: 'A Flow session opens a flower. A comeback after a gap makes a bright bud.', tr_key_3: 'An empty week leaves a bare branch. The tree never dies.', tr_key_4: 'The roots come from the Health check: sleep, water, moving. They stay on this device.',
      tr_roots_off: 'Turn on the Health check to grow the roots.', tr_roots_go: 'Open Wellbeing', tr_skins: 'Trees', tr_use: 'Use', tr_used: 'In use', tr_custom: 'Customize in the shop', tr_prog: '{a} h of {b} h', tr_in: 'in {w}', tr_all: 'of work', tr_shop: 'In the shop', tr_unlocked: 'New tree unlocked: {name}',
      tr_oak: 'Oak', tr_plate: 'Engraved plate', tr_willow: 'Pond willow', tr_pine: 'Cloud pine', tr_holo: 'Hologram', tr_pixel: 'Lake tree',
      tr_orrery: 'Orrery', tr_atlas: 'Star atlas', tr_fan: 'Sea fan', tr_coral: 'Black coral', tr_pages: 'Page tree', tr_crystal: 'Crystal tree', tr_wired: 'Wired tree', tr_silver: 'Silver tree', tr_hanging: 'Hanging tree',
      tree_atlas: 'Star atlas', tree_atlas_d: 'Your year drawn as a constellation on an old sky chart.', tree_coral: 'Black coral', tree_coral_d: 'A dark coral; each week sets a jellyfish free.', tree_crystal: 'Crystal tree', tree_crystal_d: 'A trunk cut like a gem, clusters of crystal floating free.', tree_hanging: 'Hanging tree', tree_hanging_d: 'It grows downward under a rock, above a sea of fog.',
      tr_y_hours: 'this year', tr_y_weeks: 'weeks worked', tr_y_best: 'best week', tr_y_flow: 'Flow sessions',
      tr_wk_up: '{d} more than the week before', tr_wk_down: '{d} less than the week before', tr_wk_same: 'Same as the week before', tr_wk_done: 'Tasks done', tr_wk_more: 'and {n} more', tr_wk_what: 'What you worked on', tr_wk_other: 'No subject', tr_wk_rest: '{n} more',
      ch_title: 'Weekly challenge', ch_won: 'Done: a rare flower is on your tree.', ch_toast: 'Weekly challenge done: a rare flower opens.', ch_prog: '{a} of {b}', ch_flow3: 'Do 3 Flow sessions', ch_morning3: 'Do 3 sessions before noon', ch_long: 'Hold a 50 min session with no pause', ch_days3: 'Work on 3 different days', ch_starts5: 'Start 5 sessions, even short ones', ch_days4: 'Work on 4 different days', ch_clean5: 'Do 5 sessions with no distraction',
      end_tree: 'Your tree grows',
      cat_tree: 'Tree', tree_hint: 'Gold changes how it looks, never how it grows. Leaves, branches and flowers go on the oak, plate, willow, pine, hologram and lake tree; the rest on the oak. World trees keep their own colours.',
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
  // World trees: 25 h in their world. Shop trees: bought with gold (economy.js, category tree)
  const RULES = { oak: null, plate: { h: 10 }, willow: { h: 25, world: 'sanctuary' }, orrery: { h: 25, world: 'observatory' }, holo: { h: 25, world: 'netrunner' }, pixel: { h: 25, world: 'arcade' },
    fan: { h: 25, world: 'abyss' }, pages: { h: 25, world: 'sorcerer' }, wired: { h: 25, world: 'neoncity' }, silver: { h: 25, world: 'fog' },
    pine: { shop: true }, atlas: { shop: true }, coral: { shop: true }, crystal: { shop: true }, hanging: { shop: true } };
  const SKIN_ORDER = ['oak', 'plate', 'willow', 'orrery', 'holo', 'pixel', 'fan', 'pages', 'wired', 'silver', 'pine', 'atlas', 'coral', 'crystal', 'hanging'];
  ML.TREE_SHOP_SKINS = Object.keys(RULES).filter(k => RULES[k] && RULES[k].shop);
  const ownedSkin = k => !!(S.econ && S.econ.owned && (S.econ.owned.tree || []).includes(k));
  function hasSkin(k, list) {
    const r = RULES[k]; if (r === undefined) return false; if (r === null) return true;
    if (r.shop) return ownedSkin(k);
    return minsIn(r.world, list) >= r.h * 60;
  }
  const skinNow = () => { const k = S.econ && S.econ.equip && S.econ.equip.treeSkin; return hasSkin(k) ? k : 'oak'; };
  const nameOf = k => t('tr_' + k);

  /* ---------- Weeks ---------- */
  const monday = at => { const d = new Date(at); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; };
  const yearOf = at => { const d = new Date(at); return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; }; // a school year starts in September
  const seasonOf = d => [1, 1, 2, 2, 2, 3, 3, 3, 0, 0, 0, 1][d.getMonth()];
  // C1 (3.66): with subject colours on, a week's leaves take the colour of the subject it spent the most time on
  const subjOf = s => { if (s.subject) return s.subject; const x = s.taskId && S.tasks.find(y => y.id === s.taskId); return (x && x.subject) || null; };
  const subjList = () => S.subjects || [];
  const tintOn = () => T().subj !== false && subjList().length > 0;
  const TINT_SKINS = ['oak', 'plate', 'willow', 'pine', 'pixel'];
  const mixHex = (a, b, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - k) + parseInt(b.substr(i, 2), 16) * k).toString(16).padStart(2, '0')).join('');
  const palCache = {};
  const palFrom = hex => (/^#[0-9a-f]{6}$/i.test(hex || '') ? palCache[hex] || (palCache[hex] = [mixHex(hex, '#0d0a12', .58), mixHex(hex, '#0d0a12', .26), mixHex(hex, '#ffffff', .12), mixHex(hex, '#ffffff', .56)]) : null);
  function mainSubject(ss) {
    const by = {}; ss.forEach(s => { const k = subjOf(s); if (k) by[k] = (by[k] || 0) + s.mins; });
    const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
    return top ? subjList().find(x => x.id === top[0]) || null : null;
  }
  function weeksOf(y, list = S.sessions, tint = tintOn()) {
    const from = new Date(y, 8, 1).getTime(), to = new Date(y + 1, 8, 1).getTime(), mine = list.filter(s => s.at >= from && s.at < to);
    if (!mine.length) return [];
    const first = monday(Math.min(...mine.map(s => s.at))), last = monday(Date.now() < to ? Date.now() : Math.max(...mine.map(s => s.at))), byKey = {}, out = [];
    mine.forEach(s => { const k = dayKey(monday(s.at)); (byKey[k] = byKey[k] || []).push(s); });
    for (let d = new Date(first), guard = 0; d <= last && guard < 60; d.setDate(d.getDate() + 7), guard++) {
      const key = dayKey(d), ss = byKey[key] || [], w = { key, at: d.getTime(), s: ss.length, mins: ss.reduce((a, s) => a + s.mins, 0), f: ss.filter(s => ML.isFlow && ML.isFlow(s)).length, back: ss.some(s => s.comeback), rare: !!T().rare[key], empty: !ss.length, season: seasonOf(d) };
      if (tint && ss.length) { const sub = mainSubject(ss), pal = sub && palFrom(sub.color); if (pal) w.pal = pal; }
      out.push(w);
    }
    return out.slice(-52).map((w, i) => Object.assign(w, { i }));
  }
  /* ---------- This week, and the year, for You and Progress ---------- */
  ML.weekNow = () => { const from = monday(Date.now()).getTime(), ss = S.sessions.filter(s => s.at >= from); return { mins: ss.reduce((a, s) => a + s.mins, 0), s: ss.length, f: ss.filter(s => ML.isFlow && ML.isFlow(s)).length }; };
  ML.weekGoal = () => (ML.dayGoal ? ML.dayGoal() : 0) * 5; // five working days
  ML.treeYear = () => { const ws = weeksOf(yearOf(Date.now()), S.sessions, false); return { mins: ws.reduce((a, w) => a + w.mins, 0), weeks: ws.length }; };
  const D = m => (ML.fmtDur ? ML.fmtDur(m) : fmtMins(m));
  function weekLine(home, bare) { // bare: the number and its bar only (the Tree page says the rest in the week box)
    const w = ML.weekNow(), g = ML.weekGoal();
    const sub = !w.s ? t('tr_wk_none') : w.s === 1 ? t(w.f ? 'tr_wk_sub1f' : 'tr_wk_sub1') : t(w.f ? 'tr_wk_sub' : 'tr_wk_sub0', { s: w.s, f: w.f });
    return `<div class="yl-week"><p class="yl-big"><b>${esc(D(w.mins))}</b> ${esc(g ? t('tr_wk_goal', { g: D(g) }) : t('tr_wk_nogoal'))}</p>${g ? `<span class="y-track"><b style="width:${Math.min(100, w.mins / g * 100).toFixed(1)}%"></b></span>` : ''}${bare ? '' : `<p class="insight">${esc(sub)}${home ? ' ' + esc(t('tr_touch')) : ''}</p>`}</div>`;
  }
  ML.treeWeekLine = weekLine;
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
  // The selected week: a ring placed over the canvas, so choosing a week never repaints the tree.
  // It shows where the week is, then fades out after a few seconds so it doesn't sit on the branches
  let markT = 0;
  function marker() {
    const m = $('tr-mark'); if (!m || !cv) return;
    const pts = hits.filter(h => h.i === selWeek); if (!pts.length) { m.hidden = true; return; }
    const x = pts.reduce((a, p) => a + p.x, 0) / pts.length, y = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    m.hidden = false; m.style.left = x / cv.width * cv.clientWidth + cv.offsetLeft + 'px'; m.style.top = y / cv.height * cv.clientHeight + cv.offsetTop + 'px';
    if (m.dataset.w === String(selWeek)) return; // already shown for this week: leave it faded
    m.dataset.w = selWeek; m.classList.remove('gone'); clearTimeout(markT);
    markT = setTimeout(() => m.classList.add('gone'), 2600);
  }
  /* ---------- What a week was made of: the real work behind a branch ---------- */
  function weekWork(w) {
    // The same Monday-to-Monday bounds as weeksOf (a plain +7 days drops the last hour of a week that changes clock time)
    const from = w.at, to = monday(from + 8 * 864e5).getTime(), ss = S.sessions.filter(s => s.at >= from && s.at < to), subs = S.subjects || [], by = {};
    ss.forEach(s => {
      const task = s.taskId && S.tasks.find(x => x.id === s.taskId), sid = s.subject || (task && task.subject), sub = sid && subs.find(x => x.id === sid);
      const key = sub ? 's:' + sub.id : 't:' + (s.title || ''), e = by[key] || (by[key] = { name: sub ? sub.name : s.title || t('tr_wk_other'), color: sub ? sub.color : null, mins: 0 });
      e.mins += s.mins;
    });
    const rows = Object.values(by).sort((a, b) => b.mins - a.mins), done = S.tasks.filter(x => x.done && x.doneAt >= from && x.doneAt < to);
    return { rows: rows.slice(0, 4), rest: rows.slice(4).reduce((a, r) => a + r.mins, 0), restN: Math.max(0, rows.length - 4), done };
  }
  function weekCard(weeks) {
    if (!weeks.length) return `<p class="insight">${esc(t('tr_none'))}</p>`;
    if (selWeek == null || !weeks[selWeek]) selWeek = weeks.length - 1;
    const w = weeks[selWeek], prev = weeks[selWeek - 1], end = new Date(w.at + 6 * 864e5), fmt = d => d.toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' });
    let detail = '';
    if (!w.empty) {
      const k = weekWork(w), top = k.rows.length ? k.rows[0].mins : 1, d = prev ? w.mins - prev.mins : null;
      const vs = d == null ? '' : `<p class="insight tr-vs">${esc(d ? t(d > 0 ? 'tr_wk_up' : 'tr_wk_down', { d: D(Math.abs(d)) }) : t('tr_wk_same'))}</p>`;
      // The rows always add up to the week's total: what doesn't fit in the top four is one "N more" row
      if (k.rest > 0) k.rows.push({ name: t('tr_wk_rest', { n: k.restN }), color: null, mins: k.rest, rest: true });
      const bars = k.rows.map(r => `<li${r.rest ? ' class="tr-rest"' : ''}><span class="tr-wn">${r.color ? `<i style="background:${esc(r.color)}"></i>` : ''}${esc(r.name)}</span><span class="tr-wb"><b style="width:${Math.min(100, Math.max(4, r.mins / top * 100)).toFixed(0)}%${r.color ? ';background:' + esc(r.color) : ''}"></b></span><small>${esc(D(r.mins))}</small></li>`).join('');
      const done = k.done.length ? `<p class="tr-done"><small>${esc(t('tr_wk_done'))} · ${k.done.length}</small> ${k.done.slice(0, 3).map(x => `<span>${esc(ML.titleOf ? ML.titleOf(x) : x.title)}</span>`).join('')}${k.done.length > 3 ? ` <small>${esc(t('tr_wk_more', { n: k.done.length - 3 }))}</small>` : ''}</p>` : '';
      detail = `${vs}${bars ? `<ul class="tr-work" aria-label="${esc(t('tr_wk_what'))}">${bars}</ul>` : ''}${done}`;
    }
    return `<div class="tr-week"><button type="button" class="icon-btn" data-wk="-1" aria-label="${esc(t('tr_week_prev'))}" ${selWeek ? '' : 'disabled'}>‹</button>
      <div><b>${esc(t('tr_week', { n: selWeek + 1 }))}</b> <small>${esc(t('tr_week_range', { a: new Date(w.at).getMonth() === end.getMonth() ? String(new Date(w.at).getDate()) : fmt(new Date(w.at)), b: fmt(end) }))}</small>
      <p class="insight">${esc(w.empty ? t('tr_week_empty') : t(w.s === 1 ? 'tr_week_v1' : 'tr_week_v', { m: D(w.mins), s: w.s, f: w.f }))}</p></div>
      <button type="button" class="icon-btn" data-wk="1" aria-label="${esc(t('tr_week_next'))}" ${selWeek < weeks.length - 1 ? '' : 'disabled'}>›</button></div>${detail}`;
  }
  /* ---------- C1: the subject left aside before an exam ---------- */
  const daysTo = k => Math.round((ML.parseDay(k) - ML.parseDay(ML.today())) / 864e5);
  const tomorrowKey = () => ML.addDays(ML.today(), 1);
  // The soonest exam in the next 3 weeks whose subject had no session for 7 days, unless a task for it is already planned soon
  function neglected() {
    const ex = ((S.study && S.study.exams) || []).filter(x => x.subject && daysTo(x.date) >= 1 && daysTo(x.date) <= 21).sort((a, b) => a.date.localeCompare(b.date));
    const soon = ML.addDays(ML.today(), 3);
    for (const x of ex) {
      const sub = subjList().find(s => s.id === x.subject); if (!sub) continue;
      if (S.tasks.some(y => !y.done && y.subject === sub.id && y.due && y.due <= soon)) continue;
      const last = S.sessions.reduce((a, s) => (subjOf(s) === sub.id ? Math.max(a, s.at) : a), 0), idle = last ? Math.floor((Date.now() - last) / 864e5) : null;
      if (idle == null || idle >= 7) return { sub, x, idle, left: daysTo(x.date) };
    }
    return null;
  }
  function neglectHtml() {
    const n = neglected(); if (!n) return '';
    return `<div class="g-card yh-alert"><p><b>${esc(n.idle == null ? t('ng_never', { s: n.sub.name }) : t('ng_idle', { s: n.sub.name, n: n.idle }))}</b></p><p class="insight">${esc(n.left === 1 ? t('ng_exam1') : t('ng_exam', { n: n.left }))}</p><div class="y-btns"><button type="button" data-ng="${esc(n.sub.id)}">${esc(t('ng_add'))}</button></div></div>`;
  }
  function addNeglected(subId) {
    const sub = subjList().find(s => s.id === subId); if (!sub) return;
    S.tasks.push({ id: ML.uid(), title: t('ng_task', { s: sub.name }), mins: 50, pri: 'high', done: false, due: tomorrowKey(), subject: sub.id });
    save(); ML.renderAll(); toast(t('ng_done'));
  }

  /* ---------- C2: the Sunday review, which places next week in the Plan ---------- */
  // Sunday from 16:00: this week. Monday and Tuesday: last week. Hidden once planned or put off.
  function reviewWeekKey() {
    const d = new Date(), dow = d.getDay(), mon = monday(Date.now());
    if (dow === 0 && d.getHours() >= 16) return dayKey(mon);
    if (dow === 1 || dow === 2) return dayKey(new Date(mon.getTime() - 7 * 864e5));
    return null;
  }
  const weekSessions = wk => { const from = ML.parseDay(wk).getTime(), to = from + 7 * 864e5; return S.sessions.filter(s => s.at >= from && s.at < to); };
  function reviewDue() {
    const wk = reviewWeekKey(); if (!wk) return null;
    const R = (S.reviews && S.reviews[wk]) || {};
    return R.planned || R.skip || !weekSessions(wk).length ? null : wk;
  }
  const dayName = k => ML.parseDay(k).toLocaleDateString(ML.locale(), { weekday: 'long' });
  const listJoin = a => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ' + t('rv2_and') + ' ' + a[a.length - 1]);
  const hourTxt = m => (S.lang === 'fr' ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + String(m % 60).padStart(2, '0') : ''}` : new Date(2000, 0, 1, Math.floor(m / 60), m % 60).toLocaleTimeString('en', { hour: 'numeric', minute: m % 60 ? '2-digit' : undefined }));
  const median = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor((b.length - 1) / 2)] : null; };
  function reviewData(wk) {
    const ss = weekSessions(wk), mins = ss.reduce((a, s) => a + s.mins, 0), f = ss.filter(s => ML.isFlow && ML.isFlow(s)).length;
    const yw = weeksOf(yearOf(ML.parseDay(wk).getTime()), S.sessions, false), no = (yw.findIndex(w => w.key === wk) + 1) || yw.length;
    // What worked: the part of the day where sessions were most often finished
    const by = {}; ss.forEach(s => { const b = ML.bucketOf ? ML.bucketOf(s.start || s.at) : 'morning', o = by[b] || (by[b] = { n: 0, full: 0 }); o.n++; if (s.full) o.full++; });
    const best = Object.entries(by).filter(([, o]) => o.n >= 2).sort((a, b) => b[1].full / b[1].n - a[1].full / a[1].n || b[1].n - a[1].n)[0];
    let worked;
    if (best && best[1].full) worked = t('rv2_full', { when: t('rv2_b_' + best[0]), a: best[1].full, b: best[1].n });
    else { const days = {}; ss.forEach(s => { const k = dayKey(new Date(s.at)); days[k] = (days[k] || 0) + s.mins; }); const top = Object.entries(days).sort((a, b) => b[1] - a[1])[0]; worked = t('rv2_day', { d: dayName(top[0]), m: D(top[1]) }); }
    // What got stuck: a subject worked in the 4 weeks before and not this one, then sessions cut short, then tasks that slipped
    const from = ML.parseDay(wk).getTime(), before = S.sessions.filter(s => s.at >= from - 28 * 864e5 && s.at < from), mineSub = new Set(ss.map(subjOf));
    const gapId = [...new Set(before.map(subjOf))].find(k => k && !mineSub.has(k)), gap = gapId && subjList().find(x => x.id === gapId);
    const cut = ss.filter(s => !s.full).length, end = ML.addDays(wk, 6), slip = S.tasks.filter(x => !x.done && x.due && x.due >= wk && x.due <= end && x.due < ML.today()).length;
    const stuck = gap ? t('rv2_gap', { s: gap.name }) : cut >= 2 ? t('rv2_cut', { n: cut }) : slip ? t('rv2_slip', { n: slip }) : t('rv2_fine');
    // Next week: an exam's subject first, then the subject left aside, then the week's main subject
    const nextMon = dayKey(new Date(monday(Date.now()).getTime() + (new Date().getDay() === 0 ? 7 : 0) * 864e5)), startK = nextMon > ML.today() ? nextMon : ML.today();
    const exam = ((S.study && S.study.exams) || []).filter(x => x.date >= startK && x.date <= ML.addDays(nextMon, 13)).sort((a, b) => a.date.localeCompare(b.date))[0];
    const sub = (exam && exam.subject && subjList().find(x => x.id === exam.subject)) || gap || mainSubject(ss);
    const days = [0, 1, 2].map(i => ML.addDays(startK, i));
    const fulls = ss.filter(s => s.full), startM = median(fulls.map(s => { const d = new Date(s.start || s.at - s.mins * 6e4); return d.getHours() * 60 + (d.getMinutes() >= 30 ? 30 : 0); }));
    const at = startM == null ? 9 * 60 : Math.min(21 * 60, Math.max(7 * 60, startM)), len = Math.min(90, Math.max(25, Math.round((median(fulls.map(s => s.mins)) || 50) / 5) * 5));
    const plan = t(sub ? 'rv2_plan_s' : 'rv2_plan', { s: sub ? sub.name : '', days: listJoin(days.map(dayName)), h: hourTxt(at) });
    return { wk, no, mins, n: ss.length, f, worked, stuck, next: (exam ? t('rv2_exam', { x: exam.name, d: dayName(exam.date) }) + ' ' : '') + plan, sub, days, at, len };
  }
  function reviewHtml() {
    const wk = reviewDue(); if (!wk) return '';
    const r = reviewData(wk), line = r.n === 1 ? t('rv2_line1', { m: D(r.mins) }) : t(r.f ? 'rv2_line' : 'rv2_line0', { m: D(r.mins), s: r.n, f: r.f });
    return `<div class="g-card rv2" id="rv2"><h2>${esc(t('rv2_h', { n: r.no }))}</h2><p class="insight">${esc(line)}</p>
      <dl class="rv2-l"><div><dt>${esc(t('rv2_worked'))}</dt><dd>${esc(r.worked)}</dd></div><div><dt>${esc(t('rv2_stuck'))}</dt><dd>${esc(r.stuck)}</dd></div><div><dt>${esc(t('rv2_next'))}</dt><dd>${esc(r.next)}</dd></div></dl>
      <div class="y-btns"><button type="button" class="primary" data-rv2="plan">${esc(t('rv2_go'))}</button><button type="button" class="ghost" data-rv2="write">${esc(t('rv2_write'))}</button><button type="button" class="ghost" data-rv2="skip">${esc(t('rv2_later'))}</button></div></div>`;
  }
  function placeReview() {
    const wk = reviewDue(); if (!wk) return;
    const r = reviewData(wk), task = { id: ML.uid(), title: r.sub ? t('ng_task', { s: r.sub.name }) : t('rv2_task'), mins: r.len, pri: 'high', done: false, due: r.days[0] };
    if (r.sub) task.subject = r.sub.id;
    S.tasks.push(task);
    S.blocks = S.blocks || [];
    r.days.forEach(k => {
      let start = r.at; // move an hour later while it would overlap a block already there
      for (let i = 0; i < 4 && S.blocks.some(b => b.date === k && b.start < start + r.len && start < b.start + b.mins); i++) start += 60;
      S.blocks.push({ id: ML.uid(), date: k, start, mins: r.len, taskId: task.id, title: null, done: false });
    });
    S.reviews = S.reviews || {}; S.reviews[wk] = Object.assign({}, S.reviews[wk], { planned: Date.now() });
    save(); ML.emit('blocks'); ML.renderAll(); toast(t('rv2_done'));
  }
  // The cards that sit under the tree, on the You home (phone) and on the Tree page
  ML.youCards = () => reviewHtml() + neglectHtml();
  ML.youCardsClick = e => {
    const ng = e.target.closest('[data-ng]'), rv = e.target.closest('[data-rv2]');
    if (ng) { addNeglected(ng.dataset.ng); return true; }
    if (!rv) return false;
    const k = rv.dataset.rv2, wk = reviewDue();
    if (k === 'plan') placeReview();
    else if (k === 'write') { if (ML.openReview) ML.openReview(wk || undefined); }
    else if (k === 'skip' && wk) { S.reviews = S.reviews || {}; S.reviews[wk] = Object.assign({}, S.reviews[wk], { skip: Date.now() }); save(); ML.renderAll(); }
    return true;
  };
  ML.goWeekReview = () => {
    ML.setTab(document.documentElement.classList.contains('mnav-on') ? 'yhome' : 'tree');
    setTimeout(() => { const c = $('rv2'); if (c) c.scrollIntoView({ behavior: ML.reducedMotion() ? 'auto' : 'smooth', block: 'center' }); }, 120);
  };

  /* ---------- C1: what the colours mean ---------- */
  function legendHtml(weeks) {
    if (!subjList().length) return '';
    const on = T().subj !== false, skin = skinNow();
    let body = '';
    if (on) {
      const by = {}; weeks.forEach(w => { if (w.pal) { const ss = weekSessions(w.key); ss.forEach(s => { const k = subjOf(s); if (k) by[k] = (by[k] || 0) + s.mins; }); } });
      const rows = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, m]) => { const s = subjList().find(x => x.id === id); return s ? `<span class="tr-lg"><i style="background:${esc(s.color)}"></i>${esc(s.name)} <small>${esc(D(m))}</small></span>` : ''; }).join('');
      body = `${rows ? `<div class="tr-lgs">${rows}</div>` : ''}<p class="insight">${esc(TINT_SKINS.includes(skin) ? t('tr_tint_on') : t('tr_tint_skin'))}</p>`;
    }
    return `<div class="g-card"><div class="y-row"><h2>${esc(t('tr_tint'))}</h2><button type="button" class="ghost small" data-tint>${esc(on ? t('tr_tint_hide') : t('tr_tint_off'))}</button></div>${body}</div>`;
  }

  function skinTile(k) {
    const r = RULES[k], own = hasSkin(k), cur = skinNow() === k; let state;
    if (cur) state = `<span class="eq-tag">✓ ${esc(t('tr_used'))}</span>`;
    else if (own) state = `<button type="button" class="small" data-skin="${k}">${esc(t('tr_use'))}</button>`;
    else if (r.shop) state = `<button type="button" class="small" data-open-shop>${esc(t('tr_shop'))}</button>`;
    else { const m = minsIn(r.world); state = `<small>${esc(t('tr_prog', { a: Math.floor(m / 60).toLocaleString(ML.locale()), b: r.h }))} ${esc(r.world ? t('tr_in', { w: t('th_' + r.world) }) : t('tr_all'))}</small><span class="y-track"><b style="width:${Math.min(100, m / (r.h * 60) * 100).toFixed(0)}%"></b></span>`; }
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
    // A1 (3.66): the tree first and edge to edge, then this week against its goal, the cards (Sunday review, a subject
    // left aside), the week picked on the tree, the subject colours; trees and the key are folded
    const isNow = viewY === yearOf(Date.now()), owned = SKIN_ORDER.filter(k => hasSkin(k)).length;
    const html = `<div class="y-page tr-page">
      <div class="tr-top"><h2>${esc(t('tr_year', { y: viewY + '–' + (viewY + 1) }))}</h2>${ys.length > 1 ? `<div class="tr-years"><button type="button" class="icon-btn" data-yr="-1" aria-label="${esc(t('tr_prev'))}" ${yi ? '' : 'disabled'}>‹</button><button type="button" class="icon-btn" data-yr="1" aria-label="${esc(t('tr_next'))}" ${yi < ys.length - 1 ? '' : 'disabled'}>›</button></div>` : ''}</div>
      <div class="tr-stage" id="tr-stage"><i class="tr-mark" id="tr-mark" hidden></i></div>
      ${isNow ? weekLine(false, true) + ML.youCards() : ''}
      <div class="g-card">${weekCard(weeks)}
        ${roots || !ML.modOn('wellbeing') ? '' : `<p class="insight tr-rootsoff">${esc(t('tr_roots_off'))} <button type="button" class="link" data-go-health>${esc(t('tr_roots_go'))}</button></p>`}</div>
      ${legendHtml(weeks)}
      ${c ? `<div class="g-card ${c.won ? 'tr-won' : ''}"><div class="y-row"><h2>${esc(t('ch_title'))}</h2><span class="insight">${esc(t('ch_prog', { a: c.n, b: c.goal }))}</span></div><p>${esc(c.won ? t('ch_won') : t('ch_' + c.kind))}</p><span class="y-track"><b style="width:${(c.n / c.goal * 100).toFixed(0)}%"></b></span></div>` : ''}
      <details class="g-card y-det" data-det="skins"><summary>${esc(t('tr_skins'))} <small>${owned} / ${SKIN_ORDER.length}</small></summary><div class="tr-skins">${SKIN_ORDER.map(skinTile).join('')}</div><button type="button" class="small" data-open-shop="tree">${esc(t('tr_custom'))}</button></details>
      <details class="g-card y-det" data-det="key"><summary>${esc(t('tr_key'))}</summary>${[1, 2, 3, 4].map(i => `<p class="insight">${esc(t('tr_key_' + i))}</p>`).join('')}</details></div>`;
    if (el.dataset.h !== html) {
      const open = [...el.querySelectorAll('details[open]')].map(d => d.dataset.det);
      el.innerHTML = html; el.dataset.h = html;
      open.forEach(k => { const d = el.querySelector(`details[data-det="${k}"]`); if (d) d.open = true; });
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
    if (ML.youCardsClick(e)) return;
    if (b.hasAttribute('data-tint')) { T().subj = T().subj === false; save(); render(); emit('render'); return; }
    if (b.dataset.yr) { const ys = years(), i = ys.indexOf(viewY) + +b.dataset.yr; if (ys[i] != null) { viewY = ys[i]; selWeek = null; render(); } return; }
    if (b.dataset.wk) { selWeek = (selWeek || 0) + +b.dataset.wk; render(); marker(); return; }
    if (b.dataset.skin) { if (hasSkin(b.dataset.skin)) { S.econ.equip.treeSkin = b.dataset.skin; save(); render(); } return; }
    if (b.hasAttribute('data-go-health')) { ML.setTab('health'); return; }
    if (b.hasAttribute('data-open-shop')) ML.openShop('tree', b.dataset.openShop === 'tree' ? 'fit' : null);
  });
  addEventListener('resize', () => { if (S.tab === 'tree' && cv) { fit(skinNow()); marker(); } });

  /* ---------- Pictures for the shop and the tree tiles: painted on demand, one at a time, kept in memory ---------- */
  const SAMPLE = A.sample(18), thumbCache = {}, queue = [];
  let thumbT = 0;
  function thumbFor(tp) {
    const [kind, k] = tp.split(':'), o = kind === 'skin' ? { roots: null } : { roots: null, [{ lf: 'leaf', br: 'bark', fl: 'flower', hg: 'hang', gd: 'ground', sk: 'sky' }[k.slice(0, 2)] || 'x']: k };
    const skin = kind === 'skin' || A.SKINS.includes(k) ? k : 'oak', [W, H] = A.SIZE(skin), big = document.createElement('canvas'); big.width = W; big.height = H;
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
  // The shop's fitting room: the oak with the options being tried, drawn on the user's own year (or the sample year while it is still short)
  ML.treeFit = (canvas, look) => {
    const [W, H] = A.SIZE('oak'), y = yearOf(Date.now()), mine = weeksOf(y, S.sessions, false), weeks = mine.length >= 8 ? mine : SAMPLE;
    if (canvas.width !== W) { canvas.width = W; canvas.height = H; }
    A.paint(canvas.getContext('2d'), 'oak', weeks, Object.assign({ roots: null }, look));
  };
  ML.treeDress = dress;
  // The You home on a phone (today.js): this year's tree in a slot, painted again only when something changed
  let hcv = null, hKey = '', hT = 0;
  ML.treeMount = slot => {
    if (!slot) return;
    if (!hcv) { hcv = document.createElement('canvas'); hcv.className = 'yh-canvas'; hcv.setAttribute('role', 'img'); }
    if (hcv.parentElement !== slot) slot.append(hcv);
    clearTimeout(hT);
    hT = setTimeout(() => {
      const skin = skinNow(), y = yearOf(Date.now()), weeks = weeksOf(y), o = Object.assign(dress(), { roots: rootValues(y), rootNames: rootNames(), title: null }), key = JSON.stringify([skin, weeks, o]);
      hcv.setAttribute('aria-label', t('tr_alt', { n: weeks.length, f: weeks.reduce((a, w) => a + w.f, 0) }));
      if (key === hKey) return;
      const [W, H] = A.SIZE(skin); hcv.width = W; hcv.height = H; hcv.classList.toggle('tr-px', skin === 'pixel');
      A.paint(hcv.getContext('2d'), skin, weeks, o); hKey = key;
    }, hKey ? 0 : 40);
  };

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

  on('tab', n => { if (n === 'tree') { const m = $('tr-mark'); if (m) delete m.dataset.w; render(); } });
  on('render', render); on('minute', render); on('lang', render); on('rated', render); on('cosmetics', render); on('period', render);
  on('started', () => { render(); });
})();
