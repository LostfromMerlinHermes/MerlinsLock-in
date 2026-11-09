// Economy: gold earned with XP, a shop of cosmetics (hats, seal rings, end-of-session effects, familiars)
// and potions (streak seal, focus elixir, quest scroll).
(() => {
  'use strict';
  const { $, S, t, esc, save, on, emit, toast, dayKey, today, addDays } = ML;

  ML.addStrings({
    fr: {
      shop: 'Boutique', gold_n: '{n} pièces d’or', buy: 'Acheter', equip: 'Équiper', equipped: 'Équipé', owned: 'possédé', use: 'Utiliser', not_enough: 'Pas assez d’or : il te manque {n} ◈.',
      bought: '{name} acheté', shop_hint: 'Tu gagnes 1 pièce d’or pour 4 XP (moitié moins pour les quêtes du jour). Les potions se consomment, les cosmétiques sont à toi pour toujours.',
      cat_hats: 'Chapeaux', cat_rings: 'Anneau du sceau', cat_bursts: 'Effet de fin de session', cat_familiars: 'Familiers', cat_potions: 'Potions',
      hat_wizard: 'Chapeau de Merlin', hat_wizard_d: 'Le classique, avec son monocle.',
      hat_tophat: 'Haut-de-forme du Fou', hat_tophat_d: 'Élégance victorienne au-dessus du brouillard gris.',
      hat_hood: 'Capuche d’ombre', hat_hood_d: 'Le visage dans l’ombre. Seul le monocle brille.',
      hat_crown: 'Couronne astrale', hat_crown_d: 'Pour qui a gravi les cercles.',
      hat_neon: 'Chapeau néon', hat_neon_d: 'Le bandeau pulse aux couleurs du réseau.',
      ring_default: 'Sceau d’origine', ring_default_d: 'Les couleurs du thème.',
      ring_gold: 'Sceau d’or', ring_gold_d: 'Segments en or massif.',
      ring_blood: 'Sceau écarlate', ring_blood_d: 'La lune rouge veille.',
      ring_spectre: 'Sceau spectral', ring_spectre_d: 'Une lumière blanche et froide.',
      ring_aurora: 'Sceau aurore', ring_aurora_d: 'Les couleurs tournent en continu.',
      burst_theme: 'Effet du thème', burst_theme_d: 'Change avec ton humeur.',
      burst_coins: 'Pluie de pièces', burst_coins_d: 'Jackpot à chaque session.',
      burst_confetti: 'Confettis', burst_confetti_d: 'La fête, tout simplement.',
      burst_stars: 'Étoiles filantes', burst_stars_d: 'Une constellation éclate.',
      pot_seal: 'Sceau de série', pot_seal_d: 'Protège ta série un jour où tu ne travailles pas. Utilisé tout seul.',
      pot_elixir: 'Élixir de concentration', pot_elixir_d: '+50 % d’XP sur ta prochaine session.',
      pot_scroll: 'Parchemin de quête', pot_scroll_d: 'Change une quête du jour (bouton ↻ sur la quête).',
      cat_skins: 'Skins du personnage (Sport)', premium_only: 'Réservé Premium',
      skin_classic: 'Classique', skin_classic_d: 'Les couleurs du thème.', skin_runic: 'Cercle runique', skin_runic_d: 'Un anneau de runes tourne autour de ton hexagone.',
      skin_parchment: 'Parchemin', skin_parchment_d: 'Ton personnage à l’encre, sur un vieux grimoire.', skin_gold: 'Or royal', skin_gold_d: 'Chaque muscle brille comme un trophée.',
      skin_ember: 'Braises', skin_ember_d: 'Rouge feu, pour les jours Beast mode.', skin_holo: 'Holographique', skin_holo_d: 'Des couleurs qui tournent sans fin.', skin_astral: 'Astral', skin_astral_d: 'Ton corps dessiné dans un ciel étoilé.',
      hat_witch: 'Chapeau de sorcière', hat_witch_d: 'Pointe tordue, mystère garanti.',
      ring_emerald: 'Sceau d’émeraude', ring_emerald_d: 'Le vert profond des forêts anciennes.',
      burst_sakura: 'Pétales de sakura', burst_sakura_d: 'Une pluie de fleurs de cerisier, très zen.',
      pot_midas: 'Potion de Midas', pot_midas_d: 'Double l’or gagné sur tes 100 prochains XP.', midas_on: 'Midas actif : encore {n} XP en or double',
      elixir_on: 'Élixir actif : +50 % sur la prochaine session', elixir_used: 'Élixir', seal_used: 'Un Sceau de série a protégé ta série d’hier.', in_stock: 'En stock : {n}',
      w_buy_h: 'Mondes à acheter', w_buy_p: 'Un quatrième monde pour une énergie, à acheter avec ton or.', w_buy_p0: 'Un quatrième monde pour une énergie. Il s’achète avec ton or, avec Premium.', w_buy_set: '{w} choisi pour {mood}.',
      wt_sanctuary: 'Saule, pont de pierre et nénuphars', wt_abyss: 'Les profondeurs, la lumière qui descend', world_sanctuary: 'Sanctuaire', world_abyss: 'Abysses',
      world_sanctuary_d: 'Pour Épuisé. Un jardin sous la lune : un saule, un pont de pierre, un nénuphar qui s’ouvre à chaque session, et le cadran lotus. 1 500 pièces, avec Premium.', world_abyss_d: 'Pour Stable. Les profondeurs et le cadran de plongée, avec sa jauge de profondeur sur la session. 1 500 pièces, avec Premium.',
      cat_light: 'Thèmes clairs', cat_worlds: 'Mondes', w_light_h: 'Mondes clairs', w_light_p: 'Un troisième monde pour chaque énergie. Touche « Aperçu » pour le découvrir.',
      w_free_h: 'Mondes inclus', w_free_p: 'Un monde de jour et un monde de nuit pour chaque énergie, offerts.', w_preview: 'Aperçu', w_new: 'Nouveau',
      w_try: 'Essayer 1 minute', w_unlock: 'Débloquer avec Premium', w_use: 'Utiliser les mondes clairs', w_soon: 'Premium arrive bientôt.', w_trying: 'Aperçu : {w} · 1 min', w_stop: 'Arrêter', w_trial_end: 'Fin de l’aperçu.',
      wt_aube: 'Encre, montagnes et brume', wt_atelier: 'La vieille ville dans la brume', wt_tokyo: 'La ville d’encre et de néons rouges', wt_cartouche: 'Pixels, collines et nuages',
      wf_aube_1: 'Un paysage à l’encre qui se voile pendant le focus', wf_aube_2: 'Des branches de prunier qui fleurissent en pause', wf_aube_3: 'Une goutte d’encre à chaque fin de session',
      wf_atelier_1: 'Le fleuve, le ciel qui suit l’heure et les saisons', wf_atelier_2: 'Une fenêtre s’allume à chaque session du jour', wf_atelier_3: 'La Gazette du soir : ta journée en une',
      wf_tokyo_1: 'Une ville qui s’allume avec tes tâches et tes sessions', wf_tokyo_2: 'Un chronographe à la place du minuteur', wf_tokyo_3: 'Des quêtes qui passent comme des affiches',
      wf_cartouche_1: 'Un monde en pixels qui défile doucement', wf_cartouche_2: 'Un petit marcheur qui somnole pendant le focus', wf_cartouche_3: 'Une carte par tâche quand tu es épuisé',
      wm_atelier_1: 'Focus : la brume monte', wm_atelier_2: 'Pause : la ville respire', wm_atelier_3: 'Fin : la cloche sonne',
      cat_seq: 'Costumes de cercle', seq_hint: 'Chaque cercle atteint débloque un costume pour ton familier. Il est à toi pour toujours.', seq_reach: 'Atteins le cercle {n}',
      cs_none: 'Sans costume', cs_none_d: 'Ton familier au naturel.', cs_won: 'Costume débloqué : {name}', unequip: 'Retirer',
      cs_seer: 'Foulard d’or', cs_clown: 'Bouffon', cs_magician: 'Prestidigitateur', cs_scholar: 'Savant', cs_bizarro: 'Couronne d’orbes', cs_miracle: 'Auréole', cs_fool: 'Manteau d’étoiles',
      cs_seer_d: 'Foulard pourpre, pièces d’or et troisième œil.', cs_clown_d: 'Fraise, nez rouge et chapeau pointu.', cs_magician_d: 'Haut-de-forme, nœud papillon et cape.',
      cs_faceless_d: 'Un masque lisse. Qui est vraiment derrière ?', cs_marionettist_d: 'Une croix de bois et des fils invisibles.', cs_bizarro_d: 'Diadème d’orbes et filaments violets.',
      cs_scholar_d: 'Toque de savant et monocle d’or.', cs_miracle_d: 'Auréole dorée et rayons de lumière.', cs_attendant_d: 'Capuche grise, étoile d’or et brume.', cs_fool_d: 'Haut-de-forme étoilé, cape de nuit et brume.',
    },
    en: {
      shop: 'Shop', gold_n: '{n} gold', buy: 'Buy', equip: 'Equip', equipped: 'Equipped', owned: 'owned', use: 'Use', not_enough: 'Not enough gold: you need {n} more ◈.',
      bought: '{name} bought', shop_hint: 'You earn 1 gold per 4 XP (half for daily quests). Potions get used up; cosmetics are yours forever.',
      cat_hats: 'Hats', cat_rings: 'Seal ring', cat_bursts: 'End-of-session effect', cat_familiars: 'Familiars', cat_potions: 'Potions',
      hat_wizard: "Merlin's hat", hat_wizard_d: 'The classic, monocle included.',
      hat_tophat: "The Fool's top hat", hat_tophat_d: 'Victorian elegance above the gray fog.',
      hat_hood: 'Shadow hood', hat_hood_d: 'A face in shadow. Only the monocle glints.',
      hat_crown: 'Astral crown', hat_crown_d: 'For those who climbed the Circles.',
      hat_neon: 'Neon hat', hat_neon_d: 'The band pulses with network colors.',
      ring_default: 'Original seal', ring_default_d: 'The theme colors.',
      ring_gold: 'Golden seal', ring_gold_d: 'Solid gold segments.',
      ring_blood: 'Scarlet seal', ring_blood_d: 'The red moon is watching.',
      ring_spectre: 'Spectral seal', ring_spectre_d: 'A cold white light.',
      ring_aurora: 'Aurora seal', ring_aurora_d: 'Colors keep turning.',
      burst_theme: 'Theme effect', burst_theme_d: 'Changes with your mood.',
      burst_coins: 'Coin shower', burst_coins_d: 'Jackpot every session.',
      burst_confetti: 'Confetti', burst_confetti_d: 'Just a party.',
      burst_stars: 'Shooting stars', burst_stars_d: 'A constellation bursts.',
      pot_seal: 'Streak seal', pot_seal_d: "Protects your streak on a day you don't work. Used automatically.",
      pot_elixir: 'Focus elixir', pot_elixir_d: '+50% XP on your next session.',
      pot_scroll: 'Quest scroll', pot_scroll_d: 'Swap a daily quest (↻ button on the quest).',
      cat_skins: 'Character skins (Sport)', premium_only: 'Premium only',
      skin_classic: 'Classic', skin_classic_d: 'The theme colors.', skin_runic: 'Rune circle', skin_runic_d: 'A ring of runes turns around your hexagon.',
      skin_parchment: 'Parchment', skin_parchment_d: 'Your character in ink, on an old grimoire.', skin_gold: 'Royal gold', skin_gold_d: 'Every muscle shines like a trophy.',
      skin_ember: 'Embers', skin_ember_d: 'Fire red, for Beast mode days.', skin_holo: 'Holographic', skin_holo_d: 'Colors that never stop turning.', skin_astral: 'Astral', skin_astral_d: 'Your body drawn in a starry sky.',
      hat_witch: "Witch's hat", hat_witch_d: 'Crooked tip, mystery guaranteed.',
      ring_emerald: 'Emerald seal', ring_emerald_d: 'The deep green of ancient forests.',
      burst_sakura: 'Sakura petals', burst_sakura_d: 'A shower of cherry blossoms, very zen.',
      pot_midas: 'Midas potion', pot_midas_d: 'Doubles the gold earned on your next 100 XP.', midas_on: 'Midas active: {n} more XP at double gold',
      elixir_on: 'Elixir active: +50% on the next session', elixir_used: 'Elixir', seal_used: 'A Streak seal protected yesterday’s streak.', in_stock: 'In stock: {n}',
      w_buy_h: 'Worlds to buy', w_buy_p: 'A fourth world for one energy, bought with your gold.', w_buy_p0: 'A fourth world for one energy. Bought with your gold, with Premium.', w_buy_set: '{w} set for {mood}.',
      wt_sanctuary: 'Willow, stone bridge and water lilies', wt_abyss: 'The deep, light coming down', world_sanctuary: 'Sanctuary', world_abyss: 'Abyss',
      world_sanctuary_d: 'For Drained. A moon garden: a willow, a stone bridge, a water lily that opens with each session, and the lotus dial. 1,500 gold, with Premium.', world_abyss_d: 'For Steady. The deep and the dive watch dial, with its depth gauge over the session. 1,500 gold, with Premium.',
      cat_light: 'Light themes', cat_worlds: 'Worlds', w_light_h: 'Light worlds', w_light_p: 'A third world for every energy. Tap “Preview” to see it.',
      w_free_h: 'Included worlds', w_free_p: 'A day world and a night world for every energy, free.', w_preview: 'Preview', w_new: 'New',
      w_try: 'Try for 1 minute', w_unlock: 'Unlock with Premium', w_use: 'Use the light worlds', w_soon: 'Premium is coming soon.', w_trying: 'Preview: {w} · 1 min', w_stop: 'Stop', w_trial_end: 'Preview over.',
      wt_aube: 'Ink, mountains and mist', wt_atelier: 'The old city in the mist', wt_tokyo: 'The city of ink and red neon', wt_cartouche: 'Pixels, hills and clouds',
      wf_aube_1: 'An ink landscape that veils itself during focus', wf_aube_2: 'Plum branches that blossom on a pause', wf_aube_3: 'A drop of ink at every session’s end',
      wf_atelier_1: 'The river, a sky that follows the hour and the seasons', wf_atelier_2: 'A window lights up for every session of the day', wf_atelier_3: 'The Evening Gazette: your day on the front page',
      wf_tokyo_1: 'A city that lights up with your tasks and sessions', wf_tokyo_2: 'A chronograph instead of the timer', wf_tokyo_3: 'Quests that pass by like posters',
      wf_cartouche_1: 'A pixel world scrolling gently by', wf_cartouche_2: 'A little walker who dozes during focus', wf_cartouche_3: 'One card per task when you’re drained',
      wm_atelier_1: 'Focus: the fog rises', wm_atelier_2: 'Pause: the city breathes', wm_atelier_3: 'End: the bell rings',
      cat_seq: 'Circle costumes', seq_hint: 'Every Circle you reach unlocks a costume for your familiar. It’s yours forever.', seq_reach: 'Reach Circle {n}',
      cs_none: 'No costume', cs_none_d: 'Your familiar as it is.', cs_won: 'Costume unlocked: {name}', unequip: 'Remove',
      cs_seer: 'Gold scarf', cs_clown: 'Jester', cs_magician: 'Stage magician', cs_scholar: 'Scholar', cs_bizarro: 'Orb circlet', cs_miracle: 'Halo', cs_fool: 'Star cloak',
      cs_seer_d: 'Purple headscarf, gold coins and a third eye.', cs_clown_d: 'Ruff, red nose and pointy hat.', cs_magician_d: 'Top hat, bow tie and cape.',
      cs_faceless_d: 'A smooth mask. Who is really behind it?', cs_marionettist_d: 'A wooden cross and invisible strings.', cs_bizarro_d: 'A circlet of orbs and violet tendrils.',
      cs_scholar_d: 'Scholar’s cap and golden monocle.', cs_miracle_d: 'Golden halo and rays of light.', cs_attendant_d: 'Gray hood, golden star and mist.', cs_fool_d: 'Starred top hat, night cape and mist.',
    },
  });

  const TREE_FREE = ['lf_season', 'br_bark', 'fl_gold', 'hg_none', 'gd_grass', 'sk_dusk'];
  ML.defaults(() => ({
    econ: {
      gold: 0,
      owned: { hat: ['wizard'], ring: ['default'], burst: ['theme'], familiar: ['owl'], skin: ['classic'], costume: [], dial: ['lotus', 'diver', 'spell', 'city', 'valley', 'worldtone', 'veil', 'incant'], tree: TREE_FREE.slice() },
      equip: { hat: 'wizard', ring: 'default', burst: 'theme', familiar: 'owl', skin: 'classic', costume: 'none', dial: 'lotus', dialAbyss: 'diver', deepSorcerer: 'spell', bgNeon: 'city', arcadeSet: 'valley', arcadePal: 'worldtone', dialFog: 'veil', deepFog: 'incant', treeSkin: 'oak', treeLeaf: 'lf_season', treeBark: 'br_bark', treeFlower: 'fl_gold', treeHang: 'hg_none', treeGround: 'gd_grass', treeSky: 'sk_dusk' },
      potions: { seal: 0, elixir: 0, scroll: 0 }, elixir: false, frozen: [], lastCheck: null,
    },
  }));

  const CATALOG = {
    hat: { wizard: 0, tophat: 300, hood: 250, witch: 350, neon: 400, crown: 600 },
    ring: { default: 0, gold: 200, blood: 200, spectre: 250, emerald: 250, aurora: 450 },
    burst: { theme: 0, coins: 200, confetti: 200, stars: 250, sakura: 280 },
    familiar: { owl: 0, cat: 300, raven: 300, fox: 400, hippo: 10000 },
    potion: { seal: 150, elixir: 80, scroll: 40, midas: 120 },
    skin: { classic: 0, runic: 350, parchment: 300, gold: 450, ember: 300, holo: 600, astral: 800 },
    island: { orbit: 900, pavilion: 900, fragment: 900, void: 900, keep: 900, pier: 900, coupe: 600, navette: 600 }, // the mage island's shop islands and the Ville néon's flying cars (island.js, 3.81)
    world: { abyss: 1500, sanctuary: 1500 }, // 3.74: the old Drained energy's worlds, a fourth world for Steady / Drained (Premium)
    dial: { lotus: 0, moon: 300, diver: 0, nautilus: 300, jelly: 300, spell: 0, circle: 400, city: 0, supercar: 600, valley: 0, pier: 1200, orbit: 900, worldtone: 0, redcream: 300, veil: 0, rose: 800, skeleton: 1200, incant: 0, door: 500 }, // world dials: the Sanctuaire's two (3.42), the Abysses' three (3.43); the Cyber sorcier's two full screens (3.48); the Ville néon's two backgrounds (3.49); the Arcade's three sets (background + dial + palette) and a palette (3.51)
    tree: { lf_season: 0, lf_sakura: 250, lf_ember: 250, lf_jade: 250, lf_silver: 300, lf_violet: 300, lf_gold: 400, br_bark: 0, br_ash: 200, br_ebony: 200, br_ember: 250, br_verdigris: 250, br_gold: 400, fl_gold: 0, fl_plum: 200, fl_camellia: 250, fl_star: 350, hg_none: 0, hg_swing: 300, hg_birds: 350, hg_lanterns: 400, gd_grass: 0, gd_mush: 250, gd_stones: 300, gd_pond: 400, sk_dusk: 0, sk_night: 300, sk_dawn: 300, pine: 800, atlas: 800, coral: 800, crystal: 800, hanging: 800 }, // the year tree (tree.js): looks only, gold never buys growth. The last five are whole trees (3.63, 3.65). Premium gating comes with the Premium pass, not yet
  };
  const TREE_SLOT = { lf: 'treeLeaf', br: 'treeBark', fl: 'treeFlower', hg: 'treeHang', gd: 'treeGround', sk: 'treeSky' };
  const TREE_SKINS = ['pine', 'atlas', 'coral', 'crystal', 'hanging'];
  // Each world keeps its own equipped dial: the Sanctuaire's in equip.dial (as before 3.43), the Abysses' in equip.dialAbyss
  const DIAL_WORLD = { lotus: 'sanctuary', moon: 'sanctuary', diver: 'abyss', nautilus: 'abyss', jelly: 'abyss', spell: 'sorcerer', circle: 'sorcerer', city: 'neoncity', supercar: 'neoncity', valley: 'arcade', pier: 'arcade', orbit: 'arcade', worldtone: 'arcade', redcream: 'arcade', veil: 'fog', rose: 'fog', skeleton: 'fog', incant: 'fog', door: 'fog' };
  const SLOT = { abyss: 'dialAbyss', sorcerer: 'deepSorcerer', neoncity: 'bgNeon', arcade: 'arcadeSet', fog: 'dialFog' };
  const ITEM_SLOT = { worldtone: 'arcadePal', redcream: 'arcadePal', incant: 'deepFog', door: 'deepFog' }; // the Arcade's palettes go over its set
  const WORLD_ORDER = ['arcade', 'fog', 'sanctuary', 'abyss', 'sorcerer', 'neoncity']; // the shop shows world items world by world
  const slotOf = (cat, k) => (cat === 'island' ? ML.islandSlot(k) : cat === 'tree' ? (TREE_SKINS.includes(k) ? 'treeSkin' : TREE_SLOT[k.slice(0, 2)]) : cat !== 'dial' ? cat : ITEM_SLOT[k] || SLOT[DIAL_WORLD[k]] || cat);
  const PREMIUM_ONLY = { skin: ['holo', 'astral'], dial: ['pier', 'skeleton'], world: ['abyss', 'sanctuary'] }; // need a Premium account to buy
  const premOnly = (cat, k) => (PREMIUM_ONLY[cat] || []).includes(k);
  // Categories added after launch: older saves lack them (nested defaults only merge one level deep)
  function migrate() {
    const E = S.econ; if (!E) return;
    if (!E.owned.skin) E.owned.skin = ['classic']; if (!E.equip.skin) E.equip.skin = 'classic';
    if (!Array.isArray(E.owned.costume)) E.owned.costume = []; if (!E.equip.costume) E.equip.costume = 'none';
    if (!Array.isArray(E.owned.dial)) E.owned.dial = ['lotus']; if (!E.owned.dial.includes('lotus')) E.owned.dial.push('lotus'); if (!E.equip.dial) E.equip.dial = 'lotus';
    if (!E.owned.dial.includes('diver')) E.owned.dial.push('diver'); if (!E.equip.dialAbyss) E.equip.dialAbyss = 'diver';
    if (!E.owned.dial.includes('spell')) E.owned.dial.push('spell'); if (!E.equip.deepSorcerer) E.equip.deepSorcerer = 'spell';
    if (!E.owned.dial.includes('city')) E.owned.dial.push('city'); if (!E.equip.bgNeon) E.equip.bgNeon = 'city';
    for (const k of ['valley', 'worldtone']) if (!E.owned.dial.includes(k)) E.owned.dial.push(k);
    if (!E.equip.arcadeSet) E.equip.arcadeSet = 'valley'; if (!E.equip.arcadePal) E.equip.arcadePal = 'worldtone';
    if (!E.owned.dial.includes('veil')) E.owned.dial.push('veil'); if (!E.equip.dialFog) E.equip.dialFog = 'veil';
    if (!E.owned.dial.includes('incant')) E.owned.dial.push('incant'); if (!E.equip.deepFog) E.equip.deepFog = 'incant';
    if (!Array.isArray(E.owned.tree)) E.owned.tree = []; for (const k of TREE_FREE) { if (!E.owned.tree.includes(k)) E.owned.tree.push(k); const sl = TREE_SLOT[k.slice(0, 2)]; if (!E.equip[sl]) E.equip[sl] = k; }
    if (!E.equip.treeSkin) E.equip.treeSkin = 'oak';
    if (!Array.isArray(E.owned.world)) E.owned.world = [];
    if (!Array.isArray(E.owned.island)) E.owned.island = [];
    if (S.legacyDrained && !E.legacyWorlds) { for (const k of Object.keys(CATALOG.world)) if (!E.owned.world.includes(k)) E.owned.world.push(k); E.legacyWorlds = true; } // they had them free before 3.74
  }

  /* ---------- Circle costumes: earned by reaching each Circle, never lost ----------
     Stored as a plain list of keys, which the sync merges as a union (an unlock on one device survives
     whatever the other device did), and re-derived from XP so a costume can't go missing. */
  const csName = k => t('cs_' + k); // each costume has its own name since 3.76 (they used to carry the Sequence names)
  function grantCostumes(announce) {
    if (!S.econ || !ML.COSTUMES) return;
    migrate();
    if (S.econ.equip.costume && S.econ.equip.costume !== 'none' && !ML.COSTUMES.includes(S.econ.equip.costume)) { S.econ.equip.costume = 'none'; save(); } // a costume retired in 3.76
    const i = ML.seqInfo().i, have = S.econ.owned.costume, won = ML.COSTUMES.slice(0, i + 1).filter(k => !have.includes(k));
    if (!won.length) return;
    have.push(...won); save();
    if (!announce) return;
    const k = won[won.length - 1];
    toast(t('cs_won', { name: csName(k) }), { ms: 8000, action: { label: t('equip'), fn: () => { S.econ.equip.costume = k; save(); applyCosmetics(); } } });
  }
  // The app's author (ML.isOwner, app_metadata.owner on the Supabase account) owns every shop item but the potions;
  // everyone else buys them at the catalog price
  function ownerGifts() {
    if (!S.econ || !(ML.isOwner && ML.isOwner())) return;
    migrate(); let changed = false;
    for (const [cat, items] of Object.entries(CATALOG)) if (cat !== 'potion' && S.econ.owned[cat]) Object.keys(items).forEach(k => { if (!S.econ.owned[cat].includes(k)) { S.econ.owned[cat].push(k); changed = true; } });
    if (changed) save();
  }

  /* ---------- Gold ---------- */
  on('xp', n => {
    let g = Math.max(1, Math.ceil(n / 4 * (ML.xpGoldRate == null ? 1 : ML.xpGoldRate)));
    if (S.econ.midas > 0) { const part = Math.min(n, S.econ.midas); S.econ.midas -= part; g += Math.ceil(part / 4); } // Midas potion: double gold on the next 100 XP
    S.econ.gold += g; save(); renderGold();
    setTimeout(() => ML.floater && ML.floater('+' + g + ' ◈', 'gold'), 250);
  });
  // The chip says "Shop" for the first 14 days, so a new user knows what the coins are for
  const shopNamed = () => { if (!S.firstSeen) { S.firstSeen = Math.min(Date.now(), ...(S.sessions || []).map(s => s.at)); save(); } return Date.now() - S.firstSeen < 14 * 864e5; };
  function renderGold() { const el = $('gold-chip'); if (el) { el.innerHTML = `<span>◈</span><b>${S.econ.gold.toLocaleString(ML.locale())}</b>${shopNamed() ? `<em>${esc(t('shop'))}</em>` : ''}`; el.title = t('gold_n', { n: S.econ.gold }); } }
  // The shop opens on its window of shelves, or straight on a shelf (ML.openShop('tree')) or the tree's fitting room (ML.openShop('tree', 'fit'))
  function openShop(cat, view) {
    migrate(); ownerGifts(); grantCostumes(false);
    shelf = SHELVES.includes(cat) ? cat : null; fitting = shelf === 'tree' && view === 'fit'; filter = 'all'; tried = null; justBought = null;
    renderShop(); ML.openOverlay('shop'); $('shop-body').parentElement.scrollTop = 0;
  }
  $('gold-chip').onclick = () => openShop();
  ML.openShop = openShop;
  // End of a session: what the coins earned bring closer (the cheapest item not owned yet, among the ones with a name)
  ML.addStrings({ fr: { end_gold: '+{g} ◈', end_shop_near: 'Plus que {n} ◈ pour {name}', end_shop_can: 'Tu peux acheter {name}', end_shop_go: 'Voir la boutique' }, en: { end_gold: '+{g} ◈', end_shop_near: '{n} ◈ left for {name}', end_shop_can: 'You can buy {name}', end_shop_go: 'See the shop' } });
  function nextItem() {
    migrate();
    const PFX = { hat: 'hat_', ring: 'ring_', burst: 'burst_', familiar: 'fam_' }, all = [];
    for (const [cat, pfx] of Object.entries(PFX)) for (const [k, price] of Object.entries(CATALOG[cat])) if (price && k !== 'hippo' && !(S.econ.owned[cat] || []).includes(k)) all.push({ name: t(pfx + k), price });
    return all.sort((a, b) => a.price - b.price)[0];
  }
  const prevEnd = ML.endExtras;
  ML.endExtras = s => {
    const x = nextItem(), g = Math.floor((s.xp || 0) / 4), gold = S.econ.gold;
    const line = x ? `<button type="button" class="end-shop" data-end="shop"><span>${g ? `<b>${esc(t('end_gold', { g }))}</b> ` : ''}${esc(gold >= x.price ? t('end_shop_can', { name: x.name }) : t('end_shop_near', { n: x.price - gold, name: x.name }))}</span><small>${esc(t('end_shop_go'))}</small></button>` : '';
    return line + (prevEnd ? prevEnd(s) : '');
  };

  /* ---------- Cosmetics: hats (header logo), seal rings (timer), bursts (juice.js reads equip.burst) ---------- */
  const HATS = {
    wizard: { hat: 'M14 24 C17 16 19.5 9 28.5 3 C26.5 9.5 29 16 34 24 Z', band: 'M16.4 20.4 C21 21.6 27 21.6 31.9 20.4', brim: true },
    tophat: { hat: 'M16.5 23.5 L17.6 8.2 C17.7 6.9 18.6 6 19.9 6 L28.1 6 C29.4 6 30.3 6.9 30.4 8.2 L31.5 23.5 Z', band: 'M17.1 19.2 C21 20.1 27 20.1 30.9 19.2', brim: true },
    hood: { hat: 'M9 31 C9 14 15.5 3.5 24 3.5 C32.5 3.5 39 14 39 31 C35 27 30.5 25.6 24 25.6 C17.5 25.6 13 27 9 31 Z', band: '', brim: false },
    neon: { hat: 'M14 24 C17 16 19.5 9 28.5 3 C26.5 9.5 29 16 34 24 Z', band: 'M15.8 21 C21 22.4 27 22.4 32.4 21', brim: true },
    crown: { hat: 'M13.5 24 L15 10.5 L19.6 17 L24 7.5 L28.4 17 L33 10.5 L34.5 24 Z', band: 'M14.6 20.6 H33.4', brim: true },
    witch: { hat: 'M15 24 C18 18 19 12 21 8 C22.5 5 26 2.5 31 2 C27.5 4.5 26.5 7 27 10 C27.6 15 30 20 33 24 Z', band: 'M16.6 20.8 C21 22 27 22 31.6 20.8', brim: true },
  };
  function applyHat(root = document) {
    const h = HATS[S.econ.equip.hat] || HATS.wizard;
    root.querySelectorAll('.logo:not(.mini-logo)').forEach(svg => {
      svg.dataset.hat = S.econ.equip.hat;
      svg.querySelector('.lg-hat').setAttribute('d', h.hat);
      const band = svg.querySelector('.lg-band'); band.setAttribute('d', h.band || 'M0 0'); band.style.display = h.band ? '' : 'none';
      svg.querySelector('.lg-brim').style.display = h.brim ? '' : 'none';
    });
  }
  // Seal rings: a moving gradient on the minute ticks plus each seal's own ornament behind the dial
  const GRAD = {
    gold: ['#8a5a12', '#ffd36b', '#fff4c9', '#ffc247', '#8a5a12'], blood: ['#5c0716', '#ff3b5c', '#ff9aa9', '#c4142f', '#5c0716'],
    spectre: ['#6f86a8', '#eaf4ff', '#ffffff', '#b9d3f5', '#6f86a8'], emerald: ['#0b5a3a', '#2fd98a', '#c9ffe3', '#19b874', '#0b5a3a'],
    aurora: ['#ff4fd8', '#ffb547', '#3ee8e0', '#8a7dff', '#ff4fd8'],
  };
  // The seal gradient turns slowly, unless the system asks for reduced motion (SVG animation isn't stopped by CSS)
  const gradSpin = k => (ML.reducedMotion() ? '' : `<animateTransform attributeName="gradientTransform" type="rotate" from="0 120 120" to="360 120 120" dur="${k === 'aurora' ? 5 : 9}s" repeatCount="indefinite"/>`);
  on('motion', () => applyRing());
  const pt = (r, a) => [(120 + r * Math.cos(a)).toFixed(1), (120 + r * Math.sin(a)).toFixed(1)];
  const DECO = {
    gold: () => `<g class="sd-spin"><circle cx="120" cy="120" r="101" class="sd-line" stroke-dasharray="1 5"/>${[0, 1, 2, 3].map(i => { const [x, y] = pt(101, i * Math.PI / 2 - Math.PI / 2); return `<path class="sd-fill" d="M${x} ${+y - 4} l3 4 -3 4 -3 -4 Z"/>`; }).join('')}</g>`,
    blood: () => `<circle cx="120" cy="120" r="101" class="sd-line sd-pulse"/><g class="sd-moon"><circle cx="196" cy="40" r="11" class="sd-fill"/><circle cx="201" cy="36" r="10" class="sd-cut"/></g>`,
    spectre: () => `<g class="sd-ghost"><circle cx="120" cy="120" r="101" class="sd-line"/><circle cx="120" cy="120" r="104" class="sd-line" stroke-dasharray="30 18"/></g>`,
    emerald: () => `<g class="sd-spin slow">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, [x, y] = pt(101, a); return `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="1.6" class="sd-fill" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(0)} ${x} ${y})"/>`; }).join('')}</g>`,
    aurora: () => `<circle cx="120" cy="120" r="101" class="sd-halo"/>`,
  };
  function applyRing() {
    const card = $('sigil-card'), k = S.econ.equip.ring;
    Object.keys(CATALOG.ring).forEach(r => card.classList.toggle('ring-' + r, k === r && r !== 'default'));
    const svg = card.querySelector('svg.ring'); if (!svg) return;
    let deco = svg.querySelector('#seal-deco');
    if (!deco) { svg.insertAdjacentHTML('afterbegin', '<defs id="seal-defs"></defs><g id="seal-deco"></g>'); deco = svg.querySelector('#seal-deco'); }
    const g = GRAD[k];
    svg.querySelector('#seal-defs').innerHTML = g ? `<linearGradient id="rg-${k}" gradientUnits="userSpaceOnUse" x1="20" y1="20" x2="220" y2="220">${g.map((c, i) => `<stop offset="${i / (g.length - 1)}" stop-color="${c}"/>`).join('')}${gradSpin(k)}</linearGradient>` : '';
    if (g) svg.style.setProperty('--rg', `url(#rg-${k})`); else svg.style.removeProperty('--rg');
    deco.setAttribute('class', 'seal-deco sd-' + k);
    deco.innerHTML = DECO[k] ? DECO[k]() : '';
  }
  function applyCosmetics() { applyHat(); applyRing(); emit('cosmetics'); }

  /* ---------- Potions ---------- */
  // A Streak seal covers a missed yesterday when that would otherwise break an existing streak
  function checkSeal() {
    const E = S.econ, td = today();
    if (E.lastCheck === td) return;
    E.lastCheck = td;
    const y = addDays(td, -1), y2 = addDays(td, -2);
    const had = k => S.sessions.some(s => dayKey(new Date(s.at)) === k) || E.frozen.includes(k);
    if (!had(y) && had(y2) && E.potions.seal > 0) {
      E.potions.seal--; E.frozen.push(y);
      setTimeout(() => toast(t('seal_used'), { ms: 6000 }), 2500);
    }
    if (E.frozen.length > 200) E.frozen = E.frozen.slice(-200);
    save();
  }
  // Elixir: +50% on the next session, stacked on top of the mood buff
  const moodBonus = ML.sessionBonus;
  ML.sessionBonus = (s, xp) => {
    const b = moodBonus ? moodBonus(s, xp) : null;
    if (!S.econ.elixir || s.mins < 5) return b;
    S.econ.elixir = false; save();
    const extra = Math.round(xp * 0.5);
    return { xp: (b ? b.xp : 0) + extra, label: (b ? b.label + ' · ' : '') + t('elixir_used') + ' +50 %' };
  };

  /* ---------- Shop UI ---------- */
  const hatSvg = k => {
    const h = HATS[k];
    return `<svg class="logo mini-logo" data-hat="${k}" viewBox="0 0 48 48" aria-hidden="true"><path class="lg-hat" d="${h.hat}"/>${h.band ? `<path class="lg-band" d="${h.band}"/>` : ''}${h.brim ? '<ellipse class="lg-brim" cx="24" cy="24.6" rx="15.5" ry="3.1"/>' : ''}<path class="lg-chain" d="M23.6 33.4 C20.5 36.5 19 41 12.5 44.5"/><circle class="lg-lens" cx="29" cy="33" r="5.3"/></svg>`;
  };
  // A small working copy of the timer dial wearing the seal (three quarters lit)
  function ringPreview(k) {
    const g = GRAD[k], id = 'rgp-' + k;
    const ticks = Array.from({ length: 60 }, (_, i) => { const a = i / 60 * Math.PI * 2 - Math.PI / 2, r1 = i % 5 ? 86 : 83, [x1, y1] = pt(r1, a), [x2, y2] = pt(95, a); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${i < 45 ? 'on' : 'off'}"/>`; }).join('');
    return `<svg class="ring-prev sigil-${k}" viewBox="0 0 240 240" aria-hidden="true" ${g ? `style="--rg:url(#${id})"` : ''}>${g ? `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="20" y1="20" x2="220" y2="220">${g.map((c, i) => `<stop offset="${i / (g.length - 1)}" stop-color="${c}"/>`).join('')}${gradSpin(k)}</linearGradient></defs>` : ''}
      <g class="seal-deco sd-${k}">${DECO[k] ? DECO[k]() : ''}</g><g class="rp-ticks">${ticks}</g><circle cx="120" cy="120" r="60" class="rp-core"/></svg>`;
  }
  const preview = (cat, k) => {
    if (cat === 'hat') return hatSvg(k);
    if (cat === 'ring') return ringPreview(k);
    if (cat === 'burst') return `<span class="burst-swatch">${{ theme: '✦', coins: '◈', confetti: '▚', stars: '★', sakura: '❀' }[k]}</span>`;
    if (cat === 'familiar') return ML.familiarSvg ? ML.familiarSvg(k, 'idle') : '';
    if (cat === 'skin') return ML.sportSkinPreview ? ML.sportSkinPreview(k) : '';
    if (cat === 'tree') return ML.treePrev ? ML.treePrev(k) : '';
    if (cat === 'island') return `<img class="isl-prev" data-isl="${k}" alt="">`;
    if (cat === 'world') return `<span class="world-art">${ML.worldArt ? ML.worldArt(k) : ''}${k === 'sanctuary' ? '<img src="world-sanctuary.jpg" alt="" loading="lazy">' : ''}</span>`;
    if (cat === 'dial') { const f = { abyss: ML.abyssDialSvg, sorcerer: ML.sorcererDeepSvg, neoncity: ML.neonShopPic, arcade: ML.arcadeShopPic, fog: ML.fogShopPic }[DIAL_WORLD[k]] || ML.sanctuaryDialSvg; return f ? f(k) : ''; }
    return `<span class="burst-swatch">${{ seal: '⛨', elixir: '⚗', scroll: '📜', midas: '♛' }[k]}</span>`;
  };
  const label = (cat, k) => cat === 'familiar' ? t('fam_' + k) : t((cat === 'potion' ? 'pot' : cat) + '_' + k);
  const desc = (cat, k) => cat === 'familiar' ? t('fam_' + k + '_d') : t((cat === 'potion' ? 'pot' : cat) + '_' + k + '_d');
  // Price sets the card's rarity frame, like task rarity: common / rare / epic / legendary
  const tier = p => (p <= 150 ? 'common' : p <= 300 ? 'rare' : p <= 500 ? 'epic' : 'legendary');
  const coin = (n, short) => `<span class="coin-pill ${short ? 'short' : ''}"><i>◈</i>${n.toLocaleString(ML.locale())}</span>`;
  // The shop's state: which shelf is open (null = the window of shelves), the filter, the tree's fitting room and what is being tried on it
  let justBought = null, shelf = null, filter = 'all', fitting = false, tried = null, fitTab = 'leaf';
  const SHELVES = ['tree', 'worlds', 'island', 'dial', 'familiar', 'seq', 'hat', 'ring', 'burst', 'potion']; // (character skins went with the Sport section, set aside in 3.25)
  const SHELF_NAME = { tree: 'cat_tree', worlds: 'cat_worlds', island: 'cat_islands', dial: 'cat_dials', familiar: 'cat_familiars', seq: 'cat_seq', hat: 'cat_hats', ring: 'cat_rings', burst: 'cat_bursts', potion: 'cat_potions' };
  ML.addStrings({
    fr: { sh_shelves: 'Rayons', sh_back: 'Rayons', sh_all: 'Tout', sh_tobuy: 'À acheter', sh_owned: 'Possédés', sh_count: '{a} sur {b}', sh_your_tree: 'Ton arbre', sh_your_tree_d: 'Essaie des feuilles, des branches, des fleurs, un sol et un ciel sur ton chêne avant d’acheter.', sh_try: 'Essayer',
      sh_other_trees: 'Autres arbres', sh_world_trees: 'Les arbres des mondes ne s’achètent pas : ils se gagnent dans l’onglet Arbre, après 25 h dans leur monde.', sh_trying: 'À l’essai', sh_free: 'Rien n’est dépensé.', sh_try_hint: 'Touche une option pour l’essayer sur ton arbre.', sh_cancel: 'Annuler', sh_buy_n: 'Acheter', sh_use: 'Utiliser',
      sh_none: 'Rien ici avec ce filtre.', sh_prev: 'Article précédent', sh_next: 'Article suivant', sh_play: 'Voir l’effet', sh_with: 'Avec ton costume', sh_oak_only: 'Le chêne porte tout ; les autres arbres de base prennent les feuilles, les branches et les fleurs.', sh_bought_n: '{n} articles achetés', sh_xp: '{n} XP',
      ft_leaf: 'Feuilles', ft_bark: 'Branches', ft_flower: 'Fleurs', ft_hang: 'Dans l’arbre', ft_ground: 'Sol', ft_sky: 'Ciel' },
    en: { sh_shelves: 'Shelves', sh_back: 'Shelves', sh_all: 'All', sh_tobuy: 'To buy', sh_owned: 'Owned', sh_count: '{a} of {b}', sh_your_tree: 'Your tree', sh_your_tree_d: 'Try leaves, branches, flowers, a ground and a sky on your oak before buying.', sh_try: 'Try on',
      sh_other_trees: 'Other trees', sh_world_trees: 'World trees aren’t sold: you earn them in the Tree tab, after 25 h in their world.', sh_trying: 'Trying on', sh_free: 'Nothing is spent.', sh_try_hint: 'Tap an option to try it on your tree.', sh_cancel: 'Cancel', sh_buy_n: 'Buy', sh_use: 'Use',
      sh_none: 'Nothing here with this filter.', sh_prev: 'Previous item', sh_next: 'Next item', sh_play: 'See the effect', sh_with: 'With your costume', sh_oak_only: 'The oak wears everything; the other base trees take leaves, branches and flowers.', sh_bought_n: '{n} items bought', sh_xp: '{n} XP',
      ft_leaf: 'Leaves', ft_bark: 'Branches', ft_flower: 'Flowers', ft_hang: 'In the tree', ft_ground: 'Ground', ft_sky: 'Sky' },
  });
  // Light skins (Premium, not bought with gold): one per mood, switched on from here or the sun / moon button
  const LIGHTS = [['steady', 'atelier'], ['fired', 'tokyo'], ['scattered', 'cartouche']]; // Washi (aube) set aside with the old Drained energy (3.74)
  function lightSection() {
    const prem = ML.isPremium && ML.isPremium(), dn = S.dayNight;
    const acts = prem ? `<div class="light-acts">
        <button type="button" class="small ${dn === 'autolight' ? 'primary' : ''}" data-light="autolight">${esc(t('dn_autolight'))}</button>
        <button type="button" class="small ${dn === 'light' ? 'primary' : ''}" data-light="light">${esc(t('dn_light'))}</button>
        ${dn === 'light' || dn === 'autolight' ? `<button type="button" class="small ghost" data-light="auto">${esc(t('dn_auto'))}</button>` : ''}</div>`
      : '';
    // Each light world shows a real picture of it (world-<key>.jpg, at the app's root; the drawn mini-card stays
    // underneath in case the picture can't load, e.g. in the artifact); "Preview" opens its sheet
    return `<h3 class="shop-h" id="shop-worlds">${esc(t('w_light_h'))}<span class="prem-badge">Premium</span></h3><p class="hint">${esc(t('w_light_p'))}</p>${acts}
      <div class="world-grid">${LIGHTS.map(([m, k]) => `<div class="world-card">
        <button type="button" class="world-pic" data-world="${k}" aria-label="${esc(t('w_preview') + ' · ' + t('th_light_' + k))}"><span class="light-prev lp-${k}"></span><img src="world-${k}.jpg" alt="" loading="lazy">
          ${k === 'atelier' ? `<span class="world-new">${esc(t('w_new'))}</span>` : ''}${prem ? '' : '<span class="world-lock">🔒 Premium</span>'}</button>
        <b>${esc(t('th_light_' + k))}</b><small>${esc(t('mood_' + m))} · ${esc(t('wt_' + k))}</small>
        <button type="button" class="small" data-world="${k}">${esc(t('w_preview'))}</button></div>`).join('')}</div>
      <h3 class="shop-sub">${esc(t('w_free_h'))}</h3><p class="hint">${esc(t('w_free_p'))}</p>
      <div class="world-free">${FREE.map(([m, k]) => `<span><img src="world-${k}.jpg" alt="" loading="lazy"><small>${esc(t('th_' + k))}</small></span>`).join('')}</div>`;
  }
  const FREE = [['steady', 'observatory'], ['fired', 'netrunner'], ['scattered', 'arcade']];
  // The worlds sold for gold (Premium): the energy they belong to, and putting one on
  const WORLD_MOOD = k => Object.keys(ML.EXTRA_WORLD || {}).find(m => ML.EXTRA_WORLD[m] === k);
  const worldOn = k => { const m = WORLD_MOOD(k), p = m && ML.worldPick(m); return !!p && p.w === 'extra'; };
  function useWorld(k) {
    const m = WORLD_MOOD(k); if (!m || !ML.setWorld) return;
    ML.setWorld(m, { w: 'extra', clock: (ML.worldPick(m) || {}).clock }, m !== S.mood);
    if (m !== S.mood) toast(t('w_buy_set', { w: t('th_' + k), mood: t('mood_' + m) }), { ms: 4000 });
  }
  function buySection() {
    const prem = isPrem(), E = S.econ;
    return `<h3 class="shop-h">${esc(t('w_buy_h'))}<span class="prem-badge">Premium</span></h3><p class="hint">${esc(t(prem ? 'w_buy_p' : 'w_buy_p0'))}</p>
      <div class="world-grid">${Object.keys(CATALOG.world).map(k => { const m = WORLD_MOOD(k), own = E.owned.world.includes(k), on = own && worldOn(k), price = CATALOG.world[k];
        return `<div class="world-card"><button type="button" class="world-pic" data-item="world:${k}" aria-label="${esc(t('th_' + k))}">${preview('world', k)}${prem || own ? '' : `<span class="world-lock">${esc(t('premium_only'))}</span>`}</button>
        <b>${esc(t('th_' + k))}</b><small>${esc(t('mood_' + m))} · ${esc(t('wt_' + k))}</small>
        ${on ? `<button type="button" class="small" disabled>${esc(t('equipped'))}</button>` : own ? `<button type="button" class="small primary" data-equip="world:${k}">${esc(t('equip'))}</button>`
          : `<button type="button" class="small" data-item="world:${k}">${prem ? coin(price, E.gold < price) : esc(t('w_preview'))}</button>`}</div>`; }).join('')}</div>`;
  }
  // The world sheet: big picture, its moments (when we have them), what it brings, and Try / Unlock (or Use)
  const MOMENTS = { atelier: ['focus', 'pause', 'fin'] };
  const wsh = document.createElement('div');
  wsh.className = 'overlay world-ov'; wsh.id = 'world'; wsh.hidden = true;
  document.body.appendChild(wsh);
  function openWorld(k) {
    const prem = ML.isPremium && ML.isPremium(), name = t('th_light_' + k), mom = MOMENTS[k];
    wsh.innerHTML = `<div class="sheet world-sheet" role="dialog" aria-modal="true" aria-labelledby="world-h">
      <div class="sheet-head"><h2 id="world-h">${esc(name)} · ${esc(t('wt_' + k))}</h2><button type="button" class="ghost icon-only" data-close="world" aria-label="${esc(t('close'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="world-hero"><span class="light-prev lp-${k}"></span><img src="world-${k}.jpg" alt=""></div>
      ${mom ? `<div class="world-moments">${mom.map((m, i) => `<figure><img src="world-${k}-${m}.jpg" alt="" loading="lazy"><figcaption>${esc(t('wm_' + k + '_' + (i + 1)))}</figcaption></figure>`).join('')}</div>` : ''}
      <ul class="world-feats">${[1, 2, 3].map(i => `<li>${esc(t('wf_' + k + '_' + i))}</li>`).join('')}</ul>
      <div class="world-cta">${prem ? `<button type="button" class="primary" data-wuse="${k}">${esc(t('w_use'))}</button>`
        : `<button type="button" data-wtry="${k}">${esc(t('w_try'))}</button><button type="button" class="primary" data-wunlock="1">${esc(t('w_unlock'))}</button>`}</div></div>`;
    wsh.querySelectorAll('img').forEach(i => i.addEventListener('error', () => i.remove()));
    ML.openOverlay('world');
  }
  wsh.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.wtry) {
      const m = LIGHTS.find(([, k]) => k === b.dataset.wtry)[0];
      ML.closeOverlay('world'); ML.closeOverlay('shop');
      ML.tryWorld(m, 60000);
      toast(t('w_trying', { w: t('th_light_' + b.dataset.wtry) }), { ms: 60000, key: 'trial', action: { label: t('w_stop'), fn: () => ML.endTrial() } });
    } else if (b.dataset.wuse) {
      const m = (LIGHTS.find(x => x[1] === b.dataset.wuse) || [])[0]; // this world for its own energy only
      if (m && ML.setWorld) ML.setWorld(m, { w: 'light', clock: (ML.worldPick(m) || {}).clock });
      ML.closeOverlay('world'); renderShop();
    } else if (b.dataset.wunlock) toast(t('w_soon'));
  });
  on('trial:end', () => toast(t('w_trial_end'), { key: 'trial', ms: 2500 }));
  /* ---------- Shop UI (3.65): a window of shelves (R2), short tiles that open a sheet (D1), the tree's fitting room (T1),
     a filter (X1), and the sheet as a try-on: the item worn with what you have, arrows to go through the shelf (X3). Nothing is spent before Buy. ---------- */
  const isPrem = () => !!(ML.isPremium && ML.isPremium());
  const FILTERED = ['tree', 'island', 'dial', 'familiar', 'hat', 'ring', 'burst'];
  // Every shelf as a list of [cat, key]. Costumes are earned with the Sequences, never bought
  function itemsOf(c) {
    if (c === 'seq') return ['none', ...(ML.COSTUMES || [])].map(k => ['costume', k]);
    if (c === 'tree') return TREE_SKINS.map(k => ['tree', k]);
    if (c === 'island') return Object.keys(CATALOG.island).filter(k => { const w = ML.ISLAND_WORLD[k]; return !CATALOG.world[w] || (S.econ.owned.world || []).includes(w); }).map(k => ['island', k]);
    if (c === 'dial') return WORLD_ORDER.filter(w => !CATALOG.world[w] || (S.econ.owned.world || []).includes(w)).flatMap(w => Object.keys(CATALOG.dial).filter(k => DIAL_WORLD[k] === w)).map(k => ['dial', k]);
    return Object.keys(CATALOG[c] || {}).map(k => [c, k]);
  }
  function stateOf(cat, k) {
    const E = S.econ;
    if (cat === 'costume') { const own = k === 'none' || E.owned.costume.includes(k); return { own, eq: (E.equip.costume || 'none') === k, price: 0, seq: (ML.COSTUMES || []).indexOf(k) }; }
    const price = CATALOG[cat][k];
    if (cat === 'potion') return { own: false, eq: false, price };
    const own = (E.owned[cat] || []).includes(k);
    if (cat === 'world') return { own, eq: own && worldOn(k), price, locked: !own && !isPrem() };
    return { own, eq: own && E.equip[slotOf(cat, k)] === k, price, locked: !own && premOnly(cat, k) && !isPrem() };
  }
  const passes = (cat, k) => { if (filter === 'all') return true; const st = stateOf(cat, k); return filter === 'own' ? st.own : !st.own; };
  const shelfList = c => itemsOf(c).filter(([a, k]) => !FILTERED.includes(c) || passes(a, k));
  const nameOf = (cat, k) => (cat === 'costume' ? (k === 'none' ? t('cs_none') : csName(k)) : label(cat, k));
  const descOf = (cat, k) => { if (cat !== 'costume') return desc(cat, k); const st = stateOf(cat, k); return st.own ? t('cs_' + k + '_d') : t('seq_reach', { n: st.seq + 1 }); };
  const picOf = (cat, k) => (cat === 'costume' ? (ML.costumeSvg ? ML.costumeSvg(k === 'none' ? null : k) : '') : preview(cat, k));
  const goldNow = () => S.econ.gold.toLocaleString(ML.locale());

  /* The window: one big picture per shelf */
  const shelfPic = c => ({ tree: '<img class="tree-prev" data-tp="skin:oak" alt="">', worlds: '<img src="world-atelier.jpg" alt="" loading="lazy">', island: preview('island', 'orbit'), dial: preview('dial', 'nautilus'), familiar: preview('familiar', 'fox'), seq: picOf('costume', (ML.COSTUMES || [])[2] || 'none'), hat: hatSvg('crown'), ring: ringPreview('aurora'), burst: '<span class="burst-swatch">★</span>', potion: '<span class="burst-swatch">⚗</span>' }[c] || '');
  function countOf(c) {
    if (c === 'worlds') return String(LIGHTS.length + FREE.length + Object.keys(CATALOG.world).length);
    const list = c === 'tree' ? Object.keys(CATALOG.tree).map(k => ['tree', k]) : itemsOf(c);
    if (c === 'potion') return String(list.length);
    return t('sh_count', { a: list.filter(([a, k]) => stateOf(a, k).own).length, b: list.length });
  }
  const home = () => `<div class="shop-top"><div class="shop-gold"><span>◈</span><b>${goldNow()}</b></div><p class="hint">${esc(t('shop_hint'))}</p></div>
    <div class="shop-shelves">${SHELVES.map(c => `<button type="button" class="shop-shelf" data-shelf="${c}"><span class="pic">${shelfPic(c)}</span><span class="nm"><b>${esc(t(SHELF_NAME[c]))}</b><small>${esc(countOf(c))}</small></span></button>`).join('')}</div>`;
  const bar = (title, back) => `<div class="shop-bar"><button type="button" class="shop-back" data-back>‹ ${esc(back || t('sh_back'))}</button><b>${esc(title)}</b><span class="gold"><span>◈</span><b>${goldNow()}</b></span></div>`;
  const filters = () => `<div class="chips shop-filter" role="group">${[['all', 'sh_all'], ['buy', 'sh_tobuy'], ['own', 'sh_owned']].map(([f, l]) => `<button type="button" class="chip-btn" data-filter="${f}" aria-pressed="${filter === f}">${esc(t(l))}</button>`).join('')}</div>`;

  /* A shelf: short tiles (picture, name, price or state) */
  function tile(cat, k) {
    const E = S.econ, st = stateOf(cat, k), short = !st.own && E.gold < st.price, tr = st.price ? tier(st.price) : 'common';
    const tag = cat === 'potion' ? coin(st.price, short) + (E.potions[k] ? ` <small>× ${E.potions[k]}</small>` : '')
      : st.eq ? `<span class="eq-tag">${esc(t('equipped'))}</span>`
      : st.own ? `<small class="own-tag">${esc(t('owned'))}</small>`
      : cat === 'costume' ? `<small>${esc(t('sh_xp', { n: (ML.SEQUENCES[st.seq] || [0])[0].toLocaleString(ML.locale()) }))}</small>`
      : st.locked ? `<small>${esc(t('premium_only'))}</small>` : coin(st.price, short);
    return `<button type="button" class="shop-tile t-${tr} ${st.eq ? 'is-eq' : ''} ${cat === 'costume' && !st.own ? 'locked' : ''} ${cat !== 'potion' && short ? 'poor' : ''} ${justBought === cat + ':' + k ? 'just' : ''}" data-item="${cat}:${k}"><span class="shop-prev">${picOf(cat, k)}</span><b>${esc(nameOf(cat, k))}</b>${tag}</button>`;
  }
  function shelfView(c) {
    if (c === 'worlds') return bar(t('cat_worlds')) + buySection() + lightSection();
    const list = shelfList(c), tiles = l => `<div class="shop-tiles">${l.map(([a, k]) => tile(a, k)).join('')}</div>`;
    let grid = c === 'dial' || c === 'island' ? (c === 'island' ? ['observatory', 'sanctuary', 'netrunner', 'sorcerer', 'neoncity', 'arcade'] : WORLD_ORDER).map(w => { const l = list.filter(([, k]) => (c === 'island' ? ML.ISLAND_WORLD[k] : DIAL_WORLD[k]) === w); return l.length ? `<h4 class="shop-world">${esc(t('th_' + w))}</h4>${tiles(l)}` : ''; }).join('') : tiles(list);
    if (!list.length) grid = `<p class="hint">${esc(t('sh_none'))}</p>`;
    const hint = c === 'dial' ? t('dial_hint') : c === 'seq' ? t('seq_hint') : '';
    const hero = c === 'tree' ? `<button type="button" class="shop-hero" data-fit><span class="shop-prev"><img class="tree-prev" data-tp="skin:oak" alt=""></span><span><b>${esc(t('sh_your_tree'))}</b><small>${esc(t('sh_your_tree_d'))}</small><i>${esc(t('sh_try'))}</i></span></button><h4 class="shop-world">${esc(t('sh_other_trees'))}</h4>` : '';
    return bar(t(SHELF_NAME[c])) + (FILTERED.includes(c) ? filters() : '') + (hint ? `<p class="hint">${esc(hint)}</p>` : '') + hero + grid + (c === 'tree' ? `<p class="hint">${esc(t('sh_world_trees'))}</p>` : '');
  }

  /* T1: the tree's fitting room. Trying changes a copy only; leaving without buying leaves the tree as it was */
  const FIT = [['leaf', 'lf', 'treeLeaf'], ['bark', 'br', 'treeBark'], ['flower', 'fl', 'treeFlower'], ['hang', 'hg', 'treeHang'], ['ground', 'gd', 'treeGround'], ['sky', 'sk', 'treeSky']];
  const SWATCH = { lf_season: 'conic-gradient(#8fbf5a, #e0a93c, #c9542a, #ea8fae, #8fbf5a)', br_bark: '#5e4630', hg_none: '#2a2342', hg_swing: 'linear-gradient(#94734f 24%, #2a2342 24%)', hg_birds: 'radial-gradient(circle at 42% 42%, #c5563c 24%, #2a2342 27%)', hg_lanterns: 'radial-gradient(circle, #ffb14a 32%, #2a2342 36%)',
    gd_grass: '#4f7a3a', gd_mush: 'radial-gradient(circle at 50% 35%, #b84a3a 30%, #4f7a3a 33%)', gd_stones: '#6d6b70', gd_pond: '#30405a', sk_dusk: 'linear-gradient(#3a2640, #d58a5a)', sk_night: 'linear-gradient(#070a18, #1c2542)', sk_dawn: 'linear-gradient(#7a7ea0, #f4d9a8)' };
  const swatch = k => { if (SWATCH[k]) return SWATCH[k]; const A = ML.TreeArt || {}; return (A.LEAVES && A.LEAVES[k] && A.LEAVES[k][2]) || (A.BARKS && A.BARKS[k] && A.BARKS[k][1]) || (A.FLOWERS && A.FLOWERS[k] && A.FLOWERS[k][0]) || '#555'; };
  const worn = () => { const q = S.econ.equip, o = {}; FIT.forEach(([s, , slot]) => { o[s] = q[slot]; }); return o; };
  const triedList = () => { const w = worn(); return FIT.filter(([s]) => tried[s] !== w[s]).map(([s]) => tried[s]); };
  function fitView() {
    if (!tried) tried = worn();
    const E = S.econ, w = worn(), list = triedList(), buy = list.filter(k => !E.owned.tree.includes(k)), total = buy.reduce((a, k) => a + CATALOG.tree[k], 0), tab = FIT.find(f => f[0] === fitTab) || FIT[0];
    const sws = Object.keys(CATALOG.tree).filter(k => k.slice(0, 2) === tab[1]).map(k => { const own = E.owned.tree.includes(k); return `<button type="button" class="fit-sw" data-try="${k}" aria-pressed="${tried[tab[0]] === k}"><i style="background:${swatch(k)}"></i><b>${esc(label('tree', k))}</b>${own ? `<small class="own-tag">${esc(t('owned'))}</small>` : coin(CATALOG.tree[k], E.gold < CATALOG.tree[k])}</button>`; }).join('');
    const foot = list.length
      ? `<div class="fit-bar"><span><b>${esc(t('sh_trying'))}</b> · ${list.map(k => esc(label('tree', k))).join(', ')}${total ? ' · ' + coin(total, E.gold < total) : ''}. ${esc(t('sh_free'))}</span><span class="fit-acts"><button type="button" class="small ghost" data-untry>${esc(t('sh_cancel'))}</button><button type="button" class="small primary" data-fitbuy>${esc(total ? t('sh_buy_n') : t('sh_use'))}</button></span></div>`
      : `<div class="fit-bar"><span>${esc(t('sh_try_hint'))}</span></div>`;
    return bar(t('sh_your_tree'), t('cat_tree')) + `<div class="fit"><div class="fit-stage"><canvas id="fit-cv"></canvas>${list.length ? `<span class="fit-badge">${esc(t('sh_trying'))}</span>` : ''}</div>
      <div class="fit-side"><div class="chips fit-tabs" role="group">${FIT.map(([s]) => `<button type="button" class="chip-btn" data-fittab="${s}" aria-pressed="${s === tab[0]}">${esc(t('ft_' + s))}${tried[s] !== w[s] ? ' ·' : ''}</button>`).join('')}</div>
      <div class="fit-sws">${sws}</div><p class="hint">${esc(t('sh_oak_only'))}</p></div></div>${foot}`;
  }
  // The canvas stays the same element across renders, so trying an option only repaints when the look changed
  const fitCv = document.createElement('canvas'); fitCv.id = 'fit-cv'; fitCv.setAttribute('role', 'img');
  let fitKey = '', fitT = 0;
  function mountFit() {
    const ph = $('fit-cv'); if (!ph) return;
    if (ph !== fitCv) ph.replaceWith(fitCv);
    fitCv.setAttribute('aria-label', t('sh_your_tree'));
    const key = JSON.stringify(tried); if (key === fitKey && fitCv.width) return;
    clearTimeout(fitT); fitT = setTimeout(() => { if (ML.treeFit) { ML.treeFit(fitCv, tried); fitKey = key; } }, 20);
  }

  function renderShop() {
    const body = $('shop-body');
    body.innerHTML = fitting ? fitView() : shelf ? shelfView(shelf) : home();
    body.querySelectorAll('.world-pic img, .world-free img, .shop-shelf img:not(.tree-prev)').forEach(i => i.addEventListener('error', () => i.remove()));
    if (fitting) mountFit();
    if (ML.treePrevs) ML.treePrevs(body);
    if (ML.islandPrevs) ML.islandPrevs(body);
    if (itemOpen && !ish.hidden) renderItem();
  }

  /* D1 + X3: the item's sheet. The picture is the item as you'd wear it (a familiar keeps your costume), the arrows go through the shelf */
  const ish = document.createElement('div'); ish.className = 'overlay item-ov'; ish.id = 'shopitem'; ish.hidden = true; document.body.appendChild(ish);
  let itemOpen = null;
  function renderItem() {
    if (!itemOpen) return;
    const [cat, k] = itemOpen, E = S.econ, st = stateOf(cat, k), list = shelf ? shelfList(shelf) : [], short = E.gold < st.price, cos = E.equip.costume && E.equip.costume !== 'none' ? E.equip.costume : null;
    let cta;
    if (cat === 'potion') cta = `<button type="button" class="primary" data-buy="${cat}:${k}">${esc(t('buy'))} ${coin(st.price, short)}</button>` + (k === 'elixir' && E.potions.elixir > 0 && !E.elixir ? `<button type="button" data-use="elixir">${esc(t('use'))}</button>` : '') + (k === 'midas' && E.potions.midas > 0 && !(E.midas > 0) ? `<button type="button" data-use="midas">${esc(t('use'))}</button>` : '');
    else if (st.eq) cta = `<button type="button" disabled>${esc(t('equipped'))}</button>`;
    else if (st.own) cta = `<button type="button" class="primary" data-equip="${cat}:${k}">${esc(t('equip'))}</button>`;
    else if (cat === 'costume') cta = `<button type="button" disabled>${esc(t('seq_reach', { n: 9 - st.seq }))}</button>`;
    else if (st.locked) cta = `<button type="button" disabled>${esc(t('premium_only'))}</button>`;
    else cta = `<button type="button" class="primary" data-buy="${cat}:${k}">${esc(t('buy'))} ${coin(st.price, short)}</button>`;
    if (cat === 'burst') cta = `<button type="button" data-play="${k}">${esc(t('sh_play'))}</button>` + cta;
    const pic = cat === 'familiar' && ML.familiarSvg ? ML.familiarSvg(k, 'idle', cos) : picOf(cat, k);
    const stock = cat === 'potion' ? `<p class="stock">${esc(t('in_stock', { n: E.potions[k] || 0 }))}${k === 'elixir' && E.elixir ? ' · ' + esc(t('elixir_on')) : ''}${k === 'midas' && E.midas > 0 ? ' · ' + esc(t('midas_on', { n: E.midas })) : ''}</p>` : '';
    const nav = d => (list.length > 1 ? `<button type="button" class="icon-btn item-nav" data-step="${d}" aria-label="${esc(t(d < 0 ? 'sh_prev' : 'sh_next'))}">${d < 0 ? '‹' : '›'}</button>` : '');
    ish.innerHTML = `<div class="sheet item-sheet t-${st.price ? tier(st.price) : 'common'}" role="dialog" aria-modal="true" aria-labelledby="item-h">
      <div class="sheet-head"><h2 id="item-h">${esc(nameOf(cat, k))}${premOnly(cat, k) ? '<span class="prem-badge">Premium</span>' : ''}</h2><button type="button" class="ghost icon-only" data-close="shopitem" aria-label="${esc(t('close'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="item-stage cat-${cat}">${nav(-1)}<span class="item-pic">${pic}</span>${nav(1)}${cat === 'familiar' && cos ? `<small class="item-note">${esc(t('sh_with'))}</small>` : ''}</div>
      <p>${esc(descOf(cat, k))}</p>${stock}<div class="item-cta">${cta}</div></div>`;
    if (ML.treePrevs) ML.treePrevs(ish);
    if (ML.islandPrevs) ML.islandPrevs(ish);
  }
  function openItem(cat, k) { itemOpen = [cat, k]; ish.hidden = false; renderItem(); ML.openOverlay('shopitem'); }

  // Buying, equipping and using, from a sheet
  function act(b) {
    const E = S.econ;
    if (b.dataset.buy) {
      const [cat, k] = b.dataset.buy.split(':'), price = CATALOG[cat][k];
      if (premOnly(cat, k) && !isPrem()) return;
      if (E.gold < price) { toast(t('not_enough', { n: price - E.gold })); return; }
      E.gold -= price;
      if (cat === 'potion') E.potions[k] = (E.potions[k] || 0) + 1;
      else if (cat === 'world') { E.owned.world.push(k); useWorld(k); }
      else { E.owned[cat].push(k); E.equip[slotOf(cat, k)] = k; applyCosmetics(); }
      ML.sfx && ML.sfx('buy'); toast(t('bought', { name: label(cat, k) }));
      justBought = cat + ':' + k; if (ML.burst) ML.burst('coins');
    } else if (b.dataset.equip) {
      const [cat, k] = b.dataset.equip.split(':');
      if (cat === 'costume' ? k !== 'none' && !E.owned.costume.includes(k) : !(E.owned[cat] || []).includes(k)) return;
      if (cat === 'world') { useWorld(k); save(); renderShop(); if (itemOpen) renderItem(); return; }
      E.equip[slotOf(cat, k)] = k; applyCosmetics();
      if (cat === 'burst' && ML.burst) ML.burst(k === 'theme' ? document.documentElement.dataset.theme : k);
    } else if (b.dataset.use === 'elixir') {
      if (E.potions.elixir < 1) return; E.potions.elixir--; E.elixir = true; toast(t('elixir_on'));
    } else if (b.dataset.use === 'midas') {
      if (!(E.potions.midas > 0)) return; E.potions.midas--; E.midas = 100; toast(t('midas_on', { n: 100 }));
    } else return;
    save(); renderShop(); renderGold(); ML.renderAll();
  }
  ish.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.step && itemOpen) {
      const list = shelf ? shelfList(shelf) : [], i = list.findIndex(([a, k]) => a === itemOpen[0] && k === itemOpen[1]);
      if (list.length) { itemOpen = list[(i + +b.dataset.step + list.length) % list.length]; renderItem(); }
      return;
    }
    if (b.dataset.play) { if (ML.burst) ML.burst(b.dataset.play === 'theme' ? document.documentElement.dataset.theme : b.dataset.play); return; }
    act(b);
  });
  $('shop-body').addEventListener('click', e => {
    const E = S.econ, b = e.target.closest('button'); if (!b) return;
    if (b.dataset.light) { if (isPrem() && ML.setDayNight) { ML.setDayNight(b.dataset.light); renderShop(); } return; }
    if (b.dataset.world) { openWorld(b.dataset.world); return; }
    const top = () => { $('shop-body').parentElement.scrollTop = 0; };
    if (b.dataset.shelf) { shelf = b.dataset.shelf; filter = 'all'; fitting = false; justBought = null; renderShop(); top(); return; }
    if (b.hasAttribute('data-back')) { if (fitting) fitting = false; else shelf = null; justBought = null; renderShop(); top(); return; }
    if (b.dataset.filter) { filter = b.dataset.filter; renderShop(); return; }
    if (b.dataset.item) { const [cat, k] = b.dataset.item.split(':'); openItem(cat, k); return; }
    if (b.hasAttribute('data-fit')) { fitting = true; tried = worn(); renderShop(); top(); return; }
    if (b.dataset.fittab) { fitTab = b.dataset.fittab; renderShop(); return; }
    if (b.dataset.try) { const k = b.dataset.try, s = (FIT.find(f => f[1] === k.slice(0, 2)) || [])[0]; if (!s) return; tried[s] = tried[s] === k ? worn()[s] : k; renderShop(); return; }
    if (b.hasAttribute('data-untry')) { tried = worn(); renderShop(); return; }
    if (b.hasAttribute('data-fitbuy')) {
      const list = triedList(), buy = list.filter(k => !E.owned.tree.includes(k)), total = buy.reduce((a, k) => a + CATALOG.tree[k], 0);
      if (E.gold < total) { toast(t('not_enough', { n: total - E.gold })); return; }
      E.gold -= total; buy.forEach(k => E.owned.tree.push(k)); list.forEach(k => { E.equip[TREE_SLOT[k.slice(0, 2)]] = k; });
      if (buy.length) { ML.sfx && ML.sfx('buy'); toast(buy.length > 1 ? t('sh_bought_n', { n: buy.length }) : t('bought', { name: label('tree', buy[0]) })); if (ML.burst) ML.burst('coins'); }
      tried = worn(); save(); applyCosmetics(); renderShop(); renderGold(); ML.renderAll();
    }
  });

  on('render', renderGold);
  on('started', () => {
    // People who earned XP before the shop existed get the matching gold once
    if (!S.econ.init) { S.econ.gold += Math.floor(S.xp / 4); S.econ.init = true; save(); }
    migrate(); ownerGifts(); checkSeal(); applyCosmetics(); renderGold();
    setTimeout(() => grantCostumes(true), 3000); // after the title screen: people already high up get theirs, with a toast
  });
  on('levelup', () => grantCostumes(true));
  on('render', () => grantCostumes(false)); // XP that came in through a sync
  on('premium', ownerGifts);
  on('newday', checkSeal);
  ML.applyHat = applyHat;
  ML.applyCosmetics = applyCosmetics;
})();
