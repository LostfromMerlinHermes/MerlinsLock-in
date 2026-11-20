// Subjects (3.58, Study space): one list of subjects shared by tasks, sessions, decks and exams, with the time spent on
// each, the exams to come (a countdown also sits under the energy on the Timer screen) and the grades: weighted average
// and the mark needed to reach a target. Free. Placing the spaced revision blocks stays Premium (ML.planExam in study.js).
// S.subjects: [{ id, name, color, coef, target, grades: [{ id, label, value, max, coef, date }] }]
(() => {
  'use strict';
  const { $, S, t, esc, on, save, uid, today, addDays, toast } = ML;

  ML.addStrings({
    fr: {
      tab_subjects: 'Matières', sj_new_exam: 'Nouvel examen', sj_new: 'Nouvelle matière', sj_close: 'Fermer',sj_h_exams: 'Examens', sj_h_subjects: 'Tes matières', sj_add_ph: 'Nouvelle matière (ex. Droit civil)', sj_add: 'Ajouter', sj_empty: 'Ajoute tes matières : tu verras le temps passé, tes notes et tes examens au même endroit.',
      sj_week: '{m} cette semaine', sj_total: '{m} en tout', sj_avg: 'Moyenne', sj_overall: 'Moyenne générale', sj_no_grade: 'Pas encore de note', sj_grades: 'Notes', sj_grade_label: 'Contrôle', sj_grade_value: 'Note', sj_grade_max: 'Sur', sj_coef: 'Coef', sj_add_grade: 'Ajouter la note',
      sj_target: 'Objectif', sj_next_coef: 'Coef du prochain contrôle', sj_need: 'Il te faut {n}/20 au prochain contrôle.', sj_need_done: 'Objectif déjà atteint, même avec 0 au prochain.', sj_need_no: 'Il faudrait {n}/20 : objectif hors de portée avec ce coef.',
      sj_delete: 'Supprimer la matière', sj_deck: 'Paquet lié', sj_deck_none: 'Aucun', sj_task_field: 'Matière', sj_none: 'Aucune', sj_exam_name: 'Examen', sj_exam_ph: 'Partiel de droit', sj_exam_add: 'Ajouter l’examen', sj_exam_plan: 'Placer des révisions espacées dans mon Calendrier', sj_exam_hours: 'Heures de révision', sj_exam_ch: 'Chapitres', sj_exam_ch_ph: 'Facultatif', sj_exam_prem: 'Avec Premium : des révisions espacées se placent seules dans ton Calendrier.', sj_exam_added: 'Examen ajouté au Calendrier.', sj_exam_none: 'Aucun examen à venir.', sj_countdown: '{name} · {left}', sj_today: 'aujourd’hui', sj_days: 'J-{n}',
    },
    en: {
      tab_subjects: 'Subjects', sj_new_exam: 'New exam', sj_new: 'New subject', sj_close: 'Close',sj_h_exams: 'Exams', sj_h_subjects: 'Your subjects', sj_add_ph: 'New subject (e.g. Civil law)', sj_add: 'Add', sj_empty: 'Add your subjects: time spent, grades and exams in one place.',
      sj_week: '{m} this week', sj_total: '{m} in total', sj_avg: 'Average', sj_overall: 'Overall average', sj_no_grade: 'No grade yet', sj_grades: 'Grades', sj_grade_label: 'Test', sj_grade_value: 'Grade', sj_grade_max: 'Out of', sj_coef: 'Weight', sj_add_grade: 'Add the grade',
      sj_target: 'Target', sj_next_coef: 'Weight of the next test', sj_need: 'You need {n}/20 on the next test.', sj_need_done: 'Target already reached, even with 0 on the next test.', sj_need_no: 'You would need {n}/20: out of reach with this weight.',
      sj_delete: 'Delete the subject', sj_deck: 'Linked deck', sj_deck_none: 'None', sj_task_field: 'Subject', sj_none: 'None', sj_exam_name: 'Exam', sj_exam_ph: 'Law midterm', sj_exam_add: 'Add the exam', sj_exam_plan: 'Place spaced revision in my Day', sj_exam_hours: 'Revision hours', sj_exam_ch: 'Chapters', sj_exam_ch_ph: 'Optional', sj_exam_prem: 'With Premium: spaced revision places itself in your Day.', sj_exam_added: 'Exam added to the Calendar.', sj_exam_none: 'No exam coming up.', sj_countdown: '{name} · {left}', sj_today: 'today', sj_days: 'D-{n}',
    },
  });
  ML.addStrings({
    fr: { sj_less: 'Moins', sj_all: 'Tout voir ({n})', sj_p_exam: '{name} {left}', sj_k_sheet: 'Fiche', sj_k_note: 'Note', sj_k_audio: 'Audio', sj_due: '{n} à revoir', sj_upto: 'à jour', sj_add_items: '+ Ajouter', sj_lock: 'Lock in {s}', sj_review: 'Réviser {n} cartes', sj_todo: 'À faire', sj_task_ph: 'Tâche pour {s}', sj_docs: 'Documents', sj_new_note: '+ Note', sj_docs_hint: 'Ajoute des PDF, des pages du Notebook ou des enregistrements avec « + Ajouter ». Un dossier de la Bibliothèque qui porte le nom de la matière y entre tout seul.', sj_open_n: '{n} tâches', sj_open_n_one: '1 tâche', sj_add_to: 'Ajouter à {s}', sj_add_none: 'Rien d’autre à ajouter ici.', sj_add_n: 'Ajouter {n}', sj_added: '{n} ajouté(s)', sj_grades20: 'Notes sur 20' },
    en: { sj_less: 'Less', sj_all: 'See all ({n})', sj_p_exam: '{name} {left}', sj_k_sheet: 'Sheet', sj_k_note: 'Note', sj_k_audio: 'Audio', sj_due: '{n} to review', sj_upto: 'up to date', sj_add_items: '+ Add', sj_lock: 'Lock in {s}', sj_review: 'Review {n} cards', sj_todo: 'To do', sj_task_ph: 'Task for {s}', sj_docs: 'Documents', sj_new_note: '+ Note', sj_docs_hint: 'Add PDFs, Notebook pages or recordings with “+ Add”. A Library folder named like the subject joins it on its own.', sj_open_n: '{n} tasks', sj_open_n_one: '1 task', sj_add_to: 'Add to {s}', sj_add_none: 'Nothing else to add here.', sj_add_n: 'Add {n}', sj_added: '{n} added', sj_grades20: 'Grades' },
  });
  ML.defaults(() => ({ subjects: [], spaceTab: {}, firstSeen: null }));

  const COLORS = ['#5d8aa8', '#b56e8a', '#8f8a4f', '#7d6bb8', '#4f9a84', '#c0784a', '#a35d5d', '#5f7f58'];
  const list = () => S.subjects || (S.subjects = []);
  const byId = id => list().find(x => x.id === id);
  const exams = () => ((S.study && S.study.exams) || []);
  const daysTo = k => Math.round((ML.parseDay(k) - ML.parseDay(today())) / 864e5);
  const weekStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
  const fmt = n => (Math.round(n * 100) / 100).toLocaleString(ML.locale());
  const adding = { exam: false, subj: false }; // the add forms stay behind a + button until asked for
  const plusBtn = (k, key) => `<button type="button" class="ghost small sj-plus" data-sj-plus="${k}" aria-expanded="${adding[k]}">${adding[k] ? esc(t('sj_close')) : '+ ' + esc(t(key))}</button>`;

  /* ---------- Grades ---------- */
  const on20 = g => (g.value / (g.max || 20)) * 20;
  function average(sub) {
    const gs = sub.grades || [], C = gs.reduce((a, g) => a + (g.coef || 1), 0);
    return C ? gs.reduce((a, g) => a + on20(g) * (g.coef || 1), 0) / C : null;
  }
  function overall() {
    const rows = list().map(x => [average(x), x.coef || 1]).filter(r => r[0] != null), C = rows.reduce((a, r) => a + r[1], 0);
    return C ? rows.reduce((a, r) => a + r[0] * r[1], 0) / C : null;
  }
  // The mark out of 20 needed on a next test of weight c to reach the target
  ML.neededMark = (grades, target, c) => { const C = grades.reduce((a, g) => a + (g.coef || 1), 0), sum = grades.reduce((a, g) => a + on20(g) * (g.coef || 1), 0); return (target * (C + c) - sum) / c; };
  const needText = sub => {
    if (sub.target == null || !(sub.nextCoef > 0)) return '';
    const n = ML.neededMark(sub.grades || [], sub.target, sub.nextCoef);
    return n <= 0 ? t('sj_need_done') : n > 20 ? t('sj_need_no', { n: fmt(n) }) : t('sj_need', { n: fmt(n) });
  };

  /* ---------- Time ---------- */
  const minsOf = (id, from = 0) => (S.sessions || []).reduce((a, s) => a + (s.subject === id && s.at >= from ? s.mins : 0), 0);
  on('session', s => {
    const task = s && s.taskId && S.tasks.find(x => x.id === s.taskId), sub = task && task.subject; if (!sub) return;
    const stored = S.sessions.find(x => x.at === s.at) || s; stored.subject = sub; save();
  });

  /* ---------- Tasks: a Subject field in the task's form, its name on the row ---------- */
  // 3.111: the Subject is a chip of the task form (app.js), saved from its hidden field here
  on('task:edit-save', ({ task, form }) => { const f = form.querySelector('[name=subject]'); if (f) { if (f.value) task.subject = f.value; else delete task.subject; } });
  let chained = false;
  on('started', () => { // after mail.js has chained its own badges
    if (chained) return; chained = true;
    const prev = ML.taskBadges;
    ML.taskBadges = task => { const r = prev ? prev(task) : { html: '', cls: '' }, x = task.subject && byId(task.subject); return x ? Object.assign({}, r, { html: `<span class="chip sj-chip" style="--pc:${x.color}"><i></i>${esc(x.name)}</span>${r.html || ''}` }) : r; };
    if (ML.renderTasks) ML.renderTasks();
  });

  /* ---------- Exam countdown on the Timer screen ---------- */
  const cd = document.createElement('button');
  cd.type = 'button'; cd.className = 'sj-count'; cd.id = 'sj-count'; cd.hidden = true;
  const foot = document.querySelector('.mood-foot'); if (foot) foot.append(cd);
  cd.onclick = () => ML.setMobileView('subjects');
  const nextExam = () => exams().filter(x => daysTo(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
  function renderCount() {
    const x = nextExam(); cd.hidden = !x; if (!x) return;
    const n = daysTo(x.date);
    cd.textContent = t('sj_countdown', { name: x.name, left: n ? t('sj_days', { n }) : t('sj_today') });
    cd.classList.toggle('soon', n <= 3);
  }

  /* ---------- The tab ---------- */
  function examHtml(x) {
    const n = daysTo(x.date), sub = x.subject && byId(x.subject), done = S.blocks.filter(b => b.exam === x.id && b.done).length, total = S.blocks.filter(b => b.exam === x.id).length;
    return `<li><div class="ex-count ${n <= 3 ? 'soon' : ''}"><b>${n ? esc(t('sj_days', { n })) : esc(t('sj_today'))}</b></div>
      <div class="ex-info"><b>${esc(x.name)}</b><small>${esc(ML.parseDay(x.date).toLocaleDateString(ML.locale(), { weekday: 'short', day: 'numeric', month: 'long' }))}${sub ? ' · ' + esc(sub.name) : ''}${total ? ' · ' + esc(t('ex_sessions', { d: done, n: total })) : ''}</small>
      ${total ? `<i class="ex-bar"><em style="width:${(done / total * 100).toFixed(0)}%"></em></i>` : ''}</div>
      <button type="button" class="icon-btn" data-sj-exdel="${x.id}" aria-label="${esc(t('delete'))}">✕</button></li>`;
  }
  // 3.111: a card opens the subject's page; the grades moved into that page (gradesHtml)
  function cardHtml(x) {
    const avg = average(x), wk = minsOf(x.id, weekStart()), all = minsOf(x.id);
    return `<li class="sj-card" style="--pc:${x.color}">
      <button type="button" class="sj-head" data-sjt="${x.id}"><i class="sj-dot"></i><span class="sj-name"><b>${esc(x.name)}</b><small>${esc(t('sj_week', { m: ML.fmtMins(wk) }))} · ${esc(t('sj_total', { m: ML.fmtMins(all) }))}</small></span><strong class="sj-avg">${avg == null ? '–' : fmt(avg)}</strong></button></li>`;
  }
  function gradesHtml(x) {
    const decks = (S.study && S.study.decks) || [], linked = decks.find(d => d.subject === x.id), isOpen = true;
    return `${isOpen ? `<div class="sj-body">
        <span class="label">${esc(t('sj_grades'))}</span>
        ${(x.grades || []).length ? `<ul class="sj-grades">${x.grades.map(g => `<li><span>${esc(g.label || t('sj_grade_label'))}</span><b>${fmt(g.value)}/${fmt(g.max || 20)}</b><small>${esc(t('sj_coef'))} ${fmt(g.coef || 1)}</small><button type="button" class="icon-btn" data-sj-gdel="${g.id}" data-sj="${x.id}" aria-label="${esc(t('delete'))}">✕</button></li>`).join('')}</ul>` : `<p class="hint">${esc(t('sj_no_grade'))}</p>`}
        <form class="sj-gform" data-sj-gadd="${x.id}" autocomplete="off">
          <label class="sj-gl"><span>${esc(t('sj_grade_label'))}</span><input type="text" name="label" maxlength="40"></label>
          <label><span>${esc(t('sj_grade_value'))}</span><input type="text" inputmode="decimal" name="value" required></label>
          <label><span>${esc(t('sj_grade_max'))}</span><input type="text" inputmode="decimal" name="max" value="20"></label>
          <label><span>${esc(t('sj_coef'))}</span><input type="text" inputmode="decimal" name="coef" value="1"></label>
          <button type="submit" class="small">${esc(t('sj_add_grade'))}</button>
        </form>
        <div class="sj-need"><label><span>${esc(t('sj_target'))}</span><input type="text" inputmode="decimal" data-sj-target="${x.id}" value="${x.target == null ? '' : esc(String(x.target))}"></label>
          <label><span>${esc(t('sj_next_coef'))}</span><input type="text" inputmode="decimal" data-sj-nextcoef="${x.id}" value="${x.nextCoef == null ? '' : esc(String(x.nextCoef))}"></label>
          <p class="sj-need-out" id="sj-need-${x.id}" aria-live="polite">${esc(needText(x))}</p></div>
        ${decks.length ? `<label class="sj-deck"><span>${esc(t('sj_deck'))}</span><select data-sj-deck="${x.id}"><option value="">${esc(t('sj_deck_none'))}</option>${decks.map(d => `<option value="${d.id}" ${linked && linked.id === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label>` : ''}
        <button type="button" class="small ghost danger" id="sj-del-${x.id}">${esc(t('sj_delete'))}</button>
      </div>` : ''}`;
  }

  /* ---------- The subject's page (3.111, M2 of proposals/matieres-today) ---------- */
  // One page that scrolls: the exam to come and two buttons (Lock in, Review), then the tasks, the documents (Library,
  // Notebook pages, recordings), the decks, the exams and the grades. « Ajouter » (D3) picks existing items for it.
  let pageId = null, docsCache = { id: null, list: [] }, lockSubj = null;
  const secOpen = new Set();
  const decksOf = id => ((S.study && S.study.decks) || []).filter(d => d.subject === id);
  const dueOf = id => (ML.studyDeckInfo ? decksOf(id).reduce((a, d) => a + (ML.studyDeckInfo(d.id).due || 0), 0) : 0);
  const pagesOf = id => ((S.notes && S.notes.pages) || []).filter(p => p.subject === id);
  const lecturesOf = id => (S.lectures || []).filter(l => l.subject === id);
  const tasksOf = id => S.tasks.filter(x => !x.done && x.subject === id).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
  const examsOf = id => exams().filter(x => x.subject === id && daysTo(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  const KIND = { pdf: 'PDF', image: 'Photo', sheet: 'sj_k_sheet' };
  function refreshDocs(id) {
    if (!ML.libDocsOf) return;
    ML.libDocsOf(id).then(list => { const was = docsCache.id === id ? docsCache.list.map(d => d.id).join() : null; docsCache = { id, list }; if (pageId === id && S.tab === 'subjects' && was !== list.map(d => d.id).join()) render(); }).catch(() => {});
  }
  const sec = (key, title, n, rows, extra = '') => {
    const open = secOpen.has(key), shown = open ? rows : rows.slice(0, 3);
    return `<section class="sjp-sec"><div class="sjp-sh"><h3>${esc(title)}${n ? ` <small>${n}</small>` : ''}</h3>${extra}</div>
      ${rows.length ? `<div class="sjp-list">${shown.join('')}</div>${rows.length > 3 ? `<button type="button" class="sjp-all" data-sjsec="${key}">${esc(open ? t('sj_less') : t('sj_all', { n: rows.length }))}</button>` : ''}` : ''}</section>`;
  };
  const CK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5 L5 9 L10 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function pageHtml(x) {
    const ex = examsOf(x.id)[0], wk = minsOf(x.id, weekStart()), avg = average(x), due = dueOf(x.id), prem = !!(ML.isPremium && ML.isPremium());
    const line = [ex ? t('sj_p_exam', { name: ex.name, left: daysTo(ex.date) ? t('sj_days', { n: daysTo(ex.date) }) : t('sj_today') }) : '', t('sj_week', { m: ML.fmtMins(wk) }), avg != null ? t('sj_avg') + ' ' + fmt(avg) : ''].filter(Boolean).join(' · ');
    const tasks = tasksOf(x.id).map(y => `<div class="sjp-row"><button type="button" class="td-ck" data-sjck="${y.id}" aria-label="${esc(t('mark_done') + ' : ' + ML.titleOf(y))}">${CK}</button><button type="button" class="sjp-t" data-sjedit="${y.id}">${esc(ML.titleOf(y))}</button><small>${esc(y.due ? ML.planDayLabel(y.due) : ML.fmtMins(y.mins))}</small></div>`);
    const docs = (docsCache.id === x.id ? docsCache.list : []).map(d => `<div class="sjp-row"><span class="sjp-tag k-${esc(d.kind)}">${esc(KIND[d.kind] && KIND[d.kind].startsWith('sj_') ? t(KIND[d.kind]) : KIND[d.kind] || 'Doc')}</span><button type="button" class="sjp-t" data-sjdoc="${d.id}">${esc(d.name)}</button></div>`)
      .concat(pagesOf(x.id).map(p => `<div class="sjp-row"><span class="sjp-tag k-note">${esc(t('sj_k_note'))}</span><button type="button" class="sjp-t" data-sjpage="${p.id}">${esc(p.title || t('rm_untitled'))}</button></div>`))
      .concat(lecturesOf(x.id).map(l => `<div class="sjp-row"><span class="sjp-tag k-audio">${esc(t('sj_k_audio'))}</span><button type="button" class="sjp-t" data-sjlec="${l.id}">${esc(l.title)}</button></div>`));
    const decks = decksOf(x.id).map(d => { const n = ML.studyDeckInfo ? ML.studyDeckInfo(d.id).due : 0; return `<div class="sjp-row"><span class="sjp-tag k-deck">${esc(t('tab_cards'))}</span><button type="button" class="sjp-t" data-sjdeck="${d.id}">${esc(d.name)}</button><small>${n ? esc(t('sj_due', { n })) : esc(t('sj_upto'))}</small></div>`; });
    const exs = examsOf(x.id).map(e => `<div class="sjp-row"><b class="sjp-cd">${esc(daysTo(e.date) ? t('sj_days', { n: daysTo(e.date) }) : t('sj_today'))}</b><span class="sjp-t">${esc(e.name)}</span><small>${esc(ML.parseDay(e.date).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' }))}</small></div>`);
    return `<div class="sj sjp" style="--pc:${x.color}">
      <div class="sjp-top"><button type="button" class="ghost small" data-sjp="back">‹ ${esc(t('tab_subjects'))}</button><button type="button" class="ghost small" data-sjp="add">${esc(t('sj_add_items'))}</button></div>
      <div class="sjp-band"><h2>${esc(x.name)}</h2>${line ? `<small>${esc(line)}</small>` : ''}
        <div class="td-btns"><button type="button" class="primary" data-sjp="lock">${esc(t('sj_lock', { s: x.name }))}</button>${due && prem ? `<button type="button" class="ghost" data-sjp="review">${esc(t('sj_review', { n: due }))}</button>` : ''}</div></div>
      ${sec('tasks', t('sj_todo'), tasks.length, tasks)}
      <form class="sjp-add" data-sjtask="${x.id}" autocomplete="off"><input type="text" maxlength="120" placeholder="${esc(t('sj_task_ph', { s: x.name }))}" aria-label="${esc(t('sj_task_ph', { s: x.name }))}"><button type="submit" class="small">${esc(t('sj_add'))}</button></form>
      ${sec('docs', t('sj_docs'), docs.length, docs, `<button type="button" class="ghost small" data-sjp="note">${esc(t('sj_new_note'))}</button>`)}
      ${!docs.length ? `<p class="hint sjp-hint">${esc(t('sj_docs_hint'))}</p>` : ''}
      ${decks.length ? sec('decks', t('tab_cards'), decks.length, decks) : ''}
      ${exs.length ? sec('exams', t('sj_h_exams'), exs.length, exs) : ''}
      ${ML.sharedHtml ? ML.sharedHtml(x) : ""}
      <details class="sjp-grades"${secOpen.has('grades') ? ' open' : ''}><summary data-sjsum="grades">${esc(t('sj_grades20'))}${avg != null ? ` · ${esc(t('sj_avg'))} <b>${fmt(avg)}</b>` : ''}</summary>${gradesHtml(x)}</details>
    </div>`;
  }
  ML.renderSubjects = () => { if (S.tab === 'subjects') ML.keepInputs($('subjects'), render); };
  ML.openSubject = id => { if (!byId(id)) return; pageId = id; secOpen.clear(); ML.setTab('subjects'); render(); refreshDocs(id); scrollTo(0, 0); };
  // M3: one tile per subject at the top of the Study home, with what is pressing (exam, cards to review)
  ML.subjectTiles = () => {
    if (!list().length) return '';
    const prem = !!(ML.isPremium && ML.isPremium());
    return `<div class="sj-tiles">${list().map(x => {
      const ex = examsOf(x.id)[0], due = prem ? dueOf(x.id) : 0, open = tasksOf(x.id).length;
      const bits = [ex ? t('sj_p_exam', { name: ex.name, left: daysTo(ex.date) ? t('sj_days', { n: daysTo(ex.date) }) : t('sj_today') }) : '', due ? t('sj_due', { n: due }) : '', !ex && !due && open ? ML.tn('sj_open_n', open) : ''].filter(Boolean).join(' · ');
      return `<button type="button" class="sj-tile" data-sjt="${x.id}" style="--pc:${x.color}"><b>${esc(x.name)}</b><small>${esc(bits || t('sj_week', { m: ML.fmtMins(minsOf(x.id, weekStart())) }))}</small></button>`;
    }).join('')}</div>`;
  };
  // A small menu to pick a subject (library documents, the Add sheet)
  ML.subjectPick = (anchor, cur, apply) => {
    if (!ML.planPop) return;
    const it = (v, label, onx, c) => `<button type="button" class="pp-it ${onx ? 'on' : ''}" data-pv="${esc(JSON.stringify(v))}">${c ? `<i class="te-dot" style="background:${esc(c)}"></i>` : ''}<span>${esc(label)}</span></button>`;
    ML.planPop(anchor, `<div class="pp-list">${list().map(x => it(x.id, x.name, x.id === cur, x.color)).join('')}${it(null, t('sj_none'), !cur)}</div>`, apply);
  };
  on('session', s => { // a Lock in started from a subject's page counts for it
    if (!lockSubj) return; const stored = S.sessions.find(x => x.at === s.at) || s;
    if (!stored.subject) { stored.subject = lockSubj; save(); } lockSubj = null;
  });
  on('lib:subject', () => { if (pageId) refreshDocs(pageId); });

  /* ---------- « Ajouter » (D3): pick existing documents, pages, decks and recordings for the subject ---------- */
  const add = document.createElement('div'); add.className = 'pc-sheet sj-addsheet'; add.hidden = true; add.setAttribute('role', 'dialog'); add.setAttribute('aria-modal', 'true');
  document.body.appendChild(add);
  let addTab = 'lib', addSel = new Set(), addDocs = [];
  function renderAdd() {
    const x = byId(pageId); if (!x) { add.hidden = true; return; }
    const sj = id => { const s = id && byId(id); return s ? s.name : ''; };
    const rows = addTab === 'lib' ? addDocs.filter(d => (ML.libSubjectOf ? ML.libSubjectOf(d) : d.subject) !== x.id).map(d => [d.id, d.name, sj(ML.libSubjectOf ? ML.libSubjectOf(d) : d.subject)])
      : addTab === 'notes' ? ((S.notes && S.notes.pages) || []).filter(p => p.subject !== x.id).slice(0, 80).map(p => [p.id, p.title || t('rm_untitled'), sj(p.subject)])
      : addTab === 'decks' ? ((S.study && S.study.decks) || []).filter(d => d.subject !== x.id).map(d => [d.id, d.name, sj(d.subject)])
      : (S.lectures || []).filter(l => l.subject !== x.id).map(l => [l.id, l.title, sj(l.subject)]);
    const tabs = [['lib', t('nav_lib')], ['notes', t('tab_notes')], ['decks', t('tab_cards')], ['lect', t('tab_lectures')]];
    add.innerHTML = `<div class="pc-in">
      <div class="pc-grab" aria-hidden="true"></div>
      <h3 class="pc-h">${esc(t('sj_add_to', { s: x.name }))}</h3>
      <div class="pc-days" role="tablist">${tabs.map(([k, l]) => `<button type="button" class="chip ${k === addTab ? 'on' : ''}" data-sjatab="${k}" role="tab" aria-selected="${k === addTab}">${esc(l)}</button>`).join('')}</div>
      ${rows.length ? `<div class="sja-list">${rows.map(([id, name, other]) => `<label class="sja-row"><input type="checkbox" data-sjasel="${esc(id)}" ${addSel.has(addTab + ':' + id) ? 'checked' : ''}><span>${esc(name)}</span>${other ? `<small>${esc(other)}</small>` : ''}</label>`).join('')}</div>` : `<p class="pc-hint">${esc(t('sj_add_none'))}</p>`}
      <div class="pc-foot"><button type="button" class="ghost small" data-sjaclose="1">${esc(t('close'))}</button><button type="button" class="primary small" data-sjago="1" ${addSel.size ? '' : 'disabled'}>${esc(addSel.size ? t('sj_add_n', { n: addSel.size }) : t('sj_add'))}</button></div>
    </div>`;
  }
  function openAdd() {
    addSel = new Set(); addTab = 'lib'; add.hidden = false; renderAdd();
    if (ML.libDocs) ML.libDocs().then(d => { addDocs = d || []; if (!add.hidden) renderAdd(); }).catch(() => {});
  }
  add.addEventListener('click', e => {
    if (e.target === add || e.target.closest('[data-sjaclose]')) { add.hidden = true; return; }
    const tb = e.target.closest('[data-sjatab]'); if (tb) { addTab = tb.dataset.sjatab; renderAdd(); return; }
    if (e.target.closest('[data-sjago]')) {
      const id = pageId;
      addSel.forEach(k => {
        const [kind, v] = [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)];
        if (kind === 'lib' && ML.libSetSubject) ML.libSetSubject(v, id);
        if (kind === 'notes') { const p = (S.notes.pages || []).find(y => y.id === v); if (p) p.subject = id; }
        if (kind === 'decks') { const d = (S.study.decks || []).find(y => y.id === v); if (d) d.subject = id; }
        if (kind === 'lect') { const l = (S.lectures || []).find(y => y.id === v); if (l) l.subject = id; }
      });
      toast(t('sj_added', { n: addSel.size })); add.hidden = true; save(); render(); setTimeout(() => refreshDocs(id), 50);
    }
  });
  add.addEventListener('change', e => { const c = e.target.closest('[data-sjasel]'); if (!c) return; const k = addTab + ':' + c.dataset.sjasel; c.checked ? addSel.add(k) : addSel.delete(k); const go = add.querySelector('[data-sjago]'); go.disabled = !addSel.size; go.textContent = addSel.size ? t('sj_add_n', { n: addSel.size }) : t('sj_add'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !add.hidden) { e.stopPropagation(); add.hidden = true; } }, true);

  function render() {
    const root = $('subjects'); if (!root) return;
    if (pageId && byId(pageId)) {
      const x = byId(pageId);
      root.innerHTML = pageHtml(x);
      const b = $('sj-del-' + x.id); if (b) ML.armedButton(b, 'sj_delete', () => { removeSubject(x.id); });
      return;
    }
    pageId = null;
    const upcoming = exams().filter(x => daysTo(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)), prem = !!(ML.isPremium && ML.isPremium()), avg = overall();
    root.innerHTML = `<div class="sj">
      <div class="g-card sj-exams"><div class="sj-top"><h2>${esc(t('sj_h_exams'))}</h2>${plusBtn('exam', 'sj_new_exam')}</div>
        ${upcoming.length ? `<ul class="ex-list">${upcoming.map(examHtml).join('')}</ul>` : `<p class="hint">${esc(t('sj_exam_none'))}</p>`}
        ${adding.exam ? `<form class="sj-eform" id="sj-exam-form" autocomplete="off">
          <label class="sj-gl"><span>${esc(t('sj_exam_name'))}</span><input type="text" name="name" maxlength="60" placeholder="${esc(t('sj_exam_ph'))}" required></label>
          <label><span>${esc(t('ex_date'))}</span><input type="date" name="date" min="${addDays(today(), 1)}" required></label>
          ${list().length ? `<label><span>${esc(t('sj_task_field'))}</span><select name="subject"><option value="">${esc(t('sj_none'))}</option>${list().map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>` : ''}
          ${prem ? `<label><span>${esc(t('sj_exam_hours'))}</span><input type="number" name="hours" min="0" max="60" value="6" inputmode="numeric"></label><label><span>${esc(t('sj_exam_ch'))}</span><input type="number" name="chapters" min="0" max="60" placeholder="${esc(t('sj_exam_ch_ph'))}" inputmode="numeric"></label>` : ''}
          <button type="submit" class="primary small">${esc(t('sj_exam_add'))}</button>
          ${prem ? `<p class="hint">${esc(t('ex_intro'))}</p>` : `<p class="hint">${esc(t('sj_exam_prem'))}</p>`}
        </form>` : ''}
      </div>
      ${ML.sharedJoinHtml ? ML.sharedJoinHtml() : ""}
      <div class="g-card sj-list"><div class="sj-top"><h2>${esc(t('sj_h_subjects'))}</h2>${avg != null ? `<span class="sj-overall">${esc(t('sj_overall'))} <b>${fmt(avg)}</b></span>` : ''}${list().length ? plusBtn('subj', 'sj_new') : ''}</div>
        ${list().length ? `<ul class="sj-cards">${list().map(cardHtml).join('')}</ul>` : `<p class="hint">${esc(t('sj_empty'))}</p>`}
        ${adding.subj || !list().length ? `<form class="sj-add" id="sj-add" autocomplete="off"><input type="text" id="sj-add-in" maxlength="40" placeholder="${esc(t('sj_add_ph'))}" aria-label="${esc(t('sj_add_ph'))}" required><button type="submit" class="small">${esc(t('sj_add'))}</button></form>` : ''}
      </div></div>`;
    list().forEach(x => { const b = $('sj-del-' + x.id); if (b) ML.armedButton(b, 'sj_delete', () => { removeSubject(x.id); }); });
    if (ML.mockCard) ML.mockCard();
  }
  function removeSubject(id) {
    S.subjects = list().filter(x => x.id !== id);
    S.tasks.forEach(x => { if (x.subject === id) delete x.subject; });
    ((S.study && S.study.decks) || []).forEach(d => { if (d.subject === id) delete d.subject; });
    exams().forEach(x => { if (x.subject === id) delete x.subject; });
    if (pageId === id) pageId = null;
    ((S.notes && S.notes.pages) || []).forEach(p => { if (p.subject === id) delete p.subject; });
    (S.lectures || []).forEach(l => { if (l.subject === id) delete l.subject; });
    save(); render(); ML.renderAll();
  }
  const root = $('subjects');
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.sjPlus) {
      const k = b.dataset.sjPlus; adding[k] = !adding[k]; render();
      const f = adding[k] && root.querySelector(k === 'exam' ? '#sj-exam-form input' : '#sj-add-in'); if (f) f.focus();
      return;
    }
    const d = b.dataset;
    if (d.sjt) { ML.openSubject(d.sjt); return; }
    if (d.sjp) {
      const x = byId(pageId); if (!x) return;
      if (d.sjp === 'back') { pageId = null; render(); scrollTo(0, 0); }
      else if (d.sjp === 'add') openAdd();
      else if (d.sjp === 'note' && ML.notesNew) ML.notesNew(x.name, x.id);
      else if (d.sjp === 'review') { const dk = decksOf(x.id).find(y => ML.studyDeckInfo(y.id).due) || decksOf(x.id)[0]; if (dk) { ML.setTab('study'); ML.studyReview(dk.id); } }
      else if (d.sjp === 'lock') {
        const y = tasksOf(x.id)[0];
        if (y) ML.lockIn({ taskId: y.id, mins: y.mins });
        else if (ML.lockIn({ title: x.name, mins: S.focusMins || 25 })) lockSubj = x.id;
      }
      return;
    }
    if (d.sjck) { const y = S.tasks.find(z => z.id === d.sjck); if (y) { b.classList.add('on'); setTimeout(() => { ML.completeTask(y); save(); ML.renderAll(); render(); }, ML.reducedMotion() ? 0 : 260); } return; }
    if (d.sjedit) { ML.setTab('plan'); if (ML.editTask) ML.editTask(d.sjedit); return; }
    if (d.sjdoc) { if (ML.libOpen) ML.libOpen(d.sjdoc); return; }
    if (d.sjpage) { if (ML.notesOpen) ML.notesOpen(d.sjpage); return; }
    if (d.sjlec) { if (ML.lectureOpen) ML.lectureOpen(d.sjlec); return; }
    if (d.sjdeck) { const n = ML.studyDeckInfo ? ML.studyDeckInfo(d.sjdeck).due : 0; ML.setTab('study'); if (n && ML.studyReview) ML.studyReview(d.sjdeck); return; }
    if (d.sjsec) { secOpen.has(d.sjsec) ? secOpen.delete(d.sjsec) : secOpen.add(d.sjsec); render(); return; }
    if (b.dataset.sjGdel) { const x = byId(b.dataset.sj); if (x) { x.grades = x.grades.filter(g => g.id !== b.dataset.sjGdel); save(); render(); } return; }
    if (b.dataset.sjExdel) { ML.removeExam(b.dataset.sjExdel); toast(t('ex_deleted')); render(); renderCount(); }
  });
  root.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (f.dataset.sjtask) { // a task for this subject, for today unless the line says otherwise (« demain 14h 45min »)
      const inp = f.querySelector('input'), raw = inp.value.trim(); if (!raw) return;
      const q = ML.parseQuick ? ML.parseQuick(raw) : {};
      S.tasks = S.tasks.filter(x => !x.sample);
      const task = { id: uid(), title: q.title || raw, mins: q.mins || 25, pri: q.pri || 'med', done: false, created: Date.now(), subject: f.dataset.sjtask, due: q.due || today() };
      if (q.project) task.project = q.project;
      S.tasks.push(task); save(); ML.emit('task:added', task);
      if (q.at != null && ML.placeTaskAt) ML.placeTaskAt(task, task.due, q.at); else ML.renderAll();
      render(); const again = root.querySelector('[data-sjtask] input'); if (again) again.focus();
      return;
    }
    if (f.id === 'sj-add') {
      const v = $('sj-add-in').value.trim(); if (!v) return;
      const x = { id: uid(), name: v, color: COLORS[list().length % COLORS.length], coef: 1, target: null, nextCoef: null, grades: [] };
      list().push(x); adding.subj = false; save(); render(); return;
    }
    if (f.dataset.sjGadd) {
      const x = byId(f.dataset.sjGadd), value = num(f.value.value), max = num(f.max.value) || 20, coef = num(f.coef.value) || 1;
      if (!x || value == null || value < 0 || value > max) { f.value.focus(); return; }
      (x.grades = x.grades || []).push({ id: uid(), label: f.label.value.trim(), value, max, coef, date: today() }); save(); render(); return;
    }
    if (f.id === 'sj-exam-form') {
      const name = f.name.value.trim(), date = f.date.value, hours = f.hours ? Math.max(0, Math.min(60, +f.hours.value || 0)) : 0, subject = f.subject ? f.subject.value : '';
      if (!name || !date) return;
      const r = ML.planExam(name, date, hours, null, subject || null, f.chapters ? +f.chapters.value || 0 : 0);
      toast(r.n ? t('ex_done', { n: r.n, m: ML.fmtMins(r.per) }) : t('sj_exam_added'), { ms: 5000 });
      adding.exam = false; render(); renderCount();
    }
  });
  root.addEventListener('input', e => {
    const d = e.target.dataset; if (!d.sjTarget && !d.sjNextcoef) return;
    const x = byId(d.sjTarget || d.sjNextcoef); if (!x) return;
    if (d.sjTarget) x.target = num(e.target.value); else x.nextCoef = num(e.target.value);
    save(); const o = $('sj-need-' + x.id); if (o) o.textContent = needText(x);
  });
  root.addEventListener('change', e => {
    const id = e.target.dataset.sjDeck; if (id === undefined) return;
    const decks = S.study.decks, prev = decks.find(d => d.subject === id); if (prev) delete prev.subject; // only the deck shown here: a subject may hold several decks (3.91)
    const d = decks.find(y => y.id === e.target.value); if (d) d.subject = id; save();
  });

  root.addEventListener('toggle', e => { const dt = e.target.closest && e.target.closest('details.sjp-grades'); if (!dt) return; dt.open ? secOpen.add('grades') : secOpen.delete('grades'); }, true);
  on('tab', n => { if (n === 'subjects') { render(); if (pageId) refreshDocs(pageId); } });
  on('render', () => { renderCount(); if (S.tab === 'subjects') ML.keepInputs($('subjects'), render); });
  on('minute', renderCount);
  on('lang', () => { if (S.tab === 'subjects') render(); renderCount(); });
  on('started', () => { renderCount(); if (S.tab === 'subjects') render(); });
})();
