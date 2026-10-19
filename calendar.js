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
      delete_event: 'Supprimer l’événement',
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
      delete_event: 'Delete event',
    },
  });

  // Colors are 8 slots whose exact shade comes from the theme (vivid neon when fired up, softer otherwise), see --ev-N in app.css.
  // Each category has a default slot; an event can pick its own.
  const CAT_SLOT = { class: 2, study: 8, work: 1, perso: 3, meal: 7, sport: 4, social: 5, deadline: 6 };
  const slotVar = n => `var(--ev-${n})`;
  const CATS = Object.fromEntries(Object.entries(CAT_SLOT).map(([k, n]) => [k, slotVar(n)]));
  ML.CATS = CATS;
  ML.evColor = ev => slotVar(ev.color || CAT_SLOT[ev.cat] || CAT_SLOT.perso);
  ML.defaults(() => ({ events: [], notified: {}, cal: { month: null, sel: null } }));

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
  const monthOf = k => k.slice(0, 7);
  function render() {
    const root = $('calendar'); if (!root) return;
    const C = S.cal;
    if (!C.sel) C.sel = today();
    if (!C.month) C.month = monthOf(C.sel);
    const [y, m] = C.month.split('-').map(Number);
    const first = new Date(y, m - 1, 1), startDow = (first.getDay() + 6) % 7;
    const gridStart = new Date(y, m - 1, 1 - startDow);
    const td = today();
    const wd = [...Array(7)].map((_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(ML.locale(), { weekday: 'narrow' }));
    let cells = '';
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart); d.setDate(gridStart.getDate() + i);
      const k = dayKey(d), evs = eventsOn(k), dues = dueOn(k), blocks = (S.blocks || []).filter(b => b.date === k);
      const dots = evs.slice(0, 3).map(o => `<i style="background:${ML.evColor(o.ev)}"></i>`).join('')
        + (dues.length ? `<i class="due-dot"></i>` : '') + (blocks.length ? `<i class="blk-dot"></i>` : '');
      cells += `<button type="button" class="cal-cell ${monthOf(k) !== C.month ? 'out' : ''} ${k === td ? 'today' : ''} ${k === C.sel ? 'sel' : ''}" data-day="${k}">
        <span>${d.getDate()}</span><span class="dots">${dots}</span></button>`;
    }
    const sel = parseDay(C.sel);
    const evs = eventsOn(C.sel), dues = dueOn(C.sel), blocks = (S.blocks || []).filter(b => b.date === C.sel);
    root.innerHTML = `
      <div class="cal-head">
        <button type="button" class="ghost icon-only" data-cal="prev" aria-label="‹">‹</button>
        <h3>${esc(first.toLocaleDateString(ML.locale(), { month: 'long', year: 'numeric' }))}</h3>
        <button type="button" class="ghost icon-only" data-cal="next" aria-label="›">›</button>
        <span class="grow"></span>
        <button type="button" class="ghost small" data-cal="today">${esc(t('today_btn'))}</button>
        <button type="button" class="primary small" data-cal="new">+ ${esc(t('new_event'))}</button>
      </div>
      ${editing ? formHtml() : ''}
      <div class="cal-grid">${wd.map(w => `<span class="cal-wd">${esc(w)}</span>`).join('')}${cells}</div>
      <div class="cal-day">
        <h3>${esc(sel.toLocaleDateString(ML.locale(), { weekday: 'long', day: 'numeric', month: 'long' }))}</h3>
        ${evs.length ? `<ul class="ev-list">${evs.map(evRow).join('')}</ul>` : `<p class="hint">${esc(t('day_empty'))}</p>`}
        ${dues.length ? `<p class="label">${esc(t('due_tasks'))}</p><ul class="ev-list">${dues.map(x => `<li><span class="ev-time">✓</span><span class="ev-title">${esc(ML.titleOf(x))}</span></li>`).join('')}</ul>` : ''}
        <div class="cal-day-foot">
          ${blocks.length ? `<span class="hint">${esc(tn('blocks_planned', blocks.length, { m: fmtMins(blocks.reduce((a, b) => a + b.mins, 0)) }))}</span>` : '<span></span>'}
          <button type="button" class="ghost small" data-cal="plan">${esc(t('plan_this_day'))} →</button>
        </div>
      </div>
      <div class="cal-up">
        <h3>${esc(t('upcoming'))}</h3>
        ${upcomingHtml()}
      </div>
      <div class="cal-ics">
        <p class="hint">${esc(t('ics_hint'))}</p>
        <label class="file-btn small">${esc(t('import_ics'))}<input type="file" id="ics-in" accept=".ics,text/calendar"></label>
        ${ML.CAN_DOWNLOAD ? `<button type="button" class="ghost small" data-cal="export">${esc(t('export_ics'))}</button>` : ''}
      </div>`;
    const f = root.querySelector('.ev-form [name=title]'); if (f && !f.value) f.focus();
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
    const ev = editing === 'new' ? { title: '', date: S.cal.sel || today(), start: '09:00', mins: 60, cat: 'class', repeat: 'none', remind: 15, notes: '' } : S.events.find(e => e.id === editing);
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
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const C = S.cal;
    if (b.dataset.evc) { // the color dot cycles through the 8 colors
      const ev = S.events.find(x => x.id === b.dataset.evc); if (!ev) return;
      const cur = ev.color || CAT_SLOT[ev.cat] || 3; ev.color = (cur % 8) + 1;
      save(); render(); emit('events'); return;
    }
    if (b.dataset.day) { C.sel = b.dataset.day; if (monthOf(C.sel) !== C.month) C.month = monthOf(C.sel); }
    else if (b.dataset.cal === 'prev' || b.dataset.cal === 'next') {
      const [y, m] = C.month.split('-').map(Number), d = new Date(y, m - 1 + (b.dataset.cal === 'next' ? 1 : -1), 1);
      C.month = dayKey(d).slice(0, 7);
    }
    else if (b.dataset.cal === 'today') { C.sel = today(); C.month = monthOf(C.sel); }
    else if (b.dataset.cal === 'new') editing = 'new';
    else if (b.dataset.cal === 'cancel') editing = null;
    else if (b.dataset.cal === 'plan') { ML.plannerGoto && ML.plannerGoto(C.sel); return; }
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
  function importIcs(text) {
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
      S.events.push({ id: uid(), uid: uidV, title: unesc(v.SUMMARY.val).slice(0, 100), date: st.date, start: st.start, mins: st.start ? mins : 60, cat: 'class', repeat, until, remind: 0, notes: v.LOCATION ? unesc(v.LOCATION.val).slice(0, 140) : '' });
      n++;
    }
    save(); render(); scheduleReminders();
    toast(n ? t('imported', { n }) : t('import_none'));
  }
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

  on('render', () => { if (S.tab === 'cal') render(); });
  on('tab', name => { if (name === 'cal') render(); });
  on('minute', checkReminders);
  on('started', () => { checkReminders(); scheduleReminders(); });
  on('newday', () => scheduleReminders());
  ML.renderCalendar = render;
})();
