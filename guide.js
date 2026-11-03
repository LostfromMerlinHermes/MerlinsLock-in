// Guide (3.58, You space) and first-visit tips. One list describes every feature: to document a new one, add a line to
// GUIDE with the version it arrived in and its two strings. The Guide page, its search, "Show me" and the What's new block
// all follow from it. Tips: the first time a tab opens, one card says what it is for, then never comes back.
(() => {
  'use strict';
  const { $, S, t, esc, on, save } = ML;

  const VERSION = '3.64'; // bump with the features you add below
  // id, group, since, go: a tab name, or 'timer' / 'shop' / 'settings' / 'worlds' / 'energy' / 'quick'
  const GUIDE = [
    ['energy', 'timer', '3.0', 'energy'], ['timer', 'timer', '3.0', 'timer'], ['deep', 'timer', '3.0', 'timer'], ['sound', 'timer', '3.30', 'timer'], ['quick', 'timer', '3.58', 'quick'], ['ksearch', 'timer', '3.60', 'search'], ['sess', 'timer', '3.60', 'settings'], ['gest', 'work', '3.60', 'plan'],
    ['plan', 'work', '3.0', 'plan'], ['inbox', 'work', '3.56', 'plan'], ['day', 'work', '3.0', 'day'], ['cal', 'work', '3.0', 'cal'], ['mail', 'work', '3.50', 'plan'],
    ['notes', 'study', '3.0', 'notes'], ['lib', 'study', '3.54', 'lib'], ['cards', 'study', '3.8', 'study'], ['subjects', 'study', '3.58', 'subjects'], ['exams', 'study', '3.58', 'subjects'], ['grades', 'study', '3.58', 'subjects'], ['lectures', 'study', '3.59', 'lectures'], ['mock', 'study', '3.59', 'subjects'], ['learn', 'study', '3.56', 'learn'],
    ['fc', 'you', '3.62', 'focus'], ['tree', 'you', '3.63', 'tree'], ['stuck', 'you', '3.62', 'focus'], ['pd', 'you', '3.62', 'focus'], ['scr', 'you', '3.62', 'screen'], ['hl', 'you', '3.62', 'health'], ['grim', 'you', '3.0', 'grim'], ['tower', 'you', '3.0', 'grim'], ['exped', 'you', '3.59', 'grim'], ['season', 'you', '3.59', 'grim'], ['boss', 'you', '3.0', 'plan'], ['room', 'you', '3.58', 'room'], ['roomchat', 'you', '3.64', 'room'], ['shop', 'you', '3.0', 'shop'], ['worlds', 'you', '3.29', 'worlds'], ['sync', 'you', '3.0', 'settings'],
  ].map(([id, group, since, go]) => ({ id, group, since, go }));
  const TIPS = ['plan', 'day', 'cal', 'notes', 'lib', 'study', 'subjects', 'lectures', 'learn', 'grim', 'room'];

  ML.addStrings({
    fr: {
      g_tree: 'Arbre', g_tree_d: 'Une branche par semaine, une fleur par session Flow, des racines si le check Santé est actif. D’autres arbres se débloquent en travaillant dans un monde.', g_fc: 'Focus', g_fc_d: 'Les sessions Flow, leur bonus, ta durée de concentration et les retours après un trou. Choisis Calm ou Lively en bas de la page.', g_stuck: 'Je n’arrive pas à commencer', g_stuck_d: 'Sous le Lock in : écris le plus petit geste, 2 minutes de minuteur, et tu peux t’arrêter après.', g_pd: 'Périodes', g_pd_d: 'Term, Exams, Light, Holidays règlent l’objectif du jour et le blocage. Exams s’active seule avant un examen. En Holidays, la série est gelée.', g_scr: 'Temps d’écran', g_scr_d: 'Temps par site et blocage selon des horaires dans l’extension, écran de pause, plans si-alors et urge timer. Sur téléphone, un chiffre à noter et une pause à régler dans Raccourcis.', g_hl: 'Santé', g_hl_d: 'Un check de 20 secondes, à activer toi-même. Il compare tes journées et reste sur l’appareil.',
      g_ksearch: 'Recherche', g_ksearch_d: 'Ctrl K sur ordinateur, la loupe sur téléphone. Trouve une section, une tâche, une note ou un paquet, et lance des actions : « 25 min », « ajouter réviser droit demain ».', g_sess: 'Mode séance', g_sess_d: 'Pendant un Lock in, l’écran garde le temps, la tâche et les outils du cours. Tout revient à la fin. Se désactive dans les réglages.', g_gest: 'Gestes', g_gest_d: 'Sur téléphone : glisse une tâche à droite pour la terminer, à gauche pour lancer un Lock in, appuie longuement pour la déplacer. Depuis le bord de l’écran, glisse pour changer d’espace. Tire le cadran vers le bas pour le fermer.',
      tab_guide: 'Guide', gd_search: 'Chercher une fonction', gd_new_h: 'Nouveau depuis ta dernière visite', gd_seen: 'Compris', gd_show: 'Montre-moi', gd_new: 'Nouveau', gd_none: 'Rien ne correspond à cette recherche.', gd_all: 'Tout', gd_g_timer: 'Minuteur', gd_g_work: 'Organisation', gd_g_study: 'Étude', gd_g_you: 'Toi',
      tip_ok: 'Compris', tip_guide: 'Ouvrir le guide',
      g_energy: 'Énergie', g_energy_d: 'Chaque jour, choisis ton énergie : elle change le monde, la durée des sessions et l’ordre des tâches.',
      g_timer: 'Minuteur', g_timer_d: 'Choisis une durée, appuie sur Lock in. À la fin : de l’XP, de l’or et un étage de plus à ta tour.',
      g_deep: 'Plein écran', g_deep_d: 'Le bouton aux quatre coins cache tout sauf le temps et ta tâche.',
      g_sound: 'Son', g_sound_d: 'Musique et ambiances générées dans l’app. Sur ordinateur sous le minuteur, sur téléphone dans les outils rapides.',
      g_quick: 'Outils rapides', g_quick_d: 'Inbox, note, traduction et calculatrice, sans changer d’onglet. La poignée à droite sur ordinateur, le bouton en haut sur téléphone.',
      g_plan: 'Plan', g_plan_d: 'Tes tâches, triées selon ton énergie. Lock in lance le minuteur sur une tâche. Touche son titre pour la modifier.',
      g_inbox: 'Inbox', g_inbox_d: 'Une pensée parasite pendant une session ? Garde-la ici et trie-la plus tard : tâche, note, ou à oublier.',
      g_day: 'Journée', g_day_d: 'Place tes tâches sur la journée, ou laisse Auto-planifier trouver les créneaux libres.',
      g_cal: 'Agenda', g_cal_d: 'Tes événements et échéances, avec un calendrier externe si tu veux.',
      g_mail: 'Mails', g_mail_d: 'Une tâche peut porter un mail écrit à l’avance. Il s’ouvre prêt à partir dans ta messagerie.',
      g_notes: 'Carnet', g_notes_d: 'Une page par jour et tes pages libres, avec des formules de maths.',
      g_lib: 'Bibliothèque', g_lib_d: 'Importe tes PDF, lis-les, surligne et fais-en des cartes. Premium.',
      g_cards: 'Cartes', g_cards_d: 'Flashcards à répétition espacée, quiz et import depuis un fichier. Ici aussi : recherche, traduction et outils. Premium.',
      g_subjects: 'Matières', g_subjects_d: 'Tes matières, liées aux tâches et aux paquets, avec le temps passé sur chacune.',
      g_exams: 'Examens', g_exams_d: 'Ajoute une date : elle va dans l’Agenda et un compte à rebours s’affiche sous l’énergie. Avec Premium, les révisions espacées se placent seules.',
      g_grades: 'Notes', g_grades_d: 'Tes notes et coefficients, ta moyenne, et la note qu’il te faut au prochain contrôle pour atteindre ton objectif.',
      g_lectures: 'Cours enregistrés', g_lectures_d: 'Enregistre un cours en prenant tes notes. Touche une note pour réentendre ce moment. L’audio reste sur l’appareil. Premium.', tip_lectures: 'Lance l’enregistrement et écris tes notes : chacune garde son moment.',
      g_mock: 'Examen blanc', g_mock_d: 'Dans Matières : un examen chronométré tiré de tes cartes et de tes documents, avec le score par source. Premium.',
      g_exped: 'Expéditions', g_exped_d: 'Une journée de focus envoie ton familier explorer. Il revient le lendemain avec un objet qui meuble un étage.',
      g_season: 'Saison', g_season_d: 'Chaque semestre a sa tour. Chaque examen passé y ajoute une aile, et tu peux en faire une image de bilan.',
      g_learn: 'Apprendre', g_learn_d: 'Des méthodes courtes, classées par situation, avec leur niveau de preuve.',
      g_grim: 'Grimoire', g_grim_d: 'Tes statistiques, ta série, tes succès et ta progression de Séquence.',
      g_tower: 'Tour', g_tower_d: 'Chaque session d’au moins 15 min ajoute un étage. Abandonner avant la moitié en fait tomber un.',
      g_boss: 'Boss de la semaine', g_boss_d: 'Marque ta plus grosse tâche comme boss dans sa fiche. Une barre de vie apparaît sous le minuteur.',
      g_room: 'Salle', g_room_d: 'Étudie à plusieurs avec un code : minuteur commun, tâches communes et lien d’appel. Avec un compte.',
      g_roomchat: 'Chat et documents de salle', g_roomchat_d: 'Un chat qui peut attendre la pause, des liens épinglés, un paquet ou une note à copier en un tap, une note commune et un récap en fin de session.',
      g_shop: 'Boutique', g_shop_d: 'Dépense ton or : mondes, cadrans, familiers et potions.',
      g_worlds: 'Mondes', g_worlds_d: 'Chaque énergie a trois mondes : jour, nuit et clair (Premium).',
      g_sync: 'Compte et synchro', g_sync_d: 'Avec un compte, tes données te suivent sur tous tes appareils.',
      tip_plan: 'Tes tâches du jour. Lock in lance le minuteur sur l’une d’elles.', tip_day: 'Place tes tâches sur la journée, ou touche Auto-planifier.', tip_cal: 'Événements et échéances. Un jour touché ouvre son détail.', tip_notes: 'Une page par jour et tes pages libres.', tip_lib: 'Importe un PDF, surligne, transforme en cartes.', tip_study: 'Crée un paquet ou importe un fichier, puis révise un peu chaque jour.', tip_subjects: 'Ajoute tes matières et tes examens : le temps, les notes et le compte à rebours s’y retrouvent.', tip_learn: 'Des méthodes courtes selon ce qui te bloque.', tip_grim: 'Tes statistiques et ta progression.', tip_room: 'Crée une salle et partage le code pour étudier à plusieurs.',
    },
    en: {
      g_tree: 'Tree', g_tree_d: 'A branch per week, a flower per Flow session, roots if the Health check is on. Other trees unlock as you work in a world.', g_fc: 'Focus', g_fc_d: 'Flow sessions and their bonus, your focus span, and comebacks after a gap. Pick Calm or Lively at the bottom of the page.', g_stuck: 'I can’t start', g_stuck_d: 'Under Lock in: write the smallest step, take a 2-minute timer, and you can stop afterwards.', g_pd: 'Periods', g_pd_d: 'Term, Exams, Light and Holidays set the day’s goal and the blocking. Exams turns on by itself before an exam. On Holidays your streak is frozen.', g_scr: 'Screen time', g_scr_d: 'Time per site and scheduled blocking in the extension, pause screen, if-then plans and urge timer. On a phone, a number to type and a pause to set up in Shortcuts.', g_hl: 'Health', g_hl_d: 'A 20-second check you turn on yourself. It compares your days and stays on the device.',
      g_ksearch: 'Search', g_ksearch_d: 'Ctrl K on a computer, the magnifier on a phone. Finds a section, a task, a note or a deck, and runs actions: "25 min", "add revise law tomorrow".', g_sess: 'Session mode', g_sess_d: 'During a Lock in, the screen keeps the time, the task and the course tools. Everything comes back at the end. Turn it off in Settings.', g_gest: 'Gestures', g_gest_d: 'On a phone: swipe a task right to complete it, left to Lock in, press and hold to move it. From the edge of the screen, swipe to change space. Pull the dial down to close it.',
      tab_guide: 'Guide', gd_search: 'Search for a feature', gd_new_h: 'New since your last visit', gd_seen: 'Got it', gd_show: 'Show me', gd_new: 'New', gd_none: 'Nothing matches this search.', gd_all: 'All', gd_g_timer: 'Timer', gd_g_work: 'Planning', gd_g_study: 'Study', gd_g_you: 'You',
      tip_ok: 'Got it', tip_guide: 'Open the guide',
      g_energy: 'Energy', g_energy_d: 'Each day, pick your energy: it changes the world, the session length and the task order.',
      g_timer: 'Timer', g_timer_d: 'Pick a length and press Lock in. At the end: XP, gold and a new floor on your tower.',
      g_deep: 'Full screen', g_deep_d: 'The four-corners button hides everything but the time and your task.',
      g_sound: 'Sound', g_sound_d: 'Music and ambiences made in the app. Under the timer on a computer, in Quick tools on a phone.',
      g_quick: 'Quick tools', g_quick_d: 'Inbox, note, translate and calculator without changing tab. The handle on the right on a computer, the top button on a phone.',
      g_plan: 'Plan', g_plan_d: 'Your tasks, sorted by your energy. Lock in starts the timer on a task. Tap its title to edit it.',
      g_inbox: 'Inbox', g_inbox_d: 'A stray thought during a session? Keep it here and sort it later: task, note or let go.',
      g_day: 'Day', g_day_d: 'Place your tasks on the day, or let Auto-plan find the free slots.',
      g_cal: 'Calendar', g_cal_d: 'Your events and deadlines, with an outside calendar if you want.',
      g_mail: 'Emails', g_mail_d: 'A task can carry an email written in advance. It opens ready to send in your mail app.',
      g_notes: 'Notes', g_notes_d: 'One page per day and your free pages, with math formulas.',
      g_lib: 'Library', g_lib_d: 'Import your PDFs, read, highlight and turn them into cards. Premium.',
      g_cards: 'Cards', g_cards_d: 'Spaced-repetition flashcards, quizzes and file import. Also here: search, translate and tools. Premium.',
      g_subjects: 'Subjects', g_subjects_d: 'Your subjects, linked to tasks and decks, with the time spent on each.',
      g_exams: 'Exams', g_exams_d: 'Add a date: it goes in the Calendar and a countdown shows under the energy. With Premium, spaced revision places itself.',
      g_grades: 'Grades', g_grades_d: 'Your grades and weights, your average, and the mark you need on the next test to reach your target.',
      g_lectures: 'Recorded lectures', g_lectures_d: 'Record a class while taking notes. Tap a note to hear that moment again. The audio stays on the device. Premium.', tip_lectures: 'Start recording and type your notes: each one keeps its moment.',
      g_mock: 'Mock exam', g_mock_d: 'In Subjects: a timed exam drawn from your cards and documents, with the score per source. Premium.',
      g_exped: 'Expeditions', g_exped_d: 'A day of focus sends your familiar exploring. It comes back the next day with an object that furnishes a floor.',
      g_season: 'Season', g_season_d: 'Each semester has its own tower. Each exam passed adds a wing, and you can make a recap picture of it.',
      g_learn: 'Learn', g_learn_d: 'Short methods by situation, with how strong the evidence is.',
      g_grim: 'Grimoire', g_grim_d: 'Your stats, streak, achievements and Sequence progress.',
      g_tower: 'Tower', g_tower_d: 'Each session of at least 15 min adds a floor. Quitting before halfway knocks one down.',
      g_boss: 'Weekly boss', g_boss_d: 'Mark your biggest task as the boss in its details. A health bar shows under the timer.',
      g_room: 'Room', g_room_d: 'Study together with a code: shared timer, shared tasks and a call link. With an account.',
      g_roomchat: 'Room chat and documents', g_roomchat_d: 'A chat that can wait for the break, pinned links, a deck or a note to copy in one tap, one shared note and a recap at the end of a session.',
      g_shop: 'Shop',g_shop_d: 'Spend your gold: worlds, dials, familiars and potions.',
      g_worlds: 'Worlds', g_worlds_d: 'Each energy has three worlds: day, night and light (Premium).',
      g_sync: 'Account and sync', g_sync_d: 'With an account, your data follows you on all your devices.',
      tip_plan: 'Your tasks for today. Lock in starts the timer on one of them.', tip_day: 'Place your tasks on the day, or tap Auto-plan.', tip_cal: 'Events and deadlines. Tap a day to see its details.', tip_notes: 'One page per day and your free pages.', tip_lib: 'Import a PDF, highlight, turn it into cards.', tip_study: 'Create a deck or import a file, then review a little every day.', tip_subjects: 'Add your subjects and exams: time, grades and the countdown all live here.', tip_learn: 'Short methods for whatever is blocking you.', tip_grim: 'Your stats and progress.', tip_room: 'Create a room and share the code to study together.',
    },
  });
  ML.defaults(() => ({ guide: { seen: null, tips: {} } }));

  const G = () => S.guide;
  const newer = (a, b) => { const [x, y] = [a, b].map(v => String(v || '0').split('.').map(Number)); return x[0] - y[0] || (x[1] || 0) - (y[1] || 0); };
  // The first launch has nothing "new": everything is. A device from before the Guide came sees what 3.58 brought.
  const seen = () => G().seen || (S.onboarded ? '3.57' : VERSION);
  const isNew = x => newer(x.since, seen()) > 0;
  let q = '', group = '';

  function go(x) {
    if (x === 'shop') return ML.openShop();
    if (x === 'settings') return $('settings-btn').click();
    if (x === 'worlds') return ML.openWorlds && ML.openWorlds();
    if (x === 'energy') return ML.energyPicker.open({ cancellable: true });
    if (x === 'quick') return ML.quickTools.open();
    if (x === 'search') return ML.openSearch();
    ML.setMobileView(x);
  }
  ML.GUIDE = GUIDE; ML.guideGo = go; // the search bar (search.js) offers every feature
  const itemHtml = x => `<li class="gd-item"><div><b>${esc(t('g_' + x.id))}</b>${isNew(x) ? `<span class="gd-new">${esc(t('gd_new'))}</span>` : ''}<p>${esc(t('g_' + x.id + '_d'))}</p></div><button type="button" class="small" data-gd-go="${x.go}">${esc(t('gd_show'))}</button></li>`;
  function listHtml() {
    const n = q.trim().toLowerCase(), rows = GUIDE.filter(x => (!group || x.group === group) && (!n || (t('g_' + x.id) + ' ' + t('g_' + x.id + '_d')).toLowerCase().includes(n)));
    return rows.length ? `<ul class="gd-list">${rows.map(itemHtml).join('')}</ul>` : `<p class="hint">${esc(t('gd_none'))}</p>`;
  }
  function render() {
    const root = $('guide'); if (!root) return;
    const fresh = GUIDE.filter(isNew);
    root.innerHTML = `<div class="gd">
      ${fresh.length ? `<div class="g-card gd-whatsnew"><div class="gd-top"><h2>${esc(t('gd_new_h'))}</h2><button type="button" class="small ghost" data-gd-seen>${esc(t('gd_seen'))}</button></div><ul class="gd-list">${fresh.map(itemHtml).join('')}</ul></div>` : ''}
      <input type="search" id="gd-q" value="${esc(q)}" placeholder="${esc(t('gd_search'))}" aria-label="${esc(t('gd_search'))}">
      <div class="sub-chips" role="group">${['', 'timer', 'work', 'study', 'you'].map(g => `<button type="button" class="chip-btn" data-gd-g="${g}" aria-pressed="${group === g}">${esc(t(g ? 'gd_g_' + g : 'gd_all'))}</button>`).join('')}</div>
      <div id="gd-list">${listHtml()}</div></div>`;
  }
  const root = $('guide');
  root.addEventListener('input', e => { if (e.target.id === 'gd-q') { q = e.target.value; $('gd-list').innerHTML = listHtml(); } });
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.gdGo) go(b.dataset.gdGo);
    else if (b.hasAttribute('data-gd-seen')) { G().seen = VERSION; save(); render(); }
    else if (b.dataset.gdG !== undefined) { group = b.dataset.gdG; render(); }
  });

  /* ---------- First-visit tips ---------- */
  function showTip(tab) {
    document.querySelectorAll('.tip-card').forEach(x => x.remove());
    if (!S.onboarded || !TIPS.includes(tab) || G().tips[tab]) return;
    const panel = $('tab-' + tab); if (!panel) return;
    const c = document.createElement('div');
    c.className = 'tip-card'; c.setAttribute('role', 'note');
    c.innerHTML = `<p>${esc(t('tip_' + tab))}</p><div><button type="button" class="small" data-tip="ok">${esc(t('tip_ok'))}</button><button type="button" class="link" data-tip="guide">${esc(t('tip_guide'))}</button></div>`;
    c.addEventListener('click', e => {
      const b = e.target.closest('[data-tip]'); if (!b) return;
      G().tips = Object.assign({}, G().tips, { [tab]: 1 }); save(); c.remove();
      if (b.dataset.tip === 'guide') ML.setTab('guide');
    });
    panel.prepend(c);
  }

  on('tab', n => { if (n === 'guide') render(); showTip(n); });
  on('lang', () => { if (S.tab === 'guide') render(); showTip(S.tab); });
  on('started', () => { if (S.tab === 'guide') render(); showTip(S.tab); });
})();
