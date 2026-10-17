// Focus+: full-screen Deep focus mode, "I got distracted" counter, guided weekly review,
// and the best-hour estimate the planner uses to put hard tasks at your sharpest time.
(() => {
  'use strict';
  const { $, S, t, tn, esc, save, on, emit, toast, dayKey, today, addDays, parseDay, fmtMins } = ML;

  ML.addStrings({
    fr: {
      deep_focus: 'Mode Deep focus (plein écran)', deep_exit: 'Échap pour quitter', distracted: 'J’ai décroché', distract_ok: 'Noté ({n} cette session). Respire, et reviens à ta tâche.',
      distract_stats: 'Décrochages', distract_line: '{n} cette semaine · {r} par heure de focus', distract_worst: 'Moment le plus difficile : {time}.', distract_none: 'Aucun décrochage noté cette semaine. Utilise ⚡ quand ton esprit s’échappe.',
      weekly_review: 'Revue de la semaine', review_open: 'Faire ma revue hebdo', review_prompt: 'C’est le moment de ta revue de la semaine.',
      rv_minutes: 'Focus', rv_sessions: 'Sessions', rv_avg: 'Concentration', rv_tasks: 'Tâches finies', rv_distr: 'Décrochages', rv_best: 'Meilleur jour', rv_vs: 'vs semaine d’avant',
      rv_wins: 'Ce qui a bien marché', rv_improve: 'Ce que je veux améliorer', rv_goal: 'Mon objectif principal pour la semaine prochaine', rv_save: 'Sceller la revue (+50 XP)', rv_saved: 'Revue scellée. +50 XP', rv_updated: 'Revue mise à jour',
      rv_ach: 'Succès débloqués', rv_none: 'aucun', week_goal: 'Objectif de la semaine', best_hour_note: '(tâches difficiles vers {h}h, ton meilleur moment)', rv_week_of: 'Semaine du {d}',
    },
    en: {
      deep_focus: 'Deep focus mode (full screen)', deep_exit: 'Esc to leave', distracted: 'I got distracted', distract_ok: 'Logged ({n} this session). Breathe, then back to your task.',
      distract_stats: 'Distractions', distract_line: '{n} this week · {r} per focus hour', distract_worst: 'Hardest time of day: {time}.', distract_none: 'No distractions logged this week. Tap ⚡ when your mind wanders.',
      weekly_review: 'Weekly review', review_open: 'Do my weekly review', review_prompt: 'Time for your weekly review.',
      rv_minutes: 'Focus', rv_sessions: 'Sessions', rv_avg: 'Focus quality', rv_tasks: 'Tasks done', rv_distr: 'Distractions', rv_best: 'Best day', rv_vs: 'vs the week before',
      rv_wins: 'What went well', rv_improve: 'What I want to improve', rv_goal: 'My main goal for next week', rv_save: 'Seal the review (+50 XP)', rv_saved: 'Review sealed. +50 XP', rv_updated: 'Review updated',
      rv_ach: 'Achievements unlocked', rv_none: 'none', week_goal: 'Goal of the week', best_hour_note: '(hard tasks around {h}:00, your best time)', rv_week_of: 'Week of {d}',
    },
  });
  ML.defaults(() => ({ distr: [], curDistr: 0, reviews: {}, reviewPrompted: null }));

  const weekStart = (k = today()) => { const d = parseDay(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayKey(d); };
  const inWeek = (ts, wk) => { const k = dayKey(new Date(ts)); return k >= wk && k <= addDays(wk, 6); };
  const bucketOf = ts => { const h = new Date(ts).getHours(); return h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 22 ? 'evening' : 'night'; };

  /* ---------- Distractions ---------- */
  function renderDistract() { $('distract-n').textContent = S.curDistr ? S.curDistr : ''; }
  function distracted() {
    S.curDistr = (S.curDistr || 0) + 1;
    S.distr.push({ at: Date.now(), mood: S.mood });
    if (S.distr.length > 3000) S.distr = S.distr.slice(-3000);
    save(); renderDistract(); renderDeep();
    toast(t('distract_ok', { n: S.curDistr }));
    emit('distracted');
  }
  $('distract-btn').onclick = distracted;
  on('render', renderDistract);

  /* ---------- Deep focus ---------- */
  let deepOn = false;
  function openDeep() {
    deepOn = true; $('deep').hidden = false; renderDeep(true);
    const el = $('deep');
    try { if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {}); } catch (e) {}
  }
  function closeDeep() {
    deepOn = false; $('deep').hidden = true;
    try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (e) {}
  }
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && deepOn && $('deep').hidden) deepOn = false; });
  function renderDeep(full) {
    if (!deepOn) return;
    const task = S.tasks.find(x => x.id === S.activeId);
    const rem = ML.remainingNow(), frac = Math.max(0, rem) / S.total;
    if (full || !$('dp-clock')) {
      $('deep-inner').innerHTML = `
        <div class="deep-top"><span class="state" id="dp-state"></span><button type="button" class="ghost icon-only" id="dp-close" aria-label="${esc(t('close'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
        <div class="deep-clock" id="dp-clock"></div>
        <div class="deep-task" id="dp-task"></div>
        <div class="deep-bar"><b id="dp-bar"></b></div>
        ${task && task.subs && task.subs.length ? `<ul class="deep-subs">${task.subs.map(s => `<li><label><input type="checkbox" data-dsub="${s.id}" ${s.done ? 'checked' : ''}> <span>${esc(s.text)}</span></label></li>`).join('')}</ul>` : ''}
        <div class="deep-btns">
          <button type="button" class="primary" id="dp-toggle"></button>
          <button type="button" id="dp-distract">⚡ ${esc(t('distracted'))} <span id="dp-dn"></span></button>
          <button type="button" id="dp-finish">${esc(t('finish'))}</button>
        </div>
        <form class="park" id="dp-park" autocomplete="off"><input type="text" maxlength="140" placeholder="${esc(t('park_ph'))}" id="dp-park-in"><button type="submit">${esc(t('park'))}</button></form>
        <p class="hint">${esc(t('deep_exit'))}</p>`;
      $('dp-close').onclick = closeDeep;
      $('dp-toggle').onclick = () => ML.toggleTimer();
      $('dp-distract').onclick = distracted;
      $('dp-finish').onclick = () => $('skip').click();
      $('dp-park').onsubmit = e => { e.preventDefault(); const v = $('dp-park-in').value.trim(); if (!v) return; $('park-input').value = v; $('park-form').requestSubmit(); $('dp-park-in').value = ''; };
      $('deep-inner').onchange = e => {
        const cb = e.target.closest('[data-dsub]'); if (!cb || !task) return;
        const sub = task.subs.find(s => s.id === cb.dataset.dsub); if (sub) { sub.done = cb.checked; save(); ML.renderAll(); }
      };
    }
    $('dp-clock').textContent = MiniView.fmtClock(rem);
    $('dp-state').textContent = $('state').textContent;
    $('dp-task').textContent = S.mode === 'break' ? $('c-task').textContent : (ML.activeTitle() || t('free_focus'));
    $('dp-bar').style.width = ((1 - frac) * 100).toFixed(2) + '%';
    $('dp-toggle').textContent = $('start').textContent;
    $('dp-dn').textContent = S.curDistr ? '(' + S.curDistr + ')' : '';
  }
  $('deep-btn').onclick = openDeep;
  on('tick', () => renderDeep(false));
  on('timer', () => renderDeep(true));
  ML.openDeep = openDeep;

  // Shortcut D for Deep focus; Esc closes Deep focus, the shop and the review
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (deepOn) closeDeep(); ['shop', 'review'].forEach(id => { if (!$(id).hidden) $(id).hidden = true; }); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || (e.target && e.target.closest('input, textarea, select'))) return;
    if (e.key.toLowerCase() === 'd' && $('settings').hidden) { deepOn ? closeDeep() : openDeep(); }
  });

  /* ---------- Leave detection (Forest-style soft blocker) ---------- */
  // A web app can't block other apps on a phone. Instead, leaving MerlinsLockIN during a focus session
  // for more than 10 s counts as a distraction; in strict mode it also knocks a floor off the tower.
  ML.addStrings({
    fr: {
      set_leave: 'Rester dans l’app', opt_leave: 'Détecter quand je quitte l’app pendant le focus', opt_strict: 'Mode strict : quitter plus de 10 s fait tomber un étage de la tour',
      leave_hint: 'Une app web ne peut pas bloquer les autres apps du téléphone. Combine avec le mode Concentration de ton téléphone : iPhone → Réglages → Concentration (et une automatisation Raccourcis « quand MerlinsLockIN s’ouvre »), Android → Bien-être numérique → Mode Concentration.',
      left_for: 'Tu as quitté l’app pendant {d}. C’est compté comme un décrochage.',
    },
    en: {
      set_leave: 'Stay in the app', opt_leave: 'Notice when I leave the app during focus', opt_strict: 'Strict mode: leaving for more than 10 s knocks a floor off the tower',
      leave_hint: "A web app can't block other apps on a phone. Pair it with your phone's focus mode: iPhone → Settings → Focus (plus a Shortcuts automation \"when MerlinsLockIN opens\"), Android → Digital Wellbeing → Focus mode.",
      left_for: 'You left the app for {d}. That counts as a distraction.',
    },
  });
  const TOUCH = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  ML.defaults(() => ({ leaveDetect: TOUCH, strict: false }));
  let hiddenAt = null;
  document.addEventListener('visibilitychange', () => {
    if (!S.leaveDetect) return;
    if (document.visibilityState === 'hidden') { if (ML.running() && S.mode === 'focus') hiddenAt = Date.now(); return; }
    if (!hiddenAt) return;
    const away = (Date.now() - hiddenAt) / 1000; hiddenAt = null;
    if (away < 10) return;
    S.curDistr = (S.curDistr || 0) + 1;
    S.distr.push({ at: Date.now(), mood: S.mood, away: Math.round(away), left: true });
    save(); renderDistract();
    toast(t('left_for', { d: away >= 60 ? fmtMins(away / 60) : Math.round(away) + ' s' }), { ms: 5000 });
    emit('left', { secs: away, strict: !!S.strict });
  });
  ML.settingsSection({
    order: 22,
    render: () => `<h3>${esc(t('set_leave'))}</h3>
      ${ML.ui.chk('set-leave', t('opt_leave'), S.leaveDetect)}
      ${ML.ui.chk('set-strict', t('opt_strict'), S.strict)}
      <p class="hint">${esc(t('leave_hint'))}</p>`,
    bind: r => {
      r.querySelector('#set-leave').onchange = e => { S.leaveDetect = e.target.checked; save(); };
      r.querySelector('#set-strict').onchange = e => { S.strict = e.target.checked; save(); };
    },
  });

  /* ---------- Best hour (for smart auto-plan) ---------- */
  ML.bestHour = () => {
    const rated = S.sessions.filter(s => s.rating);
    if (rated.length < 4) return null;
    const by = {};
    rated.forEach(s => { const h = new Date(s.start || s.at - s.mins * 60000).getHours(); (by[h] || (by[h] = [])).push(s.rating); });
    let best = null, bestScore = -1;
    for (const [h, arr] of Object.entries(by)) {
      if (arr.length < 2) continue;
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length, score = avg + Math.min(arr.length, 6) * 0.05;
      if (score > bestScore) { bestScore = score; best = +h; }
    }
    return best;
  };

  /* ---------- Weekly review ---------- */
  function weekStats(wk) {
    const ss = S.sessions.filter(s => inWeek(s.at, wk));
    const rated = ss.filter(s => s.rating);
    const byDay = {};
    ss.forEach(s => { const k = dayKey(new Date(s.at)); byDay[k] = (byDay[k] || 0) + s.mins; });
    const bestDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
    return {
      mins: ss.reduce((a, s) => a + s.mins, 0), n: ss.length,
      avg: rated.length ? rated.reduce((a, s) => a + s.rating, 0) / rated.length : null,
      tasks: S.tasks.filter(x => x.doneAt && inWeek(x.doneAt, wk)).length,
      distr: S.distr.filter(d => inWeek(d.at, wk)).length,
      bestDay: bestDay ? { k: bestDay[0], m: bestDay[1] } : null,
    };
  }
  function reviewWeek() { const d = new Date().getDay(); return d === 0 ? weekStart() : addDays(weekStart(), -7); } // Sunday: this week, other days: last week
  function openReview(wk = reviewWeek()) {
    const cur = weekStats(wk), prev = weekStats(addDays(wk, -7)), R = S.reviews[wk] || {};
    const delta = (a, b) => b ? `<small class="${a >= b ? 'up' : 'down'}">${a >= b ? '▲' : '▼'} ${Math.abs(Math.round((a - b) / b * 100))}%</small>` : '';
    const achs = Object.entries((S.game && S.game.ach) || {}).filter(([, ts]) => inWeek(ts, wk)).map(([id]) => t('a_' + id));
    const B = S.game && S.game.boss;
    $('review-body').innerHTML = `
      <p class="hint">${esc(t('rv_week_of', { d: parseDay(wk).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'long' }) }))} · ${esc(t('rv_vs'))}</p>
      <div class="rv-grid">
        <div class="kpi"><strong>${fmtMins(cur.mins)}</strong><span>${esc(t('rv_minutes'))}</span>${delta(cur.mins, prev.mins)}</div>
        <div class="kpi"><strong>${cur.n}</strong><span>${esc(t('rv_sessions'))}</span>${delta(cur.n, prev.n)}</div>
        <div class="kpi"><strong>${cur.avg ? cur.avg.toFixed(1) + '/5' : '—'}</strong><span>${esc(t('rv_avg'))}</span></div>
        <div class="kpi"><strong>${cur.tasks}</strong><span>${esc(t('rv_tasks'))}</span>${delta(cur.tasks, prev.tasks)}</div>
        <div class="kpi"><strong>${cur.distr}</strong><span>${esc(t('rv_distr'))}</span></div>
        <div class="kpi"><strong>${cur.bestDay ? esc(parseDay(cur.bestDay.k).toLocaleDateString(ML.locale(), { weekday: 'short' })) : '—'}</strong><span>${esc(t('rv_best'))}</span></div>
      </div>
      <p class="insight">${esc(t('rv_ach'))} : ${esc(achs.length ? achs.join(', ') : t('rv_none'))}${B && B.week === wk ? ' · ⚔ ' + esc(B.title) + (B.done ? ' ✓' : '') : ''}</p>
      <form class="rv-form" id="rv-form">
        <label><span class="label">${esc(t('rv_wins'))}</span><textarea name="wins" rows="2">${esc(R.wins || '')}</textarea></label>
        <label><span class="label">${esc(t('rv_improve'))}</span><textarea name="improve" rows="2">${esc(R.improve || '')}</textarea></label>
        <label><span class="label">${esc(t('rv_goal'))}</span><input type="text" name="goal" maxlength="140" value="${esc(R.goal || '')}"></label>
        <button type="submit" class="primary">${esc(R.at ? t('save') : t('rv_save'))}</button>
      </form>`;
    $('rv-form').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target), first = !S.reviews[wk] || !S.reviews[wk].at;
      S.reviews[wk] = { wins: String(fd.get('wins')).trim(), improve: String(fd.get('improve')).trim(), goal: String(fd.get('goal')).trim(), at: Date.now() };
      if (first) { ML.addXp(50); toast(t('rv_saved')); } else toast(t('rv_updated'));
      save(); $('review').hidden = true; renderGoal();
    };
    ML.openOverlay('review');
  }
  ML.openReview = openReview;
  // The goal set in last week's review shows above the quests this week
  function renderGoal() {
    let el = $('week-goal');
    if (!el) { el = document.createElement('div'); el.id = 'week-goal'; $('quest-strip').before(el); }
    const R = S.reviews[addDays(weekStart(), -7)];
    el.innerHTML = R && R.goal ? `<div class="week-goal"><span class="label">🎯 ${esc(t('week_goal'))}</span><b>${esc(R.goal)}</b></div>` : '';
  }
  function maybePrompt() {
    const d = new Date().getDay(), wk = reviewWeek();
    if ((d === 0 || d === 1) && !(S.reviews[wk] && S.reviews[wk].at) && S.reviewPrompted !== today() && weekStats(wk).n > 0) {
      S.reviewPrompted = today(); save();
      setTimeout(() => toast(t('review_prompt'), { action: { label: t('review_open'), fn: () => openReview(wk) } }), 4000);
    }
  }
  on('started', () => { renderGoal(); maybePrompt(); renderDistract(); });
  on('newday', () => { renderGoal(); maybePrompt(); });

  /* ---------- Grimoire additions ---------- */
  on('grimoire', () => {
    const wk = weekStart(), st = weekStats(wk);
    const hours = Math.max(0.5, st.mins / 60), worst = {};
    S.distr.filter(d => inWeek(d.at, wk)).forEach(d => { const b = bucketOf(d.at); worst[b] = (worst[b] || 0) + 1; });
    const w = Object.entries(worst).sort((a, b) => b[1] - a[1])[0];
    const card = document.createElement('div');
    card.className = 'g-card';
    card.innerHTML = `<h2>${esc(t('distract_stats'))}</h2>
      <p class="insight">${st.distr ? esc(t('distract_line', { n: st.distr, r: (st.distr / hours).toFixed(1) })) + (w ? ' ' + esc(t('distract_worst', { time: t('time_' + w[0]) })) : '') : esc(t('distract_none'))}</p>
      <button type="button" class="small" id="g-review">${esc(t('review_open'))}</button>`;
    $('g-game').prepend(card);
    $('g-review').onclick = () => openReview();
  });
})();
