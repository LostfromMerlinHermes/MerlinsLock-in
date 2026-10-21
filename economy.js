// Economy: gold earned with XP, a shop of cosmetics (hats, seal rings, end-of-session effects, familiars)
// and potions (streak seal, focus elixir, quest scroll).
(() => {
  'use strict';
  const { $, S, t, esc, save, on, emit, toast, dayKey, today, addDays } = ML;

  ML.addStrings({
    fr: {
      shop: 'Boutique', gold_n: '{n} pièces d’or', buy: 'Acheter', equip: 'Équiper', equipped: 'Équipé', owned: 'possédé', use: 'Utiliser', not_enough: 'Pas assez d’or : il te manque {n} ◈.',
      bought: '{name} acheté', shop_hint: 'Tu gagnes 1 pièce d’or pour 4 XP. Les potions se consomment, les cosmétiques sont à toi pour toujours.',
      cat_hats: 'Chapeaux', cat_rings: 'Anneau du sceau', cat_bursts: 'Effet de fin de session', cat_familiars: 'Familiers', cat_potions: 'Potions',
      hat_wizard: 'Chapeau de Merlin', hat_wizard_d: 'Le classique, avec son monocle.',
      hat_tophat: 'Haut-de-forme du Fou', hat_tophat_d: 'Élégance victorienne au-dessus du brouillard gris.',
      hat_hood: 'Capuche d’ombre', hat_hood_d: 'Sans visage. Seul le monocle brille.',
      hat_crown: 'Couronne astrale', hat_crown_d: 'Pour qui a gravi les Séquences.',
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
      cat_light: 'Thèmes clairs', cat_seq: 'Costumes de Séquence', seq_hint: 'Chaque Séquence atteinte débloque un costume pour ton familier. Il est à toi pour toujours.', seq_reach: 'Atteins la Séquence {n}',
      cs_none: 'Sans costume', cs_none_d: 'Ton familier au naturel.', cs_won: 'Costume débloqué : {name}', unequip: 'Retirer',
      cs_seer_d: 'Foulard pourpre, pièces d’or et troisième œil.', cs_clown_d: 'Fraise, nez rouge et chapeau pointu.', cs_magician_d: 'Haut-de-forme, nœud papillon et cape.',
      cs_faceless_d: 'Un masque lisse. Qui est vraiment derrière ?', cs_marionettist_d: 'Une croix de bois et des fils invisibles.', cs_bizarro_d: 'Diadème d’orbes et filaments violets.',
      cs_scholar_d: 'Toque de savant et monocle d’or.', cs_miracle_d: 'Auréole dorée et rayons de lumière.', cs_attendant_d: 'Capuche grise, étoile d’or et brume.', cs_fool_d: 'Haut-de-forme étoilé, cape grise et brouillard.',
    },
    en: {
      shop: 'Shop', gold_n: '{n} gold', buy: 'Buy', equip: 'Equip', equipped: 'Equipped', owned: 'owned', use: 'Use', not_enough: 'Not enough gold: you need {n} more ◈.',
      bought: '{name} bought', shop_hint: 'You earn 1 gold per 4 XP. Potions get used up; cosmetics are yours forever.',
      cat_hats: 'Hats', cat_rings: 'Seal ring', cat_bursts: 'End-of-session effect', cat_familiars: 'Familiars', cat_potions: 'Potions',
      hat_wizard: "Merlin's hat", hat_wizard_d: 'The classic, monocle included.',
      hat_tophat: "The Fool's top hat", hat_tophat_d: 'Victorian elegance above the gray fog.',
      hat_hood: 'Shadow hood', hat_hood_d: 'Faceless. Only the monocle glints.',
      hat_crown: 'Astral crown', hat_crown_d: 'For those who climbed the Sequences.',
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
      cat_light: 'Light themes', cat_seq: 'Sequence costumes', seq_hint: 'Every Sequence you reach unlocks a costume for your familiar. It’s yours forever.', seq_reach: 'Reach Sequence {n}',
      cs_none: 'No costume', cs_none_d: 'Your familiar as it is.', cs_won: 'Costume unlocked: {name}', unequip: 'Remove',
      cs_seer_d: 'Purple headscarf, gold coins and a third eye.', cs_clown_d: 'Ruff, red nose and pointy hat.', cs_magician_d: 'Top hat, bow tie and cape.',
      cs_faceless_d: 'A smooth mask. Who is really behind it?', cs_marionettist_d: 'A wooden cross and invisible strings.', cs_bizarro_d: 'A circlet of orbs and violet tendrils.',
      cs_scholar_d: 'Scholar’s cap and golden monocle.', cs_miracle_d: 'Golden halo and rays of light.', cs_attendant_d: 'Gray hood, golden star and mist.', cs_fool_d: 'Starred top hat, gray cape and fog.',
    },
  });

  ML.defaults(() => ({
    econ: {
      gold: 0,
      owned: { hat: ['wizard'], ring: ['default'], burst: ['theme'], familiar: ['owl'], skin: ['classic'], costume: [] },
      equip: { hat: 'wizard', ring: 'default', burst: 'theme', familiar: 'owl', skin: 'classic', costume: 'none' },
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
  };
  const PREMIUM_ONLY = { skin: ['holo', 'astral'] }; // need a Premium account to buy
  // The app's author (ML.isOwner) gets these for free; everyone else buys them at the catalog price
  const OWNER_GIFTS = { familiar: ['hippo'] };
  const premOnly = (cat, k) => (PREMIUM_ONLY[cat] || []).includes(k);
  // Categories added after launch: older saves lack them (nested defaults only merge one level deep)
  function migrate() {
    const E = S.econ; if (!E) return;
    if (!E.owned.skin) E.owned.skin = ['classic']; if (!E.equip.skin) E.equip.skin = 'classic';
    if (!Array.isArray(E.owned.costume)) E.owned.costume = []; if (!E.equip.costume) E.equip.costume = 'none';
  }

  /* ---------- Sequence costumes: earned by reaching each Sequence, never lost ----------
     Stored as a plain list of keys, which the sync merges as a union (an unlock on one device survives
     whatever the other device did), and re-derived from XP so a costume can't go missing. */
  const csName = k => (ML.SEQUENCES[ML.COSTUMES.indexOf(k)] || [0, k])[1];
  function grantCostumes(announce) {
    if (!S.econ || !ML.COSTUMES) return;
    migrate();
    const i = ML.seqInfo().i, have = S.econ.owned.costume, won = ML.COSTUMES.slice(0, i + 1).filter(k => !have.includes(k));
    if (!won.length) return;
    have.push(...won); save();
    if (!announce) return;
    const k = won[won.length - 1];
    toast(t('cs_won', { name: csName(k) }), { ms: 8000, action: { label: t('equip'), fn: () => { S.econ.equip.costume = k; save(); applyCosmetics(); } } });
  }
  function ownerGifts() {
    if (!S.econ || !(ML.isOwner && ML.isOwner())) return;
    let changed = false;
    for (const [cat, ks] of Object.entries(OWNER_GIFTS)) ks.forEach(k => { if (!S.econ.owned[cat].includes(k)) { S.econ.owned[cat].push(k); changed = true; } });
    if (changed) save();
  }

  /* ---------- Gold ---------- */
  on('xp', n => {
    let g = Math.max(1, Math.ceil(n / 4));
    if (S.econ.midas > 0) { const part = Math.min(n, S.econ.midas); S.econ.midas -= part; g += Math.ceil(part / 4); } // Midas potion: double gold on the next 100 XP
    S.econ.gold += g; save(); renderGold();
    setTimeout(() => ML.floater && ML.floater('+' + g + ' ◈', 'gold'), 250);
  });
  function renderGold() { const el = $('gold-chip'); if (el) { el.innerHTML = `<span>◈</span><b>${S.econ.gold.toLocaleString(ML.locale())}</b>`; el.title = t('gold_n', { n: S.econ.gold }); } }
  $('gold-chip').onclick = () => { migrate(); ownerGifts(); grantCostumes(false); renderShop(); ML.openOverlay('shop'); };
  ML.openShop = () => $('gold-chip').click();

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
    return `<span class="burst-swatch">${{ seal: '⛨', elixir: '⚗', scroll: '📜', midas: '♛' }[k]}</span>`;
  };
  const label = (cat, k) => cat === 'familiar' ? t('fam_' + k) : t((cat === 'potion' ? 'pot' : cat) + '_' + k);
  const desc = (cat, k) => cat === 'familiar' ? t('fam_' + k + '_d') : t((cat === 'potion' ? 'pot' : cat) + '_' + k + '_d');
  // Price sets the card's rarity frame, like task rarity: common / rare / epic / legendary
  const tier = p => (p <= 150 ? 'common' : p <= 300 ? 'rare' : p <= 500 ? 'epic' : 'legendary');
  const coin = (n, short) => `<span class="coin-pill ${short ? 'short' : ''}"><i>◈</i>${n.toLocaleString(ML.locale())}</span>`;
  let justBought = null;
  const NAV = [['seq', 'cat_seq'], ['light', 'cat_light'], ['potion', 'cat_potions'], ['hat', 'cat_hats'], ['familiar', 'cat_familiars'], ['ring', 'cat_rings'], ['burst', 'cat_bursts'], ['skin', 'cat_skins']];
  // Light skins (Premium, not bought with gold): one per mood, switched on from here or the sun / moon button
  const LIGHTS = [['drained', 'aube'], ['steady', 'atelier'], ['fired', 'tokyo'], ['scattered', 'cartouche']];
  function lightSection() {
    const prem = ML.isPremium && ML.isPremium(), dn = S.dayNight;
    const acts = prem ? `<div class="light-acts">
        <button type="button" class="small ${dn === 'autolight' ? 'primary' : ''}" data-light="autolight">${esc(t('dn_autolight'))}</button>
        <button type="button" class="small ${dn === 'light' ? 'primary' : ''}" data-light="light">${esc(t('dn_light'))}</button>
        ${dn === 'light' || dn === 'autolight' ? `<button type="button" class="small ghost" data-light="auto">${esc(t('dn_auto'))}</button>` : ''}</div>`
      : `<div class="light-acts"><button type="button" class="small" disabled>${esc(t('premium_only'))}</button></div>`;
    return `<h3 class="shop-h" id="shop-light">${esc(t('cat_light'))}<span class="prem-badge">Premium</span></h3><p class="hint">${esc(t('light_premium_hint'))}</p>${acts}
      <div class="shop-grid">${LIGHTS.map(([m, k]) => `<div class="shop-item t-legendary ${prem ? '' : 'poor'}"><div class="shop-prev"><span class="light-prev lp-${k}"></span></div>
        <b>${esc(t('th_light_' + k))}</b><small>${esc(t('mood_' + m))}</small></div>`).join('')}</div>`;
  }
  function renderShop() {
    const E = S.econ;
    const section = (cat, title) => `<h3 class="shop-h" id="shop-${cat}">${esc(t(title))}</h3><div class="shop-grid">${Object.entries(CATALOG[cat]).map(([k, price]) => {
      const own = cat !== 'potion' && E.owned[cat].includes(k), eq = cat !== 'potion' && E.equip[cat] === k, short = !own && E.gold < price;
      let btn;
      if (cat === 'potion') btn = `<button type="button" class="small buy" data-buy="${cat}:${k}">${esc(t('buy'))} ${coin(price, E.gold < price)}</button>` + (k === 'elixir' && E.potions.elixir > 0 && !E.elixir ? `<button type="button" class="small" data-use="elixir">${esc(t('use'))}</button>` : '')
        + (k === 'midas' && E.potions.midas > 0 && !(E.midas > 0) ? `<button type="button" class="small" data-use="midas">${esc(t('use'))}</button>` : '');
      else if (eq) btn = `<span class="eq-tag">✓ ${esc(t('equipped'))}</span>`;
      else if (own) btn = `<button type="button" class="small" data-equip="${cat}:${k}">${esc(t('equip'))}</button>`;
      else if (premOnly(cat, k) && !(ML.isPremium && ML.isPremium())) btn = `<button type="button" class="small" disabled>${esc(t('premium_only'))}</button>`;
      else btn = `<button type="button" class="small buy" data-buy="${cat}:${k}">${esc(t('buy'))} ${coin(price, short)}</button>`;
      return `<div class="shop-item t-${price ? tier(price) : 'common'} ${eq ? 'is-eq' : ''} ${own && !eq ? 'is-own' : ''} ${cat !== 'potion' && short ? 'poor' : ''} ${justBought === cat + ':' + k ? 'just' : ''}">
        <div class="shop-prev">${preview(cat, k)}</div>
        <b>${esc(label(cat, k))}${premOnly(cat, k) ? `<span class="prem-badge">Premium</span>` : ''}</b><small>${esc(desc(cat, k))}</small>
        ${cat === 'potion' ? `<small class="stock">${esc(t('in_stock', { n: E.potions[k] || 0 }))}${k === 'elixir' && E.elixir ? ' · ' + esc(t('elixir_on')) : ''}${k === 'midas' && E.midas > 0 ? ' · ' + esc(t('midas_on', { n: E.midas })) : ''}</small>` : ''}
        <div class="shop-btns">${btn}</div></div>`;
    }).join('')}</div>`;
    // Sequence costumes first: earned ones show the familiar wearing them, the others a black silhouette
    const seqTile = (k, i) => {
      const own = k === 'none' || E.owned.costume.includes(k), eq = (E.equip.costume || 'none') === k;
      const name = k === 'none' ? t('cs_none') : csName(k), num = 9 - i;
      return `<div class="shop-item ${eq ? 'is-eq' : ''} ${own ? '' : 'locked'}">
        ${k === 'none' ? '<span class="seq-num">&nbsp;</span>' : `<span class="seq-num">${esc(t('sequence'))} ${num}</span>`}
        <div class="shop-prev">${ML.costumeSvg ? ML.costumeSvg(k === 'none' ? null : k) : ''}</div>
        <b>${esc(name)}</b><small>${esc(own ? t('cs_' + k + '_d') : t('seq_reach', { n: num }))}</small>
        <div class="shop-btns">${eq ? `<button type="button" class="small" disabled>${esc(t('equipped'))}</button>` : own ? `<button type="button" class="small" data-equip="costume:${k}">${esc(t('equip'))}</button>` : `<button type="button" class="small" disabled>🔒 ${esc(ML.SEQUENCES[i][0].toLocaleString(ML.locale()))} XP</button>`}</div></div>`;
    };
    $('shop-body').innerHTML = `
      <div class="shop-top"><div class="shop-gold"><span>◈</span><b>${E.gold.toLocaleString(ML.locale())}</b></div><p class="hint">${esc(t('shop_hint'))}</p></div>
      <nav class="shop-nav chips">${NAV.map(([c, l]) => `<button type="button" class="chip-btn" data-shopgo="${c}">${esc(t(l))}</button>`).join('')}</nav>
      <h3 class="shop-h" id="shop-seq">${esc(t('cat_seq'))}</h3><p class="hint">${esc(t('seq_hint'))}</p>
      <div class="shop-grid seq-grid">${seqTile('none', -1)}${(ML.COSTUMES || []).map(seqTile).join('')}</div>
      ${lightSection()}
      ${section('potion', 'cat_potions')}${section('hat', 'cat_hats')}${section('familiar', 'cat_familiars')}${section('ring', 'cat_rings')}${section('burst', 'cat_bursts')}${section('skin', 'cat_skins')}`;
  }
  $('shop-body').addEventListener('click', e => {
    const E = S.econ, b = e.target.closest('button'); if (!b) return;
    if (b.dataset.light) { if (ML.isPremium && ML.isPremium() && ML.setDayNight) { ML.setDayNight(b.dataset.light); renderShop(); } return; }
    if (b.dataset.shopgo) { const h = $('shop-' + b.dataset.shopgo); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    justBought = null;
    if (b.dataset.buy) {
      const [cat, k] = b.dataset.buy.split(':'), price = CATALOG[cat][k];
      if (premOnly(cat, k) && !(ML.isPremium && ML.isPremium())) return;
      if (E.gold < price) { toast(t('not_enough', { n: price - E.gold })); return; }
      E.gold -= price;
      if (cat === 'potion') E.potions[k] = (E.potions[k] || 0) + 1;
      else { E.owned[cat].push(k); E.equip[cat] = k; applyCosmetics(); }
      ML.sfx && ML.sfx('buy'); toast(t('bought', { name: label(cat, k) }));
      justBought = cat + ':' + k; if (ML.burst) ML.burst('coins');
    } else if (b.dataset.equip) {
      const [cat, k] = b.dataset.equip.split(':');
      if (cat === 'costume' ? k !== 'none' && !E.owned.costume.includes(k) : !E.owned[cat].includes(k)) return;
      E.equip[cat] = k; applyCosmetics();
      if (cat === 'burst' && ML.burst) ML.burst(k === 'theme' ? document.documentElement.dataset.theme : k);
    } else if (b.dataset.use === 'elixir') {
      if (E.potions.elixir < 1) return; E.potions.elixir--; E.elixir = true; toast(t('elixir_on'));
    } else if (b.dataset.use === 'midas') {
      if (!(E.potions.midas > 0)) return; E.potions.midas--; E.midas = 100; toast(t('midas_on', { n: 100 }));
    } else return;
    save(); renderShop(); renderGold(); ML.renderAll();
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
