// Energy picker: the one screen where the day's energy (the mood) is chosen — at the first opening of the day,
// from the energy pill on phones, from Settings and at midnight. It opens on yesterday's energy; arrows, a swipe,
// the four buttons or keys 1–4 browse, and the real world switches behind while you do (ML.previewMood in game.js).
// Closing without choosing puts the world back. On a first launch it is step 1 of 3: energy → first task → first session.
(() => {
  'use strict';
  const { S, t, esc, save, on, $, uid, today, svgIcon } = ML;

  ML.addStrings({
    fr: {
      ep_title: 'Énergie du jour', ep_yday: 'Hier', ep_now: 'Actuelle', ep_choose: 'Choisir', ep_close: 'Fermer', ep_prev: 'Énergie précédente', ep_next: 'Énergie suivante',
      ep_mins: '{m} min', ep_buff: '{b} +XP', ep_label: 'Énergie', ep_change: 'Changer',
      ep_sort_drained: 'Petites victoires d’abord', ep_sort_steady: 'Par priorité', ep_sort_fired: 'Tâche la plus dure d’abord', ep_sort_scattered: 'Une tâche à la fois',
      ob_intro: 'Le minuteur, l’ordre des tâches et le décor suivent ton énergie.', ob_task_h: 'Tu travailles sur quoi ?', ob_task_p: 'Une tâche suffit pour commencer.',
      ob_sugg: 'Réviser|Projet perso|Lire 20 pages|Ranger mes mails', ob_next: 'Suivant', ob_skip: 'Passer',
      ob_go_h: 'Première session', ob_go_p: 'À la fin : de l’XP et un étage de plus à ta tour.', ob_later: 'Plus tard', ob_step: 'Étape {n} sur 3',
      ep_world: 'Monde', ep_clock: 'Suivre l’heure ({night} après 21 h)',
    },
    en: {
      ep_title: 'Energy today', ep_yday: 'Yesterday', ep_now: 'Current', ep_choose: 'Choose', ep_close: 'Close', ep_prev: 'Previous energy', ep_next: 'Next energy',
      ep_mins: '{m} min', ep_buff: '{b} +XP', ep_label: 'Energy', ep_change: 'Change',
      ep_sort_drained: 'Quick wins first', ep_sort_steady: 'By priority', ep_sort_fired: 'Hardest task first', ep_sort_scattered: 'One task at a time',
      ob_intro: 'The timer, task order and look follow your energy.', ob_task_h: 'What are you working on?', ob_task_p: 'One task is enough to start.',
      ob_sugg: 'Revise|Side project|Read 20 pages|Clear my inbox', ob_next: 'Next', ob_skip: 'Skip',
      ob_go_h: 'First session', ob_go_p: 'At the end: XP and a new tower floor.', ob_later: 'Later', ob_step: 'Step {n} of 3',
      ep_world: 'World', ep_clock: 'Follow the hour ({night} after 9 pm)',
    },
  });
  ML.defaults(() => ({ onboarded: false }));

  const KEYS = () => Object.keys(ML.MOODS);
  const focusOf = m => ((S.moodTimers || {})[m] || {}).focus || ML.MOODS[m].focus;
  const clockOf = mins => { const s = mins * 60, h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ':' + ML.pad2(m) : ML.pad2(m)) + ':00'; };
  const ARROW = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;

  // The real dial, cloned, so each world's own dial styles apply; shown full, with the given duration and label
  function dialHtml(mins, label) {
    const src = document.querySelector('#sigil-card .ring-wrap'); if (!src) return '';
    const d = src.cloneNode(true);
    d.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    d.querySelectorAll('canvas').forEach(n => n.remove());
    d.querySelectorAll('.segs-lit line').forEach(l => l.setAttribute('visibility', 'visible'));
    d.querySelectorAll('.segs-lit').forEach(g => g.classList.remove('wave'));
    const arc = d.querySelector('.arc'); if (arc) arc.style.strokeDashoffset = '0';
    const tip = d.querySelector('.tip'); if (tip) tip.setAttribute('transform', 'rotate(360 120 120)');
    const q = s => d.querySelector(s);
    if (q('.state')) q('.state').textContent = t('ready');
    if (q('.clock')) { q('.clock').textContent = clockOf(mins); q('.clock').removeAttribute('role'); }
    if (q('.focus-on')) q('.focus-on').textContent = label || '';
    d.setAttribute('aria-hidden', 'true');
    return d.outerHTML;
  }

  /* ---------- The overlay ---------- */
  const el = document.createElement('div');
  el.className = 'ep'; el.id = 'energy'; el.hidden = true;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'ep-h');
  document.body.appendChild(el);

  let st = null; // { pick, cancellable, onboard, step, taskId, title }
  ML.energyOpen = () => !!st;

  const head = (title, sub) => `<header class="ep-top">
      ${st.cancellable ? `<button type="button" class="ghost icon-only ep-x" data-ep="close" aria-label="${esc(t('ep_close'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>` : ''}
      <p class="ep-brand">Merlins<b>LockIN</b></p>
      ${st.onboard ? `<div class="ep-steps" role="img" aria-label="${esc(t('ob_step', { n: st.step }))}">${[1, 2, 3].map(n => `<i class="${n <= st.step ? 'on' : ''}"></i>`).join('')}</div>` : ''}
      <h2 id="ep-h">${esc(title)}</h2>${sub ? `<p class="ep-sub">${esc(sub)}</p>` : ''}</header>`;

  function renderPick() {
    const k = st.pick;
    el.innerHTML = `<div class="ep-in">
      ${head(t('ep_title'), st.onboard ? t('ob_intro') : '')}
      <div class="ep-stage" data-ep="swipe"><div class="ep-dial">${dialHtml(focusOf(k))}</div></div>
      <div class="ep-pick">
        <div class="ep-row">
          <button type="button" class="ghost icon-only ep-arr" data-ep="prev" aria-label="${esc(t('ep_prev'))}">${ARROW(-1)}</button>
          <div class="ep-name" aria-live="polite">
            <span class="ep-yday"${k === S.mood && !st.onboard ? '' : ' hidden'}>${esc(t(st.fresh ? 'ep_yday' : 'ep_now'))}</span>
            <b>${esc(t('mood_' + k))}</b><small>${esc(ML.worldName ? ML.worldName(k) : '')}</small>
          </div>
          <button type="button" class="ghost icon-only ep-arr" data-ep="next" aria-label="${esc(t('ep_next'))}">${ARROW(1)}</button>
        </div>
        <div class="ep-chips"><span>${esc(t('ep_mins', { m: focusOf(k) }))}</span><span>${esc(t('ep_sort_' + k))}</span><span>${esc(t('ep_buff', { b: t('buff_' + k) }))}</span></div>
        <div class="ep-seg" role="radiogroup" aria-label="${esc(t('ep_label'))}">${KEYS().map((m, i) =>
          `<button type="button" role="radio" aria-checked="${m === k}" data-ep-mood="${m}" style="--mood-c:${ML.MOODS[m].color}">${svgIcon(ML.MOODS[m].icon)}<span>${esc(t('mood_' + m))}</span><kbd>${i + 1}</kbd></button>`).join('')}</div>
        ${ML.worldTiles && !ML.worldsFixed() ? `<div class="ep-worlds"><span class="label">${esc(t('ep_world'))}</span>
          <div class="wtiles">${ML.worldTiles(k, st.wp.w, 'data-ep-world')}</div>
          <button type="button" class="ep-clock" role="switch" aria-checked="${st.wp.clock}" data-ep="clock"><i></i>${esc(t('ep_clock', ML.worldClockText(k, st.wp.w)))}</button></div>` : ''}
        <button type="button" class="primary ep-go" data-ep="choose">${esc(t('ep_choose'))}</button>
      </div></div>`;
  }

  function renderTask() {
    el.innerHTML = `<div class="ep-in ep-form">
      ${head(t('ob_task_h'), t('ob_task_p'))}
      <form class="ep-task" data-ep="task-form" autocomplete="off">
        <input type="text" class="ep-input" id="ep-task" maxlength="120" aria-label="${esc(t('ob_task_h'))}" value="${esc(st.title || '')}">
        <div class="ep-sugg">${t('ob_sugg').split('|').map(s => `<button type="button" class="chip-btn" data-ep-sugg="${esc(s)}">${esc(s)}</button>`).join('')}</div>
      </form>
      <div class="ep-foot"><button type="button" class="primary ep-go" data-ep="task-next">${esc(t('ob_next'))}</button>
        <button type="button" class="link" data-ep="task-skip">${esc(t('ob_skip'))}</button></div></div>`;
    setTimeout(() => { const i = $('ep-task'); if (i && !matchMedia('(pointer: coarse)').matches) i.focus(); }, 60);
  }

  function renderGo() {
    el.innerHTML = `<div class="ep-in">
      ${head(t('ob_go_h'), t('ob_go_p'))}
      <div class="ep-stage"><div class="ep-dial">${dialHtml(focusOf(S.mood), st.title || '')}</div></div>
      <div class="ep-foot"><button type="button" class="primary ep-go ep-lock" data-ep="go">LOCK IN</button>
        <button type="button" class="link" data-ep="later">${esc(t('ob_later'))}</button></div></div>`;
  }

  const render = () => (st.step === 2 ? renderTask() : st.step === 3 ? renderGo() : renderPick());

  function open(opts = {}) {
    if (st) return;
    // fresh: today's energy isn't set yet, so the current one is yesterday's
    st = { pick: S.mood in ML.MOODS ? S.mood : 'steady', cancellable: !!opts.cancellable, onboard: !!opts.onboard, fresh: S.moodDay !== today(), step: 1, taskId: null, title: '' };
    st.wp = pickOf(st.pick);
    document.documentElement.classList.add('ep-on');
    el.hidden = false; el.classList.remove('out');
    render();
    addEventListener('keydown', onKey, true);
    setTimeout(() => { const b = el.querySelector('.ep-go'); if (b && !st.onboard) b.focus({ preventScroll: true }); }, 40);
  }
  function close() {
    if (!st) return;
    st = null; ML.previewMood && ML.previewMood(null);
    removeEventListener('keydown', onKey, true);
    el.classList.add('out');
    setTimeout(() => { if (!st) { el.hidden = true; el.innerHTML = ''; document.documentElement.classList.remove('ep-on'); } }, 280);
  }
  ML.energyPicker = { open, close };

  // The saved world of an energy (a light world without Premium falls back to the day one)
  const pickOf = k => { const p = ML.worldPick ? ML.worldPick(k) : { w: 'day', clock: true }; if (p.w === 'light' && ML.worldsFor(k)[2].locked) p.w = 'day'; return p; };
  function pick(k) {
    if (!st || !(k in ML.MOODS) || k === st.pick) return;
    st.pick = k; st.wp = pickOf(k);
    if (ML.previewMood) ML.previewMood(k === S.mood ? null : k);
    renderPick();
  }
  // Browsing the worlds of the energy shown: the real world switches behind, saved only on Choose
  function pickWorld(w) {
    if (w === 'light' && ML.worldsFor(st.pick)[2].locked) { ML.toast(t('wb_locked', { w: ML.worldsFor(st.pick)[2].name }), { key: 'daynight' }); return; }
    if (w) st.wp.w = w; else st.wp.clock = !st.wp.clock;
    ML.previewMood(st.pick === S.mood ? null : st.pick, Object.assign({}, st.wp));
    renderPick();
  }
  const step = d => { const ks = KEYS(); pick(ks[(ks.indexOf(st.pick) + d + ks.length) % ks.length]); };

  function choose() {
    const k = st.pick;
    ML.previewMood && ML.previewMood(null);
    if (ML.setWorld && !ML.worldsFixed()) ML.setWorld(k, st.wp, true);
    if (k !== S.mood) ML.setMood(k); else { S.moodDay = today(); ML.renderAll(); }
    if (S.juice) S.juice.titleDay = today(); // the daily title screen would only repeat this
    save(); ML.emit('gesture');
    if (st.onboard) { st.step = 2; render(); } else close();
  }
  function saveTask() {
    const title = (($('ep-task') || {}).value || '').trim();
    S.tasks = S.tasks.filter(x => !x.sample);
    if (title) {
      const task = { id: uid(), title, mins: focusOf(S.mood), pri: 'med', done: false, created: Date.now() };
      S.tasks.push(task); st.taskId = task.id; st.title = title;
    }
    save(); ML.renderAll();
    st.step = 3; render();
  }
  function finish(go) {
    const id = st.taskId;
    S.onboarded = true; S.tasks = S.tasks.filter(x => !x.sample); save();
    close(); ML.renderAll();
    if (go) setTimeout(() => ML.lockIn({ taskId: id, mins: focusOf(S.mood) }), 300);
  }

  el.addEventListener('click', e => {
    if (!st) return;
    const m = e.target.closest('[data-ep-mood]'); if (m) return pick(m.dataset.epMood);
    const w = e.target.closest('[data-ep-world]'); if (w) return pickWorld(w.dataset.epWorld);
    const s = e.target.closest('[data-ep-sugg]'); if (s) { const i = $('ep-task'); if (i) { i.value = s.dataset.epSugg; i.focus(); } return; }
    const a = e.target.closest('[data-ep]'); if (!a) return;
    ({ close, prev: () => step(-1), next: () => step(1), choose, clock: () => pickWorld(null), 'task-next': saveTask, 'task-skip': () => { $('ep-task').value = ''; saveTask(); },
      go: () => finish(true), later: () => finish(false) })[a.dataset.ep]?.();
  });
  el.addEventListener('submit', e => { e.preventDefault(); if (st && st.step === 2) saveTask(); });
  // Swipe left / right on the dial to browse
  let sx = null;
  el.addEventListener('pointerdown', e => { sx = st && st.step === 1 && e.target.closest('[data-ep="swipe"], .ep-name') ? { x: e.clientX, y: e.clientY } : null; });
  el.addEventListener('pointerup', e => {
    if (!sx) return; const dx = e.clientX - sx.x, dy = e.clientY - sx.y; sx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
  });
  function onKey(e) {
    if (!st) return;
    if (ML.isTyping(e)) { if (e.key === 'Escape' && st.cancellable) { e.preventDefault(); close(); } return; } // the task field types freely
    const k = e.key, n = +k;
    if (k === 'Tab') return;
    if (st.step === 1 && n >= 1 && n <= KEYS().length) pick(KEYS()[n - 1]);
    else if (st.step === 1 && (k === 'ArrowRight' || k === 'ArrowLeft')) step(k === 'ArrowRight' ? 1 : -1);
    else if (k === 'Enter' && !(e.target && e.target.tagName === 'BUTTON')) { if (st.step === 1) choose(); else if (st.step === 3) finish(true); }
    else if (k === 'Escape' && st.cancellable) close();
    else if (k === 'Enter' || k === ' ') return; // a focused button handles it
    e.preventDefault(); e.stopPropagation(); // nothing reaches the app's shortcuts behind
  }

  /* ---------- Energy pill (phone and side panel: replaces the four mood buttons) ---------- */
  const pill = document.createElement('button');
  pill.type = 'button'; pill.className = 'ep-pill'; pill.id = 'ep-pill';
  const bar = document.querySelector('.moodbar'); if (bar) bar.prepend(pill);
  function renderPill() {
    const k = S.mood, M = ML.MOODS[k]; if (!M) return;
    pill.innerHTML = `<span class="ep-ico" style="--mood-c:${M.color}">${svgIcon(M.icon)}</span>
      <span class="ep-tx"><small>${esc(t('ep_label'))}</small><b>${esc(t('mood_' + k))}<em>✦ ${esc(t('buff_' + k))}</em></b><span>${esc(t('ep_mins', { m: focusOf(k) }))} · ${esc(t('ep_sort_' + k))}</span></span>
      <span class="ep-chg">${esc(t('ep_change'))}</span>`;
    pill.setAttribute('aria-label', `${t('ep_label')} : ${t('mood_' + k)}. ${t('ep_change')}`);
  }
  pill.onclick = () => open({ cancellable: true });
  on('render', renderPill); on('mood', renderPill);

  /* ---------- Launch: first-launch flow, or today's energy ---------- */
  const used = () => !!((S.sessions || []).length || (S.tasks || []).some(x => !x.sample) || +S.xp > 0 || (S.events || []).length || (S.parked || []).length);
  on('started', () => setTimeout(async () => {
    // a signed-in device with nothing local yet waits for its first sync: the account may already have data
    if (!S.onboarded && !used() && ML.auth && ML.auth.user) await Promise.race([ML.auth.syncNow(true), new Promise(r => setTimeout(r, 5000))]).catch(() => {});
    if (!S.onboarded && used()) { S.onboarded = true; save(); }
    if (!S.onboarded) open({ onboard: true });
    else if (S.moodDay !== today()) open();
  }, 0));
})();
