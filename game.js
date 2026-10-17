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
    return { cls: 'rar-' + r + (isBoss(task) ? ' boss' : ''), html: `${isBoss(task) ? '<span class="chip boss-chip">⚔ Boss</span>' : ''}<span class="chip rar">${esc(t('r_' + r))} · ${RXP[r]} XP</span>` };
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
  function checkQuests() {
    const Q = ensureQuests(), st = dayStats();
    Q.ids.forEach(id => {
      const q = QUESTS[id];
      if (!Q.claimed.includes(id) && q.val(st) >= q.target) {
        Q.claimed.push(id); ML.addXp(q.xp); sfx('quest');
        toast(t('quest_done', { q: t(id), xp: q.xp }));
      }
    });
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
  on('levelup', s => { showOverlay(t('new_seq'), t('sequence') + ' ' + s.num, s.name); checkAch(); });

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
      th_hint: 'Auto : chaque humeur a son univers. Épuisé → Sanctuaire, Stable → Cyber sorcier, À fond → Netrunner, Dispersé → Arcade 8-bit.',
      opt_nightfog: 'La nuit (21h–6h), passer en Brouillard gris',
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
      th_hint: 'Auto: every mood has its own world. Drained → Sanctuary, Steady → Cyber sorcerer, Fired up → Netrunner, Scattered → 8-bit arcade.',
      opt_nightfog: 'At night (9pm–6am), switch to Gray fog',
    },
  });
  ML.defaults(() => ({ nightFog: false }));

  const THEME_OF = { drained: 'sanctuary', steady: 'sorcerer', fired: 'netrunner', scattered: 'arcade' };
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

  function effectiveTheme() {
    if (S.section === 'sport') return 'arena'; // the Sport section has its own look
    if (S.theme !== 'auto') return S.theme;
    const h = new Date().getHours();
    if (S.nightFog && (h >= 21 || h < 6)) return 'fog';
    return THEME_OF[S.mood] || 'sorcerer';
  }
  let themed = false;
  function applyTheme() {
    const th = effectiveTheme(), root = document.documentElement;
    if (root.dataset.theme === th) return;
    root.dataset.theme = th;
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = { sorcerer: '#07060d', fog: '#0d0d10', netrunner: '#04040a', sanctuary: '#09111b', arcade: '#120c24', arena: '#0c0706' }[th];
    if (themed) playTransition(th);
    themed = true;
    setTimeout(FX.reset, 30);
  }
  // Theme-specific screen transition (ripple, glitch, moonlight bloom, pixel wipe, fog roll)
  let fxT = null;
  function playTransition(th) {
    const el = $('theme-fx'); if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.dataset.fx = th; el.classList.remove('play'); void el.offsetWidth; el.classList.add('play');
    clearTimeout(fxT); fxT = setTimeout(() => el.classList.remove('play'), 1100);
    sfx(th === 'netrunner' ? 'level' : 'quest');
  }
  on('mood', () => { applyTheme(); renderBuff(); });
  on('session', renderBuff);
  on('render', renderBuff);
  ML.settingsSection({
    order: 15,
    render: () => `<h3>${esc(t('set_look'))}</h3>
      <label class="field"><span>${esc(t('theme'))}</span>${ML.ui.sel('set-theme', ['auto', 'sorcerer', 'sanctuary', 'netrunner', 'arcade', 'fog'].map(v => [v, t('th_' + v)]), S.theme)}</label>
      <p class="hint">${esc(t('th_hint'))}</p>
      ${ML.ui.chk('set-nightfog', t('opt_nightfog'), S.nightFog)}
      ${ML.ui.chk('set-sfx', t('opt_sfx'), S.game.sfx)}`,
    bind: r => {
      r.querySelector('#set-theme').onchange = e => { S.theme = e.target.value; save(); applyTheme(); };
      r.querySelector('#set-nightfog').onchange = e => { S.nightFog = e.target.checked; save(); applyTheme(); };
      r.querySelector('#set-sfx').onchange = e => { S.game.sfx = e.target.checked; save(); };
    },
  });

  /* ---------- Background effects per theme ---------- */
  const FX = (() => {
    const cv = $('fx'), cx = cv.getContext('2d');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789ABCDEF<>/{}';
    let W = 0, H = 0, parts = [], fog = [], flies = [], stars = [], drops = [], shoot = null, colors = ['#a678ff', '#3ee8e0'], glitch = 0, raf = null;
    function size() {
      const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      cv.width = W * d; cv.height = H * d; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cx.setTransform(d, 0, 0, d, 0, 0);
      parts = Array.from({ length: Math.round(W * H / 14000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + 0.3, v: Math.random() * 0.25 + 0.05, p: Math.random() * 6.28, c: Math.random() < 0.5 }));
      fog = Array.from({ length: 7 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (0.35 + Math.random() * 0.4) * Math.max(W, H), v: (Math.random() - 0.5) * 0.15, a: 0.04 + Math.random() * 0.05 }));
      flies = Array.from({ length: Math.round(W * H / 26000) + 6 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, p: Math.random() * 6.28, s: 0.6 + Math.random() * 0.8 }));
      stars = Array.from({ length: Math.round(W * H / 9000) }, () => ({ x: Math.floor(Math.random() * W / 4) * 4, y: Math.floor(Math.random() * H / 4) * 4, s: Math.random() < 0.15 ? 4 : 2, p: Math.floor(Math.random() * 8) }));
      drops = Array.from({ length: Math.max(6, Math.round(W / 70)) }, () => ({ x: Math.floor(Math.random() * W / 14) * 14, y: Math.random() * H, v: 0.6 + Math.random() * 1.4, n: 4 + Math.floor(Math.random() * 10) }));
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
    function draw(tm) {
      const th = document.documentElement.dataset.theme || 'sorcerer';
      cx.clearRect(0, 0, W, H);
      if (th === 'fog') {
        glow(W * 0.85, H * 0.08, Math.max(W, H) * 0.35, 'rgba(196,56,74,0.9)', 0.14);
        for (const f of fog) {
          if (!still) { f.x += f.v; if (f.x - f.r > W) f.x = -f.r; if (f.x + f.r < 0) f.x = W + f.r; }
          glow(f.x, f.y, f.r, 'rgba(170,170,180,1)', f.a);
        }
      } else if (th === 'sanctuary') {
        // Moonlight and fireflies that wander slowly
        glow(W * 0.12, H * 0.06, Math.max(W, H) * 0.4, 'rgba(160,200,255,1)', 0.08);
        for (const f of flies) {
          if (!still) {
            f.vx = (f.vx + (Math.random() - 0.5) * 0.06) * 0.97; f.vy = (f.vy + (Math.random() - 0.5) * 0.06 - 0.002) * 0.97;
            f.x += f.vx * f.s; f.y += f.vy * f.s;
            if (f.x < -10) f.x = W + 10; if (f.x > W + 10) f.x = -10; if (f.y < -10) f.y = H + 10; if (f.y > H + 10) f.y = -10;
          }
          const pulse = still ? 0.6 : 0.35 + 0.65 * Math.pow((Math.sin(tm / 900 * f.s + f.p) + 1) / 2, 3);
          glow(f.x, f.y, 9 * f.s, colors[0], 0.35 * pulse);
          cx.globalAlpha = 0.9 * pulse; cx.fillStyle = colors[0]; cx.fillRect(f.x - 1, f.y - 1, 2, 2); cx.globalAlpha = 1;
        }
      } else if (th === 'arcade') {
        // Pixel starfield that twinkles in steps, plus the odd shooting pixel
        const step = still ? 0 : Math.floor(tm / 220);
        for (const s of stars) {
          const ph = (step + s.p) % 8, a = ph < 4 ? [0.15, 0.35, 0.6, 0.35][ph] : 0.15;
          cx.globalAlpha = a; cx.fillStyle = s.s === 4 ? colors[0] : '#fff3d6'; cx.fillRect(s.x, s.y, s.s, s.s);
        }
        cx.globalAlpha = 1;
        if (!still) {
          if (!shoot && Math.random() < 0.004) shoot = { x: Math.random() * W * 0.6, y: Math.random() * H * 0.3, n: 0 };
          if (shoot) {
            for (let i = 0; i < 6; i++) { cx.globalAlpha = 1 - i / 6; cx.fillStyle = i ? colors[1] : '#fff'; cx.fillRect(Math.floor((shoot.x - i * 8) / 4) * 4, Math.floor((shoot.y - i * 4) / 4) * 4, 4, 4); }
            cx.globalAlpha = 1; shoot.x += 8; shoot.y += 4; if (++shoot.n > 70) shoot = null;
          }
        }
      } else {
        const square = th === 'netrunner';
        if (square) {
          // Sparse data rain behind everything
          cx.font = '12px "JetBrains Mono", monospace';
          for (const d of drops) {
            if (!still) { d.y += d.v; if (d.y - d.n * 14 > H) { d.y = -10; d.x = Math.floor(Math.random() * W / 14) * 14; } }
            for (let i = 0; i < d.n; i++) {
              cx.globalAlpha = (1 - i / d.n) * (i === 0 ? 0.5 : 0.14);
              cx.fillStyle = i === 0 ? '#dcf8ff' : colors[0];
              cx.fillText(GLYPHS[(Math.floor(d.y / 14) + i * 7 + d.x) % GLYPHS.length], d.x, d.y - i * 14);
            }
          }
          cx.globalAlpha = 1;
        }
        for (const q of parts) {
          if (!still) { q.y -= q.v * (square ? 1.6 : 1); if (q.y < -4) { q.y = H + 4; q.x = Math.random() * W; } }
          cx.globalAlpha = 0.15 + 0.35 * (still ? 0.5 : (Math.sin(tm / 1300 + q.p) + 1) / 2);
          cx.fillStyle = q.c ? colors[0] : colors[1];
          if (square) cx.fillRect(q.x, q.y, q.r * 1.6, q.r * 1.6);
          else { cx.beginPath(); cx.arc(q.x + Math.sin(tm / 3000 + q.p) * 6, q.y, q.r, 0, 6.29); cx.fill(); }
        }
        cx.globalAlpha = 1;
        if (square && !still) {
          if (Math.random() < 0.006) glitch = 6;
          if (glitch > 0) { glitch--; cx.fillStyle = colors[Math.random() < 0.5 ? 0 : 1]; cx.globalAlpha = 0.12; cx.fillRect(0, Math.random() * H, W, 1 + Math.random() * 3); cx.globalAlpha = 1; }
        }
      }
      if (!still) raf = requestAnimationFrame(draw);
    }
    addEventListener('resize', () => { size(); if (still) draw(0); });
    size();
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

