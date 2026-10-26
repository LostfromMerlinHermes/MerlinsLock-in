// Day tab: hour-by-hour timeline with time blocks (tasks or free titles), calendar events,
// drag to move/resize, auto-plan, block start prompts, planned-vs-done review and a short journal.
(() => {
  'use strict';
  const { $, S, t, tn, esc, save, on, emit, toast, uid, dayKey, today, parseDay, addDays, hm, fmtMins, clamp } = ML;

  ML.addStrings({
    fr: {
      auto_plan: 'Auto-planifier', tray_hint: 'Glisse une tâche sur la timeline, ou clique dessus pour la placer au prochain créneau libre.',
      tray_empty: 'Toutes tes tâches ouvertes sont planifiées.', add_block: 'Ajouter un bloc', block_title_ph: 'Ou un titre libre (sport, révision…)',
      block_task: 'Tâche', none_free: '— Titre libre —', add: 'Ajouter', planned_n_one: '{n} bloc planifié', planned_n: '{n} blocs planifiés',
      no_slot: 'Plus de créneau libre aujourd’hui.', block_now: 'C’est l’heure : {title}', start_block: 'Lock in', mark_block_done: 'Fait',
      review: 'Bilan', planned: 'Prévu', done_lc: 'Réalisé', journal: 'Journal du jour', journal_ph: 'Trois lignes : ce qui a marché, ce qui a bloqué, la priorité de demain.',
      move_earlier: '−15 min', move_later: '+15 min', longer: 'Plus long', shorter: 'Plus court', block_deleted: 'Bloc retiré',
      set_planner: 'Planning', opt_autostart: 'Lancer automatiquement les blocs à l’heure prévue', day_start: 'Planification auto : à partir de', day_end: 'Planification auto : jusqu’à', day_hint: 'La journée affiche toujours 0:00 → 24:00 ; tu peux planifier à n’importe quelle heure.',
    },
    en: {
      auto_plan: 'Auto-plan', tray_hint: 'Drag a task onto the timeline, or click it to drop it into the next free slot.',
      tray_empty: 'All your open tasks are scheduled.', add_block: 'Add a block', block_title_ph: 'Or a free title (gym, revision…)',
      block_task: 'Task', none_free: '— Free title —', add: 'Add', planned_n_one: '{n} block planned', planned_n: '{n} blocks planned',
      no_slot: 'No free slot left today.', block_now: "It's time: {title}", start_block: 'Lock in', mark_block_done: 'Done',
      review: 'Review', planned: 'Planned', done_lc: 'Done', journal: "Today's journal", journal_ph: 'Three lines: what worked, what got in the way, tomorrow’s priority.',
      move_earlier: '−15 min', move_later: '+15 min', longer: 'Longer', shorter: 'Shorter', block_deleted: 'Block removed',
      set_planner: 'Planner', opt_autostart: 'Auto-start blocks at their planned time', day_start: 'Auto-plan: from', day_end: 'Auto-plan: until', day_hint: 'The Day view always shows 0:00 → 24:00; you can plan at any hour.',
    },
  });

  ML.defaults(() => ({ blocks: [], journal: {}, planner: { startH: 7, endH: 24, hourPx: 52, autoStart: false, date: null }, activeBlock: null, blockNotified: {} }));

  const SNAP = 15;
  let popover = null; // { kind: 'new', start } | { kind: 'block', id }
  const viewDate = () => S.planner.date || today();
  const blockTitle = b => { const x = b.taskId && S.tasks.find(y => y.id === b.taskId); return x ? ML.titleOf(x) : (b.title || '?'); };
  const nowMins = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  // The grid always shows the whole day (0:00–24:00); startH/endH are the working hours auto-plan uses
  const DAY_END = 24 * 60;
  const px = m => (m / 60) * S.planner.hourPx;

  // Busy intervals on a day (events with a time + blocks), sorted
  function busy(k, exceptId) {
    const out = [];
    ML.eventsOn(k).forEach(o => { if (o.start != null) out.push([o.start, o.end]); });
    S.blocks.filter(b => b.date === k && b.id !== exceptId).forEach(b => out.push([b.start, b.start + b.mins]));
    return out.sort((a, b) => a[0] - b[0]);
  }
  function nextFree(k, from, mins) {
    let s = Math.ceil(from / SNAP) * SNAP;
    const end = S.planner.endH * 60;
    for (const [a, b] of busy(k)) { if (s + mins <= a) break; if (b > s) s = Math.ceil(b / SNAP) * SNAP; }
    return s + mins <= end ? s : null;
  }

  /* ---------- Layout: side-by-side columns for overlapping items ---------- */
  function layoutItems(items) {
    items.sort((a, b) => a.start - b.start || b.end - a.end);
    let cluster = [], clusterEnd = -1;
    const flush = () => {
      const cols = [];
      cluster.forEach(it => { let c = cols.findIndex(end => end <= it.start); if (c < 0) { c = cols.length; cols.push(0); } cols[c] = it.end; it.col = c; });
      cluster.forEach(it => { it.ncol = cols.length; });
      cluster = [];
    };
    items.forEach(it => { if (it.start >= clusterEnd) { flush(); clusterEnd = it.end; } else clusterEnd = Math.max(clusterEnd, it.end); cluster.push(it); });
    flush();
    return items;
  }

  /* ---------- Render ---------- */
  function render() {
    const root = $('planner'); if (!root) return;
    const P = S.planner, k = viewDate(), td = today();
    const dayLabel = k === td ? t('today') : k === addDays(td, 1) ? t('tomorrow') : parseDay(k).toLocaleDateString(ML.locale(), { weekday: 'long', day: 'numeric', month: 'long' });
    const scheduled = new Set(S.blocks.filter(b => b.date === k && b.taskId).map(b => b.taskId));
    const tray = ML.orderedOpen().filter(x => !scheduled.has(x.id));
    const evs = ML.eventsOn(k);
    const items = [];
    evs.forEach(o => { if (o.start != null) items.push({ kind: 'ev', start: o.start, end: o.end, ev: o.ev }); });
    S.blocks.filter(b => b.date === k).forEach(b => items.push({ kind: 'blk', start: b.start, end: b.start + b.mins, b }));
    layoutItems(items);
    const H = 24 * P.hourPx;
    let hours = '';
    for (let h = 0; h <= 24; h++) hours += `<div class="pl-hour" style="top:${px(h * 60)}px"><span>${ML.pad2(h % 24)}:00</span></div>`;
    const itemHtml = it => {
      const top = px(it.start), h = Math.max(18, px(it.end) - top), w = 100 / it.ncol, left = it.col * w;
      const style = `top:${top}px;height:${h}px;left:calc(46px + (100% - 50px) * ${left / 100});width:calc((100% - 50px) * ${w / 100} - 3px)`;
      if (it.kind === 'ev') return `<div class="pl-ev" style="${style};--c:${ML.evColor(it.ev)}"><b>${esc(it.ev.title)}</b><span>${hm(it.start)}–${hm(it.end)}</span></div>`;
      const b = it.b, task = b.taskId && S.tasks.find(x => x.id === b.taskId);
      const isActive = S.activeBlock === b.id && ML.running();
      return `<div class="pl-blk ${h < 34 ? 'short' : ''} ${b.done || (task && task.done) ? 'done' : ''} ${isActive ? 'active' : ''} ${task ? 'p-' + task.pri : ''} ${b.color ? 'has-c' : ''}" style="${style}${b.color ? `;--c:var(--ev-${b.color})` : ''}" data-blk="${b.id}" tabindex="0">
        <b>${esc(blockTitle(b))}</b><span>${hm(b.start)}–${hm(b.start + b.mins)} · ${fmtMins(b.mins)}</span><i class="pl-resize" data-resize="${b.id}"></i></div>`;
    };
    const nm = nowMins();
    const nowLine = k === td && nm >= 0 ? `<div class="pl-now" style="top:${px(nm)}px" data-t="${hm(nm)}"></div>` : '';
    const past = k === td ? `<div class="pl-past" style="height:${clamp(px(nm), 0, H)}px"></div>` : k < td ? `<div class="pl-past" style="height:${H}px"></div>` : '';
    const allDay = evs.filter(o => o.start == null);

    // Review
    const dayBlocks = S.blocks.filter(b => b.date === k);
    const plannedM = dayBlocks.reduce((a, b) => a + b.mins, 0);
    const daySessions = S.sessions.filter(s => dayKey(new Date(s.at)) === k);
    const doneM = daySessions.reduce((a, s) => a + s.mins, 0);
    const pct = plannedM ? Math.round((doneM / plannedM) * 100) : null;

    // Re-renders (every minute, after a sync, opening a popover) replace the grid: keep where the user was
    const prevSc = $('pl-scroll'), keepTop = prevSc && render.shownDate === k ? prevSc.scrollTop : null;
    render.shownDate = k;
    root.innerHTML = `
      <div class="cal-head">
        <button type="button" class="ghost icon-only" data-pl="prev" aria-label="‹">‹</button>
        <h3>${esc(dayLabel)}</h3>
        <button type="button" class="ghost icon-only" data-pl="next" aria-label="›">›</button>
        <span class="grow"></span>
        ${k !== td ? `<button type="button" class="ghost small" data-pl="today">${esc(t('today_btn'))}</button>` : ''}
        <button type="button" class="primary small" data-pl="auto">${esc(t('auto_plan'))}</button>
      </div>
      <div class="pl-tray">
        ${tray.length ? `<p class="hint">${esc(t('tray_hint'))}</p><div class="chips">${tray.map(x => `<button type="button" class="tray-chip p-${x.pri}" draggable="true" data-tray="${x.id}">${esc(ML.titleOf(x))} <small>${fmtMins(x.mins)}</small></button>`).join('')}</div>`
        : `<p class="hint">${esc(t('tray_empty'))}</p>`}
      </div>
      ${allDay.length ? `<div class="pl-allday">${allDay.map(o => `<span class="chip" style="border-color:${ML.evColor(o.ev)};color:${ML.evColor(o.ev)}">${esc(o.ev.title)}</span>`).join('')}</div>` : ''}
      ${popover ? popoverHtml() : ''}
      <div class="pl-scroll" id="pl-scroll">
        <div class="pl-grid" id="pl-grid" style="height:${H}px;--hpx:${P.hourPx}px">${past}${hours}${items.map(itemHtml).join('')}${nowLine}</div>
      </div>
      <div class="pl-review g-card">
        <h2>${esc(t('review'))}</h2>
        <div class="g-row">
          <div class="kpi"><strong>${fmtMins(plannedM)}</strong><span>${esc(t('planned'))}</span></div>
          <div class="kpi"><strong>${fmtMins(doneM)}</strong><span>${esc(t('done_lc'))}</span></div>
          <div class="kpi"><strong>${pct == null ? '—' : pct + '%'}</strong><span>%</span></div>
        </div>
        ${plannedM ? `<div class="r-bar big"><b style="width:${clamp(pct || 0, 0, 100)}%"></b></div>` : ''}
        <label class="label" for="pl-journal">${esc(t('journal'))}</label>
        <textarea id="pl-journal" rows="3" placeholder="${esc(t('journal_ph'))}">${esc(S.journal[k] || '')}</textarea>
      </div>`;
    const sc = $('pl-scroll');
    if (sc) {
      if (keepTop != null && render.scrolled) sc.scrollTop = keepTop;
      else { sc.scrollTop = Math.max(0, px(k === td ? nm : 8 * 60) - 120); render.scrolled = true; } // first look: now (today) or the morning
    }
  }
  function popoverHtml() {
    if (popover.kind === 'new') {
      const open = ML.orderedOpen();
      return `<form class="pl-pop ev-form" id="pl-new">
        <span class="label">${esc(t('add_block'))} · ${hm(popover.start)}</span>
        <div class="t-edit-row">
          <label><span>${esc(t('block_task'))}</span><select name="task"><option value="">${esc(t('none_free'))}</option>${open.map(x => `<option value="${x.id}">${esc(ML.titleOf(x))}</option>`).join('')}</select></label>
          <label><span>${esc(t('duration'))}</span><select name="mins">${[15, 25, 30, 45, 60, 90, 120, 180].map(m => `<option value="${m}" ${m === 60 ? 'selected' : ''}>${fmtMins(m)}</option>`).join('')}</select></label>
        </div>
        <input type="text" name="title" maxlength="80" placeholder="${esc(t('block_title_ph'))}">
        <div class="t-edit-btns"><span class="grow"></span><button type="button" class="small ghost" data-pl="close">${esc(t('cancel'))}</button><button type="submit" class="small primary">${esc(t('add'))}</button></div>
      </form>`;
    }
    const b = S.blocks.find(x => x.id === popover.id); if (!b) { popover = null; return ''; }
    return `<div class="pl-pop ev-form">
      <span class="label">${esc(blockTitle(b))} · ${hm(b.start)}–${hm(b.start + b.mins)}</span>
      <div class="chips">
        <button type="button" class="small primary" data-pla="go">${esc(t('start_block'))}</button>
        <button type="button" class="small" data-pla="done">${esc(t('mark_block_done'))}</button>
        <button type="button" class="small ghost" data-pla="earlier">${esc(t('move_earlier'))}</button>
        <button type="button" class="small ghost" data-pla="later">${esc(t('move_later'))}</button>
        <button type="button" class="small ghost" data-pla="shorter">${esc(t('shorter'))}</button>
        <button type="button" class="small ghost" data-pla="longer">${esc(t('longer'))}</button>
        <button type="button" class="small ghost danger" data-pla="del">${esc(t('delete'))}</button>
        <button type="button" class="small ghost" data-pl="close">${esc(t('close'))}</button>
      </div>
      <div class="ev-colors"><span class="label">${esc(t('ev_color'))}</span>
        <button type="button" class="sw auto ${b.color ? '' : 'on'}" data-plc="0" title="${esc(t('ev_color_auto'))}"><i style="--c:var(--accent)"></i><span>${esc(t('ev_color_auto'))}</span></button>
        ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button type="button" class="sw ${b.color === n ? 'on' : ''}" data-plc="${n}" aria-label="${esc(t('ev_color'))} ${n}"><i style="--c:var(--ev-${n})"></i></button>`).join('')}
      </div>
    </div>`;
  }

  /* ---------- Actions ---------- */
  function addBlock(k, start, mins, taskId, title) {
    const b = { id: uid(), date: k, start: clamp(start, 0, DAY_END - SNAP), mins, taskId: taskId || null, title: title || null, done: false };
    S.blocks.push(b); save(); emit('blocks');
    return b;
  }
  // For other modules (exam planner): put a free block on a day, at the best hour if known, else from 9:00
  ML.planBlock = (k, mins, title, opts = {}) => {
    const best = ML.bestHour ? ML.bestHour() : null;
    const from = Math.max(S.planner.startH * 60, best != null ? best * 60 : 9 * 60, k === today() ? nowMins() : 0);
    let s = nextFree(k, from, mins); if (s == null) s = nextFree(k, Math.max(S.planner.startH * 60, k === today() ? nowMins() : 0), mins);
    if (s == null) return null;
    const b = addBlock(k, s, mins, null, title);
    Object.assign(b, opts); save();
    return b;
  };
  function placeTask(taskId, at) {
    const task = S.tasks.find(x => x.id === taskId); if (!task) return;
    const k = viewDate();
    const from = at != null ? at : (k === today() ? Math.max(nowMins(), S.planner.startH * 60) : S.planner.startH * 60);
    const s = at != null ? at : nextFree(k, from, task.mins);
    if (s == null) { toast(t('no_slot')); return; }
    addBlock(k, s, task.mins, taskId);
    render();
  }
  // Hard tasks go first to your best hour (from rated sessions, see focusplus.js), the rest fill the day
  function autoPlan() {
    const k = viewDate();
    const base = k === today() ? Math.max(nowMins(), S.planner.startH * 60) : S.planner.startH * 60;
    const scheduled = new Set(S.blocks.filter(b => b.date === k && b.taskId).map(b => b.taskId));
    const todo = ML.orderedOpen().filter(x => !scheduled.has(x.id));
    const best = ML.bestHour ? ML.bestHour() : null;
    const hard = x => x.pri === 'high' || x.mins >= 60;
    const placed = new Set();
    let n = 0, usedBest = false;
    const place = (task, from) => {
      const s = nextFree(k, from, task.mins); if (s == null) return null;
      addBlock(k, s, task.mins, task.id); placed.add(task.id); n++;
      return s + task.mins + (S.breakMins || 10);
    };
    if (best != null && best * 60 >= base && best < S.planner.endH) {
      let from = best * 60;
      for (const task of todo.filter(hard)) { const nx = place(task, from); if (nx != null) { from = nx; usedBest = true; } }
    }
    let from = base;
    for (const task of todo.filter(x => !placed.has(x.id))) { const nx = place(task, from); if (nx != null) from = nx; }
    render();
    toast(n ? tn('planned_n', n) + (usedBest ? ' ' + t('best_hour_note', { h: best }) : '') : t('no_slot'));
  }
  function startBlock(b) {
    if (ML.lockIn({ taskId: b.taskId, title: b.taskId ? null : b.title, mins: b.mins })) { S.activeBlock = b.id; save(); }
  }

  const root = $('planner');
  root.addEventListener('click', e => {
    const P = S.planner;
    const b = e.target.closest('button');
    if (b && b.dataset.pl) {
      const a = b.dataset.pl;
      if (a === 'prev' || a === 'next') { P.date = addDays(viewDate(), a === 'next' ? 1 : -1); render.scrolled = false; }
      else if (a === 'today') { P.date = null; render.scrolled = false; }
      else if (a === 'auto') { autoPlan(); return; }
      else if (a === 'close') popover = null;
      save(); render(); return;
    }
    if (b && b.dataset.tray) { placeTask(b.dataset.tray); return; }
    if (b && b.dataset.plc != null && popover) {
      const blk = S.blocks.find(x => x.id === popover.id); if (!blk) return;
      blk.color = +b.dataset.plc || null; save(); render(); return;
    }
    if (b && b.dataset.pla) {
      const blk = S.blocks.find(x => x.id === popover.id); if (!blk) return;
      const a = b.dataset.pla;
      if (a === 'go') { popover = null; startBlock(blk); }
      else if (a === 'done') { blk.done = true; const task = blk.taskId && S.tasks.find(x => x.id === blk.taskId); if (task && !task.done) ML.completeTask(task); popover = null; emit('block:done', blk); }
      else if (a === 'earlier') blk.start = Math.max(0, blk.start - SNAP);
      else if (a === 'later') blk.start = Math.min(DAY_END - blk.mins, blk.start + SNAP);
      else if (a === 'shorter') blk.mins = Math.max(SNAP, blk.mins - SNAP);
      else if (a === 'longer') blk.mins = Math.min(DAY_END - blk.start, blk.mins + SNAP);
      else if (a === 'del') { S.blocks = S.blocks.filter(x => x.id !== blk.id); popover = null; toast(t('block_deleted')); }
      save(); ML.renderAll(); return;
    }
  });
  root.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target), taskId = fd.get('task'), title = String(fd.get('title') || '').trim();
    const task = taskId && S.tasks.find(x => x.id === taskId);
    if (!task && !title) return;
    addBlock(viewDate(), popover.start, task && fd.get('mins') === '60' ? task.mins : +fd.get('mins'), taskId || null, task ? null : title);
    popover = null; render();
  });
  root.addEventListener('input', e => {
    if (e.target.id === 'pl-journal') { S.journal[viewDate()] = e.target.value; save(); }
  });

  // Click on empty grid: new block. Pointer drag on a block: move; on its bottom edge: resize.
  let drag = null;
  const yToMins = (grid, clientY) => {
    const r = grid.getBoundingClientRect();
    return Math.round(((clientY - r.top) / S.planner.hourPx * 60) / SNAP) * SNAP;
  };
  root.addEventListener('pointerdown', e => {
    const grid = e.target.closest('#pl-grid'); if (!grid || e.button !== 0) return;
    const el = e.target.closest('.pl-blk');
    if (!el) { drag = { kind: 'new', y0: e.clientY, grid }; return; }
    const b = S.blocks.find(x => x.id === el.dataset.blk); if (!b) return;
    drag = { kind: e.target.dataset.resize ? 'resize' : 'move', b, el, y0: e.clientY, start0: b.start, mins0: b.mins, moved: false, grid };
    el.setPointerCapture(e.pointerId);
  });
  root.addEventListener('pointermove', e => {
    if (!drag || drag.kind === 'new') return;
    const dy = e.clientY - drag.y0;
    if (Math.abs(dy) > 4) drag.moved = true;
    if (!drag.moved) return;
    const dm = Math.round((dy / S.planner.hourPx * 60) / SNAP) * SNAP, P = S.planner;
    if (drag.kind === 'move') drag.b.start = clamp(drag.start0 + dm, 0, DAY_END - drag.b.mins);
    else drag.b.mins = clamp(drag.mins0 + dm, SNAP, DAY_END - drag.b.start);
    drag.el.style.top = px(drag.b.start) + 'px';
    drag.el.style.height = Math.max(18, px(drag.b.start + drag.b.mins) - px(drag.b.start)) + 'px';
    drag.el.querySelector('span').textContent = hm(drag.b.start) + '–' + hm(drag.b.start + drag.b.mins) + ' · ' + fmtMins(drag.b.mins);
  });
  root.addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.kind === 'new') {
      if (Math.abs(e.clientY - d.y0) > 6 || e.target.closest('.pl-ev')) return;
      popover = { kind: 'new', start: clamp(Math.floor(yToMins(d.grid, e.clientY) / 30) * 30, 0, DAY_END - SNAP) };
      render(); const f = root.querySelector('#pl-new select'); if (f && matchMedia('(pointer: fine)').matches) f.focus({ preventScroll: true }); return;
    }
    if (d.moved) { save(); render(); emit('blocks'); }
    else { popover = { kind: 'block', id: d.b.id }; render(); }
  });
  root.addEventListener('keydown', e => {
    const el = e.target.closest('.pl-blk'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); popover = { kind: 'block', id: el.dataset.blk }; render(); }
  });
  // Drag a task chip from the tray onto the timeline
  root.addEventListener('dragstart', e => { const c = e.target.closest('[data-tray]'); if (c) { e.dataTransfer.setData('text/plain', c.dataset.tray); e.dataTransfer.effectAllowed = 'copy'; } });
  root.addEventListener('dragover', e => { if (e.target.closest('#pl-grid')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
  root.addEventListener('drop', e => {
    const grid = e.target.closest('#pl-grid'); if (!grid) return;
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain'); if (!id) return;
    placeTask(id, clamp(yToMins(grid, e.clientY), 0, DAY_END - SNAP));
  });

  /* ---------- Block start prompts + linking sessions to blocks ---------- */
  function checkBlocks() {
    const td = today(), nm = nowMins();
    S.blocks.filter(b => b.date === td && !b.done && b.start <= nm && nm < b.start + Math.min(15, b.mins)).forEach(b => {
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
  // Background re-renders (minute ticks, syncs) keep the new-block form and the journal as the user left them
  const bgRender = () => ML.keepInputs($('planner'), render);
  on('session', s => {
    const b = S.activeBlock && S.blocks.find(x => x.id === S.activeBlock);
    if (b) { b.actual = (b.actual || 0) + s.mins; if (s.full) b.done = true; S.activeBlock = null; emit('block:done', b); }
  });
  on('task:deleted', id => { S.blocks.forEach(b => { if (b.taskId === id) { b.title = b.title || '…'; b.taskId = null; } }); });
  on('minute', checkBlocks);
  on('started', checkBlocks);
  on('newday', () => { S.planner.date = null; const cutoff = addDays(today(), -90); S.blocks = S.blocks.filter(b => b.date >= cutoff); S.blockNotified = {}; });
  on('render', () => { if (S.tab === 'day') bgRender(); });
  on('started', () => { if (!(S.planner.startH >= 4)) { S.planner.startH = 7; save(); } }); // 3.11 allowed 0: auto-plan would start at midnight
  on('tab', name => { if (name === 'day') { render.scrolled = false; render(); } });
  ML.plannerGoto = k => { S.planner.date = k === today() ? null : k; render.scrolled = false; ML.setTab('day'); };

  ML.settingsSection({
    order: 30,
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
