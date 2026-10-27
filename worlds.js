// World choice (3.29): every energy has three worlds (day, night, light/Premium), chosen per energy instead of the old
// day / night switch. This file draws the small world tiles, the header World button and its sheet; the energy picker
// (energy.js) shows the same tiles under the energies. The theme logic itself is in game.js (ML.setWorld, ML.worldsFor).
(() => {
  'use strict';
  const { S, t, esc, on, $ } = ML;

  // One small drawing per world (viewBox 100×100): its ground colour and one motif, so the twelve read at a glance
  const dots = (pts, r, c) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');
  const sq = (pts, s, c) => pts.map(([x, y]) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${c}"/>`).join('');
  const TILES = {
    sanctuary: ['#08101a', `<circle cx="70" cy="34" r="12" fill="#f5c372" opacity=".9"/>${dots([[20, 60], [40, 74], [62, 66], [80, 82], [30, 88], [52, 50]], 1.8, '#f5c372')}<path d="M0 100 Q30 80 55 92 T100 86 V100Z" fill="#13202f"/>`],
    abyss: ['#020b12', `<g fill="none" stroke="#7fcfbd" stroke-width="2.4"><path d="M30 40 a14 12 0 0 1 28 0"/><path d="M34 40 q-2 16 2 26 M44 40 q0 18 -2 30 M54 40 q2 14 -1 24"/></g>${dots([[72, 70], [78, 58], [20, 80]], 1.8, '#a49af0')}`],
    aube: ['#F3EEE2', `<path d="M0 100 L0 70 Q12 40 22 66 Q30 30 44 62 Q54 46 62 70 Q74 36 86 64 L100 58 V100Z" fill="#2E3A8C" opacity=".75"/><rect x="74" y="12" width="14" height="14" fill="#C8102E"/>`],
    observatory: ['#17120c', `<g fill="none" stroke="#C9A45C" stroke-width="2.4"><circle cx="50" cy="50" r="28"/><ellipse cx="50" cy="50" rx="28" ry="10" transform="rotate(-25 50 50)"/><ellipse cx="50" cy="50" rx="28" ry="10" transform="rotate(35 50 50)" opacity=".6"/></g><circle cx="50" cy="50" r="5" fill="#e58c52"/>`],
    sorcerer: ['#0d0a1c', `<path d="M18 30 L40 22 L58 40 L80 30 M58 40 L50 70 L76 78" stroke="#a678ff" stroke-width="1.6" fill="none"/>${dots([[18, 30], [40, 22], [58, 40], [80, 30], [50, 70], [76, 78]], 3, '#c9b8ff')}`],
    atelier: ['#E9DCC0', `<path d="M0 100 V76 H14 V68 H24 V78 H34 V64 H40 V50 L45 36 L50 50 V64 H58 V72 H70 V62 H80 V74 H100 V100Z" fill="#6E6150" opacity=".85"/><circle cx="45" cy="56" r="4" fill="#E9DCC0"/><rect x="0" y="88" width="100" height="12" fill="#A8B4B4" opacity=".6"/>`],
    netrunner: ['#04040a', `<g stroke="#00f0ff" stroke-width="2">${[10, 24, 38, 52, 66, 80, 92].map((x, i) => `<line x1="${x}" y1="${(i * 17) % 40}" x2="${x}" y2="${(i * 17) % 40 + 30}" opacity="${0.4 + (i % 3) * 0.2}"/>`).join('')}</g><rect x="58" y="66" width="30" height="5" fill="#ff2bd6"/>`],
    neoncity: ['#0b0418', `<path d="M0 100 V64 H12 V50 H24 V70 H34 V40 H44 V60 H56 V46 H68 V66 H80 V54 H100 V100Z" fill="#2a1150"/>${sq([[16, 56], [38, 48], [60, 54]], 3, '#ff3fa4')}<circle cx="76" cy="24" r="10" fill="#ffa34a" opacity=".85"/>`],
    tokyo: ['#F7F5EF', `<circle cx="28" cy="70" r="14" fill="#E3001B"/><path d="M40 100 V50 H50 V30 H58 V100 Z M64 100 V58 H76 V40 H84 V100Z" fill="#111"/><line x1="0" y1="84" x2="100" y2="84" stroke="#111" stroke-width="2"/>`],
    arcade: ['#110b22', `${sq([[16, 20], [70, 16], [44, 36], [84, 44], [24, 56]], 4, '#ffb547')}${sq([[56, 64], [12, 78]], 4, '#5ad1ff')}<rect x="0" y="88" width="100" height="12" fill="#241b47"/>`],
    fog: ['#0c0c0f', `<rect x="30" y="18" width="40" height="64" rx="3" fill="none" stroke="#c9a55c" stroke-width="2.4"/><path d="M50 36 L54 48 L66 50 L54 52 L50 64 L46 52 L34 50 L46 48Z" fill="#e85a6f"/><rect x="0" y="70" width="100" height="30" fill="#b5afa4" opacity=".14"/>`],
    cartouche: ['#C9DB9A', `<path d="M0 100 V70 Q20 52 40 70 Q60 48 82 66 Q92 60 100 64 V100Z" fill="#306230"/><rect x="18" y="20" width="22" height="8" fill="#E3EDC8"/><rect x="24" y="14" width="10" height="6" fill="#E3EDC8"/><rect x="70" y="56" width="8" height="12" fill="#0F380F"/>`],
  };
  // key: a theme id or a light-skin id (game.js LIGHT_NAME)
  const art = key => { const d = TILES[key] || TILES.sorcerer; return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100" height="100" fill="${d[0]}"/>${d[1]}</svg>`; };
  ML.worldArt = art;
  const keyOfNow = m => { const w = ML.worldNow(m); return w.light ? { sanctuary: 'aube', observatory: 'atelier', netrunner: 'tokyo', arcade: 'cartouche' }[w.th] : w.th; };

  // The three tiles of an energy; `sel` is the chosen w ('day' | 'night' | 'light'). attr names the click data attribute.
  // With "follow the hour" the world on screen can be another one than the chosen tile (the night one after 21:00): it gets a "Now" tag.
  ML.worldTiles = (m, sel, attr) => {
    const now = keyOfNow(m), ws = ML.worldsFor(m), selKey = (ws.find(x => x.w === sel) || {}).key;
    return ws.map(x => {
      const shown = x.key === now && now !== selKey;
      return `<button type="button" class="wtile ${x.locked ? 'locked' : ''} ${shown ? 'now' : ''}" ${attr}="${x.w}" aria-pressed="${x.w === sel}" aria-label="${esc(x.name + (x.locked ? ' · ' + t('wb_premium') : '') + (shown ? ' · ' + t('wb_now') : ''))}">
      <span class="wtile-art">${art(x.key)}${x.locked ? `<i class="wtile-lock">${esc(t('wb_premium'))}</i>` : ''}${shown ? `<i class="wtile-now">${esc(t('wb_now'))}</i>` : ''}</span><span class="wtile-n">${esc(x.name)}</span></button>`;
    }).join('');
  };
  // A locked (Premium) tile: say so and offer the 1-minute trial instead of choosing it
  ML.worldLocked = m => {
    const x = ML.worldsFor(m).find(y => y.w === 'light');
    ML.toast(t('wb_locked', { w: x.name }), { key: 'daynight', ms: 5000, action: { label: t('wb_try'), fn: () => ML.tryWorld && ML.tryWorld(m, 60000) } });
  };
  // "Follow the hour" label for an energy: which world by day, which after 21:00
  ML.worldClockText = (m, w) => {
    const ws = ML.worldsFor(m), day = ws.find(x => x.w === (w === 'light' && !ws[2].locked ? 'light' : 'day')), night = ws[1];
    return { day: day.name, night: night.name };
  };

  /* ---------- Header button ---------- */
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'ghost world-btn'; btn.id = 'world-btn';
  // Wide screens: in the header. Phones and the side panel (html.mnav-on): beside the energy pill, where the header has no room left
  function place() {
    const narrow = document.documentElement.classList.contains('mnav-on'), pill = $('ep-pill'), before = $('install-btn');
    if (narrow && pill) { if (btn.previousElementSibling !== pill) pill.after(btn); }
    else if (before && btn.parentNode !== before.parentNode) before.parentNode.insertBefore(btn, before); // (Washi's settings may follow it)
  }
  place();
  addEventListener('resize', () => setTimeout(place, 50));
  function renderBtn() {
    place();
    btn.hidden = ML.worldsFixed() || S.section === 'sport';
    if (btn.hidden) return;
    const name = ML.worldName(S.mood);
    btn.innerHTML = `<span class="world-sw">${art(keyOfNow(S.mood))}</span><span class="world-nm">${esc(name)}</span><svg class="world-car" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>`;
    btn.title = t('wb_btn', { w: name }); btn.setAttribute('aria-label', btn.title);
  }
  btn.onclick = () => { ML.emit('gesture'); openSheet(); };

  /* ---------- The sheet: three worlds of today's energy + always / follow the hour ---------- */
  const ov = document.createElement('div');
  ov.className = 'overlay wsheet-ov'; ov.id = 'worlds'; ov.hidden = true;
  document.body.appendChild(ov);
  function renderSheet() {
    const m = S.mood, p = ML.worldPick(m), ws = ML.worldsFor(m);
    if (p.w === 'light' && ws[2].locked) p.w = 'day';
    const c = ML.worldClockText(m, p.w), mood = t('mood_' + m);
    ov.innerHTML = `<div class="sheet wsheet" role="dialog" aria-modal="true" aria-labelledby="wsheet-h">
      <div class="sheet-head"><h2 id="wsheet-h">${esc(t('wb_h', { mood }))}</h2><button type="button" class="ghost icon-only" data-close="worlds" aria-label="${esc(t('close'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="wtiles">${ML.worldTiles(m, p.w, 'data-wpick')}</div>
      <div class="wmodes" role="radiogroup">
        <button type="button" role="radio" aria-checked="${!p.clock}" data-wclock="0"><i></i>${esc(t('wb_always'))}</button>
        <button type="button" role="radio" aria-checked="${!!p.clock}" data-wclock="1"><i></i>${esc(t('wb_clock', c))}</button>
      </div>
      <p class="hint">${esc(t('wb_kept', { mood }))}</p></div>`;
  }
  function openSheet() { renderSheet(); ML.openOverlay('worlds'); }
  ML.openWorlds = openSheet;
  ov.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const m = S.mood, p = ML.worldPick(m);
    if (b.dataset.wpick) {
      if (b.classList.contains('locked')) { ML.worldLocked(m); return; }
      ML.setWorld(m, { w: b.dataset.wpick, clock: p.clock }); renderSheet();
    } else if (b.dataset.wclock) { ML.setWorld(m, { w: p.w === 'light' && ML.worldsFor(m)[2].locked ? 'day' : p.w, clock: b.dataset.wclock === '1' }); renderSheet(); }
  });

  on('world', renderBtn); on('mood', renderBtn); on('render', renderBtn); on('minute', renderBtn); on('premium', renderBtn); on('trial:end', renderBtn);
  on('started', renderBtn);
})();
