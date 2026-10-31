// Small outside tasks without leaving focus (3.50, proposals/plan-v2 F):
// F1 a task's links (opened together when its session starts), F2 pages and text kept from the browser's right-click menu
// (extension: background.js queues them, this file takes them in), F3 an away message to copy when a session starts,
// F4 the day's summary to share (text; an image of the current world with Premium), F7 a live calendar link
// (Premium: Google / Outlook / Apple secret .ics address, refreshed every 30 min), F9 a read-later list.
// F5 (the Parked inbox) is in app.js, F6 (weekly review) in focusplus.js, F8 (follow-up) in mail.js.
(() => {
  'use strict';
  const { S, t, esc, on, $, today, uid, fmtMins } = ML;
  const save = () => ML.save();
  const isPrem = () => !!(ML.isPremium && ML.isPremium());
  ML.addStrings({
    fr: {
      lk_label: 'Liens (un par ligne)', lk_ph: 'https://…', lk_open: 'Ouvrir les liens', lk_auto: 'Ouvrir les liens d’une tâche quand sa session commence', lk_n: '{n} lien(s)',
      aw_title: 'Message d’absence', aw_on: 'Proposer un message à copier quand une session de 20 min ou plus commence', aw_text: 'Texte ({h} = heure de fin)', aw_default: 'En focus jusqu’à {h}, je réponds après.', aw_copy: 'Copier le message d’absence',
      sh_btn: 'Partager ma journée', sh_title: 'Ma journée', sh_text: 'Texte', sh_image: 'Image', sh_copy: 'Copier le texte', sh_save: 'Enregistrer l’image', sh_copy_img: 'Copier l’image', sh_img_ok: 'Image copiée.',
      sh_focus: '{m} de focus', sh_sessions: '{n} session(s)', sh_tasks: '{n} tâche(s) terminée(s)', sh_streak: '{n} jour(s) de suite', sh_none: 'Pas encore de session aujourd’hui.', sh_premium: 'L’image du monde est Premium.',
      cf_title: 'Agenda en direct', cf_hint: 'Colle l’adresse secrète iCal de ton agenda (Google : Paramètres de l’agenda → Adresse secrète au format iCal ; Outlook : Publier un calendrier → ICS). Il se met à jour tout seul toutes les 30 minutes.',
      cf_url: 'Adresse .ics', cf_add: 'Ajouter', cf_refresh: 'Actualiser', cf_remove: 'Retirer', cf_ok: '{n} évènements · mis à jour {t}', cf_err: 'Impossible de lire ce lien ({e}).', cf_bad: 'Colle une adresse qui commence par https:// ou webcal://',
      cf_premium: 'L’agenda en direct est réservé à Premium. Sans Premium, exporte ton agenda en .ics et importe-le dans Agenda.', cf_noproxy: 'Dans l’app web, ce lien passe par notre serveur, pas encore activé. Il marche dans l’extension.',
      rl_title: 'À lire', rl_add_ph: 'Colle un lien à lire plus tard', rl_add: 'Garder', rl_mins: '{m} de lecture', rl_session: 'En faire une session', rl_read: 'Lu', rl_task: 'Lire : {title}', rl_empty: 'Rien à lire pour l’instant. Garde une page ici, ou fais clic droit → Lire plus tard dans le navigateur (extension).',
      cap_task: 'Ajouté au plan depuis le navigateur : {title}', cap_note: 'Gardé dans À trier.', cap_read: 'Ajouté à « À lire ».',
    },
    en: {
      lk_label: 'Links (one per line)', lk_ph: 'https://…', lk_open: 'Open the links', lk_auto: 'Open a task’s links when its session starts', lk_n: '{n} link(s)',
      aw_title: 'Away message', aw_on: 'Offer a message to copy when a session of 20 min or more starts', aw_text: 'Text ({h} = end time)', aw_default: 'Focusing until {h}, I’ll reply after.', aw_copy: 'Copy the away message',
      sh_btn: 'Share my day', sh_title: 'My day', sh_text: 'Text', sh_image: 'Image', sh_copy: 'Copy the text', sh_save: 'Save the image', sh_copy_img: 'Copy the image', sh_img_ok: 'Image copied.',
      sh_focus: '{m} of focus', sh_sessions: '{n} session(s)', sh_tasks: '{n} task(s) done', sh_streak: '{n} day(s) in a row', sh_none: 'No session yet today.', sh_premium: 'The world image is Premium.',
      cf_title: 'Live calendar', cf_hint: 'Paste your calendar’s secret iCal address (Google: calendar settings → Secret address in iCal format; Outlook: Publish a calendar → ICS). It updates itself every 30 minutes.',
      cf_url: '.ics address', cf_add: 'Add', cf_refresh: 'Refresh', cf_remove: 'Remove', cf_ok: '{n} events · updated {t}', cf_err: 'Could not read this link ({e}).', cf_bad: 'Paste an address starting with https:// or webcal://',
      cf_premium: 'The live calendar is a Premium feature. Without Premium, export your calendar as .ics and import it in Calendar.', cf_noproxy: 'In the web app this link goes through our server, which is not switched on yet. It works in the extension.',
      rl_title: 'To read', rl_add_ph: 'Paste a link to read later', rl_add: 'Keep', rl_mins: '{m} read', rl_session: 'Make it a session', rl_read: 'Read', rl_task: 'Read: {title}', rl_empty: 'Nothing to read yet. Keep a page here, or right-click → Read later in the browser (extension).',
      cap_task: 'Added to your plan from the browser: {title}', cap_note: 'Kept in Inbox.', cap_read: 'Added to "To read".',
    },
  });
  ML.defaults(() => ({ links: { auto: true }, away: { on: true, text: '' }, reading: [], calFeeds: [] }));
  const ICON_LINK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';
  const cleanUrl = s => { s = String(s || '').trim(); if (!s) return null; if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = 'https://' + s; try { const u = new URL(s); return /^https?:$/.test(u.protocol) ? u.href : null; } catch (e) { return null; } };
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
  function openUrls(urls) {
    if (ML.IS_EXT && chrome.tabs && chrome.tabs.create) { urls.forEach((u, i) => chrome.tabs.create({ url: u, active: i === 0 }).catch(() => {})); return; }
    urls.forEach(u => { const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); });
  }

  /* ---------- F1: a task's links ---------- */
  const prevBadges = ML.taskBadges;
  ML.taskBadges = task => {
    const r = prevBadges ? prevBadges(task) : { html: '', cls: '' };
    const n = (task.links || []).length; if (!n || task.done) return r;
    return { cls: r.cls, html: (r.html || '') + `<button type="button" class="chip link-chip" data-links="1" title="${esc(t('lk_open'))} · ${esc(task.links.map(host).join(', '))}">${ICON_LINK}${n}</button>` };
  };
  const prevExtras = ML.taskEditExtras;
  ML.taskEditExtras = task => (prevExtras ? prevExtras(task) : '') + `<label class="lk-field"><span class="label">${esc(t('lk_label'))}</span><textarea name="links" rows="2" placeholder="${esc(t('lk_ph'))}">${esc((task.links || []).join('\n'))}</textarea></label>`;
  on('task:edit-save', ({ task, form }) => {
    const f = form.querySelector('[name=links]'); if (!f) return;
    const urls = [...new Set(f.value.split(/[\s,]+/).map(cleanUrl).filter(Boolean))].slice(0, 12);
    if (urls.length) task.links = urls; else delete task.links;
  });
  $('tasks').addEventListener('click', e => {
    const b = e.target.closest('[data-links]'); if (!b) return;
    const li = b.closest('.task'), x = li && S.tasks.find(y => y.id === li.dataset.id); if (!x) return;
    e.stopPropagation(); e.preventDefault(); openUrls(x.links || []);
  }, true);

  /* ---------- F3: away message, F1: links when a session starts ---------- */
  on('focus:start', ({ taskId, endAt, mins }) => {
    const x = taskId && S.tasks.find(y => y.id === taskId);
    if (x && x.links && x.links.length && S.links.auto) openUrls(x.links);
    if (!S.away.on || mins < 20) return;
    const h = new Date(endAt).toLocaleTimeString(ML.locale(), { hour: '2-digit', minute: '2-digit' });
    const msg = (S.away.text || t('aw_default')).replace(/\{h\}/g, h);
    setTimeout(() => ML.toast(msg, { ms: 6000, key: 'away', action: { label: t('aw_copy').split(' ')[0], fn: () => ML.copyText ? ML.copyText(msg) : navigator.clipboard.writeText(msg) } }), 900);
  });
  ML.settingsSection({
    order: 26,
    render: () => `<h3>${esc(t('aw_title'))}</h3>
      ${ML.ui.chk('set-away', t('aw_on'), S.away.on)}
      <label class="field"><span>${esc(t('aw_text'))}</span><input type="text" id="set-away-text" maxlength="160" placeholder="${esc(t('aw_default'))}" value="${esc(S.away.text || '')}"></label>
      ${ML.ui.chk('set-links-auto', t('lk_auto'), S.links.auto)}`,
    bind: r => {
      r.querySelector('#set-away').onchange = e => { S.away.on = e.target.checked; save(); };
      r.querySelector('#set-away-text').oninput = e => { S.away.text = e.target.value.trim(); save(); };
      r.querySelector('#set-links-auto').onchange = e => { S.links.auto = e.target.checked; save(); };
    },
  });

  /* ---------- F4: share my day ---------- */
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'share-day'; ov.hidden = true;
  ov.innerHTML = `<div class="sheet share-sheet" role="dialog" aria-modal="true" aria-labelledby="sh-h">
    <div class="sheet-head"><h2 id="sh-h"></h2><button type="button" class="ghost icon-only" data-close="share-day"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div id="sh-body"></div></div>`;
  document.body.appendChild(ov);
  function dayStats() {
    const td = today(), ss = S.sessions.filter(s => ML.dayKey(new Date(s.at)) === td && s.mode !== 'break');
    const done = S.tasks.filter(x => x.doneAt && ML.dayKey(new Date(x.doneAt)) === td);
    return { mins: ss.reduce((a, s) => a + (s.mins || 0), 0), n: ss.length, done, streak: ML.streaks ? ML.streaks().cur : 0 };
  }
  function shareText() {
    const d = dayStats(), date = new Date().toLocaleDateString(ML.locale(), { weekday: 'long', day: 'numeric', month: 'long' });
    const lines = [`MerlinsLockIN · ${date}`, '', `${t('sh_focus', { m: fmtMins(d.mins) })} · ${t('sh_sessions', { n: d.n })}`, t('sh_tasks', { n: d.done.length })];
    d.done.slice(0, 8).forEach(x => lines.push('- ' + ML.titleOf(x)));
    if (d.streak > 1) lines.push('', t('sh_streak', { n: d.streak }));
    return lines.join('\n');
  }
  let imgUrl = null;
  function openShare() {
    $('sh-h').textContent = t('sh_title');
    const prem = isPrem(), txt = shareText();
    $('sh-body').innerHTML = `<pre class="sh-text">${esc(txt)}</pre>
      <div class="sh-btns"><button type="button" class="primary" data-sh="copy">${esc(t('sh_copy'))}</button></div>
      ${prem ? `<canvas class="sh-img" id="sh-canvas" width="1080" height="1350" aria-label="${esc(t('sh_image'))}"></canvas>
        <div class="sh-btns">${ML.CAN_DOWNLOAD ? `<button type="button" data-sh="save">${esc(t('sh_save'))}</button>` : ''}<button type="button" class="ghost" data-sh="copyimg">${esc(t('sh_copy_img'))}</button></div>`
        : `<p class="hint">${esc(t('sh_premium'))}</p>`}`;
    ML.openOverlay('share-day');
    if (prem) drawImage($('sh-canvas'));
  }
  ML.openShareDay = openShare;
  // the image: what the world shows right now (its canvases, drawn to cover) under a veil, with the day's numbers
  function drawImage(cv) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, cs = getComputedStyle(document.documentElement), tok = n => cs.getPropertyValue(n).trim();
    // the world's own sky: the colours of the body's gradient when it has one, else its panel and void tokens
    const bs = getComputedStyle(document.body), cols = (bs.backgroundImage.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}\b/gi) || []);
    const stops = cols.length >= 2 ? cols : [tok('--panel-2') || '#222', tok('--void') || '#000'];
    const grad = g.createLinearGradient(0, 0, 0, H); stops.forEach((c, i) => { try { grad.addColorStop(i / (stops.length - 1), c); } catch (e) {} });
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    [...document.querySelectorAll('canvas')].filter(c => c !== cv && c.width > 40 && c.height > 40 && getComputedStyle(c).position === 'fixed' && getComputedStyle(c).display !== 'none').forEach(c => {
      const s = Math.max(W / c.width, H / c.height), w = c.width * s, h = c.height * s;
      try { g.imageSmoothingEnabled = !/pixelated/.test(getComputedStyle(c).imageRendering); g.drawImage(c, (W - w) / 2, (H - h) / 2, w, h); } catch (e) {}
    });
    const veil = g.createLinearGradient(0, H * .35, 0, H); veil.addColorStop(0, 'rgba(0,0,0,0)'); veil.addColorStop(1, 'rgba(0,0,0,.78)'); g.fillStyle = veil; g.fillRect(0, 0, W, H);
    const d = dayStats(), disp = tok('--f-display') || 'serif', mono = tok('--f-mono') || 'monospace', acc = tok('--accent') || '#fff';
    g.textBaseline = 'alphabetic'; g.fillStyle = '#fff';
    g.font = `600 40px ${mono}`; g.globalAlpha = .8; g.fillText('MERLINSLOCKIN', 72, 110); g.globalAlpha = 1;
    g.font = `400 38px ${mono}`; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText(new Date().toLocaleDateString(ML.locale(), { weekday: 'long', day: 'numeric', month: 'long' }), 72, 160);
    let y = H - 470;
    g.fillStyle = acc; g.font = `700 150px ${disp}`; g.fillText(fmtMins(d.mins), 72, y);
    g.fillStyle = '#fff'; g.font = `500 44px ${mono}`; y += 76; g.fillText(`${t('sh_sessions', { n: d.n })} · ${t('sh_tasks', { n: d.done.length })}`, 72, y);
    g.font = `400 36px ${mono}`; g.fillStyle = 'rgba(255,255,255,.85)';
    d.done.slice(0, 4).forEach(x => { y += 56; let s = ML.titleOf(x); while (g.measureText('· ' + s).width > W - 144 && s.length > 4) s = s.slice(0, -2); g.fillText('· ' + s + (s !== ML.titleOf(x) ? '…' : ''), 72, y); });
    if (d.streak > 1) { g.fillStyle = acc; g.font = `500 36px ${mono}`; g.fillText(t('sh_streak', { n: d.streak }), 72, H - 60); }
    try { imgUrl = cv.toDataURL('image/png'); } catch (e) { imgUrl = null; }
  }
  ov.addEventListener('click', e => {
    const b = e.target.closest('[data-sh]'); if (!b) return;
    const k = b.dataset.sh;
    if (k === 'copy') ML.copyText ? ML.copyText(shareText()) : navigator.clipboard.writeText(shareText());
    if (k === 'save' && imgUrl) { const a = document.createElement('a'); a.href = imgUrl; a.download = `merlinslockin-${today()}.png`; document.body.appendChild(a); a.click(); a.remove(); }
    if (k === 'copyimg') { const cv = $('sh-canvas'); if (cv && window.ClipboardItem) cv.toBlob(bl => { navigator.clipboard.write([new ClipboardItem({ 'image/png': bl })]).then(() => ML.toast(t('sh_img_ok'))).catch(() => {}); }); }
  });
  // the button sits beside "Today's sessions"
  const logH = document.querySelector('.log h2');
  if (logH) { const b = document.createElement('button'); b.type = 'button'; b.className = 'ghost small sh-open'; b.id = 'share-btn'; logH.after(b); b.onclick = openShare; const lbl = () => { b.textContent = t('sh_btn'); }; lbl(); on('render', lbl); }

  /* ---------- F9: read later (in the Parked tab) ---------- */
  const park = $('tab-park'), rl = document.createElement('section'); rl.className = 'rl'; rl.id = 'read-later';
  if (park) park.appendChild(rl);
  function renderReading() {
    if (!park) return;
    const list = S.reading || [];
    rl.innerHTML = `<h2>${esc(t('rl_title'))}${list.length ? ` <span class="count">${list.length}</span>` : ''}</h2>
      <form class="rl-add" autocomplete="off"><input type="url" maxlength="500" placeholder="${esc(t('rl_add_ph'))}" aria-label="${esc(t('rl_add_ph'))}"><button type="submit" class="small">${esc(t('rl_add'))}</button></form>
      <ul class="rl-list">${list.length ? list.map(r => `<li data-rid="${r.id}">
        <a href="${esc(r.url)}" target="_blank" rel="noopener" class="rl-a"><b>${esc(r.title || host(r.url))}</b><small>${esc(host(r.url))}${r.mins ? ' · ' + esc(t('rl_mins', { m: fmtMins(r.mins) })) : ''}</small></a>
        <span class="t-actions"><button type="button" class="small" data-rl="session">${esc(t('rl_session'))}</button><button type="button" class="icon-btn" data-rl="del" aria-label="${esc(t('rl_read'))}" title="${esc(t('rl_read'))}">✓</button></span></li>`).join('') : `<li class="empty">${esc(t('rl_empty'))}</li>`}</ul>`;
  }
  rl.addEventListener('submit', e => {
    e.preventDefault();
    const inp = e.target.querySelector('input'), u = cleanUrl(inp.value); if (!u) { inp.focus(); return; }
    S.reading.unshift({ id: uid(), url: u, title: '', mins: 0, at: Date.now() }); save(); renderReading();
  });
  rl.addEventListener('click', e => {
    const b = e.target.closest('[data-rl]'); if (!b) return;
    const id = b.closest('[data-rid]').dataset.rid, r = S.reading.find(x => x.id === id); if (!r) return;
    if (b.dataset.rl === 'session') {
      const task = { id: uid(), title: t('rl_task', { title: r.title || host(r.url) }).slice(0, 120), mins: Math.max(10, Math.min(90, Math.ceil((r.mins || 15) / 5) * 5)), pri: 'med', done: false, created: Date.now(), links: [r.url], due: today() };
      S.tasks.push(task);
      S.reading = S.reading.filter(x => x.id !== id); save(); renderReading(); ML.renderAll();
      ML.lockIn({ taskId: task.id, mins: task.mins });
      return;
    }
    S.reading = S.reading.filter(x => x.id !== id); save(); renderReading();
  });
  on('render', renderReading); on('tab', renderReading);

  /* ---------- F2: what the right-click menu kept (extension, see background.js) ---------- */
  async function takeInbox() {
    if (!ML.IS_EXT || !chrome.storage || !chrome.storage.local || !S.tasks) return;
    let items;
    try { items = (await chrome.storage.local.get('mli-inbox'))['mli-inbox'] || []; } catch (e) { return; }
    if (!items.length) return;
    await chrome.storage.local.set({ 'mli-inbox': [] });
    let last = '';
    items.forEach(it => {
      const url = cleanUrl(it.url), title = String(it.title || '').slice(0, 120), text = String(it.text || '').trim().slice(0, 500);
      if (it.kind === 'task') {
        S.tasks = S.tasks.filter(x => !x.sample);
        const task = { id: uid(), title: (text || title || host(url || '')).slice(0, 120), mins: 30, pri: 'med', done: false, created: it.at || Date.now() };
        if (url) task.links = [url];
        S.tasks.push(task); last = t('cap_task', { title: task.title });
      } else if (it.kind === 'read') {
        if (url && !S.reading.some(r => r.url === url)) S.reading.unshift({ id: uid(), url, title, mins: it.words ? Math.max(1, Math.round(it.words / 230)) : 0, at: it.at || Date.now() });
        last = t('cap_read');
      } else {
        S.parked.push({ id: uid(), text: text || title || url, url: url || undefined, title: title || undefined, at: it.at || Date.now() });
        last = t('cap_note');
      }
    });
    save(); ML.renderAll(); renderReading();
    if (last) ML.toast(last, { ms: 2600 });
  }
  if (ML.IS_EXT && chrome.storage && chrome.storage.onChanged) chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch['mli-inbox'] && (ch['mli-inbox'].newValue || []).length) takeInbox(); });
  on('started', takeInbox);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) takeInbox(); });

  /* ---------- F7: live calendar link (Premium) ---------- */
  const CFG = window.MLI_CONFIG || {};
  const PROXY = CFG.supabaseUrl ? CFG.supabaseUrl + '/functions/v1/ics-proxy' : '';
  async function fetchFeed(f) {
    const url = f.url.replace(/^webcal:/i, 'https:');
    let res;
    if (ML.IS_EXT) res = await fetch(url, { cache: 'no-store' });
    else { if (!PROXY) throw new Error('proxy'); res = await fetch(PROXY + '?url=' + encodeURIComponent(url), { headers: { apikey: CFG.supabaseKey } }); }
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    if (!/BEGIN:VCALENDAR/.test(text)) throw new Error('ics');
    return text;
  }
  let syncing = false;
  async function refresh(force) {
    if (syncing || !isPrem() || !S.calFeeds || !S.calFeeds.length) return;
    syncing = true;
    for (const f of S.calFeeds) {
      if (!force && f.at && Date.now() - f.at < 30 * 60000) continue;
      try { const n = ML.importIcs(await fetchFeed(f), { src: f.id, quiet: true }); f.n = n; f.err = ''; }
      catch (e) { f.err = e.message === 'proxy' || (!ML.IS_EXT && e instanceof TypeError) ? 'proxy' : e.message || 'error'; }
      f.at = Date.now();
    }
    syncing = false; save(); renderFeeds();
  }
  on('started', () => setTimeout(() => refresh(false), 4000));
  on('minute', () => refresh(false));
  let feedsRoot = null;
  function feedsHtml() {
    if (!isPrem()) return `<p class="hint">${esc(t('cf_premium'))}</p>`;
    return `<p class="hint">${esc(t('cf_hint'))}</p>
      ${(S.calFeeds || []).map(f => `<div class="cf-row" data-cf="${f.id}"><span class="cf-u">${esc(host(f.url.replace(/^webcal:/i, 'https:')))}</span>
        <small class="${f.err ? 'cf-err' : ''}">${f.err ? esc(f.err === 'proxy' ? t('cf_noproxy') : t('cf_err', { e: f.err })) : f.at ? esc(t('cf_ok', { n: f.n || 0, t: new Date(f.at).toLocaleTimeString(ML.locale(), { hour: '2-digit', minute: '2-digit' }) })) : ''}</small>
        <button type="button" class="small ghost" data-cfa="refresh">${esc(t('cf_refresh'))}</button><button type="button" class="small ghost" data-cfa="remove">${esc(t('cf_remove'))}</button></div>`).join('')}
      <form class="cf-add" autocomplete="off"><input type="url" id="cf-url" maxlength="800" placeholder="${esc(t('cf_url'))}" aria-label="${esc(t('cf_url'))}"><button type="submit" class="small">${esc(t('cf_add'))}</button></form>`;
  }
  function renderFeeds() { if (feedsRoot && feedsRoot.isConnected) feedsRoot.innerHTML = feedsHtml(); }
  ML.settingsSection({
    order: 27,
    render: () => `<h3>${esc(t('cf_title'))}</h3><div id="cf-sec">${feedsHtml()}</div>`,
    bind: r => {
      feedsRoot = r.querySelector('#cf-sec'); if (!feedsRoot) return;
      feedsRoot.addEventListener('submit', e => {
        e.preventDefault();
        const v = $('cf-url').value.trim();
        if (!/^(https|webcal):\/\//i.test(v)) { ML.toast(t('cf_bad')); return; }
        S.calFeeds.push({ id: uid(), url: v, at: 0, n: 0, err: '' }); save(); renderFeeds(); refresh(true);
      });
      feedsRoot.addEventListener('click', e => {
        const b = e.target.closest('[data-cfa]'); if (!b) return;
        const id = b.closest('[data-cf]').dataset.cf;
        if (b.dataset.cfa === 'remove') { S.calFeeds = S.calFeeds.filter(f => f.id !== id); S.events = S.events.filter(ev => ev.src !== id); save(); ML.renderAll(); renderFeeds(); }
        else refresh(true);
      });
    },
  });
})();
