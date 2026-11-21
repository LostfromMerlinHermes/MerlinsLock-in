// The small floating timer. Shared by the Picture-in-Picture window (opened from app.js)
// and the extension's popup window (mini.html + mini.js).
// 3.113: quiet by default. A pill that shows only the time; the task and the buttons come on hover
// and fold back 2 s after the mouse leaves. Styles: pill, thin bar, small dial. Settings in S.mini
// (size, what shows, hover or always, brightness at rest, world or plain colours), also from the ⋯ menu.
// The window itself stays an opaque rectangle (browsers allow no transparency): « brightness » dims its content.
window.MiniView = (() => {
  const DEF = { style: 'pill', size: 's', ring: true, task: true, btns: true, hover: true, bright: 100, colors: 'world' };
  const opts = o => Object.assign({}, DEF, o || {});
  // Inner size of the window per style and size (Chrome may enforce a larger minimum: the layout follows the real size)
  const SIZES = { pill: { s: [200, 56], m: [240, 72], l: [300, 96] }, bar: { s: [300, 34], m: [380, 40], l: [460, 48] }, dial: { s: [150, 150], m: [190, 190], l: [240, 240] } };
  const winSize = o => { o = opts(o); return (SIZES[o.style] || SIZES.pill)[o.size] || SIZES.pill.s; };
  const MENU_SIZE = [260, 252];

  const STR = {
    fr: { pause: 'Pause', resume: 'Reprendre', start: 'Démarrer', finish: 'Terminer', menu: 'Réglages du mini chrono', style: 'Style', pill: 'Pastille', bar: 'Barre', dial: 'Cadran', size: 'Taille', s: 'P', m: 'M', l: 'G', bright: 'Luminosité au repos', colors: 'Couleurs', world: 'Monde', plain: 'Sobres', always: 'Toujours montrer la tâche', back: 'Fermer', free: 'Focus libre', brk: 'Lève-toi, étire-toi, bois de l’eau', open_app: 'Ouvre l’app pour terminer', none: 'Ouvre MerlinsLockIN pour commencer' },
    en: { pause: 'Pause', resume: 'Resume', start: 'Start', finish: 'Finish', menu: 'Floating timer settings', style: 'Style', pill: 'Pill', bar: 'Bar', dial: 'Dial', size: 'Size', s: 'S', m: 'M', l: 'L', bright: 'Brightness at rest', colors: 'Colours', world: 'World', plain: 'Plain', always: 'Always show the task', back: 'Close', free: 'Free focus', brk: 'Stand up, stretch, drink water', open_app: 'Open the app to finish', none: 'Open MerlinsLockIN to start' },
  };

  const CSS = `
    :root { color-scheme: dark; --acc: #a678ff; --brk: #7fd1b9; --tm: #f1eef8; --bg: #0b0a10; --line: #2a2534; --mist: #9a94ab; --bright: 1; }
    :root[data-colors="plain"] { --acc: #c9c9d0; --brk: #c9c9d0; --tm: #ececf0; --bg: #0a0a0c; }
    :root[data-mode="break"] { --acc: var(--brk); }
    html, body { margin: 0; height: 100%; background: var(--bg); color: var(--tm); overflow: hidden;
      font-family: "Atkinson Hyperlegible Next", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif; }
    button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
    .mini { position: relative; height: 100%; box-sizing: border-box; }
    :root[data-colors="world"] .mini { background: radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, var(--acc) 12%, transparent), transparent 70%); }
    .face { height: 100%; opacity: var(--bright); transition: opacity .25s; }
    .mini.open .face, .mini.menu .face { opacity: 1; }
    .tm { font-family: "Atkinson Hyperlegible Mono", "JetBrains Mono", "Cascadia Mono", Consolas, monospace; font-weight: 600; line-height: 1;
      font-variant-numeric: tabular-nums; letter-spacing: -.02em; white-space: nowrap; color: var(--tm); }
    :root[data-colors="world"] .tm { color: color-mix(in srgb, var(--acc) 28%, var(--tm)); }
    .tk { font-size: 12px; color: var(--mist); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
    .btns { display: flex; gap: 4px; }
    .ib { width: 26px; height: 26px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 7px; color: var(--tm); flex: none; }
    .ib:hover, .ib:focus-visible { border-color: var(--acc); outline: none; }
    .ib svg { width: 12px; height: 12px; fill: currentColor; }
    .ring-s { flex: none; }
    .ring-s circle:last-child, .dial-svg .arc { stroke: var(--acc); transition: stroke-dashoffset .5s; }
    .more { display: none; min-width: 0; }
    .mini.open .more, .mini.always .more { display: flex; }
    /* paused: dimmed, one slow blink a minute; done: green for a moment */
    .mini.paused .tm { opacity: .6; animation: mblink 60s infinite; }
    @keyframes mblink { 0%, 2%, 100% { opacity: .6; } 1% { opacity: .15; } }
    .mini.done .tm { color: #7ee0a8; }
    @media (prefers-reduced-motion: reduce) { .mini.paused .tm { animation: none; } .face, .ring-s circle, .arc { transition: none; } }

    /* pill */
    .s-pill .face { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 10px; box-sizing: border-box; }
    .s-pill .tm { font-size: min(52vh, 22vw); }
    .s-pill .ring-s { width: min(30vh, 12vw); height: min(30vh, 12vw); }
    .s-pill.open .ring-s, .s-pill.always .ring-s { display: none; }
    .s-pill.open .tm, .s-pill.always .tm { font-size: min(38vh, 15vw); }
    .s-pill .more { flex-direction: column; gap: 4px; flex: 1; }
    /* bar */
    .s-bar .face { display: grid; grid-template-rows: minmax(0, 1fr) 3px; }
    .s-bar .row { display: flex; align-items: center; gap: 8px; padding: 0 10px; min-width: 0; }
    .s-bar .tm { font-size: min(46vh, 7vw); margin-left: auto; }
    .s-bar .more { align-items: center; gap: 6px; flex: 1; }
    .s-bar .more .tk { flex: 1; }
    .s-bar .ib { width: min(60vh, 24px); height: min(60vh, 24px); }
    .s-bar .bar { background: var(--line); } .s-bar .bar i { display: block; height: 100%; background: var(--acc); transition: width .5s; }
    /* dial */
    .s-dial .face { position: relative; display: grid; place-items: center; }
    .s-dial .dial-svg { position: absolute; inset: 6%; width: 88%; height: 88%; }
    .s-dial .mid { position: relative; display: grid; justify-items: center; gap: 4px; max-width: 64%; }
    .s-dial .tm { font-size: min(16vw, 16vh); }
    .s-dial .more { flex-direction: column; align-items: center; gap: 4px; max-width: 100%; }
    .s-dial .tk { font-size: min(7vw, 11px); max-width: 100%; }
    .dial-svg .bez { fill: none; stroke: color-mix(in srgb, var(--acc) 30%, #2a2534); stroke-width: 1.5; }
    .dial-svg .tick { stroke: color-mix(in srgb, var(--acc) 45%, #3a3446); }
    .dial-svg .trk { fill: none; stroke: var(--line); stroke-width: 4; }

    /* ⋯ menu */
    .menu-p { position: absolute; inset: 0; background: var(--bg); padding: 10px 12px; box-sizing: border-box; display: none; gap: 6px; align-content: start; font-size: 12px; overflow: auto; }
    .mini.menu .menu-p { display: grid; }
    .mini.menu .face { visibility: hidden; }
    .mp-row { display: grid; gap: 4px; }
    .mp-l { color: var(--mist); font-size: 11px; }
    .seg { display: flex; gap: 4px; flex-wrap: wrap; }
    .seg button { border: 1px solid var(--line); border-radius: 99px; padding: 2px 10px; color: var(--mist); }
    .seg button[aria-pressed="true"] { border-color: var(--acc); color: var(--tm); }
    .mp-chk { display: flex; gap: 6px; align-items: center; color: var(--tm); cursor: pointer; }
    .mp-chk input, .mp-row input[type=range] { accent-color: var(--acc); }
    .mp-row input[type=range] { width: 100%; margin: 0; }
    .mp-close { justify-self: end; border: 1px solid var(--line); border-radius: 7px; padding: 3px 12px; }
    .say { position: absolute; left: 0; right: 0; bottom: 0; padding: 4px 8px; font-size: 11px; background: var(--bg); color: var(--tm); text-align: center; }
  `;

  const I = {
    pause: '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.8" height="9" rx=".6"/><rect x="7.2" y="1.5" width="2.8" height="9" rx=".6"/></svg>',
    play: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5l7 4.5-7 4.5z"/></svg>',
    check: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.8 6.4l1.2-1.2 2 2 4-4.2 1.2 1.2-5.2 5.4z"/></svg>',
    dots: '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="2.2" cy="6" r="1.2"/><circle cx="6" cy="6" r="1.2"/><circle cx="9.8" cy="6" r="1.2"/></svg>',
  };
  const RC = 2 * Math.PI * 6, DC = 2 * Math.PI * 42;

  function fmtClock(s) {
    s = Math.max(0, Math.ceil(s));
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(x).padStart(2, '0');
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // h: { toggle(), finish() -> Promise<bool>|bool, setOpt(patch), resize(w, h) }
  function mount(doc, h) {
    if (typeof h === 'function') h = { toggle: h };
    doc.title = 'MerlinsLockIN';
    const st = doc.createElement('style');
    st.textContent = CSS;
    doc.head.appendChild(st);
    doc.body.innerHTML = '<div class="mini" id="m-root"></div>';
    const root = doc.getElementById('m-root');
    const win = doc.defaultView;
    const state = { h, last: null, key: '', foldT: 0, sayT: 0, menu: false };
    doc.__mini = state;
    const open = on => { clearTimeout(state.foldT); root.classList.toggle('open', on); };
    root.addEventListener('mouseenter', () => open(true));
    root.addEventListener('mouseleave', () => { clearTimeout(state.foldT); state.foldT = setTimeout(() => { if (!root.contains(doc.activeElement) || doc.activeElement === doc.body) open(false); }, 2000); });
    root.addEventListener('focusin', () => open(true));
    root.addEventListener('focusout', () => { clearTimeout(state.foldT); state.foldT = setTimeout(() => { if (!root.matches(':hover')) open(false); }, 2000); });
    root.addEventListener('click', async e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a, d = state.last; if (!d) return;
      if (a === 'toggle') h.toggle && h.toggle();
      else if (a === 'finish' && h.finish) { const ok = await h.finish(); if (ok === false) say(doc, tr(d, 'open_app')); }
      else if (a === 'menu') setMenu(doc, true);
      else if (a === 'close') setMenu(doc, false);
      else if (a === 'set' && h.setOpt) { const v = b.dataset.v; h.setOpt({ [b.dataset.k]: v }); }
    });
    root.addEventListener('change', e => {
      if (!h.setOpt) return;
      if (e.target.id === 'mp-always') h.setOpt({ hover: !e.target.checked });
    });
    root.addEventListener('input', e => { if (e.target.id === 'mp-bright' && h.setOpt) h.setOpt({ bright: +e.target.value }); });
    win.addEventListener('keydown', e => { if (e.key === 'Escape' && state.menu) setMenu(doc, false); });
  }
  const tr = (d, k) => (STR[d.lang] || STR.en)[k] || STR.en[k];
  function say(doc, msg) {
    const s = doc.__mini, root = doc.getElementById('m-root'); if (!root) return;
    let el = doc.getElementById('m-say');
    if (!el) { el = doc.createElement('div'); el.id = 'm-say'; el.className = 'say'; el.setAttribute('role', 'status'); root.appendChild(el); }
    el.textContent = msg; clearTimeout(s.sayT); s.sayT = setTimeout(() => el.remove(), 3000);
  }
  function setMenu(doc, on) {
    const s = doc.__mini; s.menu = on; s.key = '';
    const d = s.last, o = d && opts(d.opts);
    if (s.h.resize) { const [w, hh] = on ? MENU_SIZE.map((v, i) => Math.max(v, winSize(o)[i])) : winSize(o); s.h.resize(w, hh); }
    if (d) render(doc, d);
    if (on) { const f = doc.querySelector('.menu-p button'); if (f) f.focus(); }
  }

  function menuHtml(d, o) {
    const seg = (k, vals) => `<div class="seg" role="group">${vals.map(v => `<button type="button" data-a="set" data-k="${k}" data-v="${v}" aria-pressed="${o[k] === v}">${esc(tr(d, v))}</button>`).join('')}</div>`;
    return `<div class="menu-p" role="dialog" aria-label="${esc(tr(d, 'menu'))}">
      <div class="mp-row"><span class="mp-l">${esc(tr(d, 'style'))}</span>${seg('style', ['pill', 'bar', 'dial'])}</div>
      <div class="mp-row"><span class="mp-l">${esc(tr(d, 'size'))}</span>${seg('size', ['s', 'm', 'l'])}</div>
      <div class="mp-row"><label class="mp-l" for="mp-bright">${esc(tr(d, 'bright'))} · <span id="mp-bv"></span></label><input type="range" id="mp-bright" min="25" max="100" step="5" value="${o.bright}"></div>
      ${d.forcePlain ? '' : `<div class="mp-row"><span class="mp-l">${esc(tr(d, 'colors'))}</span>${seg('colors', ['world', 'plain'])}</div>`}
      <label class="mp-chk"><input type="checkbox" id="mp-always" ${o.hover ? '' : 'checked'}> ${esc(tr(d, 'always'))}</label>
      <button type="button" class="mp-close" data-a="close">${esc(tr(d, 'back'))}</button>
    </div>`;
  }

  // d: { remaining, total, running, mode, task, lang, opts, accent, forcePlain }
  function render(doc, d) {
    const root = doc && doc.getElementById('m-root'); if (!root) return;
    const s = doc.__mini; s.last = d;
    const o = opts(d.opts), html = doc.documentElement;
    const plain = d.forcePlain || o.colors === 'plain';
    html.dataset.mode = d.mode || 'focus';
    html.dataset.colors = plain ? 'plain' : 'world';
    if (d.accent && !plain) html.style.setProperty('--acc', d.accent); else html.style.removeProperty('--acc');
    html.style.setProperty('--bright', (Math.min(100, Math.max(25, +o.bright || 100)) / 100).toFixed(2));
    const total = d.total || 1, rem = Math.max(0, d.remaining), frac = 1 - rem / total;
    const started = d.running || (rem > 0 && rem < total), done = rem <= 0;
    const task = o.task ? (d.task || '') : '';
    const showBtns = o.btns;
    // Rebuild only when the layout changes; each tick then only updates the time and the progress
    const key = [o.style, o.ring, !!task, showBtns, started, done, d.running, s.menu, s.menu ? [o.size, o.colors, o.hover, d.forcePlain].join() : ''].join('|');
    if (key !== s.key) {
      s.key = key;
      const btns = showBtns ? `<span class="btns">
          ${done ? '' : `<button type="button" class="ib" data-a="toggle" id="m-toggle" aria-label="${esc(tr(d, d.running ? 'pause' : started ? 'resume' : 'start'))}" title="${esc(tr(d, d.running ? 'pause' : started ? 'resume' : 'start'))}">${d.running ? I.pause : I.play}</button>`}
          ${started || done ? `<button type="button" class="ib" data-a="finish" aria-label="${esc(tr(d, 'finish'))}" title="${esc(tr(d, 'finish'))}">${I.check}</button>` : ''}
          <button type="button" class="ib" data-a="menu" aria-label="${esc(tr(d, 'menu'))}" title="${esc(tr(d, 'menu'))}">${I.dots}</button></span>` : '';
      const tk = task ? `<span class="tk" id="m-task"></span>` : '';
      const more = tk || btns ? `<span class="more">${tk}${btns}</span>` : '';
      let face;
      if (o.style === 'bar') {
        face = `<div class="row">${more}<span class="tm" id="m-clock"></span></div>${o.ring ? '<div class="bar"><i id="m-bar"></i></div>' : '<div></div>'}`;
      } else if (o.style === 'dial') {
        let ticks = '';
        for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, r1 = i % 5 ? 47 : 45; ticks += `<line class="tick" x1="${(50 + Math.sin(a) * r1).toFixed(2)}" y1="${(50 - Math.cos(a) * r1).toFixed(2)}" x2="${(50 + Math.sin(a) * 49).toFixed(2)}" y2="${(50 - Math.cos(a) * 49).toFixed(2)}" stroke-width="${i % 5 ? .5 : 1}"/>`; }
        face = `<svg class="dial-svg" viewBox="0 0 100 100" aria-hidden="true"><circle class="bez" cx="50" cy="50" r="49.2"/>${ticks}${o.ring ? `<circle class="trk" cx="50" cy="50" r="42"/><circle class="arc" id="m-arc" cx="50" cy="50" r="42" fill="none" stroke-width="4" stroke-linecap="round" stroke-dasharray="${DC.toFixed(2)}" transform="rotate(-90 50 50)"/>` : ''}</svg>
          <div class="mid"><span class="tm" id="m-clock"></span>${more}</div>`;
      } else {
        face = `${o.ring ? `<svg class="ring-s" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="#2a2534" stroke-width="2.2"/><circle id="m-ring" cx="8" cy="8" r="6" fill="none" stroke-width="2.2" stroke-dasharray="${RC.toFixed(2)}" transform="rotate(-90 8 8)"/></svg>` : ''}<span class="tm" id="m-clock"></span>${more}`;
      }
      root.innerHTML = `<div class="face">${face}</div>${s.menu ? menuHtml(d, o) : ''}`;
    }
    root.className = `mini s-${o.style}${o.hover ? '' : ' always'}${root.classList.contains('open') ? ' open' : ''}${s.menu ? ' menu' : ''}${!d.running && started ? ' paused' : ''}${done ? ' done' : ''}`;
    const el = id => doc.getElementById(id);
    el('m-clock').textContent = fmtClock(rem);
    if (el('m-task')) { el('m-task').textContent = task; el('m-task').title = task; }
    if (el('m-ring')) el('m-ring').style.strokeDashoffset = (RC * (1 - frac)).toFixed(2);
    if (el('m-arc')) el('m-arc').style.strokeDashoffset = (DC * (1 - frac)).toFixed(2);
    if (el('m-bar')) el('m-bar').style.width = (100 * frac).toFixed(1) + '%';
    if (el('mp-bv')) el('mp-bv').textContent = o.bright + ' %';
    doc.title = (d.running ? fmtClock(rem) + ' · ' : '') + 'MerlinsLockIN';
  }

  return { mount, render, fmtClock, winSize, opts, DEF, STR };
})();
