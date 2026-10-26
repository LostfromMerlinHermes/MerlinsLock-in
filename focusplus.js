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

  /* ---------- Deep focus ----------
     Two worlds have their own full screen (3.31), and the classic dial stays one tap away (S.deepStyle[world] = 'classic'):
     - Netrunner: "terminal" — big digits with a magenta offset, one block per minute with the four quarters marked,
       a live session log on the left and today's tasks as a file list on the right; a short glitch at each quarter.
     - Estampe: "proof" (l'épreuve) — the time printed in two plates, the red one slightly off register and lining up
       as the session goes on; printer's marks around; a ruler the red fills; a PAUSE rubber stamp; a seal at the end,
       when the ink city appears. Chosen by the user from proposals/pleinecran-fired2.png (D) and estampe-epreuve.png. */
  ML.addStrings({
    fr: {
      dp_style: 'Style du plein écran', dp_classic: 'Classique', dp_terminal: 'Terminal', dp_proof: 'Épreuve',
      nt_log: '// JOURNAL', nt_today: '// AUJOURD’HUI', nt_next: 'SUIVANTE >', nt_min: '{n} / {m} MIN', nt_none: '(aucune tâche)',
      lg_start: 'début', lg_q: 'quart {n}/4 ok', lg_park: 'pensée parquée', lg_distr: 'décroché ({n})', lg_pause: 'pause', lg_resume: 'reprise', lg_done: 'session terminée', lg_break: 'pause en cours',
      pf_focus: 'FOCUS · N° {n}', pf_paused: 'EN PAUSE', pf_done: 'SESSION IMPRIMÉE', pf_stamp: 'PAUSE', pf_streak: 'SÉRIE {n} J', pf_proof: 'ÉPREUVE N° {n} · {d}', pf_next: 'ensuite : {t}',
    },
    en: {
      dp_style: 'Full-screen style', dp_classic: 'Classic', dp_terminal: 'Terminal', dp_proof: 'Proof',
      nt_log: '// LOG', nt_today: '// TODAY', nt_next: 'NEXT >', nt_min: '{n} / {m} MIN', nt_none: '(no task)',
      lg_start: 'start', lg_q: 'quarter {n}/4 ok', lg_park: 'thought parked', lg_distr: 'distracted ({n})', lg_pause: 'paused', lg_resume: 'resumed', lg_done: 'session complete', lg_break: 'break running',
      pf_focus: 'FOCUS · NO. {n}', pf_paused: 'PAUSED', pf_done: 'SESSION PRINTED', pf_stamp: 'PAUSE', pf_streak: 'STREAK {n} D', pf_proof: 'PROOF NO. {n} · {d}', pf_next: 'next: {t}',
    },
  });
  ML.defaults(() => ({ deepStyle: {} }));
  const WORLD_STYLE = { netrunner: 'terminal', tokyo: 'proof' };
  const worldKey = () => { const r = document.documentElement, th = r.dataset.theme; return r.dataset.light ? { sanctuary: 'aube', observatory: 'atelier', netrunner: 'tokyo', arcade: 'cartouche' }[th] : th; };
  const styleNow = () => { const k = worldKey(), sp = WORLD_STYLE[k]; return sp && (S.deepStyle || {})[k] !== 'classic' ? sp : 'classic'; };
  const hm = d => ML.pad2(d.getHours()) + ':' + ML.pad2(d.getMinutes());
  const todaysSessions = () => { const td = today(); return S.sessions.filter(s => dayKey(new Date(s.at)) === td); };

  let deepOn = false, built = '', doneUntil = 0;
  // the session log of the terminal: lines added by what happens during the session, reset when a focus starts
  let log = [], lastQ = 0, wasRun = false, wasMode = null;
  const addLog = (txt, hot) => { log.push({ at: hm(new Date()), txt, hot }); if (log.length > 9) log = log.slice(-9); if (deepOn && built === 'terminal') renderLog(); };
  on('timer', () => {
    const run = ML.running();
    if (run && S.mode === 'focus' && (wasMode !== 'focus' || !wasRun)) {
      if (S.remaining >= S.total - 2 || wasMode !== 'focus') { log = []; lastQ = 0; addLog(t('lg_start')); } else addLog(t('lg_resume'));
    } else if (!run && wasRun && S.mode === 'focus' && S.remaining > 0) addLog(t('lg_pause'));
    else if (run && S.mode === 'break' && wasMode === 'focus') addLog(t('lg_break'));
    wasRun = run; wasMode = S.mode;
  });
  on('parked', () => addLog(t('lg_park')));
  on('distracted', () => addLog(t('lg_distr', { n: S.curDistr }), true));
  on('session', s => {
    if (!s || s.mins < 1) return;
    addLog(t('lg_done') + (s.xp ? ' · +' + s.xp + ' XP' : ''), true);
    doneUntil = Date.now() + 4200; // the world's ending plays in full screen before the end sheet (endscreen.js waits)
    if (deepOn) { renderDeep(true); setTimeout(() => renderDeep(true), 4300); }
  });
  ML.deepScene = () => deepOn && styleNow() !== 'classic';

  // Controls fade out after a few seconds without moving, so only the clock is left on screen
  let idleT = null;
  function wake() {
    const el = $('deep'); if (!deepOn) return;
    el.classList.remove('idle'); clearTimeout(idleT);
    idleT = setTimeout(() => { const a = document.activeElement; if (deepOn && ML.running() && !(a && a.id === 'dp-park-in')) el.classList.add('idle'); }, 3500);
  }
  ['pointermove', 'pointerdown', 'keydown'].forEach(ev => $('deep').addEventListener(ev, wake));
  function openDeep() {
    deepOn = true; built = ''; $('deep').hidden = false; renderDeep(true); wake();
    document.documentElement.classList.add('deep-on');
    const el = $('deep');
    try { if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); } catch (e) {}
  }
  function closeDeep() {
    deepOn = false; $('deep').hidden = true; clearTimeout(idleT);
    document.documentElement.classList.remove('deep-on');
    try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (e) {}
  }
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && deepOn && $('deep').hidden) deepOn = false; });
  const RING = 2 * Math.PI * 140;
  const X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  // top bar shared by every style: state, the style switch (when the world has its own screen), close
  function topHtml() {
    const sp = WORLD_STYLE[worldKey()], cur = styleNow();
    const sw = sp ? `<div class="dp-style seg-toggle" role="group" aria-label="${esc(t('dp_style'))}"><button type="button" data-dpstyle="classic" aria-pressed="${cur === 'classic'}">${esc(t('dp_classic'))}</button><button type="button" data-dpstyle="${sp}" aria-pressed="${cur === sp}">${esc(t('dp_' + sp))}</button></div>` : '';
    return `<div class="deep-top deep-ui"><span class="state" id="dp-state"></span>${sw}<button type="button" class="ghost icon-only" id="dp-close" aria-label="${esc(t('close'))}">${X}</button></div>`;
  }
  function dockHtml() {
    return `<div class="deep-dock deep-ui">
      <div class="deep-btns">
        <button type="button" class="primary" id="dp-toggle"></button>
        <button type="button" id="dp-distract">${esc(t('distracted'))} <span id="dp-dn"></span></button>
        <button type="button" id="dp-finish">${esc(t('finish'))}</button>
      </div>
      <form class="park" id="dp-park" autocomplete="off"><input type="text" maxlength="140" placeholder="${esc(t('park_ph'))}" id="dp-park-in"><button type="submit">${esc(t('park'))}</button></form>
      <p class="hint">${esc(t('deep_exit'))}</p>
    </div>`;
  }
  function classicHtml(task) {
    return `<div class="deep-aura" aria-hidden="true"><i></i><i></i><i></i></div>${topHtml()}
      <div class="deep-center">
        <div class="deep-dial">
          <svg viewBox="0 0 320 320" aria-hidden="true"><circle class="dd-track" cx="160" cy="160" r="140"/><circle class="dd-arc" id="dp-arc" cx="160" cy="160" r="140" stroke-dasharray="${RING}"/></svg>
          <div class="deep-clock" id="dp-clock" role="timer"></div>
        </div>
        <div class="deep-task" id="dp-task"></div>
        ${task && task.subs && task.subs.length ? `<ul class="deep-subs">${task.subs.map(s => `<li><label><input type="checkbox" data-dsub="${s.id}" ${s.done ? 'checked' : ''}> <span>${esc(s.text)}</span></label></li>`).join('')}</ul>` : ''}
      </div>${dockHtml()}`;
  }
  // Netrunner terminal
  const blocksOf = () => Math.max(5, Math.min(60, Math.round(S.total / 60)));
  function terminalHtml() {
    const n = blocksOf();
    return `${topHtml()}
      <div class="nt">
        <section class="nt-side nt-log"><h4>${esc(t('nt_log'))}</h4><ol id="nt-log"></ol></section>
        <div class="nt-main">
          <p class="nt-head">SESSION // <span id="nt-task"></span></p>
          <div class="nt-clock" id="nt-clock" role="timer"></div>
          <div class="nt-bar" id="nt-bar" style="--n:${n}">${Array.from({ length: n }, (_, i) => `<i${i && i % Math.round(n / 4) === 0 ? ' class="q"' : ''}></i>`).join('')}</div>
          <div class="nt-qs"><span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span></div>
          <p class="nt-min" id="nt-min"></p>
        </div>
        <section class="nt-side nt-files"><h4>${esc(t('nt_today'))}</h4><ul id="nt-files"></ul></section>
      </div>
      <p class="nt-next" id="nt-next"></p>${dockHtml()}`;
  }
  const fileName = s => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '').slice(0, 24);
  function renderLog() {
    const el = $('nt-log'); if (!el) return;
    el.innerHTML = log.map(l => `<li class="${l.hot ? 'hot' : ''}">${esc(l.at)} ${esc(l.txt)}</li>`).join('') + '<li class="cur">' + esc(hm(new Date())) + ' _</li>';
  }
  function renderFiles() {
    const el = $('nt-files'); if (!el) return;
    const td = today(), done = S.tasks.filter(x => x.done && x.doneAt && dayKey(new Date(x.doneAt)) === td);
    const open = ML.orderedOpen().filter(x => !x.done);
    const rows = [...done.map(x => ['ok', x]), ...open.map(x => [x.id === S.activeId ? 'cur' : '', x])].slice(0, 7);
    el.innerHTML = rows.length ? rows.map(([k, x]) => `<li class="${k}">${k === 'ok' ? '[OK]' : k === 'cur' ? '[&gt;&gt;]' : '[&nbsp;&nbsp;]'} ${esc(fileName(ML.titleOf(x)))}</li>`).join('') : `<li>${esc(t('nt_none'))}</li>`;
  }
  // Estampe proof
  function proofHtml() {
    const mins = Math.round(S.total / 60), step = mins <= 30 ? 1 : 5, lab = mins <= 60 ? 5 : 15;
    const ticks = []; for (let i = 0; i <= mins; i += step) ticks.push(i);
    if (ticks[ticks.length - 1] !== mins) ticks.push(mins);
    const q = [1, 2, 3].map(k => Math.round(mins * k / 4));
    return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="pf-rough"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2"/></filter>
        <filter id="pf-tex"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="2" result="n"/><feComponentTransfer in="n" result="m"><feFuncA type="discrete" tableValues="0 1 1 1 1"/></feComponentTransfer><feComposite in="SourceGraphic" in2="m" operator="in"/></filter></svg>
      <div class="pf-marks" aria-hidden="true"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i><b class="l"></b><b class="r"></b></div>
      ${topHtml()}
      <div class="pf">
        <header class="pf-head"><span id="pf-label"></span><span id="pf-meta"></span></header>
        <div class="pf-time" role="timer"><span class="pf-plate red" id="pf-red" aria-hidden="true"></span><span class="pf-plate ink" id="pf-ink"></span>
          <span class="pf-stamp" id="pf-stamp" aria-hidden="true">${esc(t('pf_stamp'))}</span>
          <span class="pf-seal" id="pf-seal" aria-hidden="true"><b></b><small>MIN</small></span></div>
        <div class="pf-task"><b id="pf-task"></b><small id="pf-next"></small></div>
        <div class="pf-foot">
          <div class="pf-city" id="pf-city" aria-hidden="true"></div>
          <div class="pf-ruler" aria-hidden="true">${ticks.map(i => `<i style="left:${(i / mins * 100).toFixed(3)}%" class="${q.includes(i) || i === 0 || i === mins ? 'big' : ''}">${i % lab === 0 ? `<span>${i}</span>` : ''}</i>`).join('')}<b id="pf-fill"></b><em id="pf-mark"></em></div>
          <div class="pf-colophon"><span class="pf-swatch"><i></i><i></i><i></i><i></i><i></i><i></i></span><span id="pf-proof"></span></div>
        </div>
      </div>${dockHtml()}`;
  }
  function cityHtml() { // a row of ink towers with a few red windows: the reward at the end of a print
    let x = 0, s = 1, out = ''; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    while (x < 100) { const w = 1.4 + r() * 3, h = 18 + r() * r() * 82; out += `<i style="left:${x}%;width:${w - .3}%;height:${h}%">${r() < .6 ? `<u style="top:${10 + r() * 60}%"></u>` : ''}</i>`; x += w; }
    return out;
  }
  const clockParts = rem => { const c = MiniView.fmtClock(rem), i = c.lastIndexOf(':'); return `<i>${c.slice(0, i)}</i><i class="c">:</i><i>${c.slice(i + 1)}</i>`; };

  function renderDeep(full) {
    if (!deepOn) return;
    const task = S.tasks.find(x => x.id === S.activeId), style = styleNow();
    const rem = ML.remainingNow(), frac = Math.max(0, rem) / S.total, run = ML.running(), done = Date.now() < doneUntil;
    const deep = $('deep');
    if (full || built !== style || !$('dp-toggle')) {
      $('deep-inner').innerHTML = style === 'terminal' ? terminalHtml() : style === 'proof' ? proofHtml() : classicHtml(task);
      built = style; deep.dataset.style = style;
      $('dp-close').onclick = closeDeep;
      $('dp-toggle').onclick = () => ML.toggleTimer();
      $('dp-distract').onclick = distracted;
      $('dp-finish').onclick = () => $('skip').click();
      $('dp-park').onsubmit = e => { e.preventDefault(); const v = $('dp-park-in').value.trim(); if (!v) return; $('park-input').value = v; $('park-form').requestSubmit(); $('dp-park-in').value = ''; };
      $('deep-inner').onclick = e => { const b = e.target.closest('[data-dpstyle]'); if (!b) return; S.deepStyle = Object.assign({}, S.deepStyle, { [worldKey()]: b.dataset.dpstyle }); save(); renderDeep(true); };
      $('deep-inner').onchange = e => {
        const cb = e.target.closest('[data-dsub]'); if (!cb || !task) return;
        const sub = task.subs.find(s => s.id === cb.dataset.dsub); if (sub) { ML.setSubDone(task, sub, cb.checked); ML.renderAll(); renderDeep(true); }
      };
      if (style === 'terminal') { renderLog(); renderFiles(); }
      if (style === 'proof' && done) $('pf-city').innerHTML = cityHtml();
    }
    $('dp-state').textContent = $('state').textContent;
    deep.classList.toggle('paused', !run && !done);
    deep.classList.toggle('done', done);
    if (!run) deep.classList.remove('idle');
    $('dp-toggle').textContent = $('start').textContent;
    $('dp-dn').textContent = S.curDistr ? '(' + S.curDistr + ')' : '';
    const title = S.mode === 'break' ? $('c-task').textContent : (ML.activeTitle() || t('free_focus'));
    const nextTask = ML.orderedOpen().find(x => !x.done && x.id !== S.activeId);
    if (style === 'classic') {
      $('dp-clock').textContent = MiniView.fmtClock(rem);
      $('dp-task').textContent = title;
      $('dp-arc').style.strokeDashoffset = (RING * (1 - frac)).toFixed(1);
    } else if (style === 'terminal') {
      const c = MiniView.fmtClock(done ? 0 : rem), el = $('nt-clock'); el.textContent = c; el.dataset.t = c;
      $('nt-task').textContent = title.toUpperCase();
      const n = blocksOf(), gone = done ? n : Math.floor((1 - frac) * n);
      [...$('nt-bar').children].forEach((b, i) => { b.className = (i && i % Math.round(n / 4) === 0 ? 'q ' : '') + (i < gone ? 'on' : i === gone && run ? 'now' : ''); });
      $('nt-min').textContent = t('nt_min', { n: Math.round((S.total - Math.max(0, rem)) / 60), m: Math.round(S.total / 60) });
      $('nt-next').textContent = nextTask ? t('nt_next') + ' ' + ML.titleOf(nextTask).toUpperCase() + (S.curDistr ? ' · ' + t('lg_distr', { n: S.curDistr }).toUpperCase() : '') : '';
      // a quarter passed: log it and glitch the digits once
      const qn = S.mode === 'focus' ? Math.floor((1 - frac) * 4 + 1e-6) : 0;
      if (run && qn > lastQ && qn < 4) { lastQ = qn; addLog(t('lg_q', { n: qn }), qn === 2); if (!ML.reducedMotion()) { el.classList.remove('glitch-in'); void el.offsetWidth; el.classList.add('glitch-in'); setTimeout(() => el.classList.remove('glitch-in'), 260); } }
    } else {
      const ink = $('pf-ink'), red = $('pf-red'), parts = clockParts(done ? 0 : rem);
      if (ink.dataset.c !== parts) { ink.innerHTML = parts; red.innerHTML = parts; ink.dataset.c = parts; }
      const prog = done ? 1 : 1 - frac, off = done ? 0 : (1 - prog) * 0.02 + 0.006; // em: the red plate lines up as the session goes on
      red.style.translate = `${off}em ${off * .6}em`;
      const n = todaysSessions().length + (done ? 0 : 1);
      $('pf-label').textContent = done ? t('pf_done') : !run && S.mode === 'focus' && rem < S.total ? t('pf_paused') : S.mode === 'break' ? $('state').textContent.toUpperCase() : t('pf_focus', { n });
      $('pf-meta').textContent = hm(new Date()) + ' · ' + t('pf_streak', { n: ML.streaks().cur });
      $('pf-task').textContent = title.toUpperCase();
      $('pf-next').textContent = nextTask ? t('pf_next', { t: ML.titleOf(nextTask) }) : '';
      $('pf-fill').style.width = (prog * 100).toFixed(2) + '%'; $('pf-mark').style.left = (prog * 100).toFixed(2) + '%';
      $('pf-proof').textContent = t('pf_proof', { n, d: new Date().toLocaleDateString(ML.locale(), { day: '2-digit', month: '2-digit', year: 'numeric' }) });
      const last = todaysSessions().slice(-1)[0]; if (done && last) $('pf-seal').querySelector('b').textContent = last.mins;
    }
  }
  $('deep-btn').onclick = openDeep;
  on('tick', () => renderDeep(false));
  on('timer', () => renderDeep(true));
  on('mood', () => renderDeep(true)); on('world', () => renderDeep(true));
  on('task:done', () => { if (built === 'terminal') renderFiles(); });
  ML.openDeep = openDeep;
  // Shortcut D for Deep focus; Esc closes Deep focus, the shop and the review
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (deepOn) closeDeep(); ['shop', 'review'].forEach(id => { if (!$(id).hidden) $(id).hidden = true; }); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || ML.isTyping(e)) return;
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
      outside_work: 'Mon travail se fait aussi hors de l’app (Word, PDF…)', outside_back: 'Bon retour. Tu étais parti {d} (travail hors de l’app, pas compté).',
    },
    en: {
      set_leave: 'Stay in the app', opt_leave: 'Notice when I leave the app during focus', opt_strict: 'Strict mode: leaving for more than 10 s knocks a floor off the tower',
      leave_hint: "A web app can't block other apps on a phone. Pair it with your phone's focus mode: iPhone → Settings → Focus (plus a Shortcuts automation \"when MerlinsLockIN opens\"), Android → Digital Wellbeing → Focus mode.",
      left_for: 'You left the app for {d}. That counts as a distraction.',
      outside_work: 'My work also happens outside the app (Word, PDF…)', outside_back: 'Welcome back. You were away {d} (work outside the app, not counted).',
    },
  });
  const TOUCH = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  ML.defaults(() => ({ leaveDetect: TOUCH, strict: false, outsideWork: false }));
  // "My work also happens outside the app": leaving no longer counts (stays ticked until unticked)
  function renderOutside() {
    $('outside-row').hidden = !S.leaveDetect;
    $('outside-chk').checked = !!S.outsideWork;
  }
  $('outside-chk').onchange = e => { S.outsideWork = e.target.checked; save(); };
  on('render', renderOutside);
  let hiddenAt = null;
  document.addEventListener('visibilitychange', () => {
    if (!S.leaveDetect) return;
    if (document.visibilityState === 'hidden') { if (ML.running() && S.mode === 'focus') hiddenAt = Date.now(); return; }
    if (!hiddenAt) return;
    const away = (Date.now() - hiddenAt) / 1000; hiddenAt = null;
    if (away < 10) return;
    const d = away >= 60 ? fmtMins(away / 60) : Math.round(away) + ' s';
    if (S.outsideWork) { toast(t('outside_back', { d }), { ms: 3500 }); return; }
    S.curDistr = (S.curDistr || 0) + 1;
    S.distr.push({ at: Date.now(), mood: S.mood, away: Math.round(away), left: true });
    save(); renderDistract();
    toast(t('left_for', { d }), { ms: 5000 });
    emit('left', { secs: away, strict: !!S.strict });
  });
  ML.settingsSection({
    order: 22,
    render: () => `<h3>${esc(t('set_leave'))}</h3>
      ${ML.ui.chk('set-leave', t('opt_leave'), S.leaveDetect)}
      ${ML.ui.chk('set-strict', t('opt_strict'), S.strict)}
      <p class="hint">${esc(t('leave_hint'))}</p>`,
    bind: r => {
      r.querySelector('#set-leave').onchange = e => { S.leaveDetect = e.target.checked; save(); renderOutside(); };
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
