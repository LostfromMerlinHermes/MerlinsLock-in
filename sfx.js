// Sounds (step 6c): which events make a sound and when, one soft sound pack per theme (all synthesised with Web
// Audio, no files), the theme ambience on top of the existing mixer, and the sound / motion settings.
// It replaces juice.js's ML.sfxTheme (kept as the fallback pack for the Sport arena).
(() => {
  'use strict';
  const { $, S, t, esc, save, on, emit } = ML;

  ML.addStrings({
    fr: {
      mute_all: 'Couper tous les sons', unmute_all: 'Rétablir les sons', muted_t: 'Sons coupés', unmuted_t: 'Sons rétablis',
      set_sound2: 'Sons et animations', fx_vol: 'Volume des effets', amb_vol: 'Volume de l’ambiance',
      theme_amb: 'Ambiance du thème (pluie, vent, bougie… dans le mixeur)', amb_noise: 'Bruit de fond en plus', noise_none: 'Aucun', noise_white: 'Bruit blanc', noise_brown: 'Bruit brun',
      opt_reduce: 'Animations réduites sur cet appareil (en plus du réglage du système)',
      sound_rules: 'Pendant un focus, seuls la fin de session et tes propres actions (cocher, parquer) font un son. Rien pendant les 10 dernières secondes. En Deep focus, seule la fin de session sonne.',
    },
    en: {
      mute_all: 'Mute all sounds', unmute_all: 'Unmute sounds', muted_t: 'Sounds off', unmuted_t: 'Sounds on',
      set_sound2: 'Sounds and motion', fx_vol: 'Effects volume', amb_vol: 'Ambience volume',
      theme_amb: 'Theme ambience (rain, wind, candle… in the mixer)', amb_noise: 'Extra background noise', noise_none: 'None', noise_white: 'White noise', noise_brown: 'Brown noise',
      opt_reduce: 'Reduced animations on this device (on top of the system setting)',
      sound_rules: 'During focus only the end of the session and your own actions (ticking, parking) make a sound. Nothing in the last 10 seconds. In Deep focus only the session end sounds.',
    },
  });
  ML.defaults(() => ({ soundfx: { vol: 0.7, themeAmb: false, noise: 'none', natureBak: null } }));

  // Mute is per device (localStorage), like the reduced-animations switch
  const muted = () => { try { return localStorage.getItem('mli-mute') === '1'; } catch (e) { return false; } };
  ML.muted = muted;
  function setMuted(v) {
    try { if (v) localStorage.setItem('mli-mute', '1'); else localStorage.removeItem('mli-mute'); } catch (e) {}
    renderMute(); emit('mute', v);
    ML.toast(t(v ? 'muted_t' : 'unmuted_t'), { ms: 1600, key: 'mute' });
  }
  function renderMute() {
    const b = $('mute-btn'); if (!b) return;
    const m = muted(); b.setAttribute('aria-pressed', m); b.title = t(m ? 'unmute_all' : 'mute_all'); b.setAttribute('aria-label', b.title);
  }
  $('mute-btn').onclick = () => setMuted(!muted());
  on('started', renderMute); on('lang', renderMute);

  /* ---------- When a sound may play ---------- */
  // 42–43 and 61: during focus only the session end and the user's own actions; nothing in the last 10 s;
  // in Deep focus only the session end. Secondary clicks only with the "button sounds" option, never during focus.
  const USER = new Set(['task', 'sub', 'park', 'lock', 'mood', 'abandon', 'buy']);
  const END = new Set(['session', 'breakEnd']);
  function allowed(kind) {
    if (muted()) return false;
    const root = document.documentElement, focusing = root.dataset.timer === 'running';
    if (END.has(kind)) return true;
    if (root.classList.contains('t-final')) return false;
    const deep = $('deep') && !$('deep').hidden;
    if (deep) return false;
    if (kind === 'click') return !!(S.juice && S.juice.clicks) && !focusing;
    if (focusing) return USER.has(kind);
    return true;
  }

  /* ---------- Synth toolkit ---------- */
  let ac = null, bus = null, echo = null, noiseBuf = null;
  function ctx() {
    try {
      if (!ac) {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        bus = ac.createGain(); bus.connect(ac.destination);
        // a short echo some packs send to (space chiptune)
        const d = ac.createDelay(1); d.delayTime.value = 0.18; const fb = ac.createGain(); fb.gain.value = 0.3; const wet = ac.createGain(); wet.gain.value = 0.35;
        d.connect(fb).connect(d); d.connect(wet).connect(bus); echo = d;
        noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
      const v = S.soundfx ? S.soundfx.vol : 0.7; bus.gain.value = v * v * 0.9;
      return ac;
    } catch (e) { return null; }
  }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function env(g, t0, a, peak, d) { g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d); }
  // tone(type, freq, start offset, decay, volume, {to: glide target, glide, lp, det, a, dest, vib})
  function tone(type, f, at, d, vol, o = {}) {
    const t0 = ac.currentTime + at, os = ac.createOscillator(); os.type = type; os.frequency.setValueAtTime(f, t0);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t0 + (o.glide || d));
    if (o.det) os.detune.value = o.det;
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib; lg.gain.value = f * 0.012; l.connect(lg).connect(os.frequency); l.start(t0); l.stop(t0 + d + 0.3); }
    let node = os;
    if (o.lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(o.lp, t0); if (o.lpTo) fl.frequency.exponentialRampToValueAtTime(o.lpTo, t0 + d); os.connect(fl); node = fl; }
    const g = ac.createGain(); env(g, t0, o.a || 0.005, vol, d); node.connect(g); g.connect(o.dest || bus); if (o.echo) g.connect(echo);
    os.start(t0); os.stop(t0 + (o.a || 0.005) + d + 0.1);
  }
  // noise(start offset, decay, volume, {type, f, q, to: filter sweep target, a})
  function noise(at, d, vol, o = {}) {
    const t0 = ac.currentTime + at, src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = o.type || 'bandpass'; fl.frequency.setValueAtTime(o.f || 2000, t0); fl.Q.value = o.q || 1;
    if (o.to) fl.frequency.exponentialRampToValueAtTime(o.to, t0 + d);
    const g = ac.createGain(); env(g, t0, o.a || 0.003, vol, d);
    src.connect(fl).connect(g).connect(o.dest || bus); src.start(t0, Math.random()); src.stop(t0 + (o.a || 0.003) + d + 0.05);
  }
  // an inharmonic bell: one sine per partial ratio, the higher ones quieter and shorter
  const bell = (f, at, d, vol, ratios = [1, 2.76, 5.4], o = {}) => ratios.forEach((r, i) => tone('sine', f * r, at, d / (1 + i * 0.5), vol / (1 + i * 1.6), o));
  const seq = (notes, gap, fn) => notes.forEach((n, i) => fn(n, i * gap, i));

  /* ---------- Packs (44–55): every recipe is soft and short; the session end is the longest ---------- */
  const PACKS = {
    // Clean Room: dry clicks, a mechanical relay, a confirmation beep
    cleanroom: (() => {
      const click = (at = 0, v = 0.22) => noise(at, 0.012, v, { type: 'highpass', f: 3200 });
      const relay = (at = 0) => { click(at, 0.26); tone('square', 120, at, 0.03, 0.05, { lp: 700 }); click(at + 0.035, 0.2); };
      const beep = (f, at = 0, d = 0.09) => tone('sine', f, at, d, 0.1);
      return {
        click: () => click(0, 0.12), lock: () => { relay(); beep(1760, 0.08); }, task: () => { beep(1320); beep(1760, 0.1); }, sub: () => beep(1568, 0, 0.06),
        quest: () => seq([1320, 1568, 1760], 0.09, (f, at) => beep(f, at)), session: () => seq([1046, 1318, 1568, 2093], 0.12, (f, at, i) => beep(f, at, i === 3 ? 0.35 : 0.1)),
        breakEnd: () => { beep(880); beep(1320, 0.12); }, mood: () => relay(), park: () => { click(); beep(2093, 0.03, 0.05); },
        level: () => seq([1046, 1318, 1568, 2093, 2637], 0.08, (f, at) => beep(f, at)), ach: () => seq([1318, 1568, 2093], 0.08, (f, at) => beep(f, at)), buy: () => { relay(); beep(1568, 0.08); },
        abandon: () => { beep(660); beep(440, 0.12, 0.2); },
      };
    })(),
    // Synthwave: analogue saws through a low-pass, rising arpeggios, a warm chord at the end of a session
    neoncity: (() => {
      const saw = (m, at = 0, d = 0.3, v = 0.045, o = {}) => { tone('sawtooth', mtof(m), at, d, v, Object.assign({ lp: 1800, det: 8 }, o)); tone('sawtooth', mtof(m), at, d, v, Object.assign({ lp: 1800, det: -8 }, o)); };
      const arp = (ms, gap = 0.07) => seq(ms, gap, (m, at) => saw(m, at, 0.28));
      return {
        click: () => saw(84, 0, 0.03, 0.015), lock: () => arp([57, 64, 69]), task: () => arp([69, 76]), sub: () => saw(76, 0, 0.15),
        quest: () => arp([64, 69, 73, 76]), session: () => [57, 61, 64, 68].forEach(m => saw(m, 0, 1.6, 0.035, { a: 0.08, lp: 800, lpTo: 2600 })),
        breakEnd: () => arp([64, 69]), mood: () => arp([57, 64], 0.05), park: () => saw(81, 0, 0.12, 0.03), level: () => arp([57, 61, 64, 69, 73, 76, 81], 0.06),
        ach: () => arp([69, 73, 76, 81]), buy: () => arp([69, 76]), abandon: () => arp([64, 60, 57], 0.09),
      };
    })(),
    // Netrunner: data blips; a short digital glitch on LOCK IN
    netrunner: (() => {
      const blip = (f, at = 0, d = 0.025, v = 0.05) => tone('square', f, at, d, v, { lp: 4000 });
      const glitch = n => { for (let i = 0; i < n; i++) blip(600 + Math.random() * 2400, i * 0.015, 0.012, 0.04); noise(0, 0.08, 0.06, { type: 'highpass', f: 4000 }); };
      return {
        click: () => blip(2000, 0, 0.012, 0.025), lock: () => glitch(8), task: () => { blip(1800); blip(2400, 0.05); }, sub: () => blip(2400),
        quest: () => seq([1800, 2400, 3000], 0.05, (f, at) => blip(f, at)), session: () => { seq([1200, 1800, 1500, 2400, 2000, 3000], 0.05, (f, at) => blip(f, at)); tone('sine', 880, 0.32, 0.3, 0.06); },
        breakEnd: () => { blip(1200); blip(1800, 0.06); }, mood: () => glitch(4), park: () => blip(3000, 0, 0.02), level: () => seq([800, 1000, 1200, 1500, 1800, 2200, 2600, 3000], 0.035, (f, at) => blip(f, at)),
        ach: () => seq([1500, 2000, 3000], 0.05, (f, at) => blip(f, at)), buy: () => { blip(1500); blip(2200, 0.05); }, abandon: () => { blip(600, 0, 0.05); blip(400, 0.07, 0.08); },
      };
    })(),
    // Washi: a water drop, a soft bell, a singing bowl at the end of a session
    washi: (() => {
      const drop = (f = 1200, at = 0, v = 0.12) => tone('sine', f, at, 0.12, v, { to: f * 0.35, glide: 0.07 });
      const soft = (f, at = 0) => bell(f, at, 1.6, 0.05, [1, 2.0, 3.01]);
      const bowl = (f = 220) => { bell(f, 0, 4.5, 0.07, [1, 2.72, 5.1], { a: 0.02 }); bell(f * 1.007, 0, 4.5, 0.05, [1, 2.72], { a: 0.02 }); };
      return {
        click: () => drop(2200, 0, 0.03), lock: () => drop(), task: () => { drop(1400); soft(1760, 0.08); }, sub: () => drop(1600, 0, 0.08),
        quest: () => { soft(1318); soft(1760, 0.18); }, session: () => bowl(), breakEnd: () => soft(880), mood: () => drop(900), park: () => drop(1800, 0, 0.07),
        level: () => { bowl(196); soft(1318, 0.3); soft(1760, 0.5); }, ach: () => { soft(1568); soft(2093, 0.15); }, buy: () => { drop(1400); soft(1760, 0.06); }, abandon: () => drop(700),
      };
    })(),
    // Abyss: muffled underwater tones and bubbles
    abyss: (() => {
      const bub = (f = 400, at = 0, v = 0.07) => tone('sine', f, at, 0.06, v, { to: f * 2.4, glide: 0.05, lp: 1400 });
      const deep = (f, at = 0, d = 1.2, v = 0.05) => tone('triangle', f, at, d, v, { lp: 600, a: 0.05 });
      const bubbles = n => { for (let i = 0; i < n; i++) bub(300 + Math.random() * 500, i * 0.07 + Math.random() * 0.03); };
      return {
        click: () => bub(1000, 0, 0.02), lock: () => bubbles(3), task: () => { bub(400); bub(600, 0.08); }, sub: () => bub(700),
        quest: () => bubbles(4), session: () => { [196, 294, 392].forEach((f, i) => deep(f, i * 0.15, 2.5, 0.045)); bubbles(5); }, breakEnd: () => deep(294),
        mood: () => bubbles(2), park: () => bub(900), level: () => { [196, 247, 294, 392].forEach((f, i) => deep(f, i * 0.12, 1.8)); bubbles(4); }, ach: () => { deep(392); bubbles(3); },
        buy: () => bubbles(2), abandon: () => tone('triangle', 294, 0, 0.6, 0.05, { lp: 500, to: 147 }),
      };
    })(),
    // Sanctuary (golden stars): a crystalline chime
    sanctuary: (() => {
      const chime = (f, at = 0, d = 1.4, v = 0.045) => bell(f, at, d, v, [1, 2.0, 3.0, 4.07]);
      const casc = (fs, gap) => seq(fs, gap, (f, at) => chime(f, at));
      return {
        click: () => chime(3136, 0, 0.2, 0.012), lock: () => chime(1568), task: () => casc([2093, 2637], 0.09), sub: () => chime(2637, 0, 0.7),
        quest: () => casc([1568, 2093, 2637], 0.1), session: () => casc([1568, 1760, 2093, 2349, 2637, 3136], 0.13), breakEnd: () => chime(1760),
        mood: () => chime(2093), park: () => chime(3136, 0, 0.5, 0.03), level: () => casc([1046, 1318, 1568, 2093, 2637, 3136, 4186], 0.11), ach: () => casc([2093, 2637, 3136], 0.09),
        buy: () => casc([2093, 2637], 0.07), abandon: () => casc([1318, 1046], 0.14),
      };
    })(),
    // Codex (grimoire): a scratching quill, a wax seal, a page turned
    codex: (() => {
      const scratch = (at = 0, d = 0.25, v = 0.07) => { for (let x = 0; x < d; x += 0.012 + Math.random() * 0.025) noise(at + x, 0.012 + Math.random() * 0.015, v * (0.5 + Math.random() * 0.5), { f: 3200 + Math.random() * 1500, q: 2 }); };
      const seal = (at = 0, v = 0.18) => { tone('sine', 90, at, 0.18, v, { to: 55 }); noise(at, 0.12, 0.08, { type: 'lowpass', f: 400 }); };
      const page = (at = 0) => noise(at, 0.35, 0.1, { f: 900, to: 3500, q: 0.8, a: 0.12 });
      const ding = (f, at = 0, d = 1, v = 0.04) => bell(f, at, d, v, [1, 2.4, 3.9]);
      return {
        click: () => scratch(0, 0.04, 0.04), lock: () => seal(), task: () => scratch(), sub: () => scratch(0, 0.12),
        quest: () => { scratch(0, 0.15); ding(1320, 0.18, 0.8); }, session: () => { page(); ding(392, 0.3, 2, 0.06); }, breakEnd: () => page(), mood: () => page(),
        park: () => scratch(0, 0.1), level: () => { page(); seal(0.35); ding(523, 0.5, 1.6, 0.05); }, ach: () => { scratch(0, 0.12); ding(1046, 0.15, 0.9); }, buy: () => seal(0, 0.12),
        abandon: () => seal(0, 0.1),
      };
    })(),
    // Copper observatory: gears and a small brass bell
    observatory: (() => {
      const tick = (at = 0, v = 0.16) => { noise(at, 0.02, v, { f: 2600, q: 9 }); tone('square', 1800, at, 0.008, 0.02); };
      const gears = (n = 6) => [0, 0.07, 0.11, 0.19, 0.24, 0.31, 0.37].slice(0, n).forEach(at => tick(at, 0.12));
      const brass = (f, at = 0, d = 1.3, v = 0.05) => bell(f, at, d, v, [1, 2.4, 3.9, 5.6]);
      return {
        click: () => tick(0, 0.07), lock: () => gears(), task: () => brass(1320), sub: () => tick(),
        quest: () => { brass(1320); brass(1760, 0.15); }, session: () => { gears(7); brass(880, 0.42, 2.2, 0.06); }, breakEnd: () => brass(1046), mood: () => gears(3),
        park: () => { tick(); tick(0.06); }, level: () => { gears(); seq([880, 1046, 1320, 1760], 0.14, (f, at) => brass(f, 0.4 + at)); }, ach: () => { brass(1320); brass(1760, 0.12); },
        buy: () => { gears(3); brass(1568, 0.2, 0.8); }, abandon: () => { tick(); brass(660, 0.05, 0.9); },
      };
    })(),
    // Arcane violet (Cyber sorcerer): an ethereal resonance
    sorcerer: (() => {
      const ether = (f, at = 0, d = 1.2, v = 0.035, o = {}) => { tone('sine', f, at, d, v, Object.assign({ a: 0.12 }, o)); tone('sine', f * 1.003, at, d, v * 0.8, Object.assign({ a: 0.15 }, o)); tone('sine', f * 2.001, at, d * 0.6, v * 0.25, Object.assign({ a: 0.1 }, o)); };
      return {
        click: () => ether(1760, 0, 0.1, 0.01, { a: 0.005 }), lock: () => ether(330, 0, 0.6, 0.04, { to: 660, glide: 0.4 }), task: () => { ether(880, 0, 0.8); ether(1320, 0.12, 0.8); }, sub: () => ether(1320, 0, 0.5),
        quest: () => seq([660, 880, 1320], 0.12, (f, at) => ether(f, at, 0.9)), session: () => [220, 330, 440, 660].forEach((f, i) => ether(f, i * 0.08, 3, 0.03, { a: 0.3 })), breakEnd: () => ether(660),
        mood: () => ether(440, 0, 0.8), park: () => ether(1760, 0, 0.4, 0.02), level: () => { [220, 330, 440].forEach(f => ether(f, 0, 2.4, 0.03, { a: 0.3 })); ether(440, 0.2, 1.2, 0.03, { to: 1760, glide: 0.9 }); },
        ach: () => seq([880, 1320, 1760], 0.1, (f, at) => ether(f, at, 0.8)), buy: () => ether(1320, 0, 0.6), abandon: () => ether(440, 0, 0.9, 0.035, { to: 220, glide: 0.6 }),
      };
    })(),
    // Cartouche: 8-bit coin, power-up and a little end jingle
    cartouche: (() => {
      const sq = (f, at = 0, d = 0.06, v = 0.04) => tone('square', f, at, d, v, { a: 0.002 });
      const coin = (at = 0) => { sq(988, at, 0.06); sq(1319, at + 0.06, 0.25); };
      const notes = (ms, gap, d = 0.05) => seq(ms, gap, (m, at) => sq(mtof(m), at, d));
      return {
        click: () => sq(1760, 0, 0.015, 0.015), lock: () => notes([60, 64, 67, 72], 0.04), task: () => coin(), sub: () => sq(1319, 0, 0.05),
        quest: () => { coin(); coin(0.15); }, session: () => notes([72, 76, 79, 84, 79, 84], 0.12, 0.1), breakEnd: () => notes([79, 84], 0.1, 0.08), mood: () => notes([72, 79], 0.06),
        park: () => sq(1568, 0, 0.04), level: () => { notes([60, 64, 67, 72, 76, 79, 84, 88], 0.04, 0.04); seq([84, 88, 91, 96], 0.12, (m, at) => sq(mtof(m), 0.4 + at, 0.1)); }, ach: () => notes([72, 79, 84], 0.07),
        buy: () => coin(), abandon: () => notes([67, 60], 0.12, 0.1),
      };
    })(),
    // Pixel violet (8-bit arcade, dark): space chiptune with vibrato, slides and a short echo
    arcade: (() => {
      const tri = (m, at = 0, d = 0.12, v = 0.06) => tone('triangle', mtof(m), at, d, v, { vib: 6, echo: true });
      const sweep = (f, to, d = 0.25) => tone('square', f, 0, d, 0.03, { to, glide: d, lp: 2400, echo: true });
      return {
        click: () => tone('triangle', 1760, 0, 0.015, 0.02), lock: () => sweep(220, 880), task: () => seq([76, 83], 0.08, (m, at) => tri(m, at)), sub: () => tri(83, 0, 0.08),
        quest: () => seq([72, 79, 84], 0.08, (m, at) => tri(m, at)), session: () => seq([64, 71, 76, 79, 83], 0.14, (m, at, i) => tri(m, at, i === 4 ? 0.5 : 0.14)), breakEnd: () => seq([71, 76], 0.1, (m, at) => tri(m, at)),
        mood: () => sweep(880, 440, 0.2), park: () => tri(88, 0, 0.06), level: () => seq([64, 67, 71, 76, 79, 83, 88], 0.07, (m, at) => tri(m, at)), ach: () => seq([76, 83, 88], 0.07, (m, at) => tri(m, at)),
        buy: () => seq([79, 86], 0.06, (m, at) => tri(m, at)), abandon: () => sweep(440, 110, 0.35),
      };
    })(),
    // Gothic tarot (Gray fog): a deep bell, a card turned over
    fog: (() => {
      const deepBell = (f = 110, at = 0, d = 3.5, v = 0.1) => bell(f, at, d, v, [1, 2.0, 2.4, 3.0, 4.5], { a: 0.008 });
      const flip = (at = 0, v = 0.14) => { noise(at, 0.04, v, { f: 2200, q: 1.2 }); noise(at + 0.05, 0.03, v * 0.7, { f: 3000, q: 1.2 }); };
      return {
        click: () => flip(0, 0.05), lock: () => flip(), task: () => { flip(); bell(440, 0.06, 0.9, 0.03); }, sub: () => flip(0, 0.09),
        quest: () => { flip(); flip(0.12); bell(660, 0.2, 1, 0.03); }, session: () => deepBell(), breakEnd: () => deepBell(147, 0, 2, 0.07), mood: () => flip(),
        park: () => flip(0, 0.1), level: () => { deepBell(98); bell(392, 0.4, 1.8, 0.03); bell(587, 0.6, 1.6, 0.025); }, ach: () => { flip(); bell(587, 0.08, 1.2, 0.035); },
        buy: () => flip(), abandon: () => deepBell(98, 0, 1.5, 0.06),
      };
    })(),
  };
  const LIGHT_PACK = { sanctuary: 'washi', observatory: 'codex', netrunner: 'cleanroom', arcade: 'cartouche' };
  const packName = () => { const r = document.documentElement, th = r.dataset.theme || 'sorcerer'; return r.dataset.light ? LIGHT_PACK[th] : th; };
  const legacy = ML.sfxTheme; // juice.js's voices, still used for the Sport arena
  ML.sfxTheme = kind => {
    if (!allowed(kind)) return;
    const P = PACKS[packName()];
    if (!P) { if (legacy && kind !== 'breakEnd') legacy(kind === 'lock' || kind === 'mood' || kind === 'park' ? 'click' : kind); return; }
    const fn = P[kind] || P.click; if (!fn || !ctx()) return;
    try { fn(); } catch (e) {}
  };
  ML.packName = packName;

  /* ---------- 41. Which events make a sound ---------- */
  const play = kind => { if (S.game && S.game.sfx) ML.sfxTheme(kind); };
  let wasRunning = ML.running ? ML.running() : false, wasMode = S.mode, ready = false;
  on('timer', () => {
    const r = ML.running();
    if (ready && r && !wasRunning && S.mode === 'focus') play('lock');                   // LOCK IN
    if (ready && !r && wasRunning && wasMode === 'break' && S.mode !== 'break') play('breakEnd'); // a break ran out
    wasRunning = r; wasMode = S.mode;
  });
  on('started', () => { ready = true; wasRunning = ML.running(); wasMode = S.mode; });
  on('mood', () => { if (ready) play('mood'); });
  on('parked', () => play('park'));
  // (task done, quests, Sequence up, achievements, shop and the session end already call ML.sfx in game.js / juice.js)

  /* ---------- 56–57. Theme ambience, carried by the existing mixer ---------- */
  // Off by default. When on, the mixer's nature layers follow the theme (the previous mix is kept and given back
  // when it's switched off); an extra white or brown noise can be added. The mixer itself dips at pause (audio.js).
  const AMB = {
    cleanroom: { plane: 0.18, brown: 0.15 }, netrunner: { rain: 0.32, plane: 0.12 }, neoncity: { rain: 0.38 }, washi: { rain: 0.22, wind: 0.14 },
    sanctuary: { night: 0.38, river: 0.18 }, abyss: { underwater: 0.5 }, codex: { fire: 0.34 }, observatory: { fire: 0.22, wind: 0.14 },
    sorcerer: { wind: 0.28, bowls: 0.12 }, cartouche: { forest: 0.4 }, arcade: { night: 0.3 }, fog: { fire: 0.28, wind: 0.24 },
  };
  function themeNature() {
    const base = Object.assign({}, AMB[packName()] || {}), n = S.soundfx.noise;
    if (n === 'white' || n === 'brown') base[n] = 0.3;
    return base;
  }
  function applyAmb() {
    if (!S.soundfx.themeAmb || !S.audio) return;
    const want = themeNature();
    if (JSON.stringify(want) !== JSON.stringify(S.audio.nature)) { S.audio.nature = want; save(); if (ML.Audio && ML.Audio.refresh) ML.Audio.refresh(); }
  }
  function setThemeAmb(onOff) {
    const F = S.soundfx;
    if (onOff && !F.themeAmb) { F.natureBak = Object.assign({}, S.audio.nature); F.themeAmb = true; applyAmb(); if (ML.Audio && !ML.Audio.playing) ML.Audio.play(); }
    else if (!onOff && F.themeAmb) { F.themeAmb = false; if (F.natureBak) S.audio.nature = F.natureBak; F.natureBak = null; save(); if (ML.Audio && ML.Audio.refresh) ML.Audio.refresh(); }
    save();
  }
  on('mood', () => setTimeout(applyAmb, 50)); on('minute', applyAmb); on('started', () => setTimeout(applyAmb, 200));

  /* ---------- 58–60. Settings ---------- */
  ML.settingsSection({
    order: 17,
    render: () => `<h3>${esc(t('set_sound2'))}</h3>
      <label class="d-slider"><span>${esc(t('fx_vol'))}</span><input type="range" id="sx-fx" min="0" max="1" step="0.05" value="${S.soundfx.vol}"></label>
      <label class="d-slider"><span>${esc(t('amb_vol'))}</span><input type="range" id="sx-amb" min="0" max="1" step="0.05" value="${S.audio ? S.audio.master : 0.7}"></label>
      ${ML.ui.chk('sx-theme', t('theme_amb'), S.soundfx.themeAmb)}
      <label class="field"><span>${esc(t('amb_noise'))}</span>${ML.ui.sel('sx-noise', ['none', 'white', 'brown'].map(v => [v, t('noise_' + v)]), S.soundfx.noise)}</label>
      ${ML.ui.chk('sx-reduce', t('opt_reduce'), ML.motionPref())}
      <p class="hint">${esc(t('sound_rules'))}</p>`,
    bind: r => {
      const fx = r.querySelector('#sx-fx');
      fx.oninput = () => { S.soundfx.vol = +fx.value; save(); };
      fx.onchange = () => { const k = S.game.sfx; S.game.sfx = true; ML.sfxTheme('task'); S.game.sfx = k; }; // a sample at the new level
      r.querySelector('#sx-amb').oninput = e => { if (S.audio) { S.audio.master = +e.target.value; save(); if (ML.Audio && ML.Audio.refresh) ML.Audio.refresh(); } };
      r.querySelector('#sx-theme').onchange = e => setThemeAmb(e.target.checked);
      r.querySelector('#sx-noise').onchange = e => { S.soundfx.noise = e.target.value; save(); applyAmb(); };
      r.querySelector('#sx-reduce').onchange = e => ML.setReducedMotion(e.target.checked);
    },
  });
})();
