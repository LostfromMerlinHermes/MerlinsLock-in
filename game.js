// Game layer: task rarity, daily quests, weekly boss, achievements, level-up overlay, UI sound effects,
// and the three visual themes (Cyber sorcerer, Gray fog / Tarot, Netrunner) with automatic switching.
(() => {
  'use strict';
  const { $, S, t, tn, esc, save, on, emit, toast, dayKey, today, addDays, parseDay, fmtMins } = ML;

  ML.addStrings({
    fr: {
      r_common: 'Commune', r_rare: 'Rare', r_epic: 'Épique', r_legendary: 'Légendaire',
      quests: 'Quêtes du jour', quest_done: 'Quête accomplie : {q}. +{xp} XP',
      q_sessions2: 'Termine 2 sessions de focus', q_sessions3: 'Termine 3 sessions de focus', q_mins60: 'Cumule 1h de focus', q_mins120: 'Cumule 2h de focus',
      q_rate2: 'Note ta concentration 2 fois', q_high: 'Termine une tâche haute priorité', q_tasks3: 'Termine 3 tâches', q_park: 'Traite une pensée parquée',
      q_early: 'Fais une session avant 10h', q_block: 'Suis un bloc de ton planning', q_full: 'Va au bout d’une session',
      boss: 'Boss de la semaine', boss_hp: 'PV', boss_set: '⚔ Boss de la semaine (gros XP si vaincu)', boss_new: 'Nouveau boss : {title}', boss_down: 'Boss vaincu : {title}. +{xp} XP',
      boss_none: 'Pas de boss cette semaine. Marque ta plus grosse tâche comme boss dans sa fiche (clique sur son titre).',
      achievements: 'Succès', ach_unlocked: 'Succès débloqué : {name}. +{xp} XP', locked: 'verrouillé',
      a_first_session: 'Premier sort', a_first_session_d: 'Termine ta première session',
      a_streak3: 'Rituel', a_streak3_d: '3 jours de suite', a_streak7: 'Discipline', a_streak7_d: '7 jours de suite', a_streak30: 'Inarrêtable', a_streak30_d: '30 jours de suite',
      a_hours10: 'Apprenti assidu', a_hours10_d: '10 h de focus au total', a_hours50: 'Érudit', a_hours50_d: '50 h de focus', a_hours100: 'Centurion', a_hours100_d: '100 h de focus',
      a_day5: 'Marathon', a_day5_d: '5 sessions en un jour', a_deep2h: 'Plongée profonde', a_deep2h_d: 'Une session complète de 2 h',
      a_night_owl: 'Oiseau de nuit', a_night_owl_d: 'Une session finie entre 23h et 4h', a_early_bird: 'Lève-tôt', a_early_bird_d: 'Une session commencée avant 7h',
      a_perfect5: 'Esprit clair', a_perfect5_d: '5 sessions notées 5/5', a_parker10: 'Gardien du parking', a_parker10_d: 'Traite 10 pensées parquées',
      a_planner5: 'Stratège', a_planner5_d: 'Termine 5 blocs planifiés', a_boss1: 'Tueur de boss', a_boss1_d: 'Vaincs un boss de la semaine',
      a_seq7: 'Magicien', a_seq7_d: 'Atteins la Séquence 7', a_seq5: 'Marionnettiste', a_seq5_d: 'Atteins la Séquence 5', a_seq0: 'Le Fou', a_seq0_d: 'Atteins la Séquence 0',
      a_moods4: 'Toutes les humeurs', a_moods4_d: 'Une session dans chaque humeur', a_tasks50: 'Abatteur', a_tasks50_d: 'Termine 50 tâches', a_sound5: 'Mélomane', a_sound5_d: 'Écoute 5 genres différents',
      new_seq: 'Nouvelle Séquence', boss_defeated: 'Boss vaincu',
      set_look: 'Apparence et jeu', theme: 'Thème',
      opt_sfx: 'Effets sonores (tâche finie, quête, succès)',
    },
    en: {
      r_common: 'Common', r_rare: 'Rare', r_epic: 'Epic', r_legendary: 'Legendary',
      quests: 'Daily quests', quest_done: 'Quest complete: {q}. +{xp} XP',
      q_sessions2: 'Finish 2 focus sessions', q_sessions3: 'Finish 3 focus sessions', q_mins60: 'Focus for 1h in total', q_mins120: 'Focus for 2h in total',
      q_rate2: 'Rate your focus twice', q_high: 'Finish a high-priority task', q_tasks3: 'Finish 3 tasks', q_park: 'Process a parked thought',
      q_early: 'Do a session before 10am', q_block: 'Follow a block from your plan', q_full: 'Finish a full session',
      boss: 'Weekly boss', boss_hp: 'HP', boss_set: '⚔ Weekly boss (big XP when defeated)', boss_new: 'New boss: {title}', boss_down: 'Boss defeated: {title}. +{xp} XP',
      boss_none: 'No boss this week. Mark your biggest task as the boss in its details (click its title).',
      achievements: 'Achievements', ach_unlocked: 'Achievement unlocked: {name}. +{xp} XP', locked: 'locked',
      a_first_session: 'First spell', a_first_session_d: 'Finish your first session',
      a_streak3: 'Ritual', a_streak3_d: '3 days in a row', a_streak7: 'Discipline', a_streak7_d: '7 days in a row', a_streak30: 'Unstoppable', a_streak30_d: '30 days in a row',
      a_hours10: 'Diligent apprentice', a_hours10_d: '10h of focus in total', a_hours50: 'Scholar', a_hours50_d: '50h of focus', a_hours100: 'Centurion', a_hours100_d: '100h of focus',
      a_day5: 'Marathon', a_day5_d: '5 sessions in one day', a_deep2h: 'Deep dive', a_deep2h_d: 'A full 2h session',
      a_night_owl: 'Night owl', a_night_owl_d: 'A session ending between 11pm and 4am', a_early_bird: 'Early bird', a_early_bird_d: 'A session started before 7am',
      a_perfect5: 'Clear mind', a_perfect5_d: '5 sessions rated 5/5', a_parker10: 'Parking warden', a_parker10_d: 'Process 10 parked thoughts',
      a_planner5: 'Strategist', a_planner5_d: 'Finish 5 planned blocks', a_boss1: 'Boss slayer', a_boss1_d: 'Defeat a weekly boss',
      a_seq7: 'Magician', a_seq7_d: 'Reach Sequence 7', a_seq5: 'Marionettist', a_seq5_d: 'Reach Sequence 5', a_seq0: 'The Fool', a_seq0_d: 'Reach Sequence 0',
      a_moods4: 'Every mood', a_moods4_d: 'A session in each mood', a_tasks50: 'Task slayer', a_tasks50_d: 'Finish 50 tasks', a_sound5: 'Music lover', a_sound5_d: 'Listen to 5 different genres',
      new_seq: 'New Sequence', boss_defeated: 'Boss defeated',
      set_look: 'Look and game', theme: 'Theme',
      opt_sfx: 'Sound effects (task done, quest, achievement)',
    },
  });

  ML.defaults(() => ({
    theme: 'auto',
    game: { sfx: true, quests: null, boss: null, ach: {}, bosses: 0, parkedTotal: 0, blocksDone: 0, tasksDone: 0, genres: [], daily: { day: null, parked: 0, blocks: 0, tasks: 0, high: 0 } },
  }));

  /* ---------- Rarity ---------- */
  const RAR = ['common', 'rare', 'epic', 'legendary'];
  const RXP = { common: 10, rare: 20, epic: 40, legendary: 80 };
  function rarity(task) {
    const score = ({ high: 2, med: 1, low: 0 }[task.pri] || 0) + (task.mins >= 120 ? 2 : task.mins >= 60 ? 1 : 0);
    return score >= 4 ? 'legendary' : score === 3 ? 'epic' : score === 2 ? 'rare' : 'common';
  }
  const isBoss = task => S.game.boss && S.game.boss.taskId === task.id && !S.game.boss.done;
  ML.taskXp = task => RXP[rarity(task)];
  ML.taskBadges = task => {
    const r = rarity(task);
    return { cls: 'rar-' + r + (isBoss(task) ? ' boss' : ''), html: `${isBoss(task) ? '<span class="chip boss-chip">⚔ Boss</span>' : ''}<span class="chip rar"><b class="rar-n">${esc(t('r_' + r))}</b><i class="rar-sep"> · </i><b class="rar-xp">${RXP[r]} XP</b></span>` };
  };
  ML.taskEditExtras = task => `<label class="opt boss-opt"><input type="checkbox" name="boss" ${isBoss(task) ? 'checked' : ''}> ${esc(t('boss_set'))}</label>`;
  on('task:edit-save', ({ task, form }) => {
    const want = form.querySelector('[name=boss]') && form.querySelector('[name=boss]').checked;
    if (want && !isBoss(task)) {
      S.game.boss = { taskId: task.id, title: task.title, week: weekKey(), max: Math.max(30, task.mins), dmg: task.spent || 0, done: false };
      toast(t('boss_new', { title: task.title }));
    } else if (!want && isBoss(task)) S.game.boss = null;
  });

  /* ---------- Daily counters ---------- */
  function daily() {
    const D = S.game.daily;
    if (D.day !== today()) Object.assign(D, { day: today(), parked: 0, blocks: 0, tasks: 0, high: 0 });
    return D;
  }
  const weekKey = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayKey(d); };

  /* ---------- Quests ---------- */
  const QUESTS = {
    q_sessions2: { xp: 30, target: 2, val: st => st.sessions }, q_sessions3: { xp: 45, target: 3, val: st => st.sessions },
    q_mins60: { xp: 30, target: 60, val: st => st.mins, fmt: v => fmtMins(v) }, q_mins120: { xp: 50, target: 120, val: st => st.mins, fmt: v => fmtMins(v) },
    q_rate2: { xp: 20, target: 2, val: st => st.rated }, q_high: { xp: 35, target: 1, val: () => daily().high },
    q_tasks3: { xp: 40, target: 3, val: () => daily().tasks }, q_park: { xp: 20, target: 1, val: () => daily().parked },
    q_early: { xp: 30, target: 1, val: st => st.early }, q_block: { xp: 30, target: 1, val: () => daily().blocks },
    q_full: { xp: 25, target: 1, val: st => st.full },
  };
  const QPOOL = {
    drained: ['q_sessions2', 'q_mins60', 'q_rate2', 'q_park', 'q_full', 'q_block'],
    steady: ['q_sessions2', 'q_mins60', 'q_tasks3', 'q_rate2', 'q_full', 'q_block', 'q_early', 'q_park'],
    fired: ['q_sessions3', 'q_mins120', 'q_high', 'q_tasks3', 'q_block', 'q_early'],
    scattered: ['q_sessions2', 'q_park', 'q_full', 'q_rate2', 'q_mins60', 'q_block'],
  };
  function dayStats() {
    const td = today(), ss = S.sessions.filter(s => dayKey(new Date(s.at)) === td);
    return { sessions: ss.length, mins: ss.reduce((a, s) => a + s.mins, 0), rated: ss.filter(s => s.rating).length, full: ss.filter(s => s.full).length,
      early: ss.filter(s => new Date(s.start || s.at - s.mins * 60000).getHours() < 10).length };
  }
  function ensureQuests() {
    const G = S.game;
    if (G.quests && G.quests.day === today()) return G.quests;
    const pool = [...QPOOL[S.mood] || QPOOL.steady];
    let seed = [...today()].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
    const rand = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    G.quests = { day: today(), ids: pool.slice(0, 3), claimed: [] };
    save();
    return G.quests;
  }
  // quest:progress / quest:done feed the game-style quest cards of themes that have them (juice.js); those themes
  // replace the plain toast (ML.questFeed() is true there)
  const qLast = {}; let qSeen = false;
  function checkQuests() {
    const Q = ensureQuests(), st = dayStats();
    Q.ids.forEach(id => {
      const q = QUESTS[id], v = Math.min(q.val(st), q.target);
      if (qSeen && qLast[id] !== undefined && v > qLast[id] && v < q.target && !Q.claimed.includes(id)) emit('quest:progress', { id, name: t(id), v, target: q.target, fmt: q.fmt });
      qLast[id] = v;
      if (!Q.claimed.includes(id) && q.val(st) >= q.target) {
        Q.claimed.push(id); ML.addXp(q.xp); sfx('quest');
        emit('quest:done', { id, name: t(id), xp: q.xp, n: Q.claimed.length, of: Q.ids.length });
        if (!(ML.questFeed && ML.questFeed())) toast(t('quest_done', { q: t(id), xp: q.xp }));
        if (Q.claimed.length === Q.ids.length) emit('quests:clear'); // juice.js shows the "daily quests clear" banner
      }
    });
    qSeen = true; // the first pass after load only records where each quest stands
  }

  /* ---------- Boss ---------- */
  function checkBoss() {
    const B = S.game.boss; if (!B) return;
    if (B.week !== weekKey() && !B.done) { S.game.boss = null; return; }
    const task = S.tasks.find(x => x.id === B.taskId);
    if (!B.done && (B.dmg >= B.max || (task && task.done))) {
      B.done = true; S.game.bosses++;
      const xp = 150; ML.addXp(xp);
      toast(t('boss_down', { title: B.title, xp }));
      showOverlay(t('boss_defeated'), '⚔', B.title);
    }
  }
  on('session', s => {
    const B = S.game.boss;
    if (B && !B.done && s.taskId === B.taskId) B.dmg += s.mins;
    checkAll();
  });

  /* ---------- Achievements ---------- */
  const ACH = {
    first_session: () => S.sessions.length >= 1,
    streak3: () => ML.streaks().best >= 3, streak7: () => ML.streaks().best >= 7, streak30: () => ML.streaks().best >= 30,
    hours10: () => total() >= 600, hours50: () => total() >= 3000, hours100: () => total() >= 6000,
    day5: () => { const c = {}; return S.sessions.some(s => (c[dayKey(new Date(s.at))] = (c[dayKey(new Date(s.at))] || 0) + 1) >= 5); },
    deep2h: () => S.sessions.some(s => s.full && s.mins >= 120),
    night_owl: () => S.sessions.some(s => { const h = new Date(s.at).getHours(); return h >= 23 || h < 4; }),
    early_bird: () => S.sessions.some(s => new Date(s.start || s.at - s.mins * 60000).getHours() < 7),
    perfect5: () => S.sessions.filter(s => s.rating === 5).length >= 5,
    parker10: () => S.game.parkedTotal >= 10, planner5: () => S.game.blocksDone >= 5, boss1: () => S.game.bosses >= 1,
    seq7: () => ML.seqInfo().i >= 2, seq5: () => ML.seqInfo().i >= 4, seq0: () => ML.seqInfo().i >= 9,
    moods4: () => ['drained', 'steady', 'fired', 'scattered'].every(m => S.sessions.some(s => s.mood === m)),
    tasks50: () => S.game.tasksDone >= 50, sound5: () => S.game.genres.length >= 5,
  };
  const total = () => S.sessions.reduce((a, s) => a + s.mins, 0);
  let silent = true; // the first check after load awards silently-earned badges without a toast flood
  function checkAch() {
    const got = [];
    for (const [id, fn] of Object.entries(ACH)) {
      if (S.game.ach[id]) continue;
      let ok = false; try { ok = fn(); } catch (e) {}
      if (ok) { S.game.ach[id] = Date.now(); got.push(id); }
    }
    if (got.length && !silent) {
      got.forEach(id => { ML.addXp(25); toast(t('ach_unlocked', { name: t('a_' + id), xp: 25 })); });
      sfx('ach');
    }
    silent = false;
  }
  function checkAll() { checkQuests(); checkBoss(); checkAch(); save(); renderStrip(); }

  on('task:done', task => { const D = daily(); D.tasks++; if (task.pri === 'high') D.high++; S.game.tasksDone++; sfx('task'); checkAll(); });
  on('parked:processed', () => { daily().parked++; S.game.parkedTotal++; checkAll(); });
  on('block:done', () => { daily().blocks++; S.game.blocksDone++; checkAll(); });
  on('rated', () => checkAll());
  on('minute', () => {
    if (ML.Audio && ML.Audio.playing && S.audio.music && !S.game.genres.includes(S.audio.genre)) { S.game.genres.push(S.audio.genre); checkAch(); }
    applyTheme();
  });

  /* ---------- Level-up / boss overlay ---------- */
  let luT = null;
  function showOverlay(kicker, title, sub) {
    const el = $('levelup');
    $('lu-kicker').textContent = kicker; $('lu-title').textContent = title; $('lu-sub').textContent = sub;
    el.hidden = false; el.classList.remove('play'); void el.offsetWidth; el.classList.add('play');
    sfx('level');
    clearTimeout(luT); luT = setTimeout(() => { el.hidden = true; }, 3800);
  }
  $('levelup').onclick = () => { $('levelup').hidden = true; };
  // A new Sequence reached during a focus session is celebrated when the session ends, not in the middle of it
  let luPending = null;
  const celebrateSeq = s => showOverlay(t('new_seq'), t('sequence') + ' ' + s.num, s.name);
  on('levelup', s => { if (ML.running() && S.mode === 'focus') luPending = s; else celebrateSeq(s); checkAch(); });
  on('timer', () => { if (luPending && !(ML.running() && S.mode === 'focus')) { const s = luPending; luPending = null; setTimeout(() => celebrateSeq(s), 400); } });

  /* ---------- UI sound effects ---------- */
  let sctx = null;
  function sfx(kind) {
    if (!S.game.sfx) return;
    if (ML.sfxTheme) { ML.sfxTheme(kind); return; } // juice.js plays a sound set that matches the theme
    try { sctx = sctx || new (window.AudioContext || window.webkitAudioContext)(); if (sctx.state === 'suspended') sctx.resume(); } catch (e) { return; }
    const notes = { task: [880, 1318.5], quest: [659.25, 987.77, 1318.5], ach: [523.25, 659.25, 783.99, 1046.5], level: [392, 523.25, 659.25, 783.99, 1046.5, 1318.5] }[kind] || [880];
    notes.forEach((f, i) => {
      const o = sctx.createOscillator(), g = sctx.createGain(), t0 = sctx.currentTime + i * (kind === 'level' ? 0.11 : 0.08);
      o.type = kind === 'level' ? 'triangle' : 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.07, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.5);
      o.connect(g).connect(sctx.destination); o.start(t0); o.stop(t0 + 0.55);
    });
  }

  /* ---------- Plan tab strip: quests + boss ---------- */
  function renderStrip() {
    const el = $('quest-strip'); if (!el) return;
    const Q = ensureQuests(), st = dayStats(), B = S.game.boss;
    const qrows = Q.ids.map(id => {
      const q = QUESTS[id], v = Math.min(q.val(st), q.target), done = Q.claimed.includes(id);
      const f = q.fmt || (x => x);
      return `<li class="${done ? 'done' : ''}"><span class="q-mark">${done ? '◆' : '◇'}</span><span class="q-name">${esc(t(id))}</span>
        <span class="q-bar"><b style="width:${(v / q.target) * 100}%"></b></span><span class="q-val">${done ? '+' + q.xp + ' XP' : f(v) + '/' + f(q.target)}</span>${!done && S.econ && S.econ.potions.scroll > 0 ? `<button type="button" class="icon-btn reroll" data-reroll="${id}" title="${esc(t('reroll'))}">↻</button>` : ''}</li>`;
    }).join('');
    const boss = B && !B.done && B.week === weekKey()
      ? `<div class="boss-bar"><span class="label">⚔ ${esc(t('boss'))}</span><b>${esc(B.title)}</b>
          <span class="hp"><i style="width:${Math.max(0, 100 - (B.dmg / B.max) * 100)}%"></i></span><span class="q-val">${esc(t('boss_hp'))} ${Math.max(0, B.max - B.dmg)}/${B.max}</span></div>`
      : '';
    el.innerHTML = `<div class="quests"><div class="q-head"><span class="label">${esc(t('quests'))}</span><span class="q-val">${Q.claimed.length}/${Q.ids.length}</span></div><ul>${qrows}</ul>${boss}</div>`;
  }

  /* ---------- Grimoire: achievements ---------- */
  on('grimoire', () => {
    const B = S.game.boss;
    const ach = Object.keys(ACH).map(id => {
      const got = S.game.ach[id];
      return `<li class="${got ? 'got' : ''}" title="${esc(t('a_' + id + '_d'))}"><span class="ach-ico">${got ? '✦' : '✧'}</span><b>${esc(t('a_' + id))}</b><small>${esc(t('a_' + id + '_d'))}</small></li>`;
    }).join('');
    const n = Object.keys(S.game.ach).length;
    $('g-game').innerHTML = `
      <div class="g-card"><h2>${esc(t('boss'))}</h2>${B && !B.done && B.week === weekKey()
        ? `<div class="boss-bar"><b>${esc(B.title)}</b><span class="hp"><i style="width:${Math.max(0, 100 - (B.dmg / B.max) * 100)}%"></i></span><span class="q-val">${esc(t('boss_hp'))} ${Math.max(0, B.max - B.dmg)}/${B.max}</span></div>`
        : `<p class="insight">${esc(t('boss_none'))}</p>`}</div>
      <div class="g-card"><h2>${esc(t('achievements'))} · ${n}/${Object.keys(ACH).length}</h2><ul class="ach">${ach}</ul></div>`;
  });

  /* ---------- Mood classes, buffs and themes ---------- */
  ML.addStrings({
    fr: {
      class_drained: 'Ermite du Sanctuaire', class_steady: 'Sorcier cybernétique', class_fired: 'Netrunner', class_scattered: 'Aventurier 8-bit',
      stat_focus: 'Focus', stat_rest: 'Repos', stat_intensity: 'Intensité',
      buff_drained: 'Régénération', buff_drained_d: '1re session du jour ×2 XP, sessions courtes finies +20 %',
      buff_steady: 'Régularité', buff_steady_d: '+10 % d’XP par jour de série (max +50 %)',
      buff_fired: 'Overclock', buff_fired_d: 'Combo : chaque session complète d’affilée +10 % d’XP (max +50 %)',
      buff_scattered: 'Ancrage', buff_scattered_d: 'Session sans pause +25 % d’XP, +5 XP par pensée parquée traitée',
      buff_ready: 'prêt', buff_combo: 'Combo ×{n}', buff_streak: '+{n} %', buff_nopause: 'sans pause +25 %', buff_short: 'courtes +20 %',
      park_bonus: 'Ancrage : +5 XP',
      th_auto: 'Auto (selon l’humeur)', th_sorcerer: 'Cyber sorcier', th_fog: 'Brouillard gris (Tarot)', th_netrunner: 'Netrunner', th_sanctuary: 'Sanctuaire', th_arcade: 'Arcade 8-bit',
      th_hint: 'Auto : chaque énergie a trois mondes, à choisir avec le bouton Monde en haut ou au choix de l’énergie.',
      th_observatory: 'Observatoire', th_abyss: 'Abysses', th_neoncity: 'Ville néon',
      dn_t_auto: 'Auto', dn_t_autolight: 'Auto clair', dn_t_day: 'Monde de jour', dn_t_night: 'Monde de nuit', dn_t_light: 'Clair',
      dn_light: 'Toujours clair', dn_autolight: 'Auto clair (clair le jour, nuit de 21h à 6h)',
      wb_btn: 'Monde : {w}. Changer', wb_h: 'Monde · {mood}', wb_always: 'Toujours ce monde', wb_clock: 'Suivre l’heure : {day} le jour, {night} après 21 h',
      wb_kept: 'Retenu pour {mood}. Les autres énergies gardent leur choix.', wb_toast: 'Monde : {w}', wb_locked: '{w} fait partie de Premium.', wb_try: 'Essayer 1 min', wb_premium: 'Premium', wb_now: 'Maintenant',
      light_premium_hint: 'Premium : un troisième univers, clair, pour chaque humeur (Washi, Codex, Estampe, Cartouche).',
      th_light_aube: 'Washi', th_light_atelier: 'Codex', th_light_tokyo: 'Estampe', th_light_cartouche: 'Cartouche',
      ink_focus: 'Focus auj. {t}', ink_streak: 'Série {n} j', ink_quests: 'Quêtes {n}/{m}', ink_next: 'Prochain bloc {t}',
    },
    en: {
      class_drained: 'Sanctuary hermit', class_steady: 'Cyber sorcerer', class_fired: 'Netrunner', class_scattered: '8-bit adventurer',
      stat_focus: 'Focus', stat_rest: 'Rest', stat_intensity: 'Intensity',
      buff_drained: 'Regeneration', buff_drained_d: 'First session of the day ×2 XP, short finished sessions +20%',
      buff_steady: 'Consistency', buff_steady_d: '+10% XP per streak day (max +50%)',
      buff_fired: 'Overclock', buff_fired_d: 'Combo: each full session in a row +10% XP (max +50%)',
      buff_scattered: 'Anchor', buff_scattered_d: 'No-pause session +25% XP, +5 XP per parked thought processed',
      buff_ready: 'ready', buff_combo: 'Combo ×{n}', buff_streak: '+{n}%', buff_nopause: 'no pause +25%', buff_short: 'short +20%',
      park_bonus: 'Anchor: +5 XP',
      th_auto: 'Auto (by mood)', th_sorcerer: 'Cyber sorcerer', th_fog: 'Gray fog (Tarot)', th_netrunner: 'Netrunner', th_sanctuary: 'Sanctuary', th_arcade: '8-bit arcade',
      th_hint: 'Auto: every energy has three worlds, chosen with the World button at the top or when you pick your energy.',
      th_observatory: 'Observatory', th_abyss: 'Abyss', th_neoncity: 'Neon city',
      dn_t_auto: 'Auto', dn_t_autolight: 'Auto light', dn_t_day: 'Day world', dn_t_night: 'Night world', dn_t_light: 'Light',
      dn_light: 'Always light', dn_autolight: 'Auto light (light by day, night from 9pm to 6am)',
      wb_btn: 'World: {w}. Change', wb_h: 'World · {mood}', wb_always: 'Always this world', wb_clock: 'Follow the hour: {day} by day, {night} after 9 pm',
      wb_kept: 'Saved for {mood}. Other energies keep their own.', wb_toast: 'World: {w}', wb_locked: '{w} is part of Premium.', wb_try: 'Try 1 min', wb_premium: 'Premium', wb_now: 'Now',
      light_premium_hint: 'Premium: a third, light world for every mood (Washi, Codex, Estampe, Cartridge).',
      th_light_aube: 'Washi', th_light_atelier: 'Codex', th_light_tokyo: 'Estampe', th_light_cartouche: 'Cartridge',
      ink_focus: 'Focus today {t}', ink_streak: 'Streak {n} d', ink_quests: 'Quests {n}/{m}', ink_next: 'Next block {t}',
    },
  });
  // dayNight: the old single switch for every energy ('auto' | 'day' | 'night' | 'light' | 'autolight'), per device;
  // it is now only the fallback for an energy with no world chosen yet. worlds: { mood: { w: 'day'|'night'|'light', clock } }
  ML.defaults(() => ({ dayNight: 'auto', worlds: {} }));

  // Each energy has three worlds: a day one, a night one and a light one (Premium). Auto theme only.
  const THEME_DAY = { drained: 'sanctuary', steady: 'observatory', fired: 'netrunner', scattered: 'arcade' };
  const THEME_NIGHT = { drained: 'abyss', steady: 'sorcerer', fired: 'neoncity', scattered: 'fog' };
  const nightByClock = () => { const h = new Date().getHours(); return h >= 21 || h < 6; };
  const LEGACY = { auto: { w: 'day', clock: true }, day: { w: 'day', clock: false }, night: { w: 'night', clock: false }, light: { w: 'light', clock: false }, autolight: { w: 'light', clock: true } };
  const canLight = () => !!(ML.isPremium && ML.isPremium());
  // "Try 1 minute" in the Shop: a light world shown for a while without Premium (trialUntil = end time)
  let trialUntil = 0;
  const trying = () => Date.now() < trialUntil;
  // previewMood / previewPick: the energy picker shows another energy or world while you browse, without choosing it
  let previewMood = null, previewPick = null;
  const storedPick = m => (S.worlds && S.worlds[m]) || LEGACY[S.dayNight] || LEGACY.auto;
  const pickFor = m => (previewPick && m === (previewMood || S.mood) ? previewPick : storedPick(m));
  // "Follow the hour": the night world from 21:00 to 6:00, the chosen one (or the day one) otherwise.
  // A world picked by hand while it's on (3.37.2) is held until the hour next turns: { hold: w, holdUntil }
  const nextTurn = () => { const n = new Date(), h = n.getHours(); if (h >= 21) n.setDate(n.getDate() + 1); n.setHours(h >= 6 && h < 21 ? 21 : 6, 0, 0, 0); return n.getTime(); };
  const held = p => (p && p.hold && Date.now() < (p.holdUntil || 0) ? p.hold : null);
  const nightOf = p => { const h = held(p); if (h) return h === 'night'; return p.clock ? nightByClock() : p.w === 'night'; };
  // the pick after tapping world w: with "follow the hour" on, w shows now (held) and a day choice (day / light) is kept
  ML.withWorld = (p, w) => {
    const q = { w: p.w, clock: !!p.clock };
    if (!q.clock) { q.w = w; return q; }
    if (w !== 'night') q.w = w;
    if ((w === 'night') !== nightByClock()) { q.hold = w; q.holdUntil = nextTurn(); }
    return q;
  };
  // the tile shown as chosen: the world on screen for that pick
  ML.worldSel = p => held(p) || (p.clock && nightByClock() ? 'night' : p.w === 'night' && p.clock ? 'day' : p.w);
  const LIGHT_NAME = { sanctuary: 'aube', observatory: 'atelier', netrunner: 'tokyo', arcade: 'cartouche' };
  // The world a pick leads to: { th: data-theme, light }; light needs Premium (or the Shop trial of that energy)
  function worldOf(m, p) {
    const night = nightOf(p), th = S.theme !== 'auto' ? S.theme : (night ? THEME_NIGHT : THEME_DAY)[m] || 'sorcerer';
    const trial = trying() && m === (previewMood || S.mood);
    const light = S.section !== 'sport' && !!LIGHT_NAME[th] && (trial || (S.theme === 'auto' && canLight() && p.w === 'light' && !night));
    return { th, light };
  }
  const isLight = () => worldOf(previewMood || S.mood, pickFor(previewMood || S.mood)).light;
  ML.isLight = isLight;
  const nameOf = w => (w.light ? t('th_light_' + LIGHT_NAME[w.th]) : t('th_' + w.th)).replace(/\s*\(.*\)$/, '');
  const todaysSessions = () => { const td = today(); return S.sessions.filter(s => dayKey(new Date(s.at)) === td); };
  function comboNow() { let n = 0; const ss = todaysSessions(); for (let i = ss.length - 1; i >= 0 && ss[i].full; i--) n++; return n; }

  // XP bonus for the session that just ended, by the mood it was done in (called by app.js complete())
  ML.sessionBonus = (s, xp) => {
    const m = s.mood;
    if (m === 'drained') {
      if (todaysSessions().length === 1) return { xp, label: t('buff_drained') + ' ×2' };
      if (s.full && s.mins <= 25) return { xp: Math.round(xp * 0.2), label: t('buff_drained') + ' +20 %' };
    }
    if (m === 'steady') { const n = Math.min(5, ML.streaks().cur); if (n) return { xp: Math.round(xp * n * 0.1), label: t('buff_steady') + ' +' + n * 10 + ' %' }; }
    if (m === 'fired' && s.full) { const n = Math.min(5, comboNow()); return { xp: Math.round(xp * n * 0.1), label: t('buff_combo', { n }) }; }
    if (m === 'scattered' && s.full && !s.pauses) return { xp: Math.round(xp * 0.25), label: t('buff_scattered') + ' +25 %' };
    return null;
  };
  on('parked:processed', () => { if (S.mood === 'scattered') { ML.addXp(5); toast(t('park_bonus')); } });

  function renderBuff() {
    const el = $('buff-chip'); if (!el) return;
    const m = S.mood;
    let val = '';
    if (m === 'drained') val = todaysSessions().length ? t('buff_short') : '×2 ' + t('buff_ready');
    if (m === 'steady') val = t('buff_streak', { n: Math.min(5, ML.streaks().cur) * 10 });
    if (m === 'fired') val = t('buff_combo', { n: comboNow() });
    if (m === 'scattered') val = t('buff_nopause');
    el.innerHTML = `<span class="buff-ico">✦</span><b>${esc(t('buff_' + m))}</b><span>${esc(val)}</span>`;
    el.title = t('buff_' + m + '_d');
  }

  const themeOf = m => worldOf(m, pickFor(m)).th;
  function effectiveTheme() {
    if (S.section === 'sport') return 'arena'; // the Sport section has its own look
    return themeOf(previewMood || S.mood);
  }
  // m: the energy to show (null = the current one); pick: a world to show for it instead of its saved one
  ML.previewMood = (m, pick) => { previewMood = m || null; previewPick = pick || null; applyTheme(); };
  // The three worlds of an energy, for the pickers (energy.js, worlds.js): key = tile id, w = what setWorld stores
  ML.worldsFor = m => [
    { w: 'day', th: THEME_DAY[m] }, { w: 'night', th: THEME_NIGHT[m] }, { w: 'light', th: THEME_DAY[m], light: true, locked: !canLight() },
  ].map(x => Object.assign(x, { key: x.light ? LIGHT_NAME[x.th] : x.th, name: nameOf({ th: x.th, light: !!x.light }) }));
  ML.worldPick = m => Object.assign({}, storedPick(m));
  ML.worldNow = m => worldOf(m, pickFor(m)); // { th, light } shown for that energy right now
  ML.worldNameOf = nameOf;
  ML.worldsFixed = () => S.theme !== 'auto'; // a fixed theme in Settings: no world choice
  ML.setWorld = (m, p, quiet) => {
    if (p.w === 'light' && !canLight()) return false;
    S.worlds = Object.assign({}, S.worlds, { [m]: Object.assign({ w: p.w, clock: !!p.clock }, held(p) ? { hold: p.hold, holdUntil: p.holdUntil } : {}) }); save();
    if (m === S.mood) { applyTheme(); if (!quiet) toast(t('wb_toast', { w: nameOf(worldOf(m, S.worlds[m])) }), { ms: 2200, key: 'daynight' }); }
    ML.emit('world');
    return true;
  };
  let trialT = null;
  ML.tryWorld = (mood, ms = 60000) => {
    clearTimeout(trialT); trialUntil = Date.now() + ms; previewMood = mood === S.mood ? null : mood; previewPick = { w: 'light', clock: false }; applyTheme();
    trialT = setTimeout(ML.endTrial, ms);
  };
  ML.endTrial = () => { clearTimeout(trialT); if (!trialUntil) return; trialUntil = 0; previewMood = null; previewPick = null; applyTheme(); ML.emit('trial:end'); };
  ML.trying = trying;
  // The name of the world a mood leads to right now (day / night / light skin), e.g. "Netrunner"
  ML.worldName = m => nameOf(worldOf(m, pickFor(m)));
  // (old Salle blanche, now unused: CSS keeps .deco-meta hidden) fixed technical metadata on the page edge, decorative and still
  // (it only changes when the minute does). Shown by CSS for that theme on wide screens only.
  const decoMeta = document.createElement('div');
  decoMeta.className = 'deco-meta'; decoMeta.setAttribute('aria-hidden', 'true');
  document.body.appendChild(decoMeta);
  const BARCODE = '<svg viewBox="0 0 64 14" width="64" height="14">' + [2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 1, 2, 1].reduce((a, w, i) => { if (i % 2 === 0) a.s += `<rect x="${a.x}" width="${w}" height="14"/>`; a.x += w; return a; }, { s: '', x: 0 }).s + '</svg>';
  const renderDecoMeta = () => { const d = new Date(); decoMeta.innerHTML = `<span>SYS//ONLINE</span><span>NODE 07</span><span>${ML.pad2(d.getHours())}:${ML.pad2(d.getMinutes())}</span>${BARCODE}`; };
  renderDecoMeta(); on('minute', renderDecoMeta);
  // The same world mode for every energy at once (Shop: "light worlds"); the per-energy choice is ML.setWorld
  function setDayNight(v) {
    S.dayNight = v;
    S.worlds = Object.fromEntries(Object.keys(THEME_DAY).map(m => [m, Object.assign({}, LEGACY[v] || LEGACY.auto)]));
    save(); applyTheme(); ML.emit('world');
    toast(t('dn_t_' + v) + ' · ' + nameOf(worldOf(S.mood, storedPick(S.mood))), { ms: 2200, key: 'daynight' });
  }
  ML.setDayNight = setDayNight;
  on('minute', applyTheme); // "follow the hour" turns at 21:00 and 6:00
  let themed = false;
  function applyTheme() {
    const th = effectiveTheme(), root = document.documentElement, light = isLight() && LIGHT_NAME[th] ? '1' : '';
    if (root.dataset.theme === th && (root.dataset.light || '') === light) return;
    root.dataset.theme = th;
    if (light) root.dataset.light = light; else delete root.dataset.light;
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = light ? { sanctuary: '#ECEEF3', observatory: '#E6D9BC', netrunner: '#F7F5EF', arcade: '#c6d29c' }[th]
      : { sorcerer: '#07060d', fog: '#0d0d10', netrunner: '#04040a', sanctuary: '#09111b', arcade: '#120c24', arena: '#0c0706', observatory: '#17120c', abyss: '#020b12', neoncity: '#0b0418' }[th];
    if (themed) playTransition(light ? LIGHT_NAME[th] : th); // the light worlds have their own (3.38.2): aube, atelier, tokyo, cartouche
    themed = true;
    setTimeout(FX.reset, 30);
  }
  // Theme-specific screen transition (ripple, glitch, moonlight bloom, pixel wipe, fog roll)
  let fxT = null;
  function playTransition(th) {
    const el = $('theme-fx'); if (!el || ML.reducedMotion()) return;
    el.classList.remove('play'); clearTimeout(fxT);
    // started two frames later: a world's first frame can be heavy (Washi paints its brushes and landscape), and an
    // animation started before it would be almost over by the time the screen is drawn again
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (th === 'aube' && ML.washiArrive) { ML.washiArrive(); return; } // Washi: its ink draws the world in (washi.js)
      el.dataset.fx = th; el.classList.remove('play'); void el.offsetWidth; el.classList.add('play');
      clearTimeout(fxT); fxT = setTimeout(() => el.classList.remove('play'), 1500);
    }));
    if (!previewMood) sfx(th === 'netrunner' ? 'level' : 'quest'); // browsing the energy picker stays quiet
  }
  on('mood', () => { applyTheme(); renderBuff(); });
  // Netrunner: one short RGB glitch on the digits when a focus session starts (CSS .glitch-in, cut by reduced motion)
  let wasRunning = false;
  on('timer', () => {
    const r = ML.running() && S.mode === 'focus';
    if (r && !wasRunning && document.documentElement.dataset.theme === 'netrunner' && !ML.reducedMotion()) {
      const c = $('clock'); c.classList.remove('glitch-in'); void c.offsetWidth; c.classList.add('glitch-in');
      setTimeout(() => c.classList.remove('glitch-in'), 200);
    }
    wasRunning = r;
  });
  on('premium', applyTheme); // a Premium status that arrives after boot unlocks the light skins
  on('session', renderBuff);
  on('render', renderBuff);
  ML.settingsSection({
    order: 15,
    render: () => `<h3>${esc(t('set_look'))}</h3>
      <label class="field"><span>${esc(t('theme'))}</span>${ML.ui.sel('set-theme', ['auto', 'observatory', 'sorcerer', 'sanctuary', 'abyss', 'netrunner', 'neoncity', 'arcade', 'fog'].map(v => [v, t('th_' + v)]), S.theme)}</label>
      <p class="hint">${esc(t('th_hint'))}</p>
      ${canLight() ? '' : `<p class="hint">${esc(t('light_premium_hint'))}</p>`}
      ${ML.ui.chk('set-sfx', t('opt_sfx'), S.game.sfx)}`,
    bind: r => {
      r.querySelector('#set-theme').onchange = e => { S.theme = e.target.value; save(); applyTheme(); ML.emit('world'); };
      r.querySelector('#set-sfx').onchange = e => { S.game.sfx = e.target.checked; save(); };
    },
  });

  /* ---------- Background effects per theme ---------- */
  const FX = (() => {
    const cv = $('fx'), ctx = cv.getContext('2d');
    // ~30 fps painting: positions still update every animation frame (speeds are tuned per frame), but on
    // every other frame the drawing calls go to NOP, a do-nothing stand-in for the canvas context
    const NOP = new Proxy(function () {}, { get: () => NOP, apply: () => NOP, set: () => true });
    let cx = ctx, lastPaint = 0;
    let still = ML.reducedMotion(); // reduced motion: one static frame, redrawn only on resize / theme change
    const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモラリルレロワン0123456789ABCDEF<>/{}';
    let W = 0, H = 0, parts = [], fog = [], flies = [], stars = [], drops = [], jellies = [], twinkles = [], consts = [], embers = [], drawn = [], city = [], shoot = null, sky = null, nextSky = 0, hiGlyph = null, ptr = null, colors = ['#a678ff', '#3ee8e0'], glitch = 0, raf = null;
    function size() {
      const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      cv.width = W * d; cv.height = H * d; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(d, 0, 0, d, 0, 0);
      parts = Array.from({ length: Math.round(W * H / 14000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + 0.3, v: Math.random() * 0.25 + 0.05, p: Math.random() * 6.28, c: Math.random() < 0.5 }));
      fog = Array.from({ length: 7 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (0.35 + Math.random() * 0.4) * Math.max(W, H), v: (Math.random() - 0.5) * 0.15, a: 0.04 + Math.random() * 0.05 }));
      flies = Array.from({ length: Math.round(W * H / 26000) + 6 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, p: Math.random() * 6.28, s: 0.6 + Math.random() * 0.8 }));
      stars = Array.from({ length: Math.round(W * H / 9000) }, () => ({ x: Math.floor(Math.random() * W / 4) * 4, y: Math.floor(Math.random() * H / 4) * 4, s: Math.random() < 0.15 ? 4 : 2, p: Math.floor(Math.random() * 8) }));
      drops = Array.from({ length: Math.max(8, Math.round(W / 55)) }, () => ({ x: Math.floor(Math.random() * W / 14) * 14, y: Math.random() * H, v: 0.6 + Math.random() * 1.4, n: 4 + Math.floor(Math.random() * 10), z: Math.floor(Math.random() * 3) }));
      // each jellyfish beats on its own 4–6 s cycle (T, ms)
      jellies = Array.from({ length: Math.max(3, Math.round(W / 320)) }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, s: 14 + Math.random() * 16, v: 0.1 + Math.random() * 0.12, p: Math.random() * 6.28, T: 4000 + Math.random() * 2000, c: i % 2 }));
      // Sanctuary: a few faint stars in the upper sky, each twinkling on its own offset cycle
      twinkles = Array.from({ length: Math.min(24, Math.round(W * H / 40000) + 8) }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.55, r: 0.5 + Math.random() * 0.7, T: 3000 + Math.random() * 4000, p: Math.random() * 6.28 }));
      // Cyber sorcerer: a few constellations (stars joined by pale lines), each fading in and out on its own 20–32 s cycle
      consts = Array.from({ length: W < 600 ? 3 : 5 }, () => {
        const cx0 = Math.random() * W, cy0 = Math.random() * H, R = 45 + Math.random() * 50, n = 4 + Math.floor(Math.random() * 4);
        const pts = Array.from({ length: n }, () => [cx0 + (Math.random() - 0.5) * 2 * R, cy0 + (Math.random() - 0.5) * 2 * R * 0.7]);
        const edges = pts.slice(1).map((_, i) => [i, i + 1]); if (n > 4) edges.push([1, n - 1]);
        return { pts, edges, T: 20000 + Math.random() * 12000, p: Math.random() * 6.28 };
      });
      // Gray fog: slow embers rising from two candles at the edges
      embers = Array.from({ length: 10 }, (_, i) => ({ side: i % 2, x: 0, y: H + Math.random() * H * 0.4, v: 0.15 + Math.random() * 0.2, p: Math.random() * 6.28, r: 0.7 + Math.random() * 0.8 }));
      // Neon city skyline: buildings with a few lit windows, drawn in front of the striped sun
      const hz = H * 0.66; city = []; let bx = -10;
      while (bx < W + 10) { const w = 24 + Math.random() * 46, h = 30 + Math.random() * H * 0.22, wins = []; for (let y = hz - h + 8; y < hz - 6; y += 9) for (let x = bx + 5; x < bx + w - 5; x += 8) if (Math.random() < 0.18) wins.push([x, y, Math.random() < 0.5]); city.push({ x: bx, w, h, wins }); bx += w + 2 + Math.random() * 6; }
    }
    function reset() {
      const cs = getComputedStyle(document.documentElement);
      colors = [cs.getPropertyValue('--accent').trim() || '#a678ff', cs.getPropertyValue('--accent-2').trim() || '#3ee8e0'];
      if (still) draw(0);
    }
    function glow(x, y, r, color, a) {
      const g = cx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      cx.globalAlpha = a; cx.fillStyle = g; cx.fillRect(x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1;
    }
    // Three states (step 6): at rest the decor runs at full speed; during a focus session it runs at 30 % (and the
    // canvas is dimmed in CSS); in the last 10 s it holds still. A virtual clock (vt) drives every phase, and
    // per-frame moves only happen on frames the accumulator allows (mv), so both slow down together.
    let vt = 0, lastTm = 0, acc = 0;
    // Rest effects (only while the timer isn't running): the pointer position (jellyfish keep their distance), rare
    // shooting stars (one every 1–2 min), a rain glyph lighting up in magenta now and then
    addEventListener('pointermove', e => { ptr = e.pointerType === 'mouse' ? [e.clientX, e.clientY] : null; }, { passive: true });
    document.addEventListener('mouseleave', () => { ptr = null; });
    const skyDue = (rest, now) => {
      if (!rest) { nextSky = 0; return false; }
      if (!nextSky) nextSky = now + 60000 + Math.random() * 60000;
      if (now < nextSky) return false;
      nextSky = now + 60000 + Math.random() * 60000; return true;
    };
    // Cyber sorcerer: a completed task draws a small constellation, line by line, which then fades (real time, ~4 s)
    ML.fxConstellation = () => {
      if (still || (document.documentElement.dataset.theme || 'sorcerer') !== 'sorcerer') return;
      const x0 = W * (0.1 + Math.random() * 0.8), y0 = H * (0.1 + Math.random() * 0.5), n = 5 + Math.floor(Math.random() * 3);
      const pts = Array.from({ length: n }, (_, i) => [x0 + Math.cos(i * 1.3 + Math.random()) * (30 + Math.random() * 50), y0 + Math.sin(i * 1.3 + Math.random()) * (20 + Math.random() * 35)]);
      drawn.push({ pts, t0: performance.now() }); if (drawn.length > 3) drawn.shift();
    };
    /* ---------- Netrunner (Fired up, dark): the megatower city (3.32) ----------
       Chosen by the user from proposals/netrunner-villes.png (A) plus the katakana signs of B. Three depths with haze
       between them (far blocks and a gold-lit arcology pyramid, stepped mid towers with light bands, near megatowers with
       wings, a cut crown, cyan / magenta light seams and an antenna), painted once per size into an offscreen canvas.
       Live: antenna lights blink, the vertical katakana signs glow and change a glyph now and then, one sign buzzes at
       rest, a slow scan line crosses at rest. The katakana data rain (three depths) runs in front of the city. */
    let net = null, netKey = '', netSigns = [], netBeacons = [], scanY = -1;
    const KATA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモラリルレロワン';
    function netBuild() {
      const c = document.createElement('canvas'), d = Math.min(2, devicePixelRatio || 1);
      c.width = W * d; c.height = H * d; const b = c.getContext('2d'); b.setTransform(d, 0, 0, d, 0, 0);
      let seed = 1337; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const haze = (y, h, rgb, a) => { const g = b.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},${a})`); b.fillStyle = g; b.fillRect(0, y, W, h); };
      // heights follow the screen; on phones the timer card is see-through, so the city stays low and quiet under the dial
      const small = W < 700, u = Math.max(0.6, Math.min(1.4, H / 900)) * (small ? 0.55 : 1);
      const sk = b.createLinearGradient(0, H * 0.3, 0, H); sk.addColorStop(0, 'rgba(26,15,58,0)'); sk.addColorStop(1, 'rgba(26,15,58,.55)'); b.fillStyle = sk; b.fillRect(0, 0, W, H);
      // far blocks and the arcology
      b.fillStyle = '#17163a'; for (let x = 0; x < W;) { const w = (30 + r() * 60) * u, h = (130 + r() * 140) * u; b.fillRect(x, H - h, w - 4, h); x += w; }
      const ax = W * (0.62 + r() * 0.2), ah = 420 * u, aw = 200 * u;
      b.fillStyle = '#211c4c'; b.beginPath(); b.moveTo(ax - aw, H); b.lineTo(ax - 26 * u, H - ah); b.lineTo(ax + 26 * u, H - ah); b.lineTo(ax + aw, H); b.fill();
      b.strokeStyle = 'rgba(255,190,120,.3)'; b.lineWidth = 1.2; for (let y = H - ah + 26 * u; y < H; y += 24 * u) { const k = (y - (H - ah)) / ah; b.beginPath(); b.moveTo(ax - 26 * u - (aw - 26 * u) * k, y); b.lineTo(ax + 26 * u + (aw - 26 * u) * k, y); b.stroke(); }
      haze(H - 330 * u, 330 * u, '40,24,90', 0.5);
      // mid towers: stepped tops, horizontal light bands
      for (let x = -20; x < W;) {
        const w = (60 + r() * 90) * u, h = (150 + r() * 170) * u, y = H - h; b.fillStyle = '#0d0e28';
        b.fillRect(x, y, w, h); b.fillRect(x + w * 0.15, y - 28 * u, w * 0.7, 28 * u); b.fillRect(x + w * 0.35, y - 56 * u, w * 0.3, 28 * u);
        for (let yy = y + 18; yy < H; yy += (14 + Math.floor(r() * 3) * 8) * u) if (r() < 0.42) { b.fillStyle = r() < 0.2 ? 'rgba(255,43,214,.32)' : 'rgba(0,240,255,.2)'; b.fillRect(x + 6, yy, (w - 12) * (0.3 + r() * 0.7), 2); }
        if (r() < (small ? 0.12 : 0.35)) netSigns.push({ x: x + w * (0.1 + r() * 0.6), y: y + 30 * u + r() * 80 * u, h: (70 + r() * 40) * u, c: r() < 0.5 ? '#ff2bd6' : '#00f0ff', g: Array.from({ length: 4 }, () => KATA[Math.floor(r() * KATA.length)]), p: r() * 6, far: true });
        x += w + 8 * u;
      }
      haze(H - 200 * u, 200 * u, '30,16,70', 0.45);
      // near megatowers: wings, a cut crown, light seams, an antenna (its light blinks live)
      const n = Math.max(2, Math.round(W / 520));
      for (let i = 0; i < n; i++) {
        const w = (100 + r() * 50) * u, h = (380 + r() * 170) * u, x = (i + 0.15 + r() * 0.6) * W / n - w / 2, y = H - h;
        b.fillStyle = '#05050d';
        b.fillRect(x - 26 * u, y + h * 0.35, w + 52 * u, h * 0.65); b.fillRect(x - 12 * u, y + h * 0.15, w + 24 * u, h * 0.85); b.fillRect(x, y, w, h);
        b.beginPath(); b.moveTo(x + 6, y); b.lineTo(x + w * 0.3, y - 46 * u); b.lineTo(x + w * 0.7, y - 46 * u); b.lineTo(x + w - 6, y); b.fill();
        b.fillRect(x + w * 0.42, y - 116 * u, 3, 72 * u);
        b.fillStyle = 'rgba(0,240,255,.22)'; b.fillRect(x - 12 * u, y + h * 0.15, w + 24 * u, 2); b.fillRect(x - 26 * u, y + h * 0.35, w + 52 * u, 2);
        b.save(); b.globalAlpha = 0.65; b.shadowBlur = 8; b.shadowColor = '#00f0ff'; b.fillStyle = '#00f0ff'; b.fillRect(x + w * 0.25, y + 20, 2, h - 20); b.shadowColor = '#ff2bd6'; b.fillStyle = '#ff2bd6'; b.fillRect(x + w * 0.75, y + 60 * u, 2, h - 60 * u); b.restore();
        for (let k = 0; k < 16; k++) { b.fillStyle = `rgba(0,240,255,${0.12 + r() * 0.3})`; b.fillRect(x + 8 + r() * (w - 16), y + 30 + r() * (h - 40), 4, 6); }
        netBeacons.push({ x: x + w * 0.42 + 1.5, y: y - 116 * u, p: r() * 6 });
        if (!small) netSigns.push({ x: x - 24 * u + (r() < 0.5 ? 0 : w + 24 * u), y: y + h * (0.4 + r() * 0.2), h: (96 + r() * 40) * u, c: r() < 0.5 ? '#ff2bd6' : '#00f0ff', g: Array.from({ length: 5 }, () => KATA[Math.floor(r() * KATA.length)]), p: r() * 6 });
      }
      haze(H - 90 * u, 90 * u, '20,10,50', 0.6);
      net = c; netKey = W + 'x' + H;
    }
    function netDraw(tm, rest, now) {
      if (W < 1 || H < 1) return; // not sized yet (a zero-size canvas would throw in drawImage and stop the loop)
      if (!net || netKey !== W + 'x' + H) { netSigns = []; netBeacons = []; netBuild(); }
      cx.drawImage(net, 0, 0, W, H);
      // vertical katakana signs: a frame, the glyphs; one buzzes now and then at rest; a glyph changes every few seconds
      cx.font = '600 13px "JetBrains Mono", monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      netSigns.forEach((s, i) => {
        const buzz = rest && !still && Math.sin(tm * 0.0013 + s.p) > 0.985, a = (s.far ? 0.55 : 0.9) * (buzz ? 0.25 : 1);
        if (!still && Math.random() < 0.0015) s.g[Math.floor(Math.random() * s.g.length)] = KATA[Math.floor(Math.random() * KATA.length)];
        cx.globalAlpha = a; cx.strokeStyle = s.c; cx.lineWidth = 1.5; cx.shadowColor = s.c; cx.shadowBlur = 10; cx.strokeRect(s.x, s.y, 20, s.h); cx.shadowBlur = 0;
        cx.fillStyle = s.c; const step = s.h / (s.g.length + 1); s.g.forEach((g, k) => cx.fillText(g, s.x + 10, s.y + step * (k + 1)));
      });
      cx.textAlign = 'start'; cx.textBaseline = 'alphabetic';
      // antenna lights: a slow blink
      netBeacons.forEach(bc => { const on = still ? 1 : (Math.sin(tm * 0.003 + bc.p) > 0.2 ? 1 : 0.15); glow(bc.x, bc.y, 12, '#ff4b4b', 0.5 * on); cx.globalAlpha = on; cx.fillStyle = '#ff6b6b'; cx.fillRect(bc.x - 2, bc.y - 2, 4, 4); });
      // rest only: a faint scan line crosses the screen every ~14 s
      if (rest && !still) { scanY = ((tm % 14000) / 14000) * (H + 60) - 30; cx.globalAlpha = 0.06; cx.fillStyle = '#00f0ff'; cx.fillRect(0, scanY, W, 18); cx.globalAlpha = 0.14; cx.fillRect(0, scanY + 8, W, 1.5); }
      cx.globalAlpha = 1;
    }
    /* ---------- Estampe (ex Salle blanche): the ink city (Fired up, light) ----------
       A static ink drawing cached per screen size (paper, a setting sun, three rows of towers, a monorail viaduct),
       then live parts each frame: red windows and neon columns that light up with today's progress, screens with
       the day's numbers, searchlights, drones, the monorail after a focus session, ink rain. */
    let ink = null, inkKey = '', inkSigns = [], inkScreens = [], inkLights = [], inkDrones = [], inkDrops = [], inkTrain = null, inkData = null, inkDataT = 0, inkGround = 0, inkRail = 0;
    const INK = '#111111', RED = '#E3001B', PAPER = '#F7F5EF';
    function inkTowers(rnd, gy, hmin, hmax, wmin, wmax, gap) {
      const out = []; let x = -20;
      while (x < W + 20) {
        const w = wmin + rnd() * (wmax - wmin), h = H * (hmin + Math.pow(rnd(), 1.5) * (hmax - hmin)), tiers = 1 + Math.floor(rnd() * 3), parts = []; let y = gy, cw = w, cx0 = x;
        for (let k = 0; k < tiers; k++) { const th = h * (k === 0 ? 0.66 : 0.34 / (tiers - 1 || 1)); parts.push([cx0, y - th, cw, th]); y -= th; const nw = cw * (0.6 + rnd() * 0.26); cx0 += (cw - nw) / 2; cw = nw; }
        out.push({ x, w, h, parts, top: y, mid: cx0 + cw / 2, spire: rnd() < 0.45, sign: rnd() < 0.35, screen: rnd() < 0.14 }); x += w + 2 + rnd() * gap;
      }
      return out;
    }
    function inkBuild() {
      let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      const c = document.createElement('canvas'), d = Math.min(2, devicePixelRatio || 1); c.width = W * d; c.height = H * d; const b = c.getContext('2d'); b.setTransform(d, 0, 0, d, 0, 0);
      inkSigns = []; inkScreens = []; inkLights = []; inkGround = H * 0.86; inkRail = inkGround - H * 0.17;
      b.fillStyle = PAPER; b.fillRect(0, 0, W, H);
      const R = Math.min(W, H), sr = R * 0.2, sx = W * 0.035, sy = inkGround - H * 0.3;                       // the setting sun, low in the left margin
      b.fillStyle = RED; b.beginPath(); b.arc(sx, sy, sr, 0, 6.29); b.fill();
      b.fillStyle = PAPER; for (let k = 0; k < 6; k++) b.fillRect(sx - sr, sy + sr * (0.1 + k * 0.15), sr * 2, 2 + k);
      b.strokeStyle = INK; b.lineCap = 'round';                                                                  // a few ink strokes for clouds
      [[0.02, 0.32, 0.12], [0.86, 0.3, 0.12], [0.9, 0.42, 0.08], [0.05, 0.44, 0.08]].forEach(([fx, fy, fw]) => { const x = W * fx, y = H * fy, w = W * fw; b.lineWidth = 2; b.beginPath(); b.moveTo(x, y); b.lineTo(x + w, y); b.stroke(); b.lineWidth = 1.2; b.beginPath(); b.moveTo(x + w * 0.15, y + 7); b.lineTo(x + w * 0.8, y + 7); b.stroke(); });
      inkTowers(rnd, inkGround - 34, 0.2, 0.5, 40, 110, 4).forEach(t => t.parts.forEach(([x, y, w, h]) => { b.fillStyle = PAPER; b.fillRect(x, y, w, h); b.strokeStyle = '#A8A59C'; b.lineWidth = 1; b.strokeRect(x + 0.5, y + 0.5, w, h); }));
      inkTowers(rnd, inkGround - 10, 0.14, 0.44, 46, 120, 16).forEach(t => {
        t.parts.forEach(([x, y, w, h]) => {
          b.fillStyle = '#FFFFFF'; b.fillRect(x, y, w, h); b.fillStyle = '#E4E1D8'; b.fillRect(x + w * 0.72, y, w * 0.28, h);
          for (let yy = y + 9; yy < y + h - 6; yy += 11) for (let xx = x + 6; xx < x + w * 0.66; xx += 9) { const r = rnd(); if (r < 0.22) { b.fillStyle = INK; b.fillRect(xx, yy, 3, 5); } else if (r < 0.3) inkLights.push([xx, yy]); }
          b.strokeStyle = INK; b.lineWidth = 1.6; b.strokeRect(x + 0.5, y + 0.5, w, h);
        });
        if (t.spire) { b.fillStyle = INK; b.fillRect(t.mid - 1, t.top - 44, 2, 44); }
        if (t.sign) inkSigns.push({ x: t.x + t.w - 10, y: inkGround - 10 - t.h * 0.72, h: 50 + rnd() * 70, p: rnd() * 100, rate: 0.002 + rnd() * 0.004 });
        if (t.screen) inkScreens.push({ x: t.x + t.w / 2 - 75, y: inkGround - 10 - t.h * 0.6, w: 150, h: 46, o: rnd() * 400 });
      });
      inkLights.sort(() => rnd() - 0.5);
      b.fillStyle = INK; b.fillRect(0, inkRail, W, 6); for (let px = 30; px < W; px += 130) { b.fillRect(px, inkRail, 6, inkGround - inkRail); b.fillRect(px - 8, inkRail + 6, 22, 3); }
      inkTowers(rnd, inkGround, 0.06, 0.26, 60, 170, 30).forEach(t => t.parts.forEach(([x, y, w, h]) => { b.fillStyle = INK; b.fillRect(x, y, w, h); b.fillStyle = PAPER; for (let yy = y + 7; yy < y + h - 4; yy += 9) for (let xx = x + 6; xx < x + w - 6; xx += 7) if (rnd() < 0.13) b.fillRect(xx, yy, 2, 3); }));
      b.fillStyle = INK; b.fillRect(0, inkGround, W, H - inkGround);
      b.strokeStyle = PAPER; b.lineWidth = 1; b.globalAlpha = 0.7; for (let k = 0; k < 46; k++) { const x = rnd() * W, y = inkGround + 8 + rnd() * (H - inkGround - 12); b.beginPath(); b.moveTo(x, y); b.lineTo(x + 12 + rnd() * 34, y); b.stroke(); }
      ink = c; inkKey = W + 'x' + H;
      inkDrops = Array.from({ length: Math.round(W * H / 5600) }, () => ({ x: Math.random() * W, y: Math.random() * H, l: 16 + Math.random() * 20, v: 11 + Math.random() * 7, a: 0.2 + Math.random() * 0.3 }));
      inkDrones = Array.from({ length: W < 600 ? 2 : 4 }, (_, i) => ({ x: Math.random() * W, y: H * (0.12 + Math.random() * 0.3), v: (i % 2 ? -1 : 1) * (0.25 + Math.random() * 0.3), p: Math.random() * 6 }));
    }
    // today's numbers, for the lit windows / neon columns and the screens (refreshed every 2 s)
    function inkNumbers(now) {
      if (inkData && now - inkDataT < 2000) return inkData;
      inkDataT = now;
      const td = today(), ss = S.sessions.filter(x => dayKey(new Date(x.at)) === td), mins = ss.reduce((a, x) => a + x.mins, 0), D = S.game.daily, tasks = D && D.day === td ? D.tasks : 0;
      const Q = S.game.quests && S.game.quests.day === td ? S.game.quests : null, nowM = new Date().getHours() * 60 + new Date().getMinutes();
      const nb = (S.blocks || []).filter(x => x.date === td && x.start > nowM).sort((a, z) => a.start - z.start)[0];
      const parts = [t('ink_focus', { t: fmtMins(mins) }), t('ink_streak', { n: ML.streaks().cur }), Q ? t('ink_quests', { n: Q.claimed.length, m: Q.ids.length }) : '', t('sequence') + ' ' + ML.seqInfo().num, nb ? t('ink_next', { t: ML.pad2(Math.floor(nb.start / 60)) + ':' + ML.pad2(nb.start % 60) }) : ''].filter(Boolean);
      inkData = { lit: tasks * 12 + ss.length * 6, signsOn: 2 + tasks, ticker: parts.join('   ◆   ').toUpperCase() + '   ◆   ' };
      return inkData;
    }
    on('session', () => { if (!still && document.documentElement.dataset.theme === 'netrunner' && document.documentElement.dataset.light) inkTrain = { x: -440, v: 3.4 }; inkData = null; });
    on('task:done', () => { inkData = null; });
    function inkDraw(tm, slow, rest, mv, now) {
      if (!ink || inkKey !== W + 'x' + H) inkBuild();
      const N = inkNumbers(now), sp = still ? 0 : slow;
      cx.drawImage(ink, 0, 0, W, H);
      cx.fillStyle = RED; for (let k = 0; k < Math.min(N.lit, inkLights.length); k++) cx.fillRect(inkLights[k][0], inkLights[k][1], 3, 5);
      [[W * 0.2, 0], [W * 0.62, 2.2]].forEach(([bx, ph]) => { const a = -1.57 + Math.sin(tm * 0.00018 + ph) * 0.5; cx.globalAlpha = 0.05; cx.fillStyle = INK; cx.beginPath(); cx.moveTo(bx, inkGround); cx.lineTo(bx + Math.cos(a - 0.05) * H * 1.2, inkGround + Math.sin(a - 0.05) * H * 1.2); cx.lineTo(bx + Math.cos(a + 0.05) * H * 1.2, inkGround + Math.sin(a + 0.05) * H * 1.2); cx.fill(); cx.globalAlpha = 1; });
      inkSigns.forEach((s, i) => {
        const lit = i < N.signsOn, off = !lit || (rest && (Math.sin(tm * s.rate + s.p) > 0.97 || Math.random() < 0.003)); // rest only: the odd buzz
        cx.fillStyle = off ? '#D9D6CC' : RED; cx.fillRect(s.x, s.y, 12, s.h); cx.strokeStyle = INK; cx.lineWidth = 1.6; cx.strokeRect(s.x, s.y, 12, s.h);
        cx.fillStyle = off ? '#B9B6AC' : '#FFFFFF'; for (let k = 8; k < s.h - 8; k += 13) cx.fillRect(s.x + 3, s.y + k, 6, 7);
      });
      cx.font = ctx.font = '600 13px "Chakra Petch", "Bahnschrift", sans-serif'; cx.textBaseline = 'middle';
      // measured on the real context: on skipped frames cx is the NOP stand-in, and `x % NOP` threw, which killed the loop
      const tw = ctx.measureText(N.ticker).width || 1;
      for (const s of inkScreens) {
        cx.fillStyle = INK; cx.fillRect(s.x, s.y, s.w, s.h); cx.fillStyle = RED; cx.fillRect(s.x + 4, s.y + s.h - 8, s.w - 8, 3);
        cx.save(); cx.beginPath(); cx.rect(s.x + 6, s.y + 4, s.w - 12, s.h - 14); cx.clip(); cx.fillStyle = '#FFFFFF';
        const ox = (tm * 0.03 + s.o) % tw; cx.fillText(N.ticker, s.x + 6 - ox, s.y + s.h / 2 - 4); cx.fillText(N.ticker, s.x + 6 - ox + tw, s.y + s.h / 2 - 4); cx.restore();
      }
      for (const d of inkDrones) {
        if (mv) { d.x += d.v; if (d.x > W + 20) d.x = -20; if (d.x < -20) d.x = W + 20; }
        const yy = d.y + Math.sin(tm * 0.001 + d.p) * 4; cx.fillStyle = INK; cx.fillRect(d.x - 7, yy, 14, 3); cx.fillRect(d.x - 2, yy - 3, 4, 3);
        if (!still && Math.floor(now / 600 + d.p) % 2) { cx.fillStyle = RED; cx.fillRect(d.x - 1, yy + 3, 2, 2); }
      }
      if (inkTrain) {
        if (!still) inkTrain.x += inkTrain.v; const ty = inkRail - 22;
        cx.fillStyle = INK; cx.fillRect(inkTrain.x, ty, 400, 20); cx.beginPath(); cx.moveTo(inkTrain.x + 400, ty); cx.lineTo(inkTrain.x + 432, ty + 20); cx.lineTo(inkTrain.x + 400, ty + 20); cx.fill();
        cx.fillStyle = RED; cx.fillRect(inkTrain.x, ty + 14, 422, 3); cx.fillStyle = PAPER; for (let k = 10; k < 390; k += 22) cx.fillRect(inkTrain.x + k, ty + 4, 14, 7);
        if (inkTrain.x > W + 40) inkTrain = null;
      }
      if (sp > 0) { // ink rain, lighter during a session, still in the last 10 s
        cx.strokeStyle = INK; cx.lineWidth = 1.1;
        for (const d of inkDrops) { if (mv) { d.y += d.v; d.x -= d.v * 0.1; if (d.y > H) { d.y = -30; d.x = Math.random() * W * 1.1; } }
          cx.globalAlpha = d.a * (rest ? 1 : 0.55); cx.beginPath(); cx.moveTo(d.x, d.y); cx.lineTo(d.x + d.l * 0.1, d.y - d.l); cx.stroke(); }
        cx.globalAlpha = 1;
      }
    }
    function draw(tm) {
      raf = null; // set again below only while animating, so start() / the 'motion' event can restart the loop
      const root = document.documentElement, th = root.dataset.theme || 'sorcerer';
      const paint = still || !tm || tm - lastPaint >= ((ML.fxGap && ML.fxGap(th)) || 31); // a world may paint less often (Washi)
      if (paint) lastPaint = tm;
      const slow = root.classList.contains('t-final') ? 0 : root.dataset.timer === 'running' ? 0.3 : 1;
      if (tm) { vt += lastTm ? Math.min(100, tm - lastTm) * slow : 0; lastTm = tm; tm = vt; }
      acc += slow; const mv = !still && acc >= 1; if (acc >= 1) acc -= 1;
      const rest = !still && slow === 1 && root.dataset.timer !== 'running', now = performance.now();
      cx = paint ? ctx : NOP;
      cx.clearRect(0, 0, W, H);
      // Deep focus (step 6, item 61): its opaque scene covers the page, so the decor stops drawing altogether
      const deepEl = $('deep');
      // (Washi Peint keeps its misty landscape behind the full-screen ink ensō)
      if (deepEl && !deepEl.hidden && !(ML.washiKeepsDrawing && ML.washiKeepsDrawing())) { if (!still) raf = requestAnimationFrame(draw); return; }
      if (th === 'fog') {
        glow(W * 0.85, H * 0.08, Math.max(W, H) * 0.35, 'rgba(196,56,74,0.9)', 0.14);
        for (const f of fog) {
          if (mv) { f.x += f.v; if (f.x - f.r > W) f.x = -f.r; if (f.x + f.r < 0) f.x = W + f.r; }
          glow(f.x, f.y, f.r, 'rgba(170,170,180,1)', f.a);
        }
        // Two candles at the sides, flickering gently, and slow embers rising from them
        [W * 0.035, W * 0.965].forEach((x, i) => {
          const y = H * 0.86, fl = still ? 1 : 0.85 + 0.1 * Math.sin(tm / 230 + i * 2) + 0.05 * Math.sin(tm / 97 + i);
          glow(x, y - 10, 70 * fl, 'rgba(255,170,90,1)', 0.1 * fl);
          cx.globalAlpha = 0.35; cx.fillStyle = '#d9cbb0'; cx.fillRect(x - 3, y, 6, 26);
          cx.globalAlpha = 0.75 * fl; cx.fillStyle = '#ffcf8a';
          cx.beginPath(); cx.ellipse(x + (still ? 0 : Math.sin(tm / 400 + i) * 0.6), y - 6, 2.4, 6 * fl, 0, 0, 6.29); cx.fill();
        });
        for (const e of embers) {
          const bx = e.side ? W * 0.965 : W * 0.035;
          if (mv) { e.y -= e.v; e.x = Math.sin(vt / 1800 + e.p) * 10; if (e.y < H * 0.35) { e.y = H * 0.86; } }
          const life = Math.max(0, Math.min(1, (e.y - H * 0.35) / (H * 0.51)));
          cx.globalAlpha = 0.5 * life; cx.fillStyle = '#ff9a5a'; cx.beginPath(); cx.arc(bx + e.x, e.y, e.r, 0, 6.29); cx.fill();
        }
        cx.globalAlpha = 1;
      } else if (th === 'sanctuary' && document.documentElement.dataset.light) {
        // Washi: the ink scene (mountains in the mist, plum branches, ensō, birds, petals) lives in washi.js
        if (ML.washiDraw) ML.washiDraw(cx, W, H, slow, still, now);
      } else if (th === 'sanctuary') {
        // The moon garden (willow, shore, bridge, lilies, mist) lives in sanctuary.js; then the stars and fireflies
        if (ML.sanctuaryDraw) ML.sanctuaryDraw(cx, W, H, slow, still, now, tm);
        // Moonlight, a few faint twinkling stars, and fireflies that wander slowly
        glow(W * 0.12, H * 0.06, Math.max(W, H) * 0.4, 'rgba(160,200,255,1)', 0.08);
        for (const s of twinkles) {
          cx.globalAlpha = still ? 0.35 : 0.12 + 0.45 * Math.pow((Math.sin(tm * 6.283 / s.T + s.p) + 1) / 2, 2);
          cx.fillStyle = '#e8eefc'; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.29); cx.fill();
        }
        cx.globalAlpha = 1;
        // Rest only: a rare shooting star across the upper sky
        if (!sky && skyDue(rest, now)) sky = { x: W * (0.15 + Math.random() * 0.6), y: H * (0.04 + Math.random() * 0.2), vx: 5 + Math.random() * 3, vy: 1.6 + Math.random(), n: 0 };
        if (sky) {
          const g = cx.createLinearGradient(sky.x, sky.y, sky.x - sky.vx * 12, sky.y - sky.vy * 12);
          g.addColorStop(0, 'rgba(240,244,255,.75)'); g.addColorStop(1, 'rgba(240,244,255,0)');
          cx.strokeStyle = g; cx.lineWidth = 1.2; cx.globalAlpha = 1 - sky.n / 60; cx.beginPath(); cx.moveTo(sky.x, sky.y); cx.lineTo(sky.x - sky.vx * 12, sky.y - sky.vy * 12); cx.stroke(); cx.globalAlpha = 1;
          if (!still) { sky.x += sky.vx; sky.y += sky.vy; if (++sky.n > 60) sky = null; }
        }
        for (const f of flies) {
          if (mv) {
            f.vx = (f.vx + (Math.random() - 0.5) * 0.06) * 0.97; f.vy = (f.vy + (Math.random() - 0.5) * 0.06 - 0.002) * 0.97;
            f.x += f.vx * f.s; f.y += f.vy * f.s;
            if (f.x < -10) f.x = W + 10; if (f.x > W + 10) f.x = -10; if (f.y < -10) f.y = H + 10; if (f.y > H + 10) f.y = -10;
          }
          const pulse = still ? 0.6 : 0.35 + 0.65 * Math.pow((Math.sin(tm / 900 * f.s + f.p) + 1) / 2, 3);
          glow(f.x, f.y, 9 * f.s, colors[0], 0.35 * pulse);
          cx.globalAlpha = 0.9 * pulse; cx.fillStyle = colors[0]; cx.fillRect(f.x - 1, f.y - 1, 2, 2); cx.globalAlpha = 1;
        }
      } else if (th === 'observatory' && document.documentElement.dataset.light) {
        // Codex: the old Victorian city in the mist (river, clock tower, gas lamps, smoke on a pause) lives in codex.js
        if (ML.codexDraw) ML.codexDraw(cx, W, H, slow, still, now);
      } else if (th === 'observatory') {
        // Warm sun, slow light shafts, golden dust, and a brass orrery turning in the corner
        glow(W * 0.92, H * 0.02, Math.max(W, H) * 0.5, 'rgba(255,200,120,1)', 0.12);
        cx.save(); cx.translate(W * 0.95, -H * 0.05); cx.rotate(0.62 + (still ? 0 : Math.sin(tm / 9000) * 0.03));
        [[-60, 70, 0.05], [60, 40, 0.04], [150, 90, 0.03]].forEach(([o, w, a]) => { const g = cx.createLinearGradient(0, 0, 0, H * 1.3); g.addColorStop(0, `rgba(255,214,150,${a})`); g.addColorStop(1, 'rgba(255,214,150,0)'); cx.fillStyle = g; cx.fillRect(o, 0, w, H * 1.3); });
        cx.restore();
        for (const q of parts) {
          if (mv) { q.y -= q.v * 0.25; q.x += Math.sin(tm / 4000 + q.p) * 0.15; if (q.y < -4) { q.y = H + 4; q.x = Math.random() * W; } }
          cx.globalAlpha = 0.12 + 0.3 * (still ? 0.5 : (Math.sin(tm / 1700 + q.p) + 1) / 2); cx.fillStyle = q.c ? colors[0] : '#fff1d6';
          cx.beginPath(); cx.arc(q.x, q.y, q.r, 0, 6.29); cx.fill();
        }
        // Brass astrolabe in the corner: engraved rings, each turning very slowly (2–3 min a turn), in alternating directions
        const ox = W * 0.08, oy = H * 0.9, R = Math.min(W, H) * 0.32;
        cx.globalAlpha = 0.16; cx.strokeStyle = colors[0]; cx.lineWidth = 1;
        cx.beginPath(); cx.moveTo(ox - R, oy); cx.lineTo(ox + R, oy); cx.moveTo(ox, oy - R); cx.lineTo(ox, oy + R); cx.stroke();
        [[0.35, 150], [0.6, 180], [0.85, 130], [1, 165]].forEach(([f, P], i) => {
          const r = R * f, rot = still ? i * 0.7 : (i % 2 ? -1 : 1) * tm / (P * 1000) * 6.283 + i * 0.7;
          cx.globalAlpha = 0.16; cx.beginPath(); cx.arc(ox, oy, r, 0, 6.29); cx.stroke();
          cx.globalAlpha = 0.13; cx.beginPath();
          for (let k = 0; k < 24; k++) { const a = rot + k * 0.2618, l = k % 6 ? 4 : 9; cx.moveTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r); cx.lineTo(ox + Math.cos(a) * (r - l), oy + Math.sin(a) * (r - l)); }
          cx.stroke();
          cx.globalAlpha = 0.22; cx.fillStyle = i % 2 ? colors[1] : colors[0]; cx.beginPath(); cx.arc(ox + Math.cos(rot) * r, oy + Math.sin(rot) * r, 2.5 + i * 0.6, 0, 6.29); cx.fill();
        });
        cx.globalAlpha = 0.25; cx.fillStyle = colors[0]; cx.beginPath(); cx.arc(ox, oy, 6, 0, 6.29); cx.fill();
        cx.globalAlpha = 1;
      } else if (th === 'abyss') {
        // The sleeping reef (corals, sea fans, kelp, anemones, the fish school, rays, marine snow) lives in abyss.js
        // (3.43, it replaced the rising bubbles); the bioluminescent jellyfish pulse upward over it
        if (ML.abyssDraw) ML.abyssDraw(cx, W, H, slow, still, now, tm, rest);
        for (const j of jellies) {
          // one beat per 4–6 s: a quick contraction of the bell, then a long relaxed glide (pulse 1 = contracted)
          const ph = still ? 0.6 : ((tm / j.T + j.p / 6.283) % 1), pulse = ph < 0.25 ? Math.sin(ph / 0.25 * Math.PI / 2) : Math.pow(1 - (ph - 0.25) / 0.75, 2);
          if (mv) { j.y -= j.v * (0.35 + 1.4 * pulse); j.x += Math.sin(tm / 7000 + j.p) * 0.1; if (j.y < -j.s * 4) { j.y = H + j.s * 2; j.x = Math.random() * W; } }
          // Rest only: they drift gently away from the mouse pointer
          if (rest && ptr) { const dx = j.x - ptr[0], dy = j.y - ptr[1], d2 = dx * dx + dy * dy; if (d2 < 150 * 150 && d2 > 1) { const k = (1 - Math.sqrt(d2) / 150) * 0.9 / Math.sqrt(d2); j.x += dx * k; j.y += dy * k * 0.6; } }
          const col = j.c ? colors[1] : colors[0], s = j.s, w = s * (1.02 - 0.16 * pulse), h = s * (0.66 + 0.14 * pulse);
          glow(j.x, j.y, s * 2.4, col, 0.09 + 0.06 * pulse);
          cx.globalAlpha = 0.32; cx.fillStyle = col; cx.beginPath(); cx.ellipse(j.x, j.y, w, h, 0, Math.PI, 0); cx.closePath(); cx.fill();
          cx.globalAlpha = 0.28; cx.strokeStyle = col; cx.lineWidth = 1.1;
          for (let k = 0; k < 4; k++) {
            const tx = j.x - w * 0.6 + k * w * 0.4; cx.beginPath(); cx.moveTo(tx, j.y);
            for (let d = 1; d <= 6; d++) cx.lineTo(tx + Math.sin(tm / 1100 + j.p + d * 0.9 + k) * 2.4, j.y + d * s * (0.3 + 0.06 * pulse)); // tentacles trail longer on the push
            cx.stroke();
          }
        }
        cx.globalAlpha = 1;
      } else if (th === 'neoncity') {
        // Synthwave night: striped sun on the horizon, a skyline, and a perspective grid rolling toward you
        const hz = H * 0.66, sr = Math.min(W, H) * 0.2, sx = W * 0.5;
        const sg = cx.createLinearGradient(0, hz - sr, 0, hz); sg.addColorStop(0, '#ffcf5a'); sg.addColorStop(0.55, colors[1]); sg.addColorStop(1, colors[0]);
        glow(sx, hz - sr * 0.4, sr * 2.6, colors[0], 0.16);
        cx.globalAlpha = 0.34; cx.fillStyle = sg; cx.beginPath(); cx.arc(sx, hz, sr, Math.PI, 0); cx.fill();
        cx.globalCompositeOperation = 'destination-out'; cx.globalAlpha = 1;
        for (let i = 0; i < 6; i++) { const y = hz - sr * 0.08 - i * sr * 0.11, hh = Math.max(1, 5 - i * 0.7); cx.fillRect(sx - sr, y - hh, sr * 2, hh); }
        cx.globalCompositeOperation = 'source-over';
        for (const b of city) {
          cx.globalAlpha = 0.9; cx.fillStyle = '#0b0418'; cx.fillRect(b.x, hz - b.h, b.w, b.h);
          cx.globalAlpha = 0.25; cx.strokeStyle = colors[0]; cx.lineWidth = 0.6; cx.strokeRect(b.x + 0.5, hz - b.h + 0.5, b.w - 1, b.h);
          for (const [x, y, warm] of b.wins) { cx.globalAlpha = 0.3; cx.fillStyle = warm ? colors[1] : '#7ef3ff'; cx.fillRect(x, y, 3, 4); }
        }
        cx.globalAlpha = 0.28; cx.strokeStyle = colors[0]; cx.lineWidth = 1;
        cx.beginPath(); cx.moveTo(0, hz); cx.lineTo(W, hz); cx.stroke();
        const off = still ? 0 : (tm / 20000) % 1; // the floor rolls slowly toward you: one band every ~20 s
        for (let i = 0; i < 14; i++) { const f = Math.pow((i + off) / 14, 2.2), y = hz + f * (H - hz); cx.globalAlpha = 0.08 + 0.25 * f; cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke(); }
        cx.globalAlpha = 0.18;
        for (let i = -12; i <= 12; i++) { cx.beginPath(); cx.moveTo(sx + i * 6, hz); cx.lineTo(sx + i * W * 0.14, H); cx.stroke(); }
        cx.globalAlpha = 1;
      } else if (th === 'arcade' && document.documentElement.dataset.light) {
        // Cartouche: the overworld is a static CSS background (stars would read as specks of dirt on the pale sky)
      } else if (th === 'arcade') {
        // Pixel starfield that twinkles slowly in steps (a ~5 s cycle per star), plus the odd shooting pixel
        const step = still ? 0 : Math.floor(tm / 650), dim = document.documentElement.dataset.timer === 'running' ? 0.4 : 1; // dimmer during a session
        for (const s of stars) {
          const ph = (step + s.p) % 8, a = ph < 4 ? [0.15, 0.35, 0.6, 0.35][ph] : 0.15;
          cx.globalAlpha = a * dim; cx.fillStyle = s.s === 4 ? colors[0] : '#fff3d6'; cx.fillRect(s.x, s.y, s.s, s.s);
        }
        cx.globalAlpha = 1;
        if (!still) {
          if (!shoot && skyDue(rest, now)) shoot = { x: Math.random() * W * 0.6, y: Math.random() * H * 0.3, n: 0 };
          if (shoot) {
            for (let i = 0; i < 6; i++) { cx.globalAlpha = 1 - i / 6; cx.fillStyle = i ? colors[1] : '#fff'; cx.fillRect(Math.floor((shoot.x - i * 8) / 4) * 4, Math.floor((shoot.y - i * 4) / 4) * 4, 4, 4); }
            cx.globalAlpha = 1; shoot.x += 8; shoot.y += 4; if (++shoot.n > 70) shoot = null;
          }
        }
      } else if (th === 'netrunner' && root.dataset.light) {
        inkDraw(tm, slow, rest, mv, now);
      } else {
        const square = th === 'netrunner';
        if (square) {
          netDraw(tm, rest, now);
          // Katakana data rain in front of the city, in three depths (size, brightness and speed per drop)
          // Rest only: now and then one glyph of the rain lights up in magenta for a moment
          if (rest && (!hiGlyph || now - hiGlyph.t0 > 900) && Math.random() < 0.004) hiGlyph = { d: drops[Math.floor(Math.random() * drops.length)], i: 1 + Math.floor(Math.random() * 3), t0: now };
          if (hiGlyph && (!rest || now - hiGlyph.t0 > 900)) hiGlyph = null;
          for (const d of drops) {
            const z = d.z, fs = [10, 12, 15][z], sp = fs + 2, za = [0.6, 1, 1.35][z];
            cx.font = fs + 'px "JetBrains Mono", monospace';
            if (mv) { d.y += d.v * [0.6, 1, 1.5][z]; if (d.y - d.n * sp > H) { d.y = -10; d.x = Math.floor(Math.random() * W / 14) * 14; } }
            for (let i = 0; i < d.n; i++) {
              // the head glyph used to be near-white at 50 %: a lone bright digit in a gap read like a stray UI label
              const lit = hiGlyph && hiGlyph.d === d && hiGlyph.i === i;
              cx.globalAlpha = lit ? 0.55 * Math.sin(Math.min(1, (now - hiGlyph.t0) / 900) * Math.PI) : (1 - i / d.n) * (i === 0 ? 0.3 : 0.14) * za;
              cx.fillStyle = lit ? '#ff2bd6' : colors[0];
              cx.fillText(GLYPHS[(Math.floor(d.y / sp) + i * 7 + d.x) % GLYPHS.length], d.x, d.y - i * sp);
            }
          }
          cx.globalAlpha = 1;
        }
        if (th === 'sorcerer') {
          // The tower above the clouds (3.47) lives in sorcerer.js; it has its own sky, so the wandering constellations stop
          const scene = ML.sorcererDraw && ML.sorcererDraw(cx, W, H, slow, still, now, tm, rest);
          // Arcane constellations: each fades in, holds, fades out; barely there while a session runs
          const dim = document.documentElement.dataset.timer === 'running' ? 0.35 : 1;
          if (!scene) for (const k of consts) {
            const a = (still ? 0.5 : Math.pow(Math.max(0, Math.sin(tm * 6.283 / k.T + k.p)), 2)) * dim;
            if (a < 0.01) continue;
            cx.globalAlpha = 0.22 * a; cx.strokeStyle = colors[1]; cx.lineWidth = 0.7; cx.beginPath();
            for (const [i, j] of k.edges) { cx.moveTo(k.pts[i][0], k.pts[i][1]); cx.lineTo(k.pts[j][0], k.pts[j][1]); }
            cx.stroke();
            cx.globalAlpha = 0.6 * a; cx.fillStyle = '#e9e4ff';
            for (const [x, y] of k.pts) { cx.beginPath(); cx.arc(x, y, 1.3, 0, 6.29); cx.fill(); }
          }
          // a constellation drawn by a completed task: lines appear one by one (1.5 s), hold, then fade (to 4 s)
          drawn = drawn.filter(k => now - k.t0 < 4000);
          for (const k of drawn) {
            const e = (now - k.t0) / 1500, a = Math.min(1, (4000 - (now - k.t0)) / 1500), segs = k.pts.length - 1;
            cx.strokeStyle = colors[1]; cx.lineWidth = 0.9; cx.fillStyle = '#e9e4ff';
            for (let i = 0; i < segs; i++) {
              const f = Math.max(0, Math.min(1, e * segs - i)); if (!f) break;
              const [x1, y1] = k.pts[i], [x2, y2] = k.pts[i + 1];
              cx.globalAlpha = 0.45 * a; cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f); cx.stroke();
              cx.globalAlpha = 0.8 * a; cx.beginPath(); cx.arc(x1, y1, 1.6, 0, 6.29); cx.fill();
              if (f === 1 && i === segs - 1) { cx.beginPath(); cx.arc(x2, y2, 1.6, 0, 6.29); cx.fill(); }
            }
          }
          cx.globalAlpha = 1;
        }
        for (const q of parts) {
          if (mv) { q.y -= q.v * (square ? 1.6 : 1); if (q.y < -4) { q.y = H + 4; q.x = Math.random() * W; } }
          cx.globalAlpha = 0.15 + 0.35 * (still ? 0.5 : (Math.sin(tm / 1300 + q.p) + 1) / 2);
          cx.fillStyle = q.c ? colors[0] : colors[1];
          if (square) cx.fillRect(q.x, q.y, q.r * 1.6, q.r * 1.6);
          else { cx.beginPath(); cx.arc(q.x + Math.sin(tm / 3000 + q.p) * 6, q.y, q.r, 0, 6.29); cx.fill(); }
        }
        cx.globalAlpha = 1;
        if (square && !still && slow === 1) { // no stray glitch lines during a session
          if (Math.random() < 0.006) glitch = 6;
          if (glitch > 0) { glitch--; cx.fillStyle = colors[Math.random() < 0.5 ? 0 : 1]; cx.globalAlpha = 0.12; cx.fillRect(0, Math.random() * H, W, 1 + Math.random() * 3); cx.globalAlpha = 1; }
        }
      }
      if (!still) raf = requestAnimationFrame(draw);
    }
    addEventListener('resize', () => { size(); if (still) draw(0); });
    size();
    on('motion', reduce => {
      still = reduce;
      if (still) { if (raf) cancelAnimationFrame(raf); raf = null; draw(0); } else if (!raf) raf = requestAnimationFrame(draw);
    });
    return { start() { reset(); if (!raf) raf = requestAnimationFrame(draw); }, reset };
  })();

  on('render', renderStrip);
  on('started', () => { applyTheme(); FX.start(); checkAll(); renderBuff(); });
  on('newday', () => { ensureQuests(); renderStrip(); });
  on('minute', applyTheme);
  // Reroll a daily quest with a Quest scroll (bought in the shop)
  ML.rerollQuest = id => {
    const Q = ensureQuests(); if (Q.claimed.includes(id) || !S.econ || S.econ.potions.scroll < 1) return;
    const pool = Object.keys(QUESTS).filter(q => !Q.ids.includes(q));
    if (!pool.length) return;
    Q.ids[Q.ids.indexOf(id)] = pool[Math.floor(Math.random() * pool.length)];
    S.econ.potions.scroll--; save(); renderStrip(); checkAll();
  };
  $('quest-strip').addEventListener('click', e => { const b = e.target.closest('[data-reroll]'); if (b) ML.rerollQuest(b.dataset.reroll); });
  ML.sfx = sfx;
  ML.showOverlayFx = showOverlay;
  ML.applyTheme = applyTheme;
})();

