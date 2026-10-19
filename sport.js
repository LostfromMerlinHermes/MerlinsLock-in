// Sport section (v2): profile + adaptive weekly plan, guided follow-along and set logging, calisthenics
// skill tree, an RPG character (muscle levels, attribute radar, body map), stats, interval timer,
// cardio log, history/records and body tracking. Data (exercises, skills, icons) lives in sport-data.js.
(() => {
  'use strict';
  const { $, S, t, tn, esc, save, on, emit, toast, uid, today, dayKey, parseDay, addDays, fmtMins, clamp } = ML;
  const D = ML.SportData, LIB = D.LIB, ic = D.icon;
  const fmtClock = MiniView.fmtClock;

  ML.addStrings({
    fr: {
      sec_work: 'Travail', sec_sport: 'Sport',
      sp_today: 'Aujourd’hui', sp_skills: 'Skills', sp_stats: 'Stats', sp_timer: 'Chrono', sp_history: 'Historique', sp_body: 'Corps',
      en_recovery: 'Récup', en_normal: 'Normal', en_beast: 'Beast mode',
      en_line_recovery: 'Récupération : séance mobilité ou cardio léger, volume réduit.', en_line_normal: 'Forme normale : ta séance du plan.', en_line_beast: 'Beast mode : +1 série sur chaque exercice.',
      sp_goal: 'Objectif de la semaine', sp_goal_line: '{s}/{gs} séances · {m}/{gm}', sp_week_streak_one: '{n} semaine d’affilée', sp_week_streak: '{n} semaines d’affilée',
      // profile
      pf_title: 'Ton profil sportif', pf_intro: 'MerlinsLockIN construit ton plan selon ton objectif, ton matériel, ton niveau et tes points faibles.',
      pf_goal: 'Objectif', g_strength: 'Force', g_muscle: 'Prise de muscle', g_endurance: 'Endurance', g_calisthenics: 'Skills de calisthénie', g_weightloss: 'Perte de poids', g_general: 'Forme générale',
      pf_level: 'Niveau', lv_1: 'Débutant', lv_2: 'Intermédiaire', lv_3: 'Avancé',
      pf_equip: 'Matériel disponible', eq_none: 'Poids du corps', eq_bar: 'Barre de traction', eq_dip: 'Barres à dips', eq_rings: 'Anneaux', eq_db: 'Haltères / kettlebell', eq_band: 'Élastiques', eq_gym: 'Salle (barres, machines)',
      pf_days: 'Séances par semaine', pf_length: 'Durée d’une séance', pf_weak: 'Points faibles à renforcer', pf_weak_hint: 'Le plan ajoute du volume sur ces muscles.',
      pf_save: 'Créer mon plan', pf_edit: 'Modifier mon profil', pf_saved: 'Plan mis à jour',
      // muscles & attributes
      m_chest: 'Pectoraux', m_back: 'Dos', m_shoulders: 'Épaules', m_biceps: 'Biceps', m_triceps: 'Triceps', m_forearms: 'Avant-bras', m_core: 'Abdos', m_lowback: 'Lombaires', m_glutes: 'Fessiers', m_quads: 'Quadriceps', m_hamstrings: 'Ischios', m_calves: 'Mollets',
      a_STR: 'Force', a_END: 'Endurance', a_AGI: 'Explosivité', a_MOB: 'Mobilité', a_SKL: 'Technique',
      ab_STR: 'FOR', ab_END: 'END', ab_AGI: 'EXP', ab_MOB: 'MOB', ab_SKL: 'TEC',
      cl_STR: 'Colosse', cl_END: 'Marathonien', cl_AGI: 'Duelliste', cl_MOB: 'Moine', cl_SKL: 'Acrobate', cl_none: 'Recrue',
      // today
      td_session: 'Séance {n} du plan · semaine {w}', td_deload: 'Semaine de décharge : volume réduit', td_guided: 'Séance guidée', td_log: 'Mode carnet', td_recovery: 'Mobilité du jour',
      td_quick: 'Séance express à la maison', td_quick_hint: 'Sans matériel, en circuit (40 s d’effort, 20 s de repos).', td_mins: '{n} min', td_cardio: 'Activité cardio ou sport', td_free: 'Séance libre', td_change_plan: 'Mon plan', td_week_plan: 'Ton plan de la semaine',
      sp_ex_n_one: '{n} exercice', sp_ex_n: '{n} exercices', sp_est: '~{n} min',
      // guided / log
      gd_set: 'Série {s}/{n}', gd_target: 'Objectif', gd_done: 'Fait', gd_start_hold: 'Lancer le maintien', gd_next: 'Ensuite : {name}', gd_rest: 'Repos', gd_skip: 'Passer', gd_finish_h: 'Séance terminée !', gd_quit: 'Quitter',
      gd_round: 'Tour {r}/{n}', gd_go: 'C’est parti', gd_kg: 'Lest (kg)',
      sp_elapsed: 'Durée', sp_volume: 'Volume', sp_sets_done: 'Séries', sp_add_set: '+ Série', sp_add_ex: 'Ajouter', sp_ex_search: 'Chercher un exercice', sp_last: 'Dernière fois : {s}',
      sp_finish: 'Terminer la séance', sp_cancel: 'Abandonner', sp_saved: 'Séance enregistrée. +{xp} XP', sp_new_pr: 'Nouveau record : {ex} · {set}', sp_rpe: 'Effort ressenti', sp_notes_ph: 'Notes (sensations, douleurs, idées…)',
      sp_rest_len: 'Repos entre séries', sp_rest: 'Repos', sp_rest_skip: 'Passer', sp_reps: 'rép.', sp_sec: 's', sp_kg: 'kg', sp_remove: 'Retirer',
      sp_logged: 'Activité enregistrée. +{xp} XP', sp_activity: 'Activité', sp_duration: 'Durée (min)', sp_distance: 'Distance (km)', sp_log: 'Enregistrer l’activité',
      skill_up: 'Skill débloqué : {name}', sk_next: 'Prochain palier', sk_train: 'S’entraîner', sk_done: 'Maîtrisé', sk_need: '{v}', sk_best: 'Ton meilleur : {v}',
      // stats
      st_character: 'Ton personnage', st_level: 'Niveau {n}', st_levels: 'Niveaux', st_week: 'Cette semaine', st_muscles: 'Groupes musculaires', st_sets_wk: '{n} séries/sem.',
      st_progress: 'Progression', st_pick: 'Choisis un exercice', st_consistency: 'Régularité (13 semaines)', st_month: 'Ce mois-ci', st_m_sessions: 'Séances', st_m_time: 'Temps', st_m_volume: 'Volume', st_m_prs: 'Records', st_m_skills: 'Skills', st_empty: 'Fais ta première séance pour réveiller ton personnage.',
      st_records: 'Records', rec_e1rm: '1RM estimé', rec_best: 'Meilleure série', rec_reps: 'Max répétitions', rec_hold: 'Meilleur maintien',
      // timer
      ch_tabata: 'Tabata', ch_emom: 'EMOM', ch_hiit: 'HIIT perso', ch_stopwatch: 'Chrono', ch_countdown: 'Minuteur',
      ch_work: 'Effort', ch_restp: 'Repos', ch_prep: 'Prépare-toi', ch_done: 'Terminé !', ch_round: 'Tour {r}/{n}', ch_rounds: 'Tours', ch_work_s: 'Effort (s)', ch_rest_s: 'Repos (s)', ch_minutes: 'Minutes',
      ch_start: 'Go', ch_pause: 'Pause', ch_resume: 'Reprendre', ch_reset: 'Reset', ch_lap: 'Tour', ch_music: 'Musique d’entraînement', ch_voice: 'Annonces vocales', ch_total: 'Total {t}',
      ch_logged: 'Entraînement {name} enregistré. +{xp} XP', ch_go: 'C’est parti', ch_rest_say: 'Repos',
      // history & body
      hi_week: '7 derniers jours', hi_empty: 'Pas encore de séance.', hi_delete: 'Supprimer', hi_deleted: 'Séance supprimée',
      bd_weight: 'Poids', bd_weight_ph: 'kg', bd_add: 'Ajouter', bd_water: 'Eau aujourd’hui', bd_water_goal: 'objectif {n} verres', bd_sleep: 'Sommeil la nuit dernière', bd_hours: 'h',
      bd_goal_set: 'Objectif hebdo', bd_goal_s: 'Séances', bd_goal_m: 'Minutes', bd_saved: 'Enregistré', bd_profile: 'Profil et plan',
      ty_strength: 'Muscu', ty_calisthenics: 'Calisthénie', ty_cardio: 'Cardio', ty_hiit: 'HIIT', ty_sport: 'Sport', ty_mobility: 'Mobilité', ty_home: 'Maison',
      ac_run: 'Course', ac_bike: 'Vélo', ac_swim: 'Natation', ac_walk: 'Marche', ac_football: 'Football', ac_basket: 'Basket', ac_tennis: 'Tennis', ac_boxing: 'Boxe', ac_climb: 'Escalade', ac_yoga: 'Yoga', ac_dance: 'Danse', ac_other: 'Autre',
      dk_fbA: 'Full body A', dk_fbB: 'Full body B', dk_upper: 'Haut du corps', dk_lower: 'Bas du corps', dk_push: 'Push', dk_pull: 'Pull', dk_legs: 'Jambes', dk_skills: 'Skills', dk_mobility: 'Mobilité', dk_quick: 'Express maison',
    },
    en: {
      sec_work: 'Work', sec_sport: 'Sport',
      sp_today: 'Today', sp_skills: 'Skills', sp_stats: 'Stats', sp_timer: 'Timer', sp_history: 'History', sp_body: 'Body',
      en_recovery: 'Recovery', en_normal: 'Normal', en_beast: 'Beast mode',
      en_line_recovery: 'Recovery: mobility or light cardio, lower volume.', en_line_normal: 'Normal shape: your planned session.', en_line_beast: 'Beast mode: +1 set on every exercise.',
      sp_goal: 'Weekly goal', sp_goal_line: '{s}/{gs} sessions · {m}/{gm}', sp_week_streak_one: '{n} week in a row', sp_week_streak: '{n} weeks in a row',
      pf_title: 'Your sport profile', pf_intro: 'MerlinsLockIN builds your plan from your goal, equipment, level and weak points.',
      pf_goal: 'Goal', g_strength: 'Strength', g_muscle: 'Build muscle', g_endurance: 'Endurance', g_calisthenics: 'Calisthenics skills', g_weightloss: 'Lose weight', g_general: 'General fitness',
      pf_level: 'Level', lv_1: 'Beginner', lv_2: 'Intermediate', lv_3: 'Advanced',
      pf_equip: 'Available equipment', eq_none: 'Bodyweight', eq_bar: 'Pull-up bar', eq_dip: 'Dip bars', eq_rings: 'Rings', eq_db: 'Dumbbells / kettlebell', eq_band: 'Resistance bands', eq_gym: 'Gym (barbells, machines)',
      pf_days: 'Sessions per week', pf_length: 'Session length', pf_weak: 'Weak points to work on', pf_weak_hint: 'The plan adds volume for these muscles.',
      pf_save: 'Build my plan', pf_edit: 'Edit my profile', pf_saved: 'Plan updated',
      m_chest: 'Chest', m_back: 'Back', m_shoulders: 'Shoulders', m_biceps: 'Biceps', m_triceps: 'Triceps', m_forearms: 'Forearms', m_core: 'Abs', m_lowback: 'Lower back', m_glutes: 'Glutes', m_quads: 'Quads', m_hamstrings: 'Hamstrings', m_calves: 'Calves',
      a_STR: 'Strength', a_END: 'Endurance', a_AGI: 'Power', a_MOB: 'Mobility', a_SKL: 'Skill',
      ab_STR: 'STR', ab_END: 'END', ab_AGI: 'PWR', ab_MOB: 'MOB', ab_SKL: 'SKL',
      cl_STR: 'Juggernaut', cl_END: 'Pathfinder', cl_AGI: 'Striker', cl_MOB: 'Monk', cl_SKL: 'Acrobat', cl_none: 'Recruit',
      td_session: 'Plan session {n} · week {w}', td_deload: 'Deload week: lighter volume', td_guided: 'Guided session', td_log: 'Log mode', td_recovery: "Today's mobility",
      td_quick: 'Quick home workout', td_quick_hint: 'No equipment, circuit style (40 s work, 20 s rest).', td_mins: '{n} min', td_cardio: 'Cardio or sport activity', td_free: 'Free workout', td_change_plan: 'My plan', td_week_plan: 'Your plan this week',
      sp_ex_n_one: '{n} exercise', sp_ex_n: '{n} exercises', sp_est: '~{n} min',
      gd_set: 'Set {s}/{n}', gd_target: 'Target', gd_done: 'Done', gd_start_hold: 'Start the hold', gd_next: 'Next: {name}', gd_rest: 'Rest', gd_skip: 'Skip', gd_finish_h: 'Workout complete!', gd_quit: 'Quit',
      gd_round: 'Round {r}/{n}', gd_go: 'Go', gd_kg: 'Added weight (kg)',
      sp_elapsed: 'Time', sp_volume: 'Volume', sp_sets_done: 'Sets', sp_add_set: '+ Set', sp_add_ex: 'Add', sp_ex_search: 'Search an exercise', sp_last: 'Last time: {s}',
      sp_finish: 'Finish workout', sp_cancel: 'Discard', sp_saved: 'Workout saved. +{xp} XP', sp_new_pr: 'New record: {ex} · {set}', sp_rpe: 'Perceived effort', sp_notes_ph: 'Notes (how it felt, pain, ideas…)',
      sp_rest_len: 'Rest between sets', sp_rest: 'Rest', sp_rest_skip: 'Skip', sp_reps: 'reps', sp_sec: 's', sp_kg: 'kg', sp_remove: 'Remove',
      sp_logged: 'Activity saved. +{xp} XP', sp_activity: 'Activity', sp_duration: 'Duration (min)', sp_distance: 'Distance (km)', sp_log: 'Save activity',
      skill_up: 'Skill unlocked: {name}', sk_next: 'Next milestone', sk_train: 'Train', sk_done: 'Mastered', sk_need: '{v}', sk_best: 'Your best: {v}',
      st_character: 'Your character', st_level: 'Level {n}', st_levels: 'Levels', st_week: 'This week', st_muscles: 'Muscle groups', st_sets_wk: '{n} sets/wk',
      st_progress: 'Progress', st_pick: 'Pick an exercise', st_consistency: 'Consistency (13 weeks)', st_month: 'This month', st_m_sessions: 'Sessions', st_m_time: 'Time', st_m_volume: 'Volume', st_m_prs: 'Records', st_m_skills: 'Skills', st_empty: 'Do your first workout to wake your character up.',
      st_records: 'Records', rec_e1rm: 'Estimated 1RM', rec_best: 'Best set', rec_reps: 'Max reps', rec_hold: 'Best hold',
      ch_tabata: 'Tabata', ch_emom: 'EMOM', ch_hiit: 'Custom HIIT', ch_stopwatch: 'Stopwatch', ch_countdown: 'Countdown',
      ch_work: 'Work', ch_restp: 'Rest', ch_prep: 'Get ready', ch_done: 'Done!', ch_round: 'Round {r}/{n}', ch_rounds: 'Rounds', ch_work_s: 'Work (s)', ch_rest_s: 'Rest (s)', ch_minutes: 'Minutes',
      ch_start: 'Go', ch_pause: 'Pause', ch_resume: 'Resume', ch_reset: 'Reset', ch_lap: 'Lap', ch_music: 'Workout music', ch_voice: 'Voice cues', ch_total: 'Total {t}',
      ch_logged: '{name} workout saved. +{xp} XP', ch_go: 'Go', ch_rest_say: 'Rest',
      hi_week: 'Last 7 days', hi_empty: 'No workouts yet.', hi_delete: 'Delete', hi_deleted: 'Workout deleted',
      bd_weight: 'Weight', bd_weight_ph: 'kg', bd_add: 'Add', bd_water: 'Water today', bd_water_goal: 'goal {n} glasses', bd_sleep: 'Sleep last night', bd_hours: 'h',
      bd_goal_set: 'Weekly goal', bd_goal_s: 'Sessions', bd_goal_m: 'Minutes', bd_saved: 'Saved', bd_profile: 'Profile and plan',
      ty_strength: 'Strength', ty_calisthenics: 'Calisthenics', ty_cardio: 'Cardio', ty_hiit: 'HIIT', ty_sport: 'Sport', ty_mobility: 'Mobility', ty_home: 'Home',
      ac_run: 'Running', ac_bike: 'Cycling', ac_swim: 'Swimming', ac_walk: 'Walking', ac_football: 'Football', ac_basket: 'Basketball', ac_tennis: 'Tennis', ac_boxing: 'Boxing', ac_climb: 'Climbing', ac_yoga: 'Yoga', ac_dance: 'Dance', ac_other: 'Other',
      dk_fbA: 'Full body A', dk_fbB: 'Full body B', dk_upper: 'Upper body', dk_lower: 'Lower body', dk_push: 'Push', dk_pull: 'Pull', dk_legs: 'Legs', dk_skills: 'Skills', dk_mobility: 'Mobility', dk_quick: 'Quick home',
    },
  });

  const ACTIVITIES = ['run', 'bike', 'swim', 'walk', 'football', 'basket', 'tennis', 'boxing', 'climb', 'yoga', 'dance', 'other'];
  const GOALS = ['strength', 'muscle', 'endurance', 'calisthenics', 'weightloss', 'general'];
  const TABS = [['today', 'flame'], ['skills', 'tree'], ['stats', 'chart'], ['timer', 'timer'], ['history', 'list'], ['body', 'scale']];

  ML.defaults(() => ({
    section: 'work',
    sport: {
      tab: 'today', energy: 'normal', energyDay: null, rest: 90, goal: { sessions: 3, mins: 150 },
      profile: null, plan: { start: null, idx: 0 }, statsMode: 'level', progressEx: null,
      workouts: [], active: null, prs: {}, body: [], water: { day: null, n: 0 }, waterGoal: 8, sleep: {},
      chrono: { mode: 'tabata', work: 20, rest: 10, rounds: 8, emom: 10, countdown: 10, music: false, voice: true },
    },
  }));
  const SP = () => S.sport;
  const fr = () => (S.lang || ((navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en')) !== 'en';
  const exName = id => (LIB[id] ? (fr() ? LIB[id].fr : LIB[id].en) : id);
  const exCue = id => (LIB[id] ? (fr() ? LIB[id].cueFr : LIB[id].cueEn) : '');
  const BY_NAME = {};
  Object.values(LIB).forEach(e => { BY_NAME[e.fr.toLowerCase()] = e.id; BY_NAME[e.en.toLowerCase()] = e.id; });
  const idOf = e => e.exId || BY_NAME[String(e.name || '').toLowerCase()] || null;
  const unitOf = e => { const x = LIB[idOf(e)]; return e.unit === 'sec' || (x && x.kind !== 'reps') ? 'sec' : 'reps'; };
  const val = (s, unit) => unit === 'sec' ? +(s.sec != null ? s.sec : s.reps) || 0 : +s.reps || 0;

  /* ---------- Section switch ---------- */
  function applySection() {
    const sport = S.section === 'sport';
    $('work-root').hidden = sport; $('sport-root').hidden = !sport;
    $('sec-work').setAttribute('aria-pressed', !sport); $('sec-sport').setAttribute('aria-pressed', sport);
    document.documentElement.dataset.section = S.section;
    if (ML.applyTheme) ML.applyTheme();
    if (sport) render();
  }
  function setSection(sec) { if (S.section === sec) return; S.section = sec; save(); applySection(); emit('section', sec); window.scrollTo({ top: 0 }); }
  $('sec-work').onclick = () => setSection('work');
  $('sec-sport').onclick = () => setSection('sport');
  ML.setSection = setSection;

  /* ---------- Beeps, voice, vibration ---------- */
  let bctx = null;
  function beepCtx() { try { bctx = bctx || new (window.AudioContext || window.webkitAudioContext)(); if (bctx.state !== 'running') { const p = bctx.resume(); if (p && p.catch) p.catch(() => {}); } } catch (e) { bctx = null; } return bctx; }
  function beep(f = 880, dur = 0.12, vol = 0.25) {
    const c = beepCtx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime;
    o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0005, t0 + dur);
    o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function say(text) { if (!SP().chrono.voice || !('speechSynthesis' in window)) return; try { const u = new SpeechSynthesisUtterance(text); u.lang = ML.locale(); u.rate = 1.05; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }
  const buzz = ms => { try { if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  /* ---------- Shared helpers ---------- */
  const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayKey(d); };
  const inThisWeek = ts => dayKey(new Date(ts)) >= weekStart();
  const e1rm = (kg, reps) => (kg > 0 && reps > 0 ? kg * (1 + reps / 30) : 0);
  const setLabel = (s, unit) => unit === 'sec' ? `${val(s, 'sec')} ${t('sp_sec')}${+s.kg ? ' +' + s.kg + ' ' + t('sp_kg') : ''}` : (+s.kg ? `${s.kg} ${t('sp_kg')} × ${s.reps}` : `${s.reps} ${t('sp_reps')}`);
  const volumeOf = exs => (exs || []).reduce((a, e) => a + (unitOf(e) === 'sec' ? 0 : e.sets.filter(s => s.done).reduce((b, s) => b + (+s.kg || 0) * (+s.reps || 0), 0)), 0);
  const setsDone = exs => (exs || []).reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  function lastPerf(id) {
    for (let i = SP().workouts.length - 1; i >= 0; i--) {
      const e = (SP().workouts[i].exercises || []).find(x => idOf(x) === id);
      if (e) { const done = e.sets.filter(s => s.done); if (done.length) return { e, done }; }
    }
    return null;
  }
  const eqOK = (ex, prof) => ex.eq === 'none' || (prof && prof.equip.includes(ex.eq));
  const weekStats = () => { const ws = SP().workouts.filter(w => inThisWeek(w.at)); return { n: ws.length, mins: ws.reduce((a, w) => a + w.mins, 0) }; };
  function weekStreak() {
    let n = 0; const G = SP().goal;
    for (let k = 1; k < 60; k++) {
      const end = addDays(weekStart(), -7 * (k - 1)), start = addDays(end, -7);
      const ws = SP().workouts.filter(w => { const d = dayKey(new Date(w.at)); return d >= start && d < end; });
      if (ws.length >= G.sessions || ws.reduce((a, w) => a + w.mins, 0) >= G.mins) n++; else break;
    }
    const cur = weekStats();
    return n + (cur.n >= G.sessions || cur.mins >= G.mins ? 1 : 0);
  }

  /* ---------- Best performances (records + skill tree) ---------- */
  function bests() {
    const B = {};
    SP().workouts.forEach(w => (w.exercises || []).forEach(e => {
      const id = idOf(e); if (!id) return;
      const u = unitOf(e), b = B[id] || (B[id] = { reps: 0, sec: 0, kg: 0, e1rm: 0 });
      e.sets.filter(s => s.done).forEach(s => {
        if (u === 'sec') b.sec = Math.max(b.sec, val(s, 'sec'));
        else { if (!(+s.kg > 0)) b.reps = Math.max(b.reps, +s.reps || 0); b.e1rm = Math.max(b.e1rm, e1rm(+s.kg, +s.reps)); } // max reps = bodyweight reps only
        if (+s.kg && (+s.reps || val(s, 'sec'))) b.kg = Math.max(b.kg, +s.kg);
      });
    }));
    return B;
  }
  const meets = (b, kind, v) => !!b && (kind === 'reps' ? b.reps >= v : kind === 'hold' ? b.sec >= v : b.kg >= v);
  function skillState(B = bests()) {
    const out = {};
    for (const [k, br] of Object.entries(D.TREE)) {
      // Reaching a harder step also validates every easier step before it in the branch
      let last = -1;
      br.steps.forEach(([id, kind, v], i) => { if (meets(B[id], kind, v)) last = i; });
      out[k] = last + 1; // index of the next step to unlock (= number of steps done)
    }
    return out;
  }
  const stepLabel = ([id, kind, v]) => exName(id) + ' · ' + (kind === 'reps' ? v + ' ' + t('sp_reps') : kind === 'hold' ? v + ' ' + t('sp_sec') : '+' + v + ' ' + t('sp_kg'));

  /* ---------- Character: muscle XP, attributes ---------- */
  const lvl = xp => Math.floor(Math.sqrt(Math.max(0, xp) / 40)) + 1;
  function character(sinceTs = 0) {
    const mus = {}, attr = {}, sets = {};
    D.MUSCLES.forEach(m => { mus[m] = 0; sets[m] = 0; }); D.ATTRS.forEach(a => { attr[a] = 0; });
    const weekAgo = Date.now() - 7 * 864e5;
    SP().workouts.forEach(w => {
      if (w.at < sinceTs) return;
      const ex = w.exercises || [];
      if (!ex.length) {
        const x = w.mins * 3;
        attr[w.type === 'hiit' ? 'AGI' : w.type === 'mobility' ? 'MOB' : 'END'] += x;
        if (w.type === 'hiit') attr.END += x * 0.5;
        if (['run', 'bike', 'walk'].includes(w.activity)) { mus.quads += w.mins; mus.calves += w.mins; mus.hamstrings += w.mins * 0.5; }
        if (w.activity === 'swim') { mus.back += w.mins; mus.shoulders += w.mins; }
        if (w.activity === 'boxing') { mus.shoulders += w.mins; mus.core += w.mins * 0.5; }
        return;
      }
      ex.forEach(e => {
        const x = LIB[idOf(e)]; if (!x) return;
        const u = unitOf(e);
        e.sets.filter(s => s.done).forEach(s => {
          let base = u === 'sec' ? val(s, 'sec') / 3 : (+s.reps || 0);
          if (+s.kg) base += (+s.kg) * (u === 'sec' ? 1 : (+s.reps || 1)) / 15;
          base *= 0.75 + x.level * 0.25;
          x.primary.forEach(m => { mus[m] += base; if (w.at >= weekAgo) sets[m] += 1; });
          x.secondary.forEach(m => { mus[m] += base * 0.5; if (w.at >= weekAgo) sets[m] += 0.5; });
          attr[x.attr] += base;
          if (u !== 'sec' && +s.reps > 15) attr.END += base * 0.3;
          if (+s.kg) attr.STR += base * 0.3;
        });
      });
    });
    const top = Object.entries(attr).sort((a, b) => b[1] - a[1])[0];
    const total = Object.values(attr).reduce((a, b) => a + b, 0);
    return { mus, attr, sets, cls: total > 0 ? top[0] : 'none', level: lvl(total / 3) };
  }

  /* ---------- Adaptive plan generator ---------- */
  const MAX_LVL = { 1: 2, 2: 3, 3: 5 };
  const SPLITS = { 2: ['fbA', 'fbB'], 3: ['fbA', 'fbB', 'fbA'], 4: ['upper', 'lower', 'upper', 'lower'], 5: ['push', 'pull', 'legs', 'upper', 'lower'], 6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'] };
  const SKILL_SPLITS = { 2: ['fbA', 'skills'], 3: ['fbA', 'skills', 'fbB'], 4: ['upper', 'skills', 'lower', 'skills'], 5: ['push', 'pull', 'skills', 'legs', 'skills'], 6: ['push', 'pull', 'legs', 'skills', 'upper', 'skills'] };
  const DAYS = {
    fbA: ['squat', 'hpush', 'hpull', 'hinge', 'vpush', 'core'], fbB: ['single', 'vpull', 'dip', 'hinge', 'core', 'shoulder'],
    upper: ['hpush', 'vpull', 'vpush', 'hpull', 'biceps', 'triceps', 'core'], lower: ['squat', 'hinge', 'single', 'hamstring', 'calves', 'core'],
    push: ['hpush', 'vpush', 'dip', 'shoulder', 'triceps', 'core'], pull: ['vpull', 'hpull', 'rear', 'biceps', 'grip', 'core'],
    legs: ['squat', 'hinge', 'single', 'hamstring', 'calves', 'core'], skills: ['skillA', 'skillB', 'handstand', 'core', 'vpull'],
    mobility: ['mobility', 'mobility', 'mobility', 'mobility', 'core'],
  };
  const PREF_ATTR = { strength: 'STR', muscle: 'STR', endurance: 'END', calisthenics: 'SKL', weightloss: 'END', general: 'END' };
  const SIZE = { 15: 3, 30: 5, 45: 6, 60: 7 };
  function candidates(pattern, prof, used) {
    const max = MAX_LVL[prof.level] || 2, pref = PREF_ATTR[prof.goal];
    return Object.values(LIB).filter(x => x.pattern === pattern && eqOK(x, prof) && x.level <= max && !used.has(x.id) && (pattern === 'mobility' || x.kind !== 'time'))
      .sort((a, b) => (b.level - a.level) || ((b.attr === pref) - (a.attr === pref)) || (b.weighted - a.weighted));
  }
  function prescribe(x, prof, weekIdx, energy) {
    const deload = weekIdx % 4 === 3, bump = deload ? 0 : weekIdx % 4;
    let sets, target, unit;
    if (x.kind !== 'reps') {
      unit = 'sec'; sets = 3;
      target = (x.pattern === 'skill' || x.pattern === 'handstand' ? 10 : x.pattern === 'mobility' ? 45 : 30) + bump * (x.pattern === 'skill' ? 2 : 5);
    } else {
      unit = 'reps';
      [sets, target] = ({ strength: [4, 5], muscle: [4, 10], endurance: [3, 15], calisthenics: [4, 6], weightloss: [3, 12], general: [3, 10] })[prof.goal] || [3, 10];
      if (x.level >= 4 && x.pattern !== 'core') target = Math.min(target, 5);
      if (x.pattern === 'core' || x.pattern === 'calves') target = Math.max(target, 12);
      if (['biceps', 'triceps', 'shoulder', 'rear'].includes(x.pattern)) { target = Math.max(target, 10); sets = Math.min(sets, 3); } // isolation work stays in the 10–12 range
      target += bump;
    }
    if (deload) sets = Math.max(2, sets - 1);
    if (energy === 'beast') sets += 1;
    if (energy === 'recovery') sets = Math.max(2, sets - 1);
    return { sets, target, unit };
  }
  function planInfo() {
    const P = SP().profile; if (!P) return null;
    const split = (P.goal === 'calisthenics' ? SKILL_SPLITS : SPLITS)[P.days] || SPLITS[3];
    const start = SP().plan.start || today();
    const weekIdx = Math.max(0, Math.floor((parseDay(today()) - parseDay(start)) / (7 * 864e5)));
    return { split, weekIdx, deload: weekIdx % 4 === 3 };
  }
  // One planned session: picks exercises per movement pattern for this person's equipment and level,
  // adds extra work for their weak points, then trims to the session length.
  function buildSession(key, energy = SP().energy) {
    const P = SP().profile, info = planInfo(); if (!P) return null;
    const used = new Set(), list = [], variant = SP().plan.idx;
    const sk = skillState();
    const skillExs = () => {
      const branches = ['lever', 'planche', 'pull', 'handstand', 'push', 'core'].filter(b => D.TREE[b]);
      const out = [];
      branches.forEach(b => { const st = D.TREE[b].steps[Math.min(sk[b], D.TREE[b].steps.length - 1)]; const x = LIB[st[0]]; if (x && eqOK(x, P) && !out.includes(x.id)) out.push(x.id); });
      return out;
    };
    const skills = skillExs();
    (DAYS[key] || DAYS.fbA).forEach((pat, i) => {
      let x = null;
      if (pat === 'skillA' || pat === 'skillB') { const id = skills[pat === 'skillA' ? 0 : 1]; x = id && !used.has(id) ? LIB[id] : null; }
      else { const c = candidates(pat, P, used); x = c.length ? c[(variant + i) % Math.min(2, c.length)] : null; }
      if (x) { used.add(x.id); list.push(x); }
    });
    // Weak points: make sure each has an exercise where it's the main muscle
    const weakAdds = [];
    (P.weak || []).forEach(m => {
      if (list.some(x => x.primary[0] === m) || weakAdds.length >= 2) return;
      const c = Object.values(LIB).filter(x => x.primary.includes(m) && eqOK(x, P) && x.level <= (MAX_LVL[P.level] || 2) && !used.has(x.id) && x.kind === 'reps').sort((a, b) => b.level - a.level);
      if (c[0]) { used.add(c[0].id); weakAdds.push(c[0]); }
    });
    const ordered = [...list.slice(0, 2), ...weakAdds, ...list.slice(2)].slice(0, SIZE[P.length] || 5);
    const exs = ordered.map(x => {
      const p = prescribe(x, P, info.weekIdx, energy);
      if ((P.weak || []).some(m => x.primary.includes(m))) p.sets += 1;
      const lp = lastPerf(x.id), lastKg = lp ? +lp.done[0].kg || '' : '';
      return { exId: x.id, name: exName(x.id), unit: p.unit, target: p.target, sets: Array.from({ length: p.sets }, () => ({ reps: p.unit === 'reps' ? p.target : '', sec: p.unit === 'sec' ? p.target : '', kg: x.weighted ? lastKg : '', done: false })) };
    });
    const est = exs.reduce((a, e) => a + e.sets.length * (e.unit === 'sec' ? e.target / 60 + 1.5 : 2.2), 0);
    return { key, title: t('dk_' + key), exercises: exs, est: Math.round(est) };
  }
  function todaySession() {
    const info = planInfo(); if (!info) return null;
    if (SP().energy === 'recovery') return buildSession('mobility');
    return buildSession(info.split[SP().plan.idx % info.split.length]);
  }
  // Quick home circuit: no equipment, timed work/rest, 2–4 rounds
  function quickCircuit(mins) {
    const pats = ['squat', 'hpush', 'core', 'hiit', 'single', 'hinge'], used = new Set(), prof = { equip: [], level: (SP().profile && SP().profile.level) || 1, goal: 'endurance' };
    const exs = pats.map(p => { const c = candidates(p, prof, used).concat(Object.values(LIB).filter(x => x.pattern === p && x.eq === 'none' && !used.has(x.id))); const x = c[0]; if (x) used.add(x.id); return x; }).filter(Boolean);
    const rounds = Math.max(1, Math.round(mins / (exs.length)));
    return { key: 'quick', title: t('dk_quick') + ' · ' + mins + ' min', rounds, circuit: true, exercises: exs.map(x => ({ exId: x.id, name: exName(x.id), unit: 'sec', target: 40, sets: Array.from({ length: rounds }, () => ({ sec: 40, reps: '', kg: '', done: false })) })) };
  }

  /* ---------- Saving workouts ---------- */
  function finishWorkout(w) {
    const before = skillState();
    const B0 = bests();
    const prs = [];
    (w.exercises || []).forEach(e => {
      const id = idOf(e), u = unitOf(e), b = B0[id] || { reps: 0, sec: 0, e1rm: 0, kg: 0 };
      const done = e.sets.filter(s => s.done); if (!done.length || !id) return;
      // Compare like with like: loaded sets by estimated 1RM (kg), bodyweight sets by reps, holds by seconds
      const loaded = u !== 'sec' && done.some(s => +s.kg > 0);
      const pool = loaded ? done.filter(s => +s.kg > 0) : done;
      const score = s => u === 'sec' ? val(s, 'sec') : loaded ? e1rm(+s.kg, +s.reps) : +s.reps || 0;
      const top = pool.reduce((a, c) => (score(c) > score(a) ? c : a));
      const old = u === 'sec' ? b.sec : loaded ? b.e1rm : b.reps;
      if (old > 0 && score(top) > old) prs.push({ ex: exName(id), set: setLabel(top, u) });
    });
    // Time counts up to 2 h, so a workout left open doesn't keep earning XP
    const xp = Math.round(Math.min(w.mins, 120) + setsDone(w.exercises) * 3 + prs.length * 20 + (w.rpe ? w.rpe * 2 : 0));
    w.xp = xp; w.prs = prs;
    SP().workouts.push(w);
    if (SP().workouts.length > 2000) SP().workouts = SP().workouts.slice(-2000);
    ML.addXp(xp); save();
    if (ML.burst) ML.burst(document.documentElement.dataset.theme);
    if (ML.sfx) ML.sfx(prs.length ? 'level' : 'session');
    prs.forEach((p, i) => setTimeout(() => toast(t('sp_new_pr', p)), 400 + i * 300));
    const after = skillState();
    Object.keys(after).forEach(k => {
      for (let i = before[k]; i < after[k]; i++) {
        const st = D.TREE[k].steps[i];
        setTimeout(() => { toast(t('skill_up', { name: stepLabel(st) }), { ms: 5000 }); if (ML.showOverlayFx) ML.showOverlayFx(t('sp_skills'), exName(st[0]), stepLabel(st).split(' · ')[1]); }, 900);
      }
    });
    emit('workout', w);
    return xp;
  }

  /* ---------- Active workout (log mode + guided mode) ---------- */
  function startSession(sess, mode) {
    if (!sess) return;
    const A = { id: uid(), mode, key: sess.key, title: sess.title, startedAt: Date.now(), exercises: JSON.parse(JSON.stringify(sess.exercises)), notes: '', rpe: 7, circuit: !!sess.circuit, fromPlan: !!SP().profile && !['quick', 'free', 'skill'].includes(sess.key) && SP().energy !== 'recovery' };
    if (mode === 'guided') {
      A.steps = []; A.pos = 0;
      const restS = sess.circuit ? 20 : SP().rest;
      if (sess.circuit) {
        const rounds = A.exercises[0].sets.length;
        for (let r = 0; r < rounds; r++) A.exercises.forEach((e, ei) => { A.steps.push({ type: 'work', ei, si: r, round: r + 1, rounds }); A.steps.push({ type: 'rest', secs: restS }); });
      } else A.exercises.forEach((e, ei) => e.sets.forEach((s, si) => { A.steps.push({ type: 'work', ei, si }); A.steps.push({ type: 'rest', secs: si === e.sets.length - 1 ? Math.min(150, restS + 30) : restS }); }));
      A.steps.pop();
    }
    SP().active = A; SP().tab = 'today'; save(); beepCtx(); render();
    if (mode === 'guided') say(t('gd_go'));
  }
  let restEnd = null, restTimer = null;
  function startRest() {
    restEnd = Date.now() + SP().rest * 1000; clearInterval(restTimer);
    let lastS = null;
    restTimer = setInterval(() => {
      const left = Math.ceil((restEnd - Date.now()) / 1000), el = $('sp-rest');
      if (el) { el.hidden = false; $('sp-rest-clock').textContent = fmtClock(Math.max(0, left)); $('sp-rest-bar').style.width = (100 * (1 - Math.max(0, left) / SP().rest)).toFixed(1) + '%'; }
      if (left !== lastS && left <= 3 && left > 0) beep(660, 0.08);
      lastS = left;
      if (left <= 0) { stopRest(); beep(990, 0.35); buzz([200, 100, 200]); }
    }, 200);
  }
  function stopRest() { clearInterval(restTimer); restTimer = null; restEnd = null; const el = $('sp-rest'); if (el) el.hidden = true; }

  // Guided step timer (holds, timed work, rests) runs on the wall clock
  let gTimer = null, gEnd = null, gStart = null;
  function guidedTick() {
    const A = SP().active; if (!A || A.mode !== 'guided') { clearInterval(gTimer); return; }
    const step = A.steps[A.pos];
    const left = gEnd ? (gEnd - Date.now()) / 1000 : null;
    const el = $('gd-clock');
    if (el && left != null) el.textContent = fmtClock(Math.max(0, left));
    const bar = $('gd-bar'); if (bar && left != null) bar.style.width = (100 * (1 - Math.max(0, left) / (step.type === 'rest' ? step.secs : stepTarget(A, step)))).toFixed(1) + '%';
    const s = Math.ceil(left || 0);
    if (left != null && s <= 3 && s > 0 && s !== guidedTick.last) beep(660, 0.08);
    guidedTick.last = s;
    if (left != null && left <= 0) {
      gEnd = null;
      if (step.type === 'work') { const set = A.exercises[step.ei].sets[step.si]; set.sec = stepTarget(A, step); set.done = true; }
      beep(990, 0.3); buzz(200); advance();
    }
  }
  const stepTarget = (A, st) => { const e = A.exercises[st.ei], s = e.sets[st.si]; return e.unit === 'sec' ? (+s.sec || e.target || 30) : (+s.reps || e.target || 10); };
  function advance() {
    const A = SP().active; if (!A) return;
    A.pos++; gEnd = null; gStart = null;
    if (A.pos >= A.steps.length) { A.finished = true; save(); clearInterval(gTimer); say(t('gd_finish_h')); render(); return; }
    const st = A.steps[A.pos];
    if (st.type === 'rest') { gEnd = Date.now() + st.secs * 1000; say(t('gd_rest')); }
    else { const e = A.exercises[st.ei]; say(exName(e.exId)); if (A.circuit) { gEnd = Date.now() + stepTarget(A, st) * 1000; } }
    save(); render();
    clearInterval(gTimer); gTimer = setInterval(guidedTick, 200);
  }
  function saveActive() {
    const A = SP().active; if (!A) return;
    stopRest(); clearInterval(gTimer);
    const mins = Math.max(1, Math.round((Date.now() - A.startedAt) / 60000));
    const type = A.circuit ? 'home' : A.key === 'mobility' ? 'mobility' : A.exercises.some(e => LIB[idOf(e)] && ['gym', 'db'].includes(LIB[idOf(e)].eq)) ? 'strength' : 'calisthenics';
    const w = { id: A.id, at: Date.now(), start: A.startedAt, type, title: A.title, planKey: A.key, mins, exercises: A.exercises.map(e => ({ exId: e.exId || idOf(e), name: e.name, unit: e.unit, sets: e.sets })), notes: A.notes, rpe: A.rpe || 7 };
    if (A.fromPlan) SP().plan.idx++;
    SP().active = null;
    const xp = finishWorkout(w);
    toast(t('sp_saved', { xp })); render();
  }

  /* ---------- Interval timer ---------- */
  let ch = { running: false, t0: 0, pausedAt: 0, paused: 0, phases: [], laps: [], lastIdx: -1, lastSec: null, iv: null, done: false };
  function buildPhases() {
    const C = SP().chrono, P = [], prep = { kind: 'prep', dur: 10 };
    if (C.mode === 'tabata') { P.push(prep); for (let r = 1; r <= 8; r++) { P.push({ kind: 'work', dur: 20, r, n: 8 }); if (r < 8) P.push({ kind: 'rest', dur: 10, r, n: 8 }); } }
    if (C.mode === 'hiit') { P.push(prep); for (let r = 1; r <= C.rounds; r++) { P.push({ kind: 'work', dur: C.work, r, n: C.rounds }); if (r < C.rounds) P.push({ kind: 'rest', dur: C.rest, r, n: C.rounds }); } }
    if (C.mode === 'emom') { P.push(prep); for (let r = 1; r <= C.emom; r++) P.push({ kind: 'work', dur: 60, r, n: C.emom }); }
    if (C.mode === 'countdown') P.push({ kind: 'work', dur: C.countdown * 60, r: 1, n: 1 });
    return P;
  }
  const chElapsed = () => !ch.t0 ? 0 : ((ch.running ? Date.now() : ch.pausedAt) - ch.t0 - ch.paused) / 1000;
  function chStart() {
    beepCtx();
    if (ch.running) { ch.running = false; ch.pausedAt = Date.now(); if (SP().chrono.music && ML.Audio) ML.Audio.workout(false); render(); return; }
    if (!ch.t0 || ch.done) ch = Object.assign(ch, { t0: Date.now(), paused: 0, phases: buildPhases(), laps: [], lastIdx: -1, lastSec: null, done: false });
    else ch.paused += Date.now() - ch.pausedAt;
    ch.running = true;
    if (SP().chrono.music && ML.Audio) ML.Audio.workout(true);
    clearInterval(ch.iv); ch.iv = setInterval(chTick, 100); chTick(); render();
  }
  function chReset() { clearInterval(ch.iv); if (ch.running && SP().chrono.music && ML.Audio) ML.Audio.workout(false); ch = { running: false, t0: 0, pausedAt: 0, paused: 0, phases: [], laps: [], lastIdx: -1, lastSec: null, iv: null, done: false }; render(); }
  function chTick() {
    const C = SP().chrono, el = chElapsed();
    if (C.mode === 'stopwatch') { const c = $('ch-clock'); if (c) c.textContent = fmtClock(el) + '.' + Math.floor((el % 1) * 10); return; }
    let acc = 0, idx = -1;
    for (let i = 0; i < ch.phases.length; i++) { if (el < acc + ch.phases[i].dur) { idx = i; break; } acc += ch.phases[i].dur; }
    const total = ch.phases.reduce((a, p) => a + p.dur, 0);
    if (idx === -1) {
      clearInterval(ch.iv); ch.running = false; ch.done = true; beep(990, 0.5); buzz([300, 100, 300]); say(t('ch_done'));
      if (C.music && ML.Audio) ML.Audio.workout(false);
      const mins = Math.max(1, Math.round(total / 60)), name = t('ch_' + C.mode);
      const xp = finishWorkout({ id: uid(), at: Date.now(), start: Date.now() - total * 1000, type: 'hiit', title: name, mins, exercises: [], rpe: C.mode === 'tabata' ? 8 : 7 });
      toast(t('ch_logged', { name, xp })); render(); return;
    }
    const ph = ch.phases[idx], left = acc + ph.dur - el, sec = Math.ceil(left);
    if (idx !== ch.lastIdx) {
      ch.lastIdx = idx;
      if (ph.kind === 'work') { beep(990, 0.3); buzz(150); say(C.mode === 'emom' ? String(ph.r) : t('ch_go')); }
      else if (ph.kind === 'rest') { beep(520, 0.3); say(t('ch_rest_say')); }
      render();
    }
    if (sec !== ch.lastSec && sec <= 3 && sec > 0) beep(660, 0.08);
    ch.lastSec = sec;
    const c = $('ch-clock'); if (c) c.textContent = fmtClock(left);
    const b = $('ch-bar'); if (b) b.style.width = (100 * (1 - left / ph.dur)).toFixed(1) + '%';
    const tt = $('ch-total'); if (tt) tt.textContent = t('ch_total', { t: fmtClock(total - el) });
  }

  /* ---------- SVG widgets: radar, body map ---------- */
  function radarSvg(attr) {
    const lv = D.ATTRS.map(a => lvl(attr[a])), max = Math.max(5, ...lv), cx = 110, cy = 105, R = 78;
    const pt = (i, f) => { const ang = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + Math.cos(ang) * R * f, cy + Math.sin(ang) * R * f]; };
    let g = '';
    [0.25, 0.5, 0.75, 1].forEach(f => { g += `<polygon class="rd-grid" points="${D.ATTRS.map((_, i) => pt(i, f).join(',')).join(' ')}"/>`; });
    D.ATTRS.forEach((a, i) => { const [x, y] = pt(i, 1), [lx, ly] = pt(i, 1.22); g += `<line class="rd-axis" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/><text class="rd-label" x="${lx}" y="${ly + 4}" text-anchor="middle">${esc(t('ab_' + a))} ${lv[i]}</text>`; });
    g += `<polygon class="rd-val" points="${lv.map((v, i) => pt(i, Math.max(0.06, v / max)).join(',')).join(' ')}"/>`;
    return `<svg class="radar" viewBox="0 0 220 215" role="img" aria-label="${esc(t('st_character'))}">${g}</svg>`;
  }
  // Schematic front/back figure; each muscle shape is shaded by level (or this week's sets)
  function bodySvg(values) {
    const max = Math.max(1, ...Object.values(values));
    const f = m => { const v = values[m] || 0; return `class="bm" data-m="${m}" style="--k:${(0.12 + 0.88 * v / max).toFixed(2)}"`; };
    const front = `<g transform="translate(0 0)">
      <circle class="bm-base" cx="50" cy="14" r="9"/><path class="bm-base" d="M30 30 Q50 24 70 30 L74 66 Q70 96 62 100 L38 100 Q30 96 26 66 Z"/>
      <ellipse ${f('shoulders')} cx="30" cy="36" rx="9" ry="7"/><ellipse ${f('shoulders')} cx="70" cy="36" rx="9" ry="7"/>
      <rect ${f('chest')} x="35" y="33" width="14" height="15" rx="5"/><rect ${f('chest')} x="51" y="33" width="14" height="15" rx="5"/>
      <ellipse ${f('biceps')} cx="24" cy="54" rx="5.5" ry="10"/><ellipse ${f('biceps')} cx="76" cy="54" rx="5.5" ry="10"/>
      <ellipse ${f('forearms')} cx="20" cy="76" rx="4.5" ry="11"/><ellipse ${f('forearms')} cx="80" cy="76" rx="4.5" ry="11"/>
      <rect ${f('core')} x="40" y="51" width="20" height="34" rx="5"/>
      <ellipse ${f('quads')} cx="42" cy="122" rx="8.5" ry="21"/><ellipse ${f('quads')} cx="58" cy="122" rx="8.5" ry="21"/>
      <ellipse ${f('calves')} cx="42" cy="162" rx="5.5" ry="14"/><ellipse ${f('calves')} cx="58" cy="162" rx="5.5" ry="14"/></g>`;
    const back = `<g transform="translate(110 0)">
      <circle class="bm-base" cx="50" cy="14" r="9"/><path class="bm-base" d="M30 30 Q50 24 70 30 L74 66 Q70 96 62 100 L38 100 Q30 96 26 66 Z"/>
      <ellipse ${f('shoulders')} cx="30" cy="36" rx="9" ry="7"/><ellipse ${f('shoulders')} cx="70" cy="36" rx="9" ry="7"/>
      <path ${f('back')} d="M38 30 L62 30 L66 50 L58 68 L42 68 L34 50 Z"/>
      <ellipse ${f('triceps')} cx="24" cy="54" rx="5.5" ry="10"/><ellipse ${f('triceps')} cx="76" cy="54" rx="5.5" ry="10"/>
      <ellipse ${f('forearms')} cx="20" cy="76" rx="4.5" ry="11"/><ellipse ${f('forearms')} cx="80" cy="76" rx="4.5" ry="11"/>
      <rect ${f('lowback')} x="42" y="70" width="16" height="14" rx="4"/>
      <ellipse ${f('glutes')} cx="43" cy="94" rx="8" ry="8"/><ellipse ${f('glutes')} cx="57" cy="94" rx="8" ry="8"/>
      <ellipse ${f('hamstrings')} cx="42" cy="124" rx="8" ry="19"/><ellipse ${f('hamstrings')} cx="58" cy="124" rx="8" ry="19"/>
      <ellipse ${f('calves')} cx="42" cy="162" rx="6" ry="14"/><ellipse ${f('calves')} cx="58" cy="162" rx="6" ry="14"/></g>`;
    return `<svg class="bodymap" viewBox="0 0 210 182" role="img" aria-label="${esc(t('st_muscles'))}">${front}${back}</svg>`;
  }

  /* ---------- Views ---------- */
  function headHtml() {
    const G = SP().goal, w = weekStats(), streak = weekStreak();
    const pct = Math.min(1, Math.max(w.n / G.sessions, w.mins / G.mins));
    return `<div class="sp-head">
      <div class="sp-energy" role="group">${['recovery', 'normal', 'beast'].map(k => `<button type="button" class="mood-chip en-${k}" data-energy="${k}" aria-pressed="${SP().energy === k}">${esc(t('en_' + k))}</button>`).join('')}</div>
      <p class="mood-line">${esc(t('en_line_' + SP().energy))}</p>
      <div class="sp-goal">
        <svg viewBox="0 0 36 36" class="sp-ring" aria-hidden="true"><circle cx="18" cy="18" r="15" class="tr"/>${pct > 0 ? `<circle cx="18" cy="18" r="15" class="pr" style="stroke-dasharray:${(pct * 94.25).toFixed(1)} 94.25"/>` : ''}</svg>
        <div><span class="label">${esc(t('sp_goal'))}</span><b>${esc(t('sp_goal_line', { s: w.n, gs: G.sessions, m: fmtMins(w.mins), gm: fmtMins(G.mins) }))}</b>
        ${streak ? `<small>${ic('flame', 'sm')} ${esc(tn('sp_week_streak', streak))}</small>` : ''}</div>
      </div>
    </div>
    <div class="tabs sp-tabs" role="tablist">${TABS.map(([k, i]) => `<button type="button" role="tab" data-sptab="${k}" aria-selected="${SP().tab === k}">${ic(i, 'sm')}<span>${esc(t('sp_' + k))}</span></button>`).join('')}</div>`;
  }
  function profileHtml(P) {
    P = P || { goal: 'general', level: 1, equip: ['none'], days: 3, length: 45, weak: [] };
    const chip = (name, v, on, label) => `<button type="button" class="chip-btn" data-pf="${name}" data-v="${v}" aria-pressed="${on}">${esc(label)}</button>`;
    return `<form class="sp-card pf" id="pf-form">
      <h3>${ic('user')} ${esc(t('pf_title'))}</h3><p class="hint">${esc(t('pf_intro'))}</p>
      <span class="label">${esc(t('pf_goal'))}</span><div class="chips">${GOALS.map(g => chip('goal', g, P.goal === g, t('g_' + g))).join('')}</div>
      <span class="label">${esc(t('pf_level'))}</span><div class="chips">${[1, 2, 3].map(l => chip('level', l, P.level === l, t('lv_' + l))).join('')}</div>
      <span class="label">${esc(t('pf_equip'))}</span><div class="chips">${D.EQUIP.map(e => chip('equip', e, P.equip.includes(e), t('eq_' + e))).join('')}</div>
      <span class="label">${esc(t('pf_days'))}</span><div class="chips">${[2, 3, 4, 5, 6].map(d => chip('days', d, P.days === d, String(d))).join('')}</div>
      <span class="label">${esc(t('pf_length'))}</span><div class="chips">${[15, 30, 45, 60].map(d => chip('length', d, P.length === d, d + ' min')).join('')}</div>
      <span class="label">${esc(t('pf_weak'))}</span><small class="hint">${esc(t('pf_weak_hint'))}</small><div class="chips">${D.MUSCLES.map(m => chip('weak', m, (P.weak || []).includes(m), t('m_' + m))).join('')}</div>
      <button type="submit" class="primary">${esc(t('pf_save'))}</button>
    </form>`;
  }
  let pfDraft = null;
  function sessionCard(sess, opts = {}) {
    return `<div class="sp-card sp-session">
      <div class="sp-session-head"><div><span class="label">${esc(opts.kicker || '')}</span><h3>${esc(sess.title)}</h3>
        <small>${esc(tn('sp_ex_n', sess.exercises.length))}${sess.est ? ' · ' + esc(t('sp_est', { n: sess.est })) : ''}</small></div>${opts.badge || ''}</div>
      <ol class="sp-plan-list">${sess.exercises.map(e => { const x = LIB[e.exId]; return `<li><span class="eq-dot eq-${x ? x.eq : 'none'}"></span><b>${esc(e.name)}</b><small>${e.sets.length} × ${e.unit === 'sec' ? e.target + ' ' + esc(t('sp_sec')) : e.target}${e.sets[0].kg ? ' · ' + e.sets[0].kg + ' kg' : ''}</small></li>`; }).join('')}</ol>
      <div class="sp-session-btns">${opts.buttons || ''}</div></div>`;
  }
  function todayHtml() {
    const A = SP().active;
    if (A) return A.mode === 'guided' ? guidedHtml(A) : logHtml(A);
    if (!SP().profile || pfDraft) return profileHtml(pfDraft || SP().profile);
    const sess = todaySession(), info = planInfo();
    const kicker = SP().energy === 'recovery' ? t('td_recovery') : t('td_session', { n: (SP().plan.idx % info.split.length) + 1, w: info.weekIdx + 1 });
    return `${sessionCard(sess, { kicker, badge: info.deload ? `<span class="chip">${esc(t('td_deload'))}</span>` : '',
        buttons: `<button type="button" class="primary" data-go="plan:guided">${ic('play', 'sm')} ${esc(t('td_guided'))}</button><button type="button" data-go="plan:log">${ic('list', 'sm')} ${esc(t('td_log'))}</button>` })}
      <div class="sp-card sp-week"><span class="label">${esc(t('td_week_plan'))}</span><div class="sp-week-row">${info.split.map((k, i) => `<span class="${i === SP().plan.idx % info.split.length ? 'on' : ''}">${esc(t('dk_' + k))}</span>`).join('')}</div>
        <button type="button" class="small ghost" data-pfedit>${ic('gear', 'sm')} ${esc(t('pf_edit'))}</button></div>
      <div class="sp-card sp-quickhome"><div><h3>${ic('home')} ${esc(t('td_quick'))}</h3><small class="hint">${esc(t('td_quick_hint'))}</small></div>
        <div class="chips">${[10, 20, 30].map(m => `<button type="button" class="chip-btn" data-quick="${m}">${esc(t('td_mins', { n: m }))}</button>`).join('')}</div></div>
      <div class="sp-row-btns"><button type="button" data-go="free">${ic('plus', 'sm')} ${esc(t('td_free'))}</button><button type="button" data-sptab="timer">${ic('timer', 'sm')} ${esc(t('sp_timer'))}</button></div>
      <h2>${esc(t('td_cardio'))}</h2>
      <form class="sp-card sp-quick" id="sp-quick">
        <div class="sp-acts">${ACTIVITIES.map((a, i) => `<label class="sp-act"><input type="radio" name="act" value="${a}" ${i === 0 ? 'checked' : ''}><span>${ic(D.ACT_ICON[a])}${esc(t('ac_' + a))}</span></label>`).join('')}</div>
        <div class="t-edit-row">
          <label><span>${esc(t('sp_duration'))}</span><input type="number" name="mins" min="1" max="600" value="30" inputmode="numeric"></label>
          <label><span>${esc(t('sp_distance'))}</span><input type="number" name="km" min="0" max="500" step="0.1" placeholder="—" inputmode="decimal"></label>
        </div>
        <label class="d-slider"><span>${esc(t('sp_rpe'))} <b id="sp-rpe-v">6</b>/10</span><input type="range" name="rpe" min="1" max="10" value="6" id="sp-rpe"></label>
        <input type="text" name="notes" maxlength="200" placeholder="${esc(t('sp_notes_ph'))}">
        <button type="submit" class="primary">${esc(t('sp_log'))}</button>
      </form>`;
  }
  function guidedHtml(A) {
    if (A.finished) return finishHtml(A);
    const st = A.steps[A.pos], next = A.steps.slice(A.pos + 1).find(s => s.type === 'work');
    const nextLabel = next ? exName(A.exercises[next.ei].exId) + ' · ' + (A.exercises[next.ei].unit === 'sec' ? stepTarget(A, next) + ' ' + t('sp_sec') : '× ' + stepTarget(A, next)) : t('gd_finish_h');
    const prog = `<div class="gd-progress"><i style="width:${(A.pos / A.steps.length * 100).toFixed(1)}%"></i></div>`;
    if (st.type === 'rest') {
      if (!gEnd) gEnd = Date.now() + st.secs * 1000;
      return `<div class="sp-card gd gd-rest">${prog}<span class="state">${esc(t('gd_rest'))}</span><div class="gd-clock" id="gd-clock">${fmtClock(st.secs)}</div><div class="deep-bar"><b id="gd-bar"></b></div>
        <p class="gd-next">${esc(t('gd_next', { name: nextLabel }))}</p>
        <div class="controls"><button type="button" class="ghost" data-gd="quit">${esc(t('gd_quit'))}</button><button type="button" class="primary" data-gd="skip">${ic('skip', 'sm')} ${esc(t('gd_skip'))}</button></div></div>`;
    }
    const e = A.exercises[st.ei], s = e.sets[st.si], x = LIB[e.exId] || {}, timed = e.unit === 'sec';
    const lp = lastPerf(e.exId);
    return `<div class="sp-card gd gd-work">${prog}
      <span class="state">${A.circuit ? esc(t('gd_round', { r: st.round, n: st.rounds })) : esc(t('gd_set', { s: st.si + 1, n: e.sets.length }))}</span>
      <h3 class="gd-name">${esc(exName(e.exId))}</h3>
      <div class="gd-muscles">${(x.primary || []).map(m => `<span class="chip on">${esc(t('m_' + m))}</span>`).join('')}${(x.secondary || []).map(m => `<span class="chip">${esc(t('m_' + m))}</span>`).join('')}</div>
      <p class="gd-cue">${esc(exCue(e.exId))}</p>
      ${timed ? `<div class="gd-clock" id="gd-clock">${fmtClock(stepTarget(A, st))}</div><div class="deep-bar"><b id="gd-bar"></b></div>`
        : `<div class="gd-target"><button type="button" class="tool" data-gdreps="-1">${ic('minus', 'sm')}</button><b>× <span id="gd-reps">${s.reps}</span></b><button type="button" class="tool" data-gdreps="1">${ic('plus', 'sm')}</button></div>`}
      ${x.weighted ? `<label class="field gd-kg"><span>${esc(t('gd_kg'))}</span><input type="number" id="gd-kg" min="0" max="500" step="0.5" value="${esc(s.kg)}" inputmode="decimal" placeholder="0"></label>` : ''}
      ${lp ? `<small class="hint">${esc(t('sp_last', { s: lp.done.map(d => setLabel(d, unitOf(lp.e))).join(' · ') }))}</small>` : ''}
      <div class="controls"><button type="button" class="ghost" data-gd="quit">${esc(t('gd_quit'))}</button>
        ${timed && !gEnd ? `<button type="button" class="primary" data-gd="hold">${ic('play', 'sm')} ${esc(t('gd_start_hold'))}</button>` : `<button type="button" class="primary" data-gd="done">${ic('check', 'sm')} ${esc(t('gd_done'))}</button>`}</div>
      <p class="gd-next">${esc(t('gd_next', { name: nextLabel }))}</p></div>`;
  }
  function finishHtml(A) {
    return `<div class="sp-card gd gd-finish"><span class="state">${esc(t('gd_finish_h'))}</span><h3>${esc(A.title)}</h3>
      <div class="sp-stats"><span><small>${esc(t('sp_elapsed'))}</small><b>${fmtMins((Date.now() - A.startedAt) / 60000)}</b></span><span><small>${esc(t('sp_sets_done'))}</small><b>${setsDone(A.exercises)}</b></span><span><small>${esc(t('sp_volume'))}</small><b>${Math.round(volumeOf(A.exercises))} kg</b></span></div>
      <label class="d-slider"><span>${esc(t('sp_rpe'))} <b id="sp-arpe-v">${A.rpe || 7}</b>/10</span><input type="range" id="sp-arpe" min="1" max="10" value="${A.rpe || 7}"></label>
      <textarea id="sp-wnotes" rows="2" placeholder="${esc(t('sp_notes_ph'))}">${esc(A.notes || '')}</textarea>
      <button type="button" class="primary" id="sp-finish">${ic('check', 'sm')} ${esc(t('sp_finish'))}</button></div>`;
  }
  let exQuery = '';
  function logHtml(A) {
    const vol = volumeOf(A.exercises);
    const matches = exQuery.trim() ? Object.values(LIB).filter(x => (x.fr + ' ' + x.en).toLowerCase().includes(exQuery.toLowerCase())).slice(0, 8) : [];
    return `<div class="sp-card sp-active">
        <div class="sp-active-head"><h3>${ic('dumbbell')} ${esc(A.title)}</h3>
          <div class="sp-stats"><span><small>${esc(t('sp_elapsed'))}</small><b id="sp-elapsed">${fmtClock((Date.now() - A.startedAt) / 1000)}</b></span>
          <span><small>${esc(t('sp_sets_done'))}</small><b>${setsDone(A.exercises)}</b></span><span><small>${esc(t('sp_volume'))}</small><b>${Math.round(vol)} kg</b></span></div></div>
        <div class="sp-rest-set"><span class="label">${esc(t('sp_rest_len'))}</span>${[30, 60, 90, 120, 180].map(s => `<button type="button" class="chip-btn" data-restlen="${s}" aria-pressed="${SP().rest === s}">${s < 60 ? s + ' s' : s / 60 + ' min'}</button>`).join('')}</div>
        ${A.exercises.map((e, ei) => {
          const id = idOf(e), x = LIB[id] || {}, lp = id && lastPerf(id), u = unitOf(e);
          return `<div class="sp-ex">
            <div class="sp-ex-head"><b>${esc(id ? exName(id) : e.name)}</b><button type="button" class="icon-btn" data-exdel="${ei}" aria-label="${esc(t('sp_remove'))}">✕</button></div>
            ${lp ? `<small class="hint">${esc(t('sp_last', { s: lp.done.map(s => setLabel(s, unitOf(lp.e))).join(' · ') }))}</small>` : ''}
            <div class="sp-sets">${e.sets.map((s, si) => `<div class="sp-set ${s.done ? 'done' : ''}">
              <span class="sp-n">${si + 1}</span>
              <label><input type="number" data-f="${u === 'sec' ? 'sec' : 'reps'}" data-ei="${ei}" data-si="${si}" value="${esc(u === 'sec' ? val(s, 'sec') : s.reps)}" min="0" max="999" inputmode="numeric"><small>${u === 'sec' ? esc(t('sp_sec')) : esc(t('sp_reps'))}</small></label>
              ${x.weighted || u !== 'sec' ? `<label><input type="number" data-f="kg" data-ei="${ei}" data-si="${si}" value="${esc(s.kg)}" min="0" max="999" step="0.5" inputmode="decimal" placeholder="—"><small>${esc(t('sp_kg'))}</small></label>` : '<span></span>'}
              <button type="button" class="sp-check" data-done="${ei}:${si}" aria-pressed="${s.done}">${ic('check', 'sm')}</button></div>`).join('')}</div>
            <button type="button" class="small ghost" data-addset="${ei}">${esc(t('sp_add_set'))}</button></div>`;
        }).join('')}
        <div class="sp-addex"><input type="search" id="sp-exsearch" placeholder="${esc(t('sp_ex_search'))}" value="${esc(exQuery)}">
          ${matches.length ? `<div class="sp-exmatches">${matches.map(x => `<button type="button" class="chip-btn" data-addex="${x.id}">${esc(exName(x.id))}</button>`).join('')}</div>` : ''}</div>
        <textarea id="sp-wnotes" rows="2" placeholder="${esc(t('sp_notes_ph'))}">${esc(A.notes || '')}</textarea>
        <label class="d-slider"><span>${esc(t('sp_rpe'))} <b id="sp-arpe-v">${A.rpe || 7}</b>/10</span><input type="range" id="sp-arpe" min="1" max="10" value="${A.rpe || 7}"></label>
        <div class="controls sp-end"><button type="button" class="ghost danger" id="sp-cancel">${esc(t('sp_cancel'))}</button><button type="button" class="primary" id="sp-finish">${esc(t('sp_finish'))}</button></div>
      </div>
      <div class="sp-rest" id="sp-rest" hidden><span class="label">${esc(t('sp_rest'))}</span><b id="sp-rest-clock">0:00</b><i><b id="sp-rest-bar"></b></i><button type="button" class="small" id="sp-rest-skip">${esc(t('sp_rest_skip'))}</button></div>`;
  }
  function skillsHtml() {
    const B = bests(), st = skillState(B), P = SP().profile;
    return `<div class="sk-grid">${Object.entries(D.TREE).map(([k, br]) => {
      const cur = st[k], total = br.steps.length;
      return `<div class="sp-card sk-branch"><div class="sk-head"><h3>${esc(fr() ? br.fr : br.en)}</h3><span class="chip">${cur}/${total}</span></div>
        <ol class="sk-steps">${br.steps.map((s, i) => {
          const state = i < cur ? 'done' : i === cur ? 'next' : 'locked', b = B[s[0]], x = LIB[s[0]];
          const bestTxt = b ? (s[1] === 'reps' ? b.reps + ' ' + t('sp_reps') : s[1] === 'hold' ? b.sec + ' ' + t('sp_sec') : '+' + b.kg + ' kg') : '—';
          return `<li class="${state}"><span class="sk-node">${state === 'done' ? ic('check', 'sm') : state === 'locked' ? ic('lock', 'sm') : '<i></i>'}</span>
            <div><b>${esc(exName(s[0]))}</b><small>${esc(stepLabel(s).split(' · ')[1])}${state === 'next' ? ' · ' + esc(t('sk_best', { v: bestTxt })) : ''}</small></div>
            ${state === 'next' && (!P || eqOK(x, P) || x.eq === 'none') ? `<button type="button" class="small" data-trainskill="${k}">${esc(t('sk_train'))}</button>` : ''}</li>`;
        }).join('')}</ol></div>`;
    }).join('')}</div>`;
  }
  function statsHtml() {
    if (!SP().workouts.length) return `<div class="sp-card"><p class="hint">${esc(t('st_empty'))}</p>${bodySvg({})}</div>`;
    const C = character(), mode = SP().statsMode, vals = {};
    D.MUSCLES.forEach(m => { vals[m] = mode === 'week' ? C.sets[m] : lvl(C.mus[m]); });
    const monthStart = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); })();
    const mws = SP().workouts.filter(w => w.at >= monthStart);
    const ex = [...new Set(SP().workouts.flatMap(w => (w.exercises || []).map(idOf)).filter(Boolean))];
    const sel = SP().progressEx && ex.includes(SP().progressEx) ? SP().progressEx : ex[0];
    // consistency heatmap
    const weeks = 13, end = new Date(), endDow = (end.getDay() + 6) % 7, startD = new Date(end); startD.setDate(end.getDate() - endDow - (weeks - 1) * 7);
    const byDay = {}; SP().workouts.forEach(w => { const k = dayKey(new Date(w.at)); byDay[k] = (byDay[k] || 0) + w.mins; });
    let heat = `<svg class="heat" viewBox="0 0 ${weeks * 13} ${7 * 13}" aria-hidden="true">`;
    for (let w = 0; w < weeks; w++) for (let d = 0; d < 7; d++) { const dt = new Date(startD); dt.setDate(startD.getDate() + w * 7 + d); if (dt > end) continue; const m = byDay[dayKey(dt)] || 0; heat += `<rect x="${w * 13}" y="${d * 13}" width="11" height="11" rx="2" class="h${m === 0 ? 0 : m < 30 ? 2 : m < 60 ? 3 : 4}"/>`; }
    heat += '</svg>';
    return `<div class="sp-card st-char">
        <div class="st-char-head"><div><span class="label">${esc(t('st_character'))}</span><h3>${esc(t('cl_' + C.cls))}</h3><small>${esc(t('st_level', { n: C.level }))}</small></div>
          <div class="seg-toggle st-mode"><button type="button" data-stmode="level" aria-pressed="${mode === 'level'}">${esc(t('st_levels'))}</button><button type="button" data-stmode="week" aria-pressed="${mode === 'week'}">${esc(t('st_week'))}</button></div></div>
        <div class="st-char-body">${radarSvg(C.attr)}${bodySvg(vals)}</div>
      </div>
      <div class="sp-card"><h2>${esc(t('st_muscles'))}</h2><div class="st-muscles">${D.MUSCLES.map(m => {
        const L = lvl(C.mus[m]), into = Math.sqrt(C.mus[m] / 40) % 1;
        return `<div class="st-m"><span>${esc(t('m_' + m))}</span><b>${L}</b><i><em style="width:${(into * 100).toFixed(0)}%"></em></i><small>${esc(t('st_sets_wk', { n: Math.round(C.sets[m]) }))}</small></div>`;
      }).join('')}</div></div>
      <div class="sp-card"><h2>${esc(t('st_month'))}</h2><div class="sp-stats five">
        <span><small>${esc(t('st_m_sessions'))}</small><b>${mws.length}</b></span><span><small>${esc(t('st_m_time'))}</small><b>${fmtMins(mws.reduce((a, w) => a + w.mins, 0))}</b></span>
        <span><small>${esc(t('st_m_volume'))}</small><b>${Math.round(mws.reduce((a, w) => a + volumeOf(w.exercises), 0) / 1000 * 10) / 10}t</b></span>
        <span><small>${esc(t('st_m_prs'))}</small><b>${mws.reduce((a, w) => a + ((w.prs || []).length), 0)}</b></span>
        <span><small>${esc(t('st_m_skills'))}</small><b>${Object.values(skillState()).reduce((a, b) => a + b, 0)}</b></span></div></div>
      ${ex.length ? `<div class="sp-card"><h2>${esc(t('st_progress'))}</h2>
        <select id="st-ex">${ex.map(id => `<option value="${id}" ${id === sel ? 'selected' : ''}>${esc(exName(id))}</option>`).join('')}</select>${progressChart(sel)}</div>` : ''}
      <div class="sp-card"><h2>${esc(t('st_consistency'))}</h2>${heat}</div>
      <div class="sp-card"><h2>${esc(t('st_records'))}</h2>${recordsHtml()}</div>`;
  }
  function progressChart(id) {
    const pts = [];
    SP().workouts.forEach(w => { const e = (w.exercises || []).find(x => idOf(x) === id); if (!e) return; const u = unitOf(e), d = e.sets.filter(s => s.done); if (!d.length) return; pts.push({ at: w.at, v: Math.max(...d.map(s => u === 'sec' ? val(s, 'sec') : (e1rm(+s.kg, +s.reps) || +s.reps))), u }); });
    if (pts.length < 2) return `<p class="hint">—</p>`;
    const W = 320, H = 120, mx = Math.max(...pts.map(p => p.v)), mn = Math.min(...pts.map(p => p.v)), n = pts.length;
    const xy = (p, i) => [(i / (n - 1)) * (W - 30) + 15, H - 18 - (mx === mn ? 0.5 : (p.v - mn) / (mx - mn)) * (H - 36)];
    const poly = pts.map((p, i) => xy(p, i).map(v => v.toFixed(1)).join(',')).join(' ');
    const last = xy(pts[n - 1], n - 1);
    const unit = pts[0].u === 'sec' ? t('sp_sec') : (pts.some(p => p.v % 1) ? 'kg' : t('sp_reps'));
    return `<svg class="chart prog" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${poly}"/><circle cx="${last[0]}" cy="${last[1]}" r="4"/>
      <text x="15" y="12">${Math.round(mn)}–${Math.round(mx)} ${esc(unit)}</text><text x="${W - 15}" y="${H - 4}" text-anchor="end">${esc(new Date(pts[n - 1].at).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' }))}</text></svg>`;
  }
  function recordsHtml() {
    const B = bests(), rows = Object.entries(B).filter(([, b]) => b.e1rm || b.reps || b.sec).sort((a, b) => (b[1].e1rm || 0) - (a[1].e1rm || 0)).slice(0, 15);
    if (!rows.length) return '<p class="hint">—</p>';
    return `<ul class="sp-recs">${rows.map(([id, b]) => `<li><div><b>${esc(exName(id))}</b><small>${b.e1rm ? esc(t('rec_e1rm')) + ' ' + Math.round(b.e1rm) + ' kg' : b.sec ? esc(t('rec_hold')) + ' ' + b.sec + ' ' + esc(t('sp_sec')) : esc(t('rec_reps')) + ' ' + b.reps}${b.kg ? ' · +' + b.kg + ' kg' : ''}</small></div>${ic('trophy', 'sm muted')}</li>`).join('')}</ul>`;
  }
  function timerHtml() {
    const C = SP().chrono, modes = ['tabata', 'emom', 'hiit', 'stopwatch', 'countdown'];
    const ph = ch.phases[ch.lastIdx], phaseCls = ch.done ? 'done' : ph ? ph.kind : 'idle';
    const label = ch.done ? t('ch_done') : ph ? (ph.kind === 'work' ? t('ch_work') : ph.kind === 'rest' ? t('ch_restp') : t('ch_prep')) : t('ch_' + C.mode);
    return `<div class="seg-toggle five" role="group">${modes.map(m => `<button type="button" data-chmode="${m}" aria-pressed="${C.mode === m}">${esc(t('ch_' + m))}</button>`).join('')}</div>
      ${!ch.t0 ? `<div class="sp-card ch-set">${C.mode === 'hiit' ? `<div class="t-edit-row">
          <label><span>${esc(t('ch_work_s'))}</span><input type="number" data-ch="work" value="${C.work}" min="5" max="600"></label>
          <label><span>${esc(t('ch_rest_s'))}</span><input type="number" data-ch="rest" value="${C.rest}" min="0" max="600"></label>
          <label><span>${esc(t('ch_rounds'))}</span><input type="number" data-ch="rounds" value="${C.rounds}" min="1" max="50"></label></div>`
        : C.mode === 'emom' ? `<label class="field"><span>${esc(t('ch_minutes'))}</span><input type="number" data-ch="emom" value="${C.emom}" min="1" max="60"></label>`
        : C.mode === 'countdown' ? `<label class="field"><span>${esc(t('ch_minutes'))}</span><input type="number" data-ch="countdown" value="${C.countdown}" min="1" max="180"></label>`
        : C.mode === 'tabata' ? `<p class="hint">8 × (20 s / 10 s) · 4 min</p>` : ''}
        <div class="opts"><label class="opt"><input type="checkbox" id="ch-music" ${C.music ? 'checked' : ''}> ${esc(t('ch_music'))}</label><label class="opt"><input type="checkbox" id="ch-voice" ${C.voice ? 'checked' : ''}> ${esc(t('ch_voice'))}</label></div></div>` : ''}
      <div class="sp-card ch-display ph-${phaseCls}">
        <span class="state">${esc(label)}${ph && ph.n > 1 && !ch.done ? ' · ' + esc(t('ch_round', { r: ph.r, n: ph.n })) : ''}</span>
        <div class="ch-clock" id="ch-clock">${C.mode === 'stopwatch' ? fmtClock(chElapsed()) + '.0' : fmtClock(ph ? 0 : buildPhases().reduce((a, p) => a + p.dur, 0))}</div>
        <div class="deep-bar"><b id="ch-bar"></b></div><small id="ch-total"></small>
        <div class="controls"><button type="button" id="ch-reset">${esc(t('ch_reset'))}</button><button type="button" class="primary" id="ch-go">${esc(ch.running ? t('ch_pause') : ch.t0 && !ch.done ? t('ch_resume') : t('ch_start'))}</button>
          ${C.mode === 'stopwatch' ? `<button type="button" id="ch-lap" ${ch.running ? '' : 'disabled'}>${esc(t('ch_lap'))}</button>` : '<span></span>'}</div>
        ${ch.laps.length ? `<ol class="ch-laps">${ch.laps.map((l, i) => `<li><span>${esc(t('ch_lap'))} ${i + 1}</span><b>${fmtClock(l)}</b></li>`).join('')}</ol>` : ''}
      </div>`;
  }
  function historyHtml() {
    const ws = SP().workouts;
    if (!ws.length) return `<p class="hint">${esc(t('hi_empty'))}</p>`;
    const days = []; for (let i = 6; i >= 0; i--) { const k = addDays(today(), -i); days.push({ k, label: parseDay(k).toLocaleDateString(ML.locale(), { weekday: 'short' }).slice(0, 3), m: 0 }); }
    ws.forEach(w => { const d = days.find(x => x.k === dayKey(new Date(w.at))); if (d) d.m += w.mins; });
    const max = Math.max(30, ...days.map(d => d.m));
    return `<div class="sp-card"><h2>${esc(t('hi_week'))}</h2><div class="sp-bars">${days.map((d, i) => `<div class="sp-bar ${i === 6 ? 'today' : ''}"><i style="height:${(d.m / max * 100).toFixed(0)}%"></i><small>${esc(d.label)}</small>${d.m ? `<b>${fmtMins(d.m)}</b>` : ''}</div>`).join('')}</div></div>
      <ul class="sp-hist">${[...ws].reverse().slice(0, 50).map(w => `<li>
        <span class="sp-ico">${ic(w.activity ? D.ACT_ICON[w.activity] : (D.TYPE_ICON[w.type] || 'dumbbell'))}</span>
        <div><b>${esc(w.title)}</b><small>${esc(new Date(w.at).toLocaleDateString(ML.locale(), { weekday: 'short', day: 'numeric', month: 'short' }))} · ${fmtMins(w.mins)}${w.km ? ' · ' + w.km + ' km' : ''}${(w.exercises || []).length ? ' · ' + setsDone(w.exercises) + ' ' + esc(t('sp_sets_done').toLowerCase()) : ''}${volumeOf(w.exercises) ? ' · ' + Math.round(volumeOf(w.exercises)) + ' kg' : ''}${w.rpe ? ' · RPE ' + w.rpe : ''}</small>
        ${(w.prs || []).length ? `<small class="sp-prs">${ic('trophy', 'sm')} ${w.prs.map(p => esc(typeof p === 'string' ? p : p.ex + ' ' + p.set)).join(' · ')}</small>` : ''}
        ${w.notes ? `<span class="hint">${esc(w.notes)}</span>` : ''}</div>
        <button type="button" class="icon-btn" data-hdel="${w.id}" aria-label="${esc(t('hi_delete'))}">✕</button></li>`).join('')}</ul>`;
  }
  function bodyHtml() {
    const B = SP().body, last = B.slice(-30), W = SP().water, water = W.day === today() ? W.n : 0, G = SP().goal;
    let spark = '';
    if (last.length > 1) {
      const vals = last.map(x => x.kg), mx = Math.max(...vals), mn = Math.min(...vals), w = 300, h = 60;
      spark = `<svg class="spark big" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${vals.map((v, i) => `${(i / (vals.length - 1) * w).toFixed(1)},${(h - (mx === mn ? h / 2 : (v - mn) / (mx - mn) * (h - 8) + 4)).toFixed(1)}`).join(' ')}"/></svg>`;
    }
    return `<div class="sp-card"><h2>${ic('scale', 'sm')} ${esc(t('bd_weight'))}</h2>
        <form class="sp-row" id="bd-wform"><input type="number" name="kg" min="20" max="400" step="0.1" placeholder="${esc(t('bd_weight_ph'))}" inputmode="decimal"><button type="submit" class="small primary">${esc(t('bd_add'))}</button></form>
        ${spark}${last.length ? `<small class="hint">${last.slice(-5).reverse().map(x => esc(parseDay(x.day).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' })) + ' : ' + x.kg + ' kg').join(' · ')}</small>` : ''}</div>
      <div class="sp-card"><h2>${ic('water', 'sm')} ${esc(t('bd_water'))} · ${esc(t('bd_water_goal', { n: SP().waterGoal }))}</h2>
        <div class="sp-water">${Array.from({ length: Math.max(SP().waterGoal, water) }, (_, i) => `<span class="glass ${i < water ? 'full' : ''}"></span>`).join('')}</div>
        <div class="sp-row"><button type="button" class="small" data-water="-1">${ic('minus', 'sm')}</button><b>${water}</b><button type="button" class="small primary" data-water="1">${ic('plus', 'sm')}</button></div></div>
      <div class="sp-card"><h2>${ic('moon', 'sm')} ${esc(t('bd_sleep'))}</h2>
        <div class="sp-row">${[5, 6, 7, 8, 9].map(h => `<button type="button" class="chip-btn" data-sleep="${h}" aria-pressed="${SP().sleep[today()] === h}">${h} ${esc(t('bd_hours'))}</button>`).join('')}</div></div>
      <div class="sp-card"><h2>${ic('target', 'sm')} ${esc(t('bd_goal_set'))}</h2><div class="t-edit-row">
        <label><span>${esc(t('bd_goal_s'))}</span><input type="number" id="bd-gs" min="1" max="14" value="${G.sessions}"></label>
        <label><span>${esc(t('bd_goal_m'))}</span><input type="number" id="bd-gm" min="10" max="2000" step="10" value="${G.mins}"></label></div>
        <button type="button" class="small ghost" data-pfedit>${ic('user', 'sm')} ${esc(t('bd_profile'))}</button></div>`;
  }

  let elapsedIv = null;
  function render() {
    const root = $('sport-root'); if (!root || root.hidden) return;
    if (SP().energyDay !== today()) { SP().energyDay = today(); SP().energy = 'normal'; SP().rest = 90; }
    const tab = SP().tab;
    const body = tab === 'today' ? todayHtml() : tab === 'skills' ? skillsHtml() : tab === 'stats' ? statsHtml() : tab === 'timer' ? timerHtml() : tab === 'history' ? historyHtml() : bodyHtml();
    root.innerHTML = headHtml() + `<div class="sp-body">${body}</div>`;
    clearInterval(elapsedIv);
    const A = SP().active;
    if (tab === 'today' && A && A.mode === 'log') elapsedIv = setInterval(() => { const el = $('sp-elapsed'); if (el && SP().active) el.textContent = fmtClock((Date.now() - SP().active.startedAt) / 1000); }, 1000);
    if (tab === 'today' && A && A.mode === 'guided' && gEnd) { clearInterval(gTimer); gTimer = setInterval(guidedTick, 200); guidedTick(); }
    if (restEnd && $('sp-rest')) $('sp-rest').hidden = false;
  }

  /* ---------- Events ---------- */
  const root = $('sport-root');
  root.addEventListener('click', e => {
    beepCtx();
    const b = e.target.closest('button'); if (!b) return;
    const A = SP().active;
    if (b.dataset.sptab) { SP().tab = b.dataset.sptab; save(); render(); return; }
    if (b.dataset.energy) { SP().energy = b.dataset.energy; SP().rest = { recovery: 120, normal: 90, beast: 60 }[b.dataset.energy]; save(); render(); return; }
    if (b.dataset.pf) {
      e.preventDefault();
      const P = pfDraft || (pfDraft = JSON.parse(JSON.stringify(SP().profile || { goal: 'general', level: 1, equip: ['none'], days: 3, length: 45, weak: [] })));
      const k = b.dataset.pf, v = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v;
      if (k === 'equip' || k === 'weak') { const arr = P[k]; const i = arr.indexOf(v); i >= 0 ? arr.splice(i, 1) : arr.push(v); if (k === 'weak' && arr.length > 3) arr.shift(); }
      else P[k] = v;
      if (!P.equip.includes('none')) P.equip.unshift('none');
      render(); return;
    }
    if (b.hasAttribute('data-pfedit')) { pfDraft = JSON.parse(JSON.stringify(SP().profile || { goal: 'general', level: 1, equip: ['none'], days: 3, length: 45, weak: [] })); SP().tab = 'today'; render(); return; }
    if (b.dataset.go) {
      if (b.dataset.go === 'free') { startSession({ key: 'free', title: t('td_free'), exercises: [] }, 'log'); return; }
      const [, mode] = b.dataset.go.split(':'); startSession(todaySession(), mode); return;
    }
    if (b.dataset.quick) { startSession(quickCircuit(+b.dataset.quick), 'guided'); return; }
    if (b.dataset.trainskill) {
      const k = b.dataset.trainskill, step = D.TREE[k].steps[skillState()[k]], x = LIB[step[0]];
      const target = step[1] === 'reps' ? Math.max(1, Math.ceil(step[2] * 0.6)) : step[1] === 'hold' ? Math.max(5, Math.ceil(step[2] * 0.6)) : 5;
      const unit = x.kind === 'reps' ? 'reps' : 'sec';
      startSession({ key: 'skill', title: exName(x.id), exercises: [{ exId: x.id, name: exName(x.id), unit, target, sets: Array.from({ length: 4 }, () => ({ reps: unit === 'reps' ? target : '', sec: unit === 'sec' ? target : '', kg: step[1] === 'kg' ? step[2] : '', done: false })) }] }, 'guided');
      SP().tab = 'today'; render(); return;
    }
    // guided controls
    if (b.dataset.gd && A) {
      const st = A.steps[A.pos];
      if (b.dataset.gd === 'quit') { clearInterval(gTimer); gEnd = null; A.finished = true; save(); render(); return; }
      if (b.dataset.gd === 'skip') { advance(); return; }
      if (b.dataset.gd === 'hold') { gStart = Date.now(); gEnd = Date.now() + stepTarget(A, st) * 1000; say(t('gd_go')); beep(990, 0.2); render(); return; }
      if (b.dataset.gd === 'done') {
        const set = A.exercises[st.ei].sets[st.si];
        if (A.exercises[st.ei].unit === 'sec') set.sec = gStart ? Math.round((Date.now() - gStart) / 1000) : stepTarget(A, st);
        const kg = $('gd-kg'); if (kg) set.kg = kg.value === '' ? '' : +kg.value;
        set.done = true; beep(880, 0.08); buzz(40); advance(); return;
      }
    }
    if (b.dataset.gdreps && A) { const st = A.steps[A.pos], set = A.exercises[st.ei].sets[st.si]; set.reps = Math.max(0, (+set.reps || 0) + +b.dataset.gdreps); $('gd-reps').textContent = set.reps; save(); return; }
    if (b.dataset.restlen) { SP().rest = +b.dataset.restlen; save(); render(); return; }
    if (b.dataset.done && A) { const [ei, si] = b.dataset.done.split(':').map(Number), s = A.exercises[ei].sets[si]; s.done = !s.done; save(); render(); if (s.done) { beep(880, 0.08); buzz(40); startRest(); } return; }
    if (b.dataset.addset && A) { const e2 = A.exercises[+b.dataset.addset], l = e2.sets[e2.sets.length - 1] || { reps: 10, kg: '' }; e2.sets.push({ reps: l.reps, sec: l.sec, kg: l.kg, done: false }); save(); render(); return; }
    if (b.dataset.exdel && A) { A.exercises.splice(+b.dataset.exdel, 1); save(); render(); return; }
    if (b.dataset.addex && A) {
      const x = LIB[b.dataset.addex], lp = lastPerf(x.id), unit = x.kind === 'reps' ? 'reps' : 'sec';
      A.exercises.push({ exId: x.id, name: exName(x.id), unit, target: unit === 'sec' ? 30 : 10, sets: lp ? lp.done.map(s => ({ reps: s.reps, sec: s.sec, kg: s.kg, done: false })) : Array.from({ length: 3 }, () => ({ reps: unit === 'reps' ? 10 : '', sec: unit === 'sec' ? 30 : '', kg: '', done: false })) });
      exQuery = ''; save(); render(); return;
    }
    if (b.id === 'sp-rest-skip') { stopRest(); return; }
    if (b.id === 'sp-finish' && A) { saveActive(); return; }
    if (b.dataset.stmode) { SP().statsMode = b.dataset.stmode; save(); render(); return; }
    if (b.dataset.chmode) { if (ch.running) return; chReset(); SP().chrono.mode = b.dataset.chmode; save(); render(); return; }
    if (b.id === 'ch-go') { chStart(); return; }
    if (b.id === 'ch-reset') { chReset(); return; }
    if (b.id === 'ch-lap') { ch.laps.push(chElapsed()); render(); return; }
    if (b.dataset.hdel) { SP().workouts = SP().workouts.filter(w => w.id !== b.dataset.hdel); save(); render(); toast(t('hi_deleted')); return; }
    if (b.dataset.water) { const W = SP().water; if (W.day !== today()) { W.day = today(); W.n = 0; } W.n = clamp(W.n + +b.dataset.water, 0, 30); save(); render(); if (+b.dataset.water > 0) beep(1200, 0.05, 0.12); return; }
    if (b.dataset.sleep) { SP().sleep[today()] = +b.dataset.sleep; save(); render(); return; }
  });
  root.addEventListener('click', e => {
    const b = e.target.closest('#sp-cancel'); if (!b) return;
    if (b.dataset.armed) { stopRest(); SP().active = null; save(); render(); return; }
    b.dataset.armed = '1'; b.textContent = t('tap_again'); setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = t('sp_cancel'); } }, 3000);
  });
  root.addEventListener('input', e => {
    const el = e.target, A = SP().active;
    if (el.dataset.f && A) { const s = A.exercises[+el.dataset.ei].sets[+el.dataset.si]; s[el.dataset.f] = el.value === '' ? '' : +el.value; save(); return; }
    if (el.id === 'sp-wnotes' && A) { A.notes = el.value; save(); return; }
    if (el.id === 'sp-arpe' && A) { A.rpe = +el.value; $('sp-arpe-v').textContent = el.value; save(); return; }
    if (el.id === 'sp-rpe') { $('sp-rpe-v').textContent = el.value; return; }
    if (el.id === 'sp-exsearch') { exQuery = el.value; render(); const s = $('sp-exsearch'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } return; }
    if (el.dataset.ch) { SP().chrono[el.dataset.ch] = clamp(Math.round(+el.value) || 1, 0, 600); save(); return; }
  });
  root.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'ch-music') { SP().chrono.music = el.checked; save(); }
    if (el.id === 'ch-voice') { SP().chrono.voice = el.checked; save(); }
    if (el.id === 'bd-gs') { SP().goal.sessions = clamp(+el.value || 3, 1, 14); save(); toast(t('bd_saved')); }
    if (el.id === 'bd-gm') { SP().goal.mins = clamp(+el.value || 150, 10, 2000); save(); toast(t('bd_saved')); }
    if (el.id === 'st-ex') { SP().progressEx = el.value; save(); render(); }
  });
  root.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (f.id === 'pf-form') {
      const P = pfDraft || JSON.parse(JSON.stringify(SP().profile || { goal: 'general', level: 1, equip: ['none'], days: 3, length: 45, weak: [] }));
      const changed = JSON.stringify(P) !== JSON.stringify(SP().profile);
      SP().profile = P; pfDraft = null;
      if (changed || !SP().plan.start) SP().plan = { start: today(), idx: 0 };
      SP().goal.sessions = P.days; SP().goal.mins = P.days * P.length;
      save(); render(); toast(t('pf_saved')); return;
    }
    if (f.id === 'sp-quick') {
      const fd = new FormData(f), act = fd.get('act'), mins = clamp(+fd.get('mins') || 30, 1, 600);
      const km = +fd.get('km') || null, rpe = +fd.get('rpe') || 6;
      const type = ['run', 'bike', 'swim', 'walk'].includes(act) ? 'cardio' : act === 'yoga' ? 'mobility' : 'sport';
      const xp = finishWorkout({ id: uid(), at: Date.now(), start: Date.now() - mins * 60000, type, title: t('ac_' + act), activity: act, mins, km, rpe, notes: String(fd.get('notes') || '').trim(), exercises: [] });
      toast(t('sp_logged', { xp })); SP().tab = 'history'; save(); render();
    }
    if (f.id === 'bd-wform') {
      const kg = +new FormData(f).get('kg'); if (!(kg > 20)) return;
      const B = SP().body, ex2 = B.find(x => x.day === today());
      if (ex2) ex2.kg = kg; else B.push({ day: today(), kg });
      save(); render(); toast(t('bd_saved'));
    }
  });

  // v1 used tab names 'workout', 'chrono', 'records'
  on('loaded', () => { const m = { workout: 'today', chrono: 'timer', records: 'stats' }; if (m[SP().tab]) SP().tab = m[SP().tab]; if (SP().active && !SP().active.mode) SP().active.mode = 'log'; });
  on('started', applySection);
  on('render', () => { if (S.section === 'sport' && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('#sport-root input, #sport-root textarea, #sport-root select'))) render(); });
})();
