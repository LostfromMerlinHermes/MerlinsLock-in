// Familiar (owl / black cat / raven / fox) that grows with your Sequence and reacts to what you do,
// and the mage tower: every focus session adds floors, abandoning one makes a floor crumble.
(() => {
  'use strict';
  const { $, S, t, esc, save, on, emit, toast, dayKey, today } = ML;

  ML.addStrings({
    fr: {
      fam_owl: 'Hibou', fam_owl_d: 'Sage et patient. Il veille la nuit.', fam_cat: 'Chat noir', fam_cat_d: 'Mystérieux, un peu moqueur.',
      fam_raven: 'Corbeau', fam_raven_d: 'Messager du brouillard gris.', fam_fox: 'Renard', fam_fox_d: 'Vif et malin, toujours prêt.',
      companion: 'Familier', rename: 'Nom du familier', stage_0: 'Bébé', stage_1: 'Jeune', stage_2: 'Adulte', stage_3: 'Ancien',
      tower: 'Ta tour de mage', floors_n_one: '{n} étage', floors_n: '{n} étages', floors_today: '+{n} aujourd’hui', tower_fell: 'Session abandonnée : un étage de ta tour s’est écroulé.', tower_fell_left: 'Mode strict : tu as quitté l’app, un étage s’est écroulé.',
      tower_rules: 'Chaque session d’au moins 15 min ajoute un étage (un par demi-heure). Abandonner avant la moitié fait tomber un étage.',
      tower_best: 'Record : {n} étages en un jour', tower_fallen: 'Écroulés cette semaine : {n}',
      l_idle: ['Prêt quand tu l’es.', 'On attaque quelle quête ?', 'Je garde un œil sur ta tour.', 'Un étage de plus aujourd’hui ?'],
      l_focus: ['Chut… je monte la garde.', 'Je surveille les distractions.', 'Un étage est en construction.', 'Concentre-toi, je m’occupe du reste.'],
      l_break: ['Pause méritée. Étire-toi.', 'Bois un peu d’eau, je garde la tour.', 'Respire. On repart bientôt.'],
      l_happy: ['Bien joué ! Un étage de plus.', 'Ta tour grandit !', 'Magnifique session.', 'Ça, c’est du focus.'],
      l_sad: ['Aïe… un étage s’est écroulé.', 'Pas grave, on reconstruit.'],
      l_sleep: ['Zzz… réveille-moi pour une session.', 'Zzz…'],
      l_pet: ['Hé, ça chatouille !', '♥', 'Merci, ça fait du bien.', 'On s’y remet ?'],
      l_morning: 'Bonjour ! Une session pour bien commencer ?',
      fam_hippo: 'Hippopotame royal', fam_hippo_d: 'Le trésor ultime. Bouclier royal : une fois par jour, il s’assoit sur ta tour et empêche un étage de tomber. Débloque l’ambiance Rivière royale.',
      hippo_shield: 'Bouclier royal : l’hippopotame s’est assis sur ta tour. Aucun étage n’est tombé.', shield_ready: 'Bouclier royal prêt : il protégera ta tour une fois aujourd’hui.', shield_used: 'Bouclier royal utilisé aujourd’hui. Il revient demain.',
      l_shield_hippo: ['Personne ne touche à ma tour.', 'Je me suis assis dessus. Elle ne bougera plus.'],
      // Each familiar has its own voice (mixed with the shared lines above)
      l_idle_owl: ['Hou hou. La sagesse commence par une petite tâche.', 'J’ai relu tout le grimoire cette nuit.', 'Je vois tout, même tes onglets ouverts.'],
      l_focus_owl: ['Je veille, comme chaque nuit.', 'Pas un bruit. Hou.'], l_happy_owl: ['Hou ! Je m’envole de fierté !', 'Un vol de victoire !'], l_pet_owl: ['Hou… doucement les plumes.', 'Tu sens l’encre et le café.'],
      l_idle_cat: ['Tu travailles ou je retourne dormir ?', 'Je fais semblant de ne pas te regarder.', 'Ce clavier a l’air confortable…'],
      l_focus_cat: ['Je surveille. Avec un œil.', 'Je ne m’assois pas sur ton clavier. Pour l’instant.'], l_happy_cat: ['Pas mal. Pour un humain.', '*bondit* Proie attrapée.'], l_pet_cat: ['Ronron… n’arrête pas.', 'Trois caresses. Pas une de plus.'], l_sad_cat: ['Je n’ai rien vu. Recommence.'],
      l_idle_raven: ['Croâ. Le brouillard murmure ton nom.', 'Une pièce brillante ? Pour moi ?', 'J’ai vu ton futur. Il travaille.'],
      l_focus_raven: ['Je garde tes secrets, et tes minutes.', 'Les ombres se taisent.'], l_happy_raven: ['Croâ ! Encore une pièce pour mon trésor.', 'Le présage était bon.'], l_pet_raven: ['Les plumes noires portent chance.', 'Croâ… merci.'],
      l_idle_fox: ['Allez allez, on lance une session ?', 'J’ai flairé une quête facile !', 'Je tiens pas en place !'],
      l_focus_fox: ['Je cours en rond dans ta tête. Concentre-toi !', 'Chasse silencieuse…'], l_happy_fox: ['Yip ! Trop fort !', '*tourne sur lui-même* Encore !'], l_pet_fox: ['Yip yip !', 'Hé, ma queue !'],
      l_idle_hippo: ['Doucement mais sûrement, comme la rivière.', 'Un hippopotame ne se presse jamais. Il arrive.', 'Je suis rare. Comme toi.'],
      l_focus_hippo: ['Je fais une bulle de calme autour de toi.', 'Rien ne me fait bouger. Toi non plus.'], l_happy_hippo: ['SPLASH ! Ça mérite un bain de boue.', 'Le sol tremble de fierté !'], l_pet_hippo: ['Mmmh, la vie est douce.', 'Encore, sur le museau.'],
    },
    en: {
      fam_owl: 'Owl', fam_owl_d: 'Wise and patient. Watches over the night.', fam_cat: 'Black cat', fam_cat_d: 'Mysterious, a little cheeky.',
      fam_raven: 'Raven', fam_raven_d: 'Messenger of the gray fog.', fam_fox: 'Fox', fam_fox_d: 'Quick and clever, always ready.',
      companion: 'Familiar', rename: 'Familiar name', stage_0: 'Baby', stage_1: 'Young', stage_2: 'Adult', stage_3: 'Elder',
      tower: 'Your mage tower', floors_n_one: '{n} floor', floors_n: '{n} floors', floors_today: '+{n} today', tower_fell: 'Session abandoned: a floor of your tower crumbled.', tower_fell_left: 'Strict mode: you left the app, a floor crumbled.',
      tower_rules: 'Every session of at least 15 min adds a floor (one per half hour). Quitting before halfway knocks one down.',
      tower_best: 'Record: {n} floors in a day', tower_fallen: 'Crumbled this week: {n}',
      l_idle: ['Ready when you are.', 'Which quest are we taking on?', 'I’m watching your tower.', 'One more floor today?'],
      l_focus: ['Shh… I’m on guard.', 'I’ll watch for distractions.', 'A floor is going up.', 'Focus, I’ve got the rest.'],
      l_break: ['Well-earned break. Stretch.', 'Drink some water, I’ll guard the tower.', 'Breathe. Back soon.'],
      l_happy: ['Nice! One more floor.', 'Your tower is growing!', 'Beautiful session.', 'Now that’s focus.'],
      l_sad: ['Ouch… a floor crumbled.', 'No worries, we rebuild.'],
      l_sleep: ['Zzz… wake me for a session.', 'Zzz…'],
      l_pet: ['Hey, that tickles!', '♥', 'Thanks, I needed that.', 'Back to it?'],
      l_morning: 'Good morning! A session to start strong?',
      fam_hippo: 'Royal hippo', fam_hippo_d: 'The ultimate treasure. Royal shield: once a day it sits on your tower and stops a floor from falling. Unlocks the Royal river ambience.',
      hippo_shield: 'Royal shield: the hippo sat on your tower. No floor fell.', shield_ready: 'Royal shield ready: it will protect your tower once today.', shield_used: 'Royal shield used today. It comes back tomorrow.',
      l_shield_hippo: ['Nobody touches my tower.', 'I sat on it. It won’t move now.'],
      l_idle_owl: ['Hoo hoo. Wisdom starts with one small task.', 'I reread the whole grimoire last night.', 'I see everything, even your open tabs.'],
      l_focus_owl: ['On watch, like every night.', 'Not a sound. Hoo.'], l_happy_owl: ['Hoo! I’m flying with pride!', 'A victory lap!'], l_pet_owl: ['Hoo… careful with the feathers.', 'You smell of ink and coffee.'],
      l_idle_cat: ['Are you working or can I go back to sleep?', 'I’m pretending not to look at you.', 'That keyboard looks comfy…'],
      l_focus_cat: ['I’m watching. With one eye.', 'I’m not sitting on your keyboard. Yet.'], l_happy_cat: ['Not bad. For a human.', '*pounces* Prey caught.'], l_pet_cat: ['Purr… don’t stop.', 'Three pets. Not one more.'], l_sad_cat: ['I saw nothing. Try again.'],
      l_idle_raven: ['Caw. The fog whispers your name.', 'A shiny coin? For me?', 'I’ve seen your future. It’s working.'],
      l_focus_raven: ['I keep your secrets, and your minutes.', 'The shadows go quiet.'], l_happy_raven: ['Caw! Another coin for my hoard.', 'The omen was good.'], l_pet_raven: ['Black feathers bring luck.', 'Caw… thanks.'],
      l_idle_fox: ['Come on, come on, a session?', 'I sniffed out an easy quest!', 'I can’t sit still!'],
      l_focus_fox: ['I’m running laps in your head. Focus!', 'Silent hunt…'], l_happy_fox: ['Yip! So good!', '*spins around* Again!'], l_pet_fox: ['Yip yip!', 'Hey, my tail!'],
      l_idle_hippo: ['Slow and steady, like the river.', 'A hippo never hurries. It arrives.', 'I’m rare. Like you.'],
      l_focus_hippo: ['I’m keeping a bubble of calm around you.', 'Nothing moves me. Nothing moves you.'], l_happy_hippo: ['SPLASH! That deserves a mud bath.', 'The ground shakes with pride!'], l_pet_hippo: ['Mmmh, life is sweet.', 'More, on the snout.'],
    },
  });
  ML.defaults(() => ({ companion: { name: null }, tower: { floors: 0, init: false, day: null, built: 0, fallen: 0, best: 0, log: {}, fallLog: [] } }));

  const NAMES = { owl: 'Nox', cat: 'Salem', raven: 'Corvus', fox: 'Kitsu', hippo: 'Hippolyte' };
  const species = () => (S.econ && S.econ.equip.familiar) || 'owl';
  const famName = () => S.companion.name || NAMES[species()];
  const stage = () => { const i = ML.seqInfo().i; return i >= 7 ? 3 : i >= 4 ? 2 : i >= 2 ? 1 : 0; };

  /* ---------- Familiar drawings (64×64) ---------- */
  const EYES = {
    owl: '<circle class="f-eye white" cx="24" cy="26" r="7"/><circle class="f-eye white" cx="40" cy="26" r="7"/><circle class="f-pupil" cx="24" cy="26" r="3.2"/><circle class="f-pupil" cx="40" cy="26" r="3.2"/>',
    cat: '<ellipse class="f-eye" cx="27" cy="27" rx="3.6" ry="4.2"/><ellipse class="f-eye" cx="37" cy="27" rx="3.6" ry="4.2"/><ellipse class="f-pupil" cx="27" cy="27" rx="1.3" ry="3.4"/><ellipse class="f-pupil" cx="37" cy="27" rx="1.3" ry="3.4"/>',
    raven: '<circle class="f-eye" cx="40" cy="22" r="3.2"/><circle class="f-pupil" cx="40.6" cy="22" r="1.6"/>',
    fox: '<ellipse class="f-eye" cx="26" cy="25" rx="3" ry="3.4"/><ellipse class="f-eye" cx="38" cy="25" rx="3" ry="3.4"/><circle class="f-pupil" cx="26" cy="25.4" r="1.6"/><circle class="f-pupil" cx="38" cy="25.4" r="1.6"/>',
    hippo: '<ellipse class="f-eye white" cx="25.5" cy="20.5" rx="3.2" ry="3.4"/><ellipse class="f-eye white" cx="38.5" cy="20.5" rx="3.2" ry="3.4"/><circle class="f-pupil" cx="26" cy="21.2" r="1.6"/><circle class="f-pupil" cx="38" cy="21.2" r="1.6"/><circle class="f-glint" cx="26.6" cy="20.4" r=".6"/><circle class="f-glint" cx="38.6" cy="20.4" r=".6"/>',
  };
  const BODY = {
    owl: `<path class="f-wing" d="M14 34 C9 40 11 48 16 51 Z M50 34 C55 40 53 48 48 51 Z"/>
      <path class="f-body" d="M14 52 C10 36 14 18 32 16 C50 18 54 36 50 52 Z"/><path class="f-body" d="M18 20 L14 8 L26 16 Z M46 20 L50 8 L38 16 Z"/>
      <path class="f-belly" d="M22 51 C20 41 24 33 32 33 C40 33 44 41 42 51 Z"/><path class="f-beak" d="M30 31 L34 31 L32 35 Z"/>
      <path class="f-feet" d="M27 52 v3 M30 52 v3 M34 52 v3 M37 52 v3"/>`,
    cat: `<path class="f-tail" d="M45 50 C58 48 58 34 52 29"/>
      <ellipse class="f-body" cx="32" cy="45" rx="14" ry="10"/><circle class="f-body" cx="32" cy="27" r="13"/>
      <path class="f-body" d="M21 22 L20 9 L29 17 Z M43 22 L44 9 L35 17 Z"/><path class="f-inner" d="M22 19 L21.5 13 L26 17 Z M42 19 L42.5 13 L38 17 Z"/>
      <path class="f-beak" d="M30.5 31.5 L33.5 31.5 L32 33.5 Z"/><path class="f-line" d="M19 31 L26 32 M19 34 L26 33.5 M45 31 L38 32 M45 34 L38 33.5"/>`,
    raven: `<path class="f-body" d="M16 46 C14 32 22 20 34 20 C44 20 48 28 46 38 C45 46 40 52 30 52 L11 58 L20 50 Z"/>
      <circle class="f-body" cx="38" cy="24" r="10"/><path class="f-beak" d="M46 21 L58 25.5 L46 29 Z"/>
      <path class="f-wing" d="M19 36 C26 29 36 31 41 40 C34 47 25 46 19 36 Z"/><path class="f-feet" d="M28 52 v5 M34 51 v5"/>`,
    fox: `<path class="f-body" d="M44 48 C58 50 61 34 52 27 C54 38 48 44 43 44 Z"/><path class="f-belly" d="M57 33 C59 30 56 26 52 27 C54 29 55.5 31 57 33 Z"/>
      <ellipse class="f-body" cx="32" cy="46" rx="13" ry="9"/>
      <path class="f-body" d="M16 22 L21 8 L28 18 L36 18 L43 8 L48 22 C48 32 40 38 32 38 C24 38 16 32 16 22 Z"/>
      <path class="f-inner" d="M20 18 L21.5 12 L25 17 Z M44 18 L42.5 12 L39 17 Z"/>
      <path class="f-belly" d="M18 26 C22 34 28 37 32 37 C36 37 42 34 46 26 C40 30 36 30 32 33 C28 30 24 30 18 26 Z"/><circle class="f-beak" cx="32" cy="32.5" r="1.8"/>`,
    hippo: `<path class="f-tail" d="M51 44 C56 44 57 40 55 37"/>
      <rect class="f-body" x="15" y="47" width="8" height="9" rx="2.5"/><rect class="f-body" x="41" y="47" width="8" height="9" rx="2.5"/>
      <ellipse class="f-body" cx="32" cy="43" rx="20" ry="12.5"/><ellipse class="f-belly" cx="32" cy="47" rx="12" ry="6.5" opacity=".55"/>
      <ellipse class="f-body" cx="20.5" cy="12.5" rx="3.6" ry="3.2"/><ellipse class="f-inner" cx="20.5" cy="12.8" rx="1.8" ry="1.5"/>
      <ellipse class="f-body" cx="43.5" cy="12.5" rx="3.6" ry="3.2"/><ellipse class="f-inner" cx="43.5" cy="12.8" rx="1.8" ry="1.5"/>
      <ellipse class="f-body" cx="32" cy="23" rx="14" ry="10.5"/>
      <ellipse class="f-belly" cx="32" cy="31" rx="13" ry="7.5"/>
      <ellipse class="f-beak" cx="27.5" cy="29" rx="1.4" ry="1.1"/><ellipse class="f-beak" cx="36.5" cy="29" rx="1.4" ry="1.1"/>
      <rect class="f-tooth" x="26.5" y="35" width="2.6" height="3" rx=".6"/><rect class="f-tooth" x="34.9" y="35" width="2.6" height="3" rx=".6"/>
      <ellipse class="f-blush" cx="20.5" cy="28" rx="3" ry="1.6"/><ellipse class="f-blush" cx="43.5" cy="28" rx="3" ry="1.6"/>
      <circle class="f-earring" cx="18.6" cy="16.6" r="1.5"/><circle class="f-pearl" cx="18.6" cy="18.6" r="1.1"/><circle class="f-earring" cx="45.4" cy="16.6" r="1.5"/><circle class="f-pearl" cx="45.4" cy="18.6" r="1.1"/>
      <path class="f-medal" d="M27 40.5 Q32 44 37 40.5"/><circle class="f-gold" cx="32" cy="44.6" r="2.2"/>`,
  };
  const HAT_POS = { owl: 'translate(20 -2)', cat: 'translate(20 -4)', raven: 'translate(26 -4)', fox: 'translate(20 -6)', hippo: 'translate(24 -2)' };

  /* ---------- Sequence costumes (one per Sequence, earned for good, worn by the familiar) ----------
     Each costume is drawn once in a head-centred frame; ANCHOR places that frame on each species:
     c = head centre, s = scale, top = top of the head, nose, neck, eyes [x, y, r], face = mask ellipse [cx, cy, rx, ry]. */
  const COSTUMES = ['seer', 'clown', 'magician', 'faceless', 'marionettist', 'bizarro', 'scholar', 'miracle', 'attendant', 'fool'];
  const ANCHOR = {
    owl: { c: [32, 25], s: 1, top: -11, nose: [0, 7.5], neck: [0, 11], eyes: [[-8, 1, 7], [8, 1, 7]], face: [0, 1, 16, 9.5] },
    cat: { c: [32, 26], s: 1, top: -12, nose: [0, 6.3], neck: [0, 13], eyes: [[-5, 1, 4], [5, 1, 4]], face: [0, 2, 11, 8.5] },
    raven: { c: [38, 23], s: 0.8, top: -12.5, nose: [15, 2.5], neck: [-6, 11], eyes: [[2.5, -1.2, 4]], face: [2.5, -1, 7, 6.5] },
    fox: { c: [32, 25], s: 1, top: -11, nose: [0, 7.5], neck: [0, 13], eyes: [[-6, 0, 3.4], [6, 0, 3.4]], face: [0, 1.5, 10.5, 7.5] },
    hippo: { c: [32, 22], s: 1, top: -9.5, nose: [0, 7], neck: [0, 13], eyes: [[-6.5, -1.5, 3.4], [6.5, -1.5, 3.4]], face: [0, -1, 11, 6.5] },
  };
  const FOG = '<g class="cs-fog"><ellipse cx="18" cy="56" rx="14" ry="3.4"/><ellipse cx="46" cy="57" rx="15" ry="3.4"/><ellipse cx="32" cy="59.5" rx="24" ry="3"/></g>';
  const cape = (A, cls, edge) => { const [x, y] = A.neck; return `<path class="${cls}" d="M${x - 7} ${y - 1} C${x - 18} ${y + 7} ${x - 20} ${y + 15} ${x - 17} ${y + 20} L${x + 17} ${y + 20} C${x + 20} ${y + 15} ${x + 18} ${y + 7} ${x + 7} ${y - 1} Z"/>${edge ? `<path class="${edge}" d="M${x - 17} ${y + 20} L${x + 17} ${y + 20}"/>` : ''}`; };
  const topHat = (y, h, rot, band, star) => `<g transform="translate(0 ${y}) rotate(${rot})"><path class="cs-black" d="M-7 0 L-6 -${h} H6 L7 0 Z"/><rect class="${band}" x="-6.7" y="-4" width="13.4" height="2.6"/><ellipse class="cs-black" cx="0" cy="0.4" rx="11.5" ry="2.1"/>${star ? `<path class="cs-gold" d="M0 -${h - 3} l1 2.2 2.4 .2 -1.8 1.6 .6 2.4 -2.2 -1.3 -2.2 1.3 .6 -2.4 -1.8 -1.6 2.4 -.2 Z"/>` : ''}</g>`;
  const monocle = A => { const [x, y, r] = A.eyes[A.eyes.length - 1]; return `<circle class="cs-glass" cx="${x}" cy="${y}" r="${r + 1.4}"/><path class="cs-chain" d="M${x + r * 0.7} ${y + r + 0.6} C${x + r + 3} ${y + 8} ${x + r + 2} ${y + 12} ${x + 4} ${A.neck[1] + 3}"/>`; };
  // back: drawn behind the body · front: over the face · ground: unscaled, at the familiar's feet · head: replaces the Elder hat
  const COSTUME = {
    seer: { head: true, front: A => { const y = A.top + 6; return `<path class="cs-purple" d="M-13 ${y + 1} C-12 ${y - 9} 12 ${y - 9} 13 ${y + 1} C6 ${y - 2} -6 ${y - 2} -13 ${y + 1} Z"/><path class="cs-purple" d="M12 ${y} L18 ${y + 8} L14.5 ${y + 9} Z"/>`
      + [-9, -4.5, 0, 4.5, 9].map(x => `<circle class="cs-gold" cx="${x}" cy="${(y + 0.6 - Math.abs(x) * 0.08).toFixed(1)}" r="1.4"/>`).join('') + `<circle class="cs-gem" cx="0" cy="${y - 3.6}" r="1.7"/>`; } },
    clown: { head: true, front: A => { const [x, y] = A.neck, [nx, ny] = A.nose; return [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(j => `<circle class="cs-ruff" cx="${x + j * 3.1}" cy="${(y - Math.abs(j) * 0.5).toFixed(1)}" r="2.7"/>`).join('')
      + `<circle class="cs-red" cx="${nx}" cy="${ny}" r="2.7"/><circle class="cs-shine" cx="${nx - 0.9}" cy="${ny - 0.9}" r=".8"/>`
      + `<g transform="translate(5 ${A.top + 2}) rotate(18)"><path class="cs-red" d="M-5.5 0 L0 -13 L5.5 0 Z"/><circle class="cs-white" cx="0" cy="-13.4" r="2.2"/><circle class="cs-white" cx="-1.5" cy="-5" r="1"/><circle class="cs-white" cx="1.6" cy="-8.5" r="1"/></g>`; } },
    magician: { head: true, back: A => cape(A, 'cs-cape-red'), front: A => { const [x, y] = A.neck; return topHat(A.top + 2, 11, -8, 'cs-red') + `<path class="cs-red" d="M${x} ${y} l-5 -3 v6 Z M${x} ${y} l5 -3 v6 Z"/><circle class="cs-red" cx="${x}" cy="${y}" r="1.4"/>`; } },
    faceless: { front: A => { const [cx, cy, rx, ry] = A.face; return `<ellipse class="cs-mask" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>` + A.eyes.map(([x, y]) => `<path class="cs-slit" d="M${x - 2.4} ${y} h4.8"/>`).join(''); } },
    marionettist: { head: true, front: A => { const y = A.top - 15, ny = A.neck[1] + 4; return `<path class="cs-string" d="M-12 ${y + 2} L-16 ${ny} M12 ${y + 2} L16 ${ny} M0 ${y + 3} L0 ${A.top + 1}"/>`
      + `<rect class="cs-wood" x="-14" y="${y}" width="28" height="3" rx="1.5"/><rect class="cs-wood" x="-1.5" y="${y - 6}" width="3" height="13" rx="1.5"/>`
      + `<circle class="cs-gold" cx="-16" cy="${ny}" r="1.2"/><circle class="cs-gold" cx="16" cy="${ny}" r="1.2"/>`; } },
    bizarro: { head: true, back: A => `<path class="cs-tendril" d="M-9 ${A.top + 5} c-7 -3 -3 -9 -9 -13 M9 ${A.top + 5} c7 -3 3 -9 9 -13 M0 ${A.top + 2} c-3 -5 3 -8 0 -14"/>`,
      front: A => { const y = A.top + 5; return `<path class="cs-circlet" d="M-12.5 ${y + 1} Q0 ${y - 4} 12.5 ${y + 1}"/><circle class="cs-orb" cx="0" cy="${y - 1.6}" r="1.9"/><circle class="cs-orb" cx="-7.5" cy="${y - 0.4}" r="1.1"/><circle class="cs-orb" cx="7.5" cy="${y - 0.4}" r="1.1"/>`; } },
    scholar: { head: true, front: A => `<g transform="translate(0 ${A.top + 2})"><path class="cs-black" d="M-8 0 v-4 h16 v4 Z"/><path class="cs-black" d="M-15 -5 L0 -10.5 L15 -5 L0 .5 Z"/><path class="cs-chain" d="M0 -5 L10 -3 v6"/><circle class="cs-gold" cx="10" cy="3.6" r="1.4"/></g>` + monocle(A) },
    miracle: { head: true, back: A => `<g class="cs-rays">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a), q = Math.cos(a + 0.12), w = Math.sin(a + 0.12), q2 = Math.cos(a - 0.12), w2 = Math.sin(a - 0.12); return `<path d="M${(c * 12).toFixed(1)} ${(s * 12).toFixed(1)} L${(q * 24).toFixed(1)} ${(w * 24).toFixed(1)} L${(q2 * 24).toFixed(1)} ${(w2 * 24).toFixed(1)} Z"/>`; }).join('')}</g>`,
      front: A => `<ellipse class="cs-halo" cx="0" cy="${A.top - 5}" rx="9.5" ry="2.6"/><path class="cs-gold cs-twinkle" d="M-17 ${A.top + 4} l1 -3 1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 Z M16 ${A.top + 12} l.8 -2.4 .8 2.4 2.4 .8 -2.4 .8 -.8 2.4 -.8 -2.4 -2.4 -.8 Z"/>` },
    attendant: { head: true, ground: FOG, back: A => `<path class="cs-hood" d="M-17 ${A.neck[1] + 4} C-19 ${A.top - 6} 19 ${A.top - 6} 17 ${A.neck[1] + 4} C20 ${A.neck[1] + 11} 18 ${A.neck[1] + 17} 15 ${A.neck[1] + 20} L-15 ${A.neck[1] + 20} C-18 ${A.neck[1] + 17} -20 ${A.neck[1] + 11} -17 ${A.neck[1] + 4} Z"/>`,
      front: A => { const [x, y] = A.neck; return `<path class="cs-hood-rim" d="M-15.5 ${y + 3} C-17 ${A.top - 3} 17 ${A.top - 3} 15.5 ${y + 3}"/><path class="cs-gold" d="M${x} ${y - 2.5} l1.1 2.4 2.6 .3 -1.9 1.7 .5 2.6 -2.3 -1.3 -2.3 1.3 .5 -2.6 -1.9 -1.7 2.6 -.3 Z"/>`; } },
    fool: { head: true, ground: FOG, back: A => cape(A, 'cs-cape-gray', 'cs-goldline'), front: A => topHat(A.top + 2, 14, -6, 'cs-gold', true) + monocle(A) },
  };
  ML.COSTUMES = COSTUMES;
  function costumeSvg(kind, k, layer) {
    const C = COSTUME[k], A = ANCHOR[kind]; if (!C || !A || !C[layer]) return '';
    if (layer === 'ground') return C.ground;
    return `<g class="cs cs-${layer}" transform="translate(${A.c[0]} ${A.c[1]}) scale(${A.s})">${C[layer](A)}</g>`;
  }
  const equippedCostume = () => { const k = S.econ && S.econ.equip.costume; return COSTUME[k] ? k : null; };

  // Royal hippo extras: a crown instead of the Elder hat, and a pool it stands in. Everything below the
  // waterline is clipped, so it can dive in (celebration) and float half-submerged (focus).
  const CROWN = '<g class="f-crown"><path d="M24.5 12.6 L23.4 5.2 L28.2 8.8 L32 2.6 L35.8 8.8 L40.6 5.2 L39.5 12.6 Z"/><path class="f-crown-band" d="M24.6 11 H39.4"/><circle class="f-ruby" cx="32" cy="9.6" r="1.3"/><circle class="f-pearl" cx="32" cy="2.4" r="1"/><circle class="f-pearl" cx="23.4" cy="5" r=".8"/><circle class="f-pearl" cx="40.6" cy="5" r=".8"/></g>';
  const POOL = '<g class="f-pool"><ellipse class="pool" cx="32" cy="57.4" rx="25" ry="4.8"/><ellipse class="ripple r1" cx="32" cy="57.4" rx="12" ry="2.4"/><ellipse class="ripple r2" cx="32" cy="57.4" rx="12" ry="2.4"/></g>';
  const SPLASH = '<g class="f-splash">' + [[-14, -20], [-8, -28], [-2, -32], [5, -30], [11, -24], [16, -16], [-18, -12]].map(([dx, dy], i) => `<circle cx="32" cy="56" r="${(1 + (i % 3) * 0.5).toFixed(1)}" style="--dx:${dx}px;--dy:${dy}px"/>`).join('') + '</g>';
  let clipN = 0;
  function familiarSvg(kind = species(), state = 'idle', st = 2, extra = '', costume = equippedCostume()) {
    if (!BODY[kind]) kind = 'owl';
    const C = costume && COSTUME[costume], hippo = kind === 'hippo', clip = hippo ? 'hc' + (++clipN) : '';
    const hat = hippo ? (C && C.head ? '' : CROWN)
      : st >= 3 && !(C && C.head) ? `<g transform="${HAT_POS[kind]}"><path class="f-hat" d="M0 12 C3 8 5 4 10 0 C9 4 11 8 16 12 Z"/><path class="f-hatband" d="M1 11 H15"/></g>` : '';
    const body = `<g class="f-all">${C ? costumeSvg(kind, costume, 'back') : ''}${BODY[kind]}<g class="f-eyes">${EYES[kind]}</g>${hat}${C ? costumeSvg(kind, costume, 'front') : ''}</g>`;
    return `<svg class="fam fam-${kind} ${state} st-${st} ${C ? 'cos-' + costume : ''} ${extra}" viewBox="-4 -14 72 78" aria-hidden="true">
      ${hippo ? `<defs><clipPath id="${clip}"><rect x="-20" y="-40" width="110" height="97.4"/></clipPath></defs>${POOL}` : '<ellipse class="f-shadow" cx="32" cy="58" rx="16" ry="3"/>'}${C ? costumeSvg(kind, costume, 'ground') : ''}
      ${hippo ? `<g clip-path="url(#${clip})">${body}</g><path class="pool-edge" d="M10 57.6 Q32 54.6 54 57.6"/>${SPLASH}` : body}
      <g class="f-zzz"><text x="46" y="8">z</text><text x="52" y="0">z</text><text x="58" y="-8">Z</text></g>
      <g class="f-spark"><path d="M8 6 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 Z"/><path d="M52 14 l1.5 -4 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 Z"/></g>
    </svg>`;
  }
  ML.familiarSvg = (k, s, costume = null) => familiarSvg(k, s, 2, '', costume); // shop previews: bare unless a costume is asked for
  ML.costumeSvg = k => familiarSvg(species(), 'idle', 2, '', k);

  /* ---------- Behaviour ---------- */
  let flash = null, flashT = null, line = null, lastActive = Date.now();
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  // Shared lines plus the familiar's own (weighted double, so each animal sounds like itself)
  const lines = key => {
    const v = t(key), base = Array.isArray(v) ? v : [v];
    const own = t(key + '_' + species());
    return Array.isArray(own) ? [...own, ...own, ...base] : base;
  };
  // Celebration: each familiar has its own move (owl flies a loop, cat pounces, raven hops, fox spins, hippo splashes).
  // The perch re-renders often, so the animation keeps its clock through a negative delay.
  let cele = null, celeT = null;
  function celebrate(big) {
    cele = { big, at: Date.now() };
    clearTimeout(celeT); celeT = setTimeout(() => { cele = null; renderPerch(); }, big ? 3600 : 2400);
    renderPerch();
  }
  function currentState() {
    if (flash) return flash;
    if (ML.running()) return S.mode === 'focus' ? 'focus' : 'break';
    const h = new Date().getHours();
    if (h >= 23 || h < 6 || Date.now() - lastActive > 90 * 60000) return 'sleep';
    return 'idle';
  }
  function react(state, ms = 6000) {
    flash = state; line = pick(lines('l_' + state));
    clearTimeout(flashT); flashT = setTimeout(() => { flash = null; line = null; renderPerch(); }, ms);
    renderPerch();
  }
  let lastState = null;
  function renderPerch() {
    const el = $('perch'); if (!el) return;
    const st = currentState();
    if (st !== lastState && !flash) {
      line = st === 'idle' && new Date().getHours() < 10 && !S.sessions.some(s => dayKey(new Date(s.at)) === today()) ? t('l_morning') : pick(lines('l_' + st));
      lastState = st;
    }
    const T = S.tower;
    el.innerHTML = `
      <button type="button" class="fam-btn ${cele ? 'flying' : ''}" id="fam-btn" title="${esc(famName())} · ${esc(t('fam_' + species()))} · ${esc(t('stage_' + stage()))}" ${cele ? `style="--ce:-${Date.now() - cele.at}ms"` : ''}>${familiarSvg(species(), st, stage(), cele ? 'cele' + (cele.big ? ' big' : '') : '')}${species() === 'hippo' ? `<span class="shield-badge ${shieldReady() ? 'on' : 'used'}" title="${esc(t(shieldReady() ? 'shield_ready' : 'shield_used'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18 L3 7 L8.5 11 L12 4 L15.5 11 L21 7 L20 18 Z"/></svg></span>` : ''}</button>
      <div class="bubble"><b>${esc(famName())}</b><span>${esc(line || '')}</span></div>
      <button type="button" class="mini-tower" id="mini-tower" title="${esc(t('tower'))}">${towerSvg(Math.min(8, Math.max(1, T.day === today() ? T.built : 0)), T.day === today() ? T.built : 0, true)}
        <span><b>${esc(ML.tn('floors_n', T.floors))}</b><small>${esc(t('floors_today', { n: T.day === today() ? T.built : 0 }))}</small></span></button>`;
    $('fam-btn').onclick = () => { react('happy', 3500); line = pick(lines('l_pet')); renderPerch(); ML.sfx && ML.sfx('task'); lastActive = Date.now(); };
    $('mini-tower').onclick = () => { ML.setTab('grim'); setTimeout(() => { const c = $('tower-card'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60); };
  }

  /* ---------- Tower ---------- */
  const gainFor = mins => (mins >= 15 ? Math.max(1, Math.round(mins / 30)) : 0);
  function towerDay() { const T = S.tower; if (T.day !== today()) { T.day = today(); T.built = 0; T.fallen = 0; } return T; }
  function initTower() {
    const T = S.tower; if (T.init) return;
    T.floors = S.sessions.reduce((a, s) => a + gainFor(s.mins), 0);
    S.sessions.forEach(s => { const k = dayKey(new Date(s.at)); T.log[k] = (T.log[k] || 0) + gainFor(s.mins); });
    T.best = Math.max(0, ...Object.values(T.log));
    T.init = true; save();
  }
  // Tower drawing: n stacked floors (lit windows for today's), a roof with a flag
  function towerSvg(n, litToday, mini) {
    const fh = mini ? 7 : 14, w = mini ? 22 : 64, x0 = mini ? 4 : 18, top = mini ? 18 : 40;
    const H = top + n * fh + (mini ? 4 : 18);
    let floors = '';
    for (let i = 0; i < n; i++) {
      const y = H - (mini ? 4 : 18) - (i + 1) * fh, lit = i >= n - litToday;
      floors += `<rect class="tw-floor ${lit ? 'lit' : ''}" x="${x0}" y="${y}" width="${w}" height="${fh - 1}"/>`;
      if (!mini) for (let k = 0; k < 3; k++) floors += `<rect class="tw-win ${lit ? 'lit' : ''}" x="${x0 + 10 + k * 18}" y="${y + 4}" width="7" height="${fh - 8}" rx="3"/>`;
      else floors += `<rect class="tw-win ${lit ? 'lit' : ''}" x="${x0 + 8}" y="${y + 2}" width="6" height="${fh - 4}"/>`;
    }
    const roofY = H - (mini ? 4 : 18) - n * fh;
    const roof = `<path class="tw-roof" d="M${x0 - (mini ? 2 : 6)} ${roofY} L${x0 + w / 2} ${roofY - (mini ? 14 : 34)} L${x0 + w + (mini ? 2 : 6)} ${roofY} Z"/>`
      + (mini ? '' : `<path class="tw-pole" d="M${x0 + w / 2} ${roofY - 34} v-12"/><path class="tw-flag" d="M${x0 + w / 2} ${roofY - 46} l14 4 l-14 4 Z"/>`);
    const base = mini ? `<rect class="tw-base" x="${x0 - 3}" y="${H - 4}" width="${w + 6}" height="4"/>` : `<rect class="tw-base" x="${x0 - 8}" y="${H - 18}" width="${w + 16}" height="18"/><path class="tw-door" d="M${x0 + w / 2 - 7} ${H} v-12 a7 7 0 0 1 14 0 v12 Z"/>`;
    return `<svg class="tower ${mini ? 'mini' : ''}" viewBox="0 0 ${mini ? 30 : 100} ${H}" ${mini ? 'width="30"' : ''} aria-hidden="true">${floors}${roof}${base}</svg>`;
  }
  on('session', s => {
    initTower();
    const g = gainFor(s.mins); if (!g) return;
    const T = towerDay(); T.floors += g; T.built += g; T.log[T.day] = (T.log[T.day] || 0) + g; T.best = Math.max(T.best, T.log[T.day]);
    save(); lastActive = Date.now(); react('happy');
  });
  // Royal shield (Royal hippo only): once a day, the first floor that should fall doesn't
  const shieldReady = () => species() === 'hippo' && S.tower.shieldDay !== today();
  function useShield() {
    if (!shieldReady()) return false;
    S.tower.shieldDay = today(); save();
    toast(t('hippo_shield'), { ms: 7000 });
    react('happy', 7000); line = pick(t('l_shield_hippo')); celebrate(false);
    return true;
  }
  on('abandon', () => {
    if (useShield()) return;
    initTower();
    const T = towerDay();
    if (T.floors > 0) { T.floors--; T.fallen++; T.built = Math.max(0, T.built - 1); T.fallLog.push(Date.now()); if (T.fallLog.length > 200) T.fallLog = T.fallLog.slice(-200); }
    save(); toast(t('tower_fell')); react('sad', 8000);
    const mt = document.querySelector('.mini-tower'); if (mt) { mt.classList.remove('crumble'); void mt.offsetWidth; mt.classList.add('crumble'); }
  });
  on('left', ({ strict }) => {
    if (!strict) { react('sad', 6000); return; }
    if (useShield()) return;
    initTower();
    const T = towerDay();
    if (T.floors > 0) { T.floors--; T.fallen++; T.built = Math.max(0, T.built - 1); T.fallLog.push(Date.now()); }
    save(); toast(t('tower_fell_left')); react('sad', 8000);
    const mt = document.querySelector('.mini-tower'); if (mt) { mt.classList.remove('crumble'); void mt.offsetWidth; mt.classList.add('crumble'); }
  });
  on('timer', () => { lastActive = Date.now(); renderPerch(); });
  on('xp', () => { if (cele) return; const f = document.querySelector('.perch .fam'); if (f) { f.classList.remove('hop'); void f.getBoundingClientRect(); f.classList.add('hop'); } });
  on('task:done', () => { lastActive = Date.now(); react('happy', 4000); celebrate(false); });
  on('session', () => celebrate(false));
  on('levelup', () => celebrate(true));
  ML.celebrateFamiliar = celebrate;
  on('render', renderPerch);
  on('minute', renderPerch);
  on('cosmetics', () => { lastState = null; renderPerch(); });
  on('started', () => { initTower(); towerDay(); renderPerch(); });

  /* ---------- Grimoire: tower + familiar ---------- */
  on('grimoire', () => {
    initTower();
    const T = towerDay(), shown = Math.min(24, T.floors), weekAgo = Date.now() - 7 * 864e5;
    const card = document.createElement('div');
    card.className = 'g-card tower-card'; card.id = 'tower-card';
    card.innerHTML = `<h2>${esc(t('tower'))}</h2>
      <div class="tower-row">
        <div class="tower-big">${shown ? towerSvg(shown, Math.min(shown, T.built), false) : towerSvg(1, 0, false)}${T.floors > 24 ? `<span class="tw-more">+${T.floors - 24}</span>` : ''}</div>
        <div class="tower-info">
          <strong>${esc(ML.tn('floors_n', T.floors))}</strong>
          <span>${esc(t('floors_today', { n: T.built }))}</span>
          <span>${esc(t('tower_best', { n: T.best }))}</span>
          <span>${esc(t('tower_fallen', { n: T.fallLog.filter(x => x > weekAgo).length }))}</span>
          <p class="hint">${esc(t('tower_rules'))}</p>
          <div class="fam-card">${familiarSvg(species(), 'idle', stage())}
            <label class="field"><span>${esc(t('rename'))}</span><input type="text" id="fam-name" maxlength="20" value="${esc(famName())}"></label>
            <small>${esc(t('fam_' + species()))} · ${esc(t('stage_' + stage()))}</small>
            <button type="button" class="small ghost" id="fam-shop">${esc(t('shop'))} ◈</button>
          </div>
        </div>
      </div>`;
    $('g-game').prepend(card);
    $('fam-name').onchange = e => { S.companion.name = e.target.value.trim() || null; save(); renderPerch(); };
    $('fam-shop').onclick = () => ML.openShop();
  });
})();
