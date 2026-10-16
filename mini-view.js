// The small floating timer. Shared by the Picture-in-Picture window (opened from app.js)
// and the extension's popup window (mini.html + mini.js).
window.MiniView = (() => {
  const CSS = `
    :root { color-scheme: dark; --void:#07060d; --line:#241f40; --text:#ece9ff; --mist:#8c87b4; --accent:#a678ff; --accent-2:#3ee8e0; }
    :root[data-mood="drained"] { --accent:#5cc8e6; --accent-2:#9aa6ff; }
    :root[data-mood="fired"] { --accent:#ff4fd8; --accent-2:#ffb03a; }
    :root[data-mood="scattered"] { --accent:#ffb547; --accent-2:#a678ff; }
    :root[data-mode="break"] { --accent: var(--accent-2); }
    html, body { margin:0; height:100%; background:var(--void); color:var(--text); font-family:"IBM Plex Sans","Segoe UI",system-ui,sans-serif; }
    .mini { height:100%; box-sizing:border-box; padding:12px 14px; display:grid; grid-template-rows:auto 1fr auto auto; gap:6px;
      background: radial-gradient(400px 200px at 100% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%); }
    .m-top { display:flex; justify-content:space-between; align-items:center; gap:8px; }
    .m-state { font-family:"Chakra Petch","Bahnschrift",sans-serif; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--accent); }
    .m-clock { font-family:"JetBrains Mono","Cascadia Mono",Consolas,monospace; font-weight:600; font-size:clamp(28px, 18vw, 64px); line-height:1; align-self:center;
      font-variant-numeric:tabular-nums; letter-spacing:-.03em; text-shadow:0 0 22px color-mix(in srgb, var(--accent) 50%, transparent); }
    .m-bar { height:3px; background:var(--line); border-radius:2px; overflow:hidden; }
    .m-bar i { display:block; height:100%; width:0; background:var(--accent); box-shadow:0 0 8px var(--accent); }
    .m-task { font-size:12px; color:var(--mist); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    button { font:inherit; font-size:12px; font-weight:600; color:var(--text); background:transparent; border:1px solid var(--line); border-radius:5px; padding:4px 10px; cursor:pointer; }
    button:hover { border-color:var(--accent); }
  `;

  function fmtClock(s) {
    s = Math.max(0, Math.ceil(s));
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(x).padStart(2, '0');
  }

  function mount(doc, onToggle) {
    doc.title = 'MerlinsLockIN';
    const st = doc.createElement('style');
    st.textContent = CSS;
    doc.head.appendChild(st);
    doc.body.innerHTML = `<div class="mini">
      <div class="m-top"><span class="m-state" id="m-state"></span><button type="button" id="m-toggle">Pause</button></div>
      <div class="m-clock" id="m-clock">--:--</div>
      <div class="m-bar"><i id="m-bar"></i></div>
      <div class="m-task" id="m-task"></div>
    </div>`;
    doc.getElementById('m-toggle').addEventListener('click', onToggle);
  }

  // d: { remaining, total, running, mode, mood, task }
  function render(doc, d) {
    const el = id => doc && doc.getElementById(id);
    if (!el('m-clock')) return;
    doc.documentElement.dataset.mode = d.mode;
    doc.documentElement.dataset.mood = d.mood || 'steady';
    el('m-clock').textContent = fmtClock(d.remaining);
    el('m-bar').style.width = (100 * (1 - Math.max(0, d.remaining) / d.total)).toFixed(1) + '%';
    el('m-state').textContent = d.running ? (d.mode === 'focus' ? 'Locked in' : 'Break')
      : d.remaining <= 0 ? 'Done' : d.remaining < d.total ? 'Paused' : 'Ready';
    el('m-task').textContent = d.mode === 'break' ? 'Stand up, stretch, drink water' : (d.task || 'Free focus');
    el('m-toggle').textContent = d.running ? 'Pause' : d.remaining < d.total ? 'Resume' : 'Start';
    el('m-toggle').hidden = d.remaining <= 0;
    doc.title = (d.running ? fmtClock(d.remaining) + ' · ' : '') + 'MerlinsLockIN';
  }

  return { mount, render, fmtClock };
})();
