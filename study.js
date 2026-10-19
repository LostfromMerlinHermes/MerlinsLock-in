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
      st_f_room: 'Salles d’étude : un minuteur partagé en direct avec tes amis, et tu vois qui est concentré.',
      st_f_tools: 'Boîte à outils : dictionnaire, générateur de bibliographie (APA, MLA, ISO 690…), convertisseur d’unités, formules mathématiques dans le Carnet.',
      st_locked_how: 'Déjà Premium ? Connecte-toi avec ton compte, la section se débloque toute seule.',
      fc_decks: 'Mes paquets', fc_new_deck_ph: 'Nom du paquet (ex. Anglais, Histoire…)', fc_create: 'Créer', fc_due: '{n} à revoir', fc_due_one: '{n} à revoir', fc_cards_n: '{n} cartes', fc_cards_n_one: '{n} carte',
      fc_review: 'Réviser', fc_open: 'Ouvrir', fc_none: 'Aucun paquet. Crée-en un pour commencer.', fc_back: '← Paquets', fc_front: 'Recto (question)', fc_backside: 'Verso (réponse)',
      fc_add: 'Ajouter la carte', fc_added: 'Carte ajoutée', fc_bulk: 'Importer en masse', fc_bulk_hint: 'Une carte par ligne : question ; réponse (ou séparées par une tabulation, comme un export Anki).',
      fc_bulk_btn: 'Importer', fc_bulk_done: '{n} carte(s) importée(s)', fc_empty: 'Pas encore de cartes dans ce paquet.', fc_del_deck: 'Supprimer le paquet', fc_deck_deleted: 'Paquet supprimé',
      fc_show: 'Afficher la réponse', fc_again: 'À revoir', fc_hard: 'Difficile', fc_good: 'Bien', fc_easy: 'Facile', fc_left: '{n} restante(s)',
      fc_done_h: 'Session terminée', fc_done_p: '{n} carte(s) révisée(s). +{xp} XP', fc_nothing: 'Rien à réviser pour l’instant. Reviens plus tard ou ajoute des cartes.',
      fc_keys: 'Espace : retourner · 1 à 4 : noter', fc_today: 'Aujourd’hui : {n} révision(s)', fc_new: 'nouvelle', fc_edit: 'Modifier', fc_delete: 'Supprimer', fc_save: 'Enregistrer',
      fc_tr_deck: 'Traductions', fc_nb_deck: 'Carnet',
      qz_start: 'Quiz', qz_done: 'Quiz terminé', qz_xp: '+{xp} XP', qz_fix: 'Revoir mes {n} erreur(s)', qz_type_ph: 'Ta réponse…', qz_check: 'Valider', qz_right: 'Bonne réponse !', qz_wrong: 'Raté.', qz_answer: 'Réponse', qz_next: 'Question suivante', qz_finish: 'Voir mon score',
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
      st_f_room: 'Study rooms: a live timer shared with your friends, and you see who is focusing.',
      st_f_tools: 'Toolbox: dictionary, bibliography generator (APA, MLA, ISO 690…), unit converter, math formulas in the Notebook.',
      st_locked_how: 'Already Premium? Sign in with your account and the section unlocks by itself.',
      fc_decks: 'My decks', fc_new_deck_ph: 'Deck name (e.g. Spanish, History…)', fc_create: 'Create', fc_due: '{n} due', fc_due_one: '{n} due', fc_cards_n: '{n} cards', fc_cards_n_one: '{n} card',
      fc_review: 'Review', fc_open: 'Open', fc_none: 'No decks yet. Create one to start.', fc_back: '← Decks', fc_front: 'Front (question)', fc_backside: 'Back (answer)',
      fc_add: 'Add card', fc_added: 'Card added', fc_bulk: 'Bulk import', fc_bulk_hint: 'One card per line: question ; answer (or tab-separated, like an Anki export).',
      fc_bulk_btn: 'Import', fc_bulk_done: '{n} card(s) imported', fc_empty: 'No cards in this deck yet.', fc_del_deck: 'Delete deck', fc_deck_deleted: 'Deck deleted',
      fc_show: 'Show answer', fc_again: 'Again', fc_hard: 'Hard', fc_good: 'Good', fc_easy: 'Easy', fc_left: '{n} left',
      fc_done_h: 'Session complete', fc_done_p: '{n} card(s) reviewed. +{xp} XP', fc_nothing: 'Nothing to review right now. Come back later or add cards.',
      fc_keys: 'Space: flip · 1 to 4: rate', fc_today: 'Today: {n} review(s)', fc_new: 'new', fc_edit: 'Edit', fc_delete: 'Delete', fc_save: 'Save',
      fc_tr_deck: 'Translations', fc_nb_deck: 'Notebook',
      qz_start: 'Quiz', qz_done: 'Quiz complete', qz_xp: '+{xp} XP', qz_fix: 'Review my {n} mistake(s)', qz_type_ph: 'Your answer…', qz_check: 'Check', qz_right: 'Correct!', qz_wrong: 'Missed.', qz_answer: 'Answer', qz_next: 'Next question', qz_finish: 'See my score',
      sr_ph: 'Search a topic, a concept, a person…', sr_go: 'Search', sr_web: 'Full web search', sr_read: 'Read the article', sr_to_note: 'Add to Notebook', sr_noted: "Added to today's Notebook page",
      sr_none: 'No Wikipedia results.', sr_err: "Can't search right now. Check your connection.", sr_more: 'More results', sr_hint: 'Summaries come from Wikipedia. The full web opens in a new tab.',
      tr_ph: 'Text to translate…', tr_go: 'Translate', tr_swap: 'Swap', tr_copy: 'Copy', tr_copied: 'Copied', tr_listen: 'Listen', tr_to_card: 'Make it a flashcard', tr_card_ok: 'Flashcard added to the "{deck}" deck',
      tr_err: "Can't translate right now (daily limit or connection).", tr_hint: 'Translation by MyMemory: the text is sent to their service. Avoid personal information.',
      lang_fr: 'French', lang_en: 'English', lang_es: 'Spanish', lang_de: 'German', lang_it: 'Italian', lang_pt: 'Portuguese', lang_nl: 'Dutch', lang_ru: 'Russian', lang_ar: 'Arabic', lang_zh: 'Chinese', lang_ja: 'Japanese', lang_ko: 'Korean',
    },
  });
  ML.defaults(() => ({ study: { tool: 'cards', sub: 'dict', decks: [], cards: [], tr: { from: 'fr', to: 'en' }, day: null, reviewed: 0, bib: [], citeStyle: 'apa', unitCat: 'length', exams: [] } }));
  ML.addStrings({
    fr: {
      tl_exams: 'Examens', ex_intro: 'Donne ta date d’examen et le temps de révision voulu : l’app place des séances espacées (J-21, J-14, J-7, J-3, J-1…) dans ta Journée, et l’examen dans l’Agenda.',
      ex_name_ph: 'Matière ou examen (ex. Partiel de droit)', ex_date: 'Date', ex_hours: 'Heures de révision', ex_deck: 'Paquet de flashcards', ex_plan: 'Planifier mes révisions',
      ex_event: 'Examen : {name}', ex_block: 'Révision : {name}', ex_done: '{n} séance(s) de {m} ajoutée(s) dans ta Journée.', ex_none: 'Plus de place libre dans tes journées avant l’examen.', ex_sessions: '{d}/{n} séances faites', ex_deleted: 'Examen et séances supprimés',
      st_tools: 'Outils', tl_dict: 'Dictionnaire', tl_cite: 'Citations', tl_units: 'Convertisseur',
      dc_ph: 'Un mot à définir…', dc_go: 'Définir', dc_none: 'Aucune définition trouvée.', dc_err: 'Dictionnaire indisponible pour l’instant.', dc_syn: 'Synonymes', dc_card: '+ Flashcard', dc_src: 'Source : {src}',
      ct_ph: 'DOI, ISBN, titre d’article ou adresse web…', ct_go: 'Chercher', ct_pick: 'Choisis la bonne référence', ct_none: 'Rien trouvé. Remplis la fiche à la main.', ct_manual: 'Saisie manuelle',
      ct_author: 'Auteur(s) : Nom, Prénom ; Nom, Prénom', ct_title: 'Titre', ct_site: 'Site / éditeur / revue', ct_year: 'Année', ct_url: 'Adresse web', ct_add: 'Ajouter à la bibliographie',
      ct_bib: 'Ma bibliographie', ct_copy: 'Copier', ct_copy_all: 'Tout copier', ct_copied: 'Copié', ct_empty: 'Ta bibliographie est vide. Cherche une source ci-dessus.', ct_hint: 'Données : Crossref (articles, DOI) et Open Library (livres, ISBN). Vérifie toujours la référence avant de la rendre.',
      ct_online: 'en ligne', ct_seen: 'Consulté le {d}', ct_avail: 'Disponible à l’adresse',
      un_length: 'Longueur', un_mass: 'Masse', un_temp: 'Température', un_volume: 'Volume', un_area: 'Surface', un_speed: 'Vitesse', un_time: 'Durée', un_data: 'Données', un_energy: 'Énergie', un_pressure: 'Pression', un_all: 'Toutes les unités',
    },
    en: {
      tl_exams: 'Exams', ex_intro: 'Enter your exam date and how much revision you want: the app places spaced sessions (D-21, D-14, D-7, D-3, D-1…) in your Day view, and the exam in the Calendar.',
      ex_name_ph: 'Subject or exam (e.g. Law midterm)', ex_date: 'Date', ex_hours: 'Revision hours', ex_deck: 'Flashcard deck', ex_plan: 'Plan my revision',
      ex_event: 'Exam: {name}', ex_block: 'Revision: {name}', ex_done: '{n} session(s) of {m} added to your Day view.', ex_none: 'No free time left in your days before the exam.', ex_sessions: '{d}/{n} sessions done', ex_deleted: 'Exam and sessions deleted',
      st_tools: 'Tools', tl_dict: 'Dictionary', tl_cite: 'Citations', tl_units: 'Converter',
      dc_ph: 'A word to define…', dc_go: 'Define', dc_none: 'No definition found.', dc_err: 'Dictionary unavailable right now.', dc_syn: 'Synonyms', dc_card: '+ Flashcard', dc_src: 'Source: {src}',
      ct_ph: 'DOI, ISBN, article title or web address…', ct_go: 'Search', ct_pick: 'Pick the right reference', ct_none: 'Nothing found. Fill the form by hand.', ct_manual: 'Manual entry',
      ct_author: 'Author(s): Last, First; Last, First', ct_title: 'Title', ct_site: 'Website / publisher / journal', ct_year: 'Year', ct_url: 'Web address', ct_add: 'Add to bibliography',
      ct_bib: 'My bibliography', ct_copy: 'Copy', ct_copy_all: 'Copy all', ct_copied: 'Copied', ct_empty: 'Your bibliography is empty. Search a source above.', ct_hint: 'Data: Crossref (articles, DOI) and Open Library (books, ISBN). Always check a reference before handing it in.',
      ct_online: 'online', ct_seen: 'Accessed {d}', ct_avail: 'Available at',
      un_length: 'Length', un_mass: 'Mass', un_temp: 'Temperature', un_volume: 'Volume', un_area: 'Area', un_speed: 'Speed', un_time: 'Time', un_data: 'Data', un_energy: 'Energy', un_pressure: 'Pressure', un_all: 'All units',
    },
  });

  ML.isPremium = () => !!(ML.auth && ML.auth.user && (ML.auth.user.premium || ML.auth.user.owner));
  ML.isOwner = () => !!(ML.auth && ML.auth.user && ML.auth.user.owner); // the app's author: owner-only shop items
  const ST = () => S.study;
  const icon = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    cards: '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    translate: '<path d="M4 5h9M8.5 3v2M6 5c.6 3 2.6 5.6 5.5 7M11 5c-.8 3.6-3.4 6.6-7 8"/><path d="M13 21l4-9 4 9M14.4 18h5.2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    tools: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  };
  ICONS.room = '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2.5 20c.5-3.5 2.8-5.5 5.5-5.5s5 2 5.5 5.5M11 15.5c1-.7 2.8-1 5-1 2.7 0 5 2 5.5 5.5"/>';
  const TOOLS = ['cards', 'search', 'translate', 'tools', 'room'];
  const multiline = s => esc(s).replace(/\n/g, '<br>');

  /* ---------- Rendering ---------- */
  function render() {
    const root = $('study'); if (!root) return;
    $('study-lock').style.display = ML.isPremium() ? 'none' : '';
    if (!ML.isPremium()) { root.innerHTML = lockedHtml(); return; }
    const tool = ST().tool;
    root.innerHTML = `<div class="st-tools" role="group">${TOOLS.map(k =>
      `<button type="button" data-tool="${k}" aria-pressed="${tool === k}">${icon(ICONS[k])}<span>${esc(t('st_' + k))}</span></button>`).join('')}</div>
      <div class="st-body" id="st-body"></div>`;
    renderTool();
  }
  function renderTool() {
    const el = $('st-body'); if (!el) return;
    const tool = ST().tool;
    if (tool === 'room') { if (ML.Rooms) ML.Rooms.bind(el); return; }
    el.innerHTML = tool === 'search' ? searchHtml() : tool === 'translate' ? translateHtml() : tool === 'tools' ? toolsHtml() : cardsHtml();
    if (tool === 'search' && !sres) { const i = $('sr-q'); if (i && innerWidth >= 900) i.focus(); }
  }
  function lockedHtml() {
    return `<div class="st-locked">
      <div class="st-lock-badge">${icon(ICONS.lock)}<span>${esc(t('st_locked_badge'))}</span></div>
      <h3>${esc(t('st_locked_h'))}</h3>
      <p class="hint">${esc(t('st_locked_p'))}</p>
      <ul class="st-feats">${TOOLS.map(k => `<li>${icon(ICONS[k])}<div><b>${esc(t('st_' + k))}</b><span>${esc(t('st_f_' + k))}</span></div></li>`).join('')}</ul>
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
    if (view.kind === 'quiz') return quizHtml();
    if (view.kind === 'deck' && ST().decks.some(d => d.id === view.id)) return deckHtml(view.id);
    view = { kind: 'decks' };
    const D = ST(), todayN = D.day === today() ? D.reviewed : 0;
    return `<div class="fc-head"><h3>${esc(t('fc_decks'))}</h3>${todayN ? `<span class="chip">${esc(t('fc_today', { n: todayN }))}</span>` : ''}</div>
      <form class="fc-newdeck" id="fc-newdeck" autocomplete="off"><input type="text" maxlength="60" placeholder="${esc(t('fc_new_deck_ph'))}" required><button type="submit" class="primary small">${esc(t('fc_create'))}</button></form>
      ${D.decks.length ? `<ul class="fc-decks">${D.decks.map(d => {
        const all = deckCards(d.id), due = queueFor(d.id).length;
        return `<li><button type="button" class="fc-deck-name" data-fc-open="${d.id}"><b>${esc(d.name)}</b><small>${esc(tn('fc_cards_n', all.length))}</small></button>
          ${due ? `<span class="chip due-chip">${esc(tn('fc_due', due))}</span>` : ''}
          <button type="button" class="small ${due ? 'primary' : ''}" data-fc-review="${d.id}" ${due ? '' : 'disabled'}>${esc(t('fc_review'))}</button>
          <button type="button" class="small ghost" data-qzstart="${d.id}" ${all.length >= 2 ? '' : 'disabled'}>${esc(t('qz_start'))}</button></li>`;
      }).join('')}</ul>` : `<p class="hint">${esc(t('fc_none'))}</p>`}`;
  }
  function deckHtml(id) {
    const d = ST().decks.find(x => x.id === id), cs = deckCards(id), due = queueFor(id).length;
    return `<div class="fc-head"><button type="button" class="ghost small" data-fc-back>${esc(t('fc_back'))}</button><h3>${esc(d.name)}</h3>
        <button type="button" class="small ${due ? 'primary' : ''}" data-fc-review="${id}" ${due ? '' : 'disabled'}>${esc(t('fc_review'))}${due ? ' · ' + due : ''}</button>
        <button type="button" class="small" data-qzstart="${id}" ${cs.length >= 2 ? '' : 'disabled'}>${esc(t('qz_start'))}</button></div>
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
  /* ---------- Quiz mode: multiple choice (other cards' answers as distractors) and typed answers ---------- */
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  function lev(a, b) { // edit distance, so a small typo still counts
    const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  const closeEnough = (given, want) => { const a = norm(given), b = norm(want); if (!a) return false; return a === b || lev(a, b) <= Math.max(1, Math.floor(b.length * 0.2)); };
  ML.answerMatches = closeEnough;
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  function startQuiz(id) {
    const cs = deckCards(id); if (cs.length < 2) return;
    // Weak and due cards first, then the rest, 10 questions at most
    const pool = shuffle(cs.slice()).sort((a, b) => ((b.lapses || 0) + (isDue(b) ? 1 : 0)) - ((a.lapses || 0) + (isDue(a) ? 1 : 0))).slice(0, 10);
    const qs = pool.map(c => {
      const others = shuffle(cs.filter(x => x.id !== c.id && norm(x.back) !== norm(c.back))).slice(0, 3).map(x => x.back);
      const mcq = others.length >= 2 && c.back.length <= 160 && Math.random() < 0.7;
      return { cardId: c.id, type: mcq ? 'mcq' : 'type', options: mcq ? shuffle([c.back, ...others]) : null };
    });
    view = { kind: 'quiz', id, qs, pos: 0, score: 0, answered: null, wrong: [] }; renderTool();
  }
  function quizHtml() {
    const V = view, q = V.qs[V.pos];
    if (!q) {
      return `<div class="fc-review fc-done"><h3>${esc(t('qz_done'))}</h3><p class="qz-score"><b>${V.score}</b> / ${V.qs.length}</p><p>${esc(t('qz_xp', { xp: V.xp || 0 }))}</p>
        ${V.wrong.length ? `<button type="button" class="small" data-qzfix>${esc(t('qz_fix', { n: V.wrong.length }))}</button>` : ''}
        <button type="button" class="primary small" data-fc-back>${esc(t('fc_back'))}</button></div>`;
    }
    const c = ST().cards.find(x => x.id === q.cardId), A = V.answered;
    return `<div class="fc-review">
      <div class="fc-top"><button type="button" class="ghost small" data-fc-back>${esc(t('fc_back'))}</button><span class="chip">${V.pos + 1}/${V.qs.length} · ${V.score} ✓</span></div>
      <div class="fc-card"><div class="fc-face">${multiline(c.front)}</div></div>
      ${q.type === 'mcq' ? `<div class="qz-opts">${q.options.map((o, i) => `<button type="button" data-qzopt="${i}" class="${A ? (o === c.back ? 'ok' : A.chosen === i ? 'ko' : '') : ''}" ${A ? 'disabled' : ''}>${multiline(o)}</button>`).join('')}</div>`
        : `<form class="sr-form" id="qz-type" autocomplete="off"><input type="text" id="qz-in" maxlength="300" placeholder="${esc(t('qz_type_ph'))}" ${A ? 'disabled' : ''} value="${A ? esc(A.given) : ''}"><button type="submit" class="primary small" ${A ? 'disabled' : ''}>${esc(t('qz_check'))}</button></form>`}
      ${A ? `<p class="qz-verdict ${A.ok ? 'ok' : 'ko'}">${esc(A.ok ? t('qz_right') : t('qz_wrong'))}${!A.ok || q.type === 'type' ? `<br><small>${esc(t('qz_answer'))} : ${multiline(c.back)}</small>` : ''}</p>
        <button type="button" class="primary" data-qznext>${esc(V.pos + 1 < V.qs.length ? t('qz_next') : t('qz_finish'))}</button>` : ''}
    </div>`;
  }
  function quizAnswer(ok, extra) {
    const V = view, q = V.qs[V.pos];
    V.answered = Object.assign({ ok }, extra);
    if (ok) V.score++; else V.wrong.push(q.cardId);
    if (ML.sfx) ML.sfx(ok ? 'sub' : 'abandon');
    renderTool();
    if (view.qs[view.pos].type === 'type') { const n = root.querySelector('[data-qznext]'); if (n) n.focus(); }
  }
  function quizNext() {
    const V = view; V.pos++; V.answered = null;
    if (V.pos >= V.qs.length) { V.xp = Math.min(20, V.score * 2); if (V.xp) ML.addXp(V.xp); if (ML.sfx) ML.sfx('quest'); }
    renderTool();
    const i = $('qz-in'); if (i) i.focus();
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
  // Used by the Notebook ("highlight → flashcard") and the translator
  ML.studyDecks = () => ST().decks.map(d => ({ id: d.id, name: d.name }));
  ML.studyAddCard = (deckIdOrName, front, back) => {
    const D = ST();
    let deck = D.decks.find(d => d.id === deckIdOrName || d.name === deckIdOrName);
    if (!deck) { deck = { id: uid(), name: String(deckIdOrName || t('fc_nb_deck')).slice(0, 60), created: Date.now() }; D.decks.push(deck); }
    addCard(deck.id, front, back); save();
    return deck;
  };

  /* ---------- Search (Wikipedia summaries) ---------- */
  let sq = '', sres = null, sloading = false;
  const wikiLang = () => (S.lang === 'en' ? 'en' : 'fr');
  async function wikiSummary(lang, title) {
    try { const r = await tfetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`); return r.ok ? await r.json() : null; } catch (e) { return null; }
  }
  async function search(q) {
    sq = q; sloading = true; renderTool();
    const lang = wikiLang();
    try {
      const r = await tfetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=7&format=json&origin=*`).then(x => x.json());
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
        const r = await tfetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(c)}&langpair=${from}|${to}`).then(x => x.json());
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

  /* ---------- Toolbox: dictionary, citations, unit converter ---------- */
  function toolsHtml() {
    const sub = ST().sub || 'dict';
    return `<div class="seg-toggle st-sub" role="group">${['exams', 'dict', 'cite', 'units'].map(k => `<button type="button" data-stsub="${k}" aria-pressed="${sub === k}">${esc(t('tl_' + k))}</button>`).join('')}</div>
      ${sub === 'cite' ? citeHtml() : sub === 'units' ? unitsHtml() : sub === 'exams' ? examsHtml() : dictHtml()}`;
  }

  // Exam planner: an exam date + hours of revision → spaced revision blocks in the Day planner and the exam in the calendar
  const OFFSETS = [21, 14, 10, 7, 5, 3, 2, 1];
  const daysTo = k => Math.round((ML.parseDay(k) - ML.parseDay(today())) / 864e5);
  function planExam(name, date, hours, deckId) {
    const left = daysTo(date); if (left < 1) return { n: 0 };
    const id = uid(), ex = { id, name, date, hours, deckId: deckId || null, created: Date.now(), blocks: [], eventId: uid() };
    S.events.push({ id: ex.eventId, title: t('ex_event', { name }), date, start: '', mins: 60, cat: 'deadline', repeat: 'none', remind: 1440, notes: '' });
    let days = OFFSETS.filter(o => o <= left);
    const maxSessions = Math.max(1, Math.round(hours * 60 / 30));
    if (days.length > maxSessions) days = days.slice(days.length - maxSessions); // keep the ones closest to the exam
    const per = Math.min(180, Math.max(30, Math.round(hours * 60 / days.length / 15) * 15));
    days.forEach(o => { const b = ML.planBlock ? ML.planBlock(addDays(date, -o), per, t('ex_block', { name }), { color: 8, exam: id }) : null; if (b) ex.blocks.push(b.id); });
    ST().exams = ST().exams || []; ST().exams.push(ex);
    save(); emit('events'); if (ML.renderAll) ML.renderAll();
    return { n: ex.blocks.length, per };
  }
  function removeExam(id) {
    const ex = (ST().exams || []).find(x => x.id === id); if (!ex) return;
    S.blocks = S.blocks.filter(b => b.exam !== id); S.events = S.events.filter(e => e.id !== ex.eventId);
    ST().exams = ST().exams.filter(x => x.id !== id); save(); emit('events'); if (ML.renderAll) ML.renderAll();
  }
  function examsHtml() {
    const list = (ST().exams || []).filter(x => daysTo(x.date) >= -1).sort((a, b) => a.date.localeCompare(b.date));
    return `<p class="hint">${esc(t('ex_intro'))}</p>
      <form class="fc-add" id="ex-form" autocomplete="off">
        <input name="name" maxlength="60" placeholder="${esc(t('ex_name_ph'))}" required>
        <div class="t-edit-row">
          <label><span>${esc(t('ex_date'))}</span><input type="date" name="date" min="${addDays(today(), 1)}" required></label>
          <label><span>${esc(t('ex_hours'))}</span><input type="number" name="hours" min="1" max="60" value="6" inputmode="numeric"></label>
          <label><span>${esc(t('ex_deck'))}</span><select name="deck"><option value="">—</option>${ST().decks.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></label>
        </div>
        <button type="submit" class="primary small">${esc(t('ex_plan'))}</button>
      </form>
      ${list.length ? `<ul class="ex-list">${list.map(x => {
        const left = daysTo(x.date), done = S.blocks.filter(b => b.exam === x.id && b.done).length, total = S.blocks.filter(b => b.exam === x.id).length;
        return `<li><div class="ex-count ${left <= 3 ? 'soon' : ''}"><b>${left > 0 ? 'J-' + left : left === 0 ? t('today') : '✓'}</b></div>
          <div class="ex-info"><b>${esc(x.name)}</b><small>${esc(ML.parseDay(x.date).toLocaleDateString(ML.locale(), { weekday: 'short', day: 'numeric', month: 'long' }))} · ${esc(t('ex_sessions', { d: done, n: total }))}</small>
          <i class="ex-bar"><em style="width:${total ? (done / total * 100).toFixed(0) : 0}%"></em></i></div>
          <div class="ex-acts">${x.deckId && ST().decks.some(d => d.id === x.deckId) ? `<button type="button" class="small" data-fc-review="${x.deckId}">${esc(t('fc_review'))}</button>` : ''}
          <button type="button" class="icon-btn" data-exdel="${x.id}" aria-label="${esc(t('delete'))}">✕</button></div></li>`;
      }).join('')}</ul>` : ''}`;
  }

  // fetch with a time limit, so a slow service never leaves a spinner forever
  const tfetch = (url, ms = 8000) => { const c = new AbortController(), tm = setTimeout(() => c.abort(), ms); return fetch(url, { signal: c.signal }).finally(() => clearTimeout(tm)); };
  // Dictionary: French from the French Wiktionary (wikitext parsed), English from the English Wiktionary
  let dq = '', dres = null, dbusy = false, dlang = null;
  const cleanWiki = s => s
    .replace(/\{\{(?:lien|l|w|lien web|nom w pc)\|([^|}]+)[^{}]*\}\}/g, '$1')
    .replace(/\{\{([^|{}]+)\|fr\}\}/g, '($1)')
    .replace(/\{\{[^{}]*\}\}/g, '').replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1').replace(/'''?/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  async function dictFr(word) {
    const r = await tfetch(`https://fr.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&redirects=1&origin=*`).then(x => x.json());
    if (!r.parse) return { senses: [] };
    const sec = ('\n' + r.parse.wikitext['*']).split(/\n==\s*\{\{langue\|/).find(s => s.startsWith('fr}}')) || '';
    const senses = []; let cur = null;
    sec.split('\n').forEach(line => {
      const h = /^===\s*\{\{S\|([^|}]+)\|fr/.exec(line);
      if (h) { cur = { pos: h[1], defs: [] }; senses.push(cur); return; }
      if (/^===/.test(line)) { cur = null; return; }
      if (!cur) return;
      if (/^#(?![*:#])/.test(line)) { const d = cleanWiki(line.replace(/^#\s*/, '')); if (d) cur.defs.push({ d, ex: '' }); }
      else if (/^#\*/.test(line) && cur.defs.length && !cur.defs[cur.defs.length - 1].ex) {
        const raw = line.replace(/^#\*\s*/, ''), m = /\{\{exemple\s*\|\s*([^|}]+)/.exec(raw); // {{exemple|the sentence|source…|lang=fr}}
        const ex = m ? cleanWiki(m[1]) : raw.includes('{{') ? '' : cleanWiki(raw);
        if (ex && !/^lang=/.test(ex)) cur.defs[cur.defs.length - 1].ex = ex.slice(0, 200);
      }
    });
    return { senses: senses.filter(s => s.defs.length).map(s => ({ pos: s.pos, defs: s.defs.slice(0, 6) })), src: 'Wiktionnaire', url: 'https://fr.wiktionary.org/wiki/' + encodeURIComponent(word) };
  }
  async function dictEn(word) { // English Wiktionary's definition API
    const r = await tfetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.replace(/ /g, '_'))}`);
    if (r.status === 404) return { senses: [] };
    const j = await r.json();
    return { src: 'Wiktionary', url: 'https://en.wiktionary.org/wiki/' + encodeURIComponent(word),
      senses: (j.en || []).map(m => ({ pos: m.partOfSpeech, defs: m.definitions.map(d => ({ d: textOf(d.definition).trim(), ex: d.examples && d.examples[0] ? textOf(d.examples[0]).trim().slice(0, 200) : '' })).filter(d => d.d).slice(0, 5) })).filter(s => s.defs.length) };
  }
  async function define(word) {
    dq = word; dbusy = true; renderTool();
    const lang = dlang || (S.lang === 'en' ? 'en' : 'fr');
    try { dres = Object.assign({ word, lang }, await (lang === 'en' ? dictEn(word) : dictFr(word))); }
    catch (e) { dres = { word, lang, error: true, senses: [] }; }
    dbusy = false; if (ST().tool === 'tools') renderTool();
  }
  function dictHtml() {
    const lang = dlang || (S.lang === 'en' ? 'en' : 'fr'), R = dres;
    return `<form class="sr-form" id="dc-form" autocomplete="off"><input type="search" id="dc-q" maxlength="60" placeholder="${esc(t('dc_ph'))}" value="${esc(dq)}" lang="${lang}"><button type="submit" class="primary small">${esc(t('dc_go'))}</button></form>
      <div class="chips">${['fr', 'en'].map(l => `<button type="button" class="chip-btn" data-dclang="${l}" aria-pressed="${l === lang}">${esc(t('lang_' + l))}</button>`).join('')}</div>
      ${dbusy ? '<div class="sr-loading"><i></i><i></i><i></i></div>' : ''}
      ${R && !dbusy ? (R.error ? `<p class="hint">${esc(t('dc_err'))}</p>` : !R.senses.length ? `<p class="hint">${esc(t('dc_none'))}</p>` : `<article class="dc-entry">
        <div class="dc-word"><h3>${esc(R.word)}</h3>${R.phon ? `<span class="mono">${esc(R.phon)}</span>` : ''}${'speechSynthesis' in window ? `<button type="button" class="ghost small" data-dcsay>🔊</button>` : ''}</div>
        ${R.senses.map((s, si) => `<div class="dc-sense"><span class="label">${esc(s.pos)}</span><ol>${s.defs.map((d, di) => `<li><span>${esc(d.d)}</span>${d.ex ? `<em>« ${esc(d.ex)} »</em>` : ''}
          <button type="button" class="link" data-dccard="${si}:${di}">${esc(t('dc_card'))}</button></li>`).join('')}</ol>
          ${s.syn && s.syn.length ? `<small class="hint">${esc(t('dc_syn'))} : ${s.syn.map(esc).join(', ')}</small>` : ''}</div>`).join('')}
        <small class="hint">${R.url ? `<a class="small-link" href="${esc(R.url)}" target="_blank" rel="noopener">${esc(t('dc_src', { src: R.src }))} ↗</a>` : esc(t('dc_src', { src: R.src }))}</small>
      </article>`) : ''}`;
  }

  // Citations: look a source up (Crossref for DOIs/articles, Open Library for ISBNs), then format it in a citation style
  let cq = '', cres = null, cbusy = false, cmanual = null;
  const STYLES = { apa: 'APA 7', mla: 'MLA 9', iso: 'ISO 690', chicago: 'Chicago' };
  const nameSplit = s => { const [family, given] = s.includes(',') ? s.split(',').map(x => x.trim()) : [s.trim().split(/\s+/).slice(-1)[0], s.trim().split(/\s+/).slice(0, -1).join(' ')]; return { family: family || '', given: given || '' }; };
  const fromCrossref = w => ({
    type: /book/.test(w.type) ? 'book' : 'article',
    authors: (w.author || []).map(a => ({ family: a.family || a.name || '', given: a.given || '' })),
    title: (w.title || [''])[0], container: (w['container-title'] || [''])[0], publisher: w.publisher || '',
    year: ((w.issued || w.published || {})['date-parts'] || [[null]])[0][0] || '', volume: w.volume || '', issue: w.issue || '', pages: w.page || '',
    doi: w.DOI || '', url: w.DOI ? 'https://doi.org/' + w.DOI : (w.URL || ''),
  });
  async function citeLookup(q) {
    cq = q; cbusy = true; cres = null; cmanual = null; renderTool();
    try {
      const doi = /10\.\d{4,9}\/[^\s"<>]+/.exec(q), isbn = q.replace(/[-\s]/g, '').match(/^(97[89])?\d{9}[\dXx]$/);
      if (doi) {
        const r = await tfetch('https://api.crossref.org/works/' + encodeURIComponent(doi[0])).then(x => x.json());
        cres = [fromCrossref(r.message)];
      } else if (isbn) {
        const key = 'ISBN:' + isbn[0], r = await tfetch(`https://openlibrary.org/api/books?bibkeys=${key}&format=json&jscmd=data`).then(x => x.json()), b = r[key];
        cres = b ? [{ type: 'book', authors: (b.authors || []).map(a => nameSplit(a.name)), title: b.title + (b.subtitle ? ' : ' + b.subtitle : ''), publisher: ((b.publishers || [])[0] || {}).name || '', year: (String(b.publish_date || '').match(/\d{4}/) || [''])[0], isbn: isbn[0], url: '' }] : [];
      } else if (/^https?:\/\//i.test(q)) {
        cmanual = { type: 'web', authors: [], title: '', container: (() => { try { return new URL(q).hostname.replace(/^www\./, ''); } catch (e) { return ''; } })(), year: String(new Date().getFullYear()), url: q, accessed: today() };
      } else {
        const r = await tfetch(`https://api.crossref.org/works?rows=5&query.bibliographic=${encodeURIComponent(q)}`).then(x => x.json());
        cres = ((r.message && r.message.items) || []).map(fromCrossref);
      }
    } catch (e) { cres = []; }
    if (cres && !cres.length && !cmanual) cmanual = { type: 'web', authors: [], title: q, container: '', year: '', url: '', accessed: today() };
    cbusy = false; if (ST().tool === 'tools') renderTool();
  }
  // Formatting: returns HTML (titles in <i>); plain text is derived from it for copying
  const ini = g => g.split(/[\s-]+/).filter(Boolean).map(x => x[0].toUpperCase() + '.').join(' ');
  function authorsFmt(A, style) {
    if (!A.length) return '';
    if (style === 'apa') { const n = A.map(a => a.family + (a.given ? ', ' + ini(a.given) : '')); return n.length === 1 ? n[0] : n.slice(0, -1).join(', ') + ', & ' + n[n.length - 1]; }
    if (style === 'iso') return A.slice(0, 3).map(a => a.family.toUpperCase() + (a.given ? ', ' + a.given : '')).join(', ') + (A.length > 3 ? ' et al.' : '');
    const first = A[0].family + (A[0].given ? ', ' + A[0].given : '');
    if (A.length === 1) return first;
    if (style === 'mla' && A.length > 2) return first + ', et al.';
    const rest = A.slice(1).map(a => (a.given ? a.given + ' ' : '') + a.family);
    return first + (rest.length > 1 ? ', ' + rest.slice(0, -1).join(', ') + ',' : '') + ' and ' + rest[rest.length - 1];
  }
  function formatRef(r, style) {
    const au = authorsFmt(r.authors || [], style), y = r.year || 'n.d.', T = esc(r.title || ''), C = esc(r.container || ''), url = r.doi ? 'https://doi.org/' + r.doi : r.url || '';
    const end = s => (s && !/[.?!]$/.test(s) ? s + '.' : s);
    const fr = S.lang !== 'en';
    if (style === 'apa') {
      if (r.type === 'article') return `${esc(end(au))} (${y}). ${end(T)} <i>${C}</i>${r.volume ? `, <i>${esc(r.volume)}</i>` : ''}${r.issue ? `(${esc(r.issue)})` : ''}${r.pages ? `, ${esc(r.pages)}` : ''}.${url ? ' ' + esc(url) : ''}`;
      if (r.type === 'book') return `${esc(end(au))} (${y}). <i>${end(T)}</i> ${esc(end(r.publisher || ''))}`;
      return `${au ? esc(end(au)) + ' ' : ''}(${y}). <i>${T}</i>. ${C ? end(C) + ' ' : ''}${esc(url)}`;
    }
    if (style === 'mla') {
      if (r.type === 'article') return `${au ? esc(end(au)) + ' ' : ''}“${end(T)}” <i>${C}</i>${r.volume ? `, vol. ${esc(r.volume)}` : ''}${r.issue ? `, no. ${esc(r.issue)}` : ''}, ${y}${r.pages ? `, pp. ${esc(r.pages)}` : ''}.${url ? ' ' + esc(url.replace(/^https?:\/\//, '')) + '.' : ''}`;
      if (r.type === 'book') return `${au ? esc(end(au)) + ' ' : ''}<i>${end(T)}</i> ${esc(r.publisher || '')}, ${y}.`;
      return `${au ? esc(end(au)) + ' ' : ''}“${end(T)}” <i>${C}</i>, ${y}, ${esc(url.replace(/^https?:\/\//, ''))}.`;
    }
    if (style === 'iso') {
      const seen = r.accessed ? ` [${fr ? 'Consulté le' : 'Accessed'} ${esc(new Date(r.accessed).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'long', year: 'numeric' }))}]` : '';
      if (r.type === 'article') return `${au ? esc(end(au)) + ' ' : ''}${end(T)} <i>${C}</i>. ${y}${r.volume ? `, vol. ${esc(r.volume)}` : ''}${r.issue ? `, n<sup>o</sup> ${esc(r.issue)}` : ''}${r.pages ? `, p. ${esc(r.pages)}` : ''}.${r.doi ? ' DOI ' + esc(r.doi) + '.' : ''}`;
      if (r.type === 'book') return `${au ? esc(end(au)) + ' ' : ''}<i>${end(T)}</i> ${esc(r.publisher || '')}, ${y}.${r.isbn ? ' ISBN ' + esc(r.isbn) + '.' : ''}`;
      return `${au ? esc(end(au)) + ' ' : ''}<i>${T}</i> [${fr ? 'en ligne' : 'online'}]. ${C ? end(C) + ' ' : ''}${y}.${seen}. ${fr ? 'Disponible à l’adresse' : 'Available at'} : ${esc(url)}`;
    }
    // Chicago author-date
    if (r.type === 'article') return `${au ? esc(end(au)) + ' ' : ''}${y}. “${end(T)}” <i>${C}</i>${r.volume ? ' ' + esc(r.volume) : ''}${r.issue ? ` (${esc(r.issue)})` : ''}${r.pages ? `: ${esc(r.pages)}` : ''}.${url ? ' ' + esc(url) + '.' : ''}`;
    if (r.type === 'book') return `${au ? esc(end(au)) + ' ' : ''}${y}. <i>${end(T)}</i> ${esc(end(r.publisher || ''))}`;
    return `${au ? esc(end(au)) + ' ' : ''}${y}. “${end(T)}” ${C ? end(C) + ' ' : ''}${esc(url)}.`;
  }
  const sortKey = r => ((r.authors && r.authors[0] && r.authors[0].family) || r.title || '').toLowerCase();
  function citeHtml() {
    const style = ST().citeStyle || 'apa', bib = ST().bib.slice().sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    const M = cmanual;
    return `<form class="sr-form" id="ct-form" autocomplete="off"><input type="search" id="ct-q" maxlength="300" placeholder="${esc(t('ct_ph'))}" value="${esc(cq)}"><button type="submit" class="primary small">${esc(t('ct_go'))}</button></form>
      <div class="chips">${Object.entries(STYLES).map(([k, n]) => `<button type="button" class="chip-btn" data-ctstyle="${k}" aria-pressed="${k === style}">${n}</button>`).join('')}
        <button type="button" class="chip-btn ghosty" data-ctmanual>${esc(t('ct_manual'))}</button></div>
      ${cbusy ? '<div class="sr-loading"><i></i><i></i><i></i></div>' : ''}
      ${cres && cres.length && !cbusy ? `<p class="label">${esc(t('ct_pick'))}</p><ul class="sr-hits">${cres.map((r, i) => `<li><button type="button" data-ctadd="${i}"><span class="ct-ref">${formatRef(r, style)}</span></button></li>`).join('')}</ul>` : ''}
      ${M ? `<form class="fc-add" id="ct-manual" autocomplete="off">
        ${cres && !cres.length ? `<p class="hint">${esc(t('ct_none'))}</p>` : ''}
        <input name="authors" placeholder="${esc(t('ct_author'))}" value="${esc((M.authors || []).map(a => a.family + (a.given ? ', ' + a.given : '')).join(' ; '))}">
        <input name="title" placeholder="${esc(t('ct_title'))}" value="${esc(M.title || '')}" required>
        <div class="t-edit-row"><input name="container" placeholder="${esc(t('ct_site'))}" value="${esc(M.container || '')}"><input name="year" placeholder="${esc(t('ct_year'))}" value="${esc(M.year || '')}" inputmode="numeric" maxlength="4"></div>
        <input name="url" type="url" placeholder="${esc(t('ct_url'))}" value="${esc(M.url || '')}">
        <button type="submit" class="primary small">${esc(t('ct_add'))}</button></form>` : ''}
      <div class="fc-head"><h3>${esc(t('ct_bib'))}</h3>${bib.length ? `<button type="button" class="small" data-ctcopyall>${esc(t('ct_copy_all'))}</button>` : ''}</div>
      ${bib.length ? `<ol class="ct-bib">${bib.map(r => `<li><span class="ct-ref">${formatRef(r, style)}</span><span class="ct-acts"><button type="button" class="link" data-ctcopy="${r.id}">${esc(t('ct_copy'))}</button><button type="button" class="link danger" data-ctdel="${r.id}">✕</button></span></li>`).join('')}</ol>` : `<p class="hint">${esc(t('ct_empty'))}</p>`}
      <p class="hint">${esc(t('ct_hint'))}</p>`;
  }
  async function copyRich(html) {
    const text = textOf(html);
    try {
      if (window.ClipboardItem && navigator.clipboard.write) await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
      else await navigator.clipboard.writeText(text);
      toast(t('ct_copied'));
    } catch (e) { try { await navigator.clipboard.writeText(text); toast(t('ct_copied')); } catch (e2) {} }
  }

  // Unit converter (factors to a base unit; temperature is converted by formula)
  const UNITS = {
    length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852 },
    mass: { mg: 1e-6, g: 0.001, kg: 1, t: 1000, oz: 0.028349523125, lb: 0.45359237, st: 6.35029318 },
    temp: { '°C': 1, '°F': 1, K: 1 },
    volume: { mL: 0.001, cL: 0.01, L: 1, 'm³': 1000, tsp: 0.00492892, tbsp: 0.0147868, cup: 0.2365882365, 'fl oz': 0.0295735, pt: 0.473176, gal: 3.785411784 },
    area: { 'cm²': 1e-4, 'm²': 1, ha: 1e4, 'km²': 1e6, 'ft²': 0.09290304, acre: 4046.8564224 },
    speed: { 'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704, kn: 0.514444 },
    time: { s: 1, min: 60, h: 3600, d: 86400, wk: 604800, yr: 31557600 },
    data: { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824 },
    energy: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3.6e6, eV: 1.602176634e-19 },
    pressure: { Pa: 1, kPa: 1000, bar: 1e5, atm: 101325, psi: 6894.757, mmHg: 133.322 },
  };
  let uv = '1', uFrom = null, uTo = null;
  function convert(cat, v, from, to) {
    if (cat === 'temp') { const c = from === '°C' ? v : from === '°F' ? (v - 32) * 5 / 9 : v - 273.15; return to === '°C' ? c : to === '°F' ? c * 9 / 5 + 32 : c + 273.15; }
    return v * UNITS[cat][from] / UNITS[cat][to];
  }
  const fmtNum = n => (!isFinite(n) ? '—' : Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-4 && n !== 0) ? n.toExponential(4) : (+n.toPrecision(8)).toLocaleString(ML.locale(), { maximumFractionDigits: 6 }));
  function unitsHtml() {
    const cat = ST().unitCat || 'length', us = Object.keys(UNITS[cat]);
    if (!us.includes(uFrom)) uFrom = us[cat === 'temp' ? 0 : Math.min(2, us.length - 1)];
    if (!us.includes(uTo) || uTo === uFrom) uTo = us.find(u => u !== uFrom);
    const v = parseFloat(String(uv).replace(',', '.')), res = isNaN(v) ? NaN : convert(cat, v, uFrom, uTo);
    const sel = (id, cur) => `<select id="${id}">${us.map(u => `<option ${u === cur ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>`;
    return `<div class="chips">${Object.keys(UNITS).map(c => `<button type="button" class="chip-btn" data-ucat="${c}" aria-pressed="${c === cat}">${esc(t('un_' + c))}</button>`).join('')}</div>
      <div class="un-row"><input type="text" id="un-v" inputmode="decimal" value="${esc(uv)}">${sel('un-from', uFrom)}<button type="button" class="ghost icon-only" id="un-swap" aria-label="${esc(t('tr_swap'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h12l-3-3M17 17H5l3 3"/></svg></button>${sel('un-to', uTo)}</div>
      <div class="un-res" id="un-res"><b>${fmtNum(res)}</b> ${esc(uTo)}</div>
      <p class="label">${esc(t('un_all'))}</p>
      <ul class="un-all" id="un-all">${us.filter(u => u !== uFrom).map(u => `<li><span>${esc(u)}</span><b>${isNaN(v) ? '—' : fmtNum(convert(cat, v, uFrom, u))}</b></li>`).join('')}</ul>`;
  }
  function updateUnits() { // live update without re-rendering the input (keeps the cursor)
    const cat = ST().unitCat || 'length', us = Object.keys(UNITS[cat]), v = parseFloat(String(uv).replace(',', '.'));
    const r = $('un-res'); if (r) r.innerHTML = `<b>${isNaN(v) ? '—' : fmtNum(convert(cat, v, uFrom, uTo))}</b> ${esc(uTo)}`;
    const a = $('un-all'); if (a) a.innerHTML = us.filter(u => u !== uFrom).map(u => `<li><span>${esc(u)}</span><b>${isNaN(v) ? '—' : fmtNum(convert(cat, v, uFrom, u))}</b></li>`).join('');
  }

  /* ---------- Events ---------- */
  const root = $('study');
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || ST().tool !== 'tools') return;
    if (b.dataset.stsub) { ST().sub = b.dataset.stsub; save(); renderTool(); return; }
    if (b.dataset.exdel) { removeExam(b.dataset.exdel); toast(t('ex_deleted')); renderTool(); return; }
    if (b.dataset.fcReview) { e.stopImmediatePropagation(); ST().tool = 'cards'; save(); render(); startReview(b.dataset.fcReview); return; }
    if (b.dataset.dclang) { dlang = b.dataset.dclang; if (dq) define(dq); else renderTool(); return; }
    if (b.hasAttribute('data-dcsay') && dres) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(dres.word); u.lang = dres.lang; speechSynthesis.speak(u); } catch (err) {} return; }
    if (b.dataset.dccard && dres) { const [si, di] = b.dataset.dccard.split(':').map(Number), d = dres.senses[si].defs[di]; const deck = ML.studyAddCard(t('tl_dict'), dres.word + ' (' + dres.senses[si].pos + ')', d.d); toast(t('tr_card_ok', { deck: deck.name })); return; }
    if (b.dataset.ctstyle) { ST().citeStyle = b.dataset.ctstyle; save(); renderTool(); return; }
    if (b.hasAttribute('data-ctmanual')) { cmanual = { type: 'web', authors: [], title: '', container: '', year: '', url: '', accessed: today() }; renderTool(); return; }
    if (b.dataset.ctadd && cres) { const r = Object.assign({ id: uid(), added: Date.now() }, cres[+b.dataset.ctadd]); ST().bib.push(r); cres = null; cq = ''; save(); renderTool(); return; }
    if (b.dataset.ctcopy) { const r = ST().bib.find(x => x.id === b.dataset.ctcopy); if (r) copyRich(formatRef(r, ST().citeStyle)); return; }
    if (b.hasAttribute('data-ctcopyall')) { const st = ST().citeStyle; copyRich(ST().bib.slice().sort((a, c) => sortKey(a).localeCompare(sortKey(c))).map(r => `<p>${formatRef(r, st)}</p>`).join('')); return; }
    if (b.dataset.ctdel) { ST().bib = ST().bib.filter(x => x.id !== b.dataset.ctdel); save(); renderTool(); return; }
    if (b.dataset.ucat) { ST().unitCat = b.dataset.ucat; uFrom = uTo = null; save(); renderTool(); return; }
    if (b.id === 'un-swap') { [uFrom, uTo] = [uTo, uFrom]; renderTool(); return; }
  });
  root.addEventListener('submit', e => {
    const f = e.target;
    if (f.id === 'ex-form') {
      e.preventDefault(); e.stopImmediatePropagation();
      const name = f.name.value.trim(), date = f.date.value, hours = Math.max(1, Math.min(60, +f.hours.value || 6));
      if (!name || !date) return;
      const r = planExam(name, date, hours, f.deck.value);
      toast(r.n ? t('ex_done', { n: r.n, m: ML.fmtMins(r.per) }) : t('ex_none'), { ms: 5000 }); renderTool(); return;
    }
    if (f.id === 'dc-form') { e.preventDefault(); e.stopImmediatePropagation(); const q = $('dc-q').value.trim(); if (q) define(q); }
    else if (f.id === 'ct-form') { e.preventDefault(); e.stopImmediatePropagation(); const q = $('ct-q').value.trim(); if (q) citeLookup(q); }
    else if (f.id === 'ct-manual') {
      e.preventDefault(); e.stopImmediatePropagation();
      const authors = f.authors.value.split(';').map(s => s.trim()).filter(Boolean).map(nameSplit);
      ST().bib.push(Object.assign({}, cmanual, { id: uid(), added: Date.now(), authors, title: f.title.value.trim(), container: f.container.value.trim(), year: f.year.value.trim(), url: f.url.value.trim() }));
      cmanual = null; cres = null; cq = ''; save(); renderTool();
    }
  }, true);
  root.addEventListener('input', e => { if (e.target.id === 'un-v') { uv = e.target.value; updateUnits(); } });
  root.addEventListener('change', e => { if (e.target.id === 'un-from' || e.target.id === 'un-to') { if (e.target.id === 'un-from') uFrom = e.target.value; else uTo = e.target.value; renderTool(); } });

  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) { ST().tool = b.dataset.tool; save(); render(); return; }
    if (b.dataset.fcOpen) { view = { kind: 'deck', id: b.dataset.fcOpen }; renderTool(); return; }
    if (b.dataset.fcReview) { startReview(b.dataset.fcReview); return; }
    if (b.dataset.qzstart) { startQuiz(b.dataset.qzstart); return; }
    if (b.dataset.qzopt != null && view.kind === 'quiz' && !view.answered) { const q = view.qs[view.pos], c = ST().cards.find(x => x.id === q.cardId), i = +b.dataset.qzopt; quizAnswer(q.options[i] === c.back, { chosen: i }); return; }
    if (b.hasAttribute('data-qznext') && view.kind === 'quiz') { quizNext(); return; }
    if (b.hasAttribute('data-qzfix') && view.kind === 'quiz') { view.wrong.forEach(id => { const c = ST().cards.find(x => x.id === id); if (c) { c.due = today(); c.ivl = 0; } }); save(); startReview(view.id); return; }
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
    if (f.id === 'qz-type' && view.kind === 'quiz' && !view.answered) { const q = view.qs[view.pos], c = ST().cards.find(x => x.id === q.cardId), given = $('qz-in').value; if (!given.trim()) return; quizAnswer(closeEnough(given, c.back), { given }); return; }
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
