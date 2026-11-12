// Health (3.62, evening check since 3.76): four questions in the evening, one per screen, kept on this device (ML.priv,
// out of the sync). The page shows tonight, the week as a grid, and what goes with better focus in your own days.
// No calories, no weight, no food score, and no XP or streak on any of it: an answer that earns something stops being
// worth anything. The evening reminder: local alarm in the extension, Web Push in the installed app (the server only
// knows "send a reminder at 21:00", never the answers), and a card on Today from 19:00 everywhere (the artifact's only way).
(() => {
  'use strict';
  const { $, S, t, esc, on, dayKey, addDays, parseDay, fmtMins, IS_EXT } = ML;

  ML.addStrings({
    fr: {
      hl_h: 'Point santé', hl_intro: 'Quatre questions le soir, 15 secondes. Il relie ton corps à ton travail, à partir de tes propres journées. Reste sur cet appareil, jamais synchronisé. Ce n’est pas un avis médical.', hl_on: 'Activer', hl_off: 'Désactiver le point santé', hl_clear: 'Tout effacer',
      hl_set: 'Rappel et questions', hl_lines: 'Questions posées', hl_links: 'Ce qui marche pour toi', hl_wait: 'Les comparaisons arrivent après {n} soirs de chaque côté (par exemple {n} jours où tu as bougé et {n} où tu n’as pas bougé).', hl_note: 'Sur {n} jours. Ce sont des tendances chez toi, pas des causes.', hl_rating: 'Note de focus', hl_work: 'Temps de travail',
      ev_h: 'Ce soir', ev_card: 'Le point du soir', ev_sub: '{n} questions, 15 secondes', ev_go: 'Faire le point', ev_done: 'Fait ce soir', ev_edit: 'Modifier', ev_not: 'Pas ce soir', ev_step: '{i} sur {n}', ev_skip: 'Passer', ev_back: 'Retour', ev_hint: 'Touche une réponse pour continuer', ev_end: 'Noté. Bonne nuit.', ev_close: 'Fermer',
      qq_sleep: 'Combien as-tu dormi cette nuit ?', qq_water: 'Tu as assez bu aujourd’hui ?', qq_move: 'Tu as bougé aujourd’hui ?', qq_mood: 'Et le moral, aujourd’hui ?', qq_caffeine: 'Café ou boissons énergisantes ?', qq_alcohol: 'De l’alcool aujourd’hui ?', qq_meals: 'Tu as pris tes repas ?',
      q_sleep: 'Sommeil', q_water: 'Eau', q_move: 'Mouvement', q_mood: 'Moral', q_caffeine: 'Café', q_alcohol: 'Alcool', q_meals: 'Repas', q_focus: 'Focus',
      a_short: 'Moins de 7 h', a_mid: '7 à 8 h', a_long: '8 h et plus', a_low: 'Peu', a_ok: 'Bien', a_no: 'Non', a_yes: 'Oui', a_bad: 'Bas', a_med: 'Moyen', a_good: 'Bon', a_none: 'Aucun', a_some: 'Un peu', a_lots: 'Beaucoup',
      s_low: 'Moins de 1 litre', s_ok: '1 litre et plus', s_move_yes: '20 minutes de marche ou plus', s_some: '1 ou 2', s_lots: '3 et plus',
      f_sleep: 'Après 7 h de sommeil ou plus', f_water: 'Les jours où tu as bien bu', f_move: 'Les jours où tu as bougé', f_mood: 'Les jours où le moral est bon', f_caffeine: 'Les jours avec peu de café', f_alcohol: 'Les jours sans alcool', f_meals: 'Les jours où tu as pris tes repas',
      y_sleep: '7 h +', n_sleep: 'Moins', y_water: 'Bien bu', n_water: 'Peu bu', y_move: 'Bougé', n_move: 'Pas bougé', y_mood: 'Bon', n_mood: 'Moins bon', y_caffeine: 'Peu', n_caffeine: 'Beaucoup', y_alcohol: 'Sans', n_alcohol: 'Avec', y_meals: 'Pris', n_meals: 'Sautés',
      wk_h: 'Ta semaine', wk_prev: 'Semaine d’avant', wk_next: 'Semaine d’après', wk_hi: 'bien, oui', wk_mid: 'moyen', wk_lo: 'peu, non', wk_sleep: '{a} nuits sur {n} à 7 h ou plus.', wk_move: 'Tu as bougé {a} jours sur {n}.', wk_water: 'Bien bu {a} jours sur {n}.', wk_mood: 'Moral bon {a} jours sur {n}.', wk_few: 'Le résumé de la semaine arrive après 3 soirs.', wk_empty: 'pas répondu', wk_none: 'pas de session',
      rm_h: 'Rappel du soir', rm_sub: 'Seulement si le point n’est pas fait', rm_at: 'Heure', rm_body: 'Le point du soir : {n} questions, 15 secondes.', rm_art: 'Les notifications ne marchent pas ici. Le point apparaît sur Aujourd’hui à partir de 19 h.', rm_push: 'Pour recevoir le rappel sur cet appareil, active les notifications.', rm_push_on: 'Activer les notifications', rm_muted: 'Le rappel s’est tu après 3 soirs sans réponse. Il reprend dès ton prochain point.', rm_stop: 'Arrêter le rappel', rm_card: 'Sur Aujourd’hui, le point apparaît aussi à partir de 19 h.',
      sp_low: 'Le moral est bas depuis quelques jours', sp_body: 'Parler à quelqu’un peut aider : un médecin, le service de santé de ton établissement, une personne de confiance.', sp_h: 'Besoin de parler', sp_lines: 'Lignes d’écoute', sp_hide: 'Masquer', sp_fr: 'En cas de pensées suicidaires, le 3114 répond jour et nuit, gratuitement.', sp_other: 'Hors de France, findahelpline.com liste les lignes d’écoute de ton pays.', sp_urg: 'En cas de danger immédiat, appelle le 112.',
      hb_health: 'Point du soir', yh_well_todo: 'Point du soir à faire', yh_well_done: 'Point du soir fait', yh_well_later: 'Point du soir à partir de 19 h',
    },
    en: {
      hl_h: 'Health check', hl_intro: 'Four questions in the evening, 15 seconds. It links your body to your work, from your own days. It stays on this device and is never synced. This is not medical advice.', hl_on: 'Turn on', hl_off: 'Turn off the health check', hl_clear: 'Clear everything',
      hl_set: 'Reminder and questions', hl_lines: 'Questions asked', hl_links: 'What works for you', hl_wait: 'Comparisons come after {n} evenings on each side (for example {n} days you moved and {n} you didn’t).', hl_note: 'Over {n} days. These are trends in your days, not causes.', hl_rating: 'Focus rating', hl_work: 'Work time',
      ev_h: 'Tonight', ev_card: 'Evening check', ev_sub: '{n} questions, 15 seconds', ev_go: 'Check in', ev_done: 'Done tonight', ev_edit: 'Edit', ev_not: 'Not tonight', ev_step: '{i} of {n}', ev_skip: 'Skip', ev_back: 'Back', ev_hint: 'Tap an answer to continue', ev_end: 'Saved. Good night.', ev_close: 'Close',
      qq_sleep: 'How long did you sleep last night?', qq_water: 'Did you drink enough today?', qq_move: 'Did you move today?', qq_mood: 'And your mood today?', qq_caffeine: 'Coffee or energy drinks?', qq_alcohol: 'Any alcohol today?', qq_meals: 'Did you eat your meals?',
      q_sleep: 'Sleep', q_water: 'Water', q_move: 'Movement', q_mood: 'Mood', q_caffeine: 'Coffee', q_alcohol: 'Alcohol', q_meals: 'Meals', q_focus: 'Focus',
      a_short: 'Under 7 h', a_mid: '7 to 8 h', a_long: '8 h or more', a_low: 'Little', a_ok: 'Enough', a_no: 'No', a_yes: 'Yes', a_bad: 'Low', a_med: 'Medium', a_good: 'Good', a_none: 'None', a_some: 'Some', a_lots: 'A lot',
      s_low: 'Under 1 litre', s_ok: '1 litre or more', s_move_yes: '20 minutes of walking or more', s_some: '1 or 2', s_lots: '3 or more',
      f_sleep: 'After 7 h of sleep or more', f_water: 'Days you drank enough', f_move: 'Days you moved', f_mood: 'Days your mood is good', f_caffeine: 'Days with little coffee', f_alcohol: 'Days without alcohol', f_meals: 'Days you ate your meals',
      y_sleep: '7 h +', n_sleep: 'Less', y_water: 'Enough', n_water: 'Little', y_move: 'Moved', n_move: 'Didn’t', y_mood: 'Good', n_mood: 'Less good', y_caffeine: 'Little', n_caffeine: 'A lot', y_alcohol: 'Without', n_alcohol: 'With', y_meals: 'Eaten', n_meals: 'Skipped',
      wk_h: 'Your week', wk_prev: 'Previous week', wk_next: 'Next week', wk_hi: 'good, yes', wk_mid: 'medium', wk_lo: 'little, no', wk_sleep: '{a} of {n} nights at 7 h or more.', wk_move: 'You moved on {a} of {n} days.', wk_water: 'Drank enough on {a} of {n} days.', wk_mood: 'Good mood on {a} of {n} days.', wk_few: 'The week’s summary comes after 3 evenings.', wk_empty: 'no answer', wk_none: 'no session',
      rm_h: 'Evening reminder', rm_sub: 'Only if the check isn’t done', rm_at: 'Time', rm_body: 'Evening check: {n} questions, 15 seconds.', rm_art: 'Notifications don’t work here. The check shows on Today from 19:00.', rm_push: 'To get the reminder on this device, turn notifications on.', rm_push_on: 'Turn notifications on', rm_muted: 'The reminder went quiet after 3 evenings without an answer. It starts again with your next check.', rm_stop: 'Turn off the reminder', rm_card: 'On Today, the check also shows from 19:00.',
      sp_low: 'Your mood has been low for a few days', sp_body: 'Talking to someone can help: a doctor, your school or university health service, someone you trust.', sp_h: 'Need to talk', sp_lines: 'Helplines', sp_hide: 'Hide', sp_fr: 'In France, if you have suicidal thoughts, 3114 answers day and night, free of charge.', sp_other: 'Elsewhere, findahelpline.com lists helplines in your country.', sp_urg: 'If you are in immediate danger, call your local emergency number.',
      hb_health: 'Evening check', yh_well_todo: 'Evening check to do', yh_well_done: 'Evening check done', yh_well_later: 'Evening check from 19:00',
    },
  });

  // [key, answers, the answers that count as the "good" side, strength of each answer for the week grid (3 good, 2 medium, 1 low)]
  const LINES = [
    ['sleep', ['short', 'mid', 'long'], ['mid', 'long'], [1, 3, 3]],
    ['water', ['low', 'ok'], ['ok'], [1, 3]],
    ['move', ['no', 'yes'], ['yes'], [1, 3]],
    ['mood', ['bad', 'med', 'good'], ['good'], [1, 2, 3]],
    ['caffeine', ['none', 'some', 'lots'], ['none', 'some'], [3, 2, 1]],
    ['alcohol', ['no', 'yes'], ['no'], [3, 1]],
    ['meals', ['no', 'yes'], ['yes'], [1, 3]],
  ];
  const SUBS = { low: 's_low', ok: 's_ok', 'move:yes': 's_move_yes', some: 's_some', lots: 's_lots' };
  const ICON = {
    sleep: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    water: '<path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5z"/>',
    move: '<circle cx="13.5" cy="4.5" r="1.8"/><path d="M9 21l2.5-6 3 2.5V21M8 11.5l3-3.5 3.5 1 2.5 3.5M11 8l-1.5 6.5"/>',
    mood: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5c1.8 2 5.2 2 7 0M9 9.8h.01M15 9.8h.01"/>',
    caffeine: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M9 3.5v3M12.5 3.5v3"/>',
    alcohol: '<path d="M7 3.5h10l-1 6a4 4 0 0 1-8 0zM12 13.5v7M8.5 20.5h7"/>',
    meals: '<path d="M7 3.5v7a2 2 0 0 0 2 2v8M11 3.5v7a2 2 0 0 1-2 2M17 3.5c-2 1.5-2.5 5-2.5 8h2.5v9"/>',
  };
  const ico = (k, cls = 'hl-ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k] || ''}</svg>`;
  const DEFAULT_LINES = ['sleep', 'water', 'move', 'mood'], MIN_DAYS = 5;
  // Wellbeing (3.66) = this check + Screen time (guard.js), one page and one module
  ML.addStrings({ fr: { mod_well: 'Bien-être', mod_well_d: 'Point santé et temps d’écran.' }, en: { mod_well: 'Wellbeing', mod_well_d: 'Health check and screen time.' } });
  ML.module('wellbeing', { label: 'mod_well', hint: 'mod_well_d', order: 20, def: true });
  const P = ML.priv;
  const cfg = () => Object.assign({ on: false, lines: DEFAULT_LINES, rem: true, at: '21:00', remSince: null }, P.get('healthCfg', {}));
  const setCfg = o => { P.set('healthCfg', Object.assign(cfg(), o)); syncReminder(); };
  const log = () => P.get('health', {});
  const activeLines = () => { const c = cfg(); return LINES.filter(l => c.lines.includes(l[0])); };
  // The evening's day: answering at 00:30 still fills the evening before
  const eveDay = () => { const d = new Date(); if (d.getHours() < 4) d.setDate(d.getDate() - 1); return dayKey(d); };
  const doneTonight = () => { const d = log()[eveDay()]; return !!(d && Object.keys(d).length); };
  const isEvening = () => { const h = new Date().getHours(); return h >= 19 || h < 4; };
  ML.eveDone = doneTonight;

  /* ---------- The check: one question per screen ---------- */
  let step = 0;
  function answer(k, a) {
    const l = log(), day = eveDay(), d = l[day] = l[day] || {};
    d[k] = a;
    P.set('health', l);
    syncReminder();
  }
  function checkHtml() {
    const lines = activeLines(), n = lines.length, d = log()[eveDay()] || {};
    if (step >= n) return `<div class="hc-end">${ico('sleep', 'hc-end-ico')}<h2>${esc(t('ev_end'))}</h2><button type="button" class="primary" data-hc-close>${esc(t('ev_close'))}</button></div>`;
    const [k, ans] = lines[step];
    return `<div class="hc-bar" aria-hidden="true">${lines.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
      <p class="hc-step">${esc(t('ev_step', { i: step + 1, n }))}</p>
      <h2 class="hc-q" id="hc-q">${esc(t('qq_' + k))}</h2>
      <div class="hc-choices" role="group" aria-labelledby="hc-q">${ans.map(a => { const sub = SUBS[k + ':' + a] || (k === 'water' || k === 'caffeine' ? SUBS[a] : ''); return `<button type="button" class="hc-choice" data-hq="${k}" data-ha="${a}" aria-pressed="${d[k] === a}">${ico(k)}<span><b>${esc(t('a_' + a))}</b>${sub ? `<small>${esc(t(sub))}</small>` : ''}</span></button>`; }).join('')}</div>
      <div class="hc-foot">${step ? `<button type="button" class="ghost small" data-hc-back>${esc(t('ev_back'))}</button>` : ''}<button type="button" class="ghost small" data-hc-skip>${esc(t('ev_skip'))}</button><span class="hc-hint">${esc(t('ev_hint'))}</span></div>`;
  }
  let endT = 0;
  function drawCheck() {
    const sheet = $('hcheck') && $('hcheck').firstElementChild; if (!sheet) return;
    sheet.innerHTML = checkHtml();
    const first = sheet.querySelector('[aria-pressed="true"]') || sheet.querySelector('.hc-choice, [data-hc-close]');
    if (first && !matchMedia('(pointer: coarse)').matches) first.focus({ preventScroll: true });
  }
  function openCheck() {
    const c = cfg(); if (!ML.modOn('wellbeing') || !c.on || !c.lines.length) return;
    step = 0; clearTimeout(endT);
    ML.ySheet('hcheck', checkHtml(), r => {
      r.classList.add('hc-sheet');
      if (r.dataset.bound) return; r.dataset.bound = '1';
      r.addEventListener('click', e => {
        const a = e.target.closest('[data-hq]');
        if (a) {
          answer(a.dataset.hq, a.dataset.ha); a.setAttribute('aria-pressed', 'true');
          step++; setTimeout(drawCheck, ML.reducedMotion() ? 0 : 160);
          if (step >= activeLines().length) { render(); ML.emit('render'); endT = setTimeout(() => { if (!$('hcheck').hidden && step >= activeLines().length) ML.closeOverlay('hcheck'); }, 2200); }
          return;
        }
        if (e.target.closest('[data-hc-skip]')) { step++; drawCheck(); if (step >= activeLines().length) render(); return; }
        if (e.target.closest('[data-hc-back]')) { step = Math.max(0, step - 1); return drawCheck(); }
        if (e.target.closest('[data-hc-close]')) ML.closeOverlay('hcheck');
      });
    });
    drawCheck();
  }
  ML.openCheck = openCheck;
  ML.eveNot = () => { P.set('eveNot', eveDay()); ML.emit('render'); };

  /* ---------- The week grid ---------- */
  let wkOff = 0;
  const monday = k => { const d = parseDay(k), w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return dayKey(d); };
  function dayMins() {
    const m = {};
    S.sessions.forEach(s => { const k = dayKey(new Date(s.at)); m[k] = (m[k] || 0) + (s.mins || 0); });
    return m;
  }
  function weekHtml() {
    const l = log(), now = eveDay(), from = addDays(monday(now), wkOff * 7), days = Array.from({ length: 7 }, (_, i) => addDays(from, i)), mins = dayMins();
    const goal = (ML.periodInfo && ML.periodInfo().goal) || 120, loc = ML.locale(), lines = activeLines();
    const short = k => parseDay(k).toLocaleDateString(loc, { weekday: 'narrow' }), long = k => parseDay(k).toLocaleDateString(loc, { weekday: 'long', day: 'numeric' });
    const range = parseDay(days[0]).toLocaleDateString(loc, { day: 'numeric', month: 'short' }) + ' – ' + parseDay(days[6]).toLocaleDateString(loc, { day: 'numeric', month: 'short' });
    const cell = (k, day, lvl, what) => `<i class="hw-c ${day > now ? 'fut' : lvl ? 'l' + lvl : 'e'}" ${day > now ? 'aria-hidden="true"' : `role="img" aria-label="${esc(t('q_' + k) + ', ' + long(day) + ' : ' + what)}" title="${esc(long(day) + ' · ' + what)}"`}></i>`;
    const rows = lines.map(([k, ans, , lv]) => `<span class="hw-n">${esc(t('q_' + k))}</span>${days.map(day => { const a = (l[day] || {})[k], i = ans.indexOf(a); return cell(k, day, i >= 0 ? lv[i] : 0, i >= 0 ? t('a_' + a) : t('wk_empty')); }).join('')}`).join('');
    const focus = `<span class="hw-n">${esc(t('q_focus'))}</span>${days.map(day => { const m = mins[day] || 0; return cell('focus', day, m >= goal ? 3 : m > 0 ? 2 : day === now ? 0 : 1, m ? fmtMins(m) : t('wk_none')); }).join('')}`;
    // A sentence once 3 evenings of the week are answered
    const answered = days.filter(d => l[d] && Object.keys(l[d]).length);
    let sum = '';
    if (answered.length >= 3) {
      const count = (k, good) => { const v = answered.filter(d => l[d][k] != null); return [v.filter(d => good.includes(l[d][k])).length, v.length]; };
      const bits = [];
      lines.forEach(([k, , good]) => { if (!['sleep', 'move', 'water', 'mood'].includes(k)) return; const [a, n] = count(k, good); if (n >= 3 && bits.length < 2) bits.push(t('wk_' + k, { a, n })); });
      sum = bits.join(' ');
    } else if (wkOff === 0) sum = t('wk_few');
    return `<div class="hw-head"><h3>${esc(t('wk_h'))}</h3><span class="hw-nav"><button type="button" class="ghost icon-only" data-wk="-1" aria-label="${esc(t('wk_prev'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><span class="hw-range">${esc(range)}</span><button type="button" class="ghost icon-only" data-wk="1" aria-label="${esc(t('wk_next'))}" ${wkOff >= 0 ? 'disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></span></div>
      <div class="hw" style="--rows:${lines.length + 1}"><span></span>${days.map(d => `<span class="hw-d ${d === now ? 'now' : ''}">${esc(short(d))}</span>`).join('')}${rows}${focus}</div>
      <div class="hw-legend" aria-hidden="true"><span><i class="l3"></i>${esc(t('wk_hi'))}</span><span><i class="l2"></i>${esc(t('wk_mid'))}</span><span><i class="l1"></i>${esc(t('wk_lo'))}</span></div>
      ${sum ? `<p class="insight">${esc(sum)}</p>` : ''}`;
  }

  /* ---------- Comparing your own days, drawn as two bars ---------- */
  function dayStats() {
    const m = {};
    S.sessions.forEach(s => { const k = dayKey(new Date(s.at)), o = m[k] = m[k] || { mins: 0, r: 0, n: 0 }; o.mins += s.mins; if (s.rating) { o.r += s.rating; o.n++; } });
    return m;
  }
  function links() {
    const l = log(), days = dayStats(), out = [];
    let total = 0;
    LINES.forEach(([k, , good]) => {
      const yes = [], no = [];
      Object.entries(l).forEach(([day, d]) => { if (d[k] == null || !days[day]) return; (good.includes(d[k]) ? yes : no).push(days[day]); });
      if (yes.length < MIN_DAYS || no.length < MIN_DAYS) return;
      const avg = (a, f) => { const v = a.filter(x => f(x) != null).map(f); return v.length ? v.reduce((p, c) => p + c, 0) / v.length : null; };
      const ra = avg(no, x => (x.n ? x.r / x.n : null)), rb = avg(yes, x => (x.n ? x.r / x.n : null)), ma = avg(no, x => x.mins), mb = avg(yes, x => x.mins);
      total = Math.max(total, yes.length + no.length);
      if (ra != null && rb != null && rb - ra >= 0.3) out.push({ k, kind: 'rating', a: rb, b: ra });
      else if (mb - ma >= 20) out.push({ k, kind: 'work', a: mb, b: ma });
    });
    return { out, total };
  }
  function linksHtml() {
    const { out, total } = links();
    if (!out.length) return `<p class="tx-aside">${esc(t('hl_wait', { n: MIN_DAYS }))}</p>`;
    const num = (kind, v) => kind === 'rating' ? v.toLocaleString(ML.locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : fmtMins(Math.round(v));
    return out.slice(0, 3).map(({ k, kind, a, b }) => {
      const max = kind === 'rating' ? 5 : Math.max(a, b), w = v => Math.max(4, Math.round(v / max * 100));
      return `<div class="hl-cmp"><span class="hl-lab">${esc(t('f_' + k))} <small>· ${esc(t(kind === 'rating' ? 'hl_rating' : 'hl_work'))}</small></span>
        <div class="hl-bar"><span>${esc(t('y_' + k))}</span><span class="hl-t"><b style="width:${w(a)}%"></b></span><em>${esc(num(kind, a))}</em></div>
        <div class="hl-bar"><span>${esc(t('n_' + k))}</span><span class="hl-t"><b class="lo" style="width:${w(b)}%"></b></span><em>${esc(num(kind, b))}</em></div></div>`;
    }).join('') + `<p class="tx-aside hl-foot">${esc(t('hl_note', { n: total }))}</p>`;
  }

  /* ---------- Support: only when the mood stays low ---------- */
  // Low on at least 3 of the last 4 evenings answered in the last week
  function moodLow() {
    const l = log(), cut = addDays(eveDay(), -7), last = Object.keys(l).filter(k => k >= cut && l[k].mood).sort().slice(-4);
    return last.filter(k => l[k].mood === 'bad').length >= 3;
  }
  const helpHtml = () => `<p class="insight">${esc(t('sp_body'))}</p><p class="insight">${esc(t('sp_fr'))}</p><p class="insight">${esc(t('sp_other'))} ${esc(t('sp_urg'))}</p>`;
  const supportCard = () => `<div class="g-card y-support"><h2>${esc(t('sp_low'))}</h2><p class="insight">${esc(t('sp_body'))}</p><div class="y-btns"><button type="button" class="small ghost" data-sp-lines>${esc(t('sp_lines'))}</button><button type="button" class="small ghost" data-sp-hide>${esc(t('sp_hide'))}</button></div></div>`;
  const openHelp = () => ML.ySheet('sp-sheet', `<h2>${esc(t('sp_h'))}</h2>${helpHtml()}<button type="button" class="primary" data-close="sp-sheet">${esc(t('ev_close'))}</button>`);
  // The numbers always stay in Settings, About
  ML.settingsSection({ order: 98, cat: 'about', render: () => `<h3>${esc(t('sp_h'))}</h3>${helpHtml().replace(/class="insight"/g, 'class="hint"')}` });

  /* ---------- The page ---------- */
  const TIMES = []; for (let h = 17; h <= 23; h++) ['00', '30'].forEach(m => TIMES.push(h + ':' + m));
  function reminderHtml(c) {
    let note = '';
    if (!IS_EXT) {
      if (!ML.push || !ML.push.supported) note = t('rm_art');
      else if (!ML.push.isOn()) note = t('rm_push');
    }
    const quiet = c.rem && ignoredNights() >= 3;
    return `<div class="hl-rem"><label class="hl-rem-on"><span><b>${esc(t('rm_h'))}</b><small>${esc(t('rm_sub'))}</small></span><input type="checkbox" id="hl-rem" ${c.rem ? 'checked' : ''}></label>
      ${c.rem ? `<label class="hl-rem-at"><span>${esc(t('rm_at'))}</span>${ML.ui.sel('hl-at', TIMES.map(x => [x, x]), c.at)}</label>` : ''}
      ${c.rem && quiet ? `<p class="insight">${esc(t('rm_muted'))}</p>` : ''}
      ${c.rem && note ? `<p class="insight">${esc(note)}</p>${note === t('rm_push') ? `<button type="button" class="small" data-push-on>${esc(t('rm_push_on'))}</button>` : ''}` : ''}
      ${c.rem && !note ? `<p class="tx-aside">${esc(t('rm_card'))}</p>` : ''}</div>`;
  }
  function render() {
    const el = $('health'); if (!el || S.tab !== 'health') return;
    const c = cfg();
    let html;
    if (!c.on) html = `<div class="y-page"><div class="g-card"><h2>${esc(t('hl_h'))}</h2><p class="tx-lead">${esc(t('hl_intro'))}</p><button type="button" class="small primary" data-hon>${esc(t('hl_on'))}</button></div></div>`;
    else {
      const low = moodLow() && !(P.get('spHide') >= eveDay()), done = doneTonight(), n = activeLines().length;
      html = `<div class="y-page">${low ? supportCard() : ''}
        <div class="g-card hl-tonight"><div class="hl-top">${ico('sleep', 'hl-top-ico')}<span class="hl-top-tx"><h2>${esc(t('ev_h'))}</h2><small>${esc(done ? t('ev_done') : t('ev_sub', { n }))}</small></span><button type="button" class="small ${done ? 'ghost' : 'primary'}" data-hcheck ${n ? '' : 'disabled'}>${esc(t(done ? 'ev_edit' : 'ev_go'))}</button></div>
          ${weekHtml()}</div>
        <div class="g-card"><h2>${esc(t('hl_links'))}</h2>${linksHtml()}</div>
        <details class="g-card y-det hl-set"><summary>${esc(t('hl_set'))} <small>${esc(c.rem ? c.at : '')}</small></summary>
          ${reminderHtml(c)}
          <h3 class="hl-sub">${esc(t('hl_lines'))}</h3><div class="y-lines">${LINES.map(([k]) => `<label class="opt"><input type="checkbox" data-hline="${k}" ${c.lines.includes(k) ? 'checked' : ''}> ${esc(t('q_' + k))}</label>`).join('')}</div>
          <div class="y-btns"><button type="button" class="small ghost" data-hoff>${esc(t('hl_off'))}</button><button type="button" class="small ghost" id="hl-clear">${esc(t('hl_clear'))}</button></div></details></div>`;
    }
    if (el.dataset.h === html) return;
    const open = el.querySelector('details[open]') ? 1 : 0;
    el.innerHTML = html; el.dataset.h = html;
    if (open && el.querySelector('details')) el.querySelector('details').open = true;
    const b = el.querySelector('#hl-clear');
    if (b) ML.armedButton(b, 'hl_clear', () => { P.del('health'); render(); });
  }
  const box = $('health');
  box.addEventListener('click', e => {
    const q = a => e.target.closest('[data-' + a + ']');
    if (q('hcheck')) return openCheck();
    if (q('wk')) { wkOff = Math.min(0, wkOff + +q('wk').dataset.wk); return render(); }
    if (q('hon')) { setCfg({ on: true, rem: true, remSince: eveDay() }); return render(); }
    if (q('hoff')) { setCfg({ on: false }); return render(); }
    if (q('sp-lines')) return openHelp();
    if (q('sp-hide')) { P.set('spHide', addDays(eveDay(), 7)); return render(); }
    if (q('push-on')) { if (ML.push) ML.push.enable().then(() => { syncReminder(); render(); }); }
  });
  box.addEventListener('change', e => {
    if (e.target.id === 'hl-rem') { setCfg({ rem: e.target.checked, remSince: eveDay() }); return render(); }
    if (e.target.id === 'hl-at') { setCfg({ at: e.target.value }); return render(); }
    const k = e.target.dataset.hline; if (!k) return;
    const c = cfg(), lines = e.target.checked ? [...new Set([...c.lines, k])] : c.lines.filter(x => x !== k);
    setCfg({ lines: LINES.map(l => l[0]).filter(x => lines.includes(x)) }); render();
  });

  /* ---------- Today: the evening card (from 19:00, everywhere) ---------- */
  ML.eveCard = () => {
    const c = cfg();
    if (!ML.modOn('wellbeing') || !c.on || !c.lines.length || !isEvening() || doneTonight() || P.get('eveNot') === eveDay()) return '';
    return `<div class="td-eve">${ico('sleep', 'td-eve-ico')}<span class="td-eve-tx"><b>${esc(t('ev_card'))}</b><small>${esc(t('ev_sub', { n: c.lines.length }))}</small></span><div class="td-btns"><button type="button" class="primary" data-go="evecheck">${esc(t('ev_go'))}</button><button type="button" class="ghost" data-go="evenot">${esc(t('ev_not'))}</button></div></div>`;
  };
  ML.wellLine = () => {
    const c = cfg();
    if (!c.on) return null;
    return doneTonight() ? t('yh_well_done') : isEvening() ? t('yh_well_todo') : t('yh_well_later');
  };

  /* ---------- The evening reminder ---------- */
  // Evenings in a row the reminder was on and no check was made (yesterday backwards). Three: it goes quiet.
  function ignoredNights() {
    const c = cfg(), l = log(); if (!c.remSince) return 0;
    let n = 0, d = addDays(eveDay(), -1);
    while (n < 7 && d >= c.remSince && !(l[d] && Object.keys(l[d]).length)) { n++; d = addDays(d, -1); }
    return n;
  }
  const atOn = (day, at) => { const [h, m] = at.split(':').map(Number), d = parseDay(day); d.setHours(h, m, 0, 0); return d.getTime(); };
  let syncT = 0;
  function syncReminder() { clearTimeout(syncT); syncT = setTimeout(doSync, 1500); }
  function doSync() {
    const c = cfg(), active = ML.modOn('wellbeing') && c.on && c.rem && c.lines.length > 0, left = Math.max(0, 3 - ignoredNights());
    const body = t('rm_body', { n: c.lines.length });
    // Extension: a daily local alarm; background.js checks "done" and counts unanswered evenings itself
    if (IS_EXT && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ 'mli-evening': { on: active && left > 0, at: c.at, done: doneTonight() ? eveDay() : '', body, go: t('ev_go'), not: t('ev_not') } }).then(() => ML.bgSend({ type: 'evening' })).catch(() => {});
      return;
    }
    // Installed app: one push job per coming evening, at most the evenings left before it goes quiet
    if (!ML.push || !ML.push.isOn() || !ML.push.job) return;
    const now = Date.now(), want = [];
    if (active) for (let i = 0, day = eveDay(); want.length < left && i < 5; i++, day = addDays(day, 1)) {
      if (i === 0 && doneTonight()) continue;
      const at = atOn(day, c.at); if (at > now + 60000) want.push(at);
    }
    const sig = JSON.stringify([want, body, S.lang]);
    let old = {}; try { old = JSON.parse(localStorage.getItem('mli-push-eve')) || {}; } catch (e) {}
    if (old.sig === sig) return;
    (old.ids || []).forEach(id => ML.push.del(id));
    Promise.all(want.map(at => ML.push.job(at, 'MerlinsLockIN', body, 'mli-evening'))).then(ids => {
      try { localStorage.setItem('mli-push-eve', JSON.stringify({ sig, ids: ids.filter(Boolean) })); } catch (e) {}
    });
  }
  // Said once: the reminder went quiet, offer to turn it off
  function offerStop() {
    const c = cfg();
    if (!c.on || !c.rem || ignoredNights() < 3 || P.get('eveOffered') === c.remSince) return;
    P.set('eveOffered', c.remSince);
    ML.toast(t('rm_muted'), { ms: 9000, action: { label: t('rm_stop'), fn: () => { setCfg({ rem: false }); render(); } } });
  }
  // Opened from the notification
  function fromNotification() {
    try {
      const u = new URL(location.href);
      if (u.searchParams.has('check')) { u.searchParams.delete('check'); history.replaceState(null, '', u.pathname + u.search + u.hash); setTimeout(openCheck, 600); }
    } catch (e) {}
    if (IS_EXT && chrome.storage && chrome.storage.local) chrome.storage.local.get('mli-evening-open').then(r => {
      const at = r && r['mli-evening-open'];
      if (at && Date.now() - at < 30 * 60000) { chrome.storage.local.remove('mli-evening-open'); if (!doneTonight()) setTimeout(openCheck, 600); }
    }).catch(() => {});
  }
  if (navigator.serviceWorker && !IS_EXT) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'evening') openCheck(); });

  on('started', () => { syncReminder(); fromNotification(); setTimeout(offerStop, 4000); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') fromNotification(); });
  on('newday', syncReminder); on('lang', syncReminder); on('modules', syncReminder);
  on('tab', render); on('render', render); on('lang', render); on('rated', render);
})();
