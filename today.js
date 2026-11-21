// Today and the home pages (3.60). On phones and the side panel: Today says what to do now (next task, the day's hours,
// what is coming up), and Study and You open on a page of tiles where each section says where you stand. A computer lists
// the same sections in a column and has no home pages. Session mode also lives here: during a Lock in, the screen keeps
// the time, the task and the course tools, and everything else (XP, quests, shop, energies) comes back at the end.
(() => {
  'use strict';
  const { $, S, t, esc, on, save, today, fmtMins } = ML;

  ML.addStrings({
    fr: {
      td_next: 'Prochaine', td_next_e: 'Prochaine, selon ton énergie', td_hours: 'Heures du jour', td_coming: 'À venir', td_quests: 'Quêtes du jour', td_nothing: 'Rien de prévu pour l’instant.', td_add: 'Ajouter une tâche', td_plan: 'Placer dans la journée', td_empty_h: 'Aucun créneau placé aujourd’hui.', td_late: '{n} en retard', td_due: '{n} cartes à réviser', td_due_one: '1 carte à réviser', td_inbox: '{n} à trier', td_in: 'dans {n} j', td_today: 'aujourd’hui', td_change: 'Changer', td_now: 'Maintenant', td_done: 'Terminer', td_paused: 'En pause', td_open_timer: 'Ouvrir le minuteur',
      yh_days: 'L|M|M|J|V|S|D', hb_review: 'Réviser', hb_open: 'Ouvrir', hb_open_subj: 'Ouvrir Matières', hb_next_exam: 'Prochain examen', hb_cards_free: 'Révision espacée', hb_lib_free: 'Lire et surligner tes PDF', hb_lect_free: 'Enregistrer en prenant des notes',hb_subjects: '{n} matières', hb_nosubj: 'Ajoute tes matières', hb_exam: '{name} · {left}', hb_nocards: 'Aucune à réviser', hb_premium: 'Premium', hb_pages: '{n} pages', hb_nopage: 'Page du jour', hb_docs: '{n} documents', hb_nodocs: 'Importe un PDF', hb_lect: '{n} enregistrements', hb_nolect: 'Enregistre un cours', hb_learn: 'Méthodes par situation', hb_streak: 'Série de {n} j', hb_gold: '{n} or', hb_room_on: 'Salle {c}', hb_room: 'Étudier à plusieurs', hb_worlds: 'Mondes', hb_worlds_d: '{w}', hb_guide: 'Toutes les fonctions', hb_settings: 'Compte, son, langue', hb_grim: 'Stats et progression', hb_start: 'Examen', hb_health: 'Check du jour', hb_screen: 'Sites, blocage, pause', yh_prog: 'Série de {n} jours, niveau {lv}', yh_prog0: 'Niveau {lv}', yh_game: 'Tour, expéditions, saison', yh_well_off: 'Point santé et temps d’écran', yh_well_todo: 'Point santé du jour à faire', yh_well_done: 'Point santé du jour fait',
      ss_title: 'Mode séance', ss_tools: 'Outils', ss_docs: 'Documents · {g}', ss_opt: 'Mode séance : pendant un Lock in, retirer XP, quêtes, boutique et énergies de l’écran',
    },
    en: {
      td_next: 'Next', td_next_e: 'Next, for your energy', td_hours: 'Hours today', td_coming: 'Coming up', td_quests: 'Daily quests', td_nothing: 'Nothing planned yet.', td_add: 'Add a task', td_plan: 'Place in the day', td_empty_h: 'Nothing placed today.', td_late: '{n} late', td_due: '{n} cards to review', td_due_one: '1 card to review', td_inbox: '{n} in the Inbox', td_in: 'in {n} d', td_today: 'today', td_change: 'Change', td_now: 'Now', td_done: 'Complete', td_paused: 'Paused', td_open_timer: 'Open timer',
      yh_days: 'M|T|W|T|F|S|S', hb_review: 'Review', hb_open: 'Open', hb_open_subj: 'Open Subjects', hb_next_exam: 'Next exam', hb_cards_free: 'Spaced repetition', hb_lib_free: 'Read and highlight your PDFs', hb_lect_free: 'Record while you take notes',hb_subjects: '{n} subjects', hb_nosubj: 'Add your subjects', hb_exam: '{name} · {left}', hb_nocards: 'None to review', hb_premium: 'Premium', hb_pages: '{n} pages', hb_nopage: 'Today’s page', hb_docs: '{n} documents', hb_nodocs: 'Import a PDF', hb_lect: '{n} recordings', hb_nolect: 'Record a lecture', hb_learn: 'Methods by situation', hb_streak: '{n}-day streak', hb_gold: '{n} gold', hb_room_on: 'Room {c}', hb_room: 'Study together', hb_worlds: 'Worlds', hb_worlds_d: '{w}', hb_guide: 'Every feature', hb_settings: 'Account, sound, language', hb_grim: 'Stats and progress', hb_start: 'Exam', hb_health: 'Daily check', hb_screen: 'Sites, blocking, pause', yh_prog: '{n}-day streak, level {lv}', yh_prog0: 'Level {lv}', yh_game: 'Tower, expeditions, season', yh_well_off: 'Health check and screen time', yh_well_todo: 'Today’s check not done yet', yh_well_done: 'Today’s check done',
      ss_title: 'Session mode', ss_tools: 'Tools', ss_docs: 'Documents · {g}', ss_opt: 'Session mode: during a Lock in, take XP, quests, shop and energies off the screen',
    },
  });
  ML.addStrings({
    fr: { td_day: 'Ma journée', td_planned: '{m} prévues', td_untimed: 'Sans heure', td_more: '{n} de plus dans Plan', td_at: 'À {h}', td_notes: '{n} pense-bêtes', td_notes_one: '1 pense-bête', td_add_s: '+ Tâche',
      td_st_of: '{a} faites sur {b}', td_st_done: '{a} faites aujourd’hui', td_st_left_one: '1 à faire', td_st_left: '{n} à faire', td_other: 'Autre tâche', td_move: 'Déplacer', td_notes_c: 'Pense-bêtes',
      td_edit: 'Modifier Aujourd’hui', td_edit_h: 'Ce qu’affiche Aujourd’hui', td_edit_d: 'Masque, montre ou déplace chaque partie.', td_edit_ok: 'Terminé', td_up: 'Monter', td_down: 'Descendre', td_always: 'toujours', td_shown: 'Affiché', td_hidden: 'Masqué', td_extras: 'En dessous', td_size: 'Taille de la prochaine', td_size_big: 'Grande', td_size_normal: 'Normale',
      tdp_status: 'Ligne d’état', tdp_next: 'Prochaine tâche', tdp_day: 'Ma journée', tdp_untimed: 'Sans heure', tdp_coming: 'À venir', tdp_quests: 'Quêtes du jour', tdp_notes: 'Pense-bêtes', tdp_energy: 'Énergie' },
    en: { td_day: 'My day', td_planned: '{m} planned', td_untimed: 'No time', td_more: '{n} more in Plan', td_at: 'At {h}', td_notes: '{n} sticky notes', td_notes_one: '1 sticky note', td_add_s: '+ Task',
      td_st_of: '{a} done of {b}', td_st_done: '{a} done today', td_st_left_one: '1 to do', td_st_left: '{n} to do', td_other: 'Another task', td_move: 'Move', td_notes_c: 'Sticky notes',
      td_edit: 'Edit Today', td_edit_h: 'What Today shows', td_edit_d: 'Hide, show or move each part.', td_edit_ok: 'Done', td_up: 'Move up', td_down: 'Move down', td_always: 'always', td_shown: 'Shown', td_hidden: 'Hidden', td_extras: 'Below', td_size: 'Next task size', td_size_big: 'Large', td_size_normal: 'Normal',
      tdp_status: 'Status line', tdp_next: 'Next task', tdp_day: 'My day', tdp_untimed: 'No time', tdp_coming: 'Coming up', tdp_quests: 'Daily quests', tdp_notes: 'Sticky notes', tdp_energy: 'Energy' },
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
  const cardsDue = () => (ML.studyDueAll ? ML.studyDueAll().n : 0); // every deck once (a parent's count includes its sub-decks)
  const dueLine = n => (n === 1 ? t('td_due_one') : t('td_due', { n }));

  /* ---------- Today ---------- */
  // A1 of proposals/matieres-today (3.111): the day as one list. The calendar's timed rows (events, blocks) by hour,
  // tickable here, then the tasks for today (or late, or pinned) that have no time yet, each with « Placer ».
  const CK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5 L5 9 L10 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function dayRows() {
    const k = today(), rows = [];
    (ML.eventsOn ? ML.eventsOn(k) : []).forEach(x => { if (x.start != null) rows.push({ at: x.start, end: Math.min(x.end, 1440), title: x.ev.title, kind: 'ev' }); });
    (S.blocks || []).filter(b => b.date === k && !b.skipped).forEach(b => {
      const task = b.taskId && S.tasks.find(x => x.id === b.taskId);
      rows.push({ at: b.start, end: b.start + b.mins, title: task ? ML.titleOf(task) : ML.dg ? ML.dg.blockName(b) : b.title || '', kind: 'bl', b, task, done: ML.blockDone ? ML.blockDone(b) : !!b.done, check: b.check !== false });
    });
    return rows.sort((a, b) => a.at - b.at);
  }
  function dayHtml(rows) {
    const now = nowMins();
    return rows.map(r => {
      const cur = r.at <= now && r.end > now, past = r.end <= now;
      const box = r.kind === 'bl' && r.check ? `<button type="button" class="td-ck ${r.done ? 'on' : ''}" data-bck="${r.b.id}" aria-pressed="${r.done}" aria-label="${esc(t(r.done ? 'mark_undone' : 'mark_done') + ' : ' + r.title)}">${CK}</button>` : `<span class="td-dot ${r.kind}" aria-hidden="true"></span>`;
      return `<div class="td-dr ${r.kind}${cur ? ' now' : ''}${past && !r.done ? ' past' : ''}${r.done ? ' done' : ''}"><span class="td-at">${esc(hm(r.at))}</span>${box}<button type="button" class="td-dt" data-go="${r.kind === 'ev' ? 'cal' : 'day'}">${esc(r.title)}</button><small>${esc(fmtMins(r.end - r.at))}</small></div>`;
    }).join('');
  }
  function untimed(rows) {
    const td = today(), placed = new Set(rows.filter(r => r.b && r.b.taskId).map(r => r.b.taskId));
    return ML.orderedOpen().filter(x => !x.sample && !placed.has(x.id) && ((x.due && x.due <= td) || x.pin));
  }
  function untimedHtml(list) {
    const td = today();
    return list.slice(0, 6).map(x => `<div class="td-dr nt"><button type="button" class="td-ck" data-tck="${x.id}" aria-label="${esc(t('mark_done') + ' : ' + ML.titleOf(x))}">${CK}</button><button type="button" class="td-dt" data-tedit="${x.id}">${esc(ML.titleOf(x))}${x.due && x.due < td ? `<em class="td-late">${esc(t('late'))}</em>` : ''}</button><small>${esc(fmtMins(x.mins))}</small>${ML.placeSheet ? `<button type="button" class="chip td-place" data-place="${x.id}">${esc(t('pc_place'))}</button>` : ''}</div>`).join('')
      + (list.length > 6 ? `<button type="button" class="td-more" data-go="plan">${esc(t('td_more', { n: list.length - 6 }))}</button>` : '');
  }
  // The card on top: the session in progress, else the block happening now or next today, else the next task
  function nowPick(rows) {
    const now = nowMins(), open = r => r.kind === 'bl' && r.task && !r.task.done && !r.done;
    const cur = rows.find(r => open(r) && r.at <= now && r.end > now); if (cur) return { x: cur.task, label: t('td_now') };
    const nx = rows.find(r => open(r) && r.at > now); if (nx) return { x: nx.task, label: t('td_at', { h: hm(nx.at) }) };
    const x = ML.orderedOpen()[0]; return x ? { x, label: t('td_next_e') } : null;
  }
  function comingHtml() {
    const rows = [], x = nextExam(), due = cardsDue(), inbox = (S.parked || []).length;
    if (x) rows.push(['subjects', x.name, leftTxt(daysTo(x.date)), daysTo(x.date) <= 3]);
    if (due && isPrem()) rows.push(['cards', dueLine(due), t('tab_cards')]);
    if (inbox) rows.push(['inbox', t('td_inbox', { n: inbox }), t('pl_v_inbox')]);
    return rows.map(([go, a, b, hot]) => `<button type="button" class="td-row ${hot ? 'hot' : ''}" data-go="${go}"><b>${esc(a)}</b><small>${esc(b)}</small></button>`).join('');
  }
  const clock = () => MiniView.fmtClock(Math.max(0, Math.ceil(ML.remainingNow())));
  // 3.114 (proposals/today-plan, T1 + T3): a status line, the next task in a large card, the day, then the rest. On a
  // phone the rest (coming up, quests, sticky notes, energy) is one row of chips that unfold; on a computer it sits in
  // a column on the right. Each part can be hidden or moved (S.tdParts); the next task always stays.
  const MAIN = ['status', 'next', 'day', 'untimed'], EXTRA = ['coming', 'quests', 'notes', 'energy'];
  ML.defaults(() => ({ tdParts: { order: MAIN.concat(EXTRA), hide: {}, size: 'big' } }));
  function parts() {
    const p = S.tdParts && typeof S.tdParts === 'object' ? S.tdParts : (S.tdParts = {});
    if (!Array.isArray(p.order)) p.order = [];
    p.order = p.order.filter(k => MAIN.includes(k) || EXTRA.includes(k));
    MAIN.concat(EXTRA).forEach(k => { if (!p.order.includes(k)) p.order.push(k); });
    if (!p.hide || typeof p.hide !== 'object') p.hide = {};
    if (p.size !== 'normal') p.size = 'big';
    return p;
  }
  const shown = k => k === 'next' || !parts().hide[k];
  const isPhone = () => root.classList.contains('mnav-on');
  let editing = false; // computer: edit Today in place
  const minsToday = () => { const d0 = new Date(); d0.setHours(0, 0, 0, 0); return (S.sessions || []).reduce((a, s) => a + (s.at >= +d0 ? s.mins || 0 : 0), 0); };
  // « Autre tâche » skips the suggested task for today
  const skipped = () => (S.tdSkip && S.tdSkip.day === today() ? S.tdSkip.ids : []);
  function statusHtml(rows, free) {
    const done = minsToday(), goal = ML.dayGoal ? ML.dayGoal() : 0;
    const left = rows.filter(r => r.kind === 'bl' && r.check && !r.done && !(r.task && r.task.done)).length + free.length;
    const date = new Date().toLocaleDateString(ML.locale(), { weekday: 'short', day: 'numeric', month: 'short' });
    const pct = goal ? Math.min(100, done / goal * 100) : 0;
    return `<div class="td-status"><div class="td-st-l"><b>${esc(date)}</b><span>${esc(goal ? t('td_st_of', { a: fmtMins(done), b: fmtMins(goal) }) : t('td_st_done', { a: fmtMins(done) }))}</span>${left ? `<span class="td-st-r">${esc(ML.tn('td_st_left', left))}</span>` : ''}</div>${goal ? `<div class="td-st-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${Math.min(done, goal)}" aria-label="${esc(t('td_st_of', { a: fmtMins(done), b: fmtMins(goal) }))}"><i style="width:${pct.toFixed(1)}%"></i></div>` : ''}</div>`;
  }
  function chipsHtml() {
    const P = parts(), out = [];
    P.order.filter(k => EXTRA.includes(k) && shown(k)).forEach(k => {
      if (k === 'coming') {
        const x = nextExam(), due = isPrem() ? cardsDue() : 0, inbox = (S.parked || []).length;
        if (x) out.push(`<button type="button" class="td-chip${daysTo(x.date) <= 3 ? ' hot' : ''}" data-go="subjects">${esc(x.name)} <b>${esc(daysTo(x.date) ? (S.lang === 'fr' ? 'J-' : 'D-') + daysTo(x.date) : t('td_today'))}</b></button>`);
        if (due) out.push(`<button type="button" class="td-chip" data-go="review">${esc(t('tab_cards'))} <b>${due}</b></button>`);
        if (inbox) out.push(`<button type="button" class="td-chip" data-go="inbox">${esc(t('pl_v_inbox'))} <b>${inbox}</b></button>`);
      } else if (k === 'quests' && ML.modOn('game') && ML.questCount) {
        const [a, b] = ML.questCount(); out.push(`<button type="button" class="td-chip" data-go="tdquests" aria-expanded="${!!S.tdQuests}">${esc(t('quests'))} <b>${a}/${b}</b></button>`);
      } else if (k === 'notes') {
        const n = (Array.isArray(S.postits) ? S.postits : []).filter(y => (y.place || 'today') === 'today').length;
        out.push(`<button type="button" class="td-chip" data-go="tdnotes" aria-expanded="${!!S.tdNotes}">${esc(t('td_notes_c'))}${n ? ` <b>${n}</b>` : ''}</button>`);
      } else if (k === 'energy' && !(ML.sober && ML.sober())) {
        const M = ML.MOODS[S.mood]; out.push(`<button type="button" class="td-chip" data-go="energy"><i class="td-chip-dot" style="background:${M.color}"></i>${esc(t('mood_' + S.mood))}</button>`);
      }
    });
    return out.join('');
  }
  function renderToday() {
    const el = $('today'); if (!el || S.tab !== 'today') return;
    const P = parts(), phone = isPhone(), rows = dayRows(), free = untimed(rows), skip = skipped();
    let pk = nowPick(rows);
    if (pk && skip.includes(pk.x.id)) { const y = ML.orderedOpen().find(z => !z.sample && !skip.includes(z.id)); pk = y ? { x: y, label: t('td_next') } : null; }
    const x = pk && pk.x;
    // A focus session in progress replaces the next task on a phone; a computer shows the timer on the left already
    const live = phone && S.mode === 'focus' && (ML.running() || ML.remainingNow() < S.total);
    const bits = x ? [x.due && ML.planDayLabel(x.due), x.project, fmtMins(x.mins)].filter(Boolean).map(esc).join(' · ') : '';
    const big = P.size === 'big';
    const next = live ? `<div class="td-next td-live"><small>${esc(t(ML.running() ? 'focusing' : 'td_paused'))}</small><b>${esc(ML.activeTitle() || t('free_focus'))}</b><p class="td-left">${esc(clock())}</p><div class="td-btns"><button type="button" class="primary" data-go="timer">${esc(t('td_open_timer'))}</button><button type="button" class="ghost" data-go="pause">${esc(t(ML.running() ? 'pause' : 'resume'))}</button></div></div>`
      : x ? `<div class="td-next${big ? ' td-big' : ''}"><small>${esc(pk.label)}</small><b>${esc(ML.titleOf(x))}</b>${bits ? `<p>${bits}</p>` : ''}${big
        ? `<button type="button" class="primary td-go" data-lock="${x.id}">${esc(t('lock_in') + ' · ' + fmtMins(x.mins))}</button><div class="td-sub"><button type="button" class="linkish" data-done="${x.id}">${esc(t('td_done'))}</button><button type="button" class="linkish" data-skip="${x.id}">${esc(t('td_other'))}</button>${!phone && ML.placeSheet ? `<button type="button" class="linkish" data-place="${x.id}">${esc(t('td_move'))}</button>` : ''}</div>`
        : `<div class="td-btns"><button type="button" class="primary" data-lock="${x.id}">${esc(t('lock_in') + ' ' + fmtMins(x.mins))}</button><button type="button" class="ghost" data-done="${x.id}">${esc(t('td_done'))}</button></div>`}</div>`
      : `<div class="td-next"><b>${esc(t('td_nothing'))}</b><div class="td-btns"><button type="button" class="primary" data-go="add">${esc(t('td_add'))}</button></div></div>`;
    const planned = rows.reduce((a, r) => a + (r.kind === 'bl' && !r.done ? r.end - r.at : 0), 0) + free.reduce((a, y) => a + (y.mins || 0), 0);
    const blocks = {
      status: statusHtml(rows, free),
      next,
      day: rows.length || free.length || !shown('untimed') ? (rows.length ? `<div class="td-dayh"><h2 class="td-h">${esc(t('td_day'))}${planned ? ` <small>${esc(t('td_planned', { m: fmtMins(planned) }))}</small>` : ''}</h2><button type="button" class="ghost small td-addt" data-go="add">${esc(t('td_add_s'))}</button></div><div class="td-day">${dayHtml(rows)}</div>`
        : `<button type="button" class="td-empty" data-go="day"><span>${esc(t('td_empty_h'))}</span><b>${esc(t('td_plan'))}</b></button>`) : '',
      untimed: free.length ? `<div class="td-dayh"><h3 class="td-h3">${esc(t('td_untimed'))}</h3>${rows.length ? '' : `<button type="button" class="ghost small td-addt" data-go="add">${esc(t('td_add_s'))}</button>`}</div><div class="td-day">${untimedHtml(free)}</div>` : '',
    };
    if (!rows.length && free.length && shown('untimed')) blocks.day = '';
    // Plain look (3.105, E2): the energy is three words in one row, a tap sets it
    const forme = ML.sober && ML.sober() ? `<div class="td-forme"><span class="label">${esc(t('ep_label'))}</span><div class="seg-toggle" role="group" aria-label="${esc(t('ep_label'))}">${['fired', 'steady', 'scattered'].map(k => `<button type="button" data-forme="${k}" aria-pressed="${S.mood === k}">${esc(t('mood_' + k))}</button>`).join('')}</div></div>` : '';
    const coming = comingHtml();
    const side = {
      coming: coming ? `<h2 class="td-h">${esc(t('td_coming'))}</h2><div class="td-list">${coming}</div>` : '',
      quests: '<div id="today-quests"></div>',
      notes: `<h2 class="td-h">${esc(t('td_notes_c'))}</h2><div id="today-postits"></div>`,
      energy: forme,
    };
    const wrap = (k, html, all) => {
      if (!editing) return shown(k) ? html : '';
      const off = !shown(k), i = all.indexOf(k);
      return `<div class="td-ed${off ? ' off' : ''}" data-part="${k}"><div class="td-ed-tools"><button type="button" class="td-ed-b" data-pmove="${k}:${all[i - 1] || ''}" ${i ? '' : 'disabled'} aria-label="${esc(t('td_up') + ' : ' + t('tdp_' + k))}">${ARR('M6 15l6-6 6 6')}</button><button type="button" class="td-ed-b" data-pmove="${k}:${all[i + 1] || ''}" ${i < all.length - 1 ? '' : 'disabled'} aria-label="${esc(t('td_down') + ' : ' + t('tdp_' + k))}">${ARR('M6 9l6 6 6-6')}</button>${k === 'next' ? `<span class="td-ed-k">${esc(t('td_always'))}</span>` : `<button type="button" class="td-ed-b td-ed-eye" data-phide="${k}" aria-pressed="${!off}">${esc(t(off ? 'td_hidden' : 'td_shown'))}</button>`}</div>${html || `<p class="td-ed-empty">${esc(t('tdp_' + k))}</p>`}</div>`;
    };
    const mains = P.order.filter(k => MAIN.includes(k)), extras = P.order.filter(k => EXTRA.includes(k));
    let body;
    if (phone) {
      const chips = chipsHtml();
      body = `${mains.map(k => shown(k) ? blocks[k] : '').join('')}
        ${chips ? `<div class="td-chips">${chips}</div>` : ''}
        ${shown('quests') ? `<div id="today-quests"${S.tdQuests ? '' : ' hidden'}></div>` : ''}
        ${shown('notes') ? `<div id="today-postits"${S.tdNotes ? '' : ' hidden'}></div>` : ''}
        ${shown('energy') && forme ? forme : ''}
        <button type="button" class="linkish td-edit" data-go="tdedit">${esc(t('td_edit'))}</button>`;
    } else {
      const ext = extras.filter(k => k === 'coming' || k === 'notes' || (k === 'energy' && forme)); // quests live in the Plan and the energy in the left zone on a computer
      const sideHtml = ext.map(k => wrap(k, side[k], ext)).join('');
      body = `${editing ? `<div class="td-edbar"><b>${esc(t('td_edit_h'))}</b><span>${esc(t('td_edit_d'))}</span><label class="td-ed-size"><span>${esc(t('td_size'))}</span><select data-psize>${['big', 'normal'].map(v => `<option value="${v}" ${P.size === v ? 'selected' : ''}>${esc(t('td_size_' + v))}</option>`).join('')}</select></label><button type="button" class="primary small" data-go="tdedit">${esc(t('td_edit_ok'))}</button></div>` : ''}
        <div class="td-cols"><div class="td-main">${mains.map(k => wrap(k, blocks[k], mains)).join('')}</div>${sideHtml.trim() ? `<div class="td-side">${sideHtml}</div>` : ''}</div>
        ${editing ? '' : `<button type="button" class="linkish td-edit" data-go="tdedit">${esc(t('td_edit'))}</button>`}`;
    }
    const html = `<div class="td${editing ? ' td-editing' : ''}">${ML.eveCard ? ML.eveCard() : ''}${body}</div>`;
    const q = $('quest-strip');
    if (el.dataset.h !== html) {
      if (q && el.contains(q)) restoreQuests(); // kept out of the redraw
      const pz = ML.postitZone; if (pz && el.contains(pz)) pz.remove(); // the sticky notes too (lists.js)
      el.innerHTML = html; el.dataset.h = html;
    }
    placeQuests(); if (ML.placePostits && $('today-postits')) ML.placePostits();
  }
  const ARR = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  // Swap a part with the neighbour shown next to it (the computer hides some parts the phone has)
  function moveP(k, other) {
    const P = parts(), i = P.order.indexOf(k), j = P.order.indexOf(other);
    if (i < 0 || j < 0) return;
    [P.order[i], P.order[j]] = [P.order[j], P.order[i]];
    save();
  }
  // Phone: a sheet lists the parts with a switch and two arrows each
  let sheet = null;
  function sheetHtml() {
    const P = parts(), row = (k, list) => { const i = list.indexOf(k), fixed = k === 'next';
      return `<div class="td-sr"><span class="td-sr-n">${esc(t('tdp_' + k))}${fixed ? ` <small>${esc(t('td_always'))}</small>` : ''}</span><button type="button" class="td-ed-b" data-pmove="${k}:${list[i - 1] || ''}" ${i ? '' : 'disabled'} aria-label="${esc(t('td_up') + ' : ' + t('tdp_' + k))}">${ARR('M6 15l6-6 6 6')}</button><button type="button" class="td-ed-b" data-pmove="${k}:${list[i + 1] || ''}" ${i < list.length - 1 ? '' : 'disabled'} aria-label="${esc(t('td_down') + ' : ' + t('tdp_' + k))}">${ARR('M6 9l6 6 6-6')}</button><button type="button" class="td-sw" role="switch" aria-checked="${shown(k)}" ${fixed ? 'disabled' : `data-phide="${k}"`} aria-label="${esc(t('tdp_' + k))}"><i></i></button></div>`; };
    const mains = P.order.filter(k => MAIN.includes(k)), extras = P.order.filter(k => EXTRA.includes(k));
    return `<div class="td-sheet-in" role="dialog" aria-modal="true" aria-labelledby="td-sh-h"><div class="td-sh-hd"><h2 id="td-sh-h">${esc(t('td_edit_h'))}</h2><button type="button" class="primary small" data-go="tdsheetx">${esc(t('td_edit_ok'))}</button></div>
      ${mains.map(k => row(k, mains)).join('')}<p class="td-sh-l">${esc(t('td_extras'))}</p>${extras.map(k => row(k, extras)).join('')}
      <div class="td-sr"><span class="td-sr-n">${esc(t('td_size'))}</span><div class="seg-toggle" role="group" aria-label="${esc(t('td_size'))}">${['big', 'normal'].map(v => `<button type="button" data-psz="${v}" aria-pressed="${P.size === v}">${esc(t('td_size_' + v))}</button>`).join('')}</div></div></div>`;
  }
  function openSheet() {
    if (!sheet) {
      sheet = document.createElement('div'); sheet.className = 'td-sheet';
      sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-go="tdsheetx"]')) return closeSheet(); partAct(e); });
      document.body.append(sheet);
    }
    sheet.innerHTML = sheetHtml(); sheet.hidden = false;
    const b = sheet.querySelector('[data-go="tdsheetx"]'); if (b) b.focus({ preventScroll: true });
  }
  function closeSheet() { if (sheet) sheet.hidden = true; renderToday(); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (sheet && !sheet.hidden) closeSheet(); else if (editing) { editing = false; renderToday(); } } });
  // Clicks shared by the sheet and the in-place editor
  function partAct(e) {
    const mv = e.target.closest('[data-pmove]'), hd = e.target.closest('[data-phide]'), sz = e.target.closest('[data-psz]');
    if (mv) { const [k, o] = mv.dataset.pmove.split(':'); if (o) moveP(k, o); }
    else if (hd) { const P = parts(), k = hd.dataset.phide; if (P.hide[k]) delete P.hide[k]; else P.hide[k] = true; save(); }
    else if (sz) { parts().size = sz.dataset.psz; save(); }
    else return false;
    if (sheet && !sheet.hidden) sheet.innerHTML = sheetHtml();
    renderToday(); return true;
  }
  $('today').addEventListener('change', e => { if (e.target.matches('[data-psize]')) { parts().size = e.target.value; save(); renderToday(); } });
  // The quests sit on Today on a phone, in the Plan on a computer (same element)
  function restoreQuests() { const q = $('quest-strip'), w = document.querySelector('.qa-wrap'); if (q && w) w.after(q); }
  function placeQuests() {
    const q = $('quest-strip'), slot = $('today-quests'); if (!q) return;
    if (root.classList.contains('mnav-on') && slot) { if (q.parentElement !== slot) slot.append(q); }
    else if (!root.classList.contains('mnav-on')) restoreQuests();
  }

  /* ---------- Home pages ---------- */
  // Study on a phone (3.72, C4 A): rows with an icon, like You and Settings. Without Premium a paid tool says what it
  // is for and shows a small lock instead of a bare "Premium". One card on top only when something is waiting.
  const HB_ICON = {
    subjects: '<path d="M4 5h6v14H4zM14 5h6v14h-6z"/>',
    notes: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h5"/>',
    study: '<rect x="3" y="7" width="13" height="12" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v9"/>',
    lib: '<path d="M5 4h4v16H5zM10 4h4v16h-4zM15.5 5l3.5 1-3 14-3.5-1"/>',
    lectures: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    stools: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    learn: '<path d="M12 3a6 6 0 0 0-3 11v3h6v-3a6 6 0 0 0-3-11zM10 21h4"/>',
    room: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 19c1-3 3-4 5-4s4 1 5 4M11 19c1-3 3-4 5-4s4 1 5 4"/>',
  };
  const SVG = (p, cls) => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const CAR = '<path d="M9 6l6 6-6 6"/>', LOCK = '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>';
  const hbRow = (go, name, sub, o = {}) => `<button type="button" class="td-row yh-row hb-row" data-go="${go}"${o.locked ? ` aria-label="${esc(name + ', ' + t('hb_premium'))}"` : ''}>${SVG(HB_ICON[go], 'hb-ico')}<span><b>${esc(name)}</b><small class="${o.hot ? 'hot' : ''}">${esc(sub)}</small></span>${o.locked ? SVG(LOCK, 'hb-lock') : SVG(CAR, 'yh-car')}</button>`;
  function renderStudy() {
    const el = $('shome'); if (!el || S.tab !== 'shome') return;
    const prem = isPrem(), x = nextExam(), due = prem ? cardsDue() : 0, subs = (S.subjects || []).length, pages = ((S.notes && S.notes.pages) || []).length, docs = ML.libCount ? ML.libCount() : 0, lect = (S.lectures || []).length;
    const exLine = x ? t('hb_exam', { name: x.name, left: leftTxt(daysTo(x.date)) }) : '';
    const head = x || due ? `<div class="td-next"><small>${esc(due ? (x ? exLine : t('td_coming')) : t('hb_next_exam'))}</small><b>${esc(due ? dueLine(due) : exLine)}</b><div class="td-btns"><button type="button" class="primary" data-go="${due ? 'review' : 'subjects'}">${esc(t(due ? 'hb_review' : 'hb_open_subj'))}</button></div></div>` : '';
    const html = `<div class="td">${head}${ML.subjectTiles ? ML.subjectTiles() : ""}<div class="td-list hb-list">
      ${hbRow('subjects', t('tab_subjects'), subs ? t('hb_subjects', { n: subs }) : t('hb_nosubj'))}
      ${hbRow('notes', t('tab_notes'), pages ? t('hb_pages', { n: pages }) : t('hb_nopage'))}
      ${hbRow('study', t('tab_cards'), prem ? (due ? dueLine(due) : t('hb_nocards')) : t('hb_cards_free'), { hot: due > 0, locked: !prem })}
      ${hbRow('lib', t('nav_lib'), prem ? (docs ? t('hb_docs', { n: docs }) : t('hb_nodocs')) : t('hb_lib_free'), { locked: !prem })}
      ${hbRow('lectures', t('tab_lectures'), prem ? (lect ? t('hb_lect', { n: lect }) : t('hb_nolect')) : t('hb_lect_free'), { locked: !prem })}
      ${hbRow('stools', t('st_tools'), t('hb_tools'), { locked: !prem })}
      ${hbRow('learn', t('tab_learn'), t('hb_learn'))}
      ${hbRow('room', t('tab_room'), S.room && S.room.code ? t('hb_room_on', { c: S.room.code }) : t('hb_room'))}
    </div></div>`;
    if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
  }
  // You on a phone (3.66, A1): the tree edge to edge, this week against its goal, the Sunday review and the subject left
  // aside when there is one, then Progress, The game and Wellbeing as rows; the Shop and the Guide as two links
  function renderYou() {
    const el = $('yhome'); if (!el || S.tab !== 'yhome') return;
    const st = ML.streaks ? ML.streaks() : { cur: 0 }, lv = ML.seqInfo(), gold = (S.econ && S.econ.gold) || 0;
    const prog = st.cur && S.goalProfile !== 'start' ? t('yh_prog', { n: st.cur, lv: lv.name }) : t('yh_prog0', { lv: lv.name });
    const well = (ML.wellLine && ML.wellLine()) || t('yh_well_off');
    const row = (go, name, sub) => `<button type="button" class="td-row yh-row" data-go="${go}"><span><b>${esc(name)}</b><small>${esc(sub)}</small></span><svg class="yh-car" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`;
    const plain = !!(ML.sober && ML.sober());
    const html = `<div class="td yh">
      ${plain ? weekBars() : `<button type="button" class="yh-tree" data-go="tree" aria-label="${esc(t('tab_tree'))}"><span class="yh-stage" id="yh-stage"></span></button>
      ${ML.treeWeekLine ? ML.treeWeekLine(true) : ''}`}
      ${ML.youCards ? ML.youCards() : ''}
      <div class="td-list">
        ${row('focus', t('tab_focus'), prog)}
        ${ML.modOn('game') ? row('grim', t('tab_grim'), t('yh_game')) : ''}
        ${ML.modOn('wellbeing') ? row('health', t('tab_health'), well) : ''}
      </div>
      <div class="yh-links">${plain ? '' : `<button type="button" class="ghost" data-go="shop">${esc(t('shop'))} <small>${esc(t('hb_gold', { n: gold.toLocaleString(ML.locale()) }))}</small></button>`}<button type="button" class="ghost" data-go="guide">${esc(t('tab_guide'))}</button><button type="button" class="ghost" data-go="settings">${esc(t('settings'))}</button></div>
    </div>`;
    if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
    if (ML.treeMount && !plain) ML.treeMount($('yh-stage'));
  }
  // Plain look (3.105, T1): the week as seven bars instead of the tree, today in the accent, the day goal as a line.
  // A tap opens Progress.
  function weekBars() {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0); d0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
    const from = d0.getTime(), day = 864e5, mins = [0, 0, 0, 0, 0, 0, 0];
    (S.sessions || []).forEach(s => { const i = Math.floor((s.at - from) / day); if (i >= 0 && i < 7) mins[i] += s.mins || 0; });
    const todayI = Math.floor((Date.now() - from) / day), goal = ML.dayGoal ? ML.dayGoal() : 0, top = Math.max(goal, ...mins, 30);
    const names = t('yh_days').split('|');
    const bars = mins.map((m, i) => `<span class="yb-col${i === todayI ? ' now' : ''}${i > todayI ? ' later' : ''}"><i style="height:${m ? Math.max(3, m / top * 100).toFixed(1) : 0}%"></i></span>`).join('');
    const label = mins.map((m, i) => `${names[i]} ${fmtMins(m)}`).join(', ');
    return `<div class="yh-bars">
      ${ML.treeWeekLine ? ML.treeWeekLine(false, true) : ''}
      <button type="button" class="yb-btn" data-go="focus" aria-label="${esc(t('tab_focus') + ' : ' + label)}"><span class="yb-plot">${goal ? `<b class="yb-goal" style="bottom:${(goal / top * 100).toFixed(1)}%"></b>` : ''}${bars}</span>
      <span class="yb-days">${names.map((n, i) => `<span class="${i === todayI ? 'now' : ''}">${esc(n)}</span>`).join('')}</span></button></div>`;
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
    if (e.currentTarget.id === 'today' && editing && partAct(e)) return;
    if (lock) { const x = S.tasks.find(y => y.id === lock.dataset.lock); if (x) ML.lockIn({ taskId: x.id, mins: x.mins }); return; }
    const sk = e.target.closest('[data-skip]');
    if (sk) { const ids = skipped().slice(); ids.push(sk.dataset.skip); S.tdSkip = { day: today(), ids }; save(); renderToday(); return; }
    if (done) { const x = S.tasks.find(y => y.id === done.dataset.done); if (x) { ML.completeTask(x); save(); ML.renderAll(); } return; }
    // the day list (A1): tick a block or a task, place a task, open a task's form
    const bck = e.target.closest('[data-bck]'), tck = e.target.closest('[data-tck]'), place = e.target.closest('[data-place]'), ted = e.target.closest('[data-tedit]');
    if (bck) { if (ML.dg && ML.dg.toggleDone) ML.dg.toggleDone(bck.dataset.bck); return; }
    if (tck) { const x = S.tasks.find(y => y.id === tck.dataset.tck); if (x) { tck.classList.add('on'); setTimeout(() => { ML.completeTask(x); save(); ML.renderAll(); }, ML.reducedMotion() ? 0 : 260); } return; }
    if (place) { if (ML.placeSheet) ML.placeSheet(place.dataset.place); return; }
    if (ted) { ML.setTab('plan'); if (ML.editTask) ML.editTask(ted.dataset.tedit); return; }
    if (ML.youCardsClick && e.currentTarget.id === 'yhome' && ML.youCardsClick(e)) return;
    const sjt = e.target.closest('[data-sjt]'); if (sjt) { if (ML.openSubject) ML.openSubject(sjt.dataset.sjt); return; }
    const fm = e.target.closest('[data-forme]');
    if (fm) { if (fm.dataset.forme !== S.mood) ML.setMood(fm.dataset.forme); return; }
    if (!b) return;
    ML.emit('gesture');
    const go = b.dataset.go;
    if (go === 'energy') return ML.energyPicker.open({ cancellable: true });
    if (go === 'pause') return ML.toggleTimer();
    if (go === 'tdnotes') { S.tdNotes = !S.tdNotes; save(); renderToday(); return; }
    if (go === 'tdquests') { S.tdQuests = !S.tdQuests; if (S.tdQuests && S.plan) S.plan.qOpen = true; save(); renderToday(); if (ML.renderQuestStrip) ML.renderQuestStrip(); return; }
    if (go === 'tdedit') { if (isPhone()) return openSheet(); editing = !editing; renderToday(); return; }
    if (go === 'evecheck') return ML.openCheck && ML.openCheck();
    if (go === 'evenot') return ML.eveNot && ML.eveNot();
    if (go === 'timer') { if (document.documentElement.classList.contains('mnav-on') && ML.setMobileView) ML.setMobileView('timer'); else $('start').focus(); return; }
    if (go === 'add') { ML.setTab('plan'); return ML.planSheet && ML.planSheet(true); }
    if (go === 'late') { S.plan.pview = 'all'; save(); ML.setTab('plan'); return ML.renderTasks(); }
    if (go === 'inbox') { S.plan.pview = 'inbox'; save(); ML.setTab('plan'); return ML.renderTasks(); }
    if (go === 'cards') return ML.setTab('study');
    if (go === 'review') { ML.setTab('study'); return ML.studyReviewAll && ML.studyReviewAll(); }
    if (go === 'stools') return ML.openStudyTools && ML.openStudyTools();
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
    // the task's project has a Library group of the same name (3.71, B2): "Documents · Maths" opens that group
    const task = S.tasks.find(x => x.id === S.activeId), lg = task && task.project && ML.libGroupInfo ? ML.libGroupInfo(task.project) : null;
    const html = [['lib', 'nav_lib'], ['notes', 'tab_notes'], ['study', 'tab_cards'], ['quick', 'ss_tools']].map(([k, s]) => k === 'lib' && lg
      ? `<button type="button" class="small" data-st="lib" data-g="${esc(lg.id)}">${esc(t('ss_docs', { g: lg.name }))}</button>`
      : `<button type="button" class="small" data-st="${k}">${esc(t(s))}</button>`).join('');
    if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
  }
  $('sess-tools').addEventListener('click', e => {
    const b = e.target.closest('[data-st]'); if (!b) return;
    if (b.dataset.st === 'quick') return ML.quickTools.open();
    if (b.dataset.g && ML.libOpenGroup) return ML.libOpenGroup(b.dataset.g);
    ML.setTab(b.dataset.st);
  });
  function syncSession() {
    const going = ML.running && ML.running(), mid = S.remaining < S.total;
    const onx = S.sessMode !== false && S.mode === 'focus' && (going || mid);
    if (root.classList.contains('sess') !== onx) { root.classList.toggle('sess', onx); ML.emit('session-mode', onx); }
  }
  on('timer', syncSession); on('render', syncSession); on('started', () => { renderSessTools(); syncSession(); });
  on('lang', renderSessTools); on('timer', renderSessTools); on('lib:groups', renderSessTools);
  ML.settingsSection({
    order: 31, cat: 'focus',
    render: () => `<h3>${esc(t('ss_title'))}</h3>${ML.ui.chk('set-sessmode', t('ss_opt'), S.sessMode !== false)}`,
    bind: r => { r.querySelector('#set-sessmode').onchange = e => { S.sessMode = e.target.checked; save(); syncSession(); }; },
  });
})();
