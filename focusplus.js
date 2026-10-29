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
      rv_ach: 'Succès débloqués', rv_none: 'aucun', rv_proj: 'Temps par projet', rv_slipped: 'Ce qui a glissé', rv_slipped_none: 'Rien n’a glissé.', rv_goal_n: 'Objectif {n}', rv_goals_prem: 'Avec Premium : temps par projet, ce qui a glissé et 3 objectifs.', week_goal: 'Objectif de la semaine', best_hour_note: '(tâches difficiles vers {h}h, ton meilleur moment)', rv_week_of: 'Semaine du {d}',
    },
    en: {
      deep_focus: 'Deep focus mode (full screen)', deep_exit: 'Esc to leave', distracted: 'I got distracted', distract_ok: 'Logged ({n} this session). Breathe, then back to your task.',
      distract_stats: 'Distractions', distract_line: '{n} this week · {r} per focus hour', distract_worst: 'Hardest time of day: {time}.', distract_none: 'No distractions logged this week. Tap ⚡ when your mind wanders.',
      weekly_review: 'Weekly review', review_open: 'Do my weekly review', review_prompt: 'Time for your weekly review.',
      rv_minutes: 'Focus', rv_sessions: 'Sessions', rv_avg: 'Focus quality', rv_tasks: 'Tasks done', rv_distr: 'Distractions', rv_best: 'Best day', rv_vs: 'vs the week before',
      rv_wins: 'What went well', rv_improve: 'What I want to improve', rv_goal: 'My main goal for next week', rv_save: 'Seal the review (+50 XP)', rv_saved: 'Review sealed. +50 XP', rv_updated: 'Review updated',
      rv_ach: 'Achievements unlocked', rv_none: 'none', rv_proj: 'Time per project', rv_slipped: 'What slipped', rv_slipped_none: 'Nothing slipped.', rv_goal_n: 'Goal {n}', rv_goals_prem: 'With Premium: time per project, what slipped and 3 goals.', week_goal: 'Goal of the week', best_hour_note: '(hard tasks around {h}:00, your best time)', rv_week_of: 'Week of {d}',
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
       when the ink city appears. Chosen by the user from proposals/pleinecran-fired2.png (D) and estampe-epreuve.png.
     - Codex: "folio" (3.33) — an evening page of an old book: double gold rules and engraved corners, the folio (session
       number), the task and the date in Roman numerals, the time huge in shaded Victorian gold letters, a gold rule cut in
       quarters I–IV, the city at the bottom with one gas lamp lit per quarter and the mist rising with the session; at the
       end a gold medal (the clock tower, one window lit per session today) and the minutes in Roman numerals.
       Chosen by the user from proposals/pleinecran-codex3.png (C + D). */
  ML.addStrings({
    fr: {
      dp_style: 'Style du plein écran', dp_classic: 'Classique', dp_terminal: 'Terminal', dp_proof: 'Épreuve',
      nt_log: '// JOURNAL', nt_today: '// AUJOURD’HUI', nt_next: 'SUIVANTE >', nt_min: '{n} / {m} MIN', nt_none: '(aucune tâche)',
      lg_start: 'début', lg_q: 'quart {n}/4 ok', lg_park: 'pensée parquée', lg_distr: 'décroché ({n})', lg_pause: 'pause', lg_resume: 'reprise', lg_done: 'session terminée', lg_break: 'pause en cours',
      pf_focus: 'FOCUS · N° {n}', pf_paused: 'EN PAUSE', pf_done: 'SESSION IMPRIMÉE', pf_stamp: 'PAUSE', pf_streak: 'SÉRIE {n} J', pf_proof: 'ÉPREUVE N° {n} · {d}', pf_next: 'ensuite : {t}',
      dp_folio: 'Folio', fo_folio: 'FOLIO {n}', fo_paused: 'EN PAUSE', fo_streak: 'SÉRIE · {n} JOURS', fo_tower: 'TOUR · {n} ÉTAGES', fo_mins: '{n} MINUTES', fo_next: 'Ensuite : {t}',
    },
    en: {
      dp_style: 'Full-screen style', dp_classic: 'Classic', dp_terminal: 'Terminal', dp_proof: 'Proof',
      nt_log: '// LOG', nt_today: '// TODAY', nt_next: 'NEXT >', nt_min: '{n} / {m} MIN', nt_none: '(no task)',
      lg_start: 'start', lg_q: 'quarter {n}/4 ok', lg_park: 'thought parked', lg_distr: 'distracted ({n})', lg_pause: 'paused', lg_resume: 'resumed', lg_done: 'session complete', lg_break: 'break running',
      pf_focus: 'FOCUS · NO. {n}', pf_paused: 'PAUSED', pf_done: 'SESSION PRINTED', pf_stamp: 'PAUSE', pf_streak: 'STREAK {n} D', pf_proof: 'PROOF NO. {n} · {d}', pf_next: 'next: {t}',
      dp_folio: 'Folio', fo_folio: 'FOLIO {n}', fo_paused: 'PAUSED', fo_streak: 'STREAK · {n} DAYS', fo_tower: 'TOWER · {n} FLOORS', fo_mins: '{n} MINUTES', fo_next: 'Next: {t}',
    },
  });
  ML.defaults(() => ({ deepStyle: {} }));
  // Cartouche's "quest" (3.37) lives in cartouche.js, registered in ML.deepStyles: { html(top, dock), built(), render(ctx), doneMs(), over() }
  const WORLD_STYLE = { netrunner: 'terminal', tokyo: 'proof', atelier: 'folio', cartouche: 'quest', abyss: 'log', observatory: 'chart', sorcerer: 'spell' }; // Abysses' dive log (3.44) lives in abyss.js, the Observatoire's star chart (3.46) in observatory.js
  const ext = s => (ML.deepStyles || {})[s];
  const worldKey = () => { const r = document.documentElement, th = r.dataset.theme; return r.dataset.light ? { sanctuary: 'aube', observatory: 'atelier', netrunner: 'tokyo', arcade: 'cartouche' }[th] : th; };
  // a world can sell another full screen in the shop (Cyber sorcier's circle, 3.48): ML.deepWorldStyle(world) returns it when equipped
  const spOf = k => (ML.deepWorldStyle && ML.deepWorldStyle(k)) || WORLD_STYLE[k];
  const styleNow = () => { const k = worldKey(), sp = spOf(k); return sp && (S.deepStyle || {})[k] !== 'classic' ? sp : 'classic'; };
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
    const ms = sceneMs();
    doneUntil = Date.now() + ms; // the world's ending plays in full screen before the end sheet (endscreen.js waits)
    if (deepOn) { renderDeep(true); clearTimeout(doneT); doneT = setTimeout(() => { const x = ext(styleNow()); if (x && x.over) x.over(); renderDeep(true); }, ms + 100); }
  });
  let doneT = null;
  const sceneMs = () => { const x = ext(styleNow()); return x && x.doneMs ? x.doneMs() : 4200; };
  ML.deepScene = () => deepOn && styleNow() !== 'classic';
  ML.deepSceneMs = () => ML.deepScene() ? sceneMs() : 0;
  ML.deepStyleNow = () => deepOn ? styleNow() : null;
  // a world's ending can be cut short (Cartouche's Continue): back to the timer, and the end sheet opens now
  ML.deepEndNow = () => { doneUntil = 0; clearTimeout(doneT); renderDeep(true); if (ML.endNow) ML.endNow(); };

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
    const x = ext(styleNow()); if (x && x.over && Date.now() < doneUntil) x.over();
    deepOn = false; $('deep').hidden = true; clearTimeout(idleT);
    document.documentElement.classList.remove('deep-on');
    try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (e) {}
  }
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && deepOn && $('deep').hidden) deepOn = false; });
  const RING = 2 * Math.PI * 140;
  const X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  // top bar shared by every style: state, the style switch (when the world has its own screen), close
  function topHtml() {
    const sp = spOf(worldKey()), cur = styleNow();
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
  // Codex folio
  const roman = n => { n = Math.floor(n); if (n <= 0 || n > 3999) return String(n); let s = ''; [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].forEach(([v, r]) => { while (n >= v) { s += r; n -= v; } }); return s; };
  const FO_CORNER = '<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M1 60V21a20 20 0 0 1 20-20h39"/><path d="M9 60V25a16 16 0 0 1 16-16h35" opacity=".55"/><path d="M20 12l7 7-7 7-7-7z" class="f"/></svg>';
  // the clock tower in a gold medal: one window lit per session today (up to 8)
  function medalSvg(lit) {
    const W = [[-104, 46], [-90, 70], [-112, 86], [56, 40], [72, 62], [58, 86], [108, 58], [-6, -2]];
    return `<svg viewBox="-160 -160 320 320" aria-hidden="true"><defs><clipPath id="fo-mc"><circle r="132"/></clipPath></defs>
      <circle r="152" class="ring"/><circle r="140" class="ring2"/>
      <g clip-path="url(#fo-mc)"><rect x="-140" y="-140" width="280" height="280" class="sky"/><rect x="-140" y="40" width="280" height="100" class="mist"/>
        <g class="bld"><rect x="-130" y="30" width="60" height="110"/><path d="M-62 140V10l16-18 16 18v130z"/><path d="M-22 140V-56h44v196z"/><path d="M-28 -56l28-52 28 52z"/><rect x="-2" y="-128" width="4" height="22"/><rect x="40" y="20" width="50" height="120"/><rect x="96" y="40" width="40" height="100"/></g>
        <circle cy="-26" r="13" class="face"/>
        <g class="win">${W.map(([x, y], i) => `<rect x="${x}" y="${y}" width="6" height="8"${i < lit ? ' class="on"' : ''}/>`).join('')}</g></g></svg>`;
  }
  function folioHtml() {
    const lamps = [12, 37, 63, 88];
    return `<div class="fo-frame" aria-hidden="true"><i class="tl">${FO_CORNER}</i><i class="tr">${FO_CORNER}</i><i class="bl">${FO_CORNER}</i><i class="br">${FO_CORNER}</i></div>
      <div class="fo-city" aria-hidden="true"><svg viewBox="0 0 1000 120" preserveAspectRatio="xMidYMax slice"><g>
        <rect x="20" y="50" width="90" height="70"/><path d="M120 120V40l22-26 22 26v80z"/><rect x="176" y="58" width="70" height="62"/><rect x="258" y="70" width="60" height="50"/>
        <path d="M470 120V20h60v100z"/><path d="M462 20l38-46 38 46z"/><circle cx="500" cy="44" r="11" class="face"/>
        <rect x="560" y="48" width="80" height="72"/><rect x="652" y="62" width="60" height="58"/><path d="M730 120V36l20-24 20 24v84z"/><rect x="790" y="54" width="190" height="66"/></g></svg>
        ${lamps.map((x, i) => `<b class="fo-lamp" style="left:${x}%" data-q="${i + 1}"></b>`).join('')}<div class="fo-mist" id="fo-mist"></div></div>
      ${topHtml()}
      <div class="fo">
        <header class="fo-head"><span id="fo-folio"></span><b id="fo-task"></b><span id="fo-date"></span></header>
        <span class="fo-side l" id="fo-streak"></span><span class="fo-side r" id="fo-tower"></span>
        <div class="fo-time" role="timer">
          <svg class="fo-digits" id="fo-time" viewBox="0 0 700 240" aria-hidden="true"><defs><linearGradient id="fo-gold" x1="0" y1="0" x2="0" y2="1"><stop offset=".05" stop-color="#f1d892"/><stop offset=".55" stop-color="#C9A048"/><stop offset="1" stop-color="#8f6a24"/></linearGradient></defs>
            <text class="sh" x="8" y="8"></text><text class="ol" x="4" y="4"></text><text class="gd"></text><text class="hi" x="-1.5" y="-1.5"></text></svg>
          <span class="fo-sr" id="fo-time-sr"></span>
          <span class="fo-medal" id="fo-medal" aria-hidden="true"></span>
        </div>
        <div class="fo-rule" aria-hidden="true"><b id="fo-fill"></b><em id="fo-mark"></em>${[0, 1, 2, 3, 4].map(i => `<i style="left:${i * 25}%"></i>`).join('')}${['I', 'II', 'III', 'IV'].map((r, i) => `<span style="left:${i * 25 + 12.5}%">${r}</span>`).join('')}</div>
        <p class="fo-next" id="fo-next"></p>
      </div>${dockHtml()}`;
  }

  const clockParts = rem => { const c = MiniView.fmtClock(rem), i = c.lastIndexOf(':'); return `<i>${c.slice(0, i)}</i><i class="c">:</i><i>${c.slice(i + 1)}</i>`; };

  function renderDeep(full) {
    if (!deepOn) return;
    const task = S.tasks.find(x => x.id === S.activeId), style = styleNow();
    const rem = ML.remainingNow(), frac = Math.max(0, rem) / S.total, run = ML.running(), done = Date.now() < doneUntil;
    const deep = $('deep');
    if (full || built !== style || !$('dp-toggle')) {
      $('deep-inner').innerHTML = ext(style) ? ext(style).html(topHtml(), dockHtml()) : style === 'terminal' ? terminalHtml() : style === 'proof' ? proofHtml() : style === 'folio' ? folioHtml() : classicHtml(task);
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
      if (style === 'folio' && done) $('fo-medal').innerHTML = medalSvg(todaysSessions().length);
      if (ext(style) && ext(style).built) ext(style).built();
    }
    $('dp-state').textContent = $('state').textContent;
    deep.classList.toggle('paused', !run && !done);
    deep.classList.toggle('done', done);
    if (!run) deep.classList.remove('idle');
    $('dp-toggle').textContent = $('start').textContent;
    $('dp-dn').textContent = S.curDistr ? '(' + S.curDistr + ')' : '';
    const title = S.mode === 'break' ? $('c-task').textContent : (ML.activeTitle() || t('free_focus'));
    const nextTask = ML.orderedOpen().find(x => !x.done && x.id !== S.activeId);
    if (ext(style)) ext(style).render({ rem, frac, run, done, title, nextTask, deep });
    else if (style === 'classic') {
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
    } else if (style === 'folio') {
      const c = MiniView.fmtClock(done ? 0 : rem), el = $('fo-time');
      if (el.dataset.c !== c) {
        el.dataset.c = c; $('fo-time-sr').textContent = c;
        el.querySelectorAll('text').forEach(s => { s.textContent = c; });
        if (el.dataset.len !== String(c.length)) { // fit the box to the text once per length, so the digits don't jitter
          const b = el.querySelector('.gd').getBBox();
          if (b.width) { el.dataset.len = c.length; el.setAttribute('viewBox', `${(b.x - 6).toFixed(0)} ${(b.y - 4).toFixed(0)} ${(b.width + 22).toFixed(0)} ${(b.height + 14).toFixed(0)}`); }
        }
      }
      const prog = done ? 1 : S.mode === 'focus' ? 1 - frac : 0, n = todaysSessions().length + (done ? 0 : 1), d = new Date();
      $('fo-folio').textContent = !run && !done && S.mode === 'focus' && rem < S.total ? t('fo_paused') : S.mode === 'break' ? $('state').textContent.toUpperCase() : t('fo_folio', { n: roman(n) });
      $('fo-task').textContent = title.toUpperCase();
      $('fo-date').textContent = roman(d.getDate()) + ' · ' + roman(d.getMonth() + 1);
      $('fo-streak').textContent = t('fo_streak', { n: roman(ML.streaks().cur) });
      $('fo-tower').textContent = t('fo_tower', { n: roman((S.tower && S.tower.floors) || 0) });
      $('fo-fill').style.width = (prog * 100).toFixed(2) + '%'; $('fo-mark').style.left = (prog * 100).toFixed(2) + '%';
      $('fo-mist').style.opacity = (0.25 + prog * 0.75).toFixed(3); // the mist rises over the city as the session goes on
      const q = Math.floor(prog * 4 + 1e-6);
      deep.querySelectorAll('.fo-lamp').forEach(l => l.classList.toggle('on', +l.dataset.q <= q));
      $('fo-next').textContent = nextTask && !done ? t('fo_next', { t: ML.titleOf(nextTask) }) : '';
      const last = todaysSessions().slice(-1)[0];
      if (done && last) $('fo-next').textContent = t('fo_mins', { n: roman(last.mins) });
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
  // Premium (3.50): minutes per project from the week's sessions, and the tasks that were due that week but not done
  function reviewMore(wk) {
    const ss = S.sessions.filter(s => inWeek(s.at, wk)), by = {};
    ss.forEach(s => { const x = S.tasks.find(y => y.id === s.taskId), p = (x && x.project) || t('pl_noproj'); by[p] = (by[p] || 0) + (s.mins || 0); });
    const rows = Object.entries(by).sort((a, b) => b[1] - a[1]), max = rows.length ? rows[0][1] : 1;
    const end = addDays(wk, 6), slipped = S.tasks.filter(x => !x.done && x.due && x.due >= wk && x.due <= end && x.due < today());
    return `<div class="rv-more">
      <div><span class="label">${esc(t('rv_proj'))}</span>${rows.length ? rows.map(([p, m]) => `<div class="rv-pbar"><span>${esc(p)}</span><i><b style="width:${(m / max * 100).toFixed(1)}%"></b></i><small>${fmtMins(m)}</small></div>`).join('') : `<p class="hint">—</p>`}</div>
      <div><span class="label">${esc(t('rv_slipped'))}</span>${slipped.length ? `<ul class="rv-slip">${slipped.slice(0, 8).map(x => `<li>${esc(ML.titleOf(x))}</li>`).join('')}</ul>` : `<p class="hint">${esc(t('rv_slipped_none'))}</p>`}</div>
    </div>`;
  }
  function openReview(wk = reviewWeek()) {
    const cur = weekStats(wk), prev = weekStats(addDays(wk, -7)), R = S.reviews[wk] || {}, prem = !!(ML.isPremium && ML.isPremium());
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
      ${prem ? reviewMore(wk) : `<p class="hint">${esc(t('rv_goals_prem'))}</p>`}
      <form class="rv-form" id="rv-form">
        <label><span class="label">${esc(t('rv_wins'))}</span><textarea name="wins" rows="2">${esc(R.wins || '')}</textarea></label>
        <label><span class="label">${esc(t('rv_improve'))}</span><textarea name="improve" rows="2">${esc(R.improve || '')}</textarea></label>
        <label><span class="label">${esc(prem ? t('rv_goal_n', { n: 1 }) : t('rv_goal'))}</span><input type="text" name="goal" maxlength="140" value="${esc(R.goal || '')}"></label>
        ${prem ? [2, 3].map(n => `<label><span class="label">${esc(t('rv_goal_n', { n }))}</span><input type="text" name="goal${n}" maxlength="140" value="${esc((R.goals || [])[n - 2] || '')}"></label>`).join('') : ''}
        <button type="submit" class="primary">${esc(R.at ? t('save') : t('rv_save'))}</button>
      </form>`;
    $('rv-form').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target), first = !S.reviews[wk] || !S.reviews[wk].at;
      const goals = prem ? ['goal2', 'goal3'].map(k => String(fd.get(k) || '').trim()).filter(Boolean) : (R.goals || []);
      S.reviews[wk] = { wins: String(fd.get('wins')).trim(), improve: String(fd.get('improve')).trim(), goal: String(fd.get('goal')).trim(), goals, at: Date.now() };
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
    const goals = R ? [R.goal, ...(R.goals || [])].filter(Boolean) : [];
    el.innerHTML = goals.length ? `<div class="week-goal"><span class="label">${esc(t('week_goal'))}</span>${goals.map(g => `<b>${esc(g)}</b>`).join('')}</div>` : '';
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
