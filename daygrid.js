// Shared hour grid (3.78) for the Journée (planner.js, host 'day') and the Agenda week (calendar.js, host 'week'):
// one look, one way to select, drag, resize and edit blocks and events, one form, the View menu (density, hours,
// grid or lines), the tray of tasks to place, the full-width mode and the keyboard. Hosts only say which days to show.
(() => {
  'use strict';
  const { S, t, tn, esc, save, on, emit, toast, uid, today, parseDay, addDays, hm, toMins, fmtMins, clamp } = ML;

  ML.addStrings({
    fr: {
      dg_add: 'Ajouter', dg_block: 'Bloc', dg_event: 'Événement', dg_title_ph: 'Tâche ou titre', dg_start: 'Début', dg_end: 'Fin', dg_date: 'Date',
      dg_more: 'Plus d’options', dg_autosave: 'Enregistré à chaque changement.', dg_series: 'Événement répété : ces réglages changent toute la série.',
      dg_edit: 'Modifier', dg_dup: 'Dupliquer', dg_tomorrow: 'Déplacer à demain', dg_undone: 'Pas fait', dg_done: 'Fait', dg_del: 'Supprimer', dg_del_series: 'Supprimer la série',
      dg_view: 'Affichage', dg_density: 'Densité', dg_d_compact: 'Compacte', dg_d_normal: 'Normale', dg_d_large: 'Grande',
      dg_hours: 'Heures', dg_h_24: '24 h', dg_h_mine: 'Mes heures', dg_h_auto: 'Auto', dg_layout: 'Disposition', dg_l_grid: 'Grille', dg_l_lines: 'Lignes',
      dg_wide: 'Pleine largeur', dg_wide_off: 'Largeur normale', dg_free: 'Libre {d}', dg_overlaps: 'Chevauche {t}', dg_until: 'jusqu’à {t}',
      dg_fold_none: '{a}–{b}, rien de prévu', dg_fold_n_one: '{a}–{b}, 1 élément', dg_fold_n: '{a}–{b}, {n} éléments',
      dg_pushed_one: '1 bloc décalé', dg_pushed: '{n} blocs décalés', dg_undo: 'Annuler', dg_removed: 'Retiré', dg_once_removed: 'Retiré cette fois',
      dg_to_place: 'À placer', dg_to_place_n_one: '1 tâche, {m}', dg_to_place_n: '{n} tâches, {m}', dg_tray_hint: 'Glisse une tâche sur la grille, ou touche-la pour la mettre au prochain créneau libre.',
      dg_tray_empty: 'Toutes tes tâches ouvertes sont placées.', dg_autoweek: 'Auto-planifier la semaine', dg_week_free: 'libre {d}', dg_feed: 'Événement d’un agenda importé : il se met à jour tout seul, on ne peut pas le déplacer.',
      dg_lock: 'Lock in', dg_pause: 'Pause', dg_close: 'Fermer', dg_saved: 'Ajouté', dg_all_day: 'Toute la journée', dg_due: 'À rendre',
      dg_set_push: 'Faire de la place : poser un bloc sur un créneau pris décale les blocs suivants', dg_set_from: 'Mes heures : de', dg_set_to: 'Mes heures : à',
      key_dg_new: 'Nouvel élément (Journée, Agenda)', key_dg_today: 'Aujourd’hui (Journée, Agenda)', key_dg_move: 'Déplacer de 15 min ; avec Maj, changer la durée', key_dg_day: 'Jour ou semaine précédent, suivant', key_dg_del: 'Retirer l’élément sélectionné',
    },
    en: {
      dg_add: 'Add', dg_block: 'Block', dg_event: 'Event', dg_title_ph: 'Task or title', dg_start: 'Start', dg_end: 'End', dg_date: 'Date',
      dg_more: 'More options', dg_autosave: 'Saved as you change it.', dg_series: 'Repeating event: these settings change the whole series.',
      dg_edit: 'Edit', dg_dup: 'Duplicate', dg_tomorrow: 'Move to tomorrow', dg_undone: 'Not done', dg_done: 'Done', dg_del: 'Delete', dg_del_series: 'Delete the series',
      dg_view: 'View', dg_density: 'Density', dg_d_compact: 'Compact', dg_d_normal: 'Normal', dg_d_large: 'Large',
      dg_hours: 'Hours', dg_h_24: '24 h', dg_h_mine: 'My hours', dg_h_auto: 'Auto', dg_layout: 'Layout', dg_l_grid: 'Grid', dg_l_lines: 'Lines',
      dg_wide: 'Full width', dg_wide_off: 'Normal width', dg_free: 'Free {d}', dg_overlaps: 'Overlaps {t}', dg_until: 'until {t}',
      dg_fold_none: '{a}–{b}, nothing planned', dg_fold_n_one: '{a}–{b}, 1 item', dg_fold_n: '{a}–{b}, {n} items',
      dg_pushed_one: '1 block moved', dg_pushed: '{n} blocks moved', dg_undo: 'Undo', dg_removed: 'Removed', dg_once_removed: 'Removed this time',
      dg_to_place: 'To place', dg_to_place_n_one: '1 task, {m}', dg_to_place_n: '{n} tasks, {m}', dg_tray_hint: 'Drag a task onto the grid, or tap it to put it in the next free slot.',
      dg_tray_empty: 'All your open tasks are placed.', dg_autoweek: 'Auto-plan the week', dg_week_free: 'free {d}', dg_feed: 'Event from an imported calendar: it updates on its own and can’t be moved.',
      dg_lock: 'Lock in', dg_pause: 'Pause', dg_close: 'Close', dg_saved: 'Added', dg_all_day: 'All day', dg_due: 'Due',
      dg_set_push: 'Make room: dropping a block on a busy slot moves the next blocks later', dg_set_from: 'My hours: from', dg_set_to: 'My hours: to',
      key_dg_new: 'New item (Journée, Agenda)', key_dg_today: 'Today (Journée, Agenda)', key_dg_move: 'Move by 15 min; with Shift, change the length', key_dg_day: 'Previous or next day, week', key_dg_del: 'Remove the selected item',
    },
  });

  const SNAP = 15, DAY = 1440, GUT = 46;
  const HPX = { day: { compact: 28, normal: 52, large: 84 }, week: { compact: 22, normal: 34, large: 52 } };
  const I = {
    view: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    wide: '<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>',
    narrow: '<path d="M3 12h7M21 12h-7M7 8l4 4-4 4M17 8l-4 4 4 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', play: '<path d="M8 5l11 7-11 7z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
    rep: '<path d="M4 12a7 7 0 0 1 12-5l2 2M20 12a7 7 0 0 1-12 5l-2-2M18 4v5h-5M6 20v-5h5"/>', bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4"/>',
    up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', l: '<path d="M15 6l-6 6 6 6"/>', r: '<path d="M9 6l6 6-6 6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  };
  const ico = (k, cls = '') => `<svg class="dg-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
  ML.dgIcon = ico;

  /* ---------- State ---------- */
  const C = () => S.cal || (S.cal = {});
  const myHours = () => [C().hFrom != null ? C().hFrom : 7, C().hTo != null ? C().hTo : 23];
  function disp(view) {
    const all = C().disp || (C().disp = {}), v = all[view] || {};
    return { d: HPX[view][v.d] ? v.d : (view === 'week' ? 'compact' : 'normal'), h: ['24', 'mine', 'auto'].includes(v.h) ? v.h : 'mine', l: view === 'day' && v.l === 'lines' ? 'lines' : 'grid' };
  }
  function setDisp(view, key, val) { const all = C().disp || (C().disp = {}); (all[view] || (all[view] = {}))[key] = val; save(); }
  let sel = null;   // { kind: 'blk'|'ev', id, k }
  let ed = null;    // { mode: 'new'|'edit', kind, id, k, s, e, title, allday }
  let menu = null;  // the open small menu element (view, item, +n)
  let edVer = 0;    // bumped when the form must be drawn again (a new item, Done, the kind)
  const setEd = v => { ed = v; edVer++; };
  const hosts = {};
  const scrollMem = {};
  const nowMins = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const loc = () => ML.locale();
  const isPhone = () => document.documentElement.classList.contains('mnav-on');
  const desktop = () => innerWidth >= 900 && !isPhone();

  /* ---------- Data ---------- */
  const getB = id => (S.blocks || []).find(b => b.id === id);
  const getE = id => S.events.find(e => e.id === id);
  const blockTask = b => b.taskId && S.tasks.find(x => x.id === b.taskId);
  const blockName = b => { const x = blockTask(b); return x ? ML.titleOf(x) : (b.title || '…'); };
  const blockDone = b => !b.undone && !!(b.done || (blockTask(b) || {}).done);
  ML.blockDone = blockDone;
  const isRep = ev => !!(ev.repeat && ev.repeat !== 'none');
  function itemsOn(k) {
    const out = [];
    ML.eventsOn(k).forEach(o => { if (o.start != null) out.push({ kind: 'ev', id: o.ev.id, k, s: o.start, e: Math.min(o.end, DAY), ev: o.ev, title: o.ev.title, c: ML.evColor(o.ev), rep: isRep(o.ev), feed: !!o.ev.src, rem: !!o.ev.remind }); });
    (S.blocks || []).forEach(b => { if (b.date === k) out.push({ kind: 'blk', id: b.id, k, s: b.start, e: Math.min(b.start + b.mins, DAY), b, title: blockName(b), c: b.color ? `var(--ev-${b.color})` : 'var(--accent)', done: blockDone(b), active: S.activeBlock === b.id && ML.running() }); });
    return out;
  }
  const allDayOn = k => ML.eventsOn(k).filter(o => o.start == null).map(o => o.ev);
  const dueOn = k => S.tasks.filter(x => x.due === k && !x.done);
  // Busy intervals on a day (timed events + blocks), sorted
  function busy(k, exceptId) {
    const out = [];
    ML.eventsOn(k).forEach(o => { if (o.start != null) out.push([o.start, Math.min(o.end, DAY)]); });
    (S.blocks || []).filter(b => b.date === k && b.id !== exceptId).forEach(b => out.push([b.start, b.start + b.mins]));
    return out.sort((a, b) => a[0] - b[0]);
  }
  function nextFree(k, from, mins, end) {
    let s = Math.ceil(from / SNAP) * SNAP;
    end = end != null ? end : (S.planner.endH || 24) * 60;
    for (const [a, b] of busy(k)) { if (s + mins <= a) break; if (b > s) s = Math.ceil(b / SNAP) * SNAP; }
    return s + mins <= end ? s : null;
  }
  function freeMins(k) {
    const td = today(); if (k < td) return null;
    const [h0, h1] = myHours(), end = h1 * 60;
    let s = Math.max(h0 * 60, k === td ? nowMins() : 0), free = 0;
    for (const [a, b] of busy(k)) { if (a > s) free += Math.max(0, Math.min(a, end) - s); s = Math.max(s, b); if (s >= end) break; }
    return free + Math.max(0, end - s);
  }
  function addBlock(k, start, mins, taskId, title) {
    const b = { id: uid(), date: k, start: clamp(start, 0, DAY - SNAP), mins: clamp(mins, SNAP, DAY), taskId: taskId || null, title: title || null, done: false };
    S.blocks.push(b);
    return b;
  }
  // Make room (E4): blocks of that day starting at or after the moved one slide later; events and done blocks stay put,
  // a block that would land on one jumps after it, and nothing goes past midnight
  function ripple(k, moved) {
    if (C().push === false) return 0;
    const fixed = busyFixed(k, moved);
    const movable = S.blocks.filter(b => b.date === k && b !== moved && !blockDone(b) && b.start >= moved.start).sort((a, b) => a.start - b.start);
    let cur = moved.start + moved.mins, n = 0;
    for (const b of movable) {
      if (b.start >= cur) break; // the chain stops at the first block that has room: older overlaps further on are left alone
      let s = cur;
      for (const [a, z] of fixed) if (s < z && s + b.mins > a) s = z;
      if (s + b.mins > DAY) break;
      b.start = s; n++; cur = s + b.mins;
    }
    return n;
  }
  function busyFixed(k, moved) {
    const out = [];
    ML.eventsOn(k).forEach(o => { if (o.start != null) out.push([o.start, Math.min(o.end, DAY)]); });
    S.blocks.forEach(b => { if (b.date === k && b !== moved && blockDone(b)) out.push([b.start, b.start + b.mins]); });
    return out.sort((a, b) => a[0] - b[0]);
  }
  const snapshot = () => JSON.stringify({ b: S.blocks, e: S.events });
  function restore(snap) {
    const o = JSON.parse(snap);
    S.blocks = o.b; S.events = o.e; sel = null; ed = null;
    save(); changed();
  }
  function changed(msg, snap) {
    save(); emit('blocks'); emit('events');
    if (ML.scheduleReminders) ML.scheduleReminders();
    renderActive();
    if (msg) toast(msg, snap ? { action: { label: t('dg_undo'), fn: () => restore(snap) } } : {});
  }
  // A repeating event moved on one day becomes a one-off copy that day, and the series skips it
  function applyEvent(ev, k, ch) {
    if (!ev || ev.src) return null;
    if (isRep(ev)) {
      (ev.skip || (ev.skip = [])).push(k);
      const copy = Object.assign({}, ev, { id: uid(), repeat: 'none', date: ch.date, start: hm(ch.start), mins: ch.mins, of: ev.id });
      delete copy.uid; delete copy.until; delete copy.skip; delete copy.src;
      S.events.push(copy);
      return copy;
    }
    ev.date = ch.date; ev.start = hm(ch.start); ev.mins = ch.mins;
    return ev;
  }
  function moveItem(kind, id, k, ch) {
    const snap = snapshot();
    if (kind === 'blk') {
      const b = getB(id); if (!b) return;
      b.date = ch.date; b.start = clamp(ch.start, 0, DAY - SNAP); b.mins = clamp(ch.mins, SNAP, DAY - b.start);
      const n = ripple(b.date, b);
      sel = { kind, id, k: b.date };
      changed(n ? tn('dg_pushed', n) : null, snap);
    } else {
      const ev = getE(id); if (!ev) return;
      if (ev.src) { toast(t('dg_feed')); renderActive(); return; }
      const out = applyEvent(ev, k, ch);
      if (out) sel = { kind, id: out.id, k: ch.date };
      changed();
    }
  }
  function removeItem(kind, id, k, series) {
    const snap = snapshot();
    if (kind === 'blk') { S.blocks = S.blocks.filter(b => b.id !== id); changed(t('dg_removed'), snap); }
    else {
      const ev = getE(id); if (!ev) return;
      if (isRep(ev) && !series) { (ev.skip || (ev.skip = [])).push(k); changed(t('dg_once_removed'), snap); }
      else { S.events = S.events.filter(e => e.id !== id); changed(t('ev_deleted'), snap); }
    }
    if (sel && sel.id === id) sel = null;
    if (ed && ed.id === id) ed = null;
    renderActive();
  }
  function toggleDone(id) {
    const b = getB(id); if (!b) return;
    if (blockDone(b)) { b.done = false; b.undone = true; }
    else { b.done = true; delete b.undone; const task = blockTask(b); if (task && !task.done) ML.completeTask(task); emit('block:done', b); }
    save(); ML.renderAll();
  }
  function duplicate(kind, id, k) {
    const snap = snapshot();
    if (kind === 'blk') {
      const b = getB(id); if (!b) return;
      const c = addBlock(b.date, Math.min(b.start + b.mins, DAY - b.mins), b.mins, b.taskId, b.title); c.color = b.color;
      const n = ripple(c.date, c); sel = { kind, id: c.id, k: c.date };
      changed(n ? tn('dg_pushed', n) : null, snap);
    } else {
      const ev = getE(id); if (!ev) return;
      const s = ev.start ? toMins(ev.start) : null;
      const c = Object.assign({}, ev, { id: uid(), repeat: 'none', date: k, start: s == null ? '' : hm(Math.min(s + ev.mins, DAY - ev.mins)) });
      delete c.uid; delete c.until; delete c.skip; delete c.src; delete c.of;
      S.events.push(c); sel = { kind, id: c.id, k };
      changed();
    }
  }
  function toTomorrow(kind, id, k) {
    if (kind === 'blk') { const b = getB(id); if (b) moveItem(kind, id, k, { date: addDays(b.date, 1), start: b.start, mins: b.mins }); }
    else { const ev = getE(id); if (ev && ev.start) moveItem(kind, id, k, { date: addDays(k, 1), start: toMins(ev.start), mins: ev.mins }); }
  }
  function startBlock(b) {
    if (ML.lockIn({ taskId: b.taskId, title: b.taskId ? null : blockName(b), mins: b.mins })) { S.activeBlock = b.id; save(); }
  }
  // Place a task: at a given time, else the next free slot (from now on today, else from the start of the working day)
  function placeTask(k, taskId, at) {
    const task = S.tasks.find(x => x.id === taskId); if (!task) return null;
    const mins = task.mins || 30, td = today();
    const from = at != null ? at : Math.max(S.planner.startH * 60, k === td ? nowMins() : 0);
    const s = at != null ? clamp(at, 0, DAY - SNAP) : nextFree(k, from, mins);
    if (s == null) return null;
    const snap = snapshot();
    const b = addBlock(k, s, mins, taskId);
    const n = at != null ? ripple(k, b) : 0;
    sel = { kind: 'blk', id: b.id, k };
    changed(n ? tn('dg_pushed', n) : null, snap);
    return b;
  }
  ML.dg = { nextFree, busy, addBlock, ripple, placeTask, blockName, freeMins, itemsOn };

  /* ---------- Layout: at most `cap` side by side; events stay visible first, then blocks not done ---------- */
  function layout(list, cap) {
    const order = (a, b) => a.s - b.s || (b.e - b.s) - (a.e - a.s);
    list.sort(order);
    const more = [];
    const rank = i => i.kind === 'ev' ? 0 : i.done ? 2 : 1;
    const peak = set => set.reduce((m, a) => Math.max(m, set.filter(b => b.s <= a.s && a.s < b.e).length), 0);
    let cl = [], end = -1;
    const flush = () => {
      if (!cl.length) return;
      let vis = cl, hid = [];
      if (cl.length > cap && peak(cl) > cap) {
        vis = []; cl.slice().sort((a, b) => rank(a) - rank(b) || a.s - b.s).forEach(i => (peak(vis.concat(i)) <= cap ? vis : hid).push(i));
        vis.sort(order);
      }
      const cols = [];
      vis.forEach(it => { let c = cols.findIndex(e => e <= it.s); if (c < 0) { c = cols.length; cols.push(0); } cols[c] = it.e; it.col = c; });
      const n = cols.length || 1;
      vis.forEach(i => {
        const right = Math.min(n, ...vis.filter(j => j !== i && j.col > i.col && j.s < i.e && i.s < j.e).map(j => j.col));
        i.L = i.col / n; i.W = (right - i.col) / n;
        i.R = right === n && hid.some(j => j.s < i.e && i.s < j.e) ? 30 : 0;
      });
      hid.forEach(i => { i.hidden = true; });
      if (hid.length) more.push({ s: Math.min(...hid.map(i => i.s)), items: hid });
      cl = [];
    };
    list.forEach(it => { if (it.s >= end) { flush(); end = it.e; } else end = Math.max(end, it.e); cl.push(it); });
    flush();
    return more;
  }

  function range(view, days) {
    const dp = disp(view);
    if (dp.h === '24') return [0, 24];
    let [a, b] = myHours();
    if (dp.h === 'auto') {
      const its = days.flatMap(itemsOn);
      if (its.length) { a = Math.floor(Math.min(...its.map(i => i.s)) / 60); b = Math.ceil(Math.max(...its.map(i => i.e)) / 60); }
      if (days.includes(today())) { const h = nowMins() / 60; a = Math.min(a, Math.floor(h)); b = Math.max(b, Math.ceil(h + .01)); }
      if (b - a < 6) { b = Math.min(24, a + 6); a = Math.max(0, b - 6); }
    }
    a = clamp(a, 0, 23); b = clamp(b, a + 1, 24);
    return [a, b];
  }

  /* ---------- Rendering ---------- */
  const isSel = it => sel && sel.kind === it.kind && sel.id === it.id && sel.k === it.k;
  let moreLists = [];
  function itemHtml(it, top, h, colPx) {
    const short = h < 36, lines = Math.max(1, Math.floor((h - 22) / 15));
    const px = colPx * it.W - it.R - 3;
    const time = hm(it.s) + '–' + hm(it.e === DAY ? DAY - 0.001 : it.e).replace('23:60', '24:00');
    const marksOn = it.kind === 'ev' && !short && px > 120 && (it.rep || it.rem);
    const cls = ['dg-it', it.kind, short && 'short', it.done && 'done', it.active && 'active', isSel(it) && 'sel', it.feed && 'feed', marksOn && 'has-mk'].filter(Boolean).join(' ');
    const tspan = short ? (px < 130 ? '' : `<span>${hm(it.s)}</span>`) : `<span>${time}</span>`;
    const marks = it.kind === 'ev' && !short && px > 120 ? (it.rep ? ico('rep', 'dg-mk') : '') + (it.rem ? ico('bell', 'dg-mk') : '') : '';
    return `<div class="${cls}" role="button" tabindex="0" data-kind="${it.kind}" data-id="${it.id}" data-k="${it.k}" title="${esc(it.title)}, ${time}" style="top:${top}px;height:${h}px;left:calc(${(it.L * 100).toFixed(3)}% + 1px);width:calc(${(it.W * 100).toFixed(3)}% - ${it.R + 3}px);--c:${it.c};--lines:${lines}">`
      + (it.kind === 'blk' ? `<button type="button" class="dg-ck" data-ck="${it.id}" aria-pressed="${it.done}" aria-label="${esc(t(it.done ? 'dg_undone' : 'dg_done'))}"></button>` : '')
      + `<b>${esc(it.title)}</b>${tspan}${marks ? `<em class="dg-mks">${marks}</em>` : ''}</div>`;
  }
  function gridHtml(host, days, mainW) {
    const view = host.view, dp = disp(view), hpx = HPX[view][dp.d], [h0, h1] = range(view, days), from = h0 * 60, to = h1 * 60;
    const td = today(), nm = nowMins(), H = (to - from) / 60 * hpx, y = m => (clamp(m, from, to) - from) / 60 * hpx;
    const colPx = Math.max(40, (mainW - GUT) / days.length);
    const cap = view === 'day' ? (colPx >= 560 ? 3 : 2) : (colPx >= 170 ? 2 : 1);
    const tick = hpx >= 40 ? 15 : hpx >= 26 ? 30 : 60;
    let gut = '', lines = '';
    for (let m = from; m <= to; m += tick) {
      if (m % 60 === 0) { lines += `<div class="dg-hr" style="top:${y(m)}px"></div>`; if (m < to || h1 === 24) gut += `<span class="dg-hl" style="top:${y(m)}px">${hm(m === DAY ? 0 : m)}</span>`; }
      else gut += `<i class="dg-tk${m % 30 ? '' : ' half'}" style="top:${y(m)}px"></i>`;
    }
    if (view === 'day' && days[0] <= td) {
      S.sessions.forEach(s => {
        const a = s.start || (s.at - s.mins * 60000); if (ML.dayKey(new Date(a)) !== days[0]) return;
        const d0 = new Date(a), sm = d0.getHours() * 60 + d0.getMinutes(), em = Math.min(DAY, sm + s.mins);
        if (em > from && sm < to) gut += `<i class="dg-sess" style="top:${y(sm)}px;height:${Math.max(2, y(em) - y(sm))}px" title="${esc(s.title || '')}"></i>`;
      });
    }
    if (days.includes(td) && nm >= from && nm <= to && view === 'day') gut += `<span class="dg-nowtag" style="top:${y(nm)}px">${hm(nm)}</span>`;
    moreLists = [];
    const outside = { top: 0, bot: 0 };
    const cols = days.map(k => {
      const list = itemsOn(k);
      list.forEach(i => { if (i.e <= from) outside.top++; else if (i.s >= to) outside.bot++; });
      const vis = list.filter(i => i.e > from && i.s < to);
      const more = layout(vis, cap);
      let html = '';
      if (k < td) html += `<div class="dg-past" style="height:${H}px"></div>`;
      else if (k === td && nm > from) html += `<div class="dg-past" style="height:${y(nm)}px"></div>`;
      if (view === 'day' && k >= td) { // free gaps of 30 min or more, from now on
        let s = Math.max(from, k === td ? nm : from); const gaps = [];
        vis.slice().sort((a, b) => a.s - b.s).forEach(i => { if (i.s - s >= 30) gaps.push([s, i.s]); s = Math.max(s, i.e); });
        if (to - s >= 30) gaps.push([s, to]);
        gaps.forEach(([a, b]) => { if (y(b) - y(a) >= 22) html += `<div class="dg-gap" style="top:${y(a)}px;height:${y(b) - y(a)}px">${esc(t('dg_free', { d: fmtMins(b - a) }))}</div>`; });
      }
      vis.forEach(i => {
        if (i.hidden) return;
        const top = y(i.s), h = Math.max(16, y(i.e) - top - 2);
        html += itemHtml(i, top, h, colPx);
        if (isSel(i)) {
          const mid = `calc(${((i.L + i.W / 2) * 100).toFixed(3)}% - ${i.R / 2}px)`;
          if (!i.feed) html += `<i class="dg-hd" data-hd="top" style="top:${top - 4}px;left:${mid}"></i><i class="dg-hd" data-hd="bot" style="top:${top + h - 3}px;left:${mid}"></i>`;
        }
      });
      more.forEach(m => { moreLists.push(m.items); html += `<button type="button" class="dg-more" data-more="${moreLists.length - 1}" style="top:${y(m.s)}px">+${m.items.length}</button>`; });
      if (k === td && nm >= from && nm <= to) html += `<div class="dg-now" style="top:${y(nm)}px"></div>`;
      return `<div class="dg-col${k === td ? ' today' : ''}" data-k="${k}">${html}</div>`;
    }).join('');
    const fold = (pos, a, b, n) => `<button type="button" class="dg-fold ${pos}" data-fold="${pos}">${esc(n ? tn('dg_fold_n', n, { a: hm(a * 60), b: hm(b * 60 === DAY ? 0 : b * 60).replace(/^00:00$/, '24:00') }) : t('dg_fold_none', { a: hm(a * 60), b: b === 24 ? '24:00' : hm(b * 60) }))}</button>`;
    const bar = toolbarHtml(host, days, from, hpx, colPx);
    return `${h0 > 0 ? fold('top', 0, h0, outside.top) : ''}
      <div class="dg-scroll" data-hpx="${hpx}" data-from="${from}" data-to="${to}" data-key="${host.view}@${days[0]}">
        <div class="dg-body" style="--n:${days.length};height:${H}px">${lines}<div class="dg-gut">${gut}</div>${cols}${bar}</div>
      </div>
      ${h1 < 24 ? fold('bot', h1, 24, outside.bot) : ''}`;
  }
  // The small bar over a selected item (when the form isn't beside the grid)
  function toolbarHtml(host, days, from, hpx, colPx) {
    if (!sel || host.wideNow || ed) return '';
    const ci = days.indexOf(sel.k); if (ci < 0) return '';
    const it = itemsOn(sel.k).find(i => i.kind === sel.kind && i.id === sel.id); if (!it) return '';
    const top = (it.s - from) / 60 * hpx, h = (it.e - it.s) / 60 * hpx;
    const above = top - 48 >= 0, ty = above ? top - 48 : top + h + 8;
    const left = clamp(GUT + ci * colPx, GUT, Math.max(GUT, GUT + days.length * colPx - 260));
    const blk = it.kind === 'blk';
    return `<div class="dg-bar" style="top:${ty}px;left:${left}px" role="toolbar">
      ${blk ? `<button type="button" class="small" data-act="go">${ico('play')}${esc(t('dg_lock'))}</button><button type="button" class="small" data-act="done">${esc(t(it.done ? 'dg_undone' : 'dg_done'))}</button>` : ''}
      <button type="button" class="small" data-act="edit">${ico('edit')}${esc(t('dg_edit'))}</button>
      ${it.feed ? '' : `<button type="button" class="small ghost danger icon-only" data-act="del" aria-label="${esc(t('dg_del'))}" title="${esc(t('dg_del'))}">${ico('trash')}</button>`}
    </div>`;
  }
  // Lines (C3): the day as rows, overlaps written out, free gaps you can tap
  function linesHtml(k) {
    const td = today(), nm = nowMins(), its = itemsOn(k).sort((a, b) => a.s - b.s || a.e - b.e);
    if (!its.length) return `<p class="hint dg-empty">${esc(t('day_empty'))}</p>`;
    let rows = '', s = its[0].s, nowDone = k !== td;
    const gap = (a, b) => b - a >= 20 ? `<div class="dg-lr"><time>${hm(a)}</time><button type="button" class="dg-lfree" data-free="${k}|${a}|${b}"><span>${esc(t('dg_free', { d: fmtMins(b - a) }))}</span>${ico('plus')}</button></div>` : '';
    const nowRow = () => `<div class="dg-lr now"><time>${hm(nm)}</time><i class="dg-lnow"></i></div>`;
    its.forEach((i, ix) => {
      if (!nowDone && nm < i.s) { if (nm > s) rows += gap(s, nm); rows += nowRow(); nowDone = true; s = Math.max(s, nm); }
      rows += gap(s, i.s);
      const clash = its.slice(0, ix).find(j => j.e > i.s);
      rows += `<div class="dg-lr"><time>${hm(i.s)}</time><div class="dg-it ${i.kind} ${i.done ? 'done' : ''} ${isSel(i) ? 'sel' : ''}" role="button" tabindex="0" data-kind="${i.kind}" data-id="${i.id}" data-k="${k}" data-open="1" style="--c:${i.c}">`
        + (i.kind === 'blk' ? `<button type="button" class="dg-ck" data-ck="${i.id}" aria-pressed="${i.done}" aria-label="${esc(t(i.done ? 'dg_undone' : 'dg_done'))}"></button>` : '')
        + `<b>${esc(i.title)}</b><span>${esc(t('dg_until', { t: hm(i.e === DAY ? 0 : i.e) }))}</span>${clash ? `<small class="dg-ov">${esc(t('dg_overlaps', { t: clash.title }))}</small>` : ''}</div></div>`;
      s = Math.max(s, i.e);
    });
    if (!nowDone && nm > s) { rows += gap(s, nm); rows += nowRow(); }
    return `<div class="dg-lines">${rows}</div>`;
  }
  // Week in a narrow column: the seven days as a list
  function weekListHtml(host, days) {
    const td = today();
    return `<div class="dg-wl">${days.map(k => {
      const d = parseDay(k), its = itemsOn(k).sort((a, b) => a.s - b.s), ad = allDayOn(k), du = dueOn(k);
      const rows = ad.map(ev => `<button type="button" class="dg-wr" data-kind="ev" data-id="${ev.id}" data-k="${k}" data-open="1" style="--c:${ML.evColor(ev)}"><time>${esc(t('dg_all_day'))}</time><span>${esc(ev.title)}</span></button>`).join('')
        + its.map(i => `<button type="button" class="dg-wr ${i.kind} ${i.done ? 'done' : ''}" data-kind="${i.kind}" data-id="${i.id}" data-k="${k}" data-open="1" style="--c:${i.c}"><time>${hm(i.s)}</time><span>${esc(i.title)}</span></button>`).join('')
        + du.map(x => `<div class="dg-wr due"><time>${esc(t('dg_due'))}</time><span>${esc(ML.titleOf(x))}</span></div>`).join('');
      return `<div class="dg-wd ${k === td ? 'today' : ''} ${k < td ? 'past' : ''}" data-k="${k}">
        <button type="button" class="dg-wdh" data-dgday="${k}"><small>${esc(d.toLocaleDateString(loc(), { weekday: 'short' }))}</small><b>${d.getDate()}</b></button>
        <div class="dg-wb">${rows || `<span class="hint">${esc(t('day_empty'))}</span>`}</div></div>`;
    }).join('')}</div>`;
  }
  function allDayHtml(host, days) {
    const any = days.some(k => allDayOn(k).length || dueOn(k).length);
    if (!any) return '';
    const cell = k => allDayOn(k).map(ev => `<button type="button" class="dg-ad" data-kind="ev" data-id="${ev.id}" data-k="${k}" data-open="1" style="--c:${ML.evColor(ev)}">${esc(ev.title)}</button>`).join('')
      + dueOn(k).map(x => `<span class="dg-ad due" title="${esc(t('dg_due'))}">${esc(ML.titleOf(x))}</span>`).join('');
    if (host.view === 'day') return `<div class="dg-adrow">${cell(days[0])}</div>`;
    return `<div class="dg-adrow wk" style="--n:${days.length}"><span></span>${days.map(k => `<div>${cell(k)}</div>`).join('')}</div>`;
  }
  function weekHeadHtml(days) {
    const td = today();
    return `<div class="dg-wkh" style="--n:${days.length}"><span></span>${days.map(k => {
      const d = parseDay(k), f = freeMins(k);
      return `<button type="button" class="dg-wkd ${k === td ? 'today' : ''}" data-dgday="${k}"><small>${esc(d.toLocaleDateString(loc(), { weekday: 'short' }))}</small><b>${d.getDate()}</b>${f != null ? `<em>${esc(t('dg_week_free', { d: fmtMins(f) }))}</em>` : ''}</button>`;
    }).join('')}</div>`;
  }
  // E3: the week of the shown day, each with how full it is
  function stripHtml(k) {
    const ws = addDays(k, -((parseDay(k).getDay() + 6) % 7)), td = today(), [h0, h1] = myHours();
    return `<div class="dg-strip">${[...Array(7)].map((_, i) => {
      const d = addDays(ws, i), dd = parseDay(d);
      const load = busy(d).reduce((a, [s, e]) => a + Math.max(0, Math.min(e, h1 * 60) - Math.max(s, h0 * 60)), 0) / ((h1 - h0) * 60);
      return `<button type="button" class="${d === k ? 'on' : ''} ${d === td ? 'today' : ''}" data-dgday="${d}" aria-pressed="${d === k}" aria-label="${esc(dd.toLocaleDateString(loc(), { weekday: 'long', day: 'numeric', month: 'long' }))}"><small>${esc(dd.toLocaleDateString(loc(), { weekday: 'narrow' }))}</small><b>${dd.getDate()}</b><i style="--w:${Math.round(clamp(load, 0, 1) * 100)}%"></i></button>`;
    }).join('')}</div>`;
  }
  const trayOpen = () => C().trayOpen === true || (C().trayOpen == null && !isPhone()); // closed by default on a phone
  function trayTasks(host, days) {
    const set = new Set(days);
    const placed = new Set((S.blocks || []).filter(b => set.has(b.date) && b.taskId).map(b => b.taskId));
    return ML.orderedOpen().filter(x => !placed.has(x.id));
  }
  function trayHtml(host, days, inSide) {
    const list = trayTasks(host, days), mins = list.reduce((a, x) => a + (x.mins || 30), 0);
    const chips = list.map(x => `<button type="button" class="dg-task p-${x.pri || 'med'}" draggable="true" data-tray="${x.id}"><span>${esc(ML.titleOf(x))}</span><small>${fmtMins(x.mins || 30)}</small></button>`).join('');
    const auto = list.length ? `<button type="button" class="small" data-dg="auto">${esc(host.autoLabel())}</button>` : '';
    if (inSide) return `<div class="dg-tray side"><h3>${esc(t('dg_to_place'))}</h3>${list.length ? `<p class="hint">${esc(tn('dg_to_place_n', list.length, { m: fmtMins(mins) }))}</p><div class="dg-tasks">${chips}</div>${auto}<p class="hint">${esc(t('dg_tray_hint'))}</p>` : `<p class="hint">${esc(t('dg_tray_empty'))}</p>`}</div>`;
    if (!list.length) return '';
    const open = trayOpen();
    return `<div class="dg-drawer ${open ? 'open' : ''}">
      <button type="button" class="dg-drawer-bar" data-dg="tray" aria-expanded="${open}"><b>${esc(t('dg_to_place'))}</b><span>${esc(tn('dg_to_place_n', list.length, { m: fmtMins(mins) }))}</span>${ico(open ? 'down' : 'up')}</button>
      ${open ? `<div class="dg-tasks">${chips}</div><div class="dg-drawer-foot">${auto}<span class="hint">${esc(t('dg_tray_hint'))}</span></div>` : ''}
    </div>`;
  }
  function headHtml(host, wide) {
    const dp = disp(host.view);
    const clock = C().wide && desktop() ? `<span class="dg-clockw"><span class="dg-clock">${MiniView.fmtClock(ML.remainingNow())}</span><button type="button" class="small ${ML.running() ? '' : 'primary'}" data-dg="timer">${ico(ML.running() ? 'pause' : 'play')}${esc(t(ML.running() ? 'dg_pause' : 'dg_lock'))}</button></span>` : '';
    return `<div class="dg-top">
      <button type="button" class="ghost icon-only dg-ib" data-dg="prev" aria-label="‹">${ico('l')}</button>
      <h3 class="dg-title">${esc(host.title(wide))}</h3>
      <button type="button" class="ghost icon-only dg-ib" data-dg="next" aria-label="›">${ico('r')}</button>
      ${host.showToday() ? `<button type="button" class="ghost small" data-dg="today">${esc(t('today_btn'))}</button>` : ''}
      <span class="grow"></span>
      ${host.extraHead ? host.extraHead() : ''}
      ${clock}
      <button type="button" class="ghost icon-only dg-ib" data-dg="view" aria-haspopup="true" aria-label="${esc(t('dg_view'))}" title="${esc(t('dg_view'))}" data-v="${dp.d}">${ico('view')}</button>
      ${desktop() ? `<button type="button" class="ghost icon-only dg-ib" data-dg="wide" aria-pressed="${!!C().wide}" aria-label="${esc(t(C().wide ? 'dg_wide_off' : 'dg_wide'))}" title="${esc(t(C().wide ? 'dg_wide_off' : 'dg_wide'))}">${ico(C().wide ? 'narrow' : 'wide')}</button>` : ''}
      <button type="button" class="primary small dg-add" data-dg="new" aria-label="${esc(t('dg_add'))}">${ico('plus')}<span>${esc(t('dg_add'))}</span></button>
    </div>
    ${host.view === 'day' ? stripHtml(host.focus()) : ''}`;
  }
  function mainHtml(host, days, mainW) {
    const view = host.view, dp = disp(view);
    let body;
    if (view === 'week' && mainW < 560) body = weekListHtml(host, days);
    else if (view === 'day' && dp.l === 'lines') body = allDayHtml(host, days) + linesHtml(days[0]);
    else body = (view === 'week' ? weekHeadHtml(days) : '') + allDayHtml(host, days) + gridHtml(host, days, mainW);
    return `<div class="dg-grid-wrap" data-view="${view}">${body}</div>${host.wideNow ? '' : trayHtml(host, days, false)}`;
  }

  /* ---------- The form (one for blocks and events) ---------- */
  function edData() {
    if (!ed) return null;
    if (ed.mode === 'new') return { kind: ed.kind, title: ed.title || '', s: ed.s, e: ed.e, date: ed.k, allday: !!ed.allday, color: ed.color || null, cat: ed.cat || 'class', repeat: ed.repeat || 'none', remind: ed.remind != null ? ed.remind : 15, notes: ed.notes || '' };
    if (ed.kind === 'blk') {
      const b = getB(ed.id); if (!b) return null;
      return { kind: 'blk', b, title: blockName(b), s: b.start, e: b.start + b.mins, date: b.date, color: b.color || null, done: blockDone(b) };
    }
    const ev = getE(ed.id); if (!ev) return null;
    const s = ev.start ? toMins(ev.start) : null;
    return { kind: 'ev', ev, title: ev.title, s: s != null ? s : 9 * 60, e: (s != null ? s : 9 * 60) + (ev.mins || 60), date: ev.date, allday: !ev.start, color: ev.color || null, cat: ev.cat, repeat: ev.repeat || 'none', remind: ev.remind || 0, notes: ev.notes || '', rep: isRep(ev), feed: !!ev.src };
  }
  function editorHtml() {
    const d = edData(); if (!d) { ed = null; return ''; }
    const isNew = ed.mode === 'new', blk = d.kind === 'blk';
    const opt = (vals, cur, pre) => vals.map(v => `<option value="${v}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(t(pre + v))}</option>`).join('');
    const now = blk && !isNew && d.date === today() && nowMins() >= d.s - 10 && nowMins() < d.e && !d.done;
    const durs = [25, 45, 60, 90, 120];
    const autoSlot = blk ? 0 : ({ class: 2, study: 8, work: 1, perso: 3, meal: 7, sport: 4, social: 5, deadline: 6 }[d.cat] || 3);
    const sw = `<fieldset class="ev-colors"><legend>${esc(t('ev_color'))}</legend>
      <label class="sw auto" title="${esc(t('ev_color_auto'))}"><input type="radio" name="color" value="" ${d.color ? '' : 'checked'}><i style="--c:${blk ? 'var(--accent)' : `var(--ev-${autoSlot})`}"></i><span>${esc(t('ev_color_auto'))}</span></label>
      ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<label class="sw"><input type="radio" name="color" value="${n}" ${d.color === n ? 'checked' : ''} aria-label="${esc(t('ev_color'))} ${n}"><i style="--c:var(--ev-${n})"></i></label>`).join('')}
    </fieldset>`;
    const tasks = blk ? `<datalist id="dg-tasklist">${ML.orderedOpen().map(x => `<option value="${esc(ML.titleOf(x))}"></option>`).join('')}</datalist>` : '';
    return `<form class="dg-ed" id="dg-ed" autocomplete="off" data-kind="${d.kind}">
      <div class="dg-ed-top">
        ${isNew ? `<div class="seg-toggle dg-kind" role="group"><button type="button" data-edkind="blk" aria-pressed="${blk}">${esc(t('dg_block'))}</button><button type="button" data-edkind="ev" aria-pressed="${!blk}">${esc(t('dg_event'))}</button></div>`
        : `<span class="label">${esc(t(blk ? 'dg_block' : 'dg_event'))}</span>`}
        <span class="grow"></span>
        <button type="button" class="ghost icon-only dg-ib" data-edclose aria-label="${esc(t('dg_close'))}" title="${esc(t('dg_close'))}">${ico('x')}</button>
      </div>
      <input type="text" name="title" class="dg-ed-title" value="${esc(d.title)}" maxlength="100" required ${blk ? 'list="dg-tasklist"' : ''} placeholder="${esc(t(blk ? 'dg_title_ph' : 'ev_title_ph'))}" ${d.feed ? 'readonly' : ''}>${tasks}
      ${blk ? '' : `<label class="opt dg-allday"><input type="checkbox" name="allday" ${d.allday ? 'checked' : ''}> ${esc(t('ev_allday'))}</label>`}
      <div class="dg-ed-time" ${d.allday ? 'hidden' : ''}>
        <label class="dg-tb"><span class="sr">${esc(t('dg_start'))}</span><button type="button" data-step="s:-15" aria-label="−15 min">−</button><input type="time" name="start" step="300" value="${hm(d.s)}"><button type="button" data-step="s:15" aria-label="+15 min">+</button></label>
        <span class="dg-arrow">→</span>
        <label class="dg-tb"><span class="sr">${esc(t('dg_end'))}</span><button type="button" data-step="e:-15" aria-label="−15 min">−</button><input type="time" name="end" step="300" value="${hm(Math.min(d.e, DAY - 1))}"><button type="button" data-step="e:15" aria-label="+15 min">+</button></label>
      </div>
      <div class="dg-durs" ${d.allday ? 'hidden' : ''}>${durs.map(m => `<button type="button" data-dur="${m}" aria-pressed="${d.e - d.s === m}">${fmtMins(m)}</button>`).join('')}</div>
      <label class="dg-ed-date"><span>${esc(t('dg_date'))}</span><input type="date" name="date" value="${esc(d.date)}" required></label>
      <details class="dg-ed-more" ${C().edMore ? 'open' : ''}><summary>${esc(t('dg_more'))}</summary>
        ${blk ? '' : `<div class="t-edit-row">
          <label><span>${esc(t('ev_cat'))}</span><select name="cat">${opt(Object.keys(ML.CATS), d.cat, 'cat_')}</select></label>
          <label><span>${esc(t('repeat'))}</span><select name="repeat">${opt(['none', 'daily', 'weekdays', 'weekly', 'monthly'], d.repeat, 'rep_')}</select></label>
          <label><span>${esc(t('ev_remind'))}</span><select name="remind">${opt([0, 5, 15, 30, 60, 1440], d.remind, 'rem_')}</select></label>
        </div>`}
        ${sw}
        ${blk ? '' : `<textarea name="notes" rows="2" placeholder="${esc(t('ev_notes_ph'))}">${esc(d.notes)}</textarea>`}
      </details>
      ${d.rep ? `<p class="hint">${esc(t('dg_series'))}</p>` : ''}${d.feed ? `<p class="hint">${esc(t('dg_feed'))}</p>` : ''}
      <div class="dg-ed-acts">
        ${isNew ? `<span class="grow"></span><button type="button" class="small ghost" data-edclose>${esc(t('cancel'))}</button><button type="submit" class="small primary">${esc(t('dg_add'))}</button>`
        : `${blk ? `<button type="button" class="small ${now ? 'primary' : ''}" data-act="go">${ico('play')}${esc(t('dg_lock'))}</button><button type="button" class="small" data-act="done">${esc(t(d.done ? 'dg_undone' : 'dg_done'))}</button>` : ''}
          <span class="grow"></span><button type="button" class="small ghost danger" data-act="${d.rep ? 'delseries' : 'del'}">${esc(t(d.rep ? 'dg_del_series' : 'dg_del'))}</button>`}
      </div>
      ${isNew ? '' : `<p class="hint dg-saved">${esc(t('dg_autosave'))}</p>`}
    </form>`;
  }
  // Where the form lives: beside the grid when there is room, else a sheet at the top of the screen
  let sheet = null;
  function sheetEl() {
    if (!sheet) {
      sheet = document.createElement('div'); sheet.className = 'dg-sheet'; sheet.hidden = true;
      sheet.innerHTML = '<div class="dg-sheet-bg" data-edclose></div><div class="dg-sheet-card"></div>';
      document.body.appendChild(sheet);
    }
    return sheet;
  }
  function renderSheet() {
    const host = activeHost(), inSide = host && host.wideNow;
    const s = sheetEl();
    if (!ed || inSide) { if (!s.hidden) { s.hidden = true; s.dataset.sig = ''; s.querySelector('.dg-sheet-card').innerHTML = ''; } return; }
    const sig = ed.mode + '|' + ed.kind + '|' + (ed.id || 'new') + '|' + edVer;
    if (!s.hidden && s.dataset.sig === sig) return; // a save while typing must not redraw the form
    const html = editorHtml();
    if (!ed) { s.hidden = true; return; }
    s.querySelector('.dg-sheet-card').innerHTML = html;
    if (s.hidden) sheetAt = Date.now();
    s.hidden = false; s.dataset.sig = sig;
  }
  let sheetAt = 0;
  function focusTitle() {
    const f = document.querySelector('#dg-ed [name=title]');
    if (f && !f.value) f.focus({ preventScroll: true });
  }

  /* ---------- Hosts ---------- */
  function activeHost() {
    for (const k in hosts) { const h = hosts[k]; if (h.visible() && h.el()) return h; }
    return null;
  }
  function render(name, opts = {}) {
    const host = hosts[name], el = host && host.el(); if (!el) return;
    const days = host.days();
    const w = el.clientWidth || el.parentElement && el.parentElement.clientWidth || Math.min(innerWidth, 420);
    const sideW = 300, minMain = host.view === 'day' ? 340 : 600;
    host.wideNow = !isPhone() && w - sideW - 14 >= minMain;
    const mainW = host.wideNow ? w - sideW - 14 : w;
    const prev = el.querySelector('.dg-scroll');
    if (prev) scrollMem[name] = { key: prev.dataset.key, top: prev.scrollTop };
    if (opts.mainOnly && el.querySelector('.dg-main')) {
      el.querySelector('.dg-headwrap').innerHTML = headHtml(host, host.wideNow);
      el.querySelector('.dg-main').innerHTML = mainHtml(host, days, mainW);
    } else {
      el.innerHTML = `<div class="dg-host" data-host="${name}">
        <div class="dg-headwrap">${headHtml(host, host.wideNow)}</div>
        <div class="dg-wrap ${host.wideNow ? 'wide' : ''}">
          <div class="dg-main">${mainHtml(host, days, mainW)}</div>
          ${host.wideNow ? `<aside class="dg-side">${ed ? editorHtml() : trayHtml(host, days, true)}</aside>` : ''}
        </div>
        ${host.after ? host.after() : ''}
      </div>`;
    }
    placeScroll(name, el, days);
    renderSheet();
  }
  function placeScroll(name, el, days) {
    const sc = el.querySelector('.dg-scroll'); if (!sc) return;
    const page = document.scrollingElement || document.documentElement;
    const hpx = +sc.dataset.hpx, from = +sc.dataset.from, td = today();
    const anchorOf = () => {
      const starts = days.flatMap(itemsOn).map(i => i.s).filter(s => s >= from).sort((a, b) => a - b);
      return days.includes(td) ? Math.max(from, nowMins() - 60) : starts.length ? starts[0] - 30 : from;
    };
    // Phone: no scroll box inside the scrolling page; the grid takes its height and the page scrolls (once, to now)
    if (isPhone()) {
      sc.style.maxHeight = 'none';
      const mem = scrollMem[name];
      if (mem && mem.key === sc.dataset.key) return;
      if (!sc.clientHeight) return;
      scrollMem[name] = { key: sc.dataset.key, top: 0 };
      const y = sc.getBoundingClientRect().top + page.scrollTop + (anchorOf() - from) / 60 * hpx;
      if (y > page.scrollTop + innerHeight * .7) page.scrollTo({ top: y - innerHeight * .35 });
      return;
    }
    // Computer: the grid fills the window under its header, so the page itself doesn't need to scroll
    const top = sc.getBoundingClientRect().top + page.scrollTop;
    const reserve = 16 + (el.querySelector('.dg-drawer') ? el.querySelector('.dg-drawer').offsetHeight + 8 : 0) + (el.querySelector('.dg-fold.bot') ? 34 : 0);
    sc.style.maxHeight = Math.max(320, innerHeight - Math.min(top, 240) - reserve) + 'px';
    const mem = scrollMem[name];
    if (mem && mem.key === sc.dataset.key) { sc.scrollTop = mem.top; return; }
    if (!sc.clientHeight) return;
    sc.scrollTop = Math.max(0, (anchorOf() - from) / 60 * hpx);
    scrollMem[name] = { key: sc.dataset.key, top: sc.scrollTop };
  }
  function renderActive(opts) { const h = activeHost(); if (h) render(h.name, opts); else renderSheet(); }
  ML.dgHost = (name, cfg) => { hosts[name] = Object.assign({ name }, cfg); };
  ML.dgRender = name => render(name);
  ML.dgOpen = (kind, id, k) => { closeMenu(); sel = { kind, id, k }; setEd({ mode: 'edit', kind, id, k }); renderActive(); };
  ML.dgNew = (o = {}) => openNew(o);
  function openNew(o) {
    closeMenu();
    const host = activeHost(), td = today();
    const k = o.k || (host ? host.focus() : (S.cal.sel || td));
    let s = o.s;
    if (s == null) { const nm = nowMins(); s = k === td ? Math.min(DAY - 60, Math.ceil((nm + 1) / 30) * 30) : 9 * 60; }
    const kind = o.kind || C().kind || (host && host.defaultKind) || 'blk';
    sel = null;
    setEd({ mode: 'new', kind, k, s, e: o.e != null ? Math.max(o.e, s + SNAP) : Math.min(DAY, s + 60), title: '' });
    renderActive();
    setTimeout(focusTitle, 30);
  }
  function closeEditor() { ed = null; renderActive(); }

  /* ---------- Form input ---------- */
  let edTimer = null;
  function readForm(f) {
    const v = n => f.elements[n] ? f.elements[n].value : null;
    const s = v('start') ? toMins(v('start')) : null, e0 = v('end') ? toMins(v('end')) : null;
    return { title: String(v('title') || '').trim(), s, e: e0, date: v('date'), allday: f.elements.allday ? f.elements.allday.checked : false,
      cat: v('cat'), repeat: v('repeat'), remind: v('remind') != null ? +v('remind') : null, notes: v('notes') != null ? String(v('notes')).trim() : null,
      color: f.querySelector('[name=color]:checked') ? +f.querySelector('[name=color]:checked').value || null : null };
  }
  function applyForm(f, field) {
    const d = readForm(f);
    let s = d.s, e = d.e;
    if (s != null && e != null && e <= s) e = e === 0 ? DAY : Math.min(DAY, s + SNAP); // an end at midnight means the end of the day
    if (ed.mode === 'new') {
      Object.assign(ed, { title: d.title, k: d.date || ed.k, allday: d.allday, color: d.color, cat: d.cat || ed.cat, repeat: d.repeat || ed.repeat, remind: d.remind != null ? d.remind : ed.remind, notes: d.notes != null ? d.notes : ed.notes });
      if (s != null) ed.s = s; if (e != null) ed.e = e;
      syncTimeUi(f, ed.s, ed.e);
      return;
    }
    if (ed.kind === 'blk') {
      const b = getB(ed.id); if (!b) return;
      if (field === 'title') {
        const match = d.title && ML.orderedOpen().find(x => ML.titleOf(x) === d.title);
        if (match) { b.taskId = match.id; b.title = null; } else if (d.title) { b.taskId = null; b.title = d.title; }
      }
      if (s != null && e != null) { b.start = clamp(s, 0, DAY - SNAP); b.mins = clamp(e - b.start, SNAP, DAY - b.start); }
      if (d.date) { b.date = d.date; sel = { kind: 'blk', id: b.id, k: b.date }; ed.k = b.date; }
      b.color = d.color;
      syncTimeUi(f, b.start, b.start + b.mins);
    } else {
      const ev = getE(ed.id); if (!ev || ev.src) return;
      if (d.title) ev.title = d.title;
      ev.start = d.allday || s == null ? '' : hm(s);
      if (s != null && e != null) ev.mins = clamp(e - s, SNAP, DAY);
      if (d.date) ev.date = d.date;
      if (d.cat) ev.cat = d.cat; if (d.repeat) ev.repeat = d.repeat; if (d.remind != null) ev.remind = d.remind; if (d.notes != null) ev.notes = d.notes;
      ev.color = d.color;
      if (!isRep(ev)) { sel = { kind: 'ev', id: ev.id, k: ev.date }; ed.k = ev.date; }
      syncTimeUi(f, s, s + ev.mins);
      f.querySelector('.dg-ed-time').hidden = d.allday; f.querySelector('.dg-durs').hidden = d.allday;
      const a = f.querySelector('.ev-colors .auto i'); if (a && d.cat) a.style.setProperty('--c', ML.evColor({ cat: d.cat }));
    }
    save();
    clearTimeout(edTimer);
    edTimer = setTimeout(() => { emit('blocks'); emit('events'); if (ML.scheduleReminders) ML.scheduleReminders(); const h = activeHost(); if (h) render(h.name, { mainOnly: true }); }, field === 'title' || field === 'notes' ? 350 : 0);
  }
  function syncTimeUi(f, s, e) {
    if (s == null) return;
    const st = f.elements.start, en = f.elements.end;
    if (st && document.activeElement !== st) st.value = hm(s);
    if (en && document.activeElement !== en) en.value = hm(Math.min(e, DAY - 1));
    f.querySelectorAll('[data-dur]').forEach(b => b.setAttribute('aria-pressed', String(e - s === +b.dataset.dur)));
  }
  document.addEventListener('input', e => {
    const f = e.target.closest && e.target.closest('#dg-ed'); if (!f || !ed) return;
    if (e.target.type === 'time' || e.target.type === 'date') return; // committed on change
    applyForm(f, e.target.name);
  });
  document.addEventListener('change', e => {
    const f = e.target.closest && e.target.closest('#dg-ed'); if (!f || !ed) return;
    applyForm(f, e.target.name);
  });
  document.addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('dg-ed-more')) { C().edMore = e.target.open; save(); } }, true);
  document.addEventListener('submit', e => {
    const f = e.target.closest && e.target.closest('#dg-ed'); if (!f) return;
    e.preventDefault();
    if (!ed || ed.mode !== 'new') { closeEditor(); return; }
    applyForm(f);
    const d = readForm(f);
    if (!d.title) { f.elements.title.focus(); return; }
    const k = ed.k || today(), s = ed.s, e2 = ed.e;
    const snap = snapshot();
    C().kind = ed.kind;
    if (ed.kind === 'blk') {
      const match = ML.orderedOpen().find(x => ML.titleOf(x) === d.title);
      const b = addBlock(k, s, e2 - s, match ? match.id : null, match ? null : d.title); b.color = d.color;
      const n = ripple(k, b);
      sel = { kind: 'blk', id: b.id, k }; ed = null;
      changed(n ? tn('dg_pushed', n) : t('dg_saved'), n ? snap : null);
    } else {
      const ev = { id: uid(), title: d.title, date: k, start: d.allday ? '' : hm(s), mins: clamp(e2 - s, SNAP, DAY), cat: d.cat || 'class', repeat: d.repeat || 'none', remind: d.remind != null ? d.remind : 15, notes: d.notes || '', color: d.color };
      S.events.push(ev);
      sel = ev.start ? { kind: 'ev', id: ev.id, k } : null; ed = null;
      changed(t('ev_saved'));
    }
  });

  /* ---------- Small menus (View, item, +n) ---------- */
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function openMenu(html, x, y, anchor) {
    closeMenu();
    menu = document.createElement('div'); menu.className = 'pl-pop dg-pop'; menu.innerHTML = html;
    document.body.appendChild(menu);
    const r = menu.getBoundingClientRect();
    let left = x, top = y;
    if (anchor) { const a = anchor.getBoundingClientRect(); left = a.right - r.width; top = a.bottom + 6; if (top + r.height > innerHeight - 8) top = a.top - r.height - 6; }
    menu.style.left = clamp(left, 8, innerWidth - r.width - 8) + 'px';
    menu.style.top = clamp(top, 8, innerHeight - r.height - 8) + 'px';
    const first = menu.querySelector('button'); if (first && matchMedia('(pointer: fine)').matches) first.focus({ preventScroll: true });
  }
  function viewMenuHtml(view) {
    const dp = disp(view);
    const seg = (key, vals) => `<div class="seg-toggle" role="group">${vals.map(v => `<button type="button" data-dv="${key}:${v}" aria-pressed="${dp[key] === v}">${esc(t(`dg_${key}_${v}`))}</button>`).join('')}</div>`;
    return `<div class="dg-vmenu"><span class="label">${esc(t('dg_density'))}</span>${seg('d', ['compact', 'normal', 'large'])}
      <span class="label">${esc(t('dg_hours'))}</span>${seg('h', ['24', 'mine', 'auto'])}
      ${view === 'day' ? `<span class="label">${esc(t('dg_layout'))}</span>${seg('l', ['grid', 'lines'])}` : ''}</div>`;
  }
  function itemMenuHtml(it) {
    const blk = it.kind === 'blk', b = blk && getB(it.id);
    const btn = (a, label, cls = '') => `<button type="button" class="pp-it ${cls}" data-act="${a}">${esc(label)}</button>`;
    return `<div class="pp-list">${blk ? btn('go', t('dg_lock')) + btn('done', t(b && blockDone(b) ? 'dg_undone' : 'dg_done')) : ''}${btn('edit', t('dg_edit'))}${btn('dup', t('dg_dup'))}${it.feed ? '' : btn('tomorrow', t('dg_tomorrow')) + btn('del', t('dg_del'), 'danger')}</div>`;
  }

  /* ---------- Clicks ---------- */
  function hostFrom(el) { const h = el.closest && el.closest('.dg-host'); return h ? hosts[h.dataset.host] : null; }
  function selItem() { return sel && itemsOn(sel.k).find(i => i.kind === sel.kind && i.id === sel.id); }
  function act(a) {
    const it = selItem() || (ed && ed.mode === 'edit' ? itemsOn(ed.k).find(i => i.id === ed.id) || { kind: ed.kind, id: ed.id, k: ed.k } : null);
    if (!it) return;
    closeMenu();
    if (a === 'go') { const b = getB(it.id); if (b) { ed = null; sel = null; startBlock(b); renderActive(); } }
    else if (a === 'done') { toggleDone(it.id); edVer++; renderActive(); }
    else if (a === 'edit') { setEd({ mode: 'edit', kind: it.kind, id: it.id, k: it.k }); sel = { kind: it.kind, id: it.id, k: it.k }; renderActive(); }
    else if (a === 'dup') duplicate(it.kind, it.id, it.k);
    else if (a === 'tomorrow') toTomorrow(it.kind, it.id, it.k);
    else if (a === 'del') removeItem(it.kind, it.id, it.k, false);
    else if (a === 'delseries') removeItem(it.kind, it.id, it.k, true);
  }
  document.addEventListener('click', e => {
    const tg = e.target;
    if (menu && !menu.contains(tg) && !tg.closest('[data-dg="view"]')) closeMenu();
    if (!tg.closest) return;
    const inMenu = menu && menu.contains(tg);
    const dv = tg.closest('[data-dv]');
    if (dv && inMenu) {
      const host = activeHost(); if (!host) return;
      const [key, val] = dv.dataset.dv.split(':');
      setDisp(host.view, key, val); delete scrollMem[host.name];
      render(host.name); menu.innerHTML = viewMenuHtml(host.view); return;
    }
    const pick = tg.closest('[data-pick]');
    if (pick && inMenu) { const [kind, id, k] = pick.dataset.pick.split('|'); closeMenu(); ML.dgOpen(kind, id, k); return; }
    const a = tg.closest('[data-act]');
    if (a && (inMenu || tg.closest('.dg-bar, #dg-ed'))) { e.preventDefault(); act(a.dataset.act); return; }
    if (tg.closest('[data-edclose]')) { if (tg.closest('.dg-sheet-bg') && Date.now() - sheetAt < 450) return; closeEditor(); return; }
    const kindBtn = tg.closest('[data-edkind]');
    if (kindBtn && ed && ed.mode === 'new') { const f = tg.closest('#dg-ed'); if (f) applyForm(f); ed.kind = kindBtn.dataset.edkind; edVer++; C().kind = ed.kind; renderActive(); setTimeout(focusTitle, 10); return; }
    const step = tg.closest('[data-step]');
    if (step) {
      const f = tg.closest('#dg-ed'), d = readForm(f), [w, n] = step.dataset.step.split(':');
      let s = d.s, en = d.e != null && d.e <= s ? DAY : d.e;
      if (w === 's') { const dur = en - s; s = clamp(s + +n, 0, DAY - Math.max(SNAP, dur)); en = s + dur; } else en = clamp(en + +n, s + SNAP, DAY);
      f.elements.start.value = hm(s); f.elements.end.value = hm(Math.min(en, DAY - 1));
      applyForm(f, 'start'); if (ed && ed.mode === 'new') { ed.s = s; ed.e = en; } return;
    }
    const dur = tg.closest('[data-dur]');
    if (dur) {
      const f = tg.closest('#dg-ed'), d = readForm(f), en = Math.min(DAY, d.s + +dur.dataset.dur);
      f.elements.end.value = hm(Math.min(en, DAY - 1));
      if (ed && ed.mode === 'new') { ed.e = en; syncTimeUi(f, d.s, en); } else applyForm(f, 'end');
      return;
    }
    const host = hostFrom(tg);
    const ck = tg.closest('[data-ck]');
    if (ck) { e.stopPropagation(); toggleDone(ck.dataset.ck); renderActive(); return; }
    const free = tg.closest('[data-free]');
    if (free) { const [k, a2, b2] = free.dataset.free.split('|'); openNew({ k, s: +a2, e: Math.min(+b2, +a2 + 60), kind: 'blk' }); return; }
    const op = tg.closest('[data-open]');
    if (op && !tg.closest('.dg-scroll')) { ML.dgOpen(op.dataset.kind, op.dataset.id, op.dataset.k); return; }
    const more = tg.closest('[data-more]');
    if (more) {
      const list = moreLists[+more.dataset.more] || [];
      openMenu(`<div class="pp-list">${list.map(i => `<button type="button" class="pp-it" data-pick="${i.kind}|${i.id}|${i.k}"><i class="dg-dot" style="--c:${i.c}"></i>${esc(i.title)} <small>${hm(i.s)}–${hm(i.e)}</small></button>`).join('')}</div>`, 0, 0, more);
      return;
    }
    const tray = tg.closest('[data-tray]');
    if (tray && host) {
      const days = host.days(), td = today();
      const k = host.view === 'day' ? days[0] : days.find(d => d >= td && d >= (S.cal.sel || td)) || days.find(d => d >= td) || days[0];
      if (!placeTask(k, tray.dataset.tray)) toast(t('no_slot'));
      return;
    }
    const dday = tg.closest('[data-dgday]');
    if (dday && host) { host.goDay(dday.dataset.dgday); return; }
    const fold = tg.closest('[data-fold]');
    if (fold && host) { setDisp(host.view, 'h', '24'); render(host.name); return; }
    const b = tg.closest('[data-dg]');
    if (!b || !host) return;
    const k = b.dataset.dg;
    if (k === 'prev' || k === 'next') { sel = null; host.nav(k === 'next' ? 1 : -1); save(); render(host.name); }
    else if (k === 'today') { sel = null; host.goToday(); save(); render(host.name); }
    else if (k === 'new') openNew({});
    else if (k === 'view') { if (menu) { closeMenu(); return; } openMenu(viewMenuHtml(host.view), 0, 0, b); }
    else if (k === 'wide') { C().wide = !C().wide; save(); applyWide(); render(host.name); }
    else if (k === 'tray') { C().trayOpen = !trayOpen(); save(); render(host.name); }
    else if (k === 'auto') host.autoPlan();
    else if (k === 'timer') { ML.toggleTimer(); render(host.name); }
  });
  document.addEventListener('contextmenu', e => {
    const it = e.target.closest && e.target.closest('.dg-scroll .dg-it'); if (!it) return;
    e.preventDefault();
    sel = { kind: it.dataset.kind, id: it.dataset.id, k: it.dataset.k }; if (ed && ed.id !== sel.id) ed = null;
    renderActive();
    const found = selItem(); if (found) openMenu(itemMenuHtml(found), e.clientX, e.clientY);
  });

  /* ---------- Pointer: tap to select, drag to move (other days too in the week), handles to resize, drag on empty space to draw ---------- */
  let drag = null;
  const snapM = m => Math.round(m / SNAP) * SNAP;
  function yMins(sc, clientY) { const body = sc.querySelector('.dg-body'); return (clientY - body.getBoundingClientRect().top) / +sc.dataset.hpx * 60 + +sc.dataset.from; }
  function colAt(sc, x) { const cols = [...sc.querySelectorAll('.dg-col')]; return cols.find(c => { const r = c.getBoundingClientRect(); return x >= r.left && x < r.right; }) || null; }
  document.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const sc = e.target.closest && e.target.closest('.dg-scroll'); if (!sc) return;
    if (e.target.closest('.dg-ck, .dg-bar, .dg-more')) return;
    const mouse = e.pointerType === 'mouse', hd = e.target.closest('.dg-hd'), el = e.target.closest('.dg-it'), col = e.target.closest('.dg-col');
    if (hd && sel) {
      const it = selItem(); const iel = sc.querySelector(`.dg-it.sel`); if (!it || !iel) return;
      drag = { type: hd.dataset.hd, it, el: iel, sc, y0: e.clientY, x0: e.clientX, s: it.s, e: it.e, k: it.k, moved: true };
      hd.setPointerCapture(e.pointerId); e.preventDefault(); return;
    }
    if (el) {
      const it = itemsOn(el.dataset.k).find(i => i.kind === el.dataset.kind && i.id === el.dataset.id); if (!it) return;
      drag = { type: 'press', it, el, sc, y0: e.clientY, x0: e.clientX, s: it.s, e: it.e, k: it.k, mouse, pid: e.pointerId, canMove: !it.feed && (mouse || isSel(it)) };
      if (drag.canMove && !mouse) e.preventDefault();
      return;
    }
    if (col) drag = { type: 'empty', col, sc, y0: e.clientY, x0: e.clientX, k: col.dataset.k, mouse, pid: e.pointerId };
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = e.clientY - drag.y0, dx = e.clientX - drag.x0, far = Math.hypot(dx, dy);
    if (drag.type === 'press') {
      if (!drag.canMove) { if (far > 8) drag = null; return; }
      if (far < 5) return;
      drag.type = 'move'; drag.el.classList.add('dragging');
      try { drag.el.setPointerCapture(drag.pid); } catch (err) {}
    }
    if (drag.type === 'empty') {
      if (!drag.mouse) { if (far > 8) drag = null; return; }
      if (Math.abs(dy) < 6) return;
      drag.type = 'draw';
      drag.ghost = document.createElement('div'); drag.ghost.className = 'dg-ghost'; drag.col.appendChild(drag.ghost);
      try { drag.col.setPointerCapture(drag.pid); } catch (err) {}
    }
    const sc = drag.sc, hpx = +sc.dataset.hpx, from = +sc.dataset.from, to = +sc.dataset.to;
    const dm = snapM(dy / hpx * 60), py = m => (clamp(m, from, to) - from) / 60 * hpx;
    const dur = drag.e - drag.s;
    if (drag.type === 'move') {
      drag.ns = clamp(drag.s + dm, 0, DAY - dur); drag.ne = drag.ns + dur;
      const c = colAt(sc, e.clientX);
      if (c && c.dataset.k !== (drag.nk || drag.k)) { drag.nk = c.dataset.k; c.appendChild(drag.el); drag.el.style.left = '1px'; drag.el.style.width = 'calc(100% - 4px)'; }
      drag.el.style.top = py(drag.ns) + 'px';
    } else if (drag.type === 'top') { drag.ns = clamp(drag.s + dm, 0, drag.e - SNAP); drag.ne = drag.e; drag.el.style.top = py(drag.ns) + 'px'; drag.el.style.height = Math.max(16, py(drag.ne) - py(drag.ns) - 2) + 'px'; }
    else if (drag.type === 'bot') { drag.ns = drag.s; drag.ne = clamp(drag.e + dm, drag.s + SNAP, DAY); drag.el.style.height = Math.max(16, py(drag.ne) - py(drag.ns) - 2) + 'px'; }
    else if (drag.type === 'draw') {
      const a = snapM(yMins(sc, drag.y0)), b = snapM(yMins(sc, e.clientY));
      drag.ns = clamp(Math.min(a, b), 0, DAY - SNAP); drag.ne = clamp(Math.max(a, b, drag.ns + SNAP), SNAP, DAY);
      drag.ghost.style.top = py(drag.ns) + 'px'; drag.ghost.style.height = (py(drag.ne) - py(drag.ns)) + 'px';
      drag.ghost.textContent = hm(drag.ns) + '–' + hm(drag.ne === DAY ? 0 : drag.ne);
      e.preventDefault(); return;
    }
    if (drag.ns != null) { const sp = drag.el.querySelector('span'); if (sp) sp.textContent = hm(drag.ns) + '–' + hm(drag.ne === DAY ? 0 : drag.ne); }
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('pointerup', e => {
    const d = drag; drag = null; if (!d) return;
    if (d.type === 'press') {
      const it = d.it, wasSel = isSel(it), host = hostFrom(d.sc);
      sel = { kind: it.kind, id: it.id, k: it.k };
      if (host && host.wideNow) setEd({ mode: 'edit', kind: it.kind, id: it.id, k: it.k });
      else if (wasSel || (ed && ed.mode === 'edit')) setEd({ mode: 'edit', kind: it.kind, id: it.id, k: it.k }); // a second tap opens the form
      else ed = null;
      closeMenu(); renderActive(); return;
    }
    if (d.type === 'empty') {
      if (sel || ed || menu) { sel = null; ed = null; closeMenu(); renderActive(); return; }
      const s = clamp(Math.floor(yMins(d.sc, e.clientY) / 30) * 30, 0, DAY - 30);
      openNew({ k: d.k, s }); return;
    }
    if (d.type === 'draw') { d.ghost.remove(); if (d.ns != null) openNew({ k: d.k, s: d.ns, e: d.ne }); return; }
    if (d.ns == null) { renderActive(); return; }
    const nk = d.nk || d.k;
    if (nk === d.k && d.ns === d.s && d.ne === d.e) { renderActive(); return; }
    moveItem(d.it.kind, d.it.id, d.k, { date: nk, start: d.ns, mins: d.ne - d.ns });
  });
  document.addEventListener('pointercancel', () => { if (drag) { if (drag.ghost) drag.ghost.remove(); drag = null; renderActive(); } });
  // Keyboard on an item: Enter opens it
  document.addEventListener('keydown', e => {
    const it = e.target.closest && e.target.closest('.dg-it[data-id]');
    if (it && (e.key === 'Enter' || e.key === ' ') && !e.target.closest('.dg-ck')) { e.preventDefault(); ML.dgOpen(it.dataset.kind, it.dataset.id, it.dataset.k); }
  });
  // Tray tasks dragged onto the grid (mouse)
  document.addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('[data-tray]'); if (c) { e.dataTransfer.setData('text/plain', 'mli-task:' + c.dataset.tray); e.dataTransfer.effectAllowed = 'copy'; } });
  document.addEventListener('dragover', e => { const c = e.target.closest && e.target.closest('.dg-col'); if (c) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
  document.addEventListener('drop', e => {
    const c = e.target.closest && e.target.closest('.dg-col'); if (!c) return;
    const raw = e.dataTransfer.getData('text/plain') || ''; if (!raw.startsWith('mli-task:')) return;
    e.preventDefault();
    const sc = c.closest('.dg-scroll');
    placeTask(c.dataset.k, raw.slice(9), clamp(snapM(yMins(sc, e.clientY)), 0, DAY - SNAP));
  });

  /* ---------- Keys (Journée and Agenda week) ---------- */
  document.addEventListener('keydown', e => {
    const host = activeHost(); if (!host) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') {
      if (menu) { closeMenu(); e.stopPropagation(); e.preventDefault(); return; }
      if (ed) { if (ML.isTyping(e) && e.target.blur) e.target.blur(); closeEditor(); e.stopPropagation(); e.preventDefault(); return; }
      if (sel) { sel = null; renderActive(); e.stopPropagation(); e.preventDefault(); }
      return;
    }
    if (ML.isTyping(e)) return;
    const st = document.getElementById('settings'); if (st && !st.hidden) return;
    const k = e.key.toLowerCase();
    if (k === 'n') { e.preventDefault(); e.stopImmediatePropagation(); openNew({}); return; }
    if (k === 't') { e.preventDefault(); sel = null; host.goToday(); save(); render(host.name); return; }
    const it = selItem();
    if (it && !ed) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); if (it.feed) return;
        const d = e.key === 'ArrowUp' ? -SNAP : SNAP;
        if (e.shiftKey) moveItem(it.kind, it.id, it.k, { date: it.k, start: it.s, mins: clamp(it.e - it.s + d, SNAP, DAY - it.s) });
        else moveItem(it.kind, it.id, it.k, { date: it.k, start: clamp(it.s + d, 0, DAY - (it.e - it.s)), mins: it.e - it.s });
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); if (!it.feed) moveItem(it.kind, it.id, it.k, { date: addDays(it.k, e.key === 'ArrowLeft' ? -1 : 1), start: it.s, mins: it.e - it.s }); return; }
      if (e.key === 'Enter') { e.preventDefault(); ML.dgOpen(it.kind, it.id, it.k); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); if (!it.feed) removeItem(it.kind, it.id, it.k, false); return; }
    }
    if (!it && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !(e.target.closest && e.target.closest('input, select, textarea, [role=tab]'))) {
      e.preventDefault(); host.nav(e.key === 'ArrowLeft' ? -1 : 1); save(); render(host.name);
    }
  }, true);

  /* ---------- Full width (P4): the timer column folds into the grid's header ---------- */
  function applyWide() {
    const on = !!C().wide && desktop() && (S.tab === 'day' || S.tab === 'cal');
    document.documentElement.classList.toggle('dg-wide', on);
  }
  on('tab', () => { sel = null; ed = null; closeMenu(); applyWide(); renderSheet(); });
  on('started', () => {
    applyWide();
    if (ML.planKeys && !ML.planKeys.some(r => r[1] === 'key_dg_new')) ML.planKeys.push(['N', 'key_dg_new'], ['T', 'key_dg_today'], ['↑ ↓, Maj / Shift', 'key_dg_move'], ['← →', 'key_dg_day'], ['Suppr / Delete', 'key_dg_del']);
  });
  let rsz = null;
  addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => { applyWide(); const h = activeHost(); if (h) render(h.name); }, 150); });
  on('tick', () => { document.querySelectorAll('.dg-clock').forEach(c => { const v = MiniView.fmtClock(ML.remainingNow()); if (c.textContent !== v) c.textContent = v; }); });
  on('timer', () => { if (C().wide && document.querySelector('.dg-clock')) renderActive({ mainOnly: true }); });
  // Background re-renders that would drop the form being typed in go through keepInputs in the hosts
  ML.dgEditing = () => !!ed;

  ML.settingsSection({
    order: 28, cat: 'planning',
    render: () => `${ML.ui.chk('set-dgpush', t('dg_set_push'), C().push !== false)}
      <label class="field"><span>${esc(t('dg_set_from'))}</span>${ML.ui.sel('set-dgfrom', [0, 5, 6, 7, 8, 9, 10].map(h => [h, h + ':00']), myHours()[0])}</label>
      <label class="field"><span>${esc(t('dg_set_to'))}</span>${ML.ui.sel('set-dgto', [18, 19, 20, 21, 22, 23, 24].map(h => [h, (h % 24) + ':00']), myHours()[1])}</label>`,
    bind: r => {
      r.querySelector('#set-dgpush').onchange = e => { C().push = e.target.checked; save(); };
      r.querySelector('#set-dgfrom').onchange = e => { C().hFrom = +e.target.value; save(); ML.renderAll(); };
      r.querySelector('#set-dgto').onchange = e => { C().hTo = +e.target.value; save(); ML.renderAll(); };
    },
  });
})();
