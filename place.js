// Placing a task in the day (3.111, B1 + B3 of proposals/matieres-today). A task's time is its next block not done
// (from today on). ML.freeSlots gives the next free starts for a length on a day, one per gap; ML.timePop is the small
// « Heure » menu of the add field and of the task form; ML.placeSheet is the « Placer » sheet (the day as a ribbon with
// its free gaps), opened from a task's menu and from the tasks without a time on Today.
(() => {
  'use strict';
  const { S, t, esc, save, today, addDays, fmtMins, toast } = ML;

  ML.addStrings({
    fr: { pc_place: 'Placer', pc_title: 'Placer « {t} »', pc_hint: 'Touche un créneau libre', pc_none: 'Plus de créneau libre ce jour-là.', pc_placed: 'Placé {d} à {h}', pc_no_time: 'Sans heure', pc_time: 'Heure', pc_free: 'libre', pc_other: 'Autre heure', pc_unplaced: 'Retiré du calendrier', pc_undo: 'Annuler', pc_remove: 'Retirer du calendrier', pc_ok: 'OK' },
    en: { pc_place: 'Place', pc_title: 'Place “{t}”', pc_hint: 'Tap a free slot', pc_none: 'No free slot left that day.', pc_placed: 'Placed {d} at {h}', pc_no_time: 'No time', pc_time: 'Time', pc_free: 'free', pc_other: 'Other time', pc_unplaced: 'Taken off the calendar', pc_undo: 'Undo', pc_remove: 'Take off the calendar', pc_ok: 'OK' },
  });

  const hm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  ML.hm = hm;
  const nowM = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const hours = () => (ML.dg && ML.dg.myHours ? ML.dg.myHours() : [7, 23]);
  const dayWord = k => (ML.planDayLabel ? ML.planDayLabel(k) : k).toLowerCase();
  const parseHM = v => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || '').trim()); return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null; };

  // The next free starts on day k for a length, from now on today (from the start of My hours otherwise), one per gap
  function freeSlots(k, mins, n = 3, exceptId) {
    if (!ML.dg || k < today()) return [];
    const [h0, h1] = hours(), end = h1 * 60, out = [];
    let from = Math.max(h0 * 60, k === today() ? nowM() + 5 : 0);
    while (out.length < n) {
      const s = ML.dg.nextFree(k, from, mins, end, exceptId);
      if (s == null) break;
      out.push(s);
      const nb = ML.dg.busy(k, exceptId).find(([a]) => a >= s + mins); // the next chip is in another gap
      from = nb ? nb[1] : s + mins + 60;
    }
    return out;
  }
  ML.freeSlots = freeSlots;

  const taskBlock = task => (S.blocks || []).filter(b => b.taskId === task.id && !b.done && b.date >= today()).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)[0] || null;
  ML.taskBlock = taskBlock;

  // Give a task a time on day k (moves its next block, else places a new one); at == null takes it off the calendar.
  // Returns an undo function.
  function setTime(task, k, at) {
    const b = taskBlock(task), before = b ? { date: b.date, start: b.start, mins: b.mins } : null, hadDue = task.due;
    if (at == null) {
      const gone = (S.blocks || []).filter(x => x.taskId === task.id && !x.done && x.date >= today());
      S.blocks = S.blocks.filter(x => !gone.includes(x));
      return () => { S.blocks.push(...gone); };
    }
    if (!task.due) task.due = k;
    let made = null;
    if (b) Object.assign(b, { date: k, start: at, mins: task.mins || b.mins });
    else made = ML.dg.placeTask(k, task.id, at);
    return () => {
      if (made) S.blocks = S.blocks.filter(x => x !== made);
      else if (b && before) Object.assign(b, before);
      if (!hadDue) delete task.due;
    };
  }
  ML.taskSetTime = setTime;
  // Same, plus save, redraw and a toast with Undo
  ML.placeTaskAt = (task, k, at) => {
    const undo = setTime(task, k, at);
    task.sample = false; save(); ML.renderAll();
    toast(at == null ? t('pc_unplaced') : t('pc_placed', { d: dayWord(k), h: hm(at) }), { key: 'pcplace', action: { label: t('pc_undo'), fn: () => { undo(); save(); ML.renderAll(); } } });
  };

  // The « Heure » menu (add field, task form): No time, the next free slots, another time
  ML.timePop = (anchor, k, mins, cur, exceptId, apply) => {
    const slots = freeSlots(k, mins, 4, exceptId);
    if (cur != null && !slots.includes(cur)) { slots.push(cur); slots.sort((a, b) => a - b); }
    const it = (v, label, on, aside = '') => `<button type="button" class="pp-it ${on ? 'on' : ''}" data-pv="${esc(JSON.stringify(v))}"><span>${esc(label)}</span>${aside ? `<small>${esc(aside)}</small>` : ''}</button>`;
    const html = `<div class="pp-list pp-at">${it(null, t('pc_no_time'), cur == null)}${slots.map(s => it(s, hm(s), s === cur, s === cur ? '' : t('pc_free'))).join('')}
      <form class="pp-form" data-pk="at"><input type="time" step="900" value="${cur != null ? String(Math.floor(cur / 60)).padStart(2, '0') + ':' + String(cur % 60).padStart(2, '0') : ''}" aria-label="${esc(t('pc_other'))}"><button type="submit" class="small">${esc(t('pc_ok'))}</button></form></div>`;
    ML.planPop(anchor, html, v => { if (typeof v === 'string') v = parseHM(v); apply(v); });
  };

  /* ---------- The « Placer » sheet ---------- */
  const sheet = document.createElement('div'); sheet.className = 'pc-sheet'; sheet.hidden = true;
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
  document.body.appendChild(sheet);
  let cur = null, day = null, back = null;
  function render() {
    const task = S.tasks.find(x => x.id === cur); if (!task) return close();
    const mins = task.mins || 30, b = taskBlock(task), [h0, h1] = hours(), A = h0 * 60, Z = h1 * 60, span = Z - A;
    const td = today(), days = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(td, i));
    const pct = m => ((Math.max(A, Math.min(Z, m)) - A) / span * 100).toFixed(2);
    const busy = ML.dg.busy(day, b && b.date === day ? b.id : undefined);
    // free gaps of at least the task's length, inside My hours, from now on today
    const gaps = []; let s = Math.max(A, day === td ? Math.ceil((nowM() + 5) / 15) * 15 : 0);
    busy.forEach(([a, z]) => { if (Math.min(a, Z) - s >= mins) gaps.push([s, Math.min(a, Z)]); s = Math.max(s, Math.ceil(z / 15) * 15); });
    if (Z - s >= mins) gaps.push([s, Z]);
    const slots = freeSlots(day, mins, 4, b && b.date === day ? b.id : undefined);
    const marks = [A, A + Math.round(span / 3 / 60) * 60, A + Math.round(span * 2 / 3 / 60) * 60, Z];
    sheet.innerHTML = `<div class="pc-in">
      <div class="pc-grab" aria-hidden="true"></div>
      <h3 class="pc-h">${esc(t('pc_title', { t: ML.titleOf(task) }))} <small>${esc(fmtMins(mins))}</small></h3>
      <div class="pc-days" role="group">${days.map(k => `<button type="button" class="chip ${k === day ? 'on' : ''}" data-pday="${k}" aria-pressed="${k === day}">${esc(ML.planDayLabel ? ML.planDayLabel(k) : k)}</button>`).join('')}</div>
      <div class="pc-rib-h" aria-hidden="true">${marks.map(m => `<span>${Math.floor(m / 60)} h</span>`).join('')}</div>
      <div class="pc-rib">
        ${busy.filter(([a, z]) => z > A && a < Z).map(([a, z]) => `<i class="pc-busy" style="left:${pct(a)}%;width:${(pct(z) - pct(a)).toFixed(2)}%"></i>`).join('')}
        ${gaps.map(([a, z]) => `<button type="button" class="pc-gap" data-pat="${a}" style="left:${pct(a)}%;width:${(pct(z) - pct(a)).toFixed(2)}%" aria-label="${esc(hm(a) + ' – ' + hm(z))}"></button>`).join('')}
        ${day === td && nowM() > A && nowM() < Z ? `<u class="pc-now" style="left:${pct(nowM())}%"></u>` : ''}
      </div>
      ${slots.length ? `<p class="pc-hint">${esc(t('pc_hint'))}</p><div class="pc-slots">${slots.map(x => `<button type="button" class="chip" data-pat="${x}">${esc(hm(x))}</button>`).join('')}</div>` : `<p class="pc-hint">${esc(t('pc_none'))}</p>`}
      <div class="pc-foot">${b ? `<button type="button" class="ghost small" data-prm="1">${esc(t('pc_remove'))}</button>` : '<span></span>'}<button type="button" class="ghost small" data-pclose="1">${esc(t('close'))}</button></div>
    </div>`;
  }
  function open(id, k) {
    const task = S.tasks.find(x => x.id === id); if (!task || !ML.dg) return;
    back = document.activeElement; cur = id;
    const b = taskBlock(task); day = k || (b ? b.date : task.due && task.due > today() ? task.due : today());
    render(); sheet.hidden = false;
    const f = sheet.querySelector('.pc-slots .chip, [data-pclose]'); if (f) f.focus({ preventScroll: true });
  }
  function close() { sheet.hidden = true; sheet.innerHTML = ''; cur = null; if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true }); back = null; }
  ML.placeSheet = open;
  sheet.addEventListener('click', e => {
    if (e.target === sheet || e.target.closest('[data-pclose]')) return close();
    const task = S.tasks.find(x => x.id === cur); if (!task) return close();
    const d = e.target.closest('[data-pday]'); if (d) { day = d.dataset.pday; render(); return; }
    const p = e.target.closest('[data-pat]'); if (p) { const k = day; close(); ML.placeTaskAt(task, k, +p.dataset.pat); return; }
    if (e.target.closest('[data-prm]')) { close(); ML.placeTaskAt(task, null, null); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { e.stopPropagation(); close(); } }, true);
  // Right-click (or the Menu key) on a task of the Plan list: Place, Lock in, Edit
  setTimeout(() => {
    if (!ML.ctx) return;
    ML.ctx.add('#tasks .task:not(.editing):not(.done)', el => {
      const x = S.tasks.find(y => y.id === el.dataset.id); if (!x) return [];
      return [
        { label: t('pc_place'), fn: () => open(x.id) },
        { label: t('lock_in'), fn: () => ML.lockIn({ taskId: x.id, mins: x.mins }) },
        { label: t('edit'), fn: () => ML.editTask(x.id) },
      ];
    }, el => { const x = S.tasks.find(y => y.id === el.dataset.id); return x ? ML.titleOf(x) : ''; });
  }, 0);
})();
