// Sound engine: generated music (8 genres + the user's own files), 12 nature layers, optional
// "neural" amplitude modulation, sleep/nap timer, breathing guide and saved mixes. No audio files ship.
(() => {
  'use strict';
  const { $, S, t, esc, save, on, emit, toast, clamp } = ML;

  ML.addStrings({
    fr: {
      ambience: 'Ambiance', mixer: 'Mixeur', play: 'Lecture', stop: 'Stop', silent: 'Silence',
      mode_focus: 'Focus', mode_relax: 'Relax', mode_meditate: 'Méditer', mode_sleep: 'Sommeil', mode_nap: 'Sieste',
      sub_deep: 'Deep Work', sub_creative: 'Créativité', sub_learning: 'Apprentissage', sub_light: 'Light Work', sub_motivation: 'Motivation',
      sub_unwind: 'Décompresser', sub_destress: 'Déstresser', sub_recharge: 'Recharger', sub_chill: 'Chill',
      sub_guided: 'Guidée', sub_unguided: 'Libre', sub_wind: 'Endormissement', sub_deepsleep: 'Sommeil profond', sub_sleepwake: 'Dormir et se réveiller', sub_guidedsleep: 'Sommeil guidé', sub_power: 'Power nap',
      g_drone: 'Drone', g_atmospheric: 'Atmosphérique', g_piano: 'Piano', g_lofi: 'Lofi', g_electronic: 'Électro', g_grooves: 'Grooves', g_cinematic: 'Cinématique', g_acoustic: 'Acoustique', g_mine: 'Ta musique', g_none: 'Sans musique',
      g_jazz: 'Jazz chill', g_jazzhop: 'Jazz-hop zen', g_zen: 'Zen japonais', g_tavern: 'Taverne médiévale', g_synthwave: 'Synthwave', g_chiptune: 'Chiptune 8-bit',
      gf_calm: 'Calme', gf_keys: 'Piano & cordes', gf_chill: 'Chill', gf_energy: 'Énergie', gf_epic: 'Épique', gf_mine: 'Ta musique', gf_none: 'Sans musique',
      nf_nature: 'Nature', nf_places: 'Lieux', nf_noise: 'Bruits', ambiences: 'Ambiances',
      n_plane: 'Cabine d’avion', n_train: 'Train', n_cafe: 'Café', n_white: 'Bruit blanc', n_pink: 'Bruit rose',
      n_rain: 'Pluie', n_thunder: 'Orage', n_wind: 'Vent', n_river: 'Rivière', n_beach: 'Plage', n_forest: 'Forêt', n_rainforest: 'Forêt tropicale', n_night: 'Nuit', n_underwater: 'Sous l’eau', n_bowls: 'Bols et carillons', n_fire: 'Feu de camp', n_brown: 'Bruit brun',
      activity: 'Activité', genre: 'Genre', nature: 'Nature', music_vol: 'Musique', master_vol: 'Volume général',
      neural: 'Modulation neurale', neural_hint: 'De légères pulsations dans la musique, plus rapides pour se concentrer, plus lentes pour dormir. Effet variable selon les personnes.',
      neural_off: 'Off', neural_light: 'Légère', neural_medium: 'Moyenne', neural_strong: 'Forte',
      auto_sound: 'Lancer avec le minuteur', break_relax: 'Musique relax pendant les pauses',
      presets: 'Mes mixes', preset_name_ph: 'Nom du mix', preset_save: 'Sauver ce mix', preset_saved: 'Mix « {name} » sauvegardé', preset_applied: 'Mix « {name} »',
      suggestion: 'Pour ton humeur : {mix}', apply: 'Appliquer',
      mine_add: 'Ajouter des fichiers audio', mine_hint: 'Ajoute tes propres morceaux (MP3, OGG…), par exemple de la musique libre de droits. Ils restent dans ce navigateur.', mine_empty: 'Aucun morceau pour l’instant.', mine_added: '{n} morceau(x) ajouté(s)',
      sleep_timer: 'Minuteur', start_sleep: 'Lancer', stop_sleep: 'Arrêter', sleep_left: '{m} restantes', wake_up: 'Debout ! Fin de la sieste.', sleep_done: 'Bonne nuit. Le son s’est arrêté.',
      breath: 'Respiration guidée', breath_start: 'Commencer', breath_stop: 'Arrêter', voice: 'Voix', inhale: 'Inspire', hold: 'Bloque', exhale: 'Expire',
      breath_478: '4-7-8 (apaiser)', breath_box: 'Carré 4-4-4-4 (recentrer)', breath_calm: '4-6 (calme)',
      sound_tap: 'Le son démarrera avec le minuteur. Appuie sur ▶ pour l’écouter maintenant.',
      tone_on: 'Fréquence continue', tone_pure: 'Ton pur', tone_binaural: 'Binaural (casque)', tone_iso: 'Isochrone (haut-parleur)', tone_vol: 'Volume fréquence',
      tone_hint: '40–42 Hz sont trop graves pour un haut-parleur de téléphone : utilise un casque, ou le mode Isochrone. Effets non prouvés scientifiquement ; baisse le volume si c’est inconfortable.',
    },
    en: {
      ambience: 'Ambience', mixer: 'Mixer', play: 'Play', stop: 'Stop', silent: 'Silent',
      mode_focus: 'Focus', mode_relax: 'Relax', mode_meditate: 'Meditate', mode_sleep: 'Sleep', mode_nap: 'Nap',
      sub_deep: 'Deep Work', sub_creative: 'Creativity', sub_learning: 'Learning', sub_light: 'Light Work', sub_motivation: 'Motivation',
      sub_unwind: 'Unwind', sub_destress: 'Destress', sub_recharge: 'Recharge', sub_chill: 'Chill',
      sub_guided: 'Guided', sub_unguided: 'Unguided', sub_wind: 'Wind Down', sub_deepsleep: 'Deep Sleep', sub_sleepwake: 'Sleep and Wake', sub_guidedsleep: 'Guided Sleep', sub_power: 'Power Nap',
      g_drone: 'Drone', g_atmospheric: 'Atmospheric', g_piano: 'Piano', g_lofi: 'Lofi', g_electronic: 'Electronic', g_grooves: 'Grooves', g_cinematic: 'Cinematic', g_acoustic: 'Acoustic', g_mine: 'Your music', g_none: 'No music',
      g_jazz: 'Chill jazz', g_jazzhop: 'Zen jazz-hop', g_zen: 'Japanese zen', g_tavern: 'Medieval tavern', g_synthwave: 'Synthwave', g_chiptune: '8-bit chiptune',
      gf_calm: 'Calm', gf_keys: 'Piano & strings', gf_chill: 'Chill', gf_energy: 'Energy', gf_epic: 'Epic', gf_mine: 'Your music', gf_none: 'No music',
      nf_nature: 'Nature', nf_places: 'Places', nf_noise: 'Noise', ambiences: 'Ambiences',
      n_plane: 'Airplane cabin', n_train: 'Train', n_cafe: 'Café', n_white: 'White noise', n_pink: 'Pink noise',
      n_rain: 'Rain', n_thunder: 'Thunder', n_wind: 'Wind', n_river: 'River', n_beach: 'Beach', n_forest: 'Forest', n_rainforest: 'Rainforest', n_night: 'Night', n_underwater: 'Underwater', n_bowls: 'Chimes and bowls', n_fire: 'Campfire', n_brown: 'Brown noise',
      activity: 'Activity', genre: 'Genre', nature: 'Nature', music_vol: 'Music', master_vol: 'Master volume',
      neural: 'Neural modulation', neural_hint: 'Gentle pulses in the music, faster for focus, slower for sleep. Effects vary from person to person.',
      neural_off: 'Off', neural_light: 'Light', neural_medium: 'Medium', neural_strong: 'Strong',
      auto_sound: 'Start with the timer', break_relax: 'Relaxing music during breaks',
      presets: 'My mixes', preset_name_ph: 'Mix name', preset_save: 'Save this mix', preset_saved: 'Mix "{name}" saved', preset_applied: 'Mix "{name}"',
      suggestion: 'For your mood: {mix}', apply: 'Apply',
      mine_add: 'Add audio files', mine_hint: 'Add your own tracks (MP3, OGG…), for example royalty-free music. They stay in this browser.', mine_empty: 'No tracks yet.', mine_added: '{n} track(s) added',
      sleep_timer: 'Timer', start_sleep: 'Start', stop_sleep: 'Stop', sleep_left: '{m} left', wake_up: 'Rise and shine. Nap over.', sleep_done: 'Good night. Sound stopped.',
      breath: 'Guided breathing', breath_start: 'Start', breath_stop: 'Stop', voice: 'Voice', inhale: 'Breathe in', hold: 'Hold', exhale: 'Breathe out',
      breath_478: '4-7-8 (soothe)', breath_box: 'Box 4-4-4-4 (refocus)', breath_calm: '4-6 (calm)',
      sound_tap: 'Sound will start with the timer. Press ▶ to listen now.',
      tone_on: 'Continuous frequency', tone_pure: 'Pure tone', tone_binaural: 'Binaural (headphones)', tone_iso: 'Isochronic (speaker)', tone_vol: 'Frequency volume',
      tone_hint: '40–42 Hz are too low for a phone speaker: use headphones, or Isochronic mode. Effects are not scientifically proven; lower the volume if it feels uncomfortable.',
    },
  });

  const MODES = {
    focus: { rate: 14, subs: { deep: ['drone', 0.45], creative: ['piano', 0.6], learning: ['lofi', 0.45], light: ['grooves', 0.55], motivation: ['electronic', 0.85] } },
    relax: { rate: 10, subs: { unwind: ['piano', 0.3], destress: ['atmospheric', 0.3], recharge: ['acoustic', 0.45], chill: ['jazzhop', 0.3] } },
    meditate: { rate: 6, subs: { guided: ['drone', 0.2], unguided: ['atmospheric', 0.2] } },
    sleep: { rate: 3, subs: { wind: ['piano', 0.2], deepsleep: ['drone', 0.12], sleepwake: ['drone', 0.15], guidedsleep: ['drone', 0.15] } },
    nap: { rate: 4, subs: { power: ['drone', 0.2] } },
  };
  // Genres and ambiences are grouped in families: the mixer shows the families, a tap opens one
  const GENRE_FAM = {
    calm: ['drone', 'atmospheric', 'zen'], keys: ['piano', 'acoustic', 'tavern'], chill: ['lofi', 'jazzhop', 'jazz'],
    energy: ['electronic', 'grooves', 'synthwave', 'chiptune'], epic: ['cinematic'], mine: ['mine'], none: ['none'],
  };
  const GENRES = Object.values(GENRE_FAM).flat();
  const NATURE_FAM = { nature: ['rain', 'thunder', 'wind', 'river', 'beach', 'forest', 'rainforest', 'night', 'underwater'], places: ['fire', 'cafe', 'train', 'plane', 'bowls'], noise: ['white', 'pink', 'brown'] };
  const NATURE = Object.values(NATURE_FAM).flat();
  const famOf = (fams, k) => Object.keys(fams).find(f => fams[f].includes(k));
  const DEPTH = { off: 0, light: 0.12, medium: 0.25, strong: 0.4 };
  const MOOD_MIX = {
    drained: { mode: 'focus', sub: 'light', genre: 'zen', nature: { rain: 0.5 } },
    steady: { mode: 'focus', sub: 'deep', genre: 'tavern', nature: { fire: 0.35 } },
    fired: { mode: 'focus', sub: 'motivation', genre: 'synthwave', nature: {} },
    scattered: { mode: 'focus', sub: 'learning', genre: 'chiptune', nature: { brown: 0.4 } },
  };
  const BREATHS = { '478': [4, 7, 8, 0], box: [4, 4, 4, 4], calm: [4, 0, 6, 0] };

  ML.defaults(() => ({
    audio: {
      mode: 'focus', sub: 'deep', genre: 'drone', music: true, musicVol: 0.6, master: 0.7, nature: { forest: 0.45 },
      neural: 'light', auto: true, breakRelax: true, open: false, presets: [], napMins: 20, sleepMins: 30, breath: '478', voice: false,
      tone: { on: false, hz: 40, kind: 'pure', vol: 0.4 }, // continuous frequency, off until the user ticks it
    },
  }));
  // Migrate the single ambient sound of v2
  ML.on('loaded', () => { if (S.sound && !S.audio.migrated) { S.audio.nature = { [S.sound === 'hum' ? 'bowls' : S.sound]: 0.5 }; S.audio.migrated = true; } });

  /* ---------- Audio graph ---------- */
  let ctx = null, master, musicBus, musicTone, amGain, amLfo, amDepth, revIn, natureBus;
  const bufs = {};
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // Phones (iOS above all): Web Audio is muted by the silent switch and only starts from a tap.
  // On a phone, the first taps (1) play a looping silent <audio> track, which switches iOS to
  // "media playback" so Web Audio is heard even on silent, (2) set navigator.audioSession to
  // 'playback' (iOS 17+), and (3) resume the AudioContext and play a 1-sample buffer inside the tap.
  const MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let out = null, silentEl = null, unlocked = false, silentErr = null;
  function silentWav() { // half a second of 8-bit silence, mono 8 kHz
    const n = 4000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
    const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }
  function wakeMedia() {
    if (!MOBILE) return;
    if (!silentEl) { silentEl = document.createElement('audio'); silentEl.src = silentWav(); silentEl.loop = true; silentEl.setAttribute('playsinline', ''); silentEl.setAttribute('x-webkit-airplay', 'deny'); }
    if (silentEl.paused) silentEl.play().then(() => { silentErr = null; }).catch(e => { silentErr = e && e.name; });
  }
  function sleepMedia() { if (silentEl && !silentEl.paused && !playing && !ML.running()) silentEl.pause(); }
  // Any tap on a phone re-arms audio (also after a call or Siri "interrupted" the context)
  ['touchend', 'click'].forEach(ev => document.addEventListener(ev, () => { if (MOBILE && (!ctx || ctx.state !== 'running')) ensure(); }, { capture: true, passive: true }));
  function ensure() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        out = ctx.destination;
        master = ctx.createGain(); master.gain.value = 0; master.connect(out);
        amGain = ctx.createGain(); amGain.connect(master);
        amLfo = ctx.createOscillator(); amDepth = ctx.createGain(); amDepth.gain.value = 0;
        amLfo.connect(amDepth).connect(amGain.gain); amLfo.start();
        musicTone = ctx.createBiquadFilter(); musicTone.type = 'lowpass'; musicTone.frequency.value = 12000; musicTone.connect(amGain);
        musicBus = ctx.createGain(); musicBus.gain.value = S.audio.musicVol; musicBus.connect(musicTone);
        const rev = ctx.createConvolver(); rev.buffer = impulse(2.8); revIn = ctx.createGain(); revIn.gain.value = 0.8;
        revIn.connect(rev); rev.connect(master);
        natureBus = ctx.createGain(); natureBus.connect(master);
        const ns = ctx.createGain(); ns.gain.value = 0.12; natureBus.connect(ns); ns.connect(revIn);
      }
      if (ctx.state !== 'running') { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); }
      if (!unlocked) { const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, 22050); s.connect(ctx.destination); s.start(0); unlocked = true; }
      wakeMedia();
    } catch (e) { ctx = null; }
    return ctx;
  }
  function impulse(sec) {
    const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    return b;
  }
  function noise(type) {
    if (bufs[type]) return bufs[type];
    const len = ctx.sampleRate * 4, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (type === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      } else d[i] = w;
    }
    return (bufs[type] = b);
  }

  /* ---------- Layer toolkit (tracks every node and timer so a layer stops cleanly) ---------- */
  function layer(dest) {
    const L = { nodes: [], timers: [], out: ctx.createGain() };
    L.out.connect(dest);
    L.src = (type, gainV = 1) => { const s = ctx.createBufferSource(); s.buffer = noise(type); s.loop = true; s.start(0, Math.random() * 3); L.nodes.push(s); return s; };
    L.g = v => { const g = ctx.createGain(); g.gain.value = v; L.nodes.push(g); return g; };
    L.f = (type, freq, q) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = freq; if (q != null) n.Q.value = q; L.nodes.push(n); return n; };
    L.osc = (type, freq) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.start(); L.nodes.push(o); return o; };
    L.lfo = (rate, depth, param) => { const o = L.osc('sine', rate), g = L.g(depth); o.connect(g).connect(param); return o; };
    L.pan = v => { const p = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(); if (p.pan) p.pan.value = v; return p; };
    L.loop = (fn, minMs, maxMs) => { let alive = true; const go = () => { if (!alive) return; fn(); L.timers.push(setTimeout(go, rnd(minMs, maxMs))); }; L.timers.push(setTimeout(go, rnd(minMs * 0.3, maxMs * 0.5))); L.timers.push({ kill: () => { alive = false; } }); };
    L.every = (fn, ms) => { const id = setInterval(fn, ms); L.timers.push({ iv: id }); };
    L.stop = () => {
      L.timers.forEach(x => { if (x && x.kill) x.kill(); else if (x && x.iv) clearInterval(x.iv); else clearTimeout(x); });
      L.nodes.forEach(n => { try { if (n.stop) n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
      try { L.out.disconnect(); } catch (e) {}
    };
    return L;
  }
  // One-shot helpers that clean themselves up
  function blip(dest, { type = 'sine', f, f2, t0, dur, peak, attack = 0.005, pan = 0 }) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0005, t0 + dur);
    let node = o.connect(g);
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; node = g.connect(p); }
    node.connect(dest);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function burst(dest, { type = 'white', t0, attack, decay, peak, filter = 'lowpass', freq = 1000, q = 0.7, pan = 0 }) {
    const s = ctx.createBufferSource(); s.buffer = noise(type);
    const f = ctx.createBiquadFilter(); f.type = filter; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0005, t0 + attack + decay);
    let node = s.connect(f).connect(g);
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; node = g.connect(p); }
    node.connect(dest);
    s.start(t0, Math.random() * 3); s.stop(t0 + attack + decay + 0.1);
  }

  /* ---------- Nature layers ---------- */
  function bird(dest, dense) {
    const t0 = ctx.currentTime + 0.02, pan = rnd(-0.8, 0.8), kind = Math.random();
    if (kind < 0.45) { // chirps
      const n = 2 + Math.floor(Math.random() * 4), f = rnd(2600, 4600);
      for (let i = 0; i < n; i++) blip(dest, { f, f2: f * rnd(1.15, 1.45), t0: t0 + i * rnd(0.11, 0.17), dur: rnd(0.06, 0.1), peak: rnd(0.04, 0.09), pan });
    } else if (kind < 0.75) { // trill
      const n = 8 + Math.floor(Math.random() * 8), f = rnd(3600, 5200);
      for (let i = 0; i < n; i++) blip(dest, { f, f2: f * 0.9, t0: t0 + i * 0.045, dur: 0.035, peak: 0.04, pan });
    } else { // whistle
      blip(dest, { f: rnd(1700, 2200), f2: rnd(2400, 3000), t0, dur: rnd(0.3, 0.45), peak: 0.06, attack: 0.04, pan });
      if (Math.random() < 0.6) blip(dest, { f: rnd(2400, 2800), f2: rnd(1800, 2100), t0: t0 + 0.5, dur: 0.35, peak: 0.05, attack: 0.04, pan });
    }
    if (dense && Math.random() < 0.3) setTimeout(() => ctx && bird(dest, false), rnd(120, 400));
  }
  const NATURE_BUILD = {
    rain(L) {
      L.src('white').connect(L.f('highpass', 500)).connect(L.f('lowpass', 7500)).connect(L.g(0.22)).connect(L.out);
      const g = L.g(0.35); L.src('pink').connect(L.f('lowpass', 1400)).connect(g).connect(L.out); L.lfo(0.08, 0.06, g.gain);
      L.loop(() => burst(L.out, { t0: ctx.currentTime, attack: 0.002, decay: rnd(0.02, 0.05), peak: rnd(0.05, 0.15), filter: 'bandpass', freq: rnd(2500, 6000), q: 2, pan: rnd(-0.9, 0.9) }), 30, 140);
    },
    thunder(L) {
      L.src('white').connect(L.f('highpass', 600)).connect(L.f('lowpass', 6000)).connect(L.g(0.15)).connect(L.out);
      L.src('pink').connect(L.f('lowpass', 900)).connect(L.g(0.3)).connect(L.out);
      L.loop(() => {
        const t0 = ctx.currentTime + 0.05, near = Math.random() < 0.4;
        if (near) burst(L.out, { type: 'white', t0, attack: 0.01, decay: 0.35, peak: 0.35, filter: 'bandpass', freq: rnd(700, 1400), q: 0.8 });
        burst(L.out, { type: 'brown', t0: t0 + (near ? 0.05 : 0), attack: rnd(0.08, near ? 0.3 : 1.2), decay: rnd(3, 6), peak: near ? 1 : 0.6, filter: 'lowpass', freq: rnd(140, 380) });
      }, 12000, 32000);
    },
    wind(L) {
      const bp = L.f('bandpass', 520, 0.7), g = L.g(0.45);
      L.src('pink').connect(bp).connect(g).connect(L.out);
      L.lfo(0.05, 220, bp.frequency); L.lfo(0.13, 120, bp.frequency); L.lfo(0.07, 0.22, g.gain);
      const wb = L.f('bandpass', 1800, 9), wg = L.g(0.035);
      L.src('white').connect(wb).connect(wg).connect(L.out); L.lfo(0.09, 500, wb.frequency); L.lfo(0.04, 0.03, wg.gain);
    },
    river(L) {
      L.src('white').connect(L.f('bandpass', 900, 0.5)).connect(L.g(0.22)).connect(L.out);
      L.src('pink').connect(L.f('lowpass', 500)).connect(L.g(0.35)).connect(L.out);
      const bb = L.f('bandpass', 2200, 4); L.src('white').connect(bb).connect(L.g(0.09)).connect(L.out);
      L.every(() => bb.frequency.setTargetAtTime(rnd(1400, 3400), ctx.currentTime, 0.03), 70);
    },
    beach(L) {
      const lp = L.f('lowpass', 400), g = L.g(0.12), fizzG = L.g(0.01);
      L.src('brown').connect(lp).connect(g).connect(L.out);
      L.src('white').connect(L.f('highpass', 3000)).connect(fizzG).connect(L.out);
      const wave = () => {
        const t0 = ctx.currentTime, up = rnd(2, 3.2), down = rnd(4.5, 7);
        g.gain.cancelScheduledValues(t0); g.gain.setTargetAtTime(0.95, t0, up / 3); g.gain.setTargetAtTime(0.12, t0 + up, down / 3);
        lp.frequency.cancelScheduledValues(t0); lp.frequency.setTargetAtTime(2400, t0, up / 3); lp.frequency.setTargetAtTime(380, t0 + up, down / 3);
        fizzG.gain.cancelScheduledValues(t0); fizzG.gain.setTargetAtTime(0.08, t0 + up * 0.8, 0.4); fizzG.gain.setTargetAtTime(0.005, t0 + up + 1, down / 3);
      };
      wave(); L.loop(wave, 7000, 11000);
    },
    forest(L) {
      const g = L.g(0.12); L.src('pink').connect(L.f('bandpass', 420, 0.6)).connect(g).connect(L.out); L.lfo(0.06, 0.05, g.gain);
      L.loop(() => bird(L.out, false), 900, 4200);
    },
    rainforest(L) {
      L.src('white').connect(L.f('highpass', 700)).connect(L.f('lowpass', 6000)).connect(L.g(0.1)).connect(L.out);
      L.src('pink').connect(L.f('lowpass', 1200)).connect(L.g(0.18)).connect(L.out);
      L.loop(() => bird(L.out, true), 400, 1900);
      const ig = L.g(0), ins = L.osc('sawtooth', 5200); ins.connect(L.f('bandpass', 5200, 12)).connect(ig).connect(L.out);
      const am = L.osc('square', 42), amg = L.g(0); am.connect(amg).connect(ig.gain);
      L.loop(() => { const on = Math.random() < 0.6; amg.gain.setTargetAtTime(on ? 0.02 : 0, ctx.currentTime, 0.4); }, 2500, 6000);
      L.loop(() => { const t0 = ctx.currentTime; [0, 0.18].forEach(d => blip(L.out, { type: 'triangle', f: rnd(220, 300), f2: rnd(160, 200), t0: t0 + d, dur: 0.12, peak: 0.07, pan: rnd(-0.6, 0.6) })); }, 4000, 11000);
    },
    night(L) {
      L.src('pink').connect(L.f('lowpass', 300)).connect(L.g(0.08)).connect(L.out);
      for (let c = 0; c < 3; c++) {
        const f = rnd(4200, 4800), pan = rnd(-0.8, 0.8);
        L.loop(() => { const t0 = ctx.currentTime, n = 3 + Math.floor(Math.random() * 2); for (let i = 0; i < n; i++) blip(L.out, { f, t0: t0 + i * 0.04, dur: 0.022, peak: 0.025, attack: 0.003, pan }); }, 600, 1300);
      }
      L.loop(() => { const t0 = ctx.currentTime; [0, 0.55, 1.2].forEach((d, i) => blip(L.out, { f: 410, f2: 370, t0: t0 + d, dur: i === 2 ? 0.6 : 0.35, peak: 0.05, attack: 0.05, pan: -0.4 })); }, 25000, 60000);
    },
    underwater(L) {
      const lp = L.f('lowpass', 280); L.src('brown').connect(lp).connect(L.g(0.85)).connect(L.out); L.lfo(0.1, 120, lp.frequency);
      L.loop(() => { const t0 = ctx.currentTime, n = 1 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) { const f = rnd(280, 700); blip(L.out, { f, f2: f * 2.5, t0: t0 + i * rnd(0.06, 0.15), dur: rnd(0.06, 0.12), peak: 0.05, pan: rnd(-0.5, 0.5) }); } }, 300, 2500);
    },
    bowls(L) {
      const bowl = () => {
        const t0 = ctx.currentTime + 0.02, f = pick([130.8, 146.8, 164.8, 196, 220, 261.6]);
        [[1, 1, 9], [2.76, 0.45, 6], [5.4, 0.2, 4], [8.9, 0.1, 2.5]].forEach(([r, a, d]) => {
          [-0.8, 0.8].forEach(det => blip(L.out, { f: f * r + det, t0, dur: d, peak: 0.05 * a, attack: 0.01 }));
        });
      };
      const chimes = () => {
        const t0 = ctx.currentTime, n = 2 + Math.floor(Math.random() * 4), scale = [0, 2, 4, 7, 9];
        for (let i = 0; i < n; i++) { const m = 84 + pick(scale) + 12 * Math.floor(Math.random() * 2); blip(L.out, { f: mtof(m), t0: t0 + i * rnd(0.12, 0.3), dur: 2.5, peak: 0.03, attack: 0.002, pan: rnd(-0.7, 0.7) }); }
      };
      bowl(); L.loop(bowl, 7000, 14000); L.loop(chimes, 3500, 8000);
    },
    fire(L) {
      L.src('brown').connect(L.f('lowpass', 450)).connect(L.g(1)).connect(L.out);
      L.loop(() => { const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) burst(L.out, { t0: ctx.currentTime + Math.random() * 0.15, attack: 0.003, decay: rnd(0.03, 0.1), peak: rnd(0.15, 0.6), filter: 'bandpass', freq: rnd(1200, 4700), q: 1.4, pan: rnd(-0.5, 0.5) }); }, 70, 590);
    },
    brown(L) { L.src('brown').connect(L.g(0.85)).connect(L.out); },
    white(L) { L.src('white').connect(L.f('lowpass', 9000)).connect(L.g(0.2)).connect(L.out); },
    pink(L) { L.src('pink').connect(L.g(0.6)).connect(L.out); },
    plane(L) { // cabin roar, airflow, vent hiss, engine hum and a rare seatbelt chime
      const lp = L.f('lowpass', 520); L.src('brown').connect(lp).connect(L.g(0.9)).connect(L.out); L.lfo(0.03, 60, lp.frequency);
      L.src('pink').connect(L.f('bandpass', 260, 0.8)).connect(L.g(0.35)).connect(L.out);
      L.src('white').connect(L.f('highpass', 2500)).connect(L.f('lowpass', 5000)).connect(L.g(0.015)).connect(L.out);
      const hg = L.g(0.012); L.osc('sawtooth', 96).connect(L.f('lowpass', 240)).connect(hg).connect(L.out); L.lfo(0.11, 0.004, hg.gain);
      L.loop(() => { const t0 = ctx.currentTime; blip(L.out, { f: 1046.5, t0, dur: 1.6, peak: 0.025 }); blip(L.out, { f: 784, t0: t0 + 0.55, dur: 1.8, peak: 0.02 }); }, 90000, 200000);
    },
    train(L) { // rumble plus the clack-clack of rail joints
      L.src('brown').connect(L.f('lowpass', 380)).connect(L.g(0.8)).connect(L.out);
      L.src('pink').connect(L.f('bandpass', 700, 0.7)).connect(L.g(0.08)).connect(L.out);
      const clack = t0 => [0, 0.12].forEach((d, k) => {
        burst(L.out, { type: 'brown', t0: t0 + d, attack: 0.002, decay: 0.14, peak: 0.55 - k * 0.15, filter: 'lowpass', freq: 600 });
        burst(L.out, { t0: t0 + d, attack: 0.001, decay: 0.03, peak: 0.05, filter: 'bandpass', freq: 2400, q: 2 });
      });
      L.every(() => { const t0 = ctx.currentTime + 0.02; clack(t0); clack(t0 + 0.45); }, 1450);
    },
    cafe(L) { // murmuring voices and the odd cup or spoon
      for (let k = 0; k < 4; k++) { const bp = L.f('bandpass', rnd(350, 1100), 1.2), g = L.g(0.05); L.src('pink').connect(bp).connect(g).connect(L.out); L.lfo(rnd(2.5, 5.5), 0.04, g.gain); L.lfo(rnd(0.05, 0.2), 150, bp.frequency); }
      L.src('brown').connect(L.f('lowpass', 250)).connect(L.g(0.2)).connect(L.out);
      L.loop(() => { const t0 = ctx.currentTime, f = rnd(2600, 4200), pan = rnd(-0.7, 0.7); blip(L.out, { f, t0, dur: rnd(0.15, 0.35), peak: rnd(0.015, 0.035), attack: 0.001, pan }); blip(L.out, { f: f * 2.4, t0, dur: 0.1, peak: 0.01, attack: 0.001, pan }); }, 700, 3500);
    },
  };
  const natureLayers = {};
  function syncNature() {
    if (!ctx) return;
    const want = playing ? S.audio.nature : {};
    for (const k of Object.keys(natureLayers)) if (!(k in want)) { const L = natureLayers[k]; L.out.gain.setTargetAtTime(0, ctx.currentTime, 0.3); setTimeout(() => L.stop(), 1500); delete natureLayers[k]; }
    for (const [k, v] of Object.entries(want)) {
      if (!NATURE_BUILD[k]) continue;
      if (!natureLayers[k]) { const L = layer(natureBus); L.out.gain.value = 0; NATURE_BUILD[k](L); natureLayers[k] = L; }
      natureLayers[k].out.gain.setTargetAtTime(v * v * 1.2, ctx.currentTime, 0.6);
    }
  }

  /* ---------- Instruments ---------- */
  function voice(o, t0, { f, type = 'sine', peak, attack = 0.005, decay = 1, sustain = 0, hold = 0, release = 0.3, cut = 0, wet = 0.2, detune = 0 }) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.value = f; osc.detune.value = detune;
    let node = osc;
    if (cut) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; node = osc.connect(lp); }
    node.connect(g);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + attack);
    const end = t0 + attack + decay + hold;
    if (sustain) { g.gain.setTargetAtTime(peak * sustain, t0 + attack, decay / 3); g.gain.setValueAtTime(peak * sustain, end); g.gain.linearRampToValueAtTime(0, end + release); }
    else g.gain.exponentialRampToValueAtTime(0.0005, end);
    g.connect(o.dry);
    if (wet) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w).connect(o.wet); }
    osc.start(t0); osc.stop(end + release + 0.1);
  }
  const I = {
    piano(o, t0, m, vel = 0.5, len = 2.6) {
      const f = mtof(m);
      voice(o, t0, { f, type: 'triangle', peak: 0.16 * vel, decay: len, cut: Math.min(7000, f * 5), wet: 0.3 });
      voice(o, t0, { f: f * 2, peak: 0.04 * vel, decay: len * 0.5, wet: 0.3 });
    },
    epiano(o, t0, m, vel = 0.5, len = 1.6) {
      const f = mtof(m);
      voice(o, t0, { f, peak: 0.1 * vel, attack: 0.01, decay: 0.6, sustain: 0.45, hold: len, release: 0.5, wet: 0.25, detune: 4 });
      voice(o, t0, { f: f * 2, peak: 0.025 * vel, attack: 0.005, decay: 0.3, wet: 0.2 });
    },
    bell(o, t0, m, vel = 0.5) {
      const f = mtof(m);
      voice(o, t0, { f, peak: 0.07 * vel, attack: 0.002, decay: 2.4, wet: 0.7 });
      voice(o, t0, { f: f * 2.76, peak: 0.025 * vel, attack: 0.002, decay: 1.2, wet: 0.7 });
    },
    pad(o, t0, ms, len, vol = 0.05, bright = 900, attack = 1.4) {
      ms.forEach(m => [-7, 7].forEach(d => voice(o, t0, { f: mtof(m), type: 'sawtooth', peak: vol, attack, decay: 0.5, sustain: 0.9, hold: len, release: 1.8, cut: bright, wet: 0.45, detune: d })));
    },
    bass(o, t0, m, len = 0.4, vel = 0.6) {
      const f = mtof(m);
      voice(o, t0, { f, type: 'sawtooth', peak: 0.09 * vel, attack: 0.005, decay: 0.15, sustain: 0.6, hold: len, release: 0.08, cut: 380, wet: 0 });
      voice(o, t0, { f, peak: 0.14 * vel, attack: 0.005, decay: 0.1, sustain: 0.8, hold: len, release: 0.08, wet: 0 });
    },
    synth(o, t0, m, len, vel, cut) {
      voice(o, t0, { f: mtof(m), type: 'sawtooth', peak: 0.05 * vel, attack: 0.003, decay: len, cut, wet: 0.25 });
    },
    kick(o, t0, vel = 0.9) {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.frequency.setValueAtTime(140, t0); osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.12);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.55 * vel, t0 + 0.003); g.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.42);
      osc.connect(g).connect(o.dry); osc.start(t0); osc.stop(t0 + 0.5);
    },
    snare(o, t0, vel = 0.7) {
      burst(o.dry, { t0, attack: 0.002, decay: 0.17, peak: 0.22 * vel, filter: 'highpass', freq: 1300 });
      voice(o, t0, { f: 190, type: 'triangle', peak: 0.1 * vel, decay: 0.09, wet: 0 });
      const w = ctx.createGain(); w.gain.value = 0.15; w.connect(o.wet);
      burst(w, { t0, attack: 0.002, decay: 0.2, peak: 0.2 * vel, filter: 'highpass', freq: 1500 });
    },
    hat(o, t0, vel = 0.4, open = false) { burst(o.dry, { t0, attack: 0.001, decay: open ? 0.22 : 0.04, peak: 0.12 * vel, filter: 'highpass', freq: 7200 }); },
    clap(o, t0, vel = 0.6) { [0, 0.012, 0.024].forEach(d => burst(o.dry, { t0: t0 + d, attack: 0.001, decay: d === 0.024 ? 0.15 : 0.012, peak: 0.18 * vel, filter: 'bandpass', freq: 1400, q: 1.2 })); },
    pluck(o, t0, m, vel = 0.5, cut = 3200) {
      const s = ctx.createBufferSource(); s.buffer = ksBuffer(m);
      // The string loop length is a whole number of samples (plus half a sample from the averaging filter), so retune it
      const N = Math.max(2, Math.round(ctx.sampleRate / mtof(m)));
      s.playbackRate.value = mtof(m) * (N + 0.5) / ctx.sampleRate;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; lp.Q.value = 0.5;
      const g = ctx.createGain(); g.gain.value = 0.35 * vel;
      s.connect(lp).connect(g); g.connect(o.dry);
      const w = ctx.createGain(); w.gain.value = 0.25; g.connect(w).connect(o.wet);
      s.start(t0);
    },
    ride(o, t0, vel = 0.4) { // soft, airy cymbal: two filtered noise layers, no tonal partials
      burst(o.dry, { t0, attack: 0.002, decay: 0.6, peak: 0.035 * vel, filter: 'bandpass', freq: 7400, q: 0.9 });
      burst(o.dry, { t0, attack: 0.001, decay: 0.08, peak: 0.03 * vel, filter: 'highpass', freq: 9000 });
    },
    brush(o, t0, vel = 0.4, len = 0.18) { burst(o.dry, { type: 'pink', t0, attack: 0.02, decay: len, peak: 0.12 * vel, filter: 'bandpass', freq: 3000, q: 0.6 }); },
    ubass(o, t0, m, len = 0.5, vel = 0.6) { // upright bass: round, plucked
      const f = mtof(m);
      voice(o, t0, { f, type: 'triangle', peak: 0.22 * vel, attack: 0.004, decay: len, cut: 650, wet: 0.05 });
      voice(o, t0, { f: f * 2, peak: 0.03 * vel, attack: 0.002, decay: 0.08, wet: 0 });
    },
    flute(o, t0, m, len, vel = 0.5) { // breathy bamboo-flute lead: scoop up, delayed vibrato
      const f = mtof(m), osc = ctx.createOscillator(), g = ctx.createGain(), vib = ctx.createOscillator(), vg = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(f * 0.97, t0); osc.frequency.linearRampToValueAtTime(f, t0 + 0.08);
      vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, t0); vg.gain.linearRampToValueAtTime(f * 0.012, t0 + len * 0.6);
      vib.connect(vg).connect(osc.frequency);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.055 * vel, t0 + 0.06); g.gain.setValueAtTime(0.055 * vel, t0 + len); g.gain.linearRampToValueAtTime(0, t0 + len + 0.25);
      osc.connect(g); g.connect(o.dry); const w = ctx.createGain(); w.gain.value = 0.45; g.connect(w).connect(o.wet);
      osc.start(t0); vib.start(t0); osc.stop(t0 + len + 0.35); vib.stop(t0 + len + 0.35);
      burst(o.dry, { t0, attack: 0.03, decay: len * 0.5, peak: 0.01 * vel, filter: 'bandpass', freq: f * 2, q: 3 });
    },
    timpani(o, t0, m, vel = 0.6) {
      const osc = ctx.createOscillator(), g = ctx.createGain(), f = mtof(m);
      osc.frequency.setValueAtTime(f * 1.04, t0); osc.frequency.exponentialRampToValueAtTime(f, t0 + 0.2);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.3 * vel, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t0 + 2);
      osc.connect(g); g.connect(o.dry); const w = ctx.createGain(); w.gain.value = 0.5; g.connect(w).connect(o.wet);
      osc.start(t0); osc.stop(t0 + 2.1);
      burst(o.dry, { type: 'brown', t0, attack: 0.005, decay: 0.6, peak: 0.25 * vel, filter: 'lowpass', freq: 220 });
    },
  };
  const ksCache = {};
  function ksBuffer(m) {
    if (ksCache[m]) return ksCache[m];
    const sr = ctx.sampleRate, f = mtof(m), len = Math.floor(sr * 2.4), N = Math.max(2, Math.round(sr / f));
    const b = ctx.createBuffer(1, len, sr), d = b.getChannelData(0), ring = new Float32Array(N);
    let prev = 0;
    for (let i = 0; i < N; i++) { const w = Math.random() * 2 - 1; prev = prev * 0.5 + w * 0.5; ring[i] = prev; }
    let idx = 0;
    for (let i = 0; i < len; i++) { const v = ring[idx], nx = ring[(idx + 1) % N]; ring[idx] = (v + nx) * 0.5 * 0.9965; d[i] = v; idx = (idx + 1) % N; }
    return (ksCache[m] = b);
  }

  /* ---------- Music theory ---------- */
  const SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], pentaMin: [0, 3, 5, 7, 10], pentaMaj: [0, 2, 4, 7, 9] };
  const deg = (root, sc, d) => root + sc[((d % sc.length) + sc.length) % sc.length] + 12 * Math.floor(d / sc.length);
  const chord = (root, sc, d, size = 3) => Array.from({ length: size }, (_, i) => deg(root, sc, d + i * 2));

  /* ---------- Genres (each schedules notes on a 16-step grid) ---------- */
  const GEN = {
    drone(p) {
      const root = pick([45, 47, 48, 50]), sc = pick([SCALES.minor, SCALES.dorian]), prog = pick([[0, 5, 3, 6], [0, 3, 4, 0], [0, 5, 2, 4]]);
      let sub = null;
      return {
        bpm: 60, tone: 3000 + p.int * 3000,
        start(o, t0) { sub = ctx.createOscillator(); sub.frequency.value = mtof(root - 12); const g = ctx.createGain(); g.gain.value = 0.05; sub.connect(g).connect(o.dry); sub.start(t0); },
        stop() { try { sub.stop(); } catch (e) {} },
        step(i, t0, spb) {
          if (i % 32 === 0) { const c = prog[(i / 32) % prog.length]; I.pad({ dry: o().dry, wet: o().wet }, t0, [deg(root, sc, c), deg(root, sc, c + 4), deg(root, sc, c + 7), deg(root, sc, c + 9)], spb * 32 + 1, 0.035, 700 + p.int * 900, 2.5); }
          if (i % 8 === 0 && Math.random() < 0.08 + p.int * 0.12) I.bell(o(), t0, deg(root + 24, SCALES.pentaMin, Math.floor(rnd(0, 7))), 0.35);
        },
      };
    },
    atmospheric(p) {
      const root = pick([48, 50, 52, 53]), prog = pick([[0, 3, 4, 3], [0, 5, 3, 4]]);
      return {
        bpm: 70, tone: 6000,
        step(i, t0, spb) {
          if (i % 32 === 0) I.pad(o(), t0, chord(root, SCALES.major, prog[(i / 32) % prog.length], 4).map(m => m + 12), spb * 32 + 1, 0.03, 1400, 2);
          if (i % 2 === 0 && Math.random() < 0.15 + p.int * 0.2) I.bell(o(), t0, deg(root + 24, SCALES.pentaMaj, Math.floor(rnd(0, 8))), rnd(0.25, 0.5));
        },
      };
    },
    piano(p) {
      const minor = Math.random() < 0.5, sc = minor ? SCALES.minor : SCALES.major, root = pick([48, 50, 52, 53, 55]);
      const prog = minor ? pick([[0, 5, 2, 6], [0, 3, 5, 4]]) : pick([[0, 4, 5, 3], [0, 5, 3, 4], [3, 4, 0, 5]]);
      let mel = 7;
      return {
        bpm: 72 + p.int * 18, tone: 9000,
        step(i, t0, spb) {
          const bar = Math.floor(i / 16), c = prog[bar % prog.length], s = i % 16;
          if (s === 0) { I.piano(o(), t0, deg(root - 12, sc, c), 0.5, 3.5); I.piano(o(), t0 + 0.02, deg(root - 12, sc, c + 4), 0.35, 3.2); }
          if (s === 8 && Math.random() < 0.6) I.piano(o(), t0, deg(root, sc, c + 2), 0.3, 2.5);
          if (s % 2 === 0 && Math.random() < 0.3 + p.int * 0.3) {
            mel = clamp(mel + pick([-2, -1, -1, 0, 1, 1, 2]), 2, 12);
            const near = [c, c + 2, c + 4, c + 7, c + 9];
            const d = Math.random() < 0.6 ? near.reduce((a, b) => Math.abs(b - mel) < Math.abs(a - mel) ? b : a) : mel;
            I.piano(o(), t0, deg(root + 12, sc, d), rnd(0.28, 0.5), 2.2);
          }
        },
      };
    },
    lofi(p) {
      const root = pick([50, 52, 53, 55]), prog = pick([[1, 4, 0, 5], [0, 5, 3, 4], [3, 2, 1, 4]]);
      let hiss = null;
      return {
        bpm: 74 + p.int * 12, swing: 0.18, tone: 2300,
        start(oo, t0) {
          hiss = ctx.createBufferSource(); hiss.buffer = noise('white'); hiss.loop = true;
          const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3500; f.Q.value = 0.5; const g = ctx.createGain(); g.gain.value = 0.012;
          hiss.connect(f).connect(g).connect(oo.dry); hiss.start(t0);
        },
        stop() { try { hiss.stop(); } catch (e) {} },
        step(i, t0, spb) {
          const s = i % 16, bar = Math.floor(i / 16), c = prog[bar % prog.length];
          if (s === 0 || s === 10 || (s === 7 && Math.random() < 0.4)) I.kick(o(), t0, s === 0 ? 0.8 : 0.6);
          if (s === 4 || s === 12) I.snare(o(), t0, 0.5);
          if (s % 2 === 0) I.hat(o(), t0, s % 4 === 0 ? 0.45 : 0.25);
          else if (Math.random() < 0.12 * p.int) I.hat(o(), t0, 0.15);
          if (s === 0) chord(root, SCALES.major, c, 4).forEach((m, k) => I.epiano(o(), t0 + k * 0.012, m, 0.45, spb * 14));
          if (s === 0 || s === 10) I.bass(o(), t0, deg(root - 24, SCALES.major, c), spb * 5, 0.6);
          if (s % 2 === 0 && Math.random() < 0.08 + p.int * 0.08) I.epiano(o(), t0, deg(root + 12, SCALES.pentaMaj, Math.floor(rnd(0, 6))), 0.3, spb * 3);
          if (Math.random() < 0.08) burst(o().dry, { t0, attack: 0.001, decay: 0.015, peak: 0.05, filter: 'highpass', freq: 2000 });
        },
      };
    },
    // Chill jazz ballad (late-night café): soft brushes, upright bass in "two" (root and fifth),
    // warm Rhodes chords held for the bar with rootless 9th voicings, and a sparse, stepwise melody.
    jazz(p) {
      const root = pick([50, 51, 53, 55]), sc = SCALES.major;
      const prog = pick([[0, 5, 1, 4], [1, 4, 0, 0], [0, 3, 1, 4], [2, 5, 1, 4]]); // Imaj7 vi7 ii7 V7 and friends
      let mel = 5, rest = 0;
      return {
        bpm: 66 + p.int * 12, swing: 0.28, tone: 4200,
        step(i, t0, spb) {
          const s = i % 16, bar = Math.floor(i / 16), c = prog[bar % prog.length];
          if (s === 0) I.brush(o(), t0, 0.3, spb * 7);
          if (s === 8) I.brush(o(), t0, 0.25, spb * 7);
          if (s === 4 || s === 12) I.brush(o(), t0, 0.55, 0.12);
          if (s % 4 === 0 || s === 14) I.ride(o(), t0, s % 8 === 4 ? 0.35 : 0.22);
          const rb = deg(root - 12, sc, c), f5 = deg(root - 12, sc, c + 4);
          if (s === 0) I.ubass(o(), t0, rb, spb * 7, 0.8);
          if (s === 8) I.ubass(o(), t0, f5 - rb > 7 ? f5 - 12 : f5, spb * 6, 0.65);
          if (s === 0) chord(root, sc, c, 5).slice(1).forEach((m, k) => I.epiano(o(), t0 + k * 0.03, m, 0.32, spb * 13));
          if (s === 10 && Math.random() < 0.35) chord(root, sc, c, 5).slice(2).forEach((m, k) => I.epiano(o(), t0 + k * 0.02, m, 0.18, spb * 4));
          if (rest > 0) { rest--; return; }
          if (s % 2 === 0 && Math.random() < 0.14 + p.int * 0.12) { // melody moves by step, then breathes
            mel = clamp(mel + pick([-1, -1, 1, 1, 2, -2]), 2, 11);
            const near = [c, c + 2, c + 4, c + 6].reduce((a, b) => Math.abs(b - mel) < Math.abs(a - mel) ? b : a);
            I.epiano(o(), t0, deg(root + 12, sc, s % 8 === 0 ? near : mel), rnd(0.22, 0.34), spb * pick([2, 3, 4]));
            if (Math.random() < 0.3) rest = 6;
          }
        },
      };
    },
    // Zen jazz-hop (in the spirit of Nujabes): swung boom-bap, minor-9 piano chords, upright bass,
    // and a bamboo flute or koto-like pluck playing a Japanese pentatonic scale over vinyl crackle.
    jazzhop(p) {
      const root = pick([45, 47, 50, 52]), sc = SCALES.dorian, prog = pick([[0, 3, 5, 4], [0, 5, 3, 6], [3, 2, 0, 0], [0, 4, 3, 1]]);
      const asian = pick([[0, 2, 3, 7, 8], [0, 1, 5, 7, 10], [0, 3, 5, 7, 10]]); // hirajoshi, in-sen, minor pentatonic
      const lead = Math.random() < 0.55 ? 'flute' : 'koto';
      let hiss = null, li = 2;
      return {
        bpm: 86 + p.int * 8, swing: 0.22, tone: 3400,
        start(oo, t0) {
          hiss = ctx.createBufferSource(); hiss.buffer = noise('white'); hiss.loop = true;
          const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 0.6; const g = ctx.createGain(); g.gain.value = 0.014;
          hiss.connect(f).connect(g).connect(oo.dry); hiss.start(t0);
        },
        stop() { try { hiss.stop(); } catch (e) {} },
        step(i, t0, spb) {
          const s = i % 16, bar = Math.floor(i / 16), c = prog[bar % prog.length];
          if (s === 0 || s === 10 || (s === 3 && Math.random() < 0.4) || (s === 8 && bar % 2 === 1)) I.kick(o(), t0, s === 0 ? 0.85 : 0.6);
          if (s === 4 || s === 12) { I.snare(o(), t0, 0.5); if (Math.random() < 0.4) I.brush(o(), t0, 0.5, 0.25); }
          if (s % 2 === 0) I.hat(o(), t0, s % 4 === 0 ? 0.32 : 0.2); else if (Math.random() < 0.18) I.hat(o(), t0, 0.1);
          if (s === 0) {
            I.piano(o(), t0, deg(root - 12, sc, c), 0.36, spb * 14);
            chord(root, sc, c + 2, 4).forEach((m, k) => I.piano(o(), t0 + 0.02 + k * 0.022, m, 0.27, spb * 12));
          }
          if (s === 10 && Math.random() < 0.45) chord(root, sc, c + 2, 4).forEach((m, k) => I.epiano(o(), t0 + k * 0.015, m, 0.22, spb * 4));
          if (s === 0 || s === 7 || (s === 10 && Math.random() < 0.6)) I.ubass(o(), t0, deg(root - 24, sc, c) + (s === 7 ? 12 : 0), spb * 3, 0.7);
          const phrase = bar % 4 >= 2; // the lead answers every other pair of bars
          if (phrase && s % 2 === 0 && Math.random() < 0.22 + p.int * 0.18) {
            li = clamp(li + pick([-2, -1, 1, 1, 2]), 0, 9);
            const m = root + 12 + asian[li % 5] + 12 * Math.floor(li / 5);
            if (lead === 'flute') I.flute(o(), t0, m, spb * pick([2, 3, 4, 6]), 0.6); else I.pluck(o(), t0, m + 12, 0.5);
          }
          if (Math.random() < 0.1) burst(o().dry, { t0, attack: 0.001, decay: 0.012, peak: 0.05, filter: 'highpass', freq: 2200 });
        },
      };
    },
    // Japanese zen, no beat: a soft drone, sparse koto plucks and long shakuhachi phrases on a pentatonic scale
    zen(p) {
      const root = pick([50, 52, 55]), sc = pick([[0, 2, 3, 7, 8], [0, 1, 5, 7, 10]]);
      let li = 3, rest = 0, sub = null;
      const note = (k, oct = 0) => root + sc[((k % 5) + 5) % 5] + 12 * (Math.floor(k / 5) + oct);
      return {
        bpm: 60, tone: 5000,
        start(o, t0) { sub = ctx.createOscillator(); sub.frequency.value = mtof(root - 12); const g = ctx.createGain(); g.gain.value = 0.03; sub.connect(g).connect(o.dry); sub.start(t0); },
        stop() { try { sub.stop(); } catch (e) {} },
        step(i, t0, spb) {
          if (i % 64 === 0) I.pad(o(), t0, [root - 12, root - 5, root + sc[2]], spb * 64 + 2, 0.018, 600, 4);
          if (i % 4 === 0 && Math.random() < 0.18 + p.int * 0.1) { // koto: a pluck, sometimes a quick grace note first
            const m = note(Math.floor(rnd(0, 10)), 1);
            if (Math.random() < 0.3) I.pluck(o(), t0, m + 2, 0.25, 3000);
            I.pluck(o(), t0 + (Math.random() < 0.3 ? 0.07 : 0), m, 0.45, 3000);
          }
          if (rest > 0) { rest--; return; }
          if (i % 8 === 0 && Math.random() < 0.35) { // shakuhachi phrase note
            li = clamp(li + pick([-2, -1, 1, 2]), 0, 9);
            I.flute(o(), t0, note(li), spb * pick([6, 8, 12]), 0.55);
            if (Math.random() < 0.4) rest = 16;
          }
        },
      };
    },
    // Medieval tavern in 6/8 (12 steps per bar): lute arpeggios, a harp run now and then, a wooden flute, frame drum and tambourine
    tavern(p) {
      const root = pick([50, 52, 55]), sc = pick([SCALES.dorian, [0, 2, 4, 5, 7, 9, 10]]), prog = pick([[0, 6, 0, 4], [0, 3, 6, 0], [0, 4, 6, 0]]);
      let li = 4;
      return {
        bpm: 150 + p.int * 20, swing: 0, tone: 6500,
        step(i, t0, spb) {
          const s = i % 12, bar = Math.floor(i / 12), c = prog[bar % prog.length], ch = chord(root, sc, c, 3);
          if (s === 0 || s === 6) I.timpani(o(), t0, deg(root - 24, sc, c), s === 0 ? 0.35 : 0.22);
          if (s === 3 || s === 9 || (s === 11 && Math.random() < 0.4)) burst(o().dry, { t0, attack: 0.002, decay: 0.12, peak: 0.05, filter: 'bandpass', freq: 7000, q: 1.5 }); // tambourine
          const arp = [0, 1, 2, 1, 2, 1][s % 6], m = ch[arp] + (s >= 6 && arp === 0 ? 12 : 0);
          if (s % 2 === 0) I.pluck(o(), t0, m, s % 6 === 0 ? 0.5 : 0.35, 2400);
          if (s === 0) I.pluck(o(), t0, deg(root - 12, sc, c), 0.55, 1400);
          if (s === 0 && bar % 4 === 3) [0, 1, 2, 3, 4, 5].forEach(k => I.pluck(o(), t0 + k * spb * 0.5, deg(root + 12, sc, c + k), 0.3, 4000)); // harp run
          if (bar % 2 === 1 && (s === 0 || s === 3 || s === 6 || s === 9) && Math.random() < 0.55 + p.int * 0.2) {
            li = clamp(li + pick([-2, -1, 1, 1, 2]), 0, 11);
            I.flute(o(), t0, deg(root + 12, sc, li), spb * pick([2, 3, 3, 5]), 0.5);
          }
        },
      };
    },
    // Synthwave: four-on-the-floor, gated snare, pulsing octave bass, wide detuned pads, a soft lead
    synthwave(p) {
      const root = pick([45, 47, 48, 50]), sc = SCALES.minor, prog = pick([[0, 5, 2, 6], [0, 5, 3, 4], [0, 3, 5, 6]]);
      let li = 4;
      return {
        bpm: 92 + p.int * 14, tone: 6000,
        step(i, t0, spb) {
          const s = i % 16, bar = Math.floor(i / 16), c = prog[bar % prog.length];
          if (s % 4 === 0) I.kick(o(), t0, 0.85);
          if (s === 4 || s === 12) { I.snare(o(), t0, 0.6); const w = { dry: o().wet, wet: o().wet }; I.snare(w, t0, 0.4); }
          if (s % 2 === 1) I.hat(o(), t0, 0.22);
          if (s % 2 === 0) I.synth(o(), t0, deg(root - 12, sc, c) + (s % 4 === 2 ? 12 : 0), spb * 1.6, 0.9, 900); // octave bass
          if (s === 0) I.pad(o(), t0, chord(root, sc, c, 4).map(m => m + 12), spb * 16, 0.022, 1800, 0.8);
          if (bar % 2 === 1 && s % 4 === 2 && Math.random() < 0.45 + p.int * 0.2) { li = clamp(li + pick([-2, -1, 1, 2]), 0, 10); I.synth(o(), t0, deg(root + 12, sc, li), spb * 3, 0.55, 2600); }
        },
      };
    },
    // 8-bit chiptune: square-wave arpeggios, triangle bass, noise drums, a bouncy square lead
    chiptune(p) {
      const root = pick([57, 60, 62]), sc = SCALES.major, prog = pick([[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4]]);
      let li = 4;
      const sq = (o, t0, m, len, vol, type = 'square') => voice(o, t0, { f: mtof(m), type, peak: vol, attack: 0.002, decay: 0.05, sustain: 0.7, hold: len, release: 0.03, cut: 5000, wet: 0.05 });
      return {
        bpm: 128 + p.int * 20, tone: 7000,
        step(i, t0, spb) {
          const s = i % 16, bar = Math.floor(i / 16), c = prog[bar % prog.length], ch = chord(root, sc, c, 3);
          if (s === 0 || s === 8 || s === 10) burst(o().dry, { type: 'white', t0, attack: 0.001, decay: 0.06, peak: 0.12, filter: 'lowpass', freq: 400 });
          if (s === 4 || s === 12) burst(o().dry, { t0, attack: 0.001, decay: 0.1, peak: 0.1, filter: 'bandpass', freq: 2500, q: 0.8 });
          if (s % 2 === 0) burst(o().dry, { t0, attack: 0.001, decay: 0.02, peak: 0.04, filter: 'highpass', freq: 8000 });
          sq(o(), t0, ch[s % 3] + 12, spb * 0.6, 0.018); // fast arpeggio
          if (s % 4 === 0) sq(o(), t0, deg(root - 24, sc, c) + (s % 8 === 4 ? 7 : 0), spb * 3, 0.07, 'triangle');
          if (s % 2 === 0 && Math.random() < 0.35 + p.int * 0.2) { li = clamp(li + pick([-2, -1, 1, 2]), 0, 9); sq(o(), t0, deg(root + 12, SCALES.pentaMaj, li), spb * pick([1, 2, 3]), 0.03); }
        },
      };
    },
    electronic(p) {
      const root = pick([45, 47, 48, 50]), sc = SCALES.minor, prog = pick([[0, 5, 2, 6], [0, 3, 5, 4]]);
      return {
        bpm: 116 + p.int * 10, tone: 8000,
        step(i, t0, spb) {
          const s = i % 16, bar = Math.floor(i / 16), c = prog[Math.floor(bar / 2) % prog.length];
          if (s % 4 === 0) I.kick(o(), t0, 0.95);
          if (s % 4 === 2) I.hat(o(), t0, 0.5, true);
          else if (p.int > 0.5) I.hat(o(), t0, 0.18);
          if ((s === 4 || s === 12) && p.int > 0.4) I.clap(o(), t0, 0.5);
          if (s % 4 === 2) I.bass(o(), t0, deg(root - 12, sc, c), spb * 1.6, 0.7);
          const ch = chord(root + 12, sc, c, 4), cut = 900 + 2400 * (0.5 + 0.5 * Math.sin(i / 32));
          I.synth(o(), t0, ch[s % 4] + (s % 8 >= 4 ? 12 : 0), spb * 0.9, 0.6, cut);
          if (i % 32 === 0) I.pad(o(), t0, chord(root, sc, c, 3).map(m => m + 12), spb * 32, 0.018, 1200, 1);
        },
      };
    },
    grooves(p) {
      const root = pick([45, 47, 48, 50]), sc = SCALES.dorian, prog = [0, 0, 3, 4];
      const bassPat = [[0, 0], [3, 0], [6, 7], [8, 4], [11, 0], [14, 6]];
      return {
        bpm: 96 + p.int * 8, swing: 0.08, tone: 7000,
        step(i, t0, spb) {
          const s = i % 16, bar = Math.floor(i / 16), c = prog[bar % prog.length];
          if (s === 0 || s === 7 || s === 10) I.kick(o(), t0, 0.85);
          if (s === 4 || s === 12) I.snare(o(), t0, 0.65);
          if (s === 14 && Math.random() < 0.35) I.snare(o(), t0, 0.2);
          I.hat(o(), t0, s % 4 === 2 ? 0.5 : 0.2);
          const bp = bassPat.find(b => b[0] === s);
          if (bp) I.bass(o(), t0, deg(root - 12, sc, c + bp[1]), spb * 1.4, 0.75);
          if (s === 2 || s === 10 || (s === 7 && p.int > 0.5)) chord(root + 12, sc, c, 4).forEach(m => I.epiano(o(), t0, m, 0.35, spb * 0.8));
        },
      };
    },
    cinematic(p) {
      const root = pick([45, 47, 48]), sc = SCALES.minor, prog = pick([[0, 5, 2, 6], [0, 5, 3, 4]]);
      return {
        bpm: 64, tone: 5000,
        step(i, t0, spb) {
          const s = i % 16, bar = Math.floor(i / 16), c = prog[bar % prog.length];
          if (s === 0) I.pad(o(), t0, [deg(root - 12, sc, c), deg(root, sc, c), deg(root, sc, c + 4), deg(root + 12, sc, c + 2)], spb * 16, 0.035, 1100, 2.4);
          if (s === 0 && bar % 4 === 0 && Math.random() < 0.4 + p.int * 0.5) I.timpani(o(), t0, deg(root - 12, sc, c), 0.7);
          if ((s === 0 || s === 8) && Math.random() < 0.5) I.piano(o(), t0, deg(root - 12, sc, c), 0.4, 4);
          if (s === 0 && bar % 2 === 1 && Math.random() < 0.5) [0, 1, 2].forEach(k => I.bell(o(), t0 + k * spb * 2, deg(root + 24, SCALES.pentaMin, 4 - k), 0.35));
        },
      };
    },
    // Fingerpicked guitar: alternating thumb on root and fifth, fingers rolling the triad on the off-beats,
    // a soft pad underneath and an occasional melody note. Plucks are low-passed so they stay warm.
    acoustic(p) {
      const root = pick([50, 52, 55, 57]), sc = SCALES.major, prog = pick([[0, 5, 3, 4], [0, 3, 0, 4], [5, 3, 0, 4], [0, 4, 5, 3]]);
      const roll = [1, 2, 3, 2];
      return {
        bpm: 74 + p.int * 10, swing: 0.06, tone: 6500,
        step(i, t0, spb) {
          const s = i % 16, bar = Math.floor(i / 16), c = prog[bar % prog.length];
          const tri = chord(root, sc, c, 3), bass = deg(root - 12, sc, c), fifth = deg(root - 12, sc, c + 4) - (deg(root - 12, sc, c + 4) - bass > 7 ? 12 : 0);
          if (s === 0 || s === 8) I.pluck(o(), t0, bass, s === 0 ? 0.6 : 0.5, 1600);
          if (s === 4 || s === 12) I.pluck(o(), t0, fifth, 0.42, 1600);
          if (s % 4 === 2) { const k = roll[(s >> 2) % 4], m = k === 3 ? tri[0] + 12 : tri[k]; I.pluck(o(), t0 + rnd(0, 0.012), m, 0.32, 2600); }
          if (s === 0) I.pad(o(), t0, tri, spb * 15, 0.01, 700, 1.2);
          if ((s === 6 || s === 14) && bar % 2 === 1 && Math.random() < 0.25 + p.int * 0.2) I.pluck(o(), t0, deg(root + 12, SCALES.pentaMaj, Math.floor(rnd(0, 5))), 0.3, 3200);
          if (s % 2 === 0) burst(o().dry, { t0, attack: 0.004, decay: 0.05, peak: s % 4 === 2 ? 0.018 : 0.01, filter: 'bandpass', freq: 5200, q: 1.2 }); // shaker
        },
      };
    },
  };

  /* ---------- Music runner ---------- */
  let run = null; // { gen, out, timer, next, i, mediaEl }
  const o = () => run.out;
  function musicStart(genre, params) {
    musicStop();
    if (!ctx || genre === 'none') return;
    const dry = ctx.createGain(); dry.gain.value = 0; dry.connect(musicBus);
    const wet = ctx.createGain(); wet.connect(revIn);
    dry.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
    run = { out: { dry, wet }, i: 0 };
    if (genre === 'mine') { playMine(); return; }
    const gen = GEN[genre](params);
    run.gen = gen;
    musicTone.frequency.setTargetAtTime(gen.tone || 9000, ctx.currentTime, 0.5);
    const bpm = gen.bpm * (params.tempo || 1);
    run.next = ctx.currentTime + 0.15;
    if (gen.start) gen.start(run.out, run.next);
    const r = run;
    r.timer = setInterval(() => {
      const spb = 60 / bpm / 4;
      while (r.next < ctx.currentTime + 0.2) {
        const swing = gen.swing && r.i % 2 === 1 ? spb * gen.swing * 2 : 0;
        try { gen.step(r.i, r.next + swing, spb); } catch (e) { console.error(e); }
        r.next += spb; r.i++;
      }
    }, 40);
  }
  function musicStop() {
    if (!run) return;
    const r = run; run = null;
    clearInterval(r.timer);
    try { r.out.dry.gain.setTargetAtTime(0, ctx.currentTime, 0.4); } catch (e) {}
    setTimeout(() => {
      if (r.gen && r.gen.stop) r.gen.stop();
      if (r.mediaEl) { r.mediaEl.pause(); r.mediaEl.src = ''; }
      try { r.out.dry.disconnect(); r.out.wet.disconnect(); } catch (e) {}
    }, 2000);
  }

  /* ---------- "Your music": tracks stored in IndexedDB ---------- */
  const DB = {
    open() { return new Promise((res, rej) => { const r = indexedDB.open('merlins-lockin-audio', 1); r.onupgradeneeded = () => r.result.createObjectStore('tracks', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
    async tx(mode, fn) { const db = await DB.open(); return new Promise((res, rej) => { const tx = db.transaction('tracks', mode); const st = tx.objectStore('tracks'); const out = fn(st); tx.oncomplete = () => res(out && out.result !== undefined ? out.result : out); tx.onerror = () => rej(tx.error); }); },
    put: rec => DB.tx('readwrite', st => st.put(rec)),
    del: id => DB.tx('readwrite', st => st.delete(id)),
    all: () => DB.tx('readonly', st => st.getAll()),
  };
  let tracks = [];
  async function loadTracks() { try { tracks = (await DB.all()) || []; } catch (e) { tracks = []; } }
  function playMine() {
    const r = run;
    if (!tracks.length) { toast(t('mine_empty')); return; }
    const next = () => {
      if (run !== r) return;
      const tr = pick(tracks);
      const el = new Audio(URL.createObjectURL(tr.blob));
      el.crossOrigin = 'anonymous';
      try { ctx.createMediaElementSource(el).connect(r.out.dry); } catch (e) { return; }
      r.mediaEl = el; el.onended = next; el.play().catch(() => {});
      musicTone.frequency.setTargetAtTime(16000, ctx.currentTime, 0.5);
    };
    next();
  }

  /* ---------- Playback control ---------- */
  let playing = false, userStopped = false, override = null; // override: temporary mode for breaks
  function current() {
    const A = S.audio, mode = override ? override.mode : A.mode, sub = override ? override.sub : A.sub;
    const M = MODES[mode] || MODES.focus, def = M.subs[sub] || Object.values(M.subs)[0];
    const genre = override ? def[0] : A.genre;
    return { mode, sub, genre: A.music ? genre : 'none', int: def[1], rate: M.rate, tempo: mode === 'sleep' || mode === 'nap' ? 0.85 : mode === 'relax' || mode === 'meditate' ? 0.92 : 1 };
  }
  function applyLevels() {
    if (!ctx) return;
    const now = ctx.currentTime, cur = current();
    master.gain.setTargetAtTime(playing ? S.audio.master * S.audio.master : 0, now, playing ? 0.6 : 0.25);
    musicBus.gain.setTargetAtTime(S.audio.musicVol * S.audio.musicVol * 1.4, now, 0.2);
    const d = DEPTH[S.audio.neural] || 0;
    amLfo.frequency.setTargetAtTime(cur.rate, now, 0.2);
    amDepth.gain.setTargetAtTime(d / 2, now, 0.3);
    amGain.gain.setTargetAtTime(1 - d / 2, now, 0.3);
  }
  let lastKey = '';
  function play() {
    if (!ensure()) return;
    playing = true;
    const cur = current(), key = cur.genre + '|' + cur.mode + '|' + cur.sub;
    if (!run || key !== lastKey) { lastKey = key; musicStart(cur.genre, cur); }
    syncNature(); syncTone(); applyLevels(); renderDeck(); mediaSession();
    if (S.audio.mode === 'meditate' || S.audio.sub === 'guidedsleep') startBreath(false);
  }
  function stopAll() {
    playing = false; lastKey = '';
    if (ctx) { applyLevels(); setTimeout(() => { if (!playing) { musicStop(); syncNature(); syncTone(); } }, 900); }
    stopBreath(); renderDeck();
    setTimeout(sleepMedia, 1200);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  }
  function refresh() { if (playing) play(); else renderDeck(); }

  /* ---------- Continuous frequency (opt-in): pure tone, binaural beat or isochronic pulses ---------- */
  let tone = null;
  function toneStop() {
    if (!tone) return;
    const old = tone; tone = null;
    try { old.out.gain.setTargetAtTime(0, ctx.currentTime, 0.3); } catch (e) {}
    setTimeout(() => old.nodes.forEach(n => { try { if (n.stop) n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} }), 1500);
  }
  function syncTone() {
    const T = S.audio.tone;
    if (!ctx || !playing || !T || !T.on) { toneStop(); return; }
    const hz = clamp(+T.hz || 40, 1, 2000), key = hz + '|' + T.kind, level = T.vol * T.vol * 0.5;
    if (tone && tone.key === key) { tone.out.gain.setTargetAtTime(level, ctx.currentTime, 0.2); return; }
    toneStop();
    const nodes = [], g = ctx.createGain(); g.gain.value = 0; g.connect(master); nodes.push(g);
    const osc = f => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.start(); nodes.push(o); return o; };
    if (T.kind === 'binaural' && hz < 100) {
      // Left ear 200 Hz, right ear 200 + hz: the brain hears the difference (headphones needed)
      const merge = ctx.createChannelMerger(2); nodes.push(merge);
      osc(200).connect(merge, 0, 0); osc(200 + hz).connect(merge, 0, 1); merge.connect(g);
    } else if (T.kind === 'iso') {
      // An audible carrier switched on and off at the chosen rate, so it works on phone speakers
      const carrier = hz < 100 ? 220 : hz, rate = hz < 100 ? hz : 10;
      const am = ctx.createGain(); am.gain.value = 0.5; nodes.push(am);
      const lg = ctx.createGain(); lg.gain.value = 0.5; nodes.push(lg);
      osc(rate).connect(lg).connect(am.gain);
      osc(carrier).connect(am).connect(g);
    } else osc(hz).connect(g);
    g.gain.setTargetAtTime(level, ctx.currentTime, 0.4);
    tone = { nodes, out: g, key };
  }
  function mediaSession() {
    if (!('mediaSession' in navigator)) return;
    try {
      const sm = summary();
      navigator.mediaSession.metadata = new MediaMetadata({ title: sm.main, artist: 'MerlinsLockIN', album: sm.nat, artwork: [{ src: 'icon512.png', sizes: '512x512', type: 'image/png' }] });
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.setActionHandler('play', () => { userStopped = false; play(); });
      navigator.mediaSession.setActionHandler('pause', () => { userStopped = true; stopAll(); });
    } catch (e) {}
  }
  on('timer', () => { if (!ML.running()) setTimeout(sleepMedia, 1500); });
  ML.Audio = {
    play, stop: stopAll, get playing() { return playing; },
    // Sport section: upbeat electronic mix while a workout timer runs
    workout(onOff) { if (onOff) { override = { mode: 'focus', sub: 'motivation' }; userStopped = false; if (ensure()) play(); } else { override = null; stopAll(); } },
  };

  on('gesture', () => ensure());
  on('sound:toggle', () => { if (playing) { userStopped = true; stopAll(); } else { userStopped = false; override = null; play(); } });
  on('chime', () => {
    if (!ensure()) return;
    [523.25, 783.99, 1046.5, 1567.98].forEach((f, i) => blip(out, { type: i % 2 ? 'triangle' : 'sine', f, t0: ctx.currentTime + i * 0.16, dur: 1.8, peak: 0.18, attack: 0.015 }));
  });
  on('timer', () => {
    if (!S.audio.auto) return;
    const run_ = ML.running();
    if (run_ && S.mode === 'focus') { if (!userStopped || override) { override = null; userStopped = false; play(); } }
    else if (run_ && S.mode === 'break') {
      if (S.audio.breakRelax) { override = { mode: 'relax', sub: 'unwind' }; play(); }
      else if (playing && !sleepEnd) { override = null; stopAll(); }
    }
    else if (!run_ && playing && !sleepEnd) { override = null; stopAll(); }
    if (run_) userStopped = false;
  });
  on('mood', () => renderDeck());
  on('render', () => renderDeck());

  /* ---------- Sleep / nap timer ---------- */
  let sleepEnd = null, sleepTick = null;
  function startSleep() {
    const nap = S.audio.mode === 'nap';
    const mins = nap ? S.audio.napMins : S.audio.sleepMins;
    sleepEnd = Date.now() + mins * 60000;
    userStopped = false; override = null; play();
    clearInterval(sleepTick);
    sleepTick = setInterval(() => {
      const left = (sleepEnd - Date.now()) / 1000;
      const fade = Math.min(600, mins * 60 / 3);
      if (!nap && S.audio.sub !== 'sleepwake' && left < fade && ctx) master.gain.setTargetAtTime(Math.max(0, left / fade) * S.audio.master * S.audio.master, ctx.currentTime, 1);
      if (left <= 0) {
        const wake = nap || S.audio.sub === 'sleepwake';
        stopSleep(); stopAll();
        if (wake) wakeChimes(); else toast(t('sleep_done'));
      } else updateSleepLabel();
    }, 1000);
    renderDeck();
  }
  function stopSleep() { clearInterval(sleepTick); sleepTick = null; sleepEnd = null; renderDeck(); }
  function wakeChimes() {
    if (!ensure()) return;
    const scale = [72, 74, 76, 79, 81, 84];
    for (let i = 0; i < 24; i++) blip(out, { f: mtof(pick(scale) + (i > 12 ? 12 : 0)), t0: ctx.currentTime + i * 1.8, dur: 3, peak: 0.02 + i * 0.006, attack: 0.01 });
    toast(t('wake_up'), { ms: 8000 });
    ML.notify && ML.notify('MerlinsLockIN', t('wake_up'));
  }
  function updateSleepLabel() { const el = $('d-sleep-left'); if (el && sleepEnd) el.textContent = t('sleep_left', { m: MiniView.fmtClock((sleepEnd - Date.now()) / 1000) }); }

  /* ---------- Breathing guide ---------- */
  let breathT = null, breathOn = false;
  function startBreath(force) {
    if (breathOn && !force) return;
    breathOn = true; renderDeck();
    const pat = BREATHS[S.audio.breath] || BREATHS['478'];
    const phases = [['inhale', pat[0], 1], ['hold', pat[1], 1], ['exhale', pat[2], 0.55], ['hold', pat[3], 0.55]].filter(p => p[1] > 0);
    let k = 0;
    const stepB = () => {
      if (!breathOn) return;
      const [name, secs, scale] = phases[k % phases.length]; k++;
      const c = $('d-breath-circle'), l = $('d-breath-label');
      if (c) { c.style.transitionDuration = secs + 's'; c.style.transform = `scale(${scale})`; }
      if (l) l.textContent = t(name) + ' · ' + secs;
      if (S.audio.voice && 'speechSynthesis' in window) {
        try { const u = new SpeechSynthesisUtterance(t(name)); u.lang = ML.locale(); u.rate = 0.85; u.volume = 0.8; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
      }
      breathT = setTimeout(stepB, secs * 1000);
    };
    setTimeout(stepB, 50);
  }
  function stopBreath() { breathOn = false; clearTimeout(breathT); }

  /* ---------- Deck UI ---------- */
  let openGenreFam = null, openNatFam = null; // which family is unfolded in the mixer (null: the current one)
  const chipRow = (items, curVal, attr, labelFn, extra = () => '') => items.map(v => `<button type="button" class="chip-btn ${extra(v)}" data-${attr}="${v}" aria-pressed="${v === curVal}">${esc(labelFn(v))}</button>`).join('');
  function summary() {
    const cur = current(), A = S.audio;
    const nat = Object.keys(A.nature).map(k => t('n_' + k));
    return { main: (cur.genre === 'none' ? t('g_none') : t('g_' + cur.genre)) + ' · ' + t('sub_' + cur.sub), nat: nat.length ? '+ ' + nat.join(', ') : '' };
  }
  function renderDeck() {
    const el = $('sound-deck'); if (!el) return;
    const A = S.audio, sm = summary(), M = MODES[A.mode];
    const mm = MOOD_MIX[S.mood];
    const mmLabel = t('sub_' + mm.sub) + ' · ' + t('g_' + mm.genre) + Object.keys(mm.nature).map(k => ' + ' + t('n_' + k)).join('');
    const isSleep = A.mode === 'sleep' || A.mode === 'nap';
    const showBreath = A.mode === 'meditate' || A.sub === 'guidedsleep';
    const focused = document.activeElement && el.contains(document.activeElement) ? document.activeElement.id : null;
    const curFam = openGenreFam || famOf(GENRE_FAM, A.music ? A.genre : 'none') || 'calm';
    const curNatFam = openNatFam || famOf(NATURE_FAM, Object.keys(A.nature)[0]) || 'nature';
    el.innerHTML = `
      <div class="deck-head">
        <button type="button" class="deck-play ${playing ? 'on' : ''}" id="d-play" aria-label="${esc(playing ? t('stop') : t('play'))}">
          ${playing ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'}
        </button>
        <div class="deck-now"><span class="label">${esc(t('ambience'))}${playing ? ' <i class="eq"><b></b><b></b><b></b></i>' : ''}</span><b>${esc(sm.main)}</b><small>${esc(sm.nat)}</small></div>
        <button type="button" class="ghost small" id="d-open" aria-expanded="${A.open}">${esc(t('mixer'))} ${A.open ? '▴' : '▾'}</button>
      </div>
      ${A.open ? `<div class="deck-body">
        <div class="seg-toggle five" role="group">${Object.keys(MODES).map(k => `<button type="button" data-dmode="${k}" aria-pressed="${k === A.mode}">${esc(t('mode_' + k))}</button>`).join('')}</div>
        <div class="d-row"><span class="label">${esc(t('activity'))}</span><div class="chips">${chipRow(Object.keys(M.subs), A.sub, 'dsub', v => t('sub_' + v))}</div></div>
        <div class="d-row"><span class="label">${esc(t('genre'))}</span>
          <div class="chips fam-row">${Object.keys(GENRE_FAM).map(f => `<button type="button" class="chip-btn fam-chip ${f === curFam ? 'open' : ''} ${f === famOf(GENRE_FAM, A.music ? A.genre : 'none') ? 'has' : ''}" data-dgfam="${f}" aria-expanded="${f === curFam}">${esc(t('gf_' + f))}${GENRE_FAM[f].length > 1 ? ' ▾' : ''}</button>`).join('')}</div>
          ${GENRE_FAM[curFam].length > 1 ? `<div class="chips fam-items">${chipRow(GENRE_FAM[curFam], A.music ? A.genre : 'none', 'dgenre', v => t('g_' + v), v => v === M.subs[A.sub][0] ? 'suggested' : '')}</div>` : ''}</div>
        ${A.genre === 'mine' ? `<div class="d-mine"><p class="hint">${esc(t('mine_hint'))}</p>
          <ul>${tracks.length ? tracks.map(tr => `<li><span>${esc(tr.name)}</span><button type="button" class="icon-btn" data-dtrack="${tr.id}" aria-label="${esc(t('delete'))}">✕</button></li>`).join('') : `<li class="none">${esc(t('mine_empty'))}</li>`}</ul>
          <label class="file-btn small">${esc(t('mine_add'))}<input type="file" id="d-files" accept="audio/*" multiple></label></div>` : ''}
        <label class="d-slider"><span>${esc(t('music_vol'))}</span><input type="range" id="d-mvol" min="0" max="1" step="0.05" value="${A.musicVol}"></label>
        <div class="d-row"><span class="label">${esc(t('ambiences'))}</span>
          <div class="chips fam-row">${Object.keys(NATURE_FAM).map(f => { const n = NATURE_FAM[f].filter(k => k in A.nature).length; return `<button type="button" class="chip-btn fam-chip ${f === curNatFam ? 'open' : ''} ${n ? 'has' : ''}" data-dnfam="${f}" aria-expanded="${f === curNatFam}">${esc(t('nf_' + f))}${n ? ' · ' + n : ''} ▾</button>`; }).join('')}</div>
          <div class="nat-grid">${NATURE_FAM[curNatFam].map(k => `<button type="button" class="nat ${k in A.nature ? 'on' : ''}" data-dnat="${k}" aria-pressed="${k in A.nature}">${esc(t('n_' + k))}</button>`).join('')}</div>
          ${Object.keys(A.nature).length ? `<div class="nat-vols">${Object.entries(A.nature).map(([k, v]) => `<label class="d-slider"><span>${esc(t('n_' + k))}</span><input type="range" data-dnatv="${k}" min="0.05" max="1" step="0.05" value="${v}"></label>`).join('')}</div>` : ''}
        </div>
        <div class="d-row"><span class="label" title="${esc(t('neural_hint'))}">${esc(t('neural'))} ⓘ</span><div class="chips">${chipRow(Object.keys(DEPTH), A.neural, 'dneural', v => t('neural_' + v))}</div></div>
        <div class="d-row d-tone"><label class="opt"><input type="checkbox" id="d-tone" ${A.tone.on ? 'checked' : ''}> ${esc(t('tone_on'))}</label>
          ${A.tone.on ? `<div class="chips">${[40, 42, 432, 528].map(h => `<button type="button" class="chip-btn" data-dtone="${h}" aria-pressed="${+A.tone.hz === h}">${h} Hz</button>`).join('')}<label class="tone-hz"><input type="number" id="d-tone-hz" min="1" max="2000" value="${A.tone.hz}"> Hz</label></div>
            <div class="chips">${chipRow(['pure', 'binaural', 'iso'], A.tone.kind, 'dtonek', v => t('tone_' + v))}</div>
            <label class="d-slider"><span>${esc(t('tone_vol'))}</span><input type="range" id="d-tone-vol" min="0.05" max="1" step="0.05" value="${A.tone.vol}"></label>
            <p class="hint">${esc(t('tone_hint'))}</p>` : ''}</div>
        ${isSleep ? `<div class="d-row d-sleep"><span class="label">${esc(t('sleep_timer'))}</span><div class="chips">
            ${(A.mode === 'nap' ? [15, 20, 25, 30] : [15, 30, 45, 60, 90]).map(m => `<button type="button" class="chip-btn" data-dsleep="${m}" aria-pressed="${m === (A.mode === 'nap' ? A.napMins : A.sleepMins)}">${m} min</button>`).join('')}
            <button type="button" class="small primary" id="d-sleep-go">${esc(sleepEnd ? t('stop_sleep') : t('start_sleep'))}</button></div>
            <span class="mono" id="d-sleep-left"></span></div>` : ''}
        ${showBreath ? `<div class="d-row d-breath"><span class="label">${esc(t('breath'))}</span>
            <div class="breath-wrap"><div class="breath-circle" id="d-breath-circle"></div><span id="d-breath-label">${breathOn ? '' : '—'}</span></div>
            <div class="chips">${chipRow(Object.keys(BREATHS), A.breath, 'dbreath', v => t('breath_' + v))}</div>
            <div class="chips"><button type="button" class="small ${breathOn ? '' : 'primary'}" id="d-breath-go">${esc(breathOn ? t('breath_stop') : t('breath_start'))}</button>
            <label class="opt"><input type="checkbox" id="d-voice" ${A.voice ? 'checked' : ''}> ${esc(t('voice'))}</label></div></div>` : ''}
        <div class="opts">
          <label class="opt"><input type="checkbox" id="d-auto" ${A.auto ? 'checked' : ''}> ${esc(t('auto_sound'))}</label>
          <label class="opt"><input type="checkbox" id="d-brk" ${A.breakRelax ? 'checked' : ''}> ${esc(t('break_relax'))}</label>
        </div>
        <div class="d-row"><span class="label">${esc(t('presets'))}</span>
          <div class="chips">${A.presets.map(p => `<span class="preset"><button type="button" class="chip-btn" data-dpreset="${p.id}">${esc(p.name)}</button><button type="button" class="icon-btn" data-dpdel="${p.id}" aria-label="${esc(t('delete'))}">✕</button></span>`).join('')}</div>
          <form class="preset-form" id="d-pform"><input type="text" id="d-pname" maxlength="30" placeholder="${esc(t('preset_name_ph'))}"><button type="submit" class="small">${esc(t('preset_save'))}</button></form>
        </div>
        <p class="d-suggest">${esc(t('suggestion', { mix: mmLabel }))} <button type="button" class="link" id="d-suggest">${esc(t('apply'))}</button></p>
        <label class="d-slider"><span>${esc(t('master_vol'))}</span><input type="range" id="d-master" min="0" max="1" step="0.05" value="${A.master}"></label>
      </div>` : ''}`;
    if (focused && $(focused)) $(focused).focus();
    updateSleepLabel();
  }

  const deck = $('sound-deck');
  deck.addEventListener('click', e => {
    const A = S.audio, b = e.target.closest('button'); if (!b) return;
    ensure();
    if (b.id === 'd-play') { if (playing) { userStopped = true; stopAll(); } else { userStopped = false; override = null; play(); } return; }
    if (b.id === 'd-open') { A.open = !A.open; save(); renderDeck(); return; }
    if (b.dataset.dgfam) {
      const f = b.dataset.dgfam;
      if (GENRE_FAM[f].length === 1) { const g = GENRE_FAM[f][0]; openGenreFam = f; if (g === 'none') A.music = false; else { A.music = true; A.genre = g; } if (g === 'mine') loadTracks().then(renderDeck); save(); refresh(); return; }
      openGenreFam = f; renderDeck(); return;
    }
    if (b.dataset.dnfam) { openNatFam = b.dataset.dnfam; renderDeck(); return; }
    if (b.dataset.dmode) { A.mode = b.dataset.dmode; A.sub = Object.keys(MODES[A.mode].subs)[0]; A.genre = MODES[A.mode].subs[A.sub][0]; A.music = true; stopBreath(); }
    else if (b.dataset.dsub) { A.sub = b.dataset.dsub; A.genre = MODES[A.mode].subs[A.sub][0]; A.music = true; }
    else if (b.dataset.dgenre) { const g = b.dataset.dgenre; if (g === 'none') A.music = false; else { A.music = true; A.genre = g; } if (g === 'mine') loadTracks().then(renderDeck); }
    else if (b.dataset.dnat) { const k = b.dataset.dnat; if (k in A.nature) delete A.nature[k]; else A.nature[k] = 0.5; }
    else if (b.dataset.dneural) A.neural = b.dataset.dneural;
    else if (b.dataset.dtone) A.tone.hz = +b.dataset.dtone;
    else if (b.dataset.dtonek) A.tone.kind = b.dataset.dtonek;
    else if (b.dataset.dsleep) { if (A.mode === 'nap') A.napMins = +b.dataset.dsleep; else A.sleepMins = +b.dataset.dsleep; }
    else if (b.id === 'd-sleep-go') { sleepEnd ? (stopSleep(), stopAll()) : startSleep(); save(); return; }
    else if (b.dataset.dbreath) { A.breath = b.dataset.dbreath; if (breathOn) { stopBreath(); save(); startBreath(true); return; } }
    else if (b.id === 'd-breath-go') { breathOn ? (stopBreath(), renderDeck()) : startBreath(true); return; }
    else if (b.dataset.dpreset) {
      const p = A.presets.find(x => x.id === b.dataset.dpreset); if (!p) return;
      Object.assign(A, { mode: p.mode, sub: p.sub, genre: p.genre, music: p.music, nature: Object.assign({}, p.nature), neural: p.neural });
      toast(t('preset_applied', { name: p.name }));
    }
    else if (b.dataset.dpdel) A.presets = A.presets.filter(x => x.id !== b.dataset.dpdel);
    else if (b.id === 'd-suggest') { const m = MOOD_MIX[S.mood]; Object.assign(A, { mode: m.mode, sub: m.sub, genre: m.genre, music: true, nature: Object.assign({}, m.nature) }); }
    else if (b.dataset.dtrack) { DB.del(b.dataset.dtrack).then(loadTracks).then(renderDeck); return; }
    else return;
    save();
    if (!playing && (b.dataset.dnat || b.dataset.dgenre || b.dataset.dsub || b.dataset.dpreset || b.id === 'd-suggest') && A.auto && !(ML.running() && S.mode === 'focus')) toast(t('sound_tap'));
    refresh();
  });
  deck.addEventListener('input', e => {
    const A = S.audio, el = e.target;
    if (el.id === 'd-mvol') A.musicVol = +el.value;
    else if (el.id === 'd-master') A.master = +el.value;
    else if (el.id === 'd-tone-vol') A.tone.vol = +el.value;
    else if (el.dataset.dnatv) A.nature[el.dataset.dnatv] = +el.value;
    else return;
    save(); applyLevels(); syncTone(); if (el.dataset.dnatv) syncNature();
  });
  deck.addEventListener('change', e => {
    const A = S.audio, el = e.target;
    if (el.id === 'd-tone') { A.tone.on = el.checked; save(); if (A.tone.on && !playing) toast(t('sound_tap')); refresh(); return; }
    if (el.id === 'd-tone-hz') { A.tone.hz = clamp(Math.round(+el.value) || 40, 1, 2000); save(); refresh(); return; }
    if (el.id === 'd-auto') A.auto = el.checked;
    else if (el.id === 'd-brk') A.breakRelax = el.checked;
    else if (el.id === 'd-voice') A.voice = el.checked;
    else if (el.id === 'd-files') {
      const files = [...el.files];
      Promise.all(files.map(f => DB.put({ id: ML.uid(), name: f.name.replace(/\.[^.]+$/, ''), blob: f }))).then(loadTracks).then(() => { toast(t('mine_added', { n: files.length })); renderDeck(); if (playing) { lastKey = ''; play(); } }).catch(() => toast('IndexedDB error'));
      return;
    } else return;
    save();
  });
  deck.addEventListener('submit', e => {
    e.preventDefault();
    const name = ($('d-pname').value || '').trim(); if (!name) return;
    const A = S.audio;
    A.presets.push({ id: ML.uid(), name, mode: A.mode, sub: A.sub, genre: A.genre, music: A.music, nature: Object.assign({}, A.nature), neural: A.neural });
    save(); renderDeck(); toast(t('preset_saved', { name }));
  });

  /* ---------- Settings: sound test + diagnostic (helps debug phones) ---------- */
  ML.addStrings({
    fr: { set_sound: 'Son', snd_test: 'Tester le son', snd_hint: 'Si tu n’entends rien sur iPhone : monte le volume avec les boutons latéraux pendant que le son joue, et vérifie que le téléphone n’est pas en mode Bluetooth vers un autre appareil.', snd_diag: 'Diagnostic' },
    en: { set_sound: 'Sound', snd_test: 'Test the sound', snd_hint: 'If you hear nothing on iPhone: raise the volume with the side buttons while the sound plays, and check the phone isn’t sending audio to a Bluetooth device.', snd_diag: 'Diagnostic' },
  });
  function diag() {
    return [
      'AudioContext: ' + (ctx ? ctx.state : '—') + (ctx ? ' · ' + ctx.sampleRate + ' Hz' : ''),
      'Mobile: ' + (MOBILE ? 'yes' : 'no'),
      'audioSession: ' + (navigator.audioSession ? navigator.audioSession.type : 'n/a'),
      'Silent loop: ' + (!MOBILE ? 'n/a' : silentEl ? (silentEl.paused ? 'paused' : 'playing') : 'not started') + (silentErr ? ' (' + silentErr + ')' : ''),
      'Music playing: ' + (playing ? 'yes' : 'no'),
    ].join('\n');
  }
  // app.js (which owns the settings sheet) loads after this file, so register once everything is loaded
  on('loaded', () => ML.settingsSection({
    order: 23,
    render: () => `<h3>${esc(t('set_sound'))}</h3>
      <button type="button" class="small primary" id="snd-test">♪ ${esc(t('snd_test'))}</button>
      <p class="hint">${esc(t('snd_hint'))}</p>
      <details><summary class="label">${esc(t('snd_diag'))}</summary><pre class="diag" id="snd-diag"></pre></details>`,
    bind: r => {
      const show = () => { const el = r.querySelector('#snd-diag'); if (el) el.textContent = diag(); };
      show();
      r.querySelector('#snd-test').onclick = () => {
        ensure(); emit('chime');
        setTimeout(show, 400); setTimeout(show, 1500);
      };
    },
  }));

  loadTracks();
})();
