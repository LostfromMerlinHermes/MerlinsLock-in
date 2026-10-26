// End-of-session screen: one place for the most important moment of the loop. It sums up the session
// (time, XP, task), asks the focus rating in one tap, offers "task done?", and gives three clear next moves:
// take the break, 5 more minutes on the same thing, or the next task. Shown after a focus session ends
// (after the level-up overlay, if any). The old rating box under the timer stays as a fallback.
(() => {
  'use strict';
  const { $, S, t, esc, save, on, emit, toast } = ML;

  ML.addStrings({
    fr: {
      end_h: 'Session terminée', end_h_early: 'Session arrêtée', end_xp: '+{xp} XP', end_task_q: 'Tâche terminée ?', end_task_yes: '✓ Oui, terminée',
      end_rate: 'Ta concentration ?', end_next: 'Et maintenant ?', end_break: 'Pause · {m}', end_break_on: 'Continuer la pause', end_more: 'Encore 5 min',
      end_nexttask: 'Tâche suivante', end_nexttask_none: 'Plus de tâche ouverte', end_later: 'Plus tard', end_tower: '+{n} étage', end_tower_n: '+{n} étages',
    },
    en: {
      end_h: 'Session complete', end_h_early: 'Session stopped', end_xp: '+{xp} XP', end_task_q: 'Task done?', end_task_yes: '✓ Yes, done',
      end_rate: 'How focused were you?', end_next: 'What now?', end_break: 'Break · {m}', end_break_on: 'Keep the break going', end_more: '5 more min',
      end_nexttask: 'Next task', end_nexttask_none: 'No open task left', end_later: 'Later', end_tower: '+{n} floor', end_tower_n: '+{n} floors',
    },
  });

  const ov = document.createElement('div');
  ov.className = 'overlay end-ov'; ov.id = 'endscreen'; ov.hidden = true;
  ov.innerHTML = '<div class="sheet end-sheet" role="dialog" aria-modal="true" aria-labelledby="end-h"></div>';
  document.body.appendChild(ov);
  const sheet = ov.firstElementChild;

  let cur = null;

  function render() {
    if (!cur) return;
    const s = S.sessions.find(x => x.at === cur.at) || cur;
    const task = s.taskId && S.tasks.find(x => x.id === s.taskId);
    const breakOn = ML.running() && S.mode === 'break';
    const next = ML.orderedOpen().find(x => x.id !== s.taskId && !x.done);
    const floors = s.mins >= 15 ? Math.max(1, Math.round(s.mins / 30)) : 0;
    sheet.innerHTML = `
      <div class="end-top">
        <span class="end-kicker">${esc(t(s.full ? 'end_h' : 'end_h_early'))}</span>
        <h2 id="end-h">${esc(ML.fmtMins(s.mins))}</h2>
        <p class="end-what">${esc(s.title || '')}</p>
        <div class="end-gains">${cur.xp ? `<span class="end-xp">${esc(t('end_xp', { xp: cur.xp }))}</span>` : ''}${floors ? `<span>${esc(t(floors > 1 ? 'end_tower_n' : 'end_tower', { n: floors }))}</span>` : ''}</div>
      </div>
      ${task && !task.done ? `<div class="end-row end-task"><span>${esc(t('end_task_q'))}</span><button type="button" class="small" data-end="done">${esc(t('end_task_yes'))}</button></div>`
        : task && task.done ? `<div class="end-row end-task done"><span>✓ ${esc(ML.titleOf(task))}</span></div>` : ''}
      <div class="end-block"><span class="label">${esc(t('end_rate'))}</span>
        <div class="end-rate" role="group">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-rate="${i}" aria-pressed="${s.rating === i}"><b>${i}</b><small>${esc(t('rate_' + i))}</small></button>`).join('')}</div></div>
      <div class="end-block"><span class="label">${esc(t('end_next'))}</span>
        <div class="end-choices">
          <button type="button" class="primary" data-end="break">${esc(breakOn ? t('end_break_on') : t('end_break', { m: ML.fmtMins(Math.round(S.total / 60)) }))}</button>
          <button type="button" data-end="more">${esc(t('end_more'))}</button>
          <button type="button" data-end="next" ${next ? '' : 'disabled'}><span>${esc(t(next ? 'end_nexttask' : 'end_nexttask_none'))}</span>${next ? `<small>${esc(ML.titleOf(next))}</small>` : ''}</button>
        </div></div>
      ${ML.endExtras ? ML.endExtras(s) : ''}
      <button type="button" class="link end-later" data-end="later">${esc(t('end_later'))}</button>`;
  }

  function open(session, xp) {
    cur = { at: session.at, taskId: session.taskId, xp, mins: session.mins, title: session.title, full: session.full };
    render();
    // Let the level-up overlay play first
    const show = (tries = 0) => { if (!$('levelup').hidden && tries < 20) return setTimeout(() => show(tries + 1), 300); ov.hidden = false; };
    show();
  }
  function close() { ov.hidden = true; cur = null; }
  ML.endScreen = { open, close };

  // 'session' fires inside complete(), before the switch to break. The sheet waits for the world's ending to play
  // (Codex's bell and pigeons, Washi's ink drop, the bursts) instead of covering it; a hidden tab gets it on return.
  let waitT = 0;
  on('session', session => {
    if (!session || session.mins < 1) return;
    clearTimeout(waitT);
    const scene = (ML.codexOn && ML.codexOn()) || (ML.washiOn && ML.washiOn());
    const wait = ML.reducedMotion() ? 600 : scene ? 4200 : 1800;
    const go = () => {
      if (ML.running() && S.mode === 'focus') return; // already started something else
      if (document.visibilityState === 'hidden') { document.addEventListener('visibilitychange', go, { once: true }); return; }
      open(session, session.xp || 0);
    };
    waitT = setTimeout(go, document.visibilityState === 'hidden' ? 0 : wait);
  });

  ov.addEventListener('click', e => {
    if (e.target === ov) { close(); return; } // tap outside = later
    const b = e.target.closest('button'); if (!b || !cur) return;
    emit('gesture');
    const s = S.sessions.find(x => x.at === cur.at);
    if (b.dataset.rate) {
      if (s) s.rating = +b.dataset.rate;
      if (S.pendingRating === cur.at) S.pendingRating = null;
      save(); emit('rated', s); ML.renderAll(); render(); return;
    }
    const a = b.dataset.end;
    if (a === 'done') { const task = S.tasks.find(x => x.id === cur.taskId); if (task && !task.done) { ML.completeTask(task); save(); ML.renderAll(); } render(); return; }
    if (a === 'later') { close(); return; }
    const taskId = cur.taskId, title = cur.title;
    close();
    if (a === 'break') { if (!(ML.running() && S.mode === 'break')) $('start').click(); return; }
    if (a === 'more') {
      if (ML.running()) $('start').click(); // pause an auto-started break first
      const task = taskId && S.tasks.find(x => x.id === taskId);
      ML.lockIn(task && !task.done ? { taskId, mins: 5 } : { title, mins: 5 });
      return;
    }
    if (a === 'next') {
      const next = ML.orderedOpen().find(x => x.id !== taskId && !x.done); if (!next) return;
      if (ML.running()) $('start').click();
      ML.lockIn({ taskId: next.id, mins: S.moodTimers && S.moodTimers[S.mood] ? S.moodTimers[S.mood].focus : S.focusMins });
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) close(); });
  on('rated', () => { if (!ov.hidden) render(); });
})();
