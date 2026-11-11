// Screen time (3.62): time per site in the browser (extension, optional permissions, hosts only), blocking by period and
// hours (background.js), the pause screen (pause.html), if-then plans, the urge timer, and the phone's route: a number
// typed by hand and an iOS Shortcuts automation. All of it stays on this device (ML.priv, chrome.storage.local).
(() => {
  'use strict';
  const { $, S, t, esc, on, save, toast, today, fmtMins, dayKey, IS_EXT } = ML;

  ML.addStrings({
    fr: {
      sc_phone_h: 'Téléphone', sc_phone_p: 'Le chiffre d’hier, lu dans Réglages, Temps d’écran. Rien n’est lu à ta place.', sc_phone_l: 'Temps d’écran d’hier (minutes)', sc_saved: 'Noté.', sc_target: 'Repère de cette période : {m}', sc_avg: 'Moyenne sur 7 jours : {m}',
      sc_guide: 'Mettre une pause devant une app (iPhone)', sc_g1: 'Ouvre Raccourcis, puis Automatisation, puis +.', sc_g2: 'Choisis App, sélectionne par exemple Instagram, coche « Est ouverte » et « Exécuter immédiatement ».', sc_g3: 'Ajoute l’action Ouvrir l’URL, et colle cette adresse :', sc_g4: 'Limite : iOS peut afficher une notification, et si tu continues vers l’app, la pause revient à la prochaine ouverture.', sc_copy: 'Copier', sc_copied: 'Copié',
      sc_web_h: 'Navigateur', sc_web_ask: 'Mesure le temps par site dans ce navigateur. Seul le nom du site est gardé, jamais l’adresse complète ni le contenu. Rien ne quitte cet appareil.', sc_web_on: 'Activer le suivi', sc_web_off: 'Arrêter le suivi', sc_web_clear: 'Tout effacer', sc_web_only: 'Le suivi et le blocage des sites marchent dans l’extension Edge ou Chrome.', sc_web_denied: 'Autorisation refusée : le suivi reste éteint.',
      sc_today: 'Aujourd’hui', sc_insess: 'Hors travail pendant une session', sc_none: 'Rien de mesuré pour l’instant.', sc_cat_work: 'Travail', sc_cat_neutral: 'Neutre', sc_cat_dist: 'Distraction', sc_cat_tip: 'Changer de catégorie',
      sc_block_h: 'Blocage', sc_block_on: 'Bloquer les sites de ma liste', sc_m_off: 'Jamais', sc_m_session: 'Pendant les sessions', sc_m_hours: 'Selon des horaires', sc_from: 'De', sc_to: 'à', sc_list: 'Sites à bloquer', sc_redir: 'Pour l’instant, un site bloqué affiche une erreur du navigateur. Pour avoir l’écran de pause à la place, l’extension doit pouvoir agir sur tous les sites. Elle ne lit pas leur contenu.', sc_grant: 'Utiliser l’écran de pause',
      if_h: 'Plans si-alors', if_p: 'Écris ta règle à froid. Elle revient sur l’écran de pause.', if_if: 'Si…', if_then: 'alors…', if_ph1: 'j’ai envie d’ouvrir YouTube après 20 h', if_ph2: 'je fais une carte de plus et je me lève', if_add: 'Ajouter', if_del: 'Supprimer',
      ur_h: 'Laisser passer l’envie', ur_p: 'L’envie monte, puis redescend. Trois minutes sans agir.', ur_go: 'Lancer 3 minutes', ur_stats: '{n} fois, l’envie a baissé {d} fois.', ur_pause: 'Écran de pause : {b} demi-tours sur {n}.', ur_watch: 'Rien d’autre à faire qu’observer.', ur_q: 'L’envie a baissé ?', ur_yes: 'Oui', ur_no: 'Non', ur_stop: 'Arrêter',
    },
    en: {
      sc_phone_h: 'Phone', sc_phone_p: 'Yesterday’s number, from Settings, Screen Time. Nothing is read for you.', sc_phone_l: 'Screen time yesterday (minutes)', sc_saved: 'Saved.', sc_target: 'Marker for this period: {m}', sc_avg: '7-day average: {m}',
      sc_guide: 'Put a pause in front of an app (iPhone)', sc_g1: 'Open Shortcuts, then Automation, then +.', sc_g2: 'Choose App, select for example Instagram, tick “Is Opened” and “Run Immediately”.', sc_g3: 'Add the Open URL action and paste this address:', sc_g4: 'Limits: iOS may show a notification, and if you go on to the app, the pause returns the next time you open it.', sc_copy: 'Copy', sc_copied: 'Copied',
      sc_web_h: 'Browser', sc_web_ask: 'Measures time per site in this browser. Only the site’s name is kept, never the full address or the content. Nothing leaves this device.', sc_web_on: 'Turn tracking on', sc_web_off: 'Stop tracking', sc_web_clear: 'Clear everything', sc_web_only: 'Site tracking and blocking work in the Edge or Chrome extension.', sc_web_denied: 'Permission refused: tracking stays off.',
      sc_today: 'Today', sc_insess: 'Off-work during a session', sc_none: 'Nothing measured yet.', sc_cat_work: 'Work', sc_cat_neutral: 'Neutral', sc_cat_dist: 'Distraction', sc_cat_tip: 'Change category',
      sc_block_h: 'Blocking', sc_block_on: 'Block the sites on my list', sc_m_off: 'Never', sc_m_session: 'During sessions', sc_m_hours: 'On a schedule', sc_from: 'From', sc_to: 'to', sc_list: 'Sites to block', sc_redir: 'For now, a blocked site shows a browser error. To get the pause screen instead, the extension needs access to all sites. It does not read their content.', sc_grant: 'Use the pause screen',
      if_h: 'If-then plans', if_p: 'Write your rule while calm. It comes back on the pause screen.', if_if: 'If…', if_then: 'then…', if_ph1: 'I want to open YouTube after 8 pm', if_ph2: 'I do one more card and stand up', if_add: 'Add', if_del: 'Delete',
      ur_h: 'Let the urge pass', ur_p: 'The urge rises, then falls. Three minutes without acting.', ur_go: 'Start 3 minutes', ur_stats: '{n} times, the urge dropped {d} times.', ur_pause: 'Pause screen: {b} turned back out of {n}.', ur_watch: 'Nothing to do but watch it.', ur_q: 'Did the urge drop?', ur_yes: 'Yes', ur_no: 'No', ur_stop: 'Stop',
    },
  });
  ML.defaults(() => ({ blockSched: { term: { m: 'session', from: 8, to: 20 }, exams: { m: 'hours', from: 8, to: 20 }, light: { m: 'session', from: 8, to: 20 }, holidays: { m: 'off', from: 8, to: 20 } } }));

  const LIVE = 'https://lostfrommerlinhermes.github.io/MerlinsLock-in/pause.html';
  const WORK = /(^|\.)(moodle|canvas|overleaf|notion|wikipedia|github|scholar\.google|docs\.google|drive\.google|sharepoint|office|coursera|khanacademy)\b/;
  const P = ML.priv;
  const hasChrome = IS_EXT && chrome.storage && chrome.storage.local;
  let sites = {}, extUrges = [], trackOn = false, canPause = false;

  /* ---------- What background.js and pause.html need ---------- */
  function sched() { return (S.blockSched || {})[ML.period()] || { m: 'off', from: 8, to: 20 }; }
  ML.blockInSession = () => sched().m !== 'off';
  function push() {
    if (!hasChrome) return;
    const c = sched(), going = ML.running && ML.running() && S.mode === 'focus';
    chrome.storage.local.set({ 'mli-guard': { mode: S.block.on ? c.m : 'off', from: c.from, to: c.to, domains: S.block.domains, track: trackOn, lang: S.lang, title: (going && ML.activeTitle && ML.activeTitle()) || '', rules: P.get('ifthen', []) } });
    ML.bgSend({ type: 'guard-sync', session: !!going });
  }
  async function pull() {
    if (!hasChrome) return;
    const r = await chrome.storage.local.get(['mli-sites', 'mli-urges', 'mli-guard']);
    sites = r['mli-sites'] || {}; extUrges = r['mli-urges'] || []; trackOn = !!(r['mli-guard'] && r['mli-guard'].track);
    canPause = await chrome.permissions.contains({ origins: ['*://*/*'] }).catch(() => false);
    render();
  }
  async function askTrack() {
    try {
      const ok = await chrome.permissions.request({ permissions: ['tabs', 'idle'], origins: ['*://*/*'] });
      if (!ok) return toast(t('sc_web_denied'));
      trackOn = true; push(); render();
    } catch (e) { toast(t('sc_web_denied')); }
  }
  function stopTrack() { trackOn = false; push(); render(); }

  /* ---------- The page ---------- */
  const catOf = h => { const c = P.get('cats', {})[h]; if (c) return c; if ((S.block.domains || []).some(d => h === d || h.endsWith('.' + d))) return 'dist'; return WORK.test(h) ? 'work' : 'neutral'; };
  const urges = () => { let l = []; try { l = JSON.parse(localStorage.getItem('mli-urges')) || []; } catch (e) {} return [...extUrges, ...l]; };
  const yKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };
  function phoneCard() {
    const log = P.get('screen', {}), vals = Object.entries(log).filter(([k]) => k >= dayKey(new Date(Date.now() - 7 * 864e5))).map(e => e[1]), tgt = ML.periodInfo().screen;
    const url = (IS_EXT || !/^https/.test(location.protocol) ? LIVE : new URL('pause.html', location.href).href) + '?site=instagram';
    return `<div class="g-card"><h2>${esc(t('sc_phone_h'))}</h2><p class="insight">${esc(t('sc_phone_p'))}</p>
      <label class="field"><span>${esc(t('sc_phone_l'))}</span><input type="number" id="sc-phone" min="0" max="1440" inputmode="numeric" value="${log[yKey()] != null ? log[yKey()] : ''}"></label>
      ${vals.length ? `<p class="insight">${esc(t('sc_avg', { m: fmtMins(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)) }))}${tgt ? ' · ' + esc(t('sc_target', { m: fmtMins(tgt) })) : ''}</p>` : ''}
      <details class="y-det"><summary>${esc(t('sc_guide'))}</summary><ol><li>${esc(t('sc_g1'))}</li><li>${esc(t('sc_g2'))}</li><li>${esc(t('sc_g3'))}<div class="y-url"><code>${esc(url)}</code><button type="button" class="small" data-copy="${esc(url)}">${esc(t('sc_copy'))}</button></div></li></ol><p class="insight">${esc(t('sc_g4'))}</p></details></div>`;
  }
  function webCard() {
    if (!hasChrome) return `<div class="g-card"><h2>${esc(t('sc_web_h'))}</h2><p class="insight">${esc(t('sc_web_only'))}</p></div>`;
    if (!trackOn) return `<div class="g-card"><h2>${esc(t('sc_web_h'))}</h2><p class="insight">${esc(t('sc_web_ask'))}</p><button type="button" class="small primary" data-track="on">${esc(t('sc_web_on'))}</button></div>`;
    const day = sites[today()] || { all: {}, focus: {} }, rows = Object.entries(day.all || {}).sort((a, b) => b[1] - a[1]), total = rows.reduce((a, r) => a + r[1], 0);
    const off = Object.entries(day.focus || {}).filter(([h]) => catOf(h) === 'dist').reduce((a, r) => a + r[1], 0), max = rows.length ? rows[0][1] : 1;
    return `<div class="g-card"><div class="y-row"><h2>${esc(t('sc_web_h'))}</h2><strong class="y-num">${fmtMins(Math.round(total / 60))}</strong></div>
      ${off >= 60 ? `<p class="insight">${esc(t('sc_insess'))} : <b>${fmtMins(Math.round(off / 60))}</b></p>` : ''}
      ${rows.length ? `<div class="y-sites">${rows.slice(0, 8).map(([h, s]) => { const c = catOf(h); return `<div class="y-site"><span>${esc(h)}</span><span class="y-track"><b class="c-${c}" style="width:${(s / max * 100).toFixed(0)}%"></b></span><span class="mono">${fmtMins(Math.round(s / 60))}</span><button type="button" class="small ghost" data-cat="${esc(h)}" title="${esc(t('sc_cat_tip'))}">${esc(t('sc_cat_' + c))}</button></div>`; }).join('')}</div>` : `<p class="insight">${esc(t('sc_none'))}</p>`}
      <div class="y-btns"><button type="button" class="small ghost" data-track="off">${esc(t('sc_web_off'))}</button><button type="button" class="small ghost" id="sc-clear">${esc(t('sc_web_clear'))}</button></div></div>`;
  }
  function blockCard() {
    if (!hasChrome) return '';
    const hours = Array.from({ length: 24 }, (_, i) => [i, i + ' h']);
    return `<div class="g-card"><h2>${esc(t('sc_block_h'))}</h2>${ML.ui.chk('sc-block', t('sc_block_on'), S.block.on)}
      ${ML.PERIODS.map(k => { const c = (S.blockSched || {})[k] || { m: 'off', from: 8, to: 20 }; return `<div class="y-sched ${k === ML.period() ? 'cur' : ''}"><b>${esc(t('pd_' + k))}</b>${ML.ui.sel('sc-m-' + k, [['off', t('sc_m_off')], ['session', t('sc_m_session')], ['hours', t('sc_m_hours')]], c.m)}${c.m === 'hours' ? `<span class="y-hours">${esc(t('sc_from'))} ${ML.ui.sel('sc-f-' + k, hours, c.from)} ${esc(t('sc_to'))} ${ML.ui.sel('sc-t-' + k, hours, c.to)}</span>` : ''}</div>`; }).join('')}
      <label class="field"><span>${esc(t('sc_list'))}</span><textarea id="sc-domains" rows="3">${esc(S.block.domains.join('\n'))}</textarea></label>${canPause ? '' : `<p class="insight">${esc(t('sc_redir'))}</p><button type="button" class="small" data-grant>${esc(t('sc_grant'))}</button>`}</div>`;
  }
  function ifCard() {
    const list = P.get('ifthen', []);
    return `<div class="g-card"><h2>${esc(t('if_h'))}</h2><p class="insight">${esc(t('if_p'))}</p>
      ${list.map((r, i) => `<div class="y-rule"><span><small>${esc(t('if_if'))}</small> ${esc(r.a)} <small>${esc(t('if_then'))}</small> ${esc(r.b)}</span><button type="button" class="small ghost" data-ifdel="${i}">${esc(t('if_del'))}</button></div>`).join('')}
      <form class="y-ifadd" id="if-add"><input type="text" id="if-a" maxlength="120" required aria-label="${esc(t('if_if'))}" placeholder="${esc(t('if_if') + ' ' + t('if_ph1'))}"><input type="text" id="if-b" maxlength="120" required aria-label="${esc(t('if_then'))}" placeholder="${esc(t('if_then') + ' ' + t('if_ph2'))}"><button type="submit" class="small">${esc(t('if_add'))}</button></form></div>`;
  }
  function urgeCard() {
    const log = P.get('urgeLog', []), u = urges(), back = u.filter(x => x.back).length;
    return `<div class="g-card"><h2>${esc(t('ur_h'))}</h2><p class="insight">${esc(t('ur_p'))}</p><button type="button" class="small" data-urge>${esc(t('ur_go'))}</button>
      ${log.length ? `<p class="insight">${esc(t('ur_stats', { n: log.length, d: log.filter(x => x.dropped).length }))}</p>` : ''}${u.length ? `<p class="insight">${esc(t('ur_pause', { b: back, n: u.length }))}</p>` : ''}</div>`;
  }
  // Wellbeing page (3.76): three rows with an icon, like You; each opens in place
  ML.addStrings({
    fr: { wr_sc_phone: 'Hier {m} sur le téléphone', wr_sc_web: 'Aujourd’hui {m} dans le navigateur', wr_sc_none: 'Navigateur, téléphone, blocage', wr_if: '{n} règles', wr_if1: '1 règle', wr_if0: 'Aucune règle pour l’instant', wr_ur: 'Trois minutes sans agir' },
    en: { wr_sc_phone: 'Yesterday {m} on the phone', wr_sc_web: 'Today {m} in the browser', wr_sc_none: 'Browser, phone, blocking', wr_if: '{n} rules', wr_if1: '1 rule', wr_if0: 'No rule yet', wr_ur: 'Three minutes without acting' },
  });
  const ICO = {
    screen: '<rect x="7" y="3" width="10" height="18" rx="2.2"/><path d="M11 18h2"/>',
    plan: '<path d="M5 6h9M5 12h6M5 18h9M15 11l2 2 4-4.5"/>',
    wave: '<path d="M3 14c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 3 4"/>',
  };
  const wRow = (k, ico, title, sub, body) => `<details class="wb-row" data-wbrow="${k}"><summary><span class="wb-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${ICO[ico]}</svg></span><span class="wb-tx"><b>${esc(title)}</b><small>${esc(sub)}</small></span><svg class="yh-car" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></summary><div class="wb-body">${body}</div></details>`;
  function render() {
    const el = $('screen'); if (!el || S.tab !== 'health') return; // Screen time sits under Health on the Wellbeing page (3.66)
    const phone = P.get('screen', {})[yKey()], day = sites[today()], web = day && day.all ? Object.values(day.all).reduce((a, b) => a + b, 0) : 0;
    const scSub = phone != null ? t('wr_sc_phone', { m: fmtMins(phone) }) : trackOn && web >= 60 ? t('wr_sc_web', { m: fmtMins(Math.round(web / 60)) }) : t('wr_sc_none');
    const nIf = P.get('ifthen', []).length;
    const html = `<div class="wb-rows">${wRow('screen', 'screen', t('tab_screen'), scSub, webCard() + phoneCard() + blockCard())}${wRow('if', 'plan', t('if_h'), nIf ? (nIf === 1 ? t('wr_if1') : t('wr_if', { n: nIf })) : t('wr_if0'), ifCard())}${wRow('urge', 'wave', t('ur_h'), t('wr_ur'), urgeCard())}</div>`;
    if (el.dataset.h === html) return;
    const open = [...el.querySelectorAll('details[open][data-wbrow]')].map(d => d.dataset.wbrow);
    ML.keepInputs(el, () => { el.innerHTML = html; el.dataset.h = html; open.forEach(k => { const d = el.querySelector(`[data-wbrow="${k}"]`); if (d) d.open = true; }); });
    const c = el.querySelector('#sc-clear');
    if (c) ML.armedButton(c, 'sc_web_clear', () => { chrome.storage.local.remove(['mli-sites', 'mli-urges']); P.del('cats'); sites = {}; extUrges = []; render(); });
  }
  const box = $('screen');
  box.addEventListener('click', async e => {
    const q = a => e.target.closest('[data-' + a + ']');
    if (q('track')) return q('track').dataset.track === 'on' ? askTrack() : stopTrack();
    if (q('urge')) return openUrge();
    if (q('grant')) { try { canPause = await chrome.permissions.request({ origins: ['*://*/*'] }); } catch (err) {} push(); return render(); }
    if (q('cat')) { const h = q('cat').dataset.cat, cats = P.get('cats', {}), order = ['work', 'neutral', 'dist']; cats[h] = order[(order.indexOf(catOf(h)) + 1) % 3]; P.set('cats', cats); return render(); }
    if (q('ifdel')) { const l = P.get('ifthen', []); l.splice(+q('ifdel').dataset.ifdel, 1); P.set('ifthen', l); push(); return render(); }
    if (q('copy')) { const b = q('copy'); try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = t('sc_copied'); } catch (err) { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } }
  });
  box.addEventListener('change', e => {
    const id = e.target.id;
    if (id === 'sc-phone') { const log = P.get('screen', {}), v = Math.max(0, Math.min(1440, Math.round(+e.target.value))); if (e.target.value === '') delete log[yKey()]; else log[yKey()] = v; P.set('screen', log); toast(t('sc_saved')); return render(); }
    if (id === 'sc-block') { S.block.on = e.target.checked; save(); return push(); }
    if (id === 'sc-domains') { S.block.domains = e.target.value.split(/[\s,]+/).map(d => d.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')).filter(Boolean); save(); return push(); }
    const m = id.match(/^sc-([mft])-(\w+)$/);
    if (m) { const c = S.blockSched[m[2]]; if (m[1] === 'm') c.m = e.target.value; else c[m[1] === 'f' ? 'from' : 'to'] = +e.target.value; save(); push(); render(); }
  });
  box.addEventListener('submit', e => {
    if (e.target.id !== 'if-add') return;
    e.preventDefault();
    const a = e.target.querySelector('#if-a').value.trim(), b = e.target.querySelector('#if-b').value.trim(); if (!a || !b) return;
    const l = P.get('ifthen', []); l.push({ a, b }); P.set('ifthen', l); push(); render();
  });

  /* ---------- Urge timer ---------- */
  let urgeT = 0;
  function openUrge() {
    clearInterval(urgeT);
    const end = Date.now() + 180000;
    ML.ySheet('urge', `<h2>${esc(t('ur_h'))}</h2><div class="y-wave" aria-hidden="true"></div><p class="y-clock" id="ur-clock" role="timer">3:00</p><p class="insight">${esc(t('ur_watch'))}</p><button type="button" class="small ghost" id="ur-stop">${esc(t('ur_stop'))}</button>`, r => {
      r.querySelector('#ur-stop').onclick = () => { clearInterval(urgeT); ML.closeOverlay('urge'); };
    });
    urgeT = setInterval(() => {
      const c = $('ur-clock'), left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      if ($('urge').hidden) return clearInterval(urgeT);
      if (c) c.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      if (left > 0) return;
      clearInterval(urgeT);
      ML.ySheet('urge', `<h2>${esc(t('ur_q'))}</h2><div class="y-btns"><button type="button" data-dropped="1">${esc(t('ur_yes'))}</button><button type="button" data-dropped="0">${esc(t('ur_no'))}</button></div>`, r => {
        r.addEventListener('click', e => { const b = e.target.closest('[data-dropped]'); if (!b) return; const l = P.get('urgeLog', []); l.push({ at: Date.now(), dropped: b.dataset.dropped === '1' }); P.set('urgeLog', l.slice(-500)); ML.closeOverlay('urge'); render(); });
      });
    }, 500);
  }
  ML.openUrge = openUrge;

  on('tab', n => { if (n === 'health') { pull(); render(); } });
  on('render', render); on('lang', () => { push(); render(); }); on('period', () => { push(); render(); }); on('timer', push);
  on('minute', () => { if (S.tab === 'health') pull(); });
  on('started', async () => { if (hasChrome) { await pull(); push(); } });
})();
