// Notebook tab ("Carnet"): rich-text pages with a page per day, free pages, pins, search and history.
// Pages live in S.notes (so they sync with the account). Stored HTML is always sanitized to a small allowlist.
(() => {
  'use strict';
  const { $, S, t, tn, esc, save, on, emit, toast, uid, today, parseDay, fmtMins, dayKey } = ML;

  ML.addStrings({
    fr: {
      tab_notes: 'Carnet', nb_new: 'Nouvelle page', nb_today: 'Page du jour', nb_search: 'Chercher dans le carnet', nb_pages: 'Mes pages', nb_title_ph: 'Titre de la page',
      nb_empty: 'Aucune page pour l’instant. Ouvre la page du jour pour écrire ce que tu as fait, appris ou ressenti.', nb_none: 'Aucune page ne correspond.',
      nb_body_ph: 'Écris ici… (les boutons au-dessus mettent en forme : titres, listes, cases à cocher, citations, surlignage)',
      nb_saved: 'Enregistré', nb_saving: 'Enregistrement…', nb_words_one: '{n} mot', nb_words: '{n} mots', nb_pin: 'Épingler', nb_unpin: 'Désépingler', nb_delete: 'Supprimer la page',
      nb_deleted: 'Page supprimée', nb_summary: 'Insérer le bilan du jour', nb_export: 'Exporter en texte',
      nb_sum_title: 'Bilan du {d}', nb_sum_focus: 'Focus : {m} en {n} session(s)', nb_sum_tasks: 'Tâches terminées : {list}', nb_sum_none: 'aucune', nb_sum_mood: 'Humeur : {mood}', nb_sum_sport: 'Sport : {list}',
      fmt_b: 'Gras', fmt_i: 'Italique', fmt_u: 'Souligné', fmt_s: 'Barré', fmt_h2: 'Titre', fmt_h3: 'Sous-titre', fmt_ul: 'Liste', fmt_ol: 'Liste numérotée', fmt_check: 'Cases à cocher',
      fmt_quote: 'Citation', fmt_mark: 'Surligner', fmt_hr: 'Séparateur', fmt_clear: 'Effacer la mise en forme', nb_daily_tag: 'jour',
    },
    en: {
      tab_notes: 'Notebook', nb_new: 'New page', nb_today: "Today's page", nb_search: 'Search the notebook', nb_pages: 'My pages', nb_title_ph: 'Page title',
      nb_empty: "No pages yet. Open today's page to write what you did, learned or felt.", nb_none: 'No page matches.',
      nb_body_ph: 'Write here… (the buttons above format: headings, lists, checkboxes, quotes, highlight)',
      nb_saved: 'Saved', nb_saving: 'Saving…', nb_words_one: '{n} word', nb_words: '{n} words', nb_pin: 'Pin', nb_unpin: 'Unpin', nb_delete: 'Delete page',
      nb_deleted: 'Page deleted', nb_summary: "Insert today's summary", nb_export: 'Export as text',
      nb_sum_title: 'Summary of {d}', nb_sum_focus: 'Focus: {m} across {n} session(s)', nb_sum_tasks: 'Tasks done: {list}', nb_sum_none: 'none', nb_sum_mood: 'Mood: {mood}', nb_sum_sport: 'Sport: {list}',
      fmt_b: 'Bold', fmt_i: 'Italic', fmt_u: 'Underline', fmt_s: 'Strikethrough', fmt_h2: 'Heading', fmt_h3: 'Subheading', fmt_ul: 'Bullet list', fmt_ol: 'Numbered list', fmt_check: 'Checklist',
      fmt_quote: 'Quote', fmt_mark: 'Highlight', fmt_hr: 'Divider', fmt_clear: 'Clear formatting', nb_daily_tag: 'day',
    },
  });
  ML.defaults(() => ({ notes: { pages: [], current: null } }));

  /* ---------- Sanitizer: only simple formatting survives (also for pasted content) ---------- */
  const ALLOWED = new Set(['P', 'DIV', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'H2', 'H3', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'MARK', 'HR', 'SPAN']);
  function clean(node, doc) {
    const out = doc.createDocumentFragment();
    node.childNodes.forEach(ch => {
      if (ch.nodeType === 3) { out.appendChild(doc.createTextNode(ch.textContent)); return; }
      if (ch.nodeType !== 1) return;
      let tag = ch.tagName === 'H1' ? 'H2' : ch.tagName === 'H4' || ch.tagName === 'H5' || ch.tagName === 'H6' ? 'H3' : ch.tagName;
      if (!ALLOWED.has(tag)) { out.appendChild(clean(ch, doc)); return; } // unwrap unknown tags, keep their text
      const el = doc.createElement(tag);
      if (tag === 'UL' && ch.classList.contains('checklist')) el.className = 'checklist';
      if (tag === 'LI' && ch.classList.contains('done')) el.className = 'done';
      el.appendChild(clean(ch, doc));
      out.appendChild(el);
    });
    return out;
  }
  function sanitize(html) {
    const doc = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html');
    const box = document.createElement('div');
    box.appendChild(clean(doc.body.firstChild, document));
    return box.innerHTML;
  }
  const textOf = html => { const d = document.createElement('div'); d.innerHTML = sanitize(html); return d.textContent || ''; };

  /* ---------- Pages ---------- */
  const N = () => S.notes;
  const page = id => N().pages.find(p => p.id === id);
  const dailyLabel = k => parseDay(k).toLocaleDateString(ML.locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  function openDaily() {
    const k = today();
    let p = N().pages.find(x => x.date === k);
    if (!p) { p = { id: uid(), date: k, title: dailyLabel(k), html: '', created: Date.now(), updated: Date.now(), pinned: false, mood: S.mood }; N().pages.unshift(p); save(); }
    N().current = p.id; render();
  }
  function newPage() {
    const p = { id: uid(), date: null, title: '', html: '', created: Date.now(), updated: Date.now(), pinned: false, mood: S.mood };
    N().pages.unshift(p); N().current = p.id; save(); render();
    setTimeout(() => { const ti = $('nb-title'); if (ti) ti.focus(); }, 30);
  }
  ML.openDailyNote = () => { ML.setTab('notes'); openDaily(); };
  // Other modules (Study search, translator) can drop a snippet at the end of today's page
  ML.notesAppend = html => {
    flush();
    const k = today();
    let p = N().pages.find(x => x.date === k);
    if (!p) { p = { id: uid(), date: k, title: dailyLabel(k), html: '', created: Date.now(), updated: Date.now(), pinned: false, mood: S.mood }; N().pages.unshift(p); }
    p.html = sanitize((p.html || '') + html); p.updated = Date.now(); save();
    if (S.tab === 'notes') render();
  };

  /* ---------- Rendering ---------- */
  let query = '', saveT = null;
  const TOOLS = [['b', 'bold', '<b>B</b>'], ['i', 'italic', '<i>I</i>'], ['u', 'underline', '<u>U</u>'], ['s', 'strikeThrough', '<s>S</s>'], ['|'],
    ['h2', 'h2', 'H1'], ['h3', 'h3', 'H2'], ['|'], ['ul', 'insertUnorderedList', '•'], ['ol', 'insertOrderedList', '1.'], ['check', 'check', '☑'], ['|'],
    ['quote', 'blockquote', '❝'], ['mark', 'mark', '<mark>A</mark>'], ['hr', 'insertHorizontalRule', '―'], ['clear', 'removeFormat', '⌫']];
  function listHtml() {
    const q = query.trim().toLowerCase();
    const pages = N().pages.filter(p => !q || (p.title + ' ' + textOf(p.html)).toLowerCase().includes(q))
      .sort((a, b) => (b.pinned - a.pinned) || (b.updated - a.updated));
    if (!N().pages.length) return `<p class="hint">${esc(t('nb_empty'))}</p>`;
    if (!pages.length) return `<p class="hint">${esc(t('nb_none'))}</p>`;
    return `<ul class="nb-list">${pages.map(p => {
      const ex = textOf(p.html).trim().slice(0, 90);
      return `<li><button type="button" class="nb-item ${p.id === N().current ? 'on' : ''}" data-page="${p.id}">
        <b>${p.pinned ? '📌 ' : ''}${esc(p.title || '…')}</b>
        <small>${esc(new Date(p.updated).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' }))}${p.date ? ' · ' + esc(t('nb_daily_tag')) : ''}</small>
        ${ex ? `<span>${esc(ex)}</span>` : ''}</button></li>`;
    }).join('')}</ul>`;
  }
  function render() {
    const root = $('notes'); if (!root) return;
    let p = page(N().current);
    if (!p && N().pages.length) { p = N().pages.slice().sort((a, b) => b.updated - a.updated)[0]; N().current = p.id; }
    const words = p ? (textOf(p.html).trim().match(/\S+/g) || []).length : 0;
    root.innerHTML = `
      <div class="nb-head">
        <button type="button" class="primary small" id="nb-today">📖 ${esc(t('nb_today'))}</button>
        <button type="button" class="small" id="nb-new">+ ${esc(t('nb_new'))}</button>
        <input type="search" id="nb-search" placeholder="${esc(t('nb_search'))}" value="${esc(query)}">
      </div>
      <div class="nb-layout">
        <details class="nb-side" ${innerWidth >= 900 || !p ? 'open' : ''}><summary class="label">${esc(t('nb_pages'))} (${N().pages.length})</summary><div id="nb-list">${listHtml()}</div></details>
        ${p ? `<article class="nb-page">
          <input type="text" class="nb-title" id="nb-title" maxlength="120" placeholder="${esc(t('nb_title_ph'))}" value="${esc(p.title)}">
          <div class="nb-meta"><span>${esc(new Date(p.created).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'long', year: 'numeric' }))}</span>
            ${p.mood ? `<span class="chip">${esc(t('mood_' + p.mood))}</span>` : ''}
            <span id="nb-words">${esc(tn('nb_words', words))}</span><span class="nb-state" id="nb-state">${esc(t('nb_saved'))}</span></div>
          <div class="nb-tools" role="toolbar">${TOOLS.map(x => x[0] === '|' ? '<i class="sep"></i>' : `<button type="button" class="tool" data-fmt="${x[0]}" title="${esc(t('fmt_' + x[0]))}" aria-label="${esc(t('fmt_' + x[0]))}">${x[2]}</button>`).join('')}</div>
          <div class="nb-body" id="nb-body" contenteditable="true" spellcheck="true" data-ph="${esc(t('nb_body_ph'))}">${sanitize(p.html)}</div>
          <div class="nb-actions">
            <button type="button" class="small ghost" id="nb-sum">✦ ${esc(t('nb_summary'))}</button>
            <button type="button" class="small ghost" id="nb-pin">${esc(p.pinned ? t('nb_unpin') : t('nb_pin'))}</button>
            ${ML.CAN_DOWNLOAD ? `<button type="button" class="small ghost" id="nb-export">${esc(t('nb_export'))}</button>` : ''}
            <button type="button" class="small ghost danger" id="nb-del">${esc(t('nb_delete'))}</button>
          </div>
        </article>` : ''}
      </div>`;
    bind(p);
  }
  function setState(saving) { const el = $('nb-state'); if (el) el.textContent = saving ? t('nb_saving') : t('nb_saved'); }
  function persist(p0) {
    clearTimeout(saveT); setState(true);
    saveT = setTimeout(() => {
      saveT = null;
      const p = page(p0.id) || p0; // a sync may have replaced the state since this page was opened
      const body = $('nb-body'), ti = $('nb-title');
      if (body) p.html = sanitize(body.innerHTML);
      if (ti) p.title = ti.value.trim();
      p.updated = Date.now(); save(); setState(false);
      const w = $('nb-words'); if (w) w.textContent = tn('nb_words', (textOf(p.html).trim().match(/\S+/g) || []).length);
      const l = $('nb-list'); if (l) l.innerHTML = listHtml();
    }, 600);
  }
  function bind(p) {
    $('nb-today').onclick = openDaily;
    $('nb-new').onclick = newPage;
    $('nb-search').oninput = e => { query = e.target.value; $('nb-list').innerHTML = listHtml(); };
    $('nb-list').onclick = e => { const b = e.target.closest('[data-page]'); if (b) { flush(); N().current = b.dataset.page; save(); render(); } };
    if (!p) return;
    const body = $('nb-body');
    $('nb-title').oninput = () => persist(p);
    body.oninput = () => persist(p);
    body.addEventListener('paste', e => {
      e.preventDefault();
      const html = e.clipboardData.getData('text/html'), text = e.clipboardData.getData('text/plain');
      document.execCommand('insertHTML', false, html ? sanitize(html) : esc(text).replace(/\n/g, '<br>'));
    });
    // Tick checklist items by clicking their box (the left gutter of the line)
    body.addEventListener('click', e => {
      const li = e.target.closest('ul.checklist > li');
      if (li && e.offsetX < 26) { li.classList.toggle('done'); persist(p); emit('note:check'); }
    });
    document.querySelector('.nb-tools').addEventListener('mousedown', e => e.preventDefault()); // keep the text selection
    document.querySelector('.nb-tools').onclick = e => {
      const b = e.target.closest('[data-fmt]'); if (!b) return;
      body.focus();
      const f = b.dataset.fmt, cmd = TOOLS.find(x => x[0] === f)[1];
      if (cmd === 'h2' || cmd === 'h3' || cmd === 'blockquote') {
        const cur = document.queryCommandValue('formatBlock').toLowerCase();
        document.execCommand('formatBlock', false, cur === cmd ? 'div' : cmd);
      } else if (cmd === 'mark') {
        const sel = getSelection(); if (!sel.rangeCount || sel.isCollapsed) return;
        const r = sel.getRangeAt(0), mk = document.createElement('mark');
        try { r.surroundContents(mk); } catch (err) { document.execCommand('hiliteColor', false, '#ffd23f55'); }
      } else if (cmd === 'check') {
        document.execCommand('insertUnorderedList');
        const sel = getSelection(); const node = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
        const ul = node && node.closest('ul'); if (ul) ul.classList.add('checklist');
      } else document.execCommand(cmd);
      persist(p);
    };
    $('nb-pin').onclick = () => { const cur = page(p.id) || p; cur.pinned = !cur.pinned; save(); render(); };
    $('nb-sum').onclick = () => { body.focus(); document.execCommand('insertHTML', false, summaryHtml()); persist(p); };
    if ($('nb-export')) $('nb-export').onclick = () => {
      try {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([(p.title || 'note') + '\n\n' + body.innerText], { type: 'text/plain' }));
        a.download = (p.title || 'note').replace(/[^\w\-]+/g, '_').slice(0, 60) + '.txt'; document.body.appendChild(a); a.click(); a.remove();
      } catch (e) {}
    };
    ML.armedButton($('nb-del'), 'nb_delete', () => {
      N().pages = N().pages.filter(x => x.id !== p.id); N().current = null; save(); render(); toast(t('nb_deleted'));
    });
  }
  function flush() { if (saveT) { clearTimeout(saveT); saveT = null; const p = page(N().current), body = $('nb-body'), ti = $('nb-title'); if (p && body) { p.html = sanitize(body.innerHTML); if (ti) p.title = ti.value.trim(); p.updated = Date.now(); save(); } } }
  // A short recap of the day built from the app's own data
  function summaryHtml() {
    const td = today(), ss = S.sessions.filter(s => dayKey(new Date(s.at)) === td);
    const done = S.tasks.filter(x => x.doneAt && dayKey(new Date(x.doneAt)) === td).map(x => ML.titleOf(x));
    const sport = ((S.sport && S.sport.workouts) || []).filter(w => dayKey(new Date(w.at)) === td).map(w => w.title + ' (' + fmtMins(w.mins) + ')');
    return `<h3>${esc(t('nb_sum_title', { d: parseDay(td).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'long' }) }))}</h3><ul>
      <li>${esc(t('nb_sum_mood', { mood: t('mood_' + S.mood) }))}</li>
      <li>${esc(t('nb_sum_focus', { m: fmtMins(ss.reduce((a, s) => a + s.mins, 0)), n: ss.length }))}</li>
      <li>${esc(t('nb_sum_tasks', { list: done.length ? done.join(', ') : t('nb_sum_none') }))}</li>
      ${sport.length ? `<li>${esc(t('nb_sum_sport', { list: sport.join(', ') }))}</li>` : ''}</ul><p><br></p>`;
  }

  on('tab', name => { if (name === 'notes') render(); else flush(); });
  on('render', () => { if (S.tab === 'notes' && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('.nb-page'))) render(); });
  addEventListener('pagehide', flush);
})();
