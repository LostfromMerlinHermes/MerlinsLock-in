// Expeditions and Seasons (3.59, on top of the mage tower in companion.js; picked in proposals/rentree/rentree2.html).
// Expeditions: a day with at least 15 minutes of focus sends the familiar out; it comes back the next day with a short
// report and an object that furnishes a floor (the more focus, the rarer). Nothing to click and nothing during work.
// Seasons: each semester has its own tower. Its floors come from S.tower.log, each exam passed adds a wing, and a recap
// picture can be made at any time; the lifetime floor count doesn't change.
(() => {
  'use strict';
  const { $, S, t, esc, on, save, today, addDays, dayKey, toast } = ML;

  // id, tier (0 common, 1 rare, 2 epic), drawing in a 24 x 24 box
  const OBJECTS = [
    ['atlas', 0, '<path d="M5 5h14v15H5z"/><path d="M12 5v15M8 9h2M14 9h2"/>'], ['candle', 0, '<path d="M9 11h6v9H9zM12 11V8"/><path d="M12 3c2 2 2 3 0 5-2-2-2-3 0-5z"/>'], ['stool', 0, '<path d="M5 8h14M7 8l-2 12M17 8l2 12M6 14h12"/>'],
    ['rug', 0, '<path d="M4 7h16v10H4z"/><path d="M8 7v10M16 7v10M4 12h16"/>'], ['shelf', 0, '<path d="M4 4h16v16H4zM4 12h16"/><path d="M7 7v5M10 7v5M14 15v5M17 15v5"/>'], ['kettle', 0, '<path d="M6 11c0-3 3-4 6-4s6 1 6 4v8H6z"/><path d="M18 12l3-2M9 7c0-3 6-3 6 0"/>'],
    ['ink', 0, '<path d="M8 9h8l2 11H6zM10 9V5h4v4"/>'], ['basket', 0, '<path d="M4 11h16l-2 9H6zM7 11c0-8 10-8 10 0"/>'], ['lantern', 0, '<path d="M8 8h8v11H8zM10 8V5h4v3M12 3v2"/><path d="M12 11v5"/>'], ['clock', 0, '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>'],
    ['globe', 1, '<circle cx="12" cy="10" r="6"/><path d="M6 10h12M12 4c3 3 3 9 0 12M12 4c-3 3-3 9 0 12M12 16v4M8 20h8"/>'], ['telescope', 1, '<path d="M4 13l13-7 2 4-13 7zM11 14l-3 7M12 14l3 7"/>'], ['harp', 1, '<path d="M7 20V5c6 0 10 5 10 15z"/><path d="M10 8v12M13 11v9"/>'], ['chess', 1, '<path d="M8 20h8l-2-7h-4zM10 13c-3-4 1-9 4-9l1 4 2 2-3 3"/>'],
    ['compass', 1, '<circle cx="12" cy="12" r="8"/><path d="M15 9l-2 4-4 2 2-4z"/>'], ['loom', 1, '<path d="M5 4v16M19 4v16M5 7h14M5 17h14"/><path d="M9 7v10M12 7v10M15 7v10"/>'], ['fern', 1, '<path d="M8 15h8l-1 6H9zM12 15V5M12 8l-4-3M12 8l4-3M12 12l-4-3M12 12l4-3"/>'], ['abacus', 1, '<path d="M4 4h16v16H4zM4 9h16M4 15h16"/><circle cx="9" cy="9" r="1.5"/><circle cx="14" cy="9" r="1.5"/><circle cx="11" cy="15" r="1.5"/>'],
    ['astrolabe', 2, '<circle cx="12" cy="13" r="8"/><circle cx="12" cy="13" r="3"/><path d="M12 5V2M5 9l14 8"/>'], ['orrery', 2, '<circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="10"/><circle cx="18" cy="12" r="1.2"/><circle cx="5" cy="5" r="1.2"/>'], ['organ', 2, '<path d="M5 20V9M9 20V5M13 20V3M17 20V7M4 20h16"/>'], ['sextant', 2, '<path d="M12 3L5 17c4 3 10 3 14 0z"/><path d="M12 3v14"/>'], ['bell', 2, '<path d="M6 17c2-2 1-5 2-8 1-4 7-4 8 0 1 3 0 6 2 8zM10 20h4"/>'], ['window', 2, '<path d="M6 21V10c0-8 12-8 12 0v11z"/><path d="M12 4v17M6 13h12"/>'],
  ];
  const fr = {
    x_atlas: 'un atlas usé', x_candle: 'une chandelle', x_stool: 'un tabouret', x_rug: 'un tapis', x_shelf: 'une étagère', x_kettle: 'une bouilloire', x_ink: 'un encrier', x_basket: 'un panier', x_lantern: 'une lanterne', x_clock: 'une horloge', x_globe: 'un globe', x_telescope: 'une lunette', x_harp: 'une petite harpe', x_chess: 'un jeu d’échecs', x_compass: 'une boussole', x_loom: 'un métier à tisser', x_fern: 'une fougère en pot', x_abacus: 'un boulier', x_astrolabe: 'un astrolabe', x_orrery: 'une sphère des planètes', x_organ: 'un petit orgue', x_sextant: 'un sextant', x_bell: 'une cloche de bronze', x_window: 'un vitrail',
    xp_0: 'la forêt derrière la tour', xp_1: 'un col sous la neige', xp_2: 'les caves d’une vieille bibliothèque', xp_3: 'un marché de nuit', xp_4: 'un moulin abandonné', xp_5: 'la rive d’un lac gelé', xp_6: 'un phare éteint', xp_7: 'des jardins en terrasses', xp_8: 'un pont couvert', xp_9: 'une mine de sel', xp_10: 'un observatoire en ruine', xp_11: 'un port sous la pluie',
    xe_0: 'Il a suivi une piste jusqu’à la nuit.', xe_1: 'La route était plus longue que prévu.', xe_2: 'Il a attendu que la pluie passe.', xe_3: 'Un vieux gardien lui a montré le chemin.', xe_4: 'Il a tout fouillé, méthodiquement.', xe_5: 'Il s’est perdu, puis retrouvé.', xe_6: 'Il a dormi sous les étoiles.', xe_7: 'Il a échangé son déjeuner contre un renseignement.',
    ex_h: 'Expéditions', ex_report: '{name} a exploré {place}. {event} Il rapporte {item}.', ex_floor: 'Meuble l’étage {n}', ex_toast: '{name} est rentré avec {item}.', ex_out: '{name} partira demain : {m} de focus aujourd’hui.', ex_wait: 'Une journée avec au moins 15 min de focus envoie {name} en expédition. Il revient le lendemain.', ex_found: 'Objets trouvés : {n} sur {m}', ex_rare: 'Plus tu travailles dans la journée, plus l’objet est rare.', ex_dup: 'Il rapporte aussi {g} ◈ de ses doublons.', ex_unknown: 'Pas encore trouvé', ex_last: 'Dernier retour',
    se_h: 'Saison', se_s1: 'Semestre d’automne {y}', se_s2: 'Semestre de printemps {y}', se_floors: '{n} étages cette saison', se_wings: '{n} ailes, une par examen passé', se_time: '{m} de focus', se_days: '{n} jours travaillés', se_days_one: '{n} jour travaillé', se_l_floors: 'Étages', se_l_wings: 'Ailes', se_recap: 'Image du bilan', se_rules: 'Chaque semestre a sa propre tour. Ton total d’étages reste compté.', se_saved: 'Image enregistrée.', se_new: 'Nouvelle saison : une nouvelle tour commence.',
  };
  const en = {
    x_atlas: 'a worn atlas', x_candle: 'a candle', x_stool: 'a stool', x_rug: 'a rug', x_shelf: 'a shelf', x_kettle: 'a kettle', x_ink: 'an inkwell', x_basket: 'a basket', x_lantern: 'a lantern', x_clock: 'a clock', x_globe: 'a globe', x_telescope: 'a telescope', x_harp: 'a small harp', x_chess: 'a chess set', x_compass: 'a compass', x_loom: 'a loom', x_fern: 'a potted fern', x_abacus: 'an abacus', x_astrolabe: 'an astrolabe', x_orrery: 'an orrery', x_organ: 'a small organ', x_sextant: 'a sextant', x_bell: 'a bronze bell', x_window: 'a stained-glass window',
    xp_0: 'the forest behind the tower', xp_1: 'a snowy pass', xp_2: 'the cellars of an old library', xp_3: 'a night market', xp_4: 'an abandoned mill', xp_5: 'the shore of a frozen lake', xp_6: 'a dark lighthouse', xp_7: 'terraced gardens', xp_8: 'a covered bridge', xp_9: 'a salt mine', xp_10: 'a ruined observatory', xp_11: 'a harbour in the rain',
    xe_0: 'It followed a trail until nightfall.', xe_1: 'The road was longer than expected.', xe_2: 'It waited for the rain to pass.', xe_3: 'An old keeper showed it the way.', xe_4: 'It searched everything, methodically.', xe_5: 'It got lost, then found the way back.', xe_6: 'It slept under the stars.', xe_7: 'It traded its lunch for a tip.',
    ex_h: 'Expeditions', ex_report: '{name} explored {place}. {event} It brings back {item}.', ex_floor: 'Furnishes floor {n}', ex_toast: '{name} came back with {item}.', ex_out: '{name} leaves tomorrow: {m} of focus today.', ex_wait: 'A day with at least 15 min of focus sends {name} on an expedition. It comes back the next day.', ex_found: 'Objects found: {n} of {m}', ex_rare: 'The more you work in a day, the rarer the object.', ex_dup: 'It also brings {g} ◈ from its duplicates.', ex_unknown: 'Not found yet', ex_last: 'Last return',
    se_h: 'Season', se_s1: 'Autumn semester {y}', se_s2: 'Spring semester {y}', se_floors: '{n} floors this season', se_wings: '{n} wings, one per exam passed', se_time: '{m} of focus', se_days: '{n} days worked', se_days_one: '{n} day worked', se_l_floors: 'Floors', se_l_wings: 'Wings', se_recap: 'Recap picture', se_rules: 'Each semester has its own tower. Your total floor count stays.', se_saved: 'Picture saved.', se_new: 'New season: a new tower begins.',
  };
  ML.addStrings({ fr, en });

  const X = () => { const T = S.tower; if (!T.exp) T.exp = { last: addDays(today(), -2), reports: [], found: [] }; return T.exp; };
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  const famName = () => (S.companion && S.companion.name) || ({ owl: 'Nox', cat: 'Salem', raven: 'Corvus', fox: 'Kitsu', hippo: 'Hippolyte' })[(S.econ && S.econ.equip.familiar) || 'owl'];
  const minsOn = k => (S.sessions || []).reduce((a, s) => a + (dayKey(new Date(s.at)) === k ? s.mins : 0), 0);

  // One report per past day with enough focus, at most a week back. A found object is kept for good; found twice, it pays a little gold.
  function collect() {
    if (!S.tower || !S.econ) return;
    const E = X(), td = today(); let k = E.last, tries = 0, fresh = null;
    if (k < addDays(td, -8)) k = addDays(td, -8);
    while (k < addDays(td, -1) && tries++ < 8) {
      k = addDays(k, 1);
      const m = minsOn(k); if (m < 15) continue;
      const h = hash(k + famName()), tier = m >= 120 ? 2 : m >= 60 ? 1 : 0, pool = OBJECTS.filter(o => o[1] <= tier && !E.found.includes(o[0])).sort((a, b) => b[1] - a[1]);
      const best = pool.filter(o => o[1] === (pool[0] ? pool[0][1] : 0));
      const obj = best.length ? best[h % best.length] : OBJECTS[h % OBJECTS.length], dup = !best.length, gold = dup ? 10 + tier * 10 : 0;
      if (!dup) E.found.push(obj[0]); else S.econ.gold += gold;
      fresh = { day: k, place: h % 12, event: (h >> 4) % 8, item: obj[0], mins: m, gold, floor: E.found.indexOf(obj[0]) + 1 };
      E.reports.unshift(fresh);
    }
    E.last = k; E.reports = E.reports.slice(0, 14);
    save();
    return fresh;
  }
  function announce() {
    const r = collect(); if (!r || !ML.modOn('game')) return; // the game module off: the object is still found, just not announced
    const show = () => toast(t('ex_toast', { name: famName(), item: t('x_' + r.item) }), { ms: 7000, action: { label: t('ex_h'), fn: () => { ML.setMobileView('grim'); setTimeout(() => { const c = $('exp-card'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 80); } } });
    if (ML.running()) { const f = () => { if (!ML.running()) { ML.off && ML.off('timer', f); if (!shown) { shown = true; show(); } } }; let shown = false; on('timer', f); } else show(); // never during a session
  }
  ML.furnished = () => X().found.length;

  /* ---------- Seasons ---------- */
  const seasonOf = k => { const y = +k.slice(0, 4), m = +k.slice(5, 7); return m >= 9 ? { id: y + '-A', from: y + '-09-01', to: (y + 1) + '-01-31', y, name: 'se_s1' } : m === 1 ? { id: (y - 1) + '-A', from: (y - 1) + '-09-01', to: y + '-01-31', y: y - 1, name: 'se_s1' } : { id: y + '-S', from: y + '-02-01', to: y + '-08-31', y, name: 'se_s2' }; };
  function seasonStats(sn) {
    const inS = k => k >= sn.from && k <= sn.to;
    const floors = Object.entries((S.tower && S.tower.log) || {}).reduce((a, [k, v]) => a + (inS(k) ? v : 0), 0);
    const wings = ((S.study && S.study.exams) || []).filter(x => inS(x.date) && x.date < today()).length;
    const ss = (S.sessions || []).filter(s => inS(dayKey(new Date(s.at)))), mins = ss.reduce((a, s) => a + s.mins, 0), days = new Set(ss.map(s => dayKey(new Date(s.at)))).size;
    return { floors, wings, mins, days, id: sn.id, name: t(sn.name, { y: sn.y }) };
  }
  ML.seasonNow = () => seasonStats(seasonOf(today()));

  // The recap: a picture drawn on a canvas, in the world's colours
  function recapCanvas() {
    const st = ML.seasonNow(), W = 900, H = 1200, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), cs = getComputedStyle(document.documentElement), v = (k, d) => cs.getPropertyValue(k).trim() || d;
    const ink = v('--text', '#eee'), mist = v('--mist', '#aaa'), acc = v('--accent', '#e8935a'), bg = v('--panel', '#1a1520'), line = v('--line-2', '#3a3044');
    const disp = v('--f-display', 'Georgia, serif');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = acc; g.font = `600 30px ${disp}`; g.textAlign = 'center'; g.fillText('MerlinsLockIN', W / 2, 90);
    g.fillStyle = ink; g.font = `600 56px ${disp}`; g.fillText(st.name, W / 2, 165);
    const n = Math.min(24, st.floors), fh = 26, tw = 220, tx = (W - tw) / 2, base = 880;
    g.fillStyle = line; g.fillRect(tx - 40, base, tw + 80, 26);
    for (let i = 0; i < n; i++) { const y = base - (i + 1) * fh; g.fillStyle = acc; g.globalAlpha = .28 + .5 * (i / Math.max(1, n)); g.fillRect(tx, y, tw, fh - 3); g.globalAlpha = 1; g.fillStyle = bg; for (let w = 0; w < 3; w++) g.fillRect(tx + 34 + w * 62, y + 7, 26, fh - 16); }
    const top = base - n * fh; g.fillStyle = acc; g.beginPath(); g.moveTo(tx - 20, top); g.lineTo(W / 2, top - 90); g.lineTo(tx + tw + 20, top); g.closePath(); g.fill();
    for (let i = 0; i < Math.min(8, st.wings); i++) { const left = i % 2 === 0, lvl = Math.floor(i / 2), x = left ? tx - 90 : tx + tw, y = base - (lvl + 1) * 62; g.fillStyle = acc; g.globalAlpha = .55; g.fillRect(x, y, 90, 58); g.globalAlpha = 1; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 45, y - 34); g.lineTo(x + 96, y); g.closePath(); g.fill(); }
    g.fillStyle = ink; g.font = `600 40px ${disp}`; g.fillText(t('se_floors', { n: st.floors }), W / 2, 975);
    g.fillStyle = mist; g.font = `400 30px ${v('--f-body', 'system-ui, sans-serif')}`;
    g.fillText(t('se_time', { m: ML.fmtMins(st.mins) }) + ' · ' + ML.tn('se_days', st.days), W / 2, 1030);
    g.fillText(t('se_wings', { n: st.wings }) + ' · ' + t('ex_found', { n: X().found.length, m: OBJECTS.length }), W / 2, 1080);
    return c;
  }
  function saveRecap() {
    const c = recapCanvas(), url = c.toDataURL('image/png');
    if (ML.CAN_DOWNLOAD) { const a = document.createElement('a'); a.href = url; a.download = 'merlinslockin-' + ML.seasonNow().id + '.png'; a.click(); toast(t('se_saved')); return; }
    const w = $('se-pic'); if (w) w.innerHTML = `<img src="${url}" alt="${esc(t('se_recap'))}">`; // no downloads in the artifact: show it, it can be saved by hand
  }

  /* ---------- Grimoire cards, after the tower ---------- */
  on('grimoire', () => {
    if (!S.tower) return;
    collect();
    const E = X(), last = E.reports[0], todayM = minsOn(today()), name = famName(), st = ML.seasonNow();
    const report = r => t('ex_report', { name, place: t('xp_' + r.place), event: t('xe_' + r.event), item: t('x_' + r.item) });
    const card = document.createElement('div');
    card.className = 'g-card exp-card'; card.id = 'exp-card';
    card.innerHTML = `<h2>${esc(t('ex_h'))}</h2>
      <p class="insight">${esc(todayM >= 15 ? t('ex_out', { name, m: ML.fmtMins(todayM) }) : t('ex_wait', { name }))}</p>
      ${last ? `<div class="exp-report"><span class="label">${esc(t('ex_last'))}</span><p>${esc(report(last))}${last.gold ? ' ' + esc(t('ex_dup', { g: last.gold })) : ''}</p>${last.gold ? '' : `<small>${esc(t('ex_floor', { n: last.floor }))}</small>`}</div>` : ''}
      <span class="label">${esc(t('ex_found', { n: E.found.length, m: OBJECTS.length }))}</span>
      <ul class="exp-grid">${OBJECTS.map(([id, tier, d]) => { const has = E.found.includes(id), nm = has ? t('x_' + id) : t('ex_unknown'); return `<li class="${has ? 'has tier-' + tier : ''}" title="${esc(nm)}"><svg viewBox="0 0 24 24" role="img" aria-label="${esc(nm)}">${has ? d : '<circle cx="12" cy="12" r="2"/>'}</svg></li>`; }).join('')}</ul>
      <p class="hint">${esc(t('ex_rare'))}</p>`;
    const sea = document.createElement('div');
    sea.className = 'g-card season-card'; sea.id = 'season-card';
    sea.innerHTML = `<h2>${esc(t('se_h'))}</h2><div><strong class="se-name">${esc(st.name)}</strong></div>
      <div class="g-row"><div class="kpi"><strong>${st.floors}</strong><span>${esc(t('se_l_floors'))}</span></div><div class="kpi"><strong>${st.wings}</strong><span>${esc(t('se_l_wings'))}</span></div><div class="kpi"><strong>${esc(ML.fmtMins(st.mins))}</strong><span>${esc(ML.tn('se_days', st.days))}</span></div></div>
      <p class="hint">${esc(t('se_rules'))}</p>
      <button type="button" class="small" id="se-recap">${esc(t('se_recap'))}</button><div id="se-pic" class="se-pic"></div>`;
    const game = $('g-game'), tw = $('tower-card');
    if (tw) { tw.after(card); card.after(sea); } else { game.append(card, sea); }
    $('se-recap').onclick = saveRecap;
  });
  // A session that has just ended may change today's line; a new day brings the familiar home
  on('newday', announce);
  on('started', () => { announce(); });
  // New season: said once
  on('started', () => { const id = seasonOf(today()).id; if (S.tower && S.tower.season && S.tower.season !== id) toast(t('se_new'), { ms: 6000 }); if (S.tower && S.tower.season !== id) { S.tower.season = id; save(); } });
})();
