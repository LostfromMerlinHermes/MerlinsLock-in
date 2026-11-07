// Day tab (Journée): the day's hour grid from daygrid.js (blocks, events, drag, one form, View menu, tasks to place),
// auto-plan, block start prompts, and the planned-vs-done review with a short journal.
(() => {
  'use strict';
  const { $, S, t, tn, esc, save, on, emit, toast, dayKey, today, parseDay, addDays, fmtMins, clamp } = ML;

  ML.addStrings({
    fr: {
      auto_plan: 'Auto-planifier', planned_n_one: '{n} bloc planifié', planned_n: '{n} blocs planifiés',
      no_slot: 'Plus de créneau libre aujourd’hui.', block_now: 'C’est l’heure : {title}', start_block: 'Lock in', mark_block_done: 'Fait',
      review: 'Bilan', planned: 'Prévu', done_lc: 'Réalisé', journal: 'Journal du jour', journal_ph: 'Trois lignes : ce qui a marché, ce qui a bloqué, la priorité de demain.',
      block_deleted: 'Bloc retiré', review_day: 'Bilan et journal',
      set_planner: 'Planning', opt_autostart: 'Lancer automatiquement les blocs à l’heure prévue', day_start: 'Planification auto : à partir de', day_end: 'Planification auto : jusqu’à', day_hint: 'Tu peux toujours planifier à n’importe quelle heure ; l’affichage se règle avec le bouton Affichage de la Journée.',
    },
    en: {
      auto_plan: 'Auto-plan', planned_n_one: '{n} block planned', planned_n: '{n} blocks planned',
      no_slot: 'No free slot left today.', block_now: "It's time: {title}", start_block: 'Lock in', mark_block_done: 'Done',
      review: 'Review', planned: 'Planned', done_lc: 'Done', journal: "Today's journal", journal_ph: 'Three lines: what worked, what got in the way, tomorrow’s priority.',
      block_deleted: 'Block removed', review_day: 'Review and journal',
      set_planner: 'Planner', opt_autostart: 'Auto-start blocks at their planned time', day_start: 'Auto-plan: from', day_end: 'Auto-plan: until', day_hint: 'You can always plan at any hour; the Journée’s View button sets what is shown.',
    },
  });

  ML.defaults(() => ({ blocks: [], journal: {}, planner: { startH: 7, endH: 24, hourPx: 52, autoStart: false, date: null }, activeBlock: null, blockNotified: {} }));

  const viewDate = () => S.planner.date || today();
  const nowMins = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const blockTitle = b => ML.dg.blockName(b);

  /* ---------- Host for the shared grid ---------- */
  ML.dgHost('day', {
    view: 'day',
    el: () => $('planner'),
    visible: () => S.tab === 'day',
    days: () => [viewDate()],
    focus: viewDate,
    title: wide => {
      const k = viewDate(), d = parseDay(k), td = today();
      const date = d.toLocaleDateString(ML.locale(), wide ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' });
      const rel = k === td ? t('today') : k === addDays(td, 1) ? t('tomorrow') : null;
      return rel ? (wide ? `${rel}, ${date}` : rel) : date; // on a phone the week strip already shows the date
    },
    showToday: () => viewDate() !== today(),
    nav: dir => { const k = addDays(viewDate(), dir); S.planner.date = k === today() ? null : k; },
    goToday: () => { S.planner.date = null; },
    goDay: k => { S.planner.date = k === today() ? null : k; save(); render(); },
    autoPlan: () => autoPlan(),
    autoLabel: () => t('auto_plan'),
    defaultKind: 'blk',
    after: reviewHtml,
  });
  function reviewHtml() {
    const k = viewDate(), td = today();
    const dayBlocks = S.blocks.filter(b => b.date === k);
    const plannedM = dayBlocks.reduce((a, b) => a + b.mins, 0);
    const doneM = S.sessions.filter(s => dayKey(new Date(s.at)) === k).reduce((a, s) => a + s.mins, 0);
    const pct = plannedM ? Math.round((doneM / plannedM) * 100) : null;
    // Open once the day is over (or late in the evening), or when there is already a journal line
    const open = k < td || (k === td && nowMins() >= 20 * 60) || !!S.journal[k];
    return `<details class="pl-review g-card" ${open ? 'open' : ''}>
      <summary><h2>${esc(t('review_day'))}</h2><span class="hint">${esc(fmtMins(doneM))} / ${esc(fmtMins(plannedM))}</span></summary>
      <div class="g-row">
        <div class="kpi"><strong>${fmtMins(plannedM)}</strong><span>${esc(t('planned'))}</span></div>
        <div class="kpi"><strong>${fmtMins(doneM)}</strong><span>${esc(t('done_lc'))}</span></div>
        <div class="kpi"><strong>${pct == null ? '—' : pct + '%'}</strong><span>%</span></div>
      </div>
      ${plannedM ? `<div class="r-bar big"><b style="width:${clamp(pct || 0, 0, 100)}%"></b></div>` : ''}
      <label class="label" for="pl-journal">${esc(t('journal'))}</label>
      <textarea id="pl-journal" rows="3" placeholder="${esc(t('journal_ph'))}">${esc(S.journal[k] || '')}</textarea>
    </details>`;
  }
  const render = () => ML.dgRender('day');

  /* ---------- Actions ---------- */
  // For other modules (exam planner): put a free block on a day, at the best hour if known, else from 9:00
  ML.planBlock = (k, mins, title, opts = {}) => {
    const best = ML.bestHour ? ML.bestHour() : null;
    const from = Math.max(S.planner.startH * 60, best != null ? best * 60 : 9 * 60, k === today() ? nowMins() : 0);
    let s = ML.dg.nextFree(k, from, mins); if (s == null) s = ML.dg.nextFree(k, Math.max(S.planner.startH * 60, k === today() ? nowMins() : 0), mins);
    if (s == null) return null;
    const b = ML.dg.addBlock(k, s, mins, null, title);
    Object.assign(b, opts); save(); emit('blocks');
    return b;
  };
  // Hard tasks go first to your best hour (from rated sessions, see focusplus.js), the rest fill the day
  function autoPlan(only) {
    const k = viewDate();
    const base = k === today() ? Math.max(nowMins(), S.planner.startH * 60) : S.planner.startH * 60;
    const scheduled = new Set(S.blocks.filter(b => b.date === k && b.taskId).map(b => b.taskId));
    const todo = ML.orderedOpen().filter(x => !scheduled.has(x.id) && (!only || only.includes(x.id)));
    const best = ML.bestHour ? ML.bestHour() : null;
    const hard = x => x.pri === 'high' || x.mins >= 60;
    const placed = new Set();
    let n = 0, usedBest = false;
    const place = (task, from) => {
      const mins = task.mins || 30, s = ML.dg.nextFree(k, from, mins); if (s == null) return null;
      ML.dg.addBlock(k, s, mins, task.id); placed.add(task.id); n++;
      return s + mins + (S.breakMins || 10);
    };
    if (best != null && best * 60 >= base && best < S.planner.endH) {
      let from = best * 60;
      for (const task of todo.filter(hard)) { const nx = place(task, from); if (nx != null) { from = nx; usedBest = true; } }
    }
    let from = base;
    for (const task of todo.filter(x => !placed.has(x.id))) { const nx = place(task, from); if (nx != null) from = nx; }
    save(); emit('blocks'); render();
    toast(n ? tn('planned_n', n) + (usedBest ? ' ' + t('best_hour_note', { h: best }) : '') : t('no_slot'));
  }
  // plan.js "Plan my day": place these tasks today, then show the Day tab
  ML.autoPlanToday = ids => { S.planner.date = null; autoPlan(ids); ML.setTab('day'); };
  // Free minutes left today between now (or the start of the working day) and its end, events and blocks taken out
  ML.freeMinsToday = () => {
    const k = today(), end = S.planner.endH * 60;
    let s = Math.max(nowMins(), S.planner.startH * 60), free = 0;
    for (const [a, b] of ML.dg.busy(k)) { if (a > s) free += Math.max(0, Math.min(a, end) - s); s = Math.max(s, b); if (s >= end) break; }
    return free + Math.max(0, end - s);
  };
  function startBlock(b) {
    if (ML.lockIn({ taskId: b.taskId, title: b.taskId ? null : b.title, mins: b.mins })) { S.activeBlock = b.id; save(); }
  }

  $('planner').addEventListener('input', e => {
    if (e.target.id === 'pl-journal') { S.journal[viewDate()] = e.target.value; save(); }
  });

  /* ---------- Block start prompts + linking sessions to blocks ---------- */
  function checkBlocks() {
    const td = today(), nm = nowMins();
    S.blocks.filter(b => b.date === td && !ML.blockDone(b) && b.start <= nm && nm < b.start + Math.min(15, b.mins)).forEach(b => {
      const key = b.id + '@' + b.start;
      if (S.blockNotified[key] || ML.running()) return;
      S.blockNotified[key] = Date.now(); save();
      if (S.planner.autoStart) { startBlock(b); return; }
      toast(t('block_now', { title: blockTitle(b) }), { action: { label: t('start_block'), fn: () => startBlock(b) } });
      emit('chime');
      ML.notify('MerlinsLockIN', t('block_now', { title: blockTitle(b) }));
    });
    if (S.tab === 'day') bgRender();
  }
  // Background re-renders (minute ticks, syncs) keep the form and the journal as the user left them
  const bgRender = () => ML.keepInputs($('planner'), render);
  on('session', s => {
    const b = S.activeBlock && S.blocks.find(x => x.id === S.activeBlock);
    if (b) { b.actual = (b.actual || 0) + s.mins; if (s.full) { b.done = true; delete b.undone; } S.activeBlock = null; emit('block:done', b); }
  });
  on('task:deleted', id => { S.blocks.forEach(b => { if (b.taskId === id) { b.title = b.title || '…'; b.taskId = null; } }); });
  on('minute', checkBlocks);
  on('started', checkBlocks);
  on('newday', () => { S.planner.date = null; const cutoff = addDays(today(), -90); S.blocks = S.blocks.filter(b => b.date >= cutoff); S.blockNotified = {}; });
  on('render', () => { if (S.tab === 'day') bgRender(); });
  on('started', () => { if (!(S.planner.startH >= 4)) { S.planner.startH = 7; save(); } }); // 3.11 allowed 0: auto-plan would start at midnight
  on('tab', name => { if (name === 'day') render(); });
  ML.plannerGoto = k => { S.planner.date = k === today() ? null : k; ML.setTab('day'); };

  ML.settingsSection({
    order: 27, cat: 'planning',
    render: () => `<h3>${esc(t('set_planner'))}</h3>
      ${ML.ui.chk('set-autostart', t('opt_autostart'), S.planner.autoStart)}
      <label class="field"><span>${esc(t('day_start'))}</span>${ML.ui.sel('set-dstart', [4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => [h, h + ':00']), S.planner.startH)}</label>
      <label class="field"><span>${esc(t('day_end'))}</span>${ML.ui.sel('set-dend', [20, 21, 22, 23, 24].map(h => [h, (h % 24) + ':00']), S.planner.endH)}</label>
      <p class="hint">${esc(t('day_hint'))}</p>`,
    bind: r => {
      r.querySelector('#set-autostart').onchange = e => { S.planner.autoStart = e.target.checked; save(); };
      r.querySelector('#set-dstart').onchange = e => { S.planner.startH = +e.target.value; save(); ML.renderAll(); };
      r.querySelector('#set-dend').onchange = e => { S.planner.endH = +e.target.value; save(); ML.renderAll(); };
    },
  });
})();
