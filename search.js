// The search bar (3.60): Ctrl K on a computer, the magnifier on a phone. One field that finds any section, feature, task,
// project, note, document, deck, subject or event, and runs actions: "25" starts 25 minutes, "add revise law tomorrow"
// adds a task (the Plan's quick syntax works), "inbox call the bank" keeps a thought.
(() => {
  'use strict';
  const { $, S, t, esc, on, today } = ML;

  ML.addStrings({
    fr: { k_title: 'Rechercher', k_ph: 'Chercher ou lancer une action', k_empty: 'Rien ne correspond.', k_g_action: 'Actions', k_g_task: 'Tâches', k_g_open: 'Ouvrir', k_g_content: 'Tes contenus', k_lock: 'Lock in sur « {t} »', k_mins: 'Lancer {n} min', k_add: 'Ajouter la tâche « {t} »', k_inbox: 'Garder dans l’Inbox : « {t} »', k_kw_add: 'ajouter|ajoute|add|\\+', k_kw_inbox: 'inbox|garder', k_start: 'Lancer ou mettre en pause le minuteur', k_deep: 'Plein écran', k_mute: 'Couper ou remettre le son', k_float: 'Minuteur flottant', k_energy: 'Changer d’énergie', k_world: 'Changer de monde', k_prep: 'Préparer ma journée', k_note: 'Page du jour', k_review: 'Bilan de la semaine', k_task: 'Tâche', k_project: 'Projet', k_notep: 'Note', k_doc: 'Document', k_deck: 'Paquet', k_subject: 'Matière', k_event: 'Agenda', k_feat: 'Fonction', k_section: 'Section', k_help: 'Raccourcis clavier', key_k: 'Rechercher' },
    en: { k_title: 'Search', k_ph: 'Search or run an action', k_empty: 'Nothing matches.', k_g_action: 'Actions', k_g_task: 'Tasks', k_g_open: 'Open', k_g_content: 'Your content', k_lock: 'Lock in on "{t}"', k_mins: 'Start {n} min', k_add: 'Add the task "{t}"', k_inbox: 'Keep in the Inbox: "{t}"', k_kw_add: 'add|ajouter|ajoute|\\+', k_kw_inbox: 'inbox|keep', k_start: 'Start or pause the timer', k_deep: 'Full screen', k_mute: 'Mute or unmute', k_float: 'Floating timer', k_energy: 'Change energy', k_world: 'Change world', k_prep: 'Plan my day', k_note: 'Today’s page', k_review: 'Weekly review', k_task: 'Task', k_project: 'Project', k_notep: 'Note', k_doc: 'Document', k_deck: 'Deck', k_subject: 'Subject', k_event: 'Calendar', k_feat: 'Feature', k_section: 'Section', k_help: 'Keyboard shortcuts', key_k: 'Search' },
  });

  const el = document.createElement('div');
  el.className = 'ksearch'; el.id = 'ksearch'; el.hidden = true;
  el.innerHTML = `<div class="k-box" role="dialog" aria-modal="true"><label class="k-q"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input type="text" id="k-in" autocomplete="off" autocapitalize="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="k-list"></label><div class="k-list" id="k-list" role="listbox"></div></div>`;
  document.body.append(el);
  const input = el.querySelector('#k-in'), listEl = el.querySelector('#k-list');

  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // 3 starts with the query, 2 a word starts with it, 1 contains it; every word of the query must be found
  function score(text, q) {
    const n = norm(text), words = q.split(/\s+/).filter(Boolean); if (!words.length) return 0;
    if (n.startsWith(q)) return 3;
    let best = 2;
    for (const w of words) { const i = n.indexOf(w); if (i < 0) return 0; if (i && /[a-z0-9]/.test(n[i - 1])) best = 1; }
    return best;
  }
  const close = () => { el.hidden = true; document.documentElement.classList.remove('k-on'); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); lastFocus = null; };
  let lastFocus = null, items = [], cur = 0, docs = [];

  const SECTIONS = () => [['plan', 'tab_plan'], ['day', 'tab_day'], ['cal', 'tab_cal'], ['subjects', 'tab_subjects'], ['notes', 'tab_notes'], ['lib', 'nav_lib'], ['study', 'tab_cards'], ['lectures', 'tab_lectures'], ['learn', 'tab_learn'], ['focus', 'tab_focus'], ['tree', 'tab_tree'], ['health', 'tab_health'], ['screen', 'tab_screen'], ['grim', 'tab_grim'], ['room', 'tab_room'], ['guide', 'tab_guide']]
    .map(([k, s]) => ({ g: 'open', name: t(s), tag: t('k_section'), run: () => ML.setMobileView(k) }));
  const COMMANDS = () => [
    ['k_start', () => ML.toggleTimer()], ['k_deep', () => ML.openDeep()], ['k_mute', () => $('mute-btn').click()], ['k_float', () => $('float-btn').click()],
    ['k_energy', () => ML.energyPicker.open({ cancellable: true })], ['k_world', () => ML.openWorlds && ML.openWorlds()],
    ['k_prep', () => ML.openDayPrep && ML.openDayPrep()], ['k_note', () => ML.openDailyNote()], ['k_review', () => ML.openReview && ML.openReview()],
    ['qt_title', () => ML.quickTools.open()], ['shop', () => ML.openShop()], ['settings', () => $('settings-btn').click()], ['k_help', () => { const h = $('help'); if (h) { ML.openOverlay('help'); } }],
  ].map(([s, run]) => ({ g: 'action', name: t(s), run }));
  const FEATURES = () => (ML.GUIDE || []).map(x => ({ g: 'open', name: t('g_' + x.id), hay: t('g_' + x.id) + ' ' + t('g_' + x.id + '_d'), tag: t('k_feat'), run: () => ML.guideGo(x.go) }));
  const TASKS = () => ML.orderedOpen().map(x => ({ g: 'task', name: ML.titleOf(x), hay: ML.titleOf(x) + ' ' + (x.project || ''), tag: x.project || t('k_task'), label: t('k_lock', { t: ML.titleOf(x) }), run: () => ML.lockIn({ taskId: x.id, mins: x.mins }) }));
  const CONTENT = () => {
    const out = [];
    (ML.planProjects ? ML.planProjects() : []).forEach(n => out.push({ g: 'content', name: n, tag: t('k_project'), run: () => { S.plan.proj = n; if (S.plan.pview === 'inbox') S.plan.pview = 'all'; ML.save(); ML.setMobileView('plan'); ML.setTab('plan'); ML.renderTasks(); } }));
    ((S.notes && S.notes.pages) || []).forEach(p => out.push({ g: 'content', name: p.title || t('k_notep'), hay: (p.title || '') + ' ' + String(p.html || '').replace(/<[^>]+>/g, ' ').slice(0, 4000), tag: t('k_notep'), run: () => { S.notes.current = p.id; ML.save(); ML.setMobileView('notes'); ML.setTab('notes'); } }));
    docs.forEach(d => out.push({ g: 'content', name: d.name || d.title || t('k_doc'), tag: t('k_doc'), run: () => { ML.setMobileView('lib'); ML.libOpen(d.id); } }));
    (ML.studyDecks ? ML.studyDecks() : []).forEach(d => out.push({ g: 'content', name: d.name, tag: t('k_deck'), run: () => { ML.setMobileView('study'); ML.studyReview(d.id); } }));
    (S.subjects || []).forEach(x => out.push({ g: 'content', name: x.name, tag: t('k_subject'), run: () => ML.setMobileView('subjects') }));
    ((S.study && S.study.exams) || []).forEach(x => out.push({ g: 'content', name: x.name, tag: t('tab_subjects'), run: () => ML.setMobileView('subjects') }));
    (S.events || []).forEach(ev => out.push({ g: 'content', name: ev.title, tag: t('k_event'), run: () => { if (ev.date) { S.cal.sel = ev.date; S.cal.month = ev.date.slice(0, 7); } ML.setMobileView('cal'); ML.setTab('cal'); } }));
    return out;
  };

  // What the text typed asks for, before any search: a duration, a task to add, a thought to keep
  function typedActions(raw) {
    const out = [], m = raw.match(/^(\d{1,3})\s*(m|min|mins|minutes)?$/i);
    if (m && +m[1] > 0 && +m[1] <= 600) out.push({ g: 'action', name: t('k_mins', { n: +m[1] }), run: () => ML.lockIn({ mins: +m[1] }) });
    const add = raw.match(new RegExp('^(?:' + t('k_kw_add') + ')\\s+(.+)$', 'i')), box = raw.match(new RegExp('^(?:' + t('k_kw_inbox') + ')\\s+(.+)$', 'i'));
    if (add) out.push({ g: 'action', name: t('k_add', { t: add[1] }), run: () => addTask(add[1]) });
    if (box) out.push({ g: 'action', name: t('k_inbox', { t: box[1] }), run: () => { $('park-input').value = box[1]; $('park-form').requestSubmit(); } });
    return out;
  }
  function addTask(text) {
    const f = $('new-title'); f.value = text; f.dispatchEvent(new Event('input', { bubbles: true }));
    $('add-form').requestSubmit();
    ML.setMobileView('plan'); ML.setTab('plan');
  }

  function build(raw) {
    const q = norm(raw.trim());
    if (!q) { // before typing: the next task, then the most used places
      const nx = TASKS().slice(0, 2);
      return [...nx, ...SECTIONS().slice(0, 7)];
    }
    const pool = [...COMMANDS(), ...TASKS(), ...SECTIONS(), ...CONTENT(), ...FEATURES()];
    const seen = new Set(), found = [];
    for (const it of pool) {
      const s = score(it.hay || it.name, q); if (!s) continue;
      const key = norm(it.name) + (it.tag || ''); if (seen.has(key)) continue; seen.add(key);
      // the name itself beats a match deep in a note or a feature's description
      found.push({ it, s: s * 2 + (score(it.name, q) ? 2 : 0) + (it.tag === t('k_section') ? 1 : 0) });
    }
    found.sort((a, b) => b.s - a.s);
    return [...typedActions(raw.trim()), ...found.slice(0, 9).map(x => x.it)];
  }
  const G_ORDER = ['action', 'task', 'open', 'content'];
  function render() {
    items = build(input.value);
    // Grouped by kind, each group in its best match's place
    const groups = []; items.forEach(it => { let g = groups.find(x => x.g === it.g); if (!g) { g = { g: it.g, rows: [] }; groups.push(g); } g.rows.push(it); });
    if (!input.value.trim()) groups.sort((a, b) => G_ORDER.indexOf(a.g) - G_ORDER.indexOf(b.g));
    items = groups.flatMap(g => g.rows);
    cur = Math.min(cur, Math.max(0, items.length - 1));
    let i = -1;
    listEl.innerHTML = items.length ? groups.map(g => `<p class="k-h">${esc(t('k_g_' + g.g))}</p>${g.rows.map(it => { i++; return `<button type="button" class="k-it ${i === cur ? 'on' : ''}" role="option" aria-selected="${i === cur}" id="k-o${i}" data-k="${i}"><span>${esc(it.label || it.name)}</span>${it.tag ? `<small>${esc(it.tag)}</small>` : ''}</button>`; }).join('')}`).join('') : `<p class="k-none">${esc(t('k_empty'))}</p>`;
    input.setAttribute('aria-activedescendant', items.length ? 'k-o' + cur : '');
  }
  function move(d) {
    if (!items.length) return;
    cur = (cur + d + items.length) % items.length;
    listEl.querySelectorAll('.k-it').forEach((b, i) => { const onx = i === cur; b.classList.toggle('on', onx); b.setAttribute('aria-selected', onx); if (onx) b.scrollIntoView({ block: 'nearest' }); });
    input.setAttribute('aria-activedescendant', 'k-o' + cur);
  }
  function run(i) { const it = items[i]; if (!it) return; lastFocus = null; close(); ML.emit('gesture'); it.run(); }

  function open() {
    if (!el.hidden) { input.select(); return; }
    lastFocus = document.activeElement;
    input.placeholder = t('k_ph'); input.setAttribute('aria-label', t('k_title')); input.value = ''; cur = 0;
    el.querySelector('.k-box').setAttribute('aria-label', t('k_title'));
    el.hidden = false; document.documentElement.classList.add('k-on');
    render(); input.focus();
    if (ML.libDocs && ML.isPremium && ML.isPremium()) ML.libDocs().then(d => { docs = d; if (!el.hidden && input.value.trim()) render(); }).catch(() => {});
  }
  ML.openSearch = open;
  input.addEventListener('input', () => { cur = 0; render(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); run(cur); }
    else if (e.key === 'Tab') { e.preventDefault(); move(e.shiftKey ? -1 : 1); }
  });
  listEl.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) run(+b.dataset.k); });
  el.addEventListener('pointerdown', e => { if (e.target === el) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !el.hidden) { e.stopPropagation(); e.preventDefault(); close(); return; }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') { e.preventDefault(); el.hidden ? open() : close(); }
  }, true);
  $('search-btn').onclick = open;
  $('k-btn').onclick = open;
  if (ML.planKeys) ML.planKeys.unshift(['Ctrl K', 'key_k']);
  on('lang', () => { if (!el.hidden) render(); });
})();
