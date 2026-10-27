// Timer, moods, tasks, parking lot, focus rating, Grimoire stats, settings sheet, shortcuts.
(() => {
  'use strict';
  const { $, S, t, tn, esc, fmtMins, uid, dayKey, today, save, emit, on, toast, armedButton, bgSend, IS_EXT } = ML;
  const fmtClock = MiniView.fmtClock;

  // Each mood has its own rhythm: gentle sprints, classic blocks, deep work or micro-sprints
  const MOOD_PRESETS = {
    drained:   { focus: [10, 15, 20, 25, 30, 45], brk: [5, 10, 15, 20] },
    steady:    { focus: [25, 30, 40, 45, 50, 60], brk: [5, 10, 15] },
    fired:     { focus: [45, 60, 75, 90, 120, 150], brk: [10, 15, 20, 30] },
    scattered: { focus: [5, 10, 15, 20, 25], brk: [3, 5, 10] },
  };
  const PRI = { high: 0, med: 1, low: 2 };
  const MOODS = {
    drained:   { focus: 25, brk: 10, sort: 'short', color: '#5cc8e6', icon: '<path d="M15 4a8 8 0 1 0 5 13A7 7 0 0 1 15 4z"/>' },
    steady:    { focus: 40, brk: 10, sort: 'priority', color: '#a678ff', icon: '<path d="M3 12h4l2-4 3 8 2-4h7"/>' },
    fired:     { focus: 90, brk: 15, sort: 'hard', color: '#ff4fd8', icon: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6.5 1 1 2 2 2 3.5 0-3 0-5 1-7z"/>' },
    scattered: { focus: 20, brk: 5, sort: 'priority', single: true, color: '#ffb547', icon: '<circle cx="6" cy="7" r="1.6"/><circle cx="17" cy="5" r="1.6"/><circle cx="12" cy="13" r="1.6"/><circle cx="5" cy="18" r="1.6"/><circle cx="18" cy="17" r="1.6"/>' },
  };
  // XP thresholds, Sequence 9 down to Sequence 0 (Fool pathway, Lord of the Mysteries)
  const SEQUENCES = [[0, 'Seer'], [300, 'Clown'], [900, 'Magician'], [2000, 'Faceless'], [3600, 'Marionettist'],
    [6000, 'Bizarro Sorcerer'], [9500, 'Scholar of Yore'], [14000, 'Miracle Invoker'], [20000, 'Attendant of Mysteries'], [30000, 'The Fool']];
  const TIPS = ['tip_water', 'tip_stretch', 'tip_eyes', 'tip_breathe', 'tip_walk', 'tip_posture'];

  ML.MOODS = MOODS;
  ML.SEQUENCES = SEQUENCES;

  ML.defaults(() => ({
    v: 3, lang: (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en',
    tasks: [
      { id: uid(), title: 'Example 1', sampleN: 1, mins: 60, pri: 'high', done: false, sample: true },
      { id: uid(), title: 'Example 2', sampleN: 2, mins: 15, pri: 'low', done: false, sample: true },
      { id: uid(), title: 'Example 3', sampleN: 3, mins: 120, pri: 'med', done: false, sample: true },
    ],
    parked: [], sessions: [], xp: 0, moodTimers: {},
    mood: 'steady', moodDay: null,
    mode: 'focus', focusMins: 40, breakMins: 10, activeId: null, freeTitle: null, endAt: null, remaining: 2400, total: 2400,
    chime: true, autoBreak: false, autoCompact: true, compact: false,
    longEvery: 4, longBreak: 20, cycle: 0, cycleDay: null, breakTip: null,
    pendingRating: null, tab: 'plan', showAll: false, lastDay: null,
    block: { on: false, domains: ['youtube.com', 'instagram.com', 'tiktok.com', 'twitter.com', 'x.com', 'reddit.com', 'facebook.com', 'twitch.tv'] },
  }));

  /* ---------- XP & sequences ---------- */
  function seqInfo(xp = S.xp) {
    let i = 0;
    while (i + 1 < SEQUENCES.length && xp >= SEQUENCES[i + 1][0]) i++;
    const [from, name] = SEQUENCES[i], next = SEQUENCES[i + 1];
    return { i, num: 9 - i, name, from, next: next ? next[0] : null, nextName: next ? next[1] : null, frac: next ? (xp - from) / (next[0] - from) : 1 };
  }
  function addXp(n) {
    const before = seqInfo().i;
    S.xp = Math.max(0, Math.round(S.xp + n));
    if (n > 0) emit('xp', Math.round(n));
    const after = seqInfo();
    if (after.i > before) emit('levelup', after);
    renderSeq();
  }
  ML.seqInfo = seqInfo;
  ML.addXp = addXp;
  ML.taskXp = () => 15; // game.js replaces this with rarity-based XP

  function streaks() {
    const days = new Set(S.sessions.map(s => dayKey(new Date(s.at))));
    ((S.econ && S.econ.frozen) || []).forEach(d => days.add(d)); // days protected by a streak seal
    let cur = 0;
    const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(dayKey(d))) { cur++; d.setDate(d.getDate() - 1); }
    let best = 0, run = 0, prev = null;
    for (const k of [...days].sort()) {
      const dt = ML.parseDay(k);
      run = prev && Math.round((dt - prev) / 864e5) === 1 ? run + 1 : 1;
      best = Math.max(best, run); prev = dt;
    }
    return { cur, best };
  }
  ML.streaks = streaks;

  function renderSeq() {
    const s = seqInfo();
    $('seq-label').textContent = `${t('sequence')} ${s.num} · ${s.name}`;
    $('seq-fill').style.width = (s.frac * 100).toFixed(1) + '%';
    $('seq-badge').title = s.next ? t('seq_title', { xp: S.xp, left: s.next - S.xp, next: s.nextName }) : t('seq_title_top', { xp: S.xp });
    const st = streaks();
    $('streak-pill').innerHTML = `<b>${st.cur}</b> ${esc(tn('streak_label', st.cur))}`;
    $('streak-pill').title = t('streak_title');
  }

  /* ---------- Mood ---------- */
  function setMood(m) {
    const M = MOODS[m];
    S.mood = m; S.moodDay = today(); S.showAll = false;
    let msg = t('mood_set', { mood: t('mood_' + m) });
    if (!running() && S.remaining === S.total && !S.pendingRating) {
      const mine = (S.moodTimers || {})[m] || {}, f = mine.focus || M.focus, b = mine.brk || M.brk; // the last timer used in this mood
      S.focusMins = f; S.breakMins = b;
      S.total = S.remaining = (S.mode === 'focus' ? f : b) * 60;
      msg += ' ' + t('mood_timer', { f: fmtMins(f), b: fmtMins(b) });
    }
    save(); emit('mood', m); renderAll(); toast(msg);
  }
  function renderMood() {
    $('mood-chips').innerHTML = Object.entries(MOODS).map(([k, M]) =>
      `<button type="button" class="mood-chip" data-mood="${k}" style="--mood-c:${M.color}" aria-pressed="${k === S.mood}">${ML.svgIcon(M.icon)}<span>${esc(t('mood_' + k))}</span></button>`).join('');
    $('mood-line').innerHTML = `<b>${esc(t('mood_' + S.mood))} :</b> ${esc(t('mood_line_' + S.mood))}`;
  }
  $('mood-chips').addEventListener('click', e => { const b = e.target.closest('[data-mood]'); if (b && b.dataset.mood !== S.mood) setMood(b.dataset.mood); });

  ML.setMood = setMood;
  // The energy picker (energy.js) asks the day's mood; this opens it to change it (Settings, midnight)
  const showCheckin = () => ML.energyPicker && ML.energyPicker.open({ cancellable: true });
  ML.showCheckin = showCheckin;

  /* ---------- Overlays ---------- */
  function openOverlay(id) {
    $(id).hidden = false;
    setTimeout(() => { const f = $(id).querySelector('button, input, select'); if (f) f.focus(); }, 30);
  }
  function closeOverlay(id) { $(id).hidden = true; }
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-close]'); if (c) closeOverlay(c.dataset.close);
    if (e.target.classList && e.target.classList.contains('overlay')) closeOverlay(e.target.id);
  });
  ML.openOverlay = openOverlay; ML.closeOverlay = closeOverlay;

  /* ---------- Tasks ---------- */
  const expanded = new Set();
  let editingId = null;
  // Example tasks follow the chosen language until the user edits them
  const titleOf = task => (task.sample && task.sampleN ? t('sample_' + task.sampleN) : task.title);
  ML.titleOf = titleOf;
  function orderedOpen() {
    const sort = MOODS[S.mood].sort;
    const open = S.tasks.filter(x => !x.done);
    open.sort((a, b) =>
      sort === 'short' ? (a.mins - b.mins) || (PRI[a.pri] - PRI[b.pri])
      : sort === 'hard' ? (PRI[a.pri] - PRI[b.pri]) || (b.mins - a.mins)
      : (PRI[a.pri] - PRI[b.pri]) || (a.mins - b.mins));
    const day = S.plan && S.plan.day && S.plan.day.date === today() ? S.plan.day.id : null; // the task of the day (plan.js) comes next
    const di = day ? open.findIndex(x => x.id === day) : -1;
    if (di > 0) open.unshift(open.splice(di, 1)[0]);
    const ai = open.findIndex(x => x.id === S.activeId);
    if (ai > 0) open.unshift(open.splice(ai, 1)[0]);
    return open;
  }
  ML.orderedOpen = orderedOpen;

  function dueChip(task) {
    if (!task.due) return '';
    const d = task.due, td = today();
    const cls = d < td ? 'late' : d === td ? 'soon' : '';
    const label = d === td ? t('today') : d === ML.addDays(td, 1) ? t('tomorrow') : ML.parseDay(d).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' });
    return `<span class="chip due ${cls}">${esc(d < td ? t('late') + ' · ' + label : label)}</span>`;
  }
  function taskHtml(task, isNext) {
    if (task.id === editingId) return editHtml(task);
    const active = task.id === S.activeId;
    const subs = task.subs || [];
    const subDone = subs.filter(s => s.done).length;
    const open = expanded.has(task.id) || (active && subs.length && !task.done);
    const stepXp = Math.max(2, Math.round(ML.taskXp(task) / 10));
    const extra = ML.taskBadges ? ML.taskBadges(task) : '';
    const pinned = !!(S.plan && S.plan.day && S.plan.day.id === task.id && S.plan.day.date === today());
    return `<li class="task ${task.done ? 'done' : ''} ${active ? 'active' : ''} ${isNext && !active ? 'next' : ''} ${pinned ? 'pinned' : ''} ${extra.cls || ''}" data-id="${task.id}">
      ${task.done ? '' : `<span class="t-grip" title="${esc(t('pl_drag'))}" aria-hidden="true"><i></i><i></i></span>`}
      <button type="button" class="check" data-act="toggle" aria-label="${esc(task.done ? t('mark_undone') : t('mark_done'))}">
        <svg viewBox="0 0 12 12"><path d="M2 6.5 L5 9 L10 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <div class="t-body">
        <button type="button" class="t-title" data-act="edit" title="${esc(t('edit'))}">${esc(titleOf(task))}</button>
        <div class="t-meta">
          ${isNext && !active ? `<span class="chip next-chip">${esc(t('next_up'))}</span>` : ''}
          ${extra.html || ''}
          <span class="chip t-dur">${task.spent ? fmtMins(task.spent) + ' / ' : ''}${fmtMins(task.mins)}</span>
          <span class="chip p-${task.pri}">${esc(t('pri_' + task.pri))}</span>
          <span class="t-extra">${task.project && ML.projChip ? ML.projChip(task.project) : ''}${dueChip(task)}
          ${task.repeat ? `<span class="chip" title="${esc(t('repeat_' + task.repeat))}">↻ ${esc(t('repeat_' + task.repeat))}</span>` : ''}
          ${subs.length ? `<button type="button" class="chip subs-chip" data-act="subs" aria-expanded="${open}">☰ ${subDone}/${subs.length}</button>` : task.done ? '' : `<button type="button" class="chip subs-chip ghosty" data-act="subs" aria-expanded="${open}">+ ${esc(t('step'))}</button>`}
          ${task.notes ? `<span class="chip" title="${esc(task.notes)}">✎</span>` : ''}
          ${task.sample ? `<span class="chip sample">${esc(t('example'))}</span>` : ''}</span>
        </div>
        ${subs.length ? `<div class="sub-prog" title="${subDone}/${subs.length}"><b style="width:${(subDone / subs.length * 100).toFixed(1)}%"></b></div>` : ''}
        ${open ? `<ul class="subs">${subs.map(s => `<li class="${s.done ? 'done' : ''}"><label><input type="checkbox" data-sub="${s.id}" ${s.done ? 'checked' : ''}><i class="sub-box" aria-hidden="true"></i><span>${esc(s.text)}</span>${!s.done && !s.xpGiven && !task.done && !task.sample ? `<small class="sub-xp">+${stepXp}</small>` : ''}</label></li>`).join('')}</ul>
          ${task.done ? '' : `<form class="sub-add" autocomplete="off"><input type="text" maxlength="100" placeholder="${esc(t('add_subtask_ph'))}" aria-label="${esc(t('add_subtask_ph'))}"><button type="submit" class="small">+</button></form>`}` : ''}
      </div>
      <div class="t-actions">
        ${task.done ? '' : `<button type="button" class="icon-btn t-pin ${pinned ? 'on' : ''}" data-act="pin" aria-pressed="${pinned}" aria-label="${esc(t(pinned ? 'pl_unpin' : 'pl_pin'))}" title="${esc(t(pinned ? 'pl_unpin' : 'pl_pin'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg></button>
        <button type="button" class="${active ? 'is-active' : ''}" data-act="focus">${esc(active ? t('focusing') : t('lock_in'))}</button>`}
        <button type="button" class="icon-btn" data-act="del" aria-label="${esc(t('delete'))}">✕</button>
      </div>
    </li>`;
  }
  function editHtml(task) {
    const minsOpts = [10, 15, 20, 25, 30, 35, 40, 45, 60, 75, 90, 120, 150, 180, 240];
    if (!minsOpts.includes(task.mins)) minsOpts.push(task.mins), minsOpts.sort((a, b) => a - b);
    return `<li class="task editing" data-id="${task.id}"><form class="t-edit" data-id="${task.id}">
      <input type="text" name="title" value="${esc(titleOf(task))}" maxlength="120" required aria-label="${esc(t('task'))}">
      <div class="t-edit-row">
        <label><span>${esc(t('duration'))}</span><select name="mins">${minsOpts.map(m => `<option value="${m}" ${m === task.mins ? 'selected' : ''}>${fmtMins(m)}</option>`).join('')}</select></label>
        <label><span>${esc(t('priority'))}</span><select name="pri">${['high', 'med', 'low'].map(p => `<option value="${p}" ${p === task.pri ? 'selected' : ''}>${esc(t('pri_' + p))}</option>`).join('')}</select></label>
        <label><span>${esc(t('due'))}</span><input type="date" name="due" value="${esc(task.due || '')}"></label>
        <label><span>${esc(t('pl_project'))}</span><input type="text" name="project" maxlength="40" list="pl-projects" value="${esc(task.project || '')}"><datalist id="pl-projects">${(ML.planProjects ? ML.planProjects() : []).map(p => `<option value="${esc(p)}">`).join('')}</datalist></label>
        <label><span>${esc(t('repeat'))}</span><select name="repeat">${['', 'daily', 'weekdays', 'weekly'].map(r => `<option value="${r}" ${r === (task.repeat || '') ? 'selected' : ''}>${esc(r ? t('repeat_' + r) : t('repeat_none'))}</option>`).join('')}</select></label>
      </div>
      <div class="t-edit-subs">
        <span class="label">${esc(t('subtasks'))}</span>
        <ul>${(task.subs || []).map(s => `<li><input type="checkbox" data-esub-done="${s.id}" ${s.done ? 'checked' : ''} aria-label="done"><input type="text" data-esub="${s.id}" value="${esc(s.text)}" maxlength="100"><button type="button" class="icon-btn" data-esub-del="${s.id}" aria-label="${esc(t('delete'))}">✕</button></li>`).join('')}</ul>
        <div class="t-edit-addsub"><input type="text" name="newsub" maxlength="100" placeholder="${esc(t('add_subtask_ph'))}"><button type="button" class="small" data-act="addsub">+</button></div>
      </div>
      <textarea name="notes" rows="2" placeholder="${esc(t('notes_ph'))}">${esc(task.notes || '')}</textarea>
      ${ML.taskEditExtras ? ML.taskEditExtras(task) : ''}
      <div class="t-edit-btns">
        <button type="button" class="small ghost" data-act="cancel">${esc(t('cancel'))}</button>
        <button type="submit" class="small primary">${esc(t('save'))}</button>
      </div>
    </form></li>`;
  }
  // Scattered shows one task as a tarot-sized card (.single-card / .card, styled per theme in app.css). Long titles get a
  // smaller size; when the card's task is completed, the next one turns over into view (a fade with reduced motion).
  // Web Animations, so the reduced-motion CSS rule (animation: none) doesn't cancel the fade.
  let cardId = null;
  function cardFx(ul, li) {
    ul.classList.toggle('single-card', !!li);
    const prev = cardId; cardId = li ? li.dataset.id : null;
    if (!li) return;
    li.classList.add('card');
    const n = li.querySelector('.t-title').textContent.length;
    li.style.setProperty('--card-fs', (n > 70 ? 15 : n > 40 ? 17 : 20) + 'px');
    const was = prev && prev !== cardId && S.tasks.find(x => x.id === prev);
    if (!was || !was.done || !li.animate) return;
    if (ML.reducedMotion()) li.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    else li.animate([{ transform: 'perspective(1000px) rotateY(-180deg)', opacity: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 1, offset: 0.5 }, { transform: 'perspective(1000px) rotateY(0deg)', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.3,.7,.3,1)' });
  }
  function renderTasks() {
    const M = MOODS[S.mood];
    const open = orderedOpen(), done = S.tasks.filter(x => x.done);
    const ul = $('tasks');
    if (!S.tasks.length) {
      ul.innerHTML = `<li class="empty">${esc(t('no_tasks'))}</li>`;
    } else if (!(M.single && !S.showAll) && ML.planRender) {
      ML.planRender(ul, open, done, taskHtml, editingId); // plan.js: groups, sorting, table (3.35)
    } else {
      const shown = M.single && !S.showAll ? open.slice(0, 1) : open;
      if (editingId && !shown.some(x => x.id === editingId) && open.some(x => x.id === editingId)) shown.push(open.find(x => x.id === editingId));
      let html = shown.map((x, i) => taskHtml(x, i === 0)).join('');
      if (M.single && open.length > 1) {
        html += `<li><button type="button" class="more" data-act="more">${esc(S.showAll ? t('show_one') : tn('show_more', open.length - 1))}</button></li>`;
      }
      if (!M.single || S.showAll) html += done.map(x => taskHtml(x, false)).join('');
      ul.innerHTML = html;
    }
    cardFx(ul, M.single && !S.showAll ? ul.querySelector(':scope > .task:not(.editing)') : null);
    $('sort-note').innerHTML = S.tasks.length && (M.single || !ML.planRender) ? t('sorted_for', { mood: `<b>${esc(t('mood_' + S.mood))}</b>`, sort: esc(t('sort_' + M.sort)) }) + (M.single ? ' ' + esc(t('only_next')) : '') : '';
    $('foot-note').textContent = S.tasks.length ? t('open_planned', { n: open.length, m: fmtMins(open.reduce((a, x) => a + x.mins, 0)) }) : '';
    const ed = ul.querySelector('.t-edit input[name=title]');
    if (ed && document.activeElement === document.body) ed.focus();
    emit('tasks:render');
  }
  ML.renderTasks = renderTasks;
  ML.editTask = id => { editingId = id; renderTasks(); }; // plan.js: a title tapped in the table opens the edit form in the list
  // Ticking a step earns a little XP once (a tenth of the task's XP, at least 2); the last step finishes the task.
  // Unticking a step of a finished task reopens it (its XP is not given twice).
  function setSubDone(task, sub, done) {
    if (!task || !sub || !!sub.done === done) return;
    sub.done = done;
    if (done) {
      sub.doneAt = Date.now();
      if (!sub.xpGiven && !task.sample && !task.done) { sub.xpGiven = true; addXp(Math.max(2, Math.round(ML.taskXp(task) / 10))); }
      if (ML.sfx) ML.sfx('sub');
      emit('sub:done', { task, sub });
      if (!task.done && task.subs.every(s => s.done)) { completeTask(task); toast(t('subs_all_done')); }
    } else if (task.done) task.done = false;
    save();
  }
  ML.setSubDone = setSubDone;
  function completeTask(task) {
    task.done = true; task.doneAt = Date.now();
    (task.subs || []).forEach(s => { s.done = true; });
    if (!task.xpGiven && !task.sample) {
      task.xpGiven = true;
      const xp = ML.taskXp(task);
      addXp(xp);
      toast(t('task_done_xp', { xp }));
    }
    if (S.activeId === task.id && !running()) S.activeId = null;
    emit('task:done', task);
  }
  ML.completeTask = completeTask;

  $('tasks').addEventListener('click', e => {
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'more') { S.showAll = !S.showAll; save(); renderTasks(); return; }
    const li = btn.closest('.task'); if (!li) return;
    const id = li.dataset.id, task = S.tasks.find(x => x.id === id);
    if (!task) return;
    if (act === 'toggle') { if (task.done) { task.done = false; } else completeTask(task); }
    if (act === 'del') {
      let gone = false;
      const del = () => { if (gone) return; gone = true; S.tasks = S.tasks.filter(x => x.id !== id); if (S.activeId === id) S.activeId = null; emit('task:deleted', id); save(); renderAll(); };
      // the row folds up and fades before it goes (skipped with reduced motion)
      if (ML.reducedMotion() || !li.animate || li.dataset.leaving) { if (!li.dataset.leaving) del(); return; }
      li.dataset.leaving = '1'; li.style.overflow = 'hidden';
      li.animate([{ opacity: 1, maxHeight: li.offsetHeight + 'px' }, { opacity: 0, maxHeight: '0px', paddingTop: '0px', paddingBottom: '0px', marginTop: '0px' }], { duration: 220, easing: 'ease-in' }).onfinish = del;
      setTimeout(del, 260); // in case the animation never reports (a page in the background)
      return;
    }
    if (act === 'focus') { lockIn({ taskId: id, mins: task.mins }); return; }
    if (act === 'edit') { editingId = id; renderTasks(); return; }
    if (act === 'subs') { expanded.has(id) ? expanded.delete(id) : expanded.add(id); renderTasks(); return; }
    if (act === 'cancel') { editingId = null; renderTasks(); return; }
    if (act === 'addsub') { addSubFromForm(btn.closest('form'), task); return; }
    save(); renderAll();
  });
  $('tasks').addEventListener('change', e => {
    const cb = e.target.closest('[data-sub]'); if (!cb) return;
    const task = S.tasks.find(x => x.id === cb.closest('.task').dataset.id);
    const sub = task && (task.subs || []).find(s => s.id === cb.dataset.sub);
    if (!sub) return;
    if (cb.checked) { const li = cb.closest('li'); li.classList.add('pop'); } // let the tick animation play before re-rendering
    setTimeout(() => { setSubDone(task, sub, cb.checked); renderAll(); }, cb.checked ? 380 : 0);
  });
  // Add a step straight from the task card
  $('tasks').addEventListener('submit', e => {
    const f = e.target.closest('.sub-add'); if (!f) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const task = S.tasks.find(x => x.id === f.closest('.task').dataset.id), inp = f.querySelector('input');
    const text = inp.value.trim(); if (!task || !text) return;
    (task.subs || (task.subs = [])).push({ id: uid(), text, done: false });
    if (task.done) task.done = false;
    expanded.add(task.id); save(); renderTasks();
    const again = $('tasks').querySelector(`.task[data-id="${task.id}"] .sub-add input`); if (again) again.focus();
  }, true);
  function readEditForm(form, task) {
    (task.subs || []).forEach(s => {
      const inp = form.querySelector(`[data-esub="${s.id}"]`); if (inp) s.text = inp.value.trim() || s.text;
      const cb = form.querySelector(`[data-esub-done="${s.id}"]`); if (cb) s.done = cb.checked;
    });
  }
  function addSubFromForm(form, task) {
    readEditForm(form, task);
    const inp = form.querySelector('[name=newsub]');
    const text = inp.value.trim(); if (!text) return;
    (task.subs || (task.subs = [])).push({ id: uid(), text, done: false });
    task.title = form.querySelector('[name=title]').value.trim() || task.title;
    renderTasks();
    const n = $('tasks').querySelector('.t-edit [name=newsub]'); if (n) n.focus();
  }
  $('tasks').addEventListener('keydown', e => {
    if (e.target.name === 'newsub' && e.key === 'Enter') { e.preventDefault(); const f = e.target.closest('form'); addSubFromForm(f, S.tasks.find(x => x.id === f.dataset.id)); }
    if (e.key === 'Escape' && editingId) { editingId = null; renderTasks(); }
  });
  $('tasks').addEventListener('click', e => {
    const del = e.target.closest('[data-esub-del]'); if (!del) return;
    const f = del.closest('form'), task = S.tasks.find(x => x.id === f.dataset.id);
    readEditForm(f, task);
    task.subs = (task.subs || []).filter(s => s.id !== del.dataset.esubDel);
    renderTasks();
  });
  $('tasks').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, task = S.tasks.find(x => x.id === f.dataset.id); if (!task) return;
    readEditForm(f, task);
    const fd = new FormData(f);
    task.title = String(fd.get('title')).trim() || task.title;
    task.mins = +fd.get('mins'); task.pri = fd.get('pri');
    task.due = fd.get('due') || null;
    task.project = String(fd.get('project') || '').trim() || null;
    task.repeat = fd.get('repeat') || '';
    if (task.repeat === 'weekly') task.wd = new Date().getDay();
    task.notes = String(fd.get('notes') || '').trim();
    const ns = String(fd.get('newsub') || '').trim();
    if (ns) (task.subs || (task.subs = [])).push({ id: uid(), text: ns, done: false });
    task.sample = false;
    emit('task:edit-save', { task, form: f });
    editingId = null; save(); renderAll(); toast(t('saved'));
  });
  $('add-form').addEventListener('submit', e => {
    e.preventDefault();
    const raw = $('new-title').value.trim(); if (!raw) return;
    // one-line quick add (plan.js): "Réviser maths 45m demain ! #Partiels" fills duration, date, priority and project
    const q = ML.parseQuick ? ML.parseQuick(raw) : {};
    S.tasks = S.tasks.filter(x => !x.sample);
    const task = { id: uid(), title: q.title || raw, mins: q.mins || +$('new-mins').value, pri: q.pri || $('new-pri').value, done: false, created: Date.now() };
    if (q.due) task.due = q.due;
    const proj = q.project || (S.plan && S.plan.proj) || null; if (proj) task.project = proj;
    S.tasks.push(task);
    $('new-title').value = ''; emit('quick:clear'); save(); renderAll();
    emit('task:added', task); // juice.js slides it in from the field
  });
  $('clear-done').onclick = () => { S.tasks = S.tasks.filter(x => !x.done || x.repeat); save(); renderAll(); };
  armedButton($('clear-all'), 'clear_all', () => { S.tasks = []; S.activeId = null; save(); renderAll(); });

  // Repeating tasks come back undone on the days they repeat
  function resetRepeating() {
    const td = today(), wd = new Date().getDay();
    S.tasks.forEach(task => {
      if (!task.repeat || !task.done || !task.doneAt) return;
      const doneDay = dayKey(new Date(task.doneAt));
      if (doneDay >= td) return;
      const back = task.repeat === 'daily'
        || (task.repeat === 'weekdays' && wd >= 1 && wd <= 5)
        || (task.repeat === 'weekly' && (wd === (task.wd ?? wd) || doneDay <= ML.addDays(td, -7)));
      if (back) { task.done = false; task.xpGiven = false; task.spent = 0; (task.subs || []).forEach(s => s.done = false); }
    });
  }

  /* ---------- Parking lot ---------- */
  $('park-form').addEventListener('submit', e => {
    e.preventDefault();
    const text = $('park-input').value.trim(); if (!text) return;
    S.parked.push({ id: uid(), text, at: Date.now() });
    $('park-input').value = ''; save(); renderParked();
    toast(t('parked_ok'));
    emit('parked');
  });
  function renderParked() {
    const n = S.parked.length;
    $('park-count').textContent = n ? n : '';
    $('parked').innerHTML = n ? S.parked.map(p => `<li data-id="${p.id}">
        <div class="p-text">${esc(p.text)}<span class="p-time">${new Date(p.at).toLocaleString(ML.locale(), { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>
        <div class="t-actions"><button type="button" data-act="task">${esc(t('make_task'))}</button><button type="button" class="icon-btn" data-act="del" aria-label="${esc(t('let_go'))}">✕</button></div>
      </li>`).join('')
      : `<li class="empty">${esc(t('park_empty'))}</li>`;
  }
  $('parked').addEventListener('click', e => {
    const btn = e.target.closest('button[data-act]'); if (!btn) return;
    const id = btn.closest('li').dataset.id, p = S.parked.find(x => x.id === id);
    if (btn.dataset.act === 'task') {
      S.tasks = S.tasks.filter(x => !x.sample);
      S.tasks.push({ id: uid(), title: p.text, mins: 30, pri: 'med', done: false, created: Date.now() });
      toast(t('park_to_task'));
    }
    S.parked = S.parked.filter(x => x.id !== id);
    emit('parked:processed');
    save(); renderAll();
  });
  armedButton($('clear-parked'), 'clear_all', () => { S.parked = []; save(); renderAll(); });

  /* ---------- Tabs ---------- */
  const TABS = { plan: ['t-plan', 'tab-plan'], day: ['t-day', 'tab-day'], cal: ['t-cal', 'tab-cal'], notes: ['t-notes', 'tab-notes'], park: ['t-park', 'tab-park'], grim: ['t-grim', 'tab-grim'], study: ['t-study', 'tab-study'] };
  function setTab(name) {
    if (!TABS[name]) name = 'plan';
    S.tab = name; save();
    for (const [k, [b, p]] of Object.entries(TABS)) { $(b).setAttribute('aria-selected', k === name); $(p).hidden = k !== name; }
    if (name === 'grim') renderGrimoire();
    emit('tab', name);
  }
  for (const k of Object.keys(TABS)) $(TABS[k][0]).onclick = () => setTab(k);
  $('seq-badge').onclick = () => { setTab('grim'); $('t-grim').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  ML.setTab = setTab;

  /* ---------- Timer ---------- */
  const running = () => S.endAt !== null;
  const remainingNow = () => running() ? (S.endAt - Date.now()) / 1000 : S.remaining;
  ML.running = running; ML.remainingNow = remainingNow;
  let tick = null, wakeLock = null, litCount = -1, autoCompacted = false;

  (function buildSigil() {
    const NS = 'http://www.w3.org/2000/svg';
    const mk = (tag, attrs, parent) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); parent.appendChild(el); return el; };
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2 - Math.PI / 2, r1 = i % 5 ? 86 : 83, r2 = 95;
      const p = { x1: 120 + r1 * Math.cos(a), y1: 120 + r1 * Math.sin(a), x2: 120 + r2 * Math.cos(a), y2: 120 + r2 * Math.sin(a) };
      mk('line', p, $('segs-dim'));
      mk('line', Object.assign({ 'data-i': i, visibility: 'hidden', style: '--i:' + i }, p), $('segs-lit')); // --i: the end-of-session light wave
    }
    const runes = $('runes');
    mk('circle', { cx: 120, cy: 120, r: 108, class: 'orbit' }, runes);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, x = 120 + 108 * Math.cos(a), y = 120 + 108 * Math.sin(a), k = i % 4;
      const g = mk('g', { class: 'glyph', transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(i * 30 + 90)})` }, runes);
      if (k === 0) mk('path', { d: 'M0 -4 L3.5 0 L0 4 L-3.5 0 Z' }, g);
      if (k === 1) mk('path', { d: 'M0 -3.5 L3.5 3 L-3.5 3 Z' }, g);
      if (k === 2) { mk('circle', { r: 3 }, g); mk('path', { d: 'M0 -3 V3' }, g); }
      if (k === 3) mk('path', { d: 'M-3 -3 L3 3 M3 -3 L-3 3' }, g);
    }
    const hex = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; hex.push((120 + 68 * Math.cos(a)).toFixed(2) + ',' + (120 + 68 * Math.sin(a)).toFixed(2)); }
    $('hex').setAttribute('points', hex.join(' '));
  })();
  const ARC_C = 2 * Math.PI * 76;
  $('arc').style.strokeDasharray = ARC_C;

  const presetLabel = m => m >= 60 ? Math.floor(m / 60) + 'h' + (m % 60 || '') : m + 'm';
  function renderPresets() {
    const P = MOOD_PRESETS[S.mood] || MOOD_PRESETS.steady;
    const list = S.mode === 'focus' ? P.focus.slice() : P.brk.slice();
    const cur = S.mode === 'focus' ? S.focusMins : S.breakMins;
    const sug = S.mode === 'focus' ? MOODS[S.mood].focus : MOODS[S.mood].brk;
    if (!list.includes(cur)) { list.push(cur); list.sort((a, b) => a - b); } // a custom time shows as its own chip
    $('presets').innerHTML = `<span class="preset-rhythm">${esc(t('rhythm_' + S.mood))}</span>` + list.map(m => `<button type="button" data-m="${m}" aria-pressed="${m === cur}" class="${m === sug ? 'suggested' : ''}"
      title="${m === sug ? esc(t('suggested')) : ''}">${presetLabel(m)}</button>`).join('');
  }
  $('presets').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (running()) { toast(t('pause_first')); return; }
    setDuration(+b.dataset.m);
  });
  $('custom-set').onclick = () => {
    const m = Math.round(+$('custom-mins').value);
    if (!(m >= 1 && m <= 600)) { toast(t('custom_range')); return; }
    if (running()) { toast(t('pause_first')); return; }
    setDuration(m); $('custom-mins').value = '';
  };
  $('custom-mins').addEventListener('keydown', e => { if (e.key === 'Enter') $('custom-set').click(); });

  function setDuration(m) {
    if (S.mode === 'focus') S.focusMins = m; else S.breakMins = m;
    S.moodTimers = S.moodTimers || {};
    S.moodTimers[S.mood] = { focus: S.focusMins, brk: S.breakMins };
    S.total = S.remaining = m * 60; S.endAt = null;
    save(); renderPresets(); renderTimer();
  }
  function setMode(mode, mins) {
    if (running()) stop();
    S.mode = mode;
    if (mode === 'break') S.breakTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    S.total = S.remaining = (mins || (mode === 'focus' ? S.focusMins : S.breakMins)) * 60;
    save(); renderPresets(); renderTimer();
    emit('timer');
  }
  $('m-focus').onclick = () => { if (S.mode !== 'focus') { if (running()) return toast(t('pause_first')); setMode('focus'); } };
  $('m-break').onclick = () => { if (S.mode !== 'break') { if (running()) return toast(t('pause_first')); setMode('break'); } };

  function activeTitle() { const x = S.tasks.find(y => y.id === S.activeId); return x ? titleOf(x) : S.freeTitle; }
  ML.activeTitle = activeTitle;

  // Start a focus session on a task or a free title (used by tasks, the planner and the calendar)
  function lockIn({ taskId = null, title = null, mins }) {
    if (running()) { toast(t('pause_first')); return false; }
    S.activeId = taskId; S.freeTitle = taskId ? null : title;
    if (S.mode !== 'focus') S.mode = 'focus';
    S.focusMins = mins || S.focusMins;
    S.total = S.remaining = S.focusMins * 60;
    S.pendingRating = null;
    start(); renderAll();
    return true;
  }
  ML.lockIn = lockIn;

  function isCompact() { return $('sigil-card').classList.contains('compact'); }
  function renderTimer() {
    const rem = remainingNow(), frac = Math.max(0, rem) / S.total;
    const card = $('sigil-card');
    card.classList.toggle('break-mode', S.mode === 'break');
    card.classList.toggle('running', running());
    card.classList.toggle('compact', !!S.compact);
    $('compact-btn').setAttribute('aria-pressed', !!S.compact);
    $('m-focus').setAttribute('aria-pressed', S.mode === 'focus');
    $('m-break').setAttribute('aria-pressed', S.mode === 'break');
    const clock = fmtClock(rem);
    $('clock').textContent = clock; $('c-clock').textContent = clock;
    $('arc').style.strokeDashoffset = ARC_C * (1 - frac);
    $('tip').setAttribute('transform', `rotate(${(frac * 360).toFixed(2)} 120 120)`); // chronograph pointer at "now" (shown by themes that want it)
    $('c-prog').style.width = ((1 - frac) * 100).toFixed(2) + '%';
    const lit = Math.ceil(frac * 60);
    if (lit !== litCount && !isCompact()) {
      litCount = lit;
      $('segs-lit').querySelectorAll('line').forEach(l => l.setAttribute('visibility', +l.dataset.i < lit ? 'visible' : 'hidden'));
    }
    const title = activeTitle();
    const state = running() ? (S.mode === 'focus' ? t('locked_in') : t('on_break')) : (rem < S.total ? t('paused') : S.mode === 'focus' ? t('ready') : t('break_ready'));
    $('state').textContent = state; $('c-state').textContent = state;
    const sub = S.mode === 'break' ? t(S.breakTip || 'tip_water') : title ? t('working_on', { title: '' }) : t('pick_task');
    $('focus-on').innerHTML = S.mode === 'break' || !title ? esc(sub) : esc(sub) + '<b>' + esc(title) + '</b>';
    $('c-task').textContent = S.mode === 'break' ? t(S.breakTip || 'tip_water') : (title || t('free_focus'));
    const btn = running() ? t('pause') : (rem < S.total ? t('resume') : (S.mode === 'focus' ? t('lock_in_big') : t('start_break')));
    $('start').textContent = btn; $('c-start').textContent = btn;
    document.title = running() ? fmtClock(rem) + ' · ' + (S.mode === 'focus' ? 'LockIN' : t('break')) : 'MerlinsLockIN';
    // Global timer state for CSS and the animated backgrounds: idle | running (focus) | break | paused
    const tState = running() ? (S.mode === 'focus' ? 'running' : 'break') : rem < S.total ? 'paused' : 'idle';
    if (document.documentElement.dataset.timer !== tState) document.documentElement.dataset.timer = tState;
    renderFloat(rem);
    emit('tick', rem);
  }
  ML.renderTimer = renderTimer;

  function start() {
    if (S.remaining <= 0) S.remaining = S.total;
    if (S.remaining >= S.total) { S.pauses = 0; S.curDistr = 0; } // a fresh session
    S.endAt = Date.now() + S.remaining * 1000;
    // With the bottom bar (nav.js) the Timer screen is the full dial, and other screens get a running strip instead
    if (S.autoCompact && innerWidth < 900 && !document.documentElement.classList.contains('mnav-on') && S.mode === 'focus' && !S.compact) { S.compact = true; autoCompacted = true; }
    save(); loop(); bgSchedule();
    if (S.mode === 'focus' && S.block.on) bgSend({ type: 'block', on: true, domains: S.block.domains });
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { wakeLock = l; }).catch(() => {}); } catch (e) {}
    emit('timer');
  }
  function stop(keepAlarm = false) {
    if (running()) S.remaining = Math.max(0, remainingNow());
    S.endAt = null; clearInterval(tick); tick = null;
    try { if (wakeLock) wakeLock.release(); } catch (e) {}
    wakeLock = null;
    if (!keepAlarm) bgSend({ type: 'clear' });
    bgSend({ type: 'block', on: false });
    if (autoCompacted) { S.compact = false; autoCompacted = false; }
    save(); emit('timer');
  }
  function loop() {
    clearInterval(tick);
    tick = setInterval(() => { if (remainingNow() <= 0) complete(); else renderTimer(); }, 250);
    renderTimer();
  }
  function toggleTimer() { emit('gesture'); if (running()) { if (S.mode === 'focus') S.pauses = (S.pauses || 0) + 1; stop(); } else start(); renderTimer(); }
  ML.toggleTimer = toggleTimer;
  $('start').onclick = toggleTimer; $('c-start').onclick = toggleTimer;
  $('reset').onclick = () => {
    const spent = (S.total - Math.max(0, remainingNow())) / 60;
    if (S.mode === 'focus' && spent >= 5) emit('abandon', { mins: spent });
    stop(); S.remaining = S.total; save(); renderTimer();
  };
  const finish = () => { if (S.remaining < S.total || running()) complete(true); else toast(t('start_first')); };
  $('skip').onclick = finish; $('c-skip').onclick = finish;
  $('compact-btn').onclick = () => { S.compact = !S.compact; autoCompacted = false; litCount = -1; save(); renderTimer(); };

  function complete(early = false) {
    const timedOut = running() && remainingNow() <= 0;
    const endedAt = timedOut ? S.endAt : Date.now(); // real end time, even if the panel was closed
    const elapsed = Math.round((S.total - Math.max(0, remainingNow())) / 60);
    // Ending a focus session before half its time counts as abandoning it (the tower loses a floor)
    if (early && S.mode === 'focus' && elapsed >= 1 && elapsed < S.total / 60 / 2) emit('abandon', { mins: elapsed });
    if (timedOut && document.visibilityState === 'visible') bgSend({ type: 'handled', when: S.endAt });
    stop(!early);
    if (S.mode === 'focus') {
      let longBreak = false;
      if (elapsed > 0) {
        const task = S.tasks.find(x => x.id === S.activeId);
        const session = { at: endedAt, start: endedAt - elapsed * 60000, mins: elapsed, title: activeTitle() || t('free_focus'), taskId: S.activeId, mood: S.mood, rating: null, full: !early, pauses: S.pauses || 0, distractions: S.curDistr || 0 };
        S.sessions.push(session);
        if (task) task.spent = (task.spent || 0) + elapsed;
        let xp = early ? elapsed : Math.round(elapsed * 1.25);
        const bonus = ML.sessionBonus ? ML.sessionBonus(session, xp) : null; // mood buff from game.js
        if (bonus && bonus.xp > 0) xp += bonus.xp;
        addXp(xp); session.xp = xp; // kept on the session (end-of-session screen, history)
        S.pendingRating = session.at;
        if (S.cycleDay !== today()) { S.cycle = 0; S.cycleDay = today(); }
        if (elapsed >= 10) S.cycle++;
        longBreak = S.longEvery > 0 && S.cycle > 0 && S.cycle % S.longEvery === 0 && elapsed >= 10;
        toast(t(early ? 'session_xp' : 'session_xp_full', { m: fmtMins(elapsed), xp }) + (bonus && bonus.xp > 0 ? ' · ✦ ' + bonus.label : ''));
        emit('session', session);
      } else toast(t('session_ended'));
      if (S.chime && !early && !(elapsed > 0 && ML.worldEndSound && ML.worldEndSound())) emit('chime'); // the world's own end sound replaces it
      setMode('break', longBreak ? S.longBreak : null);
      if (longBreak) toast(t('long_break', { m: S.longBreak }));
      if (S.parked.length) toast(tn('parked_waiting', S.parked.length));
      if (S.autoBreak && !early) start();
    } else {
      if (S.chime && !early) emit('chime');
      toast(t('break_over'));
      setMode('focus');
    }
    save(); renderAll();
  }

  /* ---------- Focus rating ---------- */
  function renderRating() {
    $('rate').hidden = !S.pendingRating;
    $('rate-btns').innerHTML = [1, 2, 3, 4, 5].map(i => `<button type="button" data-r="${i}"><b>${i}</b>${esc(t('rate_' + i))}</button>`).join('');
  }
  $('rate-btns').addEventListener('click', e => {
    const b = e.target.closest('[data-r]'); if (!b) return;
    const s = S.sessions.find(x => x.at === S.pendingRating);
    if (s) s.rating = +b.dataset.r;
    S.pendingRating = null; save(); renderRating(); renderLog();
    if (S.tab === 'grim') renderGrimoire();
    emit('rated', s);
    toast(t('rated'));
  });
  $('rate-skip').onclick = () => { S.pendingRating = null; save(); renderRating(); };

  /* ---------- Floating timer ---------- */
  let pipWin = null;
  async function openFloat() {
    if (pipWin) { pipWin.focus(); return; }
    if ('documentPictureInPicture' in window) {
      try {
        pipWin = await window.documentPictureInPicture.requestWindow({ width: 300, height: 170 });
        MiniView.mount(pipWin.document, toggleTimer);
        pipWin.addEventListener('pagehide', () => { pipWin = null; });
        renderTimer();
        return;
      } catch (e) { pipWin = null; }
    }
    if (IS_EXT && chrome.windows) { chrome.windows.create({ url: chrome.runtime.getURL('mini.html'), type: 'popup', width: 320, height: 190 }); return; }
    toast(t('float_unavailable'));
  }
  function renderFloat(rem) {
    if (!pipWin) return;
    MiniView.render(pipWin.document, { remaining: rem, total: S.total, running: running(), mode: S.mode, mood: S.mood, task: activeTitle() });
  }
  $('float-btn').onclick = openFloat;
  ML.openFloat = openFloat;

  /* ---------- Notifications ---------- */
  function bgSchedule() { bgSend({ type: 'schedule', when: S.endAt, mode: S.mode, title: activeTitle() }); }
  // Web/PWA notification while the page is open but hidden (the extension uses its background alarms instead)
  ML.notify = (title, body) => {
    if (IS_EXT || !('Notification' in window) || Notification.permission !== 'granted' || document.visibilityState === 'visible') return;
    try { new Notification(title, { body, icon: 'icon192.png' }); } catch (e) {}
  };
  on('session', () => ML.notify(t('notif_session'), t('notif_session_body')));

  /* ---------- Session log ---------- */
  function renderLog() {
    const td = today();
    const todays = S.sessions.filter(s => dayKey(new Date(s.at)) === td).reverse();
    $('log').innerHTML = todays.length
      ? todays.map(l => `<li><span class="mono">${new Date(l.at).toLocaleTimeString(ML.locale(), { hour: '2-digit', minute: '2-digit' })}</span>
          <span class="l-title">${esc(l.title)}</span>
          <span class="stars" title="${esc(l.rating ? t('focus_n', { n: l.rating }) : t('not_rated'))}">${l.rating ? '◆'.repeat(l.rating) + '◇'.repeat(5 - l.rating) : ''}</span>
          <span class="mono">${fmtMins(l.mins)}</span></li>`).join('')
      : `<li class="none">${esc(t('no_sessions'))}</li>`;
  }

  /* ---------- Grimoire (stats) ---------- */
  function bucketOf(ts) { const h = new Date(ts).getHours(); return h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 22 ? 'evening' : 'night'; }
  function groupStats(keyFn, keys) {
    const out = {};
    keys.forEach(k => out[k] = { mins: 0, n: 0, rSum: 0, rN: 0 });
    S.sessions.forEach(s => { const k = keyFn(s); if (!out[k]) return; const o = out[k]; o.mins += s.mins; o.n++; if (s.rating) { o.rSum += s.rating; o.rN++; } });
    for (const k in out) out[k].avg = out[k].rN ? out[k].rSum / out[k].rN : null;
    return out;
  }
  function bestKey(stats) {
    let best = null;
    for (const [k, o] of Object.entries(stats)) if (o.rN >= 2 && (!best || o.avg > stats[best].avg)) best = k;
    return best;
  }
  function rowsHtml(stats, labelFn) {
    const best = bestKey(stats);
    const maxMins = Math.max(1, ...Object.values(stats).map(o => o.mins));
    return Object.entries(stats).map(([k, o]) => {
      const w = o.avg ? (o.avg / 5) * 100 : (o.mins / maxMins) * 100 * 0.25;
      return `<div class="r"><span>${esc(labelFn(k))}</span><span class="r-bar"><b class="${k === best ? 'best' : ''}" style="width:${w.toFixed(0)}%"></b></span>
        <span class="r-val">${o.avg ? o.avg.toFixed(1) + '/5 · ' : ''}${fmtMins(o.mins)}</span></div>`;
    }).join('');
  }
  function heatmapHtml() {
    const weeks = 26, cell = 11, gap = 2;
    const byDay = {};
    S.sessions.forEach(s => { const k = dayKey(new Date(s.at)); byDay[k] = (byDay[k] || 0) + s.mins; });
    const end = new Date(); const endDow = (end.getDay() + 6) % 7; // Monday = 0
    const startD = new Date(end); startD.setDate(end.getDate() - endDow - (weeks - 1) * 7);
    let svg = `<svg class="heat" viewBox="0 0 ${weeks * (cell + gap)} ${7 * (cell + gap)}" role="img" aria-label="${esc(t('heat_label'))}">`;
    for (let w = 0; w < weeks; w++) for (let d = 0; d < 7; d++) {
      const dt = new Date(startD); dt.setDate(startD.getDate() + w * 7 + d);
      if (dt > end) continue;
      const k = dayKey(dt), m = byDay[k] || 0;
      const lvl = m === 0 ? 0 : m < 30 ? 1 : m < 90 ? 2 : m < 180 ? 3 : 4;
      svg += `<rect x="${w * (cell + gap)}" y="${d * (cell + gap)}" width="${cell}" height="${cell}" rx="2" class="h${lvl}"><title>${k} · ${fmtMins(m)}</title></rect>`;
    }
    return svg + '</svg>';
  }
  function renderGrimoire() {
    const s = seqInfo(), st = streaks();
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push({ k: dayKey(d), label: d.toLocaleDateString(ML.locale(), { weekday: 'short' }).slice(0, 3), mins: 0 }); }
    const byDay = Object.fromEntries(days.map(d => [d.k, d]));
    const weekStart = ML.parseDay(days[0].k).getTime();
    const week = S.sessions.filter(x => x.at >= weekStart);
    week.forEach(x => { const d = byDay[dayKey(new Date(x.at))]; if (d) d.mins += x.mins; });
    const weekMins = week.reduce((a, x) => a + x.mins, 0);
    const rated = week.filter(x => x.rating);
    const weekAvg = rated.length ? rated.reduce((a, x) => a + x.rating, 0) / rated.length : null;
    const totalMins = S.sessions.reduce((a, x) => a + x.mins, 0);

    const W = 320, H = 130, top = 16, bottom = 20, max = Math.max(60, ...days.map(d => d.mins));
    const niceMax = Math.ceil(max / 60) * 60, bw = 26, gap = (W - bw * 7) / 7;
    const y = v => top + (H - top - bottom) * (1 - v / niceMax);
    let chart = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('week_chart'))}">`;
    [0, niceMax / 2, niceMax].forEach(v => { chart += `<line class="grid" x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}"/>`; });
    chart += `<text x="${W}" y="${y(niceMax) - 4}" text-anchor="end">${fmtMins(niceMax)}</text>`;
    days.forEach((d, i) => {
      const x = gap / 2 + i * (bw + gap), h = Math.max(d.mins ? 2 : 0, (H - top - bottom) - (y(d.mins) - top));
      chart += `<rect class="bar ${i === 6 ? 'today' : ''}" x="${x}" y="${H - bottom - h}" width="${bw}" height="${h}" rx="2"/>`;
      if (d.mins) chart += `<text class="val" x="${x + bw / 2}" y="${H - bottom - h - 4}" text-anchor="middle">${fmtMins(d.mins)}</text>`;
      chart += `<text x="${x + bw / 2}" y="${H - 5}" text-anchor="middle">${esc(d.label)}</text>`;
    });
    chart += '</svg>';

    const moodStats = groupStats(x => x.mood, Object.keys(MOODS));
    const timeStats = groupStats(x => bucketOf(x.at), ['morning', 'afternoon', 'evening', 'night']);
    const bm = bestKey(moodStats), bt = bestKey(timeStats);
    const insights = [];
    if (bm) insights.push(t('insight_mood', { mood: `<b>${esc(t('mood_' + bm))}</b>`, avg: moodStats[bm].avg.toFixed(1) }));
    if (bt) insights.push(t('insight_time', { time: `<b>${esc(t('time_' + bt))}</b>` }));
    if (!insights.length) insights.push(esc(t('insight_none')));

    // Planned vs actual: how close estimates are, across finished tasks with tracked time
    const est = S.tasks.filter(x => x.done && x.spent > 0);
    const estRatio = est.length ? est.reduce((a, x) => a + x.spent, 0) / est.reduce((a, x) => a + x.mins, 0) : null;

    const ladder = SEQUENCES.map(([xp, name], i) => `<li class="${i < s.i ? 'reached' : ''} ${i === s.i ? 'current' : ''}"><span>${9 - i}</span><span>${name}</span><span>${xp.toLocaleString(ML.locale())}</span></li>`).reverse().join('');

    $('grim').innerHTML = `
      <div class="g-card">
        <div class="seq-big">
          <span class="num">${esc(t('sequence').toUpperCase())} ${s.num}</span>
          <span class="name">${s.name}</span>
          <span class="bar"><b style="width:${(s.frac * 100).toFixed(1)}%"></b></span>
          <span class="sub">${S.xp.toLocaleString(ML.locale())} XP${s.next ? ' · ' + esc(t('xp_to', { n: (s.next - S.xp).toLocaleString(ML.locale()), name: s.nextName })) : ' · ' + esc(t('top_ladder'))}</span>
        </div>
        <p class="insight">${esc(t('xp_rules'))}</p>
      </div>
      <div class="g-row">
        <div class="g-card kpi"><strong>${st.cur}</strong><span>${esc(t('day_streak'))}</span></div>
        <div class="g-card kpi"><strong>${st.best}</strong><span>${esc(t('best_streak'))}</span></div>
        <div class="g-card kpi"><strong>${fmtMins(totalMins)}</strong><span>${esc(t('all_time'))}</span></div>
      </div>
      <div class="g-card">
        <h2>${esc(t('last_7'))}</h2>
        ${chart}
        <p class="insight">${t('this_week', { m: `<b>${fmtMins(weekMins)}</b>`, n: `<b>${week.length}</b>` })}${weekAvg ? ', ' + t('avg_focus', { avg: `<b>${weekAvg.toFixed(1)}/5</b>` }) : ''}.</p>
      </div>
      <div class="g-card">
        <h2>${esc(t('six_months'))}</h2>
        ${heatmapHtml()}
      </div>
      <div class="g-card">
        <h2>${esc(t('what_works'))}</h2>
        <p class="insight">${insights.join(' ')}</p>
        <div class="rows">${rowsHtml(moodStats, k => t('mood_' + k))}</div>
        <div class="rows">${rowsHtml(timeStats, k => t('time_' + k))}</div>
        ${estRatio ? `<p class="insight">${t('estimates', { pct: `<b>${Math.round(estRatio * 100)}%</b>` })}</p>` : ''}
      </div>
      <div class="g-card">
        <h2>${esc(t('ladder'))}</h2>
        <ul class="ladder">${ladder}</ul>
      </div>`;
    emit('grimoire');
  }
  ML.renderGrimoire = renderGrimoire;

  /* ---------- Settings sheet ---------- */
  // Each module adds its own section: ML.settingsSection({ order, group?, render: () => html, bind: root => {} }).
  // group 'advanced' goes in a folded "Advanced" block (recovery, backups, account deletion…), 'info' at the very end:
  // the everyday settings come first and the technical ones stop crowding them.
  const sections = [];
  ML.settingsSection = s => sections.push(s);
  ML.addStrings({ fr: { set_advanced: 'Avancé', set_advanced_hint: 'Sauvegardes, récupération et actions sensibles du compte.' }, en: { set_advanced: 'Advanced', set_advanced_hint: 'Backups, recovery and sensitive account actions.' } });
  let advOpen = false;
  function renderSettings() {
    const body = $('settings-body'), sorted = sections.sort((a, b) => a.order - b.order);
    const html = list => list.map(s => s.render()).filter(Boolean).map(h => `<section class="set-sec">${h}</section>`).join('');
    const adv = sorted.filter(s => s.group === 'advanced');
    body.innerHTML = html(sorted.filter(s => !s.group))
      + (adv.length ? `<details class="set-adv" id="set-adv" ${advOpen ? 'open' : ''}><summary>${esc(t('set_advanced'))}<small>${esc(t('set_advanced_hint'))}</small></summary>${html(adv)}</details>` : '')
      + html(sorted.filter(s => s.group === 'info'));
    const d = $('set-adv'); if (d) d.addEventListener('toggle', () => { advOpen = d.open; emit('settings:advanced', d.open); });
    sections.forEach(s => s.bind && s.bind(body));
  }
  ML.renderSettings = renderSettings;
  // Sport is set aside (3.25): a device that was left on it reopens on Work
  on('loaded', () => { if (S.section === 'sport') S.section = 'work'; });
  $('settings-btn').onclick = () => { renderSettings(); openOverlay('settings'); };

  const sel = (id, opts, cur) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${v}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const chk = (id, label, on) => `<label class="opt"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}> ${esc(label)}</label>`;
  ML.ui = { sel, chk };

  ML.settingsSection({
    order: 10,
    render: () => `<h3>${esc(t('set_general'))}</h3>
      <label class="field"><span>${esc(t('language'))}</span>${sel('set-lang', [['fr', 'Français'], ['en', 'English']], S.lang)}</label>
      <button type="button" class="small ghost" id="set-checkin">${esc(t('change_mood_now'))}</button>
      <button type="button" class="small ghost" id="set-keys">${esc(t('shortcuts'))}</button>`,
    bind: root => {
      root.querySelector('#set-lang').onchange = e => { S.lang = e.target.value; save(); ML.applyI18n(); renderAll(); renderSettings(); };
      root.querySelector('#set-checkin').onclick = () => { closeOverlay('settings'); showCheckin(); };
      root.querySelector('#set-keys').onclick = () => { closeOverlay('settings'); showHelp(); };
    },
  });
  ML.settingsSection({
    order: 20,
    render: () => `<h3>${esc(t('set_timer'))}</h3>
      ${chk('set-chime', t('opt_chime'), S.chime)}
      ${chk('set-autobreak', t('opt_autobreak'), S.autoBreak)}
      ${chk('set-autocompact', t('opt_autocompact'), S.autoCompact)}
      <label class="field"><span>${esc(t('long_every'))}</span>${sel('set-longevery', [[0, t('off')], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']], S.longEvery)}</label>
      <label class="field"><span>${esc(t('long_len'))}</span>${sel('set-longlen', [[10, '10 min'], [15, '15 min'], [20, '20 min'], [25, '25 min'], [30, '30 min']], S.longBreak)}</label>`,
    bind: root => {
      root.querySelector('#set-chime').onchange = e => { S.chime = e.target.checked; save(); };
      root.querySelector('#set-autobreak').onchange = e => { S.autoBreak = e.target.checked; save(); };
      root.querySelector('#set-autocompact').onchange = e => { S.autoCompact = e.target.checked; save(); };
      root.querySelector('#set-longevery').onchange = e => { S.longEvery = +e.target.value; save(); };
      root.querySelector('#set-longlen').onchange = e => { S.longBreak = +e.target.value; save(); };
    },
  });
  ML.settingsSection({
    order: 40,
    render: () => IS_EXT
      ? `<h3>${esc(t('set_block'))}</h3>
        <p class="hint">${esc(t('block_hint'))}</p>
        ${chk('set-block', t('block_on'), S.block.on)}
        <textarea id="set-domains" rows="3">${esc(S.block.domains.join('\n'))}</textarea>`
      : `<h3>${esc(t('set_notifs'))}</h3>
        <p class="hint">${esc(t('notif_hint'))}</p>
        <button type="button" class="small ghost" id="set-notif">${esc(typeof Notification !== 'undefined' && Notification.permission === 'granted' ? t('notif_on') : t('notif_enable'))}</button>`,
    bind: root => {
      if (IS_EXT) {
        root.querySelector('#set-block').onchange = e => { S.block.on = e.target.checked; save(); if (running() && S.mode === 'focus') bgSend({ type: 'block', on: S.block.on, domains: S.block.domains }); };
        root.querySelector('#set-domains').onchange = e => {
          S.block.domains = e.target.value.split(/[\s,]+/).map(d => d.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')).filter(Boolean);
          save();
        };
      } else {
        root.querySelector('#set-notif').onclick = async e => {
          if (typeof Notification === 'undefined') { toast(t('notif_unsupported')); return; }
          try { const p = await Notification.requestPermission(); e.target.textContent = p === 'granted' ? t('notif_on') : t('notif_enable'); if (p !== 'granted') toast(t('notif_denied')); } catch (err) { toast(t('notif_unsupported')); }
        };
      }
    },
  });
  ML.settingsSection({
    order: 90, group: 'advanced',
    render: () => `<h3>${esc(t('backup'))}</h3>
      <p class="hint">${esc(t('backup_hint'))}</p>
      <div class="backup-btns">
        <button type="button" class="ghost small" id="bk-copy">${esc(t('backup_copy'))}</button>
        ${ML.CAN_DOWNLOAD ? `<button type="button" class="ghost small" id="bk-file">${esc(t('backup_file'))}</button>` : ''}
        <button type="button" class="ghost small" id="bk-restore-open">${esc(t('backup_restore'))}</button>
      </div>
      <div class="restore" id="restore" hidden>
        <textarea id="bk-text" rows="4" placeholder="${esc(t('backup_paste'))}"></textarea>
        <input type="file" id="bk-upload" accept=".json,application/json">
        <button type="button" class="small primary" id="bk-restore">${esc(t('backup_replace'))}</button>
      </div>`,
    bind: root => {
      const dump = () => JSON.stringify(Object.assign({}, S, { endAt: null }));
      root.querySelector('#bk-copy').onclick = () => {
        const text = dump();
        const fallback = () => { root.querySelector('#restore').hidden = false; const ta = root.querySelector('#bk-text'); ta.value = text; ta.select(); toast(t('backup_select')); };
        try { navigator.clipboard.writeText(text).then(() => toast(t('backup_copied')), fallback); } catch (e) { fallback(); }
      };
      if (root.querySelector('#bk-file')) root.querySelector('#bk-file').onclick = () => {
        try {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob([dump()], { type: 'application/json' }));
          a.download = `merlinslockin-${today()}.json`;
          document.body.appendChild(a); a.click(); a.remove();
          toast(t('backup_saved'));
        } catch (e) { toast(t('backup_file_fail')); }
      };
      root.querySelector('#bk-restore-open').onclick = () => { const r = root.querySelector('#restore'); r.hidden = !r.hidden; };
      root.querySelector('#bk-upload').onchange = e => {
        const f = e.target.files[0]; if (!f) return;
        const rd = new FileReader(); rd.onload = () => { root.querySelector('#bk-text').value = rd.result; }; rd.readAsText(f);
      };
      armedButton(root.querySelector('#bk-restore'), 'backup_replace', () => {
        let data;
        try { data = JSON.parse(root.querySelector('#bk-text').value); } catch (e) { toast(t('backup_bad')); return; }
        if (!data || !Array.isArray(data.tasks) || !Array.isArray(data.sessions)) { toast(t('backup_missing')); return; }
        // Merged with what's here now (nothing is lost), then sent to the cloud so every device gets it
        stop(); if (ML.snapshot) ML.snapshot('before-restore');
        const merged = ML.auth && ML.auth.merge3 ? ML.auth.merge3(undefined, JSON.parse(JSON.stringify(S)), data, false, '') : data;
        ML.replaceState(Object.assign(merged, { endAt: null }));
        ML.saveNow(); ML.applyI18n(); renderAll(); closeOverlay('settings');
        if (ML.auth && ML.auth.user && ML.auth.forcePush) ML.auth.forcePush().catch(() => {});
        toast(t('backup_restored'));
      });
    },
  });

  /* ---------- Keyboard shortcuts ---------- */
  const KEYS = [['Espace / Space', 'key_space'], ['N', 'key_n'], ['P', 'key_p'], ['S', 'key_s'], ['C', 'key_c'], ['F', 'key_f'], ['1–7', 'key_tabs'], ['?', 'key_help'], ['Échap / Esc', 'key_esc']];
  function showHelp() {
    $('help-keys').innerHTML = KEYS.map(([k, d]) => `<dt><kbd>${esc(k)}</kbd></dt><dd>${esc(t(d))}</dd>`).join('');
    openOverlay('help');
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { ['help', 'settings'].forEach(id => { if (!$(id).hidden) closeOverlay(id); }); return; }
    const tg = e.target;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (ML.isTyping(e) || (tg && tg.tagName === 'BUTTON' && e.key === ' ')) return;
    if (!$('settings').hidden) return;
    const k = e.key.toLowerCase();
    if (e.key === ' ') { e.preventDefault(); toggleTimer(); }
    else if (k === 'n') { e.preventDefault(); setTab('plan'); $('new-title').focus(); }
    else if (k === 'p') { e.preventDefault(); $('park-input').focus(); }
    else if (k === 's') { emit('gesture'); emit('sound:toggle'); }
    else if (k === 'c') $('compact-btn').click();
    else if (k === 'f') openFloat();
    else if ('1234567'.includes(k)) setTab(['plan', 'day', 'cal', 'notes', 'park', 'grim', 'study'][+k - 1]);
    else if (e.key === '?') showHelp();
  });

  /* ---------- PWA install button ---------- */
  let installEvt = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('install-btn').hidden = false; });
  $('install-btn').onclick = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    try { await installEvt.userChoice; } catch (e) {}
    installEvt = null; $('install-btn').hidden = true;
  };
  addEventListener('appinstalled', () => { $('install-btn').hidden = true; toast(t('installed')); });

  // Another window (the mini popup, another tab) changed the saved state
  // Replace the whole state with data from elsewhere (another window, or the cloud via sync.js)
  ML.applyRemote = data => {
    ML.replaceState(data);
    clearInterval(tick); tick = null;
    if (running()) loop();
    // The incoming state can carry another language or mood: re-translate the static text too
    ML.applyI18n(); if (ML.applyTheme) ML.applyTheme();
    renderAll(); emit('timer');
  };
  // Another tab or the mini popup saved: take its copy. If this tab has a change waiting to be saved,
  // merge the two instead of replacing, so neither side's change is lost.
  addEventListener('storage', e => {
    if (e.key !== ML.storageKey() || !e.newValue) return;
    let incoming; try { incoming = JSON.parse(e.newValue); } catch (err) { return; }
    if (ML.savePending && ML.savePending() && ML.auth && ML.auth.merge3) {
      const merged = ML.auth.merge3(undefined, JSON.parse(JSON.stringify(S)), incoming, true, '');
      ML.applyRemote(merged); ML.saveNow();
    } else ML.applyRemote(incoming);
  });

  /* ---------- Render + day change ---------- */
  function renderAll() {
    renderSeq(); renderMood(); ML.keepInputs($('tasks'), renderTasks); renderParked(); renderLog(); renderPresets(); renderRating(); renderTimer();
    if (S.tab === 'grim') renderGrimoire();
    emit('render');
  }
  ML.renderAll = renderAll;

  function dayCheck() {
    const td = today();
    if (S.lastDay === td) return false;
    S.lastDay = td;
    resetRepeating();
    if (S.cycleDay !== td) { S.cycle = 0; S.cycleDay = td; }
    save(); emit('newday', td);
    return true;
  }

  ML.startApp = () => {
    dayCheck();
    setTab(S.tab);
    renderAll();
    if (running()) { if (remainingNow() <= 0) complete(); else loop(); }
    // at launch, energy.js asks the day's energy (or runs the first-launch flow) once the app has started
    setInterval(() => { if (dayCheck()) { renderAll(); if (S.moodDay !== today()) showCheckin(); } emit('minute'); }, 30000);
  };
})();
