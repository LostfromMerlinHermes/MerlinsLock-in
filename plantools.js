// Plan tools (3.50, proposals/plan-v2 D3 + D4): "Plan my day" (pick today's tasks, compare their total with the free
// time left in the Day tab, move what doesn't fit to tomorrow, then place them in the Day tab) and the Plan keyboard
// (J/K or arrows to move, Space done, E edit, P pin, 1-3 priority, D date, M project, L lock in, / search).
(() => {
  'use strict';
  const { S, t, esc, $, today, addDays, fmtMins } = ML;
  const save = () => ML.save();
  ML.addStrings({
    fr: {
      dp_title: 'Préparer ma journée', dp_hint: 'Coche ce que tu feras aujourd’hui.', dp_planned: '{m} prévues', dp_free: '{m} libres aujourd’hui',
      dp_over: '{m} de trop.', dp_over_sug: '« {title} » ({m}, {pri}) peut passer à demain.', dp_fits: 'Ça tient dans ta journée.', dp_move: 'Passer à demain', dp_keep: 'Garder quand même',
      dp_ok: 'Valider', dp_place: 'Placer dans Journée', dp_saved: 'Journée prête : {n} tâche(s).', dp_none: 'Aucune tâche ouverte.', dp_moved: 'Passée à demain.',
      key_pl_move: 'Plan : passer d’une tâche à l’autre', key_pl_done: 'Plan : terminer la tâche choisie', key_pl_edit: 'Plan : modifier', key_pl_pin: 'Plan : épingler',
      key_pl_pri: 'Plan : priorité haute, moyenne, basse', key_pl_date: 'Plan : date', key_pl_proj: 'Plan : projet', key_pl_lock: 'Plan : lancer le chrono', key_pl_search: 'Plan : chercher',
    },
    en: {
      dp_title: 'Plan my day', dp_hint: 'Tick what you will do today.', dp_planned: '{m} planned', dp_free: '{m} free today',
      dp_over: '{m} too much.', dp_over_sug: '"{title}" ({m}, {pri}) can move to tomorrow.', dp_fits: 'It fits in your day.', dp_move: 'Move to tomorrow', dp_keep: 'Keep it anyway',
      dp_ok: 'Done', dp_place: 'Place in Day', dp_saved: 'Day ready: {n} task(s).', dp_none: 'No open task.', dp_moved: 'Moved to tomorrow.',
      key_pl_move: 'Plan: move between tasks', key_pl_done: 'Plan: complete the chosen task', key_pl_edit: 'Plan: edit', key_pl_pin: 'Plan: pin',
      key_pl_pri: 'Plan: high, medium, low priority', key_pl_date: 'Plan: date', key_pl_proj: 'Plan: project', key_pl_lock: 'Plan: start the timer', key_pl_search: 'Plan: search',
    },
  });

  /* ---------- Plan my day ---------- */
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'day-prep'; ov.hidden = true;
  ov.innerHTML = `<div class="sheet dp-sheet" role="dialog" aria-modal="true" aria-labelledby="dp-h">
    <div class="sheet-head"><h2 id="dp-h"></h2><button type="button" class="ghost icon-only" data-close="day-prep"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div id="dp-body"></div></div>`;
  document.body.appendChild(ov);
  const PRI = { high: 0, med: 1, low: 2 };
  let picked = new Set(), kept = new Set();
  function candidates() {
    const td = today();
    return S.tasks.filter(x => !x.done).sort((a, b) => {
      const sa = (a.due && a.due <= td) || a.pin ? 0 : 1, sb = (b.due && b.due <= td) || b.pin ? 0 : 1;
      return sa - sb || (a.due || '9999').localeCompare(b.due || '9999') || PRI[a.pri] - PRI[b.pri];
    });
  }
  // what could move to tomorrow when the day is too full: the lowest priority, then the longest, never a pinned one
  function suggestion(over) {
    const list = S.tasks.filter(x => picked.has(x.id) && !x.pin && !kept.has(x.id));
    list.sort((a, b) => PRI[b.pri] - PRI[a.pri] || Math.abs(a.mins - over) - Math.abs(b.mins - over));
    return list[0] || null;
  }
  function render() {
    $('dp-h').textContent = t('dp_title');
    const c = candidates(), planned = c.filter(x => picked.has(x.id)).reduce((a, x) => a + Math.max(0, x.mins - (x.spent || 0)), 0);
    const free = ML.freeMinsToday ? ML.freeMinsToday() : 0, over = planned - free, sug = over > 0 ? suggestion(over) : null;
    const pct = free ? Math.min(100, planned / free * 100) : planned ? 100 : 0;
    $('dp-body').innerHTML = !c.length ? `<p class="hint">${esc(t('dp_none'))}</p>` : `
      <p class="hint">${esc(t('dp_hint'))}</p>
      <div class="dp-sum"><b>${esc(t('dp_planned', { m: fmtMins(planned) }))}</b><span>${esc(t('dp_free', { m: fmtMins(free) }))}</span></div>
      <div class="dp-bar ${over > 0 ? 'over' : ''}"><b style="width:${pct.toFixed(1)}%"></b></div>
      ${over > 0 ? `<div class="dp-warn"><p>${esc(t('dp_over', { m: fmtMins(over) }))}${sug ? ' ' + esc(t('dp_over_sug', { title: ML.titleOf(sug), m: fmtMins(sug.mins), pri: t('pri_' + sug.pri).toLowerCase() })) : ''}</p>
        ${sug ? `<div class="dp-warn-btns"><button type="button" class="small" data-dp="move" data-id="${sug.id}">${esc(t('dp_move'))}</button><button type="button" class="ghost small" data-dp="keep" data-id="${sug.id}">${esc(t('dp_keep'))}</button></div>` : ''}</div>`
        : planned ? `<p class="dp-ok">${esc(t('dp_fits'))}</p>` : ''}
      <ul class="dp-list">${c.map(x => `<li><label><input type="checkbox" data-dpid="${x.id}" ${picked.has(x.id) ? 'checked' : ''}><span class="dp-tt">${x.pin ? `<span class="dp-pin">${ML.PIN_SVG || ''}</span>` : ''}${esc(ML.titleOf(x))}</span>
        <small>${[x.project, x.due ? ML.planDayLabel(x.due) : '', fmtMins(x.mins)].filter(Boolean).map(esc).join(' · ')}</small></label></li>`).join('')}</ul>
      <div class="dp-btns"><button type="button" class="ghost" data-dp="ok">${esc(t('dp_ok'))}</button><button type="button" class="primary" data-dp="place">${esc(t('dp_place'))}</button></div>`;
  }
  ML.openDayPrep = () => {
    const td = today();
    picked = new Set(S.tasks.filter(x => !x.done && ((x.due && x.due <= td) || x.pin)).map(x => x.id)); kept = new Set();
    render(); ML.openOverlay('day-prep');
  };
  function commit() {
    const td = today(), ids = [...picked].filter(id => S.tasks.some(x => x.id === id && !x.done));
    ids.forEach(id => { const x = S.tasks.find(y => y.id === id); if (!x.due || x.due > td) x.due = td; });
    save(); ML.closeOverlay('day-prep'); ML.renderAll();
    ML.toast(t('dp_saved', { n: ids.length }));
    return ids;
  }
  ov.addEventListener('change', e => { const id = e.target.dataset.dpid; if (!id) return; e.target.checked ? picked.add(id) : picked.delete(id); render(); const n = ov.querySelector(`[data-dpid="${id}"]`); if (n) n.focus(); });
  ov.addEventListener('click', e => {
    const b = e.target.closest('[data-dp]'); if (!b) return;
    const k = b.dataset.dp;
    if (k === 'move') { const x = S.tasks.find(y => y.id === b.dataset.id); if (x) { x.due = addDays(today(), 1); picked.delete(x.id); save(); ML.toast(t('dp_moved'), { ms: 1800 }); } render(); }
    if (k === 'keep') { kept.add(b.dataset.id); render(); }
    if (k === 'ok') commit();
    if (k === 'place') { const ids = commit(); if (ids.length && ML.autoPlanToday) ML.autoPlanToday(ids); }
  });

  /* ---------- Keyboard (Plan tab) ---------- */
  ML.planKeys = [['J / K, ↓ / ↑', 'key_pl_move'], ['Espace / Space', 'key_pl_done'], ['E / Entrée', 'key_pl_edit'], ['P', 'key_pl_pin'], ['1 2 3', 'key_pl_pri'], ['D', 'key_pl_date'], ['M', 'key_pl_proj'], ['L', 'key_pl_lock'], ['/', 'key_pl_search']];
  let cur = null; // id of the row the keyboard is on
  const rows = () => [...$('tasks').querySelectorAll('.task[data-id]:not(.editing)')];
  const rowOf = id => $('tasks').querySelector(`.task[data-id="${id}"]`);
  function mark(id, focus) {
    $('tasks').querySelectorAll('.task.kb').forEach(r => r.classList.remove('kb'));
    cur = id; const r = id && rowOf(id); if (!r) { cur = null; return; }
    r.classList.add('kb'); r.tabIndex = -1;
    if (focus) { r.focus({ preventScroll: true }); r.scrollIntoView({ block: 'nearest' }); }
  }
  const onRow = () => cur && document.activeElement && document.activeElement.closest && document.activeElement.closest('.task.kb');
  ML.on('plan:rendered', () => { if (!cur) return; const had = document.activeElement === document.body; mark(cur, had); });
  document.addEventListener('pointerdown', e => { if (cur && !e.target.closest('.task.kb')) mark(null); }, true);
  document.addEventListener('keydown', e => {
    if (S.tab !== 'plan' || e.ctrlKey || e.metaKey || e.altKey || ML.isTyping(e)) return;
    if (document.querySelector('.overlay:not([hidden])') || !ML.planRender) return;
    const k = e.key, lk = k.toLowerCase(), all = rows();
    if (k === '/') { e.preventDefault(); e.stopImmediatePropagation(); ML.planFocusSearch(); return; }
    if (lk === 'j' || lk === 'k' || k === 'ArrowDown' || k === 'ArrowUp') {
      if (!all.length) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const i = all.findIndex(r => r.dataset.id === cur), d = lk === 'j' || k === 'ArrowDown' ? 1 : -1;
      const n = i < 0 ? (d > 0 ? 0 : all.length - 1) : Math.max(0, Math.min(all.length - 1, i + d));
      mark(all[n].dataset.id, true); return;
    }
    if (!onRow()) return;
    const x = S.tasks.find(y => y.id === cur), r = rowOf(cur); if (!x || !r) return;
    const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
    if (k === ' ') { stop(); if (x.done) x.done = false; else ML.completeTask(x); save(); ML.renderAll(); }
    else if (lk === 'e' || k === 'Enter') { stop(); if (S.plan.view === 'table' && ML.planRename) ML.planRename(cur); else ML.editTask(cur); }
    else if (lk === 'p') { stop(); ML.planPin(cur); }
    else if ('123'.includes(k)) { stop(); x.pri = ['high', 'med', 'low'][+k - 1]; x.sample = false; save(); ML.renderAll(); }
    else if (lk === 'd' || lk === 'm') { stop(); ML.planEditCell(lk === 'd' ? 'due' : 'project', r, [cur]); }
    else if (lk === 'l') { stop(); if (!x.done) ML.lockIn({ taskId: x.id, mins: x.mins }); }
    else if (k === 'Escape') { stop(); mark(null); }
  }, true);
})();
