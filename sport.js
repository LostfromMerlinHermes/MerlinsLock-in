// Sport section (the app's second big section, next to Work): energy check, workout logger with templates,
// rest timer, interval timer (Tabata / EMOM / HIIT / stopwatch / countdown), cardio quick log, history,
// personal records, body tracking (weight, water, sleep) and a weekly goal. Shares XP and gold with Work.
(() => {
  'use strict';
  const { $, S, t, tn, esc, save, on, emit, toast, uid, today, dayKey, parseDay, addDays, fmtMins, clamp } = ML;
  const FR = (navigator.language || 'fr').toLowerCase().startsWith('fr');

  ML.addStrings({
    fr: {
      sec_work: 'Travail', sec_sport: 'Sport',
      sp_workout: 'Séance', sp_chrono: 'Chrono', sp_history: 'Historique', sp_records: 'Records', sp_body: 'Corps',
      en_recovery: 'Récup', en_normal: 'Normal', en_beast: 'Beast mode',
      en_line_recovery: 'Récupération : mobilité, marche ou cardio léger, 20–30 min. Repos entre séries : 2 min.',
      en_line_normal: 'Forme normale : séance classique. Repos entre séries : 90 s.',
      en_line_beast: 'Beast mode : grosse séance ou HIIT. Repos entre séries : 60 s.',
      sp_goal: 'Objectif de la semaine', sp_goal_line: '{s}/{gs} séances · {m}/{gm}', sp_week_streak_one: '{n} semaine d’affilée', sp_week_streak: '{n} semaines d’affilée',
      sp_suggest: 'Suggestion du jour : {name}', sp_start: 'Commencer', sp_free: 'Séance libre', sp_templates: 'Programmes', sp_quick: 'Activité cardio ou sport',
      sp_activity: 'Activité', sp_duration: 'Durée (min)', sp_distance: 'Distance (km)', sp_rpe: 'Effort ressenti', sp_notes_ph: 'Notes (sensations, parcours…)', sp_log: 'Enregistrer l’activité',
      sp_logged: 'Activité enregistrée. +{xp} XP', sp_ex_n_one: '{n} exercice', sp_ex_n: '{n} exercices',
      sp_elapsed: 'Durée', sp_volume: 'Volume', sp_sets_done: 'Séries', sp_add_set: '+ Série', sp_add_ex: 'Ajouter un exercice', sp_ex_ph: 'Nom de l’exercice', sp_last: 'Dernière fois : {s}',
      sp_finish: 'Terminer la séance', sp_cancel: 'Abandonner', sp_finish_h: 'Séance terminée', sp_saved: 'Séance enregistrée. +{xp} XP', sp_new_pr: 'Nouveau record : {ex} {set}',
      sp_rest: 'Repos', sp_rest_skip: 'Passer', sp_rest_len: 'Repos entre séries', sp_reps: 'rép.', sp_sec: 's', sp_kg: 'kg', sp_remove: 'Retirer',
      ch_tabata: 'Tabata', ch_emom: 'EMOM', ch_hiit: 'HIIT perso', ch_stopwatch: 'Chrono', ch_countdown: 'Minuteur',
      ch_work: 'Effort', ch_restp: 'Repos', ch_prep: 'Prépare-toi', ch_done: 'Terminé !', ch_round: 'Tour {r}/{n}', ch_rounds: 'Tours', ch_work_s: 'Effort (s)', ch_rest_s: 'Repos (s)', ch_minutes: 'Minutes',
      ch_start: 'Go', ch_pause: 'Pause', ch_resume: 'Reprendre', ch_reset: 'Reset', ch_lap: 'Tour', ch_music: 'Musique d’entraînement', ch_voice: 'Annonces vocales', ch_total: 'Total {t}',
      ch_logged: 'Entraînement {name} enregistré. +{xp} XP', ch_go: 'C’est parti', ch_rest_say: 'Repos',
      hi_week: '7 derniers jours', hi_empty: 'Pas encore de séance. Lance un programme ou enregistre une activité.', hi_delete: 'Supprimer', hi_deleted: 'Séance supprimée',
      rec_empty: 'Tes records apparaîtront ici après tes premières séances avec des charges.', rec_e1rm: '1RM estimé', rec_best: 'Meilleure série', rec_reps: 'Max répétitions',
      bd_weight: 'Poids', bd_weight_ph: 'kg', bd_add: 'Ajouter', bd_water: 'Eau aujourd’hui', bd_water_goal: 'objectif {n} verres', bd_sleep: 'Sommeil la nuit dernière', bd_hours: 'h',
      bd_goal_set: 'Objectif hebdo', bd_goal_s: 'Séances', bd_goal_m: 'Minutes', bd_saved: 'Enregistré',
      ty_strength: 'Muscu', ty_cardio: 'Cardio', ty_hiit: 'HIIT', ty_sport: 'Sport', ty_mobility: 'Mobilité',
      ac_run: 'Course', ac_bike: 'Vélo', ac_swim: 'Natation', ac_walk: 'Marche', ac_football: 'Football', ac_basket: 'Basket', ac_tennis: 'Tennis', ac_boxing: 'Boxe', ac_climb: 'Escalade', ac_yoga: 'Yoga', ac_dance: 'Danse', ac_other: 'Autre',
    },
    en: {
      sec_work: 'Work', sec_sport: 'Sport',
      sp_workout: 'Workout', sp_chrono: 'Timer', sp_history: 'History', sp_records: 'Records', sp_body: 'Body',
      en_recovery: 'Recovery', en_normal: 'Normal', en_beast: 'Beast mode',
      en_line_recovery: 'Recovery: mobility, walking or light cardio, 20–30 min. Rest between sets: 2 min.',
      en_line_normal: 'Normal shape: a classic session. Rest between sets: 90 s.',
      en_line_beast: 'Beast mode: a big session or HIIT. Rest between sets: 60 s.',
      sp_goal: 'Weekly goal', sp_goal_line: '{s}/{gs} sessions · {m}/{gm}', sp_week_streak_one: '{n} week in a row', sp_week_streak: '{n} weeks in a row',
      sp_suggest: "Today's suggestion: {name}", sp_start: 'Start', sp_free: 'Free workout', sp_templates: 'Programs', sp_quick: 'Cardio or sport activity',
      sp_activity: 'Activity', sp_duration: 'Duration (min)', sp_distance: 'Distance (km)', sp_rpe: 'Perceived effort', sp_notes_ph: 'Notes (how it felt, route…)', sp_log: 'Save activity',
      sp_logged: 'Activity saved. +{xp} XP', sp_ex_n_one: '{n} exercise', sp_ex_n: '{n} exercises',
      sp_elapsed: 'Time', sp_volume: 'Volume', sp_sets_done: 'Sets', sp_add_set: '+ Set', sp_add_ex: 'Add an exercise', sp_ex_ph: 'Exercise name', sp_last: 'Last time: {s}',
      sp_finish: 'Finish workout', sp_cancel: 'Discard', sp_finish_h: 'Workout done', sp_saved: 'Workout saved. +{xp} XP', sp_new_pr: 'New record: {ex} {set}',
      sp_rest: 'Rest', sp_rest_skip: 'Skip', sp_rest_len: 'Rest between sets', sp_reps: 'reps', sp_sec: 's', sp_kg: 'kg', sp_remove: 'Remove',
      ch_tabata: 'Tabata', ch_emom: 'EMOM', ch_hiit: 'Custom HIIT', ch_stopwatch: 'Stopwatch', ch_countdown: 'Countdown',
      ch_work: 'Work', ch_restp: 'Rest', ch_prep: 'Get ready', ch_done: 'Done!', ch_round: 'Round {r}/{n}', ch_rounds: 'Rounds', ch_work_s: 'Work (s)', ch_rest_s: 'Rest (s)', ch_minutes: 'Minutes',
      ch_start: 'Go', ch_pause: 'Pause', ch_resume: 'Resume', ch_reset: 'Reset', ch_lap: 'Lap', ch_music: 'Workout music', ch_voice: 'Voice cues', ch_total: 'Total {t}',
      ch_logged: '{name} workout saved. +{xp} XP', ch_go: 'Go', ch_rest_say: 'Rest',
      hi_week: 'Last 7 days', hi_empty: 'No workouts yet. Start a program or log an activity.', hi_delete: 'Delete', hi_deleted: 'Workout deleted',
      rec_empty: 'Your records show up here after your first weighted workouts.', rec_e1rm: 'Estimated 1RM', rec_best: 'Best set', rec_reps: 'Max reps',
      bd_weight: 'Weight', bd_weight_ph: 'kg', bd_add: 'Add', bd_water: 'Water today', bd_water_goal: 'goal {n} glasses', bd_sleep: 'Sleep last night', bd_hours: 'h',
      bd_goal_set: 'Weekly goal', bd_goal_s: 'Sessions', bd_goal_m: 'Minutes', bd_saved: 'Saved',
      ty_strength: 'Strength', ty_cardio: 'Cardio', ty_hiit: 'HIIT', ty_sport: 'Sport', ty_mobility: 'Mobility',
      ac_run: 'Running', ac_bike: 'Cycling', ac_swim: 'Swimming', ac_walk: 'Walking', ac_football: 'Football', ac_basket: 'Basketball', ac_tennis: 'Tennis', ac_boxing: 'Boxing', ac_climb: 'Climbing', ac_yoga: 'Yoga', ac_dance: 'Dance', ac_other: 'Other',
    },
  });

  const ex = (fr, en, sets, reps, unit = 'reps', kg = 0) => ({ name: FR ? fr : en, sets, reps, unit, kg });
  const TEMPLATES = () => [
    { id: 'full', name: FR ? 'Full body' : 'Full body', type: 'strength', est: 45, exercises: [ex('Squat', 'Squat', 3, 10), ex('Pompes', 'Push-ups', 3, 12), ex('Rowing haltère', 'Dumbbell row', 3, 10), ex('Fentes', 'Lunges', 3, 10), ex('Planche', 'Plank', 3, 45, 'sec')] },
    { id: 'push', name: 'Push', type: 'strength', est: 50, exercises: [ex('Développé couché', 'Bench press', 4, 8), ex('Développé militaire', 'Overhead press', 3, 10), ex('Dips', 'Dips', 3, 10), ex('Élévations latérales', 'Lateral raises', 3, 12), ex('Extensions triceps', 'Triceps extensions', 3, 12)] },
    { id: 'pull', name: 'Pull', type: 'strength', est: 50, exercises: [ex('Tractions', 'Pull-ups', 4, 6), ex('Rowing barre', 'Barbell row', 4, 8), ex('Tirage vertical', 'Lat pulldown', 3, 10), ex('Curl biceps', 'Biceps curl', 3, 12), ex('Face pull', 'Face pull', 3, 15)] },
    { id: 'legs', name: FR ? 'Jambes' : 'Legs', type: 'strength', est: 55, exercises: [ex('Squat', 'Squat', 4, 8), ex('Soulevé de terre roumain', 'Romanian deadlift', 3, 10), ex('Presse à cuisses', 'Leg press', 3, 12), ex('Leg curl', 'Leg curl', 3, 12), ex('Mollets', 'Calf raises', 4, 15)] },
    { id: 'abs', name: FR ? 'Abdos express' : 'Express abs', type: 'strength', est: 12, exercises: [ex('Crunch', 'Crunch', 3, 20), ex('Planche', 'Plank', 3, 45, 'sec'), ex('Relevés de jambes', 'Leg raises', 3, 12), ex('Russian twist', 'Russian twist', 3, 20)] },
    { id: 'mobility', name: FR ? 'Mobilité' : 'Mobility', type: 'mobility', est: 15, exercises: [ex('Chat-vache', 'Cat-cow', 1, 60, 'sec'), ex('Pigeon (chaque côté)', 'Pigeon (each side)', 2, 60, 'sec'), ex('Étirement ischios', 'Hamstring stretch', 2, 45, 'sec'), ex('Ouverture d’épaules', 'Shoulder opener', 2, 45, 'sec'), ex('Respiration profonde', 'Deep breathing', 1, 60, 'sec')] },
  ];
  const ACTIVITIES = ['run', 'bike', 'swim', 'walk', 'football', 'basket', 'tennis', 'boxing', 'climb', 'yoga', 'dance', 'other'];
  const REST_BY_ENERGY = { recovery: 120, normal: 90, beast: 60 };
  const TYPE_ICON = { strength: '🏋', cardio: '🏃', hiit: '⚡', sport: '⚽', mobility: '🧘' };

  ML.defaults(() => ({
    section: 'work',
    sport: {
      tab: 'workout', energy: 'normal', energyDay: null, rest: 90, goal: { sessions: 3, mins: 150 },
      templates: TEMPLATES(), workouts: [], active: null, prs: {}, body: [], water: { day: null, n: 0 }, waterGoal: 8, sleep: {},
      chrono: { mode: 'tabata', work: 20, rest: 10, rounds: 8, emom: 10, countdown: 10, music: false, voice: true },
    },
  }));
  const SP = () => S.sport;

  /* ---------- Section switch (Work ↔ Sport) ---------- */
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

  /* ---------- Beeps + voice (own small context, unlocked on taps in the sport view) ---------- */
  let bctx = null;
  function beepCtx() { try { bctx = bctx || new (window.AudioContext || window.webkitAudioContext)(); if (bctx.state !== 'running') { const p = bctx.resume(); if (p && p.catch) p.catch(() => {}); } } catch (e) { bctx = null; } return bctx; }
  function beep(f = 880, dur = 0.12, vol = 0.25) {
    const c = beepCtx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime;
    o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0005, t0 + dur);
    o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function say(text) {
    if (!SP().chrono.voice || !('speechSynthesis' in window)) return;
    try { const u = new SpeechSynthesisUtterance(text); u.lang = ML.locale(); u.rate = 1.05; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
  }
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  /* ---------- Helpers ---------- */
  const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayKey(d); };
  const inThisWeek = ts => dayKey(new Date(ts)) >= weekStart();
  const fmtClock = MiniView.fmtClock;
  const volumeOf = exs => exs.reduce((a, e) => a + e.sets.filter(s => s.done && e.unit !== 'sec').reduce((b, s) => b + (+s.kg || 0) * (+s.reps || 0), 0), 0);
  const setsDone = exs => exs.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  const e1rm = (kg, reps) => (kg > 0 && reps > 0 ? kg * (1 + reps / 30) : 0);
  const setLabel = (s, unit) => unit === 'sec' ? `${s.reps} ${t('sp_sec')}` : (+s.kg ? `${s.kg} ${t('sp_kg')} × ${s.reps}` : `${s.reps} ${t('sp_reps')}`);
  function lastPerf(name) {
    for (let i = SP().workouts.length - 1; i >= 0; i--) {
      const e = (SP().workouts[i].exercises || []).find(x => x.name.toLowerCase() === name.toLowerCase());
      if (e) { const done = e.sets.filter(s => s.done); if (done.length) return { e, done }; }
    }
    return null;
  }
  function weekStats() {
    const ws = SP().workouts.filter(w => inThisWeek(w.at));
    return { n: ws.length, mins: ws.reduce((a, w) => a + w.mins, 0) };
  }
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
  function suggestion() {
    const e = SP().energy, tpl = SP().templates;
    if (e === 'recovery') return tpl.find(x => x.id === 'mobility') || tpl[0];
    if (e === 'beast') return { id: 'chrono-tabata', name: 'Tabata HIIT', chrono: true };
    const order = ['push', 'pull', 'legs'];
    const last = [...SP().workouts].reverse().find(w => order.includes(w.templateId));
    return tpl.find(x => x.id === (last ? order[(order.indexOf(last.templateId) + 1) % 3] : 'full')) || tpl[0];
  }

  /* ---------- Saving a workout (XP, gold via the xp event, records) ---------- */
  function finishWorkout(w) {
    const prs = [];
    (w.exercises || []).forEach(e => {
      e.sets.filter(s => s.done).forEach(s => {
        const P = SP().prs[e.name] || {};
        if (e.unit === 'sec') return;
        const est = e1rm(+s.kg, +s.reps);
        if (est > (P.e1rm || 0)) { SP().prs[e.name] = Object.assign({}, P, { e1rm: Math.round(est * 10) / 10, kg: +s.kg, reps: +s.reps, at: Date.now() }); prs.push({ ex: e.name, set: setLabel(s, e.unit) }); }
        else if (!(+s.kg) && +s.reps > (P.maxReps || 0)) { SP().prs[e.name] = Object.assign({}, P, { maxReps: +s.reps, at: Date.now() }); if (P.maxReps) prs.push({ ex: e.name, set: setLabel(s, e.unit) }); }
      });
    });
    const xp = Math.round(w.mins + setsDone(w.exercises || []) * 3 + prs.length * 20 + (w.rpe ? w.rpe * 2 : 0));
    w.xp = xp; w.prs = prs;
    SP().workouts.push(w);
    if (SP().workouts.length > 1500) SP().workouts = SP().workouts.slice(-1500);
    ML.addXp(xp); save();
    if (ML.burst) ML.burst(document.documentElement.dataset.theme);
    if (ML.sfx) ML.sfx(prs.length ? 'level' : 'session');
    prs.forEach((p, i) => setTimeout(() => toast('🏆 ' + t('sp_new_pr', p)), 400 + i * 300));
    emit('workout', w);
    return xp;
  }

  /* ---------- Active workout ---------- */
  function startTemplate(tp) {
    SP().active = {
      id: uid(), templateId: tp ? tp.id : null, title: tp ? tp.name : t('sp_free'), type: tp ? tp.type : 'strength', startedAt: Date.now(),
      exercises: tp ? tp.exercises.map(e => {
        const lp = lastPerf(e.name);
        return { name: e.name, unit: e.unit, sets: Array.from({ length: e.sets }, (_, i) => ({ reps: lp && lp.done[i] ? lp.done[i].reps : e.reps, kg: lp && lp.done[i] ? lp.done[i].kg : (e.kg || ''), done: false })) };
      }) : [], notes: '',
    };
    SP().tab = 'workout'; save(); render();
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

  /* ---------- Interval timer ---------- */
  let ch = { running: false, t0: 0, pausedAt: 0, paused: 0, phases: [], laps: [], lastIdx: -1, lastSec: null, iv: null, done: false };
  function buildPhases() {
    const C = SP().chrono, P = [];
    const prep = { kind: 'prep', dur: 10 };
    if (C.mode === 'tabata') { P.push(prep); for (let r = 1; r <= 8; r++) { P.push({ kind: 'work', dur: 20, r, n: 8 }); if (r < 8) P.push({ kind: 'rest', dur: 10, r, n: 8 }); } }
    if (C.mode === 'hiit') { P.push(prep); for (let r = 1; r <= C.rounds; r++) { P.push({ kind: 'work', dur: C.work, r, n: C.rounds }); if (r < C.rounds) P.push({ kind: 'rest', dur: C.rest, r, n: C.rounds }); } }
    if (C.mode === 'emom') { P.push(prep); for (let r = 1; r <= C.emom; r++) P.push({ kind: 'work', dur: 60, r, n: C.emom }); }
    if (C.mode === 'countdown') P.push({ kind: 'work', dur: C.countdown * 60, r: 1, n: 1 });
    return P;
  }
  const chElapsed = () => !ch.t0 ? 0 : ((ch.running ? Date.now() : ch.pausedAt) - ch.t0 - ch.paused) / 1000;
  function chStart() {
    beepCtx();
    if (ch.running) { ch.running = false; ch.pausedAt = Date.now(); if (SP().chrono.music && ML.Audio) ML.Audio.workout(false); renderChrono(); return; }
    if (!ch.t0 || ch.done) { ch = Object.assign(ch, { t0: Date.now(), paused: 0, phases: buildPhases(), laps: [], lastIdx: -1, lastSec: null, done: false }); }
    else ch.paused += Date.now() - ch.pausedAt;
    ch.running = true;
    if (SP().chrono.music && ML.Audio) ML.Audio.workout(true);
    clearInterval(ch.iv); ch.iv = setInterval(chTick, 100); chTick(); renderChrono();
  }
  function chReset() { clearInterval(ch.iv); if (ch.running && SP().chrono.music && ML.Audio) ML.Audio.workout(false); ch = { running: false, t0: 0, pausedAt: 0, paused: 0, phases: [], laps: [], lastIdx: -1, lastSec: null, iv: null, done: false }; renderChrono(); }
  function chTick() {
    const C = SP().chrono, el = chElapsed();
    if (C.mode === 'stopwatch') { const c = $('ch-clock'); if (c) c.textContent = fmtClock(el) + '.' + Math.floor((el % 1) * 10); return; }
    let acc = 0, idx = -1;
    for (let i = 0; i < ch.phases.length; i++) { if (el < acc + ch.phases[i].dur) { idx = i; break; } acc += ch.phases[i].dur; }
    const total = ch.phases.reduce((a, p) => a + p.dur, 0);
    if (idx === -1) { // finished
      clearInterval(ch.iv); ch.running = false; ch.done = true; beep(990, 0.5); buzz([300, 100, 300]); say(t('ch_done'));
      if (C.music && ML.Audio) ML.Audio.workout(false);
      const mins = Math.max(1, Math.round(total / 60)), name = t('ch_' + C.mode);
      const xp = finishWorkout({ id: uid(), at: Date.now(), start: Date.now() - total * 1000, type: 'hiit', title: name, mins, exercises: [], rpe: C.mode === 'tabata' ? 8 : 7 });
      toast(t('ch_logged', { name, xp }));
      renderChrono(); return;
    }
    const ph = ch.phases[idx], left = acc + ph.dur - el, sec = Math.ceil(left);
    if (idx !== ch.lastIdx) {
      ch.lastIdx = idx;
      if (ph.kind === 'work') { beep(990, 0.3); buzz(150); say(C.mode === 'emom' ? String(ph.r) : t('ch_go')); }
      else if (ph.kind === 'rest') { beep(520, 0.3); say(t('ch_rest_say')); }
      renderChrono();
    }
    if (sec !== ch.lastSec && sec <= 3 && sec > 0) beep(660, 0.08);
    ch.lastSec = sec;
    const c = $('ch-clock'); if (c) c.textContent = fmtClock(left);
    const b = $('ch-bar'); if (b) b.style.width = (100 * (1 - left / ph.dur)).toFixed(1) + '%';
    const tt = $('ch-total'); if (tt) tt.textContent = t('ch_total', { t: fmtClock(total - el) });
  }

  /* ---------- Rendering ---------- */
  const TABS = ['workout', 'chrono', 'history', 'records', 'body'];
  function headHtml() {
    const G = SP().goal, w = weekStats(), streak = weekStreak();
    const pct = Math.min(1, Math.max(w.n / G.sessions, w.mins / G.mins));
    return `<div class="sp-head">
      <div class="sp-energy" role="group">${['recovery', 'normal', 'beast'].map(k => `<button type="button" class="mood-chip en-${k}" data-energy="${k}" aria-pressed="${SP().energy === k}">${esc(t('en_' + k))}</button>`).join('')}</div>
      <p class="mood-line">${esc(t('en_line_' + SP().energy))}</p>
      <div class="sp-goal">
        <svg viewBox="0 0 36 36" class="sp-ring" aria-hidden="true"><circle cx="18" cy="18" r="15" class="tr"/><circle cx="18" cy="18" r="15" class="pr" style="stroke-dasharray:${(pct * 94.25).toFixed(1)} 94.25"/></svg>
        <div><span class="label">${esc(t('sp_goal'))}</span><b>${esc(t('sp_goal_line', { s: w.n, gs: G.sessions, m: fmtMins(w.mins), gm: fmtMins(G.mins) }))}</b>
        ${streak ? `<small>🔥 ${esc(tn('sp_week_streak', streak))}</small>` : ''}</div>
      </div>
    </div>
    <div class="tabs sp-tabs" role="tablist">${TABS.map(k => `<button type="button" role="tab" data-sptab="${k}" aria-selected="${SP().tab === k}">${esc(t('sp_' + k))}</button>`).join('')}</div>`;
  }
  function workoutHtml() {
    const A = SP().active;
    if (!A) {
      const sug = suggestion();
      return `<div class="sp-card sp-suggest"><span class="label">✦ ${esc(t('sp_suggest', { name: sug.name }))}</span>
          <button type="button" class="primary" data-start="${sug.id}">${esc(t('sp_start'))} →</button></div>
        <h2>${esc(t('sp_templates'))}</h2>
        <div class="sp-tpls">${SP().templates.map(tp => `<button type="button" class="sp-tpl" data-start="${tp.id}">
          <b>${TYPE_ICON[tp.type] || '🏋'} ${esc(tp.name)}</b><small>${esc(tn('sp_ex_n', tp.exercises.length))} · ~${tp.est} min</small>
          <span>${esc(tp.exercises.map(e => e.name).slice(0, 4).join(', '))}${tp.exercises.length > 4 ? '…' : ''}</span></button>`).join('')}
          <button type="button" class="sp-tpl free" data-start="free"><b>+ ${esc(t('sp_free'))}</b><small>${esc(t('sp_add_ex'))}</small></button></div>
        <h2>${esc(t('sp_quick'))}</h2>
        <form class="sp-card sp-quick" id="sp-quick">
          <div class="t-edit-row">
            <label><span>${esc(t('sp_activity'))}</span><select name="act">${ACTIVITIES.map(a => `<option value="${a}">${esc(t('ac_' + a))}</option>`).join('')}</select></label>
            <label><span>${esc(t('sp_duration'))}</span><input type="number" name="mins" min="1" max="600" value="30" inputmode="numeric"></label>
            <label><span>${esc(t('sp_distance'))}</span><input type="number" name="km" min="0" max="500" step="0.1" placeholder="—" inputmode="decimal"></label>
          </div>
          <label class="d-slider"><span>${esc(t('sp_rpe'))} <b id="sp-rpe-v">6</b>/10</span><input type="range" name="rpe" min="1" max="10" value="6" id="sp-rpe"></label>
          <input type="text" name="notes" maxlength="200" placeholder="${esc(t('sp_notes_ph'))}">
          <button type="submit" class="primary">${esc(t('sp_log'))}</button>
        </form>`;
    }
    const vol = volumeOf(A.exercises);
    return `<div class="sp-card sp-active">
        <div class="sp-active-head"><h3>${TYPE_ICON[A.type] || '🏋'} ${esc(A.title)}</h3>
          <div class="sp-stats"><span><small>${esc(t('sp_elapsed'))}</small><b id="sp-elapsed">${fmtClock((Date.now() - A.startedAt) / 1000)}</b></span>
          <span><small>${esc(t('sp_sets_done'))}</small><b>${setsDone(A.exercises)}</b></span>
          <span><small>${esc(t('sp_volume'))}</small><b>${Math.round(vol)} kg</b></span></div></div>
        <div class="sp-rest-set"><span class="label">${esc(t('sp_rest_len'))}</span>${[30, 60, 90, 120, 180].map(s => `<button type="button" class="chip-btn" data-restlen="${s}" aria-pressed="${SP().rest === s}">${s < 60 ? s + ' s' : s / 60 + ' min'}</button>`).join('')}</div>
        ${A.exercises.map((e, ei) => {
          const lp = lastPerf(e.name);
          return `<div class="sp-ex" data-ei="${ei}">
            <div class="sp-ex-head"><b>${esc(e.name)}</b><button type="button" class="icon-btn" data-exdel="${ei}" aria-label="${esc(t('sp_remove'))}">✕</button></div>
            ${lp ? `<small class="hint">${esc(t('sp_last', { s: lp.done.map(s => setLabel(s, lp.e.unit)).join(' · ') }))}</small>` : ''}
            <div class="sp-sets">${e.sets.map((s, si) => `<div class="sp-set ${s.done ? 'done' : ''}">
              <span class="sp-n">${si + 1}</span>
              <label><input type="number" data-f="reps" data-ei="${ei}" data-si="${si}" value="${esc(s.reps)}" min="0" max="999" inputmode="numeric"><small>${e.unit === 'sec' ? esc(t('sp_sec')) : esc(t('sp_reps'))}</small></label>
              ${e.unit === 'sec' ? '<span></span>' : `<label><input type="number" data-f="kg" data-ei="${ei}" data-si="${si}" value="${esc(s.kg)}" min="0" max="999" step="0.5" inputmode="decimal" placeholder="—"><small>${esc(t('sp_kg'))}</small></label>`}
              <button type="button" class="sp-check" data-done="${ei}:${si}" aria-pressed="${s.done}">✓</button></div>`).join('')}</div>
            <button type="button" class="small ghost" data-addset="${ei}">${esc(t('sp_add_set'))}</button>
          </div>`;
        }).join('')}
        <form class="sp-addex" id="sp-addex"><input type="text" name="name" list="sp-exlist" maxlength="60" placeholder="${esc(t('sp_ex_ph'))}"><button type="submit" class="small">${esc(t('sp_add_ex'))}</button>
          <datalist id="sp-exlist">${[...new Set([].concat(...SP().templates.map(tp => tp.exercises.map(e => e.name)), ...SP().workouts.map(w => (w.exercises || []).map(e => e.name))))].map(n => `<option value="${esc(n)}">`).join('')}</datalist></form>
        <textarea id="sp-wnotes" rows="2" placeholder="${esc(t('sp_notes_ph'))}">${esc(A.notes || '')}</textarea>
        <label class="d-slider"><span>${esc(t('sp_rpe'))} <b id="sp-arpe-v">${A.rpe || 7}</b>/10</span><input type="range" id="sp-arpe" min="1" max="10" value="${A.rpe || 7}"></label>
        <div class="controls sp-end"><button type="button" class="ghost danger" id="sp-cancel">${esc(t('sp_cancel'))}</button><button type="button" class="primary" id="sp-finish">${esc(t('sp_finish'))}</button></div>
      </div>
      <div class="sp-rest" id="sp-rest" hidden><span class="label">${esc(t('sp_rest'))}</span><b id="sp-rest-clock">0:00</b><i><b id="sp-rest-bar"></b></i><button type="button" class="small" id="sp-rest-skip">${esc(t('sp_rest_skip'))}</button></div>`;
  }
  function chronoHtml() {
    const C = SP().chrono, modes = ['tabata', 'emom', 'hiit', 'stopwatch', 'countdown'];
    const ph = ch.phases[ch.lastIdx];
    const phaseCls = ch.done ? 'done' : ph ? ph.kind : 'idle';
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
        <div class="ch-clock" id="ch-clock">${C.mode === 'stopwatch' ? fmtClock(chElapsed()) + '.0' : fmtClock(ph ? 0 : (buildPhases().reduce((a, p) => a + p.dur, 0)))}</div>
        <div class="deep-bar"><b id="ch-bar"></b></div>
        <small id="ch-total"></small>
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
      <ul class="sp-hist">${[...ws].reverse().slice(0, 40).map(w => `<li>
        <span class="sp-ico">${TYPE_ICON[w.type] || '🏋'}</span>
        <div><b>${esc(w.title)}</b><small>${esc(new Date(w.at).toLocaleDateString(ML.locale(), { weekday: 'short', day: 'numeric', month: 'short' }))} · ${fmtMins(w.mins)}${w.km ? ' · ' + w.km + ' km' : ''}${w.exercises && w.exercises.length ? ' · ' + Math.round(volumeOf(w.exercises)) + ' kg' : ''}${w.rpe ? ' · RPE ' + w.rpe : ''}${w.prs && w.prs.length ? ' · 🏆 ' + w.prs.length : ''}</small>
        ${w.notes ? `<span class="hint">${esc(w.notes)}</span>` : ''}</div>
        <button type="button" class="icon-btn" data-hdel="${w.id}" aria-label="${esc(t('hi_delete'))}">✕</button></li>`).join('')}</ul>`;
  }
  function recordsHtml() {
    const P = Object.entries(SP().prs).sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
    if (!P.length) return `<p class="hint">${esc(t('rec_empty'))}</p>`;
    const spark = name => {
      const pts = SP().workouts.map(w => { const e = (w.exercises || []).find(x => x.name === name); if (!e) return null; const best = Math.max(0, ...e.sets.filter(s => s.done).map(s => e1rm(+s.kg, +s.reps) || +s.reps)); return best || null; }).filter(Boolean).slice(-12);
      if (pts.length < 2) return '';
      const mx = Math.max(...pts), mn = Math.min(...pts), W = 90, H = 24;
      const d = pts.map((v, i) => `${(i / (pts.length - 1) * W).toFixed(1)},${(H - (mx === mn ? H / 2 : (v - mn) / (mx - mn) * (H - 4) + 2)).toFixed(1)}`).join(' ');
      return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${d}"/></svg>`;
    };
    return `<ul class="sp-recs">${P.map(([name, r]) => `<li><div><b>${esc(name)}</b><small>${r.e1rm ? esc(t('rec_best')) + ' : ' + r.kg + ' kg × ' + r.reps + ' · ' + esc(t('rec_e1rm')) + ' ' + r.e1rm + ' kg' : esc(t('rec_reps')) + ' : ' + r.maxReps}</small></div>${spark(name)}</li>`).join('')}</ul>`;
  }
  function bodyHtml() {
    const B = SP().body, last = B.slice(-30), W = SP().water, water = W.day === today() ? W.n : 0, G = SP().goal;
    let spark = '';
    if (last.length > 1) {
      const vals = last.map(x => x.kg), mx = Math.max(...vals), mn = Math.min(...vals), w = 300, h = 60;
      spark = `<svg class="spark big" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${vals.map((v, i) => `${(i / (vals.length - 1) * w).toFixed(1)},${(h - (mx === mn ? h / 2 : (v - mn) / (mx - mn) * (h - 8) + 4)).toFixed(1)}`).join(' ')}"/></svg>`;
    }
    return `<div class="sp-card"><h2>${esc(t('bd_weight'))}</h2>
        <form class="sp-row" id="bd-wform"><input type="number" name="kg" min="20" max="400" step="0.1" placeholder="${esc(t('bd_weight_ph'))}" inputmode="decimal"><button type="submit" class="small primary">${esc(t('bd_add'))}</button></form>
        ${spark}${last.length ? `<small class="hint">${last.slice(-5).reverse().map(x => esc(parseDay(x.day).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' })) + ' : ' + x.kg + ' kg').join(' · ')}</small>` : ''}</div>
      <div class="sp-card"><h2>${esc(t('bd_water'))} · ${esc(t('bd_water_goal', { n: SP().waterGoal }))}</h2>
        <div class="sp-water">${Array.from({ length: Math.max(SP().waterGoal, water) }, (_, i) => `<span class="glass ${i < water ? 'full' : ''}"></span>`).join('')}</div>
        <div class="sp-row"><button type="button" class="small" data-water="-1">−</button><b>${water}</b><button type="button" class="small primary" data-water="1">+</button></div></div>
      <div class="sp-card"><h2>${esc(t('bd_sleep'))}</h2>
        <div class="sp-row">${[5, 6, 7, 8, 9].map(h => `<button type="button" class="chip-btn" data-sleep="${h}" aria-pressed="${SP().sleep[today()] === h}">${h} ${esc(t('bd_hours'))}</button>`).join('')}</div></div>
      <div class="sp-card"><h2>${esc(t('bd_goal_set'))}</h2><div class="t-edit-row">
        <label><span>${esc(t('bd_goal_s'))}</span><input type="number" id="bd-gs" min="1" max="14" value="${G.sessions}"></label>
        <label><span>${esc(t('bd_goal_m'))}</span><input type="number" id="bd-gm" min="10" max="2000" step="10" value="${G.mins}"></label></div></div>`;
  }
  let elapsedIv = null;
  function render() {
    const root = $('sport-root'); if (!root || root.hidden) return;
    if (SP().energyDay !== today()) { SP().energyDay = today(); SP().rest = REST_BY_ENERGY[SP().energy] || 90; }
    const tab = SP().tab;
    root.innerHTML = headHtml() + `<div class="sp-body">${tab === 'workout' ? workoutHtml() : tab === 'chrono' ? chronoHtml() : tab === 'history' ? historyHtml() : tab === 'records' ? recordsHtml() : bodyHtml()}</div>`;
    clearInterval(elapsedIv);
    if (tab === 'workout' && SP().active) elapsedIv = setInterval(() => { const el = $('sp-elapsed'); if (el && SP().active) el.textContent = fmtClock((Date.now() - SP().active.startedAt) / 1000); }, 1000);
    if (restEnd && $('sp-rest')) $('sp-rest').hidden = false;
  }
  const renderChrono = () => { if (SP().tab === 'chrono' && S.section === 'sport') render(); };

  /* ---------- Events ---------- */
  const root = $('sport-root');
  root.addEventListener('click', e => {
    beepCtx();
    const b = e.target.closest('button'); if (!b) return;
    const A = SP().active;
    if (b.dataset.sptab) { SP().tab = b.dataset.sptab; save(); render(); return; }
    if (b.dataset.energy) { SP().energy = b.dataset.energy; SP().rest = REST_BY_ENERGY[b.dataset.energy]; save(); render(); return; }
    if (b.dataset.start) {
      if (b.dataset.start === 'chrono-tabata') { SP().chrono.mode = 'tabata'; SP().tab = 'chrono'; save(); render(); return; }
      startTemplate(b.dataset.start === 'free' ? null : SP().templates.find(x => x.id === b.dataset.start)); return;
    }
    if (b.dataset.restlen) { SP().rest = +b.dataset.restlen; save(); render(); return; }
    if (b.dataset.done && A) {
      const [ei, si] = b.dataset.done.split(':').map(Number), s = A.exercises[ei].sets[si];
      s.done = !s.done; save(); render();
      if (s.done) { beep(880, 0.08); buzz(40); startRest(); } return;
    }
    if (b.dataset.addset && A) { const e2 = A.exercises[+b.dataset.addset], l = e2.sets[e2.sets.length - 1] || { reps: 10, kg: '' }; e2.sets.push({ reps: l.reps, kg: l.kg, done: false }); save(); render(); return; }
    if (b.dataset.exdel && A) { A.exercises.splice(+b.dataset.exdel, 1); save(); render(); return; }
    if (b.id === 'sp-rest-skip') { stopRest(); return; }
    if (b.id === 'sp-finish' && A) {
      stopRest();
      const mins = Math.max(1, Math.round((Date.now() - A.startedAt) / 60000));
      const w = { id: A.id, at: Date.now(), start: A.startedAt, type: A.type, title: A.title, templateId: A.templateId, mins, exercises: A.exercises, notes: A.notes, rpe: A.rpe || 7 };
      SP().active = null;
      const xp = finishWorkout(w);
      toast(t('sp_saved', { xp })); render(); return;
    }
    if (b.dataset.chmode) { if (ch.running) return; chReset(); SP().chrono.mode = b.dataset.chmode; save(); render(); return; }
    if (b.id === 'ch-go') { chStart(); return; }
    if (b.id === 'ch-reset') { chReset(); return; }
    if (b.id === 'ch-lap') { ch.laps.push(chElapsed()); render(); return; }
    if (b.dataset.hdel) { SP().workouts = SP().workouts.filter(w => w.id !== b.dataset.hdel); save(); render(); toast(t('hi_deleted')); return; }
    if (b.dataset.water) { const W = SP().water; if (W.day !== today()) { W.day = today(); W.n = 0; } W.n = clamp(W.n + +b.dataset.water, 0, 30); save(); render(); if (+b.dataset.water > 0) beep(1200, 0.05, 0.12); return; }
    if (b.dataset.sleep) { SP().sleep[today()] = +b.dataset.sleep; save(); render(); return; }
  });
  // Two-tap discard for the active workout
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
    if (el.dataset.ch) { SP().chrono[el.dataset.ch] = clamp(Math.round(+el.value) || 1, 0, 600); save(); return; }
  });
  root.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'ch-music') { SP().chrono.music = el.checked; save(); }
    if (el.id === 'ch-voice') { SP().chrono.voice = el.checked; save(); }
    if (el.id === 'bd-gs') { SP().goal.sessions = clamp(+el.value || 3, 1, 14); save(); toast(t('bd_saved')); }
    if (el.id === 'bd-gm') { SP().goal.mins = clamp(+el.value || 150, 10, 2000); save(); toast(t('bd_saved')); }
  });
  root.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (f.id === 'sp-quick') {
      const fd = new FormData(f), act = fd.get('act'), mins = clamp(+fd.get('mins') || 30, 1, 600);
      const km = +fd.get('km') || null, rpe = +fd.get('rpe') || 6;
      const type = ['run', 'bike', 'swim', 'walk'].includes(act) ? 'cardio' : act === 'yoga' ? 'mobility' : 'sport';
      const xp = finishWorkout({ id: uid(), at: Date.now(), start: Date.now() - mins * 60000, type, title: t('ac_' + act), activity: act, mins, km, rpe, notes: String(fd.get('notes') || '').trim(), exercises: [] });
      toast(t('sp_logged', { xp })); SP().tab = 'history'; save(); render();
    }
    if (f.id === 'sp-addex' && SP().active) {
      const name = String(new FormData(f).get('name') || '').trim(); if (!name) return;
      const lp = lastPerf(name);
      SP().active.exercises.push({ name, unit: lp ? lp.e.unit : 'reps', sets: lp ? lp.done.map(s => ({ reps: s.reps, kg: s.kg, done: false })) : [{ reps: 10, kg: '', done: false }, { reps: 10, kg: '', done: false }, { reps: 10, kg: '', done: false }] });
      save(); render();
    }
    if (f.id === 'bd-wform') {
      const kg = +new FormData(f).get('kg'); if (!(kg > 20)) return;
      const B = SP().body, ex2 = B.find(x => x.day === today());
      if (ex2) ex2.kg = kg; else B.push({ day: today(), kg });
      save(); render(); toast(t('bd_saved'));
    }
  });

  on('started', applySection);
  on('render', () => { if (S.section === 'sport' && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('#sport-root input, #sport-root textarea'))) render(); });
})();
