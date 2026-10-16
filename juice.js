// Game feel: end-of-session particle bursts per theme, floating "+XP", theme sound sets,
// boss-fight timer, "press start" title screen and a time-of-day tint.
(() => {
  'use strict';
  const { $, S, t, esc, save, on, emit, today } = ML;

  ML.addStrings({
    fr: {
      set_juice: 'Effets', opt_title: 'Écran titre au premier lancement du jour', opt_clicks: 'Petits sons sur les boutons', opt_tod: 'Lumière qui suit l’heure (aube, jour, crépuscule, nuit)',
      press_start: 'Appuie sur une touche pour commencer', press_start_touch: 'Touche l’écran pour commencer',
      ts_streak: 'Série : {n} j', ts_quests: 'Quêtes : {n}/3', ts_events: 'Agenda : {n} aujourd’hui', ts_back: 'Bon retour,',
      boss_fight: 'Combat de boss',
    },
    en: {
      set_juice: 'Effects', opt_title: 'Title screen on the first launch of the day', opt_clicks: 'Small sounds on buttons', opt_tod: 'Light that follows the time of day',
      press_start: 'Press any key to start', press_start_touch: 'Tap to start',
      ts_streak: 'Streak: {n}d', ts_quests: 'Quests: {n}/3', ts_events: 'Calendar: {n} today', ts_back: 'Welcome back,',
      boss_fight: 'Boss fight',
    },
  });
  ML.defaults(() => ({ juice: { title: true, titleDay: null, clicks: true, tod: true } }));

  const theme = () => document.documentElement.dataset.theme || 'sorcerer';
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Particle bursts ---------- */
  const cv = $('burst'), cx = cv.getContext('2d');
  let parts = [], rings = [], raf = null, W = 0, H = 0;
  function size() { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cx.setTransform(d, 0, 0, d, 0, 0); }
  addEventListener('resize', size); size();
  function origin() {
    const el = $('sigil-card').classList.contains('compact') ? $('c-clock') : $('clock');
    const r = el.getBoundingClientRect();
    return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: W / 2, y: H / 3 };
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  function burst(style) {
    if (still) return;
    const { x, y } = origin(), a = css('--accent') || '#a678ff', b = css('--accent-2') || '#3ee8e0';
    const add = (n, fn) => { for (let i = 0; i < n; i++) parts.push(Object.assign({ x, y, life: 0, rot: 0, vr: 0 }, fn(i))); };
    const radial = (sp) => { const ang = Math.random() * Math.PI * 2, s = rnd(sp[0], sp[1]); return { vx: Math.cos(ang) * s, vy: Math.sin(ang) * s }; };
    switch (style) {
      case 'netrunner':
        add(55, () => Object.assign(radial([2, 9]), { kind: 'sq', size: rnd(2, 6), color: Math.random() < 0.5 ? a : b, max: rnd(40, 70), drag: 0.9, g: 0 }));
        for (let i = 0; i < 7; i++) parts.push({ kind: 'streak', x: 0, y: y + rnd(-120, 120), w: W, h: rnd(1, 3), color: Math.random() < 0.5 ? a : b, life: 0, max: rnd(12, 24), vx: 0, vy: 0 });
        break;
      case 'sanctuary':
        add(42, () => ({ kind: 'fly', vx: rnd(-1, 1), vy: rnd(-2.2, -0.6), size: rnd(1.5, 3), color: Math.random() < 0.75 ? a : b, max: rnd(110, 170), drag: 0.995, g: -0.004, x: x + rnd(-60, 60), y: y + rnd(-20, 40) }));
        break;
      case 'arcade':
        add(64, () => ({ kind: 'px', vx: rnd(-4, 4), vy: rnd(-9, -3), size: 4, color: [a, b, '#fff4da', '#ff5d73'][Math.floor(Math.random() * 4)], max: rnd(50, 80), drag: 1, g: 0.32 }));
        break;
      case 'fog':
        add(26, () => Object.assign(radial([1, 4]), { kind: 'card', size: rnd(5, 8), color: Math.random() < 0.5 ? a : b, max: rnd(70, 100), drag: 0.97, g: 0.05, vr: rnd(-0.2, 0.2) }));
        break;
      case 'coins':
        add(40, () => ({ kind: 'coin', vx: rnd(-3.5, 3.5), vy: rnd(-10, -4), size: rnd(4, 6), color: '#ffc247', max: rnd(60, 90), drag: 1, g: 0.35, vr: rnd(0.1, 0.3) }));
        break;
      case 'confetti':
        add(70, () => Object.assign(radial([3, 9]), { kind: 'conf', size: rnd(4, 7), color: ['#ff5d73', '#ffc247', '#5ad1ff', '#7ef0a0', '#b57bff'][Math.floor(Math.random() * 5)], max: rnd(70, 110), drag: 0.96, g: 0.12, vr: rnd(-0.3, 0.3) }));
        break;
      case 'stars':
        add(36, () => Object.assign(radial([2, 7]), { kind: 'star', size: rnd(3, 6), color: Math.random() < 0.5 ? '#fff4da' : a, max: rnd(60, 90), drag: 0.95, g: 0.03, vr: rnd(-0.1, 0.1) }));
        break;
      default: // sorcerer: rune sparks and a shockwave ring
        add(60, () => Object.assign(radial([1.5, 6.5]), { kind: 'spark', size: rnd(1.2, 2.8), color: Math.random() < 0.5 ? a : b, max: rnd(50, 90), drag: 0.955, g: 0.02 }));
        rings.push({ x, y, r: 10, life: 0, max: 40, color: a });
    }
    if (!raf) raf = requestAnimationFrame(step);
  }
  function star(x, y, r) { cx.beginPath(); for (let i = 0; i < 10; i++) { const ang = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; cx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr); } cx.closePath(); cx.fill(); }
  function step() {
    cx.clearRect(0, 0, W, H);
    parts = parts.filter(p => p.life < p.max);
    rings = rings.filter(r => r.life < r.max);
    for (const r of rings) { r.life++; r.r += 5; cx.globalAlpha = 1 - r.life / r.max; cx.strokeStyle = r.color; cx.lineWidth = 2; cx.beginPath(); cx.arc(r.x, r.y, r.r, 0, 6.29); cx.stroke(); }
    for (const p of parts) {
      p.life++; p.vx *= p.drag || 1; p.vy = p.vy * (p.drag || 1) + (p.g || 0); p.x += p.vx; p.y += p.vy; p.rot += p.vr || 0;
      const k = 1 - p.life / p.max;
      cx.globalAlpha = Math.max(0, p.kind === 'fly' ? k * (0.5 + 0.5 * Math.sin(p.life / 6)) : k);
      cx.fillStyle = p.color;
      if (p.kind === 'streak') { cx.globalAlpha = k * 0.6; cx.fillRect(p.x, p.y, p.w, p.h); continue; }
      if (p.kind === 'px') { cx.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, 4, 4); continue; }
      if (p.kind === 'sq') { cx.fillRect(p.x, p.y, p.size, p.size); continue; }
      if (p.kind === 'star') { star(p.x, p.y, p.size); continue; }
      if (p.kind === 'card' || p.kind === 'conf' || p.kind === 'coin') {
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
        if (p.kind === 'coin') { cx.scale(Math.abs(Math.cos(p.life / 5)), 1); cx.beginPath(); cx.arc(0, 0, p.size, 0, 6.29); cx.fill(); cx.fillStyle = '#fff3c0'; cx.fillRect(-1, -p.size / 2, 2, p.size); }
        else if (p.kind === 'card') { cx.fillRect(-p.size / 2, -p.size * 0.7, p.size, p.size * 1.4); cx.strokeStyle = '#0c0c0f'; cx.strokeRect(-p.size / 2 + 1.5, -p.size * 0.7 + 1.5, p.size - 3, p.size * 1.4 - 3); }
        else cx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        cx.restore(); continue;
      }
      if (p.kind === 'fly') { const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4); g.addColorStop(0, p.color); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = g; cx.fillRect(p.x - p.size * 4, p.y - p.size * 4, p.size * 8, p.size * 8); continue; }
      cx.beginPath(); cx.arc(p.x, p.y, p.size, 0, 6.29); cx.fill();
    }
    cx.globalAlpha = 1;
    raf = parts.length || rings.length ? requestAnimationFrame(step) : (cx.clearRect(0, 0, W, H), null);
  }
  const burstStyle = () => (S.econ && S.econ.equip && S.econ.equip.burst && S.econ.equip.burst !== 'theme') ? S.econ.equip.burst : theme();
  ML.burst = burst;
  on('session', s => { burst(burstStyle()); ML.sfx && ML.sfx('session'); });
  on('task:done', () => { if (!still) { const o = origin(); parts.push(...Array.from({ length: 14 }, () => ({ kind: 'spark', x: o.x, y: o.y, vx: rnd(-3, 3), vy: rnd(-4, 1), size: 2, color: css('--good'), max: 40, life: 0, drag: 0.95, g: 0.1 }))); if (!raf) raf = requestAnimationFrame(step); } });

  /* ---------- Floating "+XP" / "+gold" ---------- */
  let floatQueue = 0;
  function floater(text, cls) {
    const { x, y } = origin();
    const el = document.createElement('div');
    el.className = 'floater ' + (cls || '');
    el.textContent = text;
    el.style.left = x + 'px'; el.style.top = (y - 40 - (floatQueue % 3) * 22) + 'px';
    floatQueue++; setTimeout(() => floatQueue--, 600);
    $('floaters').appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }
  ML.floater = floater;
  on('xp', n => floater('+' + n + ' XP', 'xp'));

  /* ---------- Theme sound sets ---------- */
  let sctx = null;
  const VOICES = {
    sorcerer: { type: 'triangle', base: 76, dec: 0.5, gap: 0.08 },
    netrunner: { type: 'sawtooth', base: 69, dec: 0.22, gap: 0.06, lp: 2600, det: 9 },
    sanctuary: { type: 'sine', base: 72, dec: 1.4, gap: 0.12, bell: true },
    arcade: { type: 'square', base: 72, dec: 0.1, gap: 0.055, vol: 0.035 },
    fog: { type: 'sine', base: 64, dec: 0.9, gap: 0.12, bell: true },
  };
  const NOTES = { task: [0, 7], quest: [0, 4, 7], ach: [0, 4, 7, 12], level: [0, 4, 7, 12, 16, 19], session: [0, 7, 12], click: [12], buy: [7, 12, 19], abandon: [7, 3, 0] };
  ML.sfxTheme = kind => {
    if (kind === 'click' && !S.juice.clicks) return;
    try { sctx = sctx || new (window.AudioContext || window.webkitAudioContext)(); if (sctx.state === 'suspended') sctx.resume(); } catch (e) { return; }
    const V = VOICES[theme()] || VOICES.sorcerer, notes = NOTES[kind] || [0];
    const isClick = kind === 'click';
    notes.forEach((n, i) => {
      const t0 = sctx.currentTime + i * V.gap, f = 440 * Math.pow(2, (V.base + n - 69) / 12);
      const play = (freq, vol, dec) => {
        const o = sctx.createOscillator(), g = sctx.createGain();
        o.type = V.type; o.frequency.value = freq; if (V.det) o.detune.value = (Math.random() - 0.5) * V.det;
        let node = o;
        if (V.lp) { const lp = sctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = V.lp; node = o.connect(lp); }
        node.connect(g); g.connect(sctx.destination);
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.006); g.gain.exponentialRampToValueAtTime(0.0005, t0 + dec);
        o.start(t0); o.stop(t0 + dec + 0.05);
      };
      const vol = (V.vol || 0.06) * (isClick ? 0.35 : 1), dec = isClick ? Math.min(0.08, V.dec) : V.dec;
      play(f, vol, dec);
      if (V.bell && !isClick) play(f * 2.76, vol * 0.3, dec * 0.5);
    });
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('button.primary, .mood-chip, .chip-btn, .tabs button, .presets button, .ci-btn');
    if (b && S.game && S.game.sfx) ML.sfxTheme('click');
  }, true);
  on('abandon', () => ML.sfx && ML.sfx('abandon'));

  /* ---------- Boss fight timer ---------- */
  const hud = document.createElement('div');
  hud.className = 'boss-hud'; hud.hidden = true;
  document.querySelector('.ring-center').appendChild(hud);
  on('tick', () => {
    const B = S.game && S.game.boss;
    const fighting = !!(B && !B.done && ML.running() && S.mode === 'focus' && S.activeId === B.taskId);
    $('sigil-card').classList.toggle('boss-fight', fighting);
    hud.hidden = !fighting;
    if (!fighting) return;
    const spent = (S.total - Math.max(0, ML.remainingNow())) / 60;
    const hp = Math.max(0, B.max - B.dmg - spent);
    hud.innerHTML = `<span>⚔ ${esc(t('boss_fight'))}</span><i><b style="width:${(hp / B.max * 100).toFixed(1)}%"></b></i><small>${Math.ceil(hp)}/${B.max} PV</small>`;
  });

  /* ---------- Title screen ---------- */
  function showTitle() {
    const s = ML.seqInfo(), st = ML.streaks(), Q = S.game.quests, evN = ML.eventsOn ? ML.eventsOn(today()).length : 0;
    const touch = matchMedia('(pointer: coarse)').matches;
    $('ts-inner').innerHTML = `
      <div class="ts-logo">${document.querySelector('.logo').outerHTML}</div>
      <h1 class="ts-title">Merlins<span>LockIN</span></h1>
      <p class="ts-class">${esc(t('ts_back'))} <b>${esc(t('class_' + S.mood))}</b> · ${esc(t('sequence'))} ${s.num} ${esc(s.name)}</p>
      <div class="ts-stats"><span>${esc(t('ts_streak', { n: st.cur }))}</span><span>${esc(t('ts_quests', { n: Q && Q.day === today() ? Q.claimed.length : 0 }))}</span><span>${esc(t('ts_events', { n: evN }))}</span></div>
      <p class="ts-press">▶ ${esc(touch ? t('press_start_touch') : t('press_start'))}</p>`;
    const el = $('title-screen');
    el.hidden = false;
    const close = () => {
      el.classList.add('out'); S.juice.titleDay = today(); save();
      emit('gesture'); ML.sfx && ML.sfx('level');
      setTimeout(() => { el.hidden = true; el.classList.remove('out'); }, 450);
      removeEventListener('keydown', onKey, true);
    };
    const onKey = e => { e.preventDefault(); e.stopPropagation(); close(); };
    el.onclick = close;
    addEventListener('keydown', onKey, true);
  }
  on('started', () => { if (S.juice.title && S.juice.titleDay !== today()) showTitle(); applyTod(); });

  /* ---------- Time-of-day light ---------- */
  function applyTod() {
    const el = $('tod'); if (!el) return;
    const h = new Date().getHours();
    el.dataset.tod = !S.juice.tod ? 'off' : h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'dusk' : 'night';
  }
  on('minute', applyTod);

  ML.settingsSection({
    order: 16,
    render: () => `<h3>${esc(t('set_juice'))}</h3>
      ${ML.ui.chk('set-title', t('opt_title'), S.juice.title)}
      ${ML.ui.chk('set-clicks', t('opt_clicks'), S.juice.clicks)}
      ${ML.ui.chk('set-tod', t('opt_tod'), S.juice.tod)}`,
    bind: r => {
      r.querySelector('#set-title').onchange = e => { S.juice.title = e.target.checked; save(); };
      r.querySelector('#set-clicks').onchange = e => { S.juice.clicks = e.target.checked; save(); };
      r.querySelector('#set-tod').onchange = e => { S.juice.tod = e.target.checked; save(); applyTod(); };
    },
  });
})();
