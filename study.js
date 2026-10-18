// Study tab (Premium): Anki-style flashcards with spaced repetition, an in-app search that shows
// Wikipedia summaries, and a translator (MyMemory). Locked unless the signed-in account has
// app_metadata.premium = true (set on the server, see sync.js).
(() => {
  'use strict';
  const { $, S, t, tn, esc, save, on, emit, toast, uid, today, addDays } = ML;

  ML.addStrings({
    fr: {
      tab_study: 'Étude', st_cards: 'Flashcards', st_search: 'Recherche', st_translate: 'Traduction',
      st_locked_h: 'Laboratoire d’étude', st_locked_badge: 'Premium', st_locked_p: 'Des outils pour étudier sans quitter l’app. Cette section arrive bientôt en Premium.',
      st_f_cards: 'Flashcards à répétition espacée, comme Anki : l’app te repose chaque carte juste avant que tu l’oublies.',
      st_f_search: 'Recherche intégrée : résumés Wikipédia directement dans l’app, à envoyer dans ton Carnet.',
      st_f_translate: 'Traducteur : traduis un mot ou un paragraphe, écoute la prononciation, transforme-le en flashcard.',
      st_locked_how: 'Déjà Premium ? Connecte-toi avec ton compte, la section se débloque toute seule.',
      fc_decks: 'Mes paquets', fc_new_deck_ph: 'Nom du paquet (ex. Anglais, Histoire…)', fc_create: 'Créer', fc_due: '{n} à revoir', fc_due_one: '{n} à revoir', fc_cards_n: '{n} cartes', fc_cards_n_one: '{n} carte',
      fc_review: 'Réviser', fc_open: 'Ouvrir', fc_none: 'Aucun paquet. Crée-en un pour commencer.', fc_back: '← Paquets', fc_front: 'Recto (question)', fc_backside: 'Verso (réponse)',
      fc_add: 'Ajouter la carte', fc_added: 'Carte ajoutée', fc_bulk: 'Importer en masse', fc_bulk_hint: 'Une carte par ligne : question ; réponse (ou séparées par une tabulation, comme un export Anki).',
      fc_bulk_btn: 'Importer', fc_bulk_done: '{n} carte(s) importée(s)', fc_empty: 'Pas encore de cartes dans ce paquet.', fc_del_deck: 'Supprimer le paquet', fc_deck_deleted: 'Paquet supprimé',
      fc_show: 'Afficher la réponse', fc_again: 'À revoir', fc_hard: 'Difficile', fc_good: 'Bien', fc_easy: 'Facile', fc_left: '{n} restante(s)',
      fc_done_h: 'Session terminée', fc_done_p: '{n} carte(s) révisée(s). +{xp} XP', fc_nothing: 'Rien à réviser pour l’instant. Reviens plus tard ou ajoute des cartes.',
      fc_keys: 'Espace : retourner · 1 à 4 : noter', fc_today: 'Aujourd’hui : {n} révision(s)', fc_new: 'nouvelle', fc_edit: 'Modifier', fc_delete: 'Supprimer', fc_save: 'Enregistrer',
      fc_tr_deck: 'Traductions',
      sr_ph: 'Chercher un sujet, une notion, une personne…', sr_go: 'Chercher', sr_web: 'Recherche web complète', sr_read: 'Lire l’article', sr_to_note: 'Ajouter au Carnet', sr_noted: 'Ajouté à la page du jour du Carnet',
      sr_none: 'Aucun résultat sur Wikipédia.', sr_err: 'Recherche impossible. Vérifie ta connexion.', sr_more: 'Autres résultats', sr_hint: 'Les résumés viennent de Wikipédia. Le web complet s’ouvre dans un nouvel onglet.',
      tr_ph: 'Texte à traduire…', tr_go: 'Traduire', tr_swap: 'Inverser', tr_copy: 'Copier', tr_copied: 'Copié', tr_listen: 'Écouter', tr_to_card: 'En faire une flashcard', tr_card_ok: 'Flashcard ajoutée au paquet « {deck} »',
      tr_err: 'Traduction impossible pour l’instant (limite quotidienne ou connexion).', tr_hint: 'Traduction fournie par MyMemory : le texte est envoyé à leur service. Évite d’y mettre des informations personnelles.',
      lang_fr: 'Français', lang_en: 'Anglais', lang_es: 'Espagnol', lang_de: 'Allemand', lang_it: 'Italien', lang_pt: 'Portugais', lang_nl: 'Néerlandais', lang_ru: 'Russe', lang_ar: 'Arabe', lang_zh: 'Chinois', lang_ja: 'Japonais', lang_ko: 'Coréen',
    },
    en: {
      tab_study: 'Study', st_cards: 'Flashcards', st_search: 'Search', st_translate: 'Translate',
      st_locked_h: 'Study lab', st_locked_badge: 'Premium', st_locked_p: 'Tools to study without leaving the app. This section is coming soon as Premium.',
      st_f_cards: 'Spaced-repetition flashcards, like Anki: the app shows each card again just before you would forget it.',
      st_f_search: 'Built-in search: Wikipedia summaries right in the app, ready to send to your Notebook.',
      st_f_translate: 'Translator: translate a word or a paragraph, hear it spoken, turn it into a flashcard.',
      st_locked_how: 'Already Premium? Sign in with your account and the section unlocks by itself.',
      fc_decks: 'My decks', fc_new_deck_ph: 'Deck name (e.g. Spanish, History…)', fc_create: 'Create', fc_due: '{n} due', fc_due_one: '{n} due', fc_cards_n: '{n} cards', fc_cards_n_one: '{n} card',
      fc_review: 'Review', fc_open: 'Open', fc_none: 'No decks yet. Create one to start.', fc_back: '← Decks', fc_front: 'Front (question)', fc_backside: 'Back (answer)',
      fc_add: 'Add card', fc_added: 'Card added', fc_bulk: 'Bulk import', fc_bulk_hint: 'One card per line: question ; answer (or tab-separated, like an Anki export).',
      fc_bulk_btn: 'Import', fc_bulk_done: '{n} card(s) imported', fc_empty: 'No cards in this deck yet.', fc_del_deck: 'Delete deck', fc_deck_deleted: 'Deck deleted',
      fc_show: 'Show answer', fc_again: 'Again', fc_hard: 'Hard', fc_good: 'Good', fc_easy: 'Easy', fc_left: '{n} left',
      fc_done_h: 'Session complete', fc_done_p: '{n} card(s) reviewed. +{xp} XP', fc_nothing: 'Nothing to review right now. Come back later or add cards.',
      fc_keys: 'Space: flip · 1 to 4: rate', fc_today: 'Today: {n} review(s)', fc_new: 'new', fc_edit: 'Edit', fc_delete: 'Delete', fc_save: 'Save',
      fc_tr_deck: 'Translations',
      sr_ph: 'Search a topic, a concept, a person…', sr_go: 'Search', sr_web: 'Full web search', sr_read: 'Read the article', sr_to_note: 'Add to Notebook', sr_noted: "Added to today's Notebook page",
      sr_none: 'No Wikipedia results.', sr_err: "Can't search right now. Check your connection.", sr_more: 'More results', sr_hint: 'Summaries come from Wikipedia. The full web opens in a new tab.',
      tr_ph: 'Text to translate…', tr_go: 'Translate', tr_swap: 'Swap', tr_copy: 'Copy', tr_copied: 'Copied', tr_listen: 'Listen', tr_to_card: 'Make it a flashcard', tr_card_ok: 'Flashcard added to the "{deck}" deck',
      tr_err: "Can't translate right now (daily limit or connection).", tr_hint: 'Translation by MyMemory: the text is sent to their service. Avoid personal information.',
      lang_fr: 'French', lang_en: 'English', lang_es: 'Spanish', lang_de: 'German', lang_it: 'Italian', lang_pt: 'Portuguese', lang_nl: 'Dutch', lang_ru: 'Russian', lang_ar: 'Arabic', lang_zh: 'Chinese', lang_ja: 'Japanese', lang_ko: 'Korean',
    },
  });
  ML.defaults(() => ({ study: { tool: 'cards', decks: [], cards: [], tr: { from: 'fr', to: 'en' }, day: null, reviewed: 0 } }));

  ML.isPremium = () => !!(ML.auth && ML.auth.user && ML.auth.user.premium);
  const ST = () => S.study;
  const icon = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    cards: '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    translate: '<path d="M4 5h9M8.5 3v2M6 5c.6 3 2.6 5.6 5.5 7M11 5c-.8 3.6-3.4 6.6-7 8"/><path d="M13 21l4-9 4 9M14.4 18h5.2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  };
  const multiline = s => esc(s).replace(/\n/g, '<br>');

  /* ---------- Rendering ---------- */
  function render() {
    const root = $('study'); if (!root) return;
    $('study-lock').style.display = ML.isPremium() ? 'none' : '';
    if (!ML.isPremium()) { root.innerHTML = lockedHtml(); return; }
    const tool = ST().tool;
    root.innerHTML = `<div class="st-tools" role="group">${['cards', 'search', 'translate'].map(k =>
      `<button type="button" data-tool="${k}" aria-pressed="${tool === k}">${icon(ICONS[k])}<span>${esc(t('st_' + k))}</span></button>`).join('')}</div>
      <div class="st-body" id="st-body"></div>`;
    renderTool();
  }
  function renderTool() {
    const el = $('st-body'); if (!el) return;
    const tool = ST().tool;
    el.innerHTML = tool === 'search' ? searchHtml() : tool === 'translate' ? translateHtml() : cardsHtml();
    if (tool === 'search' && !sres) { const i = $('sr-q'); if (i && innerWidth >= 900) i.focus(); }
  }
  function lockedHtml() {
    return `<div class="st-locked">
      <div class="st-lock-badge">${icon(ICONS.lock)}<span>${esc(t('st_locked_badge'))}</span></div>
      <h3>${esc(t('st_locked_h'))}</h3>
      <p class="hint">${esc(t('st_locked_p'))}</p>
      <ul class="st-feats">${['cards', 'search', 'translate'].map(k => `<li>${icon(ICONS[k])}<div><b>${esc(t('st_' + k))}</b><span>${esc(t('st_f_' + k))}</span></div></li>`).join('')}</ul>
      ${ML.auth && ML.auth.enabled && !ML.auth.user ? `<p class="hint">${esc(t('st_locked_how'))}</p>` : ''}
    </div>`;
  }

  /* ---------- Flashcards (spaced repetition, Anki-style) ---------- */
  let view = { kind: 'decks' }; // { kind: 'decks' } | { kind: 'deck', id } | { kind: 'review', id, queue, shown, done, editing }
  const deckCards = id => ST().cards.filter(c => c.deck === id);
  const isDue = c => !c.due || c.due <= today();
  const NEW_PER_SESSION = 20;
  function queueFor(id) {
    const cs = deckCards(id).filter(isDue);
    const fresh = cs.filter(c => !c.reps).slice(0, NEW_PER_SESSION), old = cs.filter(c => c.reps);
    return [...old.sort((a, b) => (a.due || '').localeCompare(b.due || '')), ...fresh].map(c => c.id);
  }
  // Next interval in days for each answer (1 Again, 2 Hard, 3 Good, 4 Easy)
  function schedule(c, q) {
    const ease = c.ease || 2.5, ivl = c.ivl || 0, isNew = !c.reps;
    if (q === 1) return { ivl: 0, ease: isNew ? ease : Math.max(1.3, ease - 0.2), lapse: !isNew };
    if (isNew) return { ivl: q === 2 ? 1 : q === 3 ? 1 : 4, ease: q === 4 ? ease + 0.15 : ease };
    if (q === 2) return { ivl: Math.max(1, Math.round(ivl * 1.2)), ease: Math.max(1.3, ease - 0.15) };
    if (q === 3) return { ivl: Math.max(ivl + 1, Math.round(ivl * ease)), ease };
    return { ivl: Math.max(ivl + 2, Math.round(ivl * ease * 1.3)), ease: ease + 0.15 };
  }
  const ivlLabel = d => {
    const en = S.lang === 'en';
    if (d === 0) return '<10 min';
    if (d < 30) return d + (en ? ' d' : ' j');
    if (d < 365) return Math.round(d / 30) + (en ? ' mo' : ' mois');
    return (d / 365).toFixed(1) + (en ? ' y' : ' an');
  };
  function cardsHtml() {
    if (view.kind === 'review') return reviewHtml();
    if (view.kind === 'deck' && ST().decks.some(d => d.id === view.id)) return deckHtml(view.id);
    view = { kind: 'decks' };
    const D = ST(), todayN = D.day === today() ? D.reviewed : 0;
    return `<div class="fc-head"><h3>${esc(t('fc_decks'))}</h3>${todayN ? `<span class="chip">${esc(t('fc_today', { n: todayN }))}</span>` : ''}</div>
      <form class="fc-newdeck" id="fc-newdeck" autocomplete="off"><input type="text" maxlength="60" placeholder="${esc(t('fc_new_deck_ph'))}" required><button type="submit" class="primary small">${esc(t('fc_create'))}</button></form>
      ${D.decks.length ? `<ul class="fc-decks">${D.decks.map(d => {
        const all = deckCards(d.id), due = queueFor(d.id).length;
        return `<li><button type="button" class="fc-deck-name" data-fc-open="${d.id}"><b>${esc(d.name)}</b><small>${esc(tn('fc_cards_n', all.length))}</small></button>
          ${due ? `<span class="chip due-chip">${esc(tn('fc_due', due))}</span>` : ''}
          <button type="button" class="small ${due ? 'primary' : ''}" data-fc-review="${d.id}" ${due ? '' : 'disabled'}>${esc(t('fc_review'))}</button></li>`;
      }).join('')}</ul>` : `<p class="hint">${esc(t('fc_none'))}</p>`}`;
  }
  function deckHtml(id) {
    const d = ST().decks.find(x => x.id === id), cs = deckCards(id), due = queueFor(id).length;
    return `<div class="fc-head"><button type="button" class="ghost small" data-fc-back>${esc(t('fc_back'))}</button><h3>${esc(d.name)}</h3>
        <button type="button" class="small ${due ? 'primary' : ''}" data-fc-review="${id}" ${due ? '' : 'disabled'}>${esc(t('fc_review'))}${due ? ' · ' + due : ''}</button></div>
      <form class="fc-add" id="fc-add" autocomplete="off">
        <textarea name="front" rows="2" maxlength="600" placeholder="${esc(t('fc_front'))}" required></textarea>
        <textarea name="back" rows="2" maxlength="1200" placeholder="${esc(t('fc_backside'))}" required></textarea>
        <button type="submit" class="primary small">${esc(t('fc_add'))}</button>
      </form>
      <details class="fc-bulk"><summary>${esc(t('fc_bulk'))}</summary>
        <p class="hint">${esc(t('fc_bulk_hint'))}</p>
        <textarea id="fc-bulk-in" rows="5" placeholder="hello ; bonjour&#10;thank you ; merci"></textarea>
        <button type="button" class="small" id="fc-bulk-go">${esc(t('fc_bulk_btn'))}</button>
      </details>
      ${cs.length ? `<ul class="fc-list">${cs.slice().reverse().map(c => view.editing === c.id
        ? `<li class="editing"><form class="fc-edit" data-fc-edit="${c.id}"><textarea name="front" rows="2" maxlength="600" required>${esc(c.front)}</textarea><textarea name="back" rows="2" maxlength="1200" required>${esc(c.back)}</textarea>
            <div class="fc-row"><button type="button" class="small ghost" data-fc-cancel>${esc(t('cancel'))}</button><button type="submit" class="small primary">${esc(t('fc_save'))}</button></div></form></li>`
        : `<li><div class="fc-q">${multiline(c.front)}</div><div class="fc-a">${multiline(c.back)}</div>
            <div class="fc-meta"><small>${c.reps ? esc(c.due <= today() ? t('fc_due', { n: '' }).trim() : c.due) : esc(t('fc_new'))}</small>
            <button type="button" class="link" data-fc-edit-open="${c.id}">${esc(t('fc_edit'))}</button>
            <button type="button" class="link danger" data-fc-del="${c.id}">${esc(t('fc_delete'))}</button></div></li>`).join('')}</ul>`
        : `<p class="hint">${esc(t('fc_empty'))}</p>`}
      <button type="button" class="small ghost danger" id="fc-del-deck">${esc(t('fc_del_deck'))}</button>`;
  }
  function reviewHtml() {
    const id = view.queue[0], c = id && ST().cards.find(x => x.id === id);
    if (!c) {
      return `<div class="fc-review fc-done"><h3>${esc(t('fc_done_h'))}</h3><p>${view.done ? esc(t('fc_done_p', { n: view.done, xp: view.xp || 0 })) : esc(t('fc_nothing'))}</p>
        <button type="button" class="primary small" data-fc-back>${esc(t('fc_back'))}</button></div>`;
    }
    const opts = [1, 2, 3, 4].map(q => ({ q, s: schedule(c, q) }));
    return `<div class="fc-review">
      <div class="fc-top"><button type="button" class="ghost small" data-fc-back>${esc(t('fc_back'))}</button><span class="chip">${esc(t('fc_left', { n: view.queue.length }))}</span></div>
      <div class="fc-card ${view.shown ? 'flipped' : ''}" id="fc-card">
        <div class="fc-face">${multiline(c.front)}</div>
        ${view.shown ? `<hr><div class="fc-face fc-answer">${multiline(c.back)}</div>` : ''}
      </div>
      ${view.shown
        ? `<div class="fc-rate">${opts.map(({ q, s }) => `<button type="button" class="r${q}" data-fc-rate="${q}"><b>${esc(t(['', 'fc_again', 'fc_hard', 'fc_good', 'fc_easy'][q]))}</b><small>${esc(ivlLabel(s.ivl))}</small></button>`).join('')}</div>`
        : `<button type="button" class="primary fc-show" data-fc-show>${esc(t('fc_show'))}</button>`}
      <p class="hint fc-keys">${esc(t('fc_keys'))}</p>
    </div>`;
  }
  function startReview(id) { view = { kind: 'review', id, queue: queueFor(id), shown: false, done: 0, xp: 0 }; renderTool(); }
  function rate(q) {
    const id = view.queue.shift(), c = ST().cards.find(x => x.id === id); if (!c) return;
    const s = schedule(c, q);
    c.ease = s.ease; c.ivl = s.ivl; c.due = addDays(today(), s.ivl); c.updated = Date.now();
    if (s.lapse) c.lapses = (c.lapses || 0) + 1;
    if (q === 1) { c.reps = c.reps || 0; view.queue.splice(Math.min(view.queue.length, 3), 0, id); } // see it again in a few cards
    else c.reps = (c.reps || 0) + 1;
    const D = ST(); if (D.day !== today()) { D.day = today(); D.reviewed = 0; }
    D.reviewed++; view.done++;
    view.shown = false;
    if (!view.queue.length) { const xp = Math.min(40, view.done); view.xp = xp; if (xp) ML.addXp(xp); emit('study:session', view.done); if (ML.sfx) ML.sfx('quest'); }
    save(); renderTool();
  }
  function addCard(deck, front, back) {
    const c = { id: uid(), deck, front: front.trim().slice(0, 600), back: back.trim().slice(0, 1200), due: today(), ivl: 0, ease: 2.5, reps: 0, lapses: 0, created: Date.now() };
    ST().cards.push(c); return c;
  }

  /* ---------- Search (Wikipedia summaries) ---------- */
  let sq = '', sres = null, sloading = false;
  const wikiLang = () => (S.lang === 'en' ? 'en' : 'fr');
  async function wikiSummary(lang, title) {
    try { const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`); return r.ok ? await r.json() : null; } catch (e) { return null; }
  }
  async function search(q) {
    sq = q; sloading = true; renderTool();
    const lang = wikiLang();
    try {
      const r = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=7&format=json&origin=*`).then(x => x.json());
      const hits = ((r.query && r.query.search) || []).map(h => ({ title: h.title, snippet: textOf(h.snippet) }));
      const top = hits[0] ? await wikiSummary(lang, hits[0].title) : null;
      sres = { q, lang, hits, top };
    } catch (e) { sres = { q, error: true }; }
    sloading = false;
    if (ST().tool === 'search') renderTool();
  }
  const textOf = html => { const d = document.createElement('div'); d.innerHTML = html || ''; return d.textContent || ''; };
  function searchHtml() {
    const R = sres, top = R && R.top;
    const web = q => `<a class="small-link" href="https://duckduckgo.com/?q=${encodeURIComponent(q)}" target="_blank" rel="noopener">DuckDuckGo ↗</a><a class="small-link" href="https://www.google.com/search?q=${encodeURIComponent(q)}" target="_blank" rel="noopener">Google ↗</a>`;
    return `<form class="sr-form" id="sr-form" autocomplete="off" role="search"><input type="search" id="sr-q" maxlength="200" placeholder="${esc(t('sr_ph'))}" value="${esc(sq)}"><button type="submit" class="primary small">${esc(t('sr_go'))}</button></form>
      ${sloading ? `<div class="sr-loading"><i></i><i></i><i></i></div>` : ''}
      ${R && !sloading ? (R.error ? `<p class="hint">${esc(t('sr_err'))}</p>` : !R.hits.length ? `<p class="hint">${esc(t('sr_none'))}</p>` : `
        ${top ? `<article class="sr-top">
          ${top.thumbnail ? `<img src="${esc(top.thumbnail.source)}" alt="" loading="lazy">` : ''}
          <div><h3>${esc(top.title)}</h3>${top.description ? `<p class="sr-desc">${esc(top.description)}</p>` : ''}
          <p>${esc(top.extract || '')}</p>
          <div class="sr-actions">
            ${top.content_urls ? `<a class="small-link" href="${esc(top.content_urls.desktop.page)}" target="_blank" rel="noopener">${esc(t('sr_read'))} ↗</a>` : ''}
            <button type="button" class="small" id="sr-note">✎ ${esc(t('sr_to_note'))}</button>
          </div></div>
        </article>` : ''}
        ${R.hits.length > 1 ? `<p class="label">${esc(t('sr_more'))}</p><ul class="sr-hits">${R.hits.filter(h => !top || h.title !== top.title).map(h => `<li><button type="button" data-sr-hit="${esc(h.title)}"><b>${esc(h.title)}</b><span>${esc(h.snippet)}…</span></button></li>`).join('')}</ul>` : ''}`) : ''}
      ${sq ? `<div class="sr-web"><span class="label">${esc(t('sr_web'))}</span>${web(sq)}</div>` : ''}
      <p class="hint">${esc(t('sr_hint'))}</p>`;
  }

  /* ---------- Translator (MyMemory, 500-character chunks) ---------- */
  const LANGS = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'ru', 'ar', 'zh', 'ja', 'ko'];
  let trIn = '', trOut = '', trBusy = false, trErr = false;
  function chunks(text) {
    const parts = text.match(/[^.!?\n]+[.!?\n]*|\s+/g) || [text], out = [];
    let cur = '';
    parts.forEach(p => { if ((cur + p).length > 450 && cur) { out.push(cur); cur = ''; } cur += p; });
    if (cur.trim()) out.push(cur);
    return out.flatMap(c => (c.length > 450 ? c.match(/[\s\S]{1,450}/g) : [c]));
  }
  async function translate() {
    const text = trIn.trim(); if (!text) return;
    const { from, to } = ST().tr;
    trBusy = true; trErr = false; renderTool();
    try {
      const res = [];
      for (const c of chunks(text)) {
        if (!c.trim()) { res.push(c); continue; }
        const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(c)}&langpair=${from}|${to}`).then(x => x.json());
        if (!r || !r.responseData || (r.responseStatus && +r.responseStatus !== 200)) throw new Error('tr');
        res.push(textOf(r.responseData.translatedText));
      }
      trOut = res.join(' ').replace(/\s+\n/g, '\n').trim();
    } catch (e) { trErr = true; }
    trBusy = false;
    if (ST().tool === 'translate') renderTool();
  }
  function translateHtml() {
    const { from, to } = ST().tr;
    const sel = (id, cur) => `<select id="${id}">${LANGS.map(l => `<option value="${l}" ${l === cur ? 'selected' : ''}>${esc(t('lang_' + l))}</option>`).join('')}</select>`;
    return `<div class="tr-langs">${sel('tr-from', from)}<button type="button" class="ghost icon-only" id="tr-swap" aria-label="${esc(t('tr_swap'))}" title="${esc(t('tr_swap'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h12l-3-3M17 17H5l3 3"/></svg></button>${sel('tr-to', to)}</div>
      <textarea id="tr-in" rows="4" maxlength="3000" placeholder="${esc(t('tr_ph'))}">${esc(trIn)}</textarea>
      <button type="button" class="primary" id="tr-go" ${trBusy ? 'disabled' : ''}>${trBusy ? '…' : esc(t('tr_go'))}</button>
      ${trErr ? `<p class="hint">${esc(t('tr_err'))}</p>` : ''}
      ${trOut ? `<div class="tr-out" lang="${to}">${multiline(trOut)}</div>
        <div class="tr-actions"><button type="button" class="small" id="tr-copy">${esc(t('tr_copy'))}</button>
        ${'speechSynthesis' in window ? `<button type="button" class="small" id="tr-say">🔊 ${esc(t('tr_listen'))}</button>` : ''}
        <button type="button" class="small" id="tr-card">+ ${esc(t('tr_to_card'))}</button></div>` : ''}
      <p class="hint">${esc(t('tr_hint'))}</p>`;
  }

  /* ---------- Events ---------- */
  const root = $('study');
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) { ST().tool = b.dataset.tool; save(); render(); return; }
    if (b.dataset.fcOpen) { view = { kind: 'deck', id: b.dataset.fcOpen }; renderTool(); return; }
    if (b.dataset.fcReview) { startReview(b.dataset.fcReview); return; }
    if (b.hasAttribute('data-fc-back')) { view = view.kind === 'review' && view.done === 0 && view.queue.length ? { kind: 'deck', id: view.id } : { kind: 'decks' }; renderTool(); return; }
    if (b.hasAttribute('data-fc-show')) { view.shown = true; renderTool(); return; }
    if (b.dataset.fcRate) { rate(+b.dataset.fcRate); return; }
    if (b.dataset.fcEditOpen) { view.editing = b.dataset.fcEditOpen; renderTool(); return; }
    if (b.hasAttribute('data-fc-cancel')) { view.editing = null; renderTool(); return; }
    if (b.dataset.fcDel) { ST().cards = ST().cards.filter(c => c.id !== b.dataset.fcDel); save(); renderTool(); return; }
    if (b.id === 'fc-bulk-go') {
      const lines = $('fc-bulk-in').value.split(/\r?\n/); let n = 0;
      lines.forEach(l => { const m = l.split(/\t|\s;\s|;/); if (m.length >= 2 && m[0].trim() && m.slice(1).join(';').trim()) { addCard(view.id, m[0], m.slice(1).join(';')); n++; } });
      save(); renderTool(); toast(t('fc_bulk_done', { n })); return;
    }
    if (b.dataset.srHit) { (async () => { sloading = true; renderTool(); const s = await wikiSummary(sres.lang, b.dataset.srHit); if (s) sres.top = s; sloading = false; renderTool(); })(); return; }
    if (b.id === 'sr-note' && sres && sres.top) {
      const top = sres.top;
      ML.notesAppend(`<h3>${esc(top.title)}</h3><p>${esc(top.extract || '')}</p><p><i>Wikipédia</i></p>`);
      toast(t('sr_noted')); return;
    }
    if (b.id === 'tr-swap') { const T = ST().tr; [T.from, T.to] = [T.to, T.from]; if (trOut) { trIn = trOut; trOut = ''; } save(); renderTool(); return; }
    if (b.id === 'tr-go') { trIn = $('tr-in').value; translate(); return; }
    if (b.id === 'tr-copy') { try { navigator.clipboard.writeText(trOut).then(() => toast(t('tr_copied'))); } catch (err) {} return; }
    if (b.id === 'tr-say') { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(trOut); u.lang = ST().tr.to; speechSynthesis.speak(u); } catch (err) {} return; }
    if (b.id === 'tr-card') {
      const D = ST(), name = t('fc_tr_deck');
      let deck = D.decks.find(d => d.name === name);
      if (!deck) { deck = { id: uid(), name, created: Date.now() }; D.decks.push(deck); }
      addCard(deck.id, trIn.trim(), trOut); save(); toast(t('tr_card_ok', { deck: name })); return;
    }
  });
  root.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (f.id === 'fc-newdeck') { const v = f.querySelector('input').value.trim(); if (!v) return; const d = { id: uid(), name: v.slice(0, 60), created: Date.now() }; ST().decks.push(d); save(); view = { kind: 'deck', id: d.id }; renderTool(); return; }
    if (f.id === 'fc-add') { addCard(view.id, f.front.value, f.back.value); save(); renderTool(); toast(t('fc_added')); const n = root.querySelector('#fc-add [name=front]'); if (n) n.focus(); return; }
    if (f.dataset.fcEdit) { const c = ST().cards.find(x => x.id === f.dataset.fcEdit); if (c) { c.front = f.front.value.trim(); c.back = f.back.value.trim(); c.updated = Date.now(); save(); } view.editing = null; renderTool(); return; }
    if (f.id === 'sr-form') { const q = $('sr-q').value.trim(); if (q) search(q); }
  });
  root.addEventListener('change', e => {
    if (e.target.id === 'tr-from' || e.target.id === 'tr-to') { ST().tr[e.target.id === 'tr-from' ? 'from' : 'to'] = e.target.value; trIn = $('tr-in').value; save(); }
  });
  root.addEventListener('input', e => { if (e.target.id === 'tr-in') trIn = e.target.value; });
  root.addEventListener('keydown', e => { if (e.target.id === 'tr-in' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); trIn = e.target.value; translate(); } });
  // Deleting a deck asks for a second tap; the button is re-rendered, so arm it by hand
  let delArmed = null;
  root.addEventListener('click', e => {
    const b = e.target.closest('#fc-del-deck'); if (!b) return;
    if (delArmed !== view.id) { delArmed = view.id; b.textContent = t('tap_again'); setTimeout(() => { if (delArmed) { delArmed = null; const x = $('fc-del-deck'); if (x) x.textContent = t('fc_del_deck'); } }, 3000); return; }
    const id = view.id; delArmed = null;
    ST().decks = ST().decks.filter(d => d.id !== id); ST().cards = ST().cards.filter(c => c.deck !== id);
    view = { kind: 'decks' }; save(); renderTool(); toast(t('fc_deck_deleted'));
  });
  // Review keys: Space flips, 1-4 rate. Capture phase so the tab shortcuts (1-7) don't fire meanwhile.
  addEventListener('keydown', e => {
    if (S.tab !== 'study' || ST().tool !== 'cards' || view.kind !== 'review' || !view.queue.length || $('tab-study').hidden || ML.isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (!view.shown) { view.shown = true; renderTool(); } else rate(3); }
    else if (view.shown && '1234'.includes(e.key)) { e.preventDefault(); e.stopPropagation(); rate(+e.key); }
  }, true);

  on('tab', name => { if (name === 'study') render(); });
  on('premium', () => render());
  on('started', () => { const l = $('study-lock'); if (l) l.style.display = ML.isPremium() ? 'none' : ''; if (S.tab === 'study') render(); });
  ML.renderStudy = render;
})();
