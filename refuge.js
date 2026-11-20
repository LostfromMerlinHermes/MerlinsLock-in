// The refuge (3.110): the world's island full screen, a place to rest. No timer, no numbers but the hour; the sky drifts
// slowly. A touch opens a small drawer: sky (real hour, dawn, dusk, night), weather, a soft sound made here, and a light
// on the tower that breathes (in 4 s, out 6 s). The choices are kept per world (S.monde.isles[world].refuge).
// The painting is island.js's own (ML.islandArt): sky layer at cover, island at fit, the pencil of what is not earned yet.
(() => {
  'use strict';
  const { S, t, esc, save, on } = ML;
  ML.addStrings({
    fr: {
      rf_open: 'Refuge', rf_open_t: 'L’île en plein écran, pour te reposer', rf_close: 'Quitter', rf_hint: 'Touche l’écran pour les réglages.',
      rf_sky: 'Ciel', rf_live: 'Heure réelle', rf_dawn: 'Aube', rf_dusk: 'Crépuscule', rf_night: 'Nuit',
      rf_weather: 'Temps', rf_world: 'Du monde', rf_clear: 'Clair', rf_rain: 'Pluie', rf_snow: 'Neige', rf_flies: 'Lucioles', rf_lanterns: 'Lanternes',
      rf_sound: 'Son', rf_silent: 'Silence', rf_noise: 'Pluie ou vent', rf_breath: 'Respiration', rf_off: 'Non', rf_on: 'Lumière qui respire', rf_in: 'Inspire', rf_out: 'Expire',
    },
    en: {
      rf_open: 'Refuge', rf_open_t: 'The island full screen, to rest', rf_close: 'Leave', rf_hint: 'Touch the screen for the settings.',
      rf_sky: 'Sky', rf_live: 'Real hour', rf_dawn: 'Dawn', rf_dusk: 'Dusk', rf_night: 'Night',
      rf_weather: 'Weather', rf_world: 'The world’s', rf_clear: 'Clear', rf_rain: 'Rain', rf_snow: 'Snow', rf_flies: 'Fireflies', rf_lanterns: 'Lanterns',
      rf_sound: 'Sound', rf_silent: 'Silence', rf_noise: 'Rain or wind', rf_breath: 'Breathing', rf_off: 'Off', rf_on: 'A light that breathes', rf_in: 'Breathe in', rf_out: 'Breathe out',
    },
  });
  const still = () => !!(ML.reducedMotion && ML.reducedMotion());
  const WORLD_LIFE = { observatory: ['stars', '#fff1cc'], sanctuary: ['flies', '#ffe9a0'], netrunner: ['rain', '#bfe6ff'], sorcerer: ['motes', '#d4b8ff'], neoncity: ['motes', '#ffe0ec'], arcade: ['flies', '#ffd27a'], cartouche: ['flies', '#ffe9a0'] };
  const SKIES = ['live', 'dawn', 'dusk', 'night'], WEATHER = ['world', 'clear', 'rain', 'snow', 'flies', 'lanterns'];
  const hourNow = () => { const h = new Date().getHours(); return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night'; };
  const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // a wash of light over the sky, by hour
  const GRADE = {
    dawn: (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,160,110,.42)'); gr.addColorStop(.6, 'rgba(240,170,190,.18)'); gr.addColorStop(1, 'rgba(120,150,230,.1)'); g.globalCompositeOperation = 'soft-light'; g.fillStyle = gr; g.fillRect(0, 0, w, h); },
    day: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(110,170,240,.5)'); gr.addColorStop(1, 'rgba(200,225,250,.35)'); g.globalCompositeOperation = 'soft-light'; g.fillStyle = gr; g.fillRect(0, 0, w, h); },
    dusk: (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,120,60,.5)'); gr.addColorStop(.5, 'rgba(160,70,120,.3)'); gr.addColorStop(1, 'rgba(30,20,70,.2)'); g.globalCompositeOperation = 'soft-light'; g.fillStyle = gr; g.fillRect(0, 0, w, h); },
    night: (g, w, h) => { g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(70,80,140,.55)'; g.fillRect(0, 0, w, h); },
  };

  // Particles, in parts of the screen
  function Life(kind, color) {
    let sd = 11; const r = () => (sd = sd * 16807 % 2147483647, (sd - 1) / 2147483646);
    const n = kind === 'rain' ? 150 : kind === 'snow' ? 110 : kind === 'lanterns' ? 14 : 60;
    const P = Array.from({ length: n }, () => ({ x: r(), y: r(), z: .4 + r() * .6, ph: r() * 6.28, v: .3 + r() * .7 }));
    return (g, w, h, ms) => {
      const u = Math.min(w, h) / 500;
      g.save();
      if (kind === 'rain') {
        g.strokeStyle = color; g.lineWidth = Math.max(1, u);
        P.forEach(p => { const y = (p.y + ms * .0009 * p.v) % 1, x = (p.x + y * .06) % 1; g.globalAlpha = .2 * p.z; g.beginPath(); g.moveTo(x * w, y * h); g.lineTo(x * w - u * 3, y * h + h * .03 * p.z); g.stroke(); });
      } else if (kind === 'snow') {
        g.fillStyle = color;
        P.forEach(p => { const y = (p.y + ms * .00004 * p.v) % 1, x = (p.x + Math.sin(ms * .0006 * p.v + p.ph) * .015 + 1) % 1; g.globalAlpha = .55 * p.z; g.beginPath(); g.arc(x * w, y * h, (1 + p.z * 1.6) * u, 0, 6.28); g.fill(); });
      } else if (kind === 'lanterns') {
        P.forEach(p => {
          const y = 1.05 - ((p.y + ms * .000018 * p.v) % 1.1), x = p.x + Math.sin(ms * .0003 + p.ph) * .01, s = (3 + p.z * 4) * u;
          const gr = g.createRadialGradient(x * w, y * h, 0, x * w, y * h, s * 4); gr.addColorStop(0, 'rgba(255,190,110,.35)'); gr.addColorStop(1, 'rgba(255,190,110,0)');
          g.globalAlpha = .9 * p.z; g.fillStyle = gr; g.fillRect(x * w - s * 4, y * h - s * 4, s * 8, s * 8);
          g.fillStyle = '#ffc77e'; g.fillRect(x * w - s * .5, y * h - s * .7, s, s * 1.4);
        });
      } else {
        P.forEach(p => {
          let x = p.x, y = p.y, a;
          if (kind === 'stars') { y = p.y * .55; a = .25 + .5 * (.5 + .5 * Math.sin(ms * .0012 * p.v + p.ph)); }
          else { x = (p.x + Math.sin(ms * .00022 * p.v + p.ph) * .03 + 1) % 1; y = .25 + p.y * .7 + Math.cos(ms * .00018 * p.v + p.ph) * .02; a = kind === 'flies' ? Math.max(0, Math.sin(ms * .0016 * p.v + p.ph)) * .9 : .35 * p.z; }
          const s = (kind === 'flies' ? 2.2 : 1.3) * p.z * u;
          if (kind !== 'stars') { const gr = g.createRadialGradient(x * w, y * h, 0, x * w, y * h, s * 5); gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a * .35; g.fillStyle = gr; g.fillRect(x * w - s * 5, y * h - s * 5, s * 10, s * 10); }
          g.globalAlpha = a; g.fillStyle = color; g.beginPath(); g.arc(x * w, y * h, s, 0, 6.28); g.fill();
        });
      }
      g.restore();
    };
  }

  // A soft sound made here: rain (band-passed white noise) or wind (low-passed brown noise), faded in
  let AC = null, node = null, gain = null;
  function sound(kind) {
    if (node) { const n = node, gn = gain; try { gn.gain.cancelScheduledValues(AC.currentTime); gn.gain.setValueAtTime(gn.gain.value, AC.currentTime); gn.gain.linearRampToValueAtTime(0, AC.currentTime + .6); } catch (e) { /* closed */ } setTimeout(() => { try { n.stop(); } catch (e) { /* stopped */ } }, 700); node = null; }
    if (!kind) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      const len = AC.sampleRate * 4, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (kind === 'rain') d[i] = w * .35; else { last = (last + .02 * w) / 1.02; d[i] = last * 3.2; } }
      // the loop's two ends meet without a click
      for (let i = 0; i < 2000; i++) { const f = i / 2000; d[i] = d[i] * f + d[len - 2000 + i] * (1 - f); }
      const src = AC.createBufferSource(); src.buffer = buf; src.loop = true; src.loopEnd = (len - 2000) / AC.sampleRate;
      const f = AC.createBiquadFilter(); f.type = kind === 'rain' ? 'bandpass' : 'lowpass'; f.frequency.value = kind === 'rain' ? 1800 : 500; f.Q.value = .6;
      gain = AC.createGain(); gain.gain.value = 0; gain.gain.linearRampToValueAtTime(.16, AC.currentTime + 2);
      src.connect(f).connect(gain).connect(AC.destination); src.start(); node = src;
    } catch (e) { node = null; }
  }

  let open = null;
  function prefs(world) {
    const I = ML.islandArt.isle(world), p = I.refuge && typeof I.refuge === 'object' ? I.refuge : {};
    return { sky: SKIES.includes(p.sky) ? p.sky : 'live', weather: WEATHER.includes(p.weather) ? p.weather : 'world', sound: !!p.sound, breath: !!p.breath };
  }
  function keep(world, st) { ML.islandArt.isle(world).refuge = { sky: st.sky, weather: st.weather, sound: st.sound, breath: st.breath }; save(); }

  // the painting, once per opening: sky apart (when the world gives it), island in its pencil where not earned yet
  function paintFor(v, W, H) {
    const A = ML.IslandArt, IA = ML.islandArt, box = IA.box(v.scene) || [.25, .15, .75, .9];
    const dpr = Math.min(2, window.devicePixelRatio || 1), fitW = Math.min(W * .98, H * .9 * (box[2] - box[0]) / (box[3] - box[1]) * 1200 / 780);
    const pw = Math.round(Math.max(1000, Math.min(2400, fitW * dpr / (box[2] - box[0]))));
    const cv = mkc(pw, Math.round(pw * 780 / 1200)), back = mkc(1, 1);
    const scene = v.scene === 'cart' ? 'cart-tiles7' : v.scene, o = IA.opts(v);
    if (v.scene === 'neo-roof7' && v.car) o.car = v.car;
    A.paint(cv, scene, Object.assign(o, { back }));
    IA.grow(cv, v, back.dataset.on === '1');
    const sky = back.dataset.on === '1' ? back : null;
    let pale = null;
    if (sky && v.grow && !v.grow.view) { pale = mkc(sky.width, sky.height); const g = pale.getContext('2d'); g.drawImage(sky, 0, 0); g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,.78)'; g.fillRect(0, 0, pale.width, pale.height); g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(8,9,14,.28)'; g.fillRect(0, 0, pale.width, pale.height); }
    // the island's rectangle melts at its edges into a sky drawn at another scale
    const soft = mkc(cv.width, cv.height), sg = soft.getContext('2d'); sg.drawImage(cv, 0, 0); sg.globalCompositeOperation = 'destination-in';
    const gx = sg.createLinearGradient(0, 0, cv.width, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(.1, '#000'); gx.addColorStop(.9, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = gx; sg.fillRect(0, 0, cv.width, cv.height);
    const gy = sg.createLinearGradient(0, 0, 0, cv.height); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(.12, '#000'); gy.addColorStop(.88, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = gy; sg.fillRect(0, 0, cv.width, cv.height);
    // without a sky apart, the frame is filled from the painting's own top and bottom colours
    let top = '#0a0b12', bot = '#0a0b12';
    if (!sky) { try { const g = cv.getContext('2d'), a = g.getImageData(0, 2, cv.width, 1).data, b = g.getImageData(0, cv.height - 3, cv.width, 1).data; const avg = d => { let r = 0, gg = 0, bb = 0, n = 0; for (let i = 0; i < d.length; i += 16) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++; } return `rgb(${r / n | 0},${gg / n | 0},${bb / n | 0})`; }; top = avg(a); bot = avg(b); } catch (e) { /* tainted or empty */ } }
    return { w: cv.width, h: cv.height, isl: soft, sky, pale, box, top, bot, pix: v.scene === 'cart' || v.scene === 'base-arc5' };
  }

  function openRefuge() {
    if (open || !ML.islandArt || !ML.IslandArt) return;
    const v = ML.islandArt.view(), st = prefs(v.world), wl = WORLD_LIFE[v.world] || ['motes', '#ffffff'];
    const el = document.createElement('div'); el.className = 'rf'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', t('rf_open')); el.tabIndex = -1;
    const row = (k, list, cur, lab) => `<div class="rf-row"><span>${esc(t(lab))}</span><div class="chips" data-k="${k}">${list.map(([val, n]) => `<button type="button" class="chip-btn" data-v="${val}" aria-pressed="${String(cur) === val}">${esc(t(n))}</button>`).join('')}</div></div>`;
    el.innerHTML = `<canvas class="rf-cv" aria-hidden="true"></canvas><p class="rf-breath" aria-live="off"></p><p class="rf-clock"></p><p class="rf-hint">${esc(t('rf_hint'))}</p>
      <button type="button" class="rf-x small">${esc(t('rf_close'))}</button>
      <div class="rf-drawer">${row('sky', SKIES.map(k => [k, 'rf_' + k]), st.sky, 'rf_sky')}${row('weather', WEATHER.map(k => [k, 'rf_' + k]), st.weather, 'rf_weather')}${row('sound', [['false', 'rf_silent'], ['true', 'rf_noise']], st.sound, 'rf_sound')}${row('breath', [['false', 'rf_off'], ['true', 'rf_on']], st.breath, 'rf_breath')}</div>`;
    document.body.appendChild(el);
    const cv = el.querySelector('.rf-cv'), g = cv.getContext('2d'), clock = el.querySelector('.rf-clock'), breath = el.querySelector('.rf-breath');
    let P = null, life = null, lifeKey = '', raf = 0, lastT = 0, t0 = performance.now(), lift = .5;
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
      if (!P || cv.width > P.paintedFor * 1.3) { try { P = paintFor(v, innerWidth, innerHeight); P.paintedFor = cv.width; } catch (err) { console.error('refuge', err); } }
      draw(performance.now());
    };
    const tick = () => { const d = new Date(); clock.textContent = d.toLocaleTimeString(S.lang === 'en' ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }); };
    function draw(now) {
      if (!P) return;
      const w = cv.width, h = cv.height, k = still() ? 0 : (now - t0) / 1000, b = P.box;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.imageSmoothingEnabled = !P.pix;
      const dx = Math.sin(k / 23) * w * .02, dy = Math.cos(k / 31) * h * .01, zoom = 1 + .02 * Math.sin(k / 41);
      // sky at cover, drifting a third as much as the island
      const sky = P.pale || P.sky;
      if (sky) { const ss = Math.max(w / P.w, h / P.h) * 1.06; g.drawImage(sky, w / 2 - P.w * ss / 2 + dx * .35, h / 2 - P.h * ss / 2 + dy * .35, P.w * ss, P.h * ss); }
      else { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, P.top); gr.addColorStop(1, P.bot); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      const hour = st.sky === 'live' ? hourNow() : st.sky;
      if (GRADE[hour] && !(st.sky === 'live' && hour === 'night')) { g.save(); GRADE[hour](g, w, h); g.restore(); }
      // the island fits the screen
      const bw = (b[2] - b[0]) * P.w, bh = (b[3] - b[1]) * P.h, s = Math.min(w * .98 / bw, h * .74 / bh) * zoom;
      // on a tall screen the island rises while the drawer is open, so it stays in sight
      const want = el.classList.contains('ui') && h > w * 1.2 ? .32 : .5;
      lift = still() ? want : lift + (want - lift) * .12;
      const cx = (b[0] + b[2]) / 2 * P.w, cy = (b[1] + b[3]) / 2 * P.h, ox = w / 2 - cx * s + dx, oy = h * lift - cy * s + dy;
      g.drawImage(P.isl, ox, oy, P.w * s, P.h * s);
      if (st.sky === 'night') { g.save(); GRADE.night(g, w, h); g.restore(); }
      // the light on the tower breathes: in 4 s, out 6 s
      if (st.breath) {
        const ph = (k % 10) / 10, a = ph < .4 ? ph / .4 : 1 - (ph - .4) / .6, e = .5 - .5 * Math.cos(a * Math.PI);
        const tw = ML.islandArt.tower(v), x = ox + tw[0] / 100 * P.w * s, y = oy + tw[1] / 100 * P.h * s, r = Math.min(w, h) * (.2 + .1 * e);
        g.save(); g.globalCompositeOperation = 'lighter';
        const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,210,150,${(.05 + .2 * e).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,210,150,0)');
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
        const word = t(ph < .4 ? 'rf_in' : 'rf_out'); if (breath.textContent !== word) breath.textContent = word;
      } else if (breath.textContent) breath.textContent = '';
      const kind = st.weather === 'world' ? wl[0] : st.weather;
      if (kind !== 'clear') {
        const col = st.weather === 'world' ? wl[1] : kind === 'rain' ? '#cfe3f5' : kind === 'snow' ? '#ffffff' : kind === 'flies' ? '#ffe9a0' : '#ffd0a0';
        if (lifeKey !== kind + col) { lifeKey = kind + col; life = Life(kind, col); }
        life(g, w, h, still() ? 0 : now);
      }
      const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.max(w, h) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
      g.fillStyle = vg; g.fillRect(0, 0, w, h);
    }
    // about thirty frames a second, only while it shows; one frame under reduced motion
    const loop = now => {
      raf = 0; if (!open || document.hidden) return;
      if (now - lastT > 32) { draw(now); lastT = now; }
      if (!still()) raf = requestAnimationFrame(loop);
    };
    const wake = () => { if (open && !raf && !document.hidden) { if (still()) draw(performance.now()); else raf = requestAnimationFrame(loop); } };
    const clockT = setInterval(tick, 15000);
    const ui = on => { el.classList.toggle('ui', on); el.querySelector('.rf-hint').hidden = true; if (still()) draw(performance.now()); };
    el.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b && b.classList.contains('rf-x')) { close(); return; }
      if (b && b.dataset.v != null) {
        const k = b.parentElement.dataset.k, val = b.dataset.v;
        st[k] = k === 'sound' || k === 'breath' ? val === 'true' : val;
        b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        if (k === 'sound' || (k === 'weather' && st.sound)) sound(st.sound ? (st.weather === 'rain' || (st.weather === 'world' && wl[0] === 'rain') ? 'rain' : 'wind') : null);
        keep(v.world, st); draw(performance.now()); return;
      }
      if (e.target.closest('.rf-drawer')) return;
      ui(!el.classList.contains('ui'));
    });
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    addEventListener('resize', fit); document.addEventListener('visibilitychange', wake);
    function close() {
      if (!open) return; open = null;
      cancelAnimationFrame(raf); clearInterval(clockT); sound(null);
      document.removeEventListener('keydown', onKey, true); removeEventListener('resize', fit); document.removeEventListener('visibilitychange', wake);
      if (document.fullscreenElement === el) document.exitFullscreen().catch(() => {});
      el.remove();
      const btn = document.querySelector('[data-wd="refuge"]'); if (btn) btn.focus();
    }
    el.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && open && open.fs) close(); });
    open = { close, fs: false, wake };
    try { if (el.requestFullscreen) el.requestFullscreen().then(() => { if (open) open.fs = true; }).catch(() => {}); } catch (e) { /* not allowed here */ }
    tick(); el.focus();
    // paint after the overlay is on screen (a big painting takes a moment)
    setTimeout(() => { fit(); if (st.sound) sound(st.weather === 'rain' || (st.weather === 'world' && wl[0] === 'rain') ? 'rain' : 'wind'); wake(); setTimeout(() => { const h = el.querySelector('.rf-hint'); if (h) h.classList.add('gone'); }, 3500); }, 30);
  }
  ML.openRefuge = openRefuge;
  on('tab', () => { if (open && S.tab !== 'world') open.close(); });
  on('motion', () => { if (open) open.wake(); });
})();
