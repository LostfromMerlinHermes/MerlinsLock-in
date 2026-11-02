// The pause screen (3.62): a blocked site in the extension (background.js redirects here), or an iPhone Shortcuts automation
// on the web app (pause.html?site=instagram). A few seconds, a question and an easy way back. It runs alone, without the app.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const EXT = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id && chrome.storage);
  const FR = { h: 'Respire. Tu voulais faire quoi ?', task: 'Tu travailles sur : {x}', back: 'Retourner au travail', urge: 'Laisser passer l’envie, 3 minutes', cont: 'Continuer 5 minutes', wait: 'Continuer dans {n} s', ifs: 'Si', then: 'alors', phone: 'Tu peux ouvrir l’app depuis l’écran d’accueil. La pause reviendra à la prochaine ouverture.', done: 'Tu peux fermer cette page.' };
  const EN = { h: 'Breathe. What did you want to do?', task: 'You are working on: {x}', back: 'Back to work', urge: 'Let the urge pass, 3 minutes', cont: 'Continue for 5 minutes', wait: 'Continue in {n} s', ifs: 'If', then: 'then', phone: 'You can open the app from your home screen. The pause returns the next time you open it.', done: 'You can close this page.' };
  const site = (new URLSearchParams(location.search).get('site') || '').slice(0, 80).replace(/[^\w.-]/g, '');

  function log(back) {
    const item = { at: Date.now(), site, back };
    if (EXT) chrome.storage.local.get('mli-urges').then(r => chrome.storage.local.set({ 'mli-urges': [...(r['mli-urges'] || []), item].slice(-500) }));
    else try { localStorage.setItem('mli-urges', JSON.stringify([...(JSON.parse(localStorage.getItem('mli-urges')) || []), item].slice(-500))); } catch (e) {}
  }
  function leave(T) {
    if (EXT && chrome.tabs && chrome.tabs.getCurrent) return chrome.tabs.getCurrent(tab => { if (tab) chrome.tabs.remove(tab.id); });
    $('btns').hidden = true; $('after').hidden = false; $('after').textContent = T.done;
    location.href = './';
  }
  function start(cfg) {
    const lang = cfg.lang || ((navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en'), T = lang === 'fr' ? FR : EN;
    document.documentElement.lang = lang;
    $('site').textContent = site;
    $('title').textContent = T.h;
    $('back').textContent = T.back; $('urge').textContent = T.urge;
    if (cfg.title) { $('task').hidden = false; $('task').textContent = T.task.replace('{x}', cfg.title); }
    const rules = cfg.rules || [], name = site.split('.')[0].toLowerCase();
    const rule = rules.find(r => r.a.toLowerCase().includes(name)) || rules[0];
    if (rule) {
      const el = $('rule'); el.hidden = false; el.textContent = '';
      [[T.ifs, rule.a], [T.then, rule.b]].forEach(([k, v]) => { const s = document.createElement('small'); s.textContent = k + ' '; el.append(s, v + ' '); });
    }
    // Backing out is what works, so it is always one tap. Going on waits a few seconds.
    let left = 5;
    const cont = $('cont'), paint = () => { cont.textContent = left > 0 ? T.wait.replace('{n}', left) : T.cont; cont.disabled = left > 0; };
    paint();
    const wait = setInterval(() => { left--; paint(); if (left <= 0) clearInterval(wait); }, 1000);
    $('back').onclick = () => { log(true); leave(T); };
    cont.onclick = () => {
      log(false);
      if (EXT) { chrome.runtime.sendMessage({ type: 'guard-allow', domain: site, mins: 5 }, () => { location.href = 'https://' + site + '/'; }); return; }
      $('btns').hidden = true; $('after').hidden = false; $('after').textContent = T.phone;
    };
    $('urge').onclick = () => {
      $('urge').hidden = true; const end = Date.now() + 180000, c = $('clock'); c.hidden = false;
      const up = () => { const s = Math.max(0, Math.ceil((end - Date.now()) / 1000)); c.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); if (!s) clearInterval(iv); };
      const iv = setInterval(up, 500); up();
    };
  }
  if (EXT) chrome.storage.local.get('mli-guard').then(r => start(r['mli-guard'] || {})).catch(() => start({}));
  else start({});
})();
