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
  let still = ML.reducedMotion(); // no particle bursts with reduced motion (core.js 'motion' event keeps it live)
  on('motion', v => { still = v; });

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
      case 'abyss': // bubbles drift up from the clock
        add(40, () => ({ kind: 'bubble', x: x + rnd(-70, 70), y: y + rnd(-10, 40), vx: rnd(-0.4, 0.4), vy: rnd(-2.6, -0.8), size: rnd(2, 6), color: Math.random() < 0.7 ? a : b, max: rnd(90, 140), drag: 0.995, g: -0.01, sway: rnd(0, 6.28) }));
        break;
      case 'neoncity': // neon shards plus two expanding rings, pink then orange
        add(50, () => Object.assign(radial([2, 8]), { kind: 'sq', size: rnd(2, 5), color: Math.random() < 0.5 ? a : b, max: rnd(40, 70), drag: 0.92, g: 0.05 }));
        rings.push({ x, y, r: 8, life: 0, max: 36, color: a }, { x, y, r: 1, life: 0, max: 46, color: b });
        break;
      case 'observatory': // golden stars around a slow brass ring
        add(34, () => Object.assign(radial([1.5, 5.5]), { kind: 'star', size: rnd(2.5, 5), color: Math.random() < 0.6 ? a : '#fff4da', max: rnd(70, 100), drag: 0.95, g: 0.015, vr: rnd(-0.1, 0.1) }));
        rings.push({ x, y, r: 14, life: 0, max: 50, color: b });
        break;
      case 'coins':
        add(40, () => ({ kind: 'coin', vx: rnd(-3.5, 3.5), vy: rnd(-10, -4), size: rnd(4, 6), color: '#ffc247', max: rnd(60, 90), drag: 1, g: 0.35, vr: rnd(0.1, 0.3) }));
        break;
      case 'confetti':
        add(70, () => Object.assign(radial([3, 9]), { kind: 'conf', size: rnd(4, 7), color: ['#ff5d73', '#ffc247', '#5ad1ff', '#7ef0a0', '#b57bff'][Math.floor(Math.random() * 5)], max: rnd(70, 110), drag: 0.96, g: 0.12, vr: rnd(-0.3, 0.3) }));
        break;
      case 'sakura': // petals drift down and sway
        add(46, () => ({ kind: 'petal', x: x + rnd(-160, 160), y: y + rnd(-140, -40), vx: rnd(-0.6, 0.6), vy: rnd(0.4, 1.4), size: rnd(4, 7), color: ['#ffc4dc', '#ff9ec7', '#ffe3ee'][Math.floor(Math.random() * 3)], max: rnd(120, 180), drag: 1, g: 0.004, vr: rnd(-0.06, 0.06), sway: rnd(0, 6.28) }));
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
      if (p.kind === 'bubble') { p.x += Math.sin(p.life / 12 + p.sway) * 0.6; cx.strokeStyle = p.color; cx.lineWidth = 1.2; cx.beginPath(); cx.arc(p.x, p.y, p.size, 0, 6.29); cx.stroke(); cx.fillRect(p.x - p.size * 0.4, p.y - p.size * 0.5, 1.5, 1.5); continue; }
      if (p.kind === 'petal') {
        p.x += Math.sin(p.life / 14 + p.sway) * 0.9;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot + Math.sin(p.life / 10 + p.sway) * 0.6);
        cx.beginPath(); cx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, 6.29); cx.fill(); cx.restore(); continue;
      }
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
  // Washi's theme effect is its ink drop (washi.js); an equipped shop effect still bursts
  // Washi (ink drop) and Codex (the tower bell) mark the session's end in their own scene instead of the theme burst
  const sceneEnds = () => (ML.washiOn && ML.washiOn()) || (ML.codexOn && ML.codexOn());
  on('session', s => { if (!(sceneEnds() && burstStyle() === theme())) burst(burstStyle()); ML.sfx && ML.sfx('session'); });
  on('task:done', () => { if (!still) { const o = origin(); parts.push(...Array.from({ length: 14 }, () => ({ kind: 'spark', x: o.x, y: o.y, vx: rnd(-3, 3), vy: rnd(-4, 1), size: 2, color: css('--good'), max: 40, life: 0, drag: 0.95, g: 0.1 }))); if (!raf) raf = requestAnimationFrame(step); } });

  /* ---------- Floating "+XP" / "+gold" ---------- */
  let floatQueue = 0;
  function floater(text, cls) {
    const { x, y } = origin();
    const el = document.createElement('div');
    el.className = 'floater ' + (cls || ''); el.dataset.at = Date.now(); // a task's "+XP" is recoloured right after (rarity)
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
    observatory: { type: 'triangle', base: 79, dec: 1, gap: 0.1, bell: true },
    abyss: { type: 'sine', base: 60, dec: 1.8, gap: 0.16, bell: true },
    neoncity: { type: 'sawtooth', base: 64, dec: 0.35, gap: 0.07, lp: 1800, det: 14 },
  };
  const NOTES = { sub: [4, 9], task: [0, 7], quest: [0, 4, 7], ach: [0, 4, 7, 12], level: [0, 4, 7, 12, 16, 19], session: [0, 7, 12], click: [12], buy: [7, 12, 19], abandon: [7, 3, 0] };
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
    const b = e.target.closest('button.primary, .mood-chip, .chip-btn, .tabs button, .presets button, .ep-seg button');
    if (b && S.game && S.game.sfx) ML.sfxTheme('click');
  }, true);
  on('abandon', () => ML.sfx && ML.sfx('abandon'));

  /* ---------- Motion (step 6): micro-interactions and timer moments ----------
     Event animations only (150–600 ms, never looping), through the Web Animations API, skipped with reduced motion.
     The CSS side (button press, task hover, breathing dial, last-minute pulse, tick wave…) is in app.css. */
  const anim = (el, frames, opts) => (!still && el && el.animate) ? el.animate(frames, Object.assign({ easing: 'cubic-bezier(.2,.7,.3,1)' }, opts)) : null;
  const afterRender = fn => setTimeout(fn, 0); // app.js re-renders synchronously right after these events
  // 3. The tick draws itself in the box of a task you complete
  on('task:done', task => afterRender(() => {
    const p = document.querySelector(`#tasks .task[data-id="${task.id}"] .check path`); if (!p) return;
    anim(p, [{ strokeDasharray: 14, strokeDashoffset: 14 }, { strokeDasharray: 14, strokeDashoffset: 0 }], { duration: 300 });
  }));
  // 5. A new task slides from the field into the list
  on('task:added', task => afterRender(() => {
    const li = document.querySelector(`#tasks .task[data-id="${task.id}"]`), field = $('new-title'); if (!li || !field) return;
    const dy = Math.max(-240, Math.min(240, field.getBoundingClientRect().top - li.getBoundingClientRect().top));
    anim(li, [{ transform: `translateY(${dy}px) scale(.96)`, opacity: 0.2 }, { transform: 'none', opacity: 1 }], { duration: 380 });
  }));
  // 11. "Show more tasks": the others unfold in a quick cascade
  $('tasks').addEventListener('click', e => {
    if (!e.target.closest('[data-act=more]') || !S.showAll) return;
    afterRender(() => [...document.querySelectorAll('#tasks > .task')].slice(1, 12).forEach((li, i) =>
      anim(li, [{ transform: 'translateY(-8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, delay: i * 35, fill: 'backwards' })));
  });
  // 6. Tabs: a bar glides from the old tab to the new one, then the theme's own underline takes over
  const ink = document.createElement('i'); ink.className = 'tab-ink'; ink.setAttribute('aria-hidden', 'true');
  const tabsEl = document.querySelector('.tabs'); if (tabsEl) tabsEl.appendChild(ink);
  let lastTabBtn = document.querySelector('.tabs button[aria-selected=true]'), inkT = null;
  on('tab', () => {
    const now = document.querySelector('.tabs button[aria-selected=true]'), from = lastTabBtn; lastTabBtn = now;
    if (!tabsEl || !now || !from || from === now || still || !tabReady) return;
    const box = tabsEl.getBoundingClientRect(), a = from.getBoundingClientRect(), b = now.getBoundingClientRect();
    if (!a.width || !b.width || Math.abs(a.top - b.top) > 4) return; // wrapped onto two rows: no glide
    const at = r => `translateX(${r.left - box.left + tabsEl.scrollLeft}px) scaleX(${r.width / 100})`;
    ink.getAnimations().forEach(x => x.cancel()); document.querySelectorAll('.tab-gliding').forEach(x => x.classList.remove('tab-gliding'));
    now.classList.add('tab-gliding');
    anim(ink, [{ transform: at(a), opacity: 1 }, { transform: at(b), opacity: 1 }], { duration: 260 });
    clearTimeout(inkT); inkT = setTimeout(() => now.classList.remove('tab-gliding'), 280);
  });
  let tabReady = false; // the boot's setTab doesn't glide
  on('started', () => { tabReady = true; lastTabBtn = document.querySelector('.tabs button[aria-selected=true]'); });
  // 9. A parked thought glides to the Inbox view (or the Plan button on the phone bar); the timer keeps running
  on('parked', () => {
    if (still) return;
    const p = S.parked[S.parked.length - 1], from = $('park-input'); if (!p || !from) return;
    const to = [$('pl-inbox-btn'), $('t-plan'), document.querySelector('#mnav [data-mnav="plan"]')].find(el => el && el.getBoundingClientRect().width);
    if (!to) return;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const ghost = document.createElement('div'); ghost.className = 'park-ghost'; ghost.textContent = p.text;
    ghost.style.left = a.left + 'px'; ghost.style.top = a.top + 'px'; ghost.style.maxWidth = a.width + 'px';
    document.body.appendChild(ghost);
    const g = anim(ghost, [{ transform: 'none', opacity: 1 }, { transform: `translate(${b.left + b.width / 2 - a.left - 20}px, ${b.top + b.height / 2 - a.top - 10}px) scale(.25)`, opacity: 0 }], { duration: 550, easing: 'cubic-bezier(.5,0,.6,1)' });
    if (g) { g.onfinish = () => ghost.remove(); setTimeout(() => ghost.remove(), 650); } else ghost.remove();
  });
  // Timer: last minute (remaining ticks pulse), last 10 s (digits beat, decor holds still), end-of-session light wave
  const rootEl = document.documentElement;
  on('tick', rem => {
    const focusing = ML.running() && S.mode === 'focus';
    rootEl.classList.toggle('t-lastmin', focusing && rem <= 60 && rem > 10);
    rootEl.classList.toggle('t-final', focusing && rem <= 10);
  });
  on('session', () => {
    const lit = $('segs-lit'); if (!lit || still) return;
    lit.classList.remove('wave'); void lit.getBBox(); lit.classList.add('wave');
    setTimeout(() => lit.classList.remove('wave'), 1400);
  });

  /* ---------- Progression (step 6b) ---------- */
  ML.addStrings({ fr: { quests_clear: 'Quêtes du jour terminées' }, en: { quests_clear: 'Daily quests clear' } });
  // 20. "+XX XP" for a task floats up from the task itself, in its rarity colour; 21. a Legendary one also gets a
  // short burst of stars kept around the card (< 1.5 s); 32. Cyber sorcerer draws a constellation
  on('task:done', task => {
    const li = document.querySelector(`#tasks .task[data-id="${task.id}"]`), f = $('floaters').lastElementChild;
    const r = (ML.taskBadges ? ML.taskBadges(task).cls : '').match(/rar-(\w+)/), rar = r ? r[1] : 'common';
    if (f && f.classList.contains('xp') && Date.now() - (+f.dataset.at || 0) < 200) {
      f.style.color = `var(--r-${rar})`;
      if (li) { const b = li.getBoundingClientRect(); if (b.width) { f.style.left = (b.left + b.width / 2) + 'px'; f.style.top = (b.top + 6) + 'px'; } }
    }
    if (rar === 'legendary' && li && !still) {
      const b = li.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + Math.min(b.height, 120) / 2, c = css('--r-legendary') || '#ffc247';
      parts.push(...Array.from({ length: 34 }, () => Object.assign((() => { const ang = Math.random() * 6.283, s = rnd(1, 3.2); return { vx: Math.cos(ang) * s, vy: Math.sin(ang) * s * 0.6 }; })(),
        { kind: 'star', x, y, size: rnd(2, 4), color: Math.random() < 0.7 ? c : '#fff4da', life: 0, max: rnd(50, 80), drag: 0.93, g: 0.02, rot: 0, vr: 0 })));
      if (!raf) raf = requestAnimationFrame(step);
    }
    if (ML.fxConstellation) ML.fxConstellation();
  });
  /* ---------- Estampe: the quest feed and the status strip ----------
     Quest news comes as game-style cards, one at a time: each slides in with a short flicker, stays 4 s (a thin
     line shows its life) and leaves by itself, so nothing lingers on screen. game.js skips the plain toast then. */
  ML.addStrings({
    fr: { ns_net: 'Réseau · À fond', ns_focus: 'Focus auj.', ns_streak: 'Série', ns_quests: 'Quêtes', ns_next: 'Prochain bloc', qf_update: 'Quête mise à jour', qf_done: 'Quête terminée', qf_left: 'Encore {n}', qf_day: 'Quêtes du jour {n}/{m}', qf_clear_k: 'Quêtes du jour', qf_clear: 'Toutes terminées', qf_reward: 'Récompense ajoutée' },
    en: { ns_net: 'Network · Fired up', ns_focus: 'Focus today', ns_streak: 'Streak', ns_quests: 'Quests', ns_next: 'Next block', qf_update: 'Quest updated', qf_done: 'Quest complete', qf_left: '{n} to go', qf_day: 'Daily quests {n}/{m}', qf_clear_k: 'Daily quests', qf_clear: 'All clear', qf_reward: 'Reward added' },
  });
  const inkTheme = () => rootEl.dataset.theme === 'netrunner' && !!rootEl.dataset.light;
  ML.questFeed = inkTheme;
  const feed = document.createElement('div'); feed.className = 'qfeed'; feed.setAttribute('role', 'status'); feed.setAttribute('aria-live', 'polite');
  document.body.appendChild(feed);
  const fq = []; let fShowing = false;
  function feedPush(n) { if (!inkTheme()) return; fq.push(n); if (fq.length > 4) fq.shift(); if (!fShowing) feedNext(); }
  function feedNext() {
    const n = fq.shift(); if (!n) { fShowing = false; feed.innerHTML = ''; return; } fShowing = true;
    const el = document.createElement('div'); el.className = 'qcard in';
    el.innerHTML = `<div class="qc-eb"><span>◆ ${esc(n.kind)}</span><span>${esc(n.tag || '')}</span></div><h4>${esc(n.title)}</h4>` +
      (n.obj ? `<div class="qc-obj"><i class="${n.ok ? 'ok' : ''}"></i><span>${esc(n.obj)}</span><em>${esc(n.count || '')}</em></div>` : '') +
      (n.steps && n.steps[1] <= 8 ? `<div class="qc-steps">${Array.from({ length: n.steps[1] }, (_, i) => `<i class="${i < n.steps[0] ? 'f' : ''}"></i>`).join('')}</div>` : '') +
      '<div class="qc-life"><b style="animation-duration:4000ms"></b></div>';
    feed.innerHTML = ''; feed.appendChild(el);
    setTimeout(() => { el.className = 'qcard out'; setTimeout(feedNext, 330); }, 4000);
  }
  const qfmt = (p, v) => (p.fmt ? p.fmt(v) : String(v));
  on('quest:progress', p => feedPush({ kind: t('qf_update'), tag: qfmt(p, p.v) + '/' + qfmt(p, p.target), title: p.name, obj: t('qf_left', { n: qfmt(p, p.target - p.v) }), count: qfmt(p, p.v) + '/' + qfmt(p, p.target), steps: [p.v, p.target] }));
  on('quest:done', p => feedPush({ kind: t('qf_done'), tag: '+' + p.xp + ' XP', title: p.name, obj: t('qf_day', { n: p.n, m: p.of }), count: p.n + '/' + p.of, ok: true, steps: [p.n, p.of] }));
  on('quests:clear', () => feedPush({ kind: t('qf_clear_k'), tag: '◆ ◆ ◆', title: t('qf_clear'), obj: t('qf_reward'), ok: true }));
  // the status strip: the day's numbers on an ink band at the top of the page
  const strip = document.createElement('div'); strip.className = 'netstrip'; strip.setAttribute('aria-hidden', 'true');
  const appEl = document.querySelector('.app'); if (appEl) appEl.insertBefore(strip, appEl.firstChild);
  function renderStrip() { // always kept current (CSS shows it only in that theme), so a theme switch shows it filled
    const d = new Date(), td = today(), ss = S.sessions.filter(x => ML.dayKey(new Date(x.at)) === td), mins = ss.reduce((a, x) => a + x.mins, 0);
    const Q = S.game && S.game.quests && S.game.quests.day === td ? S.game.quests : null, nowM = d.getHours() * 60 + d.getMinutes();
    const nb = (S.blocks || []).filter(x => x.date === td && x.start > nowM).sort((a, z) => a.start - z.start)[0];
    const hm = m => ML.pad2(Math.floor(m / 60)) + ':' + ML.pad2(m % 60);
    strip.innerHTML = `<span class="ns-live">${esc(t('ns_net').toUpperCase())}</span><span>${ML.pad2(d.getDate())}.${ML.pad2(d.getMonth() + 1)} <i>·</i> <b>${hm(nowM)}</b></span>` +
      `<span>${esc(t('ns_focus').toUpperCase())} <b>${esc(ML.fmtMins(mins).toUpperCase())}</b></span><span>${esc(t('ns_streak').toUpperCase())} <b>${ML.streaks().cur}</b></span>` +
      (Q ? `<span>${esc(t('ns_quests').toUpperCase())} <b>${Q.claimed.length}/${Q.ids.length}</b></span>` : '') +
      (nb ? `<span>${esc(t('ns_next').toUpperCase())} <b>${hm(nb.start)}</b></span>` : '');
  }
  on('render', renderStrip); on('minute', renderStrip); on('started', renderStrip); on('mood', () => setTimeout(renderStrip, 60)); on('session', renderStrip);

  // 22. All of today's quests done: a banner for 2 s
  on('quests:clear', () => {
    if (inkTheme()) return; // that theme says it with a quest card
    const el = document.createElement('div'); el.className = 'quest-banner'; el.setAttribute('role', 'status');
    el.innerHTML = `<span>◆</span>${esc(t('quests_clear'))}<span>◆</span>`;
    document.body.appendChild(el);
    anim(el, [{ transform: 'translate(-50%, -12px)', opacity: 0 }, { transform: 'translate(-50%, 0)', opacity: 1, offset: 0.15 }, { transform: 'translate(-50%, 0)', opacity: 1, offset: 0.85 }, { transform: 'translate(-50%, -8px)', opacity: 0 }], { duration: 2000 });
    setTimeout(() => el.remove(), 2050);
  });
  // 7. Counters roll to their new value (gold); 23. the streak number pops when it goes up;
  // 26. the mood bonus chip shines once when its value changes (combo, streak %, bonus ready…)
  function roll(el, from, to) {
    if (still || from === to || !el) return;
    const t0 = performance.now(), d = 500, fmt = n => Math.round(n).toLocaleString(ML.locale());
    const stepN = () => { const k = Math.min(1, (performance.now() - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) setTimeout(stepN, 33); };
    stepN();
  }
  let lastGold = null, lastStreak = null, lastBuff = null;
  on('render', () => {
    const g = $('gold-chip'), gb = g && g.querySelector('b'), gold = S.econ ? S.econ.gold : 0;
    if (gb && lastGold !== null && gold > lastGold) roll(gb, lastGold, gold);
    lastGold = gold;
    const st = ML.streaks().cur, sb = document.querySelector('#streak-pill b');
    if (sb && lastStreak !== null && st > lastStreak) anim(sb, [{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 450 });
    lastStreak = st;
    const bc = $('buff-chip'), bt = bc ? bc.textContent : '';
    if (bc && lastBuff !== null && bt !== lastBuff) anim(bc, [{ boxShadow: '0 0 0 0 transparent', filter: 'brightness(1)' }, { boxShadow: '0 0 16px 2px var(--accent)', filter: 'brightness(1.35)' }, { boxShadow: '0 0 0 0 transparent', filter: 'brightness(1)' }], { duration: 600 });
    lastBuff = bt;
  });
  on('xp', () => setTimeout(() => {
    const g = $('gold-chip'), gb = g && g.querySelector('b'), gold = S.econ ? S.econ.gold : 0;
    if (gb && lastGold !== null && gold > lastGold) roll(gb, lastGold, gold);
    lastGold = gold;
  }, 0));
  // 8. Quest bars fill smoothly from where they were (transform only) and give a short flash at 100 %
  const qPrev = {};
  new MutationObserver(() => {
    document.querySelectorAll('#quest-strip li').forEach(li => {
      const key = (li.querySelector('.q-name') || {}).textContent, b = li.querySelector('.q-bar b'); if (!key || !b) return;
      const w = parseFloat(b.style.width) || 0, was = qPrev[key];
      qPrev[key] = w;
      if (was === undefined || w <= was || !w) return;
      anim(b, [{ transform: `scaleX(${Math.max(0.02, was / w)})` }, { transform: 'scaleX(1)' }], { duration: 600, easing: 'cubic-bezier(.3,.7,.3,1)' });
      if (w >= 100) anim(li.querySelector('.q-bar'), [{ filter: 'brightness(1)' }, { filter: 'brightness(1.8)', offset: 0.7 }, { filter: 'brightness(1)' }], { duration: 900 });
    });
  }).observe($('quest-strip'), { childList: true, subtree: true });

  /* ---------- Theme decor in the page (step 6b) ---------- */
  // CSS decor loops run at 30 % during a session and hold still in the last 10 s, like the canvas
  const DECOR_ANIMS = ['cloud-drift']; // (the walker and the Washi ink are rest-only: CSS pauses them)
  let decorT = 0;
  function syncDecor(force) {
    if (!document.getAnimations || (!force && Date.now() - decorT < 1000)) return;
    decorT = Date.now();
    const r = rootEl.classList.contains('t-final') ? 0 : rootEl.dataset.timer === 'running' ? 0.3 : 1;
    document.getAnimations().forEach(a => { if (DECOR_ANIMS.includes(a.animationName) && a.playbackRate !== r) a.playbackRate = r; });
  }
  on('timer', () => syncDecor(true)); on('tick', () => syncDecor()); on('mood', () => setTimeout(() => syncDecor(true), 100));
  // 40. Cartouche: a little pixel wanderer walks along the bottom at rest; during a session it sits down and dozes
  const px = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  const D = '#0F380F', M = '#306230', L = '#9BBC0F';
  const body = px(2, 0, 4, 1, D) + px(1, 1, 1, 2, D) + px(2, 1, 4, 2, L) + px(6, 1, 1, 2, D) + px(4, 1, 1, 1, D) + px(2, 3, 4, 1, D) + px(1, 4, 6, 3, M) + px(0, 4, 1, 2, D) + px(7, 4, 1, 2, D);
  const walker = document.createElement('div'); walker.className = 'walker'; walker.setAttribute('aria-hidden', 'true');
  walker.innerHTML = `<svg viewBox="0 0 8 11" shape-rendering="crispEdges">
    <g class="w-a">${body + px(2, 7, 1, 3, D) + px(5, 7, 1, 2, D) + px(6, 9, 1, 1, D)}</g>
    <g class="w-b">${body + px(3, 7, 1, 3, D) + px(2, 9, 1, 1, D) + px(4, 7, 1, 3, D)}</g>
    <g class="w-sit">${body.replace(/y="(\d+)"/g, (m, y) => `y="${+y + 2}"`) + px(1, 9, 6, 1, D) + px(6, 10, 2, 1, D)}</g></svg><i class="w-z">z</i>`;
  document.body.appendChild(walker);
  // 30. Codex: on load only, a quill writes today's date at the top of the page, once
  const quill = document.createElement('div'); quill.className = 'quill-date'; quill.setAttribute('aria-hidden', 'true');
  quill.innerHTML = `<span class="qd-text"></span><i class="qd-cover"></i><svg class="qd-pen" viewBox="0 0 24 24"><path d="M20 2C12 4 7 10 5 18l-1 4 3-2c6-3 10-8 13-18zM5 18l4-4"/></svg>`;
  document.body.appendChild(quill);
  on('started', () => {
    quill.querySelector('.qd-text').textContent = new Date().toLocaleDateString(ML.locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const codex = rootEl.dataset.theme === 'observatory' && rootEl.dataset.light;
    if (!codex || still || !quill.getBoundingClientRect().width) return;
    const w = quill.getBoundingClientRect().width;
    anim(quill.querySelector('.qd-cover'), [{ transform: 'translateX(0)' }, { transform: `translateX(${w}px)` }], { duration: 1600, delay: 500, easing: 'cubic-bezier(.4,.1,.5,1)', fill: 'both' });
    anim(quill.querySelector('.qd-pen'), [{ transform: 'translate(-4px, 0) rotate(-8deg)', opacity: 1 }, { transform: `translate(${w * 0.5}px, -2px) rotate(4deg)`, opacity: 1, offset: 0.5 }, { transform: `translate(${w}px, 0) rotate(-6deg)`, opacity: 1, offset: 0.9 }, { transform: `translate(${w + 6}px, -4px)`, opacity: 0 }], { duration: 1800, delay: 500, fill: 'both' });
  });

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

  /* ---------- Title screen (once a day) ----------
     The "press start" title. On a day whose energy isn't chosen yet, the energy picker (energy.js) opens
     instead and counts as today's welcome, so this only shows when the energy was already set today. */
  const welcomeDue = () => !!(S.juice && S.juice.title && S.juice.titleDay !== today());
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
  on('started', () => { if (welcomeDue() && S.moodDay === today() && S.onboarded) showTitle(); applyTod(); });

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
