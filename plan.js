// Plan tab (3.35), chosen by the user from proposals/plan-refonte.png: the task list grouped by moment / project /
// priority and sorted as chosen, a table view one tap away, the task of the day pinned on top, one-line quick add
// ("Réviser maths 45m demain ! #Partiels") with a live preview, project filter chips, and drag to reorder (dropping a
// task in another group moves its date, project or priority). app.js still draws each task row (taskHtml) and handles
// its buttons; this file arranges the rows (ML.planRender) and adds the toolbar. Scattered's single card is untouched.
(() => {
  'use strict';
  const { S, t, esc, on, emit, $, today, addDays, fmtMins } = ML;
  const save = () => ML.save();

  ML.addStrings({
    fr: {
      pl_list: 'Liste', pl_table: 'Tableau', pl_group: 'Grouper', pl_sort: 'Trier', pl_all: 'Toutes',
      pl_g_moment: 'Moment', pl_g_project: 'Projet', pl_g_pri: 'Priorité', pl_g_none: 'Aucun',
      pl_s_energy: 'Énergie', pl_s_due: 'Échéance', pl_s_mins: 'Durée', pl_s_added: 'Ajout', pl_s_xp: 'XP', pl_s_manual: 'À la main',
      pl_m_today: 'Aujourd’hui', pl_m_week: 'Cette semaine', pl_m_nodate: 'Sans date', pl_m_later: 'Plus tard', pl_m_done: 'Terminées',
      pl_noproj: 'Sans projet', pl_late: '{n} en retard', pl_week_h: '{h} cette semaine',
      pl_day: 'Tâche du jour', pl_pin: 'En faire la tâche du jour', pl_unpin: 'Ne plus en faire la tâche du jour', pl_drag: 'Glisser pour déplacer',
      pl_project: 'Projet', pl_qa: 'Compris :', pl_qa_enter: 'Entrée pour ajouter', pl_qa_high: 'priorité haute',
      pl_qa_tip: 'Astuce : écris tout d’un coup, par exemple « Réviser maths 45m demain ! #Partiels »',
      pl_th_task: 'Tâche', pl_th_due: 'Échéance', pl_th_mins: 'Durée', pl_th_pri: 'Prio.', pl_th_added: 'Ajoutée',
      pl_sum: '{n} ouvertes · {m}', pl_manual_on: 'Tri à la main : l’ordre que tu choisis est gardé.', pl_unpinned: 'Plus de tâche du jour.',
    },
    en: {
      pl_list: 'List', pl_table: 'Table', pl_group: 'Group', pl_sort: 'Sort', pl_all: 'All',
      pl_g_moment: 'Moment', pl_g_project: 'Project', pl_g_pri: 'Priority', pl_g_none: 'None',
      pl_s_energy: 'Energy', pl_s_due: 'Due date', pl_s_mins: 'Duration', pl_s_added: 'Added', pl_s_xp: 'XP', pl_s_manual: 'By hand',
      pl_m_today: 'Today', pl_m_week: 'This week', pl_m_nodate: 'No date', pl_m_later: 'Later', pl_m_done: 'Done',
      pl_noproj: 'No project', pl_late: '{n} late', pl_week_h: '{h} this week',
      pl_day: 'Task of the day', pl_pin: 'Make it the task of the day', pl_unpin: 'Stop making it the task of the day', pl_drag: 'Drag to move',
      pl_project: 'Project', pl_qa: 'Understood:', pl_qa_enter: 'Enter to add', pl_qa_high: 'high priority',
      pl_qa_tip: 'Tip: type it all at once, for example "Revise maths 45m tomorrow ! #Exams"',
      pl_th_task: 'Task', pl_th_due: 'Due', pl_th_mins: 'Time', pl_th_pri: 'Prio.', pl_th_added: 'Added',
      pl_sum: '{n} open · {m}', pl_manual_on: 'Sorted by hand: the order you choose is kept.', pl_unpinned: 'No task of the day any more.',
    },
  });
  // plan: view, grouping, sort (+ direction for the table), project filter, folded groups, the task of the day { date, id }
  ML.defaults(() => ({ plan: { view: 'list', group: 'moment', sort: 'energy', dir: 1, proj: '', fold: {}, day: null } }));
  const P = () => S.plan;

  /* ---------- Projects ---------- */
  ML.planProjects = () => [...new Set(S.tasks.map(x => x.project).filter(Boolean))].sort((a, b) => a.localeCompare(b, ML.locale(), { sensitivity: 'base' }));
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const projColor = name => `var(--ev-${hash(name.toLowerCase()) % 8 + 1})`;
  ML.projChip = name => `<span class="chip proj" style="--pc:${projColor(name)}"><i></i>${esc(name)}</span>`;
  const projDot = name => `<i class="pl-dot" style="--pc:${projColor(name)}"></i>`;

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
  // The preview line under the field: what quick add understood, or a tip while the field is empty
  const form = $('add-form'), field = $('new-title');
  const prev = document.createElement('p'); prev.className = 'qa-prev'; prev.id = 'qa-prev'; prev.setAttribute('aria-live', 'polite');
  form.after(prev);
  function renderPreview() {
    const v = field.value.trim();
    if (!v) { prev.innerHTML = document.activeElement === field ? `<span class="qa-tip">${esc(t('pl_qa_tip'))}</span>` : ''; return; }
    const q = parseQuick(v), bits = [];
    if (q.mins) bits.push(fmtMins(q.mins));
    if (q.due) bits.push(dayLabel(q.due));
    if (q.pri) bits.push(t('pl_qa_high'));
    if (!bits.length && !q.project) { prev.innerHTML = ''; return; }
    prev.innerHTML = `<span class="qa-k">${esc(t('pl_qa'))}</span><span class="chip">${esc(q.title || v)}</span>${bits.map(b => `<span class="chip">${esc(b)}</span>`).join('')}${q.project ? ML.projChip(q.project) : ''}<span class="qa-enter">${esc(t('pl_qa_enter'))}</span>`;
  }
  field.addEventListener('input', renderPreview);
  field.addEventListener('focus', renderPreview);
  field.addEventListener('blur', () => setTimeout(renderPreview, 150));
  on('quick:clear', renderPreview);

  /* ---------- Task of the day ---------- */
  const dayTask = () => { const d = P().day; if (!d || d.date !== today()) return null; const x = S.tasks.find(y => y.id === d.id); return x && !x.done ? x : null; };
  const card = document.createElement('div'); card.className = 'pl-today'; card.id = 'plan-today'; card.hidden = true;
  form.before(card);
  function renderCard(single) {
    const x = single ? null : dayTask();
    card.hidden = !x; if (!x) { card.innerHTML = ''; return; }
    const bits = [x.project, fmtMins(x.mins), x.due && dayLabel(x.due)].filter(Boolean).map(esc).join(' · ');
    card.innerHTML = `<span class="pl-star" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg></span>
      <div class="pl-today-tx"><span class="label">${esc(t('pl_day'))}</span><b>${esc(ML.titleOf(x))}</b><small>${bits}</small></div>
      <button type="button" class="primary" data-day="go">${esc(x.id === S.activeId && ML.running() ? t('focusing') : t('lock_in'))}</button>
      <button type="button" class="ghost icon-only" data-day="off" aria-label="${esc(t('pl_unpin'))}" title="${esc(t('pl_unpin'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
  }
  card.addEventListener('click', e => {
    const b = e.target.closest('[data-day]'); if (!b) return;
    const x = dayTask(); if (!x) return;
    if (b.dataset.day === 'go') ML.lockIn({ taskId: x.id, mins: x.mins });
    else { P().day = null; save(); ML.renderAll(); ML.toast(t('pl_unpinned'), { ms: 2000 }); }
  });
  function togglePin(id) {
    const d = dayTask();
    P().day = d && d.id === id ? null : { date: today(), id };
    save(); ML.renderAll();
  }

  /* ---------- Toolbar ---------- */
  const bar = document.createElement('div'); bar.className = 'pl-bar'; bar.id = 'plan-bar';
  prev.after(bar);
  const GROUPS = ['moment', 'project', 'pri', 'none'], SORTS = ['energy', 'due', 'mins', 'added', 'xp', 'manual'];
  function renderBar(single) {
    bar.hidden = single;
    if (single) return;
    const p = P(), projs = ML.planProjects();
    if (p.proj && !projs.includes(p.proj)) p.proj = '';
    const counts = Object.fromEntries(projs.map(n => [n, S.tasks.filter(x => !x.done && x.project === n).length]));
    const html = `<div class="seg-toggle pl-view" role="group" aria-label="${esc(t('pl_list'))} / ${esc(t('pl_table'))}">
        <button type="button" data-pview="list" aria-pressed="${p.view !== 'table'}">${esc(t('pl_list'))}</button><button type="button" data-pview="table" aria-pressed="${p.view === 'table'}">${esc(t('pl_table'))}</button></div>
      <label class="pl-sel"><span>${esc(t('pl_group'))}</span><select data-pset="group">${GROUPS.map(g => `<option value="${g}" ${p.group === g ? 'selected' : ''}>${esc(t('pl_g_' + g))}</option>`).join('')}</select></label>
      <label class="pl-sel"><span>${esc(t('pl_sort'))}</span><select data-pset="sort">${SORTS.map(s => `<option value="${s}" ${p.sort === s ? 'selected' : ''}>${esc(t('pl_s_' + s))}</option>`).join('')}</select></label>
      ${projs.length ? `<div class="pl-projs" role="group" aria-label="${esc(t('pl_project'))}"><button type="button" class="chip" data-pproj="" aria-pressed="${!p.proj}">${esc(t('pl_all'))} · ${S.tasks.filter(x => !x.done).length}</button>${projs.map(n => `<button type="button" class="chip proj" style="--pc:${projColor(n)}" data-pproj="${esc(n)}" aria-pressed="${p.proj === n}"><i></i>${esc(n)} · ${counts[n]}</button>`).join('')}</div>` : ''}`;
    if (bar.dataset.h !== html) { bar.innerHTML = html; bar.dataset.h = html; } // untouched when nothing changed (an open select stays open)
  }
  bar.addEventListener('click', e => {
    const v = e.target.closest('[data-pview]'), pj = e.target.closest('[data-pproj]');
    if (v) { P().view = v.dataset.pview; save(); ML.renderTasks(); }
    if (pj) { P().proj = pj.dataset.pproj; save(); ML.renderTasks(); }
  });
  bar.addEventListener('change', e => {
    const s = e.target.closest('[data-pset]'); if (!s) return;
    P()[s.dataset.pset] = s.value; if (s.dataset.pset === 'sort') P().dir = s.value === 'xp' ? -1 : 1;
    save(); ML.renderTasks();
  });

  /* ---------- Grouping and sorting ---------- */
  const momentOf = x => { if (!x.due) return 'nodate'; const td = today(); return x.due <= td ? 'today' : x.due <= addDays(td, 7) ? 'week' : 'later'; };
  const keyOf = (g, x) => g === 'moment' ? momentOf(x) : g === 'project' ? (x.project || '') : g === 'pri' ? x.pri : 'all';
  const orderOf = (g, list) => g === 'moment' ? ['today', 'week', 'nodate', 'later'] : g === 'pri' ? ['high', 'med', 'low']
    : g === 'project' ? [...[...new Set(list.map(x => x.project).filter(Boolean))].sort((a, b) => a.localeCompare(b, ML.locale(), { sensitivity: 'base' })), ''] : ['all'];
  const labelOf = (g, k) => g === 'moment' ? t('pl_m_' + k) : g === 'project' ? (k || t('pl_noproj')) : g === 'pri' ? t('pri_' + k) : '';
  function sorted(open) {
    const p = P(), pos = new Map(open.map((x, i) => [x.id, i])), d = p.dir || 1;
    const key = { due: x => x.due || '9999', mins: x => x.mins, added: x => x.created || 0, xp: x => ML.taskXp(x), manual: x => (x.ord == null ? 1e9 + pos.get(x.id) : x.ord) }[p.sort];
    if (!key) return open.slice(); // energy: app.js's order (mood sort, task of the day and the active task first)
    return open.slice().sort((a, b) => { const ka = key(a), kb = key(b); return (ka < kb ? -1 : ka > kb ? 1 : 0) * d || pos.get(a.id) - pos.get(b.id); });
  }
  // Minutes spent this week (since Monday) on a project's tasks, from the session log
  function weekMins(proj) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const ids = new Set(S.tasks.filter(x => x.project === proj).map(x => x.id));
    return S.sessions.filter(s => s.at >= d.getTime() && ids.has(s.taskId)).reduce((a, s) => a + (s.mins || 0), 0);
  }
  function groupsOf(open, done) {
    const p = P(), g = p.group, list = sorted(open), out = [];
    for (const k of orderOf(g, list)) {
      const items = list.filter(x => keyOf(g, x) === k);
      if (!items.length && !(g === 'moment' && k === 'today')) continue; // "Today" stays as a drop target
      const late = g === 'moment' ? items.filter(x => x.due && x.due < today()).length : 0;
      const wk = g === 'project' && k ? weekMins(k) : 0;
      out.push({ key: k, label: labelOf(g, k), items, mins: items.reduce((a, x) => a + x.mins, 0), late, wk, proj: g === 'project' && k });
    }
    if (done.length) out.push({ key: 'done', label: t('pl_m_done'), items: done, done: true });
    return out;
  }
  const filt = list => P().proj ? list.filter(x => x.project === P().proj) : list;

  /* ---------- Rendering (called by app.js renderTasks) ---------- */
  let drag = null;
  ML.planRender = (ul, open, done, rowHtml, editingId) => {
    renderBar(false); renderCard(false);
    if (drag) return; // a drag is in progress: the next render after the drop draws the list
    const groups = groupsOf(filt(open), filt(done)), p = P(), nextId = open[0] && open[0].id;
    ul.classList.add('grouped'); ul.classList.toggle('pl-tabled', p.view === 'table' && !editingId);
    const head = gr => {
      if (p.group === 'none' && !gr.done) return '';
      const r = gr.done ? '' : [fmtMins(gr.mins), gr.late ? `<em>${esc(t('pl_late', { n: gr.late }))}</em>` : '', gr.wk ? esc(t('pl_week_h', { h: fmtMins(gr.wk) })) : ''].filter(Boolean).join(' · ');
      const fid = (gr.done ? 'done' : p.group) + ':' + gr.key, folded = p.fold[fid] ?? !!gr.done;
      return { html: `<button type="button" class="pg-head" data-fold="${esc(fid)}" aria-expanded="${!folded}">${gr.proj ? projDot(gr.proj) : ''}<b>${esc(gr.label)}</b><span class="pg-n">${gr.items.length}</span><span class="pg-r">${r}</span><svg class="pg-car" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg></button>`, folded };
    };
    if (p.view === 'table' && !editingId) { ul.innerHTML = `<li class="pl-table-wrap">${tableHtml(groups, head)}</li>`; return; }
    ul.innerHTML = groups.map(gr => {
      const h = head(gr);
      return `<li class="pgroup ${h && h.folded ? 'folded' : ''} ${gr.done ? 'pg-done' : ''}" data-g="${esc(gr.key)}">${h ? h.html : ''}
        <ul class="tasks pg-list" data-g="${esc(gr.key)}">${h && h.folded && !gr.items.some(x => x.id === editingId) ? '' : gr.items.map(x => rowHtml(x, x.id === nextId)).join('')}</ul></li>`;
    }).join('');
  };

  /* ---------- Table ---------- */
  const COLS = [['task', null], ['project', null], ['due', 'due'], ['mins', 'mins'], ['pri', null], ['xp', 'xp'], ['added', 'added']];
  function tableHtml(groups, head) {
    const p = P(), td = today(), open = groups.filter(g => !g.done).flatMap(g => g.items);
    const th = COLS.map(([c, s]) => {
      const on = s && p.sort === s, lbl = c === 'task' ? t('pl_th_task') : c === 'project' ? t('pl_project') : c === 'xp' ? 'XP' : t('pl_th_' + c);
      return `<th scope="col" class="c-${c}">${s ? `<button type="button" data-tsort="${s}" class="${on ? 'on' : ''}">${esc(lbl)}${on ? (p.dir < 0 ? ' ▾' : ' ▴') : ''}</button>` : esc(lbl)}</th>`;
    }).join('') + '<th class="c-act"></th>';
    const row = x => `<tr class="task ${x.done ? 'done' : ''}" data-id="${x.id}">
        <td class="c-task"><div class="pl-cell"><button type="button" class="check" data-act="toggle" aria-label="${esc(t(x.done ? 'mark_undone' : 'mark_done'))}"><svg viewBox="0 0 12 12"><path d="M2 6.5 L5 9 L10 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><button type="button" class="link pl-tt" data-tedit="${x.id}">${esc(ML.titleOf(x))}</button></div></td>
        <td class="c-project">${x.project ? ML.projChip(x.project) : ''}</td>
        <td class="c-due ${x.due && x.due < td && !x.done ? 'late' : ''}">${x.due ? esc(dayLabel(x.due)) : '—'}</td>
        <td class="c-mins">${esc(fmtMins(x.mins))}</td>
        <td class="c-pri"><span class="pl-bars p-${x.pri}" title="${esc(t('pri_' + x.pri))}"><i></i><i></i><i></i></span></td>
        <td class="c-xp">${ML.taskXp(x)}</td>
        <td class="c-added">${x.created ? esc(new Date(x.created).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' })) : '—'}</td>
        <td class="c-act">${x.done ? '' : `<button type="button" class="small" data-act="focus">${esc(t('lock_in'))}</button>`}</td></tr>`;
    const body = groups.map(gr => {
      const h = head(gr);
      return (h ? `<tr class="pt-group"><td colspan="${COLS.length + 1}">${h.html}</td></tr>` : '') + (h && h.folded ? '' : gr.items.map(row).join(''));
    }).join('');
    return `<table class="pl-table"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`; // the totals are in the plan footer below
  }

  /* ---------- Clicks inside the list (capture: before app.js's handler, which would just re-render) ---------- */
  $('tasks').addEventListener('click', e => {
    const f = e.target.closest('[data-fold]'), ts = e.target.closest('[data-tsort]'), te = e.target.closest('[data-tedit]'), pin = e.target.closest('[data-act="pin"]');
    if (!f && !ts && !te && !pin) return;
    e.stopPropagation();
    const p = P();
    if (f) { const k = f.dataset.fold; p.fold = Object.assign({}, p.fold, { [k]: f.getAttribute('aria-expanded') === 'true' }); }
    if (ts) { const s = ts.dataset.tsort; if (p.sort === s) p.dir = -(p.dir || 1); else { p.sort = s; p.dir = s === 'xp' ? -1 : 1; } }
    if (te) { p.view = 'list'; save(); ML.editTask(te.dataset.tedit); return; }
    if (pin) { togglePin(pin.closest('.task').dataset.id); return; }
    save(); ML.renderTasks();
  }, true);

  /* ---------- Drag to reorder (list view): the grip on the left of a row ---------- */
  // The row follows the finger; a placeholder shows where it will land. Dropping it in another group changes what the
  // group stands for (moment → date, project, priority); the order seen becomes the "by hand" order.
  const list = $('tasks');
  list.addEventListener('pointerdown', e => {
    const g = e.target.closest('.t-grip'); if (!g || P().view === 'table') return;
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
      if (task && gkey && gkey !== 'done') {
        const g = p.group, td = today();
        if (g === 'moment' && momentOf(task) !== gkey) task.due = gkey === 'today' ? td : gkey === 'week' ? addDays(td, 1) : gkey === 'later' ? addDays(td, 8) : null;
        if (g === 'project') task.project = gkey || null;
        if (g === 'pri') task.pri = gkey;
      }
      const order = [...list.querySelectorAll('.pg-list > .task')].map(n => n.dataset.id);
      order.forEach((tid, i) => { const x = S.tasks.find(y => y.id === tid); if (x) x.ord = i * 10; });
      if (p.sort !== 'manual') { p.sort = 'manual'; p.dir = 1; ML.toast(t('pl_manual_on'), { ms: 3500, key: 'plsort' }); }
      save();
    } else ph.remove();
    li.removeAttribute('style'); li.classList.remove('dragging');
    ML.renderAll();
  }
  addEventListener('pointerup', e => endDrag(e, false));
  addEventListener('pointercancel', e => endDrag(e, true));
  addEventListener('keydown', e => { if (e.key === 'Escape' && drag) endDrag(null, true); });

  // Scattered's single card: no toolbar, no day card (the card already shows the next task)
  on('tasks:render', () => { const M = ML.MOODS[S.mood]; if (M && M.single && !S.showAll) { renderBar(true); renderCard(true); $('tasks').classList.remove('grouped', 'pl-tabled'); } });
  on('task:deleted', id => { if (P().day && P().day.id === id) { P().day = null; save(); } });
})();
