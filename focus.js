// Focus (3.62): the You section about the quality of the work, not only the time. Flow sessions and their chain, Comeback,
// Focus span, periods of the year (Term, Exams, Light, Holidays), Goal profile, Calm / Lively, "I can't start" and the
// bad day reset. Everything here is worked out from S.sessions. ML.priv is the storage kept out of the sync (guard.js, health.js).
(() => {
  'use strict';
  const { $, S, t, esc, on, emit, save, toast, today, fmtMins, dayKey, uid } = ML;

  ML.addStrings({
    fr: {
      tab_focus: 'Progrès', tab_health: 'Bien-être', tab_screen: 'Temps d’écran', grp_progress: 'Progression', grp_well: 'Bien-être', grp_more: 'Plus',
      pg_since: 'depuis la rentrée, sur {n} semaines', pg_none: 'Ta première session lancera tes progrès.', pg_days: '{n} jours (record {b})', pg_flow_wk: 'Sessions Flow cette semaine', pg_of: '{a} sur {b}',
      pg_span: 'Durée sans décrocher', pg_span_was: '(il y a un mois : {m})', pg_span_none: 'encore quelques sessions', pg_bonus: 'Bonus de Flow en cours', pg_bonus_0: 'pas encore',
      pg_level: 'Niveau', pg_xp_left: '{n} XP avant {name}.', pg_ach: 'Succès, {a} sur {b}', pg_set_h: 'Objectif et affichage', gp_set: 'Ce que tu cherches', gp_p: 'Ça règle ton objectif du jour et ce que Toi met en avant. Tu peux changer dans Réglages.', gp_skip: 'Passer',
      fc_style_h: 'Animé : les chiffres montent, le défi de la semaine et l’arbre qui pousse en fin de session.',
      fc_deep: 'Heures profondes', fc_flow: 'Flow, 7 jours', fc_chain: 'Bonus', fc_chain_h: 'Chaîne', fc_chain_n: '{n} de suite', fc_chain_0: 'La prochaine session propre lance la chaîne.',
      fc_rule: 'Une session Flow : 25 min ou plus, finie, sans pause ni décrochage, notée 4 ou 5 si tu la notes.',
      fc_back_h: 'Retours', fc_back_p: 'Revenir après un trou compte double. Ton record ne s’efface jamais.', fc_record: 'Record', fc_returns: 'Retours', fc_streak: 'Série',
      fc_span_h: 'Durée sans décrocher', fc_span_p: 'La durée que tu tiens sans décrocher, sur tes dernières sessions.', fc_span_ago: 'Il y a un mois : {m}.', fc_span_try: 'Essayer une session de {m}', fc_span_none: 'Quelques sessions de plus et ta durée s’affichera ici.',
      fc_today: 'Aujourd’hui', fc_goal: '{m} sur {g}', fc_nogoal: '{m}, sans objectif',
      fc_style: 'Affichage', fc_calm: 'Calme', fc_lively: 'Animé',
      pd_title: 'Période', pd_term: 'Cours', pd_exams: 'Examens', pd_light: 'Léger', pd_holidays: 'Vacances', pd_auto: 'Passer en Examens 14 jours avant un examen', pd_auto_on: 'Période Examens activée : {name} dans {n} j.', pd_exam_line: '{name} dans {n} j',
      pd_h_term: 'Objectif 3 h par jour.', pd_h_exams: 'Objectif 5 h par jour.', pd_h_light: 'Objectif 1 h par jour.', pd_h_holidays: 'Pas d’objectif, ta série est gelée.',
      gp_q: 'Que cherches-tu ici ?', gp_further: 'Aller plus loin', gp_start: 'Réussir à commencer', gp_phone: 'Moins de téléphone', gp_change: 'Objectif : {g}',
      fl_toast: 'Flow · +{xp} XP', cb_toast: 'Tu es revenu. Session doublée · +{xp} XP',
      st_btn: 'Je n’arrive pas à commencer', st_h: 'Quel est le plus petit geste ?', st_ph: 'Ouvrir le chapitre 4', st_p: 'Après, tu peux t’arrêter. Les deux comptent.', st_2: '2 minutes', st_5: '5 minutes', st_done: 'Tu as commencé. +{xp} XP',
      rs_toast: 'Journée difficile ? Prépare demain.', rs_open: 'Ouvrir', rs_h: 'Journée difficile. C’est noté, et c’est fini.', rs_p: 'Une seule chose pour demain :', rs_ph: 'Lire 3 pages du chapitre 4', rs_save: 'Garder pour demain', rs_later: 'Pas ce soir', rs_ok: 'C’est prêt pour demain.',
      ov_toast: '{h} aujourd’hui. Le bonus du jour est acquis : tu peux t’arrêter.',
      ov_set: 'Arrêter les bonus et proposer de s’arrêter après une longue journée',
      pj_h: 'Par projet', pj_this: 'Cette semaine', pj_last: 'La semaine dernière', pj_of: 'Semaine du {d}', pj_prev: 'Semaine d’avant', pj_next: 'Semaine d’après',
      pj_none: 'Sans projet', pj_empty: 'Aucune session cette semaine.', pj_avg: 'd’habitude {m}', pj_new: 'nouveau', pj_same: 'comme d’habitude', pj_more: '{m} de plus que d’habitude', pj_less: '{m} de moins que d’habitude',
      pj_trend: 'Tendances, 12 semaines', pj_trend_p: 'Les heures de chaque semaine. À droite, la moyenne des 4 dernières.', pj_wk: '{m} / sem.',
    },
    en: {
      tab_focus: 'Progress', tab_health: 'Wellbeing', tab_screen: 'Screen time', grp_progress: 'Progress', grp_well: 'Wellbeing', grp_more: 'More',
      pg_since: 'since the school year began, over {n} weeks', pg_none: 'Your first session starts your progress.', pg_days: '{n} days (record {b})', pg_flow_wk: 'Flow sessions this week', pg_of: '{a} of {b}',
      pg_span: 'You hold without a distraction', pg_span_was: '(a month ago: {m})', pg_span_none: 'a few more sessions', pg_bonus: 'Current Flow bonus', pg_bonus_0: 'not yet',
      pg_level: 'Level', pg_xp_left: '{n} XP to {name}.', pg_ach: 'Achievements, {a} of {b}', pg_set_h: 'Goal and display', gp_set: 'What you are here for', gp_p: 'It sets your daily goal and what You puts first. You can change it in Settings.', gp_skip: 'Skip',
      fc_style_h: 'Lively: numbers climb, a weekly challenge and the tree growing at the end of a session.',
      fc_deep: 'Deep hours', fc_flow: 'Flow, 7 days', fc_chain: 'Bonus', fc_chain_h: 'Chain', fc_chain_n: '{n} in a row', fc_chain_0: 'Your next clean session starts the chain.',
      fc_rule: 'A Flow session: 25 min or more, finished, no pause or distraction, rated 4 or 5 if you rate it.',
      fc_back_h: 'Comebacks', fc_back_p: 'Coming back after a gap counts double. Your record is never erased.', fc_record: 'Record', fc_returns: 'Comebacks', fc_streak: 'Streak',
      fc_span_h: 'Focus span', fc_span_p: 'How long you hold without a distraction, over your last sessions.', fc_span_ago: 'A month ago: {m}.', fc_span_try: 'Try a {m} session', fc_span_none: 'A few more sessions and your span shows here.',
      fc_today: 'Today', fc_goal: '{m} of {g}', fc_nogoal: '{m}, no goal',
      fc_style: 'Display', fc_calm: 'Calm', fc_lively: 'Lively',
      pd_title: 'Period', pd_term: 'Term', pd_exams: 'Exams', pd_light: 'Light', pd_holidays: 'Holidays', pd_auto: 'Switch to Exams 14 days before an exam', pd_auto_on: 'Exams period on: {name} in {n} d.', pd_exam_line: '{name} in {n} d',
      pd_h_term: 'Goal: 3 h a day.', pd_h_exams: 'Goal: 5 h a day.', pd_h_light: 'Goal: 1 h a day.', pd_h_holidays: 'No goal, your streak is frozen.',
      gp_q: 'What are you here for?', gp_further: 'Go further', gp_start: 'Manage to start', gp_phone: 'Less phone', gp_change: 'Goal: {g}',
      fl_toast: 'Flow · +{xp} XP', cb_toast: 'You came back. Session doubled · +{xp} XP',
      st_btn: 'I can’t start', st_h: 'What is the smallest step?', st_ph: 'Open chapter 4', st_p: 'You can stop afterwards. Both count.', st_2: '2 minutes', st_5: '5 minutes', st_done: 'You started. +{xp} XP',
      rs_toast: 'Hard day? Set up tomorrow.', rs_open: 'Open', rs_h: 'Hard day. It’s noted, and it’s over.', rs_p: 'One thing for tomorrow:', rs_ph: 'Read 3 pages of chapter 4', rs_save: 'Keep for tomorrow', rs_later: 'Not tonight', rs_ok: 'Ready for tomorrow.',
      ov_toast: '{h} today. Today’s bonus is yours: you can stop now.',
      ov_set: 'Stop bonuses and suggest stopping after a long day',
      pj_h: 'By project', pj_this: 'This week', pj_last: 'Last week', pj_of: 'Week of {d}', pj_prev: 'Week before', pj_next: 'Week after',
      pj_none: 'No project', pj_empty: 'No session this week.', pj_avg: 'usually {m}', pj_new: 'new', pj_same: 'as usual', pj_more: '{m} more than usual', pj_less: '{m} less than usual',
      pj_trend: 'Trends, 12 weeks', pj_trend_p: 'Hours each week. On the right, the average of the last 4.', pj_wk: '{m} / wk',
    },
  });
  ML.defaults(() => ({ period: { key: 'term', auto: true }, goalProfile: null, youStyle: 'calm', comebacks: 0, overGuard: true, resetDay: null, tiny: null }));

  /* ---------- Storage kept on this device, out of the sync ---------- */
  const pKey = name => 'mli-private:' + ML.storageKey() + ':' + name;
  ML.priv = {
    get(name, def) { try { const v = localStorage.getItem(pKey(name)); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(name, v) { try { localStorage.setItem(pKey(name), JSON.stringify(v)); return true; } catch (e) { emit('save-failed'); return false; } },
    del(name) { try { localStorage.removeItem(pKey(name)); } catch (e) {} },
  };
  // A small sheet any You section can open
  ML.ySheet = (id, html, bind) => {
    let ov = $(id);
    if (!ov) { ov = document.createElement('div'); ov.className = 'overlay'; ov.id = id; ov.hidden = true; ov.innerHTML = '<div class="sheet y-sheet" role="dialog" aria-modal="true"></div>'; document.body.append(ov); }
    ov.firstElementChild.innerHTML = html;
    if (bind) bind(ov.firstElementChild);
    ML.openOverlay(id);
  };

  /* ---------- Periods ---------- */
  const PERIODS = { term: { goal: 180, limit: 420, screen: 180 }, exams: { goal: 300, limit: 540, screen: 120 }, light: { goal: 60, limit: 240, screen: 240 }, holidays: { goal: 0, limit: 180, screen: 0 } };
  const daysTo = k => Math.round((ML.parseDay(k) - ML.parseDay(today())) / 864e5);
  const nextExam = () => ((S.study && S.study.exams) || []).filter(x => daysTo(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
  function period() {
    const p = S.period || {}, x = nextExam();
    if (p.auto !== false && p.key === 'term' && x && daysTo(x.date) <= 14) return 'exams';
    return PERIODS[p.key] ? p.key : 'term';
  }
  ML.period = period;
  ML.periodInfo = () => PERIODS[period()];
  ML.PERIODS = Object.keys(PERIODS);
  // Holidays freeze the streak: every day of the period counts as a protected day (same list as the streak seal)
  function freezeDays() {
    if (period() !== 'holidays' || !S.econ) return;
    const p = S.period; if (!p.since) p.since = today();
    const list = S.econ.frozen = S.econ.frozen || [], d = ML.parseDay(p.since);
    for (let i = 0; i < 120 && dayKey(d) <= today(); i++) { const k = dayKey(d); if (!list.includes(k)) list.push(k); d.setDate(d.getDate() + 1); }
  }
  function setPeriod(key) {
    S.period = Object.assign({}, S.period, { key, since: key === 'holidays' ? today() : null, autoOff: null });
    freezeDays(); save(); emit('period', period()); render();
  }
  function toldExam() {
    const x = nextExam(); if (!x || period() !== 'exams' || S.period.key !== 'term' || S.period.told === x.date) return;
    S.period.told = x.date; save(); toast(t('pd_auto_on', { name: x.name, n: daysTo(x.date) }));
  }

  /* ---------- Flow, chain, comeback ---------- */
  const isFlow = s => s.mins >= 25 && s.full && !s.pauses && !s.distractions && (!s.rating || s.rating >= 4);
  ML.isFlow = isFlow;
  // Sessions under 10 min (a two-minute start) neither build nor break the chain
  function chainOf(list) { let n = 0; for (let i = list.length - 1; i >= 0; i--) { if (list[i].mins < 10) continue; if (!isFlow(list[i])) break; n++; } return n; }
  const multOf = n => 1 + Math.min(n, 5) * 0.06;
  const minsOn = k => S.sessions.filter(s => dayKey(new Date(s.at)) === k).reduce((a, s) => a + s.mins, 0);
  const overworked = () => S.overGuard !== false && minsOn(today()) >= ML.periodInfo().limit;
  ML.overworked = overworked;
  // True when at least one full day was missed since the last session, frozen days excepted
  function isComeback(session) {
    const before = S.sessions.filter(s => s !== session), last = before[before.length - 1]; if (!last) return false;
    const frozen = new Set((S.econ && S.econ.frozen) || []), d = new Date(session.at), lastK = dayKey(new Date(last.at));
    if (lastK === dayKey(d)) return false;
    let missed = 0; d.setDate(d.getDate() - 1);
    for (let i = 0; i < 400 && dayKey(d) > lastK; i++) { if (!frozen.has(dayKey(d))) missed++; d.setDate(d.getDate() - 1); }
    return missed > 0;
  }
  on('session', s => {
    const was = overworked() && minsOn(today()) - s.mins >= ML.periodInfo().limit;
    let extra = 0;
    if (S.tiny) {
      S.focusMins = S.tiny.prev; S.tiny = null; s.tiny = true; ML.addXp(5); s.xp += 5;
      setTimeout(() => toast(t('st_done', { xp: 5 })), 400);
    }
    if (isComeback(s)) {
      s.comeback = true; S.comebacks = (S.comebacks || 0) + 1; extra = s.xp;
      setTimeout(() => toast(t('cb_toast', { xp: extra })), 400);
    } else if (isFlow(s) && !was) {
      const n = chainOf(S.sessions.filter(x => x !== s));
      s.flow = true; extra = Math.max(1, Math.round(s.xp * (multOf(n + 1) - 1)));
      setTimeout(() => toast(t('fl_toast', { xp: extra })), 400);
    }
    if (extra) { ML.addXp(extra); s.xp += extra; }
    if (overworked() && !was) setTimeout(() => toast(t('ov_toast', { h: fmtMins(minsOn(today())) }), { ms: 7000 }), 900);
    save();
  });

  /* ---------- Focus span ---------- */
  const median = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor((b.length - 1) / 2)] : 0; };
  const clean = s => s.mins >= 5 && !s.pauses && !s.distractions;
  function span() {
    const cut = Date.now() - 30 * 864e5, all = S.sessions.filter(clean);
    const now = all.slice(-10), then = all.filter(s => s.at < cut).slice(-10);
    return { now: now.length >= 3 ? median(now.map(s => s.mins)) : 0, then: then.length >= 3 ? median(then.map(s => s.mins)) : 0 };
  }

  /* ---------- Goal profile and display ---------- */
  function applyLook() {
    const root = document.documentElement;
    root.dataset.you = S.youStyle === 'lively' ? 'lively' : 'calm';
    root.classList.toggle('no-streak', S.goalProfile === 'start');
    root.classList.toggle('stuck-first', S.goalProfile === 'start');
  }
  function setProfile(g) { S.goalProfile = g; S.youStyle = g === 'start' ? 'lively' : 'calm'; save(); applyLook(); render(); emit('render'); }
  const dayGoal = () => (S.goalProfile === 'start' ? Math.min(30, ML.periodInfo().goal) : ML.periodInfo().goal);

  /* ---------- Progress (3.66): Focus and the Grimoire's stats on one page, written as lines ---------- */
  // One big number (the school year), then one line per fact, each said once in the whole app. Settings (period,
  // goal, display) moved to Settings; the goal question is asked once, in a sheet.
  const fmtDur = fmtMins;
  ML.fmtDur = fmtDur;
  ML.dayGoal = () => dayGoal();
  const dec = (v, n) => v.toLocaleString(ML.locale(), { minimumFractionDigits: 0, maximumFractionDigits: n });
  const openDet = new Set();

  /* ---------- Hours by project (3.75) ----------
     No category to tick before a session: a session knows its task, the task its project (3.75 also writes it on the
     session, so a deleted task keeps its hours). No project: the task's subject, else « Sans projet ». The colour is the
     project's own (ML.projColor). The week in stacked day columns, one line per project compared with its average over
     the 4 weeks before, and a folded 12-week trend per project. */
  const WEEK = 7 * 864e5, NONE = '\u0000';
  const monday = ms => { const d = new Date(ms); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const addWeeks = (ms, n) => { const d = new Date(ms); d.setDate(d.getDate() + 7 * n); return d.getTime(); }; // calendar weeks (summer time safe)
  const projOfSession = s => {
    if (s.project) return s.project;
    const x = s.taskId && S.tasks.find(y => y.id === s.taskId);
    if (x && x.project) return x.project;
    const sid = s.subject || (x && x.subject), sub = sid && (S.subjects || []).find(y => y && y.id === sid);
    return (sub && sub.name) || NONE;
  };
  ML.projOfSession = projOfSession;
  const pjName = k => (k === NONE ? t('pj_none') : k);
  const pjColor = k => (k === NONE ? 'var(--dim)' : ML.projColor ? ML.projColor(k) : 'var(--accent)');
  let pjOff = 0; // 0 = this week, -1 the week before…
  function byProject(from, to) {
    const by = {}; S.sessions.forEach(s => { if (s.at >= from && s.at < to && s.mins > 0) { const k = projOfSession(s); by[k] = (by[k] || 0) + s.mins; } });
    return by;
  }
  function projHtml() {
    if (!S.sessions.length) return '';
    const from = addWeeks(monday(Date.now()), pjOff), to = addWeeks(from, 1), first = monday(S.sessions[0].at);
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(from); d.setDate(d.getDate() + i); return d.getTime(); });
    const cols = days.map((d, i) => byProject(d, i < 6 ? days[i + 1] : to));
    const week = byProject(from, to), prev = byProject(addWeeks(from, -4), from), weeksBefore = Math.max(0, Math.min(4, Math.round((from - first) / WEEK)));
    const keys = Object.keys(week).sort((a, b) => (a === NONE) - (b === NONE) || week[b] - week[a]);
    const max = Math.max(60, ...cols.map(c => Object.values(c).reduce((a, m) => a + m, 0)));
    const td = today(), label = pjOff === 0 ? t('pj_this') : pjOff === -1 ? t('pj_last') : t('pj_of', { d: new Date(from).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'long' }) });
    const bars = days.map((d, i) => {
      const c = cols[i], tot = Object.values(c).reduce((a, m) => a + m, 0), k = dayKey(new Date(d));
      const segs = keys.filter(p => c[p]).map(p => `<i style="height:${(c[p] / max * 100).toFixed(2)}%;background:${pjColor(p)}"></i>`).join('');
      return `<li class="${k === td ? 'today' : ''}${k > td ? ' later' : ''}"><span class="pj-col" title="${esc(tot ? fmtDur(tot) : '0 min')}">${segs}</span><small>${esc(ML.wdName((new Date(d).getDay()), 'narrow'))}</small></li>`;
    }).join('');
    const diff = k => {
      if (weeksBefore < 2) return '';
      const avg = (prev[k] || 0) / weeksBefore, dm = Math.round((week[k] || 0) - avg);
      if (pjOff === 0) return avg ? t('pj_avg', { m: fmtDur(Math.round(avg)) }) : t('pj_new');
      return Math.abs(dm) < 10 ? t('pj_same') : t(dm > 0 ? 'pj_more' : 'pj_less', { m: fmtDur(Math.abs(dm)) });
    };
    const rows = keys.map(k => `<li><span><i class="pl-dot" style="--pc:${pjColor(k)}"></i>${esc(pjName(k))}</span><b>${esc(fmtDur(week[k]))}</b><small>${esc(diff(k))}</small></li>`).join('');
    const total = Object.values(week).reduce((a, m) => a + m, 0);
    return `<section class="pj" aria-label="${esc(t('pj_h'))}">
      <header class="pj-head"><h3>${esc(t('pj_h'))}</h3>
        <div class="pj-nav"><button type="button" class="ghost icon-only" data-pj="-1" aria-label="${esc(t('pj_prev'))}"${from <= first ? ' disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
          <span>${esc(label)}${total ? ' · ' + esc(fmtDur(total)) : ''}</span>
          <button type="button" class="ghost icon-only" data-pj="1" aria-label="${esc(t('pj_next'))}"${pjOff >= 0 ? ' disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div></header>
      <ol class="pj-bars" aria-hidden="true">${bars}</ol>
      ${rows ? `<ul class="yl pj-list">${rows}</ul>` : `<p class="insight">${esc(t('pj_empty'))}</p>`}
    </section>`;
  }
  // 12 weeks per project, the line of weekly hours and the average of the last 4 weeks
  function trendHtml() {
    const end = addWeeks(monday(Date.now()), 1), starts = Array.from({ length: 12 }, (_, i) => addWeeks(end, i - 12));
    const per = starts.map((w, i) => byProject(w, i < 11 ? starts[i + 1] : end)), all = {};
    per.forEach(by => Object.entries(by).forEach(([k, m]) => { all[k] = (all[k] || 0) + m; }));
    const keys = Object.keys(all).sort((a, b) => (a === NONE) - (b === NONE) || all[b] - all[a]).slice(0, 8);
    if (!keys.length) return `<p class="insight">${esc(t('pj_empty'))}</p>`;
    const top = Math.max(60, ...keys.flatMap(k => per.map(by => by[k] || 0)));
    const W = 240, H = 44, x = i => (i / 11 * (W - 8) + 4).toFixed(1), y = m => (H - 4 - m / top * (H - 10)).toFixed(1);
    return `<p class="insight">${esc(t('pj_trend_p'))}</p><ul class="pj-trend">${keys.map(k => {
      const v = per.map(by => by[k] || 0), avg = Math.round(v.slice(-4).reduce((a, m) => a + m, 0) / 4), pts = v.map((m, i) => `${x(i)},${y(m)}`).join(' ');
      return `<li style="--pc:${pjColor(k)}"><span><i class="pl-dot" style="--pc:${pjColor(k)}"></i>${esc(pjName(k))}</span>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path class="ar" d="M${x(0)},${H - 4} L${pts.split(' ').join(' L')} L${x(11)},${H - 4}Z"/><polyline points="${pts}"/></svg>
        <b>${esc(t('pj_wk', { m: fmtDur(avg) }))}</b></li>`; }).join('')}</ul>`;
  }
  function render() {
    const el = $('focus'); if (!el || S.tab !== 'focus') return;
    const n = chainOf(S.sessions), st = ML.streaks(), sp = span(), m = minsOn(today()), g = dayGoal(), lv = ML.seqInfo();
    const wk = ML.weekNow ? ML.weekNow() : { s: 0, f: 0 }, yr = ML.treeYear ? ML.treeYear() : { mins: 0, weeks: 0 };
    const tryM = sp.now ? Math.min(120, Math.ceil((sp.now + 1) / 5) * 5) : 0, start = S.goalProfile === 'start';
    const line = (label, val) => `<li><span>${esc(label)}</span><b>${esc(val)}</b></li>`;
    const lines = [
      line(t('fc_today'), g ? t('fc_goal', { m: fmtDur(m), g: fmtDur(g) }) : fmtDur(m)),
      start ? '' : line(t('fc_streak'), t('pg_days', { n: st.cur, b: st.best })),
      S.comebacks ? line(t('fc_returns'), String(S.comebacks)) : '',
      line(t('pg_flow_wk'), t('pg_of', { a: wk.f, b: wk.s })),
      line(t('pg_span'), sp.now ? fmtDur(sp.now) + (sp.then && sp.then !== sp.now ? ' ' + t('pg_span_was', { m: fmtDur(sp.then) }) : '') : t('pg_span_none')),
      line(t('pg_bonus'), n ? '× ' + dec(multOf(n), 2) : t('pg_bonus_0')),
    ].join('');
    const det = (k, title, body) => `<details class="g-card y-det" data-det="${k}" ${openDet.has(k) ? 'open' : ''}><summary>${esc(title)}</summary>${openDet.has(k) ? body() : ''}</details>`;
    const ach = ML.achInfo ? ML.achInfo() : null;
    const html = `<div class="y-page pg">
      <p class="yl-big">${yr.mins ? `<b data-count="${yr.mins}" data-fmt="m">${esc(fmtDur(yr.mins))}</b> ${esc(t('pg_since', { n: yr.weeks }))}` : esc(t('pg_none'))}</p>
      <ul class="yl">${lines}</ul>
      <p class="insight">${esc(t('fc_rule'))}</p>
      <div class="y-btns">${tryM ? `<button type="button" class="primary" data-span="${tryM}">${esc(t('fc_span_try', { m: fmtDur(tryM) }))}</button>` : ''}<button type="button" class="ghost" data-stuck>${esc(t('st_btn'))}</button></div>
      ${projHtml()}
      <div class="yl-level"><p><span>${esc(t('pg_level'))}</span> <b>${esc(lv.name)}</b></p><span class="y-track"><b style="width:${(lv.frac * 100).toFixed(1)}%"></b></span>
        <p class="insight">${esc(lv.next ? t('pg_xp_left', { n: (lv.next - S.xp).toLocaleString(ML.locale()), name: lv.nextName }) + ' ' : '')}${esc(t('xp_rules'))}</p></div>
      ${ach ? det('ach', t('pg_ach', { a: ach.got, b: ach.total }), () => ach.html()) : ''}
      ${S.sessions.length ? det('trend', t('pj_trend'), trendHtml) : ''}
      ${det('heat', t('six_months'), () => ML.heatmapHtml ? ML.heatmapHtml() : '')}
      ${det('works', t('what_works'), () => (ML.whatWorksHtml ? ML.whatWorksHtml() : '') + (ML.distractHtml ? ML.distractHtml() : ''))}
    </div>`;
    if (el.dataset.h === html) return;
    el.innerHTML = html; el.dataset.h = html;
    countUp(el);
  }
  // Asked once, never on first contact (pro pass D7): only after 5 sessions, when You opens. Until then You
  // behaves as "further"; the choice is also in Settings.
  function askGoal() {
    if (S.goalProfile || (S.sessions || []).length < 5 || $('goalq') && !$('goalq').hidden) return;
    ML.ySheet('goalq', `<h2>${esc(t('gp_q'))}</h2><p class="insight">${esc(t('gp_p'))}</p><div class="y-btns y-col">${['further', 'start', 'phone'].map(k => `<button type="button" data-gp="${k}">${esc(t('gp_' + k))}</button>`).join('')}</div><button type="button" class="ghost" data-gp="skip">${esc(t('gp_skip'))}</button>`, r => {
      r.onclick = e => { const b = e.target.closest('[data-gp]'); if (!b) return; ML.closeOverlay('goalq'); setProfile(b.dataset.gp === 'skip' ? 'further' : b.dataset.gp); };
    });
  }
  on('tab', n => { if (ML.SPACE[n] === 'you' || n === 'yhome') setTimeout(askGoal, 300); });
  // Lively: numbers climb when the page opens, once per visit
  let counted = false;
  function countUp(el) {
    if (S.youStyle !== 'lively' || ML.reducedMotion() || counted) return;
    counted = true;
    el.querySelectorAll('[data-count]').forEach(n => {
      const to = +n.dataset.count, isM = n.dataset.fmt === 'm', t0 = performance.now();
      if (!to) return;
      const step = now => { const k = Math.min(1, (now - t0) / 700), v = Math.round(to * (1 - Math.pow(1 - k, 3))); n.textContent = isM ? fmtDur(v) : v; if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }
  $('focus').addEventListener('click', e => {
    const q = a => e.target.closest('[data-' + a + ']');
    if (q('stuck')) return openStuck();
    if (q('pj')) { pjOff = Math.min(0, pjOff + +q('pj').dataset.pj); return render(); }
    if (q('span')) return ML.lockIn({ taskId: S.activeId, title: S.freeTitle, mins: +q('span').dataset.span });
  });
  // A folded part is only built when opened
  $('focus').addEventListener('toggle', e => { const d = e.target.closest && e.target.closest('details[data-det]'); if (!d) return; const k = d.dataset.det, was = openDet.has(k); if (d.open) openDet.add(k); else openDet.delete(k); if (was !== d.open) render(); }, true);

  /* ---------- I can't start ---------- */
  function openStuck() {
    const cur = S.activeId && S.tasks.find(x => x.id === S.activeId);
    ML.ySheet('stuck', `<h2>${esc(t('st_h'))}</h2><input type="text" id="st-step" maxlength="120" placeholder="${esc(t('st_ph'))}" value="${esc(cur ? ML.titleOf(cur) : S.freeTitle || '')}"><p class="insight">${esc(t('st_p'))}</p>
      <div class="y-btns"><button type="button" class="primary" data-go="2">${esc(t('st_2'))}</button><button type="button" data-go="5">${esc(t('st_5'))}</button></div>`, r => {
      r.addEventListener('click', e => {
        const b = e.target.closest('[data-go]'); if (!b) return;
        const v = r.querySelector('#st-step').value.trim(), prev = S.focusMins;
        ML.closeOverlay('stuck');
        const keep = cur && (!v || v === ML.titleOf(cur));
        if (ML.lockIn({ taskId: keep ? cur.id : null, title: keep ? null : v || t('free_focus'), mins: +b.dataset.go })) { S.tiny = { prev }; save(); }
      }, { once: false });
    });
  }
  ML.openStuck = openStuck;
  $('stuck-btn').onclick = openStuck;
  function renderStuck() { $('stuck-btn').hidden = !!(ML.running() || S.mode !== 'focus' || S.remaining < S.total); }
  // A tiny session reset before its end gives the usual duration back
  on('timer', () => {
    renderStuck();
    if (S.tiny && !ML.running() && S.remaining === S.total) { S.focusMins = S.tiny.prev; S.tiny = null; save(); }
  });

  /* ---------- Bad day reset ---------- */
  function tomorrow() { const d = new Date(); d.setDate(d.getDate() + 1); return dayKey(d); }
  function openReset() {
    S.resetDay = today(); save();
    ML.ySheet('reset-day', `<h2>${esc(t('rs_h'))}</h2><p class="insight">${esc(t('rs_p'))}</p><input type="text" id="rs-step" maxlength="120" placeholder="${esc(t('rs_ph'))}">
      <div class="y-btns"><button type="button" class="primary" id="rs-save">${esc(t('rs_save'))}</button><button type="button" data-close="reset-day">${esc(t('rs_later'))}</button></div>`, r => {
      r.querySelector('#rs-save').onclick = () => {
        const v = r.querySelector('#rs-step').value.trim(); if (!v) return r.querySelector('#rs-step').focus();
        S.tasks.push({ id: uid(), title: v, mins: 15, pri: 'high', done: false, due: tomorrow() });
        save(); ML.closeOverlay('reset-day'); ML.renderAll(); toast(t('rs_ok'));
      };
    });
  }
  // In the evening of an empty day, for someone who has worked in the last two weeks. No reproach, offered once.
  function maybeReset() {
    if (new Date().getHours() < 19 || S.resetDay === today() || period() === 'holidays' || ML.running()) return;
    if (minsOn(today()) >= 10 || !S.sessions.some(s => s.at >= Date.now() - 14 * 864e5)) return;
    S.resetDay = today(); save();
    toast(t('rs_toast'), { action: { label: t('rs_open'), fn: openReset }, ms: 12000 });
  }

  // Period, goal and display: settings, not stats (3.66, moved out of the Progress page)
  ML.settingsSection({
    order: 32,
    render: () => {
      const pd = period(), x = nextExam();
      return `<h3>${esc(t('pg_set_h'))}</h3>
      <label class="field"><span>${esc(t('pd_title'))}</span>${ML.ui.sel('set-pd', ML.PERIODS.map(k => [k, t('pd_' + k)]), S.period.key || 'term')}</label>
      <p class="hint">${esc(t('pd_h_' + pd))}${pd === 'exams' && x ? ' ' + esc(t('pd_exam_line', { name: x.name, n: daysTo(x.date) })) + '.' : ''}</p>
      ${ML.ui.chk('pd-auto', t('pd_auto'), S.period.auto !== false)}
      <label class="field"><span>${esc(t('gp_set'))}</span>${ML.ui.sel('set-gp', ['further', 'start', 'phone'].map(k => [k, t('gp_' + k)]), S.goalProfile || 'further')}</label>
      <label class="field"><span>${esc(t('fc_style'))}</span>${ML.ui.sel('set-style', [['calm', t('fc_calm')], ['lively', t('fc_lively')]], S.youStyle)}</label>
      <p class="hint">${esc(t('fc_style_h'))}</p>
      ${ML.ui.chk('set-over', t('ov_set'), S.overGuard !== false)}`;
    },
    bind: r => {
      r.querySelector('#set-over').onchange = e => { S.overGuard = e.target.checked; save(); };
      r.querySelector('#set-pd').onchange = e => { setPeriod(e.target.value); ML.renderSettings(); };
      r.querySelector('#pd-auto').onchange = e => { S.period.auto = e.target.checked; save(); emit('period', period()); render(); };
      r.querySelector('#set-gp').onchange = e => { S.goalProfile = e.target.value; save(); applyLook(); render(); emit('render'); };
      r.querySelector('#set-style').onchange = e => { S.youStyle = e.target.value; counted = false; save(); applyLook(); emit('render'); };
    },
  });
  on('tab', n => { if (n === 'focus') counted = false; render(); });
  on('render', render); on('minute', () => { render(); maybeReset(); }); on('lang', render); on('rated', render);
  on('newday', () => { freezeDays(); toldExam(); });
  on('started', () => { applyLook(); freezeDays(); toldExam(); renderStuck(); render(); setTimeout(maybeReset, 4000); });
})();
