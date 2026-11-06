// Calendar tab: month grid, events (with repeats and reminders), upcoming list, .ics import/export.
(() => {
  'use strict';
  const { $, S, t, tn, esc, save, on, emit, toast, uid, dayKey, today, parseDay, addDays, hm, toMins, fmtMins } = ML;

  ML.addStrings({
    fr: {
      new_event: 'Événement', today_btn: 'Aujourd’hui', upcoming: 'À venir', nothing_upcoming: 'Rien de prévu dans les 14 prochains jours.',
      ev_title_ph: 'Titre (cours, rendez-vous, examen…)', ev_date: 'Date', ev_time: 'Heure', ev_allday: 'Toute la journée', ev_cat: 'Catégorie', ev_remind: 'Rappel', ev_notes_ph: 'Lieu, notes…',
      cat_class: 'Cours', cat_study: 'Étude', cat_work: 'Travail', cat_perso: 'Perso', cat_meal: 'Repas', cat_sport: 'Sport', cat_social: 'Social', cat_deadline: 'Échéance',
      ev_color: 'Couleur', ev_color_auto: 'Auto',
      rem_0: 'Aucun', rem_5: '5 min avant', rem_15: '15 min avant', rem_30: '30 min avant', rem_60: '1 h avant', rem_1440: 'La veille',
      rep_none: 'Une fois', rep_daily: 'Chaque jour', rep_weekdays: 'En semaine', rep_weekly: 'Chaque semaine', rep_monthly: 'Chaque mois',
      ev_saved: 'Événement enregistré', ev_deleted: 'Événement supprimé', day_empty: 'Rien ce jour-là.',
      due_tasks: 'Tâches à rendre', plan_this_day: 'Planifier cette journée', blocks_planned_one: '{n} bloc planifié ({m})', blocks_planned: '{n} blocs planifiés ({m})',
      import_ics: 'Importer un .ics', export_ics: 'Exporter en .ics', ics_hint: 'Exporte ton agenda Google ou Outlook en fichier .ics, puis importe-le ici.',
      imported: '{n} événement(s) importé(s)', import_none: 'Aucun événement trouvé dans ce fichier.', reminder: 'Rappel : {title} à {time}', reminder_day: 'Demain : {title}',
      delete_event: 'Supprimer l’événement', cal_v_day: 'Jour', cal_v_week: 'Semaine', cal_v_month: 'Mois',
    },
    en: {
      new_event: 'Event', today_btn: 'Today', upcoming: 'Upcoming', nothing_upcoming: 'Nothing planned in the next 14 days.',
      ev_title_ph: 'Title (class, appointment, exam…)', ev_date: 'Date', ev_time: 'Time', ev_allday: 'All day', ev_cat: 'Category', ev_remind: 'Reminder', ev_notes_ph: 'Place, notes…',
      cat_class: 'Class', cat_study: 'Study', cat_work: 'Work', cat_perso: 'Personal', cat_meal: 'Meal', cat_sport: 'Sport', cat_social: 'Social', cat_deadline: 'Deadline',
      ev_color: 'Color', ev_color_auto: 'Auto',
      rem_0: 'None', rem_5: '5 min before', rem_15: '15 min before', rem_30: '30 min before', rem_60: '1 h before', rem_1440: 'The day before',
      rep_none: 'Once', rep_daily: 'Daily', rep_weekdays: 'Weekdays', rep_weekly: 'Weekly', rep_monthly: 'Monthly',
      ev_saved: 'Event saved', ev_deleted: 'Event deleted', day_empty: 'Nothing that day.',
      due_tasks: 'Tasks due', plan_this_day: 'Plan this day', blocks_planned_one: '{n} block planned ({m})', blocks_planned: '{n} blocks planned ({m})',
      import_ics: 'Import .ics', export_ics: 'Export .ics', ics_hint: 'Export your Google or Outlook calendar as an .ics file, then import it here.',
      imported: '{n} event(s) imported', import_none: 'No events found in that file.', reminder: 'Reminder: {title} at {time}', reminder_day: 'Tomorrow: {title}',
      delete_event: 'Delete event', cal_v_day: 'Day', cal_v_week: 'Week', cal_v_month: 'Month',
    },
  });

  // Colors are 8 slots whose exact shade comes from the theme (vivid neon when fired up, softer otherwise), see --ev-N in app.css.
  // Each category has a default slot; an event can pick its own.
  const CAT_SLOT = { class: 2, study: 8, work: 1, perso: 3, meal: 7, sport: 4, social: 5, deadline: 6 };
  const slotVar = n => `var(--ev-${n})`;
  const CATS = Object.fromEntries(Object.entries(CAT_SLOT).map(([k, n]) => [k, slotVar(n)]));
  ML.CATS = CATS;
  ML.evColor = ev => slotVar(ev.color || CAT_SLOT[ev.cat] || CAT_SLOT.perso);
  ML.defaults(() => ({ events: [], notified: {}, cal: { month: null, sel: null, view: 'month' } }));

  /* ---------- Occurrences ---------- */
  function occursOn(ev, k) {
    if (k < ev.date) return false;
    if (ev.until && k > ev.until) return false;
    if (ev.skip && ev.skip.includes(k)) return false;
    const d = parseDay(k), d0 = parseDay(ev.date);
    switch (ev.repeat) {
      case 'daily': return true;
      case 'weekdays': return d.getDay() >= 1 && d.getDay() <= 5;
      case 'weekly': return d.getDay() === d0.getDay();
      case 'monthly': return d.getDate() === d0.getDate();
      default: return k === ev.date;
    }
  }
  // Events on a day, sorted: all-day first, then by start time
  function eventsOn(k) {
    return S.events.filter(ev => occursOn(ev, k)).map(ev => ({ ev, start: ev.start ? toMins(ev.start) : null, end: ev.start ? toMins(ev.start) + (ev.mins || 60) : null }))
      .sort((a, b) => (a.start == null ? -1 : a.start) - (b.start == null ? -1 : b.start));
  }
  ML.eventsOn = eventsOn;
  const dueOn = k => S.tasks.filter(x => x.due === k && !x.done);

  /* ---------- Rendering ---------- */
  let editing = null; // event id, or 'new'
  let draftStart = null; // start time of a new event picked on the hour grid
  const monthOf = k => k.slice(0, 7);
  const VIEWS = ['day', 'week', 'month'];
  const view = () => VIEWS.includes(S.cal.view) ? S.cal.view : 'month';
  const weekStart = k => addDays(k, -((parseDay(k).getDay() + 6) % 7));
  const nowMins = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const loc = () => ML.locale();
  const blocksOn = k => (S.blocks || []).filter(b => b.date === k);
  const blockName = b => { const x = b.taskId && S.tasks.find(y => y.id === b.taskId); return x ? ML.titleOf(x) : (b.title || '?'); };
  const sumBlocks = blocks => tn('blocks_planned', blocks.length, { m: fmtMins(blocks.reduce((a, b) => a + b.mins, 0)) });
  function headTitle(v, C, first) {
    if (v === 'day') return parseDay(C.sel).toLocaleDateString(loc(), { weekday: 'long', day: 'numeric', month: 'long' });
    if (v === 'week') {
      const a = parseDay(weekStart(C.sel)), b = parseDay(addDays(weekStart(C.sel), 6));
      if (a.getMonth() === b.getMonth()) return a.getDate() + '–' + b.toLocaleDateString(loc(), { day: 'numeric', month: 'long', year: 'numeric' });
      return a.toLocaleDateString(loc(), { day: 'numeric', month: 'short' }) + ' – ' + b.toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return first.toLocaleDateString(loc(), { month: 'long', year: 'numeric' });
  }
  function render() {
    const root = $('calendar'); if (!root) return;
    const C = S.cal, v = view();
    if (!C.sel) C.sel = today();
    if (!C.month) C.month = monthOf(C.sel);
    const [y, m] = C.month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    // Re-renders (minute ticks, syncs, opening the form) keep the hour grid where the user left it
    const prevSc = root.querySelector('.cw-scroll'), key = v + '@' + (v === 'week' ? weekStart(C.sel) : C.sel);
    const keepTop = prevSc && render.placed === key ? prevSc.scrollTop : null;
    if (render.placed !== key) render.placed = null;
    root.innerHTML = `
      <div class="seg-toggle cal-views" role="group" aria-label="${esc(t('tab_cal'))}">${VIEWS.map(k => `<button type="button" data-calv="${k}" aria-pressed="${k === v}">${esc(t('cal_v_' + k))}</button>`).join('')}</div>
      <div class="cal-head">
        <button type="button" class="ghost icon-only" data-cal="prev" aria-label="‹">‹</button>
        <h3>${esc(headTitle(v, C, first))}</h3>
        <button type="button" class="ghost icon-only" data-cal="next" aria-label="›">›</button>
        <span class="grow"></span>
        <button type="button" class="ghost small" data-cal="today">${esc(t('today_btn'))}</button>
        <button type="button" class="primary small" data-cal="new">+ ${esc(t('new_event'))}</button>
      </div>
      ${editing ? formHtml() : ''}
      ${v === 'day' ? dayHtml(C.sel) : v === 'week' ? weekHtml(C.sel) : monthHtml(C, y, m, first)}
      <div class="cal-ics">
        <p class="hint">${esc(t('ics_hint'))}</p>
        <label class="file-btn small">${esc(t('import_ics'))}<input type="file" id="ics-in" accept=".ics,text/calendar"></label>
        ${ML.CAN_DOWNLOAD ? `<button type="button" class="ghost small" data-cal="export">${esc(t('export_ics'))}</button>` : ''}
      </div>`;
    const sc = root.querySelector('.cw-scroll');
    if (sc) {
      if (keepTop != null) sc.scrollTop = keepTop;
      else if (sc.clientHeight) { // hidden (another tab, or the week list is showing): wait for a visible render
        render.placed = key;
        // First look: an hour before now when the range holds today, else the first timed item, else 8:00
        const days = v === 'week' ? [...Array(7)].map((_, i) => addDays(weekStart(C.sel), i)) : [C.sel];
        const starts = days.flatMap(k => eventsOn(k).filter(o => o.start != null).map(o => o.start).concat(blocksOn(k).map(b => b.start)));
        const anchor = days.includes(today()) ? Math.max(0, nowMins() - 60) : starts.length ? Math.min(...starts) : 8 * 60;
        sc.scrollTop = Math.max(0, anchor / 60 * +sc.dataset.hpx - 8);
      }
    }
    const f = root.querySelector('.ev-form [name=title]'); if (f && !f.value) f.focus();
  }

  function monthHtml(C, y, m, first) {
    const startDow = (first.getDay() + 6) % 7;
    const gridStart = new Date(y, m - 1, 1 - startDow);
    const td = today();
    const wd = [...Array(7)].map((_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(loc(), { weekday: 'narrow' }));
    let cells = '';
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart); d.setDate(gridStart.getDate() + i);
      const k = dayKey(d), evs = eventsOn(k), dues = dueOn(k), blocks = blocksOn(k);
      const dots = evs.slice(0, 3).map(o => `<i style="background:${ML.evColor(o.ev)}"></i>`).join('')
        + (dues.length ? `<i class="due-dot"></i>` : '') + (blocks.length ? `<i class="blk-dot"></i>` : '');
      cells += `<button type="button" class="cal-cell ${monthOf(k) !== C.month ? 'out' : ''} ${k === td ? 'today' : ''} ${k === C.sel ? 'sel' : ''}" data-day="${k}">
        <span>${d.getDate()}</span><span class="dots">${dots}</span></button>`;
    }
    const sel = parseDay(C.sel);
    const evs = eventsOn(C.sel), dues = dueOn(C.sel), blocks = blocksOn(C.sel);
    return `
      <div class="cal-grid">${wd.map(w => `<span class="cal-wd">${esc(w)}</span>`).join('')}${cells}</div>
      <div class="cal-day">
        <h3>${esc(sel.toLocaleDateString(loc(), { weekday: 'long', day: 'numeric', month: 'long' }))}</h3>
        ${evs.length ? `<ul class="ev-list">${evs.map(evRow).join('')}</ul>` : dues.length || blocks.length ? '' : `<p class="hint">${esc(t('day_empty'))}</p>`}
        ${duesHtml(dues)}
        ${dayFoot(C.sel, blocks)}
      </div>
      <div class="cal-up">
        <h3>${esc(t('upcoming'))}</h3>
        ${upcomingHtml()}
      </div>`;
  }
  const duesHtml = dues => dues.length ? `<p class="label">${esc(t('due_tasks'))}</p><ul class="ev-list">${dues.map(x => `<li style="--c:var(--warn)"><span class="ev-time">✓</span><span class="ev-title">${esc(ML.titleOf(x))}</span></li>`).join('')}</ul>` : '';
  const dayFoot = (k, blocks) => `<div class="cal-day-foot">
      ${blocks.length ? `<span class="hint">${esc(sumBlocks(blocks))}</span>` : '<span></span>'}
      <button type="button" class="ghost small" data-cal="plan" data-k="${k}">${esc(t('plan_this_day'))} →</button>
    </div>`;

  // Hour grid shared by the Day (one column) and Week (seven columns) views. Events open their form,
  // blocks open the Day planner, a tap on an empty spot starts a new event at that half hour.
  function timeGrid(days, hpx, withHead) {
    const td = today(), nm = nowMins(), H = 24 * hpx;
    const lay = ML.layoutItems || (x => x.map(it => Object.assign(it, { col: 0, ncol: 1 })));
    let hours = '';
    for (let h = 1; h < 24; h++) hours += `<div class="pl-hour" style="top:${h * hpx}px"><span>${ML.pad2(h)}:00</span></div>`;
    const cols = days.map(k => {
      const items = [];
      eventsOn(k).forEach(o => { if (o.start != null) items.push({ kind: 'ev', start: o.start, end: Math.min(o.end, 24 * 60), ev: o.ev }); });
      blocksOn(k).forEach(b => items.push({ kind: 'blk', start: b.start, end: b.start + b.mins, b }));
      lay(items);
      const html = items.map(it => {
        const top = it.start / 60 * hpx, h = Math.max(16, (it.end - it.start) / 60 * hpx), w = 100 / it.ncol;
        const style = `top:${top}px;height:${h}px;left:calc(${it.col * w}% + 1px);width:calc(${w}% - 3px)`;
        if (it.kind === 'ev') return `<div class="pl-ev cw-it ${h < 30 ? 'short' : ''}" role="button" tabindex="0" data-ev="${it.ev.id}" style="${style};--c:${ML.evColor(it.ev)}"><b>${esc(it.ev.title)}</b><span>${hm(it.start)}–${hm(it.end)}</span></div>`;
        const b = it.b, task = b.taskId && S.tasks.find(x => x.id === b.taskId);
        return `<div class="pl-blk cw-it ${h < 30 ? 'short' : ''} ${b.done || (task && task.done) ? 'done' : ''} ${b.color ? 'has-c' : ''}" role="button" tabindex="0" data-blkday="${k}" style="${style}${b.color ? `;--c:var(--ev-${b.color})` : ''}"><b>${esc(blockName(b))}</b><span>${hm(b.start)}–${hm(b.start + b.mins)}</span></div>`;
      }).join('');
      const past = k === td ? `<div class="pl-past" style="height:${nm / 60 * hpx}px"></div>` : k < td ? `<div class="pl-past" style="height:${H}px"></div>` : '';
      const now = k === td ? `<div class="pl-now cw-now" style="top:${nm / 60 * hpx}px"></div>` : '';
      return `<div class="cw-col ${k === td ? 'today' : ''}" data-slot="${k}">${past}${html}${now}</div>`;
    }).join('');
    const hasAllDay = days.some(k => eventsOn(k).some(o => o.start == null) || dueOn(k).length);
    const allDay = days.map(k => `<div class="cw-ad">${eventsOn(k).filter(o => o.start == null).map(o => `<button type="button" class="cw-adev" data-ev="${o.ev.id}" style="--c:${ML.evColor(o.ev)}">${esc(o.ev.title)}</button>`).join('')}${dueOn(k).map(x => `<span class="cw-adev due" title="${esc(t('due'))}">${esc(ML.titleOf(x))}</span>`).join('')}</div>`).join('');
    const head = withHead ? `<div class="cw-row cw-head"><span></span>${days.map(k => { const d = parseDay(k); return `<button type="button" class="cw-dh ${k === td ? 'today' : ''}" data-gday="${k}"><small>${esc(d.toLocaleDateString(loc(), { weekday: 'short' }))}</small><b>${d.getDate()}</b></button>`; }).join('')}</div>` : '';
    return `<div class="cw" style="--n:${days.length}">
      ${head}
      ${hasAllDay ? `<div class="cw-row cw-allday"><span></span>${allDay}</div>` : ''}
      <div class="cw-scroll" data-hpx="${hpx}"><div class="cw-row cw-body" style="height:${H}px">${hours}<span></span>${cols}</div></div>
    </div>`;
  }
  const dayHtml = k => `${timeGrid([k], 52, false)}
      ${dueOn(k).length || blocksOn(k).length ? `<div class="cal-day cal-day-mini">${dayFoot(k, blocksOn(k))}</div>` : `<div class="cal-day-foot cal-day-bare"><span></span><button type="button" class="ghost small" data-cal="plan" data-k="${k}">${esc(t('plan_this_day'))} →</button></div>`}`;
  // Week: an hour grid when there is room, else the seven days as a list (a container query picks one)
  function weekHtml(k) {
    const days = [...Array(7)].map((_, i) => addDays(weekStart(k), i)), td = today();
    const list = days.map(d => {
      const evs = eventsOn(d), dues = dueOn(d), blocks = blocksOn(d), dd = parseDay(d);
      const rows = evs.map(evRow).join('') + dues.map(x => `<li style="--c:var(--warn)"><span class="ev-time">${esc(t('due'))}</span><span class="ev-title">${esc(ML.titleOf(x))}</span></li>`).join('');
      const body = (rows ? `<ul class="ev-list">${rows}</ul>` : '')
        + (blocks.length ? `<button type="button" class="ghost small cw-ag-blk" data-cal="plan" data-k="${d}">${esc(sumBlocks(blocks))} →</button>` : '')
        || `<span class="hint cw-ag-none">${esc(t('day_empty'))}</span>`;
      return `<div class="cw-ag-day ${d === td ? 'today' : ''} ${d < td ? 'past' : ''}">
        <button type="button" class="cw-dh ${d === td ? 'today' : ''}" data-gday="${d}"><small>${esc(dd.toLocaleDateString(loc(), { weekday: 'short' }))}</small><b>${dd.getDate()}</b></button>
        <div class="cw-ag-body">${body}</div></div>`;
    }).join('');
    return `<div class="cal-wk"><div class="cw-wide">${timeGrid(days, 40, true)}</div><div class="cw-ag">${list}</div></div>`;
  }
  function evRow(o) {
    const ev = o.ev;
    return `<li style="--c:${ML.evColor(ev)}">
      <span class="ev-time"><button type="button" class="ev-dot" data-evc="${ev.id}" title="${esc(t('ev_color'))}" aria-label="${esc(t('ev_color'))}"></button>${o.start == null ? esc(t('ev_allday')) : hm(o.start) + '–' + hm(o.end)}</span>
      <button type="button" class="ev-title" data-ev="${ev.id}">${esc(ev.title)}${ev.repeat && ev.repeat !== 'none' ? ' ↻' : ''}${ev.remind ? ' ⏰' : ''}</button>
      ${ev.notes ? `<span class="ev-notes">${esc(ev.notes)}</span>` : ''}
    </li>`;
  }
  function upcomingHtml() {
    const td = today(), now = new Date(), nowM = now.getHours() * 60 + now.getMinutes();
    let html = '', count = 0;
    for (let i = 0; i < 14 && count < 25; i++) {
      const k = addDays(td, i);
      const evs = eventsOn(k).filter(o => i > 0 || o.end == null || o.end > nowM), dues = dueOn(k);
      if (!evs.length && !dues.length) continue;
      const label = i === 0 ? t('today') : i === 1 ? t('tomorrow') : parseDay(k).toLocaleDateString(ML.locale(), { weekday: 'short', day: 'numeric', month: 'short' });
      html += `<div class="up-day"><span class="label">${esc(label)}</span><ul class="ev-list">${evs.map(evRow).join('')}${dues.map(x => `<li style="--c:var(--warn)"><span class="ev-time">${esc(t('due'))}</span><span class="ev-title">${esc(ML.titleOf(x))}</span></li>`).join('')}</ul></div>`;
      count += evs.length + dues.length;
    }
    return html || `<p class="hint">${esc(t('nothing_upcoming'))}</p>`;
  }
  function formHtml() {
    const ev = editing === 'new' ? { title: '', date: S.cal.sel || today(), start: draftStart || '09:00', mins: 60, cat: 'class', repeat: 'none', remind: 15, notes: '' } : S.events.find(e => e.id === editing);
    if (!ev) { editing = null; return ''; }
    const opt = (vals, cur, pre) => vals.map(v => `<option value="${v}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(t(pre + v))}</option>`).join('');
    const durs = [15, 30, 45, 60, 90, 120, 180, 240];
    if (!durs.includes(ev.mins)) durs.push(ev.mins);
    return `<form class="ev-form" id="ev-form">
      <input type="text" name="title" value="${esc(ev.title)}" maxlength="100" required placeholder="${esc(t('ev_title_ph'))}">
      <div class="t-edit-row">
        <label><span>${esc(t('ev_date'))}</span><input type="date" name="date" value="${esc(ev.date)}" required></label>
        <label><span>${esc(t('ev_time'))}</span><input type="time" name="start" value="${esc(ev.start || '')}" step="300"></label>
        <label><span>${esc(t('duration'))}</span><select name="mins">${durs.sort((a, b) => a - b).map(d => `<option value="${d}" ${d === ev.mins ? 'selected' : ''}>${fmtMins(d)}</option>`).join('')}</select></label>
        <label class="opt"><input type="checkbox" name="allday" ${ev.start ? '' : 'checked'}> ${esc(t('ev_allday'))}</label>
      </div>
      <div class="t-edit-row">
        <label><span>${esc(t('ev_cat'))}</span><select name="cat">${opt(Object.keys(CATS), ev.cat, 'cat_')}</select></label>
        <label><span>${esc(t('repeat'))}</span><select name="repeat">${opt(['none', 'daily', 'weekdays', 'weekly', 'monthly'], ev.repeat || 'none', 'rep_')}</select></label>
        <label><span>${esc(t('ev_remind'))}</span><select name="remind">${opt([0, 5, 15, 30, 60, 1440], ev.remind || 0, 'rem_')}</select></label>
      </div>
      <fieldset class="ev-colors"><legend>${esc(t('ev_color'))}</legend>
        <label class="sw auto" title="${esc(t('ev_color_auto'))}"><input type="radio" name="color" value="" ${ev.color ? '' : 'checked'}><i style="--c:${slotVar(CAT_SLOT[ev.cat] || 3)}"></i><span>${esc(t('ev_color_auto'))}</span></label>
        ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<label class="sw" title="${n}"><input type="radio" name="color" value="${n}" ${ev.color === n ? 'checked' : ''}><i style="--c:${slotVar(n)}"></i></label>`).join('')}
      </fieldset>
      <textarea name="notes" rows="2" placeholder="${esc(t('ev_notes_ph'))}">${esc(ev.notes || '')}</textarea>
      <div class="t-edit-btns">
        ${editing !== 'new' ? `<button type="button" class="small ghost danger" id="ev-del">${esc(t('delete_event'))}</button>` : ''}
        <span class="grow"></span>
        <button type="button" class="small ghost" data-cal="cancel">${esc(t('cancel'))}</button>
        <button type="submit" class="small primary">${esc(t('save'))}</button>
      </div>
    </form>`;
  }

  /* ---------- Events ---------- */
  const root = $('calendar');
  // Hour grid: an event opens its form, a block opens the Day planner, an empty spot starts a new event there
  function gridHit(e) {
    const it = e.target.closest('.cw-it');
    if (it && it.dataset.ev) { editing = it.dataset.ev; draftStart = null; }
    else if (it && it.dataset.blkday) { ML.plannerGoto && ML.plannerGoto(it.dataset.blkday); return true; }
    else {
      const col = e.target.closest('[data-slot]'); if (!col) return false;
      const sc = col.closest('.cw-scroll'), hpx = +sc.dataset.hpx, r = col.getBoundingClientRect();
      const mins = Math.min(23 * 60 + 30, Math.max(0, Math.floor((e.clientY - r.top) / hpx * 2) * 30));
      S.cal.sel = col.dataset.slot; S.cal.month = monthOf(S.cal.sel);
      editing = 'new'; draftStart = hm(mins);
    }
    save(); render();
    root.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return true;
  }
  root.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.cw-it')) { e.preventDefault(); gridHit(e); }
  });
  root.addEventListener('click', e => {
    if (!e.target.closest('button') && gridHit(e)) return;
    const b = e.target.closest('button'); if (!b) return;
    const C = S.cal;
    if (b.dataset.calv) { C.view = b.dataset.calv; editing = null; save(); render(); return; }
    if (b.dataset.gday) { C.sel = b.dataset.gday; C.month = monthOf(C.sel); C.view = 'day'; save(); render(); return; }
    if (b.dataset.evc) { // the color dot cycles through the 8 colors
      const ev = S.events.find(x => x.id === b.dataset.evc); if (!ev) return;
      const cur = ev.color || CAT_SLOT[ev.cat] || 3; ev.color = (cur % 8) + 1;
      save(); render(); emit('events'); return;
    }
    if (b.dataset.day) { C.sel = b.dataset.day; if (monthOf(C.sel) !== C.month) C.month = monthOf(C.sel); }
    else if (b.dataset.cal === 'prev' || b.dataset.cal === 'next') {
      const dir = b.dataset.cal === 'next' ? 1 : -1, v = view();
      if (v === 'month') {
        const [y, m] = C.month.split('-').map(Number), d = new Date(y, m - 1 + dir, 1);
        C.month = dayKey(d).slice(0, 7);
      } else { C.sel = addDays(C.sel, dir * (v === 'week' ? 7 : 1)); C.month = monthOf(C.sel); }
    }
    else if (b.dataset.cal === 'today') { C.sel = today(); C.month = monthOf(C.sel); }
    else if (b.dataset.cal === 'new') { editing = 'new'; draftStart = null; }
    else if (b.dataset.cal === 'cancel') editing = null;
    else if (b.dataset.cal === 'plan') { ML.plannerGoto && ML.plannerGoto(b.dataset.k || C.sel); return; }
    else if (b.dataset.cal === 'export') { exportIcs(); return; }
    else if (b.dataset.ev) editing = b.dataset.ev;
    else if (b.id === 'ev-del') { S.events = S.events.filter(x => x.id !== editing); editing = null; toast(t('ev_deleted')); }
    else return;
    save(); render(); scheduleReminders();
    if (b.dataset.ev || b.dataset.cal === 'new') root.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  root.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      title: String(fd.get('title')).trim(), date: fd.get('date'), start: fd.get('allday') ? '' : (fd.get('start') || ''),
      mins: +fd.get('mins'), cat: fd.get('cat'), repeat: fd.get('repeat'), remind: +fd.get('remind'), notes: String(fd.get('notes') || '').trim(),
      color: +fd.get('color') || null,
    };
    if (!data.title || !data.date) return;
    if (editing === 'new') S.events.push(Object.assign({ id: uid() }, data));
    else Object.assign(S.events.find(x => x.id === editing), data);
    S.cal.sel = data.date; S.cal.month = monthOf(data.date);
    editing = null; save(); render(); scheduleReminders(); toast(t('ev_saved'));
    emit('events');
  });
  root.addEventListener('change', e => {
    if (e.target.id === 'ics-in') {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader(); rd.onload = () => importIcs(String(rd.result)); rd.readAsText(f);
    }
    if (e.target.name === 'cat') { const a = root.querySelector('.ev-colors .auto i'); if (a) a.style.setProperty('--c', slotVar(CAT_SLOT[e.target.value] || 3)); }
    if (e.target.name === 'allday') { const st = root.querySelector('.ev-form [name=start]'); if (st) st.disabled = e.target.checked; }
  });

  /* ---------- Reminders ---------- */
  function upcomingReminders(days) {
    const out = [], td = today();
    for (let i = 0; i <= days; i++) {
      const k = addDays(td, i);
      eventsOn(k).forEach(o => {
        const ev = o.ev; if (!ev.remind) return;
        const base = parseDay(k); base.setMinutes(o.start == null ? 9 * 60 : o.start);
        const when = base.getTime() - ev.remind * 60000;
        const key = ev.id + '@' + k;
        out.push({ key, when, startAt: base.getTime(), title: ev.title, body: o.start == null ? t('reminder_day', { title: ev.title }) : t('reminder', { title: ev.title, time: hm(o.start) }) });
      });
    }
    return out;
  }
  function checkReminders() {
    const now = Date.now();
    upcomingReminders(2).forEach(r => {
      if (now >= r.when && now < r.startAt + 5 * 60000 && !S.notified[r.key]) {
        S.notified[r.key] = now;
        toast(r.body, { ms: 7000 }); emit('chime');
        ML.notify(t('ev_remind'), r.body);
      }
    });
    const cutoff = now - 3 * 864e5;
    for (const k in S.notified) if (S.notified[k] < cutoff) delete S.notified[k];
    save();
  }
  function scheduleReminders() {
    if (!ML.IS_EXT) return;
    const now = Date.now();
    ML.bgSend({ type: 'reminders', list: upcomingReminders(7).filter(r => r.when > now && !S.notified[r.key]).slice(0, 40).map(r => ({ key: r.key, when: r.when, title: r.title, body: r.body })) });
  }

  /* ---------- .ics import / export ---------- */
  function parseIcsDate(v, params) {
    const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/.exec(v);
    if (!m) return null;
    const [, y, mo, d, h, mi, , z] = m;
    if (h == null || /VALUE=DATE/.test(params || '')) return { date: `${y}-${mo}-${d}`, start: '' };
    let dt = z ? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi)) : new Date(+y, +mo - 1, +d, +h, +mi);
    return { date: dayKey(dt), start: ML.pad2(dt.getHours()) + ':' + ML.pad2(dt.getMinutes()), ts: dt.getTime() };
  }
  // opts.src (extras.js, a calendar link refreshed on its own): that feed's previous events are replaced, quietly
  function importIcs(text, opts = {}) {
    if (opts.src) S.events = S.events.filter(e => e.src !== opts.src);
    const lines = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
    const found = []; let cur = null;
    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') cur = {};
      else if (line === 'END:VEVENT') { if (cur) found.push(cur); cur = null; }
      else if (cur) {
        const i = line.indexOf(':'); if (i < 0) continue;
        const left = line.slice(0, i), val = line.slice(i + 1), [name, ...params] = left.split(';');
        cur[name] = { val, params: params.join(';') };
      }
    }
    const unesc = s => s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1');
    const cutoff = addDays(today(), -60);
    let n = 0;
    for (const v of found) {
      if (!v.DTSTART || !v.SUMMARY) continue;
      const st = parseIcsDate(v.DTSTART.val, v.DTSTART.params); if (!st) continue;
      let mins = 60;
      if (v.DTEND) { const en = parseIcsDate(v.DTEND.val, v.DTEND.params); if (en && en.ts && st.ts) mins = Math.max(15, Math.round((en.ts - st.ts) / 60000)); }
      else if (v.DURATION) { const dm = /PT?(?:(\d+)H)?(?:(\d+)M)?/.exec(v.DURATION.val); if (dm) mins = (+(dm[1] || 0)) * 60 + (+(dm[2] || 0)) || 60; }
      let repeat = 'none', until = null;
      if (v.RRULE) {
        const r = v.RRULE.val;
        if (/FREQ=DAILY/.test(r)) repeat = 'daily';
        else if (/FREQ=WEEKLY/.test(r)) repeat = /BYDAY=MO,TU,WE,TH,FR(;|$)/.test(r) ? 'weekdays' : 'weekly';
        else if (/FREQ=MONTHLY/.test(r)) repeat = 'monthly';
        const um = /UNTIL=(\d{8})/.exec(r); if (um) until = `${um[1].slice(0, 4)}-${um[1].slice(4, 6)}-${um[1].slice(6, 8)}`;
      }
      if (repeat === 'none' && st.date < cutoff) continue;
      if (until && until < cutoff) continue;
      const uidV = v.UID ? v.UID.val : null;
      if (uidV && S.events.some(e => e.uid === uidV)) continue;
      const ev = { id: uid(), uid: uidV, title: unesc(v.SUMMARY.val).slice(0, 100), date: st.date, start: st.start, mins: st.start ? mins : 60, cat: 'class', repeat, until, remind: 0, notes: v.LOCATION ? unesc(v.LOCATION.val).slice(0, 140) : '' };
      if (opts.src) ev.src = opts.src;
      S.events.push(ev);
      n++;
    }
    save(); render(); scheduleReminders();
    if (!opts.quiet) toast(n ? t('imported', { n }) : t('import_none'));
    return n;
  }
  ML.importIcs = importIcs;
  function exportIcs() {
    const stamp = d => d.replace(/-/g, '');
    const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MerlinsLockIN//FR'];
    S.events.forEach(ev => {
      out.push('BEGIN:VEVENT', 'UID:' + (ev.uid || ev.id + '@merlinslockin'), 'SUMMARY:' + ev.title.replace(/([,;\\])/g, '\\$1'));
      if (ev.start) {
        const s = parseDay(ev.date); s.setMinutes(toMins(ev.start)); const e2 = new Date(s.getTime() + ev.mins * 60000);
        const f = d => dayKey(d).replace(/-/g, '') + 'T' + ML.pad2(d.getHours()) + ML.pad2(d.getMinutes()) + '00';
        out.push('DTSTART:' + f(s), 'DTEND:' + f(e2));
      } else out.push('DTSTART;VALUE=DATE:' + stamp(ev.date));
      const fr = { daily: 'FREQ=DAILY', weekdays: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', weekly: 'FREQ=WEEKLY', monthly: 'FREQ=MONTHLY' }[ev.repeat];
      if (fr) out.push('RRULE:' + fr + (ev.until ? ';UNTIL=' + stamp(ev.until) : ''));
      if (ev.notes) out.push('LOCATION:' + ev.notes.replace(/([,;\\])/g, '\\$1'));
      out.push('END:VEVENT');
    });
    out.push('END:VCALENDAR');
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([out.join('\r\n')], { type: 'text/calendar' }));
      a.download = 'merlinslockin.ics'; document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { toast(t('backup_file_fail')); }
  }

  on('render', () => { if (S.tab === 'cal') ML.keepInputs($('calendar'), render); }); // a sync must not wipe the event being typed
  on('tab', name => { if (name === 'cal') render(); });
  on('minute', checkReminders);
  on('started', () => { checkReminders(); scheduleReminders(); });
  on('newday', () => scheduleReminders());
  ML.renderCalendar = render;
})();
