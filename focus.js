// Focus (3.62): the You section about the quality of the work, not only the time. Flow sessions and their chain, Comeback,
// Focus span, periods of the year (Term, Exams, Light, Holidays), Goal profile, Calm / Lively, "I can't start" and the
// bad day reset. Everything here is worked out from S.sessions. ML.priv is the storage kept out of the sync (guard.js, health.js).
(() => {
  'use strict';
  const { $, S, t, esc, on, emit, save, toast, today, fmtMins, dayKey, uid } = ML;

  ML.addStrings({
    fr: {
      tab_focus: 'Focus', tab_health: 'Santé', tab_screen: 'Temps d’écran', grp_progress: 'Progression', grp_well: 'Bien-être', grp_more: 'Plus',
      fc_deep: 'Heures profondes', fc_flow: 'Flow, 7 jours', fc_chain: 'Bonus', fc_chain_h: 'Chain', fc_chain_n: '{n} de suite', fc_chain_0: 'La prochaine session propre lance la chaîne.',
      fc_rule: 'Une session Flow : 25 min ou plus, finie, sans pause ni décrochage, notée 4 ou 5 si tu la notes.',
      fc_back_h: 'Retours', fc_back_p: 'Revenir après un trou compte double. Ton record ne s’efface jamais.', fc_record: 'Record', fc_returns: 'Retours', fc_streak: 'Série',
      fc_span_h: 'Focus span', fc_span_p: 'La durée que tu tiens sans décrocher, sur tes dernières sessions.', fc_span_ago: 'Il y a un mois : {m}.', fc_span_try: 'Essayer {m}', fc_span_none: 'Quelques sessions de plus et ta durée s’affichera ici.',
      fc_today: 'Aujourd’hui', fc_goal: '{m} sur {g}', fc_nogoal: '{m}, sans objectif',
      fc_style: 'Affichage', fc_calm: 'Calm', fc_lively: 'Lively',
      pd_title: 'Période', pd_term: 'Term', pd_exams: 'Exams', pd_light: 'Light', pd_holidays: 'Holidays', pd_auto: 'Passer en Exams 14 jours avant un examen', pd_auto_on: 'Période Exams activée : {name} dans {n} j.', pd_exam_line: '{name} dans {n} j',
      pd_h_term: 'Objectif 3 h par jour.', pd_h_exams: 'Objectif 5 h par jour.', pd_h_light: 'Objectif 1 h par jour.', pd_h_holidays: 'Pas d’objectif, ta série est gelée.',
      gp_q: 'Que cherches-tu ici ?', gp_further: 'Aller plus loin', gp_start: 'Réussir à commencer', gp_phone: 'Moins de téléphone', gp_change: 'Objectif : {g}',
      fl_toast: 'Flow · +{xp} XP', cb_toast: 'Tu es revenu. Session doublée · +{xp} XP',
      st_btn: 'Je n’arrive pas à commencer', st_h: 'Quel est le plus petit geste ?', st_ph: 'Ouvrir le chapitre 4', st_p: 'Après, tu peux t’arrêter. Les deux comptent.', st_2: '2 minutes', st_5: '5 minutes', st_done: 'Tu as commencé. +{xp} XP',
      rs_toast: 'Journée difficile ? Prépare demain.', rs_open: 'Ouvrir', rs_h: 'Journée difficile. C’est noté, et c’est fini.', rs_p: 'Une seule chose pour demain :', rs_ph: 'Lire 3 pages du chapitre 4', rs_save: 'Garder pour demain', rs_later: 'Pas ce soir', rs_ok: 'C’est prêt pour demain.',
      ov_toast: '{h} aujourd’hui. Le bonus du jour est acquis : tu peux t’arrêter.',
      ov_set: 'Arrêter les bonus et proposer de s’arrêter après une longue journée',
    },
    en: {
      tab_focus: 'Focus', tab_health: 'Health', tab_screen: 'Screen time', grp_progress: 'Progress', grp_well: 'Wellbeing', grp_more: 'More',
      fc_deep: 'Deep hours', fc_flow: 'Flow, 7 days', fc_chain: 'Bonus', fc_chain_h: 'Chain', fc_chain_n: '{n} in a row', fc_chain_0: 'Your next clean session starts the chain.',
      fc_rule: 'A Flow session: 25 min or more, finished, no pause or distraction, rated 4 or 5 if you rate it.',
      fc_back_h: 'Comebacks', fc_back_p: 'Coming back after a gap counts double. Your record is never erased.', fc_record: 'Record', fc_returns: 'Comebacks', fc_streak: 'Streak',
      fc_span_h: 'Focus span', fc_span_p: 'How long you hold without a distraction, over your last sessions.', fc_span_ago: 'A month ago: {m}.', fc_span_try: 'Try {m}', fc_span_none: 'A few more sessions and your span shows here.',
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

  /* ---------- The page ---------- */
  const seg = (attr, items, cur) => `<div class="y-seg" role="group">${items.map(([k, l]) => `<button type="button" data-${attr}="${k}" aria-pressed="${k === cur}">${esc(l)}</button>`).join('')}</div>`;
  function render() {
    const el = $('focus'); if (!el || S.tab !== 'focus') return;
    const week = S.sessions.filter(s => s.at >= Date.now() - 7 * 864e5), flows = week.filter(isFlow);
    const n = chainOf(S.sessions), st = ML.streaks(), sp = span(), m = minsOn(today()), g = dayGoal(), pd = period(), x = nextExam();
    const dots = Array.from({ length: 10 }, (_, i) => `<i class="${i < Math.min(n, 10) ? 'on' : ''}" style="--i:${i}"></i>`).join('');
    const tryM = sp.now ? Math.min(120, Math.ceil((sp.now + 1) / 5) * 5) : 0, deep = flows.reduce((a, s) => a + s.mins, 0);
    const blocks = {
      goal: S.goalProfile ? '' : `<div class="g-card"><h2>${esc(t('gp_q'))}</h2><div class="y-btns">${['further', 'start', 'phone'].map(k => `<button type="button" class="small" data-gp="${k}">${esc(t('gp_' + k))}</button>`).join('')}</div></div>`,
      today: `<div class="g-card"><div class="y-row"><h2>${esc(t('fc_today'))}</h2><span class="insight">${esc(g ? t('fc_goal', { m: fmtMins(m), g: fmtMins(g) }) : t('fc_nogoal', { m: fmtMins(m) }))}</span></div>${g ? `<span class="y-track"><b style="width:${Math.min(100, m / g * 100).toFixed(0)}%"></b></span>` : ''}
        <button type="button" class="small y-start" data-stuck>${esc(t('st_btn'))}</button></div>`,
      flow: `<div class="g-row"><div class="g-card kpi"><strong data-count="${deep}" data-fmt="m">${fmtMins(deep)}</strong><span>${esc(t('fc_deep'))}</span></div><div class="g-card kpi"><strong data-count="${flows.length}">${flows.length}</strong><span>${esc(t('fc_flow'))}</span></div><div class="g-card kpi"><strong>×${multOf(n).toFixed(2).replace(/0$/, '')}</strong><span>${esc(t('fc_chain'))}</span></div></div>
        <div class="g-card"><div class="y-row"><h2>${esc(t('fc_chain_h'))}</h2><span class="insight">${esc(n ? t('fc_chain_n', { n }) : t('fc_chain_0'))}</span></div><div class="y-chain">${dots}</div><p class="insight">${esc(t('fc_rule'))}</p></div>`,
      span: `<div class="g-card"><div class="y-row"><h2>${esc(t('fc_span_h'))}</h2>${sp.now ? `<strong class="y-num" data-count="${sp.now}" data-fmt="m">${fmtMins(sp.now)}</strong>` : ''}</div><p class="insight">${esc(sp.now ? t('fc_span_p') : t('fc_span_none'))}${sp.then ? ' ' + esc(t('fc_span_ago', { m: fmtMins(sp.then) })) : ''}</p>${tryM ? `<button type="button" class="small" data-span="${tryM}">${esc(t('fc_span_try', { m: fmtMins(tryM) }))}</button>` : ''}</div>`,
      back: `<div class="g-card"><h2>${esc(t('fc_back_h'))}</h2><div class="y-trio">${S.goalProfile === 'start' ? '' : `<div class="kpi"><strong>${st.cur}</strong><span>${esc(t('fc_streak'))}</span></div>`}<div class="kpi"><strong>${st.best}</strong><span>${esc(t('fc_record'))}</span></div><div class="kpi"><strong>${S.comebacks || 0}</strong><span>${esc(t('fc_returns'))}</span></div></div><p class="insight">${esc(t('fc_back_p'))}</p></div>`,
      period: `<div class="g-card"><h2>${esc(t('pd_title'))}</h2>${seg('pd', ML.PERIODS.map(k => [k, t('pd_' + k)]), pd)}<p class="insight">${esc(t('pd_h_' + pd))}${pd === 'exams' && x ? ' ' + esc(t('pd_exam_line', { name: x.name, n: daysTo(x.date) })) + '.' : ''}</p>${ML.ui.chk('pd-auto', t('pd_auto'), S.period.auto !== false)}</div>`,
      style: `<div class="y-row y-foot"><span class="insight">${esc(t('fc_style'))}</span>${seg('style', [['calm', t('fc_calm')], ['lively', t('fc_lively')]], S.youStyle)}</div>`,
    };
    const order = S.goalProfile === 'start' ? ['goal', 'today', 'back', 'span', 'flow', 'period', 'style'] : ['goal', 'today', 'flow', 'span', 'back', 'period', 'style'];
    const html = `<div class="y-page">${order.map(k => blocks[k]).join('')}</div>`;
    if (el.dataset.h === html) return;
    el.innerHTML = html; el.dataset.h = html;
    countUp(el);
  }
  // Lively: numbers climb when the page opens, once per visit
  let counted = false;
  function countUp(el) {
    if (S.youStyle !== 'lively' || ML.reducedMotion() || counted) return;
    counted = true;
    el.querySelectorAll('[data-count]').forEach(n => {
      const to = +n.dataset.count, isM = n.dataset.fmt === 'm', t0 = performance.now();
      if (!to) return;
      const step = now => { const k = Math.min(1, (now - t0) / 700), v = Math.round(to * (1 - Math.pow(1 - k, 3))); n.textContent = isM ? fmtMins(v) : v; if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }
  $('focus').addEventListener('click', e => {
    const q = a => e.target.closest('[data-' + a + ']');
    if (q('gp')) return setProfile(q('gp').dataset.gp);
    if (q('stuck')) return openStuck();
    if (q('pd')) return setPeriod(q('pd').dataset.pd);
    if (q('style')) { S.youStyle = q('style').dataset.style; counted = false; save(); applyLook(); return render(); }
    if (q('span')) return ML.lockIn({ taskId: S.activeId, title: S.freeTitle, mins: +q('span').dataset.span });
  });
  $('focus').addEventListener('change', e => { if (e.target.id === 'pd-auto') { S.period.auto = e.target.checked; save(); emit('period', period()); render(); } });

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

  ML.settingsSection({
    order: 32,
    render: () => `<h3>${esc(t('tab_focus'))}</h3>${ML.ui.chk('set-over', t('ov_set'), S.overGuard !== false)}`,
    bind: r => { r.querySelector('#set-over').onchange = e => { S.overGuard = e.target.checked; save(); }; },
  });
  on('tab', n => { if (n === 'focus') counted = false; render(); });
  on('render', render); on('minute', () => { render(); maybeReset(); }); on('lang', render); on('rated', render);
  on('newday', () => { freezeDays(); toldExam(); });
  on('started', () => { applyLook(); freezeDays(); toldExam(); renderStuck(); render(); setTimeout(maybeReset, 4000); });
})();
