// Learn (3.56, proposals/plan-learn L1): short methods reached by what is hard right now, plus one suggestion for the day's
// energy. Free for everyone. Every sheet is written here from scratch: no text from a book or anyone's notes; an idea is
// credited and linked. Each one reads in 20 seconds and has a smallest step, a harder version, why, how sure we are and sources.
// Also the eye rest line (E1): off by default, turned on in Settings or during the first launch.
// 3.71 (proposals/sections L1–L3, PC-4): the suggestion open as a card with its reason from the app's data, the situations as a
// grid, the sheet as three numbered steps, "Did it help?" after a session started from a sheet (answers kept on this device, they
// order My methods); from 900 px the opened sheet sits beside the grid with previous / next.
(() => {
  'use strict';
  const { S, t, esc, save, on, $ } = ML;

  ML.addStrings({
    fr: {
      tab_learn: 'Apprendre', ln_sug: 'Suggéré pour {mood}', ln_q: 'Qu’est-ce qui coince ?', ln_all: 'Toutes les méthodes', ln_back: 'Retour',
      ln_small: 'Le plus petit pas', ln_hard: 'Plus dur', ln_why: 'Pourquoi', ln_src: 'Sources', ln_nosrc: 'Pas d’étude vérifiée ici : essaie, et garde si ça t’aide.',
      ln_foot: 'Sources vérifiées en octobre 2026. Ces fiches ne remplacent pas un avis médical.',
      ln_solid: 'Bien testé', ln_some: 'Quelques preuves', ln_mixed: 'Résultats partagés', ln_common: 'Pratique courante', ln_health: 'Santé',
      sit_start: 'Démarrer', sit_distract: 'Rester concentré', sit_stick: 'Retenir ce que je lis', sit_exam: 'Examen proche', sit_evening: 'Décrocher le soir', sit_eyes: 'Yeux fatigués',
      ln_n: '{n} méthodes', ln_n_one: '1 méthode', ln_normal: 'Normal', ln_steps: 'Étapes et pourquoi', ln_less: 'Moins', ln_of: '{i} sur {n}', ln_prev: 'Précédente', ln_next: 'Suivante',
      ln_exam: 'Ton examen', ln_r_exam: '« {name} » est dans {n} jours', ln_r_exam1: '« {name} » est demain', ln_r_exam0: '« {name} » est aujourd’hui', ln_r_inbox: '{n} pensées attendent dans À trier', ln_r_late: 'Il est plus de 21 h',
      ln_ask: 'Session finie. « {m} » t’a aidé ?', ln_yes: 'Oui', ln_notreally: 'Pas vraiment', ln_skip: 'Passer', ln_answer: 'Répondre', ln_noted: 'Noté. Mes méthodes en tient compte.', ln_helped: 'A aidé {y} fois sur {n}',
      ln_open_cards: 'Ouvrir les flashcards', ln_open_day: 'Ouvrir Journée', ln_open_room: 'Ouvrir Rooms', ln_open_prep: 'Préparer ma journée',
      ln_mine: 'Mes méthodes', ln_keep: 'Garder', ln_kept: 'Gardée', ln_add: 'Ajouter au Plan', ln_added: 'Ajoutée à aujourd’hui dans le Plan.',
      eye_opt: 'Rappel pour reposer les yeux, toutes les 20 min', eye_hint: 'Une ligne discrète sous le cadran pendant le focus, sans son. Elle repart seule au bout d’une minute.', eye_set: 'Yeux',
      eye_line: 'Regarde au loin 20 s', eye_hide: 'Masquer', eye_on: 'Activer le rappel', eye_off: 'Désactiver le rappel',
    },
    en: {
      tab_learn: 'Learn', ln_sug: 'Suggested for {mood}', ln_q: 'What’s hard right now?', ln_all: 'All methods', ln_back: 'Back',
      ln_small: 'Smallest step', ln_hard: 'Harder', ln_why: 'Why', ln_src: 'Sources', ln_nosrc: 'No study checked for this: try it, and keep it if it helps.',
      ln_foot: 'Sources checked in October 2026. These sheets don’t replace medical advice.',
      ln_solid: 'Well tested', ln_some: 'Some evidence', ln_mixed: 'Mixed results', ln_common: 'Common practice', ln_health: 'Health',
      sit_start: 'Get started', sit_distract: 'Stay focused', sit_stick: 'Remember what I read', sit_exam: 'Exam soon', sit_evening: 'Switch off tonight', sit_eyes: 'Tired eyes',
      ln_n: '{n} methods', ln_n_one: '1 method', ln_normal: 'Normal', ln_steps: 'Steps and why', ln_less: 'Less', ln_of: '{i} of {n}', ln_prev: 'Previous', ln_next: 'Next',
      ln_exam: 'Your exam', ln_r_exam: '"{name}" is in {n} days', ln_r_exam1: '"{name}" is tomorrow', ln_r_exam0: '"{name}" is today', ln_r_inbox: '{n} thoughts are waiting in Inbox', ln_r_late: 'It’s after 9 pm',
      ln_ask: 'Session done. Did "{m}" help?', ln_yes: 'Yes', ln_notreally: 'Not really', ln_skip: 'Skip', ln_answer: 'Answer', ln_noted: 'Noted. My methods takes it into account.', ln_helped: 'Helped {y} times out of {n}',
      ln_open_cards: 'Open flashcards', ln_open_day: 'Open Day', ln_open_room: 'Open Rooms', ln_open_prep: 'Plan my day',
      ln_mine: 'My methods', ln_keep: 'Keep', ln_kept: 'Kept', ln_add: 'Add to Plan', ln_added: 'Added to today in the Plan.',
      eye_opt: 'Eye rest reminder, every 20 min', eye_hint: 'A quiet line under the dial during focus, no sound. It leaves on its own after a minute.', eye_set: 'Eyes',
      eye_line: 'Look far away for 20 s', eye_hide: 'Hide', eye_on: 'Turn the reminder on', eye_off: 'Turn the reminder off',
    },
  });
  ML.defaults(() => ({ eyes: { on: false }, learn: { kept: [] } }));

  const SRC = {
    dunlosky: ['Dunlosky et al., 2013', 'https://doi.org/10.1177/1529100612453266'],
    gollwitzer: ['Gollwitzer & Sheeran, 2006', 'https://www.socmot.uni-konstanz.de/publications/implementation-intentions-and-goal-achievement-meta-analysis-effects-and-processes'],
    masicampo: ['Masicampo & Baumeister, 2011', 'https://doi.org/10.1037/a0024192'],
    newport: ['Cal Newport, Deep Work', 'https://www.hachettebookgroup.com/titles/cal-newport/deep-work/9781455586677/'],
    loci: ['Method of loci, review, 2025', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12514325/'],
    newbury: ['Newbury et al., 2021', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8893218/'],
    talens: ['Talens-Estarelles et al., 2023', 'https://www.insightnews.com.au/does-the-20-20-20-rule-work-for-digital-eye-strain/'],
    johnson: ['Johnson & Rosenfield', 'https://www.reviewofoptometry.com/news/article/202020-still-not-enough-to-alleviate-eye-strain'],
    myopia: ['20-20-20 and myopia', 'https://www.myopiaprofile.com/articles/is-the-20-20-rule-effective-myopia'],
    outdoors: ['Time outdoors and myopia, overview', 'https://research.aston.ac.uk/en/publications/physical-activity-time-spent-outdoors-and-near-work-in-relation-t/'],
  };

  // lv: how sure we are. sit: the situations it answers. go: what "try it" does in the app.
  const SHEETS = [
    { id: 'start5', lv: 'common', sit: ['start'], go: { focus: 5, en: 'Start 5 minutes', fr: 'Lancer 5 minutes', task: { en: 'Just start', fr: 'Juste commencer' } },
      en: { t: 'Start with 5 minutes', do: 'Pick the easiest part and work on it for 5 minutes. You may stop after that.', small: 'Open the file and write one line.', hard: 'When the 5 minutes end, start 15 more.', why: 'Starting is often the hardest part. A short session asks for little, so it is easier to say yes.' },
      fr: { t: 'Commence par 5 minutes', do: 'Prends la partie la plus facile et travaille dessus 5 minutes. Tu as le droit d’arrêter ensuite.', small: 'Ouvre le fichier et écris une ligne.', hard: 'À la fin des 5 minutes, relance-en 15.', why: 'Démarrer est souvent le plus dur. Une session courte demande peu, alors il est plus facile de dire oui.' } },
    { id: 'ifthen', lv: 'some', sit: ['start'], src: ['gollwitzer'], go: { tab: 'day', en: 'Open Day', fr: 'Ouvrir Journée' },
      en: { t: 'Decide when and where', do: 'Finish this sentence: "If it is 5 pm and I am at my desk, I open chapter 4."', small: 'Write one sentence for tomorrow’s first task.', hard: 'Add a second one for what usually stops you: "If I reach for my phone, I put it in the next room."', why: 'A review of 94 tests found that people who plan the moment and the action reach their goals more often than people who only state the goal. The effect grows when the plan really is "if this, then that".' },
      fr: { t: 'Décide quand et où', do: 'Termine cette phrase : « S’il est 17 h et que je suis à mon bureau, j’ouvre le chapitre 4. »', small: 'Écris une phrase pour la première tâche de demain.', hard: 'Ajoute-en une pour ce qui t’arrête d’habitude : « Si je prends mon téléphone, je le pose dans l’autre pièce. »', why: 'Une revue de 94 tests montre que prévoir le moment et l’action aide davantage à atteindre un objectif que le simple fait de l’annoncer. L’effet est plus fort quand le plan a vraiment la forme « si ceci, alors cela ».' } },
    { id: 'sprint', lv: 'common', sit: ['start', 'distract'], src: ['newport'], go: { focus: 20, en: 'Start 20 minutes', fr: 'Lancer 20 minutes', task: { en: 'Timed sprint', fr: 'Sprint chronométré' } },
      en: { t: 'Race a short deadline', do: 'Guess how long a task takes, then give yourself a bit less. Keep the timer in view and nothing else open.', small: 'Take 5 minutes off your guess.', hard: 'Try half your guess, once a week, on a task you know well.', why: 'A close deadline leaves little room for wandering. Keep it reachable: a deadline you always miss only discourages. Idea popularised by Cal Newport.' },
      fr: { t: 'Fais la course contre une échéance courte', do: 'Estime la durée d’une tâche, puis donne-toi un peu moins. Garde le minuteur en vue, et rien d’autre d’ouvert.', small: 'Retire 5 minutes à ton estimation.', hard: 'Essaie la moitié de ton estimation, une fois par semaine, sur une tâche que tu connais bien.', why: 'Une échéance proche laisse peu de place pour divaguer. Garde-la tenable : une échéance toujours ratée décourage. Idée popularisée par Cal Newport.' } },
    { id: 'parkit', lv: 'common', sit: ['distract'], go: { focus: 20, en: 'Start 20 minutes', fr: 'Lancer 20 minutes', task: { en: 'Focus and park the rest', fr: 'Focus, le reste au parking' } },
      en: { t: 'Write the stray thought down', do: 'When a thought pulls you away, type it in the Park field under the dial and go back. You will find it in Inbox.', small: 'Park a single thought in your next session.', hard: 'Sort your Inbox at the end of each day.', why: 'You don’t have to act on the thought or fight to remember it, and it costs a few seconds.' },
      fr: { t: 'Écris la pensée qui passe', do: 'Quand une pensée t’éloigne, écris-la dans le champ Parquer sous le cadran et reviens à ta tâche. Tu la retrouves dans À trier.', small: 'Parque une seule pensée à ta prochaine session.', hard: 'Trie À trier à la fin de chaque journée.', why: 'Tu n’as ni à agir sur cette pensée ni à lutter pour t’en souvenir, et ça prend quelques secondes.' } },
    { id: 'phone', lv: 'common', sit: ['distract'], go: { focus: 20, en: 'Start 20 minutes', fr: 'Lancer 20 minutes', task: { en: 'Phone in the other room', fr: 'Téléphone dans l’autre pièce' } },
      en: { t: 'Put your phone out of reach', do: 'Before you start, put your phone in another room or a bag you have to get up to open.', small: 'Face down, notifications off, for one session.', hard: 'Choose set times to check it, and wait until then.', why: 'The more steps between you and the phone, the more time you have to notice the urge and let it pass. It costs nothing to try.' },
      fr: { t: 'Mets ton téléphone hors de portée', do: 'Avant de commencer, pose ton téléphone dans une autre pièce ou dans un sac qu’il faut se lever pour ouvrir.', small: 'Écran contre la table, notifications coupées, pour une session.', hard: 'Choisis des heures pour le regarder, et attends-les.', why: 'Plus il y a d’étapes jusqu’au téléphone, plus tu as le temps de voir l’envie et de la laisser passer. Essayer ne coûte rien.' } },
    { id: 'room', lv: 'common', sit: ['start', 'distract'], go: { tool: 'room', en: 'Open Rooms', fr: 'Ouvrir Rooms' },
      en: { t: 'Work with someone else there', do: 'Sit with a friend, in a library or in a room in the app. Each of you works on your own thing.', small: 'One shared session this week.', hard: 'Set a regular time with one person.', why: 'Many people find it easier to stay on task with someone present. There is little research on it so far.' },
      fr: { t: 'Travaille avec quelqu’un à côté', do: 'Installe-toi avec un ami, en bibliothèque ou dans une room de l’app. Chacun travaille sur ce qui le concerne.', small: 'Une session partagée cette semaine.', hard: 'Fixe un créneau régulier avec une personne.', why: 'Beaucoup de gens restent plus facilement sur leur tâche quand quelqu’un est là. La recherche sur le sujet reste rare.' } },
    { id: 'test', lv: 'solid', sit: ['stick', 'exam'], src: ['dunlosky'], go: { focus: 10, en: 'Start 10 minutes', fr: 'Lancer 10 minutes', task: { en: 'Recall from memory', fr: 'Retrouver de mémoire' }, tool: 'cards', toolEn: 'Open flashcards', toolFr: 'Ouvrir les flashcards' },
      en: { t: 'Test yourself instead of rereading', do: 'Close the page and write what you remember. Then check, and look again only at what you missed.', small: 'Answer one question from memory, 2 minutes.', hard: 'Recall a whole chapter on a blank page, then again 3 days later.', why: 'Trying to remember strengthens memory more than reading again. It was one of only two techniques rated high in a large review of study methods.' },
      fr: { t: 'Teste-toi au lieu de relire', do: 'Ferme la page et écris ce dont tu te souviens. Vérifie ensuite, et ne reprends que ce qui manquait.', small: 'Réponds de mémoire à une question, 2 minutes.', hard: 'Restitue tout un chapitre sur une page blanche, puis recommence 3 jours plus tard.', why: 'Chercher à se souvenir renforce davantage la mémoire que relire. C’est l’une des deux seules techniques notées haut dans une grande revue des méthodes d’étude.' } },
    { id: 'space', lv: 'solid', sit: ['stick', 'exam'], src: ['dunlosky'], go: { tab: 'day', en: 'Open Day', fr: 'Ouvrir Journée', tool: 'cards', toolEn: 'Open flashcards', toolFr: 'Ouvrir les flashcards' },
      en: { t: 'Space out your reviews', do: 'Split your revision over several days instead of one long block. Come back to a topic just as it starts to fade.', small: 'Review yesterday’s lesson for 10 minutes.', hard: 'Plan reviews after 1, 3 and 7 days for each chapter.', why: 'The same hours spread over several days hold up better than one long block. This is the other technique rated high in that review.' },
      fr: { t: 'Espace tes révisions', do: 'Répartis tes révisions sur plusieurs jours plutôt qu’en un long bloc. Reviens sur un sujet quand il commence à s’effacer.', small: 'Revois le cours d’hier pendant 10 minutes.', hard: 'Prévois des révisions à 1, 3 et 7 jours pour chaque chapitre.', why: 'Les mêmes heures réparties sur plusieurs jours tiennent mieux qu’un long bloc. C’est l’autre technique notée haut dans cette revue.' } },
    { id: 'reread', lv: 'solid', sit: ['stick'], src: ['dunlosky'], go: { lib: 1, en: 'Open Library', fr: 'Ouvrir la bibliothèque' },
      en: { t: 'Rereading and highlighting do little', do: 'Keep them for a first pass. Then close the text and ask yourself what it said.', small: 'After each page, say one idea out loud.', hard: 'Turn what you would highlight into questions.', why: 'They feel productive because the text becomes familiar, but the same review rated them low.' },
      fr: { t: 'Relire et surligner apportent peu', do: 'Garde-les pour une première lecture. Ferme ensuite le texte et demande-toi ce qu’il disait.', small: 'Après chaque page, dis une idée à voix haute.', hard: 'Transforme ce que tu surlignerais en questions.', why: 'On a l’impression d’avancer parce que le texte devient familier, mais la même revue les note bas.' } },
    { id: 'explain', lv: 'some', sit: ['stick'], src: ['dunlosky'], go: { focus: 10, en: 'Start 10 minutes', fr: 'Lancer 10 minutes', task: { en: 'Explain it in my own words', fr: 'Expliquer avec mes mots' } },
      en: { t: 'Explain it in your own words', do: 'After a section, explain why it works as if to a friend. The places where you get stuck are what to review.', small: 'One sentence: "This works because…"', hard: 'Explain a whole chapter to someone without notes.', why: 'Explaining forces you to link ideas together and shows you what you don’t know. The review rated it moderate.' },
      fr: { t: 'Explique avec tes mots', do: 'Après une partie, explique pourquoi ça marche comme à un ami. Là où tu bloques, il faut revoir.', small: 'Une phrase : « Ça marche parce que… »', hard: 'Explique tout un chapitre à quelqu’un, sans notes.', why: 'Expliquer oblige à relier les idées et montre ce que tu ne sais pas. La revue lui donne une note moyenne.' } },
    { id: 'mix', lv: 'some', sit: ['stick', 'exam'], src: ['dunlosky'], go: { focus: 25, en: 'Start 25 minutes', fr: 'Lancer 25 minutes', task: { en: 'Mixed practice', fr: 'Exercices mélangés' } },
      en: { t: 'Mix topics when you practise', do: 'Alternate exercise types instead of doing ten of the same in a row. It feels harder, and that is normal.', small: 'Add one exercise from another chapter.', hard: 'Make a mixed exam sheet from several chapters.', why: 'You practise choosing the right method, as in a real exam. The review rated it moderate, with the clearest results in maths.' },
      fr: { t: 'Mélange les sujets quand tu t’entraînes', do: 'Alterne les types d’exercices au lieu d’en faire dix pareils d’affilée. Ça paraît plus dur, c’est normal.', small: 'Ajoute un exercice d’un autre chapitre.', hard: 'Fais-toi un sujet d’examen mélangé sur plusieurs chapitres.', why: 'Tu t’entraînes à choisir la bonne méthode, comme le jour de l’examen. La revue lui donne une note moyenne, avec les résultats les plus nets en maths.' } },
    { id: 'loci', lv: 'some', sit: ['exam'], src: ['loci'], go: { focus: 10, en: 'Start 10 minutes', fr: 'Lancer 10 minutes', task: { en: 'Memory route', fr: 'Parcours de mémoire' } },
      en: { t: 'Walk a route to remember a list', do: 'Picture a walk through your home. Place one item in each spot, as a strange or funny scene. To recall, walk it again.', small: '5 items, 5 spots in one room.', hard: 'A route of 20 spots for a whole list of terms.', why: 'Reviews find a clear gain for lists in adults. It is made for ordered lists, and it does not replace understanding.' },
      fr: { t: 'Fais un parcours pour retenir une liste', do: 'Imagine un trajet dans ton logement. Place un élément à chaque endroit, dans une scène bizarre ou drôle. Pour retrouver la liste, refais le trajet.', small: '5 éléments, 5 endroits dans une pièce.', hard: 'Un parcours de 20 endroits pour toute une liste de termes.', why: 'Les revues trouvent un gain net pour les listes chez les adultes. La méthode sert aux listes ordonnées et ne remplace pas la compréhension.' } },
    { id: 'sleep', lv: 'solid', sit: ['exam', 'evening'], src: ['newbury'], go: {},
      en: { t: 'Keep your night before the exam', do: 'Stop revising early enough to sleep a normal night. Keep the last hour for something light.', small: 'Set a time to stop tonight.', hard: 'Plan your revision so the last evening holds no new material.', why: 'A full night awake harms memory, whether it comes before or after learning. These studies tested complete nights without sleep, not every short night.' },
      fr: { t: 'Garde ta nuit avant l’examen', do: 'Arrête de réviser assez tôt pour dormir une nuit normale. Garde la dernière heure pour quelque chose de léger.', small: 'Fixe une heure d’arrêt ce soir.', hard: 'Organise tes révisions pour ne rien voir de nouveau le dernier soir.', why: 'Une nuit blanche nuit à la mémoire, qu’elle ait lieu avant ou après l’apprentissage. Ces études portent sur des nuits entières sans sommeil, pas sur toutes les nuits courtes.' } },
    { id: 'close', lv: 'some', sit: ['evening'], src: ['masicampo', 'newport'], go: { prep: 1, en: 'Plan my day', fr: 'Préparer ma journée' },
      en: { t: 'Close your day with a plan', do: 'Take 10 minutes: note what is unfinished, check the next few days, and choose tomorrow’s first task. Then you’re done.', small: 'Write tomorrow’s first task.', hard: 'Do it every evening at the same time, ending with a set phrase.', why: 'In experiments, writing a specific plan for an unfinished goal reduced the thoughts that kept coming back. The ritual was popularised by Cal Newport.' },
      fr: { t: 'Termine ta journée avec un plan', do: 'Prends 10 minutes : note ce qui n’est pas fini, regarde les prochains jours et choisis la première tâche de demain. Ensuite, c’est fini.', small: 'Écris la première tâche de demain.', hard: 'Fais-le chaque soir à la même heure, et termine par une phrase fixe.', why: 'Dans des expériences, écrire un plan précis pour un objectif inachevé a réduit les pensées qui revenaient. Le rituel a été popularisé par Cal Newport.' } },
    { id: 'eyes', lv: 'mixed', sit: ['eyes'], src: ['talens', 'johnson', 'myopia'], go: { eyes: 1 },
      en: { t: 'Rest your eyes', do: 'Every 20 minutes, look at something far away for 20 seconds. The reminder is off until you turn it on.', small: 'Do it once at each break.', hard: 'Take a real break away from screens every hour.', why: 'One small study found less eye strain while people used reminders, and the gain faded after they stopped. Another found no benefit from 20-second breaks. Nothing solid shows that it slows myopia.' },
      fr: { t: 'Repose tes yeux', do: 'Toutes les 20 minutes, regarde quelque chose de loin pendant 20 secondes. Le rappel reste éteint tant que tu ne l’actives pas.', small: 'Fais-le une fois à chaque pause.', hard: 'Fais une vraie pause sans écran toutes les heures.', why: 'Une petite étude a vu moins de fatigue visuelle pendant l’usage des rappels, puis le gain a disparu après leur arrêt. Une autre n’a trouvé aucun bénéfice avec des pauses de 20 secondes. Rien de solide ne montre que cela freine la myopie.' } },
    { id: 'outside', lv: 'some', sit: ['eyes'], src: ['outdoors'], go: {},
      en: { t: 'Spend time outside', do: 'Take your break outdoors when you can, in daylight.', small: 'One break outside today.', hard: 'Walk outside for part of each day.', why: 'In children, time outdoors is linked with less myopia appearing, but not with slower progress once it has started. There is less data on adults.' },
      fr: { t: 'Passe du temps dehors', do: 'Prends ta pause dehors quand tu peux, à la lumière du jour.', small: 'Une pause dehors aujourd’hui.', hard: 'Marche dehors une partie de chaque journée.', why: 'Chez les enfants, le temps dehors est associé à moins d’apparitions de myopie, mais pas à une progression plus lente une fois qu’elle a commencé. Il y a moins de données chez les adultes.' } },
    { id: 'help', lv: 'health', sit: ['start', 'distract', 'eyes'], go: {},
      en: { t: 'When it gets in the way of everything', do: 'If attention, sleep, mood or blurred vision trouble you for weeks, talk to a doctor. Start with your GP or your school’s health service.', why: 'These methods help with everyday difficulties. They can’t tell you what is causing a problem, and this app makes no diagnosis.' },
      fr: { t: 'Quand ça gêne tout le reste', do: 'Si l’attention, le sommeil, le moral ou une vue floue te gênent depuis des semaines, parles-en à un médecin. Commence par ton médecin traitant ou le service de santé de ton école.', why: 'Ces méthodes aident pour les difficultés du quotidien. Elles ne peuvent pas dire d’où vient un problème, et cette app ne pose aucun diagnostic.' } },
  ];
  const SITS = ['start', 'distract', 'stick', 'exam', 'evening', 'eyes'];
  // One line icon per situation (L2), drawn in the text colour
  const SIT_ICO = {
    start: '<path d="M7 4.5l11 7.5-11 7.5z"/>',
    distract: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
    stick: '<path d="M4 6h10M4 12h16M4 18h8"/>',
    exam: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    evening: '<path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z"/>',
    eyes: '<path d="M2.5 12s3.8-6.5 9.5-6.5S21.5 12 21.5 12 17.7 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    all: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  };
  const FOR_MOOD = { drained: ['start5', 'ifthen', 'close', 'outside'], steady: ['ifthen', 'space', 'test', 'explain'], fired: ['test', 'mix', 'sprint', 'loci'], scattered: ['parkit', 'phone', 'start5', 'room'] };
  const byId = id => SHEETS.find(s => s.id === id);
  const daysTo = k => Math.round((ML.parseDay(k) - ML.parseDay(ML.today())) / 864e5);
  // The day's suggestion and why (L1): what the app knows first (an exam within 7 days, a full Inbox, the late hour), else the energy.
  // The energy pick changes once a day among the sheets for this energy, skipping the ones already kept.
  function suggested() {
    const h = new Date().getHours(), late = h >= 21 || h < 4;
    const ex = ((S.study && S.study.exams) || []).map(x => ({ x, d: x.date ? daysTo(x.date) : -1 })).filter(o => o.d >= 0 && o.d <= 7).sort((a, b) => a.d - b.d)[0];
    if (ex) {
      const name = ex.x.name || t('ln_exam');
      return { s: byId(ex.d <= 1 && h >= 20 ? 'sleep' : 'test'), why: t(ex.d === 0 ? 'ln_r_exam0' : ex.d === 1 ? 'ln_r_exam1' : 'ln_r_exam', { name, n: ex.d }) };
    }
    const parked = (S.parked || []).length;
    if (parked >= 6) return { s: byId('close'), why: t('ln_r_inbox', { n: parked }) };
    if (late) return { s: byId('close'), why: t('ln_r_late') };
    const all = FOR_MOOD[S.mood] || FOR_MOOD.steady, free = all.filter(id => !S.learn.kept.includes(id)), list = free.length ? free : all;
    return { s: byId(list[Math.floor(ML.parseDay(ML.today()).getTime() / 864e5) % list.length]), why: t('ln_sug', { mood: t('mood_' + S.mood) }) };
  }
  const lang = () => (S.lang === 'en' ? 'en' : 'fr');

  /* ---------- "Did it help?" (L3): kept on this device only, it orders My methods ---------- */
  const HKEY = () => 'mli-learn-help:' + ML.storageKey();
  function helpGet() { try { return JSON.parse(localStorage.getItem(HKEY()) || '{}') || {}; } catch (e) { return {}; } }
  function helpSet(h) { try { localStorage.setItem(HKEY(), JSON.stringify(h)); } catch (e) {} }
  const score = (h, id) => { const r = h[id]; return r ? (r.y || 0) - (r.n || 0) : 0; };
  // the question waits a day at most
  const askNow = () => { const h = helpGet(); return h._ask && Date.now() - h._ask.at < 864e5 && byId(h._ask.id) ? h._ask.id : null; };

  let sit = null, open = null, sugOpen = false; // the situation chosen ('all' for every sheet), the sheet opened, the suggestion's details shown
  const wideNow = () => { const r = $('learn'), w = r ? r.clientWidth : 0; return innerWidth >= 900 && (!w || w >= 600); };

  function goButtons(s, card) {
    const g = s.go || {}, L = lang(), label = g[L], out = [];
    if (g.focus) out.push(`<button type="button" class="primary small" data-ln-go="focus">${esc(label)}</button>`);
    else if (g.tab || g.lib || g.prep) out.push(`<button type="button" class="primary small" data-ln-go="${g.lib ? 'lib' : g.prep ? 'prep' : 'tab'}">${esc(label)}</button>`);
    else if (g.eyes) out.push(`<button type="button" class="primary small" data-ln-go="eyes">${esc(t(S.eyes.on ? 'eye_off' : 'eye_on'))}</button>`);
    // Flashcards and Rooms are Premium: the button only shows where it leads somewhere
    if (g.tool && ML.isPremium()) out.push(`<button type="button" class="${out.length ? 'small' : 'primary small'}" data-ln-go="tool">${esc(g.toolEn ? g[L === 'en' ? 'toolEn' : 'toolFr'] : label)}</button>`);
    if (s[L].small && !card) out.push(`<button type="button" class="small" data-ln-add>${esc(t('ln_add'))}</button>`);
    if (s.lv !== 'health') { const kept = S.learn.kept.includes(s.id); out.push(`<button type="button" class="ghost small" data-ln-keep aria-pressed="${kept}">${esc(t(kept ? 'ln_kept' : 'ln_keep'))}</button>`); }
    return out.length ? `<div class="ln-acts">${out.join('')}</div>` : '';
  }
  // Smallest step, the normal version, harder (L3): numbered because it is a real order
  function ladder(c) {
    if (!c.small) return `<p class="ln-do">${esc(c.do)}</p>`;
    const step = (n, k, txt, cls = '') => `<li class="${cls}"><b>${n}</b><span><small>${esc(t(k))}</small>${esc(txt)}</span></li>`;
    return `<ol class="ln-ladder">${step(1, 'ln_small', c.small)}${step(2, 'ln_normal', c.do, 'mid')}${step(3, 'ln_hard', c.hard)}</ol>`;
  }
  const srcHtml = s => (s.src ? `<div><span class="ln-k">${esc(t('ln_src'))}</span><ul class="ln-src">${s.src.map(k => `<li><a href="${esc(SRC[k][1])}" target="_blank" rel="noopener">${esc(SRC[k][0])}</a></li>`).join('')}</ul></div>` : s.lv === 'common' ? `<p class="ln-foot">${esc(t('ln_nosrc'))}</p>` : '');
  const bodyHtml = (s, card) => { const c = s[lang()]; return `${ladder(c)}<div><span class="ln-k">${esc(t('ln_why'))}</span><p class="ln-why">${esc(c.why)}</p></div>${srcHtml(s)}${card ? '' : goButtons(s)}`; };
  const helpedTxt = (h, id) => { const r = h[id]; return r && r.y ? t('ln_helped', { y: r.y, n: (r.y || 0) + (r.n || 0) }) : ''; };
  function sheetHtml(s, h) {
    const c = s[lang()], isOpen = open === s.id, hl = h ? helpedTxt(h, s.id) : '';
    return `<article class="ln-sheet ${isOpen ? 'open' : ''}" data-ln-id="${s.id}">
      <button type="button" class="ln-head" data-ln-open="${s.id}" aria-expanded="${isOpen}"><span>${esc(c.t)}${hl ? `<small>${esc(hl)}</small>` : ''}</span><span class="ln-pill ln-${s.lv}">${esc(t('ln_' + s.lv))}</span></button>
      ${isOpen ? `<div class="ln-body">${bodyHtml(s)}</div>` : ''}</article>`;
  }
  // The suggestion, open as a card with its reason (L1)
  function sugHtml(g) {
    const s = g.s, c = s[lang()], first = s.src ? SRC[s.src[0]][0] : '';
    return `<section class="ln-sug" data-ln-id="${s.id}" aria-label="${esc(g.why)}">
      <span class="ln-k">${esc(g.why)}</span>
      <h3 class="ln-sug-t">${esc(c.t)}</h3>
      ${sugOpen ? `<div class="ln-body ln-sug-body">${bodyHtml(s, true)}</div>` : `<p class="ln-do">${esc(c.do)}</p>`}
      ${goButtons(s, true)}
      <button type="button" class="ln-more" data-ln-sugmore aria-expanded="${sugOpen}"><span class="ln-${s.lv}">${esc(t('ln_' + s.lv))}</span>${first ? ` · ${esc(first)}` : ''} · ${esc(t(sugOpen ? 'ln_less' : 'ln_steps'))}</button></section>`;
  }
  function askHtml() {
    const id = askNow(); if (!id) return '';
    return `<section class="ln-ask"><b>${esc(t('ln_ask', { m: byId(id)[lang()].t }))}</b>
      <div class="ln-acts"><button type="button" class="small" data-ln-ans="y">${esc(t('ln_yes'))}</button><button type="button" class="small" data-ln-ans="n">${esc(t('ln_notreally'))}</button><button type="button" class="ghost small" data-ln-ans="skip">${esc(t('ln_skip'))}</button></div></section>`;
  }
  const sitList = k => (k === 'all' ? SHEETS : SHEETS.filter(s => s.sit.includes(k)));
  // The situations as a grid of cards (L2)
  function gridHtml() {
    const card = k => `<button type="button" class="ln-sit" data-ln-sit="${k}" aria-pressed="${sit === k}"><svg viewBox="0 0 24 24" aria-hidden="true">${SIT_ICO[k]}</svg><b>${esc(t(k === 'all' ? 'ln_all' : 'sit_' + k))}</b><small>${esc(ML.tn('ln_n', sitList(k).length))}</small></button>`;
    return `<div class="ln-gridw"><div class="ln-grid">${SITS.map(card).join('')}</div>
      <button type="button" class="ln-allbtn" data-ln-sit="all" aria-pressed="${sit === 'all'}"><svg viewBox="0 0 24 24" aria-hidden="true">${SIT_ICO.all}</svg><span>${esc(t('ln_all'))}</span><small>${SHEETS.length}</small></button></div>`;
  }
  // PC-4: the sheet opened beside the grid, with previous / next inside its situation
  function paneHtml() {
    const list = sitList(sit), i = Math.max(0, list.findIndex(s => s.id === open)), s = list[i], c = s[lang()];
    return `<article class="ln-pane" data-ln-id="${s.id}">
      <span class="ln-k">${esc(t(sit === 'all' ? 'ln_all' : 'sit_' + sit))} · ${esc(t('ln_of', { i: i + 1, n: list.length }))}</span>
      <div class="ln-pane-top"><h3 class="ln-sug-t">${esc(c.t)}</h3><span class="ln-pill ln-${s.lv}">${esc(t('ln_' + s.lv))}</span></div>
      <div class="ln-body">${bodyHtml(s)}</div>
      <div class="ln-nav"><button type="button" class="ghost small" data-ln-step="-1" ${i ? '' : 'disabled'}>‹ ${esc(t('ln_prev'))}</button><button type="button" class="ghost small" data-ln-step="1" ${i < list.length - 1 ? '' : 'disabled'}>${esc(t('ln_next'))} ›</button></div></article>`;
  }
  let wasWide = null;
  function render() {
    const root = $('learn'); if (!root) return;
    const W = wasWide = wideNow(), h = helpGet();
    root.classList.toggle('ln-wide', W);
    const foot = `<p class="ln-foot">${esc(t('ln_foot'))}</p>`;
    if (sit && !W) {
      root.innerHTML = `<button type="button" class="ghost small ln-back" data-ln-back>‹ ${esc(t('ln_back'))}</button>
        <section class="ln-group"><h3 class="ln-h">${esc(sit === 'all' ? t('ln_all') : t('sit_' + sit))}</h3>${sitList(sit).map(s => sheetHtml(s, h)).join('')}</section>${foot}`;
      return;
    }
    const g = suggested();
    // My methods: the kept ones and the ones that helped, what helped most first
    const mineIds = [...new Set([...S.learn.kept, ...Object.keys(h).filter(id => id[0] !== '_' && h[id] && (h[id].y || 0) > 0)])].filter(id => id !== g.s.id && byId(id));
    const mine = mineIds.map((id, k) => ({ id, k, sc: score(h, id) })).sort((a, b) => b.sc - a.sc || a.k - b.k).map(x => byId(x.id));
    const q = `<section class="ln-group"><h3 class="ln-h">${esc(t('ln_q'))}</h3>${W && sit ? `<div class="ln-split">${gridHtml()}${paneHtml()}</div>` : gridHtml()}</section>`;
    root.innerHTML = `${askHtml()}${sugHtml(g)}
      ${mine.length ? `<section class="ln-group"><h3 class="ln-h">${esc(t('ln_mine'))}</h3>${mine.map(s => sheetHtml(s, h)).join('')}</section>` : ''}
      ${q}${foot}`;
  }
  // a situation opens its first sheet on the right (computer) or its list (phone)
  function pickSit(k) {
    if (wideNow()) { if (sit === k) { sit = null; open = null; } else { sit = k; open = sitList(k)[0].id; } render(); return; }
    sit = k; open = null; render(); scrollTo({ top: 0, behavior: 'instant' });
  }
  $('learn').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.lnSit) { pickSit(b.dataset.lnSit); return; }
    if (b.hasAttribute('data-ln-back')) { sit = null; open = null; render(); return; }
    if (b.dataset.lnOpen) { open = open === b.dataset.lnOpen ? null : b.dataset.lnOpen; render(); return; }
    if (b.hasAttribute('data-ln-sugmore')) { sugOpen = !sugOpen; render(); return; }
    if (b.dataset.lnStep) {
      const dir = b.dataset.lnStep, list = sitList(sit), i = list.findIndex(s => s.id === open) + +dir;
      if (list[i]) { open = list[i].id; render(); const n = $('learn').querySelector(`.ln-pane [data-ln-step="${dir}"]`); if (n && !n.disabled) n.focus(); }
      return;
    }
    if (b.dataset.lnAns) {
      const hh = helpGet(), id = hh._ask && hh._ask.id; delete hh._ask;
      if (id && b.dataset.lnAns !== 'skip') { const r = hh[id] || (hh[id] = { y: 0, n: 0 }); r[b.dataset.lnAns] = (r[b.dataset.lnAns] || 0) + 1; ML.toast(t('ln_noted')); }
      helpSet(hh); render(); return;
    }
    const host = b.closest('[data-ln-id]'); if (!host) return;
    const s = byId(host.dataset.lnId), g = s.go;
    if (b.hasAttribute('data-ln-keep')) { const L = S.learn; L.kept = L.kept.includes(s.id) ? L.kept.filter(x => x !== s.id) : [...L.kept, s.id]; save(); render(); return; }
    if (b.hasAttribute('data-ln-add')) {
      S.tasks = S.tasks.filter(x => !x.sample);
      S.tasks.push({ id: ML.uid(), title: s[lang()].small.slice(0, 120), mins: 15, pri: 'med', done: false, created: Date.now(), due: ML.today() });
      save(); ML.renderAll(); ML.toast(t('ln_added'));
      return;
    }
    const k = b.dataset.lnGo; if (!k) return;
    if (k === 'focus' && ML.lockIn({ title: g.task[lang()], mins: g.focus })) { const hh = helpGet(); hh._run = { id: s.id, at: Date.now(), title: g.task[lang()] }; helpSet(hh); }
    if (k === 'tab') ML.setTab(g.tab);
    if (k === 'lib') ML.setTab('lib');
    if (k === 'prep' && ML.openDayPrep) ML.openDayPrep();
    if (k === 'tool') { S.study.tool = g.tool; save(); ML.setTab('study'); }
    if (k === 'eyes') { S.eyes.on = !S.eyes.on; save(); render(); }
  });
  // A session started from a sheet asks once, when it ends, whether it helped
  on('session', s => {
    const h = helpGet(), r = h._run; if (!r) return;
    delete h._run;
    if (s && !s.taskId && s.title === r.title && s.at - r.at < 6 * 36e5 && byId(r.id)) {
      h._ask = { id: r.id, at: Date.now() }; helpSet(h);
      if (S.tab === 'learn') render();
      else ML.toast(t('ln_ask', { m: byId(r.id)[lang()].t }), { action: { label: t('ln_answer'), fn: () => ML.setTab('learn') }, key: 'ln-ask' });
    } else helpSet(h);
  });
  if (window.ResizeObserver) new ResizeObserver(() => { if (S.tab === 'learn' && wasWide !== null && wideNow() !== wasWide) render(); }).observe($('learn'));
  on('tab', name => { if (name === 'learn') render(); });
  on('mood', () => { if (S.tab === 'learn') render(); });
  on('started', () => { if (S.tab === 'learn') render(); });
  on('lang', () => { if (S.tab === 'learn') render(); });

  /* ---------- Eye rest line (E1): silent, under the dial, leaves on its own ---------- */
  const EVERY = 20 * 60, STAY = 60000;
  const line = document.createElement('div'); line.className = 'eye-line'; line.id = 'eye-line'; line.hidden = true;
  document.querySelector('#sigil-card .ring-wrap').after(line);
  let last = -1, shownAt = 0, hideT = 0;
  function hideLine() { clearTimeout(hideT); line.hidden = true; shownAt = 0; line.innerHTML = ''; }
  function showLine() {
    line.innerHTML = `<label><input type="checkbox" id="eye-chk"><span>${esc(t('eye_line'))}</span></label>
      <button type="button" class="icon-btn" data-eye="hide" aria-label="${esc(t('eye_hide'))}" title="${esc(t('eye_hide'))}">✕</button>`;
    line.hidden = false; shownAt = Date.now();
  }
  line.addEventListener('change', e => { if (e.target.id === 'eye-chk' && e.target.checked) hideT = setTimeout(hideLine, 700); });
  line.addEventListener('click', e => { if (e.target.closest('[data-eye="hide"]')) hideLine(); });
  on('focus:start', () => { last = 0; hideLine(); });
  on('tick', rem => {
    if (!(S.eyes && S.eyes.on) || !ML.running() || S.mode !== 'focus') { if (shownAt) hideLine(); return; }
    const idx = Math.floor((S.total - rem) / EVERY);
    if (last < 0 || idx < last) last = idx;
    if (idx > last) { last = idx; if (rem > 60) showLine(); } // not just before the session ends: the break is close
    if (shownAt && Date.now() - shownAt > STAY) hideLine();
  });
  ML.settingsSection({
    order: 23, cat: 'timer',
    render: () => `<h3>${esc(t('eye_set'))}</h3>${ML.ui.chk('set-eyes', t('eye_opt'), S.eyes.on)}<p class="hint">${esc(t('eye_hint'))}</p>`,
    bind: r => { r.querySelector('#set-eyes').onchange = e => { S.eyes.on = e.target.checked; save(); if (S.tab === 'learn') render(); }; },
  });
})();
