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
      st_f_tools: 'Boîte à outils : dictionnaire, générateur de bibliographie (APA, MLA, ISO 690…), convertisseur d’unités, calculatrice scientifique, formules mathématiques dans le Carnet.',
      st_locked_how: 'Déjà Premium ? Connecte-toi avec ton compte, la section se débloque toute seule.',
      fc_decks: 'Mes paquets', fc_new_deck_ph: 'Nom du paquet (ex. Anglais, Histoire…)', fc_create: 'Créer', fc_due: '{n} à revoir', fc_due_one: '{n} à revoir', fc_cards_n: '{n} cartes', fc_cards_n_one: '{n} carte',
      fc_new_per: 'Nouvelles cartes par session', fc_all: 'Toutes',
      fc_review: 'Réviser', fc_open: 'Ouvrir', fc_none: 'Aucun paquet. Crée-en un pour commencer.', fc_back: '← Paquets', fc_front: 'Recto (question)', fc_backside: 'Verso (réponse)',
      fc_add: 'Ajouter la carte', fc_added: 'Carte ajoutée', fc_bulk_done: '{n} carte(s) importée(s)',
      fi_btn: 'Importer', fi_h: 'Importer des cartes', fi_file: 'Choisir un fichier', fi_drop: 'Fichier .txt, .csv, .tsv, .json ou .md (export Anki ou Quizlet accepté), ou colle le texte ci-dessous.',
      fi_ph: 'question ; réponse\nquestion ; réponse', fi_new: 'Nouveau paquet', fi_into: 'Ajouter à', fi_name: 'Nom du paquet', fi_go: 'Importer {n} carte(s)', fi_none: 'Aucune carte reconnue. Mets une question et sa réponse sur une ligne (question ; réponse), ou sur deux lignes suivies d’une ligne vide.', fi_long: 'Fichier long : il n’est pas affiché ici, mais il sera importé en entier.',
      fi_found: '{n} carte(s) trouvée(s)', fi_skip: '{n} ligne(s) ignorée(s)', fi_dup: '{n} déjà dans le paquet', fi_more: 'et {n} de plus', fi_apkg: 'Les fichiers .apkg ne sont pas lus. Dans Anki : Fichier, Exporter, « Notes en texte brut », puis importe ce fichier.', fi_big: 'Fichier trop lourd (50 Mo maximum).', fi_full: 'Trop de cartes pour la place disponible sur cet appareil. Importe un paquet plus petit.', fi_err: 'Impossible de lire ce fichier. Il faut un fichier texte (.txt, .csv, .json…).',
      fi_claude: 'Créer un paquet avec Claude', fi_claude_p: 'Copie ce message dans Claude, remplace le sujet, puis colle sa réponse ici.', fi_copy: 'Copier le message', fi_copied: 'Message copié',
      fi_prompt: 'Crée un paquet de flashcards sur : [SUJET]\n\nRéponds uniquement avec ce JSON, sans commentaire :\n{"deck":"Nom du paquet","cards":[{"front":"question","back":"réponse"}]}\n\nUne seule idée par carte, questions précises, réponses courtes.',
      fc_find: 'Chercher une carte…', fc_show_more: 'Afficher {n} de plus', fc_undo: 'Annuler la note', fc_where: 'Réviser dans', fc_in_panel: 'la section de droite', fc_in_full: 'le plein écran', fc_to_full: 'Plein écran', fc_to_panel: 'Section de droite', fc_ready: 'Minuteur', fc_running: 'Focus en cours', fc_paused: 'En pause',
      st_library: 'Bibliothèque', st_f_library: 'Bibliothèque : range tes PDF, photos et fiches, et travaille dessus sans quitter l’app.', fc_empty: 'Pas encore de cartes dans ce paquet.', fc_del_deck: 'Supprimer le paquet', fc_deck_deleted: 'Paquet supprimé',
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
      st_f_tools: 'Toolbox: dictionary, bibliography generator (APA, MLA, ISO 690…), unit converter, scientific calculator, math formulas in the Notebook.',
      st_locked_how: 'Already Premium? Sign in with your account and the section unlocks by itself.',
      fc_decks: 'My decks', fc_new_deck_ph: 'Deck name (e.g. Spanish, History…)', fc_create: 'Create', fc_due: '{n} due', fc_due_one: '{n} due', fc_cards_n: '{n} cards', fc_cards_n_one: '{n} card',
      fc_new_per: 'New cards per session', fc_all: 'All',
      fc_review: 'Review', fc_open: 'Open', fc_none: 'No decks yet. Create one to start.', fc_back: '← Decks', fc_front: 'Front (question)', fc_backside: 'Back (answer)',
      fc_add: 'Add card', fc_added: 'Card added', fc_bulk_done: '{n} card(s) imported',
      fi_btn: 'Import', fi_h: 'Import cards', fi_file: 'Choose a file', fi_drop: 'A .txt, .csv, .tsv, .json or .md file (Anki and Quizlet exports work), or paste the text below.',
      fi_ph: 'question ; answer\nquestion ; answer', fi_new: 'New deck', fi_into: 'Add to', fi_name: 'Deck name', fi_go: 'Import {n} card(s)', fi_none: 'No cards found. Put a question and its answer on one line (question ; answer), or on two lines followed by an empty line.', fi_long: "Long file: it isn't shown here, but all of it will be imported.",
      fi_found: '{n} card(s) found', fi_skip: '{n} line(s) skipped', fi_dup: '{n} already in the deck', fi_more: 'and {n} more', fi_apkg: "Can't read .apkg files. In Anki: File, Export, \"Notes in Plain Text\", then import that file.", fi_big: 'File too large (50 MB at most).', fi_full: 'Too many cards for the space left on this device. Import a smaller deck.', fi_err: "Can't read this file. It needs to be a text file (.txt, .csv, .json…).",
      fi_claude: 'Make a deck with Claude', fi_claude_p: 'Copy this message into Claude, replace the topic, then paste the reply here.', fi_copy: 'Copy the message', fi_copied: 'Message copied',
      fi_prompt: 'Make a flashcard deck about: [TOPIC]\n\nReply only with this JSON, no comments:\n{"deck":"Deck name","cards":[{"front":"question","back":"answer"}]}\n\nOne idea per card, precise questions, short answers.',
      fc_find: 'Find a card…', fc_show_more: 'Show {n} more', fc_undo: 'Undo rating', fc_where: 'Review in', fc_in_panel: 'the right section', fc_in_full: 'full screen', fc_to_full: 'Full screen', fc_to_panel: 'Right section', fc_ready: 'Timer', fc_running: 'Focusing', fc_paused: 'Paused',
      st_library: 'Library', st_f_library: 'Library: keep your PDFs, photos and study sheets in order and work on them without leaving the app.', fc_empty: 'No cards in this deck yet.', fc_del_deck: 'Delete deck', fc_deck_deleted: 'Deck deleted',
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
      tl_calc: 'Calculatrice', ca_ph: 'Ex. 2(3+4)^2, sqrt(2), sin(30)…', ca_err: 'Expression invalide', ca_hist: 'Historique', ca_clear: 'Effacer l’historique',
      ca_hint: 'Entrée = calculer · ↑ reprend le calcul précédent · la virgule marche comme le point · ans = dernier résultat.',
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
      tl_calc: 'Calculator', ca_ph: 'E.g. 2(3+4)^2, sqrt(2), sin(30)…', ca_err: 'Invalid expression', ca_hist: 'History', ca_clear: 'Clear history',
      ca_hint: 'Enter = calculate · ↑ brings back the previous calculation · a comma works as a decimal point · ans = last result.',
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
  ICONS.library = '<path d="M5 3.5h4v17H5zM10.5 3.5h4v17h-4z"/><path d="M16.2 4.6l3.8-1 3 16-3.8 1z" transform="translate(-1.2 .3)"/>';
  const TOOLS = ['cards', 'search', 'translate', 'tools', 'room'];
  const FEATS = ['cards', 'library', 'search', 'translate', 'tools', 'room']; // Library has its own tab since 3.55, same Premium page
  const multiline = s => esc(s).replace(/\n/g, '<br>');

  /* ---------- Rendering ---------- */
  function render() {
    const root = $('study'); if (!root) return;
    $('study-lock').style.display = ML.isPremium() ? 'none' : '';
    if (!ML.isPremium()) { root.innerHTML = lockedHtml(); return; }
    if (!TOOLS.includes(ST().tool)) ST().tool = 'cards';
    const tool = ST().tool;
    root.innerHTML = `<div class="st-tools" role="group">${TOOLS.map(k =>
      `<button type="button" data-tool="${k}" aria-pressed="${tool === k}">${icon(ICONS[k])}<span>${esc(t('st_' + k))}</span></button>`).join('')}</div>
      <div class="st-body" id="st-body"></div>`;
    renderTool();
  }
  function renderTool() {
    const mode = stageMode(), changed = syncStage(mode);
    if (mode) {
      stage.innerHTML = stageHtml(mode);
      const focusEl = $('qz-in') || (view.kind === 'quiz' ? stage.querySelector('[data-qznext]') : $('fc-card')) || stage.querySelector('[data-fc-back]');
      if (focusEl && fineMouse()) focusEl.focus({ preventScroll: true });
      if (!changed) return; // the page behind only changes when the panel opens
    }
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
      <ul class="st-feats">${FEATS.map(k => `<li>${icon(ICONS[k])}<div><b>${esc(t('st_' + k))}</b><span>${esc(t('st_f_' + k))}</span></div></li>`).join('')}</ul>
      ${ML.auth && ML.auth.enabled && !ML.auth.user ? `<p class="hint">${esc(t('st_locked_how'))}</p>` : ''}
    </div>`;
  }

  /* ---------- Flashcards (spaced repetition, Anki-style) ---------- */
  let view = { kind: 'decks' }; // { kind: 'decks' } | { kind: 'deck', id } | { kind: 'review', id, queue, shown, done, editing }
  const deckCards = id => ST().cards.filter(c => c.deck === id);
  const isDue = c => !c.due || c.due <= today();
  const NEW_PER_SESSION = 20, NEW_PER_CHOICES = [10, 20, 30, 50, 100, 0]; // 0 = all, kept per deck in d.newPer
  const newPerOf = id => { const d = ST().decks.find(x => x.id === id), n = d && d.newPer; return n === 0 || n > 0 ? n : NEW_PER_SESSION; };
  function queueFor(id) {
    const cs = deckCards(id).filter(isDue), lim = newPerOf(id);
    const fresh = cs.filter(c => !c.reps).slice(0, lim || Infinity), old = cs.filter(c => c.reps);
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
    const sess = inSession();
    if (sess && !stageMode()) return view.kind === 'review' ? reviewHtml() : quizHtml();
    if (view.kind === 'import') return importHtml();
    if ((view.kind === 'deck' || sess) && ST().decks.some(d => d.id === view.id)) return deckHtml(view.id);
    if (!sess) view = { kind: 'decks' };
    const D = ST(), todayN = D.day === today() ? D.reviewed : 0;
    return `<div class="fc-head"><h3>${esc(t('fc_decks'))}</h3>${todayN ? `<span class="chip">${esc(t('fc_today', { n: todayN }))}</span>` : ''}<button type="button" class="small" data-fi-open>${esc(t('fi_btn'))}</button></div>
      <div class="fc-viewpick"><span>${esc(t('fc_where'))}</span><div class="seg-toggle">${['panel', 'full'].map(m => `<button type="button" data-fc-where="${m}" aria-pressed="${reviewMode() === m}">${esc(t(m === 'full' ? 'fc_in_full' : 'fc_in_panel'))}</button>`).join('')}</div></div>
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
        <button type="button" class="small" data-qzstart="${id}" ${cs.length >= 2 ? '' : 'disabled'}>${esc(t('qz_start'))}</button>
        <button type="button" class="small" data-fi-open="${id}">${esc(t('fi_btn'))}</button></div>
      ${cs.some(c => !c.reps) ? `<label class="fc-newper"><span>${esc(t('fc_new_per'))}</span><select id="fc-newper">${NEW_PER_CHOICES.map(n => `<option value="${n}" ${n === newPerOf(id) ? 'selected' : ''}>${n ? n : esc(t('fc_all'))}</option>`).join('')}</select></label>` : ''}
      <form class="fc-add" id="fc-add" autocomplete="off">
        <textarea name="front" rows="2" maxlength="${FRONT_MAX}" placeholder="${esc(t('fc_front'))}" required></textarea>
        <textarea name="back" rows="2" maxlength="${BACK_MAX}" placeholder="${esc(t('fc_backside'))}" required></textarea>
        <button type="submit" class="primary small">${esc(t('fc_add'))}</button>
      </form>
      ${cs.length > 12 ? `<input type="search" id="fc-find" maxlength="80" placeholder="${esc(t('fc_find'))}" value="${esc(view.find || '')}" autocomplete="off">` : ''}
      <div id="fc-list-box">${cardListHtml(id)}</div>
      <button type="button" class="small ghost danger" id="fc-del-deck">${esc(t('fc_del_deck'))}</button>`;
  }
  // A long deck shows in pages, so an import of thousands of cards stays fast
  const LIST_STEP = 60;
  function cardListHtml(id) {
    const q = norm(view.find || ''), all = deckCards(id).reverse().filter(c => !q || norm(c.front + ' ' + c.back).includes(q)), lim = view.limit || LIST_STEP, rest = all.length - lim;
    if (!all.length) return `<p class="hint">${esc(t('fc_empty'))}</p>`;
    return `<ul class="fc-list">${all.slice(0, lim).map(c => view.editing === c.id
      ? `<li class="editing"><form class="fc-edit" data-fc-edit="${c.id}"><textarea name="front" rows="2" maxlength="${FRONT_MAX}" required>${esc(c.front)}</textarea><textarea name="back" rows="2" maxlength="${BACK_MAX}" required>${esc(c.back)}</textarea>
          <div class="fc-row"><button type="button" class="small ghost" data-fc-cancel>${esc(t('cancel'))}</button><button type="submit" class="small primary">${esc(t('fc_save'))}</button></div></form></li>`
      : `<li><div class="fc-q">${multiline(c.front)}</div><div class="fc-a">${multiline(c.back)}</div>
          <div class="fc-meta"><small>${c.reps ? esc(c.due <= today() ? t('fc_due', { n: '' }).trim() : c.due) : esc(t('fc_new'))}</small>
          <button type="button" class="link" data-fc-edit-open="${c.id}">${esc(t('fc_edit'))}</button>
          <button type="button" class="link danger" data-fc-del="${c.id}">${esc(t('fc_delete'))}</button></div></li>`).join('')}</ul>
      ${rest > 0 ? `<button type="button" class="small ghost fc-more" data-fc-more>${esc(t('fc_show_more', { n: Math.min(rest, LIST_STEP) }))}</button>` : ''}`;
  }
  /* ---------- Where a review happens: a half-screen panel on phones and in the side panel; on a computer the right section or full screen, by choice ---------- */
  const stage = document.createElement('div');
  stage.id = 'fc-stage'; stage.hidden = true; stage.setAttribute('role', 'dialog'); stage.setAttribute('aria-modal', 'true');
  document.body.appendChild(stage);
  const htmlEl = document.documentElement, narrow = () => htmlEl.classList.contains('mnav-on') || innerWidth < 900;
  const inSession = () => view.kind === 'review' || view.kind === 'quiz';
  const reviewMode = () => (ST().reviewMode === 'full' ? 'full' : 'panel');
  // view.over: started from the document reader, which covers the right section
  const stageMode = () => (!inSession() ? null : narrow() ? 'sheet' : view.over || reviewMode() === 'full' ? 'full' : null);
  let stageOn = null, stageRelease = null, stageFrom = null;
  function syncStage(mode) {
    if (mode === stageOn) return false;
    if (!stageOn) { stageFrom = document.activeElement; stageRelease = ML.backClose(() => { stageRelease = null; leaveSession(); }); }
    stageOn = mode; stage.hidden = !mode; stage.className = 'fc-stage fc-m-' + (mode || 'off');
    htmlEl.classList.toggle('fc-stage-on', !!mode); htmlEl.classList.toggle('fc-full', mode === 'full');
    if (!mode) { if (stageRelease) stageRelease(); stageRelease = null; if (stageFrom && stageFrom.isConnected) stageFrom.focus({ preventScroll: true }); stageFrom = null; }
    return true;
  }
  function leaveSession() {
    clearTimeout(turning); turning = 0;
    const was = view;
    view = was.kind === 'review' && was.done === 0 && was.queue.length && ST().decks.some(d => d.id === was.id) ? { kind: 'deck', id: was.id } : { kind: 'decks' };
    renderTool(); emit('study:closed');
  }
  const clockHtml = () => {
    const run = ML.running && ML.running(), rem = ML.remainingNow ? ML.remainingNow() : 0, started = run || rem < (S.total || 0) - .5;
    return `<span id="fc-tstate">${esc(t(run ? 'fc_running' : started ? 'fc_paused' : 'fc_ready'))}</span><b id="fc-tclock">${esc(($('clock') || {}).textContent || '')}</b><button type="button" class="small ghost" data-fc-timer>${esc(t(run ? 'pause' : started ? 'resume' : 'lock_in'))}</button>`;
  };
  const stageHtml = mode => {
    const body = view.kind === 'review' ? reviewHtml() : quizHtml();
    return mode === 'sheet'
      ? `<div class="fc-clockbar">${clockHtml()}</div><div class="fc-sheet" id="fc-sheet"><div class="fc-grab" data-fc-grab></div>${body}</div>`
      : `<div class="fc-full-in"><div class="fc-clockbar">${clockHtml()}</div>${body}</div>`;
  };
  const refreshClock = () => { const bar = stageOn && stage.querySelector('.fc-clockbar'); if (bar) bar.innerHTML = clockHtml(); };
  on('tick', refreshClock); on('timer', refreshClock);
  on('session', () => { if (stageOn) leaveSession(); }); // the end of a session needs the screen
  // Drag the panel down to close it
  let drag = null;
  stage.addEventListener('pointerdown', e => { if (e.target.closest('[data-fc-grab]')) { drag = { y: e.clientY, el: $('fc-sheet') }; e.target.setPointerCapture(e.pointerId); } });
  stage.addEventListener('pointermove', e => { if (drag && drag.el) drag.el.style.transform = `translateY(${Math.max(0, e.clientY - drag.y)}px)`; });
  const dragEnd = e => { if (!drag) return; const dy = e.clientY - drag.y, el = drag.el; drag = null; if (el) el.style.transform = ''; if (dy > 80) leaveSession(); };
  stage.addEventListener('pointerup', dragEnd); stage.addEventListener('pointercancel', () => { if (drag && drag.el) drag.el.style.transform = ''; drag = null; });
  addEventListener('resize', () => { if (inSession() && stageMode() !== stageOn) renderTool(); });
  const modeBtn = () => (stageOn === 'sheet' || narrow() || view.over ? '' : `<button type="button" class="small ghost fc-modebtn" data-fc-mode>${esc(t(reviewMode() === 'full' ? 'fc_to_panel' : 'fc_to_full'))}</button>`);
  function reviewHtml() {
    const id = view.queue[0], c = id && ST().cards.find(x => x.id === id);
    if (!c) {
      return `<div class="fc-review fc-done"><h3>${esc(t('fc_done_h'))}</h3><p>${view.done ? esc(t('fc_done_p', { n: view.done, xp: view.xp || 0 })) : esc(t('fc_nothing'))}</p>
        <button type="button" class="primary small" data-fc-back>${esc(t('fc_back'))}</button></div>`;
    }
    const opts = [1, 2, 3, 4].map(q => ({ q, s: schedule(c, q) })), left = view.queue.length, pct = view.total ? Math.max(0, 1 - left / view.total) * 100 : 0;
    // Both sides are always in the page: flipping only changes a class, so nothing is redrawn and nothing jumps
    return `<div class="fc-review ${view.shown ? 'shown' : ''}" id="fc-review">
      <div class="fc-top"><button type="button" class="ghost small" data-fc-back>${esc(t('fc_back'))}</button><i class="fc-prog"><em style="width:${pct.toFixed(1)}%"></em></i><span class="chip">${esc(t('fc_left', { n: left }))}</span>${modeBtn()}</div>
      <div class="fc-card" id="fc-card" data-fc-flip role="button" tabindex="0" aria-label="${esc(t('fc_show'))}"><div class="fc-turn">
        <div class="fc-side fc-side-q"><div class="fc-face">${multiline(c.front)}</div></div>
        <div class="fc-side fc-side-a"><div class="fc-face fc-q-mini">${multiline(c.front)}</div><hr><div class="fc-face fc-answer">${multiline(c.back)}</div></div>
      </div></div>
      <div class="fc-acts">
        <button type="button" class="primary fc-show" data-fc-show>${esc(t('fc_show'))}</button>
        <div class="fc-rate">${opts.map(({ q, s }) => `<button type="button" class="r${q}" data-fc-rate="${q}"><b>${esc(t(['', 'fc_again', 'fc_hard', 'fc_good', 'fc_easy'][q]))}</b><small>${esc(ivlLabel(s.ivl))}</small></button>`).join('')}</div>
      </div>
      <div class="fc-foot"><p class="hint fc-keys">${esc(t('fc_keys'))}</p>${view.last ? `<button type="button" class="link" data-fc-undo>${esc(t('fc_undo'))}</button>` : ''}</div>
    </div>`;
  }

  /* ---------- Import: a file or pasted text (Anki and Quizlet exports, CSV, Markdown tables, Q:/A: blocks, JSON from Claude) ---------- */
  const HTML_RE = /<\/?(br|div|p|span|b|i|u|img|ul|ol|li|sub|sup|a|font|strong|em|table|tr|td)\b[^>]*>|&(nbsp|amp|lt|gt|quot|#\d+);/i;
  // DOMParser, not innerHTML: a file's <img onerror> must never run
  const htmlText = s => new DOMParser().parseFromString(s.replace(/<br\s*\/?>|<\/(div|p|li|tr)>/gi, '\n'), 'text/html').body.textContent;
  const cleanSide = v => { let s = v == null ? '' : String(v); if (HTML_RE.test(s)) s = htmlText(s); return s.replace(/\[sound:[^\]]*\]/g, '').replace(/\n{3,}/g, '\n\n').trim(); };
  const toCards = list => (list || []).map(x => {
    const o = Array.isArray(x) ? { f: x[0], b: x[1] } : x && typeof x === 'object' ? { f: x.front ?? x.q ?? x.question ?? x.term ?? x.recto ?? x.prompt, b: x.back ?? x.a ?? x.answer ?? x.definition ?? x.verso ?? x.response } : {};
    return { front: cleanSide(o.f), back: cleanSide(o.b) };
  }).filter(c => c.front && c.back);
  function decksFromJson(j) {
    const named = o => ({ name: String(o.deck || o.name || o.title || '').slice(0, 60), cards: toCards(o.cards || o.flashcards) });
    if (Array.isArray(j)) return j[0] && (j[0].cards || j[0].flashcards) ? j.map(named) : [{ name: '', cards: toCards(j) }];
    if (!j || typeof j !== 'object') return null;
    if (Array.isArray(j.decks)) return j.decks.map(named);
    if (j.cards || j.flashcards) return [named(j)];
    const vals = Object.entries(j);
    return vals.length && vals.every(([, v]) => typeof v === 'string') ? [{ name: '', cards: toCards(vals) }] : null;
  }
  function jsonIn(text) { // a reply from Claude may wrap the JSON in a code fence or a sentence
    const fence = /```[\w-]*\s*\n([\s\S]*?)```/.exec(text), raw = fence ? fence[1] : text;
    const a = raw.search(/[[{]/), b = Math.max(raw.lastIndexOf(']'), raw.lastIndexOf('}'));
    if (a < 0 || b <= a || !/^\s*["{[\]]/.test(raw.slice(a + 1))) return null;
    try { return JSON.parse(raw.slice(a, b + 1).replace(/,\s*([}\]])/g, '$1')); } catch (e) { return null; }
  }
  // A quote only opens a field if it closes right before a separator or a line end, so a lone " can't swallow the lines after it
  const closesField = (text, i, sep) => { for (let j = i + 1; j < text.length; j++) if (text[j] === '"') { if (text[j + 1] === '"') j++; else { const n = text[j + 1]; return n === undefined || n === sep || n === '\n' || n === '\r'; } } return false; };
  function csvRows(text, sep) { // quoted fields may hold the separator and line breaks (Anki does this)
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"' && !cur.trim() && closesField(text, i, sep)) { q = true; cur = ''; }
      else if (ch === sep) { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (ch !== '\r') cur += ch;
    }
    row.push(cur); rows.push(row);
    return rows.filter(r => r.some(c => c.trim()));
  }
  const HEAD_RE = /^(question|questions|front|recto|term|terme|q|prompt)$/i;
  function parseDeck(text0, ext) {
    const text = text0.replace(/^\uFEFF/, '').replace(/\0/g, '').replace(/\r\n?/g, '\n').trim();
    if (!text) return { decks: [], skipped: 0, total: 0 };
    const done = (decks, skipped = 0) => { decks = decks.filter(d => d.cards.length); return { decks, skipped, total: decks.reduce((n, d) => n + d.cards.length, 0) }; };
    if (ext === 'json' || /^\s*[[{]|```/.test(text)) { const j = jsonIn(text), ds = j && decksFromJson(j); if (ds && ds.some(d => d.cards.length)) return done(ds); }
    // Anki's file headers
    let sep = null, deck = ''; const drop = new Set(), body = [];
    const SEPS = { tab: '\t', comma: ',', semicolon: ';', pipe: '|', space: ' ' };
    text.split('\n').forEach(l => {
      let m;
      if ((m = /^#separator:(.+)$/i.exec(l))) sep = SEPS[m[1].trim().toLowerCase()] || m[1];
      else if ((m = /^#deck:(.+)$/i.exec(l))) deck = m[1].trim();
      else if ((m = /^#(?:guid|notetype|deck|tags) column:(\d+)/i.exec(l))) drop.add(+m[1] - 1);
      else if (!/^#\w[\w ]*:/.test(l)) body.push(l);
    });
    let src = body.join('\n'), lines = body.filter(l => l.trim());
    // Q: … / A: … blocks, numbered or not, the answer on its own line or on the question's
    const QRE = /^\s*(?:[-*]\s*)?\*{0,2}(?:Q\s*\d*|Question\s*\d*|Recto|Front|Terme?)\*{0,2}\s*[:.)]\*{0,2}\s*/i, ARE = /^\s*(?:[-*]\s*)?\*{0,2}(?:A\s*\d*|R\s*\d*|Answer\s*\d*|R[ée]ponse\s*\d*|Verso|Back|D[ée]finition)\*{0,2}\s*[:.)]\*{0,2}\s*/i;
    const INLINE_A = /\s(?=(?:A\d*|R|Answer|Réponse|Reponse|Verso|Back)\s*:\s)/; // case-sensitive: "il y a : trois" stays in the question
    const qa = lines.flatMap(l => (QRE.test(l) ? l.split(INLINE_A) : [l]));
    if (qa.some(l => QRE.test(l)) && qa.some(l => ARE.test(l))) {
      const out = []; let cur = null, side = '';
      qa.forEach(l => {
        if (QRE.test(l)) { cur = { front: l.replace(QRE, ''), back: '' }; out.push(cur); side = 'front'; }
        else if (ARE.test(l) && cur) { cur.back = l.replace(ARE, ''); side = 'back'; }
        else if (cur) cur[side] += '\n' + l.trim();
      });
      const cards = toCards(out);
      return done([{ name: deck, cards }], out.length - cards.length);
    }
    // Quizlet can put every card on one line, with ; between them
    if (!sep && lines.length === 1 && (src.match(/;/g) || []).length >= 2) { lines = src.split(';').filter(l => l.trim()); src = lines.join('\n'); }
    // Markdown table
    if (lines.filter(l => /^\s*\|.*\|\s*$/.test(l)).length >= lines.length * .6) {
      const rows = lines.filter(l => /\|/.test(l) && !/^[\s|:-]+$/.test(l)).map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
      if (rows[0] && HEAD_RE.test(rows[0][0])) rows.shift();
      const cards = toCards(rows);
      return done([{ name: deck, cards }], rows.length - cards.length);
    }
    // Lines with a separator: quoted CSV for tab, comma and semicolon; the first occurrence for the others, so an answer may contain it
    const share = s => lines.filter(l => l.includes(s)).length / lines.length;
    const tabs = lines.filter(l => l.trim().includes('\t')).length / lines.length; // lower bar: a Quizlet answer may run over several lines
    if (!sep) sep = tabs >= .3 ? '\t' : ext === 'csv' && share(';') > share(',') ? ';' : ext === 'csv' ? ',' : share(';') >= .6 ? ';' : ['::', ' | ', '->', '→', ' = ', ' – ', ' — ', ' - ', ': '].find(s => share(s) >= .6) || null;
    if (!sep) {
      // Blocks split by an empty line: the first line is the question, the rest the answer
      const blocks = src.split(/\n\s*\n/).map(b => b.split('\n').map(l => l.trim()).filter(Boolean)).filter(b => b.length);
      if (blocks.length >= 2 && blocks.filter(b => b.length >= 2 && b[0].length <= 300).length >= blocks.length * .8) {
        const cards = toCards(blocks.map(b => [b[0], b.slice(1).join('\n')]));
        return done([{ name: deck, cards }], blocks.length - cards.length);
      }
      if (lines.filter(l => l.split(',').length === 2).length >= lines.length * .8) sep = ',';
    }
    if (!sep) return done([], lines.length);
    let rows;
    if (sep === '\t' || sep === ',' || (sep === ';' && ext === 'csv')) {
      rows = csvRows(src, sep);
      // Quizlet doesn't quote: a line without a tab carries on the answer above
      if (sep === '\t') rows = rows.reduce((out, r) => { const p = out[out.length - 1]; if (r.length === 1 && p && p.length > 1) p[p.length - 1] += '\n' + r[0]; else out.push(r); return out; }, []);
      rows = rows.map(r => r.filter((_, i) => !drop.has(i)));
    } else {
      const bullet = /^\s*(?:[-*•]|\d+[.)])\s+/;
      rows = lines.map(l => { const s = l.replace(bullet, ''), i = s.indexOf(sep); return i < 0 ? [s] : [s.slice(0, i), s.slice(i + sep.length)]; });
    }
    if (rows[0] && HEAD_RE.test((rows[0][0] || '').trim())) rows.shift();
    const cards = toCards(rows);
    return done([{ name: deck, cards }], rows.length - cards.length);
  }
  ML.parseDeck = parseDeck;
  const cardKey = c => norm(c.front) + '\n' + norm(c.back);
  function importHtml() {
    const V = view;
    return `<div class="fc-head"><button type="button" class="ghost small" data-fc-back>${esc(t('fc_back'))}</button><h3>${esc(t('fi_h'))}</h3></div>
      <div class="fi-zone" id="fi-zone">
        <label class="fi-file"><input type="file" id="fi-input" accept=".txt,.csv,.tsv,.json,.md,.apkg,text/*,application/json"><span>${esc(t('fi_file'))}</span></label>
        <small>${esc(V.fileName || t('fi_drop'))}</small>
      </div>
      ${V.big ? `<p class="hint">${esc(t('fi_long'))}</p>` : `<textarea id="fi-text" rows="6" spellcheck="false" placeholder="${esc(t('fi_ph'))}">${esc(V.text || '')}</textarea>`}
      <div id="fi-preview">${importPreview()}</div>
      <details class="fi-claude"><summary>${esc(t('fi_claude'))}</summary>
        <p class="hint">${esc(t('fi_claude_p'))}</p>
        <pre>${esc(t('fi_prompt'))}</pre>
        <button type="button" class="small" data-fi-copy>${esc(t('fi_copy'))}</button>
      </details>`;
  }
  function importPreview() {
    const V = view, P = V.parsed;
    if (V.err) return `<p class="hint fi-err">${esc(V.err)}</p>`;
    if (!P || !(V.text || '').trim()) return '';
    if (!P.total) return `<p class="hint fi-err">${esc(t('fi_none'))}</p>`;
    const one = P.decks.length === 1, D = ST(), tgt = V.target || 'new', first = P.decks[0].cards;
    const inDeck = one && tgt !== 'new' ? new Set(deckCards(tgt).map(cardKey)) : null, dup = inDeck ? first.filter(c => inDeck.has(cardKey(c))).length : 0, n = P.total - dup;
    const facts = [t('fi_found', { n: P.total }), P.skipped ? t('fi_skip', { n: P.skipped }) : '', dup ? t('fi_dup', { n: dup }) : ''].filter(Boolean).join(' · ');
    return `<div class="fi-sum"><p class="fi-facts">${esc(facts)}</p>
      <ul class="fi-sample">${first.slice(0, 3).map(c => `<li><b>${esc(c.front.slice(0, 90))}</b><span>${esc(c.back.slice(0, 90))}</span></li>`).join('')}</ul>
      ${P.total > 3 ? `<small class="fi-more">${esc(t('fi_more', { n: P.total - Math.min(3, first.length) }))}</small>` : ''}
      ${one ? `<div class="fi-target"><label><span>${esc(t('fi_into'))}</span><select id="fi-target"><option value="new" ${tgt === 'new' ? 'selected' : ''}>${esc(t('fi_new'))}</option>${D.decks.map(d => `<option value="${d.id}" ${tgt === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label>
        ${tgt === 'new' ? `<label><span>${esc(t('fi_name'))}</span><input type="text" id="fi-name" maxlength="60" value="${esc(V.name || '')}"></label>` : ''}</div>`
      : `<ul class="fi-decks">${P.decks.map(d => `<li><b>${esc(d.name || t('fi_new'))}</b><small>${esc(tn('fc_cards_n', d.cards.length))}</small></li>`).join('')}</ul>`}
      <button type="button" class="primary" data-fi-go ${n ? '' : 'disabled'}>${esc(t('fi_go', { n }))}</button></div>`;
  }
  const importRefresh = () => { const el = $('fi-preview'); if (el) el.innerHTML = importPreview(); };
  function importParse() {
    const V = view; V.err = '';
    V.parsed = parseDeck(V.text || '', V.ext || '');
    const P = V.parsed; if (P.decks.length === 1 && !V.nameEdited) V.name = P.decks[0].name || V.fileBase || '';
    importRefresh();
  }
  // Text files come in UTF-8, UTF-16 (Notepad's "Unicode") or Windows-1252 (older Windows and Excel, where accents break if read as UTF-8)
  async function readText(file) {
    const b = new Uint8Array(await file.arrayBuffer()), dec = (enc, o) => new TextDecoder(enc, o).decode(b);
    const head = b.subarray(0, 4096); let odd = 0, even = 0;
    head.forEach((x, i) => { if (!x) { if (i % 2) odd++; else even++; } });
    const bom16 = b[0] === 0xFF && b[1] === 0xFE ? 'utf-16le' : b[0] === 0xFE && b[1] === 0xFF ? 'utf-16be' : odd > head.length * .3 ? 'utf-16le' : even > head.length * .3 ? 'utf-16be' : '';
    if (bom16) return dec(bom16);
    if (b.includes(0)) { const e = new Error('not text'); e.name = 'NotText'; throw e; } // a PDF or Word file renamed or dropped here
    try { return dec('utf-8', { fatal: true }); } catch (e) { return dec('windows-1252'); }
  }
  ML.readText = readText;
  const FILE_MAX = 50e6, SHOW_MAX = 200000; // only what becomes cards is kept, and a long text would freeze the text box
  async function importFile(file) {
    if (!file || view.kind !== 'import') return;
    const V = view, ext = (/\.(\w+)$/.exec(file.name) || [])[1] || '';
    V.err = ''; V.fileName = file.name; V.big = false;
    if (ext.toLowerCase() === 'apkg') { V.err = t('fi_apkg'); V.text = ''; V.parsed = null; return renderTool(); }
    if (file.size > FILE_MAX) { V.err = t('fi_big'); V.text = ''; V.parsed = null; return renderTool(); }
    try { V.text = await readText(file); } catch (e) { V.err = t('fi_err'); V.text = ''; V.parsed = null; return renderTool(); }
    if (view !== V) return;
    V.big = V.text.length > SHOW_MAX;
    V.ext = ext.toLowerCase(); V.fileBase = file.name.replace(/\.\w+$/, '').slice(0, 60); V.nameEdited = false;
    importParse(); renderTool();
  }
  function importCommit() {
    const V = view, P = V.parsed, D = ST(); if (!P || !P.total) return;
    const size = P.decks.reduce((a, d) => a + d.cards.reduce((b, c) => b + c.front.length + c.back.length + 130, 0), 0);
    // Cards live in S, so in localStorage (about 5 million characters per site). save() frees restore points when it must; the sync base is a second copy of S that grows too
    let other = 0, hasBase = false;
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('mli-sync-base:')) hasBase = true; if (k !== ML.storageKey() && !/^mli-(snaps|corrupt):/.test(k)) other += k.length + localStorage.getItem(k).length; } } catch (e) {}
    if (JSON.stringify(S).length + size + other + (hasBase ? size : 0) > 4.5e6) { toast(t('fi_full'), { ms: 6000 }); return; }
    const one = P.decks.length === 1; let n = 0, last = null;
    P.decks.forEach(pd => {
      const name = (one ? (V.name || '').trim() : '') || pd.name || t('fi_new');
      let deck = one && V.target && V.target !== 'new' ? D.decks.find(d => d.id === V.target) : D.decks.find(d => d.name === name);
      if (!deck) { deck = { id: uid(), name: name.slice(0, 60), created: Date.now() }; D.decks.push(deck); }
      const seen = new Set(deckCards(deck.id).map(cardKey));
      pd.cards.forEach(c => { const k = cardKey(c); if (seen.has(k)) return; seen.add(k); addCard(deck.id, c.front, c.back); n++; });
      last = deck;
    });
    save(); view = one ? { kind: 'deck', id: last.id } : { kind: 'decks' };
    renderTool(); toast(t('fc_bulk_done', { n }));
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
    view = { kind: 'quiz', id, qs, pos: 0, score: 0, answered: null, wrong: [], over: view.over }; renderTool();
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
      <div class="fc-top"><button type="button" class="ghost small" data-fc-back>${esc(t('fc_back'))}</button><span class="chip">${V.pos + 1}/${V.qs.length} · ${V.score} ✓</span>${modeBtn()}</div>
      <div class="fc-card fc-still"><div class="fc-turn"><div class="fc-side"><div class="fc-face">${multiline(c.front)}</div></div></div></div>
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
    if (view.qs[view.pos].type === 'type') { const n = document.querySelector('[data-qznext]'); if (n) n.focus(); }
  }
  function quizNext() {
    const V = view; V.pos++; V.answered = null;
    if (V.pos >= V.qs.length) { V.xp = Math.min(20, V.score * 2); if (V.xp) ML.addXp(V.xp); if (ML.sfx) ML.sfx('quest'); }
    renderTool();
    const i = $('qz-in'); if (i) i.focus();
  }
  function startReview(id, over) { const queue = queueFor(id); view = { kind: 'review', id, queue, total: queue.length, shown: false, done: 0, xp: 0, over: !!over || (view.over && inSession()) }; renderTool(); }
  function undoRate() {
    const L = view.last; if (!L || turning || view.kind !== 'review') return;
    const c = ST().cards.find(x => x.id === L.id); if (c) Object.assign(c, L.snap);
    const D = ST(); D.day = L.day; D.reviewed = L.reviewed;
    view.queue = L.queue; view.done = L.done; view.shown = true; view.last = null;
    save(); renderTool();
  }
  let turning = 0; // the short moment the rated card leaves
  function flip(to) {
    if (turning || view.kind !== 'review') return;
    view.shown = to == null ? !view.shown : to;
    const r = $('fc-review'); if (r) r.classList.toggle('shown', view.shown);
  }
  function rate(q) {
    if (turning || view.kind !== 'review') return;
    const queue0 = view.queue.slice(), D0 = ST();
    const id = view.queue.shift(), c = ST().cards.find(x => x.id === id); if (!c) { renderTool(); return; } // a card deleted on another device: skip it
    view.last = { id, queue: queue0, done: view.done, day: D0.day, reviewed: D0.reviewed, snap: { ease: c.ease, ivl: c.ivl, due: c.due, reps: c.reps, lapses: c.lapses } };
    const s = schedule(c, q);
    c.ease = s.ease; c.ivl = s.ivl; c.due = addDays(today(), s.ivl); c.updated = Date.now();
    if (s.lapse) c.lapses = (c.lapses || 0) + 1;
    if (q === 1) { c.reps = c.reps || 0; view.queue.splice(Math.min(view.queue.length, 3), 0, id); } // see it again in a few cards
    else c.reps = (c.reps || 0) + 1;
    const D = ST(); if (D.day !== today()) { D.day = today(); D.reviewed = 0; }
    D.reviewed++; view.done++;
    view.shown = false;
    if (!view.queue.length) { const xp = Math.min(40, view.done); view.xp = xp; if (xp) ML.addXp(xp); emit('study:session', view.done); if (ML.sfx) ML.sfx('quest'); }
    save();
    const card = $('fc-card');
    if (!view.queue.length || !card || ML.reducedMotion()) { renderTool(); return; }
    card.classList.add(q === 1 ? 'out-back' : 'out-next');
    turning = setTimeout(() => { turning = 0; if (view.kind === 'review') renderTool(); }, 150);
  }
  const FRONT_MAX = 2000, BACK_MAX = 4000;
  function addCard(deck, front, back) {
    const c = { id: uid(), deck, front: front.trim().slice(0, FRONT_MAX), back: back.trim().slice(0, BACK_MAX), due: today(), ivl: 0, ease: 2.5, reps: 0, lapses: 0, created: Date.now() };
    ST().cards.push(c); return c;
  }
  // Used by the Notebook ("highlight → flashcard") and the translator
  ML.studyDecks = () => ST().decks.map(d => ({ id: d.id, name: d.name }));
  ML.studyDeckInfo = id => ({ cards: deckCards(id).slice().reverse(), due: queueFor(id).length, exists: ST().decks.some(d => d.id === id) });
  ML.studyReview = id => startReview(id, true);
  // Android's back button closes the panel on top instead of leaving the app
  const backStack = []; let backSkip = 0;
  addEventListener('popstate', () => { if (backSkip) { backSkip--; return; } const f = backStack.pop(); if (f) f(); });
  ML.backClose = fn => {
    try { history.pushState({ mli: 1 }, ''); } catch (e) {}
    backStack.push(fn);
    return () => { const i = backStack.indexOf(fn); if (i < 0) return; backStack.splice(i, 1); backSkip++; try { history.back(); } catch (e) { backSkip--; } };
  };
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
    return `<div class="seg-toggle st-sub" role="group">${['exams', 'dict', 'cite', 'units', 'calc'].map(k => `<button type="button" data-stsub="${k}" aria-pressed="${sub === k}">${esc(t('tl_' + k))}</button>`).join('')}</div>
      ${sub === 'cite' ? citeHtml() : sub === 'units' ? unitsHtml() : sub === 'exams' ? examsHtml() : sub === 'calc' ? calcHtml() : dictHtml()}`;
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

  // Scientific calculator. A small recursive-descent parser (extension pages forbid eval):
  // + - * / ^ ! %, implicit multiplication (2π, 3(1+2), 2sin(30)), functions, π e ans, degrees or radians.
  // Only the angle mode is saved; the history lives in memory for this session.
  const FNS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, sqrt: Math.sqrt, cbrt: Math.cbrt, ln: Math.log, log: Math.log10,
    exp: Math.exp, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round,
  };
  const NAMES = [...Object.keys(FNS), 'pi', 'ans', 'e'].sort((a, b) => b.length - a.length);
  function fact(n) { if (n < 0 || n !== Math.floor(n) || n > 170) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
  function calc(src, deg, ans) {
    const s = String(src).toLowerCase().replace(/\*\*/g, '^').replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/,/g, '.').replace(/\s+/g, '');
    const toks = [];
    for (let i = 0; i < s.length;) {
      const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));
      if (num) { toks.push(+num[0]); i += num[0].length; continue; }
      if ('+-*/^()!%'.includes(s[i])) { toks.push(s[i++]); continue; }
      const name = NAMES.find(n => s.startsWith(n, i)); // letters split into known names: "2pisin" → 2 pi sin
      if (!name) throw new Error('token');
      toks.push(name); i += name.length;
    }
    if (!toks.length) throw new Error('empty');
    let p = 0;
    const peek = () => toks[p], startsValue = k => typeof k === 'number' || k === '(' || NAMES.includes(k);
    const toRad = x => (deg ? x * Math.PI / 180 : x), fromRad = x => (deg ? x * 180 / Math.PI : x);
    function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const o = toks[p++], r = term(); v = o === '+' ? v + r : v - r; } return v; }
    function term() {
      let v = unary();
      for (;;) {
        const k = peek();
        if (k === '*' || k === '/') { p++; const r = unary(); v = k === '*' ? v * r : v / r; }
        else if (k !== undefined && startsValue(k)) v *= unary(); // implicit multiplication
        else return v;
      }
    }
    function unary() { if (peek() === '-') { p++; return -unary(); } if (peek() === '+') { p++; return unary(); } return power(); }
    function power() { const b = postfix(); if (peek() === '^') { p++; return Math.pow(b, unary()); } return b; }
    function postfix() { let v = primary(); while (peek() === '!' || peek() === '%') v = toks[p++] === '!' ? fact(v) : v / 100; return v; }
    function primary() {
      const k = toks[p++];
      if (typeof k === 'number') return k;
      if (k === '(') { const v = expr(); if (peek() === ')') p++; else if (p < toks.length) throw new Error('paren'); return v; } // a missing ")" at the end is forgiven
      if (k === 'pi') return Math.PI;
      if (k === 'e') return Math.E;
      if (k === 'ans') return ans;
      if (FNS[k]) {
        const x = peek() === '(' ? primary() : postfix();
        if (['sin', 'cos', 'tan'].includes(k)) return FNS[k](toRad(x));
        if (['asin', 'acos', 'atan'].includes(k)) return fromRad(FNS[k](x));
        return FNS[k](x);
      }
      throw new Error('syntax');
    }
    const v = expr();
    if (p < toks.length) throw new Error('syntax');
    return Math.abs(v) < 1e-13 ? 0 : +v.toPrecision(12); // sin(180°) gives 1.2e-16: show 0
  }
  ML.calc = calc;
  let caExpr = '', caPos = 0, caAns = 0, caHist = [];
  const caTry = src => { try { const v = calc(src, ST().calcDeg !== false, caAns); return isNaN(v) ? null : v; } catch (e) { return null; } };
  const caFmt = v => (v === Infinity ? '∞' : v === -Infinity ? '−∞' : fmtNum(v));
  const caPlain = v => String(v).replace('.', ML.locale().startsWith('fr') ? ',' : '.'); // back into the input, without digit grouping
  const CA_FN = [['sin', 'sin('], ['cos', 'cos('], ['tan', 'tan('], ['sin⁻¹', 'asin('], ['cos⁻¹', 'acos('], ['tan⁻¹', 'atan('],
    ['ln', 'ln('], ['log', 'log('], ['√', '√('], ['x²', '^2'], ['xʸ', '^'], ['n!', '!'], ['π', 'π'], ['e', 'e'], ['%', '%'], ['ans', 'ans']];
  const CA_KEYS = ['AC', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', ',', '⌫', '='];
  function calcHtml() {
    const deg = ST().calcDeg !== false, prev = caTry(caExpr);
    return `<div class="ca">
      <div class="ca-screen">
        <input type="text" id="ca-in" class="ca-in" value="${esc(caExpr)}" placeholder="${esc(t('ca_ph'))}" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="none">
        <div class="ca-out" id="ca-out">${prev == null || !caExpr ? '&nbsp;' : '= ' + esc(caFmt(prev))}</div>
      </div>
      <div class="ca-fns"><button type="button" class="ca-mode" data-camode aria-pressed="${deg}">${deg ? 'DEG' : 'RAD'}</button>${CA_FN.map(([l, ins]) => `<button type="button" data-cains="${esc(ins)}">${esc(l)}</button>`).join('')}</div>
      <div class="ca-keys">${CA_KEYS.map(k => `<button type="button" data-cakey="${esc(k)}" class="${k === '=' ? 'primary' : /[÷×−+()]/.test(k) ? 'op' : k === 'AC' || k === '⌫' ? 'fx' : ''}">${esc(k)}</button>`).join('')}</div>
      ${caHist.length ? `<div class="ca-hist"><div class="ca-hist-head"><span class="label">${esc(t('ca_hist'))}</span><button type="button" class="ghost small" data-caclear>${esc(t('ca_clear'))}</button></div>
        <ul>${caHist.map((h, i) => `<li><button type="button" data-cahist="${i}"><span>${esc(h.expr)}</span><b>= ${esc(caFmt(h.v))}</b></button></li>`).join('')}</ul></div>` : ''}
      <p class="hint">${esc(t('ca_hint'))}</p>
    </div>`;
  }
  const fineMouse = () => matchMedia('(pointer: fine)').matches; // don't pop the phone keyboard for keypad taps
  function caSet(v, pos = v.length) {
    caExpr = v; caPos = pos; caJustEq = false;
    const i = $('ca-in'); if (i) { i.value = v; if (fineMouse()) { i.focus(); i.setSelectionRange(pos, pos); } }
    const o = $('ca-out'), r = caTry(v); if (o) o.innerHTML = r == null || !v ? '&nbsp;' : '= ' + esc(caFmt(r));
  }
  let caJustEq = false;
  function caInsert(s) {
    // Right after "=", an operator chains on the result; anything else starts a new calculation
    if (caJustEq && !/^[÷×−+^!%)]/.test(s)) { caExpr = ''; caPos = 0; }
    caJustEq = false;
    caSet(caExpr.slice(0, caPos) + s + caExpr.slice(caPos), caPos + s.length);
  }
  function caEquals() {
    if (!caExpr.trim()) return;
    const v = caTry(caExpr);
    if (v == null) { const o = $('ca-out'); if (o) o.innerHTML = `<span class="ca-err">${esc(t('ca_err'))}</span>`; return; }
    caHist.unshift({ expr: caExpr, v }); caHist = caHist.slice(0, 12); caAns = v;
    caExpr = caPlain(v); caPos = caExpr.length; renderTool(); caJustEq = true;
    const i = $('ca-in'); if (i && fineMouse()) { i.focus(); i.setSelectionRange(caPos, caPos); }
  }

  /* ---------- Events (the study tab, and the panel a review opens in) ---------- */
  const root = $('study'), listen = (ev, fn, opt) => [root, stage].forEach(h => h.addEventListener(ev, fn, opt));
  listen('click', e => {
    const b = e.target.closest('button'); if (!b || ST().tool !== 'tools' || ST().sub !== 'calc') return;
    if (b.dataset.cains != null) { caInsert(b.dataset.cains); return; }
    if (b.hasAttribute('data-camode')) { ST().calcDeg = ST().calcDeg === false; save(); renderTool(); return; }
    if (b.hasAttribute('data-caclear')) { caHist = []; renderTool(); return; }
    if (b.dataset.cahist != null) { const h = caHist[+b.dataset.cahist]; if (h) caSet(h.expr); return; }
    const k = b.dataset.cakey; if (!k) return;
    if (k === '=') caEquals();
    else if (k === 'AC') caSet('');
    else if (k === '⌫') { if (caPos > 0) { caExpr = caExpr.slice(0, caPos - 1) + caExpr.slice(caPos); caSet(caExpr, caPos - 1); } }
    else caInsert(k);
  });
  listen('input', e => { if (e.target.id === 'ca-in') { caJustEq = false; caExpr = e.target.value; caPos = e.target.selectionStart; caSet(caExpr, caPos); } });
  ['keyup', 'click', 'select'].forEach(ev => listen(ev, e => { if (e.target.id === 'ca-in') caPos = e.target.selectionStart; }));
  listen('keydown', e => {
    if (e.target.id !== 'ca-in') return;
    if (e.key === 'Enter') { e.preventDefault(); caEquals(); }
    else if (e.key === 'ArrowUp' && caHist.length) { e.preventDefault(); caSet(caHist[0].expr); }
    else if (e.key === 'Escape') { e.preventDefault(); caSet(''); }
  });
  listen('click', e => {
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
  listen('submit', e => {
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
  listen('input', e => { if (e.target.id === 'un-v') { uv = e.target.value; updateUnits(); } });
  listen('change', e => { if (e.target.id === 'un-from' || e.target.id === 'un-to') { if (e.target.id === 'un-from') uFrom = e.target.value; else uTo = e.target.value; renderTool(); } });

  listen('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) { ST().tool = b.dataset.tool; save(); render(); return; }
    if (b.dataset.fcOpen) { view = { kind: 'deck', id: b.dataset.fcOpen }; renderTool(); return; }
    if (b.dataset.fcReview) { startReview(b.dataset.fcReview); return; }
    if (b.dataset.qzstart) { startQuiz(b.dataset.qzstart); return; }
    if (b.dataset.qzopt != null && view.kind === 'quiz' && !view.answered) { const q = view.qs[view.pos], c = ST().cards.find(x => x.id === q.cardId), i = +b.dataset.qzopt; quizAnswer(q.options[i] === c.back, { chosen: i }); return; }
    if (b.hasAttribute('data-qznext') && view.kind === 'quiz') { quizNext(); return; }
    if (b.hasAttribute('data-qzfix') && view.kind === 'quiz') { view.wrong.forEach(id => { const c = ST().cards.find(x => x.id === id); if (c) { c.due = today(); c.ivl = 0; } }); save(); startReview(view.id); return; }
    if (b.hasAttribute('data-fc-back')) {
      if (inSession()) { leaveSession(); return; }
      view = view.kind === 'import' && view.deckId ? { kind: 'deck', id: view.deckId } : { kind: 'decks' };
      renderTool(); return;
    }
    if (b.dataset.fcWhere) { ST().reviewMode = b.dataset.fcWhere; save(); renderTool(); return; }
    if (b.hasAttribute('data-fc-mode')) { ST().reviewMode = reviewMode() === 'full' ? 'panel' : 'full'; save(); renderTool(); return; }
    if (b.hasAttribute('data-fc-timer')) { ML.toggleTimer(); refreshClock(); return; }
    if (b.hasAttribute('data-fc-undo')) { undoRate(); return; }
    if (b.hasAttribute('data-fc-show')) { flip(true); return; }
    if (b.dataset.fcRate) { rate(+b.dataset.fcRate); return; }
    if (b.dataset.fcEditOpen) { view.editing = b.dataset.fcEditOpen; cardListRefresh(); return; }
    if (b.hasAttribute('data-fc-cancel')) { view.editing = null; cardListRefresh(); return; }
    if (b.dataset.fcDel) { ST().cards = ST().cards.filter(c => c.id !== b.dataset.fcDel); save(); renderTool(); return; }
    if (b.hasAttribute('data-fc-more')) { view.limit = (view.limit || LIST_STEP) + LIST_STEP; cardListRefresh(); return; }
    if (b.hasAttribute('data-fi-open')) { const deckId = b.dataset.fiOpen || null; view = { kind: 'import', deckId, target: deckId || 'new', text: '', parsed: null }; renderTool(); return; }
    if (b.hasAttribute('data-fi-go') && view.kind === 'import') { importCommit(); return; }
    if (b.hasAttribute('data-fi-copy')) { try { navigator.clipboard.writeText(t('fi_prompt')).then(() => toast(t('fi_copied'))); } catch (err) {} return; }
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
  listen('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (f.id === 'qz-type' && view.kind === 'quiz' && !view.answered) { const q = view.qs[view.pos], c = ST().cards.find(x => x.id === q.cardId), given = $('qz-in').value; if (!given.trim()) return; quizAnswer(closeEnough(given, c.back), { given }); return; }
    if (f.id === 'fc-newdeck') { const v = f.querySelector('input').value.trim(); if (!v) return; const d = { id: uid(), name: v.slice(0, 60), created: Date.now() }; ST().decks.push(d); save(); view = { kind: 'deck', id: d.id }; renderTool(); return; }
    if (f.id === 'fc-add') { addCard(view.id, f.front.value, f.back.value); save(); renderTool(); toast(t('fc_added')); const n = root.querySelector('#fc-add [name=front]'); if (n) n.focus(); return; }
    if (f.dataset.fcEdit) { const c = ST().cards.find(x => x.id === f.dataset.fcEdit); if (c) { c.front = f.front.value.trim(); c.back = f.back.value.trim(); c.updated = Date.now(); save(); } view.editing = null; renderTool(); return; }
    if (f.id === 'sr-form') { const q = $('sr-q').value.trim(); if (q) search(q); }
  });
  listen('change', e => {
    if (e.target.id === 'tr-from' || e.target.id === 'tr-to') { ST().tr[e.target.id === 'tr-from' ? 'from' : 'to'] = e.target.value; trIn = $('tr-in').value; save(); }
  });
  listen('input', e => { if (e.target.id === 'tr-in') trIn = e.target.value; });
  // Flashcards: tap the card to flip; the deck's search and the import form update only their own part of the page
  listen('click', e => {
    if (!e.target.closest('[data-fc-flip]') || String(getSelection() || '')) return;
    flip();
  });
  const cardListRefresh = () => { const el = $('fc-list-box'); if (el && view.kind === 'deck') ML.keepInputs(el, () => { el.innerHTML = cardListHtml(view.id); }); };
  let fiT = 0;
  listen('input', e => {
    const id = e.target.id;
    if (id === 'fc-find' && view.kind === 'deck') { view.find = e.target.value; view.limit = 0; cardListRefresh(); }
    else if (id === 'fi-text' && view.kind === 'import') { view.text = e.target.value; clearTimeout(fiT); fiT = setTimeout(() => { if (view.kind === 'import') importParse(); }, 180); }
    else if (id === 'fi-name' && view.kind === 'import') { view.name = e.target.value; view.nameEdited = true; }
  });
  listen('change', e => {
    if (e.target.id === 'fi-input') importFile(e.target.files[0]);
    else if (e.target.id === 'fi-target' && view.kind === 'import') { view.target = e.target.value; importRefresh(); }
    else if (e.target.id === 'fc-newper' && view.kind === 'deck') { const d = ST().decks.find(x => x.id === view.id); if (d) { d.newPer = +e.target.value; save(); renderTool(); } }
  });
  listen('dragover', e => { const z = e.target.closest('#fi-zone'); if (z) { e.preventDefault(); z.classList.add('over'); } });
  listen('dragleave', e => { const z = e.target.closest('#fi-zone'); if (z) z.classList.remove('over'); });
  listen('drop', e => { const z = e.target.closest('#fi-zone'); if (z) { e.preventDefault(); z.classList.remove('over'); importFile(e.dataTransfer.files[0]); } });
  listen('keydown', e => { if (e.target.id === 'tr-in' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); trIn = e.target.value; translate(); } });
  // Deleting a deck asks for a second tap; the button is re-rendered, so arm it by hand
  let delArmed = null;
  listen('click', e => {
    const b = e.target.closest('#fc-del-deck'); if (!b) return;
    if (delArmed !== view.id) { delArmed = view.id; b.textContent = t('tap_again'); setTimeout(() => { if (delArmed) { delArmed = null; const x = $('fc-del-deck'); if (x) x.textContent = t('fc_del_deck'); } }, 3000); return; }
    const id = view.id; delArmed = null;
    ST().decks = ST().decks.filter(d => d.id !== id); ST().cards = ST().cards.filter(c => c.deck !== id);
    view = { kind: 'decks' }; save(); renderTool(); toast(t('fc_deck_deleted'));
  });
  // Review keys: Space flips, 1-4 rate, Esc leaves a panel. Capture phase so the tab shortcuts (1-7) don't fire meanwhile.
  addEventListener('keydown', e => {
    if (!inSession() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!stageOn && (S.tab !== 'study' || ST().tool !== 'cards' || $('tab-study').hidden)) return;
    if (stageOn && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); leaveSession(); return; }
    if (ML.isTyping(e)) return;
    const onBtn = e.target.closest && e.target.closest('button');
    if (view.kind === 'review' && view.queue.length) {
      if ((e.key === ' ' || e.key === 'Enter') && !(onBtn && !onBtn.hasAttribute('data-fc-show'))) { e.preventDefault(); e.stopPropagation(); if (!view.shown) flip(true); else rate(3); return; }
      if (view.shown && e.key.length === 1 && '1234'.includes(e.key)) { e.preventDefault(); e.stopPropagation(); rate(+e.key); return; }
    }
    if (stageOn && e.key !== 'Tab' && !onBtn) e.stopPropagation(); // nothing reaches the app behind the panel
  }, true);

  on('tab', name => { if (name === 'study') render(); });
  on('premium', () => render());
  on('started', () => { const l = $('study-lock'); if (l) l.style.display = ML.isPremium() ? 'none' : ''; if (S.tab === 'study') render(); });
  ML.renderStudy = render;
  ML.studyLockedHtml = lockedHtml;
})();
