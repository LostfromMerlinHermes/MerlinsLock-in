// Subjects (3.58, Study space): one list of subjects shared by tasks, sessions, decks and exams, with the time spent on
// each, the exams to come (a countdown also sits under the energy on the Timer screen) and the grades: weighted average
// and the mark needed to reach a target. Free. Placing the spaced revision blocks stays Premium (ML.planExam in study.js).
// S.subjects: [{ id, name, color, coef, target, grades: [{ id, label, value, max, coef, date }] }]
(() => {
  'use strict';
  const { $, S, t, esc, on, save, uid, today, addDays, toast } = ML;

  ML.addStrings({
    fr: {
      tab_subjects: 'Matières', sj_h_exams: 'Examens', sj_h_subjects: 'Tes matières', sj_add_ph: 'Nouvelle matière (ex. Droit civil)', sj_add: 'Ajouter', sj_empty: 'Ajoute tes matières : tu verras le temps passé, tes notes et tes examens au même endroit.',
      sj_week: '{m} cette semaine', sj_total: '{m} en tout', sj_avg: 'Moyenne', sj_overall: 'Moyenne générale', sj_no_grade: 'Pas encore de note', sj_grades: 'Notes', sj_grade_label: 'Contrôle', sj_grade_value: 'Note', sj_grade_max: 'Sur', sj_coef: 'Coef', sj_add_grade: 'Ajouter la note',
      sj_target: 'Objectif', sj_next_coef: 'Coef du prochain contrôle', sj_need: 'Il te faut {n}/20 au prochain contrôle.', sj_need_done: 'Objectif déjà atteint, même avec 0 au prochain.', sj_need_no: 'Il faudrait {n}/20 : objectif hors de portée avec ce coef.',
      sj_delete: 'Supprimer la matière', sj_deck: 'Paquet lié', sj_deck_none: 'Aucun', sj_task_field: 'Matière', sj_none: 'Aucune', sj_exam_name: 'Examen', sj_exam_ph: 'Partiel de droit', sj_exam_add: 'Ajouter l’examen', sj_exam_plan: 'Placer des révisions espacées dans ma Journée', sj_exam_hours: 'Heures de révision', sj_exam_prem: 'Avec Premium : des révisions espacées se placent seules dans ta Journée.', sj_exam_added: 'Examen ajouté à l’Agenda.', sj_exam_none: 'Aucun examen à venir.', sj_countdown: '{name} · {left}', sj_today: 'aujourd’hui', sj_days: 'J-{n}',
    },
    en: {
      tab_subjects: 'Subjects', sj_h_exams: 'Exams', sj_h_subjects: 'Your subjects', sj_add_ph: 'New subject (e.g. Civil law)', sj_add: 'Add', sj_empty: 'Add your subjects: time spent, grades and exams in one place.',
      sj_week: '{m} this week', sj_total: '{m} in total', sj_avg: 'Average', sj_overall: 'Overall average', sj_no_grade: 'No grade yet', sj_grades: 'Grades', sj_grade_label: 'Test', sj_grade_value: 'Grade', sj_grade_max: 'Out of', sj_coef: 'Weight', sj_add_grade: 'Add the grade',
      sj_target: 'Target', sj_next_coef: 'Weight of the next test', sj_need: 'You need {n}/20 on the next test.', sj_need_done: 'Target already reached, even with 0 on the next test.', sj_need_no: 'You would need {n}/20: out of reach with this weight.',
      sj_delete: 'Delete the subject', sj_deck: 'Linked deck', sj_deck_none: 'None', sj_task_field: 'Subject', sj_none: 'None', sj_exam_name: 'Exam', sj_exam_ph: 'Law midterm', sj_exam_add: 'Add the exam', sj_exam_plan: 'Place spaced revision in my Day', sj_exam_hours: 'Revision hours', sj_exam_prem: 'With Premium: spaced revision places itself in your Day.', sj_exam_added: 'Exam added to the Calendar.', sj_exam_none: 'No exam coming up.', sj_countdown: '{name} · {left}', sj_today: 'today', sj_days: 'D-{n}',
    },
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
  let openId = null;

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
  const prevExtras = ML.taskEditExtras;
  ML.taskEditExtras = task => `<label class="t-subject"><span>${esc(t('sj_task_field'))}</span><select name="subject"><option value="">${esc(t('sj_none'))}</option>${list().map(x => `<option value="${x.id}" ${x.id === task.subject ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>${prevExtras ? prevExtras(task) : ''}`;
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
  function cardHtml(x) {
    const avg = average(x), wk = minsOf(x.id, weekStart()), all = minsOf(x.id), isOpen = openId === x.id, decks = (S.study && S.study.decks) || [], linked = decks.find(d => d.subject === x.id);
    return `<li class="sj-card ${isOpen ? 'open' : ''}" style="--pc:${x.color}">
      <button type="button" class="sj-head" data-sj-open="${x.id}" aria-expanded="${isOpen}"><i class="sj-dot"></i><span class="sj-name"><b>${esc(x.name)}</b><small>${esc(t('sj_week', { m: ML.fmtMins(wk) }))} · ${esc(t('sj_total', { m: ML.fmtMins(all) }))}</small></span><strong class="sj-avg">${avg == null ? '–' : fmt(avg)}</strong></button>
      ${isOpen ? `<div class="sj-body">
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
      </div>` : ''}</li>`;
  }
  function render() {
    const root = $('subjects'); if (!root) return;
    const upcoming = exams().filter(x => daysTo(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)), prem = !!(ML.isPremium && ML.isPremium()), avg = overall();
    root.innerHTML = `<div class="sj">
      <div class="g-card sj-exams"><h2>${esc(t('sj_h_exams'))}</h2>
        ${upcoming.length ? `<ul class="ex-list">${upcoming.map(examHtml).join('')}</ul>` : `<p class="hint">${esc(t('sj_exam_none'))}</p>`}
        <form class="sj-eform" id="sj-exam-form" autocomplete="off">
          <label class="sj-gl"><span>${esc(t('sj_exam_name'))}</span><input type="text" name="name" maxlength="60" placeholder="${esc(t('sj_exam_ph'))}" required></label>
          <label><span>${esc(t('ex_date'))}</span><input type="date" name="date" min="${addDays(today(), 1)}" required></label>
          ${list().length ? `<label><span>${esc(t('sj_task_field'))}</span><select name="subject"><option value="">${esc(t('sj_none'))}</option>${list().map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>` : ''}
          ${prem ? `<label><span>${esc(t('sj_exam_hours'))}</span><input type="number" name="hours" min="0" max="60" value="6" inputmode="numeric"></label>` : ''}
          <button type="submit" class="primary small">${esc(t('sj_exam_add'))}</button>
          ${prem ? `<p class="hint">${esc(t('ex_intro'))}</p>` : `<p class="hint">${esc(t('sj_exam_prem'))}</p>`}
        </form>
      </div>
      <div class="g-card sj-list"><div class="sj-top"><h2>${esc(t('sj_h_subjects'))}</h2>${avg != null ? `<span class="sj-overall">${esc(t('sj_overall'))} <b>${fmt(avg)}</b></span>` : ''}</div>
        ${list().length ? `<ul class="sj-cards">${list().map(cardHtml).join('')}</ul>` : `<p class="hint">${esc(t('sj_empty'))}</p>`}
        <form class="sj-add" id="sj-add" autocomplete="off"><input type="text" id="sj-add-in" maxlength="40" placeholder="${esc(t('sj_add_ph'))}" aria-label="${esc(t('sj_add_ph'))}" required><button type="submit" class="small">${esc(t('sj_add'))}</button></form>
      </div></div>`;
    list().forEach(x => { const b = $('sj-del-' + x.id); if (b) ML.armedButton(b, 'sj_delete', () => { removeSubject(x.id); }); });
    if (ML.mockCard) ML.mockCard();
  }
  function removeSubject(id) {
    S.subjects = list().filter(x => x.id !== id);
    S.tasks.forEach(x => { if (x.subject === id) delete x.subject; });
    ((S.study && S.study.decks) || []).forEach(d => { if (d.subject === id) delete d.subject; });
    exams().forEach(x => { if (x.subject === id) delete x.subject; });
    if (openId === id) openId = null;
    save(); render(); ML.renderAll();
  }
  const root = $('subjects');
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.sjOpen) { openId = openId === b.dataset.sjOpen ? null : b.dataset.sjOpen; render(); return; }
    if (b.dataset.sjGdel) { const x = byId(b.dataset.sj); if (x) { x.grades = x.grades.filter(g => g.id !== b.dataset.sjGdel); save(); render(); } return; }
    if (b.dataset.sjExdel) { ML.removeExam(b.dataset.sjExdel); toast(t('ex_deleted')); render(); renderCount(); }
  });
  root.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (f.id === 'sj-add') {
      const v = $('sj-add-in').value.trim(); if (!v) return;
      const x = { id: uid(), name: v, color: COLORS[list().length % COLORS.length], coef: 1, target: null, nextCoef: null, grades: [] };
      list().push(x); openId = x.id; save(); render(); return;
    }
    if (f.dataset.sjGadd) {
      const x = byId(f.dataset.sjGadd), value = num(f.value.value), max = num(f.max.value) || 20, coef = num(f.coef.value) || 1;
      if (!x || value == null || value < 0 || value > max) { f.value.focus(); return; }
      (x.grades = x.grades || []).push({ id: uid(), label: f.label.value.trim(), value, max, coef, date: today() }); save(); render(); return;
    }
    if (f.id === 'sj-exam-form') {
      const name = f.name.value.trim(), date = f.date.value, hours = f.hours ? Math.max(0, Math.min(60, +f.hours.value || 0)) : 0, subject = f.subject ? f.subject.value : '';
      if (!name || !date) return;
      const r = ML.planExam(name, date, hours, null, subject || null);
      toast(r.n ? t('ex_done', { n: r.n, m: ML.fmtMins(r.per) }) : t('sj_exam_added'), { ms: 5000 });
      render(); renderCount();
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
    const decks = S.study.decks; decks.forEach(d => { if (d.subject === id) delete d.subject; });
    const d = decks.find(y => y.id === e.target.value); if (d) d.subject = id; save();
  });

  on('tab', n => { if (n === 'subjects') render(); });
  on('render', () => { renderCount(); if (S.tab === 'subjects') ML.keepInputs($('subjects'), render); });
  on('minute', renderCount);
  on('lang', () => { if (S.tab === 'subjects') render(); renderCount(); });
  on('started', () => { renderCount(); if (S.tab === 'subjects') render(); });
})();
