// My island (3.107): a second view of the World page, next to the world's island. It starts as a bare rock with a campfire
// and you build it yourself, tile by tile (proposals/ile, picks V1 M1 M2 D1 I1 F1). Stones come from focus: 1 per 25 min
// over all time (ML.worldFocusMins) + 1 per Flow session; a piece placed costs stones, taking it back returns them, so the
// stones left are always computed, never stored. The catalogue opens with focus hours. One island for every world: each
// piece is drawn in the style of the world on screen (light worlds use their dark world's look). S.build.map holds
// { 'i,j': { k, at, task } }; S.build.view is 'isle' (the world's island) or 'mine'.
(() => {
  const { S, t, esc, save, on } = ML;

  ML.addStrings({
    fr: {
      mi_isle: 'L’île', mi_mine: 'Mon île', mi_sub: 'Le monde de ton énergie {e}. Ton île prend son style.', mi_look: 'Regarder', mi_build: 'Construire', mi_stones: '{n} pierres', mi_stone: '1 pierre', mi_stones0: '0 pierre',
      mi_intro: 'Ton île à toi. Finis des séances pour gagner des pierres, puis passe en Construire pour poser ce que tu veux.',
      mi_first: 'Finis une séance pour gagner tes premières pierres.',
      mi_rule: '1 pierre toutes les 25 min de focus, +1 pour une séance Flow.',
      mi_look_tip: 'Touche une pièce pour voir quand tu l’as posée.',
      mi_build_tip: 'Choisis une pièce puis touche une case libre. Touche une pièce posée pour la reprendre.',
      mi_free: 'Une case libre. Passe en Construire pour y poser quelque chose.',
      mi_placed: '{p} · le {d}, avec les pierres de « {task} ».', mi_placed0: '{p} · le {d}.',
      mi_camp: 'Feu de camp · là depuis ton arrivée, le {d}.', mi_camp_stays: 'Le feu de camp reste : c’est là que tout a commencé.',
      mi_put: 'Posé : {p}.', mi_back: '{p} : les pierres te reviennent.', mi_undo: 'Annuler',
      mi_need: 'Il te faut {n} pierres. Finis une séance de plus.', mi_opens: 'à {h} h', mi_lock: '{p} s’ouvre à {h} h de focus (tu en as {a}).',
      mi_cost: '{n} p.', mi_canvas: 'Ton île. Touche une case.',
      mi_camp_n: 'Feu de camp', mi_path: 'Chemin', mi_rocks: 'Rochers', mi_tree: 'Arbre', mi_lantern: 'Lanterne', mi_garden: 'Jardin', mi_pond: 'Bassin', mi_well: 'Puits', mi_house: 'Maison', mi_tower: 'Tour',
    },
    en: {
      mi_isle: 'Island', mi_mine: 'My island', mi_sub: 'The world of your {e} energy. Your island takes its style.', mi_look: 'Look', mi_build: 'Build', mi_stones: '{n} stones', mi_stone: '1 stone', mi_stones0: '0 stones',
      mi_intro: 'Your own island. Finish sessions to earn stones, then switch to Build to place what you like.',
      mi_first: 'Finish a session to earn your first stones.',
      mi_rule: '1 stone every 25 min of focus, +1 for a Flow session.',
      mi_look_tip: 'Touch a piece to see when you placed it.',
      mi_build_tip: 'Pick a piece, then touch a free tile. Touch a placed piece to take it back.',
      mi_free: 'A free tile. Switch to Build to place something here.',
      mi_placed: '{p} · placed on {d} with the stones from “{task}”.', mi_placed0: '{p} · placed on {d}.',
      mi_camp: 'Campfire · here since you arrived, on {d}.', mi_camp_stays: 'The campfire stays: this is where it all began.',
      mi_put: '{p} placed.', mi_back: '{p} taken back: the stones are yours again.', mi_undo: 'Undo',
      mi_need: 'You need {n} stones. Finish one more session.', mi_opens: 'at {h} h', mi_lock: '{p} opens at {h} h of focus (you have {a}).',
      mi_cost: '{n} st.', mi_canvas: 'Your island. Touch a tile.',
      mi_camp_n: 'Campfire', mi_path: 'Path', mi_rocks: 'Rocks', mi_tree: 'Tree', mi_lantern: 'Lantern', mi_garden: 'Garden', mi_pond: 'Pond', mi_well: 'Well', mi_house: 'House', mi_tower: 'Tower',
    },
  });
  ML.defaults(() => ({ build: { map: null, view: 'isle' } }));

  /* ---------- pieces and stones ---------- */
  const PIECES = [
    { k: 'path', c: 1, h: 0, flat: true }, { k: 'rocks', c: 1, h: 0 }, { k: 'tree', c: 2, h: 0 },
    { k: 'lantern', c: 2, h: 2 }, { k: 'garden', c: 3, h: 5, flat: true }, { k: 'pond', c: 3, h: 5, flat: true },
    { k: 'well', c: 4, h: 10 }, { k: 'house', c: 6, h: 10 }, { k: 'tower', c: 10, h: 20 },
  ];
  const PBY = Object.fromEntries(PIECES.map(p => [p.k, p])); PBY.camp = { k: 'camp', c: 0, h: 0 };
  const pname = k => t(k === 'camp' ? 'mi_camp_n' : 'mi_' + k);
  const B = () => { if (!S.build || typeof S.build !== 'object') S.build = { map: null, view: 'isle' }; return S.build; };
  function map() { const b = B(); if (!b.map || typeof b.map !== 'object') b.map = { '3,3': { k: 'camp', at: Date.now() } }; return b.map; }
  const focusMins = () => (ML.worldFocusMins ? ML.worldFocusMins() : (S.sessions || []).reduce((a, s) => a + (s.mins || 0), 0));
  const earned = () => Math.floor(focusMins() / 25) + (ML.isFlow ? (S.sessions || []).filter(ML.isFlow).length : 0);
  const spent = () => Object.values(map()).reduce((a, v) => a + ((v && PBY[v.k] && PBY[v.k].c) || 0), 0);
  const stones = () => Math.max(0, earned() - spent());
  const hoursNow = () => focusMins() / 60;
  const STAGES = [0, 5, 20, 50, 125, 250, 500];
  const towerTall = () => { const h = hoursNow(), st = STAGES.reduce((a, v, i) => (h >= v ? i : a), 0); return .35 + .65 * st / 6; };
  const todayN = () => { const d0 = new Date(); d0.setHours(0, 0, 0, 0); return (S.sessions || []).filter(s => s.at >= +d0).length; };

  /* ---------- the look of each world ---------- */
  const base = { strata: 'rgba(0,0,0,.22)', cap: 'spire', fx: 'stars' };
  const PAL = {
    observatory: { ...base, cap: 'dome', sky: ['#070b22', '#141c46', '#2d2b5c'], grass: ['#3a5a3c', '#41643f', '#476b44'], tuft: '#2c4630', rim: '#6c8f5e', sideL: '#5d4a3a', sideR: '#3f3128', under: ['#2c2433', '#120f19'],
      stone: '#9a9184', stoneD: '#655e54', stoneL: '#b9b0a1', wallL: '#a69a88', wallR: '#756b5e', roof: '#6e4a33', roofD: '#4a3022', metal: '#c09356', metalD: '#7d5d33', win: '#ffcf7a',
      water: '#21486e', waterL: '#6d9cc6', leaf: ['#244a31', '#30613d', '#457f4f'], trunk: '#4e3626', flower: '#e8c26a', dirt: '#4a3a2b', glow: '255,205,120', fog: '40,44,90', crystal: '#7e6cc8' },
    sanctuary: { ...base, style: 'san', fx: 'moon', sky: ['#07131b', '#102a36', '#24474f'], grass: ['#355a52', '#3c645b', '#436c62'], tuft: '#284740', rim: '#7fa597', sideL: '#69686f', sideR: '#46464e', under: ['#272c38', '#10141c'], strata: 'rgba(0,0,0,.2)',
      stone: '#c6c3ba', stoneD: '#8a877f', stoneL: '#e0ddd4', wallL: '#e2dccd', wallR: '#aaa294', roof: '#2d3842', roofD: '#1b232b', metal: '#9b3c33', metalD: '#6a2620', win: '#ffd8a0',
      water: '#173f4a', waterL: '#7fbcbc', leaf: ['#b77d97', '#d79cb3', '#ecc2d2'], trunk: '#4c3a34', flower: '#f0b8c8', dirt: '#3d3a34', glow: '255,190,140', fog: '60,90,100', fall: true },
    arcade: { ...base, style: 'arc', pixel: true, fx: 'sun', sky: ['#26163a', '#4a2350', '#8e3f5e', '#d9775c', '#f2b27a'], grass: ['#5b7c48', '#668853', '#71935c'], tuft: '#45613a', rim: '#9cc07a', sideL: '#8e5c48', sideR: '#5f3b34', under: ['#3a2442', '#1c1026'], strata: 'rgba(0,0,0,.25)',
      stone: '#cdbcaa', stoneD: '#8c7b70', stoneL: '#e6d8c6', wallL: '#d08a62', wallR: '#9c5a46', roof: '#c4504a', roofD: '#8a3238', metal: '#e0b04a', metalD: '#9a7428', win: '#ffe28a',
      water: '#3f63a6', waterL: '#93bde8', leaf: ['#2f5a33', '#3f7542', '#58904f'], trunk: '#6a4030', flower: '#ffd27a', dirt: '#6a4a36', glow: '255,215,130', fog: '120,60,90' },
    netrunner: { ...base, sky: ['#050a14', '#0a1a2e', '#123049'], grass: ['#1f3a3f', '#234247', '#284a4f'], tuft: '#173033', rim: '#3fd0e0', sideL: '#3a4450', sideR: '#262d36', under: ['#1a2230', '#080c14'],
      stone: '#7d8a96', stoneD: '#4f5a66', stoneL: '#a9b6c2', wallL: '#5e6b78', wallR: '#3c4652', roof: '#2a3440', roofD: '#1a222c', metal: '#3fd0e0', metalD: '#1d7d8a', win: '#6ff0ff',
      water: '#0f3550', waterL: '#3fd0e0', leaf: ['#1d5a50', '#24786a', '#3fb59a'], trunk: '#3a3f48', flower: '#ff4fa0', dirt: '#2a2c30', glow: '80,220,255', fog: '20,60,90', crystal: '#3fd0e0' },
    sorcerer: { ...base, sky: ['#0a0618', '#1a0f34', '#2e1a4e'], grass: ['#2e3d3e', '#34463f', '#3a4d44'], tuft: '#23302c', rim: '#9f8ae0', sideL: '#4e4560', sideR: '#332d42', under: ['#251c36', '#0e0a18'],
      stone: '#9a96a8', stoneD: '#625e72', stoneL: '#c4c0d2', wallL: '#8e88a0', wallR: '#5c5670', roof: '#3a2f5a', roofD: '#251d3e', metal: '#c9c3e8', metalD: '#7a72a8', win: '#c9a0ff',
      water: '#2a2a6a', waterL: '#9f8ae0', leaf: ['#2f4a46', '#3d6058', '#6a8f7e'], trunk: '#3e3448', flower: '#c9a0ff', dirt: '#3a3040', glow: '190,150,255', fog: '60,40,110', crystal: '#b08cff' },
    neoncity: { ...base, fx: 'haze', sky: ['#14071a', '#3a0f36', '#6a1f4e'], grass: ['#3a3a44', '#41414c', '#484853'], tuft: '#2c2c36', rim: '#ff5fae', sideL: '#4a4250', sideR: '#302a36', under: ['#2a1830', '#0e0812'],
      stone: '#8a8494', stoneD: '#5a5462', stoneL: '#b2acbc', wallL: '#6a6478', wallR: '#443e50', roof: '#2a2434', roofD: '#1a1622', metal: '#ff5fae', metalD: '#a0306a', win: '#ff9ad0',
      water: '#2a1850', waterL: '#5fe0ff', leaf: ['#2a4a48', '#346058', '#4f8a78'], trunk: '#3a3040', flower: '#5fe0ff', dirt: '#2e2a32', glow: '255,110,180', fog: '120,40,90' },
    fog: { ...base, fx: 'mist', sky: ['#141518', '#26282c', '#3c3e42'], grass: ['#3e4440', '#454b46', '#4b514b'], tuft: '#2f3431', rim: '#8a8f88', sideL: '#5a5650', sideR: '#3e3b37', under: ['#2a2a2c', '#141416'],
      stone: '#9a958c', stoneD: '#666159', stoneL: '#bdb8ae', wallL: '#8e887c', wallR: '#5e594f', roof: '#4a3a2c', roofD: '#30251c', metal: '#a07a4a', metalD: '#6a4e2c', win: '#e8c890',
      water: '#2c3438', waterL: '#8a9a9c', leaf: ['#3a443c', '#48544a', '#606c60'], trunk: '#3e3830', flower: '#a8323a', dirt: '#3a3632', glow: '230,200,150', fog: '150,150,155' },
    abyss: { ...base, cap: 'dome', sky: ['#020c16', '#062238', '#0c3a52'], grass: ['#1f4a4a', '#245452', '#2a5e5a'], tuft: '#163838', rim: '#8ad8d0', sideL: '#4e5e6a', sideR: '#34404a', under: ['#16283a', '#060e18'],
      stone: '#b8c4c0', stoneD: '#7a8884', stoneL: '#e0e8e2', wallL: '#d8d0c4', wallR: '#9a9488', roof: '#2a5a6a', roofD: '#1a3a48', metal: '#d8b46a', metalD: '#8a6e3a', win: '#ffd890',
      water: '#0a3a5a', waterL: '#8ad8d0', leaf: ['#7a3a5a', '#a04a6a', '#e07a8a'], trunk: '#5a3a4a', flower: '#ffd890', dirt: '#2a3a3a', glow: '140,220,210', fog: '20,80,110', crystal: '#8ad8d0' },
  };
  PAL.cartouche = PAL.arcade;
  function worldKey() { const w = ML.worldNow ? ML.worldNow(S.mood) : { th: 'observatory' }; return PAL[w.th] ? w.th : 'observatory'; }

  /* ---------- painting (an island of 7 x 7 tiles in three-quarter view, drawn in a 720 x 540 frame) ---------- */
  const W = 720, H = 540, HW = 32, HH = 16, OX = 360, OY = 168, N = 7, DEP = 20, ZS = 1.28, ZX = 360, ZY = 250;
  let x;
  const rng = seed => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
  const hash = (i, j) => ((i * 73856093) ^ (j * 19349663)) >>> 0;
  function poly(p, f) { x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let k = 1; k < p.length; k++) x.lineTo(p[k][0], p[k][1]); x.closePath(); x.fillStyle = f; x.fill(); }
  function line(p, s, w) { x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let k = 1; k < p.length; k++) x.lineTo(p[k][0], p[k][1]); x.strokeStyle = s; x.lineWidth = w || 1; x.stroke(); }
  function circ(cx, cy, r, f) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = f; x.fill(); }
  function ell(cx, cy, rx, ry, f) { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fillStyle = f; x.fill(); }
  function glow(cx, cy, r, rgb, a) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); x.restore(); }
  const ctr = (i, j) => [OX + (i - j) * HW, OY + (i + j) * HH];
  const edge = (cx, cy) => [[cx, cy - HH], [cx + HW, cy], [cx, cy + HH], [cx - HW, cy], [cx, cy - HH]];
  function diamond(cx, cy, s, f) { poly([[cx, cy - HH * s], [cx + HW * s, cy], [cx, cy + HH * s], [cx - HW * s, cy]], f); }
  function prism(cx, cy, hw, hh, h, cT, cL, cR) {
    poly([[cx - hw, cy - h], [cx, cy + hh - h], [cx, cy + hh], [cx - hw, cy]], cL);
    poly([[cx, cy + hh - h], [cx + hw, cy - h], [cx + hw, cy], [cx, cy + hh]], cR);
    poly([[cx, cy - hh - h], [cx + hw, cy - h], [cx, cy + hh - h], [cx - hw, cy - h]], cT);
  }
  function hip(cx, cy, hw, hh, b, rh, cL, cR) { const y = cy - b; poly([[cx - hw, y], [cx, y + hh], [cx, y - rh]], cL); poly([[cx, y + hh], [cx + hw, y], [cx, y - rh]], cR); }
  function faceWin(cx, cy, hw, hh, side, u, v, w, h, f) {
    const p = side === 'L' ? (a, b) => [cx - hw + a * hw, cy + a * hh - b] : (a, b) => [cx + a * hw, cy + hh - a * hh - b];
    poly([p(u, v), p(u + w, v), p(u + w, v + h), p(u, v + h)], f);
  }
  function cyl(cx, cy, r, h, cL, cR, cT) {
    const g = x.createLinearGradient(cx - r, 0, cx + r, 0); g.addColorStop(0, cL); g.addColorStop(1, cR);
    x.beginPath(); x.moveTo(cx + r, cy); x.ellipse(cx, cy, r, r / 2, 0, 0, Math.PI); x.lineTo(cx - r, cy - h); x.ellipse(cx, cy - h, r, r / 2, 0, Math.PI, 2 * Math.PI); x.closePath(); x.fillStyle = g; x.fill();
    ell(cx, cy - h, r, r / 2, cT);
  }
  function cone(cx, y, r, rh, cL, cR) {
    const g = x.createLinearGradient(cx - r, 0, cx + r, 0); g.addColorStop(0, cL); g.addColorStop(1, cR);
    x.beginPath(); x.moveTo(cx - r, y); x.ellipse(cx, y, r, r / 2, 0, Math.PI, 0, true); x.lineTo(cx, y - rh); x.closePath(); x.fillStyle = g; x.fill();
  }

  function piece(k, cx, cy, P) {
    const st = P.style;
    if (k === 'camp') {
      ell(cx + 2, cy + 2, 15, 7, 'rgba(0,0,0,.25)');
      for (let a = 0; a < 8; a++) { const r = a / 8 * Math.PI * 2; ell(cx + Math.cos(r) * 11, cy + Math.sin(r) * 5.5, 3.2, 2.2, a % 2 ? P.stone : P.stoneD); }
      line([[cx - 7, cy + 2], [cx + 6, cy - 2]], P.trunk, 3); line([[cx - 6, cy - 2], [cx + 7, cy + 2]], '#3a2a1e', 3);
      poly([[cx - 5, cy], [cx, cy - 16], [cx + 5, cy]], '#ff8a3a'); poly([[cx - 2.5, cy], [cx + 1, cy - 10], [cx + 3, cy]], '#ffe08a');
      glow(cx, cy - 6, 46, P.glow, .45);
      prism(cx - 22, cy + 6, 9, 4.5, 4, P.trunk, '#5a4030', '#3e2c20');
    } else if (k === 'tree') {
      ell(cx + 3, cy + 2, 14, 6, 'rgba(0,0,0,.28)');
      x.fillStyle = P.trunk; x.fillRect(cx - 2.5, cy - 24, 5, 24);
      const L = P.leaf;
      if (st === 'san') {
        line([[cx, cy - 18], [cx - 12, cy - 28]], P.trunk, 3); line([[cx, cy - 20], [cx + 11, cy - 30]], P.trunk, 3);
        [[-14, -31, 11], [12, -33, 11], [0, -38, 13], [-5, -29, 9], [6, -27, 9]].forEach(([a, b, r]) => circ(cx + a, cy + b + 2, r, L[0]));
        [[-14, -33, 9], [12, -35, 9], [0, -41, 10]].forEach(([a, b, r]) => circ(cx + a - 1, cy + b, r, L[1]));
        [[-16, -36, 4], [9, -39, 4], [-2, -45, 5], [4, -33, 3]].forEach(([a, b, r]) => circ(cx + a, cy + b, r, L[2]));
      } else {
        [[0, -34, 15], [-10, -27, 11], [10, -26, 11], [2, -44, 10]].forEach(([a, b, r]) => circ(cx + a, cy + b + 2, r, L[0]));
        [[-2, -37, 12], [-10, -30, 8], [8, -30, 8], [0, -46, 8]].forEach(([a, b, r]) => circ(cx + a - 1, cy + b, r, L[1]));
        [[-5, -41, 6], [5, -33, 4], [-9, -31, 4], [-1, -49, 4]].forEach(([a, b, r]) => circ(cx + a, cy + b, r, L[2]));
      }
    } else if (k === 'rocks') {
      [[-9, 2, 9, 7], [7, -1, 11, 9], [2, 7, 6, 4]].forEach(([a, b, rx, ry]) => { ell(cx + a + 2, cy + b + 2, rx, ry * .55, 'rgba(0,0,0,.25)'); ell(cx + a, cy + b - ry * .5, rx, ry, P.stoneD); ell(cx + a - rx * .25, cy + b - ry * .75, rx * .65, ry * .6, P.stone); ell(cx + a - rx * .4, cy + b - ry * .95, rx * .25, ry * .22, P.stoneL); });
    } else if (k === 'lantern') {
      ell(cx + 2, cy + 2, 8, 4, 'rgba(0,0,0,.25)');
      if (st === 'san') {
        prism(cx, cy, 7, 3.5, 5, P.stoneL, P.stone, P.stoneD); prism(cx, cy - 5, 3, 1.5, 12, P.stone, P.stone, P.stoneD);
        prism(cx, cy - 17, 7, 3.5, 9, P.stone, P.win, '#e6a868'); hip(cx, cy - 17, 11, 5.5, 9, 8, P.stone, P.stoneD);
        glow(cx, cy - 22, 30, P.glow, .5);
      } else {
        cyl(cx, cy, 2, 30, P.metal, P.metalD, P.metal);
        prism(cx, cy - 30, 5, 2.5, 8, P.metalD, P.win, P.win); hip(cx, cy - 30, 7, 3.5, 8, 6, P.metal, P.metalD);
        glow(cx, cy - 34, 30, P.glow, .55);
      }
    } else if (k === 'pond') {
      diamond(cx, cy, .86, P.stoneD); diamond(cx, cy + 1, .72, P.water);
      const g = x.createLinearGradient(cx - 20, cy - 10, cx + 20, cy + 10); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      diamond(cx, cy + 1, .72, g); line([[cx - 10, cy - 2], [cx + 4, cy - 6]], P.waterL, 1.2); line([[cx - 2, cy + 5], [cx + 10, cy + 1]], P.waterL, 1);
      if (st === 'san') { ell(cx - 8, cy + 2, 4, 2, '#4f7b55'); ell(cx + 7, cy - 3, 3.5, 1.8, '#4f7b55'); circ(cx - 8, cy + 1, 1.6, '#f4c6d4'); }
    } else if (k === 'garden') {
      diamond(cx, cy, .84, P.dirt);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const u = (a - 1) * .5, v = (b - 1) * .5, px = cx + (u - v) * HW * .7, py = cy + (u + v) * HH * .7;
        circ(px, py - 3, 3.4, P.leaf[1]); circ(px - 1, py - 4, 2, P.leaf[2]); if ((a + b) % 2 === 0) circ(px + 1, py - 6, 1.6, P.flower); }
    } else if (k === 'path') {
      diamond(cx, cy, 1, P.stoneD);
      [[-.5, 0], [.5, 0], [0, -.5], [0, .5]].forEach(([u, v], n) => diamond(cx + (u - v) * HW * .5, cy + (u + v) * HH * .5, .44, n % 2 ? P.stone : P.stoneL));
    } else if (k === 'well') {
      ell(cx + 2, cy + 3, 15, 7, 'rgba(0,0,0,.25)');
      cyl(cx, cy, 12, 11, P.stoneL, P.stoneD, P.stone); ell(cx, cy - 11, 9, 4.5, '#0d1418'); ell(cx, cy - 10.5, 6, 2.5, P.water);
      x.fillStyle = P.trunk; x.fillRect(cx - 11, cy - 34, 2.5, 24); x.fillRect(cx + 8.5, cy - 34, 2.5, 24);
      hip(cx, cy, 16, 8, 32, 10, P.roof, P.roofD);
    } else if (k === 'house') {
      ell(cx + 4, cy + 4, 26, 12, 'rgba(0,0,0,.28)');
      if (st === 'san') {
        prism(cx, cy, 22, 11, 22, P.wallL, P.wallL, P.wallR);
        faceWin(cx, cy, 22, 11, 'L', 0, 0, .06, 22, P.metal); faceWin(cx, cy, 22, 11, 'L', .94, 0, .06, 22, P.metalD); faceWin(cx, cy, 22, 11, 'R', .94, 0, .06, 22, P.metalD);
        faceWin(cx, cy, 22, 11, 'L', .3, 6, .4, 11, P.win); faceWin(cx, cy, 22, 11, 'R', .35, 0, .3, 15, P.metalD);
        hip(cx, cy, 31, 15.5, 22, 15, P.roof, P.roofD); line([[cx - 31, cy - 22], [cx - 34, cy - 26]], P.roof, 3); line([[cx + 31, cy - 22], [cx + 34, cy - 26]], P.roofD, 3);
        glow(cx - 12, cy - 6, 26, P.glow, .3);
      } else {
        prism(cx, cy, 22, 11, 24, P.wallL, P.wallL, P.wallR);
        faceWin(cx, cy, 22, 11, 'L', .25, 8, .22, 9, P.win); faceWin(cx, cy, 22, 11, 'L', .6, 8, .22, 9, P.win); faceWin(cx, cy, 22, 11, 'R', .4, 0, .25, 15, P.roofD);
        prism(cx + 8, cy - 26, 3, 1.5, 14, P.stone, P.stone, P.stoneD);
        hip(cx, cy, 27, 13.5, 24, 20, P.roof, P.roofD);
        glow(cx - 10, cy - 12, 26, P.glow, .32);
      }
    } else if (k === 'tower') {
      ell(cx + 5, cy + 4, 22, 10, 'rgba(0,0,0,.3)');
      const tall = towerTall(), s = .55 + .45 * tall;
      if (st === 'san') { // pagoda, one more tier per stage band
        let y = cy, hw = 20; const tiers = 1 + Math.round(3 * tall);
        prism(cx, y, hw + 3, (hw + 3) / 2, 5, P.stoneL, P.stone, P.stoneD); y -= 5;
        for (let n = 0; n < tiers; n++) { const h = 17; prism(cx, y, hw, hw / 2, h, P.wallL, P.wallL, P.wallR); faceWin(cx, y, hw, hw / 2, 'L', .3, 5, .4, 8, P.win); faceWin(cx, y, hw, hw / 2, 'R', .3, 5, .4, 8, '#e0a86a');
          hip(cx, y, hw + 9, (hw + 9) / 2, h, 7, P.roof, P.roofD); y -= h + 5; hw -= 3; }
        line([[cx, y + 4], [cx, y - 18]], P.metal, 2); for (let r = 0; r < 4; r++) ell(cx, y - 2 - r * 4, 3, 1.3, P.metal);
        glow(cx, cy - 40, 60, P.glow, .25);
      } else if (st === 'arc') {
        const h = 78 * s; cyl(cx, cy, 15, h, P.wallL, P.wallR, P.wallL);
        for (let r = 12; r < h; r += 9) line([[cx - 14, cy - r], [cx + 14, cy - r]], 'rgba(0,0,0,.18)', 1);
        x.fillStyle = P.win; x.fillRect(cx - 6, cy - h * .55, 4, 7); x.fillRect(cx + 1, cy - h * .82, 4, 7);
        cone(cx, cy - h, 18, 34, P.roof, P.roofD); line([[cx, cy - h - 34], [cx, cy - h - 48]], '#eee', 1.5); poly([[cx, cy - h - 48], [cx + 12, cy - h - 44], [cx, cy - h - 40]], P.metal);
        glow(cx, cy - h * .6, 40, P.glow, .3);
      } else {
        const h = 84 * s; cyl(cx, cy, 16, h, P.wallL, P.wallR, P.wallL);
        for (let r = 10; r < h; r += 8) line([[cx - 15.5, cy - r], [cx + 15.5, cy - r]], 'rgba(0,0,0,.14)', 1);
        x.fillStyle = P.win; [[-7, .3], [3, .55], [-4, .78]].forEach(([a, f]) => x.fillRect(cx + a, cy - h * f - 8, 3.5, 8));
        ell(cx, cy - h + 6, 20, 9, P.metalD); ell(cx, cy - h + 4, 20, 9, P.metal);
        if (P.cap === 'dome') {
          x.beginPath(); x.ellipse(cx, cy - h, 15, 18, 0, Math.PI, 2 * Math.PI); const g = x.createLinearGradient(cx - 15, 0, cx + 15, 0); g.addColorStop(0, P.metal); g.addColorStop(1, P.metalD); x.fillStyle = g; x.fill();
          x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(cx - 1.5, cy - h - 17, 3, 15); line([[cx - 2, cy - h - 10], [cx + 14, cy - h - 26]], P.metal, 3);
        } else { cone(cx, cy - h, 17, 46, P.roof, P.roofD); line([[cx, cy - h - 46], [cx, cy - h - 58]], P.metal, 1.5); glow(cx, cy - h - 58, 14, P.glow, .7); }
        glow(cx, cy - h * .5, 46, P.glow, .28);
      }
    }
  }

  let MASK = null;
  function mask() { if (MASK) return MASK; MASK = new Set(); const drop = ['0,0', '6,6', '0,6', '6,0', '0,1', '6,5', '1,6'];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (!drop.includes(i + ',' + j)) MASK.add(i + ',' + j); return MASK; }
  const has = (i, j) => mask().has(i + ',' + j);

  function sky(P, key) {
    const g = x.createLinearGradient(0, 0, 0, H); P.sky.forEach((c, n) => g.addColorStop(n / (P.sky.length - 1), c)); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const r = rng(key.length * 7 + 3);
    if (P.fx === 'stars') { for (let n = 0; n < 150; n++) { const sx = r() * W, sy = r() * H * .75, a = .25 + r() * .7; circ(sx, sy, r() < .08 ? 1.5 : .8, `rgba(235,232,255,${a})`); } glow(560, 80, 160, P.glow, .08); }
    if (P.fx === 'moon') { glow(580, 90, 120, '220,235,230', .25); circ(580, 90, 30, '#e9efe6'); circ(570, 84, 6, 'rgba(160,180,175,.35)'); circ(590, 99, 4, 'rgba(160,180,175,.3)');
      for (let n = 0; n < 60; n++) circ(r() * W, r() * H * .6, .8, `rgba(230,240,235,${.2 + r() * .4})`); }
    if (P.fx === 'sun') { const sx = 590, sy = 300, sg = x.createLinearGradient(0, sy - 60, 0, sy + 60); sg.addColorStop(0, '#ffe39a'); sg.addColorStop(1, '#ff8a5a'); circ(sx, sy, 58, sg);
      for (let n = 0; n < 5; n++) { x.fillStyle = P.sky[3]; x.fillRect(sx - 60, sy + 6 + n * 11, 120, 3 + n); }
      for (let n = 0; n < 5; n++) { const cy = 60 + n * 52, cx = (n * 173) % W; x.fillStyle = 'rgba(255,190,170,.18)'; x.fillRect(cx, cy, 120, 8); x.fillRect(cx + 20, cy - 6, 70, 6); } }
    if (P.fx === 'haze') { glow(360, 460, 380, P.glow, .18); for (let n = 0; n < 40; n++) circ(r() * W, r() * H * .5, .8, `rgba(255,200,230,${.15 + r() * .3})`); }
    if (P.fx === 'mist') for (let n = 0; n < 6; n++) { const y = 60 + n * 70; x.fillStyle = `rgba(${P.fog},.07)`; x.fillRect(0, y, W, 26); }
    [[110, 120, .5], [640, 210, .38]].forEach(([fx, fy, s]) => { const c = P.pixel ? 'rgba(60,30,70,.55)' : 'rgba(10,12,30,.45)';
      poly([[fx - 50 * s, fy], [fx + 50 * s, fy], [fx + 30 * s, fy + 18 * s], [fx + 6 * s, fy + 60 * s], [fx - 22 * s, fy + 24 * s]], c); ell(fx, fy, 50 * s, 10 * s, c); });
  }

  function islandBody(P, m, o) {
    const r = rng(5), M = mask();
    let minx = 1e9, maxx = -1e9, maxy = 0;
    M.forEach(key => { const [i, j] = key.split(',').map(Number), [cx, cy] = ctr(i, j); minx = Math.min(minx, cx - HW); maxx = Math.max(maxx, cx + HW); maxy = Math.max(maxy, cy + HH); });
    const pts = []; for (let px = minx; px <= maxx; px += 6) {
      let ty = 0; M.forEach(key => { const [i, j] = key.split(',').map(Number), [cx, cy] = ctr(i, j); if (Math.abs(px - cx) <= HW) ty = Math.max(ty, cy + HH - Math.abs(px - cx) / 2); }); pts.push([px, ty + DEP - 2]); }
    const mid = (minx + maxx) / 2, half = (maxx - minx) / 2, bot = [];
    for (let px = maxx; px >= minx; px -= 9) { const u = (px - mid) / half, d = Math.pow(Math.max(0, 1 - u * u), .9) * 125 + 6; bot.push([px + (r() - .5) * 6, maxy + d * (.82 + r() * .3) - 40]); }
    const all = pts.concat(bot);
    const ug = x.createLinearGradient(0, maxy - 20, 0, maxy + 150); ug.addColorStop(0, P.under[0]); ug.addColorStop(1, P.under[1]); poly(all, ug);
    x.save(); x.beginPath(); x.moveTo(all[0][0], all[0][1]); all.forEach(p => x.lineTo(p[0], p[1])); x.closePath(); x.clip();
    for (let n = 0; n < 9; n++) { const y = maxy + 6 + n * 14, seg = []; for (let px = minx; px <= maxx; px += 14) seg.push([px, y + (r() - .5) * 7]); line(seg, P.strata, 1.4); }
    for (let n = 0; n < 7; n++) { const px = minx + 40 + r() * (half * 2 - 80), y0 = maxy + r() * 40; line([[px, y0], [px + (r() - .5) * 8, y0 + 30 + r() * 40]], 'rgba(0,0,0,.3)', 1.2); }
    x.restore();
    if (P.fall) { line([[mid - 30, maxy + 8], [mid - 32, maxy + 170]], 'rgba(170,215,215,.35)', 3); glow(mid - 31, maxy + 160, 30, '170,215,215', .2); }
    if (P.crystal) [[mid + 40, maxy + 60], [mid - 70, maxy + 40], [mid + 5, maxy + 105]].forEach(([a, b]) => { poly([[a, b], [a + 4, b + 9], [a, b + 18], [a - 4, b + 9]], P.crystal); glow(a, b + 9, 16, P.glow, .35); });
    const keys = [...M].map(k => k.split(',').map(Number)).sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    keys.forEach(([i, j]) => { const [cx, cy] = ctr(i, j);
      if (!has(i, j + 1)) { poly([[cx - HW, cy], [cx, cy + HH], [cx, cy + HH + DEP], [cx - HW, cy + DEP]], P.sideL); poly([[cx - HW, cy], [cx, cy + HH], [cx, cy + HH + 4], [cx - HW, cy + 4]], P.tuft); line([[cx - HW, cy + 11], [cx, cy + HH + 11]], P.strata, 1); }
      if (!has(i + 1, j)) { poly([[cx, cy + HH], [cx + HW, cy], [cx + HW, cy + DEP], [cx, cy + HH + DEP]], P.sideR); poly([[cx, cy + HH], [cx + HW, cy], [cx + HW, cy + 4], [cx, cy + HH + 4]], P.tuft); line([[cx, cy + HH + 12], [cx + HW, cy + 12]], P.strata, 1); }
    });
    keys.forEach(([i, j]) => { const [cx, cy] = ctr(i, j), hs = hash(i, j);
      diamond(cx, cy, 1, P.grass[hs % 3]);
      const tr = rng(hs); for (let n = 0; n < 4; n++) { const u = tr() - .5, v = tr() - .5, px = cx + (u - v) * HW * .8, py = cy + (u + v) * HH * .8; line([[px, py], [px - 1, py - 3]], P.tuft, 1); }
      if (!has(i, j + 1)) line([[cx - HW, cy], [cx, cy + HH]], P.rim, 1.2);
      if (!has(i + 1, j)) line([[cx, cy + HH], [cx + HW, cy]], P.rim, 1.2);
    });
    if (o.grid) keys.forEach(([i, j]) => line(edge(...ctr(i, j)), 'rgba(255,240,210,.16)', 1));
    if (o.hover && has(...o.hover)) { const [cx, cy] = ctr(...o.hover); diamond(cx, cy, 1, 'rgba(255,225,150,.22)'); line(edge(cx, cy), 'rgba(255,225,150,.8)', 1.5); }
    const items = Object.entries(m).filter(([, v]) => v && PBY[v.k]).map(([key, v]) => [...key.split(',').map(Number), v.k]).filter(([i, j]) => has(i, j));
    items.filter(it => PBY[it[2]].flat).forEach(([i, j, k]) => piece(k, ...ctr(i, j), P));
    items.filter(it => !PBY[it[2]].flat).sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || (a[0] - b[0])).forEach(([i, j, k]) => piece(k, ...ctr(i, j), P));
    if (o.sel && m[o.sel.join(',')]) { x.setLineDash([3, 3]); line(edge(...ctr(...o.sel)), 'rgba(255,225,150,.9)', 1.5); x.setLineDash([]); }
    for (let n = 0; n < (o.lights || 0); n++) { const lx = mid - 150 + n * 60 + (n % 2) * 18, ly = 70 + (n % 3) * 26; glow(lx, ly, 18, P.glow, .55); circ(lx, ly, 2, '#fff6dc'); }
  }
  function scene(P, key, m, o) {
    sky(P, key);
    x.save(); x.translate(ZX, ZY); x.scale(ZS, ZS); x.translate(-ZX, -ZY); islandBody(P, m, o); x.restore();
    const fg = x.createLinearGradient(0, H - 140, 0, H); fg.addColorStop(0, `rgba(${P.fog},0)`); fg.addColorStop(1, `rgba(${P.fog},.55)`); x.fillStyle = fg; x.fillRect(0, H - 140, W, 140);
  }
  let low = null;
  function paint(cv, o) {
    const key = worldKey(), P = PAL[key], m = map(), main = cv.getContext('2d');
    const cssW = cv.clientWidth || W, q = Math.max(1, Math.min(2, (window.devicePixelRatio || 1) * cssW / W));
    if (cv.width !== Math.round(W * q)) { cv.width = Math.round(W * q); cv.height = Math.round(H * q); }
    if (P.pixel) { if (!low) { low = document.createElement('canvas'); low.width = W / 4; low.height = H / 4; }
      x = low.getContext('2d'); x.setTransform(.25, 0, 0, .25, 0, 0); scene(P, key, m, o);
      main.setTransform(1, 0, 0, 1, 0, 0); main.imageSmoothingEnabled = false; main.drawImage(low, 0, 0, cv.width, cv.height); }
    else { x = main; x.setTransform(q, 0, 0, q, 0, 0); scene(P, key, m, o); }
  }
  function icon(cv, k) {
    const key = worldKey(), P = PAL[key]; cv.width = 128; cv.height = 112; x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 128, 112);
    const f = PBY[k].flat, s = k === 'tower' ? .95 : k === 'house' ? 1.6 : k === 'well' ? 2 : f ? 1.7 : 2.1;
    x.setTransform(s, 0, 0, s, 64, k === 'tower' ? 108 : k === 'house' ? 88 : k === 'well' ? 100 : f ? 58 : k === 'rocks' ? 76 : 106);
    if (f) diamond(0, 0, 1, P.grass[1]); piece(k, 0, 0, P);
  }

  /* ---------- the view ---------- */
  const ui = { mode: 'look', piece: 'tree', hover: null, sel: null, tip: '' };
  let root = null;
  const stoneTx = n => (n === 0 ? t('mi_stones0') : n === 1 ? t('mi_stone') : t('mi_stones', { n }));
  const dayTx = at => new Date(at || Date.now()).toLocaleDateString(S.lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short' });
  const hTx = () => { const m = Math.round(focusMins()); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h'; };

  function mount(slot) {
    if (!slot) return;
    if (root && slot.contains(root)) { draw(); return; }
    root = document.createElement('div'); root.className = 'mi';
    root.innerHTML = `<div class="mi-stage"><canvas class="mi-cv" aria-label="${esc(t('mi_canvas'))}"></canvas><span class="mi-st"></span></div>
      <div class="mi-side"><div class="seg-toggle" role="group"><button type="button" data-mi="look">${esc(t('mi_look'))}</button><button type="button" data-mi="build">${esc(t('mi_build'))}</button></div>
      <div class="mi-tray" hidden>${PIECES.map(p => `<button type="button" class="mi-pc" data-p="${p.k}"><canvas></canvas><span>${esc(pname(p.k))}</span><small></small></button>`).join('')}</div>
      <p class="mi-card" aria-live="polite"></p><p class="mi-rule">${esc(t('mi_rule'))}</p></div>`;
    slot.appendChild(root);
    const cv = root.querySelector('canvas.mi-cv');
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-mi]'); if (b) { ui.mode = b.dataset.mi; ui.sel = null; ui.tip = ''; draw(); return; }
      const p = e.target.closest('.mi-pc'); if (p) { ui.piece = p.dataset.p; const P = PBY[p.dataset.p];
        ui.tip = hoursNow() < P.h ? t('mi_lock', { p: pname(P.k), h: P.h, a: hTx() }) : ''; draw(); }
    });
    cv.addEventListener('click', e => tap(tileAt(cv, e)));
    cv.addEventListener('pointermove', e => { if (ui.mode !== 'build' || e.pointerType !== 'mouse') return; const tl = tileAt(cv, e); if (String(tl) !== String(ui.hover)) { ui.hover = tl; drawCanvas(); } });
    cv.addEventListener('pointerleave', () => { if (ui.hover) { ui.hover = null; drawCanvas(); } });
    draw();
  }
  function tileAt(cv, e) {
    const r = cv.getBoundingClientRect(), mx = ((e.clientX - r.left) * W / r.width - ZX) / ZS + ZX, my = ((e.clientY - r.top) * H / r.height - ZY) / ZS + ZY;
    const dx = (mx - OX) / HW, dy = (my - (OY - HH)) / HH, i = Math.floor((dy + dx) / 2), j = Math.floor((dy - dx) / 2);
    return has(i, j) ? [i, j] : null;
  }
  function tap(tl) {
    if (!tl) return;
    const m = map(), key = tl.join(','), cur = m[key] && PBY[m[key].k] ? m[key] : null;
    if (ui.mode === 'look') {
      ui.sel = cur ? tl : null;
      ui.tip = !cur ? t('mi_free') : cur.k === 'camp' ? t('mi_camp', { d: dayTx(cur.at) })
        : cur.task ? t('mi_placed', { p: pname(cur.k), d: dayTx(cur.at), task: cur.task }) : t('mi_placed0', { p: pname(cur.k), d: dayTx(cur.at) });
      draw(); return;
    }
    if (cur) {
      if (cur.k === 'camp') { ui.tip = t('mi_camp_stays'); draw(); return; }
      delete m[key]; save(); ui.tip = '';
      ML.toast(t('mi_back', { p: pname(cur.k) }), { key: 'mi', action: { label: t('mi_undo'), fn: () => { if (!map()[key]) { map()[key] = cur; save(); draw(); } } } });
      draw(); return;
    }
    const P = PBY[ui.piece];
    if (hoursNow() < P.h) { ui.tip = t('mi_lock', { p: pname(P.k), h: P.h, a: hTx() }); draw(); return; }
    if (P.c > stones()) { ui.tip = t('mi_need', { n: P.c }); draw(); return; }
    const last = (S.sessions || [])[S.sessions.length - 1];
    m[key] = { k: P.k, at: Date.now(), task: last && last.title ? String(last.title).slice(0, 60) : undefined };
    save(); ui.tip = t('mi_put', { p: pname(P.k) });
    draw();
  }
  function drawCanvas() {
    if (!root || !root.isConnected) return;
    paint(root.querySelector('canvas.mi-cv'), { grid: ui.mode === 'build', hover: ui.mode === 'build' ? ui.hover : null, sel: ui.mode === 'look' ? ui.sel : null, lights: Math.min(6, todayN()) });
  }
  let iconKey = '';
  function draw() {
    if (!root || !root.isConnected) return;
    const n = stones(), h = hoursNow(), only = Object.keys(map()).length <= 1;
    root.querySelector('.mi-st').textContent = stoneTx(n);
    root.querySelectorAll('[data-mi]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mi === ui.mode)));
    const tray = root.querySelector('.mi-tray'); tray.hidden = ui.mode !== 'build';
    const wk = worldKey() + S.lang;
    tray.querySelectorAll('.mi-pc').forEach(b => { const P = PBY[b.dataset.p], lock = h < P.h;
      b.setAttribute('aria-pressed', String(P.k === ui.piece)); b.classList.toggle('poor', lock || P.c > n);
      b.querySelector('small').textContent = lock ? t('mi_opens', { h: P.h }) : stoneTx(P.c);
      if (iconKey !== wk) icon(b.querySelector('canvas'), P.k); });
    iconKey = wk;
    root.querySelector('.mi-card').textContent = ui.tip || (ui.mode === 'build' ? t('mi_build_tip') : only ? (n ? t('mi_intro') : t('mi_first')) : t('mi_look_tip'));
    drawCanvas();
  }
  ML.myIsland = { mount, view: () => (B().view === 'mine' ? 'mine' : 'isle'), setView: v => { B().view = v === 'mine' ? 'mine' : 'isle'; save(); } };
  ['session', 'mood', 'world', 'theme', 'remote', 'cosmetics'].forEach(ev => on(ev, () => { iconKey = ''; draw(); }));
  on('lang', () => { iconKey = ''; }); // the World page rebuilds its html on a language change, and mount() makes a new view
  let rz = 0; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawCanvas, 150); });
})();
