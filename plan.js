// Plan tab (3.35, redone in 3.50 from proposals/plan-v2): the task list in ready-made views (Today, Upcoming,
// Projects, All), pinned tasks on top (the first one is the task of the day), chips under the add field (project, date,
// duration, priority, pin) that also light up from what is typed ("Réviser maths 45m demain ! #Partiels"), "+ Add" at
// the bottom of each group, a table edited in place (columns to choose), several tasks selected at once, a projects
// column on wide panels with a project page, drag to reorder. app.js still draws each list row (taskHtml) and handles
// its buttons; this file arranges the rows (ML.planRender). plantools.js adds "Plan my day" and the keyboard.
// Scattered's single card is untouched.
(() => {
  'use strict';
  const { S, t, esc, on, emit, $, today, addDays, fmtMins } = ML;
  const save = () => ML.save();

  ML.addStrings({
    fr: {
      pl_list: 'Liste', pl_table: 'Tableau', pl_group: 'Grouper', pl_sort: 'Trier', pl_all: 'Toutes',
      pl_g_moment: 'Moment', pl_g_project: 'Projet', pl_g_pri: 'Priorité', pl_g_none: 'Aucun',
      pl_s_energy: 'Suggéré', pl_s_due: 'Date', pl_s_mins: 'Durée', pl_s_pri: 'Priorité', pl_s_added: 'Ajout', pl_s_xp: 'XP', pl_s_spent: 'Temps passé', pl_s_manual: 'À la main',
      pl_m_today: 'Aujourd’hui', pl_m_week: 'Cette semaine', pl_m_nodate: 'Sans date', pl_m_later: 'Plus tard', pl_m_done: 'Terminées', pl_m_late: 'En retard',
      pl_v_today: 'Aujourd’hui', pl_v_upcoming: 'À venir', pl_v_projects: 'Projets', pl_v_all: 'Toutes', pl_views: 'Vues', pl_v_inbox: 'À trier', pl_v_next: 'Prochaine',
      pl_noproj: 'Sans projet', pl_late: '{n} en retard', pl_week_h: '{h} cette semaine',
      pl_day: 'Tâche du jour', pl_pin: 'Épingler', pl_unpin: 'Désépingler', pl_pinned: 'Épinglées', pl_pin_max: 'Maximum {n} tâches épinglées.', pl_drag: 'Glisser pour déplacer',
      pl_project: 'Projet', pl_qa_tip: 'Astuce : écris tout d’un coup, par exemple « Réviser maths 45m demain ! #Partiels »',
      pl_th_task: 'Tâche', pl_th_due: 'Date', pl_th_mins: 'Durée', pl_th_pri: 'Prio.', pl_th_added: 'Ajoutée', pl_th_spent: 'Passé', pl_th_steps: 'Étapes',
      pl_manual_on: 'Tri à la main : l’ordre que tu choisis est gardé.', pl_unpinned: 'Tâche désépinglée.',
      pl_c_date: 'Date', pl_c_pin: 'Épingler', pl_add_in: '+ Ajouter dans {g}', pl_add_pin: '+ Ajouter une tâche épinglée',
      pl_d_today: 'Aujourd’hui', pl_d_tomorrow: 'Demain', pl_d_weekend: 'Ce week-end', pl_d_nextweek: 'Semaine prochaine', pl_d_none: 'Sans date', pl_d_pick: 'Choisir',
      pl_p_none: 'Aucun projet', pl_p_new: 'Nouveau projet', pl_p_new_ph: 'Nom du projet', pl_m_custom: 'Autre (ex. 50m, 1h20)', pl_ok: 'OK',
      pl_display: 'Affichage', pl_cols: 'Colonnes', pl_search: 'Chercher', pl_select: 'Sélectionner', pl_prep: 'Préparer ma journée',
      pl_sel_n: '{n} sélectionnée(s)', pl_sel_all: 'Tout', pl_sel_done: 'Terminer', pl_sel_del: 'Supprimer', pl_sel_sure: 'Confirmer ?', pl_cancel: 'Annuler', pl_sel_hint: 'Touche les tâches à sélectionner.',
      pl_rename: 'Renommer', pl_edit_full: 'Tout modifier', pl_empty_today: 'Rien de prévu aujourd’hui.', pl_empty_hint: 'Ajoute une tâche, ou choisis-en dans toutes tes tâches.', pl_see_all: 'Voir toutes',
      pl_nodate_n: '{n} sans date', pl_side_new: '+ Projet', pl_proj_note: 'Note du projet', pl_proj_due: 'Échéance', pl_proj_left: 'dans {n} j', pl_proj_today: 'aujourd’hui', pl_proj_past: 'passée',
      pl_proj_prog: '{d} / {n} finies', pl_proj_del: 'Retirer le projet', pl_proj_deleted: 'Projet retiré (les tâches restent).', pl_no_match: 'Aucune tâche ne correspond.',
    },
    en: {
      pl_list: 'List', pl_table: 'Table', pl_group: 'Group', pl_sort: 'Sort', pl_all: 'All',
      pl_g_moment: 'Moment', pl_g_project: 'Project', pl_g_pri: 'Priority', pl_g_none: 'None',
      pl_s_energy: 'Suggested', pl_s_due: 'Date', pl_s_mins: 'Duration', pl_s_pri: 'Priority', pl_s_added: 'Added', pl_s_xp: 'XP', pl_s_spent: 'Time spent', pl_s_manual: 'By hand',
      pl_m_today: 'Today', pl_m_week: 'This week', pl_m_nodate: 'No date', pl_m_later: 'Later', pl_m_done: 'Done', pl_m_late: 'Late',
      pl_v_today: 'Today', pl_v_upcoming: 'Upcoming', pl_v_projects: 'Projects', pl_v_all: 'All', pl_views: 'Views', pl_v_inbox: 'Inbox', pl_v_next: 'Next',
      pl_noproj: 'No project', pl_late: '{n} late', pl_week_h: '{h} this week',
      pl_day: 'Task of the day', pl_pin: 'Pin', pl_unpin: 'Unpin', pl_pinned: 'Pinned', pl_pin_max: 'At most {n} pinned tasks.', pl_drag: 'Drag to move',
      pl_project: 'Project', pl_qa_tip: 'Tip: type it all at once, for example "Revise maths 45m tomorrow ! #Exams"',
      pl_th_task: 'Task', pl_th_due: 'Date', pl_th_mins: 'Time', pl_th_pri: 'Prio.', pl_th_added: 'Added', pl_th_spent: 'Spent', pl_th_steps: 'Steps',
      pl_manual_on: 'Sorted by hand: the order you choose is kept.', pl_unpinned: 'Task unpinned.',
      pl_c_date: 'Date', pl_c_pin: 'Pin', pl_add_in: '+ Add to {g}', pl_add_pin: '+ Add a pinned task',
      pl_d_today: 'Today', pl_d_tomorrow: 'Tomorrow', pl_d_weekend: 'This weekend', pl_d_nextweek: 'Next week', pl_d_none: 'No date', pl_d_pick: 'Pick',
      pl_p_none: 'No project', pl_p_new: 'New project', pl_p_new_ph: 'Project name', pl_m_custom: 'Other (e.g. 50m, 1h20)', pl_ok: 'OK',
      pl_display: 'Display', pl_cols: 'Columns', pl_search: 'Search', pl_select: 'Select', pl_prep: 'Plan my day',
      pl_sel_n: '{n} selected', pl_sel_all: 'All', pl_sel_done: 'Complete', pl_sel_del: 'Delete', pl_sel_sure: 'Confirm?', pl_cancel: 'Cancel', pl_sel_hint: 'Tap the tasks to select.',
      pl_rename: 'Rename', pl_edit_full: 'Edit all', pl_empty_today: 'Nothing planned for today.', pl_empty_hint: 'Add a task, or pick some from all your tasks.', pl_see_all: 'See all',
      pl_nodate_n: '{n} without a date', pl_side_new: '+ Project', pl_proj_note: 'Project note', pl_proj_due: 'Deadline', pl_proj_left: 'in {n} d', pl_proj_today: 'today', pl_proj_past: 'passed',
      pl_proj_prog: '{d} / {n} done', pl_proj_del: 'Remove the project', pl_proj_deleted: 'Project removed (the tasks stay).', pl_no_match: 'No task matches.',
    },
  });
  // plan: view (list / table), pview (today / upcoming / projects / all), grouping and sort used by "All" (+ direction),
  // project filter, folded groups, table columns, projects created before they have tasks, project notes and deadlines
  ML.defaults(() => ({ plan: { view: 'list', pview: 'all', group: 'moment', sort: 'energy', dir: 1, proj: '', fold: {}, day: null, cols: ['project', 'due', 'mins', 'pri'], plist: [], pnotes: {}, pdue: {} } }));
  const P = () => S.plan;
  const PRI = { high: 0, med: 1, low: 2 };
  const reduced = () => ML.reducedMotion();

  /* ---------- Projects ---------- */
  const byName = (a, b) => a.localeCompare(b, ML.locale(), { sensitivity: 'base' });
  ML.planProjects = () => [...new Set([...S.tasks.map(x => x.project).filter(Boolean), ...((S.plan && S.plan.plist) || [])])].sort(byName);
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const projColor = name => `var(--ev-${hash(name.toLowerCase()) % 8 + 1})`;
  ML.projChip = name => `<span class="chip proj" style="--pc:${projColor(name)}"><i></i>${esc(name)}</span>`;
  const projDot = name => `<i class="pl-dot" style="--pc:${projColor(name)}"></i>`;
  function weekStartMs() { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }
  // Minutes spent this week (since Monday) on a project's tasks, from the session log
  function weekMins(proj) {
    const from = weekStartMs(), ids = new Set(S.tasks.filter(x => x.project === proj).map(x => x.id));
    return S.sessions.filter(s => s.at >= from && ids.has(s.taskId)).reduce((a, s) => a + (s.mins || 0), 0);
  }
  ML.planWeekMins = weekMins;

  /* ---------- One-line quick add ---------- */
  const DAYS = { fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'], en: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] };
  // Reads a duration (45m, 45 min, 1h, 1h30), a day (today/aujourd'hui, demain/tomorrow, après-demain, a weekday, 12/11),
  // "!" for high priority and #project; what's left is the title. Returns only what it found.
  function parseQuick(raw) {
    const out = {}, td = today();
    let s = ' ' + raw.replace(/!+/g, ' ! ') + ' ';
    s = s.replace(/\s#([\p{L}\p{N}_-]{1,40})(?=\s)/u, (m, p) => { out.project = p.replace(/[_]/g, ' '); return ' '; });
    s = s.replace(/\s(\d{1,2})\s?h\s?(\d{2})?(?=\s)/i, (m, h, mm) => { out.mins = +h * 60 + (+mm || 0); return ' '; });
    if (out.mins == null) s = s.replace(/\s(\d{1,3})\s?(?:m|mn|min|mins|minutes?)(?=\s)/i, (m, n) => { out.mins = +n; return ' '; });
    if (!(out.mins > 0 && out.mins <= 600)) delete out.mins;
    s = s.replace(/\s!(?=\s)/g, () => { out.pri = 'high'; return ' '; });
    const word = (re, f) => { s = s.replace(re, () => { if (!out.due) out.due = f(); return ' '; }); };
    word(/\s(?:apr[eè]s[- ]demain|day after tomorrow)(?=\s)/i, () => addDays(td, 2));
    word(/\s(?:aujourd['’]hui|auj|today|tonight|ce soir)(?=\s)/i, () => td);
    word(/\s(?:demain|tomorrow|tmrw)(?=\s)/i, () => addDays(td, 1));
    [...DAYS.fr, ...DAYS.en].forEach((d, i) => word(new RegExp(`\\s${d}(?=\\s)`, 'i'), () => { const now = new Date().getDay(); return addDays(td, ((i % 7) - now + 7) % 7 || 7); }));
    s = s.replace(/\s(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/, (m, d, mo, y) => {
      const now = new Date(); let yr = y ? (+y < 100 ? 2000 + +y : +y) : now.getFullYear();
      const dt = new Date(yr, +mo - 1, +d); if (dt.getMonth() !== +mo - 1) return m;
      if (!y && ML.dayKey(dt) < td) dt.setFullYear(yr + 1);
      if (!out.due) out.due = ML.dayKey(dt); return ' ';
    });
    const title = s.replace(/\s+/g, ' ').trim();
    if (title) out.title = title;
    return out;
  }
  ML.parseQuick = parseQuick;
  const dayLabel = d => { const td = today(); return d === td ? t('today') : d === addDays(td, 1) ? t('tomorrow') : ML.parseDay(d).toLocaleDateString(ML.locale(), { weekday: 'short', day: 'numeric', month: 'short' }); };
  ML.planDayLabel = dayLabel;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- A small menu under a button (project, date, duration, priority, columns…) ---------- */
  const pop = document.createElement('div'); pop.className = 'pl-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog');
  document.body.appendChild(pop);
  let popDone = null, popAnchor = null;
  function closePop() {
    if (popAnchor) popAnchor.setAttribute('aria-expanded', 'false');
    pop.hidden = true; pop.innerHTML = ''; popDone = null; popAnchor = null;
  }
  function placePop() {
    if (!popAnchor) return;
    const r = popAnchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    const x = Math.max(8, Math.min(r.left, innerWidth - w - 8));
    let y = r.bottom + 6; if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 6);
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
  }
  // html: buttons with data-pv (a JSON value) and/or one small form; onPick receives the value
  function openPop(anchor, html, onPick) {
    if (popAnchor === anchor) { closePop(); return; }
    closePop();
    pop.innerHTML = html; pop.hidden = false; popDone = onPick; popAnchor = anchor;
    anchor.setAttribute('aria-expanded', 'true');
    placePop();
    const f = pop.querySelector('.on, button, input, select'); if (f) f.focus({ preventScroll: true });
  }
  ML.planPop = openPop; ML.planPopClose = closePop;
  const pv = v => esc(JSON.stringify(v));
  pop.addEventListener('click', e => {
    const b = e.target.closest('[data-pv]'); if (!b) return;
    const f = popDone, v = JSON.parse(b.dataset.pv);
    if (!b.dataset.keep) closePop();
    if (f) f(v, b);
  });
  pop.addEventListener('submit', e => {
    e.preventDefault();
    const fm = e.target, inp = fm.querySelector('input'), raw = inp ? inp.value.trim() : '';
    let v = raw;
    if (fm.dataset.pk === 'mins') { const m = /^\d+$/.test(raw) ? +raw : parseQuick('x ' + raw).mins; if (!(m > 0 && m <= 600)) { inp.focus(); return; } v = m; }
    if (fm.dataset.pk === 'due' && !raw) return;
    if (fm.dataset.pk === 'project' && !raw) return;
    const f = popDone; closePop(); if (f) f(v);
  });
  pop.addEventListener('change', e => { const f = popDone; if (f && e.target.dataset.pchg) f({ chg: e.target.dataset.pchg, value: e.target.type === 'checkbox' ? e.target.checked : e.target.value, key: e.target.value }); });
  document.addEventListener('pointerdown', e => { if (!pop.hidden && !pop.contains(e.target) && !(popAnchor && popAnchor.contains(e.target))) closePop(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { e.stopPropagation(); const a = popAnchor; closePop(); if (a) a.focus(); } }, true);
  addEventListener('resize', closePop);
  document.addEventListener('scroll', e => { if (!pop.hidden && !pop.contains(e.target)) closePop(); }, true);

  const item = (v, label, on, aside = '', pre = '') => `<button type="button" class="pp-it ${on ? 'on' : ''}" data-pv="${pv(v)}">${pre}<span>${label}</span>${aside ? `<small>${aside}</small>` : ''}</button>`;
  const nextDow = (dow, minAhead = 0) => { const now = new Date().getDay(); let n = (dow - now + 7) % 7; if (n < minAhead) n += 7; return addDays(today(), n); };
  const PICK = {
    project: cur => {
      const projs = ML.planProjects();
      return projs.map(n => item(n, esc(n), cur === n, String(S.tasks.filter(x => !x.done && x.project === n).length), projDot(n))).join('')
        + item(null, esc(t('pl_p_none')), !cur)
        + `<form class="pp-form" data-pk="project"><input type="text" maxlength="40" placeholder="${esc(t('pl_p_new_ph'))}" aria-label="${esc(t('pl_p_new'))}"><button type="submit" class="small">${esc(t('pl_ok'))}</button></form>`;
    },
    due: cur => {
      const td = today(), sat = nextDow(6), mon = nextDow(1, 1);
      return item(td, esc(t('pl_d_today')), cur === td, esc(dayShort(td)))
        + item(addDays(td, 1), esc(t('pl_d_tomorrow')), cur === addDays(td, 1), esc(dayShort(addDays(td, 1))))
        + (sat !== td && sat !== addDays(td, 1) ? item(sat, esc(t('pl_d_weekend')), cur === sat, esc(dayShort(sat))) : '')
        + item(mon, esc(t('pl_d_nextweek')), cur === mon, esc(dayShort(mon)))
        + item(null, esc(t('pl_d_none')), !cur)
        + `<form class="pp-form" data-pk="due"><input type="date" value="${esc(cur || '')}" aria-label="${esc(t('pl_d_pick'))}"><button type="submit" class="small">${esc(t('pl_ok'))}</button></form>`;
    },
    mins: cur => [15, 25, 30, 45, 60, 90, 120, 180].map(m => item(m, esc(fmtMins(m)), cur === m)).join('')
      + `<form class="pp-form" data-pk="mins"><input type="text" inputmode="text" maxlength="8" placeholder="${esc(t('pl_m_custom'))}" aria-label="${esc(t('pl_m_custom'))}"><button type="submit" class="small">${esc(t('pl_ok'))}</button></form>`,
    pri: cur => ['high', 'med', 'low'].map(p => item(p, esc(t('pri_' + p)), cur === p, '', `<i class="pp-pri p-${p}"></i>`)).join(''),
  };
  const dayShort = d => ML.parseDay(d).toLocaleDateString(ML.locale(), { weekday: 'short', day: 'numeric' });
  function openPicker(kind, anchor, cur, apply) { openPop(anchor, `<div class="pp-list pp-${kind}">${PICK[kind](cur)}</div>`, apply); }
  ML.planPicker = openPicker;

  /* ---------- Pins: pinned tasks stay on top; the first one is the task of the day ---------- */
  const MAXPIN = 5;
  const pinnedList = () => S.tasks.filter(x => x.pin && !x.done).sort((a, b) => a.pin - b.pin);
  function setPin(task, onoff) {
    if (onoff) {
      if (task.pin) return true;
      const list = pinnedList();
      if (list.length >= MAXPIN) { ML.toast(t('pl_pin_max', { n: MAXPIN }), { key: 'plpin' }); return false; }
      task.pin = list.reduce((m, x) => Math.max(m, x.pin), 0) + 1;
    } else delete task.pin;
    return true;
  }
  ML.dayTaskId = () => { const p = pinnedList()[0]; return p ? p.id : null; };
  ML.planPin = id => { const x = S.tasks.find(y => y.id === id); if (!x || x.done) return; setPin(x, !x.pin); save(); ML.renderAll(); };
  ML.planSetPin = setPin;
  // the 3.35 "task of the day" becomes the first pin
  on('started', () => { const d = P() && P().day; if (!d) return; const x = d.date === today() && S.tasks.find(y => y.id === d.id); if (x && !x.done) setPin(x, true); P().day = null; save(); });
  on('task:done', task => { if (task && task.pin) { delete task.pin; save(); } });

  /* ---------- The add field: chips for project, date, duration, priority, pin ---------- */
  const form = $('add-form'), field = $('new-title');
  form.classList.add('qa-on');
  const chips = document.createElement('div'); chips.className = 'qa-chips'; chips.id = 'qa-chips';
  const prev = document.createElement('p'); prev.className = 'qa-prev'; prev.id = 'qa-prev'; prev.setAttribute('aria-live', 'polite');
  form.after(chips); chips.after(prev);
  let draft = {}, lastQ = {}, writing = false;
  // P1 (3.56): the chips only show while a task is being written
  const isWriting = () => writing || !!field.value.trim() || Object.keys(draft).length > 0;
  const stopWriting = e => { if (writing && !form.contains(e.target) && !chips.contains(e.target) && !pop.contains(e.target)) { writing = false; renderChips(); } };
  document.addEventListener('pointerdown', stopWriting, true);
  document.addEventListener('focusin', stopWriting, true);
  // What the new task would get: a chip picked by hand wins, then what is typed, then the project filter / defaults
  function eff() {
    const q = field.value.trim() ? parseQuick(field.value) : {};
    const has = k => Object.prototype.hasOwnProperty.call(draft, k);
    return {
      project: has('project') ? draft.project : q.project !== undefined ? q.project : (P().proj || null),
      due: has('due') ? draft.due : q.due || null,
      mins: draft.mins || q.mins || +$('new-mins').value,
      pri: draft.pri || q.pri || $('new-pri').value,
      pin: !!draft.pin, q,
    };
  }
  const PIN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3.5h6l-1 6.2 3.2 3.3H6.8L10 9.7z"/><path d="M12 13v7.5"/></svg>';
  ML.PIN_SVG = PIN_SVG;
  function renderChips() {
    const e = eff(), single = chips.dataset.single === '1';
    chips.hidden = single || !isWriting();
    if (chips.hidden) return;
    const chip = (k, html, onx, extra = '') => `<button type="button" class="chip qa-chip ${onx ? 'on' : ''}" data-qa="${k}" ${extra}>${html}</button>`;
    chips.innerHTML = chip('project', e.project ? projDot(e.project) + esc(e.project) : esc(t('pl_project')), !!e.project, 'aria-haspopup="true" aria-expanded="false"')
      + chip('due', esc(e.due ? cap(dayLabel(e.due)) : t('pl_c_date')), !!e.due, 'aria-haspopup="true" aria-expanded="false"')
      + chip('mins', esc(fmtMins(e.mins)), !!(draft.mins || e.q.mins), 'aria-haspopup="true" aria-expanded="false"')
      + chip('pri', `<i class="pp-pri p-${e.pri}"></i>${esc(t('pri_' + e.pri))}`, e.pri !== 'med', 'aria-haspopup="true" aria-expanded="false"')
      + chip('pin', PIN_SVG + esc(t('pl_c_pin')), e.pin, `aria-pressed="${e.pin}"`);
  }
  chips.addEventListener('click', ev => {
    const b = ev.target.closest('[data-qa]'); if (!b) return;
    const k = b.dataset.qa, e = eff();
    if (k === 'pin') { draft.pin = !draft.pin; renderChips(); return; }
    openPicker(k, b, e[k], v => { draft[k] = v; renderChips(); const nb = chips.querySelector(`[data-qa="${k}"]`); if (nb && document.activeElement === document.body) nb.focus(); });
  });
  function renderPreview() { prev.innerHTML = !field.value.trim() && document.activeElement === field ? `<span class="qa-tip">${esc(t('pl_qa_tip'))}</span>` : ''; }
  field.addEventListener('input', () => {
    const q = field.value.trim() ? parseQuick(field.value) : {};
    ['project', 'due', 'mins', 'pri'].forEach(k => { if (q[k] !== undefined && lastQ[k] === undefined) delete draft[k]; }); // typing a token takes over that chip
    lastQ = q; renderChips(); renderPreview();
  });
  field.addEventListener('focus', () => { writing = true; renderChips(); renderPreview(); });
  field.addEventListener('blur', () => setTimeout(renderPreview, 150));
  on('quick:clear', () => { draft = {}; lastQ = {}; renderChips(); renderPreview(); });
  // app.js's add form calls this on the new task before saving it
  ML.qaApply = task => {
    const e = eff();
    task.mins = e.mins; task.pri = e.pri;
    if (e.due) task.due = e.due; else delete task.due;
    if (e.project) task.project = e.project; else delete task.project;
    if (e.pin) setPin(task, true);
  };
  // "+ Add to …" under a group: the field takes that group's date / project / priority / pin
  function addIn(gm, key) {
    draft = {};
    const td = today();
    if (key === 'pinned') draft.pin = true;
    else if (gm === 'moment') draft.due = key === 'today' ? td : key === 'week' ? addDays(td, 1) : key === 'later' ? addDays(td, 8) : null;
    else if (gm === 'today') draft.due = td;
    else if (gm === 'days') draft.due = key === 'later' ? addDays(td, 8) : key;
    else if (gm === 'project') draft.project = key || null;
    else if (gm === 'pri') draft.pri = key;
    renderChips();
    form.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    field.focus({ preventScroll: true });
  }

  /* ---------- Task of the day (the first pinned task) ---------- */
  const dayTask = () => { const id = ML.dayTaskId(); return id ? S.tasks.find(x => x.id === id) : null; };
  const card = document.createElement('div'); card.className = 'pl-today'; card.id = 'plan-today'; card.hidden = true;
  // Order of the tab (P1, 3.56): views, add field, quests, task of the day, then the list
  const quests = $('quest-strip'); prev.after(quests); quests.after(card);
  function renderCard(single) {
    const x = single ? null : dayTask();
    card.hidden = !x; if (!x) { card.innerHTML = ''; return; }
    const bits = [x.project, fmtMins(x.mins), x.due && dayLabel(x.due)].filter(Boolean).map(esc).join(' · ');
    const html = `<span class="pl-star" aria-hidden="true">${PIN_SVG}</span>
      <div class="pl-today-tx"><span class="label">${esc(t('pl_day'))}</span><b>${esc(ML.titleOf(x))}</b><small>${bits}</small></div>
      <button type="button" class="primary" data-day="go">${esc(x.id === S.activeId && ML.running() ? t('focusing') : t('lock_in'))}</button>
      <button type="button" class="ghost icon-only" data-day="off" aria-label="${esc(t('pl_unpin'))}" title="${esc(t('pl_unpin'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
    if (card.dataset.h !== html) { card.innerHTML = html; card.dataset.h = html; }
  }
  card.addEventListener('click', e => {
    const b = e.target.closest('[data-day]'); if (!b) return;
    const x = dayTask(); if (!x) return;
    if (b.dataset.day === 'go') ML.lockIn({ taskId: x.id, mins: x.mins });
    else { setPin(x, false); save(); ML.renderAll(); ML.toast(t('pl_unpinned'), { ms: 2000 }); }
  });

  /* ---------- Layout: toolbar, then [projects column | project page + list] ---------- */
  const list = $('tasks');
  const layout = document.createElement('div'); layout.className = 'pl-layout';
  list.before(layout);
  const bar = document.createElement('div'); bar.className = 'pl-bar'; bar.id = 'plan-bar';
  const bulk = document.createElement('div'); bulk.className = 'pl-bulk'; bulk.id = 'plan-bulk'; bulk.hidden = true; bulk.setAttribute('role', 'toolbar');
  const grid = document.createElement('div'); grid.className = 'pl-cols';
  const side = document.createElement('nav'); side.className = 'pl-side'; side.setAttribute('aria-label', t('pl_v_projects'));
  const main = document.createElement('div'); main.className = 'pl-main';
  const phead = document.createElement('div'); phead.className = 'pl-phead'; phead.hidden = true;
  main.append(phead, list); grid.append(side, main); layout.append(bar, grid, bulk);

  /* ---------- Toolbar ---------- */
  const VIEWS = ['today', 'upcoming', 'projects', 'all'], GROUPS = ['moment', 'project', 'pri', 'none'], SORTS = ['energy', 'due', 'mins', 'pri', 'manual'];
  let query = '', selMode = false, searchOpen = false, backView = 'all';
  const sel = new Set();
  const tabPlan = $('tab-plan'), viewsRow = document.createElement('div'); viewsRow.className = 'pl-viewsrow';
  tabPlan.prepend(viewsRow);
  const ICON_SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>';
  const ICON_DISPLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';
  const ICON_SEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/><path d="M14 7.5l1.8 1.8L19 6"/></svg>';
  const ICON_SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="4"/><path d="M12 4v2M4 13h2M18 13h2M6.3 7.3l1.4 1.4M17.7 7.3l-1.4 1.4M3 20h18"/></svg>';
  // The views stay on top in every energy and even with no task. Scattered keeps its single card: only Next and Inbox.
  function renderViews() {
    const p = P(), M = ML.MOODS[S.mood], single = M && M.single && !S.showAll, inbox = p.pview === 'inbox', n = (S.parked || []).length;
    const btn = (v, label, on, id = '') => `<button type="button" ${id ? `id="${id}"` : ''} data-pv2="${v}" aria-pressed="${on}">${label}</button>`;
    const inboxBtn = btn('inbox', esc(t('pl_v_inbox')) + (n ? ` <span class="count">${n}</span>` : ''), inbox, 'pl-inbox-btn');
    const html = `<div class="pl-views" role="group" aria-label="${esc(t('pl_views'))}">${single ? btn('back', esc(t('pl_v_next')), !inbox) : VIEWS.map(v => btn(v, esc(t('pl_v_' + v)), p.pview === v)).join('')}${inboxBtn}</div>
      ${single || inbox ? '' : `<button type="button" class="ghost icon-only pl-tb" data-ptool="display" aria-haspopup="true" aria-expanded="false" aria-label="${esc(t('pl_display'))}" title="${esc(t('pl_display'))}">${ICON_DISPLAY}</button>`}`;
    if (viewsRow.dataset.h !== html) { viewsRow.innerHTML = html; viewsRow.dataset.h = html; }
    tabPlan.classList.toggle('pl-inboxing', inbox);
    $('tab-park').hidden = !inbox;
  }
  ML.planRenderViews = renderViews;
  viewsRow.addEventListener('click', e => {
    const w = e.target.closest('[data-pv2]'), tool = e.target.closest('[data-ptool]');
    if (w) {
      const v = w.dataset.pv2;
      if (v === 'inbox') { if (P().pview !== 'inbox') backView = P().pview; P().pview = 'inbox'; } else P().pview = v === 'back' ? backView : v;
      save(); ML.renderTasks();
    }
    if (tool) openDisplay(tool);
  });
  function renderBar(single) {
    if (single) { bar.hidden = true; return; }
    const p = P(), projs = ML.planProjects();
    if (p.proj && !projs.includes(p.proj)) p.proj = '';
    const counts = Object.fromEntries(projs.map(n => [n, S.tasks.filter(x => !x.done && x.project === n).length]));
    bar.hidden = !(searchOpen || query || projs.length);
    const html = `${searchOpen || query ? `<label class="pl-q">${ICON_SEARCH}<input type="search" id="pl-q" maxlength="60" placeholder="${esc(t('pl_search'))}" aria-label="${esc(t('pl_search'))}"></label>` : ''}
      ${projs.length ? `<div class="pl-projs" role="group" aria-label="${esc(t('pl_project'))}"><button type="button" class="chip" data-pproj="" aria-pressed="${!p.proj}">${esc(t('pl_all'))} · ${S.tasks.filter(x => !x.done).length}</button>${projs.map(n => `<button type="button" class="chip proj" style="--pc:${projColor(n)}" data-pproj="${esc(n)}" aria-pressed="${p.proj === n}"><i></i>${esc(n)} · ${counts[n]}</button>`).join('')}</div>` : ''}`;
    if (bar.dataset.h !== html) { // untouched when nothing changed (the search field keeps its focus)
      const qf = $('pl-q'), had = qf && document.activeElement === qf;
      bar.innerHTML = html; bar.dataset.h = html;
      const nq = $('pl-q'); if (nq) { nq.value = query; if (had) { nq.focus(); nq.setSelectionRange(query.length, query.length); } }
    }
  }
  bar.addEventListener('click', e => {
    const pj = e.target.closest('[data-pproj]');
    if (pj) { P().proj = pj.dataset.pproj; save(); ML.renderTasks(); }
  });
  bar.addEventListener('input', e => { if (e.target.id === 'pl-q') { query = e.target.value; ML.renderTasks(); } });
  bar.addEventListener('focusout', e => { if (e.target.id === 'pl-q' && !query.trim()) { searchOpen = false; query = ''; setTimeout(() => renderBar(false), 120); } });
  ML.planFocusSearch = () => {
    if (P().pview === 'inbox') { P().pview = backView; ML.renderTasks(); }
    searchOpen = true; renderBar(false);
    const q = $('pl-q'); if (q) { q.focus(); q.select(); }
  };
  // One menu for everything that isn't a view (P1, 3.56): list or table, grouping, sort, columns, search, select,
  // Plan my day, and the two clearing actions, away from the thumb
  let clearArmed = 0;
  function openDisplay(anchor) {
    const p = P(), sorts = SORTS.includes(p.sort) ? SORTS : [...SORTS, p.sort];
    const html = `<div class="pp-list pp-display">
      <div class="seg-toggle pl-view" role="group" aria-label="${esc(t('pl_list'))} / ${esc(t('pl_table'))}">
        <button type="button" data-pv="${pv({ act: 'view', v: 'list' })}" aria-pressed="${p.view !== 'table'}">${esc(t('pl_list'))}</button><button type="button" data-pv="${pv({ act: 'view', v: 'table' })}" aria-pressed="${p.view === 'table'}">${esc(t('pl_table'))}</button></div>
      ${p.pview === 'all' ? `<label class="pp-row"><span>${esc(t('pl_group'))}</span><select data-pchg="group">${GROUPS.map(g => `<option value="${g}" ${p.group === g ? 'selected' : ''}>${esc(t('pl_g_' + g))}</option>`).join('')}</select></label>` : ''}
      <label class="pp-row"><span>${esc(t('pl_sort'))}</span><select data-pchg="sort">${sorts.map(s => `<option value="${s}" ${p.sort === s ? 'selected' : ''}>${esc(t('pl_s_' + s))}</option>`).join('')}</select></label>
      ${p.view === 'table' ? `<p class="pp-k">${esc(t('pl_cols'))}</p>${COLKEYS.map(c => `<label class="pp-chk"><input type="checkbox" data-pchg="col" value="${c}" ${p.cols.includes(c) ? 'checked' : ''}><span>${esc(colLabel(c))}</span></label>`).join('')}` : ''}
      <hr class="pp-sep">
      ${item({ act: 'search' }, esc(t('pl_search')), false, '', ICON_SEARCH)}
      ${item({ act: 'select' }, esc(t('pl_select')), selMode, '', ICON_SEL)}
      ${item({ act: 'prep' }, esc(t('pl_prep')), false, '', ICON_SUN)}
      <hr class="pp-sep">
      ${item({ act: 'clearDone' }, esc(t('clear_done')))}
      <button type="button" class="pp-it pp-danger" data-pv="${pv({ act: 'clearAll' })}" data-keep="1"><span>${esc(t('clear_all'))}</span></button>
    </div>`;
    openPop(anchor, html, (r, b) => {
      if (r && r.act) {
        if (r.act === 'view') { P().view = r.v; save(); ML.renderTasks(); }
        if (r.act === 'search') ML.planFocusSearch();
        if (r.act === 'select') setSel(!selMode);
        if (r.act === 'prep' && ML.openDayPrep) ML.openDayPrep();
        if (r.act === 'clearDone') ML.planClearDone();
        if (r.act === 'clearAll') {
          if (Date.now() - clearArmed > 3000) { clearArmed = Date.now(); b.querySelector('span').textContent = t('tap_again'); return; }
          clearArmed = 0; closePop(); ML.planClearAll();
        }
        return;
      }
      if (!r || !r.chg) return;
      if (r.chg === 'group') P().group = r.value;
      if (r.chg === 'sort') { P().sort = r.value; P().dir = r.value === 'xp' || r.value === 'spent' ? -1 : 1; }
      if (r.chg === 'col') { const c = r.key, cols = P().cols.filter(x => x !== c); if (r.value) cols.push(c); P().cols = COLKEYS.filter(x => cols.includes(x)); }
      save(); ML.renderTasks();
    });
  }

  /* ---------- Projects column (wide panels) and the project page ---------- */
  let newProj = false;
  function renderSide() {
    const p = P(), projs = ML.planProjects(), open = S.tasks.filter(x => !x.done);
    const html = `<button type="button" class="pl-sit ${!p.proj ? 'on' : ''}" data-pproj=""><span>${esc(t('pl_all'))}</span><small>${open.length}</small></button>
      ${projs.map(n => { const wk = weekMins(n); return `<button type="button" class="pl-sit ${p.proj === n ? 'on' : ''}" data-pproj="${esc(n)}" title="${esc(n)}${wk ? ' · ' + esc(t('pl_week_h', { h: fmtMins(wk) })) : ''}">${projDot(n)}<span>${esc(n)}</span><small>${open.filter(x => x.project === n).length}</small></button>`; }).join('')}
      ${newProj ? `<form class="pl-snew"><input type="text" maxlength="40" placeholder="${esc(t('pl_p_new_ph'))}" aria-label="${esc(t('pl_p_new'))}"><button type="submit" class="small">${esc(t('pl_ok'))}</button></form>` : `<button type="button" class="pl-sit pl-sadd" data-snew="1">${esc(t('pl_side_new'))}</button>`}`;
    if (side.dataset.h !== html) { side.innerHTML = html; side.dataset.h = html; if (newProj) side.querySelector('input').focus(); }
  }
  side.addEventListener('click', e => {
    const b = e.target.closest('[data-pproj]'), n = e.target.closest('[data-snew]');
    if (b) { P().proj = b.dataset.pproj; save(); ML.renderTasks(); }
    if (n) { newProj = true; renderSide(); }
  });
  side.addEventListener('submit', e => {
    e.preventDefault();
    const v = e.target.querySelector('input').value.trim(); newProj = false;
    if (v) { if (!ML.planProjects().includes(v)) P().plist = [...(P().plist || []), v]; P().proj = v; save(); }
    ML.renderTasks();
  });
  side.addEventListener('focusout', e => { if (newProj && !side.contains(e.relatedTarget)) setTimeout(() => { if (newProj && !side.contains(document.activeElement)) { newProj = false; renderSide(); } }, 120); });
  let renamingProj = false;
  function renderPhead() {
    const p = P(), n = p.proj;
    phead.hidden = !n; if (!n) { phead.innerHTML = ''; phead.dataset.h = ''; return; }
    const all = S.tasks.filter(x => x.project === n), done = all.filter(x => x.done).length, wk = weekMins(n), due = (p.pdue || {})[n];
    let left = '';
    if (due) { const d = Math.round((ML.parseDay(due) - ML.parseDay(today())) / 864e5); left = d > 0 ? t('pl_proj_left', { n: d }) : d === 0 ? t('pl_proj_today') : t('pl_proj_past'); }
    const html = `<div class="pl-ph-top">${projDot(n)}${renamingProj ? `<form class="pl-ph-ren"><input type="text" maxlength="40" value="${esc(n)}" aria-label="${esc(t('pl_rename'))}"><button type="submit" class="small">${esc(t('pl_ok'))}</button></form>` : `<b>${esc(n)}</b><button type="button" class="ghost small" data-ph="ren">${esc(t('pl_rename'))}</button>`}<span class="pl-ph-wk">${wk ? esc(t('pl_week_h', { h: fmtMins(wk) })) : ''}</span></div>
      <div class="pl-ph-bar" title="${esc(t('pl_proj_prog', { d: done, n: all.length }))}"><b style="width:${all.length ? (done / all.length * 100).toFixed(1) : 0}%"></b></div>
      <div class="pl-ph-meta"><span>${esc(t('pl_proj_prog', { d: done, n: all.length }))}</span>
        <label>${esc(t('pl_proj_due'))} <input type="date" data-ph="due" value="${esc(due || '')}"></label>${left ? `<em class="${left === t('pl_proj_past') ? 'late' : ''}">${esc(left)}</em>` : ''}
        <button type="button" class="ghost small pl-ph-del" data-ph="del">${esc(t('pl_proj_del'))}</button></div>
      <textarea data-ph="note" rows="2" maxlength="600" placeholder="${esc(t('pl_proj_note'))}" aria-label="${esc(t('pl_proj_note'))}"></textarea>`;
    if (phead.dataset.h !== html) {
      const ta = phead.querySelector('textarea'), had = ta && document.activeElement === ta;
      phead.innerHTML = html; phead.dataset.h = html;
      const nt = phead.querySelector('textarea'); nt.value = (p.pnotes || {})[n] || ''; if (had) nt.focus();
      if (renamingProj) { const i = phead.querySelector('.pl-ph-ren input'); i.focus(); i.select(); }
    }
  }
  function renameProj(from, to) {
    to = to.trim(); if (!to || to === from) return;
    S.tasks.forEach(x => { if (x.project === from) x.project = to; });
    const p = P();
    p.plist = [...new Set((p.plist || []).map(x => x === from ? to : x))];
    if (p.pnotes && p.pnotes[from] != null) { p.pnotes[to] = p.pnotes[from]; delete p.pnotes[from]; }
    if (p.pdue && p.pdue[from] != null) { p.pdue[to] = p.pdue[from]; delete p.pdue[from]; }
    if (p.proj === from) p.proj = to;
  }
  let delArmed = 0;
  phead.addEventListener('click', e => {
    const b = e.target.closest('[data-ph]'); if (!b) return;
    const n = P().proj;
    if (b.dataset.ph === 'ren') { renamingProj = true; renderPhead(); }
    if (b.dataset.ph === 'del') {
      if (Date.now() - delArmed > 3000) { delArmed = Date.now(); b.textContent = t('pl_sel_sure'); return; }
      delArmed = 0;
      S.tasks.forEach(x => { if (x.project === n) delete x.project; });
      const p = P(); p.plist = (p.plist || []).filter(x => x !== n); delete (p.pnotes || {})[n]; delete (p.pdue || {})[n]; p.proj = '';
      save(); ML.renderTasks(); ML.toast(t('pl_proj_deleted'));
    }
  });
  phead.addEventListener('submit', e => { e.preventDefault(); renameProj(P().proj, e.target.querySelector('input').value); renamingProj = false; save(); ML.renderTasks(); });
  phead.addEventListener('keydown', e => { if (e.key === 'Escape' && renamingProj) { e.stopPropagation(); renamingProj = false; renderPhead(); } });
  phead.addEventListener('change', e => {
    if (e.target.dataset.ph === 'due') { const p = P(); p.pdue = Object.assign({}, p.pdue, { [p.proj]: e.target.value || undefined }); if (!e.target.value) delete p.pdue[p.proj]; save(); renderPhead(); }
  });
  phead.addEventListener('input', e => { if (e.target.dataset.ph === 'note') { const p = P(); p.pnotes = Object.assign({}, p.pnotes, { [p.proj]: e.target.value }); save(); } });

  /* ---------- Views, grouping and sorting ---------- */
  // gm: how the open tasks are grouped in the current view
  const gmOf = () => { const v = P().pview; return v === 'today' ? 'today' : v === 'upcoming' ? 'days' : v === 'projects' ? 'project' : P().group; };
  const momentOf = x => { if (!x.due) return 'nodate'; const td = today(); return x.due <= td ? 'today' : x.due <= addDays(td, 7) ? 'week' : 'later'; };
  function keyOf(gm, x) {
    const td = today();
    if (gm === 'today') return x.due && x.due < td ? 'late' : 'today';
    if (gm === 'days') return !x.due || x.due <= td ? td : x.due <= addDays(td, 6) ? x.due : 'later';
    return gm === 'moment' ? momentOf(x) : gm === 'project' ? (x.project || '') : gm === 'pri' ? x.pri : 'all';
  }
  function orderOf(gm, items) {
    const td = today();
    if (gm === 'today') return ['late', 'today'];
    if (gm === 'days') return [...Array(7)].map((_, i) => addDays(td, i)).concat('later');
    if (gm === 'moment') return ['today', 'week', 'nodate', 'later'];
    if (gm === 'pri') return ['high', 'med', 'low'];
    if (gm === 'project') return [...new Set([...items.map(x => x.project).filter(Boolean), ...(P().pview === 'projects' && !P().proj ? (P().plist || []) : [])])].sort(byName).concat('');
    return ['all'];
  }
  const keepEmpty = (gm, k) => (gm === 'moment' && k === 'today') || gm === 'today' && k === 'today' || gm === 'days' && k !== 'later' || (gm === 'project' && k && (P().plist || []).includes(k));
  function labelOf(gm, k) {
    if (gm === 'today') return t(k === 'late' ? 'pl_m_late' : 'pl_m_today');
    if (gm === 'days') return k === 'later' ? t('pl_m_later') : cap(dayLabel(k));
    return gm === 'moment' ? t('pl_m_' + k) : gm === 'project' ? (k || t('pl_noproj')) : gm === 'pri' ? t('pri_' + k) : '';
  }
  // which open tasks a view shows
  function inView(x) {
    const v = P().pview, td = today();
    if (v === 'today') return (x.due && x.due <= td) || x.id === S.activeId;
    if (v === 'upcoming') return !!x.due;
    return true;
  }
  function sorted(open) {
    const p = P(), pos = new Map(open.map((x, i) => [x.id, i])), d = p.dir || 1;
    const key = { due: x => x.due || '9999', mins: x => x.mins, pri: x => PRI[x.pri], added: x => x.created || 0, xp: x => ML.taskXp(x), spent: x => x.spent || 0, manual: x => (x.ord == null ? 1e9 + pos.get(x.id) : x.ord) }[p.sort];
    if (!key) return open.slice(); // energy: app.js's order (mood sort, the task of the day and the active task first)
    return open.slice().sort((a, b) => { const ka = key(a), kb = key(b); return (ka < kb ? -1 : ka > kb ? 1 : 0) * d || pos.get(a.id) - pos.get(b.id); });
  }
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const filt = arr => { const p = P(), q = norm(query.trim()); return arr.filter(x => (!p.proj || x.project === p.proj) && (!q || norm(ML.titleOf(x)).includes(q) || (x.project && norm(x.project).includes(q)))); };
  function groupsOf(open, done) {
    const gm = gmOf(), shown = sorted(filt(open)), out = [];
    const pins = shown.filter(x => x.pin).sort((a, b) => a.pin - b.pin);
    if (pins.length) out.push({ key: 'pinned', label: t('pl_pinned'), items: pins, mins: pins.reduce((a, x) => a + x.mins, 0), pinned: true });
    const rest = shown.filter(x => !x.pin && inView(x));
    for (const k of orderOf(gm, rest)) {
      const items = rest.filter(x => keyOf(gm, x) === k);
      if (!items.length && !keepEmpty(gm, k)) continue;
      const late = gm === 'moment' || gm === 'days' ? items.filter(x => x.due && x.due < today()).length : 0;
      const wk = gm === 'project' && k ? weekMins(k) : 0;
      out.push({ key: k, label: labelOf(gm, k), items, mins: items.reduce((a, x) => a + x.mins, 0), late, wk, proj: gm === 'project' && k });
    }
    const v = P().pview, td = today();
    const dn = filt(done).filter(x => v !== 'today' || (x.doneAt && ML.dayKey(new Date(x.doneAt)) === td));
    if (dn.length) out.push({ key: 'done', label: t('pl_m_done'), items: dn, done: true });
    return out;
  }

  /* ---------- Rendering (called by app.js renderTasks) ---------- */
  let drag = null, renaming = null;
  const emptyToday = (open) => {
    const nod = filt(open).filter(x => !inView(x) && !x.pin).length;
    return `<li class="pl-empty"><b>${esc(t('pl_empty_today'))}</b><span>${esc(t('pl_empty_hint'))}${nod ? ' · ' + esc(t('pl_nodate_n', { n: nod })) : ''}</span>
      <span class="pl-empty-btns"><button type="button" class="primary small" data-pempty="prep">${esc(t('pl_prep'))}</button><button type="button" class="ghost small" data-pempty="all">${esc(t('pl_see_all'))}</button></span></li>`;
  };
  ML.planRender = (ul, open, done, rowHtml, editingId) => {
    chips.dataset.single = ''; renderChips(); grid.classList.remove('pl-solo');
    renderBar(false); renderCard(false); renderSide(); renderPhead();
    if (drag || renaming) return; // a drag or a rename is in progress: the next render draws the list
    let groups = groupsOf(open, done);
    const p = P(), nextId = open[0] && open[0].id, gm = gmOf();
    const isEmptyToday = p.pview === 'today' && !query && !groups.some(g => !g.done && g.items.length);
    if (isEmptyToday) groups = groups.filter(g => g.items.length);
    const table = p.view === 'table' && !editingId;
    ul.classList.add('grouped'); ul.classList.toggle('pl-tabled', table); ul.classList.toggle('selecting', selMode);
    const head = gr => {
      if (gm === 'none' && !gr.done && !gr.pinned) return '';
      const r = gr.done ? '' : [fmtMins(gr.mins), gr.late ? `<em>${esc(t('pl_late', { n: gr.late }))}</em>` : '', gr.wk ? esc(t('pl_week_h', { h: fmtMins(gr.wk) })) : ''].filter(Boolean).join(' · ');
      const fid = (gr.done ? 'done' : gr.pinned ? 'pinned' : gm) + ':' + (gr.pinned || gr.done ? '' : gr.key), folded = p.fold[fid] ?? !!gr.done;
      return { html: `<button type="button" class="pg-head ${gr.pinned ? 'pg-pinned' : ''}" data-fold="${esc(fid)}" aria-expanded="${!folded}">${gr.pinned ? `<span class="pg-pin">${PIN_SVG}</span>` : gr.proj ? projDot(gr.proj) : ''}<b>${esc(gr.label)}</b><span class="pg-n">${gr.items.length}</span><span class="pg-r">${r}</span><svg class="pg-car" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg></button>`, folded };
    };
    const openCount = groups.filter(g => !g.done).reduce((a, g) => a + g.items.length, 0);
    let html;
    if (table) html = `<li class="pl-table-wrap">${tableHtml(groups, head)}</li>`;
    else html = groups.map(gr => {
      const h = head(gr);
      const add = gr.done ? '' : `<button type="button" class="pg-add" data-gadd="${esc(gr.key)}">${esc(gr.pinned ? t('pl_add_pin') : t('pl_add_in', { g: gr.label || t('pl_all') }))}</button>`;
      return `<li class="pgroup ${h && h.folded ? 'folded' : ''} ${gr.done ? 'pg-done' : ''} ${gr.pinned ? 'pg-pins' : ''}" data-g="${esc(gr.key)}">${h ? h.html : ''}
        <ul class="tasks pg-list" data-g="${esc(gr.key)}">${h && h.folded && !gr.items.some(x => x.id === editingId) ? '' : gr.items.map(x => rowHtml(x, x.id === nextId)).join('')}</ul>${h && h.folded ? '' : add}</li>`;
    }).join('');
    if (isEmptyToday) html = emptyToday(open) + html;
    else if (!openCount && (query || p.proj) && !groups.some(g => g.done)) html = `<li class="empty">${esc(t('pl_no_match'))}</li>` + html;
    ul.innerHTML = html;
    ul.querySelectorAll('.task[data-id]').forEach(li => li.classList.toggle('sel', sel.has(li.dataset.id)));
    renderBulk();
    emit('plan:rendered');
  };

  /* ---------- Table: cells edited in place, columns to choose ---------- */
  const COLKEYS = ['project', 'due', 'mins', 'pri', 'spent', 'steps', 'xp', 'added'];
  const COLSORT = { due: 'due', mins: 'mins', pri: 'pri', spent: 'spent', xp: 'xp', added: 'added' };
  const colLabel = c => c === 'project' ? t('pl_project') : c === 'xp' ? 'XP' : t('pl_th_' + c);
  function tableHtml(groups, head) {
    const p = P(), td = today(), cols = (p.cols && p.cols.length ? p.cols : ['due', 'mins']).filter(c => COLKEYS.includes(c));
    const th = `<th scope="col" class="c-task">${esc(t('pl_th_task'))}</th>` + cols.map(c => {
      const s = COLSORT[c], onx = s && p.sort === s;
      return `<th scope="col" class="c-${c}">${s ? `<button type="button" data-tsort="${s}" class="${onx ? 'on' : ''}">${esc(colLabel(c))}${onx ? (p.dir < 0 ? ' ▾' : ' ▴') : ''}</button>` : esc(colLabel(c))}</th>`;
    }).join('') + `<th class="c-act"><button type="button" class="pl-tcols" data-tcols="1" aria-haspopup="true" aria-expanded="false" aria-label="${esc(t('pl_cols'))}" title="${esc(t('pl_cols'))}">${ICON_DISPLAY}</button></th>`;
    const cell = (x, c) => {
      if (c === 'project') return `<td class="c-project"><button type="button" class="pl-c" data-tcell="project" aria-haspopup="true" aria-expanded="false">${x.project ? ML.projChip(x.project) : '<span class="pl-c-empty">+</span>'}</button></td>`;
      if (c === 'due') return `<td class="c-due ${x.due && x.due < td && !x.done ? 'late' : ''}"><button type="button" class="pl-c" data-tcell="due" aria-haspopup="true" aria-expanded="false">${x.due ? esc(dayLabel(x.due)) : '<span class="pl-c-empty">—</span>'}</button></td>`;
      if (c === 'mins') return `<td class="c-mins"><button type="button" class="pl-c" data-tcell="mins" aria-haspopup="true" aria-expanded="false">${esc(fmtMins(x.mins))}</button></td>`;
      if (c === 'pri') return `<td class="c-pri"><button type="button" class="pl-c" data-tcell="pri" title="${esc(t('priority'))}"><i class="pp-pri p-${x.pri}"></i>${esc(t('pri_' + x.pri))}</button></td>`;
      if (c === 'spent') return `<td class="c-spent">${x.spent ? esc(fmtMins(x.spent)) : '—'}</td>`;
      if (c === 'steps') { const s = x.subs || []; return `<td class="c-steps">${s.length ? `${s.filter(y => y.done).length}/${s.length}` : '—'}</td>`; }
      if (c === 'xp') return `<td class="c-xp">${ML.taskXp(x)}</td>`;
      return `<td class="c-added">${x.created ? esc(new Date(x.created).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' })) : '—'}</td>`;
    };
    const row = x => `<tr class="task ${x.done ? 'done' : ''} ${x.pin ? 'pinned' : ''}" data-id="${x.id}">
        <td class="c-task"><div class="pl-cell"><button type="button" class="check" data-act="toggle" aria-label="${esc(t(x.done ? 'mark_undone' : 'mark_done'))}"><svg viewBox="0 0 12 12"><path d="M2 6.5 L5 9 L10 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>${x.pin ? `<span class="pl-tpin" title="${esc(t('pl_pinned'))}">${PIN_SVG}</span>` : ''}<button type="button" class="pl-tt" data-tren="${x.id}" title="${esc(t('pl_rename'))}">${esc(ML.titleOf(x))}</button></div></td>
        ${cols.map(c => cell(x, c)).join('')}
        <td class="c-act">${x.done ? '' : `<button type="button" class="small" data-act="focus">${esc(t('lock_in'))}</button>`}<button type="button" class="icon-btn pl-tedit" data-tedit="${x.id}" aria-label="${esc(t('pl_edit_full'))}" title="${esc(t('pl_edit_full'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></button></td></tr>`;
    const body = groups.map(gr => {
      const h = head(gr);
      return (h ? `<tr class="pt-group"><td colspan="${cols.length + 2}">${h.html}</td></tr>` : '') + (h && h.folded ? '' : gr.items.map(row).join(''));
    }).join('');
    return `<table class="pl-table"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
  }
  function startRename(id) {
    const tt = list.querySelector(`.pl-tt[data-tren="${id}"]`), x = S.tasks.find(y => y.id === id); if (!tt || !x) return;
    renaming = id;
    const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'pl-ren'; inp.maxLength = 120; inp.value = ML.titleOf(x); inp.setAttribute('aria-label', t('pl_rename'));
    tt.replaceWith(inp); inp.focus(); inp.select();
    let done = false;
    const end = keep => { if (done) return; done = true; renaming = null; if (keep) { const v = inp.value.trim(); if (v && v !== ML.titleOf(x)) { x.title = v; x.sample = false; save(); } } ML.renderTasks(); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); end(true); } if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(false); } });
    inp.addEventListener('blur', () => end(true));
  }
  ML.planRename = startRename;
  function editCell(kind, anchor, ids) {
    const tasks = ids.map(id => S.tasks.find(x => x.id === id)).filter(Boolean); if (!tasks.length) return;
    const cur = tasks.length === 1 ? tasks[0][kind] : undefined;
    openPicker(kind, anchor, cur == null && kind !== 'project' && kind !== 'due' ? undefined : cur, v => {
      tasks.forEach(x => {
        if (kind === 'project') { if (v) x.project = v; else delete x.project; }
        else if (kind === 'due') { if (v) x.due = v; else x.due = null; }
        else x[kind] = v;
        x.sample = false;
      });
      save(); ML.renderAll();
    });
  }
  ML.planEditCell = editCell;

  /* ---------- Several tasks at once ---------- */
  function setSel(onx) {
    selMode = onx; if (!onx) sel.clear();
    ML.renderTasks();
    if (onx) ML.toast(t('pl_sel_hint'), { ms: 2200, key: 'plsel' });
  }
  ML.planSelect = setSel;
  function toggleSel(id) { sel.has(id) ? sel.delete(id) : sel.add(id); const li = list.querySelector(`.task[data-id="${id}"]`); if (li) li.classList.toggle('sel', sel.has(id)); renderBulk(); }
  let bulkArmed = 0;
  function renderBulk() {
    bulk.hidden = !selMode;
    if (!selMode) { bulk.innerHTML = ''; return; }
    [...sel].forEach(id => { if (!S.tasks.some(x => x.id === id)) sel.delete(id); });
    const n = sel.size, dis = n ? '' : 'disabled';
    bulk.innerHTML = `<b>${esc(t('pl_sel_n', { n }))}</b>
      <button type="button" class="ghost small" data-bk="all">${esc(t('pl_sel_all'))}</button>
      <button type="button" class="small" data-bk="project" aria-haspopup="true" aria-expanded="false" ${dis}>${esc(t('pl_project'))}</button>
      <button type="button" class="small" data-bk="due" aria-haspopup="true" aria-expanded="false" ${dis}>${esc(t('pl_c_date'))}</button>
      <button type="button" class="small" data-bk="pri" aria-haspopup="true" aria-expanded="false" ${dis}>${esc(t('priority'))}</button>
      <button type="button" class="small" data-bk="pin" ${dis}>${esc(t('pl_pin'))}</button>
      <button type="button" class="small" data-bk="done" ${dis}>${esc(t('pl_sel_done'))}</button>
      <button type="button" class="small pl-bk-del" data-bk="del" ${dis}>${esc(Date.now() - bulkArmed < 3000 ? t('pl_sel_sure') : t('pl_sel_del'))}</button>
      <button type="button" class="ghost small" data-bk="cancel">${esc(t('pl_cancel'))}</button>`;
  }
  bulk.addEventListener('click', e => {
    const b = e.target.closest('[data-bk]'); if (!b) return;
    const k = b.dataset.bk, ids = [...sel], tasks = ids.map(id => S.tasks.find(x => x.id === id)).filter(Boolean);
    if (k === 'cancel') { setSel(false); return; }
    if (k === 'all') { list.querySelectorAll('.task[data-id]').forEach(li => { const x = S.tasks.find(y => y.id === li.dataset.id); if (x && !x.done) sel.add(x.id); }); ML.renderTasks(); return; }
    if (k === 'project' || k === 'due' || k === 'pri') { editCell(k, b, ids); return; }
    if (k === 'pin') { const all = tasks.every(x => x.pin); tasks.forEach(x => { if (!x.done) setPin(x, !all); }); }
    if (k === 'done') tasks.forEach(x => { if (!x.done) ML.completeTask(x); });
    if (k === 'del') {
      if (Date.now() - bulkArmed > 3000) { bulkArmed = Date.now(); renderBulk(); setTimeout(renderBulk, 3100); return; }
      bulkArmed = 0;
      const gone = new Set(ids);
      S.tasks = S.tasks.filter(x => !gone.has(x.id)); if (gone.has(S.activeId)) S.activeId = null;
      ids.forEach(id => emit('task:deleted', id));
    }
    if (k === 'done' || k === 'del') sel.clear();
    save(); ML.renderAll();
  });

  /* ---------- Clicks inside the list (capture: before app.js's handler, which would just re-render) ---------- */
  list.addEventListener('click', e => {
    const row = e.target.closest('.task[data-id]');
    // selecting: a tap on a row selects it (Shift, Ctrl or Cmd + click starts selecting)
    if (row && !row.classList.contains('editing') && (selMode || e.shiftKey || e.ctrlKey || e.metaKey) && !e.target.closest('input, textarea, .t-grip')) {
      e.stopPropagation(); e.preventDefault();
      if (!selMode) { selMode = true; sel.add(row.dataset.id); ML.renderTasks(); } else toggleSel(row.dataset.id);
      return;
    }
    const f = e.target.closest('[data-fold]'), ts = e.target.closest('[data-tsort]'), te = e.target.closest('[data-tedit]'), pin = e.target.closest('[data-act="pin"]');
    const ga = e.target.closest('[data-gadd]'), tr = e.target.closest('[data-tren]'), tc = e.target.closest('[data-tcell]'), cols = e.target.closest('[data-tcols]'), em = e.target.closest('[data-pempty]');
    if (!f && !ts && !te && !pin && !ga && !tr && !tc && !cols && !em) return;
    e.stopPropagation();
    const p = P();
    if (f) { const k = f.dataset.fold; p.fold = Object.assign({}, p.fold, { [k]: f.getAttribute('aria-expanded') === 'true' }); }
    if (ts) { const s = ts.dataset.tsort; if (p.sort === s) p.dir = -(p.dir || 1); else { p.sort = s; p.dir = s === 'xp' || s === 'spent' ? -1 : 1; } }
    if (te) { p.view = 'list'; save(); renderBar(false); ML.editTask(te.dataset.tedit); return; }
    if (pin) { ML.planPin(pin.closest('.task').dataset.id); return; }
    if (ga) { const k = ga.dataset.gadd; addIn(k === 'pinned' ? 'pinned' : gmOf(), k); return; }
    if (tr) { startRename(tr.dataset.tren); return; }
    if (tc) {
      const id = tc.closest('.task').dataset.id, x = S.tasks.find(y => y.id === id), k = tc.dataset.tcell;
      if (k === 'pri' && x) { x.pri = { high: 'med', med: 'low', low: 'high' }[x.pri] || 'med'; x.sample = false; save(); ML.renderAll(); return; }
      editCell(k, tc, [id]); return;
    }
    if (cols) { openDisplay(cols); return; }
    if (em) { if (em.dataset.pempty === 'all') { p.pview = 'all'; save(); ML.renderTasks(); } else if (ML.openDayPrep) ML.openDayPrep(); return; }
    save(); ML.renderTasks();
  }, true);
  addEventListener('keydown', e => { if (e.key === 'Escape' && selMode && pop.hidden && !ML.isTyping(e)) setSel(false); });

  /* ---------- Drag to reorder (list view): the grip on the left of a row ---------- */
  // The row follows the finger; a placeholder shows where it will land. Dropping it in another group changes what the
  // group stands for (day → date, project, priority, pinned); the order seen becomes the "by hand" order.
  list.addEventListener('pointerdown', e => {
    const g = e.target.closest('.t-grip'); if (!g || P().view === 'table' || selMode) return;
    const li = g.closest('.task'); if (!li || li.classList.contains('editing') || !li.closest('.pg-list')) return;
    e.preventDefault();
    const r = li.getBoundingClientRect();
    const ph = document.createElement('li'); ph.className = 'pl-ph'; ph.style.height = r.height + 'px';
    li.after(ph);
    Object.assign(li.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', zIndex: 30, pointerEvents: 'none' });
    li.classList.add('dragging');
    drag = { li, ph, dy: e.clientY - r.top, id: li.dataset.id, pid: e.pointerId, scroll: null };
    try { g.setPointerCapture(e.pointerId); } catch (err) {}
  });
  function placeAt(x, y) {
    const el = document.elementFromPoint(x, y); if (!el) return;
    const row = el.closest('.pg-list > .task:not(.dragging), .pg-list > .pl-ph'), grp = el.closest('.pgroup');
    if (row && row !== drag.ph && !row.closest('.pg-done')) {
      const r = row.getBoundingClientRect();
      if (y < r.top + r.height / 2) row.before(drag.ph); else row.after(drag.ph);
    } else if (grp && !grp.classList.contains('pg-done') && !grp.classList.contains('folded') && !row) {
      const ul = grp.querySelector('.pg-list'); if (ul && !ul.contains(drag.ph)) ul.appendChild(drag.ph);
    }
  }
  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.pid) return;
    drag.li.style.top = (e.clientY - drag.dy) + 'px';
    placeAt(e.clientX, e.clientY);
    clearInterval(drag.scroll); drag.scroll = null; // near the top or bottom edge, the page scrolls
    const edge = e.clientY < 70 ? -12 : e.clientY > innerHeight - 110 ? 12 : 0;
    if (edge) drag.scroll = setInterval(() => scrollBy(0, edge), 16);
  });
  function endDrag(e, cancel) {
    if (!drag || (e && e.pointerId !== drag.pid)) return;
    const { li, ph, id } = drag; clearInterval(drag.scroll);
    const ul = ph.parentNode, gkey = ul && ul.dataset.g;
    drag = null;
    if (!cancel && ul) {
      ph.replaceWith(li);
      const task = S.tasks.find(x => x.id === id), p = P();
      let pinOrder = false;
      if (task && gkey && gkey !== 'done') {
        const g = gmOf(), td = today();
        if (gkey === 'pinned') { pinOrder = setPin(task, true); }
        else {
          if (task.pin) setPin(task, false);
          if (g === 'moment' && momentOf(task) !== gkey) task.due = gkey === 'today' ? td : gkey === 'week' ? addDays(td, 1) : gkey === 'later' ? addDays(td, 8) : null;
          if (g === 'today') task.due = td;
          if (g === 'days') task.due = gkey === 'later' ? addDays(td, 8) : gkey;
          if (g === 'project') { if (gkey) task.project = gkey; else delete task.project; }
          if (g === 'pri') task.pri = gkey;
        }
      }
      if (pinOrder || gkey === 'pinned') [...list.querySelectorAll('.pg-list[data-g="pinned"] > .task')].forEach((n, i) => { const x = S.tasks.find(y => y.id === n.dataset.id); if (x && x.pin) x.pin = i + 1; });
      else {
        const order = [...list.querySelectorAll('.pg-list:not([data-g="pinned"]) > .task')].map(n => n.dataset.id);
        order.forEach((tid, i) => { const x = S.tasks.find(y => y.id === tid); if (x) x.ord = i * 10; });
        if (p.sort !== 'manual') { p.sort = 'manual'; p.dir = 1; ML.toast(t('pl_manual_on'), { ms: 3500, key: 'plsort' }); }
      }
      save();
    } else ph.remove();
    li.removeAttribute('style'); li.classList.remove('dragging');
    ML.renderAll();
  }
  addEventListener('pointerup', e => endDrag(e, false));
  addEventListener('pointercancel', e => endDrag(e, true));
  addEventListener('keydown', e => { if (e.key === 'Escape' && drag) endDrag(null, true); });

  // Scattered's single card: no toolbar, no chips, no day card (the card already shows the next task)
  on('tasks:render', () => {
    renderViews();
    const M = ML.MOODS[S.mood];
    if (M && M.single && !S.showAll) { renderBar(true); renderCard(true); chips.dataset.single = '1'; renderChips(); bulk.hidden = true; phead.hidden = true; side.innerHTML = ''; side.dataset.h = ''; grid.classList.add('pl-solo'); list.classList.remove('grouped', 'pl-tabled', 'selecting'); }
  });
  on('lang', () => { viewsRow.dataset.h = ''; bar.dataset.h = ''; side.dataset.h = ''; phead.dataset.h = ''; card.dataset.h = ''; });
})();
