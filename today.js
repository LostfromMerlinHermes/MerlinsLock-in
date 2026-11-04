// Today and the home pages (3.60). On phones and the side panel: Today says what to do now (next task, the day's hours,
// what is coming up), and Study and You open on a page of tiles where each section says where you stand. A computer lists
// the same sections in a column and has no home pages. Session mode also lives here: during a Lock in, the screen keeps
// the time, the task and the course tools, and everything else (XP, quests, shop, energies) comes back at the end.
(() => {
  'use strict';
  const { $, S, t, esc, on, save, today, fmtMins } = ML;

  ML.addStrings({
    fr: {
      td_next: 'Prochaine', td_next_e: 'Prochaine, selon ton énergie', td_hours: 'Heures du jour', td_coming: 'À venir', td_quests: 'Quêtes du jour', td_nothing: 'Rien de prévu pour l’instant.', td_add: 'Ajouter une tâche', td_plan: 'Placer dans la journée', td_empty_h: 'Aucun créneau placé aujourd’hui.', td_late: '{n} en retard', td_due: '{n} cartes à réviser', td_due_one: '1 carte à réviser', td_inbox: '{n} dans l’Inbox', td_in: 'dans {n} j', td_today: 'aujourd’hui', td_change: 'Changer', td_now: 'Maintenant', td_done: 'Terminer', td_paused: 'En pause', td_open_timer: 'Ouvrir le minuteur',
      hb_review: 'Réviser', hb_open: 'Ouvrir', hb_subjects: '{n} matières', hb_nosubj: 'Ajoute tes matières', hb_exam: '{name} · {left}', hb_nocards: 'Aucune à réviser', hb_premium: 'Premium', hb_pages: '{n} pages', hb_nopage: 'Page du jour', hb_docs: '{n} documents', hb_nodocs: 'Importe un PDF', hb_lect: '{n} enregistrements', hb_nolect: 'Enregistre un cours', hb_learn: 'Méthodes par situation', hb_streak: 'Série de {n} j', hb_gold: '{n} or', hb_room_on: 'Salle {c}', hb_room: 'Étudier à plusieurs', hb_worlds: 'Mondes', hb_worlds_d: '{w}', hb_guide: 'Toutes les fonctions', hb_settings: 'Compte, son, langue', hb_grim: 'Stats et progression', hb_start: 'Examen', hb_health: 'Check du jour', hb_screen: 'Sites, blocage, pause', yh_prog: 'Série de {n} jours, niveau {lv}', yh_prog0: 'Niveau {lv}', yh_game: 'Tour, expéditions, saison', yh_well_off: 'Point santé et temps d’écran', yh_well_todo: 'Point santé du jour à faire', yh_well_done: 'Point santé du jour fait',
      ss_title: 'Mode séance', ss_tools: 'Outils', ss_opt: 'Mode séance : pendant un Lock in, retirer XP, quêtes, boutique et énergies de l’écran',
    },
    en: {
      td_next: 'Next', td_next_e: 'Next, for your energy', td_hours: 'Hours today', td_coming: 'Coming up', td_quests: 'Daily quests', td_nothing: 'Nothing planned yet.', td_add: 'Add a task', td_plan: 'Place in the day', td_empty_h: 'Nothing placed today.', td_late: '{n} late', td_due: '{n} cards to review', td_due_one: '1 card to review', td_inbox: '{n} in the Inbox', td_in: 'in {n} d', td_today: 'today', td_change: 'Change', td_now: 'Now', td_done: 'Complete', td_paused: 'Paused', td_open_timer: 'Open timer',
      hb_review: 'Review', hb_open: 'Open', hb_subjects: '{n} subjects', hb_nosubj: 'Add your subjects', hb_exam: '{name} · {left}', hb_nocards: 'None to review', hb_premium: 'Premium', hb_pages: '{n} pages', hb_nopage: 'Today’s page', hb_docs: '{n} documents', hb_nodocs: 'Import a PDF', hb_lect: '{n} recordings', hb_nolect: 'Record a lecture', hb_learn: 'Methods by situation', hb_streak: '{n}-day streak', hb_gold: '{n} gold', hb_room_on: 'Room {c}', hb_room: 'Study together', hb_worlds: 'Worlds', hb_worlds_d: '{w}', hb_guide: 'Every feature', hb_settings: 'Account, sound, language', hb_grim: 'Stats and progress', hb_start: 'Exam', hb_health: 'Daily check', hb_screen: 'Sites, blocking, pause', yh_prog: '{n}-day streak, level {lv}', yh_prog0: 'Level {lv}', yh_game: 'Tower, expeditions, season', yh_well_off: 'Health check and screen time', yh_well_todo: 'Today’s check not done yet', yh_well_done: 'Today’s check done',
      ss_title: 'Session mode', ss_tools: 'Tools', ss_opt: 'Session mode: during a Lock in, take XP, quests, shop and energies off the screen',
    },
  });
  ML.defaults(() => ({ sessMode: true }));

  const root = document.documentElement;
  const isPrem = () => !!(ML.isPremium && ML.isPremium());
  const daysTo = k => Math.round((ML.parseDay(k) - ML.parseDay(today())) / 864e5);
  const hm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const nowMins = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const leftTxt = n => (n ? t('td_in', { n }) : t('td_today'));
  const nextExam = () => ((S.study && S.study.exams) || []).filter(x => daysTo(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
  // Cards waiting across every deck (free users have no decks to review: the section is Premium)
  const cardsDue = () => (ML.studyDecks ? ML.studyDecks().reduce((a, d) => a + ML.studyDeckInfo(d.id).due, 0) : 0);
  const firstDueDeck = () => (ML.studyDecks ? ML.studyDecks().find(d => ML.studyDeckInfo(d.id).due > 0) : null);
  const dueLine = n => (n === 1 ? t('td_due_one') : t('td_due', { n }));

  /* ---------- Today ---------- */
  function hoursHtml() {
    const k = today(), now = nowMins(), rows = [];
    (ML.eventsOn ? ML.eventsOn(k) : []).forEach(x => { if (x.start != null) rows.push({ at: x.start, end: x.end, title: x.ev.title, sub: x.ev.notes || '', kind: 'ev', go: 'cal' }); });
    (S.blocks || []).filter(b => b.date === k && !b.done).forEach(b => {
      const task = b.taskId && S.tasks.find(x => x.id === b.taskId);
      rows.push({ at: b.start, end: b.start + b.mins, title: task ? ML.titleOf(task) : b.title || '', sub: fmtMins(b.mins), kind: 'bl', go: 'day' });
    });
    rows.sort((a, b) => a.at - b.at);
    const shown = rows.filter(r => r.end > now).slice(0, 5);
    if (!shown.length) return `<button type="button" class="td-empty" data-go="day"><span>${esc(t('td_empty_h'))}</span><b>${esc(t('td_plan'))}</b></button>`;
    return shown.map(r => `<button type="button" class="td-hour ${r.kind} ${r.at <= now ? 'now' : ''}" data-go="${r.go}"><span class="td-at">${esc(r.at <= now ? t('td_now') : hm(r.at))}</span><span class="td-bl"><b>${esc(r.title)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span></button>`).join('');
  }
  function comingHtml() {
    const td = today(), rows = [], x = nextExam(), due = cardsDue(), late = S.tasks.filter(y => !y.done && y.due && y.due < td).length, inbox = (S.parked || []).length;
    if (x) rows.push(['subjects', x.name, leftTxt(daysTo(x.date)), daysTo(x.date) <= 3]);
    if (due && isPrem()) rows.push(['cards', dueLine(due), t('tab_cards')]);
    if (late) rows.push(['late', t('td_late', { n: late }), t('tab_plan'), true]);
    if (inbox) rows.push(['inbox', t('td_inbox', { n: inbox }), t('pl_v_inbox')]);
    return rows.map(([go, a, b, hot]) => `<button type="button" class="td-row ${hot ? 'hot' : ''}" data-go="${go}"><b>${esc(a)}</b><small>${esc(b)}</small></button>`).join('');
  }
  const clock = () => MiniView.fmtClock(Math.max(0, Math.ceil(ML.remainingNow())));
  function renderToday() {
    const el = $('today'); if (!el || S.tab !== 'today') return;
    const x = ML.orderedOpen()[0], M = ML.MOODS[S.mood], coming = comingHtml();
    // A focus session in progress (running or paused) replaces the next task: its time, Open timer, Pause / Resume
    const live = S.mode === 'focus' && (ML.running() || ML.remainingNow() < S.total);
    const bits = x ? [fmtMins(x.mins), x.due && ML.planDayLabel(x.due), x.project].filter(Boolean).map(esc).join(' · ') : '';
    const card = live ? `<div class="td-next td-live"><small>${esc(t(ML.running() ? 'focusing' : 'td_paused'))}</small><b>${esc(ML.activeTitle() || t('free_focus'))}</b><p class="td-left">${esc(clock())}</p><div class="td-btns"><button type="button" class="primary" data-go="timer">${esc(t('td_open_timer'))}</button><button type="button" class="ghost" data-go="pause">${esc(t(ML.running() ? 'pause' : 'resume'))}</button></div></div>`
      : x ? `<div class="td-next"><small>${esc(t('td_next_e'))}</small><b>${esc(ML.titleOf(x))}</b><p>${bits}</p><div class="td-btns"><button type="button" class="primary" data-lock="${x.id}">${esc(t('lock_in'))}</button><button type="button" class="ghost" data-done="${x.id}">${esc(t('td_done'))}</button></div></div>`
      : `<div class="td-next"><b>${esc(t('td_nothing'))}</b><div class="td-btns"><button type="button" class="primary" data-go="add">${esc(t('td_add'))}</button></div></div>`;
    const html = `<div class="td">
      <button type="button" class="td-energy" data-go="energy"><span class="ep-ico" style="--mood-c:${M.color}">${ML.svgIcon ? ML.svgIcon(M.icon) : ''}</span><span class="td-en-tx"><b>${esc(t('mood_' + S.mood))}</b><small>${esc(ML.worldName(S.mood))}</small></span><span class="td-chg">${esc(t('td_change'))}</span></button>
      ${card}
      <h2 class="td-h">${esc(t('td_hours'))}</h2><div class="td-list">${hoursHtml()}</div>
      ${coming ? `<h2 class="td-h">${esc(t('td_coming'))}</h2><div class="td-list">${coming}</div>` : ''}
      <div id="today-quests"></div>
    </div>`;
    const q = $('quest-strip');
    if (el.dataset.h !== html) {
      if (q && el.contains(q)) restoreQuests(); // kept out of the redraw
      el.innerHTML = html; el.dataset.h = html;
    }
    placeQuests();
  }
  // The quests sit on Today on a phone, in the Plan on a computer (same element)
  function restoreQuests() { const q = $('quest-strip'), w = document.querySelector('.qa-wrap'); if (q && w) w.after(q); }
  function placeQuests() {
    const q = $('quest-strip'), slot = $('today-quests'); if (!q) return;
    if (root.classList.contains('mnav-on') && slot) { if (q.parentElement !== slot) slot.append(q); }
    else if (!root.classList.contains('mnav-on')) restoreQuests();
  }

  /* ---------- Home pages ---------- */
  const tile = (go, name, sub, hot) => `<button type="button" class="hb-tile" data-go="${go}"><b>${esc(name)}</b><small class="${hot ? 'hot' : ''}">${esc(sub)}</small></button>`;
  function renderStudy() {
    const el = $('shome'); if (!el || S.tab !== 'shome') return;
    const prem = isPrem(), x = nextExam(), due = prem ? cardsDue() : 0, subs = (S.subjects || []).length, pages = ((S.notes && S.notes.pages) || []).length, docs = ML.libCount ? ML.libCount() : 0, lect = (S.lectures || []).length;
    const exLine = x ? t('hb_exam', { name: x.name, left: leftTxt(daysTo(x.date)) }) : '';
    const head = x || due ? `<div class="td-next"><small>${esc(x && due ? exLine : t('td_coming'))}</small><b>${esc(due ? dueLine(due) : exLine)}</b><div class="td-btns"><button type="button" class="primary" data-go="${due ? 'review' : 'subjects'}">${esc(t(due ? 'hb_review' : 'hb_open'))}</button></div></div>` : '';
    const html = `<div class="td">${head}<div class="hb-grid">
      ${tile('subjects', t('tab_subjects'), subs ? t('hb_subjects', { n: subs }) : t('hb_nosubj'))}
      ${tile('study', t('tab_cards'), prem ? (due ? dueLine(due) : t('hb_nocards')) : t('hb_premium'), due > 0)}
      ${tile('notes', t('tab_notes'), pages ? t('hb_pages', { n: pages }) : t('hb_nopage'))}
      ${tile('lib', t('nav_lib'), prem ? (docs ? t('hb_docs', { n: docs }) : t('hb_nodocs')) : t('hb_premium'))}
      ${tile('lectures', t('tab_lectures'), prem ? (lect ? t('hb_lect', { n: lect }) : t('hb_nolect')) : t('hb_premium'))}
      ${tile('learn', t('tab_learn'), t('hb_learn'))}
      ${tile('room', t('tab_room'), S.room && S.room.code ? t('hb_room_on', { c: S.room.code }) : t('hb_room'))}
    </div></div>`;
    if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
  }
  // You on a phone (3.66, A1): the tree edge to edge, this week against its goal, the Sunday review and the subject left
  // aside when there is one, then Progress, The game and Wellbeing as rows; the Shop and the Guide as two links
  function renderYou() {
    const el = $('yhome'); if (!el || S.tab !== 'yhome') return;
    const st = ML.streaks ? ML.streaks() : { cur: 0 }, lv = ML.seqInfo(), gold = (S.econ && S.econ.gold) || 0;
    const prog = st.cur && S.goalProfile !== 'start' ? t('yh_prog', { n: st.cur, lv: lv.name }) : t('yh_prog0', { lv: lv.name });
    const hc = ML.priv ? ML.priv.get('healthCfg', { on: false }) : { on: false }, hDone = hc.on && ML.priv && (ML.priv.get('health', {}) || {})[today()];
    const well = !hc.on ? t('yh_well_off') : hDone ? t('yh_well_done') : t('yh_well_todo');
    const row = (go, name, sub) => `<button type="button" class="td-row yh-row" data-go="${go}"><span><b>${esc(name)}</b><small>${esc(sub)}</small></span><svg class="yh-car" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`;
    const html = `<div class="td yh">
      <button type="button" class="yh-tree" data-go="tree" aria-label="${esc(t('tab_tree'))}"><span class="yh-stage" id="yh-stage"></span></button>
      ${ML.treeWeekLine ? ML.treeWeekLine(true) : ''}
      ${ML.youCards ? ML.youCards() : ''}
      <div class="td-list">
        ${row('focus', t('tab_focus'), prog)}
        ${ML.modOn('game') ? row('grim', t('tab_grim'), t('yh_game')) : ''}
        ${ML.modOn('wellbeing') ? row('health', t('tab_health'), well) : ''}
      </div>
      <div class="yh-links"><button type="button" class="ghost" data-go="shop">${esc(t('shop'))} <small>${esc(t('hb_gold', { n: gold.toLocaleString(ML.locale()) }))}</small></button><button type="button" class="ghost" data-go="guide">${esc(t('tab_guide'))}</button></div>
    </div>`;
    if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
    if (ML.treeMount) ML.treeMount($('yh-stage'));
  }
  // The Study column on a computer: a number only when something is waiting
  function renderSubCounts() {
    const c = $('sub-n-cards'), e = $('sub-n-subjects'), x = nextExam(), due = isPrem() ? cardsDue() : 0;
    if (c) c.textContent = due || '';
    if (e) e.textContent = x && daysTo(x.date) <= 30 ? (S.lang === 'fr' ? 'J-' : 'D-') + daysTo(x.date) : '';
  }
  function renderHomes() { renderToday(); renderStudy(); renderYou(); renderSubCounts(); }

  function act(e) {
    const lock = e.target.closest('[data-lock]'), done = e.target.closest('[data-done]'), b = e.target.closest('[data-go]');
    if (lock) { const x = S.tasks.find(y => y.id === lock.dataset.lock); if (x) ML.lockIn({ taskId: x.id, mins: x.mins }); return; }
    if (done) { const x = S.tasks.find(y => y.id === done.dataset.done); if (x) { ML.completeTask(x); save(); ML.renderAll(); } return; }
    if (ML.youCardsClick && e.currentTarget.id === 'yhome' && ML.youCardsClick(e)) return;
    if (!b) return;
    ML.emit('gesture');
    const go = b.dataset.go;
    if (go === 'energy') return ML.energyPicker.open({ cancellable: true });
    if (go === 'pause') return ML.toggleTimer();
    if (go === 'timer') { if (document.documentElement.classList.contains('mnav-on') && ML.setMobileView) ML.setMobileView('timer'); else $('start').focus(); return; }
    if (go === 'add') { ML.setTab('plan'); return ML.planSheet && ML.planSheet(true); }
    if (go === 'late') { S.plan.pview = 'all'; save(); ML.setTab('plan'); return ML.renderTasks(); }
    if (go === 'inbox') { S.plan.pview = 'inbox'; save(); ML.setTab('plan'); return ML.renderTasks(); }
    if (go === 'cards') return ML.setTab('study');
    if (go === 'review') { const d = firstDueDeck(); ML.setTab('study'); return d && ML.studyReview(d.id); }
    if (go === 'shop') return ML.openShop();
    if (go === 'worlds') return ML.openWorlds && ML.openWorlds();
    if (go === 'settings') return $('settings-btn').click();
    ML.setTab(go);
  }
  ['today', 'shome', 'yhome'].forEach(id => $(id).addEventListener('click', act));

  on('tab', () => { renderHomes(); placeQuests(); });
  on('render', renderHomes); on('minute', renderHomes); on('tasks:render', renderHomes); on('lang', renderHomes); on('mood', renderHomes); on('world', renderHomes); on('premium', renderHomes);
  on('started', () => { renderHomes(); placeQuests(); });
  on('timer', renderToday);
  on('tick', () => { const e = S.tab === 'today' && document.querySelector('#today .td-left'); if (e) e.textContent = clock(); });
  matchMedia('(max-width: 899px)').addEventListener('change', () => setTimeout(placeQuests, 0));

  /* ---------- Session mode ---------- */
  function renderSessTools() {
    const el = $('sess-tools'); if (!el) return;
    const html = [['lib', 'nav_lib'], ['notes', 'tab_notes'], ['study', 'tab_cards'], ['quick', 'ss_tools']].map(([k, s]) => `<button type="button" class="small" data-st="${k}">${esc(t(s))}</button>`).join('');
    if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
  }
  $('sess-tools').addEventListener('click', e => {
    const b = e.target.closest('[data-st]'); if (!b) return;
    if (b.dataset.st === 'quick') return ML.quickTools.open();
    ML.setTab(b.dataset.st);
  });
  function syncSession() {
    const going = ML.running && ML.running(), mid = S.remaining < S.total;
    const onx = S.sessMode !== false && S.mode === 'focus' && (going || mid);
    if (root.classList.contains('sess') !== onx) { root.classList.toggle('sess', onx); ML.emit('session-mode', onx); }
  }
  on('timer', syncSession); on('render', syncSession); on('started', () => { renderSessTools(); syncSession(); });
  on('lang', renderSessTools);
  ML.settingsSection({
    order: 31,
    render: () => `<h3>${esc(t('ss_title'))}</h3>${ML.ui.chk('set-sessmode', t('ss_opt'), S.sessMode !== false)}`,
    bind: r => { r.querySelector('#set-sessmode').onchange = e => { S.sessMode = e.target.checked; save(); syncSession(); }; },
  });
})();
