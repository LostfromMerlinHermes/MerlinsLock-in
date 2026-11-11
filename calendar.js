// Calendar tab (Agenda): the week on the shared hour grid (daygrid.js), the month grid with the chosen day and what's
// upcoming, events (repeats, reminders), .ics import/export. A day opens in the Journée, the one Day view (3.78).
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
      due_tasks: 'Tâches à rendre', plan_this_day: 'Ouvrir dans la vue Jour', blocks_planned_one: '{n} bloc planifié ({m})', blocks_planned: '{n} blocs planifiés ({m})',
      import_ics: 'Importer un .ics', export_ics: 'Exporter en .ics', ics_hint: 'Exporte ton agenda Google ou Outlook en fichier .ics, puis importe-le ici.',
      imported: '{n} événement(s) importé(s)', import_none: 'Aucun événement trouvé dans ce fichier.', reminder: 'Rappel : {title} à {time}', reminder_day: 'Demain : {title}',
      delete_event: 'Supprimer l’événement', cal_v_day: 'Jour', cal_v_week: 'Semaine', cal_v_month: 'Mois', ev_repeats: 'Se répète', ev_reminds: 'Avec rappel',
    },
    en: {
      new_event: 'Event', today_btn: 'Today', upcoming: 'Upcoming', nothing_upcoming: 'Nothing planned in the next 14 days.',
      ev_title_ph: 'Title (class, appointment, exam…)', ev_date: 'Date', ev_time: 'Time', ev_allday: 'All day', ev_cat: 'Category', ev_remind: 'Reminder', ev_notes_ph: 'Place, notes…',
      cat_class: 'Class', cat_study: 'Study', cat_work: 'Work', cat_perso: 'Personal', cat_meal: 'Meal', cat_sport: 'Sport', cat_social: 'Social', cat_deadline: 'Deadline',
      ev_color: 'Color', ev_color_auto: 'Auto',
      rem_0: 'None', rem_5: '5 min before', rem_15: '15 min before', rem_30: '30 min before', rem_60: '1 h before', rem_1440: 'The day before',
      rep_none: 'Once', rep_daily: 'Daily', rep_weekdays: 'Weekdays', rep_weekly: 'Weekly', rep_monthly: 'Monthly',
      ev_saved: 'Event saved', ev_deleted: 'Event deleted', day_empty: 'Nothing that day.',
      due_tasks: 'Tasks due', plan_this_day: 'Open in the Day view', blocks_planned_one: '{n} block planned ({m})', blocks_planned: '{n} blocks planned ({m})',
      import_ics: 'Import .ics', export_ics: 'Export .ics', ics_hint: 'Export your Google or Outlook calendar as an .ics file, then import it here.',
      imported: '{n} event(s) imported', import_none: 'No events found in that file.', reminder: 'Reminder: {title} at {time}', reminder_day: 'Tomorrow: {title}',
      delete_event: 'Delete event', cal_v_day: 'Day', cal_v_week: 'Week', cal_v_month: 'Month', ev_repeats: 'Repeats', ev_reminds: 'With a reminder',
    },
  });

  // Colors are 8 slots whose exact shade comes from the theme (vivid neon when fired up, softer otherwise), see --ev-N in app.css.
  // Each category has a default slot; an event can pick its own.
  const CAT_SLOT = { class: 2, study: 8, work: 1, perso: 3, meal: 7, sport: 4, social: 5, deadline: 6 };
  const slotVar = n => `var(--ev-${n})`;
  const CATS = Object.fromEntries(Object.entries(CAT_SLOT).map(([k, n]) => [k, slotVar(n)]));
  ML.CATS = CATS;
  ML.evColor = ev => slotVar(ev.color || CAT_SLOT[ev.cat] || CAT_SLOT.perso);
  ML.defaults(() => ({ events: [], notified: {}, cal: { month: null, sel: null, view: 'week', disp: {}, hFrom: 7, hTo: 23, push: true, wide: false } }));

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
  const monthOf = k => k.slice(0, 7);
  // One Calendar with three views (3.82): Day is the old Journée (planner.js, tab "day"), Week and Month live here (tab "cal")
  const VIEWS = ['day', 'week', 'month'];
  const view = () => S.cal.view === 'month' ? 'month' : 'week';
  const viewNow = () => (S.tab === 'day' ? 'day' : view());
  const weekStart = k => addDays(k, -((parseDay(k).getDay() + 6) % 7));
  const weekDays = () => [...Array(7)].map((_, i) => addDays(weekStart(S.cal.sel || today()), i));
  const loc = () => ML.locale();
  const blocksOn = k => (S.blocks || []).filter(b => b.date === k);
  const sumBlocks = blocks => tn('blocks_planned', blocks.length, { m: fmtMins(blocks.reduce((a, b) => a + b.mins, 0)) });
  const viewsSeg = () => `<div class="seg-toggle cal-views" role="group" aria-label="${esc(t('tab_cal'))}">${VIEWS.map(k => `<button type="button" data-calv="${k}" aria-pressed="${k === viewNow()}">${esc(t('cal_v_' + k))}</button>`).join('')}</div>`;
  ML.calViewsSeg = viewsSeg;
  function setCalView(v) {
    if (v === 'day') { if (S.tab !== 'day') ML.plannerGoto(S.cal.sel || today()); return; }
    if (S.tab === 'day') { S.cal.sel = (S.planner && S.planner.date) || today(); S.cal.month = monthOf(S.cal.sel); } // the week or month of the day on screen
    S.cal.view = v; save();
    if (S.tab !== 'cal') ML.setTab('cal'); else { $('calendar').innerHTML = ''; render(); }
  }
  $('planner').addEventListener('click', e => { const b = e.target.closest('[data-calv]'); if (b) setCalView(b.dataset.calv); });

  ML.dgHost('week', {
    view: 'week',
    el: () => $('cal-dg'),
    visible: () => S.tab === 'cal' && view() === 'week',
    days: weekDays,
    focus: () => S.cal.sel || today(),
    title: () => {
      const ws = weekStart(S.cal.sel || today()), a = parseDay(ws), b = parseDay(addDays(ws, 6));
      if (a.getMonth() === b.getMonth()) return a.getDate() + '–' + b.toLocaleDateString(loc(), { day: 'numeric', month: 'long', year: 'numeric' });
      return a.toLocaleDateString(loc(), { day: 'numeric', month: 'short' }) + ' – ' + b.toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' });
    },
    showToday: () => !weekDays().includes(today()),
    nav: dir => { S.cal.sel = addDays(S.cal.sel || today(), dir * 7); S.cal.month = monthOf(S.cal.sel); },
    goToday: () => { S.cal.sel = today(); S.cal.month = monthOf(S.cal.sel); },
    goDay: k => ML.plannerGoto(k),
    autoPlan: weekAutoPlan,
    autoLabel: () => t('dg_autoweek'),
    defaultKind: 'ev',
    extraHead: viewsSeg,
  });
  // Auto-plan the week: each open task not placed this week goes to the first day (from today) with a free slot
  function weekAutoPlan() {
    const td = today(), days = weekDays().filter(k => k >= td), nm = new Date().getHours() * 60 + new Date().getMinutes();
    const placed = new Set((S.blocks || []).filter(b => weekDays().includes(b.date) && b.taskId).map(b => b.taskId));
    let n = 0;
    ML.orderedOpen().filter(x => !placed.has(x.id)).forEach(x => {
      const mins = x.mins || 30;
      for (const k of days.filter(d => !x.due || d <= x.due).concat(days.filter(d => x.due && d > x.due))) {
        const s = ML.dg.nextFree(k, Math.max(S.planner.startH * 60, k === td ? nm : 0), mins);
        if (s != null) { ML.dg.addBlock(k, s, mins, x.id); n++; break; }
      }
    });
    save(); emit('blocks'); render();
    toast(n ? tn('planned_n', n) : t('no_slot'));
  }

  function render() {
    const root = $('calendar'); if (!root) return;
    const C = S.cal, v = view();
    if (!C.sel) C.sel = today();
    if (!C.month) C.month = monthOf(C.sel);
    const ics = `<div class="cal-ics">
        <p class="hint">${esc(t('ics_hint'))}</p>
        <label class="file-btn small">${esc(t('import_ics'))}<input type="file" id="ics-in" accept=".ics,text/calendar"></label>
        ${ML.CAN_DOWNLOAD ? `<button type="button" class="ghost small" data-cal="export">${esc(t('export_ics'))}</button>` : ''}
      </div>`;
    if (v === 'week') {
      if (!$('cal-dg')) root.innerHTML = `<div id="cal-dg"></div>${ics}`;
      ML.dgRender('week');
      return;
    }
    const [y, m] = C.month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    root.innerHTML = `
      <div class="dg-top cal-mhead">
        <button type="button" class="ghost icon-only dg-ib" data-cal="prev" aria-label="‹">${ML.dgIcon('l')}</button>
        <h3 class="dg-title">${esc(first.toLocaleDateString(loc(), y === new Date().getFullYear() ? { month: 'long' } : { month: 'long', year: 'numeric' }))}</h3>
        <button type="button" class="ghost icon-only dg-ib" data-cal="next" aria-label="›">${ML.dgIcon('r')}</button>
        ${monthOf(today()) !== C.month ? `<button type="button" class="ghost small" data-cal="today">${esc(t('today_btn'))}</button>` : ''}
        <span class="grow"></span>
        ${viewsSeg()}
        <button type="button" class="primary small dg-add" data-cal="new" aria-label="${esc(t('dg_add'))}">${ML.dgIcon('plus')}<span>${esc(t('dg_add'))}</span></button>
      </div>
      ${monthHtml(C, y, m, first)}
      ${ics}`;
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
        ${evs.length ? `<ul class="ev-list">${evs.map(o => evRow(o, C.sel)).join('')}</ul>` : dues.length || blocks.length ? '' : `<p class="hint">${esc(t('day_empty'))}</p>`}
        ${duesHtml(dues)}
        <div class="cal-day-foot">
          ${blocks.length ? `<span class="hint">${esc(sumBlocks(blocks))}</span>` : '<span></span>'}
          <button type="button" class="ghost small" data-cal="plan" data-k="${C.sel}">${esc(t('plan_this_day'))} →</button>
        </div>
      </div>
      <div class="cal-up">
        <h3>${esc(t('upcoming'))}</h3>
        ${upcomingHtml()}
      </div>`;
  }
  const duesHtml = dues => dues.length ? `<p class="label">${esc(t('due_tasks'))}</p><ul class="ev-list">${dues.map(x => `<li style="--c:var(--warn)"><span class="ev-time">${esc(t('dg_due'))}</span><span class="ev-title">${esc(ML.titleOf(x))}</span></li>`).join('')}</ul>` : '';
  // An event row: its color, its time, a small mark for repeats and reminders; a tap opens the shared form
  function evRow(o, k) {
    const ev = o.ev, marks = (ev.repeat && ev.repeat !== 'none' ? `<span class="ev-mk" title="${esc(t('ev_repeats'))}">${ML.dgIcon('rep')}</span>` : '') + (ev.remind ? `<span class="ev-mk" title="${esc(t('ev_reminds'))}">${ML.dgIcon('bell')}</span>` : '');
    return `<li style="--c:${ML.evColor(ev)}">
      <span class="ev-time"><i class="ev-dot" aria-hidden="true"></i>${o.start == null ? esc(t('ev_allday')) : hm(o.start) + '–' + hm(o.end)}</span>
      <button type="button" class="ev-title" data-kind="ev" data-id="${ev.id}" data-k="${k}" data-open="1">${esc(ev.title)}${marks}</button>
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
      html += `<div class="up-day"><span class="label">${esc(label)}</span><ul class="ev-list">${evs.map(o => evRow(o, k)).join('')}${dues.map(x => `<li style="--c:var(--warn)"><span class="ev-time">${esc(t('dg_due'))}</span><span class="ev-title">${esc(ML.titleOf(x))}</span></li>`).join('')}</ul></div>`;
      count += evs.length + dues.length;
    }
    return html || `<p class="hint">${esc(t('nothing_upcoming'))}</p>`;
  }

  /* ---------- Events ---------- */
  const root = $('calendar');
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const C = S.cal;
    if (b.dataset.calv) { setCalView(b.dataset.calv); return; }
    if (b.dataset.day) { C.sel = b.dataset.day; if (monthOf(C.sel) !== C.month) C.month = monthOf(C.sel); }
    else if (b.dataset.cal === 'prev' || b.dataset.cal === 'next') {
      const [y, m] = C.month.split('-').map(Number), d = new Date(y, m - 1 + (b.dataset.cal === 'next' ? 1 : -1), 1);
      C.month = dayKey(d).slice(0, 7);
    }
    else if (b.dataset.cal === 'today') { C.sel = today(); C.month = monthOf(C.sel); }
    else if (b.dataset.cal === 'new') { ML.dgNew({ kind: 'ev', k: C.sel }); return; }
    else if (b.dataset.cal === 'plan') { ML.plannerGoto && ML.plannerGoto(b.dataset.k || C.sel); return; }
    else if (b.dataset.cal === 'export') { exportIcs(); return; }
    else return;
    save(); render();
  });
  root.addEventListener('change', e => {
    if (e.target.id === 'ics-in') {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader(); rd.onload = () => importIcs(String(rd.result)); rd.readAsText(f);
    }
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
  ML.scheduleReminders = scheduleReminders;
})();
