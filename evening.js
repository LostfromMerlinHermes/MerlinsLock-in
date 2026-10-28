// Evening light (3.40), chosen from proposals/soir/lumiere-du-soir.html (version 2, without the lamp).
// The day worlds follow the real sunset of the season: golden hour, the sun going down behind each world's own decor,
// the blue hour (no sun, an afterglow and the first stars), then a night sky until morning, and a soft dawn.
// Painted once a minute on a canvas under #fx, so each world's own decor (towers, karst, ...) stays in front of the sky.
// Optional: a warm eye-comfort filter over the whole app from sunset to sunrise.
(() => {
  'use strict';
  const { S, t, esc, save, on } = ML;
  const root = document.documentElement;

  ML.addStrings({
    fr: { set_evening: 'Lumière du soir', ev_filter: 'Filtre confort des yeux, le soir', ev_f_off: 'Non', ev_f_soft: 'Doux', ev_f_mid: 'Moyen', ev_dawn: 'Aube douce le matin',
      ev_hint: 'Les mondes de jour suivent le coucher du soleil de la saison. Le filtre réduit la lumière bleue du coucher au lever.' },
    en: { set_evening: 'Evening light', ev_filter: 'Eye-comfort filter in the evening', ev_f_off: 'Off', ev_f_soft: 'Soft', ev_f_mid: 'Medium', ev_dawn: 'Soft dawn in the morning',
      ev_hint: 'Day worlds follow the season’s sunset. The filter cuts blue light from sunset to sunrise.' },
  });
  ML.defaults(() => ({ evening: { filter: 'off', dawn: true } }));

  // Sunset and sunrise in local hours, close enough for mid-latitude Europe (DST included): ~17:00 in December, ~22:00 in June
  function sunTimes(d = new Date()) {
    const doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5), c = Math.cos(2 * Math.PI * (doy - 172) / 365);
    const set = 19.45 + 2.5 * c, noon = 13.4 + 0.5 * c;
    return { set, rise: 2 * noon - set };
  }
  const clamp = v => Math.max(0, Math.min(1, v));
  // where the evening stands: k = the sun going down (0..1), b = the blue hour (0..1), e = deeper night (0..1), dawn (0..1)
  function phase(d = new Date()) {
    const { set, rise } = sunTimes(d), m = d.getHours() + d.getMinutes() / 60;
    if (m < rise - 0.4) return { k: 1, b: 1, e: 1, dawn: 0, night: true };
    if (m < rise + 1) return { k: 0, b: 0, e: 0, dawn: m < rise ? clamp((m - (rise - 0.4)) / 0.4) : clamp(1 - (m - rise)), night: false };
    return { k: clamp((m - (set - 1)) / 1.33), b: clamp((m - (set + 0.25)) / 0.5), e: clamp((m - (set + 0.75)) / 0.75), dawn: 0, night: m >= set + 0.25 };
  }
  ML.eveningPhase = phase;

  // the worlds that get a sky: the four dark day worlds, and Washi
  const worldNow = () => { const th = root.dataset.theme, light = !!root.dataset.light;
    if (light) return th === 'sanctuary' ? 'washi' : null;
    return ['sanctuary', 'observatory', 'netrunner', 'arcade'].includes(th) ? th : null; };

  const cv = document.createElement('canvas');
  cv.id = 'dusk'; cv.setAttribute('aria-hidden', 'true');
  const veil = document.createElement('div');
  veil.id = 'eye-warm'; veil.setAttribute('aria-hidden', 'true');
  let lastKey = '';

  const rgb = (a, al) => `rgba(${a[0]},${a[1]},${a[2]},${al})`;
  function paintSunset(x, W, H, w, k) {
    const sky = stops => { const g = x.createLinearGradient(0, 0, 0, H); stops.forEach(([o, c, a]) => g.addColorStop(o, rgb(c, a))); x.fillStyle = g; x.fillRect(0, 0, W, H); };
    const glow = (gx, gy, r, c, a) => { const g = x.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, rgb(c, a)); g.addColorStop(1, rgb(c, 0)); x.fillStyle = g; x.fillRect(gx - r, gy - r, r * 2, r * 2); };
    const sun = (sx, sy, r, top, bot, a) => { const g = x.createLinearGradient(0, sy - r, 0, sy + r); g.addColorStop(0, rgb(top, a)); g.addColorStop(1, rgb(bot, a)); x.fillStyle = g; x.beginPath(); x.arc(sx, sy, r, 0, 6.29); x.fill(); };
    const M = Math.min(W, H);
    if (w === 'sanctuary') {
      // a violet evening, a rose-gold band on the horizon, the sun sinking behind soft hills
      sky([[0, [24, 22, 58], .55 * k], [.55, [60, 40, 90], .55 * k], [.82, [196, 110, 96], .55 * k], [1, [240, 170, 110], .55 * k]]);
      sun(W * .9, H * (.8 + .16 * k), M * .07, [255, 214, 150], [240, 120, 90], .6 * k);
      glow(W * .9, H * .9, Math.max(W, H) * .4, [255, 160, 110], .22 * k);
      x.fillStyle = rgb([16, 18, 40], .85 * k); x.beginPath(); x.moveTo(0, H);
      for (let i = 0; i <= 24; i++) x.lineTo(W * i / 24, H * (.9 + .035 * Math.sin(i * .9) + .02 * Math.sin(i * 2.3)));
      x.lineTo(W, H); x.fill();
    } else if (w === 'observatory') {
      // a copper sky, the sun low on the right, long amber light, the first stars on the left
      sky([[0, [30, 24, 48], .5 * k], [.5, [80, 46, 40], .5 * k], [.85, [200, 110, 60], .5 * k], [1, [235, 150, 80], .5 * k]]);
      glow(W * .96, H * (.5 + .3 * k), Math.max(W, H) * .55, [255, 150, 70], .3 * k);
      sun(W * .97, H * (.62 + .25 * k), M * .09, [255, 220, 150], [240, 110, 60], .6 * k);
      for (let i = 0; i < 22 * k; i++) { x.fillStyle = rgb([255, 240, 220], .25 + .5 * ((i * 37) % 10) / 10); x.beginPath(); x.arc((i * 613) % (W * .5), (i * 271) % (H * .35), .8 + (i % 3) * .4, 0, 6.29); x.fill(); }
    } else if (w === 'netrunner') {
      // a huge striped red sun going down behind the megatowers (the city on #fx stays in front)
      sky([[0, [14, 10, 30], .55 * k], [.45, [70, 14, 70], .55 * k], [.75, [200, 40, 90], .55 * k], [1, [255, 120, 60], .55 * k]]);
      const r = M * .2, sx = W * .965, sy = H * (.52 + .2 * k);
      glow(sx, sy, r * 3, [255, 60, 90], .3 * k);
      sun(sx, sy, r, [255, 190, 90], [255, 40, 90], .85 * k);
      x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 7; i++) x.fillRect(sx - r, sy + r * (.15 + i * .12), r * 2, 2 + i * 1.2);
      x.globalCompositeOperation = 'source-over';
    } else if (w === 'arcade') {
      // a pixel sunset: dithered bands of violet, pink and orange, a stepped pixel sun
      const P = 6, bands = [[40, 24, 80], [110, 40, 120], [200, 70, 110], [240, 120, 80], [255, 180, 90]];
      for (let y = 0; y < H; y += P) {
        const f = Math.pow(y / H, 1.6) * bands.length, bi = Math.min(bands.length - 1, Math.floor(f)), nx = Math.min(bands.length - 1, bi + 1), fr = f % 1;
        for (let xx = 0; xx < W; xx += P) { x.fillStyle = rgb(bands[((xx / P + y / P) % 2 === 0 && fr > .5) ? nx : bi], .5 * k); x.fillRect(xx, y, P, P); }
      }
      const sx = Math.round(W * .035 / P) * P, sy = Math.round(H * (.72 + .1 * k) / P) * P, R = 11;
      for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) if (i * i + j * j <= R * R && !(j > 2 && j % 3 === 0)) { x.fillStyle = rgb(j < 0 ? [255, 214, 110] : [255, 120, 90], .9 * k); x.fillRect(sx + i * P, sy + j * P, P, P); }
    } else if (w === 'washi') {
      // a vermilion sun in ink wash behind the karst pillars, an ochre wash on the lower paper
      sky([[0, [247, 240, 225], 0], [.6, [240, 214, 170], .45 * k], [1, [225, 170, 120], .45 * k]]);
      glow(W * .94, H * .47, Math.max(W, H) * .35, [230, 140, 90], .18 * k);
      sun(W * .94, H * (.42 + .1 * k), M * .1, [222, 90, 60], [200, 70, 50], .55 * k);
    }
  }
  // after sunset: a deep blue sky with a thin afterglow on the horizon and stars; e deepens it into the night
  function paintBlue(x, W, H, w, e) {
    const g = x.createLinearGradient(0, 0, 0, H), paper = w === 'washi';
    if (paper) { g.addColorStop(0, rgb([70, 80, 120], .16 + .1 * e)); g.addColorStop(.85, rgb([110, 100, 140], .14)); g.addColorStop(1, rgb([220, 150, 120], .22 * (1 - e))); }
    else {
      const top = w === 'arcade' ? [30, 26, 90] : w === 'netrunner' ? [16, 14, 60] : [18, 26, 70];
      g.addColorStop(0, rgb(top, .55 + .15 * e)); g.addColorStop(.7, rgb([40, 60, 130], .45 * (1 - .5 * e))); g.addColorStop(.9, rgb([150, 90, 120], .35 * (1 - e)));
      g.addColorStop(1, rgb([240, 140, 90], .38 * (1 - e)));
    }
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    if (paper) return;
    for (let i = 0; i < 40 + 30 * e; i++) { x.fillStyle = rgb([235, 240, 255], (.2 + .5 * ((i * 37) % 10) / 10) * (.7 + .3 * e)); x.beginPath(); x.arc((i * 613) % W, (i * 271) % (H * .5), .7 + (i % 3) * .4, 0, 6.29); x.fill(); }
    if (w === 'sanctuary') {
      x.fillStyle = rgb([10, 12, 30], .9); x.beginPath(); x.moveTo(0, H);
      for (let i = 0; i <= 24; i++) x.lineTo(W * i / 24, H * (.9 + .035 * Math.sin(i * .9) + .02 * Math.sin(i * 2.3)));
      x.lineTo(W, H); x.fill();
    }
  }
  function paintDawn(x, W, H, w, d) {
    const g = x.createLinearGradient(0, 0, 0, H), a = (w === 'washi' ? .4 : .36) * d;
    g.addColorStop(0, rgb([120, 150, 210], a * .5)); g.addColorStop(.75, rgb([255, 170, 160], 0)); g.addColorStop(1, rgb([255, 185, 160], a));
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }

  function render(force) {
    const w = S.juice && S.juice.tod ? worldNow() : null, p = phase(), d = new Date();
    const W = innerWidth, H = innerHeight;
    // warm eye-comfort filter: ramps in around sunset, stays until a little after sunrise
    const f = { soft: .1, mid: .18 }[S.evening.filter] || 0, { set, rise } = sunTimes(d), m = d.getHours() + d.getMinutes() / 60;
    const fa = f * (m < rise ? 1 : m < rise + 0.5 ? 1 - (m - rise) / 0.5 : clamp((m - (set - 0.5)) / 1));
    veil.style.opacity = fa.toFixed(3); veil.hidden = fa < 0.005;
    if (!veil.isConnected) document.body.appendChild(veil);
    const draw = w && (p.k > 0 || p.dawn > 0 && S.evening.dawn);
    const key = draw ? [w, W, H, Math.round(p.k * 60), Math.round(p.b * 30), Math.round(p.e * 20), Math.round(p.dawn * 20)].join() : 'none';
    if (key === lastKey && !force) return; lastKey = key;
    if (draw) root.dataset.dusk = '1'; else delete root.dataset.dusk;
    if (!draw) { cv.hidden = true; return; }
    const fx = document.getElementById('fx');
    if (fx && cv.nextSibling !== fx) fx.before(cv);
    cv.hidden = false; cv.width = W; cv.height = H;
    const x = cv.getContext('2d'); x.clearRect(0, 0, W, H);
    if (p.dawn > 0) { paintDawn(x, W, H, w, p.dawn); return; }
    if (p.b < 1) { x.globalAlpha = 1 - p.b; paintSunset(x, W, H, w, p.k); }
    if (p.b > 0) { x.globalAlpha = p.b; paintBlue(x, W, H, w, p.e); }
    x.globalAlpha = 1;
  }
  let rs = 0;
  addEventListener('resize', () => { clearTimeout(rs); rs = setTimeout(() => render(), 200); });
  on('minute', () => render()); on('started', () => render(true)); on('render', () => render());
  new MutationObserver(() => render()).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-light'] });

  ML.settingsSection({
    order: 17,
    render: () => `<h3>${esc(t('set_evening'))}</h3><p class="hint">${esc(t('ev_hint'))}</p>
      <label class="field"><span>${esc(t('ev_filter'))}</span>${ML.ui.sel('set-evf', ['off', 'soft', 'mid'].map(v => [v, t('ev_f_' + v)]), S.evening.filter)}</label>
      ${ML.ui.chk('set-evdawn', t('ev_dawn'), S.evening.dawn)}`,
    bind: r => {
      r.querySelector('#set-evf').onchange = e => { S.evening.filter = e.target.value; save(); render(true); };
      r.querySelector('#set-evdawn').onchange = e => { S.evening.dawn = e.target.checked; save(); render(true); };
    },
  });
})();
